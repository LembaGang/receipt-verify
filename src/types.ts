// The tri-state contract. Every adapter returns exactly one of these three
// verdicts, and the shape below is the whole public surface of this tool.
//
// The verdict attaches to a RECEIPT under a FORMAT. It never attaches to a
// vendor, and it is never a gate decision — see README.

export type Verdict = "VALID" | "INVALID" | "UNVERIFIABLE";

/**
 * The key a verdict was reached under. Present on VALID and on INVALID
 * (key-binding) — those are the two states in which a published key was
 * actually resolved and the receipt was actually checked against it.
 *
 * MUST be absent on UNVERIFIABLE. An UNVERIFIABLE result never prints a
 * "verified under key" line, because no such statement was established.
 */
export interface ResolvedKey {
  /** Stable identifier the receipt used to name the key. */
  kid: string;
  /** RFC 7638 JWK thumbprint of the key actually resolved, where derivable. */
  thumbprint?: string;
  /** JOSE algorithm the key verifies under, e.g. "EdDSA", "ES256". */
  alg?: string;
  /** Where the key came from: a URL, or a file path for a snapshot. */
  origin: string;
}

/**
 * `reason` is the agent-facing field: a stable, closed-vocabulary token. It is
 * the value a consumer branches on. `detail` is the human line and may change
 * wording between releases; agents MUST NOT parse it.
 */
export interface VerifyResult {
  verdict: Verdict;
  reason: ReasonCode;
  detail: string;
  /** Format token the receipt was verified under, e.g. "evidence.action/0". */
  format: string;
  resolvedKey?: ResolvedKey;
  /**
   * State read out of the receipt that is NOT this tool's decision. Two kinds
   * live here, and the difference matters when reading one:
   *
   *  - CARRIED — a value the issuer wrote into the signed bytes. `receipt_gate`
   *    is the gate value the issuer recorded (act/halt).
   *  - RECOMPUTED — a value derived from those same signed bytes by the format's
   *    own rules. `delivery` (proven | unproven | none) is the x402 pairing of a
   *    payment reference against an output commitment.
   *
   * Both are reported so a caller can see them. Neither is ever used to pick the
   * verdict, and neither is reflected in the exit code.
   */
  annotations?: Record<string, string | number | boolean>;
  /**
   * Checks this format declares `conditional` whose CONDITION was not met by the
   * shape of what was supplied — a receipt with no gates to bind to, a package
   * with no on-chain block, a caller who passed no `--rpc`. Each carries the
   * check id and the condition in words.
   *
   * These are not failures and not gaps in the tool: they are checks that had
   * nothing to run against. They are reported because an agent reading
   * `coverage` alone would otherwise see a bare attestation's result as
   * indistinguishable from a full package's, and would have to parse the
   * adapter's prose annotations to learn that `preTradeUidsHash` was never
   * examined. `checksNotEvaluated` merges them in under
   * `reason: "condition_unmet"`.
   */
  conditionsUnmet?: { id: string; condition: string }[];
  /**
   * The `src/coverage.ts` check id at which evaluation stopped, on any result
   * that did not run the format's checks to the end. Everything ordered after
   * it was not evaluated, and the output says so rather than leaving a caller
   * to infer that a refusal implies the checks behind it passed.
   *
   * Absent on VALID: evaluation reached the end.
   */
  stoppedAt?: string;
}

