# VECTOR RESULTS

## Your conformance vectors at `e0ad1c7`, run against an independent implementation of §4.1

Issued 2026-09-03. This document replaces the one sent on 2026-08-30. Three of its counts were wrong
and the corrections were sent to you in writing on 2026-08-31; each is marked below. Everything is
re-derived, not carried over.

**Pins.** Repository `https://github.com/action-state-group/scitt-payload-binding.git`, commit
`e0ad1c7e0b0248b9aed25c747f174548cb8e141d`, `vectors/` tree object
**`4f2aec252028990a6ec59c0edfcd0f3b18cc4b40`**. Draft text sha256 `47ab6757…5ec875`, 92428 bytes,
2072 lines. Per-file digests are git blob ids; the full 82-entry listing is in
`vectors-tree-e0ad1c7.txt` beside this document. Run on Windows, Node v24.13.0, from a checkout made
with `core.autocrlf=false` whose 77 vector files were each verified byte-identical to their blobs.

**Two result sets, reported separately, meaning different things.**

- **PRIMARY** — `vectors/subject-binding-diff/`. The live registered `jcs` construction. This is the
  result that speaks to the draft.
- **OBSERVED** — `vectors/jcs-n/kats/`. Our `jcs` run against the historical suite for the withdrawn
  construction. **Not a conformance result.** It measures how much of that suite is
  construction-independent, and nothing else.

---

## PRIMARY — 16 of 16 AGREE

Four vectors, four comparisons each: the canonical pre-image as text, the same bytes as hex, the
SHA-256 digest, and a direction-specific check.

| vector | blob at `e0ad1c7` | pre-image | bytes | digest | direction |
|---|---|:-:|:-:|:-:|:-:|
| `diff-01-null-member` | `9ee197c5f25cf634f8930c5e30f1a8e8d2cd9b2a93cac3917bdb1fe93e24898c` | AGREE | AGREE | AGREE | AGREE |
| `diff-02-empty-object-member` | `55a4b4e1260c0689cb918b71879c5c4db2e727b96f589d848b8119f96e6772d4` | AGREE | AGREE | AGREE | AGREE |
| `diff-03-empty-array-member` | `c845c2dbef8787e07fe106d7990c4929e453743fe237b069ddf2142c3ef453ba` | AGREE | AGREE | AGREE | AGREE |
| `diff-04-float-member` | `c660f2da9e4200155c7d772990682280a7143be3d5ac8dd0ea203546785a1a7e` | AGREE | AGREE | AGREE | AGREE |

The digests reproduced:

```
diff-01  cb4c539a757dee6584e899a9b70342757f0800c9e8527aea7fee453549252604
diff-02  0fdd12257dcbe7edffe732fb8014026f0d0b39abc0b21aa5e03725be9e493335
diff-03  6cbef10f125b927dc08dd90a403b9af16fcae41f3a13d5390e9227741bdaae03
diff-04  0fa3ccae3748585dc7424e1cab59ca12f801b91a21c2684fb1a1bf2c8fbf2a19
```

**The divergence is computed, not asserted.** For diff-01, -02 and -03 the check is that our `jcs`
digest **differs** from the vector's pinned `jcs_n` digest. If this implementation ever collapsed onto
the withdrawn construction those rows would read "identical", which is the failure the whole set
exists to expose. For diff-04, whose `jcs_n` side is MUST-FAIL, the check is that algorithm admission
never returns a verifiable result for the withdrawn token under either vintage branch of §4.2:
`failed/unverified/unverified` for post-boundary, pre-boundary and unknown-vintage records.

### The falsification, run on every invocation

Six deliberately wrong constructions are run against the same four vectors every time the harness
runs, rather than being asserted in prose. A "16 of 16" that no wrong implementation could fail would
be decoration.

| mutant | what it does | detected |
|---|---|---|
| M1 collapse to jcs-n | strips null / empty members before digesting | **DETECTED**, 12 of 16 rows red |
| M2 strip null members only | partial collapse | **DETECTED**, 4 of 16 |
| M3 strip empty members only | partial collapse | **DETECTED**, 8 of 16 |
| M4 serialize with JSON.stringify | wrong canonicalization | **DETECTED**, 12 of 16 |
| M5 uppercase hex output | wrong §4.1 step 3 encoding | **DETECTED**, 4 of 16 |
| M6 strip nested nulls only | collapse at depth only | **NOT DETECTED — this set cannot see it** |

**M1 drives `diff-01` onto `163468697dd1eca263fef4dc5311a0711eb32b8fcc4083b6447973b7f5b42a5d`, which
is the digest your own vector pins for `jcs_n`.** That
is measured against your bytes, not ours, and it is what makes the mutant equivalent to editing the
digest module by hand.

