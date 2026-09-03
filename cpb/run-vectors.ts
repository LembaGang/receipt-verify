// T3 harness — runs the authors' vectors through our implementation.
//
//   npx tsx cpb/run-vectors.ts <path-to-their-repo>/vectors
//
// Exit code is the number of DISAGREE rows, so 0 means every comparison agreed.
//
// TWO RESULT SETS, REPORTED SEPARATELY AND MEANING DIFFERENT THINGS. The Lead's
// ratification of 2026-08-30 fixed both the split and the labels:
//
//   PRIMARY  — vectors/subject-binding-diff/. The live registered `jcs`
//              construction. This is the result that speaks to the draft.
//   OBSERVED — vectors/jcs-n/kats/. Our `jcs` run against the historical suite
//              for the WITHDRAWN construction. It is NOT a conformance result
//              and claims nothing about applicability: it measures how much of
//              that suite is construction-independent, and nothing else.
//
// The 31 vectors under vectors/ that declare no top-level algorithm
// (cpb-check, typed-refs, registry, domain-transforms, multimodal,
// profile-independence) are out of scope: they exercise grammar, reference
// containers and registry lookup, none of which is §4.1, §5 or §7.1.
//
// This harness reads vector JSON only. No file under lib/ is opened, and the
// authors' own Python harness is not read or invoked.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import {
  admitAlgorithm,
  applyExclusionSet,
  canonicalDigestJcs,
  deriveIdentifier,
  findDuplicateMemberName,
  hexIdentifierOctets,
  verifyCarriedIdentifier,
  type JsonValue,
  type PayloadClass,
} from "./index.js";
import { MUTANTS, type DigestFn } from "./mutants.js";

/**
 * "N/A" is not a soft pass. It marks a vector this run did not evaluate at all,
 * and it is reported as its own count so it can never be read as agreement.
 */
export type Verdict = "AGREE" | "DISAGREE" | "N/A";

export interface Row {
  readonly set: "PRIMARY" | "OBSERVED" | "SUPPLEMENTARY" | "SECTION-5" | "T3B-STRUCTURAL" | "T3B-DIGEST";
  readonly vector: string;
  readonly check: string;
  readonly expected: string;
  readonly ours: string;
  readonly verdict: Verdict;
}

const hex = (b: Uint8Array): string => Buffer.from(b).toString("hex");
const utf8 = (b: Uint8Array): string => Buffer.from(b).toString("utf8");

const row = (
  set: Row["set"],
  vector: string,
  check: string,
  expected: string,
  ours: string,
): Row => ({ set, vector, check, expected, ours, verdict: expected === ours ? "AGREE" : "DISAGREE" });

/** A comparison whose passing condition is inequality, not equality. */
const rowDiffers = (
  set: Row["set"],
  vector: string,
  check: string,
  a: string,
  b: string,
): Row => ({
  set,
  vector,
  check,
  expected: "differs",
  ours: a === b ? "identical" : "differs",
  verdict: a === b ? "DISAGREE" : "AGREE",
});

interface DiffVector {
  id: string;
  jcs_n_must_fail?: boolean;
  action: JsonValue;
  jcs: { pre_image: string; pre_image_bytes_hex: string; digest: string };
  jcs_n: { digest?: string; must_fail?: boolean; failure_reason?: string };
}

/**
 * PRIMARY — vectors/subject-binding-diff/.
 *
 * The `jcs` block of each vector is a plain §4.1 CANONICAL-DIGEST over the whole
 * `action` object: the vectors declare no exclusion set, so this exercises §4.1
 * directly and does not reach §5's removal step.
 */
export function runSubjectBindingDiff(vectorsDir: string, digest: DigestFn = canonicalDigestJcs): Row[] {
  const dir = join(vectorsDir, "subject-binding-diff");
  const files = readdirSync(dir).filter((f) => f.startsWith("diff-") && f.endsWith(".json")).sort();
  const rows: Row[] = [];

  for (const file of files) {
    const v = JSON.parse(readFileSync(join(dir, file), "utf8")) as DiffVector;
    const computed = digest(v.action);

    if (!computed.ok) {
      rows.push(row("PRIMARY", v.id, "jcs digest", v.jcs.digest, `REFUSED: ${computed.reason}`));
      continue;
    }

    rows.push(row("PRIMARY", v.id, "jcs pre_image", v.jcs.pre_image, utf8(computed.value.preImage)));
    rows.push(
      row("PRIMARY", v.id, "jcs pre_image_bytes_hex", v.jcs.pre_image_bytes_hex, hex(computed.value.preImage)),
    );
    rows.push(row("PRIMARY", v.id, "jcs digest", v.jcs.digest, computed.value.hex));

    if (v.jcs_n_must_fail === true) {
      // Direction B. The vector's must-fail side belongs to jcs-n, which this
      // implementation does not implement. What we can assert — and all we
      // claim — is that our admission never returns a verifiable result for the
      // withdrawn token, under either vintage branch of §4.2.
      const post = admitAlgorithm("jcs-n", { recordCommittedOn: "2026-08-19" });
      const pre = admitAlgorithm("jcs-n", { recordCommittedOn: "2026-08-17" });
      const unknown = admitAlgorithm("jcs-n");
      const dispositions = [post, pre, unknown]
        .map((r) => (r.ok ? "verified" : (r.disposition ?? "failed")))
        .join("/");
      rows.push(
        row(
          "PRIMARY",
          v.id,
          "jcs-n never verifiable (post/pre/unknown vintage)",
          "failed/unverified/unverified",
          dispositions,
        ),
      );
    } else {
      // Direction A. The divergence must be real, not asserted: our jcs digest
      // must differ from the vector's pinned jcs-n digest.
      rows.push(
        rowDiffers("PRIMARY", v.id, "our jcs digest vs pinned jcs_n digest", computed.value.hex, v.jcs_n.digest ?? ""),
      );
    }
  }
  return rows;
}

