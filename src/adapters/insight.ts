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
 * "Definition of domainSeparator": hashStruct over the EIP712Domain struct built
 * from the fields actually PRESENT, in the EIP's fixed order. Insight's domains
 * carry name, version and chainId and no verifyingContract, so the struct is
 * EIP712Domain(string name,string version,uint256 chainId).
 */
export function domainSeparator(domain: Eip712Domain): Uint8Array {
  const order: [keyof Eip712Domain, string][] = [
    ["name", "string"],
    ["version", "string"],
    ["chainId", "uint256"],
    ["verifyingContract", "address"],
    ["salt", "bytes32"],
  ];
  const present = order.filter(([k]) => domain[k] !== undefined && domain[k] !== null);
  const types: Eip712Types = { EIP712Domain: present.map(([k, t]) => ({ name: k, type: t })) };
  const value: Record<string, unknown> = {};
  for (const [k] of present) value[k] = domain[k];
  return hashStruct("EIP712Domain", value, types);
}

/** The final construction: keccak256(0x19 || 0x01 || domainSeparator || hashStruct(message)). */
export function eip712Digest(
  domain: Eip712Domain,
  primaryType: string,
  types: Eip712Types,
  message: Record<string, unknown>,
): Uint8Array {
  return keccak(
    concatBytes(new Uint8Array([0x19, 0x01]), domainSeparator(domain), hashStruct(primaryType, message, types)),
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

interface RegistryKey {
  keyId: string;
  publicKey: string;
  revoked: boolean;
}
interface RegistrySchema {
  schemaVersion?: number;
  domainVersion?: string;
  fields: string[];
}
interface Registry {
  keys: RegistryKey[];
  schemas: Record<string, RegistrySchema>;
  gates: Record<string, unknown>;
  origin: string;
}

function parseRegistry(bytes: Uint8Array, origin: string): Registry | { error: string } {
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
    keys.push({ keyId: str(e["key_id"]) ?? pub, publicKey: pub, revoked: e["revoked"] === true });
  }
  const schemas: Record<string, RegistrySchema> = {};
  const rawSchemas = obj(o["schemas"]);
  if (rawSchemas !== null) {
    for (const [name, v] of Object.entries(rawSchemas)) {
      const s = obj(v);
      if (s === null) continue;
      const e = obj(s["eip712"]);
      const types = e === null ? null : obj(e["types"]);
      const list = types === null ? null : types[name];
      if (!Array.isArray(list)) continue;
      const entry: RegistrySchema = { fields: list.map((f) => (obj(f) === null ? "" : (str(obj(f)!["name"]) ?? ""))) };
      const sv = num(s["schemaVersion"]);
      if (sv !== null) entry.schemaVersion = sv;
      const dom = e === null ? null : obj(e["domain"]);
      const dv = dom === null ? null : str(dom["version"]);
      if (dv !== null) entry.domainVersion = dv;
      schemas[name] = entry;
    }
  }
  const er = obj(rawSchemas?.["ExecutionReceipt"]);
  return { keys, schemas, gates: (er === null ? null : obj(er["gates"])) ?? {}, origin };
}

/**
 * Compare the artefact's own declared type against the registry's published one
 * for the same primaryType. This is REPORTED, never a verdict: a stranger who
 * builds the struct from the registry rather than from the artefact recovers a
 * different address, and that is worth saying out loud without deciding on the
 * issuer's behalf which of the two documents is wrong.
 */
function compareRegistrySchema(art: Attestation, reg: Registry): { line: string; domainLine: string | null } {
  const published = reg.schemas[art.primaryType];
  if (published === undefined) {
    return { line: `not_published (${art.primaryType} is not in ${reg.origin})`, domainLine: null };
  }
  const mine = (art.types[art.primaryType] ?? []).map((f) => f.name);
  const theirs = published.fields;
  const parts: string[] = [];

  const myVersion = num(art.data["schemaVersion"]);
  if (myVersion !== null && published.schemaVersion !== undefined && myVersion !== published.schemaVersion) {
    parts.push(`schemaVersion ${myVersion} vs ${published.schemaVersion}`);
  }
  if (mine.length !== theirs.length) parts.push(`${mine.length} vs ${theirs.length} fields`);
  const extra = mine.filter((n) => !theirs.includes(n));
  if (extra.length > 0) parts.push(`${extra.join(", ")} not in registry`);
  if (extra.length === 0 && mine.length === theirs.length && mine.some((n, i) => n !== theirs[i])) {
    parts.push("same names in a different order");
  }

  const myDomain = str(art.domain.version as unknown);
  const domainLine =
    myDomain !== null && published.domainVersion !== undefined && myDomain !== published.domainVersion
      ? `${myDomain} vs ${published.domainVersion}`
      : null;

  return { line: parts.length === 0 ? "match" : `mismatch (${parts.join("; ")})`, domainLine };
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

  // ---- 3. digest ---------------------------------------------------------
  let digestBytes: Uint8Array;
  try {
    digestBytes = eip712Digest(art.domain, art.primaryType, art.types, art.data);
  } catch (e) {
    return fail(
      unverifiable(FORMAT, "malformed_member", `${art.label} does not EIP-712 encode: ${(e as Error).message}`, ann, "digest"),
    );
  }
  const digest = hex(digestBytes);
  ann[p("digest")] = digest;
  const recovered = recoverAddress(digestBytes, art.signature);
  if (recovered !== null) ann[p("recovered_signer")] = recovered;

  const signatureHolds = recovered !== null && sameAddress(recovered, art.attester);
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
    const hit = ctx.registry.keys.find((k) => sameAddress(k.publicKey, art.attester));
    const cmp = compareRegistrySchema(art, ctx.registry);
    ann[p("registry_schema")] = cmp.line;
    if (cmp.domainLine !== null) ann[p("registry_domain_version")] = cmp.domainLine;
    if (hit === undefined) {
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
    } else {
      ann[p("identity")] = `signer_in_registry (${hit.keyId})`;
      if (hit.revoked) ann[p("identity_revoked")] = true;
      key = { kid: hit.keyId, alg: "EIP-712/secp256k1", origin: ctx.registry.origin };
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

function checkBinding(receipt: Attestation, gate: Attestation): BindOutcome {
  const ann: Ann = {};
  const r = receipt.data;
  const g = gate.data;
  const mismatches: string[] = [];

  if (gate.uid !== undefined && !sameAddress(str(r["preTradeUid"]) ?? "", gate.uid)) {
    mismatches.push(`preTradeUid ${String(r["preTradeUid"])} != sourceGate.uid ${gate.uid}`);
  }
  for (const f of ["requestHash", "sourceAssetId", "destinationAssetId", "subjectChainId"]) {
    if (JSON.stringify(r[f]) !== JSON.stringify(g[f])) {
      mismatches.push(`${f} ${JSON.stringify(r[f])} != gate ${JSON.stringify(g[f])}`);
    }
  }
  if (JSON.stringify(r["quotedPrice"]) !== JSON.stringify(g["consensusPrice"])) {
    mismatches.push(`quotedPrice ${JSON.stringify(r["quotedPrice"])} != gate consensusPrice ${JSON.stringify(g["consensusPrice"])}`);
  }
  if (mismatches.length > 0) return { ok: false, detail: mismatches.join("; ") };
  ann["binding"] = "preTradeUid, requestHash, both asset ids, subjectChainId and quotedPrice==consensusPrice all equal";

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
        ann["request_hash_recomputed"] = recomputed;
        if (!sameAddress(recomputed, str(g["requestHash"]) ?? "")) {
          return { ok: false, detail: `requestHash ${String(g["requestHash"])} is not the EIP-712 digest of the canonical request, which is ${recomputed}` };
        }
        ann["request_hash_matches_canonical_request"] = true;
      } catch (e) {
        ann["request_hash_recomputed"] = `not recomputable: ${(e as Error).message}`;
      }
    }
  }
  return { ok: true, ann };
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

type SwapOutcome =
  | { ok: true; ann: Ann; recipient: string | null; boughtAbs: bigint }
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
  const recipient = topics.length > 2 ? `0x${(str(topics[2]) ?? "").slice(-40)}` : null;
  if (recipient !== null) ann["swap_recipient"] = recipient;

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

  // "At the receipt's precision": the receipt is 8-decimal fixed point, so the
  // pool price is compared at 8 decimals rather than to the last float bit.
  const executedHuman = executed / 1e8;
  ann["receipt_executed_price"] = executedHuman;
  const agrees = poolPrice.toFixed(8) === executedHuman.toFixed(8);
  if (!agrees) {
    return { ok: false, detail: `pool fill price ${poolPrice} does not equal the signed executedPrice ${executedHuman} at 8 decimals` };
  }
  ann["pool_price_equals_executed_price"] = "at 8 decimals, the receipt's own precision";

  // Exact, from the integer amounts: (bought/10^db) / (sold/10^ds) / (quoted/1e8) - 1, in bps.
  const numer = -amtBought * 10n ** BigInt(dSold) * 100000000n;
  const denom = amtSold * 10n ** BigInt(dBought) * BigInt(quoted);
  ann["delta_bps"] = ratioBps(numer, denom);
  const maxSlip = num(receipt.data["maxSlippageBps"]);
  if (maxSlip !== null) {
    const withinNumer = numer > denom ? numer - denom : denom - numer;
    const faithful = withinNumer * 10000n <= denom * BigInt(maxSlip);
    ann["swap_status_under_signed_max"] = `${faithful ? "FAITHFUL" : "DEVIATED"} under maxSlippageBps ${maxSlip}`;
  }
  return { ok: true, ann, recipient, boughtAbs: -amtBought };
}

