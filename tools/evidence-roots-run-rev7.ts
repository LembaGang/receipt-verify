// Run our independent evidence_root implementation over the 32 rev 7 vector
// inputs and write walker/evidence-roots-ours-rev7.json.
//
// Inputs come from walker/evidence-inputs-rev7.json, which carries only the
// members the independence protocol permits: each vector's id, designation,
// expect, input and — new in rev 7 — condition, plus the header's title and
// vector_count. No `computed` member, none of the header's excluded values
// (leaf_prefix, node_prefix, leaf_member_encoding, node_child_encoding,
// independence_disclosure, spec_bases), and none of the three forbidden rev 7
// files were read to write this. The ground for admitting `condition` is in
// tools/evidence-root-inputs.mjs: rev 7 l.115-127 prints all thirteen values in
// the amendments text, which the airlock permits at any time.
//
// Rev 7 deltas against tools/evidence-roots-run-rev6.ts, which is left as the
// rev 6 artefact it was committed as:
//
//   - Finding 33 (rev7 l.106-109). Every MALFORMED vector now carries a
//     `condition`, and conformance is no longer the bare halt: the condition we
//     report must EQUAL the vector's. Every MALFORMED row's relation therefore
//     carries condition_matches, and `holds` is false when we halt for a
//     different reason than the one the vector injects. This is the only rule in
//     rev 7 that can make a row fail for a reason rev 6 could not see.
//   - Finding 34 (rev7 l.176-177). evi-node-raw-not-hex is renamed
//     evi-node-child-encoding and evi-leaf-hex-not-raw is renamed
//     evi-leaf-member-encoding. The constructions are unchanged; only the ids and
//     the `computed` key names moved, so the two cases below are the rev 6 cases
//     under new labels, and the counter-constructions we assemble are the same.
//   - Three new vectors, 33a/33b/33c (rev7 l.206-249), for three rules rev 6
//     stated and its own set did not exercise. None adds a rule; each adds the
//     first fixture row this side can be compared on.
//     * evi-step-resolves-affirmatively — root-bearing (rev7 l.265).
//     * evi-unpinned-members-absent-accepted — NOT root-bearing, by rev 7's own
//       reasoning at l.229-233, so its incidental root is recorded as
//       non-normative and excluded from the count.
//     * evi-retrieved-at-noncanonical-rejects — MALFORMED, carries no root.
//   - Accounting: 13 + 13 + 7 - 1 = 32 (rev7 l.255-264). The overlap is still
//     evi-root-mismatch-rejects alone; evi-step-resolves-affirmatively is
//     root-bearing under the RESOLUTION designation, so designation alone no
//     longer selects the root-bearing group and the id is named explicitly.
//
// Vectors arrive in several input shapes, and several MALFORMED vectors supply a
// bare entry or a partial evidence_set. Those are completed here only by
// deriving members the vector itself does not declare, so that the single
// malformation under test is the only one present — a vector refused by a rule
// other than the one it targets tests nothing about that rule (rev4 l.215-218
// makes exactly this argument about 4(ii)).

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import {
  LEAF_PREFIX,
  NODE_PREFIX,
  computeRoot,
  leafHash,
  nodeHash,
  resolveEvidenceSet,
  rootsAgree,
  rootsDiffer,
  type EvidenceEntry,
  type EvidenceSet,
} from "./evidence-root.js";

interface Vector {
  id: string;
  designation: string;
  expect: string;
  input: any;
  /** rev7 l.106-109 (Finding 33). Present on MALFORMED vectors only. */
  condition?: string;
}

const INPUTS = "walker/evidence-inputs-rev7.json";
const OUT = "walker/evidence-roots-ours-rev7.json";

const bundle = JSON.parse(readFileSync(INPUTS, "utf8")) as {
  source_sha256: string;
  header: { title: string; vector_count: number };
  vectors: Vector[];
};

const hex = (b: Uint8Array): string => Buffer.from(b).toString("hex");

/** A set carrying only these entries, with nothing else declared. */
const setOf = (sources: EvidenceEntry[]): EvidenceSet => ({ sources });