**M6 is undetected and is reported rather than hidden.** All four `subject-binding-diff` vectors place
their divergent member at the top level, so a mutant that strips nulls only at depth produces
identical output on all four. **This is a coverage gap in the vector set, stated as our observation
rather than as a defect claim:** a fifth vector with a nested null inside a surviving object would
close it, and no vector under `vectors/` at `e0ad1c7` does today.

---

## OBSERVED — 23 of 29 comparable

**CORRECTED 2026-08-31. The 30 August package reported this as 19 of 25.** The base was wrong in two
places and both are corrected here.

### How the 38 kats divide

| bucket | count | what it is |
|---|---:|---|
| comparable, carrying a pinned conforming digest | **29** | compared; 23 agree |
| refused at the octet boundary | **1** | kat-37, before any value was digested |
| pinning a failure reason and no conforming digest | **6** | nothing to compare a digest against |
| evaluated from `cited_artifact.payload` | **2** | kats 20 and 21 |
| not evaluated | **0** | — |

The four buckets are disjoint and sum to 38; both properties are asserted by the test suite, against
the same function that prints the counts, so a number in this document cannot disagree with the run
that produced it.

### The four vectors that moved the base from 25 to 29

Kats 13, 27, 28 and 29 are MUST-FAIL under `jcs-n` and **also** pin, under `jcs_n_correct_digest`, the
digest a conforming implementation produces for the same input. The 30 August harness printed those
four values and never compared them, because the interface it read vectors through did not declare
that key. All four agree exactly:

```
13-nfc-boundary-contrast              0b985be82ae90bcbbbafc977962796b317195d17f2b700fbb37a588abfd097bf
27-esc-uppercase-contrast             f5d570fa6125f49bcb56da3ce3e37d4d214d02723feb1c7d24ddedc5b2677153
28-tab-long-form-contrast             7ac9c6bd87cdda62f1e81f0139d6ab751c66321164e230d35f3133a000280695
29-control-key-escaped-sort-contrast  64e35d3d1ba080baed3eafbe59b668d6642d486a9b9750fef60997690d7e570b
```

**Those four are the NFC boundary, the lowercase escape form, the named short escape and the UTF-16
key-sort cases — RFC 8785 conformance anchors.** That matters more than the arithmetic. The coverage
statement in these documents says RFC 8785 conformance was inherited from a vendored canonicalizer and
not derived in this exercise. Your vectors derived it, and it passed. The result was in hand and was
reported as absent.

### kat-37 — refused, and the 30 August run did not refuse it

`37-must-fail-duplicate-key.json` pins the input `{"a": 1, "a": 2}` with `failure_reason:
duplicate_key`. **The 30 August run digested it and produced
`7e8059f495589fcd981232cc11d00b00da3802c01d688fa1cf1f6bed6e5bb33c`**, which is the digest of `{"a":2}`
— what `JSON.parse` leaves after silently discarding the first member. A conforming implementation
refuses before an object exists. Ours did not, and that was reported to you as a gap in your text
rather than as a defect in our implementation. It was ours.

It now refuses, at the octet layer, naming the set the refusal comes from:

```
REFUSED: duplicate member name at $.input.a
(RFC 8785 §3.1 via the jcs registry entry; RFC 7493 §2.3)
```

The rule was never missing from your document. It is one normative reference away from §4.1: the `jcs`
registry entry gives its Reference as RFC 8785 Section 3, §3.1 there excludes duplicate property names
from canonicalization, RFC 7493 §2.3 says it again, and kat-37's own description says it a third time.
The finding that survives is about where the rule lives, not whether it exists, and it is in the
ambiguity log beside this document under A1.

### kats 20 and 21 — an input was there, and it reproduces

**CORRECTED 2026-08-31.** Both were reported as carrying no canonicalization input at all and were put
in a bucket labelled "no canonicalization input" — a label that was printed at runtime, so anyone
running the harness re-derived the wrong claim. They carry an input. It sits under `cited_artifact`
rather than under `input`, with an exclusion set, a declared representation and a pinned
`correct_derived_id_bare_hex`. Both reproduce:

```
payload  {"action":"read","resource":"sensor-7"}
yours and ours  2f9bba43e30273e2e87c7ef659a0f36f1e11f8e0c10489afe4d267c996505c37
```

The scope of the original negative was the **key name**. The conclusion drawn was about the **file**.
They are counted in their own bucket rather than folded into the 29, because what reproduces for them
is a derived identifier and not the same comparison the other vectors make.

### The six that do not agree, and why

