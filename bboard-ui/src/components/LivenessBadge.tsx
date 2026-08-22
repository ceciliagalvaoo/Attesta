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

import React from 'react';
import { Box, Typography } from '@mui/material';
import { LivenessStatus } from '../../../api/src/index';
import { attestaColors, monoFontFamily } from '../config/theme';

/**
 * The stamp-style status badge for one attestation's `proveLive` result.
 *
 * @remarks
 * Deliberately generic (status in, stamp out) — no issuer/verifier-specific prop, no
 * reference to "the verifier panel" anywhere in this component — so a future Wave 2
 * auditor surface can reuse it unchanged (frontend-engineer's Wave 2 note). Per
 * contexto/09-BRANDING.md §2, LIVE is the only state that gets the stamp-green; every
 * other state (EXPIRED, REVOKED, and this contract's fourth state, NOT_TRUSTED) gets
 * stamp-red — the word on the stamp is what tells them apart, never a fifth color.
 */
export interface LivenessBadgeProps {
  readonly status: LivenessStatus | undefined;
  /** `false` while a fresh on-chain proof is in flight — renders a neutral "checking" stamp. */
  readonly pending?: boolean;
}

const LABELS: Record<LivenessStatus, string> = {
  [LivenessStatus.LIVE]: 'LIVE',
  [LivenessStatus.EXPIRED]: 'EXPIRED',
  [LivenessStatus.REVOKED]: 'REVOKED',
  [LivenessStatus.NOT_TRUSTED]: 'NOT TRUSTED',
};

export const LivenessBadge: React.FC<Readonly<LivenessBadgeProps>> = ({ status, pending }) => {
  if (pending) {
    return (
      <Box
        data-testid="liveness-badge-pending"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          px: 2,
          py: 0.75,
          border: '2px dashed #4B5563',
          borderRadius: 1,
          color: '#9AA2AD',
        }}
      >
        <Typography sx={{ fontFamily: monoFontFamily, fontWeight: 700, letterSpacing: 2 }}>
          REQUESTING PROOF…
        </Typography>
      </Box>
    );
  }

  if (status === undefined) {
    return (
      <Box
        data-testid="liveness-badge-unknown"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          px: 2,
          py: 0.75,
          border: '2px dashed #4B5563',
          borderRadius: 1,
          color: '#9AA2AD',
        }}
      >
        <Typography sx={{ fontFamily: monoFontFamily, fontWeight: 700, letterSpacing: 2 }}>NOT VERIFIED YET</Typography>
      </Box>
    );
  }

  const color = status === LivenessStatus.LIVE ? attestaColors.live : attestaColors.revoked;

  return (
    <Box
      data-testid={`liveness-badge-${LABELS[status].replace(' ', '-').toLowerCase()}`}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: 2,
        py: 0.75,
        border: `2px solid ${color}`,
        borderRadius: 1,
        color,
        transform: 'rotate(-2deg)',
        boxShadow: `0 0 0 1px ${color}33 inset`,
      }}
    >
      <Typography sx={{ fontFamily: monoFontFamily, fontWeight: 700, letterSpacing: 2 }}>{LABELS[status]}</Typography>
    </Box>
  );
};
