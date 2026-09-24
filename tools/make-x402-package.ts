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

push({
  id: "x402-base-payai-0x9ecf68be",
  dir: "packages/x402-base-payai-0x9ecf68be",
  title: "Observation: one PayAI-submitted settlement on Base, chain side only",
  transaction: "0x9ecf68be92ca279e6e8874f4ff7bb882da7da05fe8de362967be5ab4d4f6f835",
  envelope: "fixtures/x402/observations/payai-2026-09-16-0x9ecf68be.envelope.json",
  chain: "packages/x402-base-payai-0x9ecf68be/chain.json",
  statement: "packages/x402-base-payai-0x9ecf68be/statement.md",
  // No artefacts. That is the whole point of this package: nobody here holds the
  // 402, the payload or the settle answer for this settlement, and the package
  // is built out of public bytes and says where that stops.
  artefacts: [
    { name: "payai-facilitator-supported_2026-09-10T1254Z.json", from: `${PINS}/payai-facilitator-supported_2026-09-10T1254Z.json`, role: "PayAI's published /supported, as fetched 2026-09-10T12:54Z: the fifteen eip155:* signer addresses this package compares the submitter against. UNSIGNED, and the supplier's word as of that fetch" },
    { name: "payai-facilitator-openapi_2026-09-10T1412Z.json", from: `${PINS}/payai-facilitator-openapi_2026-09-10T1412Z.json`, role: "PayAI's published OpenAPI, as fetched 2026-09-10T14:12Z: its SettleResponse requires success, transaction, network and payer, and has no signature member" },
    { name: "discovery/README.txt", from: `${PINS}/payai-chain-2026-09-16/README.txt`, role: "how this settlement was found, from the pin directory, unedited" },
    { name: "discovery/scan.mjs", from: `${PINS}/payai-chain-2026-09-16/scan.mjs`, role: "the scanner exactly as run: eth_getLogs for AuthorizationUsed on USDC, then eth_getTransactionByHash per candidate" },
    { name: "discovery/scan-log.json", from: `${PINS}/payai-chain-2026-09-16/scan-log_2026-09-16T1023Z.json`, role: "every JSON-RPC call the scan made, with endpoint, time, HTTP status and the sha256 of each response body" },
    { name: "discovery/eth_getLogs_51381946-51382346.json", from: `${PINS}/payai-chain-2026-09-16/eth_getLogs_51381946-51382346.json`, role: "the discovery response whole, re-fetched at 10:25:29Z and byte-identical to the digest the scan log recorded at 10:22:49Z" },
    { name: "discovery/eth_getTransactionByHash_0x9ecf68be.json", from: `${PINS}/payai-chain-2026-09-16/eth_getTransactionByHash_0x9ecf68be.json`, role: "the sender lookup that decided the match, whole" },
    { name: "discovery/SHA256SUMS.txt", from: `${PINS}/payai-chain-2026-09-16/SHA256SUMS.txt`, role: "the pin directory's own digest list, copied so this package carries the same statement the pins do" },
  ],
});

// The seller packages select by PAYEE, not by submitter: the settlement is one
// paid to the address the seller itself publishes. known_submitters in each
// envelope is the census PayAI signer pin and nothing else, so the verdict names
// one source for the whole list.
push({
  id: "x402-base-botpay-0xccd5497a",
  dir: "packages/x402-base-botpay-0xccd5497a",
  title: "Observation: one settlement paid to api.botpay.network's published address on Base, chain side only",
  transaction: "0xccd5497a6d1aa6b5623db0ae1d9797ff6fda70e8fd78d5ad6625a23fb565968d",
  envelope: "fixtures/x402/observations/botpay-2026-09-24-0xccd5497a.envelope.json",
  chain: "packages/x402-base-botpay-0xccd5497a/chain.json",
  statement: "packages/x402-base-botpay-0xccd5497a/statement.md",
  artefacts: [
    { name: "botpay-llms-txt_2026-09-10T160231Z.txt", from: `${PINS}/sellers-2026-09-21/botpay/llms.txt`, role: "api.botpay.network's /llms.txt as fetched 2026-09-10T16:02:31Z, whole: line 15 publishes the Base recipient this settlement was selected by. The seller's word as of that fetch" },
    { name: "payai-supported_20260918T101256Z.json", from: `${PINS}/census-2026-09-12/payai-supported_20260918T101256Z.json`, role: "PayAI's published /supported as fetched 2026-09-18T10:12:56Z: the fifteen eip155:* signer addresses the envelope's known_submitters carries. UNSIGNED, and the supplier's word as of that fetch" },
    { name: "discovery/scan.mjs", from: `${PINS}/sellers-2026-09-21/botpay/scan.mjs`, role: "the scanner exactly as run: per window, eth_getLogs for AuthorizationUsed and for Transfer to the payee on USDC, intersected by transaction hash" },
    { name: "discovery/scan-log.json", from: `${PINS}/sellers-2026-09-21/botpay/scan-log.json`, role: "every window scanned and every JSON-RPC call the scan made, with endpoint, time, HTTP status and the sha256 of each response body" },
    { name: "discovery/eth_blockNumber.json", from: `${PINS}/sellers-2026-09-21/botpay/eth_blockNumber.json`, role: "the tip read the window was placed behind, whole" },
    { name: "discovery/eth_getLogs-authorizationUsed-51731596-51731996.json", from: `${PINS}/sellers-2026-09-21/botpay/eth_getLogs-authorizationUsed-51731596-51731996.json`, role: "the matching window's AuthorizationUsed response, whole" },
    { name: "discovery/eth_getLogs-transfer-51731596-51731996.json", from: `${PINS}/sellers-2026-09-21/botpay/eth_getLogs-transfer-51731596-51731996.json`, role: "the matching window's Transfer-to-payee response, whole" },
    { name: "discovery/eth_getTransactionByHash-0xccd5497a6d1aa6b5623db0ae1d9797ff6fda70e8fd78d5ad6625a23fb565968d.json", from: `${PINS}/sellers-2026-09-21/botpay/eth_getTransactionByHash-0xccd5497a6d1aa6b5623db0ae1d9797ff6fda70e8fd78d5ad6625a23fb565968d.json`, role: "the selected transaction as the scan read it, whole" },
    { name: "discovery/SHA256SUMS.txt", from: `${PINS}/sellers-2026-09-21/botpay/SHA256SUMS.txt`, role: "the pin directory's own digest list, written last, copied so this package carries the same statement the pins do" },
  ],
});

