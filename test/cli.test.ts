// CLI surface: argument handling, auto-detection, and the exit-code contract
// as an actual caller experiences it.

import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { run, parseArgs } from "../src/cli.js";
import { COMPOSED, EVIDENCE, MAPPINGS, SYNTH, THROWAWAY_JWKS, FIXED_NOW } from "./helpers.js";

const allow = join(EVIDENCE, "vectors", "allow", "chain.jsonl");
const tampered = join(EVIDENCE, "vectors", "tampered", "chain.jsonl");
const evidenceJwks = join(EVIDENCE, "jwks.json");
const flatAct = join(SYNTH, "flat-act.attached.flattened.json");

describe("argument parsing", () => {
  it("takes a file and options", () => {
    const a = parseArgs(["r.jsonl", "--jwks", "k.json", "--json"]);
    expect(typeof a).not.toBe("string");
    if (typeof a !== "string") {
      expect(a.file).toBe("r.jsonl");
      expect(a.jwks).toBe("k.json");
      expect(a.json).toBe(true);
    }
  });

  it("rejects an unknown option instead of ignoring it", () => {
    expect(parseArgs(["r.jsonl", "--yolo"])).toContain("unknown option");
  });

  it("rejects an option missing its value", () => {
    expect(parseArgs(["r.jsonl", "--jwks"])).toContain("--jwks needs a value");
  });

  it("rejects a second positional argument", () => {
    expect(parseArgs(["a", "b"])).toContain("unexpected extra argument");
  });
});

describe("exit codes as a caller sees them", () => {
  it("VALID exits 0", async () => {
    const { exitCode, result } = await run([allow, "--jwks", evidenceJwks]);
    expect(result?.verdict).toBe("VALID");
    expect(exitCode).toBe(0);
  });

  it("INVALID exits 1", async () => {
    const { exitCode, result } = await run([tampered, "--jwks", evidenceJwks]);
    expect(result?.verdict).toBe("INVALID");
    expect(exitCode).toBe(1);
  });

  it("UNVERIFIABLE exits 1", async () => {
    const { exitCode, result } = await run([allow]);
    expect(result?.verdict).toBe("UNVERIFIABLE");
    expect(exitCode).toBe(1);
  });

  it("a missing file is UNVERIFIABLE, not a crash", async () => {
    const { exitCode, result } = await run(["no-such-file.jsonl", "--jwks", evidenceJwks]);
    expect(result?.verdict).toBe("UNVERIFIABLE");
    expect(result?.reason).toBe("io_error");
    expect(exitCode).toBe(1);
  });

  it("usage exits 2 — distinct from any verdict", async () => {
    expect((await run([])).exitCode).toBe(2);
    expect((await run(["--help"])).exitCode).toBe(0);
  });
});

describe("format selection", () => {
  it("auto-detects evidence.action", async () => {
    const { result } = await run([allow, "--jwks", evidenceJwks]);
    expect(result?.format).toBe("evidence.action/0");
  });

  it("auto-detects verification.*", async () => {
    const { result } = await run([flatAct, "--jwks", THROWAWAY_JWKS, "--mapping-dir", MAPPINGS, "--now", String(FIXED_NOW)]);
    expect(result?.format).toBe("verification.*");
    expect(result?.verdict).toBe("VALID");
  });

  it("an explicit --format is honoured", async () => {
    const { result } = await run([allow, "--jwks", evidenceJwks, "--format", "evidence.action"]);
    expect(result?.verdict).toBe("VALID");
  });

  it("an unknown --format is UNVERIFIABLE and lists what it knows", async () => {
    const { result } = await run([allow, "--format", "cbor-receipts"]);
    expect(result?.verdict).toBe("UNVERIFIABLE");
    expect(result?.reason).toBe("format_unrecognized");
    expect(result?.detail).toContain("evidence.action");
  });

  it("unrecognisable bytes are UNVERIFIABLE and say to name the format", async () => {
    const { result } = await run([join(EVIDENCE, "manifest.json"), "--jwks", evidenceJwks]);
    expect(result?.verdict).toBe("UNVERIFIABLE");
    expect(result?.reason).toBe("format_unrecognized");
    expect(result?.detail).toContain("--format");
  });

  it("a detached receipt needs --format, since detection cannot read its payload", async () => {
    const { result } = await run([join(SYNTH, "flat-act.detached.flattened.json"), "--jwks", THROWAWAY_JWKS]);
    expect(result?.reason).toBe("format_unrecognized");
  });
});

