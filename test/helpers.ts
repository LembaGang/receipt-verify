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
export const DELIVERY = join(FIX, "delivery");

export const INSIGHT = join(FIX, "insight");
export const INSIGHT_PKG = join(INSIGHT, "execution-receipt-bytes-2026-09-02.json");
export const INSIGHT_REGISTRY = join(dirname(FIX), "refs", "insight-oracle-keys-2026-09-02.json");

/**
 * The 09:53Z repaired package (schema v3) and the second registry pin, taken at
 * 11:54Z. Both live beside the 06:08Z package and the 09:09Z pin rather than
 * replacing them: the tool has to verify all of them and say which is which, so
 * the superseded bytes stay in the suite.
 */
export const INSIGHT_PKG_V3 = join(INSIGHT, "execution-receipt-bytes-2026-09-02-repaired.headless.json");
export const INSIGHT_REGISTRY_1154 = join(dirname(FIX), "refs", "insight-oracle-keys-2026-09-02T1154Z.json");

/**
 * One second after the package's `executedAt`, so it sits inside the validity
 * window of all three artefacts (the gates close at 1788328169, the receipt at
 * 1788328199). Pinned, because every one of them had already expired by the time
 * the package was read — which is itself asserted, at `validUntil + 1`.
 */
export const INSIGHT_NOW = 1788327600;

/**
 * Seven seconds after the repaired package's `executedAt` (1788342803), inside
 * the window of all three of its artefacts (the gates close at 1788343373, the
 * receipt at 1788343403). Pinned for the same reason INSIGHT_NOW is: all three
 * had expired long before the bytes were read.
 */
export const INSIGHT_V3_NOW = 1788342810;

/**
 * The Asqav SDK conformance vectors at commit 05c1c49, the commit
 * draft-marques-asqav-compliance-receipts-08 pins in its [ASQAV-SDK] reference.
 * Extracted with `git cat-file blob`, not copied from a checkout: core.autocrlf
 * is true on this machine and a checkout rewrites the bytes the digests pin.
 * Provenance and per-file digests are in fixtures/provenance.md.
 */
export const ASQAV_05C1C49 = join(FIX, "asqav", "05c1c49");

/**
 * The domain-repaired package (schema v4, 44 signed fields), the 15:45Z registry
 * pin that publishes ExecutionReceipt v4, and the production sample pinned at
 * 15:46Z. The sample is kept both as the endpoint returned it -- wrapper and all,
 * because the wrapper is where the SYNTHETIC label lives and that is the point of
 * H8 -- and as the bare attestation object the adapter reads.
 */
export const INSIGHT_PKG_V4 = join(INSIGHT, "execution-receipt-bytes-2026-09-02-v4.json");
export const INSIGHT_REGISTRY_1545 = join(dirname(FIX), "refs", "insight-oracle-keys-2026-09-02T1545Z.json");
export const INSIGHT_SAMPLE_1546 = join(INSIGHT, "execution-sample-2026-09-02T1546Z.json");
export const INSIGHT_SAMPLE_ATTESTATION_1546 = join(INSIGHT, "execution-sample-attestation-2026-09-02T1546Z.json");

/**
 * Eleven seconds after the v4 receipt's `executedAt` (1788361979), inside its
 * 600-second window. Pinned for the same reason the other two instants are: the
 * window had closed long before these bytes were read.
 */
export const INSIGHT_V4_NOW = 1788361990;

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
