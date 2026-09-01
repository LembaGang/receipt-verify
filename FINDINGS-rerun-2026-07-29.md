# FINDINGS — rerun 2026-07-29

A re-verification of four errata against the artifacts published in response to
them. Each verdict is stated against the erratum **as sent**, quoted verbatim
below, and cites values recomputed here from the pinned bytes.

`FINDINGS.md` is not amended by this document. Its entries record what was
observed on 2026-07-25 and 2026-07-28 and remain accurate as of those dates and
those pinned bytes. Where an entry's subject has since changed, the change is
recorded here and cross-referenced, never edited in place. New observations are
opened as a separate `R` series so the two numbering spaces cannot collide.

---

## Disclosure state

| field | value |
|---|---|
| errata sent | 2026-07-28 ~09:45 UTC, Discord, to the draft author |
| errata count | 4 |
| fix announcement | 2026-07-29 ~05:29 UTC, same channel |
| rerun performed | 2026-07-29 |
| fix sources | pinned below, by fetched digest |

This is the first use of a disclosure-state field. `FINDINGS.md` records
observations but carries no field saying whether an entry was disclosed, to
whom, or when — which is why the set of four could not be reconstructed from the
repository alone and had to be supplied from the thread export.

---

## What was fetched, and what it digests to

Every value below is the digest of bytes retrieved during this rerun. No SHA is
carried over from the announcement or from prior notes.

### Revisions

| source | resolved | committed | subject |
|---|---|---|---|
| `TKCollective/agentoracle-receipt-spec` | `99a0d397cc187b0c487725f411f0e3246b229150` | 2026-07-29T04:58:03Z | regenerated composed v0.3 vectors |
| `TKCollective/agentoracle-receipt-spec` | `196df22b255e7173d4eb6b20e833cc4e8ae6d35d` | 2026-07-29T05:17:01Z | rebuilt detached fixture |

`196df22` is `main` and `HEAD`, and its parent is `99a0d39`. The eleven composed
vectors are byte-identical at both commits (compared file by file), so the
snapshot pins `196df22` and carries the `99a0d39` content unchanged. Trees were
enumerated with `truncated: false` at both.

`tools/snapshot.mjs` previously fetched this repository at `HEAD`. It now pins
`GH_COMMIT` explicitly: a moving ref means a re-run silently re-bases every
fixture on whatever the branch tip happens to be, and the provenance table then
records a digest for bytes nobody chose.

### Files (retrieved 2026-07-29T09:49Z)

| file | source | bytes | sha256 |
|---|---|---|---|
| mapping document | `agentoracle.co/mappings/0a78…d7b0.json` | 2008 | `0a78263976790df6e76cd9f3f441bf5a3b5c3a82e346b5aca43e49626881d7b0` |
| mapping document (id alias) | `agentoracle.co/mappings/agentoracle-v0.3-2026-05-30.json` | 2008 | `0a78263976790df6e76cd9f3f441bf5a3b5c3a82e346b5aca43e49626881d7b0` |
| issuer JWKS | `agentoracle.co/.well-known/jwks.json` | 629 | `5cef45bb61ffe955113ca744e0fd131c9423831b2972a06aa2ad5a3bc328e2b8` |
| detached fixture | `…/196df22…/examples/sample_receipt_detached_jws.json` | 362 | `de9f46b5af71d5b32c5925bc822d24f0e2099a4b5da6295d8260d6c6c9e8382d` |
| detached canonical payload | `…/196df22…/examples/sample_receipt_detached_payload_canonical.bin` | 1315 | `b1bf26165f251af4c9d756bcae4b512d31f93f092d0c1cec53b7091ad3f4047a` |
| fixture JWKS | `…/196df22…/examples/jwks-fixture-detached.json` | 1300 | `ff18e1b30a3de9fd9615dc1d3a7afb6f270190afa73263d00436e602a403ef1f` |

Full per-file table in `fixtures/provenance.md` (74 snapshot entries).

The two mapping URLs serve byte-identical bodies. The id alias is the one
`resolveMapping` reads; the digest-addressed copy is pinned alongside it at
`fixtures/verification-state/mappings/published/` as evidence that the two
addresses agree.

---

## Correspondence to `FINDINGS.md`

The four errata were matched to entry text, not to recollection. Two of the four
IDs supplied from memory do not survive that check:

