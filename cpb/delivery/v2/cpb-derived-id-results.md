# DERIVED-IDENTIFIER RESULTS

## `vectors/jcs-n/derived-id/` and the §5 construction

Issued 2026-09-03. This document replaces the one sent on 2026-08-30. Four of its statements were
wrong and one of its headline numbers overstated what it measured; the corrections were sent to you in
writing on 2026-08-31 and each is marked below.

**Pins.** Commit `e0ad1c7e0b0248b9aed25c747f174548cb8e141d`, `vectors/` tree object
`4f2aec252028990a6ec59c0edfcd0f3b18cc4b40`. **Content-addressed digests**, which the 30 August
document did not publish:

```
9e3cce8269062b2c3f5b34874f11b0dc8f09d7669d4487f0b098bb019caaa338  01-basic-derived-id.json
0a9d409adfdffe67b3dbec61aa1a60f22120af36ffe5f4a9626ee8d32aaa4cf2  02-carried-id-mismatch.json
118f284a6b1b868001e0fee6c2bdc4102c4556ff0e7451cbcf7fbf28ead61322  03-sd-encoded-form.json
```

The values published on 30 August (`39b5b2aa…`, `63a62a0a…`, `8d6c26f1…`) were computed over a
Windows working tree carrying CRLF. They are correct for the bytes on that machine and reproduce
nowhere else.

**Labelled OBSERVED, as the 38 kats are.** All three declare `"algorithm": "jcs-n"`, the construction
§4.2 withdrew. We run them under `jcs`, substituting the live token in the payload class, and claim
nothing about applicability beyond what the kats measured.

---

## PART 1 — STRUCTURAL. Construction-independent behaviour.

**6 of 6 AGREE. Three of the six are external checks; three are not.**

**CORRECTED 2026-08-31. The 30 August document reported "6 of 6" and called it "the only external
check that exists anywhere for our §5 work". Three of those six rows compare this harness's own
hardcoded literals against this implementation, not against anything you pin.** The document made
that overstatement in the sentence where it mattered most, so the correction is stated before the
table rather than after it.

| # | vector | check | pinned by you? |
|---:|---|---|---|
| 1 | `derived-id-01` | exclusion of `["record_id"]` yields the vector's own `after_exclusion` object | **EXTERNAL** — you pin `after_exclusion` |
| 2 | `derived-id-01` | sealed record with a matching carried identifier verifies | ours — `"verified"` is our token |
| 3 | `derived-id-02` | carried-identifier mismatch is detected and reported as a defect | ours — you pin `failure_reason: "carried_id_mismatch"`, a different token, and pin no disposition |
| 4 | `derived-id-03` | exclusion of `["record_id"]` yields the vector's own `after_exclusion` object | **EXTERNAL** — you pin `after_exclusion` |
| 5 | `derived-id-03` | plaintext form refused when the class uses selective disclosure | ours — the vector carries neither `must_fail` nor `failure_reason`, so it pins no refusal expectation |
| 6 | `derived-id-03` | declared SD-encoded form is accepted and yields the vector's `derived_id` | **EXTERNAL** — you pin `derived_id` |

**Three rows are external. The document should have said three.**

A note on row 5, because it is sharper than the correction letter put it. That letter said
`03-sd-encoded-form.json` carries `must_fail: null` and `failure_reason: null`. Re-read from the blob
`118f284a…`: the file carries **neither key at all**. Its members are `id, description, algorithm,
payload_class, exclusion_set, spec_ref, sd_encoded_payload, plaintext_payload_for_reference,
after_exclusion, normalized, pre_image, pre_image_bytes_hex, derived_id, note`. The conclusion is the
same and slightly stronger: the vector pins no refusal expectation, so the refusal we report there is
our reading of §5 and not your requirement.

**Removal by deletion, confirmed externally.** The ambiguity log records under A5 the choice between
deleting an excluded member and nulling it, resolved from §5 line 737's "payload minus exclusion_set"
and Appendix A's Step 2. Your `after_exclusion` objects carry no `record_id` member at all, and ours
match them structurally. Under `jcs` the two readings give different digests, so this is a real
discrimination. **And it is now checked against payloads where it bites:**
`typed-refs/fail/01-digest-context-mismatch.json` and `typed-refs/fail/04-identifier-inconsistent-
with-context.json` each exclude a member holding the non-null string `"secret-id-123"`, and both
reproduce `0c837d01…` — see the vector results document. The three vectors
here all carry `record_id: null` and cannot discriminate deletion from nulling on their own.

