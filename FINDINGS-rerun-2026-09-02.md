# FINDINGS — rerun 2026-09-02 (`draft-marques-asqav-compliance-receipts-08`)

A re-verification of four errata, and of the four `FINDINGS.md` E-entries behind
them, against `draft-marques-asqav-compliance-receipts-08` — published 31 August
2026, carrying this side's July errata. Each verdict is stated against the
erratum **as sent**, cites a `-07` line number and a `-08` line number, and rests
on values recomputed here from pinned bytes.

`FINDINGS.md` is not amended by this document. Its E-entries record what was
observed on 2026-07-28 against `-07` and remain accurate of those bytes. The A5
block of 2026-09-01 gains a dated append; no line of it is edited. New
observations are opened as an `M` series (M5 onward, continuing the numbering the
2 September letter used) so the E and R spaces cannot collide.

**Text and implementation are graded separately**, per the draft author's rule of
10 August, adopted in the methodology note. A section can be resolved in text and
uncorroborated in its vectors, and this rerun finds exactly that case.

---

## A note on the date of this document

The handoff for this rerun is headed *"RUN ON: Thu 3 Sep (or later the same
week)"* and carries a written-time of `2026-09-02 14:15Z`. This rerun ran on
**Wednesday 2 September 2026, 13:49Z–14:2xZ**, which is a day earlier than the
handoff scheduled and 26 minutes before the handoff's own stated writing time.
Every record here is dated by the clock, per R66, and not by the day the work was
scheduled for. That rule is in force because `fixtures/provenance.md` carries
correction `C-2026-09-02-1`, opened earlier the same day, for a section that took
its date from a handoff filename rather than from the clock.

---

## Disclosure state

| field | value |
|---|---|
| errata sent | 2026-07-30, privately, to the draft author (`marques-errata.md`, items 1–4) |
| errata count | 4 |
| revision published in response | `-08`, 2026-08-31 16:31Z (the hour the author gave) |
| observation sent against `-08` | 2026-09-02 09:00:13Z (Gmail `1a06158f54654490`), `JOAO_08_FINDING_2026-09-01.md` |
| author's ruling received | 2026-09-02 13:07:20Z (Gmail `1a0623b358cfaf65`, bytes held by the founder) |
| rerun performed | 2026-09-02 |
| published anywhere | no |

---

## What was fetched, and what it digests to

Every digest below was computed during this rerun from the bytes named. No digest
is carried over from correspondence or from a prior note.

### Revisions

| source | bytes | lines | sha256 | verdict |
|---|---|---|---|---|
| `refs/draft-marques-asqav-compliance-receipts-07.txt` | 290,473 | 5,936 | `082615447288fa1e983fa2cfb7aa7356fbb35d05d65ea256f66111487746d52f` | matches the July pin |
| `refs/draft-marques-asqav-compliance-receipts-08.txt` | 392,828 | 7,840 | `ee3ca5d7c0acc1cb9b8025d29f19a7d73991718ca35d3bf4229f7b4264976ec0` | **matches the expected pin exactly** |

Every `-07` and `-08` line number in this document was read from those two files.
No line number was read from a browser, and no page was rendered.

### The vector corpus

`draft-marques-asqav-compliance-receipts-08` names its own conformance corpus in
its reference section, at lines 6109–6111 of the pinned bytes:

> `[ASQAV-SDK]  Asqav, "asqav-sdk: Verifier Conformance Vectors", 2026,`
> `             <https://github.com/jagmarques/asqav-sdk/tree/05c1c49>.`

| field | value |
|---|---|
| commit | `05c1c49402dc933ea7ada039ce5c87213b89de89` |
| author / commit date | 2026-08-30T23:09:05+02:00 |
| subject | `feat(vectors): publish the selective-omission conformance vectors (#428)` |
| vectors directory | 211 entries, blob ids in `fixtures/asqav/05c1c49/ls-tree-verifier-conformance-vectors.txt` (sha256 `eb040de0f8ce9af8ffad85bc07d3a155f6f9d8609be5fecd57ed99f7b625789f`) |

That commit is the one that added the three selective-omission vectors
(`asqav-14-omitted-action-chain`, `asqav-15-unsigned-gap`,
`asqav-16-chain-emission-blocked`), which is what it was described as being.

Twelve files were copied into `fixtures/asqav/05c1c49/` with per-file digests and
blob ids; the table is in `fixtures/provenance.md` under
*"Appended 2026-09-02 — the Asqav SDK conformance vectors at the commit -08 pins"*.
The repository was cloned, never read from a rendered page.

**Two deviations, stated rather than buried.**

