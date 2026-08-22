---
title: The Problem
description: Why "just send the file" is the default, and what it costs.
---

# The Problem

## A registry for this already exists — and it's closed

The [SWIFT KYC Registry](https://www.swift.com/our-solutions/compliance-and-shared-services/financial-crime-compliance/kyc-registry)
already lets close to **6,000 financial institutions and 60+ central banks**, across
200+ countries, verify a correspondent once and reuse that verification instead of
re-collecting the same documents from scratch. It works. It just isn't open — it's
infrastructure for members of a large-institution club, built at a scale small and
mid-sized VASPs, exchanges, and regional banks don't have the volume or budget to join.

## The rule that most directly tests reuse between institutions is failing to close

The FATF Travel Rule (Recommendation 16) requires institutions to share and verify
originator/beneficiary information above a transaction threshold — the exact scenario
where "reconfirm what a partner already checked" matters most. The FATF's own 2026
report on virtual asset service providers finds:

> **83%** of surveyed jurisdictions have legislated the Travel Rule. Only **40%**
> actually enforce it.
> — [FATF, 2026](https://www.fatf-gafi.org/en/news/targeted-updated-va-vasps-2026.html)

That 43-point gap is not primarily a legislative problem. It's an infrastructure
problem: reconfirming a partner's verification is expensive and manual enough that,
most of the time, institutions either skip it or over-collect to be safe — asking for
the entire dossier instead of the one fact the rule actually requires.

## Compliance cost is regressive — it hits small institutions hardest

- Average annual AML/KYC spend at a financial institution: **US$72.9 million** (the UK
  leads, at US$78.4M) — [Fenergo, via fintech.global (2026)](https://fintech.global/2026/04/27/the-true-cost-of-poor-aml-compliance-in-2026/).
- Compliance consumes **8.7%** of non-financial expense at small institutions, versus
  **2.9%** at large ones — nearly triple the relative weight — FDIC data via internal
  discovery research.
- Total cost of financial-crime compliance, US + Canada: **US$61 billion/year**; adding
  EMEA, **US$206 billion+** globally —
  [LexisNexis Risk Solutions (2024)](https://risk.lexisnexis.com/about-us/press-room/press-release/20240221-true-cost-of-compliance-us-ca).

The institutions that would benefit most from reusable verification are the ones least
able to afford building or joining private infrastructure to get it.

## Why this doesn't happen with a document instead of a proof

The obvious alternative — "just email the PDF, but require a password" — doesn't solve
the actual problem: the verifier still receives, and becomes responsible for, personal
data it didn't need and didn't ask to hold.

- Extra cost of a data breach beyond incident response: **€174,538** on average, per
  violation — [SecurePrivacy (2026)](https://secureprivacy.ai/blog/cost-of-gdpr-compliance).
- The highest single GDPR fine of 2025 was **€530 million** (TikTok, Irish DPC, May
  2025, for unlawful EU→China data transfer); total GDPR fines in 2025: **€1.2
  billion** — [Kiteworks (2026)](https://www.kiteworks.com/gdpr-compliance/gdpr-fines-data-privacy-enforcement-2026/).

Holding data you didn't need to hold isn't a neutral inconvenience. It's a liability a
compliance officer inherits every time they ask for more than the rule requires — and
today, asking for more is usually the only way to get an answer at all.

## Why this is solvable now, specifically

- Midnight has been in production mainnet since **31 March 2026**, with named
  institutional validators (Google Cloud, Vodafone/Pairpoint, Worldpay, Bullish,
  MoneyGram) — the same institutional profile as Attesta's target user, already running
  production infrastructure on this network —
  [Midnight Network](https://midnight.network/blog/worldpay-and-bullish-join-midnight-s-alliance-of-federated-node-operators-ahead-of-mainnet).
- eIDAS 2.0 (Regulation (EU) 2024/1183, in force since 20 May 2024) makes selective
  disclosure a *legal design requirement*, not an optional privacy feature — EU member
  states must have a certified EUDI Wallet by December 2026, and the private sector must
  accept it by the end of 2027.
- The compliance/AML domain formalized the tension between competitive secrecy and risk
  visibility over a decade ago (Abbe, Khandani & Lo, MIT, 2011 — [arXiv:1111.5228](https://arxiv.org/abs/1111.5228))
  and has continued proposing decentralized, privacy-preserving protocols since (Cao et
  al., Financial Cryptography 2020) — the problem is well known and unsolved in
  production, not a novel idea being retrofitted with cryptography for its own sake.

See [Why Midnight](./why-midnight) for why this specific infrastructure, not just "some
blockchain," is what makes the mechanism possible.
