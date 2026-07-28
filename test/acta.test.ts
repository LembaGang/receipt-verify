// Format 3: acta.receipt/0, per draft-farley-acta-signed-receipts-02, with
// draft-marques-asqav-compliance-receipts-07 read as a profile layered on it.
//
// Two things this file is careful about.
//
// First, §5.10 announces an interoperability test suite that the draft's only
// test-vector reference does not contain (FINDINGS.md §E1). So the "published
// vectors reproduce" claim is split in two: what the published corpus DOES
// establish is asserted against the published bytes, and the six §5.10 vector
// classes are asserted against fixtures we built and labelled as ours.
//
// Second, where the draft contradicts itself the test asserts the REFUSAL and
// its explanation, not a resolution. A test that pinned one reading as "right"
// would be inventing a normative answer the documents do not contain.

import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { createPublicKey, verify as cryptoVerify } from "node:crypto";
import { jcs } from "@headlessoracle/chirindo/dist/vendor/recorder/index.js";
import { actaAdapter, detect, FORMAT } from "../src/adapters/acta.js";
import { detectFormat } from "../src/detect.js";
import type { VerifyOptions, VerifyResult } from "../src/types.js";
import { ACTA_JWKS, ACTA_NOW, ACTA_PUB, ACTA_SYNTH, REFS, read, sha256Hex } from "./helpers.js";

const synth = (rel: string) => join(ACTA_SYNTH, ...rel.split("/"));
const pub = (rel: string) => join(ACTA_PUB, ...rel.split("/"));

const base: VerifyOptions = { jwks: ACTA_JWKS, now: ACTA_NOW };

function verify(rel: string, extra: Partial<VerifyOptions> = {}): Promise<VerifyResult> {
  return actaAdapter.verify(read(synth(rel)), { ...base, ...extra });
}

// --------------------------------------------------------------------------

describe("acta — snapshot integrity", () => {
  // The section numbers this whole file cites are only meaningful against the
  // exact draft revisions that were read. Pin them.
  it("refs/ holds the two draft revisions the adapter was written against", () => {
    expect(sha256Hex(read(join(REFS, "draft-farley-acta-signed-receipts-02.txt")))).toBe(
      "14501a68a86e3cc403f56967b19b732316ad3cc2fc011ce3d14aec9c1de68bd2",
    );
    expect(sha256Hex(read(join(REFS, "draft-marques-asqav-compliance-receipts-07.txt")))).toBe(
      "082615447288fa1e983fa2cfb7aa7356fbb35d05d65ea256f66111487746d52f",
    );
  });
});

describe("acta — detection", () => {
  it("claims the §2.1 envelope", () => {
    expect(detect(read(synth("cleartext.receipt.json")))).toBe(true);
  });

  it("refuses a JWS, whose payload and signature are strings", () => {
    expect(detect(Buffer.from('{"payload":"eyJhIjoxfQ","protected":"e30","signature":"AA"}', "utf8"))).toBe(false);
    expect(detect(Buffer.from("e30.eyJhIjoxfQ.AA", "utf8"))).toBe(false);
  });

  it("refuses a nulled signature rather than treating it as absent", () => {
    expect(detect(read(synth("malformed-sig-nulled.receipt.json")))).toBe(false);
  });

  it("auto-detects to exactly one adapter, with no ambiguity against the other two", () => {
    const d = detectFormat(read(synth("cleartext.receipt.json")));
    expect(d.ok).toBe(true);
    if (d.ok) expect(d.adapter.format).toBe(FORMAT);
  });
});

// --------------------------------------------------------------------------
// What the PUBLISHED corpus actually establishes.
// --------------------------------------------------------------------------

