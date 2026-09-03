# PINNED INPUTS

## An independent TypeScript implementation of draft-mih-sokolov-scitt-payload-binding-02, sections 4.1, 5 (with 5.1) and 7.1

Issued 2026-09-03. This document and the four beside it replace the four sent on 2026-08-30. The
corrections they carry were sent to Anton Sokolov and Steven Mih in writing on 2026-08-31, and every
figure below is re-derived from bytes rather than carried over.

**Every digest in this package is a git blob digest, not a working-tree digest.** The 30 August set
published digests computed over a checkout on Windows carrying CRLF line endings. A clone on Linux or
macOS produces LF and different values, so those digests were correct for the bytes on one machine and
useless for checking, which is the only thing a pin is for. The content-addressed form is used
throughout and is reproducible by anyone holding the repository with no reference to ours:

```
git cat-file blob e0ad1c7:vectors/subject-binding-diff/diff-01-null-member.json | sha256sum
```

Provenance tags: `[verified]` = recomputed in this run from the bytes named; `[relayed]` = a figure
from another party, named as theirs.

---

## 1. THE DRAFT TEXT

| field | value |
|---|---|
| local path | `refs/draft-mih-sokolov-scitt-payload-binding-02.txt` |
| source URL | `https://www.ietf.org/archive/id/draft-mih-sokolov-scitt-payload-binding-02.txt` |
| fetch time (UTC) | 2026-08-30T18:04:35Z (server `Date` header) |
| server `last-modified` | Thu, 27 Aug 2026 22:37:53 GMT |
| **sha256** | **`47ab675797d7edfe905c13b8482735239d9c5ceb318accbc33e4a5a51e5ec875`** `[verified]` |
| **byte length** | **92428** `[verified]` |
| line count | **2072** `[verified]` |
| line terminators | LF only — 0 of 2072 lines carry CR `[verified]` |

Masthead, read from those bytes (lines 1-9): authors S. Mih (Action State Group, Inc.) and A. Sokolov
(Tyche Institute); Intended status: Standards Track; dated 24 August 2026; expires 25 February 2027;
title "Canonical Payload Binding: A Signed Statement Construction Profile".

**Byte-parity with your repository copy** `[verified]`. The committed blob
`e0ad1c7:spec/draft-mih-sokolov-scitt-payload-binding-02.txt` hashes to the same
`47ab6757…5ec875`, 92428 bytes, as the IETF-published copy. The implementation was written from those
bytes.

---

## 2. YOUR REPOSITORY, PINNED

| field | value |
|---|---|
| URL | `https://github.com/action-state-group/scitt-payload-binding.git` |
| **commit** | **`e0ad1c7e0b0248b9aed25c747f174548cb8e141d`** |
| commit subject | `Merge pull request #67 from imran-siddique/register-trace-trust-record` |
| author | Anton Sokolov &lt;dev@tyche.institute&gt; |
| author/commit date | 2026-08-27T09:50:23+03:00 |
| **tree object of `vectors/`** | **`4f2aec252028990a6ec59c0edfcd0f3b18cc4b40`** |

### 2a. The tree object is the operative pin

The commit is the human anchor; **the tree is what pins the bytes**. A commit can be reached by more
than one history and its identity depends on parentage and metadata that have nothing to do with the
vectors. `4f2aec25…` names the exact content of `vectors/` and nothing else, so if that tree object is
unchanged then every vector file is unchanged, whatever happened to the branch:

```
git rev-parse e0ad1c7:vectors
```

### 2b. The 82 blob ids

`vectors-tree-e0ad1c7.txt`, beside this document, is the verbatim output of

```
git ls-tree -r e0ad1c7e0b0248b9aed25c747f174548cb8e141d vectors/
```

**82 entries: 77 `.json` vectors, 3 `.md`, 2 `.py`.** Every entry is a regular blob (`100644`); there
are no symlinks and no submodules. The 77 JSON files are the vector corpus; the per-file digests cited
anywhere in this package are blob ids from that listing, and the listing is the way to check them
without recomputing anything.

### 2c. The five digests the 31 August letter gave, reproduced here `[verified]`

