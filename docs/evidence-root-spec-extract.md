# `evidence_root` — normative extract from the -02 evidence-pinning texts

Built for CC_HANDOFF_2026-09-07 rev 2, step E1. **This file is the only source for
`tools/evidence-root.ts`.** Every constant in the implementation cites a line here.

Sources, all at `TKCollective/agentoracle-receipt-spec` commit
`ac33ad1dd660ea8473123ab8a3371934255926e9`, digests verified from the git blobs at P1:

| Short name | File | sha256 | bytes |
|---|---|---|---|
| `base` | `drafts/evidence-pinning-02-review-draft.md` | `9832156998ceb35f…` | 14,469 |
| `rev2` | `drafts/evidence-pinning-02-amendments-rev2-2026-09-04.md` | `a957802a4ed4d5a4…` | 24,470 |
| `rev3` | `drafts/evidence-pinning-02-amendments-rev3-2026-09-04.md` | `d770436219038098…` | 9,313 |
| `rev4` | `drafts/evidence-pinning-02-amendments-rev4-2026-09-06.md` | `060fc52c067b5d7d…` | 28,914 |
| `rev5` | `drafts/evidence-pinning-02-amendments-rev5-2026-09-06.md` | `1f901fd7d56fcfe9…` | 14,631 |

Precedence, from the revisions' own headers: rev 4 replaces rev 3 (`rev4` l.5), which replaced
rev 2 (`rev4` l.7-8); rev 5 is a delta on rev 4 and "everything in rev 4 stands except where
this document says otherwise" (`rev5` l.7-8). Rev 2 and rev 3 therefore still govern every
sentence rev 4 and rev 5 do not touch. Where a later revision replaces an earlier sentence, the
entry below names the governing text and the sentence it displaced.

---

## 1. The leaf

**Governing:** `rev4` l.101-103 (Finding 15a), unchanged by rev 5 — `rev5` l.8-9 lists the
four-member preimage and the `ao-evidence-leaf-v2` prefix among what rev 5 leaves standing.

```
leaf = SHA-256( "ao-evidence-leaf-v2" || 0x00 || url || 0x00 || snippet_sha256
                || 0x00 || content_kind || 0x00 || retrieved_at )
```

- **Displaces** `base` l.113, the three-member preimage under `ao-evidence-leaf-v1`. The prefix
  moved because a widened preimage under the old label would leave "two incompatible
  constructions wearing one label" (`rev4` l.62-63, and l.120-126).
- The four members are "their UTF-8 bytes as carried in the entry" (`rev4` l.105-106).
- `snippet_sha256` enters as **64 lowercase hexadecimal characters encoded UTF-8, not the 32 raw
  bytes they represent** (`rev2` l.166-167, Finding 1). The carve-out is scoped by its own words
  to *the leaf preimage*.
- The `0x00` separator needs no length prefix because no bound member may contain that octet
  (`rev4` l.106-109).

**`content_kind` domain:** `snippet`, `excerpt`, `full_resource` (`rev2` l.152).

## 2. The interior node

**Governing:** `base` l.121, untouched by every later revision. `rev4` l.127 states
"`ao-evidence-node-v1` is **unchanged** — the interior-node construction is untouched."

```
node = SHA-256( "ao-evidence-node-v1" || 0x00 || left || 0x00 || right )
```

**Ambiguity, resolved here and carried to E6.** No sentence in any of the five texts says
whether `left` and `right` enter as the 32 raw digest octets or as 64 lowercase hex characters.
We take **raw octets**, on two grounds from the text:

1. `base` l.113 and l.121 define `leaf` and `node` as `SHA-256(...)` — the function's output. A
   digest's value is its octets, and nothing in the corpus converts it.
2. The only hex carve-out in the corpus is `rev2` l.166-167, explicitly scoped "**In the leaf
   preimage**", and applied to a member that is *carried in the receipt as a hex string*. `left`
   and `right` are computed values, never carried, so the carve-out does not reach them. Rev 2
   thought the point worth stating for the carried member and did not state it for the node.

