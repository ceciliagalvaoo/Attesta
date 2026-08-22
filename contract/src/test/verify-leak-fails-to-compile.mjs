#!/usr/bin/env node
// This file is part of Attesta.
// Copyright (C) 2026 The Attesta Contributors
// SPDX-License-Identifier: Apache-2.0
//
// Mandatory test 1 of 3 (contexto/08-BUILD-PROMPT.md, Bloco 1, feature 3):
// "vazamento sem disclose() falha na compilação — o teste tenta expor o
// dado bruto de propósito e confirma que o build falha com a categoria de
// erro correta."
//
// This cannot be a vitest test: the thing being asserted is that
// `compactc` refuses to produce a contract module at all, so there would be
// nothing to `import` into a vitest test file in the first place. Instead
// this script shells out to the real `compact` CLI (the same one
// `npm run compact` uses) against two fixtures in ./leak-fixture/:
//
//   - leaky.compact       returns a witness value with no disclose() and
//                          MUST fail to compile, with the "Witness and
//                          Disclosure Errors" category (the compiler's
//                          message mentions "disclosure").
//   - leaky-fixed.compact the same circuit, disclose() added back, and
//                          MUST compile successfully — the control that
//                          proves the failure above is really about the
//                          missing disclose() and not some unrelated
//                          mistake in the fixture.
//
// Wired as the `pretest` script in package.json, so `npm test` (and
// `npm run ci`) always runs this before vitest, and the overall command
// fails loudly if either expectation is violated — without this script (or
// its two fixtures) ever being importable by, or able to crash, the vitest
// process itself.

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtureDir = join(__dirname, "leak-fixture");

const compile = (sourceFile) => {
  const outDir = mkdtempSync(join(tmpdir(), "attesta-leak-check-"));
  try {
    const result = spawnSync(
      "compact",
      ["compile", "--skip-zk", join(fixtureDir, sourceFile), outDir],
      { encoding: "utf8" },
    );
    return {
      status: result.status,
      error: result.error,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
    };
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
};

const fail = (message) => {
  console.error(`\n[verify-leak-fails-to-compile] FAIL: ${message}\n`);
  process.exit(1);
};

console.log(
  "[verify-leak-fails-to-compile] Checking that a witness-value leak without disclose() fails to compile...",
);

const leaky = compile("leaky.compact");

if (leaky.error && leaky.error.code === "ENOENT") {
  fail(
    "the `compact` CLI is not on PATH. Install it (see README) before running tests — " +
      "this check deliberately does not skip itself, because a missing compiler must not " +
      "be silently reported as \"the leak test passed\".",
  );
}

const combinedOutput = `${leaky.stdout}\n${leaky.stderr}`;

if (leaky.status === 0) {
  fail(
    "leaky.compact compiled successfully. A witness value (rawDataHash) flowed to a " +
      "public circuit return without disclose() and the compiler accepted it — this is " +
      "supposed to be impossible. Either compactc's behavior changed, or the fixture no " +
      "longer represents a real leak; investigate before trusting disclose() anywhere " +
      "in attesta.compact.",
  );
}

if (!/disclos/i.test(combinedOutput)) {
  fail(
    "leaky.compact failed to compile, but not with a disclosure-related error. This may " +
      "be an unrelated syntax problem in the fixture, not proof that the disclose() " +
      `guard works. Compiler output was:\n${combinedOutput}`,
  );
}

console.log(
  "[verify-leak-fails-to-compile] OK: leaky.compact was rejected at compile time with a " +
    "disclosure error, as required.",
);

console.log(
  "[verify-leak-fails-to-compile] Checking that the same circuit compiles once disclose() is added back...",
);

const fixed = compile("leaky-fixed.compact");

if (fixed.status !== 0) {
  fail(
    "leaky-fixed.compact (identical to leaky.compact, but with disclose() added) failed " +
      `to compile. This means the fixture pair isn't isolating disclose() as the cause. ` +
      `Compiler output was:\n${fixed.stdout}\n${fixed.stderr}`,
  );
}

console.log(
  "[verify-leak-fails-to-compile] OK: leaky-fixed.compact compiled successfully — " +
    "disclose() is exactly what the leaky fixture was missing.",
);

if (!existsSync(fixtureDir)) {
  // Unreachable in practice; guards against the fixture directory moving
  // without this script being updated.
  fail(`fixture directory not found: ${fixtureDir}`);
}

console.log(
  "\n[verify-leak-fails-to-compile] PASS — witness-value disclosure is enforced at compile time.\n",
);
