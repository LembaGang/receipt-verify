# Observation: one settlement paid to agents.chain.link's published address on Base

**This is an observation, not a verification.** Nobody here holds the 402, the
payment payload or the settle answer for this settlement. It is built from
public bytes and it is published as a courtesy: to show what a third party can
establish about someone else's x402 settlement from the chain alone, and where
that stops. It is **not a registry entry** and it is not a grading of anyone.

## What the public bytes establish

On Base (`eip155:8453`), transaction
`0x8fa8f7a026a6bd352cac97ab4ba3ca5ee0556799efc4556b2b861e4aa6f18c54` succeeded
(receipt status `0x1`) in block 51,733,029, whose own timestamp is 1790255405 =
2026-09-24T13:10:05Z. Its receipt carries two logs, both emitted by the USDC
contract (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`): a `Transfer` of 10000
atomic units — 0.01 USDC — from `0xcfa370b01125f985ca1be78bfda9fd790b3da8dc` to
`0x158e90dd58fbe897ed8c244f472febee37283d00`, at log index 899, and an EIP-3009
`AuthorizationUsed` naming `0xcfa370b01125f985ca1be78bfda9fd790b3da8dc` as the
authorizer and nonce
`0x4d2e715a021a57a925f5b84a6846def287e070e3681bf3e7db6213725e26c63d`, at log
index 898.

The recipient is the `payTo`,
`0x158e90DD58FbE897ED8c244f472Febee37283d00` on `eip155:8453`, of the resource
`https://agents.chain.link/v1/operations/:workflowName` in the x402 discovery
catalogue Coinbase serves at
`https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources`, **as that
catalogue stood when its page at offset 1000 was fetched at
2026-09-10T15:59:55Z**, 3,797,936 bytes, sha256
`595a858cf588eee106ec36a52494596ac35c5fb383a30241af1374daa4342422`. The object
for that resource is item 201 of the page, 2,013 bytes at byte offset 679,837,
sha256 `0147434c56daea28304f29b66aa532f30457e6bec28928543de000c90831b3fd`; it is
in `artefacts/`, cut from the page byte for byte.

The transaction was sent by `0xb87e1a2cc2b4643f2892768e80e41167f17c5860` to the
USDC contract itself. Its input is 325 bytes and opens with the selector
`0xe3ee160e`,
`transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)`.
The sender is not among the fifteen `eip155:*` signer addresses PayAI published
at `https://facilitator.payai.network/supported` **as that document stood when
it was fetched at 2026-09-18T10:12:56Z**, sha256
`fa7839ec4dfd253e8c7287ea1c9c76a47ad3a20f08e28cc536d22285580cd9c2`. That pin is
in `artefacts/`, and `verdict.json` carries `submitter_not_in_supplied_list`.

The block is a block and not a preconfirmation: the block read at height
51,733,029 carries the block hash the receipt claims for itself,
`0x83ad8877c5761fce413a0627cce6944c928822dfe6becc3f7bec8d8030cfa255`. Two
independently operated endpoints — `https://mainnet.base.org` and
`https://base.drpc.org` — returned the same chain id (`0x2105`), equal receipts
and the same block hash; `chain.json` holds both answers with read times and the
sha256 of each response body.

How it was found is in `artefacts/discovery/`: the script as run, its log of
every JSON-RPC call with the sha256 of each response body, the tip read, and the
three responses of the window that matched. The tip read was block 51,733,100.
Starting 64 blocks behind it, the script made two `eth_getLogs` calls against
USDC over blocks 51,732,636 to 51,733,036, one for topic0
`keccak("AuthorizationUsed(address,bytes32)")` and one for topic0
`keccak("Transfer(address,address,uint256)")` with the payee at `topics[2]`, and
kept the transaction hashes present in both. That first window held 15
`Transfer` logs to the payee, each in a transaction that also carried an
`AuthorizationUsed`, and this transaction is the newest of the 15.

## Where it stops

**Nothing here says what was bought.** No 402 object, no payment payload and no
settle answer for this settlement is held by anyone in this package. The
resource is unknown, the terms the payee published for it are unknown, and what
the facilitator answered is unknown. `verdict.json` is `UNVERIFIABLE` /
`artefacts_absent` for that reason, and its annotations name the three relations
that did not run — `authorization_signature`,
`authorization_matches_requirements`, `settle_names_authorization` — rather than
omitting them, so nothing here can be read as a pass on the half that was
present. The catalogue object names one resource paying to this address; it is
the source of the address and not a statement of which resource this settlement
paid for, and the amount is not compared with any price in it.

**The three limits of this format hold here as on every result of it**, and
`verdict.json` names them in its annotations: `limit_resource_binding`
(`unsigned`): the buyer's EIP-3009 signature covers `{from, to, value,
validAfter, validBefore, nonce}` and not the resource paid for;
`limit_facilitator_identity` (`unsigned_list`): the only statement of who the
facilitator is comes from a list its operator publishes unsigned;
`limit_rpc_trust` (`verifier_choice`): the chain reading comes from endpoints
the verifier chose, and two endpoints agreeing is corroboration, not proof.

**Nothing here identifies anyone.** `0xcfa370b0…` paid and `0x158e90dd…` was
paid; who they are is not in these bytes and no inference about either is made
or invited. The address match is a match against what Coinbase's catalogue
listed for an `agents.chain.link` resource on 10 September, not a finding about
who holds the address. The sender `0xb87e1a2c…` is not in PayAI's published
list; that is the result of one comparison against one unsigned list, and it
says nothing about who sent the transaction. No list published by any party
other than PayAI is compared against here.

**Nothing in the package establishes how the settlement was routed, queued or
batched** beyond what the calldata contains: one transaction to the USDC
contract, carrying one `transferWithAuthorization` call.

## Interests

Interests. The editor of this methodology authors draft-msebenzi-evidence-action, builds Chirindo, an operator-run gate that signs receipts of MCP calls, and maintains receipt-verify, the tool that produces the findings this methodology governs. Those occupy the same ground as the formats graded under it. Independence is not claimed. What is claimed is that every value in a finding recomputes from pinned bytes by anyone with the tool or without it, that every scope is cited to the document that names it, and that text and implementation are scored separately, a rule that came from the author of one of the formats graded. Where a judgment call was made, it is marked as one. This paragraph stands, in these words, at the end of every finding published under this methodology.
