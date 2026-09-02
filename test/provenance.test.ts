// The `corrections:` front matter of fixtures/provenance.md, checked against the
// document it describes.
//
// That block was added so a machine could read which recorded facts had been
// corrected and where. Nothing parsed it, so nothing noticed if a `section:`
// string stopped matching the heading it points at -- a correction keyed to a
// heading that no longer exists is a correction no reader can follow, and the
// block would have gone on looking machine-readable while pointing at nothing.
//
// The `yaml` package is NOT in this repository's dependency tree (`npm ls yaml`
// reports empty), so the block is parsed by the small reader below rather than
// by a library. It handles exactly the flat shape this front matter uses -- a
// top-level key, a list of `- key: value` entries, double-quoted or bare scalars
// -- and throws on anything else rather than silently returning a partial parse.
// If the front matter ever grows nested structures, this test fails loudly and
// the right fix is to add a real YAML parser, not to widen this reader.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FIX } from "./helpers.js";

const PROVENANCE = join(FIX, "provenance.md");

interface Correction {
  [k: string]: string | boolean;
}

/** Split a document into its front matter block and body. Returns null when there is none. */
export function splitFrontMatter(text: string): { front: string; body: string } | null {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") return null;
  const end = lines.indexOf("---", 1);
  if (end < 0) throw new Error("front matter opens with --- but never closes");
  return { front: lines.slice(1, end).join("\n"), body: lines.slice(end + 1).join("\n") };
}

/** A scalar: "quoted", true/false, or a bare token. */
function scalar(raw: string): string | boolean {
  const s = raw.trim();
  if (s === "true") return true;
  if (s === "false") return false;
  const q = /^"((?:[^"\\]|\\.)*)"$/.exec(s);
  if (q) return q[1]!.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  if (/^['[{]/.test(s)) throw new Error(`unsupported scalar form in the front matter: ${s.slice(0, 40)}`);
  return s;
}

/** Parse `corrections:` -- a list of flat maps. Throws on any shape it does not handle. */
export function parseCorrections(front: string): Correction[] {
  const out: Correction[] = [];
  let inList = false;
  let current: Correction | null = null;
  for (const line of front.split("\n")) {
    if (line.trim() === "") continue;
    if (/^\S/.test(line)) {
      // A top-level key. Only `corrections:` is understood; anything else ends it.
      inList = /^corrections:\s*$/.test(line);
      if (current) {
        out.push(current);
        current = null;
      }
      if (!inList && !/^[A-Za-z_][\w-]*:/.test(line)) {
        throw new Error(`unexpected top-level line in the front matter: ${line}`);
      }
      continue;
    }
    if (!inList) continue;
    const item = /^\s*-\s+([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (item) {
      if (current) out.push(current);
      current = { [item[1]!]: scalar(item[2]!) };
      continue;
    }
    const pair = /^\s+([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (pair) {
      if (!current) throw new Error(`front-matter key outside any list entry: ${line}`);
      current[pair[1]!] = scalar(pair[2]!);
      continue;
    }
    throw new Error(`unparseable front-matter line: ${line}`);
  }
  if (current) out.push(current);
  return out;
}

/** Every `## ` heading in the body, as its exact text. */
export function headings(body: string): string[] {
  return body
    .split("\n")
    .filter((l) => l.startsWith("## "))
    .map((l) => l.slice(3));
}

describe("fixtures/provenance.md — the corrections front matter", () => {
  const text = readFileSync(PROVENANCE, "utf8");
  const split = splitFrontMatter(text);

  it("has front matter, so there is something to check", () => {
    expect(split).not.toBeNull();
  });

  const corrections = split ? parseCorrections(split.front) : [];

  it("parses corrections as a non-empty list", () => {
    expect(Array.isArray(corrections)).toBe(true);
    expect(corrections.length).toBeGreaterThan(0);
  });

  it("keys every correction to a heading that exists in the document, exactly", () => {
    // The whole value of the block is this pointer. A section string that does
    // not match a heading is a dangling reference dressed as structured data.
    const hs = headings(split!.body);
    expect(hs.length).toBeGreaterThan(0);
    for (const c of corrections) {
      expect(typeof c["section"]).toBe("string");
      expect(hs).toContain(c["section"] as string);
    }
  });

  it("gives every correction a non-empty stated, actual, corrected_in and corrected_on", () => {
    for (const c of corrections) {
      for (const field of ["stated", "actual", "corrected_in", "corrected_on"]) {
        expect(typeof c[field]).toBe("string");
        expect((c[field] as string).trim()).not.toBe("");
      }
    }
  });

  it("CONTROL: one character changed in a section string breaks the heading check", () => {
    // Without this, the heading assertion above would pass just as happily on a
    // block whose pointers were checked against nothing.
    const c0 = corrections[0]!;
    const original = c0["section"] as string;
    const mutated = original.slice(0, -1) + (original.endsWith("n") ? "m" : "n");
    expect(mutated).not.toBe(original);
    expect(mutated.length).toBe(original.length);

    const mutatedText = text.replace(`section: "${original}"`, `section: "${mutated}"`);
    expect(mutatedText).not.toBe(text); // the replacement actually happened

    const s = splitFrontMatter(mutatedText)!;
    const parsed = parseCorrections(s.front);
    const hs = headings(s.body);
    expect(parsed[0]!["section"]).toBe(mutated);
    expect(hs).not.toContain(mutated);
    // And the unmutated document still passes, so the control is about the
    // mutation and not about a broken reader.
    expect(headings(split!.body)).toContain(original);
  });
});
