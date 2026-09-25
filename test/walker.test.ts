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
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
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
function walk(opts: { root?: string; report: string; scopes?: string; upstreams?: string }): { report: Report; code: number } {
  const args = ["tsx", join(ROOT, "tools", "walk-digests.ts"), "--report", opts.report];
  if (opts.root) args.push("--root", opts.root);
  if (opts.scopes) args.push("--scopes", opts.scopes);
  if (opts.upstreams) args.push("--upstreams", opts.upstreams);
  let code = 0;
  try {
    execFileSync("npx", args, { cwd: ROOT, stdio: "pipe", shell: process.platform === "win32" });
  } catch (e) {
    code = Number((e as { status?: number }).status ?? -1);
  }
  return { report: JSON.parse(readFileSync(opts.report, "utf8")) as Report, code };
}

const tmp = () => mkdtempSync(join(tmpdir(), "walker-"));

/** An RFC 8785 serialiser independent of the walker's two, for computing expected digests in a test. */
const jcsOf = createRequire(import.meta.url)("canonicalize") as (v: unknown) => string;

/**
 * The same run, but keeping stdout, stderr and the exit code instead of the
 * report. The declared_opaque assertions need two things `walk` cannot give:
 * the SUMMARY line the walker prints, and the behaviour when the walker REFUSES
 * to run at all -- in which case no report is written and parsing one would
 * throw over the failure being asserted.
 */
