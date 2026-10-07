// make-ho-fixtures.mjs — synthesize the ho.receipt/v5.0 fixtures no captured
// worker run provides: the Tier 1 UNKNOWN and Tier 2 receipts, the stale and
// failed feed states, and the tamper matrix.
//
// Run: node tools/make-ho-fixtures.mjs
//
// KEY CUSTODY. This script derives an Ed25519 keypair from a seed written in
// plain sight below — ASCII "test-throwaway-receipt-verify-04" — matching the
// convention in make-throwaway-fixtures.mjs and make-delivery-fixtures.mjs.
// Every file it writes carries `test-throwaway` in its name, and the key id it
// signs under carries it too. The private key is worthless by construction:
// anyone reading this repository can re-derive it. It is NOT a Headless Oracle
// production key and NOT the HO CI key (`key_test_v1`); no key belonging to any
// real signer is read, referenced, or required.
//
// WHY THIS SEED AND NOT THE HO CI KEY. This repository's convention is a
// published throwaway seed per generator with `test-throwaway` in every key id,
// so the custody statement above is true of every synthetic file here by
// inspection. The local worker run pinned under fixtures/ho/worker-d79bd18/ was
// started under THIS seed (ED25519_PRIVATE_KEY, ED25519_PUBLIC_KEY and
// PUBLIC_KEY_ID passed with --var), so the worker's bytes and this script's bytes
// verify under one key and the cross-check below can compare them signature for
// signature.
//
// HOW PAYLOADS ARE BUILT. Exactly as the worker's buildSignedReceipt does at
// d79bd181350d184218fbdc3aa925630c79fc535e (src/index.ts 11487-11600): the same
// member insertion order, coverage built by the rules of buildReceiptCoverage
// (1565) and serialised in coverageField's fixed member order (1641), signed by
// signPayload's rule (1879: keys sorted, JSON.stringify with no whitespace,
// Ed25519, lowercase hex), and served as `{...receipt, receipt, discovery_url}`.
// That transcription is checked, not trusted: the script rebuilds the worker's
// own XNYS receipt from its member values and refuses to write anything unless
// the signature it computes equals the one the worker returned, byte for byte.
// Ed25519 is deterministic, so equal signatures mean equal signed bytes.
//
// INDEPENDENCE. This file shares no code with src/adapters/ho-receipt.ts. The
// field lists, vocabularies and coverage rules are written out again here from
// the worker source, so the synthetic fixtures cannot verify against the adapter
// merely because both read the same constant.

import { createHash, createPrivateKey, createPublicKey, sign as cryptoSign } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(ROOT, "fixtures", "ho", "synthetic");
const WORKER = join(ROOT, "fixtures", "ho", "worker-d79bd18");

// Published throwaway seed — ASCII "test-throwaway-receipt-verify-04".
const SEED_HEX = "746573742d7468726f77617761792d726563656970742d7665726966792d3034";

const privateKey = createPrivateKey({
  key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.from(SEED_HEX, "hex")]),
  format: "der",
  type: "pkcs8",
});
const PUB_HEX = Buffer.from(createPublicKey(privateKey).export({ format: "jwk" }).x, "base64url").toString("hex");
const KEY_ID = "test-throwaway-ho-ed25519-" + createHash("sha256").update(PUB_HEX).digest("hex").slice(0, 8);

const ISSUER = "headlessoracle.com";
const DISCOVERY_URL = "https://headlessoracle.com/.well-known/mcp/server-card.json";
// HALT_DETECTION_ACTIVE, sorted (worker 1403, 1558).
const SCOPE = ["XNAS", "XNYS"];

// Fixed instants so the bytes regenerate identically.
const ISSUED = "2026-10-07T14:30:00.000Z";
const iso = (ms) => new Date(ms).toISOString();
const at = (base, deltaSec) => iso(Date.parse(base) + deltaSec * 1000);
const EXPIRES = at(ISSUED, 60); // RECEIPT_TTL_SECONDS = 60
const RAN_LIVE = at(ISSUED, -30); // 30 s before: live under the 180 s bound
const RAN_STALE = at(ISSUED, -300); // 300 s before: stale
const RAN_STALE_CLAIMED_LIVE = at(ISSUED, -200); // 200 s before, signed as live: the signer never does this

// ---------------------------------------------------------------- signer ----

