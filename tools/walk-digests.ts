#!/usr/bin/env tsx
/**
 * The digest walker.
 *
 * M6 was a derived literal that was correct on 2026-05-18, went stale at one
 * upstream commit on 2026-08-04, and stayed green for 29 days because the only
 * tests that named it recomputed the expectation with the function under test.
 * This repository pins six corpora as evidence and, before this tool, asserted
 * nothing about the internal consistency of any of them.
 *
 * The walker recomputes every declared digest in the pinned corpora under the
 * scope its OWN governing document names -- walker/scopes.json carries those
 * scopes with the document and line range for each -- and reports agreement or
 * disagreement. It reads corpus files as bytes and never through an adapter, so
 * a bug in this repository's verifiers cannot make a corpus look consistent.
 *
 * Two serialisers. Every jcs(...) construction is canonicalized by the
 * repository's TypeScript JCS AND, independently, by the Python JCS in
 * tools/asqav_envelope_hash.py (via tools/jcs-cross-check.py, which imports it
 * unmodified). A digest is only compared when both agree on the bytes; a
 * disagreement is its own outcome, `serializer_disagreement`, and is never
 * resolved in favour of either side. Agreement between a serialiser and itself
 * is not evidence, which is the whole reason M6 survived.
 *
 * Exit 0 when every registered field matches. Exit 1 on any mismatch or any
 * serializer disagreement. Unregistered fields are listed and counted; they do
 * not fail the run, because a field whose scope no document states is not a
 * field this repository can call wrong. A REFUSAL by one serialiser -- as opposed
 * to a disagreement between two -- may be registered in walker/scopes.json under
 * `expected_refusals`, in which case it is reported as `expected_refusal`, printed
 * with its reason and with what it leaves ungraded, and does not fail the run. The
 * entry must match the corpus, the file, the pointer and the exact refusal text,
 * so no other refusal and no byte disagreement can slip through it.
 *
 *   npm run walk            # writes walker/report.json
 */

import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { jcs } from "@headlessoracle/chirindo/dist/vendor/recorder/index.js";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));

// --root lets the walker read corpora from somewhere other than this checkout,
// without a copy of the registry travelling with them. Two uses: the negative
// control mutates a throwaway copy rather than a pinned fixture, and the watch
// loop this tool is meant to become walks a freshly fetched tree.
const argv = process.argv.slice(2);
const argOf = (name: string): string | undefined => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const ROOT = resolve(argOf("--root") ?? REPO);
const REPORT = resolve(argOf("--report") ?? join(REPO, "walker", "report.json"));
// --scopes walks a registry other than this checkout's. The control for the
// rule_idle row needs a rule that is deliberately misapplied, and writing one
// into the committed registry to test it would be the mistake the row exists to
// catch. Reading only: nothing is written back here.
const SCOPES = resolve(argOf("--scopes") ?? join(REPO, "walker", "scopes.json"));

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

type Outcome = "match" | "mismatch" | "unregistered" | "serializer_disagreement" | "expected_refusal" | "rule_idle";

interface Row {
  corpus: string;
  file: string;
  /** Null on a rule_idle row: the row is about a rule, not about a field. */
  pointer: string | null;
  rule: string | null;
  scope: string | null;
  document: string | null;
  lines: string | null;
  status: string | null;
  encoding: string | null;
  declared: string | null;
  recomputed: string | null;
  outcome: Outcome;
  note?: string;
}

// ---------------------------------------------------------------------------
// The second serialiser: one long-lived Python process, line-delimited JSON.
// ---------------------------------------------------------------------------

class PythonJcs {
  private proc: ReturnType<typeof spawn>;
  private buf = "";
  private pending = new Map<string, (r: Record<string, Json>) => void>();
  private next = 0;
  private closed: Promise<void>;

