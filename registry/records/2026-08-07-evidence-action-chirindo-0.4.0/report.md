# Agent Receipt Conformance Report — Entry 002

**Format:** `evidence.action/0`
**Specification:** `draft-msebenzi-evidence-action-00`, 28 July 2026
**Implementation assessed:** `@headlessoracle/chirindo@0.4.0` (npm, published 2026-08-07)
**Role:** Emitter. This implementation produces receipts; it does not verify them.
**Artifact digest:** `sha1 fd8aaa44c8a95b531840e7bd871da25817492390`, 85 files, 92.8 kB packed
**Assessed:** 2026-08-07
**Methodology:** Agent Receipt Conformance — Grading Methodology v0.3-draft
**Supersedes:** Entry 001 (`@headlessoracle/chirindo@0.3.0`), which remains published

**Conflict:** The editor is sole author of this specification and this implementation. See Methodology §4. **This entry has not been independently re-run and is therefore labelled UNVERIFIED.**

**Procedure:** `scripts/release-gate.mjs --from-registry 0.4.0 --json`. The published tarball was installed into a clean directory with `--omit=dev` and probed. Exit code 0. Raw output: `gate-0.4.0-2026-08-07.json`.

---

## The six axes

| Axis | Value | Change from Entry 001 |
|---|---|---|
| 2.1 Canonicalisation posture | **Fixed** — JCS, RFC 8785 | unchanged |
| 2.2 Vector agreement | **Pass** | unchanged |
| 2.3 Artifact–specification agreement | **Pass** — 8 of 8 checked entry points present | **was Fail** |
| 2.4 Independent recomputability | **Prepared** | unchanged |
| 2.5 Verification key model | **Published key set** | unchanged |
| 2.6 Coverage declaration | **Not determinable** | corrected; see below |

---

### 2.1 Canonicalisation posture — Fixed

Unchanged from Entry 001. The specification names RFC 8785 (JCS) normatively. §11 states that this format and `acta.receipt` both canonicalize with JCS, both sign with Ed25519 over canonical bytes as mandatory-to-implement, and both remove the signature member before canonicalizing rather than setting it to null.

*Determined by reading the specification text. The specification has not changed since Entry 001.*

### 2.2 Vector agreement — Pass

- `CORPUS/JCS` — 10 vectors byte-exact, with 2 reject entries deferred to `CORPUS/STRICT`.
- `CORPUS/THUMBPRINT` — computed `NvrZE4rGdm3rW7l4aFU_Y4r_KGtb8s-b6BAxEdC-vT0`, matching expected.
- `CORPUS/STRICT` — 2 reject vectors reject at their declared condition.
- `CLI/E2E` — the command-line path agrees with the library path on thumbprint.

**This axis passed in Entry 001 as well, against an artifact missing three documented functions.** That is the finding the methodology is built around, and it is preserved here rather than dropped now that the underlying defect is fixed.

### 2.3 Artifact–specification agreement — Pass

All 8 entry points checked by the release gate are present in the distributed artifact, including the three absent from `0.3.0`:

```
paymentRef
paymentRefFromArtifacts
paymentRefFromJsonStrings
```

Confirmed independently by installing the published tarball and enumerating the module's exports. `dist/vendor/recorder/payment-ref.js` (11.6 kB) and `dist/vendor/recorder/x402-registry.js` (12.9 kB) are present in the published tarball.

**On the nature of the Entry 001 failure.** It was not a code defect. The implementation existed and was correct; it had never reached the distributed artifact. Every check in the repository was green throughout, because the test suite imports `src/` and the conformance harness reads the vector file; nothing imported `dist/` or installed the package.

The remedy was therefore two things, not one: publishing the corrected version, and adding a check capable of observing the difference. The second is the durable part. A release gate now installs the published tarball into a clean directory and probes it, and it is run against both the pack candidate before publication and the registry afterwards.

### 2.4 Independent recomputability — Prepared

Unchanged. Two code paths, one party. The only other implementation of `evidence.action/0` known to the editor is `receipt-verify`, which declares `@headlessoracle/chirindo` as a dependency, so the verifier imports the emitter rather than reimplementing it.

