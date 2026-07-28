# receipt-verify 0.1.0-dev — `acta.receipt/0` demo transcript

Recorded 2026-07-28. Every block below is real terminal output, pasted
unedited, with the process exit code. Run from `C:\Users\User\receipt-verify`
after `npm install && npm run build`.

Environment: Node v24.13.0, npm 11.9.0, Windows 11.

Format 3 is **draft-farley-acta-signed-receipts-02**, with
**draft-marques-asqav-compliance-receipts-07** read as a profile layered on it.
Both draft texts are snapshotted in `refs/` and pinned by sha256 in
`fixtures/provenance.md`.

`--now 1782651600` (2026-06-28T13:00:00Z) is passed throughout so the reported
receipt age is reproducible.

---

## 0. Byte-parity against the one published receipt that can be checked

Before anything else: the draft's §5.10 test suite could not be located
(`FINDINGS.md` §E1), but the cited corpus does ship one receipt with a published
canonical form and JWKS. That is enough to check our canonicalization against
somebody else's bytes, and to settle which of the draft's two signature-scope
readings the ecosystem actually uses.

```
$ node --input-type=module -e "…"   # full script in test/acta.test.ts

published canonical.txt   : 588 bytes  sha256 b7d84a8a164c8aea6d09d27c41ecbf4119dbada80cab4d9b83bfcb51fae119bc
our JCS(env minus sig)    : 588 bytes  sha256 b7d84a8a164c8aea6d09d27c41ecbf4119dbada80cab4d9b83bfcb51fae119bc
byte-identical            : true

ed25519 verify over farley 5.6 bytes (env minus signature) : true
ed25519 verify over farley 4.1 bytes (inner payload member) : false
```

The draft says both. §4.1 step 2 says canonicalize *the payload*; §5.6 says
canonicalize *the receipt object minus the signature*. The published receipt
resolves it in favour of §5.6, so §5.6 is what this adapter implements. See
`FINDINGS.md` §E2.

---

## 1. §5.10 item 1 — a cleartext receipt verifies

```
$ node dist/cli.js fixtures/acta/synthetic/cleartext.receipt.json \
    --jwks fixtures/acta/keys/acta-throwaway.jwks.json --now 1782651600

VALID — signature and all recomputable §4.2/§5 checks passed
format: acta.receipt/0
reason: verified
verified under key sb:issuer:BTHQTy7E1W77 (thumbprint _OVx_NGyZSQEp5dXcllLnDohrSaJvz3zpwjprauEo-A) resolved from fixtures/acta/keys/acta-throwaway.jwks.json
annotation: signature_scope=farley-5.6 (receipt object minus `signature`)
annotation: alg=EdDSA
annotation: receipt_type=protectmcp:decision
annotation: receipt_gate=deny (the issuer's recorded gate value, not a decision by this tool)
annotation: receipt_age_hours=1

exit: 0
```

The verdict names the scope it verified under, so a reader can tell which of the
draft's two readings produced the `VALID`. `receipt_gate=deny` is the *issuer's*
recorded decision, carried through and labelled as theirs — this tool does not
issue gate decisions.

---

## 2. §5.10 item 6 — five committed fields, exercising the recursive split

```
$ node dist/cli.js fixtures/acta/synthetic/committed-5.receipt.json \
    --jwks fixtures/acta/keys/acta-throwaway.jwks.json \
    --disclose fixtures/acta/synthetic/committed-5.disclosures.json --now 1782651600

VALID — signature and all recomputable §4.2/§5 checks passed
format: acta.receipt/0
reason: verified
verified under key sb:issuer:BTHQTy7E1W77 (thumbprint _OVx_NGyZSQEp5dXcllLnDohrSaJvz3zpwjprauEo-A) resolved from fixtures/acta/keys/acta-throwaway.jwks.json
annotation: signature_scope=farley-5.6 (receipt object minus `signature`)
annotation: alg=EdDSA
annotation: receipt_type=protectmcp:decision
annotation: receipt_age_hours=0.8
annotation: commitment_check=passed (5 leaves)

exit: 0
```

Five leaves is the non-power-of-two case: §5.1's "largest power of two strictly
less than n" split, checked twice — once by recomputing the root over all
disclosed leaves, once by walking each §5.5 inclusion proof independently.

The generator (`tools/make-acta-fixtures.mjs`) and the verifier
(`src/adapters/acta.ts`) implement the Merkle construction separately and share
no code. That is deliberate: a shared implementation would make these fixtures
verify against themselves.

---

## 3. §5.10 item 4 — a tampered Merkle proof MUST fail

One sibling hash in one inclusion proof has its first nibble flipped. Nothing
else is touched: the signature is still good and the root still recomputes.

