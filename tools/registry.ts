#!/usr/bin/env tsx
/**
 * The registry of executed verifications: the build, and the check.
 *
 *   npm run registry              build index.json and the badges from the records
 *   npm run registry -- --check   re-derive everything and fail on any of the seven rules
 *
 * What this tool is for. A record in `registry/records/` is a public claim that
 * a particular run happened against particular bytes. The claim is only worth
 * something if a reader who trusts nobody here can take the repository and
 * recompute it, so every number the registry publishes is derived rather than
 * written: the digests come from the files, the status label comes from the
 * `independent_rerun` member, the citation table comes from the git history, and
 * `--check` rebuilds the whole index and compares it to the committed bytes.
 *
 * What it does NOT observe, and this matters more than what it does. Nothing
 * here says a record is TRUE. A record can validate against the schema, hash
 * perfectly against its pinned inputs, sit in a clean chain, and describe a run
 * that nobody performed. What the rules buy is narrower and stateable: that a
 * published record has not changed since it was published, that the values in
 * the index were derived from the files rather than asserted beside them, that
 * no record claims a third-party re-run it does not name, and that the person
 * whose name is on it agreed to be named. Everything beyond that is the report
 * beside the record, and a reader's own run.
 *
 * Determinism. The same tree produces the same bytes. `built_at` is the only
 * clock value in the output; `built_at_head` is the HEAD the build read. Neither
 * takes part in the rebuild comparison `--check` makes -- see `comparable()` and
 * the note there, which is a deviation from the handoff's "built_at is the only
 * value --check ignores" and is explained in the session report.
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(HERE);

// ---------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------

export function sha256Hex(b: Buffer | string): string {
  return createHash("sha256").update(b).digest("hex");
}

/** Repository-relative, forward slashes: the spelling git speaks. */
function posix(p: string): string {
  return p.split("\\").join("/");
}

function git(cwd: string, args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", maxBuffer: 1 << 28 }).trim();
}

function gitBytes(cwd: string, args: string[]): Buffer {
  return execFileSync("git", args, { cwd, maxBuffer: 1 << 28 });
}

function gitQuiet(cwd: string, args: string[]): string | null {
  try {
    return git(cwd, args);
  } catch {
    return null;
  }
}

/**
 * The blob at a path in a commit, as BYTES from the object store rather than
 * from the working tree. This matters on this machine: `core.autocrlf` is true,
 * and a digest taken over a checked-out file is a digest of whatever the
 * checkout did to it. `.gitattributes` marks `registry/**` as `-text` so the two
 * agree today; reading the blob means the check does not depend on that staying
 * true.
 */
function blobAt(repo: string, commit: string, path: string): Buffer | null {
  try {
    execFileSync("git", ["cat-file", "-e", `${commit}:${path}`], { cwd: repo, stdio: "ignore" });
  } catch {
    return null;
  }
  return gitBytes(repo, ["cat-file", "blob", `${commit}:${path}`]);
}

// ---------------------------------------------------------------------------
// a JSON Schema (draft 2020-12) validator, for the subset record.schema.json uses
// ---------------------------------------------------------------------------
//
// Deliberately not a dependency. This repository ships four runtime dependencies
// and a validator would be a fifth, pulled in to read one document that this
// repository also authors. The subset below is the one the schema uses and the
// tests assert both directions on it: an unknown member and a value outside an
// enum are rejected, and the valid record validates. A validator that accepted
// everything would fail those first two; one that rejected everything would fail
// the third.

type Json = unknown;
interface Schema {
  [k: string]: Json;
}

