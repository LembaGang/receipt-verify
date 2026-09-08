// The digest walker (tools/walk-digests.ts), under its own controls.
//
// The walker exists because M6 stayed green for 29 days: the only tests that
// named the stale value recomputed the expectation with the function under
// test. A test suite for the walker that asserted only "the walker runs" would
// repeat that mistake one level up. So this file asserts three things that can
// each fail for a stated reason:
//
//   positive  -- on the pinned corpora the walker finds M6 UNAIDED, in exactly
//                the five counterparty_binding vectors, at exactly the two
//                commits where the literal is stale, and reports match at the
//                two commits where it is not. Nothing in walker/scopes.json
//                names M6 or those vectors; the finding falls out of the scope
//                marques-08 s5.7 states.
//   negative  -- one byte changed inside a `canonical` string of a throwaway
//                copy produces new mismatches, and they are the ones that byte
//                can explain. A walker that reported nothing here would be
//                decoration.
//   determinism -- two runs produce byte-identical report bodies, so a diff
//                between two runs means the corpora moved and never that the
//                tool is noisy. This is what makes the walker usable as a watch
//                loop rather than only as a one-off.

import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { ROOT } from "./helpers.js";

interface Row {
  corpus: string;
  file: string;
  /** Null on a rule_idle row: that row is about a rule, not about a field. */
  pointer: string | null;
  declared: string | null;
  recomputed: string | null;
  outcome: string;
  rule: string | null;
  /** Set on every row; "declared_opaque" on a declaration row. */
  status: string | null;
  /** Where a declared_opaque row's declaration came from. Absent on other rows. */
  source?: string;
}
interface Report {
  header: Record<string, string>;
  body: { rows: Row[]; totals: Record<string, number>; per_corpus: Record<string, Record<string, number>> };
}

/** Run the walker. Returns its report and exit code; a non-zero exit is expected on the pinned corpora. */
function walk(opts: { root?: string; report: string; scopes?: string }): { report: Report; code: number } {
  const args = ["tsx", join(ROOT, "tools", "walk-digests.ts"), "--report", opts.report];
  if (opts.root) args.push("--root", opts.root);
  if (opts.scopes) args.push("--scopes", opts.scopes);
  let code = 0;
  try {
    execFileSync("npx", args, { cwd: ROOT, stdio: "pipe", shell: process.platform === "win32" });
  } catch (e) {
    code = Number((e as { status?: number }).status ?? -1);
  }
  return { report: JSON.parse(readFileSync(opts.report, "utf8")) as Report, code };
}

const tmp = () => mkdtempSync(join(tmpdir(), "walker-"));

/**
 * The same run, but keeping stdout, stderr and the exit code instead of the
 * report. The declared_opaque assertions need two things `walk` cannot give:
 * the SUMMARY line the walker prints, and the behaviour when the walker REFUSES
 * to run at all -- in which case no report is written and parsing one would
 * throw over the failure being asserted.
 */
function walkRaw(opts: { root?: string; report: string; scopes?: string }): { code: number; stdout: string; stderr: string } {
  const args = ["tsx", join(ROOT, "tools", "walk-digests.ts"), "--report", opts.report];
  if (opts.root) args.push("--root", opts.root);
  if (opts.scopes) args.push("--scopes", opts.scopes);
  try {
    const stdout = execFileSync("npx", args, {
      cwd: ROOT, stdio: "pipe", shell: process.platform === "win32", encoding: "utf8",
    });
    return { code: 0, stdout, stderr: "" };
  } catch (e) {
    const err = e as { status?: number; stdout?: string | Buffer; stderr?: string | Buffer };
    return { code: Number(err.status ?? -1), stdout: String(err.stdout ?? ""), stderr: String(err.stderr ?? "") };
  }
}

// One walk of the real corpora, shared by the assertions that only read it.
const baseline = walk({ report: join(tmp(), "report.json") });

