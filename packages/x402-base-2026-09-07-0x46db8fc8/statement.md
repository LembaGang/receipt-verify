# What this package establishes, and what it does not

**Observation is not the word for this one. This is a verification, and it is bounded.**

## What it establishes

The account `0x13bf013EDb5c8bbA2747b06031bcDbb6C5173F63` signed an EIP-3009
`TransferWithAuthorization` for 1000 atomic units of USDC
(`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`) on Base (`eip155:8453`) to
`0x26D4Ffe98017D2f160E2dAaE9d119e3d8b860AD3`, with no lower time bound and a
`validBefore` of 1788786415 and nonce
`0x659c3a383834f73215f94856e7afea2abf25bcba6ad67a5892a52176423161af`. The
signature in `artefacts/paid-client-x-payment.decoded.json` recovers that
address under the EIP-712 domain the 402 object's own `extra`, `network` and
`asset` members name, and the recovery is reproducible by anyone from the bytes
in `artefacts/`: the digest is
`0x59f02188e2b5f903fcb6ee8bac314caa97038d9dc8f1b173703f84c6424493d0`.

Those terms are the terms the server published. The 402 object in
`artefacts/paid-pr-header-decoded.json` offers exactly that payee, asset,
network and amount, and the requirement the payload says it accepted is that
object and not an index into it. The server's settle answer in
`artefacts/paid-payment-response.decoded.json` names the same payer, the same
network, and transaction
`0x46db8fc8cfd79017375d76c5ad80256950f8437ff009ecbe90b6cd5ce97e9263`.

That transaction succeeded on Base at block 50,998,385, whose own timestamp is
1788786117 = 2026-09-07T13:01:57Z. It carries exactly one USDC `Transfer` from
the payer to the payee for exactly 1000 atomic units, and an `AuthorizationUsed`
naming the same authorizer and the same nonce, so the transfer is that
authorization being consumed and not a coincidence of amounts. The block at that
height carries the block hash the receipt claims, which is what makes it a block
and not a preconfirmation. Two independently operated endpoints,
`https://mainnet.base.org` and `https://base.drpc.org`, were read minutes apart
and returned the same chain id, equal receipts and the same block hash;
`chain.json` holds both answers with their read times and the sha256 of every
response body. The transaction was submitted by
`0x8f5cb67b49555e614892b7233cfddebfb746e531`.

The verifier's own output, `verdict.json`, is `VALID` / `verified`, with the
resolved key named as the payer's address.

## What it does not establish

**It does not establish what was bought.** In an x402 `exact` settlement on EVM
there is exactly one signature and it covers six values: `from`, `to`, `value`,
`validAfter`, `validBefore`, `nonce`. The resource being paid for is not among
them. The 402 object, the payload's own `resource` and `accepted` members and
the settle answer are all unsigned text sitting beside a signature that does not
cover them. A party able to edit any of them can move which resource a settled
payment appears to be for, and no verifier holding these bytes can tell. That is
`limit_resource_binding: "unsigned"` on every result of this format, including
this VALID one, and `resource_binding` in its coverage block.

**It does not establish who the submitter is.** `0x8f5cb67b…` is recorded
because the chain records it. Nothing here says who operates that address. Where
a facilitator's published signer list is supplied, this tool reports whether the
address is in it and names the list's URL, digest and fetch time; a list is
unsigned, has no validity window, and can change between two reads, so a match
would be a match against a claim, never an identification. No list was supplied
for this package. That is `limit_facilitator_identity: "unsigned_list"`.

**It does not establish that the chain answers are the chain's.** A JSON-RPC
endpoint is a party. What raises its answer above a claim is that the block is at
height and that a second, independently operated endpoint agrees; both were done
and `chain.json` records the method used for the comparison. It remains two
parties rather than one, not zero. That is `limit_rpc_trust:
"verifier_choice"`.

**It does not establish delivery.** Nothing in this package is a receipt of what
the server returned for the money. The paid response for this settlement is not
in these bytes, and even where it is — settlement two of the same day holds it —
it carries no member naming the payment. See that package's statement.

**One more thing the bytes say, recorded because it is easy to miss.** The
header carrying the payment in `artefacts/paid-client-attempt-2.request-headers.txt`
is named `payment-signature`, not `x-payment`. The pinned filenames say
`x-payment`; the request as sent does not. The name of a header is not a
relation this format verifies, and no verdict here turns on it.

## Interests

Interests. The editor of this methodology authors draft-msebenzi-evidence-action, builds Chirindo, an operator-run gate that signs receipts of MCP calls, and maintains receipt-verify, the tool that produces the findings this methodology governs. Those occupy the same ground as the formats graded under it. Independence is not claimed. What is claimed is that every value in a finding recomputes from pinned bytes by anyone with the tool or without it, that every scope is cited to the document that names it, and that text and implementation are scored separately, a rule that came from the author of one of the formats graded. Where a judgment call was made, it is marked as one. This paragraph stands, in these words, at the end of every finding published under this methodology.
