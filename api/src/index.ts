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

/**
 * Provides types and utilities for working with the Attesta contract.
 *
 * @packageDocumentation
 */

import * as Attesta from '../../contract/src/managed/attesta/contract/index.js';

import { type ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { type Logger } from 'pino';
import {
  type AttestaDerivedState,
  type AttestaContract,
  type AttestaProviders,
  type DeployedAttestaContract,
  type Ledger,
  attestaPrivateStateKey,
  LivenessStatus,
} from './common-types.js';
import { CompiledAttestaContractContract } from '../../contract/src/index';
import * as utils from './utils/index.js';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { map, type Observable } from 'rxjs';
import {
  type AttestaPrivateState,
  type AttestationPrivateRecord,
  type ProofPacket,
  createAttestaPrivateState,
  withAttestationRecord,
  withCommitment,
  withImportedProofPacket,
} from '../../contract/src/witnesses.js';

/**
 * An API for a deployed Attesta contract.
 *
 * @remarks
 * Every method here maps 1:1 to one of the four Compact circuits
 * (`registerAttestation`, `revokeAttestation`, `proveLive`, `setTrustedIssuer`) — see
 * contract/src/attesta.compact — plus two D27 methods (`exportProofPacket`/
 * `importProofPacket`) that never touch the chain, only local private state.
 *
 * D27 (`contexto/ESTADO.md`): the issuer panel and the verifier panel each drive their
 * **own** `AttestaAPI` instance, with their **own** `AttestaProviders` (their own
 * private-state provider, their own wallet connection) — never a shared instance. An
 * issuer's private state holds `issuerSecret` and full per-attestation records
 * (including `revocationSecret`, needed to revoke); a verifier's private state
 * (`createVerifierPrivateState`, see `contract/src/witnesses.ts`) starts with none of
 * that and is populated only via `importProofPacket`, one `ref` at a time, from a
 * packet the issuer exported. `proveLive`'s read path
 * (`recordForProveLive`/`issuerIdWitness`/`nullifierHashWitness` in
 * `attesta.compact`) was changed specifically so this works without the verifier ever
 * holding `issuerSecret`/`revocationSecret` — see the compact-contract-engineer's
 * `feedback.md` entry ("recordForProveLive"/"D27") for the full cryptographic
 * reasoning. Who actually keeps the two `AttestaAPI` instances separate (two
 * `BrowserAttestaManager`s, one per role) is `bboard-ui`'s wiring — see
 * `bboard-ui/src/contexts/AttestaManager.ts`.
 */
export interface DeployedAttestaAPI {
  readonly deployedContractAddress: ContractAddress;

  /**
   * An observable stream of the public ledger state — safe to render anywhere, since it
   * is exactly what `attestations`/`revokedNullifiers`/`trustedIssuers` disclose on
   * chain, never witness/raw attestation data. Emits every time the indexer reports a
   * new confirmed contract state (e.g. after another party's `revokeAttestation` call),
   * which is what lets the verifier panel reflect a live revocation without a page
   * reload — see `utils.deriveLivenessStatus`.
   */
  readonly state$: Observable<AttestaDerivedState>;

  /** The pseudonymous public issuer id for the connected private state's issuer secret. */
  getIssuerId: () => Promise<Uint8Array>;

  /** A one-shot fetch of the current public ledger (see {@link state$} for the live version). */
  getLedgerSnapshot: () => Promise<Ledger>;

  /**
   * Seeds the private record for `ref` (issuer-side demo data — never sent anywhere but
   * the local witness store) and calls `registerAttestation`, returning the disclosed
   * commitment. Issuer-only: throws if this instance's private state has no
   * `issuerSecret` (a verifier identity, D27).
   */
  registerAttestation: (
    ref: Uint8Array,
    record: {
      readonly rawDataHash: Uint8Array;
      readonly validFrom: bigint;
      readonly validUntil: bigint;
      readonly revocationSecret: Uint8Array;
      readonly salt: Uint8Array;
    },
  ) => Promise<Uint8Array>;

  /** Marks the attestation referenced by `ref` revoked (publishes its nullifier). Issuer-only. */
  revokeAttestation: (ref: Uint8Array) => Promise<void>;

  /**
   * Requests a fresh, on-chain, ZK-verified proof of liveness for the attestation
   * referenced by `ref`. Returns the disclosed `LivenessStatus` and the issuer's public
   * id — never the raw attestation data, which never leaves the witness side. Works for
   * an issuer's own record, or for a verifier's record populated via
   * {@link importProofPacket} (D27) — the underlying circuit no longer cares which.
   */
  proveLive: (ref: Uint8Array) => Promise<{ status: LivenessStatus; issuerId: Uint8Array }>;

  /** SIMULATED TRUST LIST admin — see attesta.compact, `setTrustedIssuer`. */
  setTrustedIssuer: (issuerId: Uint8Array, trusted: boolean) => Promise<void>;

  /**
   * D27 — issuer side. Exports the exact, minimal `ProofPacket` a verifier needs to run
   * `proveLive` on its own, indefinitely: `rawDataHash`, `validFrom`, `validUntil`,
   * `issuerId`, `nullifierHash`, `salt`, and the (already public) `commitment`. Never
   * `issuerSecret`/`revocationSecret`. Throws with a precise message naming which
   * field is missing if `ref` was never registered by this identity (or registration
   * didn't fully complete).
   */
  exportProofPacket: (ref: Uint8Array) => Promise<ProofPacket>;

  /**
   * D27 — verifier side. Stores an imported `ProofPacket` under `ref` in this
   * instance's own private state (see `withImportedProofPacket`,
   * `contract/src/witnesses.ts`) — never reads or falls back to another identity's
   * records. After this, {@link proveLive} works for `ref` without the issuer being
   * involved again.
   */
  importProofPacket: (ref: Uint8Array, packet: ProofPacket) => Promise<void>;
}

/**
 * Provides an implementation of {@link DeployedAttestaAPI} by adapting a deployed
 * Attesta contract.
 */
export class AttestaAPI implements DeployedAttestaAPI {
  /** @internal */
  private constructor(
    public readonly deployedContract: DeployedAttestaContract,
    private readonly providers: AttestaProviders,
    private readonly logger?: Logger,
  ) {
    this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
    providers.privateStateProvider.setContractAddress(this.deployedContractAddress);
    this.state$ = providers.publicDataProvider
      .contractStateObservable(this.deployedContractAddress, { type: 'latest' })
      .pipe(map((contractState) => ({ ledger: Attesta.ledger(contractState.data) })));
  }

  /** Gets the address of the current deployed contract. */
  readonly deployedContractAddress: ContractAddress;

  /** @inheritdoc */
  readonly state$: Observable<AttestaDerivedState>;

  /** @inheritdoc */
  async getIssuerId(): Promise<Uint8Array> {
    const privateState = await this.requirePrivateState();
    if (!privateState.issuerSecret) {
      throw new Error(
        'getIssuerId: this identity has no issuerSecret (it is a verifier-only private ' +
          'state, D27) — issuer id only exists for an issuer identity.',
      );
    }
    return utils.deriveIssuerId(privateState.issuerSecret);
  }

  /** @inheritdoc */
  async getLedgerSnapshot(): Promise<Ledger> {
    const contractState = await this.providers.publicDataProvider.queryContractState(this.deployedContractAddress);
    if (contractState === null) {
      throw new Error(`No contract state found at ${this.deployedContractAddress}`);
    }
    return Attesta.ledger(contractState.data);
  }

  /** @inheritdoc */
  async registerAttestation(
    ref: Uint8Array,
    record: {
      readonly rawDataHash: Uint8Array;
      readonly validFrom: bigint;
      readonly validUntil: bigint;
      readonly revocationSecret: Uint8Array;
      readonly salt: Uint8Array;
    },
  ): Promise<Uint8Array> {
    this.logger?.info({ registerAttestation: { ref: hex(ref) } });

    const privateState = await this.requirePrivateState();
    if (!privateState.issuerSecret) {
      throw new Error(
        'registerAttestation: this identity has no issuerSecret (it is a verifier-only ' +
          'private state, D27) — only an issuer registers attestations.',
      );
    }

    // proveLive's D27 read path (recordForProveLive) requires issuerId/nullifierHash as
    // plain witness fields for *any* caller, issuer included — not only a verifier that
    // imported a packet. Computed here the same way the circuit itself derives them
    // (persistentHash(issuerSecret)/persistentHash(revocationSecret)), so this issuer's
    // own copy of the record can also drive proveLive without a separate step, and so
    // exportProofPacket has something to export.
    const enrichedRecord: AttestationPrivateRecord = {
      ...record,
      issuerId: utils.deriveIssuerId(privateState.issuerSecret),
      nullifierHash: utils.deriveNullifierHash(record.revocationSecret),
    };

    await this.updatePrivateState((current) => withAttestationRecord(current, ref, enrichedRecord));

    const txData = await this.deployedContract.callTx.registerAttestation(ref);
    const commitment = txData.private.result;

    await this.updatePrivateState((current) => withCommitment(current, ref, commitment));

    this.logger?.trace({
      transactionAdded: {
        circuit: 'registerAttestation',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });

    return commitment;
  }

  /** @inheritdoc */
  async exportProofPacket(ref: Uint8Array): Promise<ProofPacket> {
    const privateState = await this.requirePrivateState();
    const record = privateState.records[hex(ref)];
    if (!record) {
      throw new Error(`exportProofPacket: no local record for ref ${hex(ref)} — register this attestation first.`);
    }
    const missing: string[] = [];
    if (!record.commitment) missing.push('commitment (registerAttestation must have completed for this ref)');
    if (!record.issuerId) missing.push('issuerId');
    if (!record.nullifierHash) missing.push('nullifierHash');
    if (missing.length > 0) {
      throw new Error(`exportProofPacket: ref ${hex(ref)} is missing: ${missing.join(', ')}.`);
    }

    this.logger?.info({ exportProofPacket: { ref: hex(ref) } });

    return {
      rawDataHash: record.rawDataHash,
      validFrom: record.validFrom,
      validUntil: record.validUntil,
      issuerId: record.issuerId as Uint8Array,
      nullifierHash: record.nullifierHash as Uint8Array,
      salt: record.salt,
      commitment: record.commitment as Uint8Array,
    };
  }

  /** @inheritdoc */
  async importProofPacket(ref: Uint8Array, packet: ProofPacket): Promise<void> {
    this.logger?.info({ importProofPacket: { ref: hex(ref) } });
    await this.updatePrivateState((privateState) => withImportedProofPacket(privateState, ref, packet));
  }

  /** @inheritdoc */
  async revokeAttestation(ref: Uint8Array): Promise<void> {
    this.logger?.info({ revokeAttestation: { ref: hex(ref) } });

    const txData = await this.deployedContract.callTx.revokeAttestation(ref);

    this.logger?.trace({
      transactionAdded: {
        circuit: 'revokeAttestation',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  /** @inheritdoc */
  async proveLive(ref: Uint8Array): Promise<{ status: LivenessStatus; issuerId: Uint8Array }> {
    this.logger?.info({ proveLive: { ref: hex(ref) } });

    const txData = await this.deployedContract.callTx.proveLive(ref);
    const [status, issuerId] = txData.private.result;

    this.logger?.trace({
      transactionAdded: {
        circuit: 'proveLive',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
        status: LivenessStatus[status],
      },
    });

    return { status, issuerId };
  }

  /** @inheritdoc */
  async setTrustedIssuer(issuerId: Uint8Array, trusted: boolean): Promise<void> {
    this.logger?.info({ setTrustedIssuer: { issuerId: hex(issuerId), trusted } });

    const txData = await this.deployedContract.callTx.setTrustedIssuer(issuerId, trusted);

    this.logger?.trace({
      transactionAdded: {
        circuit: 'setTrustedIssuer',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  private async requirePrivateState(): Promise<AttestaPrivateState> {
    const privateState = await this.providers.privateStateProvider.get(attestaPrivateStateKey);
    if (privateState === null) {
      throw new Error('Attesta private state has not been initialized for this contract.');
    }
    return privateState;
  }

  private async updatePrivateState(fn: (privateState: AttestaPrivateState) => AttestaPrivateState): Promise<void> {
    const privateState = await this.requirePrivateState();
    await this.providers.privateStateProvider.set(attestaPrivateStateKey, fn(privateState));
  }

  /**
   * Deploys a new Attesta contract to the network.
   *
   * @param providers The Attesta providers.
   * @param issuerSecret The demo issuer's secret (see attesta.compact, `witness
   * issuerSecret`) — generated locally by the caller (e.g. `utils.randomBytes(32)`) and
   * never disclosed by the contract itself.
   * @param logger An optional 'pino' logger to use for logging.
   */
  static async deploy(providers: AttestaProviders, issuerSecret: Uint8Array, logger?: Logger): Promise<AttestaAPI> {
    logger?.info('deployContract');

    const deployedAttestaContract = await deployContract(providers, {
      compiledContract: CompiledAttestaContractContract,
      privateStateId: attestaPrivateStateKey,
      initialPrivateState: createAttestaPrivateState(issuerSecret),
    });

    logger?.trace({
      contractDeployed: {
        finalizedDeployTxData: deployedAttestaContract.deployTxData.public,
      },
    });

    return new AttestaAPI(deployedAttestaContract, providers, logger);
  }

  /**
   * Finds an already deployed Attesta contract on the network, and joins it.
   *
   * @param providers The Attesta providers — **must** be this identity's own providers
   * (its own private-state provider in particular, D27), never shared with another
   * `AttestaAPI` instance playing a different role against the same contract address.
   * @param contractAddress The contract address of the deployed Attesta contract to
   * search for and join.
   * @param createInitialPrivateState Builds the private state to start from if none
   * already exists locally for this contract address (fresh browser session) — e.g.
   * `() => createAttestaPrivateState(utils.randomBytes(32))` for an issuer identity, or
   * `createVerifierPrivateState` for a verifier identity (D27) that must start with no
   * `issuerSecret` and no records at all.
   * @param logger An optional 'pino' logger to use for logging.
   */
  static async join(
    providers: AttestaProviders,
    contractAddress: ContractAddress,
    createInitialPrivateState: () => AttestaPrivateState,
    logger?: Logger,
  ): Promise<AttestaAPI> {
    logger?.info({ joinContract: { contractAddress } });

    const deployedAttestaContract = await findDeployedContract<AttestaContract>(providers, {
      contractAddress,
      compiledContract: CompiledAttestaContractContract,
      privateStateId: attestaPrivateStateKey,
      initialPrivateState: await AttestaAPI.getPrivateState(providers, contractAddress, createInitialPrivateState),
    });

    logger?.trace({
      contractJoined: {
        finalizedDeployTxData: deployedAttestaContract.deployTxData.public,
      },
    });

    return new AttestaAPI(deployedAttestaContract, providers, logger);
  }

  private static async getPrivateState(
    providers: AttestaProviders,
    contractAddress: ContractAddress,
    createInitialPrivateState: () => AttestaPrivateState,
  ): Promise<AttestaPrivateState> {
    providers.privateStateProvider.setContractAddress(contractAddress);
    const existingPrivateState = await providers.privateStateProvider.get(attestaPrivateStateKey);
    return existingPrivateState ?? createInitialPrivateState();
  }
}

const hex = (bytes: Uint8Array): string => Buffer.from(bytes).toString('hex');

/**
 * A namespace that represents the exports from the `'utils'` sub-package.
 *
 * @public
 */
export * as utils from './utils/index.js';
export type { LivenessTrackingBundle } from './utils/index.js';

export * from './common-types.js';
