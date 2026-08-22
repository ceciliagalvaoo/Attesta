// This file is part of Attesta.
// Copyright (C) 2026 The Attesta Contributors
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
  AttestaAPI,
  type AttestaCircuitKeys,
  type AttestaProviders,
  type DeployedAttestaAPI,
  utils,
} from '../../../api/src/index';
import { type ContractAddress, fromHex, toHex } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import {
  BehaviorSubject,
  catchError,
  concatMap,
  filter,
  firstValueFrom,
  interval,
  map,
  type Observable,
  take,
  tap,
  throwError,
  timeout,
} from 'rxjs';
import { pipe as fnPipe } from 'fp-ts/function';
import { type Logger } from 'pino';
import { ConnectedAPI, type InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import semver from 'semver';
import {
  Binding,
  FinalizedTransaction,
  Proof,
  SignatureEnabled,
  Transaction,
  TransactionId,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { inMemoryPrivateStateProvider } from '../in-memory-private-state-provider';
import { NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import type { UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';
import {
  createAttestaPrivateState,
  createVerifierPrivateState,
  type AttestaPrivateState,
} from '@midnight-ntwrk/bboard-contract';
import { describeError } from '../errors';

/**
 * D27 (`contexto/ESTADO.md`): which side of the demo a {@link BrowserAttestaManager}
 * plays. This is the axis that decides which private-state constructor a fresh
 * deploy/join starts from — `issuer` gets `createAttestaPrivateState` (an `issuerSecret`
 * plus, over time, full per-attestation records); `verifier` gets
 * `createVerifierPrivateState` (no `issuerSecret`, no records — populated only via
 * {@link DeployedAttestaAPI.importProofPacket}). It is unrelated to which Lace wallet
 * account happens to be connected — see `walletAddress` on {@link DeployedAttestaDeployment}
 * for that.
 */
export type AttestaRole = 'issuer' | 'verifier';

/** An in-progress Attesta contract deployment/join attempt. */
export interface InProgressAttestaDeployment {
  readonly status: 'in-progress';
}

/** A deployed (or joined) Attesta contract, ready to drive one role's panel. */
export interface DeployedAttestaDeployment {
  readonly status: 'deployed';
  readonly api: DeployedAttestaAPI;
  /**
   * The Bech32m shielded address of whichever Lace account was active when this
   * identity connected — rendered in the panel so a person testing with two different
   * Lace wallets (one for the issuer, one for the verifier) can visually confirm which
   * account is actually bound to which panel, instead of assuming.
   */
  readonly walletAddress: string;
}

/** A failed deployment/join attempt — always carries a human-readable `error`. */
export interface FailedAttestaDeployment {
  readonly status: 'failed';
  readonly error: Error;
}

export type AttestaDeployment = InProgressAttestaDeployment | DeployedAttestaDeployment | FailedAttestaDeployment;

/**
 * Provides access to one identity's (issuer's or verifier's) view of an Attesta
 * contract. D27: an issuer's and a verifier's {@link AttestaAPIProvider} are always two
 * separate instances — see `BrowserAttestaManager` — never the same one shared between
 * panels.
 */
export interface AttestaAPIProvider {
  /** The observable current deployment. Starts as `undefined` until `deploy`/`join` is called. */
  readonly deployment$: Observable<AttestaDeployment | undefined>;

  /**
   * Deploys a brand-new Attesta contract (fresh SIMULATED trust list, empty registry).
   * Issuer-only — a verifier-role manager fails closed with an explanatory error
   * instead of silently deploying anyway (a verifier joins an existing registry; it
   * never creates one).
   */
  readonly deploy: () => void;

  /** Joins an already-deployed Attesta contract at `contractAddress`, as this manager's role. */
  readonly join: (contractAddress: ContractAddress) => void;
}

/**
 * An {@link AttestaAPIProvider} that manages the connection to the Midnight Lace wallet
 * (via `@midnight-ntwrk/dapp-connector-api`) and to the indexer/proof-server, in a
 * browser setting.
 *
 * @remarks
 * D27: every instance owns its **own** `AttestaProviders` — its own
 * `inMemoryPrivateStateProvider()` (a fresh, empty map) and its own call to
 * `connectToWallet` — built lazily the first time `deploy`/`join` runs and cached only
 * within this instance (see `getProviders`). Two managers, one per role, never share
 * either. Because each manager connects independently, testing with two different Lace
 * accounts works naturally: connect the issuer manager while Lace's active account is
 * account A, then switch Lace's active account to B before connecting the verifier
 * manager — each manager's own `connectToWallet` call picks up whatever account is
 * active at the moment *it* runs.
 */
export class BrowserAttestaManager implements AttestaAPIProvider {
  readonly #deploymentSubject: BehaviorSubject<AttestaDeployment | undefined>;
  #initializedProviders: Promise<{ providers: AttestaProviders; walletAddress: string }> | undefined;

  constructor(
    private readonly role: AttestaRole,
    private readonly logger: Logger,
  ) {
    this.#deploymentSubject = new BehaviorSubject<AttestaDeployment | undefined>(undefined);
    this.deployment$ = this.#deploymentSubject;
  }

  /** @inheritdoc */
  readonly deployment$: Observable<AttestaDeployment | undefined>;

  /** @inheritdoc */
  deploy(): void {
    if (this.role !== 'issuer') {
      this.#deploymentSubject.next({
        status: 'failed',
        error: new Error(
          "Only the issuer creates a new demo registry — a verifier joins the issuer's contract address instead.",
        ),
      });
      return;
    }
    this.#deploymentSubject.next({ status: 'in-progress' });
    void this.#runDeploy();
  }

  /** @inheritdoc */
  join(contractAddress: ContractAddress): void {
    this.#deploymentSubject.next({ status: 'in-progress' });
    void this.#runJoin(contractAddress);
  }

  private getProviders(): Promise<{ providers: AttestaProviders; walletAddress: string }> {
    // Cached so every deploy/join call (and every later circuit call) *for this
    // instance* reuses the same connected wallet + configured providers, and so
    // concurrent calls on this instance synchronize on one connection attempt instead
    // of racing the wallet extension. A different `BrowserAttestaManager` instance
    // (the other role) has its own cache, its own private-state provider, and its own
    // wallet connection — see class doc.
    return this.#initializedProviders ?? (this.#initializedProviders = initializeProviders(this.logger));
  }

  async #runDeploy(): Promise<void> {
    try {
      const { providers, walletAddress } = await this.getProviders();
      const issuerSecret = utils.randomBytes(32);
      const api = await AttestaAPI.deploy(providers, issuerSecret, this.logger);
      this.#deploymentSubject.next({ status: 'deployed', api, walletAddress });
    } catch (error: unknown) {
      this.logger.error({ error }, 'Failed to deploy Attesta contract');
      this.#deploymentSubject.next({ status: 'failed', error: new Error(describeError(error)) });
    }
  }

  async #runJoin(contractAddress: ContractAddress): Promise<void> {
    try {
      const { providers, walletAddress } = await this.getProviders();
      const createInitialPrivateState = (): AttestaPrivateState =>
        this.role === 'issuer' ? createAttestaPrivateState(utils.randomBytes(32)) : createVerifierPrivateState();
      const api = await AttestaAPI.join(providers, contractAddress, createInitialPrivateState, this.logger);
      this.#deploymentSubject.next({ status: 'deployed', api, walletAddress });
    } catch (error: unknown) {
      this.logger.error({ error }, 'Failed to join Attesta contract');
      this.#deploymentSubject.next({ status: 'failed', error: new Error(describeError(error)) });
    }
  }
}

