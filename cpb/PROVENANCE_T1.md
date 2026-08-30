# T1 — PINNED INPUTS
## CPB independent implementation (TypeScript), draft-mih-sokolov-scitt-payload-binding-02

Written 2026-08-30. Task T1 of `CC_HANDOFF_2026-08-30_cpb-independent-impl.md` as modified by
addendum items A1 and A2. **No implementation code was written this cycle** (A4: T1 stops for
ratification).

Every negative in this file names the scope it was drawn from (canon R34). Provenance tags:
`[verified]` = recomputed this session from the bytes named; `[relayed]` = someone else's figure,
named.

---

## 1. THE DRAFT TEXT

| field | value |
|---|---|
| local path | `refs/draft-mih-sokolov-scitt-payload-binding-02.txt` |
| source URL | `https://www.ietf.org/archive/id/draft-mih-sokolov-scitt-payload-binding-02.txt` |
| HTTP status | `200` `[verified]` |
| fetch time (UTC) | 2026-08-30T18:04:35Z (server `Date` header) |
| server `last-modified` | Thu, 27 Aug 2026 22:37:53 GMT |
| server `etag` | `"6a90bc41-1690c"` |
| `Content-Length` | 92428 |
| **sha256** | **`47ab675797d7edfe905c13b8482735239d9c5ceb318accbc33e4a5a51e5ec875`** `[verified]` |
| **byte length** | **92428** `[verified]` |
| line count | 2072 |
| line terminators | LF only — 0 of 2072 lines carry CR `[verified]` |

Document masthead, read from those bytes (lines 1-9): authors S. Mih (Action State Group, Inc.) and
A. Sokolov (Tyche Institute); Intended status: Standards Track; dated **24 August 2026**; expires
25 February 2027; title "Canonical Payload Binding: A Signed Statement Construction Profile".

### 1a. Byte-parity control against their repository copy `[verified]`

The committed blob `HEAD:spec/draft-mih-sokolov-scitt-payload-binding-02.txt` in their repository at
commit `e0ad1c7` hashes to **`47ab6757...5ec875`, 92428 bytes — identical to the IETF-published copy
above.** The draft text this implementation will be written from is the same bytes their repository
carries.

The file as it lands in our *working tree* after clone is 94500 bytes / sha256 `b44d487d...89d707e`,
because the clone has `core.autocrlf=true` locally and their repository carries no `.gitattributes`
(searched: repository root at `e0ad1c7`). The 2072-byte delta equals the line count exactly, and
stripping CR reproduces `47ab6757...5ec875` byte-for-byte. That difference is a checkout artefact of
this machine, not a difference in their content (canon R45b).

---

## 2. THEIR REPOSITORY, PINNED

| field | value |
|---|---|
| URL | `https://github.com/action-state-group/scitt-payload-binding.git` |
| clone destination | scratchpad, **outside** `receipt-verify` (path in §6) |
| clone start (UTC) | 2026-08-30T18:05:35Z |
| clone end (UTC) | 2026-08-30T18:05:38Z |
| branch | `main` |
| **commit** | **`e0ad1c7e0b0248b9aed25c747f174548cb8e141d`** |
| `git log -1 --oneline` | `e0ad1c7 Merge pull request #67 from imran-siddique/register-trace-trust-record` |
| author | Anton Sokolov &lt;dev@tyche.institute&gt; |
| author/commit date | 2026-08-27T09:50:23+03:00 |
| commits on `main` | 175 |
| tags | 0 tags exist in the cloned repository (`git tag`, full tag namespace, at `e0ad1c7`) |

Top-level entries at `e0ad1c7`: `.github/`, `.gitignore`, `docs/`, `lib/`, `Makefile`, `README.md`,
`registry.json`, `REGISTRY.md`, `RELEASING.md`, `spec/`, `vectors/`.

`lib/` was **not entered, listed, opened or grepped** — absolute constraint of the handoff.

---

## 3. VECTOR INVENTORY — what the repository ACTUALLY contains at `e0ad1c7`

Enumerated exhaustively with `find` over `vectors/`: **82 files, 20 directories.**
Extension census over those 82 files: **77 `.json`, 3 `.md`, 2 `.py`.**

