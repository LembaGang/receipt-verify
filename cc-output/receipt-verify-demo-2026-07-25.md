# receipt-verify 0.1.0-dev — demo transcript

Recorded 2026-07-25. Every block below is real terminal output, pasted
unedited, with the process exit code. Run from `C:\Users\User\receipt-verify`
after `npm install && npm run build`.

Environment: Node v24.13.0, npm 11.9.0, Windows 11.

> **Superseded in part, 2026-07-29.** The output below is left exactly as it was
> recorded and is still a true record of that run. Two things have since changed
> in the artifacts it exercises, so do not read it as current behaviour:
>
> - Block C's composed fixture returns `UNVERIFIABLE` / `mapping_unresolvable`
>   here because no mapping document was published at the time. One is published
>   now and the same fixture verifies; see `FINDINGS-rerun-2026-07-29.md`.
> - Results now also carry a `coverage` block naming the checks a run did not
>   evaluate. It did not exist when this was recorded.

---

## The three-command demo

### 1. `evidence.action/0` — a conformance receipt that verifies

```
$ node dist/cli.js fixtures/evidence-action/vectors/allow/chain.jsonl \
    --jwks fixtures/evidence-action/jwks.json

VALID — 1 record(s), chain intact, all signatures verified, session 00000000-0000-4000-8000-000000000001
format: evidence.action/0
reason: verified
verified under key ed25519/Vkdap1RjR0wC (thumbprint 1IG2tMH7J2wbJZnOf8LJzQitKf7LMvoAElsuDMVM54Y) resolved from fixtures/evidence-action/jwks.json

exit: 0
```

Verification is performed by the published npm artifact
`@headlessoracle/chirindo@0.3.0`. The key came from a published JWK Set; no
private key is read on any path in this tool.

### 2. `evidence.action/0` — the same receipt with one field altered after signing

```
$ node dist/cli.js fixtures/evidence-action/vectors/tampered/chain.jsonl \
    --jwks fixtures/evidence-action/jwks.json

INVALID — key-binding: entry 0: request_commitment mismatch
format: evidence.action/0
reason: content_commitment_mismatch
checked against resolved key ed25519/Vkdap1RjR0wC (thumbprint 1IG2tMH7J2wbJZnOf8LJzQitKf7LMvoAElsuDMVM54Y) resolved from fixtures/evidence-action/jwks.json

exit: 1
```

`INVALID` names the key the receipt failed against. It does not say "verified
under" — that phrasing is reserved for `VALID`.

### 3. `verification.*` — detached JWS, payload reconstructed and JCS-canonicalized

```
$ node dist/cli.js fixtures/verification-state/synthetic/flat-act.detached.flattened.json \
    --format verification \
    --jwks fixtures/keys/test-throwaway-ed25519.jwks.json \
    --mapping-dir fixtures/verification-state/mappings \
    --payload fixtures/verification-state/synthetic/flat-act.payload.json --payload-jcs

VALID — all §4.3 checks passed (flattened serialization, detached payload canonicalized with RFC 8785 JCS)
format: verification.*
reason: verified
verified under key test-throwaway-ed25519-ad18dd83 (thumbprint _OVx_NGyZSQEp5dXcllLnDohrSaJvz3zpwjprauEo-A) resolved from fixtures/keys/test-throwaway-ed25519.jwks.json
annotation: receipt_gate=act (the issuer's recorded gate value, not a decision by this tool)
annotation: profile=flat (draft §4.2)
annotation: signers=1

exit: 0
```

All eight steps of `draft-krausz-verification-state-01` §4.3 ran: signature,
mapping resolution and digest binding, recommendation recompute, gate derivation,
and `exp`/`nbf`. The receipt's own gate value (`act`) is reported as the
issuer's, not as this tool's advice.

---

## Supplementary cases

### A. A published fixture, failing closed at §4.3 step 2

```
$ node dist/cli.js fixtures/verification-state/spec-examples/v0.3-composed/jws-001.json \
    --format verification \
    --jwks fixtures/verification-state/spec-examples/v0.3-composed \
    --mapping-dir fixtures/verification-state/mappings --json

{
  "schema": "receipt-verify/verdict/0",
  "verdict": "UNVERIFIABLE",
  "reason": "mapping_unresolvable",
  "format": "verification.*",
  "detail": "v_gate: mapping agentoracle-v0.3-2026-05-30 not resolvable (searched fixtures\\verification-state\\mappings\\agentoracle-v0.3-2026-05-30.json)",
  "resolved_key": null,
  "annotations": {
    "jws_signature_check": "passed",
    "signers_verified": 2,
    "failed_at_step": 2
  },
  "exit_code": 1
}

exit: 1
```

Both published signatures verify against the published JWKS. The receipt binds a
mapping document that is not published anywhere this implementation could locate,
so §4.3 step 2 cannot be completed and the result is `UNVERIFIABLE` — not
`INVALID`, because nothing was established against the receipt.

`resolved_key` is `null` and no key line is printed, even though the signature
check passed. `failed_at_step` says how far the protocol got without that
becoming a claim that the receipt verified. Recorded as FINDINGS §B4.

### B. The same detached receipt without `--payload-jcs`