  constructor() {
    this.proc = spawn("python", [join(REPO, "tools", "jcs-cross-check.py")], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    this.proc.stdout!.setEncoding("utf8");
    this.proc.stdout!.on("data", (chunk: string) => {
      this.buf += chunk;
      let nl: number;
      while ((nl = this.buf.indexOf("\n")) >= 0) {
        const line = this.buf.slice(0, nl);
        this.buf = this.buf.slice(nl + 1);
        if (!line.trim()) continue;
        const msg = JSON.parse(line) as Record<string, Json>;
        const cb = this.pending.get(String(msg["id"]));
        if (cb) {
          this.pending.delete(String(msg["id"]));
          cb(msg);
        }
      }
    });
    let stderr = "";
    this.proc.stderr!.setEncoding("utf8");
    this.proc.stderr!.on("data", (c: string) => (stderr += c));
    this.closed = new Promise((res, rej) => {
      this.proc.on("error", (e) => rej(new Error(`cannot start the Python serialiser: ${e.message}`)));
      this.proc.on("close", (code) => {
        if (this.pending.size > 0) {
          rej(new Error(`the Python serialiser exited (code ${code}) with requests outstanding: ${stderr}`));
        } else res();
      });
    });
  }

  serialize(value: Json): Promise<{ len: number; sha256: string; jcs?: string; error?: string }> {
    const id = String(this.next++);
    return new Promise((res) => {
      this.pending.set(id, (msg) =>
        res({
          len: Number(msg["len"] ?? -1),
          sha256: String(msg["sha256"] ?? ""),
          jcs: msg["jcs"] === undefined ? undefined : String(msg["jcs"]),
          error: msg["error"] === undefined ? undefined : String(msg["error"]),
        }),
      );
      this.proc.stdin!.write(JSON.stringify({ id, value }) + "\n");
    });
  }

  async end(): Promise<void> {
    this.proc.stdin!.end();
    await this.closed;
  }
}

// ---------------------------------------------------------------------------
// Digest helpers. `canon` is the single place both serialisers are consulted.
// ---------------------------------------------------------------------------

const sha256Hex = (b: Uint8Array | string): string =>
  createHash("sha256")
    .update(typeof b === "string" ? Buffer.from(b, "utf8") : b)
    .digest("hex");

const hexToB64 = (hex: string): string => Buffer.from(hex, "hex").toString("base64");
const hexToB64u = (hex: string): string =>
  Buffer.from(hex, "hex").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

interface Canon {
  ok: boolean;
  bytes?: Buffer;
  detail?: string;
  /**
   * Set ONLY when the Python side refused the value outright, never when the two
   * serialisers produced different bytes. A refusal and a disagreement are not the
   * same event: one serialiser declining to emit bytes it cannot stand behind can
   * be a registered, reviewed allowance; two serialisers emitting different bytes
   * for the same value never can be.
   */
  refusal?: string;
}

let py: PythonJcs;

/** Canonicalize with both serialisers. Returns not-ok when they disagree. */
async function canon(value: Json): Promise<Canon> {
  let ts: string;
  try {
    ts = jcs(value) as string;
  } catch (e) {
    return { ok: false, detail: `TypeScript JCS threw: ${(e as Error).message}` };
  }
  const tsBytes = Buffer.from(ts, "utf8");
  const other = await py.serialize(value);
  if (other.error) {
    return {
      ok: false,
      detail: `Python JCS refused the value: ${other.error}; TypeScript produced ${tsBytes.length} bytes`,
      refusal: other.error,
    };
  }
  const tsHash = sha256Hex(tsBytes);
  if (other.len !== tsBytes.length || other.sha256 !== tsHash) {
    return {
      ok: false,
      detail:
        `TypeScript ${tsBytes.length}B sha256 ${tsHash} vs Python ${other.len}B sha256 ${other.sha256}. ` +
        `TS: ${ts.slice(0, 200)} | PY: ${(other.jcs ?? "").slice(0, 200)}`,
    };
  }
  return { ok: true, bytes: tsBytes };
}

/**
 * Decode a declared digest to its raw bytes, whatever alphabet and padding the
 * corpus wrote it in. The walker is looking for wrong BYTES; base64 vs base64url,
 * or a present vs absent '=', is a notation difference and must never be reported
 * as a digest difference. Returns null when the string is not a 32-byte digest.
 */
function declaredBytes(s: string): Buffer | null {
  const m = /^(?:sha256[:-])?([0-9a-fA-F]{64})$/.exec(s);
  if (m) return Buffer.from(m[1]!.toLowerCase(), "hex");
  if (/^[A-Za-z0-9+/_-]{42,44}={0,2}$/.test(s)) {
    const b = Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
    return b.length === 32 ? b : null;
  }
  return null;
}

/** Render a recomputed digest in the same notation the declared value uses. */
function renderLike(hex: string, declared: string): string {
  if (/^sha256:/.test(declared)) return "sha256:" + hex;
  if (/^sha256-/.test(declared)) return "sha256-" + hex;
  if (/^[0-9a-fA-F]{64}$/.test(declared)) return hex;
  const b64 = hexToB64(hex);
  if (/[-_]/.test(declared) || /^[A-Za-z0-9_-]+={0,2}$/.test(declared)) {
    const u = b64.replace(/\+/g, "-").replace(/\//g, "_");
    return /=$/.test(declared) ? u : u.replace(/=+$/, "");
  }
  return /=$/.test(declared) ? b64 : b64.replace(/=+$/, "");
}

/** Encode a hex digest the way the corpus writes it, so declared and recomputed are comparable. */
function encodeAs(hex: string, encoding: string): string {
  switch (encoding) {
    case "hex":
      return hex;
    case "base64":
      return hexToB64(hex);
    case "base64url":
      return hexToB64u(hex);
    case "sha256:":
      return "sha256:" + hex;
    case "sha256-":
      return "sha256-" + hex;
    default:
      return hex;
  }
}

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------

const readJson = (p: string): Json => JSON.parse(readFileSync(p, "utf8")) as Json;
const readJsonl = (p: string): Json[] =>
  readFileSync(p, "utf8")
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "")
    .map((l) => JSON.parse(l) as Json);

const rel = (p: string): string => relative(ROOT, p).split("\\").join("/");

function walkFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walkFiles(p));
    else out.push(p);
  }
  return out;
}

