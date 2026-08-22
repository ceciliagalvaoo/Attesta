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

import { useCallback, useEffect, useRef, useState } from 'react';
import { type Logger } from 'pino';
import { type ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { type AttestaDeployment, type AttestaRole, BrowserAttestaManager } from '../contexts/AttestaManager';

/**
 * Owns one identity's connection to an Attesta contract — its own
 * {@link BrowserAttestaManager} (own wallet connection, own private-state provider,
 * D27), created once per `(role)` and reused for the lifetime of the component that
 * calls this hook.
 *
 * @remarks
 * Deliberately not a React Context: this app has exactly two identities (issuer,
 * verifier), each owned by exactly one panel's connect flow in `App.tsx` — prop-drilling
 * the resolved `DeployedAttestaAPI` down into the panel is simpler than a context only
 * two call sites ever read. A third role (a Wave 2 auditor) would call this same hook
 * again with `role: 'auditor'`... except `AttestaRole` doesn't include it yet — see the
 * Wave 2 reuse note in `.claude/agents/frontend-engineer.md` for why that is intentional
 * (not building the auditor surface now, just not closing the door on it structurally).
 */
export const useAttestaConnection = (
  role: AttestaRole,
  logger: Logger,
): {
  readonly deployment: AttestaDeployment | undefined;
  readonly deploy: () => void;
  readonly join: (contractAddress: ContractAddress) => void;
} => {
  const managerRef = useRef<BrowserAttestaManager | undefined>(undefined);
  if (!managerRef.current) {
    managerRef.current = new BrowserAttestaManager(role, logger);
  }
  const manager = managerRef.current;

  const [deployment, setDeployment] = useState<AttestaDeployment>();

  useEffect(() => {
    const subscription = manager.deployment$.subscribe(setDeployment);
    return () => subscription.unsubscribe();
  }, [manager]);

  const deploy = useCallback(() => manager.deploy(), [manager]);
  const join = useCallback((contractAddress: ContractAddress) => manager.join(contractAddress), [manager]);

  return { deployment, deploy, join };
};
