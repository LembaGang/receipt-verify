#!/usr/bin/env tsx
/**
 * x402 PR #2853, `compliance-fields`: the inline canonicalization vectors, recomputed
 * from the pinned specification bytes, and the number-serialisation cases the
 * specification's own normative text raises.
 *
 * Part 1, the table. The rows under "### Canonicalization (normative)" (input,
 * canonical form, `recordDigest`) are parsed out of the pinned markdown by byte
 * offset. Each input is canonicalized by two serialisers, each parsing the raw
 * input bytes itself, and `recordDigest = keccak256(utf8(canonical(record)))` (the
 * spec's own line) is recomputed and compared with the table. The one other
 * digest the text publishes over literal bytes, the `buyer.declarationDigest`
 * example, is recomputed beside them.
 *
 * Part 2, the number cases. One JSON file per case under
 * fixtures/x402-pr-2853-compliance-fields/numbers/, each recording both
 * serialisers' output on the raw bytes, how each side parsed the value, and
 * whether the pinned text decides the case (quoting the line it rests on, which
 * this script asserts is still in the pinned bytes). The files are this script's
 * output: `--write-numbers` writes them, and every other run recomputes them and
 * fails if the committed bytes differ.
 *
 * The two sides. TypeScript: a small parser written here that keeps every number
 * TOKEN, turns an integer token beyond 2^53-1 into a BigInt rather than rounding
 * it, and then the repository's JCS (chirindo's `jcs`); the plain JSON.parse path
 * is recorded beside it, because that is what most TypeScript verifiers run.
 * Python: json.loads, then tools/asqav_envelope_hash.py's `jcs`, imported
 * unmodified. No package is installed; keccak256 is @noble/hashes, already a
 * dependency.
 *
 *   npx tsx tools/compliance-fields-recompute.ts [--spec <compliance_fields.md>] [--numbers <dir>] [--write-numbers]
 *
 * Exit 0 when every table row matches with both serialisers agreeing and the
 * committed number files equal this run's output; 1 otherwise; 2 on an unreadable input.
 */

import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { jcs } from "@headlessoracle/chirindo/dist/vendor/recorder/index.js";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const argv = process.argv.slice(2);
const argOf = (n: string): string | undefined => (argv.indexOf(n) >= 0 ? argv[argv.indexOf(n) + 1] : undefined);
const BASE = join(REPO, "fixtures", "x402-pr-2853-compliance-fields");
const SPEC = resolve(argOf("--spec") ?? join(BASE, "b8a81c099d0d30607416211f819db8a40bda5371", "specs", "extensions", "compliance_fields.md"));
const NUMBERS = resolve(argOf("--numbers") ?? join(BASE, "numbers"));
const WRITE = argv.includes("--write-numbers");
const specRel = relative(REPO, SPEC).split("\\").join("/");

const keccakHex = (s: string): string => "0x" + Buffer.from(keccak_256(Buffer.from(s, "utf8"))).toString("hex");

// ---------------------------------------------------------------------------
// The TypeScript side's parser: JSON, with every number kept as its token.
// ---------------------------------------------------------------------------

type Parsed = null | boolean | number | bigint | string | Parsed[] | { [k: string]: Parsed };

