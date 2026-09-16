// x402.settlement/2 — one test per relation, each with the input that turns it
// red.
//
// The falsifiability statement this file owes. Every relation below is asserted
// twice: once over the real settlement, where it must pass, and once over the
// same envelope with ONE value changed, where it must produce a named verdict
// and a named reason. An assertion that only ever saw the good envelope would
// pass with the relation deleted, and the whole point of this format is that its
// relations are the only thing separating "some money moved" from "this money
// moved for this authorization".
//
// Two of the three envelopes are the 7 September 2026 settlements on Base,
// assembled from the artefacts pinned in cc-output (the 402, the payment payload
// and the settle answer, exactly as the wire carried them) and a chain read taken
// here. The third is somebody else's settlement, chain side only, with all three
// artefacts absent — the case this format has to handle without pretending it
// verified anything. Nothing in this file reaches the network: every chain
// reading is in the fixture.
//
// Three constants that could be pasted wrong are RECOMPUTED instead: the EIP-3009
// typehash and the two event topic0 values. A pasted constant that is wrong makes
// every check under it vacuous, and nothing in a green run would say so.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";
import {
  AUTHORIZATION_USED_SIGNATURE,
  FORMAT,
  TRANSFER_SIGNATURE,
  isEip55Checksummed,
  x402SettlementAdapter,
} from "../src/adapters/x402-settlement.js";
import { encodeType } from "../src/adapters/insight.js";
import { adapterByFormat, detectFormat } from "../src/detect.js";
import { coverageFor } from "../src/coverage.js";
import { jsonResult } from "../src/verdict.js";
import type { VerifyResult } from "../src/types.js";
import { FIX, ROOT } from "./helpers.js";

const SETTLEMENTS = join(FIX, "x402", "settlements");
const ONE = join(SETTLEMENTS, "settlement-2026-09-07-0x46db8fc8.envelope.json");
const TWO = join(SETTLEMENTS, "settlement-2026-09-07-0x94bfba79.envelope.json");
const PAYAI = join(FIX, "x402", "observations", "payai-2026-09-16-0x9ecf68be.envelope.json");

type Doc = Record<string, unknown>;

const load = (p: string): Doc => JSON.parse(readFileSync(p, "utf8")) as Doc;
const bytes = (d: Doc): Buffer => Buffer.from(JSON.stringify(d), "utf8");
const clone = (d: Doc): Doc => JSON.parse(JSON.stringify(d)) as Doc;
const run = (d: Doc, opts = {}): Promise<VerifyResult> => x402SettlementAdapter.verify(bytes(d), opts);

/** `a.b.c` into a cloned document. Returns the clone, so a mutation is one expression. */
function mutate(d: Doc, path: string, value: unknown): Doc {
  const out = clone(d);
  const parts = path.split(".");
  let cur: Record<string, unknown> = out;
  for (const p of parts.slice(0, -1)) cur = cur[p] as Record<string, unknown>;
  cur[parts[parts.length - 1]!] = value;
  return out;
}

const ann = (r: VerifyResult, k: string): string => String(r.annotations?.[k] ?? "(absent)");

describe("x402.settlement/2 — the constants are derived, never pasted", () => {
  it("the EIP-3009 typehash recomputes from the type string", () => {
    const encoded = encodeType("TransferWithAuthorization", {
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    });
    expect(encoded).toBe(
      "TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)",
    );
    // The value the handoff quoted, recomputed rather than trusted. A wrong
    // typehash makes every signature check under it meaningless AND green.
    expect(`0x${bytesToHex(keccak_256(utf8ToBytes(encoded)))}`).toBe(
      "0x7c7c6cdb67a18743f49ec6fa9b35f50d52ed05cbed4cc592e13b44501c1a2267",
    );
  });

  it("both event topic0 values recompute from their signature strings", () => {
    expect(`0x${bytesToHex(keccak_256(utf8ToBytes(TRANSFER_SIGNATURE)))}`).toBe(
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    );
    expect(`0x${bytesToHex(keccak_256(utf8ToBytes(AUTHORIZATION_USED_SIGNATURE)))}`).toBe(
      "0x98de503528ee59b575ef0c0a2576a82497bfc029a5685b209e9ec333479b10a5",
    );
  });

  it("EIP-55 tells the two spellings of one address apart, and calls neither wrong", () => {
    expect(isEip55Checksummed("0x26D4Ffe98017D2f160E2dAaE9d119e3d8b860AD3")).toBe(true);
    // The spelling the day-two chain script compared against. Same address.
    expect(isEip55Checksummed("0x26D4ffe98017D2f160E2dAaE9d119e3d8b860AD3")).toBe(false);
    expect(isEip55Checksummed("0x26d4ffe98017d2f160e2daae9d119e3d8b860ad3")).toBe(false);
  });
});