**The SD precondition is asserted in both directions.** A precondition that only ever refuses is a
wall, not a control. Both rows are present: declaring `payloadForm: "sd-encoded"` lets the identifier
through, and to your own pinned value `033e6406b4162f6d975c152a3e696d95882b8c545692a425a6ccfe5b23456724`.

---

## PART 2 — DIGEST. Readable only where the two constructions provably agree.

**7 of 7 AGREE, and all 7 comparisons were readable.**

Readability is decided **mechanically**, by a predicate that walks the reduced payload for any member
the withdrawn pass would have removed — a JSON null, an empty array or an empty object — not by eye.
The kat run measured that `jcs` and `jcs-n` diverge on exactly those shapes and on nothing else across
the 29 comparable vectors. So a pinned `jcs-n` digest is comparable when no such member survives
exclusion, and is not comparable when one does. Each row states which case it is.

| vector | compared | result |
|---|---|---|
| `derived-id-01` | `pre_image`, `pre_image_bytes_hex`, `derived_id` | 3/3 AGREE |
| `derived-id-02` | `correct_derived_id` | 1/1 AGREE |
| `derived-id-03` | `pre_image`, `pre_image_bytes_hex`, `derived_id` | 3/3 AGREE |

No row was unreadable, so no comparison had to be withheld.

### Two statements of fact in the 30 August document that were false

**CORRECTED 2026-08-31, both re-read from the blobs for this document.**

1. **"All three payloads carry `record_id: null`."** They do not.
   `02-carried-id-mismatch.json` carries a **64-character string of zeroes**:
   `"0000000000000000000000000000000000000000000000000000000000000000"`. The conclusion drawn — that
   nothing normalizable survives exclusion in any of the three — still holds, because the member is
   excluded either way. The stated fact does not.