1. The handoff instructed that the SDK URL be taken from `marques-evidence.md`,
   and required a STOP if it was absent. It **is** absent: that file names only
   the two IETF archive URLs and `github.com/ScopeBlind/agent-governance-testvectors`.
   The URL used was read from the `-08` bytes pinned in `refs/`, which is a
   byte-pinned source rather than a guess, on the founder's instruction of
   2026-09-02. The stop condition fired and was lifted deliberately, not
   overlooked.
2. `core.autocrlf` is `true` on this machine. The first extraction copied files
   from the clone's working tree and produced digests for CRLF-rewritten bytes
   that no third party could reproduce. It was discarded. Every digest above and
   in `provenance.md` is of bytes extracted with `git cat-file blob`, each
   verified equal to `git cat-file blob <id> | sha256sum`.

---

## Correspondence to `FINDINGS.md`

| erratum as sent | binds to | `-07` section | `-08` section |
|---|---|---|---|
| 1 — mandated scope contradicts the section cited as its authority | **E3** | §5.3 | §5.3 "Hash-Chain Linkage" |
| 2 — exclusion clause and rationale clause select different bytes | **E4** | §5.3 | §5.3 |
| 3 — restated in the notation of the rejected scope | **E5** | §5.3 | §5.3 |
| 4 — the genesis stipulation the profile supplies (positive) | **E8** | §5.3 | §5.3 |

Section numbering moved between revisions and the correspondence is stated
against content, not against numbers. `counterparty_binding` was **§5.6 in -07**
and is **§5.7 in -08**; `-08` §5.7's cross-references to extension fields renumber
from §5.5 to §5.6. E3 was recorded as resolved by `-08` §4 in the A5 block of
2026-09-01; it is re-confirmed below from the bytes, with one correction to which
sentence carries the resolution.

---

## Method

Digests and canonical byte strings were recomputed from pinned bytes rather than
read from any declared value. RFC 8785 canonicalization was implemented directly
in `tools/asqav_envelope_hash.py` rather than imported: neither `jcs` nor
`canonicaljson` is installed here, and this rerun was permitted no third-party
endpoint but the git clone, so no package could be fetched. That implementation
shares no code with the TypeScript adapter in `src/`, which is the point — an
agreement between them is evidence rather than a shared bug.

**The control on that serialiser**, stated because a canonicalizer that agrees
with nothing proves nothing: it reproduces **21 of 21** of the `canonical`
strings the SDK publishes beside its own vectors, byte for byte. A serialiser
with the wrong key order, the wrong escape set or the wrong number format fails
that comparison. It is the input that would have turned this check red.

What that control does **not** cover: the corpus exercises no non-BMP member
name, no floating-point number, and no integer outside the IEEE 754 safe range,
so the UTF-16 code-unit key ordering and the number-serialisation rules are
implemented to the RFC and unexercised by these vectors. The implementation
raises rather than guesses on all three.

---

## The four errata, re-read against `-08`

### Erratum 1 — the mandated scope contradicts the section cited as its authority

**As sent:** §5.3 requires `previousReceiptHash` "populated **per the digest-scope
rule of Section 5.7 of [ACTA-RECEIPTS]**", then states a rule that excludes the
signature, then concludes it "matches Section 5.7 of [ACTA-RECEIPTS]". The
resolution path offered was to *"state §5.3 as what it appears to be — a
deliberate profile override of the upstream digest scope"*.

**`-07`, line 738:**

> the digest-scope rule of Section 5.7 of [ACTA-RECEIPTS]: the

and at line 759, closing the same passage:

> alone, and matches Section 5.7 of [ACTA-RECEIPTS].  The chain does

**`-08`, line 958:**

> deliberate override of upstream's "Chain Hash Scope" section

in full at lines 957–961:

> This digest scope is a deliberate override of upstream's "Chain Hash Scope"
> section (Section 5.7 of [ACTA-RECEIPTS]), which requires the digest of the
> entire signed receipt object including the signature field; this profile
> digests the predecessor's payload member instead.

The "matches Section 5.7" claim is gone. The citation-as-authority is replaced by
a citation-as-override that states what it overrides and what it substitutes.

**Verdict: RESOLVED** — and resolved by the route the erratum proposed, in the
erratum's own terms.

### Erratum 2 — the exclusion clause and its own rationale select different bytes

