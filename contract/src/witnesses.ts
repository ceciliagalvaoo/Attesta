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
 * Private state and witness functions for the Attesta contract
 * (src/attesta.compact).
 *
 * Every witness below reads from `privateState.records`, keyed by `ref` — a
 * 32-byte reference the *calling application* chooses locally (e.g. a random
 * id) to select which attestation's private data to hand to the circuit.
 * `ref` itself is never disclosed by the contract (see attesta.compact); it
 * only exists so one contract instance can serve many attestations without
 * every witness function needing a fixed, single-value shape like the
 * bboard template's `localSecretKey()`.
 *
 * `commitment` is populated only after `registerAttestation` has actually
 * run for that `ref` and returned its disclosed commitment — the caller is
 * expected to store the circuit's own return value back into private state
 * before calling `revokeAttestation`/`proveLive` for the same `ref`. This
 * sidesteps re-deriving `persistentCommit` on the TypeScript side (the
 * generated contract module does not export a reusable runtime type
 * descriptor for `AttestationRecord` — confirmed by inspecting the compiled
 * output), and it is also simply how this data would flow in a real app:
 * you keep the commitment you were just given. `commitment` is not secret —
 * it is the exact value `registerAttestation` disclosed and inserted as a
 * public tree leaf — so it is fine for it to travel alongside a proof
 * packet too (see below); it just is not one of the *witness-derived*
 * fields that motivate the packet in the first place.
 *
 * D27 (contexto/ESTADO.md) — proof-packet read path for `proveLive`: the
 * product design requires an issuer to hand a verifier a "proof packet",
 * once, out-of-band, that the verifier can then run `proveLive` against on
 * its own, indefinitely, without depending on the issuer again or holding
 * any of the issuer's secrets. `attesta.compact` supports this with two
 * read-path-only witnesses, `issuerIdWitness(ref)`/`nullifierHashWitness
 * (ref)`, that `proveLive` now sources `issuerId`/`nullifierHash` from
 * (via `recordForProveLive`) instead of rederiving them from
 * `issuerSecret()`/`revocationSecret(ref)` the way `registerAttestation`/
 * `revokeAttestation` still do (via `recordOf`, unchanged). Concretely,
 * that means `AttestationPrivateRecord.issuerId`/`.nullifierHash` below are
 * required for *any* `proveLive(ref)` call, issuer or verifier alike — an
 * issuer populates them itself once, locally, at registration time
 * (`AttestaSimulator.registerAttestation` in the test simulator shows the
 * pattern: `persistentHash(issuerSecret)`/`persistentHash(revocationSecret)`,
 * the exact same values the circuit itself derives); a verifier populates
 * them from the imported packet instead, via `withImportedProofPacket`,
 * without ever holding `issuerSecret`/`revocationSecret`. Either way,
 * `issuerSecret()`/`revocationSecret(ref)` (and therefore
 * `AttestaPrivateState.issuerSecret`/`AttestationPrivateRecord
 * .revocationSecret`) remain required only for the *write* path
 * (`registerAttestation`/`revokeAttestation`) — both are optional here
 * specifically so a verifier-only private state can genuinely have none of
 * either, which is the whole point of the separation.
 *
 * The exact proof packet an issuer exports (see `ProofPacket` below):
 * `rawDataHash`, `validFrom`, `validUntil`, `issuerId`, `nullifierHash`,
 * `salt`, plus the public `commitment` (needed to look up the Merkle leaf —
 * see `attestationMerklePath` below). Never `issuerSecret`/
 * `revocationSecret` — either would let the verifier forge new
 * attestations or revocations "as" the issuer, not just read this one. The
 * Merkle path itself is never part of the packet either: it is re-fetched
 * from the public indexer on every `proveLive` call via
 * `attestationMerklePath`/`ledger.attestations.findPathForLeaf`, identical
 * for issuer and verifier, since it is public data derivable from the
 * commitment.
 *
 * IMPORTANT — this is the wiring boundary owned by frontend-engineer, not by
 * this file: where/how the issuer's `issuerSecret` and each attestation's
 * raw private fields are actually stored in the browser (localStorage,
 * IndexedDB, a wallet-managed keystore, ...), and how a proof packet is
 * actually serialized/transmitted/imported, are application concerns.
 * `AttestaPrivateState` here is deliberately just an in-memory shape neutral
 * to that choice, matching how `BBoardPrivateState` worked in the template.
 */