| erratum | binds to | note |
|---|---|---|
| 1 — mapping does not resolve | **B4** | A4 is background (the draft specifies no schema, serialization, or location for the document at all); the operative claim is B4's, about the fixtures |
| 2 — README says 7797, fixture is 7515 | **B2** | exact |
| 3 — signs stringify order, not JCS | **B3** | exact; the erratum's closing clause ("the composed set … all eleven — that part is exactly right") is B8 |
| 4 — 7 / 6 / 7 enum split | **A1** | exact |

- **A1 and B4 are confirmed** as remembered.
- **A2 does not correspond to any of the four.** A2 records that
  `v_gate_mapping_hash` has three spellings (bare hex, `sha256:`, `sha256-`)
  across the draft and its fixtures. No erratum as sent raises it. It is not
  reopened here and no verdict is rendered on it.
- **A4 is background to erratum 1, not its operative claim.** Erratum 1 is
  about the fixtures' document failing to resolve; A4 is about the draft
  specifying no schema for such a document. A4's substance is untouched by the
  fix — see the residual under erratum 1.
- **B2 and B3 were absent from the remembered list** and are two of the four.

---

## Method

Signatures, digests and canonical byte strings were recomputed from the pinned
bytes rather than read from any declared value. Where the repository's own
adapter was used, an independent second implementation was run alongside it and
the two agreed; suite-green is reported separately and is not offered as
evidence for any verdict.

---

## Erratum 1 — mapping resolution

**As sent:**

> "Your composed v0.3 fixtures come back UNVERIFIABLE end-to-end. Not the
> signatures — those verify clean against your live JWKS, recorded separately —
> but §4.3 step 2: the fixtures' v_gate_mapping document doesn't resolve from
> the spec repo or any path a stranger follows from the receipt alone. Your Jun
> 8 note shows it exists and hash-matches on your endpoints, so this reads as a
> resolution-path gap, not an existence gap — but per your own §4.6 the mapping
> is mandatory and content-addressed, so until a stranger can fetch it, a
> stranger can't verify."

**Before** — the eleven composed fixtures bound
`agentoracle-v0.3-2026-05-30` →
`sha256-3b1f2d8e7a5c4b9f6e0a1d2c3b4a5e6f7c8d9e0a1b2c3d4e5f6a7b8c9d0e1f2a`.
No document producing that digest was published at any location the receipts,
`vectors.json`, or the draft named. All seven accept vectors returned
`UNVERIFIABLE` / `mapping_unresolvable`, having passed step 1 (`FINDINGS.md` B4).

**After — recomputed evidence.**

The stranger path, run end to end from a composed fixture with no private
knowledge: read `v_gate.v_gate_mapping_hash` from the receipt, strip the
`sha256-` prefix, fetch `https://agentoracle.co/mappings/<hex>.json`, digest
what comes back.

```
digest carried in all 11 fixtures  0a78263976790df6e76cd9f3f441bf5a3b5c3a82e346b5aca43e49626881d7b0
content-address in the fetch URL   0a78263976790df6e76cd9f3f441bf5a3b5c3a82e346b5aca43e49626881d7b0
sha256(body as served, 2008 B)     0a78263976790df6e76cd9f3f441bf5a3b5c3a82e346b5aca43e49626881d7b0
sha256(JCS(parsed body))           0a78263976790df6e76cd9f3f441bf5a3b5c3a82e346b5aca43e49626881d7b0
body === JCS(parsed body)          true  (byte-identical, 2008 == 2008)
id alias === digest-addressed      true  (byte-identical)
```

The document is served as its own JCS bytes, so the digest over the file as
served and the digest over its canonicalization are the same value. A verifier
that canonicalizes before digesting and one that digests the raw body agree —
which is the property that makes the content address usable without a
serialization convention having to be agreed separately.

Full protocol recompute across all eleven, signatures verified against the
bundled JWKS, `v_gate` leg carried through §4.3 steps 2–6, composition
recomputed:

