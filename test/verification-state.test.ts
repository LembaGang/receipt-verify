// Format 2: verification.*, per draft-krausz-verification-state-01 (refs/).
//
// Two fixture families:
//   * published — TKCollective/agentoracle-receipt-spec, snapshotted verbatim.
//   * synthetic — signed here by a published throwaway key, because no public
//     fixture exercises the flat §4.2 profile, the detached wire form, or a
//     receipt whose mapping document actually resolves. See FINDINGS.md.

import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { verificationStateAdapter as adapter, detect } from "../src/adapters/verification-state.js";
import { COMPOSED, MAPPINGS, SYNTH, THROWAWAY_JWKS, FIXED_NOW, read } from "./helpers.js";

const base = { jwks: THROWAWAY_JWKS, mappingDir: MAPPINGS, now: FIXED_NOW } as const;
const synth = (n: string) => read(join(SYNTH, n));

describe("verification.* — §4.1 serializations", () => {
  // §4.1: "A relying party MUST accept both serializations."
  it("accepts compact serialization", async () => {
    const r = await adapter.verify(synth("flat-act.attached.compact.jws"), base);
    expect(r.verdict).toBe("VALID");
    expect(r.detail).toContain("compact serialization");
  });

  it("accepts flattened JSON serialization", async () => {
    const r = await adapter.verify(synth("flat-act.attached.flattened.json"), base);
    expect(r.verdict).toBe("VALID");
    expect(r.detail).toContain("flattened serialization");
  });

  it("accepts general JSON serialization (multi-signer)", async () => {
    const r = await adapter.verify(synth("composed-act.general.json"), base);
    expect(r.verdict).toBe("VALID");
    expect(r.detail).toContain("general serialization");
    expect(r.annotations?.["signers"]).toBe(2);
  });

  it("compact and flattened reach the identical verdict for the same receipt", async () => {
    const a = await adapter.verify(synth("flat-act.attached.compact.jws"), base);
    const b = await adapter.verify(synth("flat-act.attached.flattened.json"), base);
    expect(a.verdict).toBe(b.verdict);
    expect(a.reason).toBe(b.reason);
    expect(a.resolvedKey?.thumbprint).toBe(b.resolvedKey?.thumbprint);
  });

  it("rejects an unsupported alg rather than skipping the check", async () => {
    // "none" is the canonical attack; it must never reach a VALID verdict.
    const header = Buffer.from(JSON.stringify({ alg: "none", kid: "whatever" })).toString("base64url");
    const r = await adapter.verify(Buffer.from(`{"protected":"${header}","payload":"e30","signature":""}`), base);
    expect(r.verdict).toBe("UNVERIFIABLE");
    expect(r.detail).toContain("unsupported or missing alg");
  });
});

describe("verification.* — §4.3 happy path", () => {
  it("a receipt whose numbers recompute is VALID and names its key", async () => {
    const r = await adapter.verify(synth("flat-act.attached.flattened.json"), base);
    expect(r.verdict).toBe("VALID");
    expect(r.reason).toBe("verified");
    expect(r.resolvedKey?.kid).toContain("test-throwaway-ed25519");
    expect(r.resolvedKey?.alg).toBe("EdDSA");
  });

  it("reports the receipt's own gate value as an annotation, not as a verdict", async () => {
    const act = await adapter.verify(synth("flat-act.attached.flattened.json"), base);
    const halt = await adapter.verify(synth("flat-halt.attached.flattened.json"), base);
    // The halt receipt is every bit as VALID as the act receipt. The gate value
    // is the issuer's; the verdict is about whether the receipt holds together.
    expect(act.verdict).toBe("VALID");
    expect(halt.verdict).toBe("VALID");
    expect(act.annotations?.["receipt_gate"]).toBe("act");
    expect(halt.annotations?.["receipt_gate"]).toBe("halt");
  });

  it("recomputes the AND_PRESENT composition", async () => {
    const r = await adapter.verify(synth("composed-halt.general.json"), base);
    expect(r.verdict).toBe("VALID");
    expect(r.annotations?.["receipt_gate"]).toBe("halt");
  });
});

describe("verification.* — INVALID (key-binding): signature fails under a resolved key", () => {
  it.each([
    "tamper-mutated-confidence",
    "tamper-mutated-gate",
    "tamper-mutated-mapping-hash",
    "tamper-mutated-exp",
    "tamper-mutated-signature",
  ])("%s is INVALID and names the resolved key", async (name) => {
    const r = await adapter.verify(synth(`${name}.attached.flattened.json`), base);
    expect(r.verdict).toBe("INVALID");
    expect(r.reason).toBe("signature_invalid");
    expect(r.resolvedKey).toBeDefined();
    expect(r.resolvedKey?.kid).toContain("test-throwaway");
  });

  it("a composed envelope with one bad signature does not pass on a partial quorum", async () => {
    const r = await adapter.verify(synth("composed-one-bad-signature.general.json"), base);
    expect(r.verdict).toBe("INVALID");
    expect(r.detail).toContain("signatures[1]");
  });
});

