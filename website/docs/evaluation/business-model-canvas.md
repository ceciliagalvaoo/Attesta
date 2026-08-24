---
title: Business Model Canvas
description: How this would actually be sold — validated where the project has evidence, labeled as thesis where it doesn't.
slug: /business-model-canvas
---

# Business Model Canvas

This page exists because of a gap this project already admits in
[Limitations](/limitations): business validation is real but limited in scope, and the
network-effect argument is a thesis, not a demonstrated fact. A canvas doesn't close that
gap by itself — but it forces every part of "how this makes money" into the open,
labeled by how much evidence actually backs it, instead of leaving "business model"
as an implied afterthought to the technical build.

**Reading key, used in every block below:**
- **Grounded** — backed by research already cited elsewhere in this documentation, or by
  this project's own [usability sessions](/usability-validation).
- **Thesis** — a reasoned inference from the grounded parts, not yet tested with a real
  institution's procurement process.

---

## Customer Segments — Grounded

Two sides of one registry, not one customer type:

- **Issuers** — institutions that already perform a compliance check (sanctions
  screening, Travel Rule originator verification, EDD review) and want to answer repeat
  requests for proof of it without re-sending the underlying file each time.
- **Verifiers** — institutions that receive a transaction from a counterparty and need to
  confirm a partner's compliance check is still valid before proceeding.

In practice, the same institution plays both roles depending on which side of a
transaction it's on — this isn't two separate markets, it's one registry with two
directions of use, the same way SWIFT's KYC Registry members both publish and consume
KYC records.

**Who specifically:** small and mid-sized regulated institutions — VASPs, exchanges,
payments companies — outside the ~6,000-member SWIFT KYC Registry and too small for
compliance cost to be a rounding error (FDIC: compliance is **8.7%** of non-financial
expense at small institutions vs. **2.9%** at large ones, see [The Problem](/the-problem)).
See [Who It Is For](/who-it-is-for) and [Personas](/personas) for the full reasoning
behind targeting institutions over individual data subjects.

---

## Value Propositions — Grounded

- **For verifiers:** confirm a compliance fact in seconds, without ever receiving or
  storing the counterparty's raw data — collapsing [Priya's 10:00 shame
  moment](/user-flow) (asking for more than the rule requires) into a request that only
  ever returns the fact, not the file. Reduces the liability of custodying PII the
  institution never needed in the first place.
- **For issuers:** answer the same verification request as many times as it's asked,
  indefinitely, without re-sending the document or being online for every request — the
  proof packet is handed over once; every future check runs on the verifier's own
  machine.
- **The differentiator that survives scrutiny:** not "privacy" as a slogan — live
  **revocation as public state** (an attestation that goes bad is provably `REVOKED` the
  moment the issuer says so, for every verifier holding a copy of the proof packet, with
  no coordination) is the piece [none of the five official Midnight identity/credential
  examples](/difference-from-existing-examples) implement, and the piece that makes reuse
  actually trustworthy instead of reuse-until-something-goes-wrong.

---

## Channels — Thesis

Not a self-serve web-app signup — a regulated-compliance product doesn't sell that way,
and the [issuer/verifier panels built in Wave 1](/what-we-built-in-wave-1) are a reference
demo, not the shipped customer-facing product. Two channels, in order of how soon each
is realistic:

1. **Direct relationship, pilot-first** — the same motion [Adoption
   Path](/adoption-path) already describes: one issuer, one verifier, one real
   attestation type, a structured debrief. This is how the first institutions would
   actually be reached, not through marketing.
2. **API-first integration into compliance tooling institutions already run** —
   surfaced unprompted by a real usability-test participant (see [Usability
   Validation](/usability-validation)), who wanted to call `proveLive` from their own
   systems rather than through a browser session every time. This is the realistic
   long-run channel: Attesta as infrastructure a compliance platform calls, not a
   destination a compliance officer navigates to.

---

## Customer Relationships — Thesis

