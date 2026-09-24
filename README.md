# receipt-verify

`0.1.0` — a cross-format verifier for agent receipts. It reads a receipt,
recomputes everything the receipt claims, and returns one of three verdicts.

**Verdicts attach to RECEIPTS under FORMATS — never to vendors, and this tool
never issues gate decisions.**

That sentence is the whole design. A VALID verdict says "this receipt is
internally consistent and binds to this key." It does not say the issuer is
trustworthy, that the claim inside the receipt is true, or that you should
proceed with whatever the receipt describes. Where a receipt records its own
gate decision, that value is reported as an annotation and labelled as the
issuer's, not as this tool's recommendation.

## Install

```bash
npm install -g @headlessoracle/receipt-verify
receipt-verify --help
```

Or run it without installing:

```bash
npx @headlessoracle/receipt-verify chain.jsonl \
  --format evidence.action --jwks issuer-jwks.json
```

The first positional argument is the receipt file. `--format` names the format
and may be omitted to auto-detect by shape; `--jwks` supplies the published key
material. Every option is listed under [Usage](#usage), and commands runnable
against this repository's own fixtures are under
[Three-command demo](#three-command-demo).

## Try it in 30 seconds

No clone, no build, no local fixtures — a published receipt, a live published
JWKS, and one verdict. Needs only Node 20+.

```bash
# Windows PowerShell 5.1 aliases `curl` to Invoke-WebRequest — use pwsh or bash.
curl -sO https://raw.githubusercontent.com/LembaGang/chirindo/ba181f25056c9863b8d449f9aa743921082818ae/examples/observe-only-agent/sample-chain/sample.jsonl
curl -so jwks.json https://headlessoracle.com/.well-known/jwks.json
npx -y @headlessoracle/receipt-verify sample.jsonl --jwks jwks.json
```

```
VALID — 1 record(s), chain intact, all signatures verified, session jwks-demo-00000000-0000-0000-0000-000000000001
format: evidence.action/0
reason: verified
verified under key ed25519/nQgjxdLXI3wJ (thumbprint wtAZI2K-eYTci4gj56MRgMr9HQkbXUKnrqhF6J9JEWU) resolved from jwks.json
```

Exit code `0`. Nothing here is this repository's own material: the receipt is
signed by [chirindo](https://github.com/LembaGang/chirindo) and the key resolves
from a JWKS served on the public internet.

Now break it. Change **one byte** of the receipt — the recorded decision `allow`
becomes `bllow` — and verify again:

```bash
node -e "const fs=require('fs');fs.writeFileSync('tampered.jsonl',fs.readFileSync('sample.jsonl','utf8').replace('allow','bllow'))"
npx -y @headlessoracle/receipt-verify tampered.jsonl --jwks jwks.json
```

```
INVALID — key-binding: entry 0: signature invalid
format: evidence.action/0
reason: signature_invalid
checked against resolved key ed25519/nQgjxdLXI3wJ (thumbprint wtAZI2K-eYTci4gj56MRgMr9HQkbXUKnrqhF6J9JEWU) resolved from jwks.json
stopped at: chain_verification
not evaluated (not_reached): result_translation, jwks_uri_policy
```

Exit code `1`. Note the last two lines: the run stopped at `chain_verification`,
so `result_translation` and `jwks_uri_policy` were never evaluated and the tool
says so rather than letting a refusal imply they passed. That is the
[coverage block](#coverage-what-a-verdict-does-not-say), and it is printed on
every result — including `VALID` ones.

The receipt URL is pinned to a commit, so the bytes it returns cannot move under
the pasted output — they are sha256
`e5932dd16952bbf39e0d42992c39fb5466c588f073af22b3352f379b14681208`. The JWKS is
deliberately *not* pinned — it is fetched live, which is what makes this a real
key resolution rather than a replayed one. Key `ed25519/nQgjxdLXI3wJ` stays
resolvable across rotations under chirindo's add-and-retain invariant
(`docs/JWKS-OPS.md`): a key that has signed a receipt is never removed.

`VALID` here says this receipt is internally consistent and binds to that key.
It says nothing about the issuer, and it is not a gate decision — see
[The tri-state contract](#the-tri-state-contract).

---

## The tri-state contract

| Verdict | Exit | Means | Names a key? |
|---|---|---|---|
| `VALID` | 0 | Every check this tool implements for the format completed and passed. | Yes — `verified under key …` |
| `INVALID — key-binding` | 1 | A published key resolved, and the receipt provably fails to bind to it. | Yes — `checked against resolved key …` |
| `UNVERIFIABLE` | 1 | The check could not be completed. Fail-closed. | **No.** Never prints a "verified under key" line. |

The line between `INVALID` and `UNVERIFIABLE` is whether a determinate negative
was actually established. A bad signature under a resolved key is a fact about
the receipt. An unresolvable `kid`, an unreachable mapping document, or a
malformed member is a fact about *what we could not do* — and reporting that as
a failure of the receipt would be a claim the tool has not earned.

Both non-VALID states exit 1, so a shell `if` fails closed by default. Callers
that need to tell them apart read `verdict` (or `reason`) from `--json`.

### For agent consumers

`--json` emits a stable object. Branch on `verdict` and `reason`; `detail` is
prose and may be reworded between releases.

```json
{
  "schema": "receipt-verify/verdict/0",
  "verdict": "UNVERIFIABLE",
  "reason": "mapping_unresolvable",
  "format": "verification.*",
  "detail": "v_gate: mapping acme-v0.9-2026-01-01 not resolvable (searched …)",
  "resolved_key": null,
  "annotations": { "jws_signature_check": "passed", "failed_at_step": 2 },
  "coverage": { "stopped_at": "mapping_binding", "checks_not_evaluated": [] },
  "exit_code": 1
}
```

`resolved_key` is always present and is `null` exactly when the verdict is
`UNVERIFIABLE` — one field to test, never a probe for absence.

### x402 delivery state

For `evidence.action/*`, a VALID result carries the delivery state in
`annotations`, recomputed from the same signed bytes the signature check
covered — the presence of `x402_payment_ref` on a record, paired with whether
that record's event commits to a `result_hash`:

```json
"annotations": { "delivery": "unproven", "delivery_reason": "no_output_commitment", "delivery_entry": 0 }
```

| `delivery` | Meaning |
|---|---|
| `proven` | A payment reference and an output commitment are both sealed in the bytes. |
| `unproven` | A payment was referenced and no output was committed to. `delivery_reason` and `delivery_entry` name which record and why. |
| `none` | No payment claim. An ordinary receipt. |

`delivery` is always present on VALID — `none` is emitted, not omitted, so a
caller reads one field rather than distinguishing absent-from-none. It appears
**only** on VALID: a delivery claim inside bytes that failed their own integrity
check is not evidence of a delivery.

> **`proven` is an attestation of COMMITMENT, not of correctness.** It proves the
> operator committed, in bytes it cannot alter, to a payment reference and to the
> hash of an output. It does not prove the output was correct, useful, or what
> the consumer actually received — that needs receiver-side signing.

**By default the exit code does not encode delivery.** `VALID` with
`delivery: "unproven"` exits **0**, because this tool's status answers *"did the
receipt verify"*, and it did. An agent reading only the status would treat a
settled-but-nothing-delivered receipt as fine, so either branch on the
`delivery` field — or ask for the gate:

#### `--require-delivery`

Opt-in, off by default. With it, **only `delivery: "proven"` exits 0**:

| `delivery` | Default | `--require-delivery` |
|---|---|---|
| `proven` | 0 | 0 |
| `unproven` | 0 | **1** |
| `none` | 0 | **1** |
| *(format has no delivery concept)* | 0 | **1** |

```console
$ receipt-verify chain.jsonl --jwks jwks.json --require-delivery
VALID — 1 record(s), chain intact, all signatures verified, session …
annotation: delivery=unproven (recomputed from the signed bytes; never moves the verdict — --require-delivery is gating the EXIT CODE on it)
delivery gate: NOT SATISFIED (delivery_unproven, delivery=unproven) — --require-delivery forces exit 1; the receipt itself is still VALID
$ echo $?
1
```

**The flag moves the exit code and never the verdict.** A receipt that verified
is `VALID` whatever policy the caller applied to it; calling it `INVALID` would
be a false statement about the bytes. So `--require-delivery` is the one case
where `verdict: "VALID"` can carry `exit_code: 1`, and `--json` says so
explicitly rather than leaving an agent to parse prose:

```json
"delivery_gate": { "required": true, "observed": "unproven", "satisfied": false, "reason": "delivery_unproven" },
"exit_code": 1
```

`delivery_gate` is `null` when the flag is not passed — one field to read either
way. `reason` is a closed vocabulary: `delivery_unproven`, `no_payment_claim`,
`no_delivery_state`.

**`none` fails the gate**, and this is a deliberate divergence from Chirindo,
whose CLI exits 0 on `none` because its flag is the inverse
(`--allow-unproven-delivery`, strict by default). A caller who passes
`--require-delivery` is asserting *"I paid for this; show me something was
delivered"* — and a receipt that never claimed a payment has not shown that.
Answering 0 there would be the fail-open the flag exists to remove. Verifying an
ordinary non-payment receipt? Don't pass the flag.

### Coverage: what a verdict does *not* say

A refusal stops the protocol, and every check behind it goes unevaluated. The
danger is that this is invisible: the verdict is right, the reason is right, and
nothing distinguishes *"this check ran and passed"* from *"this check does not
exist here"*. So every result carries a `coverage` block:

```json
"coverage": {
  "stopped_at": "mapping_binding",
  "checks_not_evaluated": [
    { "id": "recommendation_recompute", "reason": "not_reached", "status": "implemented", "…": "…" },
    { "id": "signing_trust_ref_quorum", "reason": "not_implemented", "status": "not_implemented", "…": "…" }
  ]
}
```

`stopped_at` is `null` exactly when evaluation ran to the end of the format's
checks. Three reasons are distinguished:

- **`not_reached`** — implemented, but evaluation stopped before it.
- **`not_implemented`** — declared by a normative source or by the published
  conformance corpus, and **not evaluated by this tool at all**. These are
  reported on every result, *including `VALID`* — a VALID verdict does not mean
  every declared check was evaluated, and saying so plainly is the point.
- **`condition_unmet`** — a `conditional` check whose condition the supplied
  shape did not meet, with a `condition` field saying which, in words: a receipt
  with no gates to bind to, a package with no on-chain block, a caller who
  passed no `--rpc`. **Not a gap in the tool** — a check that had nothing to run
  against. It is reported because without it a bare attestation's coverage block
  and a full package's are identical, and an agent would have to parse the
  adapter's prose annotations to learn that `preTradeUidsHash` was never
  examined.

Where a row could carry more than one, the precedence is `not_implemented`, then
`not_reached`, then `condition_unmet`: a check that is never evaluated says so
first, and a check evaluation never reached reports the stop, which is the
stronger and earlier fact about the run.

The declarations live in `src/coverage.ts`, one manifest per format, each check
carrying its id, its source, and its status (`implemented`, `conditional`,
`reported_only`, `delegated`, `not_implemented`). Currently declared but not
implemented:

| format | check | why |
|---|---|---|
| `verification.*` | `signing_trust_ref_quorum` | Published payloads carry `signing_trust_ref`; the quorum shape it names is not resolved or checked. |
| `verification.*` | `sibling_leg_mapping_binding` | Only the `v_gate` leg's mapping binding is resolved. |
| `verification.*` | `inline_threshold_agreement` | Inline `v_gate_threshold` is not cross-checked against the mapping's threshold (§5.2). |
| `acta.receipt/0` | `mldsa65_signature` | No ML-DSA implementation available; a declared ML-DSA-65 receipt is `UNVERIFIABLE`/`unsupported_algorithm`. |

`x402.settlement/2` declares nothing `not_implemented` and three checks
`reported_only` — `resource_binding`, `facilitator_identity` and `rpc_trust`.
Those are not gaps in this tool: they are the three things the protocol's own
bytes cannot establish at all, and they are printed on every result of that
format including `VALID`. See Format 5.

The manifest declares coverage. It does not verify anything, and no verdict is
derived from it. It exists because a declared recompute (`action-ref-v1`) sat
unevaluated behind an unresolvable mapping until the mapping was published —
see `FINDINGS-rerun-2026-07-29.md` R1.

---

## Three-command demo

```bash
npm install && npm run build

# 1. A conformance receipt that verifies.
node dist/cli.js fixtures/evidence-action/vectors/allow/chain.jsonl \
  --jwks fixtures/evidence-action/jwks.json

# 2. The same receipt with one field altered after signing.
node dist/cli.js fixtures/evidence-action/vectors/tampered/chain.jsonl \
  --jwks fixtures/evidence-action/jwks.json

# 3. A detached JWS whose payload is reconstructed and JCS-canonicalized.
node dist/cli.js fixtures/verification-state/synthetic/flat-act.detached.flattened.json \
  --format verification \
  --jwks fixtures/keys/test-throwaway-ed25519.jwks.json \
  --mapping-dir fixtures/verification-state/mappings \
  --payload fixtures/verification-state/synthetic/flat-act.payload.json --payload-jcs
```

The three commands above are the demo in full — run them and you have it. No
recorded transcript is committed.

---

## Usage

```
receipt-verify <file> [options]

  --format <name>        evidence.action | verification | acta | insight | x402   (default: auto-detect)
  --jwks <path|url>      published JWK Set: a .json file, a directory of them, or an https URL
  --mapping-dir <dir>    directory of mapping documents
  --payload <file>       detached-JWS payload: the bytes the signature covers
  --payload-jcs          canonicalize --payload with RFC 8785 JCS before verifying
  --prev <file>          predecessor receipt, for formats carrying a chain link
  --disclose <file>      disclosed {name, value, salt, proof} tuples, for committed fields
  --registry <path>      published key registry, for formats that resolve a signer from one
  --rpc <url>            JSON-RPC endpoint, for formats that corroborate against a chain
  --clock-tolerance <s>  clock tolerance for exp/nbf (default 60)
  --now <epoch>          evaluate time-based checks at a fixed instant
  --require-delivery     exit 1 unless the receipt PROVES x402 delivery
  --json                 machine-readable verdict object
```

Auto-detection is conservative. If no adapter claims the bytes, or more than
one does, the tool refuses and tells you to pass `--format`. A detached receipt
always needs `--format`, because there is no payload to identify it by.

**Public keys only.** There is no code path in this tool that reads, requires,
or references a private key, a PEM, or a keyfile. Key input is JWK Sets:
published, public material anyone can fetch.

---

## Format 1 — `evidence.action/0`

Verification is delegated to the **published npm artifact**
`@headlessoracle/chirindo@0.4.0`, not to a local checkout. This adapter supplies
public-key-only key resolution and translates that package's five-state result
onto the tri-state contract:

| Chirindo result | receipt-verify | Why |
|---|---|---|
| `valid` | `VALID` | — |
| `tampered` (any reason) | `INVALID — key-binding` | A determinate negative against a key already resolved: the signed bytes, or a commitment sealed inside them, do not hold. |
| `invalid: key_binding_mismatch` | `INVALID — key-binding` | The receipt committed to a key identity that is not the one that resolved. |
| `invalid: untrusted_key` / `insecure_jwks_uri` | `UNVERIFIABLE` | A refusal to complete the check, not evidence against the receipt. |
| `empty`, `unverifiable`, parse failure | `UNVERIFIABLE` | Nothing was established. |

All six vectors of the conformance corpus reproduce their manifest-declared
outcomes, and the snapshot in `fixtures/evidence-action/` is asserted
byte-identical to the sha256 each vector's manifest entry pins.

## Format 2 — `verification.*`

Implements `draft-krausz-verification-state-01` §4.3, step for step. A copy of
the -01 text is in `refs/`.

1. Verify the JWS signature against the issuer's published JWKS. Compact,
   flattened JSON, and general JSON serializations are all accepted (§4.1
   makes the first two mandatory; general is what the published multi-signer
   fixtures use). Every signature present must verify — no partial quorum.
2. Resolve `v_gate_mapping` → the named mapping document; its SHA-256 must
   equal `v_gate_mapping_hash`.
3. Recompute the recommendation from `(v_verdict, v_confidence,
   v_adversarial_result)` under the mapping's rules and threshold.
4. Confirm it equals `v_recommendation`.
5. Derive the gate from the recommendation.
6. Confirm it equals `v_gate`.
7. Check `exp`/`nbf` with clock tolerance.
8. All match → VALID.

### Verdict mapping

| Condition | Verdict | `reason` |
|---|---|---|
| Signature fails against a **resolved** published key | `INVALID — key-binding` | `signature_invalid` |
| `kid` unresolvable, or ambiguous across the JWKS | `UNVERIFIABLE` | `key_unresolvable` |
| Mapping document unfetchable | `UNVERIFIABLE` | `mapping_unresolvable` |
| Mapping document digest ≠ `v_gate_mapping_hash` | `UNVERIFIABLE` | `mapping_hash_mismatch` |
| Recompute disagrees with a signed claim | `UNVERIFIABLE` | `recompute_mismatch` |
| Missing / ill-typed member | `UNVERIFIABLE` | `malformed_member` |
| `exp` passed / `nbf` not reached | `UNVERIFIABLE` | `expired`, `not_yet_valid` |
| Unsupported `alg` (including `none`) | `UNVERIFIABLE` | `key_unresolvable` |
| All steps pass | `VALID` | `verified` |

A `VALID` result is annotated with the receipt's own gate value (`act` / `halt`)
as information. A receipt recording `halt` is exactly as VALID as one recording
`act`, and both exit 0 — the verdict is about the receipt, not about what to do
next.

When step 1 passes but a later step refuses, the result carries
`jws_signature_check: "passed"` and `failed_at_step`. This tells a caller how
far the protocol got without ever becoming a claim that the receipt verified —
`resolved_key` stays `null` and no key line is printed.

### Payload profiles

- **flat** — the §4.2 claim set at the payload top level. This is what §4.3 is
  written against.
- **composed** — `envelope_kind: "verification.v0.3+composed"`, the shape the
  published fixtures use: several issuers co-signing one canonical payload.
  §4.3 is applied to the `v_gate` leg, then the `AND_PRESENT` composition is
  recomputed across every present sibling pointer.

No published fixture uses the flat profile. See `FINDINGS.md`.

### Mapping documents

The draft binds a receipt to a mapping document by identifier and digest but
does not specify that document's schema, its serialization, or how an
identifier resolves to a retrievable location. Two schemas are therefore read:

| document | schema | provenance |
|---|---|---|
| `mappings/agentoracle-v0.3-2026-05-30.json` | `recommendation_rules` / `threshold` / `gate_map` | **published** by the issuer at `agentoracle.co/mappings/`, content-addressed; snapshotted |
| `mappings/v0.3.0-2026-05-30.json` | `rules` / `confidence_threshold` / `gate` | **this tool's** transcription of the §5.1 decision table, written when no document was published |

The published document is served as its own RFC 8785 JCS bytes, so the digest
over the file as served and the digest over its canonicalization are the same
value — `0a78263976790df6e76cd9f3f441bf5a3b5c3a82e346b5aca43e49626881d7b0`,
which is both the content address in its URL and the `v_gate_mapping_hash` the
eleven composed fixtures carry.

The two documents are independent transcriptions of the same table. They agree
on recommendation and gate across all 60 cells of the input domain, which is
asserted in `test/mapping.test.ts` rather than assumed. Where a document
declares rule precedence with `order`, the lowest-numbered match governs; where
it does not, a disagreeing overlap is a refusal, because picking one would be
this tool inventing a precedence the document does not state.

Resolution is local-only. Fetching a mapping document at verify time would make
the verdict depend on what a remote host served at that instant, which is the
property §4.6 exists to remove. A receipt whose mapping does not resolve and
hash-match is `UNVERIFIABLE`; the tool never substitutes a default ruleset.

`v_gate_mapping_hash` is accepted as bare hex, `sha256:<hex>`, or
`sha256-<hex>`, because the draft, its own example, and the published fixtures
each use a different one of the three. This leniency is documented rather than
silent — see `FINDINGS.md`.

---

## Format 3 — `acta.receipt/0`

Per **draft-farley-acta-signed-receipts-02** (`refs/`), with
**draft-marques-asqav-compliance-receipts-07** read as a *profile layered on
it*. Where -07 disagreed with farley on the chain-digest scope, this tool graded
under farley and reported the disagreement on the verdict; that was this tool's
rule of 2026-07-28, not the profile's. **-08** §4 resolves that disagreement by
switching digest scope on receipt format, payload-member scope for a Compliance
Receipt and whole-receipt scope for an upstream ACTA Commitment Mode receipt, and
this tool declines a -08 Compliance Receipt at detection rather than grading it
under farley's scope.

Not a JWS. The envelope is `{payload, signature: {alg, kid, sig}}` with a
lowercase-hex signature over RFC 8785 JCS bytes (§2.1). Keys resolve by `kid`
from a published JWK Set (§4.3). `EdDSA` and `ES256` verify; a declared
`ML-DSA-65` is `UNVERIFIABLE`/`unsupported_algorithm`, because a signature this
tool cannot check is not a signature it may call good *or* bad.

### The two contradictions, and what the tool does about them

The draft gives two incompatible answers for **which bytes the signature
covers**, and the draft plus its profile give three for **which bytes the chain
digest covers**. In both cases the rule here is the same: recompute under the
normative reading, and when that fails, say whether the receipt is consistent
with a *known alternative* reading.

| | Normative here | Detected and named on failure |
|---|---|---|
| Signature scope | farley §5.6 — receipt object minus `signature` | farley §4.1 step 2 — the inner `payload` member alone |
| Chain digest scope | farley §5.7 — whole envelope, signature included | marques §5.3 read two ways, both signature-exclusive |

A detected variant is an **explanation attached to a refusal**. It is never a
reason to accept. A receipt built to a variant returns `INVALID` naming the
variant; a receipt matching no known scope returns `INVALID` saying so.

§5.6 is chosen over §4.1 because it is the later explicitly-normative
clarification *and* because it is the reading the one checkable published
receipt actually verifies under — recomputed in `test/acta.test.ts` against a
published `canonical.txt`, byte-for-byte. Full derivation in `FINDINGS.md` §E2.

### Checks that did not run are reported, never assumed

A `previousReceiptHash` with no `--prev`, or a `committed_fields_root` with no
`--disclose`, is annotated as unchecked and contributes nothing to the verdict
in either direction:

```
annotation: chain_link=present but not checked (no --prev)
annotation: commitment_check=not performed (no --disclose)
```

### Commitment mode

§5.1–§5.5 are implemented in full: RFC 6962 domain separation (`0x00` leaf,
`0x01` internal), the recursive largest-power-of-two split for non-power-of-two
leaf counts, `JCS({name, salt, value})` canonical leaves, byte-lexicographic
name ordering, and §5.5 inclusion proofs. Proofs carry no left/right bit; the
side is re-derived from `(index, tree_size)` via the §5.1 split rule.

The Merkle code in `src/adapters/acta.ts` and in `tools/make-acta-fixtures.mjs`
is deliberately **two independent implementations**. Sharing it would make the
commitment fixtures verify against themselves.

### Fixtures

§5.10 announces an interoperability suite with a six-item minimum set. The
draft's only test-vector reference does not contain any of the six, and scopes
itself to revision -01 (`FINDINGS.md` §E1). So:

- `fixtures/acta/published/` — what the cited reference *does* publish.
- `fixtures/acta/synthetic/` — **this repository's** construction of the six,
  plus the tamper matrix and one chain per candidate digest scope. Built by
  `node tools/make-acta-fixtures.mjs` from throwaway keys whose seeds are
  published in the generator.

---

## Format 4 — `insight.attestation/eip712`

`insight.attestation/eip712` is **this repository's** label for the EIP-712
attestations published at `oracleinsight.xyz`. The issuer publishes no format
name and no specification prose; the only document it publishes is the key
registry at `/.well-known/oracle-keys.json`, pinned under `refs/`. The EIP-712
encoding is written from the EIP text rather than taken from a library — see the
header of `src/adapters/insight.ts` and `FINDINGS.md` section F.

The registry publishes a per-key validity window and, on one key, a `role`.
**A key's role is reported on every verdict and never moves it**: the identity
annotation reads `signer_in_registry (<key_id>, role <role>)` — or `role not
declared` where the entry publishes none — and a declared role other than
`attester` adds `identity_role_observation`, verbatim: *"signed by a key the
registry labels role `<role>`; the signed fields do not say so."* This tool
verifies receipts under formats and does not issue gate decisions; it cannot say
whether a role is trustworthy, only what the registry says it is.

### Verdict mapping

| Condition | Verdict | `reason` |
|---|---|---|
| Signer is not among the registry's published keys | `UNVERIFIABLE` | `key_unresolvable` |
| Signer's key is revoked on either channel | `UNVERIFIABLE` | `key_revoked` |
| Key's window does not contain **`--now`** | `UNVERIFIABLE` | `expired`, `not_yet_valid` |
| Key's window does not contain the **artefact's own instant** (`signedAt`, else the signed `executedAt`/`checkedAt`) | `UNVERIFIABLE` | `signed_outside_key_window` |
| A target `ExecutionReceipt` v1-v4 verified with no `--registry` | `UNVERIFIABLE` | `registry_snapshot_required` |
| `--registry-sha256` names a digest the supplied bytes do not have | `UNVERIFIABLE` | `registry_snapshot_mismatch` |
| The receipt signs a `profileId` the registry does not publish for its layout | `UNVERIFIABLE` | `profile_unrecognised` |
| The registry names the member carrying the profile id and the receipt signs none | `UNVERIFIABLE` | `profile_absent` |
| Everything above passes and the signature recovers the stated attester | `VALID` | `verified` |

The last two window rows are **different facts** and both are reported on every
result, as `identity_key_window` and `identity_key_window_at_signing`. `expired`
is a statement about the instant the caller asked about, and naming a different
`--now` can change it; `signed_outside_key_window` is a statement about two
documents — the registry was not vouching for that key when the artefact says it
was made — and no `--now` recovers it. `identity_signing_instant` names which
member supplied the instant and whether that member was inside the signature:
`signedAt` is package metadata and is not.

### A v1–v4 verdict is snapshot-relative, or it is not a verdict

The issuer's deployed release declares, under `executionReceipt.legacyProfileResolution`:
`schemaVersions` [1,2,3,4], `signingStatus` `retired`, `productionAdmission` `forbidden`,
`resultScope` `relative-to-exact-registry-snapshot`, `globallyCanonicalVerdict` `false`,
`requiredEvidence` [`registrySnapshotUtf8Bytes`, `sha256`, `byteLength`], and the rule *"preserve and
verify the exact registry snapshot bytes; report its full SHA-256 and byte length with every verdict;
fail closed if absent or mismatched; never substitute current.json or the current registry"*.

So a legacy verdict **without** its registry snapshot is not a weaker verdict — it is one this tool
is not entitled to state:

```bash
# no --registry: UNVERIFIABLE / registry_snapshot_required, whatever else you pass
receipt-verify receipt.json --format insight --allow-unregistered-signer

# the snapshot preserved with the receipt — never current.json, never today's registry
receipt-verify receipt.json --format insight --registry refs/insight-oracle-keys-2026-09-02.json \
  --registry-sha256 9269529e7f584ddd54d8ea0210af9820ee082b968492fcbb25b798fab7a88006
```

Four annotations ride on every v1–v4 result:

| annotation | what it is |
|---|---|
| `verdict_scope` | `snapshot-relative` |
| `registry_snapshot_sha256` | SHA-256 over `--registry`'s bytes **exactly as supplied**, before any parse |
| `registry_snapshot_byte_length` | their length |
| `registry_snapshot_origin` | where they came from |

A `VALID` detail opens with `historical, snapshot-relative:`. An `INVALID` carries the same three
values inside its `detail`, because the tri-state contract gives an `INVALID` no annotations.
`--registry-sha256` is checked, not trusted: a disagreement is `UNVERIFIABLE` /
`registry_snapshot_mismatch` and stops the run, and it is never `INVALID` — it is a fact about your
inputs, not about the receipt.

**What this does not establish, and cannot.** Whether the bytes you supplied are the ones preserved
when the receipt was issued. The rule forbids substituting the current registry and **this tool
cannot detect that substitution** — it reports the digest and length of what it was handed so you can
compare them against the issuer's preserved copy. That comparison is yours.

Scope: the **target receipt only**, and only `ExecutionReceipt` with a signed `schemaVersion` below
5. The gates (`OracleSafetyCheck`, published at schemaVersion 1 to 3) are excluded by struct rather
than by version number, so a v5 package with v3 gates carries no snapshot annotations. The check sits
**after** the signature check: `schemaVersion` is a signed field, so on bytes whose signature does not
verify, "this is a v2 receipt" is not a statement those bytes support.

### An unrecognised semantic profile refuses

`schemaVersion` names the EIP-712 field layout and nothing more. What a `preTradeUidsHash` is built
over, what a zero uid means, what scale a price is at and which verdict follows from which fields
live in the immutable content-addressed profile — and on 2026-09-08 this repository found the issuer
had rewritten a commitment rule with the layout version unchanged (`FINDINGS.md` F10).

Where the registry publishes a `semanticProfile` for the artefact's own layout, a receipt signing an
id it does not publish is `UNVERIFIABLE` / `profile_unrecognised`, and one signing no such member is
`UNVERIFIABLE` / `profile_absent`. Both carry `profile_observed`, `profile_expected` and
`profile_signed_field`. Where the registry publishes no profile for the layout, nothing refuses.

Until 2026-09-16 both were annotations ending *"The verdict does not move on it"*, on the reasoning
that the issuer's fail-closed rule was the caller's policy. That was wrong about which rule applies:
an unrecognised profile is an **unknown state** — the meaning of every signed number is unestablished
— and resolving an unknown state to the restricted default is this tool's own contract. The member
the id is read from comes from the registry's own `signedField`, so a rename cannot leave this
comparing the wrong member.

The refusal is issued **after** the identity branch completes, so a revoked key still reports
`key_revoked` and `stopped_at: "profile"` never claims identity was skipped.

---

## Format 5 — `x402.settlement/2`

`x402.settlement/2` is **this repository's** label for a container, not a format
anyone publishes. x402 v2 defines three objects that cross the wire during one
paid call — the 402 payment-required object, the payment payload the client
sends, and the settle object the server returns — and then the exchange is over.
Nothing defines what a merchant or a buyer *holds* afterwards, and nothing
defines how to check it. The three objects end up in four places (two HTTP
headers, a response body, and a chain), and until they sit in one document there
is no relation between them to state, let alone to verify.

So the envelope is ours, and the coverage manifest's first check says so. What is
not ours is every relation it makes checkable: each one is a fact about bytes
someone else signed or a chain someone else wrote.

```json
{
  "schema": "x402.settlement/2",
  "x402Version": 2,
  "payment_required": { "…the decoded 402 object…" },
  "payment_payload":  { "…the decoded payment header the client sent…" },
  "payment_response": { "…the decoded settle object the server returned…" },
  "chain": { "rpc_url": "…", "read_at": "…", "transaction": "0x…", "receipt": {}, "block": {}, "submitter_tx": {} },
  "known_submitters": [{ "address": "0x…", "source_url": "…", "source_sha256": "…", "fetched_at": "…" }]
}
```

`chain` may be omitted and resolved with `--rpc` instead; with neither, the
verdict is `UNVERIFIABLE`/`chain_unavailable` and nothing about the money is
claimed. `known_submitters` is optional and is the caller's list, not ours.

```bash
receipt-verify settlement.json --format x402 --json
receipt-verify settlement.json --format x402 --rpc https://mainnet.base.org
```

### The six relations

| id | what it establishes |
|---|---|
| `authorization_signature_recovers_payer` | The EIP-712 signature over `TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)`, under the domain the accepted requirement's `extra`, `network` and `asset` name, recovers `authorization.from`. This is the **only** signature in an `exact` settlement on EVM. |
| `authorization_matches_requirements` | `to == payTo` and `value == amount`, and the requirement the payload says it accepted is one the 402 actually published — found by equality of the whole object, not by index. |
| `settle_response_names_authorization` | The facilitator's answer names the same payer and network and a 32-byte transaction. `success: false` is **not** a failed settlement: the facilitator's own published `SettleResponse` says `settlement_pending` means unresolved, so `errorReason` is annotated and the chain relations still run. |
| `chain_transfer_matches_authorization` | The receipt succeeded, carries exactly one `Transfer` from the token contract, and its from/to/value equal the signed authorization; an `AuthorizationUsed` with the signed nonce is checked where present and recorded as `absent` where not. |
| `block_at_height` | The block at the receipt's `blockNumber` carries the receipt's `blockHash`, and that block's timestamp is the settlement instant. **A sub-second preconfirmation is not a block at height.** |
| `submitter_recorded` | The transaction's sender is recorded, and compared against `known_submitters` where a list is supplied. Never "facilitator identified". |

### Verdict mapping

| Condition | Verdict | `reason` |
|---|---|---|
| The envelope is not this schema at version 2, or carries neither artefacts nor chain data | `UNVERIFIABLE` | `malformed_receipt` |
| A member needed by a relation is absent or unreadable — a domain that cannot be built, a signature that will not parse, a chain member missing its block | `UNVERIFIABLE` | `malformed_member` |
| No `chain` member and no `--rpc`, or the RPC read failed | `UNVERIFIABLE` | `chain_unavailable` |
| Chain data and none of the three off-chain artefacts | `UNVERIFIABLE` | `artefacts_absent` |
| The signature recovers an address that is not `authorization.from` | `INVALID` | `signature_invalid` |
| The authorization pays terms the 402 did not publish, or the settle answer names another payer or network | `INVALID` | `content_commitment_mismatch` |
| A chain fact read at a height contradicts the artefacts | `INVALID` | `chain_contradicts_artefacts` |
| All six relations pass | `VALID` | `verified` |

`artefacts_absent` is the observation case, and it is a deliberate
`UNVERIFIABLE` rather than a pass on the half that was present: a transfer with
no 402, no payload and no settle answer beside it shows that money moved and
nothing at all about what was bought. The chain half still runs and is in the
annotations; the three relations that did not run each say `not_evaluated` by
name rather than being silently absent.

`resolved_key` is the payer's address, with `alg` `secp256k1 / EIP-712
(EIP-3009)`: on an EVM chain the address *is* the identifier of the public key a
signature recovers to, so the repository-wide invariant — `resolved_key` is
`null` exactly when the verdict is `UNVERIFIABLE` — holds here unamended.

### The three limits

These are on **every** result of this format, including `VALID`, as annotations
under stable tokens and as `reported_only` rows in `coverage`:

| annotation | value | what it means |
|---|---|---|
| `limit_resource_binding` | `unsigned` | **Nothing binds the money to the resource under a signature.** The buyer signs `{from,to,value,validAfter,validBefore,nonce}` only; the 402 object, the payload's `resource` and `accepted` members and the settle response are all unsigned. A party that can edit any of them can move which resource a settled payment appears to be for, and no verifier holding these bytes can tell. |
| `limit_facilitator_identity` | `unsigned_list` | **The submitter-to-facilitator tie rests on an unsigned list fetched at a time.** This tool records the sender and whether it appears in the list the caller supplied, with that list's URL, digest and fetch time. It never says who the sender is. |
| `limit_rpc_trust` | `verifier_choice` | **The RPC named is the verifier's choice and its answer is not itself evidence** unless the block is at height and a second, independently operated endpoint agrees. `tools/chain-read.ts` reads two and records whether they agree; the agreement travels with the package rather than being asserted here. |

The first of those is the one that matters most and is the least visible: a
`VALID` verdict under this format proves that a named account authorized a
transfer and that the transfer happened on a block at height. It does not prove
what was bought.

---

## Fixtures

Everything under `fixtures/` and `refs/` is a byte-exact snapshot, pinned by
sha256 with its source URL and retrieval time in `fixtures/provenance.md`.
Regenerate with `npm run snapshot`.

Remote git sources are pinned to a **commit**, not to `HEAD` — see `GH_COMMIT`
in `tools/snapshot.mjs`. A moving ref means a re-run silently re-bases every
fixture on whatever the branch tip happens to be, and the provenance table then
records a digest for bytes nobody chose. `agentoracle-receipt-spec` is currently
pinned at `196df22b255e7173d4eb6b20e833cc4e8ae6d35d`.

The test suite never touches the network. The one exception is
`test/live-jwks.test.ts`, which is explicitly marked, skipped unless
`RECEIPT_VERIFY_LIVE=1`, and allowed to skip offline — it is not allowed to pass
offline.

Synthetic fixtures are signed by a **throwaway** Ed25519 key whose seed is
published in `tools/make-throwaway-fixtures.mjs`. Every file it signs carries
`test-throwaway` in the key id. Anyone can re-derive that private key; that is
the point, and it is why the key proves nothing about anyone. Regenerate with
`npm run fixtures`.

---

## Freshness

A pin is a dated snapshot. `fixtures/upstreams.json` records which upstream each
one came from, and `npm run drift` asks whether that upstream has moved since:

```bash
npm run drift            # read-only; writes walker/drift.json (gitignored)
npm run drift -- --record  # also stamps last_observed into upstreams.json
```

One row per upstream, each a first-class outcome rather than a pass/fail:
`current` (the tip, body or revision is exactly what was pinned),
`moved_untouched` (git: the tip moved, every pinned path is byte-unchanged),
`moved_changed` (git: a pinned path differs — each is listed with its old and
new blob id), `changed` (http: the body's digest differs, both printed),
`superseded` (an IETF draft has a higher revision, named), `unreachable` (the
check could not be made, with the error), `not_checked` (a `historical` pin,
kept for a finding rather than as the current corpus — printed, never counted as
current), and `no_entry` (`npm run drift -- --corpus <dir>` was asked about a
corpus directory that nothing in `upstreams.json` claims or excuses). Exit 0
only when every `role: current` upstream is `current` or `moved_untouched`;
`unreachable` is a failure, because a check that could not be made has not
passed, and `no_entry` is a failure because a corpus nothing watches has not
passed a freshness check — it was never given one.

`test/upstream-coverage.test.ts` is what keeps that file honest: it requires
every path under `fixtures/` and `refs/`, and every file of every corpus
`walker/scopes.json` grades, to resolve either to an `upstreams.json` entry or
to a named `unmapped` row carrying a one-line reason — so it is red in the
ordinary suite on every push, not only on the Monday drift schedule, and a new
fixture cannot be added without saying where it came from.

Comparisons read the git object store — `git rev-parse HEAD:<path>` and
`git cat-file blob` — never a worktree, because `core.autocrlf` on a Windows
checkout would otherwise report every text file as changed on every run.

**The rule this exists to serve: a finding cites the pin it was measured
against, and the drift report says whether that pin is still the upstream's
tip.** A finding that silently describes a superseded upstream reads as current
and cites a commit, which is worse than no finding — and as agents rather than
people consume these findings, there is no reader who will notice the date.

---

## Evidence packages (`packages/`)

A verdict is a line of output. A package is a directory someone else can be
handed, and can check without trusting the sender and without a key of their
own. `packages/` holds four:

| package | what it is | verdict |
|---|---|---|
| `x402-base-2026-09-07-0x46db8fc8/` | one of this operator's own paid calls, 7 September 2026 on Base, with the artefacts as the wire carried them | `VALID` |
| `x402-base-2026-09-07-0x94bfba79/` | the second paid call of the same day, with the delivered response beside it | `VALID` |
| `x402-base-payai-0x9ecf68be/` | somebody else's settlement, chain side only, found from public bytes | `UNVERIFIABLE` / `artefacts_absent` |
| `x402-base-botpay-0xccd5497a/` | a settlement paid to the address `api.botpay.network` publishes, chain side only, found from public bytes | `UNVERIFIABLE` / `artefacts_absent` |

Each carries `artefacts/` (byte for byte, with the source path of every file
recorded in `manifest.json` beside its sha256 and byte count), `envelope.json`,
`chain.json` (both endpoints' answers, read times, and per-response digests),
`verdict.json` (the verifier's full output including its `coverage` block),
`statement.md`, `manifest.json`, and `SHA256SUMS` with `SHA256SUMS.sig`.

```bash
sh tools/verify-package.sh packages/x402-base-2026-09-07-0x46db8fc8
```

That needs no key but this repository's own `SIGNING_KEYS`, and it checks three
things, each of which fails on the input that should fail it:

1. **every listed digest** — one altered byte in any file exits 1;
2. **that no file in the package is missing from `SHA256SUMS`** — otherwise the
   list is a claim about the files someone remembered to put in it, and a file
   added afterwards would ride inside a package whose verification passes while
   asserting nothing about it;
3. **the signature over the list**, under namespace `file`, so it cannot be
   replayed as a git signature.

`npm run walk` is the second, independent statement: it recomputes every
`sha256` in every package's `manifest.json` from the file beside it. That
matters because `verify-package.sh` checks a package against *itself* and would
pass for any internally consistent directory, including one whose manifest was
rebuilt around altered artefacts.

**What a passing package does not establish.** That its contents are true. Each
`statement.md` says in words what its own bytes do and do not show, and for this
format that second half is the important one — see the three limits in Format 5.
`tools/sign-package.sh` writes and signs the list; it is the only file in this
repository that reads a private key.

---

## Verifying the history

Every commit here is SSH-signed. `SIGNING_KEYS` (repository root) is an
ssh `allowed_signers` file carrying the one public signing key, fingerprint
`SHA256:KFZr0BiXIrvl/hsri0vzciGsj+suWiBqHYBwdnnyJXg` (check it with
`ssh-keygen -lf SIGNING_KEYS`), and `sh tools/verify-history.sh` verifies every
commit in the history against it, printing one line each and exiting non-zero on
the first bad or unsigned commit. `git verify-commit HEAD` works too, once you
run `git config gpg.ssh.allowedSignersFile SIGNING_KEYS` — the script calls
`ssh-keygen -Y verify` directly so it needs no such configuration, which is what
makes it usable in a fresh clone and in CI.

If you were sent a bundle of this repository and want to check it yourself, that
command is the whole of it: no key material to obtain, nothing to trust but the
fingerprint above.

---

## Development

```bash
npm run typecheck
npm test                            # 750 tests, no network
RECEIPT_VERIFY_LIVE=1 npm test      # adds the live-JWKS and live exit-contract tests
npm run snapshot                    # re-pull remote fixtures + rewrite provenance
npm run fixtures                    # regenerate throwaway-signed fixtures
npm run walk                        # recompute every declared digest in the pinned corpora
sh tools/verify-package.sh packages/<name>    # check one evidence package end to end
```

`npm run walk` reads `walker/scopes.json` -- the byte scope each pinned corpus's
own document names for each of its declared digests, with the document and line
range -- recomputes every one of them from the corpus bytes, and writes
`walker/report.json`. It exits 1 when a declared digest disagrees with its
recomputation, which it currently does: the Asqav corpus carries a stale
`counterparty_binding.envelope_hash` in five vectors (FINDINGS-rerun M6).
Every `jcs(...)` construction is canonicalized twice, by this repository's JCS
and independently by the Python one in `tools/asqav_envelope_hash.py`, and no
digest is compared until both agree on the bytes.

`src/adapters/*.ts` implement one `Adapter` interface (`detect?`, `verify`), so
adding a third format is a new file plus a registry line in `src/detect.ts`.

---

## Findings

| document | scope |
|---|---|
| `FINDINGS.md` | Observations recorded while implementing against the published artifacts, as of 2026-07-25 (§A–§D) and 2026-07-28 (§E). Entries are not amended after the fact. |
| `FINDINGS-rerun-2026-07-29.md` | Re-verification of four errata against the artifacts published in response, with per-erratum verdicts and recomputed evidence, new entries `R1`–`R3`, and the suite baseline comparison. |

Where a `FINDINGS.md` entry's subject has since changed, the change is recorded
in the rerun document and cross-referenced — `FINDINGS.md` is a dated record, not
a live status page. Entries currently superseded in whole or in part: `B2`, `B3`,
`B4`, `B7`, and `B1` (see `R2`).

Every findings document carries a standing `## Interests` section, in one
wording, appended 2026-09-03: the author of these gradings also authors
`draft-msebenzi-evidence-action` and builds Chirindo, which is the same ground
as the formats graded. Independence is not claimed; recomputability is.

## Registry

`registry/` is the public record of executed verifications. A record says what was
verified, against which pinned bytes, by which verifier and version, when, what the
run established, what it did not establish, and who consented to be named. Each one
is a folder under `registry/records/<id>/` holding a `record.json` that validates
against `registry/schema/record.schema.json`, the human report beside it, and the
inputs and run outputs it names. `registry/index.json` and `registry/badges/` are
built from those folders and are never edited by hand.

Verification of any receipt is free, always. A paid entry buys the run and the
published record, never the verdict.

The seven rules, in one line each; `registry/README.md` carries the full wording:

1. No record without an executed run, pinned inputs, an anchored result and a named
   consenting human. Records of kind `observation` are built from public bytes about
   a party who has not consented, carry no consent, and are not entries.
2. A record is keyed on the format, the format version, the digest of the upstream
   bytes, the verifier version and the time of verification. No vendor name is a key.
3. Published records are immutable. A record is corrected by a new dated record that
   supersedes it, and the superseded record stays visible with a forward pointer.
4. Every record states what it established and what it did not, as of a named
   upstream digest and date.
5. A record is labelled unverified until a party other than the assessor and the
   implementer has re-run it and is named. The build computes that label.
6. A graded party receives an entry fourteen days before publication and may reply;
   the reply is published beside the record, unedited.
7. The index records the digest of its previous version, and the check walks that
   chain through the signed history.

**Adding a record.** Write the folder and its `record.json`, put the inputs it names
in the tree at the digests it names, run `npm run registry` to rebuild the index and
the badges, then make one signed commit carrying the record and the rebuilt index
together. `npm run registry -- --check` re-derives everything and exits non-zero on
any of the seven rules; it runs in the ordinary test suite, so CI fails on a broken
registry.

**Citing a record.** Cite its id and the commit that ADDED it, never `HEAD`:
`npm run registry -- --check` prints that table. A record is immutable from its
adding commit, so the pair is stable for ever; `HEAD` is not, and a citation against
it says nothing about what the record said when it was cited. The raw index at a
commit is at:

```
https://raw.githubusercontent.com/LembaGang/receipt-verify/<commit>/registry/index.json
```

**One disclosed break in the chain.** The index committed at `d8b21444` carries
`previous_index_sha256: null` where rule 7 requires
`f3fd379d06dee26b6a2ee07b3702dfeb12cd8f052a9b8f8b38f39ac9ea7a1226`. The cause was a
build that kept the committed link when a rebuild changed no record; that is fixed
and tested against. The commit was never pushed, and a signed commit here is a
statement that is never amended, so the break is disclosed rather than erased.
`--check` prints it as a notice on every run, `index.json` carries it as
`disclosed_chain_breaks`, and `registry/README.md` states it. It is a weakening of
rule 7 and is recorded as one, not as a repair. The list is closed: an entry may be
added only for history that was never pushed, and never after a push.

## Citing a release

To cite what ships today, name the npm artifact by version and integrity: `@headlessoracle/receipt-verify@0.1.2`, `sha512-M8I9mgXCsOoi1i9egEOapAp1mp8xdImkAg56BtqQZ3R9tlA7bQk5E6QllvFcDPIMZH8ty6lR3enOVZDa5mIDlQ==`, built from commit `1c3452fe9a8109616481dad75dacb312517bf47f`, which the `v0.1.2` tag points at; the published tarball was compared file for file against a fresh build of that commit and is identical (recorded in `RELEASE-NOTES.md` under 0.1.2). Do not cite `v0.1.1` as the source of what 0.1.1 runs: that tag points at a commit that does not contain the code that package runs (recorded in `RELEASE-NOTES.md` under 0.1.1). Cite a commit or a tag, never `HEAD`, which moves.

Status: this README describes the tree it sits in, whose version is the one in
`package.json`; published versions and the commit each was built from are
recorded in the release notes. No conformance claim is made beyond what the test
suite demonstrates against the fixtures in this repository.
