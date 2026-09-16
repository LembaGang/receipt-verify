The day-two paid check, 2026-09-07. THE RUN HAPPENED.

This supersedes preflight/README.txt, which was written earlier the same day when
THROWAWAY_PK was absent from that session and recorded "THE PAID RUN DID NOT
HAPPEN." That file is left byte-for-byte as pinned (its digest is in
preflight/SHA256SUMS.txt) — it is an accurate record of the earlier session, not
of this one.

One paid call, no retry. A stock @x402/fetch 2.20.0 client (rig/client.mjs, no
registerV1), spend guard 1000 atomic units, free trial exhausted first.
X402_URL=https://headlessoracle.com/v5/status?mic=XNYS

  402 -> 200. Settled by tx
  0x94bfba79903d560e54bf0bf79c347d54d057357fb3389ab9dfd76e44d0bdbdd1
  block 51,004,854, 2026-09-07T16:37:35Z, 1000 atomic units of USDC to the
  advertised payTo. Total spend 0.001 USDC.

Files

  runtime-trial-state.*          the 402 taken immediately before the run,
                                 used 3 / limit 3 — proof the paid call measured
                                 the payment path and not a free 200
  client-attempt-1.*             the 402 the client parsed
  paid-402-payment-required.*    that 402's requirements, header-decoded.
                                 sha256 a2a42195… — byte-identical to the
                                 preflight pin and to Monday's recorded digest
  client-attempt-2.*             the paid request and the 200 that answered it
  client-x-payment.b64.txt       the outgoing payment header, WHOLE
  client-x-payment.decoded.json  its decoded payload, WHOLE — this file contains
                                 the payer address, the EIP-3009 nonce and the
                                 authorisation signature. They are redacted in
                                 the report and whole here, deliberately.
  payment-payload.redacted.json  the same object with those three fields elided,
                                 safe to paste
  client-payer-address.txt       the payer, WHOLE (public on chain either way)
  payment-response.*             the settle header and its decode
  paid-receipt.json              the paid 200's body — the signed receipt
  paid-receipt-tampered-feed-state.json
                                 the same receipt with coverage.feed_state
                                 rewritten live -> stale. The falsification
                                 control.
  assert-receipt-fresh.out.txt   verified inside the 60s TTL, un-overridden
  assert-receipt-expired.out.txt the same receipt after expiry: EXPIRED at real
                                 now, valid at now=issued_at
  assert-receipt-tampered.out.txt INVALID_SIGNATURE on the tampered coverage
  chain-lookup-paid.out.txt      the settlement resolved from mainnet.base.org,
                                 USDC Transfer log decoded, plus an absent-hash
                                 control returning null
  metrics-public.json            tests_passing 1298 — identifies which build is
                                 live (see the report's canon-drift note)
  node_modules/@headlessoracle/verify
                                 the SDK the assertion ran against, 1.0.2,
                                 copied here so the exact bytes are pinned

No private key is in this directory, or anywhere under cc-output.