export type ReasonCode =
  // VALID
  | "verified"
  // INVALID — key-binding: a published key resolved, and the receipt provably
  // fails to bind to it.
  | "signature_invalid"
  | "key_binding_mismatch"
  | "content_commitment_mismatch"
  | "chain_linkage_broken"
  // UNVERIFIABLE — fail-closed: the check could not be completed.
  | "format_unrecognized"
  | "malformed_receipt"
  | "malformed_member"
  | "key_unresolvable"
  /**
   * The signer resolved to a published key the issuer has WITHDRAWN. Distinct
   * from `key_unresolvable` on purpose: "no such key" and "this key must not be
   * trusted" call for different actions, and a consumer that cannot tell them
   * apart cannot act on either. Additive to this union — a consumer branching on
   * the older members falls through to its default, which is the fail-closed
   * side of an UNVERIFIABLE.
   */
  | "key_revoked"
  /**
   * The signer resolved to a published key, and the ARTEFACT'S OWN instant falls
   * outside that key's `[validFrom, validUntil]`. Distinct from `expired` and
   * `not_yet_valid`, which are both statements about the instant the CALLER
   * asked about (`--now`) and are recoverable by asking about a different one.
   * This one is not: the artefact says when it was made, the registry says when
   * the key was good for, and the two do not overlap at any `--now`. A consumer
   * that could not tell the two apart would retry a check that cannot pass.
   * Additive to this union — a consumer branching on the older members falls
   * through to its default, which is the fail-closed side of an UNVERIFIABLE.
   */
  | "signed_outside_key_window"
  | "mapping_unresolvable"
  | "mapping_hash_mismatch"
  | "recompute_mismatch"
  | "expired"
  | "not_yet_valid"
  | "unsupported_algorithm"
  | "empty_receipt"
  /**
   * The verifier holds no chain data for the transaction the artefacts name and
   * was given no endpoint to fetch it from, or the endpoint it was given failed.
   * Distinct from `io_error`, which says a read this tool attempted broke:
   * `chain_unavailable` also covers the case where NO read was attempted because
   * the caller supplied neither `chain` nor `rpc`, and a consumer that could not
   * tell the two apart would retry a fetch nobody asked for. Added for
   * x402.settlement/2, where every relation between the signed authorization and
   * the money actually moved needs a chain the verifier chose. Additive to this
   * union — a consumer branching on the older members falls through to its
   * default, which is the fail-closed side of an UNVERIFIABLE.
   */
  /**
   * An ExecutionReceipt v1-v4 was verified without the registry snapshot its
   * verdict must be relative to. The issuer's deployed rule makes a legacy
   * verdict historical and snapshot-relative and REQUIRES the exact preserved
   * registry bytes, their full SHA-256 and their byte length with every such
   * verdict; without them there is no verdict this tool is entitled to state.
   * Distinct from `key_unresolvable`, which is about a signer that no published
   * registry names: this one fires whether or not the signer would resolve, and
   * `--allow-unregistered-signer` does not waive it, because that flag speaks
   * about identity and this is about the scope of the whole result. Additive to
   * this union — a consumer branching on the older members falls through to its
   * default, which is the fail-closed side of an UNVERIFIABLE.
   */
  | "registry_snapshot_required"
  /**
   * The caller named a SHA-256 for the registry snapshot and the bytes supplied
   * digest to something else. A fact about the caller's inputs, never about the
   * receipt, so it is UNVERIFIABLE and not INVALID: nothing here says the
   * receipt fails to bind to anything. Distinct from `malformed_member`, which
   * says a document could not be read — both documents here read perfectly and
   * disagree about which one was meant. Additive to this union — a consumer
   * branching on the older members falls through to its default, which is the
   * fail-closed side of an UNVERIFIABLE.
   */
  | "registry_snapshot_mismatch"
  /**
   * The receipt signs a semantic profile id the registry does not publish for
   * its layout. `schemaVersion` names the EIP-712 field layout and nothing more;
   * the commitment constructions, the sentinels, the scales and the verdict
   * rules live in the content-addressed profile, so a profile nobody published
   * means the semantics of every signed number in the receipt are unestablished.
   * The issuer's rule is that an unrecognised profile fails closed; an unknown
   * state resolving to the restricted default is, in this tool, UNVERIFIABLE.
   * Distinct from `key_unresolvable`, which is about who signed: this one is
   * about what the signature means. Additive to this union — a consumer
   * branching on the older members falls through to its default, which is the
   * fail-closed side of an UNVERIFIABLE.
   */
  | "profile_unrecognised"
  /**
   * The registry names a member as the one that carries the semantic profile id
   * for this layout, and the receipt signs no such member. Distinct from
   * `profile_unrecognised`, which names two ids that disagree: here there is
   * nothing to compare, and a consumer that could not tell them apart could not
   * tell a receipt committing to the wrong semantics from one committing to
   * none. Additive to this union — a consumer branching on the older members
   * falls through to its default, which is the fail-closed side of an
   * UNVERIFIABLE.
   */
  | "profile_absent"
  | "chain_unavailable"
  /**
   * The envelope carries chain data and none of the three off-chain artefacts,
   * so the relations that give a settlement its meaning — which resource was
   * paid for, who authorized the transfer, what the facilitator answered — were
   * not evaluated at all. Distinct from `malformed_receipt`: nothing here is
   * malformed, the bytes are simply a chain-side observation and the verdict
   * says so rather than reporting a pass on the half that was present. Added for
   * x402.settlement/2. Additive to this union — a consumer branching on the
   * older members falls through to its default, which is the fail-closed side of
   * an UNVERIFIABLE.
   */
  | "artefacts_absent"
  /**
   * A chain fact, read at a height, contradicts what the artefacts say. Distinct
   * from `content_commitment_mismatch`, which is a disagreement BETWEEN the
   * artefacts and is decidable from them alone: this one needs a third party —
   * the chain — and its force depends on the endpoint the verifier chose and on
   * the block being at height, both of which the result reports. Added for
   * x402.settlement/2. Additive to this union — a consumer branching on the
   * older members falls through to its default, which is the fail-closed side of
   * an UNVERIFIABLE, and this is an INVALID, so such a consumer fails closed on
   * a determinate negative rather than passing it.
   */
  | "chain_contradicts_artefacts"
  | "io_error";

