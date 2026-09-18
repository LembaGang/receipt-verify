// The registry of executed verifications, under its own controls.
//
// `tools/registry.ts` builds `registry/index.json` and the badges from the
// records in the tree, and `--check` re-derives the whole thing and fails on any
// of the seven rules the registry is built on. This file is where each of those
// seven is driven RED.
//
// Why a throwaway registry in a temp git repository rather than assertions about
// the real one. Six of the seven rules can only be shown to work by VIOLATING
// them, and the committed registry must not carry a violation. A rule asserted
// only against a tree that satisfies it is a check that cannot fail: it would
// stay green if the rule were deleted from the tool. So every rule below is
// asserted twice -- once green on a valid registry, once red on a registry that
// breaks exactly that rule and nothing else -- and the red assertion names the
// rule number in the message, because "check failed" tells a reader nothing
// about which rule did the failing.
//
// Rules 3 and 7 are statements about the signed history, not about the files, so
// the throwaway registry is a real git repository with real commits. A test that
// simulated git here would say nothing about the tool, which shells out to it.
// The temp repositories are unsigned: `--check` reads the history's SHAPE and
// never its signatures, and `sh tools/verify-history.sh` is what reads those.
//
// What this file does NOT observe: whether a record is TRUE. Every digest in it
// can recompute perfectly over an artefact that was never verified by anyone.
// That is what the report beside each record, and the named consenting human,
// are for.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "./helpers.js";
import { build, check, deriveStatusLabel, writeBuild } from "../tools/registry.js";

const sha256 = (b: Buffer | string) => createHash("sha256").update(b).digest("hex");

/** Every failure message the tool produced, joined, so a test can ask which rule fired. */
const messages = (r: ReturnType<typeof check>) => r.failures.map((f) => `rule ${f.rule}: ${f.message}`).join("\n");

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@example.invalid", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@example.invalid" },
  }).trim();
}

function commitAll(cwd: string, message: string): void {
  git(cwd, "add", "-A");
  git(cwd, "-c", "commit.gpgsign=false", "commit", "-q", "-m", message);
}

/** The Interests paragraph, taken from the real registry README so the throwaway one carries the same single source. */
const INTERESTS =
  "Interests. The editor of this methodology authors draft-msebenzi-evidence-action, builds Chirindo, an operator-run gate that signs receipts of MCP calls, and maintains receipt-verify, the tool that produces the findings this methodology governs. Those occupy the same ground as the formats graded under it. Independence is not claimed. What is claimed is that every value in a finding recomputes from pinned bytes by anyone with the tool or without it, that every scope is cited to the document that names it, and that text and implementation are scored separately, a rule that came from the author of one of the formats graded. Where a judgment call was made, it is marked as one. This paragraph stands, in these words, at the end of every finding published under this methodology.";

interface RecordJson {
  [k: string]: unknown;
}

/** A record that satisfies every rule. Each test takes this and breaks exactly one thing. */
function validRecord(id: string, over: RecordJson = {}): RecordJson {
  return {
    schema: "receipt-verify/registry-record/0",
    id,
    kind: "own_work",
    record_type: "finding",
    key: {
      format: "example.format",
      format_version: "0",
      upstream_digest: { alg: "sha256", value: "a".repeat(64) },
      verifier: { tool: "throwaway", version: "0.0.0", commit: null },
      verified_at: "2026-01-01",
    },
    subject: {
      implementation: "throwaway",
      artefact: "throwaway artefact",
      artefact_digest: { alg: "sha256", value: "b".repeat(64) },
      role: "emitter",
      named_party: "A Person",
    },
    assessor: { name: "A Person", affiliation: "Nowhere" },
    consent: { named_human: "A Person", affiliation: "Nowhere", given_on: "2026-01-01", channel: "a ruling", scope: "own work" },
    methodology: null,
    method: "the shape this throwaway follows",
    executed_run: { command: "true", run_at: "2026-01-01T00:00:00Z", tool_commit: null, outputs: [] },
    pinned_inputs: [],
    as_of: { upstream_digest: { alg: "sha256", value: "a".repeat(64) }, date: "2026-01-01" },
    not_established: ["that this throwaway means anything"],
    establishes: ["that the tool reads a record"],
    independent_rerun: null,
    review_window: null,
    reply: { kind: "none", date: null, pointer: null, text_sha256: null },
    status: "published",
    supersedes: null,
    superseded_by: null,
    supersession_reason: null,
    report: { path: `registry/records/${id}/report.md`, sha256: "", bytes: 0 },
    ...over,
  };
}

