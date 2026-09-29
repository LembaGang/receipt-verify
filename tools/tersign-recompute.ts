#!/usr/bin/env tsx
/**
 * Tersign's evidence-record conformance suite, recomputed from the pinned bytes.
 *
 * The walker (tools/walk-digests.ts) knows one digest, sha256, and its census
 * does not see `0x`-prefixed hex. Every content address in this suite is
 * keccak256 over RFC 8785 bytes, written `0x<64 hex>`, so the walker can grade
 * only the suite's one sha256 relation (`anchor_relation`, registered in
 * walker/scopes.json as tersign.anchor_relation). Everything else is here.
 *
 * Every construction below is read from the suite's own MANIFEST.json, by line,
 * and nothing from verify.py is used to decide what a value should be. The one
 * construction the manifest does not state -- the boundary event's prefixDigest
 * -- is still recomputed, and its row says the construction came from verify.py
 * line 502, the author's checker, not from a governing document.
 *
 * Two serialisers, each parsing the raw vector bytes itself. The TypeScript side
 * is JSON.parse then the repository's JCS (chirindo's `jcs`); the Python side is
 * json.loads then tools/asqav_envelope_hash.py's `jcs`, imported unmodified. A
 * digest is compared only when both produce the same bytes. A refusal by either
 * is its own outcome and is never resolved in favour of the other.
 *
 * This is a recomputation, not a verdict engine: it says whether each declared
 * value equals the value its stated construction yields over the bytes the
 * vector carries. The author's expected verdict is printed beside it, because a
 * negative vector is SUPPOSED to carry a value that does not recompute.
 *
 *   npx tsx tools/tersign-recompute.ts [--dir <corpus dir>] [--json <out.json>]
 *
 * Exit 0 when no row is a serializer_disagreement and no `expect: valid`
 * vector carries a mismatch; 1 otherwise; 2 when the corpus cannot be read.
 */

import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { jcs } from "@headlessoracle/chirindo/dist/vendor/recorder/index.js";
import { recoverAddress } from "../src/adapters/insight.js";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const argv = process.argv.slice(2);
const argOf = (n: string): string | undefined => (argv.indexOf(n) >= 0 ? argv[argv.indexOf(n) + 1] : undefined);
const DIR = resolve(argOf("--dir") ?? join(REPO, "fixtures", "tersign-evidence-record-conformance", "1075ca65b4495212cf49a891e63e07f2cf48acf8"));
const OUT = argOf("--json");

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
type Outcome = "match" | "mismatch" | "serializer_disagreement" | "refused" | "not_recomputed";

interface Row {
  vector: string;
  kind: string;
  expect: string;
  pointer: string;
  construction: string;
  source: string;
  declared: string;
  recomputed: string | null;
  outcome: Outcome;
  note?: string;
}

// MANIFEST.json lines, at 1075ca65. Each row cites the one that states its construction.
const M = {
  canonicalization: "MANIFEST.json line 6",
  content_address: "MANIFEST.json line 7",
  chain_link: "MANIFEST.json line 8",
  chain_set: "MANIFEST.json line 9",
  chain_commitment: "MANIFEST.json line 10",
  anchor_relation: "MANIFEST.json line 11",
  offer_binding: "MANIFEST.json line 12",
  decision_evidence_binding: "MANIFEST.json line 13",
  commitment_derivation: "MANIFEST.json line 17",
};

// ---------------------------------------------------------------------------
// The Python side: json.loads over the raw file, then asqav_envelope_hash.jcs.
// ---------------------------------------------------------------------------

const PY = `
import io, json, sys
sys.path.insert(0, sys.argv[1])
from asqav_envelope_hash import jcs
stdin = io.TextIOWrapper(sys.stdin.buffer, encoding="utf-8", newline="")
stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", newline="")
for line in stdin:
    if not line.strip():
        continue
    req = json.loads(line)
    try:
        if "text" in req:
            v = json.loads(req["text"])
        else:
            with open(req["file"], "r", encoding="utf-8") as f:
                v = json.load(f)
        for tok in [t for t in req.get("pointer", "").split("/")[1:]]:
            tok = tok.replace("~1", "/").replace("~0", "~")
            v = v[int(tok)] if isinstance(v, list) else v[tok]
        out = {"id": req["id"], "jcs": jcs(v), "pytype": type(v).__name__}
    except Exception as e:
        out = {"id": req["id"], "error": "%s: %s" % (type(e).__name__, e)}
    stdout.write(json.dumps(out) + "\\n")
    stdout.flush()
`;