| vector | JCS == signed bytes | `expected_canonical_sha256` | all signatures | §4.3 step 2 | verdict |
|---|---|---|---|---|---|
| comp-001 … comp-007 | 7/7 | 7/7 | 7/7 | resolves + hash-matches | `VALID` (exit 0) |
| comp-r01 | ✓ | — | 1 of 2 fails (by design) | resolves | `INVALID` / `signature_invalid` |
| comp-r02 | ✓ | — | ✓ | resolves | `UNVERIFIABLE` / `malformed_member` |
| comp-r03 | ✓ | — | ✓ | resolves | `UNVERIFIABLE` / `recompute_mismatch` |
| comp-r04 | ✓ | — | ✓ | resolves | `UNVERIFIABLE` / `recompute_mismatch` |

`base64url-decode(jws-NNN.payload)` equals `canonicalize(payload-NNN.json)` for
all eleven, and `expected_canonical_sha256` equals SHA-256 of those bytes for
all seven accept vectors — B8's property survives the regeneration.

The published document's rules were also checked against this repository's own
transcription of §5.1 Table 2 across the entire input domain — 4 verdicts × 3
adversarial states × 5 confidence values spanning the threshold, 60 cells. The
two agree on recommendation and gate in every cell. They are independent
transcriptions of the same table, so this is a cross-check, not a tautology.

**Verdict: FIXED-AND-VERIFIED.**

**Residuals, stated precisely and outside this erratum's scope:**

1. `v_gate_skill` binds `agenttrust-v0.3-2026-06-07` →
   `sha256-307db9faa364cfe149fb5120d0451175175de40d7433c44915bfec57acc16ec4`,
   unchanged. No document producing that digest is resolvable from anything in
   the pinned snapshot. That leg belongs to a different issuer, is not the
   `v_gate` leg §4.3 step 2 operates on, and was not what made the fixtures
   `UNVERIFIABLE`. `agenttrust.uk` was not probed — outside the fetch scope of
   this rerun. Previously recorded within `FINDINGS.md` B4; not reopened.
2. A4 is unaffected. The draft still specifies no schema, no serialization, and
   no resolution convention for a mapping document. This fix supplies a
   document and a resolution path *for one issuer, by publication*, not a
   specified one. `src/mapping.ts` now reads the published schema in addition
   to the one it defined; that the two agree on all 60 cells was checked, not
   assumed.

---

## Erratum 2 — RFC 7797 vs RFC 7515

**As sent:**

> "The detached fixture's README says RFC 7797 b64=false; the fixture itself is
> ordinary RFC 7515 detached — no b64, no crit."

**Before** — decoded protected header of `sample_receipt_detached_jws.json`:

```json
{"alg":"EdDSA","kid":"ao-receipt-2026-04-ed25519-f2753b7c","typ":"application/vnd.agentoracle.receipt+jws","cty":"application/json"}
```

No `b64`, no `crit`. RFC 7797 §3 requires `"b64": false` to be present and
listed in `crit` (`FINDINGS.md` B2).

**After — recomputed evidence.** Decoded protected header at `196df22`:

```json
{"alg":"EdDSA","b64":false,"crit":["b64"],"cty":"application/json","kid":"ao-fixture-detached-rfc7797-2026-07-ed25519-0f8bf2a5","typ":"application/vnd.agentoracle.receipt+jws"}
```

```
b64 present and === false      true
crit === ["b64"]               true
signing input form             ASCII(BASE64URL(protected)) || "." || raw payload octets
verifies under that form       true
verifies under RFC 7515 form   false   (base64url-wrapped payload)
```

The mismatch is resolved in the fixture's favour: the artifact was rebuilt to
match the README's standing description, rather than the description being
weakened to match the artifact. The README sentence erratum 2 quoted is
therefore unchanged, and is now true of the fixture.

**Verdict: FIXED-AND-VERIFIED.**

**Declared design, recorded as such, not as a finding:** the fixture's private
key half is committed at `examples/jwks-fixture-detached.json`, under kid
`ao-fixture-detached-rfc7797-2026-07-ed25519-0f8bf2a5`, with the public half
served from the live JWKS. The file states the intent in its own `_comment`,
and the README states it in points 2 and 3. Reproducibility of a fixture is the
stated reason. The kid is labelled `ao-fixture-` and is distinct from the three
production kids in the same JWKS, whose private halves are not published.

---

## Erratum 3 — signing input canonicalization

**As sent:**

