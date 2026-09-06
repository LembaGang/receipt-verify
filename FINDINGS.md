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


---

# APPENDED 2026-09-01 — FULL-HISTORY AUDIT BEFORE EXTERNAL CIRCULATION

**Supersede, never edit. Every entry above stands as a record of what was observed on the date it
states. This block records what a full re-read on 2026-09-01 found to be superseded, contradicted by
the fixtures now shipped, or stated wider than its search.**

### A1. B4's title is wider than its body; the body stands
Title (:148): *"No mapping document is published, so §4.3 step 2 cannot be completed from published
material."* Body (:157-158): *"No document producing either digest is published anywhere this
implementation could locate."* The body names its own scope and was true of it. The rerun's erratum 1
shows why: the digest every composed fixture carried on 2026-07-25 (`3b1f2d8e…`) was replaced on
2026-07-29 by one that resolves (`0a782639…`, `FINDINGS-rerun-2026-07-29.md` lines 122-142), which is
what a placeholder replaced by a computed value looks like; the draft author has since described it
as exactly that (2026-08-30, private correspondence, restated in the interop row he signed for deposit
on 2026-08-31). The title says more than the body: erratum 1, quoted as sent at lines 116-118 of the
rerun, took a mapping document to exist on the issuer's endpoints before this run, on the strength of
the draft author's note of 8 June, which is outside this repository; whether or not one did, no
document producing the fixtures' digest did. The phrase *"a resolution-path gap, not an existence gap"* in that erratum is
this repository author's own diagnosis, as sent to the draft author, not a reply from him. The finding
survives as: **the mapping document was not resolvable from the receipt by any path a stranger could
follow.** The title's "No mapping document is published" is withdrawn as wider than its search; the
body is not. The title is the same class of unscoped negative the CPB package corrected on 2026-08-31,
in a file that correction did not reach.

### A2. Section B measured pre-repair bytes; the snapshot in this repository is post-repair
Section B was written 2026-07-25 against fixtures fetched at HEAD that day. The tree under
`fixtures/verification-state/spec-examples/` was re-snapshotted 2026-07-29 at `196df22` after the
author's repairs (`fixtures/provenance.md`). Four B-section claims are contradicted by the fixtures
now shipped beside them, and one quotation is not in the snapshot:
- **B1** (:101-103) "protected and signature byte-identical" — in the shipped pair both differ.
- **B2** (:112-117) "no `b64` and no `crit`" — the shipped detached header carries `"b64":false,"crit":["b64"]`.
- **B4 / A2** (:48, :153) mapping hash `sha256-3b1f2d8e…` — the shipped `payload-001.json` carries `sha256-0a782639…`.
- **E15** (:659-661) "gained a third key" — the shipped JWKS carries four kids.
- **B3** (:143-144) quotes `examples/README.md` on "a byte-accurate canonical serializer on both sides"
  — the shipped README does not contain that sentence. B3's measured table still reproduces.
The source line at :92-93 ("retrieved 2026-07-25 from …/HEAD/examples/") describes the bytes Section
B measured, not the bytes this repository ships; both are true of different snapshots and the file
did not say so. `FINDINGS-rerun-2026-07-29.md` cross-references A1, A2, A4, B1, B2, B3, B4, B7, B8
and does not cross-reference B3's absent quotation or E15. Both are recorded here.

### A3. C5 is superseded: the advisory it reports was closed on 2026-08-10
C5 (:274-281) reports a moderate `@hono/node-server` advisory reachable through
`@modelcontextprotocol/server-everything` in `@headlessoracle/chirindo@0.3.0`. Commit `cbe4d38`
moved this repository to `chirindo@0.4.0`, whose declared dependencies are exactly
`{"canonicalize": "^2.0.0"}` — runtime closure 108 to 2, zero advisories. C5 is a true record of
0.3.0 and does not describe the dependency this repository ships. C2 (no library entry point) was
re-checked 2026-09-01 and still holds in 0.4.0.

### A4. Section E cites farley -02; -03 (29 August 2026) renumbered the sections
`draft-farley-acta-signed-receipts-03`, sha256
`bcde71799a621305254ea8b442fc829ac6d65fcff039f365e8a2349d8e902f19`, 96433 bytes, rebuilt the section
structure. The -02 sections §5.5 to §5.10 that E1, E2, E3, E5, E7 to E11 and E14 cite do not carry
those numbers in -03; §8.1 is now "Passport Manifest"; Appendix C is now titled "Changes from -02",
which closes **E11**. Every E-entry is pinned to -02 by digest at :345-349 and remains a true record
of -02. -03 is now tracked in `refs/` and pinned in `fixtures/provenance.md`.

### A5. Section E cites marques -07; -08 (31 August 2026) resolves E3
`draft-marques-asqav-compliance-receipts-08`, sha256
`ee3ca5d7c0acc1cb9b8025d29f19a7d73991718ca35d3bf4229f7b4264976ec0`, 392828 bytes, 7840 lines, is a
rewrite: §4 is a new "Canonicalization Scope" section, and -07's §5.3 (the digest-scope section E3,
E4 and E5 cite) is now "Hash-Chain Linkage". **E3 was correct about -07** — re-read from the pinned
bytes 2026-09-01 — and **-08 §4 resolves it**, verbatim: *"No digest in this profile covers the
envelope including the signature member. Receipts outside this profile are not re-scoped by this
section: an ACTA-family receipt verified under its native format keeps the digest scope its own
format defines… An implementation that verifies both Compliance Receipts and upstream ACTA-family
receipts therefore switches digest scope on receipt format."* That is the rule this repository
implemented on 2026-07-28 (`src/adapters/acta.ts` header: "where the two disagree, farley decides"),
now stated by -08's author. E4 and E5 remain true of -07 and have not been re-read against -08; that
re-read is scheduled. -08 is tracked in `refs/` and pinned.

One observation against -08, recorded here for the date and for its author: §4 (line 657) describes
§5.7's scope as "the envelope-minus-anchors object"; §5.7 itself defines `envelope_hash` over "the
three-key object {payload, signature, anchors}" and states "B MUST NOT… strip the anchors array";
-08's change list (line ~7251) agrees with §5.7. Two implementations reading §4 and §5.7 compute
different bytes for `envelope_hash`. Same class as E3 against -07. Resolution belongs to -08's author.

