// evidence_root for draft-krausz-verification-state-02, §4.1.2 and §4.3 step N.
//
// Written from the specification text alone, for CC_HANDOFF_2026-09-07 rev 2.
// The five governing texts are pinned at agentoracle-receipt-spec ac33ad1 and
// summarised in docs/evidence-root-spec-extract.md; every constant below cites
// the sentence it comes from, by short name and line, against that extract.
//
//   base  drafts/evidence-pinning-02-review-draft.md            9832156998ceb35f…
//   rev2  drafts/evidence-pinning-02-amendments-rev2-…          a957802a4ed4d5a4…
//   rev3  drafts/evidence-pinning-02-amendments-rev3-…          d770436219038098…
//   rev4  drafts/evidence-pinning-02-amendments-rev4-…          060fc52c067b5d7d…
//   rev5  drafts/evidence-pinning-02-amendments-rev5-…          1f901fd7d56fcfe9…
//
// No part of the fixture generator or the cross-check was read.

import { createHash } from "node:crypto";

// rev4 l.101 (Finding 15a). The base's "ao-evidence-leaf-v1" is displaced: rev4
// 15b moves the prefix with the widened preimage, because a wider preimage under
// the old label leaves two constructions wearing one name (rev4 l.120-126).
export const LEAF_PREFIX = "ao-evidence-leaf-v2";

// base l.121. rev4 l.127: "ao-evidence-node-v1 is unchanged — the interior-node
// construction is untouched."
export const NODE_PREFIX = "ao-evidence-node-v1";

// rev2 l.152. Named as a closed enumeration by rev4 l.107-108.
export const CONTENT_KINDS = ["snippet", "excerpt", "full_resource"] as const;

// rev3 l.70-73. Two values, not rev2's three: rev3 removed content_not_retained
// (rev3 l.117) because the retention branch put a fact the issuer does not
// control beside a choice it does (rev3 l.26-28).
export const UNPINNED_REASONS = ["no_content_returned", "provider_metadata_only"] as const;

export type ContentKind = (typeof CONTENT_KINDS)[number];

export interface EvidenceEntry {
  url: string;
  snippet_sha256: string | null;
  retrieved_at: string;
  pinned: boolean;
  content_kind?: ContentKind | string | null;
  unpinned_reason?: string | null;
  resource_sha256?: string | null;
}

export interface EvidenceSet {
  evidence_set_version?: string;
  retrieved_at?: string;
  source_count?: number;
  pinned_count?: number;
  fully_pinned?: boolean;
  evidence_root?: string | null;
  sources: EvidenceEntry[];
}

export type Diagnostic =
  | "empty_evidence_set"
  | "source_count_mismatch"
  | "pinned_count_mismatch"
  | "pinned_count_exceeds_source_count"
  | "fully_pinned_inconsistent"
  | "set_retrieved_at_not_earliest"
  | "unpinned_reason_absent"
  | "unpinned_reason_outside_domain"
  | "content_kind_absent_when_pinned"
  | "resource_sha256_with_full_resource"
  | "duplicate_bound_tuple"
  | "root_present_with_zero_pinned"
  | "root_absent_with_pinned_items"
  | "root_mismatch";

export type ValidationResult =
  | { ok: true }
  | { ok: false; diagnostic: Diagnostic; detail: string };

const NUL = Buffer.from([0x00]);

const utf8 = (s: string): Buffer => Buffer.from(s, "utf8");

/**
 * rev4 l.101-103. The four bound members enter as "their UTF-8 bytes as carried
 * in the entry" (rev4 l.105-106), with snippet_sha256 as its 64 lowercase hex
 * characters rather than the 32 raw bytes they represent (rev2 l.166-167).
 * No length prefixes: no bound member may contain 0x00 (rev4 l.106-109).
 */
export function leafHash(entry: EvidenceEntry): Uint8Array {
  if (entry.snippet_sha256 === null || entry.snippet_sha256 === undefined) {
    throw new Error("leafHash: an unpinned entry has no leaf (base l.107, l.110)");
  }
  if (entry.content_kind === null || entry.content_kind === undefined) {
    // rev4 l.235-237: absence makes the leaf uncomputable, which is why the
    // step (a) check exists to name the member first.
    throw new Error("leafHash: content_kind is bound by the preimage (rev4 l.101-103)");
  }
  return createHash("sha256")
    .update(
      Buffer.concat([
        utf8(LEAF_PREFIX),
        NUL,
        utf8(entry.url),
        NUL,
        utf8(entry.snippet_sha256),
        NUL,
        utf8(String(entry.content_kind)),
        NUL,
        utf8(entry.retrieved_at),
      ]),
    )
    .digest();
}

