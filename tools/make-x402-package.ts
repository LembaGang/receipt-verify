// make-x402-package — assemble one x402 settlement evidence package.
//
//   npx tsx tools/make-x402-package.ts <id>            # one, by id below
//   npx tsx tools/make-x402-package.ts --list
//
// A package is a directory a third party can be handed: the artefacts as bytes,
// a chain reading with both endpoints' answers, the verifier's full JSON output
// including its coverage block, and a statement in words of what the whole thing
// does and does not establish. `tools/sign-package.sh` then writes SHA256SUMS
// over it and signs it; `tools/verify-package.sh` checks all of that with no key
// but the repository's own SIGNING_KEYS.
//
// The artefacts are COPIED, byte for byte, from the pins outside this repository
// and their source path is recorded per file in manifest.json beside the sha256
// and the byte count. Copying rather than re-deriving is the point: a package
// whose artefacts were regenerated would be a package about this tool, and the
// dispute is about what crossed the wire.
//
// This tool reads pinned files from OUTSIDE the repository (the paths in
// `RECIPES`). It is not part of the test suite and nothing in the suite runs it;
// the suite reads the fixtures under fixtures/x402/, which never move.

import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { x402SettlementAdapter } from "../src/adapters/x402-settlement.js";
import { jsonResult } from "../src/verdict.js";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PINS = "C:/Users/User/cc-output/pins";

const sha256 = (b: Buffer): string => createHash("sha256").update(b).digest("hex");

interface Artefact {
  /** Where it goes inside the package, under artefacts/. */
  name: string;
  /** Absolute source path, outside this repository. */
  from: string;
  /** What this file is, one line, in the manifest. */
  role: string;
}

interface Recipe {
  id: string;
  dir: string;
  title: string;
  transaction: string;
  /** The envelope fixture the verdict is taken over. */
  envelope: string;
  /** The chain-read document, written by tools/chain-read.ts. */
  chain: string;
  artefacts: Artefact[];
  statement: string;
}

export const RECIPES: Recipe[] = [];

function push(r: Recipe): void {
  RECIPES.push(r);
}

push({
  id: "x402-base-2026-09-07-0x46db8fc8",
  dir: "packages/x402-base-2026-09-07-0x46db8fc8",
  title: "Settlement one of 7 September 2026",
  transaction: "0x46db8fc8cfd79017375d76c5ad80256950f8437ff009ecbe90b6cd5ce97e9263",
  envelope: "fixtures/x402/settlements/settlement-2026-09-07-0x46db8fc8.envelope.json",
  chain: "packages/x402-base-2026-09-07-0x46db8fc8/chain.json",
  statement: "packages/x402-base-2026-09-07-0x46db8fc8/statement.md",
  artefacts: [
    { name: "paid-pr-header-decoded.json", from: `${PINS}/live-2026-09-07/paid-pr-header-decoded.json`, role: "the 402 payment-required object, header-decoded" },
    { name: "pr-header.b64", from: `${PINS}/live-2026-09-07/pr-header.b64`, role: "the base64 original of the 402 object; it decodes byte for byte to paid-pr-header-decoded.json" },
    { name: "paid-client-x-payment.decoded.json", from: `${PINS}/live-2026-09-07/paid-client-x-payment.decoded.json`, role: "the payment payload the client sent, decoded, whole" },
    { name: "paid-client-x-payment.b64.txt", from: `${PINS}/live-2026-09-07/paid-client-x-payment.b64.txt`, role: "the base64 original of the payment payload" },
    { name: "paid-payment-response.decoded.json", from: `${PINS}/live-2026-09-07/paid-payment-response.decoded.json`, role: "the settle object the server returned, decoded" },
    { name: "paid-payment-response.b64", from: `${PINS}/live-2026-09-07/paid-payment-response.b64`, role: "the base64 original of the settle object" },
    { name: "paid-client-attempt-2.request-headers.txt", from: `${PINS}/live-2026-09-07/paid-client-attempt-2.request-headers.txt`, role: "the paid request's headers as sent, which is where the header NAME the 2.20.0 client used is readable" },
  ],
});

