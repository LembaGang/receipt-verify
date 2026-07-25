# Conformance Test Vectors for `evidence.action/0`

This document defines a set of conformance test vectors for the
`evidence.action/0` agent-action receipt format. An independent
implementation of a receipt verifier MAY use this set to demonstrate
byte-parity conformance with the format.

This document is *not* the format specification. The normative format
specification is the Internet-Draft *draft-msebenzi-evidence-state-00*
("the I-D"). This document defines (a) the verification algorithm in
prose, (b) the conformance vectors, and (c) the published trust material
required to verify them offline.

## 1. Status of this document

Informal, pre-IETF. Intended for review by independent implementers and
for eventual folding into an MCP host-binding profile in the
`environment.*` family.

## 2. Notational conventions

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**,
**SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** in
this document are to be interpreted as described in RFC 2119 / RFC 8174
when, and only when, they appear in all capitals, as shown here.

Defined terms:

- **Receipt** — a single signed record, or a JSONL file containing one
  or more such records (a chain).
- **Chain** — an ordered sequence of records where record `seq=i+1`
  references the entry hash of record `seq=i` via its `prev_hash` field.
- **entry_hash** — `"sha256:" + hex(SHA-256(JCS(record_content)))`, where
  `record_content` is the record object with the `sig` field removed.
- **request_commitment** — `"sha256:" + hex(SHA-256(JCS(request_descriptor(event))))`,
  computed unconditionally on every record. Functions as the integrity
  binding between the request the gate authorized and the request the
  recorder observed.
- **Gate** — the pre-action authorization step, distinct from recording.
  In the format's enforcement mode, a record's `gate` field carries the
  upstream authorization binding; in observe-only mode `gate` MUST be
  `null`. See §10.

## 3. Format under test

This document tests the record format whose version token is
`"evidence.action/0"`. The format is name-independent — it does not
depend on the name of any specific product or implementation. The
normative schema is defined by the I-D. This document MUST NOT be read
as the schema definition.

## 4. Verification algorithm (normative)

A **conforming verifier** is one that, given a chain file and a trusted
public key (resolved by `kid`), applies the following procedure and
returns one of `VALID`, `TAMPERED`, or `UNRESOLVED`:

```
maxSkewMs := 5000           // default
lastEntryHash := genesisPrevHash(records[0].session_id)
lastTs := null

for i = 0 .. records.length - 1:
    r := records[i]

    1.  r.seq                MUST equal i
    2.  r.v                  MUST equal "evidence.action/0"
    3.  r.kid                MUST equal the trusted key's kid
    4.  r.prev_hash          MUST equal lastEntryHash
    5.  requestCommitment(r.event)
                             MUST equal r.request_commitment
    6.  Ed25519-verify(
            pubkey = trustedKey,
            message = JCS(content_of(r)),   // content_of strips r.sig
            signature = base64UrlDecode(r.sig))
                             MUST return true
    7.  parse(r.ts) - lastTs MUST be greater than -maxSkewMs
                             (i.e. ts non-decreasing within maxSkewMs)

    lastEntryHash := "sha256:" + hex(SHA-256(JCS(content_of(r))))
    lastTs        := max(lastTs, parse(r.ts))

if file has a trailing checkpoint:
    8.  checkpoint.kid               MUST equal the trusted key's kid
    9.  checkpoint.count             MUST equal records.length
    10. checkpoint.last_entry_hash   MUST equal lastEntryHash
    11. Ed25519-verify over JCS(checkpoint_content)   MUST return true

return VALID
```

On any check failure, the verifier MUST return `TAMPERED` with the
failing entry index and a structured reason. The verifier MUST stop
on the first failure; further checks on later records are noise.

On any failure to resolve the trusted key (e.g. `kid` not in the
provided JWKS), the verifier MUST return `UNRESOLVED`, NOT `VALID` and
NOT `TAMPERED`. Silence is never an option.

`genesisPrevHash(session_id)` is defined in §6.

## 5. Canonicalization (normative)

All JSON canonicalization in this format uses RFC 8785 JSON
Canonicalization Scheme (JCS). JCS is applied in three places:

| Computation | Input | Output |
|---|---|---|
| `entry_hash` | record content (record minus `sig`) | `"sha256:" + hex(SHA-256(JCS_BYTES))` |
| Signature input | record content (record minus `sig`) | Ed25519 sign-message bytes |
| `request_commitment` | `request_descriptor(event)` | `"sha256:" + hex(SHA-256(JCS_BYTES))` |
| `args_hash` (where present, for `tool_call` / `mcp_call` events) | the raw arguments value | `"sha256:" + hex(SHA-256(JCS_BYTES))` |

Implementations that use `JSON.stringify` or any other
non-canonical serialization at any of these points are **non-conforming**.
The `canonicalization-key-order` vector (§7.6) exercises this property.

