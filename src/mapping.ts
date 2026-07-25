// Mapping documents: resolution, content-addressing, and the recompute in
// draft-krausz-verification-state-01 §4.3 steps 2-6.
//
// The draft binds a receipt to a mapping document by identifier and SHA-256
// digest (§4.2, §4.6) but does not specify the document's schema, and no
// mapping document is published at any location the fixtures name. The schema
// below is therefore defined BY THIS TOOL. See README "Mapping documents" and
// FINDINGS.md. Any receipt whose mapping cannot be resolved and hash-matched is
// UNVERIFIABLE — the tool never substitutes a default ruleset for a missing one.

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { jcsBytes } from "@headlessoracle/chirindo/dist/vendor/recorder/index.js";

export const VERDICTS = ["supported", "refuted", "unverifiable", "unknown"] as const;
export const ADVERSARIAL = ["resilient", "vulnerable", "not_checked"] as const;
export const GATES = ["act", "halt"] as const;

export type Gate = (typeof GATES)[number];

/** "any" matches unconditionally; ">=" and "<" compare v_confidence to the document threshold. */
export type ConfidenceTest = "any" | ">=" | "<";

export interface MappingRule {
  v_verdict: string | string[];
  confidence: ConfidenceTest;
  v_adversarial_result: string | string[];
  v_recommendation: string;
}

export interface MappingDocument {
  mapping_id: string;
  spec?: string;
  confidence_threshold: number;
  rules: MappingRule[];
  /** recommendation -> gate. Total over every recommendation the rules can emit. */
  gate: Record<string, Gate>;
}

export interface ResolvedMapping {
  doc: MappingDocument;
  /** Lowercase hex SHA-256 over the JCS canonical bytes of the document. */
  digestHex: string;
  origin: string;
}

export type MappingFailure =
  | { kind: "unresolvable"; mappingId: string; searched: string }
  | { kind: "malformed"; mappingId: string; origin: string; message: string }
  | { kind: "hash_mismatch"; mappingId: string; origin: string; expected: string; actual: string };

export type MappingResult = { ok: true; value: ResolvedMapping } | { ok: false; error: MappingFailure };

/**
 * Normalize the digest a receipt declares.
 *
 * The draft says "SHA-256 hex digest" (§4.2) but its own example writes
 * `sha256:<hex>` (§4.5) and the published fixtures write `sha256-<hex>`. Three
 * spellings of one value. We accept all three and compare on the hex, which is
 * a documented leniency, not a silent one — see FINDINGS.md.
 */
export function normalizeDigest(declared: string): string | null {
  const m = /^(?:sha256[-:])?([0-9a-fA-F]{64})$/.exec(declared.trim());
  return m ? m[1]!.toLowerCase() : null;
}

export function digestOfMappingDocument(doc: unknown): string {
  return createHash("sha256").update(jcsBytes(doc)).digest("hex");
}

function validateDocument(o: unknown, mappingId: string, origin: string): MappingDocument | MappingFailure {
  const bad = (message: string): MappingFailure => ({ kind: "malformed", mappingId, origin, message });
  if (o === null || typeof o !== "object") return bad("not a JSON object");
  const d = o as Record<string, unknown>;
  if (d["mapping_id"] !== mappingId) {
    return bad(`document declares mapping_id ${JSON.stringify(d["mapping_id"])}, receipt names ${JSON.stringify(mappingId)}`);
  }
  if (typeof d["confidence_threshold"] !== "number") return bad("confidence_threshold is not a number");
  if (!Array.isArray(d["rules"]) || d["rules"].length === 0) return bad("rules is not a non-empty array");
  if (d["gate"] === null || typeof d["gate"] !== "object") return bad("gate is not an object");
  for (const [rec, g] of Object.entries(d["gate"] as Record<string, unknown>)) {
    if (g !== "act" && g !== "halt") return bad(`gate.${rec} is ${JSON.stringify(g)}, expected "act" or "halt"`);
  }
  for (const [i, r] of (d["rules"] as unknown[]).entries()) {
    if (r === null || typeof r !== "object") return bad(`rules[${i}] is not an object`);
    const rr = r as Record<string, unknown>;
    if (typeof rr["v_recommendation"] !== "string") return bad(`rules[${i}].v_recommendation is not a string`);
    if (rr["confidence"] !== "any" && rr["confidence"] !== ">=" && rr["confidence"] !== "<") {
      return bad(`rules[${i}].confidence is ${JSON.stringify(rr["confidence"])}, expected "any", ">=" or "<"`);
    }
  }
  return d as unknown as MappingDocument;
}

