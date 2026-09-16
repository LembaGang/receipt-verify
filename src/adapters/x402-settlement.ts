// Adapter: x402.settlement/2.
//
// `x402.settlement/2` is OUR label for a container, not a format anyone
// publishes. x402 v2 defines three objects that pass over the wire during one
// paid call — the 402 payment-required object, the payment payload the client
// sends, and the settle object the server returns — and then the exchange is
// over. Nobody defines what a merchant or a buyer HOLDS afterwards, and nobody
// defines how to check it. The three objects end up in four places (two HTTP
// headers, a response body and a chain), and until they sit in one document
// there is no relation between them to state, let alone to verify.
//
// So the envelope below is this repository's, and it is declared as ours in the
// coverage manifest's first check. What is NOT ours is every relation it makes
// checkable: each one is a fact about bytes someone else signed or a chain
// someone else wrote.
//
// THE THING THIS FORMAT CANNOT ESTABLISH, stated here and on every result.
// In an x402 `exact` settlement on EVM there is exactly one signature, and it
// covers exactly six values:
//
//     TransferWithAuthorization(address from,address to,uint256 value,
//                               uint256 validAfter,uint256 validBefore,
//                               bytes32 nonce)
//
// The resource being paid for is not among them. Neither is the 402 object, the
// payload's own `resource` and `accepted` members, nor anything the facilitator
// answers. A verifier holding all four artefacts can prove that a particular
// account authorized a particular transfer and that the transfer happened; it
// cannot prove what was bought. That is `resource_binding` in the manifest, it
// is `limit_resource_binding: "unsigned"` in the annotations, and it is printed
// on VALID results, where it matters most.
//
// EIP-712 encoding and secp256k1 recovery are reused from src/adapters/insight.ts,
// which writes them from the EIP text rather than taking them from a library. The
// two event topic0 values are derived from their signature strings here, never
// pasted, and the test recomputes the EIP-3009 typehash rather than trusting the
// constant in any comment.

import { keccak_256 } from "@noble/hashes/sha3.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";
import { eip712Digest, parseStrict, recoverAddress, type Eip712Types } from "./insight.js";
import type { Adapter, ResolvedKey, VerifyOptions, VerifyResult } from "../types.js";
import { invalid, unverifiable, valid } from "../verdict.js";

export const FORMAT = "x402.settlement/2";

const hex = (b: Uint8Array): string => `0x${bytesToHex(b)}`;
const topic0 = (signature: string): string => hex(keccak_256(utf8ToBytes(signature)));

/** ERC-20. Derived, so a wrong constant is impossible rather than unlikely. */
export const TRANSFER_SIGNATURE = "Transfer(address,address,uint256)";
/** EIP-3009, emitted by USDC when a TransferWithAuthorization is consumed. */
export const AUTHORIZATION_USED_SIGNATURE = "AuthorizationUsed(address,bytes32)";

/** The one struct an x402 `exact` payment on EVM signs. EIP-3009 section "Specification". */
export const TRANSFER_WITH_AUTHORIZATION_TYPES: Eip712Types = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
};

type Ann = Record<string, string | number | boolean>;

const obj = (v: unknown): Record<string, unknown> | null =>
  v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
const str = (v: unknown): string | null => (typeof v === "string" ? v : null);
const arr = (v: unknown): unknown[] | null => (Array.isArray(v) ? v : null);
const sameAddress = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase();

/** 0x-prefixed, 20 bytes. Case is not part of the identity; `checksummed` reports on it. */
const isAddress = (v: string): boolean => /^0x[0-9a-fA-F]{40}$/.test(v);
const isHash32 = (v: string): boolean => /^0x[0-9a-fA-F]{64}$/.test(v);

/**
 * EIP-55, implemented here so "is this the checksum spelling" can be ANSWERED
 * rather than assumed. It never moves a verdict: two spellings of one address
 * are one address, and refusing a lowercase payee would be refusing a spelling.
 */
export function isEip55Checksummed(address: string): boolean {
  if (!isAddress(address)) return false;
  const body = address.slice(2);
  if (body === body.toLowerCase() || body === body.toUpperCase()) return false;
  const digest = bytesToHex(keccak_256(utf8ToBytes(body.toLowerCase())));
  for (let i = 0; i < 40; i++) {
    const c = body[i]!;
    if (!/[a-fA-F]/.test(c)) continue;
    const up = parseInt(digest[i]!, 16) >= 8;
    if (up !== (c === c.toUpperCase())) return false;
  }
  return true;
}

