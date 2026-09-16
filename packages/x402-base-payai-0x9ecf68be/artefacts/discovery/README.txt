PayAI chain-side observation, 2026-09-16.

One Base settlement whose submitter is one of the fifteen eip155:* signer
addresses PayAI publishes at /supported, found from PUBLIC CHAIN DATA ONLY and
resolved at height. No 402, no payment payload and no settle answer for it are
held by anyone here, and none is claimed.

  tx        0x9ecf68be92ca279e6e8874f4ff7bb882da7da05fe8de362967be5ab4d4f6f835
  block     51,382,192, 2026-09-16T10:15:31Z
  submitter 0xb2bd29925cbbcea7628279c91945ca5b98bf371b
            = 0xB2Bd29925CBbCEA7628279c91945Ca5B98bf371B, entry 2 of the
              fifteen in payai-facilitator-supported_2026-09-10T1254Z.json
              (sha256 67bfe234984ed0237af2ae281d52907ef9abff7b9d1824fa8284fd225387c072, fetched 2026-09-10T12:54Z)

HOW IT WAS FOUND, so the method is checkable and not just the result. Not an
explorer: eth_getLogs against the USDC contract on Base for topic0
0x98de503528ee59b575ef0c0a2576a82497bfc029a5685b209e9ec333479b10a5, which is
keccak("AuthorizationUsed(address,bytes32)") and is EIP-3009's own event, over
blocks 51,381,946 to 51,382,346 -- a window ending 64 blocks behind the tip at
the time of the read (tip 51,382,410). 881 such logs in that window;
eth_getTransactionByHash on each distinct transaction, newest first, until one
whose `from` is in the published signer set. It was the first window scanned.

FILES

  scan.mjs                        the scanner, exactly as run
  scan-log_2026-09-16T1023Z.json  every JSON-RPC call it made: method, params,
                                  endpoint, time, HTTP status and the sha256 of
                                  each response body
  eth_getLogs_51381946-51382346.json
                                  the discovery response, whole. The scanner
                                  recorded its digest and not its body, so the
                                  identical request was made again at
                                  2026-09-16T10:25:29Z and the body saved: it is
                                  503684 bytes at sha256 dda4b1bfc015983d055aee-
                                  993178f2b73f8f1321286daf5004abec68e962d965,
                                  which is byte for byte the digest the scan log
                                  recorded at 10:22:49Z. Two reads three minutes
                                  apart of a settled range returning the same
                                  bytes is the check; had they differed, this
                                  file would say so and the finding would be the
                                  difference.
  eth_getTransactionByHash_0x9ecf68be.json
                                  the sender lookup that decided the match,
                                  whole; sha256 9cfac5b13ed377e9bb864160ad8cf21d-
                                  6c4e4791a5a66eeee2151b40751a4d6e, the same
                                  digest the chain read below recorded for the
                                  same call
  chain-read_2026-09-16T1024Z.json  the transaction resolved from TWO endpoints
                                  (https://mainnet.base.org and
                                  https://base.gateway.tenderly.co), each
                                  answer whole, with read times and per-response
                                  digests, and whether they agree. They agree.
  envelope_2026-09-16.json        the x402.settlement/2 envelope built from that
                                  read: the three artefacts null, the chain data
                                  and the fifteen published submitter addresses
                                  filled in
  SHA256SUMS.txt                  every file in this directory

WHAT THIS IS NOT. It is not a registry entry (B-95) and it is not a grading of
PayAI. It is an observation: a courtesy artefact showing what a third party can
establish about a settlement from public bytes, and, more to the point, where
that stops. The package in receipt-verify at packages/x402-base-payai-0x9ecf68be
carries the verdict and the statement.

No private key, and no credential of any kind, is in this directory.