function signPayload(payload) {
  const sorted = {};
  for (const k of Object.keys(payload).sort()) {
    if (typeof payload[k] !== "string") throw new Error(`signPayload: non-string value for field "${k}"`);
    sorted[k] = payload[k];
  }
  return cryptoSign(null, Buffer.from(JSON.stringify(sorted), "utf8"), privateKey).toString("hex");
}

/** buildReceiptCoverage, by its rules, from the feed state it would have read. */
function buildCoverage({ mic, tier, unknownReason = null, feedState, feedLastRun = null, overrideSource }) {
  const covers = SCOPE.includes(mic);
  const state = covers ? feedState : "not_covered";
  const lastRun = covers ? feedLastRun : null;
  const feedConsulted = covers && (state === "live" || (tier === 0 && overrideSource === "REALTIME"));
  let consulted, notConsulted;
  if (tier === 0) {
    consulted = ["manual_override_kv"];
    notConsulted = ["schedule"];
  } else if (tier === 1) {
    consulted = ["manual_override_kv", "schedule"];
    notConsulted = [];
  } else {
    consulted = [];
    notConsulted = ["manual_override_kv", "schedule"];
  }
  if (tier !== 2 && feedConsulted) consulted.push("realtime_halt_feed_via_override");
  else notConsulted.push("realtime_halt_feed");
  return {
    determination_tier: tier,
    consulted: consulted.slice().sort(),
    not_consulted: notConsulted.slice().sort(),
    realtime_halt_feed_scope: SCOPE,
    unknown_reason: unknownReason,
    feed_state: state,
    feed_last_run: lastRun,
  };
}

/** coverageField: compact JSON, members in this fixed order. */
const coverageField = (c) =>
  JSON.stringify({
    determination_tier: c.determination_tier,
    consulted: c.consulted,
    not_consulted: c.not_consulted,
    realtime_halt_feed_scope: c.realtime_halt_feed_scope,
    unknown_reason: c.unknown_reason,
    feed_state: c.feed_state,
    feed_last_run: c.feed_last_run,
  });

/**
 * A market or override receipt, members in buildSignedReceipt's insertion
 * order. `coverage` may be passed as a ready string to build a receipt whose
 * coverage the signer would never emit — that is how the signed-inconsistency
 * fixtures are made: the signature is good and the content breaks one rule.
 */
function marketReceipt({ mic, status, source, reason, coverage, receiptId, issued = ISSUED, expires = EXPIRES, mode = "demo", schema = "v5.0", keyId = KEY_ID }) {
  const p = {
    receipt_id: receiptId,
    issued_at: issued,
    expires_at: expires,
    issuer: ISSUER,
    mic,
    status,
    source,
  };
  if (reason !== undefined) p.reason = reason;
  p.halt_detection = SCOPE.includes(mic) ? "active" : "schedule_only";
  p.coverage = typeof coverage === "string" ? coverage : coverageField(coverage);
  p.receipt_mode = mode;
  p.schema_version = schema;
  p.public_key_id = keyId;
  return { ...p, signature: signPayload(p) };
}

/** The /v5/health payload (worker 14041), plus a few of the unsigned members it is served beside. */
function healthBody(receiptId) {
  const p = { receipt_id: receiptId, issued_at: ISSUED, expires_at: EXPIRES, issuer: ISSUER, status: "OK", source: "SYSTEM", public_key_id: KEY_ID };
  return { ...p, signature: signPayload(p), version: "v5.0", fail_closed: true, exchange_count: 28, discovery_url: DISCOVERY_URL };
}

const served = (r) => ({ ...r, receipt: r, discovery_url: DISCOVERY_URL });

// ------------------------------------------------------------- registry ----

// GET /v5/keys at d79bd18 (src/index.ts 13601-13633), transcribed again here.
const RECEIPT_FIELDS = ["coverage", "expires_at", "halt_detection", "issued_at", "issuer", "mic", "public_key_id", "receipt_id", "receipt_mode", "schema_version", "source", "status"];
const OVERRIDE_FIELDS = ["coverage", "expires_at", "halt_detection", "issued_at", "issuer", "mic", "public_key_id", "reason", "receipt_id", "receipt_mode", "schema_version", "source", "status"];
const HEALTH_FIELDS = ["expires_at", "issued_at", "issuer", "public_key_id", "receipt_id", "source", "status"];
const SAFE_TO_TRADE_FIELDS = ["cross_venue", "expires_at", "instrument", "issued_at", "issuer", "max_age", "public_key_id", "reasons", "receipt_id", "receipt_mode", "safe", "schema_version", "venue", "venue_source", "venue_status"];

