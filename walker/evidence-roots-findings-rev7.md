# `evidence_root` rev 7 — findings

Step P3 of `CC_HANDOFF_2026-09-10_rev7-and-repins.md`. Companion to
`walker/evidence-roots-compare-rev7.md`. Upstream pinned at
`TKCollective/agentoracle-receipt-spec` `3d0ec0e82229c1336340f0323d54904e5baf38b2`,
rev 7 amendments sha256 `6b13f6fc35d745c2642edcb52a2754f7cd43340ded3248b5d1ba70a431d6c037`
(17,732 B), fixtures sha256
`a8679bdf5acb56ed7cd614086c5ea44438bcd6735b356e88c5e40172e8c696f1` (31,339 B), both
re-derived from the git blobs.

**Outcome: 23 of 23 root values agree, 13 of 13 conditions agree, 32 of 32 relations hold,
zero divergences.** No divergence means no finding of the kind the last two runs produced
against the roots. The findings below are about the set and about the limits of what this
run establishes.

---

## D1 — the disclosure at extraction, unchanged in kind from rev 6

**Status: recorded, as before. No resolution disclosed.**

The P0 structural pass reads key names before any value. Visible at P0:

- Top level: `header`, `vectors`.
- `header` members: `independence_disclosure`, `leaf_member_encoding`, `leaf_prefix`,
  `node_child_encoding`, `node_prefix`, `spec_bases`, `title`, `vector_count`. Of these,
  only `title` and `vector_count` are whitelisted; the other six are names only and their
  values stayed shut until 13:03:19Z.
- Vector members across the set: `id`, `designation`, `expect`, `input`, `computed`,
  `condition`, `note`.
- `input` member names: `set_1`, `set_2`, `0`, `1`, `2`, `note`, `sources`, `entry`,
  `set_retrieved_at`, `evidence_set`, `receipt_shape`, `verifier_holds_bytes_for`,
  `verifier_recomputed_sha256`, `content_matches`.

None of these names states a resolution. `node_child_encoding` and `leaf_member_encoding`
name the dimension, which is what rev 7 l.169-171 permits. The structural check also
re-derived, from our own extract rather than from rev 7's text: **32 vectors, zero carrying
`correct_root` inside `input`, 13 carrying a `computed` member.** The airlock fix rev 6 made
by construction (E-3) still holds under rev 7.

**One extension to the whitelist, disclosed.** `condition` was added to
`tools/evidence-root-inputs.mjs`. The protocol permits extending the list "only if rev 6
renames a permitted member", and this is an addition, so it is reported rather than taken
silently. The ground: rev 7 l.115-127 prints all thirteen `condition` values in the
amendments text, which the airlock permits at any time and which our implementation is
written from, so excluding the member from the extract would have withheld nothing.
`note` and `computed` stay excluded.

---

## D2 — **OPEN.** The identifier half is closed; the expectation-text half is not

Our 9 September finding was that `evi-node-raw-not-hex` named which branch the answer takes,
and that `id` is on the permitted side of the whitelist. Rev 7 Finding 34 takes it and
generalizes it, stating the principle at l.169-172:

> **A conformance vector verifies a choice. The specification states it.** A vector's
> identifier, key names, and expectation text name the *dimension* under test and the
> *relation* that must hold. They must not name the resolution.

**Closed, on the part rev 7 amended.** No vector identifier in the 32 names a resolution;
both offending ids were renamed; both `computed` key pairs became
`normative_root` / `counter_construction_root`; both `expect` strings were rewritten to
state the relation and say the encoding "is stated normatively in the specification and is
deliberately not restated here"; and both header members now cite their governing finding
instead of restating it. Verified over our own extract, not taken from rev 7's account of
itself.

**Open, on two vectors rev 7 did not touch.** Scanning every whitelisted field of all 32
vectors against the principle, two `expect` strings still name the resolution of the choice
their vector exists to verify:

| vector | `expect`, verbatim | the choice | what the text hands over |
|---|---|---|---|
| `evi-root-odd-promotion` | `root matches promote-not-duplicate (three sorted leaves, third promoted unchanged)` | at an odd level, promote the tail or duplicate-and-pair it | names the winning branch twice — `promote-not-duplicate`, and `third promoted unchanged` — and the tail's position |
| `evi-url-normalization-changes-root` | `roots differ; unnormalized bytes are normative` | whether the URL is normalized before entering the leaf | names which side is normative in so many words |

Both are exactly the construction Finding 34 exists to remove, in fields Finding 34's own
principle covers. An implementer who had read neither base l.124-126 nor the URL rule passes
both vectors from the `expect` string alone, and under rev 7 l.171-172 that vector "has
measured nothing".

**The cause is structural, and it is why the revision that removed the defect left these
two standing.** Rev 7 l.186-188 states the mechanical guard:

> The generator and cross-check **assert** that no vector identifier or `computed` key
> contains a resolution token (`raw`, `hex`, `normative_raw`, `not-hex`, and the like). A
> future vector that names its answer fails the build rather than shipping.