## 6. Genesis `prev_hash` (normative)

For `seq=0`, `prev_hash` MUST equal:

```
"sha256:" + hex(SHA-256(JCS({
    "v":          "evidence.action/0",
    "session_id": <the record's session_id>,
    "marker":     "genesis"
})))
```

The JCS object form is REQUIRED so that field boundaries are
unambiguous. A separator-less concatenation of `v`, `session_id`, and a
literal marker string is non-conforming (it permits cross-session
splicing — e.g., `v="x/0" + sid="123"` collides with `v="x/01" + sid="23"`).

## 7. Vectors

For each vector, the bundle contains a receipt file at
`vectors/<id>/chain.jsonl`. The `manifest.json` record for each vector
declares the expected verification outcome and pins every load-bearing
hash and signature.

### 7.1 `allow`

Permitted call. Recorded `outcome` is `executed`; `gate.gate_family` is
`permit`; `gate.result` is `act`. Proves that a conforming verifier
accepts a valid allow record byte-for-byte.

Expected: `VALID`.

### 7.2 `deny`

Policy-blocked call. Recorded `outcome` is `denied`; `gate.gate_family`
is `permit`; `gate.result` is `halt`. The receipt records the halt;
no downstream effect is described. Proves that denial-with-halt is a
first-class verifiable outcome — the chain encodes the refusal.

Expected: `VALID`.

### 7.3 `fail-closed`

Denial-by-default. The pre-condition the gate would have checked
(`gate.gate_family: "environment"`) could not be satisfied; the gate
halts as the safe default. Recorded `outcome` is `blocked`;
`gate.result` is `halt`; `event.decision_source` is `fail-closed`.

The primary, receipt-visible distinguisher from §7.2 (rule-based deny)
is `event.decision_source`:

- `decision_source: "config"` (used by §7.2) — an explicit policy rule
  matched and denied.
- `decision_source: "fail-closed"` (used here) — policy could not
  determine and the safe default fired.

`gate.gate_family` is a supplementary signal. It can co-vary
(`permit` for a rule eval, `environment` / `verification` for the
class of check that was being run), and the two fields compose. A
safe-default halt during a permit-rule evaluation (e.g., permit rule
input was malformed) is `gate.gate_family: "permit"` +
`decision_source: "fail-closed"` — `gate_family` alone could not
distinguish that from rule-based deny.

`decision_source: "fail-closed"` is a v1.1 schema value (see §10).

Expected: `VALID`. The manifest also declares `fail_closed: true` as
a runner-side double-check; it is no longer the only signal.

### 7.4 `tampered`

Negative case. A receipt was generated as a valid allow, then
`event.argv[1]` was changed from `"hello"` to `"goodbye"` in the file
bytes; the `sig` field was left unchanged. A conforming verifier
**MUST** reject this receipt.

Two independent checks catch this mutation:
- `request_commitment` recomputed from the mutated `event` no longer
  matches the sealed `request_commitment` field;
- the JCS canonical bytes of the content differ from what was signed,
  so the Ed25519 signature does not verify.

The reference verifier reports `request_commitment mismatch` because it
performs that check before signature verification — the more legible
reason for "the recorded action doesn't match its committed identity."
A verifier that performs signature verification first will report
`signature invalid` instead; both reasons are conformant.

Expected: `TAMPERED`, `tamper_entry = 0`. The reason in the reference
runner is `request_commitment mismatch`; another conforming verifier
MAY report `signature invalid`. The vector tests rejection, not the
reason string verbatim.

A verifier that returns `VALID` here is **non-conforming**.

### 7.5 `chain-multi`

Two linked records (`file_read` at `seq=0`, `shell` at `seq=1`). Proves
that the verifier checks hash-chain linkage, not just per-record
signatures. A verifier that checks signatures only — without linkage —
would still pass each record's signature check; the conformance runner
asserts the linkage equalities explicitly:

- `records[0].prev_hash` equals `genesisPrevHash(session_id)`
- `records[1].prev_hash` equals `entryHashOf(records[0])`

Expected: `VALID`.

### 7.6 `canonicalization-key-order`

The `args_hash` field on `tool_call` and `mcp_call` events MUST be
`SHA-256` over the RFC 8785 JCS canonical bytes of the raw arguments
value. The same logical arguments presented in different key orders
MUST produce byte-identical hashes.

The receipt in this vector contains an `args_hash` derived from the
input `{b: 2, a: 1}` via JCS. The manifest carries both the unsorted
input and the JCS canonical form (`{"a":1,"b":2}`, 13 bytes) so an
implementer can verify their JCS path end-to-end.