describe("verification.* — UNVERIFIABLE: recompute, mapping, expiry, malformed", () => {
  // These payloads are correctly signed. Only the recompute catches them, which
  // is what makes §4.3 steps 2-7 load-bearing rather than decorative.
  it.each([
    ["tamper-resigned-confidence", "recompute_mismatch"],
    ["tamper-resigned-gate", "recompute_mismatch"],
    ["tamper-resigned-recommendation", "recompute_mismatch"],
    ["tamper-resigned-mapping-hash", "mapping_hash_mismatch"],
    ["tamper-resigned-mapping-id", "mapping_unresolvable"],
    ["tamper-resigned-exp", "expired"],
    ["tamper-resigned-missing-mapping-hash", "malformed_member"],
  ])("%s is UNVERIFIABLE (%s)", async (name, reason) => {
    const r = await adapter.verify(synth(`${name}.attached.flattened.json`), base);
    expect(r.verdict).toBe("UNVERIFIABLE");
    expect(r.reason).toBe(reason);
    // The fail-closed guarantee: no key line on an UNVERIFIABLE result, even
    // though the signature over these payloads is perfectly good.
    expect(r.resolvedKey).toBeUndefined();
  });

  it("reports how far §4.3 got, without claiming the receipt verified", async () => {
    const r = await adapter.verify(synth("tamper-resigned-exp.attached.flattened.json"), base);
    expect(r.annotations?.["jws_signature_check"]).toBe("passed");
    expect(r.annotations?.["failed_at_step"]).toBe(7);
    expect(r.resolvedKey).toBeUndefined();
  });

  it("a composed envelope whose signed decision breaks AND_PRESENT is UNVERIFIABLE", async () => {
    const r = await adapter.verify(synth("composed-rule-violation.general.json"), base);
    expect(r.verdict).toBe("UNVERIFIABLE");
    expect(r.reason).toBe("recompute_mismatch");
    expect(r.detail).toContain("AND_PRESENT");
  });

  it("a null sibling pointer is a grammar break", async () => {
    const r = await adapter.verify(synth("composed-null-sibling.general.json"), base);
    expect(r.verdict).toBe("UNVERIFIABLE");
    expect(r.reason).toBe("malformed_member");
    expect(r.detail).toContain("MUST be absent, not null");
  });

  it("an unresolvable kid is UNVERIFIABLE, never INVALID", async () => {
    // Rebuild the envelope with a kid that is not in the JWKS.
    const doc = JSON.parse(synth("flat-act.attached.flattened.json").toString("utf8")) as Record<string, string>;
    const header = JSON.parse(Buffer.from(doc["protected"]!, "base64url").toString("utf8")) as Record<string, unknown>;
    header["kid"] = "test-throwaway-ed25519-not-published";
    doc["protected"] = Buffer.from(JSON.stringify(header)).toString("base64url");
    const r = await adapter.verify(Buffer.from(JSON.stringify(doc)), base);
    expect(r.verdict).toBe("UNVERIFIABLE");
    expect(r.reason).toBe("key_unresolvable");
    expect(r.resolvedKey).toBeUndefined();
  });

  it("no mapping directory means UNVERIFIABLE — never a substituted default ruleset", async () => {
    const r = await adapter.verify(synth("flat-act.attached.flattened.json"), { jwks: THROWAWAY_JWKS, now: FIXED_NOW });
    expect(r.verdict).toBe("UNVERIFIABLE");
    expect(r.reason).toBe("mapping_unresolvable");
  });

  it("no JWKS means UNVERIFIABLE", async () => {
    const r = await adapter.verify(synth("flat-act.attached.flattened.json"), { mappingDir: MAPPINGS, now: FIXED_NOW });
    expect(r.verdict).toBe("UNVERIFIABLE");
    expect(r.reason).toBe("key_unresolvable");
  });

  it("garbage is UNVERIFIABLE, not INVALID", async () => {
    const r = await adapter.verify(Buffer.from("this is not a JWS"), base);
    expect(r.verdict).toBe("UNVERIFIABLE");
    expect(r.reason).toBe("malformed_receipt");
  });
});

describe("verification.* — §4.3 step 7 clock handling", () => {
  const expired = () => adapter.verify(synth("tamper-resigned-exp.attached.flattened.json"), base);

  it("an expired receipt is UNVERIFIABLE", async () => {
    expect((await expired()).reason).toBe("expired");
  });

  it("clock tolerance is applied, not ignored", async () => {
    // exp is 1600000000; evaluate just past it and widen the tolerance to cover.
    const justAfter = 1600000030;
    const tight = await adapter.verify(synth("tamper-resigned-exp.attached.flattened.json"), {
      ...base,
      now: justAfter,
      clockToleranceSec: 10,
    });
    const loose = await adapter.verify(synth("tamper-resigned-exp.attached.flattened.json"), {
      ...base,
      now: justAfter,
      clockToleranceSec: 120,
    });
    expect(tight.verdict).toBe("UNVERIFIABLE");
    expect(tight.reason).toBe("expired");
    expect(loose.verdict).toBe("VALID");
  });
});