interface Row {
  id: string;
  designation: string;
  expect: string;
  /** our root(s), keyed by the sub-input they came from */
  ours: Record<string, string | null> | null;
  /** our halt, with the rev 7 condition beside the free-named diagnostic */
  halt: { diagnostic: string; condition: string; detail: string } | null;
  /** the condition the vector says its input injects (rev7 l.106-109) */
  vector_condition: string | null;
  /** the relation the vector's expect names, as we evaluate it */
  relation: { named: string; holds: boolean; condition_matches?: boolean; note?: string } | null;
  resolution: Record<string, unknown> | null;
}

const rows: Row[] = [];

/**
 * rev7 l.106-109. Under rev 6 this row held when we halted at all. Under rev 7
 * it holds only when we halt AND the condition we report equals the vector's,
 * so a halt for the wrong reason is now a divergence the set can see.
 */
function haltRow(v: Vector, set: EvidenceSet, note?: string, alsoRoot = false): Row {
  const r = resolveEvidenceSet(set);
  // A halting set still has a recomputable root over its pinned entries. Rev 6
  // E-3 makes that value a comparison point for evi-root-mismatch-rejects, whose
  // `computed` member carries the correct root the `input` used to leak.
  const ours = alsoRoot ? { set: computeRoot(set.sources) } : null;
  const conditionMatches = r.condition !== undefined && r.condition === v.condition;
  return {
    id: v.id,
    designation: v.designation,
    expect: v.expect,
    ours,
    halt: r.halt ? { diagnostic: r.diagnostic!, condition: r.condition!, detail: r.detail! } : null,
    vector_condition: v.condition ?? null,
    relation: {
      named: `halt, malformed, condition = ${v.condition ?? "(none stated)"}`,
      holds: r.halt === true && r.malformed === true && conditionMatches,
      condition_matches: conditionMatches,
      ...(note ? { note } : {}),
    },
    resolution: null,
  };
}

function twoSetRow(v: Vector, named: "identical" | "differ", note?: string): Row {
  const a = computeRoot(v.input.set_1 as EvidenceEntry[]);
  const b = computeRoot(v.input.set_2 as EvidenceEntry[]);
  return {
    id: v.id,
    designation: v.designation,
    expect: v.expect,
    ours: { set_1: a, set_2: b },
    halt: null,
    vector_condition: null,
    relation: {
      named,
      holds: named === "identical" ? rootsAgree(a, b) : rootsDiffer(a, b),
      ...(note ? { note } : {}),
    },
    resolution: null,
  };
}

