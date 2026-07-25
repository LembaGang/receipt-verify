// JWS parsing and verification, implemented directly on node:crypto.
//
// Direct rather than via a JOSE library because this tool has to be exact about
// three things a high-level API tends to hide: which serialization arrived,
// whether the payload is attached or detached, and whether the signing input
// used RFC 7797 unencoded payload. Those distinctions are the substance of the
// detached+JCS exercise, so they are explicit here.

import { createPublicKey, createHash, verify as cryptoVerify, type KeyObject } from "node:crypto";
import { jcsBytes } from "@headlessoracle/chirindo/dist/vendor/recorder/index.js";

export type Serialization = "compact" | "flattened" | "general";

export interface JwsSignature {
  /** base64url of the protected header, exactly as it arrived. */
  protectedB64: string;
  header: Record<string, unknown>;
  /** base64url of the signature. */
  signatureB64: string;
  /** Unprotected header, if the serialization carries one. */
  unprotected?: Record<string, unknown>;
}

export interface ParsedJws {
  serialization: Serialization;
  signatures: JwsSignature[];
  /**
   * base64url payload as it arrived, or null when the payload is detached.
   * For an RFC 7797 b64:false receipt this holds the raw (unencoded) payload
   * string instead — `b64` on the signature says which.
   */
  payloadB64: string | null;
}

export class JwsParseError extends Error {}

export function b64uDecode(s: string): Buffer {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) throw new JwsParseError("not base64url");
  const pad = (4 - (s.length % 4)) % 4;
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad), "base64");
}

export function b64uEncode(b: Uint8Array): string {
  return Buffer.from(b).toString("base64url");
}

function parseHeader(protectedB64: string): Record<string, unknown> {
  let obj: unknown;
  try {
    obj = JSON.parse(b64uDecode(protectedB64).toString("utf8"));
  } catch {
    throw new JwsParseError("protected header is not base64url-encoded JSON");
  }
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    throw new JwsParseError("protected header is not a JSON object");
  }
  return obj as Record<string, unknown>;
}

/**
 * Accepts compact, flattened JSON, and general JSON serializations.
 * draft-krausz-verification-state-01 §4.1 makes compact and flattened both
 * mandatory to accept; general is here because the published v0.3-composed
 * fixtures use it for multi-signer envelopes.
 */
export function parseJws(bytes: Uint8Array): ParsedJws {
  const text = Buffer.from(bytes).toString("utf8").trim();

  if (text.startsWith("{")) {
    let doc: Record<string, unknown>;
    try {
      doc = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new JwsParseError("not valid JSON");
    }
    const payloadB64 =
      typeof doc["payload"] === "string" ? (doc["payload"] as string) : null;

    if (Array.isArray(doc["signatures"])) {
      const sigs = (doc["signatures"] as unknown[]).map((s, i) => {
        if (s === null || typeof s !== "object") {
          throw new JwsParseError(`signatures[${i}] is not an object`);
        }
        const o = s as Record<string, unknown>;
        if (typeof o["protected"] !== "string" || typeof o["signature"] !== "string") {
          throw new JwsParseError(`signatures[${i}] missing protected or signature`);
        }
        const sig: JwsSignature = {
          protectedB64: o["protected"],
          header: parseHeader(o["protected"]),
          signatureB64: o["signature"],
        };
        if (o["header"] && typeof o["header"] === "object") {
          sig.unprotected = o["header"] as Record<string, unknown>;
        }
        return sig;
      });
      if (sigs.length === 0) throw new JwsParseError("signatures array is empty");
      return { serialization: "general", signatures: sigs, payloadB64 };
    }

    if (typeof doc["protected"] === "string" && typeof doc["signature"] === "string") {
      const sig: JwsSignature = {
        protectedB64: doc["protected"] as string,
        header: parseHeader(doc["protected"] as string),
        signatureB64: doc["signature"] as string,
      };
      if (doc["header"] && typeof doc["header"] === "object") {
        sig.unprotected = doc["header"] as Record<string, unknown>;
      }
      return { serialization: "flattened", signatures: [sig], payloadB64 };
    }
    throw new JwsParseError("JSON object is neither flattened nor general JWS serialization");
  }

  const parts = text.split(".");
  if (parts.length !== 3) throw new JwsParseError("not a compact JWS (expected 3 dot-separated parts)");
  const [p, pl, s] = parts as [string, string, string];
  return {
    serialization: "compact",
    signatures: [{ protectedB64: p, header: parseHeader(p), signatureB64: s }],
    // A compact JWS with an empty payload segment is the detached form.
    payloadB64: pl === "" ? null : pl,
  };
}

