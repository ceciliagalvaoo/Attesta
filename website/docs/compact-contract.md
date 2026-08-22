---
title: Compact Contract
description: The circuits, the witnesses, and the pitfalls a real build against this toolchain surfaces.
---

# Compact Contract

Source: [`contract/src/attesta.compact`](https://github.com/ceciliagalvaoo/Attesta/blob/main/contract/src/attesta.compact).
Built and tested against `compactc 0.31.1` / `@midnight-ntwrk/compact-runtime 0.16.0` —
this exact version pair, confirmed matching before any circuit logic was written,
because a compiler/runtime mismatch is a documented, easy-to-misdiagnose failure mode in
this toolchain (errors show up as confusing runtime behavior with no obvious link to the
actual cause).

## The ledger state

```compact
export ledger attestations: HistoricMerkleTree<10, Bytes<32>>;
export ledger revokedNullifiers: Map<Bytes<32>, Boolean>;
export ledger trustedIssuers: Map<Bytes<32>, Boolean>;
```

- `attestations` — an append-only commitment tree. Its root is the single public
  artifact standing for "every attestation ever registered." A fresh Merkle path proves
  membership without revealing which leaf is being proven.
- `revokedNullifiers` — the live/revoked status of each attestation, keyed by a
  per-attestation nullifier only computable by someone already holding that
  attestation's private witness data.
- `trustedIssuers` — the `SIMULATED TRUST LIST`. The contract stores the flag; who
  belongs on it is a governance question this Wave doesn't resolve (see
  [Limitations](./limitations)).

## The private record

```compact
struct AttestationRecord {
  rawDataHash: Bytes<32>;
  validFrom: Uint<64>;
  validUntil: Uint<64>;
  issuerId: Bytes<32>;      // persistentHash(issuerSecret)
  nullifierHash: Bytes<32>; // persistentHash(revocationSecret)
}
```

Only `persistentCommit(record, salt)` — the commitment — ever becomes part of the public
ledger, as a leaf of `attestations`. No field of this struct is disclosed as a group;
individual fields are disclosed only where a circuit explicitly needs them public.

## The three circuits

### `registerAttestation(ref: Bytes<32>): Bytes<32>` — issuer

Computes the commitment from witness data (the raw attestation record never leaves the
issuer's side) and inserts it as a new leaf of the live `attestations` tree. Only the
32-byte commitment — opaque, meaningless without the witness data that produced it — is
disclosed, both as the tree insertion and as the circuit's return value.

### `revokeAttestation(ref: Bytes<32>): []` — issuer

Proves the caller knows the full private preimage of a commitment that's genuinely a
member of the live tree, then marks that attestation's nullifier revoked. This is the
authorization pattern used throughout this contract instead of trusting a caller's
identity directly — see "The `ownPublicKey()` trap" below. The public delta is exactly
one entry flipping in `revokedNullifiers`, keyed by a nullifier not derivable from the
public commitment or tree alone: watching this call in isolation tells an observer "one
attestation was revoked," never which one, which issuer, or what it concerned.

### `proveLive(ref: Bytes<32>): [LivenessStatus, Bytes<32>]` — verifier

```compact
export enum LivenessStatus {
  LIVE,
  EXPIRED,
  REVOKED,
  NOT_TRUSTED
}
```

Proves, from the proof-packet fields the verifier was handed out of band (never the raw
document itself): (a) membership of the corresponding commitment in the live
`attestations` tree today; (b) the validity window hasn't expired, checked against the
real chain block time via `kernel`, not a caller-supplied value; (c) the signing issuer
is on the trust list. Only the result — a four-state enum, not a bare boolean, so the
panel can show `LIVE`/`EXPIRED`/`REVOKED`/`NOT_TRUSTED` as visibly distinct states — and
the issuer's public id pass `disclose()`.

## Why the verifier doesn't need the issuer's secret (the D27 correction)

An architecture review during the build found a real gap: `issuerId` and
`nullifierHash` were originally *always* recomputed inside the circuit from the secret
witnesses `issuerSecret()`/`revocationSecret(ref)` — used by all three circuits, with no
variant. That's correct for `registerAttestation`/`revokeAttestation`, where proving you
hold the real secret *is* the authorization check. It's wrong for `proveLive`: without
handing the verifier the issuer's actual secret (unacceptable — that secret authorizes
*minting new attestations* as that issuer), a verifier with genuinely separate private
state could never reconstruct the right commitment, and every proof would fail.

The fix: two witnesses used only on the `proveLive` path —

```compact
witness issuerIdWitness(ref: Bytes<32>): Bytes<32>;
witness nullifierHashWitness(ref: Bytes<32>): Bytes<32>;
```

— feeding a parallel `recordForProveLive(ref)` circuit that `proveLive` calls instead of
the secret-derived `recordOf(ref)` that `registerAttestation`/`revokeAttestation` still
use, unchanged. This is safe specifically because `proveLive` still requires the
recomputed commitment to match a real leaf in the tree (`assert(path.leaf == commitment)`
+ `assert(attestations.checkRoot(root))`) — `persistentCommit` is binding, so supplying a
wrong or borrowed `issuerId`/`nullifierHash` simply produces a commitment that matches no
real leaf, and the proof fails closed. Nobody can forge liveness for an attestation they
don't hold the real proof packet for; write-side authorization (who can register or
revoke) is completely unchanged.

## The proof packet, precisely

The seven fields the issuer's **Export proof packet** button produces, and the only
seven fields it ever contains:

```
rawDataHash, validFrom, validUntil, issuerId, nullifierHash, salt, commitment
```

`commitment` is already public (the return value of `registerAttestation`) — it's
included only because the verifier's client needs it to locate the right leaf via the
indexer; including it discloses nothing new. **`issuerSecret` and `revocationSecret`
never appear in the packet, structurally** — those are the two values that let someone
mint or revoke attestations as the issuer, and the whole point of the redesign above was
making sure the verifier never needs them.

## Pitfalls this build actually hit

1. **ZKIR has no cross-contract calls.** One contract, from the first line — see
   [Architecture](./architecture).
2. **A `disclose()`-less leak is a compile error, not a runtime bug.** One of the three
   required tests writes the leak on purpose and asserts the build fails with the
   correct diagnostic category ("Witness and Disclosure Errors") — see [Tests](./tests).
3. **`ownPublicKey()` never authenticates a caller.** It's an ordinary witness function
   — any caller can implement it to return anything. The sound pattern used throughout
   this contract instead: store `persistentHash(issuerSecret)` at registration, and at
   every gated action recompute the hash from the witness and assert it matches — gated
   by a real Merkle membership check, not by trusting what the caller claims to be.
4. **`persistentHash`/`persistentCommit` vs. `transientHash`/`transientCommit` are not
   interchangeable.** Only the `persistent*` family is stable across compiler upgrades —
   it's the one that composes the tree leaf and anything written to public state.
   `transient*` is optimized for use inside a circuit but carries no cross-version
   stability guarantee; nothing derived from it is ever stored on the ledger here.
5. **Salt reuse breaks hiding.** Every `persistentCommit` call in this contract uses a
   fresh salt per attestation — reusing one across two different attestations would
   break the commitment scheme's hiding property.
6. **`HistoricMerkleTree` supports insertion and membership checks, not removal.**
   Confirmed by compiling minimal snippets against the real toolchain before writing the
   contract, not assumed from documentation. This single fact is *why* revocation is a
   separate nullifier map rather than "delete the leaf" — see [Architecture](./architecture).

See [How To Run](./how-to-run) for the exact commands to compile and test this contract
yourself.