function validate(schema: Schema, doc: Json, root: Schema, path = ""): string[] {
  const errs: string[] = [];
  const at = path || "(root)";

  if (typeof schema["$ref"] === "string") {
    const ref = schema["$ref"];
    if (!ref.startsWith("#/")) return [`${at}: unsupported $ref ${ref}`];
    let node: Json = root;
    for (const seg of ref.slice(2).split("/")) node = (node as Record<string, Json>)[seg];
    return validate(node as Schema, doc, root, path);
  }

  if ("const" in schema && JSON.stringify(doc) !== JSON.stringify(schema["const"])) {
    errs.push(`${at}: must equal ${JSON.stringify(schema["const"])}`);
  }

  if (Array.isArray(schema["enum"])) {
    const allowed = schema["enum"] as Json[];
    if (!allowed.some((v) => JSON.stringify(v) === JSON.stringify(doc))) {
      errs.push(`${at}: ${JSON.stringify(doc)} is outside the closed vocabulary ${JSON.stringify(allowed)}`);
    }
  }

  if (Array.isArray(schema["anyOf"])) {
    const branches = schema["anyOf"] as Schema[];
    const each = branches.map((b) => validate(b, doc, root, path));
    if (!each.some((e) => e.length === 0)) {
      errs.push(`${at}: matches none of the ${branches.length} allowed shapes (${each.map((e) => e[0]).join(" | ")})`);
    }
    return errs;
  }

  const t = schema["type"];
  if (typeof t === "string") {
    const ok =
      t === "null"
        ? doc === null
        : t === "array"
          ? Array.isArray(doc)
          : t === "integer"
            ? typeof doc === "number" && Number.isInteger(doc)
            : t === "object"
              ? doc !== null && typeof doc === "object" && !Array.isArray(doc)
              : typeof doc === t;
    if (!ok) return [...errs, `${at}: expected ${t}, got ${doc === null ? "null" : Array.isArray(doc) ? "array" : typeof doc}`];
  }

  if (typeof doc === "string") {
    const min = schema["minLength"];
    if (typeof min === "number" && doc.length < min) errs.push(`${at}: shorter than ${min}`);
    const pat = schema["pattern"];
    if (typeof pat === "string" && !new RegExp(pat).test(doc)) errs.push(`${at}: ${JSON.stringify(doc)} does not match ${pat}`);
  }

  if (Array.isArray(doc)) {
    const min = schema["minItems"];
    if (typeof min === "number" && doc.length < min) errs.push(`${at}: needs at least ${min} item(s), has ${doc.length}`);
    const items = schema["items"];
    if (items) doc.forEach((v, i) => errs.push(...validate(items as Schema, v, root, `${path}/${i}`)));
  }

  if (doc !== null && typeof doc === "object" && !Array.isArray(doc)) {
    const obj = doc as Record<string, Json>;
    const props = (schema["properties"] ?? {}) as Record<string, Schema>;
    for (const r of (schema["required"] ?? []) as string[]) {
      if (!(r in obj)) errs.push(`${at}: required member ${JSON.stringify(r)} is absent`);
    }
    if (schema["additionalProperties"] === false) {
      for (const k of Object.keys(obj)) {
        if (!(k in props)) errs.push(`${at}: ${JSON.stringify(k)} is not a member this schema accepts`);
      }
    }
    for (const [k, s] of Object.entries(props)) {
      if (k in obj) errs.push(...validate(s, obj[k], root, `${path}/${k}`));
    }
  }

  return errs;
}

// ---------------------------------------------------------------------------
// the record and index shapes
// ---------------------------------------------------------------------------

export interface Digest {
  alg: string;
  value: string;
}

export interface RegistryRecord {
  schema: string;
  id: string;
  kind: "entry" | "own_work" | "observation";
  record_type: "conformance_entry" | "dispute_package" | "finding" | "observation";
  key: { format: string; format_version: string; upstream_digest: Digest; verifier: { tool: string | string[]; version: string; commit: string | null }; verified_at: string };
  subject: { implementation: string; artefact: string; artefact_digest: Digest; role: string; named_party: string | null };
  assessor: { name: string; affiliation: string };
  consent: { named_human: string; affiliation: string; given_on: string; channel: string; scope: string } | null;
  methodology: { document: string; version: string; sha256: string } | null;
  method: string | null;
  executed_run: { command: string; run_at: string; tool_commit: string | null; outputs: Array<{ path: string; sha256: string; bytes: number }> };
  pinned_inputs: Array<{ path: string | null; location: "in_tree" | "external"; sha256: string; bytes: number; source: string; retrieved_at: string; holder: string | null }>;
  as_of: { upstream_digest: Digest; date: string };
  not_established: string[];
  establishes: string[];
  independent_rerun: { by: string; date: string; pointer: string } | null;
  review_window: { sent_on: string; closes_on: string; outcome: "replied" | "lapsed" } | null;
  reply: { kind: "none" | "reproduced" | "disputed" | "corrected"; date: string | null; pointer: string | null; text_sha256: string | null };
  status: "published" | "superseded";
  supersedes: string | null;
  superseded_by: string | null;
  supersession_reason: Array<"artefact_changed" | "assessment_error"> | null;
  report: { path: string; sha256: string; bytes: number };
}

