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

import { discoverSection5, section5Files } from "../../cpb/discover-section5.js";
import { canonicalDigestJcs } from "../../cpb/index.js";
import {
  bucketJcsNKats,
  runDerivedId,
  runIdentifierGrammar,
  runJcsNKats,
  runMutants,
  runSubjectBindingDiff,
  runSection5Reproducers,
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

  it("SECTION-5 — fifteen vectors reproduce, in sixteen payload objects, across five identifiers", () => {
    // The count, and the history of the count, is the finding. 30 Aug: three.
    // 31 Aug: ten. 3 Sep morning: twelve. 3 Sep ratification, running the
    // identifier grep over the whole tree instead of one directory: fourteen.
    // This search: FIFTEEN, and the fifteenth is invisible to that grep.
    //
    // Each earlier search was scoped by an assumption — one directory, then one
    // member name, then one identifier value. This one is scoped by none of the
    // three, which is why it is the one the delivered documents describe.
    const rows = runSection5Reproducers(dir);
    const files = new Set(rows.map((r) => r.vector.split(" ")[0]));
    expect(files.size).toBe(15);
    expect(rows.length).toBe(16);
    for (const r of rows) expect(r.verdict, r.vector).toBe("AGREE");

    // FIVE distinct identifiers. This is the assertion that would have caught
    // every earlier under-count: a search keyed to one value cannot see four of
    // these, and this number going to 1 would mean the search had narrowed back
    // to the method that kept being wrong.
    expect(new Set(rows.map((r) => r.expected)).size).toBe(5);
  });

  it("SECTION-5 — the two vectors neither the value search nor a naive structural search finds", () => {
    const rows = runSection5Reproducers(dir);
    const byFile = (frag: string) => rows.filter((r) => r.vector.includes(frag));

    // typed-refs/fail/02 pins 28211009…, not 0c837d01…, so no grep for the
    // known identifier could ever have reached it. Two payload objects, two
    // different exclusion sets, one identifier — that collision is the vector.
    const trap = byFile("fail/02-textual-equality-trap");
    expect(trap.length).toBe(2);
    for (const r of trap) {
      expect(r.expected).toBe("28211009e28c3c09d8b52088b9a4b9ad26473bf2244b3d0ab469ca217b758558");
      expect(r.verdict).toBe("AGREE");
    }
    expect(trap.map((r) => r.check).join(" ")).toContain('["a_id"]');
    expect(trap.map((r) => r.check).join(" ")).toContain('["b_id","weight"]');

    // profile-independence/fail/01 declares NO exclusion set anywhere in its
    // own file, so a structural search that requires one skips it. It is
    // recomputable only by taking the set another vector declares for the
    // artifact type it names, and the row says so in those words.
    const cross = byFile("fail/01-cross-profile-field-access");
    expect(cross.length).toBe(1);
    expect(cross[0]!.verdict).toBe("AGREE");
    expect(cross[0]!.check).toContain("INFERRED ACROSS FILES");
  });

  it("SECTION-5 — the two profile-independence vectors reproduce 0c837d01…", () => {
    // The pair the 3 September ratification found, by running the identifier
    // grep over the whole vectors tree rather than over typed-refs/ alone.
    const rows = runSection5Reproducers(dir).filter((r) => r.vector.startsWith("profile-independence/"));
    expect(rows.length).toBe(2);
    for (const r of rows) {
      expect(r.ours, r.vector).toBe("0c837d01faa4106c63367f199af9bfa729d1917f36dc91f9dfeb6de6ec7c6bdb");
      expect(r.verdict).toBe("AGREE");
    }
  });

  it("SECTION-5 — the payload member name is discovered, not assumed", () => {
    // Assuming `payload` is what made the first version of this search miss all
    // three jcs-n/derived-id vectors, which call it full_payload and
    // sd_encoded_payload. Three names appear; if this ever drops to one, the
    // search has narrowed back to the assumption that kept being wrong.
    const checks = runSection5Reproducers(dir).map((r) => r.check).join(" | ");
    for (const name of ["payload member full_payload", "payload member sd_encoded_payload", "payload member payload"]) {
      expect(checks, name).toContain(name);
    }
  });

  it("SECTION-5 — fail/01 and fail/04 are the vectors that discriminate deletion from nulling", () => {
    // The three derived-id vectors all carry record_id: null, so none of them
    // can tell a DELETED excluded member from a NULLED one. These two exclude a
    // member holding a non-null string, so they can.
    const rows = runSection5Reproducers(dir);
    for (const frag of ["typed-refs/fail/01-", "typed-refs/fail/04-"]) {
      const r = rows.find((x) => x.vector.includes(frag));
      expect(r, frag).toBeDefined();
      expect(r!.verdict).toBe("AGREE");
    }
  });

  it("SECTION-5 — exclusion sets come from four places, and every row names which", () => {
    // An array on the object, an array in a registry entry, a prose
    // digest_context sentence, and one cross-file inference. Each is a
    // different amount of confidence and the row has to carry which.
    const checks = runSection5Reproducers(dir).map((r) => r.check);
    expect(checks.filter((c) => c.includes("[exclusion_set array]")).length).toBeGreaterThan(0);
    expect(checks.filter((c) => c.includes("exclusion_set array in")).length).toBeGreaterThan(0);
    expect(checks.filter((c) => c.includes("PROSE:")).length).toBe(3);
    expect(checks.filter((c) => c.includes("INFERRED ACROSS FILES")).length).toBe(1);
    for (const c of checks) expect(c).toMatch(/exclusion \[.*\] \[/);
  });
});

