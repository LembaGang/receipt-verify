// Section 5 discovery: find every vector that reproduces a derived identifier,
// naming no member and no value. Run from cpb/run-vectors.ts and asserted in
// test/cpb/vectors.test.ts.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { canonicalDigestJcs, findDuplicateMemberName, type JsonValue } from "./index.js";

/**
 * SECTION-5 DISCOVERY — the search that names nothing.
 *
 * For every object anywhere in every vector, under every exclusion set declared
 * anywhere in the same file, compute §5 and ask whether the result equals ANY
 * 64-hex string anywhere in that file. No payload member name is named, no
 * identifier member name is named, and no value is named.
 *
 * WHY IT REPLACED THE SEARCH BEFORE IT. The previous version named five
 * identifier members, taken from reading the corpus. That was the fifth
 * assumption in a row to be wrong: `jcs-n/kats/08`, `09` and `22` each carry a
 * payload, a non-empty exclusion set and the derived identifier of the reduced
 * payload under the member name `digest`, which was not among the five. All
 * three reproduce. kat-22 is the top-level-only matching rule, and it is a
 * falsification test the draft's own author proposed; it had been counted as a
 * §4.1 vector and never as a §5 one.
 *
 * The count of vectors exercising §5 has now been, in order: 3, 10, 12, 14, 15,
 * and 18. Every one of the first five came from a search scoped by something.
 * This one is scoped by one thing only, stated here rather than discovered
 * later: THE ANSWER MUST BE WRITTEN DOWN SOMEWHERE IN THE SAME FILE. A vector
 * that carries a payload and an exclusion set but pins its identifier in a
 * sibling file, or not at all, is invisible to this and to every search above.
 *
 * TWO KINDS OF HIT, reported separately and never summed into one number:
 *
 *   removal_observable — the exclusion set is non-empty AND removes a member
 *     the payload actually has. This is §5 doing something §4.1 does not.
 *   removal_is_a_noop  — the exclusion set removes nothing. §5 degenerates to
 *     §4.1 here, so the vector exercises §5's interface and not its removal
 *     step. Kats 20 and 21 are this case and still belong: their pinned value
 *     is named `correct_derived_id_bare_hex`, so the vector itself calls the
 *     result a derived identifier.
 *
 * Merging those two would sweep in most of the 38-kat suite, because §5 with an
 * empty exclusion set IS §4.1 and the kats pin §4.1 digests. That is a
 * definitional trap rather than a bug, and the split is how it is avoided.
 */
export type Section5Kind =
  /** The exclusion set removed a member the payload had: §5 doing what §4.1 does not. */
  | "removal_observable"
  /**
   * Removal was a no-op, but the vector NAMES the matched value a derived
   * identifier (`derived_id`, `correct_derived_id`, `correct_derived_id_bare_hex`).
   * Kats 20 and 21 are this: an empty exclusion set, and the vector still calls
   * the result a derived identifier, so it exercises §5's interface.
   */
  | "identifier_named_removal_noop"
  /**
   * Removal was a no-op and the value is pinned as a plain `digest`. These are
   * §4.1 vectors that happen to declare an empty exclusion set, and there are
   * twenty-eight of them. Counting them as §5 vectors would inflate the number
   * by conflating the two constructions, which on an empty exclusion set are
   * the same operation. They are found, classified and NOT counted.
   */
  | "not_section_5";

export interface Section5Hit {
  readonly file: string;
  readonly objectPath: string;
  readonly exclusionSet: string[];
  readonly exclusionSource: string;
  readonly identifier: string;
  /** Every place in the file that string appears, as JSON paths. */
  readonly pinnedAt: string[];
  readonly kind: Section5Kind;
}

const HEX64_ANY = /[0-9a-f]{64}/g;

/** Every object, and every 64-hex substring of every string, with paths. */
function scan(
  node: JsonValue,
  path: string,
  objs: { path: string; obj: { [k: string]: JsonValue } }[],
  hexes: Map<string, string[]>,
): void {
  if (Array.isArray(node)) {
    node.forEach((v, i) => scan(v, `${path}[${i}]`, objs, hexes));
    return;
  }
  if (typeof node === "string") {
    // Substring, not whole-string: a prefixed representation such as
    // "sha256:0c837d01…" carries the identifier and must be found.
    for (const m of node.matchAll(HEX64_ANY)) {
      const at = hexes.get(m[0]) ?? [];
      at.push(path);
      hexes.set(m[0], at);
    }
    return;
  }
  if (typeof node !== "object" || node === null) return;
  const o = node as { [k: string]: JsonValue };
  objs.push({ path, obj: o });
  for (const [k, v] of Object.entries(o)) scan(v, `${path}.${k}`, objs, hexes);
}

/** Every exclusion set declared anywhere in one file, with where it came from. */
function declaredExclusionSets(objs: { path: string; obj: { [k: string]: JsonValue } }[]): { set: string[]; source: string }[] {
  const out: { set: string[]; source: string }[] = [];
  const push = (set: string[], source: string): void => {
    if (!out.some((e) => JSON.stringify(e.set) === JSON.stringify(set) && e.source === source)) out.push({ set, source });
  };
  for (const { obj } of objs) {
    const e = obj["exclusion_set"];
    if (Array.isArray(e) && e.every((x) => typeof x === "string")) push(e as string[], "an exclusion_set array");
    for (const v of Object.values(obj)) {
      if (typeof v !== "string") continue;
      for (const m of v.matchAll(/exclusion set \{([^}]*)\}/g)) {
        push(m[1]!.split(",").map((x) => x.trim()).filter((x) => x.length > 0), "a prose digest_context sentence");
      }
    }
  }
  return out;
}

