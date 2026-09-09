// evidence_root, built from the -02 evidence-pinning texts alone.
//
// Every test below names the normative sentence it exercises, by file and line,
// against docs/evidence-root-spec-extract.md. The rule this file follows: a test
// that recomputes its expectation with the function under test asserts nothing,
// so every expected digest here is either an independently written SHA-256 over
// a preimage this file assembles itself, or a relation (identical / differs)
// that the spec states in words.
//
// Sources are the five texts at agentoracle-receipt-spec ac33ad1, short-named
// base / rev2 / rev3 / rev4 / rev5 as in the extract.

import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";

import {
  CONTENT_KINDS,
  LEAF_PREFIX,
  NODE_PREFIX,
  UNPINNED_REASONS,
  canonicalOrder,
  computeRoot,
  leafHash,
  nodeHash,
  resolveEvidenceSet,
  rootsAgree,
  validateEvidenceSet,
  type EvidenceEntry,
} from "../tools/evidence-root.js";

const AT = "2026-09-01T12:00:00.000Z";
const D1 = "8ed3f6ad685b959ead7022518e1af76cd816f8e8ec7ccdda1ed4018e8f2223f8";
const D2 = "f44e64e75f3948e9f73f8dfa94721c4ce8cbb4f265c4790c702b2d41cfbf2753";
const D3 = "be9d587defa1f0c09ef49eb17e206983a5f8f8289e4281860bd0ee5a19592c67";

function pinned(url: string, digest: string, extra: Partial<EvidenceEntry> = {}): EvidenceEntry {
  return {
    url,
    snippet_sha256: digest,
    retrieved_at: AT,
    pinned: true,
    content_kind: "snippet",
    ...extra,
  };
}

function unpinned(url: string, reason = "no_content_returned"): EvidenceEntry {
  return {
    url,
    snippet_sha256: null,
    retrieved_at: AT,
    pinned: false,
    content_kind: null,
    unpinned_reason: reason,
  };
}

const NUL = Buffer.from([0x00]);
const u8 = (s: string) => Buffer.from(s, "utf8");

describe("the leaf preimage (rev4 l.101-103, Finding 15a)", () => {
  it("is SHA-256 over the v2 prefix and four NUL-separated members", () => {
    // Preimage assembled here from rev4 l.101-103 directly, not from the module.
    const expected = createHash("sha256")
      .update(
        Buffer.concat([
          u8("ao-evidence-leaf-v2"),
          NUL,
          u8("https://example.org/a"),
          NUL,
          u8(D1),
          NUL,
          u8("snippet"),
          NUL,
          u8(AT),
        ]),
      )
      .digest();
    expect(Buffer.from(leafHash(pinned("https://example.org/a", D1)))).toEqual(expected);
  });

  it("uses the prefix rev4 15b moved to v2, not the base's v1 (rev4 l.120-126)", () => {
    expect(LEAF_PREFIX).toBe("ao-evidence-leaf-v2");
  });

  it("takes snippet_sha256 as 64 hex characters, not 32 raw bytes (rev2 l.166-167)", () => {
    // The counter-construction rev2 Finding 1 rejects: the same entry with the
    // digest as raw bytes. Different leaf, which is what the finding asserts.
    const rawForm = createHash("sha256")
      .update(
        Buffer.concat([
          u8("ao-evidence-leaf-v2"),
          NUL,
          u8("https://example.org/a"),
          NUL,
          Buffer.from(D1, "hex"),
          NUL,
          u8("snippet"),
          NUL,
          u8(AT),
        ]),
      )
      .digest();
    expect(Buffer.from(leafHash(pinned("https://example.org/a", D1)))).not.toEqual(rawForm);
  });

  it("binds content_kind, so two entries differing only there differ (rev4 F15)", () => {
    const a = leafHash(pinned("https://example.org/a", D1, { content_kind: "snippet" }));
    const b = leafHash(pinned("https://example.org/a", D1, { content_kind: "full_resource" }));
    expect(Buffer.from(a)).not.toEqual(Buffer.from(b));
  });

  it("binds retrieved_at, so two entries differing only there differ (rev4 F15)", () => {
    const a = leafHash(pinned("https://example.org/a", D1, { retrieved_at: AT }));
    const b = leafHash(
      pinned("https://example.org/a", D1, { retrieved_at: "2026-09-02T12:00:00.000Z" }),
    );
    expect(Buffer.from(a)).not.toEqual(Buffer.from(b));
  });

  it("binds url bytes unnormalized, so case differences differ (rev2 l.143-146, F14)", () => {
    const a = leafHash(pinned("https://example.org/a", D1));
    const b = leafHash(pinned("https://EXAMPLE.ORG/a", D1));
    expect(Buffer.from(a)).not.toEqual(Buffer.from(b));
  });
});

