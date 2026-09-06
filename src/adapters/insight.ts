// Adapter: insight.attestation/eip712.
//
// `insight.attestation/eip712` is OUR label for this format. Insight publishes
// no format name and no specification prose. The only document it publishes is
// the key registry at /.well-known/oracle-keys.json — pinned by digest in
// refs/insight-oracle-keys-2026-09-02.json and named in the coverage manifest as
// the sole external source. Everything else below is read out of the artefacts
// themselves and out of EIP-712.
//
// The EIP-712 encoding here is written FROM EIP-712, not taken from a library.
// That is the whole point of this adapter. The package ships its own
// self-verification block; a second implementation agreeing with it is evidence
// only if the second one did not come from the same code. Comments cite
// EIP-712's own headings: "Definition of encodeType", "Definition of
// encodeData", "Definition of hashStruct", "Definition of domainSeparator", and
// the final `encode` construction (0x19 0x01 || domainSeparator || hashStruct).
//
// Two libraries are used for PRIMITIVES only, never for EIP-712 structure:
// @noble/hashes for keccak-256 and @noble/curves for secp256k1 public-key
// recovery, both pinned exact. No ethers, no viem, no native modules.
//
// What this adapter deliberately does NOT do is in the coverage manifest under
// `precedence` and `observations`, both declared not_implemented. They are not
// oversights; they are the two things these bytes cannot establish, and the
// manifest prints them on every result including VALID.

import { keccak_256 } from "@noble/hashes/sha3.js";
import { bytesToHex, concatBytes, hexToBytes, utf8ToBytes } from "@noble/hashes/utils.js";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import type { Adapter, ResolvedKey, VerifyOptions, VerifyResult } from "../types.js";
import { invalid, unverifiable, valid } from "../verdict.js";

export const FORMAT = "insight.attestation/eip712";

// ---------------------------------------------------------------------------
// EIP-712, written from the EIP text
// ---------------------------------------------------------------------------

export interface Eip712Field {
  name: string;
  type: string;
}
export type Eip712Types = Record<string, Eip712Field[]>;
export interface Eip712Domain {
  name?: string;
  version?: string;
  chainId?: number | string;
  verifyingContract?: string;
  salt?: string;
  /**
   * Anything else the issuer wrote into the domain object. EIP-712 admits none:
   * see `STANDARD_DOMAIN_FIELDS`. The index signature exists so such a key can
   * be READ and reported rather than dropped on the floor by the type system.
   */
  [k: string]: unknown;
}

const keccak = (b: Uint8Array): Uint8Array => keccak_256(b);
const hex = (b: Uint8Array): string => `0x${bytesToHex(b)}`;

/** A 32-byte big-endian word. EIP-712 encodes every atomic member as one. */
function word(v: bigint): Uint8Array {
  const out = new Uint8Array(32);
  let x = v;
  if (x < 0n) {
    // Two's complement over 256 bits, for intN. EIP-712's encodeData defers to
    // the Solidity ABI for atomic values, and this is the ABI's int encoding.
    x = (1n << 256n) + x;
    if (x < 0n) throw new RangeError("int out of 256-bit range");
  }
  if (x >= 1n << 256n) throw new RangeError("uint out of 256-bit range");
  for (let i = 31; i >= 0; i--) {
    out[i] = Number(x & 0xffn);
    x >>= 8n;
  }
  return out;
}

function toBigInt(v: unknown, type: string): bigint {
  if (typeof v === "bigint") return v;
  if (typeof v === "number") {
    // A non-integer, or one past 2^53, has already lost precision by the time it
    // reaches here, and silently hashing the wrong number is exactly the failure
    // this tool exists to catch. Refuse instead of rounding.
    if (!Number.isSafeInteger(v)) throw new RangeError(`${type} value ${v} is not a safe integer in JSON`);
    return BigInt(v);
  }
  if (typeof v === "string" && /^-?(0x[0-9a-fA-F]+|[0-9]+)$/.test(v)) return BigInt(v);
  throw new TypeError(`${type} value ${JSON.stringify(v)} is not encodable`);
}

/** bytesN is RIGHT-padded to 32 bytes by the ABI. For bytes32 that is a no-op. */
function fixedBytes(v: unknown, n: number, type: string): Uint8Array {
  if (typeof v !== "string" || !/^0x[0-9a-fA-F]*$/.test(v)) {
    throw new TypeError(`${type} value ${JSON.stringify(v)} is not 0x-prefixed hex`);
  }
  const b = hexToBytes(v.slice(2));
  if (b.length !== n) throw new RangeError(`${type} value is ${b.length} bytes, expected ${n}`);
  const out = new Uint8Array(32);
  out.set(b, 0);
  return out;
}

/** address is LEFT-padded to 32 bytes, unlike bytesN. */
function addressWord(v: unknown): Uint8Array {
  if (typeof v !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(v)) {
    throw new TypeError(`address value ${JSON.stringify(v)} is not a 20-byte hex address`);
  }
  const out = new Uint8Array(32);
  out.set(hexToBytes(v.slice(2)), 12);
  return out;
}

/**
 * "Definition of encodeType". The primary type is written as
 * `Name(type1 name1,type2 name2,...)`; every struct type it references, directly
 * or transitively, is appended sorted by name.
 */
export function encodeType(primaryType: string, types: Eip712Types): string {
  const deps = new Set<string>();
  const walk = (t: string): void => {
    const base = t.replace(/\[.*$/, "");
    if (deps.has(base) || types[base] === undefined) return;
    deps.add(base);
    for (const f of types[base]!) walk(f.type);
  };
  walk(primaryType);
  deps.delete(primaryType);
  const order = [primaryType, ...[...deps].sort()];
  return order.map((t) => `${t}(${types[t]!.map((f) => `${f.type} ${f.name}`).join(",")})`).join("");
}

export function typeHash(primaryType: string, types: Eip712Types): Uint8Array {
  return keccak(utf8ToBytes(encodeType(primaryType, types)));
}

/**
 * "Definition of encodeData". Each member encodes to exactly 32 bytes: atomic
 * values per the Solidity ABI; `string` and `bytes` as the keccak-256 of their
 * contents; arrays as the keccak-256 of the concatenated element encodings; a
 * struct member as its own hashStruct.
 */
function encodeValue(type: string, v: unknown, types: Eip712Types): Uint8Array {
  if (type.endsWith("]")) {
    const inner = type.slice(0, type.lastIndexOf("["));
    if (!Array.isArray(v)) throw new TypeError(`${type} value is not an array`);
    return keccak(concatBytes(...v.map((e) => encodeValue(inner, e, types))));
  }
  if (types[type] !== undefined) return hashStruct(type, v as Record<string, unknown>, types);
  if (type === "string") {
    if (typeof v !== "string") throw new TypeError(`string value ${JSON.stringify(v)} is not a string`);
    return keccak(utf8ToBytes(v));
  }
  if (type === "bytes") {
    if (typeof v !== "string" || !/^0x[0-9a-fA-F]*$/.test(v)) throw new TypeError("bytes value is not 0x-prefixed hex");
    return keccak(hexToBytes(v.slice(2)));
  }
  if (type === "bool") {
    if (typeof v !== "boolean") throw new TypeError(`bool value ${JSON.stringify(v)} is not a boolean`);
    return word(v ? 1n : 0n);
  }
  if (type === "address") return addressWord(v);
  const mBytes = /^bytes([0-9]+)$/.exec(type);
  if (mBytes !== null) return fixedBytes(v, Number(mBytes[1]), type);
  if (/^uint([0-9]*)$/.test(type)) {
    const n = toBigInt(v, type);
    if (n < 0n) throw new RangeError(`${type} value ${n} is negative`);
    return word(n);
  }
  if (/^int([0-9]*)$/.test(type)) return word(toBigInt(v, type));
  throw new TypeError(`unsupported EIP-712 type ${type}`);
}

export function encodeData(primaryType: string, value: Record<string, unknown>, types: Eip712Types): Uint8Array {
  const fields = types[primaryType];
  if (fields === undefined) throw new TypeError(`no type definition for ${primaryType}`);
  const parts: Uint8Array[] = [typeHash(primaryType, types)];
  for (const f of fields) {
    if (!(f.name in value)) {
      throw new TypeError(`${primaryType}.${f.name} is declared by the type but absent from the data`);
    }
    parts.push(encodeValue(f.type, value[f.name], types));
  }
  return concatBytes(...parts);
}

/** "Definition of hashStruct": hashStruct(s) = keccak256(typeHash || encodeData(s)). */
export function hashStruct(primaryType: string, value: Record<string, unknown>, types: Eip712Types): Uint8Array {
  return keccak(encodeData(primaryType, value, types));
}

/**
 * The five members EIP-712 admits in `EIP712Domain`, in the EIP's fixed order.
 * The EIP is closed on this list: "the EIP712Domain struct … may contain the
 * following fields", and the standard libraries enforce it (eth-account raises
 * "Invalid domain key", ethers' TypedDataEncoder throws). A sixth key in a
 * published domain object is therefore not a variation on the encoding; it is a
 * document standard verifiers refuse to read at all.
 */
const STANDARD_DOMAIN_FIELDS: [string, string][] = [
  ["name", "string"],
  ["version", "string"],
  ["chainId", "uint256"],
  ["verifyingContract", "address"],
  ["salt", "bytes32"],
];

/** Domain members EIP-712 does not admit, in the order the domain object gives them. */
export function extraDomainKeys(domain: Eip712Domain): string[] {
  const known = new Set(STANDARD_DOMAIN_FIELDS.map(([k]) => k));
  return Object.keys(domain).filter((k) => !known.has(k) && domain[k] !== undefined && domain[k] !== null);
}

/**
 * "Definition of domainSeparator": hashStruct over the EIP712Domain struct built
 * from the fields actually PRESENT, in the EIP's fixed order. Insight's domains
 * carry name, version and chainId and no verifyingContract, so the struct is
 * EIP712Domain(string name,string version,uint256 chainId).
 *
 * `includeExtras` builds the OTHER separator: the standard fields as above,
 * followed by every non-standard key in the order the domain object gives them,
 * each typed `string`. There is no authority for that encoding — EIP-712 assigns
 * no type to a member it does not admit — so it is never the default. It exists
 * so the adapter can answer, for an artefact carrying such a key, which of the
 * two separators the signer actually used, instead of guessing or crashing.
 */
export function domainSeparator(domain: Eip712Domain, includeExtras = false): Uint8Array {
  const present = STANDARD_DOMAIN_FIELDS.filter(([k]) => domain[k] !== undefined && domain[k] !== null);
  const fields: Eip712Field[] = present.map(([k, t]) => ({ name: k, type: t }));
  const value: Record<string, unknown> = {};
  for (const [k] of present) value[k] = domain[k];
  if (includeExtras) {
    for (const k of extraDomainKeys(domain)) {
      fields.push({ name: k, type: "string" });
      const v = domain[k];
      value[k] = typeof v === "string" ? v : String(v);
    }
  }
  return hashStruct("EIP712Domain", value, { EIP712Domain: fields });
}

/** The final construction: keccak256(0x19 || 0x01 || domainSeparator || hashStruct(message)). */
export function eip712Digest(
  domain: Eip712Domain,
  primaryType: string,
  types: Eip712Types,
  message: Record<string, unknown>,
  includeExtraDomainFields = false,
): Uint8Array {
  return keccak(
    concatBytes(
      new Uint8Array([0x19, 0x01]),
      domainSeparator(domain, includeExtraDomainFields),
      hashStruct(primaryType, message, types),
    ),
  );
}

// ---------------------------------------------------------------------------
// secp256k1 recovery
// ---------------------------------------------------------------------------

/**
 * Recover the signing address from a 65-byte r || s || v signature over a
 * digest. The address is the low 20 bytes of keccak-256 over the uncompressed
 * public key with its 0x04 prefix removed. Returns null rather than throwing: a
 * signature that will not parse is a fact about the receipt, not a crash.
 */
export function recoverAddress(digest: Uint8Array, signature: string): string | null {
  if (!/^0x[0-9a-fA-F]{130}$/.test(signature)) return null;
  const raw = hexToBytes(signature.slice(2));
  const v = raw[64]!;
  const rec = v === 27 || v === 28 ? v - 27 : v === 0 || v === 1 ? v : -1;
  if (rec < 0) return null;
  try {
    const sig = secp256k1.Signature.fromBytes(raw.slice(0, 64), "compact").addRecoveryBit(rec);
    const pub = sig.recoverPublicKey(digest).toBytes(false);
    return hex(keccak(pub.slice(1)).slice(-20));
  } catch {
    return null;
  }
}

const sameAddress = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase();

// ---------------------------------------------------------------------------
// parse — RFC 8785 section 3.1 / RFC 7493 section 2.3: duplicate members REFUSED
// ---------------------------------------------------------------------------

/**
 * Why this is check 1 and not a detail of JSON handling.
 *
 * `JSON.parse` keeps the LAST of a repeated member and discards the earlier one,
 * silently. So a document whose signature covers `{"a":1}` and whose bytes say
 * `{"a":1,"a":2}` verifies while a reader is shown 2. RFC 7493 section 2.3 makes
 * member names unique in I-JSON, and RFC 8785 section 3.1 excludes such input
 * from canonicalization altogether. Konrad Gruszka's 1 Sep note to the SCITT
 * list is the immediate reason it is ordered first: it must be impossible for a
 * value out of a duplicated object to reach any later check.
 *
 * The scan runs over the RAW TEXT, before JSON.parse, because after JSON.parse
 * the evidence is already gone.
 */
type Tok = { t: "{" | "}" | "[" | "]" | ":" | "," | "str" | "lit"; v?: string };

function tokenize(text: string): Tok[] | null {
  const toks: Tok[] = [];
  const punct = "{}[]:,";
  let i = 0;
  while (i < text.length) {
    const c = text[i]!;
    if (c === " " || c === "\t" || c === "\n" || c === "\r") {
      i++;
      continue;
    }
    if (punct.includes(c)) {
      toks.push({ t: c as Tok["t"] });
      i++;
      continue;
    }
    if (c === '"') {
      const start = i;
      i++;
      while (i < text.length) {
        const d = text[i]!;
        if (d === "\\") {
          i += 2;
          continue;
        }
        if (d === '"') break;
        i++;
      }
      if (i >= text.length) return null;
      i++;
      let decoded: string;
      try {
        decoded = JSON.parse(text.slice(start, i)) as string;
      } catch {
        return null;
      }
      toks.push({ t: "str", v: decoded });
      continue;
    }
    // Numbers and true/false/null. Their spelling does not matter here, only
    // their extent, so the walker below stays aligned with the structure.
    const start = i;
    while (i < text.length && !punct.includes(text[i]!) && !' \t\n\r"'.includes(text[i]!)) i++;
    if (i === start) return null;
    toks.push({ t: "lit", v: text.slice(start, i) });
  }
  return toks;
}

/** A path to the first duplicate member found, or null when there is none. */
export function findDuplicateKey(text: string): string | null {
  const toks = tokenize(text);
  if (toks === null) return null; // malformed JSON is JSON.parse's to report
  const frames: { obj: boolean; keys: Set<string>; path: string }[] = [];
  let lastKey = "";
  for (let k = 0; k < toks.length; k++) {
    const t = toks[k]!;
    if (t.t === "{" || t.t === "[") {
      const parent = frames[frames.length - 1];
      const path = parent === undefined ? "$" : parent.obj ? `${parent.path}.${lastKey}` : `${parent.path}[]`;
      frames.push({ obj: t.t === "{", keys: new Set(), path });
      continue;
    }
    if (t.t === "}" || t.t === "]") {
      frames.pop();
      continue;
    }
    const top = frames[frames.length - 1];
    if (t.t === "str" && top !== undefined && top.obj && toks[k + 1]?.t === ":") {
      const key = t.v!;
      lastKey = key;
      if (top.keys.has(key)) return top.path === "$" ? key : `${top.path}.${key}`;
      top.keys.add(key);
    }
  }
  return null;
}

type ParseOutcome =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; reason: "malformed_receipt" | "malformed_member"; detail: string };