/** A hex quantity as the JSON-RPC returns it. Null rather than throwing: a value that will not parse is a fact. */
function quantity(v: unknown): bigint | null {
  const s = str(v);
  if (s === null || !/^0x[0-9a-fA-F]+$/.test(s)) return null;
  try {
    return BigInt(s);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// the envelope
// ---------------------------------------------------------------------------

export interface ChainData {
  rpc_url?: string;
  read_at?: string;
  transaction?: string;
  receipt?: Record<string, unknown>;
  block?: Record<string, unknown>;
  submitter_tx?: Record<string, unknown>;
}

export interface Envelope {
  schema: string;
  x402Version: number;
  payment_required: Record<string, unknown> | null;
  payment_payload: Record<string, unknown> | null;
  payment_response: Record<string, unknown> | null;
  chain: ChainData | null;
  known_submitters: Array<Record<string, unknown>> | null;
}

/**
 * Conservative by contract (`Adapter.detect`). Two members must BOTH be exactly
 * right; nothing about the artefacts is inspected, because an envelope whose
 * schema token says something else is not this format however much it looks
 * like one.
 */
export function detect(bytes: Uint8Array): boolean {
  const p = parseStrict(bytes);
  if (!p.ok) return false;
  return p.value["schema"] === FORMAT && p.value["x402Version"] === 2;
}

// ---------------------------------------------------------------------------
// the three limits — one sentence each, in the annotations, the manifest and
// the README. The tokens are stable; the sentences are the `detail` half.
// ---------------------------------------------------------------------------

const LIMITS: Ann = {
  limit_resource_binding: "unsigned",
  limit_facilitator_identity: "unsigned_list",
  limit_rpc_trust: "verifier_choice",
};

/**
 * The `detail` half. It POINTS at coverage rather than restating the three
 * sentences: the sentences live in the manifest (as the `reported_only` rows'
 * notes) and in the README, and a third copy in prose would be the one that
 * drifts. The three tokens are on `annotations` whatever the verdict.
 */
const LIMIT_DETAIL =
  "three limits travel with every result of this format, whatever the verdict: see `coverage` for the " +
  "reported_only rows resource_binding, facilitator_identity and rpc_trust, and the annotations " +
  "limit_resource_binding, limit_facilitator_identity and limit_rpc_trust";

// ---------------------------------------------------------------------------
// R1 — the authorization's signature
// ---------------------------------------------------------------------------

type Relation = { ok: true; ann: Ann } | { ok: false; verdict: "INVALID" | "UNVERIFIABLE"; reason: "signature_invalid" | "content_commitment_mismatch" | "malformed_member"; detail: string; ann: Ann };

function checkSignature(payload: Record<string, unknown>): Relation {
  const ann: Ann = {};
  const a = obj(payload["authorization"]);
  const accepted = obj(payload["accepted"]);
  const signature = str(payload["signature"]);
  if (a === null || signature === null) {
    return { ok: false, verdict: "UNVERIFIABLE", reason: "malformed_member", detail: "payment_payload.payload carries no authorization object or no signature", ann };
  }
  const from = str(a["from"]);
  if (from === null || !isAddress(from)) {
    return { ok: false, verdict: "UNVERIFIABLE", reason: "malformed_member", detail: `authorization.from ${JSON.stringify(a["from"])} is not a 20-byte hex address`, ann };
  }
  // The domain comes out of the requirement the client accepted. Guessing any
  // member of it would make the recovery say nothing: a different domain is a
  // different digest, and a mismatch under a guessed domain is not evidence.
  const extra = accepted === null ? null : obj(accepted["extra"]);
  const network = accepted === null ? null : str(accepted["network"]);
  const asset = accepted === null ? null : str(accepted["asset"]);
  const name = extra === null ? null : str(extra["name"]);
  const version = extra === null ? null : str(extra["version"]);
  const chainId = network === null ? null : chainIdOf(network);
  if (name === null || version === null || chainId === null || asset === null || !isAddress(asset)) {
    return {
      ok: false,
      verdict: "UNVERIFIABLE",
      reason: "malformed_member",
      detail:
        `the EIP-712 domain cannot be built from this envelope: it needs accepted.extra.name, accepted.extra.version, ` +
        `a chain id from accepted.network and accepted.asset, and it has ` +
        `{name: ${JSON.stringify(name)}, version: ${JSON.stringify(version)}, network: ${JSON.stringify(network)}, asset: ${JSON.stringify(asset)}}`,
      ann,
    };
  }
  ann["signature_domain"] = `{name: ${JSON.stringify(name)}, version: ${JSON.stringify(version)}, chainId: ${chainId}, verifyingContract: ${asset}}`;
  ann["signature_primary_type"] = "TransferWithAuthorization";

  let digest: Uint8Array;
  try {
    digest = eip712Digest(
      { name, version, chainId, verifyingContract: asset },
      "TransferWithAuthorization",
      TRANSFER_WITH_AUTHORIZATION_TYPES,
      a,
    );
  } catch (e) {
    return { ok: false, verdict: "UNVERIFIABLE", reason: "malformed_member", detail: `the authorization will not EIP-712 encode: ${(e as Error).message}`, ann };
  }
  ann["signature_digest"] = hex(digest);

  const recovered = recoverAddress(digest, signature);
  if (recovered === null) {
    return { ok: false, verdict: "UNVERIFIABLE", reason: "malformed_member", detail: `the authorization signature will not parse as 65 bytes of r || s || v`, ann };
  }
  ann["signature_recovered"] = recovered;
  if (!sameAddress(recovered, from)) {
    return {
      ok: false,
      verdict: "INVALID",
      reason: "signature_invalid",
      detail: `the authorization signature recovers ${recovered}, and authorization.from is ${from}`,
      ann,
    };
  }
  ann["authorization_signature"] = `recovers authorization.from (${from})`;
  return { ok: true, ann };
}

/** `eip155:8453` -> 8453. The only network form x402 v2 uses on EVM. */
function chainIdOf(network: string): number | null {
  const m = /^eip155:(\d+)$/.exec(network);
  return m === null ? null : Number(m[1]);
}

// ---------------------------------------------------------------------------
// R2 — the authorization against the requirement the client accepted
// ---------------------------------------------------------------------------

function checkRequirements(required: Record<string, unknown>, payload: Record<string, unknown>, capturedAt: number | null): Relation {
  const ann: Ann = {};
  const a = obj(payload["authorization"]);
  const accepted = obj(payload["accepted"]);
  if (a === null || accepted === null) {
    return { ok: false, verdict: "UNVERIFIABLE", reason: "malformed_member", detail: "the payload carries no `accepted` requirement or no authorization", ann };
  }
  const accepts = arr(required["accepts"]);
  if (accepts === null || accepts.length === 0) {
    return { ok: false, verdict: "UNVERIFIABLE", reason: "malformed_member", detail: "payment_required carries no non-empty `accepts` array", ann };
  }
  // Found by equality of the WHOLE object, not by index: the client chooses, and
  // nothing in the payload records which index it chose. An index would be a
  // guess that happens to be right whenever there is one requirement.
  const target = JSON.stringify(sortedKeys(accepted));
  const i = accepts.findIndex((c) => JSON.stringify(sortedKeys(obj(c) ?? {})) === target);
  if (i < 0) {
    return {
      ok: false,
      verdict: "INVALID",
      reason: "content_commitment_mismatch",
      detail:
        `the requirement the payload says it accepted is not one of the ${accepts.length} the 402 offered; ` +
        `the client paid under terms this 402 did not publish`,
      ann,
    };
  }
  ann["accepted_requirement_index"] = i;

  const payTo = str(accepted["payTo"]) ?? "";
  const amount = str(accepted["amount"]) ?? "";
  const to = str(a["to"]) ?? "";
  const value = str(a["value"]) ?? "";
  const mismatches: string[] = [];
  if (!sameAddress(to, payTo)) mismatches.push(`authorization.to ${to} is not the accepted payTo ${payTo}`);
  if (value !== amount) mismatches.push(`authorization.value ${JSON.stringify(value)} is not the accepted amount ${JSON.stringify(amount)}`);
  if (mismatches.length > 0) {
    return { ok: false, verdict: "INVALID", reason: "content_commitment_mismatch", detail: mismatches.join("; "), ann };
  }
  ann["authorization_matches_requirements"] = `to == payTo (${payTo}), value == amount (${amount})`;

  // Checksum spelling is REPORTED. `0x26D4Ffe9…8b860AD3` and `0x26D4ffe9…8b860AD3`
  // are one address; the day-two chain script used the second and the 402 the
  // first, and neither is wrong.
  ann["address_checksum_form"] =
    `payTo ${isEip55Checksummed(payTo) ? "is" : "is NOT"} in EIP-55 checksum form; ` +
    `authorization.from ${isEip55Checksummed(str(a["from"]) ?? "") ? "is" : "is NOT"}; ` +
    `this is a spelling and never a verdict`;

  const validAfter = str(a["validAfter"]);
  const validBefore = str(a["validBefore"]);
  ann["authorization_window"] =
    (validAfter === "0" ? "no lower bound (validAfter is \"0\")" : `validAfter ${validAfter}`) +
    `, validBefore ${validBefore}`;
  ann["authorization_window_against_capture"] =
    capturedAt === null
      ? "not computed — this envelope supplies no `captured_at`, and the 402 object carries no instant of its own"
      : validBefore !== null && /^\d+$/.test(validBefore)
        ? `validBefore is ${Number(validBefore) - capturedAt} s after the supplied 402 capture instant ${capturedAt}`
        : "not computed — validBefore is not a decimal integer";
  const mts = accepted["maxTimeoutSeconds"];
  if (typeof mts === "number") ann["max_timeout_seconds"] = mts;
  return { ok: true, ann };
}

/** JSON.stringify over a key-sorted copy, one level deep and recursively. Equality of the whole object, spelled once. */
function sortedKeys(v: unknown): unknown {
  const o = obj(v);
  if (o !== null) {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(o).sort()) out[k] = sortedKeys(o[k]);
    return out;
  }
  const a = arr(v);
  return a === null ? v : a.map(sortedKeys);
}

// ---------------------------------------------------------------------------
// R3 — the settle answer
// ---------------------------------------------------------------------------

function checkSettleResponse(response: Record<string, unknown>, payload: Record<string, unknown>): Relation {
  const ann: Ann = {};
  const a = obj(payload["authorization"]);
  const accepted = obj(payload["accepted"]);
  if (a === null) {
    return { ok: false, verdict: "UNVERIFIABLE", reason: "malformed_member", detail: "the payload carries no authorization to compare the settle answer against", ann };
  }
  const payer = str(response["payer"]) ?? "";
  const from = str(a["from"]) ?? "";
  const network = str(response["network"]) ?? "";
  const acceptedNetwork = accepted === null ? null : str(accepted["network"]);
  const transaction = str(response["transaction"]) ?? "";

  // `success: false` is not a failed settlement. The facilitator's own OpenAPI
  // says `settlement_pending` means the outcome is UNRESOLVED, so the answer is
  // carried and the chain relations decide.
  const success = response["success"];
  ann["settle_success"] = typeof success === "boolean" ? success : `absent (${JSON.stringify(success)})`;
  const errorReason = str(response["errorReason"]);
  if (errorReason !== null) {
    ann["settle_error_reason"] = errorReason;
    ann["settle_error_reason_note"] =
      "carried, not treated as a failed settlement: the facilitator's published SettleResponse says settlement_pending is unresolved, not failed, and the chain answers that question here";
  }

  if (!isHash32(transaction)) {
    return { ok: false, verdict: "UNVERIFIABLE", reason: "malformed_member", detail: `the settle answer's transaction ${JSON.stringify(transaction)} is not a 32-byte hex hash`, ann };
  }
  if (!sameAddress(payer, from)) {
    return { ok: false, verdict: "INVALID", reason: "content_commitment_mismatch", detail: `the settle answer names payer ${payer} and the signed authorization is from ${from}`, ann };
  }
  if (acceptedNetwork !== null && network !== acceptedNetwork) {
    return { ok: false, verdict: "INVALID", reason: "content_commitment_mismatch", detail: `the settle answer names network ${JSON.stringify(network)} and the accepted requirement names ${JSON.stringify(acceptedNetwork)}`, ann };
  }
  ann["settle_names_authorization"] = `payer == authorization.from (${from}), network ${network}, transaction ${transaction}`;
  // The member the facilitator's own schema does NOT have. Stated because its
  // absence is the reason `resource_binding` can never close from a settle answer.
  ann["settle_response_signed"] = "no — the published SettleResponse has no signature member, so this object is the facilitator's unsigned word";
  return { ok: true, ann };
}

// ---------------------------------------------------------------------------
// R4 / R5 / R6 — the chain half
// ---------------------------------------------------------------------------

interface DecodedLog {
  index: number;
  address: string;
  topics: string[];
  data: string;
}

function logsOf(receipt: Record<string, unknown>): DecodedLog[] {
  const out: DecodedLog[] = [];
  for (const l of arr(receipt["logs"]) ?? []) {
    const e = obj(l);
    if (e === null) continue;
    const topics = (arr(e["topics"]) ?? []).map((t) => str(t) ?? "");
    out.push({
      index: Number(quantity(e["logIndex"]) ?? -1n),
      address: str(e["address"]) ?? "",
      topics,
      data: str(e["data"]) ?? "",
    });
  }
  return out;
}

/** A 32-byte topic word carrying a left-padded address. */
const addressFromTopic = (t: string): string => `0x${t.slice(-40)}`;

type ChainOutcome =
  | { ok: true; ann: Ann }
  | { ok: false; kind: "contradiction" | "malformed"; detail: string; ann: Ann; stoppedAt: string };

function checkChain(chain: ChainData, payload: Record<string, unknown> | null, accepted: Record<string, unknown> | null, knownSubmitters: Array<Record<string, unknown>> | null): ChainOutcome {
  const ann: Ann = {};
  if (chain.rpc_url !== undefined) ann["chain_rpc"] = chain.rpc_url;
  if (chain.read_at !== undefined) ann["chain_read_at"] = chain.read_at;

  const receipt = obj(chain.receipt);
  if (receipt === null) {
    return { ok: false, kind: "malformed", detail: "the envelope's `chain` member carries no receipt object", ann, stoppedAt: "chain_transfer_matches_authorization" };
  }
  const status = str(receipt["status"]) ?? "";
  ann["chain_status"] = status === "0x1" ? "ok (0x1)" : `NOT ok (${JSON.stringify(status)})`;
  if (status !== "0x1") {
    return { ok: false, kind: "contradiction", detail: `the transaction has status ${JSON.stringify(status)}, not success`, ann, stoppedAt: "chain_transfer_matches_authorization" };
  }
  const blockNumber = quantity(receipt["blockNumber"]);
  if (blockNumber !== null) ann["chain_block_number"] = Number(blockNumber);

  const a = payload === null ? null : obj(payload["authorization"]);
  const asset = accepted === null ? null : str(accepted["asset"]);
  const transferTopic = topic0(TRANSFER_SIGNATURE);
  const usedTopic = topic0(AUTHORIZATION_USED_SIGNATURE);
  ann["transfer_topic0"] = `keccak("${TRANSFER_SIGNATURE}")`;
  ann["authorization_used_topic0"] = `keccak("${AUTHORIZATION_USED_SIGNATURE}")`;

  const logs = logsOf(receipt);
  // With no accepted requirement (the observation case) the token contract is
  // taken from the receipt's own `to`, which is where a TransferWithAuthorization
  // is submitted. Stated in the annotation rather than assumed silently.
  const tokenContract = asset ?? str(receipt["to"]) ?? "";
  ann["token_contract"] =
    asset !== null
      ? `${asset} (the accepted requirement's asset)`
      : `${tokenContract} (no accepted requirement in the envelope, so the token contract is read from the transaction's own recipient)`;

  const transfers = logs.filter((l) => l.topics.length >= 3 && sameAddress(l.topics[0]!, transferTopic) && sameAddress(l.address, tokenContract));
  ann["transfer_logs"] = transfers.length;
  if (transfers.length !== 1) {
    return {
      ok: false,
      kind: "contradiction",
      detail: `the receipt carries ${transfers.length} Transfer logs emitted by ${tokenContract}, and exactly one is what a single exact-scheme settlement means`,
      ann,
      stoppedAt: "chain_transfer_matches_authorization",
    };
  }
  const t = transfers[0]!;
  const tFrom = addressFromTopic(t.topics[1]!);
  const tTo = addressFromTopic(t.topics[2]!);
  const tValue = quantity(t.data);
  if (tValue === null) {
    return { ok: false, kind: "malformed", detail: `the Transfer log's data ${JSON.stringify(t.data)} is not a hex quantity`, ann, stoppedAt: "chain_transfer_matches_authorization" };
  }
  ann["transfer"] = `${tFrom} -> ${tTo}, ${tValue.toString()} atomic units of ${t.address} (log index ${t.index})`;

  const used = logs.filter((l) => l.topics.length >= 3 && sameAddress(l.topics[0]!, usedTopic) && sameAddress(l.address, tokenContract));
  if (used.length === 0) {
    // Not a failure. Whether a token contract emits this event is a fact about
    // that contract, and the receipts this repository pins are what establish it.
    ann["authorization_used"] = "absent — this receipt carries no AuthorizationUsed log from the token contract";
  } else {
    const u = used[0]!;
    ann["authorization_used"] = `authorizer ${addressFromTopic(u.topics[1]!)}, nonce ${u.topics[2]!} (log index ${u.index})`;
  }

  if (a === null) {
    // The observation case: the chain half is recorded and nothing is compared.
    ann["chain_compared_to_authorization"] = "no — the envelope carries no payment_payload, so the transfer and the authorization-used event are recorded and not compared";
  } else {
    const from = str(a["from"]) ?? "";
    const to = str(a["to"]) ?? "";
    const value = str(a["value"]) ?? "";
    const nonce = str(a["nonce"]) ?? "";
    const bad: string[] = [];
    if (!sameAddress(tFrom, from)) bad.push(`the Transfer is from ${tFrom} and the authorization is from ${from}`);
    if (!sameAddress(tTo, to)) bad.push(`the Transfer is to ${tTo} and the authorization is to ${to}`);
    if (tValue.toString() !== value) bad.push(`the Transfer moved ${tValue.toString()} and the authorization is for ${JSON.stringify(value)}`);
    if (bad.length > 0) {
      return { ok: false, kind: "contradiction", detail: bad.join("; "), ann, stoppedAt: "chain_transfer_matches_authorization" };
    }
    ann["chain_transfer_matches_authorization"] = `from, to and value all equal the signed authorization`;
    if (used.length > 0) {
      const u = used[0]!;
      const authorizer = addressFromTopic(u.topics[1]!);
      const eventNonce = u.topics[2]!;
      if (!sameAddress(authorizer, from) || !sameAddress(eventNonce, nonce)) {
        return {
          ok: false,
          kind: "contradiction",
          detail: `AuthorizationUsed names authorizer ${authorizer} nonce ${eventNonce}; the signed authorization is from ${from} nonce ${nonce}`,
          ann,
          stoppedAt: "chain_transfer_matches_authorization",
        };
      }
      ann["authorization_used_matches"] = `authorizer and nonce both equal the signed authorization`;
    }
  }

  // ---- R5: the block at the height the receipt names ----------------------
  const block = obj(chain.block);
  if (block === null) {
    return { ok: false, kind: "malformed", detail: "the envelope's `chain` member carries no block object, so the receipt is not at a height", ann, stoppedAt: "block_at_height" };
  }
  const receiptBlockHash = str(receipt["blockHash"]) ?? "";
  const blockHash = str(block["hash"]) ?? "";
  const blockNumberOfBlock = quantity(block["number"]);
  if (blockNumberOfBlock !== null && blockNumber !== null && blockNumberOfBlock !== blockNumber) {
    return {
      ok: false,
      kind: "contradiction",
      detail: `the block supplied is number ${blockNumberOfBlock} and the receipt says ${blockNumber}`,
      ann,
      stoppedAt: "block_at_height",
    };
  }
  if (!sameAddress(blockHash, receiptBlockHash) || blockHash === "") {
    return {
      ok: false,
      kind: "contradiction",
      detail:
        `the block at height ${blockNumber === null ? "(unstated)" : blockNumber} hashes to ${JSON.stringify(blockHash)} and the receipt claims ${JSON.stringify(receiptBlockHash)}; ` +
        `a preconfirmation is not a block at height`,
      ann,
      stoppedAt: "block_at_height",
    };
  }
  ann["block_at_height"] = `the block at ${blockNumber} has the receipt's blockHash ${blockHash}`;
  const ts = quantity(block["timestamp"]);
  if (ts !== null) {
    ann["settlement_instant"] = `${ts.toString()} (${new Date(Number(ts) * 1000).toISOString()}), the timestamp of the block the receipt is in`;
  }

  // ---- R6: who submitted it ----------------------------------------------
  const tx = obj(chain.submitter_tx);
  const submitter = tx === null ? null : str(tx["from"]);
  if (submitter === null) {
    ann["submitter"] = "not recorded — the envelope's `chain` member carries no submitter_tx with a `from`";
  } else {
    ann["submitter"] = submitter;
    if (knownSubmitters === null || knownSubmitters.length === 0) {
      ann["submitter_list"] = "no_list_supplied";
    } else {
      const hit = knownSubmitters.find((s) => sameAddress(str(s["address"]) ?? "", submitter));
      const src = knownSubmitters[0]!;
      ann["submitter_list"] = hit === undefined ? "submitter_not_in_supplied_list" : "submitter_in_supplied_list";
      ann["submitter_list_source"] =
        `${str(src["source_url"]) ?? "(no source_url)"} sha256 ${str(src["source_sha256"]) ?? "(none)"} fetched ${str(src["fetched_at"]) ?? "(no time)"}; ` +
        `${knownSubmitters.length} addresses. This list is unsigned and is the supplier's word as of that fetch: a match is not an identification`;
    }
  }
  return { ok: true, ann };
}

// ---------------------------------------------------------------------------
// reading the chain, when the envelope did not carry it
// ---------------------------------------------------------------------------

async function resolveChain(rpc: string, txHash: string): Promise<{ ok: true; chain: ChainData } | { ok: false; detail: string }> {
  const call = async (method: string, params: unknown[]): Promise<unknown> => {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`${method}: HTTP ${res.status}`);
    const parsed = JSON.parse(text) as { result?: unknown; error?: { message?: string } };
    if (parsed.error !== undefined) throw new Error(`${method}: ${parsed.error.message ?? "RPC error"}`);
    return parsed.result;
  };
  const read_at = new Date().toISOString();
  try {
    const receipt = obj(await call("eth_getTransactionReceipt", [txHash]));
    if (receipt === null) return { ok: false, detail: `eth_getTransactionReceipt returned null for ${txHash}: the transaction is not on this chain` };
    const block = obj(await call("eth_getBlockByNumber", [str(receipt["blockNumber"]) ?? "0x0", false]));
    const submitter_tx = obj(await call("eth_getTransactionByHash", [txHash]));
    const chain: ChainData = { rpc_url: rpc, read_at, transaction: txHash };
    chain.receipt = receipt;
    if (block !== null) chain.block = block;
    if (submitter_tx !== null) chain.submitter_tx = submitter_tx;
    return { ok: true, chain };
  } catch (e) {
    return { ok: false, detail: `${rpc}: ${(e as Error).message}` };
  }
}

