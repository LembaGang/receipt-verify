// §5 The Derived Identifier, and §5.1 Representation.
//
//   id = CANONICAL-DIGEST(A, payload minus exclusion_set)          — §5, line 737
//
// where A is the algorithm the payload class declares and the exclusion set is
// the fields it declares as self-referential or chain-linkage fields. §5 then
// puts three MUSTs on a verifier, and this file implements all three:
//
//   - "a verifier MUST apply the same exclusion set as the producer";
//   - "A verifier MUST recompute the identifier from the payload bytes. If the
//     recomputed value does not match the carried value, the verifier MUST treat
//     this as a defect in the record";
//   - "When selective disclosure is in use, the derived identifier MUST be
//     computed over the SD-encoded form of the payload, not the plaintext".
//
// and §5.1 puts one more on comparison: "A verifier MUST NOT silently coerce
// among representations."

import { admitAlgorithm, type AdmissionContext, type AlgorithmToken } from "./algorithm.js";
import { canonicalDigestJcs } from "./canonical-digest.js";
import { fail, ok, type CpbResult, type JsonValue } from "./types.js";

/**
 * The three representations §5.1 names as "distinct and ... not implicitly
 * interchangeable". `prefixed-text` is declarable but not constructible here:
 * searched all 2072 lines of the -02 text for "prefix", the only two
 * occurrences are §5.1 line 775 naming it and an Appendix C acknowledgment at
 * line 2006 crediting the distinction — neither defines what the prefix is. See
 * AMBIGUITY_LOG A11.
 */
export type DeclaredRepresentation = "hex" | "raw" | "prefixed-text";

/**
 * A derived identifier carries its representation with it. That is the whole
 * point of §5.1: two values that are byte-equal as text may be different
 * representations of different things, and a verifier that compares them
 * without checking has coerced silently.
 */
export type DerivedIdentifier =
  | { readonly representation: "hex"; readonly hex: string }
  | { readonly representation: "raw"; readonly raw: Uint8Array };

/**
 * A payload class as §3 defines one: "A named category of structured content
 * that has declared a canonicalization algorithm (from the registry in Section
 * 14.1) and an exclusion set of fields that are omitted from the canonical form
 * before the derived identifier is computed." §5.1 adds that the representation
 * "is normative and MUST be declared by the payload class".
 *
 * This document does not define payload classes (§1.1, §3) — the profile does.
 * So this is an input to the implementation, never a table inside it.
 */
export interface PayloadClass {
  readonly name: string;
  readonly algorithm: AlgorithmToken;
  /** §5: normative for the class. Matched against top-level member names only (§4.1). */
  readonly exclusionSet: readonly string[];
  readonly representation: DeclaredRepresentation;
  /** The member carrying the derived identifier, where the class carries one (§5: "A producer MAY"). */
  readonly carriedIdentifierField?: string;
  /** True when the class uses selective disclosure; §5 then requires the SD-encoded form. */
  readonly selectiveDisclosure?: boolean;
}

/**
 * Which form of the payload the caller is supplying. §5 requires the SD-encoded
 * form when selective disclosure is in use, and -02 defines no SD encoding of
 * its own (§11 defers selective disclosure to a companion document). This
 * implementation cannot inspect bytes and tell which form they are, so the
 * caller asserts it and we hold them to the class's declaration rather than
 * assuming. See AMBIGUITY_LOG A10.
 */
export type PayloadForm = "plaintext" | "sd-encoded";

export interface DeriveOptions extends AdmissionContext {
  readonly payloadForm?: PayloadForm;
}

/**
 * §5 step one: "payload minus exclusion_set".
 *
 * Removal is deletion of the member, not replacement of its value. Appendix A
 * (Step 2, lines 1685-1692) constructs a payload carrying `"record_id": null`, removes
 * record_id, and shows a resulting object with no record_id member at all —
 * which under `jcs`, whose whole point is that it runs no normalization pass,
 * is a different pre-image from one carrying a null member.
 *
 * The scope of the match is §4.1's, not §5's: "The exclusion set is matched
 * against the top-level member names of P only; a member of the same name nested
 * inside a member's value is not removed."
 */
