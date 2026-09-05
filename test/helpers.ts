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

/**
 * The post-rotation pins, taken at 17:41Z — six minutes after
 * `insight-oracle-safety-v2`'s `validUntil` (2026-09-02T17:35:36Z).
 *
 * The registry file is BYTE-IDENTICAL to the 15:45Z pin (same sha256, same
 * 17,019 bytes): the registry does not change on expiry, it keeps the retired
 * key listed with a past `validUntil` and `revoked: false`, which its own
 * `key_rotation_policy` calls retaining the prior key for overlap. Both copies
 * are kept because the HOUR is the evidence — one pin cannot say that the bytes
 * were the same before and after the rotation instant, two can.
 *
 * The sample is a genuinely fresh fetch (signed 17:42:03.934Z) and differs from
 * the 15:46Z one.
 */
export const INSIGHT_REGISTRY_1741 = join(dirname(FIX), "refs", "insight-oracle-keys-2026-09-02T1741Z.json");
export const INSIGHT_SAMPLE_1741 = join(INSIGHT, "execution-sample-2026-09-02T1741Z.json");

/** The two production keys the 15:45Z / 17:41Z registry lists, by address. */
export const INSIGHT_KEY_V2 = "0xa268676C85b927D64a4e2384636874f76D69e419";
export const INSIGHT_KEY_202609 = "0x6506F789Edd43338A416f59822A63F309f97E8ce";

/**
 * Two evaluation instants that straddle the v2 key's `validUntil`
 * (1788370536 = 2026-09-02T17:35:36Z): 17:41:40Z, when the pin was taken and the
 * window had closed 364 seconds earlier, and 15:30:00Z, when it was open.
 */
export const INSIGHT_NOW_1741 = 1788370900;
export const INSIGHT_NOW_1530 = 1788363000;

/**
 * The 2026-09-05T18:29Z registry pin — the fifth pin of the same URL, and the
 * first that is not one of the two digests the 2 September pins carry. It adds
 * a THIRD key, `insight-oracle-safety-sample`, carrying members no earlier pin
 * published: `role: "sample"` and a `note`. Both sample endpoints the registry
 * names now sign with it.
 *
 * The two sample files are the endpoint responses byte-exact, wrapper and all.
 * No derived attestation file is pinned beside them, unlike the 15:46Z pair:
 * the cases below read `data.attestation` out of the wrapper, which is a tighter
 * relation than a second file that could drift from its parent.
 *
 * These endpoints mint a fresh signature per call, so these bytes are one
 * observation and can never be re-fetched — which is why they are pinned rather
 * than checked live, and why `fixtures/upstreams.json` carries no drift entry
 * for either.
 */
export const INSIGHT_REGISTRY_0905 = join(dirname(FIX), "refs", "insight-oracle-keys-2026-09-05T1829Z.json");
export const INSIGHT_EXEC_SAMPLE_0905 = join(INSIGHT, "execution-sample-2026-09-05T1830Z.json");
export const INSIGHT_SAFETY_SAMPLE_0905 = join(INSIGHT, "safety-sample-2026-09-05T1830Z.json");

/** The third published key, by address: `insight-oracle-safety-sample`, role "sample". */
export const INSIGHT_KEY_SAMPLE = "0xa41d5Ee795d95B87B3AA988150fC2d5e5fE5A534";

/**
 * The instant the 18:29Z registry was fetched (2026-09-05T18:29:05Z, the
 * response's own `Date` header). Inside the sample key's window, which opens
 * 2026-09-03, and 2,614,409 s past `insight-oracle-safety-v2`'s validUntil.
 */
export const INSIGHT_NOW_0905 = 1788632945;
