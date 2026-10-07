// ho.receipt/v5.0 — Headless Oracle signed market-state receipts.
//
// INTERESTS. The author of this repository builds Headless Oracle. This file is
// the HO author's tool grading HO's own format, and nothing here claims
// independence. What it claims is that every verdict below recomputes from the
// fixture bytes, and that every check can be shown to go red.
//
// The falsifiability statement this file owes. Every check the adapter declares
// is exercised twice: once over receipts the signer emits, where it must pass,
// and once over a receipt that breaks exactly that check, where it must produce
// a named verdict, a named reason and a named stop point. Two families of input:
//
//   * fixtures/ho/worker-d79bd18/ — responses of the Headless Oracle worker at
//     d79bd181 itself, run locally under the throwaway test key. These are the
//     signer's own bytes, so a pass on them cannot be a pass on a misreading of
//     the signer that the generator shares with the adapter.
//   * fixtures/ho/synthetic/ — tools/make-ho-fixtures.mjs, which builds every
//     receipt as buildSignedReceipt does with code that shares nothing with the
//     adapter, and refuses to write unless it reproduces a worker signature byte
//     for byte.
//
// Every key here is the THROWAWAY key test-throwaway-ho-ed25519-39d969ad (seed
// published in the generator). Not production, and not the HO CI key.
//
// Founder rulings of 2026-10-07 each have their own describe block, so the
// ruling a test enforces is legible from the file alone.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import {
  COVERAGE_MEMBER_CHECKS,
  COVERAGE_MEMBERS,
  FORMAT,
  RECEIPT_TTL_MS,
  WORKER_COMMIT,
  WORKER_FIELD_LISTS,
  detect,
  hoReceiptAdapter,
} from "../src/adapters/ho-receipt.js";
import { ADAPTERS, adapterByFormat, detectFormat, FORMAT_NAMES } from "../src/detect.js";
import { checksNotEvaluated, coverageFor } from "../src/coverage.js";
import { formatResult, jsonResult } from "../src/verdict.js";
import { run } from "../src/cli.js";
import type { VerifyOptions, VerifyResult } from "../src/types.js";
import { FIX, ROOT, sha256Hex } from "./helpers.js";

const HO = join(FIX, "ho");
const WORKER = join(HO, "worker-d79bd18");
const SYN = join(HO, "synthetic");
const w = (name: string): string => join(WORKER, `${name}.test-throwaway.json`);
const s = (name: string): string => join(SYN, `${name}.test-throwaway.json`);

const WORKER_REGISTRY = w("keys");
const REGISTRY = s("registry");
const KEY_ID = "test-throwaway-ho-ed25519-39d969ad";

/** One second after the synthetic set's issued_at (2026-10-07T14:30:00.000Z). */
const SYN_NOW = Date.parse("2026-10-07T14:30:00.000Z") / 1000 + 1;

type Doc = Record<string, unknown>;
const load = (p: string): Doc => JSON.parse(readFileSync(p, "utf8")) as Doc;
const issuedSec = (p: string): number => Date.parse(load(p)["issued_at"] as string) / 1000;
const expiresSec = (p: string): number => Date.parse(load(p)["expires_at"] as string) / 1000;

/** Verify a fixture file, reading the registry snapshot as bytes the way the CLI does. */
function verify(file: string, opts: VerifyOptions & { registryPath?: string | null } = {}): Promise<VerifyResult> {
  const registryPath = opts.registryPath === undefined ? (file.startsWith(WORKER) ? WORKER_REGISTRY : REGISTRY) : opts.registryPath;
  const o: VerifyOptions = { ...opts };
  delete (o as { registryPath?: unknown }).registryPath;
  if (registryPath !== null) {
    o.registry = readFileSync(registryPath);
    o.registryOrigin = registryPath;
  }
  if (o.now === undefined) o.now = file.startsWith(WORKER) ? issuedSec(file) + 1 : SYN_NOW;
  return hoReceiptAdapter.verify(readFileSync(file), o);
}