**Appended 2026-09-02, 14:2xZ — the author's ruling on the two-scope observation above, and the -08 rerun.**
The observation in the previous paragraph was sent to the draft author on 2026-09-02 at 09:00:13Z
(Gmail `1a06158f54654490`). He ruled at 13:07:20Z the same day (Gmail `1a0623b358cfaf65`, bytes held by
the founder; this repository holds the ruling only as reported in `CC_HANDOFF_2026-09-02_marques-08-rerun.md`,
not as bytes it read). The ruling: **§4 carries the intent** — the counterparty binding is over the
envelope minus anchors — **and §5.7 is the stray**, because anchors are OPTIONAL and can change after
issuance when an OpenTimestamps proof upgrades, so a digest over them would pin a passing state of the
peer's receipt rather than its signed bytes. `-09` corrects §5.7, adds an explicit `scope` member to
`counterparty_binding`, and re-pins the vector that hashed the three-key object. For the `-08` rerun he
directed, quoted from the handoff: **"for the -08 rerun, grade the text as 5.7 reads today"**, text and
implementation scored separately.

**This side guessed the other way, and the record says so.** The paragraph above reads "I think 5.7 and
the change list carry your intent and section 4's sentence is the stray" — the reverse of the ruling.
The reasoning offered here (anchors are part of what the peer emitted) is not the reasoning that
settles it; mutability after issuance is, and it was not considered. The observation that the two
sections disagree was correct; the guess at which one was the stray was wrong.

