---
title: Demo Walkthrough
description: The exact click-through, as actually run against a real devnet with two real wallets.
---

# Demo Walkthrough

This isn't a hypothetical script. It's what was actually clicked, in a real Chromium
browser, with the real Lace wallet extension, against a real local devnet — the same
sequence a judge following [How To Run](./how-to-run) will see.

## Setup

1. `cd bboard-cli && npm run standalone` — local devnet up, endpoints printed.
2. `cd bboard-ui && npm run dev` — app at `http://localhost:5173`.
3. Lace wallet restored from the genesis seed (see [How To Run](./how-to-run)), network
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
   not the tree — see [Architecture](./architecture)), but the attestation's badge turns
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
