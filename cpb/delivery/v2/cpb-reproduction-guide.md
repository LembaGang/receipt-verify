# REPRODUCTION GUIDE

## How to check every figure in this package without holding anything of ours

Issued 2026-09-03. The 30 August package promised a reproduction guide and did not send one, for a
stated reason: the section that would have anchored it republished working-tree digests, so it would
have failed its own integrity check on the first command. This one carries content-addressed values
throughout and is written to be run on Linux, macOS or Windows with the same output.

**Everything below runs against your repository alone.** No file of ours is needed for the pins, the
vector digests, the tree object or any of the vector content. The last section says exactly which
figures cannot be checked this way, and why.

---

## 0. What you need

`git` and a SHA-256 utility. On Linux and macOS that is `sha256sum` or `shasum -a 256`; on Windows,
Git Bash provides `sha256sum`. Nothing else — no Node, no Python, no package installs.

---

## 1. Clone and pin

```
git clone https://github.com/action-state-group/scitt-payload-binding.git
cd scitt-payload-binding
git checkout e0ad1c7e0b0248b9aed25c747f174548cb8e141d
```

**Expected**, identically on every platform:

```
$ git rev-parse HEAD
e0ad1c7e0b0248b9aed25c747f174548cb8e141d

$ git log -1 --format=%s
Merge pull request #67 from imran-siddique/register-trace-trust-record

$ git rev-parse e0ad1c7:vectors
4f2aec252028990a6ec59c0edfcd0f3b18cc4b40
```

**The tree object is the pin that matters.** `4f2aec25…` names the exact content of `vectors/`. If it
matches, every vector file is byte-identical to what was measured, whatever has happened to `main`
since — and `main` has moved twice since this commit, so that independence is not hypothetical.

---

## 2. The vector inventory

```
git ls-tree -r e0ad1c7 vectors/ | wc -l
git ls-tree -r e0ad1c7 vectors/ | grep -c '\.json$'
```

**Expected: 82 and 77.** Eighty-two entries under `vectors/` — 77 `.json`, 3 `.md`, 2 `.py`. The full
listing with every blob id is in `vectors-tree-e0ad1c7.txt` beside this document, and

```
git ls-tree -r e0ad1c7 vectors/
```

reproduces it verbatim below that file's five header lines.

---

## 3. The per-file digests

**This is the command that makes every per-file digest in this package checkable**, and the form the
30 August package should have used:

```
git cat-file blob e0ad1c7:vectors/subject-binding-diff/diff-01-null-member.json | sha256sum
```

**Expected:**

```
9ee197c5f25cf634f8930c5e30f1a8e8d2cd9b2a93cac3917bdb1fe93e24898c  -
```

All five digests the correction letter gave, as one loop:

```
for p in vectors/subject-binding-diff/diff-01-null-member.json \
         vectors/subject-binding-diff/diff-02-empty-object-member.json \
         vectors/subject-binding-diff/diff-03-empty-array-member.json \
         vectors/subject-binding-diff/diff-04-float-member.json \
         README.md ; do
  printf '%s  %s\n' "$(git cat-file blob e0ad1c7:$p | sha256sum | cut -d' ' -f1)" "$p"
done
```

**Expected:**

```
9ee197c5f25cf634f8930c5e30f1a8e8d2cd9b2a93cac3917bdb1fe93e24898c  vectors/subject-binding-diff/diff-01-null-member.json
55a4b4e1260c0689cb918b71879c5c4db2e727b96f589d848b8119f96e6772d4  vectors/subject-binding-diff/diff-02-empty-object-member.json
c845c2dbef8787e07fe106d7990c4929e453743fe237b069ddf2142c3ef453ba  vectors/subject-binding-diff/diff-03-empty-array-member.json
c660f2da9e4200155c7d772990682280a7143be3d5ac8dd0ea203546785a1a7e  vectors/subject-binding-diff/diff-04-float-member.json
1814b45b61f63b7c685218ae9c91e47ae4c02cb51a395e0a9ef0b69494bd068a  README.md
```