> "The detached sample pair signs over JSON.stringify insertion order, not JCS —
> measured byte-identical to stringify, no match to canonicalized. April's
> silent failure mode, live in one fixture. The composed v0.3 set, by contrast,
> is correctly JCS-canonicalized with matching declared digests, all eleven —
> that part is exactly right."

**Before** — the signed bytes were byte-identical to
`JSON.stringify(JSON.parse(sample_payload.json))` (1315 B, beginning
`{"receipt_version":"0.1",…`) and did not match the JCS form of the same object.
A detached verifier reconstructing the payload from `sample_payload.json` and
canonicalizing per RFC 8785 produced a different signing input and the signature
failed (`FINDINGS.md` B3).

**After — recomputed evidence.** Four candidate payload byte strings, each
derived here from the pinned bytes, then used as the RFC 7797 signing input:

| candidate | length | sha256 | verifies |
|---|---|---|---|
| `JCS(sample_payload.json)` | 1315 | `b1bf2616…4047a` | **true** |
| shipped `…payload_canonical.bin` | 1315 | `b1bf2616…4047a` | **true** |
| `JSON.stringify(sample_payload.json)` | 1315 | `80a54bbd…c824a` | false |
| raw `sample_payload.json` bytes | 1684 | `516eb4a5…41c74` | false |

```
JCS(sample_payload.json) === shipped canonical.bin   true (byte-identical)
JCS form begins                                      {"confidence":{"calibration_anchor":…
stringify form begins                                {"receipt_version":"0.1",…
announced payload sha256                             b1bf26165f251af4c9d756bcae4b512d31f93f092d0c1cec53b7091ad3f4047a
independently derived, from sample_payload.json      b1bf26165f251af4c9d756bcae4b512d31f93f092d0c1cec53b7091ad3f4047a
```

The announced digest was reproduced by canonicalizing the published
`sample_payload.json` here, not by hashing the shipped `.bin` — the `.bin` is
then confirmed byte-identical to that result. The reconstruct-and-canonicalize
path a stranger follows now yields a verifying signature, which is the failure
mode the erratum named.

The erratum's closing clause is re-confirmed on the regenerated set: all eleven
remain JCS-canonicalized with `expected_canonical_sha256` matching (table under
erratum 1).

**Verdict: FIXED-AND-VERIFIED.**

Residual: the attached member of the pair is unchanged and still signs
stringify-order bytes. That is not within this erratum's operative claim — the
silent failure mode it names is specific to the detached form, where the payload
is reconstructed rather than carried — but the two fixtures now demonstrate
different canonicalizations. Opened as **R2** below.

---

## Erratum 4 — the `v_recommendation` enumeration

**As sent:**

> "Draft erratum: §2 defines seven v_recommendation values, §4.2 lists six, and
> §5.1's table requires the missing un_probed_not_cleared."

**Before** — `FINDINGS.md` A1: §2 (lines 244–247) enumerates seven, §4.2 (lines
366–369) six, omitting `un_probed_not_cleared`; §5.1 Table 2 (line 530) requires
that value as the recommendation for `(supported, >= threshold, not_checked)`.

**After — recomputed evidence, in two parts.**

*Published mapping document — fixed.*

```
enums.v_recommendation   ["confident_supported","un_probed_not_cleared","vulnerable_supported",
                          "weak_supported","refuted","unverifiable","error"]
count                    7
includes un_probed_not_cleared   true
gate_map total over the enum     true   (all 7 keyed)
gate_map.un_probed_not_cleared   halt
rule 2: {v_verdict: supported, v_confidence: ">=threshold",
         v_adversarial_result: not_checked} -> un_probed_not_cleared
```

Rule 2 is §5.1 Table 2's row for `(supported, >= threshold, not_checked)`, and
it derives the value §4.2 omits. The document is internally total: every value
in its own enum has a gate mapping.

*Draft text — unchanged.*

```
refs/draft-krausz-verification-state-01.txt
  re-fetched 2026-07-29, 39466 B,
  sha256 22c5ce262bdf4e63ef538a308e7a8455e93c4143b9e1726b7b64720615d516db
  — identical to the pin taken 2026-07-28; no silent revision

§2   lines 244-247  seven values, un_probed_not_cleared present
§4.2 lines 366-369  six values, un_probed_not_cleared absent
§5.1 line 530       Table 2 requires un_probed_not_cleared
```

