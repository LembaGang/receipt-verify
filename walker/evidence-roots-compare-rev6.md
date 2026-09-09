# `evidence_root` rev 6 — our roots against Joe's, 29 vectors

Produced at step S4 of `CC_HANDOFF_2026-09-09_evidence-root-rev6.md`, **after** commit
`e9b98db` fixed our roots. Before that commit no `computed` member, no excluded header
value, and none of the three forbidden rev 6 files had been opened; the file-open log in
the report carries the order and the times.

Fixture: `fixtures/evidence-pinning-fixtures-v2-rev6.json` at
`agentoracle-receipt-spec` `7f0b0cd1a709aa9ba6a3419b14656340f6526f0c`, sha256
`81cfd1bbb6e1f1a55e5ad8eebfeb78addef7465c14f6bd9f4dde8de7a224d9d9`, 27812 bytes (hashed from the git blob;
`core.autocrlf=true` here makes every working-tree copy hash differently).

Ours: `walker/evidence-roots-ours-rev6.json`, committed in `e9b98db`.

## Result

**22 of 22 root values agree. 0 divergences.** 20 of the compared values are normative
and 2 are the file's own counter-constructions. All 29 relations the vectors name hold
under our implementation.

Both prefixes and the node-child encoding were derived from the text before the header was
read, and all three match:

| header member | theirs | ours, derived from the text |
|---|---|---|
| `leaf_prefix` | `ao-evidence-leaf-v2` | `ao-evidence-leaf-v2` |
| `node_prefix` | `ao-evidence-node-v1` | `ao-evidence-node-v1` |
| `node_child_encoding` | `raw-octets` | raw 32 octets |

## The vector that matters: `evi-node-raw-not-hex`

| | value |
|---|---|
| ours, raw-octet children | `7f6addf189cd884e3be1919e470daeba0628bd7f84afefe1492f3fdcd86e4960` |
| theirs, `normative_raw_children_root` | `7f6addf189cd884e3be1919e470daeba0628bd7f84afefe1492f3fdcd86e4960` |
| **agree** | **true** |
| ours, hex-children counter-construction | `bf2676fc6d5c0b2588d230ee8451f4c9855080376525c0e64c46bbf285a1c58a` |
| theirs, `non_normative_hex_children_root` | `bf2676fc6d5c0b2588d230ee8451f4c9855080376525c0e64c46bbf285a1c58a` |
| **agree** | **true** |

**What this agreement shows that 7 September's could not.** The 28 rev 5 vectors were
relational on every multi-leaf set: each asserted that two roots computed under the same
branch were equal or unequal, and every such assertion holds under raw children and under
hex children alike. Two implementations that had both chosen raw octets agreed, and the set
as run could not have told that apart from two implementations that had both chosen hex. This
vector has two pinned items, so exactly one interior node is formed, and it carries a
**concrete** root rather than a relation. An implementation encoding children as hex computes
`bf2676fc6d5c0b25…` here and fails on the value alone. So the agreement on this row is
evidence about the branch, where the 7 September agreement was evidence only about the
relations — and rev 6 l.101-104 now states the branch, so our raw-octet reading is compelled
by a sentence rather than shared by luck.

## Per vector

