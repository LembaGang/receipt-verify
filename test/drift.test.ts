// The corpus freshness check (tools/drift.ts), under its own controls.
//
// This tool's whole job is to answer a question about the outside world, so the
// temptation is to test it against the outside world -- which would make the
// suite non-deterministic and, worse, would make every assertion here depend on
// what someone else's repository happens to hold today. Instead:
//
//   git   -- exercised against real git repositories built in a temp directory.
//            Real `git ls-remote`, real shallow clone, real `rev-parse HEAD:<path>`,
//            real blob ids. No network: a file:// URL is not the internet.
//   http  -- exercised through an injected fetch returning canned responses, so
//   ietf     `current`, `changed`, `superseded` and `unreachable` are each reached
//            by a stated status code rather than by hoping a server misbehaves.
//
// Every case asserts the LITERAL outcome string. An outcome that is merely "not
// current" is not a first-class row, and the point of this tool is that each of
// the eight is reportable on its own.
//
// `local` and `no_entry` are exercised against a real git repository built here
// too: `local` reads the object store, so a test that wrote worktree files and
// asserted on them would not be testing what the tool does.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { ROOT } from "./helpers.js";
import { type DriftFetch, type Upstream, checkCorpusDirs, render, runDrift, summaryLine } from "../tools/drift.js";

const tmp = () => mkdtempSync(join(tmpdir(), "drift-test-"));

/**
 * A real git repository, built here. `core.autocrlf=false` and a fixed identity
 * so the blob ids and commit ids are the repository's own and not the machine's;
 * `commit.gpgsign=false` because every commit in THIS repository is signed and a
 * throwaway upstream must not inherit that.
 */
function repo(): { dir: string; url: string; run: (...a: string[]) => string; write: (p: string, s: string) => void; commit: (m: string) => string } {
  const dir = tmp();
  const run = (...a: string[]): string =>
    execFileSync("git", ["-c", "core.autocrlf=false", "-c", "commit.gpgsign=false", "-c", "user.name=drift test", "-c", "user.email=drift@example.invalid", ...a], {
      cwd: dir,
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
    }).trim();
  run("init", "-b", "main", "--quiet", ".");
  const write = (p: string, s: string) => {
    mkdirSync(dirname(join(dir, p)), { recursive: true });
    writeFileSync(join(dir, p), s, "utf8");
  };
  const commit = (m: string): string => {
    run("add", "-A");
    run("commit", "-q", "-m", m);
    return run("rev-parse", "HEAD");
  };
  return { dir, url: pathToFileURL(dir).href, run, write, commit };
}

/** The canned network. Anything not listed throws, so an unplanned request fails loudly. */
const canned = (table: Record<string, { status: number; body?: string } | "throw">): DriftFetch =>
  async (url) => {
    const hit = table[url];
    if (hit === undefined) throw new Error(`unplanned request to ${url}`);
    if (hit === "throw") throw new Error("getaddrinfo ENOTFOUND www.example.invalid");
    return { status: hit.status, body: Buffer.from(hit.body ?? "", "utf8") };
  };

const never: DriftFetch = async (url) => {
  throw new Error(`the git cases must not touch fetch, but ${url} was requested`);
};

// ---------------------------------------------------------------------------
// git
// ---------------------------------------------------------------------------

