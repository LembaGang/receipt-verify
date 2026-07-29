// Adapter: acta.receipt/0, per draft-farley-acta-signed-receipts-02.
// A copy of the -02 text is in refs/; section references below are to it.
// draft-marques-asqav-compliance-receipts-07 is treated as a PROFILE layered on
// farley, never as a competing normative source — where the two disagree,
// farley decides and the disagreement is reported.
//
// Three things about this format make it unlike the other two adapters:
//
//   * It is not a JWS. The envelope is {payload, signature:{alg,kid,sig}} with
//     a hex signature over JCS bytes (§2.1), so none of src/jws.ts applies
//     except the JWK handling.
//   * The draft gives two incompatible answers for WHICH bytes the signature
//     covers (§4.1 step 2 vs §5.6). We implement §5.6 and detect §4.1.
//   * The draft and its profile give three incompatible answers for the chain
//     digest scope (§5.7 vs marques §5.3 read two ways). We implement §5.7 and
//     detect the other two.
//
// In both cases the rule is the same: recompute under the normative reading,
// and when that fails, say whether the receipt is consistent with a KNOWN
// alternative reading. A detected variant is an explanation attached to a
// refusal. It is never a reason to accept.
//
// The Merkle construction below is deliberately a second, independent
// implementation of the one in tools/make-acta-fixtures.mjs. Sharing the code
// would make the commitment-mode fixtures verify against themselves and prove
// nothing about §5.1-§5.3.

import { createHash, verify as cryptoVerify, type KeyObject } from "node:crypto";
import { jcs } from "@headlessoracle/chirindo/dist/vendor/recorder/index.js";
import type { Adapter, ResolvedKey, VerifyOptions, VerifyResult } from "../types.js";
import { invalid, unverifiable, valid } from "../verdict.js";
import { loadJwksSources, resolveKid, type JwksSource } from "../jwks.js";

export const FORMAT = "acta.receipt/0";

/** §2.1.1: EdDSA is mandatory-to-implement, ES256 SHOULD be supported. */
const VERIFIABLE_ALGS = ["EdDSA", "ES256"] as const;
type VerifiableAlg = (typeof VERIFIABLE_ALGS)[number];

/**
 * §5.8 names ML-DSA-65 as RECOMMENDED for new deployments. Node has no ML-DSA
 * primitive, so a receipt carrying one is something this tool cannot check —
 * which is UNVERIFIABLE, not INVALID and certainly not VALID. Listing the
 * algorithm explicitly lets the refusal say "known algorithm, unimplemented
 * here" rather than "unrecognised".
 */
const KNOWN_UNIMPLEMENTED_ALGS = ["ML-DSA-65", "ML-DSA-44", "ML-DSA-87"];

const GENESIS = "0".repeat(64);
const HEX64 = /^[0-9a-f]{64}$/;

const sha256 = (...parts: Uint8Array[]): Buffer =>
  createHash("sha256").update(Buffer.concat(parts.map((p) => Buffer.from(p)))).digest();
const jcsBytes = (o: unknown): Buffer => Buffer.from(jcs(o), "utf8");
const hex = (b: Uint8Array): string => Buffer.from(b).toString("hex");

// --------------------------------------------------------------------------
// envelope
// --------------------------------------------------------------------------

interface ActaEnvelope {
  payload: Record<string, unknown>;
  signature: { alg: string; kid: string; sig: string };
  /** Any additional top-level members, preserved: they are inside §5.6's scope. */
  rest: Record<string, unknown>;
  /** The envelope exactly as parsed, for the §5.7 chain digest. */
  raw: Record<string, unknown>;
}

type ParseOutcome = { ok: true; env: ActaEnvelope } | { ok: false; detail: string };

