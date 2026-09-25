#!/usr/bin/env python3
"""The -09 censuses over the asqav-sdk corpus at 6137cb95, by JSON pointer.

FINDINGS-rerun-2026-09-25.md reports these counts. They are censuses, not
grades: nothing here decides whether a vector is right, only what its bytes
carry. Every count is recomputable from the pinned files with this script alone.

Reads fixtures/asqav/6137cb95/ as bytes (json.loads over the file, never through
an adapter). Walks the same files the walker does for that corpus:
conformance/vectors.json and verifier/conformance-vectors/asqav-*/.

  python tools/census-asqav-09.py            # prints the census, writes walker/census-asqav-6137cb95.json

The line numbers in the output refer to refs/draft-marques-asqav-compliance-receipts-09.txt.
"""

import hashlib
import json
import os
import sys
from collections import Counter

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORPUS = os.path.join(REPO, "fixtures", "asqav", "6137cb95")
OUT = os.path.join(REPO, "walker", "census-asqav-6137cb95.json")
ZERO = "sha256:" + hashlib.sha256(b"").hexdigest()
ABSENT = "<absent>"


def load(rel):
    with open(os.path.join(CORPUS, rel), "rb") as f:
        return json.loads(f.read().decode("utf-8"))


def anchors_shape(env):
    if "anchors" not in env:
        return "absent"
    a = env["anchors"]
    if a is None:
        return "null"
    if isinstance(a, list):
        return "empty" if len(a) == 0 else "entries"
    return "other:" + type(a).__name__


def v_of(env):
    """payload.v in the core envelope; top-level v in the flat legacy transport (-09 lines 767-771), said so."""
    payload = env.get("payload")
    if isinstance(payload, dict):
        return payload["v"] if "v" in payload else ABSENT
    if "v" in env:
        return f"flat-top-level:{env['v']}"
    return ABSENT


def alg_of(env):
    sig = env.get("signature")
    if isinstance(sig, dict):
        return sig.get("alg", ABSENT)
    if "algorithm" in env:
        return f"flat-top-level-algorithm:{env['algorithm']}"
    return "no-signature-object"


def envelopes():
    """Every receipt-shaped envelope {payload, signature, ...} in the walked files, by pointer."""
    out = []
    vec = load("conformance/vectors.json")
    for i, v in enumerate(vec["vectors"]):
        inp = v.get("input")
        if isinstance(inp, dict) and "payload" in inp and "signature" in inp:
            out.append(("conformance/vectors.json", f"/vectors/{i}/input", v.get("name"), inp))
    base = os.path.join(CORPUS, "verifier", "conformance-vectors")
    for d in sorted(os.listdir(base)):
        if not d.startswith("asqav-") or not os.path.isdir(os.path.join(base, d)):
            continue
        for name in ("receipt.json", "predecessor.json", "originating_envelope.json"):
            rel = f"verifier/conformance-vectors/{d}/{name}"
            if os.path.exists(os.path.join(CORPUS, rel)):
                out.append((rel, "", d, load(rel)))
    return out


def walk(node, path=""):
    if isinstance(node, dict):
        for k, v in node.items():
            p = f"{path}/{k.replace('~', '~0').replace('/', '~1')}"
            yield p, k, v, node
            yield from walk(v, p)
    elif isinstance(node, list):
        for i, v in enumerate(node):
            yield from walk(v, f"{path}/{i}")