describe("drift — git", () => {
  const PINNED = "conformance/vectors.json";

  /** A repo whose tip is the pin. */
  function pinned(): { url: string; commit: string; blob: string; sha256: string; r: ReturnType<typeof repo> } {
    const r = repo();
    r.write(PINNED, '{"vectors":[1,2,3]}\n');
    r.write("README.md", "one\n");
    const commit = r.commit("seed");
    const blob = r.run("rev-parse", `HEAD:${PINNED}`);
    const sha256 = execFileSync("git", ["cat-file", "blob", blob], { cwd: r.dir, stdio: ["ignore", "pipe", "pipe"] });
    return { url: r.url, commit, blob, sha256: require("node:crypto").createHash("sha256").update(sha256).digest("hex"), r };
  }

  const entry = (p: ReturnType<typeof pinned>, over: Partial<Upstream> = {}): Upstream => ({
    id: "u", kind: "git", role: "current", repo: p.url, ref: "main",
    pinned_commit: p.commit,
    paths: [{ path: PINNED, pinned_blob: p.blob, sha256: p.sha256 }],
    ...over,
  });

  it("current: the ref's tip is still the pinned commit", async () => {
    const p = pinned();
    const run = await runDrift([entry(p)], never);
    expect(run.results[0]!.outcome).toBe("current");
    expect(run.results[0]!.tip).toBe(p.commit);
    expect(run.code).toBe(0);
  });

  it("moved_untouched: the tip advanced but the pinned path did not", async () => {
    const p = pinned();
    p.r.write("README.md", "two\n");
    const tip = p.r.commit("touch something else");
    expect(tip).not.toBe(p.commit);

    const run = await runDrift([entry(p)], never);
    const res = run.results[0]!;
    expect(res.outcome).toBe("moved_untouched");
    expect(res.tip).toBe(tip);
    expect(res.changed_paths).toBeUndefined();
    // The corpus is still an accurate snapshot, so this does not fail the run.
    expect(run.code).toBe(0);
  });

  it("moved_changed: the pinned path itself moved, and the row names it with both blob ids", async () => {
    const p = pinned();
    p.r.write(PINNED, '{"vectors":[1,2,3,4]}\n');
    const tip = p.r.commit("edit the pinned path");
    const newBlob = p.r.run("rev-parse", `HEAD:${PINNED}`);

    const run = await runDrift([entry(p)], never);
    const res = run.results[0]!;
    expect(res.outcome).toBe("moved_changed");
    expect(res.tip).toBe(tip);
    expect(res.changed_paths).toEqual([
      { path: PINNED, old_blob: p.blob, new_blob: newBlob, new_sha256: expect.stringMatching(/^[0-9a-f]{64}$/) },
    ]);
    expect(res.changed_paths![0]!.new_blob).not.toBe(p.blob);
    expect(run.code).toBe(1);
  });

  it("compares blob ids, not worktree bytes: a CRLF-only difference upstream is still moved_changed", async () => {
    // The autocrlf trap, as an assertion rather than as a comment. This repository
    // is developed on a machine with core.autocrlf=true, where a worktree
    // comparison reports every text file as changed on every run. The control that
    // this is reading the object store: the tool's answer here comes from a blob id
    // that differs, and the clone it makes sets core.autocrlf=false so a checkout
    // could not have manufactured the difference.
    const p = pinned();
    p.r.write(PINNED, '{"vectors":[1,2,3]}\r\n');
    p.r.commit("same text, CRLF");
    const res = (await runDrift([entry(p)], never)).results[0]!;
    expect(res.outcome).toBe("moved_changed");
    expect(res.changed_paths![0]!.new_blob).not.toBe(p.blob);
  });

  it("moved_changed: a pinned path deleted upstream is a change, not an unreachable", async () => {
    const p = pinned();
    p.r.run("rm", "-q", PINNED);
    p.r.commit("delete the pinned path");
    const res = (await runDrift([entry(p)], never)).results[0]!;
    expect(res.outcome).toBe("moved_changed");
    expect(res.changed_paths).toEqual([{ path: PINNED, old_blob: p.blob, new_blob: null, new_sha256: null }]);
  });

  it("moved_untouched when the pin gives a sha256 and no blob id, comparing the blob's bytes", async () => {
    // The 57 TKCollective and ScopeBlind paths in fixtures/upstreams.json carry a
    // sha256 and no blob id, because their provenance rows are raw URLs. They must
    // still be checkable, and still without reading a worktree.
    const p = pinned();
    p.r.write("README.md", "two\n");
    p.r.commit("touch something else");
    const e = entry(p, { paths: [{ path: PINNED, pinned_blob: null, sha256: p.sha256 }] });
    expect((await runDrift([e], never)).results[0]!.outcome).toBe("moved_untouched");

    p.r.write(PINNED, '{"vectors":[9]}\n');
    p.r.commit("now edit it");
    const after = (await runDrift([e], never)).results[0]!;
    expect(after.outcome).toBe("moved_changed");
    expect(after.changed_paths![0]!.old_blob).toBeNull();
    expect(after.changed_paths![0]!.new_sha256).not.toBe(p.sha256);
  });

  it("moved_untouched when no commit was ever pinned: the tip cannot match, the bytes still can", async () => {
    // The ScopeBlind case: fourteen rows pinned from `HEAD`, with no commit
    // recorded. `current` is unreachable for it by construction, and that is the
    // honest answer -- but the question that matters, "did the bytes move?", is
    // still answerable.
    const p = pinned();
    const res = (await runDrift([entry(p, { pinned_commit: null })], never)).results[0]!;
    expect(res.outcome).toBe("moved_untouched");
    expect(res.detail).toContain("no commit was ever pinned");
  });

  it("unreachable: a repository path that does not exist", async () => {
    const gone = join(tmp(), "no-such-repo");
    const res = (await runDrift([{ id: "gone", kind: "git", role: "current", repo: pathToFileURL(gone).href, ref: "main", pinned_commit: "0".repeat(40), paths: [] }], never)).results[0]!;
    expect(res.outcome).toBe("unreachable");
    expect(res.detail).toContain("ls-remote");
    expect(res.tip).toBeNull();
  });

  it("unreachable: the repository exists but the ref does not", async () => {
    const p = pinned();
    const res = (await runDrift([entry(p, { ref: "no-such-branch" })], never)).results[0]!;
    expect(res.outcome).toBe("unreachable");
    expect(res.detail).toContain("resolved no ref");
  });
});

// ---------------------------------------------------------------------------
// check: fail | note, per pinned path
// ---------------------------------------------------------------------------