```
$ node dist/cli.js fixtures/acta/synthetic/committed-4.receipt.json \
    --jwks fixtures/acta/keys/acta-throwaway.jwks.json \
    --disclose fixtures/acta/synthetic/tamper-merkle-proof.disclosures.json --now 1782651600

INVALID — key-binding: inclusion proof for agent_tier walks to fcec46860e4cc157c706ff0b95ea9ce48a64df6055206b7a132cc735da3b54b1, receipt commits a35f35659f871881017f60df5883d67cec5b91bde1d8df612941caf1dbe4a935
format: acta.receipt/0
reason: content_commitment_mismatch
checked against resolved key sb:issuer:BTHQTy7E1W77 (thumbprint _OVx_NGyZSQEp5dXcllLnDohrSaJvz3zpwjprauEo-A) resolved from fixtures/acta/keys/acta-throwaway.jwks.json

exit: 1
```

---

## 4. §5.10 item 3 — a chain link recomputed under farley §5.7

```
$ node dist/cli.js fixtures/acta/synthetic/chain-farley/002.receipt.json \
    --jwks fixtures/acta/keys/acta-throwaway.jwks.json \
    --prev fixtures/acta/synthetic/chain-farley/001.receipt.json --now 1782651600

VALID — signature and all recomputable §4.2/§5 checks passed
format: acta.receipt/0
reason: verified
verified under key sb:issuer:BTHQTy7E1W77 (thumbprint _OVx_NGyZSQEp5dXcllLnDohrSaJvz3zpwjprauEo-A) resolved from fixtures/acta/keys/acta-throwaway.jwks.json
annotation: signature_scope=farley-5.6 (receipt object minus `signature`)
annotation: alg=EdDSA
annotation: receipt_type=protectmcp:decision
annotation: receipt_gate=allow (the issuer's recorded gate value, not a decision by this tool)
annotation: receipt_age_hours=1
annotation: chain_digest_scope=farley-5.7
annotation: chain_link=verified against --prev

exit: 0
```

`chain_digest_scope` names which of the three candidate scopes produced the
match, so a `VALID` chain never leaves the reader guessing which reading of the
spec it was built to.

---

## 5. The chain-digest contradiction, direction 1 — marques §5.3, payload reading

The same three receipts, chained under the scope
draft-marques-asqav-compliance-receipts-07 §5.3 mandates instead.

```
$ node dist/cli.js fixtures/acta/synthetic/chain-marques-payload/002.receipt.json \
    --jwks fixtures/acta/keys/acta-throwaway.jwks.json \
    --prev fixtures/acta/synthetic/chain-marques-payload/001.receipt.json --now 1782651600

INVALID — key-binding: previousReceiptHash does not match the predecessor under §5.7 (expected b3ca2e0f8770e575b81e129329beb9e8a13a969b6cef7fd6ead18b6c6756c540), but DOES match it under marques-5.3-payload — inner payload member only, signature-exclusive. draft-marques-asqav-compliance-receipts-07 §5.3 mandates that signature-exclusive scope while citing farley §5.7 as its authority; the two scopes digest different bytes. This tool implements §5.7 and refuses rather than accept either silently — see FINDINGS.md §E3
format: acta.receipt/0
reason: chain_linkage_broken
checked against resolved key sb:issuer:BTHQTy7E1W77 (thumbprint _OVx_NGyZSQEp5dXcllLnDohrSaJvz3zpwjprauEo-A) resolved from fixtures/acta/keys/acta-throwaway.jwks.json

exit: 1
```

---

## 6. The chain-digest contradiction, direction 2 — marques §5.3, signing-input reading

§5.3's operative exclusion ("NOT the envelope object that additionally includes
the signature **or anchors top-level keys**") and its own rationale ("the same
bytes the predecessor's cryptographic signature covers") select *different* byte
strings, because under §5.6 the signed bytes retain the top-level `payload` key.
So there are two signature-exclusive variants to detect, not one
(`FINDINGS.md` §E4).

```
$ node dist/cli.js fixtures/acta/synthetic/chain-marques-signing-input/002.receipt.json \
    --jwks fixtures/acta/keys/acta-throwaway.jwks.json \
    --prev fixtures/acta/synthetic/chain-marques-signing-input/001.receipt.json --now 1782651600

INVALID — key-binding: previousReceiptHash does not match the predecessor under §5.7 (expected b3ca2e0f8770e575b81e129329beb9e8a13a969b6cef7fd6ead18b6c6756c540), but DOES match it under marques-5.3-signing-input — the bytes the signature covers per §5.6, signature-exclusive. draft-marques-asqav-compliance-receipts-07 §5.3 mandates that signature-exclusive scope while citing farley §5.7 as its authority; the two scopes digest different bytes. This tool implements §5.7 and refuses rather than accept either silently — see FINDINGS.md §E3
format: acta.receipt/0
reason: chain_linkage_broken

exit: 1
```

Both directions produce a refusal that names the variant it matched. A detected
variant is an explanation attached to a refusal — never a licence to accept.
A link matching *no* known scope says that instead, and names all three
candidate digests.

---

## 7. The signature-scope contradiction, the other direction

A receipt signed over the §4.1 step 2 bytes rather than the §5.6 bytes.

