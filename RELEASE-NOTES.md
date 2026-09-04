# Release notes

Shipped versions, newest first. Entries queued against the next release live in
`RELEASE-NOTES-NEXT.md` and move here when they ship.

## 0.1.2 (unreleased at the time of writing; the tag goes on the commit that carries this file)

What shipped since 0.1.1, grouped. Every hash named below is a commit in this
repository in the range `cbe4d38..HEAD`, where `cbe4d38` is the single commit
that both the `v0.1.0` and `v0.1.1` tags resolve to.

### The CLI exit-code drain

Shipped in `17172e4` (2026-09-02). `src/cli.ts` sets `process.exitCode` and lets
the event loop drain instead of calling `process.exit(exitCode)`. This is the fix
that 0.1.1 shipped without committing: the published tarball carried it three
weeks before the repository did, which is the defect recorded in the 0.1.1
section below. The same commit added `--require-delivery`, the delivery fixtures,
the exit-code contract tests and `DESIGN_probe-command.md`.

### The adapters, and what each reads

`insight.attestation/eip712` is new in 0.1.2. `076a87c` (2026-09-02) added it,
written from EIP-712 itself rather than taken from a library, using
`@noble/hashes` for keccak-256 and `@noble/curves` for secp256k1 public-key
recovery as primitives only, and with a coverage manifest that declares
`precedence` and `observations` as not checked and prints them on every result
including VALID. Its sole external source is Insight's key registry at
`/.well-known/oracle-keys.json`, pinned by digest under `refs/`. `7506c18`
(2026-09-02) made it read three schema versions: the registry type is looked up
by the artefact's own `schemaVersion` rather than by whatever the registry
currently calls that type, so a v2 receipt is compared against the v2 layout and
not against v3, and a version the registry marks `retiredForSigning` is reported
as exactly that. That comparison is reported under `registry_schema` and never
moves the verdict. The same commit reads a domain object carrying a member
EIP-712 does not admit: both candidate separators are computed and the result
names the one the signature was made under, `domain_extra_fields_unsigned` or
`domain_extra_fields_signed`, never crashing on the member and never dropping it
silently. `ff1639e` (2026-09-02) stopped the `--rpc` check writing its own
sentence over the attribution it corroborates. `bcc149d` and `444b676`
(2026-09-02) pinned Insight's v4 package, the 15:45Z registry and the production
sample, and tested v4 through the adapter.

`evidence.action/0` and `evidence.action/1` read JSONL whose first line carries
an evidence.action version token, and delegate verification to the published npm
artifact `@headlessoracle/chirindo@0.4.0` rather than to a local checkout. The
adapter is the translation layer: public-key-only key resolution in, and
Chirindo's five-state result mapped onto this tool's tri-state contract out. It
is not new in 0.1.2. One commit in this range touches
`src/adapters/evidence-action.ts`, `17172e4` (2026-09-02), the exit-code and
delivery work above.

`verification.*` reads draft-krausz-verification-state-01 in two payload
profiles: flat, the claim set of section 4.2 at the payload top level, and
composed, the shape the published fixtures actually use, where section 4.3 is
applied per leg and the AND_PRESENT composition is then recomputed. It is not new
in 0.1.2, and no commit in the range `cbe4d38..HEAD` touches
`src/adapters/verification-state.ts`.

`acta.receipt/0` reads draft-farley-acta-signed-receipts-02, whose envelope is
`{payload, signature:{alg,kid,sig}}` with a hex signature over JCS bytes, and
treats draft-marques-asqav-compliance-receipts as a profile layered on farley
rather than as a competing normative source. It is not new in 0.1.2. Two commits
in this range change it: `0c4d25c` (2026-09-01) declines a Compliance Receipt at
detection, because under `-08` such a receipt carries a top-level `anchors` array
and a payload-member signature scope and so is not an ACTA receipt, and makes the
vector-suite skip visible; `c52e435` (2026-09-03) applies the duplicate-key rule
and compares the four inputs that were printed. The `-08` decline rule is pinned
against the author's own vector bytes by five tests in `test/acta.test.ts`, added
in `0b020de` (2026-09-02), including a control asserting that the refusal fires
on the `anchors` key and not on an incidental parse failure.