interface KatVector {
  id: string;
  input: JsonValue;
  exclusion_set?: string[];
  pre_image?: string;
  digest?: string;
  must_fail?: boolean;
  failure_reason?: string;
  /**
   * Four of the eleven MUST-FAIL vectors also pin the digest a CONFORMING
   * implementation produces for the same input. The 30 Aug run read them,
   * printed them and did not compare them, because the interface it read
   * vectors through did not declare this key. Declaring it is the whole fix:
   * kats 13, 27, 28 and 29 are the NFC boundary, the lowercase escape form, the
   * named short escape and the UTF-16 key-sort cases — RFC 8785 conformance
   * anchors, and the comparable base is 29 rather than 25 because of them.
   */
  jcs_n_correct_digest?: string;
  /**
   * kats 20 and 21. The 30 Aug run bucketed these as "no canonicalization
   * input" on the strength of a missing top-level `input` member. They carry an
   * input; it sits here, with an exclusion set, a declared representation and a
   * pinned identifier. The scope of that negative was the KEY NAME; the
   * conclusion drawn was about the FILE.
   */
  cited_artifact?: {
    payload?: JsonValue;
    registry_entry?: { exclusion_set?: string[]; representation?: string };
    correct_derived_id_bare_hex?: string;
  };
}

/**
 * OBSERVED — vectors/jcs-n/kats/, run under our `jcs`.
 *
 * NOT a conformance result. These vectors declare `"algorithm": "jcs-n"`, the
 * withdrawn construction, and this implementation does not implement it. The
 * only information here is the agreement count: how many of the historical
 * suite's inputs happen to produce the same bytes under `jcs` as they did under
 * `jcs-n`, which is a fact about the two constructions, not about our
 * conformance to anything.
 */
export function runJcsNKats(vectorsDir: string): Row[] {
  const dir = join(vectorsDir, "jcs-n", "kats");
  const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  const rows: Row[] = [];

  for (const file of files) {
    const text = readFileSync(join(dir, file), "utf8");
    const v = JSON.parse(text) as KatVector;

    // ---- the octet boundary, BEFORE any value from this vector is used ------
    //
    // CORRECTED 2026-09-03. kat-37 pins {"a": 1, "a": 2} and requires a
    // refusal. The 30 Aug run digested it and produced a value, because
    // JSON.parse had already discarded the first `a` before the digest was
    // reached, and because this implementation had concluded that -02 states no
    // duplicate-key rule. It does state one, by delegation: the jcs registry
    // entry's Reference is RFC 8785 Section 3, whose §3.1 excludes duplicate
    // property names from canonicalization, and RFC 7493 §2.3 says it again.
    //
    // The scan is over the vector file's raw text, which is the only layer at
    // which the duplicate is still observable, and the path it returns says
    // WHERE — a duplicate somewhere else in the file is not a duplicate in the
    // payload and must not be reported as one.
    const dup = findDuplicateMemberName(text);
    const dupInInput = dup !== null && (dup === "$.input" || dup.startsWith("$.input."));
    if (dupInInput) {
      const expected = v.must_fail === true ? `MUST-FAIL: ${v.failure_reason ?? "unstated"}` : (v.digest ?? "");
      const ours = `REFUSED: duplicate member name at ${dup} (RFC 8785 §3.1 via the jcs registry entry; RFC 7493 §2.3)`;
      rows.push({
        set: "OBSERVED",
        vector: `${v.id} (${file})`,
        check: "jcs-n pinned digest vs our jcs digest",
        expected,
        ours,
        // A MUST-FAIL vector is satisfied by a refusal. The comparison is
        // "did we refuse", not string equality, because the vector pins a
        // reason token and we name a rule.
        verdict: v.must_fail === true ? "AGREE" : "DISAGREE",
      });
      continue;
    }

    // ---- kats 20 and 21: the input inside cited_artifact -------------------
    if (v.input === undefined) {
      const cited = v.cited_artifact;
      const payload = cited?.payload;
      const pinnedId = cited?.correct_derived_id_bare_hex;
      if (payload === undefined || pinnedId === undefined) {
        rows.push({
          set: "OBSERVED",
          vector: `${v.id} (${file})`,
          check: "jcs-n pinned digest vs our jcs digest",
          expected: `MUST-FAIL: ${v.failure_reason ?? "unstated"}`,
          ours: "NOT RUN: no top-level `input` and no cited_artifact payload with a pinned identifier",
          verdict: "N/A",
        });
        continue;
      }
      const exclusions = cited?.registry_entry?.exclusion_set ?? [];
      let subject = payload;
      if (exclusions.length > 0 && typeof subject === "object" && subject !== null && !Array.isArray(subject)) {
        const reduced: { [k: string]: JsonValue } = {};
        for (const [k, val] of Object.entries(subject)) if (!exclusions.includes(k)) reduced[k] = val;
        subject = reduced;
      }
      const computed = canonicalDigestJcs(subject);
      rows.push(
        row(
          "OBSERVED",
          `${v.id} (${file})`,
          `derived identifier from cited_artifact.payload, exclusion set ${JSON.stringify(exclusions)}`,
          pinnedId,
          computed.ok ? computed.value.hex : `REFUSED: ${computed.reason}`,
        ),
      );
      continue;
    }

    // The exclusion set is applied by hand here rather than through
    // deriveIdentifier, because these vectors declare a withdrawn algorithm and
    // deriveIdentifier would correctly refuse them at admission. §4.1's
    // top-level-only rule is what is applied.
    let subject = v.input;
    const exclusions = v.exclusion_set ?? [];
    if (exclusions.length > 0 && typeof subject === "object" && subject !== null && !Array.isArray(subject)) {
      const reduced: { [k: string]: JsonValue } = {};
      for (const [k, val] of Object.entries(subject)) if (!exclusions.includes(k)) reduced[k] = val;
      subject = reduced;
    }

    const computed = canonicalDigestJcs(subject);
    const ours = computed.ok ? computed.value.hex : `REFUSED: ${computed.reason}`;

    // A MUST-FAIL vector that ALSO pins the digest a conforming implementation
    // produces is two facts, and the second one is comparable. Compare it.
    const conforming = v.jcs_n_correct_digest;
    if (v.must_fail === true && conforming !== undefined) {
      rows.push({
        set: "OBSERVED",
        vector: `${v.id} (${file})`,
        check: "jcs-n pinned digest vs our jcs digest",
        expected: conforming,
        ours,
        verdict: conforming === ours ? "AGREE" : "DISAGREE",
      });
      continue;
    }

    const expected = v.must_fail === true ? `MUST-FAIL: ${v.failure_reason ?? "unstated"}` : (v.digest ?? "");
    rows.push({
      set: "OBSERVED",
      vector: `${v.id} (${file})`,
      check: "jcs-n pinned digest vs our jcs digest",
      expected,
      ours,
      verdict: expected === ours ? "AGREE" : "DISAGREE",
    });
  }
  return rows;
}


