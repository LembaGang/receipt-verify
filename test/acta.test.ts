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
//
// 2026-09-01: draft-marques-asqav-compliance-receipts-08 §4 (31 Aug 2026,
// pinned in refs/) resolves the contradiction the second point describes: an
// ACTA-family receipt keeps farley §5.7's whole-receipt scope, and the
// payload-member scope belongs to -08's Compliance Receipt envelope, which
// src/adapters/acta.ts now declines at detection. The chain-digest tests below
// still assert the refusal; what they assert about its explanation is that it
// cites the -08 resolution, not a contradiction. The -07 pin in the
// snapshot-integrity block stays, because -07 is the revision the adapter was
// written against and the file is still tracked; the -08 pin is added beside
// it because the refusal text now cites -08.

import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { createPublicKey, verify as cryptoVerify } from "node:crypto";
import { jcs } from "@headlessoracle/chirindo/dist/vendor/recorder/index.js";
import { actaAdapter, detect, FORMAT } from "../src/adapters/acta.js";
import { detectFormat } from "../src/detect.js";
import { coverageFor } from "../src/coverage.js";
import type { VerifyOptions, VerifyResult } from "../src/types.js";
import { ACTA_JWKS, ACTA_NOW, ACTA_PUB, ACTA_SYNTH, ASQAV_05C1C49, FIX, REFS, read, sha256Hex } from "./helpers.js";

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

  it("refs/ holds the -08 revision the 2026-09-01 refusal text cites", () => {
    expect(sha256Hex(read(join(REFS, "draft-marques-asqav-compliance-receipts-08.txt")))).toBe(
      "ee3ca5d7c0acc1cb9b8025d29f19a7d73991718ca35d3bf4229f7b4264976ec0",
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
// The -08 Compliance Receipt envelope, against the author's own published
// vectors (asqav-sdk @ 05c1c49, pinned under fixtures/asqav/05c1c49/).
//
// -08 §5.3's interoperability note (line 1037) and §11.2 (line 3774) both make
// the top-level `anchors` key the discriminator between the two wire formats,
// and §11.2 forbids retrying the other scope once one fails. That makes the
// refusal below load-bearing: if this adapter claimed a Compliance Receipt, the
// draft's own rule would forbid the recovery that might have caught it.
// --------------------------------------------------------------------------

describe("acta — declines the draft-marques -08 Compliance Receipt envelope", () => {
  const asqavVec = join(ASQAV_05C1C49, "verifier", "conformance-vectors");
  const complianceReceipt = read(join(asqavVec, "asqav-03-chain-link", "receipt.json"));

  it("pins the vector bytes this block reads", () => {
    // The upstream blob bytes, not a working-tree checkout: core.autocrlf is on
    // for this machine, so a checked-out copy would digest differently.
    expect(sha256Hex(complianceReceipt)).toBe("f9f29b753d19c4cb5d518ac6d73c436685279aeab92a085c699c2de8a4598085");
  });

  it("does not claim a -08 envelope, so it cannot mis-grade one as ACTA", () => {
    expect(detect(complianceReceipt)).toBe(false);
  });

  it("leaves the format unrecognized rather than naming a wrong one", () => {
    // The tool does not positively identify Asqav — it has no Asqav adapter.
    // It refuses and tells the caller to name the format, which is the
    // fail-closed half of §11.2's "MUST NOT retry under a different scope".
    const d = detectFormat(complianceReceipt);
    expect(d.ok).toBe(false);
    if (!d.ok) {
      expect(d.reason).toBe("none");
      expect(d.candidates).toEqual([]);
    }
  });

  it("declines on the anchors key itself, not on some incidental malformation", () => {
    // Control: strip `anchors` and the same bytes ARE claimed. Without this,
    // the refusal above would pass even if it fired for an unrelated reason.
    const withoutAnchors = JSON.parse(complianceReceipt.toString("utf8")) as Record<string, unknown>;
    delete withoutAnchors["anchors"];
    expect(detect(Buffer.from(JSON.stringify(withoutAnchors), "utf8"))).toBe(true);
  });

  it("names the -08 pin by digest in the coverage sources", () => {
    const sources = coverageFor(FORMAT)?.sources ?? [];
    expect(sources.some((s) => s.includes("ee3ca5d7c0acc1cb9b8025d29f19a7d73991718ca35d3bf4229f7b4264976ec0"))).toBe(true);
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
      expect(r.detail).toContain(
        "draft-marques-asqav-compliance-receipts-08 §4 confirms an ACTA-family receipt keeps that scope",
      );
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

// --------------------------------------------------------------------------
// M6, pinned so the identification reproduces from this repository alone.
//
// FINDINGS-rerun-2026-09-02.md M6 records that the published
// `counterparty_binding.envelope_hash` `0d6c88a1…` is the three-key digest of
// the peer envelope as it stood BEFORE asqav-sdk `ee8a3e7` (PR #416,
// 2026-08-04), which moved `payload.previousReceiptHash` off the `sha256:`
// genesis seed and recomputed each vector's own `canonical` and `sha256` but
// not that derived literal. That was established against a clone. A clone is
// not evidence this repository holds: it can be rewritten, and this machine
// keeps no history for it. So the two states either side of #416 are pinned as
// fixtures, taken with `git cat-file blob` and never from a worktree, and the
// identification is re-derived here from those bytes.
//
// What this block does NOT assert: that `0d6c88a1…` is correct for the
// envelope the vectors publish today. It is not — that is the finding. These
// assertions pin WHICH bytes produce it, which is what turns M6 from a negative
// into a defect with a named cause.
// --------------------------------------------------------------------------

describe("acta — M6: the published envelope_hash is the pre-#416 three-key digest", () => {
  const ENVELOPE = "counterparty_binding_envelope_byte_equality";
  const BINDING = "counterparty_binding_happy_path";

  // The three-key digest {payload, signature, anchors}: scope (a), what -08
  // §5.7 states, and the scope the SDK's own compute_envelope_hash implements.
  const PRE_416 = "0d6c88a16e96fd3429be13e44dc957062f77d417dc0c3ea28e4fa496230de2a9";
  const POST_416 = "e89bf2fe64bd7dab3a606ea265ca14f88f4d161ec0485062a7facee4902c655f";
  const SEED = "sha256:" + "0".repeat(64);

  type Vector = { name: string; input: Record<string, unknown> };

  // Last state before #416, and first state after it. `ee8a3e7` is also the
  // last commit to touch conformance/vectors.json before `05c1c49`, so its blob
  // and the 05c1c49 fixture's are one upstream object — pinned separately
  // anyway, because what this block is about is the commit each state belongs
  // to, not the number of distinct blobs.
  const corpus = {
    "4cbdfc0": read(join(FIX, "asqav", "history", "4cbdfc0", "conformance", "vectors.json")),
    ee8a3e7: read(join(FIX, "asqav", "history", "ee8a3e7", "conformance", "vectors.json")),
    "05c1c49": read(join(ASQAV_05C1C49, "conformance", "vectors.json")),
  };

  const vectorsOf = (bytes: Buffer): Vector[] => (JSON.parse(bytes.toString("utf8")) as { vectors: Vector[] }).vectors;

  const vectorNamed = (bytes: Buffer, name: string): Vector => {
    const v = vectorsOf(bytes).find((x) => x.name === name);
    if (!v) throw new Error(`vector not found: ${name}`);
    return v;
  };

  // The three-key object the envelope vector's `input` is. Member order here is
  // irrelevant — JCS sorts it — but the presence check is not: digesting a
  // two-key object would report a mismatch instead of a missing member.
  const envelopeOf = (bytes: Buffer): Record<string, unknown> => {
    const input = vectorNamed(bytes, ENVELOPE).input;
    for (const k of ["payload", "signature", "anchors"]) {
      if (!(k in input)) throw new Error(`envelope vector lacks member ${k}`);
    }
    return { payload: input["payload"], signature: input["signature"], anchors: input["anchors"] };
  };

  const threeKeyDigest = (bytes: Buffer): string => sha256Hex(Buffer.from(jcs(envelopeOf(bytes)), "utf8"));

  // The value B actually publishes, base64 in the vector, decoded to hex here.
  const publishedEnvelopeHash = (bytes: Buffer): string => {
    const cb = vectorNamed(bytes, BINDING).input["counterparty_binding"] as Record<string, string>;
    return Buffer.from(cb["envelope_hash"]!, "base64").toString("hex");
  };

  // Every member path at which two JSON values differ, for the one-member claim.
  const differingMembers = (a: unknown, b: unknown, path = ""): string[] => {
    const isObj = (v: unknown): v is Record<string, unknown> =>
      typeof v === "object" && v !== null && !Array.isArray(v);
    if (isObj(a) && isObj(b)) {
      return [...new Set([...Object.keys(a), ...Object.keys(b)])]
        .sort()
        .flatMap((k) => differingMembers(a[k], b[k], path ? `${path}.${k}` : k));
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return [path];
      return a.flatMap((x, i) => differingMembers(x, b[i], `${path}[${i}]`));
    }
    return a === b ? [] : [path];
  };

  it("pins the bytes this block reads: upstream blob bytes, not a checkout", () => {
    // core.autocrlf is true on this machine, so a working-tree copy of these
    // files would digest differently. These came out of `git cat-file blob`.
    expect(sha256Hex(corpus["4cbdfc0"])).toBe("68610d93ea1dda19176b6a68a5293d07bbc38118e5c4fc725b8b9a639839fa3a");
    expect(sha256Hex(corpus["ee8a3e7"])).toBe("2b260f4efc0f3ada078cf98108d04ea9d3491bf7c684e9d97dac567ec289dd6a");
    expect(sha256Hex(corpus["05c1c49"])).toBe("2b260f4efc0f3ada078cf98108d04ea9d3491bf7c684e9d97dac567ec289dd6a");
  });

  it("digests to the published envelope_hash at 4cbdfc0, the last state before #416", () => {
    expect(threeKeyDigest(corpus["4cbdfc0"])).toBe(PRE_416);
  });

  it("digests to something else at ee8a3e7 and at 05c1c49, every state after #416", () => {
    expect(threeKeyDigest(corpus["ee8a3e7"])).toBe(POST_416);
    expect(threeKeyDigest(corpus["05c1c49"])).toBe(POST_416);
  });

  it("publishes the same envelope_hash at all three commits, including the two it no longer matches", () => {
    // The defect in one assertion: the derived literal did not move when its
    // input did. At 4cbdfc0 the published value equals the digest of the
    // envelope beside it; at ee8a3e7 and 05c1c49 it equals the digest of an
    // envelope that is no longer there.
    for (const commit of ["4cbdfc0", "ee8a3e7", "05c1c49"] as const) {
      expect(publishedEnvelopeHash(corpus[commit])).toBe(PRE_416);
    }
    expect(publishedEnvelopeHash(corpus["4cbdfc0"])).toBe(threeKeyDigest(corpus["4cbdfc0"]));
    expect(publishedEnvelopeHash(corpus["05c1c49"])).not.toBe(threeKeyDigest(corpus["05c1c49"]));
  });

  it("changed exactly one member across #416: payload.previousReceiptHash", () => {
    // The cause stated as a measurement rather than as a reading of the commit
    // message. Had #416 touched anything else in the envelope, the digest
    // change could not be attributed to the genesis-seed edit alone.
    expect(differingMembers(envelopeOf(corpus["4cbdfc0"]), envelopeOf(corpus["ee8a3e7"]))).toEqual([
      "payload.previousReceiptHash",
    ]);
    const before = envelopeOf(corpus["4cbdfc0"])["payload"] as Record<string, string>;
    const after = envelopeOf(corpus["ee8a3e7"])["payload"] as Record<string, string>;
    expect(before["previousReceiptHash"]).toBe(SEED);
    expect(after["previousReceiptHash"]).toBe("0".repeat(64));
    // And nothing at all changed between ee8a3e7 and the commit -08 pins.
    expect(differingMembers(envelopeOf(corpus["ee8a3e7"]), envelopeOf(corpus["05c1c49"]))).toEqual([]);
  });

  it("CONTROL: one byte changed in the 4cbdfc0 bytes and the digest no longer reaches PRE_416", () => {
    // Without this the block above proves only that two constants were typed in
    // correctly. Mutate one byte of the fixture in this test's own copy — the
    // last digit of the genesis seed inside the envelope vector, 0 -> 1, chosen
    // because it keeps the JSON parseable so the failure is the digest and not
    // a throw — and PRE_416 must no longer be reachable from these bytes.
    const bytes = Buffer.from(corpus["4cbdfc0"]);
    const vectorAt = bytes.indexOf(`"name": "${ENVELOPE}"`);
    expect(vectorAt).toBeGreaterThan(-1);
    const seedAt = bytes.indexOf(`"${SEED}"`, vectorAt);
    expect(seedAt).toBeGreaterThan(-1);
    const lastZero = seedAt + 1 + SEED.length - 1;
    expect(bytes[lastZero]).toBe(0x30); // '0'
    bytes[lastZero] = 0x31; // '1'

    // One byte, and only one: a wider edit would make the failure below
    // unattributable to the single-byte change this control claims to make.
    expect(bytes.length).toBe(corpus["4cbdfc0"].length);
    let differingBytes = 0;
    for (let i = 0; i < bytes.length; i++) if (bytes[i] !== corpus["4cbdfc0"][i]) differingBytes++;
    expect(differingBytes).toBe(1);

    expect(threeKeyDigest(bytes)).not.toBe(PRE_416);
    expect(threeKeyDigest(bytes)).not.toBe(POST_416);
    // The unmutated copy is untouched, so the assertions above still hold.
    expect(threeKeyDigest(corpus["4cbdfc0"])).toBe(PRE_416);
  });
});
