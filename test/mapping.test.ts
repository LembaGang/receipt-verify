// The mapping document layer: §5.1's decision table, the content binding, and
// the digest-spelling leniency.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { digestOfMappingDocument, normalizeDigest, recompute, resolveMapping, type MappingDocument } from "../src/mapping.js";
import { MAPPINGS } from "./helpers.js";

const MAPPING_ID = "v0.3.0-2026-05-30";
const doc = JSON.parse(readFileSync(join(MAPPINGS, `${MAPPING_ID}.json`), "utf8")) as MappingDocument;

describe("§5.1 decision table", () => {
  // Every row of Table 2, transcribed as (inputs) -> (recommendation, gate).
  // threshold = 0.7, so 0.9 is above and 0.4 below.
  const ROWS: [string, number, string, string, string][] = [
    ["supported", 0.9, "resilient", "confident_supported", "act"],
    ["supported", 0.9, "not_checked", "un_probed_not_cleared", "halt"],
    ["supported", 0.9, "vulnerable", "vulnerable_supported", "halt"],
    ["supported", 0.4, "vulnerable", "vulnerable_supported", "halt"],
    ["supported", 0.4, "resilient", "weak_supported", "halt"],
    ["supported", 0.4, "not_checked", "weak_supported", "halt"],
    ["refuted", 0.9, "resilient", "refuted", "halt"],
    ["refuted", 0.4, "vulnerable", "refuted", "halt"],
    ["unverifiable", 0.9, "resilient", "unverifiable", "halt"],
    ["unknown", 0.9, "resilient", "unverifiable", "halt"],
  ];

  it.each(ROWS)("%s / %s / %s -> %s / %s", (v, c, a, rec, gate) => {
    const r = recompute(doc, { v_verdict: v, v_confidence: c, v_adversarial_result: a });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.recommendation).toBe(rec);
      expect(r.gate).toBe(gate);
    }
  });

  it("only confident_supported gates to act", () => {
    const acts = Object.entries(doc.gate).filter(([, g]) => g === "act");
    expect(acts).toEqual([["confident_supported", "act"]]);
  });

  it("the threshold boundary is inclusive on >=", () => {
    const at = recompute(doc, { v_verdict: "supported", v_confidence: 0.7, v_adversarial_result: "resilient" });
    const below = recompute(doc, { v_verdict: "supported", v_confidence: 0.6999, v_adversarial_result: "resilient" });
    expect(at.ok && at.recommendation).toBe("confident_supported");
    expect(below.ok && below.recommendation).toBe("weak_supported");
  });

  it("an input no rule covers is a refusal, not a default", () => {
    const r = recompute(doc, { v_verdict: "banana", v_confidence: 0.9, v_adversarial_result: "resilient" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("no rule");
  });

  it("the rules are mutually exclusive across the whole input space", () => {
    // Ambiguity would mean the gate a receipt derives depends on rule order.
    for (const v of ["supported", "refuted", "unverifiable", "unknown"]) {
      for (const c of [0, 0.4, 0.7, 0.9, 1]) {
        for (const a of ["resilient", "vulnerable", "not_checked"]) {
          const r = recompute(doc, { v_verdict: v, v_confidence: c, v_adversarial_result: a });
          expect(r.ok, `${v}/${c}/${a}`).toBe(true);
        }
      }
    }
  });
});

describe("mapping content binding (§4.2, §4.6)", () => {
  const digest = digestOfMappingDocument(doc);

  it("resolves and hash-matches under the correct digest", () => {
    const r = resolveMapping(MAPPINGS, MAPPING_ID, digest);
    expect(r.ok).toBe(true);
  });

  it("refuses a digest mismatch", () => {
    const r = resolveMapping(MAPPINGS, MAPPING_ID, "0".repeat(64));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("hash_mismatch");
  });

  it("refuses an unknown mapping id", () => {
    const r = resolveMapping(MAPPINGS, "v9.9.9-nope", digest);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("unresolvable");
  });

  it("refuses when no mapping directory is configured", () => {
    const r = resolveMapping(undefined, MAPPING_ID, digest);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("unresolvable");
  });

  it("the digest is over JCS bytes, so it survives a re-serialization", () => {
    const reordered = Object.fromEntries(Object.entries(doc).reverse());
    expect(digestOfMappingDocument(reordered)).toBe(digest);
  });
});

describe("digest spelling leniency", () => {
  const hex = "a".repeat(64);

  // The draft says "hex digest", its own example writes sha256:<hex>, and the
  // published fixtures write sha256-<hex>. All three are accepted; anything else
  // is not.
  it.each([hex, `sha256:${hex}`, `sha256-${hex}`, `  ${hex}  `])("accepts %s", (s) => {
    expect(normalizeDigest(s)).toBe(hex);
  });

  it.each(["sha512-" + hex, hex.slice(0, 63), "sha256-" + "z".repeat(64), ""])("rejects %s", (s) => {
    expect(normalizeDigest(s)).toBeNull();
  });

  it("is case-insensitive on the hex but normalizes to lowercase", () => {
    expect(normalizeDigest("A".repeat(64))).toBe(hex);
  });
});