describe("x402.settlement/2 — detection refuses to guess", () => {
  it("claims an envelope whose schema token and version are both exactly right", () => {
    expect(x402SettlementAdapter.detect?.(bytes(load(ONE)))).toBe(true);
    expect(detectFormat(bytes(load(ONE)))).toEqual({ ok: true, adapter: x402SettlementAdapter });
  });

  it("refuses an envelope with the wrong schema token, the wrong version, or no version", () => {
    expect(x402SettlementAdapter.detect?.(bytes(mutate(load(ONE), "schema", "x402.settlement/1")))).toBe(false);
    expect(x402SettlementAdapter.detect?.(bytes(mutate(load(ONE), "x402Version", 1)))).toBe(false);
    expect(x402SettlementAdapter.detect?.(bytes(mutate(load(ONE), "x402Version", "2")))).toBe(false);
    expect(x402SettlementAdapter.detect?.(Buffer.from("not json", "utf8"))).toBe(false);
  });

  it("no other adapter claims this envelope, so auto-detection is unambiguous", () => {
    const d = detectFormat(bytes(load(ONE)));
    expect(d.ok).toBe(true);
    expect(adapterByFormat("x402")).toBe(x402SettlementAdapter);
    expect(adapterByFormat("x402.settlement/2")).toBe(x402SettlementAdapter);
    expect(adapterByFormat("x402-settlement")).toBe(x402SettlementAdapter);
  });
});

describe("x402.settlement/2 — the two 7 September settlements verify", () => {
  it("settlement one (0x46db8fc8, block 50,998,385) is VALID", async () => {
    const r = await run(load(ONE));
    expect(`${r.verdict}/${r.reason}`).toBe("VALID/verified");
    expect(r.resolvedKey?.kid).toBe("0x13bf013EDb5c8bbA2747b06031bcDbb6C5173F63");
    expect(ann(r, "chain_block_number")).toBe("50998385");
    expect(ann(r, "settlement_instant")).toContain("2026-09-07T13:01:57.000Z");
  });

  it("settlement two (0x94bfba79, block 51,004,854) is VALID", async () => {
    const r = await run(load(TWO));
    expect(`${r.verdict}/${r.reason}`).toBe("VALID/verified");
    expect(ann(r, "chain_block_number")).toBe("51004854");
    expect(ann(r, "settlement_instant")).toContain("2026-09-07T16:37:35.000Z");
  });
});

// ---------------------------------------------------------------------------
// R1 — authorization_signature_recovers_payer
// ---------------------------------------------------------------------------

