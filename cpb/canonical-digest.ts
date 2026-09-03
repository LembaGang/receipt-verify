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
 * mismatch is AMBIGUITY_LOG A1; the octets-to-value step is the caller's.
 *
 * CORRECTED. An earlier revision of this comment said "this implementation
 * states no rule for duplicate keys in a JSON text because -02 states none in
 * §4.1, §5, §5.1, §7 or §7.1". The search was accurate and the conclusion was
 * wrong: the rule is reached by delegation, through the jcs registry entry's
 * Reference to RFC 8785 Section 3. `parseJsonStrict` and
 * `canonicalDigestJcsFromText` at the foot of this file apply it, and a caller
 * holding octets should use those rather than this function.
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

// ---------------------------------------------------------------------------
// The octet boundary — RFC 8785 §3.1 / RFC 7493 §2.3, reached from §4.1 by
// delegation through the `jcs` registry entry's Reference.
// ---------------------------------------------------------------------------

/**
 * WHY THIS EXISTS, and why it did not before.
 *
 * `jcsPreImage` above takes a parsed JSON *value*. §4.1 step 1 says "the octets
 * supplied to the algorithm". Between those two sentences sits a step this
 * implementation originally left to the caller and stated no rule for, on the
 * grounds that -02 states none in §4.1, §5, §5.1, §7 or §7.1. That reading was
 * wrong, and the error is instructive rather than incidental: the rule is not in
 * those sections because it is one normative reference away from them. The `jcs`
 * registry entry gives its Reference as RFC 8785 Section 3. RFC 8785 §3.1
 * requires the data to be adapted for I-JSON formatting and states that JSON
 * objects MUST NOT exhibit duplicate property names. RFC 7493 §2.3 states it
 * again. The authors' own kat-37 states it a third time, in its description.
 *
 * `JSON.parse` keeps the LAST of a repeated member and discards the earlier one
 * silently, so a text saying `{"a":1,"a":2}` becomes the value `{"a":2}` and a
 * digest computed over it is a digest of something the text does not say. The
 * scan therefore runs over the RAW TEXT, before parsing, because after parsing
 * the evidence is gone.
 *
 * Two implementers reached this independently and from opposite directions —
 * both parsed before walking the text, and both produced a value where RFC 8785
 * requires a refusal. That is evidence about the delegation chain, not about
 * either implementation.
 */
type Tok = { t: "{" | "}" | "[" | "]" | ":" | "," | "str" | "lit"; v?: string };

function tokenize(text: string): Tok[] | null {
  const toks: Tok[] = [];
  const punct = "{}[]:,";
  let i = 0;
  while (i < text.length) {
    const c = text[i]!;
    if (c === " " || c === "\t" || c === "\n" || c === "\r") {
      i++;
      continue;
    }
    if (punct.includes(c)) {
      toks.push({ t: c as Tok["t"] });
      i++;
      continue;
    }
    if (c === '"') {
      const start = i;
      i++;
      while (i < text.length) {
        const d = text[i]!;
        if (d === "\\") {
          i += 2;
          continue;
        }
        if (d === '"') break;
        i++;
      }
      if (i >= text.length) return null;
      i++;
      let decoded: string;
      try {
        decoded = JSON.parse(text.slice(start, i)) as string;
      } catch {
        return null;
      }
      toks.push({ t: "str", v: decoded });
      continue;
    }
    // Numbers and the three literals. Only their extent matters here, so the
    // walker below stays aligned with the structure without validating them.
    const start = i;
    while (i < text.length && !punct.includes(text[i]!) && !' \t\n\r"'.includes(text[i]!)) i++;
    if (i === start) return null;
    toks.push({ t: "lit", v: text.slice(start, i) });
  }
  return toks;
}

/**
 * A JSON-pointer-ish path to the first duplicate member name in `text`, or null
 * when there is none. `null` is also returned for text that does not tokenize:
 * malformed JSON is `JSON.parse`'s to report, and this function refuses to be
 * the thing that reports it, because a scanner that returned a duplicate for
 * unparseable input would make the refusal below untraceable to a real cause.
 *
 * The path uses `$` for the document root, `.name` for a member and `[]` for an
 * array element, so `$.input.a` names a duplicate `a` inside the `input` member
 * of the root object.
 */
export function findDuplicateMemberName(text: string): string | null {
  const toks = tokenize(text);
  if (toks === null) return null;
  const frames: { obj: boolean; keys: Set<string>; path: string }[] = [];
  let lastKey = "";
  for (let k = 0; k < toks.length; k++) {
    const t = toks[k]!;
    if (t.t === "{" || t.t === "[") {
      const parent = frames[frames.length - 1];
      const path = parent === undefined ? "$" : parent.obj ? `${parent.path}.${lastKey}` : `${parent.path}[]`;
      frames.push({ obj: t.t === "{", keys: new Set(), path });
      continue;
    }
    if (t.t === "}" || t.t === "]") {
      frames.pop();
      continue;
    }
    const top = frames[frames.length - 1];
    if (t.t === "str" && top !== undefined && top.obj && toks[k + 1]?.t === ":") {
      const key = t.v!;
      lastKey = key;
      if (top.keys.has(key)) return `${top.path}.${key}`;
      top.keys.add(key);
    }
  }
  return null;
}

/**
 * Parse a JSON text into a value, refusing before any object exists when the
 * text carries a duplicate member name.
 *
 * "Before an object exists" is the operative phrase and it is not decoration:
 * the refusal has to precede `JSON.parse`, because `JSON.parse` is where the
 * duplicate stops being observable.
 */
export function parseJsonStrict(text: string): CpbResult<JsonValue> {
  const dup = findDuplicateMemberName(text);
  if (dup !== null) {
    return fail(
      "payload_duplicate_member_name",
      "§4.1 → RFC 8785 §3.1 → RFC 7493 §2.3",
      `duplicate member name at ${dup}: RFC 7493 section 2.3 makes member names unique in I-JSON and RFC 8785 ` +
        `section 3.1 excludes such input from canonicalization, which the jcs registry entry incorporates by ` +
        `naming RFC 8785 section 3 as its Reference. JSON.parse would silently keep the last occurrence, so no ` +
        `value from this text is read at all`,
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return fail("payload_not_json", "§4.1", `not valid JSON: ${(e as Error).message}`);
  }
  return assertJsonValue(parsed);
}

/**
 * CANONICAL-DIGEST(jcs, P) where P arrives as OCTETS rather than as a value —
 * §4.1 step 1's own phrasing, and the entry point a conforming implementation
 * needs, because the duplicate-name rule is only checkable at this layer.
 *
 * `canonicalDigestJcs` below remains the value-level entry point for callers who
 * already hold a parsed value and have satisfied this rule themselves.
 */
export function canonicalDigestJcsFromText(text: string): CpbResult<CanonicalDigest> {
  const parsed = parseJsonStrict(text);
  if (!parsed.ok) return parsed;
  return canonicalDigestJcs(parsed.value);
}
