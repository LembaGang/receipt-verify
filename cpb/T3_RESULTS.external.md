# T3 — RESULTS
## Our independent implementation against the authors' vectors

Run 2026-08-30. Implementation frozen at commit `1886b405f31030c67a28e3c09fb09bc7446ffbe8` (T2) and
unchanged since: nothing under `cpb/` was modified after seeing a vector result. Harness:
`cpb/run-vectors.ts`. Gate: `test/cpb/vectors.test.ts`.

**Their side, pinned.** Repository `action-state-group/scitt-payload-binding` at commit
`e0ad1c7e0b0248b9aed25c747f174548cb8e141d`, working tree clean (`git status --porcelain` empty) —
the clone has not moved since T1 pinned it.

| set | manifest digest (sha256 over `sha256sum` of the sorted file list) |
|---|---|
| `vectors/subject-binding-diff/diff-*.json` (4 files) | `1b5e59021418313126e1899b0925ef9ea8bdd4733c4ae240b09adf7e0bb14601` |
| `vectors/jcs-n/kats/*.json` (38 files) | `f0356222d92877e330b49936fc3d849af1aba2e78623dce1baced9b257192fcc` |

Individual vector digests, `vectors/subject-binding-diff/`:

```
abe763277cdbd3081893c0a6b58d2edcf540b27bfe39f236269843682652a783  diff-01-null-member.json
e7a5594fe9ff6866c846e5c38450c19181adce5641f0048bc575aa5d38663a01  diff-02-empty-object-member.json
42dbe79d2603f977aab83357fa5d00ddef614057820847cc4498b3716c0e703d  diff-03-empty-array-member.json
f983698821d1c0ca6fc3fbfafbb8611990cb45f44560af66b06bf859274b4845  diff-04-float-member.json
```

Constraint held: this run reads vector JSON only. No file under `lib/` was opened, and the authors'
own Python harness was neither read nor invoked.

---

## 1. PRIMARY — the live registered `jcs` construction

`vectors/subject-binding-diff/`, four vectors, four comparisons each.

### **16 of 16 AGREE. 0 DISAGREE.**

Byte-level, not digest-only: each vector is compared on the canonical pre-image as text, on the
pre-image as hex octets, and on the digest — so an agreement here is agreement on the bytes entering
SHA-256, which is what §12.1 says the comparison has to be.

| vector | diverging member | pre-image | pre-image bytes | digest | direction check |
|---|---|---|---|---|---|
| `subject-binding-diff-01` | `"notes": null` | AGREE | AGREE | AGREE `cb4c539a…52604` | AGREE (differs from `jcs_n`) |
| `subject-binding-diff-02` | `"tags": {}` | AGREE | AGREE | AGREE `0fdd1225…93335` | AGREE (differs from `jcs_n`) |
| `subject-binding-diff-03` | `"tags": []` | AGREE | AGREE | AGREE `6cbef10f…daae03` | AGREE (differs from `jcs_n`) |
| `subject-binding-diff-04` | `"confidence": 0.95` | AGREE | AGREE | AGREE `0fa3ccae…f2a19` | AGREE (jcs-n never verifiable) |

Full expected/ours values are in the harness output; every one of the 16 was string-equal.

**The direction checks, which are the both-direction MUST-FAIL cases.**

- **Direction A** (`diff-01/02/03`): the passing condition is *inequality* — our `jcs` digest must
  differ from the vector's pinned `jcs_n` digest. All three differ. The divergence is computed on
  each run, not asserted in a comment.
- **Direction B** (`diff-04`, flagged `jcs_n_must_fail: true`): the must-fail side belongs to jcs-n,
  which this implementation does not implement. What was asserted, and all that is claimed, is that
  our §4/§4.2 admission never returns a verifiable result for the `jcs-n` token under any of the
  three vintage branches — post-withdrawal, pre-withdrawal, and vintage unknown — giving
  `failed / unverified / unverified`. **This is not an implementation of jcs-n's float prohibition
  and is not evidence about it.** It is fail-closed admission of a withdrawn token.

