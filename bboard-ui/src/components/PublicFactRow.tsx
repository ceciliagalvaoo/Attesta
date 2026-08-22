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
import { monoFontFamily } from '../config/theme';

/**
 * One ledger-book style row: a label on the left, a monospaced public value on the
 * right — the visual counterpart to {@link RedactedField}. Everything rendered through
 * this component came from the public ledger/transcript (a root, a truncated hash, a
 * validity window `proveLive` disclosed) — never from a witness.
 *
 * @remarks
 * Kept generic (label + value, nothing issuer/verifier-specific) for the same reuse
 * reason as {@link RedactedField}/`LivenessBadge` — see frontend-engineer's Wave 2 note.
 */
export interface PublicFactRowProps {
  readonly label: string;
  readonly value: string;
  /** Tints the value gold — reserve for the one artifact everyone sees: the tree root. */
  readonly seal?: boolean;
}

export const PublicFactRow: React.FC<Readonly<PublicFactRowProps>> = ({ label, value, seal }) => (
  <Box data-testid="public-fact-row" sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.5 }}>
    <Typography variant="body2" sx={{ color: '#9AA2AD' }}>
      {label}
    </Typography>
    <Typography
      variant="body2"
      sx={{
        fontFamily: monoFontFamily,
        color: seal ? '#D8A64B' : '#E7E9EC',
        wordBreak: 'break-all',
        textAlign: 'right',
      }}
    >
      {value}
    </Typography>
  </Box>
);
