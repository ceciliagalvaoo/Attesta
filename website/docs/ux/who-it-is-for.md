---
title: Who It Is For
description: The institutional verifier, not the individual data subject — and why.
slug: /who-it-is-for
---

# Who It Is For

Attesta is built for the **institutional verifier** — a compliance or AML professional
at a bank, VASP, exchange, or payments company who needs to confirm a fact about a
counterparty. It is deliberately **not** built for the individual data subject (the
person whose credential is being checked) as the primary user, and that choice has a
specific, evidence-based reason.

## Why the institution, not the individual

The most direct precedent for "let people carry their own verified credential" is the
mobile driver's license (mDL / ISO 18013-5). In early 2026, certified mDL
infrastructure was available to roughly **41%** of the US population — but only about
**7%** had actually activated it by the end of 2025
([IDScan.net](https://idscan.net/blog/the-state-of-digital-ids-in-2026-a-complete-guide/);
[Biometric Update](https://www.biometricupdate.com/202605/us-states-deepen-mobile-id-rollouts-as-focus-shifts-to-verification-and-privacy)).
Certified, free, available infrastructure — and 7% activation. The bottleneck for
individual-credential adoption isn't cryptography; it's that most people have no
day-to-day reason to install a new identity tool.

Institutions are different. A VASP or bank already:

- Custodies digital assets and already operates cryptographic signing and verification
  as part of its regulated business (Midnight's institutional validator set — Worldpay,
  MoneyGram, Google Cloud — is evidence this infrastructure is already inside the
  regulated-finance perimeter, not something a compliance team would be adopting cold).
- Has a standing, recurring reason to check the same kind of fact repeatedly, not once.
- Can adopt a workflow change through a compliance/ops decision, not by convincing every
  individual customer to install something.

That's the deciding factor: **the institution is the actor with both the motive and the
infrastructure to use this today.** The individual data subject is a real person with a
real interest in this problem, but betting the product on their spontaneous adoption
inherits the mDL pattern — available, and mostly unused.

## Where the target sits

Attesta targets **small and mid-sized regulated institutions** specifically — not the
~6,000 members of closed registries like SWIFT's, and not consumer-facing identity
apps. It's the segment named directly in the FATF enforcement gap (
[The Problem](/the-problem)): institutions large enough to be regulated, small enough
that compliance cost is a genuinely bigger share of their operating budget than it is
for a global bank.

See [Personas](/personas) for the specific people this document was built around, and
[Adoption Path](/adoption-path) for how this maps to a real go-to-market motion.
