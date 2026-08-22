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
import { Alert, AlertTitle } from '@mui/material';

/**
 * The one place every wallet/connector/network error in this app is supposed to land —
 * see `.claude/agents/frontend-engineer.md` trap #1: a dropped `APIError` here is
 * indistinguishable, to the person using this screen, from "the product is broken".
 */
export interface ErrorBannerProps {
  readonly title: string;
  readonly message: string;
}

export const ErrorBanner: React.FC<Readonly<ErrorBannerProps>> = ({ title, message }) => (
  <Alert
    severity="error"
    variant="outlined"
    data-testid="error-banner"
    sx={{ borderColor: '#C43B3B', color: '#F3D6D6' }}
  >
    <AlertTitle>{title}</AlertTitle>
    {message}
  </Alert>
);
