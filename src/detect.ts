// Format auto-detection.
//
// Detection refuses to guess. If zero adapters claim the bytes, or more than
// one does, the caller is told to name the format with --format. An agent that
// gets a wrong-format verdict has no way to notice; an agent that gets
// `format_unrecognized` knows exactly what to supply next.

import type { Adapter } from "./types.js";
import { evidenceActionAdapter } from "./adapters/evidence-action.js";
import { verificationStateAdapter } from "./adapters/verification-state.js";

export const ADAPTERS: Adapter[] = [evidenceActionAdapter, verificationStateAdapter];

export function adapterByFormat(name: string): Adapter | undefined {
  const n = name.toLowerCase();
  if (n === "evidence.action" || n === "evidence.action/0" || n === "evidence-action") {
    return evidenceActionAdapter;
  }
  if (n === "verification" || n === "verification.*" || n === "verification-state") {
    return verificationStateAdapter;
  }
  return undefined;
}

export type DetectOutcome =
  | { ok: true; adapter: Adapter }
  | { ok: false; reason: "none" | "ambiguous"; candidates: string[] };

export function detectFormat(bytes: Uint8Array): DetectOutcome {
  const hits = ADAPTERS.filter((a) => a.detect?.(bytes) === true);
  if (hits.length === 1) return { ok: true, adapter: hits[0]! };
  return {
    ok: false,
    reason: hits.length === 0 ? "none" : "ambiguous",
    candidates: hits.map((h) => h.format),
  };
}

export const FORMAT_NAMES = ["evidence.action", "verification"] as const;
