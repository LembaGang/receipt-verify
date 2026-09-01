# DERIVED-IDENTIFIER VECTOR RESULTS
## `vectors/jcs-n/derived-id/`, the only external vectors that exercise §5

Run 2026-08-30. Implementation still frozen at
`1886b405f31030c67a28e3c09fb09bc7446ffbe8` and verified byte-identical across all six modules after
this run. Their side pinned at `e0ad1c7e0b0248b9aed25c747f174548cb8e141d`, clone clean.

```
39b5b2aacfa13a11a877f72ff222508c76a49f62c2611125691829ef814193d5  01-basic-derived-id.json
63a62a0a7a34d01d207ae67a566abe0881cfc0cf864a5aa8f3509a7a66908b23  02-carried-id-mismatch.json
8d6c26f133271616a7f8dafc4eb749f30e31c33429e4a5535f0f17789f972bf0  03-sd-encoded-form.json
```

**Labelled OBSERVED, exactly as the 38 kats were.** All three declare `"algorithm": "jcs-n"`, the
construction §4.2 withdrew, and cite `draft-mih-sokolov-scitt-payload-binding-00 §4`. We run them
under `jcs`, substituting the live token in the payload class, and claim nothing about applicability
beyond what the 38 measured.

Why PRIMARY could not cover this: the four subject-binding-diff vectors declare no exclusion set, so
that run never reaches §5's removal step, never builds a derived identifier, and never exercises the
carried-identifier or SD obligations. Searched all 77 `.json` under `vectors/` at `e0ad1c7`: these
three are the only ones that do.

---

## PART 1 — STRUCTURAL. Construction-independent behaviour.

**6 of 6 AGREE.**

This is the only external check that exists anywhere for our §5 work. None of it depends on which
canonicalization algorithm runs underneath: whether a member is deleted rather than nulled, whether
a mismatch is detected, and whether a precondition holds are the same questions under `jcs` and
under the withdrawn `jcs-n`.

| vector | check | expected | ours |
|---|---|---|---|
| `derived-id-01` | exclusion of `["record_id"]` yields the vector's own `after_exclusion` object | `{"station_id":"WS-42","timestamp":"2026-07-24T00:00:00Z","celsius":"21.3"}` | identical — AGREE |
| `derived-id-01` | sealed record with a matching carried identifier verifies | `verified` | `verified` — AGREE |
| `derived-id-02` | carried-identifier mismatch is detected and reported as a defect | `carried_identifier_mismatch / failed` | `carried_identifier_mismatch / failed` — AGREE |
| `derived-id-03` | exclusion of `["record_id"]` yields the vector's own `after_exclusion` object | `{"_sd":[…],"_sd_alg":"sha-256","action":"write"}` | identical — AGREE |
| `derived-id-03` | plaintext form refused when the class uses selective disclosure | refused (`sd_encoded_form_required`) | refused (`sd_encoded_form_required`) — AGREE |
| `derived-id-03` | declared SD-encoded form is **accepted** and yields the vector's `derived_id` | `033e6406b4162f6d975c152a3e696d95882b8c545692a425a6ccfe5b23456724` | same — AGREE |

**Removal by deletion, confirmed externally.** AMBIGUITY_LOG A5 recorded the choice between deleting
an excluded member and nulling it, resolved from §5 line 737's "payload minus exclusion_set" and
Appendix A's Step 2. Their `after_exclusion` object carries no `record_id` member at all, and ours
matches it structurally. Under `jcs` the two readings give different digests, so this is a real
discrimination, not a formality.

**The SD precondition is asserted in both directions.** A precondition that only ever refuses is a
wall, not a control. The refusal row and the acceptance row are both present: declaring
`payloadForm: "sd-encoded"` lets the identifier through, and to the vector's own pinned value.

---

## PART 2 — DIGEST. Readable only where the two constructions provably agree.

**7 of 7 AGREE, and all 7 comparisons were readable.**

