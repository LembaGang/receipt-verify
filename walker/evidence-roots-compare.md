# `evidence_root` — our roots against the rev 5 fixture roots

Step E5 of CC_HANDOFF_2026-09-07_evidence-root-independent_rev2.md.

Our roots were computed, written to `walker/evidence-roots-ours.json` and **committed as
`80ca6a6e7025e6784193e8749645afbc14916ce0`** before any `computed` member, either header prefix,
or the fixture README was opened. This file is what was written after they were opened.

- Ours: `walker/evidence-roots-ours.json`, from `tools/evidence-root.ts`, built from
  `docs/evidence-root-spec-extract.md` alone.
- Theirs: the `computed` members of `fixtures/evidence-pinning-fixtures-v2-rev5.json` at
  `agentoracle-receipt-spec` `ac33ad1`, sha256
  `5d499bd01f44bd6e0f12b3617c7f104a214555b57a6c80280f5ceb358409b587`.
- The generator and the cross-check were never opened.

## Result

**28 of 28 rows agree. Zero divergences.** Every concrete root the fixture set carries is
byte-identical to ours, and every MALFORMED vector halts in our implementation on the condition
the vector targets.

Both header prefixes match what we derived from the text without seeing them: `leaf_prefix`
`ao-evidence-leaf-v2` (our `LEAF_PREFIX`, from rev 4 l.101 and 15b) and `node_prefix`
`ao-evidence-node-v1` (our `NODE_PREFIX`, from base l.121 and rev 4 l.127).

Digests are truncated to 16 hex characters in the table for width; the full values are in the two
JSON files and were compared in full.

## The 28 rows

| id | designation | ours | theirs | agree/diverge/n-a |
|---|---|---|---|---|
| `evi-root-order-independent` | CANONICAL ORDER | 1 7f6addf189cd884e…<br>2 7f6addf189cd884e… | 1 7f6addf189cd884e…<br>2 7f6addf189cd884e… | **agree** |
| `evi-root-odd-promotion` | ODD NODE | d0cacaa281b5b0a4… | d0cacaa281b5b0a4… | **agree** |
| `evi-leaf-hex-not-raw` | LEAF PREIMAGE | hex 35bc8fb1c853c3de…<br>raw 154920df58490925… | hex 35bc8fb1c853c3de…<br>raw 154920df58490925… | **agree** |
| `evi-snippet-change-changes-root` | BINDING | 1 35bc8fb1c853c3de…<br>2 365973a6cd595778… | 1 35bc8fb1c853c3de…<br>2 365973a6cd595778… | **agree** |
| `evi-url-normalization-changes-root` | BINDING | 1 35bc8fb1c853c3de…<br>2 14adb6a20e3e205b… | 1 35bc8fb1c853c3de…<br>2 14adb6a20e3e205b… | **agree** |
| `evi-duplicate-url-distinct-digest` | CANONICAL ORDER | 1 b563b47601d6cd2b…<br>2 b563b47601d6cd2b… | 1 b563b47601d6cd2b…<br>2 b563b47601d6cd2b… | **agree** |
| `evi-leaf-binds-content-kind` | LEAF PREIMAGE | 1 35bc8fb1c853c3de…<br>2 7125a9d8aff13aca… | 1 35bc8fb1c853c3de…<br>2 7125a9d8aff13aca… | **agree** |
| `evi-leaf-binds-retrieved-at` | LEAF PREIMAGE | 1 35bc8fb1c853c3de…<br>2 5e085fc1bf9069bd… | 1 35bc8fb1c853c3de…<br>2 5e085fc1bf9069bd… | **agree** |
| `evi-order-tiebreak-content-kind` | CANONICAL ORDER | 1 2b778cd5517219e8…<br>2 2b778cd5517219e8… | 1 2b778cd5517219e8…<br>2 2b778cd5517219e8… | **agree** |
| `evi-order-tiebreak-retrieved-at` | CANONICAL ORDER | 1 ef067e8708b9b3fe…<br>2 ef067e8708b9b3fe… | 1 ef067e8708b9b3fe…<br>2 ef067e8708b9b3fe… | **agree** |
| `evi-set-retrieved-at-not-earliest-rejects` | MALFORMED | halt `set_retrieved_at_not_earliest` | no `computed`; expect *halt, malformed* | **agree** (same condition) |
| `evi-content-kind-absent-when-pinned-rejects` | MALFORMED | halt `content_kind_absent_when_pinned` | no `computed`; expect *halt, malformed; diagnostic names the missing member, not a root mismatch* | **agree** (same condition) |
| `evi-resource-sha256-with-full-resource-rejects` | MALFORMED | halt `resource_sha256_with_full_resource` | no `computed`; expect *halt, malformed* | **agree** (same condition) |
| `evi-empty-set-rejects` | MALFORMED | halt `empty_evidence_set` | no `computed`; expect *halt, malformed* | **agree** (same condition) |
| `evi-duplicate-bound-tuple-rejects` | MALFORMED | halt `duplicate_bound_tuple` | no `computed`; expect *halt, malformed* | **agree** (same condition) |
| `evi-unpinned-reason-outside-domain-rejects` | MALFORMED | halt `unpinned_reason_outside_domain` | no `computed`; expect *halt, malformed* | **agree** (same condition) |
| `evi-unpinned-without-reason-rejects` | MALFORMED | halt `unpinned_reason_absent` | no `computed`; expect *halt, malformed* | **agree** (same condition) |
| `evi-source-count-mismatch-rejects` | MALFORMED | halt `source_count_mismatch` | no `computed`; expect *halt, malformed* | **agree** (same condition) |
| `evi-count-inconsistency-rejects` | MALFORMED | halt `pinned_count_mismatch` | no `computed`; expect *halt, malformed* | **agree** (same condition) |
| `evi-root-with-zero-pinned-rejects` | MALFORMED | halt `root_present_with_zero_pinned` | no `computed`; expect *halt, malformed* | **agree** (same condition) |
| `evi-nonzero-pinned-null-root-rejects` | MALFORMED | halt `root_absent_with_pinned_items` | no `computed`; expect *halt, malformed* | **agree** (same condition) |
| `evi-root-mismatch-rejects` | MALFORMED | halt `root_mismatch` | no `computed`; expect *halt, malformed* | **agree** (same condition) |
| `evi-empty-root-null` | EMPTY | root —<br>`unknown`, not malformed | no `computed` | n-a (resolution) |
| `evi-absent-unknown` | ADDITIVE | `unknown`, not malformed | no `computed` | n-a (resolution) |
| `evi-partial-resolves-unknown` | COMPLETENESS | root 7f6addf189cd884e…<br>`unknown`, not malformed, no offline-recompute claim | no `computed` | n-a (resolution) |
| `evi-declared-partial-is-not-invalid` | COMPLETENESS | root 7f6addf189cd884e…<br>`unknown`, not malformed, no offline-recompute claim | no `computed` | n-a (resolution) |
| `evi-content-mismatch-unknown` | UNKNOWN | root 35bc8fb1c853c3de…<br>`unknown`, not malformed, `content_differs` | no `computed` | n-a (resolution) |
| `evi-content-not-held-unknown` | UNKNOWN | root 35bc8fb1c853c3de…<br>`unknown`, not malformed, `content_not_held` | no `computed` | n-a (resolution) |

