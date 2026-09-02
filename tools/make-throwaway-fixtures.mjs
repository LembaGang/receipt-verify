// make-throwaway-fixtures.mjs — synthesize the verification.* fixtures that no
// published artifact provides: flat §4.2 receipts, the detached + JCS wire
// form, and the tamper matrix.
//
// Run: node tools/make-throwaway-fixtures.mjs
//
// KEY CUSTODY. This script generates an Ed25519 keypair from a seed that is
// written in plain sight below, and every file it produces carries
// `test-throwaway` in its name. The private key is worthless by construction —
// anyone reading this repository can re-derive it. No key belonging to any
// real signer is read, referenced, or required anywhere in this repository.

import { createHash, createPrivateKey, createPublicKey, sign as cryptoSign } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const canonicalize = require("canonicalize");

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(ROOT, "fixtures", "verification-state", "synthetic");
const KEYS = join(ROOT, "fixtures", "keys");
const MAPPINGS = join(ROOT, "fixtures", "verification-state", "mappings");
const MAPPING_ID = "v0.3.0-2026-05-30";

// Published throwaway seeds. Deterministic so the fixtures regenerate
// byte-identically. Two of them, because a composed envelope has to be signed
// by two distinct issuers to be worth testing.
const SEED_HEX = "746573742d7468726f77617761792d726563656970742d7665726966792d3031";
const SEED_HEX_B = "746573742d7468726f77617761792d726563656970742d7665726966792d3032";

const b64u = (b) => Buffer.from(b).toString("base64url");
const jcsBytes = (o) => Buffer.from(canonicalize(o), "utf8");

// ---------------------------------------------------------------- key -----
function throwawayKeys(seedHex) {
  // PKCS#8 wrapper around the raw 32-byte seed: 302e020100300506032b657004220420 || seed
  const pkcs8 = Buffer.concat([
    Buffer.from("302e020100300506032b657004220420", "hex"),
    Buffer.from(seedHex, "hex"),
  ]);
  const privateKey = createPrivateKey({ key: pkcs8, format: "der", type: "pkcs8" });
  const publicKey = createPublicKey(privateKey);
  const x = publicKey.export({ format: "jwk" }).x;
  const kid = "test-throwaway-ed25519-" + createHash("sha256").update(x).digest("hex").slice(0, 8);
  return { privateKey, publicKey, x, kid };
}

const { privateKey, x, kid } = throwawayKeys(SEED_HEX);
const keyB = throwawayKeys(SEED_HEX_B);

// ------------------------------------------------------------- signing ----
function signCompact(protectedHeader, payloadBytes, key = privateKey) {
  const ph = b64u(jcsBytes(protectedHeader));
  const b64 = protectedHeader.b64 !== false;
  const input = b64
    ? Buffer.concat([Buffer.from(ph + ".", "ascii"), Buffer.from(b64u(payloadBytes), "ascii")])
    : Buffer.concat([Buffer.from(ph + ".", "ascii"), Buffer.from(payloadBytes)]);
  return { ph, sig: b64u(cryptoSign(null, input, key)), b64 };
}

function envelopes(protectedHeader, payloadBytes) {
  const { ph, sig, b64 } = signCompact(protectedHeader, payloadBytes);
  const encoded = b64 ? b64u(payloadBytes) : Buffer.from(payloadBytes).toString("utf8");
  return {
    compactAttached: `${ph}.${encoded}.${sig}`,
    compactDetached: `${ph}..${sig}`,
    flattenedAttached: { protected: ph, payload: encoded, signature: sig },
    flattenedDetached: { protected: ph, signature: sig },
  };
}

const HEADER = { alg: "EdDSA", kid, typ: "verification-receipt+jws" };
const HEADER_B64FALSE = { alg: "EdDSA", b64: false, crit: ["b64"], kid, typ: "verification-receipt+jws" };

// ------------------------------------------------------------ payloads ----
const mappingDoc = JSON.parse(readFileSync(join(MAPPINGS, `${MAPPING_ID}.json`), "utf8"));
const mappingHash = createHash("sha256").update(jcsBytes(mappingDoc)).digest("hex");

