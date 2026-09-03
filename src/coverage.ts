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
    "draft-marques-asqav-compliance-receipts-07 (read as a profile layered on farley; its §5.3 scope contradiction is resolved in -08 §4, 31 Aug 2026, pinned in refs/)",
    // The detection refusal below is a rule this adapter takes from -08, so the
    // revision it takes it from is pinned here by digest and not only by name.
    "refs/draft-marques-asqav-compliance-receipts-08.txt, sha256 ee3ca5d7c0acc1cb9b8025d29f19a7d73991718ca35d3bf4229f7b4264976ec0 (the revision whose §4/§5.4 envelope shape {payload, signature, anchors} this adapter declines at detection; it grades no Compliance-Receipt content beyond that refusal)",
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
      source: "draft-marques-asqav-compliance-receipts-07 §5.3; resolved in -08 §4",
      status: "reported_only",
      note: "farley §5.7 is normative for ACTA receipts, and draft-marques-asqav-compliance-receipts-08 §4 confirms it. The two marques readings were candidate explanations for a failing link under -07 (FINDINGS.md E3, E4); under -08 a payload-member-scoped link belongs to a Compliance Receipt, which this adapter declines at detection rather than mis-verifies.",
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

const insight: FormatCoverage = {
  format: "insight.attestation/eip712",
  sources: [
    "EIP-712 (the EIP text; encodeType / encodeData / hashStruct / domainSeparator and the 0x1901 construction are implemented from it here, not taken from a library)",
    "refs/insight-oracle-keys-2026-09-02.json (the published registry at 09:09Z, the only specification Insight publishes)",
    "refs/insight-oracle-keys-2026-09-02T1154Z.json (the same registry at 11:54Z, after the author corrected the schemaVersion it published its 43-field ExecutionReceipt under; both pins are kept so the correction is visible in bytes)",
  ],
  orderNote:
    "Insight publishes no step model and no specification prose, so there is no external numbering to carry. `order` is THIS TOOL'S evaluation order and nothing more; no `specStep` is claimed for any check because no source assigns one.",
  checks: [
    {
      id: "parse",
      order: 1,
      title: "JSON parses and no object repeats a member name",
      source: "RFC 8785 §3.1, RFC 7493 §2.3",
      status: "implemented",
      note: "Ordered first deliberately. JSON.parse silently keeps the last of a repeated member, so a document signed over one value can display another; the scan runs on the raw text, before parsing, and no value from a duplicated object reaches any later check.",
    },
    {
      id: "schema",
      order: 2,
      title: "Every field the artefact's own type declares is present in `data`, with no undeclared extras",
      source: "the artefact's `eip712.types[primaryType]`",
      status: "implemented",
    },
    {
      id: "digest",
      order: 3,
      title: "EIP-712 digest recomputes, and equals `uid` where one is carried",
      source: "EIP-712; uid-as-digest is the package's own construction",
      status: "implemented",
    },
    {
      id: "domain",
      order: 4,
      title: "Every member of the EIP-712 domain is one EIP-712 admits, and any that is not is resolved against the signature",
      source: "EIP-712, \"Definition of domainSeparator\" (name, version, chainId, verifyingContract, salt)",
      status: "conditional",
      note:
        "Runs only when a domain object carries a member outside those five. EIP-712 assigns no encoding to such a member, so no single digest is the right one: both separators are computed and the result says which the signature was actually made under. `domain_extra_fields_unsigned` means the member is declared but is not in the signed bytes, and standard libraries (eth-account, ethers) refuse the artefact before any check runs; `domain_extra_fields_signed` means it is in them, and only a verifier with a custom EIP712Domain type can read it. Neither moves the verdict on its own; failing under both separators is a signature failure that names both attempts. The key is never dropped silently.",
    },
    {
      id: "signature",
      order: 5,
      title: "secp256k1 recovery over that digest returns the stated `attester`",
      source: "EIP-712 + the artefact's `attester` member",
      status: "implemented",
    },
    {
      id: "identity",
      order: 6,
      title: "The recovered signer is a key published in the registry, not revoked on either channel, and inside its own validity window at the evaluation instant; and the registry's type for this primaryType agrees with the artefact's",
      source: "refs/insight-oracle-keys-2026-09-02.json",
      status: "implemented",
      note: "An unpublished signer is UNVERIFIABLE/key_unresolvable, never INVALID: a signature that verifies under a key nobody published is not a forgery, it is an unestablished identity. --allow-unregistered-signer continues past it and asserts nothing about identity. Being LISTED is not being vouched for: this registry retains a rotated-out key in `public_keys` with `revoked: false` and a past `validUntil` (its `key_rotation_policy` calls that overlap), so the key's `validFrom`/`validUntil` are applied against --now and a closed window is UNVERIFIABLE/expired at this check (`not_yet_valid` before `validFrom`), with no key line printed. --allow-unregistered-signer does NOT waive it — the key is registered, its window is shut — and the way to verify a receipt signed before a rotation is to pass the instant it was signed at as --now. A window member present but unreadable is UNVERIFIABLE/malformed_member rather than open-ended. Revocation is read on BOTH channels the registry publishes — `revoked` on the `public_keys` entry and the top-level `revoked_keys` array — and either one is UNVERIFIABLE/`key_revoked`, its own reason rather than `key_unresolvable` because \"no such key\" and \"do not trust this key\" call for different actions. Revocation is checked BEFORE the window and outranks it: a withdrawn key is withdrawn at every instant, so no `--now` recovers it and the detail says so instead of suggesting a re-run. `revoked_keys` is empty in every registry pinned here, so no document says what a populated entry looks like: a bare address-or-key_id string and an object carrying `public_key` and/or `key_id` are read, and an entry in any other shape blocks EVERY key in that registry (UNVERIFIABLE/malformed_member) rather than being skipped, because an entry that cannot be read cannot be shown not to name the signer. The type comparison is looked up by primaryType AND the artefact's own schemaVersion, because the registry retains retired layouts beside the current one and comparing a v2 receipt to the v3 type would report a mismatch that is not one; a version the registry marks `retiredForSigning` is reported as such (`retired_for_signing (v2)`). The comparison is REPORTED (`registry_schema`) and never moves the verdict.",
    },
    {
      id: "freshness",
      order: 7,
      title: "validUntil equals its anchor plus validForSeconds, and has not closed at the evaluation time",
      source: "the artefact's own validUntil / checkedAt / executedAt / validForSeconds",
      status: "implemented",
    },
    {
      id: "binding",
      order: 8,
      title: "The receipt binds to every gate it names, both uids hash to the signed preTradeUidsHash, and each requestHash is the digest of its canonical request",
      source: "the receipt's preTradeUid / destinationPreTradeUid / preTradeUidsHash / requestHash and the gates' canonicalRequest* types",
      status: "conditional",
      note: "Runs when a package supplies gates. Each uid field is checked against the gate filling that role: the source gate carries the receipt's own request, and the destination gate carries the MIRROR request, so its requestHash differs from the receipt's by design and equality is reported rather than required — what must hold there is that its two asset ids are the receipt's, reversed. `preTradeUidsHash` is reproduced as keccak of the two 32-byte uids concatenated, source first, and three other constructions are computed so a mismatch says which encoding would have produced the signed value. A gate that neither uid field names is reported in `unbound_gates` and does not move the verdict — it is not a fault, it is unfinished scope.",
    },
    {
      id: "swap",
      order: 9,
      title: "The pool Swap event decodes to the signed executedPrice, and the delta against quotedPrice is recomputed",
      source: "the Uniswap V3 Swap event ABI, derived from its signature string here",
      status: "conditional",
      note: "Runs when the package ships rawSwapEvent and names its legs. Token decimals come from --tokens where given and otherwise from a two-entry built-in table; which one was used is reported in `token_decimals_source`, and an unknown token skips the check rather than assuming 18.",
    },
    {
      id: "attribution",
      order: 10,
      title: "Net flow per address over every Transfer log, and the price actually realised by the final beneficiary",
      source: "the ERC-20 Transfer event ABI, derived from its signature string here",
      status: "reported_only",
      note: "Never moves the verdict in either direction. The receipt does not claim what the beneficiary realised, so a divergence is not a false statement by the issuer — it is a different measurement, and printing it beside the signed one is the whole value.",
    },
    {
      id: "prices",
      order: 11,
      title: "Prices read at the signed `priceScale`, the quote recomputed from both gates, and the execution status recomputed",
      source: "the receipt's priceScale/quotedPrice/executedPrice and the gates' consensusPrice",
      status: "conditional",
      note: "Runs when the receipt carries quotedPrice and executedPrice; the gate-derived recompute runs only when the receipt signs a `priceScale` (v3) and both gates are present. A quote that does not come out of the gates the receipt binds to is INVALID/content_commitment_mismatch: `bindingMode: VERIFIED` states the quote is derived from them, and a label that is not checked is not a binding. Two deltas are reported — one from the pool's own integer amounts against the gates' unrounded ratio, one from the two scaled integers the issuer signed — because at this pair's orientation and scale 8 the signed pair carries five significant digits and the two differ in the first decimal. An artefact that declares no priceScale is read at 8 and the assumption is printed, never made silently.",
    },
    {
      id: "measured_fields",
      order: 12,
      title: "`measuredFieldsHash` recomputed from the set of fields the package declares measured",
      source: "the receipt's signed measuredFieldsHash and the package's own `measuredFields` enumeration",
      status: "reported_only",
      note: "Reported, never a verdict, for the same reason `registry_schema` is: the enumeration sits OUTSIDE the signature, so a disagreement is evidence against the package's unsigned side and calling the receipt invalid for it would put the fault in the wrong place. The empty set hashes to keccak(\"\"), which is what both packages sign; saying nothing would let an empty enumeration pass for a checked one.",
    },
    {
      id: "chain",
      order: 13,
      title: "Transaction status, block number, block timestamp and shipped logs corroborated against a JSON-RPC endpoint",
      source: "eth_getTransactionReceipt / eth_getBlockByNumber",
      status: "conditional",
      note: "Runs only with --rpc, and reports the sha256 of each RPC response so the answer is quotable. Without it the result says `chain: not_checked (no rpc)`. If --rpc is given and the endpoint fails, the result is UNVERIFIABLE/io_error rather than a silent downgrade. Chain facts are added BESIDE the findings of the earlier checks and never written over them: a check that corroborates must not be able to degrade what it confirms.",
    },
    {
      id: "precedence",
      order: 14,
      title: "That a pre-trade gate existed BEFORE the trade it gates",
      source: "the claim the package's structure invites; no source establishes it",
      status: "not_implemented",
      note: "Not implementable from these bytes and declared so on every result, including VALID. The gate's signature timestamp is package metadata outside the signed struct, and `checkedAt` is a signed field whose value the signer chooses. Binding the receipt to the gate's bytes is proved here; ordering in time is not, and closes only by anchoring the gate uid before the trade transaction. What IS read, and reported beside the declaration, is what the receipt's own two timestamps say: `signed_before_block` where preTradeSignedAt precedes executedAt, `after_block` where it does not — and in the second case the verdict must not be FAITHFUL, which the recomputed execution status enforces. Reading a signer's own claim is not proving it, and the line says so on every result.",
    },
    {
      id: "observations",
      order: 15,
      title: "participantCount, sourceGroupCount, independence, consensus-price provenance and mevRiskBps",
      source: "the receipt's own signed fields",
      status: "not_implemented",
      note: "Issuer claims. The signature proves the issuer committed to these numbers; nothing in the package tests whether they describe anything. The package labels its own pre-trade observations synthetic.",
    },
  ],
};

// ---------------------------------------------------------------------------

export const COVERAGE: Readonly<Record<string, FormatCoverage>> = Object.freeze({
  [verification.format]: verification,
  [acta.format]: acta,
  [evidenceAction.format]: evidenceAction,
  [insight.format]: insight,
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
