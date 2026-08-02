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
9. **`acta.receipt/0` signs under §5.6, not §4.1 step 2.** The draft specifies
   both (E2). §5.6 is chosen because it is the later explicitly-normative
   clarification and because it is the reading the one checkable published
   receipt verifies under. A receipt that verifies only under §4.1 is refused
   with the alternative named, never accepted.
10. **`acta.receipt/0` chains under farley §5.7, not marques §5.3.** The upstream
    document decides; the profile is layered on it (E3, E4). A link matching a
    signature-exclusive scope is `INVALID`, with the matching variant named.
11. **A chain link with no `--prev` is reported, not assumed.** The annotation
    reads `present but not checked`, and `chain_digest_scope` is absent. The
    same applies to `committed_fields_root` with no `--disclose`. A check that
    did not run never contributes to the verdict either way.
12. **§8.1's 24-hour replay default is not enforced** (E7). The receipt age is
    reported as an annotation.
13. **The ACTA Merkle code is implemented twice on purpose** —
    `tools/make-acta-fixtures.mjs` and `src/adapters/acta.ts` share nothing. A
    shared implementation would make the commitment fixtures verify against
    themselves and prove nothing about §5.1–§5.3.
14. **The §5.10 vectors in `fixtures/acta/synthetic/` are this repository's
    construction**, not the draft author's, because the announced suite could
    not be located (E1). `fixtures/acta/published/` holds what the cited
    reference does publish. The two are kept in separate directories and listed
    separately in `fixtures/provenance.md`.
15. **The algorithm-mixed chain fixture is EdDSA→ES256, not EdDSA→ML-DSA-65** as
    §5.10 item 5 specifies, because no ML-DSA implementation is available here.
    The property under test — each receipt checked against its own
    `signature.alg` — is the same. The ML-DSA leg is covered separately by
    `alg-mldsa65.receipt.json`, which asserts the fail-closed refusal.

---

## E. `draft-farley-acta-signed-receipts-02` and `draft-marques-asqav-compliance-receipts-07`

Sources:

- `refs/draft-farley-acta-signed-receipts-02.txt`, sha256
  `14501a68a86e3cc403f56967b19b732316ad3cc2fc011ce3d14aec9c1de68bd2`,
  retrieved 2026-07-28 from
  `https://www.ietf.org/archive/id/draft-farley-acta-signed-receipts-02.txt`.
- `refs/draft-marques-asqav-compliance-receipts-07.txt`, sha256
  `082615447288fa1e983fa2cfb7aa7356fbb35d05d65ea256f66111487746d52f`,
  retrieved 2026-07-28 from
  `https://www.ietf.org/archive/id/draft-marques-asqav-compliance-receipts-07.txt`.
- `fixtures/acta/published/`, retrieved 2026-07-28 from
  `github.com/ScopeBlind/agent-governance-testvectors@HEAD`.

Line numbers below are into the `refs/` snapshots. Throughout, "farley" is the
first document and "marques" the second.

### E1. §5.10 announces a test suite that the draft's only test-vector reference does not contain

farley §5.10 (line 990) states "An interoperability test suite is published
alongside this draft" and gives a six-item minimum set:

1. a cleartext receipt with no `committed_fields_root`;
2. a receipt with four committed fields, expected Merkle root, and an inclusion
   proof for each;
3. a chain of three receipts with expected `previousReceiptHash` values;
4. a tampered Merkle proof that MUST fail;
5. an algorithm-mixed chain (Ed25519 then ML-DSA-65);
6. a non-power-of-two leaf count (e.g. five committed fields).

§5.10 gives no locator. The only test-vector reference in the document is
`[I-D.agent-governance-testvectors]` (line 1310), which resolves to
`github.com/ScopeBlind/agent-governance-testvectors`. That repository's full
file tree was enumerated via the GitHub trees API on 2026-07-28
(`truncated: false`). It contains none of the six. It has no
`committed_fields_root`, no Merkle leaf, no inclusion proof, and no
`previousReceiptHash` in any file.

The repository also scopes itself to the previous revision. Its `spec.md`
(`fixtures/acta/published/spec.md`, line 125) reads: "This spec is tied to
`draft-farley-acta-signed-receipts-01`. When the draft revises to `-02`, this
repo will tag a v0.x release that exercises the old format, and the `main`
branch will move to the new format." The draft is at -02; `main` has not moved.

`receipt-verify` therefore builds all six locally
(`tools/make-acta-fixtures.mjs` → `fixtures/acta/synthetic/`) and labels them as
this repository's construction, not the draft author's.

### E2. §4.1 step 2 and §5.6 specify different signing inputs

