// tools/tersign-recompute.ts over the pinned Tersign suite, under a control.
//
// What turns this red: a keccak, JCS or link construction that stops matching
// the suite's positive vectors (the exit code and the valid-vector assertion),
// a negative vector that starts to recompute (the named mismatch list), or the
// two serialisers parting on any value. The negative control changes one hex
// digit of a positive vector's declared digest in a throwaway copy and requires
// the SAME run to go red on exactly that row, so the green result is not a
// recomputation that compared nothing.

import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "./helpers.js";

const DIR = join(ROOT, "fixtures", "tersign-evidence-record-conformance", "1075ca65b4495212cf49a891e63e07f2cf48acf8");

interface Row { vector: string; pointer: string; expect: string; outcome: string; declared: string; recomputed: string | null }
interface Out { rows: Row[]; signatures: Array<{ vector: string; pointer: string; result: string }> }

function run(dir: string): { code: number; out: Out } {
  const json = join(mkdtempSync(join(tmpdir(), "tersign-")), "out.json");
  let code = 0;
  try {
    execFileSync("npx", ["tsx", join(ROOT, "tools", "tersign-recompute.ts"), "--dir", dir, "--json", json], {
      cwd: ROOT, stdio: "pipe", shell: process.platform === "win32",
    });
  } catch (e) {
    code = Number((e as { status?: number }).status ?? -1);
  }
  return { code, out: JSON.parse(readFileSync(json, "utf8")) as Out };
}

const baseline = run(DIR);
const key = (r: Row) => `${r.vector}#${r.pointer}`;

describe("tools/tersign-recompute.ts over tersign 1075ca65", () => {
  it("exits 0: no serializer disagreement and no mismatch on an expect:valid vector", () => {
    expect(baseline.code).toBe(0);
    expect(baseline.out.rows.filter((r) => r.outcome === "serializer_disagreement")).toEqual([]);
    expect(baseline.out.rows.filter((r) => r.expect === "valid" && r.outcome === "mismatch").map(key)).toEqual([]);
    expect(baseline.out.rows.filter((r) => r.outcome === "match").length).toBeGreaterThan(100);
  });

  it("mismatches only on negative vectors, and on these exactly", () => {
    expect(baseline.out.rows.filter((r) => r.outcome === "mismatch").map(key).sort()).toEqual([
      "n1-value-drift.json#/input/expected_digest",
      "n12-codepoint-key-order.json#/input/claimed_canonical",
      "n17-renumbered-omission.json#/input/records/1/link",
      "n19-offer-substitution.json#/input/receipt/offerDigest",
      "n2-hoisted-integer-keys.json#/input/claimed_canonical",
      "n28-authority-reduction-substitution.json#/input/record/decisionEvidenceDigest",
      "n29-suite-transition-redigests-prefix.json#/input/boundary_event/prefixDigest",
      "n3-chain-link-wrong-prev.json#/input/expected_link",
      "n33-delivery-substitution-scope-overreach.json#/input/deliverable_digest",
      "n34-witnessed-inclusion-not-completeness.json#/input/records/1/prev_digest",
      "n36-chain-commitment-prefix-substituted.json#/input/head/acc",
      "n37-chain-commitment-last-link-only.json#/input/head/acc",
      "n39-issuer-sequence-duplicate-seq.json#/input/records/2/prev_digest",
      "n39-issuer-sequence-duplicate-seq.json#/input/records/3/prev_digest",
      "n4-omitted-record.json#/input/records/1/prev_digest",
      "n40-equivocating-record-at-committed-position.json#/input/head/acc",
      "n5-truncated-anchor.json#/input/anchored_digest",
    ]);
  });

  it("recovers the pinned ledger signer from p1's countersignature", () => {
    const s = baseline.out.signatures.find((x) => x.pointer === "/provenance/countersignature");
    expect(s?.result).toMatch(/^recovers 0x9d38ba84730271eb27ac9bd4bd2620c08db4fda6; .*: match /);
  });

  it("negative control: one hex digit changed in p3's expected_digest reds the run on that row alone", () => {
    const dir = join(mkdtempSync(join(tmpdir(), "tersign-copy-")), "corpus");
    cpSync(DIR, dir, { recursive: true });
    const f = join(dir, "vectors", "p3-integer-key-utf16-order.json");
    const text = readFileSync(f, "utf8");
    const digest = "0x426b770f81b8ad5e307bcfb767deb02f8d32cd340d81a946be88bb184857e81b";
    expect(text.includes(digest)).toBe(true);
    writeFileSync(f, text.replace(digest, "0x526b" + digest.slice(6)));
    const dirty = run(dir);
    expect(dirty.code).toBe(1);
    const before = new Set(baseline.out.rows.filter((r) => r.outcome === "mismatch").map(key));
    expect(dirty.out.rows.filter((r) => r.outcome === "mismatch" && !before.has(key(r))).map(key)).toEqual([
      "p3-integer-key-utf16-order.json#/input/expected_digest",
    ]);
  });
});
