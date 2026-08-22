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
  type CircuitContext,
  QueryContext,
  sampleContractAddress,
  createConstructorContext,
  CostModel,
  persistentHash,
  Bytes32Descriptor,
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  type Ledger,
  ledger,
  LivenessStatus,
} from "../managed/attesta/contract/index.js";
import {
  type AttestaPrivateState,
  type AttestationPrivateRecord,
  createAttestaPrivateState,
  withAttestationRecord,
  withCommitment,
  witnesses,
} from "../witnesses.js";

export { LivenessStatus };

/**
 * Derives the same pseudonymous public issuer id the contract computes as
 * `persistentHash(issuerSecret)` (see `issuerIdOf` in attesta.compact), off
 * -chain, from an issuer's secret. Used by tests (and, in a real app, by an
 * issuer's own tooling) to know what to register in the SIMULATED trust
 * list via `setTrustedIssuer`, without needing an on-chain round trip.
 */
export const issuerIdFor = (issuerSecret: Uint8Array): Uint8Array =>
  persistentHash<Uint8Array>(Bytes32Descriptor, issuerSecret);

/**
 * Derives the same `nullifierHash` the contract computes as
 * `persistentHash(revocationSecret)` (see `nullifierOf` in
 * attesta.compact), off-chain, from a per-attestation revocation secret.
 * Symmetrical to `issuerIdFor` above. Used (a) by
 * `AttestaSimulator.registerAttestation` to populate the issuer's own
 * record with the `nullifierHash` that `proveLive`'s D27 read path
 * (`nullifierHashWitness`) now requires, and (b) by tests building a proof
 * packet for a simulated verifier.
 */
export const nullifierHashFor = (revocationSecret: Uint8Array): Uint8Array =>
  persistentHash<Uint8Array>(Bytes32Descriptor, revocationSecret);

/**
 * Serves as a testbed to exercise the Attesta contract in tests, mirroring
 * the shape of the template's `BBoardSimulator`.
 */
export class AttestaSimulator {
  readonly contract: Contract<AttestaPrivateState>;
  circuitContext: CircuitContext<AttestaPrivateState>;

  constructor(
    issuerSecret: Uint8Array,
    initialBlockTime: bigint = BigInt(Math.floor(Date.now() / 1000)),
  ) {
    this.contract = new Contract<AttestaPrivateState>(witnesses);
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      createConstructorContext(
        createAttestaPrivateState(issuerSecret),
        "0".repeat(64),
      ),
    );
    this.circuitContext = {
      currentPrivateState,
      currentZswapLocalState,
      costModel: CostModel.initialCostModel(),
      currentQueryContext: new QueryContext(
        currentContractState.data,
        sampleContractAddress(),
      ),
    };
    // proveLive checks the validity window against the real chain block
    // time via the built-in `kernel` ledger ADT
    // (kernel.blockTimeLessThan/blockTimeGreaterThan in attesta.compact),
    // not against a caller-supplied argument. In the simulator, the block
    // time a circuit call observes is `currentQueryContext.block
    // .secondsSinceEpoch` — this mirrors exactly what
    // @midnight-ntwrk/compact-runtime's own `createCircuitContext` helper
    // does internally (see its `createInitialQueryContext`). Tests advance
    // time by calling `setBlockTime` before `proveLive`, instead of passing
    // a `currentTime` circuit argument (removed — it could never have been
    // trustworthy, since a dishonest caller could just assert whichever
    // "now" produced the answer they wanted).
    this.setBlockTime(initialBlockTime);
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public getPrivateState(): AttestaPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public issuerId(): Uint8Array {
    const secret = this.getPrivateState().issuerSecret;
    if (!secret) {
      throw new Error(
        "AttestaSimulator.issuerId(): this simulator's private state has no " +
          "issuerSecret (it was built as a verifier-only state, D27)",
      );
    }
    return issuerIdFor(secret);
  }

  /**
   * Sets the block time (Unix seconds) that subsequent circuit calls will
   * observe via `kernel.blockTimeLessThan`/`blockTimeGreaterThan` in
   * `proveLive`. Use this to advance time in tests instead of passing a
   * `currentTime` argument to `proveLive` (there is none — see the
   * constructor's comment).
   */
  public setBlockTime(secondsSinceEpoch: bigint): void {
    const queryContext = this.circuitContext.currentQueryContext;
    queryContext.block = {
      ...queryContext.block,
      secondsSinceEpoch,
    };
  }

  /** SIMULATED TRUST LIST admin — see attesta.compact, `setTrustedIssuer`. */
  public setTrustedIssuer(issuerId: Uint8Array, trusted: boolean): Ledger {
    this.circuitContext = this.contract.impureCircuits.setTrustedIssuer(
      this.circuitContext,
      issuerId,
      trusted,
    ).context;
    return this.getLedger();
  }

  /**
   * Seeds the private record for `ref` and calls `registerAttestation`,
   * storing the returned commitment back into private state so later
   * `revokeAttestation`/`proveLive` calls for the same `ref` can build a
   * Merkle path.
   */
  public registerAttestation(
    ref: Uint8Array,
    record: Omit<AttestationPrivateRecord, "commitment">,
  ): { ledger: Ledger; commitment: Uint8Array } {
    // proveLive's D27 read path (recordForProveLive, see attesta.compact)
    // requires issuerId/nullifierHash as plain witness fields for *any*
    // caller, issuer included — not only an imported proof packet. An
    // issuer computes them itself, once, the same way the circuit's
    // issuerIdOf()/nullifierOf(ref) do: persistentHash(issuerSecret) /
    // persistentHash(revocationSecret). Populating them here keeps
    // AttestaSimulator.proveLive working for the issuer's own records
    // exactly as before D27 introduced the new witnesses.
    const enrichedRecord: Omit<AttestationPrivateRecord, "commitment"> = {
      ...record,
      issuerId: record.issuerId ?? this.issuerId(),
      nullifierHash:
        record.nullifierHash ??
        (record.revocationSecret
          ? nullifierHashFor(record.revocationSecret)
          : undefined),
    };
    this.circuitContext.currentPrivateState = withAttestationRecord(
      this.circuitContext.currentPrivateState,
      ref,
      { ...enrichedRecord },
    );
    const result = this.contract.impureCircuits.registerAttestation(
      this.circuitContext,
      ref,
    );
    this.circuitContext = result.context;
    const commitment = result.result;
    this.circuitContext.currentPrivateState = withCommitment(
      this.circuitContext.currentPrivateState,
      ref,
      commitment,
    );
    return { ledger: this.getLedger(), commitment };
  }

  public revokeAttestation(ref: Uint8Array): Ledger {
    this.circuitContext = this.contract.impureCircuits.revokeAttestation(
      this.circuitContext,
      ref,
    ).context;
    return this.getLedger();
  }

  public proveLive(ref: Uint8Array): {
    status: LivenessStatus;
    issuerId: Uint8Array;
  } {
    const result = this.contract.impureCircuits.proveLive(
      this.circuitContext,
      ref,
    );
    this.circuitContext = result.context;
    const [status, issuerId] = result.result;
    return { status, issuerId };
  }
}
