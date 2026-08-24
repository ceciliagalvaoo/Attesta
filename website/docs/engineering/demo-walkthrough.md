---
title: Demo Walkthrough
description: The exact click-through, as actually run against a real devnet with two real wallets.
slug: /demo-walkthrough
---

# Demo Walkthrough

This isn't a hypothetical script. It's what was actually clicked, in a real Chromium
browser, with the real Lace wallet extension, against a real local devnet — the same
sequence a judge following [How To Run](/how-to-run) will see.

## Setup

1. `cd bboard-cli && npm run standalone` — local devnet up, endpoints printed.
2. `cd bboard-ui && npm run dev` — app at `http://localhost:5173`.
3. Lace wallet restored from the genesis seed (see [How To Run](/how-to-run)), network
   set to `Undeployed`, proof server pointed at `http://127.0.0.1:6300`.
4. A second Lace account added and funded, for a genuinely separate verifier identity.

## Issuer side

1. **Connect the issuer's wallet** → **Deploy new demo registry**. This deploys a fresh
   instance of the Attesta contract to the local devnet.
2. The issuer panel loads: `Issuer id`, an `Attestations root` starting at all zeros
   (empty tree), and a **Trust status: NOT TRUSTED** badge — a freshly deployed contract
   starts with no trusted issuers.
3. **Add to simulated trust list** — trust status turns **TRUSTED**. (Skipping this step
   deliberately produces `NOT_TRUSTED` later, not `LIVE` — the trust check is real, not
   cosmetic.)
4. Fill the demo attestation form — counterparty "Meridian Trust Bank (fictitious)",
   verification type "Sanctions screening (OFAC/EU/UN lists)", validity 30 days — and
   **Register attestation**.
5. The list under "Registered" shows the new attestation with a green **ACTIVE** badge,
   and **`Attestations root` changes** from all zeros to a real hash — the visible proof
   that the registration actually wrote to the ledger, not just to local UI state.
6. **Export proof packet** on that attestation, and copy the resulting text.

## Verifier side

1. Switch Lace to the second account.
2. **Connect the verifier's wallet** → paste the contract address (pre-filled from the
   issuer's deployment) → **Join**.
3. The verifier panel shows **Connected wallet: `<a different address from the issuer's>`**
   — visible confirmation this is a separate identity, not the same session reused.
4. Paste the copied packet into **Import proof packet** → **Import**. The panel now
   shows "Imported #1 — local ref `<...>`".
5. **Request proof.** After a few seconds (the circuit runs locally, generating a real
   ZK proof): status renders as **`LIVE`**, in green, with the validity window shown as
   public data, and — the moment this project treats as the actual demonstration of the
   product, not a side detail — a solid black bar where the underlying compliance file
   would be, captioned exactly: **"Raw data not received — by design. This screen was
   never sent the file behind this fact."**

## Live revocation

1. Back on the issuer panel: **Revoke** on the same attestation.
2. `Attestations root` doesn't change (revocation writes to the separate nullifier map,
   not the tree — see [Architecture](/architecture)), but the attestation's badge turns
   red: **REVOKED**.
3. On the verifier panel, **without clicking anything**: the status flips from `LIVE` to
   **`REVOKED`**, in red. The panel's caption states plainly it's tracking the public
   ledger live — **Re-request proof** is offered as an explicit fallback for a fresh
   cryptographic check, not as the only way to see the update.

This is the argument against treating revocation as decorative: nothing was polled by a
human, nothing was faked. A verifier holding a proof packet from weeks ago sees the same
live transition, with zero coordination from the issuer beyond the one revoke
transaction.

## A real bug this surfaced, and how it was found

The first connection attempt after a page reload sometimes failed with "The Midnight
Lace wallet did not respond" — even with the extension installed and unlocked. This
wasn't reproducible by any automated test, since it depended on a real browser
extension's cold-start timing.

Root cause, found by reading the actual RxJS `timeout()` operator implementation, not by
guessing: two sequential `timeout()` calls (one to detect the wallet provider, one for
the `connect()` handshake) both started their countdown from the same instant, because
`timeout()`'s internal timer starts synchronously when the pipe subscribes — the two
windows didn't compose the way a "1 second, then 5 fresh seconds" reading would suggest.
Combined with a Manifest V3 extension's service worker sometimes being cold right after
a reload, the first attempt could exhaust its window before the wallet ever had a chance
to respond.

Fixed by making the second timeout's timer start only once the wallet was actually
detected (`Promise.race` against a `setTimeout` created inside the detection step's
`concatMap`, not before it), and widening both windows (1s→5s detection, 5s→10s
handshake). Confirmed by a real reload-and-connect-first-try test after the fix landed —
not just a passing typecheck.

## A second real bug, found testing the deployed `preprod` app

The fix above still wasn't enough once tested live against the hosted app on `preprod`,
with a real human clicking through, not a scripted reload. Two distinct causes,
diagnosed from the browser console, not guessed:

1. **The 10s handshake budget was a human-reaction-time budget, not a
   machine-latency one.** `initialAPI.connect(networkId)` only resolves after a person
   notices the Lace approval popup, reads it, and clicks Approve — 10 seconds is not
   reliably enough time for that on a first encounter with the UI. Confirmed
   definitively: the app's timeout fired and rendered the error while the approval click
   was still in flight, and the authorization then completed on Lace's own side a moment
   later, visible in Lace's "Authorized DApps" list — the click worked, it just arrived
   after the app had already given up. Widened to 60s.
2. **Lace can still be syncing with the real `preprod` chain when a connection is
   attempted**, and can't respond to a dApp until that finishes — a wallet with a
   "Syncing (N%)" badge next to an account will not complete the handshake no matter how
   long the timeout is. This has no faster workaround; it's real chain history a fresh
   wallet has to catch up on against a public network, unlike the local devnet (which has
   no such history to sync). Confirmed as a known category of issue for Lace on `preprod`
   specifically, not unique to this app, via the Midnight developer community's own
   published troubleshooting notes.

Both fixes/findings are reflected in [How To Run](/how-to-run)'s troubleshooting
guidance.

## A third finding: Lace itself, broken on `preprod` — and the full cycle validated with 1AM instead

Even after both fixes above, further live testing against `preprod` turned up two
distinct, genuine bugs inside Lace itself — not this app, and not fixable from this
repository — found via the browser DevTools console and network tab, not guessed:

1. A cross-chain call Lace makes to Blockfrost's Cardano `preprod` API
   (`cardano-preprod.blockfrost.io/api/v0/accounts/.../utxos`) returns `404`, which feeds
   into a `Wallet.Sync: Internal Server Error` inside Lace.
2. Lace's own `"sendFlow"` internal state machine throws `handler not found for status
   "Idle" and event "txPreviewResulted"` — a genuine state-machine bug on Lace's side.

Both block completing a transaction through Lace's UI on `preprod`, even against a wallet
confirmed funded on-chain (checked directly via the indexer, independent of what the
wallet UI showed). Switching to **[1AM](https://1am.xyz/)**, a second Midnight-compatible
wallet, the full demo cycle above — trust, register, export, import, `LIVE`, revoke,
`REVOKED` — was run to completion against the same real `preprod` deployment
(`4f2cd18fd2c09aef3960f5159d29981fa4470a6bb26b2c1e0ce36537e6362f97`), with two separate
1AM accounts, on 2026-08-24. This is the wallet now recommended for testing this app on
`preprod` — see the README's "Deploying to a public test network" section.
