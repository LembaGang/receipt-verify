# `evidence_root` rev 7 — our roots and conditions against Joe's, 32 vectors

Produced at step S4 of `CC_HANDOFF_2026-09-10_rev7-and-repins.md`, **after** commit
`7841d30` fixed our roots at 2026-09-10T13:03:08Z. Before that commit no `computed`
member, no excluded header value, and none of the three forbidden rev 7 files had been
opened; the first read of any computed member was 13:03:19Z, eleven seconds after the
commit, and the file-open log in the report carries the order and the times.

Fixture: `fixtures/evidence-pinning-fixtures-v2-rev7.json` at
`agentoracle-receipt-spec` `3d0ec0e82229c1336340f0323d54904e5baf38b2`, sha256
`a8679bdf5acb56ed7cd614086c5ea44438bcd6735b356e88c5e40172e8c696f1`, 31,339 bytes (hashed
from the git blob; `core.autocrlf=true` here makes every working-tree copy hash
differently).

Ours: `walker/evidence-roots-ours-rev7.json`, sha256
`d461aaf4d6e4964d4176a3f9f717d49b8faf506bb772df350f8229760e50e451`, committed in
`7841d30`. Extract: `walker/evidence-inputs-rev7.json`, sha256
`1303daf766cd02d12093d4386177a931e9acb40c5b5b2495a42b99b03248f8af`.

## Result

**23 of 23 root values agree. 13 of 13 conditions agree. 32 of 32 relations hold. 0
divergences.** 21 of the compared root values are normative and 2 are the file's own
counter-constructions. Every vector is present on both sides; none is only theirs and none
is only ours.

**The comparison was controlled before it was believed.** Perturbing one byte of our
`evi-node-child-encoding` root and one of our reported conditions makes the comparison
report exactly those two divergences and nothing else. A comparison that could not have
gone red would have established nothing; the control is in the report.

Both prefixes were derived from the text before the header was read, and both match:

| header member | theirs | ours, derived from the text |
|---|---|---|
| `leaf_prefix` | `ao-evidence-leaf-v2` | `ao-evidence-leaf-v2` |
| `node_prefix` | `ao-evidence-node-v1` | `ao-evidence-node-v1` |

Rev 7 Finding 34 removed the resolutions from `header.node_child_encoding` and
`header.leaf_member_encoding`; both now cite their governing finding instead of restating
it, so there is no longer a header value to compare an encoding against. The comparison
that replaces it is the vector pair below.

## What rev 7 lets this run check that rev 6 could not: the conditions

Under rev 6 a `MALFORMED` row held when we halted at all — rev 6 l.214-218 made
"conformance determined by the halt, not by which condition is named". Rev 7 l.106-109
replaces that: the condition we report must **equal** the vector's. All thirteen agree.

| vector | vector's `condition` | ours | our free-named `diagnostic` |
|---|---|---|---|
| `evi-set-retrieved-at-not-earliest-rejects` | `set_retrieved_at_not_first_in_canonical_order` | same | `set_retrieved_at_not_earliest` |
| `evi-content-kind-absent-when-pinned-rejects` | `content_kind_absent_when_pinned` | same | `content_kind_absent_when_pinned` |
| `evi-resource-sha256-with-full-resource-rejects` | `snippet_digest_present_for_full_resource` | same | `resource_sha256_with_full_resource` |
| `evi-empty-set-rejects` | `pinned_set_empty` | same | `empty_evidence_set` |
| `evi-duplicate-bound-tuple-rejects` | `duplicate_bound_tuple` | same | `duplicate_bound_tuple` |
| `evi-unpinned-reason-outside-domain-rejects` | `unpinned_reason_outside_domain` | same | `unpinned_reason_outside_domain` |
| `evi-unpinned-without-reason-rejects` | `unpinned_without_reason` | same | `unpinned_reason_absent` |
| `evi-source-count-mismatch-rejects` | `source_count_disagrees_with_sources` | same | `source_count_mismatch` |
| `evi-count-inconsistency-rejects` | `pinned_count_disagrees_with_pinned_entries` | same | `pinned_count_mismatch` |
| `evi-root-with-zero-pinned-rejects` | `root_present_with_zero_pinned` | same | `root_present_with_zero_pinned` |
| `evi-nonzero-pinned-null-root-rejects` | `root_null_with_pinned_entries` | same | `root_absent_with_pinned_items` |
| `evi-root-mismatch-rejects` | `root_not_recomputable_from_sources` | same | `root_mismatch` |
| `evi-retrieved-at-noncanonical-rejects` | `retrieved_at_not_canonical_form` | same | `retrieved_at_not_canonical` |

**Nine of the thirteen diagnostics differ in spelling from the condition.** That is the
measurement: our halts were named independently of Joe's, the conditions are his, and the
map between them (`CONDITION_FOR_DIAGNOSTIC` in `tools/evidence-root.ts`) was written from
rev 7 l.115-127 before any of his computed values were read. Agreement here is agreement
that each input injects the condition he says it injects, evaluated by fifteen predicates
that were written against the specification text and not against his labels.

**What it is not.** The thirteen identifiers are printed in the amendments text, which the
airlock permits at any time and which our implementation is written from. Our conditions
therefore agree with his because both come from the same sentences — that is the method
working, not an independent corroboration of the identifiers. What the check does establish
is the pairing: that the input he built for `pinned_set_empty` is refused by our
empty-set predicate and not by some other one. Before rev 7 nothing in the set could tell
those apart.