The rerun ran 2026-09-02 and is `FINDINGS-rerun-2026-09-02.md`. It records that all four July errata are
RESOLVED as sent (E3, E4, E5, E8), that the chain-scope resolution is corroborated byte-for-byte in the
author's own vectors at `asqav-sdk@05c1c49`, and it opens M5 (this disagreement), M6 (the published
`counterparty_binding.envelope_hash` matches neither candidate scope, nor its own vector's `sha256`) and
M7 (eight of sixteen `asqav-*` vectors carry no anchor yet expect `verified`, against §5.4's "Verifiers
MUST reject"). It also corrects which sentence of §4 carries E3's resolution: not "No digest in this
profile covers the envelope including the signature member" (line 658-659), which is itself one side of
M5, but §5.3 lines 944-948 and §4 lines 651-653.

**Forward note.** `-09` moves the `envelope_hash` scope to envelope-minus-anchors. Nobody reading this
block or the rerun should implement `-08` §5.7 as it stands. `-09` did not exist as bytes on 2026-09-02
and no verdict is rendered on it here.

**Appended 2026-09-02, 14:47Z — M6 is identified, and the record should not leave it standing as an open negative.**
The published `counterparty_binding.envelope_hash` `0d6c88a1…`
(`DWyIoW6W/TQpvhPkTclXBi931BfcDD6ijk+kliMN4qk=`) is the three-key digest of the
peer envelope as it stood before SDK commit `ee8a3e7` (PR #416, 2026-08-04
21:03:12 +0200), which changed one member — `payload.previousReceiptHash`, from
`"sha256:" + "0"×64` to the bare 64-zero hex — and recomputed each vector's
`canonical` and `sha256` but not that derived literal. It was reproduced from
the blob bytes of all eight commits touching `conformance/vectors.json`
(`0d6c88a1…` at `3e13a0d`, `7f0b869`, `4cbdfc0`; `e89bf2fe…` at `ee8a3e7` and
after) and confirmed directly by restoring the seed member on the pinned
`05c1c49` envelope, which yields `0d6c88a1…` exactly; the stale value is echoed
in five vectors and is still at the upstream tip `f67ecad` (2026-09-02 11:52:03
+0200, `grep -c DWyIoW6W conformance/vectors.json` = 13). The 37-candidate sweep
recorded in `FINDINGS-rerun-2026-09-02.md` is therefore superseded by
identification rather than extended — it searched only byte strings derived from
the envelope as published at `05c1c49`, and the pre-`#416` envelope was outside
that set.

**Appended 2026-09-05 — correction, on the author's reading of 2026-09-04 (Gmail 1a06e2e9563fc74b): -08 §4 does not state "farley decides".**
Quoted from the pinned bytes rather than retyped: `refs/draft-marques-asqav-compliance-receipts-08.txt`,
sha256 `ee3ca5d7c0acc1cb9b8025d29f19a7d73991718ca35d3bf4229f7b4264976ec0`, §4 "Canonicalization Scope"
(which opens at line 570 and runs to line 668, §5 opening at line 677), lines 651 to 668 whole, so the
sentence quoted above at :734-738 can be read against the lines it came from. The quoted passage begins
part way through line 651, at "The digest scopes of this profile".

```
651    outside the signed content.  The digest scopes of this profile
652    therefore resolve to the payload member: the chain-link digest of
653    Section 5.3 and the JSON-framing signature input each cover the JCS-
654    canonical serialization of a receipt's payload member (the
655    predecessor's for the chain link, the receipt's own for the
656    signature), and the only envelope-level scope in this profile is the
657    envelope-minus-anchors object of Section 5.7, which exists precisely
658    to bind the peer's signature value.  No digest in this profile covers
659    the envelope including the signature member.  Receipts outside this
660    profile are not re-scoped by this section: an ACTA-family receipt
661    verified under its native format keeps the digest scope its own
662    format defines - for an upstream [ACTA-RECEIPTS] Commitment Mode
663    receipt, the whole-receipt scope of its "Chain Hash Scope" section.
664    An implementation that verifies both Compliance Receipts and upstream
665    ACTA-family receipts therefore switches digest scope on receipt
666    format - payload-member scope under this profile, whole-receipt scope
667    under upstream Commitment Mode - and needs no separate fixture set
668    per format family.
```

**The attribution is withdrawn.** The sentence at :738-740, "That is the rule this repository implemented
on 2026-07-28 (`src/adapters/acta.ts` header: "where the two disagree, farley decides"), now stated by
-08's author", is withdrawn as an attribution. What §4 states is scope-switching on receipt format: a
Compliance Receipt keeps the payload-member scope of its own profile, an ACTA-family receipt verified
under its native format keeps the whole-receipt scope that format defines, and an implementation reading
both switches between them on the receipt's format. That is not a rule under which farley decides when
the two texts disagree, and the author endorsed no adapter header of ours. The claim that -08 §4 resolves
E3 stands and is unchanged; what does not stand is reading §4 as this repository's July rule restated by
the profile's author.

**What "farley decides" was.** It was this repository's own rule, written into the acta adapter header on
2026-07-28. -07 was read as a profile layered on farley, and where -07's text disagreed with farley on
the chain-digest scope (E3) the receipt was graded under farley's scope and the disagreement was reported
on the verdict. Under that rule a Compliance Receipt is graded under a scope its own profile does not
use, so it fails and is named as a variant. Under -08 §4 it is not graded that way at all: it verifies
under the payload-member scope of its own profile. -08 resolves E3 by switching scope on format, not by
ranking one text above the other, and those two resolutions agree on no receipt this tool would grade
differently only because they never meet.

**The behaviour is unchanged, and it is consistent with §4.** `detect()` in `src/adapters/acta.ts`
declines an envelope carrying a top-level `anchors` array with a payload-member signature scope, so
farley's whole-receipt scope is never applied to a Compliance Receipt and this tool grades no
Compliance-Receipt content. That is what §4's last sentence asks of an implementation that reads only one
of the two families. No test, fixture, verdict or reason token changes with this correction; it is a
correction to what the record says about the profile's text, not to what the code does.

**Where else this was corrected, and what was left.** The same commit corrects the acta adapter header
(`src/adapters/acta.ts`, the lines that carried "where the two disagree, farley decides" and "§4 states
that rule itself"), the Format 3 opening in `README.md`, the marques source string in `src/coverage.ts`,
the file comment at the top of `test/acta.test.ts`, and appends a dated correction paragraph under 0.1.2
in `RELEASE-NOTES.md`. One place is left alone on purpose: `cc-output/receipt-verify-acta-demo-2026-07-28.md`
is a dated transcript of a run on 2026-07-28 and is kept as a historical record rather than corrected. It
describes -07 as a profile layered on farley, which is what this side held that day, and it does not
carry the withdrawn phrase. The sentence at :738-740 above is likewise not edited, because this file's
rule is that entries are corrected by appending rather than in place; this block is that correction.

**Appended 2026-09-05 — second correction, on the author's reading of 2026-09-05 (Gmail 1a07050e3d95841a): the sentence "so farley's whole-receipt scope is never applied to a Compliance Receipt and this tool grades no Compliance-Receipt content" was false at 0a7b167.**
The sentence corrected here is the one at :845-848 in the block immediately above, quoted whole as it
stands there: "`detect()` in `src/adapters/acta.ts` declines an envelope carrying a top-level `anchors`
array with a payload-member signature scope, so farley's whole-receipt scope is never applied to a
Compliance Receipt and this tool grades no Compliance-Receipt content." Its first clause is true —
`detect()` did decline an envelope carrying an `anchors` ARRAY. The consequence drawn from it is
withdrawn, not edited: the array was the only shape declined, so a -08 Compliance Receipt whose `anchors`
member was null, or absent, was claimed as `acta.receipt/0` and graded. The sentence above is left
standing where it is, under this file's rule that entries are corrected by appending rather than in place.

**What the code was, and what it is.** At 0a7b167, `src/adapters/acta.ts` line 169 read
`if (Array.isArray(p.env.rest["anchors"])) return false;` — the only anchors check in `detect()` — and
`parseEnvelope()` copies every top-level member other than `payload` and `signature` into `rest` without
inspecting it, so a null `anchors` and an absent `anchors` both passed that check and the envelope was
claimed. At this commit the line reads `if ("anchors" in p.env.rest) return false;`: the KEY is the
discriminator, with any value. That is -08's own rule, §5.3 line 1037: "the two wire formats are
distinguished by the Asqav-only anchors key".

**Measured here at 0a7b167, before the fix** (`npm run build`; `node dist/cli.js <input> --jwks
fixtures/asqav/05c1c49/verifier/conformance-vectors/asqav-01-genesis-permit/jwks.json --json`; the
constructed variants are that vector's own bytes re-serialised with the one member changed):

| input | format | verdict | reason | stopped_at / detail |
|---|---|---|---|---|
| asqav-01-genesis-permit/receipt.json as published (anchors `[]`) | unknown | UNVERIFIABLE | format_unrecognized | `stopped_at` null; declined, as the withdrawn sentence says |
| same, `anchors: null` (constructed) | acta.receipt/0 | UNVERIFIABLE | malformed_receipt | `signature_encoding`: "signature.sig is not lowercase hexadecimal; §2.1.1 fixes the encoding (88 chars given)" |
| same, `anchors` member removed (constructed) | acta.receipt/0 | UNVERIFIABLE | malformed_receipt | `signature_encoding`: same detail |
| same as null, sig re-encoded as hex (constructed) | acta.receipt/0 | UNVERIFIABLE | unsupported_algorithm | `algorithm_supported`: alg "Ed25519"; this tool verifies EdDSA and ES256 |
| same, alg set to EdDSA as well (constructed) | acta.receipt/0 | UNVERIFIABLE | key_unresolvable | `key_resolution`: the vector's jwks.json is not a JWK Set this adapter reads (kty undefined) |
| asqav-05-hash-mode-prod/receipt.json as published | — | — | — | not measured here; see the coverage note below |
| asqav-10-hash-mode-multikey/receipt.json as published | — | — | — | not measured here; see the coverage note below |

The five measured rows reproduce the Lead's table in
`cc-output/LEAD_VERIFICATION_2026-09-05_detect-anchors.md` row for row, with no difference in format,
verdict, reason or stopped_at. The last two rows are NOT measured here and are relayed from that
document, not verified in this repository: `asqav-05-hash-mode-prod` and `asqav-10-hash-mode-multikey`
are absent from this working tree — searched by filename across the whole tree except `node_modules/`,
and searched the contents of `fixtures/asqav/05c1c49/conformance/vectors.json`, with no hit for either
name; `fixtures/asqav/05c1c49/verifier/conformance-vectors/` holds three vectors only
(`acta-02-chain-link`, `asqav-01-genesis-permit`, `asqav-03-chain-link`). The Lead measured them against
a clone of asqav-sdk at 05c1c49 and reports both as the flat hash-mode shape, refused at the payload
check and never claimed.

**Two of the author's specifics did not hold on the bytes.** First, the verdict on the shapes his profile
emits is UNVERIFIABLE `malformed_receipt` stopping at `signature_encoding`, never INVALID
`signature_invalid` — scope of that negative: the five inputs measured above, that is
`asqav-01-genesis-permit` as published plus the four constructed variants of it, run in this repository at
0a7b167; the sixteen asqav-* vectors at 05c1c49 are the Lead's coverage, not mine. Second, the two M7
null vectors, `asqav-05` and `asqav-10`, are the flat hash-mode shape (top-level `action_id`, `agent_id`,
`algorithm`, `anchors` null, `hash`, …, `payload` null, `signature_b64`), refused by `parseEnvelope()` at
the payload check and so never claimed at all — scope: relayed from the Lead's runs against the 05c1c49
clone, since as stated above neither vector is present in this tree, searched as described.

**Why the KEY and not the payload type prefix.** The discriminator cannot be `payload.type`, and the
author's own corpus is what rules it out: `fixtures/asqav/05c1c49/verifier/conformance-vectors/acta-02-chain-link/receipt.json`
is his upstream ACTA vector, whole-receipt scope, expected verified; read from the fixture its top-level
keys are exactly `["payload","signature"]` — no `anchors` member — and its `payload.type` is
`"protectmcp:decision"`, the same prefix `asqav-01-genesis-permit` carries (top-level keys
`["payload","signature","anchors"]`, `anchors` `[]`, `payload.type` `"protectmcp:decision"`). A detect
rule on the type prefix would decline acta-02, which is an ACTA receipt this adapter must claim. The key
separates them and the type does not. An ABSENT `anchors` member is therefore claimed on purpose: an ACTA
§2.1 envelope carries none, and under -08 §5 line 692 a conformant Compliance Receipt always carries one
— "Anchors MUST be projected into a top-level anchors array with a type discriminator and a value field
carrying the anchor bytes".

**The limit, named.** The -08 author has said -09 will make an absent `anchors` member conformant and a
null one malformed (his mail of 2026-09-05, Gmail 1a07050e3d95841a). Once absent is conformant the key no
longer distinguishes the two wire formats, and the type prefix does not either, for the acta-02 reason
above. This commit does not solve that case and does not pretend to: the discriminator for -09 is the
profile author's to name, and it is put back to him in the reply. What is fixed here is -08 as written.

### A6. A machine path is not a provenance source
:233-234 cites `C:\Users\User\agent-action-receipt-vectors` as the source of
`fixtures/evidence-action/`. No reader can resolve that path. The corpus is a private snapshot whose
per-file digests in `fixtures/provenance.md` are the provenance; the path is withdrawn as a citation.

### A7. Six citations were corrected in place on 2026-08-02 and this file did not say so
Commit `1fb91c9` corrected six line citations (E1 twice, E2 twice, E7, E10). Its message states no
claim, quotation or measured value changed; the corrected citations were re-verified 2026-09-01. The
companion document says entries are "never edited in place"; this file carried no erratum for those
six edits. Recorded now so the git history and the prose agree.


## F. `oracleinsight.xyz` key registry and `insight.attestation/eip712`

This file carried no Insight section before this one. At `3b6ca3f`, `grep -ic insight FINDINGS.md`
returned 0, and so did a case-insensitive search for `eip712`, `eip-712`, `attestation` and
`oracleinsight` in the same file. The Insight record lived in `fixtures/provenance.md`, in the three
round notes under `cc-output/` (`VERIFICATION_NOTE_2026-09-02_insight-execution-receipt.md`,
`…-v3-recheck.md`, `…-v4-round3.md`) and in `test/insight.test.ts`. The section is opened here rather
than left implicit, and it begins with the block below.

Source of every value in this section: `refs/insight-oracle-keys-2026-09-02T1741Z.json`
(sha256 `76522cd33edcb94a822a82cf6c70013f9d34489a39447912c28d8336fcc87ae2`, 17,019 B) and
`refs/insight-oracle-keys-2026-09-05T1829Z.json`
(sha256 `7cc00b957f14e1a954bcbff7dd0b5e97b9f4af1ef8c2e21cb9fa879339ce7330`, 17,958 B), plus the two
2026-09-05T18:30Z endpoint responses pinned under `fixtures/insight/`. Retrieval rows are in
`fixtures/provenance.md`.

**Appended 2026-09-05 — the registry changed after the 17:41Z pin: the diff, the sample key, H8 as measured**

`npm run drift` at `3b6ca3f` reported `changed` for `https://www.oracleinsight.xyz/.well-known/oracle-keys.json`:
the first `changed` outcome that tool has produced against any upstream. (Two git upstreams have
moved their tips since being pinned; both are `moved_untouched`, byte-unchanged at every pinned path,
which is a different fact and is why `changed` is a separate outcome.) It was re-fetched at
2026-09-05T18:29:05Z (HTTP 200, `application/json`, `Cache-Control: public, max-age=300`,
`X-Vercel-Cache: MISS`, no `ETag` and no `Last-Modified`) and pinned byte-exact. The digest is the one
drift predicted. Nothing below is taken from the handoff's summary paragraph; every count is counted
from the two pinned files, and where the two disagree the pins are what is recorded.

### F1. The diff, from the bytes

A full recursive comparison of the two parsed documents reports **exactly four leaf differences, all
additions**. Nothing was removed and no existing value changed.

| what | 17:41Z pin | 18:29Z pin |
|---|---|---|
| top-level members | 13: `issuer`, `mic`, `public_keys`, `revoked_keys`, `attestation_enabled`, `schemas`, `verify`, `sample`, `watch_verify`, `watch_sample`, `execution_verify`, `execution_sample`, `key_rotation_policy` | the same 13, in the same order |
| `issuer` / `mic` / `attestation_enabled` | `https://www.oracleinsight.xyz` / `Insight Oracle Safety Attestation` / `true` | unchanged |
| `verify` | `…/api/v1/safety/attestation/verify` | unchanged |
| `sample` | `…/api/v1/safety/attestation/sample` | unchanged |
| `watch_verify` / `watch_sample` | `…/api/v1/oracle-watch/attestation/verify` / `…/sample` | unchanged |
| `execution_verify` | `…/api/v1/execution/attestation/verify` | unchanged |
| `execution_sample` | `…/api/v1/execution/attestation/sample` | unchanged |
| `key_rotation_policy` | "config-driven multi-key; rotate by publishing new key_id with validFrom, retaining prior key with validUntil for overlap; revoke on compromise (annual target or immediate)" | unchanged, character for character |
| `revoked_keys` | `[]` | `[]` |
| `public_keys` | **2 entries** | **3 entries**; the first two are deep-equal to the 17:41Z pair |

Key entries, old versus new:

| key_id | address | algorithm | validFrom | validUntil | revoked | role | in 17:41Z | in 18:29Z |
|---|---|---|---|---|---|---|---|---|
| `insight-oracle-safety-v2` | `0xa268676C85b927D64a4e2384636874f76D69e419` | EIP-712/secp256k1 | `2026-08-05` | `2026-09-02T17:35:36.000Z` | false | *(no member)* | yes | yes, unchanged |
| `insight-oracle-safety-v2-202609` | `0x6506F789Edd43338A416f59822A63F309f97E8ce` | EIP-712/secp256k1 | `2026-08-26T17:35:36.000Z` | `null` | false | *(no member)* | yes | yes, unchanged |
| `insight-oracle-safety-sample` | `0xa41d5Ee795d95B87B3AA988150fC2d5e5fE5A534` | EIP-712/secp256k1 | `2026-09-03` | `null` | false | **`"sample"`** | **no** | **yes, new** |

The new entry also carries a member no key in any of the five pins has carried before, `note`:
"SAMPLE ONLY: receipts signed by this key carry synthetic demo facts (clearly-labelled demo inputs, no
real settlement). Verify them to exercise the signature loop; never treat them as evidence of a real
trade." `role` and `note` appear on this key and on no other, in either pin.

Schemas. Every entry name, `schemaVersion`, signing status and field count is unchanged; the counts
below were obtained by taking `length` of each published `eip712.types[primaryType]` array in each
file, not by reading a declared number.

| entry | primaryType | schemaVersion | retiredForSigning | fields, 17:41Z | fields, 18:29Z |
|---|---|---|---|---|---|
| `ExecutionReceipt` | ExecutionReceipt | 4 | false | **44** | **44** |
| `ExecutionReceiptV3` | ExecutionReceipt | 3 | true | 43 | 43 |
| `ExecutionReceiptV2` | ExecutionReceipt | 2 | true | 32 | 32 |
| `ExecutionReceiptV1` | ExecutionReceipt | 1 | true | 30 | 30 |
| `OracleSafetyCheck` | OracleSafetyCheck | 3 | false | 27 | 27 |
| `OracleSafetyCheckV2` | OracleSafetyCheck | 2 | true | 26 | 26 |
| `OracleSafetyCheckV1` | OracleSafetyCheck | 1 | true | 11 | 11 |
| `OracleSafetyRecheck` | OracleSafetyRecheck | 2 | false | 28 | 28 |
| `OracleWatchCheck` | OracleWatchCheck | 2 | false | 26 | 26 |
| `OracleWatchCheckV1` | OracleWatchCheck | 1 | true | 22 | 22 |
| `CanonicalPreTradeRequest` | CanonicalPreTradeRequest | *(none)* | false | 5 | 5 |

**The `ExecutionReceipt` v4 field list is diffed field by field and is identical.** Both pins publish
the same 44 `{name, type}` pairs in the same order: added `[]`, removed `[]`, order identical. The
domain is `{name "Insight Execution", version "1", chainId 1}` in both. The list, in order:
`bindingMode`, `claimRole`, `subject`, `taker`, `preTradeUid`, `destinationPreTradeUid`,
`preTradeUidsHash`, `requestHash`, `sourceAssetId`, `destinationAssetId`, `subjectChainId`,
`settlementChainId`, `action`, `quotedPrice`, `executedPrice`, `priceScale`, `quoteBasis`,
`quoteBlockNumber`, `quoteVenueIndependent`, `priceDeltaBps`, `maxSlippageBps`, `slippageSatisfied`,
`quotedAmountUsd`, `executedAmountUsd`, `actualFeeUsd`, `measuredFieldsHash`, `fillStatus`,
`priceExecutionStatus`, `txHash`, `blockNumber`, `executedAt`, `preTradeSignedAt`,
`attestationAgeAtExecSeconds`, `priceStateAgeAtExecSeconds`, `participantCount`,
`requiredParticipantCount`, `sourceGroupCount`, `requiredSourceGroupCount`, `independenceSatisfied`,
`mevRiskBps`, `reasonCodesHash`, `validUntil`, `schemaVersion`, `environment`.

**The handoff that commissioned this work said the live registry listed ExecutionReceipt v4 with 39
fields where the pin recorded 44, and marked that reading as a fetch tool's summary rather than a
measurement. It is wrong: both pins publish 44, and the same 44.** `test/insight.test.ts` asserts the
count on each pin, the equality of the two lists, and the empty added/removed sets; a 39-field
publication is what those assertions go red against.

What did change under `schemas.ExecutionReceipt` is three sibling members, added, none removed:

- `commitments` — prose definitions for two derived fields: `preTradeUidsHash` as
  "keccak256(concat(uids in route order, 32 raw bytes each, no separator)); empty set ->
  keccak256(\"\")", and `measuredFieldsHash` as "keccak256(join(\",\", sorted unique measured field
  names)); universe + empty-set rule as for preTradeUidsHash". Both agree with what this adapter
  already recomputes: `uidsHashCandidates` names the packed source-first construction as the matching
  one on the 2026-09-02 package, and `measuredFieldsHash` for the empty set recomputes to
  `keccak256("")` = `0xc5d2…a470` there. The registry has written down what the bytes already said.
- `sentinels` — `attestationAgeAtExecSeconds` value `4294967295` meaning "undefined — the paired
  pre-trade attestation did not exist at execution (signed after the fill); such a receipt is never
  FAITHFUL". This is the issuer acting on B2 of the round-3 note, which observed the field signing 0
  for an attestation that did not yet exist. **This tool does not read the sentinel.** A receipt
  carrying `4294967295` in that field is treated by `precedenceAnnotations` as an age like any other.
  Recorded, not fixed here.
- `sampleSigningKeyRole` — the string `"sample"`. The registry now states, inside the schema, which
  key role signs its samples.

### F2. The samples, and H8

Both endpoints the **new** registry names were fetched at 2026-09-05T18:30Z and pinned byte-exact.
Each mints a fresh signature per call, so each pin is one observation that cannot be re-fetched.

| endpoint | registry member | pinned as | bytes | sha256 |
|---|---|---|---|---|
| `https://www.oracleinsight.xyz/api/v1/execution/attestation/sample` | `execution_sample` | `fixtures/insight/execution-sample-2026-09-05T1830Z.json` | 4894 | `a2c442e02df4682899ee9707d0c695e17ce4f65029b2ccd7c67728061f143b5b` |
| `https://www.oracleinsight.xyz/api/v1/safety/attestation/sample` | `sample` | `fixtures/insight/safety-sample-2026-09-05T1830Z.json` | 4052 | `28110d2f0ca8286168a457254afeb99204312b39ed751ba9cac38a81e32f6139` |

For each, the EIP-712 digest was recomputed through this adapter's own path (`eip712Digest`, written
from the EIP text) and the signer recovered from it with `recoverAddress`:

