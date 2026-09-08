# FINDINGS — rerun 2026-09-08 (`asqav-sdk@22a970d`)

A re-walk of the Asqav SDK conformance corpus at the commit the **first scheduled
drift run** named, and a re-reading of the three open `M` items that cite that
corpus against the new bytes.

This rerun ran on **Tuesday 8 September 2026, 09:12Z–09:2xZ**, dated by the clock
per R66. It is the second document in this series; the first is
`FINDINGS-rerun-2026-09-02.md`, whose method it follows.

`FINDINGS.md` is **not amended**. Its M-entries record what was observed against
the bytes they name, and remain accurate of those bytes. This document supersedes
them only as a statement about the corpus **at `22a970d`**, and says so at each
item.

---

## Why this rerun exists

The drift check added on 2026-09-05 was scheduled weekly, and its first run —
Monday 2026-09-07 06:00Z, on `dd21d5e` — went red exactly as designed:

```
MOVED_CHANGED  asqav-sdk/3b88156   main is 22a970d8fd5a0b20fdd1626226ba3c0a6fe0a5b1
                                   (pinned 3b88156497d42a360576ecd580dad95ef031926b);
                                   2 of 2 pinned paths differ at the tip
```

Every finding citing `3b88156` was, from that moment, describing a superseded
corpus. The rule the Lead set is that the note to the draft author follows the
re-walk and never precedes it — so the corpus is re-pinned and re-walked first,
and this document is what that produced.

---

## What was pinned, and what it digests to

Every digest below was computed during this rerun from the bytes named, with
`git cat-file blob` against a fresh clone's object store. None is carried over
from a handoff or from correspondence.

| field | value |
|---|---|
| repository | `https://github.com/jagmarques/asqav-sdk` |
| commit | `22a970d8fd5a0b20fdd1626226ba3c0a6fe0a5b1` |
| subject | `docs: specify standalone dependencies and trust inputs (#490)` |
| commit date | 2026-09-06T21:01:56+02:00 = **2026-09-06 19:01:56 UTC** |
| `origin/main` when resolved | `a21d0608b0ff949c583138f2987eba3b6c15749f`, 2026-09-08T09:14Z |

| file | blob at `22a970d` | bytes | sha256 |
|---|---|---|---|
| `conformance/vectors.json` | `9e0c093c83b3fff96a026093179adc09f8ffa96c` | 37923 | `7beebf7661c02b1e70045aa956ba49836c968edd9b24ecd4ebfb893cca7c6341` |
| `conformance/manifest.lock.json` | `2a61ab12e0f41589893d912bec5463c973da3971` | 13040 | `b9c0b2e5819ad8984951b9f3175b293c9cc7a64a8ccb999e76a6ecc273348c99` |

Both match the digests the scheduled finding named. `git hash-object` over each
copied file under `fixtures/asqav/22a970d/` reproduced the upstream blob id
exactly, so the pin is byte-identical and not a re-serialisation.

### `main` was already past this commit, and the pin did not chase it

`origin/main` was `a21d060` — nine commits and two days ahead — when the clone was
made. `22a970d` is pinned anyway, because it is the commit the finding names, and
a pin that follows the tip rather than the finding records a different fact from
the one that was observed.

The consequence is stated rather than hidden: **`npm run drift` reports
`asqav-sdk/22a970d` as `moved_changed`, 1 of 2 paths, and the run exits 1.** The
path that differs at `a21d060` is `conformance/manifest.lock.json` alone (blob
`4fe1d441`, `corpus_version` 7, changed `LICENSE`/`NOTICE`/`README.md` rows, from
`docs: preserve corpus license notices (#500)`). `conformance/vectors.json` — the
corpus data this rerun is about — is **the same blob `9e0c093c` at `a21d060` as at
`22a970d`**. The vectors this document grades are therefore the tip's vectors; only
the author's file-manifest bookkeeping has moved past the pin.

---

## What changed in the vectors, by vector

Header unchanged (`version` 2, `canonicalization` "RFC 8785 JCS", `hash_algorithm`
"SHA-256"). Vector count unchanged at **26**, same order.

**0 added. 0 removed. 6 changed.**