export interface IndexRow {
  id: string;
  kind: string;
  record_type: string;
  key: RegistryRecord["key"];
  status: string;
  status_label: "verified" | "unverified";
  record_sha256: string;
  record_bytes: number;
  report_path: string;
  report_sha256: string;
  report_bytes: number;
  badge_path: string;
  badge_sha256: string;
  supersedes: string | null;
  superseded_by: string | null;
}

export interface Index {
  schema: string;
  built_at: string;
  built_at_head: string | null;
  verifier_version: string;
  previous_index_sha256: string | null;
  interests: string;
  counts: { by_kind: Record<string, number>; by_status_label: Record<string, number> };
  records: IndexRow[];
}

export interface Failure {
  rule: number;
  id: string | null;
  message: string;
}

export interface CheckResult {
  ok: boolean;
  failures: Failure[];
  citations: Array<{ id: string; commit: string }>;
}

class RuleError extends Error {
  constructor(public rule: number, public id: string | null, message: string) {
    super(`rule ${rule}: ${message}`);
  }
}

// ---------------------------------------------------------------------------
// rule 5, on its own, so the test can drive the derivation directly
// ---------------------------------------------------------------------------

/**
 * `verified` only when a party other than the assessor and the subject's own
 * implementer has re-run the record and is named. Everything else, including
 * every record with no re-run at all, is `unverified`.
 *
 * Names are compared case-folded and whitespace-collapsed, so "A Person " and
 * "a person" are the same party. That is deliberately generous: the failure to
 * avoid is a self-re-run slipping through as `verified`, not two genuinely
 * different parties being conflated into `unverified`, which errs closed.
 */
export function deriveStatusLabel(x: { independent_rerun: { by: string } | null; assessor: string; subject_party: string | null }): "verified" | "unverified" {
  if (!x.independent_rerun) return "unverified";
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const by = norm(x.independent_rerun.by);
  if (by === norm(x.assessor)) return "unverified";
  if (x.subject_party && by === norm(x.subject_party)) return "unverified";
  return "verified";
}

// ---------------------------------------------------------------------------
// reading the tree
// ---------------------------------------------------------------------------

function recordIds(root: string): string[] {
  const dir = join(root, "records");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(dir, e.name, "record.json")))
    .map((e) => e.name)
    .sort();
}

/** The Interests paragraph, from registry/README.md. One source for the whole tree. */
function interestsFrom(root: string): string {
  const readme = readFileSync(join(root, "README.md"), "utf8");
  const line = readme.split("\n").find((l) => l.startsWith("Interests. "));
  if (!line) throw new RuleError(0, null, "registry/README.md carries no paragraph beginning `Interests. `, and the index copies it from there");
  return line.trim();
}

function keyOf(r: RegistryRecord): string {
  const v = r.key.verifier;
  const tool = Array.isArray(v.tool) ? v.tool.join(" + ") : v.tool;
  return [r.key.format, r.key.format_version, `${r.key.upstream_digest.alg}:${r.key.upstream_digest.value}`, `${tool}@${v.version}`, r.key.verified_at].join(" | ");
}