| | `execution_sample` | `sample` (safety) |
|---|---|---|
| primaryType, version | `ExecutionReceipt`, v4, 44 signed fields | `OracleSafetyCheck`, v3, 27 signed fields |
| uid | `0xd6b8fcfb66b8862661c09a43e1bfd283d4397ecebf14fc478a64af814bec76b4` | `0x2750ef636e144b42bd95a6857631e3e9d5338a13557a97a43aef0f4765235f5e` |
| our digest == uid | yes | yes |
| **recovered signer** | **`0xa41d5ee795d95b87b3aa988150fc2d5e5fe5a534`** | **`0xa41d5ee795d95b87b3aa988150fc2d5e5fe5a534`** |
| registry entry matched by address | `insight-oracle-safety-sample`, role `"sample"`, validFrom `2026-09-03`, validUntil `null`, revoked `false` | the same entry |
| a mark in the signed fields | none | none |
| `environment` in the signed fields | `"production"` | *(the v3 safety layout has no `environment` field)* |
| the wrapper | `isSample: true`, `note` beginning "SYNTHETIC sample: signed by the dedicated SAMPLE signer (see .well-known registry, role \"sample\")…" | `note` naming "the dedicated SAMPLE signer (.well-known registry, role \"sample\")" |

Recovery is driven red on both: changing `environment` to `nonproduction` on the execution sample
moves the recovered address to `0x47ed0d0c7510512b1e21e3a7658e164e2bc9186e`, adding one to
`executedPrice` moves it to `0xa0b076050a01f7d29dcde5095465b876b8b0d2dc`, and flipping the safety
sample's `verdict` to `FAIL` moves it to `0x31ab7c4137aff89204e38e50da20c6fb1518a74e`. Each is one
specific other address, which an implementation that shortcut the digest could not reproduce.

