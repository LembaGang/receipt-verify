# Findings from the independent `evidence_root` run — facts for Joe

Step E6 of CC_HANDOFF_2026-09-07_evidence-root-independent_rev2.md. Facts only; the Lead drafts
the letter. Everything here comes from the five -02 texts and the fixture inputs at
`agentoracle-receipt-spec` `ac33ad1`. The generator and the cross-check were never opened.

## 1. Divergences

**None.** 28 of 28 rows agree — every one of the 18 normative roots byte-for-byte, and every
MALFORMED vector halts on the condition it targets. Table in `walker/evidence-roots-compare.md`.

Both prefixes were derived from the text before the header was read, and both match:
`ao-evidence-leaf-v2` and `ao-evidence-node-v1`.

## 2. Places where two readers of these texts could compute different roots

These are the falsifiable part of the result. Agreement on 2a in particular was luck as much as
reading, and it is the one worth closing before filing.

### 2a. The interior node's children have no stated encoding — the only byte-changing gap

`base` l.121 gives `node = SHA-256("ao-evidence-node-v1" || 0x00 || left || 0x00 || right)` and no
sentence in any of the five files says whether `left` and `right` enter as the **32 raw digest
octets** or as **64 lowercase hex characters**. Rev 2's Finding 1 (l.163-167) settles exactly this
question for `snippet_sha256` and scopes its answer by its own words to "**In the leaf preimage**",
so it does not reach the node.

We took raw octets, reasoning that `leaf` and `node` are defined as `SHA-256(...)` — the
function's output — and that the corpus's one hex carve-out is for a member carried in the receipt
as a string, which `left` and `right` are not. Your generator evidently took the same branch,
because every multi-leaf root matches. **But nothing in the text compelled it.** A third
implementer choosing hex would produce different roots for every vector with more than one pinned
item and identical roots for the single-item ones, and every relational expectation in the set
would still pass — so this fixture set cannot detect the disagreement.

Two further consequences worth noting: rev 4's delimiter argument at l.106-109 ("No member may
contain an octet `0x00`") is made only about the *leaf* preimage members. Under the raw-octet
reading a node's children **can** contain `0x00`, so that argument does not carry over; the node
preimage is unambiguous only because the two children are fixed-length.

Suggested: one sentence in rev 6 stating the node encoding, and one vector with two pinned items
whose expectation is a concrete root.

### 2b. The tree's termination is never stated

The texts give a leaf rule, a node rule and an odd-promotion rule, and never say when to stop or
what the root of a one-leaf tree is. We take the value remaining when a level holds exactly one
entry, so a single pinned item's root **is** its leaf, with no node hashing. That is forced by the
construction rather than stated, and an implementer who instead computed `node(leaf, leaf)` for a
single item would satisfy every sentence in the corpus while disagreeing with both of us on the
seven single-item vectors. `base` l.124-128 forbids duplicating an odd entry, which argues our
way, but it is written about a *level*, not about the root case.

### 2c. `retrieved_at` is ordered lexically, and the texts never say it should be

`retrieved_at` is a bound preimage member and the fourth sort term, and rev 5 l.98-99 says all four
comparisons are "bytewise over the UTF-8 encoding of the member as carried". Bytewise over an RFC
3339 string is not ordering by instant: `2026-09-01T12:00:00.000Z` and
`2026-09-01T13:00:00.000+01:00` denote the same moment and compare differently, and
`2026-09-01T12:00:00Z` and `2026-09-01T12:00:00.000Z` do too. The same question hits Finding 12's
"earliest per-item `retrieved_at`" check, where "earliest" reads temporally but the only stated
comparison is bytewise.

The fixture set never exercises this: it carries exactly two timestamp values, both UTC Z-form
with milliseconds. A receipt from an issuer that emits offsets, or omits milliseconds, would put
two conformant verifiers on different roots.

Suggested: either require a single lexical form for `retrieved_at` inside `evidence_set`, or say
that Finding 12's "earliest" is temporal while the sort term is bytewise, and add a vector with
two spellings of one instant.

### 2d. `content_kind: null` on an unpinned entry

An ambiguity as well as a fixture question; stated once, at §3a below.

### 2e. Which diagnostic fires when a receipt carries two malformations

Rev 4 fixes two orderings by argument — 18b puts the `source_count` check ahead of `fully_pinned`,
and 18c puts the `content_kind` check ahead of step (b) "so that the diagnostic names the missing
member rather than reporting a root mismatch". The remaining eleven checks have no stated order,
so two implementations can halt on different conditions for the same receipt. Every vector injects
exactly one malformation, so the set does not test this. It matters for anything that routes on
the diagnostic rather than on the halt.

### 2f. The affirmative step resolution has no name

Steps (c) through (f) name `unknown` and nothing names the outcome when a set is fully pinned and
the verifier holds matching content. We emit `recomputed`; another implementation will emit some
other token. An agent consuming the verifier's output cannot switch on a value the spec does not
define.

## 3. Things in the fixture inputs that the texts forbid or do not define

### 3a. Every unpinned entry carries `content_kind: null`, where rev 4 says the member is absent

All **7** unpinned entries in the set carry an explicit `"content_kind": null`. Rev 4 Finding 21
(l.294-296) closes Q-a by construction with the member "**required** on every pinned item ... and
**absent** on every unpinned item because unpinned items generate no leaf", and rev 2's member
table gives it as "required when `pinned` is `true`". No sentence anywhere states a consequence for
a present-but-null `content_kind`.

