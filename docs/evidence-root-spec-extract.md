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

---

# Rev 6 — the section added 2026-09-09 (CC_HANDOFF_2026-09-09, step S1)

Source: `drafts/evidence-pinning-02-amendments-rev6-2026-09-08.md`, sha256
`d62ded37dcf63f541e5b670b0cc0f7876e04a182064eb06a32af0037effaf026`, 21,968 bytes, at
`TKCollective/agentoracle-receipt-spec` commit
`7f0b0cd1a709aa9ba6a3419b14656340f6526f0c`. Digest re-derived from the git blob at that
commit, not from the checkout: this machine has `core.autocrlf=true` and every working-tree
copy hashes differently.

**Precedence.** Rev 6 l.5-7 replaces rev 5 by filename, digest and byte count, and
"**Everything in rev 5 stands except where this document says otherwise.**" Rev 6 l.8-12
lists what it explicitly leaves standing: rev 5's Findings 24-26 and its distinctness
prohibition, and rev 4's Findings 15-23, the four-member preimage, the
`ao-evidence-leaf-v2` prefix, the four-term sort key and Finding 20's empty-set
prohibition. Every section 1-9 above therefore continues to govern except where a rev 6
entry below displaces it.

Rev 6 carries **seven** normative amendment blocks and nothing else that binds an
implementation. They are at l.93, l.119, l.153, l.169, l.191, l.212 and l.240; the sweep
that establishes the count is a grep for an `Amend`/`Add` block head over the blob. Each is
taken in turn, with our status at commit `5ffb455` — the state in which
`tools/evidence-root.ts`, `test/evidence-root.test.ts` and the four other evidence-root files
were left on 7 September, all last written by `80ca6a6` and untouched since.

## R6-1. Finding 27 — the interior node's children are raw octets

**Amends base l.119-122.** Rev 6 l.101-104:

> In the interior node, `left` and `right` are the 32 raw octets of the child digests, not
> their hexadecimal form. This differs from the leaf preimage deliberately: a leaf's members
> are values carried in the receipt as strings and enter as their UTF-8 bytes, whereas a
> node's children are outputs of this function and enter as the octets the function produced.

**Status: already satisfied. This was our choice on 7 September and is now compelled by the
text.** Section 2 above records the choice and the two grounds we reasoned from; `nodeHash` in
`tools/evidence-root.ts` concatenates `Buffer.from(left)` and `Buffer.from(right)` with no
hex conversion. The reasoning rev 6 gives is the reasoning section 2 gives, in the same two
parts — that a digest's value is its octets, and that rev 2's hex carve-out is scoped to
members carried in the receipt as strings.

**How we know it is now compelled rather than shared.** Rev 5 and its four predecessors
contain no sentence on the encoding of `left` and `right` (section 2 above; the Lead's own
search of the five texts for `left`, `right`, `octet`, `raw bytes` and `concaten` returned
none). Rev 6 l.75-77 states the gap in the same terms — "**Nothing in any of the five texts
states the encoding of `left` and `right`** ... Both readings are defensible from the text as
it stands" — and l.101-104 closes it. A third implementer reading rev 6 cannot reach hex
without contradicting a sentence. That is the difference between rev 5 and rev 6, and it is
the whole point of this run.

## R6-2. Finding 27's second clause — the `0x00` argument scopes to leaf members

**Adds after the amended interior-node paragraph.** Rev 6 l.121-126:

> The `0x00` separators in the node preimage are retained for consistency with the leaf form.
> Unlike the leaf, they are not what makes this preimage unambiguous: both children are
> fixed-length 32-octet digests and their boundaries follow from position. A child digest may
> itself contain `0x00` octets, and this is harmless. The leaf preimage's
> no-embedded-`0x00` property, relied on at base l.106-109, is a property of leaf members and
> is not claimed for node children.

**Status: already satisfied, and non-behavioural.** The clause asserts a property of the
preimage and states why it holds; it does not ask an implementation to do anything. Our
`nodeHash` retains both `0x00` separators (from base l.121, which rev 6 does not change), and
places no constraint on the octets of a child digest — under raw children it cannot, since it
never inspects them. Section 1 above cites rev 4 l.106-109 for the leaf separator and had
already scoped that argument to bound members by quoting it in the leaf entry only.