All six changes come from one upstream commit: `0b5fa1e`,
`fix(conformance): one action_ref wire form across both corpora (#484)`, 2026-09-05,
which rewrote `action_ref` from the bare id `act_01HVZA_ORIGINATOR_0001` to the
digest form `sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
`action_ref` sits inside A's signed payload, so that one edit cascades: the
originating envelope's bytes change, its digest changes from
`DaE/V0yvdRCKIGBaAMYV9jCMeETMiSd5Mw6HZWsx2Pk=` to
`dXqDdpt/tBY7ILMJMczYw6sx8vPmQCFXMR8W3ADW2e8=` (hex `0da13f57…d8f9` → `757a8376…d9ef`),
and each affected vector's own `canonical` and `sha256` move with it. The other
intervening commit, `e1daa48` (#485), did not touch this file.

---

## The rerun table — every vector, at both pins

The "verifier" for this corpus is the digest walker (`npm run walk`, registry
`walker/scopes.json`), which recomputes each registered member from the vector's
own bytes under a named scope and compares. It is the same instrument the
2026-09-02 rerun used for the `conformance/vectors.json` half of the corpus.

**Why not `npm run cli`.** The 2026-09-02 rerun ran the CLI over
`verifier/conformance-vectors/<case>/receipt.json` with `--registry`; this corpus
carries no receipts and no key set — its two files are `conformance/vectors.json`
and `conformance/manifest.lock.json`. Demonstrated rather than asserted:

```
$ npx tsx src/cli.ts fixtures/asqav/22a970d/conformance/vectors.json --json
{ "verdict": "UNVERIFIABLE", "reason": "format_unrecognized", "format": "unknown",
  "detail": "no adapter recognises the shape of ...vectors.json", "exit_code": 1 }
