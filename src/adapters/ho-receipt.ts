// Adapter: ho.receipt/v5.0 — Headless Oracle signed market-state receipts.
//
// INTERESTS FIRST. The author of this repository also builds Headless Oracle,
// the issuer of this format. This adapter is the HO author's tool grading HO's
// own format. Independence is not claimed; recomputability is: every rule below
// is read from the issuer's source at a named commit and every one of them can be
// re-derived from the receipt bytes by anyone, with this tool or without it.
//
// WHERE THE RULES COME FROM. The issuer publishes no specification prose that
// states the consistency rules of the signed `coverage` block; the rules are
// what the signer does. They are transcribed here from the Headless Oracle
// worker at commit d79bd181350d184218fbdc3aa925630c79fc535e, `src/index.ts`:
//
//   signPayload            1879  every value a string, keys sorted, JSON.stringify
//                                with no whitespace, Ed25519, lowercase hex
//   buildSignedReceipt    11487  Tier 0 override, Tier 1 schedule, Tier 2 signed
//                                fail-closed UNKNOWN, Tier 3 unsigned CRITICAL_FAILURE
//   buildReceiptCoverage   1565  consulted / not_consulted per tier and feed state
//   coverageField          1641  the seven members, in this order, compact JSON
//   UnknownReason          1410  UNSUPPORTED_MIC, NO_HOLIDAY_DATA_FOR_YEAR,
//                                DETERMINATION_ERROR
//   HALT_HEARTBEAT_FRESH_MS 1502 live means a heartbeat no older than 180 s
//   getScheduleStatus      1685  which source and reason a Tier 1 UNKNOWN carries
//   RECEIPT_TTL_SECONDS    2371  60
//   /v5/keys              13601  keys[] and canonical_payload_spec field lists
//   /v5/health            14039  the health receipt
//
// THE FIELD LIST IS READ FROM THE REGISTRY SNAPSHOT, never by dropping wrapper
// members. A served body is `{...receipt, receipt, discovery_url}`, and the health
// body carries a dozen unsigned members beside the signed ones; which members are
// signed is what `/v5/keys -> canonical_payload_spec` says, and nothing else.
//
// KEY LOOKUP IS BY `public_key_id` IN A /v5/keys SNAPSHOT (`--registry`). The
// receipt carries no JWKS `kid`. The issuer's JWKS publishes its receipt key under
// an RFC 7638 thumbprint, beside keys that are not receipt keys at all, so a
// receipt cannot name its JWKS entry and `--jwks` alone is refused rather than
// answered by trying every key in the set (founder ruling 3, 2026-10-07; FINDINGS
// section J).
//
// EXPIRY IS STRICT. A receipt is expired iff now >= expires_at. Clock tolerance
// never extends validity past expires_at; it applies only to an issued_at in the
// future (founder ruling 1, 2026-10-07). The issuer's own verifiers disagree at
// equality (the worker's docs/receipt-spec.md "Expiry boundary"); this adapter
// takes the strict side, which is the fail-closed one.
//
// SCOPE. Market receipts (Tier 0, 1 and 2) and health receipts. The
// /v1/safe-to-trade receipt (safe_to_trade_fields) is a different receipt with a
// different field list and is out of scope here: it is declined at detection and
// refused under --format, and it is not counted as an unaddressed coverage item
// of this format (founder ruling 4).

import { createHash, createPublicKey, verify as cryptoVerify, type KeyObject } from "node:crypto";
import type { Adapter, ResolvedKey, VerifyOptions, VerifyResult } from "../types.js";
import { invalid, unverifiable, valid } from "../verdict.js";
import { rfc7638Thumbprint } from "../jws.js";
// The duplicate-member scanner, reused rather than reimplemented, as the ACTA
// adapter does: one rule, one implementation.
import { findDuplicateKey } from "./insight.js";

export const FORMAT = "ho.receipt/v5.0";

/** The worker commit every rule in this file is transcribed from. */
export const WORKER_COMMIT = "d79bd181350d184218fbdc3aa925630c79fc535e";

/** RECEIPT_TTL_SECONDS = 60 (worker src/index.ts 2371), in milliseconds. */
export const RECEIPT_TTL_MS = 60_000;

/** HALT_HEARTBEAT_FRESH_MS (worker src/index.ts 1502): `live` means no older than this. */
export const FEED_FRESH_MS = 180_000;

const DEFAULT_CLOCK_TOLERANCE_SEC = 60;

/**
 * The three field lists `/v5/keys` served at WORKER_COMMIT (src/index.ts
 * 13623-13625). The adapter canonicalises from the SNAPSHOT's lists, not from
 * these; these are what it compares the snapshot against, so a snapshot whose
 * lists moved is reported rather than silently graded under rules written for
 * different ones.
 */
export const WORKER_FIELD_LISTS = {
  receipt_fields: ["coverage", "expires_at", "halt_detection", "issued_at", "issuer", "mic", "public_key_id", "receipt_id", "receipt_mode", "schema_version", "source", "status"],
  override_fields: ["coverage", "expires_at", "halt_detection", "issued_at", "issuer", "mic", "public_key_id", "reason", "receipt_id", "receipt_mode", "schema_version", "source", "status"],
  health_fields: ["expires_at", "issued_at", "issuer", "public_key_id", "receipt_id", "source", "status"],
} as const;

type Kind = "market" | "override" | "health";
const LIST_FOR: Record<Kind, keyof typeof WORKER_FIELD_LISTS> = {
  market: "receipt_fields",
  override: "override_fields",
  health: "health_fields",
};

