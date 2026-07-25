// The tri-state contract itself.
//
// These are the invariants the whole tool exists to hold. If any of them can be
// violated, a caller can be told something the tool did not establish — which is
// the only failure mode here that actually matters.

import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { exitCodeFor, formatResult, invalid, jsonResult, unverifiable, valid } from "../src/verdict.js";
import { evidenceActionAdapter } from "../src/adapters/evidence-action.js";
import { verificationStateAdapter } from "../src/adapters/verification-state.js";
import type { ResolvedKey, VerifyResult } from "../src/types.js";
import { COMPOSED, EVIDENCE, MAPPINGS, SYNTH, THROWAWAY_JWKS, FIXED_NOW, read } from "./helpers.js";

const KEY: ResolvedKey = { kid: "k1", thumbprint: "tp1", alg: "EdDSA", origin: "somewhere.json" };

describe("exit codes", () => {
  it("VALID exits 0", () => {
    expect(exitCodeFor(valid("f", "ok", KEY))).toBe(0);
  });
  it("INVALID exits 1", () => {
    expect(exitCodeFor(invalid("f", "signature_invalid", "bad", KEY))).toBe(1);
  });
  it("UNVERIFIABLE exits 1", () => {
    expect(exitCodeFor(unverifiable("f", "key_unresolvable", "nope"))).toBe(1);
  });
});

describe("output shape", () => {
  it("VALID says 'verified under key' and names it", () => {
    const text = formatResult(valid("f", "ok", KEY));
    expect(text).toContain("verified under key k1");
    expect(text).toContain("somewhere.json");
  });

  it("INVALID names the resolved key but does not claim verification", () => {
    const text = formatResult(invalid("f", "signature_invalid", "bad", KEY));
    expect(text).toContain("INVALID — key-binding");
    expect(text).toContain("k1");
    expect(text).not.toContain("verified under key");
  });

  it("UNVERIFIABLE never prints a key line", () => {
    const text = formatResult(unverifiable("f", "key_unresolvable", "nope"));
    expect(text).not.toContain("verified under key");
    expect(text).not.toContain("resolved from");
  });

  it("the JSON rendering carries the branchable fields an agent needs", () => {
    const o = JSON.parse(jsonResult(invalid("f", "signature_invalid", "bad", KEY))) as Record<string, unknown>;
    expect(o["schema"]).toBe("receipt-verify/verdict/0");
    expect(o["verdict"]).toBe("INVALID");
    expect(o["reason"]).toBe("signature_invalid");
    expect(o["exit_code"]).toBe(1);
    expect(o["resolved_key"]).toMatchObject({ kid: "k1" });
  });

  it("UNVERIFIABLE serializes resolved_key as null, not as an absent field", () => {
    // A consumer must be able to test one field rather than probe for existence.
    const o = JSON.parse(jsonResult(unverifiable("f", "expired", "gone"))) as Record<string, unknown>;
    expect(o["resolved_key"]).toBeNull();
    expect("resolved_key" in o).toBe(true);
  });
});

// The exhaustive sweep: run every adapter over every fixture in the repository
// and assert the invariants hold for each result, whatever that result is.
describe("invariants hold across every fixture", () => {
  const cases: [string, () => Promise<VerifyResult>][] = [];

  for (const v of ["allow", "deny", "fail-closed", "tampered", "chain-multi", "canonicalization-key-order"]) {
    cases.push([
      `evidence.action/${v}`,
      () => evidenceActionAdapter.verify(read(join(EVIDENCE, "vectors", v, "chain.jsonl")), { jwks: join(EVIDENCE, "jwks.json") }),
    ]);
  }
  for (const n of [
    "flat-act.attached.flattened.json",
    "flat-halt.attached.flattened.json",
    "tamper-mutated-gate.attached.flattened.json",
    "tamper-resigned-exp.attached.flattened.json",
    "tamper-resigned-mapping-hash.attached.flattened.json",
    "composed-act.general.json",
    "composed-rule-violation.general.json",
    "composed-one-bad-signature.general.json",
  ]) {
    cases.push([
      `verification/${n}`,
      () => verificationStateAdapter.verify(read(join(SYNTH, n)), { jwks: THROWAWAY_JWKS, mappingDir: MAPPINGS, now: FIXED_NOW }),
    ]);
  }
  for (const n of ["jws-001.json", "jws-r01.json", "jws-r02.json", "jws-r03.json", "jws-r04.json"]) {
    cases.push([
      `published/${n}`,
      () => verificationStateAdapter.verify(read(join(COMPOSED, n)), { jwks: COMPOSED, mappingDir: MAPPINGS, now: FIXED_NOW }),
    ]);
  }

  it.each(cases)("%s", async (_name, run) => {
    const r = await run();

    // 1. Exactly one of three verdicts.
    expect(["VALID", "INVALID", "UNVERIFIABLE"]).toContain(r.verdict);

    // 2. UNVERIFIABLE never carries a resolved key, so it can never render a
    //    "verified under key" line. This is the fail-closed guarantee.
    if (r.verdict === "UNVERIFIABLE") {
      expect(r.resolvedKey).toBeUndefined();
      expect(formatResult(r)).not.toContain("verified under key");
    }

    // 3. INVALID always names the key the receipt failed against — an INVALID
    //    that cannot say which key is indistinguishable from UNVERIFIABLE.
    if (r.verdict === "INVALID") {
      expect(r.resolvedKey).toBeDefined();
      expect(r.resolvedKey?.kid.length).toBeGreaterThan(0);
      expect(r.resolvedKey?.origin.length).toBeGreaterThan(0);
    }

    // 4. VALID always names the key it verified under.
    if (r.verdict === "VALID") {
      expect(r.resolvedKey).toBeDefined();
    }

    // 5. Exit code follows the verdict, always.
    expect(exitCodeFor(r)).toBe(r.verdict === "VALID" ? 0 : 1);

    // 6. Every result is a complete, parseable object — no half-populated states.
    expect(r.reason.length).toBeGreaterThan(0);
    expect(r.detail.length).toBeGreaterThan(0);
    expect(r.format.length).toBeGreaterThan(0);
    expect(() => JSON.parse(jsonResult(r))).not.toThrow();
  });
});

describe("the tool never issues a gate decision", () => {
  it("a receipt recording halt is just as VALID as one recording act", async () => {
    const act = await verificationStateAdapter.verify(read(join(SYNTH, "flat-act.attached.flattened.json")), {
      jwks: THROWAWAY_JWKS,
      mappingDir: MAPPINGS,
      now: FIXED_NOW,
    });
    const halt = await verificationStateAdapter.verify(read(join(SYNTH, "flat-halt.attached.flattened.json")), {
      jwks: THROWAWAY_JWKS,
      mappingDir: MAPPINGS,
      now: FIXED_NOW,
    });
    expect(act.verdict).toBe("VALID");
    expect(halt.verdict).toBe("VALID");
    expect(exitCodeFor(act)).toBe(exitCodeFor(halt));
    expect(act.annotations?.["receipt_gate"]).not.toBe(halt.annotations?.["receipt_gate"]);
  });

  it("the gate value is labelled as the issuer's, not the tool's", async () => {
    const halt = await verificationStateAdapter.verify(read(join(SYNTH, "flat-halt.attached.flattened.json")), {
      jwks: THROWAWAY_JWKS,
      mappingDir: MAPPINGS,
      now: FIXED_NOW,
    });
    expect(formatResult(halt)).toContain("not a decision by this tool");
  });
});
