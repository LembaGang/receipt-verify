# FINDINGS

Observations recorded while implementing `receipt-verify 0.1.0-dev` against
published artifacts. Each entry states what was observed, where, and how it was
checked. Line and section references are to the snapshots in `refs/` and
`fixtures/`, whose sha256 values are pinned in `fixtures/provenance.md`.

This file is a record of observations. It does not rank them, assign
significance, or recommend action.

---

## A. `draft-krausz-verification-state-01`

Source: `refs/draft-krausz-verification-state-01.txt`,
sha256 `22c5ce262bdf4e63ef538a308e7a8455e93c4143b9e1726b7b64720615d516db`,
retrieved 2026-07-25 from
`https://www.ietf.org/archive/id/draft-krausz-verification-state-01.txt`.

### A1. The `v_recommendation` enumeration differs between §2 and §4.2

§2 (Terminology, lines 244–247) enumerates seven values:

```
confident_supported, un_probed_not_cleared, vulnerable_supported,
weak_supported, refuted, unverifiable, error
```

§4.2 (lines 366–369) enumerates six, omitting `un_probed_not_cleared`:

```
confident_supported, vulnerable_supported, weak_supported, refuted,
unverifiable, error
```

§5.1 Table 2 (line 530) requires `un_probed_not_cleared` as the recommendation
for `(supported, >= threshold, not_checked)`.

A verifier that treats the §4.2 list as the closed enum rejects a receipt that
§5.1 requires an issuer to produce.

### A2. `v_gate_mapping_hash` has three spellings across the draft and its fixtures

- §4.2 (line 382): "SHA-256 hex digest of the canonical serialization".
- §4.3 step 2 (line 422): "hex-encoded".
- §4.5 example (line 480): `"v_gate_mapping_hash": "sha256:1ad513cd0cfcc1fcd78136375268ba85c50cc267de8d9f92a9a3e61f5d672288"`.
- Published fixtures (`fixtures/verification-state/spec-examples/v0.3-composed/payload-001.json`):
  `"v_gate_mapping_hash": "sha256-3b1f2d8e7a5c4b9f6e0a1d2c3b4a5e6f7c8d9e0a1b2c3d4e5f6a7b8c9d0e1f2a"`.

Bare hex, `sha256:` prefix, and `sha256-` prefix all occur. `receipt-verify`
accepts all three and compares on the hex (`src/mapping.ts`,
`normalizeDigest`).

### A3. §4.3 step 7 defers clock tolerance to a section that does not define one

Step 7 (line 432) reads "Verify exp/nbf against current time, subject to clock
tolerance per Section 6." §6 defines three staleness axes (signature,
calibration, evidence), their fields, and their remediation paths. It specifies
no tolerance value, bound, or default. The string "tolerance" occurs twice in
the document (lines 432 and 790); neither occurrence is accompanied by a value.

`receipt-verify` defaults to 60 seconds, configurable via `--clock-tolerance`.
That number is this tool's choice, not the draft's.

### A4. The mapping document has no specified schema, serialization, or location

§4.3 step 2 requires the verifier to "fetch the named immutable mapping
document" and step 3 requires the threshold to be "recovered from the mapping
document". §5.2 states the threshold is "specified in the named mapping
document, not in the individual receipt". §4.6 requires publishers to treat
published mappings as immutable.

The draft does not specify the document's schema, its serialization, what
"canonical serialization" means for the purposes of the §4.2 digest, or how an
identifier such as `v0.3.0-2026-05-30` resolves to a retrievable location.

Two independent implementations following §4.3 cannot be expected to compute the
same `v_gate_mapping_hash` for the same ruleset. `receipt-verify` defines its own
schema (`src/mapping.ts`) and uses RFC 8785 JCS bytes for the digest; both are
this tool's choices, documented in `README.md`.

### A5. §4.2 marks `iss`, `iat`, and `exp` REQUIRED; the published fixtures carry none of them

§4.2 (line 410) lists `iss (REQUIRED), sub (RECOMMENDED), iat (REQUIRED), exp
(REQUIRED), nbf (OPTIONAL)`. None of the eleven `payload-*.json` files in
`examples/v0.3-composed` contains `iss`, `iat`, `exp`, or `nbf`.

---

## B. `github.com/TKCollective/agentoracle-receipt-spec`

Source: `fixtures/verification-state/spec-examples/`, retrieved 2026-07-25 from
`raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/`.
Per-file sha256 values in `fixtures/provenance.md`.

### B1. Does a public detached fixture exist?

**Yes.** `examples/sample_receipt_detached_jws.json` is published and is the only
detached artifact in the repository.

Its `protected` and `signature` members are byte-identical to those of
`examples/sample_receipt_attached_jws.json`. The two files differ only in that
the detached one omits the `payload` member. Asserted in
`test/detached-jcs.test.ts`.

### B2. The published detached sample is RFC 7515 detached, not RFC 7797 `b64=false`