```
$ node dist/cli.js fixtures/acta/synthetic/sigscope-4.1.receipt.json \
    --jwks fixtures/acta/keys/acta-throwaway.jwks.json --now 1782651600

INVALID — key-binding: signature does not verify over the §5.6 bytes (receipt object minus `signature`), but DOES verify over the §4.1 step 2 bytes (the inner `payload` member alone). The draft specifies both: §4.1 says canonicalize the payload, §5.6 says canonicalize the receipt minus the signature. This tool implements §5.6 and refuses rather than pick the reading that happens to pass — see FINDINGS.md §E2
format: acta.receipt/0
reason: signature_invalid
checked against resolved key sb:issuer:BTHQTy7E1W77 (thumbprint _OVx_NGyZSQEp5dXcllLnDohrSaJvz3zpwjprauEo-A) resolved from fixtures/acta/keys/acta-throwaway.jwks.json

exit: 1
```

---

## 8. Fail-closed — an algorithm this tool cannot check

§5.8 lists ML-DSA-65 as RECOMMENDED. Node has no ML-DSA primitive.

```
$ node dist/cli.js fixtures/acta/synthetic/alg-mldsa65.receipt.json \
    --jwks fixtures/acta/keys/acta-throwaway.jwks.json --now 1782651600

UNVERIFIABLE — signature.alg is ML-DSA-65: named by §5.8 but not implemented by this tool, so the signature cannot be checked either way
format: acta.receipt/0
reason: unsupported_algorithm

exit: 1
```

`UNVERIFIABLE`, not `INVALID`: nothing about the receipt was established. Note
the absence of any key line — that is the contract, and it holds structurally
(the `unverifiable()` constructor takes no key parameter).

---

## 9. The published corpus is not the draft's §2.1 envelope

The receipt whose canonicalization we byte-matched in block 0 is not, in fact,
in the shape §2.1/§2.1.1 defines: its `signature` is a hex string, not an object
with `alg`/`kid`/`sig`. It also matches neither branch of the corpus's own
`oneOf` conformance schema (`FINDINGS.md` §E6).

```
$ node dist/cli.js fixtures/acta/published/aps-gateway-enforcement/2-external-verification/receipt.json \
    --format acta \
    --jwks fixtures/acta/published/aps-gateway-enforcement/2-external-verification/jwks.json --now 1782651600

UNVERIFIABLE — `signature` is missing or not a JSON object (§2.1.1)
format: acta.receipt/0
reason: malformed_receipt

exit: 1
```

The tool refuses rather than shape-sniff across incompatible layouts. That the
same bytes verify cryptographically (block 0) and are still `UNVERIFIABLE` under
`acta.receipt/0` is the point: a verdict attaches to a receipt **under a named
format**, and this receipt is not in that format.

---

## 10. Checks that did not run are reported, not assumed

The same chain receipt as block 4, without `--prev`.

```
$ node dist/cli.js fixtures/acta/synthetic/chain-farley/002.receipt.json \
    --jwks fixtures/acta/keys/acta-throwaway.jwks.json --now 1782651600 --json

{
  "schema": "receipt-verify/verdict/0",
  "verdict": "VALID",
  "reason": "verified",
  "format": "acta.receipt/0",
  "detail": "signature and all recomputable §4.2/§5 checks passed",
  "resolved_key": {
    "kid": "sb:issuer:BTHQTy7E1W77",
    "thumbprint": "_OVx_NGyZSQEp5dXcllLnDohrSaJvz3zpwjprauEo-A",
    "alg": "EdDSA",
    "origin": "fixtures/acta/keys/acta-throwaway.jwks.json"
  },
  "annotations": {
    "signature_scope": "farley-5.6 (receipt object minus `signature`)",
    "alg": "EdDSA",
    "receipt_type": "protectmcp:decision",
    "receipt_gate": "allow",
    "receipt_age_hours": 1,
    "chain_link": "present but not checked (no --prev)"
  },
  "exit_code": 0
}

exit: 0
```

`chain_link` says the link was present and not checked, and `chain_digest_scope`
is **absent** — an agent reading this cannot mistake it for a verified chain.
The same discipline applies to `committed_fields_root` with no `--disclose`.

---

## Suite

```
$ npm test

 ✓ test/mapping.test.ts (28 tests)
 ✓ test/detached-jcs.test.ts (14 tests)
 ✓ test/live-jwks.test.ts (4 tests | 3 skipped)
 ✓ test/acta.test.ts (35 tests)
 ✓ test/cli.test.ts (20 tests)
 ✓ test/evidence-action.test.ts (27 tests)
 ✓ test/contract.test.ts (41 tests)
 ✓ test/verification-state.test.ts (47 tests)

 Test Files  8 passed (8)
      Tests  213 passed | 3 skipped (216)
```

The three skips are `test/live-jwks.test.ts`, which is the only test permitted
to touch the network; it skips unless `RECEIPT_VERIFY_LIVE=1` and is allowed to
skip offline, not to pass offline.