function parseStrict(bytes: Uint8Array): ParseOutcome {
  const text = Buffer.from(bytes).toString("utf8");
  const dup = findDuplicateKey(text);
  if (dup !== null) {
    return {
      ok: false,
      reason: "malformed_member",
      detail:
        `duplicate member name ${JSON.stringify(dup)}: RFC 7493 section 2.3 makes member names unique and RFC 8785 ` +
        `section 3.1 excludes such input from canonicalization. JSON.parse would silently keep the last occurrence, ` +
        `so no value from this document is read at all`,
    };
  }
  let doc: unknown;
  try {
    doc = JSON.parse(text);
  } catch (e) {
    return { ok: false, reason: "malformed_receipt", detail: `not valid JSON: ${(e as Error).message}` };
  }
  if (doc === null || typeof doc !== "object" || Array.isArray(doc)) {
    return { ok: false, reason: "malformed_receipt", detail: "top level is not a JSON object" };
  }
  return { ok: true, value: doc as Record<string, unknown> };
}

// ---------------------------------------------------------------------------
// shapes
// ---------------------------------------------------------------------------

const obj = (v: unknown): Record<string, unknown> | null =>
  v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
const str = (v: unknown): string | null => (typeof v === "string" ? v : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export interface Attestation {
  uid?: string;
  /**
   * The attestation's own `signedAt`, as published. PACKAGE METADATA: it sits
   * beside `data`, not inside it, so it is not covered by the signature. Read
   * because the artefact publishes no signed member that means "when this was
   * signed" — `executedAt` and `checkedAt` are the nearest signed instants and
   * are used when this is absent. Every place that reads it says which of the
   * two it took and whether that member was signed.
   */
  signedAt?: string;
  attester: string;
  signature: string;
  data: Record<string, unknown>;
  domain: Eip712Domain;
  types: Eip712Types;
  primaryType: string;
  eip712: Record<string, unknown>;
  label: string;
}

function asAttestation(o: Record<string, unknown>, label: string): Attestation | null {
  const attester = str(o["attester"]);
  const signature = str(o["signature"]);
  const data = obj(o["data"]);
  const e = obj(o["eip712"]);
  if (attester === null || signature === null || data === null || e === null) return null;
  if (!/^0x[0-9a-fA-F]{40}$/.test(attester)) return null;
  if (!/^0x[0-9a-fA-F]{130}$/.test(signature)) return null;
  const domain = obj(e["domain"]);
  const types = obj(e["types"]);
  const primaryType = str(e["primaryType"]);
  if (domain === null || types === null || primaryType === null) return null;
  if (str(domain["name"]) === null) return null;
  const att: Attestation = {
    attester,
    signature,
    data,
    domain: domain as Eip712Domain,
    types: types as unknown as Eip712Types,
    primaryType,
    eip712: e,
    label,
  };
  const uid = str(o["uid"]);
  if (uid !== null) att.uid = uid;
  const signedAt = str(o["signedAt"]);
  if (signedAt !== null) att.signedAt = signedAt;
  return att;
}

interface Pkg {
  receipt: Attestation;
  sourceGate: Attestation | null;
  destinationGate: Attestation | null;
  onchain: Record<string, unknown> | null;
  raw: Record<string, unknown>;
}

function asPackage(o: Record<string, unknown>): Pkg | null {
  const receiptRaw = obj(o["receipt"]);
  const preTrade = obj(o["preTrade"]);
  if (receiptRaw === null || preTrade === null) return null;
  if (obj(o["onchain"]) === null && obj(o["publishedKeys"]) === null) return null;
  const receipt = asAttestation(receiptRaw, "receipt");
  if (receipt === null) return null;
  const sg = obj(preTrade["sourceGate"]);
  const dg = obj(preTrade["destinationGate"]);
  return {
    receipt,
    sourceGate: sg === null ? null : asAttestation(sg, "sourceGate"),
    destinationGate: dg === null ? null : asAttestation(dg, "destinationGate"),
    onchain: obj(o["onchain"]),
    raw: o,
  };
}

/**
 * Shape probe. Conservative, as the Adapter contract requires. The other three
 * adapters read JWS or the ACTA {payload, signature} envelope; none of them has
 * an `attester` address beside an `eip712` block, and no fixture in this
 * repository carries either. Asserted by the detection sweep in
 * test/insight.test.ts, which runs every fixture under fixtures/ through this
 * function and requires zero claims.
 */
export function detect(bytes: Uint8Array): boolean {
  let doc: unknown;
  try {
    doc = JSON.parse(Buffer.from(bytes).toString("utf8"));
  } catch {
    return false;
  }
  const o = obj(doc);
  if (o === null) return false;
  if (asPackage(o) !== null) return true;
  return asAttestation(o, "attestation") !== null;
}

// ---------------------------------------------------------------------------
// the published registry (refs/insight-oracle-keys-*.json)
// ---------------------------------------------------------------------------

export interface RegistryKey {
  keyId: string;
  publicKey: string;
  revoked: boolean;
  /**
   * Every other member the registry publishes on a `public_keys` entry. These
   * were parsed and dropped until 2026-09-07; dropping `role` is what let a key
   * the registry labels a SAMPLE signer reach VALID with nothing in the verdict
   * saying so. Kept as `null` when the entry does not publish the member, so
   * "absent" and "published as something" are distinguishable — the registry
   * declares `role` on exactly one of its three keys.
   */
  algorithm: string | null;
  role: string | null;
  note: string | null;
  /**
   * The key's own validity window, in epoch seconds. `null` is open ended —
   * either the member is absent or the registry publishes `null`, which is what
   * the current signing key carries.
   */
  validFrom: number | null;
  validUntil: number | null;
  /**
   * Window members that are PRESENT but do not parse as an instant. Kept
   * separately rather than collapsed into `null`, because "unreadable" and
   * "open ended" must not resolve to the same answer: one of them is a reason
   * to refuse.
   */
  malformedWindow: string[];
}
/**
 * One published type. `entryName` is the registry's own key
 * (`ExecutionReceiptV2`); `primaryType` is the name the EIP-712 struct is
 * actually signed under (`ExecutionReceipt`), which is what an artefact names.
 * The registry keys retired versions under a suffixed entry name while leaving
 * the struct name unsuffixed, so the two are not interchangeable and a lookup
 * that used only one of them would match the wrong type.
 */
interface RegistrySchema {
  entryName: string;
  primaryType: string;
  schemaVersion?: number;
  domainVersion?: string;
  retiredForSigning: boolean;
  /** Field names in order. Empty when the registry publishes only a count. */
  fields: string[];
  /** The count, whether it came from the field list or from a bare `fields: n`. */
  fieldCount?: number;
}
export interface Registry {
  keys: RegistryKey[];
  schemas: RegistrySchema[];
  gates: Record<string, unknown>;
  origin: string;
  /**
   * The registry publishes revocation on TWO channels: `revoked` on each
   * `public_keys` entry, and a top-level `revoked_keys` array. Both are honoured,
   * because honouring one of two channels is the same as honouring neither for
   * whichever key the issuer happened to withdraw on the other.
   *
   * Lowercased addresses and key_ids named by `revoked_keys`.
   */
  revokedRefs: string[];
  /**
   * `revoked_keys` entries in a shape this tool cannot read. `revoked_keys` is
   * empty in every registry pinned here, so no document tells us what a
   * populated entry looks like; two shapes are read (a bare string, and an
   * object carrying `public_key` and/or `key_id`) and anything else lands here.
   * An unreadable entry cannot be shown NOT to name a given signer, so it fails
   * closed rather than being skipped — guessing further shapes would be worse
   * than saying the list was not understood.
   */
  revocationListUnreadable: string[];
}

/**
 * The registry writes key windows as ISO-8601 text in two shapes: a bare date
 * (`2026-08-05`) and a full instant (`2026-09-02T17:35:36.000Z`). Both are UTC
 * under `Date.parse`'s rules for those two forms, so no local timezone is ever
 * consulted here — a window that meant a different instant on a machine in a
 * different zone would make the same bytes resolve two ways.
 *
 * Returns `null` when the member is absent or explicitly `null` (open ended),
 * and the raw string when it is present and unreadable, which the caller must
 * fail closed on rather than treat as open ended.
 */
function windowInstant(v: unknown): { at: number | null } | { bad: string } {
  if (v === undefined || v === null) return { at: null };
  const s = str(v);
  if (s === null) return { bad: JSON.stringify(v) };
  const ms = Date.parse(s);
  return Number.isFinite(ms) ? { at: Math.floor(ms / 1000) } : { bad: s };
}

export function parseRegistry(bytes: Uint8Array, origin: string): Registry | { error: string } {
  const p = parseStrict(bytes);
  if (!p.ok) return { error: `registry at ${origin}: ${p.detail}` };
  const o = p.value;
  const rawKeys = o["public_keys"];
  if (!Array.isArray(rawKeys)) return { error: `registry at ${origin} has no \`public_keys\` array` };
  const keys: RegistryKey[] = [];
  for (const k of rawKeys) {
    const e = obj(k);
    const pub = e === null ? null : str(e["public_key"]);
    if (e === null || pub === null) return { error: `registry at ${origin}: a public_keys entry has no \`public_key\`` };
    const from = windowInstant(e["validFrom"]);
    const until = windowInstant(e["validUntil"]);
    const malformed: string[] = [];
    if ("bad" in from) malformed.push(`validFrom ${from.bad}`);
    if ("bad" in until) malformed.push(`validUntil ${until.bad}`);
    keys.push({
      keyId: str(e["key_id"]) ?? pub,
      publicKey: pub,
      revoked: e["revoked"] === true,
      algorithm: str(e["algorithm"]),
      role: str(e["role"]),
      note: str(e["note"]),
      validFrom: "at" in from ? from.at : null,
      validUntil: "at" in until ? until.at : null,
      malformedWindow: malformed,
    });
  }
  const schemas: RegistrySchema[] = [];
  const rawSchemas = obj(o["schemas"]);
  if (rawSchemas !== null) {
    for (const [name, v] of Object.entries(rawSchemas)) {
      const s = obj(v);
      if (s === null) continue;
      const e = obj(s["eip712"]);
      const types = e === null ? null : obj(e["types"]);
      // The struct name, in the order the registry offers it: an explicit
      // primaryType, else the sole key of the types map, else the entry name.
      const typeKeys = types === null ? [] : Object.keys(types);
      const primaryType =
        (e === null ? null : str(e["primaryType"])) ?? (typeKeys.length === 1 ? typeKeys[0]! : typeKeys.includes(name) ? name : name);
      const list = types === null ? null : types[primaryType];
      const entry: RegistrySchema = {
        entryName: name,
        primaryType,
        retiredForSigning: s["retiredForSigning"] === true,
        fields: Array.isArray(list) ? list.map((f) => (obj(f) === null ? "" : (str(obj(f)!["name"]) ?? ""))) : [],
      };
      // A retired entry may publish a bare count instead of the field list.
      const declaredCount = num(s["fields"]);
      if (Array.isArray(list)) entry.fieldCount = list.length;
      else if (declaredCount !== null) entry.fieldCount = declaredCount;
      else continue; // neither a field list nor a count: nothing to compare against
      const sv = num(s["schemaVersion"]);
      if (sv !== null) entry.schemaVersion = sv;
      const dom = (e === null ? null : obj(e["domain"])) ?? obj(s["domain"]);
      const dv = dom === null ? null : str(dom["version"]);
      if (dv !== null) entry.domainVersion = dv;
      schemas.push(entry);
    }
  }
  // The second revocation channel. Absent is not the same as empty, but both
  // mean "nothing withdrawn here"; a member present and not an array is a shape
  // we cannot read at all, which fails closed like an unreadable entry.
  const revokedRefs: string[] = [];
  const revocationListUnreadable: string[] = [];
  const rawRevoked = o["revoked_keys"];
  if (rawRevoked !== undefined && rawRevoked !== null) {
    if (!Array.isArray(rawRevoked)) {
      revocationListUnreadable.push(`revoked_keys is ${typeof rawRevoked}, not an array`);
    } else {
      for (const entry of rawRevoked) {
        const s = str(entry);
        if (s !== null) {
          revokedRefs.push(s.toLowerCase());
          continue;
        }
        const e = obj(entry);
        const refs = e === null ? [] : [str(e["public_key"]), str(e["key_id"])].filter((v): v is string => v !== null);
        if (refs.length === 0) {
          revocationListUnreadable.push(JSON.stringify(entry));
          continue;
        }
        for (const r of refs) revokedRefs.push(r.toLowerCase());
      }
    }
  }
  const er = obj(rawSchemas?.["ExecutionReceipt"]);
  return { keys, schemas, gates: (er === null ? null : obj(er["gates"])) ?? {}, origin, revokedRefs, revocationListUnreadable };
}

/**
 * The outcome of looking one signer up in the registry AT AN INSTANT.
 *
 * `not_found` and `valid` are the only two states the resolver used to have.
 * The other three exist because being listed is not the same as being vouched
 * for: this registry retains a rotated-out key in `public_keys` with
 * `revoked: false` and a `validUntil` in the past — its own
 * `key_rotation_policy` calls that "retaining prior key with validUntil for
 * overlap" — so an address match alone would report a published identity for a
 * key the issuer has stopped standing behind.
 */
export type KeyResolution =
  | { status: "not_found" }
  | { status: "valid"; key: RegistryKey }
  | { status: "revoked"; key: RegistryKey; via: string }
  | { status: "revocation_list_unreadable"; key: RegistryKey; entries: string[] }
  | { status: "expired"; key: RegistryKey; validUntil: number }
  | { status: "not_yet_valid"; key: RegistryKey; validFrom: number }
  | { status: "window_malformed"; key: RegistryKey; members: string[] };

/**
 * Resolve a signer address against the registry's published keys at `now`
 * (epoch seconds). Pure: no I/O, no clock read — the instant is always the
 * caller's `--now`, which is what makes verifying a historical receipt a matter
 * of naming the instant it was signed at rather than of a flag that waives the
 * check.
 *
 * The window is closed-open against `now` the same way the artefact's own
 * freshness check is: `now > validUntil` is expired, `now < validFrom` is not
 * yet valid, and the boundary instant itself is inside the window.
 *
 * ORDER, and why it is this one. Revocation is checked before the window
 * because it is the stronger statement and it is not time-bounded: a withdrawn
 * key is withdrawn at every instant, so reporting "expired" for a key that was
 * revoked would name the weaker fact and let a caller think a different `--now`
 * would fix it. An unreadable revocation list is checked before the window for
 * the same reason — until it is read, no key in this registry can be cleared.
 */
export function resolveRegistryKey(registry: Registry, address: string, now: number): KeyResolution {
  const key = registry.keys.find((k) => sameAddress(k.publicKey, address));
  if (key === undefined) return { status: "not_found" };
  if (key.revoked) return { status: "revoked", key, via: "`revoked: true` on its `public_keys` entry" };
  const named = [key.publicKey.toLowerCase(), key.keyId.toLowerCase()].find((r) => registry.revokedRefs.includes(r));
  if (named !== undefined) return { status: "revoked", key, via: `the top-level \`revoked_keys\` array, which names ${named}` };
  if (registry.revocationListUnreadable.length > 0) {
    return { status: "revocation_list_unreadable", key, entries: registry.revocationListUnreadable };
  }
  // Fail closed before either window comparison: a window that cannot be read
  // is not an absent window.
  if (key.malformedWindow.length > 0) return { status: "window_malformed", key, members: key.malformedWindow };
  if (key.validUntil !== null && now > key.validUntil) return { status: "expired", key, validUntil: key.validUntil };
  if (key.validFrom !== null && now < key.validFrom) return { status: "not_yet_valid", key, validFrom: key.validFrom };
  return { status: "valid", key };
}

/** For a detail line: the instant as the registry wrote it, beside the number. */
function instantLine(sec: number): string {
  return `${sec} (${new Date(sec * 1000).toISOString()})`;
}

/** The key's window as one readable interval, with `open` for an absent end. */
function windowLine(key: RegistryKey): string {
  const from = key.validFrom === null ? "validFrom open" : `validFrom ${instantLine(key.validFrom)}`;
  const until = key.validUntil === null ? "validUntil open" : `validUntil ${instantLine(key.validUntil)}`;
  return `[${from}, ${until}]`;
}

/**
 * WHICH INSTANT IS THE ARTEFACT'S OWN — `signedAt` first, then the signed
 * `executedAt`, then the signed `checkedAt`.
 *
 * The order is stated because it prefers an UNSIGNED member to a signed one,
 * and that is a real cost. `signedAt` is the only member that means "when this
 * was signed"; the two fallbacks mean "when the trade executed" and "when the
 * check ran", which are the nearest signed instants but not the same fact. A
 * party who can edit the wrapper without touching the signature can move what
 * this reads. So every result that uses it prints which member was taken and
 * whether that member was signed, and prints the signed instant beside it when
 * both exist — the exposure is on the verdict rather than only in FINDINGS.
 */
export type SigningInstant =
  | { at: number; member: string; signed: boolean; alsoSigned: { member: string; at: number } | null; signedAtUnreadable: string | null }
  | { missing: string[] };

export function signingInstant(art: Attestation): SigningInstant {
  const signedMember = num(art.data["executedAt"]) !== null ? "executedAt" : num(art.data["checkedAt"]) !== null ? "checkedAt" : null;
  const signedSec = signedMember === null ? null : Math.floor(num(art.data[signedMember])!);
  if (art.signedAt !== undefined) {
    const ms = Date.parse(art.signedAt);
    if (Number.isFinite(ms)) {
      return {
        at: Math.floor(ms / 1000),
        member: "signedAt",
        signed: false,
        alsoSigned: signedMember === null ? null : { member: signedMember, at: signedSec! },
        signedAtUnreadable: null,
      };
    }
    // Present and not an instant. Fall through to the signed member rather than
    // to nothing, and carry the unreadable text so the result says what was
    // skipped instead of quietly reading a different member.
    if (signedMember !== null) {
      return { at: signedSec!, member: signedMember, signed: true, alsoSigned: null, signedAtUnreadable: art.signedAt };
    }
    return { missing: [`signedAt (present, not an instant: ${JSON.stringify(art.signedAt)})`, "data.executedAt", "data.checkedAt"] };
  }
  if (signedMember !== null) return { at: signedSec!, member: signedMember, signed: true, alsoSigned: null, signedAtUnreadable: null };
  return { missing: ["signedAt", "data.executedAt", "data.checkedAt"] };
}

/**
 * The key's `[validFrom, validUntil]` against the ARTEFACT'S OWN instant, not
 * against the caller's clock. Pure, and boundary-inclusive on both ends, the
 * same way `resolveRegistryKey` treats `--now`, so the two comparisons cannot
 * disagree about an instant that sits exactly on an edge.
 *
 * This answers a different question from `resolveRegistryKey`'s window check
 * and neither replaces the other: that one asks "was this key good at the
 * instant you asked about", this one asks "was it good when this artefact says
 * it was made". A receipt can pass one and fail the other in either direction,
 * which is precisely why both are reported.
 */
export type SigningWindow =
  | { status: "no_instant"; searched: string[] }
  | { status: "inside"; at: number; member: string }
  | { status: "before"; at: number; member: string; validFrom: number }
  | { status: "after"; at: number; member: string; validUntil: number };

export function keyWindowAtSigningTime(key: RegistryKey, art: Attestation): SigningWindow {
  const si = signingInstant(art);
  if ("missing" in si) return { status: "no_instant", searched: si.missing };
  if (key.validFrom !== null && si.at < key.validFrom) {
    return { status: "before", at: si.at, member: si.member, validFrom: key.validFrom };
  }
  if (key.validUntil !== null && si.at > key.validUntil) {
    return { status: "after", at: si.at, member: si.member, validUntil: key.validUntil };
  }
  return { status: "inside", at: si.at, member: si.member };
}

/**
 * The registry declares `role` on exactly one of the three keys it publishes,
 * and the value there is `"sample"`. No pin declares a role for the keys that
 * sign production, so there is no published token for "this is the real
 * attester" — the production keys simply carry no `role` member.
 *
 * `ATTESTER_ROLE` is therefore the one declared value that would NOT draw the
 * observation if the registry ever started publishing it. Today every declared
 * role draws it and an absent role draws none, which is the behaviour the two
 * production keys and the sample key need. It is a constant rather than a
 * hardcoded comparison so the assumption is visible and testable.
 */
const ATTESTER_ROLE = "attester";
const ROLE_NOT_DECLARED = "not declared";
const roleLabel = (key: RegistryKey): string => key.role ?? ROLE_NOT_DECLARED;

/**
 * Verbatim, as specified: the tool says what the registry says, and stops. It
 * cannot say whether a role is trustworthy — only which label the registry
 * attached to the key that made this signature, and that the signed fields do
 * not carry that label themselves.
 */
const roleObservation = (role: string): string =>
  `signed by a key the registry labels role ${role}; the signed fields do not say so`;

/** One line for the artefact-instant comparison, in every one of its four states. */
function signingWindowLine(key: RegistryKey, w: SigningWindow): string {
  const win = `key ${key.keyId} ${windowLine(key)}`;
  if (w.status === "no_instant") {
    return `not_checked — the attestation carries no readable instant (searched ${w.searched.join(", ")}); ${win} was not compared against one`;
  }
  if (w.status === "inside") return `inside — ${w.member} ${instantLine(w.at)} is within ${win}`;
  if (w.status === "before") return `OUTSIDE — ${w.member} ${instantLine(w.at)} is ${w.validFrom - w.at}s BEFORE the validFrom of ${win}`;
  return `OUTSIDE — ${w.member} ${instantLine(w.at)} is ${w.at - w.validUntil}s PAST the validUntil of ${win}`;
}

/**
 * Compare the artefact's own declared type against the registry's published one
 * for the same primaryType AND the same schemaVersion. This is REPORTED, never a
 * verdict: a stranger who builds the struct from the registry rather than from
 * the artefact recovers a different address, and that is worth saying out loud
 * without deciding on the issuer's behalf which of the two documents is wrong.
 *
 * Version-aware lookup is what lets one tool read three generations of the same
 * format. The registry retains retired layouts beside the current one, so
 * "does the artefact match the registry" has no answer until the version is
 * fixed: the 06:08Z package's 32-field receipt is a MISMATCH against the current
 * 43-field ExecutionReceipt and an exact match against ExecutionReceiptV2, and
 * only the second reading is a true statement about that artefact.
 */
function fieldDiff(mine: string[], published: RegistrySchema): string[] {
  const parts: string[] = [];
  const theirs = published.fields;
  const count = published.fieldCount ?? theirs.length;
  if (mine.length !== count) parts.push(`${mine.length} vs ${count} fields`);
  if (theirs.length === 0) {
    // A count-only entry supports no name comparison, and saying so is the
    // difference between "the names agree" and "the names were never checked".
    if (mine.length === count) parts.push(`${count} fields, but the registry publishes a count and no field list, so the names are not compared`);
    return parts;
  }
  const extra = mine.filter((n) => !theirs.includes(n));
  if (extra.length > 0) parts.push(`${extra.join(", ")} not in registry`);
  if (extra.length === 0 && mine.length === theirs.length && mine.some((n, i) => n !== theirs[i])) {
    parts.push("same names in a different order");
  }
  return parts;
}

function compareRegistrySchema(art: Attestation, reg: Registry): { line: string; domainLine: string | null } {
  const candidates = reg.schemas.filter((s) => s.primaryType === art.primaryType);
  if (candidates.length === 0) {
    return { line: `not_published (${art.primaryType} is not in ${reg.origin})`, domainLine: null };
  }
  const mine = (art.types[art.primaryType] ?? []).map((f) => f.name);
  const myVersion = num(art.data["schemaVersion"]);
  const hit = myVersion === null ? undefined : candidates.find((c) => c.schemaVersion === myVersion);

  // The version the artefact declares is published. Compare against THAT type,
  // and say whether the registry still accepts it for signing.
  if (hit !== undefined) {
    const parts = fieldDiff(mine, hit);
    const line =
      hit.retiredForSigning
        ? `retired_for_signing (v${myVersion!})${parts.length > 0 ? `; ${parts.join("; ")}` : ""}`
        : parts.length === 0
          ? `match (v${myVersion!})`
          : `mismatch (v${myVersion!}: ${parts.join("; ")})`;
    const myDomain = str(art.domain.version);
    return {
      line,
      domainLine: myDomain !== null && hit.domainVersion !== undefined && myDomain !== hit.domainVersion ? `${myDomain} vs ${hit.domainVersion}` : null,
    };
  }

  // No published type at the artefact's version. Fall back to the entry the
  // registry names as current for this struct — the artefact is still comparable
  // to SOMETHING, and reporting only "no entry at v3" would hide the shape of
  // the divergence, which is the part a reader needs.
  const current = candidates.find((c) => c.entryName === art.primaryType) ?? candidates[candidates.length - 1]!;
  const parts: string[] = [];
  if (myVersion !== null && current.schemaVersion !== undefined) {
    parts.push(`schemaVersion ${myVersion} vs ${current.schemaVersion}`);
  }
  parts.push(...fieldDiff(mine, current));
  const myDomain = str(art.domain.version);
  return {
    line: parts.length === 0 ? "match" : `mismatch (${parts.join("; ")})`,
    domainLine: myDomain !== null && current.domainVersion !== undefined && myDomain !== current.domainVersion ? `${myDomain} vs ${current.domainVersion}` : null,
  };
}

// ---------------------------------------------------------------------------
// checks 1-7, over one attestation
// ---------------------------------------------------------------------------

type Ann = Record<string, string | number | boolean>;

interface Ctx {
  registry: Registry | null;
  registryError: string | null;
  now: number;
  allowUnregistered: boolean;
}

type Stage = { ok: false; result: VerifyResult } | { ok: true; key: ResolvedKey; ann: Ann; digest: string };

/**
 * The key an INVALID names when the signer is not a published registry entry.
 *
 * The tri-state contract requires INVALID to name a resolved key, because an
 * INVALID that cannot say what it failed against is indistinguishable from
 * UNVERIFIABLE. For this format the artefact's own `attester` member is the key
 * reference, and the `origin` string says exactly that, so the printed line
 * never implies a published key was resolved when none was.
 */
function selfDeclaredKey(art: Attestation): ResolvedKey {
  return {
    kid: art.attester,
    alg: "EIP-712/secp256k1",
    origin: `the ${art.label}'s own \`attester\` member — NOT a published registry entry`,
  };
}

function verifyOne(art: Attestation, ctx: Ctx, prefix: string): Stage {
  const ann: Ann = {};
  const fail = (r: VerifyResult): Stage => ({ ok: false, result: r });
  const p = (k: string): string => (prefix === "" ? k : `${prefix}_${k}`);

  // ---- 2. schema ---------------------------------------------------------
  const fields = art.types[art.primaryType];
  if (fields === undefined || fields.length === 0) {
    return fail(
      unverifiable(
        FORMAT,
        "malformed_member",
        `eip712.types carries no definition for primaryType ${JSON.stringify(art.primaryType)}`,
        ann,
        "schema",
      ),
    );
  }
  const declared = fields.map((f) => f.name);
  const missing = declared.filter((n) => !(n in art.data));
  const extra = Object.keys(art.data).filter((n) => !declared.includes(n));
  if (missing.length > 0 || extra.length > 0) {
    return fail(
      unverifiable(
        FORMAT,
        "malformed_member",
        `${art.label} data does not match its own declared type: ` +
          `${missing.length > 0 ? `missing ${missing.join(", ")}` : ""}` +
          `${missing.length > 0 && extra.length > 0 ? "; " : ""}` +
          `${extra.length > 0 ? `undeclared ${extra.join(", ")}` : ""}`,
        ann,
        "schema",
      ),
    );
  }
  // The encodeType string IS the field names and their order, canonically. It is
  // recorded rather than a count, so a reader can compare orders by eye.
  ann[p("schema_encode_type")] = encodeType(art.primaryType, art.types);

  // ---- 3. digest, and the non-standard domain member (H7) ----------------
  //
  // EIP-712 admits five members in EIP712Domain. When a domain object carries a
  // sixth, there is no encoding the EIP endorses, so guessing one and reporting
  // a single verdict would state as fact something the bytes do not settle.
  // Both candidate separators are computed instead, and the result says which
  // one the signature was actually made under. Neither path may crash on the
  // key, and neither may drop it without saying so.
  const extras = extraDomainKeys(art.domain);
  const digestUnder = (includeExtras: boolean): Uint8Array | string => {
    try {
      return eip712Digest(art.domain, art.primaryType, art.types, art.data, includeExtras);
    } catch (e) {
      return (e as Error).message;
    }
  };
  const stdDigest = digestUnder(false);
  if (typeof stdDigest === "string") {
    return fail(unverifiable(FORMAT, "malformed_member", `${art.label} does not EIP-712 encode: ${stdDigest}`, ann, "digest"));
  }
  const stdRecovered = recoverAddress(stdDigest, art.signature);
  const stdHolds = stdRecovered !== null && sameAddress(stdRecovered, art.attester);

  let digestBytes = stdDigest;
  let recovered = stdRecovered;
  let signatureHolds = stdHolds;

  if (extras.length > 0) {
    const extDigest = digestUnder(true);
    const extRecovered = typeof extDigest === "string" ? null : recoverAddress(extDigest, art.signature);
    const extHolds = extRecovered !== null && sameAddress(extRecovered, art.attester);
    const list = `[${extras.join(", ")}]`;
    ann[p("domain_extra_fields_digest_standard_only")] = hex(stdDigest);
    if (typeof extDigest !== "string") ann[p("domain_extra_fields_digest_with_extras")] = hex(extDigest);
    if (extRecovered !== null) ann[p("domain_extra_fields_recovers_with_extras_as")] = extRecovered;

    if (stdHolds && !extHolds) {
      // (b) The signer's separator was the standard one. The extra member is
      // metadata that the domain object presents as if it were signed.
      ann[p("domain_extra_fields_unsigned")] =
        `${list} — declared in the domain object, not in the signed bytes; standard verifiers reject this artefact`;
    } else if (extHolds) {
      // (c) The signer did encode it, so the artefact is self-consistent and
      // still unreadable by any library that enforces the EIP's five members.
      digestBytes = extDigest as Uint8Array;
      recovered = extRecovered;
      signatureHolds = true;
      ann[p("domain_extra_fields_signed")] = `${list} — non-standard; verifiable only with a custom EIP712Domain type`;
    } else {
      // (d) Neither separator produces the stated attester. Both attempts are
      // named, because "the signature is invalid" without saying what was tried
      // is not a finding a reader can act on.
      return fail(
        invalid(
          FORMAT,
          "signature_invalid",
          `${art.label} carries non-standard EIP-712 domain member(s) ${list} and its signature recovers the stated attester ` +
            `${art.attester} under NEITHER candidate separator: with the five EIP-712 members only the digest is ${hex(stdDigest)} ` +
            `and recovery gives ${stdRecovered ?? "no address (unparseable r||s||v)"}; with ${list} appended as \`string\` in the ` +
            `domain object's order the digest is ${typeof extDigest === "string" ? `not computable (${extDigest})` : hex(extDigest)} ` +
            `and recovery gives ${extRecovered ?? "no address"}`,
          selfDeclaredKey(art),
          "signature",
        ),
      );
    }
  }

  const digest = hex(digestBytes);
  ann[p("digest")] = digest;
  if (recovered !== null) ann[p("recovered_signer")] = recovered;
  if (art.uid !== undefined) ann[p("uid_equals_digest")] = sameAddress(art.uid, digest);

  // PRECEDENCE between check 3 and check 4, and why it is this way round.
  //
  // `uid` is a DERIVED identifier: it is the digest of the artefact's own signed
  // bytes. So editing any signed field breaks the uid comparison AND the
  // signature at the same time, and reporting only "uid is not the digest" would
  // name the symptom while the root cause — these bytes were not signed — went
  // unsaid. When the signature also fails, the signature failure is reported and
  // the uid symptom is named in its detail — an INVALID carries no annotations
  // under the tri-state contract, so the detail is the only place left to say it.
  //
  // A uid mismatch is therefore reported in its own right in exactly the case
  // where it IS the whole story: the signature verifies over these bytes, and
  // only the label attached to them is wrong.
  if (art.uid !== undefined && !sameAddress(art.uid, digest) && signatureHolds) {
    return fail(
      invalid(
        FORMAT,
        "malformed_member",
        `${art.label}.uid is ${art.uid} but the EIP-712 digest of its own signed bytes is ${digest}. ` +
          `The signature over those bytes is good, so the bytes are intact and the identifier attached to them is not: ` +
          `the package derives uid as that digest for every artefact`,
        selfDeclaredKey(art),
        "digest",
      ),
    );
  }

  // ---- 4. signature ------------------------------------------------------
  if (!signatureHolds) {
    const uidAlso =
      art.uid !== undefined && !sameAddress(art.uid, digest)
        ? `. Its uid no longer equals the digest of these bytes either (${art.uid} vs ${digest}), which is the same edit seen from the other side`
        : "";
    return fail(
      invalid(
        FORMAT,
        "signature_invalid",
        `${art.label} signature recovers ${recovered ?? "no address (unparseable r||s||v)"}, ` +
          `but the artefact states attester ${art.attester}${uidAlso}`,
        selfDeclaredKey(art),
        "signature",
      ),
    );
  }

  // ---- 5. identity -------------------------------------------------------
  let key = selfDeclaredKey(art);
  if (ctx.registryError !== null) {
    return fail(unverifiable(FORMAT, "io_error", ctx.registryError, ann, "identity"));
  }
  if (ctx.registry === null) {
    ann[p("identity")] = "no_registry_supplied";
    if (!ctx.allowUnregistered) {
      return fail(
        unverifiable(
          FORMAT,
          "key_unresolvable",
          `no published key registry supplied (--registry); the signer ${art.attester} cannot be resolved to a published identity. ` +
            `Pass --allow-unregistered-signer to check the structure anyway, which asserts nothing about identity`,
          ann,
          "identity",
        ),
      );
    }
  } else {
    const res = resolveRegistryKey(ctx.registry, art.attester, ctx.now);
    const cmp = compareRegistrySchema(art, ctx.registry);
    ann[p("registry_schema")] = cmp.line;
    if (cmp.domainLine !== null) ann[p("registry_domain_version")] = cmp.domainLine;

    // THE KEY'S ROLE, on every result whose signer resolved to a registry entry
    // — including each refusal below. A reader must not have to reach VALID to
    // learn that the registry labels this key a sample signer, and a consumer
    // must not have to know what `insight-oracle-safety-sample` means by name.
    // The role NEVER moves the verdict: this tool verifies receipts under
    // formats, and what a role is good for is the caller's policy.
    if (res.status !== "not_found") {
      ann[p("identity_key_role")] = roleLabel(res.key);
      if (res.key.role !== null && res.key.role !== ATTESTER_ROLE) {
        ann[p("identity_role_observation")] = roleObservation(res.key.role);
      }
      // The registry's own words about the key, where it publishes any. Carried
      // verbatim; this tool does not summarise the issuer.
      if (res.key.note !== null) ann[p("identity_key_registry_note")] = res.key.note;
    }

    // BOTH WINDOW COMPARISONS, computed before either can refuse, so a refusal
    // on one still shows what the other found. They are different facts: the
    // `--now` one is "was this key good at the instant you asked about", the
    // signing one is "was it good when this artefact says it was made", and a
    // receipt can pass either while failing the other. Only the three statuses
    // that got past `window_malformed` have a window readable enough to compare.
    let signingWindow: SigningWindow | null = null;
    if (res.status === "valid" || res.status === "expired" || res.status === "not_yet_valid") {
      signingWindow = keyWindowAtSigningTime(res.key, art);
      ann[p("identity_key_window_at_signing")] = signingWindowLine(res.key, signingWindow);
      const si = signingInstant(art);
      if (!("missing" in si)) {
        ann[p("identity_signing_instant")] =
          `${si.member} ${instantLine(si.at)} — ${si.signed ? "a signed field" : "package metadata, OUTSIDE the signed bytes"}` +
          (si.alsoSigned === null ? "" : `; the signed ${si.alsoSigned.member} reads ${instantLine(si.alsoSigned.at)}`) +
          (si.signedAtUnreadable === null ? "" : `; signedAt is present and is not an instant (${JSON.stringify(si.signedAtUnreadable)}), so it was not read`);
      }
    }

    if (res.status === "not_found") {
      ann[p("identity")] = "signer_not_in_registry";
      if (!ctx.allowUnregistered) {
        return fail(
          unverifiable(
            FORMAT,
            "key_unresolvable",
            `signer ${art.attester} is not among the ${ctx.registry.keys.length} published keys in ${ctx.registry.origin}. ` +
              `The signature is well-formed and self-consistent, but no published identity is established. ` +
              `Pass --allow-unregistered-signer to continue, which asserts nothing about identity`,
            ann,
            "identity",
          ),
        );
      }
    } else if (res.status === "revoked") {
      // The issuer has withdrawn this key. UNVERIFIABLE and not INVALID for the
      // same reason an expired key is: nothing here says the signature is bad.
      // But unlike an expired key, no `--now` recovers it — revocation is not a
      // window — so the detail says that rather than suggesting a re-run.
      ann[p("identity")] = `key_revoked (${res.key.keyId})`;
      ann[p("identity_revoked")] = true;
      ann[p("identity_revoked_via")] = res.via;
      return fail(
        unverifiable(
          FORMAT,
          "key_revoked",
          `signer ${art.attester} resolves to published key ${res.key.keyId} in ${ctx.registry.origin}, and that key is revoked: ` +
            `${res.via}. A revoked key establishes no identity at any instant, so unlike a closed validity window this is not ` +
            `recoverable by re-running with a different --now`,
          ann,
          "identity",
        ),
      );
    } else if (res.status === "revocation_list_unreadable") {
      ann[p("identity")] = `revocation_list_unreadable (${res.key.keyId})`;
      return fail(
        unverifiable(
          FORMAT,
          "malformed_member",
          `the registry at ${ctx.registry.origin} publishes a \`revoked_keys\` list carrying ${res.entries.length} ` +
            `entr${res.entries.length === 1 ? "y" : "ies"} in no shape this tool reads (${res.entries.join("; ")}). ` +
            `An entry that cannot be read cannot be shown NOT to name signer ${art.attester}, so no key from this registry is ` +
            `cleared until the list is understood. Readable shapes: a bare address or key_id string, or an object with ` +
            `\`public_key\` and/or \`key_id\``,
          ann,
          "identity",
        ),
      );
    } else if (res.status === "window_malformed") {
      // Fail closed. An unreadable window is an unknown state, and the safe
      // reading of an unknown state is not "open ended".
      ann[p("identity")] = `key_window_unreadable (${res.key.keyId})`;
      return fail(
        unverifiable(
          FORMAT,
          "malformed_member",
          `the registry entry for signer ${art.attester} (${res.key.keyId}) in ${ctx.registry.origin} publishes a validity window that is not an ISO-8601 instant: ` +
            `${res.members.join("; ")}. The window is not readable, so it is not treated as open ended and no identity is established`,
          ann,
          "identity",
        ),
      );
    } else if (res.status === "expired") {
      // The B-29 case. The key is listed and unrevoked; its window has shut.
      // UNVERIFIABLE, not INVALID: nothing here says the signature is bad, only
      // that the registry no longer vouches for the key at this instant. The
      // way to verify a receipt signed before the rotation is to pass the
      // instant it was signed at as --now, not to waive the check.
      ann[p("identity")] = `key_expired (${res.key.keyId})`;
      ann[p("identity_key_window")] = `validUntil ${instantLine(res.validUntil)}, evaluated at ${instantLine(ctx.now)}`;
      return fail(
        unverifiable(
          FORMAT,
          "expired",
          `signer ${art.attester} resolves to published key ${res.key.keyId} in ${ctx.registry.origin}, but that key's ` +
            `validUntil is ${instantLine(res.validUntil)} and the evaluation instant is ${instantLine(ctx.now)}, ` +
            `${ctx.now - res.validUntil}s past it. The key is still listed and is not marked revoked — this registry retains a rotated-out ` +
            `key for overlap — so being listed does not establish identity here. Re-run with --now inside the window to verify the artefact ` +
            `as of when it was signed`,
          ann,
          "identity",
        ),
      );
    } else if (res.status === "not_yet_valid") {
      ann[p("identity")] = `key_not_yet_valid (${res.key.keyId})`;
      ann[p("identity_key_window")] = `validFrom ${instantLine(res.validFrom)}, evaluated at ${instantLine(ctx.now)}`;
      return fail(
        unverifiable(
          FORMAT,
          "not_yet_valid",
          `signer ${art.attester} resolves to published key ${res.key.keyId} in ${ctx.registry.origin}, but that key's ` +
            `validFrom is ${instantLine(res.validFrom)} and the evaluation instant is ${instantLine(ctx.now)}, ` +
            `${res.validFrom - ctx.now}s before it`,
          ann,
          "identity",
        ),
      );
    } else {
      // The key is good at the instant the CALLER asked about — recorded here,
      // before the second question, so a refusal on that one still carries the
      // answer to this one. One question is left, and it is the one the old code
      // never asked.
      //
      // ORDER, and why it is this one. The `--now` comparison runs FIRST and
      // keeps the exact answer it has always given, so no caller's verdict moves
      // for a receipt whose own instant was never in question — an `expired` key
      // still reports `expired`, and the detail still tells the caller to re-run
      // with `--now` inside the window. This check runs on what survives that,
      // which is exactly the case the old code let through: a `--now` inside the
      // key's window and an artefact that says it was made outside it. Unlike
      // `expired`, no `--now` recovers this one, so the detail says so rather
      // than suggesting a re-run — the same reason revocation outranks the
      // window above.
      ann[p("identity_key_window")] = `inside — evaluated at ${instantLine(ctx.now)} against key ${res.key.keyId} ${windowLine(res.key)}`;
      if (signingWindow !== null && (signingWindow.status === "before" || signingWindow.status === "after")) {
        const edge =
          signingWindow.status === "after"
            ? `${signingWindow.at - signingWindow.validUntil}s PAST that key's validUntil ${instantLine(signingWindow.validUntil)}`
            : `${signingWindow.validFrom - signingWindow.at}s BEFORE that key's validFrom ${instantLine(signingWindow.validFrom)}`;
        ann[p("identity")] = `signed_outside_key_window (${res.key.keyId})`;
        return fail(
          unverifiable(
            FORMAT,
            "signed_outside_key_window",
            `signer ${art.attester} resolves to published key ${res.key.keyId} in ${ctx.registry.origin}, and that key's window is ` +
              `open at the evaluation instant ${instantLine(ctx.now)} — but the ${art.label}'s own ${signingWindow.member} is ` +
              `${instantLine(signingWindow.at)}, ${edge}. The registry was not vouching for this key when this artefact says it was ` +
              `made, so no published identity is established for it at any evaluation instant: unlike a closed window at --now, this ` +
              `is not recoverable by re-running with a different --now`,
            ann,
            "identity",
          ),
        );
      }
      // No `identity_revoked` annotation here any more: revocation is caught
      // above, so a key reaching this branch is not revoked and a conditional
      // that can never fire would only look like a check.
      ann[p("identity")] = `signer_in_registry (${res.key.keyId}, role ${roleLabel(res.key)})`;
      key = { kid: res.key.keyId, alg: "EIP-712/secp256k1", origin: ctx.registry.origin };
    }
  }

  // ---- 6. freshness ------------------------------------------------------
  const validUntil = num(art.data["validUntil"]);
  const checkedAt = num(art.data["checkedAt"]);
  const executedAt = num(art.data["executedAt"]);
  const validFor = num(art.data["validForSeconds"]);
  const anchor = checkedAt ?? executedAt;
  const anchorName = checkedAt !== null ? "checkedAt" : "executedAt";
  if (validUntil !== null && anchor !== null && validFor !== null) {
    ann[p("validity_window")] = validUntil === anchor + validFor ? `${anchorName} + ${validFor}s` : `INCONSISTENT: validUntil ${validUntil} != ${anchorName} ${anchor} + ${validFor}`;
  }
  const age = num(art.data["oracleDataAgeAtExecSeconds"]);
  const preSigned = num(art.data["preTradeSignedAt"]);
  if (age !== null && executedAt !== null && preSigned !== null) {
    ann[p("oracle_data_age_consistent")] = age === executedAt - preSigned;
  }
  if (validUntil !== null && ctx.now > validUntil) {
    return fail(
      invalid(
        FORMAT,
        "expired",
        `${art.label} expired: validUntil ${validUntil}` +
          `${anchor !== null ? ` (${anchorName} ${anchor}${validFor !== null ? ` + ${validFor}s` : ""})` : ""}` +
          `, evaluated at ${ctx.now}, ${ctx.now - validUntil}s past the window`,
        key,
        "freshness",
      ),
    );
  }

  return { ok: true, key, ann, digest };
}

// ---------------------------------------------------------------------------
// 7. binding — receipt to the gate whose bytes it names
// ---------------------------------------------------------------------------

/**
 * An integer amount rendered exactly at `decimals` places. `Number` carries 15-16
 * significant digits and a WETH amount carries 19, so the counterparty's flow
 * would lose its last four digits on the way through a float. These are evidence
 * values; they are carried as strings so they arrive whole.
 */
function decimalString(v: bigint, decimals: number): string {
  const neg = v < 0n;
  const abs = neg ? -v : v;
  const scale = 10n ** BigInt(decimals);
  const whole = abs / scale;
  const frac = (abs % scale).toString().padStart(decimals, "0");
  return `${neg ? "-" : ""}${whole}${decimals > 0 ? `.${frac}` : ""}`;
}

/** numer/denom truncated (never rounded) to `places` decimals. No float. */
function divideDecimal(numer: bigint, denom: bigint, places: number): string {
  if (denom === 0n) return "undefined";
  const neg = numer < 0n !== denom < 0n;
  const a = numer < 0n ? -numer : numer;
  const b = denom < 0n ? -denom : denom;
  return `${neg ? "-" : ""}${decimalString((a * 10n ** BigInt(places)) / b, places)}`;
}

/** Round-half-up integer division, for recomputing a scaled fixed-point price. */
function divRoundHalfUp(numer: bigint, denom: bigint): bigint {
  return (2n * numer + denom) / (2n * denom);
}

/** Exact (numer/denom - 1) * 1e4, rendered with `dp` decimals. No float. */
function ratioBps(numer: bigint, denom: bigint, dp = 6): string {
  if (denom === 0n) return "undefined";
  const scale = 10n ** BigInt(dp);
  const v = ((numer - denom) * 10000n * scale) / denom;
  const neg = v < 0n;
  const abs = neg ? -v : v;
  return `${neg ? "-" : ""}${abs / scale}.${(abs % scale).toString().padStart(dp, "0")}`;
}

type BindOutcome = { ok: true; ann: Ann } | { ok: false; detail: string };

/**
 * Bind the receipt to ONE gate, in the role the receipt gives it.
 *
 * `source` is the gate named by `preTradeUid`; the receipt's request IS that
 * gate's request, so requestHash and both asset ids must be equal.
 *
 * `destination` is the gate named by `destinationPreTradeUid`, and it carries
 * the MIRROR request — the same pair the other way round. Its `requestHash`
 * therefore differs from the receipt's by design, and requiring equality there
 * would report a correct package as broken. What must hold instead is that the
 * two asset ids are each other's opposite, which is a stronger statement than
 * "some second gate exists": it fails if the destination gate priced a
 * different pair.
 */
function checkBinding(receipt: Attestation, gate: Attestation, role: "source" | "destination"): BindOutcome {
  const ann: Ann = {};
  const r = receipt.data;
  const g = gate.data;
  const mismatches: string[] = [];
  const uidField = role === "source" ? "preTradeUid" : "destinationPreTradeUid";

  if (gate.uid !== undefined && !sameAddress(str(r[uidField]) ?? "", gate.uid)) {
    mismatches.push(`${uidField} ${String(r[uidField])} != ${role}Gate.uid ${gate.uid}`);
  }
  if (JSON.stringify(r["subjectChainId"]) !== JSON.stringify(g["subjectChainId"])) {
    mismatches.push(`subjectChainId ${JSON.stringify(r["subjectChainId"])} != gate ${JSON.stringify(g["subjectChainId"])}`);
  }

  if (role === "source") {
    for (const f of ["requestHash", "sourceAssetId", "destinationAssetId"]) {
      if (JSON.stringify(r[f]) !== JSON.stringify(g[f])) {
        mismatches.push(`${f} ${JSON.stringify(r[f])} != gate ${JSON.stringify(g[f])}`);
      }
    }
    // v2 receipts quote the source gate's consensus price directly. v3 derives
    // the quote from BOTH gates, which `checkPrices` recomputes; asserting the
    // v2 equality there would report every correct v3 receipt as unbound.
    if (r["priceScale"] === undefined && JSON.stringify(r["quotedPrice"]) !== JSON.stringify(g["consensusPrice"])) {
      mismatches.push(`quotedPrice ${JSON.stringify(r["quotedPrice"])} != gate consensusPrice ${JSON.stringify(g["consensusPrice"])}`);
    }
  } else {
    const mirrored =
      JSON.stringify(r["sourceAssetId"]) === JSON.stringify(g["destinationAssetId"]) &&
      JSON.stringify(r["destinationAssetId"]) === JSON.stringify(g["sourceAssetId"]);
    if (!mirrored) {
      mismatches.push(
        `the destination gate does not price the mirror of the receipt's pair: receipt ${String(r["sourceAssetId"])} -> ` +
          `${String(r["destinationAssetId"])}, gate ${String(g["sourceAssetId"])} -> ${String(g["destinationAssetId"])}`,
      );
    }
    ann["destination_gate_request_hash"] =
      JSON.stringify(r["requestHash"]) === JSON.stringify(g["requestHash"])
        ? `equal to the receipt's (${String(g["requestHash"])}) — NOT expected: the mirror request should hash differently`
        : `${String(g["requestHash"])}, which differs from the receipt's ${String(r["requestHash"])} by design — the destination gate carries the mirror request`;
  }

  if (mismatches.length > 0) return { ok: false, detail: mismatches.join("; ") };
  // The source role keeps the unprefixed annotation names it has always had;
  // the destination role, which is new, is prefixed so the two never collide.
  const k = (name: string): string => (role === "source" ? name : `destination_gate_${name}`);
  ann[k("binding")] =
    role === "source"
      ? "preTradeUid, requestHash, both asset ids and subjectChainId all equal"
      : "destinationPreTradeUid equals the gate uid, subjectChainId equal, and the gate prices the mirror pair";

  // The gate ships the canonical-request type it hashed, so requestHash is
  // recomputable here rather than merely compared field to field. This is the
  // one place the binding stops being "two documents agree" and becomes "the
  // identifier is what the request actually hashes to".
  const cd = obj(gate.eip712["canonicalRequestDomain"]);
  const ct = obj(gate.eip712["canonicalRequestTypes"]);
  const cp = str(gate.eip712["canonicalRequestPrimaryType"]);
  if (cd !== null && ct !== null && cp !== null) {
    const types = ct as unknown as Eip712Types;
    const fields = types[cp];
    if (fields !== undefined) {
      const message: Record<string, unknown> = {};
      for (const f of fields) message[f.name] = g[f.name];
      try {
        const recomputed = hex(eip712Digest(cd as Eip712Domain, cp, types, message));
        ann[k("request_hash_recomputed")] = recomputed;
        if (!sameAddress(recomputed, str(g["requestHash"]) ?? "")) {
          return { ok: false, detail: `the ${role} gate's requestHash ${String(g["requestHash"])} is not the EIP-712 digest of the canonical request it ships, which is ${recomputed}` };
        }
        ann[k("request_hash_matches_canonical_request")] = true;
      } catch (e) {
        ann[k("request_hash_recomputed")] = `not recomputable: ${(e as Error).message}`;
      }
    }
  }
  return { ok: true, ann };
}

/**
 * `preTradeUidsHash` over the two gate uids. The package derives it as the
 * keccak-256 of the two 32-byte values concatenated, source first — the packed
 * encoding, not `abi.encode` of a `bytes32[]`, and not sorted. Three other
 * orderings and encodings are computed here and reported when none matches, so
 * a mismatch says which construction WOULD have produced the signed value
 * rather than only that the signed value is unexplained.
 */
function uidsHashCandidates(src: string, dst: string): Record<string, string> {
  const a = hexToBytes(src.slice(2));
  const b = hexToBytes(dst.slice(2));
  const arrayEncoded = concatBytes(word(32n), word(2n), a, b);
  return {
    "keccak(src || dst), packed": hex(keccak(concatBytes(a, b))),
    "keccak(dst || src), packed": hex(keccak(concatBytes(b, a))),
    "keccak(sorted, packed)": hex(keccak(src.toLowerCase() <= dst.toLowerCase() ? concatBytes(a, b) : concatBytes(b, a))),
    "keccak(abi.encode(bytes32[2]))": hex(keccak(arrayEncoded)),
  };
}

// ---------------------------------------------------------------------------
// 8. swap — the pool event, decoded from the raw log
// ---------------------------------------------------------------------------

/** Uniswap V3 pool Swap event. Written out so topic0 is derived, not pasted. */
const SWAP_SIGNATURE = "Swap(address,address,int256,int256,uint160,uint128,int24)";

/** Decimals for the two tokens this package touches, used only if not supplied. */
const BUILTIN_DECIMALS: Record<string, number> = {
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": 18, // WETH
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": 6, // USDC
};

function toSigned(w: bigint): bigint {
  return w >= 1n << 255n ? w - (1n << 256n) : w;
}

function words(dataHex: string): bigint[] {
  const b = dataHex.slice(2);
  const out: bigint[] = [];
  for (let i = 0; i + 64 <= b.length; i += 64) out.push(BigInt(`0x${b.slice(i, i + 64)}`));
  return out;
}

const scaled = (v: bigint, decimals: number): number => Number(v) / 10 ** decimals;

/** What the decoded Swap event tells the later checks, beyond its annotations. */
export interface SwapFacts {
  sender: string | null;
  recipient: string | null;
  /** Token addresses, lowercase, as the package's `legs` name them. */
  soldToken: string;
  boughtToken: string;
  soldDecimals: number;
  boughtDecimals: number;
  /** Raw integer amounts, positive: what the pool took in and what it paid out. */
  soldAbs: bigint;
  boughtAbs: bigint;
}

type SwapOutcome =
  | { ok: true; ann: Ann; facts: SwapFacts }
  | { ok: false; detail: string }
  | { ok: "skip"; ann: Ann };

function checkSwap(receipt: Attestation, onchain: Record<string, unknown>, opts: VerifyOptions): SwapOutcome {
  const ann: Ann = {};
  const ev = obj(onchain["rawSwapEvent"]);
  if (ev === null) return { ok: "skip", ann: { swap: "not_checked (package carries no rawSwapEvent)" } };
  const topics = ev["topics"];
  if (!Array.isArray(topics) || topics.length === 0) return { ok: false, detail: "rawSwapEvent has no topics" };

  const expected = hex(keccak(utf8ToBytes(SWAP_SIGNATURE)));
  const topic0 = str(topics[0]) ?? "";
  if (!sameAddress(topic0, expected)) {
    return { ok: false, detail: `rawSwapEvent topic0 ${topic0} is not keccak("${SWAP_SIGNATURE}") = ${expected}` };
  }
  ann["swap_topic0"] = `keccak("${SWAP_SIGNATURE}")`;
  const sender = topics.length > 1 ? `0x${(str(topics[1]) ?? "").slice(-40)}` : null;
  const recipient = topics.length > 2 ? `0x${(str(topics[2]) ?? "").slice(-40)}` : null;
  if (sender !== null) ann["swap_sender"] = sender;
  if (recipient !== null) ann["swap_recipient"] = recipient;
  if (sender !== null && recipient !== null) {
    ann["swap_sender_equals_recipient"] = sameAddress(sender, recipient);
  }

  const w = words(str(ev["data"]) ?? "0x");
  if (w.length < 5) return { ok: false, detail: `rawSwapEvent data is ${w.length} words, expected 5` };
  const amount0 = toSigned(w[0]!);
  const amount1 = toSigned(w[1]!);

  const legs = obj(onchain["legs"]);
  const sold = (str(legs?.["soldToken"]) ?? "").toLowerCase();
  const bought = (str(legs?.["boughtToken"]) ?? "").toLowerCase();
  if (sold === "" || bought === "") return { ok: "skip", ann: { swap: "not_checked (package names no legs)" } };

  // Uniswap V3 orders token0 < token1 by address. Both leg addresses are in the
  // package, so which amount belongs to which token is derivable here without
  // an RPC call.
  const token0 = sold < bought ? sold : bought;
  const amtSold = token0 === sold ? amount0 : amount1;
  const amtBought = token0 === bought ? amount0 : amount1;
  ann["swap_amounts"] = `amount0 ${amount0}, amount1 ${amount1} (token0 ${token0})`;

  const supplied = opts.tokens;
  const decOf = (a: string): number | undefined => supplied?.[a] ?? BUILTIN_DECIMALS[a];
  const dSold = decOf(sold);
  const dBought = decOf(bought);
  if (dSold === undefined || dBought === undefined) {
    return { ok: "skip", ann: { swap: `not_checked (no decimals known for ${dSold === undefined ? sold : bought}; supply --tokens)` } };
  }
  ann["token_decimals_source"] =
    supplied?.[sold] !== undefined && supplied[bought] !== undefined
      ? "options.tokens"
      : `built-in table (WETH 18, USDC 6)`;

  // The taker sold into the pool (positive) and the pool paid out (negative).
  if (amtSold <= 0n || amtBought >= 0n) {
    return { ok: false, detail: `swap amounts do not have the expected signs for the stated legs: sold ${amtSold}, bought ${amtBought}` };
  }
  const soldHuman = scaled(amtSold, dSold);
  const boughtHuman = scaled(-amtBought, dBought);
  const poolPrice = boughtHuman / soldHuman;
  ann["pool_price"] = poolPrice;

  const executed = num(receipt.data["executedPrice"]);
  const quoted = num(receipt.data["quotedPrice"]);
  if (executed === null || quoted === null) return { ok: false, detail: "receipt carries no executedPrice/quotedPrice to compare against" };

  // v3 signs the fixed-point exponent as `priceScale`. v2 did not, and every v2
  // artefact seen used 8; the assumption is recorded rather than made silently,
  // because a wrong exponent moves the price by a factor of ten and nothing else
  // in the artefact would contradict it.
  const declaredScale = num(receipt.data["priceScale"]);
  const scale = declaredScale ?? 8;
  ann["price_scale"] = declaredScale !== null ? `${scale} (signed by the issuer)` : `${scale} (ASSUMED; this artefact declares no priceScale)`;
  const scaleFactor = 10n ** BigInt(scale);

  // "At the receipt's precision": the receipt is fixed point at `scale`, so the
  // pool price is compared at that many decimals rather than to the last float
  // bit. At WETH-per-USDC and scale 8 that is only five significant digits — one
  // unit is 0.24 bps — so the comparison is reported with the precision it has.
  const executedHuman = executed / Number(scaleFactor);
  ann["receipt_executed_price"] = executedHuman;
  const agrees = poolPrice.toFixed(scale) === executedHuman.toFixed(scale);
  if (!agrees) {
    return { ok: false, detail: `pool fill price ${poolPrice} does not equal the signed executedPrice ${executedHuman} at ${scale} decimals` };
  }
  ann["pool_price_equals_executed_price"] = `at ${scale} decimals, the receipt's own precision`;
  ann["pool_price_exact"] = divideDecimal(-amtBought * 10n ** BigInt(dSold), amtSold * 10n ** BigInt(dBought), 18);

  // Exact, from the integer amounts: (bought/10^db) / (sold/10^ds) / (quoted/10^scale) - 1, in bps.
  const numer = -amtBought * 10n ** BigInt(dSold) * scaleFactor;
  const denom = amtSold * 10n ** BigInt(dBought) * BigInt(quoted);
  ann["delta_bps"] = ratioBps(numer, denom);
  const maxSlip = num(receipt.data["maxSlippageBps"]);
  if (maxSlip !== null) {
    const withinNumer = numer > denom ? numer - denom : denom - numer;
    const faithful = withinNumer * 10000n <= denom * BigInt(maxSlip);
    ann["swap_status_under_signed_max"] = `${faithful ? "FAITHFUL" : "DEVIATED"} under maxSlippageBps ${maxSlip}`;
  }
  return {
    ok: true,
    ann,
    facts: {
      sender,
      recipient,
      soldToken: sold,
      boughtToken: bought,
      soldDecimals: dSold,
      boughtDecimals: dBought,
      soldAbs: amtSold,
      boughtAbs: -amtBought,
    },
  };
}

// ---------------------------------------------------------------------------
// 9. attribution — who actually received the bought token
// ---------------------------------------------------------------------------

const TRANSFER_SIGNATURE = "Transfer(address,address,uint256)";

/**
 * Attribution, counterparty-side.
 *
 * The 06:08Z package claimed a price "the taker realised" that did not
 * reproduce; the repaired package narrows the claim to the party the pool
 * actually settled with, and this check is built to that narrower claim and
 * refuses to grade anything wider.
 *
 * A fill is CLEAN when one address is both the Swap's sender and its recipient,
 * both legs settle to that address, and no other address moves either token in
 * the transaction. Then, and only then, the realised rate is that address's own
 * two flows, and it equals the pool leg by construction. Anything else -- a
 * recipient that forwards, a fee taken by a third address, a multi-hop route --
 * is reported as `not_clean` with the reason, the price is left to the receipt,
 * and the beneficiary measurement is printed beside it without being called
 * anyone's realised price. Never mis-graded, never silently skipped.
 */
function checkAttribution(receipt: Attestation, onchain: Record<string, unknown>, facts: SwapFacts | null, opts: VerifyOptions): Ann {
  const logs = onchain["rawTransferLogs"];
  if (!Array.isArray(logs) || logs.length === 0) return { attribution: "not_checked (package carries no rawTransferLogs)" };
  const ann: Ann = {};
  const topic0 = hex(keccak(utf8ToBytes(TRANSFER_SIGNATURE)));

  // net[token][address] over EVERY Transfer log in the transaction.
  const net: Record<string, Record<string, bigint>> = {};
  let counted = 0;
  for (const l of logs) {
    const e = obj(l);
    if (e === null) continue;
    const t = e["topics"];
    if (!Array.isArray(t) || t.length < 3 || !sameAddress(str(t[0]) ?? "", topic0)) continue;
    const token = (str(e["address"]) ?? "").toLowerCase();
    const from = `0x${(str(t[1]) ?? "").slice(-40)}`;
    const to = `0x${(str(t[2]) ?? "").slice(-40)}`;
    const amt = BigInt(str(e["data"]) ?? "0x0");
    net[token] ??= {};
    net[token]![from] = (net[token]![from] ?? 0n) - amt;
    net[token]![to] = (net[token]![to] ?? 0n) + amt;
    counted++;
  }
  ann["attribution_transfer_logs"] = counted;

  // The receipt's own naming of the party, printed whether or not it is
  // corroborated. `claimRole` is what scopes the claim, so it is never omitted.
  const subject = str(receipt.data["subject"]);
  const taker = str(receipt.data["taker"]);
  const claimRole = str(receipt.data["claimRole"]);
  if (claimRole !== null) ann["claim_role"] = claimRole;
  if (subject !== null) ann["receipt_subject"] = subject;
  if (taker !== null) ann["receipt_taker"] = taker;

  if (facts === null || facts.recipient === null || facts.boughtToken === "") {
    return { ...ann, attribution: "not_checked (no swap recipient or unknown token decimals)" };
  }
  const { sender, recipient, soldToken, boughtToken, soldDecimals: dS, boughtDecimals: dB } = facts;
  const pool = (str(obj(onchain["rawSwapEvent"])?.["address"]) ?? "").toLowerCase();

  const boughtNet = net[boughtToken] ?? {};
  const soldNet = net[soldToken] ?? {};
  const movers = (m: Record<string, bigint>): string[] =>
    Object.entries(m)
      .filter(([a, v]) => v !== 0n && !sameAddress(a, pool))
      .map(([a]) => a.toLowerCase());
  const parties = [...new Set([...movers(boughtNet), ...movers(soldNet)])];

  const recipientBought = boughtNet[recipient] ?? 0n;
  const recipientSold = soldNet[recipient] ?? 0n;
  const reasons: string[] = [];
  if (sender !== null && !sameAddress(sender, recipient)) reasons.push(`the Swap's sender ${sender} is not its recipient ${recipient}`);
  if (parties.length > 1) reasons.push(`${parties.length} addresses other than the pool move a leg of this trade (${parties.join(", ")})`);
  if (recipientBought <= 0n) reasons.push(`the recipient's net of the bought token is ${decimalString(recipientBought, dB)}, which is not a receipt of it`);
  if (recipientSold >= 0n) reasons.push(`the recipient's net of the sold token is ${decimalString(recipientSold, dS)}, which is not a payment of it`);
  const clean = reasons.length === 0;

  ann["counterparty"] = recipient;
  ann["counterparty_net_bought"] = `${recipientBought > 0n ? "+" : ""}${decimalString(recipientBought, dB)}`;
  ann["counterparty_net_sold"] = decimalString(recipientSold, dS);

  if (clean) {
    // Exact, from the integer flows. It equals the pool leg here because there
    // is no fee path and nothing routes onward -- a property of THIS archetype,
    // asserted above, not an assumption made about fills generally.
    ann["counterparty_realised_price"] = divideDecimal(recipientBought * 10n ** BigInt(dS), -recipientSold * 10n ** BigInt(dB), 18);
    ann["attribution"] =
      `clean_single_pool_fill -- ${recipient} is both the Swap's sender and its recipient, both legs settle to it, ` +
      `and no other address moves either token; its realised rate is the pool leg`;
    for (const [label, named] of [
      ["subject", subject],
      ["taker", taker],
    ] as const) {
      if (named !== null) ann[`receipt_${label}_is_the_observed_counterparty`] = sameAddress(named, recipient);
    }
    const fee = num(receipt.data["actualFeeUsd"]);
    if (fee === 0) ann["fee_recorded_zero"] = "consistent with the logs: no third party takes a share of this fill";
    return ann;
  }

  ann["attribution"] =
    `not_clean (${reasons.join("; ")}) -- the price is left to the receipt, and the measurement below is a different ` +
    `quantity, not the realised price of anyone`;

  // The beneficiary is the largest net receiver of the bought token that is not
  // the swap's own recipient. On the 06:08Z transaction the recipient nets zero
  // and forwards everything on, so "who was paid" is a different address from
  // "who the pool paid".
  const receivers = Object.entries(boughtNet)
    .filter(([a, v]) => v > 0n && !sameAddress(a, recipient))
    .sort((x, y) => (y[1] > x[1] ? 1 : y[1] < x[1] ? -1 : 0));
  ann["recipient_net_bought"] = scaled(recipientBought, dB);
  ann["recipient_net_sold"] = scaled(recipientSold, dS);
  if (receivers.length === 0) return ann;

  const [benefAddr, benefAmt] = receivers[0]!;
  ann["beneficiary"] = benefAddr;
  ann["beneficiary_received"] = scaled(benefAmt, dB);

  if (receivers.length > 1) {
    const [thirdAddr, thirdAmt] = receivers[1]!;
    ann["third_party"] = thirdAddr;
    ann["third_party_received"] = scaled(thirdAmt, dB);
    // Share OF THE POOL'S OUTPUT -- what the trade produced -- not of the
    // beneficiary's share of it. Rounded to four decimals of a percent, which is
    // where the exact ratio 178645992/21017175576 sits.
    if (facts.boughtAbs > 0n) {
      ann["third_party_share_pct"] = Math.round((Number(thirdAmt) * 1e6) / Number(facts.boughtAbs)) / 10000;
    }
  }

  const quoted = num(receipt.data["quotedPrice"]);
  const scale = num(receipt.data["priceScale"]) ?? 8;
  const soldAmt = -recipientSold;
  if (quoted !== null && soldAmt > 0n) {
    const realised = scaled(benefAmt, dB) / scaled(soldAmt, dS);
    ann["realised_price_to_beneficiary"] = realised;
    const numer = benefAmt * 10n ** BigInt(dS) * 10n ** BigInt(scale);
    const denom = soldAmt * 10n ** BigInt(dB) * BigInt(quoted);
    ann["realised_delta_bps"] = ratioBps(numer, denom);

    const signedMax = num(receipt.data["maxSlippageBps"]);
    const diff = numer > denom ? numer - denom : denom - numer;
    const verdictAt = (bps: number): string => (diff * 10000n <= denom * BigInt(bps) ? "FAITHFUL" : "DEVIATED");
    const registryDefault = 50;
    ann["realised_vs_receipt"] =
      `${verdictAt(registryDefault)} under registry default ${registryDefault}` +
      `${signedMax !== null ? `, ${verdictAt(signedMax)} under signed ${signedMax}` : ""}`;
  }

  // A fee of zero beside an in-transaction outflow from the recipient is a
  // statement the receipt makes and the logs do not support. Reported, never a
  // verdict: the receipt does not define actualFeeUsd as covering this.
  const fee = num(receipt.data["actualFeeUsd"]);
  if (fee === 0 && receivers.length > 1) ann["fee_not_recorded"] = true;

  return ann;
}

// ---------------------------------------------------------------------------
// 9b. prices at the signed scale, and the quote the gates imply
// ---------------------------------------------------------------------------

type PriceOutcome = { ok: true; ann: Ann } | { ok: false; detail: string };

/**
 * v3 signs `priceScale` and derives `quotedPrice` from BOTH gates: the source
 * asset's consensus price over the destination asset's, carried at that scale.
 * Recomputing it is what turns `bindingMode: VERIFIED` from a label into a
 * checkable statement -- a receipt whose quote does not come out of the gates it
 * names has not bound its price to them, however well the uids match.
 *
 * Two deltas are reported because they are two different measurements and the
 * difference between them is a property of the format worth seeing. The
 * unrounded one divides the pool's own integer amounts by the gates' consensus
 * ratio. The signed-integer one divides the two scaled integers the issuer
 * actually signed. At WETH-per-USDC and scale 8 the signed pair carries five
 * significant digits -- one unit is 0.24 bps -- so they differ in the first
 * decimal, and anyone recomputing from signed fields alone will get the second.
 */
function checkPrices(receipt: Attestation, sourceGate: Attestation | null, destinationGate: Attestation | null, facts: SwapFacts | null): PriceOutcome {
  const ann: Ann = {};
  const d = receipt.data;
  const quoted = num(d["quotedPrice"]);
  const executed = num(d["executedPrice"]);
  if (quoted === null || executed === null) return { ok: true, ann: { prices: "not_checked (the receipt carries no quotedPrice/executedPrice)" } };
  const scale = num(d["priceScale"]) ?? 8;
  const scaleFactor = 10n ** BigInt(scale);

  ann["quoted_price_at_scale"] = decimalString(BigInt(quoted), scale);
  ann["executed_price_at_scale"] = decimalString(BigInt(executed), scale);

  const srcC = sourceGate === null ? null : num(sourceGate.data["consensusPrice"]);
  const dstC = destinationGate === null ? null : num(destinationGate.data["consensusPrice"]);
  if (srcC !== null && dstC !== null && dstC !== 0 && d["priceScale"] !== undefined) {
    const recomputed = divRoundHalfUp(BigInt(srcC) * scaleFactor, BigInt(dstC));
    ann["quoted_price_recomputed_from_gates"] =
      `${recomputed} = round(source consensus ${srcC} / destination consensus ${dstC} x 1e${scale}); ` +
      `unrounded ${divideDecimal(BigInt(srcC) * scaleFactor, BigInt(dstC), 6)}`;
    if (recomputed !== BigInt(quoted)) {
      return {
        ok: false,
        detail:
          `the receipt signs quotedPrice ${quoted}, but the two gates it binds to imply ${recomputed} ` +
          `(source consensus ${srcC} / destination consensus ${dstC}, scaled by 1e${scale}). ` +
          `bindingMode ${String(d["bindingMode"])} states the quote is derived from these gates and it is not`,
      };
    }
    ann["quoted_price_matches_gates"] = true;

    if (facts !== null) {
      // Exact: (bought/10^dB) / (sold/10^dS) / (srcC/dstC) - 1, in bps.
      const numer = facts.boughtAbs * 10n ** BigInt(facts.soldDecimals) * BigInt(dstC);
      const denom = facts.soldAbs * 10n ** BigInt(facts.boughtDecimals) * BigInt(srcC);
      ann["delta_bps_unrounded"] = ratioBps(numer, denom);
      ann["delta_bps_basis"] =
        "three deltas appear above and they are three different measurements: `delta_bps` is the pool fill against the " +
        "SIGNED quotedPrice; `delta_bps_unrounded` is the pool fill against the gates' unrounded consensus ratio; " +
        "`delta_bps_signed_integers` is executedPrice against quotedPrice, both exactly as the issuer signed them. They " +
        `disagree in the first decimal because priceScale ${scale} in this orientation carries five significant digits ` +
        "and one unit is 0.24 bps; a stranger recomputing from signed fields alone gets the third.";
    }
  }

  ann["delta_bps_signed_integers"] = ratioBps(BigInt(executed), BigInt(quoted));

  // The status the signed numbers support, recomputed. Precedence dominates:
  // a gate signed after the block it gates cannot certify the price it quoted,
  // whatever the delta, so the only honest recomputation is UNDETERMINED.
  const pts = num(d["preTradeSignedAt"]);
  const ex = num(d["executedAt"]);
  const maxSlip = num(d["maxSlippageBps"]);
  const statusField = "priceExecutionStatus" in d ? "priceExecutionStatus" : "executionStatus" in d ? "executionStatus" : null;
  if (statusField !== null && maxSlip !== null) {
    const diff = executed > quoted ? BigInt(executed - quoted) : BigInt(quoted - executed);
    const within = diff * 10000n <= BigInt(quoted) * BigInt(maxSlip);
    const afterBlock = pts !== null && ex !== null && pts >= ex;
    const recomputedStatus = afterBlock ? "UNDETERMINED" : within ? "FAITHFUL" : "DEVIATED";
    ann[`${statusField}_recomputed`] =
      `${recomputedStatus} (${afterBlock ? "the gate was signed at or after the block, so no price precedence is available" : `delta ${ratioBps(BigInt(executed), BigInt(quoted))} bps against maxSlippageBps ${maxSlip}`})`;
    const signedStatus = str(d[statusField]);
    if (signedStatus !== null) {
      ann[`${statusField}_agrees`] =
        signedStatus === recomputedStatus ? true : `NO: the receipt signs ${signedStatus}, recomputation gives ${recomputedStatus}`;
    }
  }
  return { ok: true, ann };
}

// ---------------------------------------------------------------------------
// 9c. measuredFieldsHash, recomputed from the declared measured set
// ---------------------------------------------------------------------------

/**
 * The receipt signs a hash over the set of fields it says were MEASURED rather
 * than asserted. The package enumerates that set outside the signature, so this
 * comparison is REPORTED and never a verdict, for the same reason
 * `registry_schema` is: the unsigned side is the side that can be wrong, and
 * calling the receipt invalid because a document beside it disagrees would put
 * the fault in the wrong place. Saying nothing, though, would let an empty
 * enumeration pass for a checked one.
 */
function checkMeasuredFields(receipt: Attestation, raw: Record<string, unknown>): Ann {
  const signed = str(receipt.data["measuredFieldsHash"]);
  if (signed === null) return {};
  const block = obj(raw["measuredFields"]);
  const declared = block === null ? null : block["measured"];
  if (!Array.isArray(declared)) {
    return { measured_fields_hash: `not_checked (the receipt signs ${signed}, and the package enumerates no measured set to recompute it from)` };
  }
  const names = declared.map((v) => str(v) ?? "").sort();
  // The package's own enumerationNote: keccak256(join("-", sorted names)), and
  // the empty set is the empty string, whose keccak is 0xc5d2...a470.
  const preimage = names.join("-");
  const recomputed = hex(keccak(utf8ToBytes(preimage)));
  const ann: Ann = {
    measured_fields_declared: names.length === 0 ? "the empty set" : names.join(", "),
    measured_fields_hash_recomputed: recomputed,
  };
  ann["measured_fields_hash"] = sameAddress(recomputed, signed)
    ? `match — keccak(${names.length === 0 ? '""' : JSON.stringify(preimage)}) equals the signed measuredFieldsHash`
    : `MISMATCH — the signed measuredFieldsHash is ${signed}, but the package's declared measured set hashes to ${recomputed}`;
  return ann;
}

// ---------------------------------------------------------------------------
// 10. chain — optional corroboration against a JSON-RPC endpoint
// ---------------------------------------------------------------------------

type ChainOutcome = { ok: true; ann: Ann } | { ok: false; detail: string } | { ok: "io"; detail: string };

async function checkChain(
  receipt: Attestation,
  onchain: Record<string, unknown>,
  rpc: string,
  recipient: string | null,
): Promise<ChainOutcome> {
  const { createHash } = await import("node:crypto");
  const ann: Ann = {};
  const call = async (method: string, params: unknown[]): Promise<{ result: unknown; digest: string }> => {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`${method}: HTTP ${res.status}`);
    const digest = createHash("sha256").update(text).digest("hex");
    const parsed = JSON.parse(text) as { result?: unknown; error?: { message?: string } };
    if (parsed.error !== undefined) throw new Error(`${method}: ${parsed.error.message ?? "RPC error"}`);
    return { result: parsed.result, digest };
  };

  const txHash = str(receipt.data["txHash"]) ?? str(onchain["txHash"]) ?? "";
  if (txHash === "") return { ok: "io", detail: "no txHash to look up" };

  let receiptRes: { result: unknown; digest: string };
  let blockRes: { result: unknown; digest: string };
  try {
    receiptRes = await call("eth_getTransactionReceipt", [txHash]);
    const r = obj(receiptRes.result);
    if (r === null) return { ok: false, detail: `eth_getTransactionReceipt returned null for ${txHash}: the transaction is not on this chain` };
    blockRes = await call("eth_getBlockByNumber", [str(r["blockNumber"]) ?? "0x0", false]);
  } catch (e) {
    return { ok: "io", detail: `${rpc}: ${(e as Error).message}` };
  }
  ann["chain_rpc"] = rpc;
  ann["chain_receipt_response_sha256"] = receiptRes.digest;
  ann["chain_block_response_sha256"] = blockRes.digest;

  const r = obj(receiptRes.result)!;
  const status = str(r["status"]) ?? "";
  ann["chain_status"] = status === "0x1" ? "ok (0x1)" : `NOT ok (${status})`;
  if (status !== "0x1") return { ok: false, detail: `transaction ${txHash} has status ${status}, not success` };

  const claimedBlock = num(receipt.data["blockNumber"]);
  const chainBlock = Number(BigInt(str(r["blockNumber"]) ?? "0x0"));
  ann["chain_block_number"] = chainBlock;
  if (claimedBlock !== null && claimedBlock !== chainBlock) {
    return { ok: false, detail: `receipt says blockNumber ${claimedBlock}, chain says ${chainBlock}` };
  }

  const b = obj(blockRes.result);
  const ts = b === null ? null : Number(BigInt(str(b["timestamp"]) ?? "0x0"));
  const claimedAt = num(receipt.data["executedAt"]);
  if (ts !== null) {
    ann["chain_block_timestamp"] = ts;
    if (claimedAt !== null && claimedAt !== ts) {
      return { ok: false, detail: `receipt says executedAt ${claimedAt}, block timestamp is ${ts}` };
    }
    ann["chain_executed_at_equals_block_timestamp"] = true;
  }

  // Every log the package ships must be present in the chain's own log list, by
  // index, address and data. This is what makes the package's logs evidence
  // rather than assertion.
  const chainLogs = Array.isArray(r["logs"]) ? (r["logs"] as unknown[]) : [];
  const byIndex = new Map<string, Record<string, unknown>>();
  for (const l of chainLogs) {
    const e = obj(l);
    if (e !== null) byIndex.set((str(e["logIndex"]) ?? "").toLowerCase(), e);
  }
  const shipped: Record<string, unknown>[] = [];
  const sw = obj(onchain["rawSwapEvent"]);
  if (sw !== null) shipped.push(sw);
  if (Array.isArray(onchain["rawTransferLogs"])) {
    for (const l of onchain["rawTransferLogs"] as unknown[]) {
      const e = obj(l);
      if (e !== null) shipped.push(e);
    }
  }
  const missing: string[] = [];
  for (const s of shipped) {
    const idx = (str(s["logIndex"]) ?? "").toLowerCase();
    const found = byIndex.get(idx);
    if (
      found === undefined ||
      !sameAddress(str(found["address"]) ?? "", str(s["address"]) ?? "") ||
      (str(found["data"]) ?? "").toLowerCase() !== (str(s["data"]) ?? "").toLowerCase()
    ) {
      missing.push(idx);
    }
  }
  ann["chain_logs_matched"] = `${shipped.length - missing.length} of ${shipped.length} shipped logs found on chain by index, address and data`;
  if (missing.length > 0) {
    return { ok: false, detail: `shipped logs at index ${missing.join(", ")} do not match the chain's logs for ${txHash}` };
  }

  // Whether the swap's recipient is a contract is a CHAIN fact, so it is only
  // asserted when the chain was actually asked. Without --rpc the attribution
  // annotation says what the logs alone support and no more.
  //
  // It is recorded BESIDE `attribution` and never over it. An earlier version
  // overwrote that key here with a sentence ending "beneficiary differs", which
  // was true of the 06:08Z transaction and false of the 09:53Z one: adding
  // --rpc to a clean single-pool fill replaced a correct finding with an
  // incorrect one, and only because the chain agreed with everything asked of
  // it. A check that corroborates must not be able to degrade what it confirms.
  if (recipient !== null) {
    try {
      const code = await call("eth_getCode", [recipient, "latest"]);
      const isContract = (str(code.result) ?? "0x") !== "0x";
      ann["chain_getcode_response_sha256"] = code.digest;
      ann["recipient_is_contract"] = isContract;
      if (isContract) {
        ann["recipient_is_contract_detail"] =
          `${recipient} is a contract (eth_getCode returns bytecode); the EOA that sent the transaction is a different address, ` +
          `so a consumer reading "subject" gets the executing contract, not the account behind it`;
      }
    } catch {
      ann["recipient_is_contract"] = "not_checked (eth_getCode failed)";
    }
  }
  return { ok: true, ann };
}

