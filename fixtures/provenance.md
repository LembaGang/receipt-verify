---
corrections:
  - id: C-2026-09-02-1
    section: "Appended 2026-09-03 — Insight's repaired package (schema v3) and the second registry pin"
    field: "section date"
    stated: "2026-09-03"
    actual: "2026-09-02"
    evidence: "commits 7506c18 (2026-09-02T12:17:39Z) and ff1639e (2026-09-02T12:20:23Z); the section's own table records the registry retrieval at 2026-09-02T11:54:27Z"
    cause: "the handoff and report files were named for the day the work was scheduled (CC_HANDOFF_2026-09-03_insight-adapter-v3-addendum.md, CC_REPORT_2026-09-03_insight-adapter-v3.md); the date was copied from the filename"
    corrected_on: "2026-09-02"
    corrected_in: "2e63fb6 (appended paragraph 'Correction 2026-09-02.' under the section) and this entry"
    original_text_edited: false
  - id: C-2026-09-03-1
    section: "Appended 2026-09-03 — the post-rotation Insight pins (17:41Z), and why the same registry is pinned twice"
    field: "the closing paragraph, 'What this still does not do'"
    stated: "revoked: true is reported as the annotation identity_revoked and does not move the verdict — a revoked key still resolves as a published identity and can still reach VALID"
    actual: "true when written and no longer true: a revoked key is UNVERIFIABLE/key_revoked at check identity, on both the public_keys `revoked` member and the top-level revoked_keys array, and reaches no verdict under a key"
    evidence: "commit 5cf2e1a; the section 'Appended 2026-09-03 — the revoked-key gap, closed the same way, on both channels'; eight cases in test/insight.test.ts, five of which were red against f495e13"
    cause: "not an error — the gap was recorded as open, deliberately, rather than fixed inside a handoff that did not name it; it was closed the same day by the follow-up commit. Recorded here so a machine reading `corrections:` does not carry a closed gap forward as an open one"
    corrected_on: "2026-09-03"
    corrected_in: "5cf2e1a (the fix, and the section that now holds), plus this entry and the appended paragraph under the corrected section"
    original_text_edited: false
---
# Fixture provenance

**Corrections.** The YAML front matter at the top of this file lists every retraction of a statement made in it, keyed to the exact text of the section heading it corrects. Original text is never edited: a correction is an appended paragraph under the section plus an entry in the front matter, so a reader parsing headings can also read the retraction. Entries are append-only and carry the commit that made them.

Every fixture in this directory (and `refs/`) is a byte-exact snapshot of a
remote or external source. The test suite reads these snapshots and never
fetches at test time — the single exception is the live-JWKS integration test
in `test/live-jwks.test.ts`, which is explicitly marked and skips when offline
or when `RECEIPT_VERIFY_LIVE` is unset.

Regenerate with `node tools/snapshot.mjs`. Table last written 2026-07-29T10:01:47.269Z.

For local-file sources, `retrieved (UTC)` is the source file's mtime — the
corpus is a frozen artifact, so its own timestamp is the meaningful one.