describe("R1 authorization_signature_recovers_payer", () => {
  it("green: the signature recovers authorization.from under the domain the requirement names", async () => {
    const r = await run(load(ONE));
    expect(ann(r, "authorization_signature")).toContain("recovers authorization.from");
    expect(ann(r, "signature_recovered").toLowerCase()).toBe("0x13bf013edb5c8bba2747b06031bcdbb6c5173f63");
    expect(ann(r, "signature_digest")).toBe("0x59f02188e2b5f903fcb6ee8bac314caa97038d9dc8f1b173703f84c6424493d0");
  });

  it("RED: one flipped byte in the signature is INVALID/signature_invalid, and stops there", async () => {
    const d = load(ONE);
    const sig = ((d["payment_payload"] as Doc)["payload"] as Doc)["signature"] as string;
    const flipped = `${sig.slice(0, -4)}${sig[sig.length - 4] === "0" ? "1" : "0"}${sig.slice(-3)}`;
    const bad = clone(d);
    ((bad["payment_payload"] as Doc)["payload"] as Doc)["signature"] = flipped;
    const r = await run(bad);
    expect(`${r.verdict}/${r.reason}`).toBe("INVALID/signature_invalid");
    expect(r.stoppedAt).toBe("authorization_signature_recovers_payer");
    // INVALID names a key. That is what makes the statement falsifiable by a reader.
    expect(r.resolvedKey).not.toBeUndefined();
  });

  it("RED: the amount changed after signing recovers a different address", async () => {
    const bad = clone(load(ONE));
    ((bad["payment_payload"] as Doc)["payload"] as Doc & { authorization: Doc })["authorization"]["value"] = "999";
    const r = await run(bad);
    expect(`${r.verdict}/${r.reason}`).toBe("INVALID/signature_invalid");
  });

  it("RED: a domain the envelope cannot supply is UNVERIFIABLE/malformed_member, never a guessed digest", async () => {
    const bad = clone(load(ONE));
    delete ((bad["payment_payload"] as Doc)["accepted"] as Doc)["extra"];
    const r = await run(bad);
    expect(`${r.verdict}/${r.reason}`).toBe("UNVERIFIABLE/malformed_member");
    expect(r.detail).toContain("the EIP-712 domain cannot be built");
    expect(r.resolvedKey).toBeUndefined();
  });

  it("RED: a signature that will not parse as 65 bytes is UNVERIFIABLE, not INVALID", async () => {
    const bad = clone(load(ONE));
    ((bad["payment_payload"] as Doc)["payload"] as Doc)["signature"] = "0xdeadbeef";
    const r = await run(bad);
    expect(`${r.verdict}/${r.reason}`).toBe("UNVERIFIABLE/malformed_member");
  });
});

// ---------------------------------------------------------------------------
// R2 — authorization_matches_requirements
// ---------------------------------------------------------------------------

describe("R2 authorization_matches_requirements", () => {
  it("green: to == payTo, value == amount, and the accepted requirement is found in accepts by equality", async () => {
    const r = await run(load(ONE));
    expect(ann(r, "accepted_requirement_index")).toBe("0");
    expect(ann(r, "authorization_matches_requirements")).toContain("to == payTo");
    expect(ann(r, "max_timeout_seconds")).toBe("300");
    expect(ann(r, "authorization_window")).toContain("no lower bound");
  });

  it("green: the checksum spelling is reported and never moves the verdict", async () => {
    const lower = clone(load(ONE));
    const acc = (lower["payment_payload"] as Doc)["accepted"] as Doc;
    const accepts = ((lower["payment_required"] as Doc)["accepts"] as Doc[])[0]!;
    acc["payTo"] = (acc["payTo"] as string).toLowerCase();
    accepts["payTo"] = (accepts["payTo"] as string).toLowerCase();
    const r = await run(lower);
    expect(r.verdict).toBe("VALID");
    expect(ann(r, "address_checksum_form")).toContain("payTo is NOT in EIP-55 checksum form");
    expect(ann(r, "address_checksum_form")).toContain("never a verdict");
  });

  it("RED: the money going somewhere the 402 did not ask for is INVALID/content_commitment_mismatch", async () => {
    const bad = clone(load(ONE));
    const acc = (bad["payment_payload"] as Doc)["accepted"] as Doc;
    const accepts = ((bad["payment_required"] as Doc)["accepts"] as Doc[])[0]!;
    acc["payTo"] = "0x000000000000000000000000000000000000dEaD";
    accepts["payTo"] = "0x000000000000000000000000000000000000dEaD";
    const r = await run(bad);
    expect(`${r.verdict}/${r.reason}`).toBe("INVALID/content_commitment_mismatch");
    expect(r.stoppedAt).toBe("authorization_matches_requirements");
    expect(r.detail).toContain("is not the accepted payTo");
  });

  it("RED: terms the 402 never published is INVALID, found by equality of the whole object and not by index", async () => {
    const bad = clone(load(ONE));
    ((bad["payment_payload"] as Doc)["accepted"] as Doc)["amount"] = "1000000";
    const r = await run(bad);
    expect(`${r.verdict}/${r.reason}`).toBe("INVALID/content_commitment_mismatch");
    expect(r.detail).toContain("the client paid under terms this 402 did not publish");
  });

  it("green: an accepts array carrying the chosen requirement at index 2 finds it there", async () => {
    const shifted = clone(load(ONE));
    const req = shifted["payment_required"] as Doc;
    const chosen = (req["accepts"] as Doc[])[0]!;
    const decoy = { ...chosen, amount: "2000" };
    const decoy2 = { ...chosen, network: "eip155:84532" };
    req["accepts"] = [decoy, decoy2, chosen];
    const r = await run(shifted);
    expect(r.verdict).toBe("VALID");
    expect(ann(r, "accepted_requirement_index")).toBe("2");
  });
});

