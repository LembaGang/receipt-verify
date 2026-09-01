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

import {
  runDerivedId,
  runIdentifierGrammar,
  runJcsNKats,
  runMutants,
  runSubjectBindingDiff,
} from "../../cpb/run-vectors.js";

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

  it("T3B-STRUCTURAL — every construction-independent check on jcs-n/derived-id agrees", () => {
    // The only external check that exists anywhere for our §5 work: removal by
    // deletion, carried-identifier mismatch, and the SD precondition in both
    // directions. Construction-independent, so the withdrawn algorithm token
    // these vectors declare does not bear on it.
    const rows = runDerivedId(dir).filter((r) => r.set === "T3B-STRUCTURAL");
    expect(rows.length).toBe(6);
    expect(
      rows.filter((r) => r.verdict !== "AGREE").map((r) => `${r.vector} ${r.check}`),
    ).toEqual([]);
  });

  it("T3B-DIGEST — every compared byte agrees, and every comparison was readable", () => {
    // Readability is decided mechanically by carriesNormalizableMember, not by
    // eye: a row is only comparable against a jcs-n-pinned value when nothing
    // survives exclusion that the two constructions treat differently.
    const rows = runDerivedId(dir).filter((r) => r.set === "T3B-DIGEST");
    expect(rows.length).toBe(7);
    expect(rows.filter((r) => r.check.includes("NOT READABLE"))).toEqual([]);
    expect(rows.filter((r) => r.verdict !== "AGREE").map((r) => r.check)).toEqual([]);
  });

  it("T3B — their derived_id equals the value our T2 tests pinned from Appendix A", () => {
    // The external anchor. cpb/T3B_RESULTS.md carries the git proof that the
    // pin predates any read of this vector.
    const rows = runDerivedId(dir).filter((r) => r.check.startsWith("derived identifier"));
    expect(rows.length).toBeGreaterThan(0);
    const basic = rows.find((r) => r.vector.startsWith("derived-id-01"));
    expect(basic?.expected).toBe("1009a072df7fc0bfc6fcf49ca2f194067f6c0136c871a88d4fbd66a13361c1d1");
    expect(basic?.ours).toBe(basic?.expected);
  });

  it("MUTANTS — every wrong construction marked mustBeDetected is caught", () => {
    // The falsification, run rather than asserted in prose. If this ever passes
    // with a required mutant undetected, the 16/16 above stopped meaning
    // anything and this test is the thing that says so.
    const results = runMutants(dir);
    const missed = results.filter((m) => m.mustBeDetected && !m.detected);
    expect(missed.map((m) => m.id)).toEqual([]);
  });

  it("MUTANTS — M1 collapses diff-01 onto THEIR pinned jcs_n digest", () => {
    // Measured against their bytes, not ours: this is what makes the shipped
    // mutant equivalent to editing cpb/canonical-digest.ts by hand, and it is
    // the exact failure the subject-binding-diff set was built to expose.
    const m1 = runMutants(dir).find((m) => m.id === "M1-collapse-to-jcs-n");
    expect(m1?.collapsedOntoPinnedJcsN).toBe(true);
    expect(m1?.rowsRed).toBe(12);
  });

  it("SUPPLEMENTARY — our §5.1 decoder refuses both pinned malformed identifiers", () => {
    const rows = runIdentifierGrammar(dir);
    expect(rows.length).toBe(2);
    for (const r of rows) expect(r.verdict).toBe("AGREE");
  });
});

// The second half of the pattern this file's header cites from
// test/live-jwks.test.ts: when the gate is off, the OFF state is a printed,
// passing row rather than an absence. This makes the skip visible in the
// suite output. It does not change the exit code — a machine-readable signal
// for "vectors never loaded" is a separate change, not made here.
describe.runIf(!AVAILABLE)("their vectors, against our implementation", () => {
  it("is skipped unless CPB_VECTORS_DIR points at a clone of action-state-group/scitt-payload-binding", () => {
    expect(AVAILABLE).toBe(false);
  });
});