import { Ledger } from "./managed/attesta/contract/index.js";
import { WitnessContext } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";

/**
 * The private data behind a single attestation, from the issuer's side, OR
 * from a verifier's side after importing a D27 proof packet — the two are
 * distinguished by which optional fields are present, not by a separate
 * type, so the shared witnesses (`rawDataHash`, `validFrom`, `validUntil`,
 * `attestationSalt`, `attestationMerklePath`) keep working identically for
 * both.
 *
 * `commitment` starts undefined and must be filled in with the return value
 * of `registerAttestation(ref)` (issuer side, via `withCommitment`) or with
 * the packet's `commitment` field (verifier side, via
 * `withImportedProofPacket`) before `revokeAttestation`/`proveLive` can
 * build a Merkle path for this `ref`.
 *
 * `revocationSecret` is required to call `revokeAttestation` (it feeds
 * `recordOf`/`nullifierOf` in the circuit) but is never present on a
 * verifier-only record — a verifier that only imported a packet has no way
 * to revoke, on purpose.
 *
 * `issuerId`/`nullifierHash` feed the new `issuerIdWitness`/
 * `nullifierHashWitness` (D27) that `proveLive`'s read path uses instead of
 * rederiving from secret. They are required for *any* `proveLive(ref)`
 * call: an issuer populates them itself at registration time (see
 * `AttestaSimulator.registerAttestation`); a verifier gets them from the
 * imported packet (`withImportedProofPacket`).
 */
export type AttestationPrivateRecord = {
  readonly rawDataHash: Uint8Array;
  readonly validFrom: bigint;
  readonly validUntil: bigint;
  readonly revocationSecret?: Uint8Array;
  readonly salt: Uint8Array;
  commitment?: Uint8Array;
  readonly issuerId?: Uint8Array;
  readonly nullifierHash?: Uint8Array;
};

/**
 * The exact D27 proof packet an issuer exports for one attestation, once,
 * out-of-band, so a verifier can run `proveLive` on it indefinitely without
 * the issuer. Never `issuerSecret`/`revocationSecret` — see the module
 * comment above. `commitment` is included because it is needed to look up
 * the Merkle leaf (`attestationMerklePath` below); it is already public
 * (the disclosed return value of `registerAttestation` / a real leaf of the
 * on-chain `attestations` tree), so including it discloses nothing new.
 */
export type ProofPacket = {
  readonly rawDataHash: Uint8Array;
  readonly validFrom: bigint;
  readonly validUntil: bigint;
  readonly issuerId: Uint8Array;
  readonly nullifierHash: Uint8Array;
  readonly salt: Uint8Array;
  readonly commitment: Uint8Array;
};

export type AttestaPrivateState = {
  /**
   * Present only for an issuer's own private state (`registerAttestation`/
   * `revokeAttestation` read it via `issuerSecret()`). A verifier-only
   * private state built from imported proof packets
   * (`createVerifierPrivateState`) never has this — its `proveLive` calls
   * go through `issuerIdWitness`/`nullifierHashWitness` instead, which read
   * `AttestationPrivateRecord.issuerId`/`.nullifierHash`, not this field.
   */
  readonly issuerSecret?: Uint8Array;
  readonly records: Record<string, AttestationPrivateRecord>;
};

export const createAttestaPrivateState = (
  issuerSecret: Uint8Array,
  records: Record<string, AttestationPrivateRecord> = {},
): AttestaPrivateState => ({
  issuerSecret,
  records,
});