| # | id | designation | ours | vs theirs | relation |
|---|---|---|---|---|---|
| 1 | `evi-root-order-independent` | CANONICAL ORDER | root_1 `7f6addf189cd884e…` / `7f6addf189cd884e…` **=**<br>root_2 `7f6addf189cd884e…` / `7f6addf189cd884e…` **=** | **agree** | holds |
| 2 | `evi-root-odd-promotion` | ODD NODE | root `d0cacaa281b5b0a4…` / `d0cacaa281b5b0a4…` **=** | **agree** | holds |
| 3 | `evi-node-raw-not-hex` | NODE PREIMAGE | non_normative_hex_children_root `bf2676fc6d5c0b25…` / `bf2676fc6d5c0b25…` **=**<br>normative_raw_children_root `7f6addf189cd884e…` / `7f6addf189cd884e…` **=** | **agree** | holds |
| 4 | `evi-leaf-hex-not-raw` | LEAF PREIMAGE | non_normative_raw_root `154920df58490925…` / `154920df58490925…` **=**<br>normative_hex_root `35bc8fb1c853c3de…` / `35bc8fb1c853c3de…` **=** | **agree** | holds |
| 5 | `evi-snippet-change-changes-root` | BINDING | root_1 `35bc8fb1c853c3de…` / `35bc8fb1c853c3de…` **=**<br>root_2 `365973a6cd595778…` / `365973a6cd595778…` **=** | **agree** | holds |
| 6 | `evi-url-normalization-changes-root` | BINDING | root_1 `35bc8fb1c853c3de…` / `35bc8fb1c853c3de…` **=**<br>root_2 `14adb6a20e3e205b…` / `14adb6a20e3e205b…` **=** | **agree** | holds |
| 7 | `evi-duplicate-url-distinct-digest` | CANONICAL ORDER | root_1 `b563b47601d6cd2b…` / `b563b47601d6cd2b…` **=**<br>root_2 `b563b47601d6cd2b…` / `b563b47601d6cd2b…` **=** | **agree** | holds |
| 8 | `evi-leaf-binds-content-kind` | LEAF PREIMAGE | root_1 `35bc8fb1c853c3de…` / `35bc8fb1c853c3de…` **=**<br>root_2 `7125a9d8aff13aca…` / `7125a9d8aff13aca…` **=** | **agree** | holds |
| 9 | `evi-leaf-binds-retrieved-at` | LEAF PREIMAGE | root_1 `35bc8fb1c853c3de…` / `35bc8fb1c853c3de…` **=**<br>root_2 `5e085fc1bf9069bd…` / `5e085fc1bf9069bd…` **=** | **agree** | holds |
| 10 | `evi-order-tiebreak-content-kind` | CANONICAL ORDER | root_1 `2b778cd5517219e8…` / `2b778cd5517219e8…` **=**<br>root_2 `2b778cd5517219e8…` / `2b778cd5517219e8…` **=** | **agree** | holds |
| 11 | `evi-order-tiebreak-retrieved-at` | CANONICAL ORDER | root_1 `ef067e8708b9b3fe…` / `ef067e8708b9b3fe…` **=**<br>root_2 `ef067e8708b9b3fe…` / `ef067e8708b9b3fe…` **=** | **agree** | holds |
| 12 | `evi-set-retrieved-at-not-earliest-rejects` | MALFORMED | halt `set_retrieved_at_not_earliest` | n-a | holds |
| 13 | `evi-content-kind-absent-when-pinned-rejects` | MALFORMED | halt `content_kind_absent_when_pinned` | n-a | holds |
| 14 | `evi-resource-sha256-with-full-resource-rejects` | MALFORMED | halt `resource_sha256_with_full_resource` | n-a | holds |
| 15 | `evi-empty-set-rejects` | MALFORMED | halt `empty_evidence_set` | n-a | holds |
| 16 | `evi-duplicate-bound-tuple-rejects` | MALFORMED | halt `duplicate_bound_tuple` | n-a | holds |
| 17 | `evi-unpinned-reason-outside-domain-rejects` | MALFORMED | halt `unpinned_reason_outside_domain` | n-a | holds |
| 18 | `evi-unpinned-without-reason-rejects` | MALFORMED | halt `unpinned_reason_absent` | n-a | holds |
| 19 | `evi-source-count-mismatch-rejects` | MALFORMED | halt `source_count_mismatch` | n-a | holds |
| 20 | `evi-count-inconsistency-rejects` | MALFORMED | halt `pinned_count_mismatch` | n-a | holds |
| 21 | `evi-root-with-zero-pinned-rejects` | MALFORMED | halt `root_present_with_zero_pinned` | n-a | holds |
| 22 | `evi-nonzero-pinned-null-root-rejects` | MALFORMED | halt `root_absent_with_pinned_items` | n-a | holds |
| 23 | `evi-root-mismatch-rejects` | MALFORMED | halt `root_mismatch`<br>correct_root `35bc8fb1c853c3de…` / `35bc8fb1c853c3de…` **=** | **agree** | holds |
| 24 | `evi-empty-root-null` | EMPTY | `unknown` | n-a | holds |
| 25 | `evi-absent-unknown` | ADDITIVE | `unknown` | n-a | holds |
| 26 | `evi-partial-resolves-unknown` | COMPLETENESS | `unknown` | n-a | holds |
| 27 | `evi-declared-partial-is-not-invalid` | COMPLETENESS | `unknown` | n-a | holds |
| 28 | `evi-content-mismatch-unknown` | UNKNOWN | `unknown` | n-a | holds |
| 29 | `evi-content-not-held-unknown` | UNKNOWN | `unknown` | n-a | holds |

Root values are shown as `ours / theirs`, truncated to 16 hex characters; the full values are
in `walker/evidence-roots-ours-rev6.json` and in the fixture's `computed` members.

## Root-value reconciliation

| | count |
|---|---|
| Root strings their `computed` members carry | 22 |
| of which normative | 20 |
| of which their own counter-constructions | 2 |
| Values of ours compared against them | 22 |
| **Agreeing** | **22** |
| Diverging | 0 |
| Normative roots we emit in total | 24 |
| of which on the 12 root-bearing vectors | 20 |
| of which incidental on resolution vectors | 4 |
| Counter-constructions we emit | 4 |

Their 22 is our 20 normative on the root-bearing vectors plus the two counter-constructions
they also carry (the hex-children root and the leaf-level raw-digest root). This matches rev 6
l.331-333, which states the rev 6 cross-check covers "22 of 22 root values ... 20 under
raw-octet children, 1 under the hex-children counter-construction, 1 under the leaf-level
raw-digest counter-construction."