## Root-count reconciliation

| | count |
|---|---|
| Root values in their `computed` members | 19 |
| ...of which flagged non-normative (`non_normative_raw_root`, `evi-leaf-hex-not-raw`) | 1 |
| **Normative roots their file carries** | **18** |
| Roots we emit on the same ten root-bearing vectors | 18 |
| Roots we emit incidentally on resolution vectors | 4 |
| **Total roots we emit** | **22** |

The 18 reconciles exactly with Joe's statement that the cross-check reports 18 root computations
and zero mismatches, and with the fixture README l.72-73, which says the same. Our extra four are
`evi-partial-resolves-unknown`, `evi-declared-partial-is-not-invalid`, `evi-content-mismatch-unknown`
and `evi-content-not-held-unknown`: their expectations are step resolutions, so his file carries no
`computed` member for them, but each input is a well-formed set with pinned entries and therefore
has a root, which our implementation computes as a by-product. This is a difference in what is
recorded, not a disagreement about any value.

## Vector-count reconciliation against the fixture README

Read only after the comparison above was complete, per the protocol. The README (l.53-59)
reconciles 28 as 13 retained from rev 2 + 8 added by rev 4 + 1 added by rev 5 + 6 root-bearing
relational vectors. We checked that decomposition against the 28 ids in the file: it is a clean
partition — 28 ids, each classified exactly once, none missing and none double-counted.
**No disagreement with the README's count.**

One apparent difference in slicing, which is not a disagreement: we count **ten** root-bearing
vectors and the README counts six. The README's six are the root-bearing vectors that predate rev
4; the other four (`evi-leaf-binds-content-kind`, `evi-leaf-binds-retrieved-at`,
`evi-order-tiebreak-content-kind`, `evi-order-tiebreak-retrieved-at`) also carry roots but are
counted inside the README's "8 added by rev 4". Six plus four is our ten, and both routes give 18
normative roots.

**A stale number in rev 4, which the README gets right.** Rev 4's vector changelog heads its
retained list "**Retained unchanged — nine vectors**" (rev4 l.402) and then lists eleven ids,
with two more named in the following paragraph as unchanged in expectation. Thirteen is the
correct number and the README uses it; rev 4's own heading is the stale one. Nothing downstream
depends on the heading, and the fixture set carries the right thirteen.

## What agreement here does and does not establish

It establishes that two implementations, one written from the specification text alone by a party
with no access to the generator or the cross-check, compute the same bytes over the same 28
inputs. Given Joe's framing, that is the second-implementation confirmation the section was
waiting on for these vectors.

It does not establish that the construction is correct, only that the text determines it strongly
enough that two readers landed on the same answer. It does not establish anything about inputs the
fixture set does not contain. And the inputs themselves came from Joe's file — what was
independent here is the reading, not the test data. Findings are in the report at
`C:\Users\User\cc-output\CC_REPORT_2026-09-07_evidence-root-independent.md`.