const vr = (r: VerifyResult): string => `${r.verdict}/${r.reason}`;
const ann = (r: VerifyResult, k: string): string => String(r.annotations?.[k] ?? "(absent)");

const WORKER_SIGNED = [
  "demo-XNYS-tier1-live",
  "demo-XNAS-tier0-realtime-live",
  "demo-XLON-tier1-not-covered",
  "status-XJPX-tier1-trial",
  "health",
  "demo-XNYS-tier0-operator-absent",
  "demo-XNAS-tier0-realtime-absent",
];
const WORKER_MARKET = WORKER_SIGNED.filter((n) => n !== "health");

const SYN_VALID_MARKET = [
  "tier1-XNYS-open-live",
  "tier1-XLON-closed-not-covered-bare",
  "tier1-XJPX-unknown-no-holiday-data",
  "tier1-XZZZ-unknown-unsupported-mic",
  "tier0-XNYS-operator-stale",
  "tier0-XNAS-realtime-failed",
  "tier2-XNYS-determination-error",
];

// ---------------------------------------------------------------------------
// the signer's own bytes
// ---------------------------------------------------------------------------

describe(`ho.receipt/v5.0 — the worker's own receipts (worker ${WORKER_COMMIT.slice(0, 7)}, throwaway test key)`, () => {
  it.each(WORKER_SIGNED)("%s is VALID under the snapshot the same run served", async (name) => {
    const r = await verify(w(name));
    expect(vr(r), r.detail).toBe("VALID/verified");
    expect(r.resolvedKey?.kid).toBe(KEY_ID);
    expect(r.resolvedKey?.alg).toBe("EdDSA");
  });

  it("the worker's Tier 3 body is refused as unsigned, names no key, and says to treat it as UNKNOWN", async () => {
    const r = await verify(w("demo-XNYS-tier3-unsigned"));
    expect(vr(r)).toBe("UNVERIFIABLE/malformed_receipt");
    expect(r.stoppedAt).toBe("signed_body");
    expect(r.resolvedKey).toBeUndefined();
    expect(r.detail).toContain("treat the status as UNKNOWN, which means CLOSED");
  });

  it("the adapter's pinned field lists are the ones the worker served, and the synthetic registry carries the same", () => {
    for (const reg of [WORKER_REGISTRY, REGISTRY]) {
      const spec = load(reg)["canonical_payload_spec"] as Record<string, string[]>;
      for (const name of Object.keys(WORKER_FIELD_LISTS) as (keyof typeof WORKER_FIELD_LISTS)[]) {
        expect(spec[name], `${reg}: ${name}`).toEqual([...WORKER_FIELD_LISTS[name]]);
      }
      expect((load(reg)["keys"] as Doc[])[0]!["key_id"]).toBe(KEY_ID);
    }
  });

  it("the generator's Tier 3 body is byte-identical to the worker's", () => {
    expect(sha256Hex(readFileSync(s("tier3-critical-failure-unsigned")))).toBe(sha256Hex(readFileSync(w("demo-XNYS-tier3-unsigned"))));
  });

  it("override_origin reads the two worker Tier 0 receipts the way the signer's rule says, and declines to on the live one", async () => {
    expect(ann(await verify(w("demo-XNYS-tier0-operator-absent")), "override_origin")).toMatch(/^consistent_only_with_operator/);
    expect(ann(await verify(w("demo-XNAS-tier0-realtime-absent")), "override_origin")).toMatch(/^consistent_only_with_realtime/);
    expect(ann(await verify(w("demo-XNAS-tier0-realtime-live")), "override_origin")).toMatch(/^indeterminate/);
    expect(ann(await verify(w("demo-XNYS-tier1-live")), "override_origin")).toBe("no_override (determination_tier 1)");
  });
});

