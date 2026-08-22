---
title: What We Built In Wave 1
description: A honest inventory — what's real, what's simulated, what's roadmap.
---

# What We Built In Wave 1

This page exists so nothing has to be inferred from the demo. Every line below is
labeled by what it actually is, using the same three labels used on screen and in the
video — `REAL`, `SIMULATED`, `ROADMAP` — because [the project's honesty rule](./limitations)
is binary: a label has to match, identically, in the UI, this documentation, and the
video, or the underlying claim doesn't get made at all.

## REAL — built, running, tested end to end

- **A single Compact contract** implementing `registerAttestation`, `revokeAttestation`,
  `proveLive`, and `setTrustedIssuer`. Compiles clean with `compactc 0.31.1` against
  `@midnight-ntwrk/compact-runtime 0.16.0`. See [Compact Contract](./compact-contract).
- **A `HistoricMerkleTree` of live attestations**, paired with a public nullifier map for
  revocation — chosen after confirming, by compiling minimal snippets against the real
  toolchain, that the tree type supports insertion and membership checks but not
  in-place removal. See [Architecture](./architecture) for why that constraint shaped the
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
  wallet accounts. See [Demo Walkthrough](./demo-walkthrough).
- **Live revocation**, confirmed to propagate to the verifier panel without a page
  reload and without a new request to the issuer.
- **14 automated tests**, plus a dedicated compile-time check that a `disclose()`-less
  witness leak fails the build rather than just failing at runtime. See [Tests](./tests).
- **A reproducible local devnet** (`npm run standalone`) with pinned ports, matching
  Lace's own default configuration for the `Undeployed` network with zero manual setup
  beyond installing Docker.

## SIMULATED — labeled identically wherever it appears

- **`SIMULATED TRUST LIST`** — the list of issuers the verifier considers trustworthy is
  a demo dataset, populated by clicking a button in the issuer panel, not by any
  governance process. Issuer trust (who *should* be allowed to issue attestations) is a
  real, unresolved product question — see [Limitations](./limitations).
- **`SIMULATED SANCTIONS LIST`** — the "Sanctions screening (OFAC/EU/UN lists)"
  verification-type option is demonstration context, not a live feed from any real
  sanctions authority.
- **`DEMO PARTICIPANT`** — counterparty institutions named in the demo (e.g. "Meridian
  Trust Bank") are fictitious, kept in dedicated fixtures, never mixed with real data.

## ROADMAP — future tense, never presented as built

- A third **audit-layer panel** for a party like [Renata](./personas), reusing the same
  commitment/Merkle-tree primitives already committed in Wave 1 — not a rewrite. See
  [Roadmap](./roadmap).
- Real integration with (or a from-scratch alternative to) `midnight-trust-registry`,
  pending confirmation that project has matured enough to depend on.
- A connection to a real sanctions-list feed.
- Deployment to a public Midnight test network (`preview`/`preprod`), with the contract
  and hosted frontend both pointed at Midnight's own public infrastructure — condition-
  al on the local-devnet cut-off being met first, which it was, with room to spare. See
  [How To Run](./how-to-run) for the exact commands this claim is checkable against.