**H8: CLOSED IN PRODUCTION.** Both samples the registry names are signed by
`0xa41d5Ee795d95B87B3AA988150fC2d5e5fE5A534`, recovered from the pinned bytes, and that address is
the registry's `insight-oracle-safety-sample` entry, which the registry labels `role: "sample"`. The
production key `insight-oracle-safety-v2-202609` signs neither. That is the remedy the round-3 letter
named — "sign samples with a key the registry labels as non-production" — and the issuer took it.

Three things that closing leaves standing, stated so the close is not read as wider than it is:

1. **The signed fields still carry no mark, and still say `environment: "production"`.** Searching the
   44 signed values and field names of the execution sample for `SYNTHETIC`, `synthetic`, `Synthetic`,
   `SAMPLE`, `Sample`, `sample`, `demo`, `DEMO`, `Demo`, `fake` and `mock` returns nothing; the single
   substring hit anywhere is `test` inside the field *name* `attestationAgeAtExecSeconds`, which is
   neither a value nor a mark. `fillStatus` is `FULL` and `slippageSatisfied` is `true`. What
   distinguishes the sample is the key it was signed with, not the content it was signed over.
2. **The distinction therefore requires the registry.** A party holding only the stripped attestation
   can recover the signer, but needs the published registry to learn that that signer is a sample key.
   That is a weaker property than a self-describing signed field, and it is the property the issuer
   chose. It is enough for any verifier that resolves keys against the registry — which is what this
   tool does, and what a verifier must do anyway.