/** @internal */
const initializeProviders = async (logger: Logger): Promise<{ providers: AttestaProviders; walletAddress: string }> => {
  const networkId = import.meta.env.VITE_NETWORK_ID as NetworkId;
  const connectedAPI = await connectToWallet(logger, networkId);
  const zkConfigPath = window.location.origin;
  const keyMaterialProvider = new FetchZkConfigProvider<AttestaCircuitKeys>(zkConfigPath, fetch.bind(window));
  const config = await connectedAPI.getConfiguration();
  // A fresh, empty map every time this function runs — i.e. once per
  // `BrowserAttestaManager` instance (see `getProviders`'s caching). This is the crux
  // of the D27 separation: an issuer manager and a verifier manager never read or write
  // the same in-memory private state.
  const inMemoryAttestaPrivateStateProvider = inMemoryPrivateStateProvider<string, AttestaPrivateState>();
  const shieldedAddresses = await connectedAPI.getShieldedAddresses();
  return {
    walletAddress: shieldedAddresses.shieldedAddress,
    providers: {
      privateStateProvider: inMemoryAttestaPrivateStateProvider,
      zkConfigProvider: keyMaterialProvider,
      proofProvider: httpClientProofProvider(config.proverServerUri!, keyMaterialProvider),
      publicDataProvider: indexerPublicDataProvider(config.indexerUri, config.indexerWsUri),
      walletProvider: {
        getCoinPublicKey(): string {
          return shieldedAddresses.shieldedCoinPublicKey;
        },
        getEncryptionPublicKey(): string {
          return shieldedAddresses.shieldedEncryptionPublicKey;
        },
        balanceTx: async (tx: UnboundTransaction, ttl?: Date): Promise<FinalizedTransaction> => {
          try {
            logger.info({ tx, ttl }, 'Balancing transaction via wallet');
            const serializedTx = toHex(tx.serialize());
            const received = await connectedAPI.balanceUnsealedTransaction(serializedTx);
            return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
              'signature',
              'proof',
              'binding',
              fromHex(received.tx),
            );
          } catch (e) {
            logger.error({ error: e }, 'Error balancing transaction via wallet');
            throw new Error(describeError(e));
          }
        },
      },
      midnightProvider: {
        submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
          try {
            await connectedAPI.submitTransaction(toHex(tx.serialize()));
            const txIdentifiers = tx.identifiers();
            const txId = txIdentifiers[0];
            logger.info({ txIdentifiers }, 'Submitted transaction via wallet');
            return txId;
          } catch (e) {
            logger.error({ error: e }, 'Error submitting transaction via wallet');
            throw new Error(describeError(e));
          }
        },
      },
    },
  };
};