**As sent:** the exclusion clause pointed at the inner `payload` member; the
parenthetical before it ("the same bytes the predecessor's cryptographic
signature covers") pointed, on the measured evidence, at the envelope minus the
signature. Three candidate digests for one field. The resolution path offered was
*"naming the bytes rather than describing them … e.g. 'SHA-256 over `JCS(R)`
where `R` is the predecessor receipt object with its `signature` member removed',
or '…where `R` is the predecessor's `payload` member'."*

**`-07`, lines 743–744:**

> (the same bytes the predecessor's cryptographic signature covers),
> NOT the envelope object that additionally includes the signature or

**`-08`, lines 944–948:**

> Implementations MUST emit a previousReceiptHash field, populated with the
> lowercase hex encoding of SHA-256(JCS(R)), where R is the payload member of
> the immediately prior receipt emitted by the same issuer_id and JCS denotes
> the canonicalization of [RFC8785]: the digest covers R, NOT the envelope
> object that additionally includes the signature or anchors top-level keys.

`R` is now a defined symbol with exactly one referent. The describing
parenthetical that created the second reading is gone. `-08` took the second of
the two wordings the erratum offered — the payload member.

**Verdict: RESOLVED** — by naming the bytes, as asked, and the ambiguity is
closed rather than narrowed.

### Erratum 3 — the rule restated in the notation of the scope it rejects

**As sent:** nine lines after mandating the signature-exclusive scope, §5.3
restated it as `SHA-256(JCS(receipt))` — the upstream section's own notation,
which upstream defines as the envelope including the signature. The resolution
path offered was *"a defined symbol used consistently in both paragraphs —
`SHA-256(JCS(R))` with `R` defined once"*.

**`-07`, line 778:**

> previousReceiptHash MUST resolve to the SHA-256(JCS(receipt)) of the

**`-08`, lines 1014–1018:**

> each newly emitted receipt's previousReceiptHash MUST resolve to
> SHA-256(JCS(R)) for the immediately prior receipt emitted by that same
> issuer_id (R as defined at the start of this section), taken in emission
> order, regardless of which concurrent execution path produced it.

The restatement now uses `R`, and points back to its definition in the same
sentence. An implementer working from this paragraph alone reaches the payload
member, which is the outcome the erratum said the passage existed to secure.

**Verdict: RESOLVED** — exactly as proposed, defined symbol and all.

### Erratum 4 — the genesis stipulation, which the erratum asked to survive

**As sent:** the one thing the profile got right. §5.3 supplied the genesis value
upstream lacks and attributed it to the profile rather than blurring it into an
upstream requirement — *"worth keeping in whatever revision fixes the items
above."*

**`-07`, line 746:**

> field to the all-zero SHA-256 value (this profile's stipulation;

**`-08`, lines 974–978:**

> The first receipt in a chain MUST set this field to the all-zero SHA-256 value
> (this profile's stipulation; upstream's "Chain Hash Scope" section (Section 5.7
> of [ACTA-RECEIPTS]) specifies only the digest scope of subsequent links).

The parenthetical survives, and the attribution survives with it. The only change
is the citation form: `-08` names the upstream section by title as well as number
throughout, following upstream's own renumbering at `-03`.

**Verdict: RESOLVED — survived, as asked.** The stipulation is still the
profile's own and is still labelled as such.

### The author's own description of `-08`, checked against the bytes

On 31 August the author described the revision as: *"the override is stated as an
override now, the envelope shape and the signed bytes are defined in one place,
and your genesis parenthetical survived untouched … verifiers now have to pick
the scope from the receipt's format and are told never to retry the other scope
when one fails."* Treated as a claim to check, not a result:

| claim | checked against | outcome |
|---|---|---|
| "the override is stated as an override" | `-08` 957–961 | **holds** (erratum 1) |
| "the envelope shape and the signed bytes are defined in one place" | `-08` 940–948, 648–650 | **holds for the chain scope** — §5.3 states the envelope shape and defines `R` in one passage. It does **not** hold for `envelope_hash`, which is defined in two places that disagree — see M5. |
| "your genesis parenthetical survived untouched" | `-08` 974–978 | **holds in substance**; the citation form inside it changed, the stipulation and its attribution did not |
| "pick the scope from the receipt's format … never retry the other" | `-08` §11.2, lines 3764–3767 | **holds, verbatim**: *"A verifier that processes more than one receipt format MUST determine the signature scope and the chain-digest scope from the receipt's format before it begins verification, and MUST NOT retry verification under a different scope when the first attempt fails."* |

Four claims, three hold as stated and one holds for the field it was made about
but not for `envelope_hash`.

---

## E3, E4, E5, E8 re-read against `-08`

| entry | `-07` | `-08` | verdict |
|---|---|---|---|
| **E3** — mandated scope contradicts the cited authority | §5.3, lines 738, 759 | §5.3, lines 957–961; §4, lines 651–657 | **RESOLVED** |
| **E4** — two signature-exclusive readings inside §5.3 | §5.3, lines 743–744 | §5.3, lines 944–948 | **RESOLVED** |
| **E5** — restated in the rejected notation | §5.3, line 778 | §5.3, lines 1014–1018 | **RESOLVED** |
| **E8** — genesis value and placement supplied by the profile | §5.3, lines 735, 746 | §5.3, lines 939–940, 974–978 | **RESOLVED — and preserved** |

E8's second half — that upstream lists `previousReceiptHash` in neither its
common-payload-fields section nor any receipt type — is a statement about
`draft-farley-acta-signed-receipts`, not about this profile, and is untouched by
`-08`. It was re-read against `-02` only, which is the revision E8 cites; `-03`
renumbered the sections (A4 of the 2026-09-01 block) and was not re-read for this.
That half of E8 stands as recorded, against `-02`.

### A correction to the A5 block of 2026-09-01

A5 records E3 as resolved by `-08` §4 and quotes, as the resolving sentence:

> No digest in this profile covers the envelope including the signature member.

That sentence is at `-08` line 658–659, and it is **itself one side of the M5
disagreement below** — it is a claim about `anchors` as much as about signatures,
and it is false of §5.7 as §5.7 is written. E3's resolution does not depend on it.
The resolution rests on §5.3 lines 944–948 (`R` is the payload member) and on §4
lines 651–653 (*"The digest scopes of this profile therefore resolve to the
payload member"*). **E3 remains RESOLVED**; the citation is corrected to those two
passages. The quoted sentence's other clause — that an ACTA-family receipt keeps
its own format's scope — is at lines 660–663 and is undisturbed.

---

## M5 — `-08` states the `envelope_hash` scope two ways

**Status: acknowledged by the author, 2026-09-02 13:07:20Z.** §4 carries the
intent; §5.7 is the stray; `-09` corrects §5.7 and adds an explicit `scope` member
to `counterparty_binding`, and re-pins the vector. His instruction for this rerun,
as quoted in the Lead's handoff of 2026-09-02: **"for the -08 rerun, grade the
text as 5.7 reads today"** — text and implementation separately. His reason is
that anchors are optional and can change after issuance, when an OpenTimestamps
proof upgrades, so a binding over them would pin a passing state of the peer's
receipt rather than its signed bytes.

*Provenance of that ruling: it is cited from Gmail message `1a0623b358cfaf65`,
held by the founder, via the Lead's handoff. This session did not read those
bytes — the Gmail connector failed to connect, and the rerun's binding rules
forbid third-party endpoints in any case. It is the one load-bearing element of
this document that was taken on report rather than recomputed. See the R15
manifest in the accompanying report.*

**This side's 2 September letter guessed the other way**, and the record says so:
it argued that §5.7 and the change list carried the intent and §4's sentence was
the stray, on the reasoning that anchors are part of what the peer emitted. The
author's reason — mutability after issuance — is the one that settles it, and it
reverses the guess.

### The disagreement, as `-08` reads

**§4, lines 656–659:**

> the only envelope-level scope in this profile is the
> envelope-minus-anchors object of Section 5.7, which exists precisely
> to bind the peer's signature value.  No digest in this profile covers
> the envelope including the signature member.

**§5.7.1, lines 1351–1369**, the `envelope_hash` definition:

> Base64-encoded SHA-256 digest computed over A's entire serialized signed
> envelope, including A's signature bytes.

> the JCS-canonical UTF-8 byte sequence of A's signed envelope JSON object per
> [RFC8785], where the envelope is the three-key object {"payload": …,
> "signature": …, "anchors": <array of anchor objects, OPTIONAL>}

> B MUST NOT re-canonicalize A's payload or strip the anchors array before
> computing the digest.

**The change list, lines 7249–7253**, agrees with §5.7:

> the JCS-canonical UTF-8 byte sequence of A's signed envelope JSON object per
> [RFC8785], where the envelope is the three-key object {"payload",
> "signature", "anchors"} with anchors OPTIONAL and B forbidden from
> re-canonicalizing or stripping any of the three keys before computing the
> digest.

**Graded as `-08` reads today: the rule the text states is the three-key object,
anchors included.** Two of the three passages say so, one of them normatively and
in the section that defines the field; §4's sentence is the outlier.

### What the bytes add about how the two got out of step

Three observations from comparing the revisions, offered as mechanism, not as a
verdict on intent:

1. **§5.7's rule is carried forward from `-07` unchanged.** The `envelope_hash`
   block at `-08` 1351–1370 is byte-identical to `-07` 1071–1090 but for one
   cross-reference renumber (`Section 5.5` → `Section 5.6`). The three-key rule
   is not new in `-08`; it is `-07`'s rule, untouched.
2. **§4's contradicting sentence is new in `-08`.** `-07` §4 (lines 428–513)
   names the cross-agent binding of §5.6 only as something that depends on
   canonicalization, and assigns it no digest scope. The phrase
   "envelope-minus-anchors" does not occur in `-07` §4, nor does "No digest in
   this profile covers the envelope including the signature member". Both arrive
   with `-08`'s expanded §4 paragraph at lines 648–668.
3. **The term §4 borrows is defined elsewhere, for a different purpose.**
   `envelope_minus_anchors` is a defined term of the anchoring section — `-08`
   §5.4, lines 1055–1061 — where it names the bytes an RFC 3161 or OpenTimestamps
   anchor commits to:

   > the bytes committed are SHA-256(JCS(envelope_minus_anchors)), where
   > envelope_minus_anchors is the wire envelope object with the anchors
   > top-level key removed prior to canonicalization, leaving the two-key object
   > {payload, signature}.

   It carries the same definition in `-07` at line 814. So §4 applies the
   *anchor-commitment* scope's name to the *counterparty-binding* section.

Taken together: the newly written section states the new intent, and the section
carried forward from `-07` was not updated to match it. That is consistent with
the author's ruling and independent of it.

### Implementation: `envelope_hash` recomputed both ways

From `fixtures/asqav/05c1c49/conformance/vectors.json`, vector
`counterparty_binding_envelope_byte_equality` (A's signed envelope) and vector
`counterparty_binding_happy_path` (B's receipt, carrying the binding). Recomputed
by `tools/asqav_envelope_hash.py`:

| scope | canonical bytes | sha256 (hex) | sha256 (base64) |
|---|---|---|---|
| **(a)** `JCS({payload, signature, anchors})` — what §5.7 states | 887 | `e89bf2fe64bd7dab3a606ea265ca14f88f4d161ec0485062a7facee4902c655f` | `6Jvy/mS9fas6YG6iZcoU+I9NFh7ASFBip/rO5JAsZV8=` |
| **(b)** `JCS({payload, signature})` — what §4 line 657 states | 761 | `a4504d771dd14c5ef6de2edcfd2f44544f54afcfd7756921412584f8aaea0abd` | `pFBNdx3RTF723i7c/S9EVE9Ur8/XdWkhQSWE+KrqCr0=` |
| **published `envelope_hash`** | — | `0d6c88a16e96fd3429be13e44dc957062f77d417dc0c3ea28e4fa496230de2a9` | `DWyIoW6W/TQpvhPkTclXBi931BfcDD6ijk+kliMN4qk=` |

**MATCH: neither.** This was the outcome the handoff named in advance as a
finding rather than a fault in the run, and it is recorded as **M6** below.

Scope (a) is nonetheless corroborated from a second direction: the envelope
vector's own pinned `sha256` field is `e89bf2fe…`, equal to (a) and not to (b).
The SDK's own derived field agrees that the three-key object is what its envelope
canonicalizes to. It is only the `envelope_hash` **value** that matches nothing.

---

## New findings

### M6. The published `counterparty_binding.envelope_hash` matches neither scope, and one vector contradicts itself

`counterparty_binding_envelope_byte_equality` carries two derived values for the
same bytes, and its own `description` says one is the base64 of the other:

> "Base64 of the digest is the value B places in counterparty_binding.envelope_hash
> on the happy-path vector."

| field in that one vector | value |
|---|---|
| `sha256` | `e89bf2fe64bd7dab3a606ea265ca14f88f4d161ec0485062a7facee4902c655f` |
| base64 of that digest | `6Jvy/mS9fas6YG6iZcoU+I9NFh7ASFBip/rO5JAsZV8=` |
| `counterparty_binding.envelope_hash_base64` | `DWyIoW6W/TQpvhPkTclXBi931BfcDD6ijk+kliMN4qk=` |

The same `DWyIoW6W…` value is what `counterparty_binding_happy_path` places in
`counterparty_binding.envelope_hash`, and that vector points back at this one by
name (`originating_envelope_ref`). So the linkage is explicit and the value is
wrong against both candidate scopes and against the vector's own `sha256`.

**Scope of the negative, searched here:** 37 candidate byte strings derived from
the envelope vector were digested and compared — every non-empty subset of the
three top-level keys, each key's value alone, the `canonical` string of all 21
vectors, double-SHA-256, SHA-256 over the hex and base64 renderings of the
three-key digest, the three-key object with `anchors` set to `[]` and to `null`,
and the raw signature string. None reproduces `0d6c88a1…`. What that value **is**
was not determined, and this run does not claim it is unreachable — only that it
is not any of those 37.

**Why nothing caught it.** The SDK's own `test_conformance_vectors.py` asserts
that each vector's `canonical` equals `_jcs(input)` and that each `sha256` equals
`SHA-256(canonical)`. It never reads the `counterparty_binding` block. The two
tests that name `envelope_hash` —
`python/tests/test_counterparty_binding.py::test_envelope_hash_is_base64_sha256_of_jcs`
and `typescript/tests/counterparty.test.ts` *"pins envelope_hash for a frozen JCS
input"* — both recompute the expected value with the same function under test and
assert equality with it. Neither pins a literal digest; neither touches the
published vector. The TypeScript one sits in a block headed `cross-sdk
byte-stability` and would pass if `canonicalJson` were replaced by any
deterministic function. **The published `envelope_hash` value is asserted by
nothing**, which is why it can be wrong while the suite is green.

The SDK's *implementation* is not in question: `compute_envelope_hash` digests
whatever envelope it is handed, without stripping `anchors`, which is scope (a)
and matches §5.7 as published. The defect is in the vector's declared value, not
in the code that would produce one.

**This is the check the author asked for.** His standing offer, made in the reply
drafted 2 September, is that the `-09` vector be re-checked against the `-09`
sentence before it posts. M6 is the same class of gap one revision earlier: a
published value that no test compares to anything.

**Appended 2026-09-02, 14:47Z — identified. The value is the same three-key digest, one SDK commit earlier.**
`0d6c88a16e96fd3429be13e44dc957062f77d417dc0c3ea28e4fa496230de2a9`
(`DWyIoW6W/TQpvhPkTclXBi931BfcDD6ijk+kliMN4qk=`) is
SHA-256(JCS({`payload`, `signature`, `anchors`})) — scope (a), the three-key
object — over this vector's own envelope **as it stood before SDK commit
`ee8a3e7`**, *"docs(corpus): align CLI docs, genesis pins, JCS dialect, and
expected shapes with shipped semantics (criterion 436)"* (PR #416, 2026-08-04
21:03:12 +0200). One member changed there: `payload.previousReceiptHash`, from
the seed form `"sha256:" + "0"×64` (71 characters, three-key canonical 894
bytes) to the bare form `"0"×64` (64 characters, 887 bytes). `ee8a3e7`
recomputed each vector's own `canonical` and `sha256` against the new member but
not the derived `envelope_hash`, which is carried as a literal in the
`counterparty_binding` blocks and is asserted by no test. So the published value
is not wrong in the sense of never having been right: it is a correct scope-(a)
digest of a superseded envelope. **The 37-candidate sweep recorded above is
superseded by this identification** — the sweep digested only byte strings
derived from the envelope *as published at* `05c1c49`, and the pre-`#416`
envelope was outside the set it searched, which is why it returned a true
negative on a value that was reachable all along.

Reproduced 2026-09-02 from blob bytes, never the worktree
(`git cat-file blob <commit>:conformance/vectors.json`), digested with
`tools/asqav_envelope_hash.py`. `git log -- conformance/vectors.json` returns
**eight** commits, not the seven the handoff directing this append states; all
eight are listed, and the three oldest predate the vector's existence.

| commit | date | `payload.previousReceiptHash` | three-key SHA-256 |
|---|---|---|---|
| `4e4caf4` | 2026-09-01 22:35:10 +0200 | bare 64-zero | `e89bf2fe64bd7dab3a606ea265ca14f88f4d161ec0485062a7facee4902c655f` |
| `ee8a3e7` | 2026-08-04 21:03:12 +0200 | bare 64-zero | `e89bf2fe64bd7dab3a606ea265ca14f88f4d161ec0485062a7facee4902c655f` |
| `4cbdfc0` | 2026-07-28 12:53:24 +0200 | `sha256:` + 64-zero | `0d6c88a16e96fd3429be13e44dc957062f77d417dc0c3ea28e4fa496230de2a9` |
| `7f0b869` | 2026-07-04 09:55:45 +0200 | `sha256:` + 64-zero | `0d6c88a16e96fd3429be13e44dc957062f77d417dc0c3ea28e4fa496230de2a9` |
| `3e13a0d` | 2026-05-18 20:35:36 +0000 | `sha256:` + 64-zero | `0d6c88a16e96fd3429be13e44dc957062f77d417dc0c3ea28e4fa496230de2a9` |
| `048d010` | 2026-05-16 19:12:44 +0000 | — | vector absent (14 vectors) |
| `e67eea5` | 2026-04-22 22:57:48 +0200 | — | vector absent (8 vectors) |
| `0afe7d8` | 2026-04-22 22:54:47 +0200 | — | vector absent (3 vectors) |

The value first appears with the vector itself at `3e13a0d` (#197) and changes
only at `ee8a3e7`. **Direct check**, independent of the history: take the
`05c1c49` envelope this rerun pins — its blob is byte-identical to
`fixtures/asqav/05c1c49/conformance/vectors.json`, both sha256
`2b260f4efc0f3ada078cf98108d04ea9d3491bf7c684e9d97dac567ec289dd6a`, 31790 bytes
— set `payload.previousReceiptHash` back to `"sha256:" + "0"×64` and change
nothing else; the three-key digest is `0d6c88a1…`, the published value, exactly.
As published at `05c1c49` the same object digests to `e89bf2fe…`, the vector's
own `sha256` field.

The stale literal is echoed in five vectors — `counterparty_binding_happy_path`,
`_envelope_byte_equality`, `_base64url_tolerance`, `_opaque_receipt_ref`,
`_transport_label_non_trust` — and is **still present upstream**: `git fetch`
2026-09-02 14:4xZ puts the tip at `f67ecad0fefd947ea9b99ae638e4637add256cd1`,
*"fix(verifier): resolve the signing key by the signed thumbprint, then kid,
agent bind, issuer (#448)"*, 2026-09-02 11:52:03 +0200, where
`grep -c DWyIoW6W conformance/vectors.json` returns **13** — the same 13 lines
across the same five vectors as at `05c1c49`. Twenty-nine days after `#416` the
derived value has not been recomputed.

This narrows M6 without softening it. What no test asserts is unchanged; the
finding now names the mechanism (a derived literal not recomputed when its input
moved) rather than only the symptom, and the fix is a recomputation of one
value, not an investigation.


### M7. Eight of sixteen `asqav-*` vectors carry no anchor and expect `verified`, against §5.4's own MUST

`-08` §5.4, lines 1052 and 1074–1075:

> Compliance Receipts MUST be anchored.

> Verifiers MUST reject Compliance Receipts that lack at least one valid anchor.

Against the vectors at `05c1c49`:

| `anchors` | vectors | of which expect `verified` |
|---|---|---|
| one or more anchors | 2 | 2 |
| `[]` (empty) | 12 | 6 |
| `null` | 2 | 1 |

Eight vectors — `asqav-01-genesis-permit`, `asqav-02-genesis-deny`,
`asqav-03-chain-link`, `asqav-08-v2-signer-canary`, `asqav-10-hash-mode-multikey`,
`asqav-14-omitted-action-chain`, `asqav-15-unsigned-gap`,
`asqav-16-chain-emission-blocked` — carry no anchor and declare
`"outcome": "verified"`. A verifier implementing §5.4's MUST as written rejects
all eight and fails the author's own conformance corpus.

Three of those eight are the selective-omission vectors that commit `05c1c49`
exists to publish, and the same commit is the one `-08` pins as its reference.

**Scope of the negative:** the sixteen `asqav-*` directories under
`verifier/conformance-vectors/` at `05c1c49`, read from blob bytes. The
`acta-*`, `aerf-*`, `agentreceipts-*`, `w3c-vc-*` and other families were not
examined for this, being other formats; `conformance/vectors.json` declares no
anchors and was not counted.

No verdict is offered on which side should move. It may be that §5.4's MUST is
meant to bind issuers in production and not the conformance corpus, in which
case the corpus is right and the sentence is wider than its intent — the same
shape as A1 in the 2026-09-01 block of `FINDINGS.md`. That is the author's call,
as M5 was.

---

## Forward note — `-09`, which does not exist as bytes

`-09` is expected to move the `counterparty_binding` scope to
envelope-minus-anchors, correct §5.7 to match §4, and add an explicit `scope`
member to `counterparty_binding`, with the vector that carries an `envelope_hash`
re-pinned. **A reader of this document in November must not implement §5.7 of
`-08` as it stands.** The three-key rule is graded here as published because that
is what `-08` published and because the author directed that it be graded that
way; it is superseded by design, not by accident.

No verdict is rendered on `-09`. It has not been published, this side has not
seen its bytes, and nothing in this document should be read as having checked it.

---

## The adapter

`src/adapters/acta.ts` declines the `-08` envelope shape at detection: a
top-level `anchors` array means a Compliance Receipt, never an ACTA §2.1
envelope, so the adapter returns `false` from `detect()` rather than grading it
under the whole-receipt scope and returning a false `INVALID`.

That refusal is load-bearing rather than tidy. `-08` §11.2 (lines 3764–3767)
forbids a verifier from retrying the other scope when one fails — so an adapter
that claimed a Compliance Receipt would be forbidden by the draft's own rule from
the retry that might have exposed the mistake. Wrongly claiming the format is
therefore unrecoverable by design, which is why detection is where this is
enforced.

Five tests were added to `test/acta.test.ts`, against the author's own vector
`asqav-03-chain-link/receipt.json` (sha256 `f9f29b753d19c4cb…`):

| test | asserts |
|---|---|
| `pins the vector bytes this block reads` | the fixture is the upstream blob bytes, not a CRLF-rewritten checkout |
| `does not claim a -08 envelope, so it cannot mis-grade one as ACTA` | `detect()` is `false` |
| `leaves the format unrecognized rather than naming a wrong one` | `detectFormat()` returns `ok: false`, `reason: "none"`, no candidates |
| `declines on the anchors key itself, not on some incidental malformation` | **control** — with `anchors` deleted, the same bytes **are** claimed |
| `names the -08 pin by digest in the coverage sources` | the `-08` sha256 appears in `coverageFor("acta.receipt/0").sources` |

The fourth is the one that makes the other three mean something: without it, the
refusal would pass whether it fired on the `anchors` rule or on some unrelated
parse failure. It fires on the rule.

**This tool grades no Asqav content beyond that refusal.** There is no Asqav
adapter and none was built in this session: every `asqav.*` check is
`not_implemented`, the tool reports `format_unrecognized` rather than positively
naming the format, and the coverage manifest for `acta.receipt/0` now names the
`-08` pin by digest as the source of the decline rule and says so in the same
sentence.

A related check ran while the vectors were open, since `-08` makes a byte-level
claim about them at line 1039 — *"The published conformance vectors
asqav-03-chain-link (payload scope) and acta-02-chain-link (whole-receipt scope)
corroborate it byte-for-byte"*:

| vector | claimed scope | `previousReceiptHash` | recomputed under the claimed scope | under the other scope |
|---|---|---|---|---|
| `asqav-03-chain-link` | payload member `R` | `88051bbc8ba5f41f…` | **matches** | does not match (`d8987931…`) |
| `acta-02-chain-link` | whole receipt incl. signature | `2ac1941ca92e32ca…` | **matches** | does not match (`8cc38bc4…`) |

Each vector matches its own scope and only its own scope, so the check could have
failed and did not. **`-08`'s claim at line 1039 holds.** The chain-scope half of
this profile — errata 1–3, E3/E4/E5 — is resolved in text *and* corroborated in
the author's shipped vectors. The counterparty-binding half is resolved in
neither.

---

## Suite baseline

| | before (commit `4bdc9b6`) | after |
|---|---|---|
| test files | 15 | 15 |
| passed | 396 | 401 |
| skipped | 13 (live and network-gated) | 13 |
| failed | 0 | 0 |
| total | 409 | 414 |

Net +5, all in `test/acta.test.ts` (36 → 41). No existing test was changed or
deleted. `src/coverage.ts` gained one `sources` entry for the `acta.receipt/0`
format and no check definition; `test/coverage.test.ts` is unchanged and green.

Suite-green is reported here and is not offered as evidence for any verdict
above. It shows that adding these five assertions broke nothing; it says nothing
about whether `-08` is right.

---

## BEFORE / AFTER

| # | Erratum as sent | `-07` | `-08` | Verdict |
|---|---|---|---|---|
| 1 | §5.3's mandated scope contradicts the section it cites as its authority | line 738 cites §5.7 as the authority; line 759 claims it "matches Section 5.7" | lines 957–961 state it as a "deliberate override" of that section, naming what it overrides and what it substitutes | **RESOLVED** |
| 2 | Within §5.3, the exclusion clause and the rationale clause select different bytes — three candidates for one field | lines 743–744: describing parenthetical plus exclusion clause | lines 944–948: `SHA-256(JCS(R))`, `R` defined once as the payload member | **RESOLVED** |
| 3 | The rule restated in the notation of the scope it rejects | line 778: `SHA-256(JCS(receipt))` | lines 1014–1018: `SHA-256(JCS(R))`, "R as defined at the start of this section" | **RESOLVED** |
| 4 | The genesis stipulation and its attribution — asked to survive | line 746 | lines 974–978, parenthetical and attribution intact, citation form updated | **RESOLVED — survived** |

| entry | `-07` | `-08` | Verdict |
|---|---|---|---|
| E3 | §5.3, 738 / 759 | §5.3, 957–961; §4, 651–657 | **RESOLVED** |
| E4 | §5.3, 743–744 | §5.3, 944–948 | **RESOLVED** |
| E5 | §5.3, 778 | §5.3, 1014–1018 | **RESOLVED** |
| E8 | §5.3, 735 / 746 | §5.3, 939–940 / 974–978 | **RESOLVED — preserved** |

| new | subject | status |
|---|---|---|
| **M5** | `-08` states the `envelope_hash` scope two ways (§4 line 657 vs §5.7 lines 1351–1369; change list 7249–7253 agrees with §5.7) | Author-acknowledged 2026-09-02 13:07:20Z; §4 is the intent, `-09` corrects §5.7 and adds `counterparty_binding.scope`. Graded here as `-08` reads: the three-key object |
| **M6** | the published `counterparty_binding.envelope_hash` matches neither scope, and disagrees with its own vector's `sha256` | **OPEN** — reported to the author with the two recomputed digests |
| **M7** | 8 of 16 `asqav-*` vectors carry no anchor and expect `verified`, against §5.4's "Verifiers MUST reject" | **OPEN** — no verdict offered on which side moves |

**All four errata are RESOLVED as sent.** The chain-digest scope is settled in
text and corroborated byte-for-byte in the author's own vectors. The
counterparty-binding scope is not settled in either: `-08` states it two ways, and
the vector meant to demonstrate it hashes something that is neither.