export function applyExclusionSet(
  cls: PayloadClass,
  payload: JsonValue,
): CpbResult<JsonValue> {
  if (cls.exclusionSet.length === 0) return ok(payload);

  const isPlainObject =
    typeof payload === "object" && payload !== null && !Array.isArray(payload);
  if (!isPlainObject) {
    // "Top-level member names" presupposes an object. §5 does not say what a
    // non-empty exclusion set means over an array or a scalar — AMBIGUITY_LOG A7.
    return fail(
      "payload_not_object",
      "§4.1 / §5",
      `payload class ${cls.name} declares a non-empty exclusion set, which is matched against top-level member names, but the payload is not a JSON object`,
    );
  }

  const excluded = new Set(cls.exclusionSet);
  const reduced: { [key: string]: JsonValue } = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!excluded.has(key)) reduced[key] = value;
  }
  // An exclusion-set member that is absent from the payload is a no-op. §5
  // declares the set on the class, not on the instance, and states no
  // presence requirement — AMBIGUITY_LOG A6.
  return ok(reduced);
}

/** Wrap raw digest octets in the representation the payload class declared (§5.1). */
function represent(
  cls: PayloadClass,
  digest: Uint8Array,
  hex: string,
): CpbResult<DerivedIdentifier> {
  switch (cls.representation) {
    case "hex":
      return ok({ representation: "hex", hex });
    case "raw":
      return ok({ representation: "raw", raw: digest });
    case "prefixed-text":
      return fail(
        "representation_prefix_undefined",
        "§5.1",
        `payload class ${cls.name} declares the prefixed textual representation, which -02 names but does not define; guessing a prefix would be the silent coercion §5.1 forbids`,
        "unverified",
      );
  }
}

/**
 * Compute the derived identifier of `payload` under `cls`.
 *
 * The algorithm is admitted first (§4, §4.2, §4.3, §14.1) — a withdrawn or
 * unimplemented token never reaches the digest.
 */
export function deriveIdentifier(
  cls: PayloadClass,
  payload: JsonValue,
  opts: DeriveOptions = {},
): CpbResult<DerivedIdentifier> {
  const admitted = admitAlgorithm(cls.algorithm, opts);
  if (!admitted.ok) return admitted;

  if (cls.selectiveDisclosure === true && opts.payloadForm !== "sd-encoded") {
    return fail(
      "sd_encoded_form_required",
      "§5",
      `payload class ${cls.name} uses selective disclosure, so the identifier MUST be computed over the SD-encoded form; the caller supplied ${opts.payloadForm ?? "an unstated form"}`,
    );
  }

  const reduced = applyExclusionSet(cls, payload);
  if (!reduced.ok) return reduced;

  const digest = canonicalDigestJcs(reduced.value);
  if (!digest.ok) return digest;

  return represent(cls, digest.value.digest, digest.value.hex);
}

/**
 * Compare two derived identifiers under §5.1.
 *
 * Different representations are not compared. §5.1: "A deterministic conversion
 * MAY be applied only where this specification or the applicable payload profile
 * expressly defines both the conversion and the resulting comparison
 * representation." -02 defines no such conversion for comparison — searched §5,
 * §5.1, §7, §7.1 and §8.1; §7.1's hex-to-bytes rule is defined for leaf
 * construction, which is an operation, not a comparison representation. See
 * AMBIGUITY_LOG A12.
 */
export function identifiersEqual(
  a: DerivedIdentifier,
  b: DerivedIdentifier,
): CpbResult<boolean> {
  if (a.representation !== b.representation) {
    return fail(
      "representation_mismatch",
      "§5.1",
      `refusing to compare a ${a.representation} identifier with a ${b.representation} one; -02 defines no conversion for comparison`,
      "unverified",
    );
  }
  if (a.representation === "hex" && b.representation === "hex") return ok(a.hex === b.hex);
  if (a.representation === "raw" && b.representation === "raw") {
    if (a.raw.length !== b.raw.length) return ok(false);
    let same = true;
    for (let i = 0; i < a.raw.length; i += 1) if (a.raw[i] !== b.raw[i]) same = false;
    return ok(same);
  }
  /* c8 ignore next */
  return ok(false);
}

/**
 * §5 and §4.1 both fix the textual representation as "bare 64-character
 * lowercase hexadecimal text". Uppercase is refused rather than folded: §5.1
 * makes representations non-interchangeable, and an implementation that accepts
 * both has quietly decided a case-folding conversion exists. -02 defines none —
 * searched §4.1, §5, §5.1 and §7.1; the only occurrence of "uppercase" in the
 * whole 2072-line text is line 1538, the RFC 8174 reference title.
 */