farley §4.1 step 2 (line 705) — the signing process — reads "Canonicalize the
payload using JCS [RFC8785]". §2.2 (line 256) defines the payload as the inner
object: the member carrying `type`, `issued_at`, `issuer_id`.

farley §5.6, titled "Signature Scope (Normative Clarification)" (line 916),
reads: "The Ed25519 [...] signature MUST cover the canonical JCS bytes of
payload directly [...] Here payload is the receipt object with the signature
field removed prior to canonicalization."

For the §2.1 envelope `{payload, signature}` those are different byte strings:
`JCS(env.payload)` versus `JCS({payload: env.payload})`. The section whose
stated job is to remove the ambiguity restates it inside one sentence — it names
`payload` as the signed object and then redefines `payload` to mean the
enclosing object.

The one published ACTA-adjacent receipt that can be checked resolves it in
favour of §5.6. `fixtures/acta/published/aps-gateway-enforcement/2-external-verification/`
ships a receipt, a JWKS, and a `canonical.txt`. Recomputed here:

- `JCS(receipt minus "signature")` is byte-identical to the published
  `canonical.txt` (588 bytes, both).
- The published Ed25519 signature verifies over those bytes.
- It does not verify over `JCS(receipt.payload)`.

Asserted in `test/acta.test.ts`, "signs under the §5.6 scope and NOT under the
§4.1 scope".

`receipt-verify` implements §5.6 and, when a signature fails under it, reports
whether the receipt verifies under §4.1 instead. It never accepts the §4.1
reading — see `fixtures/acta/synthetic/sigscope-4.1.receipt.json`, which returns
`INVALID`/`signature_invalid` with the alternative named in `detail`.

### E3. marques §5.3 mandates a chain-digest scope contradicting the farley section it cites as its authority

farley §5.7, "Chain Hash Scope (Normative Clarification)" (line 930):

> The `previousReceiptHash` field MUST be the lowercase hex encoding of
> SHA-256(JCS(receipt)), where receipt is the entire signed receipt object
> **including the signature field**. Including the signature in the chain hash
> binds the chain to specific signed bytes, so re-signing an identical payload
> produces a distinct chain link.

marques §5.3 (line 733) states that implementations "MUST emit a
`previousReceiptHash` field, populated **per the digest-scope rule of Section
5.7 of [ACTA-RECEIPTS]**", and then defines that rule as SHA-256 over

> the JCS-canonical serialization ([RFC8785]) of the predecessor's signed
> payload object (the same bytes the predecessor's cryptographic signature
> covers), **NOT the envelope object that additionally includes the signature**
> or anchors top-level keys.

and concludes that this "matches Section 5.7 of [ACTA-RECEIPTS]".

The two scopes digest different bytes. farley includes the signature; marques
excludes it, and says so explicitly while asserting agreement. marques further
requires (lines 763–770) that "Implementations that previously digested the
envelope-including-signature object MUST migrate to the signing-input scope"
and that "verifiers MUST recompute under the signing-input scope" — that is, it
mandates migration away from the behaviour of the section it cites.

