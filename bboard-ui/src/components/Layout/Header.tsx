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
import { AppBar, Box, Typography } from '@mui/material';
import { monoFontFamily } from '../../config/theme';
import { TutorialModal } from '../TutorialModal';

/**
 * The application header. Per contexto/09-BRANDING.md §3, `THE REGISTRAR` (the
 * marketing character) never appears inside a real product panel — this is just the
 * wordmark, set in the stamp-style monospaced typography reserved for the wordmark and
 * status words.
 */
export const Header: React.FC = () => (
  <AppBar
    position="static"
    data-testid="header"
    elevation={0}
    sx={{
      backgroundColor: '#0B0E12',
      borderBottom: '1px solid #1E242C',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}
  >
    <Box
      sx={{ display: 'flex', px: { xs: 3, md: 6 }, py: 2.5, alignItems: 'baseline', gap: 1.5 }}
      data-testid="header-logo"
    >
      <Typography
        sx={{ fontFamily: monoFontFamily, fontWeight: 700, fontSize: 22, letterSpacing: 3, color: '#D8A64B' }}
      >
        ATTESTA
      </Typography>
      <Typography variant="caption" sx={{ color: '#5C6570', fontStyle: 'italic' }}>
        Ask for the fact. Not the file.
      </Typography>
    </Box>

    <Box sx={{ px: { xs: 3, md: 6 } }} data-testid="header-actions">
      <TutorialModal />
    </Box>
  </AppBar>
);
