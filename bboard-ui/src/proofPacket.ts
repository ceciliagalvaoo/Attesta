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

/**
 * (De)serializes a D27 {@link ProofPacket} to/from the plain-text form the issuer panel
 * exports and the verifier panel imports — see `.claude/agents/frontend-engineer.md`:
 * "pode ser um botão que copia um JSON/texto para a área de transferência ... não
 * precisa ser um serviço de rede separado nesta Wave." Plain JSON, `Uint8Array` fields
 * hex-encoded, `bigint` fields as strings (JSON has neither natively).
 *
 * This module never touches `issuerSecret`/`revocationSecret` — it only knows the
 * `ProofPacket` shape, which structurally cannot contain them (see
 * `contract/src/witnesses.ts`).
 */
import type { ProofPacket } from '../../api/src/index';
import { toHexString } from './format';

const PACKET_VERSION = 1;

type SerializedProofPacket = {
  readonly attestaProofPacketVersion: 1;
  readonly rawDataHash: string;
  readonly validFrom: string;
  readonly validUntil: string;
  readonly issuerId: string;
  readonly nullifierHash: string;
  readonly salt: string;
  readonly commitment: string;
};

export const serializeProofPacket = (packet: ProofPacket): string => {
  const serialized: SerializedProofPacket = {
    attestaProofPacketVersion: PACKET_VERSION,
    rawDataHash: toHexString(packet.rawDataHash),
    validFrom: packet.validFrom.toString(),
    validUntil: packet.validUntil.toString(),
    issuerId: toHexString(packet.issuerId),
    nullifierHash: toHexString(packet.nullifierHash),
    salt: toHexString(packet.salt),
    commitment: toHexString(packet.commitment),
  };
  return JSON.stringify(serialized, null, 2);
};

const fromHexString = (hex: string, field: string): Uint8Array => {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) {
    throw new Error(`Invalid proof packet: field "${field}" is not valid hex.`);
  }
  return new Uint8Array(Buffer.from(hex, 'hex'));
};

const requireString = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid proof packet: missing or malformed field "${field}".`);
  }
  return value;
};

export const deserializeProofPacket = (text: string): ProofPacket => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Invalid proof packet: not valid JSON.');
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Invalid proof packet: expected a JSON object.');
  }
  const record = parsed as Record<string, unknown>;
  if (record.attestaProofPacketVersion !== PACKET_VERSION) {
    throw new Error(
      `Invalid proof packet: unrecognized version "${String(record.attestaProofPacketVersion)}" (expected ${PACKET_VERSION}).`,
    );
  }
  return {
    rawDataHash: fromHexString(requireString(record.rawDataHash, 'rawDataHash'), 'rawDataHash'),
    validFrom: BigInt(requireString(record.validFrom, 'validFrom')),
    validUntil: BigInt(requireString(record.validUntil, 'validUntil')),
    issuerId: fromHexString(requireString(record.issuerId, 'issuerId'), 'issuerId'),
    nullifierHash: fromHexString(requireString(record.nullifierHash, 'nullifierHash'), 'nullifierHash'),
    salt: fromHexString(requireString(record.salt, 'salt'), 'salt'),
    commitment: fromHexString(requireString(record.commitment, 'commitment'), 'commitment'),
  };
};