const LOWERCASE_HEX_64 = /^[0-9a-f]{64}$/;

/** Decode the bare lowercase-hex representation into its 32 digest octets. */
export function hexIdentifierOctets(hex: string): CpbResult<Uint8Array> {
  if (hex.length !== 64) {
    return fail(
      "identifier_wrong_length",
      "§5 / §5.1",
      `identifier is ${hex.length} characters, not the 64 the bare hexadecimal representation declares`,
    );
  }
  if (!LOWERCASE_HEX_64.test(hex)) {
    return fail(
      "identifier_not_lowercase_hex",
      "§5 / §5.1",
      "identifier is not bare 64-character lowercase hexadecimal text",
    );
  }
  return ok(new Uint8Array(Buffer.from(hex, "hex")));
}

export interface CarriedIdentifierCheck {
  readonly disposition: "verified";
  readonly recomputed: DerivedIdentifier;
  readonly carried: string;
}

/**
 * §5's verifier obligation on a carried derived identifier: "A verifier MUST
 * recompute the identifier from the payload bytes. If the recomputed value does
 * not match the carried value, the verifier MUST treat this as a defect in the
 * record."
 *
 * The carried field must be in the exclusion set. §5 describes excluded fields
 * as those that "contain the derived identifier itself (they cannot be inside
 * the pre-image they help compute)", but states that descriptively rather than
 * as a MUST on the class. A class that carries the identifier without excluding
 * it can never match, so this returns a distinct reason rather than a mismatch
 * that would read as tampering — AMBIGUITY_LOG A8.
 */
export function verifyCarriedIdentifier(
  cls: PayloadClass,
  payload: JsonValue,
  opts: DeriveOptions = {},
): CpbResult<CarriedIdentifierCheck> {
  const field = cls.carriedIdentifierField;
  if (field === undefined) {
    return fail(
      "carried_identifier_absent",
      "§5",
      `payload class ${cls.name} declares no carried identifier field`,
      "unverified",
    );
  }

  if (cls.representation !== "hex") {
    // §5.1's raw representation is an octet sequence and -02 defines no encoding
    // of one into a JSON member — searched §5, §5.1 and §8. Coercing through
    // base64 or hex here would be the coercion §5.1 forbids.
    return fail(
      "representation_mismatch",
      "§5.1",
      `payload class ${cls.name} declares the ${cls.representation} representation; a JSON member cannot carry it and -02 defines no encoding of it into JSON`,
      "unverified",
    );
  }

  if (!cls.exclusionSet.includes(field)) {
    return fail(
      "carried_identifier_not_excluded",
      "§5",
      `payload class ${cls.name} carries its derived identifier in ${field} but does not exclude it; the field would be inside the pre-image it helps compute`,
    );
  }

  const isPlainObject =
    typeof payload === "object" && payload !== null && !Array.isArray(payload);
  if (!isPlainObject) {
    return fail(
      "payload_not_object",
      "§5",
      `payload class ${cls.name} carries its derived identifier in a member, but the payload is not a JSON object`,
    );
  }

  const carried = payload[field];
  if (typeof carried !== "string") {
    return fail(
      "carried_identifier_not_a_string",
      "§5 / §5.1",
      `${field} is ${carried === undefined ? "absent" : JSON.stringify(carried)}, not the bare 64-character lowercase hexadecimal text the class declares`,
    );
  }

  // Check the carried value is the representation the class declares BEFORE
  // comparing. Reporting a malformed identifier as a value mismatch would say
  // the record was altered when what happened is that it was written wrong.
  const wellFormed = hexIdentifierOctets(carried);
  if (!wellFormed.ok) return wellFormed;

  const recomputed = deriveIdentifier(cls, payload, opts);
  if (!recomputed.ok) return recomputed;

  const carriedId: DerivedIdentifier = { representation: "hex", hex: carried };
  const equal = identifiersEqual(recomputed.value, carriedId);
  if (!equal.ok) return equal;

  if (!equal.value) {
    return fail(
      "carried_identifier_mismatch",
      "§5",
      `recomputed identifier does not match the value carried in ${field}`,
      "failed",
    );
  }

  return ok({ disposition: "verified", recomputed: recomputed.value, carried });
}
