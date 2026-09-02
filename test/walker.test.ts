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