describe("the interior node (base l.121, unchanged per rev4 l.127)", () => {
  it("is SHA-256 over the v1 node prefix and the two NUL-separated digests", () => {
    const left = leafHash(pinned("https://example.org/a", D1));
    const right = leafHash(pinned("https://example.org/b", D2));
    const expected = createHash("sha256")
      .update(
        Buffer.concat([u8("ao-evidence-node-v1"), NUL, Buffer.from(left), NUL, Buffer.from(right)]),
      )
      .digest();
    expect(Buffer.from(nodeHash(left, right))).toEqual(expected);
  });

  it("keeps the node prefix at v1 while the leaf prefix moved (rev4 l.127)", () => {
    expect(NODE_PREFIX).toBe("ao-evidence-node-v1");
  });

  it("is order-sensitive, so left and right are not interchangeable", () => {
    const l = leafHash(pinned("https://example.org/a", D1));
    const r = leafHash(pinned("https://example.org/b", D2));
    expect(Buffer.from(nodeHash(l, r))).not.toEqual(Buffer.from(nodeHash(r, l)));
  });
});

describe("canonical order (rev5 l.96-103, Finding 24c)", () => {
  it("sorts ascending by url first", () => {
    const ordered = canonicalOrder([
      pinned("https://example.org/b", D2),
      pinned("https://example.org/a", D1),
    ]);
    expect(ordered.map((e) => e.url)).toEqual([
      "https://example.org/a",
      "https://example.org/b",
    ]);
  });

  it("breaks a url tie on snippet_sha256 (second term)", () => {
    const ordered = canonicalOrder([
      pinned("https://example.org/a", D2),
      pinned("https://example.org/a", D1),
    ]);
    expect(ordered.map((e) => e.snippet_sha256)).toEqual([D1, D2]);
  });

  it("breaks a url+digest tie on content_kind (third term)", () => {
    const ordered = canonicalOrder([
      pinned("https://example.org/a", D1, { content_kind: "snippet" }),
      pinned("https://example.org/a", D1, { content_kind: "excerpt" }),
    ]);
    expect(ordered.map((e) => e.content_kind)).toEqual(["excerpt", "snippet"]);
  });

  it("breaks a three-way tie on retrieved_at (fourth term)", () => {
    const late = "2026-09-02T12:00:00.000Z";
    const ordered = canonicalOrder([
      pinned("https://example.org/a", D1, { retrieved_at: late }),
      pinned("https://example.org/a", D1, { retrieved_at: AT }),
    ]);
    expect(ordered.map((e) => e.retrieved_at)).toEqual([AT, late]);
  });

  it("compares bytewise over UTF-8, not by UTF-16 code unit (rev5 l.98-99)", () => {
    // U+FF21 (three UTF-8 bytes, lead 0xEF) sorts after U+10000 (four bytes,
    // lead 0xF0) under UTF-16 code-unit order because U+10000 is a surrogate
    // pair, and before it under UTF-8 bytewise order. A string < comparison
    // gets this backwards, which is the defect this test exists to catch.
    const bmp = "https://example.org/Ａ";
    const astral = "https://example.org/\u{10000}";
    expect(astral < bmp).toBe(true); // UTF-16 order, the wrong answer
    const ordered = canonicalOrder([pinned(astral, D1), pinned(bmp, D1)]);
    expect(ordered.map((e) => e.url)).toEqual([bmp, astral]);
  });

  it("excludes unpinned entries before sorting (base l.107, l.110)", () => {
    const ordered = canonicalOrder([
      pinned("https://example.org/b", D2),
      unpinned("https://example.org/a"),
    ]);
    expect(ordered).toHaveLength(1);
    expect(ordered[0]?.url).toBe("https://example.org/b");
  });
});

