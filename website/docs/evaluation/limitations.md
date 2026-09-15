---
title: Limitations
description: Stated identically here, in the README, and in the video — the project's one binary honesty rule.
slug: /limitations
---

# Limitations

This project runs one binary rule with no middle ground: **every `SIMULATED` label
matches, word for word, on screen, in the README, and in the video** — and every
limitation below is declared identically across this documentation, the README, and the
video. If a judge finds a limitation stated in only one of those places, or finds one
that isn't declared anywhere, that's treated as a bigger loss than declaring it plainly
up front ever would be.

## 1. The trusted-issuer list and the sanctions list are simulated

`SIMULATED TRUST LIST` and `SIMULATED SANCTIONS LIST`, labeled identically wherever they
appear. **Real issuer governance — who should be allowed to issue attestations, and
under what authority — is not resolved this Wave.** The contract stores the flag
(`trustedIssuers`); deciding who belongs on it is a product and governance question this
Wave deliberately doesn't answer. `setTrustedIssuer` is unauthenticated on purpose for the
demo, so any wallet can add or remove an issuer on the `SIMULATED TRUST LIST`. See
[Roadmap](/roadmap).

## 2. "Who audits the verifier?" is not answered in Wave 1

[Renata's question](/personas) — *if I accept your proof instead of doing my own
diligence, who's accountable, and how do I audit the verifier who validated it?* — has
no answer here. What exists instead is a concrete, non-vague sketch of what a Wave 2
audit layer, built on the same commitment/Merkle-tree primitives already committed in
Wave 1, would need to answer it. See [Roadmap](/roadmap).

## 3. Business validation is real, but limited in scope — and the next steps are already planned

Four structured usability sessions were run with real compliance and privacy
professionals outside the team — see [Usability Validation](/usability-validation) for
the full protocol, findings, and the parts of the sessions that pushed back on this
project's own thesis rather than confirming it. **What this is not:** a commercial
pilot, a paying customer, or engagement with an institution's formal procurement or
compliance-approval process. No institution, auditor, or regulator has adopted or
endorsed this product. The usability sessions are real signal from real people in the
target role — reported as exactly that, not inflated into "validated with the market."
Widening this is a named, concrete next step, not left open-ended: see
[Adoption Path](/adoption-path) for exactly who gets approached next and why, and
[Business Model Canvas](/business-model-canvas) for the honest state of the revenue
question specifically — the least-developed part of this project's own business
thinking, named rather than left implicit.

## 4. The network-effect argument is a thesis, strengthened by early signal, not a demonstrated fact

The parallel to the SWIFT KYC Registry — value growing with issuer/verifier adoption —
is presented as a thesis, because it is one: this build has two fictitious demo
counterparties and four real usability-test participants, not a live network of
independent institutions transacting through it. The four real sessions are reported as
early qualitative signal (see [Usability Validation](/usability-validation)), not as
evidence the network effect itself has been observed. Generating that evidence is what
[Adoption Path](/adoption-path) exists to do — a network effect can't be demonstrated by
building more product, only by real institutions actually using it, which is exactly the
gap that page's pilot plan targets.

## 5. Two named official Midnight repositories have unconfirmed maturity

`midnight-trust-registry` (created 2026-05-18) and `midnight-passport-sdk` (created
2026-07-30) were both created in the weeks immediately before this hackathon, with no
substantial public README found during this project's research. Any future integration
with either depends on a maturity check not yet performed. See
[Difference From Existing Midnight Examples](/difference-from-existing-examples).

## 6. The issuer panel received a deliberately minimal UX budget

A conscious allocation decision, not an oversight: the verifier panel is where this
project's UX time and the emotional arc of the demo both concentrate, because that's
where [Priya's decisive moment](/personas) lives.

## 7. Neither panel has a production deployment yet, and won't until a security audit happens

The contract and both panels are fully built and tested end to end against Midnight's
local devnet (`Undeployed`) — the environment this project's cut-off condition was
measured against. The contract is also deployed to `preprod`, a public test network (see
[What We Built In Wave 1](/what-we-built-in-wave-1) for exactly which transactions exist
there). What hasn't happened: long-running
production operation, a security audit, or exposure to adversarial load — and none of
those are skipped in the plan going forward: see
[Roadmap](/roadmap#production-deployment-gated-on-a-security-audit) for the explicit commitment that a
security audit precedes any deployment handling real institutional data, not just a
public testnet demo.

## 8. `proveLive` is not unlinkable across calls

To check revocation, trust and the validity window against real chain state, `proveLive`
discloses the attestation's `nullifierHash`, `issuerId`, `validFrom` and `validUntil` on
every call. An observer can therefore tell that two `proveLive` transactions concern the
same attestation, and link them to a later revocation (which publishes the same
`nullifierHash`). The raw data and the tree position still never leave the witness side.
Each `proveLive` is also a real transaction whose DUST fee the verifier pays. Reducing
this linkage is [roadmap](/roadmap), not Wave 1.

## 9. The verifier's private state lives in memory

Imported proof packets are held in memory: reloading the page loses them, and the packet
has to be imported again. Persistent private state is roadmap.
