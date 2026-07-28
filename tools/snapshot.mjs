// snapshot.mjs — pull every remote fixture into fixtures/ and refs/, then
// regenerate fixtures/provenance.md.
//
// Run: node tools/snapshot.mjs
//
// The test suite NEVER reaches the network (one explicitly-marked live-JWKS
// integration test excepted). This script is the only thing that does, and it
// pins what it fetched by sha256 so a later re-run can be diffed against the
// recorded provenance.

import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const UA = { "user-agent": "receipt-verify/0.1.0-dev (fixture snapshot)" };

const GH_RAW = "https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/";
const GH_TREE = "https://api.github.com/repos/TKCollective/agentoracle-receipt-spec/git/trees/HEAD?recursive=1";
const JWKS_URL = "https://agentoracle.co/.well-known/jwks.json";

const DRAFT_URLS = [
  "https://www.ietf.org/archive/id/draft-krausz-verification-state-01.txt",
  "https://www.ietf.org/archive/id/draft-farley-acta-signed-receipts-02.txt",
  "https://www.ietf.org/archive/id/draft-marques-asqav-compliance-receipts-07.txt",
];

// The ACTA test-vector corpus. draft-farley-acta-signed-receipts-02 §5.10 says
// "an interoperability test suite is published alongside this draft"; the only
// locator the draft gives for one is [I-D.agent-governance-testvectors], which
// resolves here. What that repository actually publishes is snapshotted below
// so the gap between the two can be stated from bytes rather than from memory —
// see FINDINGS.md §E1. Paths are listed explicitly rather than swept: the
// repository also carries a2a-trust-header and cedar-policy-gate corpora that
// are not ACTA receipts and would misrepresent the set if folded in.
const ACTA_RAW = "https://raw.githubusercontent.com/ScopeBlind/agent-governance-testvectors/HEAD/";
const ACTA_FILES = [
  "README.md",
  "spec.md",
  "expected/receipt-schema.json",
  "expected/chain.jsonl",
  "fixtures/keys/README.md",
  "aps-gateway-enforcement/README.md",
  "aps-gateway-enforcement/2-external-verification/receipt.json",
  "aps-gateway-enforcement/2-external-verification/jwks.json",
  "aps-gateway-enforcement/2-external-verification/canonical.txt",
  "aps-gateway-enforcement/2-external-verification/expected-output.json",
  "aps-gateway-enforcement/2-external-verification/README.md",
  "aps-gateway-enforcement/4-portability/receipt.json",
  "aps-gateway-enforcement/4-portability/jwks.json",
  "aps-gateway-enforcement/4-portability/expected-output.json",
];

// Local read-only corpus. Snapshotted too: tests must not depend on a path
// outside this repo, and the manifest pins each receipt's sha256 so the copy is
// provably the same bytes as the corpus.
const VECTORS_SRC = "C:\\Users\\User\\agent-action-receipt-vectors";
const VECTORS_FILES = [
  "manifest.json",
  "jwks.json",
  "SPEC.md",
  "README.md",
  "vectors/allow/chain.jsonl",
  "vectors/deny/chain.jsonl",
  "vectors/fail-closed/chain.jsonl",
  "vectors/tampered/chain.jsonl",
  "vectors/chain-multi/chain.jsonl",
  "vectors/canonicalization-key-order/chain.jsonl",
];

const sha256 = (b) => createHash("sha256").update(b).digest("hex");
const entries = [];

/**
 * Recursive: the acta fixtures nest one chain per candidate digest scope in
 * their own subdirectories, and an unpinned fixture is a fixture whose bytes
 * nothing is asserting — which is the whole thing provenance.md exists to stop.
 */
function listFiles(dir) {
  let out = [];
  try {
    for (const d of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, d.name);
      if (d.isFile()) out.push(p);
      else if (d.isDirectory()) out = out.concat(listFiles(p));
    }
  } catch {
    return [];
  }
  return out.sort();
}

function writeOut(relPath, bytes, source, retrievedAt) {
  const abs = join(ROOT, relPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, bytes);
  entries.push({
    path: relPath.replace(/\\/g, "/"),
    source,
    retrieved_at: retrievedAt,
    bytes: bytes.length,
    sha256: sha256(bytes),
  });
}

