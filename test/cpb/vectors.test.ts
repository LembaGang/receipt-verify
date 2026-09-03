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
  bucketJcsNKats,
  runDerivedId,
  runIdentifierGrammar,
  runJcsNKats,
  runMutants,
  runSubjectBindingDiff,
  runTypedRefs,
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

  it("OBSERVED — all 38 kats are read", () => {
    // The bucket split and its counts moved on 2026-09-03 and are asserted in
    // "the 2026-08-31 corrections" below, against bucketJcsNKats — the same
    // function the printed summary uses, so the two cannot disagree.
    expect(runJcsNKats(dir).length).toBe(38);
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

// --------------------------------------------------------------------------

/**
 * The 2026-08-31 corrections, as tests.
 *
 * Each of these was RED against the harness as delivered on 30 Aug, on this
 * same clone: kat-37 produced 7e8059f4… instead of refusing, kats 20 and 21 sat
 * in an N/A bucket labelled "no canonicalization input", and the comparable
 * base printed 25 with 19 agreeing. The typed-refs set was not read at all.
 */
describe.runIf(AVAILABLE)("the 2026-08-31 corrections", () => {
  const dir = DIR as string;

  it("kat-37 is REFUSED at the octet boundary, before any value is digested", () => {
    const r = runJcsNKats(dir).find((x) => x.vector.startsWith("jcs-n-kat-37"));
    expect(r).toBeDefined();
    expect(r!.verdict).toBe("AGREE");
    expect(r!.ours).toContain("REFUSED: duplicate member name at $.input.a");
    // The refusal names the set it comes from. A refusal that cannot say which
    // rule it applied is not checkable by the people who wrote the vector.
    expect(r!.ours).toContain("RFC 8785 §3.1");
    expect(r!.ours).toContain("RFC 7493 §2.3");
    // And the digest the 30 Aug run produced must not appear anywhere in it.
    expect(r!.ours).not.toContain("7e8059f495589fcd981232cc11d00b00da3802c01d688fa1cf1f6bed6e5bb33c");
  });

  it("kats 20 and 21 are evaluated from cited_artifact.payload and reproduce the pinned identifier", () => {
    const b = bucketJcsNKats(runJcsNKats(dir));
    expect(b.notEvaluated.length).toBe(0);
    expect(b.citedArtifact.length).toBe(2);
    for (const r of b.citedArtifact) {
      expect(r.verdict, r.vector).toBe("AGREE");
      expect(r.ours).toBe("2f9bba43e30273e2e87c7ef659a0f36f1e11f8e0c10489afe4d267c996505c37");
    }
  });

  it("the comparable base is 29 and 23 agree — the four MUST-FAIL vectors that also pin a conforming digest are compared", () => {
    const b = bucketJcsNKats(runJcsNKats(dir));
    expect(b.comparable.length).toBe(29);
    expect(b.agreeing.length).toBe(23);
    // The four that moved the base from 25 to 29, by name. These are the NFC
    // boundary, the lowercase escape form, the named short escape and the
    // UTF-16 key-sort cases: RFC 8785 conformance anchors, and the coverage
    // manifest's claim that RFC 8785 conformance was never derived here is what
    // they bear on.
    // Matched on FILENAME, not on the vector's `id`: these four carry
    // descriptive ids (jcs-n-nfc-contrast-01, jcs-n-esc-uppercase-contrast, …)
    // and the correction letter names them by their file numbers.
    for (const [file, digest] of [
      ["13-nfc-boundary-contrast.json", "0b985be82ae90bcbbbafc977962796b317195d17f2b700fbb37a588abfd097bf"],
      ["27-esc-uppercase-contrast.json", "f5d570fa6125f49bcb56da3ce3e37d4d214d02723feb1c7d24ddedc5b2677153"],
      ["28-tab-long-form-contrast.json", "7ac9c6bd87cdda62f1e81f0139d6ab751c66321164e230d35f3133a000280695"],
      ["29-control-key-escaped-sort-contrast.json", "64e35d3d1ba080baed3eafbe59b668d6642d486a9b9750fef60997690d7e570b"],
    ]) {
      const r = b.comparable.find((x) => x.vector.includes(file!));
      expect(r, file).toBeDefined();
      expect(r!.expected).toBe(digest);
      expect(r!.ours).toBe(digest);
    }
  });

  it("the four buckets are disjoint and sum to 38", () => {
    const b = bucketJcsNKats(runJcsNKats(dir));
    expect(
      b.comparable.length + b.refused.length + b.reasonOnly.length + b.citedArtifact.length + b.notEvaluated.length,
    ).toBe(38);
    // Disjoint, not merely summing: an overlap would let one vector be counted
    // twice and still total 38 if another were dropped.
    const seen = new Set<string>();
    for (const g of [b.comparable, b.refused, b.reasonOnly, b.citedArtifact, b.notEvaluated]) {
      for (const r of g) {
        expect(seen.has(r.vector), `${r.vector} appears in two buckets`).toBe(false);
        seen.add(r.vector);
      }
    }
    expect(seen.size).toBe(38);
  });

  it("TYPED-REFS — five vectors exercise §5, and all five reproduce the pinned identifier", () => {
    const rows = runTypedRefs(dir);
    expect(rows.length).toBe(5);
    for (const r of rows) {
      expect(r.verdict, r.vector).toBe("AGREE");
      expect(r.ours).toBe("0c837d01faa4106c63367f199af9bfa729d1917f36dc91f9dfeb6de6ec7c6bdb");
    }
    expect(rows.map((r) => r.vector.split(" ")[0]).sort()).toEqual([
      "typed-ref-cpb01-01",
      "typed-ref-cpb01-02",
      "typed-ref-fail-01",
      "typed-ref-fail-03",
      "typed-ref-pass-01",
    ]);
  });

  it("TYPED-REFS — fail/01 is the vector that discriminates deletion from nulling", () => {
    // The three derived-id vectors all carry record_id: null, so none of them
    // can tell an excluded member being DELETED from its being set to null.
    // fail/01's excluded member holds a non-null string, so it can.
    const r = runTypedRefs(dir).find((x) => x.vector.startsWith("typed-ref-fail-01"));
    expect(r).toBeDefined();
    expect(r!.check).toContain('doc_id="secret-id-123"');
    expect(r!.verdict).toBe("AGREE");
  });

  it("TYPED-REFS — fail/03's exclusion set is read from prose, and the row says so", () => {
    // The one judgment call in this set, surfaced rather than buried: fail/03
    // declares its digest context only in the `digest_context` STRING and
    // carries no exclusion_set array anywhere. If that ever becomes an array,
    // this assertion goes red and the delivered wording needs changing with it.
    const rows = runTypedRefs(dir);
    const prose = rows.filter((r) => r.check.includes("READ FROM PROSE"));
    expect(prose.length).toBe(1);
    expect(prose[0]!.vector).toContain("fail/03");
    expect(rows.filter((r) => r.check.includes("declared as an exclusion_set array")).length).toBe(4);
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
