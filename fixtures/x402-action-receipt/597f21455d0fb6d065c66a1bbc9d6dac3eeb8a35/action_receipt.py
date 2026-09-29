#!/usr/bin/env python3
"""
action_receipt.py — reference verifier + conformance suite for the Action-Bound
Receipt profile of the x402 offer-receipt extension (JWS format).

A delta on the approved `offer-receipt` extension (v0.6, Alfred Tom): it reuses
that extension's envelope ({format, payload, signature}), its JWS + RFC 8785
(JCS) canonicalization (base ext §10), and its signer-authorization model (base
ext §4.5.1), and adds the post-settlement-accountability binding of issues #2332
/ #2648 / #2357: an `action` block, a content-addressed `actionRef`, and a
required binding to a *successful* settlement.

The receipt is signed and emitted by the RESOURCE SERVER (via the
enrichSettlementResponse hook), never the facilitator; verification is offline by
the client or any third party.

Settlement binding is scheme-general (T0.1): the join key is the on-chain
`transaction` when a scheme provides one, or a `settlementRef` (voucher / channel
receipt / batch root / ledger ref) when it does not (batch-settlement,
payment-channel, non-blockchain rails). `settlementStatus` (T0.2) carries the
payment lifecycle (settled / capturePending / reversed / refunded) independently
of the service `outcome`.

Authorization fails CLOSED and supports both base §4.5.1 anchors: the signing
`kid` bound to the service (`resourceUrl`) OR to the recipient (`payTo`).

Reject reasons follow the x402 error-taxonomy convention (core §9 + the SIWX
`invalid_<ext>_<check>` pattern): `invalid_actionreceipt_*`, with the core codes
`invalid_payload` / `invalid_transaction_state` where they apply.

Nothing here is a new cryptographic primitive: JCS (RFC 8785) + JWS (RFC 7515,
ES256/ES256K/EdDSA) + SHA-256, composed.

Vectors are committed inputs: the default run VERIFIES `vectors/`; `--regenerate`
re-signs them (keys derive from fixed seeds, so regeneration is reproducible;
ECDSA nonces are random, so signatures change on regeneration — hence opt-in).

    python3 action_receipt.py                 # verify committed vectors
    python3 action_receipt.py --regenerate    # re-sign + rewrite vectors, then verify
    python3 action_receipt.py --verify FILE

Requires `cryptography`. `rfc8785` optional (byte-for-byte JCS cross-check).
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
VECTORS = HERE / "vectors"

try:
    from cryptography.hazmat.primitives.asymmetric import ec, ed25519, utils as asym_utils
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.serialization import (
        Encoding, PublicFormat, load_pem_public_key,
    )
    from cryptography.exceptions import InvalidSignature
    HAVE_CRYPTO = True
except ImportError:
    HAVE_CRYPTO = False

try:
    import rfc8785 as _rfc8785
    HAVE_RFC8785 = True
except ImportError:
    HAVE_RFC8785 = False


# --- RFC 8785 (JCS) canonicalization -------------------------------------
# The payload schema is closed (validate_payload): every value is a string, a
# small non-negative integer, or a nested object of the same. Over that domain
# this is exactly RFC 8785, cross-checked against the reference library when
# present. No float / big-integer branch is reachable.

def _canon(v) -> str:
    if isinstance(v, str):
        return json.dumps(v, ensure_ascii=False, separators=(",", ":"))
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, int):
        return str(v)
    if v is None:
        return "null"
    if isinstance(v, dict):
        items = sorted(v.items(), key=lambda kv: kv[0].encode("utf-16-be"))
        return "{" + ",".join(
            json.dumps(k, ensure_ascii=False, separators=(",", ":")) + ":" + _canon(val)
            for k, val in items
        ) + "}"
    if isinstance(v, list):
        return "[" + ",".join(_canon(x) for x in v) + "]"
    raise TypeError(f"uncanonicalizable type: {type(v)!r}")


def jcs(value) -> bytes:
    mine = _canon(value).encode("utf-8")
    if HAVE_RFC8785:
        ref = _rfc8785.dumps(value)
        if mine != ref:
            raise AssertionError(f"vendored JCS disagrees with rfc8785: {mine!r} != {ref!r}")
    return mine


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def b64url_decode(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def sha256_b64url(data: bytes) -> str:
    return b64url(hashlib.sha256(data).digest())


# --- payload schema (closed) ---------------------------------------------

PROFILE_VERSION = 1                 # scoped to the `action-receipt` key (T1.5)
TOP_KEYS = {"version", "network", "resourceUrl", "payer", "payTo", "issuedAt",
            "transaction", "settlementRef", "settlementStatus", "action", "actionRef"}
ACTION_KEYS = {"agent", "actionType", "scope", "outcome"}
STRING_TOP_FIELDS = {"network", "resourceUrl", "payer", "payTo",
                     "transaction", "settlementRef", "settlementStatus", "actionRef"}
OUTCOMES = {"delivered", "refused", "partial", "disputed"}                 # SERVICE delivery
SETTLEMENT_STATUSES = {"settled", "capturePending", "reversed", "refunded"}  # PAYMENT lifecycle (T0.2)
SAFE_INT_MAX = 2**53 - 1

# actionRef tuple: a COMPLETE content address over every semantically-load-bearing
# field — who / what / scope / outcome / where / which-settlement / lifecycle /
# when / on-what-network / from-whom / to-whom / schema-version. Completeness
# matters because §9 recommends actionRef as a replay-dedup key: distinct receipts
# (e.g. the same tx hash across two chains) must not collide.
ACTION_TUPLE_KEYS = {
    "agent": "action", "actionType": "action", "scope": "action", "outcome": "action",
    "resourceUrl": "root", "transaction": "root", "settlementRef": "root",
    "settlementStatus": "root", "issuedAt": "root",
    "network": "root", "payer": "root", "payTo": "root", "version": "root",
}

SUPPORTED_ALGS = {"ES256", "ES256K", "EdDSA"}
ALG_CURVE = {"ES256": "secp256r1", "ES256K": "secp256k1"}
CURVE_ORDER = {  # math constants (low-s), not chain constants
    "secp256r1": 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551,
    "secp256k1": 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141,
}


def _is_int(v) -> bool:
    return isinstance(v, int) and not isinstance(v, bool)


# --- reject reason codes (x402 error-taxonomy convention, T1.3) ----------
R_MALFORMED = "invalid_payload"                              # core §9
R_UNKNOWN_ALG = "invalid_actionreceipt_alg"
R_UNSUPPORTED_VERSION = "invalid_actionreceipt_version"
R_INVALID_OUTCOME = "invalid_actionreceipt_outcome"
R_INVALID_STATUS = "invalid_actionreceipt_status"
R_CIRCULARITY = "invalid_actionreceipt_circularity"
R_NONCANONICAL = "invalid_actionreceipt_canonicalization"
R_ACTIONREF = "invalid_actionreceipt_actionref"
R_SIG_INVALID = "invalid_actionreceipt_signature"
R_SIGNER_UNAUTH = "invalid_actionreceipt_signer"
R_SETTLEMENT_FAILED = "invalid_transaction_state"           # core §9
R_SETTLEMENT = "invalid_actionreceipt_settlement_mismatch"
R_STALE = "invalid_actionreceipt_freshness"

ALL_REASONS = {R_MALFORMED, R_UNKNOWN_ALG, R_UNSUPPORTED_VERSION, R_INVALID_OUTCOME,
               R_INVALID_STATUS, R_CIRCULARITY, R_NONCANONICAL, R_ACTIONREF,
               R_SIG_INVALID, R_SIGNER_UNAUTH, R_SETTLEMENT_FAILED, R_SETTLEMENT, R_STALE}

PASS = "PASS"
REJECT = "REJECT"


class Settlement:
    """The x402 SettlementResponse fields the receipt binds to (core §5.3),
    generalized (T0.1): `transaction` for on-chain schemes, `settlement_ref` for
    schemes that settle without a tx hash (batch/channel/ledger). In core §5.3
    `network` is Required and `payer` Optional; a verifier may still receive them
    as None, and `network` binds only in CAIP-2 form (v1 networks are human-readable)."""
    def __init__(self, success: bool, transaction: str = "", settlement_ref: str = "",
                 network=None, payer=None, now: int = 0, max_age_s: int = 3600):
        self.success = success
        self.transaction = transaction
        self.settlement_ref = settlement_ref
        self.network = network
        self.payer = payer
        self.now = now
        self.max_age_s = max_age_s


def _looks_caip2(s) -> bool:
    return isinstance(s, str) and ":" in s and not s.startswith("0x")


def compute_action_ref(payload: dict) -> str:
    action = payload["action"]
    tuple_obj = {k: (action[k] if src == "action" else payload[k])
                 for k, src in ACTION_TUPLE_KEYS.items()}
    return sha256_b64url(jcs(tuple_obj))


def validate_payload(payload) -> str | None:
    if not isinstance(payload, dict):
        return R_MALFORMED
    if set(payload.keys()) != TOP_KEYS:
        return R_MALFORMED
    action = payload["action"]
    if not isinstance(action, dict) or set(action.keys()) != ACTION_KEYS:
        return R_MALFORMED
    if not all(isinstance(payload[f], str) for f in STRING_TOP_FIELDS):
        return R_MALFORMED
    if not all(isinstance(action[f], str) for f in ACTION_KEYS):
        return R_MALFORMED
    if not (_is_int(payload["version"]) and _is_int(payload["issuedAt"])):
        return R_MALFORMED
    if not (0 <= payload["issuedAt"] <= SAFE_INT_MAX):
        return R_MALFORMED
    # at least one settlement identifier must be present (T0.1)
    if not (payload["transaction"] or payload["settlementRef"]):
        return R_MALFORMED
    if payload["version"] != PROFILE_VERSION:
        return R_UNSUPPORTED_VERSION
    if action["outcome"] not in OUTCOMES:
        return R_INVALID_OUTCOME
    if payload["settlementStatus"] not in SETTLEMENT_STATUSES:
        return R_INVALID_STATUS
    return None


def verify_action_receipt(receipt, settlement: Settlement,
                          key_registry: dict) -> tuple[str, str]:
    """Verify an Action-Bound Receipt against a settlement. Offline. Never raises
    on hostile input (any unexpected shape -> invalid_payload). `key_registry`
    maps kid -> PEM, plus "__service__:<resourceUrl>" and "__payTo__:<payTo>" ->
    list of authorized kids (base §4.5.1 anchors)."""
    try:
        return _verify(receipt, settlement, key_registry)
    except Exception:  # noqa: BLE001 — a public verifier must reject, not crash
        return REJECT, R_MALFORMED


def _verify(receipt, settlement, key_registry) -> tuple[str, str]:
    # 1. envelope
    if not isinstance(receipt, dict) or receipt.get("format") != "jws":
        return REJECT, R_MALFORMED
    compact = receipt.get("signature")
    if not isinstance(compact, str) or compact.count(".") != 2:
        return REJECT, R_MALFORMED
    h_b64, p_b64, s_b64 = compact.split(".")
    try:
        header = json.loads(b64url_decode(h_b64))
    except (ValueError, json.JSONDecodeError):
        return REJECT, R_MALFORMED
    if not isinstance(header, dict):
        return REJECT, R_MALFORMED
    alg = header.get("alg")
    if alg not in SUPPORTED_ALGS:
        return REJECT, R_UNKNOWN_ALG
    kid = header.get("kid")
    if not isinstance(kid, str):
        return REJECT, R_MALFORMED

    # 2. payload parse + closed-schema validation
    try:
        payload_bytes = b64url_decode(p_b64)
        payload = json.loads(payload_bytes)
    except (ValueError, json.JSONDecodeError):
        return REJECT, R_MALFORMED
    if isinstance(payload, dict) and (
            "signature" in payload or ("signature" in payload.get("action", {})
                                       if isinstance(payload.get("action"), dict) else False)):
        return REJECT, R_CIRCULARITY
    reason = validate_payload(payload)
    if reason:
        return REJECT, reason

    # 3. canonicalization MUST
    if payload_bytes != jcs(payload):
        return REJECT, R_NONCANONICAL

    # 4. actionRef recomputes from the structured tuple (#2648)
    if payload["actionRef"] != compute_action_ref(payload):
        return REJECT, R_ACTIONREF

    # 5. signature (curve bound to alg; low-s for ECDSA)
    if not _verify_jws_sig(alg, kid, f"{h_b64}.{p_b64}".encode(),
                           b64url_decode(s_b64), key_registry):
        return REJECT, R_SIG_INVALID

    # 6. signer authorization (base §4.5.1) — fail closed. BOTH anchors are scoped
    #    to the resource: the service anchor is keyed by resourceUrl; the payTo
    #    anchor is keyed by (payTo, resourceUrl), so a payee-authorized key is
    #    trusted only for the specific service it is registered for, not any URL.
    service_kids = key_registry.get("__service__:" + payload["resourceUrl"]) or []
    payto_kids = key_registry.get(
        "__payTo__:" + payload["payTo"] + "|" + payload["resourceUrl"]) or []
    if kid not in service_kids and kid not in payto_kids:
        return REJECT, R_SIGNER_UNAUTH

    # 7. the settlement succeeded and provides at least one identifier (T0.1)
    settlement_id_present = bool(settlement.transaction) or bool(settlement.settlement_ref)
    if settlement.success is not True or not settlement_id_present:
        return REJECT, R_SETTLEMENT_FAILED

    # 8. settlement binding — every identifier the SettlementResponse provides MUST
    #    match, and the receipt MUST NOT claim an identifier the settlement does not
    #    corroborate (else a bogus tx/ref would ride into actionRef unverified). §7
    #    guarantees the settlement provides ≥1, so ≥1 comparison always occurs.
    if settlement.transaction:
        if payload["transaction"] != settlement.transaction:
            return REJECT, R_SETTLEMENT
    elif payload["transaction"]:
        return REJECT, R_SETTLEMENT
    if settlement.settlement_ref:
        if payload["settlementRef"] != settlement.settlement_ref:
            return REJECT, R_SETTLEMENT
    elif payload["settlementRef"]:
        return REJECT, R_SETTLEMENT
    # corroborating network/payer, bound only when the SettlementResponse carries
    # them comparably (CAIP-2; v1 human-readable networks are not cross-checked)
    if _looks_caip2(settlement.network) and payload["network"] != settlement.network:
        return REJECT, R_SETTLEMENT
    if settlement.payer is not None and payload["payer"] != settlement.payer:
        return REJECT, R_SETTLEMENT

    # 9. freshness
    if not (-60 <= settlement.now - payload["issuedAt"] <= settlement.max_age_s):
        return REJECT, R_STALE

    return PASS, (f"outcome={payload['action']['outcome']} "
                 f"status={payload['settlementStatus']} "
                 f"bound to {(settlement.transaction or settlement.settlement_ref)[:12]}")


def _verify_jws_sig(alg, kid, signing_input: bytes, raw_sig: bytes, key_registry) -> bool:
    pem = key_registry.get(kid)
    if not pem:
        return False
    try:
        pub = load_pem_public_key(pem.encode())
    except (ValueError, TypeError):
        return False
    try:
        if alg in ("ES256", "ES256K"):
            if not isinstance(pub, ec.EllipticCurvePublicKey):
                return False
            if pub.curve.name != ALG_CURVE[alg]:
                return False
            if len(raw_sig) != 64:
                return False
            r = int.from_bytes(raw_sig[:32], "big")
            s = int.from_bytes(raw_sig[32:], "big")
            if s > CURVE_ORDER[ALG_CURVE[alg]] // 2:      # reject high-s (malleability)
                return False
            der = asym_utils.encode_dss_signature(r, s)
            pub.verify(der, signing_input, ec.ECDSA(hashes.SHA256()))
            return True
        if alg == "EdDSA":
            if not isinstance(pub, ed25519.Ed25519PublicKey):
                return False
            pub.verify(raw_sig, signing_input)
            return True
    except InvalidSignature:
        return False
    return False


# --- deterministic key material ------------------------------------------

def _es_key(alg):
    curve = ec.SECP256R1() if alg == "ES256" else ec.SECP256K1()
    seed = {"ES256": 0x1111111111111111111111111111111111111111111111111111111111111111,
            "ES256K": 0x2222222222222222222222222222222222222222222222222222222222222222}[alg]
    return ec.derive_private_key(seed, curve)


def _ed_key():
    return ed25519.Ed25519PrivateKey.from_private_bytes(b"\x03" * 32)


def _pem(sk) -> str:
    return sk.public_key().public_bytes(Encoding.PEM, PublicFormat.SubjectPublicKeyInfo).decode()


def _sign_jws(alg, kid, sk, payload_bytes: bytes, *, force_high_s=False) -> str:
    header = {"alg": alg, "kid": kid}
    h_b64 = b64url(jcs(header))
    p_b64 = b64url(payload_bytes)
    signing_input = f"{h_b64}.{p_b64}".encode()
    if alg in ("ES256", "ES256K"):
        der = sk.sign(signing_input, ec.ECDSA(hashes.SHA256()))
        r, s = asym_utils.decode_dss_signature(der)
        n = CURVE_ORDER[ALG_CURVE[alg]]
        s = max(s, n - s) if force_high_s else min(s, n - s)
        raw = r.to_bytes(32, "big") + s.to_bytes(32, "big")
    elif alg == "EdDSA":
        raw = sk.sign(signing_input)
    else:
        raise ValueError(alg)
    return f"{h_b64}.{p_b64}.{b64url(raw)}"


# --- fixed test inputs ----------------------------------------------------

SETTLEMENT_TX = "0x" + "ab" * 32
BATCH_REF = "batch:voucher:9f3c1d0a-0000-4a11-b2cc-settlement-root-01"   # a non-tx settlement id
NETWORK = "eip155:8453"
PAYER = "0x857b06519E91e3A54538791bDbb0E22373e36b66"
PAY_TO = "0x209693Bc6afc0C5328bA36FaF03C514EF312287C"
RESOURCE = "https://api.example.com/v1/complete"
ISSUED_AT = 1703123456
VERIFIER_NOW = 1703123500

KID_ES256 = "did:web:acme.example#es256"
KID_ES256K = "did:web:acme.example#es256k"
KID_ED = "did:web:acme.example#ed25519"
KID_PAYTO = "did:web:acme.example#payto"      # authorized via the payTo anchor only
KID_EVIL = "did:web:evil.example#k"


def _base_payload(**overrides) -> dict:
    action = {"agent": "did:web:acme.example", "actionType": "inference.completion",
              "scope": "read:model-x", "outcome": "delivered"}
    action.update(overrides.pop("action", {}))
    p = {"version": PROFILE_VERSION, "network": NETWORK, "resourceUrl": RESOURCE,
         "payer": PAYER, "payTo": PAY_TO, "issuedAt": ISSUED_AT,
         "transaction": SETTLEMENT_TX, "settlementRef": "", "settlementStatus": "settled",
         "action": action}
    p.update(overrides)
    p["actionRef"] = compute_action_ref(p)
    return p


def _registry():
    es, esk, ed = _es_key("ES256"), _es_key("ES256K"), _ed_key()
    payto = ec.derive_private_key(0x5555, ec.SECP256R1())
    evil = ec.derive_private_key(0x4444, ec.SECP256R1())
    return {
        KID_ES256: _pem(es), KID_ES256K: _pem(esk), KID_ED: _pem(ed),
        KID_PAYTO: _pem(payto), KID_EVIL: _pem(evil),
        # service anchor authorizes the three acme kids for this resource; the payTo
        # anchor authorizes KID_PAYTO for (PAY_TO, RESOURCE) only (scoped).
        "__service__:" + RESOURCE: [KID_ES256, KID_ES256K, KID_ED],
        "__payTo__:" + PAY_TO + "|" + RESOURCE: [KID_PAYTO],
    }, {"ES256": es, "ES256K": esk, "EdDSA": ed, "PAYTO": payto, "EVIL": evil}


def regenerate_vectors() -> None:
    if not HAVE_CRYPTO:
        sys.exit("cannot regenerate vectors without `cryptography`")
    VECTORS.mkdir(exist_ok=True)
    registry, keys = _registry()
    es = keys["ES256"]

    def w(name, receipt):
        (VECTORS / name).write_text(json.dumps(receipt, indent=2) + "\n")

    def jws(alg, kid, payload, **kw):
        return {"format": "jws", "signature": _sign_jws(alg, kid, keys[alg], jcs(payload), **kw)}

    def raw_jws(alg, kid, key, raw_bytes, **kw):
        return {"format": "jws", "signature": _sign_jws(alg, kid, key, raw_bytes, **kw)}

    # ---- positives ----
    w("pos_es256_valid.json", jws("ES256", KID_ES256, _base_payload()))
    w("pos_es256k_valid.json", jws("ES256K", KID_ES256K, _base_payload()))
    w("pos_eddsa_valid.json", jws("EdDSA", KID_ED, _base_payload()))
    w("pos_outcome_refused.json", jws("ES256", KID_ES256, _base_payload(action={"outcome": "refused"})))
    # batch-settled: no tx hash, bound via settlementRef (T0.1)
    w("pos_batch_settled.json",
      jws("ES256", KID_ES256, _base_payload(transaction="", settlementRef=BATCH_REF)))
    # refunded lifecycle (T0.2): a valid, signed attestation of a refunded settlement
    w("pos_refunded.json", jws("ES256", KID_ES256, _base_payload(settlementStatus="refunded")))
    # authorized via the payTo anchor only (base §4.5.1 option a subject) (T1.2)
    w("pos_payto_signer.json",
      {"format": "jws", "signature": _sign_jws("ES256", KID_PAYTO, keys["PAYTO"], jcs(_base_payload()))})

    # ---- negatives: one (or more) per reject branch ----
    good = _sign_jws("ES256", KID_ES256, es, jcs(_base_payload()))
    h, _, s = good.split(".")
    tam = _base_payload(action={"outcome": "refused"})
    w("neg_tampered_payload.json", {"format": "jws", "signature": f"{h}.{b64url(jcs(tam))}.{s}"})
    w("neg_high_s.json", jws("ES256", KID_ES256, _base_payload(), force_high_s=True))

    forged = _base_payload(); forged["actionRef"] = sha256_b64url(b"not-the-tuple")
    w("neg_forged_actionref.json", raw_jws("ES256", KID_ES256, es, jcs(forged)))

    noncanon = json.dumps(_base_payload(), separators=(",", ":")).encode()
    w("neg_noncanonical_payload.json", raw_jws("ES256", KID_ES256, es, noncanon))

    w("neg_settlement_mismatch.json",
      jws("ES256", KID_ES256, _base_payload(transaction="0x" + "cd" * 32)))
    # well-formed receipt verified against a success:false settlement (S_FAILED)
    w("neg_settlement_failed.json", jws("ES256", KID_ES256, _base_payload()))
    w("neg_wrong_signer.json", raw_jws("ES256", KID_EVIL, keys["EVIL"], jcs(_base_payload())))
    w("neg_stale_issuedat.json", jws("ES256", KID_ES256, _base_payload(issuedAt=ISSUED_AT - 10_000)))
    w("neg_unsupported_version.json", jws("ES256", KID_ES256, _base_payload(version=99)))
    w("neg_invalid_outcome.json", jws("ES256", KID_ES256, _base_payload(action={"outcome": "shipped"})))
    w("neg_invalid_status.json", jws("ES256", KID_ES256, _base_payload(settlementStatus="pending")))

    circ = _base_payload(); circ["signature"] = "0xdead"
    w("neg_signature_in_payload.json", raw_jws("ES256", KID_ES256, es, jcs(circ)))

    unk = _sign_jws("ES256", KID_ES256, es, jcs(_base_payload()))
    bad_h = b64url(jcs({"alg": "HS256", "kid": KID_ES256}))
    w("neg_unknown_alg.json", {"format": "jws", "signature": f"{bad_h}.{unk.split('.')[1]}.{unk.split('.')[2]}"})

    scalar_action = _base_payload(); scalar_action["action"] = 7; scalar_action["actionRef"] = "x"
    w("neg_malformed_action_scalar.json",
      raw_jws("ES256", KID_ES256, es, json.dumps(scalar_action, separators=(",", ":")).encode()))
    bad_type = _base_payload(); bad_type["issuedAt"] = "not-a-number"
    w("neg_malformed_issuedat_type.json",
      raw_jws("ES256", KID_ES256, es, json.dumps(bad_type, separators=(",", ":")).encode()))
    extra = _base_payload(); extra["surprise"] = 9007199254740993
    w("neg_malformed_unknown_field.json",
      raw_jws("ES256", KID_ES256, es, json.dumps(extra, separators=(",", ":")).encode()))
    # no settlement identifier at all (T0.1 lower bound)
    no_id = _base_payload(transaction="", settlementRef="")
    w("neg_malformed_no_settlement_id.json",
      raw_jws("ES256", KID_ES256, es, json.dumps(no_id, separators=(",", ":")).encode()))

    # ---- settlement-binding sub-branches (previously funneled through one vector) ----
    w("neg_settlementref_mismatch.json",
      jws("ES256", KID_ES256, _base_payload(transaction="", settlementRef="batch:WRONG-ROOT")))   # vs S_BATCH
    w("neg_network_mismatch.json", jws("ES256", KID_ES256, _base_payload(network="eip155:1")))     # vs S_OK
    w("neg_payer_mismatch.json", jws("ES256", KID_ES256, _base_payload(payer="0x" + "11" * 20)))   # vs S_OK
    # a batch receipt carrying an uncorroborated on-chain tx hash (security hardening)
    w("neg_uncorroborated_transaction.json",
      jws("ES256", KID_ES256, _base_payload(transaction="0x" + "ee" * 32, settlementRef=BATCH_REF)))  # vs S_BATCH
    # payTo-authorized key attesting a DIFFERENT resource (scoped-anchor check)
    w("neg_payto_wrong_resource.json",
      raw_jws("ES256", KID_PAYTO, keys["PAYTO"], jcs(_base_payload(resourceUrl="https://other.example/x"))))  # vs S_OK

    # ---- signature sub-branches (previously funneled through one vector) ----
    # alg=ES256 header but the kid resolves to a secp256k1 key (curve/alg mismatch)
    w("neg_wrong_curve.json",
      raw_jws("ES256", KID_ES256K, keys["ES256K"], jcs(_base_payload())))
    # kid resolves to no registered key
    w("neg_unregistered_kid.json",
      raw_jws("ES256", "did:web:nobody.example#x", es, jcs(_base_payload())))

    # ---- envelope-structural malformed sub-branches ----
    good2 = _sign_jws("ES256", KID_ES256, es, jcs(_base_payload()))
    _, p2, s2 = good2.split(".")
    w("neg_not_jws_format.json", {"format": "eip712", "signature": good2})
    w("neg_header_not_dict.json", {"format": "jws", "signature": f"{b64url(jcs(['ES256', KID_ES256]))}.{p2}.{s2}"})
    w("neg_kid_not_str.json", {"format": "jws", "signature": f"{b64url(jcs({'alg': 'ES256', 'kid': 123}))}.{p2}.{s2}"})
    ver_bad = {**_base_payload(), "version": True}
    w("neg_version_not_int.json",
      raw_jws("ES256", KID_ES256, es, json.dumps(ver_bad, separators=(",", ":")).encode()))
    over = _base_payload(); over["issuedAt"] = 2**53
    w("neg_issuedat_overflow.json",
      raw_jws("ES256", KID_ES256, es, json.dumps(over, separators=(",", ":")).encode()))

    (VECTORS / "keys.json").write_text(json.dumps(registry, indent=2) + "\n")

    # Portable conformance manifest (T: language-neutral reuse). Expected verdict +
    # reason + settlement context per vector, so a verifier in ANY language can run
    # this suite: load keys.json, each vector file, and the named settlement, then
    # reproduce the verdict and — on REJECT — the reason. SUITE/SETTLEMENTS are the
    # single source; this projects them to JSON (late-bound globals, resolved at call).
    def _settlement_json(s):
        return {"success": s.success, "transaction": s.transaction,
                "settlementRef": s.settlement_ref, "network": s.network,
                "payer": s.payer, "now": s.now, "maxAgeSeconds": s.max_age_s}
    manifest = {
        "profile": "action-receipt", "version": PROFILE_VERSION,
        "note": ("Expected verdicts for the Action-Bound Receipt conformance vectors. "
                 "A conformant verifier loads keys.json, each vector, and the named "
                 "settlement, and MUST reproduce the verdict and (on REJECT) the reason."),
        "settlements": {k: _settlement_json(v) for k, v in SETTLEMENTS.items()},
        "vectors": [{"file": f, "expect": e, "reason": r, "settlement": sk}
                    for (f, e, r, sk) in SUITE],
    }
    (VECTORS / "MANIFEST.json").write_text(json.dumps(manifest, indent=2) + "\n")


# --- conformance suite ----------------------------------------------------

S_OK, S_FAILED, S_BATCH = "ok", "failed", "batch"
SUITE = [
    ("pos_es256_valid.json", PASS, None, S_OK),
    ("pos_es256k_valid.json", PASS, None, S_OK),
    ("pos_eddsa_valid.json", PASS, None, S_OK),
    ("pos_outcome_refused.json", PASS, None, S_OK),
    ("pos_batch_settled.json", PASS, None, S_BATCH),
    ("pos_refunded.json", PASS, None, S_OK),
    ("pos_payto_signer.json", PASS, None, S_OK),
    ("neg_unknown_alg.json", REJECT, R_UNKNOWN_ALG, S_OK),
    ("neg_unsupported_version.json", REJECT, R_UNSUPPORTED_VERSION, S_OK),
    ("neg_invalid_outcome.json", REJECT, R_INVALID_OUTCOME, S_OK),
    ("neg_invalid_status.json", REJECT, R_INVALID_STATUS, S_OK),
    ("neg_signature_in_payload.json", REJECT, R_CIRCULARITY, S_OK),
    ("neg_noncanonical_payload.json", REJECT, R_NONCANONICAL, S_OK),
    ("neg_forged_actionref.json", REJECT, R_ACTIONREF, S_OK),
    ("neg_tampered_payload.json", REJECT, R_SIG_INVALID, S_OK),
    ("neg_high_s.json", REJECT, R_SIG_INVALID, S_OK),
    ("neg_wrong_signer.json", REJECT, R_SIGNER_UNAUTH, S_OK),
    ("neg_settlement_failed.json", REJECT, R_SETTLEMENT_FAILED, S_FAILED),
    ("neg_settlement_mismatch.json", REJECT, R_SETTLEMENT, S_OK),
    ("neg_settlementref_mismatch.json", REJECT, R_SETTLEMENT, S_BATCH),
    ("neg_network_mismatch.json", REJECT, R_SETTLEMENT, S_OK),
    ("neg_payer_mismatch.json", REJECT, R_SETTLEMENT, S_OK),
    ("neg_uncorroborated_transaction.json", REJECT, R_SETTLEMENT, S_BATCH),
    ("neg_payto_wrong_resource.json", REJECT, R_SIGNER_UNAUTH, S_OK),
    ("neg_wrong_curve.json", REJECT, R_SIG_INVALID, S_OK),
    ("neg_unregistered_kid.json", REJECT, R_SIG_INVALID, S_OK),
    ("neg_stale_issuedat.json", REJECT, R_STALE, S_OK),
    ("neg_malformed_action_scalar.json", REJECT, R_MALFORMED, S_OK),
    ("neg_malformed_issuedat_type.json", REJECT, R_MALFORMED, S_OK),
    ("neg_malformed_unknown_field.json", REJECT, R_MALFORMED, S_OK),
    ("neg_malformed_no_settlement_id.json", REJECT, R_MALFORMED, S_OK),
    ("neg_not_jws_format.json", REJECT, R_MALFORMED, S_OK),
    ("neg_header_not_dict.json", REJECT, R_MALFORMED, S_OK),
    ("neg_kid_not_str.json", REJECT, R_MALFORMED, S_OK),
    ("neg_version_not_int.json", REJECT, R_MALFORMED, S_OK),
    ("neg_issuedat_overflow.json", REJECT, R_MALFORMED, S_OK),
]

SETTLEMENTS = {
    S_OK: Settlement(True, transaction=SETTLEMENT_TX, network=NETWORK, payer=PAYER, now=VERIFIER_NOW),
    S_FAILED: Settlement(False, transaction="", network=NETWORK, payer=PAYER, now=VERIFIER_NOW),
    S_BATCH: Settlement(True, settlement_ref=BATCH_REF, network=NETWORK, payer=PAYER, now=VERIFIER_NOW),
}


def run_suite(regenerate: bool) -> int:
    if not HAVE_CRYPTO:
        sys.exit("`cryptography` is required to run the conformance suite")
    if regenerate:
        regenerate_vectors()
        print("regenerated committed vectors")
    elif not (VECTORS / "keys.json").exists():
        sys.exit("no committed vectors (keys.json missing) — run with --regenerate to produce them")
    registry = json.loads((VECTORS / "keys.json").read_text())
    print(f"crypto={HAVE_CRYPTO}  rfc8785_crosscheck={HAVE_RFC8785}"
          + ("  (every payload cross-checked vs rfc8785)" if HAVE_RFC8785 else ""))
    print("-" * 88)
    failures, observed, covered = 0, set(), set()
    for fname, expect, reason, skey in SUITE:
        receipt = json.loads((VECTORS / fname).read_text())
        got, got_reason = verify_action_receipt(receipt, SETTLEMENTS[skey], registry)
        observed.add(got)
        if got == REJECT:
            covered.add(got_reason)
        ok = got == expect and (expect == PASS or got_reason == reason)
        failures += not ok
        print(f"[{' ok ' if ok else 'FAIL'}] {fname:34s} want {expect:6s}/{str(reason):40s} got {got:6s}/{got_reason}")
    print("-" * 88)
    if observed != {PASS, REJECT}:
        print(f"SUITE INVALID: verifier never produced both verdicts (saw {observed})")
        return 2
    missing = ALL_REASONS - covered
    if missing:
        print(f"SUITE INVALID: reject reason codes never exercised: {sorted(missing)}")
        return 2
    if failures:
        print(f"{failures} conformance failure(s)")
        return 1
    n_neg = sum(1 for _, e, _, _ in SUITE if e == REJECT)
    print(f"all {len(SUITE)} pass; verifier produced both verdicts; every one of "
          f"{len(ALL_REASONS)} reject reason codes exercised (across {n_neg} negative vectors)")
    return 0


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description="Action-Bound Receipt verifier + conformance suite")
    p.add_argument("--regenerate", action="store_true", help="re-sign and rewrite the committed vectors")
    p.add_argument("--verify", metavar="FILE",
                   help="verify one receipt vector against the committed keys (evaluated against the S_OK settlement)")
    a = p.parse_args(argv)
    if not HAVE_CRYPTO:
        sys.exit("`cryptography` is required (pip install cryptography)")
    if a.verify:
        if not (VECTORS / "keys.json").exists():
            sys.exit("no committed keys.json — run with --regenerate first")
        registry = json.loads((VECTORS / "keys.json").read_text())
        try:
            receipt = json.loads(Path(a.verify).read_text())
        except (OSError, ValueError) as e:
            sys.exit(f"cannot read receipt {a.verify!r}: {e}")
        got, reason = verify_action_receipt(receipt, SETTLEMENTS[S_OK], registry)
        print(f"{got}  {reason}")
        return 0 if got == PASS else 1
    return run_suite(regenerate=a.regenerate)


if __name__ == "__main__":
    sys.exit(main())