/**
 * The four disjoint buckets the 38 kat rows fall into, as ONE definition.
 *
 * Exported and shared by the printed summary and the test that asserts it. When
 * these were two filters written separately, the test could go green while the
 * printed line said something else — and the printed line is what a reader
 * re-derives. The count that goes into a document has to come from the same
 * function the suite checks.
 *
 *   comparable    — rows making the "jcs-n pinned digest vs our jcs digest"
 *                   comparison against a pinned conforming digest. 29 of them:
 *                   the 25 with a top-level `digest`, plus kats 13, 27, 28 and
 *                   29, which are MUST-FAIL and ALSO pin `jcs_n_correct_digest`.
 *   refused       — refused at the octet boundary before any value was digested.
 *   reasonOnly    — MUST-FAIL pinning a failure reason and no conforming digest.
 *   citedArtifact — kats 20 and 21, whose input is inside `cited_artifact`.
 *                   Deliberately NOT in `comparable`: what reproduces for them
 *                   is a derived identifier, not the same comparison.
 */
export interface KatBuckets {
  readonly comparable: Row[];
  readonly refused: Row[];
  readonly reasonOnly: Row[];
  readonly citedArtifact: Row[];
  readonly notEvaluated: Row[];
  readonly agreeing: Row[];
}

export function bucketJcsNKats(rows: Row[]): KatBuckets {
  const notEvaluated = rows.filter((r) => r.verdict === "N/A");
  const refused = rows.filter((r) => r.ours.startsWith("REFUSED"));
  const citedArtifact = rows.filter((r) => r.check.startsWith("derived identifier from cited_artifact"));
  const reasonOnly = rows.filter(
    (r) => r.verdict !== "N/A" && !r.ours.startsWith("REFUSED") && r.expected.startsWith("MUST-FAIL:"),
  );
  const comparable = rows.filter(
    (r) =>
      r.verdict !== "N/A" &&
      !r.ours.startsWith("REFUSED") &&
      !r.expected.startsWith("MUST-FAIL:") &&
      r.check === "jcs-n pinned digest vs our jcs digest",
  );
  return {
    comparable,
    refused,
    reasonOnly,
    citedArtifact,
    notEvaluated,
    agreeing: comparable.filter((r) => r.verdict === "AGREE"),
  };
}

