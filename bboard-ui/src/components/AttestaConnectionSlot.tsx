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

import React, { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material';
import { type Logger } from 'pino';
import { type ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { type DeployedAttestaAPI } from '../../../api/src/index';
import { type AttestaRole } from '../contexts/AttestaManager';
import { useAttestaConnection } from '../hooks';
import { ErrorBanner } from './ErrorBanner';
import { TextPromptDialog } from './TextPromptDialog';

export interface AttestaConnectionSlotProps {
  /** D27 — which identity this slot connects as; owns its own wallet connection and private state. */
  readonly role: AttestaRole;
  readonly title: string;
  readonly description: string;
  /** Only the issuer role should offer "deploy a new registry" — a verifier always joins. */
  readonly allowDeploy: boolean;
  /** Pre-fills the "join" dialog with a known public contract address, if there is one. */
  readonly suggestedContractAddress?: string;
  readonly logger: Logger;
  /**
   * Called once this identity resolves a deployed contract — only ever the (public)
   * contract address, so `App.tsx` can offer it as a join-address suggestion to the
   * other role's slot. Never carries private state.
   */
  readonly onConnected?: (contractAddress: ContractAddress) => void;
  /** Rendered once this identity has a deployed/joined contract to work with. */
  readonly children: (api: DeployedAttestaAPI, walletAddress: string) => React.ReactNode;
}

/**
 * Owns one identity's connect flow (deploy-or-join, with every wallet/connector error
 * surfaced — see `.claude/agents/frontend-engineer.md` trap #1) via
 * {@link useAttestaConnection}, and renders `children` once that identity has resolved a
 * deployment. Used twice in `App.tsx` — once for the issuer, once for the verifier —
 * each call getting its own independent wallet connection and private state (D27).
 */
export const AttestaConnectionSlot: React.FC<Readonly<AttestaConnectionSlotProps>> = ({
  role,
  title,
  description,
  allowDeploy,
  suggestedContractAddress,
  logger,
  onConnected,
  children,
}) => {
  const { deployment, deploy, join } = useAttestaConnection(role, logger);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  useEffect(() => {
    if (deployment?.status === 'deployed') {
      onConnected?.(deployment.api.deployedContractAddress);
    }
  }, [deployment, onConnected]);

  if (deployment?.status === 'deployed') {
    return <>{children(deployment.api, deployment.walletAddress)}</>;
  }

  return (
    <Card sx={{ width: 480, maxWidth: '100%' }} data-testid={`${role}-connect-card`}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: '#9AA2AD', mb: 2 }}>
          {description}
        </Typography>

        {deployment?.status === 'in-progress' && (
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
            <CircularProgress size={20} data-testid={`${role}-connect-working-indicator`} />
            <Typography variant="body2">Connecting to the Midnight 1AM wallet…</Typography>
          </Stack>
        )}
        {deployment?.status === 'failed' && (
          <Box sx={{ mb: 2 }}>
            <ErrorBanner title="Could not connect" message={deployment.error.message} />
          </Box>
        )}

        <Stack direction="row" spacing={2}>
          {allowDeploy && (
            <Button variant="contained" onClick={deploy} data-testid={`${role}-connect-deploy-btn`}>
              Deploy new demo registry
            </Button>
          )}
          <Button
            variant={allowDeploy ? 'outlined' : 'contained'}
            onClick={() => setJoinDialogOpen(true)}
            data-testid={`${role}-connect-join-btn`}
          >
            {allowDeploy ? 'Join existing contract' : "Connect & join the issuer's contract"}
          </Button>
        </Stack>

        <TextPromptDialog
          prompt="Enter the Attesta contract address to join"
          isOpen={joinDialogOpen}
          initialValue={suggestedContractAddress}
          onCancel={() => setJoinDialogOpen(false)}
          onSubmit={(text) => {
            setJoinDialogOpen(false);
            join(text);
          }}
        />
      </CardContent>
    </Card>
  );
};
