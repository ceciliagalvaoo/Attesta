// This file is part of midnightntwrk/example-bboard.
// Copyright (C) Midnight Foundation
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

import path from 'node:path';
import {
  EnvironmentConfiguration,
  getTestEnvironment,
  RemoteTestEnvironment,
  TestEnvironment,
} from '@midnight-ntwrk/testkit-js';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { Logger } from 'pino';

export interface Config {
  readonly privateStateStoreName: string;
  readonly logDir: string;
  readonly zkConfigPath: string;
  getEnvironment(logger: Logger): TestEnvironment;
  readonly generateDust: boolean;
}

export const currentDir = path.resolve(new URL(import.meta.url).pathname, '..');

export class StandaloneConfig implements Config {
  getEnvironment(logger: Logger): TestEnvironment {
    return getTestEnvironment(logger) as TestEnvironment;
  }
  privateStateStoreName = 'attesta-private-state';
  logDir = path.resolve(currentDir, '..', 'logs', 'standalone', `${new Date().toISOString()}.log`);
  // Bug fixed by deploy-engineer (public-deploy task, 22/08): this pointed at
  // `managed/bboard`, a stale path left over from before the contract was renamed to
  // Attesta (`compact-contract-engineer`, Bloco 1). Nothing exercised this field until
  // now — `standalone.ts` never builds a wallet/zkConfigProvider (see its own header
  // comment) — so the bug was latent, not previously caught.
  zkConfigPath = path.resolve(currentDir, '..', '..', 'contract', 'src', 'managed', 'attesta');
  generateDust = false;
}

// NOTE (deploy-engineer, public-deploy task, 22/08): `src/launcher/preview.ts` and
// `preprod.ts`, the only callers of `PreviewRemoteConfig`/`PreprodRemoteConfig` below,
// were deleted by the coordinator the same day (they only existed to feed the broken
// `bboard-cli/src/index.ts` bulletin-board menu, itself deleted in the same pass — see
// feedback.md). These two classes are currently unused/uncalled from anywhere in this
// workspace — kept because their `getEnvironmentConfiguration()` (real preview/preprod
// endpoints, confirmed working — see feedback.md) and health-check plumbing
// (`RemoteTestEnvironment`) are still useful reference/reusable pieces if a CLI-driven
// public-network flow is wanted later, and removing working, tested code that costs
// nothing to keep felt like overreach for this task. Deploying the Attesta contract to
// a public network in this task instead uses `bboard-cli/src/_attesta-deploy.ts` (a
// disposable script, see its own header) with its own inlined endpoint config, not
// these classes — see feedback.md for why (avoids spinning up a local Docker proof
// server just to deploy, when the public one is already confirmed to work).
export class PreviewRemoteConfig implements Config {
  getEnvironment(logger: Logger): TestEnvironment {
    setNetworkId('preview');
    return new PreviewTestEnvironment(logger);
  }
  privateStateStoreName = 'attesta-private-state';
  logDir = path.resolve(currentDir, '..', 'logs', 'preview-remote', `${new Date().toISOString()}.log`);
  zkConfigPath = path.resolve(currentDir, '..', '..', 'contract', 'src', 'managed', 'attesta');
  generateDust = true;
}

export class PreprodRemoteConfig implements Config {
  getEnvironment(logger: Logger): TestEnvironment {
    setNetworkId('preprod');
    return new PreprodTestEnvironment(logger);
  }
  privateStateStoreName = 'attesta-private-state';
  logDir = path.resolve(currentDir, '..', 'logs', 'preprod-remote', `${new Date().toISOString()}.log`);
  zkConfigPath = path.resolve(currentDir, '..', '..', 'contract', 'src', 'managed', 'attesta');
  generateDust = true;
}

export class PreviewTestEnvironment extends RemoteTestEnvironment {
  constructor(logger: Logger) {
    super(logger);
  }

  private getProofServerUrl(): string {
    const container = this.proofServerContainer as { getUrl(): string } | undefined;
    if (!container) {
      throw new Error('Proof server container is not available.');
    }
    return container.getUrl();
  }

  getEnvironmentConfiguration(): EnvironmentConfiguration {
    return {
      walletNetworkId: 'preview',
      networkId: 'preview',
      indexer: 'https://indexer.preview.midnight.network/api/v4/graphql',
      indexerWS: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
      node: 'https://rpc.preview.midnight.network',
      nodeWS: 'wss://rpc.preview.midnight.network',
      // Bug fixed by deploy-engineer (public-deploy task, 22/08): this pointed at
      // `midnight-tmnight-preview.nethermind.dev` (a different backend, different IPs —
      // confirmed by `getent hosts`), whose `/api/health` reported
      // `{"status":"NOT_SERVING","reason":"SYNC_STUCK_RECOVERY","needsRestart":true}`
      // when tested live. `faucet.preview.midnight.network` — the same host
      // testkit-js's own built-in `PreviewTestEnvironment` uses internally — reported
      // `{"status":"SERVING",...}` cleanly at the same time. Both require solving a
      // captcha (Cloudflare Turnstile) on `/api/drips`, confirmed by POSTing a dummy
      // token to each and getting `{"error":"Captcha verification failed"}` back — this
      // is a browser-only faucet either way, this fix only changes *which* backend a
      // human is pointed at.
      faucet: 'https://faucet.preview.midnight.network/api/drips',
      proofServer: this.getProofServerUrl(),
    };
  }
}

export class PreprodTestEnvironment extends RemoteTestEnvironment {
  constructor(logger: Logger) {
    super(logger);
  }

  private getProofServerUrl(): string {
    const container = this.proofServerContainer as { getUrl(): string } | undefined;
    if (!container) {
      throw new Error('Proof server container is not available.');
    }
    return container.getUrl();
  }

  getEnvironmentConfiguration(): EnvironmentConfiguration {
    return {
      walletNetworkId: 'preprod',
      networkId: 'preprod',
      indexer: 'https://indexer.preprod.midnight.network/api/v4/graphql',
      indexerWS: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
      node: 'https://rpc.preprod.midnight.network',
      nodeWS: 'wss://rpc.preprod.midnight.network',
      // See the matching comment in `PreviewTestEnvironment` above — same fix, same
      // reasoning. (The preprod nethermind.dev backend tested healthy too, unlike its
      // preview counterpart, but switching to the official host used by testkit-js
      // itself is the more defensible default for both networks, not just preview.)
      faucet: 'https://faucet.preprod.midnight.network/api/drips',
      proofServer: this.getProofServerUrl(),
    };
  }
}