/** @internal */
const getFirstCompatibleWallet = (): InitialAPI | undefined => {
  if (!window.midnight) return undefined;
  return Object.values(window.midnight).find(
    (wallet): wallet is InitialAPI =>
      !!wallet &&
      typeof wallet === 'object' &&
      'apiVersion' in wallet &&
      semver.satisfies(wallet.apiVersion, COMPATIBLE_CONNECTOR_API_VERSION),
  );
};

const COMPATIBLE_CONNECTOR_API_VERSION = '4.x';

/**
 * How long to keep polling (every 100ms, via the `interval(100)` below) for a
 * compatible wallet connector API to show up on `window.midnight` before giving up.
 *
 * @remarks
 * Bug fix (`feedback.md`, 22/08 manual-test entry, point 4): wallet extensions like
 * Lace inject their provider asynchronously, sometime after the page itself has
 * finished loading — the content script needs a moment to run. The original value
 * here (1 second) was too tight for that on a fresh page load, and — see
 * {@link WALLET_CONNECT_TIMEOUT_MS} below for the more important half of this bug —
 * its budget wasn't even fully available for detection alone. 5 seconds of 100ms
 * polling is generous without leaving a real "extension not installed" case waiting
 * too long.
 */
const WALLET_DETECTION_TIMEOUT_MS = 5_000;