describe("the root (base l.121-140, rev2 l.171-172)", () => {
  it("over one pinned item is that item's leaf, with no node hashing", () => {
    const leaf = Buffer.from(leafHash(pinned("https://example.org/a", D1))).toString("hex");
    expect(computeRoot([pinned("https://example.org/a", D1)])).toBe(leaf);
  });

  it("over two pinned items is one node over the sorted leaves", () => {
    const a = leafHash(pinned("https://example.org/a", D1));
    const b = leafHash(pinned("https://example.org/b", D2));
    const expected = Buffer.from(nodeHash(a, b)).toString("hex");
    expect(
      computeRoot([pinned("https://example.org/b", D2), pinned("https://example.org/a", D1)]),
    ).toBe(expected);
  });

  it("promotes an odd final entry unchanged rather than duplicating it (base l.124-128)", () => {
    const a = leafHash(pinned("https://example.org/a", D1));
    const b = leafHash(pinned("https://example.org/b", D2));
    const c = leafHash(pinned("https://example.org/c", D3));
    const promote = Buffer.from(nodeHash(nodeHash(a, b), c)).toString("hex");
    const duplicate = Buffer.from(nodeHash(nodeHash(a, b), nodeHash(c, c))).toString("hex");
    const actual = computeRoot([
      pinned("https://example.org/a", D1),
      pinned("https://example.org/b", D2),
      pinned("https://example.org/c", D3),
    ]);
    expect(actual).toBe(promote);
    expect(actual).not.toBe(duplicate);
  });

  it("keeps the promoted entry rightmost at the next level (rev2 l.171-172)", () => {
    const a = leafHash(pinned("https://example.org/a", D1));
    const b = leafHash(pinned("https://example.org/b", D2));
    const c = leafHash(pinned("https://example.org/c", D3));
    // Leftmost promotion is the reading rev2 Finding 2 forecloses.
    const leftmost = Buffer.from(nodeHash(c, nodeHash(a, b))).toString("hex");
    expect(
      computeRoot([
        pinned("https://example.org/a", D1),
        pinned("https://example.org/b", D2),
        pinned("https://example.org/c", D3),
      ]),
    ).not.toBe(leftmost);
  });

  it("is null over zero pinned items (base l.139-140)", () => {
    expect(computeRoot([unpinned("https://example.org/a")])).toBeNull();
    expect(computeRoot([])).toBeNull();
  });

  it("is independent of the order the entries arrive in (rev5 l.101-103)", () => {
    const forward = computeRoot([
      pinned("https://example.org/a", D1),
      pinned("https://example.org/b", D2),
    ]);
    const reversed = computeRoot([
      pinned("https://example.org/b", D2),
      pinned("https://example.org/a", D1),
    ]);
    expect(forward).toBe(reversed);
    expect(rootsAgree(forward, reversed)).toBe(true);
  });
});