`https://www.ietf.org/archive/id/draft-krausz-verification-state-02.txt` returns
**404**. No `-02` revision is published as of this rerun.

A verifier that treats the §4.2 list as the closed enum still rejects a receipt
that §5.1 requires an issuer to produce. The mapping document does not close
that gap, because the enum a verifier validates against comes from the draft
text, not from a per-issuer mapping.

**Verdict: PARTIALLY-FIXED.**

**Residual, stated precisely:** the canonical seven-value enum is fixed in the
published mapping document; the §2 / §4.2 / §5.1 text divergence in
`draft-krausz-verification-state-01` is unchanged and no `-02` is published.
This matches the announced schedule — the text alignment was stated as deferred
to the `-02` pass, after 2026-08-02. Planned, not missed.

---

## New findings

Opened by this rerun. Numbered in a separate `R` series; no `FINDINGS.md` entry
is amended or reopened.

### R1. A recompute the fixtures declare had no implementation here, and became reachable when step 2 stopped refusing

*Source: this implementation.*

`vectors.json` declares `comp-r04` with `expected_failure:
screen_ref_action_ref_mismatch` — `screen_ref.action_ref` is present but does
not equal the `action-ref-v1` recompute of the four-field `screen` preimage it
carries.

`receipt-verify` did not implement that recompute. While §4.3 step 2 refused for
`mapping_unresolvable`, this was invisible: `comp-r04` returned `UNVERIFIABLE`
before reaching any condition, and was recorded as "correctly non-VALID, for a
reason other than the declared one" (`FINDINGS.md` B7). With the mapping
resolvable, the receipt ran to the end of the implemented protocol and returned
**`VALID`** — a determinate accept on a vector its own corpus declares must be
rejected.

Recomputed, `action-ref-v1` = lowercase-hex SHA-256 over the JCS bytes of the
`screen` object:

| vector | declared `action_ref` | recomputed | |
|---|---|---|---|
| comp-005 | `c832ef86…50a2` | `c832ef86…50a2` | match |
| comp-006 | `79509b33…7ef4` | `79509b33…7ef4` | match |
| comp-007 | `d9f8ecb3…911d` | `d9f8ecb3…911d` | match |
| comp-r04 | `00000000…0000` | `c832ef86…50a2` | **mismatch** |

Implemented in `src/adapters/verification-state.ts`; `comp-r04` now returns
`UNVERIFIABLE` / `recompute_mismatch` naming `action-ref-v1`. `comp-r03`
likewise now fails on the `AND_PRESENT` composition rule it was built to test
rather than on the mapping. Both halves of B7 are resolved.

The general point is not about one check. A fail-closed refusal early in a
protocol masks every unimplemented check after it, and the masking is silent:
the verdict is correct, the reason is wrong, and nothing distinguishes "this
check ran and passed" from "this check does not exist here" until the early
refusal is removed. `failed_at_step` records how far the protocol got; there is
no corresponding record of which checks past that point are implemented.

### R2. The two sample fixtures now demonstrate two canonicalizations under two keys

*Source: `TKCollective/agentoracle-receipt-spec` @ `196df22`.*

`sample_receipt_attached_jws.json` is byte-identical at `99a0d39` and
`196df22` — unchanged by the rebuild. It signs
`sha256 80a54bbd286ade5355ab77bc5b6faffba0d7442bc5f3b84b9df26f97db1c824a`
(stringify insertion order) under kid `ao-receipt-2026-04-ed25519-f2753b7c`.
`sample_receipt_detached_jws.json` signs
`sha256 b1bf26165f251af4c9d756bcae4b512d31f93f092d0c1cec53b7091ad3f4047a`
(RFC 8785 JCS) under kid `ao-fixture-detached-rfc7797-2026-07-ed25519-0f8bf2a5`.

```
attached.protected === detached.protected   false
attached.signature === detached.signature   false
```

`FINDINGS.md` B1 recorded the two as byte-identical in `protected` and
`signature`, the detached one differing only by omitting `payload`. That
relationship no longer holds. This is a consequence of the announced key
rotation, not a defect: the two files are now distinct fixtures rather than two
serializations of one receipt. Recorded because a reader following B1 will find
it no longer describes the artifacts, and because the pair is the natural place
an implementer would look to compare attached and detached handling of the same
payload — and the same payload is no longer what they carry.

