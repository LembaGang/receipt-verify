#!/usr/bin/env node
// The daily anchor of the record (B-89).
//
// WHY THIS EXISTS. Every commit on `master` is signed, so the history says WHO
// made each statement. It does not say WHEN to anyone who does not trust the
// signer's clock, and the registry's rule 1 asks for "an anchored result". Once
// a day the `anchor` workflow builds a small JSON document naming the commit it
// ran at, whether that history verified, the sha256 of that morning's drift
// output and of `registry/index.json`, and asks the public OpenTimestamps
// calendars to timestamp the document's sha256. The document and its `.ots`
// proof go to the `anchors` branch, never to `master`.
//
// What a proof says, and what it does not: a `pending` proof is a calendar's
// promise to include the digest in a Bitcoin transaction; an `attested` proof
// carries a Bitcoin block-header attestation at a named height. This tool checks
// the proof OFFLINE: that it parses, that it commits to the sha256 of exactly
// these document bytes, and which attestations it carries. It does not fetch the
// block header to compare the merkle root -- for that, run the reference client
// (`ots verify`) against a Bitcoin node or explorer. Nothing here says anything
// about whether the records the document names are TRUE; it binds bytes to a time.
//
//   node tools/anchor.mjs stamp --out <dir> [--date YYYY-MM-DD] [--drift-json <p>]
//                               [--drift-log <p>] [--drift-rc <n>] [--anchors-ref <ref>]
//   node tools/anchor.mjs verify <date> [--ref <ref> | --dir <dir>]
//   node tools/anchor.mjs upgrade <date> --dir <dir>
//
// `verify` and `upgrade` print one JSON object on stdout; library chatter and the
// human summary go to stderr, so stdout parses.
//
// Exit codes. stamp: 0 stamped; 2 usage, or that day already carries a proof;
// 3 no calendar returned an attestation (the document and drift bytes are still
// written, and the day is recorded as unstamped -- never backfilled later).
// verify: 0 pending or attested; 1 mismatch or malformed; 2 a file is missing
// or usage. upgrade: 0 whether or not a calendar had an upgrade yet; 1 when the
// proof does not commit to the document; 2 missing or usage.
//
// Bytes come from the object store, never a checkout: `core.autocrlf` is true on
// the machine this repository is developed on, and a digest over a checked-out
// file is a digest of whatever the checkout did to it.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const OpenTimestamps = require("opentimestamps");
const { DetachedTimestampFile, Ops, Notary } = OpenTimestamps;

