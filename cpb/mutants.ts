// SHIPPED MUTANTS — the falsification, carried in the deliverable rather than
// in the session history that produced it.
//
// WHY THIS FILE EXISTS. A run that reports "16/16 AGREE" has answered exactly
// one question, and a reader cannot tell from the green whether the comparison
// could ever have gone red. In the T3 session it was red-proofed by editing
// cpb/canonical-digest.ts by hand, running, and reverting — which proved the
// point for one person on one afternoon and left nothing behind. Canon: a check
// that cannot fail is a decoration, and worse than none.
//
// So each mutant below is a NAMED WRONG CONSTRUCTION. The harness runs the four
// subject-binding-diff vectors against every one of them on every run, beside
// the real implementation, and reports which the vector set catches. Anyone
// holding our commit and theirs re-derives the whole thing with one command.
//
// WHAT A MUTANT IS AND IS NOT, stated precisely so the evidence is not
// overclaimed. These are injected at the harness's seam: `runSubjectBindingDiff`
// takes the digest function as a parameter and defaults to the real
// `canonicalDigestJcs`. A mutant therefore proves that THE VECTOR COMPARISON
// DISCRIMINATES between the correct construction and this wrong one. It is not
// itself an edit to the shipped module. The equivalence to an in-place edit is
// checked numerically for M1, whose row count and collapsed digest must match
// what the hand edit produced in T3 — see cpb/T3_RESULTS.md.
//
// The mutants marked `mustBeDetected: false` are the more useful half. A wrong
// construction these four vectors do NOT catch is a statement about the vector
// set's reach, and it belongs in the report next to the agreement count.

import { createHash } from "node:crypto";

import { canonicalDigestJcs } from "./canonical-digest.js";
import { ok, type CpbResult, type JsonValue } from "./types.js";
import type { CanonicalDigest } from "./canonical-digest.js";

export type DigestFn = (payload: JsonValue) => CpbResult<CanonicalDigest>;

export interface Mutant {
  readonly id: string;
  /** The wrong behaviour this models, and where in -02 the right one is stated. */
  readonly what: string;
  /**
   * True when the four subject-binding-diff vectors are expected to catch it.
   * The gate asserts these; the others are reported as coverage, never as
   * failures — a mutant this set cannot see is information about the set.
   */
  readonly mustBeDetected: boolean;
  readonly digest: DigestFn;
}

/** Recursively remove members whose value is null, an empty array or an empty object. */
const strip = (v: JsonValue, dropNull: boolean, dropEmpty: boolean, minDepth = 0, depth = 0): JsonValue => {
  if (Array.isArray(v)) return v.map((e) => strip(e, dropNull, dropEmpty, minDepth, depth + 1));
  if (typeof v !== "object" || v === null) return v;
  const out: { [k: string]: JsonValue } = {};
  for (const [k, m] of Object.entries(v)) {
    if (depth >= minDepth) {
      if (dropNull && m === null) continue;
      if (dropEmpty && Array.isArray(m) && m.length === 0) continue;
      if (dropEmpty && typeof m === "object" && m !== null && !Array.isArray(m) && Object.keys(m).length === 0) {
        continue;
      }
    }
    out[k] = strip(m, dropNull, dropEmpty, minDepth, depth + 1);
  }
  return out;
};

const viaStrip =
  (dropNull: boolean, dropEmpty: boolean, minDepth = 0): DigestFn =>
  (payload) =>
    canonicalDigestJcs(strip(payload, dropNull, dropEmpty, minDepth));

