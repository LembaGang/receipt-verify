// Verdict constructors and the single place exit codes and output lines are
// decided. Keeping this in one module is what makes the tri-state contract
// enforceable rather than aspirational.

import { checksNotEvaluated, type NotEvaluated } from "./coverage.js";
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
 * INVALID — a determinate negative under a named key. The resolved key is
 * mandatory: naming it is what makes the statement falsifiable by the reader.
 *
 * The first four reasons are key-binding failures: a key resolved and the
 * receipt provably fails to bind to it. `expired` and `malformed_member` are
 * NOT key-binding — they are determinate negatives of a different kind, added
 * for insight.attestation/eip712, where a validity window that has closed and a
 * `uid` that is not the digest of its own bytes are both facts the checker
 * establishes rather than fails to complete. `formatResult` labels each kind,
 * so "INVALID — key-binding" keeps meaning exactly what it did.
 *
 * NOTE for anyone branching on `reason`: both of those two tokens are ALSO
 * emitted by other adapters under UNVERIFIABLE, where they mean "could not
 * complete". Branch on `verdict` first, then `reason`.
 */
export function invalid(
  format: string,
  reason: Extract<
    ReasonCode,
    | "signature_invalid"
    | "key_binding_mismatch"
    | "content_commitment_mismatch"
    | "chain_linkage_broken"
    | "expired"
    | "malformed_member"
  >,
  detail: string,
  resolvedKey: ResolvedKey,
  stoppedAt?: string,
): VerifyResult {
  return stoppedAt === undefined
    ? { verdict: "INVALID", reason, detail, format, resolvedKey }
    : { verdict: "INVALID", reason, detail, format, resolvedKey, stoppedAt };
}

/**
 * UNVERIFIABLE — fail-closed. The check could not be completed, so no claim is
 * made either way. Deliberately takes no ResolvedKey parameter: there is no way
 * to emit a "verified under key" line from this path.
 *
 * THREE OF THESE REASONS ARE ABOUT A KEY'S VALIDITY WINDOW and a consumer must
 * not collapse them, because two are recoverable and one is not. The union
 * itself lives in `src/types.ts`; the distinction is recorded here, beside the
 * constructor that emits all three:
 *
 *  - `expired` / `not_yet_valid` — the key's window does not contain the
 *    instant the CALLER asked about (`--now`). Naming a different instant can
 *    change the answer, and the detail says so.
 *  - `signed_outside_key_window` — the key's window does not contain the
 *    ARTEFACT'S OWN instant (`signedAt`, else the signed `executedAt`/
 *    `checkedAt`). No `--now` changes that: it is a fact about the two
 *    documents, not about when they were read. Added for
 *    insight.attestation/eip712, where the registry publishes per-key windows
 *    and the artefact publishes its own instant, so the pair is checkable.
 */
export function unverifiable(
  format: string,
  reason: ReasonCode,
  detail: string,
  annotations?: Record<string, string | number | boolean>,
  stoppedAt?: string,
): VerifyResult {
  const base: VerifyResult = { verdict: "UNVERIFIABLE", reason, detail, format };
  if (annotations !== undefined) base.annotations = annotations;
  if (stoppedAt !== undefined) base.stoppedAt = stoppedAt;
  return base;
}

/**
 * Output-shaping options. These NEVER reach an adapter and never influence a
 * verdict — they decide what the caller is told, not what was established.
 */
export interface OutputOptions {
  /**
   * Opt-in delivery gate (`--require-delivery`). Off by default, so the
   * published contract is unchanged for every existing caller.
   */
  requireDelivery?: boolean;
}

export interface DeliveryGate {
  required: true;
  /**
   * The delivery state actually observed: "proven" | "unproven" | "none", or
   * null when the result carries no delivery state at all — a format that has
   * no delivery concept, or a verdict that never reached one.
   */
  observed: string | null;
  satisfied: boolean;
  /** Stable token naming why the gate did not pass. Absent when satisfied. */
  reason?: "delivery_unproven" | "no_payment_claim" | "no_delivery_state";
}

/**
 * Evaluate the opt-in gate. Null when the caller did not ask for it — one
 * field to test, never a probe for absence.
 *
 * SATISFIED ONLY BY "proven". A caller passing --require-delivery is asserting
 * "I paid for this; show me something was delivered". Two states fail it:
 *
 *  - "unproven" — a payment was referenced and no output was committed to.
 *    Settled-but-nothing-delivered, the outcome this exists to catch.
 *  - "none" — no payment claim at all. This is the DIVERGENCE FROM CHIRINDO,
 *    which exits 0 here because its flag is the inverse (strict by default,
 *    `--allow-unproven-delivery` relaxes). A receipt that never claimed a
 *    payment has not proven a delivery, and answering 0 to a caller who
 *    explicitly demanded delivery proof would be the fail-open this flag was
 *    added to remove. A caller verifying an ordinary receipt simply does not
 *    pass the flag.
 */
export function deliveryGate(r: VerifyResult, opts: OutputOptions = {}): DeliveryGate | null {
  if (opts.requireDelivery !== true) return null;
  const raw = r.annotations?.["delivery"];
  const observed = typeof raw === "string" ? raw : null;
  if (observed === "proven") return { required: true, observed, satisfied: true };
  const reason =
    observed === "unproven"
      ? "delivery_unproven"
      : observed === "none"
        ? "no_payment_claim"
        : "no_delivery_state";
  return { required: true, observed, satisfied: false, reason };
}