for (const v of bundle.vectors) {
  switch (v.id) {
    // ---- root-bearing, relational ------------------------------------------
    case "evi-root-order-independent":
    case "evi-duplicate-url-distinct-digest":
    case "evi-order-tiebreak-content-kind":
    case "evi-order-tiebreak-retrieved-at":
      rows.push(twoSetRow(v, "identical"));
      break;

    case "evi-snippet-change-changes-root":
    case "evi-url-normalization-changes-root":
    case "evi-leaf-binds-content-kind":
    case "evi-leaf-binds-retrieved-at":
      rows.push(twoSetRow(v, "differ"));
      break;

    case "evi-root-odd-promotion": {
      const entries = v.input as EvidenceEntry[];
      const ours = computeRoot(entries);
      // Controls, so the row can fail: the construction base l.124-128 forbids
      // (duplicate the odd tail) and the one rev2 l.171-172 forbids (promote it
      // leftmost). Both are computed here, neither is normative.
      const [a, b, c] = [...entries]
        .sort((x, y) => (x.url < y.url ? -1 : 1))
        .map(leafHash);
      const duplicated = hex(nodeHash(nodeHash(a!, b!), nodeHash(c!, c!)));
      const leftmost = hex(nodeHash(c!, nodeHash(a!, b!)));
      rows.push({
        id: v.id,
        designation: v.designation,
        expect: v.expect,
        ours: { set: ours, "non_normative:duplicated_tail": duplicated, "non_normative:promoted_leftmost": leftmost },
        halt: null,
        vector_condition: null,
        relation: {
          named: "root matches promote-not-duplicate, promoted entry rightmost",
          holds: ours !== duplicated && ours !== leftmost && ours === hex(nodeHash(nodeHash(a!, b!), c!)),
        },
        resolution: null,
      });
      break;
    }

    // rev 6 Finding 27's vector, renamed by rev 7 Finding 34 (l.176). Two pinned
    // items form exactly one interior node, so this is the vector whose concrete
    // root distinguishes raw-octet children from hex children. Our root comes
    // from the tool; the hex-children counter-construction is assembled here and
    // is non-normative.
    //
    // rev7 l.190-196 records what the rename does NOT do: it does not restore
    // the airlock for this side, which read the old id on 9 September. Agreement
    // on this row is not independent corroboration of the branch, and the
    // findings file says so rather than counting it.
    case "evi-node-child-encoding": {
      const entries = v.input.sources as EvidenceEntry[];
      const ours = computeRoot(entries);
      const [a, b] = [...entries]
        .sort((x, y) => Buffer.compare(Buffer.from(x.url, "utf8"), Buffer.from(y.url, "utf8")))
        .map(leafHash);
      const NUL = Buffer.from([0x00]);
      const hexChildren = createHash("sha256")
        .update(
          Buffer.concat([
            Buffer.from(NODE_PREFIX, "utf8"),
            NUL,
            Buffer.from(hex(a!), "utf8"),
            NUL,
            Buffer.from(hex(b!), "utf8"),
          ]),
        )
        .digest("hex");
      rows.push({
        id: v.id,
        designation: v.designation,
        expect: v.expect,
        ours: { set: ours, "non_normative:counter_construction": hexChildren },
        halt: null,
        vector_condition: null,
        relation: {
          named: "root equals the normative form and differs from the counter-construction",
          holds: ours === hex(nodeHash(a!, b!)) && rootsDiffer(ours, hexChildren),
        },
        resolution: null,
      });
      break;
    }

    // rev 2 Finding 1's vector, renamed by rev 7 Finding 34 (l.177).
    case "evi-leaf-member-encoding": {
      const entry = v.input.entry as EvidenceEntry;
      const ours = computeRoot([entry]);
      // The counter-construction rev2 Finding 1 rejects: the digest entering the
      // preimage as its 32 raw bytes. Non-normative; computed only to show the
      // difference the vector asserts.
      const NUL = Buffer.from([0x00]);
      const raw = createHash("sha256")
        .update(
          Buffer.concat([
            Buffer.from(LEAF_PREFIX, "utf8"),
            NUL,
            Buffer.from(entry.url, "utf8"),
            NUL,
            Buffer.from(entry.snippet_sha256!, "hex"),
            NUL,
            Buffer.from(String(entry.content_kind), "utf8"),
            NUL,
            Buffer.from(entry.retrieved_at, "utf8"),
          ]),
        )
        .digest("hex");
      rows.push({
        id: v.id,
        designation: v.designation,
        expect: v.expect,
        ours: { set: ours, "non_normative:counter_construction": raw },
        halt: null,
        vector_condition: null,
        relation: {
          named: "root equals the normative form and differs from the counter-construction",
          holds: rootsDiffer(ours, raw),
        },
        resolution: null,
      });
      break;
    }

    // ---- MALFORMED ---------------------------------------------------------
    case "evi-set-retrieved-at-not-earliest-rejects":
      rows.push(
        haltRow(v, {
          retrieved_at: v.input.set_retrieved_at as string,
          sources: v.input.sources as EvidenceEntry[],
        }),
      );
      break;

    case "evi-content-kind-absent-when-pinned-rejects":
    case "evi-resource-sha256-with-full-resource-rejects":
    case "evi-unpinned-reason-outside-domain-rejects":
    case "evi-unpinned-without-reason-rejects":
    // 33c, new in rev 7 (l.235-249): a pinned entry whose retrieved_at is the
    // same instant with zero fractional digits. Same shape as the four above.
    case "evi-retrieved-at-noncanonical-rejects":
      rows.push(
        haltRow(v, setOf([v.input.entry as EvidenceEntry]), "single-entry set built from the vector's entry; no other member declared"),
      );
      break;

    case "evi-duplicate-bound-tuple-rejects":
      rows.push(haltRow(v, setOf(v.input.sources as EvidenceEntry[])));
      break;

    case "evi-empty-set-rejects":
    case "evi-source-count-mismatch-rejects":
    case "evi-count-inconsistency-rejects":
    case "evi-root-with-zero-pinned-rejects":
    case "evi-nonzero-pinned-null-root-rejects":
      rows.push(haltRow(v, v.input.evidence_set as EvidenceSet));
      break;

    // Root-bearing as well as MALFORMED (rev 6 E-3; rev7 l.264 keeps it the sole
    // overlap).
    case "evi-root-mismatch-rejects":
      rows.push(
        haltRow(
          v,
          v.input.evidence_set as EvidenceSet,
          "root-bearing: correct_root sits in computed, so our recomputation is a comparison point",
          true,
        ),
      );
      break;

    // ---- RESOLUTION (new in rev 7, 33a) ------------------------------------
    // rev7 l.214-216: a fully pinned two-item set with all content held and
    // matching. The first vector in any revision that expects the affirmative
    // token, so it is the first fixture check of rev 6 Finding 29 against us.
    case "evi-step-resolves-affirmatively": {
      const set = v.input.evidence_set as EvidenceSet;
      // `content_matches: true` says the verifier's bytes reproduce each pinned
      // digest, so the held map is each url against its own snippet_sha256.
      const held: Record<string, string> = {};
      if (v.input.content_matches === true) {
        for (const url of v.input.verifier_holds_bytes_for as string[]) {
          const e = set.sources.find((s) => s.url === url);
          if (e?.snippet_sha256) held[url] = e.snippet_sha256;
        }
      }
      const r = resolveEvidenceSet(set, held);
      rows.push({
        id: v.id,
        designation: v.designation,
        expect: v.expect,
        ours: { set: r.evidence_root },
        halt: null,
        vector_condition: null,
        relation: {
          named: "step resolves `resolved`: not `unknown`, not a halt",
          holds: r.resolution === "resolved" && r.halt === false && r.malformed === false,
        },
        resolution: {
          resolution: r.resolution,
          malformed: r.malformed,
          halt: r.halt,
          offline_recompute_claim: r.offline_recompute_claim,
          item_reasons: r.item_reasons,
        },
      });
      break;
    }

    // ---- ADDITIVE (new in rev 7, 33b) --------------------------------------
    // rev7 l.225-227: an unpinned entry with snippet_sha256 and content_kind
    // OMITTED entirely, beside one pinned entry. rev7 l.229-233 states the
    // vector is not root-bearing and why, so our incidental root is recorded
    // under the non_normative prefix and does not enter the count.
    case "evi-unpinned-members-absent-accepted": {
      const set = v.input.evidence_set as EvidenceSet;
      const r = resolveEvidenceSet(set);
      rows.push({
        id: v.id,
        designation: v.designation,
        expect: v.expect,
        ours: { "non_normative:incidental_root": r.evidence_root },
        halt: null,
        vector_condition: null,
        relation: {
          named: "accepted; an omitted member is equivalent to an explicit null on an unpinned entry",
          holds: r.halt === false && r.malformed === false,
        },
        resolution: { resolution: r.resolution, malformed: r.malformed, halt: r.halt },
      });
      break;
    }

    // ---- EMPTY / ADDITIVE / COMPLETENESS / UNKNOWN --------------------------
    case "evi-empty-root-null": {
      const r = resolveEvidenceSet(v.input.evidence_set as EvidenceSet);
      rows.push({
        id: v.id,
        designation: v.designation,
        expect: v.expect,
        ours: { set: r.evidence_root },
        halt: null,
        vector_condition: null,
        relation: {
          named: "evidence_root null; receipt well-formed",
          holds: r.evidence_root === null && r.malformed === false && r.halt === false,
        },
        resolution: { resolution: r.resolution, malformed: r.malformed, halt: r.halt },
      });
      break;
    }

    case "evi-absent-unknown": {
      const r = resolveEvidenceSet(undefined);
      rows.push({
        id: v.id,
        designation: v.designation,
        expect: v.expect,
        ours: null,
        halt: null,
        vector_condition: null,
        relation: {
          named: "unknown; MUST NOT halt",
          holds: r.resolution === "unknown" && r.halt === false && r.malformed === false,
        },
        resolution: { resolution: r.resolution, malformed: r.malformed, halt: r.halt },
      });
      break;
    }

    case "evi-partial-resolves-unknown":
    case "evi-declared-partial-is-not-invalid": {
      const set = v.input.evidence_set as EvidenceSet;
      const r = resolveEvidenceSet(set);
      const holds =
        v.id === "evi-partial-resolves-unknown"
          ? r.resolution === "unknown" && r.offline_recompute_claim === false
          : r.malformed === false && r.halt === false;
      rows.push({
        id: v.id,
        designation: v.designation,
        expect: v.expect,
        ours: { set: r.evidence_root },
        halt: null,
        vector_condition: null,
        relation: { named: v.expect, holds },
        resolution: {
          resolution: r.resolution,
          malformed: r.malformed,
          halt: r.halt,
          offline_recompute_claim: r.offline_recompute_claim,
        },
      });
      break;
    }

    case "evi-content-mismatch-unknown":
    case "evi-content-not-held-unknown": {
      const entry = v.input.entry as EvidenceEntry;
      const held: Record<string, string> = {};
      if (v.input.verifier_holds_bytes_for) {
        held[v.input.verifier_holds_bytes_for as string] = v.input
          .verifier_recomputed_sha256 as string;
      }
      const set: EvidenceSet = {
        source_count: 1,
        pinned_count: 1,
        fully_pinned: true,
        sources: [entry],
      };
      const r = resolveEvidenceSet(set, held);
      const wanted =
        v.id === "evi-content-mismatch-unknown" ? "content_differs" : "content_not_held";
      rows.push({
        id: v.id,
        designation: v.designation,
        expect: v.expect,
        ours: { set: r.evidence_root },
        halt: null,
        vector_condition: null,
        relation: {
          named: `unknown; MUST NOT halt; per-item reason ${wanted}`,
          holds:
            r.halt === false &&
            r.resolution === "unknown" &&
            r.item_reasons.length === 1 &&
            r.item_reasons[0]!.reason === wanted,
        },
        resolution: {
          resolution: r.resolution,
          malformed: r.malformed,
          halt: r.halt,
          item_reasons: r.item_reasons,
        },
      });
      break;
    }

    default:
      throw new Error(`unhandled vector id: ${v.id}`);
  }
}