`examples/README.md` states: "The production wire format is **detached** JWS
(RFC 7797, `b64=false` flow)".

The decoded protected header of `sample_receipt_detached_jws.json` is:

```json
{"alg":"EdDSA","kid":"ao-receipt-2026-04-ed25519-f2753b7c","typ":"application/vnd.agentoracle.receipt+jws","cty":"application/json"}
```

It contains no `b64` member and no `crit` member. RFC 7797 §3 requires `"b64":
false` to be present and to be listed in `crit`. The published sample is an
ordinary RFC 7515 detached JWS: the signing input is over the base64url-encoded
payload. Asserted in `test/detached-jcs.test.ts`.

### B3. The sample pair's signing input is `JSON.stringify` insertion order, not a canonical serialization

Measured against the snapshots:

| Candidate payload bytes | Length | Matches the signed input? |
|---|---|---|
| `base64url-decode(sample_receipt_attached_jws.json.payload)` | 1315 | — (this *is* the signed input) |
| `JSON.stringify(JSON.parse(sample_payload.json))` | 1315 | **yes**, byte-identical |
| `canonicalize(JSON.parse(sample_payload.json))` (RFC 8785 JCS) | 1315 | no |
| raw bytes of `sample_payload.json` (pretty-printed) | 1684 | no |

The signed bytes begin `{"receipt_version":"0.1","evaluation_id":…` — the file's
insertion key order. The JCS form of the same object begins
`{"confidence":{"calibration_anchor":…` — lexicographic order.