function parseEnvelope(bytes: Uint8Array): ParseOutcome {
  let doc: unknown;
  try {
    doc = JSON.parse(Buffer.from(bytes).toString("utf8"));
  } catch (e) {
    return { ok: false, detail: `not valid JSON: ${(e as Error).message}` };
  }
  if (doc === null || typeof doc !== "object" || Array.isArray(doc)) {
    return { ok: false, detail: "receipt is not a JSON object" };
  }
  const o = doc as Record<string, unknown>;
  const payload = o["payload"];
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, detail: "`payload` is missing or not a JSON object (§2.1)" };
  }
  const signature = o["signature"];
  if (signature === null || typeof signature !== "object" || Array.isArray(signature)) {
    // §5.6 calls out null and "" specifically: they are not the same as absent.
    return {
      ok: false,
      detail:
        signature === null
          ? "`signature` is null; §5.6 requires the member be REMOVED, not nulled — a null and an absent member produce different JCS bytes"
          : "`signature` is missing or not a JSON object (§2.1.1)",
    };
  }
  const s = signature as Record<string, unknown>;
  for (const k of ["alg", "kid", "sig"]) {
    if (typeof s[k] !== "string") return { ok: false, detail: `signature.${k} is missing or not a string; §2.1.1 makes it REQUIRED` };
  }
  const rest: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) if (k !== "payload" && k !== "signature") rest[k] = v;

  return {
    ok: true,
    env: {
      payload: payload as Record<string, unknown>,
      signature: { alg: s["alg"] as string, kid: s["kid"] as string, sig: s["sig"] as string },
      rest,
      raw: o,
    },
  };
}

/**
 * Shape probe. Conservative. The other two adapters read JWS, whose `payload`
 * is always a string and whose `signature` is either a string or absent; an
 * object in both positions is unambiguous.
 */
export function detect(bytes: Uint8Array): boolean {
  const p = parseEnvelope(bytes);
  return p.ok;
}

// --------------------------------------------------------------------------
// signature scope — §4.1 step 2 vs §5.6
// --------------------------------------------------------------------------

/**
 * §5.6, operative clause: "Here payload is the receipt object with the
 * signature field removed prior to canonicalization." For a §2.1 envelope that
 * is {"payload":{…}} plus any other top-level members — the wrapper INCLUDED.
 *
 * This is the reading implemented as normative. It is the later, explicitly-
 * normative clarification, it is the only reading that generalizes to the flat
 * receipt shapes the ecosystem actually emits, and it is the reading the one
 * published ACTA-adjacent vector verifies under (FINDINGS.md §E2).
 */
function signingInput56(env: ActaEnvelope): Buffer {
  return jcsBytes({ ...env.rest, payload: env.payload });
}

/**
 * §4.1 step 2 / §2.2, read literally: "Canonicalize the payload", where the
 * payload is the inner object. Different bytes. Computed only to explain a
 * failure under §5.6 — never to reach VALID.
 */
function signingInput41(env: ActaEnvelope): Buffer {
  return jcsBytes(env.payload);
}

function verifyRaw(input: Uint8Array, sigBytes: Buffer, key: KeyObject, alg: VerifiableAlg): boolean {
  try {
    if (alg === "EdDSA") {
      if (key.asymmetricKeyType !== "ed25519") return false;
      return cryptoVerify(null, input, key, sigBytes);
    }
    if (key.asymmetricKeyType !== "ec") return false;
    // §2.1.1 fixes the hex encoding of the raw signature; for ES256 that is
    // JOSE R||S, not DER.
    if (sigBytes.length !== 64) return false;
    return cryptoVerify("sha256", input, { key, dsaEncoding: "ieee-p1363" }, sigBytes);
  } catch {
    return false;
  }
}

// --------------------------------------------------------------------------
// commitment mode — §5.1 to §5.5
// --------------------------------------------------------------------------

/** §5.1: the largest power of two STRICTLY less than n. */
function splitPoint(n: number): number {
  let k = 1;
  while (k * 2 < n) k *= 2;
  return k;
}

/** §5.1: leaf domain separator 0x00, internal 0x01, recursive split, no padding. */
function merkleRoot(leaves: Buffer[]): Buffer {
  if (leaves.length === 1) return leaves[0]!;
  const k = splitPoint(leaves.length);
  return sha256(Buffer.from([0x01]), merkleRoot(leaves.slice(0, k)), merkleRoot(leaves.slice(k)));
}

/** §5.2 canonical leaf: JCS({name, salt, value}), then §5.1's 0x00 prefix. */
function leafHash(name: string, salt: string, value: unknown): Buffer {
  return sha256(Buffer.from([0x00]), jcsBytes({ name, salt, value }));
}