| path | bytes | sha256 of the blob at `e0ad1c7` |
|---|---:|---|
| `vectors/subject-binding-diff/diff-01-null-member.json` | 1738 | `9ee197c5f25cf634f8930c5e30f1a8e8d2cd9b2a93cac3917bdb1fe93e24898c` |
| `vectors/subject-binding-diff/diff-02-empty-object-member.json` | 1873 | `55a4b4e1260c0689cb918b71879c5c4db2e727b96f589d848b8119f96e6772d4` |
| `vectors/subject-binding-diff/diff-03-empty-array-member.json` | 1877 | `c845c2dbef8787e07fe106d7990c4929e453743fe237b069ddf2142c3ef453ba` |
| `vectors/subject-binding-diff/diff-04-float-member.json` | 2203 | `c660f2da9e4200155c7d772990682280a7143be3d5ac8dd0ea203546785a1a7e` |
| `README.md` | 4759 | `1814b45b61f63b7c685218ae9c91e47ae4c02cb51a395e0a9ef0b69494bd068a` |

The README row is the one the 30 August package got wrong: it published 4862 bytes and sha256
`596bada4…`, which are the working-tree values. The 103-byte difference is exactly the line count.

### 2d. The `sha256sum -b` note

Where these digests are checked with `sha256sum` against files on disk rather than against blobs,
**`sha256sum -b` is required on Windows** — without `-b` the tool may read in text mode and return a
different value, and a reader following the recipe as printed would reasonably conclude the vectors
had moved. The 30 August reproduction recipe omitted the flag. Reading blobs with
`git cat-file blob … | sha256sum` avoids the question entirely and is the form used throughout.

---

## 3. VECTOR INVENTORY AT `e0ad1c7`

Enumerated over the tree listing, not over a checkout: **82 files under `vectors/`.** Extension
census: **77 `.json`, 3 `.md`, 2 `.py`.** They sit in **15 directories that contain files**, or 20
counting the five intermediate directories that contain only other directories (`cpb-check`,
`domain-transforms`, `jcs-n`, `profile-independence`, `typed-refs`) — the 30 August document gave 20
without saying which count it was.

| directory | files | contents |
|---|---:|---|
| `vectors/` (root) | 4 | `CANONICALIZATION_DECLARATION.md`, `README.md`, `generate.py`, `harness.py` |
| `vectors/cpb-check/conforming/` | 3 | `01-basic`, `02-nested-objects`, `03-integer-zero` |
| `vectors/cpb-check/non-conforming/` | 10 | `01-null-member` … `10-duplicate-key-nested` |
| `vectors/domain-transforms/pass/` | 1 | `01-stream-reassembly` |
| `vectors/domain-transforms/fail/` | 1 | `01-stream-incomplete` |
| `vectors/jcs-n/kats/` | **38** | `01-basic` … `38-escaping-control-chars` |
| `vectors/jcs-n/derived-id/` | 3 | `01-basic-derived-id`, `02-carried-id-mismatch`, `03-sd-encoded-form` |
| `vectors/jcs-n/assembled-preimage/` | 2 | `01-member-mapping-undeclared`, `02-member-mapping-declared` |
| `vectors/multimodal/pass/` | 1 | `01-base64-binary-field` |
| `vectors/profile-independence/pass/` | 1 | `01-conforming-typed-ref` |
| `vectors/profile-independence/fail/` | 1 | `01-cross-profile-field-access` |
| `vectors/registry/` | 4 | `snapshot-v0`, `snapshot-v1`, `lookup-unknown-id`, `lookup-id-unknown-to-snapshot` |
| `vectors/subject-binding-diff/` | **5** | `diff-01` … `diff-04`, `README.md` |
| `vectors/typed-refs/pass/` | 2 | `01-matching-digest`, `02-arp-conformance-baseline` |
| `vectors/typed-refs/fail/` | 6 | `01-digest-context-mismatch` … `06-arp-digest-alg-inconsistent-with-registered-context` |

`generate.py` and `harness.py` are your Python source and were **not opened**; their names come from
the tree listing only.

### 3a. Where `jcs` expected values live — exhaustive search `[verified]`

Searched all 77 `.json` files under `vectors/` at `e0ad1c7`, read as blobs.

- **No file declares a top-level `"algorithm"` of `"jcs"`.** Of the 77, **46** declare a top-level
  `"algorithm"` and the value is `"jcs-n"` in all 46; the other **31** declare none.
