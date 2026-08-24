// This file is part of Attesta.
// Copyright (C) 2026 The Attesta Contributors
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  List,
  ListItem,
  Typography,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { attestaColors, monoFontFamily } from '../config/theme';

/** `localStorage` key used to remember that this browser has already seen the tutorial. */
const TUTORIAL_SEEN_KEY = 'attesta-tutorial-seen';

const WALKTHROUGH_URL = 'https://ceciliagalvaoo.github.io/Attesta/demo-walkthrough';
const FAUCET_URL = 'https://midnight-tmnight-preprod.nethermind.dev/';

/** The already-deployed Attesta registry contract on Preprod — join this instead of deploying a fresh one. */
const DEPLOYED_CONTRACT_ADDRESS = '4f2cd18fd2c09aef3960f5159d29981fa4470a6bb26b2c1e0ce36537e6362f97';

interface Step {
  title: string;
  body: React.ReactNode;
}

const STEPS: Step[] = [
  {
    title: 'What this demo proves',
    body: (
      <>
        Two separate institutions — an <strong>issuer</strong> and a <strong>verifier</strong> — confirm that a
        compliance check done earlier is still valid, without the verifier ever receiving the original document. If the
        issuer revokes it, the verifier sees that live.
      </>
    ),
  },
  {
    title: 'Before you start',
    body: (
      <>
        You need <strong>two separate accounts in the 1AM wallet</strong> (Network = <code>Preprod</code>, Proof server
        = <code>https://proof-server.preprod.midnight.network</code>) — one for the issuer, one for the verifier.
        Preprod is a real public network, so each account needs tDUST — request tNIGHT from the{' '}
        <Link href={FAUCET_URL} target="_blank" rel="noopener noreferrer" color="primary">
          official Midnight faucet
        </Link>{' '}
        if you don&rsquo;t have any yet. Without this, neither panel below will work.
      </>
    ),
  },
  {
    title: 'Left panel — Issuer',
    body: (
      <>
        You have two options here. <strong>Recommended:</strong> click{' '}
        <strong>&ldquo;Join existing contract&rdquo;</strong> (account 1) and paste this address, for the registry
        already deployed on Preprod, with real history to show:{' '}
        <Box
          component="code"
          sx={{ display: 'block', fontFamily: monoFontFamily, fontSize: 11, wordBreak: 'break-all', my: 0.5 }}
        >
          {DEPLOYED_CONTRACT_ADDRESS}
        </Box>
        <strong>Alternative:</strong> click <strong>&ldquo;Deploy new demo registry&rdquo;</strong> instead to start
        your own, brand-new registry from scratch (empty trust list, no prior attestations) — costs one extra
        transaction on Preprod. Either way, the rest of the steps are the same once you&rsquo;re connected: click{' '}
        <strong>&ldquo;Add to SIMULATED TRUST LIST&rdquo;</strong> (required, or the proof fails later) → fill in the
        form and click <strong>&ldquo;Register attestation&rdquo;</strong> → click{' '}
        <strong>&ldquo;Export proof packet&rdquo;</strong> and copy the text.
      </>
    ),
  },
  {
    title: 'Right panel — Verifier',
    body: (
      <>
        Click <strong>&ldquo;Connect &amp; join the issuer&rsquo;s contract&rdquo;</strong> (account 2, different from
        account 1) → paste the copied text into <strong>&ldquo;Import proof packet&rdquo;</strong> → click{' '}
        <strong>&ldquo;Request proof&rdquo;</strong>. You&rsquo;ll see a <strong>LIVE</strong> status and a redacted
        field reading &ldquo;Raw data not received — by design&rdquo; — that is the guarantee working, not a bug.
      </>
    ),
  },
  {
    title: 'The key moment',
    body: (
      <>
        Go back to the Issuer panel and click <strong>&ldquo;Revoke&rdquo;</strong> on that same attestation, then watch
        the Verifier panel — its status flips from <strong>LIVE</strong> to <strong>REVOKED</strong> on its own, with no
        page reload. That is proof that revocation is live public state, not a promise.
      </>
    ),
  },
];

/**
 * A short, scannable tutorial modal aimed at judges evaluating this demo asynchronously,
 * without anyone walking them through it live. It opens automatically on a visitor's
 * first visit (tracked via `localStorage`, key {@link TUTORIAL_SEEN_KEY}) and can be
 * reopened at any time via the "How to test this demo" button rendered alongside it.
 */
export const TutorialModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(TUTORIAL_SEEN_KEY)) {
        setIsOpen(true);
      }
    } catch {
      // localStorage may be unavailable (private browsing, disabled storage, etc.) — in
      // that case we simply don't auto-open, but the header button still works.
    }
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    try {
      window.localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    } catch {
      // Nothing we can do if storage is unavailable — the button will just keep working.
    }
  }, []);

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        color="primary"
        startIcon={<HelpOutlineIcon />}
        onClick={handleOpen}
        data-testid="tutorial-open-btn"
        sx={{ whiteSpace: 'nowrap' }}
      >
        How to test this demo
      </Button>

      <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm" data-testid="tutorial-dialog">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
          <Typography sx={{ fontFamily: monoFontFamily, fontWeight: 700, letterSpacing: 1 }}>
            How to test this demo
          </Typography>
          <IconButton onClick={handleClose} size="small" data-testid="tutorial-close-btn" aria-label="Close">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <List sx={{ py: 0 }}>
            {STEPS.map((step, i) => (
              <ListItem key={step.title} alignItems="flex-start" disableGutters sx={{ py: 1.25 }}>
                <Box
                  sx={{
                    flexShrink: 0,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: `1px solid ${attestaColors.seal}`,
                    color: attestaColors.seal,
                    fontFamily: monoFontFamily,
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 1.5,
                    mt: 0.25,
                  }}
                >
                  {i + 1}
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.25 }}>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.body}
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Need more detail?{' '}
            <Link href={WALKTHROUGH_URL} target="_blank" rel="noopener noreferrer" color="primary">
              Read the full written walkthrough
            </Link>
            .
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button variant="contained" disableElevation onClick={handleClose} data-testid="tutorial-got-it-btn">
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