push({
  id: "x402-base-chainlink-0x8fa8f7a0",
  dir: "packages/x402-base-chainlink-0x8fa8f7a0",
  title: "Observation: one settlement paid to agents.chain.link's published address on Base, chain side only",
  transaction: "0x8fa8f7a026a6bd352cac97ab4ba3ca5ee0556799efc4556b2b861e4aa6f18c54",
  envelope: "fixtures/x402/observations/chainlink-2026-09-24-0x8fa8f7a0.envelope.json",
  chain: "packages/x402-base-chainlink-0x8fa8f7a0/chain.json",
  statement: "packages/x402-base-chainlink-0x8fa8f7a0/statement.md",
  artefacts: [
    { name: "cdp-discovery-object_agents-chain-link_2026-09-10T155955Z.json", from: `${PINS}/sellers-2026-09-21/chainlink/catalogue-object.json`, role: "the catalogue object carrying the payTo this settlement was selected by: item 201 of Coinbase's x402 discovery page at offset 1000 as fetched 2026-09-10T15:59:55Z (sha256 595a858c...), cut byte for byte at offset 679837. The catalogue's word as of that fetch" },
    { name: "payai-supported_20260918T101256Z.json", from: `${PINS}/census-2026-09-12/payai-supported_20260918T101256Z.json`, role: "PayAI's published /supported as fetched 2026-09-18T10:12:56Z: the fifteen eip155:* signer addresses the envelope's known_submitters carries. UNSIGNED, and the supplier's word as of that fetch" },
    { name: "discovery/scan.mjs", from: `${PINS}/sellers-2026-09-21/chainlink/scan.mjs`, role: "the scanner exactly as run: per window, eth_getLogs for AuthorizationUsed and for Transfer to the payee on USDC, intersected by transaction hash" },
    { name: "discovery/scan-log.json", from: `${PINS}/sellers-2026-09-21/chainlink/scan-log.json`, role: "every window scanned and every JSON-RPC call the scan made, with endpoint, time, HTTP status and the sha256 of each response body" },
    { name: "discovery/eth_blockNumber.json", from: `${PINS}/sellers-2026-09-21/chainlink/eth_blockNumber.json`, role: "the tip read the window was placed behind, whole" },
    { name: "discovery/eth_getLogs-authorizationUsed-51732636-51733036.json", from: `${PINS}/sellers-2026-09-21/chainlink/eth_getLogs-authorizationUsed-51732636-51733036.json`, role: "the matching window's AuthorizationUsed response, whole" },
    { name: "discovery/eth_getLogs-transfer-51732636-51733036.json", from: `${PINS}/sellers-2026-09-21/chainlink/eth_getLogs-transfer-51732636-51733036.json`, role: "the matching window's Transfer-to-payee response, whole" },
    { name: "discovery/eth_getTransactionByHash-0x8fa8f7a026a6bd352cac97ab4ba3ca5ee0556799efc4556b2b861e4aa6f18c54.json", from: `${PINS}/sellers-2026-09-21/chainlink/eth_getTransactionByHash-0x8fa8f7a026a6bd352cac97ab4ba3ca5ee0556799efc4556b2b861e4aa6f18c54.json`, role: "the selected transaction as the scan read it, whole" },
    { name: "discovery/SHA256SUMS.txt", from: `${PINS}/sellers-2026-09-21/chainlink/SHA256SUMS.txt`, role: "the pin directory's own digest list, written last, copied so this package carries the same statement the pins do" },
  ],
});

