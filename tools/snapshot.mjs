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
const DRAFT_URL = "https://www.ietf.org/archive/id/draft-krausz-verification-state-01.txt";

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

function listFiles(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isFile())
      .map((d) => join(dir, d.name))
      .sort();
  } catch {
    return [];
  }
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
  // ---- 1. I-D text ------------------------------------------------------
  {
    const at = new Date().toISOString();
    const bytes = await fetchBytes(DRAFT_URL);
    writeOut("refs/draft-krausz-verification-state-01.txt", bytes, DRAFT_URL, at);
    console.log("refs/draft-krausz-verification-state-01.txt");
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

  // ---- 5. provenance.md -------------------------------------------------
  // Locally generated files are listed separately. They are NOT snapshots of
  // anything remote, and conflating the two would misrepresent where the bytes
  // came from — which is the only thing this file exists to say.
  const generated = [];
  for (const rel of listFiles(join(ROOT, "fixtures", "verification-state", "synthetic")).concat(
    listFiles(join(ROOT, "fixtures", "verification-state", "mappings")),
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
    "These files are produced by `node tools/make-throwaway-fixtures.mjs` and by",
    "hand (the mapping documents). They are not copies of any published artifact.",
    "The signing key is a throwaway whose seed is published in the generator, and",
    "every file it signs carries `test-throwaway` in the key id.",
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
