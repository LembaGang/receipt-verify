import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export const FIX = join(ROOT, "fixtures");
export const EVIDENCE = join(FIX, "evidence-action");
export const VSTATE = join(FIX, "verification-state");
export const SYNTH = join(VSTATE, "synthetic");
export const COMPOSED = join(VSTATE, "spec-examples", "v0.3-composed");
export const MAPPINGS = join(VSTATE, "mappings");
export const THROWAWAY_JWKS = join(FIX, "keys", "test-throwaway-ed25519.jwks.json");

export const ACTA = join(FIX, "acta");
export const ACTA_SYNTH = join(ACTA, "synthetic");
export const ACTA_PUB = join(ACTA, "published");
export const ACTA_JWKS = join(ACTA, "keys", "acta-throwaway.jwks.json");
export const REFS = join(ROOT, "refs");

/**
 * One hour after the latest synthetic ACTA receipt's `issued_at`. Pinned so the
 * reported receipt age never depends on the wall clock.
 */
export const ACTA_NOW = Math.floor(Date.parse("2026-06-28T13:00:00Z") / 1000);

export function read(path: string): Buffer {
  return readFileSync(path);
}

export function sha256Hex(b: Uint8Array): string {
  return createHash("sha256").update(b).digest("hex");
}

/**
 * Flip one bit of one byte at `index`. Used to prove that a single-byte change
 * anywhere in a signed member moves the verdict off VALID.
 */
export function flipByte(bytes: Uint8Array, index: number): Buffer {
  const out = Buffer.from(bytes);
  out[index] = out[index]! ^ 0x01;
  return out;
}

/** Replace the first occurrence of `needle` in a UTF-8 buffer. */
export function replaceInBytes(bytes: Uint8Array, needle: string, replacement: string): Buffer {
  const text = Buffer.from(bytes).toString("utf8");
  if (!text.includes(needle)) throw new Error(`fixture does not contain ${JSON.stringify(needle)}`);
  return Buffer.from(text.replace(needle, replacement), "utf8");
}

/** Pinned evaluation instant so exp/nbf assertions never depend on the wall clock. */
export const FIXED_NOW = 1780000000; // 2026-05-29T09:46:40Z