The three derived-identifier vectors:

```
9e3cce8269062b2c3f5b34874f11b0dc8f09d7669d4487f0b098bb019caaa338  vectors/jcs-n/derived-id/01-basic-derived-id.json
0a9d409adfdffe67b3dbec61aa1a60f22120af36ffe5f4a9626ee8d32aaa4cf2  vectors/jcs-n/derived-id/02-carried-id-mismatch.json
118f284a6b1b868001e0fee6c2bdc4102c4556ff0e7451cbcf7fbf28ead61322  vectors/jcs-n/derived-id/03-sd-encoded-form.json
```

### Why not `sha256sum` on the checked-out files

Because it gives a different answer on Windows, and that is the defect this package exists to correct.
A default Windows clone has `core.autocrlf=true`, which rewrites LF to CRLF on checkout; all 77 vector
files then differ in bytes from their blobs. **All 77 still parse to identical values, so no measured
result changes — but every published digest does.**

If you do want to hash files on disk, two things are required and the 30 August recipe stated neither:

```
git -c core.autocrlf=false clone https://github.com/action-state-group/scitt-payload-binding.git
sha256sum -b vectors/subject-binding-diff/diff-01-null-member.json
```

`-c core.autocrlf=false` so the checkout is byte-identical to the blobs, and **`sha256sum -b`** so the
tool reads in binary mode. Without `-b` on Windows you get a third value again, and following the
recipe as printed would lead you to conclude the vectors had moved. Reading blobs avoids the whole
question, which is why every digest in this package is a blob digest.

---

## 4. The draft text

```
git cat-file blob e0ad1c7:spec/draft-mih-sokolov-scitt-payload-binding-02.txt | sha256sum
git cat-file -s e0ad1c7:spec/draft-mih-sokolov-scitt-payload-binding-02.txt
```

**Expected:**

```
47ab675797d7edfe905c13b8482735239d9c5ceb318accbc33e4a5a51e5ec875  -
92428
```

That is byte-identical to the IETF-published copy at
`https://www.ietf.org/archive/id/draft-mih-sokolov-scitt-payload-binding-02.txt`, fetched
2026-08-30T18:04:35Z, and it is the text every section and line number in this package indexes. Its
2072 lines are LF-terminated with zero CR.

The three text findings, checkable directly against those bytes:

```
git cat-file blob e0ad1c7:spec/draft-mih-sokolov-scitt-payload-binding-02.txt > /tmp/cpb-02.txt

grep -n -i prefix /tmp/cpb-02.txt          # expected: exactly 2 hits, lines 775 and 2006
grep -n 'Section 5\.1' /tmp/cpb-02.txt     # expected: exactly 1 hit, line 864
sed -n '733,798p' /tmp/cpb-02.txt | grep -c Section   # expected: 0
```

The last two are the correction to a sentence in the 30 August package that claimed §5 cites Section
5.1. §5 spans lines 733-798 and contains no occurrence of the word "Section"; the only citation of
Section 5.1 in the document is at line 864, inside §7.1.

The prefixed-representation finding, as corrected — a representation your registry registers and your
vectors exercise but the normative text does not define:

```
git cat-file blob e0ad1c7:REGISTRY.md | sed -n '331p'
git cat-file blob e0ad1c7:vectors/typed-refs/fail/03-representation-mismatch.json | grep '"digest"'
```

(The bare string `sha256:` also appears in that file's `description` and `spec_ref`; matching on
`"digest"` shows the carried instance itself, `"sha256:0c837d01…"`.)

---

## 5. The vector claims, without running anything of ours

Each of these reads one blob and shows the value the results documents cite.

**kat-37 carries a genuine duplicate member name, which `JSON.parse` cannot show you:**

```
git cat-file blob e0ad1c7:vectors/jcs-n/kats/37-must-fail-duplicate-key.json | grep '"input"'
```