A reader taking the other branch computes different concrete roots and **identical relations**,
because every relational expectation is invariant under the node encoding. This is the one place
in the construction where two careful readers of these five files produce different bytes.

## 3. Odd node

**Governing:** `base` l.124-128, plus `rev2` l.171-172 (Finding 2).

- "When a level has an odd number of entries the final entry is **promoted unchanged** to the
  next level. It MUST NOT be duplicated and paired with itself" (`base` l.124-126).
- "A promoted entry retains its **rightmost position** at the next level" (`rev2` l.171-172).

**Termination.** No sentence states it. Taken: a level holding exactly one value has reached the
root, and that value is `evidence_root`. This is forced by the construction — pairing consumes
two entries and promotion consumes one, so every level is strictly shorter than the last and one
value remains. It also settles the single-pinned-item case: the root is that item's leaf, with no
node hashing at all. Carried to E6 as unstated-but-forced.

## 4. Canonical order

**Governing:** `rev5` l.96-103 (Finding 24c). This **replaces** `rev4` l.141-148 (15c), which
had replaced `base` l.130-133.

Sort ascending by `url`; ties by `snippet_sha256`; ties by `content_kind`; ties by
`retrieved_at`. "All four comparisons are bytewise over the UTF-8 encoding of the member as
carried in the entry" (`rev5` l.98-99).

What rev 5 changed, and why it governs: rev 4's closing clause treated an equal-on-key pair as
harmless — "their order cannot affect the root" (`rev4` l.146-147). Rev 5 replaces that clause
with "**Two entries therefore compare equal on the key only if their leaves are identical, which
§4.1.1 forbids**" (`rev5` l.100-101). Rev 4's sentence was true about *order* and silent about
*multiplicity* (`rev5` l.49-51). Inside a well-formed set the order is total.

**Sort scope.** `base` l.107 — "a Merkle root over the pinned items only. Unpinned items
contribute nothing" — and `base` l.110, "For each pinned item". Unpinned entries are excluded
before sorting, not sorted and then skipped.

## 5. The empty case

**Governing:** `base` l.139-140, explicitly preserved by rev 4: "Base l.139-140 ... is
**unchanged** and continues to govern the legal zero-pinned case" (`rev4` l.284-285).

> When `pinned_count` is zero, `evidence_root` MUST be `null`. An implementation MUST NOT emit a
> root over an empty set.

Distinguish from the **empty set** prohibition below: zero *pinned* is legal, zero *sources* is
malformed. `rev4` Finding 20: "The prohibition is on an evidence set that names no sources, never
on one that pins none" (`rev4` l.281-282).

---

## 6. The malformations — step (a) and step (b)

Step (a) is `rev2` l.178-183, extended by `rev4` 18c and `rev5` 24d; step (b) is `rev2`
l.185-188. Both replace `base` l.148-157. Each is "a malformed receipt; gate decision = halt".

Our check order, and where the text fixes it. `rev4` Finding 18b (l.215-218) settles one by
argument: with `source_count: 0` the receipt "is malformed at that check before `fully_pinned` is
evaluated", and `rev4` Finding 20 (l.261-262) notes the earliest-`retrieved_at` rule is
*undefined* over an empty array. The empty-set check therefore precedes both. `rev4` 18c
(l.235-239) settles a second: the `content_kind` check sits in step (a) "so that the diagnostic
names the missing member rather than reporting a root mismatch", so it must precede step (b). The
remainder follow the sequence step (a) itself lists.