export interface VerifyOptions {
  /**
   * Where to resolve published keys from. A local JWKS file (a snapshot), a
   * directory of JWKS files, or an https URL. Never a private key: this tool
   * has no code path that reads private key material.
   */
  jwks?: string;
  /** Directory of mapping documents, for formats that bind to one. */
  mappingDir?: string;
  /** Detached-JWS payload: the bytes the signature covers. */
  detachedPayload?: Uint8Array;
  /**
   * Treat `detachedPayload` as a JSON document and canonicalize it (RFC 8785
   * JCS) before it enters the signing input. This is what makes a detached
   * receipt verifiable when issuer and verifier exchange the payload as an
   * object rather than as pinned bytes.
   */
  canonicalizePayload?: boolean;
  /**
   * The predecessor receipt, for formats that carry a chain link. Supplied as
   * bytes so the digest is taken over exactly what was on the wire.
   */
  previousReceipt?: Uint8Array;
  /**
   * Disclosed (name, value, salt, proof) tuples, for formats whose receipts
   * commit to field values rather than carrying them in cleartext.
   */
  disclosures?: Uint8Array;
  /** Clock tolerance in seconds for exp/nbf. */
  clockToleranceSec?: number;
  /** Fixed evaluation time (epoch seconds). Tests pin this; the CLI does not. */
  now?: number;
  /** Path the bytes came from, for error text only. */
  sourcePath?: string;
  /**
   * A published key registry, as bytes, for formats that resolve a signer from
   * one rather than from a JWK Set. Supplied as bytes for the same reason
   * `previousReceipt` is: the digest is taken over exactly what was on the wire.
   */
  registry?: Uint8Array;
  /** Where `registry` came from, for the ResolvedKey `origin` line. */
  registryOrigin?: string;
  /**
   * The SHA-256 the caller claims for `registry`, lowercase hex. Optional, and
   * checked rather than trusted: when it is supplied and the bytes digest to
   * something else the result is UNVERIFIABLE/`registry_snapshot_mismatch` and
   * nothing after it is evaluated.
   *
   * It exists because a snapshot-relative verdict is only as good as the
   * reader's ability to tell WHICH snapshot it was taken against. The digest of
   * the supplied bytes is reported on every legacy verdict either way; this lets
   * a caller who already knows which snapshot they mean find out, in the
   * verdict, that they passed a different file.
   */
  registrySha256?: string;
  /**
   * Continue past a signer that resolves to no published key. This asserts
   * NOTHING about identity: it lets the structural checks run over an artefact
   * signed with a labelled test key, and the result says so in an annotation.
   * Without it, an unresolvable signer is UNVERIFIABLE, which is the default.
   */
  allowUnregisteredSigner?: boolean;
  /** JSON-RPC endpoint, for formats that can corroborate against a chain. */
  rpc?: string;
  /** Token decimals by lowercase contract address, for on-chain amount decoding. */
  tokens?: Record<string, number>;
}

export interface Adapter {
  /** Format token this adapter verifies under. */
  readonly format: string;
  /**
   * Cheap shape test for auto-detection. MUST be conservative: return false
   * when unsure. Ambiguity is resolved by refusing to guess, not by ranking.
   */
  detect?(bytes: Uint8Array): boolean;
  verify(bytes: Uint8Array, opts: VerifyOptions): Promise<VerifyResult>;
}