### The digest walker (`npm run walk`)

Shipped in `514245f` (2026-09-02), with the scope registry in `a7b94bf`
(2026-09-02) and the README and release-notes entry in `e11b074` (2026-09-02).
`tools/walk-digests.ts` recomputes every declared digest in the pinned corpora
under the scope its own document names, reading `walker/scopes.json`, and
cross-checks two independent JCS serialisers before any comparison. It finds M6
unaided and exits 1.

### `SIGNING_KEYS`, `tools/verify-history.sh` and the CI workflow

Shipped in `288cc55` (2026-09-02). Every commit here is SSH-signed, and until
`SIGNING_KEYS` was in the repository only the machine that made them could check
that. `tools/verify-history.sh` calls `ssh-keygen -Y verify` directly rather than
`git verify-commit`, so it does not depend on the checker having
`gpg.ssh.allowedSignersFile` configured, which a fresh clone and a CI runner do
not. It exits 1 on the first commit that does not verify, and a commit carrying
no signature at all is a failure rather than a skip. `0046232` (2026-09-02) added
`.github/workflows/verify.yml`, which runs typecheck, the test suite and that
signature check on every push and pull request.

### Registry key windows, and revocation on both channels

`c02da7b` (2026-09-03) resolves a registry key against its own validity window
and pins the registry either side of a rotation. Being listed is not being
vouched for: this registry retains a rotated-out key in `public_keys` with
`revoked: false` and a past `validUntil`, which its own `key_rotation_policy`
calls overlap, so `validFrom` and `validUntil` are applied against `--now`. A
closed window is UNVERIFIABLE with reason `expired`, annotated `key_expired`; an
instant before `validFrom` is UNVERIFIABLE with reason `not_yet_valid`, annotated
`key_not_yet_valid`; and a window member that is present but is not an ISO-8601
instant fails closed as UNVERIFIABLE with reason `malformed_member`, annotated
`key_window_unreadable`, rather than being treated as open ended.
`--allow-unregistered-signer` waives none of these, because the key is registered
and it is the window that is shut.

`5cf2e1a` (2026-09-03) reads revocation on both channels the registry publishes,
`revoked` on the `public_keys` entry and the top-level `revoked_keys` array.
Either one yields the reason code added by that commit, `key_revoked`, rather
than `key_unresolvable`, because "no such key" and "do not trust this key" call
for different actions. Revocation is checked before the window and outranks it: a
withdrawn key is withdrawn at every instant, so no `--now` recovers it and the
detail says so instead of suggesting a re-run. `revoked_keys` is empty in every
registry pinned here, so a `revoked_keys` entry in a shape this tool cannot read
blocks every key in that registry as `malformed_member` rather than being
skipped, because an entry that cannot be read cannot be shown not to name the
signer.

### The CPB harness and the delivery documents under `cpb/`

`ef94fde` (2026-08-30) pinned the CPB `-02` inputs: the draft bytes, their
commit, the vector inventory and the platform. `1886b40` (2026-08-30) implemented
`-02` sections 4.1, 5 with 5.1, and 7.1 from the draft text. `e75c046`
(2026-08-30) ran the author's vectors against that implementation, the primary
set agreeing 16 of 16. `4126788` (2026-08-30) added the T5 falsification
requirement and T3b, shipping the mutants and running the derived-identifier
vectors, and `b6d6f92` (2026-08-30) narrowed the T3 red-proof claim to say the
mutations are shipped rather than historical. `6b262e9` (2026-08-30) disclosed a
post-freeze `lib/` filename enumeration and narrowed the T1 claim. The externally
clean delivery copies under `cpb/delivery/` arrived in `09dfa09` and `426434f`
(2026-08-30) and in `3e9f526` (2026-08-30), which externalised the provenance and
named the four delivery copies, with `3ecf29e` (2026-08-30) cutting section 8
from the delivered provenance copy only and `89cc2a0` (2026-08-30) fixing two
defects the externalisation introduced in the ordering proof. `536680c`
(2026-09-01) recorded the 2026-08-31 corrections against those documents and the
harness, and `c17437d` (2026-09-02) corrected two source comments the same letter
had already withdrawn. `9433559` (2026-09-03) recorded the re-derived package,
five documents with content-addressed pins and a count the correction letter also
got wrong; `a1a22ab` and `e545d95` (2026-09-03) carry the identifier search that
found fifteen candidates and then eighteen, of which fifteen did not hold, and
name the sixth identifier member `digest`; `1e5f376` (2026-09-03) records that A2
has an external check and that the check is the author's own vector.

