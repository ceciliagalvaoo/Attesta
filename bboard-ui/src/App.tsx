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

import React, { useCallback, useState } from 'react';
import { type Logger } from 'pino';
import { type ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { MainLayout, IssuerPanel, VerifierPanel, AttestaConnectionSlot } from './components';

export interface AppProps {
  readonly logger: Logger;
}

/**
 * The root Attesta application.
 *
 * D27 (`contexto/ESTADO.md`): the issuer panel and the verifier panel each connect
 * independently — two separate {@link AttestaConnectionSlot}s, each with its own 1AM
 * wallet connection and its own private state (see
 * `bboard-ui/src/contexts/AttestaManager.ts`). There is no shared "app-wide" contract
 * connection any more; the only thing that crosses from one to the other is the
 * (public) contract address, offered as a convenience default when joining the
 * verifier slot, and whatever proof-packet text a person copies from the issuer
 * panel's export dialog into the verifier panel's import box.
 */
const App: React.FC<Readonly<AppProps>> = ({ logger }) => {
  const [issuerContractAddress, setIssuerContractAddress] = useState<ContractAddress>();

  const handleIssuerConnected = useCallback((address: ContractAddress) => {
    setIssuerContractAddress(address);
  }, []);

  return (
    <MainLayout>
      <AttestaConnectionSlot
        role="issuer"
        title="Connect the issuer's wallet"
        description="Attesta needs the Midnight 1AM wallet extension, connected to the network this app was started against (the local devnet for `npm run dev`). Deploy a fresh demo registry, or join one this issuer already deployed."
        allowDeploy
        logger={logger}
        onConnected={handleIssuerConnected}
      >
        {(api, walletAddress) => <IssuerPanel api={api} walletAddress={walletAddress} />}
      </AttestaConnectionSlot>

      <AttestaConnectionSlot
        role="verifier"
        title="Connect the verifier's wallet"
        description="Connect a second, independent 1AM wallet/account for the verifier — this identity starts with an empty registry and can only see attestations imported below as a proof packet, never the issuer's own records."
        allowDeploy={false}
        suggestedContractAddress={issuerContractAddress}
        logger={logger}
      >
        {(api, walletAddress) => <VerifierPanel api={api} walletAddress={walletAddress} />}
      </AttestaConnectionSlot>
    </MainLayout>
  );
};

export default App;
