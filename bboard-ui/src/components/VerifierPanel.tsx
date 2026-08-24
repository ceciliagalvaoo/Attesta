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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, Chip, Divider, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { type DeployedAttestaAPI, type Ledger, LivenessStatus, utils } from '../../../api/src/index';
import { LivenessBadge } from './LivenessBadge';
import { PublicFactRow } from './PublicFactRow';
import { RedactedField } from './RedactedField';
import { ErrorBanner } from './ErrorBanner';
import { describeError } from '../errors';
import { formatUnixSeconds, shortHex, toHexString } from '../format';
import { deserializeProofPacket } from '../proofPacket';
import type { ImportedAttestation } from '../types';

interface ProvenResult {
  readonly status: LivenessStatus;
  readonly issuerId: Uint8Array;
  readonly provenAt: number;
}

const nowSeconds = (): bigint => BigInt(Math.floor(Date.now() / 1000));

export interface VerifierPanelProps {
  readonly api: DeployedAttestaAPI;
  /** The Bech32m address of the 1AM account currently bound to this panel (D27 — see `AttestaManager.ts`). */
  readonly walletAddress: string;
}

/**
 * The verifier panel — Priya's screen, and the primary UX budget of this app. Imports a
 * D27 proof packet the issuer exported (never reads the issuer panel's state directly —
 * this panel drives its own `AttestaAPI`, its own wallet connection, its own private
 * state, populated only by {@link DeployedAttestaAPI.importProofPacket}), requests a
 * live proof, shows LIVE/EXPIRED/REVOKED/NOT_TRUSTED distinctly, tracks revocation live
 * off the public ledger without a page reload, and never renders (or stores) any raw
 * attestation data — the missing "document" field is the guarantee, not a bug.
 */