/**
 * Creates a verifier-only private state (D27): no `issuerSecret` at all,
 * only per-ref records built from imported proof packets (see
 * `withImportedProofPacket`). `registerAttestation`/`revokeAttestation`
 * would throw if ever called against a state built this way — by design, a
 * verifier that only imported packets can never write.
 */
export const createVerifierPrivateState = (
  records: Record<string, AttestationPrivateRecord> = {},
): AttestaPrivateState => ({
  issuerSecret: undefined,
  records,
});

/** Adds (or replaces) the private record for one attestation reference. */
export const withAttestationRecord = (
  state: AttestaPrivateState,
  ref: Uint8Array,
  record: AttestationPrivateRecord,
): AttestaPrivateState => ({
  ...state,
  records: { ...state.records, [refKey(ref)]: record },
});

/** Records the commitment returned by `registerAttestation(ref)`. */
export const withCommitment = (
  state: AttestaPrivateState,
  ref: Uint8Array,
  commitment: Uint8Array,
): AttestaPrivateState => {
  const key = refKey(ref);
  const existing = state.records[key];
  if (!existing) {
    throw new Error(
      `withCommitment: no private record for ref ${key}; call withAttestationRecord first`,
    );
  }
  return {
    ...state,
    records: { ...state.records, [key]: { ...existing, commitment } },
  };
};

/**
 * Builds and stores the verifier-side `AttestationPrivateRecord` for `ref`
 * from an imported D27 proof packet, in one shot — `rawDataHash`,
 * `validFrom`, `validUntil`, `salt`, `issuerId`, `nullifierHash`, and the
 * (public) `commitment` needed for the Merkle-path lookup.
 * `revocationSecret` is intentionally never set here: a verifier-only
 * record has no way to call `revokeAttestation`, on purpose.
 */
export const withImportedProofPacket = (
  state: AttestaPrivateState,
  ref: Uint8Array,
  packet: ProofPacket,
): AttestaPrivateState =>
  withAttestationRecord(state, ref, {
    rawDataHash: packet.rawDataHash,
    validFrom: packet.validFrom,
    validUntil: packet.validUntil,
    salt: packet.salt,
    issuerId: packet.issuerId,
    nullifierHash: packet.nullifierHash,
    commitment: packet.commitment,
  });

const refKey = (ref: Uint8Array): string => Buffer.from(ref).toString("hex");

const getRecord = (
  privateState: AttestaPrivateState,
  ref: Uint8Array,
): AttestationPrivateRecord => {
  const record = privateState.records[refKey(ref)];
  if (!record) {
    throw new Error(
      `Attesta witness: no private record for ref ${refKey(ref)}`,
    );
  }
  return record;
};

const getCommitment = (
  privateState: AttestaPrivateState,
  ref: Uint8Array,
): Uint8Array => {
  const record = getRecord(privateState, ref);
  if (!record.commitment) {
    throw new Error(
      `Attesta witness: ref ${refKey(ref)} has no commitment yet — ` +
        "registerAttestation must run (and its result stored via withCommitment) " +
        "before a Merkle path can be built for it",
    );
  }
  return record.commitment;
};