2. **"Each carries an `after_exclusion` and a `normalized` block, and in all three they are
   identical."** `02-carried-id-mismatch.json` carries **neither**. Its members are `id, description,
   algorithm, payload_class, exclusion_set, spec_ref, must_fail, failure_reason, full_payload,
   correct_derived_id, carried_id, note`. This matters more than the first, because that sentence was
   offered as the evidence for the readability predicate above. The predicate itself is sound and is
   computed per vector rather than argued; the sentence supporting it was not checked. The harness
   guards for the absence with an explicit conditional, so the code already knew what the prose
   asserted.

---

## THE EXTERNAL ANCHOR, AND THE PROOF IT IS ONE

`01-basic-derived-id.json` pins `derived_id`, and `02-carried-id-mismatch.json` pins the same value as
`correct_derived_id`:

```
1009a072df7fc0bfc6fcf49ca2f194067f6c0136c871a88d4fbd66a13361c1d1
```

**That is byte-identical to a value the implementation's own tests already carried**, computed from
the draft's Appendix A worked example with no vector in sight. It was labelled a regression pin and
said plainly that it proved nothing about conformance, because Appendix A stops at "the result is the
record_id value" and publishes no digest.

It is no longer only a regression pin. **Two implementations, working independently from the same
Appendix A walkthrough, produced the same derived identifier.**

**The ordering is recorded in commit history, not asserted here.** At the commit that froze the
implementation, `1886b405f31030c67a28e3c09fb09bc7446ffbe8`:

- searching the whole tree at that commit, the digest `1009a072` appears in exactly one file, as a
  constant named `APPENDIX_A_DIGEST`, labelled a regression pin and sourced to Appendix A;
- the only mention of `jcs-n/derived-id` anywhere at that commit is in the inventory table of the
  provenance document beside this one, which lists the directory and its three **filenames** and no
  file content;
- that commit is dated 2026-08-30T18:47:45Z, and the vector files were first opened after it.

So the pin was written from the draft, before the vector that confirms it was read. That ordering is
checkable with `git grep` against that commit by anyone holding it. **It is not published: those
commits are local, so the check cannot be run from a public clone today.** The commit can be provided
on request.

**What this anchor does and does not cover.** It anchors §5's composition — exclusion-set removal then
CANONICAL-DIGEST — on one payload class with a single-member exclusion set. It does not anchor §5.1
representation beyond the bare hex form, does not anchor §7.1 at all, and inherits the bound in §0 of
the ambiguity log: the JCS step is a vendored canonicalizer, not an independent implementation of RFC
8785.

---

## COVERAGE — what remains without any external vector

| still without any external vector | why |
|---|---|
| §7.1 leaf construction | searched all 77 `.json` under `vectors/` at `e0ad1c7`: no vector constructs a log leaf |
| §5.1 representation beyond bare hex | the raw and prefixed-text representations appear in no vector as a construction to reproduce; `fail/03` carries a prefixed instance as a MUST-FAIL, which exercises rejection and not production |
| §5's exclusion set over more than one field | every vector that pins a derived identifier declares exactly one excluded member |
| §5's carried identifier in a non-hex representation | -02 defines no encoding of raw octets into a JSON member (ambiguity log A14) |
| the SD encoding itself | -02 defers selective disclosure to a companion document (A10); the vector's `_sd` block is illustrative |

On that last row, stated because it bounds the result: `03-sd-encoded-form.json` carries
`"abc123hash_of_station_and_celsius_and_timestamp"` and `"def456hash_of_scope"` as its `_sd` entries.
Those are labels, not digests. The vector exercises **that the SD-encoded form is what gets digested**,
which is §5's actual requirement, and exercises no SD hashing — which is consistent, since -02 defines
none.

**One row of that table shrank since 30 August**, and it is worth saying by how much and how the
number was reached. §5's construction is now checked against **fifteen** vectors rather than three:
these three, kats 20 and 21, seven under `typed-refs/` and two under `profile-independence/`, in
sixteen payload objects carrying five distinct identifiers. The full table and both search methods are
in the vector results document.

That figure has been wrong four times, and each wrong figure came from a search scoped by an
assumption: one directory, then one member name, then one identifier value searched for in one
directory, then the same value searched for over the whole tree. The re-derivation on Linux on
3 September found twelve to be short by widening the search from one directory to the whole `vectors/`
tree. Widening it again, to a structural search that names no value at all, found one more that no
value search can reach: `typed-refs/fail/02` pins a different identifier entirely.

**Both searches, so either can be rerun.** Search 1, by value, over the whole tree:

```
git grep -l 0c837d01faa4106c63367f199af9bfa729d1917f36dc91f9dfeb6de6ec7c6bdb e0ad1c7 -- vectors
```

which returns nine files. Note `-- vectors` and not `-- vectors/typed-refs/`; scoping it to one
directory is what produced the count of twelve. Search 2, by structure, naming no value: for every
object anywhere in every JSON blob under `vectors/` carrying a 64-hex member named `derived_id`,
`recomputed_digest`, `correct_recomputed_digest`, `correct_derived_id_bare_hex` or
`correct_derived_id`, take every candidate payload object beside it, and one level inside those, and
try each against every exclusion set declared anywhere in the same file; recompute §5 and compare. That
returns fifteen files and sixteen payload objects. Neither search contains the other: search 1 finds
`profile-independence/fail/01`, which declares no exclusion set for search 2 to use, and search 2 finds
six files that pin one of the four other identifiers.

`typed-refs/fail/01` and `fail/04` are the two that close the deletion-versus-nulling question, each
excluding a member that holds the non-null string `"secret-id-123"`.

---

## CLAIM MANIFEST

**Recomputed in this run, from the bytes named:** the three blob digests; every digest, pre-image and
identifier in both tables; the member lists of all three vectors, read from their blobs; the
`record_id` value in `02-carried-id-mismatch.json`; the absence of `after_exclusion` and `normalized`
from that same file; the absence of `must_fail` and `failure_reason` from `03-sd-encoded-form.json`;
the readability predicate's verdict on each of the seven digest rows; the external/internal split of
the six structural rows, decided by reading which member each row compares against.

**Taken from you, as your figures:** every `after_exclusion` object, `pre_image`,
`pre_image_bytes_hex`, `derived_id`, `correct_derived_id` and `failure_reason` — these are yours, read
from your vectors, and this document compares against them rather than deriving them.

**Not established here:** that fifteen is final. It is what two searches find, one by value over the
whole tree and one by structure naming no value, and the second is the first search used here that is
scoped by neither a directory, a member name nor a value. A vector that reproduces §5 under a payload
member name nested deeper than one level, or under an identifier member name outside the five the
corpus uses, would still be invisible to it. That the Appendix A anchor is checkable by you today — the commit proving
the ordering is local and unpublished, and that is stated above rather than glossed. That the `jcs`
step conforms to RFC 8785. That §7.1 has any external check at all; it has none. That the three
non-external structural rows establish anything about your requirements — they establish only that
this implementation is self-consistent, and they are marked so they cannot be counted twice.

---

## Interests

Interests. The author of this grading authors draft-msebenzi-evidence-action, builds Chirindo, an operator-run gate that signs receipts of MCP calls, and maintains receipt-verify, the tool that produced this document. Those occupy the same ground as the formats graded here. Independence is not claimed. What is claimed is that every value in this document recomputes from pinned bytes by anyone with the tool or without it, that every scope is cited to the document that names it, and that text and implementation are scored separately, a rule that came from the author of one of the formats graded. Where a judgment call was made, it is marked as one.