// ---------------------------------------------------------------------------
// founder ruling 5: the "0 unaddressed coverage items" line, run
// ---------------------------------------------------------------------------

describe("ho.receipt/v5.0 — ruling 5: 0 unaddressed coverage items (LOCKED)", () => {
  // Locked deliberately, as the other formats' declared gaps are in
  // test/coverage.test.ts. Adding a `not_implemented` row to this format means
  // editing this assertion in the same commit, and saying why.
  it("the manifest declares no not_implemented check", () => {
    const cov = coverageFor(FORMAT);
    expect(cov, "no coverage manifest for ho.receipt/v5.0").toBeDefined();
    expect(cov!.checks.filter((c) => c.status === "not_implemented").map((c) => c.id)).toEqual([]);
  });

  it("on every VALID market receipt, worker and synthetic, the coverage block lists 0 items not evaluated", async () => {
    const files = [...WORKER_MARKET.map(w), ...SYN_VALID_MARKET.map(s)];
    for (const f of files) {
      const r = await verify(f);
      expect(vr(r), f).toBe("VALID/verified");
      const j = JSON.parse(jsonResult(r)) as { coverage: { stopped_at: string | null; checks_not_evaluated: unknown[] } };
      expect(j.coverage.stopped_at, f).toBeNull();
      expect(j.coverage.checks_not_evaluated, `${relative(ROOT, f)}: unaddressed coverage items`).toEqual([]);
    }
  });

  it("the coverage members, read from the WORKER's signed bytes rather than from the adapter, are exactly the ones the check table maps", () => {
    for (const name of WORKER_MARKET) {
      const fromWorker = Object.keys(JSON.parse(load(w(name))["coverage"] as string) as Doc);
      expect(fromWorker, name).toEqual([...COVERAGE_MEMBERS]);
    }
    expect(Object.keys(COVERAGE_MEMBER_CHECKS)).toEqual([...COVERAGE_MEMBERS]);
  });

  it("every coverage member is examined by at least one declared check that can move the verdict", () => {
    const rows = new Map(coverageFor(FORMAT)!.checks.map((c) => [c.id, c]));
    for (const m of COVERAGE_MEMBERS) {
      const ids = COVERAGE_MEMBER_CHECKS[m];
      expect(ids.length, `${m} is examined by nothing`).toBeGreaterThan(0);
      for (const id of ids) {
        expect(rows.has(id), `${m} maps to ${id}, which the manifest does not declare`).toBe(true);
        expect(["implemented", "conditional"], `${m} -> ${id} cannot move a verdict`).toContain(rows.get(id)!.status);
      }
    }
  });

  // The behavioural half: a receipt whose signature is GOOD and whose one member
  // breaks the signer's rule is refused, at a check that member maps to. A table
  // that named a check which never fires for its member would pass the test
  // above and fail this one.
  it.each(COVERAGE_MEMBERS.map((m) => [m]))("a signed receipt inconsistent in `%s` is INVALID at a check that examines it", async (m) => {
    const r = await verify(s(`signed-coverage-${m}`));
    expect(vr(r), r.detail).toBe("INVALID/malformed_member");
    expect(r.resolvedKey?.kid, "the signature verified, so the refusal names the key").toBe(KEY_ID);
    expect(COVERAGE_MEMBER_CHECKS[m]).toContain(r.stoppedAt);
  });

  it("the encoding itself is checked byte for byte: right members, one extra space, INVALID", async () => {
    const r = await verify(s("signed-coverage-encoding-whitespace"));
    expect(vr(r)).toBe("INVALID/malformed_member");
    expect(r.stoppedAt).toBe("coverage_encoding");
  });

  it("the four things the bytes cannot establish, and the registry's provenance, are reported_only rows reported on a VALID result", async () => {
    const reported = coverageFor(FORMAT)!.checks.filter((c) => c.status === "reported_only").map((c) => c.id);
    expect(reported.sort()).toEqual(["feed_scope_configuration", "heartbeat_existence", "override_origin", "registry_provenance", "status_determination"]);
    const r = await verify(s("tier1-XNYS-open-live"));
    for (const id of reported) expect(ann(r, id), id).not.toBe("(absent)");
    expect(ann(r, "status_determination")).toMatch(/^not_recomputed/);
    expect(ann(r, "heartbeat_existence")).toMatch(/^cited_not_carried/);
    expect(ann(r, "registry_provenance")).toMatch(/^caller_supplied/);
  });
});

