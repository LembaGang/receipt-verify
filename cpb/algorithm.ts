// §4 Payload Canonicalization Algorithms, and the §14.1 registry that governs
// them. Admission only — the pre-image construction for `jcs` is in
// canonical-digest.ts.
//
// The handoff scoped implementation to §4.1, §5 and §7.1 and said not to
// implement §4.2/§4.3 "except to REJECT them if the text says a verifier must".
// It does, in both sections and again in §14.1, so the rejections are here:
//
//   §4.3 (lines 679-680): a verifier encountering cde-n "MUST fail closed — MUST NOT
//        report the payload class or typed digest reference as verified".
//   §4.2 (lines 643-645): the same for jcs-n "in a record committed on or after
//        2026-08-18"; a record committed before that date MAY be verified
//        against the withdrawn construction, and "a verifier that declines to
//        implement the withdrawn construction MUST report the reference as
//        unverified rather than as failed".
//
// We decline to implement the withdrawn construction — deliberately. Its
// definition lives in -00 §3.1, which -02 does not restate, and reading it is
// out of scope for an implementation written from -02.

import { fail, ok, type CpbResult } from "./types.js";

export const ALGORITHM_TOKENS = ["jcs", "jcs-n", "cde-n", "as-transmitted"] as const;
export type AlgorithmToken = (typeof ALGORITHM_TOKENS)[number];

export interface RegistryEntry {
  readonly status: "registered" | "withdrawn";
  /** ISO date of withdrawal, on withdrawn entries only. §14.1 Table 3. */
  readonly withdrawnOn?: string;
  /**
   * §3's CANONICAL-DIGEST is ENCODE_A(H_A(A(v))) and says a verifier "MUST read
   * both from the entry rather than assuming them" — so both are fields of the
   * entry here, not constants in the digest function.
   */
  readonly digest?: "SHA-256";
  readonly encoding?: "lowercase-hex-64";
  readonly section: string;
}

/**
 * §14.1 Table 3, "Initial contents", transcribed. Entries are immutable: §4
 * and §14.1 both state that new behavior requires a new entry, never an edit to
 * an existing one, so this table is frozen rather than extensible at runtime.
 */
export const CANONICALIZATION_ALGORITHM_REGISTRY: Readonly<Record<AlgorithmToken, RegistryEntry>> =
  Object.freeze({
    jcs: { status: "registered", digest: "SHA-256", encoding: "lowercase-hex-64", section: "§4.1" },
    "jcs-n": { status: "withdrawn", withdrawnOn: "2026-08-18", section: "§4.2" },
    "cde-n": { status: "withdrawn", withdrawnOn: "2026-08-18", section: "§4.3" },
    "as-transmitted": {
      status: "registered",
      digest: "SHA-256",
      encoding: "lowercase-hex-64",
      section: "§4.4",
    },
  });

/** The withdrawal date both §4.2 and §14.1 Table 3 carry for jcs-n. */
export const JCS_N_WITHDRAWN_ON = "2026-08-18";

export interface AdmissionContext {
  /**
   * The date the record was committed, as an ISO-8601 date or date-time.
   * §4.2's disposition for jcs-n turns entirely on this and the draft does not
   * say where a verifier reads it from — see AMBIGUITY_LOG A19. Omit it when the
   * vintage is not established; the result is `unverified`, never `verified`.
   */
  readonly recordCommittedOn?: string;
}

export interface Admission {
  readonly token: AlgorithmToken;
  readonly entry: RegistryEntry;
}

/**
 * Decide whether a payload class or typed digest reference naming `token` may
 * be verified by THIS implementation, under §4, §4.2, §4.3 and §14.1.
 *
 * `as-transmitted` is registered and live, but this implementation covers §4.1,
 * §5 and §7.1 only, so it is declined rather than attempted. The draft states a
 * "declines to implement" rule only in §4.2, for the withdrawn construction;
 * searched §4, §4.1, §4.4, §5, §7 and §14.1 of the -02 text, no general rule for
 * an algorithm a verifier has simply not implemented appears in those six
 * sections. We apply §4.2's shape — unverified, not failed — because reporting
 * `failed` would assert a defect in a record we never examined.
 */
export function admitAlgorithm(token: string, ctx: AdmissionContext = {}): CpbResult<Admission> {
  if (!(ALGORITHM_TOKENS as readonly string[]).includes(token)) {
    // §4: "verifiers MUST NOT guess the algorithm from the payload shape."
    // An unregistered token resolves to no construction at all.
    return fail(
      "algorithm_unknown",
      "§4 / §14.1",
      `algorithm token ${JSON.stringify(token)} is not in the Canonicalization Algorithm Registry`,
      "unverified",
    );
  }
  const known = token as AlgorithmToken;
  const entry = CANONICALIZATION_ALGORITHM_REGISTRY[known];

  if (known === "cde-n") {
    // §14.1: "MUST NOT be treated as verifiable under any vintage" — the token
    // was bound but never assigned a definition, so there is nothing to verify
    // against. Unlike jcs-n this has no date branch.
    return fail(
      "algorithm_withdrawn_cde_n",
      "§4.3 / §14.1",
      "cde-n is withdrawn and was never assigned a definition; no construction exists to verify against",
      "failed",
    );
  }

  if (known === "jcs-n") {
    const committed = ctx.recordCommittedOn;
    if (committed === undefined) {
      return fail(
        "algorithm_withdrawn_jcs_n_vintage_unknown",
        "§4.2",
        "jcs-n is withdrawn and the record's commit date was not supplied, so the pre-2026-08-18 vintage allowance cannot be established",
        "unverified",
      );
    }
    // Lexicographic comparison is correct for ISO-8601 dates sharing a format,
    // and both an ISO date and an ISO date-time sort correctly against a bare
    // date. Timezone is not resolved here — see AMBIGUITY_LOG A20.
    if (committed >= JCS_N_WITHDRAWN_ON) {
      return fail(
        "algorithm_withdrawn_jcs_n",
        "§4.2 / §14.1",
        `jcs-n MUST NOT be newly declared; this record is dated ${committed}, on or after the ${JCS_N_WITHDRAWN_ON} withdrawal`,
        "failed",
      );
    }
    return fail(
      "algorithm_withdrawn_jcs_n_historical",
      "§4.2",
      `record predates the ${JCS_N_WITHDRAWN_ON} withdrawal, but this implementation does not implement the withdrawn construction, so the reference is unverified rather than failed`,
      "unverified",
    );
  }

  if (known === "as-transmitted") {
    return fail(
      "algorithm_not_implemented",
      "§4.4",
      "as-transmitted is registered but not implemented here; this implementation covers §4.1, §5 and §7.1",
      "unverified",
    );
  }

  return ok({ token: known, entry });
}