// ---------------------------------------------------------------------------
// the adapter
// ---------------------------------------------------------------------------

const PRECEDENCE_PROOF =
  "that a gate existed BEFORE the trade cannot be established from these bytes. " +
  "Signature timestamps are package metadata and `checkedAt` is a signed field the signer chooses. " +
  "Anchoring the gate uid before the trade transaction is what would close it.";

const PRECEDENCE_LINE = `not_checked — ${PRECEDENCE_PROOF}`;

/**
 * What the receipt's own two timestamps say about ordering, beside the standing
 * declaration that neither is proof.
 *
 * The 06:08Z receipt derived `preTradeSignedAt` from the signer-set `checkedAt`
 * and claimed FAITHFUL; the repaired receipt binds it to the real signing time,
 * which turns out to be 30 seconds AFTER the block. Reading the field is
 * therefore worth doing even though it settles nothing: it distinguishes a
 * receipt whose own numbers are consistent with precedence from one whose
 * numbers refute it, and the second must never be graded FAITHFUL. Neither
 * reading is an anchor, and the line says so on every result including VALID.
 */
function precedenceAnnotations(receipt: Attestation): Ann {
  const d = receipt.data;
  const pts = num(d["preTradeSignedAt"]);
  const ex = num(d["executedAt"]);
  if (pts === null || ex === null) return { precedence: PRECEDENCE_LINE };
  const statusField = "priceExecutionStatus" in d ? "priceExecutionStatus" : "executionStatus" in d ? "executionStatus" : null;
  const signedStatus = statusField === null ? null : str(d[statusField]);
  if (pts < ex) {
    return {
      precedence:
        `signed_before_block (asserted by signer, unanchored) — preTradeSignedAt ${pts} is ${ex - pts}s before executedAt ${ex}. ` +
        `Ordering itself is not_checked: ${PRECEDENCE_PROOF}`,
    };
  }
  const ann: Ann = {
    precedence:
      `after_block — preTradeSignedAt ${pts} is ${pts - ex}s AFTER executedAt ${ex}, so the gate did not precede the trade ` +
      `and the verdict must not be FAITHFUL. Ordering itself is not_checked: ${PRECEDENCE_PROOF}`,
  };
  if (signedStatus !== null) {
    ann["precedence_status_agrees"] =
      signedStatus === "FAITHFUL"
        ? `NO: the receipt signs ${statusField!} ${signedStatus} while its own timestamps place the gate after the block`
        : `yes: the receipt signs ${statusField!} ${signedStatus}, which does not claim precedence`;
  }
  return ann;
}