// ---------------------------------------------------------------------------
// founder ruling 1: expiry
// ---------------------------------------------------------------------------

describe("ho.receipt/v5.0 — ruling 1: a receipt is expired iff now >= expires_at", () => {
  const f = s("tier1-XNYS-open-live");
  const exp = expiresSec(f);

  it("one millisecond before expires_at it is VALID", async () => {
    expect(vr(await verify(f, { now: exp - 0.001 }))).toBe("VALID/verified");
  });

  it("at exactly expires_at it is expired", async () => {
    const r = await verify(f, { now: exp });
    expect(vr(r)).toBe("UNVERIFIABLE/expired");
    expect(r.stoppedAt).toBe("freshness");
    expect(r.resolvedKey).toBeUndefined();
    expect(r.detail).toContain("now == expires_at");
  });

  it("clock tolerance never extends validity past expires_at", async () => {
    expect(vr(await verify(f, { now: exp, clockToleranceSec: 3600 }))).toBe("UNVERIFIABLE/expired");
    expect(vr(await verify(f, { now: exp + 1, clockToleranceSec: 3600 }))).toBe("UNVERIFIABLE/expired");
  });

  it("clock tolerance applies only to an issued_at in the future", async () => {
    const iss = issuedSec(f);
    expect(vr(await verify(f, { now: iss - 30 }))).toBe("VALID/verified"); // inside the default 60 s
    expect(vr(await verify(f, { now: iss - 61 }))).toBe("UNVERIFIABLE/not_yet_valid");
    expect(vr(await verify(f, { now: iss - 61, clockToleranceSec: 120 }))).toBe("VALID/verified");
  });

  it("freshness is evaluated last, so an expired receipt still reports every content check it passed", async () => {
    const r = await verify(f, { now: exp + 3600 });
    expect(vr(r)).toBe("UNVERIFIABLE/expired");
    expect(checksNotEvaluated(r.format, r.stoppedAt, r.conditionsUnmet)).toEqual([]);
    expect(ann(r, "override_origin")).toBe("no_override (determination_tier 1)");
    expect(ann(r, "expiry_rule")).toContain("clock tolerance never extends validity past expires_at");
  });
});

// ---------------------------------------------------------------------------
// founder ruling 2: TTL
// ---------------------------------------------------------------------------

describe("ho.receipt/v5.0 — ruling 2: expires_at - issued_at must be 60 s under a valid signature", () => {
  it("the adapter's TTL is the worker's RECEIPT_TTL_SECONDS, and every worker receipt carries it", () => {
    expect(RECEIPT_TTL_MS).toBe(60_000);
    for (const n of WORKER_SIGNED) expect(expiresSec(w(n)) - issuedSec(w(n)), n).toBe(60);
  });

  it("61 s is INVALID/malformed_member at ttl, under the key it was checked against", async () => {
    const r = await verify(s("signed-ttl-61s"));
    expect(vr(r)).toBe("INVALID/malformed_member");
    expect(r.stoppedAt).toBe("ttl");
    expect(r.resolvedKey?.kid).toBe(KEY_ID);
    // The existing label for a determinate self-inconsistency: no reason code was added.
    expect(formatResult(r).split("\n")[0]).toMatch(/^INVALID — self-inconsistent:/);
  });

  it("300 s, the ceiling the issuer's spec allows other operators, is still INVALID for HO's own format", async () => {
    const r = await verify(s("signed-ttl-300s"));
    expect(vr(r)).toBe("INVALID/malformed_member");
    expect(r.stoppedAt).toBe("ttl");
  });
});

