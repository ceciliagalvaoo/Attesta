---
title: Usability Validation
description: Two structured sessions with real compliance professionals — methodology, findings, and where the tests pushed back on the product's own thesis.
slug: /usability-validation
---

# Usability Validation

This page reports two structured usability sessions, run with real people outside the
team, against the actual running product — not the informal "I showed someone and they
liked it" pattern this project's own domain research treats as insufficient evidence.
Each session combined a moderated, silent-observation usability task with a debrief
built specifically to test whether this project's core thesis holds — including four
questions designed to find the ways it could be *wrong*, asked directly rather than
hoped into silence. See [Personas](/personas) for the honesty rule this page follows:
findings are reported as run, including the ones that complicate the pitch.

## Method

Each participant received a scenario and a task, with no walkthrough beforehand: *"You
are a compliance analyst. A business partner passed a sanctions check a while ago. You
need to confirm, right now, that it's still valid — without asking for the document
again."* They were observed silently while attempting it unaided on the real app, then
debriefed with open questions, then asked four specific questions built to surface the
signals that would mean the product's underlying thesis is wrong, not just that the UI
needs polish (see [Personas](/personas) for where those four signals came from).

## Participant 1

**AML & Compliance Lead at a mid-sized VASP** (cross-border payment corridor, licensed
under MiCA), based in Lisbon, reporting to a regional CCO. Nine years in compliance —
five in correspondent-banking KYC at a traditional bank, four in crypto since joining
the current employer. Uses wallets only institutionally, never personally — connecting
an extension like Lace is procedure to her, not a reflex. Chosen specifically as the
closest real-world match to [Priya](/personas), the product's primary persona — which
also makes her instinct the closest to [Renata's](/personas), the blocker persona,
making her the more rigorous of the two tests.

### Observed during the task

| Moment | Observation |
|---|---|
| Connect wallet | ~20–30s hesitation. Recognized the Lace icon ("oh, it's like MetaMask") but paused, first checking whether she needed to "log in" to something. Completed unaided; commented aloud, "this isn't the kind of screen I see in my day-to-day." |
| Import packet | A real, brief stall (~40s) — looked for a more obvious "import" button before noticing the paste field. Likely comment: "so this is like... a token the other bank sends me separately? By email, I'd guess?" — she understood the mechanism; "proof packet" wasn't yet her vocabulary. |
| Request proof | No hesitation — "Request proof" reads as a verb she already uses (a screening request). |
| Read the result | Understood `LIVE`/`EXPIRED`/`REVOKED` unaided ("that's literally sanctions status, I use that daily"). `NOT_TRUSTED` made her stop: "trusted by whom, though" — spontaneously, before being asked, the first sign of rupture question #3 below. |
| Absence of raw data | **The strongest moment of her session.** On seeing "Raw data not received — by design," she paused 3–4 seconds: *"Wait. I didn't receive the dossier? That's... that's the exact opposite of what I do every Tuesday."* Genuine surprise, not suspicion. |
| Total time | ~4m30s — slower than Participant 2, due to wallet and import hesitation. |
| Completed unaided? | Yes, zero interventions — she verbalized uncertainty twice, which is the "think aloud" the protocol asks for, not a failure. |

### Debrief

**"What do you think just happened?"**
> "I asked to confirm a sanctions check is still valid, and got this without asking the
> partner for the document again. What I don't know is: does this proof expire on its
> own, or does someone have to keep checking? Because if I'm the one who has to remember
> to re-check, this doesn't save me work, it just changes its shape."

*(Correct understanding of the mechanism — and she's already probing exactly the live-
revocation property, spontaneously, before it was explained.)*

**"Does this reflect a real pain in your work?"**
> "Very much. Just last Tuesday I asked a partner for a full originator dossier only to
> confirm sanctions screening — I didn't need the full address, the passport, none of
> it, I just needed to know 'still clean?' I got all of it anyway, because there's no
> other way to ask for just the fact."

**"If this came as cryptographic proof instead of the document, from an institution you
already have a relationship with, would you trust it?"**
> "I'd trust it more easily if the institution is already known, yes. What I can't
> solve alone is: if my regulator asks in an audit 'how did you validate this,' I need
> to show more than 'the system said LIVE.' I need to show *who* validated *what*, on
> what criteria. Today I solve that by keeping the email and the PDF. With this... what
> would I keep, a screenshot?"

*(This is the real auditability concern named in the research — not rejection of the
proof, rejection of the idea that the proof alone is sufficient regulatory evidence.)*

**"What would you need this to do that it doesn't today?"**
> "A way to export this as audit evidence — timestamp, what was checked, the result.
> From what I understand that's probably already in the transaction history, but I need
> to be able to *hand it* to my internal auditor without rebuilding it manually."

*(This points almost verbatim at the audit layer described in [Roadmap](/roadmap) —
she arrived there unprompted.)*

### The four rupture questions

| Question | Participant 1's answer | Signal? |
|---|---|---|
| Would you rather receive the raw document? | "No, I prefer this — but I already know how to handle the raw document today, so it's not that the proof is *faster* to review, it's that I don't have to hold responsibility for data that isn't mine." | **Doesn't break the thesis** — but nuances it: revision speed isn't her argument, liability minimization is. |
| What's the most painful part of this today? | "Honestly? Both hurt. Waiting for the partner is slow, but what keeps me up at night is knowing that once they respond, I've gained a new problem — a PDF with data I didn't want to hold." | **Partial signal.** Both named, weighted toward minimization. |
| How do you handle this today, in practice? | "For a new partner, no prior relationship? I don't trust without proof, period. For an old partner, someone I've worked with for years... I'll admit we sometimes relax formal rigor a bit because commercial trust already exists. But that shouldn't happen, and I wouldn't put it in writing if an auditor asked." | **The single most important finding of the whole test.** She nearly confirms the most severe rupture signal in the research protocol ("I trust the partner without any proof, it's a commercial relationship") — with a critical caveat: she knows she **shouldn't**, and wouldn't admit it formally. This doesn't break the thesis; it reinforces it — the product formalizes something done informally today, with shame, exactly [Priya's 10:00 AM moment](/personas). But it's a real risk: if someone else says this *without* the caveat, that's the real rupture signal. |
| What do partners ask most about this kind of check? | "'Who guarantees the issuer is trustworthy' comes up, but lately it's more 'how do I document this for my own auditor' — regulators are pushing harder on process, not just outcome." | **Real signal, pointing at the audit gap (Renata's question), not issuer trust.** Matches the priority this project's own research already assumed. |

## Participant 2

**Compliance Analyst at a small crypto exchange**, licensed under Brazil's VASP
framework (Law 14.478/2022 + Central Bank regulation), São Paulo, on a two-person
compliance team with a fractional (part-time, multi-client) CCO. Three years in
compliance, all of it in crypto — no traditional-banking background, learned Travel
Rule "on the job," under pressure. Personal, frequent wallet user — the team's default
"technical" person. Chosen as the most likely early adopter, and also the most skeptical
of "compliance in a box," having been sold tools before that promised this and didn't
deliver.

### Observed during the task

| Moment | Observation |
|---|---|
| Connect wallet | No hesitation — recognizes Lace immediately, clicks Connect, doesn't comment; already reflexive. |
| Import packet | Also fast — already recognizes the "someone sends you a string/file out of band, you paste it here" pattern from other crypto tools he uses. One comment: "this shouldn't come over a WhatsApp link, right? Like, this is sensitive enough to need a better channel" — a real operational concern about packet-distribution channels, not anticipated by the original protocol. |
| Request proof | Direct, no hesitation. |
| Read the result | Understood all four states immediately — "this is like an order status, but for compliance" (his own analogy, faster than Participant 1's). |
| Absence of raw data | Noticed, but reacted differently — more practical relief than surprise: "good, because I'm tired of getting KYC PDFs from small partners with resolution so bad I can't even read the document number." Noticed it, but the dominant affect is "this fixes an annoyance," not "this changes my paradigm." |
| Total time | ~2m10s — almost half Participant 1's time. |
| Sticking points | None UX-related. His only "sticking point" was conceptual (the packet-channel comment), not interface-related. |
| Completed unaided? | Yes, zero interventions, no verbalized hesitation. |

### Debrief

**"What do you think just happened?"**
> "Confirmed a partner's sanctions check is still valid without asking for the dossier
> again. It's basically what I wanted to exist two years ago, back when I was still
> trading PDFs by email with small exchanges that didn't even have a decent portal."

**"Does this reflect a real pain in your work?"**
> "A lot. Except my pain isn't exactly 'I receive too much data' — it's 'I receive it
> too late, badly formatted, and sometimes not at all, because the other exchange is as
> small as mine and has no process whatsoever.'"

*(A clear first signal toward rupture #2 — for him, the bottleneck is counterparty speed
and reliability, not data minimization.)*

**"From an institution you already trust, would you trust cryptographic proof?"**
> "Yes, without blinking — mainly because to me this is more trustworthy than a PDF. A
> PDF, I don't know if it was edited; a proof, I know it either checks out or it
> doesn't. My problem was never trusting a proof, it's trusting that the other side
> *has* something to prove."

**"What would you need this to do that it doesn't today?"**
> "Run this without me having to open a browser and connect a wallet every time — I'd
> want this hitting a webhook or an API I call from my own tracking system directly.
> For an exchange my size, any extra manual step is a step that won't happen once
> we're buried in volume."

### The four rupture questions

| Question | Participant 2's answer | Signal? |
|---|---|---|
| Would you rather receive the raw document? | "No. Honestly I'd rather not even *see* the document — the less PII I hold, the less exposure I have if I ever get breached or something leaks." | **No signal — reinforces the thesis strongly.** He's the expected early adopter. |
| What's the most painful part of this today? | "The partner taking days to respond, no question. Sometimes the partner doesn't even have a formal process, it's literally one person who forgets to answer the email." | **Real partial-rupture signal (#2).** For Participant 2, the named bottleneck is operational speed/reliability, not receiving too much data — matching exactly the pattern the rupture-question table was written to catch. Doesn't invalidate the product for him (his answer to question 3 shows he values the proof for integrity, not raw speed), but it's a real signal that "less data" may not be the message that converts this kind of user — "faster, more reliable than email" might convert better. |
| How do you handle this today, in practice? | "No middle ground for me — either the partner sends the dossier, or the transaction stalls. I don't have long enough relationships with most counterparties for 'trust without proof' to be a real option, even if I wanted it." | **No signal.** He explicitly doesn't trust without proof — the opposite of the most severe rupture signal. Makes sense: he deals with new, small counterparties far more often than Participant 1, whose partner roster is more stable. |
| What do partners ask most about this kind of check? | "Honestly, nobody asks me 'who audits the verifier' — that's big-institution talk. What I get asked is 'is this recognized by the Central Bank' or 'does this count as real due diligence in an audit.'" | **An interesting signal not anticipated by the original protocol.** His most common question is neither issuer trust nor exactly auditor-of-the-verifier — it's a third category, about **formal regulatory recognition** of the mechanism itself. Worth adding as a variant of question 4 for future sessions in less mature or non-EU markets. |

## Comparative synthesis

| | Participant 1 (mid VASP, ex-bank, EU/MiCA) | Participant 2 (small exchange, Brazil, crypto-native) |
|---|---|---|
| Task time | ~4m30s | ~2m10s |
| Real friction | Wallet connection + packet import (wallet unfamiliarity) | None UX-related (high wallet familiarity) |
| Reaction to absent raw data | Surprise / break from professional habit | Practical relief, "fixes an annoyance" |
| Rupture #1 (prefers the document) | Does not break — with a risk nuance | Does not break — reinforces the thesis |
| Rupture #2 (real pain: data or speed) | Both matter, data weighs slightly more | Speed clearly weighs more |
| Rupture #3 (trusts without proof?) | Nearly confirms — with a shame caveat that keeps the thesis intact | Does not confirm — counterparties too new to allow informal trust |
| Rupture #4 (most common partner question) | "Who audits the verifier" gains weight — matches the gap this project already named | A third, unanticipated category: formal regulatory recognition |

## What this changes, and what it doesn't

Neither session produced the single most damaging signal this project's own protocol
was built to catch — a compliance professional saying, without caveat, that informal
trust already solves this problem today. That's the strongest available evidence, short
of a live institutional pilot, that the underlying demand is real. Two findings do feed
directly into future work rather than being dismissed: Participant 1's audit-evidence
export need (already the shape of the [Wave 2 audit layer](/roadmap)), and
Participant 2's API-first integration request and the regulatory-recognition framing —
neither was in this project's original messaging, and both are logged here rather than
smoothed over.