const OBSERVATIONS_LINE =
  "not_checked — participantCount, sourceGroupCount, independenceSatisfied, the consensus price's provenance " +
  "and mevRiskBps are issuer claims; nothing in these bytes tests them.";

export const insightAdapter: Adapter = {
  format: FORMAT,
  detect,

  async verify(bytes: Uint8Array, opts: VerifyOptions): Promise<VerifyResult> {
    // ---- 1. parse --------------------------------------------------------
    const p = parseStrict(bytes);
    if (!p.ok) return unverifiable(FORMAT, p.reason, p.detail, undefined, "parse");

    let registry: Registry | null = null;
    let registryError: string | null = null;
    if (opts.registry !== undefined) {
      const parsed = parseRegistry(opts.registry, opts.registryOrigin ?? "the supplied registry");
      if ("error" in parsed) registryError = parsed.error;
      else registry = parsed;
    }
    const ctx: Ctx = {
      registry,
      registryError,
      now: opts.now ?? Math.floor(Date.now() / 1000),
      allowUnregistered: opts.allowUnregisteredSigner === true,
    };

    const pkg = asPackage(p.value);
    const single = pkg === null ? asAttestation(p.value, "attestation") : null;
    if (pkg === null && single === null) {
      return unverifiable(
        FORMAT,
        "malformed_receipt",
        "not an Insight attestation ({attester, signature, data, eip712}) and not a package ({receipt, preTrade, onchain, publishedKeys})",
        undefined,
        "parse",
      );
    }

    const target = pkg === null ? single! : pkg.receipt;
    const stage = verifyOne(target, ctx, "");
    if (!stage.ok) return stage.result;
    const ann: Ann = { ...stage.ann };

    // A single attestation has no gates, no logs and no chain to check against;
    // it stops here, and the coverage block says which checks that leaves out.
    if (pkg === null) {
      Object.assign(ann, precedenceAnnotations(target));
      ann["observations"] = OBSERVATIONS_LINE;
      return valid(FORMAT, `EIP-712 digest, signature and schema checks passed for a single ${target.primaryType} attestation`, stage.key, ann);
    }

    // ---- the gates -------------------------------------------------------
    for (const [label, gate] of [
      ["source_gate", pkg.sourceGate],
      ["destination_gate", pkg.destinationGate],
    ] as const) {
      if (gate === null) continue;
      const g = verifyOne(gate, ctx, label);
      if (!g.ok) {
        // A gate the receipt NAMES is part of the receipt's own claim, so its
        // failure is the package's failure. A gate that is merely shipped
        // alongside is reported and does not move the verdict.
        const uid = gate.uid?.toLowerCase() ?? "";
        const named =
          sameAddress(str(pkg.receipt.data["preTradeUid"]) ?? "", uid) ||
          sameAddress(str(pkg.receipt.data["destinationPreTradeUid"]) ?? "", uid) ||
          label === "source_gate";
        if (named) return g.result;
        ann[`${label}_state`] = `${g.result.verdict}/${g.result.reason}: ${g.result.detail}`;
        continue;
      }
      Object.assign(ann, g.ann);
    }

    // ---- 7. binding, both gates -----------------------------------------
    //
    // v3 names two gates: `preTradeUid` for the source asset and
    // `destinationPreTradeUid` for the destination asset. v2 named one, and the
    // second was shipped unbound. Each field is checked against the gate that
    // fills that role, and a gate neither field names is reported as unbound --
    // which is now a statement about scope the issuer has closed, not a defect
    // this tool found.
    const srcUid = str(pkg.receipt.data["preTradeUid"]);
    const dstUid = str(pkg.receipt.data["destinationPreTradeUid"]);
    if (pkg.sourceGate === null) {
      ann["binding"] = "not_checked (package carries no sourceGate)";
    } else {
      const b = checkBinding(pkg.receipt, pkg.sourceGate, "source");
      if (!b.ok) {
        return invalid(FORMAT, "content_commitment_mismatch", `receipt does not bind to the source gate it names: ${b.detail}`, stage.key, "binding");
      }
      Object.assign(ann, b.ann);
    }
    if (dstUid !== null && pkg.destinationGate !== null) {
      const b = checkBinding(pkg.receipt, pkg.destinationGate, "destination");
      if (!b.ok) {
        return invalid(FORMAT, "content_commitment_mismatch", `receipt does not bind to the destination gate it names: ${b.detail}`, stage.key, "binding");
      }
      Object.assign(ann, b.ann);
    } else if (dstUid !== null) {
      ann["destination_gate_binding"] = `not_checked (the receipt names destinationPreTradeUid ${dstUid} and the package ships no destination gate)`;
    }

    // `preTradeUidsHash` over the two uids. Four constructions are computed and
    // the matching one is named, so a mismatch reports which encoding WOULD
    // have produced the signed value rather than only that it is unexplained.
    const uidsHash = str(pkg.receipt.data["preTradeUidsHash"]);
    if (uidsHash !== null && srcUid !== null && dstUid !== null) {
      const candidates = uidsHashCandidates(srcUid, dstUid);
      const hit = Object.entries(candidates).find(([, v]) => sameAddress(v, uidsHash));
      if (hit === undefined) {
        return invalid(
          FORMAT,
          "content_commitment_mismatch",
          `the receipt signs preTradeUidsHash ${uidsHash}, which is not the keccak of its two gate uids under any construction tried: ` +
            Object.entries(candidates)
              .map(([k, v]) => `${k} = ${v}`)
              .join("; "),
          stage.key,
          "binding",
        );
      }
      ann["pre_trade_uids_hash"] = `${hit[0]} — reproduced from preTradeUid and destinationPreTradeUid`;
      ann["pre_trade_uids_hash_other_constructions"] = Object.entries(candidates)
        .filter(([k]) => k !== hit[0])
        .map(([k, v]) => `${k} = ${v}`)
        .join("; ");
    }

    const referenced = new Set([srcUid?.toLowerCase(), dstUid?.toLowerCase()].filter((v) => v !== undefined));
    const unbound = [
      ["source", pkg.sourceGate],
      ["destination", pkg.destinationGate],
    ]
      .filter(([, g]) => g !== null && (g as Attestation).uid !== undefined && !referenced.has((g as Attestation).uid!.toLowerCase()))
      .map(([n]) => n as string);
    if (unbound.length > 0) {
      ann["unbound_gates"] = `[${unbound.join(", ")}] — signed, but not referenced by the receipt (evaluationScope ${String(pkg.sourceGate?.data["evaluationScope"] ?? "unstated")})`;
    }

    // ---- 8. swap ---------------------------------------------------------
    let facts: SwapFacts | null = null;
    if (pkg.onchain === null) {
      ann["swap"] = "not_checked (package carries no onchain block)";
      ann["attribution"] = "not_checked (package carries no onchain block)";
    } else {
      const sw = checkSwap(pkg.receipt, pkg.onchain, opts);
      if (sw.ok === false) {
        return invalid(FORMAT, "content_commitment_mismatch", `the receipt's signed price does not agree with the pool event it ships: ${sw.detail}`, stage.key, "swap");
      }
      Object.assign(ann, sw.ann);
      if (sw.ok === true) facts = sw.facts;

      // ---- 9. attribution ------------------------------------------------
      Object.assign(ann, checkAttribution(pkg.receipt, pkg.onchain, facts, opts));
    }

    // ---- 9b. prices at the signed scale ----------------------------------
    const pr = checkPrices(pkg.receipt, pkg.sourceGate, pkg.destinationGate, facts);
    if (!pr.ok) {
      return invalid(FORMAT, "content_commitment_mismatch", `the receipt's quote does not come out of the gates it binds to: ${pr.detail}`, stage.key, "binding");
    }
    Object.assign(ann, pr.ann);

    // ---- 9c. measuredFieldsHash -----------------------------------------
    Object.assign(ann, checkMeasuredFields(pkg.receipt, pkg.raw));

    // ---- 10. chain -------------------------------------------------------
    if (opts.rpc === undefined) {
      ann["chain"] = "not_checked (no rpc)";
    } else if (pkg.onchain === null) {
      ann["chain"] = "not_checked (package carries no onchain block)";
    } else {
      const c = await checkChain(pkg.receipt, pkg.onchain, opts.rpc, facts?.recipient ?? null);
      if (c.ok === "io") {
        // --rpc was asked for and could not be completed. Fail closed rather
        // than quietly downgrade a requested check to "not checked".
        return unverifiable(FORMAT, "io_error", `--rpc check could not be completed: ${c.detail}`, ann, "chain");
      }
      if (c.ok === false) {
        return invalid(FORMAT, "content_commitment_mismatch", `the receipt's signed chain facts disagree with the chain: ${c.detail}`, stage.key, "chain");
      }
      Object.assign(ann, c.ann);
    }

    // ---- 11, 12: observed where the bytes allow it, declared where they do not
    Object.assign(ann, precedenceAnnotations(pkg.receipt));
    ann["observations"] = OBSERVATIONS_LINE;

    return valid(
      FORMAT,
      "EIP-712 digests, signatures, schema, receipt-to-gate binding and the pool fill all recompute from the bytes supplied",
      stage.key,
      ann,
    );
  },
};