// ---------------------------------------------------------------------------
// 9. attribution — who actually received the bought token
// ---------------------------------------------------------------------------

const TRANSFER_SIGNATURE = "Transfer(address,address,uint256)";

function checkAttribution(
  receipt: Attestation,
  onchain: Record<string, unknown>,
  recipient: string | null,
  poolOut: bigint | null,
  opts: VerifyOptions,
): Ann {
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

  const legs = obj(onchain["legs"]);
  const bought = (str(legs?.["boughtToken"]) ?? "").toLowerCase();
  const sold = (str(legs?.["soldToken"]) ?? "").toLowerCase();
  const decOf = (a: string): number | undefined => opts.tokens?.[a] ?? BUILTIN_DECIMALS[a];
  const dB = decOf(bought);
  const dS = decOf(sold);
  if (recipient === null || bought === "" || dB === undefined) {
    return { ...ann, attribution: "not_checked (no swap recipient or unknown token decimals)" };
  }

  const boughtNet = net[bought] ?? {};
  ann["recipient_net_bought"] = scaled(boughtNet[recipient] ?? 0n, dB);
  if (sold !== "" && dS !== undefined) ann["recipient_net_sold"] = scaled(net[sold]?.[recipient] ?? 0n, dS);

  // The beneficiary is the largest net receiver of the bought token that is not
  // the swap's own recipient. On this transaction the recipient nets zero and
  // forwards everything on, so "who was paid" is a different address from "who
  // the pool paid".
  const receivers = Object.entries(boughtNet)
    .filter(([a, v]) => v > 0n && !sameAddress(a, recipient))
    .sort((x, y) => (y[1] > x[1] ? 1 : y[1] < x[1] ? -1 : 0));
  if (receivers.length === 0) return { ...ann, attribution: "recipient is the only net receiver of the bought token" };

  const [benefAddr, benefAmt] = receivers[0]!;
  ann["beneficiary"] = benefAddr;
  ann["beneficiary_received"] = scaled(benefAmt, dB);

  if (receivers.length > 1) {
    const [thirdAddr, thirdAmt] = receivers[1]!;
    ann["third_party"] = thirdAddr;
    ann["third_party_received"] = scaled(thirdAmt, dB);
    // Share OF THE POOL'S OUTPUT — what the trade produced — not of the
    // beneficiary's share of it. Rounded to four decimals of a percent, which is
    // where the exact ratio 178645992/21017175576 sits.
    if (poolOut !== null && poolOut > 0n) {
      ann["third_party_share_pct"] = Math.round((Number(thirdAmt) * 1e6) / Number(poolOut)) / 10000;
    }
  }

  const quoted = num(receipt.data["quotedPrice"]);
  const soldAmt = sold === "" || dS === undefined ? null : -(net[sold]?.[recipient] ?? 0n);
  if (quoted !== null && soldAmt !== null && soldAmt > 0n && dS !== undefined) {
    const realised = scaled(benefAmt, dB) / scaled(soldAmt, dS);
    ann["realised_price_to_beneficiary"] = realised;
    const numer = benefAmt * 10n ** BigInt(dS) * 100000000n;
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

  ann["attribution"] =
    `recipient nets ${scaled(boughtNet[recipient] ?? 0n, dB)} of the bought token and forwards it on; ` +
    `beneficiary differs from the swap recipient`;
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
  if (recipient !== null) {
    try {
      const code = await call("eth_getCode", [recipient, "latest"]);
      const isContract = (str(code.result) ?? "0x") !== "0x";
      ann["chain_getcode_response_sha256"] = code.digest;
      ann["recipient_is_contract"] = isContract;
      if (isContract) {
        ann["attribution"] = `recipient ${recipient} is a contract (eth_getCode returns bytecode); beneficiary differs`;
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

const PRECEDENCE_LINE =
  "not_checked — that a gate existed BEFORE the trade cannot be established from these bytes. " +
  "Signature timestamps are package metadata and `checkedAt` is a signed field the signer chooses. " +
  "Anchoring the gate uid before the trade transaction is what would close it.";

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
      ann["precedence"] = PRECEDENCE_LINE;
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
        // The source gate is what the receipt binds to, so its failure is the
        // package's failure. The destination gate is not referenced by the
        // receipt, so its state is reported and does not move the verdict.
        if (label === "source_gate") return g.result;
        ann["destination_gate_state"] = `${g.result.verdict}/${g.result.reason}: ${g.result.detail}`;
        continue;
      }
      Object.assign(ann, g.ann);
    }

    // ---- 7. binding ------------------------------------------------------
    if (pkg.sourceGate === null) {
      ann["binding"] = "not_checked (package carries no sourceGate)";
    } else {
      const b = checkBinding(pkg.receipt, pkg.sourceGate);
      if (!b.ok) {
        return invalid(FORMAT, "content_commitment_mismatch", `receipt does not bind to the source gate it names: ${b.detail}`, stage.key, "binding");
      }
      Object.assign(ann, b.ann);
    }
    const referenced = new Set([str(pkg.receipt.data["preTradeUid"])?.toLowerCase()]);
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
    let recipient: string | null = null;
    let poolOut: bigint | null = null;
    if (pkg.onchain === null) {
      ann["swap"] = "not_checked (package carries no onchain block)";
      ann["attribution"] = "not_checked (package carries no onchain block)";
    } else {
      const s = checkSwap(pkg.receipt, pkg.onchain, opts);
      if (s.ok === false) {
        return invalid(FORMAT, "content_commitment_mismatch", `the receipt's signed price does not agree with the pool event it ships: ${s.detail}`, stage.key, "swap");
      }
      Object.assign(ann, s.ann);
      if (s.ok === true) {
        recipient = s.recipient;
        poolOut = s.boughtAbs;
      }

      // ---- 9. attribution ------------------------------------------------
      Object.assign(ann, checkAttribution(pkg.receipt, pkg.onchain, recipient, poolOut, opts));
    }

    // ---- 10. chain -------------------------------------------------------
    if (opts.rpc === undefined) {
      ann["chain"] = "not_checked (no rpc)";
    } else if (pkg.onchain === null) {
      ann["chain"] = "not_checked (package carries no onchain block)";
    } else {
      const c = await checkChain(pkg.receipt, pkg.onchain, opts.rpc, recipient);
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

    // ---- 11, 12: declared, never evaluated -------------------------------
    ann["precedence"] = PRECEDENCE_LINE;
    ann["observations"] = OBSERVATIONS_LINE;

    return valid(
      FORMAT,
      "EIP-712 digests, signatures, schema, receipt-to-gate binding and the pool fill all recompute from the bytes supplied",
      stage.key,
      ann,
    );
  },
};
