# What this package establishes, and what it does not

**Observation is not the word for this one. This is a verification, and it is bounded.**

## What it establishes

The account `0x13bf013EDb5c8bbA2747b06031bcDbb6C5173F63` signed an EIP-3009
`TransferWithAuthorization` for 1000 atomic units of USDC
(`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`) on Base (`eip155:8453`) to
`0x26D4Ffe98017D2f160E2dAaE9d119e3d8b860AD3`, with no lower time bound, a
`validBefore` of 1788799352 and nonce
`0xaefc5e877ba9c66086f498962ecfc82f85aafb73c5d01146ce945d0461bf53e3`. The
signature in `artefacts/client-x-payment.decoded.json` recovers that address
under the EIP-712 domain the 402 object's own `extra`, `network` and `asset`
members name; the digest is
`0x72c0a7db8ffae09436b7a8d27bbc34af9b3c28abf9377407f9e126d9d1f15429`.

Those terms are the terms the server published in
`artefacts/paid-402-payment-required.decoded.json`, found by equality of the
whole requirement object. The settle answer in
`artefacts/payment-response.decoded.json` names the same payer, the same
network, and transaction
`0x94bfba79903d560e54bf0bf79c347d54d057357fb3389ab9dfd76e44d0bdbdd1`.

That transaction succeeded on Base at block 51,004,854, whose timestamp is
1788799055 = 2026-09-07T16:37:35Z. It carries exactly one USDC `Transfer` from
the payer to the payee for exactly 1000 atomic units, and an `AuthorizationUsed`
naming the same authorizer and the same nonce. The block at that height carries
the block hash the receipt claims. Two independently operated endpoints,
`https://mainnet.base.org` and `https://base.drpc.org`, returned the same chain
id, equal receipts and the same block hash; `chain.json` holds both answers.

`verdict.json` is `VALID` / `verified`.

## What it does not establish

Everything the first package's statement says under this heading applies here
without change: **nothing binds the money to the resource under a signature**
(`limit_resource_binding: "unsigned"`), **nothing establishes who the submitter
is** (`limit_facilitator_identity: "unsigned_list"`), and **an endpoint's answer
is not itself evidence** (`limit_rpc_trust: "verifier_choice"`). They are
`reported_only` rows in this format's coverage block and they are printed on
this VALID result.

**And this package holds the delivered bytes, which is what lets it say
something the other cannot.** `artefacts/paid-receipt.json` is the body of the
paid 200: our own signed market-state receipt, issued at 2026-09-07T16:37:32.817Z
for `XNYS`, `CLOSED`, signed under `key_2026_v1`. It carries **no settlement
member**. No transaction hash, no payer, no nonce, no reference to the payment
at all. So on our side too, the delivered bytes are not bound to the payment by
any signature: a holder of this package can verify that the money moved and can
verify that a receipt was issued, and cannot show from signatures alone that the
one was issued for the other. The only tie between them is that both sit in this
directory and both carry instants three seconds apart.

This is a finding against our own work, not against anyone else's, and it is
recorded here as such. It is tracked as B-81 and is open.

## Interests

Interests. The editor of this methodology authors draft-msebenzi-evidence-action, builds Chirindo, an operator-run gate that signs receipts of MCP calls, and maintains receipt-verify, the tool that produces the findings this methodology governs. Those occupy the same ground as the formats graded under it. Independence is not claimed. What is claimed is that every value in a finding recomputes from pinned bytes by anyone with the tool or without it, that every scope is cited to the document that names it, and that text and implementation are scored separately, a rule that came from the author of one of the formats graded. Where a judgment call was made, it is marked as one. This paragraph stands, in these words, at the end of every finding published under this methodology.
