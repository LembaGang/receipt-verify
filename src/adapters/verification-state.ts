// Adapter: the verification.* family, per draft-krausz-verification-state-01.
// A copy of the -01 text is in refs/; section references below are to it.
//
// Two payload profiles are recognised:
//
//   flat      — the claim set of §4.2 at the payload top level. This is the
//               profile §4.3 is written against and the one the eight-step
//               protocol applies to unmodified.
//   composed  — `envelope_kind: "verification.v0.3+composed"`, the shape the
//               published fixtures actually use: several issuers co-signing one
//               canonical payload, each contributing a sibling leg. §4.3 is
//               applied per leg, then the AND_PRESENT composition is recomputed.
//
// No published fixture uses the flat profile; see FINDINGS.md.

import { createHash } from "node:crypto";
import { jcs, jcsBytes } from "@headlessoracle/chirindo/dist/vendor/recorder/index.js";
import type { Adapter, ResolvedKey, VerifyOptions, VerifyResult } from "../types.js";
import { invalid, unverifiable, valid } from "../verdict.js";
import { loadJwksSources, resolveKid, type JwksSource } from "../jwks.js";
import {
  JwsParseError,
  b64uDecode,
  isSupportedAlg,
  isUnencodedPayload,
  parseJws,
  unencodedPayloadIsWellFormed,
  verifySignature,
  type JwsSignature,
  type ParsedJws,
} from "../jws.js";
import { normalizeDigest, recompute, resolveMapping, type Gate } from "../mapping.js";

export const FORMAT = "verification.*";
export const COMPOSED_ENVELOPE = "verification.v0.3+composed";

const DEFAULT_CLOCK_TOLERANCE_SEC = 60;

/**
 * Shape probe. Conservative: a JWS envelope alone is not enough, because plenty
 * of formats are JWS. We require the decoded payload to name itself — either
 * the §4.2 claim set or the composed envelope kind.
 */
export function detect(bytes: Uint8Array): boolean {
  let parsed: ParsedJws;
  try {
    parsed = parseJws(bytes);
  } catch {
    return false;
  }
  if (parsed.payloadB64 === null) return false;
  try {
    const p = JSON.parse(b64uDecode(parsed.payloadB64).toString("utf8")) as Record<string, unknown>;
    return typeof p["v_verdict"] === "string" || p["envelope_kind"] === COMPOSED_ENVELOPE;
  } catch {
    return false;
  }
}

// --------------------------------------------------------------------------
// payload resolution
// --------------------------------------------------------------------------

type PayloadResolution =
  | { ok: true; bytes: Uint8Array; detached: boolean; canonicalized: boolean }
  | { ok: false; detail: string };

function resolvePayload(parsed: ParsedJws, opts: VerifyOptions): PayloadResolution {
  const b64False = parsed.signatures.some(isUnencodedPayload);

  if (opts.detachedPayload !== undefined) {
    if (opts.canonicalizePayload) {
      let obj: unknown;
      try {
        obj = JSON.parse(Buffer.from(opts.detachedPayload).toString("utf8"));
      } catch (e) {
        return { ok: false, detail: `detached payload is not JSON, cannot canonicalize: ${(e as Error).message}` };
      }
      return { ok: true, bytes: Buffer.from(jcs(obj), "utf8"), detached: true, canonicalized: true };
    }
    return { ok: true, bytes: opts.detachedPayload, detached: true, canonicalized: false };
  }

  if (parsed.payloadB64 === null) {
    return { ok: false, detail: "receipt is detached (no payload member) and no payload was supplied (--payload)" };
  }

  // RFC 7797: with b64:false the payload member carries the raw octets, not
  // base64url. Decoding it as base64url would silently produce the wrong
  // signing input and a spurious signature failure.
  if (b64False) {
    return { ok: true, bytes: Buffer.from(parsed.payloadB64, "utf8"), detached: false, canonicalized: false };
  }
  try {
    return { ok: true, bytes: b64uDecode(parsed.payloadB64), detached: false, canonicalized: false };
  } catch {
    return { ok: false, detail: "payload member is not base64url" };
  }
}

// --------------------------------------------------------------------------
// signature verification (§4.3 step 1)
// --------------------------------------------------------------------------

type SigOutcome =
  | { kind: "ok"; key: ResolvedKey }
  | { kind: "bad_signature"; key: ResolvedKey }
  | { kind: "unverifiable"; detail: string };

