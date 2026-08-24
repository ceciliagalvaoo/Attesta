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
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { type DeployedAttestaAPI, type Ledger, LivenessStatus, utils } from '../../../api/src/index';
import { PublicFactRow } from './PublicFactRow';
import { ErrorBanner } from './ErrorBanner';
import { describeError } from '../errors';
import { formatRoot, formatUnixSeconds, sha256, shortHex, toHexString } from '../format';
import { serializeProofPacket } from '../proofPacket';
import { monoFontFamily } from '../config/theme';

const VERIFICATION_TYPES = [
  'Sanctions screening (OFAC/EU/UN lists)',
  'Originator verification (Travel Rule, FATF Rec. 16)',
  'Enhanced due diligence (EDD) review',
] as const;

/** One demo attestation as the issuer sees it — never shared with the verifier panel as-is. */
interface IssuedAttestation {
  readonly ref: Uint8Array;
  readonly nullifierHash: Uint8Array;
  readonly validFrom: bigint;
  readonly validUntil: bigint;
  readonly counterparty: string;
  readonly verificationType: string;
}

const HOUR = 3600n;
const DAY = 24n * HOUR;

const nowSeconds = (): bigint => BigInt(Math.floor(Date.now() / 1000));

export interface IssuerPanelProps {
  readonly api: DeployedAttestaAPI;
  /** The Bech32m address of the 1AM account currently bound to this panel (D27 — see `AttestaManager.ts`). */
  readonly walletAddress: string;
}

/**
 * The issuer panel — intentionally minimal (see `.claude/agents/frontend-engineer.md`:
 * "o painel do issuer é intencionalmente mínimo"). Seeds demo attestations, revokes
 * them, exports D27 proof packets, and administers the SIMULATED trust list. Every
 * institution named here is fictitious and labelled `DEMO PARTICIPANT`. Drives its own
 * `AttestaAPI` (own wallet connection, own private state, D27) — never shares either
 * with the verifier panel.
 */