Consequence for a detached verifier: reconstructing the payload from
`sample_payload.json` and canonicalizing it with RFC 8785 produces a different
signing input, and the signature does not verify. Asserted in
`test/detached-jcs.test.ts` ("does NOT verify against the JCS canonicalization
of sample_payload.json").

`examples/README.md` notes that "a detached-form verifier needs a byte-accurate
canonical serializer on both sides (issuer + verifier)". The specific
serializer the published sample requires is `JSON.stringify` over the object in
its authored key order.

### B4. No mapping document is published, so §4.3 step 2 cannot be completed from published material

Every `payload-*.json` in `examples/v0.3-composed` binds a `mapping_id` and a
`v_gate_mapping_hash`:

- `agentoracle-v0.3-2026-05-30` → `sha256-3b1f2d8e7a5c4b9f6e0a1d2c3b4a5e6f7c8d9e0a1b2c3d4e5f6a7b8c9d0e1f2a`
- `agenttrust-v0.3-2026-06-07` → `sha256-307db9faa364cfe149fb5120d0451175175de40d7433c44915bfec57acc16ec4`

The repository tree contains no mapping document, and neither the receipts nor
`vectors.json` names a location one could be retrieved from. No document
producing either digest is published anywhere this implementation could locate.
A verifier cannot distinguish an unpublished document from a placeholder digest.

Consequence under a strict §4.3 implementation: all seven accept vectors
(`comp-001` … `comp-007`) return `UNVERIFIABLE` with reason
`mapping_unresolvable`, having passed step 1. Asserted in
`test/verification-state.test.ts`.

### B5. Composed receipts carry `v_gate_threshold` inline, which §5.2 places in the mapping document

`payload-001.json` and its siblings include `"v_gate_threshold": 0.7` inside the
`v_gate` leg, alongside `mapping_id` and `v_gate_mapping_hash`.

§5.2 states the threshold "is specified in the named mapping document, not in
the individual receipt", and gives the reason: "two receipts under the same
mapping ID MUST gate against the same threshold". A receipt carrying both a
mapping binding and an inline threshold admits a state in which the two disagree,
and the draft does not say which governs.

### B6. No published fixture uses the flat §4.2 claim set

The §4.3 protocol is written against top-level `v_verdict`, `v_confidence`,
`v_adversarial_result`, `v_recommendation`, `v_gate`, `v_gate_mapping`,
`v_gate_mapping_hash`.

- `examples/sample_payload.json` is `receipt_version: "0.1"` and contains none of
  those members.
- `examples/v0.3-composed/payload-*.json` nest a subset inside a `v_gate` leg and
  rename members: `verdict` rather than `v_gate`, `mapping_id` rather than
  `v_gate_mapping`. No top-level `v_verdict` appears in any of the eleven files.

The flat profile is unexercised by any published artifact. `receipt-verify`
implements it and exercises it with fixtures signed by a throwaway key
(`fixtures/verification-state/synthetic/flat-*`).

### B7. Reject vectors `comp-r03` and `comp-r04` are unreachable in §4.3 step order

`vectors.json` declares:

- `comp-r03` — expected failure `composed_decision_rule_violated`
- `comp-r04` — expected failure `screen_ref_action_ref_mismatch`

Both failures are recomputation checks that occur after §4.3 step 2. Because the
mapping binding in step 2 cannot be completed (B4), a verifier following §4.3's
step order refuses at step 2 and never reaches the condition each vector is
constructed to test. Both are correctly non-VALID, for a reason other than the
declared one.

### B8. Positive: the `v0.3-composed` fixture set is JCS-canonicalized and internally consistent

Checked across all eleven vectors:

- `base64url-decode(jws-NNN.json.payload)` equals
  `canonicalize(payload-NNN.json)` for all 11.
- For all 7 accept vectors, `expected_canonical_sha256` in `vectors.json` equals
  SHA-256 of those bytes.

`vectors.json` declares `"canonicalization": "RFC 8785 (JCS)"`, and the artifacts
match that declaration. Signature verification against the bundled JWKS succeeds
for every signature of every one of the eleven vectors, except `comp-r01`'s
second signature, which is the mutation that vector exists to test.

### B9. A compiled Python artifact is committed to the repository

`examples/v0.3-composed/__pycache__/verify.cpython-313.pyc` is present in the
repository tree. Excluded from `fixtures/` by `tools/snapshot.mjs`.

---

## C. `@headlessoracle/chirindo@0.3.0` (published npm artifact)

Installed from the npm registry; not a local checkout.

### C1. Positive: all six conformance vectors reproduce through the published artifact

`fixtures/evidence-action/` is a snapshot of the frozen corpus at
`C:\Users\User\agent-action-receipt-vectors`. For all six vectors the snapshot's
sha256 equals the `receipt_sha256` pinned in `manifest.json`, and `runVerify`
from the published package returns the manifest-declared outcome for each:
five `valid`, one `tampered`. Asserted in `test/evidence-action.test.ts`.

### C2. The package declares no library entry point

`package.json` declares `bin` but no `main`, `module`, `exports`, or `types`.
`require("@headlessoracle/chirindo")` and
`import … from "@headlessoracle/chirindo"` both fail to resolve.

A library consumer must deep-import an internal build path:

```js
import { runVerify } from "@headlessoracle/chirindo/dist/vendor/recorder/index.js";
```

That path is not a declared public API surface, so it carries no stability
guarantee across versions. This is the import `receipt-verify` uses.

### C3. `runVerify` accepts file paths, not bytes

The signature is `runVerify({ chainPath, identityPath })` or
`runVerify({ chainPath, jwksUrl })`. There is no bytes-in or object-in entry
point. A consumer verifying an in-memory receipt must write it to a temporary
file first. `src/adapters/evidence-action.ts` creates a scratch directory per
call and removes it in a `finally` block.

### C4. The offline key path accepts only an identity file, not a JWK

`VerifyOptionsKey` takes `identityPath`, pointing at a JSON file with a
`public_key_pem` member. `VerifyOptionsJwks` takes `jwksUrl` — a URL, which is
resolved over the network. There is no way to pass an already-parsed JWK, or a
local JWKS file, to the offline path.

A consumer holding published JWKS material offline must synthesize an identity
file to use it. `receipt-verify` derives an SPKI PEM from the JWK and writes a
public-material-only identity file into the same scratch directory. No private
key is involved on this path.

### C5. A verification-only consumer installs an MCP demo server transitively

`package.json` declares a runtime dependency on
`@modelcontextprotocol/server-everything@^2026.1.26`, which pulls
`@modelcontextprotocol/sdk` and `@hono/node-server`. `npm audit` reports a
moderate advisory on `@hono/node-server` (path traversal in `serve-static` on
Windows via encoded backslash) reachable through that chain.

Installing the package solely to call `runVerify` installs an MCP server and an
HTTP server as runtime dependencies.

---

## D. Notes on this implementation's own choices

Recorded so a reader can separate what the specs say from what this tool decided.

1. **Mapping document schema** (`src/mapping.ts`) is defined here, because no
   schema is specified and none is published. See A4.
2. **Mapping digest** is SHA-256 over RFC 8785 JCS bytes of the document. See A4.
3. **Clock tolerance** defaults to 60 seconds. See A3.
4. **Digest spelling leniency** accepts bare hex, `sha256:`, and `sha256-`. See A2.
5. **Mapping resolution is local-only.** Fetching at verify time would make the
   verdict depend on what a remote host served at that instant.
6. **`exp` is required in the flat profile, optional in the composed profile.**
   §4.2 makes it REQUIRED; no published composed receipt has one (A5). Enforcing
   it on the composed profile would make every published fixture malformed for a
   second, independent reason. The relaxation is confined to that profile.
7. **The composed profile's `v_verdict`** is not carried on the `v_gate` leg.
   Where it is absent, `supported` is assumed when the signed
   `v_recommendation` is one only a `supported` verdict can derive. This is an
   inference; a receipt carrying `v_verdict` explicitly would remove the need
   for it.
8. **`INVALID` for every `tampered` reason** from Format 1, including
   `request_commitment mismatch` and `prev_hash linkage broken`. These are not
   signature failures, but each is a determinate negative established against a
   key that was resolved, which is the line this tool draws between `INVALID`
   and `UNVERIFIABLE`.
