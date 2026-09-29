// tools/compliance-fields-recompute.ts over the pinned x402 PR #2853 text, under controls.
//
// What turns this red: a table row whose canonical form or recordDigest stops
// recomputing under either serialiser, a committed number-case file whose bytes
// differ from what the tool computes now, or a pinned sentence a case rests on
// disappearing. The two controls change one hex digit of the table's first
// recordDigest in a copy of the spec, and one byte of a committed number file
// in a copy of numbers/, and require the same run to go red, so the green
// result is not a comparison that compared nothing.

import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "./helpers.js";

const BASE = join(ROOT, "fixtures", "x402-pr-2853-compliance-fields");
const HEAD = join(BASE, "b8a81c099d0d30607416211f819db8a40bda5371", "specs", "extensions", "compliance_fields.md");

function run(args: string[]): { code: number; out: string } {
  try {
    const out = execFileSync("npx", ["tsx", join(ROOT, "tools", "compliance-fields-recompute.ts"), ...args], {
      cwd: ROOT, stdio: "pipe", shell: process.platform === "win32", encoding: "utf8",
    });
    return { code: 0, out };
  } catch (e) {
    const err = e as { status?: number; stdout?: string };
    return { code: Number(err.status ?? -1), out: String(err.stdout ?? "") };
  }
}

describe("tools/compliance-fields-recompute.ts over PR #2853", () => {
  const baseline = run([]);

  it("exits 0 at the head: three table rows and the declarationDigest example match, and the number files are current", () => {
    expect(baseline.code, baseline.out).toBe(0);
    expect(baseline.out.match(/recordDigest {7}: match/g)?.length).toBe(3);
    expect(baseline.out.match(/canonical form {5}: match/g)?.length).toBe(3);
    expect(baseline.out).toContain("buyer.declarationDigest example (line 101): keccak256 over the 15 raw bytes, no canonicalization: match");
    expect(baseline.out.match(/^number case /gm)?.length).toBe(5);
  });

  it("records the divergence it looked for: the two serialisers disagree on case 5 and on no other case", () => {
    const agree = (f: string) => (JSON.parse(readFileSync(join(BASE, "numbers", f), "utf8")) as { serialisers_agree: boolean | null }).serialisers_agree;
    expect(agree("05-shortest-round-trip-divergence.json")).toBe(false);
    expect(["02-fractional-part.json", "03-exponent-form.json", "04-negative-zero.json"].map(agree)).toEqual([true, true, true]);
    expect(agree("01-integers-at-and-above-2p53.json")).toBeNull();
  });

  it("negative control: one hex digit changed in the table's first recordDigest reds the run", () => {
    const dir = mkdtempSync(join(tmpdir(), "cf-spec-"));
    const copy = join(dir, "compliance_fields.md");
    const text = readFileSync(HEAD, "utf8");
    const digest = "0x84fc3d9faf736ddfdb9baab9973656bd8d9bd142f1dfff8aa513a774fddfdd04";
    expect(text.includes(digest)).toBe(true);
    writeFileSync(copy, text.replace(digest, "0x94fc" + digest.slice(6)));
    const dirty = run(["--spec", copy]);
    expect(dirty.code).toBe(1);
    expect(dirty.out).toMatch(/vector 1 [^\n]*\n(?:[^\n]*\n){4} {4}recordDigest {7}: mismatch/);
  });

  it("negative control: one byte changed in a committed number file reds the run", () => {
    const dir = join(mkdtempSync(join(tmpdir(), "cf-numbers-")), "numbers");
    cpSync(join(BASE, "numbers"), dir, { recursive: true });
    const f = join(dir, "04-negative-zero.json");
    writeFileSync(f, readFileSync(f, "utf8").replace('"serialisers_agree": true', '"serialisers_agree": false'));
    const dirty = run(["--numbers", dir]);
    expect(dirty.code).toBe(1);
    expect(dirty.out).toContain("04-negative-zero.json differs from this run's output");
  });
});
