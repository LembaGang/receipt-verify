# The three rev 7 counterfactual builds

Run 2026-09-17 in `C:\Users\User\receipt-verify` on `master` at `817ad61`, for
`CC_HANDOFF_2026-09-17_evidence-root-variant-runs.md`. Reproduces in the tree what the
Lead ran on a cloud copy on 11 September, so that rev 8 can cite an artifact instead of a
message.

## The question

Three rules in the evidence-pinning texts apply to *entries*. Nothing in any of the five
texts says, for these three, whether "entries" means every entry in `sources` or only the
pinned ones. `tools/evidence-root.ts` reads all three over `sources`. This directory holds
the three builds that read them over the pinned entries instead, and runs each against the
rev 7 fixture set.

## The three builds

Each file is `tools/evidence-root.ts` (sha256 `b129f97e…`) with **one** hunk changed, and
nothing else. The hunk is recorded beside it as a unified diff.

| build | file | the check | the change |
|---|---|---|---|
| **f24** | `evidence-root.f24-pinned-only.ts` | check 11, duplicate bound tuple (rev5 l.64-66, 24a) | l.431 iterates `pinnedEntries` instead of `sources` |
| **f32b** | `evidence-root.f32b-pinned-only.ts` | check 6a, `retrieved_at` canonical form (rev6 l.243-247, F32) | l.389 applies only when `e.pinned === true` |
| **f32a** | `evidence-root.f32a-pinned-only.ts` | check 6, set-level earliest `retrieved_at` (rev2 l.95-97, F12) | l.374-375 seed and iterate `pinnedEntries` instead of `sources` |

## The result: four digests, all equal

Inputs: `walker/evidence-inputs-rev7.json`, sha256 of the file `1303daf7…`, carrying
`source_sha256` `a8679bdf5acb56ed7cd614086c5ea44438bcd6735b356e88c5e40172e8c696f1`.
Every run reported 32 vectors and 32 of 32 relations holding.

| output | sha256 | against baseline |
|---|---|---|
| `walker/evidence-roots-ours-rev7.json` (baseline) | `d461aaf4d6e4964d4176a3f9f717d49b8faf506bb772df350f8229760e50e451` | — |
| `evidence-roots-f24-pinned-only.json` | `d461aaf4d6e4964d4176a3f9f717d49b8faf506bb772df350f8229760e50e451` | **equal** |
| `evidence-roots-f32b-pinned-only.json` | `d461aaf4d6e4964d4176a3f9f717d49b8faf506bb772df350f8229760e50e451` | **equal** |
| `evidence-roots-f32a-pinned-only.json` | `d461aaf4d6e4964d4176a3f9f717d49b8faf506bb772df350f8229760e50e451` | **equal** |

Compared with `cmp`, not only by digest. All three are byte-identical to the baseline
output, which is itself byte-identical to the file committed at `817ad61`.

### On the harness, and on `produced_by`

`evidence-roots-run-variant.ts` is `tools/evidence-roots-run-rev7.ts` with two hunks: the
implementation under test is named on the command line rather than imported statically, and
`OUT` comes from the command line. `produced_by` inside the output is deliberately left as
`tools/evidence-roots-run-rev7.ts` — it names the harness program, which is unchanged in
everything that touches a vector. Were it rewritten per run, the four files would differ in
that one string and the comparison would be about the harness rather than about the
implementation.

The control that makes the four-way equality mean something: the same runner, pointed at the
**unmodified** `tools/evidence-root.ts`, also produces `d461aaf4…`. The runner therefore
contributes no sameness of its own.

## The probes: each build is a different program

Four equal digests are only informative if the three builds are in fact different programs.
Each has one synthetic input under `probes/` that separates it from the baseline. None of
these shapes occurs anywhere in the rev 7 fixture set, which is why the set cannot see the
difference.

