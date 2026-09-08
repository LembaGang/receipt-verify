// Does `fixtures/upstreams.json` know about every corpus that actually exists?
//
// `tools/drift.ts` answers "has the upstream of this pin moved?" for the
// upstreams someone remembered to write into `fixtures/upstreams.json`, and that
// file is maintained by hand. Until this file, nothing checked it against the
// corpora on disk. The gap was not hypothetical: `fixtures/delivery/` was graded
// by the walker on every run, had no provenance row and no upstream entry, and a
// green drift run said nothing whatsoever about it. In the output, a corpus with
// no entry is indistinguishable from a corpus that is fine.
//
// So this is a TEST and not a tool run: it is red in the ordinary suite, on the
// verify workflow, on every push — not only on the Monday drift schedule.
//
// What turns it red (the falsifiability statement this file owes):
//   * a new file under `fixtures/` or `refs/` that no entry and no `unmapped`
//     row accounts for — asserted directly by the negative control below, which
//     runs the same resolver over paths that exist nowhere;
//   * a corpus directory in `walker/scopes.json` that is missing, empty, or
//     holds one unaccounted file;
//   * an `unmapped` row with no `paths`, a blank or multi-line reason, or that
//     accounts for nothing that exists any more;
//   * an `unmapped` row whose `reason_code` is missing or outside the closed
//     vocabulary — asserted by its own negative control over synthetic rows.
// What it does NOT observe: whether an entry is CORRECT. A `corpus_dirs` value
// pointing at the wrong upstream still resolves every file under it and this
// file stays silent. That is `tools/drift.ts`'s question, not this one's.
//
// A directory is settled by its FILES rather than by a prefix rule of its own.
// A prefix rule would let one broad `corpus_dirs` value swallow a subdirectory
// that came from somewhere else entirely — which is the failure this file exists
// to catch, so it must not be the mechanism this file resolves by.
//
// There is deliberately no exclusion list. A path that should not be checked
// gets a named `unmapped` row with a one-line reason, in the file the drift tool
// reads — never a skip written here, where the drift tool would never see it.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "./helpers.js";

interface UnmappedRow {
  id: string;
  paths: string[];
  rows: string;
  /** Which KIND of absence this is, from the closed vocabulary in upstreams.json's how_to_read. */
  reason_code?: string;
  reason: string;
}

/**
 * The closed vocabulary, transcribed from `fixtures/upstreams.json`'s
 * `how_to_read.unmapped_reason_codes`. Transcribed rather than read from that
 * object on purpose: a test that took its list of valid values from the same
 * file it is checking would accept any new code the moment someone added it to
 * the key list, which is a check that cannot fail. Widening the vocabulary has
 * to be a deliberate edit in two places.
 */
const REASON_CODES = [
  "generated_here",
  "local_clone_no_remote",
  "nondeterministic_endpoint",
  "past_capture",
  "repository_record",
] as const;

/**
 * Rows whose `reason_code` is absent, empty, or not in the vocabulary, each
 * described. Exported so the negative control can run THE SAME function over
 * synthetic rows — a control exercising a different code path would say nothing
 * about the green result.
 */
export function badReasonCodes(rows: UnmappedRow[]): string[] {
  const valid = new Set<string>(REASON_CODES);
  return rows
    .filter((r) => !valid.has(r.reason_code ?? ""))
    .map((r) =>
      r.reason_code === undefined
        ? `${r.id}: no reason_code`
        : `${r.id}: reason_code ${JSON.stringify(r.reason_code)} is not one of ${REASON_CODES.join(", ")}`,
    );
}

interface Entry {
  id: string;
  /** Directories the entry's upstream produced whole. Prefix-matched. */
  corpus_dirs?: string[];
  /** A single pinned file: http and ietf-draft entries. */
  pinned_file?: string;
  /** kind: local only — repository-relative paths this repository authors, with the digest of each. */
  files?: Array<{ path: string; sha256: string }>;
}

interface Upstreams {
  unmapped: { note: string; rows: UnmappedRow[] };
  upstreams: Entry[];
}

const DOC = JSON.parse(readFileSync(join(ROOT, "fixtures", "upstreams.json"), "utf8")) as Upstreams;
const SCOPES = JSON.parse(readFileSync(join(ROOT, "walker", "scopes.json"), "utf8")) as {
  corpora: Array<{ id: string; dir: string }>;
};

