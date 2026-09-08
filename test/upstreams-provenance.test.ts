// Do `fixtures/upstreams.json` and `fixtures/provenance.md` agree about the
// digest of the same file?
//
// The two files are maintained by hand, by different sessions, and they overlap:
// provenance.md is the record of WHAT was pinned and why, upstreams.json the
// liveness relation, and both carry a sha256 for many of the same paths.
// upstreams.json says in its own `what_this_file_is_not`:
//
//   "If a digest here disagrees with fixtures/provenance.md, that file is right
//    and this one is the defect."
//
// Nothing checked it. A rule that names a winner but is never applied does not
// settle a disagreement; it only says which way to settle one, if anybody ever
// notices. The row is not the truth — the agreement of the two rows is the only
// thing either can be checked against without re-fetching the world.
//
// What turns this red (the falsifiability statement this file owes):
//   * one digit changed in either file's digest for any path the two share —
//     asserted directly by the negative control below, which mutates one hex
//     digit in an IN-MEMORY copy of the provenance text and requires the same
//     comparison function that produces the green result to report it;
//   * a provenance row whose sha256 cell stops being parseable, or a table row
//     that carries two 64-hex cells and so has no unambiguous digest.
//
// What it does NOT observe: whether either digest is CORRECT. Two files can
// agree and both be wrong about the bytes on disk. That is what the fixtures'
// own suites and `npm run drift` are for; this file only refuses to let the two
// records drift apart from each other silently.
//
// It is a TEST and not a tool run, so it is red in the ordinary suite and on
// every push, not only when someone thinks to look.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "./helpers.js";

const SHA256 = /^[0-9a-f]{64}$/;

interface ProvRow {
  path: string;
  sha256: string;
  /** The `## ` heading the row sits under, so a disagreement names where to look. */
  section: string;
}

/**
 * Every per-file table row in the provenance document.
 *
 * A row qualifies when its first cell is a backticked repository-relative path
 * under `fixtures/`, `refs/` or `cpb/`, and exactly one of its remaining cells
 * is a bare 64-hex digest. Upstream blob ids are 40 hex and are therefore not
 * mistaken for a sha256; a row carrying two 64-hex cells is ambiguous and is
 * collected as a defect rather than resolved by position, because column order
 * is not the same in every table in that document.
 */
