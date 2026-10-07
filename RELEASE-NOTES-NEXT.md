# Release notes — next version

Shipped entries live in RELEASE-NOTES.md.

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

### 9. A sixth format, `ho.receipt/v5.0`: Headless Oracle market and health receipts

Added on branch `claude/ho-receipt-adapter`, not shipped. **Interests, first: this is the Headless Oracle
author's tool grading Headless Oracle's own format**, and the standing disclosure applies with more force than
anywhere else in this repository.

The adapter verifies HO market receipts at all three signed tiers (override, schedule, the signed fail-closed
`UNKNOWN`) and health receipts. The key resolves by `public_key_id` from a `/v5/keys` snapshot passed with
`--registry`, and the signed members are the snapshot's `canonical_payload_spec` list, never a guess made by
dropping wrapper members. The unsigned Tier 3 `CRITICAL_FAILURE` body is `UNVERIFIABLE`/`malformed_receipt`.
The safe-to-trade receipt is out of scope, refused before anything is evaluated, and left for a later format.

Four founder rulings of 2026-10-07 are implemented and each has its own describe block in
`test/ho-receipt.test.ts`. (1) Expired iff `now >= expires_at`; clock tolerance never extends validity past
`expires_at` and applies only to an `issued_at` in the future. The issuer's own verifiers disagree at equality,
and this takes the strict side (`FINDINGS.md` J2). (2) A TTL other than 60 s under a valid signature is
`INVALID`/`malformed_member`. (3) `--jwks` alone is `UNVERIFIABLE`/`key_unresolvable`: a receipt carries no JWKS
`kid`, and the issuer's JWKS holds four keys beside the oracle's that sign other things (`FINDINGS.md` J1).
(4) Scope as above. **No reason code is added.**

Ruling 5 is the line the HO canon could not run until this existed: **"0 unaddressed coverage items"**. The
manifest declares no `not_implemented` check; on every `VALID` market receipt `checks_not_evaluated` is empty;
and every member of the signed `coverage` string is examined by a check that can move the verdict, which is shown
by one signed receipt per member, inconsistent in that member alone, refused at a check that member maps to. Five
things the bytes cannot establish are `reported_only` rows with annotations under stable tokens, not hidden:
`status_determination`, `heartbeat_existence`, `override_origin`, `feed_scope_configuration` and
`registry_provenance`.

Fixtures are signed by a throwaway key (`test-throwaway-receipt-verify-04`, published in
`tools/make-ho-fixtures.mjs`), not a production key and not the HO CI key. Nine are responses of the HO worker at
`d79bd18` itself, run locally under that key, including a real Tier 3 body. Thirty-six are the generator's, which
shares no code with the adapter and refuses to write unless it reproduces a worker signature byte for byte.

Provenance: CC handoff, `ho.receipt` adapter, 2026-10-07; founder rulings 1-5 of the same date.