/**
 * The members of the signed `coverage` string, in the order coverageField
 * writes them. The order is part of the signer's contract: the string is
 * reproduced byte for byte from it.
 */
export const COVERAGE_MEMBERS = [
  "determination_tier",
  "consulted",
  "not_consulted",
  "realtime_halt_feed_scope",
  "unknown_reason",
  "feed_state",
  "feed_last_run",
] as const;
type CoverageMember = (typeof COVERAGE_MEMBERS)[number];

/**
 * Which declared checks examine each coverage member. Founder ruling 5: every
 * member of the signed coverage string is examined by a declared check, and a
 * check that examines it is one that can move the verdict. Exported so the test
 * that locks the ruling reads the same table this adapter enforces, and checks it
 * against the member list of a receipt the WORKER produced rather than against
 * this file's own constant.
 */
export const COVERAGE_MEMBER_CHECKS: Readonly<Record<CoverageMember, readonly string[]>> = Object.freeze({
  determination_tier: ["coverage_encoding", "tier_source", "consulted_sets"],
  consulted: ["coverage_encoding", "consulted_sets"],
  not_consulted: ["coverage_encoding", "consulted_sets"],
  realtime_halt_feed_scope: ["coverage_encoding", "halt_scope"],
  unknown_reason: ["coverage_encoding", "tier_source"],
  feed_state: ["coverage_encoding", "halt_scope", "feed_freshness", "consulted_sets"],
  feed_last_run: ["coverage_encoding", "feed_freshness"],
});

const STATUSES = ["OPEN", "CLOSED", "HALTED", "UNKNOWN"];
const SOURCES = ["SCHEDULE", "OVERRIDE", "SYSTEM"];
const HALT_DETECTION = ["active", "schedule_only"];
const RECEIPT_MODES = ["demo", "live"];
const COVERAGE_SOURCES = ["manual_override_kv", "realtime_halt_feed", "realtime_halt_feed_via_override", "schedule"];
const FEED_STATES = ["live", "stale", "failed", "absent", "not_covered"];
const UNKNOWN_REASONS = ["UNSUPPORTED_MIC", "NO_HOLIDAY_DATA_FOR_YEAR", "DETERMINATION_ERROR"];

/** What `new Date().toISOString()` emits, and the RFC 3339 UTC forms close to it. */
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,9})?Z$/;
const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const MIC = /^[A-Z0-9]{4}$/;
const SIG_HEX = /^[0-9a-f]{128}$/;
const KEY_HEX = /^[0-9a-fA-F]{64}$/;

type Ann = Record<string, string | number | boolean>;
type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => v !== null && typeof v === "object" && !Array.isArray(v);
const sha256Hex = (b: Uint8Array): string => createHash("sha256").update(b).digest("hex");
const sameArray = (a: readonly string[], b: readonly string[]): boolean => a.length === b.length && a.every((x, i) => x === b[i]);
const sorted = (a: readonly string[]): string[] => [...a].sort();

function parseIso(s: string): number | null {
  if (!ISO_UTC.test(s)) return null;
  const ms = Date.parse(s);
  return Number.isFinite(ms) ? ms : null;
}

// --------------------------------------------------------------------------
// shape
// --------------------------------------------------------------------------

type Parsed = { ok: true; doc: Obj } | { ok: false; detail: string };

function parse(bytes: Uint8Array): Parsed {
  const text = Buffer.from(bytes).toString("utf8");
  // Before JSON.parse, for the reason the insight and ACTA adapters give: a
  // repeated member is silently resolved to its LAST occurrence by JSON.parse, so
  // a body whose signed bytes say OPEN could display CLOSED. The signer's
  // canonical form is built from an object, which cannot hold a repeated key, so
  // no receipt it signed carries one.
  const dup = findDuplicateKey(text);
  if (dup !== null) {
    return { ok: false, detail: `duplicate member name ${JSON.stringify(dup)}: JSON.parse would keep the last occurrence silently, so no value from this body is read at all` };
  }
  let doc: unknown;
  try {
    doc = JSON.parse(text);
  } catch (e) {
    return { ok: false, detail: `not valid JSON: ${(e as Error).message}` };
  }
  if (!isObj(doc)) return { ok: false, detail: "body is not a JSON object" };
  return { ok: true, doc };
}

/** The unsigned Tier 3 body buildSignedReceipt returns when signing itself fails. */
function isTier3Body(o: Obj): boolean {
  return o["error"] === "CRITICAL_FAILURE" && o["status"] === "UNKNOWN" && o["source"] === "SYSTEM";
}

/** A /v1/safe-to-trade receipt: out of scope for this format (ruling 4). */
function isSafeToTrade(o: Obj): boolean {
  return "safe" in o && "venue" in o && "instrument" in o;
}

/**
 * Conservative. Claims a body that carries the members every HO receipt kind
 * signs, a string `signature`, and none of the members that mark the
 * safe-to-trade receipt; and the unsigned Tier 3 body by its exact error token,
 * so that auto-detection reaches the refusal that says what it is. A JWS has a
 * string signature too, but no `receipt_id`/`public_key_id`/`issued_at`; an ACTA
 * envelope's signature is an object.
 */
export function detect(bytes: Uint8Array): boolean {
  const p = parse(bytes);
  if (!p.ok) return false;
  const o = p.doc;
  if (isTier3Body(o)) return typeof o["message"] === "string" && !("signature" in o);
  if (isSafeToTrade(o)) return false;
  for (const k of ["receipt_id", "issued_at", "expires_at", "issuer", "status", "source", "public_key_id", "signature"]) {
    if (typeof o[k] !== "string") return false;
  }
  return true;
}

