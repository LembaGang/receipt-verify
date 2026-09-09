# `evidence_root` rev 6 — findings

Step S4 of `CC_HANDOFF_2026-09-09_evidence-root-rev6.md`, written after commit `e9b98db` fixed
our roots and after the comparison in `walker/evidence-roots-compare-rev6.md`. Upstream pinned at
`TKCollective/agentoracle-receipt-spec` `7f0b0cd1a709aa9ba6a3419b14656340f6526f0c`.

**Result: 22 of 22 root values agree, 29 of 29 relations hold, zero divergences.**

---

## 1. Divergences

**None.** There is no sentence to explain from, which is again why the substance below is about
what the agreement does and does not carry.

---

## 2. What rev 6 compelled, and what is still a shared choice

This is the question the run exists to answer, so the agreements are sorted rather than counted.

### 2a. Compelled by rev 6, and detected by a vector — the one that changed

**The interior node's child encoding.** Rev 6 l.101-104 states raw octets. `evi-node-raw-not-hex`
carries two pinned items, so exactly one interior node is formed, and a **concrete** root:

| | value |
|---|---|
| ours | `7f6addf189cd884e3be1919e470daeba0628bd7f84afefe1492f3fdcd86e4960` |
| theirs, `normative_raw_children_root` | identical |
| the hex-children branch, both sides | `bf2676fc6d5c0b2588d230ee8451f4c9855080376525c0e64c46bbf285a1c58a` |

On 7 September this branch was a choice both implementations happened to make the same way, and
no vector in the rev 5 set could have told that apart from both making the other choice. It is
now stated in the text and detected by a value. **This row is the difference between the two
runs.** Our implementation did not change to satisfy it — `nodeHash` has concatenated raw octets
since `80ca6a6`, on the reasoning recorded in the spec extract §2 before any of Joe's values were
read, and rev 6 l.101-104 gives the same two-part reasoning.

### 2b. Compelled by rev 6, and detected by a vector

**Termination** (rev 6 l.155-157). Several vectors have a one-item pinned set and carry a concrete
root — `evi-leaf-hex-not-raw`'s `35bc8fb1…` among them — so an implementation computing
`node(leaf, leaf)` fails on the value. Forced-but-unstated on 7 September; stated now, and tested.

**`content_kind: null` on an unpinned entry is not a malformation** (rev 6 l.193-196). All seven
unpinned entries in the set carry `content_kind: null`, and three of them sit in vectors that must
not halt (`evi-empty-root-null`, `evi-partial-resolves-unknown`,
`evi-declared-partial-is-not-invalid`). A stricter reader halts those three. This was our reading
on 7 September and was recorded as ours; rev 6 adopts it, so the fixture is now conformant rather
than tolerated.

### 2c. Compelled by rev 6, but not detected by any vector

