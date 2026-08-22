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
import { attestaColors, monoFontFamily } from '../config/theme';

/**
 * A solid black redaction bar standing in for a field that was never sent to this
 * screen — never an empty/blank field.
 *
 * @remarks
 * Trap #3 in `.claude/agents/frontend-engineer.md`: an empty field where private data
 * would be reads as a UI bug. This component is the fix — it always renders a labelled
 * bar plus an explicit caption ("raw data not received — by design"), so absence reads
 * as the architecture working, not as something failing to load. Kept generic (a label
 * and nothing else) so any future screen — including a Wave 2 auditor surface — can drop
 * it in wherever raw attestation data would otherwise be shown.
 */
export interface RedactedFieldProps {
  /** What this bar stands in for, e.g. "Sanctions screening file". */
  readonly label: string;
}

export const RedactedField: React.FC<Readonly<RedactedFieldProps>> = ({ label }) => (
  <Box data-testid="redacted-field" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
    <Typography variant="caption" sx={{ fontFamily: monoFontFamily, color: '#9AA2AD', letterSpacing: 0.5 }}>
      {label}
    </Typography>
    <Box
      sx={{
        height: 18,
        borderRadius: 0.5,
        backgroundColor: attestaColors.redaction,
        backgroundImage:
          'repeating-linear-gradient(135deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 2px, transparent 2px, transparent 6px)',
      }}
    />
    <Typography variant="caption" sx={{ color: '#5C6570', fontStyle: 'italic' }}>
      Raw data not received — by design. This screen was never sent the file behind this fact.
    </Typography>
  </Box>
);