async function fetchBytes(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  // ---- 1. I-D texts -----------------------------------------------------
  for (const url of DRAFT_URLS) {
    const at = new Date().toISOString();
    const bytes = await fetchBytes(url);
    const rel = "refs/" + url.slice(url.lastIndexOf("/") + 1);
    writeOut(rel, bytes, url, at);
    console.log(rel);
  }

  // ---- 2. agentoracle-receipt-spec /examples ----------------------------
  {
    const tree = await (await fetch(GH_TREE, { headers: UA })).json();
    const wanted = tree.tree
      .filter((t) => t.type === "blob" && t.path.startsWith("examples/"))
      .filter((t) => !t.path.includes("__pycache__"))
      .map((t) => t.path);
    for (const p of wanted) {
      const at = new Date().toISOString();
      const bytes = await fetchBytes(GH_RAW + p);
      writeOut(join("fixtures", "verification-state", "spec-examples", p.slice("examples/".length)), bytes, GH_RAW + p, at);
      console.log("  " + p);
    }
  }

  // ---- 3. live issuer JWKS ---------------------------------------------
  {
    const at = new Date().toISOString();
    const bytes = await fetchBytes(JWKS_URL);
    writeOut("fixtures/verification-state/jwks/agentoracle.co.well-known.jwks.json", bytes, JWKS_URL, at);
    console.log("fixtures/verification-state/jwks/agentoracle.co.well-known.jwks.json");
  }

  // ---- 4. local evidence.action conformance corpus ----------------------
  for (const rel of VECTORS_FILES) {
    const src = join(VECTORS_SRC, rel.replace(/\//g, "\\"));
    const at = new Date(statSync(src).mtime).toISOString();
    const bytes = readFileSync(src);
    writeOut(join("fixtures", "evidence-action", rel), bytes, `file://${src.replace(/\\/g, "/")}`, at);
    console.log("  " + rel);
  }

  // ---- 5. ACTA test-vector corpus ---------------------------------------
  for (const p of ACTA_FILES) {
    const at = new Date().toISOString();
    const bytes = await fetchBytes(ACTA_RAW + p);
    writeOut(join("fixtures", "acta", "published", p), bytes, ACTA_RAW + p, at);
    console.log("  " + p);
  }

  // ---- 6. provenance.md -------------------------------------------------
  // Locally generated files are listed separately. They are NOT snapshots of
  // anything remote, and conflating the two would misrepresent where the bytes
  // came from — which is the only thing this file exists to say.
  const generated = [];
  for (const rel of listFiles(join(ROOT, "fixtures", "verification-state", "synthetic")).concat(
    listFiles(join(ROOT, "fixtures", "verification-state", "mappings")),
    listFiles(join(ROOT, "fixtures", "acta", "synthetic")),
    listFiles(join(ROOT, "fixtures", "acta", "keys")),
    listFiles(join(ROOT, "fixtures", "keys")),
  )) {
    const bytes = readFileSync(rel);
    generated.push({
      path: relative(ROOT, rel).replace(/\\/g, "/"),
      bytes: bytes.length,
      sha256: sha256(bytes),
    });
  }

  const now = new Date().toISOString();
  const lines = [
    "# Fixture provenance",
    "",
    "Every fixture in this directory (and `refs/`) is a byte-exact snapshot of a",
    "remote or external source. The test suite reads these snapshots and never",
    "fetches at test time — the single exception is the live-JWKS integration test",
    "in `test/live-jwks.test.ts`, which is explicitly marked and skips when offline",
    "or when `RECEIPT_VERIFY_LIVE` is unset.",
    "",
    `Regenerate with \`node tools/snapshot.mjs\`. Table last written ${now}.`,
    "",
    "For local-file sources, `retrieved (UTC)` is the source file's mtime — the",
    "corpus is a frozen artifact, so its own timestamp is the meaningful one.",
    "",
    "| file | source | retrieved (UTC) | bytes | sha256 |",
    "|---|---|---|---|---|",
    ...entries.map(
      (e) => `| \`${e.path}\` | ${e.source} | ${e.retrieved_at} | ${e.bytes} | \`${e.sha256}\` |`,
    ),
    "",
    "## Generated here, not snapshotted",
    "",
    "These files are produced by `node tools/make-throwaway-fixtures.mjs`, by",
    "`node tools/make-acta-fixtures.mjs`, and by hand (the mapping documents).",
    "They are not copies of any published artifact.",
    "",
    "The signing keys are throwaways whose seeds are published in the generators.",
    "The `verification.*` fixtures carry `test-throwaway` in the key id; the",
    "`acta` fixtures use the §2.1.1 `sb:issuer:<base58>` kid form over the same",
    "throwaway seeds, so the kid alone does not mark them — `fixtures/acta/keys/`",
    "carries the warning instead.",
    "",
    "The `acta` set exists because draft-farley-acta-signed-receipts-02 §5.10",
    "announces an interoperability suite that its own test-vector reference does",
    "not contain. These are OUR construction of that suite, not the draft",
    "author's. See FINDINGS.md §E1.",
    "",
    "| file | bytes | sha256 |",
    "|---|---|---|",
    ...generated.map((e) => `| \`${e.path}\` | ${e.bytes} | \`${e.sha256}\` |`),
    "",
  ];
  writeFileSync(join(ROOT, "fixtures", "provenance.md"), lines.join("\n"), "utf8");
  console.log(`\nprovenance.md — ${entries.length} files`);
}

main().catch((e) => {
  console.error("snapshot failed:", e.message);
  process.exit(1);
});