describe("verification.* — published fixtures (snapshots)", () => {
  const composedJwks = { jwks: COMPOSED, mappingDir: MAPPINGS, now: FIXED_NOW } as const;
  const pub = (n: string) => read(join(COMPOSED, n));

  const ACCEPT = ["001", "002", "003", "004", "005", "006", "007"];

  it.each(ACCEPT)(
    "jws-%s: every published signature verifies under the published JWKS",
    async (n) => {
      const r = await adapter.verify(pub(`jws-${n}.json`), composedJwks);
      // Step 1 passes for all seven. The suite then stalls at step 2 because no
      // mapping document is published for the ids these receipts bind to — the
      // fail-closed outcome, recorded in FINDINGS.md.
      expect(r.annotations?.["jws_signature_check"]).toBe("passed");
      expect(r.verdict).toBe("UNVERIFIABLE");
      expect(r.reason).toBe("mapping_unresolvable");
      expect(r.resolvedKey).toBeUndefined();
    },
  );

  it("jws-r01 (signature tampered after the fact) is INVALID and names the failing signer", async () => {
    const r = await adapter.verify(pub("jws-r01.json"), composedJwks);
    expect(r.verdict).toBe("INVALID");
    expect(r.reason).toBe("signature_invalid");
    expect(r.resolvedKey?.kid).toBe("at-fixture-v0.3-composed-2026-06");
  });

  it("jws-r02 (null sibling pointer) is UNVERIFIABLE for the grammar break", async () => {
    const r = await adapter.verify(pub("jws-r02.json"), composedJwks);
    expect(r.verdict).toBe("UNVERIFIABLE");
    expect(r.reason).toBe("malformed_member");
    expect(r.detail).toContain("mycelium_trail_id");
  });

  it.each(["r03", "r04"])("jws-%s is non-VALID", async (n) => {
    const r = await adapter.verify(pub(`jws-${n}.json`), composedJwks);
    expect(r.verdict).not.toBe("VALID");
  });

  it("tampering any signed claim in a published fixture flips it off VALID", async () => {
    const original = pub("jws-001.json");
    const doc = JSON.parse(original.toString("utf8")) as { payload: string; signatures: unknown[] };
    const payload = JSON.parse(Buffer.from(doc.payload, "base64url").toString("utf8")) as Record<string, unknown>;

    const mutations: [string, () => void][] = [
      ["v_confidence", () => void ((payload["v_gate"] as Record<string, unknown>)["v_confidence"] = 0.1)],
      ["v_gate.verdict", () => void ((payload["v_gate"] as Record<string, unknown>)["verdict"] = "halt")],
      [
        "v_gate_mapping_hash",
        () => void ((payload["v_gate"] as Record<string, unknown>)["v_gate_mapping_hash"] = "sha256-" + "0".repeat(64)),
      ],
      ["composed_decision", () => void (payload["composed_decision"] = "halt")],
    ];

    for (const [label, mutate] of mutations) {
      const fresh = JSON.parse(Buffer.from(doc.payload, "base64url").toString("utf8")) as Record<string, unknown>;
      Object.assign(payload, fresh);
      mutate();
      const tampered = {
        ...doc,
        payload: Buffer.from(JSON.stringify(payload)).toString("base64url"),
      };
      const r = await adapter.verify(Buffer.from(JSON.stringify(tampered)), composedJwks);
      expect(r.verdict, `mutating ${label}`).toBe("INVALID");
      expect(r.reason, `mutating ${label}`).toBe("signature_invalid");
    }
  });
});

describe("verification.* — detection", () => {
  it("recognises a flat §4.2 receipt", () => {
    expect(detect(synth("flat-act.attached.flattened.json"))).toBe(true);
  });

  it("recognises a composed envelope", () => {
    expect(detect(synth("composed-act.general.json"))).toBe(true);
  });

  it("does not claim a detached receipt it cannot read the payload of", () => {
    // Conservative by design: with no payload there is nothing to identify.
    expect(detect(synth("flat-act.detached.flattened.json"))).toBe(false);
  });

  it("does not claim an evidence.action chain", () => {
    expect(detect(readFileSync(join(SYNTH, "..", "..", "evidence-action", "vectors", "allow", "chain.jsonl")))).toBe(false);
  });

  it("does not claim an unrelated JWS", () => {
    const header = Buffer.from(JSON.stringify({ alg: "EdDSA", kid: "x" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ hello: "world" })).toString("base64url");
    expect(detect(Buffer.from(`{"protected":"${header}","payload":"${payload}","signature":"AA"}`))).toBe(false);
  });
});
