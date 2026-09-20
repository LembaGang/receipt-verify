# Agent Receipt Conformance Report — Entry 001

**Format:** `evidence.action/0`
**Specification:** `draft-msebenzi-evidence-action-00`, 28 July 2026
**Implementation assessed:** `@headlessoracle/chirindo@0.3.0` (npm, published 2026-07-10)
**Role:** Emitter. This implementation produces receipts; it does not verify them.
**Assessed:** 2026-08-07
**Methodology:** Agent Receipt Conformance — Grading Methodology v0.3-draft
**Superseded by:** Entry 002 (`@headlessoracle/chirindo@0.4.0`). **This entry remains published.**

**Conflict:** The editor is sole author of this specification and this implementation. See Methodology §4. **This entry has not been independently re-run and is therefore labelled UNVERIFIED.**

**Procedure:** `scripts/release-gate.mjs --from-registry 0.3.0 --json`. The published tarball was installed into a clean directory with `--omit=dev` and probed. Exit code 1. Raw output: `gate-0.3.0-2026-08-07.json`.

---

## The six axes

| Axis | Value |
|---|---|
| 2.1 Canonicalisation posture | **Fixed** — JCS, RFC 8785 |
| 2.2 Vector agreement | **Pass** |
| 2.3 Artifact–specification agreement | **Fail** — 3 documented functions absent |
| 2.4 Independent recomputability | **Prepared** |
| 2.5 Verification key model | **Published key set** |
| 2.6 Coverage declaration | **Not determinable** |

---

### 2.1 Canonicalisation posture — Fixed

The specification names RFC 8785 (JCS) normatively. §11 states that this format and `acta.receipt` both canonicalize with JCS, both sign with Ed25519 over canonical bytes as mandatory-to-implement, and both remove the signature member before canonicalizing rather than setting it to null.

*Determined by reading the specification text.*

### 2.2 Vector agreement — Pass

Against the published tarball:

- `CORPUS/JCS` — 10 vectors byte-exact, with 2 reject entries deferred to `CORPUS/STRICT`.
- `CORPUS/THUMBPRINT` — computed `NvrZE4rGdm3rW7l4aFU_Y4r_KGtb8s-b6BAxEdC-vT0`, matching expected.
- `CORPUS/STRICT` — 2 reject vectors reject at their declared condition.
- `CLI/E2E` — the command-line path agrees with the library path on thumbprint.

### 2.3 Artifact–specification agreement — Fail

Three functions described in the package's own documentation are absent from the distributed artifact:

```
paymentRef
paymentRefFromArtifacts
paymentRefFromJsonStrings
```

Determined by importing the installed package and probing each documented entry point. The corresponding modules are not present under `dist/`.

**The cause is source-to-artifact drift, not a code defect.** The implementation existed in the source tree and had never reached the published artifact. Every check in the repository was green throughout, because the test suite imports `src/` and the conformance harness reads the vector file; nothing imported `dist/` or installed the package. No check in the repository was capable of observing the difference.

**This is why 2.2 and 2.3 are separate axes.** The full corpus passed against an artifact missing an entire feature, and only a hand-maintained declaration of the documented surface detected it. It follows from that pass that no published vector exercises the three functions: had any done so, `CORPUS` would have failed here.

### 2.4 Independent recomputability — Prepared

Two code paths, one party. The only other implementation of `evidence.action/0` known to the editor is `receipt-verify`, which declares `@headlessoracle/chirindo` as a dependency, so the verifier imports the emitter rather than reimplementing it.

A misreading of the specification would therefore be reproduced on both sides and the suite would still pass. This establishes internal consistency and nothing about the specification.

No independent implementation is known to exist.

### 2.5 Verification key model — Published key set

Verification keys are retrievable without credentials at `https://headlessoracle.com/.well-known/jwks.json`, which returned three Ed25519 signing keys at the time of assessment. A relying party verifies against the published set with no call to the issuer at verification time.

### 2.6 Coverage declaration — Not determinable

This axis asks whether an implementation reports what it did **not** evaluate. An emitter evaluates nothing, so the axis does not apply to the artifact assessed here.

It is also **not determinable for the format**. The verifier the editor operates, `receipt-verify`, is source-public at github.com/LembaGang/receipt-verify (since 2026-08-02) and was released as `@headlessoracle/receipt-verify@0.1.0` on npm on 2026-08-10 (shasum `5188b3f0fe2d958284075fc767f5f1e27799476c`), emitting per-format coverage manifests on every result — but under Methodology §4 the editor's own tool cannot be the determining implementation for a format he authors, and no party other than the editor has yet probed the released package. `@headlessoracle/verify@1.1.0` is published but verifies `environment.market_state` attestations, not this format.

Recorded as **not determinable** rather than absent. It becomes determinable when a released verifier for this format has been probed by a party other than the editor.

---

## Observations outside the axes

Not graded properties. Recorded because they are material and were measured in the same run.

**Production dependency graph.** 108 packages install with `--omit=dev`, direct dependencies `@modelcontextprotocol/server-everything` and `canonicalize`. The first is a test fixture: an HTTP server stack ships in the production graph of a gate that serves no HTTP.

**Version anchor disagreement.** At tag `v0.3.0` the lockfile recorded version `0.2.0` in both its top-level `version` field and `packages[""].version`. It had not been regenerated at the `0.3.0` cut.

---

## Non-coverage of this entry

**What was not checked:**

- Cryptographic correctness beyond signature verification against the published key set.
- Any code path not exercised by the published vectors. The proportion of the specification's normative requirements those vectors exercise is **not measured**, and is a candidate axis under Methodology §6.
- Behaviour of the CLI beyond the thumbprint agreement in `CLI/E2E`.

**Determined by reading rather than execution:** axis 2.1 only.

**This entry has not been independently re-run.** Any implementer holding the published tarball can reproduce every value above.

---

## On supersession

Entry 002 supersedes this entry. **This entry is not corrected and is not withdrawn.**

It was true when written and remains true of the artifact it describes. `@headlessoracle/chirindo@0.3.0` is still resolvable from the registry and still installable; a consumer who pins that version still receives a package missing three documented functions. Supersession changes which version carries the `latest` tag. It does not make the earlier artifact sound.

---

*Raw gate output: `gate-0.3.0-2026-08-07.json`. Superseding entry: `CONFORMANCE_ENTRY_002_evidence-action.md`.*