`02-null-removed`, `03-empty-array-removed`, `04-empty-object-removed`, `06-nested-null-bottom-up`,
`07-nested-empty-array-bottom-up`, `14-nested-array-normalization`. Every one carries a member whose
value is JSON null, an empty array or an empty object, which is exactly what the withdrawn
normalization pass removed and what `jcs` preserves. **The two constructions diverge on those shapes
and, across these 29 vectors, on nothing else.** That is the measurement, and it is what makes a
pinned `jcs-n` digest readable elsewhere in this package: where no such member survives exclusion, the
two constructions agree by construction.

### Per-vector

| # | vector | verdict | # | vector | verdict |
|---:|---|:-:|---:|---|:-:|
| 01 | basic | AGREE | 20 | must-fail-identifier-trailing-newline | AGREE |
| 02 | null-removed | DISAGREE | 21 | must-fail-identifier-surrounding-whitespace | AGREE |
| 03 | empty-array-removed | DISAGREE | 22 | exclusion-depth-top-level-only | AGREE |
| 04 | empty-object-removed | DISAGREE | 23 | esc-control-char-value | AGREE |
| 05 | absent-field | AGREE | 24 | tab-control-char-value | AGREE |
| 06 | nested-null-bottom-up | DISAGREE | 25 | control-char-taxonomy | AGREE |
| 07 | nested-empty-array-bottom-up | DISAGREE | 26 | control-key-code-unit-sort | AGREE |
| 08 | exclusion-set | AGREE | 27 | esc-uppercase-contrast | AGREE |
| 09 | exclusion-before-normalization | AGREE | 28 | tab-long-form-contrast | AGREE |
| 10 | must-fail-float | reason only | 29 | control-key-escaped-sort-contrast | AGREE |
| 11 | exact-decimal-string | AGREE | 30 | deep-nesting | AGREE |
| 12 | nfc-boundary-pass | AGREE | 31 | nested-tool-schema | AGREE |
| 13 | nfc-boundary-contrast | AGREE | 32 | must-fail-exponent | reason only |
| 14 | nested-array-normalization | DISAGREE | 33 | large-safe-integer | AGREE |
| 15 | must-fail-float-in-array | reason only | 34 | large-payload | AGREE |
| 16 | must-fail-unsafe-int-in-array | reason only | 35 | must-fail-negative-zero | reason only |
| 17 | must-fail-large-int-in-array | reason only | 36 | pass-zero | AGREE |
| 18 | utf16-key-order | AGREE | 37 | must-fail-duplicate-key | **REFUSED** |
| 19 | rfc8785-sorting-example | AGREE | 38 | escaping-control-chars | AGREE |

"reason only" means the vector pins a failure reason and no conforming digest, so there is nothing to
compare a digest against; our `jcs` produces a value for those inputs, which is correct behaviour for
`jcs` and says nothing about `jcs-n`. Kats 20 and 21 are the `cited_artifact` rows above; kat-37 is
the refusal.

---

## TWELVE VECTORS EXERCISE §5, NOT THREE — AND NOT TEN

**CORRECTED 2026-08-31, AND CORRECTED AGAIN HERE.** The 30 August package reported that the three
`jcs-n/derived-id` vectors are the only vectors anywhere exercising §5's derived-identifier
construction. The correction sent on 31 August named seven others: kats 20 and 21, and five under
`typed-refs/`.

**That corrected figure was itself an under-report, by the same method that produced the original
one.** Seven of the eight files under `typed-refs/` carry a payload, a `{doc_id}` exclusion set and a
pinned derived identifier — not five. `fail/04` and `fail/05` were missed because the search looked for
the value under the member names it was expected to have. They carry it under
`correct_verification.recomputed_digest` and under a top-level `correct_recomputed_digest`.

**All seven reproduce**, and so do kats 20 and 21:

```
0c837d01faa4106c63367f199af9bfa729d1917f36dc91f9dfeb6de6ec7c6bdb
```

| vector | excluded member holds | where the exclusion set is declared | where the identifier is pinned |
|---|---|---|---|
| `typed-refs/pass/01-matching-digest` | `doc_id = null` | `exclusion_set` array | `cited_artifact.derived_id` |
| `typed-refs/pass/02-arp-conformance-baseline` | `doc_id = null` | `exclusion_set` array | `cited_artifact.derived_id` |
| `typed-refs/fail/01-digest-context-mismatch` | **`doc_id = "secret-id-123"`** | `exclusion_set` array | `cited_artifact.correct_derived_id` |
| `typed-refs/fail/03-representation-mismatch` | `doc_id = null` | **prose only — see below** | `cited_artifact.correct_derived_id_bare_hex` |
| `typed-refs/fail/04-identifier-inconsistent-with-context` | **`doc_id = "secret-id-123"`** | `exclusion_set` array | **`correct_verification.recomputed_digest`** |
| `typed-refs/fail/05-digest-algorithm-inconsistent-with-context` | `doc_id = null` | `exclusion_set` array | **`correct_recomputed_digest`, top level** |
| `typed-refs/fail/06-arp-digest-alg-inconsistent-with-registered-context` | `doc_id = null` | `exclusion_set` array | `cited_artifact.derived_id` |