| # | Condition | Diagnostic we emit | Citation |
|---|---|---|---|
| 1 | `evidence_set` present with `source_count` 0 or empty `sources` | `empty_evidence_set` | `rev4` l.273-276 (F20) |
| 2 | `source_count` != `sources.length` | `source_count_mismatch` | `rev2` l.178-179; Finding 13 at l.102-105 |
| 3 | `pinned_count` != number of entries with `pinned: true` | `pinned_count_mismatch` | `rev2` l.179-180 |
| 4 | `pinned_count` > `source_count` | `pinned_count_exceeds_source_count` | `base` l.73 |
| 5 | `fully_pinned` != (`pinned_count` == `source_count` and `source_count` > 0) | `fully_pinned_inconsistent` | `rev2` l.180-181; `base` l.74; retained `rev4` l.220-222 |
| 6 | set-level `retrieved_at` != earliest per-item `retrieved_at` | `set_retrieved_at_not_earliest` | `rev2` l.95-97 (F12), checked at l.181-182 |
| 7 | entry with `pinned: false` and no `unpinned_reason` | `unpinned_reason_absent` | `rev3` l.75-76 |
| 8 | entry with `pinned: false` and a reason outside `{no_content_returned, provider_metadata_only}` | `unpinned_reason_outside_domain` | `rev3` l.68-76; domain narrowed from three values at `rev3` l.117 |
| 9 | entry with `pinned: true` and no `content_kind` from the enumeration | `content_kind_absent_when_pinned` | `rev4` l.232-233 (18c) |
| 10 | entry with `content_kind: full_resource` carrying `resource_sha256` | `resource_sha256_with_full_resource` | `rev4` l.249-254 (F19) |
| 11 | two entries identical across `url`, `snippet_sha256`, `content_kind`, `retrieved_at` | `duplicate_bound_tuple` | `rev5` l.64-66 (24a), checked at l.109-111 (24d) |
| 12 | `evidence_root` non-null while `pinned_count` is 0 | `root_present_with_zero_pinned` | `rev2` l.186-188 |
| 13 | `evidence_root` null while `pinned_count` > 0 | `root_absent_with_pinned_items` | `rev2` l.186-188 |
| 14 | `evidence_root` != recomputation per §4.1.2 | `root_mismatch` | `rev2` l.185-186 |

The `unpinned_reason` domain is **two** values. `rev2` l.119-121 listed three; rev 3 removed
`content_not_retained` (`rev3` l.61-76, and the diff row at l.117) because the retention branch
"placed a fact the issuer does not control beside a choice the issuer does" (`rev3` l.26-28).

**Not treated as a malformation:** `content_kind: null` on an unpinned entry. `rev4` Finding 21
(l.294-296) says the member is "**absent** on every unpinned item because unpinned items generate
no leaf", and no sentence anywhere states a consequence for an explicit `null`. We read `null` as
absent. Carried to E6.

---

## 7. The relational checks the vectors need

`rev4` l.349-352 ("Recomputed on materialization"): the rev 2 vector table carries **relational**
expectations only, and "a relational assertion is invariant under a change of preimage or
prefix". Two forms are needed and no more: two sets whose roots are **identical**, and two sets
whose roots **differ**.

## 8. Steps (c), (d), (e), (f) — resolutions, not roots

- **(c)** `fully_pinned: false` resolves this step `unknown`, and the receipt MUST NOT be
  presented as satisfying offline recomputation (`rev2` l.190-193).
- **(d)** the verifier holds candidate bytes and they differ: `unknown` for that item, MUST NOT
  halt; the report **MUST** carry a per-item reason distinguishing `content_not_held` from
  `content_differs` (`rev4` l.184-191, Finding 17, raising rev 2's SHOULD at l.196-198).
- **(e)** no `evidence_set`: resolves `unknown`, MUST NOT fail (`rev2` l.204-205).
- **(f)** a **declared** partial set is not invalid and the receipt is not malformed
  (`rev2` l.207-214).

## 9. What this extract deliberately does not implement

`snippet_sha256` is taken as carried. `rev4` Finding 16 (l.162-168) governs how an issuer
*computes* it — over the octets as received, with no transcoding — but a verifier recomputing a
root from a receipt never performs that step. Vector `evi-content-mismatch-unknown` supplies the
verifier's recomputed digest directly rather than any content bytes, which is consistent with
that reading.