// --------------------------------------------------------------------------

/**
 * The search that names nothing, and the number it settles on.
 *
 * Every object in every vector, under every exclusion set declared in the same
 * file, matched against any 64-hex string in that file. No payload member name,
 * no identifier member name, no value.
 *
 * It exists because the search before it named five identifier members read off
 * the corpus, and three vectors carry theirs under a sixth name, `digest`. The
 * count of vectors exercising §5 has been 3, 10, 12, 14, 15 and now 18, and
 * every one of the first five was produced by a search scoped by something.
 */
describe.runIf(AVAILABLE)("§5 discovery — the search that names nothing", () => {
  const dir = DIR as string;

  it("eighteen files exercise §5: sixteen with an observable removal, two more that name the result", () => {
    const split = section5Files(discoverSection5(dir));
    expect(split.removalObservable.length).toBe(16);
    expect(split.identifierNamedNoop.length).toBe(2);
    expect(split.all.length).toBe(18);
  });

  it("the three the previous search could not see, and why it could not", () => {
    // kats 08, 09 and 22 each carry a payload, a NON-EMPTY exclusion set and the
    // derived identifier of the reduced payload — under the member name
    // `digest`, which was not among the five names the previous search knew.
    // kat-22 is the top-level-only matching rule, and it is a falsification
    // test the draft's own author proposed; it had been counted as a §4.1
    // vector and never as a §5 one.
    const split = section5Files(discoverSection5(dir));
    for (const f of [
      "jcs-n/kats/08-exclusion-set.json",
      "jcs-n/kats/09-exclusion-before-normalization.json",
      "jcs-n/kats/22-exclusion-depth-top-level-only.json",
    ]) {
      expect(split.removalObservable, f).toContain(f);
    }
    // And the reason: none of them pins under a name containing derived_id.
    const hits = discoverSection5(dir).filter((h) => h.file.includes("kats/22-"));
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((h) => h.pinnedAt.every((x) => !x.includes("derived_id")))).toBe(true);
  });

  it("twenty-eight §4.1 vectors are found, classified and NOT counted", () => {
    // The trap this search has to avoid: on an EMPTY exclusion set, §5 and §4.1
    // are the same operation, and most kats declare an empty exclusion set. A
    // search that counted every match would report 46 files and the number
    // would mean nothing. These are found and excluded, and the exclusion is
    // asserted rather than assumed.
    const split = section5Files(discoverSection5(dir));
    expect(split.notSection5.length).toBe(28);
    for (const f of split.notSection5) expect(split.all).not.toContain(f);
    expect(split.all.length + split.notSection5.length).toBe(46);
  });

  it("it is a superset of the search before it, which is the only reason it replaces it", () => {
    // Fifteen files were reported before this search existed. All fifteen are
    // still here; a search that found three more while losing one would not be
    // an improvement, it would be a different answer.
    const all = new Set(section5Files(discoverSection5(dir)).all);
    for (const f of runSection5Reproducers(dir).map((r) => r.vector.split(" ")[0])) {
      expect(all, f).toContain(f);
    }
    expect(all.size).toBe(18);
  });

  it("the one cross-file inference is still exactly one, and still marked", () => {
    const inferred = discoverSection5(dir).filter((h) => h.exclusionSource.startsWith("INFERRED"));
    expect(new Set(inferred.map((h) => h.file)).size).toBe(1);
    expect(inferred[0]!.file).toContain("profile-independence/fail/01");
    expect(inferred[0]!.exclusionSource).toContain("authorization-doc");
  });

  it("CONTROL: every reported identifier is one this run recomputed, not one read out of the file", () => {
    // The search matches a computed digest against strings in the file. If it
    // ever reported a hit it had not computed, the whole method would be a text
    // search wearing a digest's clothes. Recompute one independently.
    const hit = discoverSection5(dir).find((h) => h.file.includes("kats/08-exclusion-set"));
    expect(hit).toBeDefined();
    expect(hit!.identifier).toBe("7951deff61d4304af5863a13c2ef570ffc96f1d8df5fb3214743dc9953b8aeea");
    expect(hit!.exclusionSet).toEqual(["id"]);
    // kat-08's note says this digest equals kat-01's: the excluded field does
    // not affect the canonical form. That is the vector's own claim, and it
    // holds here, which is a check on the removal step rather than on the hash.
    const basic = canonicalDigestJcs({ b: "x", a: "y" });
    expect(basic.ok).toBe(true);
    if (!basic.ok) throw new Error("unreachable");
    expect(basic.value.hex).toBe(hit!.identifier);
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