| directory | files | contents |
|---|---:|---|
| `vectors/` (root) | 4 | `CANONICALIZATION_DECLARATION.md`, `README.md`, `generate.py`, `harness.py` |
| `vectors/cpb-check/conforming/` | 3 | `01-basic`, `02-nested-objects`, `03-integer-zero` |
| `vectors/cpb-check/non-conforming/` | 10 | `01-null-member` ... `10-duplicate-key-nested` |
| `vectors/domain-transforms/pass/` | 1 | `01-stream-reassembly` |
| `vectors/domain-transforms/fail/` | 1 | `01-stream-incomplete` |
| `vectors/jcs-n/kats/` | **38** | `01-basic` ... `38-escaping-control-chars` |
| `vectors/jcs-n/derived-id/` | 3 | `01-basic-derived-id`, `02-carried-id-mismatch`, `03-sd-encoded-form` |
| `vectors/jcs-n/assembled-preimage/` | 2 | `01-member-mapping-undeclared`, `02-member-mapping-declared` |
| `vectors/multimodal/pass/` | 1 | `01-base64-binary-field` |
| `vectors/profile-independence/pass/` | 1 | `01-conforming-typed-ref` |
| `vectors/profile-independence/fail/` | 1 | `01-cross-profile-field-access` |
| `vectors/registry/` | 4 | `snapshot-v0`, `snapshot-v1`, `lookup-unknown-id`, `lookup-id-unknown-to-snapshot` |
| `vectors/subject-binding-diff/` | **5** | `diff-01-null-member`, `diff-02-empty-object-member`, `diff-03-empty-array-member`, `diff-04-float-member`, `README.md` |
| `vectors/typed-refs/pass/` | 2 | `01-matching-digest`, `02-arp-conformance-baseline` |
| `vectors/typed-refs/fail/` | 6 | `01-digest-context-mismatch` ... `06-arp-digest-alg-inconsistent-with-registered-context` |

`generate.py` and `harness.py` are Python source of theirs and were **not opened** — their names come
from a directory listing only.

### 3a. File format

Each vector is a single JSON object. Two shapes are present in the two sets that matter here.

**`vectors/jcs-n/kats/*.json`** — keys observed in `01-basic.json`: `id`, `description`,
`algorithm`, `spec_ref`, `input`, `exclusion_set`, `normalized`, `pre_image`, `pre_image_bytes_hex`,
`digest`. Its `algorithm` is `"jcs-n"` and its `spec_ref` is
`"draft-mih-sokolov-scitt-payload-binding-00 §3.1"`.

**`vectors/subject-binding-diff/diff-*.json`** — keys observed in `diff-01-null-member.json`: `id`,
`diverge`, `description`, `stakes_ref`, `action`, and **two sibling result objects, `jcs` and
`jcs_n`**, each carrying `algorithm`, `spec_ref`, `pre_image`, `pre_image_bytes_hex`, `digest`. The
expected values for the **live** `jcs` construction are inside the `jcs` object.

### 3b. Where `jcs` expected values live — exhaustive search `[verified]`

Searched: **all 77 `.json` files under `vectors/` at `e0ad1c7`.**

- **No file under `vectors/` declares a top-level `"algorithm"` member with the value `"jcs"`.**
  Of the 77, **46** declare a top-level `"algorithm"` member and the value is `"jcs-n"` in all 46
  (one distinct value across the set); the other **31** declare no top-level `"algorithm"` member
  at all.
- The quoted token `"jcs"` occurs in exactly **4** of the 77 files — the four
  `vectors/subject-binding-diff/diff-*.json` — and in each it is the key of the nested `jcs` result
  object, never a top-level algorithm declaration.

So the live `jcs` construction's externally-authored expected digests exist in this repository in
**four vectors**, all under `vectors/subject-binding-diff/`. That is a statement about what is on
disk at `e0ad1c7`, not a defect claim.

### 3c. Provenance of the two sets

- `vectors/subject-binding-diff/` last touched by `f763feb` (2026-08-19T22:10:14+02:00, tyche-dev,
  "registry(jcs): legal status spelling, section-precise citations").
- `vectors/jcs-n/` last touched by `3048ca6` (2026-08-19T23:37:39+02:00, tyche-dev,
  "Merge main into cpb-assembled-preimage-member-mapping; re-letter to Category K").