| file | source | retrieved (UTC) | bytes | sha256 |
|---|---|---|---|---|
| `refs/draft-krausz-verification-state-01.txt` | https://www.ietf.org/archive/id/draft-krausz-verification-state-01.txt | 2026-07-29T10:01:01.955Z | 39466 | `22c5ce262bdf4e63ef538a308e7a8455e93c4143b9e1726b7b64720615d516db` |
| `refs/draft-farley-acta-signed-receipts-02.txt` | https://www.ietf.org/archive/id/draft-farley-acta-signed-receipts-02.txt | 2026-07-29T10:01:04.291Z | 60589 | `14501a68a86e3cc403f56967b19b732316ad3cc2fc011ce3d14aec9c1de68bd2` |
| `refs/draft-marques-asqav-compliance-receipts-07.txt` | https://www.ietf.org/archive/id/draft-marques-asqav-compliance-receipts-07.txt | 2026-07-29T10:01:05.012Z | 290473 | `082615447288fa1e983fa2cfb7aa7356fbb35d05d65ea256f66111487746d52f` |
| `fixtures/verification-state/spec-examples/README.md` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/README.md | 2026-07-29T10:01:08.045Z | 5312 | `9c45b91d0913becedb47a65e2ca79f495e792a2c0e7c4023dd41fd84effe6d2d` |
| `fixtures/verification-state/spec-examples/generate_detached_fixture.py` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/generate_detached_fixture.py | 2026-07-29T10:01:09.312Z | 2699 | `c762ef4eaf93eac0c4d6b3d14984ba068254725efa5d68ce06954ab305902de3` |
| `fixtures/verification-state/spec-examples/jwks-fixture-detached.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/jwks-fixture-detached.json | 2026-07-29T10:01:09.996Z | 1300 | `ff18e1b30a3de9fd9615dc1d3a7afb6f270190afa73263d00436e602a403ef1f` |
| `fixtures/verification-state/spec-examples/package.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/package.json | 2026-07-29T10:01:10.548Z | 526 | `8847d6480422cc52e4a1930c8002e6e0d25657da4dda438c679f44bc53cf356b` |
| `fixtures/verification-state/spec-examples/requirements.txt` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/requirements.txt | 2026-07-29T10:01:11.108Z | 32 | `a0f6fefdcb588bc9745fe45fdaa878d94a626aa7a79af4ae92fe8aee6d8f87f3` |
| `fixtures/verification-state/spec-examples/sample_payload.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/sample_payload.json | 2026-07-29T10:01:11.770Z | 1684 | `516eb4a5e716e738b68ba7e997dc93266cfffcb7bd1da94dbc96e5dc0f441c74` |
| `fixtures/verification-state/spec-examples/sample_receipt_attached_jws.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/sample_receipt_attached_jws.json | 2026-07-29T10:01:12.332Z | 2073 | `2e2293e3795cb7f46da0d1a5e2ec00cf7815b4efd2e0aa11160a894ef5f41605` |
| `fixtures/verification-state/spec-examples/sample_receipt_detached_jws.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/sample_receipt_detached_jws.json | 2026-07-29T10:01:13.076Z | 362 | `de9f46b5af71d5b32c5925bc822d24f0e2099a4b5da6295d8260d6c6c9e8382d` |
| `fixtures/verification-state/spec-examples/sample_receipt_detached_payload_canonical.bin` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/sample_receipt_detached_payload_canonical.bin | 2026-07-29T10:01:13.759Z | 1315 | `b1bf26165f251af4c9d756bcae4b512d31f93f092d0c1cec53b7091ad3f4047a` |
| `fixtures/verification-state/spec-examples/v0.3-composed/README.md` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/README.md | 2026-07-29T10:01:14.313Z | 7656 | `a67f2841939d9c20b11944c944b41c7506b226b3a00954f84a9b80f656f02bfd` |
| `fixtures/verification-state/spec-examples/v0.3-composed/build_fixtures.py` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/build_fixtures.py | 2026-07-29T10:01:14.898Z | 24913 | `c4f9d48c355090d05166d7a6f3a2faa9b4662a6627052e9acdf517d6980437d7` |
| `fixtures/verification-state/spec-examples/v0.3-composed/jwks-agentoracle.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/jwks-agentoracle.json | 2026-07-29T10:01:15.737Z | 224 | `3dd489890af45432acd1201797fa6674c6d60478bcf32965db3c2b17a9a37038` |
| `fixtures/verification-state/spec-examples/v0.3-composed/jwks-agenttrust.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/jwks-agenttrust.json | 2026-07-29T10:01:16.284Z | 224 | `ce140b26851015be51dd0b49e56012adc1ac857abb38ead04dffd02a897cfab1` |
| `fixtures/verification-state/spec-examples/v0.3-composed/jwks-presidio.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/jwks-presidio.json | 2026-07-29T10:01:16.849Z | 230 | `80866bfc309856cef1c4f66039a0d002503fa94a7723413ebfe1539d88a7513c` |
| `fixtures/verification-state/spec-examples/v0.3-composed/jws-001.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/jws-001.json | 2026-07-29T10:01:17.398Z | 2089 | `bbd5df6fa79102b461adaa0f35b03609ac426046fb2eda1f4dbb698809dd496c` |
| `fixtures/verification-state/spec-examples/v0.3-composed/jws-002.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/jws-002.json | 2026-07-29T10:01:18.170Z | 2106 | `503de628cfc2981c9071cfd3a27c679f92b4fb37f5f83c10ba66b8090c41776a` |
| `fixtures/verification-state/spec-examples/v0.3-composed/jws-003.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/jws-003.json | 2026-07-29T10:01:18.802Z | 2077 | `db2f053c91e0400247b3fe4a7c2f7bed4937ed8bfa0d514c59688709a2ae3a21` |
| `fixtures/verification-state/spec-examples/v0.3-composed/jws-004.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/jws-004.json | 2026-07-29T10:01:19.333Z | 2153 | `4ad437ff4ed9f62296ba89779d64d994d794a6475fad924859cf47ea0fd33e77` |
| `fixtures/verification-state/spec-examples/v0.3-composed/jws-005.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/jws-005.json | 2026-07-29T10:01:20.069Z | 3048 | `957f095c73779e879e381462aa297dd266616c7624ae72ca8a1dd56d949c817c` |
| `fixtures/verification-state/spec-examples/v0.3-composed/jws-006.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/jws-006.json | 2026-07-29T10:01:20.755Z | 3049 | `08251b24914b06d3a31789f428e3a7fb9ed9a82a85ddc37a29c18dd0d8b4bd62` |
| `fixtures/verification-state/spec-examples/v0.3-composed/jws-007.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/jws-007.json | 2026-07-29T10:01:21.348Z | 3018 | `a3b9c09adf5a7b43daca031d5b385fd185b99870e1b7a69fb0e8df76f464f019` |
| `fixtures/verification-state/spec-examples/v0.3-composed/jws-r01.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/jws-r01.json | 2026-07-29T10:01:22.051Z | 2089 | `546e9ba23214ad5c5324c67f5d9eb82100fbd6f18692a3adfe3455dd5023e966` |
| `fixtures/verification-state/spec-examples/v0.3-composed/jws-r02.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/jws-r02.json | 2026-07-29T10:01:22.614Z | 2122 | `3b1c9323fcaf42a84f98dc82b83fc367b9e5f619de9df48e18fc8c827f3ce25f` |
| `fixtures/verification-state/spec-examples/v0.3-composed/jws-r03.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/jws-r03.json | 2026-07-29T10:01:23.191Z | 2076 | `648564cd794d17895d89b43e2fc2d28a61a2f5a87296a90d871d78349c2b5d37` |
| `fixtures/verification-state/spec-examples/v0.3-composed/jws-r04.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/jws-r04.json | 2026-07-29T10:01:23.713Z | 3048 | `0d722239da53be441ae6c739bbe4c49e1914a5c2fc1de4e99fa71083103c7201` |
| `fixtures/verification-state/spec-examples/v0.3-composed/payload-001.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/payload-001.json | 2026-07-29T10:01:24.292Z | 1296 | `3ca6c00b78a24e001278afe12bffef5621beccdb488936ff0961dd6ff1661964` |
| `fixtures/verification-state/spec-examples/v0.3-composed/payload-002.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/payload-002.json | 2026-07-29T10:01:24.833Z | 1309 | `41963d56895a0f9caffee8de55227552563463d07633bc43be9c4f4d58b623d3` |
| `fixtures/verification-state/spec-examples/v0.3-composed/payload-003.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/payload-003.json | 2026-07-29T10:01:25.375Z | 1287 | `1d6cd6fda7af1d545444d47faae25044fe63aefd6d4aea3318e5f136e8d8960c` |
| `fixtures/verification-state/spec-examples/v0.3-composed/payload-004.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/payload-004.json | 2026-07-29T10:01:25.804Z | 1348 | `1d7b031a7e4a881b0615d63e0038636a35fdffd590d2f3961da2a5d4adf9018e` |
| `fixtures/verification-state/spec-examples/v0.3-composed/payload-005.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/payload-005.json | 2026-07-29T10:01:26.503Z | 1876 | `c9ce8662b4b745934c86890e0b29ada3e8f6e0fcd26f34b12092d02ca1348b53` |
| `fixtures/verification-state/spec-examples/v0.3-composed/payload-006.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/payload-006.json | 2026-07-29T10:01:27.062Z | 1877 | `fb95e3bf5415d59fe6cd0267939cdc38fc784a470b554bcfc27e42d0ad9c660b` |
| `fixtures/verification-state/spec-examples/v0.3-composed/payload-007.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/payload-007.json | 2026-07-29T10:01:27.727Z | 1854 | `46740e0a2e2728f7be9e2f1314a4d3f45fce4a523c19583f66ea564ad4b5a3ef` |
| `fixtures/verification-state/spec-examples/v0.3-composed/payload-r01.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/payload-r01.json | 2026-07-29T10:01:28.284Z | 1296 | `2c788f854952e69487e2dfe762664ef97cfeab84e9d6f49f222cda2f563e7f6f` |
| `fixtures/verification-state/spec-examples/v0.3-composed/payload-r02.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/payload-r02.json | 2026-07-29T10:01:28.969Z | 1325 | `a5a534f1351ef7b360c79cab678e89b2645ccf7faa21b0cb0e1ef6ab7be7dc18` |
| `fixtures/verification-state/spec-examples/v0.3-composed/payload-r03.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/payload-r03.json | 2026-07-29T10:01:29.837Z | 1286 | `dd678ad1d6da827f3191fc08f089d8381b411f7daa0318aff1526d842ef1fc3b` |
| `fixtures/verification-state/spec-examples/v0.3-composed/payload-r04.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/payload-r04.json | 2026-07-29T10:01:30.348Z | 1876 | `e834d83f271619a6c32e4292ed2517010ff86054e5c013db6dd236299fe15705` |
| `fixtures/verification-state/spec-examples/v0.3-composed/vectors.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/vectors.json | 2026-07-29T10:01:30.906Z | 9063 | `6304caee9a70d5a0a7820fd235709bd3263b10f56187a479649d01b35807b394` |
| `fixtures/verification-state/spec-examples/v0.3-composed/verify.mjs` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/verify.mjs | 2026-07-29T10:01:31.411Z | 9594 | `f71c139008a6794455b7621df7e443b787e28bdf6d768ce02344111267c9eb7a` |
| `fixtures/verification-state/spec-examples/v0.3-composed/verify.py` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/v0.3-composed/verify.py | 2026-07-29T10:01:32.018Z | 10927 | `42b5022982a4eb24f7e098da8b3c11857d16ad72ba3ad87beb5e2cc26601beef` |
| `fixtures/verification-state/spec-examples/verify_detached_node.mjs` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/verify_detached_node.mjs | 2026-07-29T10:01:32.709Z | 3355 | `1e4d45d9974c072ec8e78b17ed47a2c3710ae1bcce6e40745c25b92c3563245f` |
| `fixtures/verification-state/spec-examples/verify_detached_python.py` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/verify_detached_python.py | 2026-07-29T10:01:33.402Z | 4540 | `4c86ecf27c2fa85d3c2a298e9b46fdeb4a9e497cf57719c8dcb81efdb812db1a` |
| `fixtures/verification-state/spec-examples/verify_node.mjs` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/verify_node.mjs | 2026-07-29T10:01:34.123Z | 2831 | `19f7b596fb45d3108797af0580c49d92eb7653565d8255f1aaff1093016219cd` |
| `fixtures/verification-state/spec-examples/verify_python.py` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/196df22b255e7173d4eb6b20e833cc4e8ae6d35d/examples/verify_python.py | 2026-07-29T10:01:34.535Z | 3887 | `1c86c15f60e1771ac6ba6f656ad6b96fc91fb6517b49527f5d1530843d7860b2` |
| `fixtures/verification-state/jwks/agentoracle.co.well-known.jwks.json` | https://agentoracle.co/.well-known/jwks.json | 2026-07-29T10:01:35.192Z | 629 | `5cef45bb61ffe955113ca744e0fd131c9423831b2972a06aa2ad5a3bc328e2b8` |
| `fixtures/verification-state/mappings/published/agentoracle-v0.3-2026-05-30.by-digest.json` | https://agentoracle.co/mappings/0a78263976790df6e76cd9f3f441bf5a3b5c3a82e346b5aca43e49626881d7b0.json | 2026-07-29T10:01:36.841Z | 2008 | `0a78263976790df6e76cd9f3f441bf5a3b5c3a82e346b5aca43e49626881d7b0` |
| `fixtures/verification-state/mappings/agentoracle-v0.3-2026-05-30.json` | https://agentoracle.co/mappings/agentoracle-v0.3-2026-05-30.json | 2026-07-29T10:01:38.542Z | 2008 | `0a78263976790df6e76cd9f3f441bf5a3b5c3a82e346b5aca43e49626881d7b0` |
| `fixtures/evidence-action/manifest.json` | file://C:/Users/User/agent-action-receipt-vectors/manifest.json | 2026-06-24T17:59:29.098Z | 9215 | `dad4e77cc5072446832b0b1771de11e2fc14094c6671061366477e60ce214ef3` |
| `fixtures/evidence-action/jwks.json` | file://C:/Users/User/agent-action-receipt-vectors/jwks.json | 2026-06-24T17:59:29.097Z | 212 | `d71d575a00f6baa135c44531f8a3c6950828f2b2d3079595971ad458f14c56ba` |
| `fixtures/evidence-action/SPEC.md` | file://C:/Users/User/agent-action-receipt-vectors/SPEC.md | 2026-07-26T15:58:28.001Z | 20107 | `5bd90aefeb8a48ef15894d8d6b59c1d5a41671895afedd5511e656f34a3a79f3` |
| `fixtures/evidence-action/README.md` | file://C:/Users/User/agent-action-receipt-vectors/README.md | 2026-06-24T17:35:26.468Z | 4316 | `5d54040bfffcf4e6065015ab4e0bcba888661d1bcce5efd15b414925c7927cc7` |
| `fixtures/evidence-action/vectors/allow/chain.jsonl` | file://C:/Users/User/agent-action-receipt-vectors/vectors/allow/chain.jsonl | 2026-06-24T17:59:29.084Z | 849 | `568152aa8b0ff5b311e20dc62ab3471d91f7a6c92eed157aaf432b86dff7f94e` |
| `fixtures/evidence-action/vectors/deny/chain.jsonl` | file://C:/Users/User/agent-action-receipt-vectors/vectors/deny/chain.jsonl | 2026-06-24T17:59:29.085Z | 833 | `1ef886cbc25db826c64dccc7c1d025d663db750ad52b418a437757057b4bc231` |
| `fixtures/evidence-action/vectors/fail-closed/chain.jsonl` | file://C:/Users/User/agent-action-receipt-vectors/vectors/fail-closed/chain.jsonl | 2026-06-24T17:59:29.089Z | 867 | `76528edc3254aa8cf25dc4c13fb54e533e145da11e864ef29e8e8a2190f8d5ea` |
| `fixtures/evidence-action/vectors/tampered/chain.jsonl` | file://C:/Users/User/agent-action-receipt-vectors/vectors/tampered/chain.jsonl | 2026-06-24T17:59:29.091Z | 851 | `63ffa1b68039e82053aead192aee8216db3b7ab71427677a86bd3a3415f1b8f7` |
| `fixtures/evidence-action/vectors/chain-multi/chain.jsonl` | file://C:/Users/User/agent-action-receipt-vectors/vectors/chain-multi/chain.jsonl | 2026-06-24T17:59:29.095Z | 1148 | `d22292ca64876e2db9fa018ac8f3307b7296f3756901c749f2ba1051f5d0d596` |
| `fixtures/evidence-action/vectors/canonicalization-key-order/chain.jsonl` | file://C:/Users/User/agent-action-receipt-vectors/vectors/canonicalization-key-order/chain.jsonl | 2026-06-24T17:59:29.096Z | 643 | `ce4da0ce7f723360bde7e374d916a9d5aeb349c8d4f0677c5becc26ce905733b` |
| `fixtures/acta/published/README.md` | https://raw.githubusercontent.com/ScopeBlind/agent-governance-testvectors/HEAD/README.md | 2026-09-10T07:25:56Z (commit `b82a50a`) | 10146 | `f5d8fa4293c6273cce592a3977f0608cc35d4464182c523c78f8586cead54004` |
| `fixtures/acta/published/spec.md` | https://raw.githubusercontent.com/ScopeBlind/agent-governance-testvectors/HEAD/spec.md | 2026-09-10T07:25:56Z (commit `b82a50a`) | 9064 | `8f06f93022db625f35f197e24843d6ab21c694b6c6bbc4954a86992ca981d09c` |
| `fixtures/acta/published/expected/receipt-schema.json` | https://raw.githubusercontent.com/ScopeBlind/agent-governance-testvectors/HEAD/expected/receipt-schema.json | 2026-09-10T07:25:56Z (commit `b82a50a`) | 7952 | `184dddb4aa2ca18abedcbc1234be95d69a4de752a3d179e1009e9f68b829ad63` |
| `fixtures/acta/published/expected/chain.jsonl` | https://raw.githubusercontent.com/ScopeBlind/agent-governance-testvectors/HEAD/expected/chain.jsonl | 2026-09-10T07:25:56Z (commit `b82a50a`) | 736 | `32dfcc586c2c1f7ee8c801021ddd1a9ecd85de06a0257b62fdeabbdce63399b4` |

> **Four of these rows moved on 2026-09-10.** `README.md`, `spec.md`, `expected/receipt-schema.json` and `expected/chain.jsonl` are no longer the 2026-07-29 capture: the corpus was taken to `agent-governance-testvectors` commit `b82a50a375299e5edfbabea686b0e2654df75006` when that source was re-pinned at a commit (B-159). Their previous digests, the walker before/after, and why the other ten rows did not move are in *Appended 2026-09-10 - agent-governance-testvectors re-pinned at a commit* below.
| `fixtures/acta/published/fixtures/keys/README.md` | https://raw.githubusercontent.com/ScopeBlind/agent-governance-testvectors/HEAD/fixtures/keys/README.md | 2026-07-29T10:01:41.512Z | 1072 | `1c35a588425ff244b3cc7b75a25247644774d731cc9253c7b2aa220b0d1e9e3f` |
| `fixtures/acta/published/aps-gateway-enforcement/README.md` | https://raw.githubusercontent.com/ScopeBlind/agent-governance-testvectors/HEAD/aps-gateway-enforcement/README.md | 2026-07-29T10:01:42.138Z | 5835 | `2b278950c875188fc0f7014da319fea9aa16c61171860cc3a5ff049ee9b6b7d4` |
| `fixtures/acta/published/aps-gateway-enforcement/2-external-verification/receipt.json` | https://raw.githubusercontent.com/ScopeBlind/agent-governance-testvectors/HEAD/aps-gateway-enforcement/2-external-verification/receipt.json | 2026-07-29T10:01:42.805Z | 828 | `efd8accc8d96001a6f5fcbfedec420600804486078baa778d8870625b9d9ea26` |
| `fixtures/acta/published/aps-gateway-enforcement/2-external-verification/jwks.json` | https://raw.githubusercontent.com/ScopeBlind/agent-governance-testvectors/HEAD/aps-gateway-enforcement/2-external-verification/jwks.json | 2026-07-29T10:01:43.229Z | 235 | `2ce283efe6dfe792a2013c06cabd652db3e15a0785aac3885606f4fbcc6c01a3` |
| `fixtures/acta/published/aps-gateway-enforcement/2-external-verification/canonical.txt` | https://raw.githubusercontent.com/ScopeBlind/agent-governance-testvectors/HEAD/aps-gateway-enforcement/2-external-verification/canonical.txt | 2026-07-29T10:01:43.806Z | 588 | `b7d84a8a164c8aea6d09d27c41ecbf4119dbada80cab4d9b83bfcb51fae119bc` |
| `fixtures/acta/published/aps-gateway-enforcement/2-external-verification/expected-output.json` | https://raw.githubusercontent.com/ScopeBlind/agent-governance-testvectors/HEAD/aps-gateway-enforcement/2-external-verification/expected-output.json | 2026-07-29T10:01:44.409Z | 293 | `dfb67edc90c3c3e9d89475d1a50064e2bad4be2f44e117d2f54d0f3b8269a50b` |
| `fixtures/acta/published/aps-gateway-enforcement/2-external-verification/README.md` | https://raw.githubusercontent.com/ScopeBlind/agent-governance-testvectors/HEAD/aps-gateway-enforcement/2-external-verification/README.md | 2026-07-29T10:01:45.003Z | 2848 | `4da8d4289681c808944921035fe7b9c60c5726e06e7c6138199101234cb3a4b5` |
| `fixtures/acta/published/aps-gateway-enforcement/4-portability/receipt.json` | https://raw.githubusercontent.com/ScopeBlind/agent-governance-testvectors/HEAD/aps-gateway-enforcement/4-portability/receipt.json | 2026-07-29T10:01:45.585Z | 828 | `1aad0e1122ba5a44896631e9e9f38cbdcb80d300362d01f46956f6d79de16719` |
| `fixtures/acta/published/aps-gateway-enforcement/4-portability/jwks.json` | https://raw.githubusercontent.com/ScopeBlind/agent-governance-testvectors/HEAD/aps-gateway-enforcement/4-portability/jwks.json | 2026-07-29T10:01:46.249Z | 235 | `2ce283efe6dfe792a2013c06cabd652db3e15a0785aac3885606f4fbcc6c01a3` |
| `fixtures/acta/published/aps-gateway-enforcement/4-portability/expected-output.json` | https://raw.githubusercontent.com/ScopeBlind/agent-governance-testvectors/HEAD/aps-gateway-enforcement/4-portability/expected-output.json | 2026-07-29T10:01:46.817Z | 218 | `067303ce9ba9b6f417184490b9cdb6baa60534c0bbd64c50cb4fbeb26e6e847e` |

## Generated here, not snapshotted

These files are produced by `node tools/make-throwaway-fixtures.mjs`, by
`node tools/make-acta-fixtures.mjs`, and by hand (the mapping documents).
They are not copies of any published artifact.

The signing keys are throwaways whose seeds are published in the generators.
The `verification.*` fixtures carry `test-throwaway` in the key id; the
`acta` fixtures use the §2.1.1 `sb:issuer:<base58>` kid form over the same
throwaway seeds, so the kid alone does not mark them — `fixtures/acta/keys/`
carries the warning instead.

The `acta` set exists because draft-farley-acta-signed-receipts-02 §5.10
announces an interoperability suite that its own test-vector reference does
not contain. These are OUR construction of that suite, not the draft
author's. See FINDINGS.md §E1.

| file | bytes | sha256 |
|---|---|---|
| `fixtures/verification-state/synthetic/composed-act.general.json` | 1418 | `885be367ba03ef023df83400016e1f6a74bb61fe5959a2423e73d03a0434dc5c` |
| `fixtures/verification-state/synthetic/composed-act.payload.json` | 700 | `b413ebdb1c68588fa693d4d3bb7003aa9c54630635e18c7757620c1e47753522` |
| `fixtures/verification-state/synthetic/composed-halt.general.json` | 1488 | `3fbe5eed417542c52a8b1324201485ba097d8ee00cceb3178de97191ec5f6fc2` |
| `fixtures/verification-state/synthetic/composed-halt.payload.json` | 792 | `ee40ff8b5ba5859223c414d879e31b0b03bee875dd0a204b5f77e0d7357917da` |
| `fixtures/verification-state/synthetic/composed-null-sibling.general.json` | 1451 | `d9f84e030221efb73d6130a25ce9522b3a18e71f8a11eea95b0d4deb907a9479` |
| `fixtures/verification-state/synthetic/composed-null-sibling.payload.json` | 729 | `cd4106fa3ef50b15704381e2a8aeec7345409cde2dd7935b9c8370ef484c0607` |
| `fixtures/verification-state/synthetic/composed-one-bad-signature.general.json` | 1418 | `9a8b21f806ab54c4f2807f5b24504b23af2aab1b0e744edadeacd34553000b1a` |
| `fixtures/verification-state/synthetic/composed-one-bad-signature.payload.json` | 700 | `b413ebdb1c68588fa693d4d3bb7003aa9c54630635e18c7757620c1e47753522` |
| `fixtures/verification-state/synthetic/composed-rule-violation.general.json` | 1419 | `33604fe4ead5ef09e32f627a08418dc9873f64ff0fed154e9eb9bd044c5e3e76` |
| `fixtures/verification-state/synthetic/composed-rule-violation.payload.json` | 701 | `26738d0334012d31666bb29636942d21d4ceb7754a2a0ea779f6f52917bd5216` |
| `fixtures/verification-state/synthetic/flat-act.attached.compact.jws` | 894 | `fa1461923dd306c483020741fb3de75a88144c85539e7dac4a450a5f57f328fa` |
| `fixtures/verification-state/synthetic/flat-act.attached.flattened.json` | 950 | `4efcaf9bafa6f60da92515d099de943ec7a762c0225ca2f77857f52cc8e1cd07` |
| `fixtures/verification-state/synthetic/flat-act.detached-b64false.flattened.json` | 281 | `a3a3d35e670d8aade150253fa1930929d66735fead7fdfaae94cc340c82a49c1` |
| `fixtures/verification-state/synthetic/flat-act.detached.compact.jws` | 206 | `f26a600df80309018fbefebb1ab32044c3e24519dd039a59f85a2bfdc33e38a1` |
| `fixtures/verification-state/synthetic/flat-act.detached.flattened.json` | 245 | `340d2a638d991c525995cbe1d9f664f617041439fbb95fa6186429e93d234ecd` |
| `fixtures/verification-state/synthetic/flat-act.payload.json` | 575 | `27d1c82695194c7480e287158ec03afc74b94bd9c1a7b65f1e7f8ef1ed86a6a9` |
| `fixtures/verification-state/synthetic/flat-halt.attached.compact.jws` | 901 | `3548c4016a95e44a7569459864498bf4535e0db74768626b2401bcdcc26e0da2` |
| `fixtures/verification-state/synthetic/flat-halt.attached.flattened.json` | 957 | `f78f72ea1cd5410501e9eccec22c93ce6f9e50411ea153fb5e9d2068cf30d1bb` |
| `fixtures/verification-state/synthetic/flat-halt.payload.json` | 580 | `22cb283a15f5c2ef8a0a1b694f8ae4e50f22ec6c9ff8545c3525343492839eb6` |
| `fixtures/verification-state/synthetic/tamper-mutated-confidence.attached.flattened.json` | 950 | `a995992ef9fe8efc6bf6f2e9052a6bc05a856bcb2895e09af8ecc6f7537d1dd8` |
| `fixtures/verification-state/synthetic/tamper-mutated-confidence.payload.json` | 575 | `c0b1f909c85cec70b67bed40bee2c22c21707e3b6b390d73a8a6004a9ecc6edd` |
| `fixtures/verification-state/synthetic/tamper-mutated-exp.attached.flattened.json` | 950 | `c1b454be70cc46eddc0e04862e5fbc9dab296ad4fff43b41b58ba4a516e55744` |
| `fixtures/verification-state/synthetic/tamper-mutated-exp.payload.json` | 575 | `74e9c7eec1c799b0678eecf94059a97fa62e3d34b3c27f4b08e79691632be547` |
| `fixtures/verification-state/synthetic/tamper-mutated-gate.attached.flattened.json` | 952 | `3db0c9dc2fce37d010f0bcce7e815811f7683dcfee7b649fbafe622a43325264` |
| `fixtures/verification-state/synthetic/tamper-mutated-gate.payload.json` | 576 | `c84ed5ba49319c0f27a0c0a8d6149e6483db77cdf4541a0003ef723fb77305fb` |
| `fixtures/verification-state/synthetic/tamper-mutated-mapping-hash.attached.flattened.json` | 950 | `f90d7ee88b9613b023178042ad571795a11f098570c36d808eeb4441b347aa60` |
| `fixtures/verification-state/synthetic/tamper-mutated-mapping-hash.payload.json` | 575 | `aea2d52100876efd9c9c93d8685abaae6aeb5799c9eb2203f0d6d32e656d9d1e` |
| `fixtures/verification-state/synthetic/tamper-mutated-signature.attached.flattened.json` | 950 | `ce058db4033a3f2ffb5f81ed1f55a15d297190bf19db35dd38065e35232d1006` |
| `fixtures/verification-state/synthetic/tamper-resigned-confidence.attached.compact.jws` | 894 | `321d4296df1e162ff40242d7ceba55a4a18aef1692131eec0ac7668e628db7cf` |
| `fixtures/verification-state/synthetic/tamper-resigned-confidence.attached.flattened.json` | 950 | `bfe00bb91c6569d30851d05c2bda4267cb166111861745caf01c5584e7b5fd91` |
| `fixtures/verification-state/synthetic/tamper-resigned-confidence.payload.json` | 575 | `c0b1f909c85cec70b67bed40bee2c22c21707e3b6b390d73a8a6004a9ecc6edd` |
| `fixtures/verification-state/synthetic/tamper-resigned-exp.attached.compact.jws` | 894 | `456707972bb76fd28713254e8746f74f5ebdc1363c02fd63cb187b8cdfffb18c` |
| `fixtures/verification-state/synthetic/tamper-resigned-exp.attached.flattened.json` | 950 | `377199944a1cb114f18329b076108e21f8ee8cfeb46bbbc5f7ab7584edb377a6` |
| `fixtures/verification-state/synthetic/tamper-resigned-exp.payload.json` | 575 | `74e9c7eec1c799b0678eecf94059a97fa62e3d34b3c27f4b08e79691632be547` |
| `fixtures/verification-state/synthetic/tamper-resigned-gate.attached.compact.jws` | 896 | `1ee45b00add166c781cbd7baf1a9809c1063383bedeea3c7de4edcfd6b414243` |
| `fixtures/verification-state/synthetic/tamper-resigned-gate.attached.flattened.json` | 952 | `d08572d1b857c034f9f153b093fe808559986ba1da937fdd115bc6e6d67451ea` |
| `fixtures/verification-state/synthetic/tamper-resigned-gate.payload.json` | 576 | `c84ed5ba49319c0f27a0c0a8d6149e6483db77cdf4541a0003ef723fb77305fb` |
| `fixtures/verification-state/synthetic/tamper-resigned-mapping-hash.attached.compact.jws` | 894 | `1ff63c6bf0084f353e9791e2c67cbc3540100ea0fa8f935f669aa5f8bac6103f` |
| `fixtures/verification-state/synthetic/tamper-resigned-mapping-hash.attached.flattened.json` | 950 | `cc86c081f3f6cabfa214e70664161b41cd126ea5afd82eeb674a73ddaeb3b4f6` |
| `fixtures/verification-state/synthetic/tamper-resigned-mapping-hash.payload.json` | 575 | `aea2d52100876efd9c9c93d8685abaae6aeb5799c9eb2203f0d6d32e656d9d1e` |
| `fixtures/verification-state/synthetic/tamper-resigned-mapping-id.attached.compact.jws` | 900 | `14ec1080187af046b658cca3f577f77bc42d3d51501259855338a9d74ba033ef` |
| `fixtures/verification-state/synthetic/tamper-resigned-mapping-id.attached.flattened.json` | 956 | `715785f7e3ccf821d9d47aad7de6274e7ff0de8be9d3485c845690b4adaa5aaa` |
| `fixtures/verification-state/synthetic/tamper-resigned-mapping-id.payload.json` | 579 | `bee79860104ac729c69ee6943f6e33e450d16a0b75ca2fd6307a259a13f7fb5e` |
| `fixtures/verification-state/synthetic/tamper-resigned-missing-mapping-hash.attached.compact.jws` | 776 | `d8f4053cba53b6d24d04defabd4b13dfbff5c47ed15b9957f47ddb66c6b7d9a5` |
| `fixtures/verification-state/synthetic/tamper-resigned-missing-mapping-hash.attached.flattened.json` | 832 | `bf0b101d83324ad5eccc4260c272480f466dfdd98f05c31df812acc333bec154` |
| `fixtures/verification-state/synthetic/tamper-resigned-missing-mapping-hash.payload.json` | 482 | `d279cf8bee840d35d9a5a265b90da92ccd95281917e29a843549c461be074773` |
| `fixtures/verification-state/synthetic/tamper-resigned-recommendation.attached.compact.jws` | 888 | `e93380a69e3a31a051283c38c384d74bd13684399fdaa3cf1176df0abd79a99f` |
| `fixtures/verification-state/synthetic/tamper-resigned-recommendation.attached.flattened.json` | 944 | `151df7695fe80e699759e36337e84e2dc31cceac1a42d5328b8e87c841c00a97` |
| `fixtures/verification-state/synthetic/tamper-resigned-recommendation.payload.json` | 570 | `ad229c582a9da5a78935ec807ef972cdc24b949f0c7b0dfd5b7e76bbf76cb4b6` |
| `fixtures/verification-state/mappings/v0.3.0-2026-05-30.json` | 1776 | `3537254e048589451fe5db227b24413fdd919cb3ed7afc52735b738094d5f2d9` |
| `fixtures/acta/synthetic/alg-mldsa65.receipt.json` | 658 | `eb76c92b353d9a9ecc5f6dfd7d93646a9ab9079eefbb4be86549b9d3f2cc5b89` |
| `fixtures/acta/synthetic/chain-farley/001.receipt.json` | 622 | `24200c6560cef65bdab2fa149105ec14b550c1c656d2516e09c1e5d65a80ccd3` |
| `fixtures/acta/synthetic/chain-farley/002.receipt.json` | 622 | `a7d94456c046eefbca694204ec6288b7c3325da42f34a28b022f1584aea449db` |
| `fixtures/acta/synthetic/chain-farley/003.receipt.json` | 657 | `f6bd3d229e010ff98199e56b07182789ce7a6290631866598d72f059b2371399` |
| `fixtures/acta/synthetic/chain-marques-payload/001.receipt.json` | 622 | `24200c6560cef65bdab2fa149105ec14b550c1c656d2516e09c1e5d65a80ccd3` |
| `fixtures/acta/synthetic/chain-marques-payload/002.receipt.json` | 622 | `b8c1f95f5f40fd25a43b362fbf27d666c8824e4704108f4854696d193e3efce6` |
| `fixtures/acta/synthetic/chain-marques-payload/003.receipt.json` | 657 | `8ddd273eea80428dacc28fc1c3935cdaa76f5226bc9b5a4390d44ce34694219e` |
| `fixtures/acta/synthetic/chain-marques-signing-input/001.receipt.json` | 622 | `24200c6560cef65bdab2fa149105ec14b550c1c656d2516e09c1e5d65a80ccd3` |
| `fixtures/acta/synthetic/chain-marques-signing-input/002.receipt.json` | 622 | `e50663c54d71a1044cdc441d91df517a63ec219d1c53bacb85a61caa42a90169` |
| `fixtures/acta/synthetic/chain-marques-signing-input/003.receipt.json` | 657 | `6d58ce507f2fca1d6b749f26ba2a0babacbb3b110a0d45afd8b8835fbd0a719a` |
| `fixtures/acta/synthetic/chain-mixed-alg/001.receipt.json` | 526 | `4408fd6cd7131ab124a9edeed304de0ba19bbb46dd92d5fc5c036cceedd660d0` |
| `fixtures/acta/synthetic/chain-mixed-alg/002.receipt.json` | 527 | `081bd96f61cd1f939c0f5563bd18ad3c81b61f7f54aed04e666d873ae211681f` |
| `fixtures/acta/synthetic/cleartext.receipt.json` | 654 | `b41c2cfb909d9af230f37a5253ecdfaae91bde1c0b47caebdd346b00de0d9e92` |
| `fixtures/acta/synthetic/cleartext.signing-input.json` | 764 | `86ce34a27f1a2af6381767a980fc93d57d349e109281f0195b9e151633229f12` |
| `fixtures/acta/synthetic/committed-4.disclosures.json` | 1572 | `f5ab0e9ea881b8c489b77d284a70a68566a0b4f1bfdcc81795f63b91bcfae7c1` |
| `fixtures/acta/synthetic/committed-4.receipt.json` | 459 | `5b90588e2a819b87239f453b16b2a39e9c73e276b4d15e2c07833f7885b4c797` |
| `fixtures/acta/synthetic/committed-5.disclosures.json` | 2189 | `0ce7e6bbdc15b87af1c0de3abe2bbf433e27b0989de29193d7880edfbf30da15` |
| `fixtures/acta/synthetic/committed-5.receipt.json` | 459 | `3d5477b311054685942a639c6dc13c228281ea7d3dd0617934c987399c4a54e8` |
| `fixtures/acta/synthetic/malformed-sig-not-hex.receipt.json` | 654 | `3a3334b5dc3119f112409459d37f635096c4ec293ba7f9f179d91febdf3c5b64` |
| `fixtures/acta/synthetic/malformed-sig-nulled.receipt.json` | 454 | `f58821262659229fcb616bcd2f2cefdec17eff311caf0d77c626103c8692d454` |
| `fixtures/acta/synthetic/sigscope-4.1.receipt.json` | 412 | `4861d986a6de4650bf46896427d524473a94926638955c527da226876fabada4` |
| `fixtures/acta/synthetic/tamper-chain-broken.receipt.json` | 622 | `1f3cbd3adb956ceb055249f732cfe80cf1779677c6cda7fa6997ab115f3da5bb` |
| `fixtures/acta/synthetic/tamper-issuer-kid-mismatch.receipt.json` | 412 | `984c23c9cecf52dff52dd14073cbc6f2453cf33713a3161e6844e154ebb4e9da` |
| `fixtures/acta/synthetic/tamper-merkle-proof.disclosures.json` | 1572 | `92772350b2aeecb4e4d46773f34aad6cd902491c7eb61e61b07172a554744e63` |
| `fixtures/acta/synthetic/tamper-merkle-root.receipt.json` | 459 | `c4d063ed64e94f95b572e8e56b92830c727f2f0321e025bd953859492662f1f7` |
| `fixtures/acta/synthetic/tamper-payload-mutated.receipt.json` | 655 | `24d76d54f7ddce93b9f9a188b0cd7a6a55fc4b9a102ce0352fe069848b26b2eb` |
| `fixtures/acta/synthetic/tamper-signature-bitflip.receipt.json` | 654 | `f716a3dd744b7937fcf86f8ba7ba9db2a48a771a12ac50415224606642a07abf` |
| `fixtures/acta/synthetic/unresolvable-kid.receipt.json` | 654 | `d03675e33c90f5fcb9fcbcf813f1f5aa9abc60e3d90ec9e94ec6b1eb013daae7` |
| `fixtures/acta/keys/acta-throwaway.jwks.json` | 943 | `b31e4f4d2a429fe2233a610b163ea96cb9b31d919c94a5217f65aa608848d6d3` |
| `fixtures/keys/test-throwaway-ed25519.jwks.json` | 561 | `4c4146101fa23c6a7fc4f79420667b40b6862751147aea8a5b2067f575fec7bd` |
| `fixtures/keys/test-throwaway-ed25519.seed.txt` | 382 | `2d5f040fc66defc66f6807f6f7700466b8ab402e5b88abbce4b78e4df858c3fd` |


## Appended 2026-09-01 — three `refs/` entries this table did not carry

The opening sentence of this file says every file under `refs/` is a byte-exact snapshot with an
entry here. On 2026-08-30 one tracked draft had no entry — `draft-mih-sokolov-scitt-payload-binding-02`
— and it was the one draft whose author would receive this repository. Two further drafts are added
in the same pass. All three fetched from the IETF archive; all three LF-only; all three digests
computed on the device at the time stated.

| path | bytes | sha256 | retrieved |
|---|---|---|---|
| `refs/draft-mih-sokolov-scitt-payload-binding-02.txt` | 92428 | `47ab675797d7edfe905c13b8482735239d9c5ceb318accbc33e4a5a51e5ec875` | 2026-08-30 (see `cpb/PROVENANCE_T1.md` §1) |
| `refs/draft-marques-asqav-compliance-receipts-08.txt` | 392828 | `ee3ca5d7c0acc1cb9b8025d29f19a7d73991718ca35d3bf4229f7b4264976ec0` | 2026-09-01 |
| `refs/draft-farley-acta-signed-receipts-03.txt` | 96433 | `bcde71799a621305254ea8b442fc829ac6d65fcff039f365e8a2349d8e902f19` | 2026-08-31 |

Flagged, not changed: fourteen entries above cite `ScopeBlind/agent-governance-testvectors/HEAD/`,
a moving ref. `tools/snapshot.mjs` pins the TKCollective source by commit and not this one. Those
entries remain true of the bytes they describe; they cannot be re-fetched to the same bytes.

## Appended 2026-09-02 — the Insight execution-receipt package and the live key registry

Two files pinned for `src/adapters/insight.ts`. The package arrived as an email attachment and was
copied from `cc-output` unchanged; the registry was fetched **once**, from the URL the package itself
names, and the bytes below are the bytes that arrived. It is deliberately not re-fetched: the pin is
the point, and the divergence recorded underneath is only visible because it is pinned.

| path | source | retrieved (UTC) | bytes | sha256 |
|---|---|---|---|---|
| `fixtures/insight/execution-receipt-bytes-2026-09-02.json` | attachment to YuTao Peng's email of 2026-09-02T06:08:45Z, via `cc-output/insight-2026-09-02/execution-receipt-bytes-2026-09-02-headless.json` | 2026-09-02T05:41:12.092Z (the package's own `meta.generatedAt`) | 25151 | `b96ff0b3ec923b77a38553a00f44b9e6949683b6503cfcc13589071b806854ba` |
| `refs/insight-oracle-keys-2026-09-02.json` | https://www.oracleinsight.xyz/.well-known/oracle-keys.json | 2026-09-02T09:09:25Z–09:09:34Z (HTTP 200, `application/json`) | 9482 | `9269529e7f584ddd54d8ea0210af9820ee082b968492fcbb25b798fab7a88006` |

**What the registry pin confirms.** Its `public_keys` array is byte-equal to the package's
`publishedKeys.publicKeys` (two keys, identical values), reproducing the Lead's ~07:25Z observation at
09:09Z. `OracleSafetyCheck` is `schemaVersion` 2, domain version "2", 26 fields — and its field list is
identical to the Lead's 07:25Z rendering.

**What the registry pin contradicts, recorded not resolved.** `ExecutionReceipt` in these bytes is
`schemaVersion` **1 with 43 fields**. The Lead's `VERIFICATION_NOTE_2026-09-02` A8 records the
registry's published `ExecutionReceipt` as identical in name and order to the package receipt's 32
fields, and B6 as "same 32 fields". The 43-field type adds `claimRole`, `subject`, `taker`,
`destinationPreTradeUid`, `preTradeUidsHash`, `priceScale`, `quoteBasis`, `quoteBlockNumber`,
`quoteVenueIndependent`, `measuredFieldsHash`, `priceExecutionStatus`, `attestationAgeAtExecSeconds`
and `priceStateAgeAtExecSeconds`, and does not carry the package's `executionStatus` or
`oracleDataAgeAtExecSeconds`.

Two readings fit, and this device cannot separate them:

1. the live document changed between 07:25Z and 09:09Z **without the `schemaVersion` moving off 1** —
   a silent breaking change to a published type; or
2. the Lead's rendering of the `ExecutionReceipt` entry was taken from the package rather than from the
   registry, which would make A8 a comparison of the package against itself.

The control that makes this worth writing down: the Lead's rendering of `OracleSafetyCheck` **does**
match the live bytes exactly, so the rendering method was capable of being faithful. Whichever reading
holds, `test/insight.test.ts` asserts the field list in the pinned bytes and the adapter reports
`registry_schema: mismatch` for the receipt against this registry — never a match asserted against a
document that does not say so.

## Appended 2026-09-03 — Insight's repaired package (schema v3) and the second registry pin

The 06:08Z package above is superseded for signing but NOT withdrawn: the tool must verify both and say
which is which, so both stay pinned and both stay in the suite. The registry was fetched **once**, again,
at a named UTC minute; the 09:09Z pin is kept beside it. Neither is re-fetched.

| path | source | retrieved (UTC) | bytes | sha256 |
|---|---|---|---|---|
| `fixtures/insight/execution-receipt-bytes-2026-09-02-repaired.headless.json` | attachment to YuTao Peng's 10:04 local mail, via `cc-output/insight-2026-09-02/execution-receipt-bytes-2026-09-02-headless-repaired.headless.json` | 2026-09-02T09:53:54.871Z (the package's own `meta.generatedAt`) | 39871 | `e4a11b4de20a4dfdfdbaee29dadc1f7126b0b36c130bf6ba3c6a7ff5578eb89a` |
| `refs/insight-oracle-keys-2026-09-02T1154Z.json` | https://www.oracleinsight.xyz/.well-known/oracle-keys.json | 2026-09-02T11:54:27Z (HTTP 200, `application/json`, 14854 bytes downloaded) | 14854 | `21675e382e6ead969d3b3fb823b3199327283152ab241be27d9c5b7177de23eb` |

**What the second registry pin confirms**, against the founder's ~11:3xZ browser capture
(`cc-output/insight-2026-09-02/registry_founder-capture_2026-09-02T113xZ.json`, held as content, not as
a digest): `ExecutionReceipt` is published at `schemaVersion` 3 with 43 fields and domain
`{name "Insight Execution", version "1", chainId 1, environment "production"}`; `ExecutionReceiptV2`
(32 fields, `schemaVersion` 2) and `ExecutionReceiptV1` (30, 1) are retained and `retiredForSigning`;
`OracleSafetyCheck` is published at `schemaVersion` 3, domain version "3", 27 fields, with
`OracleSafetyCheckV2` (26) and `OracleSafetyCheckV1` (11) retained and `retiredForSigning`;
`public_keys` carries the same two keys as every earlier observation. Field-for-field, the published
`ExecutionReceipt` v3 type is identical to the repaired package's receipt type, and the published
`OracleSafetyCheck` v3 type is identical to both packages' gate type.

**Where the live bytes differ from the capture, recorded and not reconciled.** The capture renders each
retired entry as a field COUNT (`"fields": 32`); the live bytes carry the retired entries' full
`eip712.types`, keyed by the bare primary type (`ExecutionReceiptV2.eip712.types.ExecutionReceipt`).
The live bytes also carry `issuer`, `mic`, `revoked_keys`, `attestation_enabled`, `OracleSafetyRecheck`,
`OracleWatchCheck`, `OracleWatchCheckV1`, `CanonicalPreTradeRequest` and the endpoint URLs, none of
which appear in the capture, and each `public_keys` entry carries `algorithm`, `validFrom` and
`revoked` beyond the capture's three members. Every count and version the capture states is reproduced
in the live bytes; the capture is an abridged rendering, and it is the rendering that differs, not the
document. The expectation is left as the handoff wrote it.

**What the second pin says about the first.** At 09:09Z `ExecutionReceipt` was 43 fields under
`schemaVersion` **1** — a 43-field v3 type published under the v1 number, with no V1/V2 entries beside
it. At 11:54Z the same 43 fields are published under `schemaVersion` 3 with V2 and V1 retained and
retired. The 09:09Z state was the regression; it is confirmed corrected, and both pins are kept so the
correction is visible in bytes rather than asserted.

**Flagged, not fixed (outside this handoff's scope).** `git check-attr text` reports `text: set,
eol: lf` — not `unset` — for both files above and for both 2026-09-02 pins, because `.gitattributes`
orders `*.json text eol=lf` AFTER `fixtures/** -text` and `refs/** -text`, and the last matching line
wins. It is harmless for these four files: all are LF-only, and each one's git blob was verified here
to hash to the same sha256 as the bytes on disk. It would not be harmless for a snapshot that
legitimately contained CRLF, which is exactly what those two lines were written to protect.

**Correction 2026-09-02.** This section was appended on 2026-09-02 (commits 7506c18 12:17:39Z and ff1639e 12:20:23Z), not 2026-09-03. The handoff and report files (`CC_HANDOFF_2026-09-03_insight-adapter-v3-addendum.md`, `CC_REPORT_2026-09-03_insight-adapter-v3.md`) carry the date the work was scheduled for, not the date it ran.

## Appended 2026-09-02 — the Asqav SDK conformance vectors at the commit -08 pins

For the `-08` rerun (`FINDINGS-rerun-2026-09-02.md`). `draft-marques-asqav-compliance-receipts-08`
names its own vector corpus in the reference section at lines 6109-6111 of the pinned text:

> [ASQAV-SDK]  Asqav, "asqav-sdk: Verifier Conformance Vectors", 2026,
>              <https://github.com/jagmarques/asqav-sdk/tree/05c1c49>.

**Provenance note, stated because it is a deviation.** The rerun handoff instructed that the SDK
repository URL be taken from `cc-output/errata-farley-marques/marques-evidence.md`. That file names
only the two IETF archive URLs and `github.com/ScopeBlind/agent-governance-testvectors`; it carries no
Asqav SDK URL. The URL above was read from the `-08` bytes pinned in `refs/` (sha256
`ee3ca5d7c0acc1cb9b8025d29f19a7d73991718ca35d3bf4229f7b4264976ec0`), which is a byte-pinned source and
not a guess, on the founder's instruction of 2026-09-02. It was not taken from a rendered GitHub page.

Cloned by `git clone` (the one third-party endpoint this rerun was permitted) and checked out at:

| field | value |
|---|---|
| commit | `05c1c49402dc933ea7ada039ce5c87213b89de89` |
| author date | 2026-08-30T23:09:05+02:00 |
| commit date | 2026-08-30T23:09:05+02:00 |
| subject | `feat(vectors): publish the selective-omission conformance vectors (#428)` |

That commit is the one that added the three selective-omission vectors (`asqav-14-omitted-action-chain`,
`asqav-15-unsigned-gap`, `asqav-16-chain-emission-blocked`), which is what it was described as.

`ls-tree-verifier-conformance-vectors.txt` is `git ls-tree -r HEAD verifier/conformance-vectors/` at
that commit: 211 entries with mode, type and blob id, sha256
`eb040de0f8ce9af8ffad85bc07d3a155f6f9d8609be5fecd57ed99f7b625789f`.

**How these bytes were extracted, and why it matters.** `core.autocrlf` is `true` on this machine, so
the working tree of the clone is CRLF-rewritten and every file in it digests to a value no one else
would reproduce. Each file below was therefore extracted with `git cat-file blob <id>`, and each
`sha256` was verified equal to `git cat-file blob <id> | sha256sum` before being written here. A copy
taken from the checkout instead would have pinned the mangled bytes; the first attempt in this session
did exactly that and was discarded.

| path (under `fixtures/asqav/05c1c49/`) | blob id at 05c1c49 | bytes | sha256 |
|---|---|---|---|
| `conformance/vectors.json` | `4dfde9819fc3c197dd38d3e51c78d8e2f6dd723e` | 31790 | `2b260f4efc0f3ada078cf98108d04ea9d3491bf7c684e9d97dac567ec289dd6a` |
| `verifier/conformance-vectors/asqav-01-genesis-permit/receipt.json` | `5909477673b2ffe8a970626d3e3328007e603b3d` | 832 | `c02fd4fc8cc26d4784b99515f84d2c61faec8f8d18c1ce6ae72f7406ac3cf084` |
| `verifier/conformance-vectors/asqav-01-genesis-permit/expected.json` | `e49c143f485c38335565f395933ae1b9a9bfde9e` | 199 | `72257a48afe336d13b589dccbcdf83743d80437dee729954d0a9494e915e9fbf` |
| `verifier/conformance-vectors/asqav-01-genesis-permit/jwks.json` | `a97b747dd4258c523b822209dd8279c6b5ed45dd` | 217 | `233a208e9564acea9f24faa2ffaa8bebce04d752bee685e581eef16c2b9c51a4` |
| `verifier/conformance-vectors/asqav-03-chain-link/receipt.json` | `46dbac464ae40cc3005d934198276ed203172ab0` | 834 | `f9f29b753d19c4cb5d518ac6d73c436685279aeab92a085c699c2de8a4598085` |
| `verifier/conformance-vectors/asqav-03-chain-link/predecessor.json` | `5909477673b2ffe8a970626d3e3328007e603b3d` | 832 | `c02fd4fc8cc26d4784b99515f84d2c61faec8f8d18c1ce6ae72f7406ac3cf084` |
| `verifier/conformance-vectors/asqav-03-chain-link/expected.json` | `604b27af19bf5b03e8679e1fdaa7af3d65a10a85` | 203 | `59cf35472dcc75f090840ba3b126bc963f41783d27192f21ffdb93aae905446d` |
| `verifier/conformance-vectors/asqav-03-chain-link/jwks.json` | `a97b747dd4258c523b822209dd8279c6b5ed45dd` | 217 | `233a208e9564acea9f24faa2ffaa8bebce04d752bee685e581eef16c2b9c51a4` |
| `verifier/conformance-vectors/acta-02-chain-link/receipt.json` | `17bfb6b25b07ce9e2d63934ce0f32088d3e03d44` | 626 | `50a6937e41bb7b82f9bb5f78548cd7681ff107faff839c644ad962c438d706bd` |
| `verifier/conformance-vectors/acta-02-chain-link/predecessor.json` | `b9f032a6a3e5d66195f92aa00a0c1a4fd08708e9` | 531 | `3dc3b36962eb8b27efc56d53b2b87fe75b88781c00111b660aad4808d8f4706d` |
| `verifier/conformance-vectors/acta-02-chain-link/expected.json` | `a98411ee912e8b5051bdfffe334fcbee68bd3a91` | 160 | `038c708ecb2ccbda46730be02d62ae287c74964b4a348fe3f6716c27fb25aa62` |
| `verifier/conformance-vectors/acta-02-chain-link/acta-keys.json` | `d3cb11e4a829d22ec715303d5b6f5b056cd32ed7` | 179 | `4f3dafaf1e2db10e23a389c7d85035b1e09a4308509e2314b464228b258445b6` |

`asqav-01-genesis-permit/receipt.json` and `asqav-03-chain-link/predecessor.json` are the same blob —
the genesis receipt is the chain link's predecessor — and so carry one digest between them.

Only the files this rerun reads were copied; the other 199 entries of the vectors directory stay in
`ls-tree-verifier-conformance-vectors.txt` by blob id and were not snapshotted.

**Same `.gitattributes` flaw as the 2026-09-02 Insight entries, same harmlessness, recorded again.**
`git check-attr text eol` reports `text: set, eol: lf` for the `.json` files above, because
`*.json text eol=lf` still sorts after `fixtures/** -text` and the last matching line wins. Harmless
here: every file above is LF-only and each one's staged blob was verified to hash to the sha256 in the
table. It remains unfixed, and it remains the flaw that would corrupt a snapshot legitimately
containing CRLF.

## Appended 2026-09-02 — the two Asqav SDK states either side of `#416`, pinned for M6

`FINDINGS-rerun-2026-09-02.md` M6 identifies the published
`counterparty_binding.envelope_hash` `0d6c88a1…` as the three-key digest of the peer envelope as it
stood before SDK commit `ee8a3e7` (PR #416, 2026-08-04 21:03:12 +0200). That identification was made
against a clone in a session scratchpad. A clone is not evidence this repository holds — it can be
rewritten upstream, and this machine keeps no history for `asqav-sdk`, only the `05c1c49` snapshot,
which by construction cannot show the change that caused M6. The two states either side of `#416` are
therefore pinned here, and `test/acta.test.ts` re-derives the identification from them.

Taken with `git cat-file blob <commit>:conformance/vectors.json` from a clone of
`https://github.com/jagmarques/asqav-sdk`, never from a worktree: `core.autocrlf` is `true` on this
machine and a checkout would rewrite the bytes these digests pin.

| fixture path | commit | date | upstream blob | bytes | sha256 |
|---|---|---|---|---|---|
| `fixtures/asqav/history/4cbdfc0/conformance/vectors.json` | `4cbdfc01a69017e39e060bc1f0d63e6c55027aa6` | 2026-07-28 12:53:24 +0200 | `01d9512e6f288db1702bd2a16ef0a21ceba08968` | 31633 | `68610d93ea1dda19176b6a68a5293d07bbc38118e5c4fc725b8b9a639839fa3a` |
| `fixtures/asqav/history/ee8a3e7/conformance/vectors.json` | `ee8a3e761cf7dc525a43111e04c19c4878ac6db9` | 2026-08-04 21:03:12 +0200 | `4dfde9819fc3c197dd38d3e51c78d8e2f6dd723e` | 31790 | `2b260f4efc0f3ada078cf98108d04ea9d3491bf7c684e9d97dac567ec289dd6a` |

`4cbdfc0` is *"feat(sdk): authoritative code-authorship path with advisory client digest (#394)"*, the
last state of the file before `#416`; `ee8a3e7` is `#416` itself, the first state after it. The
`upstream blob` column is the blob id the SDK repository holds for that path at that commit, so a
third party can check the pin with one `git rev-parse <commit>:conformance/vectors.json` and no
digesting.

**`ee8a3e7` and `05c1c49` are the same upstream blob** — `4dfde98…`, byte-identical to
`fixtures/asqav/05c1c49/conformance/vectors.json` pinned in the section above — because `ee8a3e7` is
the last commit to touch `conformance/vectors.json` before `05c1c49`. It is stored again under its own
commit rather than aliased: what the M6 test asserts is the state at each commit, and a reader
checking `ee8a3e7` should not have to know that `05c1c49` happens to stand in for it. The duplication
is 31790 bytes and is deliberate.

**Same `.gitattributes` flaw as the entries above, same harmlessness, recorded again.**
`git check-attr text eol` reports `text: set, eol: lf` for both files, because `*.json text eol=lf`
still sorts after `fixtures/** -text` and the last matching line wins. Harmless here: both files are
LF-only — `grep -c $'\r'` returns 0 for each — and each staged blob was verified to hash to the sha256
in the table above and to carry the upstream blob id. It remains unfixed, and it remains the flaw that
would corrupt a snapshot legitimately containing CRLF.

**What would turn the pin red.** `test/acta.test.ts` asserts both sha256 values before it digests
anything, and a control in the same block mutates one byte of the `4cbdfc0` bytes in the test's own
copy and requires the digest to stop reaching `0d6c88a1…`. Both were exercised the other way round
before the commit: one byte of the `4cbdfc0` fixture was changed on disk, five of the block's six
tests failed, and the file was restored from the blob. The sixth reads only the post-`#416` fixtures,
which is why it stayed green.

## Appended 2026-09-02 — `3e13a0d`, the commit that seeded the vector, pinned to date M6

The section above pins the two states either side of `#416` and establishes *which* bytes produce the
published `0d6c88a1…`. It does not establish *when* the literal stopped matching, because the state
before `4cbdfc0` was not in the repository: the identification sweep found the value unchanged back to
`3e13a0d`, but that evidence lived in report prose rather than in the suite. `3e13a0d` is
`feat(conformance): seed counterparty_binding vectors (#197)`, the commit that created the vector.
With it pinned, the finding is dated from bytes this repository holds.

Taken with `git cat-file blob 3e13a0d:conformance/vectors.json`, never from a worktree, for the same
`core.autocrlf` reason as the entries above.

| fixture path | commit | date | upstream blob | bytes | sha256 |
|---|---|---|---|---|---|
| `fixtures/asqav/history/3e13a0d/conformance/vectors.json` | `3e13a0d8b18e1543404a4ef9f1bca46b8602ac81` | 2026-05-18 20:35:36 +0000 | `abc752f371c6c6abb3e9054730fd102f0a84eaf6` | 28970 | `c1f87953fd17143780a07ddade63d715a7dab7a328b2080fafb9c791ef87d68a` |

The blob id was confirmed with `git rev-parse 3e13a0d:conformance/vectors.json` against the upstream
clone before the file was written, and `git rev-parse HEAD:<path>` returns the same id after the
commit, so this pin is checkable upstream without digesting anything. 20 vectors at this commit,
against 21 from `4cbdfc0` onward.

**What the bytes say.** At `3e13a0d` the three-key digest of
`counterparty_binding_envelope_byte_equality.input` is
`0d6c88a16e96fd3429be13e44dc957062f77d417dc0c3ea28e4fa496230de2a9` and the `envelope_hash` published
in `counterparty_binding_happy_path` decodes to the same value. **The literal was correct when it was
first written.** `payload.previousReceiptHash` is the `sha256:`-prefixed genesis seed, the member
`#416` later changed. A member-by-member diff of the envelope at `3e13a0d` against `4cbdfc0` is empty:
the envelope did not move between seeding and the last state before `#416`, so the value was correct
for the whole of its pinned life until that commit.

This changes what M6 is. Not a value that never matched anything and had to be searched for — a
derived literal that was right on the day it was written, stayed right for 78 days, and went stale at
one commit that edited its input and did not recompute it. The defect has a date: `ee8a3e7`,
2026-08-04 21:03:12 +0200.

**Same `.gitattributes` flaw, same harmlessness, recorded a third time.** `git check-attr text eol`
reports `text: set, eol: lf` for this file too. It is LF-only (`grep -c $'\r'` returns 0) and its
staged blob was verified to carry the upstream blob id and the sha256 above.

**What would turn this pin red.** `test/acta.test.ts` asserts the sha256 before digesting, and a
control mutates one byte of these bytes in the test's own copy and requires `0d6c88a1…` to stop being
reachable. Exercised the other way before the commit: one byte of this fixture was changed on disk,
five of the block's tests failed — the byte pin, the "correct when first written" pair, the genesis
seed assertion, the `4cbdfc0` test (which also asserts the empty diff against this commit), and this
commit's own control — and the file was restored from the blob.

## Appended 2026-09-02 — the digest walker's scope registry, and what it covers

`walker/scopes.json` records, for every pinned corpus, the byte scope its own governing document names
for each declared digest, with the document and line range. `tools/walk-digests.ts` recomputes each one
and reports `match` / `mismatch` / `unregistered` / `serializer_disagreement`. This section records what
the registry covers on the day it was written, so a later coverage change is visible as a diff rather
than as an unremarked drift.

Counts from the run on this commit's corpora:

| corpus | registered | declared | inferred | match | mismatch | unregistered |
|---|---|---|---|---|---|---|
| `acta/published` | 1 | 1 | 0 | 1 | 0 | 10 |
| `acta/synthetic` | 5 | 3 | 2 | 5 | 0 | 70 |
| `asqav/05c1c49` | 54 | 12 | 42 | 44 | **10** | 44 |
| `asqav/history/3e13a0d` | 50 | 10 | 40 | 50 | 0 | 22 |
| `asqav/history/4cbdfc0` | 52 | 10 | 42 | 52 | 0 | 28 |
| `asqav/history/ee8a3e7` | 52 | 10 | 42 | 42 | **10** | 28 |
| `cpb` | 0 | 0 | 0 | 0 | 0 | 0 |
| `delivery` | 21 | 0 | 21 | 21 | 0 | 70 |
| `evidence-action` | 7 | 7 | 0 | 7 | 0 | 49 |
| `insight` | 0 | 0 | 0 | 0 | 0 | 0 |
| `verification-state` | 11 | 11 | 0 | 11 | 0 | 95 |
| **total** | **253** | **64** | **189** | **233** | **20** | **416** |

`declared` means the cited document states that scope for that field; `inferred` means the document is
silent and the scope was taken from the corpus's own self-description, with that source named in the
registry entry. The 20 mismatches are M6 and nothing else: the stale `envelope_hash` in the five
`counterparty_binding_*` vectors, at the two commits where it is stale and at neither of the two where
it is not.

**416 unregistered fields is the honest number, and it is the interesting one.** They are counted and
listed by JSON pointer in `walker/report.json`, never silently skipped, and they do not fail the run —
a field whose scope no document states is not a field this repository can call wrong. The bulk of them:

- **`insight/`** — every digest-shaped value is a `0x`-prefixed EVM word (keccak-256 transaction, gate
  request and reason-code hashes). Not SHA-256 over JCS, no governing document in `refs/`, preimages
  not in the corpus.
- **`evidence-action/` and `delivery/` `request_commitment`** (34 fields) — `SPEC.md` defines it as
  `"sha256:" + hex(SHA-256(JCS(request_descriptor(event))))` at lines 35 and 111 but **never defines
  `request_descriptor`**. The construction is unexecutable as written. Recorded as a documentation gap,
  not worked around.
- **`verification-state/` `v_gate_mapping_hash`** — content-addressed by design; recomputable only for
  the mapping documents the corpus holds. 11 resolve against `fixtures/verification-state/mappings/`
  and are checked; the rest name documents this repository does not hold, so there is nothing to
  disagree with.
- **`cpb/`** — TypeScript sources and Markdown result tables, no JSON corpus data; its 64-hex tokens sit
  in prose and code, not in fields addressable by JSON pointer.
- The remainder are payload members (`policy_digest`, `action_ref`, `payload_digest`, `args_hash`,
  `claim_hash`, `skill_hash`, key thumbprints) whose preimages are not in the corpus.

**Two registry errors were found by the corpora and corrected before this was committed**, both mine
and neither a corpus defect. First, the envelope-resolution rule initially followed only
`originating_envelope_ref` and so missed two of M6's five vectors; the corpus's own description strings
name the originating envelope for the other two, and the rule now says so explicitly and marks that
step `inferred`. Second, the genesis construction hardcoded `v: "evidence.action/0"` while `delivery/`
declares `evidence.action/1`, which produced four false mismatches; the construction now uses the
record's own `v` token, which is what `SPEC.md` §6 means by the format version, and all four match. The
digest scopes themselves were never changed to make a result go away.

## Appended 2026-09-02 — Insight's domain-repaired package (schema v4), the 15:45Z registry pin, and the production sample

Round 3 of the Insight execution-receipt review (`VERIFICATION_NOTE_2026-09-02_insight-execution-receipt-v4-round3.md`).
v4 moves `environment` out of the EIP-712 domain, where v3 declared it without signing it, and into the
signed message as the 44th field. The domain is back to the three standard members, so the standard
EIP-712 path verifies the receipt and no custom encoder is involved.

All four files were pinned from bytes already on disk; nothing was re-fetched by this session. The
three inputs were checked against the digests the handoff states **before** anything was copied, and
they matched exactly.

| path | source | bytes | sha256 |
|---|---|---|---|
| `fixtures/insight/execution-receipt-bytes-2026-09-02-v4.json` | attached to Yu's 15:34Z mail, uploaded by the founder 15:50Z | 44472 | `fb403a85d6bd9af3ce7243cdae0b753a53a4a5cad816efde3a3ffc247bd98781` |
| `refs/insight-oracle-keys-2026-09-02T1545Z.json` | registry, pinned as bytes 15:45:42Z | 17019 | `76522cd33edcb94a822a82cf6c70013f9d34489a39447912c28d8336fcc87ae2` |
| `fixtures/insight/execution-sample-2026-09-02T1546Z.json` | production sample endpoint, pinned as bytes 15:45:58Z | 4675 | `a3698a472f72578170266f6be42ae4c46ad6c7bd4e1f9f58309be5bfd9c6263a` |
| `fixtures/insight/execution-sample-attestation-2026-09-02T1546Z.json` | `data.attestation` extracted from the row above | 6471 | `da6cdb0b71b7864d870614be661dfc1abda497ef78bd477c95785aadee3deb21` |

The fourth file is **derived, not fetched**, and is marked as such here because it is the only file in
this table that no endpoint ever served. The adapter reads a single attestation object, and the sample
endpoint wraps its attestation in a envelope carrying `isSample`, a `note` and verification URLs. The
extraction is `data.attestation` re-serialised with two-space indent; `test/insight.test.ts` asserts
that the pinned copy deep-equals the wrapper's own `attestation` member, so the derived file cannot
drift from the fetched bytes it came from.

**The wrapper is pinned as well as the attestation, deliberately.** It would have been smaller to keep
only the attestation. The wrapper is the evidence for H8: the word SYNTHETIC appears in
`data.note` and nowhere in the 44 signed fields, and that gap is only visible if both halves are here.

**Same `.gitattributes` flaw as the earlier Insight and Asqav entries, same harmlessness, recorded
again.** `git check-attr text eol` reports `text: set, eol: lf` for these paths because `*.json text
eol=lf` sorts after `fixtures/** -text` and the last matching line wins. Harmless here: all four files
are LF-only (`grep -c $'\r'` returns 0 for each) and each staged blob was verified to hash to the
sha256 in the table above.

**Registry state at this pin.** `ExecutionReceipt` is published at `schemaVersion` 4;
`ExecutionReceiptV3` carries `retiredForSigning: true`; V2 and V1 are retained and retired. Two
production keys are listed: `insight-oracle-safety-v2` with `validUntil` 2026-09-02T17:35:36Z, and
`insight-oracle-safety-v2-202609` (`0x6506F789Edd43338A416f59822A63F309f97E8ce`, open-ended), which is
the key the production sample signs with. The rotation completes after 17:36Z, so **this pin is
pre-rotation** and a later pin will be needed for the post-rotation entry (the Lead's B3).

## Appended 2026-09-03 — the post-rotation Insight pins (17:41Z), and why the same registry is pinned twice

`insight-oracle-safety-v2` published `validUntil` 2026-09-02T17:35:36.000Z. The Lead fetched the
registry again at 17:42:02Z, six minutes after that instant, and a fresh production sample at
17:42:04Z. Both were pinned as bytes to `C:\Users\User\cc-output\pins\` and copied here from those
files; nothing was re-fetched by the session that committed them, and each input was hashed against
the digest the handoff states **before** it was copied.

| path | source | bytes | sha256 |
|---|---|---|---|
| `refs/insight-oracle-keys-2026-09-02T1741Z.json` | registry, pinned as bytes 17:42:02Z | 17019 | `76522cd33edcb94a822a82cf6c70013f9d34489a39447912c28d8336fcc87ae2` |
| `fixtures/insight/execution-sample-2026-09-02T1741Z.json` | production sample endpoint, pinned as bytes 17:42:04Z | 4675 | `d4bad431e7c330f30dc4fc8a4edb14fd3fa3a0d748903c2516b056a9a9754716` |

**The registry file is byte-identical to `refs/insight-oracle-keys-2026-09-02T1545Z.json`** — same
sha256, same 17,019 bytes — and it is kept anyway, because the HOUR is the evidence. One pin taken
before a rotation cannot say what the registry did at the rotation; two pins with the same digest
either side of 17:35:36Z can, and what they say is that **the registry does not change on expiry**.
`insight-oracle-safety-v2` is still in `public_keys` at 17:42Z with its `validUntil` in the past and
`revoked: false`, which is what the registry's own `key_rotation_policy` means by "retaining prior key
with validUntil for overlap". `test/insight.test.ts` asserts the byte-equality directly, so if the
registry ever does drop or rewrite a retired key, that assertion is what goes red.

The sample is **not** a duplicate: it is a fresh fetch, `signedAt` 2026-09-02T17:42:03.934Z, signed by
`0x6506F789Edd43338A416f59822A63F309f97E8ce` (`insight-oracle-safety-v2-202609`) — the key that took
over at the rotation. Its digest differs from the 15:46Z sample's, and the suite asserts that too.

**Same `.gitattributes` ordering flaw as every earlier Insight entry, same harmlessness, recorded
again.** `git check-attr text eol` reports `text: set, eol: lf` for both paths because `*.json text
eol=lf` sorts after `fixtures/** -text` and the last matching line wins. Harmless here: both files are
LF-only (`grep -c $'\r'` returns 0 for each) and each staged blob was verified to hash to the sha256 in
the table above.

### B-29: an expired key was resolving as a published identity, and now does not

Reading the resolver to write the pin's tests turned up a defect in **this tool**, not in the registry.
`parseRegistry` read `key_id`, `public_key` and `revoked` off each `public_keys` entry and dropped
`validFrom` and `validUntil` on the floor; check 5 (identity) then matched on address alone. The
`validUntil` the adapter did apply against `--now` was the *artefact's* own (check 7, freshness), which
is a different member of a different document.

The consequence, as a control on the unmodified code at `444b676`: the pinned 06:08Z package, run
against a registry that lists its signer with `validUntil` forty minutes before `--now`, returned
**VALID** with `identity: signer_in_registry`. Three assertions were red before the fix and green
after; the two cases that pass either way (an open window, and `validUntil: null`) are there as
controls, and on the old code they passed for the wrong reason — no window was being read at all.

The fix adds `validFrom`/`validUntil` to the parsed key and a pure, exported
`resolveRegistryKey(registry, address, now)` that returns `not_found | valid | expired |
not_yet_valid | window_malformed`. A closed window is `UNVERIFIABLE/expired` at check `identity` and
prints no key line; before `validFrom` it is `UNVERIFIABLE/not_yet_valid`; a window member that is
present but is not an ISO-8601 instant is `UNVERIFIABLE/malformed_member` rather than being read as
open-ended. UNVERIFIABLE and not INVALID, because nothing here says the signature is bad — only that
the registry no longer vouches for the key **at the instant asked about**. `--allow-unregistered-signer`
does not waive it: the key is registered and its window is shut, which is a different fact from an
unpublished signer. The way to verify a receipt signed before a rotation is to pass the instant it was
signed at as `--now`, which the resolver already honours because it reads no clock of its own.

Cases (a)–(c) of the handoff are asserted against the pinned 17:41Z registry bytes through
`resolveRegistryKey`, which is resolution only and needs no Insight key material: at 1788370900
(17:41:40Z) `0xa268676C85b927D64a4e2384636874f76D69e419` is `expired`; at 1788363000 (15:30Z) the same
key is `valid`; `0x6506F789Ed…`, whose `validUntil` is `null`, is `valid` at both. The verdict path is
exercised end to end with the throwaway signer the corpus already carries, over a registry built in the
test from the pinned 09:09Z bytes with `public_keys` replaced — nothing is re-signed and no Insight key
material is used.

**What this still does not do, recorded rather than fixed here.** `revoked: true` is reported as the
annotation `identity_revoked` and does **not** move the verdict — a revoked key still resolves as a
published identity and can still reach VALID. That is the same class of defect B-29 was, it is out of
this handoff's scope, and it is left as a finding rather than fixed quietly.

**Correction 2026-09-03 (C-2026-09-03-1).** The paragraph above says `revoked: true` does not move the
verdict. That was true when it was written and is no longer true: commit `5cf2e1a` makes a revoked key
`UNVERIFIABLE/key_revoked` at check `identity`, on both channels the registry publishes revocation on.
The original text is not edited; the next section is what now holds.


## Appended 2026-09-03 — the revoked-key gap, closed the same way, on both channels

The section above recorded a gap and left it open: `revoked: true` was reported as the annotation
`identity_revoked` and did not move the verdict, so a key the issuer had withdrawn still resolved as a
published identity and could reach VALID. That is now fixed, and the same red-then-green discipline was
used: five assertions failing against `f495e13`'s own source through the public adapter API, green after.

**There were two revocation channels, and the tool read neither.** The registry publishes revocation as
`revoked` on each `public_keys` entry **and** as a top-level `revoked_keys` array, which `parseRegistry`
did not read at all. Honouring one of two channels is the same as honouring neither for whichever key the
issuer happened to withdraw on the other, so both are read now and either one revokes.

`resolveRegistryKey` gains `revoked` and `revocation_list_unreadable`, both checked **before** the window:

- either channel → `UNVERIFIABLE` / **`key_revoked`**, at check `identity`, no key line printed.
- `key_revoked` is a new member of the published `ReasonCode` union rather than a reuse of
  `key_unresolvable`. "No such key" and "this key must not be trusted" call for different actions, and a
  consumer that cannot tell them apart cannot act on either. The addition is additive: a consumer
  branching on the older members falls through to its default, which is the fail-closed side of an
  UNVERIFIABLE. Nothing in this repository enumerated the union exhaustively, so no assertion had to be
  widened to accept it — which is itself worth saying, because it means the vocabulary had no guard.
- **Revocation outranks a closed window**, and the order is deliberate: a withdrawn key is withdrawn at
  every instant, so reporting `expired` for a key that is also revoked would name the weaker fact and
  leave a caller thinking a different `--now` would fix it. The detail on `key_revoked` says explicitly
  that no `--now` recovers it, where the `expired` detail invites exactly that re-run.

**The assumption in reading `revoked_keys`, stated rather than hidden.** `revoked_keys` is `[]` in all
four registry pins in `refs/`, and every `public_keys` entry in all four carries `revoked: false` — both
asserted in `test/insight.test.ts`, so the reason these cases are synthetic is in the suite and not only
here. No document we hold says what a populated entry looks like. Two shapes are read: a bare string
(matched against both the address and the `key_id`) and an object carrying `public_key` and/or `key_id`.
An entry in any other shape — or a `revoked_keys` member that is not an array at all — is **not skipped**:
it blocks every key in that registry with `UNVERIFIABLE/malformed_member`, because an entry that cannot be
read cannot be shown *not* to name the signer being checked. An absent `revoked_keys` is not an unreadable
one, and resolves normally. Guessing further shapes would have been worse than saying the list was not
understood; if Insight ever populates it, these bytes are what the shape should be checked against.

**One conditional was deleted rather than left in place.** `if (res.key.revoked) ann["identity_revoked"] =
true` survived in the `valid` and `expired` branches after revocation moved ahead of both. Neither can
fire any more, and a conditional that cannot fire reads as a check while covering nothing, so both are
gone. `identity_revoked` is now set only on the `key_revoked` path, beside `identity_revoked_via`, which
names which of the two channels carried the revocation.

**What this still does not do.** Revocation here has no time dimension: a `revoked_at` on a
`revoked_keys` entry is read for the refs it carries and its timestamp is ignored, so a receipt signed
long before a key was revoked resolves the same as one signed after. That is the fail-closed reading and
it is the right default, but it is not the same as being able to say "valid as of the signing instant,
revoked since", which is what a caller re-verifying an archived receipt actually wants. Closing it needs a
revocation instant the registry does not currently publish in any bytes we hold.

## Appended 2026-09-05 — the asqav-sdk tip `3b88156`, pinned for the M6 closure run

`FINDINGS-rerun-2026-09-02.md` M6 closes against the tip of 2026-09-05. The closure asserts counts and
digests over the tip's `conformance/vectors.json`; a clone in a session scratchpad is not evidence this
repository holds, so the bytes the closure was measured from are pinned here, and the walker
(`tools/walk-digests.ts`, registry `walker/scopes.json`) grades them on every run.

Taken with `git cat-file blob <commit>:<path>` from a clone of
`https://github.com/jagmarques/asqav-sdk`, never from a worktree: `core.autocrlf` is `true` on this
machine and a checkout would rewrite the bytes these digests pin. Each `sha256` below was verified
equal to `git cat-file blob <id> | sha256sum` before being written here, and each file carries **0 CR
bytes**.

| field | value |
|---|---|
| URL | `https://github.com/jagmarques/asqav-sdk` |
| commit | `3b88156497d42a360576ecd580dad95ef031926b` |
| subject | `chore(release): 0.10.10 (#483)` |
| commit date | 2026-09-05T14:58:30+02:00 = **2026-09-05 12:58:30 UTC** |
| fetched at | 2026-09-05T15:18:53Z (`git fetch origin` returned no new refs; `origin/main` = the same commit) |

| fixture path | upstream blob at 3b88156 | bytes | sha256 |
|---|---|---|---|
| `fixtures/asqav/3b88156/conformance/vectors.json` | `ef8cf090a18da7a4914b9104681f3ba877db7b31` | 37383 | `05fc1d8a2521e5dac3e9fed20358c46278a4174989fd43ee79c555133ffc31e1` |
| `fixtures/asqav/3b88156/conformance/manifest.lock.json` | `ac5bc95ad58044adf47eec8f324e57b8d8a5fa5f` | 12906 | `49378c480f5e9cb5c4e8069bc98e91952cc35ea03937a973eb7a3f4807a6f2b6` |

`manifest.lock.json` is the author's own corpus lock and is pinned because it is part of the closure
evidence, not decoration: it declares `corpus_version` 5 and carries a `files` entry
`{"path": "vectors.json", "sha256": "05fc1d8a2521e5dac3e9fed20358c46278a4174989fd43ee79c555133ffc31e1",
"bytes": 37383}` — the same digest and the same byte count as the row above, arrived at by the author's
tooling and by ours independently. `66ab579` (#473), the commit that moved the derived
`envelope_hash` literal, updated this lock in the same change; that is what makes it evidence for the
closure rather than a second copy of the same claim.

**The `.gitattributes` flaw recorded against the earlier entries applies here too, and is again
harmless.** `git check-attr text eol` reports `text: set, eol: lf` for both files, because
`*.json text eol=lf` still sorts after `fixtures/** -text` and the last matching line wins. Both files
are LF-only, and each staged blob was verified to hash to the sha256 in the table.

**What this pin does not do.** It fixes the bytes of one upstream commit on one day. It carries no
relation to the upstream ref it came from, so nothing in this repository can answer "has the upstream
of this corpus moved since it was pinned?" — the question that made this closure run necessary in the
first place, and the reason the v1 run of 2026-09-05 measured a value one commit out of date.

## Appended 2026-09-05 — the fifth Insight registry pin (18:29Z) and the two 18:30Z sample endpoints

`npm run drift` at `3b6ca3f` reported the Insight key registry `changed` — the first `changed`
outcome that tool has produced against any upstream. Three files were fetched in this session, each
over HTTPS, each saved as the response body byte-exact with no re-serialisation, and each hashed
before being copied into the tree. No other host was contacted, and nothing under `keys/` was touched.

| path | source URL | retrieved (UTC) | bytes | sha256 |
|---|---|---|---|---|
| `refs/insight-oracle-keys-2026-09-05T1829Z.json` | `https://www.oracleinsight.xyz/.well-known/oracle-keys.json` | 2026-09-05T18:29:05Z | 17958 | `7cc00b957f14e1a954bcbff7dd0b5e97b9f4af1ef8c2e21cb9fa879339ce7330` |
| `fixtures/insight/execution-sample-2026-09-05T1830Z.json` | `https://www.oracleinsight.xyz/api/v1/execution/attestation/sample` | 2026-09-05T18:30:58Z | 4894 | `a2c442e02df4682899ee9707d0c695e17ce4f65029b2ccd7c67728061f143b5b` |
| `fixtures/insight/safety-sample-2026-09-05T1830Z.json` | `https://www.oracleinsight.xyz/api/v1/safety/attestation/sample` | 2026-09-05T18:30:59Z | 4052 | `28110d2f0ca8286168a457254afeb99204312b39ed751ba9cac38a81e32f6139` |

The two endpoint URLs are the ones the **newly fetched** registry names in its own `execution_sample`
and `sample` members; no URL was supplied from outside the bytes. The `retrieved` instant in each row
is the response's own `Date` header, not a local clock read.

**Response headers, recorded because a pin without them is a body with no provenance.** All three:
HTTP/1.1 200, `Content-Type: application/json`, `Server: Vercel`, `Transfer-Encoding: chunked`, and
**no `ETag` and no `Last-Modified` on any of the three** — so nothing but the digest identifies these
bodies, which is why the digest is the pin. The registry answered `Cache-Control: public, max-age=300`
with `Age: 0` and `X-Vercel-Cache: MISS`; both sample endpoints answered `Cache-Control: no-store,
no-cache, must-revalidate, proxy-revalidate`, `Pragma: no-cache`, `Expires: 0`, `X-Vercel-Cache: MISS`
and `X-RateLimit-Limit: 200` with 199 remaining. The registry response also set an `__internal`
cookie, which is not part of the body and is not pinned.

**The two sample pins are single observations and cannot be reproduced.** Each endpoint mints a fresh
signature per call: the execution sample's `signedAt` is 2026-09-05T18:30:57.383Z and the safety
sample's is 2026-09-05T18:30:59.932Z, both within two seconds of the fetch. Re-fetching either URL
returns different bytes with a different digest, so `fixtures/upstreams.json` deliberately carries no
drift entry for either — an http entry against them would report `changed` on every run forever, and
a check that always fails says no more than one that cannot fail. The registry URL, by contrast, is a
stable document and **is** entered there; the `insight-oracle-keys` upstream now points at the 18:29Z
pin, and the 17:41Z pin joins the 09:09Z, 11:54Z and 15:45Z pins as a `historical` entry.

**No derived attestation file is pinned this time.** The 15:46Z pair kept both the wrapper and a
`data.attestation` extraction re-serialised at two-space indent, because the adapter reads a single
attestation object. Here the two wrappers are pinned alone and `test/insight.test.ts` reads
`data.attestation` out of them in memory. That is a tighter relation than a second file: an extraction
held only in the test cannot drift from its parent at all, where a pinned copy has to be asserted
equal to one.

**What the new registry bytes say.** `public_keys` gains a **third** entry —
`insight-oracle-safety-sample`, `0xa41d5Ee795d95B87B3AA988150fC2d5e5fE5A534`, `validFrom`
`2026-09-03`, `validUntil` `null`, `revoked` `false` — carrying two members no key in any earlier pin
has carried: `role: "sample"` and a `note` beginning "SAMPLE ONLY". The two production keys are
deep-equal to their 17:41Z selves, `revoked_keys` is still `[]`, `key_rotation_policy` is unchanged
character for character, and all ten other published schemas are deep-equal. `ExecutionReceipt` stays
at `schemaVersion` 4 with **44** signed fields — the same 44 `{name, type}` pairs in the same order,
counted from both files — and gains three sibling members: `commitments`, `sentinels` and
`sampleSigningKeyRole: "sample"`. Four leaf additions in total, nothing removed, nothing changed. The
handoff's summary read of the live registry said 39 fields; it was marked as a summary rather than a
measurement, and the bytes say 44. `FINDINGS.md` section F carries the field-by-field diff.

**Both sample endpoints now sign with the sample key**, recovered from the pinned bytes through this
repository's own EIP-712 path: `0xa41d5ee795d95b87b3aa988150fc2d5e5fe5a534` for both, matching that
registry entry by address, with each artefact's `uid` equal to our recomputed digest. That is H8
closed in production — the round-3 letter named a registry-labelled non-production key as one of three
remedies and the issuer took it — and `FINDINGS.md` F2 records the three things it leaves standing,
the first being that the 44 signed fields still carry no mark and still say `environment: "production"`.

**Same `.gitattributes` ordering flaw as every earlier Insight entry, same harmlessness, recorded
again.** `git check-attr text eol` reports `text: set, eol: lf` for all three paths because
`*.json text eol=lf` sorts after `fixtures/** -text` and the last matching line wins. Harmless here
for a reason worth stating precisely: all three files contain **zero** LF bytes and **zero** CR bytes
— each is a single unterminated JSON line — so there is no line ending for a filter to rewrite, and
each staged blob was verified to hash to the sha256 in the table above.

**What these pins do not do.** They fix three bodies at three instants on one day. The registry moved
between 2026-09-02T17:42Z and 2026-09-05T18:29Z with no announcement and no `Last-Modified` to date
the move, so nothing here can say *when* the third key appeared — only that it was absent at the first
instant and present at the second. `validFrom: "2026-09-03"` is the issuer's claim about that, not an
observation of ours.

## Appended 2026-09-06 — the delivery corpus, which had no provenance row at all

`fixtures/delivery/` has been graded by the digest walker on every run since `17172e4`
(2026-09-02T09:08:33Z) — 21 registered fields, all matching — and until this section no row in this
file mentioned it. `grep -c 'fixtures/delivery' fixtures/provenance.md` returned `0`. B-67 named that
as the gap `fixtures/upstreams.json` could not close on its own: a corpus with no provenance row has
no upstream entry, and in a drift run's output a corpus with no entry is indistinguishable from one
that is fine. `test/upstream-coverage.test.ts` is the check that now makes it impossible to add one
without saying where it came from.

The directory holds **two corpora with different authors**, and the distinction is the reason this
section exists rather than a single line.

**Generated here.** `node tools/make-delivery-fixtures.mjs` writes these four from an Ed25519 seed
published in plain sight in the generator (ASCII `test-throwaway-receipt-verify-03`). They are not
copies of any published artifact. Re-run on 2026-09-06, the generator reproduced all four
byte-identically against the object store — which is what makes their `kind: local` entry in
`fixtures/upstreams.json` a check and not a decoration.

| file | bytes | sha256 |
|---|---|---|
| `fixtures/delivery/jwks.json` | 280 | `16146e4826403e2bef15a172cd0c12e7ac99503e24da7f870e0a73c6a27d4e3f` |
| `fixtures/delivery/proven/chain.jsonl` | 1459 | `74bf8c28de48717c1a4535a23d6e3530df505b28fe9347cad48a4530a3a967ae` |
| `fixtures/delivery/unproven/chain.jsonl` | 1371 | `ff16e8830b6a119176faad00153df7a056c0f20555e1d4c2fec8e9f08913934b` |
| `fixtures/delivery/none/chain.jsonl` | 1366 | `1900e24a97b6a57318308d3a7e4d9c6d9a9426f48005e362265f4eaeaf2f88e1` |

Three two-record `evidence.action/1` chains under one throwaway key
(`T059dvJofws0np5gULULCv1zNhe9URafWCyH2kvpKg4`), sessions `11111111-…`, `22222222-…` and
`33333333-…`. They exist because the frozen `evidence.action` conformance bundle predates the x402
delivery-proof feature, so every vector in it is `delivery: "none"` — testing the projection against
that bundle alone would exercise one of the three states. The three chains differ only in the two
fields the projection reads, which is what makes `test/delivery.test.ts` a discrimination rather than
a file-picking exercise.

**Captured, not generated.** `pilot-exa-contents/` is a signed mainnet capture and is nobody's
synthetic fixture:

| file | bytes | sha256 |
|---|---|---|
| `fixtures/delivery/pilot-exa-contents/chain.jsonl` | 12306 | `bcdf85720e86925a5bc3964943f02834c4db9f80ce015e77ebba2671237a8cd5` |
| `fixtures/delivery/pilot-exa-contents/jwks.json` | 264 | `a531bb2fb18ce710782dd70ae80a2becc9f785fe44bbede385fa1290fa40a665` |

15 `evidence.action/1` records, session `864b7d23-65ca-4c24-8fe4-b0cce11f32d4`, all timestamped
between 2026-08-16T18:33:45.995Z and 2026-08-16T18:33:45.998Z, written by
`delivery-incidence-study/x402-capture-rig` 0.5.0 against `x402.probe:POST https://api.exa.ai/contents`
and signed under `iss: https://headlessoracle.com`, kid
`yxjyYJ6HtT7thhoXpZGi4DptSN_b_d5L1_DTL_3SlyI` — the study key published in the v5 JWKS under its RFC
7638 thumbprint. It is the chain behind the confirmed Delivery Index row, and it carries the one
`x402_payment_ref` in the corpus plus the corpus's only checkpoint records.

**Why it has no upstream entry and never will.** A past signed event has no tip, no URL and no
revision: there is nothing to resolve, so none of `git`, `http` or `ietf-draft` fits, and `local` is
false because this repository did not author it. It is a named `unmapped` row
(`delivery-pilot-capture`) in `fixtures/upstreams.json` instead. That is also why the `local` entry
carries an empty `corpus_dirs` with a note: a `corpus_dirs` of `fixtures/delivery` would have resolved
this capture to the generator's entry and hidden exactly the file that most needed saying out loud.

## Appended 2026-09-08 — the asqav-sdk tip `22a970d`, pinned after the first scheduled drift finding

The first scheduled `drift` run (Monday 2026-09-07 06:00Z, on `dd21d5e`) went red as designed:
`asqav-sdk/3b88156` came back `moved_changed`, both pinned paths differing at the tip. That is the
question the pin of 2026-09-05 recorded itself as unable to answer, asked and answered by a cron. The
bytes the finding names are pinned here so that `FINDINGS-rerun-2026-09-08.md` measures against
evidence this repository holds rather than against a clone in a scratchpad.

Taken with `git cat-file blob <commit>:<path>` from a fresh clone of
`https://github.com/jagmarques/asqav-sdk`, never from a worktree: `core.autocrlf` is `true` on this
machine and a checkout would rewrite the bytes these digests pin. Each `sha256` below was verified
equal to `git cat-file blob <id> | sha256sum` in the clone before the file was copied, and
`git hash-object` over the copied file reproduced the upstream blob id exactly. Each file carries
**0 CR bytes**.

| field | value |
|---|---|
| URL | `https://github.com/jagmarques/asqav-sdk` |
| commit | `22a970d8fd5a0b20fdd1626226ba3c0a6fe0a5b1` |
| subject | `docs: specify standalone dependencies and trust inputs (#490)` |
| commit date | 2026-09-06T21:01:56+02:00 = **2026-09-06 19:01:56 UTC** |
| fetched at | 2026-09-08T09:14Z (`git rev-parse origin/main` in the fresh clone printed `a21d0608b0ff949c583138f2987eba3b6c15749f`) |

| fixture path | upstream blob at 22a970d | bytes | sha256 |
|---|---|---|---|
| `fixtures/asqav/22a970d/conformance/vectors.json` | `9e0c093c83b3fff96a026093179adc09f8ffa96c` | 37923 | `7beebf7661c02b1e70045aa956ba49836c968edd9b24ecd4ebfb893cca7c6341` |
| `fixtures/asqav/22a970d/conformance/manifest.lock.json` | `2a61ab12e0f41589893d912bec5463c973da3971` | 13040 | `b9c0b2e5819ad8984951b9f3175b293c9cc7a64a8ccb999e76a6ecc273348c99` |

**`main` had already moved past this commit when it was pinned.** `origin/main` resolved to
`a21d0608b0ff949c583138f2987eba3b6c15749f` (`fix: declare supported Node release lines (#501)`,
2026-09-08 06:00Z), nine commits and two days ahead. `22a970d` is pinned regardless, because it is the
commit the scheduled finding names and a pin that chases the tip rather than the finding records a
different fact from the one that was observed. At `a21d060` the pinned `conformance/vectors.json` is
byte-identical (the same blob `9e0c093c`); only `conformance/manifest.lock.json` differs there
(blob `4fe1d441`, `corpus_version` 7, changed `LICENSE`, `NOTICE` and `README.md` rows from
`docs: preserve corpus license notices (#500)`). So `npm run drift` reports this entry
`moved_changed` on **1 of 2** paths, and the one that moved is the author's own bookkeeping rather
than corpus data.

**What changed in `vectors.json` between `ef8cf090` (3b88156) and `9e0c093c` (22a970d).** The header
is unchanged (`version` 2, `canonicalization` "RFC 8785 JCS", `hash_algorithm` "SHA-256") and the
vector count is unchanged at **26**, in the same order. **0 vectors added, 0 removed, 6 changed** —
every one of them a `counterparty_binding_*` vector, and every one changed by the same single edit
upstream: `0b5fa1e`, `fix(conformance): one action_ref wire form across both corpora (#484)`, which
rewrote `action_ref` from the bare id `act_01HVZA_ORIGINATOR_0001` to the digest form
`sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`. Because `action_ref` sits
inside A's signed payload, that edit cascades: the originating envelope's bytes change, so its
`envelope_hash` changes from `DaE/V0yvdRCKIGBaAMYV9jCMeETMiSd5Mw6HZWsx2Pk=` to
`dXqDdpt/tBY7ILMJMczYw6sx8vPmQCFXMR8W3ADW2e8=` (hex `0da13f57…d8f9` → `757a8376…d9ef`), and every
vector's own `canonical` and `sha256` move with it.

| vector | fields changed |
|---|---|
| `counterparty_binding_happy_path` | `input`, `canonical`, `sha256`, `expected` |
| `counterparty_binding_envelope_byte_equality` | `input`, `canonical`, `sha256`, `expected` |
| `counterparty_binding_base64url_tolerance` | `input`, `canonical`, `sha256`, `expected` |
| `counterparty_binding_opaque_receipt_ref` | `input`, `canonical`, `sha256` |
| `counterparty_binding_transport_label_non_trust` | `input`, `canonical`, `sha256` |
| `counterparty_binding_missing_envelope_hash_rejected` | `input`, `canonical`, `sha256` |

The other twenty vectors (`minimal_read`, `tool_call_with_counterparty`, `traced_child_action`,
`tampered_signature`, `swapped_public_key`, `stale_card`, `nonce_mismatch`, `card_version_downgrade`,
the six `capture_topology_*`, `receipt_v2_signer_canary`, the two `asqav-24-jcs-astral-key-order*` and
the three `asqav-25-number-*`) are byte-identical. The intervening commit `e1daa48`
(`feat(conformance): wire-version v on every asqav-native signed payload (#485)`) did not touch this
file.

**What changed in `manifest.lock.json`.** `corpus_version` 5 → 6; the whole-corpus `digest`
`1ef6d34d…732f` → `1857cd56…8094`; `version_history` gains its version-5 row (the digest the previous
lock carried as its own) and drops nothing; and exactly one `files` row moves — `vectors.json`, from
`{sha256 05fc1d8a…31e1, bytes 37383}` to `{sha256 7beebf76…6341, bytes 37923}`, which is the same
digest and the same byte count as the row in the table above, arrived at by the author's tooling and
by ours independently. The `LICENSE` and `README.md` rows, `corpus`, `rolling`, `digest_algorithm` and
`signing` are unchanged. That independent agreement on `vectors.json` is what makes the lock evidence
rather than a second copy of the same claim.

**The `.gitattributes` flaw recorded against the earlier entries applies here too, and is again
harmless.** `git check-attr text eol` reports `text: set, eol: lf` for both files, because
`*.json text eol=lf` still sorts after `fixtures/** -text` and the last matching line wins. Both files
are LF-only, and `git hash-object` over each copied file returned the upstream blob id above.

**What this pin does not do.** It fixes the bytes of one upstream commit on one day, and it is already
not the tip: the pin was made two days and nine commits behind `main`. It says nothing about whether
the six changed vectors are *correct* — only about what they are. Whether this repository's verdicts
move with them is `FINDINGS-rerun-2026-09-08.md`, and those verdicts are ours over Joao's bytes, not
his.

## Appended 2026-09-08 — CPB `-03`, pinned after the first scheduled drift finding

The same scheduled run of 2026-09-07 06:00Z that found the asqav corpus moved also reported
`draft-mih-sokolov-scitt-payload-binding-02` **superseded**: `-03` exists at the IETF archive. It was
fetched over HTTPS and saved as the response body byte-exact, with no re-serialisation. No other host
was contacted for it, and nothing under `keys/` was touched.

| path | source URL | retrieved (UTC) | bytes | sha256 |
|---|---|---|---|---|
| `refs/draft-mih-sokolov-scitt-payload-binding-03.txt` | `https://www.ietf.org/archive/id/draft-mih-sokolov-scitt-payload-binding-03.txt` | 2026-09-08T09:28:55Z | 108056 | `d303e6e4ec4c4bf3b9c483bcabbd720309f952a5e77d912968bef39c1f245d13` |

`HTTP 200`, `content-type: text/plain; charset=utf-8`. The file carries **0 CR bytes** (2520 LF, 44
form feeds — the ordinary Internet-Draft pagination). `-02`, pinned 2026-08-30, is 92428 bytes: `-03`
is 15,628 bytes longer. Its front matter dates it **5 September 2026** and its `Expires` line 9 March
2027.

`refs/draft-mih-sokolov-scitt-payload-binding-02.txt` stays in the tree and its entry moves to
`role: historical`. It is not decoration: every file under `cpb/` and `test/cpb/` was written from the
`-02` bytes alone and cites `-02` section and line numbers throughout, and
`cpb/AMBIGUITY_LOG.md` records where that text admitted more than one reading. A re-read of the
implementation against `-03` is `cpb/REREAD_-03_2026-09-08.md`; **no code changed in the session that
pinned this file**, so `cpb/*.ts` remains a `-02` implementation with its divergences from `-03`
written down rather than fixed.

**What `-03` changes, from the bytes.** Sections were compared after stripping page headers, footers
and form feeds. Of the 37 sections in `-02`, **7 are byte-identical in `-03`** — among them **§4.1
Algorithm jcs**, which is the construction this repository implements — 27 changed, 3 were replaced or
renamed, and `-03` adds 11 sections that `-02` does not have (§6.1, §6.2, §8.2–§8.5, §14.1.1, §14.2,
Appendix D, and its own §2 "Changes from -02"). The largest structural move is the one C-2 summarised
and it holds against the bytes: `-03` §8 becomes an abstract four-member information model that "does
not fix a payload serialization", and the wire form moves into §8.3 as an **optional COSE protected
header parameter `cpb-refs`**, registered in the new §14.2, with a normative CDDL and a
`MUST NOT occur in the unprotected header`.

**What this pin does not do.** It fixes the bytes of one revision on one day, and `npm run drift` will
report it `superseded` the moment `-04` appears. It says nothing about whether the implementation under
`cpb/` is correct against `-03` — that is the re-read document, which finds six divergences in
`cpb/algorithm.ts` (one of them a difference in what the code returns), none in
`cpb/canonical-digest.ts`, and fixes none of them. It also records that `-03` answers three questions
`cpb/AMBIGUITY_LOG.md` had left open against `-02` (A19, A20, A21).

## Appended 2026-09-08 — twelve upstreams for the daily drift

The drift job moves from weekly to daily in the same session, and the registry it reads widens from the
corpora this repository already held to the twelve upstreams the strategy names. Ten of the twelve
are pinned below as eleven entries in `fixtures/upstreams.json` — item 2 is two npm endpoints and item
12 is two artefacts, and one of the twelve was already present. **Two are not pinned, and the reason
for each is recorded here rather than left as a gap.**

Every URL below was resolved in this session and every digest computed here from the response body or
the object store. No identifier is carried over from the strategy document; where the strategy named a
thing rather than a URL, the sentence that justified the choice is in the entry's own
`identification`, `url_source` or `rev_source` member.

### The `http` pins were measured for determinism before being pinned — with the checker's own client

A pin whose body changes on every fetch reports `changed` on every run forever, and a check that always
fails says no more than one that cannot fail — the standard this file already applies to the
`insight-endpoint-samples` row. So every candidate was fetched repeatedly and the bodies compared.

**The instrument turned out to be part of the measurement, and getting it wrong cost a round.** The
first pass fetched with Python `urllib`; six candidates came back byte-identical across two fetches
twenty seconds apart, and their digests were written into `fixtures/upstreams.json`. The very next
`npm run drift` reported **two of them `changed` within minutes** —
`mcp-specification-changelog` and `c2pa-conformance-trust-list`. The pages had not moved. `tools/drift.ts`
fetches with node's global `fetch` and `redirect: "follow"`, which negotiates content encoding
differently from `urllib`, and both of those hosts transcode on negotiation; `www.rfc-editor.org` and
`docs.dapr.io` happen not to, which is why four of the six digests were right by luck rather than by
method. A `sha256` in an `http` entry is not a property of the URL. **It is the digest the checker
computes, and it has to be measured with the checker's client.**

Every digest below was therefore re-measured with node `fetch` — four rounds, fifteen seconds apart,
forty-five seconds end to end — and every one was byte-identical across all four.

**That was still not enough for one of them, and the next `drift` run said so.** With the corrected
digests in place, `c2pa-conformance-trust-list` came back `changed` again — a *third* digest, then a
fourth, at the same 91314 bytes each time, from the same client minutes apart. A 45-second burst had
called it stable because it is stable *within a page-cache generation*; it is the regeneration that
moves it. See below. The remaining five hold.

| id | URL | http | bytes | sha256 (node `fetch`) | 4 rounds |
|---|---|---|---|---|---|
| `x402-core-dist-tags` | `https://registry.npmjs.org/-/package/@x402%2fcore/dist-tags` | 200 `application/json` | 19 | `3773cb4f1cae004fdf7592141ab7341bc63ab42623f8ea40e0c8df9c81ad1e60` | identical |
| `x402-fetch-dist-tags` | `https://registry.npmjs.org/-/package/@x402%2ffetch/dist-tags` | 200 `application/json` | 19 | `3773cb4f1cae004fdf7592141ab7341bc63ab42623f8ea40e0c8df9c81ad1e60` | identical |
| `mcp-specification-changelog` | `https://modelcontextprotocol.io/specification/latest/changelog` | 200 `text/html` | 294168 | `c1496005be9752775e25f46d7459cc7d56e7e9e1f44b7842fd875793d17fe6f6` | identical |
| — **not pinned** — | `https://c2pa.org/conformance/` | 200 `text/html` | 91314 | **five distinct digests today** | **varies per cache generation** |
| `rfc9964-info` | `https://www.rfc-editor.org/info/rfc9964` | 302 → 200 `text/html` | 731071 | `abc75d74bf90f97356b9c6348c4a62e85cb341c8af7f556e76010325ff5eeb7c` | identical |
| `dapr-workflow-history-signing` | `https://docs.dapr.io/…/workflow/workflow-history-signing/` | 200 `text/html` | 72326 | `7cf9a3c539f8cd2285f1cfee08689148459fa66718d4de246b18287bf7d2c52b` | identical |
| — **not pinned** — | `https://datatracker.ietf.org/wg/scitt/documents/` | 200 `text/html` | 71257 | **four fetches, four different digests** | **differs every time** |

The `urllib` pass was not wasted: it is what surfaced the SCITT page below, and both instruments agree
about that one.

**Why the C2PA conformance page is not pinned either.** It survived every burst test and failed the
only test that matched the job's actual cadence: two `npm run drift` runs from the same node client,
minutes apart, read `6c80e2e2…` and then `085a1414…`; across the session five distinct digests were
observed (`00220127…` under urllib, `e8e0461c…` under curl, then `6c80e2e2…`, `085a1414…`,
`8ec0cea8…` under node), every one of them at exactly **91314 bytes**. Constant length with a changing
digest is the signature of fixed-width substitution, and diffing two captures located it precisely —
three independent varying elements:

* a per-render Content-Security-Policy nonce, repeated throughout the document
  (`nonce="6c0a88aa6076ba974220abbcddaf3c9e"` in one capture, `nonce="c0cfc1f3f253ab66250513a60d186dab"`
  in another);
* asset cache-busting query strings that are Unix timestamps
  (`templates.css?ver=1788821065` vs `?ver=1788806593`);
* random page-builder element ids (`<div id="fws_6a9fdbb3c618e" …>`).

The page is served from a cache, so all three hold still for minutes at a time and then change
together — which is exactly why a burst test passes it and a daily job would not. A pin whose digest is
a nonce is a check that always fails.

The C2PA trust list itself is not abandoned as a question; it is only not answerable by digesting this
page. A pin that would work is the trust-list **artefact** the page links rather than the marketing
page around it, and finding and pinning that is a task this session did not take on.

Both rejected candidates are the `nondeterministic_endpoint` kind — the `reason_code` added to the
`unmapped` vocabulary in the same session, for exactly this shape of absence. Neither gets an `unmapped`
row: those rows account for paths on disk, and neither URL has one.

**Appended the same day — the counter-evidence, which is weaker than the mechanism but is not nothing.**
After the C2PA entry was removed, a controlled run measured all four page candidates **five times over
twelve minutes, three minutes apart, each round a fresh request** — and `c2pa.org/conformance/` was
**stable across all five** (`8ec0cea8…` every time), as were the other three. So the rejection does not
rest on a controlled experiment that reproduced the change; that window did not reproduce it. It rests
on two other things: the five distinct digests actually observed across the session, two of them from
consecutive `npm run drift` runs minutes apart on the same client; and the mechanism located in the
bytes, a Content-Security-Policy nonce, which is by construction regenerated per render. A cache delays
that regeneration, it does not remove it — which is exactly why a twelve-minute window can look stable
and a daily job would not be. Recorded here so a later session weighing whether to re-pin the page has
the evidence that points the other way as well as the evidence that decided it.

**Why the SCITT working-group document list is not pinned.** Under `urllib`, two GETs twenty seconds
apart returned 71257 bytes each and **two different sha256 values**
(`f6457bd6…8873e3` and `a939b63b…58ce2`). Under node `fetch` — the checker's own client — **four
consecutive fetches produced four distinct digests**
(`c8f6f410…`, `fa8b6644…`, `b7a8e571…`, `88384907…`), all at 71257 bytes. Both instruments agree, which
is what makes this the one candidate rejected on evidence rather than on a client artefact. The
difference was located rather than assumed: the responses are identical except for one injected line,

```
window.__CF$cv$params={r:'a37d061f0c50dde1',t:'MTc4ODg2MDc2NA=='}
```

versus `r:'a37d06394fbc73ee',t:'MTc4ODg2MDc2OA=='`. That is Cloudflare's challenge script, and `t`
base64-decodes to `1788860764` and `1788860768` — a **per-response Unix timestamp**. The body therefore
cannot digest to a stable value at any interval, and an `http` entry against it would report `changed`
on every run of a job that now runs daily. It is left unpinned deliberately. It gets no `unmapped` row
either: those rows account for paths on disk, this URL has none, and a row matching nothing on disk is
what `test/upstream-coverage.test.ts` calls a dead row.

The SCITT documents this list exists to surface are watched individually instead — `draft-hillier-scitt-arp`
is pinned below, and `draft-mih-sokolov-scitt-payload-binding` was re-pinned at `-03` earlier the same
day — so the loss of coverage is the appearance of a *new* SCITT draft nobody here has named yet.

### The three `ietf-draft` pins

Each revision was resolved from the datatracker document API, not guessed from a URL that happened to
answer, and each `.txt` was fetched from the archive as the response body byte-exact.

| path | source URL | retrieved (UTC) | bytes | sha256 |
|---|---|---|---|---|
| `refs/draft-hillier-scitt-arp-03.txt` | `https://www.ietf.org/archive/id/draft-hillier-scitt-arp-03.txt` | 2026-09-08T09:40:26Z | 339537 | `fe7ba656ef07842c365ce93938610cd874668c29f0fa06031d37d0e4e72b395d` |
| `refs/draft-sirkkavaara-vaara-receipt-10.txt` | `https://www.ietf.org/archive/id/draft-sirkkavaara-vaara-receipt-10.txt` | 2026-09-08T09:40:26Z | 71802 | `5c8090f6244a2cb8c618f8c5a74ceaf0f1c4a7b49cb44a5cec19fedb69ffe0b1` |
| `refs/draft-vauban-x402-consolidated-00.txt` | `https://www.ietf.org/archive/id/draft-vauban-x402-consolidated-00.txt` | 2026-09-08T09:40:26Z | 96774 | `8e695f312ac66b2b12ad73976367f69c3ad3e7033c27c7298b91b4100a9d19e1` |

All three answered `200 text/plain; charset=utf-8` and all three carry **0 CR bytes**. The revisions the
datatracker reported: `draft-hillier-scitt-arp` rev `03` (2026-08-14, "Attestation Reconciliation
Protocol"); `draft-sirkkavaara-vaara-receipt` rev `10` (2026-09-04); `draft-vauban-x402-consolidated`
rev `00` (2026-09-03) — which **confirms** the `-00` the strategy names rather than assuming it.

### The two npm endpoint pins

| path | source URL | retrieved (UTC) | bytes | sha256 |
|---|---|---|---|---|
| `refs/x402-core-dist-tags-2026-09-08.json` | `https://registry.npmjs.org/-/package/@x402%2fcore/dist-tags` | 2026-09-08T09:46:52Z | 19 | `3773cb4f1cae004fdf7592141ab7341bc63ab42623f8ea40e0c8df9c81ad1e60` |
| `refs/x402-fetch-dist-tags-2026-09-08.json` | `https://registry.npmjs.org/-/package/@x402%2ffetch/dist-tags` | 2026-09-08T09:46:52Z | 19 | `3773cb4f1cae004fdf7592141ab7341bc63ab42623f8ea40e0c8df9c81ad1e60` |

Both bodies are `{"latest":"2.25.0"}` in full, which is why both rows carry the same digest — a fact
about the two packages, not a copied cell. This confirms the `2.25.0` the Lead observed at 08:47Z on the
same day, from bytes now held here.

**The packument is deliberately not pinned.** `https://registry.npmjs.org/@x402/core` changes on every
publish and on metadata churn and is megabytes; the dist-tags document changes exactly when `latest`
moves, which is the release signal worth a `changed` outcome.

### The three `git` pins are watch-only

`x402-specification-v2`, `verifiable-intent-changelog` and `obsigna-receipt-spec` pin a **path in
someone else's repository by blob id**, and nothing under `fixtures/` or `refs/` holds a copy of any of
them. That is a different kind of pin from every git entry this file carried before, all of which pin
paths that were also copied into `fixtures/`. It is deliberate: the question these three answer is "has
it moved", and answering it needs the blob id, not the bytes. A later session that wants to *cite* any
of these three has to copy the file in and give it a provenance row of its own first.

| id | repository | commit | path | blob | bytes | sha256 |
|---|---|---|---|---|---|---|
| `x402-specification-v2` | `coinbase/x402` | `dd927a26cfefc98c24b3ec38b3a8f204dad0c60d` | `specs/x402-specification-v2.md` | `b7eaea66f2743eac7ce2d0e1886f29e950e06988` | 31299 | `aa6dc5e8ccc7758689945fc7502674f51cd0f21f09ec886aa1dbc4cd86bc81b6` |
| `verifiable-intent-changelog` | `agent-intent/verifiable-intent` | `356c29635f1c44df7de02edb58699ca9f29bece6` | `CHANGELOG.md` | `5305c0e9297442629b3b506dd723e5e8ed3de974` | 1874 | `005676981b6858f0d1613e85b6136e32cb6da707070067d89538db0d98f34983` |
| `obsigna-receipt-spec` | `agent-receipts/obsigna` | `a53ffae1268cf2a9dda0a7796a641618543fe657` | `spec/v0.5.0/spec.md` | `70c763fe491c5259107c8d2ffea4b6da595e353c` | 58204 | `0535555d74ac5c7588b909ec6503332fed46449a3fb5210a64c4e5571d69fe79` |

Each tip was resolved **twice, by two mechanisms that can disagree** — `git ls-remote <repo> main`, which
is what `tools/drift.ts` itself uses, and the GitHub commits API — and the two agreed in all three cases.
Each blob id was likewise **recomputed here** as `sha1("blob " + len + "\0" + bytes)` over the decoded
body and compared to the id the API reported; all three matched, which is what makes the `sha256` column
a measurement rather than a transcription. All three files carry 0 CR bytes.

### Item 7 was already present

`draft-marques-asqav-compliance-receipts` is pinned at `-08` with `role: current`, from the
2026-09-01 append. It is **not duplicated**; it is counted as one of the twelve and is checked on the
row it already has.

### What these pins do not do

They watch. Not one of the twelve is a corpus this repository grades, and no rule in
`walker/scopes.json` reads any of them — `npm run walk` is unchanged by this section. A `current`
outcome on any row below says the upstream has not moved since 2026-09-08, and nothing at all about
whether what it says is true, whether this repository implements it, or whether it agrees with any
finding here. The three surviving HTML page pins are the weakest of them: they digest a *rendered page*,
so a site-wide template change will report `changed` with no change to the content anyone cares about,
and the run that goes red will have to be read rather than believed.

They are weak in a second way this section learned the hard way. One of the three digests differently
depending on which HTTP client asks, so its pin is valid **for node `fetch`** and for nothing else.
A second checker — a different runtime, a proxy that strips or adds `Accept-Encoding`, a CI runner
behind a transcoding CDN — could read `changed` off an unmoved page. The `git` and `ietf-draft` pins
have no such property: a blob id and an archived `.txt` are the same bytes to every client that asks.

## Appended 2026-09-08 — the asqav-sdk tip `a21d060`, pinned after the re-pin at `22a970d` was overtaken the same day

The `22a970d` pin above was made at 09:14Z and was already nine commits behind `main` when it was
made, by that section's own admission. The consequence was not theoretical: `npm run drift` read
`moved_changed` for `asqav-sdk/22a970d` on every run afterwards, and would have read it every morning
at 06:00Z, for `conformance/manifest.lock.json` — a path no finding in this repository depends on. A
red the reader learns to ignore is worse than no check, so the tip is pinned here and the path that
moves for the author's own reasons is marked `check: "note"` (see `fixtures/upstreams.json`
`how_to_read.path_check`).

Taken with `git cat-file blob <commit>:<path>` from a fresh clone of
`https://github.com/jagmarques/asqav-sdk`, never from a worktree: `core.autocrlf` is `true` on this
machine and a checkout would rewrite the bytes these digests pin. Each `sha256` below was verified
equal to `git cat-file blob <id> | sha256sum` in the clone before the file was copied;
`git hash-object` over each copied file and `git rev-parse :<path>` over each *staged* blob both
reproduced the upstream blob id exactly. Each file carries **0 CR bytes**.

| field | value |
|---|---|
| URL | `https://github.com/jagmarques/asqav-sdk` |
| commit | `a21d0608b0ff949c583138f2987eba3b6c15749f` |
| subject | `fix: declare supported Node release lines (#501)` |
| commit date | 2026-09-08T08:00:00+02:00 = **2026-09-08 06:00:00 UTC** |
| fetched at | 2026-09-08T11:07:31Z (`git rev-parse origin/main` in the fresh clone printed `a21d0608b0ff949c583138f2987eba3b6c15749f`) |

| fixture path | upstream blob at a21d060 | bytes | sha256 | `check` |
|---|---|---|---|---|
| `fixtures/asqav/a21d060/conformance/vectors.json` | `9e0c093c83b3fff96a026093179adc09f8ffa96c` | 37923 | `7beebf7661c02b1e70045aa956ba49836c968edd9b24ecd4ebfb893cca7c6341` | `fail` |
| `fixtures/asqav/a21d060/conformance/manifest.lock.json` | `4fe1d441ff6891ec68ed826dc7e52bc0e64ae429` | 13315 | `fcdd36d43def70756e2fc66e12bce265e839a8a82b1df98dceac71ce9a8e977a` | `note` |

**This pin is the tip at the moment it was made**, and it is the same tip three independent
observations of `origin/main` returned on 2026-09-08 — 09:14Z (the drift session's clone), 10:32Z (the
Lead), 11:07:31Z (this clone). That is not a guarantee it is still the tip: it is a statement that
`main` did not move across a two-hour window, and the next scheduled run is what will say whether it
moved after.

**The corpus did not move between `22a970d` and `a21d060`.** `conformance/vectors.json` is the *same
blob* — `9e0c093c83b3fff96a026093179adc09f8ffa96c`, 37923 bytes, sha256 `7beebf76…6341` — at both
commits. So `fixtures/asqav/a21d060/conformance/vectors.json` is byte-identical to
`fixtures/asqav/22a970d/conformance/vectors.json`, the graded corpus is unchanged, and the re-walk
protocol a changed corpus would have required was not needed and was not run. What `npm run walk` does
report for the new corpus is the arithmetic of that identity: `asqav/a21d060` comes back **60
registered, 59 match, 0 mismatch, 1 expected refusal**, the same row as `asqav/22a970d`, and the
whole-run totals move by exactly that corpus and nothing else (`match` 351 → 410, `unregistered`
486 → 524, `expected_refusal` 2 → 3, `mismatch` 20 → 20, `rule_idle` 2 → 2).

**What changed in `manifest.lock.json`** between `2a61ab12` (22a970d) and `4fe1d441` (a21d060), from
`docs: preserve corpus license notices (#500)`: `corpus_version` 6 → 7; the whole-corpus `digest`
`1857cd56…8094` → `e5a3b808…1c7b`; the `files` array gains a `NOTICE` row
(`c4cc5692…d2de`, 1931 bytes) and its `LICENSE` (10256 → 11358 bytes) and `README.md`
(6815 → 7358 bytes) rows move. **The `vectors.json` row does not move**: it is still
`{sha256 7beebf76…6341, bytes 37923}`, the same digest and byte count as the table above, reached by
the author's tooling independently of ours. That is what makes marking this path `note` safe rather
than convenient — the lock is *also* where a corpus change would surface, and a corpus change would
move the `vectors.json` row and the `fail` path together, not the lock alone.

**The `.gitattributes` flaw recorded against the earlier entries applies here too, and is again
harmless.** `git check-attr text eol` reports `text: set, eol: lf` for both files, because
`*.json text eol=lf` still sorts after `fixtures/** -text` and the last matching line wins. Both files
are LF-only, and the copied and staged blob ids are the upstream ones above.

**`asqav-sdk/22a970d` is now `role: historical`**, with its `role_reason` naming this pin. Its corpus
directory, `FINDINGS-rerun-2026-09-08.md` and its `walker/scopes.json` entry all stay: it is the
commit the first scheduled drift finding named, and the finding must keep measuring against the bytes
it was written about.

**What this pin does not do.** It fixes the bytes of one upstream commit on one day, and pinning the
tip does not stop the tip moving — the next commit upstream puts this entry back to
`moved_untouched` or `moved_changed`, which is the tool working. It says nothing about whether the
vectors are *correct*, only about what they are. And `check: "note"` on the manifest is a deliberate
narrowing of what the daily check can catch: a change confined to that file alone will now be printed
and will not fail the run. That is safe only for as long as the file stays what it is here — the
author's bookkeeping — and the sentence above about the `vectors.json` row is the reason to believe
it, not a proof.

## Appended 2026-09-08 — the Insight registry re-pinned after the `preTradeUidsHash` prose changed under schemaVersion 4

`npm run drift` reported the Insight key registry `changed` for the second time this tool has produced
that outcome against this URL, and the first time for a reason that is not a new key. One file was
fetched in this session, over HTTPS, saved as the response body byte-exact with no re-serialisation,
and hashed before being copied into the tree. No other host was contacted and nothing under `keys/`
was touched.

| path | source URL | retrieved (UTC) | bytes | sha256 |
|---|---|---|---|---|
| `refs/insight-oracle-keys-2026-09-08T1218Z.json` | `https://www.oracleinsight.xyz/.well-known/oracle-keys.json` | 2026-09-08T12:18:10Z | 18003 | `a45b5d0a8e3b432c1e827310bc4caa7b67ad440133ee32900d8520615a0f9003` |

The `retrieved` instant is the response's own `Date` header, not a local clock read, on the convention
the 5 September section states. The fetch used the same client `tools/drift.ts` uses — node
`fetch(url, { method: "GET", redirect: "follow" })` with no added headers (`tools/drift.ts` l.177–181)
— through a one-off script that was deleted after the pin was written.

**Four GETs, one body.** 12:11:41Z (headers only), 12:14:29Z, 12:14:40Z and 12:18:39Z local, all
HTTP/1.1 200, all 18003 bytes, all `a45b5d0a…f9003`; `cmp` between the saved bodies is clean. The pin
is the 12:18:39Z fetch, whose `Date` header is the row's instant above. That repetition is what says
this is a changed **document** rather than a nondeterministic endpoint, and it is the same control the
B-123 session applied at 10:59Z with two fetches.

**Response headers, recorded because a pin without them is a body with no provenance.**
HTTP/1.1 200, `Content-Type: application/json`, `Server: Vercel`, `Transfer-Encoding: chunked`,
`Content-Encoding: br`, `Cache-Control: public, max-age=300`, `X-Matched-Path:
/.well-known/oracle-keys.json`. **No `ETag` and no `Last-Modified`** — the same absence as every
earlier pin of this URL, so nothing but the digest identifies this body and nothing in the response
dates the change. The two observations that carry an `Age` disagree about the edge copy, not the
body: 12:11:41Z answered `X-Vercel-Cache: STALE, Age: 388` (edge copy generated ≈12:05:13Z) and
12:18:10Z answered `X-Vercel-Cache: HIT, Age: 29` (≈12:17:41Z). Both are cache-generation instants
for identical bytes and neither is a publication instant.

**The timing window, and the two independent sources for it.**

| bound | instant | source |
|---|---|---|
| last observation of the **old** bytes | 2026-09-08T09:37:29.728Z | `fixtures/upstreams.json` `last_observed` for `insight-oracle-keys` as committed at `7fa2f08` — the scheduled drift `--record` of this morning, which read `outcome: current` against `7cc00b95…7330` |
| first observation of the **new** bytes | 2026-09-08T10:59Z | the B-123 session's P0 `npm run drift`, `a45b5d0a…f9003`, 18003 B, two byte-identical fetches (`CC_REPORT_2026-09-08_asqav-tip-and-path-check.md`); the Lead's own fetch at ≈11:24Z read the same digest and size, and this session's P0 at 12:11Z read it a third time |

So the registry published the changed body between **09:37:29.728Z and 10:59Z**, a window of about
eighty-two minutes, with no announcement and nothing in the response to date it more precisely.
`Cache-Control: max-age=300` in front of a CDN loosens the earlier bound by up to five minutes — the
09:37:29.728Z observation could have been served from an edge copy generated as early as ≈09:32:29Z —
so the window as a statement about the *origin* is **09:32:29Z–10:59Z**. The observed window is the
one quoted elsewhere; this paragraph is why it cannot be tightened.

**What changed: exactly one leaf, out of 701.** A structural diff of the two documents flattened to
leaf paths (both 701 leaves, no path present in one and absent in the other, same 13 top-level
members):

`schemas.ExecutionReceipt.commitments.preTradeUidsHash`

| | |
|---|---|
| 5 Sep pin (`7cc00b95…`) | `keccak256(concat(uids in route order, 32 raw bytes each, no separator)); empty set -> keccak256("")` |
| 8 Sep pin (`a45b5d0a…`) | `keccak256(concat(non-zero uids in route order, 32 raw bytes each, no separator)); zero bytes32 is omitted; empty after omission -> keccak256("")` |

**`schemas.ExecutionReceipt.schemaVersion` is 4 in both.** The issuer changed a commitment rule and
did not version it, so a verifier that pinned the 5 September prose and re-read `schemaVersion` to
decide whether to re-read the rule would not have looked. That is the finding, and `FINDINGS.md`'s
8 September section carries it with the evidence that the issuer's own code already implemented the
new rule on 2 September.

**Registry bookkeeping.** `fixtures/upstreams.json`: `insight-oracle-keys` now points at this pin;
the 18:29Z pin becomes `insight-oracle-keys/2026-09-05T1829Z`, `role: historical`, with a
`role_reason` naming what superseded it and a `last_observed_note` on why its frozen `last_observed`
is kept rather than deleted — the pattern `asqav-sdk/22a970d` set on 8 September. Two members the
handoff asked for were **not** written: a `bytes` count and a `pinned_at` duplicate of `retrieved`.
That file's own `what_this_file_is_not` says it carries no byte counts, and a second unchecked copy of
a byte count or an instant is exactly the kind of silent disagreement `test/upstreams-provenance.test.ts`
exists to prevent. The byte count lives in the table above, which is the row that test reads.

**Same `.gitattributes` ordering flaw as every earlier Insight entry, same harmlessness, checked
again.** `git check-attr text eol` reports `text: set, eol: lf` for this path because `*.json text
eol=lf` sorts after `refs/** -text` and the last matching line wins. Harmless here for the same
measured reason: the file contains **zero** LF bytes and **zero** CR bytes — a single unterminated
JSON line — so there is no line ending for a filter to rewrite, and the staged blob was verified to
hash to the sha256 in the table above.

**What this pin does not do.** It fixes one body at one instant. It does not say when the prose
changed inside the eighty-two-minute window, whether the issuer's implementation changed at the same
time or long before, or whether any receipt was ever issued under the superseded prose. The 2 September
attestation sample says only that *that* receipt was hashed under the new rule; it does not establish
what Insight's code did before 2 September or what it does now.

---

## Appended 2026-09-08 — the MCP changelog pinned at its source after the render moved with a site redeploy

The `mcp-specification-changelog` entry pinned above pinned the **rendered page**
`https://modelcontextprotocol.io/specification/latest/changelog` by the sha256 of its body. On
2026-09-08 it went `changed` without the changelog changing, and that is the B-125 class of defect:
the pin named the page rather than what the page carries. It is retired to `role: historical` as
`mcp-specification-changelog/render-2026-09-08T0959Z` and replaced by a `git` entry over the two
changelog **source files** in `modelcontextprotocol/modelcontextprotocol`.

### What was measured, and in which order

The render was characterised **before** anything was re-pointed, because "the page moved but the
content did not" is a claim that has to be established from the source repository rather than assumed
from the shape of the diff.

| observation | at (UTC) | result |
|---|---|---|
| B-128 `npm run drift -- --record` | 2026-09-08T12:21:23Z | render `current` at `c1496005…f6f6` |
| render `changed` first seen | by 2026-09-08T12:34Z | `968394b4…14fb`, 294168 bytes |
| the Lead's three fetches | ~2026-09-08T12:47Z | `968394b4…14fb`, all three identical |
| this session's `npm run drift` (P0) | 2026-09-08T14:25Z | `CHANGED`, `968394b4…14fb`, 294168 bytes |
| this session's fetch, drift's own client | 2026-09-08T14:28:47Z | 200, 294168 bytes, `968394b4…14fb`; redirected to `/specification/2026-07-28/changelog` |
| fresh full clone of the source repository | 2026-09-08T14:27:42Z → 14:27:51Z | `git rev-parse origin/main` → `aa8ce049f089f92618340190d4ece141f663310d` |

The render therefore moved once, between 12:21:23Z and 12:34Z, and has been stable at the new digest
for the two hours since — the same 294168 bytes either side.

**The source did not move.** In the clone at `aa8ce049`:

```
$ git log -1 --format='%H %cI %s' origin/main -- docs/specification/2026-07-28/changelog.mdx
db4bfcff3d60f5df01a21bdf6b78f7012cac4634 2026-07-28T20:04:27Z Date remaining draft links in the 2026-07-28 spec tree

$ git log -1 --format='%H %cI %s' origin/main -- docs/specification/draft/changelog.mdx
b488c16623e5202a3961e551886044577ae0f096 2026-07-28T15:56:05Z Add 2026-07-28 MCP specification
```

Both changelogs were last touched on **2026-07-28**, six weeks before the render moved. What moved is
the site: the tip itself is `Merge pull request #3282 from DanielTemesgen/add-filesystems-wg`,
committed **2026-09-08T13:24:34+01:00 = 12:24:34 UTC**, which falls inside the 12:21:23Z–12:34Z window
in which the render changed. The page is a Mintlify render whose asset URLs carry build chunk hashes,
so a redeploy rewrites the body while the content is untouched. This independently reproduces the
Lead's characterisation, which was made from the GitHub API at ~12:55Z and named the same blob
(`424b2653ee39…`, 11719 bytes).

### What is pinned now

| field | value |
|---|---|
| URL | `https://github.com/modelcontextprotocol/modelcontextprotocol` |
| commit | `aa8ce049f089f92618340190d4ece141f663310d` |
| subject | `Merge pull request #3282 from DanielTemesgen/add-filesystems-wg` |
| commit date | 2026-09-08T13:24:34+01:00 = **2026-09-08 12:24:34 UTC** |
| fetched at | 2026-09-08T14:27:51Z (`git rev-parse origin/main` in the fresh clone printed `aa8ce049f089f92618340190d4ece141f663310d`) |

| fixture path | upstream blob at aa8ce049 | bytes | sha256 | `check` |
|---|---|---|---|---|
| `fixtures/mcp/aa8ce04/docs/specification/2026-07-28/changelog.mdx` | `424b2653ee392eaaede97ec07d35771ad6216c35` | 11719 | `b327e576f4c96b34e92f338f8ffefc35e13d0e953ab76bdb3aab342d104c8e53` | `fail` |
| `fixtures/mcp/aa8ce04/docs/specification/draft/changelog.mdx` | `7f0db68c5f599bcc4102323cbf53aa7ea6b07e6a` | 86 | `09d94d1a4525a5296627636774c7145bd837f736aaa5ea3ed6e4c8474200f77e` | `note` |

Taken with `git cat-file blob <commit>:<path>` from the fresh clone, never from a worktree:
`core.autocrlf` is `true` on this machine and a checkout would rewrite the bytes these digests pin.
`git hash-object` over each copied file and `git rev-parse :<path>` over each **staged** blob both
reproduced the upstream blob id exactly. Each file carries **0 CR bytes**, so the
`.gitattributes` ordering flaw recorded for the Insight entries above (`* text=auto eol=lf` sorts after
`fixtures/** -text`, and `git check-attr text eol` reports `text: auto, eol: lf` here too) is harmless
for the same measured reason: there is no CRLF for a filter to rewrite.

**Why the two paths are checked differently.** `2026-07-28/changelog.mdx` is the changelog of the
revision **in force**, so a change to it is a change to what the specification says changed and must
red the run: `check: "fail"`, written out rather than left to the default because its sibling is
`note`. `draft/changelog.mdx` is where the next revision's changes accumulate; at this tip it is an
86-byte placeholder whose entire body below the front matter is *"Changes since the most recent
release will accumulate here."* A move there is the **early warning that a new revision is coming**,
and it is reported rather than failed because it moves with every accepted SEP — under `fail` it would
red the daily check for ordinary upstream progress no finding here depends on. The `noted:` line still
prints both blob ids, so a green row still says out loud what moved.

**The redirect, recorded so a reader can see which dated page `latest` meant.** At the time of writing,
`https://modelcontextprotocol.io/specification/latest/changelog` returns 200 after redirecting to
`https://modelcontextprotocol.io/specification/2026-07-28/changelog` (observed this session at
14:28:47Z with node `fetch`, `redirect: "follow"` — drift's own client). `/specification/changelog` is
404. That redirect is the thing the retired entry was really watching, and it is written down here
because the git pin no longer observes it.

**Registry bookkeeping.** `fixtures/upstreams.json`: the http entry becomes
`mcp-specification-changelog/render-2026-09-08T0959Z`, `role: historical`, with a `role_reason` naming
what superseded it and a `last_observed_note` on why its frozen `last_observed` is kept rather than
deleted — the pattern `asqav-sdk/22a970d` set on 8 September. The new `git` entry takes the plain
`mcp-specification-changelog` id. As with the Insight and `a21d060` entries, **no `bytes` member and no
`pinned_at` member were written into that file**: its own `what_this_file_is_not` says it carries no
byte counts, and the instant lives here. The byte counts are in the table above, which is the row
`test/upstreams-provenance.test.ts` reads.

**What this pin does not do.**

- **It does not detect a new revision *directory* appearing.** If the project cuts `2026-11-xx` and
  adds `docs/specification/2026-11-xx/changelog.mdx`, both pinned paths can stay byte-identical and
  this entry reports `current` — a new file at a path nothing names is invisible to a pin over named
  paths. The `draft/changelog.mdx` note is a proxy for that event and not a substitute: it fires when
  the draft accumulates a change, which is *correlated* with a coming revision, not the same event. The
  general form is B-125's directory-tree question, which is not answered here.
- **It does not observe the rendered page at all any more.** If the render breaks, 404s, or diverges
  from the source, nothing in this repository would see it. The retired entry's digest is frozen
  evidence of one body at one instant and is never fetched again.
- **It does not establish that the redeploy is what changed the render.** The merge at 12:24:34Z sits
  inside the 12:21:23Z–12:34Z window and the source files are six weeks old, which makes a
  content-driven change impossible and a redeploy overwhelmingly likely — but the two captures were
  not diffed byte-for-byte to locate the changed elements, as was done for the C2PA page above. The
  mechanism here is inferred from the timing and the source, not located in the bytes.
- **It does not say the tip is still the tip.** It is one observation of `origin/main` at 14:27:51Z.
  The next scheduled run is what will say whether `main` moved after.

## Appended 2026-09-09 — Insight's v5 protocol fix: the two immutable registry objects re-pinned, the release chain, and the v5 sample

On 2026-09-08 this repository found that Insight had rewritten the `preTradeUidsHash` commitment rule
inside `.well-known/oracle-keys.json` under an **unchanged** `schemaVersion` 4 (FINDINGS F10–F14, and
the provenance section above). The founder told YuTao the same day. He answered at ~17:56Z with a
protocol-level fix rather than a wording fix, and closed: *"I consider the issuer-side remediation
complete. I am keeping H9 open in my record until you independently repin the immutable objects and
confirm the v5 sample from bytes in receipt-verify."* This section is that re-pin.

### The five documents, fetched once each with `tools/drift.ts`'s own client

node `fetch(url, { method: "GET", redirect: "follow" })`, no added headers (`tools/drift.ts`
l.177–181), through a one-off script. Bodies written to `refs/` and `fixtures/insight/` byte-exact,
with no re-serialisation.

| path | URL | retrieved (response `Date`) | bytes | sha256 |
|---|---|---|---|---|
| `refs/insight-oracle-registry-release-0xd240af8f16adb282cbbbb9feb695f5bfb8cccde074af046fb7d4ca4c2d4c5c2e.json` | `…/.well-known/oracle-registry/releases/0xd240af8f…` | 2026-09-09T14:43:16Z | 20488 | `cab85b239d53ac336c018a18ba26a487e76e2c86b4d5e416fbd76b891dd14785` |
| `refs/insight-oracle-registry-profile-0xe7513b059e9f8291bfa21250e0234661d74112a491efc6b40fbb56692013cb8e.json` | `…/.well-known/oracle-registry/profiles/0xe7513b05…` | 2026-09-09T14:43:17Z | 2372 | `284056499d0e779f7c168edd11dd716e64acf173bcb43df0bc58cc7bb7287ace` |
| `refs/insight-oracle-registry-current-2026-09-09T1443Z.json` | `…/.well-known/oracle-registry/current.json` | 2026-09-09T14:43:18Z | 1017 | `cc824ff29bc46eec198b5ea7679f35eaa72fcb2ffb0b1cdd34d912d3e96f4a17` |
| `refs/insight-oracle-registry-release-0xf45d4c0272300f8132dba75c49b337557cf6fd7975b32fd14a8b4e13f430a8f7.json` | `…/.well-known/oracle-registry/releases/0xf45d4c02…` | 2026-09-09T14:43:40Z | 21212 | `f85381e271869daa6bfa53956441cd3b2641b9c53d326e4e2e59f8498f822fd7` |
| `refs/insight-oracle-keys-2026-09-09T1440Z.json` | `…/.well-known/oracle-keys.json` | 2026-09-09T14:40:02Z | 21836 | `dbcf0929615b59aba2cb70f0f45cc246807cab2109b1cb316cee2fd70c01fd57` |
| `fixtures/insight/execution-sample-v5-2026-09-09T1443Z.json` | `…/api/v1/execution/attestation/sample?schemaVersion=5` | 2026-09-09T14:43:43Z | 5015 | `f5d32828cfac672e3bffdc96da188f8cfd3681a7281a22ef0bddedff81bc3336` |

Response headers, for each: **no `ETag` and no `Last-Modified`**, as on every earlier fetch of this
origin. The three `oracle-registry` objects and the sample returned `Age: 0` with
`x-vercel-cache: MISS`; `oracle-keys.json` returned `Age: 219` on a `HIT`, so its body was generated
at the origin at **2026-09-09T14:36:23Z**. `Cache-Control` separates the three kinds cleanly and the
issuer's own headers say what this section says in prose:

| document | `Cache-Control` |
|---|---|
| the two releases and the profile | `public, max-age=31536000, immutable` |
| `current.json` | `public, max-age=60, must-revalidate` |
| `oracle-keys.json` | `public, max-age=300` |
| the v5 sample | `private, no-store, max-age=0` |

Every response carried `Content-Encoding: br`; node's `fetch` decompresses transparently, so the
digests above are over the decompressed bodies. That is not taken on trust: the Lead fetched the same
objects at ~09:3xZ today with `Accept-Encoding: identity` and reported the identical digests for the
release, the profile and `current.json`, which is an independent decode path arriving at the same
bytes.

**On "each object once".** The handoff asked for one fetch each and that is what was made, so the
four-GET control B-128 ran on `oracle-keys.json` was not repeated here. Two of the six digests have a
second independent observation anyway: `oracle-keys.json` was fetched by `npm run drift` at this
session's P0 (~14:37Z) and reported `dbcf0929…fd57`, the same bytes; and the release, the profile and
`current.json` match the Lead's own fetches of ~09:3xZ. The v5 sample deliberately has **no** second
observation and cannot have one — see the sample subsection below.

### The two immutable objects are what YuTao said they are

| object | our sha256 | his stated pin | verdict |
|---|---|---|---|
| release `0xd240af8f…` | `cab85b239d53ac336c018a18ba26a487e76e2c86b4d5e416fbd76b891dd14785` | the same | **equal** |
| profile `0xe7513b05…` | `284056499d0e779f7c168edd11dd716e64acf173bcb43df0bc58cc7bb7287ace` | the same | **equal** |

A byte digest is the weaker half of that statement. Both objects are **content-addressed**: each
carries a `digest` member declaring `keccak256` over the *RFC 8785 JSON Canonicalization Scheme* form
of its single payload member, and the id in the URL is supposed to be that value. This session
recomputed it from the pinned bytes:

```
profile 0xe7513b05…  JCS(profile) = 2139 bytes   keccak256 -> 0xe7513b059e9f8291bfa21250e0234661d74112a491efc6b40fbb56692013cb8e   EQUAL
release 0xd240af8f…  JCS(release) = 20255 bytes  keccak256 -> 0xd240af8f16adb282cbbbb9feb695f5bfb8cccde074af046fb7d4ca4c2d4c5c2e   EQUAL
release 0xf45d4c02…  JCS(release) = 20979 bytes  keccak256 -> 0xf45d4c0272300f8132dba75c49b337557cf6fd7975b32fd14a8b4e13f430a8f7   EQUAL
```

**Two independent canonicalisers, because one agreeing with itself proves nothing.** The bytes above
were produced by a JCS serialiser written for this check in TypeScript-style JavaScript, and
re-produced by the **Python** implementation in `tools/asqav_envelope_hash.py` that
`tools/jcs-cross-check.py` drives — the second-opinion serialiser this repository already keeps for
the walker, which shares no code with the first. The two canonical strings are **byte-identical** for
all three objects (2139 / 20255 / 20979 bytes each side), and keccak-256 over either reproduces the
stated id.

**The controls, so the green above is not free.** Changing one byte of the canonical form moves the
address to `0x6396ee98…` (profile), `0x394eb31c…` (release `0xd240af8f`) and `0xf38a2cda…` (release
`0xf45d4c02`) — none equal to the stated id, and the script asserts that the mutation actually
happened before reporting the result. A first attempt at this control replaced a substring that turns
out not to occur in the two release objects, so it recomputed the unmodified digest and "passed"; that
run is discarded and named here because it is precisely the check-that-cannot-fail this repository's
own rules are about. The JCS-equivalence assumption is measured too: the serialiser reports any
non-integer number and any number outside the IEEE-754 safe-integer range, which are the two
conditions under which key-sorted `JSON.stringify` would stop being JCS. It reported **none** for all
three objects.

### The release chain, and the release he has not written to us about

`current.json` at 14:43:18Z names `registryRevision` **2026-09-09.1**, `effectiveFrom`
**2026-09-09** and `releaseId` **`0xf45d4c02…`** — one revision past the release YuTao described. That
release was fetched and pinned as well. Structural diff, leaf by leaf, against `0xd240af8f…`:

```
A refs/…release-0xd240af8f….json   872 leaves
B refs/…release-0xf45d4c02….json   878 leaves
only-in-A = 0   only-in-B = 6   differing leaves present in both = 7

ONLY IN B  .release.predecessorReleaseId = "0xd240af8f16adb282cbbbb9feb695f5bfb8cccde074af046fb7d4ca4c2d4c5c2e"
ONLY IN B  .release.mainlineIntegrationIsolation.activationSetId = "0xe125edc38c0e89a4368203c0831728116a4430c329204fe4cc5db6144f8f4469"
ONLY IN B  .release.mainlineIntegrationIsolation.activationRule = "repository presence never activates an integration; only its policy id does"
ONLY IN B  .release.mainlineIntegrationIsolation.currentPath = "/.well-known/oracle-registry/integrations/current.json"
ONLY IN B  .release.mainlineIntegrationIsolation.immutablePolicyPathTemplate = "/.well-known/oracle-registry/integrations/{policyId}"
ONLY IN B  .release.mainlineIntegrationIsolation.immutableSetPath = "/.well-known/oracle-registry/integration-sets/0xe125edc3…"

DIFFERS  .releaseId                 0xd240af8f… -> 0xf45d4c02…
DIFFERS  .release.registryRevision  "2026-09-08.1" -> "2026-09-09.1"
DIFFERS  .release.effectiveFrom     "2026-09-08" -> "2026-09-09"
DIFFERS  .release.changes[0..3]     the v5/profile/schemaVersion/legacy-layout lines -> four partner-isolation lines
```

**The releases chain and the semantics did not move with them.** `predecessorReleaseId` is exactly the
release he named, and `release.executionReceipt.currentProfileId` is the **same** `0xe7513b05…` in
both, with `supportedSchemaVersions` `[1,2,3,4,5]` in both. So the only registry-wide change between
8 and 9 September is partner-integration isolation, and no commitment, sentinel, scale or verdict rule
moved. This reproduces the Lead's own diff of ~09:3xZ (878 against 872, six added, none removed, seven
changed) independently.

Both releases also carry, in `release.predecessorSnapshots`, **this repository's own two pins**:
`{"label": "5 Sep copy reported by Headless", "digestPrefix": "7cc00b95", "bytes": 17958}` and
`{"label": "8 Sep copy reported by Headless", "digestPrefix": "a45b5d0a", "bytes": 18003}`. Those are
the digests and byte counts recorded in the two provenance sections above, quoted back by the issuer.

### What the profile says, and why it settles the 8 September finding

`profile.commitments.preTradeUidsHash`, read from the pinned bytes:

```
algorithm      keccak256
inclusion      omit entries equal to zero bytes32
ordering       route order, source first
encoding       concatenate each retained uid as 32 raw bytes without separators
emptyInput     keccak256 of empty bytes
```

That is, clause for clause, the construction `src/adapters/insight.ts` implemented on 8 September
(`uidsHashCandidates`, the candidate named `keccak(non-zero uids in route order, packed) [registry
2026-09-08]`) — now stated in an object that cannot be edited without changing its own name. The
profile also carries `receipt.profileIdSignedInSchemaVersions` `[5]` and
`receipt.legacyImplicitSchemaVersions` `[3, 4]`, `measuredFieldsHash` and `reasonCodesHash`
constructions, two sentinels, eight scales, four enumerations and nine ordered `verdictRules`.

### `oracle-keys.json` moved again — and this time the issuer versioned it

Structural diff, `refs/insight-oracle-keys-2026-09-08T1218Z.json` against
`refs/insight-oracle-keys-2026-09-09T1440Z.json`:

```
leaves: A=701  B=815   only-in-A=4   only-in-B=118
differing leaves present in both: 1
  DIFFERS  .schemas.ExecutionReceipt.schemaVersion    A: 4   B: 5

ONLY IN A  .schemas.ExecutionReceipt.commitments.preTradeUidsHash
ONLY IN A  .schemas.ExecutionReceipt.commitments.measuredFieldsHash
ONLY IN A  .schemas.ExecutionReceipt.sentinels.attestationAgeAtExecSeconds.value
ONLY IN A  .schemas.ExecutionReceipt.sentinels.attestationAgeAtExecSeconds.meaning
```

The four leaves that left are the commitment and sentinel prose; they are now in the immutable
profile. Of the 118 that arrived, the load-bearing ones are
`.schemas.ExecutionReceipt.semanticProfile.{profileId, immutable, signedField}`, the 45th signed
EIP-712 field `profileId: bytes32`, a frozen `schemas.ExecutionReceiptV4` preserving the retired
layout (44 fields, `schemaVersion` 4), and the top-level `registryRelease`, `registryRevision`,
`effectiveFrom` and `partnerIntegrations` members. **The one leaf that changed in place is the version
number.** On 8 September a commitment rule changed under an unchanged `schemaVersion`; on 9 September
the layout changed and the version moved with it. That is the difference F10 was raised about.

`current.json` now calls this URL the **`stableRegistry`**, which is the name the upstream entry's
`role_note` records.

### The two-day movement history of the mutable document, as one table

| pinned at | bytes | sha256 | what the next move was |
|---|---|---|---|
| 2026-09-05T18:29:05Z | 17958 | `7cc00b957f14e1a954bcbff7dd0b5e97b9f4af1ef8c2e21cb9fa879339ce7330` | the `preTradeUidsHash` prose rewritten under an unchanged `schemaVersion` 4 (F10) |
| 2026-09-08T12:18:10Z | 18003 | `a45b5d0a8e3b432c1e827310bc4caa7b67ad440133ee32900d8520615a0f9003` | the v5 protocol fix: commitments out to the profile, `schemaVersion` 5 |
| 2026-09-09T14:40:02Z | 21836 | `dbcf0929615b59aba2cb70f0f45cc246807cab2109b1cb316cee2fd70c01fd57` | — the pin as of this section |

Twice in two days. That is the reason the registry bookkeeping below moves the weight off this
document.

### The v5 sample

Pinned as `fixtures/insight/execution-sample-v5-2026-09-09T1443Z.json`, 5015 bytes, sha256
`f5d32828cfac672e3bffdc96da188f8cfd3681a7281a22ef0bddedff81bc3336`, response `Date`
2026-09-09T14:43:43Z. **It is one observation and it cannot be re-fetched**: the endpoint mints a
fresh signature, `signedAt` and `requestId` per call, and `Cache-Control: private, no-store` says so.
The Lead read the same endpoint at ~09:3xZ today and got **5015 bytes** at
`8c15d9e0ae0c6055eefb34bb9128bdb4fe7591055cbb698984bc53aad1f4b052` — the same length, a different
digest, which is this repository's `nondeterministic_endpoint` claim re-measured on the v5 layout
rather than assumed to carry over from v4. What is done with these bytes is in the report and in
`test/insight.test.ts`; this section records only where they came from.

### Registry bookkeeping

`fixtures/upstreams.json`:

- **Three new `current` http entries** — `insight-oracle-registry-release/0xd240af8f`,
  `insight-oracle-registry-profile/0xe7513b05` and `insight-oracle-registry-release/0xf45d4c02`. Their
  `ref_source` states what such a pin can and cannot detect: because the id is the digest of the
  content, a `changed` outcome cannot mean "the document was updated" — it can only mean the issuer
  served different bytes under an identifier that is supposed to be their digest. There is no benign
  reading of that, which is what makes these the strongest pins in the file and the load-bearing ones
  for Insight's commitment semantics from today.
- **`insight-oracle-registry-current/2026-09-09T1443Z`**, `role: historical`. The role is chosen for
  its mechanical meaning in `tools/drift.ts` — `not_checked`, never counted, never fetched again — and
  not because the document is superseded. See the gap below.
- **`insight-oracle-keys`** re-pinned at the 14:40:02Z bytes, with a `role_note` recording the
  `stableRegistry` naming and the structural diff, and a `role_reason` recording the two moves in two
  days and that the immutable objects now carry the weight. Its `last_observed` was dropped rather
  than left contradicting the new `sha256`; `npm run drift -- --record` rewrites it in the same
  session.
- **`insight-oracle-keys/2026-09-08T1218Z`** added, `role: historical`, carrying the previous entry's
  fields unchanged plus a `role_reason` and a `last_observed_note` — the `asqav-sdk/22a970d` pattern,
  and its frozen `last_observed` (`current` at 2026-09-08T14:36:33.405Z) is kept because it is a true
  record of the last check ever made of that entry.
- The v5 sample joins the existing `insight-endpoint-samples` `unmapped` row
  (`reason_code: nondeterministic_endpoint`), whose reason now carries today's two-digest measurement.

As with every Insight entry before them, **no `bytes` member and no `pinned_at` member** were written
into `fixtures/upstreams.json`: its own `what_this_file_is_not` says it carries no byte counts, and
the instant is already `retrieved`. Both facts live in the table at the top of this section, which is
what `test/upstreams-provenance.test.ts` reads.

`.gitattributes`: `git check-attr text eol` reports `text: set, eol: lf` for all six new paths,
because `*.json text eol=lf` sorts after `refs/** -text` and `fixtures/** -text` and the last matching
line wins — the same pre-existing ordering flaw every earlier Insight pin records. Harmless here for
the same measured reason: **each of the six files contains zero CR bytes and zero LF bytes** (each is
one unterminated JSON line), so there is no line ending for a filter to rewrite, and
`git cat-file blob :<path>` over each staged blob reproduces the digest in the table above.

### What this pin does not do

- **It does not establish that the profile's prose is what the issuer's code does.** Only a signed
  receipt that reproduces under a rule shows that, and the v5 sample shows it for `preTradeUidsHash`
  alone. `measuredFieldsHash` and `reasonCodesHash` are stated in the profile and **not** reproduced
  from any artefact this repository holds — their pre-images are not published.
- **It does not watch the pointer.** `current.json` is `historical`, so nothing here will notice the
  next time `registryRevision` advances. Today's advance was found because the Lead read the pointer
  by hand this morning; the next one will need the same hand. The tool has no vocabulary for "an http
  upstream expected to move, whose movement should be reported and not fail the run" — `check: note`
  exists only for paths inside a `git` entry (`tools/drift.ts` l.116, l.243–245). Adding it for `http`
  entries is the smallest change that would close this, and it is not made here.
- **It does not establish when the pointer moved.** No `ETag`, no `Last-Modified`; the only bounds are
  our own reads.
- **It does not say anything about `partnerIntegrations`.** Four URLs and an `activationSetId` are
  named in the documents pinned here; none of them was fetched, and the integration set
  `0xe125edc3…` is unpinned.
- **It does not make the two retained v4 snapshots verifiable by a stranger.** The release's
  `legacyProfileResolution.rule` says v1–v4 layouts "did not sign profileId" and must be read against
  "the registry snapshot pinned by the verifier". That snapshot is a private artefact of whoever
  pinned it; two verifiers holding different snapshots can disagree about the same v4 receipt and
  neither is checkable against the other.

## Appended 2026-09-10 — RFC 9964 re-pinned at its text and its status document, and the render retired

`rfc9964-info` was pinned on 2026-09-08 at the **rendered** `/info/rfc9964` page. It has now gone
`changed` twice for a document that cannot change: an RFC is immutable by definition. That is what
makes this entry diagnostic rather than ambiguous — every movement it reported was the site, and none
of it was RFC 9964.

| observed | digest | bytes |
|---|---|---|
| 2026-09-08T09:59:01Z (pinned) | `abc75d74bf90f97356b9c6348c4a62e85cb341c8af7f556e76010325ff5eeb7c` | 731071 |
| 2026-09-09T15:11:11Z | `d32dd7a5f504efdc19de751f4f4c4e01c6327e00e52966503345c4263b00cc33` | — |
| 2026-09-10T13:15Z (last) | `a80b9a35fcd0c1ccaf4b9e14c33c9283d3cd11f3f0df2e83f1913fb7b29e79e8` | 732965 |

**The mechanism, verified in this session rather than relayed.** The body carries
`buildId:"4e11c495-7a5b-4070-9cd7-6e58a0979cb9"` and the site version string `1.90.1`. Two fetches
two seconds apart, from drift's own client, are byte-identical at 732965 bytes — so the digest is
stable *within* a deploy and moves *across* deploys, which is the signature of a per-deploy
identifier embedded in the body. The Lead's triage named build `1.90.0`, shipped 9 Sep; the string
served today reads `1.90.1`. The discrepancy is recorded rather than reconciled: the `buildId` is the
mechanism under either number, and this repository pins what it measured.

A body carrying a per-deploy identifier cannot be pinned by digest at all. The pin reds on every
redeploy and would stay green through an actual content change only by accident — the B-125 class,
and the same disposition as `mcp-specification-changelog/render-2026-09-08T0959Z`. Retired to
`role: historical` under the id `rfc9964-info/render-2026-09-08T0959Z`, with
`role_reason_code: rendered_page_furniture`. Its `last_observed` is left exactly as written: it is a
true record of the last check made while the entry was current, and `tools/drift.ts` never touches a
historical entry again.

### The two entries that replace it

Fetched 2026-09-10 with the same client `tools/drift.ts` uses — node
`fetch(url, { method: "GET", redirect: "follow" })`, no added headers — and written to `refs/`
byte-exact, with no re-serialisation.

| path | URL | http | bytes | sha256 (node `fetch`) | `check` |
|---|---|---|---|---|---|
| `refs/rfc9964.txt` | `https://www.rfc-editor.org/rfc/rfc9964.txt` | 200 `text/plain;charset=utf-8` | 180564 | `8c42035b948301b197d431de8b3f40019bdaa3bb40150dc523306923948f34cf` | `fail` |
| `refs/rfc9964-status.json` | `https://www.rfc-editor.org/rfc/rfc9964.json` | 200 `application/json;charset=utf-8` | 998 | `b55af9396c131e4617944f5dc56f160ad508ba24b9ae7382f211b05f1202052a` | `note` (`mutable_pointer`) |

**`rfc9964-text` is `fail`, and it is the strongest of the three pins.** A published RFC is immutable;
the RFC Editor does not reissue one under the same number. These bytes cannot legitimately move, so a
`changed` outcome here does not mean the document was updated — it means the RFC Editor broke its own
rule or this repository was served something else. There is no benign reading. `ETag:
"c050e1c98197335743077ad8cda678d7"`, `Cache-Control: public, max-age=86400`, no redirect: the URL as
written answers 200. The text is RFC 9964, *ML-DSA for JSON Object Signing and Encryption (JOSE) and
CBOR Object Signing and Encryption (COSE)*, Prorock and Steele, Proposed Standard, May 2026, from
`draft-ietf-cose-dilithium-11` — which is what this repository actually cites. The `/info/` page was
only ever a wrapper around a link to it.

**`rfc9964-status` is `note` with `mutable_pointer`, and it carries the question the render was meant
to answer.** The status of a published RFC is the only thing about it that *can* change, and this
document is where those changes appear: `errata_url` (null today — it becomes a URL the moment anyone
files an erratum), `pub_status` and `status` (`PROPOSED STANDARD` today), and `obsoletes`,
`obsoleted_by`, `updates`, `updated_by`, `see_also` (all empty today, each filling in when a later RFC
touches this one). Every one of those movements is the document doing its job, and under `fail` the
entry would red the daily check the first time somebody filed an erratum — precisely the event it
exists to surface. `ETag: "3be9f2cf258270cae0c88bf822e4b56d"`, no `Cache-Control`, no `Last-Modified`,
so the only bound on when it moves is our own reads.

The note does not lose the move: the row still prints both digests and the run counts it in the
SUMMARY's `noted=N`. Only the escalation is dropped.

### What this pair does not do

- **It does not watch for a successor RFC by number.** `obsoleted_by` fills in only when the RFC
  Editor records it; a successor published and not yet cross-referenced is invisible to both pins.
- **It does not establish that the text pin will ever move, which is the point and also the limit.**
  A pin that can only go red on misconduct is a pin that reports nothing on an ordinary day. It is
  worth having because the failure it detects has no benign reading, not because it is informative.
- **It does not restore what the render was watching.** The render was pinned for the /info/ page's
  own summary block; nothing here pins the HTML, and nothing will notice if the RFC Editor changes how
  that page presents the document.

## Appended 2026-09-10 — `dapr-workflow-history-signing`: the page did not change, its footer commit stamp did

`--record` was asked for, and it is recorded. What was NOT asserted is the cause, because the cause
the triage relayed does not survive checking.

The pin moved from `7cf9a3c539f8cd2285f1cfee08689148459fa66718d4de246b18287bf7d2c52b` (72326 bytes,
2026-09-08) to `1059546c32e83a556eb6917f2c343fa6340c683bb00342fb96bff6349992327d` (72317 bytes,
`ETag: "76527003"`, 2026-09-10). **The prior bytes were never held** — the entry is `no_pinned_file` —
so the two captures cannot be diffed, and nothing below comes from a diff.

What was established instead, from the upstream repository and from today's body:

1. The page's own source,
   `daprdocs/content/en/developing-applications/building-blocks/workflow/workflow-history-signing.md`,
   has **no commit touching it since 2026-08-25**. It is blob
   `57d27501ce67688f2557eb81ef183295342fde07` at 33842 bytes at the tip.
2. **PR #5306 did not touch it.** `Workflow: warn to not reuse instance IDs`, merged
   2026-09-08T17:11:17Z as `78b25330358bbe68b7e0f2d704f02d0432aebb75`, changed three files:
   `howto-manage-workflow.md`, `workflow-features-concepts.md` and `reference/api/workflow_api.md`.
3. The rendered body embeds the repository's latest commit **in its footer**, reading today:
   `Merge pull request #5306 from JoshVanL/docs/workflow-instance-id-reuse (78b2533)`.

**So the triage names the right commit and the wrong mechanism.** The page's content did not change;
its footer commit stamp did, and that stamp moves on *every* merge to `dapr/docs` regardless of what
the merge touches. This is the `rendered_page_furniture` class — the same one that retired
`rfc9964-info` above and `mcp-specification-changelog/render-2026-09-08T0959Z` on 8 September.

**Left `check: fail`, deliberately, and escalated instead of acted on.** The handoff directs that it
stay `fail` because a change to that page is a commercial signal worth seeing. The finding is that,
as pinned, it cannot be that signal: it will red on every merge to `dapr/docs`, and a real edit to the
page would be indistinguishable from the noise. De-escalating a commercial signal is not a decision to
take inside a re-pin, so it is recorded in the entry's `observation_2026-09-10` and reported, not
made. The page is a Hugo render with content-hashed asset names; pinning what the page *carries*
rather than the page — the `.md` source in `dapr/docs` — is the shape that worked for the MCP
changelog and is the obvious candidate.

---

## Appended 2026-09-10 — `agent-governance-testvectors` re-pinned at a commit, and the corpus taken to that tip

**B-159.** The entry pinned fourteen paths by sha256 against the moving ref `HEAD` and **no commit at
all**. Its own note admitted it could never report `current`; what the 2026-09-09 run exposed is
worse than that. When four of the fourteen went `moved_changed`, nothing in the record said what they
had moved *from*. A pin that cannot name its own baseline cannot answer the question the tool exists
to ask.

Resolved in this session by a full clone: `git rev-parse HEAD` =
`b82a50a375299e5edfbabea686b0e2654df75006`, committed 2026-09-10T07:25:56Z, subject
*fix: valid Cedar fixture policy; the reference driver signs the real decision; Node 20 and 22 in CI
(#17)*. Every blob id and sha256 below is from `git cat-file blob <commit>:<path>` in that clone,
never from a checkout: `core.autocrlf` is true here.

**Four of fourteen moved. Ten reproduce their previous sha256 exactly**, which is what makes the four
a finding rather than a wholesale replacement.

| path | previous sha256 | sha256 at `b82a50a` | blob at `b82a50a` | `check` |
|---|---|---|---|---|
| `README.md` | `7914288498b3c3bb1342db81f6982b429e3f53ebd5c3250fc2b9645812d98b41` | `f5d8fa4293c6273cce592a3977f0608cc35d4464182c523c78f8586cead54004` | `63a20dd533aa060478f4266407bc326393fb1be0` | `note` (`author_bookkeeping`) |
| `spec.md` | `b053460e8ecabd7fc7d3f0a6fe24afaafdc6606d79995306dad314943d537550` | `8f06f93022db625f35f197e24843d6ab21c694b6c6bbc4954a86992ca981d09c` | `2ce503bc7a40127e438cf06f9545ea9e1a5e68b9` | `note` (`author_bookkeeping`) |
| `expected/receipt-schema.json` | `a1ffe19d87034d61b80dceeb11287a43155daa0613a391ed85b804ace2b0923a` | `184dddb4aa2ca18abedcbc1234be95d69a4de752a3d179e1009e9f68b829ad63` | `5b7dae2c2373c92915c1a8d45ec8116d7d9ccb2b` | `fail` |
| `expected/chain.jsonl` | `446409d03b77aa066863fef8cea850b73b5893b202f5993285c9aa3b4a77efc0` | `32dfcc586c2c1f7ee8c801021ddd1a9ecd85de06a0257b62fdeabbdce63399b4` | `3eeb2a9086af447c784a1cd206997e86e401875f` | `fail` |

The other ten — `fixtures/keys/README.md`, `aps-gateway-enforcement/README.md`, and the eight files
under `2-external-verification/` and `4-portability/` — are byte-unchanged and keep their digests.

`fixtures/acta/published` was taken to the new bytes in the same commit, so the corpus and the pin
agree rather than the pin describing bytes we do not hold. Each of the four was written from
`git cat-file blob`, and each staged blob re-digests to the value above.

### The walker was run before and after, and no grade moved

| | before | after |
|---|---|---|
| SUMMARY `match` | 410 | 410 |
| SUMMARY `mismatch` | 20 | 20 |
| `acta/published` registered / match / mismatch | 1 / 1 / 0 | 1 / 1 / 0 |
| SUMMARY `unregistered` | 510 | **514** |

The only difference in the entire walker output is four **new unregistered** rows:
`#1/policy_digest`, `#2/policy_digest`, `#3/policy_digest` and `#4/policy_digest` in
`expected/chain.jsonl` — a field this tip adds, consistent with the commit subject, and one that no
rule in `walker/scopes.json` registers. Nothing that was graded before is graded differently now.

### The corpus re-based itself from draft revision -01 to -03

Not a digest observation, and the most consequential thing in this re-pin. At the previous pin,
`spec.md` carried the sentence *"This spec is tied to `draft-farley-acta-signed-receipts-01`."* At
`b82a50a` that sentence is **gone**. In its place the file cites
`draft-farley-acta-signed-receipts-03` at l.60 and l.105, and `README.md` cites `-03` in four places.
The corpus moved two draft revisions without changing its repository layout, which is exactly the
kind of change a sha256-only pin against a moving ref could report but never explain.

`FINDINGS.md` §E1 records the corpus as tied to `-01`. **That premise has moved with the bytes.**
Whether §E1 is re-graded against `-03` is a methodology decision of the same class as B-150 and is
not taken in this session; it is flagged in the report. This repository already pins
`draft-farley-acta-signed-receipts-03` as `current`, so the corpus and our draft pin now agree, which
they did not before.

`test/acta.test.ts` carries the fact so it cannot be lost: the assertion now requires `-03` to be
present **and** `-01` to be absent, so a stale tie sentence re-appearing beside the new citation is
red rather than green.

**Why `README.md` and `spec.md` are `note`.** Both moved while every graded artefact under
`aps-gateway-enforcement/` held. They are the author's prose about the corpus, not the corpus, and
under `fail` they red the daily check for ordinary editing that no finding here depends on. The move
is still printed in the row's detail line and carried in `noted_paths`.

The sha256-only entry is retained as `agent-governance-testvectors/HEAD-sha256-only`,
`role: historical`, with its fourteen digests **kept as written**: they are the baseline this re-pin
was diffed against, and deleting them would destroy the only record of what the corpus held before it
moved.

---

## Appended 2026-09-10 — `draft-hillier-scitt-arp-04` pinned beside `-03`

The 2026-09-09 run reported `superseded`. Pinned here; `-03` becomes `historical` and keeps its
digest.

| path | URL | http | bytes | sha256 |
|---|---|---|---|---|
| `refs/draft-hillier-scitt-arp-04.txt` | `https://www.ietf.org/archive/id/draft-hillier-scitt-arp-04.txt` | 200 `text/plain; charset=utf-8` | 591005 | `63164345921add3a6c4cebf26d6e434306e5efa4120fdf2fcec2535d59691490` |

**The digest was reproduced, not copied.** The handoff stated the value; this session fetched the
bytes and computed it, and the two agree. `Last-Modified: Tue, 08 Sep 2026 21:03:48 GMT`,
`ETag: W/"6aa07834-9049d"`, `Cache-Control: public, max-age=14400`. The datatracker document API
reports rev `04`, time 2026-09-08T21:14:49Z, title *Attestation Reconciliation Protocol*, 213 pages;
`HEAD .../draft-hillier-scitt-arp-05.txt` answers 404, which is the probe `tools/drift.ts` itself
makes, so `-04` is the highest revision published.

**`-03` is retained deliberately and its digest is unchanged**
(`fe7ba656ef07842c365ce93938610cd874668c29f0fa06031d37d0e4e72b395d`). Every existing SCITT ARP
finding in this repository was graded against `-03`; retiring the digest would orphan those findings
from the bytes they were made over. **Nothing is re-graded against `-04` in this session.** The
methodology decision is B-150 and is the Lead's; a separate handoff carries any re-grade. The id
convention holds for both: id equals `name` + `-` + `pinned_rev`.

---

## Appended 2026-09-10 — Insight's v5-only production admission: the Headless policy, the activation set, the 2026-09-10.1 release and the two mutable pointers

**B-153.** YuTao's letter of 2026-09-09 ~17:31Z answered the legacy-profile question with a deployed
protocol change and said no response is required unless an independent re-pin finds a discrepancy.
This is the re-pin. **It found none.**

Every URL below was resolved by following a path from `current.json`, or from the release object
`current.json` names, or from the activation set that release names — never by guessing. The
resolution order was: `current.json` → `release` → `mainlineIntegrationIsolation.currentPath` →
`integrations/current.json` → `immutableSetPath` → the activation set → `partners.headless` → the
policy id → `policyTemplate`. That last step is the one that matters: the Active Headless policy's
URL was **derived from the activation set's own bytes**, so the object pinned is the one the registry
says is active, not the one the letter happened to name.

All fetched with the same client `tools/drift.ts` uses — node
`fetch(url, { method: "GET", redirect: "follow" })`, no added headers — and written to `refs/`
byte-exact, with no re-serialisation. Requested at the `www.` host: the bare host answers 307.

| path | object | bytes | sha256 | `check` |
|---|---|---|---|---|
| `refs/insight-oracle-registry-release-0x96d1f624.json` | release 2026-09-10.1 | 21519 | `9ef754b8c682e19c72c68dff71a6a836172639ee5e6a857b30307ec394ce0bf8` | `fail` |
| `refs/insight-oracle-registry-integration-set-0xe9512f0b.json` | activation set v2 | 1400 | `91e4fd0cc264ea2bde6ae4ff4092f090b901070376bffd24b6c16a1891e4763b` | `fail` |
| `refs/insight-oracle-registry-integration-policy-0xd510bd9f.json` | Active Headless policy v2 | 1173 | `14e29fbd050bd0d5b52cd4158d25d9fe1d0ea1ef14c8c92b397155d0c9cfc0f7` | `fail` |
| `refs/insight-oracle-registry-current-2026-09-10.json` | `current.json` | 1017 | `64324114f6f3bdde079219f2d0620f7737d2c62b30a84ff897b56c47391e3602` | `note` (`mutable_pointer`) |
| `refs/insight-oracle-registry-integrations-current-2026-09-10.json` | `integrations/current.json` | 825 | `bebeac8c75fed461e778b6b7a4a965c132bf69e0bb148edd05a195f16eb7420b` | `note` (`mutable_pointer`) |
| `refs/insight-oracle-keys-2026-09-10.json` | `oracle-keys.json`, the eighth pin | 22762 | `8e430ccf89854864e327e3dc32a08d54e91f6c7807a3dbf311613fd5e854535e` | `note` (`mutable_pointer`) |

The semantic profile `0xe7513b05…` was re-fetched and is **byte-identical** to the 9 September pin
(`284056499d0e779f7c168edd11dd716e64acf173bcb43df0bc58cc7bb7287ace`, 2372 bytes), so it is not
re-pinned; it is re-verified below.

### Every content address recomputed, with controls

Each object declares its own digest scope. That scope was honoured rather than assumed — the three
objects do not agree on it, and using one rule for all three would have produced three wrong
addresses.

| object | declared scope | canonical bytes | recomputed address | id in the URL | match |
|---|---|---|---|---|---|
| release 2026-09-10.1 | the release object in this response | 21286 | `0x96d1f624…b575e2c` | `0x96d1f624…b575e2c` | **yes** |
| activation set v2 | the activation set excluding `activationSetId` | 1059 | `0xe9512f0b…bc24190` | `0xe9512f0b…bc24190` | **yes** |
| Active Headless policy v2 | the policy object excluding `policyId` | 861 | `0xd510bd9f…7a17de158` | `0xd510bd9f…7a17de158` | **yes** |
| semantic profile | the profile object in this response | 2139 | `0xe7513b05…2013cb8e` | `0xe7513b05…2013cb8e` | **yes** |

Method, unchanged from `cc12c21`: keccak256 over the RFC 8785 canonical form, computed with **two
independent JCS serialisers** — the repository's TypeScript one and the Python one in
`tools/asqav_envelope_hash.py` that `tools/jcs-cross-check.py` drives, which shares no code with it
and depends on no third-party package. The two canonical forms were compared **byte for byte**, not
merely by digest: 21286/21286, 1059/1059, 861/861 and 2139/2139 bytes, with identical sha256 over
each pair.

**The control, run and printed before the result was believed.** A one-byte mutation of a string
member of each scope moves its address: the release to `0xa3748003…`, the activation set to
`0x40d6b8dc…`, the policy to `0x17ca765a…`, the profile to `0xffa33b67…`. Both serialisers agree on
the mutated forms too. A recomputation that could not have failed would have established nothing.

### The chain, and the profile

`predecessorReleaseId` on `0x96d1f624…` is `0xf45d4c0272300f8132dba75c49b337557cf6fd7975b32fd14a8b4e13f430a8f7`
(registryRevision 2026-09-09.1), which was already pinned here on 9 September and which itself names
`0xd240af8f…` (2026-09-08.1) as **its** predecessor. The chain 2026-09-08.1 → 2026-09-09.1 →
2026-09-10.1 is therefore complete and every link is held in this repository.
`executionReceipt.currentProfileId` is `0xe7513b05…`, **unchanged**, so the commitment semantics did
not move with this release.

### What the promotion record says the production admission rule is

`protocol/mainline/promotions/2026-09-10-headless-v5-only.json`, `promotionId` `0x338a53e5…`,
`promotionVersion` 3, `effectiveFrom` 2026-09-10, `registryReleaseId` `0x96d1f624…`,
`predecessorPromotionId` `0x5dfbc2a5…`, quoted from its `activationRule`:

> "Headless production accepts only ExecutionReceipt v5 with the policy-pinned signed profileId. A
> v1–v4 verdict is historical and snapshot-relative, must report full SHA-256 and byte length for the
> exact preserved registry bytes, and is never globally canonical."

Its `compatibilityMatrix` records nine partners; `headless` is `promoted-v5-only`, with the evidence
line "Headless policy v2 admits schema 5 only and pins the existing immutable profile; v4 is removed
from the production admission set while public historical verification remains available."

### One observation, offered as a property of the design and not as a defect

The Active Headless policy's `pins.oracleRegistryReleaseIds` is `[0xf45d4c02…]` — the **predecessor**
release, not the current `0x96d1f624…`. This is forced by the content addressing: the policy id is
named inside the activation set, whose id is named inside the release, so a policy cannot pin the
release that transitively contains it without a cycle. The consequence is worth stating because it
bears on anyone implementing the admission rule literally: **the active policy always pins one
release behind, and a verifier that follows it is pinned one release behind with it.**

### What this section does not do

- **It does not pin the promotion record.** Its URL is a path on a moving branch, not a content
  address, and its `promotionId` carries no `digest` member declaring a scope, so it cannot be
  verified the way the four registry objects were. It is read and quoted, not pinned.
- **It does not observe the runtime.** The policy is a published document; nothing here watches the
  gate that reads it.
- **It does not close the two obligations the rule creates for us.** `FINDINGS.md` F15 names them:
  the adapter implements neither the snapshot-relative rule for v1–v4 verdicts nor the
  unknown-profile refusal (B-132). Both are named, neither is fixed here.
- **It does not date any of the mutable pointers.** No `ETag` and no `Last-Modified` on
  `current.json`, `integrations/current.json` or `oracle-keys.json`; the only bounds are our own
  reads.

---

## Appended 2026-09-16 — the x402 v2 specification, pinned as bytes at the commit that was already watched, and the two 7 September settlement envelopes

Two different kinds of pin, kept in two different directories on purpose.

**The specification.** `fixtures/upstreams.json` has watched
`coinbase/x402` `specs/x402-specification-v2.md` by blob id since 2026-09-08, and said so in a
`watch_only` line: nothing under `fixtures/` held a copy. `src/adapters/x402-settlement.ts` now cites
section 6.1 of that document for the `TransferWithAuthorization` field list it encodes, and a
citation a reader cannot open without the network is not one. So the bytes are pinned here, at the
commit the entry already names.

| path | URL | http | bytes | sha256 |
|---|---|---|---|---|
| `fixtures/x402/specs/x402-specification-v2.md` | `https://raw.githubusercontent.com/coinbase/x402/dd927a26cfefc98c24b3ec38b3a8f204dad0c60d/specs/x402-specification-v2.md` | 200 | 31299 | `aa6dc5e8ccc7758689945fc7502674f51cd0f21f09ec886aa1dbc4cd86bc81b6` |

**The digest was not copied from the entry; it was reproduced, and that is the check.** The entry has
carried `aa6dc5e8ccc7758689945fc7502674f51cd0f21f09ec886aa1dbc4cd86bc81b6` for blob
`b7eaea66f2743eac7ce2d0e1886f29e950e06988` since 2026-09-08, recorded from the GitHub tree API. This
session fetched the raw bytes at 2026-09-16T10:07:46Z and computed the same value. The two are
independent: one is GitHub's statement about a blob in its object store, the other is a sha256 over
31299 bytes on this disk. **Had they differed, the pin would have been wrong for eight days and
nothing in the repository would have said so** — which is what makes this a check and not a
formality. The entry's `watch_only` line is replaced by `pins_bytes`, which records the fetch and
says why, and `corpus_dirs` is scoped to `fixtures/x402/specs` rather than `fixtures/x402`, so it
cannot silently account for the envelopes below, which came from somewhere else entirely.

What section 6.1.1 gives, and what it does not: the six-member `TransferWithAuthorization` type in
the order the adapter encodes it, and a six-step verification list at 6.1.2 that belongs to the
**facilitator, before settlement** — balance, simulation, a time window against the instant of the
call. A party holding the artefacts afterwards can repeat two of those six. No `specStep` is claimed
for any check of `x402.settlement/2` for that reason; `src/coverage.ts` says so in its `orderNote`.

**The two settlement envelopes.** Not snapshots of anything fetchable. Each is assembled here from
artefacts already pinned in `cc-output` — the decoded 402, the decoded payment payload and the
decoded settle answer, byte-for-byte as the wire carried them — plus a chain read of that
transaction taken by `tools/chain-read.ts` in this session.

| path | assembled from | bytes | sha256 |
|---|---|---|---|
| `fixtures/x402/settlements/settlement-2026-09-07-0x46db8fc8.envelope.json` | `cc-output/pins/live-2026-09-07/paid-pr-header-decoded.json`, `paid-client-x-payment.decoded.json`, `paid-payment-response.decoded.json`, and a chain read of `0x46db8fc8…` | 23455 | `48ff93f07ceb49cdc48b5c75d7b5935e025ea6b853a0841d53d036d4d0befff6` |
| `fixtures/x402/settlements/settlement-2026-09-07-0x94bfba79.envelope.json` | `cc-output/pins/live-2026-09-07-day2/paid/paid-402-payment-required.decoded.json`, `client-x-payment.decoded.json`, `payment-response.decoded.json`, and a chain read of `0x94bfba79…` | 30009 | `21fd0597192e9796d0f646b023d421d4e99a44b12778c6daa148881ee3fd6799` |

The chain reads, both endpoints, with the sha256 of every response body:

| tx | endpoint | read (UTC) | `eth_chainId` | `eth_getTransactionByHash` | `eth_getTransactionReceipt` | `eth_getBlockByNumber` |
|---|---|---|---|---|---|---|
| `0x46db8fc8…` | `https://mainnet.base.org` | 2026-09-16T10:05:16.092Z | `60a8e1c6a5247eee8b12ffe2450558e6199f6146acc9caed1be20cd1d373d45e` | `e2d032fc076051661cb23fc05cfc0009e95ec97a2b9365e985d15df5ca379127` | `3f6aec2b33e2612dd9ca39a6920b8f927abbea2368f867e13f330bbbf36324b3` | `98bbd961de83e9fae8de33fb76b4a610ca74773265c07ad950c134df2114e92e` |
| `0x46db8fc8…` | `https://base.drpc.org` | 2026-09-16T10:05:18.357Z | `603e6c54211eac5fb5f3133ce0c8d52b375c58dcdfd80b3a3cea9d9b58b64a85` | `61be6cb458f2e8be253434eb90623c897fc3b2b25784edd955ebcaed4e2a67f8` | `a9618661cfe84116bc71eaf1f42e99f8d3a5e7fc72e59b798f14562c5363f0f4` | `556eb857d3e40c9dbc0e1be6c29f362a1a7dbd45d149fdc9bd2fb31f82fcdef5` |
| `0x94bfba79…` | `https://mainnet.base.org` | 2026-09-16T10:05:21.845Z | `60a8e1c6a5247eee8b12ffe2450558e6199f6146acc9caed1be20cd1d373d45e` | `048def049039a8dedf3f805a0d3629a824f3175c0b1aadc56f4242634a228689` | `be30a26d7c9e60befbc05fad4bdc0a01ed9bd8d381b8d9f007c290fb0d46169a` | `bde746f84ead45872e31b42aea6726333775371b5aeec6b07bdc679252bcdeca` |
| `0x94bfba79…` | `https://base.drpc.org` | 2026-09-16T10:05:24.327Z | `603e6c54211eac5fb5f3133ce0c8d52b375c58dcdfd80b3a3cea9d9b58b64a85` | `d7dca166e2cd33234a434ec1ff7cf2f8b20037a2d0fdc7b5c841d0060b97ad5c` | `dd515eb8a396644b300109a366d2d54e622fae14b3d11311e19da59d499c1b8f` | `0d7168f3343d87baa0da821e03ecf31b28fa7f11e3c2dbd1842f63c045c1bc92` |

**The response digests differ between the two endpoints and that is expected.** Two servers serialise
one receipt with different member order and different whitespace, so a raw-text comparison would
report a disagreement about their serialisers and say nothing whatever about the chain. What is
compared is the receipt as a **document**, under a sorted-member-name stringify, and the block hash
and chain id as values; `tools/chain-read.ts` records the method it used in `agreement_method` on
every output, so the claim cannot be read as stronger than it is. Both transactions: same chain id
`0x2105`, equal receipts, same block hash.

`fixtures/upstreams.json` carries the envelopes as the `unmapped` row `x402-settlement-envelopes`,
`reason_code: past_capture` — a past event has no tip, no URL and no revision, so no drift kind can
check it. They are in `fixtures/` rather than in `packages/` because the test suite reads them, and
the suite never reaches the network.

**A note on regenerating this file.** `node tools/snapshot.mjs` rewrites `fixtures/provenance.md`
whole, from its own fetch list — it does not append. Every section below the first two tables,
including this one, would be lost by a run of it, and the x402 paths are not in its list at all. The
sections have been maintained by hand since 2026-09-01. This is recorded as an observation, not
repaired here: `npm run snapshot` is not safe to run against this file as it stands.

---

## Appended 2026-09-16 — the 2026-09-11.1 release, the content-addressed promotion v4, and current.json re-pinned

**B-172.** YuTao's mail of 11 September (relayed by the founder) named a new release, a
content-addressed promotion record, and a rule name for the predecessor pin. All three are read from
the issuer's own bytes here. **Every figure his letter stated is reproduced, and one thing it could
not have anticipated is recorded: the live promotion pointer has moved past the record he named.**

All fetched at the `www.` host (the bare host answers 307), written to `refs/` byte-exact with no
re-serialisation.

| path | object | bytes | sha256 | `check` |
|---|---|---|---|---|
| `refs/insight-oracle-registry-release-0x6e3bd18c.json` | release 2026-09-11.1 | 22080 | `9171c0a2f9a029b9990c6913fb6909e78fbd265c257f797186c6812e6d079763` | `fail` |
| `refs/insight-oracle-registry-promotion-0x6148f427.json` | promotion v4 | 2958 | `0924462061c58963082e2db2da28b17bafc576e24dfbae6a92de60671a3ce426` | `fail` |
| `refs/insight-oracle-registry-current-2026-09-16.json` | `current.json` | 1330 | `bc20008c75c64a2acdbb07090f1b7cdd751af13205ea2c58896683ec5678c29f` | `note` (`mutable_pointer`) |

### Both content addresses recomputed, with controls

| object | declared scope | canonical bytes | recomputed address | id in the URL | match |
|---|---|---|---|---|---|
| release 2026-09-11.1 | the release object in this response | 21847 | `0x6e3bd18c…c7e69f6b` | `0x6e3bd18c…c7e69f6b` | **yes** |
| promotion v4 | the promotion object excluding `promotionId` | 2631 | `0x6148f427…ef93a5217` | `0x6148f427…ef93a5217` | **yes** |

Method unchanged from the 10 September section: keccak256 over the RFC 8785 canonical form, computed
with **two independent JCS serialisers** — this repository's TypeScript one and the Python one in
`tools/asqav_envelope_hash.py` that `tools/jcs-cross-check.py` drives — whose canonical forms were
compared **byte for byte**, not merely by digest: 21847/21847 and 2631/2631 bytes, with identical
sha256 over each pair (`7af94338a02beadf…`, `53ccd26362ea9fc4…`).

**The control, run and printed before the result was believed.** A one-byte mutation of a string
member inside each scope moves its address: the release to `0x9da31789…`, the promotion to
`0x2d7d146f…`, and both serialisers agree on the mutated forms too. A recomputation that could not
have failed would have established nothing.

**Both canonical lengths equal the figures YuTao's letter stated** — release 21,847 B, promotion
2,631 B — which were `[relayed]` until this run and are now measured here.

### The three objects he said did not change, checked rather than taken

Each was re-fetched by following a path from the release's own bytes, never by guessing a URL: the
activation set from `mainlineIntegrationIsolation.immutableSetPath`, and the Headless policy from
`immutablePolicyPathTemplate` with the policy id the activation set's `partners.headless` names.

| object | bytes | sha256 | against the 10 September pin |
|---|---|---|---|
| activation set v2 `0xe9512f0b…` | 1400 | `91e4fd0cc264ea2bde6ae4ff4092f090b901070376bffd24b6c16a1891e4763b` | **byte-identical** |
| Active Headless policy v2 `0xd510bd9f…` | 1173 | `14e29fbd050bd0d5b52cd4158d25d9fe1d0ea1ef14c8c92b397155d0c9cfc0f7` | **byte-identical** |
| semantic profile `0xe7513b05…` | 2372 | `284056499d0e779f7c168edd11dd716e64acf173bcb43df0bc58cc7bb7287ace` | **byte-identical** |

None is re-pinned: identical bytes under an identical content address need no second row. His
statement that the activation set, the policy, the profile, the receipt wire format and the signer
did not change is therefore confirmed for the three objects this repository can check by bytes.

### `lineage-floor-any` is now in the issuer's bytes, not only in a letter

The release's `mainlineIntegrationIsolation` carries `registryReleasePinRule: "lineage-floor-any"`
and, beside it, `registryReleasePinRuleDescription`: *"A candidate release is admitted when it equals
any policy-pinned release or reaches one through predecessorReleaseId; unknown releases, cycles, and
releases outside every pinned lineage fail closed."* The promotion v4 `activationRule` states the
same rule in almost the same words.

That answers the observation the 10 September section left open as a property of the design. The
Active Headless policy still pins `[0xf45d4c02…]`, which as of this release is **two** behind rather
than one — the chain is `0xf45d4c02…` → `0x96d1f624…` → `0x6e3bd18c…` — and under a floor rule that
is admitted rather than stale. **This repository does not implement lineage admission.** The adapter
verifies registry objects by content address; whether to add a `lineage-floor-any` check is B-191 and
is the founder's ruling, not this session's.

### What the live pointer says, which is not what the letter said

`current.json` read at 2026-09-16T11:38:11Z names `registryRevision` 2026-09-11.1 and `releaseId`
`0x6e3bd18c…`, matching the release pinned above. It also carries a **new top-level `promotion`
block** that the 10 September pin did not have at all — that block is the whole of the 1017 → 1330
byte growth — and the promotion it names is **not** the one this session was sent to pin:

> `promotionId` `0x4396f761c00eee4f37aad37e9a703bd3896ace1fee8a3bde2a5ff8ebb9dc9119`,
> `promotionVersion` 6

Both statements are true of their own instant. Promotion v4 `0x6148f427…` is the record the
11 September letter named, it is pinned here, and its address recomputes; the live pointer has since
advanced to v6. **v6 is not fetched or pinned in this session**: the handoff scoped the network reads
to these objects and the two 404 probes, and a fourth object is scope this session does not have. It
is recorded as an open item so the next session does not have to rediscover it.

### The two 404 probes

His letter states that unknown release and promotion ids answer HTTP 404 with `no-store`. Probed once
each at 2026-09-16T11:40:12Z and 11:40:13Z, with the id
`0x0000000000000000000000000000000000000000000000000000000000000001`:

```
GET /.well-known/oracle-registry/releases/0x000…001    HTTP/1.1 404 Not Found   Cache-Control: no-store
GET /.well-known/oracle-registry/promotions/0x000…001  HTTP/1.1 404 Not Found   Cache-Control: no-store
```

Both carry `Content-Type: application/json`, `Age: 0`, `Server: Vercel`,
`X-Content-Type-Options: nosniff`. The statement is reproduced. Nothing else was probed.
`policy_not_active_for_partner` was **not** exercised: reaching it needs a partner request against a
non-active policy, which is a call into their gate rather than a read of a published document, and
this session makes no such call.

### What this section does not do

- **It does not pin promotion v6**, for the reason given above. Recorded, not fetched.
- **It does not observe the runtime.** Unchanged from 10 September: the policy and the promotion are
  published documents; nothing here watches the gate that reads them.
- **It does not implement lineage admission** (B-191), and it does not encode the policy's release
  pin anywhere in the tool.

## Appended 2026-09-17 — the promotion series walked from v6 to v3, pinned, and every address recomputed

The 16 September section above closes by saying, in its own words, that it **does not pin promotion
v6** — "Recorded, not fetched" — because that session's network reads were scoped to three objects.
This section closes that item. The chain was walked from v6 back to v3 at the immutable path, every
object on it was pinned, and each address was recomputed from the scope that object itself declares.
**All three new objects reproduce.** Nothing above this line is edited; the sections above are dated
records of what was true when they were written, and the one statement they contain that these bytes
contradict is named and superseded at the end of this section rather than rewritten in place.

The path template is taken from the release's own bytes,
`refs/insight-oracle-registry-release-0x6e3bd18c.json` at
`release.promotionAddressing.immutablePathTemplate`: `/.well-known/oracle-registry/promotions/{promotionId}`.
Fetched at the `www.` host, as before, written to `refs/` byte-exact with no re-serialisation. Each
retrieval time below is the `Date` header of that response, not a local clock read.

| path | object | retrieved | bytes | sha256 | `check` |
|---|---|---|---|---|---|
| `refs/insight-oracle-registry-promotion-0x4396f761.json` | promotion v6 | 2026-09-17T09:20:08Z | 3559 | `83d189157861ab37fff153bc5ff858978bba4fcf22441ab818ef94b69d31eec3` | `fail` |
| `refs/insight-oracle-registry-promotion-0x9c87d2ef.json` | promotion v5 | 2026-09-17T09:20:25Z | 3341 | `519768a49824e9f68d8036c39b504d252ed90ac41ff1065c72dc484369d8a4ab` | `fail` |
| `refs/insight-oracle-registry-promotion-0x338a53e5.json` | promotion v3 | 2026-09-17T09:20:53Z | 2977 | `8686aef18224d56b29011a95024326d9b8a4ca2fd1491e43f489e813a9fa835c` | `fail` |

All three answered **HTTP 200** with `Cache-Control: public, max-age=31536000, immutable`,
`Content-Type: application/json`, `Server: Vercel`, `Age: 0`,
`X-Matched-Path: /.well-known/oracle-registry/promotions/[promotionId]`.

**v5 was not named in any document this repository held.** It was reached only as v6's
`predecessorPromotionId`, which is why v6 had to be fetched before it could be asked for. The chain is
the discovery here, not a list of known URLs: v6 → v5 → v4 → v3.

**v4 was not re-pinned, and its pin was not touched.** It sits between v5 and v3 in the chain and is
already pinned at 2,958 bytes from 16 September. It was refetched to a dated scratch path outside
`refs/` and compared byte for byte against the existing pin: **identical**, sha256
`0924462061c58963082e2db2da28b17bafc576e24dfbae6a92de60671a3ce426` on both. There is no difference to
report. The scratch copy is not committed; the finding is that there was nothing to find.

### Every address recomputed from the object's own declared scope

Each of the three new objects carries its own `digest` member, and all three declare it in identical
words: `algorithm` `keccak256`, `canonicalization` `RFC 8785 JSON Canonicalization Scheme`, `scope`
*"the promotion object excluding promotionId"*. The scope was read from each object rather than
carried over from v4, and the recomputation was run under the words each object uses.

| object | canonical bytes | recomputed address | id in the URL | match |
|---|---|---|---|---|
| promotion v6 | 3232 | `0x4396f761…b9dc9119` | `0x4396f761…b9dc9119` | **yes** |
| promotion v5 | 3014 | `0x9c87d2ef…453480d5` | `0x9c87d2ef…453480d5` | **yes** |
| promotion v3 | 2650 | `0x338a53e5…66518220` | `0x338a53e5…66518220` | **yes** |

That scope string reads two ways, and on these three — as on v4 — only one reproduces: the **inner
`promotion` member with `promotionId` removed**. The other reading, the top-level object with
`promotionId` removed, was computed for each and matches none: 3476 B → `0x9fcf8e95…` for v6,
3258 B → `0x3965e3d4…` for v5, 2894 B → `0xdf282896…` for v3. Both readings are recorded so that the
one used is visibly a choice that was tested rather than an assumption that was inherited.

Method, unchanged from the 16 September section: keccak256 over the RFC 8785 canonical form, computed
with **two independent JCS serialisers** — this repository's TypeScript one and the Python one in
`tools/asqav_envelope_hash.py` that `tools/jcs-cross-check.py` drives — whose canonical forms were
compared **byte for byte**, not merely by digest. They agree on every scope computed in this run,
under both readings: 3232/3232, 3014/3014 and 2650/2650 bytes, with identical sha256 over each pair
(`7d27080cebbb6a46…`, `b19894fd073f48a6…`, `a19a5d7659aa2eb2…`).

**The control, run and printed before any result was believed.** A one-byte change to a string member
inside each scope moves that object's address off its declared id — v6 to `0x84a4237c…`, v5 to
`0x99d01ed8…`, v3 to `0xf3dad9b0…` — and both serialisers agree on the mutated forms too.

**The method was also controlled against an answer written down before this run.** v4 was recomputed
by the same code in the same run and reproduces the 16 September figures exactly: 2,631 canonical
bytes, canonical sha256 `53ccd26362ea9fc4…`, address `0x6148f427…ef93a5217` matching its declared id,
and 2,875 bytes → `0x4e57c18b…` for the top-level reading. A green that agreed only with itself would
have shown nothing; this one agrees with a figure a different session recorded a day earlier.

### The one statement above these lines that these bytes contradict

The 10 September section, under *"What this section does not do"*, states of promotion v3:

> "**It does not pin the promotion record.** Its URL is a path on a moving branch, not a content
> address, and its `promotionId` carries no `digest` member declaring a scope, so it cannot be
> verified the way the four registry objects were. It is read and quoted, not pinned."

That was true of the bytes that path served, and it remains the honest record of what that session
could see. It is **not** true of the object the immutable path serves under the same `promotionId`:
that object answers 200 and **does** carry a `digest` member, in the same words as v4's, and its
address recomputes from its own bytes under it. The v3 promotion record is content-addressed and is
now pinned. The earlier lines are left standing as the dated record they are, per the convention
`README.md` states; this paragraph is where they are superseded.

The same correction applies to the reading of the branch path itself: the object was reachable at a
content address on 10 September and nobody asked, rather than the object having become addressable
since. Nothing in these bytes dates the change, and no claim is made that one occurred.

### What this section does not do

- **It does not fetch v2.** v3 names `predecessorPromotionId` `0x5dfbc2a5…743bf2eef`, so the chain
  continues below v3. The terminus here is v3, and the series is verified from v6 down to v3 and not
  to its origin.
- **It does not re-read `current.json`.** The network reads were scoped to the promotion path
  template, so v6 is the head of the chain *as the 16 September pin names it*; whether the live
  pointer has advanced past v6 is unobserved here.
- **It does not establish who published these objects.** A content address self-consistent with its
  own bytes shows the bytes were not altered under a stable identifier. No signature over a promotion
  object was offered by the issuer or checked here.
- **It does not implement lineage admission** (B-191), and it changes nothing in the adapter.

## Appended 2026-09-17 — the pointers re-read after the head moved to promotion v7

The section above walked the promotion chain from v6 back to v3 and pinned it. Within the day the
head moved again: `npm run drift`, run by the Lead from a fresh clone of the pushed tree, reported
the three mutable pointers as `CHANGED (NOTE)`, and the live promotion pointer now names **promotion
v7** `0x2eeda0f89eddad88c20f69680a150754e12266396eb79d503a59c9f14b98e26c`. This section pins the three
pointers at their new bytes and pins v7 as the fourth object. Nothing above this line is edited.

Fetched at the `www.` host with `curl`, written to `refs/` byte-exact with no re-serialisation. Each
retrieval time below is the `Date` header of that response, not a local clock read. All four answered
**HTTP 200** with `Content-Type: application/json`; the two registry pointers carried
`Cache-Control: public, max-age=60, must-revalidate`, `oracle-keys.json` `public, max-age=300`, and
the promotion `public, max-age=31536000, immutable`. **None of the four carries an `ETag` or a
`Last-Modified`**, so the only bound on when any of them moved is our own reads.

| path | object | retrieved | bytes | sha256 | `check` |
|---|---|---|---|---|---|
| `refs/insight-oracle-registry-current-2026-09-17.json` | the registry pointer | 2026-09-17T12:10:15Z | 1330 | `ac4b4cd9d96ed2d4a9ab9b7b81be73e4c861d52dc46efb2f07f8b5d82889b0df` | `note` |
| `refs/insight-oracle-registry-integrations-current-2026-09-17.json` | the integrations pointer | 2026-09-17T12:10:17Z | 1093 | `c2513d53e0a96999f5a718994ef2936a5b3e93ebaac1a6622fe5274698f49bf0` | `note` |
| `refs/insight-oracle-keys-2026-09-17.json` | the keys document | 2026-09-17T12:10:18Z | 23306 | `f287c37b58d5af6b881a454f2ecd12618cd0f7a328e7ba434b42c3064944d019` | `note` |
| `refs/insight-oracle-registry-promotion-0x2eeda0f8.json` | promotion v7 | 2026-09-17T12:10:19Z | 3486 | `ad98b03e6ac1045651d592c56754dcd2a2378c780edfcc6caa1c229ad30ee73e` | `fail` |

### What each changed against the pin it succeeds

Read from the two sets of bytes in this session, not copied from the handoff that requested the work.

**`current.json`**, against `refs/insight-oracle-registry-current-2026-09-16.json` (1330 bytes both):
the `promotion` member **only** — `promotionId` v6 `0x4396f761…` to v7 `0x2eeda0f8…`,
`promotionVersion` 6 to 7, and the `immutable` URL that carries the id. The release pointer is
**unchanged** at `0x6e3bd18c`. No member was added or removed.

**`integrations/current.json`**, against the 2026-09-10 pin (825 to 1093 bytes): gains a top-level
`registryReleasePolicy` with `rule` `lineage-floor-any`, whose `description` admits a candidate
release that equals any policy-pinned release or reaches one through `predecessorReleaseId`. This is
the 11 September change, never pinned until now. Nothing else moved.

**`oracle-keys.json`**, against the 2026-09-10 pin (22762 to 23306 bytes): `registryRevision`
2026-09-10.1 to 2026-09-11.1; `effectiveFrom` 2026-09-10 to 2026-09-11; a new top-level
`protocolPromotion` member naming v7; and `registryReleasePolicy` added **inside
`partnerIntegrations`**, not at the top level. `public_keys` (3) and `revoked_keys` (empty) are
**byte-identical** to the 2026-09-10 pin: no key material moved.

**Promotion v7**, against v6 `0x4396f761…`: `promotionVersion` 6 to 7, `effectiveFrom` 2026-09-13 to
2026-09-17, `classification`, `predecessorPromotionId` (now v6, so the chain is v7 → v6 → v5 → v4 →
v3), `receiptImpact`, `activationRule`, and in the `compatibilityMatrix` the `evidence` strings and
three `outcome` values — veritas `compatible-legacy-snapshot-unchanged` to
`compatible-legacy-scope-clarified`, agent-passport `compatible-trust-enforcement` to
`compatible-data-contract-unchanged`, raul `compatible-signer-trust-hardening` to
`compatible-safety-contract-unchanged`. `registryReleaseId`, `activationSetId` and the matrix's
nine-row set are unchanged.

### The v1-v4 sentence

v7's `receiptImpact` says, in the object's own words:

> No signed receipt, attestation, semantic profile, registry release, partner policy or historical
> promotion bytes change. The general legacy snapshot-relative verification contract covers v1-v4.
> The narrower v2-v4 wording in promotions v5 and v6 described the VERITAS workflow only and did not
> supersede the repository-wide v1-v4 rule.

**No code change follows.** `src/adapters/insight.ts` already treats a target `ExecutionReceipt` with
a numeric `schemaVersion` below 5 as legacy, which covers v1-v4 **as a superset** — it also catches
values below 1. A receipt that signs no numeric `schemaVersion` at all remains outside that scope,
which is what F15's "what the closure still does not reach" already records. The change is in the
record, not in the tool.

### The address, recomputed

From the object's **own** `digest` member — `keccak256`, `RFC 8785 JSON Canonicalization Scheme`,
scope `the promotion object excluding promotionId` — checked rather than assumed, the script
refusing to proceed if any of the three declared values were something else.

```
v7  refs/insight-oracle-registry-promotion-0x2eeda0f8.json
    file bytes        3486
    canonical bytes   TS 3159  Python 3159
    canonical sha256  TS d9afa74a413bbd66a87bbf9a561075a57391eee64e34d7d2430b9f24ac664d88
                      PY d9afa74a413bbd66a87bbf9a561075a57391eee64e34d7d2430b9f24ac664d88
    byte-for-byte     AGREE
    recomputed        0x2eeda0f89eddad88c20f69680a150754e12266396eb79d503a59c9f14b98e26c
    stated id         0x2eeda0f89eddad88c20f69680a150754e12266396eb79d503a59c9f14b98e26c
    RESULT            MATCH
    control           effectiveFrom 2026-09-17 -> 2026-09-18 gives
                      0x0b56e3714bc0eeb44b72089e554bdb9ef554345a49acba359f53b7d403d93468
                      address MOVED, as it must
```

Two independent canonicalisers, as every promotion pin here has used: this repository's TypeScript
one (the `canonicalize` package the adapters use) and the Python one in
`tools/asqav_envelope_hash.py` driven by `tools/jcs-cross-check.py`, which shares no code with it.
The canonical forms were compared **byte for byte**, not merely by digest.

**The reading matters, and the wrong one is recorded here too.** The inner reading — the `promotion`
member with `promotionId` removed — gives 3,159 canonical bytes and the declared address. The
top-level reading, the whole object with its top-level `promotionId` removed, gives 3,403 canonical
bytes and `0x9c6f3618b8f147ea191645fd66850b88e834d7294c4f7c41eb065df499e52c57`, which matches
nothing.

**Two known-answer controls were recomputed by the same code in the same run**, so a match here is
not the first output of a script nobody has checked:

| object | canonical bytes (TS / Py) | recomputed | stated id | mutation control moved? |
|---|---|---|---|---|
| v7 | 3159 / 3159 | `0x2eeda0f8…e26c` | same — **MATCH** | yes → `0x0b56e371…` |
| v6 | 3232 / 3232 | `0x4396f761…9119` | same — **MATCH** | yes → `0xca713561…` |
| v4 | 2631 / 2631 | `0x6148f427…5217` | same — **MATCH** | yes → `0x26e27bf3…` |

The v6 and v4 figures, and both of their control addresses, reproduce the values the 16 and 17
September sessions recorded independently.

### What these bytes do not establish

The pointers were last read by us at **2026-09-16T11:38:11Z** and first seen naming v7 at
**2026-09-17T11:50:38Z**. Nothing in v7's bytes refers to any letter, question or correspondent, and
`effectiveFrom` is a declared date rather than a publication observation. **Whether v7 was published
before or after our 17 September send is not established by anything this repository holds**, and no
row here should be read as saying it was.

## Appended 2026-09-25 — draft-marques-asqav-compliance-receipts-09 pinned beside -08

-09 was posted on 21 September 2026. Pinned here; `-08` becomes `historical` and keeps its digest
(`ee3ca5d7c0acc1cb9b8025d29f19a7d73991718ca35d3bf4229f7b4264976ec0`), because every -08 rule in
`walker/scopes.json` and every -08 line cite in `FINDINGS.md` was made over those bytes. Fetched from the
IETF archive with `curl`; LF-only (zero CR bytes); digest computed on the device at the time stated.

| path | bytes | sha256 | retrieved |
|---|---|---|---|
| `refs/draft-marques-asqav-compliance-receipts-09.txt` | 379060 | `c455cdf8a402c46bff383088321d52d7aaebfef32090fd633efcdf02e7bee406` | 2026-09-25 |

`grep -c ''` counts 7840 lines. Line 7 reads `Intended status: Informational                         21 September 2026`
and line 12 reads `draft-marques-asqav-compliance-receipts-09`. A `HEAD` at 2026-09-25T08:45:16Z answered
`200`, `Content-Type: text/plain; charset=utf-8`, `Content-Length: 379060`, `last-modified: Mon, 21 Sep 2026
18:38:10 GMT`, `etag: "6ab17992-5c8b4"`. `npm run drift` at 2026-09-25T08:44:49Z reported the entry `current`:
`draft-marques-asqav-compliance-receipts-10 is 404; -09 is the highest revision published`.

The digest was reproduced from the bytes, not copied from the handoff that stated it, and the two agree.

## Appended 2026-09-25 — the asqav-sdk corpus at `6137cb95`, the commit -09 cites

For the -09 rerun (`FINDINGS-rerun-2026-09-25.md`). `draft-marques-asqav-compliance-receipts-09` names its
vector corpus in its reference section at lines 7094-7097 of the pinned text:

> [ASQAV-SDK]
>            Asqav, "asqav-sdk: Verifier Conformance Vectors", 2026,
>            <https://github.com/jagmarques/asqav-sdk/
>            tree/6137cb95edcfcd820ecff0e11c6f603b2da664b1>.

`tools/snapshot.mjs` has no asqav-sdk source, so the pin follows the convention of the earlier asqav-sdk
sections above rather than that tool: taken with `git cat-file blob <commit>:<path>` from a fresh clone
(`git -c core.autocrlf=false clone --quiet https://github.com/jagmarques/asqav-sdk`, 2026-09-25T08:51:11Z),
never from a worktree. `git hash-object` over every copied file reproduced its upstream blob id (303 of 303);
every file carries 0 CR bytes.

| field | value |
|---|---|
| URL | `https://github.com/jagmarques/asqav-sdk` |
| commit | `6137cb95edcfcd820ecff0e11c6f603b2da664b1` |
| subject | `fix: pass originating receipts through standalone CLI (#512)` |
| author and commit date | 2026-09-12T12:20:37+02:00 = **2026-09-12 10:20:37 UTC** |
| fetched at | 2026-09-25T08:51:14Z (`git rev-parse origin/main` in the fresh clone printed `bd002c0c9ad863fa0b1c4de675f6378b7321dda0`; `6137cb95` is its ancestor, 32 commits behind) |
| files pinned | 303, 609003 bytes |

**What is pinned, and what is not.** `conformance/vectors.json` and `conformance/manifest.lock.json`, and the
whole `verifier/conformance-vectors/` tree at that commit (301 files). The tree exists at `6137cb95`; of the
earlier asqav pins only `asqav/05c1c49` carried any of it (three vector directories), and `3b88156`, `22a970d`,
`a21d060` and the three `history/*` pins carry none. `conformance/LICENSE`, `conformance/NOTICE` and
`conformance/README.md` are not pinned. The verifier tree includes vectors for formats other than this profile
(ACTA, AERF, agent-receipts, W3C VC, authproof, pipelock, DSSE); they are pinned as bytes because the tree is
what -09 cites, and are not walked (walker/scopes.json, `asqav/6137cb95` `only_files`).

**Checked against the author's own locks.** `conformance/manifest.lock.json` (corpus_version 11) records
`vectors.json` at sha256 `575d2605d5acf40d3387603cdded83e95efbe8794dc8dd8387f6b7905d1db99a`, 54904 bytes, the
same as the table below. `verifier/conformance-vectors/manifest.lock.json` (corpus_version 26) carries 300 file
rows; all 300 equal the pinned bytes by sha256 and byte count, and the one file on disk it does not list is
itself.

**Against the tip.** At `bd002c0c` the two `conformance/` files are the same blobs (`ebd8931d`, `69aacedb`),
which is what `npm run drift` reported for `asqav-sdk/a21d060` at 2026-09-25T08:44:49Z. 25 files under
`verifier/conformance-vectors/` differ between `6137cb95` and `bd002c0c`. This pin is the commit -09 cites and
not the tip; `asqav-sdk/a21d060` stays the entry the drift check reads.

| fixture path | upstream blob at 6137cb95 | bytes | sha256 |
|---|---|---|---|
| `fixtures/asqav/6137cb95/conformance/manifest.lock.json` | `69aacedb141919fe321daa7ee589f7e676983be6` | 13853 | `a2839bf22a3b6eeb6b0182064ef590bff4ae721df611c612492e228af873251b` |
| `fixtures/asqav/6137cb95/conformance/vectors.json` | `ebd8931ded180ac42c4d7c44a4b52b700c1af0d5` | 54904 | `575d2605d5acf40d3387603cdded83e95efbe8794dc8dd8387f6b7905d1db99a` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/README.md` | `1209269c68a88e220eb71b235bd3a64160c96212` | 9629 | `fb73ce26100a518109a829095dd46e7e506121ddd15f1fd9c56664bcaa4bcee7` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/UPSTREAM.md` | `8c9d363f480d9771243cbf1fc6a37ba820442f8b` | 11634 | `7554dbe6fa727a17abd532c0422393233d0c6a9f4def0d3732b308e3a53f8b11` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-01-genesis/acta-keys.json` | `d3cb11e4a829d22ec715303d5b6f5b056cd32ed7` | 179 | `4f3dafaf1e2db10e23a389c7d85035b1e09a4308509e2314b464228b258445b6` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-01-genesis/expected.json` | `40750f82cdc638af01f5ea6f767c725187961f96` | 139 | `6a25002b43ea3f4c7133a31bbaf95e45df248ca2378df6d02c14b332a22c648a` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-01-genesis/receipt.json` | `b9f032a6a3e5d66195f92aa00a0c1a4fd08708e9` | 531 | `3dc3b36962eb8b27efc56d53b2b87fe75b88781c00111b660aad4808d8f4706d` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-02-chain-link/acta-keys.json` | `d3cb11e4a829d22ec715303d5b6f5b056cd32ed7` | 179 | `4f3dafaf1e2db10e23a389c7d85035b1e09a4308509e2314b464228b258445b6` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-02-chain-link/expected.json` | `a98411ee912e8b5051bdfffe334fcbee68bd3a91` | 160 | `038c708ecb2ccbda46730be02d62ae287c74964b4a348fe3f6716c27fb25aa62` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-02-chain-link/predecessor.json` | `b9f032a6a3e5d66195f92aa00a0c1a4fd08708e9` | 531 | `3dc3b36962eb8b27efc56d53b2b87fe75b88781c00111b660aad4808d8f4706d` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-02-chain-link/receipt.json` | `17bfb6b25b07ce9e2d63934ce0f32088d3e03d44` | 626 | `50a6937e41bb7b82f9bb5f78548cd7681ff107faff839c644ad962c438d706bd` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-03-tamper-sig/acta-keys.json` | `d3cb11e4a829d22ec715303d5b6f5b056cd32ed7` | 179 | `4f3dafaf1e2db10e23a389c7d85035b1e09a4308509e2314b464228b258445b6` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-03-tamper-sig/expected.json` | `96ee4b42706897908f6eaa549ce9ee0f78b7d581` | 173 | `690bdc3a878e37a45d609bcff3d896cf2a8284d0f84c5e198af4c669e37bd6cd` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-03-tamper-sig/receipt.json` | `cf9d40ac165816485f6899397cd0d57874e31ea5` | 531 | `cce9aade699d889f0582e75d28aeb9a80b35b58d1de96a33bbb764aa91479539` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-05-commitment-mode-unsupported/acta-keys.json` | `d3cb11e4a829d22ec715303d5b6f5b056cd32ed7` | 179 | `4f3dafaf1e2db10e23a389c7d85035b1e09a4308509e2314b464228b258445b6` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-05-commitment-mode-unsupported/expected.json` | `91839cc368da47febf2766a46d8ce491f055532f` | 234 | `6a3bdeb40b636e93a2d5a240f7516e5a8aac5413191b57f14d7ca78a9d89a586` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-05-commitment-mode-unsupported/receipt.json` | `910655b4855a26f5cfd76f630484985186a7a45f` | 534 | `ced1fe77d143f8077c0cb2f0c73c5d70034b2725c05e2c6cc24a751467badd08` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-06-chain-link-03-prefixed/acta-keys.json` | `d3cb11e4a829d22ec715303d5b6f5b056cd32ed7` | 179 | `4f3dafaf1e2db10e23a389c7d85035b1e09a4308509e2314b464228b258445b6` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-06-chain-link-03-prefixed/expected.json` | `4bfd523a51e2757624f40ec30a8ca30626bd1cc8` | 340 | `1e8a665bd67d401c4d1abca782a4c11fadfe45d423b5341b24d39c6515bf2245` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-06-chain-link-03-prefixed/predecessor.json` | `b9f032a6a3e5d66195f92aa00a0c1a4fd08708e9` | 531 | `3dc3b36962eb8b27efc56d53b2b87fe75b88781c00111b660aad4808d8f4706d` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-06-chain-link-03-prefixed/receipt.json` | `9a005879e30b08a22358ea40801ca8d9a11c4ea7` | 633 | `1bbc26dd4a89513f25215798e0c66b7bc5cbe24765938a0b2ee1d6c64990c8f9` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-07-chain-link-03-wrong-digest/acta-keys.json` | `d3cb11e4a829d22ec715303d5b6f5b056cd32ed7` | 179 | `4f3dafaf1e2db10e23a389c7d85035b1e09a4308509e2314b464228b258445b6` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-07-chain-link-03-wrong-digest/expected.json` | `ea55f92637a66cd190055e76092c6cd68dbb358f` | 389 | `70d1e7d14ea1e9ccb857962464c03da9da9903a6875c3779df581d0d3b93844c` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-07-chain-link-03-wrong-digest/predecessor.json` | `b9f032a6a3e5d66195f92aa00a0c1a4fd08708e9` | 531 | `3dc3b36962eb8b27efc56d53b2b87fe75b88781c00111b660aad4808d8f4706d` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-07-chain-link-03-wrong-digest/receipt.json` | `bcd54cc44cf2e7d62409ba7f0e9858c0f60301e9` | 633 | `eab852c676053326f792b23822587856f094f5a3593fef1749c3a7b77e96d204` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-up-01-a2a-trusted-attestation/acta-keys.json` | `149413f5b2fc8e7a694e73ddf0604a28fe87161f` | 190 | `f3ca2e736226b69e540ab866840083986d5acdc1b5be54706f7b1f1a549f9d93` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-up-01-a2a-trusted-attestation/expected.json` | `4f7e5461c6aebf1de86bcc9ea3c509bf54f60702` | 291 | `0937e4c63aacc8f2cdfbf19febb7396d6d79a0d9ee25821186c51fcdba395cf1` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-up-01-a2a-trusted-attestation/receipt.json` | `7304fed055475d227e32bffa683371bad1578b53` | 747 | `659330a256bdc28c95668f231ec6bcc6618568c82096126d7f638ac47faaa92d` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-up-02-a2a-trajectory-endpoint/acta-keys.json` | `149413f5b2fc8e7a694e73ddf0604a28fe87161f` | 190 | `f3ca2e736226b69e540ab866840083986d5acdc1b5be54706f7b1f1a549f9d93` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-up-02-a2a-trajectory-endpoint/expected.json` | `50da99e34d926e842f1d8861a8c8289a93229d0e` | 278 | `165a84bfc0a25acb20cd92cd2fad2db69f5633005acef8e68e1e883b5cc4ae32` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-up-02-a2a-trajectory-endpoint/receipt.json` | `5e61598667851aed6611d1e9d9990cfdf32156fc` | 733 | `8c18d9bea2cf068164e851ac6b702f9ad16417c8d06e07569a2c1983b3fd7895` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-up-03-a2a-tampered-sig/acta-keys.json` | `149413f5b2fc8e7a694e73ddf0604a28fe87161f` | 190 | `f3ca2e736226b69e540ab866840083986d5acdc1b5be54706f7b1f1a549f9d93` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-up-03-a2a-tampered-sig/expected.json` | `b063aa9eca094557200c977faac8d780543ba137` | 310 | `5b210fd3d6ff95170783b76a52b15526cf38c038d830d3db675b0dcb34fa1be3` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/acta-up-03-a2a-tampered-sig/receipt.json` | `df43181e6c99a6640a2cf891d2ca00c616936b7d` | 747 | `162414cf68f82ab6b0b7f854314cdfa244fbb21703b63f690090047d83eaf251` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-01-genesis/expected.json` | `ac9311f847c4dce9b67f9a69618772bc3f68a543` | 174 | `89d99a28c0874f4f862133061b62ec9586b386c060ca35616bc14584f62b5451` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-01-genesis/keys.json` | `fc1a679449ee3fc9ecd7992f0025d489fffc611d` | 92 | `9356fc25dd7d7ed872bb7f30a0a2555f9fb42c9482582a86de20980f79ad5720` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-01-genesis/receipt.json` | `7864733432e0bcedefe0a23a537a0a5a563bb789` | 751 | `9921eb9a3ceeec60edcb77bb95b0e2bfa1fc85efb6405dd7e1350049ae4b6a97` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-02-chain-link/expected.json` | `06e244ee147e9baf54543ab0e3e609c17ecd29f3` | 224 | `1974ea665cc50b746a1cbc82171cee877b9139ecbb622ba5c78aaec6a325cd87` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-02-chain-link/keys.json` | `fc1a679449ee3fc9ecd7992f0025d489fffc611d` | 92 | `9356fc25dd7d7ed872bb7f30a0a2555f9fb42c9482582a86de20980f79ad5720` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-02-chain-link/predecessor.json` | `7864733432e0bcedefe0a23a537a0a5a563bb789` | 751 | `9921eb9a3ceeec60edcb77bb95b0e2bfa1fc85efb6405dd7e1350049ae4b6a97` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-02-chain-link/receipt.json` | `5a4b9353c10fd16fab711abc5c9a2d5f2662b078` | 846 | `a9ba4ef87eed8ce1df18853e27143ff7128a259a902befdcc77e035f95846699` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-03-tamper-evidence/expected.json` | `9e4ea18c37eabc95c14d9e62b508c995e91cc727` | 224 | `257c47fb07633e4114972ee55a58cc4e66f0c34da0a3f23cf54c3e33eed5f35e` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-03-tamper-evidence/keys.json` | `fc1a679449ee3fc9ecd7992f0025d489fffc611d` | 92 | `9356fc25dd7d7ed872bb7f30a0a2555f9fb42c9482582a86de20980f79ad5720` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-03-tamper-evidence/receipt.json` | `933b8ec997262d622a925c5443bd6b9c73d72a8f` | 751 | `d42bf60ac2ced0b25b5dfca7afdc5e0962cf386ed28980c9df5c3719d4f57d5e` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-04-tamper-chain/expected.json` | `9a17b716411bf63fa18dbfa568cf34d8c166c299` | 202 | `c8a91f0e16e80e05acb9d4c0ce42ced33b8a47e012b229a91553f9a0d6acefcf` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-04-tamper-chain/keys.json` | `fc1a679449ee3fc9ecd7992f0025d489fffc611d` | 92 | `9356fc25dd7d7ed872bb7f30a0a2555f9fb42c9482582a86de20980f79ad5720` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-04-tamper-chain/predecessor.json` | `7864733432e0bcedefe0a23a537a0a5a563bb789` | 751 | `9921eb9a3ceeec60edcb77bb95b0e2bfa1fc85efb6405dd7e1350049ae4b6a97` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-04-tamper-chain/receipt.json` | `afc5e2b149495cbe34e3e14deb821ce89cde1d52` | 846 | `1901cb4da5acfc687ce5a4d39e8c25a827bef70f872df174cb13474d5d46bf66` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-01-genesis-happy-path/expected.json` | `1760335f743417366f090bb021684e9da8ec0597` | 178 | `9d42a3d7cfdb3ce4c5a1ab4d3a15c0048387d1c5fb520339feff51a3e596cabe` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-01-genesis-happy-path/keys.json` | `c5f876aab7c3d2a82fd8df2f55e18a06ace579a3` | 93 | `6aae9d9ad24ba36793830d7e517c112099ae265c096aff2e348eba4735dace54` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-01-genesis-happy-path/receipt.json` | `99e3813bd659c539bf12d1096d2c81ab41f9424e` | 1535 | `9bf562f1a88d1daf70ff196c4328f25fcef1798d0c05a97ce7ec7a5f4e9f7806` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-02-chain-happy-path/expected.json` | `43dd7fabbc6617511a8ce361bd5c1d711e52b979` | 250 | `371d3060f1e68a5dd1e01515e6b1707a388174212d52974fa354a0abc354d786` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-02-chain-happy-path/keys.json` | `15c99f31fb4afc238af7a00a529cf4aeafa18c5e` | 93 | `8f974725fc13b556530379830003752b8e50dc2668860c43824db6f0ebc188bd` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-02-chain-happy-path/predecessor.json` | `1e4c96b81c5831532d662fa092b30bdb9c2548a0` | 1010 | `b13b0c39701cf00aa580c28d2749ef6bfb6eedcf60d9af3ee12f17b0869c43b8` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-02-chain-happy-path/receipt.json` | `b4a264489c962158a62a4f69bbbc61486d4c62c1` | 1010 | `eace2cd875b7527fef4f9c12c01979aa211079b80951f55016014a846837c469` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-03-tamper-evidence/expected.json` | `2b40505573c8e29f7bec132a2c59a5fa9156ff40` | 242 | `27fa3d2a754f466fb0c9f1ae068000f712de98db8b95355c779e5a86cc46c30f` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-03-tamper-evidence/keys.json` | `c5f876aab7c3d2a82fd8df2f55e18a06ace579a3` | 93 | `6aae9d9ad24ba36793830d7e517c112099ae265c096aff2e348eba4735dace54` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-03-tamper-evidence/receipt.json` | `7ffc92e9b079e361e7f4ca80d2b6a325056e37b4` | 1535 | `d65b3855aa5a52687069099c391100ff6960579ba041ab6e07a40e5194267aba` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-04-tamper-chain/expected.json` | `c9118b4e6cf7bb1923ea885973cde06463394dd7` | 395 | `da30e4aaf1b4ffa5c5a3141dd934616d1aa6ac160ac77f069d0949aa47bce2d2` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-04-tamper-chain/keys.json` | `15c99f31fb4afc238af7a00a529cf4aeafa18c5e` | 93 | `8f974725fc13b556530379830003752b8e50dc2668860c43824db6f0ebc188bd` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-04-tamper-chain/predecessor.json` | `ec464b52b8be5b7f88997eb7371f967a3624e2ab` | 871 | `0625f628e9980a83599aea9715cb991090e569a630bfc1ff34cf2489e746355a` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-04-tamper-chain/receipt.json` | `02174beb01d9da1243d180a6b54f9ae9d904ad4b` | 967 | `f02c223c5adf560688cfeecd2309ef3f2e9da46edb6cb31875ae56a8155cb194` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-05-impact-no-parent-sig/expected.json` | `2ca4e6d547201092d31c3329de4e89e123851e26` | 312 | `ad6bc0f55b104446de4e3e7e905b31e2e60217f973021681c9c5a515168c8fd3` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-05-impact-no-parent-sig/keys.json` | `15c99f31fb4afc238af7a00a529cf4aeafa18c5e` | 93 | `8f974725fc13b556530379830003752b8e50dc2668860c43824db6f0ebc188bd` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-05-impact-no-parent-sig/receipt.json` | `11e8218df1cb88fda0f664d01b123e26fe71fc65` | 1145 | `f85b6f0b5c2f0ffefad2ff29eba2ed6c26171b0a79368062fce185d9f0dd115a` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-06-impact-with-parent-sig/expected.json` | `33f213ce8a4926c0fe7202f6936d64ed7b8092b1` | 186 | `cb4363bab841905c73dd2a07f5bb8f24a34c79d088c7504c1fedb5e7af03a4d9` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-06-impact-with-parent-sig/keys.json` | `48253795156c0c607b4b327ddf44dc619c770f4c` | 273 | `f365ad62f1939957146e02025ac134164842e8522ea7f547edfa740e22b3f96f` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-06-impact-with-parent-sig/receipt.json` | `5695cdf73fb933f14053202bbb89084125f2beae` | 1338 | `71f6fc49b685e6f6264d4d394c09f215dc164329a4f177bba896091158cb14b7` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-07-pdp-binding-valid/expected.json` | `2ea780ac7b97d1cc23ffc031c54e06b43b2c08ad` | 215 | `5a8f2cce61d983c128b977b814f30be971577324d4f928d1dadd121c2b924630` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-07-pdp-binding-valid/keys.json` | `86a449136c0487d60a0ba066d6c536d18828eafe` | 183 | `b55ec977e5cde45f960321dc9fc511fa472b75591006afa706cfa6c847a78c52` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-07-pdp-binding-valid/receipt.json` | `50a11ea1f94b7d96136947b14124d15192a0e384` | 1241 | `80bb4ade1f05da62e526bdff51aa975d095acc1c8a9433c31926c18c55ec861a` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-08-pdp-binding-split-context/expected.json` | `9dd3e7cd3c87722c1fc1328b6c5509344ca16e24` | 263 | `b0f659bfa564c748a144858df4aa6af341e2e7be81f99c44a6d1c636ca438dc6` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-08-pdp-binding-split-context/keys.json` | `86a449136c0487d60a0ba066d6c536d18828eafe` | 183 | `b55ec977e5cde45f960321dc9fc511fa472b75591006afa706cfa6c847a78c52` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-08-pdp-binding-split-context/receipt.json` | `a905211c8db6fbeca04ad5dc897cfaa3a49befe7` | 1219 | `1d1221ab54c4777168b5ce2893bba4fd886fc0c2c041614e9ab862fcee536f5e` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-11-tag-stripped-known-limit/expected.json` | `5d2582128d74d197bea4e789c96ce7841d14eb12` | 517 | `06d475243ae1f96a28befbe68f68c56e4ccc80087dd8284b319a4c6d2becaa2a` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-11-tag-stripped-known-limit/keys.json` | `15c99f31fb4afc238af7a00a529cf4aeafa18c5e` | 93 | `8f974725fc13b556530379830003752b8e50dc2668860c43824db6f0ebc188bd` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-11-tag-stripped-known-limit/receipt.json` | `a24fc37227ed41813d31074e108e0038b7fdaf2a` | 785 | `897fb75274b78761b5a2e5c7fef1733f255c5a2a3c952914d84cd52ec8ac1065` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-12-common-mode-known-limit/expected.json` | `6ddd5ee31b62db7083a746975750f7a1fa22e590` | 462 | `d0f1e8d5ec2f8f9995e82067a0e0dd49353dde06234734c2b50d088cb00c7f21` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-12-common-mode-known-limit/keys.json` | `48253795156c0c607b4b327ddf44dc619c770f4c` | 273 | `f365ad62f1939957146e02025ac134164842e8522ea7f547edfa740e22b3f96f` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/aerf-up-12-common-mode-known-limit/receipt.json` | `11e1d5d729f85e4993181d30088a94d4f029b96e` | 1349 | `b92c879d8cc2825a74b6ce5acbf83dcdd0eba64126836e0a440792665c2c355e` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-01-didkey-genesis/expected.json` | `afe616d451b6b81f3dd38a6d02552be648b9d2b8` | 187 | `e50179dfe636d4016925f23e7e47c5238b567fdd839113be022e23a8734c8409` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-01-didkey-genesis/receipt.json` | `5b0a1ca3f4aab06b14cc4b3701687056c0d3aa98` | 1199 | `8812fd0a2090c2db557d66d8f94bc84aa0448f630b99baa2c66939fffb80957a` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-02-didkey-chain-link/expected.json` | `a9f63117a8bdc5b976ac200c89c1279ee16c923e` | 176 | `326535c27cf95119859c03c8ac56bfb92cdfb1dd59d3388cade623d127e3cbe2` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-02-didkey-chain-link/predecessor.json` | `5b0a1ca3f4aab06b14cc4b3701687056c0d3aa98` | 1199 | `8812fd0a2090c2db557d66d8f94bc84aa0448f630b99baa2c66939fffb80957a` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-02-didkey-chain-link/receipt.json` | `a9695acfd78feb98594593c4ee139340ece570a9` | 1268 | `3566a2247ccb1255acdf3847f98501526867345913c2f2ccb8c9fbc37ca10b3f` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-03-tamper-payload/expected.json` | `4943d641ba65f718b89b6be591d3d0c3a684aef1` | 222 | `e990dc0c4b5d040c6549f63c86ecebee9056e9cbc1e9f34f85777bd946ecbce4` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-03-tamper-payload/receipt.json` | `f8dad92b9afb756a9cdea44fa28596717e7f50d8` | 1205 | `10ff070300130ad2125bd459adf5845fa18d3f6f473a3ec68aa3e284257cfda6` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-04-tamper-proofvalue/expected.json` | `ad5bf59bd9889fb698eb8021083482cb0e810317` | 200 | `de4564e9bbde52ef7a19cf048e857335c0b4093a9d1a514812fc48db04c94b72` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-04-tamper-proofvalue/receipt.json` | `52b0f1487eb72b91edab8a189e8e9440bc2d3a62` | 1199 | `9caa968d442c8f20d47c92f1246333a7f7b8fdee568fcc374b30984dbf3c87f2` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-05-genesis-missing-prev-hash/expected.json` | `1cdaf8339953eacc4407f14d188f89d35824c52a` | 234 | `a3458ed921c4bba2257e16d34947ec8d6c6719eb47504716aa15ac75214250f0` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-05-genesis-missing-prev-hash/receipt.json` | `8ce081726c2754fa6dc441f32494aa563984b3d4` | 1162 | `b1f26de55cbfa7f0cd97cf354cbb1312c3d28457c55dfd721a5150a53f212bb3` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-06-wrong-key/did_map.json` | `5ff771db249669f176f77d8577045db7ec2821ab` | 103 | `024dca7cbf16495aa7a365940f6649da200c014990531b513f009e856c460094` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-06-wrong-key/expected.json` | `32fd339166a6de4bc708708823bbe96360642c2d` | 258 | `cb520e3e87f841ccecf6f991389d01baa090e5f7ea7ad508fe9a36e1966ec5a2` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-06-wrong-key/receipt.json` | `a26104cfc01a20ea405ea1edd5fafef60d7269e6` | 1126 | `3f578fba2083e4262e008b31e8dd290eb77b9d9e4cc398acfd5fd9247d2931d7` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-00-valid-resigned/did_map.json` | `8d3f17547c4668e7dc90d817172fc35e8a09eb22` | 101 | `6095f5ff5625aa48c2ac204be71bc1e7c6981cb87fda261f6428d701551408ae` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-00-valid-resigned/expected.json` | `16426e9596c6648983734bcf29c81f6313249c16` | 219 | `59bf41070a56fafc0934e095baed6a5fc0370c82aa5c8d68cb3fee367ee9125c` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-00-valid-resigned/receipt.json` | `2c7e51386900600672b7ea79089da788c19095d4` | 1070 | `12858f16aab3d5268069aef065cedf6772fe1bb76f1467d7fa814bb26994b2f8` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-01-wrong-proof-type/did_map.json` | `8d3f17547c4668e7dc90d817172fc35e8a09eb22` | 101 | `6095f5ff5625aa48c2ac204be71bc1e7c6981cb87fda261f6428d701551408ae` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-01-wrong-proof-type/expected.json` | `b1884c4db55d6541924f90b708452461b5f454e9` | 202 | `b829a976dc33fec0335d98253c853ad219e776e00beb0eb4469ce074010a6415` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-01-wrong-proof-type/receipt.json` | `bcc02834e4e5158f5db28ebadd493cf11f31db64` | 1066 | `f7586d1317beaad4da5aaf55c9214f0b3d7c58fc5d30f99a076cb7d6e3cdb5c9` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-02-mutated-action-type/did_map.json` | `8d3f17547c4668e7dc90d817172fc35e8a09eb22` | 101 | `6095f5ff5625aa48c2ac204be71bc1e7c6981cb87fda261f6428d701551408ae` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-02-mutated-action-type/expected.json` | `5200fc6794bf5c80c6f38c8fce742e649e16b4df` | 202 | `4113fabc0d39c54c7e9fc51a7315db87ea6d36c1d37000125a673893017868c7` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-02-mutated-action-type/receipt.json` | `65a1bd351f4c4834f0e609c803d9ec562e27bb04` | 1072 | `5327c84bb34b261ecfe6e1d88bb30c4946e412f28c8bb8973aeb5c1037894b94` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-03-mutated-principal-id/did_map.json` | `8d3f17547c4668e7dc90d817172fc35e8a09eb22` | 101 | `6095f5ff5625aa48c2ac204be71bc1e7c6981cb87fda261f6428d701551408ae` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-03-mutated-principal-id/expected.json` | `021245d14ab9c48d0ea4e8f16a6881c4cbb83ce2` | 203 | `d00140aa3b9b3c2bace16b65cf91bf96c624ba0618b1c7c0ab31c048a5ecd3ca` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-03-mutated-principal-id/receipt.json` | `eca30ba7a072b8286aa2732e382fb7b7d3ba9c20` | 1073 | `69848bb39b3f17be9cfe1feba955d176d82470745ebbfa23e79d65e340acd166` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-04-truncated-proof-value/did_map.json` | `8d3f17547c4668e7dc90d817172fc35e8a09eb22` | 101 | `6095f5ff5625aa48c2ac204be71bc1e7c6981cb87fda261f6428d701551408ae` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-04-truncated-proof-value/expected.json` | `b4821bc7ebbb8b1cab5d0bb9e51a478aa86c932b` | 236 | `563a653523fbc1ed5a09edad717d50fb9c763e1747425f5d54166da0897da1bc` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-04-truncated-proof-value/receipt.json` | `8b8f16a1ab8113622ad31adf1ef92630d31d5b4b` | 984 | `1de8195affb9c2004579596d8bfd7a3128a3a9347a5441700690cb48c3222c37` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-05-wrong-multibase-prefix/did_map.json` | `8d3f17547c4668e7dc90d817172fc35e8a09eb22` | 101 | `6095f5ff5625aa48c2ac204be71bc1e7c6981cb87fda261f6428d701551408ae` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-05-wrong-multibase-prefix/expected.json` | `871faf94ee30a04e1553440246e0df4ad9a63728` | 266 | `53bca5c4d78f90697799c7c5a49b518b4c026f30b2a7083403851c3eac4ce77c` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-05-wrong-multibase-prefix/receipt.json` | `f35789bfe7d923d7754a1e67fb607415a48b0e31` | 1070 | `9d57f0bdeaa3afdb8fb905da7a530916ba23b104f4651667958c41c12950e0e7` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-06-flipped-proof-byte/did_map.json` | `8d3f17547c4668e7dc90d817172fc35e8a09eb22` | 101 | `6095f5ff5625aa48c2ac204be71bc1e7c6981cb87fda261f6428d701551408ae` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-06-flipped-proof-byte/expected.json` | `e17953f31dd527b45abec9c3710aaa2f6b601d23` | 227 | `da5b4f740244d276ae9ace47b72e9513b64c0edb50468e164e7d00dd4fd3efb3` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-06-flipped-proof-byte/receipt.json` | `156bdb9d05a18fb358e1475a2d6604a16396974c` | 1070 | `49e8dda2ee5ff00db62efec6eed31e61faa060a0d6521671e227cf1da6cf3cdd` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-07-tampered-mid-chain/did_map.json` | `8d3f17547c4668e7dc90d817172fc35e8a09eb22` | 101 | `6095f5ff5625aa48c2ac204be71bc1e7c6981cb87fda261f6428d701551408ae` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-07-tampered-mid-chain/expected.json` | `52e62101f18fc9fa2ee7d1740a5cf4fad51c1480` | 305 | `13ca80f61e8e19551f39135435ed28be9cb4d6973fca1ca200fcb7eaa5780273` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-07-tampered-mid-chain/predecessor.json` | `e910fdd0c252c8ae6cc7eec0851ed27a553539f8` | 1078 | `974c25b1f06a855dacbd3cd601e17a059b8df60d41217fd2ad9c2b08eeac17ef` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-07-tampered-mid-chain/receipt.json` | `b51142b880337f52ce90cc4d66633c4d34e58724` | 1078 | `be088b97896ac6c6f42fae172c05ae2b5b68819631ddf668d70d4a9c6a2f0e85` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-08-valid-chain-link/did_map.json` | `8d3f17547c4668e7dc90d817172fc35e8a09eb22` | 101 | `6095f5ff5625aa48c2ac204be71bc1e7c6981cb87fda261f6428d701551408ae` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-08-valid-chain-link/expected.json` | `f80945f72962b845d95ae5b22925c6997c8bb0e3` | 213 | `7715606674350e64bb3a23467af8dda0280030a5b00dd1e82c3457b24fa6828e` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-08-valid-chain-link/predecessor.json` | `6dd02ffaadead687c2b602c1f907c0b851e4fcbc` | 1063 | `44e58aebe13a0637d1fff5986d27bc01b0c813e9b9c5eb260f3c47cdb266f128` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-up-08-valid-chain-link/receipt.json` | `80b855c9ed0b8fcf8b077dd91cf255827bca2fa5` | 1132 | `e738ffa8474c8450ca8fe3b43b9a7fc1ac12bfb2955c97c22d44257627f4dba2` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-upstream-interop/LICENSE-MIT` | `8757c1d5c4ed24b01f555a5a880a27b605d5ae0b` | 1066 | `8e763ed5465f23ff5c751a9ecd4999190ee0deb00d33214633994fc5d17fd40a` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-upstream-interop/canonicalization_vectors.json` | `f433c04316af7c8fae71a32c23718a4a697a278f` | 25891 | `df439a5b54471f210b7860dff5da1aa3b312e47689960979a65ffbe499f487ce` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/agentreceipts-upstream-interop/did_key_vectors.json` | `eb958f735a257c0988855044c0fe2fe7c4361699` | 4783 | `478e87e1e61a60d8239ea7f350daa99fb2341ef3d6c3c2ee74978f7e39a82aac` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-01-genesis-permit/expected.json` | `e49c143f485c38335565f395933ae1b9a9bfde9e` | 199 | `72257a48afe336d13b589dccbcdf83743d80437dee729954d0a9494e915e9fbf` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-01-genesis-permit/jwks.json` | `26d581d818e26b4c6aa18773685ea40cb9b5b323` | 218 | `9ae219e656fa81e03cb8ab0074adc3c580ae618b3f1f652f6a3dfabeed5a1615` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-01-genesis-permit/receipt.json` | `448b475971f989c1fdbebc2d587c8736806136a1` | 983 | `a04803fd954195371caa827e1e1b59a401ab16a45b4c3805495dc30c555dfd1e` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-02-genesis-deny/expected.json` | `e8ef9235d8a6530bc8113e7d6e76b1e19bf709ec` | 140 | `4e2a3e0e0fbae67a1e243b82c0e240401cefe7fc6d33b84f479ff8f086cded5f` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-02-genesis-deny/jwks.json` | `26d581d818e26b4c6aa18773685ea40cb9b5b323` | 218 | `9ae219e656fa81e03cb8ab0074adc3c580ae618b3f1f652f6a3dfabeed5a1615` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-02-genesis-deny/receipt.json` | `cee70e4865b85df4ad08316c3123a0c138966f73` | 979 | `d4151898456419e18605cdd5a742223a0a71b26fdd46902a5aed0d2759b97e09` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-03-chain-link/expected.json` | `604b27af19bf5b03e8679e1fdaa7af3d65a10a85` | 203 | `59cf35472dcc75f090840ba3b126bc963f41783d27192f21ffdb93aae905446d` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-03-chain-link/jwks.json` | `26d581d818e26b4c6aa18773685ea40cb9b5b323` | 218 | `9ae219e656fa81e03cb8ab0074adc3c580ae618b3f1f652f6a3dfabeed5a1615` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-03-chain-link/predecessor.json` | `448b475971f989c1fdbebc2d587c8736806136a1` | 983 | `a04803fd954195371caa827e1e1b59a401ab16a45b4c3805495dc30c555dfd1e` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-03-chain-link/receipt.json` | `0668529f17d35fb87716f1fef44d42697c7d711d` | 987 | `fc1fef69ad88d08ae3b178c9beafa14182da26f5a3886a5f3f4129ccb12adbed` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-04-tamper-sig/expected.json` | `f3cff2445e380dd1a61d47aceffd0314234118db` | 241 | `6a546ffe7d28449a75606be56610780b9e4dd0cdf98526e9ac3a89ed885ed584` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-04-tamper-sig/jwks.json` | `26d581d818e26b4c6aa18773685ea40cb9b5b323` | 218 | `9ae219e656fa81e03cb8ab0074adc3c580ae618b3f1f652f6a3dfabeed5a1615` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-04-tamper-sig/receipt.json` | `8bb637cd966d7506e6457a4c4d219a9ed5e90cda` | 979 | `dd2a2b93fbe092da744df4dbd1cecbd51f0e7b5291567bd45ea2ccef00681c86` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-05-hash-mode-prod/expected.json` | `040b247197b2ad3e469e6bb6ce26305c8e1dd07a` | 495 | `095cf2c05f0348f4d7e606c88fe5594850b4ef775357a21643c8ab75511950d0` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-05-hash-mode-prod/jwks.json` | `e2a52371352e5133c9dd0f5cf3a24e8871758d0d` | 2851 | `1bb3cab68ac297336fce89453f7c7a94ddaa13f84d44ae579af8f3e8b5845325` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-05-hash-mode-prod/receipt.json` | `170f8f78787d2e1127c627dd7b13952c57f12311` | 5001 | `d2f1baad9be60bdf3a2941c4e9a99e6e63d1bc7efe88c571e3f581d8db52354f` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-05-hash-mode-prod/signed_message.bytes` | `7830b2b7b89d254641cc0a87e6e7d3019af891e0` | 418 | `f1011f5e493bf8f3f6fa7baa660aab6be2e0bbf925d852672e67155f08b4f0b3` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-06-mldsa65-payload-prod/expected.json` | `38e85fd4e54af9fb3612c5db90644827a6ac7e5e` | 754 | `bb2b199ca610f13b136496ff84b832d4aabfefddb38d482d50dc155d19592b7e` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-06-mldsa65-payload-prod/jwks.json` | `937f65124a5727471170803a37ef30837a91160a` | 2851 | `2ca81e3233f23ebdfa9f230c6914025f0dfd30a90c9cf322f70198c61d098bc4` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-06-mldsa65-payload-prod/receipt.json` | `387ce1be14203e8e06d741270fae38b60dcb9a8d` | 11222 | `e5c81f01d570a9a1cf0aca8f6c773feba8ce01b9580d44ffac3a26dddbf22e63` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-07-revoked-key/expected.json` | `0ac8af49034493d503abf34f2f5d741101937691` | 230 | `15add9bbb4e86a185ea211370dba29f68367aa7eac1c787edc272d5b2f46b19a` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-07-revoked-key/jwks.json` | `6331575d76b1e1ee249b693758dda8bc90308bcc` | 232 | `189c0e0877682e5dda5665e6ce7dc09cb7af9adeb01184e97b022a2c5572bc08` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-07-revoked-key/receipt.json` | `94061c6062bf5070189446d91534cc42fb1a821c` | 1012 | `a86f92acd6544233ee0d2f0297268d2eb0a7a5fbb964a9a21615a74b08dd571e` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-08-v2-signer-canary/expected.json` | `91b9d8c2b80e7a83732b54acf307ac5ee184e365` | 240 | `2095b072b9b21f4ce386c8e4ac982936b5a4e1a26b112b3f2494d06c4fa072e0` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-08-v2-signer-canary/jwks.json` | `c43b096903250f044cdc1959e51374566c58ceb6` | 217 | `ac7bb4db46eb8208b16f0eb805dcf32d42ea21af4bf5fa4287321fd971515205` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-08-v2-signer-canary/receipt.json` | `82d691659c131ec259d583cfffd4bcd6b1b176e9` | 1410 | `dfc15b1cf72c4bb5c061567fb0efda699b733735e9f1a43c9b760048fa195fd2` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-09-v2-signer-tampered/expected.json` | `028db1dd269e7e39e0ed918fcfd6a9d5afab61df` | 300 | `4c8855d8e17c9d7a294d0be39bff6d8d536646ad18c56574af3a7b9a22123167` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-09-v2-signer-tampered/jwks.json` | `c43b096903250f044cdc1959e51374566c58ceb6` | 217 | `ac7bb4db46eb8208b16f0eb805dcf32d42ea21af4bf5fa4287321fd971515205` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-09-v2-signer-tampered/receipt.json` | `6734ef0593d4552e7de6de23c8697b582bb3375c` | 1417 | `3d6abfdd2e28b0ecd1665d77eb31f982351170f1a5423e2677ee0a1011c45e2a` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-10-hash-mode-multikey/expected.json` | `db420bfafe0c15748429af5e9c2b2afab7b76c86` | 521 | `3c98c29f46c49dec9682e9d5f0d404b4afcfdda452b3be795e899d6271e0274a` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-10-hash-mode-multikey/jwks.json` | `2863fff37f869d1fe82e23742045c5b19ccbe080` | 793 | `bf77ddd51ded09509785aaa1c74bd8c36f92ba3f139761fd158dbd2a399a2f53` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-10-hash-mode-multikey/receipt.json` | `9321bd1236899345c370c76746bbc53d1ec6c3f1` | 601 | `1cbcbba803be7a5a7cc4f62ccadcde293b82a1d97f5384272e187d1be2b7143f` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-11-dup-member-toplevel/expected.json` | `c19964a324895b118e9c6b8e56596cbffd995ee0` | 287 | `c624641d5affc05afdfaf00f366b1f7af0780268f894601e272c2863975ad7ac` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-11-dup-member-toplevel/jwks.json` | `26d581d818e26b4c6aa18773685ea40cb9b5b323` | 218 | `9ae219e656fa81e03cb8ab0074adc3c580ae618b3f1f652f6a3dfabeed5a1615` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-11-dup-member-toplevel/receipt.json` | `a3c75ec3a80a05fb4d48573ab6b97f6cd76a7aff` | 1761 | `aafbcd0a35de37f1f51090aebf6818bf05c2a522f8df5a685a34573e3c738dec` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-12-time-edge-expiry/expected.json` | `d6f9dafa289ef8fc1aa0a0897de3723d64c2653d` | 609 | `4ee238d716051a55e735e89f7aa8724826245f7d65b6356746d8266ba9fde53e` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-12-time-edge-expiry/jwks.json` | `269968b3a694c09d5417f01906af862af525a3ea` | 2815 | `55327556a85470fbe1402763ba9764f74834fc1490bc322b5843f75c5ec84fb3` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-12-time-edge-expiry/receipt.json` | `4832cb93d3a6e2ffe7d9d7658b260973f2da80f2` | 5320 | `85c3a2b0237529983b5cdcbd125092d49ce2f65519f43e0eeae79e23571687cb` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-13-dup-member-nested/expected.json` | `d71d3844afd2862fd41ed29962f203723a9fd3a9` | 335 | `31ea22ea00a547260cf8f8c6b0cb997a1af0180b4c03c4108ca702633727d4c8` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-13-dup-member-nested/jwks.json` | `26d581d818e26b4c6aa18773685ea40cb9b5b323` | 218 | `9ae219e656fa81e03cb8ab0074adc3c580ae618b3f1f652f6a3dfabeed5a1615` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-13-dup-member-nested/receipt.json` | `867ae203d3769104c3f6ac92166050d2ff7453a9` | 950 | `92d59e50acdc025c61f333a7f6460e1360f452162b4163d7a04cdb6f2d5f9f25` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-14-omitted-action-chain/expected.json` | `98a4da9961a13f344c0b11e3b0b8b7b8f30aefb5` | 339 | `06357f2512c24e09451bee45b5c768c7209bdc478a6c6ed863ce98501cfeb33e` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-14-omitted-action-chain/jwks.json` | `38aa2f2729c9ef4010a4a5fdc919975c201ff1e3` | 220 | `66b48d812c9bd056eee1e1bcd53721d71158b2cf8ae16542a6ea925fd3d8be4a` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-14-omitted-action-chain/predecessor.json` | `a3055ff6b0e341d6d802abe391d071191c9a357b` | 987 | `1de638bb8bea4464108fc9ec231f197671b33c12877307cd5e14131bc99c1168` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-14-omitted-action-chain/receipt.json` | `a431aa386b904be05e233af0319a13a24043e5c5` | 1012 | `54a1199916791ed7053222f5325531cb78c7f026096929e8eb7f0c6a128a22a0` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-15-unsigned-gap/expected.json` | `2db4a703152365635cdbeb94e8e50fb04f657796` | 264 | `0a62093dbd9707846e0a44d528d693b92e0511572eb576cb35a113b4c01ba75f` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-15-unsigned-gap/jwks.json` | `38aa2f2729c9ef4010a4a5fdc919975c201ff1e3` | 220 | `66b48d812c9bd056eee1e1bcd53721d71158b2cf8ae16542a6ea925fd3d8be4a` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-15-unsigned-gap/predecessor.json` | `efdd8cb89d84d61cf7bfd14a2b7b05c6dda33e7a` | 967 | `ff2876c29aa10a381069a52133ccfd7f31e80ea715abf00fd0f530faf980e006` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-15-unsigned-gap/receipt.json` | `3559abcb257692a12b9559ddf6aeccb85865edcf` | 1122 | `a00ff97c72cef3fc066a48dddc7a8d628ab4f8a6ac2ac1fccf48a425e9d0bde5` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-16-chain-emission-blocked/expected.json` | `9139029cfe9335e839986dbc05ca99f9a97105a8` | 280 | `6112858c2e1a334dd468928323bab52ee87e0d2337e53e74f50fd98bba4760e6` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-16-chain-emission-blocked/jwks.json` | `38aa2f2729c9ef4010a4a5fdc919975c201ff1e3` | 220 | `66b48d812c9bd056eee1e1bcd53721d71158b2cf8ae16542a6ea925fd3d8be4a` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-16-chain-emission-blocked/predecessor.json` | `856baf24e1df97dce6d91297e44bdeff9ae42783` | 964 | `cf300a7789708e4251587af6d7ab3d247143d2683f47e5301d858743fa4bca42` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-16-chain-emission-blocked/receipt.json` | `1bed82e5ca09091328460b920aff0a7d993a2631` | 1044 | `37c916421e4cf494d21a3956b136447af92bfc4d33cb9df39ca25b0653fa3e19` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-17-seq-contiguous/expected.json` | `6c96b5b2d95c0d44fdda52997db64c9f31dabb75` | 203 | `09f4257b74ad32874c10f3c7a262d3642e5c55bad6f4fa303815030e1bded210` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-17-seq-contiguous/jwks.json` | `7c40c89e83f944a98f1f818b5a84997ad245aa6b` | 215 | `79868ab758a20f67ec0e9b670760c8cde54b62a55754336d0f1b8379f4c42c4b` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-17-seq-contiguous/predecessor.json` | `d5dcbb36d7eb88372eab153fe3c29535c7b23bde` | 980 | `5cc1562ba455535ca555de839c24354e84c24a01919f29c3132999f57cf10cfb` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-17-seq-contiguous/receipt.json` | `c7572cdb60e831a7cde2b02a712a8e4e8f0a3266` | 978 | `19f2713c4389668488c33e916d26b7c968e0950118ba619478aab901fd3d4ef8` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-18-seq-gap/expected.json` | `cd432acf70752eec47dcb2ab1ab4c3c10cc28a44` | 462 | `de21db0364ff296d0d3a67ab6f2d26cdceddf24987b84514a2bddeb4ad0ca926` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-18-seq-gap/jwks.json` | `7c40c89e83f944a98f1f818b5a84997ad245aa6b` | 215 | `79868ab758a20f67ec0e9b670760c8cde54b62a55754336d0f1b8379f4c42c4b` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-18-seq-gap/predecessor.json` | `c082b9143a30687ddaa0c7ae6d1684c8dd7748f8` | 975 | `37ebae00eb375af10fec6a09526fbfdd69bbc9d7b30ad5c798fea6ec32e12fec` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-18-seq-gap/receipt.json` | `1d032f1b4498021905a29e3a8120cf33644ca6a8` | 996 | `6deeec6020a6f62e4852d0d122460752edf7cebaf745a444c649a4bf6145403b` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-19-seq-non-monotonic/expected.json` | `55b7fbcc5f6a10e0bfe6fbeba0b6687be8715933` | 348 | `727d052e1cf0dac08b9c5bbbd6420dfc1f6e18b955e10d2e296db9d9d9c33aab` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-19-seq-non-monotonic/jwks.json` | `7c40c89e83f944a98f1f818b5a84997ad245aa6b` | 215 | `79868ab758a20f67ec0e9b670760c8cde54b62a55754336d0f1b8379f4c42c4b` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-19-seq-non-monotonic/predecessor.json` | `6132f5c3a73fd21d9ff2d88ba511df610ae0eaea` | 985 | `888f83e3e63eb4a87d4e47ecbbff1c89b244433363755159df656645c8a26c28` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-19-seq-non-monotonic/receipt.json` | `edafc104d448fccff7eecc262dc1d527b1715daa` | 983 | `d8b6d9660f7b4b053694cb777ae29d6c701563e53dae82fe7d16537b8c374682` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-20-seq-absent/expected.json` | `da35439e01a8d77656315b4b6cac8ba9038b7291` | 337 | `9252b33720cdb45e9f777d5af453b286335b2679768cfec46bfdbdffbfa6260f` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-20-seq-absent/jwks.json` | `7c40c89e83f944a98f1f818b5a84997ad245aa6b` | 215 | `79868ab758a20f67ec0e9b670760c8cde54b62a55754336d0f1b8379f4c42c4b` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-20-seq-absent/predecessor.json` | `3052852c0bad658eebb6885fe4c42094cfc42458` | 957 | `1a7ada3d0cc133963e22541f1eb49dfc2d2f874adf360839a7838b9da28a46d3` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-20-seq-absent/receipt.json` | `8f9d72dc06bab30ce87e9804e795d57f9b1ba680` | 955 | `7b75254baf81c3dbfe21544e40f324bcb7861b7980e1c15d7673fd51764b20c2` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-21-key-thumbprint-binds/expected.json` | `d84fc47bade60121a2841f057df1e8a2f93ad222` | 278 | `ad1da90f46d8a46638f21bf3b8b5f1b0976f0e4efbdfe4690fc1527558b880ff` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-21-key-thumbprint-binds/jwks.json` | `80e7380ebb5e6c6b47bef9dc031be4a441f31f5a` | 2785 | `c4d9d51a5ac96dda55613c613e598b897f86b701df2c5acdbcf0ac5f043250b8` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-21-key-thumbprint-binds/receipt.json` | `3da794fbaaa311c72df9c0374bb667a1e9f890c9` | 5436 | `77a0e8866f049c73fce6bc5bfd1e7509a244c61e78ca6072fd7ca7613a64f828` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-22-key-substituted/expected.json` | `887508f94aab419aee93ba351b4b730f32de3470` | 529 | `989879fb47039d532479b0e5784972df29ef7567ddbb778118c46507b484f78a` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-22-key-substituted/jwks.json` | `80e7380ebb5e6c6b47bef9dc031be4a441f31f5a` | 2785 | `c4d9d51a5ac96dda55613c613e598b897f86b701df2c5acdbcf0ac5f043250b8` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-22-key-substituted/receipt.json` | `f8ec8149b18db06bf361b8163a6dffbf5c6752c1` | 5437 | `db9bd41995bf6c8efbf7d754aaaeffcdd0bd91d3f4c7e940896cfdfcc2909ebc` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-23-anchor-status-pending/expected.json` | `a8b76aaf5cb09e6ad380b8a25b3c36fdb218985a` | 529 | `a5a3f5c3aff2f9e09b6fd29cbde39bb901153516302ce3a72ae9c12eaefec51c` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-23-anchor-status-pending/jwks.json` | `50da003fdf78b6f52fdc08167e2a3ab10af43cf2` | 197 | `50944d061ae19457606aaba9e92a17fbec3a6d47a6f9ffd4b07e899e95a436c5` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-23-anchor-status-pending/receipt.json` | `35c2173fb91f5a7770c646392368507ac78c0c10` | 1021 | `6c8ba6cc000066f8df021a8e46b052887b3084219047b8af90c094f5701a93d3` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-24-anchor-block-hash-prod/ANCHOR-MATERIAL.md` | `29ab10cc74c2a9f0a40273b627553c74cbdda3ff` | 2597 | `9c75aa2de7573f2297205289c77e3de63672d561e9aa202aeccb359cfb69a896` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-24-anchor-block-hash-prod/bitcoin_headers.json` | `26332559f6e2ee0874f3b729ee6b8380fc9e0368` | 224 | `c9ef4a03f1a8e1c0fd4eaf8ca4ce611b909304806e94854559179879b51bffa7` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-24-anchor-block-hash-prod/expected.json` | `10a0b54370268282e1efa5f6fd6aa0fd8dcf684c` | 879 | `bf709720bba281f1c14b543fc36d5f3c678ac8fcd602402f6796533fab2384e9` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-24-anchor-block-hash-prod/jwks.json` | `728f18cad718ad297258b4b10008ef5625b06d04` | 5671 | `6a35239a9ffff63438e5d9b810f74dec4c55d8b30c63743b69ae0e1fce04b02b` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-24-anchor-block-hash-prod/predecessor.json` | `0cac45e8c55c120c56e3307cf50dfaf3ed82198c` | 14083 | `2b4f3d1b33ceed39c098ebb36c6196104d302370ac04b97b30a5d68fe2a2a5b6` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-24-anchor-block-hash-prod/receipt.json` | `38453101b8cb96f423efc52b7e0968cb553b8b3f` | 14274 | `02e529aeb56128a6e43edf3df74780408e0482433fce8aa2c55e39a27517e6d2` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-24-anchor-block-hash-prod/tsa_trust.pem` | `1ec303631d93b84b8e5a9bd75832330e10fbd11a` | 5134 | `d04550215beb76d072d659b229dc6d14e7b7c20f68e46f09bd741954176b5e8c` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-25-payload-digest-rederives/expected.json` | `7f22927c92ffbbec5e3c3fb53ab8de14de389fe6` | 554 | `7aba608ffda2cd500c908da93a4e77a6657a8d35e82dd09b4d96244fe65739a2` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-25-payload-digest-rederives/jwks.json` | `79d5b85fafb98a25dddbb9476480d3c50970883d` | 226 | `07cda346c9a4383c6dc38259da13c78b63ea95936ce449c687071f8b5ab7add5` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-25-payload-digest-rederives/receipt.json` | `6310e14d4fd3ca5ee2863311240719ac4bc12c5a` | 930 | `0ec4e347869c3ada6b97330e76e886e1c977b26a328214bc6d8fce6b67a6b62c` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-26-payload-digest-mismatch/expected.json` | `2f11269f7628a39529871197f9c9fd030aed79ed` | 535 | `52945991f4fc899d4fb62ea44fe32ddecd3c23bf4857548d24cff85c035575e1` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-26-payload-digest-mismatch/jwks.json` | `79d5b85fafb98a25dddbb9476480d3c50970883d` | 226 | `07cda346c9a4383c6dc38259da13c78b63ea95936ce449c687071f8b5ab7add5` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-26-payload-digest-mismatch/receipt.json` | `84071fb3cfb633a25298b8662d92b9fee2e66d79` | 930 | `40810100d0144e95180119d7066d9250c3dc2f55913296e36dbf9449d1f4a7f6` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-27-anchors-absent/expected.json` | `787f25994c557fa07ba1aadd83236f32dec8cc6f` | 378 | `8ff396cb533c06e37f75df4817d8a4726741ce58b38324630ebc693329ad9c44` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-27-anchors-absent/jwks.json` | `7c40c89e83f944a98f1f818b5a84997ad245aa6b` | 215 | `79868ab758a20f67ec0e9b670760c8cde54b62a55754336d0f1b8379f4c42c4b` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-27-anchors-absent/predecessor.json` | `d5dcbb36d7eb88372eab153fe3c29535c7b23bde` | 980 | `5cc1562ba455535ca555de839c24354e84c24a01919f29c3132999f57cf10cfb` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-27-anchors-absent/receipt.json` | `fa88b7dc810e583195ea80b10ee995ff79f56e8a` | 961 | `eecae5d126e9042bb7bdeee2ad790c06c53585855c2ac4c5659a9af3834e188a` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-28-anchors-null-malformed/expected.json` | `11e943f5fb84bd53fd9dd35899fdb8f3915a9d2f` | 577 | `31a89695259911a0ecee5fd3311160fd2cda415820df353abaee752de17f8b03` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-28-anchors-null-malformed/jwks.json` | `7c40c89e83f944a98f1f818b5a84997ad245aa6b` | 215 | `79868ab758a20f67ec0e9b670760c8cde54b62a55754336d0f1b8379f4c42c4b` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-28-anchors-null-malformed/predecessor.json` | `d5dcbb36d7eb88372eab153fe3c29535c7b23bde` | 980 | `5cc1562ba455535ca555de839c24354e84c24a01919f29c3132999f57cf10cfb` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-28-anchors-null-malformed/receipt.json` | `72860698c9919142b59d9e760cd0b3a58e4791a4` | 980 | `fef4f4d402b0d737a8da4f31c413476c9ad73883522b5cd495091003f8e05f33` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-31-counterparty-scope-match/expected.json` | `d07b15aeebb20f69cb137e528ae4e79fccd7f5a9` | 174 | `d7c511fd01fec22f12fe9338c9b95e305ba4db70ad9510faacd6fca97c1d388f` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-31-counterparty-scope-match/jwks.json` | `b53c98301664fc288a731bf26cdada69d0ab1dd6` | 377 | `612143b9ca1c6f79063d7ff8e9ec3b983d70339f8898ef7ef8a2a24db06cf6f0` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-31-counterparty-scope-match/originating_envelope.json` | `cdb06ff50a4a50f0af1ad7122ab885ab028be9d1` | 1766 | `30ffa57c2cae70263318b27d785e482f8716830747a6dfb0283c690e6ebeb614` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-31-counterparty-scope-match/receipt.json` | `e4cae17a053669fe23491fc4e4967cefc52b5048` | 1573 | `c1e86744ad12a98b514c24f70bd554b3ae1e5373bb2c9a3c41d8ed80106a057d` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-31-counterparty-scope-match/tsa_trust.pem` | `01e40ff8885bd54865fbb3fa0e0237e8160457eb` | 113 | `a3efa8b0ee9fb552c5d0e98b09e53bff7f1a7a1e7b91b31b4f226433456b32dd` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-32-counterparty-anchors-included/expected.json` | `b7d8fc078b7f7b79c7565f4e0a8ae388f092822c` | 228 | `52f56d0e5875bfa90390ec813eb7fa984b67cb6477cc134dde6bad6b3d4676cc` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-32-counterparty-anchors-included/jwks.json` | `b53c98301664fc288a731bf26cdada69d0ab1dd6` | 377 | `612143b9ca1c6f79063d7ff8e9ec3b983d70339f8898ef7ef8a2a24db06cf6f0` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-32-counterparty-anchors-included/originating_envelope.json` | `cdb06ff50a4a50f0af1ad7122ab885ab028be9d1` | 1766 | `30ffa57c2cae70263318b27d785e482f8716830747a6dfb0283c690e6ebeb614` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-32-counterparty-anchors-included/receipt.json` | `e7722329eeb07aa86e96f446030842e2acf55539` | 1573 | `f44dbc522c594cd2d0343fefee7f19570309ff87b3d3d20bca9e470d34840680` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-32-counterparty-anchors-included/tsa_trust.pem` | `01e40ff8885bd54865fbb3fa0e0237e8160457eb` | 113 | `a3efa8b0ee9fb552c5d0e98b09e53bff7f1a7a1e7b91b31b4f226433456b32dd` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-33-counterparty-scope-absent/expected.json` | `2ec25126a25f30296dea7cde2e3b283e53c98fd8` | 241 | `2b53526eee72eaba5fc6f1c5587b28b004b63f81fb272a725270d9b83f50e866` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-33-counterparty-scope-absent/jwks.json` | `b53c98301664fc288a731bf26cdada69d0ab1dd6` | 377 | `612143b9ca1c6f79063d7ff8e9ec3b983d70339f8898ef7ef8a2a24db06cf6f0` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-33-counterparty-scope-absent/originating_envelope.json` | `cdb06ff50a4a50f0af1ad7122ab885ab028be9d1` | 1766 | `30ffa57c2cae70263318b27d785e482f8716830747a6dfb0283c690e6ebeb614` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-33-counterparty-scope-absent/receipt.json` | `a7320535de7d4f0f9f1e8610987cb519b21e8baf` | 1532 | `cdf3ac3a505be89e974f3a21e2a3cfb3027ffe9384258f1b0d6c67f561c36b16` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-33-counterparty-scope-absent/tsa_trust.pem` | `01e40ff8885bd54865fbb3fa0e0237e8160457eb` | 113 | `a3efa8b0ee9fb552c5d0e98b09e53bff7f1a7a1e7b91b31b4f226433456b32dd` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-34-counterparty-scope-unknown/expected.json` | `30af9fbc839b96d208814d055a1b02d7baa53eba` | 253 | `ba27083d69d0c95811b84f53ead17edb7076460634d8ea9adb2f4aed40c8e4c3` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-34-counterparty-scope-unknown/jwks.json` | `b53c98301664fc288a731bf26cdada69d0ab1dd6` | 377 | `612143b9ca1c6f79063d7ff8e9ec3b983d70339f8898ef7ef8a2a24db06cf6f0` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-34-counterparty-scope-unknown/originating_envelope.json` | `cdb06ff50a4a50f0af1ad7122ab885ab028be9d1` | 1766 | `30ffa57c2cae70263318b27d785e482f8716830747a6dfb0283c690e6ebeb614` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-34-counterparty-scope-unknown/receipt.json` | `56aa7cf945e202fe7257acffe3e7a883bbba9817` | 1576 | `3e2ca4f8c889d94246288252c0e3a87d1fccd2c11483d41e2383970cc1396ccc` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-34-counterparty-scope-unknown/tsa_trust.pem` | `01e40ff8885bd54865fbb3fa0e0237e8160457eb` | 113 | `a3efa8b0ee9fb552c5d0e98b09e53bff7f1a7a1e7b91b31b4f226433456b32dd` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-35-invocation-ref-binds-pre-post/expected.json` | `e5c31f9bf345b1fa925fd82fc5f7a612a322c763` | 373 | `55afa16c0f9d18b3069d59ff2f4b77e63a190b6a21fa2db81f4ec24ff4e978d9` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-35-invocation-ref-binds-pre-post/jwks.json` | `8afed90d5d5d54a4b5609d03bda4395a7490a1f7` | 226 | `a00b3fe84d8c84f58ff8a012b448b302b3e85b57f280e6f2a269285122cfd717` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-35-invocation-ref-binds-pre-post/predecessor.json` | `b5ac83c6c5f9ecf2e8e674763d175251bf3d64c0` | 1098 | `efd59e720f1e6595f7f13587d214e831f2750589e9f90de2b917ac4afde725bf` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-35-invocation-ref-binds-pre-post/receipt.json` | `344f49fd69282880c92ff71e35a52881b82ca10f` | 1109 | `13ffaadac5b1c3dd17301beba0140a589883741afc7c9aa10a1d4b65d18d6065` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-36-invocation-ref-duplicate-emission/expected.json` | `44a482659c517aa42348e27a264a626ddf4f0162` | 406 | `570f043a77764ad116d7d2a39b77a678acb9d10e42724e92fe42b48b66c1d729` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-36-invocation-ref-duplicate-emission/jwks.json` | `8afed90d5d5d54a4b5609d03bda4395a7490a1f7` | 226 | `a00b3fe84d8c84f58ff8a012b448b302b3e85b57f280e6f2a269285122cfd717` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-36-invocation-ref-duplicate-emission/predecessor.json` | `073a56a6745e7f39ca0c31508b0cead6d070cb0c` | 1074 | `be23ff90b5d50a28b9961badd43c8231fce000557c556b959ec33aaf0e13d401` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/asqav-36-invocation-ref-duplicate-emission/receipt.json` | `577e308ec049b62403cfb62e4b78d3f6901f7efc` | 1074 | `a3ad3df3588dd556f2d888ef6a9f440fb36376eda8e97c21b83de476f3e97256` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/authproof-01-genesis-real-sdk/expected.json` | `83e29bdec999b4b759e3c032cc1782122342ed4d` | 274 | `5599a2e6341d4194186cd5c43be8c271c2dd40d8a382f1be536d89488e6378a8` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/authproof-01-genesis-real-sdk/receipt.json` | `1352fcac113fd257c5c3a03f3ddf52b46139ec14` | 763 | `9b0bfeb53d7474efe5f8faf5cd61ffb0675db784ea676bdd7db0952eba60ce09` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/authproof-02-forged-sig/expected.json` | `c1479634c9612fa6cee66ab07568bdb8f4a73e8d` | 186 | `e8b42e53a622ba9251d48c5ec975e357e5ad26f9d4e0e2e54b1ae739dbd8183e` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/authproof-02-forged-sig/receipt.json` | `ab5f76f80aace606bf817b7add36b46e78a8f0db` | 763 | `c7b9c29bbade77c4a9cc0e08aed4a193d8f79529dab40b2365456be94422ff13` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/authproof-03-tampered-scope/expected.json` | `bf11f47ef5d269ffd167b0705784c69bdd4fb813` | 203 | `727543274ada80070b9242064bd7d554f1d02a0f0df566a3f4ce0a53812c68fc` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/authproof-03-tampered-scope/receipt.json` | `c837206feb70a63abe003a8fa3d4074e240b21c1` | 752 | `b5eaef5a53f3aa58de9b774f6f4da82fec619fa9bf80b36cbb4649b40c6f7b4c` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/dsse-attestation-ml-dsa-65/expected.json` | `b9af048495a85c355fcd18427c4733fe3f09f5a1` | 646 | `1ea376d91636d4d97011e71c1fca5453b3b0e00ebf31da148e7b1869fb5746d6` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/dsse-attestation-ml-dsa-65/jwks.json` | `88343c8089837299e1d387776074afb12a5cf662` | 2843 | `948f90f172118d08657c040598a30c7934199c918642b1cc226daae88782eec7` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/dsse-attestation-ml-dsa-65/manifest.json` | `5b387e5d3657fb89e5a60dbfdcd3b2e54d842a29` | 778 | `e7043c177731126a1deda33e0e6cca6140b67a782c00415f35c8176eecad949d` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/dsse-attestation-ml-dsa-65/pae_kat.json` | `c44502223c4109db16235f7a97b7a8163bdf0ad6` | 1263 | `9599c222cbe57786a4f5309c6533053356bd2cbaf79e0cb39fd31724f53102dc` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/dsse-attestation-ml-dsa-65/receipt.json` | `ffaa26c4bef8adf69eaac9dc0bec5c425c4983f6` | 5087 | `59323a1cfe5c6b91866aece0e51f38afd391cc26c4f457d9b1d5639b3efac86a` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/gen_acta_upstream_vectors.py` | `3a747d1c8a0439b3620cf5fb4ebf4b68d28eb9d9` | 3892 | `0a805b56593b428f68d11f4240307500bbe29ca5bed9549892f53e95b839cc80` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/gen_acta_vectors.py` | `95cd54a3f4d3a5e3da82ed492f3c4a214a8be5a7` | 9809 | `831fec25de5d0e352f75876fe91db5625c596294028695a5caeffda1828a6e54` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/gen_invocation_ref_vectors.py` | `ef8060f16e7bce2416addbf374a373eb65ed2ac3` | 7297 | `6fad2942a36e90a5116f9a54bb11d2c95513865020016c2d972de9de4a970a55` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/gen_key_binding_vectors.py` | `443ade8b74d6dd006b06deb96720471b326ead5c` | 7958 | `a21a3c15f03b3178555c3f37f0460035393348afc2afdfae93bb8c975f0e356c` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/gen_oracle_vectors.py` | `03107731319a6460753ce052cc6c1988f84d3cba` | 18703 | `290cea795e50dcfa9f5ebacaf13f5c3163b5cf759f3d4063555709665e45ce91` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/gen_payload_digest_vectors.py` | `1764a8ca31372abb1ac2ce69d7c3c0641d6ff81f` | 6794 | `9e2b2ec63302f99f94dfdfc19d66c7b3da0e0a476596ee6acbb9e189834b54b8` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/gen_selective_omission_vectors.py` | `37c1b42252b11ec329d6f7d22de21ac92eb38be5` | 8078 | `f0106153c7ebdf29b88a8e86b817e90dfd480661a78a2587a53fe42bd7bec8cc` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/gen_seq_vectors.py` | `acf1f0c2570f2c950d77a5fd75315e70778d3664` | 11279 | `0ce1d1ad0730b8a44d8a48aeaecc1298e4e17a714e23986d446dbfc6a27df282` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/gen_v2_signer_vectors.py` | `ac82b3f7eebb2af2349f4f1b7b9f65ced98c5c0b` | 6757 | `54b4a6b07b157016cb3d9ce315bc6b6ced34d7f142739daa0058bdc4ebaeacda` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/manifest.json` | `1016ec9bac94299691083ad6b210f1ea2b125e49` | 29683 | `6a1abdfca7dd49981dc64fb6a123992244ea61bc11993be3e4044a973fc27960` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/manifest.lock.json` | `0fa374234cb81bf00ba90300a46a9e53124d4c63` | 68512 | `8c2b55a72ae9bbdc6655bc22e473687494ccdc301e60e004add407811754e5a5` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/pipelock-ev2-01-proxy-decision/expected.json` | `608254be6239fe3da0514d01fdc8c84e3e5e998f` | 379 | `c9023914bba62a4bf23e512b401f6af931eb0dfc90d25efd9e4d4f98a91a6bcd` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/pipelock-ev2-01-proxy-decision/keys.json` | `e8a084a115fe9a56ffe1219ce8fd7bb64283ff27` | 97 | `22da44053f7b7129182f1790f76cef42bd626e48a7be38ee1bae66b4a6c838d9` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/pipelock-ev2-01-proxy-decision/receipt.json` | `b8b6763cf273c73c7609a68f7bd8595b2271e664` | 730 | `b0cc553ce93afc1f797c402dc8303d86bf97d06bbc35afe2d910dae26b203289` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/pipelock-ev2-02-tamper-payload/expected.json` | `e16cc1fdae3f8acbfff2e727d2a0eeb1ef254c73` | 273 | `a19aa73082502ad4a484e7f189cd69fa7834dc61b364f576312c0c0716a3016a` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/pipelock-ev2-02-tamper-payload/keys.json` | `e8a084a115fe9a56ffe1219ce8fd7bb64283ff27` | 97 | `22da44053f7b7129182f1790f76cef42bd626e48a7be38ee1bae66b4a6c838d9` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/pipelock-ev2-02-tamper-payload/receipt.json` | `ac77825a693e5b00b6665bfe4e5911421c00341a` | 730 | `9bb3a0d9c98e7f6affa065cd5207f7ef89fb062e4bcf2da5e11f9847f764c866` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/requirement-map.json` | `673402abc26f6496371c0d8a996566fd9036d432` | 60666 | `ddcc1df27c60610081a669ea5e55b61191f457d9b99ba48e9bccdc55c4639cc4` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/w3c-vc-01-didweb-happy-path/did_map.json` | `ca13c5fc3ed5111c9e18679bb5f08f33a20851e1` | 505 | `696b6045b08c96348fe563d15b49a54d2383d68c83ea7ed45aeb93979aac3763` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/w3c-vc-01-didweb-happy-path/expected.json` | `2ab6c9504f1398d2d70120ba89af78484a61961d` | 301 | `a859e48fc1b5d80d5294d966581dd1fa56defd0bbb9b6d66548a9c72c210f027` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/w3c-vc-01-didweb-happy-path/receipt.json` | `02b3ffb8fc20c1bfaa616e80b0facc585e87b7c9` | 903 | `c116216553f9c94b8b2ab08505365b60a9c952b7ae6f5b2a17cb8a356e873a08` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/w3c-vc-02-tamper-subject/did_map.json` | `ca13c5fc3ed5111c9e18679bb5f08f33a20851e1` | 505 | `696b6045b08c96348fe563d15b49a54d2383d68c83ea7ed45aeb93979aac3763` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/w3c-vc-02-tamper-subject/expected.json` | `935db6631c1830e9587c0e266317e48edf6eb34b` | 221 | `6e8b825f03e8004eb25c33c6a48d0994cdfb2e673a530be655e5039ec6c0e584` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/w3c-vc-02-tamper-subject/receipt.json` | `0634237811e735e300a637d157b8fe7f90a04333` | 900 | `9170e637dab18e030a4bc2b714fbb86aeeaaee9df219b468ab91c851056d7f00` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/w3c-vc-03-tamper-proofvalue/did_map.json` | `ca13c5fc3ed5111c9e18679bb5f08f33a20851e1` | 505 | `696b6045b08c96348fe563d15b49a54d2383d68c83ea7ed45aeb93979aac3763` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/w3c-vc-03-tamper-proofvalue/expected.json` | `96b7443447f0d7a6b3313fedcf96ae3a99a467ee` | 226 | `e3b48a3feb74e0b3ad1f3953e28ccecb004a39c500a1f9837a7a6358d542061d` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/w3c-vc-03-tamper-proofvalue/receipt.json` | `7d1599e20a2636e224fac9b1c942a7defbc1169c` | 903 | `63f6061a51366d7b39bfb8dbf1862fbdbb09eb3d3c79b692d193a3fe24d8a9b9` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/w3c-vc-04-wrong-key-injected/did_map.json` | `f60c99aa6276e0f629a8ba178bb411565c73667d` | 505 | `f46792c0bd195d8139cac4ba406face71d8f1dce9195dfc05d75e96035e74819` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/w3c-vc-04-wrong-key-injected/expected.json` | `3ed5a26c0ffb8e0d6274e5a83ec5566593031a2d` | 246 | `cb1929a9a2e99c50366235c1ec328e9bb9ddee011efb512ea45325621b9f1b63` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/w3c-vc-04-wrong-key-injected/receipt.json` | `02b3ffb8fc20c1bfaa616e80b0facc585e87b7c9` | 903 | `c116216553f9c94b8b2ab08505365b60a9c952b7ae6f5b2a17cb8a356e873a08` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/w3c-vc-05-no-did-document/expected.json` | `333ac9d48353ee17c4468b12d07f8e1d494295c2` | 278 | `bfa3c724fb68a3a46d5245aa612a32a7024cfde675e6b0f25d249e53db5aff2c` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/w3c-vc-05-no-did-document/receipt.json` | `02b3ffb8fc20c1bfaa616e80b0facc585e87b7c9` | 903 | `c116216553f9c94b8b2ab08505365b60a9c952b7ae6f5b2a17cb8a356e873a08` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/w3c-vc-06-expired/did_map.json` | `ca13c5fc3ed5111c9e18679bb5f08f33a20851e1` | 505 | `696b6045b08c96348fe563d15b49a54d2383d68c83ea7ed45aeb93979aac3763` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/w3c-vc-06-expired/expected.json` | `f36887d6b2739655382824c8fb55efb3d79f8890` | 234 | `cfa6511ce9c4a684f26b0d480b2ecaedac44f88a3c77fb3ea1a3f6dd6211f18c` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/w3c-vc-06-expired/receipt.json` | `3f63244e7d00b75b31c04ed5e8b4e98f36eb4dea` | 903 | `4952d542d6bc5080b747472dfaa4fa8f2f74445724e64553bdc79115512b5a4c` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/w3c-vc-07-dup-member/expected.json` | `8c7d596150fbeaf9dbb320606478ae8c0296393d` | 279 | `39dedc558c062a68e5c3f50ac9aac8c5661da9217de5c920be7cdba1aa1c8f49` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/w3c-vc-07-dup-member/receipt.json` | `1fd81cdb293cc58dbc97fdfd1e355b5a1a5e5d29` | 1064 | `e6209f19ae938c687533667a45ba3e68292b8f9c15bf1529986af05e76cfde06` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/w3c-vc-08-didkey-happy-path/expected.json` | `fcc2cca92a4313935640d01a9fa6e4738b5a4cd1` | 207 | `f5acecb78db7fb0542ac54ef79be9c7978dc9b54e688189d091962960c9e7c79` |
| `fixtures/asqav/6137cb95/verifier/conformance-vectors/w3c-vc-08-didkey-happy-path/receipt.json` | `d212acc69aa4d3acef6117252abc10ce4168cbd0` | 1005 | `6df9655344e7b87f5fc4a03ae097a6cd556acb7449c0df696dab6d66488e1aa4` |
