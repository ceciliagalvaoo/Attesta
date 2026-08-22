---
title: Difference From Existing Midnight Examples
description: Named, line by line, against the five official repositories that touch the same territory.
slug: /difference-from-existing-examples
---

# Difference From Existing Midnight Examples

The fair version of the hardest question a reviewer familiar with Midnight's official
examples will ask isn't "is this original" in the abstract — it's *"I know these five
repositories by heart; show me the line that isn't in any of them."* This page answers
that directly, by name, rather than asserting novelty in general terms.

| Repository | What it demonstrates | What it doesn't cover |
|---|---|---|
| [`example-zkloan`](https://github.com/midnightntwrk/example-zkloan) ("ZK Loan") | A single privacy-preserving credit decision — credit data stays on the applicant's machine, only the loan outcome lands on-chain | One fact, proved once. No revocation of a past decision, and no path for a *second, independent* institution to reuse that proof later. |
| [`midnight-did`](https://github.com/midnightntwrk/midnight-did) | A reference `did:midnight` method — Compact contract, DID domain model, TypeScript API | Identifier resolution, not the lifecycle of a fact asserted *about* an identity — no notion of an attestation going stale or being revoked. |
| [`midnight-verifiable-credentials`](https://github.com/midnightntwrk/midnight-verifiable-credentials) | The W3C issuer → holder → verifier structure for a verifiable credential | Reuse across *multiple, independent* verifiers who are neither the issuer nor the original holder — the credential model assumes the holder re-presents it each time, not that a second verifier reconfirms a prior verifier's check. No live-revocation state a verifier can watch update in real time. |
| [`midnight-trust-registry`](https://github.com/midnightntwrk/midnight-trust-registry) | The piece that would, in principle, answer "who is a legitimate issuer" | Created 2026-05-18, weeks before this hackathon, with no README or substantial public description found during this project's research — maturity unknown, not confirmed production-ready. Even mature, it answers issuer trust, not revocation-with-live-state or cross-verifier reuse. |
| [`midnight-passport-sdk`](https://github.com/midnightntwrk/midnight-passport-sdk) | Binding a proof to a physical identity document (e.g. a passport) | A one-time binding to a document, not an ongoing, reusable, revocable attestation a third-party institution can reconfirm months later. Created 2026-07-30, similarly unconfirmed maturity. |

## What none of the five implements

A `HistoricMerkleTree` of live attestations whose membership a verifier can re-check at
any time, paired with a public nullifier set that a revocation writes to — so "this
attestation, issued months ago, is still good" (or isn't) is a fact anyone holding the
proof packet can check for themselves, indefinitely, without asking the issuer again.
That's two specific, named gaps, not a vague originality claim:

1. **Revocation as live state**, not a one-time issuance. See
   [Compact Contract](/compact-contract) for the nullifier-map mechanism this required,
   and why it's a nullifier set rather than tree removal (the tree type doesn't support
   in-place removal — confirmed empirically, not assumed).
2. **Reuse across independent verifiers** who are neither the issuer nor the original
   holder — the proof-packet handoff described in [User Flow](/user-flow) and
   [Architecture](/architecture) is the mechanism this project built specifically
   because none of the five examples needed it.

## Why this is stated here, in the open

The alternative to naming this explicitly is having a reviewer who already knows these
five repositories find the overlap themselves — which reads as either not having done
the homework, or having something to hide. Declared origin is responsible engineering;
origin discovered by a reviewer is a credibility loss this project chooses not to risk.
See [Ecosystem Attribution](/ecosystem-attribution) for what this project's own
starting point (the official `create-mn-app` scaffold and the `bboard` example) actually
is, stated with the same directness.
