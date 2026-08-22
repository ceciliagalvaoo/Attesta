---
title: What It Does
description: The mechanism in plain terms, before any cryptography.
---

# What It Does

Two institutions — an **issuer** and a **verifier** — need to share a single fact:
*"the compliance check you already ran on this counterparty is still valid."* Today,
sharing that fact means sharing the file behind it: a sanctions-screening report, a KYC
dossier, a Travel Rule originator record. Attesta lets the issuer answer the question
without ever handing over the file.

## The three moves

1. **The issuer registers an attestation.** It commits to a fact — "originator X passed
   sanctions screening, valid until date Y" — on the Midnight ledger. Only a
   cryptographic commitment and the validity window become public. The document behind
   the fact never leaves the issuer's machine.
2. **The issuer hands the verifier a proof packet — once, out of band.** Not the
   document. A small bundle of values that lets the verifier reconstruct the same
   commitment and locate it in the public ledger, without ever seeing what's inside it.
3. **The verifier proves liveness itself, as many times as it wants.** Using the packet,
   the verifier's own machine generates a zero-knowledge proof that the attestation is
   (a) a real member of the live-attestations set, (b) still within its validity window,
   right now, checked against the real chain clock, and (c) signed by an issuer the
   verifier trusts. The result — `LIVE`, `EXPIRED`, `REVOKED`, or `NOT_TRUSTED` — is the
   only thing that becomes visible. The verifier never contacts the issuer again to
   re-check; it never needs the issuer to be online.

## The one property that makes this different from "send a PDF, but encrypted"

Revocation is **live public state**, not a promise. If the issuer revokes the
attestation the moment after handing over the proof packet, every verifier holding that
packet gets `REVOKED` on the next check — instantly, with no coordination, no callback,
no shared database between the two institutions. This is the piece [none of the five
official Midnight identity/credential examples](./difference-from-existing-examples)
implement, and it's the reason the mechanism needed a
[`HistoricMerkleTree` + nullifier-set architecture](./compact-contract) instead of a
simpler "issue and forget" credential.

## What never leaves the issuer's side

- The raw document behind the attestation (the sanctions report, the KYC file).
- The issuer's signing secret (`issuerSecret`) — the key that lets it *mint or revoke*
  attestations as itself.

## What becomes public

- A `persistentCommit` of the attestation record — an opaque 32-byte value, meaningless
  without the packet that produced it.
- The Merkle root of the live-attestations tree.
- The validity window (`validFrom`/`validUntil`) — disclosed at proof time so `proveLive`
  can check it against the real chain clock without trusting a caller-supplied
  timestamp. See [Compact Contract](./compact-contract) for why this is a deliberate
  trade-off, not an oversight.
- Whether a specific nullifier has been revoked — without revealing which raw
  attestation, which issuer, or which tree leaf it corresponds to.

See [User Flow](./user-flow) for the full walk with a named scenario, and
[Architecture](./architecture) for the diagram.