const normativeRoots = (r: Row): number =>
  Object.entries(r.ours ?? {}).filter(
    ([k, val]) => !k.startsWith("non_normative:") && typeof val === "string",
  ).length;

const rootCount = rows.reduce((n, r) => n + normativeRoots(r), 0);

// The reconciliation the comparison needs. Some vectors exist to assert
// something about a root; the rest assert a resolution and happen to have a
// computable root as a by-product. Counting them separately is what lets our
// total be compared with a count taken over a file that only carries the first
// kind.
//
// Rev 7 keeps the NODE PREIMAGE designation and the one MALFORMED overlap, and
// adds a root-bearing vector under the RESOLUTION designation (l.265), so the
// designations alone do not select the group and the id is named.
const ROOT_BEARING = new Set([
  "CANONICAL ORDER",
  "ODD NODE",
  "NODE PREIMAGE",
  "LEAF PREIMAGE",
  "BINDING",
]);
const ROOT_BEARING_BY_ID = new Set([
  "evi-root-mismatch-rejects", // MALFORMED and root-bearing: the sole overlap
  "evi-step-resolves-affirmatively", // RESOLUTION and root-bearing (rev7 l.265)
]);
const OVERLAPPING = new Set(["evi-root-mismatch-rejects"]);
const rootBearing = rows.filter(
  (r) => ROOT_BEARING.has(r.designation) || ROOT_BEARING_BY_ID.has(r.id),
);
const malformed = rows.filter((r) => r.designation === "MALFORMED");
const remaining = rows.filter(
  (r) =>
    !ROOT_BEARING.has(r.designation) &&
    r.designation !== "MALFORMED" &&
    !ROOT_BEARING_BY_ID.has(r.id),
);
const rootsOnRootBearingVectors = rootBearing.reduce((n, r) => n + normativeRoots(r), 0);
const incidentalRoots = rootCount - rootsOnRootBearingVectors;

