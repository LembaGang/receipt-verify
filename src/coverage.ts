// Coverage manifest: what each format DECLARES, and what this tool EVALUATES.
//
// Why this file exists. A fail-closed refusal early in a protocol masks every
// check behind it, and the masking is silent: the verdict is correct, the
// reason is correct, and nothing distinguishes "this check ran and passed" from
// "this check does not exist here" until the early refusal is removed. That is
// exactly how a declared recompute (`action-ref-v1`, comp-r04) sat unevaluated
// behind an unresolvable mapping until the mapping was published — see
// FINDINGS-rerun-2026-07-29.md R1.
//
// This manifest is a DECLARATION, not an implementation. Nothing here verifies
// anything. A `not_implemented` entry stays not implemented until someone
// implements it; listing it changes only whether a caller can see the gap
// without reading the source.
//
// A verdict is never derived from this file. Its only effect on output is to
// add a `coverage` block naming what was not evaluated.

/**
 * `implemented`     — runs on every verification of this format and can change
 *                     the verdict.
 * `conditional`     — implemented, but runs only when the receipt carries the
 *                     field and the caller supplies the input it needs. When it
 *                     does not run, the adapter says so in an annotation
 *                     (`commitment_check`, `chain_link`), so a skipped
 *                     conditional check is visible on the result itself.
 * `reported_only`   — evaluated and reported, never contributes to the verdict
 *                     in either direction.
 * `delegated`       — evaluated by a published third-party artifact rather than
 *                     by code in this repository.
 * `not_implemented` — declared by a normative source or by the published
 *                     conformance corpus; this tool does not evaluate it. It
 *                     contributes nothing to any verdict, in either direction.
 */
export type CheckStatus =
  | "implemented"
  | "conditional"
  | "reported_only"
  | "delegated"
  | "not_implemented";

export interface DeclaredCheck {
  /** Stable token. Agents branch on this; it does not change between releases. */
  id: string;
  /** This tool's evaluation order for the format. Dense, 1-based. */
  order: number;
  title: string;
  /** Where the check is declared — a draft section, or the published corpus. */
  source: string;
  /** The step number the normative source assigns, where it assigns one. */
  specStep?: number;
  status: CheckStatus;
  /** Required on anything not `implemented`: why, in one line. */
  note?: string;
}

export interface FormatCoverage {
  format: string;
  sources: string[];
  /** How to read `order` for this format. */
  orderNote: string;
  checks: DeclaredCheck[];
}

// ---------------------------------------------------------------------------