/**
 * SECTION-5 REPRODUCERS — every vector under `vectors/` from which §5's
 * construction can be recomputed, found by structure rather than by value.
 *
 * THE HISTORY OF THIS COUNT, because the method is the finding.
 *
 *   30 Aug: three. Only `jcs-n/derived-id/` was looked at.
 *   31 Aug: ten. Kats 20 and 21 plus five typed-refs files, found by looking
 *           for the identifier `0c837d01…` under the member names it was
 *           expected to carry.
 *   3 Sep, morning: twelve. Two more typed-refs files carry the same value
 *           under two further member names.
 *   3 Sep, ratification: fourteen. The identifier grep, run over the WHOLE
 *           vectors tree instead of one directory, adds two
 *           `profile-independence/` files.
 *   3 Sep, this pass: FIFTEEN, and the last one is invisible to that grep.
 *
 * Every one of those steps found what the previous step's search could not see,
 * and each search was scoped by an assumption: one directory, then one member
 * name, then one identifier value. So this function is written to depend on
 * none of the three. It walks every object in every vector, takes any 64-hex
 * member from the five identifier names the corpus actually uses, and tries the
 * exclusion sets declared anywhere in that file against every candidate payload
 * object — the payload's member name is discovered, not assumed, because
 * `jcs-n/derived-id/` calls it `full_payload` and `sd_encoded_payload`.
 *
 * What that costs: a 32-byte digest match is the only thing separating a real
 * hit from a coincidence, which is a bound worth stating rather than a proof.
 * What it buys: `typed-refs/fail/02` reproduces a DIFFERENT identifier
 * (`28211009…`), so no search keyed to `0c837d01…` could ever have found it.
 */
interface Section5Row {
  file: string;
  path: string;
  idMember: string;
  payloadMember: string;
  exclusionSet: string[];
  exclusionSource: string;
  pinned: string;
  ours: string;
}

const ID_MEMBERS = [
  "derived_id",
  "recomputed_digest",
  "correct_recomputed_digest",
  "correct_derived_id_bare_hex",
  "correct_derived_id",
] as const;

const HEX64_RE = /^[0-9a-f]{64}$/;

/** Every object in a JSON document, with its path. */
function everyObject(node: JsonValue, path: string, out: { path: string; obj: { [k: string]: JsonValue } }[]): void {
  if (Array.isArray(node)) {
    node.forEach((v, i) => everyObject(v, `${path}[${i}]`, out));
    return;
  }
  if (typeof node !== "object" || node === null) return;
  const o = node as { [k: string]: JsonValue };
  out.push({ path, obj: o });
  for (const [k, v] of Object.entries(o)) everyObject(v, `${path}.${k}`, out);
}

/** `exclusion set {doc_id}` inside a prose digest_context string. */
function exclusionFromProse(o: { [k: string]: JsonValue }): string[] | null {
  const ctx = o["digest_context"];
  if (typeof ctx !== "string") return null;
  const m = /exclusion set \{([^}]*)\}/.exec(ctx);
  if (m === null) return null;
  return m[1]!.split(",").map((x) => x.trim()).filter((x) => x.length > 0);
}

/**
 * Every exclusion set declared anywhere in one document, with where it came
 * from. Document-wide rather than ancestors-only: `typed-refs/fail/04` and
 * `fail/05` declare theirs in a DESCENDANT of the object carrying the
 * identifier, and an ancestors-only scope silently missed both.
 */
function exclusionSetsIn(objs: { path: string; obj: { [k: string]: JsonValue } }[]): { set: string[]; source: string }[] {
  const out: { set: string[]; source: string }[] = [];
  const push = (set: string[], source: string): void => {
    if (!out.some((e) => e.source === source && JSON.stringify(e.set) === JSON.stringify(set))) out.push({ set, source });
  };
  for (const { obj } of objs) {
    const own = obj["exclusion_set"];
    if (Array.isArray(own) && own.every((x) => typeof x === "string")) push(own as string[], "exclusion_set array");
    for (const key of ["registry_entry", "artifact_type_registry_entry"]) {
      const e = obj[key];
      if (e === null || typeof e !== "object" || Array.isArray(e)) continue;
      const entry = e as { [k: string]: JsonValue };
      const set = entry["exclusion_set"];
      if (Array.isArray(set) && set.every((x) => typeof x === "string")) push(set as string[], `exclusion_set array in ${key}`);
      const p = exclusionFromProse(entry);
      if (p !== null) push(p, `PROSE: the digest_context string in ${key}`);
    }
    const p = exclusionFromProse(obj);
    if (p !== null) push(p, "PROSE: a digest_context string");
  }
  return out;
}

/**
 * Every §5 reproducer under `vectorsDir`, walked from the vector JSON alone.
 *
 * `crossFileExclusions` is the one inference this function makes and it is
 * always marked in the row: `profile-independence/fail/01` declares no
 * exclusion set ANYWHERE in its own file, so the only way to recompute it is to
 * take the set that other vectors declare for the artifact type it names. That
 * is a judgment call, it is the sort of judgment call the Interests section
 * commits to marking, and a reader can discount the row on sight.
 */