// --------------------------------------------------------------------------
// the registry snapshot
// --------------------------------------------------------------------------

interface RegistryKey {
  key_id: string;
  algorithm: unknown;
  format: unknown;
  public_key: unknown;
  valid_from: unknown;
  valid_until: unknown;
}

interface Registry {
  keys: RegistryKey[];
  lists: Record<keyof typeof WORKER_FIELD_LISTS, string[]>;
}

function readRegistry(bytes: Uint8Array): { ok: true; reg: Registry } | { ok: false; detail: string } {
  const p = parse(bytes);
  if (!p.ok) return { ok: false, detail: `registry snapshot: ${p.detail}` };
  const keys = p.doc["keys"];
  if (!Array.isArray(keys)) return { ok: false, detail: "registry snapshot carries no `keys` array (a /v5/keys document is expected)" };
  const spec = p.doc["canonical_payload_spec"];
  if (!isObj(spec)) {
    return {
      ok: false,
      detail:
        "registry snapshot carries no `canonical_payload_spec`, so it does not say which members are signed. " +
        "/.well-known/oracle-keys.json omits it by design; supply the /v5/keys document",
    };
  }
  const lists = {} as Registry["lists"];
  for (const name of Object.keys(WORKER_FIELD_LISTS) as (keyof typeof WORKER_FIELD_LISTS)[]) {
    const l = spec[name];
    if (!Array.isArray(l) || !l.every((x) => typeof x === "string")) {
      return { ok: false, detail: `registry snapshot: canonical_payload_spec.${name} is missing or not an array of strings` };
    }
    lists[name] = l as string[];
  }
  const out: RegistryKey[] = [];
  for (const k of keys) {
    if (!isObj(k) || typeof k["key_id"] !== "string") return { ok: false, detail: "registry snapshot: a `keys` entry has no string key_id" };
    out.push({
      key_id: k["key_id"],
      algorithm: k["algorithm"],
      format: k["format"],
      public_key: k["public_key"],
      valid_from: k["valid_from"],
      valid_until: k["valid_until"],
    });
  }
  return { ok: true, reg: { keys: out, lists } };
}

// --------------------------------------------------------------------------
// the coverage block
// --------------------------------------------------------------------------