Readability is decided **mechanically**, by a predicate that walks the reduced payload for any
member the withdrawn pass would have removed, not
by eye. The 38-kat run measured that `jcs` and `jcs-n` diverge on exactly one thing — a member whose
value is JSON null, an empty array or an empty object — and on nothing else across the 25 vectors
carrying a pinned digest. So a pinned `jcs-n` digest is comparable when no such member survives
exclusion, and is not comparable when one does. Each row states which case it is and the harness
computes it per vector.

All three payloads carry `record_id: null`, and in all three the exclusion set removes it. Nothing
normalizable survives. **The vectors say the same thing in their own bytes: each carries an
`after_exclusion` and a `normalized` block, and in all three they are identical** — the withdrawn
normalization pass had nothing to do on these inputs.

| vector | compared | result |
|---|---|---|
| `derived-id-01` | `pre_image`, `pre_image_bytes_hex`, `derived_id` | 3/3 AGREE |
| `derived-id-02` | `correct_derived_id` | 1/1 AGREE |
| `derived-id-03` | `pre_image`, `pre_image_bytes_hex`, `derived_id` | 3/3 AGREE |

No row was unreadable, so no comparison had to be withheld. Had any row carried a surviving null or
empty member, it would have been reported as a divergence attributable to the construction
difference the 38 already measured, and to nothing else.

---

## THE EXTERNAL ANCHOR, AND THE PROOF IT IS ONE

`01-basic-derived-id.json` pins `derived_id`:

```
1009a072df7fc0bfc6fcf49ca2f194067f6c0136c871a88d4fbd66a13361c1d1
```

`02-carried-id-mismatch.json` pins the same value as `correct_derived_id`.

**That is byte-identical to the value the implementation's own tests already carried**, computed from the draft's
Appendix A worked example with no vector in sight. It was labelled a REGRESSION PIN and said plainly
that it proved nothing about conformance, because Appendix A stops at "the result is the record_id
value" and publishes no digest.

It is no longer only a regression pin. Two implementations, working independently from the same
Appendix A walkthrough, produced the same derived identifier.

**The ordering is recorded in commit history, not asserted here.** At commit `1886b40`:

- searched the whole tree at that commit, the digest `1009a072` appears in exactly one file —
  `test/cpb/construction.test.ts:59`, as `APPENDIX_A_DIGEST`, labelled REGRESSION PIN and sourced to
  Appendix A;
- the only mention of `jcs-n/derived-id` anywhere at that commit is at line 85 of the provenance
  file — `cpb/PROVENANCE_T1.md` as it is named in that tree, delivered here as
  `cpb-provenance.md` — the inventory table, which lists the directory and its three **filenames**
  and no file content;
- `1886b40` is dated 2026-08-30T18:47:45Z, and the vector files were first opened after it.

So the pin was written from the draft, before the vector that confirms it was read. That ordering is
checkable with `git grep` against `1886b40` by anyone holding the commit. It is not published: these
commits are local at the time of writing, so the check cannot be run from a public clone today. The
commit can be provided on request.

**What this anchor does and does not cover.** It anchors §5's composition — exclusion-set removal
then CANONICAL-DIGEST — on one payload class with a single-member exclusion set. It does not anchor
§5.1 representation beyond the bare hex form, does not anchor §7.1 at all, and inherits the bound in
`cpb-ambiguity-log.md` §0: the JCS step is the vendored canonicalizer, not an independent
implementation of RFC 8785.

---

## COVERAGE — what this run leaves unestablished