A misreading of the specification would be reproduced on both sides and the suite would still pass. This establishes internal consistency and nothing about the specification.

No independent implementation is known to exist.

### 2.5 Verification key model — Published key set

Unchanged. Verification keys are retrievable without credentials at `https://headlessoracle.com/.well-known/jwks.json`, which returned three Ed25519 signing keys at the time of assessment.

### 2.6 Coverage declaration — Not determinable

This axis asks whether an implementation reports what it did **not** evaluate. An emitter evaluates nothing, so the axis does not apply to the artifact assessed here.

It is also **not determinable for the format**. The verifier the editor operates, `receipt-verify`, is source-public at github.com/LembaGang/receipt-verify (since 2026-08-02) and was released as `@headlessoracle/receipt-verify@0.1.0` on npm on 2026-08-10 (shasum `5188b3f0fe2d958284075fc767f5f1e27799476c`), emitting per-format coverage manifests on every result — but under Methodology §4 the editor's own tool cannot be the determining implementation for a format he authors, and no party other than the editor has yet probed the released package. `@headlessoracle/verify@1.1.0` is published but verifies `environment.market_state` attestations, not this format.

Recorded as **not determinable** rather than absent. It becomes determinable when a released verifier for this format has been probed by a party other than the editor.

**Correction from Entry 001 as first written.** That entry recorded this axis as Declared, citing a machine-readable coverage manifest distinguishing two causes of a skipped check. **That manifest is not in this artifact.** A search of the published `dist/` for the vocabulary returns nothing, and the declared-gap identifiers cited do not appear. The property belongs to a different codebase in the editor's possession and was carried across in error. Both entries are corrected.

---

## Observations outside the axes

Not graded properties. Recorded because they are material to a reader and were measured in the same run.

**Production dependency graph.** Two packages install with `--omit=dev`, direct dependency `canonicalize`. Entry 001's artifact installed 108, including an HTTP server stack that the gate never serves over. `npm audit` against a clean production install of `0.4.0` reports zero advisories at every severity.

**Version anchor agreement.** `package.json`, `package-lock.json`, the signed git tag `v0.4.0`, and the npm `latest` dist-tag all read `0.4.0`. At tag `v0.3.0` the lockfile recorded version `0.2.0` in both its top-level `version` field and `packages[""].version`; it had not been regenerated at the `0.3.0` cut.

---

## Non-coverage of this entry

**What was not checked:**

- Cryptographic correctness beyond signature verification against the published key set. No independent review of the signing implementation.
- Any code path not exercised by the published vectors. The proportion of the specification's normative requirements those vectors exercise is **not measured**, and is a candidate axis under Methodology §6.
- Whether the three functions restored in `0.4.0` behave correctly. **Axis 2.3 establishes that they are present, not that they are right.** No published vector exercises them: this follows from Entry 001, where the full corpus passed while all three were absent.
- Which 8 entry points the release gate checks. The list is defined in `scripts/release-gate.mjs` in the implementation's repository and was not independently enumerated for this entry.

**Determined by reading rather than execution:** axis 2.1 only.

**This entry has not been independently re-run.** Any implementer holding the published tarball can reproduce every value above.

---

## On supersession

This entry supersedes Entry 001. **Entry 001 remains published and is not withdrawn.**

It was true when written and remains true of the artifact it describes. `@headlessoracle/chirindo@0.3.0` is still resolvable from the registry and still installable today; a consumer who pins that version still receives a package missing three documented functions. Supersession changes which version carries the `latest` tag. It does not make the earlier artifact sound, and a report that removed a failing entry once the author had fixed it would be describing the registry inaccurately.

The 2.6 correction is a different kind of change. It is not a supersession but an **error in the assessment itself**, and it is recorded as such in both entries rather than silently amended.

---

*Raw gate output: `gate-0.4.0-2026-08-07.json`. Prior entry: `CONFORMANCE_ENTRY_001_evidence-action.md`, raw output `gate-0.3.0-2026-08-07.json`.*