| probe | baseline | variant |
|---|---|---|
| `probe-f24-unpinned-duplicate` — two identical **unpinned** entries | **halt**, `duplicate_bound_tuple` | **pass** |
| `probe-f32b-unpinned-noncanonical-retrieved-at` — an **unpinned** entry with zero fractional-second digits | **halt**, `retrieved_at_not_canonical_form` | **pass** |
| `probe-f32a-set-retrieved-at-from-unpinned` — set-level `retrieved_at` equal to an **unpinned** entry's earlier value | **pass** | **halt**, `set_retrieved_at_not_first_in_canonical_order` |

3 of 3 hold. The f32a polarity is reversed from the other two: there it is the baseline that
accepts and the variant that halts.

`probes-run.ts` asserts three things per probe — the baseline's outcome, the variant's
outcome, and that the two **differ** — and exits non-zero if any fails. What turns it red: a
"variant" that is not actually different. Checked, not assumed: an unmodified copy of
`tools/evidence-root.ts` put in a variant's place produces
`FAIL … baseline halt / duplicate_bound_tuple, _control-identical.ts halt / duplicate_bound_tuple`
and exit 1. The control file is not kept here.

## Census of the rev 7 inputs

Recomputed from `walker/evidence-inputs-rev7.json` in this run, not copied:

**59 evidence entries across the 32 vectors — 51 pinned, 8 unpinned, and the 8 unpinned
entries fall in 8 distinct vectors.** No entry carries a `pinned` value other than `true` or
`false`.

Those 8 vectors are `evi-count-inconsistency-rejects`, `evi-declared-partial-is-not-invalid`,
`evi-empty-root-null`, `evi-partial-resolves-unknown`, `evi-root-with-zero-pinned-rejects`,
`evi-unpinned-members-absent-accepted`, `evi-unpinned-reason-outside-domain-rejects` and
`evi-unpinned-without-reason-rejects`. Not one of them puts an unpinned entry into a
duplicated bound tuple, a non-canonical `retrieved_at`, or the earliest position against a
declared set-level `retrieved_at` — the three shapes the probes above construct.

## Reproduce

From the repository root, with Node v24.13.0 and tsx v4.23.1:

```sh
# baseline — must print d461aaf4…
npx tsx tools/evidence-roots-run-rev7.ts

# the runner's own control — must also print d461aaf4…
npx tsx walker/variants-rev7/evidence-roots-run-variant.ts \
  tools/evidence-root.ts /tmp/control-baseline.json

# the three variants
npx tsx walker/variants-rev7/evidence-roots-run-variant.ts \
  walker/variants-rev7/evidence-root.f24-pinned-only.ts \
  walker/variants-rev7/evidence-roots-f24-pinned-only.json
npx tsx walker/variants-rev7/evidence-roots-run-variant.ts \
  walker/variants-rev7/evidence-root.f32b-pinned-only.ts \
  walker/variants-rev7/evidence-roots-f32b-pinned-only.json
npx tsx walker/variants-rev7/evidence-roots-run-variant.ts \
  walker/variants-rev7/evidence-root.f32a-pinned-only.ts \
  walker/variants-rev7/evidence-roots-f32a-pinned-only.json

# the probes — exits non-zero if any build fails to differ from the baseline
npx tsx walker/variants-rev7/probes-run.ts
```

## What this does not show

Stated so the artifact is not read for more than it carries.

- **It does not say which reading is correct.** Four equal digests say the rev 7 fixture set
  does not distinguish the readings. Which one the texts intend is a question for the texts,
  and is not settled here.
- **It does not cover the whole implementation.** Three checks were varied. The other
  eleven, the preimages, the canonical order and the root construction were not.
- **It does not generalise past this input file.** The equality is over the 32 rev 7 vectors
  at `source_sha256` `a8679bdf…`. A later fixture set that adds an unpinned entry in any of
  the three shapes would separate the builds — that is exactly what the probes are.
- **`test/upstream-coverage.test.ts` does not observe this directory.** It scans `fixtures/`
  and `refs/` and the corpora `walker/scopes.json` names; `walker/` is not among them and no
  row in `fixtures/upstreams.json` references a `walker/` path. The test is green, and its
  green says nothing about these files.
