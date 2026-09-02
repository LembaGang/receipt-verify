# Fixture provenance

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
