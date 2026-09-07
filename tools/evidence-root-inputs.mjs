#!/usr/bin/env node
// Extract ONLY the independence-permitted members of the rev 5 fixture bundle.
//
// The independence protocol for CC_HANDOFF_2026-09-07 rev 2 lets us take the
// vector *inputs* from Joe's file and forbids us their *computed* values, the
// header's prefixes, its independence_disclosure and its spec_bases, until our
// own roots are committed. This script is the airlock: it whitelists, it never
// prints a non-whitelisted member, and its output is the only view of the
// fixture bundle the implementation work is allowed to see.
//
// Usage: node tools/evidence-root-inputs.mjs <source.json> <dest.json>

import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const [, , sourcePath, destPath] = process.argv;
if (!sourcePath || !destPath) {
  console.error("usage: evidence-root-inputs.mjs <source.json> <dest.json>");
  process.exit(2);
}

const HEADER_KEEP = ["title", "vector_count"];
const VECTOR_KEEP = ["id", "designation", "expect", "input"];

const raw = readFileSync(sourcePath);
const sourceSha256 = createHash("sha256").update(raw).digest("hex");
const doc = JSON.parse(raw.toString("utf8"));

// Locate the vector array without enumerating sibling header members: the
// bundle is an object carrying one array of vector objects.
const vectorsKey = Object.keys(doc).find((k) => Array.isArray(doc[k]));
if (!vectorsKey) {
  console.error("no vector array found in source");
  process.exit(1);
}

// The two permitted header members may sit at the top level or inside a
// header/metadata object. Search by name and take only those two: a member the
// protocol forbids is never named here, so it can never be read out.
function findKept(node, found, depth) {
  if (depth > 3 || node === null || typeof node !== "object" || Array.isArray(node)) return;
  for (const k of HEADER_KEEP) {
    if (Object.hasOwn(node, k) && !Object.hasOwn(found, k)) {
      const v = node[k];
      if (typeof v === "string" || typeof v === "number") found[k] = v;
    }
  }
  for (const k of Object.keys(node)) {
    if (!Array.isArray(node[k])) findKept(node[k], found, depth + 1);
  }
}

const header = {};
findKept(doc, header, 0);

const vectors = doc[vectorsKey].map((v) => {
  const out = {};
  for (const k of VECTOR_KEEP) {
    if (Object.hasOwn(v, k)) out[k] = v[k];
  }
  return out;
});

const extract = {
  source_file: sourcePath.split(/[\/]/).pop(),
  source_sha256: sourceSha256,
  vectors_member: vectorsKey,
  header,
  extracted_members: { header: HEADER_KEEP, vector: VECTOR_KEEP },
  vectors,
};

const serialized = JSON.stringify(extract, null, 2) + "\n";
writeFileSync(destPath, serialized);
const extractSha256 = createHash("sha256").update(Buffer.from(serialized, "utf8")).digest("hex");

// Counts and digests only. Never any non-whitelisted member value.
console.log(`source        ${sourcePath}`);
console.log(`source_sha256 ${sourceSha256}`);
console.log(`source_bytes  ${raw.length}`);
console.log(`vectors_member ${vectorsKey}`);
console.log(`vectors       ${vectors.length}`);
console.log(`dest          ${destPath}`);
console.log(`dest_sha256   ${extractSha256}`);