export function runSection5Reproducers(vectorsDir: string): Row[] {
  const files: string[] = [];
  const collect = (dir: string, prefix: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      if (e.isDirectory()) collect(join(dir, e.name), `${prefix}${e.name}/`);
      else if (e.name.endsWith(".json")) files.push(`${prefix}${e.name}`);
    }
  };
  collect(vectorsDir, "");

  // Pass 1: what exclusion set does each named artifact type get, where a
  // vector says so? Used only for the marked cross-file inference below.
  const byType = new Map<string, { set: string[]; file: string }>();
  const parsed: { file: string; objs: { path: string; obj: { [k: string]: JsonValue } }[] }[] = [];
  for (const rel of files) {
    const text = readFileSync(join(vectorsDir, rel), "utf8");
    if (findDuplicateMemberName(text) !== null) continue;
    const objs: { path: string; obj: { [k: string]: JsonValue } }[] = [];
    everyObject(JSON.parse(text) as JsonValue, "$", objs);
    parsed.push({ file: rel, objs });
    for (const { obj } of objs) {
      const name = obj["name"] ?? obj["payload_class"] ?? obj["type"];
      const set = obj["exclusion_set"];
      if (typeof name === "string" && Array.isArray(set) && set.every((x) => typeof x === "string")) {
        if (!byType.has(name)) byType.set(name, { set: set as string[], file: rel });
      }
    }
  }

  const rows: Row[] = [];
  const seen = new Set<string>();
  for (const { file, objs } of parsed) {
    const declared = exclusionSetsIn(objs);
    for (const { path, obj } of objs) {
      for (const idMember of ID_MEMBERS) {
        const pinned = obj[idMember];
        if (typeof pinned !== "string" || !HEX64_RE.test(pinned)) continue;

        // Candidate payloads: every object member, and every object one level
        // inside those. The name is discovered rather than assumed.
        const cands: { name: string; value: { [k: string]: JsonValue } }[] = [];
        for (const [k, v] of Object.entries(obj)) {
          if (v === null || typeof v !== "object" || Array.isArray(v)) continue;
          cands.push({ name: k, value: v as { [k: string]: JsonValue } });
          for (const [k2, v2] of Object.entries(v as { [k: string]: JsonValue })) {
            if (v2 === null || typeof v2 !== "object" || Array.isArray(v2)) continue;
            cands.push({ name: `${k}.${k2}`, value: v2 as { [k: string]: JsonValue } });
          }
        }

        const sets = [...declared];
        if (sets.length === 0) {
          const typeName = obj["payload_class"] ?? obj["type"] ?? obj["name"];
          const hit = typeof typeName === "string" ? byType.get(typeName) : undefined;
          if (hit !== undefined) {
            sets.push({
              set: hit.set,
              source: `INFERRED ACROSS FILES: this file declares no exclusion set at all; taken from artifact type ${JSON.stringify(typeName)} as ${hit.file} declares it`,
            });
          }
        }

        let matched: Section5Row | null = null;
        for (const c of cands) {
          for (const e of sets) {
            const reduced: { [k: string]: JsonValue } = {};
            for (const [k, v] of Object.entries(c.value)) if (!e.set.includes(k)) reduced[k] = v;
            const d = canonicalDigestJcs(reduced);
            if (d.ok && d.value.hex === pinned) {
              matched = {
                file,
                path,
                idMember,
                payloadMember: c.name,
                exclusionSet: e.set,
                exclusionSource: e.source,
                pinned,
                ours: d.value.hex,
              };
              break;
            }
          }
          if (matched !== null) break;
        }
        if (matched === null) continue;
        // One row per (file, PATH, payload object) — a document that restates
        // the same identifier in a narrative block is not a second reproducer,
        // but two genuinely different payload objects in one file are two.
        // Keying without the path collapsed `typed-refs/fail/02`'s artifact_a
        // and artifact_b, which are two different payloads under two different
        // exclusion sets yielding one identifier: that collision IS the vector.
        const key = `${matched.file}::${matched.path}::${matched.payloadMember}::${matched.pinned}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push(
          row(
            "SECTION-5",
            `${matched.file} ${matched.path}`,
            `id member ${matched.idMember}, payload member ${matched.payloadMember}, exclusion ${JSON.stringify(matched.exclusionSet)} [${matched.exclusionSource}]`,
            matched.pinned,
            matched.ours,
          ),
        );
      }
    }
  }
  return rows;
}

/**
 * SUPPLEMENTARY — the two vectors the OBSERVED run marks N/A.
 *
 * 2026-09-02: the sentence below ("carry no canonicalization input") is the
 * claim withdrawn in the 2026-08-31 correction: kat-20 and kat-21 DO carry a
 * canonicalizable payload, at cited_artifact.payload, together with an
 * exclusion set, a declared representation and a pinned derived identifier,
 * and both reproduce under this construction. The runtime label at the
 * bottom of this file was corrected on 2026-08-31; this comment was not.
 * The paragraph below is left as written so the record shows what changed.
 *
 * kat-20 and kat-21 carry no canonicalization input because they are not
 * canonicalization cases: each pins an identifier STRING that must be rejected
 * on its grammar, which is §5.1's rule and one this implementation does have.
 * Both are MUST-FAIL, so the passing condition is that our decoder refuses.
 *
 * Reported outside both counts and claimed as nothing more than what it is:
 * these vectors declare the withdrawn algorithm, and §5.1's representation rule
 * is not the same rule as jcs-n's identifier grammar. This says only that our
 * §5.1 decoder refuses these two strings.
 */
export function runIdentifierGrammar(vectorsDir: string): Row[] {
  const dir = join(vectorsDir, "jcs-n", "kats");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort();
  const rows: Row[] = [];

  for (const file of files) {
    const v = JSON.parse(readFileSync(join(dir, file), "utf8")) as KatVector & {
      typed_reference_with_wrong_representation?: { digest?: string };
    };
    const carried = v.typed_reference_with_wrong_representation?.digest;
    if (carried === undefined) continue;

    const decoded = hexIdentifierOctets(carried);
    rows.push({
      set: "SUPPLEMENTARY",
      vector: `${v.id} (${file})`,
      check: `our §5.1 decoder on the pinned ${carried.length}-character identifier`,
      expected: `refused (${v.failure_reason ?? "unstated"})`,
      ours: decoded.ok ? "ACCEPTED" : `refused (${decoded.reason})`,
      verdict: decoded.ok ? "DISAGREE" : "AGREE",
    });
  }
  return rows;
}

export interface MutantResult {
  readonly id: string;
  readonly what: string;
  readonly mustBeDetected: boolean;
  readonly rowsRed: number;
  readonly rowsTotal: number;
  readonly detected: boolean;
  /** The digest subject-binding-diff-01 produces under this mutant. */
  readonly diff01Digest: string;
  /**
   * True when this mutant drives diff-01 onto the vector's OWN pinned jcs_n
   * digest — i.e. the mutant reproduces the withdrawn construction exactly,
   * measured against their bytes rather than against ours. Only M1 should.
   */
  readonly collapsedOntoPinnedJcsN: boolean;
}

/** The jcs_n digest the named vector pins, read from their file. */
function pinnedJcsNDigest(vectorsDir: string, file: string): string {
  const v = JSON.parse(
    readFileSync(join(vectorsDir, "subject-binding-diff", file), "utf8"),
  ) as DiffVector;
  return v.jcs_n.digest ?? "";
}

/**
 * Run the four PRIMARY vectors against every shipped mutant.
 *
 * This is the falsification, run on every invocation rather than asserted in a
 * comment. A mutant is "detected" when at least one comparison goes DISAGREE.
 */
export function runMutants(vectorsDir: string): MutantResult[] {
  const pinned = pinnedJcsNDigest(vectorsDir, "diff-01-null-member.json");
  return MUTANTS.map((m) => {
    const rows = runSubjectBindingDiff(vectorsDir, m.digest);
    const red = rows.filter((r) => r.verdict === "DISAGREE");
    const d01 = rows.find((r) => r.vector === "subject-binding-diff-01" && r.check === "jcs digest");
    return {
      id: m.id,
      what: m.what,
      mustBeDetected: m.mustBeDetected,
      rowsRed: red.length,
      rowsTotal: rows.length,
      detected: red.length > 0,
      diff01Digest: d01?.ours ?? "",
      collapsedOntoPinnedJcsN: d01?.ours === pinned && pinned !== "",
    };
  });
}

interface DerivedIdVector {
  id: string;
  payload_class: string;
  exclusion_set: string[];
  must_fail?: boolean;
  failure_reason?: string;
  full_payload?: { [k: string]: JsonValue };
  full_payload_with_carried_id?: { [k: string]: JsonValue };
  sd_encoded_payload?: { [k: string]: JsonValue };
  after_exclusion?: JsonValue;
  normalized?: JsonValue;
  pre_image?: string;
  pre_image_bytes_hex?: string;
  derived_id?: string;
  correct_derived_id?: string;
  carried_id?: string;
}

/**
 * Does any member anywhere in `v` hold JSON null, an empty array or an empty
 * object — the three shapes the withdrawn normalization pass removed?
 *
 * This decides, mechanically rather than by eye, whether a digest comparison
 * against a jcs-n-pinned value is readable at all. The 38-kat run measured that
 * the two constructions diverge on exactly these shapes and on nothing else, so
 * where none is present the pinned digest is comparable, and where one is
 * present it is not.
 */
export function carriesNormalizableMember(v: JsonValue): boolean {
  if (Array.isArray(v)) return v.some(carriesNormalizableMember);
  if (typeof v !== "object" || v === null) return false;
  for (const m of Object.values(v)) {
    if (m === null) return true;
    if (Array.isArray(m) && m.length === 0) return true;
    if (typeof m === "object" && m !== null && !Array.isArray(m) && Object.keys(m).length === 0) return true;
    if (carriesNormalizableMember(m)) return true;
  }
  return false;
}

/**
 * T3b — vectors/jcs-n/derived-id/, the only three vectors anywhere under
 * vectors/ at e0ad1c7 that exercise §5's construction.
 *
 * OBSERVED, exactly as the 38 kats are: these declare `"algorithm": "jcs-n"`,
 * the withdrawn construction. We run them under `jcs`, substituting the live
 * token in the payload class, and claim nothing about applicability beyond what
 * the 38 measured.
 *
 * Reported in two parts that are never blurred:
 *   T3B-STRUCTURAL — construction-independent behaviour. Removal by deletion,
 *     carried-identifier mismatch detection, the SD-encoded-form precondition.
 *     This is the only external check that exists for our §5 work.
 *   T3B-DIGEST — byte comparison, readable only where nothing survives
 *     exclusion that the withdrawn pass would have removed. Each row says which.
 */
export function runDerivedId(vectorsDir: string): Row[] {
  const dir = join(vectorsDir, "jcs-n", "derived-id");
  const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  const rows: Row[] = [];

  for (const file of files) {
    const v = JSON.parse(readFileSync(join(dir, file), "utf8")) as DerivedIdVector;
    const name = `${v.id} (${file})`;
    const sd = v.sd_encoded_payload !== undefined;

    const cls: PayloadClass = {
      name: v.payload_class,
      algorithm: "jcs", // substituted for the vector's withdrawn `jcs-n`
      exclusionSet: v.exclusion_set,
      representation: "hex",
      carriedIdentifierField: "record_id",
      ...(sd ? { selectiveDisclosure: true } : {}),
    };

    const subject = (v.sd_encoded_payload ?? v.full_payload) as JsonValue;

    // ---- STRUCTURAL 1: exclusion-set removal by deletion --------------------
    if (v.after_exclusion !== undefined) {
      const reduced = applyExclusionSet(cls, subject);
      rows.push(
        row(
          "T3B-STRUCTURAL",
          name,
          `exclusion of ${JSON.stringify(v.exclusion_set)} yields the vector's after_exclusion object`,
          JSON.stringify(v.after_exclusion),
          reduced.ok ? JSON.stringify(reduced.value) : `REFUSED: ${reduced.reason}`,
        ),
      );
    }

    // ---- STRUCTURAL 2: the SD-encoded-form precondition, both directions ----
    // A precondition that only ever refuses is not a control, it is a wall. So
    // the legitimate path is asserted alongside the refusal: declaring the form
    // must let the identifier through, and to the vector's own pinned value.
    if (sd) {
      const plaintextAttempt = deriveIdentifier(cls, subject, { payloadForm: "plaintext" });
      rows.push(
        row(
          "T3B-STRUCTURAL",
          name,
          "plaintext form refused when the class uses selective disclosure",
          "refused (sd_encoded_form_required)",
          plaintextAttempt.ok ? "ACCEPTED" : `refused (${plaintextAttempt.reason})`,
        ),
      );
      const sdAttempt = deriveIdentifier(cls, subject, { payloadForm: "sd-encoded" });
      rows.push(
        row(
          "T3B-STRUCTURAL",
          name,
          "declared SD-encoded form is accepted and yields the vector's derived_id",
          v.derived_id ?? "(none pinned)",
          sdAttempt.ok && sdAttempt.value.representation === "hex"
            ? sdAttempt.value.hex
            : sdAttempt.ok
              ? "(non-hex representation)"
              : `refused (${sdAttempt.reason})`,
        ),
      );
    }

    // ---- STRUCTURAL 3: the carried-identifier obligation --------------------
    if (v.must_fail === true && v.full_payload !== undefined) {
      const checked = verifyCarriedIdentifier(cls, v.full_payload);
      const ours = checked.ok ? "verified" : `${checked.reason} / ${checked.disposition ?? "failed"}`;
      rows.push(
        row(
          "T3B-STRUCTURAL",
          name,
          "carried identifier mismatch is detected and reported as a defect",
          "carried_identifier_mismatch / failed",
          ours,
        ),
      );
    } else if (v.full_payload_with_carried_id !== undefined) {
      const checked = verifyCarriedIdentifier(cls, v.full_payload_with_carried_id);
      rows.push(
        row(
          "T3B-STRUCTURAL",
          name,
          "sealed record with a matching carried identifier verifies",
          "verified",
          checked.ok ? checked.value.disposition : checked.reason,
        ),
      );
    }

    // ---- DIGEST -------------------------------------------------------------
    const reduced = applyExclusionSet(cls, subject);
    if (!reduced.ok) continue;
    const normalizable = carriesNormalizableMember(reduced.value);
    const computed = canonicalDigestJcs(reduced.value);
    if (!computed.ok) continue;

    const readable = normalizable
      ? "NOT READABLE: survives exclusion carrying a member the withdrawn pass removed"
      : "readable: nothing survives exclusion that the two constructions treat differently";

    const expectedId = v.derived_id ?? v.correct_derived_id;
    if (v.pre_image !== undefined) {
      rows.push(row("T3B-DIGEST", name, `pre_image [${readable}]`, v.pre_image, utf8(computed.value.preImage)));
    }
    if (v.pre_image_bytes_hex !== undefined) {
      rows.push(
        row(
          "T3B-DIGEST",
          name,
          `pre_image_bytes_hex [${readable}]`,
          v.pre_image_bytes_hex,
          hex(computed.value.preImage),
        ),
      );
    }
    if (expectedId !== undefined) {
      rows.push(row("T3B-DIGEST", name, `derived identifier [${readable}]`, expectedId, computed.value.hex));
    }
  }
  return rows;
}