// B3's payee is the Base payTo in Coinbase's catalogue; PayAI's catalogue lists
// only a Solana address for the same host. The Lead ruled on 24 Sep that "the
// tgz" means any catalogue in it. The PayAI object is carried too, so the
// statement's sentence about it can be checked against bytes.
push({
  id: "x402-base-nansen-0x53865541",
  dir: "packages/x402-base-nansen-0x53865541",
  title: "Observation: one settlement paid to api.nansen.ai's published address on Base, chain side only",
  transaction: "0x53865541edfd87cdf1d83e6181f70ffe8e3e970c99ab6b0848d2496c2c731df0",
  envelope: "fixtures/x402/observations/nansen-2026-09-24-0x53865541.envelope.json",
  chain: "packages/x402-base-nansen-0x53865541/chain.json",
  statement: "packages/x402-base-nansen-0x53865541/statement.md",
  artefacts: [
    { name: "cdp-discovery-object_api-nansen-ai_2026-09-10T155951Z.json", from: `${PINS}/sellers-2026-09-21/nansen/catalogue-object.json`, role: "the catalogue object carrying the payTo this settlement was selected by: item 146 of Coinbase's x402 discovery page at offset 0 as fetched 2026-09-10T15:59:51Z (sha256 0d06754b...), cut byte for byte at offset 518303. The catalogue's word as of that fetch" },
    { name: "payai-discovery-object_api-nansen-ai_2026-09-10T154656Z.json", from: `${PINS}/sellers-2026-09-21/nansen/payai-catalogue-object-solana.json`, role: "NOT the payee source: item 422 of PayAI's x402 discovery page at offset 0 as fetched 2026-09-10T15:46:56Z (sha256 0406b593...), cut byte for byte at offset 707064, carrying the Solana payTo PayAI's catalogue lists for the same host, which this package does not use" },
    { name: "payai-supported_20260918T101256Z.json", from: `${PINS}/census-2026-09-12/payai-supported_20260918T101256Z.json`, role: "PayAI's published /supported as fetched 2026-09-18T10:12:56Z: the fifteen eip155:* signer addresses the envelope's known_submitters carries. UNSIGNED, and the supplier's word as of that fetch" },
    { name: "discovery/scan.mjs", from: `${PINS}/sellers-2026-09-21/nansen/scan.mjs`, role: "the scanner exactly as run: per window, eth_getLogs for AuthorizationUsed and for Transfer to the payee on USDC, intersected by transaction hash" },
    { name: "discovery/scan-log.json", from: `${PINS}/sellers-2026-09-21/nansen/scan-log.json`, role: "every window scanned and every JSON-RPC call the scan made, with endpoint, time, HTTP status and the sha256 of each response body" },
    { name: "discovery/eth_blockNumber.json", from: `${PINS}/sellers-2026-09-21/nansen/eth_blockNumber.json`, role: "the tip read the window was placed behind, whole" },
    { name: "discovery/eth_getLogs-authorizationUsed-51731687-51732087.json", from: `${PINS}/sellers-2026-09-21/nansen/eth_getLogs-authorizationUsed-51731687-51732087.json`, role: "the matching window's AuthorizationUsed response, whole" },
    { name: "discovery/eth_getLogs-transfer-51731687-51732087.json", from: `${PINS}/sellers-2026-09-21/nansen/eth_getLogs-transfer-51731687-51732087.json`, role: "the matching window's Transfer-to-payee response, whole" },
    { name: "discovery/eth_getTransactionByHash-0x53865541edfd87cdf1d83e6181f70ffe8e3e970c99ab6b0848d2496c2c731df0.json", from: `${PINS}/sellers-2026-09-21/nansen/eth_getTransactionByHash-0x53865541edfd87cdf1d83e6181f70ffe8e3e970c99ab6b0848d2496c2c731df0.json`, role: "the selected transaction as the scan read it, whole" },
    { name: "discovery/SHA256SUMS.txt", from: `${PINS}/sellers-2026-09-21/nansen/SHA256SUMS.txt`, role: "the pin directory's own digest list, written last, copied so this package carries the same statement the pins do" },
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
    const dest = join(outDir, "artefacts", ...a.name.split("/"));
    // An artefact name may carry a directory: the PayAI package keeps its
    // discovery record in one, so the bytes that FOUND the settlement sit apart
    // from the bytes that describe the facilitator.
    mkdirSync(dirname(dest), { recursive: true });
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