function registry({ keys, receiptFields = RECEIPT_FIELDS, spec = true } = {}) {
  const doc = {
    keys: keys ?? [{ key_id: KEY_ID, algorithm: "Ed25519", format: "hex", public_key: PUB_HEX, valid_from: "2026-01-01T00:00:00Z", valid_until: null }],
  };
  if (spec) {
    doc.canonical_payload_spec = {
      description: "Keys sorted alphabetically, JSON.stringify with no whitespace, UTF-8 encoded.",
      receipt_fields: receiptFields,
      override_fields: OVERRIDE_FIELDS,
      health_fields: HEALTH_FIELDS,
      safe_to_trade_fields: SAFE_TO_TRADE_FIELDS,
    };
  }
  return doc;
}

// ------------------------------------------------------------- the check ----

// Rebuild the worker's own XNYS Tier 1 receipt from its member values and
// refuse to go on unless the signature is the worker's, byte for byte. The
// coverage string is REBUILT from (mic, tier, feed state, ran_at), not copied.
const workerXnys = JSON.parse(readFileSync(join(WORKER, "demo-XNYS-tier1-live.test-throwaway.json"), "utf8"));
{
  const wc = JSON.parse(workerXnys.coverage);
  const rebuilt = marketReceipt({
    mic: workerXnys.mic,
    status: workerXnys.status,
    source: workerXnys.source,
    tier: wc.determination_tier,
    coverage: buildCoverage({ mic: workerXnys.mic, tier: 1, feedState: wc.feed_state, feedLastRun: wc.feed_last_run }),
    receiptId: workerXnys.receipt_id,
    issued: workerXnys.issued_at,
    expires: workerXnys.expires_at,
    mode: workerXnys.receipt_mode,
  });
  if (workerXnys.public_key_id !== KEY_ID) throw new Error(`worker capture was signed under ${workerXnys.public_key_id}, not ${KEY_ID}`);
  if (rebuilt.coverage !== workerXnys.coverage) throw new Error("coverage rebuilt here differs from the worker's: the transcription of buildReceiptCoverage/coverageField is wrong");
  if (rebuilt.signature !== workerXnys.signature) throw new Error("signature rebuilt here differs from the worker's: the transcription of buildSignedReceipt/signPayload is wrong");
}

// ------------------------------------------------------------- fixtures ----

const written = [];
function write(name, data) {
  const path = join(OUT, `${name}.test-throwaway.json`);
  mkdirSync(dirname(path), { recursive: true });
  // Compact, no trailing newline: the wire form the worker's json() helper serves.
  writeFileSync(path, typeof data === "string" ? data : JSON.stringify(data));
  written.push(path);
}

// Deterministic receipt ids, one per fixture, in UUID form.
let n = 0;
const rid = () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;

// --- registries
write("registry", registry());
write("registry-no-spec", registry({ spec: false }));
write("registry-pre-coverage", registry({ receiptFields: RECEIPT_FIELDS.filter((f) => f !== "coverage") }));
write("registry-key-window-closed", registry({ keys: [{ key_id: KEY_ID, algorithm: "Ed25519", format: "hex", public_key: PUB_HEX, valid_from: "2026-01-01T00:00:00Z", valid_until: "2026-10-01T00:00:00Z" }] }));
write("registry-duplicate-key-id", registry({ keys: [
  { key_id: KEY_ID, algorithm: "Ed25519", format: "hex", public_key: PUB_HEX, valid_from: "2026-01-01T00:00:00Z", valid_until: null },
  { key_id: KEY_ID, algorithm: "Ed25519", format: "hex", public_key: "11".repeat(32), valid_from: "2026-01-01T00:00:00Z", valid_until: null },
] }));
// A JWK Set that DOES carry the right key, under its RFC 7638 thumbprint as the
// issuer's /.well-known/jwks.json publishes it. Passed with --jwks and no
// --registry it must still be refused (ruling 3): the receipt cannot name it.
{
  const x = Buffer.from(PUB_HEX, "hex").toString("base64url");
  const tp = createHash("sha256").update(JSON.stringify({ crv: "Ed25519", kty: "OKP", x })).digest("base64url");
  write("jwks", { keys: [{ kty: "OKP", crv: "Ed25519", x, kid: tp, use: "sig", alg: "EdDSA", key_ops: ["verify"] }] });
}

