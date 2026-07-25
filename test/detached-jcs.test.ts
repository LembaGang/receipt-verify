// The detached + JCS exercise.
//
// The published examples are attached, which side-steps canonicalization
// entirely: the signature covers exact bytes carried inside the envelope. The
// production wire form is detached, where issuer and verifier must independently
// arrive at the same payload octets or nothing verifies. These tests prove the
// detached path against fixtures signed by the published throwaway key.

import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { jcs } from "@headlessoracle/chirindo/dist/vendor/recorder/index.js";
import { verificationStateAdapter as adapter } from "../src/adapters/verification-state.js";
import { isUnencodedPayload, parseJws, signingInput, b64uEncode } from "../src/jws.js";
import { COMPOSED, MAPPINGS, SYNTH, THROWAWAY_JWKS, FIXED_NOW, read } from "./helpers.js";

const base = { jwks: THROWAWAY_JWKS, mappingDir: MAPPINGS, now: FIXED_NOW } as const;
const synth = (n: string) => read(join(SYNTH, n));
const payloadObject = synth("flat-act.payload.json");

describe("detached JWS + JCS-canonicalized payload", () => {
  it("the payload fixture is deliberately NOT in canonical key order", () => {
    // If it were already sorted, these tests would pass for a JSON.stringify
    // implementation too and would prove nothing.
    const raw = payloadObject.toString("utf8");
    const obj = JSON.parse(raw) as Record<string, unknown>;
    expect(Object.keys(obj)).not.toEqual([...Object.keys(obj)].sort());
    expect(raw.replace(/\s/g, "")).not.toBe(jcs(obj));
  });

  it("flattened detached + JCS verifies", async () => {
    const r = await adapter.verify(synth("flat-act.detached.flattened.json"), {
      ...base,
      detachedPayload: payloadObject,
      canonicalizePayload: true,
    });
    expect(r.verdict).toBe("VALID");
    expect(r.detail).toContain("detached payload canonicalized with RFC 8785 JCS");
  });

  it("compact detached + JCS verifies", async () => {
    const r = await adapter.verify(synth("flat-act.detached.compact.jws"), {
      ...base,
      detachedPayload: payloadObject,
      canonicalizePayload: true,
    });
    expect(r.verdict).toBe("VALID");
    expect(r.detail).toContain("compact serialization");
  });

  it("RFC 7797 unencoded payload (b64:false) detached + JCS verifies", async () => {
    const r = await adapter.verify(synth("flat-act.detached-b64false.flattened.json"), {
      ...base,
      detachedPayload: payloadObject,
      canonicalizePayload: true,
    });
    expect(r.verdict).toBe("VALID");
  });

  it("the b64:false fixture really does use the unencoded signing input", () => {
    // Guards against the fixture silently reverting to the ordinary form and
    // the test above passing for the wrong reason.
    const parsed = parseJws(synth("flat-act.detached-b64false.flattened.json"));
    const sig = parsed.signatures[0]!;
    expect(isUnencodedPayload(sig)).toBe(true);
    const canonical = Buffer.from(jcs(JSON.parse(payloadObject.toString("utf8"))), "utf8");
    const input = signingInput(sig, canonical);
    expect(input.toString("utf8")).toBe(sig.protectedB64 + "." + canonical.toString("utf8"));
    expect(input.toString("utf8")).not.toContain(b64uEncode(canonical));
  });

  it("without canonicalization the same payload does NOT verify", async () => {
    // This is the whole point. Hand the verifier the identical logical payload
    // as raw pretty-printed bytes and the signature fails — canonicalization is
    // load-bearing, not cosmetic.
    const r = await adapter.verify(synth("flat-act.detached.flattened.json"), {
      ...base,
      detachedPayload: payloadObject,
      canonicalizePayload: false,
    });
    expect(r.verdict).toBe("INVALID");
    expect(r.reason).toBe("signature_invalid");
  });

  it("key order in the supplied payload does not matter once canonicalized", async () => {
    const obj = JSON.parse(payloadObject.toString("utf8")) as Record<string, unknown>;
    const reversed = Object.fromEntries(Object.entries(obj).reverse());
    const r = await adapter.verify(synth("flat-act.detached.flattened.json"), {
      ...base,
      detachedPayload: Buffer.from(JSON.stringify(reversed, null, 4)),
      canonicalizePayload: true,
    });
    expect(r.verdict).toBe("VALID");
  });

  it("a detached receipt with no payload supplied is UNVERIFIABLE", async () => {
    const r = await adapter.verify(synth("flat-act.detached.flattened.json"), base);
    expect(r.verdict).toBe("UNVERIFIABLE");
    expect(r.reason).toBe("malformed_receipt");
    expect(r.detail).toContain("no payload was supplied");
  });

  it("a detached receipt with a substituted payload is INVALID, not VALID", async () => {
    const obj = JSON.parse(payloadObject.toString("utf8")) as Record<string, unknown>;
    obj["v_confidence"] = 0.1;
    const r = await adapter.verify(synth("flat-act.detached.flattened.json"), {
      ...base,
      detachedPayload: Buffer.from(JSON.stringify(obj)),
      canonicalizePayload: true,
    });
    expect(r.verdict).toBe("INVALID");
    expect(r.reason).toBe("signature_invalid");
  });

  it("b64:false without crit is refused rather than guessed at", async () => {
    const parsed = JSON.parse(synth("flat-act.detached-b64false.flattened.json").toString("utf8")) as Record<string, string>;
    const header = JSON.parse(Buffer.from(parsed["protected"]!, "base64url").toString("utf8")) as Record<string, unknown>;
    delete header["crit"];
    parsed["protected"] = Buffer.from(JSON.stringify(header)).toString("base64url");
    const r = await adapter.verify(Buffer.from(JSON.stringify(parsed)), {
      ...base,
      detachedPayload: payloadObject,
      canonicalizePayload: true,
    });
    expect(r.verdict).toBe("UNVERIFIABLE");
    expect(r.detail).toContain("RFC 7797");
  });
});

