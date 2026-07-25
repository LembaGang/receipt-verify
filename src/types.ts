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
   * Information carried by the receipt that is NOT this tool's decision.
   * Notably `receipt_gate` — the gate value the issuer recorded (act/halt).
   * Reported so a caller can see it; never used to pick the verdict.
   */
  annotations?: Record<string, string | number | boolean>;
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
  /** Clock tolerance in seconds for exp/nbf. */
  clockToleranceSec?: number;
  /** Fixed evaluation time (epoch seconds). Tests pin this; the CLI does not. */
  now?: number;
  /** Path the bytes came from, for error text only. */
  sourcePath?: string;
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