**So the count of vectors from which §5's construction is reproducible is twelve**: three under
`jcs-n/derived-id/`, two kats, and seven under `typed-refs/`. Five member names across three objects
carry the pinned identifier, which is why counting them by name kept producing a number that was too
small. The one file under `typed-refs/` genuinely outside the set is `fail/02`, which compares two
artifacts against a single digest and pins no derived identifier for a cited artifact; a test asserts
that it is the only exclusion, so a widening of the predicate that swept in a vector pinning something
else would fail rather than inflate the count.

**This is a fourth instance of one mistake, and it is reported here rather than quietly folded in.**
The 31 August letter said the coverage manifest had to be re-derived rather than patched, because the
same scoping error had produced three under-reports and it was not yet known whether it had produced a
fourth. It had. The method that finds these is searching for the *value* and then asking what each hit
is, rather than searching for the names the value was expected to carry.

**`fail/01` is the one most worth having, and it was discarded.** Its excluded member holds the
non-null string `"secret-id-123"`, which discriminates **deleting** an excluded member from **nulling**
it far more sharply than any vector used on 30 August: all three `derived-id` vectors carry
`record_id: null`, so none of them can tell those two readings apart. That distinction is recorded in
the ambiguity log as A5 and was resolved from the text alone; `fail/01` is the external check on it,
and it agrees.

**One judgment call, surfaced rather than buried.** `fail/03` declares its digest context only in
prose — the `digest_context` string "jcs-n; exclusion set {doc_id}; 64-char lowercase hex" — and
carries **no `exclusion_set` array anywhere in the file.** Recomputing it at all requires reading the
exclusion set out of that sentence. That is what was done, the row says so in the run output, and a
test pins that `fail/03` is the only one of the seven where it was necessary. Skipping the vector would
have looked safer and would have hidden a fact worth having: a machine-readable context is available
for four of these five and not for the fifth.

`fail/04` does also pin a deliberately wrong carried digest (`24880099…`) and `fail/05` does vary the
digest algorithm — that is what each vector is *for*. Neither fact stops the vector from also pinning
the correct recomputation of its cited artifact, which is the thing being reproduced here, and reading
one as excluding the other is how both came to be dropped.

---

## THE SUPPLEMENTARY CHECK — §5.1 identifier grammar

Kats 20 and 21 each pin an identifier **string** that must be rejected on its grammar: a 65-character
value whose last character is U+000A, and a 64-character value padded with spaces. **Our §5.1 decoder
refuses both, 2 of 2**, as the vectors require.

Reported outside both counts and claimed as nothing more than it is: these vectors declare the
withdrawn algorithm, and §5.1's representation rule is not the same rule as `jcs-n`'s identifier
grammar. This says only that our §5.1 decoder refuses these two strings.

---

## CLAIM MANIFEST

**Recomputed in this run, from the bytes named:** every digest, pre-image and identifier above; the
bucket counts and their disjointness; the six mutant results including M6's non-detection and M1's
collapse onto your pinned `jcs_n` value; the per-vector table; the four `jcs_n_correct_digest` values;
the kat-37 refusal and the digest the 30 August run produced instead; the seven typed-refs identifiers,
the five member names that carry them and the two places their exclusion sets are declared; the equality of all 77 working-tree vector
files with their blobs.

**Taken from you, as your figures:** every `expected` column — the pinned digests, pre-images,
identifiers, failure reasons and MUST-FAIL declarations are yours, read from your vectors, and this
document compares against them rather than restating them as independently derived. The intent of
`fail/03` declaring its exclusion set in prose.

**Not established here:** that the `jcs` step conforms to RFC 8785 — the canonicalizer underneath was
vendored and not written or derived for this exercise, and every agreement above inherits that bound.
That the OBSERVED set says anything about conformance: those 38 vectors declare the withdrawn
construction, and the 23 of 29 is a measurement of how far two constructions coincide, not a score.
That M6 is undetectable in general — it is undetected **by these four vectors**, which is a statement
about the vector set. That the six disagreements are the only shapes on which the two constructions
diverge: that holds across these 29 vectors and is not proven beyond them.

---

## Interests

Interests. The author of this grading authors draft-msebenzi-evidence-action, builds Chirindo, an operator-run gate that signs receipts of MCP calls, and maintains receipt-verify, the tool that produced this document. Those occupy the same ground as the formats graded here. Independence is not claimed. What is claimed is that every value in this document recomputes from pinned bytes by anyone with the tool or without it, that every scope is cited to the document that names it, and that text and implementation are scored separately, a rule that came from the author of one of the formats graded. Where a judgment call was made, it is marked as one.