describe("acta — published corpus (ScopeBlind/agent-governance-testvectors)", () => {
  const receipt = JSON.parse(read(pub("aps-gateway-enforcement/2-external-verification/receipt.json")).toString("utf8"));
  const canonical = read(pub("aps-gateway-enforcement/2-external-verification/canonical.txt"));
  const jwks = JSON.parse(read(pub("aps-gateway-enforcement/2-external-verification/jwks.json")).toString("utf8"));

  // This is the one thing the published corpus lets us prove about our own
  // canonicalization: byte-parity against a canonical form somebody else
  // computed and published.
  it("our JCS is byte-identical to the published canonical.txt", () => {
    const { signature, ...rest } = receipt;
    expect(Buffer.from(jcs(rest), "utf8").equals(canonical)).toBe(true);
  });

  it("the published signature verifies over those bytes under the published JWKS", () => {
    const key = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: jwks.keys[0].x }, format: "jwk" });
    expect(cryptoVerify(null, canonical, key, Buffer.from(receipt.signature, "hex"))).toBe(true);
  });

  // FINDINGS.md §E2: the signature covers the receipt object minus `signature`
  // (§5.6), NOT the inner `payload` member (§4.1 step 2). Asserted so the
  // finding is a test result rather than a claim.
  it("signs under the §5.6 scope and NOT under the §4.1 scope", () => {
    const key = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: jwks.keys[0].x }, format: "jwk" });
    const sig = Buffer.from(receipt.signature, "hex");
    const { signature, ...rest } = receipt;
    expect(cryptoVerify(null, Buffer.from(jcs(rest), "utf8"), key, sig)).toBe(true);
    expect(cryptoVerify(null, Buffer.from(jcs(receipt.payload), "utf8"), key, sig)).toBe(false);
  });

  // FINDINGS.md §E5. The corpus is cited by the draft as its test vectors, but
  // its receipts are not the draft's §2.1 envelope: `signature` is a hex
  // string, not the {alg, kid, sig} object §2.1.1 makes REQUIRED.
  it("is not a §2.1 envelope, so the adapter refuses it rather than guessing", async () => {
    expect(typeof receipt.signature).toBe("string");
    const r = await actaAdapter.verify(read(pub("aps-gateway-enforcement/2-external-verification/receipt.json")), base);
    expect(r.verdict).toBe("UNVERIFIABLE");
    expect(r.reason).toBe("malformed_receipt");
    expect(r.resolvedKey).toBeUndefined();
  });

  // FINDINGS.md §E5. It also matches neither branch of the corpus's OWN
  // conformance schema: v1Flat requires receipt_id/receipt_version/public_key,
  // v2Envelope requires pubkey. The receipt has none of them.
  it("matches neither branch of the corpus's own oneOf receipt schema", () => {
    const schema = JSON.parse(read(pub("expected/receipt-schema.json")).toString("utf8"));
    const v1Required: string[] = schema.definitions.v1Flat.required;
    const v2Required: string[] = schema.definitions.v2Envelope.required;
    expect(v1Required.filter((k) => !(k in receipt))).not.toHaveLength(0);
    expect(v2Required.filter((k) => !(k in receipt))).not.toHaveLength(0);
  });

  // FINDINGS.md §E1: the corpus declares itself tied to -01, and carries none
  // of the six §5.10 vector classes.
  it("declares itself tied to draft revision -01", () => {
    expect(read(pub("spec.md")).toString("utf8")).toContain("draft-farley-acta-signed-receipts-01");
  });
});

// --------------------------------------------------------------------------
// §5.10 minimum set, built locally. Positives.
// --------------------------------------------------------------------------