interface Coverage {
  determination_tier: 0 | 1 | 2;
  consulted: string[];
  not_consulted: string[];
  realtime_halt_feed_scope: string[];
  unknown_reason: string | null;
  feed_state: string;
  feed_last_run: string | null;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function strictlySortedUnique(a: string[]): boolean {
  return a.every((x, i) => i === 0 || a[i - 1]! < x) && sameArray(a, sorted(a));
}

/** coverage_encoding: the signed string is exactly coverageField's output for its own members. */
function readCoverage(s: string): { ok: true; cov: Coverage } | { ok: false; detail: string } {
  const dup = findDuplicateKey(s);
  if (dup !== null) return { ok: false, detail: `coverage repeats the member ${JSON.stringify(dup)}` };
  let v: unknown;
  try {
    v = JSON.parse(s);
  } catch (e) {
    return { ok: false, detail: `coverage is not valid JSON: ${(e as Error).message}` };
  }
  if (!isObj(v)) return { ok: false, detail: "coverage does not decode to a JSON object" };
  const keys = Object.keys(v);
  if (!sameArray(keys, COVERAGE_MEMBERS)) {
    return {
      ok: false,
      detail: `coverage members are [${keys.join(", ")}]; coverageField writes exactly [${COVERAGE_MEMBERS.join(", ")}], in that order`,
    };
  }
  const t = v["determination_tier"];
  if (t !== 0 && t !== 1 && t !== 2) return { ok: false, detail: `coverage.determination_tier is ${JSON.stringify(t)}; 0, 1 or 2 is defined` };
  for (const m of ["consulted", "not_consulted"] as const) {
    const a = v[m];
    if (!isStringArray(a) || !a.every((x) => COVERAGE_SOURCES.includes(x))) {
      return { ok: false, detail: `coverage.${m} is not an array of the four source tokens (${COVERAGE_SOURCES.join(", ")})` };
    }
    if (!strictlySortedUnique(a)) return { ok: false, detail: `coverage.${m} is not sorted and duplicate-free, as buildReceiptCoverage emits it` };
  }
  const both = (v["consulted"] as string[]).filter((x) => (v["not_consulted"] as string[]).includes(x));
  if (both.length > 0) return { ok: false, detail: `coverage names ${both.join(", ")} as both consulted and not consulted` };
  const scope = v["realtime_halt_feed_scope"];
  if (!isStringArray(scope) || !scope.every((x) => MIC.test(x)) || !strictlySortedUnique(scope)) {
    return { ok: false, detail: "coverage.realtime_halt_feed_scope is not a sorted, duplicate-free array of MICs" };
  }
  const ur = v["unknown_reason"];
  if (ur !== null && !(typeof ur === "string" && UNKNOWN_REASONS.includes(ur))) {
    return { ok: false, detail: `coverage.unknown_reason is ${JSON.stringify(ur)}; null or one of ${UNKNOWN_REASONS.join(", ")} is defined` };
  }
  const fs = v["feed_state"];
  if (typeof fs !== "string" || !FEED_STATES.includes(fs)) {
    return { ok: false, detail: `coverage.feed_state is ${JSON.stringify(fs)}; one of ${FEED_STATES.join(", ")} is defined` };
  }
  const flr = v["feed_last_run"];
  if (flr !== null && typeof flr !== "string") return { ok: false, detail: "coverage.feed_last_run is neither a string nor null" };
  // Byte-for-byte: re-emit in coverageField's order and compare. Catches
  // whitespace, escaped spellings and number forms no member check can see.
  const cov = v as unknown as Coverage;
  const reemitted = JSON.stringify({
    determination_tier: cov.determination_tier,
    consulted: cov.consulted,
    not_consulted: cov.not_consulted,
    realtime_halt_feed_scope: cov.realtime_halt_feed_scope,
    unknown_reason: cov.unknown_reason,
    feed_state: cov.feed_state,
    feed_last_run: cov.feed_last_run,
  });
  if (reemitted !== s) {
    return { ok: false, detail: "coverage decodes to the right members but is not the compact string coverageField emits for them (whitespace, escaping or number form differs)" };
  }
  return { ok: true, cov };
}

// --------------------------------------------------------------------------
// verify
// --------------------------------------------------------------------------

/**
 * Checks that apply only to market and override receipts. A health receipt
 * carries no mic, no coverage and no schema_version, so on a health receipt each
 * of these is `condition_unmet` with this text rather than silently absent.
 */
const MARKET_ONLY = [
  "schema_version",
  "coverage_encoding",
  "tier_source",
  "halt_scope",
  "feed_freshness",
  "consulted_sets",
  "status_determination",
  "heartbeat_existence",
  "override_origin",
  "feed_scope_configuration",
];
const HEALTH_CONDITION = "applies to market and override receipts; a health receipt (health_fields) carries no mic, no coverage and no schema_version";

async function verifyHo(bytes: Uint8Array, opts: VerifyOptions): Promise<VerifyResult> {
  const ann: Ann = {};
  let unmet: { id: string; condition: string }[] | undefined;
  const refuse = (reason: Parameters<typeof unverifiable>[1], detail: string, stoppedAt: string): VerifyResult =>
    unverifiable(FORMAT, reason, detail, ann, stoppedAt, unmet);

  // 1. parse ---------------------------------------------------------------
  const p = parse(bytes);
  if (!p.ok) return refuse("malformed_receipt", p.detail, "parse");
  const o = p.doc;

  // 2. signed_body ---------------------------------------------------------
  if (isTier3Body(o)) {
    ann["tier3_body"] = "unsigned CRITICAL_FAILURE";
    return refuse(
      "malformed_receipt",
      "the unsigned Tier 3 CRITICAL_FAILURE body: signing itself failed at the issuer, so there is no signature to check and nothing " +
        "here is attested. The issuer's own contract for this body is to treat the status as UNKNOWN, which means CLOSED, and halt",
      "signed_body",
    );
  }
  if (isSafeToTrade(o)) {
    return refuse(
      "format_unrecognized",
      "a /v1/safe-to-trade receipt (canonical_payload_spec.safe_to_trade_fields): out of scope for ho.receipt/v5.0, which verifies " +
        "market receipts (tiers 0-2) and health receipts. Nothing about it was evaluated",
      "signed_body",
    );
  }
  if (!("signature" in o)) return refuse("malformed_receipt", "the body carries no `signature` member; an HO receipt is never served unsigned except as the Tier 3 body", "signed_body");
  const sig = o["signature"];
  if (typeof sig !== "string" || !SIG_HEX.test(sig)) {
    return refuse(
      "malformed_member",
      "`signature` is not 128 lowercase hexadecimal characters; signPayload emits the 64-byte Ed25519 signature as lowercase hex",
      "signed_body",
    );
  }

  // 3. registry_snapshot -----------------------------------------------------
  if (opts.registry === undefined) {
    if (opts.jwks !== undefined) {
      ann["jwks_without_registry"] = "refused";
      return refuse(
        "key_unresolvable",
        `--jwks alone cannot resolve an HO receipt's key. The receipt names its key by public_key_id ` +
          `(${JSON.stringify(o["public_key_id"])}), an identifier of the issuer's /v5/keys registry, and carries no JWKS kid; ` +
          `the issuer's JWKS publishes its receipt key under an RFC 7638 thumbprint beside keys that sign other things. Matching ` +
          `would mean trying every key in the set, which this tool does not do. Supply the /v5/keys snapshot with --registry`,
        "registry_snapshot",
      );
    }
    return refuse(
      "key_unresolvable",
      "no key registry supplied: an HO receipt's key resolves by public_key_id from a /v5/keys snapshot, and the snapshot also says which members are signed. Pass it with --registry",
      "registry_snapshot",
    );
  }
  const regBytes = Buffer.from(opts.registry);
  const regSha = sha256Hex(regBytes);
  ann["registry_snapshot_sha256"] = regSha;
  ann["registry_snapshot_byte_length"] = regBytes.length;
  ann["registry_snapshot_origin"] = opts.registryOrigin ?? "(registry bytes)";
  if (opts.registrySha256 !== undefined && opts.registrySha256.toLowerCase() !== regSha) {
    return refuse(
      "registry_snapshot_mismatch",
      `--registry-sha256 names ${opts.registrySha256.toLowerCase()} and the bytes supplied digest to ${regSha}: two of the caller's inputs disagree about which snapshot is meant`,
      "registry_snapshot",
    );
  }
  const rr = readRegistry(regBytes);
  if (!rr.ok) return refuse("malformed_member", rr.detail, "registry_snapshot");
  const reg = rr.reg;
  if (opts.jwks !== undefined) ann["jwks_ignored"] = "the key resolves from --registry by public_key_id; --jwks is not consulted for this format";

  // 4. registry_provenance (reported_only) -------------------------------------
  ann["registry_provenance"] =
    "caller_supplied: this tool does not establish that these bytes are what the issuer's /v5/keys served when the receipt was issued; compare the digest above against a copy you trust";

  // 5. receipt_kind ------------------------------------------------------------
  const kind: Kind = !("mic" in o) && o["status"] === "OK" && o["source"] === "SYSTEM" ? "health" : o["source"] === "OVERRIDE" ? "override" : "market";
  const listName = LIST_FOR[kind];
  const list = reg.lists[listName];
  ann["receipt_kind"] = kind;
  if (kind === "health") unmet = MARKET_ONLY.map((id) => ({ id, condition: HEALTH_CONDITION }));
  const needed = WORKER_FIELD_LISTS[listName] as readonly string[];
  const missingFromList = needed.filter((f) => !list.includes(f));
  if (missingFromList.length > 0) {
    return refuse(
      "malformed_member",
      `the snapshot's canonical_payload_spec.${listName} does not list ${missingFromList.join(", ")}, so ${missingFromList.length === 1 ? "that member is" : "those members are"} not signed under it ` +
        `and the checks that read ${missingFromList.length === 1 ? "it" : "them"} have nothing signed to read`,
      "receipt_kind",
    );
  }
  const extraInList = list.filter((f) => !needed.includes(f));
  ann["field_list"] = sameArray(list, needed)
    ? `${listName}, as served by the worker at ${WORKER_COMMIT.slice(0, 7)}`
    : `${listName} from the snapshot, which differs from the worker's at ${WORKER_COMMIT.slice(0, 7)}: also signs ${extraInList.join(", ")}`;
  if (extraInList.length > 0) ann["signed_members_not_examined"] = extraInList.join(",");
  for (const f of list) {
    if (!(f in o)) return refuse("malformed_member", `signed member \`${f}\` (${listName}) is absent`, "receipt_kind");
    if (typeof o[f] !== "string") {
      return refuse("malformed_member", `signed member \`${f}\` is ${o[f] === null ? "null" : typeof o[f]}; signPayload signs strings only and refuses anything else`, "receipt_kind");
    }
  }
  const s = (f: string): string => o[f] as string;

  // 6. wrapper_consistency -------------------------------------------------------
  const projection: Record<string, string> = {};
  for (const f of list) projection[f] = s(f);
  const unsigned = Object.keys(o).filter((k) => !list.includes(k) && k !== "signature").sort();
  ann["unsigned_members"] = unsigned.length === 0 ? "none" : unsigned.join(",");
  if ("receipt" in o) {
    const inner = o["receipt"];
    const want: Record<string, string> = { ...projection, signature: sig };
    const problem = !isObj(inner)
      ? "is not an object"
      : (() => {
          const ik = Object.keys(inner).sort();
          const wk = Object.keys(want).sort();
          if (!sameArray(ik, wk)) return `carries members [${ik.join(", ")}] where the signed receipt has [${wk.join(", ")}]`;
          const diff = wk.find((k) => inner[k] !== want[k]);
          return diff === undefined ? null : `says ${JSON.stringify(inner[diff])} for \`${diff}\` where the top level says ${JSON.stringify(want[diff])}`;
        })();
    if (problem !== null) {
      return refuse(
        "malformed_receipt",
        `the served wrapper's \`receipt\` member ${problem}. One body carrying two different receipts is not one receipt, and which copy a reader acts on is not this tool's to choose`,
        "wrapper_consistency",
      );
    }
    ann["wrapper_receipt"] = "equals the signed top-level members";
  }

  // 7. key_resolution ---------------------------------------------------------------
  const kid = s("public_key_id");
  const hits = reg.keys.filter((k) => k.key_id === kid);
  if (hits.length === 0) {
    return refuse("key_unresolvable", `public_key_id ${JSON.stringify(kid)} is not in the registry snapshot (it lists ${reg.keys.map((k) => k.key_id).join(", ") || "no keys"})`, "key_resolution");
  }
  if (new Set(hits.map((h) => String(h.public_key).toLowerCase())).size > 1) {
    return refuse("key_unresolvable", `public_key_id ${JSON.stringify(kid)} names ${hits.length} different keys in the snapshot; picking one would be guessing which the issuer meant`, "key_resolution");
  }
  const entry = hits[0]!;
  if (entry.algorithm !== "Ed25519") {
    return refuse("unsupported_algorithm", `registry entry ${kid} declares algorithm ${JSON.stringify(entry.algorithm)}; this format signs with Ed25519 only`, "key_resolution");
  }
  if (entry.format !== "hex" || typeof entry.public_key !== "string" || !KEY_HEX.test(entry.public_key)) {
    return refuse("malformed_member", `registry entry ${kid} does not carry a 64-character hex Ed25519 public key with format "hex"`, "key_resolution");
  }
  const x = Buffer.from(entry.public_key, "hex").toString("base64url");
  let key: KeyObject;
  try {
    key = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x }, format: "jwk" });
  } catch (e) {
    return refuse("malformed_member", `registry entry ${kid}: not an Ed25519 public key (${(e as Error).message})`, "key_resolution");
  }
  const resolved: ResolvedKey = {
    kid,
    thumbprint: rfc7638Thumbprint({ kty: "OKP", crv: "Ed25519", x }),
    alg: "EdDSA",
    origin: opts.registryOrigin ?? "(registry bytes)",
  };

  // 8. signature ---------------------------------------------------------------------
  // signPayload: keys sorted with JavaScript's default sort, JSON.stringify with
  // no whitespace, UTF-8. Built from the snapshot's field list and nothing else.
  const canonicalObj: Record<string, string> = {};
  for (const f of Object.keys(projection).sort()) canonicalObj[f] = projection[f]!;
  const canonical = Buffer.from(JSON.stringify(canonicalObj), "utf8");
  ann["signed_bytes_sha256"] = sha256Hex(canonical);
  const ok = cryptoVerify(null, canonical, key, Buffer.from(sig, "hex"));
  if (!ok) {
    return invalid(FORMAT, "signature_invalid", `Ed25519 signature does not verify over the ${list.length} members ${listName} names`, resolved, "signature", ann);
  }
  // From here on every value read is inside the signature. A refusal of a signed
  // value that breaks a rule the signer always keeps is a determinate negative
  // about these bytes, so it is INVALID and names the key it was checked under.
  const bad = (detail: string, stoppedAt: string): VerifyResult => invalid(FORMAT, "malformed_member", detail, resolved, stoppedAt, ann);

  // 9. schema_version ----------------------------------------------------------------
  if (kind !== "health" && s("schema_version") !== "v5.0") {
    return refuse(
      "format_unrecognized",
      `signed schema_version ${JSON.stringify(s("schema_version"))}: this adapter's rules are the v5.0 rules of worker ${WORKER_COMMIT.slice(0, 7)}, and under any other version the meaning of the signed members is unestablished. The signature verified; no claim is made either way`,
      "schema_version",
    );
  }

  // 10. signed_vocabulary --------------------------------------------------------------
  const issuedMs = parseIso(s("issued_at"));
  const expiresMs = parseIso(s("expires_at"));
  if (issuedMs === null) return bad(`signed issued_at ${JSON.stringify(s("issued_at"))} is not an ISO 8601 UTC instant`, "signed_vocabulary");
  if (expiresMs === null) return bad(`signed expires_at ${JSON.stringify(s("expires_at"))} is not an ISO 8601 UTC instant`, "signed_vocabulary");
  if (!UUID.test(s("receipt_id"))) return bad(`signed receipt_id ${JSON.stringify(s("receipt_id"))} is not a UUID`, "signed_vocabulary");
  if (s("issuer").length === 0) return bad("signed issuer is empty", "signed_vocabulary");
  if (kind === "health") {
    if (s("status") !== "OK" || s("source") !== "SYSTEM") return bad("a health receipt signs status OK and source SYSTEM", "signed_vocabulary");
  } else {
    if (!STATUSES.includes(s("status"))) return bad(`signed status ${JSON.stringify(s("status"))} is not one of ${STATUSES.join(", ")}`, "signed_vocabulary");
    if (!SOURCES.includes(s("source"))) return bad(`signed source ${JSON.stringify(s("source"))} is not one of ${SOURCES.join(", ")}`, "signed_vocabulary");
    if (!MIC.test(s("mic"))) return bad(`signed mic ${JSON.stringify(s("mic"))} is not a four-character ISO 10383 MIC`, "signed_vocabulary");
    if (!HALT_DETECTION.includes(s("halt_detection"))) return bad(`signed halt_detection ${JSON.stringify(s("halt_detection"))} is not active or schedule_only`, "signed_vocabulary");
    if (!RECEIPT_MODES.includes(s("receipt_mode"))) return bad(`signed receipt_mode ${JSON.stringify(s("receipt_mode"))} is not demo or live`, "signed_vocabulary");
  }
  ann["issuer"] = `${s("issuer")} (signed; that the registry supplied is this issuer's is not established here)`;
  ann["issued_at"] = s("issued_at");
  ann["expires_at"] = s("expires_at");

  // 11. ttl --------------------------------------------------------------------------
  // Founder ruling 2: a TTL other than 60 s under a valid signature is a receipt
  // the signer never emits. INVALID/malformed_member — the existing token for a
  // determinate self-inconsistency under a resolved key (insight's uid that is
  // not its own digest uses it the same way). No new reason code is needed.
  const ttl = expiresMs - issuedMs;
  ann["receipt_ttl_seconds"] = ttl / 1000;
  if (ttl !== RECEIPT_TTL_MS) {
    return bad(`expires_at - issued_at is ${ttl / 1000} s; the issuer signs every receipt with a TTL of exactly 60 s (RECEIPT_TTL_SECONDS), and a receipt claiming any other lifetime is not one it issued under these rules`, "ttl");
  }

  // 12. key_window -------------------------------------------------------------------
  const from = entry.valid_from;
  const until = entry.valid_until;
  const fromMs = from === undefined || from === null ? null : typeof from === "string" ? Date.parse(from) : NaN;
  const untilMs = until === undefined || until === null ? null : typeof until === "string" ? Date.parse(until) : NaN;
  if (Number.isNaN(fromMs) || Number.isNaN(untilMs)) {
    return refuse("malformed_member", `registry entry ${kid} carries a valid_from or valid_until that is present and unreadable; it is not read as open-ended`, "key_window");
  }
  ann["key_window"] = `${from ?? "open"} .. ${until ?? "open"}`;
  if ((fromMs !== null && issuedMs < fromMs) || (untilMs !== null && issuedMs > untilMs)) {
    return refuse(
      "signed_outside_key_window",
      `the receipt says it was issued at ${s("issued_at")}, outside its key's window ${from ?? "open"} .. ${until ?? "open"} in the snapshot. No --now changes that`,
      "key_window",
    );
  }

  if (kind === "health") {
    return freshness(opts, ann, resolved, unmet, issuedMs, expiresMs, "health receipt (status OK, source SYSTEM), signature verified, TTL 60 s");
  }

  // 13. coverage_encoding ---------------------------------------------------------------
  const rc = readCoverage(s("coverage"));
  if (!rc.ok) return bad(rc.detail, "coverage_encoding");
  const cov = rc.cov;
  const tier = cov.determination_tier;
  const status = s("status");
  const source = s("source");
  const mic = s("mic");
  ann["determination_tier"] = tier;
  ann["feed_state"] = cov.feed_state;

  // 14. tier_source ---------------------------------------------------------------------
  // buildSignedReceipt: Tier 0 answers from an override and signs source OVERRIDE
  // and a reason, with unknown_reason null whatever the override's status; Tier 1
  // signs getScheduleStatus's answer, which is OPEN/CLOSED from SCHEDULE or
  // UNKNOWN with exactly two (source, reason) pairs; Tier 2 signs UNKNOWN from
  // SYSTEM with DETERMINATION_ERROR.
  {
    let why: string | null = null;
    if (tier === 0) {
      if (source !== "OVERRIDE" || kind !== "override") why = "determination_tier 0 is an override answer, which the signer always signs as source OVERRIDE with a reason";
      else if (cov.unknown_reason !== null) why = "a Tier 0 receipt is signed with unknown_reason null, whatever status the override carries";
    } else if (source === "OVERRIDE") {
      why = `source OVERRIDE is signed only at determination_tier 0, and this one says ${tier}`;
    } else if (tier === 1) {
      if (status === "UNKNOWN") {
        const pair = `${source}/${String(cov.unknown_reason)}`;
        if (pair !== "SCHEDULE/UNSUPPORTED_MIC" && pair !== "SYSTEM/NO_HOLIDAY_DATA_FOR_YEAR") {
          why = `a Tier 1 UNKNOWN comes from getScheduleStatus as SCHEDULE/UNSUPPORTED_MIC or SYSTEM/NO_HOLIDAY_DATA_FOR_YEAR; this one signs ${pair}`;
        }
      } else if (status !== "OPEN" && status !== "CLOSED") {
        why = `the schedule answers OPEN, CLOSED or UNKNOWN; a Tier 1 ${status} is not an answer it gives`;
      } else if (source !== "SCHEDULE" || cov.unknown_reason !== null) {
        why = `a Tier 1 ${status} is signed as source SCHEDULE with unknown_reason null; this one signs ${source} and ${String(cov.unknown_reason)}`;
      }
    } else {
      if (source !== "SYSTEM" || status !== "UNKNOWN" || cov.unknown_reason !== "DETERMINATION_ERROR") {
        why = `Tier 2 is the signed fail-closed fallback: SYSTEM, UNKNOWN, DETERMINATION_ERROR; this one signs ${source}, ${status}, ${String(cov.unknown_reason)}`;
      }
    }
    if (why !== null) return bad(why, "tier_source");
  }

  // 15. halt_scope ----------------------------------------------------------------------
  const covers = cov.realtime_halt_feed_scope.includes(mic);
  if (s("halt_detection") !== (covers ? "active" : "schedule_only")) {
    return bad(`halt_detection is ${s("halt_detection")} while ${mic} is ${covers ? "" : "not "}in the signed realtime_halt_feed_scope; the signer derives both from one set`, "halt_scope");
  }
  if ((cov.feed_state === "not_covered") !== !covers) {
    return bad(`feed_state ${cov.feed_state} for ${mic}, which is ${covers ? "" : "not "}in realtime_halt_feed_scope; not_covered is signed exactly for a MIC outside it`, "halt_scope");
  }

  // 16. feed_freshness ------------------------------------------------------------------
  {
    const noRun = cov.feed_state === "absent" || cov.feed_state === "not_covered";
    if (noRun !== (cov.feed_last_run === null)) {
      return bad(
        noRun
          ? `feed_state ${cov.feed_state} cites no monitor run, yet feed_last_run is ${JSON.stringify(cov.feed_last_run)}`
          : `feed_state ${cov.feed_state} is read from a heartbeat, so feed_last_run must name its ran_at; it is null`,
        "feed_freshness",
      );
    }
    if (cov.feed_last_run !== null) {
      const ranMs = Date.parse(cov.feed_last_run);
      const age = issuedMs - ranMs;
      if (Number.isFinite(age)) ann["feed_age_seconds"] = age / 1000;
      if (cov.feed_state === "live" && !(Number.isFinite(age) && age <= FEED_FRESH_MS)) {
        return bad(
          Number.isFinite(age)
            ? `feed_state live with feed_last_run ${cov.feed_last_run}, ${age / 1000} s before issued_at; the signer calls a heartbeat live only when it is no older than 180 s`
            : `feed_state live with an unreadable feed_last_run; the signer reads an unparseable ran_at as stale, never live`,
          "feed_freshness",
        );
      }
      if (cov.feed_state === "stale" && Number.isFinite(age) && age <= FEED_FRESH_MS) {
        return bad(`feed_state stale with feed_last_run only ${age / 1000} s before issued_at; under the signer's rule an ok heartbeat that fresh is live`, "feed_freshness");
      }
    }
  }

  // 17. consulted_sets ------------------------------------------------------------------
  const live = cov.feed_state === "live";
  const withFeed = (t: 0 | 1, feed: boolean): { c: string[]; n: string[] } => {
    const c = t === 0 ? ["manual_override_kv"] : ["manual_override_kv", "schedule"];
    const n = t === 0 ? ["schedule"] : [];
    if (feed) c.push("realtime_halt_feed_via_override");
    else n.push("realtime_halt_feed");
    return { c: sorted(c), n: sorted(n) };
  };
  let allowed: { c: string[]; n: string[] }[];
  if (tier === 2) allowed = [{ c: [], n: ["manual_override_kv", "realtime_halt_feed", "schedule"] }];
  else if (tier === 1) allowed = [withFeed(1, covers && live)];
  else allowed = covers && !live ? [withFeed(0, true), withFeed(0, false)] : [withFeed(0, covers && live)];
  const matched = allowed.find((a) => sameArray(a.c, cov.consulted) && sameArray(a.n, cov.not_consulted));
  if (matched === undefined) {
    return bad(
      `consulted [${cov.consulted.join(", ")}] / not_consulted [${cov.not_consulted.join(", ")}] is not what the signer emits at determination_tier ${tier} ` +
        `with feed_state ${cov.feed_state} for a MIC ${covers ? "inside" : "outside"} the feed scope; expected ` +
        allowed.map((a) => `[${a.c.join(", ")}] / [${a.n.join(", ")}]`).join(" or "),
      "consulted_sets",
    );
  }
  const feedToken = cov.consulted.includes("realtime_halt_feed_via_override");

  // 18-21. reported_only -----------------------------------------------------------------
  ann["status_determination"] =
    tier === 0
      ? `not_recomputed: ${status} was answered by an override (Tier 0), not by the calendar; the override's content is the issuer's word`
      : tier === 2
        ? "not_recomputed: Tier 2, the signed fail-closed UNKNOWN; the determination threw at the issuer and nothing was determined"
        : `not_recomputed: whether ${status} is ${mic}'s calendar answer at ${s("issued_at")} needs the issuer's calendar, which these bytes do not carry`;
  ann["heartbeat_existence"] =
    cov.feed_last_run === null
      ? `none_cited (feed_state ${cov.feed_state})`
      : `cited_not_carried: the receipt cites a monitor run at ${cov.feed_last_run} (feed_state ${cov.feed_state}); the heartbeat is an unsigned value the issuer read, and it is not in these bytes`;
  ann["override_origin"] =
    tier !== 0
      ? `no_override (determination_tier ${tier})`
      : !covers
        ? "indeterminate: outside realtime_halt_feed_scope the feed token is never earned, whatever wrote the override"
        : live
          ? "indeterminate: with a live feed the signer gives the feed token to an operator override and a REALTIME one alike"
          : feedToken
            ? "consistent_only_with_realtime: on a non-live Tier 0 receipt the signer gives the feed token only to an override the halt monitor wrote; the origin itself is not signed"
            : "consistent_only_with_operator: on a non-live Tier 0 receipt a REALTIME override would have earned the feed token; the origin itself is not signed";
  ann["feed_scope_configuration"] = `signed scope ${cov.realtime_halt_feed_scope.join(",") || "(empty)"}; whether it is the scope the issuer's monitor actually runs is not in these bytes`;
  ann["issuer_status"] = `${status} (signed by the issuer at determination_tier ${tier}; UNKNOWN means CLOSED under the issuer's contract; not a decision by this tool)`;

  return freshness(
    opts,
    ann,
    resolved,
    unmet,
    issuedMs,
    expiresMs,
    `${kind} receipt ${mic} ${status} (determination_tier ${tier}), signature verified, TTL 60 s, every coverage member consistent with the signer's rules`,
  );
}