function table(rows: Row[]): string {
  const head = ["vector", "check", "expected", "ours", "verdict"];
  const body = rows.map((r) => [r.vector, r.check, r.expected, r.ours, r.verdict]);
  const widths = head.map((h, i) => Math.max(h.length, ...body.map((b) => (b[i] ?? "").length)));
  const line = (cells: string[]): string =>
    cells.map((c, i) => c.padEnd(widths[i] ?? 0)).join("  ").trimEnd();
  return [line(head), line(widths.map((w) => "-".repeat(w))), ...body.map(line)].join("\n");
}

function main(): void {
  const vectorsDir = process.argv[2];
  if (vectorsDir === undefined) {
    console.error("usage: tsx cpb/run-vectors.ts <path-to-their-repo>/vectors");
    process.exit(2);
  }

  const primary = runSubjectBindingDiff(vectorsDir);
  const observed = runJcsNKats(vectorsDir);

  console.log("PRIMARY — vectors/subject-binding-diff/, the live registered jcs construction");
  console.log(table(primary));
  const primaryBad = primary.filter((r) => r.verdict === "DISAGREE");
  console.log(`\n  ${primary.length - primaryBad.length}/${primary.length} AGREE, ${primaryBad.length} DISAGREE\n`);

  console.log("OBSERVED — vectors/jcs-n/kats/ under our jcs. NOT a conformance result.");
  console.log(table(observed));
  // Counted in disjoint buckets, never as one ratio. A single "N of 38 agree"
  // line would fold the refusals and the reason-only rows into the numerator and
  // report an agreement this run did not establish. The buckets come from
  // bucketJcsNKats so the printed numbers and the suite's assertions cannot
  // drift apart.
  const b = bucketJcsNKats(observed);
  const { comparable, refused, reasonOnly, citedArtifact, notEvaluated: na } = b;
  const same = b.agreeing;
  console.log(
    `\n  ${observed.length} vectors = ${comparable.length} carrying a comparable pinned digest` +
      ` + ${refused.length} refused at the octet boundary before any value was digested` +
      ` + ${reasonOnly.length} pinning a failure reason and no conforming digest` +
      ` + ${citedArtifact.length} evaluated from cited_artifact.payload` +
      ` + ${na.length} not evaluated.`,
  );
  console.log(
    `  Of the ${comparable.length} comparable, ${same.length} produce the same bytes under our jcs` +
      ` and ${comparable.length - same.length} do not:  ${same.length} of ${comparable.length}.`,
  );
  for (const r of refused) console.log(`  refused: ${r.vector} - ${r.ours}`);
  for (const r of citedArtifact) {
    console.log(`  cited_artifact: ${r.vector} - ${r.verdict} (${r.ours})`);
  }
  console.log();

  const section5 = runSection5Reproducers(vectorsDir);
  const s5files = new Set(section5.map((r) => r.vector.split(" ")[0]));
  const s5ids = new Set(section5.map((r) => r.expected));
  console.log(
    `SECTION-5 REPRODUCERS - every vector under vectors/ from which section 5 recomputes, found by` +
      ` structure and not by value. ${s5files.size} files, ${section5.length} rows, ${s5ids.size} distinct identifiers.`,
  );
  console.log(table(section5));
  const typedBad = section5.filter((r) => r.verdict === "DISAGREE");
  console.log(`
  ${section5.length - typedBad.length}/${section5.length} AGREE
`);

  const supplementary = runIdentifierGrammar(vectorsDir);
  console.log("SUPPLEMENTARY - section 5.1 identifier grammar, on the two malformed identifier strings kats 20 and 21 pin.");
  console.log(table(supplementary));
  const supplementaryBad = supplementary.filter((r) => r.verdict === "DISAGREE");
  console.log(`
  ${supplementary.length - supplementaryBad.length}/${supplementary.length} refused as the vector requires.
`);

  const t3b = runDerivedId(vectorsDir);
  const structural = t3b.filter((r) => r.set === "T3B-STRUCTURAL");
  const digestRows = t3b.filter((r) => r.set === "T3B-DIGEST");
  console.log("T3B-STRUCTURAL — jcs-n/derived-id/, construction-independent behaviour. OBSERVED.");
  console.log(table(structural));
  console.log(`\n  ${structural.filter((r) => r.verdict === "AGREE").length}/${structural.length} AGREE\n`);
  console.log("T3B-DIGEST — jcs-n/derived-id/, byte comparison. OBSERVED, readable only where the row says so.");
  console.log(table(digestRows));
  console.log(`\n  ${digestRows.filter((r) => r.verdict === "AGREE").length}/${digestRows.length} AGREE\n`);

  console.log("MUTANTS — named wrong constructions, run against PRIMARY on every invocation.");
  const mutants = runMutants(vectorsDir);
  for (const m of mutants) {
    const status = m.detected
      ? `DETECTED  ${m.rowsRed}/${m.rowsTotal} rows red`
      : `NOT DETECTED by these four vectors`;
    console.log(`  ${m.id.padEnd(34)} ${status}${m.mustBeDetected ? "" : "   (expected: this set cannot see it)"}`);
  }
  const undetectedButRequired = mutants.filter((m) => m.mustBeDetected && !m.detected);
  const m1 = mutants.find((m) => m.id === "M1-collapse-to-jcs-n");
  const pinnedJcsN = pinnedJcsNDigest(vectorsDir, "diff-01-null-member.json");

  // Checked, not narrated: M1 must drive diff-01 onto the digest THEIR vector
  // pins for jcs_n. That is the construction collapse measured against their
  // bytes, and it is what makes M1 equivalent to editing the module by hand.
  const m1Collapsed = m1?.collapsedOntoPinnedJcsN === true;
  console.log(
    `
  M1 drives subject-binding-diff-01 to ${m1?.diff01Digest ?? "(not run)"}` +
      `
  their vector pins jcs_n as        ${pinnedJcsN}` +
      `
  collapse onto the withdrawn construction: ${m1Collapsed ? "CONFIRMED" : "NOT CONFIRMED"}`,
  );
  if (undetectedButRequired.length > 0) {
    console.log(`
  REQUIRED MUTANT NOT DETECTED: ${undetectedButRequired.map((m) => m.id).join(", ")}`);
  }
  console.log();

  process.exit(primaryBad.length + typedBad.length + undetectedButRequired.length + (m1Collapsed ? 0 : 1));
}

// Run only when invoked directly, so the exported functions stay importable.
if (process.argv[1] !== undefined && process.argv[1].endsWith("run-vectors.ts")) main();
