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
 * Attesta common types and abstractions.
 *
 * @module
 */

import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { Ledger, Contract, Witnesses } from '../../contract/src/index';
import { LivenessStatus } from '../../contract/src/index';
import type { AttestaPrivateState, ProofPacket } from '../../contract/src/witnesses';

export { LivenessStatus };
export type { Ledger, ProofPacket };

export const attestaPrivateStateKey = 'attestaPrivateState';
export type PrivateStateId = typeof attestaPrivateStateKey;

/**
 * The private states consumed throughout the application.
 *
 * @remarks
 * {@link PrivateStates} can be thought of as a type that describes a schema for all
 * private states for all contracts used in the application. Each key represents
 * the type of private state consumed by a particular type of contract.
 *
 * Since there is only one contract type for Attesta, we only define a single
 * key/type in the schema.
 *
 * @public
 */
export type PrivateStates = {
  /**
   * Key used to provide the private state for {@link AttestaContract} deployments.
   */
  readonly attestaPrivateState: AttestaPrivateState;
};

/**
 * Represents an Attesta contract and its private state.
 *
 * @public
 */
export type AttestaContract = Contract<AttestaPrivateState, Witnesses<AttestaPrivateState>>;

/**
 * The keys of the circuits exported from {@link AttestaContract}.
 *
 * @public
 */
export type AttestaCircuitKeys = Exclude<keyof AttestaContract['impureCircuits'], number | symbol>;

/**
 * The providers required by {@link AttestaContract}.
 *
 * @public
 */
export type AttestaProviders = MidnightProviders<AttestaCircuitKeys, PrivateStateId, AttestaPrivateState>;

/**
 * An {@link AttestaContract} that has been deployed to the network.
 *
 * @public
 */
export type DeployedAttestaContract = FoundContract<AttestaContract>;

/**
 * A public, derived snapshot of contract state that is always safe to render — it is
 * exactly the {@link Ledger} the chain itself discloses (commitments, nullifier flags,
 * the SIMULATED trust-list flags), never any witness/raw attestation data.
 *
 * @remarks
 * Kept deliberately generic (not "IssuerDerivedState"/"VerifierDerivedState") so a
 * future Wave 2 auditor surface can consume the same shape — see
 * contexto/09-BRANDING? no: see frontend-engineer's Wave 2 reuse note.
 */
export type AttestaDerivedState = {
  readonly ledger: Ledger;
};