### The red-proof — what would have turned this red

A green table proves nothing until the concrete input that reddens it is named and run. It was.

`canonicalDigestJcs` was mutated to strip members whose value is JSON null, an empty array or an
empty object — that is, to emulate the withdrawn `jcs-n` normalization pass. Result:

- **12 of 16 rows went DISAGREE**, harness exit code 12.
- `diff-01`'s digest became `163468697dd1eca263fef4dc5311a0711eb32b8fcc4083b6447973b7f5b42a5d`, which
  is exactly the vector's pinned `jcs_n` digest — the construction collapse the vectors exist to
  detect, detected.
- All three Direction A rows flipped from `differs` to `identical`.
- The 4 rows that stayed green were `diff-04`'s, whose action carries no null or empty member and is
  therefore untouched by that mutation — which is the vectors' own Direction A/B split, reproduced.
- The mutation was reverted and the file `cmp`-verified byte-identical; the run returns to 16/16.

The gate in `test/cpb/vectors.test.ts` was red-proofed by the same mutation: both PRIMARY tests fail
under it and pass after revert.

**What 16/16 does not establish.** It covers §4.1 only. These four vectors declare no exclusion set,
so the run never reaches §5's removal step, never constructs a derived identifier, never exercises
§5.1 representation, and never builds a §7.1 leaf input. The four inputs are flat three-member
objects of strings, one null, one empty object, one empty array, one float. Nothing here exercises
nesting, key-sort edge cases, control characters, NFC boundaries, large integers, or duplicate keys.
And per `cpb/AMBIGUITY_LOG.md` §0, the JCS step itself comes from the vendored canonicalizer, so this
is agreement between two independently written **CPB constructions** over a JCS implementation whose
independence this exercise does not establish.

---

## 2. OBSERVED — our `jcs` against the historical `jcs-n` suite

`vectors/jcs-n/kats/`, all 38. **Not a conformance result, and no claim of applicability is made.**
These vectors declare `"algorithm": "jcs-n"`, the construction §4.2 withdrew on 2026-08-18 and which
this implementation does not implement. The number below measures how much of the historical suite
is construction-independent — a fact about two constructions, not about our conformance to anything.

**38 vectors = 2 N/A + 11 pinned MUST-FAIL + 25 pinned with a digest.**
**Of the 25 carrying a pinned digest, 19 produce the same bytes under our `jcs` and 6 do not.**

Counted in disjoint buckets deliberately. A single "N of 38 agree" ratio folds the N/A rows and the
jcs-n MUST-FAIL rows into a numerator and reports agreement this run did not establish — an earlier
version of this harness printed exactly that, "21/38 same bytes", and the number was wrong.

### The 6 with a pinned digest that differ — characterised by input shape

Every one carries a member the withdrawn normalization pass removed and `jcs` retains. That is the
whole of the difference; no other input shape in the 25 diverges.

| vector | shape |
|---|---|
| `02-null-removed.json` | top-level member whose value is JSON null |
| `03-empty-array-removed.json` | top-level member whose value is an empty array |
| `04-empty-object-removed.json` | top-level member whose value is an empty object |
| `06-nested-null-bottom-up.json` | null member nested inside a member's value |
| `07-nested-empty-array-bottom-up.json` | empty array nested inside a member's value |
| `14-nested-array-normalization.json` | normalizable member inside an array element |

### The 11 pinned MUST-FAIL — our `jcs` produced a digest for all 11

Under `jcs` as §4.1 defines it these are not failures, because §4.1 line 594 says jcs "places no
additional restriction on JSON numbers beyond RFC 8785" and states no prohibition of its own. Listed
with the reason each vector pins:

`float_in_digest_bearing_field` (10, 15, 32) · `nfc_normalisation_deviation` (13) ·
`unsafe_integer_in_digest_bearing_field` (16) · `integer_formatting_divergence` (17) ·
`string_escape_uppercase_hex` (27) · `string_escape_long_form_for_named_char` (28) ·
`key_sort_by_escaped_bytes_not_code_units` (29) · `invalid_wire_number_token` (35, negative zero) ·
`duplicate_key` (37).