/** Deterministic, no clock, no measurement: the same record always draws the same bytes. */
function badgeSvg(r: RegistryRecord, label: string): string {
  const text = `receipt-verify registry \u00b7 ${r.key.format} \u00b7 ${r.kind} \u00b7 ${label}`;
  const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const width = 16 + text.length * 7;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="${esc}">`,
    `<title>${esc}</title>`,
    `<rect width="${width}" height="20" rx="3" fill="#24292f"/>`,
    `<text x="8" y="14" font-family="DejaVu Sans,Verdana,sans-serif" font-size="11" fill="#ffffff">${esc}</text>`,
    `</svg>`,
    ``,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// the rules that are about one record's document
// ---------------------------------------------------------------------------

function checkRecordRules(root: string, repo: string, r: RegistryRecord, raw: Record<string, unknown>): void {
  const id = r.id;

  // Rule 5, the half that is about the record rather than the index: a record
  // never carries its own label. The schema rejects the member as unknown too;
  // this is here so the failure NAMES the rule rather than reading as a typo.
  if ("status_label" in raw) {
    throw new RuleError(5, id, `${id}: record.json carries a status_label; the label is derived into index.json by the build and is never written by hand`);
  }

  // Rule 1
  if (r.kind === "observation") {
    if (r.consent !== null) throw new RuleError(1, id, `${id}: an observation is built from public bytes about a party who has not consented, so consent must be null`);
    if (r.subject.named_party !== null) throw new RuleError(1, id, `${id}: an observation names no one beyond what the bytes show, so subject.named_party must be null`);
  } else if (r.consent === null) {
    throw new RuleError(1, id, `${id}: a ${r.kind} record refuses to build with consent: null; no record without a named consenting human`);
  }
  if (!r.executed_run.command.trim()) throw new RuleError(1, id, `${id}: executed_run.command is empty; no record without an executed run`);
  if (!r.executed_run.run_at.trim()) throw new RuleError(1, id, `${id}: executed_run.run_at is empty; no record without an executed run`);

  for (const [i, p] of r.pinned_inputs.entries()) {
    if (p.location !== "in_tree") continue;
    if (!p.path) throw new RuleError(1, id, `${id}: pinned_inputs[${i}] is in_tree and names no path`);
    const abs = join(repo, ...p.path.split("/"));
    if (!existsSync(abs)) throw new RuleError(1, id, `${id}: pinned_inputs[${i}] is in_tree and there is no file at ${p.path}`);
    const bytes = readFileSync(abs);
    const got = sha256Hex(bytes);
    if (got !== p.sha256) throw new RuleError(1, id, `${id}: pinned_inputs[${i}] (${p.path}) is in_tree and hashes to ${got}, not the ${p.sha256} it names`);
    if (bytes.length !== p.bytes) throw new RuleError(1, id, `${id}: pinned_inputs[${i}] (${p.path}) is ${bytes.length} bytes, not the ${p.bytes} it names`);
  }

  for (const [i, o] of r.executed_run.outputs.entries()) {
    const abs = join(repo, ...o.path.split("/"));
    if (!existsSync(abs)) throw new RuleError(1, id, `${id}: executed_run.outputs[${i}] names ${o.path} and there is no such file in the repository`);
    const bytes = readFileSync(abs);
    const got = sha256Hex(bytes);
    if (got !== o.sha256) throw new RuleError(1, id, `${id}: executed_run.outputs[${i}] (${o.path}) hashes to ${got}, not the ${o.sha256} it names`);
    if (bytes.length !== o.bytes) throw new RuleError(1, id, `${id}: executed_run.outputs[${i}] (${o.path}) is ${bytes.length} bytes, not the ${o.bytes} it names`);
  }

  // The report is the human half of the record and is carried byte for byte.
  const reportPath = join(repo, ...r.report.path.split("/"));
  if (!existsSync(reportPath)) throw new RuleError(1, id, `${id}: report.path names ${r.report.path} and there is no such file in the repository`);
  const reportBytes = readFileSync(reportPath);
  if (sha256Hex(reportBytes) !== r.report.sha256) {
    throw new RuleError(1, id, `${id}: the report at ${r.report.path} hashes to ${sha256Hex(reportBytes)}, not the ${r.report.sha256} the record names`);
  }
  if (reportBytes.length !== r.report.bytes) {
    throw new RuleError(1, id, `${id}: the report at ${r.report.path} is ${reportBytes.length} bytes, not the ${r.report.bytes} the record names`);
  }

  // Rule 4
  if (r.not_established.length === 0) {
    throw new RuleError(4, id, `${id}: not_established is empty; a record that names nothing it failed to establish is claiming everything`);
  }

  // Rule 6: an entry enters the tree only after fourteen days with the graded party.
  if (r.kind === "entry") {
    if (!r.review_window) throw new RuleError(6, id, `${id}: an entry enters the tree only after a review window, and review_window is null`);
    const sent = Date.parse(`${r.review_window.sent_on}T00:00:00Z`);
    const closes = Date.parse(`${r.review_window.closes_on}T00:00:00Z`);
    const days = (closes - sent) / 86400000;
    if (!(days >= 14)) {
      throw new RuleError(6, id, `${id}: the review window is ${days} days (${r.review_window.sent_on} to ${r.review_window.closes_on}); the rule is fourteen days from the day the entry is sent`);
    }
  }

  // The members whose requirement depends on record_type, which the schema
  // cannot express with anyOf alone without making every error unreadable.
  if (r.record_type === "conformance_entry") {
    if (!r.methodology) throw new RuleError(1, id, `${id}: a conformance_entry names the methodology it was graded under, and methodology is null`);
    const mdoc = join(root, ...r.methodology.document.split("/"));
    if (!existsSync(mdoc)) throw new RuleError(1, id, `${id}: methodology.document names ${r.methodology.document} and there is no such file in the registry`);
    const got = sha256Hex(readFileSync(mdoc));
    if (got !== r.methodology.sha256) {
      throw new RuleError(1, id, `${id}: ${r.methodology.document} hashes to ${got}, not the ${r.methodology.sha256} the record names`);
    }
  } else if (!r.method) {
    throw new RuleError(1, id, `${id}: a ${r.record_type} record follows a named method, and method is null`);
  }

  // Rule 3's document half: supersession is stated in both directions or not at all.
  if (r.supersedes === null && r.supersession_reason !== null) {
    throw new RuleError(3, id, `${id}: supersession_reason is non-null and supersedes is null; the reason belongs to the record that supersedes`);
  }
  if (r.supersedes !== null && (r.supersession_reason === null || r.supersession_reason.length === 0)) {
    throw new RuleError(3, id, `${id}: supersedes ${r.supersedes} and names no supersession_reason; the rule keeps artefact_changed and assessment_error distinct`);
  }
}

// ---------------------------------------------------------------------------
// build
// ---------------------------------------------------------------------------

export interface BuildResult {
  index: Index;
  badges: Map<string, string>;
  bytes: string;
}

/**
 * Derive index.json and the badges from the records in the tree. Throws a
 * RuleError naming the rule on the first violation: a build that emitted a
 * partial index under a registry it had already found unfit to read would be a
 * worse artefact than no index.
 */
export function build(root: string, opts: { now?: string } = {}): BuildResult {
  const repo = git(root, ["rev-parse", "--show-toplevel"]).split("\\").join("/");
  const relRoot = posix(relative(repo, resolve(root)));
  const schema = JSON.parse(readFileSync(join(root, "schema", "record.schema.json"), "utf8")) as Schema;
  const pkg = JSON.parse(readFileSync(join(repo, "package.json"), "utf8")) as { version: string };

  const rows: IndexRow[] = [];
  const badges = new Map<string, string>();
  const seen = new Map<string, string>();

  for (const id of recordIds(root)) {
    const path = join(root, "records", id, "record.json");
    const bytes = readFileSync(path);
    const raw = JSON.parse(bytes.toString("utf8")) as Record<string, unknown>;

    const errs = validate(schema, raw, schema);
    if (errs.length) throw new RuleError(0, id, `${id}: record.json does not validate against the schema:\n    ${errs.join("\n    ")}`);

    const r = raw as unknown as RegistryRecord;
    if (r.id !== id) throw new RuleError(0, id, `${id}: the record's id member is ${JSON.stringify(r.id)}, and the folder it sits in is ${JSON.stringify(id)}`);

    checkRecordRules(root, repo, r, raw);

    // Rule 2
    const k = keyOf(r);
    const prior = seen.get(k);
    if (prior) throw new RuleError(2, id, `${id} and ${prior} carry the same key (${k}); two records with the same key refuse to build`);
    seen.set(k, id);

    const label = deriveStatusLabel({ independent_rerun: r.independent_rerun, assessor: r.assessor.name, subject_party: r.subject.named_party });
    const svg = badgeSvg(r, label);
    badges.set(id, svg);

    const reportBytes = readFileSync(join(repo, ...r.report.path.split("/")));
    rows.push({
      id,
      kind: r.kind,
      record_type: r.record_type,
      key: r.key,
      status: r.status,
      status_label: label,
      record_sha256: sha256Hex(bytes),
      record_bytes: bytes.length,
      report_path: r.report.path,
      report_sha256: sha256Hex(reportBytes),
      report_bytes: reportBytes.length,
      badge_path: `badges/${id}.svg`,
      badge_sha256: sha256Hex(svg),
      supersedes: r.supersedes,
      superseded_by: r.superseded_by,
    });
  }

  // Rule 3's other document half: a forward pointer must name a record that exists,
  // and the two records must agree about the direction.
  const byId = new Map(rows.map((x) => [x.id, x]));
  for (const row of rows) {
    if (row.supersedes && !byId.has(row.supersedes)) {
      throw new RuleError(3, row.id, `${row.id} supersedes ${row.supersedes}, which is not a record in this registry`);
    }
    if (row.superseded_by) {
      const next = byId.get(row.superseded_by);
      if (!next) throw new RuleError(3, row.id, `${row.id} is superseded_by ${row.superseded_by}, which is not a record in this registry`);
      if (next.supersedes !== row.id) throw new RuleError(3, row.id, `${row.id} points forward to ${next.id}, which does not point back`);
      if (row.status !== "superseded") throw new RuleError(3, row.id, `${row.id} carries superseded_by and status ${row.status}`);
    }
  }

  const by_kind: Record<string, number> = {};
  const by_status_label: Record<string, number> = {};
  for (const row of rows) {
    by_kind[row.kind] = (by_kind[row.kind] ?? 0) + 1;
    by_status_label[row.status_label] = (by_status_label[row.status_label] ?? 0) + 1;
  }

  const head = gitQuiet(repo, ["rev-parse", "HEAD"]);
  const indexPath = `${relRoot}/index.json`;
  const prevBlob = head ? blobAt(repo, head, indexPath) : null;

  const index: Index = {
    schema: "receipt-verify/registry-index/0",
    built_at: opts.now ?? new Date().toISOString(),
    built_at_head: head,
    verifier_version: pkg.version,
    previous_index_sha256: prevBlob ? sha256Hex(prevBlob) : null,
    interests: interestsFrom(root),
    counts: { by_kind, by_status_label },
    records: rows,
  };

  // Idempotence. Running the build twice with nothing else changed must not
  // re-point the chain at the index's own bytes: if the only thing that would
  // move is the clock and the HEAD, keep the link the committed index already
  // carries. Without this, a second `npm run registry` before a commit would
  // write an index whose previous_index_sha256 is its own predecessor's
  // predecessor, and rule 7 would fail on a tree nobody had edited.
  if (prevBlob) {
    const prev = JSON.parse(prevBlob.toString("utf8")) as Index;
    if (JSON.stringify(comparable(prev)) === JSON.stringify(comparable(index))) {
      index.previous_index_sha256 = prev.previous_index_sha256;
    }
  }

  return { index, badges, bytes: JSON.stringify(index, null, 2) + "\n" };
}