/** Parse JSON text; `tokens` collects [token, what it became] for every number. */
function parseTokens(text: string, tokens: Array<[string, string]>): Parsed {
  let i = 0;
  const ws = () => {
    while (i < text.length && " \t\n\r".includes(text[i]!)) i++;
  };
  const value = (): Parsed => {
    ws();
    const c = text[i];
    if (c === "{") {
      i++;
      const o: Record<string, Parsed> = {};
      ws();
      if (text[i] === "}") return i++, o;
      for (;;) {
        ws();
        const k = value();
        if (typeof k !== "string") throw new Error(`member name is not a string at ${i}`);
        ws();
        if (text[i++] !== ":") throw new Error(`expected ':' at ${i - 1}`);
        o[k] = value();
        ws();
        if (text[i] === ",") { i++; continue; }
        if (text[i++] === "}") return o;
        throw new Error(`expected ',' or '}' at ${i - 1}`);
      }
    }
    if (c === "[") {
      i++;
      const a: Parsed[] = [];
      ws();
      if (text[i] === "]") return i++, a;
      for (;;) {
        a.push(value());
        ws();
        if (text[i] === ",") { i++; continue; }
        if (text[i++] === "]") return a;
        throw new Error(`expected ',' or ']' at ${i - 1}`);
      }
    }
    if (c === '"') {
      const m = /^"(?:[^"\\\u0000-\u001f]|\\.)*"/.exec(text.slice(i));
      if (!m) throw new Error(`bad string at ${i}`);
      i += m[0].length;
      return JSON.parse(m[0]) as string;
    }
    const lit = /^(true|false|null)/.exec(text.slice(i));
    if (lit) {
      i += lit[0].length;
      return lit[0] === "null" ? null : lit[0] === "true";
    }
    const m = /^-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?/.exec(text.slice(i));
    if (!m) throw new Error(`unexpected input at ${i}`);
    i += m[0].length;
    const tok = m[0];
    if (!m[2] && !m[3] && !Number.isSafeInteger(Number(tok))) {
      const big = BigInt(tok);
      tokens.push([tok, `BigInt ${big}n (exact)`]);
      return big;
    }
    const n = Number(tok);
    tokens.push([tok, `Number ${Object.is(n, -0) ? "-0" : String(n)}`]);
    return n;
  };
  const v = value();
  ws();
  if (i !== text.length) throw new Error(`trailing input at ${i}`);
  return v;
}

interface Side {
  parser: string;
  parsed_as: string;
  jcs: string | null;
  error?: string;
  recordDigest: string | null;
}

function tsSide(text: string): Side {
  const tokens: Array<[string, string]> = [];
  let v: Parsed;
  try {
    v = parseTokens(text, tokens);
  } catch (e) {
    return { parser: "token-preserving parser (this script)", parsed_as: "unparseable", jcs: null, error: (e as Error).message, recordDigest: null };
  }
  const parsed_as = tokens.length ? tokens.map(([t, w]) => `${t} -> ${w}`).join("; ") : "no number tokens";
  try {
    const c = jcs(v) as string;
    return { parser: "token-preserving parser (this script), then chirindo jcs", parsed_as, jcs: c, recordDigest: keccakHex(c) };
  } catch (e) {
    return { parser: "token-preserving parser (this script), then chirindo jcs", parsed_as, jcs: null, error: `${(e as Error).name}: ${(e as Error).message}`, recordDigest: null };
  }
}

function tsJsonParseSide(text: string): Side {
  const v = JSON.parse(text) as Parsed;
  const nums: string[] = [];
  const walk = (x: Parsed) => {
    if (typeof x === "number") nums.push(Object.is(x, -0) ? "-0" : String(x));
    else if (Array.isArray(x)) x.forEach(walk);
    else if (x && typeof x === "object") Object.values(x).forEach(walk);
  };
  walk(v);
  const c = jcs(v) as string;
  return { parser: "JSON.parse, then chirindo jcs", parsed_as: nums.length ? `numbers ${nums.join(", ")}` : "no numbers", jcs: c, recordDigest: keccakHex(c) };
}

// ---------------------------------------------------------------------------
// The Python side: json.loads over the raw bytes, then asqav_envelope_hash.jcs.
// ---------------------------------------------------------------------------

const PY = `
import io, json, sys
sys.path.insert(0, sys.argv[1])
from asqav_envelope_hash import jcs
stdin = io.TextIOWrapper(sys.stdin.buffer, encoding="utf-8", newline="")
stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", newline="")
def nums(v, out):
    if isinstance(v, bool) or v is None or isinstance(v, str):
        return out
    if isinstance(v, (int, float)):
        out.append("%s %r" % (type(v).__name__, v))
    elif isinstance(v, list):
        for x in v: nums(x, out)
    elif isinstance(v, dict):
        for x in v.values(): nums(x, out)
    return out
for line in stdin:
    if not line.strip():
        continue
    req = json.loads(line)
    try:
        v = json.loads(req["text"])
        parsed = "; ".join(nums(v, [])) or "no numbers"
    except Exception as e:
        stdout.write(json.dumps({"id": req["id"], "parsed_as": "unparseable", "error": "%s: %s" % (type(e).__name__, e)}) + "\\n"); stdout.flush(); continue
    try:
        out = {"id": req["id"], "parsed_as": parsed, "jcs": jcs(v)}
    except Exception as e:
        out = {"id": req["id"], "parsed_as": parsed, "error": "%s: %s" % (type(e).__name__, e)}
    stdout.write(json.dumps(out) + "\\n")
    stdout.flush()
`;