3. **This tool does not yet say it.** See F3.

### F3. `parseRegistry` does not read `role`, so nothing this tool prints distinguishes a sample key

`RegistryKey` carries `keyId`, `publicKey`, `revoked`, `validFrom`, `validUntil` and
`malformedWindow`, and `parseRegistry` populates exactly those six from each `public_keys` entry.
`role` and `note` are dropped. The consequence, measured: the 18:30Z execution sample against the
18:29Z pin returns **VALID / verified**, resolved key `insight-oracle-safety-sample`, annotation
`identity = signer_in_registry (insight-oracle-safety-sample)` — a correct result with no indication
anywhere in the verdict, the reason, the key line or the annotations that the registry calls this key
a sample signer. A consumer branching on the verdict alone treats a synthetic demo receipt exactly as
it treats a real one; only a consumer that reads the `kid` string and happens to know what
`insight-oracle-safety-sample` means does better, which is a naming convention, not a check.

**The check that would close it:** carry `role` (and, since it is published, `note`) onto
`RegistryKey`, and on the `valid` branch of `resolveRegistryKey` emit the role on the result — as an
annotation for a role the tool does not act on, and, for `role: "sample"` specifically, a decision the
issuer has effectively already made for us. Not implemented here: it is not a one-line reason token on
an existing path — it needs a new member on a published interface, a new annotation, and a decision
about whether a sample-role key should be able to reach VALID at all. Asserted as a test rather than
only described: `test/insight.test.ts`, "but the adapter does not yet read `role`", pins the six
members `RegistryKey` actually carries, and goes red the day a seventh is added.

### F4. What the adapter does with the two registries

Every run below is `insightAdapter.verify` over the named file, with the named registry bytes and the
named evaluation instant. `--allow-unregistered-signer` is off except where the row says otherwise.

| artefact (file) | `--now` | vs 17:41Z pin | vs 18:29Z pin |
|---|---|---|---|
| `fixtures/insight/execution-receipt-bytes-2026-09-02-v4.json` | 1788361990 | UNVERIFIABLE / `key_unresolvable`; "not among the **2** published keys"; `registry_schema = match (v4)` | UNVERIFIABLE / `key_unresolvable`; "not among the **3** published keys"; `registry_schema = match (v4)` |
| the same, `--allow-unregistered-signer` | 1788361990 | VALID / verified; key = the artefact's own `attester` `0xf39Fd6e5…2266`, `identity = signer_not_in_registry` | identical |
| `fixtures/insight/execution-sample-attestation-2026-09-02T1546Z.json` | 1788363959 | VALID / verified; key `insight-oracle-safety-v2-202609`; `registry_schema = match (v4)` | VALID / verified; same key, same schema line, origin now the 18:29Z pin |
| `fixtures/insight/execution-sample-2026-09-02T1741Z.json` (`data.attestation`) | 1788370923 | VALID / verified; key `insight-oracle-safety-v2-202609` | VALID / verified; same |
| `fixtures/insight/execution-sample-2026-09-05T1830Z.json` (`data.attestation`) | 1788633057 | UNVERIFIABLE / `key_unresolvable`; `identity = signer_not_in_registry` | **VALID / verified; key `insight-oracle-safety-sample`; `registry_schema = match (v4)`** |
| `fixtures/insight/safety-sample-2026-09-05T1830Z.json` (`data.attestation`) | 1788633059 | UNVERIFIABLE / `key_unresolvable`; `identity = signer_not_in_registry` | **VALID / verified; key `insight-oracle-safety-sample`; `registry_schema = match (v3)`** |

