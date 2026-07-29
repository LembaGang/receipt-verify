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

// Pinned to a commit, not to HEAD. A moving ref means a re-run silently
// re-bases every fixture on whatever the branch tip happens to be, and the
// provenance table then records a digest for bytes nobody chose. Bump this
// deliberately, and diff the table when you do.
//
// 196df22 — "fixtures(detached): rotate to fixture-suite kid, add RFC 7797
//            b64=false + crit + JCS", 2026-07-29T05:17:01Z. Parent 99a0d39,
//            "fixtures: regenerate composed v0.3 vectors with real AO mapping
//            hash", 2026-07-29T04:58:03Z, which is where the eleven composed
//            vectors in this snapshot come from — they are byte-identical at
//            both commits (verified 2026-07-29).
const GH_COMMIT = "196df22b255e7173d4eb6b20e833cc4e8ae6d35d";
const GH_RAW = `https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/${GH_COMMIT}/`;
const GH_TREE = `https://api.github.com/repos/TKCollective/agentoracle-receipt-spec/git/trees/${GH_COMMIT}?recursive=1`;
const JWKS_URL = "https://agentoracle.co/.well-known/jwks.json";

// The mapping document the composed fixtures content-address. Published
// 2026-07-29; before that no mapping document existed at any location the
// draft or its fixtures named (FINDINGS.md A4/B4). Both URLs serve the same
// bytes: one addressed by digest, one by mapping id.
const MAPPING_URLS = [
  [
    "https://agentoracle.co/mappings/0a78263976790df6e76cd9f3f441bf5a3b5c3a82e346b5aca43e49626881d7b0.json",
    "fixtures/verification-state/mappings/published/agentoracle-v0.3-2026-05-30.by-digest.json",
  ],
  [
    "https://agentoracle.co/mappings/agentoracle-v0.3-2026-05-30.json",
    "fixtures/verification-state/mappings/agentoracle-v0.3-2026-05-30.json",
  ],
];

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
      // __pycache__ is a build artifact; .gitignore is the upstream project's
      // own repo machinery and would govern git's treatment of fixtures/ if
      // copied in. Neither is a fixture.
      .filter((t) => !t.path.includes("__pycache__") && !t.path.endsWith(".gitignore"))
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

  // ---- 3b. published mapping documents ----------------------------------
  for (const [url, rel] of MAPPING_URLS) {
    const at = new Date().toISOString();
    const bytes = await fetchBytes(url);
    writeOut(rel, bytes, url, at);
    console.log(rel);
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
  // A file already listed above is a snapshot of something published; listing
  // it again under "generated here" would claim this repository authored bytes
  // it only copied. The published mapping document lives in the same directory
  // as the local transcription, so the two are separated by provenance, not by
  // path.
  const snapshotted = new Set(entries.map((e) => e.path));
  for (const rel of listFiles(join(ROOT, "fixtures", "verification-state", "synthetic")).concat(
    listFiles(join(ROOT, "fixtures", "verification-state", "mappings")),
    listFiles(join(ROOT, "fixtures", "acta", "synthetic")),
    listFiles(join(ROOT, "fixtures", "acta", "keys")),
    listFiles(join(ROOT, "fixtures", "keys")),
  )) {
    if (snapshotted.has(relative(ROOT, rel).replace(/\\/g, "/"))) continue;
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