export const VerifierPanel: React.FC<Readonly<VerifierPanelProps>> = ({ api, walletAddress }) => {
  const [packetText, setPacketText] = useState('');
  const [importError, setImportError] = useState<string>();
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState<ImportedAttestation[]>([]);

  const [selectedKey, setSelectedKey] = useState<string>('');
  const [ledger, setLedger] = useState<Ledger>();
  const [ledgerError, setLedgerError] = useState<string>();
  const [proven, setProven] = useState<Record<string, ProvenResult>>({});
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string>();
  const [decision, setDecision] = useState<Record<string, 'approved' | 'rejected'>>({});

  useEffect(() => {
    const subscription = api.state$.subscribe({
      next: (derived) => setLedger(derived.ledger),
      error: (e: unknown) => setLedgerError(describeError(e)),
    });
    return () => subscription.unsubscribe();
  }, [api]);

  const handleImport = useCallback(() => {
    setImportError(undefined);
    setImporting(true);
    void (async () => {
      try {
        const packet = deserializeProofPacket(packetText);
        const ref = utils.randomBytes(32);
        // Never reads the issuer panel's records — this writes only into this
        // VerifierPanel's own AttestaAPI/private state (D27). If this panel were
        // wired to the same AttestaAPI as the issuer (it is not — see App.tsx), this
        // call would still be the only thing that populates a record for `ref` here.
        await api.importProofPacket(ref, packet);
        const record: ImportedAttestation = {
          ref,
          issuerId: packet.issuerId,
          nullifierHash: packet.nullifierHash,
          validFrom: packet.validFrom,
          validUntil: packet.validUntil,
          importedAt: Date.now(),
        };
        setImported((prev) => [...prev, record]);
        setSelectedKey(toHexString(ref));
        setPacketText('');
      } catch (e: unknown) {
        setImportError(describeError(e));
      } finally {
        setImporting(false);
      }
    })();
  }, [api, packetText]);

  const selected = useMemo(() => imported.find((a) => toHexString(a.ref) === selectedKey), [imported, selectedKey]);

  const authoritative = selected ? proven[selectedKey] : undefined;

  // Re-derives the exact same LIVE/EXPIRED/REVOKED/NOT_TRUSTED formula proveLive
  // enforces on-chain, from the live public ledger snapshot — this is what reflects a
  // revocation without a page reload. Only shown once an authoritative on-chain
  // proveLive call has actually happened for this ref (see RedactedField/PublicFactRow
  // gating below): before that, nothing is disclosed yet, so nothing is displayed.
  const liveTrackedStatus = useMemo(() => {
    if (!selected || !ledger || !authoritative) return undefined;
    return utils.deriveLivenessStatus(ledger, selected, nowSeconds());
  }, [selected, ledger, authoritative]);

  const displayedStatus = liveTrackedStatus ?? authoritative?.status;

  const handleRequestProof = useCallback(() => {
    if (!selected) return;
    setPending(true);
    setActionError(undefined);
    void api
      .proveLive(selected.ref)
      .then(({ status, issuerId }) => {
        setProven((prev) => ({ ...prev, [selectedKey]: { status, issuerId, provenAt: Date.now() } }));
      })
      .catch((e: unknown) => setActionError(describeError(e)))
      .finally(() => setPending(false));
  }, [api, selected, selectedKey]);

  const handleDecision = useCallback(
    (outcome: 'approved' | 'rejected') => {
      setDecision((prev) => ({ ...prev, [selectedKey]: outcome }));
    },
    [selectedKey],
  );

  return (
    <Card sx={{ width: 560, maxWidth: '100%' }} data-testid="verifier-panel">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 0.5 }}>
          Verifier
        </Typography>
        <Typography variant="body2" sx={{ color: '#9AA2AD', mb: 1 }}>
          Import a proof packet from the issuer, then request a live, on-chain proof that the attestation is still valid
          — right now, not when it was issued.
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', fontFamily: 'monospace', color: '#5C6570', mb: 2 }}>
          Connected wallet: {shortHex(walletAddress, 10)}
        </Typography>

        {ledgerError && (
          <Box sx={{ mb: 2 }}>
            <ErrorBanner title="Could not read the public ledger" message={ledgerError} />
          </Box>
        )}

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Import proof packet
        </Typography>
        <TextField
          size="small"
          fullWidth
          multiline
          minRows={4}
          placeholder="Paste the JSON the issuer exported…"
          value={packetText}
          onChange={(e) => setPacketText(e.target.value)}
          data-testid="verifier-import-packet-text"
          sx={{ mb: 1 }}
        />
        {importError && (
          <Box sx={{ mb: 1.5 }}>
            <ErrorBanner title="Could not import this packet" message={importError} />
          </Box>
        )}
        <Button
          variant="outlined"
          disabled={!packetText.trim() || importing}
          onClick={handleImport}
          data-testid="verifier-import-btn"
        >
          Import proof packet
        </Button>

        <Divider sx={{ my: 2 }} />

        {imported.length === 0 ? (
          <Typography variant="body2" sx={{ color: '#5C6570' }}>
            No proof packets imported yet — nothing to verify until one is imported above. This panel never falls back
            to reading another identity&apos;s records.
          </Typography>
        ) : (
          <>
            <TextField
              size="small"
              select
              fullWidth
              label="Imported attestation"
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              sx={{ mb: 1 }}
              data-testid="verifier-ref-select"
            >
              {imported.map((a, idx) => (
                <MenuItem key={toHexString(a.ref)} value={toHexString(a.ref)}>
                  Imported #{idx + 1} — local ref {shortHex(toHexString(a.ref))}
                </MenuItem>
              ))}
            </TextField>
            <Typography variant="caption" sx={{ color: '#5C6570', display: 'block', mb: 2 }}>
              The local ref is a selector this panel generated for its own bookkeeping — never the underlying document
              or the counterparty&apos;s identity, which this panel never received.
            </Typography>

            {actionError && (
              <Box sx={{ mb: 2 }}>
                <ErrorBanner title="Could not complete this request" message={actionError} />
              </Box>
            )}

            <Button
              variant="contained"
              disabled={!selected || pending}
              onClick={handleRequestProof}
              data-testid="verifier-request-proof-btn"
            >
              Request proof
            </Button>

            <Divider sx={{ my: 2 }} />

            <Stack direction="row" spacing={2} sx={{ mb: 1.5, alignItems: 'center' }}>
              <LivenessBadge status={displayedStatus} pending={pending} />
              {authoritative && (
                <Button size="small" onClick={handleRequestProof} disabled={pending} data-testid="verifier-refresh-btn">
                  Re-request proof
                </Button>
              )}
            </Stack>

            {authoritative ? (
              <>
                <Typography variant="caption" sx={{ color: '#5C6570', display: 'block', mb: 1.5 }}>
                  Last on-chain proof: {new Date(authoritative.provenAt).toISOString()}. Status above tracks the public
                  ledger live (e.g. a revocation in the issuer panel updates it automatically) — use &quot;Re-request
                  proof&quot; any time for a fresh cryptographic proof instead of the tracked read.
                </Typography>

                <PublicFactRow label="Issuer id" value={shortHex(toHexString(authoritative.issuerId), 8)} />
                {selected && (
                  <>
                    <PublicFactRow label="Valid from" value={formatUnixSeconds(selected.validFrom)} />
                    <PublicFactRow label="Valid until" value={formatUnixSeconds(selected.validUntil)} />
                  </>
                )}

                <Box sx={{ mt: 2 }}>
                  <RedactedField label="Underlying compliance file (sanctions screening / EDD dossier / counterparty identity)" />
                </Box>

                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    color="success"
                    disabled={displayedStatus !== LivenessStatus.LIVE}
                    onClick={() => handleDecision('approved')}
                    data-testid="verifier-approve-btn"
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleDecision('rejected')}
                    data-testid="verifier-reject-btn"
                  >
                    Reject
                  </Button>
                </Stack>
                {decision[selectedKey] && (
                  <Chip
                    sx={{ mt: 1.5 }}
                    label={
                      decision[selectedKey] === 'approved'
                        ? 'Approved — confirmed LIVE at time of decision.'
                        : `Rejected — attestation was ${displayedStatus !== undefined ? LivenessStatus[displayedStatus] : 'not live'}.`
                    }
                    color={decision[selectedKey] === 'approved' ? 'success' : 'error'}
                  />
                )}
              </>
            ) : (
              <Typography variant="body2" sx={{ color: '#5C6570' }}>
                No proof requested yet for this attestation. Nothing about it — not even its validity window — is shown
                until &quot;Request proof&quot; runs.
              </Typography>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