The clause matters to this run for a different reason: it removes the one argument by which a
reader might have inferred hex children from rev 5. A reader who took the `0x00` delimiter to
require delimiter-free operands would have been pushed toward hex, since a raw digest may
contain `0x00`. Rev 6 blocks that inference explicitly.

## R6-3. Finding 28 — termination

**Adds after the odd-node paragraph.** Rev 6 l.155-157:

> **Termination.** When the pinned set contains exactly one item, `evidence_root` is that
> item's leaf. No interior node is formed. Applying the node function to a single leaf paired
> with itself is forbidden, for the same second-preimage reason the odd-node rule gives.

**Status: already satisfied; unstated-but-forced on 7 September, stated now.** Section 3 above
records termination as "not stated in any of the five texts and forced by the construction",
and `computeRoot` does not enter its `while (level.length > 1)` loop at all for a one-element
level, returning that leaf as the root with no node hashing. The self-pairing prohibition is
satisfied vacuously: nothing in `computeRoot` can pair a value with itself, because the
pairing loop consumes two distinct indices and the odd tail is pushed unchanged.

Rev 6 l.145-149 confirms our section 3 reading of the risk — that `node(leaf, leaf)` "also
satisfies every sentence in the section" of rev 5 — so this too moves from choice to
compulsion.

## R6-4. Finding 29 — the affirmative step-resolution token is `resolved`

**Amends §4.3.** Rev 6 l.171-174:

> A step resolves to exactly one of two values: `resolved`, when the step's evidence
> requirements are met, or `unknown`, under the conditions this section states. An
> implementation MUST emit one of these two tokens and MUST NOT emit any other value for a
> step's resolution.

**Status: NOT satisfied at `5ffb455`. Implemented in S2 from this sentence.** Our
`Resolution.resolution` member is typed `"unknown" | "recomputed"` (`tools/evidence-root.ts`
l.409) and its comment says in terms that `"recomputed"` is "our name for the affirmative
case, which the texts never name". Rev 6 now names it, and the second sentence is a
prohibition: `recomputed` is "any other value". We emit the token rev 6 forbids.

The fix is the token, not the condition. Rev 6 says `resolved` is emitted "when the step's
evidence requirements are met", which is the condition our code already computes — not
`fully_pinned` false (rev 2 l.190-193, step (c)) and no per-item reason outstanding (rev 4
l.184-191, step (d)). Only the string changes.

## R6-5. Finding 30 — `content_kind` on an unpinned entry

**Amends §4.1.1.** Rev 6 l.193-196:

> On an unpinned entry, `content_kind` MUST be absent or `null`; the two are equivalent and
> both mean no retrieved content is described. An implementation MUST NOT treat a `null`
> `content_kind` on an unpinned entry as a malformation. On a pinned entry, `content_kind`
> MUST be present and MUST be one of the defined values.

**Status: already satisfied in both limbs; the first limb was our choice and is now
compelled.**

- *Unpinned.* `validateEvidenceSet` branches on `e.pinned === false` and `continue`s after the
  two `unpinned_reason` checks, so the `content_kind` check at check 9 is never reached for an
  unpinned entry and a `null` cannot halt. Section 6 above records this as a reading we took
  and carried to E6 — "no sentence anywhere states a consequence for an explicit `null`. We
  read `null` as absent." Rev 6 l.187-189 quotes that reading back and adopts it.
- *Pinned.* Check 9 halts with `content_kind_absent_when_pinned` when the member is absent,
  `null`, or outside `CONTENT_KINDS`, which is exactly "MUST be present and MUST be one of the
  defined values".

