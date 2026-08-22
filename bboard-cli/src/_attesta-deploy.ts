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

/*
 * THROWAWAY SCRIPT (deploy-engineer, public-deploy task, 22/08) — not part of the
 * product, deleted after use. Same disposable-script pattern already validated this
 * session (see feedback.md: `_devnet-check.mjs`, `_attesta-e2e-check.ts`,
 * `_attesta-d27-e2e-check.ts`, `_fund-human-wallet.ts` — all deleted after use, never
 * committed).
 *
 * Deploys the Attesta contract to a public Midnight test network (`preview` or
 * `preprod`), reusing `MidnightWalletProvider` + `AttestaAPI.deploy` exactly like the
 * rest of this codebase already does (`bboard-cli/src/index.ts`'s `run()`,
 * `midnight-wallet-provider.ts`, `wallet-utils.ts`, `generate-dust.ts` — all real
 * product code, unmodified here).
 *
 * Deliberately does NOT use `PreviewRemoteConfig`/`PreprodRemoteConfig` from
 * `config.ts` (which spin up a *local* proof server container via testcontainers/Docker
 * for the CLI's own use). This script instead points straight at the public,
 * Midnight-Foundation-operated proof servers for these networks
 * (`proof-server.preview.midnight.network` / `proof-server.preprod.midnight.network`),
 * confirmed reachable and functional by curl before this script was written (see
 * feedback.md, this task's entry) — partly to avoid depending on Docker for a
 * deploy-only script, partly because it's the strongest possible end-to-end proof that
 * the public proof server the deployed front will eventually rely on (via Lace) can
 * really produce a valid, on-chain-accepted proof, not just answer 200 on a GET.
 *
 * Two modes, driven by argv:
 *
 *   init <preview|preprod>
 *     Generates a fresh deploy wallet for the target network, persists its seed to a
 *     gitignored state file (`.midnight-state.<network>.json` — this exact filename
 *     pattern is already reserved in `.gitignore`, see the Bloco 0 comment there), and
 *     prints its unshielded address. A human must fund that address with NIGHT via the
 *     network's faucet (browser + Cloudflare Turnstile captcha — confirmed
 *     non-automatable, see feedback.md) before `deploy` mode can do anything. Safe to
 *     re-run: if a state file already exists for that network, it re-prints the same
 *     address instead of generating a new wallet.
 *
 *   deploy <preview|preprod>
 *     Loads the persisted wallet, blocks waiting for NIGHT to arrive (only makes sense
 *     to run after the human confirms they requested funds from the faucet),
 *     auto-generates DUST from it — fully automatable here because *this* script holds
 *     the wallet's own signing key, unlike the human's real Lace wallet in the earlier
 *     `_fund-human-wallet.ts` saga — deploys the Attesta contract, and prints the
 *     resulting contract address.
 *
 * Usage (from `bboard-cli/`):
 *   node --experimental-specifier-resolution=node --loader ts-node/esm src/_attesta-deploy.ts init preprod
 *   # ... human funds the printed address via the faucet URL this prints ...
 *   node --experimental-specifier-resolution=node --loader ts-node/esm src/_attesta-deploy.ts deploy preprod
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { WebSocket } from 'ws';
import { type EnvironmentConfiguration } from '@midnight-ntwrk/testkit-js';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { getNetworkId, setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { unshieldedToken } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import { UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';
import { MidnightWalletProvider } from './midnight-wallet-provider.js';
import { createLogger } from './logger-utils.js';
import { getInitialUnshieldedState, syncWallet, waitForUnshieldedFunds } from './wallet-utils.js';
import { generateDust } from './generate-dust.js';
import { randomBytes } from '../../api/src/utils/index.js';
import { AttestaAPI, type AttestaProviders, type AttestaCircuitKeys, type PrivateStateId } from '../../api/src/index';
import { createAttestaPrivateState } from '../../contract/src/witnesses.js';

// @ts-expect-error: needed for apollo/graphql-ws under this node runtime — same as bboard-cli/src/index.ts.
globalThis.WebSocket = WebSocket;

type NetworkArg = 'preview' | 'preprod';

// Confirmed by curl against these exact URLs before writing this script (see
// feedback.md): indexer/node answer real GraphQL/JSON-RPC (not just a 200), the public
// proof server answers 200 on GET. See feedback.md for the full transcript.
const PUBLIC_ENV: Record<NetworkArg, EnvironmentConfiguration> = {
  preview: {
    walletNetworkId: 'preview',
    networkId: 'preview',
    indexer: 'https://indexer.preview.midnight.network/api/v4/graphql',
    indexerWS: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
    node: 'https://rpc.preview.midnight.network',
    nodeWS: 'wss://rpc.preview.midnight.network',
    proofServer: 'https://proof-server.preview.midnight.network',
    faucet: 'https://faucet.preview.midnight.network/api/drips',
  },
  preprod: {
    walletNetworkId: 'preprod',
    networkId: 'preprod',
    indexer: 'https://indexer.preprod.midnight.network/api/v4/graphql',
    indexerWS: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
    node: 'https://rpc.preprod.midnight.network',
    nodeWS: 'wss://rpc.preprod.midnight.network',
    proofServer: 'https://proof-server.preprod.midnight.network',
    faucet: 'https://faucet.preprod.midnight.network/api/drips',
  },
};

const stateFilePath = (network: NetworkArg): string => path.resolve(process.cwd(), `.midnight-state.${network}.json`);

interface PersistedState {
  readonly seed: string;
  readonly network: NetworkArg;
  readonly createdAt: string;
}

async function loadState(network: NetworkArg): Promise<PersistedState | undefined> {
  try {
    const raw = await fs.readFile(stateFilePath(network), 'utf-8');
    return JSON.parse(raw) as PersistedState;
  } catch {
    return undefined;
  }
}

async function printAddress(walletProvider: MidnightWalletProvider): Promise<string> {
  const unshieldedState = await getInitialUnshieldedState(walletProvider.logger, walletProvider.wallet.unshielded);
  return UnshieldedAddress.codec.encode(getNetworkId(), unshieldedState.address).toString();
}

async function runInit(network: NetworkArg): Promise<void> {
  const env = PUBLIC_ENV[network];
  const logger = await createLogger(path.resolve(process.cwd(), 'logs', `deploy-${network}-init-${Date.now()}.log`));
  setNetworkId(network);

  const existing = await loadState(network);
  const seed = existing?.seed ?? toHex(randomBytes(32));

  const walletProvider = await MidnightWalletProvider.build(logger, env, seed);
  await walletProvider.start();
  try {
    const address = await printAddress(walletProvider);
    if (!existing) {
      await fs.writeFile(
        stateFilePath(network),
        JSON.stringify({ seed, network, createdAt: new Date().toISOString() } satisfies PersistedState, null, 2),
      );
      logger.info(`New deploy wallet created for ${network}.`);
    } else {
      logger.info(`Reusing existing deploy wallet for ${network} (created ${existing.createdAt}).`);
    }
    logger.info(`Unshielded address (fund this with NIGHT via the faucet): ${address}`);
    logger.info(`Faucet URL (browser required, captcha-gated — confirmed non-automatable): ${env.faucet}`);
    logger.info(`Seed persisted to ${stateFilePath(network)} (gitignored via .midnight-state.*.json — never commit).`);
  } finally {
    await walletProvider.stop();
  }
}

async function runDeploy(network: NetworkArg): Promise<void> {
  const env = PUBLIC_ENV[network];
  const logger = await createLogger(path.resolve(process.cwd(), 'logs', `deploy-${network}-deploy-${Date.now()}.log`));
  setNetworkId(network);

  const state = await loadState(network);
  if (!state) {
    logger.error(`No deploy wallet found for ${network}. Run 'init ${network}' first.`);
    process.exitCode = 1;
    return;
  }

  const walletProvider = await MidnightWalletProvider.build(logger, env, state.seed);
  await walletProvider.start();
  try {
    logger.info('Waiting for NIGHT to be visible in the wallet (this blocks until funded)...');
    const unshieldedState = await waitForUnshieldedFunds(logger, walletProvider.wallet, env, unshieldedToken());
    const nightBalance = unshieldedState.balances[unshieldedToken().raw];
    if (nightBalance === undefined || nightBalance === 0n) {
      logger.error('No NIGHT received. Fund the address printed by `init` mode via the faucet, then re-run.');
      process.exitCode = 1;
      return;
    }
    logger.info(`NIGHT balance: ${nightBalance}`);

    const dustTxId = await generateDust(logger, state.seed, unshieldedState, walletProvider.wallet);
    if (dustTxId) {
      logger.info(`DUST generation transaction: ${dustTxId}`);
      await syncWallet(logger, walletProvider.wallet);
    } else {
      logger.info('No new UTXOs needed DUST registration (already registered, or none found) — proceeding.');
    }

    const zkConfigProvider = new NodeZkConfigProvider<AttestaCircuitKeys>(
      path.resolve(process.cwd(), '..', 'contract', 'src', 'managed', 'attesta'),
    );
    const providers: AttestaProviders = {
      privateStateProvider: levelPrivateStateProvider<PrivateStateId, ReturnType<typeof createAttestaPrivateState>>({
        privateStateStoreName: `attesta-deploy-${network}`,
        signingKeyStoreName: `attesta-deploy-${network}-signing-keys`,
        privateStoragePasswordProvider: () => 'Attesta-Deploy-2026!',
        accountId: state.seed,
      }),
      publicDataProvider: indexerPublicDataProvider(env.indexer, env.indexerWS),
      zkConfigProvider,
      proofProvider: httpClientProofProvider(env.proofServer, zkConfigProvider),
      walletProvider,
      midnightProvider: walletProvider,
    };

    const issuerSecret = randomBytes(32);
    logger.info(
      `Deploying the Attesta contract to ${network} — this proves a real proof against the public proof server (${env.proofServer})...`,
    );
    const api = await AttestaAPI.deploy(providers, issuerSecret, logger);
    logger.info(`Attesta contract deployed at: ${api.deployedContractAddress}`);
    // Printed on stdout (not just the log file) so it's easy to grab for feedback.md/README.
    console.log(`CONTRACT_ADDRESS(${network})=${api.deployedContractAddress}`);
  } finally {
    await walletProvider.stop();
  }
}

async function main(): Promise<void> {
  const mode = process.argv[2];
  const network = process.argv[3];
  if ((mode !== 'init' && mode !== 'deploy') || (network !== 'preview' && network !== 'preprod')) {
    console.error('Usage: _attesta-deploy.ts <init|deploy> <preview|preprod>');
    process.exitCode = 1;
    return;
  }
  if (mode === 'init') {
    await runInit(network);
  } else {
    await runDeploy(network);
  }
}

await main();