const verification: FormatCoverage = {
  format: "verification.*",
  sources: [
    "draft-krausz-verification-state-01",
    "TKCollective/agentoracle-receipt-spec examples/v0.3-composed/vectors.json",
  ],
  orderNote:
    "§4.3 numbers steps 1-8 and `specStep` carries that number. `order` is this tool's evaluation order, which interleaves the composed-profile checks the published corpus declares but the draft does not number.",
  checks: [
    {
      id: "jws_signature",
      order: 1,
      specStep: 1,
      title: "Every signature present verifies under the issuer's published JWKS",
      source: "§4.3 step 1, §4.1",
      status: "implemented",
    },
    {
      id: "signing_trust_ref_quorum",
      order: 2,
      title: "signature_meta.signing_trust_ref quorum shape is satisfied",
      source: "corpus: signing-trust-ref-v1, str-003 (multi_party, all-signers-required)",
      status: "not_implemented",
      note: "Four published payloads carry `signing_trust_ref`; this tool requires every signature present to verify but does not resolve the trust-ref or check the quorum shape it names.",
    },
    {
      id: "payload_profile",
      order: 3,
      specStep: 2,
      title: "Payload carries a recognised claim set (flat §4.2, or the composed envelope)",
      source: "§4.2; corpus envelope_kind",
      status: "implemented",
    },
    {
      id: "sibling_pointer_grammar",
      order: 4,
      specStep: 2,
      title: "An unresolved sibling pointer is absent, never null",
      source: "corpus: comp-r02 (mycelium_trail_id_is_null)",
      status: "implemented",
    },
    {
      id: "mapping_binding",
      order: 5,
      specStep: 2,
      title: "v_gate mapping resolves and its digest equals v_gate_mapping_hash",
      source: "§4.3 step 2, §4.6",
      status: "implemented",
    },
    {
      id: "sibling_leg_mapping_binding",
      order: 6,
      specStep: 2,
      title: "Mapping bindings on non-v_gate legs resolve and hash-match",
      source: "§4.3 step 2 applied to v_gate_skill / screen_ref",
      status: "not_implemented",
      note: "§4.3 is written against one claim set. The composed profile binds a mapping per leg; only the v_gate leg's binding is resolved here. The v_gate_skill leg's mapping is not resolved and does not affect the verdict.",
    },
    {
      id: "inline_threshold_agreement",
      order: 7,
      title: "Inline v_gate_threshold agrees with the mapping document's threshold",
      source: "§5.2; FINDINGS.md B5",
      status: "not_implemented",
      note: "§5.2 places the threshold in the mapping document, and the recompute here uses the mapping's value. Published receipts also carry an inline `v_gate_threshold`; the two are not cross-checked, so a receipt whose inline value disagrees with its mapping is not refused for that reason.",
    },
    {
      id: "recommendation_recompute",
      order: 8,
      specStep: 3,
      title: "Recommendation recomputed from the canonical triple under the mapping's rules",
      source: "§4.3 step 3, §5.1 Table 2",
      status: "implemented",
    },
    {
      id: "recommendation_match",
      order: 9,
      specStep: 4,
      title: "Recomputed recommendation equals the signed v_recommendation",
      source: "§4.3 step 4",
      status: "implemented",
    },
    {
      id: "gate_derive",
      order: 10,
      specStep: 5,
      title: "Gate derived from the recommendation",
      source: "§4.3 step 5",
      status: "implemented",
    },
    {
      id: "gate_match",
      order: 11,
      specStep: 6,
      title: "Derived gate equals the signed gate",
      source: "§4.3 step 6",
      status: "implemented",
    },
    {
      id: "screen_ref_action_ref",
      order: 12,
      specStep: 4,
      title: "screen_ref.action_ref equals the action-ref-v1 recompute of its preimage",
      source: "corpus: comp-r04 (screen_ref_action_ref_mismatch), action-ref-v1",
      status: "conditional",
      note: "Runs when the composed payload carries a screen_ref. Implemented 2026-07-29; see FINDINGS-rerun-2026-07-29.md R1.",
    },
    {
      id: "composed_decision_rule",
      order: 13,
      specStep: 4,
      title: "composed_decision recomputes from the present sibling pointers under AND_PRESENT",
      source: "corpus: comp-r03 (composed_decision_rule_violated)",
      status: "conditional",
      note: "Runs on the composed profile only. AND_PRESENT is the only composition rule implemented; any other value is refused rather than assumed.",
    },
    {
      id: "registered_claims",
      order: 14,
      specStep: 7,
      title: "iss / iat / exp present as §4.2 REQUIRES",
      source: "§4.2",
      status: "conditional",
      note: "Enforced on the flat profile. Relaxed on the composed profile, where no published fixture carries any of the three (FINDINGS.md A5); enforcing it there would make every published fixture malformed for a second, independent reason.",
    },
    {
      id: "time_window",
      order: 15,
      specStep: 7,
      title: "exp / nbf checked against the evaluation time, with clock tolerance",
      source: "§4.3 step 7, §6",
      status: "implemented",
      note: "The 60s default tolerance is this tool's choice; §6 specifies no value (FINDINGS.md A3).",
    },
  ],
};