The two 2 September artefacts are unaffected by the change, which is the point of keeping the old pin:
adding a key to a registry must not move a verdict that did not depend on it, and it does not. The
`recovered_signer`, `digest` and `uid_equals_digest` annotations are byte-identical across the two
registries for every row; only `identity`, the key line and the "among the N published keys" count
differ, and N is 2 against the old pin and 3 against the new one, counted by the adapter from the
bytes it was handed.

`detect` was run over all five files and over the three extracted attestations. It claims the bare
attestation object in every case and **declines the endpoint wrapper**: the `{success, data, meta}`
envelope the sample endpoints return is not an Insight attestation and is not claimed by this adapter
or by any of the other three (`evidence.action/0`, `verification.*`, `acta.receipt/0` all return false
on both the wrapper and the attestation). That is the fail-closed answer for an unrecognised shape,
and it means a caller handed a raw sample response must unwrap `data.attestation` itself — which is
what the cases in `test/insight.test.ts` do, and what the 15:46Z pin's derived-attestation file
exists to spare them. The detection sweep in that file asserts the other three adapters claim zero of
the files under `fixtures/`; that sweep now covers the two new pins.

### F5. A key's validity window is compared against `--now`, never against the receipt's own signing instant

The handoff asked whether a receipt signed by `insight-oracle-safety-v2` after its `validUntil`
(`2026-09-02T17:35:36.000Z` = 1788370536) would still resolve that key. Measured against the 18:29Z
pin through `resolveRegistryKey`:

| key | at 1788363000 (15:30Z) | at 1788370900 (17:41:40Z) | at 1788632945 (2026-09-05T18:29:05Z) |
|---|---|---|---|
| `insight-oracle-safety-v2` | `valid` | `expired` (validUntil 1788370536) | `expired` |
| `insight-oracle-safety-v2-202609` | `valid` | `valid` | `valid` |
| `insight-oracle-safety-sample` | `not_yet_valid` (validFrom 1788393600) | `not_yet_valid` | `valid` |

So the window is read, and B-29's fix holds against the new pin as it did against the old one. **The
gap is not that the window is ignored; it is that the window is compared against the caller's clock
and never against the artefact's own.** Check 5 calls
`resolveRegistryKey(ctx.registry, art.attester, ctx.now)`, and `ctx.now` is `opts.now` (the `--now`
flag) falling back to the wall clock; check 6 compares the artefact's signed `validUntil` against the
same `ctx.now` and fails only when `now` is PAST it, never when `now` is before the artefact could
have existed. Nothing joins the two.

Demonstrated from bytes, with nothing re-signed and no Insight key material used: the pinned
2026-09-02T17:41Z sample (`signedAt` 2026-09-02T17:42:03.934Z, signed `executedAt` 1788370923) run
against a registry built from the 18:29Z pin with `insight-oracle-safety-v2-202609`'s `validUntil`
moved to `2026-09-02T17:41:00.000Z` = 1788370860 — 63 seconds *before* the receipt's own `executedAt`:

- `--now 1788370800` (inside the moved window): **VALID**, `identity = signer_in_registry
  (insight-oracle-safety-v2-202609)`. The receipt was signed after that key stopped being vouched
  for, and the tool says nothing.
- `--now 1788370900` (past it): UNVERIFIABLE / `expired`, `identity = key_expired
  (insight-oracle-safety-v2-202609)`. The control, so the case is not vacuous.

**The check that would close it:** compare the resolved key's `[validFrom, validUntil]` against the
artefact's own signed instant — `executedAt` for an `ExecutionReceipt`, `checkedAt` for an
`OracleSafetyCheck` — in addition to `--now`, and report a receipt whose own timestamps fall outside
the window of the key that signed it. **Not implemented in this handoff**, and it is not a one-line
reason token on an existing path: it needs a per-primaryType choice of which signed member is the
artefact's instant, a new reason code distinct from `expired` (which currently means "at the instant
you asked about"), and a decision about which verdict it carries. Recorded here and asserted in
`test/insight.test.ts` as "a receipt signed after its key's window shut still resolves, if the caller
names an earlier `--now`", which goes red the day it is closed.

### F6. What this section does not establish

That the samples describe anything real — they do not, by construction and by the issuer's own
statement. That the production signing flow is sound beyond the two responses measured here. That the
registry will not move again: it moved between 2026-09-02T17:42Z and 2026-09-05T18:29Z with no
announcement, and the only reason this was noticed is that `npm run drift` asks. Nothing here is a
statement about any key material, and nothing here was fetched other than the registry URL and the
two endpoint URLs the registry itself names.

**Appended 2026-09-07 — the two adapter gaps from the 5 September run, closed**

F3 and F5 each recorded a gap in this tool, with the check that would close it and a test case that
would go red the day it was closed. Both are closed here, and both of those cases went red, which is
what dated them. Every value below is measured through `insightAdapter.verify` against the pinned
bytes named in F's source line; nothing is re-signed and no Insight key material is used.

### F7. `role` is carried and printed on every verdict; the verdict is unchanged (closes F3)

`parseRegistry` parsed each `public_keys` entry and kept six members — `keyId`, `publicKey`,
`revoked`, `validFrom`, `validUntil`, `malformedWindow`. It **dropped three** of the eight the pinned
registry publishes: `role`, `note` and `algorithm`. All three are now carried on `RegistryKey`, and
the guard that replaces F3's case compares the parsed members against the member names actually
present in the pinned bytes, so it goes red when the registry adds a member and the parser drops it —
which is the failure `role` was.

What changed on the output, measured on the three fixtures at `--now` inside each artefact's window,
against `refs/insight-oracle-keys-2026-09-05T1829Z.json`:

