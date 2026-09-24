# Observation: one settlement paid to api.botpay.network's published address on Base

**This is an observation, not a verification.** Nobody here holds the 402, the
payment payload or the settle answer for this settlement. It is built from
public bytes and it is published as a courtesy: to show what a third party can
establish about someone else's x402 settlement from the chain alone, and where
that stops. It is **not a registry entry** and it is not a grading of anyone.

## What the public bytes establish

On Base (`eip155:8453`), transaction
`0xccd5497a6d1aa6b5623db0ae1d9797ff6fda70e8fd78d5ad6625a23fb565968d` succeeded
(receipt status `0x1`) in block 51,731,734, whose own timestamp is 1790252815 =
2026-09-24T12:26:55Z. Its receipt carries two logs, both emitted by the USDC
contract (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`): a `Transfer` of 100000
atomic units — 0.1 USDC — from `0x48f12fef96684338a44eb3ce31954ab469a2633a` to
`0x159be9e316bc5fac8ce05aec4eaae46e8f8a4908`, at log index 347, and an EIP-3009
`AuthorizationUsed` naming `0x48f12fef96684338a44eb3ce31954ab469a2633a` as the
authorizer and nonce
`0x620ee9e25ced3f35d762bd195f93c5e755a4f2f0dcb0a6c204ac0b3054d6838f`, at log
index 346.

The recipient is the address `api.botpay.network` publishes at line 15 of its
`/llms.txt`, "Base recipient for /pay and /go:
0x159BE9e316BC5faC8Ce05aec4eaAe46E8f8a4908", **as that document stood when it
was fetched at 2026-09-10T16:02:31Z**, 1,696 bytes, sha256
`32287dcdeb776e5694c44162c2d32e515cde4518a86f3884441628b89fbbcfb0`. That body is
in `artefacts/`.

The transaction was sent by `0x103040545ac5031a11e8c03dd11324c7333a13c7` to the
USDC contract itself. Its input is 356 bytes and opens with the selector
`0xcf092995`, `transferWithAuthorization`. The sender is not among the fifteen
`eip155:*` signer addresses PayAI published at
`https://facilitator.payai.network/supported` **as that document stood when it
was fetched at 2026-09-18T10:12:56Z**, sha256
`fa7839ec4dfd253e8c7287ea1c9c76a47ad3a20f08e28cc536d22285580cd9c2`. That pin is
in `artefacts/`, and `verdict.json` carries `submitter_not_in_supplied_list`.

The block is a block and not a preconfirmation: the block read at height
51,731,734 carries the block hash the receipt claims for itself,
`0x8c24ff987cfad660df520c00d5dcf1248c7144666b4ef68b3d646f10fd03c345`. Two
independently operated endpoints — `https://mainnet.base.org` and
`https://base.drpc.org` — returned the same chain id (`0x2105`), equal receipts
and the same block hash; `chain.json` holds both answers with read times and the
sha256 of each response body.

How it was found is in `artefacts/discovery/`: the script as run, its log of
every JSON-RPC call with the sha256 of each response body, the tip read, and the
three responses of the window that matched. The tip read was block 51,732,860.
Starting 64 blocks behind it and moving back 400 blocks at a time, the script
made two `eth_getLogs` calls per window against USDC, one for topic0
`keccak("AuthorizationUsed(address,bytes32)")` and one for topic0
`keccak("Transfer(address,address,uint256)")` with the payee at `topics[2]`, and
kept the transaction hashes present in both. Blocks 51,732,396 to 51,732,796
and 51,731,996 to 51,732,396 held no `Transfer` to the payee. Blocks 51,731,596
to 51,731,996 held 66, each in a transaction that also carried an
`AuthorizationUsed`, and this transaction is the newest of the 66. The two empty
windows' responses are in the pin directory, and their digests are in the scan
log; they are not copied into this package.

## Where it stops

**Nothing here says what was bought.** No 402 object, no payment payload and no
settle answer for this settlement is held by anyone in this package. The
resource is unknown, the terms the payee published for it are unknown, and what
the facilitator answered is unknown. `verdict.json` is `UNVERIFIABLE` /
`artefacts_absent` for that reason, and its annotations name the three relations
that did not run — `authorization_signature`,
`authorization_matches_requirements`, `settle_names_authorization` — rather than
omitting them, so nothing here can be read as a pass on the half that was
present. The amount is not compared with any price the seller publishes.

**The three limits of this format hold here as on every result of it**, and
`verdict.json` names them in its annotations: `limit_resource_binding`
(`unsigned`): the buyer's EIP-3009 signature covers `{from, to, value,
validAfter, validBefore, nonce}` and not the resource paid for;
`limit_facilitator_identity` (`unsigned_list`): the only statement of who the
facilitator is comes from a list its operator publishes unsigned;
`limit_rpc_trust` (`verifier_choice`): the chain reading comes from endpoints
the verifier chose, and two endpoints agreeing is corroboration, not proof.

**Nothing here identifies anyone.** `0x48f12fef…` paid and `0x159be9e3…` was
paid; who they are is not in these bytes and no inference about either is made
or invited. The address match is a match against what `api.botpay.network`
published on 10 September, not a finding about who holds the address. The
sender `0x10304054…` is not in PayAI's published list; that is the result of
one comparison against one unsigned list, and it says nothing about who sent the
transaction. The seller's own `/llms.txt`, pinned here, reads at lines 13 and 14
"Default x402 facilitator: Dexter" and "Authenticated orchestration choices:
Dexter, PayAI, Coinbase CDP, BotPay Facilitator"; no list published by any
party other than PayAI is compared against here.

**Nothing in the package establishes how the settlement was routed, queued or
batched** beyond what the calldata contains: one transaction to the USDC
contract, carrying one `transferWithAuthorization` call.

## Interests

Interests. The editor of this methodology authors draft-msebenzi-evidence-action, builds Chirindo, an operator-run gate that signs receipts of MCP calls, and maintains receipt-verify, the tool that produces the findings this methodology governs. Those occupy the same ground as the formats graded under it. Independence is not claimed. What is claimed is that every value in a finding recomputes from pinned bytes by anyone with the tool or without it, that every scope is cited to the document that names it, and that text and implementation are scored separately, a rule that came from the author of one of the formats graded. Where a judgment call was made, it is marked as one. This paragraph stands, in these words, at the end of every finding published under this methodology.
