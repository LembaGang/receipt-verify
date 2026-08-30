// §4.1 Algorithm jcs, and §3's CANONICAL-DIGEST.
//
// §4.1's pre-image construction, transcribed from lines 572-583 of the -02 text:
//
//   1. Apply JCS [RFC8785] to the octets supplied to the algorithm, to produce
//      the canonical UTF-8 octet string. Exclusion-set removal is not part of
//      this algorithm: the derived identifier construction (Section 5) removes
//      the payload class's declared exclusion set before invoking the algorithm.
//   2. Compute SHA-256 over those octets.
//   3. Encode the digest as lowercase hexadecimal. The output is a
//      64-character ASCII string.
//
//   CANONICAL-DIGEST(jcs, P) = lowercase_hex(SHA-256(JCS(P)))
//
// THE BOUND ON WHAT THIS FILE IS INDEPENDENT OF. The JCS step itself is NOT
// reimplemented here: it comes from the canonicalizer already vendored into this
// repository (@headlessoracle/chirindo 0.4.0, dist/vendor/recorder/index.js),
// which the handoff required us to reuse rather than add a second JCS. So this
// is an independent implementation of the CPB construction layer — field
// removal, digest, encoding, representation, leaf input — sitting on a JCS
// implementation we did not write for this exercise and did not derive from
// RFC 8785 in this session. Any byte-agreement result inherits that bound and
// the coverage manifest has to say so.

import { createHash } from "node:crypto";
import { jcsBytes } from "@headlessoracle/chirindo/dist/vendor/recorder/index.js";

import { fail, ok, type CpbResult, type JsonValue } from "./types.js";

export interface CanonicalDigest {
  /** The canonical octet string — §4.1 step 1. This is the digest pre-image. */
  readonly preImage: Uint8Array;
  /** The raw digest octets — §4.1 step 2. 32 bytes for SHA-256. */
  readonly digest: Uint8Array;
  /** §4.1 step 3: 64-character lowercase hexadecimal. */
  readonly hex: string;
}

/**
 * Validate that `v` is a JSON value, and only a JSON value.
 *
 * WHY this exists rather than trusting the canonicalizer: probed against the
 * vendored canonicalizer, `{a: undefined, b: 1}` canonicalizes to `{"b":1}` and
 * `{a: new Date(0)}` to `{"a":"1970-01-01T00:00:00.000Z"}`. Both are silent
 * substitutions of a different pre-image, which is exactly the failure §12.1
 * exists to name: "the byte sequence entering SHA-256 [must be] identical to
 * what the canonicalization algorithm produces, not what a deserializer happens
 * to emit." A value that cannot round-trip through JSON is refused here rather
 * than digested into something else.
 *
 * Non-finite numbers are refused for a narrower reason: §4.1 says jcs serializes
 * numbers "per the canonical ECMAScript-based number-to-string procedure RFC
 * 8785 Section 3.2.2.3 defines for IEEE 754 double-precision values", and
 * Infinity/-Infinity/NaN have no RFC 8259 JSON literal at all. They can only
 * reach this function from a host value, never from parsed JSON.
 */
export function assertJsonValue(v: unknown, path = "$"): CpbResult<JsonValue> {
  if (v === null || typeof v === "boolean" || typeof v === "string") return ok(v as JsonValue);

  if (typeof v === "number") {
    if (!Number.isFinite(v)) {
      return fail(
        "payload_non_finite_number",
        "§4.1 / §12.3",
        `${path} is ${String(v)}, which is not a JSON number and has no RFC 8785 serialization`,
      );
    }
    return ok(v);
  }

  if (Array.isArray(v)) {
    for (let i = 0; i < v.length; i += 1) {
      const el = assertJsonValue(v[i], `${path}[${i}]`);
      if (!el.ok) return el;
    }
    return ok(v as JsonValue);
  }

  // A plain object, and nothing else. `Object.create(null)` is accepted because
  // it carries no inherited members; a Date, Map, BigInt or class instance is not.
  if (typeof v === "object") {
    const proto = Object.getPrototypeOf(v as object) as unknown;
    if (proto !== Object.prototype && proto !== null) {
      return fail(
        "payload_not_json",
        "§12.1",
        `${path} is a ${(v as object).constructor?.name ?? "host"} object, not a JSON object; the canonicalizer would substitute its serialized form`,
      );
    }
    for (const [k, member] of Object.entries(v as Record<string, unknown>)) {
      if (member === undefined) {
        return fail(
          "payload_not_json",
          "§12.1",
          `${path}.${k} is undefined; the canonicalizer drops it silently, producing a different pre-image than the payload states`,
        );
      }
      const checked = assertJsonValue(member, `${path}.${k}`);
      if (!checked.ok) return checked;
    }
    return ok(v as JsonValue);
  }

  return fail("payload_not_json", "§12.1", `${path} is a ${typeof v}, which is not a JSON value`);
}

/**
 * §4.1 step 1 — the canonical UTF-8 octet string for a payload P.
 *
 * `P` is a parsed JSON value, not octets. §4.1 step 1 says "the octets supplied
 * to the algorithm" while §3 defines A(v) over a value v and §5 composes the
 * algorithm with a member-removal step that only a parsed value admits. That
 * mismatch is AMBIGUITY_LOG A1; the octets-to-value step is the caller's, and
 * this implementation states no rule for duplicate keys in a JSON text because
 * -02 states none in §4.1, §5, §5.1, §7 or §7.1.
 */
export function jcsPreImage(payload: JsonValue): CpbResult<Uint8Array> {
  const checked = assertJsonValue(payload);
  if (!checked.ok) return checked;
  return ok(jcsBytes(payload));
}

/**
 * CANONICAL-DIGEST(jcs, P) = lowercase_hex(SHA-256(JCS(P))) — §4.1.
 *
 * SHA-256 and the 64-character lowercase hex encoding are read from the `jcs`
 * registry entry (§14.1 Table 3) rather than assumed, per §3's instruction that
 * a verifier "MUST read both from the entry rather than assuming them".
 */
export function canonicalDigestJcs(payload: JsonValue): CpbResult<CanonicalDigest> {
  const pre = jcsPreImage(payload);
  if (!pre.ok) return pre;
  const digest = createHash("sha256").update(pre.value).digest();
  return ok({
    preImage: pre.value,
    digest: new Uint8Array(digest),
    hex: digest.toString("hex"),
  });
}