/**
 * Every §5 reproducer under `vectorsDir`, discovered rather than looked up.
 *
 * The single inference this makes is marked in every row that uses it: a file
 * declaring no exclusion set at all borrows the set another vector declares for
 * the artifact type it names. `profile-independence/fail/01` is the only file in
 * the corpus that needs it.
 */
export function discoverSection5(vectorsDir: string): Section5Hit[] {
  const files: string[] = [];
  const collect = (dir: string, prefix: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      if (e.isDirectory()) collect(join(dir, e.name), `${prefix}${e.name}/`);
      else if (e.name.endsWith(".json")) files.push(`${prefix}${e.name}`);
    }
  };
  collect(vectorsDir, "");

  const parsed: {
    file: string;
    objs: { path: string; obj: { [k: string]: JsonValue } }[];
    hexes: Map<string, string[]>;
    sets: { set: string[]; source: string }[];
  }[] = [];
  const byType = new Map<string, string[]>();

  for (const rel of files) {
    const text = readFileSync(join(vectorsDir, rel), "utf8");
    if (findDuplicateMemberName(text) !== null) continue;
    const objs: { path: string; obj: { [k: string]: JsonValue } }[] = [];
    const hexes = new Map<string, string[]>();
    scan(JSON.parse(text) as JsonValue, "$", objs, hexes);
    parsed.push({ file: rel, objs, hexes, sets: declaredExclusionSets(objs) });
    for (const { obj } of objs) {
      const name = obj["name"] ?? obj["payload_class"] ?? obj["type"];
      const set = obj["exclusion_set"];
      if (typeof name === "string" && Array.isArray(set) && set.every((x) => typeof x === "string") && !byType.has(name)) {
        byType.set(name, set as string[]);
      }
    }
  }

  const hits: Section5Hit[] = [];
  const seen = new Set<string>();
  for (const { file, objs, hexes, sets } of parsed) {
    const inScope = [...sets];
    if (inScope.length === 0) {
      // EVERY artifact type this file names, not the first one found. Taking
      // the first made `profile-independence/fail/01` borrow the set for
      // `decision-record` and never try the one for `authorization-doc`, which
      // is the type whose payload actually reproduces. One more instance of
      // stopping a search early and getting a smaller answer.
      for (const { obj } of objs) {
        for (const key of ["payload_class", "type", "name"]) {
          const t = obj[key];
          const borrowed = typeof t === "string" ? byType.get(t) : undefined;
          if (borrowed === undefined) continue;
          const source = `INFERRED ACROSS FILES: this file declares no exclusion set at all; borrowed from artifact type ${JSON.stringify(t)}`;
          if (!inScope.some((e) => e.source === source)) inScope.push({ set: borrowed, source });
        }
      }
    }
    for (const { path, obj } of objs) {
      for (const { set, source } of inScope) {
        const reduced: { [k: string]: JsonValue } = {};
        for (const [k, v] of Object.entries(obj)) if (!set.includes(k)) reduced[k] = v;
        if (Object.keys(reduced).length === 0) continue;
        const d = canonicalDigestJcs(reduced);
        if (!d.ok) continue;
        const at = hexes.get(d.value.hex);
        if (at === undefined) continue;
        // Removal is observable only when the exclusion set took something the
        // payload actually had. An empty set, or one naming absent members,
        // leaves §5 indistinguishable from §4.1 on this input.
        const removed = set.filter((k) => Object.prototype.hasOwnProperty.call(obj, k));
        const namedAnIdentifier = at.some((p) => /\.(derived_id|correct_derived_id|correct_derived_id_bare_hex)$/.test(p));
        const kind: Section5Kind =
          removed.length > 0
            ? "removal_observable"
            : namedAnIdentifier
              ? "identifier_named_removal_noop"
              : "not_section_5";
        const key = `${file}::${path}::${d.value.hex}::${kind}`;
        if (seen.has(key)) continue;
        seen.add(key);
        hits.push({
          file,
          objectPath: path,
          exclusionSet: set,
          exclusionSource: source,
          identifier: d.value.hex,
          pinnedAt: [...new Set(at)].sort(),
          kind,
        });
      }
    }
  }
  return hits;
}

/**
 * The files §5's construction is reproducible from, split by whether the
 * removal step does anything. `all` is the union and is the number the
 * delivered documents carry; the two parts are given because merging them
 * without saying so is what would make the number look larger than it is.
 */
export function section5Files(hits: Section5Hit[]): {
  removalObservable: string[];
  identifierNamedNoop: string[];
  notSection5: string[];
  all: string[];
} {
  const obs = new Set<string>();
  const named = new Set<string>();
  const not = new Set<string>();
  for (const h of hits) {
    if (h.kind === "removal_observable") obs.add(h.file);
    else if (h.kind === "identifier_named_removal_noop") named.add(h.file);
    else not.add(h.file);
  }
  // A file classified more than once keeps its strongest classification.
  for (const f of obs) {
    named.delete(f);
    not.delete(f);
  }
  for (const f of named) not.delete(f);
  return {
    removalObservable: [...obs].sort(),
    identifierNamedNoop: [...named].sort(),
    notSection5: [...not].sort(),
    all: [...new Set([...obs, ...named])].sort(),
  };
}