/**
 * The index without the three members that legitimately differ between a build
 * and a later rebuild of the same tree.
 *
 * `built_at` is the clock. `built_at_head` is the HEAD the build read, which is
 * the PARENT of the commit that carries the index, so a rebuild at any later
 * commit necessarily reads a different one -- it is checked separately, against
 * the history, rather than compared. `previous_index_sha256` is the chain link,
 * which points backwards and so cannot be re-derived from the present tree
 * either; rule 7 walks it through the history instead. The handoff says
 * `built_at` is the only value `--check` ignores; the other two cannot be
 * compared by a rebuild at all, and the session report records the deviation.
 */
function comparable(i: Index): Omit<Index, "built_at" | "built_at_head" | "previous_index_sha256"> {
  const { built_at: _a, built_at_head: _b, previous_index_sha256: _c, ...rest } = i;
  return rest;
}

/** Write index.json and the badges. The only thing in this file that writes. */
export function writeBuild(root: string): BuildResult {
  const out = build(root);
  writeFileSync(join(root, "index.json"), out.bytes);
  const badgeDir = join(root, "badges");
  mkdirSync(badgeDir, { recursive: true });
  for (const name of existsSync(badgeDir) ? readdirSync(badgeDir) : []) {
    if (name.endsWith(".svg") && !out.badges.has(name.slice(0, -4))) rmSync(join(badgeDir, name));
  }
  for (const [id, svg] of out.badges) writeFileSync(join(badgeDir, `${id}.svg`), svg);
  return out;
}

