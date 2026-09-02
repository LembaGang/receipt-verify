# Release notes — next version

Working notes for changes queued against the next release. Entries are removed
when shipped and folded into the version's release notes. Numbers are stable
IDs, not an ordering — gaps mean an item shipped or moved, never that it was
renumbered.

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
teardown race to the receipt path on every verdict.** The fix is in 0.1.1;
the constraint is satisfied — implement against 0.1.1 or later only.

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
