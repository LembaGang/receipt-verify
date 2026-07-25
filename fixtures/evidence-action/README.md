# agent-action-receipt-vectors

Conformance test vectors for the `evidence.action/0` agent-action
receipt format. The format is a neutral, third-party-recomputable
signed attestation of an agent action.

This bundle is the **definition** of conformance for the format. Any
verifier that runs these vectors and produces the expected outcomes —
byte-for-byte — is conformant with `evidence.action/0` v1.

The normative content is in [`SPEC.md`](./SPEC.md). This README is a
doorway document only.

## What's in the bundle

| Path | Contents |
|---|---|
| `SPEC.md` | Normative verification algorithm, vector definitions, security considerations |
| `manifest.json` | Machine-readable index of all vectors. Per-vector entries pin every load-bearing hash and signature |
| `jwks.json` | The test public key, inlined as a JWKS. Verifiers consume this — no network |
| `vectors/<id>/chain.jsonl` | Frozen receipt bytes for each vector |
| `tools/runner.mjs` | Reference conformance runner |
| `tools/generate-vectors.mjs` | Generator (regenerates the bundle deterministically) |
| `tools/independent-verify.mjs` | Second isolated verification path used during bundle authoring |

## The vectors

| ID | Property tested | Expected |
|---|---|---|
| `allow` | A valid permitted call verifies byte-for-byte | VALID |
| `deny` | Rule-based denial-with-halt is a first-class verifiable outcome | VALID |
| `fail-closed` | A safe-default halt (environment / verification unresolved) is a first-class verifiable outcome | VALID |
| `tampered` | Post-signature mutation MUST be rejected | TAMPERED |
| `chain-multi` | Verifier checks hash-chain linkage, not just per-record signatures | VALID |
| `canonicalization-key-order` | `args_hash` uses RFC 8785 JCS, not `JSON.stringify` | VALID |

The `tampered` vector is the most important. A verifier that returns
`VALID` for `tampered` is non-conforming.

## Running the reference runner

```
npm install
node tools/runner.mjs
```

Expected output ends with `6/6 vectors passed; 0 failed.` Exit code `0`
on full pass, `1` otherwise.

## Running your own verifier

The bundle is designed for any conforming verifier in any language:

1. Load `manifest.json` and `jwks.json`.
2. For each entry in `manifest.vectors`:
   a. SHA-256 the file at `manifest.vectors[i].receipt`; assert equal to `receipt_sha256`.
   b. Run your verifier on the file, using the bundled JWKS for `kid` resolution.
   c. Assert your verifier returns `VALID` or `TAMPERED` per `expected.verify`.
   d. For `VALID` vectors, assert each pinned per-entry value
      (`request_commitment`, `entry_hash`, `sig`, `canonical_byte_length`,
      `canonical_sha256`) matches what you compute.
3. The runner of `tools/runner.mjs` is one implementation of the above.
   See [`SPEC.md`](./SPEC.md) §4 for the normative verification
   algorithm and §8 for the conformance-runner specification.

## Reference implementation

The recorder engine and the verify SDK are **a** reference
implementation of this format — not *the* reference. Any independent
implementation that passes these vectors is conformant.

The reference implementation runs in observe-only mode and emits
`gate: null` on every real receipt today. The vectors in this bundle
populate the `gate` field, which is the enforcement-mode form of the
same logical event. Both forms are conformant (see
[`SPEC.md`](./SPEC.md) §10).

## Regenerating the bundle

The bundle is byte-deterministic. From a clean checkout:

```
npm install
node tools/generate-vectors.mjs        # writes receipts, manifest.json, jwks.json
node tools/independent-verify.mjs      # second-path verification of all pinned values
node tools/runner.mjs                  # conformance check
```

Every hash, signature, and canonical byte length in `manifest.json` is
independently re-derived from the receipt file bytes by
`tools/independent-verify.mjs` before publication.

## Test key

The bundle's signing key is derived from a published 32-byte seed.
**It is a TEST KEY — do not use in production.** The seed is published
specifically so that independent implementers can re-derive the
private key, re-sign the canonical bytes themselves, and confirm
signature byte parity end-to-end.

See [`SPEC.md`](./SPEC.md) §12.

## License

Apache-2.0. See [`LICENSE`](./LICENSE).