// ---------------------------------------------------------------------------
// check
// ---------------------------------------------------------------------------

/**
 * The one change rule 3 permits to a published record: gaining its forward
 * pointer. "A superseded record stays, carrying `superseded_by` and nothing else
 * new" -- so `status` may go published to superseded and `superseded_by` may go
 * null to an id, together, once, and NOTHING else in the document may move.
 *
 * Without this exception the rule would forbid supersession, which is the
 * mechanism it exists to require: a correction can only be published if the
 * corrected record can point at it. With it, the exception is narrow enough to
 * state in one sentence and is checked member by member rather than by
 * whitelisting a diff size.
 */
function onlyTookTheForwardPointer(before: Buffer, after: Buffer): boolean {
  let a: Record<string, unknown>;
  let b: Record<string, unknown>;
  try {
    a = JSON.parse(before.toString("utf8")) as Record<string, unknown>;
    b = JSON.parse(after.toString("utf8")) as Record<string, unknown>;
  } catch {
    return false;
  }
  if (a["status"] !== "published" || b["status"] !== "superseded") return false;
  if (a["superseded_by"] !== null || typeof b["superseded_by"] !== "string" || !b["superseded_by"]) return false;
  const strip = (x: Record<string, unknown>) => {
    const { status: _s, superseded_by: _f, ...rest } = x;
    return JSON.stringify(rest);
  };
  return strip(a) === strip(b);
}