describe("acta — §5.10 minimum set verifies", () => {
  it("item 1: a cleartext receipt with no committed_fields_root", async () => {
    const r = await verify("cleartext.receipt.json");
    expect(r.verdict).toBe("VALID");
    expect(r.reason).toBe("verified");
    expect(r.resolvedKey?.kid).toBe("sb:issuer:BTHQTy7E1W77");
    expect(r.annotations?.["signature_scope"]).toContain("farley-5.6");
  });

  it("item 2: four committed fields, root and every inclusion proof", async () => {
    const r = await verify("committed-4.receipt.json", { disclosures: read(synth("committed-4.disclosures.json")) });
    expect(r.verdict).toBe("VALID");
    expect(r.annotations?.["commitment_check"]).toBe("passed (4 leaves)");
  });

  it("item 6: five committed fields, exercising the §5.1 recursive split", async () => {
    const r = await verify("committed-5.receipt.json", { disclosures: read(synth("committed-5.disclosures.json")) });
    expect(r.verdict).toBe("VALID");
    expect(r.annotations?.["commitment_check"]).toBe("passed (5 leaves)");
  });

  it("item 3: a chain of three, each link recomputed under §5.7", async () => {
    for (const [receipt, prev] of [
      ["chain-farley/002.receipt.json", "chain-farley/001.receipt.json"],
      ["chain-farley/003.receipt.json", "chain-farley/002.receipt.json"],
    ] as const) {
      const r = await verify(receipt, { previousReceipt: read(synth(prev)) });
      expect(r.verdict, receipt).toBe("VALID");
      expect(r.annotations?.["chain_digest_scope"]).toBe("farley-5.7");
    }
  });

  it("item 3: the chain root reports its genesis as marques' stipulation, not farley's", async () => {
    const r = await verify("chain-farley/001.receipt.json");
    expect(r.verdict).toBe("VALID");
    expect(String(r.annotations?.["chain_link"])).toContain("marques §5.3 stipulation");
  });

  it("item 5: an algorithm-mixed chain, each leg checked against its own signature.alg", async () => {
    const first = await verify("chain-mixed-alg/001.receipt.json");
    expect(first.verdict).toBe("VALID");
    expect(first.annotations?.["alg"]).toBe("EdDSA");

    const second = await verify("chain-mixed-alg/002.receipt.json", {
      previousReceipt: read(synth("chain-mixed-alg/001.receipt.json")),
    });
    expect(second.verdict).toBe("VALID");
    expect(second.annotations?.["alg"]).toBe("ES256");
    expect(second.annotations?.["chain_digest_scope"]).toBe("farley-5.7");
  });

  it("a committed root with no disclosures is VALID but says the commitment went unchecked", async () => {
    const r = await verify("committed-4.receipt.json");
    expect(r.verdict).toBe("VALID");
    expect(r.annotations?.["commitment_check"]).toBe("not performed (no --disclose)");
  });
});

// --------------------------------------------------------------------------
// Tamper matrix. Negatives.
// --------------------------------------------------------------------------

describe("acta — tamper matrix flips the verdict", () => {
  it("a mutated payload value fails the signature", async () => {
    const r = await verify("tamper-payload-mutated.receipt.json");
    expect(r.verdict).toBe("INVALID");
    expect(r.reason).toBe("signature_invalid");
    expect(r.resolvedKey).toBeDefined();
  });

  it("a flipped signature bit fails the signature", async () => {
    const r = await verify("tamper-signature-bitflip.receipt.json");
    expect(r.verdict).toBe("INVALID");
    expect(r.reason).toBe("signature_invalid");
  });

  it("issuer_id that disagrees with kid is a key-binding failure, not a signature failure", async () => {
    const r = await verify("tamper-issuer-kid-mismatch.receipt.json");
    expect(r.verdict).toBe("INVALID");
    expect(r.reason).toBe("key_binding_mismatch");
  });

  it("a committed root that disagrees with the disclosed leaves is a commitment failure", async () => {
    const r = await verify("tamper-merkle-root.receipt.json", {
      disclosures: read(synth("committed-4.disclosures.json")),
    });
    expect(r.verdict).toBe("INVALID");
    expect(r.reason).toBe("content_commitment_mismatch");
  });

  it("§5.10 item 4: a tampered Merkle proof MUST fail verification", async () => {
    const r = await verify("committed-4.receipt.json", {
      disclosures: read(synth("tamper-merkle-proof.disclosures.json")),
    });
    expect(r.verdict).toBe("INVALID");
    expect(r.reason).toBe("content_commitment_mismatch");
    expect(r.detail).toContain("inclusion proof");
  });

  it("a chain link matching no known digest scope is a broken chain, not a spec variant", async () => {
    const r = await verify("tamper-chain-broken.receipt.json", {
      previousReceipt: read(synth("chain-farley/001.receipt.json")),
    });
    expect(r.verdict).toBe("INVALID");
    expect(r.reason).toBe("chain_linkage_broken");
    expect(r.detail).toContain("nor under either signature-exclusive reading");
  });
});