describe("digest walker — positive control: M6 is found unaided", () => {
  const mismatches = baseline.report.body.rows.filter((r) => r.outcome === "mismatch");

  const vectorNames = (corpus: string): string[] => {
    const rows = mismatches.filter((r) => r.corpus === corpus);
    const doc = JSON.parse(readFileSync(join(ROOT, rows[0]!.file), "utf8")) as {
      vectors: Array<{ name: string }>;
    };
    return [...new Set(rows.map((r) => doc.vectors[Number(r.pointer.split("/")[2])]!.name))].sort();
  };

  const FIVE = [
    "counterparty_binding_base64url_tolerance",
    "counterparty_binding_envelope_byte_equality",
    "counterparty_binding_happy_path",
    "counterparty_binding_opaque_receipt_ref",
    "counterparty_binding_transport_label_non_trust",
  ];

  it("exits 1, because a corpus with a stale derived value is not a passing corpus", () => {
    expect(baseline.code).toBe(1);
    expect(baseline.report.body.totals["mismatch"]).toBeGreaterThan(0);
  });

  it("finds the stale envelope_hash in exactly the five counterparty_binding vectors at 05c1c49", () => {
    expect(vectorNames("asqav/05c1c49")).toEqual(FIVE);
  });

  it("finds the same five at ee8a3e7, the commit that made the value stale", () => {
    expect(vectorNames("asqav/history/ee8a3e7")).toEqual(FIVE);
  });

  it("reports the declared and recomputed digests M6 names, in every notation the corpus uses", () => {
    // The corpus writes this digest four ways -- hex, base64, base64url, and the
    // bare envelope_hash member -- so compare the DECODED bytes. Asserting on the
    // strings would only be asserting which alphabet each field happens to use.
    const PRE_416 = "0d6c88a16e96fd3429be13e44dc957062f77d417dc0c3ea28e4fa496230de2a9";
    const POST_416 = "e89bf2fe64bd7dab3a606ea265ca14f88f4d161ec0485062a7facee4902c655f";
    const bytes = (s: string): string => {
      const hex = /^[0-9a-f]{64}$/.exec(s);
      if (hex) return s;
      return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("hex");
    };
    const rows = mismatches.filter((r) => r.corpus === "asqav/05c1c49");
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(bytes(`${r.declared}`)).toBe(PRE_416);
      expect(bytes(`${r.recomputed}`)).toBe(POST_416);
    }
    // All four notations are actually exercised, so the decode above is not
    // quietly passing on one shape.
    expect(new Set(rows.map((r) => r.pointer.split("/").pop())).size).toBeGreaterThan(1);
  });

  it("reports match, not mismatch, at 4cbdfc0 and 3e13a0d where the literal was still correct", () => {
    for (const corpus of ["asqav/history/4cbdfc0", "asqav/history/3e13a0d"]) {
      expect(mismatches.filter((r) => r.corpus === corpus)).toEqual([]);
      expect(baseline.report.body.per_corpus[corpus]!["match"]).toBeGreaterThan(0);
    }
  });

  it("finds M6 nowhere else: every mismatch in the run is one of those two corpora", () => {
    // The control that makes the four assertions above mean something. If the
    // walker mismatched broadly, "it found M6" would be an accident of volume.
    expect([...new Set(mismatches.map((r) => r.corpus))].sort()).toEqual([
      "asqav/05c1c49",
      "asqav/history/ee8a3e7",
    ]);
  });

  it("agrees with the second serialiser everywhere, so no digest was compared on one opinion", () => {
    expect(baseline.report.body.totals["serializer_disagreement"]).toBe(0);
  });
});

describe("digest walker — negative control: a one-byte change is caught", () => {
  it("adds mismatches the mutated byte explains, and adds them only where that byte is", () => {
    const dir = tmp();
    cpSync(join(ROOT, "fixtures"), join(dir, "fixtures"), { recursive: true });
    cpSync(join(ROOT, "cpb"), join(dir, "cpb"), { recursive: true });

    const target = join(dir, "fixtures", "asqav", "05c1c49", "conformance", "vectors.json");
    const before = readFileSync(target);
    const clean = walk({ root: dir, report: join(dir, "clean.json") });

    // One byte inside a `canonical` string: the first vector's canonical form
    // carries "read:data"; change one character of the value, which keeps the
    // file parseable so the walker fails on digests rather than on a throw.
    const at = before.indexOf('"canonical": "');
    expect(at).toBeGreaterThan(-1);
    const mutateAt = before.indexOf("read:data", at) + 1;
    expect(mutateAt).toBeGreaterThan(at);
    const after = Buffer.from(before);
    after[mutateAt] = after[mutateAt]! ^ 0x01;
    writeFileSync(target, after);

    let differing = 0;
    for (let i = 0; i < before.length; i++) if (before[i] !== after[i]) differing++;
    expect(differing).toBe(1);

    const dirty = walk({ root: dir, report: join(dir, "dirty.json") });

    const key = (r: Row) => `${r.corpus}|${r.file}|${r.pointer}`;
    const cleanBad = new Set(clean.report.body.rows.filter((r) => r.outcome === "mismatch").map(key));
    const dirtyBad = dirty.report.body.rows.filter((r) => r.outcome === "mismatch");
    const added = dirtyBad.filter((r) => !cleanBad.has(key(r)));

    // Two claims in the registry read that string -- `canonical` is checked
    // against jcs(input), and `sha256` is checked against the canonical bytes,
    // which is the scope the corpus declares for it. One byte therefore breaks
    // two declared values, and both new rows point at the vector that changed.
    expect(added.length).toBe(2);
    expect(added.map((r) => r.pointer).sort()).toEqual(["/vectors/0/canonical", "/vectors/0/sha256"]);
    expect([...new Set(added.map((r) => r.corpus))]).toEqual(["asqav/05c1c49"]);

    // And nothing anywhere else moved.
    expect(dirtyBad.length - cleanBad.size).toBe(2);
  });
});

