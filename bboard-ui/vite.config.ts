// This file is part of midnightntwrk/example-counter.
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

import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import path from 'node:path';
import fs from 'node:fs';
// import { nodePolyfills } from 'vite-plugin-node-polyfills';

/**
 * `npm run build`/`build:preview` copy the compiled contract's `keys`/`zkir` into
 * `./dist` (see package.json) so `FetchZkConfigProvider` — which fetches them from the
 * app's own origin at `window.location.origin` (see `src/contexts/AttestaManager.ts`)
 * — finds them at runtime. `vite dev` serves straight from source with no such copy
 * step, so without this plugin `npm run dev` would 404 on every `/keys/*`/`/zkir/*`
 * request the moment a panel tries to register/revoke/prove an attestation against the
 * local devnet. This plugin serves `contract/src/managed/attesta/{keys,zkir}` directly
 * under those same paths, dev-server only (`configureServer` never runs during `vite
 * build`), so `npm run dev` is a fully working path against the local devnet, not just
 * a UI preview.
 */
const serveZkConfigInDev = (): Plugin => {
  const zkConfigDir = path.resolve(process.cwd(), '..', 'contract', 'src', 'managed', 'attesta');
  return {
    name: 'attesta-serve-zk-config-in-dev',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? '';
        if (!url.startsWith('/keys/') && !url.startsWith('/zkir/')) {
          next();
          return;
        }
        const relative = decodeURIComponent(url.split('?')[0]);
        const filePath = path.join(zkConfigDir, relative);
        if (!filePath.startsWith(zkConfigDir)) {
          next();
          return;
        }
        fs.stat(filePath, (err, stat) => {
          if (err || !stat.isFile()) {
            next();
            return;
          }
          res.setHeader('Content-Type', 'application/octet-stream');
          fs.createReadStream(filePath).pipe(res);
        });
      });
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  cacheDir: './.vite',
  build: {
    target: 'esnext',
    minify: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Separate chunk for WASM modules to avoid top-level await issues
          if (id.includes('onchain-runtime-v3')) return 'wasm';
        },
      },
      },
    commonjsOptions: {
      // Transform CommonJS to ESM more aggressively
      transformMixedEsModules: true,
      extensions: ['.js', '.cjs'],
      // Needed for Node.js modules
      ignoreDynamicRequires: true,
    },
  },
  plugins: [
    react(),
    serveZkConfigInDev(),
    // Configure WASM plugin with more options
    wasm(),
    topLevelAwait({
      // Be more permissive with top-level await
      promiseExportName: '__tla',
      promiseImportName: (i) => `__tla_${i}`,
    }),
    // Custom resolver for handling problematic modules
    {
      name: 'wasm-module-resolver',
      resolveId(source, importer) {
        // Special handling for the problematic module
        if (
          source === '@midnight-ntwrk/onchain-runtime-v3' &&
          importer &&
          importer.includes('@midnight-ntwrk/compact-runtime')
        ) {
          // Force dynamic import for this case
          return {
            id: source,
            external: false,
            moduleSideEffects: true,
          };
        }
        return null;
      },
    },
  ],
  optimizeDeps: {
    rolldownOptions: {
      target: 'esnext',
      supported: { 'top-level-await': true },
      // Configure ESBuild to handle Node.js-style modules
      platform: 'browser',
      format: 'esm',
      loader: {
        '.wasm': 'binary',
      },
    },
    // Explicitly include these packages for pre-bundling, but force ESM
    include: ['@midnight-ntwrk/compact-runtime'],
    // Exclude WASM files and modules with top-level await from optimization
    exclude: [
      '@midnight-ntwrk/onchain-runtime-v3',
      '@midnight-ntwrk/onchain-runtime-v3/midnight_onchain_runtime_wasm_bg.wasm',
      '@midnight-ntwrk/onchain-runtime-v3/midnight_onchain_runtime_wasm.js',
    ],
  },
  define: {},
  checks: {
    importIsUndefined: false,
    pluginTimings: false,
  },
  // Add specific import configuration for more control
  resolve: {
    // Ensure WASM files are loaded properly
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.wasm'],
    mainFields: ['browser', 'module', 'main'],
  },
});