// ---------------------------------------------------------------------------
// R3 — settle_response_names_authorization
// ---------------------------------------------------------------------------

describe("R3 settle_response_names_authorization", () => {
  it("green: the settle answer names the payer, the network and a 32-byte hash", async () => {
    const r = await run(load(ONE));
    expect(ann(r, "settle_names_authorization")).toContain("payer == authorization.from");
    expect(ann(r, "settle_success")).toBe("true");
    expect(ann(r, "settle_response_signed")).toContain("no signature member");
  });

  it("green: success:false with errorReason settlement_pending is carried, and the chain still decides", async () => {
    const pending = clone(load(ONE));
    const resp = pending["payment_response"] as Doc;
    resp["success"] = false;
    resp["errorReason"] = "settlement_pending";
    const r = await run(pending);
    expect(r.verdict).toBe("VALID");
    expect(ann(r, "settle_error_reason")).toBe("settlement_pending");
    expect(ann(r, "settle_error_reason_note")).toContain("unresolved, not failed");
  });

  it("RED: a settle answer naming a different payer is INVALID/content_commitment_mismatch", async () => {
    const bad = mutate(load(ONE), "payment_response.payer", "0x000000000000000000000000000000000000dEaD");
    const r = await run(bad);
    expect(`${r.verdict}/${r.reason}`).toBe("INVALID/content_commitment_mismatch");
    expect(r.stoppedAt).toBe("settle_response_names_authorization");
  });

  it("RED: a settle answer naming a different network is INVALID", async () => {
    const bad = mutate(load(ONE), "payment_response.network", "eip155:1");
    const r = await run(bad);
    expect(`${r.verdict}/${r.reason}`).toBe("INVALID/content_commitment_mismatch");
  });

  it("RED: a transaction that is not a 32-byte hash is UNVERIFIABLE/malformed_member", async () => {
    const bad = mutate(load(ONE), "payment_response.transaction", "");
    const r = await run(bad);
    expect(`${r.verdict}/${r.reason}`).toBe("UNVERIFIABLE/malformed_member");
  });
});

// ---------------------------------------------------------------------------
// R4 — chain_transfer_matches_authorization
// ---------------------------------------------------------------------------