describe("step (a) and (b) malformations", () => {
  const halt = (set: Parameters<typeof validateEvidenceSet>[0]) => {
    const r = validateEvidenceSet(set);
    expect(r.ok).toBe(false);
    return r.ok ? "" : r.diagnostic;
  };

  it("rejects a present evidence_set naming no sources (rev4 F20, l.273-276)", () => {
    expect(halt({ source_count: 0, sources: [] })).toBe("empty_evidence_set");
  });

  it("rejects source_count disagreeing with sources.length (rev2 l.178-179)", () => {
    expect(
      halt({ source_count: 3, sources: [pinned("https://example.org/a", D1)] }),
    ).toBe("source_count_mismatch");
  });

  it("rejects pinned_count disagreeing with the pinned entries (rev2 l.179-180)", () => {
    expect(
      halt({
        source_count: 2,
        pinned_count: 2,
        sources: [pinned("https://example.org/a", D1), unpinned("https://example.org/b")],
      }),
    ).toBe("pinned_count_mismatch");
  });

  it("rejects fully_pinned inconsistent with the counts (base l.74, rev2 l.180-181)", () => {
    expect(
      halt({
        source_count: 2,
        pinned_count: 1,
        fully_pinned: true,
        sources: [pinned("https://example.org/a", D1), unpinned("https://example.org/b")],
      }),
    ).toBe("fully_pinned_inconsistent");
  });

  it("rejects a set-level retrieved_at that is not the earliest (rev2 l.95-97, F12)", () => {
    expect(
      halt({
        retrieved_at: "2026-09-02T12:00:00.000Z",
        sources: [
          pinned("https://example.org/a", D1, { retrieved_at: AT }),
          pinned("https://example.org/b", D2, { retrieved_at: "2026-09-02T12:00:00.000Z" }),
        ],
      }),
    ).toBe("set_retrieved_at_not_earliest");
  });

  it("rejects pinned:false with no unpinned_reason (rev3 l.75-76)", () => {
    const entry = unpinned("https://example.org/a");
    delete entry.unpinned_reason;
    expect(halt({ sources: [entry] })).toBe("unpinned_reason_absent");
  });

  it("rejects the retention literal rev3 removed from the domain (rev3 l.117, rev5 F25)", () => {
    expect(halt({ sources: [unpinned("https://example.org/a", "content_not_retained")] })).toBe(
      "unpinned_reason_outside_domain",
    );
  });

  it("holds the unpinned_reason domain at exactly two values (rev3 l.70-73)", () => {
    expect([...UNPINNED_REASONS].sort()).toEqual([
      "no_content_returned",
      "provider_metadata_only",
    ]);
  });

  it("rejects pinned:true with no content_kind, naming the member (rev4 l.232-233)", () => {
    const entry = pinned("https://example.org/a", D1);
    delete entry.content_kind;
    expect(halt({ sources: [entry] })).toBe("content_kind_absent_when_pinned");
  });

  it("holds the content_kind enumeration at three values (rev2 l.152)", () => {
    expect([...CONTENT_KINDS].sort()).toEqual(["excerpt", "full_resource", "snippet"]);
  });

  it("rejects full_resource carrying resource_sha256 (rev4 F19, l.249-254)", () => {
    expect(
      halt({
        sources: [
          pinned("https://example.org/a", D1, {
            content_kind: "full_resource",
            resource_sha256: D1,
          }),
        ],
      }),
    ).toBe("resource_sha256_with_full_resource");
  });

  it("rejects two entries identical on all four bound members (rev5 l.64-66, 24a)", () => {
    expect(
      halt({
        sources: [pinned("https://example.org/a", D1), pinned("https://example.org/a", D1)],
      }),
    ).toBe("duplicate_bound_tuple");
  });

  it("permits a repeat retrieval differing only in retrieved_at (rev5 l.68-74)", () => {
    const r = validateEvidenceSet({
      sources: [
        pinned("https://example.org/a", D1, { retrieved_at: AT }),
        pinned("https://example.org/a", D1, { retrieved_at: "2026-09-02T12:00:00.000Z" }),
      ],
    });
    expect(r.ok).toBe(true);
  });

  it("rejects a non-null root with pinned_count zero (rev2 l.186-188)", () => {
    expect(
      halt({
        pinned_count: 0,
        evidence_root: "00".repeat(32),
        sources: [unpinned("https://example.org/a")],
      }),
    ).toBe("root_present_with_zero_pinned");
  });

  it("rejects a null root with pinned_count above zero (rev2 l.186-188)", () => {
    expect(
      halt({
        pinned_count: 1,
        evidence_root: null,
        sources: [pinned("https://example.org/a", D1)],
      }),
    ).toBe("root_absent_with_pinned_items");
  });

  it("rejects a root that does not recompute (rev2 l.185-186)", () => {
    expect(
      halt({
        pinned_count: 1,
        evidence_root: "ff".repeat(32),
        sources: [pinned("https://example.org/a", D1)],
      }),
    ).toBe("root_mismatch");
  });

  it("names the missing content_kind rather than a root mismatch (rev4 l.235-239)", () => {
    // Both defects are present. The step (a) check must speak first, which is
    // the whole reason rev4 18c added it.
    const entry = pinned("https://example.org/a", D1);
    delete entry.content_kind;
    expect(halt({ pinned_count: 1, evidence_root: "ff".repeat(32), sources: [entry] })).toBe(
      "content_kind_absent_when_pinned",
    );
  });
});