export function check(root: string): CheckResult {
  const failures: Failure[] = [];
  const citations: Array<{ id: string; commit: string }> = [];
  const push = (rule: number, id: string | null, message: string) => failures.push({ rule, id, message });

  let repo: string;
  try {
    repo = git(root, ["rev-parse", "--show-toplevel"]).split("\\").join("/");
  } catch {
    return { ok: false, failures: [{ rule: 0, id: null, message: `${root} is not inside a git repository, and rules 3 and 7 are statements about the history` }], citations };
  }
  const relRoot = posix(relative(repo, resolve(root)));
  const indexPath = `${relRoot}/index.json`;

  // The build is where rules 1, 2, 4, 5 (the record half) and 6 refuse. A refusal
  // here is the rule firing, and it is reported rather than thrown.
  let built: BuildResult;
  try {
    built = build(root);
  } catch (e) {
    if (e instanceof RuleError) {
      return { ok: false, failures: [{ rule: e.rule, id: e.id, message: e.message.replace(/^rule \d+: /, "") }], citations };
    }
    throw e;
  }

  // ---- the index on disk equals a rebuild -------------------------------
  const onDiskPath = join(root, "index.json");
  if (!existsSync(onDiskPath)) {
    push(0, null, `${indexPath} is not in the tree; run \`npm run registry\` and commit it`);
  } else {
    const onDisk = JSON.parse(readFileSync(onDiskPath, "utf8")) as Index;
    if (JSON.stringify(comparable(onDisk)) !== JSON.stringify(comparable(built.index))) {
      const diffs: string[] = [];
      const a = comparable(onDisk) as unknown as Record<string, unknown>;
      const b = comparable(built.index) as unknown as Record<string, unknown>;
      for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
        if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) diffs.push(k);
      }
      push(0, null, `${indexPath} does not equal a rebuild from the records in the tree; the members that differ: ${diffs.join(", ")}`);
    }

    // ---- rule 5: the label in the index is the derived one ---------------
    for (const row of built.index.records) {
      const committed = onDisk.records.find((x) => x.id === row.id);
      if (!committed) continue;
      if (committed.status_label !== row.status_label) {
        push(5, row.id, `${row.id}: index.json says ${committed.status_label} and the derivation from independent_rerun says ${row.status_label}; the label is the build's to write`);
      }
    }

    // ---- built_at_head names a commit in this history --------------------
    if (onDisk.built_at_head !== null) {
      const known = gitQuiet(repo, ["cat-file", "-t", onDisk.built_at_head]);
      if (known !== "commit") {
        push(0, null, `index.json's built_at_head ${onDisk.built_at_head} is not a commit in this repository`);
      } else if (gitQuiet(repo, ["merge-base", "--is-ancestor", onDisk.built_at_head, "HEAD"]) === null) {
        push(0, null, `index.json's built_at_head ${onDisk.built_at_head} is not an ancestor of HEAD`);
      }
    }
  }

  // ---- the badges on disk equal the rebuild ------------------------------
  for (const [id, svg] of built.badges) {
    const p = join(root, "badges", `${id}.svg`);
    if (!existsSync(p)) {
      push(0, id, `badges/${id}.svg is not in the tree; the build writes one badge per record`);
      continue;
    }
    if (readFileSync(p, "utf8") !== svg) push(0, id, `badges/${id}.svg does not equal a rebuild; badge bytes are deterministic`);
  }

  // ---- rule 3: a published record's bytes never change -------------------
  for (const id of recordIds(root)) {
    const rel = `${relRoot}/records/${id}/record.json`;
    const adding = gitQuiet(repo, ["log", "--diff-filter=A", "--format=%H", "--", rel]);
    const addingCommit = adding ? adding.split("\n").filter(Boolean).pop() ?? null : null;
    if (!addingCommit) {
      // Not yet committed. This is the state during the session that adds it,
      // and it is reported rather than failed: an uncommitted record has no
      // publication to be immutable since.
      citations.push({ id, commit: "(not yet committed)" });
      continue;
    }
    citations.push({ id, commit: addingCommit });

    const atAdd = blobAt(repo, addingCommit, rel);
    const atHead = blobAt(repo, "HEAD", rel);
    if (atAdd && atHead && !atAdd.equals(atHead) && !onlyTookTheForwardPointer(atAdd, atHead)) {
      push(3, id, `${id}: record edited after publication; add a superseding record (added at ${addingCommit.slice(0, 12)}, ${atAdd.length} bytes, sha256 ${sha256Hex(atAdd).slice(0, 16)}…; at HEAD ${atHead.length} bytes, sha256 ${sha256Hex(atHead).slice(0, 16)}…)`);
      continue;
    }
    const working = readFileSync(join(root, "records", id, "record.json"));
    if (atHead && !atHead.equals(working) && !onlyTookTheForwardPointer(atHead, working)) {
      push(3, id, `${id}: record edited after publication; add a superseding record (the working tree differs from HEAD)`);
    }
  }

  // ---- rule 7: the index chain, walked through the history ---------------
  const log = gitQuiet(repo, ["log", "--format=%H", "--", indexPath]);
  const touching = log ? log.split("\n").filter(Boolean).reverse() : [];
  for (let i = 0; i < touching.length; i++) {
    const commit = touching[i]!;
    const bytes = blobAt(repo, commit, indexPath);
    if (!bytes) continue; // the commit removed it; there is nothing to link from
    let doc: Index;
    try {
      doc = JSON.parse(bytes.toString("utf8")) as Index;
    } catch {
      push(7, null, `the index at ${commit.slice(0, 12)} is not readable JSON, so the chain cannot be walked through it`);
      continue;
    }
    if (i === 0) {
      if (doc.previous_index_sha256 !== null) {
        push(7, null, `the first committed index (${commit.slice(0, 12)}) names a previous_index_sha256 of ${doc.previous_index_sha256}; the chain starts at null`);
      }
      continue;
    }
    const prevBytes = blobAt(repo, touching[i - 1]!, indexPath);
    const want = prevBytes ? sha256Hex(prevBytes) : null;
    if (doc.previous_index_sha256 !== want) {
      push(7, null, `the index at ${commit.slice(0, 12)} names previous_index_sha256 ${doc.previous_index_sha256}, and the index bytes at the previous commit that touched it (${touching[i - 1]!.slice(0, 12)}) hash to ${want}`);
    }
  }

  return { ok: failures.length === 0, failures, citations };
}

