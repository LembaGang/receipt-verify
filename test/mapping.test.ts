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

describe("the published mapping document", () => {
  // agentoracle.co began publishing a mapping document on 2026-07-29. It uses
  // its own schema (`recommendation_rules` / `threshold` / `gate_map`), not the
  // one this tool defined while none was published. See
  // FINDINGS-rerun-2026-07-29.md erratum 1.
  const PUBLISHED_ID = "agentoracle-v0.3-2026-05-30";
  const raw = readFileSync(join(MAPPINGS, `${PUBLISHED_ID}.json`));
  const CONTENT_ADDRESS = "0a78263976790df6e76cd9f3f441bf5a3b5c3a82e346b5aca43e49626881d7b0";

  it("resolves and hash-matches under the digest the fixtures bind", () => {
    const r = resolveMapping(MAPPINGS, PUBLISHED_ID, `sha256-${CONTENT_ADDRESS}`);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.digestHex).toBe(CONTENT_ADDRESS);
  });

  it("is served as its own JCS bytes, so the file digest is the content address", () => {
    expect(digestOfMappingDocument(JSON.parse(raw.toString("utf8")))).toBe(CONTENT_ADDRESS);
  });

  it("carries the seven-value recommendation enum, gate-mapped in full", () => {
    const d = JSON.parse(raw.toString("utf8")) as {
      enums: { v_recommendation: string[] };
      gate_map: Record<string, string>;
    };
    expect(d.enums.v_recommendation).toHaveLength(7);
    expect(d.enums.v_recommendation).toContain("un_probed_not_cleared");
    for (const r of d.enums.v_recommendation) expect(d.gate_map[r]).toMatch(/^(act|halt)$/);
  });

  // The two documents are independent transcriptions of §5.1 Table 2 — one by
  // the draft author, one here. Agreement across the whole input domain is what
  // makes normalizing the published schema onto the internal one safe; a single
  // divergent cell would mean the recompute depends on which document you read.
  it("agrees with this repository's transcription on every input in the domain", () => {
    const published = resolveMapping(MAPPINGS, PUBLISHED_ID, `sha256-${CONTENT_ADDRESS}`);
    expect(published.ok).toBe(true);
    if (!published.ok) return;

    let compared = 0;
    for (const v_verdict of ["supported", "refuted", "unverifiable", "unknown"]) {
      for (const v_adversarial_result of ["resilient", "vulnerable", "not_checked"]) {
        for (const v_confidence of [0, 0.69, 0.7, 0.71, 1]) {
          const input = { v_verdict, v_confidence, v_adversarial_result };
          const a = recompute(published.value.doc, input);
          const b = recompute(doc, input);
          expect(a.ok).toBe(b.ok);
          if (a.ok && b.ok) {
            expect(a.recommendation).toBe(b.recommendation);
            expect(a.gate).toBe(b.gate);
          }
          compared++;
        }
      }
    }
    expect(compared).toBe(60);
  });
});