| artefact | `identity` at `dd21d5e` | `identity` now |
|---|---|---|
| `execution-sample-2026-09-05T1830Z.json` | `signer_in_registry (insight-oracle-safety-sample)` | `signer_in_registry (insight-oracle-safety-sample, role sample)` |
| `safety-sample-2026-09-05T1830Z.json` | `signer_in_registry (insight-oracle-safety-sample)` | `signer_in_registry (insight-oracle-safety-sample, role sample)` |
| `execution-sample-2026-09-02T1741Z.json` | `signer_in_registry (insight-oracle-safety-v2-202609)` | `signer_in_registry (insight-oracle-safety-v2-202609, role not declared)` |

Both sample rows additionally carry `identity_key_role = sample`, the registry's own `note` verbatim
under `identity_key_registry_note`, and the observation, verbatim:

> `signed by a key the registry labels role sample; the signed fields do not say so`

The production row carries `identity_key_role = not declared` and **no** observation and **no** note —
that asymmetry is the known-bad input for the observation, and it is asserted rather than described.
`identity_key_role` is printed on refusals too, not only on VALID, so a reader never has to reach a
VALID to learn what the registry calls the key.

**The verdict did not move, deliberately.** All three artefacts were VALID before and are VALID now.
A good signature by a key the registry publishes is what the format earns; this tool verifies receipts
under formats and does not issue gate decisions, so the role is surfaced and never turned into a
refusal. A caller who wants a sample-role signer refused has `identity_key_role` to branch on, in a
stable annotation, without parsing a key_id's spelling — which was the only handle before.

### F8. The key's window is checked against the artefact's own instant, under a new reason token (closes F5)

New reason token, added to `ReasonCode` in `src/types.ts` and documented beside the `unverifiable`
constructor in `src/verdict.ts`:

> **`signed_outside_key_window`** — the signer resolved to a published key, and the artefact's own
> instant falls outside that key's `[validFrom, validUntil]`. UNVERIFIABLE, and distinct from
> `expired`/`not_yet_valid` on purpose: those are statements about the instant the CALLER asked about
> and a different `--now` answers them differently, this one is a statement about two documents and no
> `--now` recovers it.

The artefact's instant is `signedAt`, falling back to the signed `executedAt` and then the signed
`checkedAt`. The `--now` comparison **runs first and keeps the answer it has always given**, so no
result whose signing instant was never in question moves; both comparisons are annotated before either
can refuse (`identity_key_window` for `--now`, `identity_key_window_at_signing` for the artefact),
because they answer different questions and a refusal on one must not hide what the other found.

Measured on the two pinned 2 September samples against a registry built from the 18:29Z pin with
`insight-oracle-safety-v2-202609`'s `validUntil` moved to `2026-09-02T17:35:36.000Z` = 1788370536.
The 15:46Z sample's `signedAt` is 1788363959, inside it; the 17:41Z sample's is 1788370923, 387 s past
it. The `dd21d5e` column is the same four runs against the same bytes on the code as it stood:

| artefact | `--now` | at `dd21d5e` | now |
|---|---|---|---|
| 15:46Z (signed inside) | 1788363999, inside | VALID / `verified` | VALID / `verified` |
| 15:46Z (signed inside) | 1788370900, past | UNVERIFIABLE / `expired` | UNVERIFIABLE / `expired` |
| **17:41Z (signed 387 s past)** | **1788370500, inside** | **VALID / `verified`** | **UNVERIFIABLE / `signed_outside_key_window`** |
| 17:41Z (signed 387 s past) | 1788370900, past | UNVERIFIABLE / `expired` | UNVERIFIABLE / `expired` |

**One row of four moves, and it is the row F5 named.** The other three are the control: without them
the change could be a check that refuses everything. Against the unmodified pin — where that key's
window is genuinely open-ended — both artefacts stay VALID, which is the second control. The refusing
row prints, on its face:

> `identity_key_window_at_signing = OUTSIDE — signedAt 1788370923 (2026-09-02T17:42:03.000Z) is 387s PAST the validUntil of key insight-oracle-safety-v2-202609 [validFrom 1787765736 (2026-08-26T17:35:36.000Z), validUntil 1788370536 (2026-09-02T17:35:36.000Z)]`

and `identity_key_window = inside — evaluated at 1788370500 …`, so both facts are readable from one
result. No key line is printed: the identity was never established. The `before validFrom` edge is
asserted with the same token in its own case, so only one side of the interval is not being tested.

### F9. What F7 and F8 do not establish

**That a role is trustworthy.** This tool reports the label the registry attached to the key that made
the signature. It has no table of roles it understands, no default for one it does not, and no way to
check whether `role: "sample"` means what the registry's `note` says it means. An unknown role string
is printed verbatim and never mapped; `attester` is the one value that draws no observation, and no
pin publishes it on any key today.

**That the instant this check reads was signed.** `signedAt` is the only member that means "when this
was signed", and it sits beside `data`, not inside it — the signature does not cover it. A party who
can edit the wrapper without touching `data` can move what this check reads, and the signature still
verifies. That is asserted rather than only described: a case moves `signedAt` into the window, gets
VALID, and requires the result to print `signedAt … — package metadata, OUTSIDE the signed bytes; the
signed executedAt reads 1788370923 …`. The exposure is on every verdict rather than in this file
alone. Closing it needs a signed member that means "signed at", which the format does not publish.

**That the two 18:30Z samples describe anything real.** Unchanged from F6, and unaffected by either
change here: what F7 adds is that the verdict now says which key the registry considers a sample
signer, not that the signed fields say so. They still do not — the 44 signed fields carry no mark and
still read `environment: "production"`.


## Interests

Appended 2026-09-03, in the words sent to the author of `draft-marques-asqav-compliance-receipts`
that morning, which are canonical from that send. The same section goes into every rerun, every
top-level findings file and every registry entry, unchanged, so a reader meets the same text
wherever they enter. It is held on one unwrapped line below because the sent bytes are the bytes
here; re-wrapping it would make three copies that only look identical.

Interests. The author of this grading authors draft-msebenzi-evidence-action, builds Chirindo, an operator-run gate that signs receipts of MCP calls, and maintains receipt-verify, the tool that produced this document. Those occupy the same ground as the formats graded here. Independence is not claimed. What is claimed is that every value in this document recomputes from pinned bytes by anyone with the tool or without it, that every scope is cited to the document that names it, and that text and implementation are scored separately, a rule that came from the author of one of the formats graded. Where a judgment call was made, it is marked as one.