describe("step resolutions (rev2 l.190-214, rev4 l.184-191)", () => {
  it("resolves unknown and refuses the offline-recompute claim when partial (rev2 l.190-193)", () => {
    const r = resolveEvidenceSet({
      source_count: 3,
      pinned_count: 2,
      fully_pinned: false,
      sources: [
        pinned("https://example.org/a", D1),
        pinned("https://example.org/b", D2),
        unpinned("https://example.org/c"),
      ],
    });
    expect(r.halt).toBe(false);
    expect(r.resolution).toBe("unknown");
    expect(r.offline_recompute_claim).toBe(false);
  });

  it("holds a declared partial set well-formed, not malformed (rev2 l.207-214)", () => {
    const r = resolveEvidenceSet({
      source_count: 3,
      pinned_count: 2,
      fully_pinned: false,
      sources: [
        pinned("https://example.org/a", D1),
        pinned("https://example.org/b", D2),
        unpinned("https://example.org/c"),
      ],
    });
    expect(r.malformed).toBe(false);
    expect(r.halt).toBe(false);
  });

  it("resolves unknown without failing when no evidence_set is present (rev2 l.204-205)", () => {
    const r = resolveEvidenceSet(undefined);
    expect(r.halt).toBe(false);
    expect(r.malformed).toBe(false);
    expect(r.resolution).toBe("unknown");
  });

  it("resolves a zero-pinned declared set with a null root (base l.139-140, rev4 l.281-282)", () => {
    const r = resolveEvidenceSet({
      source_count: 1,
      pinned_count: 0,
      fully_pinned: false,
      sources: [unpinned("https://example.org/a")],
    });
    expect(r.malformed).toBe(false);
    expect(r.evidence_root).toBeNull();
    expect(r.resolution).toBe("unknown");
  });

  it("carries content_differs per item without halting (rev4 l.184-191, F17 MUST)", () => {
    const r = resolveEvidenceSet(
      { source_count: 1, pinned_count: 1, fully_pinned: true, sources: [pinned("https://example.org/a", D1)] },
      { "https://example.org/a": "25e4a8b4235b9eb87928e6bef70ea8d318e31ec5f0be0b8665c95c94cfefe8dd" },
    );
    expect(r.halt).toBe(false);
    expect(r.malformed).toBe(false);
    expect(r.item_reasons).toEqual([
      { url: "https://example.org/a", reason: "content_differs" },
    ]);
    expect(r.resolution).toBe("unknown");
  });

  it("carries content_not_held when the verifier holds nothing (rev4 l.184-191)", () => {
    const r = resolveEvidenceSet(
      { source_count: 1, pinned_count: 1, fully_pinned: true, sources: [pinned("https://example.org/a", D1)] },
      {},
    );
    expect(r.item_reasons).toEqual([
      { url: "https://example.org/a", reason: "content_not_held" },
    ]);
    expect(r.halt).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Rev 6 (CC_HANDOFF_2026-09-09, step S2).
//
// Source: drafts/evidence-pinning-02-amendments-rev6-2026-09-08.md, sha256
// d62ded37dcf63f54…, at agentoracle-receipt-spec 7f0b0cd. Short name rev6.
// Every test below names the rev 6 sentence it exercises, by line, against the
// "Rev 6" section of docs/evidence-root-spec-extract.md.
//
// The two describe blocks are deliberately separated:
//   - "rev 6 — rules unimplemented at 5ffb455" were RED before the tool changed.
//   - "rev 6 — rules already satisfied at 5ffb455" were GREEN from the start and
//     pin a rule that was our own choice on 7 September and is now compelled.
// ---------------------------------------------------------------------------

describe("rev 6 — rules unimplemented at 5ffb455", () => {
  // F29, rev6 l.171-174: "A step resolves to exactly one of two values:
  // `resolved` ... or `unknown` ... An implementation MUST emit one of these two
  // tokens and MUST NOT emit any other value for a step's resolution."

  it("emits `resolved` for the affirmative case (rev6 l.171-174, F29)", () => {
    const r = resolveEvidenceSet(
      {
        source_count: 1,
        pinned_count: 1,
        fully_pinned: true,
        sources: [pinned("https://example.org/a", D1)],
      },
      { "https://example.org/a": D1 },
    );
    expect(r.halt).toBe(false);
    expect(r.resolution).toBe("resolved");
  });

  it("MUST NOT emit any token but `resolved` or `unknown` (rev6 l.173-174, F29)", () => {
    const cases = [
      resolveEvidenceSet(undefined),
      resolveEvidenceSet(
        { source_count: 1, pinned_count: 1, fully_pinned: true, sources: [pinned("https://example.org/a", D1)] },
        { "https://example.org/a": D1 },
      ),
      resolveEvidenceSet({
        source_count: 2,
        pinned_count: 1,
        fully_pinned: false,
        sources: [pinned("https://example.org/a", D1), unpinned("https://example.org/b")],
      }),
      resolveEvidenceSet({
        source_count: 1,
        pinned_count: 0,
        fully_pinned: false,
        sources: [unpinned("https://example.org/a")],
      }),
      resolveEvidenceSet({ source_count: 0, pinned_count: 0, fully_pinned: false, sources: [] }),
    ];
    for (const r of cases) {
      expect(["resolved", "unknown"]).toContain(r.resolution);
    }
    // The token rev 6 forbids, and the one this implementation emitted at 5ffb455.
    expect(cases.map((r) => r.resolution)).not.toContain("recomputed");
  });

  // F32b, rev6 l.243-247: "`retrieved_at` MUST be an RFC 3339 timestamp in UTC
  // with the `Z` designator and exactly three fractional-second digits ... An
  // implementation MUST reject a `retrieved_at` that is not in this form."

  const withRetrievedAt = (at: string) => ({
    source_count: 1,
    pinned_count: 1,
    fully_pinned: true,
    sources: [pinned("https://example.org/a", D1, { retrieved_at: at })],
  });

  it("rejects a retrieved_at with no fractional-second digits (rev6 l.243-247, F32)", () => {
    const r = validateEvidenceSet(withRetrievedAt("2026-09-01T12:00:00Z"));
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.diagnostic).toBe("retrieved_at_not_canonical");
  });

  it("rejects a retrieved_at carrying a numeric offset rather than Z (rev6 l.243-247, F32)", () => {
    const r = validateEvidenceSet(withRetrievedAt("2026-09-01T12:00:00.000+00:00"));
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.diagnostic).toBe("retrieved_at_not_canonical");
  });

  it("rejects two and four fractional-second digits; exactly three (rev6 l.243-247, F32)", () => {
    for (const at of ["2026-09-01T12:00:00.00Z", "2026-09-01T12:00:00.0000Z"]) {
      const r = validateEvidenceSet(withRetrievedAt(at));
      expect(r.ok).toBe(false);
      expect(r.ok === false && r.diagnostic).toBe("retrieved_at_not_canonical");
    }
  });

  it("rejects lowercase t and z, which would give one instant two spellings (rev6 l.243-247, F32)", () => {
    for (const at of ["2026-09-01t12:00:00.000Z", "2026-09-01T12:00:00.000z"]) {
      const r = validateEvidenceSet(withRetrievedAt(at));
      expect(r.ok).toBe(false);
      expect(r.ok === false && r.diagnostic).toBe("retrieved_at_not_canonical");
    }
  });

  it("rejects an out-of-range field even in the right shape (rev6 l.243-247, F32)", () => {
    for (const at of ["2026-13-01T12:00:00.000Z", "2026-09-01T25:00:00.000Z"]) {
      const r = validateEvidenceSet(withRetrievedAt(at));
      expect(r.ok).toBe(false);
      expect(r.ok === false && r.diagnostic).toBe("retrieved_at_not_canonical");
    }
  });

  it("accepts the canonical form — the control that fails a too-strict rule (rev6 l.243-247, F32)", () => {
    expect(validateEvidenceSet(withRetrievedAt("2026-09-01T12:00:00.000Z")).ok).toBe(true);
    // RFC 3339 admits second 60 for a leap second; the form rule does not exclude it.
    expect(validateEvidenceSet(withRetrievedAt("2026-06-30T23:59:60.000Z")).ok).toBe(true);
  });

  it("applies the form rule to an unpinned entry too — §4.1.1 is not scoped to pinned (rev6 l.243-247, base l.83-91)", () => {
    const r = validateEvidenceSet({
      source_count: 2,
      pinned_count: 1,
      fully_pinned: false,
      sources: [
        pinned("https://example.org/a", D1),
        { ...unpinned("https://example.org/b"), retrieved_at: "2026-09-01T12:00:00Z" },
      ],
    });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.diagnostic).toBe("retrieved_at_not_canonical");
  });

  it("does NOT apply the form rule to the set-level retrieved_at, which lives in §4.1 not §4.1.1 (rev6 l.241-247, base l.71)", () => {
    // Scoping decision recorded in the extract at R6-7: rev 6 amends §4.1.1, the
    // sources-entries section (base l.83-103). The set-level member is base l.71,
    // in §4.1. A non-canonical set-level value therefore still fails closed, but
    // by the earliest-comparison diagnostic rather than by a form rejection.
    const r = validateEvidenceSet({
      retrieved_at: "2026-09-01T12:00:00Z",
      source_count: 1,
      pinned_count: 1,
      fully_pinned: true,
      sources: [pinned("https://example.org/a", D1)],
    });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.diagnostic).toBe("set_retrieved_at_not_earliest");
  });
});