const nonNormativeCount = rows.reduce(
  (n, r) =>
    n +
    Object.keys(r.ours ?? {}).filter((k) => k.startsWith("non_normative:")).length,
  0,
);

// rev7 l.106-109. The count that did not exist under rev 6: of the MALFORMED
// vectors, how many report the condition the vector names.
const malformedWithCondition = malformed.filter((r) => r.vector_condition !== null);
const conditionsMatching = malformed.filter((r) => r.relation?.condition_matches === true);

const out = {
  produced_by: "tools/evidence-roots-run-rev7.ts",
  handoff: "CC_HANDOFF_2026-09-10_rev7-and-repins.md",
  spec_extract: "docs/evidence-root-spec-extract.md (sections 1-9, the Rev 6 section and the Rev 7 section)",
  inputs_file: INPUTS,
  inputs_source_sha256: bundle.source_sha256,
  fixture_title: bundle.header.title,
  fixture_vector_count: bundle.header.vector_count,
  leaf_prefix_used: LEAF_PREFIX,
  node_prefix_used: NODE_PREFIX,
  node_child_encoding:
    "raw 32 octets — our choice on 7 Sep (extract §2), compelled by rev6 l.101-104 (Finding 27); not independently corroborated by this side, rev7 l.190-196",
  retrieved_at_rule:
    "RFC 3339 UTC, Z designator, exactly three fractional-second digits, rejected otherwise (rev6 l.243-247, Finding 32)",
  affirmative_resolution_token: "resolved (rev6 l.171-174, Finding 29)",
  condition_rule:
    "every halt reports a stable condition, and conformance requires it to equal the vector's (rev7 l.106-109, Finding 33)",
  vector_count: rows.length,
  normative_root_count: rootCount,
  non_normative_root_count: nonNormativeCount,
  root_count_breakdown: {
    root_bearing_vectors: rootBearing.length,
    roots_on_root_bearing_vectors: rootsOnRootBearingVectors,
    incidental_roots_on_resolution_vectors: incidentalRoots,
  },
  condition_accounting: {
    note: "rev7 l.106-109 (Finding 33). Under rev 6 a MALFORMED row held on the bare halt; under rev 7 it holds only when the reported condition equals the vector's.",
    malformed_vectors: malformed.length,
    carrying_a_condition: malformedWithCondition.length,
    conditions_matching: conditionsMatching.length,
  },
  category_accounting: {
    note:
      "Not a partition. evi-root-mismatch-rejects is both MALFORMED and root-bearing; evi-step-resolves-affirmatively is root-bearing under the RESOLUTION designation (rev7 l.255-267).",
    root_bearing: rootBearing.length,
    malformed: malformed.length,
    remaining: remaining.length,
    overlap: rows.filter(
      (r) => r.designation === "MALFORMED" && OVERLAPPING.has(r.id),
    ).length,
    sum_with_overlap_removed:
      rootBearing.length + malformed.length + remaining.length -
      rows.filter((r) => r.designation === "MALFORMED" && OVERLAPPING.has(r.id)).length,
  },
  relations_holding: rows.filter((r) => r.relation?.holds).length,
  vectors: rows,
};

writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");

const digest = createHash("sha256").update(readFileSync(OUT)).digest("hex");
console.log(`vectors            ${rows.length}`);
console.log(`normative roots    ${rootCount}`);
console.log(`  on ${rootBearing.length} root-bearing vectors  ${rootsOnRootBearingVectors}`);
console.log(`  incidental on resolution vectors  ${incidentalRoots}`);
console.log(`non-normative counter-constructions  ${nonNormativeCount}`);
console.log(
  `conditions         ${conditionsMatching.length} of ${malformedWithCondition.length} MALFORMED vectors report the condition the vector names`,
);
console.log(
  `categories         root-bearing ${rootBearing.length}, MALFORMED ${malformed.length}, remaining ${remaining.length}` +
    `  (overlap ${out.category_accounting.overlap}; sum ${out.category_accounting.sum_with_overlap_removed})`,
);
console.log(`relations holding  ${out.relations_holding} of ${rows.length}`);
console.log(`${OUT}  sha256 ${digest}`);
for (const r of rows) {
  const mark = r.relation?.holds ? "ok  " : "FAIL";
  console.log(`  ${mark} ${r.id}${r.halt ? `  -> ${r.halt.diagnostic} / ${r.halt.condition}` : ""}`);
}
