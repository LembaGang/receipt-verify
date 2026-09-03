# AMBIGUITY LOG
## Implementing §4.1, §5 (with §5.1) and §7.1 of draft-mih-sokolov-scitt-payload-binding-02 from the text alone

Source: `refs/draft-mih-sokolov-scitt-payload-binding-02.txt`, sha256
`47ab675797d7edfe905c13b8482735239d9c5ceb318accbc33e4a5a51e5ec875`, 92428 bytes, 2072 lines. Line
numbers below index that file. Every quotation was copied from a fresh read of those bytes in the
same session as this write.

**What was NOT read, stated so a reader can bound the independence claim.** No file under `lib/` of
the authors' repository was entered, listed, opened or grepped. No Python source of theirs was
opened. No third-party implementation was consulted.
`vectors/CANONICALIZATION_DECLARATION.md` and `vectors/README.md` were not opened at any point.
`vectors/subject-binding-diff/README.md` was not opened until after this implementation was frozen
and committed. RFC 8785 itself was not fetched or read this session — see the bound in §0 below.

Each entry gives: the readings the text admitted, the one taken, and the sentence that forced it.
Where no sentence forces it, the entry says so — that is the finding.

**Issued 2026-09-03. This document replaces the one sent on 2026-08-30.** Four entries changed, and
the corrections were sent to Anton Sokolov and Steven Mih in writing on 2026-08-31 before this was
written: A1's duplicate-key conclusion (wrong, and the rule exists by delegation), A11's
characterisation of the prefixed representation (overstated, and the corrected form is narrower and
more useful), one "Checked:" sentence that is simply false, and the README signpost finding, which was
true when made and needed an expiry stamp it did not carry. Each is marked **CORRECTED 2026-08-31**
where it appears. No other entry is altered, softened or renumbered.

---

## §0. THE BOUND ON THIS IMPLEMENTATION'S INDEPENDENCE

This is an independent implementation of the **CPB construction layer** — exclusion-set removal,
digest, encoding, representation discipline, algorithm admission, leaf input. It is **not** an
independent implementation of JCS. §4.1 step 1 delegates to [RFC8785]. The vendored canonicalizer
already in this repository (`@headlessoracle/chirindo` 0.4.0, `dist/vendor/recorder/index.js`) was
reused deliberately, rather than adding a second JCS implementation. So the JCS bytes come from code
this exercise did not write and did not derive from RFC 8785 in this session.

Any byte-agreement result inherits that bound and the coverage manifest must carry it: agreement
would evidence that two independently written **CPB constructions** agree, over a JCS step whose
independence is not established by this exercise.

---

## §4.1 — ALGORITHM jcs

### A1. Does the algorithm consume octets or a parsed value?
**Readings.** (i) The algorithm's input is a JSON *text*, and parsing is inside the algorithm.
(ii) The algorithm's input is a parsed JSON *value*, and parsing happens before it.

**Taken: (ii).** The implementation's entry points take a JSON value. The octets-to-value step is the
caller's.

**The sentence that forced it** — §4.1 step 1, lines 574-578, is itself the tension:

> 1.  Apply JCS [RFC8785] to the octets supplied to the algorithm, to
>     produce the canonical UTF-8 octet string.  Exclusion-set removal
>     is not part of this algorithm: the derived identifier
>     construction (Section 5) removes the payload class's declared
>     exclusion set before invoking the algorithm.

The first clause says octets; the third says §5 removes members *before invoking the algorithm*.
Member removal is an operation on a parsed value, so whatever §5 hands the algorithm is no longer
the octets the payload arrived as. §3's definition agrees with (ii) — line 469, "for any such
algorithm A and payload v" — and Appendix A Step 2 (lines 1688-1692) shows the intermediate as a
JSON object, not a byte string.

