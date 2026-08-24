---
title: What We Built In Wave 1
description: A honest inventory — what's real, what's simulated, what's roadmap.
slug: /what-we-built-in-wave-1
---

# What We Built In Wave 1

This page exists so nothing has to be inferred from the demo. Every line below is
labeled by what it actually is, using the same three labels used on screen and in the
video — `REAL`, `SIMULATED`, `ROADMAP` — because [the project's honesty rule](/limitations)
is binary: a label has to match, identically, in the UI, this documentation, and the
video, or the underlying claim doesn't get made at all.

## REAL — built, running, tested end to end

- **A single Compact contract** implementing `registerAttestation`, `revokeAttestation`,
  `proveLive`, and `setTrustedIssuer`. Compiles clean with `compactc 0.31.1` against
  `@midnight-ntwrk/compact-runtime 0.16.0`. See [Compact Contract](/compact-contract).
- **A `HistoricMerkleTree` of live attestations**, paired with a public nullifier map for
  revocation — chosen after confirming, by compiling minimal snippets against the real
  toolchain, that the tree type supports insertion and membership checks but not
  in-place removal. See [Architecture](/architecture) for why that constraint shaped the
  design, not the other way around.
- **`proveLive` reading real chain time** via the `kernel` ADT
  (`kernel.blockTimeLessThan`/`blockTimeGreaterThan`), not a caller-supplied timestamp —
  a correction made after the original design (caller-supplied "now") was identified as
  spoofable before it shipped.
- **The full issuer → verifier proof-packet cycle**, including two genuinely separate
  private-state identities (never shared between the two panels) and a verifier-side
  circuit path (`recordForProveLive`, `issuerIdWitness`/`nullifierHashWitness`) added
  specifically so the verifier never needs the issuer's secret to prove liveness
  independently.
- **Two connected UI panels** — issuer and verifier — wired end to end to the contract
  via `AttestaAPI`, tested manually against a real local devnet with two separate Lace
  wallet accounts. See [Demo Walkthrough](/demo-walkthrough).
- **Live revocation**, confirmed to propagate to the verifier panel without a page
  reload and without a new request to the issuer.
- **14 automated tests**, plus a dedicated compile-time check that a `disclose()`-less
  witness leak fails the build rather than just failing at runtime. See [Tests](/tests).
- **A reproducible local devnet** (`npm run standalone`) with pinned ports, matching
  Lace's own default configuration for the `Undeployed` network with zero manual setup
  beyond installing Docker.
- **A real `preprod` deployment, with the full cycle validated end to end on it.** The
  frontend is live —
  [attesta-rx88.onrender.com](https://attesta-rx88.onrender.com), hosted via a
  [`render.yaml`](https://github.com/ceciliagalvaoo/Attesta/blob/main/render.yaml)
  Blueprint, built from a pre-compiled contract checked into the repo so Render's build
  environment never needs the Compact toolchain — and the Attesta contract is deployed
  on Midnight's public `preprod` test network at
  `4f2cd18fd2c09aef3960f5159d29981fa4470a6bb26b2c1e0ce36537e6362f97`, a real deploy proved
  against the public proof server, not a simulation. Getting there required working
  around the official faucet being intermittently stuck for an extended period
  (confirmed against reports on the
  [official forum](https://forum.midnight.network/), not just this project's own
  experience) by using the alternate faucet Midnight's own current documentation lists
  (`docs.midnight.network/guides/acquire-tokens`). The full issuer → verifier cycle —
  trust, register, export, import, `LIVE`, revoke, `REVOKED` — was then run to completion
  against this exact deployment in a real browser, with two separate
  [1AM](https://1am.xyz/) wallet accounts and real testnet funds, after live testing found
  genuine bugs in Lace on `preprod` that blocked it there (see
  [Demo Walkthrough](/demo-walkthrough)). See [How To Run](/how-to-run) for the exact
  commands both this and the local-devnet claim are checkable against.

## SIMULATED — labeled identically wherever it appears

- **`SIMULATED TRUST LIST`** — the list of issuers the verifier considers trustworthy is
  a demo dataset, populated by clicking a button in the issuer panel, not by any
  governance process. Issuer trust (who *should* be allowed to issue attestations) is a
  real, unresolved product question — see [Limitations](/limitations).
- **`SIMULATED SANCTIONS LIST`** — the "Sanctions screening (OFAC/EU/UN lists)"
  verification-type option is demonstration context, not a live feed from any real
  sanctions authority.
- **`DEMO PARTICIPANT`** — counterparty institutions named in the demo (e.g. "Meridian
  Trust Bank") are fictitious, kept in dedicated fixtures, never mixed with real data.

## ROADMAP — future tense, never presented as built

- A third **audit-layer panel** for a party like [Renata](/personas), reusing the same
  commitment/Merkle-tree primitives already committed in Wave 1 — not a rewrite. See
  [Roadmap](/roadmap).
- Real integration with (or a from-scratch alternative to) `midnight-trust-registry`,
  pending confirmation that project has matured enough to depend on.
- A connection to a real sanctions-list feed.
- A security audit, before any deployment handling real institutional data — see
  [Roadmap](/roadmap#production-deployment-gated-on-a-security-audit) for the explicit commitment, and
  [Limitations](/limitations) for the current, unaudited state of both the local devnet
  and `preprod` deployments.