/**
 * A throwaway registry in a fresh git repository: README, schema (the real one,
 * so the schema under test is the schema that ships), one record with its
 * report, a built index and badge, all committed.
 */
function makeRegistry(
  records: RecordJson[] = [validRecord("2026-01-01-throwaway")],
  extra?: (recordDir: string) => void,
): { repo: string; root: string } {
  const repo = mkdtempSync(join(tmpdir(), "rv-registry-"));
  git(repo, "init", "-q", "-b", "main");
  writeFileSync(join(repo, "package.json"), JSON.stringify({ name: "throwaway", version: "9.9.9" }, null, 2) + "\n");

  const root = join(repo, "registry");
  mkdirSync(join(root, "schema"), { recursive: true });
  mkdirSync(join(root, "records"), { recursive: true });
  writeFileSync(join(root, "README.md"), `# throwaway registry\n\n${INTERESTS}\n`);
  writeFileSync(join(root, "schema", "record.schema.json"), readFileSync(join(ROOT, "registry", "schema", "record.schema.json")));

  for (const rec of records) {
    const dir = join(root, "records", String(rec["id"]));
    mkdirSync(join(dir, "run"), { recursive: true });
    const report = `# report for ${String(rec["id"])}\n`;
    writeFileSync(join(dir, "report.md"), report);
    (rec as { report: { path: string; sha256: string; bytes: number } }).report = {
      path: `registry/records/${String(rec["id"])}/report.md`,
      sha256: sha256(Buffer.from(report)),
      bytes: Buffer.byteLength(report),
    };
    extra?.(dir);
    writeFileSync(join(dir, "record.json"), JSON.stringify(rec, null, 2) + "\n");
  }

  commitAll(repo, "the throwaway records");
  writeBuild(root);
  commitAll(repo, "the built index");
  return { repo, root };
}

/** Rewrite a record in place and commit the change, which is what rule 3 forbids. */
function rewriteRecord(root: string, id: string, mutate: (r: RecordJson) => void): void {
  const p = join(root, "records", id, "record.json");
  const rec = JSON.parse(readFileSync(p, "utf8")) as RecordJson;
  mutate(rec);
  writeFileSync(p, JSON.stringify(rec, null, 2) + "\n");
}

describe("registry — a valid registry passes, and the control that says the pass means something", () => {
  it("--check exits clean on a freshly built, committed registry", () => {
    const { root } = makeRegistry();
    const r = check(root);
    expect(r.ok, messages(r)).toBe(true);
    expect(r.failures).toEqual([]);
  });

  it("--check prints one citation row per record, naming the commit that ADDED it", () => {
    const { repo, root } = makeRegistry();
    const r = check(root);
    expect(r.citations.map((c) => c.id)).toEqual(["2026-01-01-throwaway"]);
    // The adding commit is the records commit, never HEAD (which is the index commit).
    const head = git(repo, "rev-parse", "HEAD");
    expect(r.citations[0]!.commit).not.toBe(head);
    expect(r.citations[0]!.commit).toBe(git(repo, "rev-parse", "HEAD~1"));
  });

  // Every assertion above is "no failures", which is also what a check that
  // checked nothing would report. This is the input that separates the two.
  it("negative control: a registry whose index was hand-edited does not pass", () => {
    const { repo, root } = makeRegistry();
    const idx = JSON.parse(readFileSync(join(root, "index.json"), "utf8")) as { records: Array<{ record_bytes: number }> };
    idx.records[0]!.record_bytes = 1;
    writeFileSync(join(root, "index.json"), JSON.stringify(idx, null, 2) + "\n");
    commitAll(repo, "hand-edited index");
    const r = check(root);
    expect(r.ok).toBe(false);
    expect(messages(r)).toContain("index.json does not equal a rebuild");
  });
});