describe("digest walker — determinism", () => {
  it("two runs produce byte-identical report bodies", () => {
    const dir = tmp();
    const a = join(dir, "a.json");
    const b = join(dir, "b.json");
    walk({ report: a });
    walk({ report: b });
    const bodyOf = (p: string) => JSON.stringify((JSON.parse(readFileSync(p, "utf8")) as Report).body);
    expect(bodyOf(a)).toBe(bodyOf(b));
    // The run time is in the header and is deliberately outside the body, so a
    // diff of two bodies is a statement about the corpora and nothing else.
    const headers = [a, b].map((p) => (JSON.parse(readFileSync(p, "utf8")) as Report).header["run_at"]);
    expect(headers[0]).toBeDefined();
    expect(headers[1]).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// The M6 closure pair, asserted literally. Added 2026-09-05 with the closure run
// against asqav-sdk 3b88156 (fixtures/provenance.md).
//
// The finding was found at 05c1c49 and fixed upstream. Both halves have to stay
// true at once, and each can fail on its own: if the walker went green at 05c1c49
// it would have stopped detecting M6, and if it stayed red at the tip it would be
// reporting a corrected corpus as broken. One assertion cannot cover both.
// ---------------------------------------------------------------------------

/** Copy exactly one pinned corpus into a throwaway root, so its exit code is its own. */
function corpusRoot(id: string): string {
  const dir = tmp();
  cpSync(join(ROOT, "fixtures", "asqav", id), join(dir, "fixtures", "asqav", id), { recursive: true });
  return dir;
}

const TIP = "3b88156";

describe("digest walker — the closure pair: green at the tip, red at 05c1c49", () => {
  const tip = walk({ root: corpusRoot(TIP), report: join(tmp(), "tip.json") });
  const old = walk({ root: corpusRoot("05c1c49"), report: join(tmp(), "old.json") });

  it("exits 0 on the pinned tip, with no mismatch and no serializer disagreement", () => {
    expect(tip.code).toBe(0);
    expect(tip.report.body.totals["mismatch"]).toBe(0);
    expect(tip.report.body.totals["serializer_disagreement"]).toBe(0);
  });

  it("grades all fourteen published renderings of the tip's envelope_hash, by pointer", () => {
    // The fourteen slots the closure counts from the bytes: six on the `expected`
    // shape #473 introduced, four on input.counterparty_binding, and four carried
    // inside the `canonical` strings that recompute from those inputs. Listing
    // them by pointer is the point -- a green that graded ten of the fourteen and
    // left six `unregistered` would still print mismatch=0.
    const FOURTEEN = [
      "/vectors/14/canonical",
      "/vectors/14/expected/envelope_hash_base64",
      "/vectors/14/expected/envelope_hash_hex",
      "/vectors/14/input/counterparty_binding/envelope_hash",
      "/vectors/15/expected/envelope_hash_base64",
      "/vectors/15/expected/envelope_hash_base64url",
      "/vectors/16/canonical",
      "/vectors/16/expected/envelope_hash_base64",
      "/vectors/16/expected/envelope_hash_base64url",
      "/vectors/16/input/counterparty_binding/envelope_hash",
      "/vectors/17/canonical",
      "/vectors/17/input/counterparty_binding/envelope_hash",
      "/vectors/18/canonical",
      "/vectors/18/input/counterparty_binding/envelope_hash",
    ];
    const byPtr = new Map(tip.report.body.rows.map((r) => [r.pointer, r]));
    for (const p of FOURTEEN) {
      const row = byPtr.get(p);
      expect(row, `no walker row grades ${p}`).toBeDefined();
      expect(row!.outcome, `${p} is ${row!.outcome}, not match`).toBe("match");
      expect(row!.rule, `${p} is graded by no registered rule`).not.toBeNull();
    }
    // And the six that moved are graded by the rule registered for the SHAPE they
    // moved to, not by some other rule that happens to touch the same pointer and
    // not by the rule that names the shape they moved away from. That distinction
    // is the whole point of the split: one rule spanning both shapes could not say
    // which shape belonged to which corpus revision.
    const moved = FOURTEEN.filter((x) => x.includes("/expected/"));
    expect(moved.length).toBe(6);
    for (const p of moved) expect(byPtr.get(p)!.rule).toBe("asqav.counterparty.envelope_hash.expected");
    // The input side did not move, and is graded by the rule that says so.
    for (const p of FOURTEEN.filter((x) => x.includes("/input/counterparty_binding/"))) {
      expect(byPtr.get(p)!.rule).toBe("asqav.counterparty.envelope_hash.input");
    }
    // The old shape's rule is not applied to this corpus at all -- it grades no
    // row here, rather than grading zero rows and looking idle.
    expect(tip.report.body.rows.some((r) => r.rule === "asqav.counterparty.envelope_hash")).toBe(false);
  });

  it("stays red at 05c1c49, on exactly the ten M6 pointers and no others", () => {
    expect(old.code).toBe(1);
    expect(old.report.body.rows.filter((r) => r.outcome === "mismatch").map((r) => r.pointer).sort()).toEqual([
      "/vectors/14/counterparty_binding/envelope_hash_base64",
      "/vectors/14/counterparty_binding/envelope_hash_hex",
      "/vectors/14/input/counterparty_binding/envelope_hash",
      "/vectors/15/counterparty_binding/envelope_hash_base64",
      "/vectors/15/counterparty_binding/envelope_hash_base64url",
      "/vectors/16/counterparty_binding/envelope_hash_base64",
      "/vectors/16/counterparty_binding/envelope_hash_base64url",
      "/vectors/16/input/counterparty_binding/envelope_hash",
      "/vectors/17/input/counterparty_binding/envelope_hash",
      "/vectors/18/input/counterparty_binding/envelope_hash",
    ]);
  });

  it("reads counterparty_binding.scope rather than assuming one: an unknown value is a mismatch", () => {
    // The red case for the scope change. Without it, the tip would grade green for
    // a reason that has nothing to do with the member being read -- so "the walker
    // reads scope" needs an input where ignoring the member gives a different
    // answer, and this is it.
    const dir = corpusRoot(TIP);
    const target = join(dir, "fixtures", "asqav", TIP, "conformance", "vectors.json");
    const doc = JSON.parse(readFileSync(target, "utf8")) as {
      vectors: Array<{ name: string; input?: { counterparty_binding?: { scope?: string } } }>;
    };
    const v = doc.vectors.find((x) => x.name === "counterparty_binding_happy_path")!;
    expect(v.input!.counterparty_binding!.scope).toBe("envelope_minus_anchors");
    v.input!.counterparty_binding!.scope = "envelope_over_something_no_document_defines";
    writeFileSync(target, JSON.stringify(doc, null, 2));

    const dirty = walk({ root: dir, report: join(tmp(), "scope.json") });
    expect(dirty.code).toBe(1);
    const bad = dirty.report.body.rows.filter((r) => r.outcome === "mismatch");
    // Everything the edit broke is in the vector the edit touched.
    expect([...new Set(bad.map((r) => r.pointer.split("/").slice(0, 3).join("/")))]).toEqual(["/vectors/14"]);

    // Three of the four are the envelope rules refusing to grade an unknown scope:
    // recomputed is null because the row was compared against neither construction.
    // They are three rows under TWO rules, one per published shape, and the pairing
    // is asserted rather than collapsed -- a filter on "any envelope rule" would
    // pass just as happily if the split had put every row under one of them.
    const byRule = bad.filter((r) => (r.rule ?? "").startsWith("asqav.counterparty.envelope_hash"));
    expect(byRule.map((r) => `${r.rule} ${r.pointer}`).sort()).toEqual([
      "asqav.counterparty.envelope_hash.expected /vectors/14/expected/envelope_hash_base64",
      "asqav.counterparty.envelope_hash.expected /vectors/14/expected/envelope_hash_hex",
      "asqav.counterparty.envelope_hash.input /vectors/14/input/counterparty_binding/envelope_hash",
    ]);
    for (const r of byRule) expect(r.recomputed).toBeNull();

    // The `expected` block carries no scope member of its own; it reached the
    // unknown value through the sibling input.counterparty_binding.scope, which is
    // the resolution chain walker/scopes.json documents. Two of the three rows
    // above are that chain working.
    //
    // The fourth is a true positive of a different kind and is kept, not filtered:
    // editing `input` also invalidates the published `canonical`, and the walker
    // says so with the bytes it recomputed.
    const rest = bad.filter((r) => !(r.rule ?? "").startsWith("asqav.counterparty.envelope_hash"));
    expect(rest.map((r) => r.pointer)).toEqual(["/vectors/14/canonical"]);
    expect(rest[0]!.recomputed).not.toBeNull();
  });

  it("registers one expected refusal, and any other refusal still fails the run", () => {
    // The refusal allowance is the one thing here that turns a red outcome green,
    // so it carries the tightest control in the file. The registered entry matches
    // on the exact refusal text; a different out-of-range integer produces a
    // different text, matches nothing, and the run goes back to exit 1.
    expect(tip.report.body.totals["expected_refusal"]).toBe(1);
    expect(
      tip.report.body.rows.filter((r) => r.outcome === "expected_refusal").map((r) => r.pointer),
    ).toEqual(["/vectors/25/canonical"]);

    const dir = corpusRoot(TIP);
    const target = join(dir, "fixtures", "asqav", TIP, "conformance", "vectors.json");
    const raw = readFileSync(target, "utf8");
    expect(raw).toContain("9007199254740992");
    writeFileSync(target, raw.split("9007199254740992").join("9007199254740994"));

    const dirty = walk({ root: dir, report: join(tmp(), "refusal.json") });
    expect(dirty.code).toBe(1);
    expect(dirty.report.body.totals["serializer_disagreement"]).toBeGreaterThan(0);
    expect(dirty.report.body.totals["expected_refusal"]).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// The registry's version dimension: applies_to, and the rule_idle row.
//
// The quiet failure mode of a versioned registry is a rule that has STOPPED
// matching. Upstream reshapes its corpus, the rule naming the old shape matches
// zero pointers, and a zero-row rule is indistinguishable from a rule with
// nothing to do -- which is exactly how the `expected` shape #473 introduced
// could have gone ungraded while the walker printed green. These assertions are
// about that silence being audible.
// ---------------------------------------------------------------------------

describe("digest walker — applies_to and the rule_idle row", () => {
  const idle = baseline.report.body.rows.filter((r) => r.outcome === "rule_idle");

  it("emits a rule_idle row per applied rule that matched nothing, with a null pointer", () => {
    expect(idle.length).toBe(baseline.report.body.totals["rule_idle"]);
    expect(idle.length).toBeGreaterThan(0);
    for (const r of idle) {
      expect(r.pointer).toBeNull();
      expect(r.rule).not.toBeNull();
      expect(r.declared).toBeNull();
      expect(r.recomputed).toBeNull();
    }
    // Named exactly, so a rule going idle that is not on this list is a diff and
    // not a shrug.
    //
    // This list was ten rows until 2026-09-06. Eight of them were the two chain
    // rules the four conformance/vectors.json-only asqav corpora inherited, and
    // they were idle because the tree those rules grade -- verifier/conformance-
    // vectors/ -- is ABSENT from all four, which `find` settles. A rule kept
    // applied to a corpus that cannot carry its input is idle forever, and a
    // column that is permanently non-zero stops being read, so the inheritance
    // was removed at each with a corpus_note. The two that remain are the two
    // that are idle for a reason a byte could change tomorrow.
    expect(idle.map((r) => `${r.corpus} ${r.rule}`).sort()).toEqual([
      // the third chain scope no document in refs/ defines, registered as
      // deliberately unrecomputable
      "acta/synthetic acta.synthetic.chain.marques-signing-input",
      // this corpus carries no checkpoint record; `delivery` does, and there the
      // same rule kind grades 4
      "evidence-action ea.checkpoint_last_entry_hash",
    ]);
  });

  // The control for the removal above: the two chain rules must still be APPLIED
  // and still grade at 05c1c49, which does carry the tree. Un-applying a rule
  // everywhere would have produced the same empty idle list and graded nothing.
  it("the two chain rules still grade at 05c1c49, the one asqav corpus that carries their input", () => {
    const graded = baseline.report.body.rows.filter(
      (r) => r.corpus === "asqav/05c1c49" && (r.rule === "asqav.chain.asqav.payload" || r.rule === "asqav.chain.acta.whole"),
    );
    expect(graded.map((r) => r.rule).sort()).toEqual(["asqav.chain.acta.whole", "asqav.chain.asqav.payload"]);
    for (const r of graded) {
      expect(r.outcome).toBe("match");
      expect(r.pointer).not.toBeNull();
    }
    // ...and they are not merely silent at the other four: they are not applied
    // there at all, which is a different fact and the one the corpus_note states.
    const elsewhere = baseline.report.body.rows.filter(
      (r) => r.corpus !== "asqav/05c1c49" && (r.rule === "asqav.chain.asqav.payload" || r.rule === "asqav.chain.acta.whole"),
    );
    expect(elsewhere).toEqual([]);
  });

  it("does not fail the run and does not inflate `registered`", () => {
    // rule_idle is a coverage fact, not a wrong digest. The exit code is decided
    // by mismatch and serializer_disagreement alone, and a rule_idle row grades no
    // field, so it must not be counted among the registered ones. declared_opaque
    // is excluded on the same argument and is asserted here rather than only in its
    // own block: `registered` must equal the rows that actually graded something,
    // whatever new row kinds the walker grows.
    for (const [id, c] of Object.entries(baseline.report.body.per_corpus)) {
      const rows = baseline.report.body.rows.filter((r) => r.corpus === id);
      const graded = rows.filter(
        (r) => r.outcome !== "unregistered" && r.outcome !== "rule_idle" && r.outcome !== "declared_opaque",
      ).length;
      expect(c["registered"], `registered at ${id}`).toBe(graded);
      expect(c["rule_idle"], `rule_idle at ${id}`).toBe(rows.filter((r) => r.outcome === "rule_idle").length);
    }
  });

  it("applies each counterparty shape only to the corpus revision that publishes it", () => {
    // The split, asserted from both sides. Each side can fail alone: applying the
    // expected-shape rule at 05c1c49 would grade a shape that corpus never
    // published, and applying the counterparty_binding-shape rule at 3b88156 would
    // grade a shape upstream #473 removed.
    const at = (corpus: string, rule: string) =>
      baseline.report.body.rows.some((r) => r.corpus === corpus && r.rule === rule);

    for (const old of ["asqav/05c1c49", "asqav/history/3e13a0d", "asqav/history/4cbdfc0", "asqav/history/ee8a3e7"]) {
      expect(at(old, "asqav.counterparty.envelope_hash"), `${old} grades the counterparty_binding shape`).toBe(true);
      expect(at(old, "asqav.counterparty.envelope_hash.expected"), `${old} must not grade the expected shape`).toBe(false);
    }
    expect(at("asqav/3b88156", "asqav.counterparty.envelope_hash.expected")).toBe(true);
    expect(at("asqav/3b88156", "asqav.counterparty.envelope_hash")).toBe(false);
    // The input side did not move and is graded at every one of the five.
    for (const c of ["asqav/05c1c49", "asqav/3b88156", "asqav/history/3e13a0d", "asqav/history/4cbdfc0", "asqav/history/ee8a3e7"]) {
      expect(at(c, "asqav.counterparty.envelope_hash.input"), `${c} grades the input shape`).toBe(true);
    }
    // And no envelope rule is idle anywhere: every registered shape matched.
    expect(idle.filter((r) => (r.rule ?? "").includes("envelope_hash"))).toEqual([]);
  });

  it("a deliberately misapplied rule produces exactly one rule_idle row", () => {
    // The red case. Without it, "the walker emits rule_idle" is asserted only
    // against rules that were already idle before the member existed -- which is
    // the walker agreeing with its own registry. Here a rule is pointed at a
    // corpus that cannot possibly satisfy it, and the row has to appear.
    const scopes = JSON.parse(readFileSync(join(ROOT, "walker", "scopes.json"), "utf8")) as {
      corpora: Array<{ id: string; rules?: Array<Record<string, unknown>> }>;
    };
    const vs = scopes.corpora.find((c) => c.id === "verification-state")!;
    vs.rules!.push({
      id: "test.misapplied",
      file: "no/such/file.json",
      kind: "acta_canonical_sha256",
      field: "/receipt_canonical_sha256",
      construction: "sha256(jcs(a sibling receipt.json that does not exist in this corpus))",
      status: "inferred",
      document: null,
      lines: null,
      applies_to: ["verification-state"],
    });
    const alt = join(tmp(), "scopes.json");
    writeFileSync(alt, JSON.stringify(scopes, null, 2));

    const run = walk({ report: join(tmp(), "misapplied.json"), scopes: alt });
    const added = run.report.body.rows.filter((r) => r.outcome === "rule_idle" && r.rule === "test.misapplied");
    expect(added.length).toBe(1);
    expect(added[0]!.corpus).toBe("verification-state");
    expect(added[0]!.pointer).toBeNull();
    expect(run.report.body.totals["rule_idle"]).toBe(baseline.report.body.totals["rule_idle"]! + 1);
    // It changed the coverage report and nothing else: no digest moved, and the
    // exit code is the one the corpora earn, not one the idle rule caused.
    expect(run.report.body.totals["mismatch"]).toBe(baseline.report.body.totals["mismatch"]);
    expect(run.report.body.totals["match"]).toBe(baseline.report.body.totals["match"]);
    expect(run.code).toBe(baseline.code);
  });

  it("a rule that does not APPLY to a corpus is not idle there", () => {
    // Absence of a rule and silence from a rule are different facts, and this is
    // the assertion that keeps them apart. The counterparty_binding-shape rule
    // matches nothing at 3b88156 -- but it does not apply there, so it must not
    // appear as idle. If applies_to were ignored, this row would exist.
    expect(idle.some((r) => r.corpus === "asqav/3b88156" && r.rule === "asqav.counterparty.envelope_hash")).toBe(false);
    expect(idle.some((r) => r.corpus === "asqav/05c1c49" && r.rule === "asqav.counterparty.envelope_hash.expected")).toBe(false);
  });
});

describe("digest walker — the second serialiser reads UTF-8 on every platform", () => {
  it("digests an astral and a fullwidth member name identically with and without PYTHONUTF8", () => {
    // The walker compares two serialisers, and the comparison is only evidence if
    // both received the same bytes. Python decodes stdin at the locale encoding;
    // on a cp1252 machine a non-Latin-1 member name arrived as mojibake and the
    // walker reported a disagreement that was its own harness, not the corpus.
    // No pinned corpus carried such a key until the tip was pinned -- which is to
    // say this check could not have gone red until the day it mattered.
    const script = join(ROOT, "tools", "jcs-cross-check.py");
    // Real UTF-8 bytes, not \u escapes: escapes are ASCII and would not exercise
    // the decode at all.
    const req = Buffer.from(JSON.stringify({ id: "t", value: { "\u{1F600}": 1, "＠": 1 } }) + "\n", "utf8");
    expect(req.includes(Buffer.from([0xf0, 0x9f, 0x98, 0x80]))).toBe(true);

    const run = (utf8: boolean): { len: number; sha256: string } => {
      const env: NodeJS.ProcessEnv = { ...process.env };
      if (utf8) env["PYTHONUTF8"] = "1";
      else delete env["PYTHONUTF8"];
      const out = execFileSync("python", [script], { input: req, env, stdio: "pipe" }).toString("utf8");
      return JSON.parse(out.trim()) as { len: number; sha256: string };
    };

    const a = run(false);
    expect(a).toEqual(run(true));

    // And it is the RIGHT digest, not merely a stable one: the corpus publishes
    // the canonical form and its SHA-256 for this exact object.
    const doc = JSON.parse(
      readFileSync(join(ROOT, "fixtures", "asqav", TIP, "conformance", "vectors.json"), "utf8"),
    ) as { vectors: Array<{ name: string; canonical?: string; sha256?: string }> };
    const v = doc.vectors.find((x) => x.name === "asqav-24-jcs-astral-key-order")!;
    expect(a.sha256).toBe(v.sha256);
    expect(a.len).toBe(Buffer.from(v.canonical!, "utf8").length);
  });
});

// ---------------------------------------------------------------------------
// declared_opaque: a value the FORMAT'S AUTHOR says no third party can recompute.
//
// This is the one status in the registry that comes from outside the registry,
// so it carries the tightest control after the refusal allowance. It removes
// fields from the unregistered census, and anything that removes rows from a
// census has to be unable to remove them quietly. Four assertions:
//
//   (a) the enumerated action_ref pointers moved status and NOTHING else moved:
//       unregistered + declared_opaque is the old unregistered, exactly, and
//       registered/match/mismatch are untouched. A status that changed the grade
//       would be a way to make red things green.
//   (b) an entry missing `source` or `quote` REFUSES the run. The whole claim of
//       this status is "the author said so, here is where"; an entry that cannot
//       say where is worse than no entry, because it reads as sourced.
//   (c) an entry matching no pointer is reported with a null pointer and counted,
//       the rule_idle pattern. A declaration must not outlive the member it names.
//   (d) the printed SUMMARY carries the count. A status only in report.json is a
//       status nobody reads.
// ---------------------------------------------------------------------------

describe("digest walker — declared_opaque", () => {
  // Enumerated from the corpus bytes, not copied from the letter that asked for
  // them: every `action_ref` in fixtures/asqav/{22a970d,a21d060}/conformance/
  // vectors.json. Seven, in both, which are byte-identical files. Six of them
  // (vectors 14-19, the counterparty_binding_* set) took the sha256: wire form
  // in upstream 0b5fa1e (#484) and are the six the author named; the seventh,
  // /vectors/20/input/action_ref on receipt_v2_signer_canary, already carried
  // that form at 3b88156 and at every earlier pin.
  const OPAQUE = [
    "/vectors/14/input/action_ref",
    "/vectors/15/input/payload/action_ref",
    "/vectors/16/input/action_ref",
    "/vectors/17/input/action_ref",
    "/vectors/18/input/action_ref",
    "/vectors/19/input/action_ref",
    "/vectors/20/input/action_ref",
  ];
  const CORPORA = ["asqav/22a970d", "asqav/a21d060"];
  // The B-128 end state, read from the run this change starts from. Written as
  // literals so the assertion cannot drift with the thing it measures.
  const BEFORE = { registered: 60, match: 59, mismatch: 0, unregistered: 38, declared_opaque: 0 };

  it("(a) reports the enumerated action_ref pointers as declared_opaque, not unregistered, on both corpora", () => {
    for (const corpus of CORPORA) {
      const mine = baseline.report.body.rows.filter((r) => r.corpus === corpus);
      const opaque = mine.filter((r) => r.outcome === "declared_opaque");
      expect(opaque.map((r) => r.pointer).sort(), `${corpus} declared_opaque pointers`).toEqual([...OPAQUE].sort());
      // None of them is still in the census, and no OTHER field left it.
      expect(mine.filter((r) => r.outcome === "unregistered" && String(r.pointer).endsWith("action_ref"))).toEqual([]);

      const c = baseline.report.body.per_corpus[corpus]!;
      expect(c["declared_opaque"], `${corpus} declared_opaque count`).toBe(OPAQUE.length);
      expect(c["unregistered"], `${corpus} unregistered count`).toBe(BEFORE.unregistered - OPAQUE.length);
      // The conserved quantity: the census did not shrink, it was re-labelled.
      expect(c["unregistered"]! + c["declared_opaque"]!).toBe(BEFORE.unregistered + BEFORE.declared_opaque);
      // And the grade is untouched: a declared value is not graded, so it is not
      // `registered` either, and no digest moved.
      expect(c["registered"], `${corpus} registered`).toBe(BEFORE.registered);
      expect(c["match"], `${corpus} match`).toBe(BEFORE.match);
      expect(c["mismatch"], `${corpus} mismatch`).toBe(BEFORE.mismatch);
    }
    // Every declared_opaque row names where the declaration came from. A row
    // without a source is the failure this status exists to prevent.
    const all = baseline.report.body.rows.filter((x) => x.outcome === "declared_opaque");
    expect(all.length).toBe(OPAQUE.length * CORPORA.length);
    for (const r of all) {
      expect(r.status).toBe("declared_opaque");
      expect(String(r.source)).toContain("1a080c1f84f6d1a1");
    }
  });

  it("(b) refuses to run on a declaration missing its source or its quote", () => {
    for (const missing of ["source", "quote"] as const) {
      const scopes = JSON.parse(readFileSync(join(ROOT, "walker", "scopes.json"), "utf8")) as {
        corpora: Array<{ id: string; declared_opaque?: Array<Record<string, unknown>> }>;
      };
      const c = scopes.corpora.find((x) => x.id === "asqav/a21d060")!;
      expect(c.declared_opaque, "the corpus carries declarations to strip").toBeTruthy();
      delete c.declared_opaque![0]![missing];
      const alt = join(tmp(), "scopes.json");
      writeFileSync(alt, JSON.stringify(scopes, null, 2));

      const run = walkRaw({ report: join(tmp(), `no-${missing}.json`), scopes: alt });
      // Not 0 (clean) and not 1 (the exit the corpora earn): a refusal to run.
      expect(run.code, `missing ${missing} must refuse the run`).toBe(2);
      expect(run.stderr).toContain("declared_opaque");
      expect(run.stderr).toContain(missing);
    }
  });

  it("(c) reports a declaration that matches nothing as one null-pointer row, and counts it", () => {
    // The red case for (a). Without it, "the pointers are declared_opaque" is the
    // walker agreeing with a list someone wrote. Here the list names a member that
    // is not in the corpus and the row has to appear anyway. It is the rule_idle
    // argument applied to a declaration: an upstream that settles the rework and
    // drops the field leaves this entry matching nothing, and a zero-row
    // declaration looks exactly like a satisfied one.
    const scopes = JSON.parse(readFileSync(join(ROOT, "walker", "scopes.json"), "utf8")) as {
      corpora: Array<{ id: string; declared_opaque?: Array<Record<string, unknown>> }>;
    };
    const c = scopes.corpora.find((x) => x.id === "asqav/a21d060")!;
    c.declared_opaque!.push({ ...c.declared_opaque![0]!, pointer: "/vectors/99/input/action_ref" });
    const alt = join(tmp(), "scopes.json");
    writeFileSync(alt, JSON.stringify(scopes, null, 2));

    const run = walk({ report: join(tmp(), "unmatched.json"), scopes: alt });
    const added = run.report.body.rows.filter(
      (r) => r.outcome === "declared_opaque" && r.pointer === null && r.corpus === "asqav/a21d060",
    );
    expect(added.length).toBe(1);
    expect(run.report.body.per_corpus["asqav/a21d060"]!["declared_opaque"]).toBe(OPAQUE.length + 1);
    expect(run.report.body.totals["declared_opaque"]).toBe(baseline.report.body.totals["declared_opaque"]! + 1);
    // It changed the coverage report and nothing else.
    expect(run.report.body.totals["match"]).toBe(baseline.report.body.totals["match"]);
    expect(run.report.body.totals["mismatch"]).toBe(baseline.report.body.totals["mismatch"]);
    expect(run.report.body.totals["unregistered"]).toBe(baseline.report.body.totals["unregistered"]);
    expect(run.code).toBe(baseline.code);
  });

  it("(d) prints declared_opaque on the SUMMARY and on the per-corpus lines", () => {
    const run = walkRaw({ report: join(tmp(), "summary.json") });
    const total = OPAQUE.length * CORPORA.length;
    expect(run.stdout).toContain(`declared_opaque=${total};`);
    expect(run.stdout).toContain(`match=${baseline.report.body.totals["match"]} `);
    expect(run.stdout).toContain(`mismatch=${baseline.report.body.totals["mismatch"]} `);
    for (const corpus of CORPORA) {
      const line = run.stdout.split("\n").find((l) => l.includes(corpus) && l.includes("registered="));
      expect(line, `a per-corpus line for ${corpus}`).toBeTruthy();
      expect(line).toContain(`declared_opaque=${OPAQUE.length}`);
      expect(line).toContain(`unregistered=${String(BEFORE.unregistered - OPAQUE.length).padStart(4)}`);
    }
  });
});
