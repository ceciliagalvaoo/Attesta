---
title: Ecosystem Attribution
description: What this project started from, named directly, and what it built on top.
---

# Ecosystem Attribution

Stated directly, because hiding a starting point is worse than declaring it: a reviewer
who already knows the Midnight ecosystem's official tooling will recognize the
foundation immediately, and declaring it first is the difference between "responsible
engineering" and "caught not mentioning it."

## What this project started from

- **[`create-mn-app`](https://www.npmjs.com/package/create-mn-app)** — the official
  Midnight Network project generator (`npx create-mn-app@latest`). Provided the npm
  workspace layout, build tooling, and CI configuration this project's own workflows
  build on.
- **[`bboard`](https://github.com/midnightntwrk/example-bboard)** (Bulletin Board) — the
  starting template, chosen as the closest structural match available: a ZK
  identity/attestation-style proof, a CLI, and a React UI, in the same shape this
  project needed before any Attesta-specific logic existed.

## What is this project's own work, not the template's

Everything the product actually *does* is new, built specifically for Attesta, not a
renamed copy of the scaffold:

- **The entire Compact contract** — `registerAttestation`, `revokeAttestation`,
  `proveLive`, `setTrustedIssuer`, the `HistoricMerkleTree`/nullifier-set revocation
  mechanism, the `kernel`-based real-time validity check, and the verifier-side proving
  witnesses that let a verifier prove liveness without ever holding the issuer's secret.
  The original template's contract implemented an unrelated bulletin-board (post/take-
  down a message) — none of its logic carries over. See [Compact Contract](./compact-contract).
- **`AttestaAPI`** — the typed wiring layer, including the proof-packet export/import
  mechanism and the live ledger observable that drives real-time revocation on screen.
- **Both UI panels** — issuer and verifier — including the two-identity separation, the
  redacted-field/liveness-badge components, and the whole visual language built around
  making the privacy guarantee *visible*, not just asserted. See
  [Architecture](./architecture).
- **The local-devnet launcher fix** — the template's original CLI (`bboard-cli/src/index.ts`,
  an interactive post/take-down menu) was deliberately not ported, since the web app is
  this project's real interface; the devnet-launching command (`npm run standalone`) was
  decoupled from that unused menu and its Docker port bindings pinned to match Lace's
  own default configuration.

## What none of the official identity/credential repositories cover

See [Difference From Existing Midnight Examples](./difference-from-existing-examples)
for the full, named comparison against `example-zkloan`, `midnight-did`,
`midnight-verifiable-credentials`, `midnight-trust-registry`, and
`midnight-passport-sdk` — the specific gaps (live revocation, cross-verifier reuse) this
project's own contract fills, stated line by line rather than in general terms.

## Documentation and reference material

- [Midnight Documentation](https://docs.midnight.network/) — the platform reference this
  project was built against.
- [Compact Language Guide](https://docs.midnight.network/compact/writing) — the smart
  contract language reference.
- [Compatibility Matrix](https://docs.midnight.network/relnotes/support-matrix) —
  supported component versions, used to confirm the compiler/runtime version pair this
  project pins before any circuit logic was written.
