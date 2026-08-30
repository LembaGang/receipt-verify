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

import { admitAlgorithm, canonicalDigestJcs, hexIdentifierOctets, type JsonValue } from "./index.js";

/**
 * "N/A" is not a soft pass. It marks a vector this run did not evaluate at all,
 * and it is reported as its own count so it can never be read as agreement.
 */
export type Verdict = "AGREE" | "DISAGREE" | "N/A";

export interface Row {
  readonly set: "PRIMARY" | "OBSERVED" | "SUPPLEMENTARY";
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
export function runSubjectBindingDiff(vectorsDir: string): Row[] {
  const dir = join(vectorsDir, "subject-binding-diff");
  const files = readdirSync(dir).filter((f) => f.startsWith("diff-") && f.endsWith(".json")).sort();
  const rows: Row[] = [];

  for (const file of files) {
    const v = JSON.parse(readFileSync(join(dir, file), "utf8")) as DiffVector;
    const computed = canonicalDigestJcs(v.action);

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
    const v = JSON.parse(readFileSync(join(dir, file), "utf8")) as KatVector;

    // Two of the 38 (enumerated: all 38 read, 36 carry an `input` member and 2
    // do not) carry no canonicalization input at all. 20- and 21- pin an
    // identifier-grammar failure and carry `cited_artifact` plus
    // `typed_reference_with_wrong_representation` instead. There is nothing to
    // canonicalize, so they are marked N/A rather than run — an earlier version
    // of this harness read the absent `input` and reported our boundary
    // refusing `undefined`, which said nothing about either implementation.
    if (v.input === undefined) {
      rows.push({
        set: "OBSERVED",
        vector: `${v.id} (${file})`,
        check: "jcs-n pinned digest vs our jcs digest",
        expected: `MUST-FAIL: ${v.failure_reason ?? "unstated"}`,
        ours: "NOT RUN: vector carries no canonicalization input",
        verdict: "N/A",
      });
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
    const expected = v.must_fail === true ? `MUST-FAIL: ${v.failure_reason ?? "unstated"}` : (v.digest ?? "");
    const ours = computed.ok ? computed.value.hex : `REFUSED: ${computed.reason}`;
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
 * SUPPLEMENTARY — the two vectors the OBSERVED run marks N/A.
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
  // Counted in four disjoint buckets, never as one ratio. A single
  // "N of 38 agree" line would fold the N/A rows and the jcs-n MUST-FAIL rows
  // into the numerator and report an agreement this run did not establish.
  const na = observed.filter((r) => r.verdict === "N/A");
  const evaluated = observed.filter((r) => r.verdict !== "N/A");
  const mustFail = evaluated.filter((r) => r.expected.startsWith("MUST-FAIL:"));
  const pinned = evaluated.filter((r) => !r.expected.startsWith("MUST-FAIL:"));
  const same = pinned.filter((r) => r.verdict === "AGREE");
  console.log(
    `\n  ${observed.length} vectors = ${na.length} N/A (no canonicalization input)` +
      ` + ${mustFail.length} pinned MUST-FAIL under jcs-n` +
      ` + ${pinned.length} pinned with a digest.`,
  );
  console.log(
    `  Of the ${pinned.length} carrying a pinned digest, ${same.length} produce the same bytes under our jcs` +
      ` and ${pinned.length - same.length} do not.`,
  );
  console.log(
    `  Of the ${mustFail.length} pinned MUST-FAIL, our jcs produced a digest for` +
      ` ${mustFail.filter((r) => !r.ours.startsWith("REFUSED")).length}` +
      ` and refused ${mustFail.filter((r) => r.ours.startsWith("REFUSED")).length}.\n`,
  );

  const supplementary = runIdentifierGrammar(vectorsDir);
  console.log("SUPPLEMENTARY — §5.1 identifier grammar, on the two vectors OBSERVED marks N/A.");
  console.log(table(supplementary));
  const supplementaryBad = supplementary.filter((r) => r.verdict === "DISAGREE");
  console.log(`
  ${supplementary.length - supplementaryBad.length}/${supplementary.length} refused as the vector requires.
`);

  process.exit(primaryBad.length);
}

// Run only when invoked directly, so the exported functions stay importable.
if (process.argv[1] !== undefined && process.argv[1].endsWith("run-vectors.ts")) main();