**What this leaves open, and it is a finding.** Two behaviours that only a text-level reading can
fix fall outside the algorithm as -02 defines it:
- **Duplicate keys. CORRECTED 2026-08-31 — the search was accurate and the conclusion drawn from it
  was wrong.** Searched §4, §4.1, §5, §5.1, §7 and §7.1 of the -02 text: none of those six sections
  states a duplicate-key rule, and the only occurrences of "duplicate" in the whole 2072-line file are
  lines 417-424, in §2's change log describing the separate `cpb-check` grammar checker, which §2
  scopes to the "grammar/wire-layer". All of that is true. The conclusion that this implementation
  therefore states no duplicate-key rule either is not.

  **The rule exists, by delegation.** §4.1 step 1 delegates to [RFC8785], and the registry entry for
  `jcs` gives its Reference as **RFC 8785 Section 3**. **RFC 8785 §3.1** requires that the data be
  adapted for I-JSON formatting and states that JSON objects **MUST NOT** exhibit duplicate property
  names. **RFC 7493 §2.3** states it again. And `vectors/jcs-n/kats/37-must-fail-duplicate-key.json`
  says it a third time, in its own description: "explicit departure from RFC 8785 §3.1
  preserve-as-is". Three artefacts held during this exercise contradicted the conclusion.

  The root cause is recorded in §0: **RFC 8785 itself was not read during that session.** A negative
  about a delegating specification was drawn without searching the document it delegates to. Naming
  that limit did not license a conclusion that required having read it. The implementation now refuses
  a duplicate member name at the octet layer, before any object exists, with a reason naming both
  RFCs.

  **The finding survives in a better form, and it is not ours alone.** An independent implementer
  building a separate consuming implementation made the identical error in the same week and corrected
  it publicly, having also parsed before walking the text. Two implementers, two languages, working
  independently, both reaching for an ordinary JSON parser and both producing a value where RFC 8785
  requires a refusal, is a far stronger argument that §4.1 should name its refusal set explicitly than
  either party observing that the text is silent — because it is **not** silent, and both missed it
  anyway. An implementer who must traverse CPB to RFC 8785 to RFC 7493 to learn that duplicate names
  are refused is an implementer who will not traverse it, and the evidence for that is the two of us.
  One sentence in §4.1 naming what is refused rather than canonicalized would close it.
- **Numeric literal parsing.** §12.3 (lines 1192-1210) is explicit that the determinism guarantee
  "is bounded by parsing, not by canonicalization". With parsing outside the algorithm, that bound
  is outside this implementation too.

### A2. Where does the top-level-only rule live?
The rule is stated in §4.1 (lines 590-592) — "The exclusion set is matched against the top-level
member names of P only" — while §4.1's own step 1 says exclusion-set removal "is not part of this
algorithm". So a constraint on an operation is stated inside the section that disclaims the
operation. **Taken:** the operation is implemented in §5's code path (`applyExclusionSet`) and
honours §4.1's scope rule. No behavioural consequence; recorded because a reader implementing §5
from §5 alone would not find the rule.

**External check, found 2026-09-03.** `jcs-n/kats/22-exclusion-depth-top-level-only` pins the
identifier of a payload whose excluded member also occurs below the top level; its description
records it as a falsification vector proposed in review to fork a recursive-stripping
implementation. This implementation reproduces its identifier; a recursive-stripping mutant does not
(the mutant is named `X1-strip-excluded-at-every-depth` and the test that runs it is named
"kat-22 is reproduced by the shipped rule and NOT by the recursive mutant"). A2 therefore has an
external check and the earlier sentence that it had none is withdrawn.

Two further things that check confirmed, both worth having. The rule **does** have a behavioural
consequence, and the sentence above saying it has none is withdrawn with the other: the two readings
of the same exclusion set produce different identifiers on this payload. And kat-22 is the **only**
vector in the corpus that can tell them apart. Kats 08 and 09 declare the same `{id}` exclusion set
over payloads whose excluded member occurs only at the top level, so both readings give identical
bytes there; a test asserts that, so if another discriminating vector is ever added the claim that
kat-22 stands alone will go red rather than quietly stay in the text.

**One observation for the authors, on kat-22's own note.** That note predicts a recursive
implementation would produce `44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a`,
which is SHA-256 of `{}`. That is correct under `jcs-n`, where the normalization pass then removes
the emptied `sub` object. Under the live `jcs` construction there is no normalization pass, so `sub`
survives as an empty object, the pre-image is `{"sub":{}}` and the wrong reading forks to
`f68308d4e5bde0822675e52d656d5c46af2ba15adadad2abee2fc33709ccccb1` instead. The vector still
discriminates, which is what it was built to do, and it discriminates under both constructions. Only
the specific value in its note is `jcs-n`-specific.

