# Observation: one settlement paid to api.nansen.ai's published address on Base

**This is an observation, not a verification.** Nobody here holds the 402, the
payment payload or the settle answer for this settlement. It is built from
public bytes and it is published as a courtesy: to show what a third party can
establish about someone else's x402 settlement from the chain alone, and where
that stops. It is **not a registry entry** and it is not a grading of anyone.

## What the public bytes establish

On Base (`eip155:8453`), transaction
`0x53865541edfd87cdf1d83e6181f70ffe8e3e970c99ab6b0848d2496c2c731df0` succeeded
(receipt status `0x1`) in block 51,732,006, whose own timestamp is 1790253359 =
2026-09-24T12:35:59Z. Its receipt carries two logs, both emitted by the USDC
contract (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`): a `Transfer` of 50000
atomic units — 0.05 USDC — from `0x6946cf18b64f7c1cc3456f0ede93e1cf767927eb` to
`0x93053f1e7a5efeda532fe69cbbe43cbec3a0f13f`, at log index 145, and an EIP-3009
`AuthorizationUsed` naming `0x6946cf18b64f7c1cc3456f0ede93e1cf767927eb` as the
authorizer and nonce
`0xe5594da224f2036945097c1af4206a798cc71a04e464ed7d8a0846ff1a96833d`, at log
index 144.

The recipient is the `payTo`,
`0x93053f1e7A5eFEDa532Fe69CbbE43cBEc3A0F13f` on `eip155:8453`, of the resource
`https://api.nansen.ai/api/v1/profiler/address/current-balance` in the x402
discovery catalogue Coinbase serves at
`https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources`, **as that
catalogue stood when its page at offset 0 was fetched at
2026-09-10T15:59:51Z**, 3,437,371 bytes, sha256
`0d06754b9a41d7a0d3ca9e012f563af8acdf418592b78ebbbe6de08a01248ae9`. The object
for that resource is item 146 of the page, 4,674 bytes at byte offset 518,303,
sha256 `14812ed3a4d3e788ecfac9c41e9772847d69bf3de6ec8242123f8f500a1e06f4`; it is
in `artefacts/`, cut from the page byte for byte.

PayAI's x402 discovery catalogue, fetched the same day at 2026-09-10T15:46:56Z
(page at offset 0, 1,522,380 bytes, sha256
`0406b5934a94656086583044047b88a47d6582a9b9d9f194e6b173af2e5ff551`), carries for
the same host the Solana `payTo`
`J7ZvJEspvwP1oRxQZ7mYmNmT22NTm3GWq3t7HEbvPZYx` on
`solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp`, and this package does not use it. Its
item 422, the resource `https://api.nansen.ai/api/v1/smart-money/dex-trades`,
1,028 bytes at byte offset 707,064, sha256
`833f1fcb4e5d6fa64d26ae048ac0344eb960477750f0a3cf56888a611b4c3569`, is in
`artefacts/` beside the Coinbase object, cut from its page byte for byte.

The transaction was sent by `0x8f5cb67b49555e614892b7233cfddebfb746e531` to the
USDC contract itself. Its input is 325 bytes and opens with the selector
`0xe3ee160e`,
`transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)`.
The sender is not among the fifteen `eip155:*` signer addresses PayAI published
at `https://facilitator.payai.network/supported` **as that document stood when
it was fetched at 2026-09-18T10:12:56Z**, sha256
`fa7839ec4dfd253e8c7287ea1c9c76a47ad3a20f08e28cc536d22285580cd9c2`. That pin is
in `artefacts/`, and `verdict.json` carries `submitter_not_in_supplied_list`.

The block is a block and not a preconfirmation: the block read at height
51,732,006 carries the block hash the receipt claims for itself,
`0x7d553e567cefd568d55acce68489f53b57fb9f47476f2bba554912932cc3026a`. Two
independently operated endpoints — `https://mainnet.base.org` and
`https://base.drpc.org` — returned the same chain id (`0x2105`), equal receipts
and the same block hash; `chain.json` holds both answers with read times and the
sha256 of each response body.

How it was found is in `artefacts/discovery/`: the script as run, its log of
every JSON-RPC call with the sha256 of each response body, the tip read, and the
three responses of the window that matched. The tip read was block 51,733,351.
Starting 64 blocks behind it and moving back 400 blocks at a time, the script
made two `eth_getLogs` calls per window against USDC, one for topic0
`keccak("AuthorizationUsed(address,bytes32)")` and one for topic0
`keccak("Transfer(address,address,uint256)")` with the payee at `topics[2]`, and
kept the transaction hashes present in both. Blocks 51,732,887 to 51,733,287,
51,732,487 to 51,732,887 and 51,732,087 to 51,732,487 held no `Transfer` to the
payee. Blocks 51,731,687 to 51,732,087 held 9, each in a transaction that also
carried an `AuthorizationUsed`, and this transaction is the newest of the 9. The
three empty windows' responses are in the pin directory, and their digests are
in the scan log; they are not copied into this package.

## Where it stops

**Nothing here says what was bought.** No 402 object, no payment payload and no
settle answer for this settlement is held by anyone in this package. The
resource is unknown, the terms the payee published for it are unknown, and what
the facilitator answered is unknown. `verdict.json` is `UNVERIFIABLE` /
`artefacts_absent` for that reason, and its annotations name the three relations
that did not run — `authorization_signature`,
`authorization_matches_requirements`, `settle_names_authorization` — rather than
omitting them, so nothing here can be read as a pass on the half that was
present. The two catalogue objects each name one resource; they are the source
of the address and of the Solana address not used, not a statement of which
resource this settlement paid for, and the amount is not compared with any
price in either.

**The three limits of this format hold here as on every result of it**, and
`verdict.json` names them in its annotations: `limit_resource_binding`
(`unsigned`): the buyer's EIP-3009 signature covers `{from, to, value,
validAfter, validBefore, nonce}` and not the resource paid for;
`limit_facilitator_identity` (`unsigned_list`): the only statement of who the
facilitator is comes from a list its operator publishes unsigned;
`limit_rpc_trust` (`verifier_choice`): the chain reading comes from endpoints
the verifier chose, and two endpoints agreeing is corroboration, not proof.

**Nothing here identifies anyone.** `0x6946cf18…` paid and `0x93053f1e…` was
paid; who they are is not in these bytes and no inference about either is made
or invited. The address match is a match against what Coinbase's catalogue
listed for an `api.nansen.ai` resource on 10 September, not a finding about who
holds the address, and nothing here says why the host appears in both
catalogues with different addresses. The sender `0x8f5cb67b…` is not in PayAI's
published list; that is the result of one comparison against one unsigned list,
and it says nothing about who sent the transaction. No list published by any
party other than PayAI is compared against here.

**Nothing in the package establishes how the settlement was routed, queued or
batched** beyond what the calldata contains: one transaction to the USDC
contract, carrying one `transferWithAuthorization` call.

## Interests

Interests. The editor of this methodology authors draft-msebenzi-evidence-action, builds Chirindo, an operator-run gate that signs receipts of MCP calls, and maintains receipt-verify, the tool that produces the findings this methodology governs. Those occupy the same ground as the formats graded under it. Independence is not claimed. What is claimed is that every value in a finding recomputes from pinned bytes by anyone with the tool or without it, that every scope is cited to the document that names it, and that text and implementation are scored separately, a rule that came from the author of one of the formats graded. Where a judgment call was made, it is marked as one. This paragraph stands, in these words, at the end of every finding published under this methodology.
