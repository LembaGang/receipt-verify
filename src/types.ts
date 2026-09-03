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
  | "mapping_unresolvable"
  | "mapping_hash_mismatch"
  | "recompute_mismatch"
  | "expired"
  | "not_yet_valid"
  | "unsupported_algorithm"
  | "empty_receipt"
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
