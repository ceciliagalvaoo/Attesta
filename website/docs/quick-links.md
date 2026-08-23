---
title: Quick Links
description: Attesta — reusable proof that a compliance verification still holds.
slug: /
---

# Attesta

**Reusable proof that a compliance verification still holds.**
*Ask for the fact. Not the file.*

Built by **Cecília Galvão** ([@ceciliagalvaoo](https://github.com/ceciliagalvaoo)) and
**Pablo Azevedo** ([@zzaved](https://github.com/zzaved)) for the
[Midnight Buildathon](https://app.akindo.io/wave-hacks/jaMZjqPOBsLXvjdG) (Wave 1, AKINDO
/ Midnight Foundation).

| | |
|---|---|
| **Live app** | [attesta-rx88.onrender.com](https://attesta-rx88.onrender.com) — hosted frontend, connects to the Attesta contract deployed on Midnight's public `preprod` network at `4f2cd18fd2c09aef3960f5159d29981fa4470a6bb26b2c1e0ce36537e6362f97`; the app has a **"How to test this demo"** button in its header — a short in-app walkthrough for anyone evaluating it without live guidance. See [What We Built In Wave 1](/what-we-built-in-wave-1) for exactly what's real versus roadmap |
| **This documentation** | [ceciliagalvaoo.github.io/Attesta](https://ceciliagalvaoo.github.io/Attesta/) |
| **Source code** | [github.com/ceciliagalvaoo/Attesta](https://github.com/ceciliagalvaoo/Attesta) |
| **Compact contract** | [`contract/src/attesta.compact`](https://github.com/ceciliagalvaoo/Attesta/blob/main/contract/src/attesta.compact) |
| **License** | Apache 2.0 |
| **Network (Wave 1)** | Midnight local devnet (`undeployed`) — the environment the cut-off condition is measured against |

## Where to go from here

- **New to the problem?** Start with [The Problem](/the-problem) and [Who It Is For](/who-it-is-for).
- **Want the mechanism?** [User Flow](/user-flow) walks the whole issuer → verifier cycle; [Architecture](/architecture) and [Compact Contract](/compact-contract) go under the hood.
- **Want to run it yourself?** [How To Run](/how-to-run) is a copy-paste path from a clean checkout to two working panels; [Tests](/tests) covers what's automated and why.
- **Judging this submission?** [What We Built In Wave 1](/what-we-built-in-wave-1), [Demo Walkthrough](/demo-walkthrough), [Difference From Existing Midnight Examples](/difference-from-existing-examples), and [Limitations](/limitations) are written specifically for that read.

## One line

> Attesta is a living registry of reusable compliance attestations: a compliance officer
> asks a partner institution to reconfirm a fact — sanctions clear, originator screened —
> and gets an answer that's provably still valid *right now*, without ever receiving or
> storing the file behind it.
