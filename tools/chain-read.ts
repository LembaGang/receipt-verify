// chain-read — resolve one transaction from TWO independently operated JSON-RPC
// endpoints and write what both of them said.
//
//   npx tsx tools/chain-read.ts <txhash> [--out chain.json] [--rpc URL --rpc URL]
//
// Why two. A JSON-RPC endpoint is a party. Its answer is a claim, not evidence,
// and a verifier that reads one endpoint has a single point of trust sitting
// exactly where it was trying to remove one. Two endpoints under different
// operators, returning equal receipts and the same block hash at the same
// height, is what raises the answer from a claim to a corroborated reading — and
// when they DISAGREE that is the finding, so the disagreement is recorded rather
// than resolved by preferring one.
//
// What this tool does NOT establish: that either endpoint is honest, that the
// chain it answers for is the chain anyone else means by "Base", or that a block
// at height will not reorganise. `eth_chainId` is asked of both so at least the
// chain id is not assumed, and the block is read at the receipt's own height so a
// sub-second preconfirmation cannot pass for a block.
//
// The output's `chain` member is in the x402.settlement/2 envelope's shape, built
// from the FIRST endpoint, so a package can drop it straight into an envelope;
// `rpcs` holds both raw answers with the URL and the read time; `agreement` says
// whether the two receipts and the two block hashes are equal, and `agreement_method`
// says under what comparison, because the honest one is not raw text.

import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";

/** Two public Base endpoints under different operators. Overridable with --rpc. */
const DEFAULT_RPCS = ["https://mainnet.base.org", "https://base.drpc.org"];

export interface RpcAnswer {
  rpc_url: string;
  read_at: string;
  chain_id: string | null;
  response_sha256: Record<string, string>;
  transaction: Record<string, unknown> | null;
  receipt: Record<string, unknown> | null;
  block: Record<string, unknown> | null;
  error?: string;
}

export interface Agreement {
  rpcs: string[];
  /**
   * The two receipts are equal as DOCUMENTS: compared under `stable()`, which
   * sorts member names. Not raw-text equality — two servers serialise the same
   * receipt with different member order and different whitespace, so a raw-text
   * comparison would report a disagreement about their serialisers and say
   * nothing whatever about the chain. `agreement_method` records this on the
   * output so the claim is not read as stronger than it is.
   */
  receipts_equal: boolean;
  block_hashes_equal: boolean;
  chain_ids_equal: boolean;
  agreement_method: string;
  detail: string;
}

const sha256 = (s: string): string => createHash("sha256").update(s).digest("hex");
const obj = (v: unknown): Record<string, unknown> | null =>
  v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
const str = (v: unknown): string | null => (typeof v === "string" ? v : null);

/** Sorted-member-name stringify, so two RPC answers compare as documents rather than as text. */
export function stable(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stable(o[k])}`)
    .join(",")}}`;
}

export async function readOne(rpc: string, txHash: string): Promise<RpcAnswer> {
  const read_at = new Date().toISOString();
  const digests: Record<string, string> = {};
  const call = async (method: string, params: unknown[]): Promise<unknown> => {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`${method}: HTTP ${res.status}`);
    digests[method] = sha256(text);
    const parsed = JSON.parse(text) as { result?: unknown; error?: { message?: string } };
    if (parsed.error !== undefined) throw new Error(`${method}: ${parsed.error.message ?? "RPC error"}`);
    return parsed.result;
  };
  const base: RpcAnswer = {
    rpc_url: rpc,
    read_at,
    chain_id: null,
    response_sha256: digests,
    transaction: null,
    receipt: null,
    block: null,
  };
  try {
    base.chain_id = str(await call("eth_chainId", []));
    base.transaction = obj(await call("eth_getTransactionByHash", [txHash]));
    const receipt = obj(await call("eth_getTransactionReceipt", [txHash]));
    base.receipt = receipt;
    if (receipt !== null) {
      base.block = obj(await call("eth_getBlockByNumber", [str(receipt["blockNumber"]) ?? "0x0", false]));
    }
  } catch (e) {
    base.error = (e as Error).message;
  }
  return base;
}