The two are not reconcilable by reading order: farley's rationale (chain binds
specific signed bytes, so re-signing yields a distinct link) and marques'
rationale (chain binds what the issuer attested to, recomputable from the
predecessor's payload alone) are both coherent and select opposite scopes.

`receipt-verify` implements farley §5.7 as normative. When a link fails under it
but matches a signature-exclusive scope, the verdict is `INVALID` /
`chain_linkage_broken` with the matching variant named in `detail`. Neither
scope is silently accepted.

### E4. marques §5.3's operative exclusion and its own rationale select different bytes from each other

Within §5.3, the exclusion clause says the digest is over "the predecessor's
signed payload object [...] NOT the envelope object that additionally includes
the signature **or anchors top-level keys**" — which points at the inner
`payload` member alone.

The parenthetical immediately before it says the same bytes are "the same bytes
the predecessor's cryptographic signature covers". Under farley §5.6 (E2) those
bytes are the envelope minus the signature — which *does* carry the top-level
key `payload`.

So §5.3 admits two signature-exclusive readings that disagree with each other,
independently of their shared disagreement with farley §5.7. There are three
candidate digests for one field:

| scope | bytes digested |
|---|---|
| farley §5.7 | `JCS(entire envelope, signature included)` |
| marques §5.3, exclusion clause | `JCS(payload member alone)` |
| marques §5.3, rationale clause | `JCS(envelope minus signature)` |

`receipt-verify` computes all three and names whichever one a failing link
matches. Fixtures: `fixtures/acta/synthetic/chain-farley/`,
`chain-marques-payload/`, `chain-marques-signing-input/`.

### E5. §5.3 restates the rule in the notation of the scope it just rejected

Nine lines after mandating the signing-input scope, marques §5.3 (line 778)
reads: "each newly emitted receipt's `previousReceiptHash` MUST resolve to the
**SHA-256(JCS(receipt))** of the immediately prior receipt emitted by that same
`issuer_id`".

`SHA-256(JCS(receipt))` is farley §5.7's own notation, and farley defines
`receipt` there as the envelope including the signature. The paragraph
prescribing the signature-exclusive scope and the paragraph restating it use
notations that resolve to opposite byte strings.

### E6. Neither receipt shape in the cited test-vector corpus is the §2.1 envelope

farley §2.1/§2.1.1 (lines 232–255) define the envelope as `{payload, signature}`
where `signature` is an object with REQUIRED `alg`, `kid`, and `sig` members.

The cited corpus blesses two shapes in `expected/receipt-schema.json`, joined by
`oneOf`:

- **v1 flat** — all fields at top level; `required` includes `receipt_id`,
  `receipt_version`, `public_key`, `signature`, `timestamp`. No `signature`
  object; no `issued_at`; the chain field is `parent_receipt_hash`.
- **v2 envelope** — `required` is `payload`, `signature`, `pubkey`; `signature`
  is a string; the chain field is `prev_hash`.

Neither carries a `signature` object with `alg`/`kid`/`sig`, and neither uses
`previousReceiptHash`. The corpus's `spec.md` acknowledges the split ("The
format has accumulated two interoperable shapes").

The APS receipts actually shipped in that corpus are a **third** shape again —
`{v, type, algorithm, kid, issuer, issued_at, payload, signature}` with
`signature` a hex string and the algorithm carried as `"algorithm": "ed25519"`
rather than `"alg": "EdDSA"`. That shape satisfies neither branch of the
corpus's own `oneOf`: `v1Flat` requires `receipt_id`/`receipt_version`/
`public_key` and `v2Envelope` requires `pubkey`; the receipt has none of the
four. Asserted in `test/acta.test.ts`, "matches neither branch of the corpus's
own oneOf receipt schema".

`receipt-verify` verifies the §2.1 envelope and returns
`UNVERIFIABLE`/`malformed_receipt` for the others rather than shape-sniffing
across incompatible layouts.

### E7. §8.1's replay guidance and §1's offline-audit goal pull in opposite directions

farley §1 (line 176) lists "Offline verification: Any party with the issuer's
public key can verify a receipt without network access or API calls" as a
purpose of the format, and §1 goal 1 is "Portable evidence [...] stored,
transmitted, and verified independently".

farley §8.1 (lines 1098–1099) says "Verifiers SHOULD reject receipts with
timestamps that are unreasonably old (implementation-defined; 24 hours is
RECOMMENDED as a default)."

A verifier following §8.1's default rejects every receipt in an audit older than
a day, which is the case §1 exists to serve. The draft carries no field or
parameter distinguishing a freshness check from an archival one.

`receipt-verify` does not enforce §8.1. It reports `receipt_age_hours` as an
annotation and leaves the policy to the caller.

### E8. `previousReceiptHash` is defined only inside an optional extension, and never listed as a payload field

farley defines `previousReceiptHash` in §5.7, which sits inside §5 "Commitment
Mode (Optional Extension)". The field appears at exactly two lines in the whole
document (932 and 999) and is listed in neither §2.2 (common payload fields) nor
any of the six receipt types in §3. Its JSON location, its cardinality, and its
genesis value are unspecified.

marques §5.3 notes the first point ("Upstream Commitment Mode introduces
`previousReceiptHash` as part of an optional extension. This profile makes the
linkage REQUIRED") and supplies the genesis value the upstream lacks: "The first
receipt in a chain MUST set this field to the all-zero SHA-256 value (this
profile's stipulation; [ACTA-RECEIPTS] Section 5.7 specifies only the digest
scope of subsequent links)."

`receipt-verify` treats `previousReceiptHash` as a payload member (marques'
placement) and annotates a genesis link as marques' stipulation rather than
farley's requirement.

### E9. §2.1.1 fixes an Ed25519-sized signature encoding that §5.8 makes variable

farley §2.1.1 (line 252) defines `sig` as "The Ed25519 signature over the
canonicalized payload, encoded as a lowercase hexadecimal string (128
characters for 64 bytes)."

farley §5.8 (line 938) makes the algorithm agile and lists ML-DSA-65 (FIPS 204)
as "RECOMMENDED for new deployments and post-quantum readiness". An ML-DSA-65
signature is 3309 bytes, not 64.

§2.1.1 also omits ML-DSA-65 from its own algorithm list, which admits only
`EdDSA` (MUST) and `ES256` (SHOULD) — so the field definition and the agility
section disagree on both the permitted algorithms and the signature length.

`receipt-verify` accepts any even-length lowercase hex `sig`, verifies `EdDSA`
and `ES256`, and returns `UNVERIFIABLE`/`unsupported_algorithm` for a declared
ML-DSA variant rather than treating an uncheckable signature as either good or
bad.

### E10. §5.5 inclusion proofs carry no direction bit; the construction survives it

farley §5.5, "Selective Disclosure" (lines 901–904), specifies an inclusion
proof as "the leaf's zero-based index within the canonically-sorted leaf list,
the total `tree_size`, and the ordered list of siblings [...] along the path
from the leaf to the root". No left/right indicator is carried.

This is recorded as an observation rather than a defect: because §5.1 fixes the
split at "the largest power of two strictly less than n", the side of each
sibling is recoverable from `(index, tree_size)` alone. A verifier that instead
assumed the RFC 6962 *audit path* convention without re-deriving the split would
diverge on non-power-of-two trees. `receipt-verify` re-derives it
(`rootFromProof` in `src/adapters/acta.ts`) and the five-leaf fixture
(`committed-5`) is the case that would catch the error.

### E11. Appendix C states the wrong source revision for its own change list

farley Appendix C is titled "Changes from -01" (line 1558). Its first sentence
(line 1560) reads: "This section summarizes the changes from
draft-farley-acta-signed-receipts-**02**." The document being read is -02.

### E12. `-03` exists in the author's repository while the datatracker's latest revision is `-02`

`github.com/VeritasActa/drafts` (fetched 2026-07-28) carries
`draft-farley-acta-signed-receipts-03.txt` and `-03.xml`. The IETF datatracker
document page for `draft-farley-acta-signed-receipts` lists 00, 01, 02, with -02
(2026-06-28) as current.

This adapter is written against -02, the published revision. Recorded because a
reader comparing the two sources will find different section content under the
same draft name.

### E13. The corpus's conformance check 2 names a key file the corpus does not ship

`fixtures/acta/published/spec.md` line 42 defines conformance check 2 as
"Signature validation with `fixtures/keys/public.hex`". The repository's
`fixtures/keys/` directory contains only `README.md` (full tree enumerated
2026-07-28, `truncated: false`). The public key value is present in that
README's prose; the file the check names is not in the repository.

The seed and public key it publishes are usable and were used here to confirm
E2:

```
seed       0000000000000000000000000000000000000000000000000000000000000001
public key 4cb5abf6ad79fbf5abbccafcc269d85cd2651ed4b885b5869f241aedf0a5ba29
```

which is the same key material as the `x` value in the shipped JWKS
(`TLWr9q15-_WrvMr8wmnYXNJlHtS4hbWGnyQa7fCluik`).

### E14. Positive: the §5.1–§5.3 commitment construction is unambiguous and reproduces

Unlike the signature and chain scopes, the Merkle construction is specified
tightly enough to implement twice and get the same answer. §5.1 fixes the domain
separators (`0x00` leaf, `0x01` internal) and the non-power-of-two split rule;
§5.2 fixes the canonical leaf as `JCS({name, salt, value})` with the salt
base64url-unpadded; §5.3 fixes byte-lexicographic ordering on UTF-8 names and
explicitly rules out collation, case folding, and Unicode normalization.

`tools/make-acta-fixtures.mjs` and `src/adapters/acta.ts` implement it
independently — deliberately not sharing code, so the fixtures cannot verify
against themselves — and agree on both the four-leaf and the five-leaf
(non-power-of-two) roots and on every inclusion proof.

### E15. Snapshot drift observed on re-running `tools/snapshot.mjs`

Recorded because the pinned-bytes discipline is what surfaced it. Re-running the
snapshot on 2026-07-28 changed two files unrelated to this work:

- `fixtures/verification-state/jwks/agentoracle.co.well-known.jwks.json` gained
  a third key, `ao-composed-2026-07-ed25519-3d44ba27`. Additive; the two
  existing `kid`s and their key material are unchanged, so every existing
  fixture still resolves.
- `fixtures/evidence-action/SPEC.md` corrected two occurrences of
  *draft-msebenzi-evidence-**state**-00* to *draft-msebenzi-evidence-**action**-00*.
  Prose only; no vector bytes changed and the manifest's `receipt_sha256` pins
  are unaffected.

Both were accepted into the snapshot. The full suite passes against them.
