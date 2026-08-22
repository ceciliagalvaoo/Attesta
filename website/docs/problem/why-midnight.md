---
title: Why Midnight
description: What actually breaks if you swap Midnight for a generic smart-contract chain.
slug: /why-midnight
---

# Why Midnight

The lazy version of this argument is "Midnight has zero-knowledge proofs, and we need
privacy." That argument is too weak to survive scrutiny on its own — plenty of chains
have ZK tooling. Here's the version that survives being asked, directly: *what,
specifically, breaks if you swap Midnight for Aztec, Aleo, or a generic EVM chain with a
ZK library bolted on?*

## The argument that isn't just "disclose() is free"

Compact's `disclose()` requirement — any witness value that reaches the ledger or a
circuit's return value must pass through an explicit `disclose()`, or the build fails at
**compile time** — is a genuine safety net. But by itself, it isn't a differentiator:
any chain with a compiler-enforced public/private boundary gives you something similar.

The defensible argument is the **pair**: `disclose()` *and* the
[`HistoricMerkleTree`](/compact-contract) as a native ledger-state type, backed by
Midnight's dual-ledger model (public and private state as first-class citizens of the
same contract, not a private layer bolted onto a public chain). Proving membership in a
set of live attestations — without revealing which member, and without the private
state ever leaving the witness side, not even encrypted — is what would otherwise have
to be hand-implemented in any other stack. Hand-implementing it introduces exactly the
kind of bug this project cannot afford: **treating a revoked attestation as still
valid.** That's not a hypothetical risk category — it's the specific invariant three of
the project's automated tests exist to prove holds, every time
(see [Tests](/tests)).

## What's genuinely Midnight-specific here, stated precisely

- **The compiler enforces the public/private boundary, not a design pattern.** A missing
  `disclose()` is a compile error with its own diagnostic category ("Witness and
  Disclosure Errors") — not a runtime bug a code reviewer might miss. One of this
  project's tests writes the leak on purpose and asserts the build fails, specifically
  to demonstrate this isn't a claim taken on faith.
- **`HistoricMerkleTree` as a ledger primitive, not a library.** Proving "this commitment
  is currently a member of this live set" without revealing which member is the exact
  mechanism [none of the five official Midnight identity examples](/difference-from-existing-examples)
  implement — because none of them need live revocation over a growing set. Attesta
  does, and the primitive existing natively in the language is what made building it in
  a hackathon-length window tractable at all.
- **The `kernel` ADT gives circuits access to real chain time.** `proveLive`'s validity
  check reads the actual block time the transaction lands in
  (`kernel.blockTimeLessThan`/`blockTimeGreaterThan`), not a value supplied by whoever
  is calling the circuit. See [Compact Contract](/compact-contract) for why this
  replaced an earlier, spoofable design — a dishonest caller could otherwise simply
  assert whatever "now" produced a `LIVE` result.

## The honest limit of this argument

Not every piece of this project is equally Midnight-specific, and pretending otherwise
would be exactly the kind of vague "compliant" claim this project's own domain research
flags as a credibility risk. A future aggregate-proof layer over many verification
receipts (see [Roadmap](/roadmap)) would rely on succinct proof size — and Aleo and
Aztec also produce constant-size proofs; that specific property isn't Midnight-exclusive.
What *would* remain Midnight-specific there is development cost: a compiler where
privacy is a first-class citizen, not a library layered on top, is what makes it
realistic to implement a private-state aggregation circuit correctly inside a
hackathon-scale build window without rewriting the stack from the ground up. That's a
cost argument, not an exclusive-property argument — and this document says so plainly,
rather than blurring the two.

## Infrastructure timing

Midnight reaching institutional mainnet on **31 March 2026**, with named validators from
regulated finance (Worldpay, MoneyGram, Google Cloud, Vodafone/Pairpoint) already
operating nodes, is what makes this buildable *now* rather than speculative — the target
persona ([Priya](/personas)) works at exactly the kind of institution already
represented in that validator set, not a hypothetical future adopter.

Midnight is currently in its **guarded era** — federated validators, not yet
permissionless — which this project states plainly wherever the network is described,
rather than calling it "fully decentralized."