### R3. No published artifact exercises the production detached wire format

*Source: `TKCollective/agentoracle-receipt-spec` @ `196df22`, `examples/README.md`.*

`README.md` line 60 states "The production wire format is **detached** JWS (RFC
7797, `b64=false` flow)", and line 15 describes
`sample_receipt_detached_jws.json` as "matches the production wire format". Both
lines are byte-identical to their pre-rebuild text.

README point 3 now states that the detached sample is signed with a
fixture-suite key and that "No production key is ever exposed by this design".
The only production-key-signed sample, `sample_receipt_attached_jws.json`, is
attached and signs stringify-order bytes (R2).

So the set contains no artifact that is both detached and production-signed. The
claim at lines 15 and 60 was checkable and false before the rebuild
(`FINDINGS.md` B2); it is now not checkable from published material. Nothing
here asserts the claim is untrue — only that no published artifact bears on it.

---

## Suite baseline

Re-run after re-pinning, across all three formats.

| | before (2026-07-28, commit `886b0b6`) | after (2026-07-29) |
|---|---|---|
| test files | 8 | 8 |
| passed | 213 | 222 |
| skipped | 3 (live, network-gated) | 3 (live, network-gated) |
| failed | 0 | 0 |
| total | 216 | 225 |

With `RECEIPT_VERIFY_LIVE=1`: 224 passed, 1 skipped, 0 failed. The live-JWKS
test confirms the pinned snapshot still matches the key material the endpoint
serves, and that the published sample receipt verifies against the live key.

Intermediate state, recorded because it is the measurement that matters: against
the newly pinned bytes and *before* any test was touched, the suite was **13
failed / 200 passed**. Twelve of the thirteen were assertions encoding the
pre-fix artifacts — `mapping_unresolvable` on the seven accept vectors, the
RFC 7515 header shape, the stringify-order signing input, the shared
attached/detached signature. Those are the errata being closed, asserted from
the other side; each was rewritten to assert the post-fix property so that a
revert upstream fails the suite. The thirteenth was R1.

Net +9 tests: +5 rewritten or added around the detached fixture and the
composed vectors, +4 on the published mapping document including the 60-cell
equivalence check against this repository's transcription.

No test was deleted to make the suite pass. `acta` (35), `evidence-action` (27)
and `contract` (41) are untouched by this work and unchanged in count — the
re-pin did not disturb the other two formats.

---

## BEFORE / AFTER

Spec-and-format summary, suitable for quoting.

| # | Erratum | Before | After | Verdict |
|---|---|---|---|---|
| 1 | `v_gate_mapping` document did not resolve from the receipt alone; §4.3 step 2 could not complete | 7/7 accept vectors `UNVERIFIABLE` / `mapping_unresolvable` | Document published and content-addressed; `sha256(body) == URL content-address == digest carried in all 11 fixtures`; 7/7 `VALID`, 4/4 reject vectors fail at their declared condition | **FIXED-AND-VERIFIED** |
| 2 | Detached fixture declared RFC 7797 `b64=false` but carried no `b64` and no `crit` | Ordinary RFC 7515 detached JWS | `"b64":false` present, `"crit":["b64"]` present; verifies under the RFC 7797 §3 signing input and not under the RFC 7515 one | **FIXED-AND-VERIFIED** |
| 3 | Detached sample signed over `JSON.stringify` insertion order, not a canonical serialization | Reconstruct-and-canonicalize produced a different signing input; signature failed | Signing input is RFC 8785 JCS, `sha256 b1bf2616…4047a`, independently reproduced from the published `sample_payload.json`; stringify-order input does not verify | **FIXED-AND-VERIFIED** |
| 4 | §2 lists seven `v_recommendation` values, §4.2 six, §5.1 Table 2 requires the omitted `un_probed_not_cleared` | Divergence in the `-01` text | Published mapping document carries the canonical seven-value enum, gate-mapped in full, and derives `un_probed_not_cleared` at rule 2. Draft text unchanged; no `-02` published (404); text alignment deferred to the `-02` pass | **PARTIALLY-FIXED** — residual is the draft text only |

Three new observations were opened by the rerun (R1–R3 above). One concerns this
implementation; two concern the published sample fixtures.

---

## Appendix — history rewrite, 2026-07-29