// --- receipts the signer emits (all VALID at ISSUED + 1 s)
const t1Live = marketReceipt({ mic: "XNYS", status: "OPEN", source: "SCHEDULE", tier: 1, coverage: buildCoverage({ mic: "XNYS", tier: 1, feedState: "live", feedLastRun: RAN_LIVE }), receiptId: rid() });
write("tier1-XNYS-open-live", served(t1Live));
const t1Xlon = marketReceipt({ mic: "XLON", status: "CLOSED", source: "SCHEDULE", tier: 1, coverage: buildCoverage({ mic: "XLON", tier: 1 }), receiptId: rid(), mode: "live" });
write("tier1-XLON-closed-not-covered-bare", t1Xlon);
write("tier1-XJPX-unknown-no-holiday-data", served(marketReceipt({ mic: "XJPX", status: "UNKNOWN", source: "SYSTEM", tier: 1, coverage: buildCoverage({ mic: "XJPX", tier: 1, unknownReason: "NO_HOLIDAY_DATA_FOR_YEAR" }), receiptId: rid() })));
write("tier1-XZZZ-unknown-unsupported-mic", served(marketReceipt({ mic: "XZZZ", status: "UNKNOWN", source: "SCHEDULE", tier: 1, coverage: buildCoverage({ mic: "XZZZ", tier: 1, unknownReason: "UNSUPPORTED_MIC" }), receiptId: rid() })));
write("tier0-XNYS-operator-stale", served(marketReceipt({ mic: "XNYS", status: "HALTED", source: "OVERRIDE", reason: "test-throwaway: operator circuit breaker", tier: 0, coverage: buildCoverage({ mic: "XNYS", tier: 0, feedState: "stale", feedLastRun: RAN_STALE, overrideSource: "OVERRIDE" }), receiptId: rid() })));
write("tier0-XNAS-realtime-failed", served(marketReceipt({ mic: "XNAS", status: "HALTED", source: "OVERRIDE", reason: "test-throwaway: REALTIME halt", tier: 0, coverage: buildCoverage({ mic: "XNAS", tier: 0, feedState: "failed", feedLastRun: RAN_LIVE, overrideSource: "REALTIME" }), receiptId: rid() })));
write("tier2-XNYS-determination-error", served(marketReceipt({ mic: "XNYS", status: "UNKNOWN", source: "SYSTEM", tier: 2, coverage: buildCoverage({ mic: "XNYS", tier: 2, unknownReason: "DETERMINATION_ERROR", feedState: "live", feedLastRun: RAN_LIVE }), receiptId: rid() })));
write("health", healthBody(rid()));

// --- the unsigned Tier 3 body, as buildSignedReceipt returns it and the route wraps it
{
  const t3 = { error: "CRITICAL_FAILURE", message: "Oracle signature system offline. Treat as UNKNOWN. Halt all execution.", status: "UNKNOWN", source: "SYSTEM" };
  write("tier3-critical-failure-unsigned", { ...t3, receipt: t3, discovery_url: DISCOVERY_URL });
}

// --- tampered after signing (the signature no longer covers what is shown)
{
  const flipped = t1Live.signature.slice(0, 10) + (t1Live.signature[10] === "0" ? "1" : "0") + t1Live.signature.slice(11);
  const r = { ...t1Live, signature: flipped };
  write("tamper-signature-one-nibble", served(r));
}
{
  const edited = t1Live.coverage.replace('"feed_state":"live"', '"feed_state":"stale"');
  const r = { ...t1Live, coverage: edited };
  write("tamper-coverage-member-after-signing", served(r));
}
{
  // The top level says CLOSED; the inner receipt still carries the signed OPEN.
  write("tamper-wrapper-copy-disagrees", { ...served(t1Live), status: "CLOSED" });
}
{
  // Unsigned members added beside a good receipt. They are reported, and they
  // never move the verdict: the field list says what is signed.
  write("wrapper-extra-unsigned-members", { ...served(t1Live), trading_advice: "OPEN: safe to trade", verified_by: "anyone" });
}
write("tamper-signature-uppercase-hex", served({ ...t1Live, signature: t1Live.signature.toUpperCase() }));
write("tamper-duplicate-member", JSON.stringify(t1Live).replace('"status":"OPEN"', '"status":"CLOSED","status":"OPEN"'));
{
  const { issued_at, ...rest } = t1Live;
  void issued_at;
  write("tamper-signed-member-not-a-string", { ...rest, issued_at: Date.parse(ISSUED) / 1000 });
}

