# Release notes — next version

Working notes for changes queued against the next release. Entries are removed
when shipped and folded into the version's release notes. Numbers are stable
IDs, not an ordering — gaps mean an item shipped or moved, never that it was
renumbered.

## 0.1.1 — correction to the record (written 2026-09-03)

**What was published.** `@headlessoracle/receipt-verify@0.1.1` went to npm on 2026-08-13 at 09:11Z,
with integrity
`sha512-hrAkVQIp+VW3/UexLArSSFkaC7qOxmB83DJh76rCjGuNLZ7BIKOOraVqVaQIxWe0e9dqscLvE/nnovW8dEiZ2A==`.
Version 0.1.0 went out on 2026-08-10 at 11:09Z.

**What the tag points at, and what it lacks.** Tags `v0.1.0` and `v0.1.1` both resolve to commit
`cbe4d3895b2ec853fd03f3b42178994d103b2666`, and the npm metadata for 0.1.1 records the same commit as
its `gitHead`. That commit does not contain the code 0.1.1 ships. A reader who checks out `v0.1.1` and
builds it does not get the published artefact, so the tag cannot be cited as the source of what is on
npm today.

**The one file that differs, and why it was changed.** Building `cbe4d38` and comparing every file
against the published tarball, the only JavaScript that differs is `dist/cli.js`, and the difference is
one statement: the built `cbe4d38` ends the process with `process.exit(exitCode)` and the published
0.1.1 sets `process.exitCode` and lets the event loop drain. The reason is a Windows teardown race.
`process.exit()` tore down the loop while the socket that fetched a `--jwks` URL was still closing,
libuv aborted the process with status 0xC0000409, and the abort replaced the real exit status. A VALID
receipt could exit non-zero, and all three verdicts became indistinguishable to a caller reading the
exit code, while the `--json` payload in the same run still reported `exit_code: 0`. Every other JavaScript file under
dist/ is byte-identical to the build; dist/cli.js.map differs only as a consequence of cli.js. Files
outside dist/ (package.json, README.md, LICENSE, NOTICE) were not compared; the claim here is about
the code.

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

## 0.1.2

### 1. The verdict does not identify the verifier that produced it

A verdict archived today and read in a year states VALID without stating
VALID-according-to-what. Two verdicts from different builds of this tool are
indistinguishable on paper even where the builds disagree. The verdict (text
and `--json`) should carry the package name and version, read from
`package.json` at build time, not hardcoded.

Provenance: RELEASE-NOTES 0.1.0 review, 2026-08-10.

### 2. Publishing is not structurally bound to building and testing

`npm publish` today relies on the operator having run the build and the suite
first. The 0.1.0 release did this by procedure (the runbook), not by
structure. A `prepublishOnly` script running `typecheck && build && test`
makes the gate part of the artifact path — a publish from a stale `dist/` or
a red suite fails closed instead of shipping.

Done 2026-09-03 in 4822d01: `prepublishOnly` runs `tools/release-guard.mjs`, then typecheck, build and test. Kept here until 0.1.2 ships, per this file's convention.

Provenance: RELEASE-NOTES 0.1.0 review, 2026-08-10.

### 4. An empty `--out` directory writes nothing and exits 0

`--out` pointed at a directory that does not exist silently skips the write
path. The run should either create the directory or fail with a named reason;
silence is the one behaviour a coverage-manifest tool should never exhibit.

Provenance: RELEASE-NOTES 0.1.0 review, 2026-08-10.

### 5. URL receipt input (`receipt-verify <https://…>`)

The receipt argument accepts file paths only; a URL is read as a relative
path and fails with a misleading `ENOENT`. Accepting `https://` receipt
input makes the try-it block one command instead of three and is the shape
the probe design assumes. **Ordering constraint (binding): this lands only
after the exit-code fix (item 3), or the fetch it introduces spreads the
teardown race to the receipt path on every verdict.** The fix is in the
published 0.1.1 and in the repository from `17172e4` (2026-09-02); it is not in
the commit the `v0.1.1` tag points at, which is the defect recorded in the
0.1.1 section above. The constraint is satisfied against the published 0.1.1
or against `17172e4` or later.

Provenance: CC zero-friction report, 2026-08-12, Job 1 + Job 4.

### 6. `snapshot.mjs` exits via `process.exit()` after network I/O

Same pattern as the fixed CLI defect: `scripts/snapshot.mjs` calls
`process.exit()` after `fetch()` completes. It is dev-tooling, not the shipped
binary, and it has not been observed to crash — but it is the identical race
armed, and the fix is the identical one-line change. Do it when the file is
next touched; do not ship a release for it alone.

Provenance: CC 0.1.1 build report, 2026-08-12.

### 7. `expired` and `malformed_member` now appear under two different verdicts

`insight.attestation/eip712` returns INVALID for a closed validity window and
for a `uid` that is not the digest of its own bytes; the other three adapters
return UNVERIFIABLE with those same two reason tokens, meaning "could not
complete". The tokens are the agent-facing field, so the same token now carries
two meanings across formats and a consumer must branch on `verdict` before
`reason`. `formatResult` labels the two INVALID kinds distinctly and the
`invalid()` docstring says so, but the vocabulary itself is still overloaded.
Either split the tokens (`window_closed`, `identifier_mismatch`) or state the
verdict-first branching rule in the README's contract section.

Provenance: CC insight-adapter report, 2026-09-02, T2.

### 8. `fixtures/** -text` and `refs/** -text` do not take effect

`.gitattributes` sets `-text` on both paths with a comment saying these
snapshots are "never normalized", then sets `* text=auto eol=lf` and
`*.json/*.md/*.ts text eol=lf` below. The last matching line wins, so every
`.json` and `.md` fixture is normalized after all: `git check-attr text` on a
fixture answers `set`, not `unset`. Nothing is broken today — the two files
pinned on 2026-09-02 round-trip byte-identically through the index, and the
suite is green in a clone — but the protection the comment claims is not in
force, and a fixture that ever needs CRLF preserved would have its pinned
digest rewritten on checkout. Move the two `-text` lines below the catch-alls.

Provenance: CC insight-adapter report, 2026-09-02, T1.4.

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