/** True when the signature's protected header declares RFC 7797 b64:false. */
export function isUnencodedPayload(sig: JwsSignature): boolean {
  return sig.header["b64"] === false;
}

/**
 * RFC 7797 §3: when b64 is false, `b64` MUST appear in the `crit` header. A
 * receipt that sets b64:false without listing it in crit is malformed — we
 * refuse rather than guess which signing input the issuer meant.
 */
export function unencodedPayloadIsWellFormed(sig: JwsSignature): boolean {
  if (!isUnencodedPayload(sig)) return true;
  const crit = sig.header["crit"];
  return Array.isArray(crit) && crit.includes("b64");
}

/**
 * The JWS Signing Input (RFC 7515 §5.2 / RFC 7797 §3).
 *
 * b64 true  (default): ASCII(protectedB64 || "." || BASE64URL(payload))
 * b64 false (RFC 7797): ASCII(protectedB64 || ".") || payload_octets
 *
 * `payload` is the raw payload octets. For an attached receipt those are
 * whatever base64url-decodes out of the envelope; for a detached receipt the
 * caller supplies them, and supplying the WRONG bytes is exactly what the
 * canonicalization discipline exists to prevent.
 */
export function signingInput(sig: JwsSignature, payload: Uint8Array): Buffer {
  const prefix = Buffer.from(sig.protectedB64 + ".", "ascii");
  return isUnencodedPayload(sig)
    ? Buffer.concat([prefix, Buffer.from(payload)])
    : Buffer.concat([prefix, Buffer.from(b64uEncode(payload), "ascii")]);
}

export interface Jwk {
  kty?: string;
  crv?: string;
  x?: string;
  y?: string;
  kid?: string;
  alg?: string;
  use?: string;
  [k: string]: unknown;
}

export function publicKeyFromJwk(jwk: Jwk): KeyObject {
  if (jwk.kty === "OKP" && jwk.crv === "Ed25519" && typeof jwk.x === "string") {
    return createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: jwk.x }, format: "jwk" });
  }
  if (jwk.kty === "EC" && jwk.crv === "P-256" && typeof jwk.x === "string" && typeof jwk.y === "string") {
    return createPublicKey({ key: { kty: "EC", crv: "P-256", x: jwk.x, y: jwk.y }, format: "jwk" });
  }
  throw new JwsParseError(`unsupported JWK: kty=${String(jwk.kty)} crv=${String(jwk.crv)}`);
}

/**
 * RFC 7638 JWK thumbprint. Computed over the required members only, in
 * lexicographic order — which is exactly what JCS produces for that subset.
 * Reuses the same JCS routine the rest of the tool uses, so there is one
 * canonicalization path and no second implementation that could drift.
 */
export function rfc7638Thumbprint(jwk: Jwk): string {
  const required =
    jwk.kty === "OKP"
      ? { crv: jwk.crv, kty: jwk.kty, x: jwk.x }
      : { crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y };
  return createHash("sha256").update(jcsBytes(required)).digest("base64url");
}

export const SUPPORTED_ALGS = ["EdDSA", "ES256"] as const;
export type SupportedAlg = (typeof SUPPORTED_ALGS)[number];

export function isSupportedAlg(alg: unknown): alg is SupportedAlg {
  return typeof alg === "string" && (SUPPORTED_ALGS as readonly string[]).includes(alg);
}

/** Verify one signature over the given payload octets. Never throws on a bad signature — returns false. */
export function verifySignature(
  sig: JwsSignature,
  payload: Uint8Array,
  key: KeyObject,
  alg: SupportedAlg,
): boolean {
  const input = signingInput(sig, payload);
  let sigBytes: Buffer;
  try {
    sigBytes = b64uDecode(sig.signatureB64);
  } catch {
    return false;
  }
  try {
    if (alg === "EdDSA") {
      if (key.asymmetricKeyType !== "ed25519") return false;
      return cryptoVerify(null, input, key, sigBytes);
    }
    // ES256 signatures are raw R||S (JOSE), not DER — tell node so explicitly.
    if (key.asymmetricKeyType !== "ec") return false;
    if (sigBytes.length !== 64) return false;
    return cryptoVerify("sha256", input, { key, dsaEncoding: "ieee-p1363" }, sigBytes);
  } catch {
    return false;
  }
}