describe("rule 1 — no record without an executed run, pinned inputs, an anchored result and a named consenting human", () => {
  it("an own_work record with consent: null refuses to build", () => {
    expect(() => makeRegistry([validRecord("2026-01-01-throwaway", { consent: null })])).toThrow(/rule 1:[^]*consent: null/);
  });

  it("an observation record CARRYING consent refuses, and one carrying a named party refuses", () => {
    const withConsent = validRecord("2026-01-01-obs", { kind: "observation", record_type: "observation" });
    expect(() => makeRegistry([withConsent])).toThrow(/rule 1:[^]*consent must be null/);

    const named = validRecord("2026-01-01-obs2", { kind: "observation", record_type: "observation", consent: null });
    expect(() => makeRegistry([named])).toThrow(/rule 1:[^]*named_party must be null/);
  });

  it("a record whose executed_run has no command refuses to build", () => {
    const rec = validRecord("2026-01-01-throwaway", { executed_run: { command: "", run_at: "2026-01-01T00:00:00Z", tool_commit: null, outputs: [] } });
    expect(() => makeRegistry([rec])).toThrow(/rule 1:[^]*no record without an executed run/);
  });

  it("an in-tree pinned input that is absent refuses to build", () => {
    const absent = validRecord("2026-01-01-throwaway", {
      pinned_inputs: [{ path: "registry/records/2026-01-01-throwaway/inputs/nope.json", location: "in_tree", sha256: "c".repeat(64), bytes: 3, source: "nowhere", retrieved_at: "2026-01-01T00:00:00Z", holder: null }],
    });
    expect(() => makeRegistry([absent])).toThrow(/rule 1:[^]*in_tree and there is no file/);
  });

  // The case a check that only tested for EXISTENCE would pass: the file is
  // there and its bytes are not the bytes the record names.
  it("an in-tree pinned input that is present and hashes to something else refuses to build", () => {
    const wrong = validRecord("2026-01-01-throwaway", {
      pinned_inputs: [{ path: "registry/records/2026-01-01-throwaway/run/pinned.txt", location: "in_tree", sha256: "c".repeat(64), bytes: 6, source: "nowhere", retrieved_at: "2026-01-01T00:00:00Z", holder: null }],
    });
    expect(() => makeRegistry([wrong], (dir) => writeFileSync(join(dir, "run", "pinned.txt"), "pinned"))).toThrow(/rule 1:[^]*hashes to/);
  });

  // The control: an EXTERNAL pinned input is listed and never checked, which is
  // the whole point of the distinction. If the tool checked those too, no record
  // naming a tarball could ever be built.
  it("negative control: an external pinned input that exists nowhere is listed, not failed", () => {
    const external = validRecord("2026-01-01-throwaway", {
      pinned_inputs: [{ path: null, location: "external", sha256: "d".repeat(64), bytes: 92778, source: "https://example.invalid/x.tgz", retrieved_at: "2026-01-01T00:00:00Z", holder: "somebody else" }],
    });
    const r = check(makeRegistry([external]).root);
    expect(r.ok, messages(r)).toBe(true);
  });
});

describe("rule 2 — the key is (format, format version, upstream digest, verifier version, verified-at), and no vendor name is a key", () => {
  it("two records with the same key refuse to build", () => {
    const a = validRecord("2026-01-01-one");
    const b = validRecord("2026-01-01-two");
    expect(() => makeRegistry([a, b])).toThrow(/rule 2/);
  });

  // The control. Two records that differ ONLY in the verified_at member of the
  // key must both build: if they did not, rule 2 would be rejecting on identity
  // rather than on the key, and every supersession in the registry is exactly a
  // second record about the same artefact.
  it("negative control: two records differing only in verified_at both build", () => {
    const a = validRecord("2026-01-01-one");
    const b = validRecord("2026-01-02-two", { key: { ...(validRecord("x")["key"] as object), verified_at: "2026-01-02" } });
    const { root } = makeRegistry([a, b]);
    const r = check(root);
    expect(r.ok, messages(r)).toBe(true);
  });
});