**Expected:** `"input": {"a": 1, "a": 2}`. Reading that file with any ordinary JSON parser yields
`{"a": 2}`, whose SHA-256 over the JCS form is
`7e8059f495589fcd981232cc11d00b00da3802c01d688fa1cf1f6bed6e5bb33c` — the value the 30 August run
published. That is the defect: the refusal has to happen before the parse.

**Kats 20 and 21 do carry a canonicalization input:**

```
git cat-file blob e0ad1c7:vectors/jcs-n/kats/20-must-fail-identifier-trailing-newline.json \
  | grep -A4 '"cited_artifact"'
```

**Expected:** a `payload` of `{"action":"read","resource":"sensor-7"}`, and, further down the same
object, `"correct_derived_id_bare_hex": "2f9bba43e30273e2e87c7ef659a0f36f1e11f8e0c10489afe4d267c996505c37"`.

**The four MUST-FAIL kats that also pin a conforming digest:**

```
for f in 13-nfc-boundary-contrast 27-esc-uppercase-contrast \
         28-tab-long-form-contrast 29-control-key-escaped-sort-contrast ; do
  printf '%s  ' "$f"
  git cat-file blob e0ad1c7:vectors/jcs-n/kats/$f.json | grep '"jcs_n_correct_digest"'
done
```

**Expected:** `0b985be8…`, `f5d570fa…`, `7ac9c6bd…`, `64e35d3d…`. Those four are why the comparable
base is 29 rather than 25.

**The seven typed-refs vectors that exercise §5:**

```
git grep -l 0c837d01faa4106c63367f199af9bfa729d1917f36dc91f9dfeb6de6ec7c6bdb e0ad1c7 -- vectors/typed-refs/
```

**Expected: seven files** — everything under `vectors/typed-refs/` except
`fail/02-textual-equality-trap.json`:

```
e0ad1c7:vectors/typed-refs/fail/01-digest-context-mismatch.json
e0ad1c7:vectors/typed-refs/fail/03-representation-mismatch.json
e0ad1c7:vectors/typed-refs/fail/04-identifier-inconsistent-with-context.json
e0ad1c7:vectors/typed-refs/fail/05-digest-algorithm-inconsistent-with-context.json
e0ad1c7:vectors/typed-refs/fail/06-arp-digest-alg-inconsistent-with-registered-context.json
e0ad1c7:vectors/typed-refs/pass/01-matching-digest.json
e0ad1c7:vectors/typed-refs/pass/02-arp-conformance-baseline.json
```

This command is the reason the count in the results is seven rather than the five named in the
31 August letter: it searches for the **value**, so it cannot be defeated by the value being stored
under a member name nobody thought to look for. `fail/04` and `fail/05` carry it as
`correct_verification.recomputed_digest` and as a top-level `correct_recomputed_digest`.

Note that `fail/03` states its exclusion set only in prose, inside its `digest_context` string, and
carries no `exclusion_set` array:

```
git cat-file blob e0ad1c7:vectors/typed-refs/fail/03-representation-mismatch.json | grep -c exclusion_set
```

**Expected: 0.** Recomputing that vector requires reading `{doc_id}` out of the `digest_context`
sentence, which is the one judgment call in that set and is marked as such in the results. The other
six declare it as an array.

**And the two corrected statements about `02-carried-id-mismatch.json`:**

```
git cat-file blob e0ad1c7:vectors/jcs-n/derived-id/02-carried-id-mismatch.json | grep '"record_id"' 
git cat-file blob e0ad1c7:vectors/jcs-n/derived-id/02-carried-id-mismatch.json | grep -c after_exclusion
```

**Expected:** a 64-character string of zeroes, not `null`; and `0` — the file carries no
`after_exclusion` block, and no `normalized` block either.

---

## 6. Reproducing the digests themselves

Every digest in the results is `SHA-256` over the RFC 8785 JCS serialization of a JSON value, encoded
as 64 lowercase hex characters — §4.1 steps 1 to 3, with no normalization pass. With any conforming
JCS implementation:

```
canonical = JCS(payload)                    # RFC 8785, UTF-8 octets
digest    = lowercase_hex(SHA-256(canonical))
```

