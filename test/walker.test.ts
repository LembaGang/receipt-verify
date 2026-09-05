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
  pointer: string;
  declared: string | null;
  recomputed: string | null;
  outcome: string;
  rule: string | null;
}
interface Report {
  header: Record<string, string>;
  body: { rows: Row[]; totals: Record<string, number>; per_corpus: Record<string, Record<string, number>> };
}

/** Run the walker. Returns its report and exit code; a non-zero exit is expected on the pinned corpora. */
function walk(opts: { root?: string; report: string }): { report: Report; code: number } {
  const args = ["tsx", join(ROOT, "tools", "walk-digests.ts"), "--report", opts.report];
  if (opts.root) args.push("--root", opts.root);
  let code = 0;
  try {
    execFileSync("npx", args, { cwd: ROOT, stdio: "pipe", shell: process.platform === "win32" });
  } catch (e) {
    code = Number((e as { status?: number }).status ?? -1);
  }
  return { report: JSON.parse(readFileSync(opts.report, "utf8")) as Report, code };
}

const tmp = () => mkdtempSync(join(tmpdir(), "walker-"));

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
    // And the six that moved are graded by the envelope rule specifically, not by
    // some other rule that happens to touch the same pointer.
    const moved = FOURTEEN.filter((x) => x.includes("/expected/"));
    expect(moved.length).toBe(6);
    for (const p of moved) expect(byPtr.get(p)!.rule).toBe("asqav.counterparty.envelope_hash");
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

    // Three of the four are the envelope rule refusing to grade an unknown scope:
    // recomputed is null because the row was compared against neither construction.
    const byRule = bad.filter((r) => r.rule === "asqav.counterparty.envelope_hash");
    expect(byRule.map((r) => r.pointer).sort()).toEqual([
      "/vectors/14/expected/envelope_hash_base64",
      "/vectors/14/expected/envelope_hash_hex",
      "/vectors/14/input/counterparty_binding/envelope_hash",
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
    const rest = bad.filter((r) => r.rule !== "asqav.counterparty.envelope_hash");
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