/**
 * 22. freshness. Founder ruling 1: expired iff now >= expires_at, strictly.
 * The clock tolerance is applied to one thing only, an issued_at later than now,
 * and never to expires_at: a tolerance that extended validity past the signed
 * expiry would make the verifier, not the issuer, decide how long a receipt
 * lives.
 */
function freshness(
  opts: VerifyOptions,
  ann: Ann,
  resolved: ResolvedKey,
  unmet: { id: string; condition: string }[] | undefined,
  issuedMs: number,
  expiresMs: number,
  okDetail: string,
): VerifyResult {
  const nowMs = (opts.now ?? Date.now() / 1000) * 1000;
  const tolMs = (opts.clockToleranceSec ?? DEFAULT_CLOCK_TOLERANCE_SEC) * 1000;
  ann["expiry_rule"] = "expired iff now >= expires_at; clock tolerance never extends validity past expires_at";
  if (nowMs >= expiresMs) {
    return unverifiable(
      FORMAT,
      "expired",
      `expires_at ${new Date(expiresMs).toISOString()} is not after the evaluation instant ${new Date(nowMs).toISOString()}. Strict: a receipt is ` +
        `expired at the instant now == expires_at, and --clock-tolerance does not move this. Naming an earlier --now can change the answer`,
      ann,
      "freshness",
      unmet,
    );
  }
  if (issuedMs > nowMs + tolMs) {
    return unverifiable(
      FORMAT,
      "not_yet_valid",
      `issued_at ${new Date(issuedMs).toISOString()} is more than the ${tolMs / 1000} s clock tolerance after the evaluation instant ${new Date(nowMs).toISOString()}`,
      ann,
      "freshness",
      unmet,
    );
  }
  return valid(FORMAT, okDetail, resolved, ann, unmet);
}

export const hoReceiptAdapter: Adapter = {
  format: FORMAT,
  detect,
  verify: verifyHo,
};
