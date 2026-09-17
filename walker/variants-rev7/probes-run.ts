// Run each synthetic probe against the baseline implementation and against the
// one counterfactual build it targets, and record what each did.
//
// The probes exist because the three variant outputs in this directory are
// byte-identical to the baseline (d461aaf4…). Sameness on the fixture set is
// only informative if the builds are in fact different programs; a probe is the
// input that shows each one is. A variant that agreed with the baseline here as
// well would not be a counterfactual at all, and this runner exits non-zero in
// that case rather than reporting three quiet passes.
//
// Usage, from the repository root:
//   npx tsx walker/variants-rev7/probes-run.ts
//
// Writes walker/variants-rev7/probes/probe-results.json and prints the table
// that walker/variants-rev7/README.md quotes.

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import type { EvidenceSet, Resolution } from "../../tools/evidence-root.js";

type Impl = typeof import("../../tools/evidence-root.js");

const DIR = "walker/variants-rev7";
const PROBES = `${DIR}/probes`;
const OUT = `${PROBES}/probe-results.json`;
const BASELINE = "tools/evidence-root.ts";

interface Probe {
  id: string;
  targets: string;
  isolates: string;
  why: string;
  expect: { baseline: "halt" | "pass"; variant: "halt" | "pass" };
  expect_baseline_condition?: string;
  expect_variant_condition?: string;
  evidence_set: EvidenceSet;
}

const load = async (p: string): Promise<Impl> =>
  (await import(pathToFileURL(resolve(p)).href)) as Impl;

/** What a build did with one probe, reduced to the two things the probe asserts. */
const observe = (r: Resolution) => ({
  outcome: r.halt ? ("halt" as const) : ("pass" as const),
  condition: r.condition ?? null,
  diagnostic: r.diagnostic ?? null,
});

const baseline = await load(BASELINE);

const files = readdirSync(PROBES)
  .filter((f) => f.startsWith("probe-") && f.endsWith(".json") && f !== "probe-results.json")
  .sort();

const results = [];
let failures = 0;

for (const file of files) {
  const probe = JSON.parse(readFileSync(`${PROBES}/${file}`, "utf8")) as Probe;
  const variantPath = `${DIR}/${probe.targets}`;
  const variant = await load(variantPath);

  const b = observe(baseline.resolveEvidenceSet(probe.evidence_set));
  const v = observe(variant.resolveEvidenceSet(probe.evidence_set));

  // Three things must hold, and each can fail independently: the baseline does
  // what the probe says, the variant does what the probe says, and the two
  // disagree. The third is the point — it is what the fixture set cannot show.
  const baselineAsExpected =
    b.outcome === probe.expect.baseline &&
    (probe.expect_baseline_condition === undefined ||
      b.condition === probe.expect_baseline_condition);
  const variantAsExpected =
    v.outcome === probe.expect.variant &&
    (probe.expect_variant_condition === undefined ||
      v.condition === probe.expect_variant_condition);
  const buildsDisagree = b.outcome !== v.outcome;
  const holds = baselineAsExpected && variantAsExpected && buildsDisagree;
  if (!holds) failures += 1;

  results.push({
    id: probe.id,
    probe_input: `${PROBES}/${file}`,
    variant: probe.targets,
    isolates: probe.isolates,
    expect: probe.expect,
    baseline: b,
    variant_result: v,
    baseline_as_expected: baselineAsExpected,
    variant_as_expected: variantAsExpected,
    builds_disagree: buildsDisagree,
    holds,
  });

  const mark = holds ? "ok  " : "FAIL";
  console.log(
    `${mark} ${probe.id}\n` +
      `       baseline ${b.outcome}${b.condition ? ` / ${b.condition}` : ""}\n` +
      `       ${probe.targets} ${v.outcome}${v.condition ? ` / ${v.condition}` : ""}`,
  );
}

const out = {
  produced_by: "walker/variants-rev7/probes-run.ts",
  baseline_implementation: BASELINE,
  probe_count: results.length,
  probes_holding: results.filter((r) => r.holds).length,
  note:
    "Each probe asserts three things: the baseline's outcome, the variant's outcome, and that the two differ. " +
    "The third is what the rev 7 fixture set cannot show, since all three variants reproduce d461aaf4 on it.",
  probes: results,
};
writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
console.log(`\n${out.probes_holding} of ${out.probe_count} probes hold`);
console.log(`${OUT} written`);

// Fail closed: an unproven probe is not a passing run.
if (failures > 0) process.exit(1);
