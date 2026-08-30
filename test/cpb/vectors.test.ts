// T3 gate — the authors' vectors, run against our implementation.
//
// Skipped by default, because the vectors live in their repository and are not
// vendored into this one. Run it with the clone path:
//
//     CPB_VECTORS_DIR=/path/to/scitt-payload-binding/vectors npm test
//
// or on PowerShell:
//
//     $env:CPB_VECTORS_DIR="C:\path\to\scitt-payload-binding\vectors"; npm test
//
// It is allowed to skip when the clone is absent. It is NOT allowed to pass
// when the clone is absent — same rule as test/live-jwks.test.ts.
//
// PRIMARY is the gate: every comparison against the live registered `jcs`
// construction must agree. OBSERVED is asserted only for its shape, because a
// disagreement there is expected and carries no verdict about our conformance —
// those vectors declare the withdrawn construction.

import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";

import { runIdentifierGrammar, runJcsNKats, runSubjectBindingDiff } from "../../cpb/run-vectors.js";

const DIR = process.env["CPB_VECTORS_DIR"];
const AVAILABLE = DIR !== undefined && existsSync(DIR);

describe.runIf(AVAILABLE)("their vectors, against our implementation", () => {
  const dir = DIR as string;

  it("PRIMARY — every subject-binding-diff comparison agrees", () => {
    const rows = runSubjectBindingDiff(dir);
    // Four vectors, four comparisons each: pre-image text, pre-image bytes,
    // digest, and the direction-specific check.
    expect(rows.length).toBe(16);
    const disagreements = rows.filter((r) => r.verdict === "DISAGREE");
    expect(
      disagreements.map((r) => `${r.vector} ${r.check}: expected ${r.expected}, ours ${r.ours}`),
    ).toEqual([]);
  });

  it("PRIMARY — the divergence is computed, not asserted", () => {
    // The vectors exist to show jcs and jcs-n produce different bytes. If our
    // implementation ever collapsed onto the withdrawn construction, these rows
    // would read "identical" — which is the failure the whole set is for.
    const rows = runSubjectBindingDiff(dir).filter((r) =>
      r.check.startsWith("our jcs digest vs pinned"),
    );
    expect(rows.length).toBe(3);
    for (const r of rows) expect(r.ours).toBe("differs");
  });

  it("OBSERVED — the jcs-n suite splits into three disjoint buckets that sum to 38", () => {
    const rows = runJcsNKats(dir);
    const na = rows.filter((r) => r.verdict === "N/A");
    const evaluated = rows.filter((r) => r.verdict !== "N/A");
    const mustFail = evaluated.filter((r) => r.expected.startsWith("MUST-FAIL:"));
    const pinned = evaluated.filter((r) => !r.expected.startsWith("MUST-FAIL:"));
    expect(rows.length).toBe(38);
    expect(na.length + mustFail.length + pinned.length).toBe(38);
    // No assertion on the agreement count: it is an observation about two
    // constructions, not a threshold this implementation must meet.
    expect(pinned.filter((r) => r.verdict === "AGREE").length).toBeGreaterThan(0);
  });

  it("SUPPLEMENTARY — our §5.1 decoder refuses both pinned malformed identifiers", () => {
    const rows = runIdentifierGrammar(dir);
    expect(rows.length).toBe(2);
    for (const r of rows) expect(r.verdict).toBe("AGREE");
  });
});
