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
checks. Two reasons are distinguished:

- **`not_reached`** — implemented, but evaluation stopped before it.
- **`not_implemented`** — declared by a normative source or by the published
  conformance corpus, and **not evaluated by this tool at all**. These are
  reported on every result, *including `VALID`* — a VALID verdict does not mean
  every declared check was evaluated, and saying so plainly is the point.

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

  --format <name>        evidence.action | verification | acta   (default: auto-detect)
  --jwks <path|url>      published JWK Set: a .json file, a directory of them, or an https URL
  --mapping-dir <dir>    directory of mapping documents
  --payload <file>       detached-JWS payload: the bytes the signature covers
  --payload-jcs          canonicalize --payload with RFC 8785 JCS before verifying
  --prev <file>          predecessor receipt, for formats carrying a chain link
  --disclose <file>      disclosed {name, value, salt, proof} tuples, for committed fields
  --clock-tolerance <s>  clock tolerance for exp/nbf (default 60)
  --now <epoch>          evaluate time-based checks at a fixed instant
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
| Everything above passes and the signature recovers the stated attester | `VALID` | `verified` |

The last two window rows are **different facts** and both are reported on every
result, as `identity_key_window` and `identity_key_window_at_signing`. `expired`
is a statement about the instant the caller asked about, and naming a different
`--now` can change it; `signed_outside_key_window` is a statement about two
documents — the registry was not vouching for that key when the artefact says it
was made — and no `--now` recovers it. `identity_signing_instant` names which
member supplied the instant and whether that member was inside the signature:
`signedAt` is package metadata and is not.

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
check could not be made, with the error), and `not_checked` (a `historical` pin,
kept for a finding rather than as the current corpus — printed, never counted as
current). Exit 0 only when every `role: current` upstream is `current` or
`moved_untouched`; `unreachable` is a failure, because a check that could not be
made has not passed.

Comparisons read the git object store — `git rev-parse HEAD:<path>` and
`git cat-file blob` — never a worktree, because `core.autocrlf` on a Windows
checkout would otherwise report every text file as changed on every run.

**The rule this exists to serve: a finding cites the pin it was measured
against, and the drift report says whether that pin is still the upstream's
tip.** A finding that silently describes a superseded upstream reads as current
and cites a commit, which is worse than no finding — and as agents rather than
people consume these findings, there is no reader who will notice the date.

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
npm test                            # 260 tests, no network
RECEIPT_VERIFY_LIVE=1 npm test      # adds the live-JWKS and live exit-contract tests
npm run snapshot                    # re-pull remote fixtures + rewrite provenance
npm run fixtures                    # regenerate throwaway-signed fixtures
npm run walk                        # recompute every declared digest in the pinned corpora
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

## Citing a release

To cite what ships today, name the npm artifact by version and integrity: `@headlessoracle/receipt-verify@0.1.2`, `sha512-M8I9mgXCsOoi1i9egEOapAp1mp8xdImkAg56BtqQZ3R9tlA7bQk5E6QllvFcDPIMZH8ty6lR3enOVZDa5mIDlQ==`, built from commit `1c3452fe9a8109616481dad75dacb312517bf47f`, which the `v0.1.2` tag points at; the published tarball was compared file for file against a fresh build of that commit and is identical (recorded in `RELEASE-NOTES.md` under 0.1.2). Do not cite `v0.1.1` as the source of what 0.1.1 runs: that tag points at a commit that does not contain the code that package runs (recorded in `RELEASE-NOTES.md` under 0.1.1). Cite a commit or a tag, never `HEAD`, which moves.

Status: this README describes the tree it sits in, whose version is the one in
`package.json`; published versions and the commit each was built from are
recorded in the release notes. No conformance claim is made beyond what the test
suite demonstrates against the fixtures in this repository.