// ---------------------------------------------------------------------------
// cli
// ---------------------------------------------------------------------------

function citationTable(citations: Array<{ id: string; commit: string }>): string[] {
  const w = Math.max(2, ...citations.map((c) => c.id.length));
  return [
    "",
    "How to cite a record: its id and the commit that ADDED it, never HEAD.",
    "",
    `  ${"id".padEnd(w)}  adding commit`,
    `  ${"-".repeat(w)}  -------------`,
    ...citations.map((c) => `  ${c.id.padEnd(w)}  ${c.commit}`),
  ];
}

function main(argv: string[]): number {
  const wantsCheck = argv.includes("--check");
  const rootArg = argv.indexOf("--root");
  const root = rootArg >= 0 && argv[rootArg + 1] ? resolve(argv[rootArg + 1]!) : join(REPO, "registry");

  if (!existsSync(root) || !statSync(root).isDirectory()) {
    console.error(`registry: ${root} is not a directory`);
    return 2;
  }

  if (!wantsCheck) {
    const out = writeBuild(root);
    console.log(`registry: built ${out.index.records.length} record(s) into ${posix(relative(REPO, join(root, "index.json")))}`);
    console.log(`registry: counts by kind ${JSON.stringify(out.index.counts.by_kind)}, by status_label ${JSON.stringify(out.index.counts.by_status_label)}`);
    console.log(`registry: previous_index_sha256 ${out.index.previous_index_sha256 ?? "null (this is the first index)"}`);
    return 0;
  }

  const r = check(root);
  for (const line of citationTable(r.citations)) console.log(line);
  console.log("");
  if (r.ok) {
    console.log(`registry: --check OK, ${r.citations.length} record(s), seven rules`);
    return 0;
  }
  for (const f of r.failures) console.error(`registry: FAILED -- rule ${f.rule}: ${f.message}`);
  console.error(`registry: --check FAILED, ${r.failures.length} failure(s)`);
  return 1;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  process.exit(main(process.argv.slice(2)));
}
