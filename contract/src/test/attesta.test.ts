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
 * The three mandatory Attesta test cases (contexto/08-BUILD-PROMPT.md,
 * Bloco 1, features 2 and 3; contexto/06-PROJETO-FINAL.md §6):
 *
 *   1. A witness value leaking to a public output without disclose() fails
 *      at COMPILE time, not at runtime. This is a compiler-categorized
 *      error class ("Witness and Disclosure Errors"), so it cannot be
 *      exercised by calling a circuit from vitest like the other two — it
 *      is exercised by actually invoking `compactc` against a deliberately
 *      broken fixture and asserting the build fails with that error
 *      category. See src/test/leak-fixture/ and
 *      src/test/verify-leak-fails-to-compile.mjs, wired into `npm test` via
 *      the `pretest` script in package.json so it always runs as part of
 *      the normal `npm test` / `npm run ci` flow (not a separate opt-in
 *      step), while staying out of the vitest process itself (a `vitest`
 *      test can't assert "vitest didn't even manage to import this module
 *      because the compiler rejected it" from inside the run).
 *
 *   2. A revoked attestation is rejected by `proveLive` — see "revoked
 *      attestation is rejected by proveLive" below.
 *
 *   3. An attestation outside its validity window is rejected by
 *      `proveLive` — see "attestation past its validity window is rejected
 *      by proveLive" below.
 */

import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";
import { randomBytes } from "./utils.js";
import {
  AttestaSimulator,
  LivenessStatus,
  nullifierHashFor,
} from "./attesta-simulator.js";
import type { AttestationPrivateRecord, ProofPacket } from "../witnesses.js";
import {
  createVerifierPrivateState,
  withImportedProofPacket,
} from "../witnesses.js";

setNetworkId("undeployed");

const HOUR = 3600n;
const NOW = 1_800_000_000n; // arbitrary fixed "current time" for deterministic tests

// This test helper always sets revocationSecret (it builds issuer-side
// records for the issuer-only tests below plus the setup half of the D27
// tests), so its return type narrows revocationSecret back to required —
// unlike AttestationPrivateRecord itself, where it is optional specifically
// to allow a verifier-only record that never has one.
const freshRecord = (
  overrides: Partial<AttestationPrivateRecord> = {},
): Omit<AttestationPrivateRecord, "commitment"> & {
  revocationSecret: Uint8Array;
} => ({
  rawDataHash: randomBytes(32),
  validFrom: NOW - HOUR,
  validUntil: NOW + HOUR,
  revocationSecret: randomBytes(32),
  salt: randomBytes(32),
  ...overrides,
});

describe("Attesta smart contract", () => {
  it("generates initial ledger state deterministically", () => {
    // The ledger accessors (attestations, revokedNullifiers, trustedIssuers)
    // are live wrapper objects over the query state, not plain data, so they
    // are compared field-by-field here rather than via a single deep
    // toEqual() over the whole Ledger object.
    const key = randomBytes(32);
    const simulator0 = new AttestaSimulator(key, NOW);
    const simulator1 = new AttestaSimulator(key, NOW);
    const ledger0 = simulator0.getLedger();
    const ledger1 = simulator1.getLedger();
    expect(ledger0.attestations.firstFree()).toEqual(
      ledger1.attestations.firstFree(),
    );
    expect(ledger0.attestations.root()).toEqual(ledger1.attestations.root());
    expect(ledger0.revokedNullifiers.isEmpty()).toEqual(
      ledger1.revokedNullifiers.isEmpty(),
    );
    expect(ledger0.trustedIssuers.isEmpty()).toEqual(
      ledger1.trustedIssuers.isEmpty(),
    );
  });

  it("starts with an empty attestations tree and empty trust/revocation maps", () => {
    const simulator = new AttestaSimulator(randomBytes(32), NOW);
    const ledgerState = simulator.getLedger();
    expect(ledgerState.attestations.firstFree()).toEqual(0n);
    expect(ledgerState.revokedNullifiers.isEmpty()).toEqual(true);
    expect(ledgerState.trustedIssuers.isEmpty()).toEqual(true);
  });

  it("registerAttestation discloses only a commitment, never the raw data, as the tree leaf", () => {
    const simulator = new AttestaSimulator(randomBytes(32), NOW);
    const ref = randomBytes(32);
    const record = freshRecord();
    const { ledger: ledgerState, commitment } = simulator.registerAttestation(
      ref,
      record,
    );
    expect(ledgerState.attestations.firstFree()).toEqual(1n);
    // The disclosed commitment is a 32-byte opaque value, distinct from the
    // raw attestation data that was committed.
    expect(commitment).toBeInstanceOf(Uint8Array);
    expect(commitment.length).toEqual(32);
    expect(commitment).not.toEqual(record.rawDataHash);
    // The commitment is genuinely present as a tree leaf.
    expect(
      ledgerState.attestations.findPathForLeaf(commitment),
    ).not.toBeUndefined();
  });

  it("proveLive reports LIVE for a freshly registered, trusted, unexpired attestation", () => {
    const issuerSecret = randomBytes(32);
    const simulator = new AttestaSimulator(issuerSecret, NOW);
    simulator.setTrustedIssuer(simulator.issuerId(), true);

    const ref = randomBytes(32);
    simulator.registerAttestation(ref, freshRecord());

    const { status, issuerId } = simulator.proveLive(ref);
    expect(status).toEqual(LivenessStatus.LIVE);
    expect(issuerId).toEqual(simulator.issuerId());
  });

  it("proveLive reports NOT_TRUSTED when the issuer is not on the trust list", () => {
    const simulator = new AttestaSimulator(randomBytes(32), NOW);
    // Note: setTrustedIssuer is never called for this issuer.
    const ref = randomBytes(32);
    simulator.registerAttestation(ref, freshRecord());

    const { status } = simulator.proveLive(ref);
    expect(status).toEqual(LivenessStatus.NOT_TRUSTED);
  });

  // --- Mandatory test case 2/3: revoked attestation rejected by proveLive ---
  it("revoked attestation is rejected by proveLive", () => {
    const issuerSecret = randomBytes(32);
    const simulator = new AttestaSimulator(issuerSecret, NOW);
    simulator.setTrustedIssuer(simulator.issuerId(), true);

    const ref = randomBytes(32);
    simulator.registerAttestation(ref, freshRecord());

    // Confirm it is live before revocation.
    expect(simulator.proveLive(ref).status).toEqual(LivenessStatus.LIVE);

    const beforeRevoke = simulator.getLedger();
    simulator.revokeAttestation(ref);
    const afterRevoke = simulator.getLedger();

    // The attestations tree root is untouched by revocation — Compact's
    // HistoricMerkleTree has no delete/update operation (confirmed against
    // the real compiler before this contract was designed), so revocation
    // is "publish a nullifier", not "remove the leaf". What changes is the
    // revocation set.
    expect(afterRevoke.attestations.root()).toEqual(
      beforeRevoke.attestations.root(),
    );
    expect(afterRevoke.revokedNullifiers.size()).toEqual(
      beforeRevoke.revokedNullifiers.size() + 1n,
    );

    // The attestation is now rejected — this is the mandatory assertion.
    expect(simulator.proveLive(ref).status).toEqual(LivenessStatus.REVOKED);
  });

  it("revoking one attestation does not affect a second, unrelated attestation", () => {
    const issuerSecret = randomBytes(32);
    const simulator = new AttestaSimulator(issuerSecret, NOW);
    simulator.setTrustedIssuer(simulator.issuerId(), true);

    const refA = randomBytes(32);
    const refB = randomBytes(32);
    simulator.registerAttestation(refA, freshRecord());
    simulator.registerAttestation(refB, freshRecord());

    simulator.revokeAttestation(refA);

    expect(simulator.proveLive(refA).status).toEqual(LivenessStatus.REVOKED);
    expect(simulator.proveLive(refB).status).toEqual(LivenessStatus.LIVE);
  });

  it("revokeAttestation fails for witness data that was never registered", () => {
    const simulator = new AttestaSimulator(randomBytes(32), NOW);
    const ref = randomBytes(32);
    // Seed private data for `ref` but never call registerAttestation, so no
    // commitment/Merkle path exists for it.
    expect(() => simulator.revokeAttestation(ref)).toThrow();
  });

  // --- Mandatory test case 3/3: attestation outside its validity window ---
  it("attestation past its validity window is rejected by proveLive", () => {
    const issuerSecret = randomBytes(32);
    const simulator = new AttestaSimulator(issuerSecret, NOW);
    simulator.setTrustedIssuer(simulator.issuerId(), true);

    const ref = randomBytes(32);
    simulator.registerAttestation(
      ref,
      freshRecord({ validFrom: NOW - 2n * HOUR, validUntil: NOW - HOUR }),
    );

    const { status } = simulator.proveLive(ref);
    expect(status).toEqual(LivenessStatus.EXPIRED);
  });

  it("attestation before its validity window has started is rejected by proveLive", () => {
    const issuerSecret = randomBytes(32);
    const simulator = new AttestaSimulator(issuerSecret, NOW);
    simulator.setTrustedIssuer(simulator.issuerId(), true);

    const ref = randomBytes(32);
    simulator.registerAttestation(
      ref,
      freshRecord({ validFrom: NOW + HOUR, validUntil: NOW + 2n * HOUR }),
    );

    const { status } = simulator.proveLive(ref);
    expect(status).toEqual(LivenessStatus.EXPIRED);
  });

  it("proveLive tracks the real chain block time (kernel.blockTimeLessThan/blockTimeGreaterThan), not a caller-supplied value", () => {
    // proveLive has no `currentTime` parameter — there is nothing a caller
    // could pass in to fake being earlier than they are. The only way to
    // move "now" for a circuit call is to actually advance the block time
    // the simulator's QueryContext reports, exactly as a real node would
    // between two transactions. This mirrors what
    // @midnight-ntwrk/compact-runtime's own `createCircuitContext` helper
    // does internally (see AttestaSimulator.setBlockTime).
    const issuerSecret = randomBytes(32);
    const simulator = new AttestaSimulator(issuerSecret, NOW);
    simulator.setTrustedIssuer(simulator.issuerId(), true);

    const ref = randomBytes(32);
    simulator.registerAttestation(
      ref,
      freshRecord({ validFrom: NOW - HOUR, validUntil: NOW + HOUR }),
    );

    expect(simulator.proveLive(ref).status).toEqual(LivenessStatus.LIVE);

    // Advance the (simulated) chain past validUntil. No argument to
    // proveLive changed — only the block time did.
    simulator.setBlockTime(NOW + 2n * HOUR);
    expect(simulator.proveLive(ref).status).toEqual(LivenessStatus.EXPIRED);

    // And winding the clock back before validFrom is equally reflected.
    simulator.setBlockTime(NOW - 2n * HOUR);
    expect(simulator.proveLive(ref).status).toEqual(LivenessStatus.EXPIRED);
  });

  it("registerAttestation rejects a validity window where validFrom is not before validUntil", () => {
    const simulator = new AttestaSimulator(randomBytes(32), NOW);
    const ref = randomBytes(32);
    expect(() =>
      simulator.registerAttestation(
        ref,
        freshRecord({ validFrom: NOW, validUntil: NOW }),
      ),
    ).toThrow("invalid validity window");
  });

  // --- D27 (contexto/ESTADO.md): proof-packet read path for proveLive ---
  //
  // Proves the thing that motivated the attesta.compact change: a verifier
  // whose private state genuinely holds neither the issuer's issuerSecret
  // nor this attestation's revocationSecret — only the six proof-packet
  // fields (rawDataHash, validFrom, validUntil, issuerId, nullifierHash,
  // salt) plus the already-public commitment needed for the Merkle-path
  // lookup — can still run proveLive(ref) successfully and see the correct
  // LIVE status. Before this change this was not just unwired, it was
  // cryptographically impossible (see feedback.md): recordOf always
  // rederived issuerId/nullifierHash from the raw secrets, so any private
  // state missing those secrets could never reproduce a matching
  // commitment.
  it("D27: a verifier with no issuerSecret/revocationSecret at all can prove liveness from an imported proof packet", () => {
    const issuerSecret = randomBytes(32);
    const issuerSimulator = new AttestaSimulator(issuerSecret, NOW);
    issuerSimulator.setTrustedIssuer(issuerSimulator.issuerId(), true);

    const ref = randomBytes(32);
    const record = freshRecord();
    const { commitment } = issuerSimulator.registerAttestation(ref, record);
    // Sanity: the issuer's own proveLive still works post-change (this is
    // also covered by the "reports LIVE" test above, using the same
    // recordForProveLive path).
    expect(issuerSimulator.proveLive(ref).status).toEqual(LivenessStatus.LIVE);

    // Captured before the private state is swapped below — issuerId() only
    // works against an issuer's own state (it reads issuerSecret), and the
    // verifier's swapped-in state deliberately has none.
    const expectedIssuerId = issuerSimulator.issuerId();

    // Exactly the D27 proof packet — never issuerSecret/revocationSecret.
    // `commitment` travels alongside because it is already public (the
    // disclosed return value of registerAttestation / a real leaf of the
    // on-chain attestations tree) and is needed to locate the Merkle path.
    const packet: ProofPacket = {
      rawDataHash: record.rawDataHash,
      validFrom: record.validFrom,
      validUntil: record.validUntil,
      issuerId: expectedIssuerId,
      nullifierHash: nullifierHashFor(record.revocationSecret),
      salt: record.salt,
      commitment,
    };

    // A genuinely separate verifier private state: no issuerSecret field at
    // all, and the per-ref record has no revocationSecret either — only
    // what the packet contains. Confirm neither secret is anywhere in it.
    let verifierState = createVerifierPrivateState();
    verifierState = withImportedProofPacket(verifierState, ref, packet);
    expect(verifierState.issuerSecret).toBeUndefined();
    expect(
      verifierState.records[Buffer.from(ref).toString("hex")],
    ).not.toHaveProperty("revocationSecret");

    // The verifier reads the same public ledger the issuer registered
    // against (a real app: both read the same on-chain contract state via
    // the indexer) but with its own, separate private state swapped in —
    // this is the actual separation D27 requires.
    issuerSimulator.circuitContext.currentPrivateState = verifierState;

    const { status, issuerId } = issuerSimulator.proveLive(ref);
    expect(status).toEqual(LivenessStatus.LIVE);
    expect(issuerId).toEqual(expectedIssuerId);
  });

  it("D27: proveLive fails closed for a verifier record with a wrong/fabricated issuerId", () => {
    // Confirms the security property, not just the happy path: knowing a
    // trusted issuer's public issuerId is not enough to forge a passing
    // proof. persistentCommit is binding, so a wrong issuerId produces a
    // commitment that does not match the real registered leaf.
    const issuerSecret = randomBytes(32);
    const issuerSimulator = new AttestaSimulator(issuerSecret, NOW);
    issuerSimulator.setTrustedIssuer(issuerSimulator.issuerId(), true);

    const ref = randomBytes(32);
    const record = freshRecord();
    const { commitment } = issuerSimulator.registerAttestation(ref, record);

    const forgedPacket: ProofPacket = {
      rawDataHash: record.rawDataHash,
      validFrom: record.validFrom,
      validUntil: record.validUntil,
      issuerId: randomBytes(32), // wrong on purpose
      nullifierHash: nullifierHashFor(record.revocationSecret),
      salt: record.salt,
      commitment,
    };

    let verifierState = createVerifierPrivateState();
    verifierState = withImportedProofPacket(verifierState, ref, forgedPacket);
    issuerSimulator.circuitContext.currentPrivateState = verifierState;

    expect(() => issuerSimulator.proveLive(ref)).toThrow();
  });
});