/**
 * base l.121, unchanged through rev 5 (rev4 l.127).
 *
 * `left` and `right` enter as the raw digest octets. No sentence in the corpus
 * states the encoding for the node preimage; the corpus's one hex carve-out is
 * rev2 l.166-167 and is scoped by its own words to "the leaf preimage", where it
 * applies to a member carried in the receipt as a hex string. left and right are
 * computed values that are never carried, so the carve-out does not reach them.
 * See docs/evidence-root-spec-extract.md §2 — this is the single point in the
 * construction where the texts admit a second reading.
 */
export function nodeHash(left: Uint8Array, right: Uint8Array): Uint8Array {
  return createHash("sha256")
    .update(Buffer.concat([utf8(NODE_PREFIX), NUL, Buffer.from(left), NUL, Buffer.from(right)]))
    .digest();
}

/** rev5 l.98-99: "bytewise over the UTF-8 encoding of the member as carried". */
function compareUtf8(a: string, b: string): number {
  return Buffer.compare(utf8(a), utf8(b));
}

/**
 * rev5 l.96-103 (Finding 24c), replacing rev4 l.141-148, which replaced base
 * l.130-133. Four terms: url, then snippet_sha256, then content_kind, then
 * retrieved_at — exactly the members the preimage binds (rev4 l.111-116).
 *
 * Unpinned entries are dropped before sorting: the root is "over the pinned
 * items only. Unpinned items contribute nothing" (base l.107), and the leaf rule
 * runs "for each pinned item" (base l.110).
 */
export function canonicalOrder(sources: readonly EvidenceEntry[]): EvidenceEntry[] {
  return sources
    .filter((e) => e.pinned === true)
    .slice()
    .sort(
      (x, y) =>
        compareUtf8(x.url, y.url) ||
        compareUtf8(x.snippet_sha256 ?? "", y.snippet_sha256 ?? "") ||
        compareUtf8(String(x.content_kind ?? ""), String(y.content_kind ?? "")) ||
        compareUtf8(x.retrieved_at, y.retrieved_at),
    );
}

/**
 * base l.121-140 with rev2 l.171-172.
 *
 * Odd level: the final entry is "promoted unchanged to the next level" and
 * "MUST NOT be duplicated and paired with itself" (base l.124-126), retaining
 * its "rightmost position" at the next level (rev2 l.171-172).
 *
 * Termination is not stated in any of the five texts and is forced by the
 * construction: pairing consumes two and promotion consumes one, so each level
 * is strictly shorter and one value remains. That value is the root, which also
 * makes the single-pinned-item root equal to its leaf, with no node hashing.
 *
 * Zero pinned items yields null: "When pinned_count is zero, evidence_root MUST
 * be null. An implementation MUST NOT emit a root over an empty set."
 * (base l.139-140, preserved by rev4 l.284-285.)
 */
export function computeRoot(sources: readonly EvidenceEntry[]): string | null {
  const ordered = canonicalOrder(sources);
  if (ordered.length === 0) return null;

  let level: Uint8Array[] = ordered.map(leafHash);
  while (level.length > 1) {
    const next: Uint8Array[] = [];
    let i = 0;
    for (; i + 1 < level.length; i += 2) {
      next.push(nodeHash(level[i]!, level[i + 1]!));
    }
    // Odd tail: promoted unchanged, and it stays rightmost.
    if (i < level.length) next.push(level[i]!);
    level = next;
  }
  return Buffer.from(level[0]!).toString("hex");
}

/** Two roots the spec calls identical. Null roots are not "identical" roots. */
export function rootsAgree(a: string | null, b: string | null): boolean {
  return a !== null && b !== null && a === b;
}

/** Two roots the spec calls differing. */
export function rootsDiffer(a: string | null, b: string | null): boolean {
  return a !== null && b !== null && a !== b;
}

const BOUND_TUPLE = (e: EvidenceEntry): string =>
  JSON.stringify([e.url, e.snippet_sha256, e.content_kind ?? null, e.retrieved_at]);

/**
 * §4.3 step (a) and step (b): rev2 l.178-188, extended by rev4 18c (l.232-233)
 * and rev5 24d (l.109-111), replacing base l.148-157.
 *
 * Order is not arbitrary. rev4 l.215-218 puts the source_count check ahead of
 * fully_pinned, and rev4 l.261-262 notes the earliest-retrieved_at rule is
 * undefined over an empty array, so the empty-set prohibition runs first. rev4
 * l.235-239 puts the content_kind check ahead of step (b) so the diagnostic
 * "names the missing member rather than reporting a root mismatch".
 *
 * Scope: this checks the consistency of what the set declares. A member the
 * caller does not declare is not checked, because there is no declaration to be
 * inconsistent with; the member table's requiredness (base l.68-76) is a
 * separate obligation on issuers and is not what step (a) tests.
 */