- The token `"jcs"` occurs in exactly **4** of the 77 — the four `subject-binding-diff/diff-*.json` —
  and in each it is the key of a nested result object, never a top-level declaration.

So the live `jcs` construction's externally-authored expected digests exist in four vectors. That is a
statement about what is on disk at `e0ad1c7`, not a defect claim.

---

## 4. THE README SIGNPOST — DATED, AND STALE AS OF 2026-08-31

**This finding was true when it was made on 2026-08-30 and false within hours. It carried no expiry
date and it should have.**

At `e0ad1c7`, `README.md` (blob `1814b45b…`, 4759 bytes) line 64 is the only line naming a path under
`vectors/`, and it points an implementer at `jcs-n/kats/` — the historical suite for the withdrawn
construction — and not at `subject-binding-diff/` at all. The implementation was written from that
README.

**As of 2026-08-31 that is no longer the state of `main`.** PR #72 ("docs: point README to live jcs
vectors") merged, and `main` moved to `eba249c8518bbf417068fb911f7bafa66e214d12` `[relayed]` — read
from `git ls-remote` on 2026-08-31 and corroborated by a third party citing the same head.

**And `main` has moved again since.** At the fetch for this run, **2026-09-03T11:09:10Z**, `main` is
**`712c43b9adb2374eb443650822e62804775aafab`** `[verified]`, whose subject is `Merge pull request #70
from action-state-group/cpb-mesh-inference-exchange-registry-entry`, dated 2026-09-01T10:14:29+03:00.

The finding is therefore scoped to `e0ad1c7` and to nothing else, and this paragraph is the expiry
stamp the original lacked. Everything else in this package is pinned to `e0ad1c7` and is unaffected by
where `main` has gone.

---

## 5. SECTION NUMBERS, VERIFIED AGAINST THE -02 BYTES

Read from `47ab6757…5ec875`, from both the table of contents and the body headings.

| § | verbatim title | body heading line | subject |
|---|---|---:|---|
| **4.1** | `Algorithm jcs` | 565 | The canonicalization construction: JCS applied directly, SHA-256, lowercase hex. |
| **5** | `The Derived Identifier` | 733 | `id = CANONICAL-DIGEST(A, payload minus exclusion_set)`. |
| **5.1** | `Representation` | 767 | Exists, titled `Representation`. |
| **7.1** | `Leaf Construction` | 859 | Statement-to-receipt leaf construction, under §7 (line 830). |

Scope: every body heading matching `^N.`, `^N.M.` or `^Appendix` — 16 top-level sections, 18
subsections, 3 appendix headings — matched one-for-one against the table of contents, all 34 numbered
entries agreeing on number and title.

**One correction to how this was stated on 30 August.** That document wrote "Checked:" and then said
that Section 5 cites Section 5.1. It does not. **Section 5 contains no occurrence of the word
"Section" at all** (lines 733-766, `[verified]` in this run), and the only citation of Section 5.1 in
the whole 2072-line document is **line 864, inside §7.1** — the leaf-construction paragraph. The rest
of the sentence around that claim was right; that part was not.

---

## 6. PLATFORM AND RUNTIME OF THIS RUN

| field | value |
|---|---|
| OS | Microsoft Windows 11, Version 10.0.26200.9278 |
| arch | x86_64 / AMD64 |
| shell | Git Bash (MSYS2) |
| Node | **v24.13.0** (`win32 x64`, V8 13.6.233.17-node.37, OpenSSL 3.5.4) |
| npm | 11.9.0 |
| git | 2.53.0.windows.1 |
| TypeScript runner | tsx 4.23.1 |
| test runner | vitest 2.1.9 |
| run date (UTC) | 2026-09-03 |

**The checkout used for this run was made with `core.autocrlf=false`,** so the working tree is
byte-identical to the blobs. That was checked rather than assumed: all 77 `.json` files under
`vectors/` were hashed on disk with `sha256sum -b` and against `git cat-file blob`, and **0 of 77
differ** `[verified]`. This removes the line-ending question from every number in this package —
the harness read exactly the bytes the tree pins.

Separately, and for the record: on a default Windows checkout (`core.autocrlf=true`) all 77 files
differ in bytes from their blobs and all 77 parse to identical values, so no measured result depends
on the setting. What was defective on 30 August was the provenance layer, whose only job is to let a
reader check the rest.