The assertion ranges over **identifiers and `computed` keys**. The principle at l.169-172
ranges over **identifiers, key names, and expectation text**. `expect` is inside the
principle and outside the guard, so the guard cannot see the two rows above and would not
have caught them. The generalization Finding 34 made in prose was not carried into the
check that enforces it.

**Recommendation for rev 8**, stated as ours: extend the build-time assertion to `expect`
and to `designation`, and rewrite the two strings to name the relation only — for instance
`three sorted leaves; root matches the construction of base §4.1.2` and `roots differ`. We
have not proposed exact replacement wording as normative text; the relation each vector
tests is already computable from our side without either clause, which is the evidence that
the clause is surplus.

**A third row, recorded as borderline rather than asserted.**
`evi-duplicate-url-distinct-digest`'s `expect` reads `deterministic order by the four-term
key of §4.1.2; stable root`. It names the sort key, which is the resolution of "what orders
two entries sharing a URL", but it does so by citing §4.1.2 rather than restating the four
terms. That is the form rev 7 chose for the two header members it fixed, so it is at worst
inconsistent with itself rather than a leak. Reported for Joe to rule on.

---

## F35 — the rev 8 condition diff, performed

Rev 7 l.129-134 defers to rev 8 the diff between the thirteen named conditions and the
enumeration of malformed conditions in the specification text, and says the count of that
enumeration is fifteen.

**The diff resolves to exactly two.** Our `Diagnostic` union is that fifteen-condition
enumeration, built from the texts over the 7 and 9 September runs. Subtracting the thirteen
rev 7 names:

| condition with no rev 7 vector | governing sentence | why no vector reaches it |
|---|---|---|
| `pinned_count_exceeds_source_count` | base l.73 | requires `pinned_count > source_count` while `pinned_count` still equals the count of pinned entries; no vector declares counts disagreeing in that direction |
| `fully_pinned_inconsistent` | base l.74, rev2 l.180-181 | requires `fully_pinned` to contradict the counts while both counts are themselves consistent |

Both are reachable in our implementation, both are covered by tests that predate this run,
and neither is named by rev 7. We have named them ourselves in `Condition`, flagged `OURS`,
so that every halt this implementation can reach reports a condition — a halt reporting none
is a halt the set cannot check, which is Finding 33's own argument turned on the two rows it
did not reach.

**What this does not settle.** Our enumeration is fifteen because our reading of the texts
produced fifteen predicates. If Joe's enumeration is fifteen by a different partition —
splitting or merging conditions differently — the two lists could agree in count and differ
in membership. The diff above is against **our** fifteen, and rev 8 should run it against
his.

---

## F36 — what agreement on the conditions does and does not establish

**Does.** Each of the thirteen inputs is refused by the predicate that names it, not merely
by some predicate. Two implementations passing all thirteen for different reasons — rev 7
l.92-96's failure mode — is now excluded on this side. Nine of the thirteen conditions are
spelled differently from our diagnostics, so the pairing was carried by the map and not by
coincidence of naming.

**Does not.** The thirteen identifiers are printed in the amendments text, which we are
required to read and which our implementation is written from. Agreement on the identifiers
themselves is the method working, not corroboration. And every input is still Joe's: a
malformed condition his set does not inject remains invisible, and F35 names the two we know
of.

---

## F37 — the limit on what this run may be called, restated because rev 7 requires it

Rev 7 l.37-42, in this side's own words from the 9 September report:

> His rev 6 work extended his 2026-09-07 implementation rather than rebuilding cold. It
> could confirm that rev 6's sentences match his reading of them. It could not have found a
> *second* uncompelled choice, because he made the first one. **-02 must describe this as
> confirmed-by-extension and must not describe it as an independent second implementation.**

The same holds for this run, more strongly: rev 7 changed one rule and we changed one
function. The other fourteen conditions, both prefixes, the preimage, the sort key and the
tree construction are the 7 September build, unrebuilt. Nothing in this run is a second
implementation of any of them.

Rev 7 l.290-294 also records that no cold build has landed against any revision, that Pablo
Play's build against rev 6 is in progress on his own clock, and that "-02 must not claim
one". Nothing in this run changes that.

---

## Rules rev 7 states that no vector exercises

Rev 7 closes three of the four rev 6 gaps we reported. The fourth stands, by its own
account:

- **Rev 6 Finding 31's coexistence rule** — "A conformance vector that injects more than one
  condition MUST state which diagnostics are acceptable." No vector injects two conditions,
  so no vector reaches it. Rev 7 l.136-140 does not add one; it converts the rule from
  unreachable to *expressible*, because a future set can now carry a two-condition vector and
  name the condition that must be reported. Recorded as still unexercised.

And one rev 7 adds:

- **Finding 33's equality requirement is checked in only one direction.** Every vector's
  `condition` is matched by ours, but no vector tests that an implementation reporting the
  *wrong* condition is refused — that would need a vector whose stated condition differs from
  the one its input injects, which is a conformance test of the harness rather than of the
  implementation. Our own coverage of that direction is `test/evidence-root.test.ts`
  `rev 7 — Finding 33` (b), which pins each of the twelve inputs to its own condition and
  fails if any two are swapped.