**One of these is worth the authors' attention, and it is about us, not them.** `37-must-fail-duplicate-key.json`
carries the literal input `{"a": 1, "a": 2}`. `JSON.parse` silently keeps the last member, so our
harness digested `{"a":2}` and produced a value. That is the gap `cpb/AMBIGUITY_LOG.md` A1 records
in advance: searched §4, §4.1, §5, §5.1, §7 and §7.1 of the -02 text, none of those six sections
states a duplicate-key rule, so our implementation states none either, and a standard parser
resolves the question before any rule could see it. The vector demonstrates the consequence.

### The 2 marked N/A

`20-must-fail-identifier-trailing-newline.json` and `21-must-fail-identifier-surrounding-whitespace.json`
carry **no canonicalization input at all**. Enumerated: all 38 files read, 36 carry an `input`
member and these 2 do not — they carry `cited_artifact` and
`typed_reference_with_wrong_representation` instead, and pin an identifier-*grammar* failure rather
than a canonicalization one. There is nothing to canonicalize, so they are reported as their own
bucket and never as agreement.

A first version of this harness read the absent `input` and reported our value boundary refusing
`undefined`, which said nothing about either implementation. The harness was corrected; the
implementation was not touched.

---

## 3. SUPPLEMENTARY — §5.1 identifier grammar, on those two vectors

Reported outside both counts above. kat-20 and kat-21 are not canonicalization cases: each pins an
identifier string that must be rejected on its grammar, and §5.1 is a rule this implementation does
have. Both are MUST-FAIL, so the passing condition is refusal.

| vector | pinned identifier | pinned reason | our §5.1 decoder |
|---|---|---|---|
| `jcs-n-kat-20` | 65 characters, trailing U+000A | `representation_mismatch_trailing_newline` | refused — `identifier_wrong_length` |
| `jcs-n-kat-21` | 66 characters, space-padded both ends | `representation_mismatch_surrounding_whitespace` | refused — `identifier_wrong_length` |

**2 of 2 refused, as the vectors require.** Claimed as nothing more than that: these vectors declare
the withdrawn algorithm, and §5.1's representation rule is not the same rule as jcs-n's identifier
grammar. Our refusal happens to land on the same side.

---

## 4. COVERAGE MANIFEST — what this run did NOT establish

Carried with the results, including on agreement.

### Not run: 35 of the 77 `.json` vectors under `vectors/`

**77 = 4 PRIMARY + 38 OBSERVED + 35 not run.** Enumerated over all 77 at `e0ad1c7`, by directory,
with the reason for each — stated rather than left to inference.

| not run | count | declares | reason |
|---|---:|---|---|
| `cpb-check/conforming` + `cpb-check/non-conforming` | 13 | no top-level algorithm | wire-layer grammar checker; §2 scopes `cpb-check` to grammar and duplicate-key rejection, which is not §4.1, §5 or §7.1 |
| `typed-refs/fail` + `typed-refs/pass` | 8 | no top-level algorithm | §8 typed digest references, not implemented — T2 checked that neither §5 (lines 733-798) nor §7.1 (lines 859-883) cites §8 |
| `registry/` | 4 | no top-level algorithm | registry snapshot lookup and `id-unknown-to-snapshot` verdicts; not one of the three sections |
| `profile-independence/pass` + `/fail` | 2 | no top-level algorithm | §9, which resolves through §8 typed references |
| `jcs-n/derived-id` | 3 | `jcs-n` | declares the withdrawn construction; the observation run covered the 38 `jcs-n/kats` vectors and did not cover these three |
| `jcs-n/assembled-preimage` | 2 | `jcs-n` | same |
| `domain-transforms/pass` + `/fail` | 2 | `jcs-n` | same |
| `multimodal/pass` | 1 | `jcs-n` | same |