// The shape B-123 found. `asqav-sdk` pins two paths: `conformance/vectors.json`,
// which IS the graded corpus, and `conformance/manifest.lock.json`, which is the
// author's own bookkeeping about it -- a corpus_version, a licence row, a notice
// row. The manifest moves whenever the author touches anything in the corpus
// directory, including files this repository does not pin, so the daily check
// read `moved_changed` every morning for a path no finding depends on. A red the
// reader learns to ignore is worse than no check.
//
// `check: "note"` says: watch this path, print what it did, do not fail on it.
// `fail` is the DEFAULT and is never written implicitly by anything -- an entry
// that says nothing keeps today's meaning exactly, which is what (c) controls.
describe("drift - check: note per path", () => {
  const VECTORS = "conformance/vectors.json";
  const MANIFEST = "conformance/manifest.lock.json";

  /** A repo pinning two paths, with the pin at the tip. */
  function twoPath(): { r: ReturnType<typeof repo>; commit: string; vectors: string; manifest: string } {
    const r = repo();
    r.write(VECTORS, '{"vectors":[1,2,3]}\n');
    r.write(MANIFEST, '{"corpus_version":6}\n');
    const commit = r.commit("seed");
    return { r, commit, vectors: r.run("rev-parse", `HEAD:${VECTORS}`), manifest: r.run("rev-parse", `HEAD:${MANIFEST}`) };
  }

  const sha = (r: ReturnType<typeof repo>, blob: string): string =>
    createHash("sha256").update(execFileSync("git", ["cat-file", "blob", blob], { cwd: r.dir, stdio: ["ignore", "pipe", "pipe"] })).digest("hex");

  /** An absent `check` means the attribute is absent, not `fail` written out. */
  const twoPathEntry = (p: ReturnType<typeof twoPath>, checks: { vectors?: "fail" | "note"; manifest?: "fail" | "note" }): Upstream => ({
    id: "u", kind: "git", role: "current", repo: p.r.url, ref: "main",
    pinned_commit: p.commit,
    paths: [
      { path: VECTORS, pinned_blob: p.vectors, sha256: sha(p.r, p.vectors), ...(checks.vectors ? { check: checks.vectors } : {}) },
      { path: MANIFEST, pinned_blob: p.manifest, sha256: sha(p.r, p.manifest), ...(checks.manifest ? { check: checks.manifest } : {}) },
    ],
  });

  it("(a) a note path moved and a fail path unmoved is moved_untouched, with the move carried in detail", async () => {
    const p = twoPath();
    p.r.write(MANIFEST, '{"corpus_version":7}\n');
    const tip = p.r.commit("the author's manifest moved; the vectors did not");
    const newManifest = p.r.run("rev-parse", `HEAD:${MANIFEST}`);
    expect(newManifest).not.toBe(p.manifest);

    const run = await runDrift([twoPathEntry(p, { vectors: "fail", manifest: "note" })], never);
    const res = run.results[0]!;
    // The whole point: a differing path that is only noted does not turn the row red.
    expect(res.outcome).toBe("moved_untouched");
    expect(res.tip).toBe(tip);
    expect(run.code).toBe(0);
    // ...and is not silent about it. Named, with both blob ids, in the detail line.
    expect(res.detail).toContain(`noted: ${MANIFEST} ${p.manifest} -> ${newManifest}`);
    // Machine-readable beside the prose: walker/drift.json is consumed, and an
    // agent must not have to parse a sentence to learn which path moved.
    expect(res.noted_paths).toEqual([
      { path: MANIFEST, old_blob: p.manifest, new_blob: newManifest, new_sha256: expect.stringMatching(/^[0-9a-f]{64}$/) },
    ]);
    // A noted path is NOT a changed path. changed_paths is what render() prints
    // under a red row, and a note must never appear there.
    expect(res.changed_paths).toBeUndefined();
  });

  it("(b) the same two paths with the FAIL path moved too is moved_changed, and the note is still carried", async () => {
    const p = twoPath();
    p.r.write(MANIFEST, '{"corpus_version":7}\n');
    p.r.write(VECTORS, '{"vectors":[1,2,3,4]}\n');
    const tip = p.r.commit("both moved");
    const newManifest = p.r.run("rev-parse", `HEAD:${MANIFEST}`);
    const newVectors = p.r.run("rev-parse", `HEAD:${VECTORS}`);

    const run = await runDrift([twoPathEntry(p, { vectors: "fail", manifest: "note" })], never);
    const res = run.results[0]!;
    expect(res.outcome).toBe("moved_changed");
    expect(res.tip).toBe(tip);
    expect(run.code).toBe(1);
    // The fail path, and ONLY the fail path, is the change. The denominator is the
    // fail paths, not every pin: "1 of 2" here would claim the manifest was judged.
    expect(res.changed_paths).toEqual([
      { path: VECTORS, old_blob: p.vectors, new_blob: newVectors, new_sha256: expect.stringMatching(/^[0-9a-f]{64}$/) },
    ]);
    expect(res.detail).toContain("1 of 1 pinned paths differ at the tip");
    // The note survives a red row: an agent reading only changed_paths would
    // otherwise conclude the manifest was unchanged, which is false.
    expect(res.detail).toContain(`noted: ${MANIFEST} ${p.manifest} -> ${newManifest}`);
    expect(res.noted_paths).toHaveLength(1);
  });

  it("(c) regression: an entry with NO check attributes behaves exactly as it did before the attribute existed", async () => {
    const p = twoPath();
    p.r.write(MANIFEST, '{"corpus_version":7}\n');
    const tip = p.r.commit("the author's manifest moved; the vectors did not");
    const newManifest = p.r.run("rev-parse", `HEAD:${MANIFEST}`);

    const run = await runDrift([twoPathEntry(p, {})], never);
    const res = run.results[0]!;
    // The P0 row of B-123, reproduced: same fixture, same two paths, no `check`
    // anywhere -- and it is still red, with the manifest as a CHANGE.
    expect(res.outcome).toBe("moved_changed");
    expect(res.tip).toBe(tip);
    expect(run.code).toBe(1);
    expect(res.changed_paths).toEqual([
      { path: MANIFEST, old_blob: p.manifest, new_blob: newManifest, new_sha256: expect.stringMatching(/^[0-9a-f]{64}$/) },
    ]);
    // Byte-for-byte the wording the tool printed before this attribute existed.
    expect(res.detail).toBe(`main is ${tip} (pinned ${p.commit}); 1 of 2 pinned paths differ at the tip`);
    expect(res.detail).not.toContain("noted:");
    expect(res.noted_paths).toBeUndefined();
  });

  it("an unchanged note path adds nothing at all: the moved_untouched wording is the old one", async () => {
    // The negative control for (a). If `noted:` appeared whenever a note path
    // merely EXISTED, (a) would pass without the tool having compared anything.
    const p = twoPath();
    p.r.write("README.md", "unrelated\n");
    const tip = p.r.commit("touch something neither path pins");

    const res = (await runDrift([twoPathEntry(p, { vectors: "fail", manifest: "note" })], never)).results[0]!;
    expect(res.outcome).toBe("moved_untouched");
    expect(res.detail).toBe(`main is ${tip} (pinned ${p.commit}); all 2 pinned paths unchanged at the tip`);
    expect(res.noted_paths).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// http and ietf-draft, through the injected fetch
// ---------------------------------------------------------------------------

const URL_A = "https://example.invalid/keys.json";
const BODY = '{"public_keys":[]}';
const SHA_BODY = require("node:crypto").createHash("sha256").update(Buffer.from(BODY, "utf8")).digest("hex");

const httpEntry = (over: Partial<Upstream> = {}): Upstream => ({
  id: "keys", kind: "http", role: "current", url: URL_A, sha256: SHA_BODY, retrieved: "2026-09-02T17:42:02Z", ...over,
});

describe("drift — http", () => {
  it("current: the body still digests to the pin", async () => {
    const run = await runDrift([httpEntry()], canned({ [URL_A]: { status: 200, body: BODY } }));
    expect(run.results[0]!.outcome).toBe("current");
    expect(run.results[0]!.tip).toBe(SHA_BODY);
    expect(run.code).toBe(0);
  });

  it("changed: a different body, with both digests in the detail", async () => {
    const run = await runDrift([httpEntry()], canned({ [URL_A]: { status: 200, body: '{"public_keys":[1]}' } }));
    const res = run.results[0]!;
    expect(res.outcome).toBe("changed");
    expect(res.detail).toContain(SHA_BODY);
    expect(res.tip).not.toBe(SHA_BODY);
    expect(run.code).toBe(1);
  });

  it("unreachable: a non-200, and separately a transport error", async () => {
    const notFound = await runDrift([httpEntry()], canned({ [URL_A]: { status: 404 } }));
    expect(notFound.results[0]!.outcome).toBe("unreachable");
    expect(notFound.results[0]!.detail).toContain("404");
    expect(notFound.code).toBe(1);

    const threw = await runDrift([httpEntry()], canned({ [URL_A]: "throw" }));
    expect(threw.results[0]!.outcome).toBe("unreachable");
    expect(threw.results[0]!.detail).toContain("ENOTFOUND");
    expect(threw.code).toBe(1);
  });
});

const DRAFT = "draft-marques-asqav-compliance-receipts";
const NEXT = `https://www.ietf.org/archive/id/${DRAFT}-09.txt`;
const draftEntry = (over: Partial<Upstream> = {}): Upstream => ({
  id: `${DRAFT}-08`, kind: "ietf-draft", role: "current", name: DRAFT, pinned_rev: "08",
  url: `https://www.ietf.org/archive/id/${DRAFT}-08.txt`, sha256: "0".repeat(64), ...over,
});

describe("drift — ietf-draft", () => {
  it("current: the next revision is 404", async () => {
    const run = await runDrift([draftEntry()], canned({ [NEXT]: { status: 404 } }));
    expect(run.results[0]!.outcome).toBe("current");
    expect(run.results[0]!.tip).toBe(`${DRAFT}-08`);
    expect(run.code).toBe(0);
  });

  it("superseded: the next revision is 200, and the run names it", async () => {
    const run = await runDrift([draftEntry()], canned({ [NEXT]: { status: 200 } }));
    const res = run.results[0]!;
    expect(res.outcome).toBe("superseded");
    expect(res.tip).toBe(`${DRAFT}-09`);
    expect(res.detail).toContain(`${DRAFT}-09`);
    expect(run.code).toBe(1);
  });

  it("unreachable: any status that is neither 200 nor 404", async () => {
    // A 500 is not a 404. Reading it as "no higher revision exists" would report a
    // superseded draft as current on the strength of someone else's outage, which
    // is the fail-open this tool must not have.
    const run = await runDrift([draftEntry()], canned({ [NEXT]: { status: 500 } }));
    expect(run.results[0]!.outcome).toBe("unreachable");
    expect(run.results[0]!.detail).toContain("500");
    expect(run.code).toBe(1);
  });

  it("probes exactly NN+1, zero-padded", async () => {
    // `canned` throws on any unplanned URL, so this passes only if -09 is the sole
    // request made -- which is what makes the padding assertion real.
    const run = await runDrift([draftEntry({ pinned_rev: "08" })], canned({ [NEXT]: { status: 404 } }));
    expect(run.results[0]!.outcome).toBe("current");
    const one = await runDrift(
      [draftEntry({ pinned_rev: "01", name: "draft-krausz-verification-state", id: "k" })],
      canned({ "https://www.ietf.org/archive/id/draft-krausz-verification-state-02.txt": { status: 404 } }),
    );
    expect(one.results[0]!.outcome).toBe("current");
  });
});

// ---------------------------------------------------------------------------
// role, exit codes, and the SUMMARY line
// ---------------------------------------------------------------------------

describe("drift — role, exit code and summary", () => {
  it("not_checked: a historical pin is never fetched and never counted as current", async () => {
    // `never` throws on any request, so this passes only because nothing was
    // requested. A historical pin that quietly reported `current` would be the
    // worst row in the file: a superseded snapshot asserting it is the tip.
    const run = await runDrift(
      [{ id: "old", kind: "http", role: "historical", url: URL_A, sha256: SHA_BODY }],
      never,
    );
    expect(run.results[0]!.outcome).toBe("not_checked");
    expect(run.totals.not_checked).toBe(1);
    expect(run.totals.current).toBe(0);
    expect(run.code).toBe(0);
  });

  it("exit 0 when every current-role upstream is current or moved_untouched", async () => {
    const p = repo();
    p.write("a.txt", "one\n");
    const commit = p.commit("seed");
    const run = await runDrift(
      [
        { id: "git", kind: "git", role: "current", repo: p.url, ref: "main", pinned_commit: commit, paths: [] },
        httpEntry(),
        draftEntry(),
        { id: "old", kind: "http", role: "historical", url: URL_A, sha256: SHA_BODY },
      ],
      canned({ [URL_A]: { status: 200, body: BODY }, [NEXT]: { status: 404 } }),
    );
    expect(run.results.map((r) => r.outcome)).toEqual(["current", "current", "current", "not_checked"]);
    expect(run.code).toBe(0);
    expect(summaryLine(run.totals)).toBe(
      "drift: current=3 moved_untouched=0 moved_changed=0 changed=0 superseded=0 unreachable=0 not_checked=1 no_entry=0 noted=0",
    );
  });

  it("exit 1 on any changed, superseded or unreachable among current-role entries", async () => {
    for (const [table, expected] of [
      [{ [URL_A]: { status: 200, body: "different" }, [NEXT]: { status: 404 } }, "changed"],
      [{ [URL_A]: { status: 200, body: BODY }, [NEXT]: { status: 200 } }, "superseded"],
      [{ [URL_A]: { status: 503 }, [NEXT]: { status: 404 } }, "unreachable"],
    ] as const) {
      const run = await runDrift([httpEntry(), draftEntry()], canned(table));
      expect(run.results.map((r) => r.outcome)).toContain(expected);
      expect(run.code, `${expected} must exit 1`).toBe(1);
    }
  });

  it("a failing check on a HISTORICAL entry does not move the exit code", async () => {
    // The other half of the role contract, and it can fail on its own: if role
    // were ignored, this run would exit 1 for a pin nothing claims is current.
    const run = await runDrift(
      [{ id: "old", kind: "http", role: "historical", url: URL_A, sha256: "0".repeat(64) }],
      never,
    );
    expect(run.code).toBe(0);
    expect(run.totals.not_checked).toBe(1);
  });

  it("the SUMMARY line names all eight outcomes and the noted count, always", async () => {
    const run = await runDrift([], never);
    expect(summaryLine(run.totals)).toBe(
      "drift: current=0 moved_untouched=0 moved_changed=0 changed=0 superseded=0 unreachable=0 not_checked=0 no_entry=0 noted=0",
    );
  });
});

// ---------------------------------------------------------------------------
// local -- a corpus this repository authors
// ---------------------------------------------------------------------------

describe("drift - local", () => {
  /** A repository holding one committed file, and the sha256 of its blob. */
  function local(): { root: string; sha: string; r: ReturnType<typeof repo> } {
    const r = repo();
    r.write("fixtures/mine/chain.jsonl", "one\ntwo\n");
    r.commit("seed");
    const bytes = execFileSync("git", ["cat-file", "blob", "HEAD:fixtures/mine/chain.jsonl"], { cwd: r.dir });
    return { root: r.dir, sha: createHash("sha256").update(bytes).digest("hex"), r };
  }

  const entry = (files: Array<{ path: string; sha256: string }>): Upstream =>
    ({ id: "mine/local", kind: "local", role: "current", files }) as unknown as Upstream;

  it("current: every file is at HEAD and digests to the recorded sha256", async () => {
    const p = local();
    const run = await runDrift([entry([{ path: "fixtures/mine/chain.jsonl", sha256: p.sha }])], never, { repoRoot: p.root });
    expect(run.results[0]!.outcome).toBe("current");
    expect(run.code).toBe(0);
  });

  it("changed: a recorded digest that no longer matches, with the path named", async () => {
    const p = local();
    const run = await runDrift([entry([{ path: "fixtures/mine/chain.jsonl", sha256: "0".repeat(64) }])], never, { repoRoot: p.root });
    expect(run.results[0]!.outcome).toBe("changed");
    expect(run.results[0]!.changed_paths![0]!.path).toBe("fixtures/mine/chain.jsonl");
    expect(run.results[0]!.changed_paths![0]!.new_sha256).toBe(p.sha);
    expect(run.code).toBe(1);
  });

  it("changed: a file gone from HEAD, not a shrug", async () => {
    const p = local();
    const run = await runDrift([entry([{ path: "fixtures/mine/deleted.jsonl", sha256: p.sha }])], never, { repoRoot: p.root });
    expect(run.results[0]!.outcome).toBe("changed");
    expect(run.results[0]!.changed_paths![0]!.new_sha256).toBeNull();
    expect(run.code).toBe(1);
  });

  // The control for the whole kind: `local` reads the OBJECT STORE. An uncommitted
  // edit to the worktree must not move the outcome, or every text file on a
  // core.autocrlf machine would report `changed` on every run.
  it("reads the object store: an uncommitted worktree edit does not move the outcome", async () => {
    const p = local();
    const pin = [{ path: "fixtures/mine/chain.jsonl", sha256: p.sha }];
    p.r.write("fixtures/mine/chain.jsonl", "ONE\r\nTWO\r\nthree\r\n");
    const before = await runDrift([entry(pin)], never, { repoRoot: p.root });
    expect(before.results[0]!.outcome).toBe("current");
    // and COMMITTING that edit does move it, so the assertion above is not vacuous
    p.r.commit("edit it");
    const after = await runDrift([entry(pin)], never, { repoRoot: p.root });
    expect(after.results[0]!.outcome).toBe("changed");
  });

  it("never fetches: `never` throws on any request, so reaching an outcome is the assertion", async () => {
    const p = local();
    const run = await runDrift([entry([{ path: "fixtures/mine/chain.jsonl", sha256: p.sha }])], never, { repoRoot: p.root });
    expect(run.results[0]!.kind).toBe("local");
  });

  it("a local entry that names no files is unreachable, never a silent pass", async () => {
    const run = await runDrift([entry([])], never, { repoRoot: ROOT });
    expect(run.results[0]!.outcome).toBe("unreachable");
    expect(run.code).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// no_entry -- the corpus nothing watches
// ---------------------------------------------------------------------------

describe("drift - no_entry", () => {
  // `role: historical` throughout, so nothing here is fetched or digested and
  // every assertion below is about the DIRECTORY rows alone. The three entries
  // exist only to be the three ways a directory can be claimed.
  const claimed = [
    { id: "by-dir", kind: "git", role: "historical", corpus_dirs: ["fixtures/asqav/05c1c49"] },
    { id: "by-file", kind: "http", role: "historical", pinned_file: "refs/some-draft-01.txt" },
    { id: "by-files", kind: "local", role: "historical", files: [{ path: "fixtures/delivery/proven/chain.jsonl", sha256: "x" }] },
  ] as unknown as Upstream[];

  it("no_entry: a corpus directory nothing claims gets a row of its own", async () => {
    const run = await runDrift(claimed, never, { corpusDirs: ["fixtures/nobody-watches-this"] });
    const row = run.results.find((r) => r.id === "fixtures/nobody-watches-this")!;
    expect(row.outcome).toBe("no_entry");
    expect(row.detail).toContain("no entry in fixtures/upstreams.json claims fixtures/nobody-watches-this");
  });

  // What the row does and does not mean, pinned so it cannot drift into the
  // other reading. It answers "does ANYTHING in upstreams.json mention this
  // directory" -- the B-67 failure mode, where a whole corpus was unwatched. It
  // does NOT answer "is every file under it accounted for": an entry naming one
  // file inside a directory is enough to keep the directory off this row, and
  // partial coverage is test/upstream-coverage.test.ts's question, file by file.
  it("a directory is claimed when an entry names a file INSIDE it, not only the directory", async () => {
    const run = await runDrift(claimed, never, { corpusDirs: ["fixtures/delivery"] });
    const row = run.results.find((r) => r.id === "fixtures/delivery")!;
    expect(row.outcome).toBe("not_checked");
    expect(row.detail).toContain("by-files");
  });

  it("no_entry fails the run: a corpus nothing watches has not passed a check, it was never given one", async () => {
    const run = await runDrift([], never, { corpusDirs: ["fixtures/whatever"] });
    expect(run.totals.no_entry).toBe(1);
    expect(run.code).toBe(1);
  });

  // The three ways an entry can claim a directory, asserted separately so a
  // resolver that understood only one of them would still be red here.
  it("a directory claimed by corpus_dirs, by pinned_file or by files is NOT no_entry", async () => {
    const run = await runDrift(claimed, never, {
      corpusDirs: ["fixtures/asqav/05c1c49", "refs", "fixtures/delivery/proven"],
    });
    const by = (id: string) => run.results.find((r) => r.id === id)!;
    expect(by("fixtures/asqav/05c1c49").outcome).toBe("not_checked");
    expect(by("fixtures/asqav/05c1c49").detail).toContain("by-dir");
    expect(by("refs").outcome).toBe("not_checked");
    expect(by("refs").detail).toContain("by-file");
    expect(by("fixtures/delivery/proven").outcome).toBe("not_checked");
    expect(by("fixtures/delivery/proven").detail).toContain("by-files");
    // A claimed directory does not fail the run: nothing here is `no_entry`.
    expect(run.totals.no_entry).toBe(0);
    expect(run.code).toBe(0);
  });

  it("a trailing slash and a Windows separator resolve the same way", async () => {
    const run = await runDrift(claimed, never, { corpusDirs: ["fixtures/asqav/05c1c49/", "fixtures\\asqav\\05c1c49"] });
    expect(run.results.filter((r) => r.outcome === "no_entry")).toEqual([]);
  });

  // The delivery entry carries `corpus_dirs: []` on purpose, so that the pilot
  // capture beside it is NOT resolved to the generator's entry. This is that.
  it("an empty corpus_dirs claims nothing: the delivery entry does not swallow its neighbour", async () => {
    const withEmpty = [
      { id: "delivery-fixtures/local", kind: "local", role: "current", corpus_dirs: [], files: [{ path: "fixtures/delivery/proven/chain.jsonl", sha256: "x" }] },
    ] as unknown as Upstream[];
    const run = await runDrift(withEmpty, never, { corpusDirs: ["fixtures/delivery/pilot-exa-contents"] });
    expect(run.results.find((r) => r.id === "fixtures/delivery/pilot-exa-contents")!.outcome).toBe("no_entry");
  });

  // An `unmapped` row is an accounting, not an absence. A corpus deliberately
  // recorded as unwatchable -- a local clone with no remote, an endpoint that
  // mints a fresh signature per call -- must not be reported as a gap, or the row
  // that exists to name real gaps cries at every deliberate decision in the file.
  it("a directory accounted for by a named unmapped row is not_checked, not no_entry", async () => {
    const rows = [{ id: "cpb-sources", paths: ["cpb/*"], reason: "written in this repository; there is nothing upstream of it" }];
    const run = await runDrift([], never, { corpusDirs: ["cpb"], unmapped: rows });
    const row = run.results.find((r) => r.id === "cpb")!;
    expect(row.outcome).toBe("not_checked");
    expect(row.detail).toContain("cpb-sources");
    expect(run.code).toBe(0);
  });

  // ...and the control for that: the SAME query with the row removed is red. An
  // excuse that would apply whether or not it was written is not an excuse.
  it("negative control: the same directory with no unmapped row IS no_entry", async () => {
    const run = await runDrift([], never, { corpusDirs: ["cpb"], unmapped: [] });
    expect(run.results[0]!.outcome).toBe("no_entry");
    expect(run.code).toBe(1);
  });

  it("an unmapped row for a DIFFERENT directory does not excuse this one", async () => {
    const rows = [{ id: "cpb-sources", paths: ["cpb/*"], reason: "not about fixtures/elsewhere" }];
    const run = await runDrift([], never, { corpusDirs: ["fixtures/elsewhere"], unmapped: rows });
    expect(run.results[0]!.outcome).toBe("no_entry");
  });

  // Every corpus the walker grades must be accounted for in the real file, by an
  // entry or by an unmapped row. This is the end-to-end form of the same claim
  // test/upstream-coverage.test.ts makes file by file, made here through the tool
  // the row exists to serve -- and it opens no socket, because no directory row
  // fetches anything.
  it("every corpus walker/scopes.json names is accounted for in the real fixtures/upstreams.json", async () => {
    const doc = JSON.parse(readFileSync(join(ROOT, "fixtures", "upstreams.json"), "utf8")) as {
      upstreams: Upstream[];
      unmapped: { rows: Array<{ id: string; paths: string[]; reason: string }> };
    };
    const scopes = JSON.parse(readFileSync(join(ROOT, "walker", "scopes.json"), "utf8")) as { corpora: Array<{ dir: string }> };
    const rows = checkCorpusDirs(doc.upstreams, scopes.corpora.map((c) => c.dir), doc.unmapped.rows);
    expect(rows.filter((r) => r.outcome === "no_entry").map((r) => r.id)).toEqual([]);
  });

  // The control: an ordinary run names no directory, so it can never produce this
  // row by accident. `no_entry` is only ever an answer to a question that was asked.
  it("negative control: a run that names no corpus directory produces no no_entry row", async () => {
    const run = await runDrift(claimed, never);
    expect(run.totals.no_entry).toBe(0);
    expect(run.results.map((r) => r.id).sort()).toEqual(["by-dir", "by-file", "by-files"]);
  });
});

// ---------------------------------------------------------------------------
// --record, end to end through the CLI, with no network
// ---------------------------------------------------------------------------

describe("drift — --record writes last_observed and nothing else", () => {
  /** Run the real CLI against a temp upstreams file. Local git only: no network. */
  function cli(upstreams: string, report: string, record: boolean): number {
    const args = ["tsx", join(ROOT, "tools", "drift.ts"), "--upstreams", upstreams, "--report", report];
    if (record) args.push("--record");
    try {
      execFileSync("npx", args, { cwd: ROOT, stdio: "pipe", shell: process.platform === "win32" });
      return 0;
    } catch (e) {
      return Number((e as { status?: number }).status ?? -1);
    }
  }

  function fixture(): { path: string; report: string; commit: string } {
    const p = repo();
    p.write("conformance/vectors.json", '{"vectors":[]}\n');
    const commit = p.commit("seed");
    const blob = p.run("rev-parse", "HEAD:conformance/vectors.json");
    const dir = tmp();
    const doc = {
      version: 1,
      note: "throwaway",
      upstreams: [
        { id: "live", kind: "git", role: "current", repo: p.url, ref: "main", pinned_commit: commit, paths: [{ path: "conformance/vectors.json", pinned_blob: blob, sha256: "unused-when-the-blob-id-matches" }] },
        { id: "kept", kind: "git", role: "historical", repo: p.url, ref: "main", pinned_commit: commit, paths: [] },
      ],
    };
    const path = join(dir, "upstreams.json");
    writeFileSync(path, JSON.stringify(doc, null, 2) + "\n", "utf8");
    return { path, report: join(dir, "drift.json"), commit };
  }

  it("a plain run leaves the file byte-identical", async () => {
    const f = fixture();
    const before = readFileSync(f.path);
    expect(cli(f.path, f.report, false)).toBe(0);
    expect(readFileSync(f.path).equals(before)).toBe(true);
  });

  it("--record adds exactly the last_observed member, on the checked entry only", async () => {
    const f = fixture();
    const before = JSON.parse(readFileSync(f.path, "utf8")) as { upstreams: Upstream[] };
    expect(cli(f.path, f.report, true)).toBe(0);
    const after = JSON.parse(readFileSync(f.path, "utf8")) as { upstreams: Upstream[] };

    // Diff the file: every member of every entry is unchanged except for the one
    // added key. Asserting only "last_observed exists" would pass a --record that
    // also rewrote a pinned digest.
    expect(after.upstreams.length).toBe(before.upstreams.length);
    for (let i = 0; i < after.upstreams.length; i++) {
      const { last_observed: added, ...rest } = after.upstreams[i]!;
      const { last_observed: wasThere, ...was } = before.upstreams[i]!;
      expect(wasThere).toBeUndefined();
      expect(rest).toEqual(was);
      if (before.upstreams[i]!.role === "current") {
        expect(added).toEqual({ tip: f.commit, at: expect.stringMatching(/^\d{4}-\d\d-\d\dT/), outcome: "current" });
      } else {
        // A historical entry is never fetched, so there is no observation to
        // record for it, and inventing one would make the file claim a run it
        // never made.
        expect(added).toBeUndefined();
      }
    }
    // Nothing outside `upstreams` moved either.
    const strip = (d: { upstreams: unknown }) => ({ ...d, upstreams: undefined });
    expect(strip(after)).toEqual(strip(before));
  });

  it("--record is the only mode that writes, and a second --record is idempotent but for `at`", async () => {
    const f = fixture();
    expect(cli(f.path, f.report, true)).toBe(0);
    const first = JSON.parse(readFileSync(f.path, "utf8")) as { upstreams: Upstream[] };
    expect(cli(f.path, f.report, true)).toBe(0);
    const second = JSON.parse(readFileSync(f.path, "utf8")) as { upstreams: Upstream[] };
    expect(second.upstreams[0]!.last_observed!.tip).toBe(first.upstreams[0]!.last_observed!.tip);
    expect(second.upstreams[0]!.last_observed!.outcome).toBe("current");
  });
});

// ---------------------------------------------------------------------------
// B-151: `check: note` on an http entry.
//
// The per-path attribute has existed for git entries since aa6e7b6. An http
// entry pins one body and has no `paths` array, so until now every http pin was
// `fail` with no way to say otherwise — and three of the pins this repository
// needs are mutable BY DESIGN: a registry pointer that is meant to move, a
// status file carrying errata, and a key file the issuer has said will keep
// moving. Under `fail` each of them reds the daily check for doing what it is
// for, which is the failure mode B-123 recorded: a red the reader learns to
// ignore is worse than no check at all.
//
// Both directions are tested, because both are the failure mode. A noted entry
// that silently fails would make the attribute useless; a failing entry that
// silently notes would hide exactly the change the tool exists to make loud.
// ---------------------------------------------------------------------------

const URL_B = "https://example.invalid/other.json";

describe("drift - check: note on an http entry (B-151)", () => {
  it("(a) default and explicit `fail`: a moved body is `changed`, is not noted, and reds the run", async () => {
    for (const over of [{}, { check: "fail" as const }]) {
      const run = await runDrift(
        [httpEntry(over)],
        canned({ [URL_A]: { status: 200, body: '{"public_keys":[1]}' } }),
      );
      const res = run.results[0]!;
      expect(res.outcome).toBe("changed");
      expect(res.noted).not.toBe(true);
      expect(run.totals.noted).toBe(0);
      expect(run.code).toBe(1);
    }
  });

  it("(b) `note`: a moved body is still `changed`, is marked noted, and does NOT red the run", async () => {
    const run = await runDrift(
      [httpEntry({ check: "note", check_reason_code: "mutable_pointer" })],
      canned({ [URL_A]: { status: 200, body: '{"public_keys":[1]}' } }),
    );
    const res = run.results[0]!;
    // The body DID change and the row says so: `note` decides what the change
    // means, never whether it happened.
    expect(res.outcome).toBe("changed");
    expect(res.noted).toBe(true);
    expect(res.detail).toContain(SHA_BODY);
    expect(res.tip).not.toBe(SHA_BODY);
    expect(run.totals.noted).toBe(1);
    expect(run.code).toBe(0);
  });

  it("(c) `note` changes nothing when the body has not moved", async () => {
    const run = await runDrift(
      [httpEntry({ check: "note", check_reason_code: "mutable_pointer" })],
      canned({ [URL_A]: { status: 200, body: BODY } }),
    );
    expect(run.results[0]!.outcome).toBe("current");
    expect(run.results[0]!.noted).not.toBe(true);
    expect(run.totals.noted).toBe(0);
    expect(run.code).toBe(0);
  });

  it("(d) `note` does not swallow `unreachable`: a check that could not be made has not passed", async () => {
    // The whole point of the attribute is that a KNOWN mover is not a failure.
    // A 404 is not a known mover; it is the upstream disappearing.
    const run = await runDrift(
      [httpEntry({ check: "note", check_reason_code: "mutable_pointer" })],
      canned({ [URL_A]: { status: 404 } }),
    );
    expect(run.results[0]!.outcome).toBe("unreachable");
    expect(run.code).toBe(1);
  });

  it("(e) the SUMMARY line carries noted=N after the outcome counts", async () => {
    const run = await runDrift(
      [
        httpEntry({ id: "noted-one", check: "note", check_reason_code: "mutable_pointer" }),
        httpEntry({ id: "failing-one", url: URL_B, sha256: SHA_BODY }),
      ],
      canned({
        [URL_A]: { status: 200, body: '{"public_keys":[1]}' },
        [URL_B]: { status: 200, body: '{"public_keys":[2]}' },
      }),
    );
    expect(run.totals.changed).toBe(2);
    expect(run.totals.noted).toBe(1);
    // changed counts every body that moved; noted says how many of them were
    // reported rather than failed. failing = changed - noted, and it is 1.
    expect(summaryLine(run.totals)).toContain("changed=2");
    expect(summaryLine(run.totals)).toContain("noted=1");
    expect(run.code).toBe(1);
  });

  it("(f) the rendered row marks a noted change, so it does not read as a change let through", async () => {
    const run = await runDrift(
      [httpEntry({ check: "note", check_reason_code: "mutable_pointer" })],
      canned({ [URL_A]: { status: 200, body: '{"public_keys":[1]}' } }),
    );
    const line = render(run).find((l) => l.includes("keys"))!;
    expect(line).toContain("(NOTE)");
  });
});
