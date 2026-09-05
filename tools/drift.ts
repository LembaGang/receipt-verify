#!/usr/bin/env tsx
/**
 * The corpus freshness (drift) check.
 *
 * Every pinned corpus under `fixtures/` and every text under `refs/` is a dated
 * snapshot. Until this tool, none of them carried a recorded relation to the
 * upstream it came from, so nothing in this repository could answer "has the
 * upstream of this pin moved since it was pinned, and did the pinned bytes move
 * with it?". The M6 closure run of 2026-09-05 found Joao's corpus two commits
 * ahead of its pin only because a human had written an expected count into a
 * handoff and the count came out wrong. A finding that silently describes a
 * superseded upstream reads as current and cites a commit; as agents rather than
 * people consume these findings, that is worse than no finding at all.
 *
 * `fixtures/upstreams.json` is the record. This tool reads it and reports ONE
 * outcome per upstream, each a first-class row rather than a pass/fail:
 *
 *   current          the tip / body / revision is exactly what was pinned
 *   moved_untouched  git: the tip moved, every pinned path is byte-unchanged
 *   moved_changed    git: at least one pinned path differs; each is listed
 *   changed          http: the body's sha256 differs; both digests printed
 *   superseded       ietf-draft: a higher revision exists; it is named
 *   unreachable      the check could not be made, with the error text
 *   not_checked      role: historical -- printed, never counted as current
 *
 * Exit 0 only when every `role: current` upstream is `current` or
 * `moved_untouched`. `unreachable` is never silently a 0: a check that could not
 * be made has not passed.
 *
 * Blob ids compare, never worktree bytes. `core.autocrlf` is true on the machine
 * this repository is developed on, so a comparison against a checked-out file
 * would report a change on every text file on every run (the trap recorded at
 * fixtures/provenance.md line 398). Every git comparison here reads the object
 * store: `git rev-parse HEAD:<path>` for the id, `git cat-file blob <id>` for the
 * bytes when the provenance row gave a sha256 and no blob id.
 *
 *   npm run drift             # read-only; writes walker/drift.json (gitignored)
 *   npm run drift -- --record # ALSO writes last_observed into upstreams.json
 *
 * `--record` is the only mode that touches a tracked file, and a `--record` run
 * is a change to commit deliberately, never a side effect of looking.
 */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));

export type Outcome =
  | "current"
  | "moved_untouched"
  | "moved_changed"
  | "changed"
  | "superseded"
  | "unreachable"
  | "not_checked";

/** The eight rows, in the order the SUMMARY line prints them. */
export const OUTCOMES: Outcome[] = [
  "current",
  "moved_untouched",
  "moved_changed",
  "changed",
  "superseded",
  "unreachable",
  "not_checked",
];

export interface PathPin {
  path: string;
  /** The upstream blob id, where the provenance row gives one. Null when it gives only a sha256. */
  pinned_blob: string | null;
  sha256: string;
}

export interface Upstream {
  id: string;
  kind: "git" | "http" | "ietf-draft";
  role: "current" | "historical";
  // git
  repo?: string;
  ref?: string;
  pinned_commit?: string | null;
  paths?: PathPin[];
  // http
  url?: string;
  sha256?: string;
  retrieved?: string;
  // ietf-draft
  name?: string;
  pinned_rev?: string;
  // written by --record
  last_observed?: { tip: string | null; at: string; outcome: Outcome };
  [k: string]: unknown;
}

export interface PathChange {
  path: string;
  old_blob: string | null;
  new_blob: string | null;
  new_sha256: string | null;
}

export interface Result {
  id: string;
  kind: Upstream["kind"];
  role: Upstream["role"];
  outcome: Outcome;
  /** git: the resolved tip. http: the body's sha256. ietf-draft: the highest revision observed. */
  tip: string | null;
  detail: string;
  changed_paths?: PathChange[];
}

