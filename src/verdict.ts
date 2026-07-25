// Verdict constructors and the single place exit codes and output lines are
// decided. Keeping this in one module is what makes the tri-state contract
// enforceable rather than aspirational.

import type { ReasonCode, ResolvedKey, VerifyResult } from "./types.js";

export function valid(
  format: string,
  detail: string,
  resolvedKey: ResolvedKey,
  annotations?: Record<string, string | number | boolean>,
): VerifyResult {
  return annotations === undefined
    ? { verdict: "VALID", reason: "verified", detail, format, resolvedKey }
    : { verdict: "VALID", reason: "verified", detail, format, resolvedKey, annotations };
}

/**
 * INVALID — key-binding. Reached only when a published key WAS resolved and the
 * receipt provably fails to bind to it. The resolved key is mandatory: naming
 * it is what makes the statement falsifiable by the reader.
 */
export function invalid(
  format: string,
  reason: Extract<
    ReasonCode,
    | "signature_invalid"
    | "key_binding_mismatch"
    | "content_commitment_mismatch"
    | "chain_linkage_broken"
  >,
  detail: string,
  resolvedKey: ResolvedKey,
): VerifyResult {
  return { verdict: "INVALID", reason, detail, format, resolvedKey };
}

/**
 * UNVERIFIABLE — fail-closed. The check could not be completed, so no claim is
 * made either way. Deliberately takes no ResolvedKey parameter: there is no way
 * to emit a "verified under key" line from this path.
 */
export function unverifiable(
  format: string,
  reason: ReasonCode,
  detail: string,
  annotations?: Record<string, string | number | boolean>,
): VerifyResult {
  return annotations === undefined
    ? { verdict: "UNVERIFIABLE", reason, detail, format }
    : { verdict: "UNVERIFIABLE", reason, detail, format, annotations };
}

/** VALID exits 0. INVALID and UNVERIFIABLE both exit 1. */
export function exitCodeFor(r: VerifyResult): 0 | 1 {
  return r.verdict === "VALID" ? 0 : 1;
}

/**
 * VALID asserts something under a key; INVALID asserts the opposite under the
 * same key. Only the first is a "verified under" statement, so the verb differs
 * — and UNVERIFIABLE reaches neither, because it has no ResolvedKey to print.
 */
function keyLine(k: ResolvedKey, verdict: VerifyResult["verdict"]): string {
  const tp = k.thumbprint ? ` (thumbprint ${k.thumbprint})` : "";
  const verb = verdict === "VALID" ? "verified under key" : "checked against resolved key";
  return `${verb} ${k.kid}${tp} resolved from ${k.origin}`;
}

/**
 * The human-readable rendering. The key line appears on VALID and INVALID —
 * on INVALID it names the key the receipt failed against, which is the whole
 * point of separating INVALID from UNVERIFIABLE.
 */
export function formatResult(r: VerifyResult): string {
  const head =
    r.verdict === "INVALID"
      ? `INVALID — key-binding: ${r.detail}`
      : `${r.verdict} — ${r.detail}`;
  const lines = [head, `format: ${r.format}`, `reason: ${r.reason}`];
  if (r.resolvedKey) lines.push(keyLine(r.resolvedKey, r.verdict));
  if (r.annotations) {
    for (const [k, v] of Object.entries(r.annotations)) {
      // The receipt's own gate value is the one annotation that could be
      // mistaken for advice, so it carries the disclaimer.
      const note = k === "receipt_gate" ? " (the issuer's recorded gate value, not a decision by this tool)" : "";
      lines.push(`annotation: ${k}=${String(v)}${note}`);
    }
  }
  return lines.join("\n");
}

/** Stable JSON rendering. This is the agent-facing surface. */
export function jsonResult(r: VerifyResult): string {
  return JSON.stringify(
    {
      schema: "receipt-verify/verdict/0",
      verdict: r.verdict,
      reason: r.reason,
      format: r.format,
      detail: r.detail,
      resolved_key: r.resolvedKey ?? null,
      annotations: r.annotations ?? {},
      exit_code: exitCodeFor(r),
    },
    null,
    2,
  );
}
