// Run our independent evidence_root implementation over the 28 rev 5 vector
// inputs and write walker/evidence-roots-ours.json.
//
// Inputs come from walker/evidence-inputs-rev5.json, which carries only the
// members the CC_HANDOFF_2026-09-07 rev 2 independence protocol permits: each
// vector's id, designation, expect and input, plus the header's title and
// vector_count. No `computed` member, neither prefix, and none of the three
// forbidden files were read to write this.
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
}

const INPUTS = "walker/evidence-inputs-rev5.json";
const OUT = "walker/evidence-roots-ours.json";

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
  /** our halt diagnostic, when the vector halts */
  halt: { diagnostic: string; detail: string } | null;
  /** the relation the vector's expect names, as we evaluate it */
  relation: { named: string; holds: boolean; note?: string } | null;
  resolution: Record<string, unknown> | null;
}

const rows: Row[] = [];

function haltRow(v: Vector, set: EvidenceSet, note?: string): Row {
  const r = resolveEvidenceSet(set);
  return {
    id: v.id,
    designation: v.designation,
    expect: v.expect,
    ours: null,
    halt: r.halt ? { diagnostic: r.diagnostic!, detail: r.detail! } : null,
    relation: {
      named: "halt, malformed",
      holds: r.halt === true && r.malformed === true,
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
        relation: {
          named: "root matches promote-not-duplicate, promoted entry rightmost",
          holds: ours !== duplicated && ours !== leftmost && ours === hex(nodeHash(nodeHash(a!, b!), c!)),
        },
        resolution: null,
      });
      break;
    }

    case "evi-leaf-hex-not-raw": {
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
        ours: { set: ours, "non_normative:raw_form": raw },
        halt: null,
        relation: { named: "differ", holds: rootsDiffer(ours, raw) },
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
    case "evi-root-mismatch-rejects":
      rows.push(haltRow(v, v.input.evidence_set as EvidenceSet));
      break;

    // ---- EMPTY / ADDITIVE / COMPLETENESS / UNKNOWN --------------------------
    case "evi-empty-root-null": {
      const r = resolveEvidenceSet(v.input.evidence_set as EvidenceSet);
      rows.push({
        id: v.id,
        designation: v.designation,
        expect: v.expect,
        ours: { set: r.evidence_root },
        halt: null,
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

// The reconciliation E5 needs. Ten vectors exist to assert something about a
// root; the rest assert a resolution and happen to have a computable root as a
// by-product. Counting them separately is what lets our total be compared with
// a count taken over a file that only carries the first kind.
const ROOT_BEARING = new Set([
  "CANONICAL ORDER",
  "ODD NODE",
  "LEAF PREIMAGE",
  "BINDING",
]);
const rootBearing = rows.filter((r) => ROOT_BEARING.has(r.designation));
const rootsOnRootBearingVectors = rootBearing.reduce((n, r) => n + normativeRoots(r), 0);
const incidentalRoots = rootCount - rootsOnRootBearingVectors;

const out = {
  produced_by: "tools/evidence-roots-run.ts",
  handoff: "CC_HANDOFF_2026-09-07_evidence-root-independent_rev2.md",
  spec_extract: "docs/evidence-root-spec-extract.md",
  inputs_file: INPUTS,
  inputs_source_sha256: bundle.source_sha256,
  fixture_title: bundle.header.title,
  fixture_vector_count: bundle.header.vector_count,
  leaf_prefix_used: LEAF_PREFIX,
  node_encoding: "raw 32-octet digests (docs/evidence-root-spec-extract.md §2)",
  vector_count: rows.length,
  normative_root_count: rootCount,
  root_count_breakdown: {
    root_bearing_vectors: rootBearing.length,
    roots_on_root_bearing_vectors: rootsOnRootBearingVectors,
    incidental_roots_on_resolution_vectors: incidentalRoots,
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
console.log(`relations holding  ${out.relations_holding} of ${rows.length}`);
console.log(`${OUT}  sha256 ${digest}`);
for (const r of rows) {
  const mark = r.relation?.holds ? "ok  " : "FAIL";
  console.log(`  ${mark} ${r.id}${r.halt ? `  -> ${r.halt.diagnostic}` : ""}`);
}
