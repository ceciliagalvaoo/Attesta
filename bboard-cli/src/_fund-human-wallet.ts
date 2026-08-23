// Reusable script — funds a real Lace wallet address on the local "Undeployed" devnet
// from the genesis wallet. Kept intentionally (not deleted after use, per Cecília's
// explicit request, 2026-08-23) — every other `_*` throwaway script in this project
// follows the disposable-script convention and gets deleted; this one is the exception.
//
// Usage:
//   cd bboard-cli
//   node --experimental-specifier-resolution=node --loader ts-node/esm \
//     src/_fund-human-wallet.ts <mn_addr_undeployed...> [amount]
//
// Requires the local devnet already running (`npm run standalone`, default ports —
// node 9944, indexer 8088, proof server 6300).
//
// Two real bugs were found and fixed getting this working (2026-08-23), both worth
// knowing before touching this file again:
//
// 1. `MidnightWalletProvider.build()` alone is not enough — it never starts the
//    background sync engine. `WalletFacade.start()` (wallet-sdk-facade/dist/index.js)
//    is what triggers `runtime.dispatch({[V1Tag]: v1 => v1.startSyncInBackground()})`;
//    without calling it, no subscription ever feeds `wallet.state()`, so every read
//    either returns a single default (empty) emission instantly or hangs forever
//    waiting for a second emission that never comes. (The
//    `RPC-CORE: subscribeRuntimeVersion ... Normal Closure` lines logged right after
//    `build()` are an unrelated, benign artifact — `PolkadotNodeClient.make()`
//    deliberately connects just to fetch metadata during `build()` and disconnects
//    immediately by design; it is not a dropped sync connection.)
// 2. Reading wallet/dust state with only a light filter (e.g. "balances non-empty", or
//    an ungated first emission) grabs whatever *partial* sync snapshot happens to exist
//    at that instant — proven by reading the same never-restarted devnet repeatedly and
//    getting wildly different genesis balances/UTXO counts each time. Genuine
//    `syncWallet()` (waits for `isStrictlyComplete()` on shielded + dust + unshielded)
//    is required before trusting any balance read for a transfer — it only ever hung
//    before because `.start()` (bug 1) hadn't been called yet. With `.start()` in place,
//    it reliably finishes in well under a minute on this devnet. Wrapped in an 8-minute
//    `Rx.timeout` here as a safety net, not because it's expected to take that long.

import { createLogger } from './logger-utils.js';
import { MidnightWalletProvider } from './midnight-wallet-provider.js';
import { syncWallet } from './wallet-utils.js';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { ttlOneHour } from '@midnight-ntwrk/midnight-js-utils';
import { MidnightBech32m, UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';
import * as Rx from 'rxjs';
import type { EnvironmentConfiguration } from '@midnight-ntwrk/testkit-js';

const GENESIS_SEED = '0000000000000000000000000000000000000000000000000000000000000001';

// Matches `bboard-cli/compose.yml`'s pinned ports for the local devnet — update if
// those ever change, or read them from a fresh `npm run standalone` log if unsure.
const env: EnvironmentConfiguration = {
  walletNetworkId: 'undeployed',
  networkId: 'undeployed',
  indexer: 'http://127.0.0.1:8088/api/v4/graphql',
  indexerWS: 'ws://127.0.0.1:8088/api/v4/graphql/ws',
  node: 'http://127.0.0.1:9944',
  nodeWS: 'ws://127.0.0.1:9944',
  proofServer: 'http://127.0.0.1:6300',
  faucet: undefined,
};

const RECIPIENT_ADDRESS = process.argv[2];
const AMOUNT_TO_SEND = BigInt(process.argv[3] ?? '2500000000000');

const SYNC_TIMEOUT_MS = 8 * 60 * 1000;

// Not a top-level `await` on purpose: under this project's `--experimental-specifier-
// resolution=node --loader ts-node/esm` launch flags, Node's loader force-exits with
// "Detected unsettled top-level await" (exit code 13) once it decides a pending
// top-level await has no other active handle backing it. Wrapping the body in an async
// function called without being awaited at module scope sidesteps the detector (matches
// the same reasoning already documented in `launcher/standalone.ts`'s header comment).
const main = async (): Promise<void> => {
  if (!RECIPIENT_ADDRESS) {
    console.error('Usage: _fund-human-wallet.ts <mn_addr_undeployed...> [amount]');
    process.exit(1);
  }

  setNetworkId(env.networkId as 'undeployed');

  const logger = await createLogger('logs/fund-human-run.log');

  logger.info('Building genesis wallet against the already-running local devnet...');
  const genesis = await MidnightWalletProvider.build(logger, env, GENESIS_SEED);

  logger.info('Starting genesis wallet background sync...');
  await genesis.start();

  logger.info('Waiting for genesis wallet to finish syncing (shielded + dust + unshielded)...');
  const state = await Rx.firstValueFrom(
    Rx.from(syncWallet(logger, genesis.wallet)).pipe(
      Rx.timeout({
        first: SYNC_TIMEOUT_MS,
        with: () => Rx.throwError(() => new Error(`Genesis wallet sync did not complete within ${SYNC_TIMEOUT_MS}ms.`)),
      }),
    ),
  );

  const unshieldedBalances = state.unshielded.balances;
  const nightTokenType = Object.keys(unshieldedBalances)[0];
  if (!nightTokenType) {
    throw new Error('Genesis wallet has no unshielded balances after a full sync — devnet may not be genuinely fresh.');
  }
  logger.info(`Genesis NIGHT balance before transfer: ${unshieldedBalances[nightTokenType]}`);
  logger.info(`Genesis DUST balance before transfer: ${state.dust.balance(new Date())}`);

  const parsedRecipient = MidnightBech32m.parse(RECIPIENT_ADDRESS).decode(UnshieldedAddress, env.networkId as 'undeployed');

  logger.info(`Transferring ${AMOUNT_TO_SEND} to ${RECIPIENT_ADDRESS}...`);
  const recipe = await genesis.wallet.transferTransaction(
    [
      {
        type: 'unshielded',
        outputs: [{ type: nightTokenType, receiverAddress: parsedRecipient, amount: AMOUNT_TO_SEND }],
      },
    ],
    { shieldedSecretKeys: genesis.zswapSecretKeys, dustSecretKey: genesis.dustSecretKey },
    { ttl: ttlOneHour(), payFees: true },
  );

  const signedRecipe = await genesis.wallet.signRecipe(recipe, (data) => genesis.unshieldedKeystore.signData(data));
  const finalized = await genesis.wallet.finalizeRecipe(signedRecipe);
  const txId = await genesis.wallet.submitTransaction(finalized);

  logger.info(`Transfer submitted: txId=${txId}`);

  const postState = await Rx.firstValueFrom(
    genesis.wallet.state().pipe(
      Rx.filter((s) => (s.unshielded.balances[nightTokenType] ?? 0n) < unshieldedBalances[nightTokenType]),
    ),
  );
  logger.info(`Genesis NIGHT balance after transfer: ${postState.unshielded.balances[nightTokenType]}`);
  logger.info('Done. Check the recipient wallet in Lace — refresh if the balance does not show immediately.');
  process.exit(0);
};

// A bare timer, exactly like `launcher/standalone.ts`, gives the event loop an active
// handle to point at while `main()`'s real async work (network I/O) runs — belt and
// braces alongside not top-level-awaiting `main()` itself.
const keepAlive = setInterval(() => {}, 1 << 30);
void main()
  .catch((error: unknown) => {
    console.error('Fatal error:', error);
    process.exitCode = 1;
  })
  .finally(() => clearInterval(keepAlive));