/**
 * Resolve a mapping id to a document in `dir` and check its digest against the
 * receipt's binding. Local-only by design: fetching a mapping document over the
 * network at verify time would make the verdict depend on what a remote host
 * served at that instant, which is the property §4.6 exists to remove.
 */
export function resolveMapping(dir: string | undefined, mappingId: string, declaredDigest: string): MappingResult {
  const searched = dir ?? "(no mapping directory configured)";
  if (dir === undefined) return { ok: false, error: { kind: "unresolvable", mappingId, searched } };

  const path = join(dir, `${mappingId}.json`);
  if (!existsSync(path)) return { ok: false, error: { kind: "unresolvable", mappingId, searched: path } };

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    return { ok: false, error: { kind: "malformed", mappingId, origin: path, message: (e as Error).message } };
  }
  const doc = validateDocument(parsed, mappingId, path);
  if ("kind" in (doc as object)) return { ok: false, error: doc as MappingFailure };

  const actual = digestOfMappingDocument(parsed);
  const expected = normalizeDigest(declaredDigest);
  if (expected === null) {
    return {
      ok: false,
      error: { kind: "malformed", mappingId, origin: path, message: `receipt digest ${JSON.stringify(declaredDigest)} is not a SHA-256 hex digest` },
    };
  }
  if (expected !== actual) {
    return { ok: false, error: { kind: "hash_mismatch", mappingId, origin: path, expected, actual } };
  }
  return { ok: true, value: { doc: doc as MappingDocument, digestHex: actual, origin: path } };
}

/**
 * A rule field matches a value if it names it, lists it, or is the wildcard
 * "any" — the spelling §5.1's table uses for its "(any)" cells.
 */
function matches(field: string | string[], value: string): boolean {
  if (field === "any") return true;
  return Array.isArray(field) ? field.includes(value) : field === value;
}

export interface RecomputeInput {
  v_verdict: string;
  v_confidence: number;
  v_adversarial_result: string;
}

export type RecomputeResult =
  | { ok: true; recommendation: string; gate: Gate }
  | { ok: false; message: string };

/**
 * §4.3 steps 3 and 5: derive the recommendation from the canonical inputs under
 * the document's rules and threshold, then derive the gate from the
 * recommendation. Exactly one rule must match; no rule matching is a refusal,
 * not a fallback, because the fallback would be a gate decision this tool has
 * no standing to make.
 */
export function recompute(doc: MappingDocument, input: RecomputeInput): RecomputeResult {
  const hits = doc.rules.filter((r) => {
    if (!matches(r.v_verdict, input.v_verdict)) return false;
    if (!matches(r.v_adversarial_result, input.v_adversarial_result)) return false;
    if (r.confidence === ">=") return input.v_confidence >= doc.confidence_threshold;
    if (r.confidence === "<") return input.v_confidence < doc.confidence_threshold;
    return true;
  });

  if (hits.length === 0) {
    return {
      ok: false,
      message: `no rule in mapping ${doc.mapping_id} matches (v_verdict=${input.v_verdict}, v_confidence=${input.v_confidence}, v_adversarial_result=${input.v_adversarial_result})`,
    };
  }
  if (hits.length > 1) {
    const recs = [...new Set(hits.map((h) => h.v_recommendation))];
    if (recs.length > 1) {
      return { ok: false, message: `mapping ${doc.mapping_id} is ambiguous: rules disagree (${recs.join(", ")})` };
    }
  }
  const recommendation = hits[0]!.v_recommendation;
  const gate = doc.gate[recommendation];
  if (gate === undefined) {
    return { ok: false, message: `mapping ${doc.mapping_id} has no gate entry for recommendation ${recommendation}` };
  }
  return { ok: true, recommendation, gate };
}