// --- signed, and inconsistent: the signer never emits these
const liveCov = () => buildCoverage({ mic: "XNYS", tier: 1, feedState: "live", feedLastRun: RAN_LIVE });
const signedWith = (name, opts) => write(name, served(marketReceipt({ mic: "XNYS", status: "OPEN", source: "SCHEDULE", tier: 1, coverage: liveCov(), receiptId: rid(), ...opts })));
signedWith("signed-ttl-61s", { expires: at(ISSUED, 61) });
signedWith("signed-ttl-300s", { expires: at(ISSUED, 300) });
signedWith("signed-schema-v5.1", { schema: "v5.1" });
signedWith("signed-key-not-in-registry", { keyId: "test-throwaway-ho-unlisted" });
signedWith("signed-stale-but-claimed-live", { coverage: { ...liveCov(), feed_last_run: RAN_STALE_CLAIMED_LIVE } });
// One per coverage member. Each breaks exactly one rule, and the rule it breaks
// is one of the checks COVERAGE_MEMBER_CHECKS maps that member to.
signedWith("signed-coverage-determination_tier", { coverage: { ...liveCov(), determination_tier: 2 } });
signedWith("signed-coverage-consulted", { coverage: { ...liveCov(), consulted: ["manual_override_kv", "realtime_halt_feed_via_override"] } });
write("signed-coverage-not_consulted", served(marketReceipt({ mic: "XLON", status: "CLOSED", source: "SCHEDULE", tier: 1, coverage: { ...buildCoverage({ mic: "XLON", tier: 1 }), not_consulted: [] }, receiptId: rid() })));
signedWith("signed-coverage-realtime_halt_feed_scope", { coverage: { ...liveCov(), realtime_halt_feed_scope: ["XNAS"] } });
signedWith("signed-coverage-unknown_reason", { coverage: { ...liveCov(), unknown_reason: "NO_HOLIDAY_DATA_FOR_YEAR" } });
write("signed-coverage-feed_state", served(marketReceipt({ mic: "XLON", status: "CLOSED", source: "SCHEDULE", tier: 1, coverage: { ...buildCoverage({ mic: "XLON", tier: 1 }), feed_state: "absent" }, receiptId: rid() })));
write("signed-coverage-feed_last_run", served(marketReceipt({ mic: "XLON", status: "CLOSED", source: "SCHEDULE", tier: 1, coverage: { ...buildCoverage({ mic: "XLON", tier: 1 }), feed_last_run: RAN_LIVE }, receiptId: rid() })));
{
  // The members right, the bytes not coverageField's: one space after a colon.
  const c = coverageField(liveCov()).replace('"determination_tier":1', '"determination_tier": 1');
  signedWith("signed-coverage-encoding-whitespace", { coverage: c });
}

// --- out of scope: a safe-to-trade receipt (ruling 4). Signed over its own list.
{
  const p = {
    receipt_id: rid(), issued_at: ISSUED, expires_at: EXPIRES, issuer: ISSUER, instrument: "AAPL", venue: "XNAS", venue_status: "OPEN",
    venue_source: "SCHEDULE", safe: "true", max_age: "60", cross_venue: "[]", reasons: "[]", receipt_mode: "live", schema_version: "v5.0", public_key_id: KEY_ID,
  };
  write("out-of-scope-safe-to-trade", { ...p, signature: signPayload(p) });
}

console.log(`key ${KEY_ID} (public ${PUB_HEX}); worker cross-check passed; wrote ${written.length} files under fixtures/ho/synthetic/`);
for (const p of written) console.log(`  ${createHash("sha256").update(readFileSync(p)).digest("hex")}  ${p.slice(ROOT.length + 1)}`);