export const witnesses = {
  issuerSecret: ({
    privateState,
  }: WitnessContext<Ledger, AttestaPrivateState>): [
    AttestaPrivateState,
    Uint8Array,
  ] => {
    if (!privateState.issuerSecret) {
      throw new Error(
        "Attesta witness: this private state has no issuerSecret " +
          "(verifier-only state, D27) — issuerSecret() is only used by " +
          "registerAttestation/revokeAttestation, never by proveLive",
      );
    }
    return [privateState, privateState.issuerSecret];
  },

  rawDataHash: (
    { privateState }: WitnessContext<Ledger, AttestaPrivateState>,
    ref: Uint8Array,
  ): [AttestaPrivateState, Uint8Array] => [
    privateState,
    getRecord(privateState, ref).rawDataHash,
  ],

  validFrom: (
    { privateState }: WitnessContext<Ledger, AttestaPrivateState>,
    ref: Uint8Array,
  ): [AttestaPrivateState, bigint] => [
    privateState,
    getRecord(privateState, ref).validFrom,
  ],

  validUntil: (
    { privateState }: WitnessContext<Ledger, AttestaPrivateState>,
    ref: Uint8Array,
  ): [AttestaPrivateState, bigint] => [
    privateState,
    getRecord(privateState, ref).validUntil,
  ],

  revocationSecret: (
    { privateState }: WitnessContext<Ledger, AttestaPrivateState>,
    ref: Uint8Array,
  ): [AttestaPrivateState, Uint8Array] => {
    const record = getRecord(privateState, ref);
    if (!record.revocationSecret) {
      throw new Error(
        `Attesta witness: ref ${refKey(ref)} has no revocationSecret ` +
          "(verifier-only record imported from a proof packet, D27) — " +
          "revocationSecret(ref) is only used by revokeAttestation, never by proveLive",
      );
    }
    return [privateState, record.revocationSecret];
  },

  attestationSalt: (
    { privateState }: WitnessContext<Ledger, AttestaPrivateState>,
    ref: Uint8Array,
  ): [AttestaPrivateState, Uint8Array] => [
    privateState,
    getRecord(privateState, ref).salt,
  ],

  attestationMerklePath: (
    { privateState, ledger }: WitnessContext<Ledger, AttestaPrivateState>,
    ref: Uint8Array,
  ): [
    AttestaPrivateState,
    ReturnType<Ledger["attestations"]["pathForLeaf"]>,
  ] => {
    const commitment = getCommitment(privateState, ref);
    const path = ledger.attestations.findPathForLeaf(commitment);
    if (!path) {
      throw new Error(
        `Attesta witness: commitment for ref ${refKey(ref)} is not (yet) a leaf ` +
          "of the live attestations tree",
      );
    }
    return [privateState, path];
  },

  /**
   * D27 read-path witness. `issuerId` is required on the record for *any*
   * `proveLive(ref)` call — see the module comment above for how an issuer
   * vs. a verifier each populate it. Never falls back to deriving from
   * `issuerSecret()`: the whole point is that a verifier-only private state
   * can supply this without ever holding that secret.
   */
  issuerIdWitness: (
    { privateState }: WitnessContext<Ledger, AttestaPrivateState>,
    ref: Uint8Array,
  ): [AttestaPrivateState, Uint8Array] => {
    const record = getRecord(privateState, ref);
    if (!record.issuerId) {
      throw new Error(
        `Attesta witness: ref ${refKey(ref)} has no issuerId — ` +
          "issuerIdWitness(ref) is required by proveLive's read path (D27) " +
          "and must be populated either at registration time (issuer side) " +
          "or from an imported proof packet via withImportedProofPacket (verifier side)",
      );
    }
    return [privateState, record.issuerId];
  },

  /**
   * D27 read-path witness. `nullifierHash` is required on the record for
   * *any* `proveLive(ref)` call, same as `issuerIdWitness` above. Never
   * falls back to deriving from `revocationSecret(ref)`.
   */
  nullifierHashWitness: (
    { privateState }: WitnessContext<Ledger, AttestaPrivateState>,
    ref: Uint8Array,
  ): [AttestaPrivateState, Uint8Array] => {
    const record = getRecord(privateState, ref);
    if (!record.nullifierHash) {
      throw new Error(
        `Attesta witness: ref ${refKey(ref)} has no nullifierHash — ` +
          "nullifierHashWitness(ref) is required by proveLive's read path (D27) " +
          "and must be populated either at registration time (issuer side) " +
          "or from an imported proof packet via withImportedProofPacket (verifier side)",
      );
    }
    return [privateState, record.nullifierHash];
  },
};