describe("R4 chain_transfer_matches_authorization", () => {
  it("green: exactly one USDC Transfer matching the authorization, and an AuthorizationUsed matching it too", async () => {
    const r = await run(load(ONE));
    expect(ann(r, "transfer_logs")).toBe("1");
    expect(ann(r, "chain_transfer_matches_authorization")).toContain("from, to and value all equal");
    expect(ann(r, "authorization_used_matches")).toContain("authorizer and nonce both equal");
    // Whether USDC on Base emits AuthorizationUsed is established HERE, by the
    // pinned receipt, not by a sentence in a comment.
    expect(ann(r, "authorization_used")).toContain("authorizer 0x13bf013edb5c8bba2747b06031bcdbb6c5173f63");
  });

  it("RED: a receipt whose Transfer moved a different amount is INVALID/chain_contradicts_artefacts", async () => {
    const bad = clone(load(ONE));
    const logs = ((bad["chain"] as Doc)["receipt"] as Doc)["logs"] as Doc[];
    const transfer = logs.find((l) => (l["topics"] as string[])[0]!.startsWith("0xddf252ad"))!;
    transfer["data"] = "0x00000000000000000000000000000000000000000000000000000000000f4240";
    const r = await run(bad);
    expect(`${r.verdict}/${r.reason}`).toBe("INVALID/chain_contradicts_artefacts");
    expect(r.stoppedAt).toBe("chain_transfer_matches_authorization");
    expect(r.detail).toContain("the Transfer moved 1000000");
  });

  it("RED: a reverted transaction is INVALID/chain_contradicts_artefacts", async () => {
    const bad = clone(load(ONE));
    ((bad["chain"] as Doc)["receipt"] as Doc)["status"] = "0x0";
    const r = await run(bad);
    expect(`${r.verdict}/${r.reason}`).toBe("INVALID/chain_contradicts_artefacts");
    expect(ann(r, "chain_status")).toContain("NOT ok");
  });

  it("RED: an AuthorizationUsed naming another nonce is INVALID — a replayed authorization is caught here", async () => {
    const bad = clone(load(ONE));
    const logs = ((bad["chain"] as Doc)["receipt"] as Doc)["logs"] as Doc[];
    const used = logs.find((l) => (l["topics"] as string[])[0]!.startsWith("0x98de5035"))!;
    (used["topics"] as string[])[2] = "0x" + "11".repeat(32);
    const r = await run(bad);
    expect(`${r.verdict}/${r.reason}`).toBe("INVALID/chain_contradicts_artefacts");
    expect(r.detail).toContain("AuthorizationUsed names authorizer");
  });

  it("green: an absent AuthorizationUsed is recorded as absent, never as a failure", async () => {
    const noUsed = clone(load(ONE));
    const receipt = (noUsed["chain"] as Doc)["receipt"] as Doc;
    receipt["logs"] = (receipt["logs"] as Doc[]).filter((l) => !(l["topics"] as string[])[0]!.startsWith("0x98de5035"));
    const r = await run(noUsed);
    expect(r.verdict).toBe("VALID");
    expect(ann(r, "authorization_used")).toContain("absent");
  });

  it("RED: two Transfer logs from the token contract is not one exact settlement", async () => {
    const bad = clone(load(ONE));
    const receipt = (bad["chain"] as Doc)["receipt"] as Doc;
    const logs = receipt["logs"] as Doc[];
    const transfer = logs.find((l) => (l["topics"] as string[])[0]!.startsWith("0xddf252ad"))!;
    receipt["logs"] = [...logs, JSON.parse(JSON.stringify(transfer)) as Doc];
    const r = await run(bad);
    expect(`${r.verdict}/${r.reason}`).toBe("INVALID/chain_contradicts_artefacts");
    expect(r.detail).toContain("2 Transfer logs");
  });
});

// ---------------------------------------------------------------------------
// R5 — block_at_height
// ---------------------------------------------------------------------------

describe("R5 block_at_height", () => {
  it("green: the block at the receipt's height carries the receipt's block hash", async () => {
    const r = await run(load(ONE));
    expect(ann(r, "block_at_height")).toContain("has the receipt's blockHash");
  });

  it("RED: a block whose hash is not the receipt's is INVALID — a preconfirmation is not a block at height", async () => {
    const bad = mutate(load(ONE), "chain.block.hash", "0x" + "ab".repeat(32));
    const r = await run(bad);
    expect(`${r.verdict}/${r.reason}`).toBe("INVALID/chain_contradicts_artefacts");
    expect(r.stoppedAt).toBe("block_at_height");
    expect(r.detail).toContain("a preconfirmation is not a block at height");
  });

  it("RED: a block read at the wrong height is INVALID", async () => {
    const bad = mutate(load(ONE), "chain.block.number", "0x1");
    const r = await run(bad);
    expect(`${r.verdict}/${r.reason}`).toBe("INVALID/chain_contradicts_artefacts");
    expect(r.detail).toContain("the block supplied is number 1");
  });

  it("RED: no block at all is UNVERIFIABLE/malformed_member, not a pass on the transfer alone", async () => {
    const bad = clone(load(ONE));
    delete (bad["chain"] as Doc)["block"];
    const r = await run(bad);
    expect(`${r.verdict}/${r.reason}`).toBe("UNVERIFIABLE/malformed_member");
    expect(r.stoppedAt).toBe("block_at_height");
  });
});

// ---------------------------------------------------------------------------
// R6 — submitter_recorded
// ---------------------------------------------------------------------------