### A3. Non-finite numbers and non-JSON host values.
**No sentence in §4.1, §5, §5.1, §7 or §7.1 states a rule for `Infinity`, `-Infinity`, `NaN`, or for
a host value that is not a JSON value** (searched: those five sections). §4.1 line 594 says jcs
"places no additional restriction on JSON numbers beyond RFC 8785", and none of the three has
an RFC 8259 JSON literal, so they can only arrive from a host value.

**Taken:** refuse them at the boundary, with reasons `payload_non_finite_number` and
`payload_not_json`. The reason is empirical, not textual: probed against the vendored canonicalizer,
`{a: undefined, b: 1}` canonicalizes to `{"b":1}` and `{a: new Date(0)}` to
`{"a":"1970-01-01T00:00:00.000Z"}`. Both are silent substitutions of a different pre-image — the
failure §12.1 names at lines 1168-1170, "the byte sequence entering SHA-256 [must be] identical to
what the canonicalization algorithm produces, not what a deserializer happens to emit". Refusing is
the fail-closed reading; the draft does not require it.

### A4. Negative zero. (Observation, not a choice.)
§4.1 places no restriction beyond RFC 8785, and the vendored canonicalizer renders `-0` as `0`. A
payload carrying `-0` and one carrying `0` therefore have the same derived identifier under `jcs`.
Recorded because the historical suite carries a `must-fail-negative-zero` case for the withdrawn
construction; under `jcs` as §4.1 defines it, no sentence in §4.1 or §5 makes `-0` a failure.

---

## §5 — THE DERIVED IDENTIFIER

### A5. Does the exclusion set remove the member, or null it?
**Readings.** (i) Delete the member. (ii) Set its value to JSON null.

Under `jcs` this is not cosmetic: §4.1 lines 568-569 say "no member is removed because its
value is JSON null", so a nulled member survives into the pre-image and (ii) yields a different
digest from (i).

**Taken: (i), deletion.** **The sentence that forced it** is §5 line 737, whose formula reads
`id = CANONICAL-DIGEST(A, payload minus exclusion_set)` — corroborated decisively by Appendix A,
which constructs a payload carrying `"record_id": null` (line 1672), says "Remove record_id (it is
in the exclusion set).  The resulting object is:" (lines 1685-1686), and then shows an object with
no `record_id` member at all (lines 1688-1692).

### A6. Is an exclusion-set member that is absent from the payload an error?
**No sentence in §5 or §4.1 states a presence requirement** (searched: both sections). §5 lines
747-748 declare the set on the payload *class* — "The exclusion set MUST be declared by the payload
class in its specification" — not on the instance.

**Taken:** absent is a no-op. Removal is a filter over the members present.

### A7. A non-empty exclusion set over a payload that is not a JSON object.
§4.1 line 590 scopes the match to "the top-level member names of P", which presupposes an object.
**No sentence in §4.1 or §5 says what a non-empty exclusion set means over an array or a scalar**
(searched: both sections).

**Taken:** fail closed with `payload_not_object`. An empty exclusion set over any JSON value is
allowed, since JCS is defined over any value and nothing needs removing.

### A8. A payload class that carries the derived identifier without excluding it.
§5 lines 748-750 describe excluded fields as those that "either contain the derived identifier
itself (they cannot be inside the pre-image they help compute) or that reference other records in a
chain". That is **descriptive prose, not a MUST on the payload class.** A class that declares a
carried-identifier field and omits it from the exclusion set is not forbidden by any sentence in §5,
and can never verify: the identifier would be inside its own pre-image.

**Taken:** a distinct reason, `carried_identifier_not_excluded`, rather than letting it surface as a
value mismatch. **Why the distinction matters:** §5 lines 757-759 say a mismatch "MUST [be treated] as a defect
in the record", which a consumer will read as tampering. A class declared wrongly is not a
record altered wrongly, and an agent branching on the reason token must be able to tell them apart.

