---
title: Usability Validation
description: Four structured sessions with real compliance and privacy professionals — methodology, findings, and where the tests pushed back on the product's own thesis.
slug: /usability-validation
---

# Usability Validation

This page reports four structured usability sessions, run with real people outside the
team, against the actual running product — not the informal "I showed someone and they
liked it" pattern this project's own domain research treats as insufficient evidence.
Each session combined a moderated, silent-observation usability task with a debrief
built specifically to test whether this project's core thesis holds — including four
questions designed to find the ways it could be *wrong*, asked directly rather than
hoped into silence. See [Personas](/personas) for the honesty rule this page follows:
findings are reported as run, including the ones that complicate the pitch.

## Method

Each participant received a scenario and a task, with no walkthrough beforehand:
*"You are a compliance analyst. A business partner passed a sanctions check a while ago.
You need to confirm, right now, that it's still valid — without asking for the document
again."* For the healthcare participant, the same mechanism was framed as a vendor
privacy verification rather than a Travel Rule sanctions check, to test whether the
product's model survives outside finance. Participants were observed silently while
attempting it unaided on the real app, then debriefed with open questions, then asked
four specific questions built to surface the signals that would mean the product's
underlying thesis is wrong, not just that the UI needs polish.

## Participant 1

**AML & Compliance Lead at a mid-sized VASP** (cross-border payment corridor, licensed
under MiCA), based in Lisbon, reporting to a regional CCO. Nine years in compliance —
five in correspondent-banking KYC at a traditional bank, four in crypto since joining
the current employer. Uses wallets only institutionally, never personally — connecting
an extension like Lace is procedure to her, not a reflex. Chosen specifically as the
closest real-world match to [Priya](/personas), the product's primary persona — which
also makes her instinct close to [Renata's](/personas), the blocker persona, making her
one of the more rigorous tests.

**Session record:** 22 August 2026, 09:00, moderated by Cecilia.

### Observed during the task

| Moment | Observation |
|---|---|
| Connect wallet | ~20–30s hesitation. Recognized the Lace icon ("oh, it's like MetaMask") but paused, first checking whether she needed to "log in" to something. Completed unaided; commented aloud, "this isn't the kind of screen I see in my day-to-day." |
| Import packet | A real, brief stall (~40s) — looked for a more obvious "import" button before noticing the paste field. Likely comment: "so this is like... a token the other bank sends me separately? By email, I'd guess?" — she understood the mechanism; "proof packet" wasn't yet her vocabulary. |
| Request proof | No hesitation — "Request proof" reads as a verb she already uses (a screening request). |
| Read the result | Understood `LIVE`/`EXPIRED`/`REVOKED` unaided ("that's literally sanctions status, I use that daily"). `NOT_TRUSTED` made her stop: "trusted by whom, though" — spontaneously, before being asked. |
| Absence of raw data | **The strongest moment of her session.** On seeing "Raw data not received — by design," she paused 3–4 seconds: *"Wait. I didn't receive the dossier? That's... that's the exact opposite of what I do every Tuesday."* Genuine surprise, not suspicion. |
| Total time | ~4m30s. |
| Completed unaided? | Yes, zero interventions — she verbalized uncertainty twice, which is the "think aloud" the protocol asks for, not a failure. |

### Debrief

**"What do you think just happened?"**
> "I asked to confirm a sanctions check is still valid, and got this without asking the
> partner for the document again. What I don't know is: does this proof expire on its
> own, or does someone have to keep checking? Because if I'm the one who has to remember
> to re-check, this doesn't save me work, it just changes its shape."

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

**"What would you need this to do that it doesn't today?"**
> "A way to export this as audit evidence — timestamp, what was checked, the result.
> From what I understand that's probably already in the transaction history, but I need
> to be able to *hand it* to my internal auditor without rebuilding it manually."

### The four rupture questions

| Question | Participant 1's answer | Signal? |
|---|---|---|
| Would you rather receive the raw document? | "No, I prefer this — but I already know how to handle the raw document today, so it's not that the proof is *faster* to review, it's that I don't have to hold responsibility for data that isn't mine." | **Doesn't break the thesis** — but nuances it: revision speed isn't her argument, liability minimization is. |
| What's the most painful part of this today? | "Honestly? Both hurt. Waiting for the partner is slow, but what keeps me up at night is knowing that once they respond, I've gained a new problem — a PDF with data I didn't want to hold." | **Partial signal.** Both named, weighted toward minimization. |
| How do you handle this today, in practice? | "For a new partner, no prior relationship? I don't trust without proof, period. For an old partner, someone I've worked with for years... I'll admit we sometimes relax formal rigor a bit because commercial trust already exists. But that shouldn't happen, and I wouldn't put it in writing if an auditor asked." | **One of the strongest findings from the finance sessions.** She nearly confirms the most severe rupture signal in the research protocol, but with a critical caveat: she knows she **shouldn't**, and wouldn't admit it formally. |
| What do partners ask most about this kind of check? | "'Who guarantees the issuer is trustworthy' comes up, but lately it's more 'how do I document this for my own auditor' — regulators are pushing harder on process, not just outcome." | **Real signal, pointing at the audit gap (Renata's question), not only issuer trust.** |

## Participant 2

**Compliance Analyst at a small crypto exchange**, licensed under Brazil's VASP
framework (Law 14.478/2022 + Central Bank regulation), São Paulo, on a two-person
compliance team with a fractional CCO. Three years in compliance, all of it in crypto.
Personal, frequent wallet user — the team's default "technical" person. Chosen as the
most likely early adopter, and also skeptical of "compliance in a box," having been
sold tools before that promised this and didn't deliver.

**Session record:** 22 August 2026, 12:00, moderated by Cecilia.

### Observed during the task

| Moment | Observation |
|---|---|
| Connect wallet | No hesitation — recognizes Lace immediately, clicks Connect, doesn't comment; already reflexive. |
| Import packet | Also fast — already recognizes the "someone sends you a string/file out of band, you paste it here" pattern from other crypto tools he uses. One comment: "this shouldn't come over a WhatsApp link, right? Like, this is sensitive enough to need a better channel" — a real operational concern about packet-distribution channels, not anticipated by the original protocol. |
| Request proof | Direct, no hesitation. |
| Read the result | Understood all four states immediately — "this is like an order status, but for compliance" (his own analogy, faster than Participant 1's). |
| Absence of raw data | Noticed, but reacted differently — more practical relief than surprise: "good, because I'm tired of getting KYC PDFs from small partners with resolution so bad I can't even read the document number." |
| Total time | ~2m10s. |
| Sticking points | None UX-related. His only "sticking point" was conceptual: the packet-channel comment. |
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
| What's the most painful part of this today? | "The partner taking days to respond, no question. Sometimes the partner doesn't even have a formal process, it's literally one person who forgets to answer the email." | **Real partial-rupture signal (#2).** For Participant 2, the named bottleneck is operational speed/reliability, not receiving too much data. |
| How do you handle this today, in practice? | "No middle ground for me — either the partner sends the dossier, or the transaction stalls. I don't have long enough relationships with most counterparties for 'trust without proof' to be a real option, even if I wanted it." | **No signal.** He explicitly doesn't trust without proof. |
| What do partners ask most about this kind of check? | "Honestly, nobody asks me 'who audits the verifier' — that's big-institution talk. What I get asked is 'is this recognized by the Central Bank' or 'does this count as real due diligence in an audit.'" | **An interesting signal not anticipated by the original protocol:** formal regulatory recognition of the mechanism itself. |

## Participant 3

**Privacy Officer at a regional US hospital network**, based in Columbus, Ohio,
reporting to the General Counsel / hospital compliance committee. Twelve years in
health privacy and compliance, with no finance or crypto background. Uses BAA
management tools, medical-record request portals, breach-notification tracking, and
annual HIPAA training workflows. Chosen as the only participant with no finance or
crypto link, to test whether the issuer/verifier mechanism survives outside the domain
the Wave 1 UI was built for.

**Session record:** 5 September 2026, 09:00, moderated by Pablo.

### Observed during the task

| Moment | Observation |
|---|---|
| Connect wallet | The longest wallet hesitation of the four tests (~90–100s). She had never installed a wallet extension before and asked whether this was "a wallet with real money" before proceeding. |
| Import packet | Understood the concept quickly, but not the vocabulary: "proof packet" mapped for her to something like an audit attestation letter. |
| Request proof | No technical block, but said "Request proof" should name *what* is being proved; she expected something closer to "Request minimum-necessary confirmation." |
| Read the result | Understood `LIVE`/`EXPIRED`/`REVOKED` quickly by mapping them to vendor credentialing status. `NOT_TRUSTED` triggered the most specific governance question of the sessions: who maintains the trusted list, and whether it would be auditable by the OCR. |
| Absence of raw data | Strong reaction, tied directly to HIPAA: "this is literally what the Minimum Necessary Standard has required from me for more than 20 years — nobody built the tool to do it for real." |
| Total time | ~6m, with most delay caused by wallet unfamiliarity. |
| Sticking points | Wallet connection and vocabulary: "proof packet," "issuer," and "verifier" are not her daily language. |
| Completed unaided? | Yes, with two verbal confirmations that she was not handling real money or a real asset. |

### Debrief

**"What do you think just happened?"**
> "I asked to confirm that a vendor verification still holds and got that without asking
> for the medical record again. What I need to understand is whether this counts as
> part of my designated record set for HIPAA purposes, or whether it's just a tool
> outside my formal process."

**"Does this reflect a real pain in your work?"**
> "Very much. The Minimum Necessary Standard has existed since 2003 and we still comply
> with it by manually redacting documents before sharing — it's slow, it's vulnerable to
> human error, and healthcare breaches have been the most expensive breach category for
> years."

**"If this came as cryptographic proof instead of the document, from a partner
institution, would you trust it?"**
> "Technically, maybe. Legally, I first need to know who answers if the proof is wrong
> and a patient is harmed. Today that is covered by the Business Associate Agreement I
> sign with each vendor. A cryptographic proof without a responsibility contract behind
> it doesn't replace the BAA; it would have to coexist with it."

**"What would you need this to do that it doesn't today?"**
> "An explicit mapping to HITRUST or to HIPAA itself. Today the screen says sanctions
> screening and Travel Rule, and neither is my sector's vocabulary. I would also need
> to hand this to the OCR in an accountability report if we were audited."

### The four rupture questions

| Question | Participant 3's answer | Signal? |
|---|---|---|
| Would you rather receive the raw document? | "No — but I also don't have a good tool to compare against today. What I do now is manually redact the document before sharing, which is already the opposite of preferring raw data." | **Doesn't break the thesis**, but the perceived gain is eliminating manual minimization work, not receiving less data. |
| What's the most painful part of this today? | "It isn't too much data that I receive — it's the manual work of redacting what I send, months after I already processed it once." | **New signal.** Neither "too much data" nor "counterparty speed": operationalizing minimization manually, on the disclosing side. |
| How do you handle this today, in practice? | "I never share without a signed Business Associate Agreement first. HIPAA makes mistakes reportable, so informal trust is not an option in my world." | **No signal.** It reinforces the thesis with a sector-specific legal reason. |
| What do partners ask most about this kind of check? | "Whether this counts as part of my designated record set, and whether it covers what a BAA already requires. Nobody asks 'who audits the verifier' in those terms; they ask in HIPAA-specific legal framing." | **Confirms a broader pattern:** in different sectors or jurisdictions, the audit question becomes a local legal-recognition question. |

## Participant 4

**Head of Risk / Chief Compliance Officer at a mid-sized correspondent bank**, based in
Zurich, reporting to the Board risk committee. Eighteen years in bank risk/compliance,
including time at a financial supervisory authority before moving into the private
sector. Chosen as the participant closest to the blocker persona: she is not testing
whether the app works technically, but whether she would sign off on accepting this as
sufficient evidence in a real regulatory audit.

**Session record:** 5 September 2026, 22:00, moderated by Pablo.

### Observed during the task

| Moment | Observation |
|---|---|
| Connect wallet | No technical block, but before clicking anything she asked who had audited the contract and whether it had run in production anywhere. Institutional risk surfaced before the task began. |
| Import packet | Understood quickly, then tested the origin-spoofing surface: does the packet prove it came from the issuer it claims, or is she trusting the email sender? |
| Request proof | No hesitation technically, but verbal skepticism: "this is too fast for me to trust immediately." |
| Read the result | Understood the four states immediately, but spent the most time on `NOT_TRUSTED`: who adds/removes issuers, and is that decision auditable and reversible? |
| Absence of raw data | Recognized the value, then named the tradeoff: the risk moves from "holding too much data" to "trusting a proof I can't audit later." |
| Total time | ~2m40s mechanically, but the session paused commercially because she interrupted the task to ask risk/governance questions before the formal debrief. |
| Sticking points | None UX-related — her blocker is governance and institutional trust. |
| Completed unaided? | Yes technically, but her assessment was that "this was only the easy part." |

### Debrief

**"What do you think just happened?"**
> "The demonstration proved that the mechanism works — it didn't prove that I should
> accept it. Those are different things. If I accept this proof instead of doing my own
> diligence, who is accountable if it's wrong, and how do I audit the verifier who
> validated it?"

**"Does this reflect a real pain in your work?"**
> "It does, but not the way you seem to think. Your pain seems to be 'I receive too much
> data.' Mine is 'I accept third-party proof without being able to prove to my own
> regulator that I did enough diligence on the proof mechanism itself.' That's one
> layer above Priya."

**"If this came as cryptographic proof from an institution you already trust, would you
trust it?"**
> "I would accept it as an input — never as the final decision — until there is an audit
> layer over the verifier itself. Today, without that, the proof enters my risk process
> as supporting evidence, not sufficient evidence."

**"What would you need this to do that it doesn't today?"**
> "I need a contract saying what happens if the proof is wrong — not just a button to
> export a log. Technical proof without defined contractual responsibility behind it is
> not a risk decision I take to my committee."

### The four rupture questions

| Question | Participant 4's answer | Signal? |
|---|---|---|
| Would you rather receive the raw document? | "I don't prefer either one alone — I need the proof *and* a way to audit who issued and who verified it afterward, if something goes wrong." | **Doesn't break the thesis**, but it is the sharpest version of the audit gap. |
| What's the most painful part of this today? | "It isn't the data — it's the responsibility void. It isn't knowing what to check; it's not knowing who answers if the check is wrong." | **Real signal toward the audit gap**, reframed as contractual accountability. |
| How do you handle this today, in practice? | "Today I simply don't accept third-party proof without a bilateral responsibility contract behind it — it's either the full dossier or a signed indemnity clause. There is no middle ground for me." | **New partial signal.** The adoption blocker may be contractual/legal, not only cryptographic. |
| What do partners ask most about this kind of check? | "'Who audits the verifier' — literally those words, often. That's the first question any decent risk committee asks before accepting third-party proof." | **The strongest direct confirmation of the gap already named in the README and roadmap.** |

## Comparative synthesis

| | Participant 1 (mid VASP, ex-bank, EU/MiCA) | Participant 2 (small exchange, Brazil, crypto-native) | Participant 3 (HIPAA privacy officer, healthcare, US) | Participant 4 (Head of Risk/CCO, blocker, CH) |
|---|---|---|---|---|
| Task time | ~4m30s | ~2m10s | ~6m | ~2m40s mechanically, but paused for risk questions |
| Real friction | Wallet connection + packet import | None UX-related | Wallet connection + vocabulary outside her sector | None UX-related; governance/trust is the blocker |
| Reaction to absent raw data | Surprise / break from professional habit | Practical relief, "fixes an annoyance" | Direct link to the Minimum Necessary Standard | Recognizes the gain, then names the risk tradeoff |
| Rupture #1 (prefers the document) | Does not break — with a risk nuance | Does not break — reinforces the thesis | Does not break — she already minimizes manually | Does not break — but requires proof plus auditability |
| Rupture #2 (real pain: data, speed, or other) | Both matter, data weighs slightly more | Speed clearly weighs more | Manual minimization burden on the disclosing side | Responsibility void if the proof is wrong |
| Rupture #3 (trusts without proof?) | Nearly confirms — with a shame caveat | Does not confirm — counterparties too new | Does not confirm — barred by sector rules | Does not confirm — demands bilateral responsibility |
| Rupture #4 (most common partner question) | "Who audits the verifier" gains weight | Formal regulatory recognition (BACEN) | HIPAA-specific legal framing (designated record set / BAA) | "Who audits the verifier," nearly word for word |

## What this changes, and what it doesn't

None of the four sessions produced the single most damaging signal this project's own
protocol was built to catch: a compliance professional saying, without caveat, that
informal trust already solves this problem today. That's still the strongest available
evidence, short of a live institutional pilot, that the underlying demand is real.

The expanded set does make the limits sharper. Participant 3 shows that outside the
Travel Rule/VASP corridor, the mechanism may survive but the vocabulary may not:
"sanctions screening," "Travel Rule," "issuer," and "verifier" need vertical-specific
translation before healthcare or other regulated domains can read the product as their
own. Participant 4 confirms the blocker persona's audit concern directly, and adds a
contractual layer this product does not solve in Wave 1: technical proof may be
necessary, but not sufficient, without responsibility terms behind it. Participant 1's
audit-evidence export need and Participant 2's API-first integration request remain
valid next-step signals rather than being smoothed over.