export const MUTANTS: readonly Mutant[] = [
  {
    id: "M1-collapse-to-jcs-n",
    what:
      "runs the withdrawn jcs-n normalization pass before JCS. §4.1 line 567-569: jcs applies JCS " +
      "'directly to the payload, with no normalization pass: no member is removed because its value " +
      "is JSON null, an empty array, or an empty object.'",
    mustBeDetected: true,
    digest: viaStrip(true, true),
  },
  {
    id: "M2-strip-null-members-only",
    what: "removes only null members — half of M1, to show which vector catches which half",
    mustBeDetected: true,
    digest: viaStrip(true, false),
  },
  {
    id: "M3-strip-empty-members-only",
    what: "removes only empty-array and empty-object members — the other half of M1",
    mustBeDetected: true,
    digest: viaStrip(false, true),
  },
  {
    id: "M4-serialize-with-json-stringify",
    what:
      "digests JSON.stringify output instead of the canonical octet string — the failure §12.1 " +
      "names, 'not what a deserializer happens to emit'. Insertion order survives; JCS sorting does not.",
    mustBeDetected: true,
    digest: (payload) => {
      const pre = Buffer.from(JSON.stringify(payload) ?? "", "utf8");
      const d = createHash("sha256").update(pre).digest();
      return ok({ preImage: new Uint8Array(pre), digest: new Uint8Array(d), hex: d.toString("hex") });
    },
  },
  {
    id: "M5-uppercase-hex-output",
    what: "emits uppercase hexadecimal. §4.1 line 582 requires lowercase; §5.1 makes the two distinct.",
    mustBeDetected: true,
    digest: (payload) => {
      const r = canonicalDigestJcs(payload);
      return r.ok ? ok({ ...r.value, hex: r.value.hex.toUpperCase() }) : r;
    },
  },
  {
    id: "M6-strip-nested-nulls-only",
    what:
      "runs the jcs-n normalization pass at depth 1 and below, leaving top-level members alone. " +
      "The four subject-binding-diff actions are flat three-member objects, so this set cannot see it.",
    mustBeDetected: false,
    digest: viaStrip(true, true, 1),
  },
];

// ---------------------------------------------------------------------------
// EXCLUSION-SET MUTANTS — the falsification for §4.1's top-level-only rule.
// ---------------------------------------------------------------------------

/**
 * The mutants above all replace the DIGEST. This one replaces the REMOVAL step,
 * because the rule it falsifies is a rule about removal: §4.1 lines 590-592,
 * "The exclusion set is matched against the top-level member names of P only".
 *
 * Ambiguity-log A2 recorded that rule as taken from the text with no
 * behavioural consequence and no external check. Both halves of that were
 * wrong. `jcs-n/kats/22-exclusion-depth-top-level-only` is the external check:
 * its payload nests the excluded member name below the top level, so the two
 * readings produce different identifiers, and its own description records it as
 * a falsification vector proposed in review precisely to fork a
 * recursive-stripping implementation.
 *
 * kats 08 and 09 declare the same exclusion set over payloads whose excluded
 * member occurs ONLY at the top level, so this mutant leaves them untouched.
 * That is what makes kat-22 the discriminator rather than one of three: a
 * mutant that changed all three would not tell you which vector was carrying
 * the weight.
 */
export type ExclusionFn = (exclusionSet: readonly string[], payload: JsonValue) => JsonValue;

export interface ExclusionMutant {
  readonly id: string;
  readonly what: string;
  readonly apply: ExclusionFn;
}

/** §4.1's rule, as the shipped implementation applies it: top level only. */
export const exclusionTopLevelOnly: ExclusionFn = (exclusionSet, payload) => {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return payload;
  const out: { [k: string]: JsonValue } = {};
  for (const [k, v] of Object.entries(payload)) if (!exclusionSet.includes(k)) out[k] = v;
  return out;
};

/** The wrong reading: strip the excluded names wherever they occur. */
const exclusionAtEveryDepth: ExclusionFn = (exclusionSet, payload) => {
  if (Array.isArray(payload)) return payload.map((v) => exclusionAtEveryDepth(exclusionSet, v));
  if (typeof payload !== "object" || payload === null) return payload;
  const out: { [k: string]: JsonValue } = {};
  for (const [k, v] of Object.entries(payload)) {
    if (exclusionSet.includes(k)) continue;
    out[k] = exclusionAtEveryDepth(exclusionSet, v);
  }
  return out;
};

export const EXCLUSION_MUTANTS: readonly ExclusionMutant[] = [
  {
    id: "X1-strip-excluded-at-every-depth",
    what:
      "matches the exclusion set against member names at every depth instead of the top level only. " +
      "§4.1 lines 590-592 restrict the match to the top-level member names of P. Forked by " +
      "jcs-n/kats/22-exclusion-depth-top-level-only, and by no other vector in the corpus.",
    apply: exclusionAtEveryDepth,
  },
];
