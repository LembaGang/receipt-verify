# Action-Bound Receipt — a profile of the x402 Offer and Receipt Extension (draft)

**Status**: draft for discussion. Not submitted. **Version 0.2** (2026-07-19).
**Builds on**: `specs/extensions/extension-offer-and-receipt.md` (v0.6, approved).
This profile reuses that extension's envelope, its JWS + RFC 8785 (JCS)
canonicalization rules (base §10), and its signer-authorization model (base
§4.5.1). It adds an `action` block, a content-addressed `actionRef`, a
scheme-general settlement binding, and a payment-lifecycle status, and specifies
an executable verification procedure.
**Scope**: `format: "jws"` only (§10). EIP-712 support is a follow-up that reuses
base §5.3.
**Relates to**: issues #2332 (proof of agent action), #2648 (recomputable
settlement binding), #2357 (offline-verifiable receipts, batch root). See §11.

---

## 1. Problem the base receipt does not cover

The base receipt (base §5.2) attests that a payment for a resource occurred. It
does not carry: **what the agent did** and the **scope** it was authorized to act
within (#2332); a **recomputable** join key binding the receipt to the action and
the settlement (#2648 — #2332's `SHA-256(agent_id || … )` over a raw concatenation
is not canonicalization-safe, so #2648 recommends RFC 8785 (JCS) over a structured
tuple); and a **required** settlement binding (base's `transaction` is optional).
For regulated deployments (EU AI Act Art. 12, enforcing 2026-08-02; MiCA Art. 76;
FCA SYSC 9.1; SOC 2 CC7.x), the missing capability is a third party verifying
*what was done, within what scope, for which settlement*, offline.

## 2. Design in one sentence

Reuse the base signed-receipt envelope; add an `action` block, a content-addressed
`actionRef` over the JCS-canonical action tuple, a settlement binding that works
whether the scheme yields an on-chain `transaction` or a `settlementRef`, and a
`settlementStatus` for the payment lifecycle — so every verdict recomputes from the
receipt's own committed bytes, offline. The composition is JCS + JWS + SHA-256; no
new cryptographic primitive.

## 3. Who signs, placement, and advertisement

### 3.1 Who signs (trust model)

The receipt is signed and emitted by the **resource server**, after it receives
the facilitator's settlement result, via the `enrichSettlementResponse` hook (as
base offer-receipt). The facilitator **MUST NOT** sign or emit the receipt — its
role is limited to producing the settlement fields (`success`, `transaction`,
`network`, `payer`) that the server binds and signs over. A facilitator-signed
receipt would be incoherent: the facilitator does not perform the action and **MUST
NOT** attest `outcome`/`scope`. Verification is performed offline by the client or
any third party (§5).

### 3.2 Placement

Returned on success under a distinct extension key so it composes with, and never
mutates, the base `offer-receipt` object:

```
SettlementResponse.extensions["action-receipt"].info.receipt
```

A server MAY emit both the base receipt and this one. Over **A2A**, the
`SettlementResponse` travels inside the `x402.payment.receipts` array, so the receipt
lives in `receipts[i].extensions["action-receipt"]`. Note the layering: it is the
**x402-over-A2A payment extension** (not `action-receipt` itself) that is declared in
the AgentCard `capabilities.extensions` — by its URI, with `required` — and activated
via the `X-A2A-Extensions` header; `action-receipt` is an x402 extension riding
*inside* that payment extension's receipts. Over HTTP/MCP the full `SettlementResponse`
is carried, so the extension survives; the JWS is header-safe (~1–2 KB).

### 3.3 Advertisement in PaymentRequired

A resource server that will issue an action-receipt SHOULD advertise it in the
`402`/`PaymentRequired` `extensions["action-receipt"]`, carrying a minimal static
`info` (e.g. `{ "willIssueReceipt": true }`) and its `schema`. This makes the
capability discoverable (`GET /discovery/resources?extensions=action-receipt`) and
lets a client *require* a receipt before paying. Per core §5.1.2 the client MUST
echo the advertised `info` verbatim in `PaymentPayload.extensions["action-receipt"]`
(a per-request server nonce, if used, MUST be declared in `dynamicInfoFields` so it
is excluded from echo validation). The receipt itself is **not** a facilitator
extension and does not appear in the facilitator `/supported` list; nor is its
signer a facilitator signer (do not check it against `/supported.signers`).

### 3.4 Absence

A missing receipt is **not** a payment failure: a verifier treats absence as "no
attestation available." A client that *requires* a receipt treats absence as a
policy decision, not a protocol error.

## 4. Receipt object

Same top-level shape as base §3.1, restricted to JWS: `{format:"jws", signature}`,
`payload` omitted (base §3.1.1). Header (base §3.3): `alg ∈ {ES256 (P-256), ES256K
(secp256k1), EdDSA (Ed25519)}`, `kid` a resolvable key identifier. A verifier MUST
bind the key's curve to `alg` per RFC 7518.

### 4.1 Extension object shape

Both on the `PaymentRequired` advertisement (§3.3) and the `SettlementResponse`,
the `extensions["action-receipt"]` object **MUST** carry `info` and, per core
§5.1.2, a `schema` (§7). The `schema` is required, not optional.

### 4.2 Receipt payload (the JWS payload)

The schema is **closed**: a verifier MUST reject a payload carrying any field not
listed here, or any `action` field not in §4.3. (This deliberately deviates from
base §2's "ignore unknown fields" for the *signed payload* — it keeps the canonical
numeric domain small and the content address unambiguous; wire-envelope tolerance
is unaffected.) `version` is `1`, scoped to the `action-receipt` key (independent
of base offer-receipt versioning).

| Field | Type | Required | Description |
|---|---|---|---|
| `version` | number | Yes | `1`. Integer. Reject any other value |
| `network` | string | Yes | CAIP-2 network id. The server MUST emit CAIP-2 (convert v1 human-readable names) |
| `resourceUrl` | string | Yes | The paid resource URL |
| `payer` | string | Yes | Payer identifier |
| `payTo` | string | Yes | Recipient; an authorization anchor for the signer (§5.8) |
| `issuedAt` | number | Yes | Unix seconds. Integer in `[0, 2^53)` |
| `transaction` | string | Yes | On-chain settlement tx hash; `""` when the scheme has none |
| `settlementRef` | string | Yes | Non-tx settlement identifier (voucher / channel receipt / **batch root** / ledger ref); introduced by this profile (§5.9), not a core field; `""` when a `transaction` is used |
| `settlementStatus` | string | Yes | Payment lifecycle: `settled`, `capturePending`, `reversed`, `refunded` (§4.5) |
| `action` | object | Yes | `{ agent, actionType, scope, outcome }` (§4.3) |
| `actionRef` | string | Yes | base64url( SHA-256( JCS(action-tuple) ) ) (§4.4) |

At least one of `transaction` / `settlementRef` MUST be non-empty (§5.2). Both are
always-present strings so the schema stays fixed-shape.

### 4.3 The `action` object (SERVICE delivery)

| Field | Required | Description |
|---|---|---|
| `agent` | Yes | Identifier of the acting agent (e.g. a DID) |
| `actionType` | Yes | What was done (e.g. `inference.completion`) |
| `scope` | Yes | The authorization scope the action claims to fall within |
| `outcome` | Yes | One of `delivered`, `refused`, `partial`, `disputed` |

`outcome` concerns **service delivery** and is independent of whether payment
settled — that is `settlementStatus` (§4.5). A signed `outcome: refused` ("payment
settled but service not delivered") is a first-class dispute artifact.

### 4.4 `actionRef` — the recomputable content address

```
action-tuple = { agent, actionType, scope, outcome,      # from action{}
                 resourceUrl, transaction, settlementRef,
                 settlementStatus, issuedAt,
                 network, payer, payTo, version }          # from the payload root
actionRef    = base64url( SHA-256( JCS(action-tuple) ) )
```

Who / what / scope / outcome / where / which-settlement (both identifiers) /
lifecycle / when / on-what-network / from-whom / to-whom / schema-version. The tuple
is **complete** — it commits every semantically load-bearing field — so `actionRef` is
a full content address and a safe replay-dedup key (§9): distinct receipts (e.g. the
same `transaction` reused across two networks) do not collide. JCS over the
*structured* tuple means one canonical byte string per logical tuple, so `actionRef`
recomputes deterministically (the property #2648 found missing from #2332). Because the
schema is closed and every field is a string or an integer in `[0, 2^53)`, no
float/big-integer canonicalization corner arises.

### 4.5 `settlementStatus` — the payment lifecycle (auth-capture, refunds)

`settled` (funds captured), `capturePending` (resource delivered under
auth-capture, capture not yet landed), `reversed` (authorization voided),
`refunded` (captured then returned). This is **separate** from `outcome` so a
reversal does not silently invalidate a truthful delivery attestation. Timing
guidance: issue the receipt at capture with `settled`; or at delivery with
`capturePending`, then issue a superseding receipt binding the capture identifier
when it lands. A `reversed`/`refunded` receipt is a valid, signed record of that
state.

## 5. Verification (offline; normative)

Holding the receipt and the `SettlementResponse` (core §5.3), with no network
beyond resolving `kid` to a key, a verifier MUST perform the following in order,
rejecting on the first failure, and MUST NOT raise on malformed input (any
unexpected shape is a §5.2 rejection):

- **§5.1 Envelope.** `format=="jws"`; three-part compact signature; header decodes
  to an object; `alg ∈ {ES256, ES256K, EdDSA}`; `kid` a string.
- **§5.2 Circularity + closed schema.** Reject if a `signature` field appears in
  the payload or its `action`. Then reject unless the payload satisfies §4.2/§4.3
  (unknown/missing fields, wrong types, `issuedAt` out of range, **neither
  settlement identifier present**).
- **§5.3 Version.** Reject unless `version == 1`.
- **§5.4 Enums.** Reject unless `action.outcome ∈` §4.3 and `settlementStatus ∈` §4.5.
- **§5.5 Canonicalization.** Base64url-decode the JWS payload; reject unless those
  bytes equal `JCS(payload)`.
- **§5.6 actionRef.** Reject unless `actionRef == base64url(SHA-256(JCS(action-tuple)))`.
- **§5.7 Signature.** Verify over `base64url(header).base64url(payload)` with the
  key from `kid` (RFC 7515); bind curve to `alg`; for ECDSA reject high-`s`.
- **§5.8 Signer authorization** (base §4.5.1) — **fails closed**, and both anchors are
  **scoped to the resource**. Accept only if `kid` is authorized for `resourceUrl` via
  **either**: (a) the service — a `kid → resourceUrl` binding (registry / DID doc); or
  (b) the recipient — a `(payTo, resourceUrl) → kid` binding. Address-signing (the key
  deriving to the `payTo` address) MAY implement (b), but the derived address MUST also
  be the *expected* recipient for `resourceUrl`: a self-consistent key that merely
  matches a self-chosen `payTo` is NOT authorized, because `payTo` is signer-chosen and
  uncorroborated offline (§9). If no anchor resolves, reject.
- **§5.9 Settlement success.** Reject unless the `SettlementResponse` has
  `success == true` **and** corroborates at least one identifier — the on-chain
  `transaction` (core §5.3 sets it to `""` on failure) or a settlement reference.
  *Note:* core §5.3 defines no `settlementRef` field. `settlementRef` is introduced by
  **this profile** as the receipt-side name for a scheme's non-tx settlement identifier
  — e.g. the batch-settlement scheme's *commitment identifier*
  (`scheme_batch_settlement.md`). A verifier obtains its value from the scheme-specific
  settlement result (or `SettlementResponse.extensions`); this profile assumes no
  standardized response field name.
- **§5.10 Settlement binding.** Every identifier the `SettlementResponse` provides MUST
  equal the receipt's corresponding field, **and the receipt MUST NOT carry an
  identifier the response does not corroborate** — otherwise an unverified `transaction`
  or `settlementRef` would ride into `actionRef`. §5.9 guarantees the response provides
  at least one. Additionally reject if the response carries `network` in CAIP-2 form
  differing from `payload.network`, or carries `payer` differing from `payload.payer`.
  (In core §5.3 `network` is Required and `payer` Optional; v1 networks are
  human-readable, so these bind only when the response carries them comparably; the
  settlement identifier is the required join key.)
- **§5.11 Freshness.** Reject if `issuedAt` is outside policy (default `now −
  issuedAt ∈ [-60s, maxAge]`).

All pass → a tamper-evident, operator-independent **attestation** that the signer
states `agent` performed `actionType` within `scope` at `resourceUrl`, reaching
`outcome`, bound to that settlement at lifecycle `settlementStatus`. Binary verdict.
(It proves the *signer's statement* is authentic, settlement-bound, and unmodified;
trust in the underlying work derives from §5.8 authorization — see §9.)

### 5.12 Reject-reason codes (x402 error taxonomy)

Following core §9 and the SIWX `invalid_<ext>_<check>` convention:

| Check | Reason code |
|---|---|
| §5.1 alg allow-list | `invalid_actionreceipt_alg` |
| §5.2 schema / type / envelope-structural | `invalid_payload` |
| §5.2 circularity | `invalid_actionreceipt_circularity` |
| §5.3 version | `invalid_actionreceipt_version` |
| §5.4 outcome | `invalid_actionreceipt_outcome` |
| §5.4 settlementStatus | `invalid_actionreceipt_status` |
| §5.5 canonicalization | `invalid_actionreceipt_canonicalization` |
| §5.6 actionRef | `invalid_actionreceipt_actionref` |
| §5.7 signature | `invalid_actionreceipt_signature` |
| §5.8 authorization | `invalid_actionreceipt_signer` |
| §5.9 settlement success | `invalid_transaction_state` |
| §5.10 binding | `invalid_actionreceipt_settlement_mismatch` |
| §5.11 freshness | `invalid_actionreceipt_freshness` |

## 6. Conformance

Conformant iff PASS on every positive vector and REJECT — with the §5.12 reason —
on every negative in `vectors/`. The suite is two-sided, exercises every reject reason
code (§5.12) across matched negatives, and asserts it observed both verdicts and left
no reason code uncovered (`VECTORS.md`). Coverage is tracked at reason-code
granularity; the vector set additionally includes negatives for the individual
structural, signature, and settlement-binding sub-checks behind each code.

## 7. Wire example and schema

`SettlementResponse` (core §5.3) with an action-bound receipt (`signature`
abbreviated; `vectors/pos_es256_valid.json` is a complete instance):

```json
{
  "success": true,
  "transaction": "0xabab…abab",
  "network": "eip155:8453",
  "payer": "0x857b…6b66",
  "extensions": {
    "action-receipt": {
      "info": { "receipt": { "format": "jws", "signature": "eyJ…hdr.eyJ…payload.sig" } },
      "schema": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {
          "receipt": {
            "type": "object",
            "properties": {
              "format": { "type": "string", "const": "jws" },
              "signature": { "type": "string", "description": "JWS compact; payload = the closed-schema receipt payload of §4.2" }
            },
            "required": ["format", "signature"]
          }
        },
        "required": ["receipt"]
      }
    }
  }
}
```

The decoded JWS payload conforms to §4.2 (fields `version:1`, …, `transaction`,
`settlementRef`, `settlementStatus`, `action`, `actionRef`). The `PaymentRequired`
advertisement (§3.3) carries the same `{info, schema}` with a static `info`.

## 8. Privacy considerations

Not privacy-minimal by design: `transaction`/`settlementRef` and `action`/`scope`
increase correlation. Use where accountability is the goal; use base's minimal
receipt where it is not. `agent`/`scope` SHOULD be pseudonymous where possible.

## 9. Security considerations

Inherits base §10. Additionally:

- **Attestation, not proof of work.** A valid receipt authenticates the signer's
  statement and binds it to a successful settlement; it does not independently prove
  the work occurred. Trust in `outcome` rests on §5.8 authorization.
- **Fail-closed authorization** (§5.8); **settlement success checked** (§5.9);
  **determinism** via canonicalization (§5.5), the closed numeric domain (§4.4), and
  low-`s` ECDSA (§5.7).
- **Receipt-presentation replay (residual).** A receipt is a bearer artifact; within
  the freshness window an attacker can present the same valid receipt repeatedly and
  every offline verification PASSes. A verifier SHOULD maintain a seen-set keyed by
  `actionRef` (and, where present, a bound payment nonce) to detect re-presentation;
  a stateless offline verifier cannot enforce this. Binding a payment nonce (future
  work) tightens *what* a receipt attests, not *how often* it may be shown.
- **`payTo` is unbound offline; no `amount` is committed.** Core §5.3 carries no
  `payTo`, so §5.10 cannot cross-check the receipt's `payTo`; the receipt commits no
  `amount` field at all. Downstream MUST NOT treat receipt `payTo` (or any amount) as
  settled fact without on-chain resolution of the settlement identifier.
- **Key resolution/revocation.** x402 defines no canonical `kid`→key resolution; this
  profile's default is `did:web` HTTPS resolution (deployments MAY substitute). An
  offline verifier cannot detect a key revoked after `issuedAt`.
- Transport security (HTTPS) remains essential; a valid signature is sufficient for
  verification (base §10). Where response integrity beyond the receipt body matters,
  `http-message-signatures` (RFC 9421) SHOULD sign the enclosing response to prevent
  extension stripping/downgrade (future work).

## 10. Scope and follow-ups

- **EIP-712 format** and **`payTo` address-recovery** (deriving the EVM address from a
  secp256k1 key to satisfy §5.8(a) cryptographically) are deferred together — both
  need secp256k1 EVM-address derivation. The reference verifier implements §5.8 via
  the authorization registry (both the service and `payTo` anchors) and defers
  address-recovery. A follow-up adds a `version:1` EIP-712 `Receipt` type extending
  base §5.3 with the `action`/settlement fields.
- **Anchoring** (`actionRef` to Sigstore Rekor / on-chain / Bitcoin per #2740),
  **payment-nonce binding** (EIP-3009 nonce / `payment-identifier` id), and **RFC 9421
  response signing** are optional hardenings tracked in `SE-REQUIREMENTS-PASS-2026-07-19.md`.

## 11. Related work

- **#2332** motivates the `action` binding; we adopt its `action_ref`/`payment_hash`
  framing and resolve the canonicalization concern #2648 raised.
- **#2648** converged on RFC 8785 (JCS) over a structured tuple; we follow it and make
  the JCS equality a normative, testable check (§5.5). Position relative to SEP-2828.
- **#2357** proposes `receipt_format` negotiation and a batch root; our `settlementRef`
  accepts a batch root, and this JWS profile is the lightweight, header-safe alternative
  to a STARK receipt (both MAY coexist).
- **#2833 / #2291 / #2299 / #2400** (delivery-receipt countersignature; fulfillment/
  refund states; trust-provider evidence; verified credentials) are complementary; see
  `SE-REQUIREMENTS-PASS-2026-07-19.md` for the interop map.

## 12. Version History

| Version | Date | Changes |
|---|---|---|
| 0.1 | 2026-07-19 | Initial draft (JWS profile). |
| 0.2 | 2026-07-19 | Scheme-general settlement binding (`settlementRef`, batch root); `settlementStatus` lifecycle (auth-capture/refunds); resource-server-signs clarification; PaymentRequired advertisement; `payTo`-anchor authorization; x402 error-taxonomy reason codes; `version` → 1 under own key; A2A/discovery/echo integration. (Repo-level SE pass.) |
| 0.2.1 | 2026-07-19 | Pre-submission superpass hardening: scoped the `payTo` anchor to `(payTo, resourceUrl)` and required address-signing to match the *expected* recipient (closes a payee-attests-any-service gap); reject settlement identifiers the response does not corroborate; `actionRef` now commits `network`/`payer`/`payTo`/`version` (complete content address + safe dedup key); clarified `settlementRef` is profile-introduced, not a core field; corrected `network` as Required (not Optional) in core §5.3; A2A extension-layer clarification; RFC 2119 fixes. |

## References

RFC 8785 (JCS) · RFC 7515 (JWS) · RFC 7518 (JWA) · RFC 9421 (HTTP Message
Signatures) · x402 core §5.1/§5.3/§9 · `specs/extensions/extension-offer-and-receipt.md`
(v0.6) · issues #2332, #2648, #2357, #2740, #2833.
