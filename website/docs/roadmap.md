---
title: Roadmap
description: Always future tense — never presented as already built.
---

# Roadmap

Every item on this page is written in the future tense on purpose. If any of this ever
appears described as already built anywhere in this project's materials before it
actually is, that's the exact failure mode this project's own honesty rule exists to
prevent — see [Limitations](./limitations).

## Wave 2 — the audit layer

The most concrete, most specified item on this roadmap, because it answers a real,
named, currently-unresolved question: [Renata's](./personas) *"who audits the
verifier?"*

Attesta **will add** an audit layer, reusing the same commitment and
[`HistoricMerkleTree`](./compact-contract) primitives already committed in Wave 1 — not
rewritten from a blank contract. The sketch:

1. Every time a verifier performs a check, it **will generate** a private receipt —
   witness data covering the checklist item, the declared risk, the outcome, and a
   timestamp — hashed via `persistentCommit`, the same primitive `registerAttestation`
   already uses.
2. Receipts **will accumulate** into a `HistoricMerkleTree` per period, reusing the exact
   tree type already proven out in Wave 1.
3. An auditor (a CCO, or a partner acting in Renata's role) **will be able to** request a
   proof that *all N receipts* in a period satisfy a declared policy — for example, "risk
   above the threshold implies enhanced due diligence was applied" — without opening any
   individual case. One proof, whose size doesn't grow with N.

This answers Renata's question **partially**, not completely — stated explicitly rather
than oversold, matching this project's own [Limitations](./limitations) and
[Why Midnight](./why-midnight) (constant-size proofs aren't Midnight-exclusive; the
defense that holds is development cost, not an exclusive property).

## Issuer trust — real integration, or a purpose-built alternative

Attesta **will evaluate** whether `midnight-trust-registry` has matured enough by the
time this work starts to integrate with it directly. If not, it **will build** a
purpose-built permissioning contract instead, rather than waiting indefinitely on an
external dependency of unconfirmed maturity. See
[Difference From Existing Midnight Examples](./difference-from-existing-examples) for
why that repository's maturity is currently unconfirmed, not assumed either way.

## A real sanctions-list connection

The `SIMULATED SANCTIONS LIST` **will be replaced** with a connection to a real
sanctions data feed — a scoped integration project, not a redesign of the core
mechanism, since the contract already treats the list as external, injectable state.

## Deployment beyond local devnet

Contract and frontend **will move** onto Midnight's public test networks
(`preview`/`preprod`), using the network's own public infrastructure — including its
publicly operated proof server, confirmed reachable during this project's own research
(see [Architecture](./architecture)) — so a judge or partner can use the product from a
hosted link without installing anything locally. This is explicitly conditional on the
local-devnet path being solid first, which it was, ahead of this project's own cut-off
date.

## Third-party wallet support beyond Lace

Today, generating a proof requires a local proof server running via Docker when using
Lace specifically — not a limit of the Midnight protocol, but of Lace's current
implementation (confirmed: at least one other Midnight wallet, 1AM, already runs its ZK
prover entirely in-browser via WASM, with no separate server). Attesta **will support**
browser-native proving as Lace — or an alternative wallet already implementing that mode
— makes it available, removing the local-installation requirement for end users. No
rewrite of the contract or circuit logic would be required; the change is entirely on
the wallet's proving side.

## What stays out of scope, on purpose

Not listed here because they're not planned, not because they were forgotten: a
governance token, a general-purpose policy DSL beyond the Wave 2 audit layer's fixed
initial policy, and multi-institution audit dashboards spanning more than one
verifier's own records at a time. Scope discipline is itself part of this project's
answer to the barema's "realistic roadmap" criterion — a roadmap that promises
everything promises nothing credibly.