def main():
    files = ["conformance/vectors.json"] + [
        f"verifier/conformance-vectors/{d}/{n}"
        for d in sorted(os.listdir(os.path.join(CORPUS, "verifier", "conformance-vectors")))
        if d.startswith("asqav-")
        for n in sorted(os.listdir(os.path.join(CORPUS, "verifier", "conformance-vectors", d)))
        if n.endswith(".json")
    ]
    envs = envelopes()
    receipts = [e for e in envs if e[0].endswith("/receipt.json")]

    # 1. v (-09 lines 757-765, 789-795, 797-808), per envelope.
    v_rows = [{"file": f, "pointer": (p or "") + ("/payload/v" if isinstance(e.get("payload"), dict) else "/v"), "vector": n, "v": v_of(e)} for f, p, n, e in envs]
    # 2. anchors (-09 lines 1449-1452), per envelope.
    a_rows = [{"file": f, "pointer": (p or "") + "/anchors", "vector": n, "shape": anchors_shape(e)} for f, p, n, e in envs]
    # 3. signature alg (-09 line 704; 741-745), per envelope. A census only.
    alg_rows = [{"file": f, "pointer": (p or "") + ("/signature/alg" if isinstance(e.get("signature"), dict) else "/algorithm"), "vector": n, "alg": alg_of(e)}
                for f, p, n, e in envs]

    # 4. counterparty_binding.scope (-09 lines 1781-1802), every binding in every walked file.
    scope_rows, ar_rows = [], []
    for rel in files:
        doc = load(rel)
        for p, k, v, holder in walk(doc):
            if k == "counterparty_binding" and isinstance(v, dict):
                scope_rows.append({"file": rel, "pointer": p, "scope": v.get("scope", ABSENT)})
            # 5. action_ref (-09 lines 1094-1130), every member in every walked file.
            if k == "action_ref" and isinstance(v, str):
                pd = holder.get("payload_digest")
                ar_rows.append({
                    "file": rel, "pointer": p, "value": v,
                    "sha256_form": v.startswith("sha256:") and len(v) == 71,
                    "zero_bytes": v == ZERO,
                    "equals_payload_digest_hash": isinstance(pd, dict) and v == "sha256:" + str(pd.get("hash")),
                    "descriptor_beside_it": any(x in holder for x in ("action_descriptor", "agentId", "actionType", "scopeRequired")),
                })

    # 6. expected outcomes of the asqav-* receipt vectors, beside their anchor shape.
    exp_rows = []
    base = os.path.join(CORPUS, "verifier", "conformance-vectors")
    for f, p, n, e in receipts:
        ex = load(f"verifier/conformance-vectors/{n}/expected.json")
        words = " ".join(str(ex.get(k, "")) for k in ("outcome", "reason_code", "notes", "failure_class"))
        exp_rows.append({
            "vector": n, "anchors": anchors_shape(e), "outcome": ex.get("outcome"), "reason_code": ex.get("reason_code"),
            "mentions_anchor": "anchor" in words.lower(), "notes": ex.get("notes"),
        })

    result = {
        "corpus": "fixtures/asqav/6137cb95",
        "envelopes": len(envs),
        "receipt_vectors": len(receipts),
        "v": {"counts": dict(Counter(str(r["v"]) for r in v_rows)),
              "receipts_only": dict(Counter(str(r["v"]) for r in v_rows if r["file"].endswith("/receipt.json"))),
              "rows": v_rows},
        "anchors": {"counts": dict(Counter(r["shape"] for r in a_rows)),
                    "receipts_only": dict(Counter(r["shape"] for r in a_rows if r["file"].endswith("/receipt.json"))),
                    "rows": a_rows},
        "alg": {"counts": dict(Counter(r["alg"] for r in alg_rows)),
                "receipts_only": dict(Counter(r["alg"] for r in alg_rows if r["file"].endswith("/receipt.json"))),
                "rows": alg_rows},
        "scope": {"counts": dict(Counter(r["scope"] for r in scope_rows)), "rows": scope_rows},
        "action_ref": {
            "members": len(ar_rows),
            "sha256_form": sum(r["sha256_form"] for r in ar_rows),
            "zero_bytes": sum(r["zero_bytes"] for r in ar_rows),
            "equals_payload_digest_hash": sum(r["equals_payload_digest_hash"] for r in ar_rows),
            "with_descriptor": sum(r["descriptor_beside_it"] for r in ar_rows),
            "distinct_values": len({r["value"] for r in ar_rows}),
            "rows": ar_rows,
        },
        "expected_vs_anchors": {
            "receipts_by_anchor_shape_and_outcome": dict(Counter(f"{r['anchors']}|{r['outcome']}" for r in exp_rows)),
            "rows": exp_rows,
        },
    }
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        json.dump(result, f, indent=2, ensure_ascii=False, sort_keys=True)
        f.write("\n")

    print(f"envelopes={len(envs)} receipt_vectors={len(receipts)}")
    for key in ("v", "anchors", "alg"):
        print(f"{key}: all={result[key]['counts']} receipts={result[key]['receipts_only']}")
    print(f"scope: {result['scope']['counts']}")
    a = result["action_ref"]
    print(f"action_ref: members={a['members']} sha256_form={a['sha256_form']} zero_bytes={a['zero_bytes']} "
          f"equals_payload_digest_hash={a['equals_payload_digest_hash']} with_descriptor={a['with_descriptor']} distinct_values={a['distinct_values']}")
    print(f"receipts by anchors|outcome: {result['expected_vs_anchors']['receipts_by_anchor_shape_and_outcome']}")
    print(f"wrote {os.path.relpath(OUT, REPO)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