const METHOD =
  "the two receipt objects are compared under a sorted-member-name stringify, not as raw response text: " +
  "two endpoints serialise one receipt with different member order and whitespace, so raw-text equality would " +
  "measure their serialisers rather than the chain";

export function agreementOf(answers: RpcAnswer[]): Agreement {
  const usable = answers.filter((a) => a.error === undefined && a.receipt !== null);
  if (usable.length < 2) {
    return {
      rpcs: answers.map((a) => a.rpc_url),
      receipts_equal: false,
      block_hashes_equal: false,
      chain_ids_equal: false,
      agreement_method: METHOD,
      detail:
        `only ${usable.length} of ${answers.length} endpoints returned a receipt, so no second reading corroborates the first: ` +
        answers.map((a) => `${a.rpc_url} ${a.error ?? (a.receipt === null ? "returned null" : "ok")}`).join("; "),
    };
  }
  const [a, b] = usable;
  const receipts = stable(a!.receipt) === stable(b!.receipt);
  const hashes = (str(a!.block?.["hash"]) ?? "x").toLowerCase() === (str(b!.block?.["hash"]) ?? "y").toLowerCase();
  const chains = a!.chain_id === b!.chain_id;
  return {
    rpcs: usable.map((x) => x.rpc_url),
    receipts_equal: receipts,
    block_hashes_equal: hashes,
    chain_ids_equal: chains,
    agreement_method: METHOD,
    detail:
      receipts && hashes && chains
        ? `${usable[0]!.rpc_url} and ${usable[1]!.rpc_url} returned the same chain id, equal receipts and the same block hash`
        : `the two endpoints DISAGREE: receipts ${receipts ? "equal" : "differ"}, block hashes ${hashes ? "equal" : "differ"}, chain ids ${chains ? "equal" : "differ"} — this is the finding, not an error to retry past`,
  };
}

/** The envelope's `chain` member, built from the first endpoint that answered. */
export function chainMember(answers: RpcAnswer[], txHash: string): Record<string, unknown> | null {
  const first = answers.find((a) => a.error === undefined && a.receipt !== null);
  if (first === undefined) return null;
  const out: Record<string, unknown> = {
    rpc_url: first.rpc_url,
    read_at: first.read_at,
    transaction: txHash,
    receipt: first.receipt,
  };
  if (first.block !== null) out["block"] = first.block;
  if (first.transaction !== null) out["submitter_tx"] = first.transaction;
  return out;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  let out = "chain.json";
  let txHash = "";
  const rpcs: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i]!;
    if (t === "--out") out = argv[++i] ?? out;
    else if (t === "--rpc") rpcs.push(argv[++i] ?? "");
    else txHash = t;
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    console.error("chain-read: give one 32-byte transaction hash\n  npx tsx tools/chain-read.ts <txhash> [--out chain.json] [--rpc URL]...");
    process.exitCode = 2;
    return;
  }
  const endpoints = rpcs.length > 0 ? rpcs : DEFAULT_RPCS;
  const answers: RpcAnswer[] = [];
  for (const rpc of endpoints) {
    process.stderr.write(`reading ${txHash} from ${rpc} ... `);
    const a = await readOne(rpc, txHash);
    process.stderr.write(`${a.error ?? (a.receipt === null ? "null receipt" : `block ${String(a.receipt["blockNumber"])}`)}\n`);
    answers.push(a);
  }
  const doc = {
    schema: "receipt-verify/chain-read/0",
    transaction: txHash,
    written_at: new Date().toISOString(),
    rpcs: answers,
    agreement: agreementOf(answers),
    chain: chainMember(answers, txHash),
  };
  writeFileSync(out, JSON.stringify(doc, null, 2) + "\n", "utf8");
  console.log(doc.agreement.detail);
  console.log(`wrote ${out}`);
}

if (process.argv[1]?.endsWith("chain-read.ts") === true) {
  await main();
}