// Keys are deliberately NOT in lexicographic order. JCS has to do real work for
// the detached fixtures to verify; a JSON.stringify implementation fails here.
function flatPayload(overrides = {}) {
  return {
    v_verdict: "supported",
    iss: "https://verifier.test-throwaway.invalid",
    v_confidence: 0.91,
    exp: 1900000000,
    v_adversarial_result: "resilient",
    iat: 1750000000,
    v_recommendation: "confident_supported",
    sub: "claim:sha256:27dfce3b87229e59f268c64d50e954a6d7b640bd75557ed0185b622284d0ec1b",
    v_gate: "act",
    v_gate_mapping: MAPPING_ID,
    v_gate_mapping_hash: mappingHash,
    v_claim: { hash: "27dfce3b87229e59f268c64d50e954a6d7b640bd75557ed0185b622284d0ec1b" },
    ...overrides,
  };
}

const written = [];
function write(rel, data) {
  const path = join(OUT, rel);
  mkdirSync(dirname(path), { recursive: true });
  const bytes = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(JSON.stringify(data, null, 2) + "\n", "utf8");
  writeFileSync(path, bytes);
  written.push(rel);
}

function emitSet(name, payloadObj, { includeDetached = true } = {}) {
  // The payload OBJECT as an issuer would hand it over — non-canonical key
  // order. The signature is over its JCS canonical bytes.
  write(`${name}.payload.json`, payloadObj);
  const canonical = jcsBytes(payloadObj);

  const e = envelopes(HEADER, canonical);
  write(`${name}.attached.compact.jws`, e.compactAttached);
  write(`${name}.attached.flattened.json`, e.flattenedAttached);
  if (includeDetached) {
    write(`${name}.detached.flattened.json`, e.flattenedDetached);
    write(`${name}.detached.compact.jws`, e.compactDetached);
    const u = envelopes(HEADER_B64FALSE, canonical);
    write(`${name}.detached-b64false.flattened.json`, u.flattenedDetached);
  }
}

// ---- accept set ----------------------------------------------------------
emitSet("flat-act", flatPayload());
emitSet(
  "flat-halt",
  flatPayload({
    v_adversarial_result: "not_checked",
    v_recommendation: "un_probed_not_cleared",
    v_gate: "halt",
  }),
  { includeDetached: false },
);

// ---- tamper set A: re-signed. The issuer's own numbers disagree with the
// mapping, so the SIGNATURE IS GOOD and only the recompute catches it. These
// are the vectors that prove step 2-7 are real and not decoration.
const RESIGNED = {
  "tamper-resigned-confidence": flatPayload({ v_confidence: 0.42 }),
  "tamper-resigned-gate": flatPayload({ v_gate: "halt" }),
  "tamper-resigned-recommendation": flatPayload({ v_recommendation: "weak_supported" }),
  "tamper-resigned-mapping-hash": flatPayload({ v_gate_mapping_hash: "0".repeat(64) }),
  "tamper-resigned-mapping-id": flatPayload({ v_gate_mapping: "v9.9.9-does-not-exist" }),
  "tamper-resigned-exp": flatPayload({ exp: 1600000000 }),
  "tamper-resigned-missing-mapping-hash": (() => {
    const p = flatPayload();
    delete p.v_gate_mapping_hash;
    return p;
  })(),
};
for (const [name, payload] of Object.entries(RESIGNED)) {
  emitSet(name, payload, { includeDetached: false });
}

// ---- tamper set B: mutated after signing. The signature is now wrong, which
// is a different verdict from set A — INVALID (key-binding), not UNVERIFIABLE.
const MUTATED = {
  "tamper-mutated-confidence": (p) => ({ ...p, v_confidence: 0.42 }),
  "tamper-mutated-gate": (p) => ({ ...p, v_gate: "halt" }),
  "tamper-mutated-mapping-hash": (p) => ({ ...p, v_gate_mapping_hash: "0".repeat(64) }),
  "tamper-mutated-exp": (p) => ({ ...p, exp: 1600000000 }),
};
{
  const base = flatPayload();
  const canonical = jcsBytes(base);
  const { ph, sig } = signCompact(HEADER, canonical);
  for (const [name, mutate] of Object.entries(MUTATED)) {
    const mutated = jcsBytes(mutate(base));
    write(`${name}.attached.flattened.json`, { protected: ph, payload: b64u(mutated), signature: sig });
    write(`${name}.payload.json`, mutate(base));
  }
  // Signature bytes themselves flipped, payload intact.
  const flipped = Buffer.from(sig, "base64url");
  flipped[0] ^= 0x01;
  write("tamper-mutated-signature.attached.flattened.json", {
    protected: ph,
    payload: b64u(canonical),
    signature: b64u(flipped),
  });
}

