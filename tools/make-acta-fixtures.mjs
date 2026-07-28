// make-acta-fixtures.mjs — synthesize the ACTA fixtures that no published
// artifact provides.
//
// Run: node tools/make-acta-fixtures.mjs
//
// draft-farley-acta-signed-receipts-02 §5.10 says an interoperability test
// suite "is published alongside this draft" and lists a six-item minimum set.
// The only locator the draft gives for such a suite is
// [I-D.agent-governance-testvectors], and that repository publishes none of the
// six (FINDINGS.md §E1). This script builds the six locally so the adapter has
// something to be held to, and so a reader can diff our construction against
// the draft's prose line by line.
//
// These are OUR fixtures, not the draft author's. They are named `synthetic/`
// and listed separately in fixtures/provenance.md for that reason. Where the
// draft is ambiguous the ambiguity is materialized as SEPARATE fixtures — one
// per reading — rather than resolved silently; that is what the `sigscope-*`
// and `chain-*` families are.
//
// KEY CUSTODY. Every key here derives from a seed written in plain sight below.
// The Ed25519 seeds are the same throwaway seeds tools/make-throwaway-fixtures.mjs
// publishes; the P-256 scalar is fixed and equally worthless. No key belonging
// to any real signer is read, referenced, or required anywhere in this repo.

import { createHash, createPrivateKey, createPublicKey, sign as cryptoSign } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const canonicalize = require("canonicalize");

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(ROOT, "fixtures", "acta", "synthetic");
const KEYS = join(ROOT, "fixtures", "acta", "keys");

// Same published throwaway seeds as the verification.* fixtures.
const SEED_A = "746573742d7468726f77617761792d726563656970742d7665726966792d3031";
const SEED_B = "746573742d7468726f77617761792d726563656970742d7665726966792d3032";
// A fixed P-256 scalar, for the §2.1.1 "SHOULD support ES256" path.
const P256_D = "4a1f0c2b8d3e6f7a9b0c1d2e3f405162738495a6b7c8d9eafb0c1d2e3f405162";

const jcsBytes = (o) => Buffer.from(canonicalize(o), "utf8");
const sha256 = (...parts) => createHash("sha256").update(Buffer.concat(parts.map(Buffer.from))).digest();
const hex = (b) => Buffer.from(b).toString("hex");

// ----------------------------------------------------------------- keys ---

/** base58 (Bitcoin alphabet), for the §2.1.1 RECOMMENDED `sb:issuer:<fp>` kid. */
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function base58(bytes) {
  let n = 0n;
  for (const b of bytes) n = (n << 8n) | BigInt(b);
  let s = "";
  while (n > 0n) {
    s = B58[Number(n % 58n)] + s;
    n /= 58n;
  }
  for (const b of bytes) {
    if (b !== 0) break;
    s = "1" + s;
  }
  return s;
}

function ed25519(seedHex) {
  const pkcs8 = Buffer.concat([
    Buffer.from("302e020100300506032b657004220420", "hex"),
    Buffer.from(seedHex, "hex"),
  ]);
  const privateKey = createPrivateKey({ key: pkcs8, format: "der", type: "pkcs8" });
  const jwk = createPublicKey(privateKey).export({ format: "jwk" });
  const raw = Buffer.from(jwk.x, "base64url");
  return { privateKey, jwk, kid: `sb:issuer:${base58(raw).slice(0, 12)}`, alg: "EdDSA" };
}

function p256(dHex) {
  // SEC1 ECPrivateKey (RFC 5915) carrying only the scalar; OpenSSL derives the
  // public point. Keeps the fixture deterministic without pinning x/y by hand.
  const oid = Buffer.from("06082a8648ce3d030107", "hex");
  const params = Buffer.concat([Buffer.from([0xa0, oid.length]), oid]);
  const body = Buffer.concat([
    Buffer.from([0x02, 0x01, 0x01]),
    Buffer.from([0x04, 0x20]),
    Buffer.from(dHex, "hex"),
    params,
  ]);
  const sec1 = Buffer.concat([Buffer.from([0x30, body.length]), body]);
  const privateKey = createPrivateKey({ key: sec1, format: "der", type: "sec1" });
  const jwk = createPublicKey(privateKey).export({ format: "jwk" });
  const raw = Buffer.concat([Buffer.from(jwk.x, "base64url"), Buffer.from(jwk.y, "base64url")]);
  return { privateKey, jwk, kid: `sb:issuer:${base58(raw).slice(0, 12)}`, alg: "ES256" };
}