function verifyOne(sig: JwsSignature, payload: Uint8Array, sources: JwksSource[]): SigOutcome {
  const alg = sig.header["alg"];
  if (!isSupportedAlg(alg)) {
    return { kind: "unverifiable", detail: `unsupported or missing alg ${JSON.stringify(alg)} (this tool accepts EdDSA and ES256 per §4.1)` };
  }
  if (!unencodedPayloadIsWellFormed(sig)) {
    return { kind: "unverifiable", detail: 'protected header sets b64:false without listing "b64" in crit (RFC 7797 §3)' };
  }
  const kid = sig.header["kid"];
  if (typeof kid !== "string") {
    return { kind: "unverifiable", detail: "protected header has no `kid`; §4.1 requires one that resolves in the issuer's published JWKS" };
  }

  const resolved = resolveKid(sources, kid);
  if (!resolved.ok) {
    const e = resolved.error;
    const detail =
      e.kind === "not_found"
        ? `no key for kid ${kid} in ${e.origin}`
        : e.kind === "duplicate_kid"
          ? `more than one distinct key for kid ${kid} in ${e.origin}`
          : e.kind === "unsupported_key"
            ? `key for kid ${kid} at ${e.origin} is unsupported: ${e.message}`
            : `malformed JWKS at ${e.origin}: ${e.message}`;
    return { kind: "unverifiable", detail };
  }

  const key: ResolvedKey = {
    kid,
    thumbprint: resolved.value.thumbprint,
    alg,
    origin: resolved.value.origin,
  };
  return verifySignature(sig, payload, resolved.value.key, alg)
    ? { kind: "ok", key }
    : { kind: "bad_signature", key };
}

// --------------------------------------------------------------------------
// §4.3 steps 2-6, applied to one claim set
// --------------------------------------------------------------------------

interface LegClaims {
  label: string;
  v_verdict: string;
  v_confidence: number;
  v_adversarial_result: string;
  v_recommendation: string;
  v_gate: string;
  mapping_id: string;
  mapping_hash: string;
}

type LegOutcome =
  | { ok: true; gate: Gate }
  | {
      ok: false;
      reason: "mapping_unresolvable" | "mapping_hash_mismatch" | "recompute_mismatch" | "malformed_member";
      detail: string;
      /** The §4.3 step that refused. Reported so a caller knows how far the check got. */
      step: number;
    };

function checkLeg(leg: LegClaims, mappingDir: string | undefined): LegOutcome {
  // Step 2 — resolve the mapping and confirm the content binding.
  const m = resolveMapping(mappingDir, leg.mapping_id, leg.mapping_hash);
  if (!m.ok) {
    const e = m.error;
    if (e.kind === "hash_mismatch") {
      return {
        ok: false,
        reason: "mapping_hash_mismatch",
        step: 2,
        detail: `${leg.label}: mapping ${e.mappingId} at ${e.origin} digests to ${e.actual}, receipt binds ${e.expected}`,
      };
    }
    if (e.kind === "malformed") {
      return { ok: false, reason: "malformed_member", step: 2, detail: `${leg.label}: mapping ${e.mappingId} at ${e.origin}: ${e.message}` };
    }
    return {
      ok: false,
      reason: "mapping_unresolvable",
      step: 2,
      detail: `${leg.label}: mapping ${e.mappingId} not resolvable (searched ${e.searched})`,
    };
  }

  // Steps 3-4 — recompute the recommendation and confirm it.
  const rc = recompute(m.value.doc, {
    v_verdict: leg.v_verdict,
    v_confidence: leg.v_confidence,
    v_adversarial_result: leg.v_adversarial_result,
  });
  if (!rc.ok) return { ok: false, reason: "recompute_mismatch", step: 3, detail: `${leg.label}: ${rc.message}` };
  if (rc.recommendation !== leg.v_recommendation) {
    return {
      ok: false,
      reason: "recompute_mismatch",
      step: 4,
      detail: `${leg.label}: recomputed v_recommendation ${rc.recommendation}, receipt signed ${leg.v_recommendation}`,
    };
  }

  // Steps 5-6 — derive the gate and confirm it.
  if (rc.gate !== leg.v_gate) {
    return {
      ok: false,
      reason: "recompute_mismatch",
      step: 6,
      detail: `${leg.label}: recomputed gate ${rc.gate} from ${rc.recommendation}, receipt signed ${leg.v_gate}`,
    };
  }
  return { ok: true, gate: rc.gate };
}

// --------------------------------------------------------------------------
// §4.3 step 7 — exp / nbf
// --------------------------------------------------------------------------

type TimeOutcome = { ok: true } | { ok: false; reason: "expired" | "not_yet_valid" | "malformed_member"; detail: string };