export function validateEvidenceSet(set: EvidenceSet): ValidationResult {
  const sources = set.sources;

  // 1. rev4 l.273-276 (Finding 20). A present evidence_set naming no sources is
  // malformed, and this check precedes every other because the checks below are
  // undefined over an empty array.
  if (sources.length === 0 || set.source_count === 0) {
    return {
      ok: false,
      diagnostic: "empty_evidence_set",
      detail: "a present evidence_set MUST carry at least one entry in sources (rev4 F20)",
    };
  }

  // 2. rev2 l.178-179 (Finding 13).
  if (set.source_count !== undefined && set.source_count !== sources.length) {
    return {
      ok: false,
      diagnostic: "source_count_mismatch",
      detail: `source_count ${set.source_count} against ${sources.length} entries`,
    };
  }

  const pinnedEntries = sources.filter((e) => e.pinned === true);

  // 3. rev2 l.179-180.
  if (set.pinned_count !== undefined && set.pinned_count !== pinnedEntries.length) {
    return {
      ok: false,
      diagnostic: "pinned_count_mismatch",
      detail: `pinned_count ${set.pinned_count} against ${pinnedEntries.length} pinned entries`,
    };
  }

  // 4. base l.73: pinned_count MUST be less than or equal to source_count.
  if (
    set.pinned_count !== undefined &&
    set.source_count !== undefined &&
    set.pinned_count > set.source_count
  ) {
    return {
      ok: false,
      diagnostic: "pinned_count_exceeds_source_count",
      detail: `pinned_count ${set.pinned_count} exceeds source_count ${set.source_count}`,
    };
  }

  // 5. base l.74 and rev2 l.180-181. The source_count > 0 conjunct is retained
  // deliberately (rev4 l.220-222).
  if (set.fully_pinned !== undefined) {
    const declaredSources = set.source_count ?? sources.length;
    const declaredPinned = set.pinned_count ?? pinnedEntries.length;
    const expected = declaredPinned === declaredSources && declaredSources > 0;
    if (set.fully_pinned !== expected) {
      return {
        ok: false,
        diagnostic: "fully_pinned_inconsistent",
        detail: `fully_pinned ${set.fully_pinned} against pinned ${declaredPinned} of ${declaredSources}`,
      };
    }
  }

  // 6. rev2 l.95-97 (Finding 12), checked at rev2 l.181-182. Compared as carried
  // bytes: the members are RFC 3339 timestamps and the texts define no parse.
  if (set.retrieved_at !== undefined) {
    let earliest = sources[0]!.retrieved_at;
    for (const e of sources) {
      if (compareUtf8(e.retrieved_at, earliest) < 0) earliest = e.retrieved_at;
    }
    if (set.retrieved_at !== earliest) {
      return {
        ok: false,
        diagnostic: "set_retrieved_at_not_earliest",
        detail: `set-level ${set.retrieved_at} against earliest per-item ${earliest}`,
      };
    }
  }

  for (const e of sources) {
    if (e.pinned === false) {
      // 7. rev3 l.75-76.
      if (e.unpinned_reason === undefined || e.unpinned_reason === null) {
        return {
          ok: false,
          diagnostic: "unpinned_reason_absent",
          detail: `entry ${e.url} is unpinned and carries no unpinned_reason`,
        };
      }
      // 8. rev3 l.68-76, on the two-value domain.
      if (!(UNPINNED_REASONS as readonly string[]).includes(e.unpinned_reason)) {
        return {
          ok: false,
          diagnostic: "unpinned_reason_outside_domain",
          detail: `entry ${e.url} carries unpinned_reason ${e.unpinned_reason}`,
        };
      }
      continue;
    }

    // 9. rev4 l.232-233 (18c). content_kind: null on an unpinned entry is read
    // as absent (rev4 l.294-296 says the member is absent when unpinned, and no
    // sentence gives an explicit null a consequence); on a pinned entry the
    // member is required and null is therefore not a value it may take.
    if (
      e.content_kind === undefined ||
      e.content_kind === null ||
      !(CONTENT_KINDS as readonly string[]).includes(String(e.content_kind))
    ) {
      return {
        ok: false,
        diagnostic: "content_kind_absent_when_pinned",
        detail: `entry ${e.url} is pinned and carries no content_kind from the enumeration`,
      };
    }

    // 10. rev4 l.249-254 (Finding 19).
    if (
      e.content_kind === "full_resource" &&
      e.resource_sha256 !== undefined &&
      e.resource_sha256 !== null
    ) {
      return {
        ok: false,
        diagnostic: "resource_sha256_with_full_resource",
        detail: `entry ${e.url} carries content_kind full_resource together with resource_sha256`,
      };
    }
  }

  // 11. rev5 l.64-66 (24a), checked in step (a) per rev5 l.109-111 (24d). Not
  // self-enforcing: a duplicated tuple produces a computable but wrong root
  // and nothing downstream detects it (rev5 l.116-119).
  const seen = new Set<string>();
  for (const e of sources) {
    const key = BOUND_TUPLE(e);
    if (seen.has(key)) {
      return {
        ok: false,
        diagnostic: "duplicate_bound_tuple",
        detail: `two entries identical across url, snippet_sha256, content_kind and retrieved_at: ${e.url}`,
      };
    }
    seen.add(key);
  }

  // 12-14. Step (b), rev2 l.185-188.
  if (set.evidence_root !== undefined) {
    const pinnedCount = set.pinned_count ?? pinnedEntries.length;
    if (set.evidence_root !== null && pinnedCount === 0) {
      return {
        ok: false,
        diagnostic: "root_present_with_zero_pinned",
        detail: "evidence_root MUST be null when pinned_count is zero",
      };
    }
    if (set.evidence_root === null && pinnedCount > 0) {
      return {
        ok: false,
        diagnostic: "root_absent_with_pinned_items",
        detail: "evidence_root MUST be non-null when pinned_count is greater than zero",
      };
    }
    if (set.evidence_root !== null) {
      const recomputed = computeRoot(sources);
      if (recomputed !== set.evidence_root) {
        return {
          ok: false,
          diagnostic: "root_mismatch",
          detail: `carried ${set.evidence_root} against recomputed ${recomputed}`,
        };
      }
    }
  }

  return { ok: true };
}

