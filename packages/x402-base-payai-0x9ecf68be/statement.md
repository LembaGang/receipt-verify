# Observation: one PayAI-submitted settlement on Base

**This is an observation, not a verification.** Nobody here holds the 402, the
payment payload or the settle answer for this settlement. It is built from
public bytes and it is published as a courtesy: to show what a third party can
establish about someone else's x402 settlement from the chain alone, and, more
usefully, where that stops. It is **not a registry entry** and it is not a
grading of anyone.

## What the public bytes establish

On Base (`eip155:8453`), transaction
`0x9ecf68be92ca279e6e8874f4ff7bb882da7da05fe8de362967be5ab4d4f6f835` succeeded
in block 51,382,192, whose own timestamp is 1789553731 = 2026-09-16T10:15:31Z.
It carries one USDC (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`) `Transfer` of
100000 atomic units — 0.1 USDC — from
`0xb90c856a2edc4b415140b7ee4e3df875180303a3` to
`0xdb5c2df47e4a6df74edeb6de3159ae38b8cc10fd`, and an EIP-3009
`AuthorizationUsed` from the same contract naming
`0xb90c856a2edc4b415140b7ee4e3df875180303a3` as the authorizer and nonce
`0xf214f06bdbc8dc3e48f73b6596879e01957b9c20cf0513fab6dcf464a15e19e3`. So the
transfer is an authorization being consumed, and that nonce can never be
consumed again on that contract.

The transaction was submitted by
`0xb2bd29925cbbcea7628279c91945ca5b98bf371b`, which is
`0xB2Bd29925CBbCEA7628279c91945Ca5B98bf371B`, the second of the fifteen
`eip155:*` signer addresses PayAI published at
`https://facilitator.payai.network/supported` **as that document stood when it
was fetched at 2026-09-10T12:54Z**, sha256
`67bfe234984ed0237af2ae281d52907ef9abff7b9d1824fa8284fd225387c072`. That pin is
in `artefacts/`. Its transaction went to Multicall3
(`0xca11bde05977b3631167028862be2a173976ca11`), not to the token: this
settlement was batched.

The block is a block and not a preconfirmation: the block read at height
51,382,192 carries the block hash the receipt claims for itself. Two
independently operated endpoints — `https://mainnet.base.org` and
`https://base.gateway.tenderly.co` — returned the same chain id, equal receipts
and the same block hash; `chain.json` holds both answers with read times and the
sha256 of each response body.

How it was found is in `artefacts/discovery/`, in full, because a result whose
method is not checkable is not one: `eth_getLogs` against USDC for topic0
`keccak("AuthorizationUsed(address,bytes32)")` over blocks 51,381,946 to
51,382,346 — a window ending 64 blocks behind the tip at read time — then
`eth_getTransactionByHash` per candidate, newest first, until a sender in the
published set. The discovery response was re-fetched three minutes later and is
byte-identical, 503684 bytes at the same sha256.

## Where it stops

**Nothing here says what was bought.** No 402 object, no payment payload and no
settle answer for this settlement is held by anyone in this package. So: the
resource is unknown, the terms the payee published are unknown, and what the
facilitator answered is unknown. `verdict.json` is `UNVERIFIABLE` /
`artefacts_absent` for exactly that reason, and its annotations name the three
relations that did not run — `authorization_signature`,
`authorization_matches_requirements`, `settle_names_authorization` — rather than
omitting them, so nothing here can be read as a pass on the half that was
present.

**Nothing here identifies anyone.** `0xb90c856a…` paid and `0xdb5c2df4…` was
paid; who they are is not in these bytes and no inference about either is made
or invited. The submitter is in a list PayAI published: the list is unsigned, it
has no validity window, and it can change between two reads, so the match is a
match against a claim fetched at a time and **not an identification**. The
verdict's `submitter_list_source` annotation says so in those words.

**Nothing here would have bound the resource even with the missing artefacts in
hand.** PayAI's own published OpenAPI is in `artefacts/` at
`payai-facilitator-openapi_2026-09-10T1412Z.json`, sha256
`4865bc1c9c0903293807c69aca15d6bb33f6632a9115ed52694d89b887b1ab58`, fetched
2026-09-10T14:12Z. Its `SettleResponse` requires exactly four members —
`success`, `transaction`, `network`, `payer` — with `errorReason` and
`errorMessage` optional. There is **no signature member in that schema**, and
the resource is not among the four. The settle answer is therefore the
facilitator's unsigned word about a payment, and `paymentRequirements.resource`
in the corresponding `SettleRequest` is described there as "The URL being paid
for" — a member of a request, not of anything signed. This is not a defect in
PayAI's implementation. It is the shape of x402 v2 `exact` on EVM: the buyer's
one signature covers `{from, to, value, validAfter, validBefore, nonce}`, and a
facilitator cannot bind what the protocol did not give it to bind.

## Interests

Interests. The editor of this methodology authors draft-msebenzi-evidence-action, builds Chirindo, an operator-run gate that signs receipts of MCP calls, and maintains receipt-verify, the tool that produces the findings this methodology governs. Those occupy the same ground as the formats graded under it. Independence is not claimed. What is claimed is that every value in a finding recomputes from pinned bytes by anyone with the tool or without it, that every scope is cited to the document that names it, and that text and implementation are scored separately, a rule that came from the author of one of the formats graded. Where a judgment call was made, it is marked as one. This paragraph stands, in these words, at the end of every finding published under this methodology.