## The two renamed vectors

Rev 7 Finding 34 renamed `evi-node-raw-not-hex` to `evi-node-child-encoding` and
`evi-leaf-hex-not-raw` to `evi-leaf-member-encoding`, and renamed both `computed` key pairs
to `normative_root` / `counter_construction_root`.

### `evi-node-child-encoding`

| | value |
|---|---|
| ours, from `computeRoot` | `7f6addf189cd884e3be1919e470daeba0628bd7f84afefe1492f3fdcd86e4960` |
| theirs, `normative_root` | `7f6addf189cd884e3be1919e470daeba0628bd7f84afefe1492f3fdcd86e4960` |
| **agree** | **true** |
| ours, counter-construction (hex children) | `bf2676fc6d5c0b2588d230ee8451f4c9855080376525c0e64c46bbf285a1c58a` |
| theirs, `counter_construction_root` | `bf2676fc6d5c0b2588d230ee8451f4c9855080376525c0e64c46bbf285a1c58a` |
| **agree** | **true** |

The counter-construction agreeing is the stronger of the two rows: we assembled the
hex-children form ourselves, from our own reading of what the rejected branch would be, and
it reproduces his to the byte. The vector no longer says which of the two is normative, so
the pairing had to come from the specification on both sides.

### `evi-leaf-member-encoding`

| | value |
|---|---|
| ours | `35bc8fb1c853c3de6fa2a4fcacaa7223202fafa7bb5411595f167f21834160c3` |
| theirs, `normative_root` | `35bc8fb1c853c3de6fa2a4fcacaa7223202fafa7bb5411595f167f21834160c3` |
| **agree** | **true** |
| ours, counter-construction (32 raw bytes) | `154920df5849092538d5911db5b3cd8417c291c762fc65d81b8695833953b992` |
| theirs, `counter_construction_root` | `154920df5849092538d5911db5b3cd8417c291c762fc65d81b8695833953b992` |
| **agree** | **true** |

The resolution runs the opposite way from the node vector — hex characters at the leaf, raw
octets at the node — and both agree, which is the pair rev 7 l.160-162 says the old naming
made trivially guessable and the new naming does not.

**Neither row is independent corroboration of its branch, and rev 7 says so.** Rev 7
l.190-196: the rename "does not retroactively restore the airlock for the runs already
completed. Michael saw the identifier at extraction on the rev 6 run and recorded it ...
**The Finding 27 branch is therefore not available for independent corroboration by either
of them.**" This side read `evi-node-raw-not-hex` on 9 September. The agreement above is
between an implementation and a fixture whose answer that implementation's author had
already seen. It is recorded, not counted.

## The three new vectors

| vector | what it exercises | our row | root |
|---|---|---|---|
| `evi-step-resolves-affirmatively` | rev 6 F29, the `resolved` token | resolves `resolved`, no halt, not malformed | agrees, `7f6addf1…` |
| `evi-unpinned-members-absent-accepted` | rev 6 F30, absent ≡ explicit `null` | accepted, no halt, not malformed | carries none, by rev7 l.229-233 |
| `evi-retrieved-at-noncanonical-rejects` | rev 6 F32b, canonical `retrieved_at` | halts, condition `retrieved_at_not_canonical_form` | none |

**These are the rows where this run says something the 9 September run could not.** All
three rules were implemented on 9 September from rev 6 sentences, and until rev 7 no vector
reached any of them: rev 6 stated three rules its own set could not check. Our
implementations of all three were fixed at `e2cd882` and `8ec4ffe`, before rev 7 existed,
and all three now meet a fixture row and hold.

`evi-step-resolves-affirmatively` is the sharpest of the three. Rev 6 Finding 29 forbids any
token but `resolved` and `unknown`; at `5ffb455` we emitted `recomputed`, changed it on
9 September from the sentence alone, and had nothing to check it against. This vector is the
check, and it is also root-bearing, so it contributes the 23rd root value.

`evi-unpinned-members-absent-accepted` carries an unpinned entry with `snippet_sha256` and
`content_kind` **omitted**, not `null`. Our `canonicalOrder` filters on `pinned === true`
before sorting and our step-(a) loop `continue`s past an unpinned entry after its
`unpinned_reason` checks, so absence is reached by the same path as `null`. Its incidental
root is recorded under `non_normative:` and excluded from the count, matching rev 7's own
reasoning at l.229-233 that asserting the equality would be an assertion about the
generator rather than about the specification.

## Accounting

| | rev 7 states (l.255-264) | ours |
|---|---|---|
| Total vectors | 32 | 32 |
| Root-bearing | 13 | 13 |
| Root values carried | 23 | 23 compared, 23 agree |
| `MALFORMED` | 13 | 13 |
| Remaining | 7 | 7 |
| Overlap | 1 (`evi-root-mismatch-rejects`) | 1 (same vector) |
| `13 + 13 + 7 − 1` | 32 | 32 |

Our own file additionally reports 25 normative roots — the 21 that sit on root-bearing
vectors plus 4 computed incidentally on resolution vectors, which his set does not carry —
and 5 counter-constructions, of which 2 are the ones he also carries. The reconciliation is
the same one rev 6 needed: he counts roots the set asserts something about, we compute a
root wherever one is defined.

## Every vector, every relation

All 32 relations hold. The per-vector rows, with our roots, halts, conditions and
resolutions, are in `walker/evidence-roots-ours-rev7.json`; the divergence list produced by
the comparison is empty and the control that makes that meaningful is in the report.