/** `fixtures/acta/synthetic/*` matches `fixtures/acta/synthetic/a/b.json`. Only `*` is special — the semantics tools/walk-digests.ts already uses for `applies_to`. */
function globMatch(pattern: string, path: string): boolean {
  if (!pattern.includes("*")) return pattern === path;
  const rx = new RegExp("^" + pattern.split("*").map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[^]*") + "$");
  return rx.test(path);
}

/** Where a repository-relative file path is accounted for, or null. */
function resolve(path: string): string | null {
  for (const u of DOC.upstreams) {
    if (u.pinned_file === path) return `entry ${u.id} (pinned_file)`;
    for (const f of u.files ?? []) if (f.path === path) return `entry ${u.id} (files)`;
    for (const d of u.corpus_dirs ?? []) {
      const dir = d.replace(/\/+$/, "") + "/";
      if (path.startsWith(dir)) return `entry ${u.id} (corpus_dirs ${d})`;
    }
  }
  for (const row of DOC.unmapped.rows) {
    for (const g of row.paths ?? []) if (globMatch(g, path)) return `unmapped ${row.id}`;
  }
  return null;
}

/** Every file under a directory, repository-relative, forward slashes. `node_modules` and `__pycache__` are the only names not descended into: neither is corpus data and neither is tracked. */
function walk(rel: string): string[] {
  const out: string[] = [];
  const rec = (r: string) => {
    for (const e of readdirSync(join(ROOT, r), { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      if (e.name === "node_modules" || e.name === "__pycache__") continue;
      const child = `${r}/${e.name}`;
      if (e.isDirectory()) rec(child);
      else if (statSync(join(ROOT, child)).isFile()) out.push(child);
    }
  };
  rec(rel);
  return out;
}

const FILES = [...walk("fixtures"), ...walk("refs")];

describe("upstream coverage — every corpus on disk is accounted for in fixtures/upstreams.json", () => {
  it("has files to check at all, so a resolver that resolved nothing would still be red", () => {
    expect(FILES.length).toBeGreaterThan(150);
  });

  it("every file under fixtures/ and refs/ resolves to an entry or to a named unmapped row", () => {
    const unresolved = FILES.filter((p) => resolve(p) === null);
    expect(
      unresolved,
      `${unresolved.length} of ${FILES.length} paths under fixtures/ and refs/ resolve to no fixtures/upstreams.json entry\n` +
        `(by corpus_dirs, pinned_file or files) and to no named row in its \`unmapped\` block:\n\n` +
        unresolved.map((p) => `  ${p}`).join("\n") +
        `\n\nEach one needs an upstream entry or an \`unmapped\` row carrying \`paths\` and a one-line \`reason\`.\n` +
        `Do not add an exclusion to this test: the drift tool reads upstreams.json and never reads this file.`,
    ).toEqual([]);
  });

  it("every corpus directory walker/scopes.json names is present, non-empty, and accounted for file by file", () => {
    const bad: string[] = [];
    for (const c of SCOPES.corpora) {
      const dir = c.dir.replace(/\/+$/, "");
      if (!existsSync(join(ROOT, dir))) {
        bad.push(`${c.id} -> ${dir} (the walker grades this corpus and the directory is not in the tree)`);
        continue;
      }
      const files = walk(dir);
      if (files.length === 0) {
        bad.push(`${c.id} -> ${dir} (present but empty)`);
        continue;
      }
      for (const p of files.filter((p) => resolve(p) === null)) bad.push(`${c.id} -> ${p}`);
    }
    expect(
      bad,
      `the walker grades ${SCOPES.corpora.length} corpora; ${bad.length} path${bad.length === 1 ? "" : "s"} in them resolve to nothing in fixtures/upstreams.json:\n\n` +
        bad.map((d) => `  ${d}`).join("\n"),
    ).toEqual([]);
  });

  it("every unmapped row is named, carries paths, and gives a one-line reason", () => {
    const ids = DOC.unmapped.rows.map((r) => r.id);
    expect(new Set(ids).size, `unmapped row ids are not unique: ${ids.join(", ")}`).toBe(ids.length);
    for (const row of DOC.unmapped.rows) {
      expect(row.id, `an unmapped row has no id: ${JSON.stringify(row).slice(0, 120)}`).toMatch(/^[a-z0-9-]+$/);
      expect(row.paths?.length ?? 0, `unmapped row ${row.id} names no paths, so it accounts for nothing`).toBeGreaterThan(0);
      expect(row.reason?.trim() ?? "", `unmapped row ${row.id} has a blank reason`).not.toBe("");
      expect(row.reason ?? "", `unmapped row ${row.id}: the reason must be one line`).not.toMatch(/\n/);
    }
  });

  it("every unmapped row carries a reason_code from the closed vocabulary", () => {
    const bad = badReasonCodes(DOC.unmapped.rows);
    expect(
      bad,
      `${bad.length} unmapped row${bad.length === 1 ? "" : "s"} cannot be acted on by a machine: the prose reason\n` +
        `says why THIS row, and only the code says which KIND of absence it is.\n\n` +
        bad.map((b) => `  ${b}`).join("\n") +
        `\n\nPick one of: ${REASON_CODES.join(", ")}. If none fits, the vocabulary is what needs widening —\n` +
        `in fixtures/upstreams.json's how_to_read AND in this file, deliberately, in the same commit.`,
    ).toEqual([]);
  });

  // The control for the rule above. `[]` is also what a validator that validated
  // nothing would return; these are the rows that separate the two.
  it("negative control: an unmapped row with a missing or unknown reason_code is reported", () => {
    const good: UnmappedRow = { id: "fixture-good", paths: ["fixtures/nowhere/*"], rows: "n/a", reason_code: "generated_here", reason: "a valid row" };
    const missing = { id: "fixture-missing", paths: ["fixtures/nowhere/*"], rows: "n/a", reason: "no code at all" } as UnmappedRow;
    const unknown: UnmappedRow = { id: "fixture-unknown", paths: ["fixtures/nowhere/*"], rows: "n/a", reason_code: "because_i_said_so", reason: "a code nobody defined" };
    const empty: UnmappedRow = { id: "fixture-empty", paths: ["fixtures/nowhere/*"], rows: "n/a", reason_code: "", reason: "a blank code" };

    expect(badReasonCodes([good])).toEqual([]);
    expect(badReasonCodes([missing])).toEqual(["fixture-missing: no reason_code"]);
    expect(badReasonCodes([unknown])[0]).toContain("fixture-unknown");
    expect(badReasonCodes([empty])[0]).toContain("fixture-empty");
    // And a real row mixed in with a bad one still leaves exactly the bad one.
    expect(badReasonCodes([...DOC.unmapped.rows, missing])).toEqual(["fixture-missing: no reason_code"]);
  });

  it("no unmapped row is dead: each one accounts for at least one path that exists", () => {
    const corpusFiles = SCOPES.corpora.flatMap((c) => (existsSync(join(ROOT, c.dir)) ? walk(c.dir.replace(/\/+$/, "")) : []));
    const all = new Set([...FILES, ...corpusFiles]);
    const idle = DOC.unmapped.rows.filter((row) => ![...all].some((p) => (row.paths ?? []).some((g) => globMatch(g, p)))).map((r) => r.id);
    expect(idle, `unmapped rows matching no path on disk (the corpus moved or went away, and the row now excuses nothing): ${idle.join(", ")}`).toEqual([]);
  });

  // The control. Every assertion above is an empty-list assertion, and an empty
  // list is exactly what a resolver saying "yes" to everything would produce
  // too. These are the inputs that separate the two.
  it("negative control: a path nothing accounts for is reported unresolved", () => {
    expect(resolve("fixtures/no-such-corpus/receipt.json")).toBeNull();
    expect(resolve("refs/draft-nobody-wrote-this-00.txt")).toBeNull();
    expect(resolve("fixtures/delivery/no-such-capture/chain.jsonl")).toBeNull();
    // And a path that IS accounted for still resolves, so the control is not
    // merely a resolver that says "no" to everything.
    expect(resolve("refs/draft-krausz-verification-state-01.txt")).not.toBeNull();
    expect(resolve("fixtures/asqav/05c1c49/conformance/vectors.json")).not.toBeNull();
  });
});