**The 31 vectors declaring no top-level algorithm, enumerated.** Re-derived from the files at
`e0ad1c7`: the 31 are `cpb-check` (13), `typed-refs` (8), `registry` (4), `profile-independence`
(2) — **and `subject-binding-diff` (4)**, which is the PRIMARY set itself. `domain-transforms` (2)
and `multimodal` (1) are not in that 31; they declare `jcs-n` and belong to the 46. Everything but
the live set and the 38 kats is out of scope for §4.1, §5 and §7.1.

**Identified but not run in this pass.** `jcs-n/derived-id/` holds `01-basic-derived-id`,
`02-carried-id-mismatch` and `03-sd-encoded-form`. Searched all 77 `.json` under `vectors/` at
`e0ad1c7`: those three are the only vectors that exercise §5's derived-identifier construction —
including the carried-identifier mismatch and the SD-encoded form, the two §5 obligations this
implementation covers and which PRIMARY never reaches. They declare `jcs-n`, and this pass did not
run them.

**Not established by the PRIMARY result**, in one place:

| not covered | why |
|---|---|
| §5 exclusion-set removal | the four vectors declare no exclusion set |
| §5 carried-identifier recompute and mismatch | no vector carries a derived identifier |
| §5.1 representation discipline in a live comparison | covered only by our own §4.1-anchored tests and the supplementary check |
| §7.1 leaf input | no vector in the suite constructs a log leaf |
| RFC 8785 conformance | inherited from the vendored canonicalizer, not derived this session |
| duplicate keys, non-finite numbers, host values | no rule in -02 §4.1/§5/§5.1/§7/§7.1; our boundary decisions are documented choices, not conformance |
| the withdrawn `jcs-n` construction | deliberately not implemented; its definition is in -00 §3.1 |
| `as-transmitted` (§4.4) | registered and live, declined as outside the three sections |

**Expiry.** Every claim above is true of their commit `e0ad1c7` and of our commit `1886b40`. The
manifest digests in the header are the re-check: recompute them against a later clone, and a changed
value means a vector moved and this table needs rerunning, not reinterpreting.

---

# APPENDED 2026-08-30

**Supersede, never edit: the section above stands as written. This narrows one claim in it.**

The red-proof described above was performed by editing `cpb/canonical-digest.ts` by hand, running,
and reverting. That proved the point for one person on one afternoon and left nothing a third party
could re-derive — the same defect class as a prose ambiguity log.

**The mutations are now shipped and run on every invocation.** `cpb/mutants.ts` carries six named
wrong constructions; `runSubjectBindingDiff` takes the digest function as a parameter, defaulting to
the real `canonicalDigestJcs`; and the harness runs all four PRIMARY vectors against every mutant
beside the real implementation:

```
M1-collapse-to-jcs-n               DETECTED  12/16 rows red
M2-strip-null-members-only         DETECTED   4/16 rows red
M3-strip-empty-members-only        DETECTED   8/16 rows red
M4-serialize-with-json-stringify   DETECTED  12/16 rows red
M5-uppercase-hex-output            DETECTED   4/16 rows red
M6-strip-nested-nulls-only         NOT DETECTED by these four vectors
```

M1 reproduces the hand edit numerically — 12/16 red, and diff-01 collapsing to
`163468697dd1eca263fef4dc5311a0711eb32b8fcc4083b6447973b7f5b42a5d`. That equality is **checked, not
narrated**: the harness reads the `jcs_n` digest their own vector pins and asserts the collapse lands
on it, and a failure raises the exit code.

M6 is shipped deliberately undetected. A wrong construction these four vectors cannot see is a
statement about the vector set's reach, and it belongs beside the agreement count rather than
omitted from it.

**What a shipped mutant proves, stated precisely.** These are injected at the harness's seam, not by
editing the module, so a mutant proves that THE VECTOR COMPARISON DISCRIMINATES between the correct
construction and this wrong one. The equivalence to an in-place edit is established numerically for
M1 by the row count and the collapsed digest matching what the hand edit produced.

See also `cpb/T3B_RESULTS.md` for the three `jcs-n/derived-id` vectors, authorised after this run.