class Py {
  private proc = spawn("python", ["-c", PY, join(REPO, "tools")], { stdio: ["pipe", "pipe", "pipe"] });
  private buf = "";
  private next = 0;
  private waiting = new Map<string, (m: Record<string, string>) => void>();
  constructor() {
    this.proc.stdout!.setEncoding("utf8");
    this.proc.stdout!.on("data", (c: string) => {
      this.buf += c;
      let i: number;
      while ((i = this.buf.indexOf("\n")) >= 0) {
        const m = JSON.parse(this.buf.slice(0, i)) as Record<string, string>;
        this.buf = this.buf.slice(i + 1);
        this.waiting.get(m["id"]!)?.(m);
        this.waiting.delete(m["id"]!);
      }
    });
  }
  ask(req: { file?: string; text?: string; pointer?: string }): Promise<Record<string, string>> {
    const id = String(this.next++);
    return new Promise((res) => {
      this.waiting.set(id, res);
      this.proc.stdin!.write(JSON.stringify({ id, ...req }) + "\n");
    });
  }
  end(): void {
    this.proc.stdin!.end();
  }
}

const py = new Py();

const at = (v: Json, pointer: string): Json | undefined => {
  let cur: Json | undefined = v;
  for (const raw of pointer.split("/").slice(1)) {
    const t = raw.replace(/~1/g, "/").replace(/~0/g, "~");
    if (cur === null || typeof cur !== "object") return undefined;
    cur = Array.isArray(cur) ? cur[Number(t)] : (cur as Record<string, Json>)[t];
  }
  return cur;
};

interface Canon { ok: true; text: string }
interface CanonFail { ok: false; outcome: "serializer_disagreement" | "refused"; detail: string }

/** Both serialisers over one value, each from the raw bytes. */
async function canon(file: string, pointer: string, tsValue: Json | undefined, text?: string): Promise<Canon | CanonFail> {
  let ts: string | null = null;
  let tsErr = "";
  try {
    ts = jcs(tsValue) as string;
  } catch (e) {
    tsErr = (e as Error).message;
  }
  const p = await py.ask(text !== undefined ? { text, pointer } : { file, pointer });
  if (ts === null || p["error"] !== undefined) {
    return {
      ok: false,
      outcome: "refused",
      detail: `TypeScript ${ts === null ? "refused: " + tsErr : "produced " + ts}; Python ${p["error"] !== undefined ? "refused: " + p["error"] : "produced " + p["jcs"]}`,
    };
  }
  if (ts !== p["jcs"]) return { ok: false, outcome: "serializer_disagreement", detail: `TypeScript ${ts} | Python ${p["jcs"]}` };
  return { ok: true, text: ts };
}

const hex = (b: Uint8Array): string => "0x" + Buffer.from(b).toString("hex");
const bytesOf = (d: string): Buffer => Buffer.from(d.slice(2), "hex");
const keccak = (b: Uint8Array | string): string => hex(keccak_256(typeof b === "string" ? Buffer.from(b, "utf8") : b));
const sha256 = (b: Uint8Array): string => "0x" + createHash("sha256").update(b).digest("hex");
const DIGEST = /^0x[0-9a-fA-F]{64}$/;
const ZERO = "0x" + "00".repeat(32);
const same = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

function linkOf(artifact: string, prev: string | null, seq: number): string {
  const s = Buffer.alloc(8);
  s.writeBigUInt64BE(BigInt(seq));
  return keccak(Buffer.concat([bytesOf(artifact), bytesOf(prev ?? ZERO), s]));
}

