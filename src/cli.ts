#!/usr/bin/env node
// receipt-verify — recompute an agent receipt and return a tri-state verdict.
//
//   VALID         exit 0
//   INVALID       exit 1   (key-binding; names the resolved key)
//   UNVERIFIABLE  exit 1   (fail-closed; never prints a "verified under key" line)

import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { adapterByFormat, detectFormat, FORMAT_NAMES } from "./detect.js";
import { exitCodeFor, formatResult, jsonResult, unverifiable } from "./verdict.js";
import type { VerifyOptions, VerifyResult } from "./types.js";

const USAGE = `receipt-verify 0.1.0 — cross-format agent-receipt verifier

  receipt-verify <file> [options]

Options:
  --format <name>     ${FORMAT_NAMES.join(" | ")}   (default: auto-detect by shape)
  --jwks <path|url>   published JWK Set: a .json file, a directory of them, or an https URL
  --mapping-dir <dir> directory of mapping documents, for formats that bind to one
  --payload <file>    detached-JWS payload: the bytes the signature covers
  --payload-jcs       canonicalize --payload with RFC 8785 JCS before verifying
  --prev <file>       predecessor receipt, for formats carrying a chain link
  --disclose <file>   disclosed {name, value, salt, proof} tuples, for committed fields
  --clock-tolerance <s>  seconds of clock tolerance for exp/nbf (default 60)
  --now <epoch>       evaluate time-based checks at this instant, for reproducible runs
  --json              emit the machine-readable verdict object
  --help

This tool verifies RECEIPTS under FORMATS. It does not certify vendors and it
does not issue gate decisions. A receipt's own gate value is reported as an
annotation, never as this tool's recommendation.
`;

interface Args {
  file?: string;
  format?: string;
  jwks?: string;
  mappingDir?: string;
  payload?: string;
  payloadJcs: boolean;
  prev?: string;
  disclose?: string;
  clockTolerance?: number;
  now?: number;
  json: boolean;
  help: boolean;
}

export function parseArgs(argv: string[]): Args | string {
  const a: Args = { payloadJcs: false, json: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i]!;
    const next = (): string | null => {
      const v = argv[++i];
      return v === undefined ? null : v;
    };
    switch (t) {
      case "--help":
      case "-h":
        a.help = true;
        break;
      case "--json":
        a.json = true;
        break;
      case "--payload-jcs":
        a.payloadJcs = true;
        break;
      case "--format": {
        const v = next();
        if (v === null) return "--format needs a value";
        a.format = v;
        break;
      }
      case "--jwks": {
        const v = next();
        if (v === null) return "--jwks needs a value";
        a.jwks = v;
        break;
      }
      case "--mapping-dir": {
        const v = next();
        if (v === null) return "--mapping-dir needs a value";
        a.mappingDir = v;
        break;
      }
      case "--payload": {
        const v = next();
        if (v === null) return "--payload needs a value";
        a.payload = v;
        break;
      }
      case "--prev": {
        const v = next();
        if (v === null) return "--prev needs a value";
        a.prev = v;
        break;
      }
      case "--disclose": {
        const v = next();
        if (v === null) return "--disclose needs a value";
        a.disclose = v;
        break;
      }
      case "--clock-tolerance": {
        const v = next();
        if (v === null || !Number.isFinite(Number(v))) return "--clock-tolerance needs a number of seconds";
        a.clockTolerance = Number(v);
        break;
      }
      case "--now": {
        const v = next();
        if (v === null || !Number.isFinite(Number(v))) return "--now needs an epoch-seconds value";
        a.now = Number(v);
        break;
      }
      default:
        if (t.startsWith("-")) return `unknown option ${t}`;
        if (a.file !== undefined) return `unexpected extra argument ${t}`;
        a.file = t;
    }
  }
  return a;
}

export async function run(argv: string[]): Promise<{ result: VerifyResult | null; text: string; exitCode: number }> {
  const parsed = parseArgs(argv);
  if (typeof parsed === "string") return { result: null, text: `${parsed}\n\n${USAGE}`, exitCode: 2 };
  if (parsed.help || parsed.file === undefined) {
    return { result: null, text: USAGE, exitCode: parsed.help ? 0 : 2 };
  }

  let bytes: Buffer;
  try {
    bytes = readFileSync(parsed.file);
  } catch (e) {
    const r = unverifiable("unknown", "io_error", `could not read ${parsed.file}: ${(e as Error).message}`);
    return { result: r, text: parsed.json ? jsonResult(r) : formatResult(r), exitCode: exitCodeFor(r) };
  }

  const adapter = parsed.format === undefined ? null : adapterByFormat(parsed.format);
  if (parsed.format !== undefined && adapter === undefined) {
    const r = unverifiable("unknown", "format_unrecognized", `unknown --format ${parsed.format}; known formats: ${FORMAT_NAMES.join(", ")}`);
    return { result: r, text: parsed.json ? jsonResult(r) : formatResult(r), exitCode: exitCodeFor(r) };
  }

  let chosen = adapter ?? undefined;
  if (chosen === undefined) {
    const d = detectFormat(bytes);
    if (!d.ok) {
      const detail =
        d.reason === "none"
          ? `no adapter recognises the shape of ${parsed.file}; name it with --format <${FORMAT_NAMES.join("|")}>`
          : `shape matches more than one format (${d.candidates.join(", ")}); name it with --format`;
      const r = unverifiable("unknown", "format_unrecognized", detail);
      return { result: r, text: parsed.json ? jsonResult(r) : formatResult(r), exitCode: exitCodeFor(r) };
    }
    chosen = d.adapter;
  }

  const opts: VerifyOptions = { sourcePath: parsed.file, canonicalizePayload: parsed.payloadJcs };
  if (parsed.jwks !== undefined) opts.jwks = parsed.jwks;
  if (parsed.mappingDir !== undefined) opts.mappingDir = parsed.mappingDir;
  if (parsed.clockTolerance !== undefined) opts.clockToleranceSec = parsed.clockTolerance;
  if (parsed.now !== undefined) opts.now = parsed.now;
  // The three optional byte inputs fail the same way: an unreadable companion
  // file is an io_error, never a quietly-skipped check.
  for (const [flag, path, field] of [
    ["--payload", parsed.payload, "detachedPayload"],
    ["--prev", parsed.prev, "previousReceipt"],
    ["--disclose", parsed.disclose, "disclosures"],
  ] as const) {
    if (path === undefined) continue;
    try {
      opts[field] = readFileSync(path);
    } catch (e) {
      const r = unverifiable(chosen.format, "io_error", `could not read ${flag} ${path}: ${(e as Error).message}`);
      return { result: r, text: parsed.json ? jsonResult(r) : formatResult(r), exitCode: exitCodeFor(r) };
    }
  }

  const result = await chosen.verify(bytes, opts);
  return {
    result,
    text: parsed.json ? jsonResult(result) : formatResult(result),
    exitCode: exitCodeFor(result),
  };
}

// Only self-executes when invoked as a program, so tests can import `run`.
function invokedDirectly(): boolean {
  const entry = process.argv[1];
  if (entry === undefined) return false;
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(entry);
  } catch {
    return false;
  }
}

if (invokedDirectly()) {
  const { text, exitCode } = await run(process.argv.slice(2));
  (exitCode === 0 ? process.stdout : process.stderr).write(text + "\n");
  process.exit(exitCode);
}