describe("R6 submitter_recorded", () => {
  it("green: the submitter is recorded, and with no list the annotation says so rather than nothing", async () => {
    const r = await run(load(ONE));
    expect(ann(r, "submitter").toLowerCase()).toBe("0x8f5cb67b49555e614892b7233cfddebfb746e531");
    expect(ann(r, "submitter_list")).toBe("no_list_supplied");
  });

  it("green: a supplied list that does not contain the submitter says NOT in the list, and the verdict does not move", async () => {
    const withList = clone(load(ONE));
    withList["known_submitters"] = [
      {
        address: "0xc6699d2aadA6c36Dfea5C248DD70f9CB0235cB63",
        source_url: "https://facilitator.payai.network/supported",
        source_sha256: "67bfe234984ed0237af2ae281d52907ef9abff7b9d1824fa8284fd225387c072",
        fetched_at: "2026-09-10T12:54Z",
      },
    ];
    const r = await run(withList);
    expect(r.verdict).toBe("VALID");
    expect(ann(r, "submitter_list")).toBe("submitter_not_in_supplied_list");
    expect(ann(r, "submitter_list_source")).toContain("a match is not an identification");
  });

  it("green: a list that does contain the submitter still only says it is in a list", async () => {
    const withList = clone(load(ONE));
    withList["known_submitters"] = [
      {
        address: "0x8f5cb67b49555e614892b7233cfddebfb746e531",
        source_url: "https://example.invalid/supported",
        source_sha256: "0".repeat(64),
        fetched_at: "2026-09-16T00:00Z",
      },
    ];
    const r = await run(withList);
    expect(ann(r, "submitter_list")).toBe("submitter_in_supplied_list");
    // Never "facilitator identified".
    expect(JSON.stringify(r.annotations)).not.toContain("facilitator identified");
  });

  it("green: an envelope whose chain data carries no submitter_tx says the submitter was not recorded", async () => {
    const bad = clone(load(ONE));
    delete (bad["chain"] as Doc)["submitter_tx"];
    const r = await run(bad);
    expect(r.verdict).toBe("VALID");
    expect(ann(r, "submitter")).toContain("not recorded");
  });
});

// ---------------------------------------------------------------------------
// the two states that are about what the verifier HOLDS, not about the bytes
// ---------------------------------------------------------------------------

describe("x402.settlement/2 — chain_unavailable and artefacts_absent", () => {
  it("no chain and no --rpc is UNVERIFIABLE/chain_unavailable, and stops at the chain relation", async () => {
    const bad = clone(load(ONE));
    bad["chain"] = null;
    const r = await run(bad);
    expect(`${r.verdict}/${r.reason}`).toBe("UNVERIFIABLE/chain_unavailable");
    expect(r.stoppedAt).toBe("chain_transfer_matches_authorization");
    expect(r.resolvedKey).toBeUndefined();
    const notEvaluated = JSON.parse(jsonResult(r)) as { coverage: { checks_not_evaluated: Array<{ id: string }> } };
    expect(notEvaluated.coverage.checks_not_evaluated.map((c) => c.id)).toContain("block_at_height");
    expect(notEvaluated.coverage.checks_not_evaluated.map((c) => c.id)).toContain("submitter_recorded");
  });

  it("chain data with none of the three artefacts is UNVERIFIABLE/artefacts_absent, with the chain half recorded", async () => {
    const obs = clone(load(ONE));
    obs["payment_required"] = null;
    obs["payment_payload"] = null;
    obs["payment_response"] = null;
    const r = await run(obs);
    expect(`${r.verdict}/${r.reason}`).toBe("UNVERIFIABLE/artefacts_absent");
    expect(r.detail).toContain("an observation of a transfer, not a verification of a purchase");
    // R1 to R3 did not run, and each says so by name rather than being absent.
    expect(ann(r, "authorization_signature")).toContain("not_evaluated");
    expect(ann(r, "authorization_matches_requirements")).toContain("not_evaluated");
    expect(ann(r, "settle_names_authorization")).toContain("not_evaluated");
    // R4's chain half, R5 and R6 did run.
    expect(ann(r, "transfer")).toContain("1000 atomic units");
    expect(ann(r, "chain_compared_to_authorization")).toContain("recorded and not compared");
    expect(ann(r, "block_at_height")).toContain("has the receipt's blockHash");
    expect(ann(r, "submitter").toLowerCase()).toBe("0x8f5cb67b49555e614892b7233cfddebfb746e531");
  });

  it("an envelope with neither artefacts nor chain establishes nothing and says so", async () => {
    const empty = {
      schema: FORMAT,
      x402Version: 2,
      payment_required: null,
      payment_payload: null,
      payment_response: null,
      chain: null,
      known_submitters: null,
    };
    const r = await run(empty as Doc);
    expect(`${r.verdict}/${r.reason}`).toBe("UNVERIFIABLE/malformed_receipt");
    expect(r.stoppedAt).toBe("envelope_shape");
  });

  it("a duplicate member name is refused before any value from the document is read", async () => {
    const text = readFileSync(ONE, "utf8").replace('"x402Version": 2,', '"x402Version": 2,\n  "x402Version": 3,');
    const r = await x402SettlementAdapter.verify(Buffer.from(text, "utf8"), {});
    expect(`${r.verdict}/${r.reason}`).toBe("UNVERIFIABLE/malformed_member");
    expect(r.detail).toContain("duplicate member name");
  });
});