### A9. "A defect in the record" is not a disposition.
§5 lines 756-759 require the verifier to treat a mismatch as a defect but name no verdict.
**Taken:** `disposition: "failed"` with reason `carried_identifier_mismatch`, mapping the draft's
"defect" onto the tri-state §4.2 establishes elsewhere in the document.

### A10. Selective disclosure: a MUST this document gives no way to satisfy.
§5 lines 761-763:

> When selective disclosure is in use, the derived identifier MUST be
> computed over the SD-encoded form of the payload, not the plaintext
> payload.

**-02 defines no SD encoding.** §11 (lines 1142-1158, informative) lists selective disclosure among
the facilities "not define[d] ... in this document", to be "addressed in a companion document".
§12.2 lines 1188-1189 point at the SD-JWT pattern in RFC 9901 as an example, in a SHOULD about
low-entropy fields, not as the encoding §5 requires. Searched §5, §5.1, §11 and §12.2: no definition
of the SD-encoded form appears in those four sections. So a verifier cannot inspect bytes and
determine whether they are the SD-encoded form.

**Taken:** the caller asserts the form (`payloadForm: "plaintext" | "sd-encoded"`), and a class
declaring selective disclosure refuses a plaintext payload with `sd_encoded_form_required`. This
converts an unsatisfiable MUST into an explicit precondition on the caller rather than an assumption
inside the implementation.

---

## §5.1 — REPRESENTATION

### A11. 🔴 The prefixed textual representation is normative and undefined.
§5.1 lines 769-777 make representation normative — "Representation is normative and MUST be declared
by the payload class. The following representations are distinct and are not implicitly
interchangeable:" — and lists three, the second being:

> *  prefixed textual representation; and

**Searched: all 2072 lines of the -02 text for the string "prefix", case-insensitive. Two
occurrences.** Line 775, the list item above, and line 2006, an Appendix C acknowledgment crediting
Yong Bok Lee with "the representation-boundary distinction among raw digest bytes, bare lowercase
hexadecimal text, and prefixed text". **Neither states what the prefix is, what separator follows
it, or what a conforming producer writes.**

A payload class is required to declare its representation, and one of the three it may declare
cannot be implemented from this document.

**Taken:** `prefixed-text` is declarable in the `PayloadClass` type and fails closed on use, with
reason `representation_prefix_undefined` and disposition `unverified` — not `failed`, because the
record is not defective; we cannot evaluate it. Guessing a prefix would be exactly the silent
coercion §5.1 line 791 forbids.

**CORRECTED 2026-08-31 — this finding was overstated, and the corrected form is narrower and more
useful.** The narrow part above stands exactly as written: "prefix" occurs twice in the -02 text, at
lines 775 and 2006, and neither says what the prefix is. What was not done was checking your own
artefacts before characterising it. **`REGISTRY.md` line 331** at `e0ad1c7` registers a live entry
whose Representation column reads "`sha256:` + 64-char lowercase hex, as carried in the in-document
`action_hash` claim", and **`vectors/typed-refs/fail/03-representation-mismatch.json`** carries an
instance of it (`sha256:0c837d01…`) and quotes your -00 §4.1 defining the three representations.

So the corrected finding is: **a representation your registry registers and your vectors exercise is
defined nowhere in the normative text.** That is a real gap, and a different and more actionable one
than "undefined and unimplementable". The earlier claim that this is "the single strongest
under-determination" in the three sections does not survive the check, and is withdrawn: A10 and A19
are the two that would stop a conforming implementation.

The implementation's behaviour is unchanged by the correction — `prefixed-text` still fails closed
with `representation_prefix_undefined` and disposition `unverified`, because what the registry
declares is not what the normative text defines, and a verifier may not infer one from the other.

### A12. Is §7.1's hex-to-bytes rule an "expressly defined conversion" for comparison?
§5.1 lines 793-796:

> A deterministic conversion MAY be applied only where this
> specification or the applicable payload profile expressly defines
> both the conversion and the resulting comparison representation.

§7.1 line 873 does expressly define a conversion — `leaf_input = bytes.fromhex(D)` — but defines it
for **leaf construction**, and names no "resulting comparison representation".