describe("rev 6 — rules already satisfied at 5ffb455, pinned now that the text compels them", () => {
  // These were GREEN before any change in this session. Each was a choice we made
  // on 7 September where rev 5 was silent; rev 6 states it, so each is pinned here
  // against a regression that rev 5 could not have caught.

  it("interior node children are the 32 raw octets, not their hex form (rev6 l.101-104, F27)", () => {
    const a = leafHash(pinned("https://example.org/a", D1));
    const b = leafHash(pinned("https://example.org/b", D2));

    // Assembled here rather than taken from nodeHash: the expectation must be
    // independent of the function under test.
    const rawChildren = createHash("sha256")
      .update(Buffer.concat([u8(NODE_PREFIX), NUL, Buffer.from(a), NUL, Buffer.from(b)]))
      .digest("hex");
    const hexChildren = createHash("sha256")
      .update(
        Buffer.concat([
          u8(NODE_PREFIX),
          NUL,
          u8(Buffer.from(a).toString("hex")),
          NUL,
          u8(Buffer.from(b).toString("hex")),
        ]),
      )
      .digest("hex");

    expect(rawChildren).not.toBe(hexChildren);

    const root = computeRoot([
      pinned("https://example.org/a", D1),
      pinned("https://example.org/b", D2),
    ]);
    expect(root).toBe(rawChildren);
    expect(root).not.toBe(hexChildren);
  });

  it("a one-item pinned set roots to that item's leaf, with no node formed (rev6 l.155-157, F28)", () => {
    const only = pinned("https://example.org/a", D1);
    const leaf = Buffer.from(leafHash(only)).toString("hex");
    expect(computeRoot([only])).toBe(leaf);

    // The forbidden alternative: node(leaf, leaf). Assembled independently.
    const selfPaired = createHash("sha256")
      .update(
        Buffer.concat([u8(NODE_PREFIX), NUL, Buffer.from(leafHash(only)), NUL, Buffer.from(leafHash(only))]),
      )
      .digest("hex");
    expect(computeRoot([only])).not.toBe(selfPaired);
  });

  it("a null content_kind on an unpinned entry is not a malformation (rev6 l.193-196, F30)", () => {
    const r = validateEvidenceSet({
      source_count: 2,
      pinned_count: 1,
      fully_pinned: false,
      sources: [pinned("https://example.org/a", D1), unpinned("https://example.org/b")],
    });
    expect(r.ok).toBe(true);
  });

  it("content_kind is required and enumerated on a pinned entry (rev6 l.195-196, F30)", () => {
    for (const kind of [undefined, null, "transcript"]) {
      const r = validateEvidenceSet({
        source_count: 1,
        pinned_count: 1,
        fully_pinned: true,
        sources: [pinned("https://example.org/a", D1, { content_kind: kind as never })],
      });
      expect(r.ok).toBe(false);
      expect(r.ok === false && r.diagnostic).toBe("content_kind_absent_when_pinned");
    }
  });

  it("halts on a receipt violating two conditions, naming one of them (rev6 l.214-218, F31)", () => {
    // source_count wrong AND an unpinned entry with no reason: two conditions.
    const r = validateEvidenceSet({
      source_count: 9,
      pinned_count: 1,
      fully_pinned: false,
      sources: [
        pinned("https://example.org/a", D1),
        { url: "https://example.org/b", snippet_sha256: null, retrieved_at: AT, pinned: false },
      ],
    });
    expect(r.ok).toBe(false);
    // "Conformance is determined by the halt, not by which condition is named."
    expect(["source_count_mismatch", "unpinned_reason_absent"]).toContain(
      r.ok === false ? r.diagnostic : "",
    );
  });

  it("the set-level retrieved_at comparison is bytewise, not temporal (rev6 l.240-241, F32a)", () => {
    // Two spellings whose bytewise and temporal orders disagree would break a
    // temporal reader; under the bytewise rule the first in byte order governs.
    const early = "2026-09-01T12:00:00.000Z";
    const late = "2026-09-02T12:00:00.000Z";
    const ok = validateEvidenceSet({
      retrieved_at: early,
      source_count: 2,
      pinned_count: 2,
      fully_pinned: true,
      sources: [
        pinned("https://example.org/a", D1, { retrieved_at: late }),
        pinned("https://example.org/b", D2, { retrieved_at: early }),
      ],
    });
    expect(ok.ok).toBe(true);

    const bad = validateEvidenceSet({
      retrieved_at: late,
      source_count: 2,
      pinned_count: 2,
      fully_pinned: true,
      sources: [
        pinned("https://example.org/a", D1, { retrieved_at: late }),
        pinned("https://example.org/b", D2, { retrieved_at: early }),
      ],
    });
    expect(bad.ok).toBe(false);
    expect(bad.ok === false && bad.diagnostic).toBe("set_retrieved_at_not_earliest");
  });
});