describe("rule 3 — published records are immutable; a correction is a new record", () => {
  it("a record edited after the commit that added it fails --check, with the wording the rule names", () => {
    const { repo, root } = makeRegistry();
    rewriteRecord(root, "2026-01-01-throwaway", (rec) => {
      (rec["establishes"] as string[]).push("something the published bytes never said");
    });
    commitAll(repo, "quietly reword a published record");
    const r = check(root);
    expect(r.ok).toBe(false);
    expect(messages(r)).toContain("rule 3:");
    expect(messages(r)).toContain("record edited after publication; add a superseding record");
  });

  it("the same edit left UNCOMMITTED in the working tree fails too", () => {
    const { root } = makeRegistry();
    rewriteRecord(root, "2026-01-01-throwaway", (rec) => {
      (rec["establishes"] as string[]).push("an uncommitted reword");
    });
    const r = check(root);
    expect(r.ok).toBe(false);
    expect(messages(r)).toContain("rule 3:");
  });

  // The control: adding a SECOND record must not trip rule 3, or supersession
  // would be impossible and the rule would be forbidding the thing it exists to
  // require.
  it("negative control: adding a superseding record in a later commit is clean", () => {
    const { repo, root } = makeRegistry();
    const superseding = validRecord("2026-01-02-superseding", {
      key: { ...(validRecord("x")["key"] as object), verified_at: "2026-01-02" },
      supersedes: "2026-01-01-throwaway",
      supersession_reason: ["assessment_error"],
    });
    const dir = join(root, "records", "2026-01-02-superseding");
    mkdirSync(dir, { recursive: true });
    const report = "# report for 2026-01-02-superseding\n";
    writeFileSync(join(dir, "report.md"), report);
    superseding["report"] = { path: "registry/records/2026-01-02-superseding/report.md", sha256: sha256(Buffer.from(report)), bytes: Buffer.byteLength(report) };
    writeFileSync(join(dir, "record.json"), JSON.stringify(superseding, null, 2) + "\n");
    // The superseded record gains `superseded_by` and nothing else new -- which
    // IS an edit, and the rule allows exactly this one.
    rewriteRecord(root, "2026-01-01-throwaway", (rec) => {
      rec["status"] = "superseded";
      rec["superseded_by"] = "2026-01-02-superseding";
    });
    commitAll(repo, "the superseding record");
    writeBuild(root);
    commitAll(repo, "rebuild");
    const r = check(root);
    expect(r.ok, messages(r)).toBe(true);
  });
});

describe("rule 4 — every record states what it established and what it did not", () => {
  it("a record with an empty not_established list refuses to build", () => {
    expect(() => makeRegistry([validRecord("2026-01-01-throwaway", { not_established: [] })])).toThrow(/rule 4:[^]*not_established is empty/);
  });

  it("a record with no as_of refuses", () => {
    const rec = validRecord("2026-01-01-throwaway");
    delete (rec as Record<string, unknown>)["as_of"];
    expect(() => makeRegistry([rec])).toThrow(/rule 4|schema/);
  });
});

describe("rule 5 — unverified until re-run, and the label is the build's to write", () => {
  it("derives unverified when there is no independent re-run", () => {
    expect(deriveStatusLabel({ independent_rerun: null, assessor: "A", subject_party: "B" })).toBe("unverified");
  });

  it("derives unverified when the re-runner IS the assessor, or IS the subject's party", () => {
    expect(deriveStatusLabel({ independent_rerun: { by: "A Person" }, assessor: "A Person", subject_party: "B" })).toBe("unverified");
    expect(deriveStatusLabel({ independent_rerun: { by: "B Corp" }, assessor: "A Person", subject_party: "B Corp" })).toBe("unverified");
  });

  it("derives verified only for a third party", () => {
    expect(deriveStatusLabel({ independent_rerun: { by: "Someone Else" }, assessor: "A Person", subject_party: "B Corp" })).toBe("verified");
  });

  it("an index row whose status_label disagrees with the derivation fails --check", () => {
    const { repo, root } = makeRegistry();
    const idx = JSON.parse(readFileSync(join(root, "index.json"), "utf8")) as { records: Array<{ status_label: string }> };
    idx.records[0]!.status_label = "verified";
    writeFileSync(join(root, "index.json"), JSON.stringify(idx, null, 2) + "\n");
    commitAll(repo, "promote a label by hand");
    const r = check(root);
    expect(r.ok).toBe(false);
    expect(messages(r)).toContain("rule 5:");
  });

  it("a record.json carrying a status_label of its own refuses", () => {
    const rec = validRecord("2026-01-01-throwaway", { status_label: "verified" });
    expect(() => makeRegistry([rec])).toThrow(/rule 5|schema/);
  });
});

describe("rule 6 — the review window and the right of reply", () => {
  it("an entry with no review_window refuses to build", () => {
    const entry = validRecord("2026-01-01-entry", { kind: "entry", record_type: "conformance_entry", review_window: null });
    expect(() => makeRegistry([entry])).toThrow(/rule 6/);
  });

  it("an entry whose window is shorter than fourteen days refuses to build", () => {
    const entry = validRecord("2026-01-01-entry", {
      kind: "entry",
      record_type: "conformance_entry",
      methodology: { document: "methodology/v0.3-draft.md", version: "v0.3-draft", sha256: "e".repeat(64) },
      review_window: { sent_on: "2026-01-01", closes_on: "2026-01-08", outcome: "lapsed" },
    });
    expect(() => makeRegistry([entry])).toThrow(/rule 6/);
  });

  // The control: own_work and observation records carry no window, and must not
  // be asked for one -- otherwise no record in this session could be built.
  it("negative control: an own_work record with no review_window is clean", () => {
    const r = check(makeRegistry().root);
    expect(r.ok, messages(r)).toBe(true);
  });
});