// ---------------------------------------------------------------------------

/**
 * The key a verdict was reached under. On an EVM chain the address IS the
 * identifier of the public key a signature recovers to, so naming it keeps the
 * README's invariant — `resolved_key` is null exactly when the verdict is
 * UNVERIFIABLE — true for this format without amending it.
 */
function resolvedKeyFor(payload: Record<string, unknown>): ResolvedKey | null {
  const a = obj(payload["authorization"]);
  const from = a === null ? null : str(a["from"]);
  if (from === null) return null;
  return {
    kid: from,
    alg: "secp256k1 / EIP-712 (EIP-3009)",
    origin: "the authorization's from address; on an EVM chain the address is the identifier of the public key the signature recovers to",
  };
}

export const x402SettlementAdapter: Adapter = {
  format: FORMAT,
  detect,

  async verify(bytes: Uint8Array, opts: VerifyOptions): Promise<VerifyResult> {
    // ---- 1. envelope_shape ------------------------------------------------
    const p = parseStrict(bytes);
    if (!p.ok) return unverifiable(FORMAT, p.reason, p.detail, undefined, "envelope_shape");
    const doc = p.value;
    if (doc["schema"] !== FORMAT || doc["x402Version"] !== 2) {
      return unverifiable(
        FORMAT,
        "malformed_receipt",
        `not an ${FORMAT} envelope: schema is ${JSON.stringify(doc["schema"])} and x402Version is ${JSON.stringify(doc["x402Version"])}`,
        undefined,
        "envelope_shape",
      );
    }
    const required = obj(doc["payment_required"]);
    const payload0 = obj(doc["payment_payload"]);
    const response = obj(doc["payment_response"]);
    const knownSubmitters = (arr(doc["known_submitters"]) ?? []).map((s) => obj(s)).filter((s): s is Record<string, unknown> => s !== null);
    // The payload the pins hold nests the signed half under `payload` and keeps
    // `resource` and `accepted` OUTSIDE it. Both halves are read from the top
    // object so the adapter never has to guess which shape it was handed.
    const inner = payload0 === null ? null : obj(payload0["payload"]);
    const payload: Record<string, unknown> | null =
      payload0 === null
        ? null
        : {
            ...(inner ?? {}),
            accepted: payload0["accepted"] ?? (inner === null ? undefined : inner["accepted"]),
            resource: payload0["resource"] ?? (inner === null ? undefined : inner["resource"]),
          };
    const accepted = payload === null ? null : obj(payload["accepted"]);

    const ann: Ann = { ...LIMITS };

    let chain = obj(doc["chain"]) as ChainData | null;
    if (chain === null && opts.rpc !== undefined) {
      const txHash = response === null ? null : str(response["transaction"]);
      if (txHash === null || !isHash32(txHash)) {
        return unverifiable(FORMAT, "chain_unavailable", `--rpc was given and this envelope names no transaction to look up: ${LIMIT_DETAIL}`, ann, "chain_transfer_matches_authorization");
      }
      const got = await resolveChain(opts.rpc, txHash);
      if (!got.ok) {
        return unverifiable(FORMAT, "chain_unavailable", `the chain read could not be completed: ${got.detail}. ${LIMIT_DETAIL}`, ann, "chain_transfer_matches_authorization");
      }
      chain = got.chain;
      ann["chain_source"] = `read by this tool from ${opts.rpc}`;
    } else if (chain !== null) {
      ann["chain_source"] = "supplied in the envelope";
    }

    if (required === null && payload0 === null && response === null && chain === null) {
      return unverifiable(FORMAT, "malformed_receipt", `the envelope carries neither the artefacts nor chain data, so it establishes nothing. ${LIMIT_DETAIL}`, ann, "envelope_shape");
    }

    const capturedAt = capturedInstant(doc);

    // ---- 2. R1 ------------------------------------------------------------
    if (payload === null) {
      ann["authorization_signature"] = "not_evaluated — the envelope carries no payment_payload";
    } else {
      const r = checkSignature(payload);
      Object.assign(ann, r.ann);
      if (!r.ok) {
        return r.verdict === "INVALID"
          ? invalid(FORMAT, r.reason as "signature_invalid", `${r.detail}. ${LIMIT_DETAIL}`, resolvedKeyFor(payload) ?? unnamedKey(), "authorization_signature_recovers_payer", ann)
          : unverifiable(FORMAT, r.reason, `${r.detail}. ${LIMIT_DETAIL}`, ann, "authorization_signature_recovers_payer");
      }
    }

    // ---- 3. R2 ------------------------------------------------------------
    if (required === null || payload === null) {
      ann["authorization_matches_requirements"] = `not_evaluated — the envelope carries no ${required === null ? "payment_required" : "payment_payload"}`;
    } else {
      const r = checkRequirements(required, payload, capturedAt);
      Object.assign(ann, r.ann);
      if (!r.ok) {
        return r.verdict === "INVALID"
          ? invalid(FORMAT, r.reason as "content_commitment_mismatch", `${r.detail}. ${LIMIT_DETAIL}`, resolvedKeyFor(payload) ?? unnamedKey(), "authorization_matches_requirements", ann)
          : unverifiable(FORMAT, r.reason, `${r.detail}. ${LIMIT_DETAIL}`, ann, "authorization_matches_requirements");
      }
    }

    // ---- 4. R3 ------------------------------------------------------------
    if (response === null || payload === null) {
      ann["settle_names_authorization"] = `not_evaluated — the envelope carries no ${response === null ? "payment_response" : "payment_payload"}`;
    } else {
      const r = checkSettleResponse(response, payload);
      Object.assign(ann, r.ann);
      if (!r.ok) {
        return r.verdict === "INVALID"
          ? invalid(FORMAT, r.reason as "content_commitment_mismatch", `${r.detail}. ${LIMIT_DETAIL}`, resolvedKeyFor(payload) ?? unnamedKey(), "settle_response_names_authorization", ann)
          : unverifiable(FORMAT, r.reason, `${r.detail}. ${LIMIT_DETAIL}`, ann, "settle_response_names_authorization");
      }
    }

    // ---- 5-7. R4, R5, R6 --------------------------------------------------
    if (chain === null) {
      return unverifiable(
        FORMAT,
        "chain_unavailable",
        `the envelope carries no \`chain\` member and no --rpc was given, so nothing about the money is established. ${LIMIT_DETAIL}`,
        ann,
        "chain_transfer_matches_authorization",
      );
    }
    const c = checkChain(chain, payload, accepted, knownSubmitters.length > 0 ? knownSubmitters : null);
    Object.assign(ann, c.ann);
    if (!c.ok) {
      // A contradiction with no artefacts to contradict is not an INVALID: what
      // disagrees is the envelope's own chain member with itself, and INVALID
      // names a key the envelope does not carry.
      if (c.kind === "malformed" || payload === null) {
        return unverifiable(
          FORMAT,
          "malformed_member",
          `${c.detail}${payload === null ? " (no payment_payload is present, so this is a disagreement inside the supplied chain data and not a statement about any artefact)" : ""}. ${LIMIT_DETAIL}`,
          ann,
          c.stoppedAt,
        );
      }
      return invalid(FORMAT, "chain_contradicts_artefacts", `${c.detail}. ${LIMIT_DETAIL}`, resolvedKeyFor(payload) ?? unnamedKey(), c.stoppedAt, ann);
    }

    // ---- the verdict ------------------------------------------------------
    if (payload === null || required === null || response === null) {
      // The observation case. The chain half ran and is in the annotations; the
      // three relations that say what was bought and who authorized it did not
      // run at all, and the verdict says so rather than reporting a pass on the
      // half that was present.
      return unverifiable(
        FORMAT,
        "artefacts_absent",
        `the chain half of this settlement is recorded and the off-chain half is not held: ` +
          `${[required === null ? "payment_required" : null, payload === null ? "payment_payload" : null, response === null ? "payment_response" : null].filter((s) => s !== null).join(", ")} absent. ` +
          `This is an observation of a transfer, not a verification of a purchase. ${LIMIT_DETAIL}`,
        ann,
      );
    }
    return valid(
      FORMAT,
      "the authorization's signature recovers its payer, it pays the requirement the 402 published, the settle answer names it, " +
        `and the chain at height moved exactly that transfer. ${LIMIT_DETAIL}`,
      resolvedKeyFor(payload)!,
      ann,
    );
  },
};

/**
 * Only reachable if `authorization.from` is absent AND a relation already
 * returned a determinate negative, which the shape checks above make impossible.
 * Present so `invalid()`'s mandatory key is never fabricated from a guess.
 */
function unnamedKey(): ResolvedKey {
  return { kid: "(none)", alg: "secp256k1 / EIP-712 (EIP-3009)", origin: "no authorization.from is present in this envelope" };
}

/**
 * The instant the 402 was captured, IF the envelope supplies one as an optional
 * top-level `captured_at`. Used only to annotate how much of the authorization
 * window was left; never to refuse anything, because this value sits outside the
 * signature exactly as the 402 object itself does.
 */
function capturedInstant(doc: Record<string, unknown>): number | null {
  const read = str(doc["captured_at"]);
  if (read === null) return null;
  const t = Date.parse(read);
  return Number.isFinite(t) ? Math.floor(t / 1000) : null;
}