describe("--json output", () => {
  it("is parseable and carries the branchable fields", async () => {
    const { text } = await run([tampered, "--jwks", evidenceJwks, "--json"]);
    const o = JSON.parse(text) as Record<string, unknown>;
    expect(o["verdict"]).toBe("INVALID");
    expect(o["reason"]).toBe("content_commitment_mismatch");
    expect(o["exit_code"]).toBe(1);
    expect(o["resolved_key"]).not.toBeNull();
  });

  it("carries resolved_key: null on UNVERIFIABLE", async () => {
    const { text } = await run([allow, "--json"]);
    const o = JSON.parse(text) as Record<string, unknown>;
    expect(o["verdict"]).toBe("UNVERIFIABLE");
    expect(o["resolved_key"]).toBeNull();
  });
});

describe("detached payload options", () => {
  it("--payload with --payload-jcs verifies the detached form", async () => {
    const { result, exitCode } = await run([
      join(SYNTH, "flat-act.detached.flattened.json"),
      "--format", "verification",
      "--jwks", THROWAWAY_JWKS,
      "--mapping-dir", MAPPINGS,
      "--payload", join(SYNTH, "flat-act.payload.json"),
      "--payload-jcs",
      "--now", String(FIXED_NOW),
    ]);
    expect(result?.verdict).toBe("VALID");
    expect(exitCode).toBe(0);
  });

  it("a missing --payload file is UNVERIFIABLE", async () => {
    const { result } = await run([
      join(SYNTH, "flat-act.detached.flattened.json"),
      "--format", "verification",
      "--jwks", THROWAWAY_JWKS,
      "--payload", "nope.json",
    ]);
    expect(result?.verdict).toBe("UNVERIFIABLE");
    expect(result?.reason).toBe("io_error");
  });
});

describe("published composed fixture through the CLI", () => {
  it("verifies end to end and names the key it verified under", async () => {
    // This stalled at the mapping binding until 2026-07-29, when the document
    // it content-addresses was published (FINDINGS-rerun-2026-07-29.md
    // erratum 1). The CLI now completes all eight steps.
    const { result, exitCode, text } = await run([
      join(COMPOSED, "jws-001.json"),
      "--format", "verification",
      "--jwks", COMPOSED,
      "--mapping-dir", MAPPINGS,
      "--now", String(FIXED_NOW),
    ]);
    expect(result?.verdict).toBe("VALID");
    expect(exitCode).toBe(0);
    expect(text).toContain("verified under key");
  });

  it("still prints no key line when a mapping does not resolve", async () => {
    // The property the previous version of this test was really guarding: a
    // stall must never read as a verification. Exercised now against a receipt
    // whose mapping id genuinely does not resolve, rather than against a
    // published fixture that has since been fixed.
    const { result, exitCode, text } = await run([
      join(SYNTH, "tamper-resigned-mapping-id.attached.flattened.json"),
      "--format", "verification",
      "--jwks", THROWAWAY_JWKS,
      "--mapping-dir", MAPPINGS,
      "--now", String(FIXED_NOW),
    ]);
    expect(result?.verdict).toBe("UNVERIFIABLE");
    expect(result?.reason).toBe("mapping_unresolvable");
    expect(result?.resolvedKey).toBeUndefined();
    expect(exitCode).toBe(1);
    expect(text).not.toContain("verified under key");
  });
});