export const IssuerPanel: React.FC<Readonly<IssuerPanelProps>> = ({ api, walletAddress }) => {
  const [issuerId, setIssuerId] = useState<Uint8Array>();
  const [ledger, setLedger] = useState<Ledger>();
  const [issued, setIssued] = useState<IssuedAttestation[]>([]);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [exportedPacket, setExportedPacket] = useState<{ ref: Uint8Array; text: string }>();

  const [counterparty, setCounterparty] = useState('Meridian Trust Bank (fictitious)');
  const [verificationType, setVerificationType] = useState<string>(VERIFICATION_TYPES[0]);
  const [validForDays, setValidForDays] = useState(30);

  useEffect(() => {
    api
      .getIssuerId()
      .then(setIssuerId)
      .catch((e: unknown) => setError(describeError(e)));
  }, [api]);

  useEffect(() => {
    const subscription = api.state$.subscribe({
      next: (derived) => setLedger(derived.ledger),
      error: (e: unknown) => setError(describeError(e)),
    });
    return () => subscription.unsubscribe();
  }, [api]);

  const isTrusted = useMemo(
    () => (issuerId && ledger ? ledger.trustedIssuers.member(issuerId) : undefined),
    [issuerId, ledger],
  );

  const runAction = useCallback(async (action: () => Promise<void>) => {
    setBusy(true);
    setError(undefined);
    try {
      await action();
    } catch (e: unknown) {
      setError(describeError(e));
    } finally {
      setBusy(false);
    }
  }, []);

  const handleToggleTrust = useCallback(() => {
    if (!issuerId) return;
    void runAction(async () => {
      await api.setTrustedIssuer(issuerId, !isTrusted);
    });
  }, [api, issuerId, isTrusted, runAction]);

  const registerOne = useCallback(
    async (label: string, type: string, validFrom: bigint, validUntil: bigint) => {
      const ref = utils.randomBytes(32);
      const revocationSecret = utils.randomBytes(32);
      const salt = utils.randomBytes(32);
      const rawDataHash = await sha256(`${label}|${type}|${toHexString(revocationSecret)}`);

      await api.registerAttestation(ref, { rawDataHash, validFrom, validUntil, revocationSecret, salt });
      const nullifierHash = utils.deriveNullifierHash(revocationSecret);

      const record: IssuedAttestation = {
        ref,
        nullifierHash,
        validFrom,
        validUntil,
        counterparty: label,
        verificationType: type,
      };
      setIssued((prev) => [...prev, record]);
    },
    [api],
  );

  const handleRegister = useCallback(() => {
    const from = nowSeconds();
    void runAction(() => registerOne(counterparty, verificationType, from, from + BigInt(validForDays) * DAY));
  }, [registerOne, counterparty, verificationType, validForDays, runAction]);

  const handleSeedDemo = useCallback(() => {
    const now = nowSeconds();
    void runAction(async () => {
      await registerOne('Northwind Custody Partners (fictitious)', VERIFICATION_TYPES[0], now - DAY, now + 30n * DAY);
      await registerOne('Aurelia Digital Assets (fictitious)', VERIFICATION_TYPES[1], now - 60n * DAY, now - DAY);
    });
  }, [registerOne, runAction]);

  const handleRevoke = useCallback(
    (ref: Uint8Array) => {
      void runAction(async () => {
        await api.revokeAttestation(ref);
      });
    },
    [api, runAction],
  );

  const handleExport = useCallback(
    (ref: Uint8Array) => {
      void runAction(async () => {
        const packet = await api.exportProofPacket(ref);
        setExportedPacket({ ref, text: serializeProofPacket(packet) });
      });
    },
    [api, runAction],
  );

  const handleCopyExported = useCallback(() => {
    if (exportedPacket) {
      void navigator.clipboard.writeText(exportedPacket.text);
    }
  }, [exportedPacket]);

  return (
    <Card sx={{ width: 480, maxWidth: '100%' }} data-testid="issuer-panel">
      <CardContent>
        <Stack direction="row" sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Issuer</Typography>
          <Chip
            data-testid="simulated-trust-list-badge"
            label="SIMULATED TRUST LIST"
            size="small"
            sx={{
              fontFamily: monoFontFamily,
              fontWeight: 700,
              letterSpacing: 1,
              color: '#0B0E12',
              backgroundColor: '#D8A64B',
            }}
          />
        </Stack>
        <Typography variant="body2" sx={{ color: '#9AA2AD', mb: 1 }}>
          This panel does not represent a real issuer. It generates demo attestation data only — the trust list below is
          simulated, populated by this demo, never by a governance process.
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', fontFamily: monoFontFamily, color: '#5C6570', mb: 2 }}>
          Connected wallet: {shortHex(walletAddress, 10)}
        </Typography>

        {error && (
          <Box sx={{ mb: 2 }}>
            <ErrorBanner title="Issuer action failed" message={error} />
          </Box>
        )}

        <PublicFactRow label="Issuer id" value={issuerId ? shortHex(toHexString(issuerId), 8) : '…'} />
        <PublicFactRow label="Attestations root" value={ledger ? formatRoot(ledger.attestations.root()) : '…'} seal />
        <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 2, alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: '#9AA2AD' }}>
            Trust status:
          </Typography>
          <Chip
            size="small"
            label={isTrusted === undefined ? 'unknown' : isTrusted ? 'TRUSTED' : 'NOT TRUSTED'}
            color={isTrusted ? 'success' : 'default'}
          />
          <Button size="small" variant="outlined" disabled={!issuerId || busy} onClick={handleToggleTrust}>
            {isTrusted ? 'Remove from trust list' : 'Add to SIMULATED TRUST LIST'}
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Register a demo attestation
        </Typography>
        <Stack spacing={1.5}>
          <TextField
            size="small"
            label="Counterparty (DEMO PARTICIPANT)"
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
            slotProps={{ input: { endAdornment: <Chip size="small" label="DEMO PARTICIPANT" sx={{ ml: 1 }} /> } }}
          />
          <TextField
            size="small"
            select
            label="Verification type"
            value={verificationType}
            onChange={(e) => setVerificationType(e.target.value)}
          >
            {VERIFICATION_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: '#9AA2AD' }}>
              &quot;Sanctions screening&quot; is not connected to any real OFAC/EU/UN list — demo dataset only.
            </Typography>
            <Chip
              data-testid="simulated-sanctions-list-badge"
              label="SIMULATED SANCTIONS LIST"
              size="small"
              sx={{
                fontFamily: monoFontFamily,
                fontWeight: 700,
                letterSpacing: 1,
                color: '#0B0E12',
                backgroundColor: '#D8A64B',
              }}
            />
          </Stack>
          <TextField
            size="small"
            type="number"
            label="Valid for (days, from now)"
            value={validForDays}
            onChange={(e) => setValidForDays(Number(e.target.value))}
          />
          <Stack direction="row" spacing={1}>
            <Button variant="contained" disabled={busy} onClick={handleRegister} data-testid="issuer-register-btn">
              Register attestation
            </Button>
            <Button variant="text" disabled={busy} onClick={handleSeedDemo} data-testid="issuer-seed-demo-btn">
              Seed 2 more demo attestations
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Registered ({issued.length})
        </Typography>
        <Stack spacing={1.5}>
          {issued.length === 0 && (
            <Typography variant="body2" sx={{ color: '#5C6570' }}>
              No demo attestations registered yet.
            </Typography>
          )}
          {issued.map((att) => {
            const revoked = ledger?.revokedNullifiers.member(att.nullifierHash) ?? false;
            const status = revoked ? LivenessStatus.REVOKED : LivenessStatus.LIVE;
            return (
              <Box key={toHexString(att.ref)} sx={{ border: '1px solid #1E242C', borderRadius: 1, p: 1.25 }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2">
                      {att.counterparty} <Chip size="small" label="DEMO PARTICIPANT" sx={{ ml: 0.5 }} />
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#9AA2AD' }}>
                      {att.verificationType}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ display: 'block', fontFamily: monoFontFamily, color: '#5C6570' }}
                    >
                      ref {shortHex(toHexString(att.ref))} · valid {formatUnixSeconds(att.validFrom)} →{' '}
                      {formatUnixSeconds(att.validUntil)}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={status === LivenessStatus.REVOKED ? 'REVOKED' : 'ACTIVE'}
                    color={revoked ? 'error' : 'success'}
                  />
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={busy}
                    onClick={() => handleExport(att.ref)}
                    data-testid={`issuer-export-btn-${shortHex(toHexString(att.ref), 4)}`}
                  >
                    Export proof packet
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    disabled={busy || revoked}
                    onClick={() => handleRevoke(att.ref)}
                    data-testid={`issuer-revoke-btn-${shortHex(toHexString(att.ref), 4)}`}
                  >
                    Revoke
                  </Button>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </CardContent>

      <Dialog open={!!exportedPacket} onClose={() => setExportedPacket(undefined)} fullWidth maxWidth="sm">
        <DialogTitle>Proof packet</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#9AA2AD', mb: 1.5 }}>
            Send this text to the verifier out-of-band (paste it into the verifier panel&apos;s &quot;Import proof
            packet&quot; box). It never contains this issuer&apos;s secret, and never the raw compliance file — only the
            hashed record fields <code>proveLive</code> already discloses, plus the public commitment.
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={10}
            value={exportedPacket?.text ?? ''}
            slotProps={{ htmlInput: { readOnly: true, style: { fontFamily: monoFontFamily, fontSize: 12 } } }}
            data-testid="issuer-export-packet-text"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCopyExported} data-testid="issuer-export-copy-btn">
            Copy to clipboard
          </Button>
          <Button onClick={() => setExportedPacket(undefined)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};