```
$ node dist/cli.js fixtures/verification-state/synthetic/flat-act.detached.flattened.json \
    --format verification \
    --jwks fixtures/keys/test-throwaway-ed25519.jwks.json \
    --mapping-dir fixtures/verification-state/mappings \
    --payload fixtures/verification-state/synthetic/flat-act.payload.json

INVALID — key-binding: signature does not verify over the detached payload (flattened serialization)
format: verification.*
reason: signature_invalid
checked against resolved key test-throwaway-ed25519-ad18dd83 (thumbprint _OVx_NGyZSQEp5dXcllLnDohrSaJvz3zpwjprauEo-A) resolved from fixtures/keys/test-throwaway-ed25519.jwks.json

exit: 1
```

Identical logical payload, identical receipt, identical key. The only difference
is that the payload bytes were not canonicalized. Canonicalization is
load-bearing on the detached path, not cosmetic.

### C. A correctly signed receipt whose own numbers do not recompute

```
$ node dist/cli.js fixtures/verification-state/synthetic/tamper-resigned-confidence.attached.flattened.json \
    --format verification \
    --jwks fixtures/keys/test-throwaway-ed25519.jwks.json \
    --mapping-dir fixtures/verification-state/mappings

UNVERIFIABLE — payload: recomputed v_recommendation weak_supported, receipt signed confident_supported
format: verification.*
reason: recompute_mismatch
annotation: jws_signature_check=passed
annotation: signers_verified=1
annotation: failed_at_step=4

exit: 1
```

The signature is good — this payload was signed as-is. §4.3 step 4 catches it:
`v_confidence` of 0.42 is below the mapping's 0.7 threshold, so the
recommendation recomputes to `weak_supported`, not the `confident_supported` the
issuer signed. This is the check that makes steps 2–7 load-bearing rather than
decorative.

### D. A receipt recording `halt` is exactly as VALID as one recording `act`

```
$ node dist/cli.js fixtures/verification-state/synthetic/flat-halt.attached.flattened.json \
    --format verification \
    --jwks fixtures/keys/test-throwaway-ed25519.jwks.json \
    --mapping-dir fixtures/verification-state/mappings

VALID — all §4.3 checks passed (flattened serialization, attached payload)
format: verification.*
reason: verified
verified under key test-throwaway-ed25519-ad18dd83 (thumbprint _OVx_NGyZSQEp5dXcllLnDohrSaJvz3zpwjprauEo-A) resolved from fixtures/keys/test-throwaway-ed25519.jwks.json
annotation: receipt_gate=halt (the issuer's recorded gate value, not a decision by this tool)
annotation: profile=flat (draft §4.2)
annotation: signers=1

exit: 0
```

Exit 0, same as the `act` receipt. The verdict is about whether the receipt holds
together, not about what the receipt says to do. This tool issues no gate
decisions.

---

## Test suite

```
$ npx vitest run

 ✓ test/mapping.test.ts (28 tests) 15ms
 ✓ test/live-jwks.test.ts (4 tests | 3 skipped) 4ms
 ✓ test/detached-jcs.test.ts (14 tests) 33ms
 ✓ test/cli.test.ts (20 tests) 92ms
 ✓ test/contract.test.ts (29 tests) 170ms
 ✓ test/evidence-action.test.ts (27 tests) 256ms
 ✓ test/verification-state.test.ts (47 tests) 249ms

 Test Files  7 passed (7)
      Tests  166 passed | 3 skipped (169)
   Start at  15:09:04
   Duration  1.31s
```

The 3 skipped tests are the live-JWKS integration test, which is skipped unless
`RECEIPT_VERIFY_LIVE=1`. With it enabled:

```
$ RECEIPT_VERIFY_LIVE=1 npx vitest run test/live-jwks.test.ts

 ✓ test/live-jwks.test.ts (4 tests | 1 skipped) 3170ms
   ✓ the live endpoint serves a JWKS with the kid our snapshot has 1334ms
   ✓ the snapshot still matches the live key material 1385ms
   ✓ the published sample receipt's signature verifies against the LIVE key 450ms

 Test Files  1 passed (1)
      Tests  3 passed | 1 skipped (4)
```

The snapshot of `https://agentoracle.co/.well-known/jwks.json` taken on
2026-07-25 still matches what that endpoint serves, and the published sample
receipt's signature verifies against the key fetched live rather than only
against a local file.

---

## Coverage summary

| Requirement | Where |
|---|---|
| Six `evidence.action` vectors reproduce their manifest verdicts | `test/evidence-action.test.ts` |
| Snapshot bytes match each vector's pinned sha256 | `test/evidence-action.test.ts` |
| Byte-flip tamper tests flip the verdict off VALID | `test/evidence-action.test.ts` |
| Published composed fixtures — signatures verify, mapping binding fails closed | `test/verification-state.test.ts` |
| Tamper each signed claim in a published fixture → non-VALID | `test/verification-state.test.ts` |
| Detached + JCS proven, including RFC 7797 `b64:false` | `test/detached-jcs.test.ts` |
| §5.1 decision table, every row | `test/mapping.test.ts` |
| Tri-state invariants across every fixture in the repo | `test/contract.test.ts` |
| Live JWKS, explicitly marked and skippable | `test/live-jwks.test.ts` |

Findings from the published artifacts are in `FINDINGS.md`. Fixture provenance,
with source URLs, UTC retrieval times, and per-file sha256, is in
`fixtures/provenance.md`.