describe("rule 7 — the index records the digest of its previous version, and the check walks that chain", () => {
  it("the first committed index carries previous_index_sha256: null", () => {
    const { root } = makeRegistry();
    const idx = JSON.parse(readFileSync(join(root, "index.json"), "utf8")) as { previous_index_sha256: string | null };
    expect(idx.previous_index_sha256).toBeNull();
  });

  it("each later index names the sha256 of the blob at the previous commit that touched it", () => {
    const { repo, root } = makeRegistry();
    const first = git(repo, "rev-parse", "HEAD:registry/index.json");
    const firstBytes = execFileSync("git", ["cat-file", "blob", first], { cwd: repo, maxBuffer: 1 << 26 });

    const second = validRecord("2026-01-02-second", { key: { ...(validRecord("x")["key"] as object), verified_at: "2026-01-02" } });
    const dir = join(root, "records", "2026-01-02-second");
    mkdirSync(dir, { recursive: true });
    const report = "# report for 2026-01-02-second\n";
    writeFileSync(join(dir, "report.md"), report);
    second["report"] = { path: "registry/records/2026-01-02-second/report.md", sha256: sha256(Buffer.from(report)), bytes: Buffer.byteLength(report) };
    writeFileSync(join(dir, "record.json"), JSON.stringify(second, null, 2) + "\n");
    writeBuild(root);
    commitAll(repo, "a second record and the rebuilt index");

    const idx = JSON.parse(readFileSync(join(root, "index.json"), "utf8")) as { previous_index_sha256: string | null };
    expect(idx.previous_index_sha256).toBe(sha256(firstBytes));
    const r = check(root);
    expect(r.ok, messages(r)).toBe(true);
  });

  it("a broken link fails --check and names rule 7", () => {
    const { repo, root } = makeRegistry();
    const idx = JSON.parse(readFileSync(join(root, "index.json"), "utf8")) as Record<string, unknown>;
    idx["previous_index_sha256"] = "f".repeat(64);
    writeFileSync(join(root, "index.json"), JSON.stringify(idx, null, 2) + "\n");
    commitAll(repo, "a link to an index that never existed");
    const r = check(root);
    expect(r.ok).toBe(false);
    expect(messages(r)).toContain("rule 7:");
  });
});

describe("the schema is a closed vocabulary", () => {
  it("an unknown member is rejected", () => {
    expect(() => makeRegistry([validRecord("2026-01-01-throwaway", { vendor_score: 9 })])).toThrow(/schema/);
  });

  it("a kind outside the enum is rejected", () => {
    expect(() => makeRegistry([validRecord("2026-01-01-throwaway", { kind: "gold_star" })])).toThrow(/schema/);
  });

  // The control: the valid record used everywhere above validates, so the two
  // rejections are the schema doing work rather than a validator that rejects
  // everything.
  it("negative control: the valid record validates", () => {
    const { root } = makeRegistry();
    expect(check(root).ok).toBe(true);
  });
});

describe("the committed registry in this repository", () => {
  it("--check exits clean over registry/, which is what CI fails on", () => {
    const r = check(join(ROOT, "registry"));
    expect(r.ok, messages(r)).toBe(true);
  });

  it("the index has one row per record folder in the tree, and no more", () => {
    const { index } = build(join(ROOT, "registry"));
    // `records/` is absent until the first record lands, and git tracks no empty
    // directory, so its absence is the honest reading of "no records", not a
    // reason to skip the comparison.
    const dir = join(ROOT, "registry", "records");
    const onDisk = existsSync(dir)
      ? readdirSync(dir, { withFileTypes: true })
          .filter((e) => e.isDirectory())
          .map((e) => e.name)
          .sort()
      : [];
    expect(index.records.map((r) => r.id)).toEqual(onDisk);
  });

  it("the index carries the Interests paragraph from registry/README.md, one source for the whole tree", () => {
    const { index } = build(join(ROOT, "registry"));
    const readme = readFileSync(join(ROOT, "registry", "README.md"), "utf8");
    expect(readme).toContain(index.interests);
    expect(index.interests.startsWith("Interests. ")).toBe(true);
  });
});
