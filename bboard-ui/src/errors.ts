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
 * Central place to turn any error this app can encounter — most importantly, the
 * `@midnight-ntwrk/dapp-connector-api` {@link APIError} union — into a message that is
 * always shown on screen, never swallowed.
 *
 * @remarks
 * Trap documented in `.claude/agents/frontend-engineer.md`: `ErrorCodes`/`APIError` from
 * the dapp connector must be surfaced to the user, not swallowed. A silent failure here
 * (wallet not connected, user rejected a signature) is indistinguishable from "the
 * product is broken" — every call site that can throw a wallet/connector error must
 * route the caught error through {@link describeError} and render the result.
 */
import type { APIError } from '@midnight-ntwrk/dapp-connector-api';

export const isAPIError = (error: unknown): error is APIError =>
  typeof error === 'object' &&
  error !== null &&
  (error as { type?: unknown }).type === 'DAppConnectorAPIError' &&
  typeof (error as { code?: unknown }).code === 'string';

const API_ERROR_MESSAGES: Record<string, string> = {
  InternalError: 'The wallet could not process this request. Try again, or check the wallet extension.',
  Rejected: 'You rejected the request in the wallet — nothing was submitted.',
  InvalidRequest: 'The wallet rejected this as a malformed request (this is a bug, please report it).',
  PermissionRejected: 'The wallet denied Attesta permission to perform this action.',
  Disconnected: 'The wallet connection was lost. Reconnect the wallet and try again.',
};

/** Turns any error this app can encounter into a message safe (and useful) to display. */
export const describeError = (error: unknown): string => {
  if (isAPIError(error)) {
    const known = API_ERROR_MESSAGES[error.code];
    return known ?? `Wallet error (${error.code}): ${error.reason || error.message}`;
  }
  if (error instanceof Error) {
    return error.message.length ? error.message : 'An unexpected error occurred.';
  }
  return String(error);
};