describe("acta — fail-closed refusals stay UNVERIFIABLE", () => {
  const cases: [string, string, string][] = [
    ["unresolvable-kid.receipt.json", "key_unresolvable", "no key for kid"],
    ["alg-mldsa65.receipt.json", "unsupported_algorithm", "§5.8"],
    ["malformed-sig-not-hex.receipt.json", "malformed_receipt", "lowercase hexadecimal"],
    ["malformed-sig-nulled.receipt.json", "malformed_receipt", "REMOVED, not nulled"],
  ];

  for (const [file, reason, needle] of cases) {
    it(`${file} → UNVERIFIABLE/${reason}`, async () => {
      const r = await verify(file);
      expect(r.verdict).toBe("UNVERIFIABLE");
      expect(r.reason).toBe(reason);
      expect(r.detail).toContain(needle);
      // The contract: an UNVERIFIABLE result never names a key it verified under.
      expect(r.resolvedKey).toBeUndefined();
    });
  }

  it("no JWKS is a refusal, not a signature-free pass", async () => {
    const r = await actaAdapter.verify(read(synth("cleartext.receipt.json")), { now: ACTA_NOW });
    expect(r.verdict).toBe("UNVERIFIABLE");
    expect(r.reason).toBe("key_unresolvable");
  });
});

// --------------------------------------------------------------------------
// The contradictions, demonstrated in both directions.
// --------------------------------------------------------------------------

describe("acta — signature-scope contradiction (§4.1 step 2 vs §5.6)", () => {
  it("a receipt signed under §5.6 verifies and names the scope it used", async () => {
    const r = await verify("cleartext.receipt.json");
    expect(r.verdict).toBe("VALID");
    expect(r.annotations?.["signature_scope"]).toBe("farley-5.6 (receipt object minus `signature`)");
  });

  it("a receipt signed under §4.1 is refused, and the refusal names §4.1", async () => {
    const r = await verify("sigscope-4.1.receipt.json");
    expect(r.verdict).toBe("INVALID");
    expect(r.reason).toBe("signature_invalid");
    expect(r.detail).toContain("DOES verify over the §4.1 step 2 bytes");
    // Never silently accepted: the alternative reading explains the refusal,
    // it does not license one.
    expect(r.verdict).not.toBe("VALID");
  });
});

describe("acta — chain-digest contradiction (farley §5.7 vs marques §5.3)", () => {
  it("farley §5.7 is the normative scope and reaches VALID", async () => {
    const r = await verify("chain-farley/002.receipt.json", {
      previousReceipt: read(synth("chain-farley/001.receipt.json")),
    });
    expect(r.verdict).toBe("VALID");
    expect(r.annotations?.["chain_digest_scope"]).toBe("farley-5.7");
  });

  // marques §5.3's operative exclusion and its own rationale select different
  // bytes, so there are two signature-exclusive variants to detect, not one.
  const variants: [string, string][] = [
    ["chain-marques-payload", "marques-5.3-payload"],
    ["chain-marques-signing-input", "marques-5.3-signing-input"],
  ];

  for (const [dir, variantName] of variants) {
    it(`a chain built to ${variantName} is refused, and the refusal names the variant`, async () => {
      const r = await verify(`${dir}/002.receipt.json`, {
        previousReceipt: read(synth(`${dir}/001.receipt.json`)),
      });
      expect(r.verdict).toBe("INVALID");
      expect(r.reason).toBe("chain_linkage_broken");
      expect(r.detail).toContain(`DOES match it under ${variantName}`);
      expect(r.detail).toContain("refuses rather than accept either silently");
      expect(r.resolvedKey).toBeDefined();
    });
  }

  it("a chain link that is present but uncheckable says so instead of passing quietly", async () => {
    const r = await verify("chain-farley/002.receipt.json");
    expect(r.verdict).toBe("VALID");
    expect(r.annotations?.["chain_link"]).toBe("present but not checked (no --prev)");
    expect(r.annotations?.["chain_digest_scope"]).toBeUndefined();
  });
});