**Taken:** the conversion is available to the leaf-construction operation only. `identifiersEqual`
still refuses to compare a `hex` identifier with a `raw` one, returning `representation_mismatch`.
Searched §5, §5.1, §7, §7.1 and §8.1: no conversion defined for *comparison* appears in those five
sections.

### A13. Is uppercase hexadecimal the same representation?
§5 line 742 and §5.1 line 773 both fix it as **lowercase**; §4.1 line 582 says the output is
lowercase hexadecimal. Searched all 2072 lines for "uppercase": one occurrence, line 1538, the
RFC 8174 reference title. No case-folding conversion is defined anywhere in the text.

**Taken:** an uppercase 64-character hex string is refused as malformed
(`identifier_not_lowercase_hex`), not reported as a value mismatch. Same reasoning as A8: "written
in the wrong representation" and "does not match" are different facts about a record.

### A14. The raw representation has no encoding into a JSON member.
§5.1 line 777 admits a "raw 32-byte octet sequence" as a representation a payload class may declare.
**No sentence in §5, §5.1 or §8 defines how a raw octet sequence is carried inside a JSON payload**
(searched: those three sections) — no base64url, no hex, no bstr. For a CBOR-serialized payload class
the question does not arise; §6 lines 808-811 admit both `+json` and `+cbor`.

**Taken:** `verifyCarriedIdentifier` over a JSON payload accepts the `hex` representation only, and
returns `representation_mismatch` for a class declaring `raw`, rather than inventing an encoding.

---

## §7.1 — LEAF CONSTRUCTION

### A15. 🔴 Is the derived identifier a 64-character string or a 32-byte value?
Two sentences in the document state it flatly and differently.

§5, lines 742-743:

> The derived identifier is a 64-character lowercase hex string for every
> algorithm this document registers

§7.1, lines 862-864:

> Where a Transparency Service's VDS keys its log on the
> derived identifier, the derived identifier is a 32-byte value and its
> hexadecimal form is a representation of that value (Section 5.1)

§5.1 reconciles them — both are representations of one value — but neither sentence defers to §5.1,
and each reads as a statement about what the identifier *is*. An implementer taking §5 at its word
builds a string type; one taking §7.1 at its word builds a byte array; §7.1 exists because that
exact confusion produced a wrong leaf hash in the field (Appendix C.1.2, lines 1836-1841).

**Taken:** the identifier is modelled as digest octets plus a declared representation, which is
§5.1's reading. Recorded because the two flat sentences are the kind of thing a reader resolves by
picking one.

**A second-order consequence.** §5 line 744 admits "an algorithm registered elsewhere" whose
representation "is the one that algorithm's registry entry declares" — which need not be 32 bytes.
§7.1's "the derived identifier is a 32-byte value" then does not hold for such an algorithm, and
§7.1 states no rule for that case. This implementation registers only what §14.1 Table 3 carries,
all SHA-256, so it enforces 32 and returns `identifier_wrong_length` otherwise.

### A16. Is the leaf rule conditional or unconditional?
§7.1 line 861 opens "This profile imposes no leaf construction on a Verifiable Data Structure", then
line 869-871 states "the log leaf input MUST be the raw 32-byte value".

**Readings.** (i) The MUST binds only where the VDS keys its log on the derived identifier.
(ii) The MUST is unconditional wherever a hex-valued identifier exists.

**Taken: (i).** **The sentence that forced it** is line 862's "Where a Transparency Service's VDS keys
its log on the derived identifier", which scopes everything that follows, together with the opening
disclaimer. The caller states the condition (`VdsKeying.keysOnDerivedIdentifier`); when it is false,
`leafInput` declines rather than returning bytes for a leaf this profile does not govern.

A residual tension is recorded rather than resolved: line 865 says a VDS that keys on the identifier
"states which of the two it uses, and producer and verifier MUST use the same one" — which reads as
the VDS being free to choose hex — while lines 869-877 say the leaf input MUST be the raw bytes and
that the UTF-8 form is WRONG. Reading (ii) of *that* sub-question would make the MUST vacuous, so
the raw-bytes rule is applied whenever the VDS keys on the identifier.