describe("the published detached sample", () => {
  // sample_receipt_detached_jws.json is the only detached artifact published
  // anywhere in the fixture set. It is the attached sample with the payload
  // member removed: same protected header, same signature bytes.
  const dir = join(COMPOSED, "..");
  const detached = readFileSync(join(dir, "sample_receipt_detached_jws.json"));
  const attached = readFileSync(join(dir, "sample_receipt_attached_jws.json"));

  it("carries the same signature and protected header as the attached sample", () => {
    const d = JSON.parse(detached.toString("utf8")) as Record<string, string>;
    const a = JSON.parse(attached.toString("utf8")) as Record<string, string>;
    expect(d["signature"]).toBe(a["signature"]);
    expect(d["protected"]).toBe(a["protected"]);
    expect(d["payload"]).toBeUndefined();
  });

  it("is an ordinary RFC 7515 detached JWS, not an RFC 7797 b64:false one", () => {
    const parsed = parseJws(detached);
    const sig = parsed.signatures[0]!;
    expect(sig.header["b64"]).toBeUndefined();
    expect(sig.header["crit"]).toBeUndefined();
    expect(isUnencodedPayload(sig)).toBe(false);
  });

  it("verifies when the exact attached payload octets are supplied", async () => {
    // The signature covers the base64url-decoded octets of the attached
    // sample's payload member — not the bytes of sample_payload.json, and not
    // their JCS canonicalization. See FINDINGS.md.
    const a = JSON.parse(attached.toString("utf8")) as Record<string, string>;
    const exact = Buffer.from(a["payload"]!, "base64url");
    const r = await adapter.verify(detached, {
      jwks: join(dir, "..", "jwks", "agentoracle.co.well-known.jwks.json"),
      now: FIXED_NOW,
      detachedPayload: exact,
    });
    // This receipt predates the verification.* claim set, so it stops at the
    // payload profile check — but only AFTER the signature verified.
    expect(r.annotations?.["jws_signature_check"]).toBe("passed");
    expect(r.verdict).toBe("UNVERIFIABLE");
  });

  it("does NOT verify against the JCS canonicalization of sample_payload.json", async () => {
    const r = await adapter.verify(detached, {
      jwks: join(dir, "..", "jwks", "agentoracle.co.well-known.jwks.json"),
      now: FIXED_NOW,
      detachedPayload: readFileSync(join(dir, "sample_payload.json")),
      canonicalizePayload: true,
    });
    expect(r.verdict).toBe("INVALID");
    expect(r.reason).toBe("signature_invalid");
  });
});
