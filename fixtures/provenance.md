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
| `fixtures/acta/published/README.md` | https://raw.githubusercontent.com/ScopeBlind/agent-governance-testvectors/HEAD/README.md | 2026-07-29T10:01:39.121Z | 4965 | `7914288498b3c3bb1342db81f6982b429e3f53ebd5c3250fc2b9645812d98b41` |
| `fixtures/acta/published/spec.md` | https://raw.githubusercontent.com/ScopeBlind/agent-governance-testvectors/HEAD/spec.md | 2026-07-29T10:01:39.693Z | 5703 | `b053460e8ecabd7fc7d3f0a6fe24afaafdc6606d79995306dad314943d537550` |
| `fixtures/acta/published/expected/receipt-schema.json` | https://raw.githubusercontent.com/ScopeBlind/agent-governance-testvectors/HEAD/expected/receipt-schema.json | 2026-07-29T10:01:40.415Z | 3502 | `a1ffe19d87034d61b80dceeb11287a43155daa0613a391ed85b804ace2b0923a` |
| `fixtures/acta/published/expected/chain.jsonl` | https://raw.githubusercontent.com/ScopeBlind/agent-governance-testvectors/HEAD/expected/chain.jsonl | 2026-07-29T10:01:40.865Z | 369 | `446409d03b77aa066863fef8cea850b73b5893b202f5993285c9aa3b4a77efc0` |
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
