---
title: Adoption Path
description: Who adopts first, why, and what happens after the hackathon.
---

# Adoption Path

## Who adopts first

[Diego's profile](./personas) — a compliance analyst at a small, crypto-native VASP or
exchange, operating inside the FATF's enforcement gap directly (83% of jurisdictions
have legislated the Travel Rule; only 40% enforce it) — is the realistic first adopter,
for a specific reason: **fewer internal approval layers.** Priya, the primary persona,
reports to a formal CCO and would need a compliance-committee decision before piloting
anything new. An analyst at a smaller institution with more informal internal process
can test a workflow change without that overhead — the same dynamic this project's own
[usability sessions](./usability-validation) surfaced directly: Participant 2 (matching
Diego's profile closely) completed the task in under half the time of Participant 1, and
answered "would you trust this" without hesitation.

## Why small institutions specifically

[The Problem](./the-problem) names the FDIC finding directly: compliance consumes
**8.7%** of non-financial expense at small institutions versus **2.9%** at large ones —
nearly triple the relative weight. The institutions with the strongest incentive to
adopt a cheaper way to reconfirm a partner's verification are the ones least able to
absorb the current manual cost, and least likely to ever qualify for closed
infrastructure like the SWIFT KYC Registry's ~6,000-member club.

## What a pilot looks like

1. **One issuer, one verifier, one real attestation type** (sanctions screening is the
   most legible starting point — it's already the demo's own scenario). No governance
   process for the trust list yet; a pilot doesn't need one.
2. **Both sides run the actual product** — the two-panel flow already built and tested,
   not a mockup. See [Demo Walkthrough](./demo-walkthrough) for exactly what that
   experience is.
3. **A structured debrief**, using the same rupture-testing method already run twice
   during this project's own build (see [Usability Validation](./usability-validation))
   — because the fastest way to find out the thesis is wrong is to ask the four
   questions that would prove it wrong, directly, not to wait for the market to reveal
   it slowly.

## What happens after the hackathon

- Conversations with two or three additional institutions matching [Diego's
  profile](./personas), specifically to test the packet-distribution-channel concern
  Participant 2 raised unprompted (see [Usability Validation](./usability-validation)) —
  a real operational gap this project's own testing surfaced, not yet solved.
- The [Wave 2 audit layer](./roadmap), timed to directly address the blocker persona's
  question before it becomes the reason a partner institution declines to accept
  Attesta's proof as sufficient evidence.
- Evaluation of an API-first integration path (raised directly by Participant 2) for
  institutions that want to call `proveLive` from their own compliance tooling, not
  through a browser session every time.

## What this project deliberately isn't claiming

No institution has adopted this product commercially. No regulator has endorsed it. The
[usability sessions](./usability-validation) are real signal from real people in the
target role, reported as exactly that — not inflated into "validated with the market."
See [Limitations](./limitations) for the same statement, made identically everywhere
this project describes its own traction.