export interface ItemReason {
  url: string;
  reason: "content_not_held" | "content_differs";
}

export interface Resolution {
  halt: boolean;
  malformed: boolean;
  diagnostic?: Diagnostic;
  detail?: string;
  evidence_root: string | null;
  /** rev2 l.190-193 (c) and rev2 l.204-205 (e); "recomputed" is our name for the
   * affirmative case, which the texts never name. */
  resolution: "unknown" | "recomputed";
  /** rev2 l.190-193: false whenever fully_pinned is false. */
  offline_recompute_claim: boolean;
  item_reasons: ItemReason[];
}

/**
 * §4.3 step N as a whole: (a) and (b) via validateEvidenceSet, then (c) to (f).
 *
 * `held` maps a pinned item's url to the SHA-256 the verifier computed over the
 * bytes it holds. An absent url means the verifier holds no candidate content.
 */
export function resolveEvidenceSet(
  set: EvidenceSet | undefined,
  held: Record<string, string> = {},
): Resolution {
  // (e) rev2 l.204-205: a receipt carrying no evidence_set resolves unknown and
  // MUST NOT fail this step.
  if (set === undefined) {
    return {
      halt: false,
      malformed: false,
      evidence_root: null,
      resolution: "unknown",
      offline_recompute_claim: false,
      item_reasons: [],
    };
  }

  const validation = validateEvidenceSet(set);
  if (!validation.ok) {
    return {
      halt: true,
      malformed: true,
      diagnostic: validation.diagnostic,
      detail: validation.detail,
      evidence_root: null,
      resolution: "unknown",
      offline_recompute_claim: false,
      item_reasons: [],
    };
  }

  const pinnedEntries = set.sources.filter((e) => e.pinned === true);
  const sourceCount = set.source_count ?? set.sources.length;
  const pinnedCount = set.pinned_count ?? pinnedEntries.length;
  const fullyPinned = set.fully_pinned ?? (pinnedCount === sourceCount && sourceCount > 0);

  // (d) rev4 l.184-191 (Finding 17), a MUST since rev 4: the report carries a
  // per-item reason distinguishing content_not_held from content_differs.
  const item_reasons: ItemReason[] = [];
  for (const e of pinnedEntries) {
    const candidate = held[e.url];
    if (candidate === undefined) {
      item_reasons.push({ url: e.url, reason: "content_not_held" });
    } else if (candidate !== e.snippet_sha256) {
      item_reasons.push({ url: e.url, reason: "content_differs" });
    }
  }

  // (c) rev2 l.190-193, and (f) rev2 l.207-214: a declared partial set resolves
  // unknown and is neither invalid nor malformed.
  const resolution = !fullyPinned || item_reasons.length > 0 ? "unknown" : "recomputed";

  return {
    halt: false,
    malformed: false,
    evidence_root: computeRoot(set.sources),
    resolution,
    offline_recompute_claim: fullyPinned,
    item_reasons,
  };
}
