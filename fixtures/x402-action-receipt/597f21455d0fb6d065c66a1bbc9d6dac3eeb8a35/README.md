# x402 Action-Bound Receipt — draft extension + reference conformance suite

A draft profile of the x402 `offer-receipt` extension that carries a
tamper-evident, offline-verifiable binding between a settlement and what an agent
did after it (issues [#2332], [#2648], [#2357]), plus a runnable, two-sided
conformance harness.

**Status:** proposed as an x402 extension in
[x402-foundation/x402#2906][2906]. This repository is the public reference spec +
conformance suite for that proposal, published so any implementation can run the
vectors and cross-check results in the open.

[2906]: https://github.com/x402-foundation/x402/issues/2906
[#2332]: https://github.com/x402-foundation/x402/issues/2332
[#2648]: https://github.com/x402-foundation/x402/issues/2648
[#2357]: https://github.com/x402-foundation/x402/issues/2357

## Files

| File | What |
|---|---|
| `RECEIPT-BINDING-EXTENSION.md` | The draft spec — a profile of the approved `offer-receipt` extension |
| `action_receipt.py` | Reference verifier + conformance suite + vector generator |
| `vectors/` | Committed two-sided test vectors (inputs, not run-time outputs) |
| `vectors/MANIFEST.json` | Language-neutral manifest — expected verdict + reason + settlement per vector, so any-SDK verifiers can run the suite |
| `VECTORS.md` | Vector-by-vector coverage matrix |
| `requirements.txt` | Dependencies |
| `LICENSE` | Apache-2.0 |

## Run

```bash
python3 action_receipt.py                 # verify the committed vectors
python3 action_receipt.py --regenerate    # re-sign + rewrite vectors, then verify
python3 action_receipt.py --verify vectors/pos_es256_valid.json
```

Expected: `all 36 pass; verifier produced both verdicts; every one of 13
reject reason codes exercised (across 29 negative vectors)`, exit 0.

### Dependencies

- `cryptography` — **required** (signature verification and vector generation).
  A verifier that cannot check signatures must not return PASS, so there is no
  signature-free mode.
- `rfc8785` — optional. When importable, every payload's canonicalization is
  cross-checked byte-for-byte against the reference RFC 8785 library, so the
  in-repo canonicalizer is verified against the reference rather than trusted.

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python action_receipt.py
```

## What this profile adds over the extension it builds on

The approved `offer-receipt` extension already signs receipts. This profile adds
what the post-settlement-accountability cluster asks for:

1. an `action` block (what the agent did, its authorized scope, the outcome);
2. `actionRef`, a content address over the JCS-canonical action tuple —
   following #2648's convergence on RFC 8785 over a structured tuple;
3. a **scheme-general** settlement binding — the on-chain `transaction` when a
   scheme provides one, or a `settlementRef` (voucher / channel receipt / batch
   root / ledger ref) when it doesn't — verified only against a *successful*
   settlement;
4. a `settlementStatus` (settled / capturePending / reversed / refunded) so the
   payment lifecycle is represented separately from the service `outcome`;
5. a canonicalization check (JWS payload bytes == `JCS(payload)`) making
   "recomputable offline" a concrete conformance condition;
6. reject reasons in the x402 error-taxonomy convention (`invalid_actionreceipt_*`);
7. an executable, two-sided conformance suite that asserts its own coverage —
   every verification branch has a negative vector that triggers it, and the run
   confirms both verdicts were produced.

## Design notes

- **Scope**: JWS format only (ES256, ES256K, EdDSA), by choice — the profile is
  verifiable end-to-end. EIP-712 is a follow-up reusing the base extension's
  rules (spec §10).
- **Vectors are inputs.** The default run verifies the committed `vectors/`;
  regeneration is explicit (`--regenerate`). Keys derive from fixed seeds, so
  key material, payloads, and every `actionRef` regenerate identically.
  Signature reproducibility is algorithm-dependent: EdDSA vectors regenerate
  byte-for-byte (deterministic by construction), while ES256/ES256K sign with
  fresh per-signature randomness (not RFC 6979), so their signature bytes differ
  between runs. Every verdict is identical regardless — the record is identified
  by `actionRef`, which is independent of signature entropy.
- **Determinism**: no wall-clock or RNG affects a recorded verdict — the
  verifier's clock is passed in, and all verdicts recompute from committed bytes.
  A regenerated ES256/ES256K signature is fresh-random noise, not an identifier:
  the only useful signal in it is that `r` never repeats across signings with a
  key (repetition would be catastrophic nonce reuse); everything nameable is in
  `actionRef`.
- **Not a new primitive**: JCS + JWS + SHA-256, composed. The additions are the
  binding discipline and the conformance instrument. No novelty is claimed.

## Related work — layering

This profile is the *signed-binding* layer. It composes with, rather than
duplicates, the action-reference identifier work:

- **`draft-etcheverry-action-ref`** (individual Internet-Draft) defines the
  `action_ref` *identifier* and a canonical envelope, and §3.1 freezes a
  four-field preimage with optional fields kept envelope-adjacent — but it keeps
  cryptographic signing separate from the identifier (its §8.1). This profile
  supplies exactly that omitted layer for x402: a JWS `offer-receipt` that makes
  the whole record signed and offline-verifiable, binding the `actionRef` and a
  scheme-general settlement reference into one ~1–2 KB receipt. Identifier +
  envelope underneath; signed x402 receipt-binding on top.
- **#2648** established the RFC 8785 (JCS) canonicalization convergence over
  #2332's original concatenation; `actionRef` follows it.

## Cross-implementation conformance

`vectors/MANIFEST.json` is language-neutral: a conformant verifier loads
`keys.json`, each vector, and the named settlement, and MUST reproduce the
verdict and (on REJECT) the reason. Implementations in any language are welcome
to run the suite and report results — two-sided agreement (every positive
verifies, every negative rejects with its stated reason) in the open is the
intended bar. Issues and cross-implementation results welcome here or on [#2906].

## License · contributor

Apache-2.0. Contributed openly by Holological LLC (`jsuich`). No novelty is
claimed — an engineering composition of RFC 8785, RFC 7515 (JWS), and SHA-256,
bound to the base `offer-receipt` extension and #2648's convergence.