export const SCHEMA = "receipt-verify/anchor/0";
export const VERIFY_SCHEMA = "receipt-verify/anchor-verify/0";
export const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function sha256Hex(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function isDate(s) {
  if (typeof s !== "string" || !DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Run git in `repo` and return stdout as a Buffer, or null when git fails. */
function gitBuf(repo, args) {
  try {
    return execFileSync("git", args, { cwd: repo, stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 28 });
  } catch {
    return null;
  }
}
const gitStr = (repo, args) => gitBuf(repo, args)?.toString("utf8").trim() ?? null;

/** The bytes of `path` at `rev`, from the object store, or null when absent. */
export function blobAt(repo, rev, path) {
  return gitBuf(repo, ["cat-file", "blob", `${rev}:${path}`]);
}

/**
 * The library logs every calendar it talks to with console.log. Routed to
 * stderr for the duration of a library call so that stdout stays one JSON object.
 */
async function quietly(fn) {
  const log = console.log;
  console.log = (...a) => console.error(...a);
  try {
    return await fn();
  } finally {
    console.log = log;
  }
}

// ---- the document ---------------------------------------------------------

/**
 * Member order is fixed here, so the bytes are a function of the inputs. Three
 * members beyond the 19 Sep design are there so a reader can tell WHY a value
 * is what it is without another question: which range `master_commit_verified`
 * covers, why `drift_json_sha256` is null when it is, and the digest of the
 * drift log that sits beside the drift JSON on the branch.
 */
export function buildDocument(i) {
  const doc = {
    schema: SCHEMA,
    date: i.date,
    master_commit: i.masterCommit,
    master_commit_verified: i.verified,
    master_commit_verified_range: i.verifiedRange,
    drift_json_sha256: i.driftJson ? sha256Hex(i.driftJson) : null,
    drift_json_absent_reason: i.driftJson ? null : (i.driftAbsentReason ?? "no drift JSON was supplied"),
    drift_exit_code: Number.isInteger(i.driftRc) ? i.driftRc : null,
    drift_log_sha256: i.driftLog ? sha256Hex(i.driftLog) : null,
    registry_index_sha256: i.registryIndex ? sha256Hex(i.registryIndex) : null,
    generated_at: i.generatedAt,
  };
  return { doc, bytes: Buffer.from(JSON.stringify(doc, null, 2) + "\n", "utf8") };
}

// ---- the proof --------------------------------------------------------------

/**
 * Parse `.ots` bytes; never throws. The library's reader returns a short slice
 * when asked to read past the end of its buffer instead of failing, so a
 * TRUNCATED proof parses. A proof is therefore accepted only if it re-serializes
 * to exactly its own bytes; every example proof the library ships (11, made by
 * other clients, Bitcoin-attested ones among them) does.
 */
export function readProof(otsBytes) {
  try {
    const detached = DetachedTimestampFile.deserialize(new Uint8Array(otsBytes));
    if (!Buffer.from(detached.serializeToBytes()).equals(Buffer.from(otsBytes))) {
      return { detached: null, error: "the proof does not re-serialize to its own bytes (truncated or non-canonical)" };
    }
    return { detached, error: null };
  } catch (e) {
    return { detached: null, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Every attestation in the proof tree. Walked here rather than with the
 * library's allAttestations(), which keys a Map on the message and so keeps
 * only one attestation per message.
 */
export function proofAttestations(detached) {
  const out = [];
  const walk = (ts) => {
    for (const a of ts.attestations) {
      if (a instanceof Notary.PendingAttestation) out.push({ kind: "pending", uri: a.uri });
      else if (a instanceof Notary.BitcoinBlockHeaderAttestation) out.push({ kind: "bitcoin", height: a.height });
      else out.push({ kind: "other", type: a.constructor?.name ?? "unknown" });
    }
    ts.ops.forEach((sub) => walk(sub));
  };
  walk(detached.timestamp);
  return out;
}

/** Does this parsed proof commit to the sha256 of exactly `docBytes`? */
function digestBinds(detached, docBytes) {
  const proofDigest = Buffer.from(detached.fileDigest()).toString("hex");
  const isSha256 = detached.fileHashOp instanceof Ops.OpSHA256;
  return { ok: isSha256 && proofDigest === sha256Hex(docBytes), proofDigest, isSha256 };
}

/**
 * Assess one day. Pure apart from the git reads used to bind the document to
 * this repository; `repo: null` skips those reads and says so in `checks`.
 */
export function assess({ date, docBytes, otsBytes, driftJsonBytes = null, repo = REPO }) {
  const result = {
    schema: VERIFY_SCHEMA,
    date,
    outcome: null,
    reason: null,
    document_sha256: docBytes ? sha256Hex(docBytes) : null,
    proof_digest: null,
    master_commit: null,
    attestations: [],
    bitcoin_height: null,
    checks: {},
  };
  const done = (outcome, reason) => Object.assign(result, { outcome, reason });

  if (!docBytes) return done("missing", `anchors/${date}.json is absent`);
  if (!otsBytes) return done("missing", `anchors/${date}.json.ots is absent`);

  const { detached, error } = readProof(otsBytes);
  if (!detached) return done("malformed", `the .ots proof does not parse: ${error}`);
  const bind = digestBinds(detached, docBytes);
  result.proof_digest = bind.proofDigest;
  if (!bind.isSha256) return done("mismatch", "the proof's file hash operation is not sha256");
  if (!bind.ok) return done("mismatch", `the proof commits to ${bind.proofDigest}; the document's sha256 is ${result.document_sha256}`);
  result.checks.proof_commits_to_document = true;

  let doc;
  try {
    doc = JSON.parse(docBytes.toString("utf8"));
  } catch {
    return done("malformed", "the document is not JSON");
  }
  if (doc?.schema !== SCHEMA) return done("malformed", `the document's schema is ${JSON.stringify(doc?.schema)}, not ${SCHEMA}`);
  result.master_commit = doc.master_commit ?? null;
  if (doc.date !== date) return done("mismatch", `the document is dated ${doc.date}, not ${date}`);

  // The drift bytes on the branch must be the bytes the document hashed.
  if (doc.drift_json_sha256 !== null) {
    if (!driftJsonBytes) return done("mismatch", `the document names drift_json_sha256 ${doc.drift_json_sha256} and anchors/${date}.drift.json is absent`);
    if (sha256Hex(driftJsonBytes) !== doc.drift_json_sha256) {
      return done("mismatch", `anchors/${date}.drift.json hashes to ${sha256Hex(driftJsonBytes)}; the document names ${doc.drift_json_sha256}`);
    }
    result.checks.drift_json_matches = true;
  }

  // The document must describe a commit of THIS history, and the registry index there.
  if (repo === null) {
    result.checks.bound_to_repository = "skipped";
  } else {
    if (gitStr(repo, ["cat-file", "-t", String(doc.master_commit)]) !== "commit") {
      return done("mismatch", `master_commit ${doc.master_commit} is not a commit in this repository (fetch master?)`);
    }
    const idx = blobAt(repo, doc.master_commit, "registry/index.json");
    const want = idx ? sha256Hex(idx) : null;
    if (want !== doc.registry_index_sha256) {
      return done("mismatch", `registry/index.json at ${String(doc.master_commit).slice(0, 12)} hashes to ${want}; the document names ${doc.registry_index_sha256}`);
    }
    result.checks.bound_to_repository = true;
  }

  result.attestations = proofAttestations(detached);
  const heights = result.attestations.filter((a) => a.kind === "bitcoin").map((a) => a.height);
  if (heights.length) {
    result.bitcoin_height = Math.min(...heights);
    return done("attested", `the proof carries a Bitcoin block-header attestation at height ${result.bitcoin_height}; checked offline, not against the block`);
  }
  if (result.attestations.some((a) => a.kind === "pending")) {
    return done("pending", "the proof carries only calendar attestations; it is upgraded once a Bitcoin block includes the calendar's commitment");
  }
  return done("malformed", "the proof carries no attestation");
}

/**
 * Upgrade a proof. Returns the new bytes only when a calendar added an
 * attestation AND the result still commits to the document; otherwise null.
 * `upgrader` is injected so the tests run offline.
 */
export async function upgradeProof(docBytes, otsBytes, upgrader = (d) => OpenTimestamps.upgrade(d)) {
  const { detached, error } = readProof(otsBytes);
  if (!detached) throw new Error(`the .ots proof does not parse: ${error}`);
  if (!digestBinds(detached, docBytes).ok) throw new Error("the proof does not commit to the document; refusing to upgrade it");
  const changed = await quietly(() => upgrader(detached));
  if (!changed) return null;
  const bytes = Buffer.from(detached.serializeToBytes());
  const again = readProof(bytes);
  if (!again.detached || !digestBinds(again.detached, docBytes).ok) throw new Error("the upgraded proof no longer commits to the document");
  return bytes;
}

/**
 * Stamp the document's sha256 at the calendars. The library soft-fails every
 * calendar and does not enforce its own `m`, so a total outage comes back as a
 * proof with no attestation and no error; that is caught here.
 */
export async function stampDocument(docBytes, stamper = (d) => OpenTimestamps.stamp(d)) {
  const detached = DetachedTimestampFile.fromHash(new Ops.OpSHA256(), new Uint8Array(createHash("sha256").update(docBytes).digest()));
  await quietly(() => stamper(detached));
  const atts = proofAttestations(detached);
  if (!atts.some((a) => a.kind === "pending" || a.kind === "bitcoin")) {
    throw new Error("no calendar returned an attestation");
  }
  return Buffer.from(detached.serializeToBytes());
}

// ---- the previous anchor, for the verification range ----------------------

/** The latest anchored day before `date` on `ref`, or null. */
export function previousAnchor(repo, ref, date) {
  const ls = gitStr(repo, ["ls-tree", "--name-only", ref, "anchors/"]);
  if (!ls) return null;
  const days = ls
    .split("\n")
    .map((l) => /^anchors\/(\d{4}-\d{2}-\d{2})\.json$/.exec(l.trim())?.[1])
    .filter((d) => d && d < date)
    .sort();
  for (let i = days.length - 1; i >= 0; i--) {
    const bytes = blobAt(repo, ref, `anchors/${days[i]}.json`);
    try {
      const c = JSON.parse(bytes.toString("utf8")).master_commit;
      if (typeof c === "string" && /^[0-9a-f]{40}$/.test(c)) return { date: days[i], commit: c };
    } catch {
      /* an unreadable day is skipped; the next earlier one is used */
    }
  }
  return null;
}

function verifyHistory(repo, prev, head) {
  // A previous anchored commit that is not in this history (a rewritten master)
  // cannot bound a range; the whole history is verified instead and the range
  // member says so.
  const usable = prev && gitStr(repo, ["cat-file", "-t", prev.commit]) === "commit";
  const range = usable ? `${prev.commit}..${head}` : "full";
  const args = ["tools/verify-history.sh", ...(usable ? ["--range", range] : [])];
  try {
    const out = execFileSync("sh", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 26 });
    console.error(out.trim().split("\n").pop());
    return { verified: true, range };
  } catch (e) {
    console.error(`verify-history failed: ${String(e.stderr ?? e.message).trim().split("\n").pop()}`);
    return { verified: false, range };
  }
}

// ---- CLI --------------------------------------------------------------------

function parseArgs(argv) {
  const pos = [];
  const opt = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith("--")) throw new Error(`${a} needs a value`);
      opt[a.slice(2)] = v;
      i++;
    } else pos.push(a);
  }
  return { pos, opt };
}

function readMaybe(p) {
  return p && existsSync(p) ? readFileSync(p) : null;
}

function writeAtomic(p, bytes) {
  writeFileSync(`${p}.tmp`, bytes);
  renameSync(`${p}.tmp`, p);
}

async function cmdStamp(opt) {
  const date = opt.date ?? new Date().toISOString().slice(0, 10);
  if (!isDate(date)) return usage(`--date ${date} is not a calendar date`);
  if (!opt.out) return usage("stamp needs --out <dir>");
  const out = resolve(opt.out);
  mkdirSync(out, { recursive: true });
  if (existsSync(join(out, `${date}.json.ots`))) {
    console.error(`anchor: ${date} already carries a proof in ${out}; a day is stamped once`);
    return 2;
  }

  const head = gitStr(REPO, ["rev-parse", "HEAD"]);
  const prev = previousAnchor(REPO, opt["anchors-ref"] ?? "origin/anchors", date);
  const { verified, range } = verifyHistory(REPO, prev, head);

  const driftPath = resolve(opt["drift-json"] ?? join(REPO, "walker", "drift.json"));
  const driftJson = readMaybe(driftPath);
  const driftLog = readMaybe(opt["drift-log"] && resolve(opt["drift-log"]));
  const rc = opt["drift-rc"] !== undefined && /^-?\d+$/.test(opt["drift-rc"]) ? Number(opt["drift-rc"]) : null;

  const { doc, bytes } = buildDocument({
    date,
    masterCommit: head,
    verified,
    verifiedRange: range,
    driftJson,
    driftAbsentReason: `the drift run produced no ${driftPath.startsWith(REPO) ? driftPath.slice(REPO.length + 1).split("\\").join("/") : driftPath}${rc === null ? "" : ` (drift exit code ${rc})`}`,
    driftRc: rc,
    driftLog,
    registryIndex: blobAt(REPO, "HEAD", "registry/index.json"),
    generatedAt: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
  });

  // The drift bytes are written first and the document hashes what was written.
  if (driftJson) writeFileSync(join(out, `${date}.drift.json`), driftJson);
  if (driftLog) writeFileSync(join(out, `${date}.drift.log`), driftLog);
  writeFileSync(join(out, `${date}.json`), bytes);
  console.error(`anchor: document ${date}.json sha256 ${sha256Hex(bytes)}`);
  console.error(bytes.toString("utf8").trimEnd());

  let ots;
  try {
    ots = await stampDocument(bytes);
  } catch (e) {
    console.log(JSON.stringify({ schema: VERIFY_SCHEMA, date, outcome: "unstamped", reason: e.message, document_sha256: sha256Hex(bytes), document: doc }));
    return 3;
  }
  writeFileSync(join(out, `${date}.json.ots`), ots);
  const r = assess({ date, docBytes: bytes, otsBytes: ots, driftJsonBytes: driftJson });
  console.log(JSON.stringify({ ...r, document: doc, proof_hex: ots.toString("hex") }));
  return r.outcome === "pending" || r.outcome === "attested" ? 0 : 1;
}

function load(date, opt) {
  if (opt.dir) {
    const d = resolve(opt.dir);
    return {
      docBytes: readMaybe(join(d, `${date}.json`)),
      otsBytes: readMaybe(join(d, `${date}.json.ots`)),
      driftJsonBytes: readMaybe(join(d, `${date}.drift.json`)),
    };
  }
  const ref = opt.ref ?? "origin/anchors";
  return {
    docBytes: blobAt(REPO, ref, `anchors/${date}.json`),
    otsBytes: blobAt(REPO, ref, `anchors/${date}.json.ots`),
    driftJsonBytes: blobAt(REPO, ref, `anchors/${date}.drift.json`),
  };
}

function cmdVerify(date, opt) {
  if (!isDate(date)) return usage(`verify needs a date, got ${date}`);
  const r = assess({ date, ...load(date, opt) });
  console.log(JSON.stringify(r));
  console.error(`anchor: ${date} ${r.outcome.toUpperCase()} -- ${r.reason}`);
  return r.outcome === "pending" || r.outcome === "attested" ? 0 : r.outcome === "missing" ? 2 : 1;
}

async function cmdUpgrade(date, opt) {
  if (!isDate(date)) return usage(`upgrade needs a date, got ${date}`);
  if (!opt.dir) return usage("upgrade needs --dir <dir>; a proof on a branch is rewritten through a checkout of it");
  const { docBytes, otsBytes } = load(date, opt);
  if (!docBytes || !otsBytes) {
    console.log(JSON.stringify({ schema: VERIFY_SCHEMA, date, upgraded: false, outcome: "missing" }));
    return 2;
  }
  let next;
  try {
    next = await upgradeProof(docBytes, otsBytes);
  } catch (e) {
    console.log(JSON.stringify({ schema: VERIFY_SCHEMA, date, upgraded: false, outcome: "mismatch", reason: e.message }));
    return 1;
  }
  if (next) writeAtomic(join(resolve(opt.dir), `${date}.json.ots`), next);
  const r = assess({ date, docBytes, otsBytes: next ?? otsBytes, repo: null });
  console.log(JSON.stringify({ ...r, upgraded: next !== null }));
  console.error(`anchor: ${date} ${next ? "upgraded" : "unchanged"}, ${r.outcome}`);
  return 0;
}

function usage(msg) {
  console.error(`anchor: ${msg}\nusage: anchor.mjs stamp --out <dir> | verify <date> [--ref <ref> | --dir <dir>] | upgrade <date> --dir <dir>`);
  return 2;
}

async function main(argv) {
  let parsed;
  try {
    parsed = parseArgs(argv);
  } catch (e) {
    return usage(e.message);
  }
  const [cmd, date] = parsed.pos;
  if (cmd === "stamp") return cmdStamp(parsed.opt);
  if (cmd === "verify") return cmdVerify(date, parsed.opt);
  if (cmd === "upgrade") return cmdUpgrade(date, parsed.opt);
  return usage(`unknown command ${cmd ?? "(none)"}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // exitCode, not exit(): a piped stdout is not cut off (aed4320).
  main(process.argv.slice(2)).then(
    (code) => (process.exitCode = code),
    (e) => {
      console.error(e);
      process.exitCode = 2;
    },
  );
}
