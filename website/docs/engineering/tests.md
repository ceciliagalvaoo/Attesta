---
title: Tests
description: What's automated, what each test actually proves, and what manual testing covered instead.
slug: /tests
---

# Tests

## The three invariants the contract's tests exist to prove

The barema's QA criterion asks for more than "tests pass" — it asks for evidence of
product stability and correct handling of the failure cases that would actually matter.
Three specific claims this product makes are backed by a dedicated automated test each,
not just general coverage:

### 1. A `disclose()`-less leak fails at **compile time**

`contract/src/test/verify-leak-fails-to-compile.mjs`, wired as the `pretest` script (runs
automatically before `npm test`) — not a vitest case, because there'd be no module to
import if it were. It runs the real `compact` CLI against a fixture circuit that returns
a witness value (`rawDataHash`) without `disclose()`, and asserts the build fails with
the "disclosure" error category. A second fixture — the same circuit, with `disclose()`
added — is compiled as a positive control, isolating `disclose()` as the one variable
that changes the outcome. This demonstrates the compiler's own protection is doing the
work here, not a promise about code review discipline.

### 2. A revoked attestation is rejected by `proveLive`

Revokes a real registered attestation, then calls `proveLive` for it and asserts the
result is `REVOKED`, not `LIVE`. Confirms the nullifier-map mechanism (see
[Architecture](/architecture)) actually gates the liveness check, not just that a
revoke transaction can be submitted.

### 3. `proveLive` tracks real chain time, not a caller-supplied value

Registers a `LIVE` attestation, then advances the *simulated block time* — never a
circuit argument — past `validUntil`, and confirms `proveLive` now returns `EXPIRED`.
This is the test that specifically proves the `kernel.blockTime*` fix (see
[Compact Contract](/compact-contract)) actually closed the spoofing gap it was written
to close, rather than just changing which parameter carries the same trust problem.

## The verifier-side proving test (the D27 negative check)

A fourth test, added after the [proof-packet architecture correction](/compact-contract):
a simulated "verifier" is constructed with a private-state record containing **only**
the seven proof-packet fields — no `issuerSecret`, no `revocationSecret` anywhere in its
state — and confirmed able to run `proveLive` successfully and get the right status.
Before that: the same simulated verifier is confirmed to **fail** calling `proveLive` or
even reading its own issuer id *before* a packet is imported — proving the separation
between issuer and verifier private state is real and enforced, not a UI convention with
a silent fallback underneath it.

## Full suite

```bash
cd contract && npm run ci
```

Runs, in order: `compact` (compiles all 4 circuits) → `typecheck` → `lint` → `build` →
`pretest` (the compile-fail check above) → the vitest suite. **14 tests passing** as of
this writing — the count a judge running this command will see match.

`api/` and `bboard-ui/` have their own `typecheck`/`lint` (and, for `bboard-ui`, `build`)
scripts, run as part of every feature's QA pass during this project's build — not just
at the end. This project also kept a continuous build log (`feedback.md`) recording every
check run and its result, start to finish — deliberately excluded from the public repo
(see [Ecosystem Attribution](/ecosystem-attribution)), so it isn't linked here.

## What automated tests don't cover, and what does instead

Automated tests run against Compact's in-memory simulator — they don't exercise a real
browser, a real wallet extension, or a real Docker-backed devnet. Those three things
were confirmed separately:

- **End-to-end against a real local devnet**, via disposable verification scripts
  (written, run, and deleted — never part of the product) that deployed the contract,
  registered and revoked real attestations, and confirmed the exact status transitions
  a user would see.
- **A full manual click-through in a real browser**, with the real Lace wallet extension
  and two genuinely separate wallet accounts — see [Demo Walkthrough](/demo-walkthrough)
  for exactly what that covered, including a connection-timing bug it surfaced that no
  automated test could have caught, since it depended on a real browser extension's
  cold-start timing after a page reload.
- **Structured usability sessions with two people outside the team**, run with a
  written protocol (task, silent observation, debrief) — see
  [Usability Validation](/usability-validation).