### 3d. NOT READ this cycle — declared, not inferred

`vectors/README.md`, `vectors/subject-binding-diff/README.md` and
`vectors/CANONICALIZATION_DECLARATION.md` were **not opened**. They are `.md` prose about the vector
suite, and the handoff's allow-list is "the -02 draft text, and their KAT input/expected files" —
whether those three fall inside it is a Lead call, raised at ratification. The draft's own §2
describes `vectors/CANONICALIZATION_DECLARATION.md` as versioning **jcs-n's** construction — the
withdrawn one — so nothing in it is needed to target the live `jcs`.

---

## 4. A1 — THE README SIGNPOST AND PR #72

### 4a. What `main`'s README says at clone time `[verified]`

`README.md` at `e0ad1c7`: 4862 bytes, sha256
`596bada4465de96892cb8b86b992c8aa7a173c59b1c5bf016bc540d4d7c4963a`, last modified by commit
`396b73f` (2026-08-18T11:30:50-07:00). Searched: every line of `README.md` naming a path under
`vectors/` — there is exactly **one**, line 64. Verbatim, lines 63-65:

> The reference library is in `lib/cpb/`.  Conformance vectors live in
> `vectors/` — `jcs-n/kats/` for the canonicalization algorithm and
> `cpb-check/` for the grammar checker.

**Yes — `main`'s README still carries the OLD signpost.** An implementer reading `main` on
2026-08-30 is sent to `jcs-n/kats/`, the historical suite for the withdrawn construction, and is not
pointed at `vectors/subject-binding-diff/` at all. **We worked from that README.**

### 4b. PR #72, pinned `[verified]`

Read from the GitHub REST API at pin time **2026-08-30T18:08:12Z**:

| field | value |
|---|---|
| title | `docs: point README to live jcs vectors` |
| state | **`open`** — `merged: false`, `merged_at: null`, `draft: false` |
| created / updated (UTC) | 2026-08-30T15:15:55Z / 2026-08-30T15:16:44Z |
| head branch | `codex/readme-live-jcs-vectors` |
| **head sha** | **`d8de21cef268c3c9137e9e19789ae848aa72c38a`** |
| base | `main` @ `e0ad1c7e0b0248b9aed25c747f174548cb8e141d` |
| author | `tyche-dev` |
| requested reviewers | `StevenMih` |
| mergeable state | `clean` |
| changed files | **1** — `README.md`, +6 / -4 |

The head sha matches the addendum's `d8de21c` and the branch name matches. Its base sha is exactly
our clone commit, so `main` has not moved since the PR was opened. The PR's diff was **not fetched**
— only the file-list metadata above — so this file makes no claim about the replacement wording.

---

## 5. A2 — SECTION NUMBERS, VERIFIED AGAINST THE -02 BYTES

Read from `refs/draft-mih-sokolov-scitt-payload-binding-02.txt` (sha256 `47ab6757...5ec875`), both
from the Table of Contents and from the section headings in the body. **All three assumed numbers
hold.** Verbatim titles:

| § | verbatim title | TOC | body heading | subject confirmed by reading the section |
|---|---|---|---|---|
| **4.1** | `Algorithm jcs` | p. 11 | line 565 | Yes — the canonicalization construction. Pre-image is RFC 8785 JCS applied directly with no normalization pass; SHA-256 over those octets; lowercase hex. |
| **5** | `The Derived Identifier` | p. 14 | line 733 | Yes — `id = CANONICAL-DIGEST(A, payload minus exclusion_set)`. |
| **5.1** | `Representation` | p. 14 | line 767 | Yes — 5.1 exists and is titled `Representation`. |
| **7.1** | `Leaf Construction` | p. 16 | line 859 | Yes — statement-to-receipt leaf construction, under §7 `Statement-to-Receipt Binding` (line 830). |

Scope of that check: every heading in the body matching `^N.` or `^N.M.` or `^Appendix` — **16
top-level numbered sections, 18 numbered subsections, 3 appendix headings** — matched one-for-one
against the corresponding TOC entries, all 34 numbered ones agreeing on both number and title.
(Appendix *sub*sections, C.1 through C.2, were not in that enumeration; they are below §16 and
cannot move 4.1, 5 or 7.1.) **No renumbering affecting 4.1, 5, 5.1 or 7.1** — the TOC and the body
agree on every one of those four.