```

Counts below are graded members per vector: `m` = match, `u` = unregistered,
`x` = expected refusal. **No vector at either pin produced a mismatch.**

| # | vector | at `3b88156` | at `22a970d` | bytes changed |
|---|---|---|---|---|
| 0 | `minimal_read` | m=2 | m=2 | — |
| 1 | `tool_call_with_counterparty` | m=2 u=1 | m=2 u=1 | — |
| 2 | `traced_child_action` | m=2 | m=2 | — |
| 3 | `tampered_signature` | m=2 | m=2 | — |
| 4 | `swapped_public_key` | m=2 | m=2 | — |
| 5 | `stale_card` | m=2 | m=2 | — |
| 6 | `nonce_mismatch` | m=2 | m=2 | — |
| 7 | `card_version_downgrade` | m=2 | m=2 | — |
| 8 | `capture_topology_in_process_sdk` | m=2 | m=2 | — |
| 9 | `capture_topology_network_proxy` | m=2 | m=2 | — |
| 10 | `capture_topology_browser_extension` | m=2 | m=2 | — |
| 11 | `capture_topology_github_sha_pull` | m=2 | m=2 | — |
| 12 | `capture_topology_mcp_proxy` | m=2 | m=2 | — |
| 13 | `capture_topology_unknown_value_rejected` | m=2 | m=2 | — |
| 14 | `counterparty_binding_happy_path` | m=5 u=4 | m=5 **u=5** | `input.action_ref`, `input.counterparty_binding.envelope_hash`, `expected.*`, `canonical`, `sha256` |
| 15 | `counterparty_binding_envelope_byte_equality` | m=4 u=5 | m=4 **u=6** | `input.payload.action_ref`, `expected.*`, `canonical`, `sha256` |
| 16 | `counterparty_binding_base64url_tolerance` | m=5 u=4 | m=5 **u=5** | `input.action_ref`, `input.counterparty_binding.envelope_hash`, `expected.*`, `canonical`, `sha256` |
| 17 | `counterparty_binding_opaque_receipt_ref` | m=3 u=4 | m=3 **u=5** | `input.action_ref`, `input.counterparty_binding.envelope_hash`, `canonical`, `sha256` |
| 18 | `counterparty_binding_transport_label_non_trust` | m=3 u=4 | m=3 **u=5** | `input.action_ref`, `input.counterparty_binding.envelope_hash`, `canonical`, `sha256` |
| 19 | `counterparty_binding_missing_envelope_hash_rejected` | m=2 u=3 | m=2 **u=4** | `input.action_ref`, `canonical`, `sha256` |
| 20 | `receipt_v2_signer_canary` | m=2 u=6 | m=2 u=6 | — |
| 21 | `asqav-24-jcs-astral-key-order` | m=2 | m=2 | — |
| 22 | `asqav-24-jcs-astral-key-order-codepoint-rejected` | m=2 u=1 | m=2 u=1 | — |
| 23 | `asqav-25-number-above-safe-range-rejected` | no graded member (`input_text`, no `input`) | same | — |
| 24 | `asqav-25-number-above-safe-range-as-string` | m=2 | m=2 | — |
| 25 | `asqav-25-number-at-safe-range-boundary` | m=1 x=1 | m=1 x=1 | — |

Corpus totals, from `walker/report.json`:

| corpus | registered | match | mismatch | expected_refusal | unregistered |
|---|---|---|---|---|---|
| `asqav/3b88156` | 60 | 59 | 0 | 1 | 32 |
| `asqav/22a970d` | 60 | 59 | 0 | 1 | **38** |

**The corpus is internally consistent at `22a970d`.** Every recomputable member —
each vector's `canonical` under JCS, its `sha256` over that canonical string, and
every `envelope_hash` rendering under the scope that vector itself declares —
reproduces from the vector's own bytes. The six edited vectors changed *and stayed
correct*.

The graded scope for the `counterparty_binding_*` family is
`envelope_minus_anchors`, not the `-08` §5.7 three-key default: four of the six
carry an explicit `counterparty_binding.scope` member saying so
(`happy_path`, `base64url_tolerance`, `opaque_receipt_ref`,
`transport_label_non_trust`), `envelope_byte_equality` has no
`counterparty_binding` block at all and is resolved one hop from the vectors that
bind to it, and `missing_envelope_hash_rejected` carries a block with no `scope`
and no `envelope_hash` to grade. That distribution is **identical at `3b88156`**;
`0b5fa1e` changed the bytes the scope is applied to, not which scope applies.

### N1 (new). Six digest-shaped values are now `unregistered`, and `unregistered` does not fail a run

The `unregistered` count rose by exactly six, and the six are named:

```
+ /vectors/14/input/action_ref
+ /vectors/15/input/payload/action_ref
+ /vectors/16/input/action_ref
+ /vectors/17/input/action_ref
+ /vectors/18/input/action_ref
+ /vectors/19/input/action_ref
```

`action_ref` was an opaque id at `3b88156` and the walker did not see it as a
digest. At `22a970d` it is `sha256:<64 hex>`, so the walker now recognises a
digest-shaped value it has **no rule for**: no document in `refs/` states what
`action_ref`'s digest is taken over, so no scope can be registered from bytes
rather than guessed. `unregistered` is reported and does not fail the run, which
is correct — but it means six values that read as verified are not graded.
Registering them needs a source that defines the preimage; that is a question for
the draft author, not something to infer here.

**Appended 2026-09-08 — N1 answered by the author: `action_ref` declared opaque**

Asked on 8 Sep at 10:57Z whether the new `sha256:<64 hex>` form names a pre-image a
third party could rebuild, the author answered at **11:23:07Z (Gmail
`1a080c1f84f6d1a1`)**, verbatim:

> "On action_ref, record it as declared opaque. -09 points at the upstream canonical
> Action representation, and ACTA -03 computes that over agentId, actionType,
> scopeRequired and timestamp. A Compliance Receipt carries no scopeRequired, and a
> hash-mode receipt carries no action_type either, so nobody holding only the receipt
> can rebuild the pre-image. It works as a join key across engines during an audit,
> not as something a third party recomputes. The six values you hit are mid-rework,
> so leave them out of the grade rather than marking them unregistered until the
> corpus settles."

**Six, and the seventh.** N1 above names six because six is the *delta*: the
`unregistered` count rose by six at this pin. Enumerated over the corpus bytes rather
than over the delta, `conformance/vectors.json` carries **seven** `action_ref`
members, and it carries the same seven at both `asqav/22a970d` and `asqav/a21d060` —
the two files are byte-identical (blob `9e0c093c`). All seven were `unregistered`
before this change; none was graded by a rule, and none is nested inside a member some
rule grades.

| JSON pointer | vector | at `3b88156` | at `22a970d` / `a21d060` |
|---|---|---|---|
| `/vectors/14/input/action_ref` | `counterparty_binding_happy_path` | `act_01HVZA_ORIGINATOR_0001` | `sha256:e3b0c442…` |
| `/vectors/15/input/payload/action_ref` | `counterparty_binding_envelope_byte_equality` | `act_01HVZA_ORIGINATOR_0001` | `sha256:e3b0c442…` |
| `/vectors/16/input/action_ref` | `counterparty_binding_base64url_tolerance` | `act_01HVZA_ORIGINATOR_0001` | `sha256:e3b0c442…` |
| `/vectors/17/input/action_ref` | `counterparty_binding_opaque_receipt_ref` | `act_01HVZA_ORIGINATOR_0001` | `sha256:e3b0c442…` |
| `/vectors/18/input/action_ref` | `counterparty_binding_transport_label_non_trust` | `act_01HVZA_ORIGINATOR_0001` | `sha256:e3b0c442…` |
| `/vectors/19/input/action_ref` | `counterparty_binding_missing_envelope_hash_rejected` | `act_01HVZA_ORIGINATOR_0001` | `sha256:e3b0c442…` |
| **`/vectors/20/input/action_ref`** | `receipt_v2_signer_canary` | **`sha256:e3b0c442…` already** | `sha256:e3b0c442…` |

The first six are the ones upstream `0b5fa1e` (#484) rewrote, and they are the six the
author's "six values you hit" names. The seventh predates #484: `/vectors/20` carried
the `sha256:` form at `3b88156`, at `05c1c49` and at both `history/*` pins, so it never
entered the delta N1 measured and was `unregistered` for the whole of that time.

**How the walker treats them.** `walker/scopes.json` gains a corpus-level
`declared_opaque` list on `asqav/22a970d` and on `asqav/a21d060`: one entry per exact
JSON pointer, each carrying `declared_by`, `source` (the Gmail id and timestamp),
`quote` and `until`. A field whose pointer matches is reported with status
`declared_opaque` and the citation on its row, is **not** counted `unregistered`, and
is not graded. `unregistered` on each corpus falls 38 → 31; `declared_opaque` is 7;
`registered`, `match` and `mismatch` are unchanged at 60 / 59 / 0. The status is not
`unregistered` because the two are facts about different things: `unregistered` says
no rule in this registry covers the field, which is repaired by writing a rule, while
`declared_opaque` says the pre-image cannot be rebuilt from what the format publishes,
which no rule could repair. The walker refuses to run on an entry that cannot cite its
source, and a declaration matching no pointer is reported as a null-pointer row and
counted, so it cannot outlive the member it names.

**`until`:** *the corpus settles; revisit at the -09 re-pin.* All seven are recorded
against the same letter, but `/vectors/20` is filed as its own entry with a note
saying it is **not** one of the six he named — it rests on his first sentence and on
the reason he gives, both of which are about the field rather than about those six
vectors. If that reading is wrong, that entry is the one that is wrong and it can be
withdrawn without touching the six.

### Falsifiability of the walk itself

The rule `asqav.counterparty.envelope_hash.expected` carries an **explicit**
`applies_to` list, not a glob, so a new corpus that is not named in it is graded
on fewer members and still prints green. The control was run:

| `walker/scopes.json` | registered | match | mismatch |
|---|---|---|---|
| with `asqav/22a970d` in `applies_to` (committed) | 60 | 59 | 0 |
| without it (control, `--scopes` copy in scratch) | **54** | **53** | 0 |

Six fewer members graded, zero mismatches, green either way. That is the input
which would have turned this walk red had the registration been forgotten, and it
is why the registration is asserted here rather than assumed.

---

## The three open `M` items

### M5 — `-08` states the `envelope_hash` scope two ways

> "**Status: acknowledged by the author, 2026-09-02 13:07:20Z.** §4 carries the
> intent; §5.7 is the stray; `-09` corrects §5.7 and adds an explicit `scope`
> member to `counterparty_binding`, and re-pins the vector."

**Unaffected, and the new bytes add nothing either way.** M5 is a finding about
the *text* of `draft-marques-asqav-compliance-receipts-08`, not about the corpus.
No corpus commit can resolve a contradiction between two sections of a draft.

The `-09` mechanism the author described — an explicit `counterparty_binding.scope`
member carrying `envelope_minus_anchors` — is present in these vectors, on four of
the six, and the walker grades them under it. But that was **already true at
`3b88156`**: the member arrived upstream in `#452` on 2026-09-02, before either
pin. The `22a970d` re-pin therefore moves M5 not at all. Its status is still what
`FINDINGS.md` records: acknowledged by the author on 2026-09-02, to be fixed in the
text by `-09`, which does not exist as bytes.

### M6 — the published `counterparty_binding.envelope_hash` matches neither scope, and one vector contradicts itself

> "`counterparty_binding_envelope_byte_equality` carries two derived values for the
> same bytes, and its own `description` says one is the base64 of the other."

**Closed at this corpus, and it was already closed at `3b88156`.** The stale
literal is gone and the derived values agree:

| corpus | `grep -c DWyIoW6W conformance/vectors.json` | walker mismatches |
|---|---|---|
| `fixtures/asqav/05c1c49` | 13 | 10 |
| `fixtures/asqav/history/ee8a3e7` | (the finding's own commit) | 10 |
| `fixtures/asqav/3b88156` | **0** | **0** |
| `fixtures/asqav/22a970d` | **0** | **0** |

At `22a970d` the only `envelope_hash` literals present are
`dXqDdpt/tBY7ILMJMczYw6sx8vPmQCFXMR8W3ADW2e8=` (×6), its base64url form (×3) and
the hex `757a83769b7fb4163b20b30931ccd8c3ab31f2f3e6402157311f16dc00d6d9ef` (×1) —
all of which recompute from the vector's own envelope under the graded scope. The
`3b88156` and `22a970d` re-pins do **not** retract M6: it stands as a statement
about `05c1c49` and `ee8a3e7`, whose fixtures are kept precisely so the walker
stays red there.

### M7 — eight of sixteen `asqav-*` vectors carry no anchor and expect `verified`, against §5.4's own MUST

> "`-08` §5.4, lines 1052 and 1074–1075: *Compliance Receipts MUST be anchored.*
> *Verifiers MUST reject Compliance Receipts that lack at least one valid anchor.*"

**Not addressable from this corpus, and not closed.** M7 is measured over
`verifier/conformance-vectors/<case>/{receipt,expected}.json`. Neither the
`3b88156` pin nor the `22a970d` pin contains that directory — both pin
`conformance/` only. `find fixtures/asqav/22a970d -name verifier` returns nothing:
absent, not excluded.

Stated separately, and clearly labelled: read from the **clone's object store**, not
from bytes this repository holds, `verifier/conformance-vectors/` still exists
upstream at `22a970d` and M7's shape is not merely intact but wider.

| | at `05c1c49` (as M7 measured) | at `22a970d` (clone, unpinned) |
|---|---|---|
| `asqav-*` receipt vectors | 16 | 28 |
| no anchor (`[]`, `null` or absent) **and** `expected.outcome == "verified"` | **8** | **13** |

The eight M7 named are all still present and still in that state
(`asqav-01-genesis-permit`, `-02-genesis-deny`, `-03-chain-link`,
`-08-v2-signer-canary`, `-10-hash-mode-multikey`, `-14-omitted-action-chain`,
`-15-unsigned-gap`, `-16-chain-emission-blocked`), joined by five more
(`-17-seq-contiguous`, `-20-seq-absent`, `-21-key-thumbprint-binds`,
`-25-payload-digest-rederives`, `-27-anchors-absent`). This is an **observation
against a clone**, not a finding this repository can cite: nothing here pins those
bytes, and a note to the author would have to pin them first.

**Appended 2026-09-08 — M7: the author's answer of 11:23:07Z (Gmail `1a080c1f84f6d1a1`)**

In the same letter that answered N1, and quoted verbatim:

> "On the unanchored count, -09 answers it. 10.5 makes the anchor check part of the
> verified verdict, so a receipt with no anchor is unverified, and 5.4 has a verifier
> report anchoring as its own axis instead of dropping the signature, chain and key
> results it can still establish. The corpus expectations move to match. That one is
> mine and it is part of why the vectors are still moving."

So M7 is not a defect he disputes and not one he has closed: it is an item he owns, to
be answered by `-09` §10.5 and §5.4 and by corpus expectations that have not yet moved.
**M7 stays open in this record** until two things exist that this repository can read:
the `-09` text, and a re-pinned corpus whose expectations carry the change. Neither is
in the tree today, so nothing here is re-measured on the strength of the letter — an
answer about what a draft will say is not bytes, and this document grades bytes.

The **28 / 13 clone observation above stands exactly as it was written**: an observation
against a clone's object store, not a finding this repository can cite, because nothing
here pins those bytes. It is neither strengthened nor retired by his answer.

---

## What this rerun does not establish

- **It says nothing about tomorrow.** `main` was already nine commits past the pin
  when the pin was made. A corpus that reproduces today is a statement about one
  commit on one day; that is why the drift job moves to daily in the same session
  as this document.
- **The verdicts are ours, over Joao's bytes.** Every `match` above is this
  repository's two-serialiser recomputation agreeing with a value he published. It
  is not his verifier's verdict on his corpus, and he has not been shown this
  document.
- **`unregistered` is not `verified`.** 38 members of this corpus are graded by
  nothing, six of them newly so (N1). A corpus with more unregistered members and
  no mismatches looks greener than one with fewer, which is the direction of error
  this table is laid out to make visible.
- **M7 is not measured here at all**, and the upstream numbers above rest on bytes
  no pin in this repository holds.
- **The manifest lock is agreement, not proof.** `manifest.lock.json` agreeing with
  our digest of `vectors.json` means the author's tooling and ours computed the
  same SHA-256 over the same file. It does not corroborate any vector's content.