// ---------------------------------------------------------------------------
// founder ruling 3: --jwks alone
// ---------------------------------------------------------------------------

describe("ho.receipt/v5.0 — ruling 3: --jwks alone is refused, never answered by trying every key", () => {
  it("a JWKS that DOES hold the right key, under its RFC 7638 thumbprint, is still key_unresolvable without a registry", async () => {
    const r = await verify(s("tier1-XNYS-open-live"), { registryPath: null, jwks: s("jwks") });
    expect(vr(r)).toBe("UNVERIFIABLE/key_unresolvable");
    expect(r.stoppedAt).toBe("registry_snapshot");
    expect(r.resolvedKey).toBeUndefined();
    expect(r.detail).toContain("trying every key in the set");
    expect(ann(r, "jwks_without_registry")).toBe("refused");
  });

  it("with neither, the receipt is key_unresolvable and says what to supply", async () => {
    const r = await verify(s("tier1-XNYS-open-live"), { registryPath: null });
    expect(vr(r)).toBe("UNVERIFIABLE/key_unresolvable");
    expect(r.detail).toContain("--registry");
  });

  it("with both, the key resolves from the registry and the JWKS is reported as not consulted", async () => {
    const r = await verify(s("tier1-XNYS-open-live"), { jwks: s("jwks") });
    expect(vr(r)).toBe("VALID/verified");
    expect(ann(r, "jwks_ignored")).toContain("not consulted");
  });

  it("end to end through the CLI: exit 1, key_unresolvable", async () => {
    const { result, exitCode } = await run([s("tier1-XNYS-open-live"), "--format", "ho", "--jwks", s("jwks"), "--now", String(SYN_NOW)]);
    expect(result?.reason).toBe("key_unresolvable");
    expect(exitCode).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// founder ruling 4: scope
// ---------------------------------------------------------------------------

describe("ho.receipt/v5.0 — ruling 4: market and health receipts; safe-to-trade is out of scope", () => {
  it("a safe-to-trade receipt is not detected, and under --format is refused before anything is evaluated", async () => {
    expect(detect(readFileSync(s("out-of-scope-safe-to-trade")))).toBe(false);
    const r = await verify(s("out-of-scope-safe-to-trade"));
    expect(vr(r)).toBe("UNVERIFIABLE/format_unrecognized");
    expect(r.stoppedAt).toBe("signed_body");
    expect(r.detail).toContain("out of scope");
  });

  it("a health receipt is VALID and its market-only checks are condition_unmet, never not_implemented", async () => {
    const r = await verify(s("health"));
    expect(vr(r)).toBe("VALID/verified");
    const rows = checksNotEvaluated(r.format, r.stoppedAt, r.conditionsUnmet);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((c) => c.reason === "condition_unmet"), JSON.stringify(rows)).toBe(true);
    expect(rows.map((c) => c.id)).toContain("coverage_encoding");
    expect(rows[0]!.condition).toContain("health receipt");
  });
});

// ---------------------------------------------------------------------------
// the tamper matrix
// ---------------------------------------------------------------------------

describe("ho.receipt/v5.0 — tampering", () => {
  it("one nibble of the signature: INVALID/signature_invalid under the resolved key", async () => {
    const r = await verify(s("tamper-signature-one-nibble"));
    expect(vr(r)).toBe("INVALID/signature_invalid");
    expect(r.stoppedAt).toBe("signature");
    expect(r.resolvedKey?.kid).toBe(KEY_ID);
  });

  it("a coverage member edited after signing (live -> stale, in both copies): INVALID/signature_invalid", async () => {
    const r = await verify(s("tamper-coverage-member-after-signing"));
    expect(vr(r)).toBe("INVALID/signature_invalid");
  });

  it("stale but signed as live: INVALID/malformed_member at feed_freshness, with the age named", async () => {
    const r = await verify(s("signed-stale-but-claimed-live"));
    expect(vr(r)).toBe("INVALID/malformed_member");
    expect(r.stoppedAt).toBe("feed_freshness");
    expect(r.detail).toContain("200 s before issued_at");
  });

  it("the wrapper's top level says CLOSED while its inner receipt says OPEN: two receipts, refused", async () => {
    const r = await verify(s("tamper-wrapper-copy-disagrees"));
    expect(vr(r)).toBe("UNVERIFIABLE/malformed_receipt");
    expect(r.stoppedAt).toBe("wrapper_consistency");
    expect(r.detail).toContain("`status`");
  });

  it("extra unsigned wrapper members are listed and never move the verdict", async () => {
    const r = await verify(s("wrapper-extra-unsigned-members"));
    expect(vr(r)).toBe("VALID/verified");
    expect(ann(r, "unsigned_members")).toBe("discovery_url,receipt,trading_advice,verified_by");
  });

  it("canonicalisation follows the field list, not a drop list: the health body's dozen unsigned members are named and it verifies", async () => {
    const r = await verify(w("health"));
    expect(vr(r)).toBe("VALID/verified");
    for (const m of ["version", "exchange_count", "halt_monitor", "supported_mics", "discovery_url"]) expect(ann(r, "unsigned_members")).toContain(m);
  });

  it("an uppercase signature is not what signPayload emits: UNVERIFIABLE/malformed_member before any key is touched", async () => {
    const r = await verify(s("tamper-signature-uppercase-hex"));
    expect(vr(r)).toBe("UNVERIFIABLE/malformed_member");
    expect(r.stoppedAt).toBe("signed_body");
  });

  it("a repeated member is refused at parse, before JSON.parse can pick one", async () => {
    const r = await verify(s("tamper-duplicate-member"));
    expect(vr(r)).toBe("UNVERIFIABLE/malformed_receipt");
    expect(r.stoppedAt).toBe("parse");
  });

  it("a signed member that is not a string is refused at receipt_kind: signPayload signs strings only", async () => {
    const r = await verify(s("tamper-signed-member-not-a-string"));
    expect(vr(r)).toBe("UNVERIFIABLE/malformed_member");
    expect(r.stoppedAt).toBe("receipt_kind");
  });

  it("a signed schema_version other than v5.0 is UNVERIFIABLE after the signature verifies, and names no key", async () => {
    const r = await verify(s("signed-schema-v5.1"));
    expect(vr(r)).toBe("UNVERIFIABLE/format_unrecognized");
    expect(r.stoppedAt).toBe("schema_version");
    expect(r.resolvedKey).toBeUndefined();
  });

  it("a public_key_id the snapshot does not list is key_unresolvable", async () => {
    const r = await verify(s("signed-key-not-in-registry"));
    expect(vr(r)).toBe("UNVERIFIABLE/key_unresolvable");
    expect(r.stoppedAt).toBe("key_resolution");
  });

  it("the synthetic Tier 3 body is refused exactly as the worker's is", async () => {
    const r = await verify(s("tier3-critical-failure-unsigned"));
    expect(vr(r)).toBe("UNVERIFIABLE/malformed_receipt");
    expect(r.stoppedAt).toBe("signed_body");
  });
});

// ---------------------------------------------------------------------------
// the registry snapshot
// ---------------------------------------------------------------------------

describe("ho.receipt/v5.0 — the registry snapshot", () => {
  const f = s("tier1-XNYS-open-live");

  it("a snapshot with no canonical_payload_spec (the oracle-keys.json shape) does not say what is signed: refused", async () => {
    const r = await verify(f, { registryPath: s("registry-no-spec") });
    expect(vr(r)).toBe("UNVERIFIABLE/malformed_member");
    expect(r.stoppedAt).toBe("registry_snapshot");
  });

  it("a pre-2026-09-07 list without `coverage` is refused rather than graded with coverage unsigned", async () => {
    const r = await verify(f, { registryPath: s("registry-pre-coverage") });
    expect(vr(r)).toBe("UNVERIFIABLE/malformed_member");
    expect(r.stoppedAt).toBe("receipt_kind");
    expect(r.detail).toContain("coverage");
  });

  it("a key whose window closed before issued_at: signed_outside_key_window", async () => {
    const r = await verify(f, { registryPath: s("registry-key-window-closed") });
    expect(vr(r)).toBe("UNVERIFIABLE/signed_outside_key_window");
    expect(r.stoppedAt).toBe("key_window");
  });

  it("one key_id naming two different keys is ambiguous, and refused rather than picked", async () => {
    const r = await verify(f, { registryPath: s("registry-duplicate-key-id") });
    expect(vr(r)).toBe("UNVERIFIABLE/key_unresolvable");
    expect(r.detail).toContain("names 2 different keys");
  });

  it("the snapshot's digest and length are reported over the bytes as supplied, and --registry-sha256 is checked, not trusted", async () => {
    const bytes = readFileSync(REGISTRY);
    const good = await verify(f, { registrySha256: sha256Hex(bytes) });
    expect(vr(good)).toBe("VALID/verified");
    expect(ann(good, "registry_snapshot_sha256")).toBe(sha256Hex(bytes));
    expect(ann(good, "registry_snapshot_byte_length")).toBe(String(bytes.length));
    const bad = await verify(f, { registrySha256: "0".repeat(64) });
    expect(vr(bad)).toBe("UNVERIFIABLE/registry_snapshot_mismatch");
  });
});

// ---------------------------------------------------------------------------
// what the signer emits, synthesised where a worker run cannot reach
// ---------------------------------------------------------------------------

describe("ho.receipt/v5.0 — the synthetic receipts the signer emits", () => {
  it.each(SYN_VALID_MARKET)("%s is VALID", async (name) => {
    const r = await verify(s(name));
    expect(vr(r), r.detail).toBe("VALID/verified");
  });

  it("Tier 2 is graded as the signed fail-closed fallback, and the status is reported as the issuer's, not this tool's", async () => {
    const r = await verify(s("tier2-XNYS-determination-error"));
    expect(ann(r, "determination_tier")).toBe("2");
    expect(ann(r, "issuer_status")).toContain("UNKNOWN means CLOSED");
    expect(ann(r, "issuer_status")).toContain("not a decision by this tool");
  });

  it("override_origin on the synthetic Tier 0 pair: operator over a stale feed, REALTIME over a failed one", async () => {
    expect(ann(await verify(s("tier0-XNYS-operator-stale")), "override_origin")).toMatch(/^consistent_only_with_operator/);
    expect(ann(await verify(s("tier0-XNAS-realtime-failed")), "override_origin")).toMatch(/^consistent_only_with_realtime/);
  });
});

// ---------------------------------------------------------------------------
// detection
// ---------------------------------------------------------------------------

const HO_FILES = [...readdirSync(WORKER).map((f) => join(WORKER, f)), ...readdirSync(SYN).map((f) => join(SYN, f))];

function walkFixtures(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (p !== HO) out.push(...walkFixtures(p));
    } else if (statSync(p).isFile() && /\.(json|jsonl|jws)$/.test(e.name)) out.push(p);
  }
  return out;
}

describe("ho.receipt/v5.0 — detection refuses to guess", () => {
  it("claims every signed HO receipt and the Tier 3 body, and auto-detection picks it alone", () => {
    const claimed = [...WORKER_SIGNED.map(w), w("demo-XNYS-tier3-unsigned"), ...SYN_VALID_MARKET.map(s), s("health")];
    for (const f of claimed) {
      const d = detectFormat(readFileSync(f));
      expect(d.ok && d.adapter === hoReceiptAdapter, `${relative(ROOT, f)}: ${JSON.stringify(d)}`).toBe(true);
    }
  });

  it("no other adapter claims any file under fixtures/ho/", () => {
    for (const f of HO_FILES) {
      const others = ADAPTERS.filter((a) => a !== hoReceiptAdapter && a.detect?.(readFileSync(f)) === true).map((a) => a.format);
      expect(others, relative(ROOT, f)).toEqual([]);
    }
  });

  it("claims no fixture of the other five formats", () => {
    const files = walkFixtures(FIX);
    expect(files.length).toBeGreaterThan(100);
    const claimed = files.filter((f) => detect(readFileSync(f)));
    expect(claimed.map((f) => relative(ROOT, f))).toEqual([]);
  });

  it("names: ho, ho.receipt, ho.receipt/v5.0, ho-receipt; and the CLI lists it", async () => {
    for (const n of ["ho", "ho.receipt", "ho.receipt/v5.0", "ho-receipt", "HO.RECEIPT"]) expect(adapterByFormat(n), n).toBe(hoReceiptAdapter);
    expect(FORMAT_NAMES).toContain("ho");
    const { result } = await run([s("health"), "--format", "nope"]);
    expect(result?.detail).toContain("ho");
  });

  it("a registry or JWKS file is not a receipt", () => {
    for (const f of [REGISTRY, WORKER_REGISTRY, s("jwks")]) expect(detect(readFileSync(f)), f).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// the contract every format shares
// ---------------------------------------------------------------------------

describe("ho.receipt/v5.0 — the tri-state contract holds", () => {
  it("resolved_key is null exactly when the verdict is UNVERIFIABLE, over every receipt fixture", async () => {
    const receipts = HO_FILES.filter((f) => !/^(registry|keys|jwks)[.-]/.test(f.split(/[\\/]/).pop()!));
    expect(receipts.length).toBeGreaterThan(35);
    for (const f of receipts) {
      const r = await verify(f);
      const j = JSON.parse(jsonResult(r)) as { verdict: string; resolved_key: unknown };
      expect(j.resolved_key === null, `${relative(ROOT, f)}: ${j.verdict}`).toBe(j.verdict === "UNVERIFIABLE");
    }
  });

  it("every stop point the adapter reports is a check the manifest declares", async () => {
    const ids = coverageFor(FORMAT)!.checks.map((c) => c.id);
    for (const f of HO_FILES) {
      const r = await verify(f);
      if (r.stoppedAt !== undefined) expect(ids, relative(ROOT, f)).toContain(r.stoppedAt);
    }
  });

  it("the CLI renders a VALID HO receipt with exit 0 and the key line", async () => {
    const { result, exitCode, text } = await run([w("demo-XNYS-tier1-live"), "--registry", WORKER_REGISTRY, "--now", String(issuedSec(w("demo-XNYS-tier1-live")) + 1)]);
    expect(result?.format).toBe(FORMAT);
    expect(exitCode).toBe(0);
    expect(text).toContain(`verified under key ${KEY_ID}`);
  });

  it("the README carries Format 6 with its rulings, its limits and the Interests disclosure", () => {
    const readme = readFileSync(join(ROOT, "README.md"), "utf8");
    expect(readme).toContain("## Format 6 — `ho.receipt/v5.0`");
    const section = readme.slice(readme.indexOf("## Format 6"), readme.indexOf("\n## ", readme.indexOf("## Format 6") + 5));
    for (const token of [
      "now >= expires_at",
      "key_unresolvable",
      "safe-to-trade",
      "registry_provenance",
      "status_determination",
      "heartbeat_existence",
      "override_origin",
      "feed_scope_configuration",
      "Interests",
      "test-throwaway",
    ]) {
      expect(section, `Format 6 does not name ${token}`).toContain(token);
    }
  });
});