### A17. Is `leaf_input` the leaf, or the input to the VDS's leaf hash?
**Readings.** (i) `leaf_input` is the pre-image the VDS hashes; the hashing is the VDS's.
(ii) The leaf is SHA-256 of those bytes, and the profile says so.

**Taken: (i).** `leafInput` returns 32 octets and **does not hash them**. **The sentences that forced
it:** line 861, "This profile imposes no leaf construction on a Verifiable Data Structure"; line 869,
which names the output "the log leaf input"; and lines 880-882, "produces a silently wrong leaf
hash" — the leaf hash is a downstream object, not this one.

Appendix C.1.2 line 1838 (informative) describes the GAR field instance as "SHA-256 of the raw bytes
of the derived identifier". That is what one VDS did with this input. Folding it into the return
value would import a VDS rule the normative section explicitly declines to impose — and would be
wrong for, e.g., an RFC 9162 log, whose leaf hashing prepends its own domain-separation byte.

---

## WHAT WAS CHECKED AND DELIBERATELY NOT IMPLEMENTED

**§8 typed digest references.** Implementation was conditional on whether §5 or §7.1 depends on §8.
Checked: §5 spans lines 733-798 and §7.1 lines 859-883; reading both in full, **neither cites any
part of §8** (searched: those two section bodies).

**CORRECTED 2026-08-31.** The sentence here previously also said that §5 cites Section 5.1. It does
not. **§5 contains zero occurrences of the word "Section"** across all 66 of its lines, and the only
citation of Section 5.1 in the whole 2072-line document is at **line 864, inside §7.1** — the
leaf-construction paragraph. The §8 half of the sentence, which is the half the decision rested on, is
correct and unchanged. §8 is reached from §12.4's citation rule (line 1220) and from §9 (line 1099), both outside
the three sections. Not implemented.

**§4.2 jcs-n and §4.3 cde-n.** Implemented as rejections only, because the text requires a verifier
to reject — §4.3 lines 677-680 and §14.1 lines 1442-1445 for cde-n, §4.2 lines 643-650 for jcs-n. The withdrawn
*construction* is not implemented: its definition lives in -00 §3.1, which -02 does not restate.

### A18. "Fail closed" is glossed more weakly than it reads.
§4.2 lines 643-645:

> A verifier encountering jcs-n in a record committed on or
> after 2026-08-18 MUST fail closed — MUST NOT report the payload class
> or typed digest reference as verified.