A conforming runner asserts:
- `JCS({b: 2, a: 1})` equals the declared canonical bytes;
- `JCS({a: 1, b: 2})` produces the same canonical bytes (key-order independence);
- `SHA-256(canonical_bytes)` equals the declared `expected_args_hash`;
- the receipt's `event.args_hash` equals the declared value.

Expected: `VALID`.

A naive `JSON.stringify`-based implementer who serialises `{b: 2, a: 1}`
without lexicographic key-sort will derive a different `args_hash` and
fail the conformance check.

## 8. Conformance runner (informative)

A conforming runner:

1. Loads `manifest.json` and `jwks.json` from the bundle root.
2. For each vector in `manifest.vectors`:
   a. Computes `SHA-256` of the bundled receipt file bytes and asserts
      equality with `manifest.vectors[i].receipt_sha256`. (Integrity
      check on the published artifact.)
   b. Runs the verification algorithm of §4, using the bundled JWKS for
      `kid` resolution.
   c. Asserts the verification outcome matches
      `manifest.vectors[i].expected.verify`.
   d. For `VALID` vectors, asserts each pinned per-entry value
      (`request_commitment`, `entry_hash`, `sig`,
      `canonical_byte_length`, `canonical_sha256`) matches the
      independently recomputed value.
   e. For `TAMPERED` vectors, asserts the verifier rejected the
      receipt. The specific `tamper_reason` MAY differ between
      conforming verifiers (see §7.4); the rejection itself is the
      conformance requirement.

The bundle includes a reference runner at `tools/runner.mjs`. Any
runner that performs the assertions above is conformant.

## 9. Reference implementation

The recorder engine at `https://github.com/<TBD>` and the verify SDK
constitute **a** reference implementation of this format. They are
*a* reference, not *the* reference. Other independent implementations
that pass this conformance set are equally conformant.

The reference implementation is described informatively. Nothing in
the reference implementation is normative; the normative content is in
§4–§6 of this document and in the I-D.

## 10. Enforcement-mode fields (informative)

Two fields in `evidence.action/0` carry enforcement-mode semantics:

### 10.1 `gate`

Per record, one of:

- `null` — observe-only mode. No upstream authorization binding is
  asserted by this record.
- A `GateBlock` — enforcement mode. Carries `request_commitment`,
  `gate_receipt`, `gate_family`, and `result`.

The conformance vectors §7.1, §7.2, §7.3, and §7.4 use the populated
form.

### 10.2 `event.decision_source: "fail-closed"`

The `decision_source` field is a closed enum. v1 of the format defined
four values:

```
"user" | "config" | "hook" | "n/a"
```

These name WHO decided. They do not distinguish a rule-based denial
("`config`": an explicit policy rule matched) from a safe-default
denial (no actor reached a decision; policy could not determine; the
safe default fired). That overload is a format-expressiveness gap.

**v1.1 closes the gap** by adding a fifth value:

```
"user" | "config" | "hook" | "n/a" | "fail-closed"
```

`"fail-closed"` names the disposition (the policy landed on the safe
default), not a person. It is parallel in this respect to `"n/a"`,
which already names a state rather than an actor. The change is
additive — existing receipts (typically `"n/a"`) continue to parse and
verify under v1.1.

The conformance vector §7.3 uses `decision_source: "fail-closed"`.
This is the primary, signed-bytes distinguisher between a safe-default
halt and a rule-based halt. `gate.gate_family` remains a supplementary
signal that names the *class of check* the gate ran (orthogonal to the
disposition; see §7.3).

### 10.3 Format leads, reference implementation catches up

The current reference recorder runs in observe-only mode. On every
real receipt it emits:

- `gate: null`
- `event.decision_source: "n/a"` (where the field appears at all)

The conformance vectors in this bundle populate the enforcement-mode
form of both fields: populated `gate` blocks and
`decision_source: "fail-closed"` where applicable. These are the
**format's** enforcement-mode shape — what a conforming verifier
**MUST** accept — not what the reference recorder emits today.

Implementers MUST NOT infer from these vectors that the reference
recorder emits populated `gate` blocks or `decision_source:
"fail-closed"` today. It does not. The format definition leads; the
reference recorder catches up as enforcement mode ships. The
**reference verifier** validates the full enforcement-mode format
today — a verifier of v1 vintage that has not learned about
`"fail-closed"` would not be conformant for §7.3.

This staging — format-first, then implementation — is deliberate.
The format is the standard; the reference implementation is one
participant in that standard.

## 11. Security considerations

**JCS dependency.** The format's integrity hashes depend on RFC 8785 JCS
canonicalization. An implementation that uses any non-canonical
serialization (such as `JSON.stringify` without lexicographic key-sort)
is non-conforming and MAY silently produce hashes that diverge from
those of a conforming implementation. §7.6 exercises this.