const proc = spawn("python", ["-c", PY, join(REPO, "tools")], { stdio: ["pipe", "pipe", "pipe"] });
proc.stdout!.setEncoding("utf8");
let pyBuf = "";
const pyWaiting = new Map<string, (m: Record<string, string>) => void>();
proc.stdout!.on("data", (c: string) => {
  pyBuf += c;
  let n: number;
  while ((n = pyBuf.indexOf("\n")) >= 0) {
    const m = JSON.parse(pyBuf.slice(0, n)) as Record<string, string>;
    pyBuf = pyBuf.slice(n + 1);
    pyWaiting.get(m["id"]!)?.(m);
  }
});
let pyNext = 0;
async function pySide(text: string): Promise<Side> {
  const id = String(pyNext++);
  const m = await new Promise<Record<string, string>>((res) => {
    pyWaiting.set(id, res);
    proc.stdin!.write(JSON.stringify({ id, text }) + "\n");
  });
  const c = m["jcs"] ?? null;
  return {
    parser: "json.loads, then tools/asqav_envelope_hash.py jcs",
    parsed_as: m["parsed_as"] ?? "",
    jcs: c,
    ...(m["error"] !== undefined ? { error: m["error"] } : {}),
    recordDigest: c === null ? null : keccakHex(c),
  };
}

// ---------------------------------------------------------------------------
// Part 1: the table.
// ---------------------------------------------------------------------------

interface Cell { text: string; line: number; byteStart: number; byteEnd: number }