/**
 * How long to wait for `initialAPI.connect(networkId)` (plus the follow-up
 * `getConnectionStatus()` call) to resolve, once a compatible wallet connector API has
 * actually been found.
 *
 * @remarks
 * Bug fix (`feedback.md`, 22/08 manual-test entry, point 4): the human found that the
 * *first* connection attempt after a page load reliably failed with "The Midnight Lace
 * wallet did not respond", while retrying (no reload) succeeded in 1-2 tries. Reading
 * rxjs's own `timeout()` implementation
 * (`node_modules/rxjs/dist/cjs/internal/operators/timeout.js`) confirms the actual bug:
 * `timeout({first: N})`'s clock starts the moment *that operator* subscribes, and in a
 * synchronous `pipe()` like this one every operator subscribes at essentially the same
 * instant (before `interval(100)` even ticks once) — not "N ms after the previous
 * operator emitted". So the old code's two `timeout()` calls (`first: 1_000` for
 * detection, `first: 5_000` for connect) did not compose as "1s to detect, then a
 * *fresh* 5s to connect" the way reading them top-to-bottom suggests. They both
 * counted down from the same t=0: whatever time detection burned through (up to the
 * full 1s) came directly out of the budget the second `timeout()` had left for
 * `connect()` — starving the connect handshake precisely when a cold/just-loaded Lace
 * extension (background worker waking up, internal state restoring) needs the *most*
 * time to respond. A retry, with the extension already warm, comfortably finishes
 * inside the same shrunken budget — matching the reported "second click resolves it"
 * symptom exactly.
 *
 * The fix below anchors this timeout to a plain `setTimeout` created *inside* the
 * `concatMap` callback — i.e. only once `initialAPI` is actually in hand — so this
 * budget is never silently eaten by however long wallet detection took.
 */
const WALLET_CONNECT_TIMEOUT_MS = 10_000;

/**
 * Races `initialAPI.connect(networkId)` (plus the follow-up `getConnectionStatus()`)
 * against a fresh, independently-anchored timeout — see {@link WALLET_CONNECT_TIMEOUT_MS}.
 *
 * @internal
 */
const connectWithTimeout = async (initialAPI: InitialAPI, networkId: string, logger: Logger): Promise<ConnectedAPI> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      (async () => {
        const connectedAPI = await initialAPI.connect(networkId);
        const connectionStatus = await connectedAPI.getConnectionStatus();
        logger.info(connectionStatus, 'Wallet connector API enabled status');
        return connectedAPI;
      })(),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          logger.error('Wallet connector API has failed to respond');
          reject(new Error('The Midnight Lace wallet did not respond. Is the extension unlocked and enabled?'));
        }, WALLET_CONNECT_TIMEOUT_MS);
      }),
    ]);
  } catch (e) {
    throw e instanceof Error ? e : new Error(describeError(e));
  } finally {
    // Always clear the timer — on the success path too, so it doesn't sit around
    // firing (harmlessly, since nothing awaits it, but needlessly) up to
    // `WALLET_CONNECT_TIMEOUT_MS` after we've already resolved.
    if (timer !== undefined) clearTimeout(timer);
  }
};

/** @internal */
const connectToWallet = (logger: Logger, networkId: string): Promise<ConnectedAPI> => {
  return firstValueFrom(
    fnPipe(
      interval(100),
      map(() => getFirstCompatibleWallet()),
      tap((connectorAPI) => {
        logger.info(connectorAPI, 'Check for wallet connector API');
      }),
      filter((connectorAPI): connectorAPI is InitialAPI => !!connectorAPI),
      tap((connectorAPI) => {
        logger.info(connectorAPI, 'Compatible wallet connector API found. Connecting.');
      }),
      take(1),
      timeout({
        first: WALLET_DETECTION_TIMEOUT_MS,
        with: () =>
          throwError(() => {
            logger.error('Could not find wallet connector API');
            return new Error('Could not find the Midnight Lace wallet extension. Is it installed and enabled?');
          }),
      }),
      concatMap((initialAPI) => connectWithTimeout(initialAPI, networkId, logger)),
      catchError((error) => throwError(() => (error instanceof Error ? error : new Error(describeError(error))))),
    ),
  );
};