async function main(): Promise<number> {
  const manifest = JSON.parse(readFileSync(join(DIR, "MANIFEST.json"), "utf8")) as { version: string; vectors: Array<{ file: string; kind: string; expect: string; reason?: string }> };
  const rows: Row[] = [];
  const signatures: Array<{ vector: string; pointer: string; scheme: string; result: string }> = [];

  for (const e of manifest.vectors) {
    const file = join(DIR, "vectors", e.file);
    const raw = readFileSync(file, "utf8");
    const v = JSON.parse(raw) as Json;
    const expect = e.expect + (e.reason ? `/${e.reason}` : "");
    const row = (pointer: string, construction: string, source: string, declared: string, recomputed: string | null, outcome: Outcome, note?: string) =>
      rows.push({ vector: e.file, kind: e.kind, expect, pointer, construction, source, declared, recomputed, outcome, ...(note ? { note } : {}) });

    /** keccak256(utf8(jcs(value at valuePtr))) against the declared value at declPtr. */
    const digestRow = async (declPtr: string, valuePtr: string, construction: string, source: string, text?: string) => {
      const declared = at(v, declPtr);
      if (typeof declared !== "string") return;
      const c = await canon(file, text !== undefined ? "" : valuePtr, text !== undefined ? (JSON.parse(text) as Json) : at(v, valuePtr), text);
      if (!c.ok) return row(declPtr, construction, source, declared, null, c.outcome, c.detail);
      const got = keccak(c.text);
      row(declPtr, construction, source, declared, got, same(got, declared) ? "match" : "mismatch", `${Buffer.byteLength(c.text)} bytes of JCS`);
    };

    const inp = at(v, "/input") as Record<string, Json>;
    switch (e.kind) {
      case "digest_recompute":
        await digestRow("/input/expected_digest", "/input/payload", "keccak256(utf8(jcs(/input/payload)))", M.content_address);
        break;
      case "canonical_bytes": {
        const declared = String(inp["claimed_canonical"]);
        const text = typeof inp["payload_text"] === "string" ? (inp["payload_text"] as string) : undefined;
        const c = await canon(file, text !== undefined ? "" : "/input/payload", text !== undefined ? (JSON.parse(text) as Json) : inp["payload"], text);
        const construction = text !== undefined ? "jcs(each serialiser's own parse of /input/payload_text)" : "jcs(/input/payload)";
        if (!c.ok) row("/input/claimed_canonical", construction, M.canonicalization, declared, null, c.outcome, c.detail);
        else
          row("/input/claimed_canonical", construction, M.canonicalization, declared, c.text, c.text === declared ? "match" : "mismatch",
            text !== undefined
              ? "the TypeScript side parsed payload_text with JSON.parse and the Python side with json.loads; both serialisers emitted the same bytes. MANIFEST.json line 6 puts a fraction or exponent TOKEN outside the digest domain; that is a token-class rule, which neither serialiser here enforces, so the byte comparison is all this row states"
              : undefined);
        break;
      }
      case "chain_link": {
        const declared = String(inp["expected_link"]);
        const art = String(inp["artifact_digest"]);
        const prev = inp["prev_digest"] === null ? null : String(inp["prev_digest"]);
        const got = linkOf(art, prev, Number(inp["seq"]));
        row("/input/expected_link", "keccak256(artifact_digest || (prev_digest, 32 zero bytes when null) || seq as 8-byte big-endian)", M.chain_link, declared, got, same(got, declared) ? "match" : "mismatch");
        break;
      }
      case "chain_set":
      case "chain_commitment": {
        const records = (inp["records"] as Array<Record<string, Json>>) ?? [];
        records.forEach((r, i) => {
          if (typeof r["link"] !== "string") return;
          const prev = r["prev_digest"] === null || r["prev_digest"] === undefined ? null : String(r["prev_digest"]);
          if (!DIGEST.test(String(r["artifact_digest"])) || (prev !== null && !DIGEST.test(prev)) || typeof r["seq"] !== "number") {
            row(`/input/records/${i}/link`, "keccak256(artifact || prev || seq_be8)", M.chain_set, String(r["link"]), null, "not_recomputed", "the record's artifact, prev or seq is not a parseable digest or integer");
            return;
          }
          const got = linkOf(String(r["artifact_digest"]), prev, r["seq"] as number);
          row(`/input/records/${i}/link`, "keccak256(this record's artifact_digest || its prev_digest (32 zero bytes when null) || its seq as 8-byte big-endian)", M.chain_set, String(r["link"]), got, same(got, String(r["link"])) ? "match" : "mismatch");
        });
        // prev pointers and the head are EQUALITIES the manifest states, over the records in seq order.
        const bySeq = records.map((r, i) => ({ r, i })).sort((a, b) => Number(a.r["seq"]) - Number(b.r["seq"]));
        bySeq.forEach(({ r, i }, k) => {
          if (typeof r["prev_digest"] !== "string") return;
          const want = k === 0 ? null : String(bySeq[k - 1]!.r["artifact_digest"]);
          row(`/input/records/${i}/prev_digest`, "equality: the artifact_digest of the record before it in seq order (genesis prev = null)", M.chain_set, String(r["prev_digest"]), want,
            want !== null && same(want, String(r["prev_digest"])) ? "match" : "mismatch",
            Number(r["seq"]) === Number(bySeq[k - 1]?.r["seq"]) ? "two records share this seq" : undefined);
        });
        const head = inp["head"] as Record<string, Json> | undefined;
        if (head && typeof head["digest"] === "string") {
          const last = bySeq[bySeq.length - 1];
          const want = last ? String(last.r["artifact_digest"]) : null;
          row("/input/head/digest", "equality: the final record's artifact_digest", M.chain_set, String(head["digest"]), want, want !== null && same(want, String(head["digest"])) ? "match" : "mismatch");
        }
        if (head && typeof head["acc"] === "string") {
          // Folded over the RECOMPUTED links, prev = the previous artifact in seq order (MANIFEST.json line 10).
          let acc = keccak("tersign-chain-commitment-v1");
          let prev: string | null = null;
          for (const { r } of bySeq) {
            const link = linkOf(String(r["artifact_digest"]), prev, Number(r["seq"]));
            acc = keccak(Buffer.concat([bytesOf(acc), bytesOf(link)]));
            prev = String(r["artifact_digest"]);
          }
          row("/input/head/acc", "acc_0 = keccak256(utf8('tersign-chain-commitment-v1')); acc_n = keccak256(acc_{n-1} || link_n) over the records in seq order", M.chain_commitment, String(head["acc"]), acc, same(acc, String(head["acc"])) ? "match" : "mismatch",
            `folded over ${bySeq.length} records`);
        }
        const prov = at(v, "/provenance") as Record<string, Json> | undefined;
        if (prov && typeof prov["commitment_digest"] === "string") {
          await digestRow("/provenance/commitment_digest", "/provenance/commitment", "keccak256(utf8(jcs(/provenance/commitment)))", `${M.chain_commitment} ("Production stamps keccak256(utf8(canonical({acc, head, schema, seq})))") and this vector's /provenance/note`);
          const c = prov["commitment"] as Record<string, Json>;
          if (head) {
            row("/provenance/commitment/acc", "equality: /input/head/acc", M.chain_commitment, String(c["acc"]), String(head["acc"]), same(String(c["acc"]), String(head["acc"])) ? "match" : "mismatch");
            row("/provenance/commitment/head", "equality: /input/head/digest", M.chain_commitment, String(c["head"]), String(head["digest"]), same(String(c["head"]), String(head["digest"])) ? "match" : "mismatch");
          }
          if (typeof prov["anchored_digest"] === "string") {
            const got = sha256(bytesOf(String(prov["commitment_digest"])));
            row("/provenance/anchored_digest", "sha256(the 32 bytes of /provenance/commitment_digest)", `${M.anchor_relation} and this vector's /provenance/note`, String(prov["anchored_digest"]), got, same(got, String(prov["anchored_digest"])) ? "match" : "mismatch", "also graded by the walker, rule tersign.anchor_relation.provenance");
          }
        }
        break;
      }
      case "anchor_relation": {
        const got = sha256(bytesOf(String(inp["subject_digest"])));
        row("/input/anchored_digest", "sha256(the 32 bytes of /input/subject_digest)", M.anchor_relation, String(inp["anchored_digest"]), got, same(got, String(inp["anchored_digest"])) ? "match" : "mismatch", "also graded by the walker, rule tersign.anchor_relation");
        break;
      }
      case "offer_binding":
        await digestRow("/input/receipt/offerDigest", "/input/offer", "keccak256(utf8(jcs(/input/offer)))", M.offer_binding);
        break;
      case "decision_evidence_binding":
        await digestRow("/input/record/decisionEvidenceDigest", "/input/decision_evidence", "keccak256(utf8(jcs(/input/decision_evidence)))", M.decision_evidence_binding);
        break;
      case "boundary_binding":
        await digestRow("/input/boundary_event/prefixDigest", "/input/prefix", "keccak256(utf8(jcs(/input/prefix)))",
          "NOT stated in MANIFEST.json or README.md; construction read from verify.py line 502 (the author's checker)");
        break;
      case "independence_claim":
      case "phase_claim": {
        for (const base of ["/input", "/input/record"]) {
          const o = at(v, base) as Record<string, Json> | undefined;
          if (!o || typeof o !== "object" || typeof o["deliverable_digest"] !== "string") continue;
          const declared = String(o["deliverable_digest"]);
          if (typeof o["deliverable_bytes"] !== "string") {
            row(`${base}/deliverable_digest`, "keccak256(utf8(deliverable_bytes))", M.commitment_derivation, declared, null, "not_recomputed", "no deliverable_bytes beside it: the corpus carries no preimage");
            continue;
          }
          const got = keccak(String(o["deliverable_bytes"]));
          row(`${base}/deliverable_digest`, "keccak256(utf8(deliverable_bytes))", M.commitment_derivation, declared, got, same(got, declared) ? "match" : "mismatch");
        }
        break;
      }
    }

    // Signatures: the column is recorded apart from the digest rows.
    const pl = at(v, "/input/payload") as Record<string, Json> | undefined;
    if (pl && typeof pl === "object" && typeof pl["signature"] === "string") {
      signatures.push({ vector: e.file, pointer: "/input/payload/signature", scheme: `EIP-712 (format ${JSON.stringify(pl["format"])})`,
        result: "not_implemented (EIP-712: the corpus states no typed-data domain or types for this payload, so there is no digest to recover over)" });
    }
    const cs = at(v, "/provenance/countersignature");
    if (typeof cs === "string") {
      // p4 is this record's chain link; the provenance note says the countersignature is personal_sign over it.
      const link = linkOf(String(at(v, "/input/expected_digest")), null, 1);
      const prefix = Buffer.from("\x19Ethereum Signed Message:\n32", "utf8");
      const signer = String(at(v, "/provenance/ledger_signer"));
      const got = recoverAddress(keccak_256(Buffer.concat([prefix, bytesOf(link)])), cs);
      signatures.push({ vector: e.file, pointer: "/provenance/countersignature", scheme: "secp256k1 personal_sign (EIP-191) over the 32 bytes of the seq-1 chain link",
        result: got === null ? "unrecoverable" : `recovers ${got}; /provenance/ledger_signer is ${signer}: ${same(got, signer) ? "match" : "mismatch"} (link ${link})` });
    }
  }
  py.end();

  const count = (o: Outcome) => rows.filter((r) => r.outcome === o).length;
  const bad = rows.filter((r) => r.outcome === "serializer_disagreement" || (r.outcome === "mismatch" && r.expect === "valid"));
  for (const r of rows) {
    console.log(`${r.outcome.toUpperCase().padEnd(24)} ${r.vector}#${r.pointer}  [expect ${r.expect}]`);
    if (r.outcome !== "match") {
      console.log(`    declared   : ${r.declared}`);
      console.log(`    recomputed : ${r.recomputed}`);
      console.log(`    scope      : ${r.construction} [${r.source}]`);
      if (r.note) console.log(`    note       : ${r.note}`);
    }
  }
  for (const s of signatures) console.log(`SIGNATURE ${s.vector}#${s.pointer}  ${s.scheme}: ${s.result}`);
  const summary = `SUMMARY tersign ${manifest.version}: ${manifest.vectors.length} vectors, ${rows.length} rows: match=${count("match")} mismatch=${count("mismatch")} serializer_disagreement=${count("serializer_disagreement")} refused=${count("refused")} not_recomputed=${count("not_recomputed")}; mismatches on expect:valid vectors=${rows.filter((r) => r.outcome === "mismatch" && r.expect === "valid").length}`;
  console.log(summary);
  if (OUT) writeFileSync(OUT, JSON.stringify({ corpus: DIR, rows, signatures, summary }, null, 2) + "\n", "utf8");
  return bad.length === 0 ? 0 : 1;
}

main().then(
  (c) => process.exit(c),
  (e) => {
    console.error(e);
    process.exit(2);
  },
);
