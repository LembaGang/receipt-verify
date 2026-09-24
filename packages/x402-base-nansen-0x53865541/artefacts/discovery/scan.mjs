// Find the newest Base USDC x402 exact settlement PAID TO one payee address:
// a transaction carrying both an EIP-3009 AuthorizationUsed on the USDC contract
// and a USDC Transfer whose `to` (topics[2]) is the payee. Public data only: two
// eth_getLogs per window, intersected by transaction hash.
//
// Everything it writes goes to the directory given as --out, with the raw
// response bodies it relied on.

import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RPC = process.env.SCAN_RPC ?? "https://mainnet.base.org";
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const AUTHORIZATION_USED = "0x98de503528ee59b575ef0c0a2576a82497bfc029a5685b209e9ec333479b10a5";
const TRANSFER_TOPIC0 = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const PAYEE_ADDRESS = "0x93053f1e7A5eFEDa532Fe69CbbE43cBEc3A0F13f";
const PAYEE = "0x" + PAYEE_ADDRESS.slice(2).toLowerCase().padStart(64, "0");
// Where the payee address was read, recorded so the scan log names its source.
const PAYEE_SOURCE = {
  "kind": "catalogue object (Coinbase Bazaar discovery)",
  "host": "api.nansen.ai",
  "url": "https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources?limit=1000&offset=0",
  "tgz": "C:/Users/User/cc-output/pins/b178-sellers-by-volume-pins_2026-09-10.tgz",
  "tgz_sha256": "7b553402b5cc4d6b39a9959d50419240fbd920208bc1fc77c805188a8c53b0cd",
  "path_in_tgz": "raw/cdp_discovery_resources_p_off0__20260910T155951Z.bin",
  "path_in_tgz_sha256": "0d06754b9a41d7a0d3ca9e012f563af8acdf418592b78ebbbe6de08a01248ae9",
  "fetched_at": "2026-09-10T15:59:51Z",
  "item_index": 146,
  "byte_offset": 518303,
  "bytes": 4674,
  "sha256": "14812ed3a4d3e788ecfac9c41e9772847d69bf3de6ec8242123f8f500a1e06f4",
  "resource": "https://api.nansen.ai/api/v1/profiler/address/current-balance",
  "copied_to": "catalogue-object.json",
  "ruling": "Lead ruling of 2026-09-24: B3 built from the Coinbase catalogue Base payTo; rev 4 and rev 5 \"the tgz\" read as any catalogue in the tgz",
  "not_used": {
    "kind": "catalogue object (PayAI discovery), Solana payTo, not used by this scan",
    "url": "https://facilitator.payai.network/discovery/resources?limit=1000&offset=0",
    "tgz": "C:/Users/User/cc-output/pins/b178-sellers-by-volume-pins_2026-09-10.tgz",
    "tgz_sha256": "7b553402b5cc4d6b39a9959d50419240fbd920208bc1fc77c805188a8c53b0cd",
    "path_in_tgz": "raw/payai_discovery_resources_off0__20260910T154656Z.bin",
    "path_in_tgz_sha256": "0406b5934a94656086583044047b88a47d6582a9b9d9f194e6b173af2e5ff551",
    "fetched_at": "2026-09-10T15:46:56Z",
    "item_index": 422,
    "byte_offset": 707064,
    "bytes": 1028,
    "sha256": "833f1fcb4e5d6fa64d26ae048ac0344eb960477750f0a3cf56888a611b4c3569",
    "resource": "https://api.nansen.ai/api/v1/smart-money/dex-trades",
    "payTo": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp J7ZvJEspvwP1oRxQZ7mYmNmT22NTm3GWq3t7HEbvPZYx",
    "copied_to": "payai-catalogue-object-solana.json"
  }
};

const outDir = process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out") + 1] : ".";
mkdirSync(outDir, { recursive: true });

const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const log = [];

async function call(method, params, save) {
  const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method, params });
  const res = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body });
  const text = await res.text();
  const at = new Date().toISOString();
  log.push({ method, params, rpc: RPC, at, http: res.status, sha256: sha256(text), bytes: text.length, saved_as: save ?? null });
  if (save) writeFileSync(join(outDir, save), text, "utf8");
  const parsed = JSON.parse(text);
  if (parsed.error) throw new Error(`${method}: ${parsed.error.message}`);
  return parsed.result;
}

const tipHex = await call("eth_blockNumber", [], "eth_blockNumber.json");
const tip = Number(BigInt(tipHex));
console.log(`tip ${tip}`);

// At least 64 blocks behind the tip, per the handoff: a block that shallow is
// not yet something to build an evidence package around.
const ceiling = tip - 64;
const SPAN = 400;
let found = null;
let from = ceiling - SPAN;
const windows = [];

for (let round = 0; round < 20 && found === null; round++) {
  const to = from + SPAN;
  const logs = await call("eth_getLogs", [{
    address: USDC,
    topics: [AUTHORIZATION_USED],
    fromBlock: "0x" + from.toString(16),
    toBlock: "0x" + to.toString(16),
  }], `eth_getLogs-authorizationUsed-${from}-${to}.json`);
  const transfers = await call("eth_getLogs", [{
    address: USDC,
    topics: [TRANSFER_TOPIC0, null, PAYEE],
    fromBlock: "0x" + from.toString(16),
    toBlock: "0x" + to.toString(16),
  }], `eth_getLogs-transfer-${from}-${to}.json`);
  const paidTo = new Set(transfers.map((l) => l.transactionHash.toLowerCase()));
  console.log(`blocks ${from}..${to}: ${logs.length} AuthorizationUsed logs, ${transfers.length} Transfer logs to the payee`);
  // Newest first: the handoff prefers the most recent qualifying settlement.
  const byTx = [...new Set(logs.map((l) => l.transactionHash))].reverse();
  const matches = byTx.filter((h) => paidTo.has(h.toLowerCase()));
  windows.push({ from, to, authorization_used_logs: logs.length, transfer_to_payee_logs: transfers.length, matches });
  for (const txHash of matches) {
    const tx = await call("eth_getTransactionByHash", [txHash], `eth_getTransactionByHash-${txHash}.json`);
    if (tx === null) continue;
    found = { txHash, from: tx.from, blockNumber: Number(BigInt(tx.blockNumber)), window: { from, to } };
    console.log(`HIT ${txHash} paid to ${PAYEE_ADDRESS} in block ${found.blockNumber}`);
    break;
  }
  from -= SPAN;
}

writeFileSync(join(outDir, "scan-log.json"), JSON.stringify({ rpc: RPC, payee: PAYEE_ADDRESS, payee_topic: PAYEE, payee_source: PAYEE_SOURCE, tip, ceiling, span: SPAN, windows, found, calls: log }, null, 2) + "\n", "utf8");
if (found === null) {
  console.log("no AuthorizationUsed transaction in the scanned range paid to the payee");
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(found));
}