function checkTimes(payload: Record<string, unknown>, opts: VerifyOptions, expRequired: boolean): TimeOutcome {
  const now = opts.now ?? Math.floor(Date.now() / 1000);
  const tol = opts.clockToleranceSec ?? DEFAULT_CLOCK_TOLERANCE_SEC;
  const exp = payload["exp"];
  const nbf = payload["nbf"];

  if (exp === undefined) {
    if (expRequired) {
      return { ok: false, reason: "malformed_member", detail: "payload has no `exp`; §4.2 makes it REQUIRED" };
    }
  } else if (typeof exp !== "number") {
    return { ok: false, reason: "malformed_member", detail: `exp is ${JSON.stringify(exp)}, expected a NumericDate` };
  } else if (now > exp + tol) {
    return {
      ok: false,
      reason: "expired",
      detail: `expired at ${new Date(exp * 1000).toISOString()} (now ${new Date(now * 1000).toISOString()}, tolerance ${tol}s)`,
    };
  }

  if (nbf !== undefined) {
    if (typeof nbf !== "number") {
      return { ok: false, reason: "malformed_member", detail: `nbf is ${JSON.stringify(nbf)}, expected a NumericDate` };
    }
    if (now + tol < nbf) {
      return {
        ok: false,
        reason: "not_yet_valid",
        detail: `not valid before ${new Date(nbf * 1000).toISOString()} (now ${new Date(now * 1000).toISOString()}, tolerance ${tol}s)`,
      };
    }
  }
  return { ok: true };
}