The six values we emit that their file does not record are four incidental roots on resolution
vectors (`evi-partial-resolves-unknown`, `evi-declared-partial-is-not-invalid`,
`evi-content-mismatch-unknown`, `evi-content-not-held-unknown` — each a well-formed pinned set,
so each has a root, but each vector's expectation is a resolution) and two counter-constructions
of our own on `evi-root-odd-promotion` (the duplicated tail base l.124-128 forbids and the
leftmost promotion rev 2 l.171-172 forbids). A difference in what is recorded, not in a value.

## Category accounting — not a partition

Rev 6 l.321-329 asks that any line about a rev 6 run state the overlap. Ours:

| group | count |
|---|---|
| root-bearing by designation (CANONICAL ORDER, ODD NODE, NODE PREIMAGE, LEAF PREIMAGE, BINDING) | 11 |
| MALFORMED | 12 |
| remaining (EMPTY, ADDITIVE, COMPLETENESS ×2, UNKNOWN ×2) | 6 |
| **union** | **29** |
| root-bearing counting the overlap | 12 |
| overlap (`evi-root-mismatch-rejects`, MALFORMED and root-bearing at once) | 1 |

So 12 + 12 + 6 − 1 = 29, or 11 + 12 + 6 = 29 by designation.

**Rev 6's own table at l.314-319 gives "Remaining 5" for rev 6 against 6 for rev 5, and that
is wrong.** No vector left that group: the same six sit in it under rev 5 and rev 6. What
changed is that the new vector joined the root-bearing group and
`evi-root-mismatch-rejects` joined it too while staying MALFORMED. Reducing "remaining" to 5
applies the overlap correction a second time, in the same paragraph that asks the next run not
to present the numbers as a partition. Reported as a fact; no root is affected.

## MALFORMED vectors — the rubric rev 6 sets

Rev 6 l.214-218 makes conformance the halt rather than the name: an implementation "MUST halt
and MAY name any one of the violated conditions". There is no value on their side for these
rows, so "agree" means we halt and the condition we name is one the input actually violates.

All twelve halt. Their diagnostics, in vector order:

- `evi-set-retrieved-at-not-earliest-rejects` → halt `set_retrieved_at_not_earliest`
- `evi-content-kind-absent-when-pinned-rejects` → halt `content_kind_absent_when_pinned`
- `evi-resource-sha256-with-full-resource-rejects` → halt `resource_sha256_with_full_resource`
- `evi-empty-set-rejects` → halt `empty_evidence_set`
- `evi-duplicate-bound-tuple-rejects` → halt `duplicate_bound_tuple`
- `evi-unpinned-reason-outside-domain-rejects` → halt `unpinned_reason_outside_domain`
- `evi-unpinned-without-reason-rejects` → halt `unpinned_reason_absent`
- `evi-source-count-mismatch-rejects` → halt `source_count_mismatch`
- `evi-count-inconsistency-rejects` → halt `pinned_count_mismatch`
- `evi-root-with-zero-pinned-rejects` → halt `root_present_with_zero_pinned`
- `evi-nonzero-pinned-null-root-rejects` → halt `root_absent_with_pinned_items`
- `evi-root-mismatch-rejects` → halt `root_mismatch`<br>correct_root `35bc8fb1c853c3de…` / `35bc8fb1c853c3de…` **=**

**Independently checked, because rev 6 asserts it and our validator cannot answer it.** Our
`validateEvidenceSet` returns on the first condition it meets, so it cannot say whether a vector
injects a second. The fifteen predicates were written out a second time over the same inputs
and every one evaluated: **every MALFORMED vector injects exactly one condition, and the
condition our diagnostic names is that one.** Rev 6 l.206-207's claim holds, and the
consequence is that l.214-218 is a rule the set does not exercise.

## Resolution vectors

| id | designation | expect | ours |
|---|---|---|---|
| `evi-empty-root-null` | EMPTY | evidence_root null; receipt well-formed | `unknown`, halt false, malformed false |
| `evi-absent-unknown` | ADDITIVE | unknown; MUST NOT halt | `unknown`, halt false, malformed false |
| `evi-partial-resolves-unknown` | COMPLETENESS | step resolves unknown; must_not: ["valid"] on the offline-recompute claim | `unknown`, halt false, malformed false |
| `evi-declared-partial-is-not-invalid` | COMPLETENESS | receipt core-valid; NOT malformed; MUST NOT halt | `unknown`, halt false, malformed false |
| `evi-content-mismatch-unknown` | UNKNOWN | unknown; MUST NOT halt; per-item reason content_differs (MUST per rev 5 Finding 17) | `unknown`, halt false, malformed false, reason `content_differs` |
| `evi-content-not-held-unknown` | UNKNOWN | unknown; per-item reason content_not_held (MUST per rev 5 Finding 17) | `unknown`, halt false, malformed false, reason `content_not_held` |

All six match. **None of them expects the affirmative resolution**, so the token rev 6 names at
l.171-174 — `resolved` — is emitted by our implementation on no vector in the set. Every one of
the 29 either halts or resolves `unknown`.