const acta: FormatCoverage = {
  format: "acta.receipt/0",
  sources: [
    "draft-farley-acta-signed-receipts-02",
    "draft-marques-asqav-compliance-receipts-07 (read as a profile layered on farley)",
  ],
  orderNote:
    "farley numbers steps only within §4.1 and §4.2. `order` is this tool's evaluation order across the whole receipt and is not a numbering the draft assigns.",
  checks: [
    {
      id: "envelope_shape",
      order: 1,
      title: "Receipt is the §2.1 {payload, signature} envelope",
      source: "§2.1, §2.1.1",
      status: "implemented",
      note: "The published corpus blesses three other shapes; none is the §2.1 envelope, and each returns malformed_receipt rather than being shape-sniffed (FINDINGS.md E6).",
    },
    {
      id: "signature_encoding",
      order: 2,
      title: "signature.sig is even-length lowercase hexadecimal",
      source: "§2.1.1",
      status: "implemented",
    },
    {
      id: "algorithm_supported",
      order: 3,
      title: "signature.alg is one this tool can verify",
      source: "§2.1.1, §5.8",
      status: "implemented",
    },
    {
      id: "mldsa65_signature",
      order: 4,
      title: "ML-DSA-65 (FIPS 204) signature verification",
      source: "§5.8 — RECOMMENDED for new deployments and post-quantum readiness",
      status: "not_implemented",
      note: "No ML-DSA implementation is available here. A receipt declaring it returns UNVERIFIABLE/unsupported_algorithm: a signature this tool cannot check is not one it may call good or bad.",
    },
    {
      id: "key_resolution",
      order: 5,
      specStep: 4,
      title: "kid resolves to exactly one key in the published JWK Set",
      source: "§4.2 step 4, §4.3",
      status: "implemented",
    },
    {
      id: "signature_scope_5_6",
      order: 6,
      specStep: 5,
      title: "Signature verifies over the §5.6 bytes (receipt object minus `signature`)",
      source: "§5.6 (Normative Clarification)",
      status: "implemented",
    },
    {
      id: "signature_scope_4_1_variant",
      order: 7,
      title: "Whether a failing signature verifies under the §4.1 step 2 scope instead",
      source: "§4.1 step 2",
      status: "reported_only",
      note: "The draft specifies two signing inputs (FINDINGS.md E2). §5.6 is normative here; the §4.1 reading is computed only to name the disagreement on a refusal, and is never accepted.",
    },
    {
      id: "common_payload_fields",
      order: 8,
      title: "payload.type / issued_at / issuer_id present and well-formed",
      source: "§2.2",
      status: "implemented",
    },
    {
      id: "issuer_id_kid_binding",
      order: 9,
      title: "payload.issuer_id equals signature.kid",
      source: "§2.2",
      status: "implemented",
    },
    {
      id: "commitment_root",
      order: 10,
      title: "committed_fields_root recomputes from the disclosed leaves and their proofs",
      source: "§5.1-§5.5",
      status: "conditional",
      note: "Runs only with --disclose. Without it the receipt is annotated `commitment_check=not performed`; a check that did not run contributes to the verdict in neither direction.",
    },
    {
      id: "chain_linkage",
      order: 11,
      title: "previousReceiptHash equals SHA-256(JCS(predecessor envelope)) under §5.7",
      source: "§5.7 (Normative Clarification)",
      status: "conditional",
      note: "Runs only with --prev. Without it the receipt is annotated `chain_link=present but not checked`.",
    },
    {
      id: "chain_scope_variant",
      order: 12,
      title: "Whether a failing chain link matches a signature-exclusive scope instead",
      source: "draft-marques-asqav-compliance-receipts-07 §5.3",
      status: "reported_only",
      note: "Three candidate scopes exist for one field (FINDINGS.md E3, E4). farley §5.7 is normative here; the two marques readings are computed only to name which one a failing link matches.",
    },
    {
      id: "replay_age",
      order: 13,
      title: "Receipt age against the §8.1 staleness recommendation",
      source: "§8.1 — 24 hours RECOMMENDED as a default",
      status: "reported_only",
      note: "Not enforced. §8.1's default would reject every receipt in an audit older than a day, which is the case §1's offline-verification goal exists to serve (FINDINGS.md E7). The age is reported as `receipt_age_hours` and the policy left to the caller.",
    },
  ],
};

