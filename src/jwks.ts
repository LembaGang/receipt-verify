// JWKS loading and kid resolution.
//
// Public key material only. There is deliberately no code path in this file —
// or anywhere in this tool — that reads a private key, a PEM, or a keyfile.
// The only inputs are JWK Sets: published, public, fetchable by anyone.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { KeyObject } from "node:crypto";
import { type Jwk, publicKeyFromJwk, rfc7638Thumbprint } from "./jws.js";

export interface ResolvedJwk {
  jwk: Jwk;
  key: KeyObject;
  thumbprint: string;
  origin: string;
}

export type JwksResolveFailure =
  | { kind: "not_found"; kid: string; origin: string }
  | { kind: "duplicate_kid"; kid: string; origin: string }
  | { kind: "malformed"; origin: string; message: string }
  | { kind: "unsupported_key"; kid: string; origin: string; message: string };

export type JwksResolveResult =
  | { ok: true; value: ResolvedJwk }
  | { ok: false; error: JwksResolveFailure };

function parseJwks(text: string, origin: string): Jwk[] | JwksResolveFailure {
  let doc: unknown;
  try {
    doc = JSON.parse(text);
  } catch (e) {
    return { kind: "malformed", origin, message: (e as Error).message };
  }
  if (doc === null || typeof doc !== "object" || !Array.isArray((doc as { keys?: unknown }).keys)) {
    return { kind: "malformed", origin, message: "no `keys` array" };
  }
  return (doc as { keys: Jwk[] }).keys;
}

/**
 * Resolve `kid` across one or more JWKS sources.
 *
 * Two keys sharing a kid is a refusal, not a pick-first: an ambiguous key
 * identifier means the verifier cannot say which key the issuer meant, and
 * guessing is how a substituted key gets accepted.
 */
export function resolveKid(sources: JwksSource[], kid: string): JwksResolveResult {
  const hits: ResolvedJwk[] = [];
  for (const src of sources) {
    const keys = parseJwks(src.text, src.origin);
    if (!Array.isArray(keys)) {
      // A file the caller named explicitly must BE a JWKS — saying nothing
      // about a path someone pointed at is how a typo becomes "key not found".
      // A file merely swept up from a directory may be anything, so it is
      // skipped rather than fatal.
      if (src.strict) return { ok: false, error: keys };
      continue;
    }
    for (const jwk of keys) {
      if (jwk.kid !== kid) continue;
      if (jwk.use !== undefined && jwk.use !== "sig") continue;
      try {
        hits.push({
          jwk,
          key: publicKeyFromJwk(jwk),
          thumbprint: rfc7638Thumbprint(jwk),
          origin: src.origin,
        });
      } catch (e) {
        return {
          ok: false,
          error: { kind: "unsupported_key", kid, origin: src.origin, message: (e as Error).message },
        };
      }
    }
  }
  if (hits.length === 0) {
    return {
      ok: false,
      error: { kind: "not_found", kid, origin: sources.map((s) => s.origin).join(", ") || "(no source)" },
    };
  }
  if (hits.length > 1) {
    // Same key material published twice under one kid is benign; different
    // material is not, and only the second case is worth refusing.
    const distinct = new Set(hits.map((h) => h.thumbprint));
    if (distinct.size > 1) {
      return {
        ok: false,
        error: { kind: "duplicate_kid", kid, origin: hits.map((h) => h.origin).join(", ") },
      };
    }
  }
  return { ok: true, value: hits[0]! };
}

export interface JwksSource {
  origin: string;
  text: string;
  /** True when the caller named this file directly, so it must parse as a JWKS. */
  strict: boolean;
}

/**
 * Load JWKS sources from a path: a single .json file, or a directory whose
 * *.json files are each treated as a JWK Set. The directory form is how a
 * snapshot of several issuers' published keys is consumed offline.
 */
export function loadJwksFromPath(path: string): JwksSource[] {
  const st = statSync(path);
  if (st.isDirectory()) {
    return readdirSync(path)
      .filter((f) => f.toLowerCase().endsWith(".json"))
      .sort()
      .map((f) => ({ origin: join(path, f), text: readFileSync(join(path, f), "utf8"), strict: false }));
  }
  return [{ origin: path, text: readFileSync(path, "utf8"), strict: true }];
}

/**
 * Fetch a published JWKS over HTTPS. Used only by the explicitly-marked live
 * integration test and by an operator who passes an https URL on the CLI; the
 * test suite proper reads snapshots.
 *
 * HTTPS only: a JWKS fetched over plaintext is not published trust material.
 */
export async function fetchJwks(url: string, timeoutMs = 5000): Promise<JwksSource> {
  if (new URL(url).protocol !== "https:") {
    throw new Error(`JWKS URL must use https: ${url}`);
  }
  const res = await fetch(url, {
    headers: { "user-agent": "receipt-verify/0.1.0-dev", accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return { origin: url, text: await res.text(), strict: true };
}

export function isHttpsUrl(s: string): boolean {
  try {
    return new URL(s).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Resolve whatever the caller passed to `--jwks`: an https URL, a JWKS file, or
 * a directory of them. Adapters go through here so the three cases behave
 * identically everywhere.
 */
export async function loadJwksSources(spec: string): Promise<JwksSource[]> {
  return isHttpsUrl(spec) ? [await fetchJwks(spec)] : loadJwksFromPath(spec);
}