### The release guard and `prepublishOnly`

Shipped in `4822d01` (2026-09-03). `tools/release-guard.mjs` runs first in
`prepublishOnly`, followed by `npm run typecheck`, `npm run build` and
`npm test`, so a publish from an uncommitted, untagged or mistagged tree fails
closed rather than shipping. That is the structural half of R71; the record half
is the 0.1.1 section below, which the same commit wrote.

### The README citation section and the version-free status line

`4822d01` (2026-09-03) added the "Citing a release" section to the README.
`2f72cef` (2026-09-03) dropped the hardcoded version from the README status line,
so the README states that it describes the tree it sits in, whose version is the
one in `package.json`, rather than naming a version that drifts from it.
`dfbb2d2` (2026-09-03) compared the four files outside `dist/` and recorded what
they show, which is the four-file paragraph in the 0.1.1 section below.

### Folded in from the working notes

The three entries below were items 9, 10 and 11 of `RELEASE-NOTES-NEXT.md` under
0.1.2. They are reproduced here as they stood, each keeping its provenance line.

### 9. The pinned Insight registry contradicts the verification note it serves

`refs/insight-oracle-keys-2026-09-02.json` publishes `ExecutionReceipt` as 43
fields under `schemaVersion` 1; `VERIFICATION_NOTE_2026-09-02` A8/B6 record it
as the same 32 fields the package receipt declares. Either the document changed
within the ~1h45m between the two fetches without its version moving, or A8
compared the package against itself. `OracleSafetyCheck` matches the note
exactly in the same bytes, so the note's method was capable of being faithful.
Resolve by re-fetching and diffing against this pin before the next package is
verified; `test/insight.test.ts` asserts the pinned bytes, so a re-pin that
removes the divergence turns that test red on purpose.

**Resolved 2026-09-02T11:54Z, and the first reading was the right one.** A
second single fetch (`refs/insight-oracle-keys-2026-09-02T1154Z.json`) publishes
the same 43 fields under `schemaVersion` **3**, with `ExecutionReceiptV2` (32)
and `ExecutionReceiptV1` (30) retained beside them and marked
`retiredForSigning`. So the document had changed without its version moving, and
the author has since corrected it. Both pins are kept; the assertion is
re-pointed at the corrected one and the old state is asserted beside it, so the
regression stays named rather than merely gone.

Provenance: CC insight-adapter report, 2026-09-02, T1.2; CC insight-adapter-v3
report, 2026-09-03, T1.
(report dated for its scheduled day; the run and the commits are 2026-09-02 — see fixtures/provenance.md, correction of 2026-09-02)

### 10. Non-standard EIP-712 domain members, and how the tool reads three schema versions

`src/adapters/insight.ts` now reads an artefact against the registry type for
its OWN `schemaVersion` rather than against whatever the registry currently
calls the type, and reports a version the registry marks `retiredForSigning` as
exactly that. It also handles a domain object carrying a member EIP-712 does not
admit: both candidate separators are computed and the result says which one the
signature was made under (`domain_extra_fields_unsigned` /
`domain_extra_fields_signed`), never crashing on the key and never dropping it
silently. Insight's 09:53Z receipt declares `environment` in its domain and did
NOT sign it, so eth-account and ethers both refuse the artefact before any check
runs — the tool reads it and says so.