/**
 * The network, injected. Tests exercise `http` and `ietf-draft` through canned
 * responses and never open a socket; the git cases run against real bare
 * repositories in a temp directory, which is also not the network.
 */
export type DriftFetch = (url: string, method: "GET" | "HEAD") => Promise<{ status: number; body: Buffer }>;

const sha256Hex = (b: Buffer): string => createHash("sha256").update(b).digest("hex");

const realFetch: DriftFetch = async (url, method) => {
  const res = await fetch(url, { method, redirect: "follow" });
  const body = method === "HEAD" ? Buffer.alloc(0) : Buffer.from(await res.arrayBuffer());
  return { status: res.status, body };
};

const git = (args: string[], cwd?: string): string =>
  execFileSync("git", args, { cwd, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }).trim();

const errText = (e: unknown): string => {
  const x = e as { stderr?: Buffer | string; message?: string };
  const se = x.stderr === undefined ? "" : String(x.stderr).trim();
  return (se || x.message || String(e)).split(/\r?\n/).slice(0, 3).join(" / ");
};

// ---------------------------------------------------------------------------
// git
// ---------------------------------------------------------------------------

function checkGit(u: Upstream): Result {
  const base = { id: u.id, kind: u.kind, role: u.role } as const;
  const repo = String(u.repo);
  const ref = String(u.ref ?? "HEAD");

  let tip: string;
  try {
    const out = git(["ls-remote", repo, ref]);
    const first = out.split(/\r?\n/).find((l) => l.trim() !== "");
    if (!first) {
      return { ...base, outcome: "unreachable", tip: null, detail: `git ls-remote ${repo} ${ref} resolved no ref` };
    }
    tip = first.split(/\s+/)[0]!;
  } catch (e) {
    return { ...base, outcome: "unreachable", tip: null, detail: `git ls-remote ${repo} ${ref}: ${errText(e)}` };
  }

  if (u.pinned_commit && tip === u.pinned_commit) {
    return { ...base, outcome: "current", tip, detail: `${ref} is still ${tip}` };
  }

  // The tip moved (or was never pinned). Only now is a clone worth making.
  const pins = u.paths ?? [];
  const dir = mkdtempSync(join(tmpdir(), "drift-"));
  try {
    const args = ["clone", "--depth", "1", "--quiet", "--config", "core.autocrlf=false"];
    if (ref !== "HEAD") args.push("--branch", ref);
    args.push(repo, dir);
    try {
      git(args);
    } catch (e) {
      return { ...base, outcome: "unreachable", tip, detail: `shallow clone of ${repo} at ${ref}: ${errText(e)}` };
    }

    let head = tip;
    try {
      head = git(["rev-parse", "HEAD"], dir);
    } catch {
      /* keep the ls-remote tip */
    }
    const raced = head !== tip ? ` (the clone landed on ${head}, not the ${tip} ls-remote reported; the ref moved mid-run and the blobs below are ${head}'s)` : "";

    const changed: PathChange[] = [];
    for (const p of pins) {
      let blob: string | null = null;
      try {
        blob = git(["rev-parse", `HEAD:${p.path}`], dir);
      } catch {
        changed.push({ path: p.path, old_blob: p.pinned_blob, new_blob: null, new_sha256: null });
        continue;
      }
      if (p.pinned_blob) {
        if (blob !== p.pinned_blob) {
          changed.push({ path: p.path, old_blob: p.pinned_blob, new_blob: blob, new_sha256: blobSha(dir, blob) });
        }
        continue;
      }
      // No blob id in the provenance row: digest the blob's bytes from the object
      // store and compare that. Still never a worktree file.
      const now = blobSha(dir, blob);
      if (now !== p.sha256) {
        changed.push({ path: p.path, old_blob: null, new_blob: blob, new_sha256: now });
      }
    }

    const pinned = u.pinned_commit ? `pinned ${u.pinned_commit}` : "no commit was ever pinned for this source";
    if (changed.length === 0) {
      return {
        ...base,
        outcome: "moved_untouched",
        tip: head,
        detail: `${ref} is ${head} (${pinned}); all ${pins.length} pinned path${pins.length === 1 ? "" : "s"} unchanged at the tip${raced}`,
      };
    }
    return {
      ...base,
      outcome: "moved_changed",
      tip: head,
      detail: `${ref} is ${head} (${pinned}); ${changed.length} of ${pins.length} pinned paths differ at the tip${raced}`,
      changed_paths: changed,
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function blobSha(dir: string, blob: string): string | null {
  try {
    const bytes = execFileSync("git", ["cat-file", "blob", blob], { cwd: dir, stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 28 });
    return sha256Hex(Buffer.from(bytes));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// http
// ---------------------------------------------------------------------------

async function checkHttp(u: Upstream, fetchFn: DriftFetch): Promise<Result> {
  const base = { id: u.id, kind: u.kind, role: u.role } as const;
  const url = String(u.url);
  let res: { status: number; body: Buffer };
  try {
    res = await fetchFn(url, "GET");
  } catch (e) {
    return { ...base, outcome: "unreachable", tip: null, detail: `GET ${url}: ${errText(e)}` };
  }
  if (res.status !== 200) {
    return { ...base, outcome: "unreachable", tip: null, detail: `GET ${url} returned HTTP ${res.status}` };
  }
  const now = sha256Hex(res.body);
  if (now === u.sha256) {
    return { ...base, outcome: "current", tip: now, detail: `${url} still digests to the pin (${res.body.length} bytes)` };
  }
  return {
    ...base,
    outcome: "changed",
    tip: now,
    detail: `${url}: pinned ${String(u.sha256)}, now ${now} (${res.body.length} bytes)`,
  };
}

// ---------------------------------------------------------------------------
// ietf-draft
// ---------------------------------------------------------------------------

async function checkDraft(u: Upstream, fetchFn: DriftFetch): Promise<Result> {
  const base = { id: u.id, kind: u.kind, role: u.role } as const;
  const name = String(u.name);
  const rev = String(u.pinned_rev);
  const next = String(Number(rev) + 1).padStart(2, "0");
  const url = `https://www.ietf.org/archive/id/${name}-${next}.txt`;
  let res: { status: number; body: Buffer };
  try {
    res = await fetchFn(url, "HEAD");
  } catch (e) {
    return { ...base, outcome: "unreachable", tip: null, detail: `HEAD ${url}: ${errText(e)}` };
  }
  if (res.status === 200) {
    return {
      ...base,
      outcome: "superseded",
      tip: `${name}-${next}`,
      detail: `${name}-${next} exists at the archive; this repository pins -${rev}. Only -${next} is probed, so a still higher revision would not be named here.`,
    };
  }
  if (res.status === 404) {
    return { ...base, outcome: "current", tip: `${name}-${rev}`, detail: `${name}-${next} is 404; -${rev} is the highest revision published` };
  }
  return { ...base, outcome: "unreachable", tip: null, detail: `HEAD ${url} returned HTTP ${res.status}, which is neither 200 nor 404` };
}

// ---------------------------------------------------------------------------
// The run
// ---------------------------------------------------------------------------

export interface DriftRun {
  results: Result[];
  totals: Record<Outcome, number>;
  code: number;
}

export async function runDrift(upstreams: Upstream[], fetchFn: DriftFetch = realFetch): Promise<DriftRun> {
  const results: Result[] = [];
  for (const u of upstreams) {
    if (u.role === "historical") {
      results.push({
        id: u.id,
        kind: u.kind,
        role: u.role,
        outcome: "not_checked",
        tip: null,
        detail: "role: historical -- kept for a finding, not as the current corpus, so nothing claims it is the tip",
      });
      continue;
    }
    if (u.kind === "git") results.push(checkGit(u));
    else if (u.kind === "http") results.push(await checkHttp(u, fetchFn));
    else results.push(await checkDraft(u, fetchFn));
  }

  const totals = Object.fromEntries(OUTCOMES.map((o) => [o, 0])) as Record<Outcome, number>;
  for (const r of results) totals[r.outcome]++;

  // Exit 0 ONLY when every current-role upstream is current or moved_untouched.
  // unreachable is a failure, not a shrug: a check that could not be made has not
  // passed, and an upstream that silently stops resolving is exactly the state
  // this tool exists to make loud.
  const bad = results.filter((r) => r.role === "current" && r.outcome !== "current" && r.outcome !== "moved_untouched");
  return { results, totals, code: bad.length > 0 ? 1 : 0 };
}

export function summaryLine(totals: Record<Outcome, number>): string {
  return "drift: " + OUTCOMES.map((o) => `${o}=${totals[o]}`).join(" ");
}

/** Print one line per upstream, then the SUMMARY. Returns the lines, for the tests. */
export function render(run: DriftRun): string[] {
  const out: string[] = ["== corpus drift =="];
  const w = Math.max(...run.results.map((r) => r.id.length));
  for (const r of run.results) {
    out.push(`  ${r.outcome.toUpperCase().padEnd(16)} ${r.id.padEnd(w)}  ${r.detail}`);
    for (const c of r.changed_paths ?? []) {
      out.push(`      ${c.path}`);
      out.push(`          old blob : ${c.old_blob ?? "(not recorded; the pin gave a sha256 only)"}`);
      out.push(`          new blob : ${c.new_blob ?? "(the path does not exist at the tip)"}`);
      out.push(`          new sha256: ${c.new_sha256 ?? "n/a"}`);
    }
  }
  out.push("");
  out.push(summaryLine(run.totals));
  return out;
}

/**
 * Write `last_observed` into fixtures/upstreams.json and nothing else.
 *
 * Only entries that were actually checked get one. A `historical` entry is never
 * fetched, so there is no observation to record for it, and inventing one would
 * make the file assert something no run ever saw.
 */
export function recordObservations(doc: { upstreams: Upstream[] }, results: Result[], at: string): void {
  const byId = new Map(results.map((r) => [r.id, r]));
  for (const u of doc.upstreams) {
    const r = byId.get(u.id);
    if (!r || r.outcome === "not_checked") continue;
    u.last_observed = { tip: r.tip, at, outcome: r.outcome };
  }
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const argOf = (n: string): string | undefined => {
    const i = argv.indexOf(n);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const record = argv.includes("--record");
  const UPSTREAMS = resolve(argOf("--upstreams") ?? join(REPO, "fixtures", "upstreams.json"));
  const REPORT = resolve(argOf("--report") ?? join(REPO, "walker", "drift.json"));

  const doc = JSON.parse(readFileSync(UPSTREAMS, "utf8")) as { upstreams: Upstream[] };
  const run = await runDrift(doc.upstreams);

  for (const line of render(run)) console.log(line);

  const at = new Date().toISOString();
  const body = {
    results: [...run.results].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
    totals: run.totals,
    exit_code: run.code,
  };
  writeFileSync(REPORT, JSON.stringify({ header: { tool: "tools/drift.ts", run_at: at, upstreams: "fixtures/upstreams.json" }, body }, null, 2) + "\n", "utf8");

  if (record) {
    recordObservations(doc, run.results, at);
    writeFileSync(UPSTREAMS, JSON.stringify(doc, null, 2) + "\n", "utf8");
    console.log(`recorded last_observed for ${run.results.filter((r) => r.outcome !== "not_checked").length} checked upstreams in ${UPSTREAMS}`);
  }
  return run.code;
}

// Only run as a CLI. Imported by the tests, this module must do nothing.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().then(
    (code) => process.exit(code),
    (e) => {
      console.error(e);
      process.exit(2);
    },
  );
}
