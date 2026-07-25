// Format 1: evidence.action/0, verified through the published npm artifact
// @headlessoracle/chirindo@0.3.0.
//
// The corpus is the frozen conformance bundle. Every vector's expected outcome
// comes from the bundle's own manifest, not from anything asserted here.

import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { evidenceActionAdapter, detect } from "../src/adapters/evidence-action.js";
import { EVIDENCE, flipByte, read, replaceInBytes, sha256Hex } from "./helpers.js";

const JWKS = join(EVIDENCE, "jwks.json");
const manifest = JSON.parse(readFileSync(join(EVIDENCE, "manifest.json"), "utf8")) as {
  vectors: {
    id: string;
    receipt: string;
    receipt_sha256: string;
    receipt_byte_length: number;
    expected: { verify: string };
  }[];
};

/** The bundle's own vocabulary mapped onto this tool's tri-state contract. */
const EXPECTED_VERDICT: Record<string, "VALID" | "INVALID" | "UNVERIFIABLE"> = {
  VALID: "VALID",
  TAMPERED: "INVALID",
  UNRESOLVED: "UNVERIFIABLE",
};

const vectorPath = (rel: string) => join(EVIDENCE, rel.replace(/\//g, "\\"));

describe("evidence.action — snapshot integrity", () => {
  it("has all six vectors", () => {
    expect(manifest.vectors).toHaveLength(6);
  });

  // The snapshot in fixtures/ is only trustworthy if it is byte-identical to the
  // corpus the manifest pins. This is the check that makes "tests run against
  // snapshots" safe rather than merely convenient.
  it.each(manifest.vectors.map((v) => [v.id, v] as const))(
    "%s snapshot matches the sha256 pinned in the manifest",
    (_id, v) => {
      const bytes = read(vectorPath(v.receipt));
      expect(sha256Hex(bytes)).toBe(v.receipt_sha256);
      expect(bytes.length).toBe(v.receipt_byte_length);
    },
  );
});

describe("evidence.action — the six conformance vectors reproduce", () => {
  it.each(manifest.vectors.map((v) => [v.id, v] as const))(
    "%s reproduces its expected verdict",
    async (_id, v) => {
      const r = await evidenceActionAdapter.verify(read(vectorPath(v.receipt)), { jwks: JWKS });
      expect(r.verdict).toBe(EXPECTED_VERDICT[v.expected.verify]);
      expect(r.format).toBe("evidence.action/0");
    },
  );

  it("VALID names the key it verified under", async () => {
    const r = await evidenceActionAdapter.verify(read(vectorPath("vectors/allow/chain.jsonl")), { jwks: JWKS });
    expect(r.verdict).toBe("VALID");
    expect(r.resolvedKey?.kid).toBe("ed25519/Vkdap1RjR0wC");
    expect(r.resolvedKey?.origin).toBe(JWKS);
  });

  it("the tampered vector is INVALID and names the key it failed against", async () => {
    const r = await evidenceActionAdapter.verify(read(vectorPath("vectors/tampered/chain.jsonl")), { jwks: JWKS });
    expect(r.verdict).toBe("INVALID");
    expect(r.reason).toBe("content_commitment_mismatch");
    expect(r.resolvedKey?.kid).toBe("ed25519/Vkdap1RjR0wC");
  });

  it("the multi-record chain verifies both records and its linkage", async () => {
    const r = await evidenceActionAdapter.verify(read(vectorPath("vectors/chain-multi/chain.jsonl")), { jwks: JWKS });
    expect(r.verdict).toBe("VALID");
    expect(r.detail).toContain("2 record(s)");
  });
});

describe("evidence.action — tamper tests", () => {
  const allow = read(vectorPath("vectors/allow/chain.jsonl"));

  it("flipping one byte anywhere in a signed record moves the verdict off VALID", async () => {
    // Sample across the record rather than at one hand-picked offset: every
    // byte of the line is inside the signed content or the signature itself.
    const offsets = [10, 60, 120, 200, 300, 420, 540, 660, 780, allow.length - 5];
    for (const off of offsets) {
      const r = await evidenceActionAdapter.verify(flipByte(allow, off), { jwks: JWKS });
      expect(r.verdict, `byte ${off} flipped`).not.toBe("VALID");
    }
  });

  it("mutating the signature alone is INVALID — key-binding", async () => {
    // Swap one character of the base64url signature for another valid one.
    const sig = "K9waY62pdwIGqP0MA_7IuuaC7MYsTmqCmDKLTklSX4GhnCikHuCTK8VfyBydBLDeipB5CkfNLWFU4pwTJi-eDw";
    const mutated = replaceInBytes(allow, sig, "L" + sig.slice(1));
    const r = await evidenceActionAdapter.verify(mutated, { jwks: JWKS });
    expect(r.verdict).toBe("INVALID");
    expect(r.reason).toBe("signature_invalid");
    expect(r.resolvedKey).toBeDefined();
  });

  it("mutating an event field breaks the sealed commitment", async () => {
    const r = await evidenceActionAdapter.verify(replaceInBytes(allow, '"hello"', '"HELLO"'), { jwks: JWKS });
    expect(r.verdict).toBe("INVALID");
    expect(r.reason).toBe("content_commitment_mismatch");
  });

  it("breaking chain linkage is INVALID", async () => {
    const multi = read(vectorPath("vectors/chain-multi/chain.jsonl"));
    const r = await evidenceActionAdapter.verify(
      replaceInBytes(multi, '"prev_hash":"sha256:4d401d50', '"prev_hash":"sha256:4d401d51'),
      { jwks: JWKS },
    );
    expect(r.verdict).toBe("INVALID");
    expect(r.reason).toBe("chain_linkage_broken");
  });
});

describe("evidence.action — fail-closed paths", () => {
  const allow = read(vectorPath("vectors/allow/chain.jsonl"));

  it("an unresolvable kid is UNVERIFIABLE, never INVALID", async () => {
    const r = await evidenceActionAdapter.verify(
      replaceInBytes(allow, '"kid":"ed25519/Vkdap1RjR0wC"', '"kid":"ed25519/NotPublished"'),
      { jwks: JWKS },
    );
    expect(r.verdict).toBe("UNVERIFIABLE");
    expect(r.reason).toBe("key_unresolvable");
    expect(r.resolvedKey).toBeUndefined();
  });

  it("no JWKS source is UNVERIFIABLE — the tool never falls back to an implicit key", async () => {
    const r = await evidenceActionAdapter.verify(allow, {});
    expect(r.verdict).toBe("UNVERIFIABLE");
    expect(r.reason).toBe("key_unresolvable");
  });

  it("an empty chain is UNVERIFIABLE", async () => {
    const r = await evidenceActionAdapter.verify(Buffer.from("\n"), { jwks: JWKS });
    expect(r.verdict).toBe("UNVERIFIABLE");
  });

  it("unparseable bytes are UNVERIFIABLE, not INVALID", async () => {
    const r = await evidenceActionAdapter.verify(Buffer.from('{"v":"evidence.action/0","kid":"ed25519/Vkdap1RjR0wC"'), {
      jwks: JWKS,
    });
    expect(r.verdict).toBe("UNVERIFIABLE");
  });
});

describe("evidence.action — detection", () => {
  it("recognises a chain file", () => {
    expect(detect(read(vectorPath("vectors/allow/chain.jsonl")))).toBe(true);
  });

  it("does not claim a JWS", () => {
    expect(detect(Buffer.from('{"protected":"e30","payload":"e30","signature":"AA"}'))).toBe(false);
  });

  it("does not claim arbitrary JSON or garbage", () => {
    expect(detect(Buffer.from('{"hello":"world"}'))).toBe(false);
    expect(detect(Buffer.from("not json at all"))).toBe(false);
  });
});
