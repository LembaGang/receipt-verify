// Adapter: evidence.action/0 and evidence.action/1.
//
// Verification is delegated to the PUBLISHED npm artifact
// @headlessoracle/chirindo@0.3.0 — not a local checkout. This adapter's job is
// the translation layer: public-key-only key resolution in, and Chirindo's
// five-state result mapped onto this tool's tri-state contract out.

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  runVerify,
  type VerifyResult as ChirindoResult,
} from "@headlessoracle/chirindo/dist/vendor/recorder/index.js";
import type { Adapter, ResolvedKey, VerifyOptions, VerifyResult } from "../types.js";
import { invalid, unverifiable, valid } from "../verdict.js";
import { loadJwksSources, resolveKid } from "../jwks.js";
import { publicKeyFromJwk } from "../jws.js";

export const FORMAT = "evidence.action/0";

/** Shape probe: JSONL whose first line is an object carrying an evidence.action version token. */
export function detect(bytes: Uint8Array): boolean {
  const first = Buffer.from(bytes).toString("utf8").split("\n").find((l) => l.trim().length > 0);
  if (first === undefined) return false;
  try {
    const o = JSON.parse(first) as Record<string, unknown>;
    return typeof o["v"] === "string" && (o["v"] as string).startsWith("evidence.action/");
  } catch {
    return false;
  }
}

function firstKid(bytes: Uint8Array): string | null {
  const first = Buffer.from(bytes).toString("utf8").split("\n").find((l) => l.trim().length > 0);
  if (first === undefined) return null;
  try {
    const o = JSON.parse(first) as Record<string, unknown>;
    return typeof o["kid"] === "string" ? (o["kid"] as string) : null;
  } catch {
    return null;
  }
}

/**
 * Chirindo's verify API takes a chain FILE PATH and a public identity FILE
 * PATH; it has no bytes-in entry point and no JWK-in entry point (see
 * FINDINGS.md). So we materialise both in a scratch directory that is removed
 * before this function returns.
 *
 * The identity file we write contains public material only — the SPKI PEM
 * derived from the published JWK. There is no branch here that could read,
 * write, or require a private key.
 */
interface Scratch {
  dir: string;
  chainPath: string;
  identityPath: string;
}

function materialise(bytes: Uint8Array, jwk: { kid?: string }, pem: string): Scratch {
  const dir = mkdtempSync(join(tmpdir(), "receipt-verify-"));
  const chainPath = join(dir, "chain.jsonl");
  const identityPath = join(dir, "identity.json");
  writeFileSync(chainPath, Buffer.from(bytes));
  writeFileSync(
    identityPath,
    JSON.stringify({ kid: jwk.kid, alg: "ed25519", public_key_pem: pem }, null, 2),
    "utf8",
  );
  return { dir, chainPath, identityPath };
}

/**
 * Map Chirindo's result onto the tri-state contract.
 *
 * The dividing line is whether a published key was resolved AND the receipt was
 * actually checked against it:
 *
 *  - `valid`     -> VALID.
 *  - `tampered`  -> INVALID (key-binding). Every tamper reason Chirindo can
 *    return is a determinate negative against a key we already resolved: the
 *    signed bytes, or a commitment sealed inside them, do not hold. Naming the
 *    key is honest here — the receipt failed against THAT key.
 *  - `invalid`   -> key_binding_mismatch is a determinate negative under a
 *    resolved key, so INVALID. `untrusted_key` and `insecure_jwks_uri` are
 *    refusals to complete the check, so UNVERIFIABLE.
 *  - `empty` / `unverifiable` -> UNVERIFIABLE.
 */
function mapResult(r: ChirindoResult, key: ResolvedKey): VerifyResult {
  switch (r.kind) {
    case "valid":
      return valid(
        FORMAT,
        `${r.count} record(s), chain intact, all signatures verified, session ${r.sessionId}` +
          (r.hasCheckpoint ? ", checkpoint verified" : ""),
        key,
      );
    case "tampered": {
      const reason =
        r.reason === "signature invalid"
          ? "signature_invalid"
          : r.reason === "request_commitment mismatch"
            ? "content_commitment_mismatch"
            : r.reason === "prev_hash linkage broken"
              ? "chain_linkage_broken"
              : "content_commitment_mismatch";
      return invalid(FORMAT, reason, `entry ${r.entry}: ${r.reason}`, key);
    }
    case "invalid":
      if (r.reason === "key_binding_mismatch") {
        return invalid(FORMAT, "key_binding_mismatch", `entry ${r.entry}: ${r.reason}`, key);
      }
      return unverifiable(FORMAT, r.reason === "insecure_jwks_uri" ? "malformed_receipt" : "key_unresolvable", `entry ${r.entry}: ${r.reason}`);
    case "empty":
      return unverifiable(FORMAT, "empty_receipt", "chain contains no records");
    case "unverifiable":
      return unverifiable(FORMAT, "key_unresolvable", r.reason);
  }
}

export const evidenceActionAdapter: Adapter = {
  format: FORMAT,
  detect,

  async verify(bytes: Uint8Array, opts: VerifyOptions): Promise<VerifyResult> {
    if (!opts.jwks) {
      return unverifiable(FORMAT, "key_unresolvable", "no JWKS source given (--jwks); this tool will not verify against an implicit key");
    }
    const kid = firstKid(bytes);
    if (kid === null) {
      return unverifiable(FORMAT, "malformed_receipt", "first record is not a JSON object carrying a `kid`");
    }

    let sources;
    try {
      sources = await loadJwksSources(opts.jwks);
    } catch (e) {
      return unverifiable(FORMAT, "io_error", `could not read JWKS at ${opts.jwks}: ${(e as Error).message}`);
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
      return unverifiable(FORMAT, "key_unresolvable", detail);
    }

    const key: ResolvedKey = {
      kid,
      thumbprint: resolved.value.thumbprint,
      alg: "EdDSA",
      origin: resolved.value.origin,
    };

    let pem: string;
    try {
      pem = publicKeyFromJwk(resolved.value.jwk).export({ format: "pem", type: "spki" }).toString();
    } catch (e) {
      return unverifiable(FORMAT, "key_unresolvable", `key for kid ${kid} is not an Ed25519 public key: ${(e as Error).message}`);
    }

    const scratch = materialise(bytes, resolved.value.jwk, pem);
    try {
      const r = runVerify({
        chainPath: scratch.chainPath,
        identityPath: scratch.identityPath,
        keySource: "flag",
        keyOrigin: resolved.value.origin,
        ...(opts.clockToleranceSec !== undefined ? { maxSkewMs: opts.clockToleranceSec * 1000 } : {}),
      });
      return mapResult(r, key);
    } catch (e) {
      // A parse failure inside the published verifier is a refusal to complete
      // the check, not evidence against the receipt.
      return unverifiable(FORMAT, "malformed_receipt", `@headlessoracle/chirindo could not parse the chain: ${(e as Error).message}`);
    } finally {
      rmSync(scratch.dir, { recursive: true, force: true });
    }
  },
};