**One scoping decision, made from the text and recorded.** The first limb reads "MUST be
absent or `null`", which on its face makes an unpinned entry carrying `content_kind:
"snippet"` a MUST violation. We do **not** add a halt for it, on rev 6's own l.249-250:
"**This is the only amendment in this revision that adds a rejection condition to input
validation**", said of Finding 32. Finding 30 therefore adds none, and the sentence's
operative clause is the prohibition on halting, not a new halt. Recorded as a place two
readers could still differ.

## R6-6. Finding 31 — diagnostic precedence under coexisting malformations

**Adds to §4.3.** Rev 6 l.214-218:

> When a receipt violates more than one condition of this section, an implementation MUST halt
> and MAY name any one of the violated conditions in its diagnostic, except where a precedence
> is stated explicitly (18b, 18c). Conformance is determined by the halt, not by which
> condition is named. A conformance vector that injects more than one condition MUST state
> which diagnostics are acceptable.

**Status: already satisfied; no code change.** `validateEvidenceSet` returns on the first
condition it meets, so it halts and names exactly one — which "MAY name any one" permits. The
two stated precedences are honoured and were honoured before rev 6 asked: section 6 above
records that the empty-set check precedes `fully_pinned` (rev 4 18b, l.215-218) and that the
`content_kind` check precedes step (b) (rev 4 18c, l.235-239), and the code's numbered order
implements both.

What this sentence changes is not our code but **the rubric for S4**: on a MALFORMED vector,
agreement now means we halt, and the diagnostic we name need only be one of the conditions the
input violates. It is the sentence that makes "agree" well-defined on the twelve MALFORMED
rows without a value on Joe's side to compare against.

## R6-7. Finding 32 — `retrieved_at` canonical form, and the bytewise correction

Two parts.

**(a) The wording correction.** Rev 6 l.240-241: replace rev 5's Finding 12 "earliest
`retrieved_at`" with "**first `retrieved_at` in the canonical bytewise order.**"

**Status: already satisfied; our reading is now the text's.** Check 6 in section 6 above
selects the minimum per-item `retrieved_at` under `compareUtf8`, which is bytewise over UTF-8,
and the code comment says why: "Compared as carried bytes: the members are RFC 3339 timestamps
and the texts define no parse." Rev 6 l.237-238 rules the same way — "**The bytewise rule
stands** — it is what makes the root computable without a date library — and Finding 12's
wording is corrected to match it." A reader who took "earliest" temporally would have needed a
date library and could have differed from us; rev 6 removes that reading.

**(b) The new rejection condition.** Rev 6 l.243-247, added to §4.1.1:

> `retrieved_at` MUST be an RFC 3339 timestamp in UTC with the `Z` designator and exactly
> three fractional-second digits. This canonical form is required because the sort at
> §4.1.2 is bytewise: two spellings of one instant would otherwise order differently and
> produce different roots for the same evidence. An implementation MUST reject a
> `retrieved_at` that is not in this form.

**Status: NOT satisfied at `5ffb455`. Implemented in S2 from this sentence.** No check in
`validateEvidenceSet` inspects the form of any `retrieved_at`; section 6's table has fourteen
conditions and none is about timestamp shape. Rev 6 l.249-250 calls this "the only amendment
in this revision that adds a rejection condition to input validation", so it is the one
sentence in rev 6 that adds a halt.

**Scope, decided from the sentence and recorded.** The amendment is directed at **§4.1.1**,
which base l.83-103 defines as the `sources` **entries** section. We therefore apply it to
every entry's `retrieved_at`, pinned and unpinned alike — the member is required on every
entry at base l.91, and §4.1.1 is not scoped to pinned entries. We do **not** apply it to the
**set-level** `retrieved_at`, which base l.71 defines in §4.1, a different section that rev 6
does not amend. Recorded as a gap rather than closed by us: the rule's own stated reason —
that two spellings of one instant sort differently — bears on the set-level member too,
because check 6 compares it bytewise against the entries, yet the sentence's placement does
not reach it. A non-canonical set-level `retrieved_at` therefore fails closed under our
implementation but by the wrong diagnostic (`set_retrieved_at_not_earliest`, not a form
rejection).

**Diagnostic and placement.** `retrieved_at_not_canonical`, evaluated at the top of the
per-entry loop, which leaves checks 1-6 in the argued order section 6 fixes and cannot perturb
any existing vector. Under R6-6 the placement is free in any case.

**The form, exactly.** "RFC 3339 timestamp in UTC with the `Z` designator and exactly three
fractional-second digits" is implemented as
`^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$`, with the date and time fields additionally
required to be in range (month 01-12, day 01-31, hour 00-23, minute and second 00-59, second
60 admitted for the leap second RFC 3339 permits). Uppercase `T` and `Z` are taken as written:
rev 6 names "the `Z` designator" specifically, and RFC 3339's lowercase variants would give
one instant two spellings, which is the defect the sentence exists to remove.

## R6-8. What rev 6 changes that is not an amendment

Rev 6 also carries three errata (l.259-292) and a vector changelog (l.296-335). None binds an
implementation. Two bear on the record and are checked in this run rather than taken:

- **E-3** moves `correct_root` out of `evi-root-mismatch-rejects`'s `input` and into
  `computed`, which closes the airlock disclosure the 7 September run made. Re-derived at P0
  from our own extract, not taken from the text: zero vectors carry `correct_root` under
  `input`, and twelve carry a `computed` member.
- The changelog at l.309-329 states that the rev 6 categories **overlap** — twelve
  root-bearing vectors and twelve MALFORMED, with `evi-root-mismatch-rejects` in both — so
  12 + 12 + 5 is not a partition of 29. The S4 accounting states the overlap.

## R6-9. Summary of status

| Rev 6 rule | Line | Our status at `5ffb455` | Was it a choice? |
|---|---|---|---|
| F27 node children = raw octets | l.101-104 | satisfied | **choice on 7 Sep, now compelled** |
| F27b `0x00` scopes to leaf members | l.121-126 | satisfied, non-behavioural | n/a — no behaviour |
| F28 termination, one-item root is the leaf | l.155-157 | satisfied | **forced but unstated, now stated** |
| F29 affirmative token is `resolved` | l.171-174 | **NOT satisfied** — we emit `recomputed` | implemented in S2 |
| F30 `content_kind` null == absent (unpinned) | l.193-196 | satisfied | **choice on 7 Sep, now compelled** |
| F30 `content_kind` required on pinned | l.193-196 | satisfied | already compelled by rev 4 18c |
| F31 halt is conformance; naming free | l.214-218 | satisfied, no code change | n/a |
| F32a "first in bytewise order" | l.240-241 | satisfied | **choice on 7 Sep, now compelled** |
| F32b `retrieved_at` canonical form MUST | l.243-247 | **NOT satisfied** | implemented in S2 |

---

# Rev 7 — the section added 2026-09-10 (CC_HANDOFF_2026-09-10, Part 1 step S1)

Source: `drafts/evidence-pinning-02-amendments-rev7-2026-09-09.md`, sha256
`6b13f6fc35d745c2642edcb52a2754f7cd43340ded3248b5d1ba70a431d6c037`, 17,732 bytes, at
`TKCollective/agentoracle-receipt-spec` commit
`3d0ec0e82229c1336340f0323d54904e5baf38b2` ("rev 7: name the condition a malformed vector
injects, and stop the set stating its own answers", committed 2026-09-09T21:36:35Z). Digest
re-derived from the git blob at that commit, not from the checkout: this machine has
`core.autocrlf=true` and every working-tree copy hashes differently. The rev 6 blob at this
commit is byte-identical to the one the 9 September run read (`d62ded37…`, 21,968 B,
re-derived here), so nothing under rev 6 moved.

**Precedence.** Rev 7 l.5-12 replaces rev 6 by filename, digest and byte count, and
"**Everything in rev 6 stands except where this document says otherwise.**" It then names
what it explicitly leaves standing: rev 6's Findings 27-32 in full, rev 5's Findings 24-26,
rev 4's Findings 15-23, the four-member preimage, the `ao-evidence-leaf-v2` prefix and the
four-term sort key. Sections 1-9 and R6-1 to R6-9 above therefore continue to govern except
where an R7 entry below displaces one.

**Rev 7 carries one normative amendment that binds an implementation, and four items that do
not.** The blocks are E-4 (l.46), Finding 33 (l.84), Finding 34 (l.144) and the three vector
additions 33a/33b/33c (l.206, l.218, l.235). Only Finding 33 changes what a conformant
implementation must emit. Our status below is against commit `8ec4ffe` — the state in which
`tools/evidence-root.ts` and `test/evidence-root.test.ts` were left by `e2cd882` on
9 September.

## R7-1. Finding 33 — the halt must name the condition it fired on

**Adds a required member to every `MALFORMED` vector, and a reporting obligation to every
implementation.** Rev 7 l.106-109:

> **Amendment — add a required `condition` member to every `MALFORMED` vector.** The value is
> a stable identifier naming the single condition the input injects. An implementation
> reports which condition it halted on; conformance requires the reported condition to equal
> the vector's `condition`, not merely that a halt occurred.

**Status: NOT satisfied at `8ec4ffe`. Implemented from this sentence.** At `8ec4ffe` our
halts carried `diagnostic`, a fifteen-value union of our own naming, and nothing that could
be compared for equality against a value on Joe's side. R6-6 above recorded exactly why that
was sufficient under rev 6 and is not under rev 7: rev 6 l.214-218 made "conformance
determined by the halt, not by which condition is named", so agreement on a `MALFORMED` row
meant only that we halted. Rev 7 l.92-96 states the consequence that closes — "Two
implementations can pass all twelve while rejecting each input on entirely different grounds,
and nothing in the set detects it."

**The reading, and why `condition` is a second member rather than a rename of `diagnostic`.**
Rev 7 l.136-137 preserves rev 6 Finding 31 "as written for diagnostic *naming*, which remains
free. What changes is that conformance now depends on the reported condition matching." Two
members, two rules: the diagnostic stays ours and stays free, and the condition is fixed by
rev 7's table. `Diagnostic` is therefore unchanged and `Condition` is new, with
`CONDITION_FOR_DIAGNOSTIC` the total, injective map between them, and one `fail()`
constructor through which all fifteen rejections now pass so that a future diagnostic cannot
ship without a condition.

**The thirteen identifiers are taken verbatim from rev 7 l.115-127.** Their mapping onto our
diagnostics is not one-for-one in spelling — four coincide, nine do not — and the difference
is recorded here because it is the whole content of the new check:

| rev 7 `condition` (l.115-127) | our `diagnostic` | spelling |
|---|---|---|
| `set_retrieved_at_not_first_in_canonical_order` | `set_retrieved_at_not_earliest` | differs |
| `content_kind_absent_when_pinned` | `content_kind_absent_when_pinned` | same |
| `snippet_digest_present_for_full_resource` | `resource_sha256_with_full_resource` | differs |
| `pinned_set_empty` | `empty_evidence_set` | differs |
| `duplicate_bound_tuple` | `duplicate_bound_tuple` | same |
| `unpinned_reason_outside_domain` | `unpinned_reason_outside_domain` | same |
| `unpinned_without_reason` | `unpinned_reason_absent` | differs |
| `source_count_disagrees_with_sources` | `source_count_mismatch` | differs |
| `pinned_count_disagrees_with_pinned_entries` | `pinned_count_mismatch` | differs |
| `root_present_with_zero_pinned` | `root_present_with_zero_pinned` | same |
| `root_null_with_pinned_entries` | `root_absent_with_pinned_items` | differs |
| `root_not_recomputable_from_sources` | `root_mismatch` | differs |
| `retrieved_at_not_canonical_form` | `retrieved_at_not_canonical` | differs |

Nine of thirteen differ, so a run that compared our old `diagnostic` against the vector's
`condition` would have reported nine divergences that are not divergences. The map is the
translation, and it is written once.

**Tests.** `rev 7 — Finding 33` in `test/evidence-root.test.ts`: (a) a malformed result
carries a condition; (b) the twelve table rows, one input per row injecting exactly that
condition; (c) `retrieved_at_not_canonical_form` from rev 7 l.242-245's own counter-example;
(d) the member reaches `resolveEvidenceSet`'s return beside the diagnostic; (e) a conformant
set reports none; (f) the map is total over `Diagnostic` and injective. (a)-(d) and (f) were
RED before the tool changed; (e) asserts an absence and was green from the start, which is
recorded rather than presented as evidence.

## R7-2. The two conditions rev 7's table does not name — the rev 8 diff, performed

Rev 7 l.129-134 states what the `condition` member makes possible and defers it:

> Once every vector names its condition, the set of named conditions can be diffed
> mechanically against the enumeration of malformed conditions in the specification text.
> Michael's count of that enumeration is fifteen. Thirteen conditions are now named by
> vectors, each injecting exactly one. **The remaining conditions in the enumeration have no
> vector**, and identifying precisely which ones is now a diff rather than an audit. That
> diff is not performed in this revision and is the first item for rev 8.

**The diff is performed here, and it resolves to exactly two.** Our `Diagnostic` union is the
fifteen-condition enumeration rev 7 refers to (section 6 above lists fourteen; R6-7 added the
fifteenth). Subtracting the thirteen rev 7 names leaves:

| condition with no rev 7 vector | source | why no vector reaches it |
|---|---|---|
| `pinned_count_exceeds_source_count` | base l.73 | needs `pinned_count > source_count` while `pinned_count` still equals the pinned entries — no vector declares counts that disagree in that direction |
| `fully_pinned_inconsistent` | base l.74, rev2 l.180-181 | needs `fully_pinned` to contradict the counts while both counts are themselves consistent |

Both are reachable in our implementation and both are checked by tests predating this run.
Neither is named by rev 7, so we name them ourselves, flagged `OURS` in `Condition`, and
report them as rev 8's first item answered rather than leaving the identifiers undefined —
a halt that reports no condition is a halt the set cannot check, which is Finding 33's own
argument.

## R7-3. Findings 33a, 33b and 33c — three new vectors, no new rule

Each closes a gap our 9 September run reported: rev 6 stated a rule that its own set did not
exercise. Rev 7 adds a vector for three of the four; none of the three adds a sentence.

| Finding | New vector | Rule it exercises | Our status |
|---|---|---|---|
| 33a (l.206-216) | `evi-step-resolves-affirmatively` | rev 6 F29, the `resolved` token | satisfied at `e2cd882` — implemented in the 9 Sep run from rev 6 l.171-174 |
| 33b (l.218-233) | `evi-unpinned-members-absent-accepted` | rev 6 F30, absent is equivalent to explicit `null` on unpinned entries | satisfied at `8ec4ffe`, and it was our reading before rev 6 compelled it (R6-5) |
| 33c (l.235-249) | `evi-retrieved-at-noncanonical-rejects` | rev 6 F32b, the canonical `retrieved_at` form | satisfied at `e2cd882` — implemented in the 9 Sep run from rev 6 l.243-247 |

**33b carries no root, by rev 7's own reasoning** (l.229-233): "Only pinned entries form
leaves, so the root is a function of the pinned entry alone and would be equal to the
explicit-`null` counterpart by construction. Asserting that equality would be an assertion
about this generator rather than about the specification." Our `canonicalOrder` filters on
`pinned === true` before sorting, so the same is true of our implementation, and the vector
tests acceptance only.

**What these three change for this run is coverage, not code.** Each of the three rules was
implemented from a rev 6 sentence and, until rev 7, had no vector on Joe's side to be
compared against. They are the rows where this run can say something the 9 September run
could not, and R7-5 below states exactly what.

## R7-4. Finding 34 and E-4 — the fixture set, not the implementation

**Finding 34 (l.144-196)** is the airlock defect this side reported on 9 September as D2,
taken and generalized. It renames `evi-node-raw-not-hex` to `evi-node-child-encoding` and
`evi-leaf-hex-not-raw` to `evi-leaf-member-encoding`, renames the `computed` keys to
`normative_root` / `counter_construction_root`, rewrites both `expect` strings, makes the
header cite its findings instead of restating them, and adds a build-time assertion that no
identifier or key carries a resolution token. **It binds the set, not us**, and its principle
is stated at l.169-172:

> **A conformance vector verifies a choice. The specification states it.** A vector's
> identifier, key names, and expectation text name the *dimension* under test and the
> *relation* that must hold. They must not name the resolution.

Rev 7 l.190-196 also records what the amendment does not do: it does not restore the airlock
for runs already completed, and **"The Finding 27 branch is therefore not available for
independent corroboration by either of them"** — of Michael Msebenzi or Pablo Play. That
sentence governs what this run may claim about the node-encoding branch, and R7-5 states it.

**E-4 (l.46-80)** corrects rev 6's group arithmetic from `12 + 12 + 5` to `12 + 12 + 6 - 1 =
29`. No root is affected and no implementation behaviour follows. It is recorded because it
was this side's finding and because rev 7 l.255-264 restates the same accounting for the
32-vector set: `13 + 13 + 7 - 1 = 32`, overlap still `evi-root-mismatch-rejects` alone.

## R7-5. What rev 7 lets this run establish, and what it does not

- **Finding 33 is the only rule newly implemented**, so it is the only row where a rev 7
  divergence would be a divergence about the text rather than about coverage.
- **The node-child and leaf-member encodings are not independently corroborated by this run,
  and rev 7 says so at l.190-196.** We read `evi-node-raw-not-hex` at extraction on 9
  September and recorded it as D2. The rename protects the third implementer; it cannot
  unread what we read. Agreement on `evi-node-child-encoding` in this run is therefore
  agreement between an implementation and a fixture whose answer that implementation's author
  had already seen — restated in the findings file rather than counted as corroboration.
- **This run, like the last, is confirmed-by-extension and not a cold build.** Rev 7 l.37-42
  states the limit in this side's own words and requires that -02 "must not describe it as an
  independent second implementation". Our implementation at `8ec4ffe` descends from the
  7 September build; rev 7 changed one rule and we changed one function. Nothing here is a
  second implementation of the other fourteen.
- **Every input is still Joe's.** A malformed condition his set does not inject is still
  invisible to this run, and R7-2 names the two we know of.