function tableRows(buf: Buffer): Array<{ input: Cell; canonical: Cell; digest: Cell }> {
  const text = buf.toString("utf8");
  const lines = text.split("\n");
  const head = lines.findIndex((l) => l.startsWith("### Canonicalization (normative)"));
  if (head < 0) throw new Error(`${specRel}: no "### Canonicalization (normative)" heading`);
  const hdr = lines.findIndex((l, k) => k > head && l.startsWith("| input | canonical form | `recordDigest` |"));
  if (hdr < 0) throw new Error(`${specRel}: no vector table under the Canonicalization heading`);
  const lineStart = (k: number) => Buffer.byteLength(lines.slice(0, k).join("\n") + (k > 0 ? "\n" : ""), "utf8");
  const out: Array<{ input: Cell; canonical: Cell; digest: Cell }> = [];
  for (let k = hdr + 2; k < lines.length && lines[k]!.startsWith("| `"); k++) {
    const cells: Cell[] = [];
    const re = /`([^`]*)`/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(lines[k]!))) {
      const start = lineStart(k) + Buffer.byteLength(lines[k]!.slice(0, m.index + 1), "utf8");
      cells.push({ text: m[1]!, line: k + 1, byteStart: start, byteEnd: start + Buffer.byteLength(m[1]!, "utf8") });
    }
    if (cells.length !== 3) throw new Error(`${specRel} line ${k + 1}: expected three backticked cells, found ${cells.length}`);
    for (const c of cells) {
      if (buf.subarray(c.byteStart, c.byteEnd).toString("utf8") !== c.text) throw new Error(`byte offsets do not address the cell at line ${c.line}`);
    }
    out.push({ input: cells[0]!, canonical: cells[1]!, digest: cells[2]! });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Part 2: the number cases. Each `rests_on` is a substring of one pinned line,
// found by this script, so a sentence cannot outlive the text it quotes.
// ---------------------------------------------------------------------------

interface Case { file: string; case: string; input: string; decides: boolean; rests_on: string; sentence: string; probes?: string[] }

const CASES: Case[] = [
  {
    file: "01-integers-at-and-above-2p53.json",
    case: "integers at and above 2^53 in members the record declares `int`",
    input: '{"correctionSeq":9007199254740993,"issuedAt":1735689600,"seq":9007199254740992}',
    decides: false,
    rests_on: "each is an exact integer well inside IEEE 754's exactly-representable range, which every RFC 8785 implementation serializes identically",
    sentence: "The text describes the `int` members as well inside the exactly-representable range, and it states no bound and no verifier action for one that is not, so what a verifier does with seq = 2^53 + 1 is left open. The MUST-reject sentence covers non-integer numbers only.",
  },
  {
    file: "02-fractional-part.json",
    case: "a value with a fractional part in a money-bearing member",
    input: '{"tax":{"breakdown":[{"taxable":1.10}]}}',
    decides: true,
    rests_on: "A record containing a non-integer JSON number anywhere is non-conformant. Verifiers MUST reject it before computing `recordDigest`.",
    sentence: "Decided: the record is non-conformant and a verifier rejects it before any digest, so no `recordDigest` is defined for these bytes and the canonical forms recorded here are what each serialiser would emit, not a conformant digest.",
  },
  {
    file: "03-exponent-form.json",
    case: "an exponent-form token whose value is an integer",
    input: '{"seq":1e2}',
    decides: false,
    rests_on: "A record containing a non-integer JSON number anywhere is non-conformant.",
    sentence: "Left open: `1e2` is an exponent TOKEN whose VALUE is the integer 100, and the text does not say whether \"non-integer JSON number\" is read by token or by value. \"(no exponent notation)\" in the same paragraph governs decimal strings, not number tokens.",
  },
  {
    file: "04-negative-zero.json",
    case: "negative zero",
    input: '{"seq":-0}',
    decides: false,
    rests_on: "The only members that MAY be JSON numbers are the ones declared `int` above",
    sentence: "Left open: `-0` is integer-valued, so the non-integer rule does not obviously reach it. Nothing says whether it is an admissible `int`, and both serialisers here emit `0`, so a record carrying `-0` and one carrying `0` share a digest.",
  },
  {
    file: "05-shortest-round-trip-divergence.json",
    case: "a finite double whose shortest round-trip form differs between the two serialisers",
    input: '{"tax":{"breakdown":[{"rate":0.00001}]}}',
    decides: true,
    rests_on: "RFC 8785 §3.2.2.3 serializes JSON numbers through ECMAScript `Number::toString` over IEEE 754 doubles",
    sentence: "One exists: the TypeScript side emits `0.00001` (ECMAScript Number::toString, the form the text names) and our Python serialiser emits `1e-05`. The value is non-integer, so the MUST-reject sentence decides the record before any digest; the divergence is ours, in tools/asqav_envelope_hash.py, not the specification's.",
    probes: ['{"x":0.00001}', '{"x":0.0001}', '{"x":9007199254740994.0}', '{"x":10000000000000000.0}', '{"x":123456789012345680000.0}', '{"x":0.1}', '{"x":0.30000000000000004}', '{"x":5e-324}', '{"x":1e21}'],
  },
];

const specLines = (): string[] => readFileSync(SPEC, "utf8").split("\n");

async function numberCase(c: Case): Promise<Record<string, unknown>> {
  const lines = specLines();
  const at = lines.findIndex((l) => l.includes(c.rests_on));
  if (at < 0) throw new Error(`${specRel} no longer carries the sentence case ${c.file} rests on: ${c.rests_on}`);
  const ts = tsSide(c.input);
  const plain = tsJsonParseSide(c.input);
  const py = await pySide(c.input);
  const agree = ts.jcs !== null && py.jcs !== null ? ts.jcs === py.jcs : null;
  const rec: Record<string, unknown> = {
    case: c.case,
    input_bytes: c.input,
    input_sha256: createHash("sha256").update(c.input, "utf8").digest("hex"),
    typescript: ts,
    typescript_json_parse: plain,
    python: py,
    serialisers_agree: agree,
    specification: {
      pinned: specRel,
      decides_this_case: c.decides,
      line: at + 1,
      quote: c.rests_on,
      sentence: c.sentence,
    },
    generated_by: "npx tsx tools/compliance-fields-recompute.ts --write-numbers",
  };
  if (c.probes) {
    const probes = [];
    for (const p of c.probes) {
      const t = tsSide(p);
      const q = await pySide(p);
      probes.push({ input_bytes: p, typescript_jcs: t.jcs ?? `refused: ${t.error}`, python_jcs: q.jcs ?? `refused: ${q.error}`, agree: t.jcs !== null && q.jcs !== null ? t.jcs === q.jcs : null });
    }
    rec["probes"] = probes;
  }
  return rec;
}

async function main(): Promise<number> {
  const buf = readFileSync(SPEC);
  let bad = 0;
  console.log(`== ${specRel} (${buf.length} bytes, sha256 ${createHash("sha256").update(buf).digest("hex")})`);

  for (const [n, row] of tableRows(buf).entries()) {
    const ts = tsSide(row.input.text);
    const py = await pySide(row.input.text);
    const agree = ts.jcs !== null && ts.jcs === py.jcs;
    const canonOk = agree && ts.jcs === row.canonical.text;
    const digestOk = agree && ts.recordDigest === row.digest.text;
    // The table's own canonical form, digested directly: independent of either serialiser.
    const direct = keccakHex(row.canonical.text);
    if (!(canonOk && digestOk && direct === row.digest.text)) bad++;
    console.log(`vector ${n + 1} (line ${row.input.line}; input bytes ${row.input.byteStart}-${row.input.byteEnd}, canonical ${row.canonical.byteStart}-${row.canonical.byteEnd}, recordDigest ${row.digest.byteStart}-${row.digest.byteEnd})`);
    console.log(`    input              : ${row.input.text}`);
    console.log(`    typescript         : ${ts.jcs ?? "refused: " + ts.error}   [${ts.parsed_as}]`);
    console.log(`    python             : ${py.jcs ?? "refused: " + py.error}   [${py.parsed_as}]`);
    console.log(`    canonical form     : ${canonOk ? "match" : "mismatch"} (table ${row.canonical.text})`);
    console.log(`    recordDigest       : ${digestOk ? "match" : "mismatch"} (table ${row.digest.text}, recomputed ${ts.recordDigest})`);
    console.log(`    keccak of table's canonical form: ${direct === row.digest.text ? "match" : "mismatch"} (${direct})`);
  }

  // The one other digest the text publishes over literal bytes.
  const lines = specLines();
  const dl = lines.findIndex((l) => l.includes("Over the 15 bytes `{\"b\":\"x\",\"a\":1}`"));
  if (dl >= 0) {
    const declared = /it is `(0x[0-9a-f]{64})`/.exec(lines[dl]!)?.[1] ?? "(none)";
    const got = keccakHex('{"b":"x","a":1}');
    if (got !== declared) bad++;
    console.log(`buyer.declarationDigest example (line ${dl + 1}): keccak256 over the 15 raw bytes, no canonicalization: ${got === declared ? "match" : "mismatch"} (text ${declared}, recomputed ${got})`);
  }

  if (specRel.includes("b8a81c099d0d30607416211f819db8a40bda5371")) {
    if (WRITE) mkdirSync(NUMBERS, { recursive: true });
    for (const c of CASES) {
      const rec = await numberCase(c);
      const body = JSON.stringify(rec, null, 2) + "\n";
      const path = join(NUMBERS, c.file);
      const ts = rec["typescript"] as Side;
      const py = rec["python"] as Side;
      console.log(`number case ${c.file}: typescript ${ts.jcs ?? "refused (" + ts.error + ")"} | python ${py.jcs ?? "refused (" + py.error + ")"} | agree ${String(rec["serialisers_agree"])} | text decides: ${c.decides}`);
      if (WRITE) writeFileSync(path, body, "utf8");
      else if (!existsSync(path) || readFileSync(path, "utf8") !== body) {
        bad++;
        console.log(`    MISMATCH: ${relative(REPO, path)} differs from this run's output (re-run with --write-numbers only if the change is intended)`);
      }
    }
  }

  proc.stdin!.end();
  console.log(`SUMMARY ${bad === 0 ? "ok" : `${bad} failing check(s)`}`);
  return bad === 0 ? 0 : 1;
}

main().then(
  (c) => process.exit(c),
  (e) => {
    console.error(e);
    process.exit(2);
  },
);