const A = ed25519(SEED_A);
const B = ed25519(SEED_B);
const E = p256(P256_D);

// -------------------------------------------------------------- signing ---

function signBytes(input, signer) {
  return signer.alg === "EdDSA"
    ? hex(cryptoSign(null, input, signer.privateKey))
    : hex(cryptoSign("sha256", input, { key: signer.privateKey, dsaEncoding: "ieee-p1363" }));
}

/**
 * The §5.6 operative clause: the signature covers JCS of "the receipt object
 * with the signature field removed". For a §2.1 envelope that is {"payload":…},
 * INCLUDING the top-level wrapper. This is the reading the one published ACTA-
 * adjacent vector verifies under (FINDINGS.md §E2).
 */
function signingInput56(payload) {
  return jcsBytes({ payload });
}

/**
 * The §4.1 step 2 reading: "Canonicalize the payload", where §2.2 defines the
 * payload as the inner object. Produces different bytes from signingInput56.
 */
function signingInput41(payload) {
  return jcsBytes(payload);
}

function envelope(payload, signer = A, scope = signingInput56) {
  return {
    payload,
    signature: { alg: signer.alg, kid: signer.kid, sig: signBytes(scope(payload), signer) },
  };
}

// ------------------------------------------------------- commitment mode ---

/** §5.4: fixed, reproducible salts. §5.10 requires non-random salts in vectors. */
const saltFor = (name) => sha256(Buffer.from(`acta-testvector-salt:${name}`, "utf8"));
const saltB64u = (name) => saltFor(name).toString("base64url");

/** §5.2 canonical leaf, §5.1 leaf domain separator 0x00. */
function leafHash(name, value) {
  return sha256(Buffer.from([0x00]), jcsBytes({ name, salt: saltB64u(name), value }));
}

/** §5.1: largest power of two STRICTLY less than n. */
function splitPoint(n) {
  let k = 1;
  while (k * 2 < n) k *= 2;
  return k;
}

/** §5.1 recursive root; §5.3 requires D to already be name-sorted. */
export function merkleRoot(D) {
  if (D.length === 1) return D[0];
  const k = splitPoint(D.length);
  return sha256(Buffer.from([0x01]), merkleRoot(D.slice(0, k)), merkleRoot(D.slice(k)));
}

/** §5.5 inclusion proof: siblings ordered leaf-to-root. */
function inclusionProof(D, index) {
  if (D.length === 1) return [];
  const k = splitPoint(D.length);
  return index < k
    ? [...inclusionProof(D.slice(0, k), index), merkleRoot(D.slice(k))]
    : [...inclusionProof(D.slice(k), index - k), merkleRoot(D.slice(0, k))];
}

/** §5.3: byte-lexicographic order of the UTF-8 encoded name. No collation. */
function sortedFields(fields) {
  return [...fields].sort((a, b) =>
    Buffer.compare(Buffer.from(a.name, "utf8"), Buffer.from(b.name, "utf8")),
  );
}

function commit(fields) {
  const sorted = sortedFields(fields);
  const D = sorted.map((f) => leafHash(f.name, f.value));
  const root = merkleRoot(D);
  const disclosures = sorted.map((f, i) => ({
    name: f.name,
    value: f.value,
    salt: saltB64u(f.name),
    proof: { index: i, tree_size: D.length, siblings: inclusionProof(D, i).map(hex) },
  }));
  return { root: hex(root), disclosures };
}

// --------------------------------------------------------------- chains ---