push({
  id: "x402-base-2026-09-07-0x94bfba79",
  dir: "packages/x402-base-2026-09-07-0x94bfba79",
  title: "Settlement two of 7 September 2026",
  transaction: "0x94bfba79903d560e54bf0bf79c347d54d057357fb3389ab9dfd76e44d0bdbdd1",
  envelope: "fixtures/x402/settlements/settlement-2026-09-07-0x94bfba79.envelope.json",
  chain: "packages/x402-base-2026-09-07-0x94bfba79/chain.json",
  statement: "packages/x402-base-2026-09-07-0x94bfba79/statement.md",
  artefacts: [
    { name: "paid-402-payment-required.decoded.json", from: `${PINS}/live-2026-09-07-day2/paid/paid-402-payment-required.decoded.json`, role: "the 402 payment-required object, header-decoded" },
    { name: "paid-402-payment-required.b64", from: `${PINS}/live-2026-09-07-day2/paid/paid-402-payment-required.b64`, role: "the base64 original of the 402 object" },
    { name: "client-x-payment.decoded.json", from: `${PINS}/live-2026-09-07-day2/paid/client-x-payment.decoded.json`, role: "the payment payload the client sent, decoded, whole -- payer, nonce and signature included" },
    { name: "client-x-payment.b64.txt", from: `${PINS}/live-2026-09-07-day2/paid/client-x-payment.b64.txt`, role: "the base64 original of the payment payload" },
    { name: "payment-response.decoded.json", from: `${PINS}/live-2026-09-07-day2/paid/payment-response.decoded.json`, role: "the settle object the server returned, decoded" },
    { name: "payment-response.b64", from: `${PINS}/live-2026-09-07-day2/paid/payment-response.b64`, role: "the base64 original of the settle object" },
    { name: "paid-receipt.json", from: `${PINS}/live-2026-09-07-day2/paid/paid-receipt.json`, role: "the paid 200's body: our own signed market-state receipt for the delivered response. Carries no settlement member -- see statement.md" },
    { name: "README.txt", from: `${PINS}/live-2026-09-07-day2/paid/README.txt`, role: "the operator's own record of the run that produced these bytes, copied unedited" },
  ],
});

interface ManifestFile {
  path: string;
  bytes: number;
  sha256: string;
  source: string;
  role: string;
}

export function buildManifest(recipe: Recipe, extra: ManifestFile[]): Record<string, unknown> {
  const files: ManifestFile[] = [];
  const outDir = join(ROOT, ...recipe.dir.split("/"));
  mkdirSync(join(outDir, "artefacts"), { recursive: true });
  for (const a of recipe.artefacts) {
    if (!existsSync(a.from)) throw new Error(`artefact source missing: ${a.from}`);
    const dest = join(outDir, "artefacts", a.name);
    copyFileSync(a.from, dest);
    const bytes = readFileSync(dest);
    files.push({
      path: `artefacts/${a.name}`,
      bytes: bytes.length,
      sha256: sha256(bytes),
      source: a.from,
      role: a.role,
    });
  }
  files.push(...extra);
  return {
    schema: "receipt-verify/x402-package/0",
    id: recipe.id,
    title: recipe.title,
    transaction: recipe.transaction,
    network: "eip155:8453",
    built_at: new Date().toISOString(),
    built_by: "tools/make-x402-package.ts",
    verifier: "@headlessoracle/receipt-verify, format x402.settlement/2",
    how_to_check:
      "sh tools/verify-package.sh <this directory> checks every digest below, that no file in the package is missing from SHA256SUMS, and that SHA256SUMS.sig verifies against the repository's SIGNING_KEYS. " +
      "npm run walk recomputes every sha256 in this manifest from the file beside it. Neither says the contents are true; statement.md says what they do and do not show.",
    files,
  };
}

async function main(): Promise<void> {
  const arg = process.argv[2];
  if (arg === undefined || arg === "--list") {
    for (const r of RECIPES) console.log(`${r.id}\t${r.dir}`);
    return;
  }
  const recipe = RECIPES.find((r) => r.id === arg);
  if (recipe === undefined) {
    console.error(`make-x402-package: no recipe ${arg}; --list shows them`);
    process.exitCode = 2;
    return;
  }
  const outDir = join(ROOT, ...recipe.dir.split("/"));
  // artefacts/ is rewritten whole so a renamed artefact cannot linger.
  rmSync(join(outDir, "artefacts"), { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  // ---- verdict.json, over the envelope, exactly as the CLI would print it ----
  const envelopeBytes = readFileSync(join(ROOT, ...recipe.envelope.split("/")));
  const result = await x402SettlementAdapter.verify(envelopeBytes, {});
  writeFileSync(join(outDir, "verdict.json"), jsonResult(result) + "\n", "utf8");

  // ---- envelope.json, the input that verdict.json is the output of ----------
  writeFileSync(join(outDir, "envelope.json"), envelopeBytes);

  const extra: ManifestFile[] = [];
  for (const [name, role] of [
    ["envelope.json", "the x402.settlement/2 envelope the verdict was taken over: the three artefacts above plus the chain reading below, in one document"],
    ["verdict.json", "the verifier's full output, coverage block included, as `receipt-verify --format x402 --json` prints it"],
    ["chain.json", "both endpoints' raw answers with URLs, read times and per-response digests, and whether they agree"],
    ["statement.md", "what this package establishes, what it does not, and the standing Interests paragraph"],
  ] as const) {
    const p = join(outDir, name);
    if (!existsSync(p)) throw new Error(`${recipe.dir}/${name} is not present; write it before building the manifest`);
    const bytes = readFileSync(p);
    extra.push({ path: name, bytes: bytes.length, sha256: sha256(bytes), source: `generated in ${recipe.dir}`, role });
  }

  const manifest = buildManifest(recipe, extra);
  writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`${recipe.dir}: ${(manifest["files"] as ManifestFile[]).length} files, verdict ${result.verdict}/${result.reason}`);
  console.log(`  now: sh tools/sign-package.sh ${recipe.dir} && sh tools/verify-package.sh ${recipe.dir}`);
}

if (basename(process.argv[1] ?? "") === "make-x402-package.ts") {
  await main();
}