---

## 7. THE CANONICALIZATION PATH, AND THE BOUND IT PLACES ON EVERY RESULT

| field | value |
|---|---|
| package | `@headlessoracle/chirindo` |
| version | `0.4.0` (exact pin) |
| module | `dist/vendor/recorder/index.js` |
| export used | `jcsBytes` |

**This is an independent implementation of the CPB construction layer — exclusion-set removal, digest,
encoding, representation, leaf input — sitting on a JCS implementation that was already in this
repository and was not written for this exercise or derived from RFC 8785 during it.** Every
byte-agreement result in this package inherits that bound. Where your vectors exercise RFC 8785
behaviour rather than CPB behaviour, what they test is that canonicalizer, not work done here.

---

## 8. SCOPE OF SOURCE EXPOSURE, DISCLOSED AND RE-COUNTED

The implementation was written from the draft text alone; `lib/` was not entered, listed, opened or
grepped while it was being written. That held throughout, and stopped being true in one respect
**after** the implementation was frozen.

After the freeze, `vectors/subject-binding-diff/README.md` named its harness as `check_vectors.py`,
which did not appear in the `vectors/` inventory. Rather than report an absence from a partial search,
the filename was enumerated across the whole repository with
`find . -path ./.git -prune -o -name '*.py' -print`. That command printed Python **filenames** outside
`vectors/`.

**Re-counted 2026-09-01, because the 30 August statement of it was arithmetically wrong in the one
paragraph whose entire value was arithmetic precision:**

| location | filenames printed |
|---|---:|
| `lib/cpb/` | **8** |
| `lib/tests/` | 10 |
| `.github/` | 5 |
| `vectors/` | 2 |
| **total** | **25** |

The 30 August text said 9 under `lib/cpb/` and "19 under `lib/`", and its four components summed to 26
in a sentence stating 25. **The correct figures are 8, and 18 under `lib/`, totalling 25.**

Exposed: 25 filenames. **Not exposed: no file under `lib/` was opened, read, grepped or displayed. No
function, constant, expected value or algorithm step of yours was seen.** The implementation was
already frozen and committed before the command ran, and no file under it has been modified since.
The command that should have been used is `find . -path ./lib -prune -o -name 'check_vectors*' -print`,
which answers the same question without traversing `lib/`; all enumeration since has pruned `./lib`.

The answer it produced, for completeness: `check_vectors.py` is at `.github/check_vectors.py`. Your
README's reference is accurate; the `vectors/`-scoped inventory simply did not cover `.github/`.

---

## CLAIM MANIFEST

**Recomputed in this run, from the bytes named:** the draft's sha256, byte length and line count; the
byte-parity of the draft against your `spec/` blob; the commit, its metadata and the `vectors/` tree
object; the 82-entry tree listing and its extension census; the five blob digests in §2c; the equality
of all 77 working-tree vector files with their blobs; the `"jcs"` and `"algorithm"` searches over all
77 JSON blobs; the four section headings and their line numbers; the absence of "Section" in §5 and
the single occurrence of "Section 5.1" at line 864; `main` at fetch time; the platform and runtime.

**Taken from you, as your figures:** `main` at `eba249c8…` on 2026-08-31, which this run did not
observe — `main` had moved again by the time of this fetch. The intent and status of PR #72 beyond its
having merged.

**Not established here:** that `e0ad1c7` is a commit any other party would reach from your published
history — it is pinned as bytes, and the tree object is what makes that checkable. That the vendored
JCS implementation conforms to RFC 8785 — that is inherited, not derived, and §7 states the bound.
That anything in this package holds for `main` as it stands today; every figure is scoped to
`e0ad1c7`.

---

## Interests

Interests. The author of this grading authors draft-msebenzi-evidence-action, builds Chirindo, an operator-run gate that signs receipts of MCP calls, and maintains receipt-verify, the tool that produced this document. Those occupy the same ground as the formats graded here. Independence is not claimed. What is claimed is that every value in this document recomputes from pinned bytes by anyone with the tool or without it, that every scope is cited to the document that names it, and that text and implementation are scored separately, a rule that came from the author of one of the formats graded. Where a judgment call was made, it is marked as one.