/** Every digest-shaped string in a JSON value, by pointer. The unregistered census. */
function digestShapedFields(node: Json, path = "", out: Array<[string, string, string]> = []): Array<[string, string, string]> {
  if (node !== null && typeof node === "object" && !Array.isArray(node)) {
    for (const k of Object.keys(node)) {
      digestShapedFields(node[k]!, `${path}/${k.replace(/~/g, "~0").replace(/\//g, "~1")}`, out);
    }
  } else if (Array.isArray(node)) {
    node.forEach((v, i) => digestShapedFields(v, `${path}/${i}`, out));
  } else if (typeof node === "string") {
    if (/^sha256[:-][0-9a-f]{64}$/.test(node)) out.push([path, "sha256-prefixed", node]);
    else if (/^[0-9a-fA-F]{64}$/.test(node)) out.push([path, "hex64", node]);
    else if (/^[A-Za-z0-9+/]{43}=$/.test(node)) out.push([path, "base64-32B", node]);
    else if (/^[A-Za-z0-9_-]{43}=?$/.test(node) && /[-_]/.test(node)) out.push([path, "base64url-32B", node]);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Rule executors. Each returns rows AND the set of pointers it consumed, so the
// unregistered census is exactly "digest-shaped fields no rule touched".
// ---------------------------------------------------------------------------

interface Rule {
  id: string;
  file: string;
  kind: string;
  field: string;
  construction: string | null;
  encoding?: string;
  status: string;
  document: string | null;
  lines: string | null;
  alt_scope?: { construction: string; document: string; lines: string; graded: boolean; note: string };
  /**
   * Which corpora this rule applies to: corpus ids or globs. ABSENT means every
   * corpus that carries or inherits this rule set, which is what the registry did
   * before the member existed.
   */
  applies_to?: string[];
  /** Which of the three published shapes of a counterparty_binding block this rule grades. */
  holder?: string;
}

/** `asqav/history/*` matches `asqav/history/ee8a3e7`. Only `*` is special. */
function globMatch(pattern: string, id: string): boolean {
  if (!pattern.includes("*")) return pattern === id;
  const rx = new RegExp("^" + pattern.split("*").map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[^]*") + "$");
  return rx.test(id);
}

const ruleApplies = (r: Rule, corpus: string): boolean =>
  r.applies_to === undefined || r.applies_to.some((p) => globMatch(p, corpus));

interface Ctx {
  corpus: string;
  dir: string;
  rows: Row[];
  consumed: Set<string>;
  /** Rule ids that produced at least one row here. Everything else applied is idle. */
  used: Set<string>;
}

const key = (file: string, pointer: string): string => `${file}#${pointer}`;

function push(ctx: Ctx, r: Rule, file: string, pointer: string, declared: string | null, recomputed: string | null, outcome: Outcome, note?: string) {
  ctx.consumed.add(key(file, pointer));
  ctx.used.add(r.id);
  const row: Row = {
    corpus: ctx.corpus,
    file,
    pointer,
    rule: r.id,
    scope: r.construction,
    document: r.document,
    lines: r.lines,
    status: r.status,
    encoding: r.encoding ?? null,
    declared,
    recomputed,
    outcome,
  };
  if (note !== undefined) row.note = note;
  ctx.rows.push(row);
}

/**
 * A refusal that walker/scopes.json has reviewed and registered.
 *
 * The walker fails on any serializer disagreement, and that is the right default:
 * two serialisers producing different bytes for one value is exactly the condition
 * under which no digest here can be trusted. A REFUSAL is a different event. One
 * serialiser can decline to emit bytes it cannot stand behind while the other
 * emits them correctly, and there is nothing to resolve -- the value simply goes
 * ungraded by the two-opinion rule.
 *
 * Left unregistered, such a refusal reds the run forever and the red says nothing.
 * Registered, it is named, reasoned, and counted separately. The gate is narrow on
 * purpose: the entry must match the corpus, the file, the pointer shape AND the
 * exact refusal text, so a refusal on a different value, or the same value with a
 * different message, or a genuine byte disagreement, all still fail the run. That
 * is what keeps this from becoming a way to make red things green.
 */
interface Refusal {
  id: string;
  corpus_prefix: string;
  file_suffix: string;
  pointer_suffix: string;
  refusal_equals: string;
  reason: string;
  what_goes_ungraded: string;
}

let REFUSALS: Refusal[] = [];

function matchRefusal(corpus: string, file: string, pointer: string, refusal: string): Refusal | undefined {
  return REFUSALS.find(
    (a) =>
      corpus.startsWith(a.corpus_prefix) &&
      file.endsWith(a.file_suffix) &&
      pointer.endsWith(a.pointer_suffix) &&
      refusal === a.refusal_equals,
  );
}

/** A canonicalization that failed: a registered refusal, or a disagreement that fails the run. */
function pushCanonFailure(ctx: Ctx, r: Rule, file: string, pointer: string, declared: string | null, c: Canon) {
  const allowed = c.refusal === undefined ? undefined : matchRefusal(ctx.corpus, file, pointer, c.refusal);
  if (allowed) {
    push(ctx, r, file, pointer, declared, null, "expected_refusal",
      `${c.detail} -- registered expected refusal ${allowed.id}: ${allowed.reason} Ungraded here: ${allowed.what_goes_ungraded}`);
    return;
  }
  push(ctx, r, file, pointer, declared, null, "serializer_disagreement", c.detail);
}

async function ruleAsqavVectors(ctx: Ctx, rules: Rule[], filePath: string) {
  const file = rel(filePath);
  const doc = readJson(filePath) as { vectors: Array<Record<string, Json>> };
  const byName = new Map<string, Record<string, Json>>();
  doc.vectors.forEach((v) => byName.set(String(v["name"]), v));

  const rCanon = rules.find((r) => r.kind === "asqav_vector_canonical");
  const rSha = rules.find((r) => r.kind === "asqav_vector_sha256");
  // One rule per published SHAPE, not one rule for all three. The scope is the
  // same in every one of them -- marques-08 s5.7 states one scope -- but the
  // shapes belong to different corpus revisions, and a single rule spanning them
  // cannot say which. See walker/scopes.json, how_to_read.applies_to.
  const envOf = (holder: string): Rule | undefined =>
    rules.find((r) => r.kind === "asqav_envelope_hash" && r.holder === holder);

  for (let i = 0; i < doc.vectors.length; i++) {
    const v = doc.vectors[i]!;

    if (rCanon && typeof v["canonical"] === "string" && v["input"] !== undefined) {
      const c = await canon(v["input"]!);
      const ptr = `/vectors/${i}/canonical`;
      if (!c.ok) pushCanonFailure(ctx, rCanon, file, ptr, String(v["canonical"]), c);
      else {
        const mine = c.bytes!.toString("utf8");
        push(ctx, rCanon, file, ptr, String(v["canonical"]), mine, mine === v["canonical"] ? "match" : "mismatch");
      }
    }

    if (rSha && typeof v["sha256"] === "string" && typeof v["canonical"] === "string") {
      const ptr = `/vectors/${i}/sha256`;
      const recomputed = sha256Hex(String(v["canonical"]));
      push(ctx, rSha, file, ptr, String(v["sha256"]), recomputed, recomputed === v["sha256"] ? "match" : "mismatch");
    }

    // counterparty_binding.envelope_hash and its siblings. The block appears at
    // the vector's top level (the declaration) and under `input` (the receipt
    // content B emits); both carry the value and both are walked.
    // The three places a corpus has published these digests. The block sat at the
    // vector's top level and under `input` through 05c1c49; upstream #473 moved the
    // output-side renderings into a sibling `expected` object, where the members sit
    // directly rather than inside a counterparty_binding wrapper. All three shapes
    // are walked, each under its own rule, and each rule names the corpora it
    // applies to. Registering only the first two would have turned this walker
    // green at the tip while grading six fewer members than the red it replaced --
    // which is the failure this tool exists to catch, committed by the tool itself.
    const holders: Array<[string, Json | undefined, Rule | undefined]> = [
      [`/vectors/${i}/counterparty_binding`, v["counterparty_binding"], envOf("counterparty_binding")],
      [
        `/vectors/${i}/input/counterparty_binding`,
        isObject(v["input"]) ? (v["input"] as Record<string, Json>)["counterparty_binding"] : undefined,
        envOf("input/counterparty_binding"),
      ],
      [`/vectors/${i}/expected`, v["expected"], envOf("expected")],
    ];
    for (const [prefix, block, rEnv] of holders) {
      // No rule for this shape at this corpus: the shape is not registered here,
      // which is a different fact from a registered shape that matched nothing.
      if (!rEnv) continue;
      if (!isObject(block)) continue;
      const cbo = block;
      const fields = ["envelope_hash", "envelope_hash_hex", "envelope_hash_base64", "envelope_hash_base64url"] as const;
      if (!fields.some((f) => typeof cbo[f] === "string")) continue;
      const ptrOf = (f: string) => `${prefix}/${f}`;

      // Which envelope is A's? scopes.json rule asqav.counterparty.envelope_hash,
      // `which_envelope`. The digest scope never varies; only its subject.
      const ref: Json | undefined = refOf(v) ?? undefined;
      let target: Record<string, Json> | undefined;
      let how = "";
      if (typeof ref === "string") {
        target = byName.get(ref);
        how = `originating_envelope_ref -> ${ref}`;
        if (!target) {
          for (const f of fields) {
            if (typeof cbo[f] === "string")
              push(ctx, rEnv, file, ptrOf(f), String(cbo[f]), null, "unregistered",
                `originating_envelope_ref names ${JSON.stringify(ref)}, which is not a vector in this file`);
          }
          continue;
        }
      } else if (isThreeKey(v["input"])) {
        target = v;
        how = "this vector's own input is the three-key envelope";
      } else {
        const declared = doc.vectors.filter((x) => isThreeKey(x["input"]));
        if (declared.length === 1) {
          target = declared[0]!;
          how = `the file's single three-key envelope vector, ${String(declared[0]!["name"])} (resolved from the corpus's description strings; inferred)`;
        } else {
          for (const f of fields) {
            if (typeof cbo[f] === "string")
              push(ctx, rEnv, file, ptrOf(f), String(cbo[f]), null, "unregistered",
                `no originating_envelope_ref and ${declared.length} candidate envelope vectors in this file: A's envelope cannot be resolved without guessing`);
          }
          continue;
        }
      }

      const te = target["input"] as Record<string, Json>;
      const three: Json = { payload: te["payload"]!, signature: te["signature"]!, anchors: te["anchors"]! };
      const minusAnchors: Json = { payload: te["payload"]!, signature: te["signature"]! };
      const cThree = await canon(three);
      const cMinus = await canon(minusAnchors);

      // Which bytes the published digest covers. -09 (upstream #452) added
      // counterparty_binding.scope, so the corpus now SAYS which scope it used.
      // A walker that ignores that declaration and grades -08 s5.7 regardless is
      // the M6 mechanism with the sides swapped: a value that moved correctly,
      // reported as wrong because the grader did not re-read its input.
      const sc = scopeOf(cbo, v, doc, String(target["name"]));
      if (sc.kind === "ambiguous") {
        for (const f of fields) {
          if (typeof cbo[f] === "string")
            push(ctx, { ...rEnv, construction: null }, file, ptrOf(f), String(cbo[f]), null, "unregistered",
              `envelope: ${how}; ${sc.source}`);
        }
        continue;
      }
      if (sc.kind === "unknown") {
        for (const f of fields) {
          if (typeof cbo[f] === "string")
            push(ctx, { ...rEnv, construction: null }, file, ptrOf(f), String(cbo[f]), null, "mismatch",
              `envelope: ${how}; ${sc.source} declares ${JSON.stringify(sc.value)}, which names no scope this registry knows. ` +
                "Graded against neither the -08 s5.7 three-key object nor the -09 minus-anchors object: the corpus made a " +
                "scope claim this walker cannot check, and an unchecked claim is a mismatch, not an unregistered field.");
        }
        continue;
      }
      const c = sc.kind === "minus_anchors" ? cMinus : cThree;
      const cAlt = sc.kind === "minus_anchors" ? cThree : cMinus;
      const altHex = cAlt.ok ? sha256Hex(cAlt.bytes!) : null;
      const construction =
        sc.kind === "minus_anchors"
          ? "sha256(jcs({payload,signature} of this vector's originating envelope, anchors removed))"
          : "sha256(jcs({payload,signature,anchors} of this vector's originating envelope))";
      const altName = sc.kind === "minus_anchors" ? "the -08 s5.7 three-key scope" : "the -09 forward scope (jcs minus anchors, -08 s4 line 657)";

      for (const f of fields) {
        const declared = cbo[f];
        if (typeof declared !== "string") continue;
        const ptr = ptrOf(f);
        if (!c.ok) {
          pushCanonFailure(ctx, { ...rEnv, construction }, file, ptr, declared, c);
          continue;
        }
        const hex = sha256Hex(c.bytes!);
        const encoding = /^[0-9a-f]{64}$/.test(declared) ? "hex" : /[-_]/.test(declared) ? "base64url" : "base64";
        const recomputed = renderLike(hex, declared);
        // Compare bytes, not notation.
        const db = declaredBytes(declared);
        if (db === null) {
          push(ctx, { ...rEnv, construction, encoding }, file, ptr, declared, recomputed, "unregistered",
            `envelope: ${how}; the declared value is not a 32-byte digest in any recognised notation, so there is nothing to compare`);
          continue;
        }
        const outcome: Outcome = db.equals(Buffer.from(hex, "hex")) ? "match" : "mismatch";
        let note = `envelope: ${how}; scope: ${sc.source}`;
        if (outcome === "mismatch") {
          const altMatches = altHex !== null && db.equals(Buffer.from(altHex, "hex"));
          note += altMatches
            ? `; does NOT match the graded scope but DOES match ${altName}, reported for information and not graded`
            : `; ${altName} recomputes to ${altHex === null ? "n/a" : renderLike(altHex, declared)} and does not match either`;
        }
        push(ctx, { ...rEnv, construction, encoding }, file, ptr, declared, recomputed, outcome, note);
      }
    }
  }
}

/**
 * Which byte scope a counterparty_binding block declares for its envelope_hash.
 *
 * marques-08 states the scope two ways (FINDINGS M5): s5.7 lines 1351-1369 say
 * the three-key object {payload, signature, anchors}; s4 line 657 says the
 * envelope with anchors stripped. -09 resolves it by making the receipt say
 * which one it used, and the SDK added the member at #452. So:
 *
 *   scope: "envelope_minus_anchors"  ->  jcs({payload, signature})
 *   no scope member                  ->  jcs({payload, signature, anchors}), the
 *                                        -08 s5.7 reading this repository grades
 *   any other value                  ->  unknown; graded against neither, and
 *                                        reported as a mismatch naming the value
 *
 * The unknown case is deliberately NOT "unregistered". An unregistered field is
 * one no document gives a scope for; this is a field whose corpus asserts a scope
 * that no document defines, which is a claim that failed, not a claim never made.
 */
type ScopeChoice =
  | { kind: "minus_anchors" | "three_key"; source: string }
  | { kind: "unknown"; value: string; source: string }
  | { kind: "ambiguous"; source: string };

const SCOPE_MINUS_ANCHORS = "envelope_minus_anchors";

const isObject = (v: Json | undefined): v is Record<string, Json> =>
  v !== null && v !== undefined && typeof v === "object" && !Array.isArray(v);

function readScope(s: Json | undefined, where: string): ScopeChoice | null {
  if (s === undefined || s === null) return null;
  if (typeof s !== "string") return { kind: "unknown", value: JSON.stringify(s), source: where };
  if (s === SCOPE_MINUS_ANCHORS) return { kind: "minus_anchors", source: `${where} = ${JSON.stringify(s)}` };
  return { kind: "unknown", value: s, source: where };
}

/**
 * Resolve the scope for ONE block of published digests.
 *
 * The `expected` object #473 introduced carries the renderings but no scope member
 * of its own -- it is the output side of a binding whose scope the input side
 * declares. So the member is looked for in three places, nearest first, and the
 * row records which one answered. The last step is an inference over the corpus,
 * not a reading of a document, and it says so.
 */
function scopeOf(
  block: Record<string, Json>,
  vector: Record<string, Json>,
  doc: { vectors: Array<Record<string, Json>> },
  envelopeName: string | null,
): ScopeChoice {
  const own = readScope(block["scope"], "counterparty_binding.scope");
  if (own) return own;

  const input = vector["input"];
  if (isObject(input) && isObject(input["counterparty_binding"])) {
    const sib = readScope((input["counterparty_binding"] as Record<string, Json>)["scope"],
      "the same vector's input.counterparty_binding.scope");
    if (sib) return sib;
  }

  // Peers: the other vectors binding to the SAME originating envelope. If they all
  // name one scope, that is the scope this envelope's published digests were taken
  // under; if they disagree, nothing here can choose between them and the block is
  // left unregistered rather than graded against a guess.
  if (envelopeName !== null) {
    const seen = new Map<string, string[]>();
    for (const other of doc.vectors) {
      if (refOf(other) !== envelopeName) continue;
      const oin = other["input"];
      if (!isObject(oin) || !isObject(oin["counterparty_binding"])) continue;
      const s = (oin["counterparty_binding"] as Record<string, Json>)["scope"];
      if (typeof s !== "string") continue;
      seen.set(s, [...(seen.get(s) ?? []), String(other["name"])]);
    }
    if (seen.size === 1) {
      const [value, names] = [...seen.entries()][0]!;
      const src =
        `inferred from the vectors binding to the same originating envelope (${names.join(", ")}), ` +
        `which unanimously declare counterparty_binding.scope = ${JSON.stringify(value)}`;
      const peer = readScope(value, src);
      if (peer) return peer;
    } else if (seen.size > 1) {
      return {
        kind: "ambiguous",
        source:
          "the vectors binding to this same originating envelope declare more than one counterparty_binding.scope (" +
          [...seen.keys()].map((k) => JSON.stringify(k)).join(", ") +
          "), so the scope of this block cannot be resolved without guessing",
      };
    }
  }

  return { kind: "three_key", source: "no scope member; the -08 s5.7 three-key object is the default" };
}

/** The originating envelope a vector names, wherever the corpus writes the ref. */
function refOf(v: Record<string, Json>): string | null {
  for (const holder of [v["counterparty_binding"], v["expected"], isObject(v["input"]) ? (v["input"] as Record<string, Json>)["counterparty_binding"] : undefined]) {
    if (!isObject(holder)) continue;
    const r = holder["originating_envelope_ref"];
    if (typeof r === "string") return r;
  }
  return null;
}

/** A three-key {payload, signature, anchors} envelope, per marques-08 s5.7. */
function isThreeKey(v: Json | undefined): boolean {
  return (
    v !== null && v !== undefined && typeof v === "object" && !Array.isArray(v) &&
    "payload" in (v as object) && "signature" in (v as object) && "anchors" in (v as object)
  );
}

async function ruleChainPair(ctx: Ctx, r: Rule, receiptPath: string, predecessorPath: string, scope: "payload" | "whole") {
  const file = rel(receiptPath);
  const ptr = "/payload/previousReceiptHash";
  const receipt = readJson(receiptPath) as Record<string, Json>;
  const payload = receipt["payload"];
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) return;
  const declared = (payload as Record<string, Json>)["previousReceiptHash"];
  if (typeof declared !== "string") return;
  if (!existsSync(predecessorPath)) {
    push(ctx, r, file, ptr, declared, null, "unregistered", `predecessor ${rel(predecessorPath)} is not in the corpus`);
    return;
  }
  const pred = readJson(predecessorPath) as Record<string, Json>;
  const value: Json = scope === "payload" ? (pred["payload"] as Json) : (pred as Json);
  const c = await canon(value);
  if (!c.ok) {
    pushCanonFailure(ctx, r, file, ptr, declared, c);
    return;
  }
  const hex = sha256Hex(c.bytes!);
  const recomputed = encodeAs(hex, declared.startsWith("sha256:") ? "sha256:" : "hex");
  push(ctx, r, file, ptr, declared, recomputed, recomputed === declared ? "match" : "mismatch",
    `predecessor: ${rel(predecessorPath)}`);
}

async function ruleActaCanonicalSha(ctx: Ctx, r: Rule, expectedPath: string) {
  const file = rel(expectedPath);
  const doc = readJson(expectedPath) as Record<string, Json>;
  const declared = doc["receipt_canonical_sha256"];
  if (typeof declared !== "string") return;
  const receiptPath = join(dirname(expectedPath), "receipt.json");
  const ptr = "/receipt_canonical_sha256";
  if (!existsSync(receiptPath)) {
    push(ctx, r, file, ptr, declared, null, "unregistered", "no sibling receipt.json");
    return;
  }
  const receipt = readJson(receiptPath) as Record<string, Json>;
  const { signature: _drop, ...rest } = receipt;
  const c = await canon(rest as Json);
  if (!c.ok) {
    pushCanonFailure(ctx, r, file, ptr, declared, c);
    return;
  }
  const recomputed = sha256Hex(c.bytes!);
  push(ctx, r, file, ptr, declared, recomputed, recomputed === declared ? "match" : "mismatch",
    `receipt: ${rel(receiptPath)} minus its signature member`);
}

async function ruleVstateMappingHash(ctx: Ctx, r: Rule, filePath: string, mappings: Map<string, string>) {
  const file = rel(filePath);
  let doc: Json;
  try {
    doc = readJson(filePath);
  } catch {
    return;
  }
  for (const [ptr, , value] of digestShapedFields(doc)) {
    if (!ptr.endsWith("/v_gate_mapping_hash")) continue;
    const m = /^sha256[:-]([0-9a-f]{64})$/.exec(value);
    if (!m) {
      push(ctx, r, file, ptr, value, null, "unregistered", "value is not a sha256-prefixed 64-hex digest");
      continue;
    }
    const hex = m[1]!;
    const source = mappings.get(hex);
    if (!source) {
      push(ctx, r, file, ptr, value, null, "unregistered",
        "content-addressed: the mapping document this digest names is not in the corpus, so there is nothing to recompute it from");
      continue;
    }
    push(ctx, r, file, ptr, value, value, "match", `resolves to ${source} (sha256 of its raw bytes)`);
  }
}

async function ruleEvidenceChain(ctx: Ctx, rules: Rule[], filePath: string) {
  const file = rel(filePath);
  const records = readJsonl(filePath) as Array<Record<string, Json>>;
  const rGen = rules.find((r) => r.kind === "ea_genesis_prev");
  const rPrev = rules.find((r) => r.kind === "ea_chain_prev");
  const rCk = rules.find((r) => r.kind === "ea_checkpoint_last");

  const entryHash = async (rec: Record<string, Json>): Promise<Canon> => {
    const { sig: _drop, ...content } = rec;
    return canon(content as Json);
  };

  const chain = records.filter((r) => r["type"] !== "checkpoint");
  for (let i = 0; i < chain.length; i++) {
    const rec = chain[i]!;
    const declared = rec["prev_hash"];
    if (typeof declared !== "string") continue;
    const ptr = `#${records.indexOf(rec) + 1}/prev_hash`;
    if (i === 0) {
      if (!rGen) continue;
      // The record's OWN v token, not a hardcoded one: SPEC.md s6 writes the
      // format version into the genesis object, and the delivery corpus is
      // evidence.action/1 while the SPEC that states the construction is /0.
      const c = await canon({ v: rec["v"]!, session_id: rec["session_id"]!, marker: "genesis" } as Json);
      if (!c.ok) {
        pushCanonFailure(ctx, rGen, file, ptr, declared, c);
        continue;
      }
      const recomputed = "sha256:" + sha256Hex(c.bytes!);
      push(ctx, rGen, file, ptr, declared, recomputed, recomputed === declared ? "match" : "mismatch",
        `genesis for v=${JSON.stringify(rec["v"])} session_id=${JSON.stringify(rec["session_id"])}`);
    } else {
      if (!rPrev) continue;
      const c = await entryHash(chain[i - 1]!);
      if (!c.ok) {
        pushCanonFailure(ctx, rPrev, file, ptr, declared, c);
        continue;
      }
      const recomputed = "sha256:" + sha256Hex(c.bytes!);
      push(ctx, rPrev, file, ptr, declared, recomputed, recomputed === declared ? "match" : "mismatch",
        `entry hash of the seq=${JSON.stringify(chain[i - 1]!["seq"])} record`);
    }
  }

  if (rCk) {
    for (const rec of records) {
      const declared = rec["last_entry_hash"];
      if (typeof declared !== "string") continue;
      const ptr = `#${records.indexOf(rec) + 1}/last_entry_hash`;
      const last = chain[chain.length - 1];
      if (!last) {
        push(ctx, rCk, file, ptr, declared, null, "unregistered", "no non-checkpoint record to hash");
        continue;
      }
      const c = await entryHash(last);
      if (!c.ok) {
        pushCanonFailure(ctx, rCk, file, ptr, declared, c);
        continue;
      }
      const recomputed = "sha256:" + sha256Hex(c.bytes!);
      push(ctx, rCk, file, ptr, declared, recomputed, recomputed === declared ? "match" : "mismatch",
        `entry hash of the last chain record (seq=${JSON.stringify(last["seq"])})`);
    }
  }
}

// ---------------------------------------------------------------------------
// The census: every digest-shaped field a rule did not consume.
// ---------------------------------------------------------------------------

function census(ctx: Ctx, files: string[], reasons: Map<string, string>) {
  for (const p of files) {
    const r = rel(p);
    const lower = p.toLowerCase();
    let entries: Array<[string, string, string]> = [];
    if (lower.endsWith(".json")) {
      let doc: Json;
      try {
        doc = readJson(p);
      } catch {
        continue;
      }
      entries = digestShapedFields(doc);
    } else if (lower.endsWith(".jsonl")) {
      let recs: Json[];
      try {
        recs = readJsonl(p);
      } catch {
        continue;
      }
      recs.forEach((rec, i) => {
        for (const [ptr, shape, val] of digestShapedFields(rec)) entries.push([`#${i + 1}${ptr}`, shape, val]);
      });
    } else continue;

    for (const [ptr, shape, val] of entries) {
      if (ctx.consumed.has(key(r, ptr))) continue;
      ctx.rows.push({
        corpus: ctx.corpus,
        file: r,
        pointer: ptr,
        rule: null,
        scope: null,
        document: null,
        lines: null,
        status: "unregistered",
        encoding: shape,
        declared: val,
        recomputed: null,
        outcome: "unregistered",
        note: reasons.get(ctx.corpus) ?? "no document in refs/ or in the corpus states a byte scope for this field",
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<number> {
  const scopes = readJson(SCOPES) as unknown as {
    expected_refusals?: Refusal[];
    corpora: Array<{
      id: string;
      dir: string;
      rules?: Rule[];
      inherits_rules_from?: string;
      only_files?: string[];
      corpus_note?: string;
    }>;
  };

  REFUSALS = scopes.expected_refusals ?? [];

  py = new PythonJcs();
  const rows: Row[] = [];
  const perCorpus: Record<string, Record<string, number>> = {};
  const reasons = new Map<string, string>();

  const rulesById = new Map<string, Rule[]>();
  for (const c of scopes.corpora) if (c.rules) rulesById.set(c.id, c.rules);

  for (const c of scopes.corpora) {
    const dir = join(ROOT, ...c.dir.split("/"));
    const ctx: Ctx = { corpus: c.id, dir, rows: [], consumed: new Set(), used: new Set() };
    if (c.corpus_note) reasons.set(c.id, c.corpus_note);
    const declaredRules = c.rules ?? rulesById.get(c.inherits_rules_from ?? "") ?? [];
    // A rule with no applies_to applies to every corpus carrying or inheriting
    // this set -- the behaviour before the member existed.
    const rules = declaredRules.filter((r) => ruleApplies(r, c.id));
    const files = walkFiles(dir);

    const only = c.only_files;
    const wanted = (relPath: string) => !only || only.some((o) => relPath.endsWith(o));

    // asqav conformance vectors
    for (const p of files) {
      if (!p.replace(/\\/g, "/").endsWith("conformance/vectors.json")) continue;
      if (!wanted(rel(p))) continue;
      if (!rules.some((r) => r.kind.startsWith("asqav_"))) continue;
      await ruleAsqavVectors(ctx, rules, p);
    }

    // chain pairs named explicitly by a rule (asqav verifier corpus)
    for (const r of rules) {
      if (r.kind !== "chain_prev_payload" && r.kind !== "chain_prev_whole") continue;
      if (r.file.includes("*")) continue;
      const receiptPath = join(dir, ...r.file.split("/"));
      if (!existsSync(receiptPath) || !wanted(rel(receiptPath))) continue;
      const predecessorPath = join(dirname(receiptPath), "predecessor.json");
      await ruleChainPair(ctx, r, receiptPath, predecessorPath, r.kind === "chain_prev_payload" ? "payload" : "whole");
    }

    // globbed chain directories (acta/synthetic)
    for (const r of rules) {
      if (!r.file.includes("*")) continue;
      if (r.kind !== "chain_prev_payload" && r.kind !== "chain_prev_whole") continue;
      const sub = r.file.split("/")[0]!;
      const chainDir = join(dir, sub);
      if (!existsSync(chainDir)) continue;
      const members = readdirSync(chainDir).filter((f) => f.endsWith(".receipt.json")).sort();
      for (let i = 1; i < members.length; i++) {
        await ruleChainPair(ctx, r, join(chainDir, members[i]!), join(chainDir, members[i - 1]!),
          r.kind === "chain_prev_payload" ? "payload" : "whole");
      }
    }

    // acta published expected-output
    for (const r of rules) {
      if (r.kind !== "acta_canonical_sha256") continue;
      for (const p of files) {
        if (!p.replace(/\\/g, "/").endsWith("/expected-output.json")) continue;
        await ruleActaCanonicalSha(ctx, r, p);
      }
    }

    // verification-state mapping hashes
    for (const r of rules) {
      if (r.kind !== "vstate_mapping_hash") continue;
      const mappings = new Map<string, string>();
      for (const p of files) {
        if (!p.replace(/\\/g, "/").includes("/mappings/")) continue;
        mappings.set(sha256Hex(readFileSync(p)), rel(p));
      }
      for (const p of files) {
        if (!p.toLowerCase().endsWith(".json")) continue;
        await ruleVstateMappingHash(ctx, r, p, mappings);
      }
    }

    // evidence.action/0 chains
    if (rules.some((r) => r.kind.startsWith("ea_"))) {
      for (const p of files) {
        if (!p.toLowerCase().endsWith("chain.jsonl")) continue;
        await ruleEvidenceChain(ctx, rules, p);
      }
    }

    census(ctx, files.filter((p) => wanted(rel(p))), reasons);

    // Every rule that APPLIES here and matched nothing. The quiet failure mode of
    // a versioned registry is a rule that has stopped matching: upstream reshapes
    // its corpus, the rule naming the old shape matches zero pointers, and a
    // zero-row rule is indistinguishable from a rule with nothing to do. This row
    // is the difference. It never fails the run -- an idle rule is a fact about
    // coverage, not a wrong digest.
    //
    // Guarded on the directory existing: a corpus absent from the tree being
    // walked (the tests copy one corpus into a throwaway root) skipped nothing,
    // so there is nothing to report idle.
    if (existsSync(dir)) {
      for (const r of rules) {
        if (ctx.used.has(r.id)) continue;
        ctx.rows.push({
          corpus: c.id,
          file: r.file,
          pointer: null,
          rule: r.id,
          scope: r.construction,
          document: r.document,
          lines: r.lines,
          status: r.status,
          encoding: r.encoding ?? null,
          declared: null,
          recomputed: null,
          outcome: "rule_idle",
          note: `this rule applies to ${c.id} and matched no pointer in it`,
        });
      }
    }

    const counts: Record<string, number> = { match: 0, mismatch: 0, unregistered: 0, serializer_disagreement: 0, expected_refusal: 0, rule_idle: 0, declared: 0, inferred: 0 };
    for (const row of ctx.rows) {
      counts[row.outcome] = (counts[row.outcome] ?? 0) + 1;
      if (row.outcome === "rule_idle") continue;
      if (row.outcome !== "unregistered" && row.status === "declared") counts["declared"]!++;
      if (row.outcome !== "unregistered" && row.status === "inferred") counts["inferred"]!++;
    }
    // `registered` counts graded FIELDS. A rule_idle row grades no field, so it is
    // excluded here -- which is what keeps every count at every pinned corpus
    // identical to a856323's, with rule_idle purely an added column.
    counts["registered"] = ctx.rows.length - counts["unregistered"]! - counts["rule_idle"]!;
    perCorpus[c.id] = counts;
    rows.push(...ctx.rows);
  }

  await py.end();

  // Deterministic body: sorted rows, sorted keys, no timestamps inside it.
  // A rule_idle row has a null pointer; sort it by its rule id instead, so the
  // ordering stays total and two runs still produce byte-identical bodies.
  const sortPtr = (r: Row): string => (r.pointer === null ? ` ${r.rule ?? ""}` : r.pointer);
  rows.sort((a, b) =>
    a.corpus < b.corpus ? -1 : a.corpus > b.corpus ? 1
      : a.file < b.file ? -1 : a.file > b.file ? 1
        : sortPtr(a) < sortPtr(b) ? -1 : sortPtr(a) > sortPtr(b) ? 1 : 0,
  );
  const sortKeys = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(sortKeys);
    if (v !== null && typeof v === "object") {
      const o: Record<string, unknown> = {};
      for (const k of Object.keys(v as object).sort()) o[k] = sortKeys((v as Record<string, unknown>)[k]);
      return o;
    }
    return v;
  };

  const totals = { match: 0, mismatch: 0, unregistered: 0, serializer_disagreement: 0, expected_refusal: 0, rule_idle: 0 };
  for (const r of rows) totals[r.outcome]++;

  const body = sortKeys({ per_corpus: perCorpus, rows, totals });
  const report = { header: { tool: "tools/walk-digests.ts", run_at: new Date().toISOString(), scopes: "walker/scopes.json" }, body };
  writeFileSync(REPORT, JSON.stringify(report, null, 2) + "\n", "utf8");

  console.log("== digest walker ==");
  for (const id of Object.keys(perCorpus).sort()) {
    const c = perCorpus[id]!;
    console.log(
      `  ${id.padEnd(24)} registered=${String(c["registered"]).padStart(4)}  match=${String(c["match"]).padStart(4)}` +
        `  mismatch=${String(c["mismatch"]).padStart(3)}  unregistered=${String(c["unregistered"]).padStart(4)}` +
        `  serializer_disagreement=${c["serializer_disagreement"]}  expected_refusal=${c["expected_refusal"]}` +
        `  rule_idle=${c["rule_idle"]}` +
        `  (declared=${c["declared"]} inferred=${c["inferred"]})`,
    );
  }
  console.log("");
  for (const r of rows) {
    if (r.outcome === "rule_idle") {
      console.log(`  RULE_IDLE  ${r.corpus}  ${r.rule}`);
      console.log(`      applies to this corpus and matched no pointer in it; the rule's file pattern is ${r.file}`);
      continue;
    }
    if (r.outcome === "mismatch" || r.outcome === "serializer_disagreement" || r.outcome === "expected_refusal") {
      console.log(`  ${r.outcome.toUpperCase()}  ${r.file}${r.pointer}`);
      console.log(`      declared   : ${r.declared}`);
      console.log(`      recomputed : ${r.recomputed}`);
      console.log(`      scope      : ${r.scope} [${r.document ?? "no document"} ${r.lines ?? ""} ${r.status}]`);
      if (r.note) console.log(`      note       : ${r.note}`);
    }
  }
  console.log("");
  console.log(
    `SUMMARY match=${totals.match} mismatch=${totals.mismatch} unregistered=${totals.unregistered} ` +
      `serializer_disagreement=${totals.serializer_disagreement} expected_refusal=${totals.expected_refusal} ` +
      `rule_idle=${totals.rule_idle}; report walker/report.json`,
  );
  return totals.mismatch > 0 || totals.serializer_disagreement > 0 ? 1 : 0;
}

main().then(
  (code) => process.exit(code),
  (e) => {
    console.error(e);
    process.exit(2);
  },
);