The em-dash gloss defines "fail closed" as *MUST NOT report as verified*. It does not say report as
failed. So **neither branch of §4.2 names a positive disposition** — the section forbids `verified`
and, for a decliner, forbids `failed` on the historical branch (line 650, "MUST report the reference
as unverified rather than as failed"), leaving the post-withdrawal branch's disposition unstated.

**Taken:** post-withdrawal → `failed`, from §14.1 lines 1446-1447 ("A payload class or typed digest reference naming jcs-n
MUST NOT be newly declared") — a record violating a MUST NOT is defective.
Pre-withdrawal → `unverified`, which line 650 states outright, because this implementation declines
the withdrawn construction.

### A19. Where does a verifier read "the date the record was committed"?
§4.2's whole disposition turns on it, and **no sentence in §4.2, §4, §6, §7 or §14.1 says which field
carries it, in which header, or in what format** (searched: those five sections). §6 (lines 799-829)
enumerates the required protected-header claims — `alg`, `kid` or `x5chain`, `content_type` — and
none of them is a date. §12.5 lines 1246-1247 say the envelope signature and Receipt "bound its timing", which is the nearest
thing, but §4.2 does not cite it.

**Taken:** the caller supplies `recordCommittedOn`; when it is absent, the vintage allowance is not
taken and the result is `unverified` (`algorithm_withdrawn_jcs_n_vintage_unknown`), never `verified`.

### A20. The 2026-08-18 boundary has no timezone or precision.
§4.2 writes the date bare, three times, and never as a timestamp. A record committed at
2026-08-18T00:30:00+03:00 is before the date in UTC and on it locally.

**Taken:** lexicographic comparison of ISO-8601 strings against `"2026-08-18"`, with no timezone
normalization, documented at the call site. Recorded rather than resolved — the text supports no
particular answer.

### A21. No general rule for an algorithm a verifier simply has not implemented.
§4.2 line 649 states the declines-to-implement rule for the withdrawn construction only.
**Searched §4, §4.1, §4.4, §5, §7 and §14.1: no general rule appears in those six sections** for a
registered, live algorithm a verifier has not implemented — which is `as-transmitted`'s case here.

**Taken:** §4.2's shape is applied by analogy — `unverified` with reason
`algorithm_not_implemented` — because reporting `failed` would assert a defect in a record never
examined. The analogy is ours; the draft does not authorize it.

---

## SUMMARY — WHAT AN IMPLEMENTER CANNOT GET FROM -02 ALONE

Two of these would stop a conforming implementation rather than merely make it choose:

1. **A10** — §5's SD-encoded-form MUST cannot be satisfied from this document, which defers
   selective disclosure to a companion document (§11).
2. **A19** — §4.2's disposition depends on a record commit date the document never locates.

**A11 was listed here as a third and is withdrawn from this list**, for the reason its own entry now
gives: a representation your registry registers and your vectors exercise is undefined in the
normative text, which is a real gap and a narrower one than the entry originally claimed.

One further gap, which the corrected A1 now carries and which was previously reported as its
opposite: **§4.1 does not name its refusal set.** The duplicate-name rule exists by delegation through
RFC 8785 §3.1 and RFC 7493 §2.3, and two independent implementers missed it in the same week.

The rest are choices a careful implementer can make and document. Every one of them is a place where
two implementations could diverge while both believing they conform, which is the failure mode the
draft exists to close.

---

## THE README SIGNPOST FINDING, DATED

The 30 August package reported that `main`'s README sends an implementer to `jcs-n/kats/`, the
historical suite for the withdrawn construction, and not to `subject-binding-diff/` at all. That was
true of `README.md` at `e0ad1c7` and it was true when written. **It carried no expiry date and it
should have.** PR #72 merged and `main` moved to `eba249c8…` within hours on 2026-08-31; at the fetch
for this run, 2026-09-03T11:09:10Z, `main` is `712c43b9…`, two moves on. The finding is scoped to
`e0ad1c7` and to nothing else. The vector table in these documents carried an as-of stamp from the
start; this finding should have carried the same one.

---

## CLAIM MANIFEST

**Recomputed in this run, from the bytes named:** every -02 line number and quotation above, read from
sha256 `47ab6757…5ec875`; the two occurrences of "prefix" at lines 775 and 2006; the zero occurrences
of "Section" in §5 (lines 733-798) and the single occurrence of "Section 5.1" at line 864; `REGISTRY.md`
line 331 at `e0ad1c7`, read as a blob; the `sha256:`-prefixed instance in
`typed-refs/fail/03-representation-mismatch.json`, read as a blob; `main` at fetch time.

**Taken from you, as your figures:** the intent behind the registry entry at `REGISTRY.md` line 331,
and whether the divergence between it and the normative text is deliberate. `main` at `eba249c8…` on
2026-08-31, which this run did not observe.

**Not established here:** that the readings taken are the ones you intend — every entry above is a
place where the text admitted more than one, and the choice is recorded so you can overrule it. That
RFC 8785 conformance holds for the canonicalizer underneath, which §0 bounds and this exercise did not
derive. That the corrected A1 exhausts the delegation chain: it names RFC 8785 §3.1 and RFC 7493 §2.3
because those are the two the chain reaches, and a third document further along would have been missed
by the same method that missed these.

---

## Interests

Interests. The author of this grading authors draft-msebenzi-evidence-action, builds Chirindo, an operator-run gate that signs receipts of MCP calls, and maintains receipt-verify, the tool that produced this document. Those occupy the same ground as the formats graded here. Independence is not claimed. What is claimed is that every value in this document recomputes from pinned bytes by anyone with the tool or without it, that every scope is cited to the document that names it, and that text and implementation are scored separately, a rule that came from the author of one of the formats graded. Where a judgment call was made, it is marked as one.