/**
 * VALID exits 0. INVALID and UNVERIFIABLE both exit 1.
 *
 * With `--require-delivery`, a VALID receipt that does not prove delivery also
 * exits 1. The VERDICT is untouched — the receipt did verify, and saying
 * otherwise would be a false statement about the bytes. Only the status moves,
 * which is what a gate is: the caller's policy, applied to a fact this tool
 * established but does not itself judge.
 */
export function exitCodeFor(r: VerifyResult, opts: OutputOptions = {}): 0 | 1 {
  if (r.verdict !== "VALID") return 1;
  const gate = deliveryGate(r, opts);
  return gate !== null && !gate.satisfied ? 1 : 0;
}

/**
 * Which kind of determinate negative an INVALID is. The four original reasons
 * are key-binding failures and keep that label verbatim; the two added for
 * insight.attestation/eip712 are not, and saying so is cheaper than letting the
 * header make a claim the reason does not support.
 */
function invalidKind(reason: ReasonCode): string {
  if (reason === "expired") return "validity window";
  if (reason === "malformed_member") return "self-inconsistent";
  return "key-binding";
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
export function formatResult(r: VerifyResult, opts: OutputOptions = {}): string {
  const head = r.verdict === "INVALID" ? `INVALID — ${invalidKind(r.reason)}: ${r.detail}` : `${r.verdict} — ${r.detail}`;
  const lines = [head, `format: ${r.format}`, `reason: ${r.reason}`];
  if (r.resolvedKey) lines.push(keyLine(r.resolvedKey, r.verdict));
  const gate = deliveryGate(r, opts);
  if (r.annotations) {
    for (const [k, v] of Object.entries(r.annotations)) {
      // Two annotations could be mistaken for this tool's decision, so each
      // says what it is not. `delivery` names the exit code explicitly: a
      // reader who sees UNPROVEN next to a zero status must not read the
      // status as agreement.
      //
      // The disclaimer INVERTS under --require-delivery: with the gate on, the
      // exit code IS keyed to this value, and a line still claiming otherwise
      // would be the tool lying about its own status.
      const note =
        k === "receipt_gate"
          ? " (the issuer's recorded gate value, not a decision by this tool)"
          : k === "delivery"
            ? gate === null
              ? " (recomputed from the signed bytes; does NOT move the verdict or the exit code)"
              : " (recomputed from the signed bytes; never moves the verdict — --require-delivery is gating the EXIT CODE on it)"
            : "";
      lines.push(`annotation: ${k}=${String(v)}${note}`);
    }
  }

  // The gate line exists so "VALID" next to a non-zero status is never a
  // mystery. It says which of the two is the caller's own policy.
  if (gate !== null) {
    lines.push(
      gate.satisfied
        ? `delivery gate: SATISFIED (delivery=proven, required by --require-delivery)`
        : `delivery gate: NOT SATISFIED (${gate.reason}, delivery=${gate.observed ?? "absent"}) — ` +
            `--require-delivery forces exit 1; the receipt itself is still ${r.verdict}`,
    );
  }

  // A refusal says which checks it did NOT get to. Without this, a reader has
  // no way to tell a check that ran and passed from one that never ran — and
  // reading a refusal as "everything before it was fine" is exactly the
  // inference that hid comp-r04's unevaluated recompute.
  const missed = checksNotEvaluated(r.format, r.stoppedAt);
  if (missed.length > 0) {
    if (r.stoppedAt) lines.push(`stopped at: ${r.stoppedAt}`);
    for (const m of groupByReason(missed)) lines.push(`not evaluated (${m.reason}): ${m.ids.join(", ")}`);
  }
  return lines.join("\n");
}

function groupByReason(missed: NotEvaluated[]): { reason: string; ids: string[] }[] {
  const order: NotEvaluated["reason"][] = ["not_reached", "not_implemented"];
  return order
    .map((reason) => ({ reason, ids: missed.filter((m) => m.reason === reason).map((m) => m.id) }))
    .filter((g) => g.ids.length > 0);
}

/** Stable JSON rendering. This is the agent-facing surface. */
export function jsonResult(r: VerifyResult, opts: OutputOptions = {}): string {
  return JSON.stringify(
    {
      schema: "receipt-verify/verdict/0",
      verdict: r.verdict,
      reason: r.reason,
      format: r.format,
      detail: r.detail,
      resolved_key: r.resolvedKey ?? null,
      annotations: r.annotations ?? {},
      // Always present, like resolved_key: a caller reads one field rather than
      // probing for absence. `stopped_at` is null exactly when evaluation ran
      // to the end of the format's checks.
      coverage: {
        stopped_at: r.stoppedAt ?? null,
        checks_not_evaluated: checksNotEvaluated(r.format, r.stoppedAt),
      },
      // Null unless --require-delivery was passed. Without this field, a
      // `verdict: "VALID"` carrying `exit_code: 1` is unexplainable from the
      // JSON alone — an agent would have to parse `detail` prose to learn that
      // the status came from its own policy and not from the receipt. Adding a
      // field is additive; `verdict`, `reason` and `exit_code` are unchanged
      // for every caller that does not pass the flag.
      delivery_gate: deliveryGate(r, opts),
      exit_code: exitCodeFor(r, opts),
    },
    null,
    2,
  );
}