const GENESIS = "0".repeat(64);

/**
 * The three candidate chain-digest scopes. `farley` is normative here; the other
 * two exist so the adapter's contradiction detection has something to detect.
 * See FINDINGS.md §E3 and §E4 for why there are three and not two.
 */
const CHAIN_SCOPE = {
  // §5.7: "SHA-256(JCS(receipt)), where receipt is the entire signed receipt
  // object including the signature field".
  farley: (env) => hex(sha256(jcsBytes(env))),
  // marques §5.3 operative exclusion: "the predecessor's signed payload object
  // … NOT the envelope object that additionally includes the signature or
  // anchors top-level keys" — the inner payload member.
  "marques-payload": (env) => hex(sha256(jcsBytes(env.payload))),
  // marques §5.3 rationale: "the same bytes the predecessor's cryptographic
  // signature covers" — which under farley §5.6 is the envelope minus the
  // signature, i.e. WITH the top-level wrapper.
  "marques-signing-input": (env) => hex(sha256(signingInput56(env.payload))),
};

function buildChain(scopeName, signer = A) {
  const scope = CHAIN_SCOPE[scopeName];
  const out = [];
  let prev = GENESIS;
  for (let i = 1; i <= 3; i++) {
    const env = envelope(
      {
        type: "protectmcp:decision",
        issued_at: `2026-06-28T12:0${i}:00Z`,
        issuer_id: signer.kid,
        tool_name: ["Read", "Bash", "Write"][i - 1],
        decision: i === 3 ? "deny" : "allow",
        reason: i === 3 ? "tier_insufficient" : undefined,
        policy_digest: "sha256:cb6f676694ae1d2b12c25e7d82b830825c4590f091829689ee13a964224c82eb",
        sequence: i,
        previousReceiptHash: prev,
      },
      signer,
    );
    out.push(env);
    prev = scope(env);
  }
  return out;
}

// ---------------------------------------------------------------- output ---

const written = [];
function write(rel, obj) {
  const abs = join(OUT, rel);
  mkdirSync(dirname(abs), { recursive: true });
  // Two-space JSON with a trailing newline, matching the published corpora.
  writeFileSync(abs, JSON.stringify(obj, null, 2) + "\n", "utf8");
  written.push(rel);
}

// JSON.stringify drops undefined members, which is what we want for the
// optional `reason` above — but be explicit that it is deliberate.
const prune = (o) => JSON.parse(JSON.stringify(o));

// --- §5.10 item 1: cleartext receipt, no committed_fields_root -------------
const cleartext = envelope({
  type: "protectmcp:decision",
  issued_at: "2026-06-28T12:00:00Z",
  issuer_id: A.kid,
  tool_name: "delete_database",
  decision: "deny",
  reason: "tier_insufficient",
  agent_tier: "signed-known",
  required_tier: "privileged",
  policy_digest: "sha256:a8f3c91e5b2d4a6f8c0e1d3b5a7f9c2e4d6b8a0f1c3e5d7b9a1f3c5e7d9b1f3c",
  session_id: "ses_7f8a2b",
});
write("cleartext.receipt.json", cleartext);
write("cleartext.signing-input.json", {
  _note:
    "The exact bytes the signature covers, per §5.6. Recorded as a separate artifact so a second implementation can byte-compare its canonicalization without re-deriving our reading of §5.6.",
  scope: "farley-5.6 (receipt object minus `signature`)",
  jcs: signingInput56(cleartext.payload).toString("utf8"),
  sha256: hex(sha256(signingInput56(cleartext.payload))),
});