**The bytewise `retrieved_at` ordering** (rev 6 l.240-241, replacing "earliest" with "first in the
canonical bytewise order"). The set carries exactly two `retrieved_at` literals,
`2026-09-01T12:00:00.000Z` and `2026-09-02T12:00:00.000Z`, and both are in the canonical form, so
bytewise and temporal order agree on every vector. A temporal reader passes the whole set. The
rule is now compelled by the text; the agreement on it is not evidence.

### 2d. Still a shared choice — agreement here carries no weight

- **The order in which our diagnostics are checked.** Rev 6 l.214-218 makes naming free except at
  18b and 18c, so our order beyond those two is ours and nothing tests it.
- **Two conditions we implement that no vector exercises**: `pinned_count_exceeds_source_count`
  (base l.73) and `fully_pinned_inconsistent` (base l.74, rev 2 l.180-181). Both are reachable in
  our validator and neither is reached by any of the 29 inputs.
- **The scope of Finding 30's first limb.** Rev 6 l.193 says `content_kind` on an unpinned entry
  "MUST be absent or `null`", which on its face makes a *valued* `content_kind` on an unpinned
  entry a violation. We do not halt on it, on rev 6's own l.249-250 ("the only amendment in this
  revision that adds a rejection condition" is Finding 32). All seven unpinned entries carry
  `null`, so no vector distinguishes the two readings.
- **The scope of Finding 32's rejection.** We apply it to entry-level `retrieved_at` only, because
  the amendment is directed at §4.1.1, which base l.83-103 defines as the sources-entries section,
  and the set-level member is base l.71 in §4.1. See §4 below.

---

## 3. Rules rev 6 states that no vector in the set exercises

Four, and they are worth naming because the 29-of-29 line does not cover them.

1. **Finding 29's affirmative token, `resolved`** (l.171-174). No vector expects an affirmative
   resolution: every one of the 29 either halts or resolves `unknown`. Our implementation now
   emits `resolved`, and nothing in the set would notice if it emitted anything else. The one rule
   in rev 6 that changes an output value for a conformant input is untested by the set that ships
   with it.
2. **Finding 31's coexistence rule** (l.214-218). Checked rather than taken: our validator returns
   on the first condition it meets and cannot answer this, so the fifteen predicates were written
   out a second time and every one evaluated over the same inputs. **Every MALFORMED vector
   injects exactly one condition**, so rev 6 l.206-207's claim holds and the rule it motivates is
   never reached.
3. **Finding 32's canonical-form rejection** (l.243-247). Both `retrieved_at` literals in the set
   are already canonical, so the one halt rev 6 adds fires on no vector. Our eight RED tests for
   it come from the sentence and from nothing in the fixture.
4. **Finding 30's "MUST be absent or `null`" limb**, as above — all seven unpinned entries carry
   `null` and none is absent, so even the equivalence the sentence asserts is only half exercised.

Finding 27's second clause (l.121-126, the `0x00` scoping) is non-behavioural and there is nothing
for a vector to exercise.

---

## 4. One place rev 6's new rule does not reach, and we did not extend it

Finding 32 requires the canonical form of `retrieved_at` and gives its reason as the bytewise sort
at §4.1.2. The amendment is added to **§4.1.1**, the `sources` entries section. The **set-level**
`retrieved_at` is a different member in a different section (base l.71, §4.1), and rev 6 does not
amend it.

That member is compared bytewise against the entries by the Finding 12 check, so the reason the
rule gives applies to it word for word — two spellings of one instant would break the comparison.
We followed the sentence's placement rather than its reason and left the set-level member
unchecked, which is recorded in the extract at R6-7 and pinned by a test that asserts the
diagnostic is `set_retrieved_at_not_earliest` rather than a form rejection. The behaviour still
fails closed; the diagnostic is the wrong one, and no sentence in rev 6 makes it the right one.

**Suggested to Joe as a one-line fix:** state the canonical form once for `retrieved_at` wherever
it appears, or add the same sentence to §4.1's member table.

---

## 5. Facts about the fixture bundle

### 5a. Both errata are fixed, verified from the bytes rather than taken

- **E-3, the airlock leak.** Zero vectors carry `correct_root` under `input`; twelve carry a
  `computed` member. Re-derived from our own whitelist extract, which contains no `correct_root`
  string at all. **The disclosure the 7 September run had to make is not needed this time**, and
  the value that used to leak is now a real comparison point: `evi-root-mismatch-rejects` is
  root-bearing for the first time and its `correct_root` agrees with our recomputation.
- **E-2, the README's self-digest.** The rev 6 README (l.149-150) gives the fixture digest as
  `81cfd1bbb6e1f1a5…`, and the file at `7f0b0cd` hashes to exactly that. The bundle verifies
  itself through its own Reproduce section again, which the rev 5 bundle could not.

### 5b. Rev 6's own category table is wrong in one cell, in the paragraph that warns about it

Rev 6 l.314-319 and the README l.111-116 both give:

| | rev 5 | rev 6 |
|---|---|---|
| Root-bearing vectors | 10 | 12 |
| Root values carried | 19 | 22 |
| `MALFORMED` | 12 | 12 |
| Remaining | 6 | **5** |

The first three are right and we reproduce all three. **"Remaining 5" is wrong; it is 6.** No
vector left that group — the same six sit in it under rev 5 and under rev 6 (`evi-empty-root-null`,
`evi-absent-unknown`, `evi-partial-resolves-unknown`, `evi-declared-partial-is-not-invalid`,
`evi-content-mismatch-unknown`, `evi-content-not-held-unknown`). What changed is that
`evi-node-raw-not-hex` joined the root-bearing group and `evi-root-mismatch-rejects` joined it too
while staying MALFORMED.

The correct arithmetic is **12 + 12 + 6 − 1 = 29**, or 11 + 12 + 6 = 29 counting root-bearing by
designation alone. Reducing "remaining" to 5 subtracts the overlap a second time so that
12 + 12 + 5 reaches 29 — which is the very presentation the same paragraph (l.328-329, README
l.121-122) tells the next run not to make. No root is affected.

### 5c. The README's input-shape count is carried from our rev 5 report and is now stale

README l.195 says "**Eleven** distinct input shapes across the set", quoting our 7 September
figure for the 28-vector set. Under rev 6 we count **9** ignoring the advisory `note` member, or
**12** counting `note` as part of the shape. Neither is eleven.

**The finding it names is unchanged and still holds.** One input member is still prose —
`"receipt_shape": "no evidence_set member present"` on `evi-absent-unknown` — and a consumer still
needs a hand-written branch per vector; ours does. Rev 6 l.362-374 defers the unification to rev 7
with the two requirements stated, which is the right disposition. Only the number needs
correcting when it lands.

### 5d. The requiredness disagreement persists, as rev 6 says it does

All **nine** `evidence_set` inputs omit `evidence_set_version` **and** the set-level
`retrieved_at`, both marked required at base l.68-76. Rev 6 l.380-386 names this as open and calls
it a fixture-versus-text disagreement rather than an ambiguity — one of the two is wrong — and
defers it to rev 7. We confirm the count is nine of nine and have not changed our step (a) scoping,
which checks the internal consistency of what a set declares and checks requiredness nowhere.

### 5e. Rev 6's delta claim, verified against our own rev 5 extract

Rev 6 l.303-305 and README l.28-32 claim 27 of the 28 shared vectors are byte-identical to rev 5.
Checked against `walker/evidence-inputs-rev5.json`, committed on 7 September: **27 shared inputs
are byte-identical, the one that differs is `evi-root-mismatch-rejects`, and the one new id is
`evi-node-raw-not-hex`.** Exactly as stated.

---

## 6. What this run establishes, and what it does not

**Establishes.** A second implementation, extended from the rev 6 text alone by a party who had
not opened the rev 6 generator, cross-check or README, computes the same 22 root values as Joe's
bundle over the 29 rev 6 inputs, and satisfies all 29 stated relations. Our roots were committed
in `e9b98db` before any computed value was read.

**Does not establish.**

- **The node-encoding agreement is now evidence about the branch; the rest of the agreement is
  not.** `evi-node-raw-not-hex` is the only vector whose value distinguishes a construction choice
  that the text once left open. Every other multi-leaf agreement would look identical if both
  sides had chosen the other branch — which is exactly what the 7 September run reported and what
  rev 6 fixed for this one case only.
- **It is not a fresh cold build.** This is our 7 September implementation extended by two rules.
  Six of the eight rules its seven amendment blocks carry were already satisfied, so for those the run tests that
  our reading of rev 5 survives contact with rev 6's sentences, not that a reader coming to rev 6
  cold would reach them. Rev 6 l.387-390 asks for a second cold build to find the next Finding 27,
  and this run is not that instrument.
- **Independence is still in the reading, not the data.** Every input is Joe's. A case the set
  does not contain is invisible here by construction, and §3 lists four rules the set states and
  does not test.
- **The malformed rows test our halt, not his.** Twelve vectors carry no value on his side. Under
  rev 6 l.214-218 "agree" means we halt on a condition the input genuinely violates, which §2 of
  the comparison establishes by evaluating every predicate rather than the first.
- **A green suite answers one question.** 662 passing tests say our implementation matches our
  reading of the texts and these 29 inputs. They say nothing about trees deeper than two levels,
  non-ASCII URLs, timestamp spellings the set does not carry, or `evidence_set` members it never
  varies.
- **One run, one machine, one pinned commit.** `7f0b0cd`, verified by digest from the object
  store. It is not a claim about `origin/main` at any later time.
