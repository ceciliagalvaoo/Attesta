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

/** Hex-encodes a byte array (no `0x` prefix — matches how the rest of the app reads hashes). */
export const toHexString = (bytes: Uint8Array): string => Buffer.from(bytes).toString('hex');

/** Truncates a hex string to `first…last` for compact monospaced display. */
export const shortHex = (hex: string, keep = 6): string =>
  hex.length <= keep * 2 + 1 ? hex : `${hex.slice(0, keep)}…${hex.slice(-keep)}`;

/** Formats a Unix-seconds `bigint` as a readable UTC timestamp. */
export const formatUnixSeconds = (seconds: bigint): string =>
  new Date(Number(seconds) * 1000).toISOString().replace('.000Z', 'Z');

/** Formats a Merkle root digest (`{ field: bigint }`) as a truncated hex string. */
export const formatRoot = (root: { field: bigint }): string => shortHex(root.field.toString(16).padStart(64, '0'), 8);

/** SHA-256 of a UTF-8 string, as a 32-byte `Uint8Array` — used only to derive `rawDataHash`. */
export const sha256 = async (input: string): Promise<Uint8Array> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return new Uint8Array(digest);
};