interface Disclosure {
  name: string;
  value: unknown;
  salt: string;
  proof?: { index: number; tree_size: number; siblings: string[] };
}

/**
 * §5.5: walk an inclusion proof back to a root. Siblings arrive leaf-to-root,
 * so the LAST one is the top-level split. Whether a sibling sits left or right
 * is not carried in the proof — §5.5 does not include a direction bit — but it
 * is recoverable from (index, tree_size) via the §5.1 split rule, which is why
 * the proof is well-formed without one.
 */
function rootFromProof(leaf: Buffer, index: number, treeSize: number, siblings: string[]): Buffer | null {
  if (treeSize === 1) return siblings.length === 0 && index === 0 ? leaf : null;
  if (siblings.length === 0) return null;
  const k = splitPoint(treeSize);
  const top = siblings[siblings.length - 1]!;
  if (!HEX64.test(top)) return null;
  const topBytes = Buffer.from(top, "hex");
  const below = siblings.slice(0, -1);
  if (index < k) {
    const left = rootFromProof(leaf, index, k, below);
    return left === null ? null : sha256(Buffer.from([0x01]), left, topBytes);
  }
  const right = rootFromProof(leaf, index - k, treeSize - k, below);
  return right === null ? null : sha256(Buffer.from([0x01]), topBytes, right);
}

/** §5.3: byte-lexicographic on UTF-8 names. No collation, no case folding. */
function sortByName(ds: Disclosure[]): Disclosure[] {
  return [...ds].sort((a, b) => Buffer.compare(Buffer.from(a.name, "utf8"), Buffer.from(b.name, "utf8")));
}

type CommitmentOutcome =
  | { kind: "match"; leaves: number }
  | { kind: "mismatch"; detail: string }
  | { kind: "malformed"; detail: string };

function checkCommitment(root: string, ds: Disclosure[]): CommitmentOutcome {
  if (ds.length === 0) return { kind: "malformed", detail: "disclosure set is empty" };
  for (const d of ds) {
    if (typeof d.name !== "string" || typeof d.salt !== "string") {
      return { kind: "malformed", detail: "each disclosure needs a string `name` and a string `salt` (§5.5)" };
    }
    // §5.4: salts MUST be at least 16 bytes. base64url-unpadded per §5.2.
    const saltBytes = Buffer.from(d.salt, "base64url");
    if (saltBytes.length < 16) {
      return { kind: "malformed", detail: `salt for ${d.name} decodes to ${saltBytes.length} bytes; §5.4 requires at least 16` };
    }
  }

  const sorted = sortByName(ds);
  const leaves = sorted.map((d) => leafHash(d.name, d.salt, d.value));

  // Path 1: the disclosure set is complete, so the root is directly recomputable.
  const direct = hex(merkleRoot(leaves));
  if (direct !== root) {
    return {
      kind: "mismatch",
      detail: `Merkle root over ${leaves.length} disclosed leaves recomputes to ${direct}, receipt commits ${root}`,
    };
  }

  // Path 2: §5.5 inclusion proofs, checked independently of path 1. A proof
  // that disagrees with the tree it was cut from is exactly §5.10's "tampered
  // Merkle proof MUST fail verification" case.
  for (const [i, d] of sorted.entries()) {
    if (d.proof === undefined) continue;
    const { index, tree_size, siblings } = d.proof;
    if (!Number.isInteger(index) || !Number.isInteger(tree_size) || !Array.isArray(siblings)) {
      return { kind: "malformed", detail: `inclusion proof for ${d.name} is not {index, tree_size, siblings} (§5.5)` };
    }
    if (index !== i || tree_size !== leaves.length) {
      return {
        kind: "mismatch",
        detail: `inclusion proof for ${d.name} claims index ${index} of ${tree_size}, but §5.3 sort order puts it at index ${i} of ${leaves.length}`,
      };
    }
    const walked = rootFromProof(leaves[i]!, index, tree_size, siblings);
    if (walked === null || hex(walked) !== root) {
      return {
        kind: "mismatch",
        detail: `inclusion proof for ${d.name} walks to ${walked === null ? "no root (malformed sibling list)" : hex(walked)}, receipt commits ${root}`,
      };
    }
  }
  return { kind: "match", leaves: leaves.length };
}