Every commit in this repository was rewritten so that author and committer are
one canonical identity, and each was re-signed. Two early commits had been
authored as `receipt-verify <mmsebenzi@gmail.com>`, which is a project name, not
a person; a signature over a commit whose author is not a person attests less
than it appears to.

The repository has no remote and has never been pushed or fetched, so the
rewrite reconciles with nothing published and requires no force-push.

Commit SHAs therefore changed. Local SHAs cited anywhere in this repository were
updated to their post-rewrite equivalents; upstream pins (`GH_COMMIT` in
`tools/snapshot.mjs`, the revisions in `fixtures/provenance.md`, and every digest
under `refs/`) are foreign SHAs and content addresses and are untouched.

| before | after | subject |
|---|---|---|
| `a39b3be67b7ca6b7f8622e97afe0d1a4f9a6f54c` | `acbd5dd69c3f84c062ab8c599fd6ab05adadc8bc` | receipt-verify 0.1.0-dev: tri-state cross-format receipt verifier |
| `16ad1bd095e0dcc1e705a7a3868c0ebdff031585` | `14d1185bef1fb477c23218c4649e7dfe9b86763f` | Pin fixture bytes: never normalize line endings under fixtures/ and refs/ |
| `0822c422f27edc303e8c849cbbb97537f7304579` | `886b0b6099d98f897f313305d228f5f7e50edb4e` | feat: ACTA adapter (acta.receipt/0) |
| `b45815ed9973b339793d45dba824691b574960dd` | `2f6ac797c6f6659f4f147ee32bd5c2b2637b3715` | Re-verify four errata against the published fixes |
| `702bd8a6be270e769316636cf8677609fa8e064b` | `0e3947b61ee0c08234a05ee154940a409c21872b` | Coverage manifest |

The single in-repository citation of a rewritten SHA was the suite-baseline row
above, which named the pre-rerun commit.


---

# APPENDED 2026-09-01 — FULL-HISTORY AUDIT BEFORE EXTERNAL CIRCULATION

**Supersede, never edit. Everything above stands as a record of 2026-07-29.**

### B1. "The repository has no remote and has never been pushed or fetched" (lines 506-507)
True when written. False from 2026-08-10: `origin` is `https://github.com/LembaGang/receipt-verify.git`
and `origin/master` is `cbe4d38`. The rewritten history has since been pushed, and the remote carries
the post-rewrite SHAs listed in the Appendix. The sentence's argument held on its date and does not
hold now.

### B2. The address at line 502
That line records that two early commits were re-authored from `receipt-verify <mmsebenzi@gmail.com>`
to one canonical identity. Verified 2026-09-01: the address appears in zero commit author or
committer fields, so the rewrite achieved what it describes; the prose describing it is now the only
place the address appears in this repository. It stands, with this note.

### B3. "74 snapshot entries" (line 65)
The snapshot table in `fixtures/provenance.md` carries 73 rows (lines 16-88, counted three ways on
2026-09-01). The generated-here table is separate and carries 81. No combination yields 74.

### B4. Retrieval timestamps
Line 54 gives 2026-07-29T09:49Z for three files. `fixtures/provenance.md` records the same three, same
digests, fetched at 10:01:35-38Z. The 09:49Z fetch was the first; the 10:01Z fetch re-pinned the same
bytes and is the one the provenance table records. Same bytes, two clocks.

### B5. Two references inside the quoted errata point outside this repository
"Your Jun 8 note" (lines 116-118) and "April's silent failure mode" (lines 245-246) are this
repository author's own words, quoted above as sent to the draft author, and refer to earlier private
correspondence between the two in the same channel: the draft author's note of 8 June, and an April
exchange. Neither is in this repository, and neither is needed to check anything here; every verdict
above is recomputed from the pinned bytes. The draft author cleared the quoted errata for external
circulation, unrestricted, on 2026-08-31, asking only that they not be excerpted from their repair
timeline — the Disclosure state table at the top of this file.

### B6. R3's title is wider than its body
Line 426, "No published artifact exercises the production detached wire format", is scoped by its own
body (lines 442-443) to `TKCollective/agentoracle-receipt-spec @ 196df22`, `examples/README.md`, and
the body says "nothing here asserts the claim is untrue." Read the title with the body's scope.