// --------------------------------------------------------------------------
// profile extraction
// --------------------------------------------------------------------------

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function str(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

/** Pull the flat §4.2 claim set. Returns a message naming the first missing or ill-typed member. */
function flatLeg(p: Record<string, unknown>): LegClaims | string {
  const v_verdict = str(p["v_verdict"]);
  const v_confidence = num(p["v_confidence"]);
  const v_adversarial_result = str(p["v_adversarial_result"]);
  const v_recommendation = str(p["v_recommendation"]);
  const v_gate = str(p["v_gate"]);
  const mapping_id = str(p["v_gate_mapping"]);
  const mapping_hash = str(p["v_gate_mapping_hash"]);

  if (v_verdict === null) return "v_verdict missing or not a string";
  if (v_confidence === null) return "v_confidence missing or not a number";
  if (v_confidence < 0 || v_confidence > 1) return `v_confidence ${v_confidence} is outside [0, 1]`;
  if (v_adversarial_result === null) return "v_adversarial_result missing or not a string";
  if (v_recommendation === null) return "v_recommendation missing or not a string";
  if (v_gate === null) return "v_gate missing or not a string";
  if (v_gate !== "act" && v_gate !== "halt") return `v_gate is ${JSON.stringify(v_gate)}, expected "act" or "halt"`;
  if (mapping_id === null) return "v_gate_mapping missing or not a string";
  // §4.2: the absence of v_gate_mapping_hash is explicitly a malformed-receipt
  // condition, so it is called out separately from the other missing members.
  if (mapping_hash === null) return "v_gate_mapping_hash missing; §4.2 makes its absence a malformed-receipt condition";
  if (normalizeDigest(mapping_hash) === null) return `v_gate_mapping_hash ${JSON.stringify(mapping_hash)} is not a SHA-256 hex digest`;

  return { label: "payload", v_verdict, v_confidence, v_adversarial_result, v_recommendation, v_gate, mapping_id, mapping_hash };
}

/**
 * Pull the §4.2 triple out of a composed sibling leg. Only the `v_gate` leg
 * carries it; `v_gate_skill` and `screen_ref` carry issuer-specific evidence
 * and only a verdict, so they contribute to the composition but have no §4.3
 * recompute of their own.
 */
function composedGateLeg(o: Record<string, unknown>): LegClaims | string | null {
  if (num(o["v_confidence"]) === null) return null;
  const v_verdict = str(o["v_verdict"]);
  const v_confidence = num(o["v_confidence"])!;
  const v_adversarial_result = str(o["v_adversarial_result"]);
  const v_recommendation = str(o["v_recommendation"]);
  const verdict = str(o["verdict"]);
  const mapping_id = str(o["mapping_id"]) ?? str(o["v_gate_mapping"]);
  const mapping_hash = str(o["v_gate_mapping_hash"]);

  if (v_adversarial_result === null) return "v_gate.v_adversarial_result missing or not a string";
  if (v_recommendation === null) return "v_gate.v_recommendation missing or not a string";
  if (verdict === null || (verdict !== "act" && verdict !== "halt")) return `v_gate.verdict is ${JSON.stringify(verdict)}, expected "act" or "halt"`;
  if (mapping_id === null) return "v_gate.mapping_id missing or not a string";
  if (mapping_hash === null) return "v_gate.v_gate_mapping_hash missing; §4.2 makes its absence a malformed-receipt condition";

  return {
    label: "v_gate",
    // The composed profile omits v_verdict on the leg; the recommendation it
    // signs implies it. Absent an explicit verdict we take "supported", which
    // is the only verdict the *_supported recommendations can derive from.
    v_verdict: v_verdict ?? (v_recommendation.endsWith("supported") || v_recommendation === "un_probed_not_cleared" ? "supported" : v_recommendation),
    v_confidence,
    v_adversarial_result,
    v_recommendation,
    v_gate: verdict,
    mapping_id,
    mapping_hash,
  };
}

/** AND_PRESENT: absent legs abstain; any present-and-halt collapses the composition. */
function andPresent(verdicts: string[]): Gate {
  return verdicts.length > 0 && verdicts.every((v) => v === "act") ? "act" : "halt";
}

// --------------------------------------------------------------------------

export const verificationStateAdapter: Adapter = {
  format: FORMAT,
  detect,

  async verify(bytes: Uint8Array, opts: VerifyOptions): Promise<VerifyResult> {
    let parsed: ParsedJws;
    try {
      parsed = parseJws(bytes);
    } catch (e) {
      const msg = e instanceof JwsParseError ? e.message : (e as Error).message;
      return unverifiable(FORMAT, "malformed_receipt", `not a JWS this tool can read: ${msg}`);
    }

    if (!opts.jwks) {
      return unverifiable(FORMAT, "key_unresolvable", "no JWKS source given (--jwks); §4.1 requires kid to resolve in the issuer's published JWKS");
    }
    let sources: JwksSource[];
    try {
      sources = await loadJwksSources(opts.jwks);
    } catch (e) {
      return unverifiable(FORMAT, "io_error", `could not read JWKS at ${opts.jwks}: ${(e as Error).message}`);
    }

    const pr = resolvePayload(parsed, opts);
    if (!pr.ok) return unverifiable(FORMAT, "malformed_receipt", pr.detail);

    // ---- step 1: every signature present must verify -----------------------
    const keys: ResolvedKey[] = [];
    for (const [i, sig] of parsed.signatures.entries()) {
      const label = parsed.signatures.length > 1 ? `signatures[${i}] ` : "";
      const out = verifyOne(sig, pr.bytes, sources);
      if (out.kind === "unverifiable") return unverifiable(FORMAT, "key_unresolvable", `${label}${out.detail}`);
      if (out.kind === "bad_signature") {
        return invalid(
          FORMAT,
          "signature_invalid",
          `${label}signature does not verify over the ${pr.detached ? (pr.canonicalized ? "JCS-canonicalized detached" : "detached") : "attached"} payload (${parsed.serialization} serialization)`,
          out.key,
        );
      }
      keys.push(out.key);
    }
    // The key named on the verdict line. For a multi-signer envelope this is the
    // first signer; every other signer verified too, or we would not be here.
    const primaryKey = keys[0]!;

    // Past this point step 1 has passed. Every refusal below reports how far
    // the protocol got, so a caller can tell "the signature is bad" apart from
    // "the signature is fine and something downstream could not be completed"
    // WITHOUT that ever becoming a claim that the receipt verified.
    const stalled = (reason: Parameters<typeof unverifiable>[1], detail: string, step: number): VerifyResult =>
      unverifiable(FORMAT, reason, detail, {
        jws_signature_check: "passed",
        signers_verified: keys.length,
        failed_at_step: step,
      });

    // ---- payload ----------------------------------------------------------
    let payload: Record<string, unknown>;
    try {
      const o: unknown = JSON.parse(Buffer.from(pr.bytes).toString("utf8"));
      if (o === null || typeof o !== "object" || Array.isArray(o)) throw new Error("payload is not a JSON object");
      payload = o as Record<string, unknown>;
    } catch (e) {
      return stalled("malformed_receipt", `payload is not a JSON object: ${(e as Error).message}`, 2);
    }

    const composed = payload["envelope_kind"] === COMPOSED_ENVELOPE;
    const serializationNote = `${parsed.serialization} serialization, ${pr.detached ? (pr.canonicalized ? "detached payload canonicalized with RFC 8785 JCS" : "detached payload supplied as bytes") : "attached payload"}`;

    // ---- steps 2-6 --------------------------------------------------------
    const legs: LegClaims[] = [];
    let composedVerdicts: string[] = [];

    if (composed) {
      // Grammar rule from the fixture suite: a sibling pointer that failed to
      // resolve MUST be absent, never null. An explicit null is a grammar break.
      for (const k of ["mycelium_trail_id", "v_gate", "v_gate_skill", "screen_ref"]) {
        if (k in payload && payload[k] === null) {
          return stalled("malformed_member", `${k} is null; an unresolved sibling pointer MUST be absent, not null`, 2);
        }
      }
      for (const name of ["v_gate", "v_gate_skill", "screen_ref"]) {
        const leg = payload[name];
        if (leg === undefined) continue;
        if (leg === null || typeof leg !== "object") {
          return stalled("malformed_member", `${name} is present but not an object`, 2);
        }
        const v = (leg as Record<string, unknown>)["verdict"];
        if (typeof v !== "string") {
          return stalled("malformed_member", `${name}.verdict missing or not a string`, 2);
        }
        composedVerdicts.push(v);
        if (name === "v_gate") {
          const g = composedGateLeg(leg as Record<string, unknown>);
          if (typeof g === "string") return stalled("malformed_member", g, 2);
          if (g !== null) legs.push(g);
        }
      }
      if (composedVerdicts.length === 0) {
        return stalled("malformed_member", "composed envelope carries no sibling pointer legs", 2);
      }
    } else {
      const leg = flatLeg(payload);
      if (typeof leg === "string") return stalled("malformed_member", leg, 2);
      legs.push(leg);
    }

    for (const leg of legs) {
      const out = checkLeg(leg, opts.mappingDir);
      if (!out.ok) return stalled(out.reason, out.detail, out.step);
    }

    // ---- screen_ref content address (composed profile only) ----------------
    // `action_ref` is an action-ref-v1 content address over the four-field
    // `screen` preimage the block carries: lowercase-hex SHA-256 of its JCS
    // bytes. It is recomputed rather than trusted — an emitted hash taken on
    // faith would let a screen leg claim a screening decision it never derived.
    // Until the mapping document was published this check was unreachable: §4.3
    // step 2 refused first, so comp-r04 was non-VALID for a reason other than
    // the one it exists to test (FINDINGS.md B7).
    if (composed && payload["screen_ref"] !== undefined) {
      const sr = payload["screen_ref"] as Record<string, unknown>;
      const declared = sr["action_ref"];
      const screen = sr["screen"];
      if (declared !== undefined) {
        if (screen === null || typeof screen !== "object" || Array.isArray(screen)) {
          return stalled("malformed_member", "screen_ref.action_ref is present but screen_ref.screen is not an object to recompute it from", 4);
        }
        if (typeof declared !== "string") {
          return stalled("malformed_member", `screen_ref.action_ref is ${JSON.stringify(declared)}, expected a lowercase-hex SHA-256 string`, 4);
        }
        const recomputed = createHash("sha256").update(jcsBytes(screen)).digest("hex");
        if (recomputed !== declared.toLowerCase()) {
          return stalled(
            "recompute_mismatch",
            `screen_ref: action-ref-v1 over the JCS bytes of screen_ref.screen recomputes to ${recomputed}, receipt signed ${declared}`,
            4,
          );
        }
      }
    }

    // ---- composition recompute (composed profile only) ---------------------
    if (composed) {
      const rule = payload["composed_decision_rule"];
      if (rule !== "AND_PRESENT") {
        return stalled("malformed_member", `composed_decision_rule is ${JSON.stringify(rule)}; this tool implements AND_PRESENT only`, 4);
      }
      const signedDecision = payload["composed_decision"];
      const recomputed = andPresent(composedVerdicts);
      if (signedDecision !== recomputed) {
        return stalled(
          "recompute_mismatch",
          `AND_PRESENT over [${composedVerdicts.join(", ")}] recomputes to ${recomputed}, receipt signed ${JSON.stringify(signedDecision)}`,
          4,
        );
      }
    }

    // ---- step 7 -----------------------------------------------------------
    const t = checkTimes(payload, opts, !composed);
    if (!t.ok) return stalled(t.reason, t.detail, 7);

    // ---- step 8 -----------------------------------------------------------
    const gateValue = composed ? String(payload["composed_decision"]) : String(payload["v_gate"]);
    const annotations: Record<string, string | number | boolean> = {
      receipt_gate: gateValue,
      profile: composed ? "verification.v0.3+composed" : "flat (draft §4.2)",
      signers: parsed.signatures.length,
    };
    return valid(
      FORMAT,
      `all §4.3 checks passed (${serializationNote})`,
      primaryKey,
      annotations,
    );
  },
};