// ---- composed profile ----------------------------------------------------
// General JWS serialization, two issuers over one canonical payload. These
// exist because every published composed fixture stalls at §4.3 step 2 (its
// mapping document was not resolvable from the receipt by any path a stranger
// could follow, as of 2026-07-25; see FINDINGS.md A1), so the AND_PRESENT
// composition and the multi-signer path would otherwise never be exercised
// end-to-end.
function composedPayload(overrides = {}) {
  return {
    receipt_version: "0.3.0-composed",
    envelope_kind: "verification.v0.3+composed",
    subject: { claim_hash: "sha256-27dfce3b87229e59f268c64d50e954a6d7b640bd75557ed0185b622284d0ec1b" },
    v_gate: {
      issuer: "throwaway-gate",
      verdict: "act",
      v_confidence: 0.91,
      v_adversarial_result: "resilient",
      v_recommendation: "confident_supported",
      mapping_id: MAPPING_ID,
      v_gate_mapping_hash: mappingHash,
    },
    v_gate_skill: { issuer: "throwaway-skill", verdict: "act", skill_results: [] },
    composed_decision: "act",
    composed_decision_rule: "AND_PRESENT",
    ...overrides,
  };
}

const COMPOSED_HEADER_A = { alg: "EdDSA", kid, typ: "application/vnd.verification.v0.3+composed+jws" };
const COMPOSED_HEADER_B = { alg: "EdDSA", kid: keyB.kid, typ: "application/vnd.verification.v0.3+composed+jws" };

function emitComposed(name, payloadObj, { breakSecondSignature = false } = {}) {
  write(`${name}.payload.json`, payloadObj);
  const canonical = jcsBytes(payloadObj);
  const a = signCompact(COMPOSED_HEADER_A, canonical, privateKey);
  const b = signCompact(COMPOSED_HEADER_B, canonical, keyB.privateKey);
  let bSig = b.sig;
  if (breakSecondSignature) {
    const raw = Buffer.from(b.sig, "base64url");
    raw[0] ^= 0x01;
    bSig = b64u(raw);
  }
  write(`${name}.general.json`, {
    payload: b64u(canonical),
    signatures: [
      { protected: a.ph, signature: a.sig },
      { protected: b.ph, signature: bSig },
    ],
  });
}

emitComposed("composed-act", composedPayload());
emitComposed(
  "composed-halt",
  composedPayload({
    v_gate_skill: { issuer: "throwaway-skill", verdict: "halt", skill_results: [{ name: "calendar.create_event", status: "flagged" }] },
    composed_decision: "halt",
  }),
);
// Signed composition disagrees with the AND_PRESENT recompute.
emitComposed(
  "composed-rule-violation",
  composedPayload({
    v_gate_skill: { issuer: "throwaway-skill", verdict: "halt", skill_results: [] },
    composed_decision: "act",
  }),
);
// Grammar break: an unresolved sibling pointer must be absent, never null.
emitComposed("composed-null-sibling", composedPayload({ mycelium_trail_id: null }));
// One good signature, one bad — the envelope must not pass on a partial quorum.
emitComposed("composed-one-bad-signature", composedPayload(), { breakSecondSignature: true });

// ---- key material --------------------------------------------------------
mkdirSync(KEYS, { recursive: true });
writeFileSync(
  join(KEYS, "test-throwaway-ed25519.jwks.json"),
  JSON.stringify(
    {
      _warning: "THROWAWAY TEST KEYS. Derived from seeds published in tools/make-throwaway-fixtures.mjs. Never use for anything real.",
      keys: [
        { kty: "OKP", crv: "Ed25519", kid, use: "sig", alg: "EdDSA", x },
        { kty: "OKP", crv: "Ed25519", kid: keyB.kid, use: "sig", alg: "EdDSA", x: keyB.x },
      ],
    },
    null,
    2,
  ) + "\n",
);
writeFileSync(
  join(KEYS, "test-throwaway-ed25519.seed.txt"),
  `THROWAWAY Ed25519 seeds (hex) — published on purpose so these fixtures regenerate.\n` +
    `Anyone holding these can sign as the kids below. That is the point: they prove nothing about anyone.\n\n` +
    `${kid}\n${SEED_HEX}\n\n${keyB.kid}\n${SEED_HEX_B}\n`,
);

console.log(`kid: ${kid}`);
console.log(`kid (second issuer): ${keyB.kid}`);
console.log(`mapping ${MAPPING_ID} digest: ${mappingHash}`);
console.log(`${written.length} fixture files written to fixtures/verification-state/synthetic/`);
