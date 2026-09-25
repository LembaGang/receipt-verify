# FINDINGS — rerun 2026-09-25 (`asqav-sdk@6137cb95` against `-09`)

A walk of the Asqav SDK conformance corpus at the commit
`draft-marques-asqav-compliance-receipts-09` names as its own vector corpus, graded against `-09` as
posted on 21 September 2026 rather than against `-08`, and a re-reading of M5, M7 and N1 against both.

This rerun ran on **Friday 25 September 2026, 08:41Z to 09:18Z**, dated by the clock. It is the fourth
document in this series, after `FINDINGS-rerun-2026-07-29.md`, `FINDINGS-rerun-2026-09-02.md` and
`FINDINGS-rerun-2026-09-08.md`, whose method it follows.

`FINDINGS.md` and the earlier reruns are **not edited**. Where `-09` changes what they say, a dated
append was added to them on the same date (`FINDINGS-rerun-2026-09-08.md`, the block headed "Appended
2026-09-25"; `FINDINGS.md`, the block at the end of A5). Their entries remain accurate of the bytes
they name.

Every line number below refers to `refs/draft-marques-asqav-compliance-receipts-09.txt` unless it says
`-08`. Every cited line was printed from the pinned bytes with `sed -n` and read before it was cited.
Every count below is copied from the output of `npm run walk` or `python tools/census-asqav-09.py` in
this session.

---

## Why this rerun exists

`-09` was posted on 21 September 2026. Three records in this repository described `-09` as it had been
described in correspondence on 8 September, not as posted: the fourteen `declared_opaque` entries in
`walker/scopes.json`, the N1 append and the M7 append in `FINDINGS-rerun-2026-09-08.md`. The walker's
own tripwire fired when `-09` was pinned: all fourteen declarations read `declared_opaque_expired`
(`revisit_when.upstream_appears`, id prefix `draft-marques-asqav-compliance-receipts-09`), and five
tests in `test/walker.test.ts` failed until they were re-read. They were re-read and withdrawn (N1
below). The corpus `-09` cites had never been pinned here; it is now, and this document is its walk.

---

## What was pinned, and what it digests to

Every digest below was computed in this session from the bytes named. None is carried over from a
handoff or from correspondence.

### The draft

| field | value |
|---|---|
| path | `refs/draft-marques-asqav-compliance-receipts-09.txt` |
| URL | `https://www.ietf.org/archive/id/draft-marques-asqav-compliance-receipts-09.txt` |
| bytes | 379060 |
| lines | 7840 (`grep -c ''`) |
| sha256 | `c455cdf8a402c46bff383088321d52d7aaebfef32090fd633efcdf02e7bee406` |
| line 7 | `Intended status: Informational                         21 September 2026` |
| `last-modified` | `Mon, 21 Sep 2026 18:38:10 GMT` |
| `npm run drift`, 2026-09-25T08:44:49Z | `current`: `draft-marques-asqav-compliance-receipts-10 is 404; -09 is the highest revision published` |

`-08` stays pinned beside it as `historical` with its digest unchanged
(`ee3ca5d7c0acc1cb9b8025d29f19a7d73991718ca35d3bf4229f7b4264976ec0`), because every earlier finding was
graded against it.

### The corpus

`-09` names it at lines 7094-7097:

```
   [ASQAV-SDK]
              Asqav, "asqav-sdk: Verifier Conformance Vectors", 2026,
              <https://github.com/jagmarques/asqav-sdk/
              tree/6137cb95edcfcd820ecff0e11c6f603b2da664b1>.
```

| field | value |
|---|---|
| repository | `https://github.com/jagmarques/asqav-sdk` |
| commit | `6137cb95edcfcd820ecff0e11c6f603b2da664b1` |
| subject | `fix: pass originating receipts through standalone CLI (#512)` |
| commit date | 2026-09-12T12:20:37+02:00 = **2026-09-12 10:20:37 UTC** |
| `origin/main` when resolved | `bd002c0c9ad863fa0b1c4de675f6378b7321dda0`, 2026-09-25T08:51:14Z; `6137cb95` is 32 commits behind it |
| files pinned | 303, 609003 bytes, under `fixtures/asqav/6137cb95/` |

| file | blob at `6137cb95` | bytes | sha256 |
|---|---|---|---|
| `conformance/vectors.json` | `ebd8931ded180ac42c4d7c44a4b52b700c1af0d5` | 54904 | `575d2605d5acf40d3387603cdded83e95efbe8794dc8dd8387f6b7905d1db99a` |
| `conformance/manifest.lock.json` | `69aacedb141919fe321daa7ee589f7e676983be6` | 13853 | `a2839bf22a3b6eeb6b0182064ef590bff4ae721df611c612492e228af873251b` |
| `verifier/conformance-vectors/` | 301 files | | per file in `fixtures/provenance.md` |

Taken with `git cat-file blob` from a fresh clone's object store. `git hash-object` over every copied file
reproduced its upstream blob id (303 of 303), and every file carries 0 CR bytes. The author's
`conformance/manifest.lock.json` (corpus_version 11) records `vectors.json` at the same sha256 and byte
count. The author's `verifier/conformance-vectors/manifest.lock.json` (corpus_version 26) carries 300
file rows, and all 300 equal the pinned bytes.

`verifier/conformance-vectors/` exists at `6137cb95`. Of the earlier asqav pins only `asqav/05c1c49`
held any of it (three vector directories); `3b88156`, `22a970d`, `a21d060` and the three `history/*`
pins hold none. This is the first pin in this repository of the whole `asqav-*` receipt set that M7
measures.

**Against the tip.** At `bd002c0c` the two `conformance/` files are the same blobs; 25 files under
`verifier/conformance-vectors/` differ. This rerun describes `6137cb95` because `-09` cites it, and
says nothing about the tip.

---

## Method

The instrument is the digest walker (`npm run walk`, registry `walker/scopes.json`), which recomputes
each registered member from the corpus's own bytes under a scope cited to a document by line number,
under two independent JCS serialisers. `asqav/6137cb95` is the first corpus with its own `-09` rule
set, and **no `-08` rule is applied to it**: not the `-08` §5.7 three-key `envelope_hash` default
(`-08` 1351-1369), and not the `-08` chain rules. A test asserts this (`test/walker.test.ts`,
"applies no -08 rule").

| rule | construction | `-09` lines |
|---|---|---|
| `asqav.vector.canonical`, `asqav.vector.sha256` | `jcs(input)` and `sha256(canonical)`, from the corpus's own header (inferred, not `-08`) | none |
| `asqav.counterparty.envelope_hash.09.input` / `.expected` / `.receipt_file` | `sha256(utf8(jcs({"payload": A.payload, "signature": A.signature})))` | 1700-1712 |
| the `scope` member | `envelope_minus_anchors` recomputed; no member: `unverifiable_legacy_scope`, not recomputed; any other value: `unverifiable_undefined_scope`, not recomputed | 1781-1802, 1881-1892 |
| `asqav.chain.09.payload` | `sha256(jcs(predecessor payload))`, lowercase hex, signature and anchors excluded | 1305-1309 |
| `asqav.action_ref.descriptor` | `"sha256:" \|\| lowercase_hex(SHA-256(UTF8(JCS(A))))`, A the four-member Action descriptor | 1096-1108 |

Envelope digests are compared as decoded bytes, never as strings, because `-09` lines 1746-1748 have
the verifier decode either alphabet with or without padding. Only one scope is recomputed per binding:
`-09` lines 1799-1802 and 1889-1890 forbid recomputing under both scopes and reporting whichever
matches, so the `-08` rules' informational alternative-scope note is not produced for this corpus.

Walked: `conformance/vectors.json` and the `verifier/conformance-vectors/asqav-*` directories. Pinned
and not walked: the two manifest locks, and the vectors of other formats in the same tree (`acta-*`,
`aerf-*`, `agentreceipts-*`, `authproof-*`, `pipelock-*`, `w3c-vc-*`, `dsse-*`), which `-09` does not
govern.

The censuses (v, anchors, alg, scope, action_ref, expected outcomes) are produced by
`tools/census-asqav-09.py`, which reads the same files and writes `walker/census-asqav-6137cb95.json`.
They are counts of what the bytes carry, not grades.

---

## The walk

`npm run walk`, 2026-09-25T09:05:38Z, and again after the full test suite started at 09:11:45Z, with
identical output:

```
  asqav/6137cb95           registered=  91  match=  87  mismatch=  4  unregistered= 236  serializer_disagreement=0  expected_refusal=0  rule_idle=0  declared_opaque=0  input_absent=61  unverifiable_legacy_scope=4  unverifiable_undefined_scope=4  (declared=31 inferred=60)

SUMMARY match=593 mismatch=24 unregistered=771 serializer_disagreement=0 expected_refusal=3 rule_idle=2 declared_opaque=0 input_absent=61 unverifiable_legacy_scope=4 unverifiable_undefined_scope=4; report walker/report.json
```

Exit 1. Of the 24 mismatches, 20 are the M6 pointers at `asqav/05c1c49` and `asqav/history/ee8a3e7`,
kept red on purpose and unchanged. The other 4 are at `asqav/6137cb95`:

| pointer | the vector's own expected outcome |
|---|---|
| `conformance/vectors.json#/vectors/29/input/counterparty_binding/envelope_hash` | `expected.binding_label` `"mismatch"`, `expected_verify` false |
| `conformance/vectors.json#/vectors/29/expected/envelope_hash_base64` | same vector |
| `conformance/vectors.json#/vectors/29/expected/envelope_hash_hex` | same vector |
| `verifier/conformance-vectors/asqav-32-counterparty-anchors-included/receipt.json#/payload/counterparty_binding/envelope_hash` | `outcome` `unverified`, `reason_code` `counterparty_mismatch` |

All four are negative vectors: each declares `scope` `envelope_minus_anchors` and carries a digest
generated over the three-key envelope (vector 29's own `generation.counterparty_digest_members` is
`["payload", "signature", "anchors"]`), and each vector's own expectation is that the binding does not
match. The walker's mismatch and the corpus's expectation agree. They are reported as mismatches, and
not registered away, because a walker that could be told which digests are meant to be wrong would be
a way to make red things green.

By rule, at `asqav/6137cb95`:

| rule | outcome | rows |
|---|---|---|
| `(census)` | unregistered | 234 |
| `asqav.action_ref.descriptor` | input_absent | 61 |
| `asqav.chain.09.payload` | match | 13 |
| `asqav.counterparty.envelope_hash.09.expected` | match | 8 |
| `asqav.counterparty.envelope_hash.09.expected` | mismatch | 2 |
| `asqav.counterparty.envelope_hash.09.expected` | unregistered | 2 |
| `asqav.counterparty.envelope_hash.09.expected` | unverifiable_legacy_scope | 2 |
| `asqav.counterparty.envelope_hash.09.expected` | unverifiable_undefined_scope | 2 |
| `asqav.counterparty.envelope_hash.09.input` | match | 5 |
| `asqav.counterparty.envelope_hash.09.input` | mismatch | 1 |
| `asqav.counterparty.envelope_hash.09.input` | unverifiable_legacy_scope | 1 |
| `asqav.counterparty.envelope_hash.09.input` | unverifiable_undefined_scope | 1 |
| `asqav.counterparty.envelope_hash.09.receipt_file` | match | 1 |
| `asqav.counterparty.envelope_hash.09.receipt_file` | mismatch | 1 |
| `asqav.counterparty.envelope_hash.09.receipt_file` | unverifiable_legacy_scope | 1 |
| `asqav.counterparty.envelope_hash.09.receipt_file` | unverifiable_undefined_scope | 1 |
| `asqav.vector.canonical` | match | 30 |
| `asqav.vector.sha256` | match | 30 |

Recomputed with `tools/asqav_envelope_hash.py` in this session: vector 29's declared
`NuUlbDlAp3frTk/GsI/LMfHlo1LIJzaqezJXiYC16bQ=` equals SHA-256 over the JCS of vector 27's
`{payload, signature, anchors}`, and `asqav-32`'s declared `xX8NV1ef9sjYsMu1X7cMCH1Pabzxb79UetKrXT+jccE=`
equals SHA-256 over the JCS of its `originating_envelope.json` with anchors included. Under the scope
each declares, neither matches.

`expected_refusal` is 0 here where it is 1 at the three previous tips: at `6137cb95` the
`asqav-25-number-at-safe-range-boundary` vector's input is `{"n": 9007199254740991}`, inside the range
the second serialiser accepts, so both serialisers canonicalise it and its `canonical` matches.

### Every vector, by outcome

`m` match, `x` mismatch, `ia` input_absent, `ls` unverifiable_legacy_scope, `us` unverifiable_undefined_scope, `u` unregistered.

| # | vector | members by outcome |
|---|---|---|
| 0 | `minimal_read` | m=2 |
| 1 | `tool_call_with_counterparty` | m=2 u=1 |
| 2 | `traced_child_action` | m=2 |
| 3 | `tampered_signature` | m=2 |
| 4 | `swapped_public_key` | m=2 |
| 5 | `stale_card` | m=2 |
| 6 | `nonce_mismatch` | m=2 |
| 7 | `card_version_downgrade` | m=2 |
| 8 | `capture_topology_in_process_sdk` | m=2 |
| 9 | `capture_topology_network_proxy` | m=2 |
| 10 | `capture_topology_browser_extension` | m=2 |
| 11 | `capture_topology_github_sha_pull` | m=2 |
| 12 | `capture_topology_mcp_proxy` | m=2 |
| 13 | `capture_topology_unknown_value_rejected` | m=2 |
| 14 | `counterparty_binding_happy_path` | m=5 ia=1 u=4 |
| 15 | `counterparty_binding_envelope_byte_equality` | m=4 ia=1 u=5 |
| 16 | `counterparty_binding_base64url_tolerance` | m=5 ia=1 u=4 |
| 17 | `counterparty_binding_opaque_receipt_ref` | m=3 ia=1 u=4 |
| 18 | `counterparty_binding_transport_label_non_trust` | m=3 ia=1 u=4 |
| 19 | `counterparty_binding_missing_envelope_hash_rejected` | m=2 ia=1 u=3 |
| 20 | `receipt_v2_signer_canary` | m=2 ia=1 u=5 |
| 21 | `asqav-24-jcs-astral-key-order` | m=2 |
| 22 | `asqav-24-jcs-astral-key-order-codepoint-rejected` | m=2 u=1 |
| 23 | `asqav-25-number-above-safe-range-rejected` | none |
| 24 | `asqav-25-number-above-safe-range-as-string` | m=2 |
| 25 | `asqav-25-number-at-safe-range-boundary` | m=2 |
| 26 | `asqav-25-number-above-safe-range-boundary-rejected` | none |
| 27 | `counterparty_binding_origin_two_anchors` | m=2 ia=1 u=5 |
| 28 | `counterparty_binding_scope_minus_anchors` | m=5 ia=1 u=3 |
| 29 | `counterparty_binding_anchors_included_rejected` | m=2 **x**=3 ia=1 u=3 |
| 30 | `counterparty_binding_legacy_scope_absent` | m=2 ia=1 ls=3 u=3 |
| 31 | `counterparty_binding_unrecognised_scope` | m=2 ia=1 us=3 u=3 |

| directory | members by outcome |
|---|---|
| `asqav-01-genesis-permit` | ia=1 u=4 |
| `asqav-02-genesis-deny` | ia=1 u=4 |
| `asqav-03-chain-link` | m=1 ia=2 u=6 |
| `asqav-04-tamper-sig` | ia=1 u=4 |
| `asqav-05-hash-mode-prod` | u=2 |
| `asqav-06-mldsa65-payload-prod` | ia=1 u=3 |
| `asqav-07-revoked-key` | ia=1 u=4 |
| `asqav-08-v2-signer-canary` | ia=1 u=7 |
| `asqav-09-v2-signer-tampered` | ia=1 u=7 |
| `asqav-10-hash-mode-multikey` | u=5 |
| `asqav-11-dup-member-toplevel` | ia=1 u=4 |
| `asqav-12-time-edge-expiry` | ia=1 u=3 |
| `asqav-13-dup-member-nested` | ia=1 u=4 |
| `asqav-14-omitted-action-chain` | m=1 ia=2 u=6 |
| `asqav-15-unsigned-gap` | m=1 ia=2 u=6 |
| `asqav-16-chain-emission-blocked` | m=1 ia=2 u=6 |
| `asqav-17-seq-contiguous` | m=1 ia=2 u=6 |
| `asqav-18-seq-gap` | m=1 ia=2 u=6 |
| `asqav-19-seq-non-monotonic` | m=1 ia=2 u=6 |
| `asqav-20-seq-absent` | m=1 ia=2 u=6 |
| `asqav-21-key-thumbprint-binds` | ia=1 u=4 |
| `asqav-22-key-substituted` | ia=1 u=4 |
| `asqav-23-anchor-status-pending` | ia=1 u=4 |
| `asqav-24-anchor-block-hash-prod` | m=1 ia=2 u=13 |
| `asqav-25-payload-digest-rederives` | ia=1 u=4 |
| `asqav-26-payload-digest-mismatch` | ia=1 u=4 |
| `asqav-27-anchors-absent` | m=1 ia=2 u=6 |
| `asqav-28-anchors-null-malformed` | m=1 ia=2 u=6 |
| `asqav-31-counterparty-scope-match` | m=1 ia=2 u=8 |
| `asqav-32-counterparty-anchors-included` | **x**=1 ia=2 u=8 |
| `asqav-33-counterparty-scope-absent` | ia=2 ls=1 u=8 |
| `asqav-34-counterparty-scope-unknown` | ia=2 us=1 u=8 |
| `asqav-35-invocation-ref-binds-pre-post` | m=1 ia=2 u=6 |
| `asqav-36-invocation-ref-duplicate-emission` | m=1 ia=2 u=6 |

## The censuses, by JSON pointer

From `python tools/census-asqav-09.py` (2026-09-25T09:10:50Z, rerun after the flat-transport correction), which writes `walker/census-asqav-6137cb95.json`.

### receipt vectors: v, anchors, signature alg, expected outcome

| vector (`receipt.json`) | v | anchors | alg | expected outcome | reason_code |
|---|---|---|---|---|---|
| `asqav-01-genesis-permit` | `1` at `/payload/v` | empty | `Ed25519` | verified | (empty) |
| `asqav-02-genesis-deny` | `1` at `/payload/v` | empty | `Ed25519` | verified | (empty) |
| `asqav-03-chain-link` | `1` at `/payload/v` | empty | `Ed25519` | verified | (empty) |
| `asqav-04-tamper-sig` | `1` at `/payload/v` | empty | `Ed25519` | unverified | `issuer_signature` |
| `asqav-05-hash-mode-prod` | `flat-top-level:1` at `/v` | empty | `flat-top-level-algorithm:ML-DSA-65` | unverified | `signature_skipped_no_dilithium` |
| `asqav-06-mldsa65-payload-prod` | `1` at `/payload/v` | entries | `ML-DSA-65` | verified | (empty) |
| `asqav-07-revoked-key` | `1` at `/payload/v` | empty | `Ed25519` | unverified | `key_revoked` |
| `asqav-08-v2-signer-canary` | `2` at `/payload/v` | empty | `Ed25519` | verified | (empty) |
| `asqav-09-v2-signer-tampered` | `2` at `/payload/v` | empty | `Ed25519` | unverified | `issuer_signature` |
| `asqav-10-hash-mode-multikey` | `flat-top-level:1` at `/v` | empty | `flat-top-level-algorithm:Ed25519` | verified | (empty) |
| `asqav-11-dup-member-toplevel` | `1` at `/payload/v` | empty | `Ed25519` | unverified | `duplicate_member` |
| `asqav-12-time-edge-expiry` | `1` at `/payload/v` | entries | `ML-DSA-65` | verified | (empty) |
| `asqav-13-dup-member-nested` | `1` at `/payload/v` | empty | `Ed25519` | unverified | `duplicate_member` |
| `asqav-14-omitted-action-chain` | `1` at `/payload/v` | empty | `Ed25519` | verified | (empty) |
| `asqav-15-unsigned-gap` | `1` at `/payload/v` | empty | `Ed25519` | verified | (empty) |
| `asqav-16-chain-emission-blocked` | `1` at `/payload/v` | empty | `Ed25519` | verified | (empty) |
| `asqav-17-seq-contiguous` | `1` at `/payload/v` | empty | `Ed25519` | verified | (empty) |
| `asqav-18-seq-gap` | `1` at `/payload/v` | empty | `Ed25519` | unverified | `seq_gap` |
| `asqav-19-seq-non-monotonic` | `1` at `/payload/v` | empty | `Ed25519` | unverified | `seq_not_monotonic` |
| `asqav-20-seq-absent` | `1` at `/payload/v` | empty | `Ed25519` | verified | (empty) |
| `asqav-21-key-thumbprint-binds` | `1` at `/payload/v` | empty | `ML-DSA-65` | verified | (empty) |
| `asqav-22-key-substituted` | `1` at `/payload/v` | empty | `ML-DSA-65` | unverified | `key_substituted` |
| `asqav-23-anchor-status-pending` | `1` at `/payload/v` | entries | `Ed25519` | verified | (empty) |
| `asqav-24-anchor-block-hash-prod` | `1` at `/payload/v` | entries | `ML-DSA-65` | verified | (empty) |
| `asqav-25-payload-digest-rederives` | `1` at `/payload/v` | empty | `Ed25519` | verified | (empty) |
| `asqav-26-payload-digest-mismatch` | `1` at `/payload/v` | empty | `Ed25519` | unverified | `payload_digest_mismatch` |
| `asqav-27-anchors-absent` | `1` at `/payload/v` | absent | `Ed25519` | verified | (empty) |
| `asqav-28-anchors-null-malformed` | `1` at `/payload/v` | null | `Ed25519` | unverified | `malformed_member` |
| `asqav-31-counterparty-scope-match` | `1` at `/payload/v` | entries | `Ed25519` | verified | (empty) |
| `asqav-32-counterparty-anchors-included` | `1` at `/payload/v` | entries | `Ed25519` | unverified | `counterparty_mismatch` |
| `asqav-33-counterparty-scope-absent` | `1` at `/payload/v` | entries | `Ed25519` | unverified | `counterparty_legacy_scope` |
| `asqav-34-counterparty-scope-unknown` | `1` at `/payload/v` | entries | `Ed25519` | unverified | `counterparty_unrecognised_scope` |
| `asqav-35-invocation-ref-binds-pre-post` | `1` at `/payload/v` | empty | `Ed25519` | verified | (empty) |
| `asqav-36-invocation-ref-duplicate-emission` | `1` at `/payload/v` | empty | `Ed25519` | verified | (empty) |

### the other envelopes the walked files carry

| envelope | v | anchors | alg |
|---|---|---|---|
| `vectors.json#/vectors/15/input` | `1` | entries | `ML-DSA-65` |
| `vectors.json#/vectors/27/input` | `1` | entries | `ML-DSA-65` |
| `asqav-03-chain-link/predecessor.json#/` | `1` | empty | `Ed25519` |
| `asqav-14-omitted-action-chain/predecessor.json#/` | `1` | empty | `Ed25519` |
| `asqav-15-unsigned-gap/predecessor.json#/` | `1` | empty | `Ed25519` |
| `asqav-16-chain-emission-blocked/predecessor.json#/` | `1` | empty | `Ed25519` |
| `asqav-17-seq-contiguous/predecessor.json#/` | `1` | empty | `Ed25519` |
| `asqav-18-seq-gap/predecessor.json#/` | `1` | empty | `Ed25519` |
| `asqav-19-seq-non-monotonic/predecessor.json#/` | `1` | empty | `Ed25519` |
| `asqav-20-seq-absent/predecessor.json#/` | `1` | empty | `Ed25519` |
| `asqav-24-anchor-block-hash-prod/predecessor.json#/` | `1` | entries | `ML-DSA-65` |
| `asqav-27-anchors-absent/predecessor.json#/` | `1` | empty | `Ed25519` |
| `asqav-28-anchors-null-malformed/predecessor.json#/` | `1` | empty | `Ed25519` |
| `asqav-31-counterparty-scope-match/originating_envelope.json#/` | `1` | entries | `Ed25519` |
| `asqav-32-counterparty-anchors-included/originating_envelope.json#/` | `1` | entries | `Ed25519` |
| `asqav-33-counterparty-scope-absent/originating_envelope.json#/` | `1` | entries | `Ed25519` |
| `asqav-34-counterparty-scope-unknown/originating_envelope.json#/` | `1` | entries | `Ed25519` |
| `asqav-35-invocation-ref-binds-pre-post/predecessor.json#/` | `1` | empty | `Ed25519` |
| `asqav-36-invocation-ref-duplicate-emission/predecessor.json#/` | `1` | empty | `Ed25519` |

### counterparty_binding.scope, every binding

| binding | scope |
|---|---|
| `vectors.json#/vectors/14/input/counterparty_binding` | `envelope_minus_anchors` |
| `vectors.json#/vectors/16/input/counterparty_binding` | `envelope_minus_anchors` |
| `vectors.json#/vectors/17/input/counterparty_binding` | `envelope_minus_anchors` |
| `vectors.json#/vectors/18/input/counterparty_binding` | `envelope_minus_anchors` |
| `vectors.json#/vectors/19/input/counterparty_binding` | `envelope_minus_anchors` |
| `vectors.json#/vectors/28/input/counterparty_binding` | `envelope_minus_anchors` |
| `vectors.json#/vectors/29/input/counterparty_binding` | `envelope_minus_anchors` |
| `vectors.json#/vectors/30/input/counterparty_binding` | `<absent>` |
| `vectors.json#/vectors/31/input/counterparty_binding` | `unsupported_fixture_scope` |
| `asqav-31-counterparty-scope-match/receipt.json#/payload/counterparty_binding` | `envelope_minus_anchors` |
| `asqav-32-counterparty-anchors-included/receipt.json#/payload/counterparty_binding` | `envelope_minus_anchors` |
| `asqav-33-counterparty-scope-absent/receipt.json#/payload/counterparty_binding` | `<absent>` |
| `asqav-34-counterparty-scope-unknown/receipt.json#/payload/counterparty_binding` | `unsupported_fixture_scope` |

### action_ref, every member

| member | value | SHA-256 of zero bytes | equals `sha256:` + payload_digest.hash | descriptor beside it |
|---|---|---|---|---|
| `vectors.json#/vectors/14/input/action_ref` | `sha256:e3b0c44298fc1c14…` | yes | yes | no |
| `vectors.json#/vectors/15/input/payload/action_ref` | `sha256:e3b0c44298fc1c14…` | yes | yes | no |
| `vectors.json#/vectors/16/input/action_ref` | `sha256:e3b0c44298fc1c14…` | yes | yes | no |
| `vectors.json#/vectors/17/input/action_ref` | `sha256:e3b0c44298fc1c14…` | yes | yes | no |
| `vectors.json#/vectors/18/input/action_ref` | `sha256:e3b0c44298fc1c14…` | yes | yes | no |
| `vectors.json#/vectors/19/input/action_ref` | `sha256:e3b0c44298fc1c14…` | yes | yes | no |
| `vectors.json#/vectors/20/input/action_ref` | `sha256:e3b0c44298fc1c14…` | yes | yes | no |
| `vectors.json#/vectors/27/input/payload/action_ref` | `sha256:e3b0c44298fc1c14…` | yes | yes | no |
| `vectors.json#/vectors/28/input/action_ref` | `sha256:e3b0c44298fc1c14…` | yes | yes | no |
| `vectors.json#/vectors/29/input/action_ref` | `sha256:e3b0c44298fc1c14…` | yes | yes | no |
| `vectors.json#/vectors/30/input/action_ref` | `sha256:e3b0c44298fc1c14…` | yes | yes | no |
| `vectors.json#/vectors/31/input/action_ref` | `sha256:e3b0c44298fc1c14…` | yes | yes | no |
| `asqav-01-genesis-permit/receipt.json#/payload/action_ref` | `sha256:9632ae3c8d6b7da7…` | no | yes | no |
| `asqav-02-genesis-deny/receipt.json#/payload/action_ref` | `sha256:ac22162b9420086a…` | no | yes | no |
| `asqav-03-chain-link/predecessor.json#/payload/action_ref` | `sha256:9632ae3c8d6b7da7…` | no | yes | no |
| `asqav-03-chain-link/receipt.json#/payload/action_ref` | `sha256:f5f246742ee00426…` | no | yes | no |
| `asqav-04-tamper-sig/receipt.json#/payload/action_ref` | `sha256:ac22162b9420086a…` | no | yes | no |
| `asqav-06-mldsa65-payload-prod/receipt.json#/payload/action_ref` | `sha256:1cb2e7953147a4fd…` | no | no | no |
| `asqav-07-revoked-key/receipt.json#/payload/action_ref` | `sha256:2e0238353b3c789c…` | no | yes | no |
| `asqav-08-v2-signer-canary/receipt.json#/payload/action_ref` | `sha256:878424356da5097e…` | no | yes | no |
| `asqav-09-v2-signer-tampered/receipt.json#/payload/action_ref` | `sha256:878424356da5097e…` | no | yes | no |
| `asqav-11-dup-member-toplevel/receipt.json#/payload/action_ref` | `sha256:ac22162b9420086a…` | no | yes | no |
| `asqav-12-time-edge-expiry/receipt.json#/payload/action_ref` | `sha256:abababababababab…` | no | no | no |
| `asqav-13-dup-member-nested/receipt.json#/payload/action_ref` | `sha256:e3b0c44298fc1c14…` | yes | no | no |
| `asqav-14-omitted-action-chain/predecessor.json#/payload/action_ref` | `sha256:4e03925e53f2d363…` | no | yes | no |
| `asqav-14-omitted-action-chain/receipt.json#/payload/action_ref` | `sha256:3336b75eac16232a…` | no | yes | no |
| `asqav-15-unsigned-gap/predecessor.json#/payload/action_ref` | `sha256:bc3aec7ced6c6a33…` | no | yes | no |
| `asqav-15-unsigned-gap/receipt.json#/payload/action_ref` | `sha256:99e35b1c67fa07c7…` | no | yes | no |
| `asqav-16-chain-emission-blocked/predecessor.json#/payload/action_ref` | `sha256:14e02333d8553741…` | no | yes | no |
| `asqav-16-chain-emission-blocked/receipt.json#/payload/action_ref` | `sha256:9381637c2c85b709…` | no | yes | no |
| `asqav-17-seq-contiguous/predecessor.json#/payload/action_ref` | `sha256:ede15dd0cbc7bf5d…` | no | yes | no |
| `asqav-17-seq-contiguous/receipt.json#/payload/action_ref` | `sha256:9efa87338718d311…` | no | yes | no |
| `asqav-18-seq-gap/predecessor.json#/payload/action_ref` | `sha256:5d94a072dbf2394c…` | no | yes | no |
| `asqav-18-seq-gap/receipt.json#/payload/action_ref` | `sha256:1f094f31573a4ceb…` | no | yes | no |
| `asqav-19-seq-non-monotonic/predecessor.json#/payload/action_ref` | `sha256:ae12fd9225c4c9fb…` | no | yes | no |
| `asqav-19-seq-non-monotonic/receipt.json#/payload/action_ref` | `sha256:e1cb6c6be80c2804…` | no | yes | no |
| `asqav-20-seq-absent/predecessor.json#/payload/action_ref` | `sha256:89a66376d6262665…` | no | yes | no |
| `asqav-20-seq-absent/receipt.json#/payload/action_ref` | `sha256:4dabb43c1a5b9051…` | no | yes | no |
| `asqav-21-key-thumbprint-binds/receipt.json#/payload/action_ref` | `sha256:1c3a403ecca7fa2a…` | no | yes | no |
| `asqav-22-key-substituted/receipt.json#/payload/action_ref` | `sha256:234cfcad2dc1fdbd…` | no | yes | no |
| `asqav-23-anchor-status-pending/receipt.json#/payload/action_ref` | `sha256:9632ae3c8d6b7da7…` | no | yes | no |
| `asqav-24-anchor-block-hash-prod/predecessor.json#/payload/action_ref` | `sha256:e72eda46d58c1a1a…` | no | yes | no |
| `asqav-24-anchor-block-hash-prod/receipt.json#/payload/action_ref` | `sha256:b15eeb40a51b1a0d…` | no | yes | no |
| `asqav-25-payload-digest-rederives/receipt.json#/payload/action_ref` | `sha256:86d65b5861dc7556…` | no | yes | no |
| `asqav-26-payload-digest-mismatch/receipt.json#/payload/action_ref` | `sha256:215ddd5567ca2590…` | no | yes | no |
| `asqav-27-anchors-absent/predecessor.json#/payload/action_ref` | `sha256:ede15dd0cbc7bf5d…` | no | yes | no |
| `asqav-27-anchors-absent/receipt.json#/payload/action_ref` | `sha256:9efa87338718d311…` | no | yes | no |
| `asqav-28-anchors-null-malformed/predecessor.json#/payload/action_ref` | `sha256:ede15dd0cbc7bf5d…` | no | yes | no |
| `asqav-28-anchors-null-malformed/receipt.json#/payload/action_ref` | `sha256:9efa87338718d311…` | no | yes | no |
| `asqav-31-counterparty-scope-match/originating_envelope.json#/payload/action_ref` | `sha256:eaa40a5ece963896…` | no | yes | no |
| `asqav-31-counterparty-scope-match/receipt.json#/payload/action_ref` | `sha256:6200a624fcf21e5d…` | no | yes | no |
| `asqav-32-counterparty-anchors-included/originating_envelope.json#/payload/action_ref` | `sha256:eaa40a5ece963896…` | no | yes | no |
| `asqav-32-counterparty-anchors-included/receipt.json#/payload/action_ref` | `sha256:6200a624fcf21e5d…` | no | yes | no |
| `asqav-33-counterparty-scope-absent/originating_envelope.json#/payload/action_ref` | `sha256:eaa40a5ece963896…` | no | yes | no |
| `asqav-33-counterparty-scope-absent/receipt.json#/payload/action_ref` | `sha256:6200a624fcf21e5d…` | no | yes | no |
| `asqav-34-counterparty-scope-unknown/originating_envelope.json#/payload/action_ref` | `sha256:eaa40a5ece963896…` | no | yes | no |
| `asqav-34-counterparty-scope-unknown/receipt.json#/payload/action_ref` | `sha256:6200a624fcf21e5d…` | no | yes | no |
| `asqav-35-invocation-ref-binds-pre-post/predecessor.json#/payload/action_ref` | `sha256:1a52218a9bbdd5b4…` | no | yes | no |
| `asqav-35-invocation-ref-binds-pre-post/receipt.json#/payload/action_ref` | `sha256:e0f46f1b79d3061c…` | no | yes | no |
| `asqav-36-invocation-ref-duplicate-emission/predecessor.json#/payload/action_ref` | `sha256:e2c5067b8ac02e49…` | no | yes | no |
| `asqav-36-invocation-ref-duplicate-emission/receipt.json#/payload/action_ref` | `sha256:ee546b7e9ac6449a…` | no | yes | no |

---

## The open items, against `-09` and the corpus it cites

### M5: the `envelope_hash` scope stated two ways. Resolved in the text.

M5 was a finding about the text of `-08`: §4 said the envelope minus anchors, §5.7 said the three-key
object. `-09` states one scope in both places. Section 4, lines 677-679:

> Anchor and counterparty commitments cover the core envelope with the anchors key removed, retaining
> the exact signature string.

Section 5.8.1, lines 1700-1712, defines `envelope_hash` over "A's signed envelope with the anchors
array excluded" and gives the digest input as "the UTF-8 JCS encoding of {"payload": A.payload,
"signature": A.signature}". Section 5.8.1 adds `scope` at lines 1781-1802: "REQUIRED string from this
revision onward. The only value defined by this profile is envelope_minus_anchors". **M5's text half is
resolved in `-09`.** The section is 5.8 in `-09`, not 5.7.

In the corpus `-09` cites, the scope member is present on 9 of 13 bindings with the one defined value
(N3 below), and every binding that declares it and was generated under it recomputes: 5 of 5 input
bindings, 8 of 8 `expected` renderings resolved to it and not deliberately negative, and the one
`asqav-31` receipt. The four that do not are the negative vectors in the walk section.

### M7: anchoring, restated under `-09`. Open, and its question has changed.

M7 measured the corpus against `-08` §5.4: "Compliance Receipts MUST be anchored" (`-08` line 1052) and
"Verifiers MUST reject Compliance Receipts that lack at least one valid anchor" (`-08` lines
1074-1075). At `05c1c49`, 8 of 16 `asqav-*` receipt vectors carried no anchor and expected `verified`.

`-09` has no such rule. Issuers SHOULD obtain timestamp evidence (lines 1414-1415). "The anchors array
MAY be absent or empty, both meaning that no anchor evidence was presented. A null value is malformed
under this revision" (lines 1449-1451). Whether absent evidence prevents full verification "depends on
the required axes of the selected profile and relying-party policy" (lines 1452-1462); "The
required-axis set comes from the selected profile and relying-party policy, not a test fixture or
producer's preferred declaration" (lines 4632-4634); "A report MUST NOT claim full verification when a
required axis is invalid, pending, unverifiable, unchecked or undeclared" (lines 4634-4636).

**The -08 measurement does not carry over**, because under `-09` absent and empty are conformant. The
`asqav-*` receipt vectors at `6137cb95`, by anchor shape and expected outcome (`python
tools/census-asqav-09.py`):

| `anchors` | expected `verified` | expected `unverified` | total |
|---|---|---|---|
| entries | 5 | 3 | 8 |
| empty array | 14 | 10 | 24 |
| absent | 1 | 0 | 1 |
| null | 0 | 1 | 1 |
| **total** | **20** | **14** | **34** |

The three classes `-08` counted as one are separate here. The one `null` vector,
`asqav-28-anchors-null-malformed`, expects `unverified` with `reason_code` `malformed_member`, which is
what lines 1450-1451 say of null. The one absent vector, `asqav-27-anchors-absent`, expects `verified`,
and its notes say "absent and an empty array are the two conformant spellings of no anchors, so the
outcome and every axis result must equal asqav-17's", which is what lines 1449-1450 say.

**The question `-09` leaves is which policy each expectation assumes.** 15 receipt vectors present no
anchor evidence (14 empty, 1 absent) and expect `verified`. Under lines 4634-4636 that expectation is
consistent with a selected policy in which the anchor axis is not required and inconsistent with one in
which it is. **None of the 34 `expected.json` files names a policy or a required-axis set**: their
members are `format`, `outcome`, `reason_code`, `notes`, and on 14 of them `failure_class`. No vector's
expected outcome is `unverified` for an anchor reason: the 14 `unverified` `reason_code`s are
`issuer_signature` (2), `duplicate_member` (2), `signature_skipped_no_dilithium`, `key_revoked`,
`seq_gap`, `seq_not_monotonic`, `key_substituted`, `payload_digest_mismatch`, `malformed_member`,
`counterparty_mismatch`, `counterparty_legacy_scope`, `counterparty_unrecognised_scope`.

Two vectors state an anchor-axis result in words and expect `verified` beside it:

- `asqav-23-anchor-status-pending`: "the oracle verdict stays verified; under the full verifier the
  anchors axis reports SKIPPED (unverifiable), never a PASS on presence."
- `asqav-24-anchor-block-hash-prod`: "the anchors axis SKIPs because completing it needs TSA key
  material and Bitcoin headers, which the corpus does not ship."

Read against lines 4634-4636, `verified` with an unverifiable anchor axis is full verification only
under a policy where that axis is not required. Neither vector says which policy it assumes.

**Verdict: M7 is open and narrowed.** As a statement about `-08` and the corpus at `05c1c49` it stands
unchanged. Against `-09` and `6137cb95`, the corpus's handling of null, absent and empty agrees with
lines 1449-1451 on the two vectors that test it, and the expectations are consistent with a policy that
does not require the anchor axis. What is not in the corpus is the name of that policy, which lines
4632-4634 make the source of the required-axis set.

### N1: `action_ref`. The fourteen declarations withdrawn; graded by rule; nothing to recompute from.

**The declarations.** On 8 September the fourteen `action_ref` fields at `asqav/22a970d` and
`asqav/a21d060` were declared opaque on the author's statement that "-09 points at the upstream
canonical Action representation" and that nobody holding only the receipt can rebuild the pre-image.
`-09` as posted does not point upstream: Section 5.2.7 (lines 1094-1130) defines the Action descriptor
itself, "exactly four members: agentId, actionType, scopeRequired and timestamp" (lines 1097-1099), with
scopeRequired sorted "by UTF-16 code-unit order" before canonicalisation (line 1103), and "action_ref =
"sha256:" || lowercase_hex(SHA-256(UTF8(JCS(A))))" (lines 1107-1108). What a third party lacks is the
retained descriptor: "Missing descriptor evidence makes this recomputation unverifiable" (lines
1113-1114). That is unverifiable evidence, not an unpublished construction.

The fourteen entries were therefore **withdrawn on 2026-09-25**, kept as bytes in a
`withdrawn_declarations` list on each corpus with `withdrawn_on`, `withdrawn_because` and
`withdrawn_by`. The walker matches them against no pointer and prints `withdrawn_declarations=7` for each
corpus on every run. The fourteen fields are back in the census at those two corpora (`unregistered`
31 to 38 at each, `registered` 60, `match` 59, `mismatch` 0, unchanged). The rule below is not applied
there: neither corpus carries an Action descriptor anywhere in its bytes.

**The rule.** `asqav.action_ref.descriptor` grades every `action_ref` of the form `sha256:<64 hex>` in a
walked file under lines 1096-1108. The descriptor is read from the corpus bytes, at a sibling member the
rule names (`action_descriptor`), and from nowhere else: lines 1111-1114 forbid substituting a later
timestamp, inferring scopeRequired, or guessing an empty array. `-09` names no wire member for the
retained descriptor, so that member name is this registry's. With no descriptor the row is
`input_absent`: counted, printed by pointer, never `match`, never failing the run. A value equal to
SHA-256 of zero bytes is never `match` under this rule, whatever descriptor sits beside it.

**At `6137cb95`: 61 `action_ref` members, 61 in the `sha256:` form, 61 `input_absent`, 0 `match`, 0
`mismatch`.** No member has a descriptor beside it (0 of 61). Of the 61:

- **13 are SHA-256 of zero bytes** (`sha256:e3b0c442…b855`): 12 in `conformance/vectors.json` and 1 in
  `asqav-13-dup-member-nested/receipt.json`. No four-member descriptor can produce that value; the
  smallest one, `{"actionType":"","agentId":"","scopeRequired":[],"timestamp":""}`, is 64 bytes of JSON.
  These are placeholders and cannot be instances of the Section 5.2.7 construction.
- **58 equal `"sha256:" +` the `payload_digest.hash` of the same payload.** Lines 1115-1116: "An opaque
  action ID, payload_digest.hash and action_ref have different constructions and MUST NOT be substituted
  for one another." Whether any of the 58 is also an instance of the Section 5.2.7 construction cannot
  be settled from these bytes, because no descriptor is present; the equality is recorded as a
  measurement. The 13 zero-bytes values are among the 58 wherever their payload's `payload_digest.hash`
  is also the zero-bytes digest.
- 34 distinct values across the 61.

`asqav-05-hash-mode-prod` and `asqav-10-hash-mode-multikey` carry no `action_ref` member: they are the
flat legacy transport (`payload` null, top-level `v`, `algorithm`, `signature_b64`), which lines 767-771
distinguish from the core envelope.

**Verdict.** The member is graded by rule from this corpus onward. Every value in the corpus `-09` cites
is `input_absent` under it: unverifiable, not failed, because the corpus supplies no descriptor.

### N2: the `v` census

Lines 759-765: `v` is REQUIRED, "its value under this document is 1", and an issuer "MUST emit v on
every Compliance Receipt". Lines 789-795: "A verifier MUST report an unsupported version as
unverifiable and MUST NOT guess its shape" and "The corpus's version-2 signer canary does not by itself
establish a released version-2 production contract." Lines 797-808: a receipt without `v` "MUST NOT"
be reported "as verified under this document".

Across the 34 `asqav-*` receipt vectors: **`v` absent on 0.** `v` = 1 in `payload` on 30; `v` = 1 at the
top level of the flat legacy transport on 2 (`asqav-05`, `asqav-10`); **`v` = 2 on 2**
(`asqav-08-v2-signer-canary`, expected `verified`; `asqav-09-v2-signer-tampered`, expected `unverified`
with `issuer_signature`). Across all 53 envelopes the walked files carry (the 34 receipts, 13
`predecessor.json`, 4 `originating_envelope.json`, and the two envelope vectors 15 and 27 of
`conformance/vectors.json`): `v` = 1 in `payload` on 49, at the top level on 2, `v` = 2 on 2, absent on
0.

`asqav-08` expects `verified` on a `v` = 2 receipt. Lines 789-795 read a version other than 1 as
unsupported, reported unverifiable, and say the canary "does not by itself establish" a version-2
contract. That is recorded as an observation about the vector's expectation against those lines.

The v list relayed on 11 September from `609c1b84` (FINDINGS-rerun-2026-09-08.md, lines 293-301) is
superseded by this count from the bytes.

### N3: the `scope` member and the signature `alg`

**`counterparty_binding.scope`, 13 bindings in the walked files:** `envelope_minus_anchors` on 9, absent
on 2 (`conformance/vectors.json` vector 30; `asqav-33-counterparty-scope-absent`),
`unsupported_fixture_scope` on 2 (vector 31; `asqav-34-counterparty-scope-unknown`). The four without the
defined value are reported `unverifiable_legacy_scope` (4 rows) and `unverifiable_undefined_scope` (4
rows) and are not recomputed, per lines 1785-1787, 1883-1886 and 1890-1892. The corpus's own
expectations for them are `legacy_scope` / `counterparty_legacy_scope` and `unrecognised_scope` /
`counterparty_unrecognised_scope`, each with `failure_class` `unverifiable`.

A control shows the regime is what produces those outcomes: with `scope_regime` removed from a
throwaway copy of the registry, vector 30's scope-less binding is resolved by the `-08` rules' peer
inference, finds two scopes among the vectors binding to its envelope, and is left `unregistered`, and
vector 31's undefined value is graded `mismatch`. `-09` reads neither that way.

**Signature `alg`, a census only; nothing is graded.** Lines 703-704: "New issuance under this revision MUST
use alg="ML-DSA-65""; lines 741-745: a separately selected historical format MAY accept Ed25519, and
"acceptance is reported as historical verification, not new-revision conformance". Across the 34
receipt vectors: `Ed25519` in `signature.alg` on 27, `ML-DSA-65` on 5, and on the two flat receipts
`algorithm` `ML-DSA-65` (`asqav-05`) and `Ed25519` (`asqav-10`). Across all 53 envelopes: `Ed25519` 43,
`ML-DSA-65` 8, flat `ML-DSA-65` 1, flat `Ed25519` 1. Of the 20 receipt vectors that expect `verified`,
16 are labelled Ed25519 (15 in `signature.alg`, 1 flat) and 4 `ML-DSA-65`. Under lines 741-745 an
Ed25519 acceptance is historical verification, not `-09` conformance; which of the two the 16 intend is
not stated in their `expected.json`.

### N4: five observations about `-09`'s own text

Each is quoted from the pinned bytes and stated as an observation about the text.

1. **Phrases that still speak of an anchoring requirement.** Section 5.5 now says issuers SHOULD obtain
   timestamp evidence (lines 1414-1415). Four passages elsewhere read as though a requirement remains:
   - lines 867-868: "Acceptance of a flat signature receipt does not establish this profile's chain and
     anchor requirements."
   - lines 2788-2789: "It never counts toward the anchoring requirement of Section 5.5 or toward a
     witness_policy quorum"
   - line 3773: "the anchor evidence required by Section 5.5"
   - line 6285: "not an anchor and MUST NOT count toward the anchoring requirement"

   Two of the four (2789, 6285) use the words "anchoring requirement"; 867-868 says "anchor
   requirements" and 3773 says "required by Section 5.5".
2. **Appendix A.1's `action_ref` is its `payload_digest.hash`.** Line 7244: `"action_ref":
   "sha256:b15eeb40a51b1a0d...a1908488",`; line 7261: `"hash": "b15eeb40a51b1a0d...a1908488",`. Both
   are abbreviated in the text, and the visible characters are the same. Lines 1115-1116 say the two
   "have different constructions and MUST NOT be substituted for one another."
3. **"Section 5.7" where Section 5.2.7 is meant.** Lines 5899-5900: "Values are action_ref digests per
   Section 5.7." In `-09` Section 5.7 is "Extension Fields" (line 1573); action_ref is Section 5.2.7
   (line 1094).
4. **A reference to a text that is not published.** Line 1496: "This reverses the prior -09 working
   text's declaration-only policy." The IETF archive holds one `-09`, the one pinned here.
5. **"documented original construction" with no document named.** Lines 1127-1128: "A historical action
   reference is evaluated under its documented original construction". The section does not say where
   the original construction is documented.

---

## What this rerun does not establish

- **It says nothing about the tip.** `main` was 32 commits past `6137cb95` when it was cloned, and 25
  files under `verifier/conformance-vectors/` differ there. This document describes the commit `-09`
  cites.
- **The verdicts are ours, over the author's bytes.** Every `match` above is this repository's
  two-serialiser recomputation agreeing with a value he published. It is not his verifier's verdict on
  his corpus.
- **No signature was verified.** The walker recomputes digests; it does not check Ed25519 or ML-DSA-65
  signatures, and the `alg` census is a count of labels.
- **`input_absent` is not `verified` and not `failed`.** 61 `action_ref` values are graded by a rule and
  recomputed by nothing, because the corpus carries no descriptor. Nothing here says any of them is
  wrong except the 13 zero-bytes values, which cannot be instances of the construction.
- **`unregistered` is not `verified`.** 236 digest-shaped members of this corpus are graded by nothing
  (`payload_digest`, `policy_digest`, key material, genesis `previousReceiptHash` and others no rule
  here covers).
- **The negative vectors' mismatches are agreement, not defects.** The 4 mismatches at `6137cb95` are on
  vectors whose own expectation is a mismatch.
- **The policy question under M7 is not answered by these bytes.** The expectations are consistent with
  a policy that does not require the anchor axis; no file in the corpus names one.
- **The manifest locks are agreement, not proof.** Both locks agreeing with our digests means the
  author's tooling and ours computed the same SHA-256 over the same files. It does not corroborate any
  vector's content.
- **Duplicate members.** `asqav-11` and `asqav-13` carry duplicated JSON members by design. The walker
  and the census read them with ordinary JSON parsers, which keep the last occurrence; neither reports
  on the duplicate itself.

**Appended 2026-09-25, after the adversarial read of the mail that carries this document (pushed at `71963fd`).** Seven corrections and additions, each from the pinned bytes and each cited to the line it corrects. Nothing above this block is edited.

1. **Pinned and not walked, completely.** Lines 122-125 list the two locks and the other formats' vectors. Also pinned, not walked, and not read for the sections above: the other thirteen files at the root of `verifier/conformance-vectors/`, `README.md`, `UPSTREAM.md`, `manifest.json`, `requirement-map.json` and the nine generators `gen_acta_upstream_vectors.py`, `gen_acta_vectors.py`, `gen_invocation_ref_vectors.py`, `gen_key_binding_vectors.py`, `gen_oracle_vectors.py`, `gen_payload_digest_vectors.py`, `gen_selective_omission_vectors.py`, `gen_seq_vectors.py`, `gen_v2_signer_vectors.py`. Items 2 to 4 below come from reading `requirement-map.json`, `ANCHOR-MATERIAL.md` and the generators.

2. **`asqav-24`'s anchor material and the corpus's own axis map.** Lines 486-494 read the notes of `asqav-23` and `asqav-24` and conclude that verified beside an unverifiable anchor axis is full verification only under a policy where that axis is not required. That holds for `asqav-23` and not for `asqav-24`. `asqav-24`'s directory ships `tsa_trust.pem`, `bitcoin_headers.json` and `ANCHOR-MATERIAL.md`, whose first sentence is "Two pieces of PUBLIC material let the offline verifier complete this vector's anchors axis", and `requirement-map.json` (`generated_by` `verifier/build_requirement_map.py`) records `asqav-24`'s anchors axis as `PASS` and `asqav-23`'s as `SKIPPED`, under a `how` string that says "A SKIPPED axis is not coverage, whatever a vector's notes claim." So `asqav-24`'s notes, "which the corpus does not ship", are contradicted by its own directory and by the map, and its expected `verified` does not rest on the anchor axis being optional. The count at lines 476-477 is unchanged: `asqav-24` carries anchor entries and is not among the 15 no-evidence receipts. The verdict at lines 496-500 stands with "two vectors" at line 486 read as one, `asqav-23`.

3. **What the generators say `action_ref` is.** Seven of the nine generators build the member as `"sha256:" + payload_digest.hash`, the f-string `f"sha256:{digest['hash']}"` in `gen_invocation_ref_vectors.py`, `gen_key_binding_vectors.py`, `gen_oracle_vectors.py`, `gen_payload_digest_vectors.py`, `gen_selective_omission_vectors.py`, `gen_seq_vectors.py` and `gen_v2_signer_vectors.py`, and six of the seven (all but `gen_payload_digest_vectors.py`) say so in a docstring: "action_ref is the one wire form (-09 §5.1.5): the prefixed rendering of payload_digest.hash", four of them adding "which proves the -10 §10.2 recomputation", and `gen_oracle_vectors.py` saying in the sentence before that "payload_digest proves the -10 §10.2 recomputation instead of passing on emptiness". `gen_oracle_vectors.py` also writes the zero-bytes digest as `action_ref` on one payload (line 146) and `"sha256:" + "ab" * 32` on `asqav-12`'s (line 404); `gen_acta_vectors.py` writes the zero-bytes constant (line 72) into `acta-*` vectors, which this document does not grade. `-09` as posted has no `5.1.5` and no `10.2` anywhere in its 7,840 lines; `action_ref` is Section 5.2.7 and the recomputation is Section 11.2 (lines 4569-4574). So the 58 equalities at lines 536-541 are by construction: the seven generators derive `action_ref` from `payload_digest.hash` and from nothing else, the substitution lines 1115-1116 forbid. The question left open at lines 538-540, whether any of the 58 is also an instance of the Section 5.2.7 construction, is answered for every value those seven generators produced: no descriptor enters their construction. Which of the 61 walked values each generator produced is not traced here.

4. **`asqav-33`'s digest scope.** Lines 1783-1785 read a binding with no scope member as computed under the three-key text of -04 through -08. Vector 30 (`counterparty_binding_legacy_scope_absent`) carries such a digest: its `envelope_hash` equals the three-key digest of vector 27's envelope. `asqav-33-counterparty-scope-absent`, the other scope-less binding in the walked files, carries a digest equal to the two-key digest (payload and signature) of its own `originating_envelope.json`, which holds two anchors; both recomputed with `tools/asqav_envelope_hash.py`'s JCS in this append. Both bindings are graded `unverifiable_legacy_scope` above, which lines 1785-1787 require regardless. The observation is that `asqav-33`'s digest is not a legacy digest, so a verifier taking the MAY at lines 1795-1799, recomputing against the retained snapshot under the legacy scope, finds no match on it.

5. **The date at line 571.** The v list was relayed from the author's correction of 5 September 2026 21:14Z (`FINDINGS-rerun-2026-09-08.md` lines 293-301); it was his mail of 11 September that said the list no longer describes the tree (recorded at line 449 of that file). "Relayed on 11 September" reads "relayed on 5 September, and superseded by the author's own note of 11 September".

6. **Lines 499-500 against lines 4632-4634.** The `-09` lines name two sources of the required-axis set, "the selected profile and relying-party policy"; lines 499-500 name one. "The name of that policy" reads "the name of that profile and policy".

7. **Lines 95-96.** "Says nothing about the tip" overstates: lines 74 and 94-96 state the tip's commit, its distance from `6137cb95` and which pinned files differ there. What holds is that nothing at the tip is graded here.

---

## Interests

Interests. The editor of this methodology authors draft-msebenzi-evidence-action, builds Chirindo, an operator-run gate that signs receipts of MCP calls, and maintains receipt-verify, the tool that produces the findings this methodology governs. Those occupy the same ground as the formats graded under it. Independence is not claimed. What is claimed is that every value in a finding recomputes from pinned bytes by anyone with the tool or without it, that every scope is cited to the document that names it, and that text and implementation are scored separately, a rule that came from the author of one of the formats graded. Where a judgment call was made, it is marked as one. This paragraph stands, in these words, at the end of every finding published under this methodology.