// --- §5.10 item 2: four committed fields -----------------------------------
{
  const c = commit([
    { name: "agent_tier", value: "signed-known" },
    { name: "decision", value: "deny" },
    { name: "session_id", value: "ses_7f8a2b" },
    { name: "tool_name", value: "delete_database" },
  ]);
  write(
    "committed-4.receipt.json",
    envelope({
      type: "protectmcp:decision",
      issued_at: "2026-06-28T12:10:00Z",
      issuer_id: A.kid,
      committed_fields_root: c.root,
    }),
  );
  write("committed-4.disclosures.json", { disclosures: c.disclosures });

  // §5.10 item 4: a tampered Merkle proof MUST fail verification. One sibling
  // hash has its first byte flipped; everything else is untouched.
  const bad = JSON.parse(JSON.stringify(c.disclosures));
  const target = bad.find((d) => d.proof.siblings.length > 0);
  const s = target.proof.siblings[0];
  target.proof.siblings[0] = (s[0] === "0" ? "1" : "0") + s.slice(1);
  write("tamper-merkle-proof.disclosures.json", { disclosures: bad });
}

// --- §5.10 item 6: five committed fields (non-power-of-two) ----------------
{
  const c = commit([
    { name: "agent_tier", value: "evidenced" },
    { name: "decision", value: "allow" },
    { name: "required_tier", value: "signed-known" },
    { name: "session_id", value: "ses_11c4de" },
    { name: "tool_name", value: "http.get" },
  ]);
  write(
    "committed-5.receipt.json",
    envelope({
      type: "protectmcp:decision",
      issued_at: "2026-06-28T12:11:00Z",
      issuer_id: A.kid,
      committed_fields_root: c.root,
    }),
  );
  write("committed-5.disclosures.json", { disclosures: c.disclosures });
}

// --- §5.10 item 3: a chain of three, under each candidate digest scope ------
for (const scope of Object.keys(CHAIN_SCOPE)) {
  buildChain(scope).forEach((env, i) => write(`chain-${scope}/00${i + 1}.receipt.json`, prune(env)));
}

// --- §5.10 item 5: an algorithm-mixed chain --------------------------------
// The draft's example is Ed25519 followed by ML-DSA-65. Node has no ML-DSA, so
// the mixed chain here is EdDSA followed by ES256 — which still exercises the
// §5.8 requirement that each receipt be checked against its OWN signature.alg.
// The ML-DSA-65 leg is covered by `alg-mldsa65.receipt.json` below instead.
{
  const r1 = envelope(
    { type: "protectmcp:decision", issued_at: "2026-06-28T12:20:00Z", issuer_id: A.kid, tool_name: "Read", decision: "allow", sequence: 1, previousReceiptHash: GENESIS },
    A,
  );
  const r2 = envelope(
    { type: "protectmcp:decision", issued_at: "2026-06-28T12:21:00Z", issuer_id: E.kid, tool_name: "Write", decision: "allow", sequence: 2, previousReceiptHash: CHAIN_SCOPE.farley(r1) },
    E,
  );
  write("chain-mixed-alg/001.receipt.json", r1);
  write("chain-mixed-alg/002.receipt.json", r2);
}

// --- signature-scope contradiction ------------------------------------------
// Same payload, signed over the §4.1 bytes instead of the §5.6 bytes. A
// verifier implementing §5.6 must not accept it, and must be able to say WHY.
write(
  "sigscope-4.1.receipt.json",
  envelope(
    {
      type: "protectmcp:decision",
      issued_at: "2026-06-28T12:30:00Z",
      issuer_id: A.kid,
      tool_name: "Read",
      decision: "allow",
    },
    A,
    signingInput41,
  ),
);

// --- tamper matrix ----------------------------------------------------------

// A payload value mutated after signing. Signature is left intact.
{
  const t = JSON.parse(JSON.stringify(cleartext));
  t.payload.decision = "allow";
  write("tamper-payload-mutated.receipt.json", t);
}

// One bit of the signature flipped.
{
  const t = JSON.parse(JSON.stringify(cleartext));
  const s = t.signature.sig;
  t.signature.sig = (s[0] === "0" ? "1" : "0") + s.slice(1);
  write("tamper-signature-bitflip.receipt.json", t);
}