// --------------------------------------------------------------------------
// chain digest — §5.7 vs marques §5.3
// --------------------------------------------------------------------------

/**
 * The three candidate digest scopes for `previousReceiptHash`.
 *
 * `farley-5.7` is normative here. §5.7 is unambiguous on its own terms: "the
 * entire signed receipt object including the signature field", with the stated
 * purpose that re-signing an identical payload yields a distinct link.
 *
 * marques §5.3 claims to populate the field "per the digest-scope rule of
 * Section 5.7 of [ACTA-RECEIPTS]" and then specifies a signature-EXCLUSIVE
 * scope, asserting that it "matches Section 5.7". It does not. Worse, §5.3's
 * operative exclusion ("NOT the envelope object that additionally includes the
 * signature or anchors top-level keys") and its rationale ("the same bytes the
 * predecessor's cryptographic signature covers") select DIFFERENT byte strings
 * from each other, because under farley §5.6 the signed bytes retain the
 * top-level wrapper. Hence two marques variants, not one.
 */
const CHAIN_SCOPES = [
  { name: "farley-5.7", note: "entire signed receipt object, signature included", of: (e: ActaEnvelope) => hex(sha256(jcsBytes(e.raw))) },
  { name: "marques-5.3-payload", note: "inner payload member only, signature-exclusive", of: (e: ActaEnvelope) => hex(sha256(jcsBytes(e.payload))) },
  { name: "marques-5.3-signing-input", note: "the bytes the signature covers per §5.6, signature-exclusive", of: (e: ActaEnvelope) => hex(sha256(signingInput56(e))) },
] as const;

// --------------------------------------------------------------------------

