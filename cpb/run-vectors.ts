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
  readonly set: "PRIMARY" | "OBSERVED" | "SUPPLEMENTARY" | "T3B-STRUCTURAL" | "T3B-DIGEST";
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

  process.exit(primaryBad.length + undetectedButRequired.length + (m1Collapsed ? 0 : 1));
}

// Run only when invoked directly, so the exported functions stay importable.
if (process.argv[1] !== undefined && process.argv[1].endsWith("run-vectors.ts")) main();
