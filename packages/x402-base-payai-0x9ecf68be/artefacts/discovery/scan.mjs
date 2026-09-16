// Find a recent Base USDC settlement whose submitter is one of the eip155:*
// signers PayAI publishes. Public data only: eth_getLogs for the EIP-3009
// AuthorizationUsed event on the USDC contract, then eth_getTransactionByHash
// for each hit's sender.
//
// Everything it writes goes to the directory given as --out, with the raw
// response bodies it relied on.

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RPC = process.env.SCAN_RPC ?? "https://mainnet.base.org";
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const AUTHORIZATION_USED = "0x98de503528ee59b575ef0c0a2576a82497bfc029a5685b209e9ec333479b10a5";
const SUPPORTED = "C:/Users/User/cc-output/pins/payai-facilitator-supported_2026-09-10T1254Z.json";

const outDir = process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out") + 1] : ".";
mkdirSync(outDir, { recursive: true });

const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const log = [];

async function call(method, params, save) {
  const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method, params });
  const res = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body });
  const text = await res.text();
  const at = new Date().toISOString();
  log.push({ method, params, rpc: RPC, at, http: res.status, sha256: sha256(text), bytes: text.length });
  if (save) writeFileSync(join(outDir, save), text, "utf8");
  const parsed = JSON.parse(text);
  if (parsed.error) throw new Error(`${method}: ${parsed.error.message}`);
  return parsed.result;
}

const signers = JSON.parse(readFileSync(SUPPORTED, "utf8")).signers["eip155:*"];
const signerSet = new Set(signers.map((s) => s.toLowerCase()));
console.log(`${signers.length} eip155:* signers from the pinned /supported`);

const tipHex = await call("eth_blockNumber", []);
const tip = Number(BigInt(tipHex));
console.log(`tip ${tip}`);

// At least 64 blocks behind the tip, per the handoff: a block that shallow is
// not yet something to build an evidence package around.
const ceiling = tip - 64;
const SPAN = 400;
let found = null;
let from = ceiling - SPAN;

for (let round = 0; round < 12 && found === null; round++) {
  const to = from + SPAN;
  const logs = await call("eth_getLogs", [{
    address: USDC,
    topics: [AUTHORIZATION_USED],
    fromBlock: "0x" + from.toString(16),
    toBlock: "0x" + to.toString(16),
  }]);
  console.log(`blocks ${from}..${to}: ${logs.length} AuthorizationUsed logs`);
  // Newest first: the handoff prefers the most recent qualifying settlement.
  const byTx = [...new Set(logs.map((l) => l.transactionHash))].reverse();
  for (const txHash of byTx) {
    const tx = await call("eth_getTransactionByHash", [txHash]);
    if (tx === null) continue;
    if (!signerSet.has(String(tx.from).toLowerCase())) continue;
    found = { txHash, from: tx.from, blockNumber: Number(BigInt(tx.blockNumber)) };
    console.log(`HIT ${txHash} submitted by ${tx.from} in block ${found.blockNumber}`);
    break;
  }
  from -= SPAN;
}

writeFileSync(join(outDir, "scan-log.json"), JSON.stringify({ rpc: RPC, tip, ceiling, found, calls: log }, null, 2) + "\n", "utf8");
if (found === null) {
  console.log("no AuthorizationUsed transaction in the scanned range was submitted by a published PayAI signer");
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(found));
}