// §2.2: issuer_id MUST match the signature's kid. Re-signed, so the signature
// itself is good — the receipt is internally inconsistent, not corrupt.
write(
  "tamper-issuer-kid-mismatch.receipt.json",
  envelope({
    type: "protectmcp:decision",
    issued_at: "2026-06-28T12:40:00Z",
    issuer_id: B.kid,
    tool_name: "Read",
    decision: "allow",
  }),
);

// A committed_fields_root that does not match the disclosed leaves. Re-signed,
// so this is a content-commitment failure and not a signature failure.
{
  const c = commit([
    { name: "agent_tier", value: "signed-known" },
    { name: "decision", value: "deny" },
    { name: "session_id", value: "ses_7f8a2b" },
    { name: "tool_name", value: "delete_database" },
  ]);
  const wrong = (c.root[0] === "0" ? "1" : "0") + c.root.slice(1);
  write(
    "tamper-merkle-root.receipt.json",
    envelope({
      type: "protectmcp:decision",
      issued_at: "2026-06-28T12:41:00Z",
      issuer_id: A.kid,
      committed_fields_root: wrong,
    }),
  );
}

// A chain link pointing at a digest that is not the predecessor under ANY of
// the three candidate scopes. Distinguishes "broken chain" from "chain built
// to a different reading of the spec".
{
  const chain = buildChain("farley");
  const t = envelope({ ...chain[1].payload, previousReceiptHash: "f".repeat(64) });
  write("tamper-chain-broken.receipt.json", t);
}

// kid that resolves nowhere in the published JWKS.
write(
  "unresolvable-kid.receipt.json",
  (() => {
    const e = JSON.parse(JSON.stringify(cleartext));
    e.signature.kid = "sb:issuer:NotPublished";
    return e;
  })(),
);

// §5.8 lists ML-DSA-65 as RECOMMENDED. This tool cannot verify it, and the
// fail-closed answer to "I cannot check this" is UNVERIFIABLE, never VALID.
write(
  "alg-mldsa65.receipt.json",
  (() => {
    const e = JSON.parse(JSON.stringify(cleartext));
    e.signature.alg = "ML-DSA-65";
    return e;
  })(),
);

// §2.1.1 requires lowercase hex. Not hex at all.
write(
  "malformed-sig-not-hex.receipt.json",
  (() => {
    const e = JSON.parse(JSON.stringify(cleartext));
    e.signature.sig = "zz" + e.signature.sig.slice(2);
    return e;
  })(),
);

// §5.6: the signature field MUST be REMOVED before canonicalizing, "not set to
// null or to the empty string; these produce different JCS output".
write(
  "malformed-sig-nulled.receipt.json",
  (() => {
    const e = JSON.parse(JSON.stringify(cleartext));
    e.signature = null;
    return e;
  })(),
);

// --------------------------------------------------------------- JWKS ------
mkdirSync(KEYS, { recursive: true });
writeFileSync(
  join(KEYS, "acta-throwaway.jwks.json"),
  JSON.stringify(
    {
      _warning:
        "THROWAWAY TEST KEYS. Ed25519 seeds are published in tools/make-throwaway-fixtures.mjs; the P-256 scalar is published in tools/make-acta-fixtures.mjs. Never use for anything real.",
      _shape: "draft-farley-acta-signed-receipts-02 §4.3 (/.well-known/acta-keys.json)",
      keys: [
        { ...A.jwk, kid: A.kid, use: "sig", alg: "EdDSA" },
        { ...B.jwk, kid: B.kid, use: "sig", alg: "EdDSA" },
        { ...E.jwk, kid: E.kid, use: "sig", alg: "ES256" },
      ],
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

console.log(`fixtures/acta/keys/acta-throwaway.jwks.json`);
console.log(`  kid A (EdDSA) ${A.kid}`);
console.log(`  kid B (EdDSA) ${B.kid}`);
console.log(`  kid E (ES256) ${E.kid}`);
for (const w of written) console.log(`fixtures/acta/synthetic/${w.replace(/\\/g, "/")}`);
console.log(`\n${written.length} fixtures + 1 JWKS`);