const evidenceAction: FormatCoverage = {
  format: "evidence.action/0",
  sources: [
    "agent-action-receipt-vectors SPEC.md + manifest.json",
    "@headlessoracle/chirindo@0.4.0 (published npm artifact)",
  ],
  orderNote:
    "Verification proper is delegated to a published artifact, which does not expose a step model. `order` covers only what this repository does around that call.",
  checks: [
    {
      id: "kid_extraction",
      order: 1,
      title: "First record carries a `kid`",
      source: "SPEC.md",
      status: "implemented",
    },
    {
      id: "key_resolution",
      order: 2,
      title: "kid resolves to exactly one public key in the supplied JWK Set",
      source: "this repository — public-key-only resolution",
      status: "implemented",
      note: "Supplied because the published artifact's offline path accepts only an identity file, not a JWK (FINDINGS.md C4). Public material only; no code path here reads a private key.",
    },
    {
      id: "chain_verification",
      order: 3,
      title: "Signatures, request commitments, and prev_hash linkage across the chain",
      source: "@headlessoracle/chirindo@0.4.0 runVerify",
      status: "delegated",
      note: "Evaluated by the published artifact, not by code here. This repository asserts only that all six conformance vectors reproduce their manifest-declared outcomes through it.",
    },
    {
      id: "result_translation",
      order: 4,
      title: "Five-state result maps onto the tri-state contract",
      source: "this repository — README Format 1 table",
      status: "implemented",
      note: "The INVALID/UNVERIFIABLE split is this tool's line, not the artifact's: a determinate negative under a resolved key is INVALID, a refusal to complete the check is UNVERIFIABLE.",
    },
    {
      id: "jwks_uri_policy",
      order: 5,
      title: "Rejection of an insecure jwks_uri named inside the chain",
      source: "@headlessoracle/chirindo@0.4.0",
      status: "delegated",
      note: "The published artifact decides this; this repository only translates its `insecure_jwks_uri` result into a refusal. Not reachable on the offline path used here, which supplies the key from a JWK Set rather than from a URI inside the chain.",
    },
  ],
};

// ---------------------------------------------------------------------------

export const COVERAGE: Readonly<Record<string, FormatCoverage>> = Object.freeze({
  [verification.format]: verification,
  [acta.format]: acta,
  [evidenceAction.format]: evidenceAction,
});

export function coverageFor(format: string): FormatCoverage | undefined {
  return COVERAGE[format];
}

/**
 * The step number the normative source assigns to a check, where it assigns
 * one. Adapters read it rather than writing step numbers at each refusal site,
 * so the step a refusal reports and the check the coverage block names cannot
 * drift apart.
 */
export function specStepOf(format: string, checkId: string): number | undefined {
  return coverageFor(format)?.checks.find((c) => c.id === checkId)?.specStep;
}

export type NotEvaluatedReason = "not_reached" | "not_implemented";

export interface NotEvaluated {
  id: string;
  title: string;
  source: string;
  status: CheckStatus;
  reason: NotEvaluatedReason;
}

/**
 * The checks a run did not evaluate.
 *
 * `not_implemented` entries are returned whatever the verdict — they are never
 * evaluated, so a VALID result must disclose them too. `not_reached` entries
 * are those ordered after the check that stopped evaluation.
 *
 * A `conditional` check that did not run because its input was absent is NOT
 * reported here: the adapter already annotates that case on the result itself
 * (`commitment_check`, `chain_link`), and duplicating it would make a
 * deliberately-skipped optional check look like a coverage gap.
 */
export function checksNotEvaluated(format: string, stoppedAt?: string): NotEvaluated[] {
  const cov = coverageFor(format);
  if (cov === undefined) return [];

  const stop = stoppedAt === undefined ? undefined : cov.checks.find((c) => c.id === stoppedAt);
  const out: NotEvaluated[] = [];

  for (const c of cov.checks) {
    const notReached = stop !== undefined && c.order > stop.order;
    if (c.status === "not_implemented") {
      out.push({ id: c.id, title: c.title, source: c.source, status: c.status, reason: "not_implemented" });
    } else if (notReached) {
      out.push({ id: c.id, title: c.title, source: c.source, status: c.status, reason: "not_reached" });
    }
  }
  return out;
}
