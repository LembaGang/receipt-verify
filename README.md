# receipt-verify

`0.1.0-dev` — a cross-format verifier for agent receipts. It reads a receipt,
recomputes everything the receipt claims, and returns one of three verdicts.

**Verdicts attach to RECEIPTS under FORMATS — never to vendors, and this tool
never issues gate decisions.**

That sentence is the whole design. A VALID verdict says "this receipt is
internally consistent and binds to this key." It does not say the issuer is
trustworthy, that the claim inside the receipt is true, or that you should
proceed with whatever the receipt describes. Where a receipt records its own
gate decision, that value is reported as an annotation and labelled as the
issuer's, not as this tool's recommendation.

---

## The tri-state contract

| Verdict | Exit | Means | Names a key? |
|---|---|---|---|
| `VALID` | 0 | Every check completed and passed. | Yes — `verified under key …` |
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
  "detail": "v_gate: mapping agentoracle-v0.3-2026-05-30 not resolvable (searched …)",
  "resolved_key": null,
  "annotations": { "jws_signature_check": "passed", "failed_at_step": 2 },
  "exit_code": 1
}
```

`resolved_key` is always present and is `null` exactly when the verdict is
`UNVERIFIABLE` — one field to test, never a probe for absence.

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

A recorded transcript is in `cc-output/receipt-verify-demo-2026-07-25.md`.

---

## Usage

```
receipt-verify <file> [options]

  --format <name>        evidence.action | verification   (default: auto-detect)
  --jwks <path|url>      published JWK Set: a .json file, a directory of them, or an https URL
  --mapping-dir <dir>    directory of mapping documents
  --payload <file>       detached-JWS payload: the bytes the signature covers
  --payload-jcs          canonicalize --payload with RFC 8785 JCS before verifying
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
`@headlessoracle/chirindo@0.3.0`, not to a local checkout. This adapter supplies
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
does not specify that document's schema, and no mapping document is published
at any location the draft or the reference fixtures name. **The schema in
`src/mapping.ts` is therefore defined by this tool**, and
`fixtures/verification-state/mappings/v0.3.0-2026-05-30.json` is this tool's
transcription of the §5.1 decision table — not an artifact published by the
draft author.

Resolution is local-only. Fetching a mapping document at verify time would make
the verdict depend on what a remote host served at that instant, which is the
property §4.6 exists to remove. A receipt whose mapping does not resolve and
hash-match is `UNVERIFIABLE`; the tool never substitutes a default ruleset.

`v_gate_mapping_hash` is accepted as bare hex, `sha256:<hex>`, or
`sha256-<hex>`, because the draft, its own example, and the published fixtures
each use a different one of the three. This leniency is documented rather than
silent — see `FINDINGS.md`.

---

## Fixtures

Everything under `fixtures/` and `refs/` is a byte-exact snapshot, pinned by
sha256 with its source URL and retrieval time in `fixtures/provenance.md`.
Regenerate with `npm run snapshot`.

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

## Development

```bash
npm run typecheck
npm test                            # 166 tests, no network
RECEIPT_VERIFY_LIVE=1 npm test      # adds the live-JWKS integration test
npm run snapshot                    # re-pull remote fixtures + rewrite provenance
npm run fixtures                    # regenerate throwaway-signed fixtures
```

`src/adapters/*.ts` implement one `Adapter` interface (`detect?`, `verify`), so
adding a third format is a new file plus a registry line in `src/detect.ts`.

Status: `0.1.0-dev`. Not published. No conformance claim is made beyond what the
test suite demonstrates against the fixtures in this repository.
