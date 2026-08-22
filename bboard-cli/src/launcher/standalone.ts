// This file is part of midnightntwrk/example-bboard, adapted for Attesta.
// Copyright (C) Midnight Foundation / Attesta Contributors
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
 * Attesta standalone devnet launcher.
 *
 * This intentionally does NOT import `../index.ts` (the original bulletin-board
 * interactive menu). That file still imports symbols from the old `bboard` template
 * (`BBoardAPI`, `BBoardDerivedState`, `bboardPrivateStateKey`, `BBoardProviders`,
 * `DeployedBBoardContract`, `BBoardPrivateState`, ...) that no longer exist in
 * `api/src/index.ts` / `contract/src/witnesses.ts` after the contract and API were
 * renamed to Attesta — importing it here would break `npm run standalone` the same way
 * it breaks the CLI menu itself (TS2305/TS2307 at module resolution time, before a
 * single line of the menu ever runs).
 *
 * We also don't port the interactive post/takeDown menu to Attesta's vocabulary
 * (registerAttestation/revokeAttestation/proveLive) here — the `bboard-ui` web app
 * already covers that role for judges/testers, and duplicating it in the CLI is
 * unnecessary UX work. What this script needs to do is narrower and purely
 * infrastructural: bring up the local devnet (node + indexer + proof server, via
 * testcontainers/Docker Compose under `bboard-cli/compose.yml`, exactly like the
 * original bboard CLI did under the hood), print the resulting endpoints clearly, and
 * then stay alive. Unlike a throwaway test script that starts and stops the environment
 * itself, a person testing the web app manually needs the devnet to keep running while
 * they drive `bboard-ui` from a separate terminal/browser tab. Press Ctrl+C to shut
 * everything down (containers are torn down via the testcontainers Ryuk reaper).
 */

import { createLogger } from '../logger-utils.js';
import { StandaloneConfig } from '../config.js';

const config = new StandaloneConfig();
const logger = await createLogger(config.logDir);
const testEnvironment = config.getEnvironment(logger);

let shuttingDown = false;

const shutdown = async (signal: string): Promise<void> => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  logger.info(`Received ${signal}, shutting down the local devnet...`);
  try {
    await testEnvironment.shutdown();
    logger.info('Devnet shut down cleanly. Containers removed.');
  } catch (e) {
    logger.error(`Error while shutting down the devnet: ${e instanceof Error ? e.message : String(e)}`);
  } finally {
    process.exit(0);
  }
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

logger.info('Starting Attesta local devnet (node + indexer + proof server)... this can take');
logger.info('~90s on first run while Docker pulls images, faster afterwards.');

const envConfiguration = await testEnvironment.start();

logger.info('Devnet is up. Endpoints:');
logger.info(`  Network ID:      ${envConfiguration.networkId}`);
logger.info(`  Node RPC:        ${envConfiguration.node}`);
logger.info(`  Node WS:         ${envConfiguration.nodeWS}`);
logger.info(`  Indexer GraphQL: ${envConfiguration.indexer}`);
logger.info(`  Indexer WS:      ${envConfiguration.indexerWS}`);
logger.info(`  Proof server:    ${envConfiguration.proofServer}`);
if (envConfiguration.faucet) {
  logger.info(`  Faucet:          ${envConfiguration.faucet}`);
}
logger.info('');
logger.info('Devnet is running and will stay up until you stop this process.');
logger.info('In another terminal, run: cd bboard-ui && npm run dev');
logger.info('To fund a Lace wallet on the "Undeployed" network, import the genesis seed');
logger.info('documented in README.md ("Testing manually with Lace on the local devnet").');
logger.info('Press Ctrl+C to stop the devnet and remove the containers.');

// Keep the process alive until interrupted. A bare `await new Promise(() => {})` is NOT
// enough here: under this project's `--experimental-specifier-resolution=node --loader
// ts-node/esm` launch flags, Node detects the pending top-level await has no other
// active handle backing it (no timer, no open socket) and force-exits with "Detected
// unsettled top-level await" (exit code 13) almost immediately — confirmed by running
// this script for real, it printed the endpoints above and then died right away. An
// active timer gives the event loop real work to keep it alive; the actual exit path is
// still the SIGINT/SIGTERM handlers above, which call testEnvironment.shutdown() and
// process.exit(0) directly. There is no interactive menu to run — this script's job is
// done once the endpoints above are printed.
setInterval(() => {}, 1 << 30);
