// The coverage manifest: its internal consistency, and the invariant that
// every stop point an adapter can report is a check the manifest declares.
//
// This file asserts DECLARATIONS, not verification behaviour. Its value is that
// a check moving between statuses, or an adapter reporting a stop point nobody
// declared, fails here rather than silently changing what the tool discloses.

import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { COVERAGE, checksNotEvaluated, coverageFor, specStepOf } from "../src/coverage.js";
import { jsonResult } from "../src/verdict.js";
import { verificationStateAdapter } from "../src/adapters/verification-state.js";
import { actaAdapter } from "../src/adapters/acta.js";
import { evidenceActionAdapter } from "../src/adapters/evidence-action.js";
import { ACTA_JWKS, ACTA_NOW, ACTA_SYNTH, COMPOSED, EVIDENCE, MAPPINGS, SYNTH, THROWAWAY_JWKS, FIXED_NOW, read } from "./helpers.js";

const FORMATS = Object.keys(COVERAGE);

describe("manifest shape", () => {
  it.each(FORMATS)("%s: check ids are unique", (f) => {
    const ids = coverageFor(f)!.checks.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(FORMATS)("%s: order is dense and 1-based", (f) => {
    const orders = coverageFor(f)!.checks.map((c) => c.order).sort((a, b) => a - b);
    expect(orders).toEqual(orders.map((_, i) => i + 1));
  });

  it.each(FORMATS)("%s: the manifest is in evaluation order as written", (f) => {
    const written = coverageFor(f)!.checks.map((c) => c.order);
    expect(written).toEqual([...written].sort((a, b) => a - b));
  });

  it.each(FORMATS)("%s: anything not `implemented` says why", (f) => {
    // A gap with no stated reason is a gap a reader has to go and reconstruct
    // from the source, which is the situation this manifest exists to end.
    for (const c of coverageFor(f)!.checks) {
      if (c.status !== "implemented") expect(c.note, `${c.id} has status ${c.status} and no note`).toBeTruthy();
    }
  });

  it.each(FORMATS)("%s: every check cites a source", (f) => {
    for (const c of coverageFor(f)!.checks) expect(c.source.length, c.id).toBeGreaterThan(0);
  });
});

describe("declared gaps", () => {
  // Locked deliberately. Implementing one of these means editing this list in
  // the same commit — the manifest cannot silently fall behind the code, and
  // the code cannot silently claim coverage it does not have.
  it("verification.* declares exactly these unimplemented checks", () => {
    const gaps = coverageFor("verification.*")!.checks.filter((c) => c.status === "not_implemented").map((c) => c.id);
    expect(gaps.sort()).toEqual(["inline_threshold_agreement", "sibling_leg_mapping_binding", "signing_trust_ref_quorum"]);
  });

  it("acta.receipt/0 declares exactly these unimplemented checks", () => {
    const gaps = coverageFor("acta.receipt/0")!.checks.filter((c) => c.status === "not_implemented").map((c) => c.id);
    expect(gaps.sort()).toEqual(["mldsa65_signature"]);
  });

  it("evidence.action/0 delegates chain verification rather than implementing it", () => {
    const delegated = coverageFor("evidence.action/0")!.checks.filter((c) => c.status === "delegated").map((c) => c.id);
    expect(delegated).toContain("chain_verification");
  });
});

describe("checksNotEvaluated", () => {
  it("reports unimplemented checks whatever the verdict, including on VALID", () => {
    // A VALID result does not mean every declared check was evaluated. Saying
    // so is the whole point.
    const onValid = checksNotEvaluated("verification.*", undefined);
    expect(onValid.length).toBeGreaterThan(0);
    expect(onValid.every((c) => c.reason === "not_implemented")).toBe(true);
  });

  it("reports everything ordered after the stop point as not_reached", () => {
    const stop = "mapping_binding";
    const order = coverageFor("verification.*")!.checks.find((c) => c.id === stop)!.order;
    const out = checksNotEvaluated("verification.*", stop);

    for (const c of coverageFor("verification.*")!.checks) {
      const listed = out.find((o) => o.id === c.id);
      if (c.status === "not_implemented") expect(listed?.reason).toBe("not_implemented");
      else if (c.order > order) expect(listed?.reason, c.id).toBe("not_reached");
      else expect(listed, `${c.id} ran or was the stop point`).toBeUndefined();
    }
  });

  it("never lists the stop point itself — it was evaluated, and it refused", () => {
    expect(checksNotEvaluated("verification.*", "gate_match").find((c) => c.id === "gate_match")).toBeUndefined();
  });

  it("is empty for a format with no manifest entry", () => {
    expect(checksNotEvaluated("no.such.format/0", undefined)).toEqual([]);
  });

  it("specStepOf reads the spec's own numbering, and is undefined where it assigns none", () => {
    expect(specStepOf("verification.*", "mapping_binding")).toBe(2);
    expect(specStepOf("verification.*", "time_window")).toBe(7);
    expect(specStepOf("verification.*", "inline_threshold_agreement")).toBeUndefined();
  });
});

describe("adapters report a stop point the manifest declares", () => {
  const known = (format: string, id: string | undefined) => {
    expect(id, `${format} refused without naming a stop point`).toBeDefined();
    expect(coverageFor(format)!.checks.map((c) => c.id), `${format}: ${id}`).toContain(id);
  };

  it("verification.*: mapping refusal", async () => {
    const r = await verificationStateAdapter.verify(read(join(COMPOSED, "jws-001.json")), {
      jwks: COMPOSED,
      now: FIXED_NOW,
    });
    expect(r.verdict).toBe("UNVERIFIABLE");
    known(r.format, r.stoppedAt);
  });

  it("verification.*: signature refusal", async () => {
    const r = await verificationStateAdapter.verify(read(join(COMPOSED, "jws-r01.json")), {
      jwks: COMPOSED,
      mappingDir: MAPPINGS,
      now: FIXED_NOW,
    });
    expect(r.verdict).toBe("INVALID");
    known(r.format, r.stoppedAt);
  });

  it("verification.*: recompute refusal names a step past the signature", async () => {
    const r = await verificationStateAdapter.verify(read(join(COMPOSED, "jws-r03.json")), {
      jwks: COMPOSED,
      mappingDir: MAPPINGS,
      now: FIXED_NOW,
    });
    known(r.format, r.stoppedAt);
    expect(r.stoppedAt).toBe("composed_decision_rule");
    // The signature check ran and passed; the coverage block must not imply
    // otherwise by listing it as unreached.
    expect(checksNotEvaluated(r.format, r.stoppedAt).find((c) => c.id === "jws_signature")).toBeUndefined();
  });

  it("acta.receipt/0: unsupported algorithm", async () => {
    const r = await actaAdapter.verify(read(join(ACTA_SYNTH, "alg-mldsa65.receipt.json")), {
      jwks: ACTA_JWKS,
      now: ACTA_NOW,
    });
    expect(r.reason).toBe("unsupported_algorithm");
    known(r.format, r.stoppedAt);
    expect(r.stoppedAt).toBe("mldsa65_signature");
  });

  it("acta.receipt/0: signature scope refusal", async () => {
    const r = await actaAdapter.verify(read(join(ACTA_SYNTH, "sigscope-4.1.receipt.json")), {
      jwks: ACTA_JWKS,
      now: ACTA_NOW,
    });
    expect(r.verdict).toBe("INVALID");
    known(r.format, r.stoppedAt);
  });

  it("evidence.action/0: no key source", async () => {
    const r = await evidenceActionAdapter.verify(read(join(EVIDENCE, "vectors", "allow", "chain.jsonl")), {});
    expect(r.verdict).toBe("UNVERIFIABLE");
    known(r.format, r.stoppedAt);
  });

  it("a VALID result carries no stop point", async () => {
    const r = await verificationStateAdapter.verify(read(join(SYNTH, "flat-act.attached.flattened.json")), {
      jwks: THROWAWAY_JWKS,
      mappingDir: MAPPINGS,
      now: FIXED_NOW,
    });
    expect(r.verdict).toBe("VALID");
    expect(r.stoppedAt).toBeUndefined();
  });
});

describe("the JSON surface", () => {
  it("always carries a coverage block, with stopped_at null exactly when nothing stopped", async () => {
    const valid = await verificationStateAdapter.verify(read(join(SYNTH, "flat-act.attached.flattened.json")), {
      jwks: THROWAWAY_JWKS,
      mappingDir: MAPPINGS,
      now: FIXED_NOW,
    });
    const refused = await verificationStateAdapter.verify(read(join(COMPOSED, "jws-001.json")), {
      jwks: COMPOSED,
      now: FIXED_NOW,
    });

    const v = JSON.parse(jsonResult(valid)) as { coverage: { stopped_at: string | null; checks_not_evaluated: unknown[] } };
    const f = JSON.parse(jsonResult(refused)) as { coverage: { stopped_at: string | null; checks_not_evaluated: unknown[] } };

    expect(v.coverage.stopped_at).toBeNull();
    expect(f.coverage.stopped_at).toBe("mapping_binding");
    expect(Array.isArray(v.coverage.checks_not_evaluated)).toBe(true);
    expect(f.coverage.checks_not_evaluated.length).toBeGreaterThan(v.coverage.checks_not_evaluated.length);
  });
});