What this does NOT close: the encoding used for the second separator (extra
members appended as `string`, in the domain object's order) has no authority
behind it. EIP-712 assigns no type to a member it does not admit, so a signer
who encoded `environment` as `bytes32`, or ahead of `chainId`, would recover
under neither separator and be reported as a signature failure. The two
constructions tried are named in the detail so that case is legible, but the
adapter cannot enumerate every encoding a non-standard domain might use, and it
does not pretend to.

Provenance: CC insight-adapter-v3 report, 2026-09-03, T2.2.
(report dated for its scheduled day; the run and the commits are 2026-09-02 — see fixtures/provenance.md, correction of 2026-09-02)
fixtures/provenance.md now carries a corrections: front-matter block (append-only, keyed to section headings); introduced 2026-09-02 for the schema-v3 section date.

### 11. The `-08` rerun: four errata closed, three new findings against the profile and its vectors

`FINDINGS-rerun-2026-09-02.md` re-verifies the four July errata sent to the
author of `draft-marques-asqav-compliance-receipts` against `-08` (31 Aug 2026,
sha256 `ee3ca5d7…`, 392,828 B, 7,840 lines — pin printed and equal) and against
the author's own conformance vectors at `asqav-sdk@05c1c49`, the commit `-08`
pins in its own reference section. **All four errata are RESOLVED as sent**, each
by the route the erratum proposed, and `FINDINGS.md` E3/E4/E5/E8 are re-graded
with `-07` and `-08` line numbers. The chain-digest resolution is corroborated
byte-for-byte in the shipped vectors: `asqav-03-chain-link` reproduces under the
payload-member scope and `acta-02-chain-link` under the whole-receipt scope, and
neither reproduces under the other.

Three findings opened, and only the first was known before this run:

- **M5** — `-08` states the `counterparty_binding.envelope_hash` scope two ways
  (§4 line 657 "envelope-minus-anchors" vs §5.7 lines 1351–1369 "three-key
  object"; the change list agrees with §5.7). Author-acknowledged 2026-09-02
  13:07:20Z: §4 is the intent, `-09` corrects §5.7 and adds an explicit `scope`
  member. Graded here as `-08` reads, on his instruction.
- **M6** — the `envelope_hash` value published in the vectors matches **neither**
  scope, and disagrees with its own vector's `sha256` field though that vector's
  description says one is the base64 of the other. 37 candidate byte strings were
  tried. Nothing in the SDK's suite asserts that value against anything.
- **M7** — eight of sixteen `asqav-*` vectors carry no anchor and declare
  `"outcome": "verified"`, against §5.4's "Verifiers MUST reject Compliance
  Receipts that lack at least one valid anchor".

Shipped with it: `tools/asqav_envelope_hash.py`, a self-contained RFC 8785
implementation (no third-party package; the rerun was allowed no endpoint but the
git clone) that reproduces 21/21 of the SDK's own published canonical strings —
the control that makes its disagreement on `envelope_hash` mean something. Five
tests in `test/acta.test.ts` pin the adapter's refusal of the `-08` envelope
against the author's vector bytes, including a control asserting the refusal
fires on the `anchors` key and not on an incidental parse failure. The
`acta.receipt/0` coverage manifest now names the `-08` pin by digest as the source
of that decline rule. No Asqav adapter was built; every `asqav.*` check remains
`not_implemented` and the tool reports `format_unrecognized` rather than naming
the format.

Provenance: CC marques-08-rerun report, 2026-09-02.

M6 identified after that report: `0d6c88a1…` is the same three-key digest of the
same envelope before SDK commit `ee8a3e7` (PR #416) changed
`payload.previousReceiptHash` off the `sha256:` genesis seed without recomputing
the derived literal — reproduced from the blob bytes of all eight commits
touching `conformance/vectors.json`, still stale in five vectors at the upstream
tip `f67ecad`, and the 37-candidate sweep is superseded by the identification.

Added `npm run walk`: a digest walker that recomputes every declared digest in
the pinned corpora under the scope its own document names (`walker/scopes.json`,
253 registered fields with document line ranges, 416 unregistered and listed),
cross-checking two independent JCS serialisers before any comparison. It finds
M6 unaided and exits 1 — the check that would have caught the stale literal on
the day the corpus was pinned rather than 29 days later.

Every findings document carries a standing `## Interests` section from 2026-09-03, one wording across all three, disclosing that the author of the gradings authors and builds on the same ground as the formats graded (B-30).

Verification after publish: the npm `gitHead` and `dist.integrity` for 0.1.2 are appended below this section as a dated line once `npm view` returns them, so the notes record the artefact and not the intention (R71).

## 0.1.1 (2026-08-13), correction to the record

**What was published.** `@headlessoracle/receipt-verify@0.1.1` went to npm on 2026-08-13 at 09:11Z,
with integrity
`sha512-hrAkVQIp+VW3/UexLArSSFkaC7qOxmB83DJh76rCjGuNLZ7BIKOOraVqVaQIxWe0e9dqscLvE/nnovW8dEiZ2A==`.
Version 0.1.0 went out on 2026-08-10 at 11:09Z.

**What the tag points at, and what it lacks.** Tags `v0.1.0` and `v0.1.1` both resolve to commit
`cbe4d3895b2ec853fd03f3b42178994d103b2666`, and the npm metadata for 0.1.1 records the same commit as
its `gitHead`. That commit does not contain the code 0.1.1 ships. A reader who checks out `v0.1.1` and
builds it does not get the published artefact, so the tag cannot be cited as the source of what is on
npm today.

**The code that differs, and why it was changed.** Building `cbe4d38` and comparing every file
against the published tarball, the only JavaScript that differs is `dist/cli.js`, and the difference is
one statement: the built `cbe4d38` ends the process with `process.exit(exitCode)` and the published
0.1.1 sets `process.exitCode` and lets the event loop drain. The reason is a Windows teardown race.
`process.exit()` tore down the loop while the socket that fetched a `--jwks` URL was still closing,
libuv aborted the process with status 0xC0000409, and the abort replaced the real exit status. A VALID
receipt could exit non-zero, and all three verdicts became indistinguishable to a caller reading the
exit code, while the `--json` payload in the same run still reported `exit_code: 0`. Every other JavaScript file under
dist/ is byte-identical to the build; dist/cli.js.map differs only as a consequence of cli.js. The four
files outside dist/ were compared too, on 2026-09-03, and two of them differ. LICENSE (11,346 bytes)
and NOTICE (3,391 bytes) are byte-identical. package.json differs in one member and one byte of
whitespace: the tarball says `"version": "0.1.1"` where the commit says `"version": "0.1.0"`, and the
tarball has no trailing newline. That version string appears in no commit in this repository, so the
bump that produced 0.1.1 was never committed either. README.md differs by 58 added lines and 3
changed ones: the published README carries the "Try it in 30 seconds" section and states the suite at
260 tests, and the commit carries neither. Both of those reached the repository in `17172e4`, the same
commit that carried the `dist/cli.js` fix, so the documentation drifted from the artefact by the same
three weeks and in the same commit as the code.

**When the source reached the repository.** Commit `17172e4` on 2026-09-02 at 09:08Z, which is three
weeks after 0.1.1 was published. So the fix existed in the artefact before it existed in the
repository, and that ordering is the defect being recorded here.

**The tag is not moved.** Moving `v0.1.1` would change what an existing citation resolves to, which is
worse than leaving a wrong pointer beside a correction that explains it. This note is the correction.
Cite the npm artefact by version and integrity for what ships today; cite a commit once the repository
is published.

**Who found it and when.** Joe Krausz, 2026-09-02, while trying to cite the verifier in a draft. The
citation question is what surfaced it: he could not name a commit that contains what the package runs.

**The rule going forward (R71).** Publish only from a committed, tagged tree. The tag goes on the
commit the artefact was built from. From 0.1.2 onward every version records in its release notes that
`gitHead` equals the tag commit, and `tools/release-guard.mjs` runs in `prepublishOnly` so a publish
from an uncommitted or untagged or mistagged tree fails closed rather than shipping.

Provenance: Joe Krausz, 2026-09-02; verified against npm and the git objects 2026-09-03.

## 0.1.0 (2026-08-10)

0.1.0 was the first publish, on 2026-08-10 at 11:09Z, and its npm `gitHead` is
`cbe4d3895b2ec853fd03f3b42178994d103b2666`, the commit both the `v0.1.0` and
`v0.1.1` tags point at. The tarball-versus-tag comparison that was run for 0.1.1,
building that commit and comparing every file against the published tarball, has
not been run for 0.1.0, and it is listed as open under B-43.