| still without any external vector | why |
|---|---|
| §7.1 leaf construction | searched all 77 `.json` under `vectors/` at `e0ad1c7`: no vector constructs a log leaf |
| §5.1 representation, beyond bare hex | the raw and prefixed-text representations appear in no vector; `prefixed-text` is undefined in -02 (AMBIGUITY_LOG A11) |
| §5's exclusion set over more than one field | all three vectors declare `["record_id"]` |
| §5's carried identifier in a non-hex representation | AMBIGUITY_LOG A14: -02 defines no encoding of raw octets into a JSON member |
| the SD encoding itself | AMBIGUITY_LOG A10: -02 defers selective disclosure to a companion document; the vector's `_sd` block is illustrative, its hashes are placeholder strings |

On that last row, stated because it bounds the result: `03-sd-encoded-form.json` carries
`"abc123hash_of_station_and_celsius_and_timestamp"` and `"def456hash_of_scope"` as its `_sd`
entries. Those are labels, not digests. The vector exercises **that the SD-encoded form is what gets
digested**, which is §5's actual requirement, and does not exercise any SD hashing — which is
consistent, since -02 defines none.


---

# APPENDED 2026-09-01 — CORRECTIONS ISSUED TO THE AUTHORS ON 2026-08-31

**Supersede, never edit. Everything above stands as written and remains a true record of what was
observed on 2026-08-30. This block records what was found to be wrong in it, and what the corrected
values are. Each item was sent to Anton Sokolov and Steven Mih in writing on 2026-08-31 before it was
recorded here.**

The general cause of the largest group below is one defect repeated: digests were computed over a
**working tree** on Windows carrying CRLF line endings, and published as though they pinned the
repository. A clone on Linux or macOS yields LF and different digests. The content-addressed value —
`git cat-file blob <commit>:<path> | sha256sum` — is what should have been published, and is what a
reader should use. Verified 2026-09-01: all 77 vector files differ in bytes between the two
checkouts and all 77 parse to identical values, so **no measured result depends on this**; what was
defective is the provenance layer, whose only job is to let a reader check the rest.

### 1. The three per-file digests are working-tree (CRLF) values
Published above: `39b5b2aacfa13a11…`, `63a62a0a7a34d01d…`, `8d6c26f133271616…`.
**Correct (git blob digests at `e0ad1c7`):**
```
9e3cce8269062b2c3f5b34874f11b0dc8f09d7669d4487f0b098bb019caaa338  01-basic-derived-id.json
0a9d409adfdffe67b3dbec61aa1a60f22120af36ffe5f4a9626ee8d32aaa4cf2  02-carried-id-mismatch.json
118f284a6b1b868001e0fee6c2bdc4102c4556ff0e7451cbcf7fbf28ead61322  03-sd-encoded-form.json
```

### 2. "All three payloads carry `record_id: null`" is false
`02-carried-id-mismatch.json` carries a 64-character string of zeroes, not null. The conclusion drawn
from it still holds; the stated fact does not.

### 3. "Each carries an `after_exclusion` and a `normalized` block" is false
`02-carried-id-mismatch.json` carries **neither**. Its keys are `id, description, algorithm,
payload_class, exclusion_set, spec_ref, must_fail, failure_reason, full_payload, correct_derived_id,
carried_id, note`. `runDerivedId` in `cpb/run-vectors.ts` guards with
`if (v.after_exclusion !== undefined)`, so the code already knew what the prose asserted. This
sentence is the evidence offered for the readability predicate, so it is not cosmetic.

### 4. "6 of 6 AGREE" overstates the external check
Three of those six rows compare this harness's own hardcoded literals against this implementation,
not against anything the vectors pin: `"verified"`; `"carried_identifier_mismatch / failed"` (the
vector pins `failure_reason: "carried_id_mismatch"`, a different token, and pins no disposition); and
`"refused (sd_encoded_form_required)"` (`03-sd-encoded-form.json` has `must_fail: null` and
`failure_reason: null` — it pins no refusal expectation at all). **Three rows are external.** The
document calls this "the only external check that exists anywhere for our §5 work", which makes the
overstatement material.

### 5. These are not the only vectors exercising §5
Seven do, not three. See `cpb/T3_RESULTS.md`, appended block, item 6.