High-touch at first, by necessity: a compliance team adopting a new way to handle
regulated data needs a real relationship, not a click-through terms-of-service — matching
what [Adoption Path](/adoption-path) already describes as the realistic first-pilot
motion (fewer internal approval layers at a smaller institution, a structured debrief
using the same rupture-testing method this project's own two usability sessions used).
Self-serve is not the near-term model; whether it ever becomes one depends on how issuer
trust governance evolves (see [Roadmap](/roadmap) and [Limitations](/limitations) item 1
— the `SIMULATED TRUST LIST` in this Wave stands in for a real governance process this
project hasn't designed yet).

---

## Revenue Streams — Thesis, the least developed block on this page

This is the part [Limitations](/limitations) is pointing at when it calls business
validation limited in scope. No pricing has been tested with a real institution's
procurement process. Three structurally different models, not mutually exclusive, worth
naming honestly instead of leaving "revenue" unaddressed:

1. **Per-verification fee** — a small charge each time `proveLive` is run against the
   shared registry, billed to the verifier. Matches the product's natural unit (one
   check, one answer) the same way a credit-check API bills per lookup.
2. **Registry membership fee** — issuers and/or verifiers pay to participate in the
   shared registry, independent of how many checks they run — the direct analogy to how
   the [SWIFT KYC Registry](/the-problem) operates today, membership-funded rather than
   metered per lookup.
3. **Self-hosted licensing** — an institution (or a consortium of institutions) runs its
   own permissioned deployment of the Attesta contract instead of joining a shared
   registry, paying for the software/support relationship instead of a usage fee. Trades
   away cross-institution network effects for institutions unwilling to depend on a
   third-party-operated registry.

Which of these (or what mix) is realistic is not decidable from this project's own
research — it depends on real institutional budget conversations that haven't happened
yet (see [Limitations](/limitations) item 3). Naming the three options honestly is the
correct scope for this Wave; picking one without that evidence would be exactly the kind
of unearned specificity this project's own honesty rule exists to prevent.

---

## Key Resources — Grounded

- **The contract mechanism itself** — the `HistoricMerkleTree` + nullifier-map revocation
  pattern and the D27 proof-packet architecture (see [Compact
  Contract](/compact-contract)) are the actual IP: the specific way live revocation and
  cross-verifier reuse are achieved without a trusted intermediary.
- **The relationship with Midnight's public network infrastructure** — the indexer, node,
  and proof server this project's `preprod` deployment runs against are Midnight
  Foundation-operated, not infrastructure this project would need to build or maintain
  itself (see [Architecture](/architecture)).
- **Compliance-domain fluency** — the vocabulary discipline (attestation vs.
  verification, named legal bases, no unqualified "compliant" claims) that [The
  Problem](/the-problem) and [Personas](/personas) are built around is itself a resource:
  it's what lets this product survive first contact with a real compliance officer
  instead of losing credibility on vocabulary alone.

---

## Key Activities — Thesis

- **Protocol maintenance and security auditing** — an explicit commitment before any
  production deployment handling real institutional data (see
  [Roadmap](/roadmap#production-deployment-gated-on-a-security-audit)), not optional infrastructure work.
- **Issuer trust governance** — designing and running whatever process decides who
  belongs on a real trust list, replacing the `SIMULATED TRUST LIST` this Wave uses as a
  placeholder (see [Limitations](/limitations) item 1 and [Roadmap](/roadmap) for the
  "issuer trust" plan specifically).
- **Integration support** — helping a partner institution's own compliance tooling call
  into the registry (the API-first channel above), not just operating a standalone web
  app.

## Key Partners — Thesis

- **Midnight Network / Midnight Foundation** — the public test/production infrastructure
  this project's `preprod` deployment already depends on (see [Why
  Midnight](/why-midnight)); a real partnership here (rather than only unilateral
  reliance on public infrastructure) would matter more once volume grows past a
  hackathon-scale demo.
- **A founding group of institutions** — the same bootstrap problem the [SWIFT KYC
  Registry](/the-problem) itself solved by launching with a critical mass of founding
  banks, not a slow organic trickle. [Adoption Path](/adoption-path)'s pilot plan is the
  first, small-scale version of finding that group.
- **Compliance software vendors**, as a possible integration channel — unvalidated, but
  the same participant who asked for API access (see Channels above) is exactly the kind
  of signal that would make this partnership category worth pursuing next.

## Cost Structure — Thesis

- **Security audit and ongoing protocol maintenance** — the largest named cost before any
  real institutional data flows through the registry (see
  [Limitations](/limitations) item 7).
- **Infrastructure** — comparatively low relative to a fully self-hosted alternative,
  because Midnight's own public indexer/node/proof-server infrastructure is reused rather
  than operated from scratch (see [Architecture](/architecture)) — though a
  production deployment handling real institutional volume would need its own capacity
  and reliability analysis this Wave hasn't done.
- **Regulatory and legal cost of operating adjacent to regulated data flows** — not
  quantified here; a real cost category for any entity operating shared compliance
  infrastructure, named rather than omitted.
- **Business development** — the direct-relationship, pilot-first channel above is
  inherently more expensive per customer than self-serve software, at least until the
  registry has enough participating institutions for network effects to lower that cost
  the way they eventually did for SWIFT's own registry.

---

## What this canvas doesn't claim

No institution has seen this pricing. No revenue model has been tested against a real
procurement process. This canvas exists to make every assumption behind "how this makes
money" checkable and named, not to claim the business model is validated — see
[Limitations](/limitations) for the same admission made in the project's own binary
honesty rule, applied here as everywhere else in this documentation.
