// Shared shapes for the CPB implementation.
//
// Written from draft-mih-sokolov-scitt-payload-binding-02 (sha256
// 47ab675797d7edfe905c13b8482735239d9c5ceb318accbc33e4a5a51e5ec875, 92428 bytes)
// alone. No part of the authors' reference implementation was read. See
// cpb/AMBIGUITY_LOG.md for every place the text admitted more than one reading.
//
// WHY a result envelope rather than exceptions: the draft's failure modes are
// distinctions a consumer must branch on (§4.2 separates "unverified" from
// "failed" in one sentence, and §5.1 forbids silently coercing between two
// things that both look like a digest). A thrown Error collapses those into one
// state and forces a caller to parse a message. Every entry point below returns
// a typed reason token instead.

/**
 * A JSON value as RFC 8259 defines one. `undefined`, BigInt, Date and every
 * other host object are deliberately outside this type: the canonicalizer
 * silently drops `undefined` members and silently stringifies a Date, and §12.1
 * ("Preimages Are Bytes, Not Renderings") is the reason we refuse both at the
 * boundary rather than digesting whatever a deserializer happened to emit.
 */
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

/**
 * The three dispositions the draft itself distinguishes. §4.2 is explicit that
 * these are not two states: a verifier that declines to implement a withdrawn
 * construction "MUST report the reference as unverified rather than as failed".
 *
 * `verified`   — the construction was recomputed and it matched.
 * `failed`     — the record is defective under the draft's own rules.
 * `unverified` — nothing was established, and no claim about the record is made.
 */
export type Disposition = "verified" | "failed" | "unverified";

/**
 * Closed vocabulary. This is the field an agent branches on; `detail` is the
 * human line and its wording is not stable. Each token names the section that
 * produced it in `section`.
 */
export type CpbReason =
  // §4 / §14.1 — algorithm admission
  | "algorithm_unknown"
  | "algorithm_withdrawn_cde_n"
  | "algorithm_withdrawn_jcs_n"
  | "algorithm_withdrawn_jcs_n_historical"
  | "algorithm_withdrawn_jcs_n_vintage_unknown"
  | "algorithm_not_implemented"
  // §4.1 / §12.1 — the value boundary
  | "payload_not_json"
  | "payload_non_finite_number"
  // §5 — the derived identifier
  | "payload_not_object"
  | "carried_identifier_not_excluded"
  | "carried_identifier_absent"
  | "carried_identifier_not_a_string"
  | "carried_identifier_mismatch"
  | "sd_encoded_form_required"
  // §5.1 — representation
  | "representation_mismatch"
  | "representation_prefix_undefined"
  | "identifier_not_lowercase_hex"
  | "identifier_wrong_length"
  // §7.1 — leaf construction
  | "leaf_not_keyed_on_derived_identifier";

export interface CpbFailure {
  readonly ok: false;
  readonly reason: CpbReason;
  /** Human line. Wording may change between revisions; agents must not parse it. */
  readonly detail: string;
  /** The -02 section this rule was read from, e.g. "§5.1". */
  readonly section: string;
  /**
   * Present only where the draft distinguishes the disposition from a plain
   * failure — today that is §4.2's unverified-rather-than-failed rule. Absent
   * means the failure is a defect in the record.
   */
  readonly disposition?: Disposition;
}

export type CpbResult<T> = { readonly ok: true; readonly value: T } | CpbFailure;

export const ok = <T>(value: T): CpbResult<T> => ({ ok: true, value });

export const fail = (
  reason: CpbReason,
  section: string,
  detail: string,
  disposition?: Disposition,
): CpbFailure =>
  disposition === undefined
    ? { ok: false, reason, section, detail }
    : { ok: false, reason, section, detail, disposition };
