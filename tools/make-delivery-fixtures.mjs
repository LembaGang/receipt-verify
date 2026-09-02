// make-delivery-fixtures.mjs — synthesize the three x402 delivery-state chains
// that no published bundle provides.
//
// Run: node tools/make-delivery-fixtures.mjs
//
// WHY THESE EXIST. The frozen evidence.action conformance bundle predates the
// x402 delivery-proof feature, so every vector in it is `delivery: "none"`.
// Testing the projection against that bundle alone would exercise one of the
// three states and prove nothing about the other two — and `unproven` is the
// safety-critical one (payment settled, nothing committed as delivered).
//
// KEY CUSTODY. This script derives an Ed25519 keypair from a seed written in
// plain sight below, matching the convention in make-throwaway-fixtures.mjs.
// Every file it produces carries `test-throwaway` in its kid. The private key
// is worthless by construction — anyone reading this repository can re-derive
// it. No key belonging to any real signer is read, referenced, or required.

import { createPrivateKey, createPublicKey } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  Chain,
  argsHash,
  makeKid,
  paymentRef,
  resultHash,
  serializeChainJsonl,
} from "@headlessoracle/chirindo/dist/vendor/recorder/index.js";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(ROOT, "fixtures", "delivery");

// Published throwaway seed — ASCII "test-throwaway-receipt-verify-03".
const SEED_HEX = "746573742d7468726f77617761792d726563656970742d7665726966792d3033";

const pkcs8 = Buffer.concat([
  Buffer.from("302e020100300506032b657004220420", "hex"),
  Buffer.from(SEED_HEX, "hex"),
]);
const privateKey = createPrivateKey({ key: pkcs8, format: "der", type: "pkcs8" });
const publicKey = createPublicKey(privateKey);
const kid = makeKid(publicKey);

const AGENT = { vendor: "receipt-verify/delivery-fixtures", version: "1" };
// Fixed instants so the bytes regenerate identically. Chain.append rejects
// timestamp regression, so these only ever move forward.
const TS = ["2026-08-16T12:00:00.000Z", "2026-08-16T12:00:01.000Z"];

// A realistic payment reference: the registry-gated producer hashes this exact
// subset shape. The values are invented; the SHAPE is what makes the fixture
// representative rather than an arbitrary 64-hex string.
const PAYMENT_REF = paymentRef({
  scheme: "exact",
  network: "eip155:8453",
  asset: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  amount: "10000",
  resource: "https://example.invalid/paid",
});

const ARGS_HASH = argsHash({ query: "delivery fixture" });
const RESULT_HASH = resultHash({ ok: true, body: "delivered bytes" });

/**
 * Mint one chain and write it. `withResultHash` and `withPaymentRef` are the
 * only two axes that decide the delivery state, which is the whole point:
 * the fixtures differ in exactly the fields the projection reads.
 */
function mint(name, sessionId, { withResultHash, withPaymentRef }) {
  const chain = new Chain({ sessionId, agent: AGENT, kid, privateKey, now: () => TS[0] });

  const event = {
    type: "tool_call",
    outcome: "executed",
    tool_name: "x402.probe:POST https://example.invalid/paid",
    args_hash: ARGS_HASH,
    ...(withResultHash ? { result_hash: RESULT_HASH } : {}),
    decision: "observed",
    decision_source: "n/a",
  };

  chain.append(event, TS[0], withPaymentRef ? { x402PaymentRef: PAYMENT_REF } : undefined);
  const checkpoint = chain.checkpoint(TS[1]);

  const dir = join(OUT, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "chain.jsonl"),
    serializeChainJsonl({ records: [...chain.all()], checkpoint }),
    "utf8",
  );
  return name;
}

mkdirSync(OUT, { recursive: true });

// The three states chirindo's verifier distinguishes (see its `verify` help,
// "Delivery proof (x402)"). Session ids are fixed strings, not UUIDs, so the
// output is byte-deterministic across runs.
mint("proven", "11111111-1111-4111-8111-111111111111", { withResultHash: true, withPaymentRef: true });
mint("unproven", "22222222-2222-4222-8222-222222222222", { withResultHash: false, withPaymentRef: true });
mint("none", "33333333-3333-4333-8333-333333333333", { withResultHash: true, withPaymentRef: false });

// The fourth state — `unproven` for `malformed_payment_ref` — is deliberately
// NOT minted here: Chain.append refuses a payment ref that is not
// "sha256:" + 64 hex, so it cannot be produced through the writing API at all.
// Reaching it requires hand-signing a record that the recorder would refuse to
// write. Recorded as a known coverage boundary rather than left to look
// covered.

const jwk = {
  kty: "OKP",
  crv: "Ed25519",
  x: publicKey.export({ format: "jwk" }).x,
  kid,
  use: "sig",
  alg: "EdDSA",
  key_ops: ["verify"],
};
writeFileSync(join(OUT, "jwks.json"), JSON.stringify({ keys: [jwk] }, null, 2) + "\n", "utf8");

console.log(`wrote proven/ unproven/ none/ + jwks.json under ${OUT}`);
console.log(`kid = ${kid}`);
console.log(`payment_ref = ${PAYMENT_REF}`);