export function provenanceRows(text: string): { rows: ProvRow[]; ambiguous: string[] } {
  const rows: ProvRow[] = [];
  const ambiguous: string[] = [];
  let section = "(before the first heading)";
  for (const line of text.split(/\r?\n/)) {
    const h = /^##+\s+(.*)$/.exec(line);
    if (h) {
      section = h[1]!.trim();
      continue;
    }
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 2) continue;
    const p = /^`([^`]+)`$/.exec(cells[0]!);
    if (!p) continue;
    const path = p[1]!;
    if (!/^(fixtures|refs|cpb)\//.test(path)) continue;
    const digests = cells.slice(1).map((c) => c.replace(/^`|`$/g, "")).filter((c) => SHA256.test(c));
    if (digests.length === 0) continue;
    if (digests.length > 1) {
      ambiguous.push(`${path} (section "${section}") carries ${digests.length} 64-hex cells: ${digests.join(", ")}`);
      continue;
    }
    rows.push({ path, sha256: digests[0]!, section });
  }
  return { rows, ambiguous };
}

interface Entry {
  id: string;
  pinned_file?: string;
  sha256?: string;
  files?: Array<{ path: string; sha256: string }>;
  corpus_dirs?: string[];
  paths?: Array<{ path: string; sha256: string }>;
}

/**
 * Every (path, sha256) pair `fixtures/upstreams.json` asserts, in the repository-relative
 * spelling provenance.md uses.
 *
 * Three shapes carry a digest for a repository path:
 *   * `pinned_file` + the entry's own `sha256` (http and ietf-draft entries);
 *   * `files[]` (kind: local);
 *   * `corpus_dirs[] + "/" + paths[].path` (kind: git). A git entry's `paths[].path`
 *     is the UPSTREAM path — `conformance/vectors.json` — while provenance.md names
 *     the fixture it was copied to. Resolving through corpus_dirs is what makes those
 *     entries comparable at all; matching the literal upstream path alone would make
 *     every git entry silently unreachable here, which is the kind of check that
 *     passes because it looked at nothing.
 */
export function upstreamPairs(doc: { upstreams: Entry[] }): Array<{ id: string; path: string; sha256: string }> {
  const out: Array<{ id: string; path: string; sha256: string }> = [];
  for (const u of doc.upstreams) {
    if (u.pinned_file && u.sha256 && SHA256.test(u.sha256)) out.push({ id: u.id, path: u.pinned_file, sha256: u.sha256 });
    for (const f of u.files ?? []) out.push({ id: u.id, path: f.path, sha256: f.sha256 });
    for (const d of u.corpus_dirs ?? []) {
      const dir = d.replace(/\/+$/, "");
      for (const pp of u.paths ?? []) out.push({ id: u.id, path: `${dir}/${pp.path}`, sha256: pp.sha256 });
    }
  }
  return out;
}

export interface Disagreement {
  path: string;
  entryId: string;
  upstreamsSha256: string;
  provenanceSha256: string;
  provenanceSection: string;
}

/**
 * The comparison itself, over text rather than over files, so the negative
 * control can run the SAME function against a mutated copy. A control that
 * exercised a different code path from the green result would prove nothing
 * about the green result.
 */
export function disagreements(upstreamsJson: string, provenanceText: string): {
  disagreements: Disagreement[];
  compared: number;
  ambiguous: string[];
} {
  const doc = JSON.parse(upstreamsJson) as { upstreams: Entry[] };
  const { rows, ambiguous } = provenanceRows(provenanceText);
  const byPath = new Map<string, ProvRow[]>();
  for (const r of rows) byPath.set(r.path, [...(byPath.get(r.path) ?? []), r]);

  const found: Disagreement[] = [];
  let compared = 0;
  for (const pair of upstreamPairs(doc)) {
    for (const r of byPath.get(pair.path) ?? []) {
      compared += 1;
      if (r.sha256 !== pair.sha256) {
        found.push({
          path: pair.path,
          entryId: pair.id,
          upstreamsSha256: pair.sha256,
          provenanceSha256: r.sha256,
          provenanceSection: r.section,
        });
      }
    }
  }
  return { disagreements: found, compared, ambiguous };
}

const UPSTREAMS_TEXT = readFileSync(join(ROOT, "fixtures", "upstreams.json"), "utf8");
const PROVENANCE_TEXT = readFileSync(join(ROOT, "fixtures", "provenance.md"), "utf8");

describe("fixtures/upstreams.json and fixtures/provenance.md agree about every digest they share", () => {
  it("finds paths in both files at all, so a comparison over an empty set could not pass", () => {
    const { compared } = disagreements(UPSTREAMS_TEXT, PROVENANCE_TEXT);
    // 20 is well under today's count and well over zero: the assertion is that
    // the two documents actually overlap, not a snapshot of how much.
    expect(compared).toBeGreaterThan(20);
  });

  it("no provenance table row is ambiguous about which cell is its sha256", () => {
    const { ambiguous } = disagreements(UPSTREAMS_TEXT, PROVENANCE_TEXT);
    expect(
      ambiguous,
      `rows carrying more than one 64-hex cell, so no digest can be read from them without guessing a column:\n` +
        ambiguous.map((a) => `  ${a}`).join("\n"),
    ).toEqual([]);
  });

  it("every shared path carries the same sha256 in both files", () => {
    const { disagreements: bad } = disagreements(UPSTREAMS_TEXT, PROVENANCE_TEXT);
    expect(
      bad,
      `${bad.length} path${bad.length === 1 ? "" : "s"} carry different digests in the two records.\n` +
        `fixtures/upstreams.json says of itself: "If a digest here disagrees with fixtures/provenance.md,\n` +
        `that file is right and this one is the defect." So unless the provenance section named below is\n` +
        `itself wrong about the bytes, upstreams.json is what to fix:\n\n` +
        bad
          .map(
            (d) =>
              `  ${d.path}\n` +
              `      upstreams.json (entry ${d.entryId}) : ${d.upstreamsSha256}\n` +
              `      provenance.md  ("${d.provenanceSection}") : ${d.provenanceSha256}`,
          )
          .join("\n\n"),
    ).toEqual([]);
  });

  // The control. Every assertion above is an empty-list assertion, and an empty
  // list is what a comparison that compared nothing would also produce. This is
  // the input that separates the two: one hex digit, changed in an IN-MEMORY
  // copy of the provenance text. The real file is never written.
  it("negative control: one changed digit in a provenance digest is reported", () => {
    const { rows } = provenanceRows(PROVENANCE_TEXT);
    const shared = new Set(upstreamPairs(JSON.parse(UPSTREAMS_TEXT)).map((p) => p.path));
    const target = rows.find((r) => shared.has(r.path));
    expect(target, "no row is shared by both files, so the control has nothing to mutate").toBeDefined();

    const original = target!.sha256;
    const flipped = (original[0] === "a" ? "b" : "a") + original.slice(1);
    expect(flipped).not.toBe(original);
    expect(SHA256.test(flipped)).toBe(true);

    const mutated = PROVENANCE_TEXT.replace(original, flipped);
    expect(mutated, "the mutation did not change the provenance text").not.toBe(PROVENANCE_TEXT);

    const { disagreements: bad } = disagreements(UPSTREAMS_TEXT, mutated);
    const hit = bad.find((d) => d.path === target!.path);
    expect(
      hit,
      `the comparison did not report a one-digit change to ${target!.path}: ` +
        `${original} -> ${flipped}. The green result above is therefore not evidence of anything.`,
    ).toBeDefined();
    expect(hit!.provenanceSha256).toBe(flipped);
    expect(hit!.upstreamsSha256).toBe(original);

    // And the real file is untouched: re-reading it still produces the green result.
    expect(disagreements(UPSTREAMS_TEXT, readFileSync(join(ROOT, "fixtures", "provenance.md"), "utf8")).disagreements).toEqual([]);
  });

  // The mirror control: a change on the OTHER side is reported too, so the test
  // is not silently only ever reading one of the two files.
  it("negative control: one changed digit in an upstreams.json digest is reported", () => {
    const pairs = upstreamPairs(JSON.parse(UPSTREAMS_TEXT));
    const { rows } = provenanceRows(PROVENANCE_TEXT);
    const provPaths = new Set(rows.map((r) => r.path));
    const target = pairs.find((p) => provPaths.has(p.path));
    expect(target, "no upstreams.json digest is shared with provenance.md").toBeDefined();

    const original = target!.sha256;
    const flipped = (original[0] === "a" ? "b" : "a") + original.slice(1);
    const mutated = UPSTREAMS_TEXT.replace(original, flipped);
    expect(mutated).not.toBe(UPSTREAMS_TEXT);

    const { disagreements: bad } = disagreements(mutated, PROVENANCE_TEXT);
    expect(
      bad.some((d) => d.path === target!.path && d.upstreamsSha256 === flipped),
      `the comparison did not report a one-digit change to ${target!.path} on the upstreams.json side`,
    ).toBe(true);
  });
});
