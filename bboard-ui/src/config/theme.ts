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

import { createTheme } from '@mui/material';

/**
 * Attesta's four functional colors (contexto/09-BRANDING.md §2) — never decorative,
 * never repurposed for anything other than the meaning listed here. Import
 * {@link attestaColors} instead of hardcoding a hex value anywhere else in this app.
 */
export const attestaColors = {
  /** Near-black, cold background — the tone of an official document, not a dashboard. */
  background: '#0B0E12',
  /** Seal/gold — reserved for the one public artifact everyone sees: the tree root. */
  seal: '#D8A64B',
  /** Stamp green — LIVE, and only LIVE. */
  live: '#2E9E5B',
  /** Stamp red — REVOKED / EXPIRED / NOT_TRUSTED, and only those. */
  revoked: '#C43B3B',
  /** Solid black redaction bars over any area where raw data would otherwise be. */
  redaction: '#050505',
} as const;

/** Monospaced stack for every hash/data/ledger-row value in the app. */
export const monoFontFamily = '"IBM Plex Mono", "Roboto Mono", "SFMono-Regular", Consolas, monospace';

export const theme = createTheme({
  typography: {
    fontFamily: '"Inter", Helvetica, Arial, sans-serif',
    allVariants: {
      color: '#E7E9EC',
    },
  },
  palette: {
    mode: 'dark',
    primary: {
      main: attestaColors.seal,
      light: '#E7C583',
      dark: '#B4863A',
      contrastText: attestaColors.background,
    },
    success: {
      main: attestaColors.live,
      contrastText: attestaColors.background,
    },
    error: {
      main: attestaColors.revoked,
      contrastText: '#FFFFFF',
    },
    background: {
      default: attestaColors.background,
      paper: '#12161C',
    },
    text: {
      primary: '#E7E9EC',
      secondary: '#9AA2AD',
    },
  },
});