We read `null` as absent, because a reader who treated it as a present-but-invalid member would
halt on `content_kind_absent_when_pinned`-style grounds for five vectors that target something
else — the exact "refused by a rule other than the one it targets" failure rev 4 18b refuses to
ship. But that is our choice, not the text's.

Suggested: either drop the member from unpinned entries in the fixture, or add a sentence that an
unpinned entry's `content_kind` MUST be absent, and a vector for the violation.

### 3b. `evi-root-mismatch-rejects` carries a concrete normative root inside `input`

Its `input` carries `"correct_root": "35bc8fb1c853c3de6fa2a4fcacaa7223202fafa7bb5411595f167f21834160c3"`
with the note "the correct root for this input is included for reference". That value is a
normative root — it is the same root the set records under `computed` for
`evi-snippet-change-changes-root` `root_1` and for `evi-leaf-hex-not-raw`.

This matters for exactly the protocol you and the Lead specified. `input` is on the permitted side
of the independence airlock and `computed` is not, so a party running this protocol sees a computed
root before its own roots are fixed. **We saw it at E2**, recorded it before computing anything,
did not use it, and our own recomputation for that vector produced the same value independently
(our halt detail reads `carried ffff… against recomputed 35bc8fb1…`). Disclosed rather than
glossed, because the airlock is the whole basis of the claim.

Suggested: move `correct_root` into `computed`.

### 3c. Every `evidence_set` input omits members the base's table makes required

All nine `evidence_set`-shaped inputs omit `evidence_set_version` and set-level `retrieved_at`;
most also omit two or three of `source_count`, `pinned_count`, `fully_pinned`, `evidence_root`.
Base l.68-76 marks all seven required. So under a reader that enforces requiredness in step (a),
every one of these inputs is malformed a second way, for a reason the vector does not target —
again the 18b problem.

We handled it by scoping our step (a) to the *consistency* of what a set declares, and checking
requiredness nowhere. That is a defensible reading of step (a), which is written entirely as
cross-checks between declared values, but it is a reading.

Suggested: either materialize the inputs as complete `evidence_set` objects, or state in the
fixture README that inputs are partial and that only the targeted rule is under test.

### 3d. The set has no input schema — eleven distinct input shapes across 28 vectors

`input` is `set_1`+`set_2` (8 vectors), a bare array of entries (1), `entry`+`note` (1),
`set_retrieved_at`+`sources` (1), `entry` (4), `evidence_set` (8), `sources` (1),
`correct_root`+`evidence_set`+`note` (1), `receipt_shape` (1),
`entry`+`verifier_holds_bytes_for`+`verifier_recomputed_sha256` (1), and
`entry`+`verifier_holds_bytes_for` (1).

Each shape has to be recognised and mapped by hand; `evi-absent-unknown` carries the prose
`"receipt_shape": "no evidence_set member present"`, which is an instruction to a human reader
rather than data. A consumer cannot process this set without a per-vector branch, which is what
`tools/evidence-roots-run.ts` had to write. Not a correctness defect, and it is the thing that
stops this fixture set being consumable by anything that was not told about it in advance.

Suggested: one input shape — a complete `evidence_set` (or a pair of them, plus an optional
verifier-held-digest map) — with the variation carried in named members rather than in the shape.

## 4. The two rev 5 literals — both present, as required

- **`evi-duplicate-bound-tuple-rejects`** carries two entries identical across all four bound
  members, as rev 5 §4.1.1 (24a, l.64-66) requires:
  `["https://example.org/a", "8ed3f6ad…", "snippet", "2026-09-01T12:00:00.000Z"]`, twice. It is
  the exact-duplicate case, not a near-miss. **Confirmed.**
- **`evi-unpinned-reason-outside-domain-rejects`** carries
  `"unpinned_reason": "content_not_retained"` — the retention literal rev 3 removed from the
  domain, which rev 5 Finding 25 (l.139-147) makes **required** rather than exemplary. Not an
  arbitrary out-of-domain value. **Confirmed.**

Both halt in our implementation on the conditions the rules name.

## 5. One stale digest in the fixture bundle

`fixtures/evidence-pinning-fixture-README.md` l.74 reads: "Reference
`evidence-pinning-fixtures-v2-rev5.json` sha256:
`fe8567bd734602838c0f70bdc0741e506ff5476207bc641ff77ba3a5ea68e5cc`."

At `ac33ad1` that file hashes to `5d499bd01f44bd6e0f12b3617c7f104a214555b57a6c80280f5ceb358409b587`.
`fe8567bd…` is the file at `ac33ad1^`. Commit `ac33ad1` changed the fixture JSON's header (the
generator and cross-check filenames inside `independence_disclosure`, and the shape of
`spec_bases`) and rewrote the README's independence paragraph, but did not update the README's own
reference digest. So the commit that corrected three claims left the bundle unable to verify
itself, and a reader following the README's Reproduce section would get a digest mismatch.

No root is affected: the change was header-only and every `computed` value is unchanged.

## 6. One stale count in rev 4, which the fixture README gets right

Rev 4's vector changelog heads its retained list "**Retained unchanged — nine vectors**" (l.402)
and then lists eleven ids, with two more (`evi-content-mismatch-unknown`,
`evi-content-not-held-unknown`) named in the next paragraph as unchanged in expectation. Thirteen
is the right number; the fixture README uses thirteen and reconciles to 28 correctly. Rev 4's
heading is the stale one. Nothing downstream depends on it.