For a derived identifier, §5's removal step comes first and removes the payload class's declared
exclusion set from the **top level only**:

```
reduced   = payload with each member named in exclusion_set DELETED (not nulled)
id        = lowercase_hex(SHA-256(JCS(reduced)))
```

Worked, on `typed-refs/pass/01-matching-digest.json`: the payload is
`{"doc_id":null,"subject":"WS-42","scope":"temperature-write","issued_at":"2026-07-24T00:00:00Z"}`, the
exclusion set is `["doc_id"]`, so the canonical pre-image is

```
{"issued_at":"2026-07-24T00:00:00Z","scope":"temperature-write","subject":"WS-42"}
```

and its SHA-256 is `0c837d01faa4106c63367f199af9bfa729d1917f36dc91f9dfeb6de6ec7c6bdb`, which is what
the vector pins and what our implementation produces. The vector carries the same pre-image string in
its own `pre_image` member, so this step is checkable against your bytes and not only against ours.

**A refusal, not a value, is the correct output for kat-37**, per RFC 8785 §3.1 and RFC 7493 §2.3,
reached from §4.1 through the `jcs` registry entry's Reference to RFC 8785 Section 3.

---

## 7. What this guide cannot let you check, and why

**The run itself.** The harness that produced the per-vector tables is our source and is not in this
package, so the tables are reproducible in the sense that every input is pinned and every construction
is specified above — not in the sense that you can execute our code. Any conforming implementation of
§4.1 and §5 should produce the same values from the same inputs; that is the claim, and disagreement
would be the interesting result.

**The Appendix A ordering proof.** The claim that our regression pin for
`1009a072df7fc0bfc6fcf49ca2f194067f6c0136c871a88d4fbd66a13361c1d1` was written from the draft
**before** your `01-basic-derived-id.json` was read rests on a commit in our repository, which is not
published. It is stated as unpublished rather than glossed, and the commit can be provided on request.

**RFC 8785 conformance of the canonicalizer underneath.** The JCS step comes from a canonicalizer
already vendored into our repository and not written or derived for this exercise. Every byte
agreement inherits that bound. Your kats 13, 27, 28 and 29 are the closest thing to an external check
on it, and they pass.

**Platform-independence beyond what is stated.** The run was on Windows, Node v24.13.0, from a
checkout made with `core.autocrlf=false`, and all 77 vector files were verified byte-identical to
their blobs before the run. A Linux re-derivation from a clean clone is the control on that and has
not been run by us.

---

## CLAIM MANIFEST

**Recomputed in this run, from the bytes named:** every command in this guide was executed against a
fresh clone at `e0ad1c7` before it was written down, and the "Expected" blocks are its actual output,
not a transcription of what the commands ought to print. That is stated because the 30 August
reproduction recipe was written without being run and would have failed on its first command.

Two commands were corrected as a result of running them. The `git grep` for the derived identifier
returns **seven** files under `typed-refs/`, not the five the 31 August letter named — which is how
that under-report was found. And two `grep` patterns were tightened (`'"digest"'` rather than
`'sha256:'`, `'"jcs_n_correct_digest"'` rather than the bare token) because the loose forms also match
prose in the same files, so their stated output would not have been what a reader saw.

**Taken from you, as your figures:** every expected digest, identifier, pre-image and blob id is read
out of your repository by the commands above; none of them is ours.

**Not established here:** everything in section 7. In particular the run itself is not reproducible
from this guide — the harness is not in this package — and the Appendix A ordering proof rests on an
unpublished commit of ours.

---

## Interests

Interests. The author of this grading authors draft-msebenzi-evidence-action, builds Chirindo, an operator-run gate that signs receipts of MCP calls, and maintains receipt-verify, the tool that produced this document. Those occupy the same ground as the formats graded here. Independence is not claimed. What is claimed is that every value in this document recomputes from pinned bytes by anyone with the tool or without it, that every scope is cited to the document that names it, and that text and implementation are scored separately, a rule that came from the author of one of the formats graded. Where a judgment call was made, it is marked as one.