**Ed25519 deterministic signatures.** The format's signatures are
Ed25519 per RFC 8032, which is deterministic — same key, same message,
same signature bytes. Implementations MUST NOT introduce nonce or
salting; doing so breaks signature byte parity across implementations.

**Key compromise.** A holder of the signing key can produce any chain
that verifies. The format's integrity properties are conditional on key
custody, and the conformance suite says nothing about how the signing
key is protected in production. The published TEST key (§12) MUST NOT
be used in production.

**Fail-closed vs rule-based deny — receipt-visible at v1.1.** The
format distinguishes the safe-default halt of §7.3 from the rule-based
deny of §7.2 in the signed bytes, via `event.decision_source`:
`"config"` for an explicit policy rule, `"fail-closed"` for the
safe-default disposition (§10.2). `gate.gate_family`
(`environment` / `verification` / `permit`) is supplementary — it
names the class of check, not the disposition, and composes
orthogonally with `decision_source`. A conforming verifier MUST treat
`decision_source: "fail-closed"` as the primary signal and MUST NOT
infer halt cause from `gate.gate_family` alone.

**Trust root of the JWKS.** The conformance bundle embeds a single
public key inline (`jwks.json`). The trust root for offline conformance
is "the published bytes." Operators using this format in production
MUST adopt a key-management strategy of their own (e.g. a canonical
`.well-known/jwks.json` over TLS with operator-controlled rotation);
the conformance bundle is not such a strategy.

## 12. Test key material (informative)

The test signing key for this bundle is derived from the 32-byte
Ed25519 seed:

```
00 01 02 03 04 05 06 07
08 09 0a 0b 0c 0d 0e 0f
10 11 12 13 14 15 16 17
18 19 1a 1b 1c 1d 1e 1f
```

```
+-----------------------------------------------------------------+
| TEST KEY MATERIAL — DO NOT USE IN PRODUCTION.                   |
|                                                                 |
| This seed is published. Anyone can sign messages under the      |
| corresponding private key. Use a production-grade key for any   |
| real receipt. The conformance bundle uses this key only so that |
| independent implementers can re-derive the private key, re-sign |
| the canonical bytes themselves, and confirm signature byte      |
| parity end-to-end.                                              |
+-----------------------------------------------------------------+
```

The derived public key (base64url, no padding) is:

```
A6EHv_POEL4dcN0Y50vAmWfk1jCbpQ1fHdyGZBJVMbg
```

The derived `kid` is:

```
ed25519/Vkdap1RjR0wC
```

The JWK form is in `jwks.json` at the bundle root.

## 13. Out of scope / next tier

The following are explicitly out of scope of this v1 conformance set.
Each names the orthogonal property a future vector tier would cover.

- **Live-endpoint JWKS resolution.** The bundle's JWKS is offline. A
  live-resolution tier would test HTTPS, key rotation, caching, and
  failure handling (UNRESOLVED outcomes).
- **Gate-receipt upstream binding.** The `gate.gate_receipt` field
  contains a pinned literal. A binding tier would test that
  `gate_receipt` resolves to an upstream receipt whose own
  `request_commitment` equals the recorded `gate.request_commitment`
  (the end-to-end authorized-equals-recorded property).
- **Transparency-log witnessing.** Equivocation by a malicious recorder
  is not detectable from a single chain. A witnessed-log tier would
  test inclusion proofs in an external transparency log.
- **Key rotation across vectors.** All vectors are signed by a single
  key. A rotation tier would test a chain whose later records are
  signed by a key that supersedes an earlier one.
- **Dual-implementation signing byte parity** *(named next milestone)*.
  The current set proves a single signing implementation produces
  bytes that a conforming verifier accepts. It does not prove that
  two independent signing implementations produce byte-identical
  receipts for the same logical event. The next conformance tier
  publishes receipts signed by two independent implementations of the
  format, both verifying VALID under the same JWKS. This tier blocks
  on the existence of a second independent signing implementation.

## 14. IANA considerations

The format token `"evidence.action/0"` is to be registered with IANA
per the I-D. It is **not** registered at the time of this document.

This document itself requests no IANA action.

## 15. References

- RFC 2119 — Key words for use in RFCs to Indicate Requirement Levels
- RFC 7517 — JSON Web Key (JWK)
- RFC 8032 — Edwards-Curve Digital Signature Algorithm (EdDSA)
- RFC 8037 — CFRG Elliptic Curve Diffie-Hellman (ECDH) and Signatures in JOSE
- RFC 8174 — Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words
- RFC 8259 — The JavaScript Object Notation (JSON) Data Interchange Format
- RFC 8785 — JSON Canonicalization Scheme (JCS)
- *draft-msebenzi-evidence-state-00* — Evidence-state framework I-D
  (defines the `evidence.action/0` record schema)
