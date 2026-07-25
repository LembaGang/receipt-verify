# Fixture provenance

Every fixture in this directory (and `refs/`) is a byte-exact snapshot of a
remote or external source. The test suite reads these snapshots and never
fetches at test time — the single exception is the live-JWKS integration test
in `test/live-jwks.test.ts`, which is explicitly marked and skips when offline
or when `RECEIPT_VERIFY_LIVE` is unset.

Regenerate with `node tools/snapshot.mjs`. Table last written 2026-07-25T15:04:44.315Z.

For local-file sources, `retrieved (UTC)` is the source file's mtime — the
corpus is a frozen artifact, so its own timestamp is the meaningful one.

| file | source | retrieved (UTC) | bytes | sha256 |
|---|---|---|---|---|
| `refs/draft-krausz-verification-state-01.txt` | https://www.ietf.org/archive/id/draft-krausz-verification-state-01.txt | 2026-07-25T15:04:25.955Z | 39466 | `22c5ce262bdf4e63ef538a308e7a8455e93c4143b9e1726b7b64720615d516db` |
| `fixtures/verification-state/spec-examples/README.md` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/README.md | 2026-07-25T15:04:27.338Z | 3558 | `c666a834cbc64ff3f1980d89d179a100c627ed3229d446cdf4764947f9b19929` |
| `fixtures/verification-state/spec-examples/package.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/package.json | 2026-07-25T15:04:28.101Z | 526 | `8847d6480422cc52e4a1930c8002e6e0d25657da4dda438c679f44bc53cf356b` |
| `fixtures/verification-state/spec-examples/requirements.txt` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/requirements.txt | 2026-07-25T15:04:28.527Z | 32 | `a0f6fefdcb588bc9745fe45fdaa878d94a626aa7a79af4ae92fe8aee6d8f87f3` |
| `fixtures/verification-state/spec-examples/sample_payload.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/sample_payload.json | 2026-07-25T15:04:28.915Z | 1684 | `516eb4a5e716e738b68ba7e997dc93266cfffcb7bd1da94dbc96e5dc0f441c74` |
| `fixtures/verification-state/spec-examples/sample_receipt_attached_jws.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/sample_receipt_attached_jws.json | 2026-07-25T15:04:29.294Z | 2073 | `2e2293e3795cb7f46da0d1a5e2ec00cf7815b4efd2e0aa11160a894ef5f41605` |
| `fixtures/verification-state/spec-examples/sample_receipt_detached_jws.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/sample_receipt_detached_jws.json | 2026-07-25T15:04:29.677Z | 302 | `e5decaad77ef6b5f14612159d9e3d97497921cf0cb9bdbae9d73a3a9ca44e81a` |
| `fixtures/verification-state/spec-examples/v0.3-composed/README.md` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/README.md | 2026-07-25T15:04:30.058Z | 7656 | `a67f2841939d9c20b11944c944b41c7506b226b3a00954f84a9b80f656f02bfd` |
| `fixtures/verification-state/spec-examples/v0.3-composed/build_fixtures.py` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/build_fixtures.py | 2026-07-25T15:04:30.451Z | 24553 | `62d16500707b2949a257fd7e9fe153481a7418bceddd04c95eb84ef33c858178` |
| `fixtures/verification-state/spec-examples/v0.3-composed/jwks-agentoracle.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/jwks-agentoracle.json | 2026-07-25T15:04:30.862Z | 224 | `3dd489890af45432acd1201797fa6674c6d60478bcf32965db3c2b17a9a37038` |
| `fixtures/verification-state/spec-examples/v0.3-composed/jwks-agenttrust.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/jwks-agenttrust.json | 2026-07-25T15:04:31.269Z | 224 | `ce140b26851015be51dd0b49e56012adc1ac857abb38ead04dffd02a897cfab1` |
| `fixtures/verification-state/spec-examples/v0.3-composed/jwks-presidio.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/jwks-presidio.json | 2026-07-25T15:04:31.679Z | 230 | `80866bfc309856cef1c4f66039a0d002503fa94a7723413ebfe1539d88a7513c` |
| `fixtures/verification-state/spec-examples/v0.3-composed/jws-001.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/jws-001.json | 2026-07-25T15:04:32.089Z | 2089 | `ef23b5218fdc6c2df8455aaadea45c64ac1ab0f987eaffa76f638b58254fab21` |
| `fixtures/verification-state/spec-examples/v0.3-composed/jws-002.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/jws-002.json | 2026-07-25T15:04:32.499Z | 2106 | `5157c05197bed00ea48df2e7d33d3f722b6c5770c3dfd7dca094480fda0a39d9` |
| `fixtures/verification-state/spec-examples/v0.3-composed/jws-003.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/jws-003.json | 2026-07-25T15:04:32.917Z | 2077 | `464023d1637a1817c6f2dcdbffe7fef19b1fd433e96bd72dded3cbfe587def09` |
| `fixtures/verification-state/spec-examples/v0.3-composed/jws-004.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/jws-004.json | 2026-07-25T15:04:33.317Z | 2153 | `fd7933dc1e09d4c323cf93885233b665c38d8d8ad6f753bcb656deacc86762b1` |
| `fixtures/verification-state/spec-examples/v0.3-composed/jws-005.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/jws-005.json | 2026-07-25T15:04:33.728Z | 3048 | `c8f511bb50032113fed9f333f385bdd2184572d21e1aacd8286a9b93915b6649` |
| `fixtures/verification-state/spec-examples/v0.3-composed/jws-006.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/jws-006.json | 2026-07-25T15:04:34.148Z | 3049 | `3deb10caa734345e199c7516bc17960059066727f1fb9f41d2d0dc3b07877cfa` |
| `fixtures/verification-state/spec-examples/v0.3-composed/jws-007.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/jws-007.json | 2026-07-25T15:04:34.546Z | 3018 | `2e5cd624b518acaebceaf19e6381eb39f3f2ad6b04a89773d25b4a214912ba9c` |
| `fixtures/verification-state/spec-examples/v0.3-composed/jws-r01.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/jws-r01.json | 2026-07-25T15:04:34.942Z | 2089 | `a94aecc1cbf4863df82b5ec22c74afde87be3c7a71d1f282f1bdfdc1f55a7dbf` |
| `fixtures/verification-state/spec-examples/v0.3-composed/jws-r02.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/jws-r02.json | 2026-07-25T15:04:35.322Z | 2122 | `325e232a8e97f3a94f1ff911cfea8d5222479bec2653e28bb48ca592d9c3fe72` |
| `fixtures/verification-state/spec-examples/v0.3-composed/jws-r03.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/jws-r03.json | 2026-07-25T15:04:35.707Z | 2076 | `96fc9c61d26470d2b1842342465d8c96a0e710b4f09e329ba34f24aca8f17512` |
| `fixtures/verification-state/spec-examples/v0.3-composed/jws-r04.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/jws-r04.json | 2026-07-25T15:04:36.091Z | 3048 | `3b21f98ecf7969aae520edb4bbde78d74622c9985fcfb1131cd2194ca8f865cc` |
| `fixtures/verification-state/spec-examples/v0.3-composed/payload-001.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/payload-001.json | 2026-07-25T15:04:36.479Z | 1296 | `f6f4486f5b9f00c212d89ce0a69c01f996fe171da6dfd46fbe786f0b6ed390fd` |
| `fixtures/verification-state/spec-examples/v0.3-composed/payload-002.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/payload-002.json | 2026-07-25T15:04:36.851Z | 1309 | `fcdb0dd23a701920bec4a6645a267c5915b78f0643162db9092e97259fee393b` |
| `fixtures/verification-state/spec-examples/v0.3-composed/payload-003.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/payload-003.json | 2026-07-25T15:04:37.313Z | 1287 | `b900dccc5368dc6ef9ee9842b02e391bdcf338e46f1822a49e67fa5ee819ceda` |
| `fixtures/verification-state/spec-examples/v0.3-composed/payload-004.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/payload-004.json | 2026-07-25T15:04:37.760Z | 1348 | `3a020bf94edb480e6025b3e1963b96e16ec74bc288655fa442ce6915173c69a5` |
| `fixtures/verification-state/spec-examples/v0.3-composed/payload-005.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/payload-005.json | 2026-07-25T15:04:38.235Z | 1876 | `c60e0526a75a23b2eb22ada2a66e7af74e13c5145b0fa20f9d29647766f0e6cd` |
| `fixtures/verification-state/spec-examples/v0.3-composed/payload-006.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/payload-006.json | 2026-07-25T15:04:38.643Z | 1877 | `81f879df85694df02c3a5feaf24f00a55114e22e8081787b1060eda64ef35ebb` |
| `fixtures/verification-state/spec-examples/v0.3-composed/payload-007.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/payload-007.json | 2026-07-25T15:04:39.044Z | 1854 | `6e387496a68927fa11d9a66a37aca3ff9abf813634b0951c6b7d7d2114b5cab7` |
| `fixtures/verification-state/spec-examples/v0.3-composed/payload-r01.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/payload-r01.json | 2026-07-25T15:04:39.433Z | 1296 | `b5f6250a8bec5e0dc858b970c84112add56973ce81c2487d2e1bb5097fb29a81` |
| `fixtures/verification-state/spec-examples/v0.3-composed/payload-r02.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/payload-r02.json | 2026-07-25T15:04:39.811Z | 1325 | `3fa44c32991d8078b2619736bb6f1cc306d371b20b2e76dc02991d0cbc099e7e` |
| `fixtures/verification-state/spec-examples/v0.3-composed/payload-r03.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/payload-r03.json | 2026-07-25T15:04:40.193Z | 1286 | `560d444177c8494d7db8316b1c40d68239503568c10620acffa3f2c888f27167` |
| `fixtures/verification-state/spec-examples/v0.3-composed/payload-r04.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/payload-r04.json | 2026-07-25T15:04:40.578Z | 1876 | `69a19ed741e72cd120d2f40305c9b9314c7b87bb68e9aa9ce98f8d8cef2cb9f0` |
| `fixtures/verification-state/spec-examples/v0.3-composed/vectors.json` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/vectors.json | 2026-07-25T15:04:40.960Z | 9063 | `e41f4c766f5427934384f3eefa864ef21fabfeba00767e1803ca871ac600afb2` |
| `fixtures/verification-state/spec-examples/v0.3-composed/verify.mjs` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/verify.mjs | 2026-07-25T15:04:41.407Z | 9594 | `f71c139008a6794455b7621df7e443b787e28bdf6d768ce02344111267c9eb7a` |
| `fixtures/verification-state/spec-examples/v0.3-composed/verify.py` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/v0.3-composed/verify.py | 2026-07-25T15:04:41.816Z | 10927 | `42b5022982a4eb24f7e098da8b3c11857d16ad72ba3ad87beb5e2cc26601beef` |
| `fixtures/verification-state/spec-examples/verify_node.mjs` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/verify_node.mjs | 2026-07-25T15:04:42.227Z | 2831 | `19f7b596fb45d3108797af0580c49d92eb7653565d8255f1aaff1093016219cd` |
| `fixtures/verification-state/spec-examples/verify_python.py` | https://raw.githubusercontent.com/TKCollective/agentoracle-receipt-spec/HEAD/examples/verify_python.py | 2026-07-25T15:04:42.646Z | 3887 | `1c86c15f60e1771ac6ba6f656ad6b96fc91fb6517b49527f5d1530843d7860b2` |
| `fixtures/verification-state/jwks/agentoracle.co.well-known.jwks.json` | https://agentoracle.co/.well-known/jwks.json | 2026-07-25T15:04:43.047Z | 311 | `f352719ad0c6630c0619d72b3c50b8781bd98baa07a42a575d223aaa68de2b92` |
| `fixtures/evidence-action/manifest.json` | file://C:/Users/User/agent-action-receipt-vectors/manifest.json | 2026-06-24T17:59:29.098Z | 9215 | `dad4e77cc5072446832b0b1771de11e2fc14094c6671061366477e60ce214ef3` |
| `fixtures/evidence-action/jwks.json` | file://C:/Users/User/agent-action-receipt-vectors/jwks.json | 2026-06-24T17:59:29.097Z | 212 | `d71d575a00f6baa135c44531f8a3c6950828f2b2d3079595971ad458f14c56ba` |
| `fixtures/evidence-action/SPEC.md` | file://C:/Users/User/agent-action-receipt-vectors/SPEC.md | 2026-06-24T17:59:09.573Z | 20104 | `f1bf619bf900028f2d707ed082f7de4350f2a1ed130099af340c6611d924500d` |
| `fixtures/evidence-action/README.md` | file://C:/Users/User/agent-action-receipt-vectors/README.md | 2026-06-24T17:35:26.468Z | 4316 | `5d54040bfffcf4e6065015ab4e0bcba888661d1bcce5efd15b414925c7927cc7` |
| `fixtures/evidence-action/vectors/allow/chain.jsonl` | file://C:/Users/User/agent-action-receipt-vectors/vectors/allow/chain.jsonl | 2026-06-24T17:59:29.084Z | 849 | `568152aa8b0ff5b311e20dc62ab3471d91f7a6c92eed157aaf432b86dff7f94e` |
| `fixtures/evidence-action/vectors/deny/chain.jsonl` | file://C:/Users/User/agent-action-receipt-vectors/vectors/deny/chain.jsonl | 2026-06-24T17:59:29.085Z | 833 | `1ef886cbc25db826c64dccc7c1d025d663db750ad52b418a437757057b4bc231` |
| `fixtures/evidence-action/vectors/fail-closed/chain.jsonl` | file://C:/Users/User/agent-action-receipt-vectors/vectors/fail-closed/chain.jsonl | 2026-06-24T17:59:29.089Z | 867 | `76528edc3254aa8cf25dc4c13fb54e533e145da11e864ef29e8e8a2190f8d5ea` |
| `fixtures/evidence-action/vectors/tampered/chain.jsonl` | file://C:/Users/User/agent-action-receipt-vectors/vectors/tampered/chain.jsonl | 2026-06-24T17:59:29.091Z | 851 | `63ffa1b68039e82053aead192aee8216db3b7ab71427677a86bd3a3415f1b8f7` |
| `fixtures/evidence-action/vectors/chain-multi/chain.jsonl` | file://C:/Users/User/agent-action-receipt-vectors/vectors/chain-multi/chain.jsonl | 2026-06-24T17:59:29.095Z | 1148 | `d22292ca64876e2db9fa018ac8f3307b7296f3756901c749f2ba1051f5d0d596` |
| `fixtures/evidence-action/vectors/canonicalization-key-order/chain.jsonl` | file://C:/Users/User/agent-action-receipt-vectors/vectors/canonicalization-key-order/chain.jsonl | 2026-06-24T17:59:29.096Z | 643 | `ce4da0ce7f723360bde7e374d916a9d5aeb349c8d4f0677c5becc26ce905733b` |

## Generated here, not snapshotted

These files are produced by `node tools/make-throwaway-fixtures.mjs` and by
hand (the mapping documents). They are not copies of any published artifact.
The signing key is a throwaway whose seed is published in the generator, and
every file it signs carries `test-throwaway` in the key id.

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
| `fixtures/keys/test-throwaway-ed25519.jwks.json` | 561 | `4c4146101fa23c6a7fc4f79420667b40b6862751147aea8a5b2067f575fec7bd` |
| `fixtures/keys/test-throwaway-ed25519.seed.txt` | 382 | `2d5f040fc66defc66f6807f6f7700466b8ab402e5b88abbce4b78e4df858c3fd` |