Corroborating the *reason* the addendum was worried, from the draft's own §2 `Changes from -01`
(line 243, primary source — not the mail body, canon A3/R37): the charter rescope removed the
Artifact Type Registry's normative definition and its appendix walkthrough from the document. The
renumbering that produced landed **below** §7 — the draft's §2 cites the Canonicalization Algorithm
Registry as **Section 14.1**, while their `README.md` (line 69, at `e0ad1c7`) still says the two
registries are in "§11 (IANA Considerations) of the draft". That is a second place `main`'s README
lags the filed -02; stated as an observation of those two files, not as a defect claim.

**A2's stopping condition is NOT triggered. The three section numbers the founder named in public
are the correct three in -02.**

---

## 6. PLATFORM AND RUNTIME (Iman's constraint)

| field | value |
|---|---|
| OS | Microsoft Windows 11, Version 10.0.26200.9278 |
| arch | x86_64 / AMD64 |
| shell used | Git Bash — `MINGW64_NT-10.0-26200 3.6.6-1cdd4371.x86_64 Msys` |
| Node | **v24.13.0** (`win32 x64`, V8 13.6.233.17-node.37, OpenSSL 3.5.4) |
| npm | 11.9.0 |
| git | 2.53.0.windows.1 |
| Python — `python` | **3.13.2** (this is what `pip` binds to: `pip 26.1 ... (python 3.13)`) |
| Python — `python3` | **3.12.10** — a *different* interpreter on the same PATH |
| clone location | `%LOCALAPPDATA%\Temp\claude\C--Users-User-receipt-verify\42b5e9de-41f6-4168-81aa-a50efb03366b\scratchpad\cpb-clone\scitt-payload-binding` |

`python` and `python3` resolve to different minor versions on this machine. T4 (`pip install ./lib`
then `cpb-check --self-test`) must name which interpreter it used; the two are not interchangeable
for a version record.

---

## 7. THE CANONICALIZATION PATH WE WILL REUSE (pinned, not yet used)

| field | value |
|---|---|
| package | `@headlessoracle/chirindo` |
| version required by `package.json` | `0.4.0` (exact pin, line 32) |
| version installed in `node_modules` | `0.4.0` `[verified]` |
| module | `dist/vendor/recorder/index.js` |
| export | `jcsBytes` — resolves, `typeof === "function"` `[verified]` |

**Positive control on the instrument (canon R35), one vector only.** `jcsBytes({b:"x",a:"y"})`
returns `{"a":"y","b":"x"}` and SHA-256 of those octets is
`7951deff61d4304af5863a13c2ef570ffc96f1d8df5fb3214743dc9953b8aeea`, which equals the `digest` field
of `vectors/jcs-n/kats/01-basic.json` exactly. That is an externally-authored anchor, so the path can
in principle reproduce their bytes.

What this control does NOT establish: it is **one** vector of 82; it exercises key sorting only —
no null member, no empty array or object, no float, no control character, no NFC boundary, no
exclusion set; and `01-basic.json` is a **jcs-n** vector that happens to contain nothing the
normalization pass would have removed, so it does not discriminate `jcs` from `jcs-n` at all. It is
not a conformance result and is not part of T3.

---

## 8. FLAGGED, NOT FIXED — in `receipt-verify`, outside T1's scope

`.gitattributes` line 6 sets `fixtures/** -text` and line 7 `refs/** -text`, with the stated intent
that pinned evidence bytes are "never normalized". Line 10, `* text=auto eol=lf`, matches later and
therefore wins: `git check-attr -a` reports `text: auto, eol: lf` for
`refs/draft-mih-sokolov-scitt-payload-binding-02.txt`, for the pre-existing
`refs/draft-farley-acta-signed-receipts-02.txt`, and for `fixtures/acta`. Checked: those three paths.

The `-text` protection those two lines were written to provide is not in effect for them. It causes
no corruption for the -02 draft, whose content is already LF and whose resolved `eol` is `lf`.
Flagged per scope discipline; **not changed this cycle.**
