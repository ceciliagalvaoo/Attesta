---
title: Personas
description: Who the product decisions were derived from, and the honesty declaration that governs how they're used.
slug: /personas
---

# Personas

:::warning[Honesty declaration]
Every persona on this page is **composite** — derived from aggregated, institutional,
and public data (compliance cost surveys, breach-fine records, regulatory precedent,
digital-credential adoption studies), not from interviews. **None of them represents a
real individual, and none is presented anywhere in this project as a testimonial.**
This is worth stating plainly: no source found during this project's research
contained a first-person account of a data subject asking to "prove without exposing"
— all of the documented pain in this domain is institutional (a regulator, a bank, an
insurer, a hospital), not end-user. That finding directly shaped which persona is
primary. Where this project *did* run real usability sessions with real people, that
evidence is kept separate and labeled as such — see
[Usability Validation](/usability-validation).
:::

## Priya Chandran — the primary persona

**AML & Compliance Lead at a mid-sized VASP**, running a cross-border payment corridor.

| | |
|---|---|
| **Context** | Onboards and continuously monitors institutional counterparties (other VASPs, correspondent banks); triggers enhanced controls whenever a transaction crosses the Travel Rule threshold (FATF Recommendation 16) |
| **Institution size** | Small enough that compliance consumes **8.7%** of non-financial expense — nearly triple the relative weight at a large institution (2.9%) |
| **Today's tools** | Email/portal for document exchange with counterparties, an EDD tracking spreadsheet, a compliance case-management system, sanctions lists (World-Check/Dow Jones) |
| **What she already knows** | That KYC is the onboarding check and AML is the ongoing monitoring program it feeds — treating them as synonyms loses her trust in one sentence. That an *attestation* is a signed claim that can go stale, and *verification* is confirming, in real time, that it's still valid — an old "green checkmark" presented as current proof is exactly the failure mode she's trained to catch. That "compliant" without a named legal basis isn't a valid claim — it's the kind of vague statement behind the nine-figure fines she reads about. |

### The decisive moment

The moment that defines the product isn't the moment a document arrives — it's **10:00
AM**, when a partner triggers the Travel Rule threshold and Priya has to choose between
two bad options: ask for more data than the rule requires, or stall the transaction.
She formalizes the request for the full originator dossier, **knowing it violates the
data-minimization principle she'd cite to an auditor herself.** Not the highest-cost
moment of her day (that's 2:30 PM, when the dossier arrives and becomes her
responsibility) — the highest-**shame** moment. She knows the principle. She violates it
anyway, because there's no other way to confirm the fact.

Attesta exists to change that one instant — not the moment the data arrives, the moment
she's forced to ask for it. With Attesta, the emotional peak of her day moves to **9:25
AM**: confirming a proof is still valid, without ever seeing the raw document behind it
— not an old attestation being recycled, a *live* answer.

## Renata Souza — the blocker persona

**Head of Risk / CCO at the institution on the other side of Priya's transaction.**
Doesn't use the product directly — decides whether her institution accepts Priya's
proof as sufficient evidence, and can veto adoption entirely.

Her question, verbatim from the research this project is built on:

> *"If I accept this proof instead of doing my own diligence, who's accountable if it's
> wrong — and how do I audit the verifier who validated it?"*

The honest answer today is **we don't know yet.** No official Midnight example and no
broader precedent found during this project's research implements third-party audit of
the verifier itself. This is stated explicitly, not hidden — see
[Limitations](/limitations) and [Roadmap](/roadmap) for the concrete (not vague) sketch
of what a Wave 2 audit layer, built on the same commitment/Merkle-tree core, would need
to answer it.

## Diego Salcedo — the early adopter

**Compliance analyst at a small crypto exchange**, under mounting Travel Rule
enforcement pressure — living inside the 83%-legislated/40%-enforced gap directly, with
less budget to absorb the cost of manual compliance than a larger institution has.
Fewer internal approval layers than Priya (who answers to a formal CCO) make him the
most realistic candidate for an early, informal pilot.

## Two supporting personas

**Dana Whitfield** — a HIPAA Privacy Officer at a US regional hospital network, living
the identical problem (prove a fact about data without handing over the data) under a
different legal regime: the **Minimum Necessary Standard** (45 CFR §164.502(b), in
force since 2003) rather than the Travel Rule. She exists to validate that the domain is
genuinely cross-industry, not a finance-only story wearing a general label.

**Helena Duarte** *(illustrative, not operational)* — the individual whose credential is
being verified. Included specifically to explain, not obscure, why she isn't the
primary user: see [Who It Is For](/who-it-is-for) for the mDL adoption data that
disqualifies her as the adoption bet, without dismissing that her underlying interest in
this problem is real.

## The anti-persona

**The privacy-maximalist ("anon-first") user** — someone who wants to be invisible,
including to the regulator, and treats any selective disclosure of a fact as a
concession. This is explicitly *not* who Attesta is for: confusing selective disclosure
with total anonymity is the most common and most fatal category error in this domain —
regulators want accountability, not opacity. A product that helps someone hide from a
regulator isn't RegTech; it's the opposite of what a compliance officer needs, and it's
the confusion a technically literate reviewer catches on first read.