function walkRaw(opts: { root?: string; report: string; scopes?: string; upstreams?: string }): { code: number; stdout: string; stderr: string } {
  const args = ["tsx", join(ROOT, "tools", "walk-digests.ts"), "--report", opts.report];
  if (opts.root) args.push("--root", opts.root);
  if (opts.scopes) args.push("--scopes", opts.scopes);
  if (opts.upstreams) args.push("--upstreams", opts.upstreams);
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
    const m6 = mismatches.filter((r) => r.corpus !== "asqav/6137cb95");
    expect([...new Set(m6.map((r) => r.corpus))].sort()).toEqual([
      "asqav/05c1c49",
      "asqav/history/ee8a3e7",
    ]);
    // 2026-09-25: asqav/6137cb95, graded under -09, carries four mismatches and
    // they are not M6. Each is a negative vector the corpus itself declares a
    // mismatch (vector 29's `expected.binding_label` "mismatch", asqav-32's
    // `reason_code` "counterparty_mismatch"). Named exactly, so a fifth is a diff.
    expect(
      mismatches.filter((r) => r.corpus === "asqav/6137cb95").map((r) => `${r.file.replace("fixtures/asqav/6137cb95/", "")}#${r.pointer}`).sort(),
    ).toEqual([
      "conformance/vectors.json#/vectors/29/expected/envelope_hash_base64",
      "conformance/vectors.json#/vectors/29/expected/envelope_hash_hex",
      "conformance/vectors.json#/vectors/29/input/counterparty_binding/envelope_hash",
      "verifier/conformance-vectors/asqav-32-counterparty-anchors-included/receipt.json#/payload/counterparty_binding/envelope_hash",
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
      // 2026-09-25: declared_opaque_expired excluded too; the walker subtracts it from `registered` and this recount did not.
      // 2026-09-25: and input_absent and the two -09 unverifiable scope outcomes, which grade nothing either.
      const ungraded = ["unregistered", "rule_idle", "declared_opaque", "declared_opaque_expired", "input_absent", "unverifiable_legacy_scope", "unverifiable_undefined_scope"];
      const graded = rows.filter((r) => !ungraded.includes(r.outcome)).length;
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

// The fourteen action_ref declarations were withdrawn on 2026-09-25 (-09 publishes
// the construction; walker/scopes.json `withdrawn_declarations`). The mechanism
// they exercised is unchanged and still has to be proved, so the tests below
// REINSTATE the withdrawn bytes into a throwaway copy of the registry and run the
// walker over that, with fixtures/upstreams.json as it stood before -09 was
// pinned (the -09 entry removed from a throwaway copy). The committed registry
// is asserted separately: it carries no declaration, and the withdrawal is
// visible on every run.
// ---------------------------------------------------------------------------

type ScopesDoc = {
  corpora: Array<{
    id: string;
    rules?: Array<Record<string, unknown>>;
    declared_opaque?: Array<Record<string, unknown>>;
    withdrawn_declarations?: Array<Record<string, unknown>>;
  }>;
};

const DECL_CORPORA = ["asqav/22a970d", "asqav/a21d060"];
const WITHDRAWN_MEMBERS = ["withdrawn_on", "withdrawn_because", "withdrawn_by"];
const MINUS09 = "draft-marques-asqav-compliance-receipts-09";

/** The committed registry, with every withdrawn declaration put back as a live one. */
function reinstated(): ScopesDoc {
  const scopes = JSON.parse(readFileSync(join(ROOT, "walker", "scopes.json"), "utf8")) as ScopesDoc;
  for (const c of scopes.corpora) {
    if (!c.withdrawn_declarations) continue;
    c.declared_opaque = c.withdrawn_declarations.map((w) => {
      const d = { ...w };
      for (const k of WITHDRAWN_MEMBERS) delete d[k];
      return d;
    });
    delete c.withdrawn_declarations;
  }
  return scopes;
}

/** fixtures/upstreams.json without the -09 pin: the world the declarations were written in. */
function upstreamsBefore09(): Record<string, unknown> {
  const ups = JSON.parse(readFileSync(join(ROOT, "fixtures", "upstreams.json"), "utf8")) as {
    upstreams: Array<Record<string, unknown>>;
  };
  ups.upstreams = ups.upstreams.filter((u) => u["id"] !== MINUS09);
  return ups;
}

const writeJsonTmp = (name: string, v: unknown): string => {
  const p = join(tmp(), name);
  writeFileSync(p, JSON.stringify(v, null, 2));
  return p;
};

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
  const CORPORA = DECL_CORPORA;
  // The B-128 end state, read from the run this change starts from. Written as
  // literals so the assertion cannot drift with the thing it measures.
  const BEFORE = { registered: 60, match: 59, mismatch: 0, unregistered: 38, declared_opaque: 0 };

  // One walk over the reinstated registry, in the pre--09 world, shared by the
  // assertions that only read it.
  const live = (() => {
    const report = join(tmp(), "reinstated.json");
    const raw = walkRaw({
      report,
      scopes: writeJsonTmp("scopes.json", reinstated()),
      upstreams: writeJsonTmp("upstreams.json", upstreamsBefore09()),
    });
    return { raw, body: (JSON.parse(readFileSync(report, "utf8")) as Report).body };
  })();

  it("(a) reports the enumerated action_ref pointers as declared_opaque, not unregistered, on both corpora", () => {
    for (const corpus of CORPORA) {
      const mine = live.body.rows.filter((r) => r.corpus === corpus);
      const opaque = mine.filter((r) => r.outcome === "declared_opaque");
      expect(opaque.map((r) => r.pointer).sort(), `${corpus} declared_opaque pointers`).toEqual([...OPAQUE].sort());
      // None of them is still in the census, and no OTHER field left it.
      expect(mine.filter((r) => r.outcome === "unregistered" && String(r.pointer).endsWith("action_ref"))).toEqual([]);

      const c = live.body.per_corpus[corpus]!;
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
    const all = live.body.rows.filter((x) => x.outcome === "declared_opaque");
    expect(all.length).toBe(OPAQUE.length * CORPORA.length);
    for (const r of all) {
      expect(r.status).toBe("declared_opaque");
      expect(String(r.source)).toContain("1a080c1f84f6d1a1");
    }
  });

  it("(b) refuses to run on a declaration missing its source or its quote", () => {
    for (const missing of ["source", "quote"] as const) {
      const scopes = reinstated();
      const c = scopes.corpora.find((x) => x.id === "asqav/a21d060")!;
      expect(c.declared_opaque, "the corpus carries declarations to strip").toBeTruthy();
      delete c.declared_opaque![0]![missing];

      const run = walkRaw({ report: join(tmp(), `no-${missing}.json`), scopes: writeJsonTmp("scopes.json", scopes) });
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
    const scopes = reinstated();
    const c = scopes.corpora.find((x) => x.id === "asqav/a21d060")!;
    c.declared_opaque!.push({ ...c.declared_opaque![0]!, pointer: "/vectors/99/input/action_ref" });

    const report = join(tmp(), "unmatched.json");
    walkRaw({ report, scopes: writeJsonTmp("scopes.json", scopes), upstreams: writeJsonTmp("upstreams.json", upstreamsBefore09()) });
    const body = (JSON.parse(readFileSync(report, "utf8")) as Report).body;
    const added = body.rows.filter(
      (r) => r.outcome === "declared_opaque" && r.pointer === null && r.corpus === "asqav/a21d060",
    );
    expect(added.length).toBe(1);
    expect(body.per_corpus["asqav/a21d060"]!["declared_opaque"]).toBe(OPAQUE.length + 1);
    expect(body.totals["declared_opaque"]).toBe(live.body.totals["declared_opaque"]! + 1);
    // It changed the coverage report and nothing else.
    expect(body.totals["match"]).toBe(live.body.totals["match"]);
    expect(body.totals["mismatch"]).toBe(live.body.totals["mismatch"]);
    expect(body.totals["unregistered"]).toBe(live.body.totals["unregistered"]);
  });

  it("(d) prints declared_opaque on the SUMMARY and on the per-corpus lines", () => {
    const total = OPAQUE.length * CORPORA.length;
    expect(live.raw.stdout).toMatch(new RegExp(`SUMMARY .*declared_opaque=${total}[ ;]`));
    expect(live.raw.stdout).toContain(`match=${live.body.totals["match"]} `);
    expect(live.raw.stdout).toContain(`mismatch=${live.body.totals["mismatch"]} `);
    for (const corpus of CORPORA) {
      const line = live.raw.stdout.split("\n").find((l) => l.includes(corpus) && l.includes("registered="));
      expect(line, `a per-corpus line for ${corpus}`).toBeTruthy();
      expect(line).toContain(`declared_opaque=${OPAQUE.length}`);
      expect(line).toContain(`unregistered=${String(BEFORE.unregistered - OPAQUE.length).padStart(4)}`);
    }
  });
});

// ---------------------------------------------------------------------------
// withdrawn_declarations: the committed registry, after the -09 re-read.
// ---------------------------------------------------------------------------
describe("digest walker — withdrawn_declarations", () => {
  const scopes = JSON.parse(readFileSync(join(ROOT, "walker", "scopes.json"), "utf8")) as ScopesDoc;

  it("the committed registry carries no declaration and fourteen withdrawn ones, each dated, reasoned and attributed", () => {
    const decls = scopes.corpora.flatMap((c) => c.declared_opaque ?? []);
    expect(decls).toEqual([]);
    for (const id of DECL_CORPORA) {
      const w = scopes.corpora.find((c) => c.id === id)!.withdrawn_declarations!;
      expect(w.length, `${id} withdrawn`).toBe(7);
      for (const e of w) {
        expect(e["withdrawn_on"]).toBe("2026-09-25");
        expect(String(e["withdrawn_because"])).toContain("lines 1113 to 1114");
        expect(String(e["withdrawn_by"])).toContain("2026-09-24");
        // Kept as bytes: what was declared is still there to be read.
        expect(String(e["source"])).toContain("1a080c1f84f6d1a1");
        expect(e["quote"]).toBeTruthy();
      }
    }
  });

  it("a withdrawn entry grades nothing and matches nothing, and the run says how many there are", () => {
    for (const id of DECL_CORPORA) {
      const mine = baseline.report.body.rows.filter((r) => r.corpus === id);
      // No row anywhere carries the withdrawn declaration...
      expect(mine.filter((r) => r.outcome === "declared_opaque" || r.outcome === "declared_opaque_expired")).toEqual([]);
      expect(mine.filter((r) => String(r.source ?? "").includes("1a080c1f84f6d1a1"))).toEqual([]);
      // ...and the fields it named are back in the census, exactly as if it had never been made.
      const actionRefs = mine.filter((r) => String(r.pointer).endsWith("action_ref"));
      expect(actionRefs.length).toBe(7);
      for (const r of actionRefs) expect(r.outcome).toBe("unregistered");
      const c = baseline.report.body.per_corpus[id]!;
      expect(c["withdrawn_declarations"]).toBe(7);
      expect(c["declared_opaque"]).toBe(0);
      expect(c["unregistered"]).toBe(38);
      expect(c["registered"]).toBe(60);
      expect(c["match"]).toBe(59);
      expect(c["mismatch"]).toBe(0);
    }
    const run = walkRaw({ report: join(tmp(), "withdrawn.json") });
    for (const id of DECL_CORPORA) {
      expect(run.stdout.split("\n").some((l) => l.includes("WITHDRAWN") && l.includes(id) && l.includes("withdrawn_declarations=7"))).toBe(true);
    }
    // The control: the same bytes reinstated ARE matched. Without it, "matches
    // nothing" could be a walker that no longer matches declarations at all.
    const report = join(tmp(), "control.json");
    walkRaw({ report, scopes: writeJsonTmp("scopes.json", reinstated()), upstreams: writeJsonTmp("upstreams.json", upstreamsBefore09()) });
    const body = (JSON.parse(readFileSync(report, "utf8")) as Report).body;
    expect(body.totals["declared_opaque"]).toBe(14);
  });

  it("refuses to run (exit 2) on a withdrawn entry missing why it was withdrawn", () => {
    const s = JSON.parse(readFileSync(join(ROOT, "walker", "scopes.json"), "utf8")) as ScopesDoc;
    delete s.corpora.find((c) => c.id === "asqav/a21d060")!.withdrawn_declarations![0]!["withdrawn_because"];
    const run = walkRaw({ report: join(tmp(), "no-because.json"), scopes: writeJsonTmp("scopes.json", s) });
    expect(run.code).toBe(2);
    expect(run.stderr).toContain("withdrawn_declarations[0]");
    expect(run.stderr).toContain("withdrawn_because");
  });
});

// ---------------------------------------------------------------------------
// revisit_when: a declaration expires by measurement rather than by prose.
//
// `until` is a sentence the walker never reads. When the condition it names
// passes, the entry keeps matching, keeps printing green, and keeps saying
// "mid-rework" about a corpus that has settled -- and the row that most needs
// re-reading is the one that looks most satisfied. `revisit_when` is the same
// sentence in a form the tool evaluates against fixtures/upstreams.json, which
// it already reads for drift. No network, no clock, no dates.
//
// The teeth are (a): it fails at HEAD while ANY declaration in the committed
// registry is expired, which buys a five-minute re-review before the next push
// rather than a red on `npm run walk` that blocks an unrelated one. It fired on
// 2026-09-25, when -09 was pinned; the fourteen entries were re-read and
// withdrawn, and (b) now shows the same bytes expiring against the real file.
// ---------------------------------------------------------------------------
describe("digest walker — revisit_when: a declaration expires by measurement", () => {
  const OPAQUE_PER_CORPUS = 7;
  const CORPORA = DECL_CORPORA;
  // The -09 prefix the fourteen entries name ("revisit at the -09 re-pin").
  const PREFIX = MINUS09;
  // Shape (a)'s control needs the pin `asqav-sdk/a21d060` carries today, and
  // one value that is not it.
  const A21D060 = "a21d0608b0ff949c583138f2987eba3b6c15749f";
  const NOT_A21D060 = "0000000000000000000000000000000000000000";

  it("(a) every declaration in walker/scopes.json is LIVE — a failure here means a revisit_when has fired: re-read that entry against its source, then rewrite or withdraw it", () => {
    const report = join(tmp(), "live.json");
    const run = walkRaw({ report });
    const body = (JSON.parse(readFileSync(report, "utf8")) as Report).body;

    // Nothing expired anywhere: not a row, not a count, not a printed column.
    expect(body.rows.filter((r) => r.outcome === "declared_opaque_expired")).toEqual([]);
    expect(body.totals["declared_opaque_expired"] ?? 0).toBe(0);
    expect(readFileSync(report, "utf8")).not.toContain("declared_opaque_expired");
    expect(run.stdout).not.toContain("declared_opaque_expired");

    // And today's counts are exactly today's: no live declaration, fourteen withdrawn.
    expect(body.totals["declared_opaque"]).toBe(0);
    for (const corpus of CORPORA) {
      const c = body.per_corpus[corpus]!;
      expect(c["declared_opaque"], `${corpus} declared_opaque`).toBe(0);
      expect(c["withdrawn_declarations"], `${corpus} withdrawn`).toBe(OPAQUE_PER_CORPUS);
      expect(c["registered"], `${corpus} registered`).toBe(60);
      expect(c["match"], `${corpus} match`).toBe(59);
      expect(c["mismatch"], `${corpus} mismatch`).toBe(0);
      expect(c["unregistered"], `${corpus} unregistered`).toBe(38);
    }
  });

  it("(b) upstream_appears: the -09 entry now `current` in fixtures/upstreams.json expires all fourteen, prints the condition, and moves nothing that is measured", () => {
    // The withdrawn bytes, reinstated, against the REAL upstreams file: this is
    // the run that would have been red at HEAD had the entries not been withdrawn.
    const report = join(tmp(), "expired.json");
    const run = walkRaw({ report, scopes: writeJsonTmp("scopes.json", reinstated()) });
    const body = (JSON.parse(readFileSync(report, "utf8")) as Report).body;

    const expired = body.rows.filter((r) => r.outcome === "declared_opaque_expired");
    expect(expired.length).toBe(OPAQUE_PER_CORPUS * CORPORA.length);
    expect(body.rows.filter((r) => r.outcome === "declared_opaque")).toEqual([]);
    expect(body.totals["declared_opaque_expired"]).toBe(OPAQUE_PER_CORPUS * CORPORA.length);
    expect(body.totals["declared_opaque"]).toBe(0);

    // The row still cites the declaration AND says, in words, what fired.
    for (const r of expired) {
      expect(String(r.source)).toContain("1a080c1f84f6d1a1");
      expect(String(r.note)).toContain("declared opaque by");
      expect(String(r.note)).toContain(`expired: an entry with id prefix \`${PREFIX}\` is now current`);
      expect(String(r.note)).toContain("rewrite or withdraw it");
    }

    // Counted and printed, per corpus and on the SUMMARY.
    for (const corpus of CORPORA) {
      const c = body.per_corpus[corpus]!;
      expect(c["declared_opaque_expired"], `${corpus} expired count`).toBe(OPAQUE_PER_CORPUS);
      expect(c["declared_opaque"], `${corpus} live count`).toBe(0);
      // `registered` subtracts an expired row exactly as it subtracts a live one.
      expect(c["registered"], `${corpus} registered`).toBe(60);
      expect(c["unregistered"], `${corpus} unregistered`).toBe(31);
      const line = run.stdout.split("\n").find((l) => l.includes(corpus) && l.includes("registered="));
      expect(line, `a per-corpus line for ${corpus}`).toBeTruthy();
      expect(line).toContain(`declared_opaque_expired=${OPAQUE_PER_CORPUS}`);
    }
    expect(run.stdout).toMatch(new RegExp(`SUMMARY .*declared_opaque_expired=${OPAQUE_PER_CORPUS * CORPORA.length}[ ;]`));

    // Nothing that is MEASURED moved, and the exit contract is untouched: a
    // stale declaration is a bookkeeping condition, not a wrong digest.
    expect(body.totals["match"]).toBe(baseline.report.body.totals["match"]);
    expect(body.totals["mismatch"]).toBe(baseline.report.body.totals["mismatch"]);
    expect(run.code).toBe(baseline.code);

    // The control: the same registry without a current -09 entry reads LIVE.
    const liveReport = join(tmp(), "pre09.json");
    walkRaw({ report: liveReport, scopes: writeJsonTmp("scopes.json", reinstated()), upstreams: writeJsonTmp("upstreams.json", upstreamsBefore09()) });
    const liveBody = (JSON.parse(readFileSync(liveReport, "utf8")) as Report).body;
    expect(liveBody.totals["declared_opaque"]).toBe(OPAQUE_PER_CORPUS * CORPORA.length);
    expect(liveBody.totals["declared_opaque_expired"] ?? 0).toBe(0);
  });

  it("(c) upstream_repin: the live pin of asqav-sdk/a21d060 keeps a declaration LIVE, and any other value expires it", () => {
    // Control beside case, in one test, because "the entry is live" proves
    // nothing unless the same assertion can be made to read expired.
    const runWith = (pinned: string) => {
      const scopes = reinstated();
      const c = scopes.corpora.find((x) => x.id === "asqav/a21d060")!;
      for (const d of c.declared_opaque!) {
        d["revisit_when"] = { upstream_repin: { upstream_id: "asqav-sdk/a21d060", pinned_value: pinned } };
      }
      const report = join(tmp(), "repin.json");
      const raw = walkRaw({ report, scopes: writeJsonTmp("scopes.json", scopes), upstreams: writeJsonTmp("upstreams.json", upstreamsBefore09()) });
      return { raw, body: (JSON.parse(readFileSync(report, "utf8")) as Report).body };
    };

    const live = runWith(A21D060);
    const liveRows = live.body.rows.filter((r) => r.corpus === "asqav/a21d060");
    expect(liveRows.filter((r) => r.outcome === "declared_opaque").length).toBe(OPAQUE_PER_CORPUS);
    expect(liveRows.filter((r) => r.outcome === "declared_opaque_expired")).toEqual([]);

    const stale = runWith(NOT_A21D060);
    const staleRows = stale.body.rows.filter((r) => r.corpus === "asqav/a21d060");
    expect(staleRows.filter((r) => r.outcome === "declared_opaque")).toEqual([]);
    expect(staleRows.filter((r) => r.outcome === "declared_opaque_expired").length).toBe(OPAQUE_PER_CORPUS);
    for (const r of staleRows.filter((x) => x.outcome === "declared_opaque_expired")) {
      expect(String(r.note)).toContain("expired: `asqav-sdk/a21d060`");
      expect(String(r.note)).toContain(A21D060);
    }
    // The other corpus, whose entries were not touched, is unmoved in both runs.
    for (const b of [live.body, stale.body]) {
      expect(b.per_corpus["asqav/22a970d"]!["declared_opaque"]).toBe(OPAQUE_PER_CORPUS);
      expect(b.per_corpus["asqav/22a970d"]!["declared_opaque_expired"] ?? 0).toBe(0);
    }
    expect(live.raw.code).toBe(baseline.code);
    expect(stale.raw.code).toBe(baseline.code);
  });

  it("(d) refuses to run (exit 2) on a declaration with no revisit_when, and on one carrying both shapes at once, naming the entry", () => {
    const cases: Array<[string, unknown]> = [
      ["missing", undefined],
      ["both", {
        upstream_repin: { upstream_id: "asqav-sdk/a21d060", pinned_value: A21D060 },
        upstream_appears: { id_prefix: PREFIX },
      }],
    ];
    for (const [name, value] of cases) {
      const scopes = reinstated();
      const c = scopes.corpora.find((x) => x.id === "asqav/a21d060")!;
      const first = c.declared_opaque![0]!;
      if (value === undefined) delete first["revisit_when"];
      else first["revisit_when"] = value;

      const run = walkRaw({ report: join(tmp(), `bad-${name}.json`), scopes: writeJsonTmp("scopes.json", scopes) });
      // Not 0 and not 1 (the exit the corpora earn): a refusal to run.
      expect(run.code, `${name} revisit_when must refuse the run`).toBe(2);
      expect(run.stderr).toContain("revisit_when");
      // Named, so the reader does not have to go looking: corpus, index, pointer.
      expect(run.stderr).toContain("asqav/a21d060");
      expect(run.stderr).toContain("/vectors/14/input/action_ref");
    }
  });
});

// ---------------------------------------------------------------------------
// asqav.action_ref.descriptor (marques-09 s5.2.7) and the input_absent outcome.
//
// Exercised on a throwaway copy: the rule is applied to asqav/a21d060, whose
// seven action_ref values are SHA-256 of zero bytes and which carries no Action
// descriptor, and then a descriptor is written into a copy of its vectors.json.
// ---------------------------------------------------------------------------
describe("digest walker — asqav.action_ref.descriptor and input_absent", () => {
  const ZERO = "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  const CORPUS = "asqav/a21d060";

  /**
   * The committed registry with the -09 rule, exactly as registered, also applied
   * to `corpus`: a copy of it goes into the asqav/05c1c49 rule set, which
   * asqav/a21d060 inherits, with applies_to naming only that corpus.
   */
  function withRuleOn(corpus: string): string {
    const scopes = JSON.parse(readFileSync(join(ROOT, "walker", "scopes.json"), "utf8")) as ScopesDoc;
    const rule = scopes.corpora.flatMap((c) => c.rules ?? []).find((r) => r["id"] === "asqav.action_ref.descriptor");
    expect(rule, "the rule is registered in walker/scopes.json").toBeTruthy();
    scopes.corpora.find((c) => c.id === "asqav/05c1c49")!.rules!.push({ ...rule!, applies_to: [corpus] });
    return writeJsonTmp("scopes.json", scopes);
  }

  /** A throwaway root holding only a copy of a21d060, its vectors.json passed through `edit`. */
  function rootWith(edit: (doc: { vectors: Array<Record<string, any>> }) => void): string {
    const root = tmp();
    cpSync(join(ROOT, "fixtures", "asqav", "a21d060"), join(root, "fixtures", "asqav", "a21d060"), { recursive: true });
    const p = join(root, "fixtures", "asqav", "a21d060", "conformance", "vectors.json");
    const doc = JSON.parse(readFileSync(p, "utf8")) as { vectors: Array<Record<string, any>> };
    edit(doc);
    writeFileSync(p, JSON.stringify(doc, null, 2));
    return root;
  }

  const rowsAt = (body: Report["body"]) => body.rows.filter((r) => r.corpus === CORPUS && r.rule === "asqav.action_ref.descriptor");

  it("input_absent: every sha256 action_ref with no descriptor beside it, counted and printed by pointer, never match, never failing the run", () => {
    const report = join(tmp(), "absent.json");
    const run = walkRaw({ report, scopes: withRuleOn(CORPUS) });
    const body = (JSON.parse(readFileSync(report, "utf8")) as Report).body;
    const rows = rowsAt(body);
    expect(rows.map((r) => r.pointer).sort()).toEqual([
      "/vectors/14/input/action_ref",
      "/vectors/15/input/payload/action_ref",
      "/vectors/16/input/action_ref",
      "/vectors/17/input/action_ref",
      "/vectors/18/input/action_ref",
      "/vectors/19/input/action_ref",
      "/vectors/20/input/action_ref",
    ]);
    for (const r of rows) {
      expect(r.outcome).toBe("input_absent");
      expect(r.declared).toBe(ZERO);
      expect(r.recomputed).toBeNull();
      expect(String(r.note)).toContain("Missing descriptor evidence makes this recomputation unverifiable.");
      expect(String(r.note)).toContain("zero bytes");
    }
    const c = body.per_corpus[CORPUS]!;
    expect(c["input_absent"]).toBe(7);
    // Consumed by the rule, so out of the census; not graded, so not registered.
    expect(c["unregistered"]).toBe(31);
    expect(c["registered"]).toBe(60);
    expect(body.totals["input_absent"]).toBe((baseline.report.body.totals["input_absent"] ?? 0) + 7);
    expect(run.stdout).toMatch(new RegExp(`SUMMARY .* input_absent=${body.totals["input_absent"]}[ ;]`));
    expect(run.stdout).toContain("INPUT_ABSENT  fixtures/asqav/a21d060/conformance/vectors.json/vectors/14/input/action_ref");
    expect(body.totals["match"]).toBe(baseline.report.body.totals["match"]);
    expect(body.totals["mismatch"]).toBe(baseline.report.body.totals["mismatch"]);
    expect(run.code).toBe(baseline.code);
  });

  it("recomputes from a descriptor the corpus carries: match on the right digest, mismatch on the zero-bytes value, scopeRequired sorted by UTF-16 code unit", () => {
    // Deliberately unsorted, with an astral character: U+1F600 is D83D DE00 in
    // UTF-16 and sorts BEFORE U+FF21 (FF21) by code unit, AFTER it by code point.
    const descriptor = { agentId: "agt_originator_A", actionType: "tool.call", scopeRequired: ["b", "Ａ", "\u{1F600}", "a"], timestamp: "2026-05-18T20:00:00Z" };
    const sorted = { ...descriptor, scopeRequired: ["a", "b", "\u{1F600}", "Ａ"] };
    const right = "sha256:" + createHash("sha256").update(jcsOf(sorted), "utf8").digest("hex");

    const run = (actionRef: string) => {
      const root = rootWith((doc) => {
        const input = doc.vectors[14]!["input"];
        input["action_ref"] = actionRef;
        input["action_descriptor"] = descriptor;
      });
      const report = join(tmp(), "descriptor.json");
      const raw = walkRaw({ root, report, scopes: withRuleOn(CORPUS) });
      const body = (JSON.parse(readFileSync(report, "utf8")) as Report).body;
      return { raw, row: rowsAt(body).find((r) => r.pointer === "/vectors/14/input/action_ref")! };
    };

    const ok = run(right);
    expect(ok.row.outcome).toBe("match");
    expect(ok.row.recomputed).toBe(right);

    // The zero-bytes value, with a well-formed descriptor beside it: never a match.
    const zero = run(ZERO);
    expect(zero.row.outcome).toBe("mismatch");
    expect(zero.row.recomputed).toBe(right);
    expect(String(zero.row.note)).toContain("zero bytes");
    expect(zero.raw.code).toBe(1);

    // The code-point order would give a different digest, so the sort is observed.
    const byCodePoint = { ...descriptor, scopeRequired: ["a", "b", "Ａ", "\u{1F600}"] };
    const wrongOrder = "sha256:" + createHash("sha256").update(jcsOf(byCodePoint), "utf8").digest("hex");
    expect(wrongOrder).not.toBe(right);
    expect(run(wrongOrder).row.outcome).toBe("mismatch");
  });

  it("a descriptor with a fifth member is not an Action descriptor", () => {
    const root = rootWith((doc) => {
      doc.vectors[14]!["input"]["action_descriptor"] = { agentId: "a", actionType: "b", scopeRequired: [], timestamp: "t", extra: 1 };
    });
    const report = join(tmp(), "five.json");
    walkRaw({ root, report, scopes: withRuleOn(CORPUS) });
    const row = rowsAt((JSON.parse(readFileSync(report, "utf8")) as Report).body).find((r) => r.pointer === "/vectors/14/input/action_ref")!;
    expect(row.outcome).toBe("mismatch");
    expect(String(row.note)).toContain("exactly four");
  });
});

// ---------------------------------------------------------------------------
// asqav/6137cb95: the corpus -09 cites, graded under -09 and under no -08 rule.
// ---------------------------------------------------------------------------
describe("digest walker — asqav/6137cb95 under marques-09", () => {
  const CORPUS = "asqav/6137cb95";
  const mine = baseline.report.body.rows.filter((r) => r.corpus === CORPUS);

  it("applies no -08 rule: every graded row cites marques-09 or the corpus's own header", () => {
    expect(mine.length).toBeGreaterThan(0);
    const ruled = mine.filter((r) => r.rule !== null);
    for (const r of ruled) {
      expect(["asqav.vector.canonical", "asqav.vector.sha256"].includes(r.rule!) || (r as Row & { document?: string }).document === "marques-09", `${r.rule} at ${r.pointer}`).toBe(true);
    }
    for (const id of ["asqav.counterparty.envelope_hash", "asqav.counterparty.envelope_hash.input", "asqav.counterparty.envelope_hash.expected", "asqav.chain.asqav.payload", "asqav.chain.acta.whole"]) {
      expect(mine.some((r) => r.rule === id), `${id} must not be applied at ${CORPUS}`).toBe(false);
    }
  });

  it("a binding with no scope member is unverifiable_legacy_scope and one with an undefined scope is unverifiable_undefined_scope; neither is recomputed", () => {
    const at = (outcome: string) => mine.filter((r) => r.outcome === outcome).map((r) => `${r.file.replace("fixtures/asqav/6137cb95/", "")}#${r.pointer}`).sort();
    expect(at("unverifiable_legacy_scope")).toEqual([
      "conformance/vectors.json#/vectors/30/expected/envelope_hash_base64",
      "conformance/vectors.json#/vectors/30/expected/envelope_hash_hex",
      "conformance/vectors.json#/vectors/30/input/counterparty_binding/envelope_hash",
      "verifier/conformance-vectors/asqav-33-counterparty-scope-absent/receipt.json#/payload/counterparty_binding/envelope_hash",
    ]);
    expect(at("unverifiable_undefined_scope")).toEqual([
      "conformance/vectors.json#/vectors/31/expected/envelope_hash_base64",
      "conformance/vectors.json#/vectors/31/expected/envelope_hash_hex",
      "conformance/vectors.json#/vectors/31/input/counterparty_binding/envelope_hash",
      "verifier/conformance-vectors/asqav-34-counterparty-scope-unknown/receipt.json#/payload/counterparty_binding/envelope_hash",
    ]);
    for (const r of mine.filter((x) => x.outcome.startsWith("unverifiable_"))) expect(r.recomputed).toBeNull();
    const c = baseline.report.body.per_corpus[CORPUS]!;
    expect(c["unverifiable_legacy_scope"]).toBe(4);
    expect(c["unverifiable_undefined_scope"]).toBe(4);
  });

  it("the minus-anchors bindings recompute: the happy path and the receipt-file match", () => {
    const ok = (file: string, ptr: string) => mine.find((r) => r.file.endsWith(file) && r.pointer === ptr)?.outcome;
    expect(ok("conformance/vectors.json", "/vectors/14/input/counterparty_binding/envelope_hash")).toBe("match");
    expect(ok("asqav-31-counterparty-scope-match/receipt.json", "/payload/counterparty_binding/envelope_hash")).toBe("match");
  });

  it("the regime is what makes the difference: the same rules without scope_regime read vectors 30 and 31 the -08 way", () => {
    // The control. Without it, "never graded" could be a rule that grades nothing.
    const scopes = JSON.parse(readFileSync(join(ROOT, "walker", "scopes.json"), "utf8")) as ScopesDoc;
    for (const r of scopes.corpora.find((c) => c.id === CORPUS)!.rules!) delete r["scope_regime"];
    const report = join(tmp(), "no-regime.json");
    walkRaw({ report, scopes: writeJsonTmp("scopes.json", scopes) });
    // conformance/vectors.json only: the receipt-file rule has no -08 reading to fall back to.
    const rows = (JSON.parse(readFileSync(report, "utf8")) as Report).body.rows.filter(
      (r) => r.corpus === CORPUS && r.file.endsWith("conformance/vectors.json"),
    );
    expect(rows.filter((r) => r.outcome.startsWith("unverifiable_"))).toEqual([]);
    // Under the -08 reading vector 30's scope-less binding is resolved by peer
    // inference, finds two scopes among its peers and is left unregistered;
    // vector 31's undefined value is a mismatch. -09 reads neither that way.
    const at = (ptr: string) => rows.find((r) => r.pointer === ptr)!.outcome;
    expect(at("/vectors/30/input/counterparty_binding/envelope_hash")).toBe("unregistered");
    expect(at("/vectors/31/input/counterparty_binding/envelope_hash")).toBe("mismatch");
  });
});