// ---------------------------------------------------------------------------
// the observation case over a real third-party settlement: a batched
// transaction submitted through Multicall, with no artefacts at all
// ---------------------------------------------------------------------------

describe("x402.settlement/2 — a chain-side observation of someone else's settlement", () => {
  it("is UNVERIFIABLE/artefacts_absent, with the chain half recorded and the three relations that did not run named", async () => {
    const r = await run(load(PAYAI));
    expect(`${r.verdict}/${r.reason}`).toBe("UNVERIFIABLE/artefacts_absent");
    expect(r.resolvedKey).toBeUndefined();
    expect(ann(r, "authorization_signature")).toContain("not_evaluated");
    expect(ann(r, "authorization_matches_requirements")).toContain("not_evaluated");
    expect(ann(r, "settle_names_authorization")).toContain("not_evaluated");
    expect(ann(r, "chain_block_number")).toBe("51382192");
    expect(ann(r, "settlement_instant")).toContain("2026-09-16T10:15:31.000Z");
    expect(ann(r, "transfer")).toContain("100000 atomic units");
    expect(ann(r, "authorization_used")).toContain("0xf214f06bdbc8dc3e48f73b6596879e01957b9c20cf0513fab6dcf464a15e19e3");
    expect(ann(r, "block_at_height")).toContain("has the receipt's blockHash");
  });

  it("the submitter is in the supplied list, and the annotation still refuses to call that an identification", async () => {
    const r = await run(load(PAYAI));
    expect(ann(r, "submitter").toLowerCase()).toBe("0xb2bd29925cbbcea7628279c91945ca5b98bf371b");
    expect(ann(r, "submitter_list")).toBe("submitter_in_supplied_list");
    expect(ann(r, "submitter_list_source")).toContain("15 addresses");
    expect(ann(r, "submitter_list_source")).toContain("a match is not an identification");
  });

  // THE CONTROL FOR THE TOKEN-CONTRACT RULE, and the reason it exists.
  //
  // This transaction's `to` is Multicall3 (0xca11bde0...), not USDC: the
  // facilitator batches. An earlier version of this adapter read the token
  // contract off the transaction's `to` when no accepted requirement was
  // present, which on these exact bytes found ZERO Transfer logs and reported,
  // with conviction, that a settlement carrying one plainly visible transfer
  // carried none. The token is now taken from the contract that emitted
  // AuthorizationUsed, which is EIP-3009's own event.
  it("takes the token from the AuthorizationUsed emitter, not from a batching transaction's own `to`", async () => {
    const r = await run(load(PAYAI));
    expect(ann(r, "transaction_to").toLowerCase()).toBe("0xca11bde05977b3631167028862be2a173976ca11");
    expect(ann(r, "token_contract").toLowerCase()).toContain("0x833589fcd6edb6e08f4c7c32d4f71b54bda02913");
    expect(ann(r, "token_contract")).toContain("EIP-3009's own event");
    expect(ann(r, "transfer_logs")).toBe("1");
  });

  it("RED: with no AuthorizationUsed and no requirement, nothing names the token and the relation says so", async () => {
    const bad = clone(load(PAYAI));
    const receipt = (bad["chain"] as Doc)["receipt"] as Doc;
    receipt["logs"] = (receipt["logs"] as Doc[]).filter((l) => !(l["topics"] as string[])[0]!.startsWith("0x98de5035"));
    const r = await run(bad);
    expect(ann(r, "token_contract")).toContain("not determined");
    // Every Transfer in the transaction is then in scope, and with no
    // authorization to pick one out the annotation lists them rather than
    // choosing. This one carries exactly one, so it still resolves.
    expect(r.reason).toBe("artefacts_absent");
  });

  it("an observation whose receipt carries no transfer at all is a contradiction, not a quiet pass", async () => {
    const bad = clone(load(PAYAI));
    const receipt = (bad["chain"] as Doc)["receipt"] as Doc;
    receipt["logs"] = (receipt["logs"] as Doc[]).filter((l) => !(l["topics"] as string[])[0]!.startsWith("0xddf252ad"));
    const r = await run(bad);
    expect(`${r.verdict}/${r.reason}`).toBe("UNVERIFIABLE/malformed_member");
    expect(r.detail).toContain("no money moved that these bytes can point at");
    // No payload is present, so there is no key to name and this must not be an
    // INVALID: what disagrees is the supplied chain data with itself.
    expect(r.resolvedKey).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// the contract this format shares with every other one
// ---------------------------------------------------------------------------

describe("x402.settlement/2 — the tri-state contract holds", () => {
  it("resolved_key is null exactly when the verdict is UNVERIFIABLE", async () => {
    const cases: Doc[] = [
      load(ONE),
      load(TWO),
      mutate(load(ONE), "payment_response.payer", "0x000000000000000000000000000000000000dEaD"),
      mutate(load(ONE), "chain.block.hash", "0x" + "ab".repeat(32)),
      { ...clone(load(ONE)), chain: null },
      mutate(load(ONE), "payment_response.transaction", ""),
    ];
    for (const c of cases) {
      const r = await run(c);
      const json = JSON.parse(jsonResult(r)) as { verdict: string; resolved_key: unknown };
      expect(
        json.resolved_key === null,
        `${json.verdict} carried resolved_key ${JSON.stringify(json.resolved_key)}`,
      ).toBe(r.verdict === "UNVERIFIABLE");
    }
  });

  it("the three limits are on every result, whatever the verdict", async () => {
    for (const c of [load(ONE), { ...clone(load(ONE)), chain: null }, mutate(load(ONE), "payment_response.network", "eip155:1")]) {
      const r = await run(c);
      expect(r.annotations?.["limit_resource_binding"]).toBe("unsigned");
      expect(r.annotations?.["limit_facilitator_identity"]).toBe("unsigned_list");
      expect(r.annotations?.["limit_rpc_trust"]).toBe("verifier_choice");
      expect(r.detail).toContain("three limits travel with every result");
    }
  });

  it("every relation has a coverage row, and the three limits are reported_only rows", () => {
    const cov = coverageFor(FORMAT);
    expect(cov, `no coverage manifest for ${FORMAT}`).toBeDefined();
    const ids = cov!.checks.map((c) => c.id);
    for (const id of [
      "envelope_shape",
      "authorization_signature_recovers_payer",
      "authorization_matches_requirements",
      "settle_response_names_authorization",
      "chain_transfer_matches_authorization",
      "block_at_height",
      "submitter_recorded",
    ]) {
      expect(ids, `${id} has no row in the coverage manifest`).toContain(id);
    }
    for (const id of ["resource_binding", "facilitator_identity", "rpc_trust"]) {
      const row = cov!.checks.find((c) => c.id === id);
      expect(row?.status, `${id} must be reported_only`).toBe("reported_only");
      expect(row?.note ?? "", `${id} must carry its one-sentence limit`).not.toBe("");
    }
    // Dense, 1-based, as `DeclaredCheck.order` says.
    expect(cov!.checks.map((c) => c.order)).toEqual(cov!.checks.map((_, i) => i + 1));
  });

  it("the README carries Format 5 with the three limits and the verdict mapping", () => {
    const readme = readFileSync(join(ROOT, "README.md"), "utf8");
    expect(readme).toContain("## Format 5 — `x402.settlement/2`");
    for (const token of ["limit_resource_binding", "limit_facilitator_identity", "limit_rpc_trust"]) {
      expect(readme, `the README does not name ${token}`).toContain(token);
    }
    expect(readme).toContain("chain_contradicts_artefacts");
    expect(readme).toContain("artefacts_absent");
    expect(readme).toContain("chain_unavailable");
  });
});