function str(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

/** §2.2: RFC 3339 with a timezone designator, which the draft makes explicit. */
function parseIssuedAt(s: string): number | null {
  if (!/[Zz]$|[+-]\d{2}:?\d{2}$/.test(s)) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? Math.floor(t / 1000) : null;
}

export const actaAdapter: Adapter = {
  format: FORMAT,
  detect,

  async verify(bytes: Uint8Array, opts: VerifyOptions): Promise<VerifyResult> {
    const p = parseEnvelope(bytes);
    if (!p.ok) return unverifiable(FORMAT, "malformed_receipt", p.detail, undefined, "envelope_shape");
    const env = p.env;
    const { alg, kid, sig } = env.signature;

    // ---- §2.1.1 signature object ------------------------------------------
    if (!/^[0-9a-f]+$/.test(sig) || sig.length % 2 !== 0) {
      return unverifiable(
        FORMAT,
        "malformed_receipt",
        `signature.sig is not lowercase hexadecimal; §2.1.1 fixes the encoding (${sig.length} chars given)`,
        undefined,
        "signature_encoding",
      );
    }
    if (!(VERIFIABLE_ALGS as readonly string[]).includes(alg)) {
      const known = KNOWN_UNIMPLEMENTED_ALGS.includes(alg);
      return unverifiable(
        FORMAT,
        "unsupported_algorithm",
        known
          ? `signature.alg is ${alg}: named by §5.8 but not implemented by this tool, so the signature cannot be checked either way`
          : `signature.alg is ${JSON.stringify(alg)}; this tool verifies ${VERIFIABLE_ALGS.join(" and ")} (§2.1.1)`,
        undefined,
        known ? "mldsa65_signature" : "algorithm_supported",
      );
    }
    const verifiableAlg = alg as VerifiableAlg;

    // ---- §4.2 step 4 / §4.3 key resolution --------------------------------
    if (!opts.jwks) {
      return unverifiable(
        FORMAT,
        "key_unresolvable",
        "no JWKS source given (--jwks); §4.2 step 4 resolves the key from the issuer's published JWK Set (§4.3, /.well-known/acta-keys.json)",
        undefined,
        "key_resolution",
      );
    }
    let sources: JwksSource[];
    try {
      sources = await loadJwksSources(opts.jwks);
    } catch (e) {
      return unverifiable(FORMAT, "io_error", `could not read JWKS at ${opts.jwks}: ${(e as Error).message}`, undefined, "key_resolution");
    }
    const resolved = resolveKid(sources, kid);
    if (!resolved.ok) {
      const e = resolved.error;
      const detail =
        e.kind === "not_found"
          ? `no key for kid ${kid} in ${e.origin}`
          : e.kind === "duplicate_kid"
            ? `more than one distinct key for kid ${kid} in ${e.origin}`
            : e.kind === "unsupported_key"
              ? `key for kid ${kid} at ${e.origin} is unsupported: ${e.message}`
              : `malformed JWKS at ${e.origin}: ${e.message}`;
      return unverifiable(FORMAT, "key_unresolvable", detail, undefined, "key_resolution");
    }
    const key: ResolvedKey = {
      kid,
      thumbprint: resolved.value.thumbprint,
      alg,
      origin: resolved.value.origin,
    };

    // Past this point a published key IS resolved, so INVALID is reachable.
    const sigBytes = Buffer.from(sig, "hex");

    // ---- §4.2 step 5, under the §5.6 scope --------------------------------
    if (!verifyRaw(signingInput56(env), sigBytes, resolved.value.key, verifiableAlg)) {
      // Not a valid signature over the normative bytes. Before refusing, find
      // out whether it IS one over the OTHER reading the draft admits, so the
      // refusal can name the disagreement instead of just reporting a failure.
      const alt = verifyRaw(signingInput41(env), sigBytes, resolved.value.key, verifiableAlg);
      return invalid(
        FORMAT,
        "signature_invalid",
        alt
          ? "signature does not verify over the §5.6 bytes (receipt object minus `signature`), but DOES verify over the §4.1 step 2 bytes (the inner `payload` member alone). The draft specifies both: §4.1 says canonicalize the payload, §5.6 says canonicalize the receipt minus the signature. This tool implements §5.6 and refuses rather than pick the reading that happens to pass — see FINDINGS.md §E2"
          : "signature does not verify over the §5.6 bytes (receipt object minus `signature`), and does not verify over the §4.1 step 2 bytes either",
        key,
        "signature_scope_5_6",
      );
    }

    // The signature is good. Every refusal below reports how far the check got,
    // so "the signature is bad" stays distinguishable from "the signature is
    // fine and something downstream could not be completed" — without the
    // latter ever becoming a claim that the receipt verified.
    const annotations: Record<string, string | number | boolean> = {
      signature_scope: "farley-5.6 (receipt object minus `signature`)",
      alg,
    };
    const stalled = (reason: Parameters<typeof unverifiable>[1], detail: string, check: string): VerifyResult =>
      unverifiable(FORMAT, reason, detail, { ...annotations, signature_check: "passed" }, check);

    // ---- §2.2 common payload fields ---------------------------------------
    const type = str(env.payload["type"]);
    const issuedAt = str(env.payload["issued_at"]);
    const issuerId = str(env.payload["issuer_id"]);
    if (type === null) return stalled("malformed_member", "payload.type missing or not a string; §2.2 makes it REQUIRED", "common_payload_fields");
    if (issuedAt === null) return stalled("malformed_member", "payload.issued_at missing or not a string; §2.2 makes it REQUIRED", "common_payload_fields");
    if (issuerId === null) return stalled("malformed_member", "payload.issuer_id missing or not a string; §2.2 makes it REQUIRED", "common_payload_fields");

    const at = parseIssuedAt(issuedAt);
    if (at === null) {
      return stalled(
        "malformed_member",
        `payload.issued_at ${JSON.stringify(issuedAt)} is not an RFC 3339 timestamp with a timezone designator; §2.2 requires one`,
        "common_payload_fields",
      );
    }

    // §2.2: issuer_id "MUST match the kid field in the signature object". The
    // key resolved, and the receipt provably fails to bind to it.
    if (issuerId !== kid) {
      return invalid(
        FORMAT,
        "key_binding_mismatch",
        `payload.issuer_id is ${JSON.stringify(issuerId)} but signature.kid is ${JSON.stringify(kid)}; §2.2 requires them to match`,
        key,
        "issuer_id_kid_binding",
      );
    }

    annotations["receipt_type"] = type;
    const decision = str(env.payload["decision"]);
    if (decision !== null) annotations["receipt_gate"] = decision;

    // §8.1 recommends rejecting receipts older than 24h as replay protection.
    // Enforcing that by default would defeat §1's offline-audit goal, which is
    // the point of the format — so the age is REPORTED and the policy is left
    // to the caller. See FINDINGS.md §E7.
    const now = opts.now ?? Math.floor(Date.now() / 1000);
    annotations["receipt_age_hours"] = Math.round(((now - at) / 3600) * 10) / 10;

    // ---- §5 commitment mode ------------------------------------------------
    const rootRaw = env.payload["committed_fields_root"];
    if (rootRaw !== undefined) {
      const root = str(rootRaw);
      if (root === null || !HEX64.test(root)) {
        return stalled(
          "malformed_member",
          `committed_fields_root is ${JSON.stringify(rootRaw)}; §5.1 requires the lowercase hex encoding of a 32-byte root`,
          "commitment_root",
        );
      }
      if (opts.disclosures === undefined) {
        annotations["commitment_check"] = "not performed (no --disclose)";
      } else {
        let ds: Disclosure[];
        try {
          const doc: unknown = JSON.parse(Buffer.from(opts.disclosures).toString("utf8"));
          const list = Array.isArray(doc) ? doc : (doc as { disclosures?: unknown })?.disclosures;
          if (!Array.isArray(list)) throw new Error("expected an array, or an object with a `disclosures` array");
          ds = list as Disclosure[];
        } catch (e) {
          return stalled("malformed_member", `--disclose is not a readable disclosure set: ${(e as Error).message}`, "commitment_root");
        }
        const c = checkCommitment(root, ds);
        if (c.kind === "malformed") return stalled("malformed_member", `disclosure set: ${c.detail}`, "commitment_root");
        if (c.kind === "mismatch") return invalid(FORMAT, "content_commitment_mismatch", c.detail, key, "commitment_root");
        annotations["commitment_check"] = `passed (${c.leaves} leaves)`;
      }
    }

    // ---- §5.7 chain linkage ------------------------------------------------
    const prevRaw = env.payload["previousReceiptHash"];
    if (prevRaw !== undefined) {
      const prev = str(prevRaw);
      if (prev === null || !HEX64.test(prev)) {
        return stalled(
          "malformed_member",
          `previousReceiptHash is ${JSON.stringify(prevRaw)}; §5.7 requires the lowercase hex encoding of a SHA-256 digest`,
          "chain_linkage",
        );
      }
      if (prev === GENESIS) {
        // The all-zero genesis is marques §5.3's stipulation. farley §5.7
        // specifies only the scope of subsequent links, so a chain root has no
        // normative representation upstream — recorded, not asserted.
        annotations["chain_link"] = "genesis (all-zero; marques §5.3 stipulation, not specified by farley §5.7)";
      } else if (opts.previousReceipt === undefined) {
        annotations["chain_link"] = "present but not checked (no --prev)";
      } else {
        const pp = parseEnvelope(opts.previousReceipt);
        if (!pp.ok) return stalled("malformed_member", `--prev is not a readable ACTA receipt: ${pp.detail}`, "chain_linkage");

        const computed = CHAIN_SCOPES.map((s) => ({ ...s, value: s.of(pp.env) }));
        const normative = computed[0]!;
        if (normative.value === prev) {
          annotations["chain_digest_scope"] = normative.name;
          annotations["chain_link"] = "verified against --prev";
        } else {
          const variant = computed.slice(1).find((c) => c.value === prev);
          return invalid(
            FORMAT,
            "chain_linkage_broken",
            variant
              ? `previousReceiptHash does not match the predecessor under §5.7 (expected ${normative.value}), but DOES match it under ${variant.name} — ${variant.note}. draft-marques-asqav-compliance-receipts-07 §5.3 mandates that signature-exclusive scope while citing farley §5.7 as its authority; the two scopes digest different bytes. This tool implements §5.7 and refuses rather than accept either silently — see FINDINGS.md §E3`
              : `previousReceiptHash ${prev} does not match the predecessor under §5.7 (${normative.value}), nor under either signature-exclusive reading of marques §5.3 (${computed[1]!.value}, ${computed[2]!.value})`,
            key,
            "chain_linkage",
          );
        }
      }
    }

    return valid(FORMAT, `signature and all recomputable §4.2/§5 checks passed`, key, annotations);
  },
};
