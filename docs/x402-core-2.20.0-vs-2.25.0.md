# `@x402/core` 2.20.0 vs 2.25.0 — the schema diff, and whether the served 402 still validates

Recorded 2026-09-08. `@x402/core` and `@x402/fetch` both moved to `2.25.0`; the
`headless-oracle-v5` worker's own compatibility test vendors the payment-requirements
schemas from the **2.20.0** build, so the question this document answers is narrow
and exact: *did anything in the v2 wire shapes change between the version that test
was written against and the version a client installs today, and does the worker's
live 402 still validate under the new one?*

**No change to the worker.** It lives in another repository under another writer.
Anything here that bears on it is a finding for the M5 worker pass, not a fix.

---

## The two builds, and that they are the published ones

`npm pack` in a scratch directory outside this repository:

| version | tarball bytes | our sha256 | our sha1 | registry `dist.shasum` | agree? |
|---|---|---|---|---|---|
| 2.20.0 | 302695 | `076a7f860595d119c65d3cc09ee83fe3bfb9cca7a3a3f0b42e681806df1fcd1d` | `e8e98253f05e1692cd12ddfd607325cf5cd7b15d` | `e8e98253f05e1692cd12ddfd607325cf5cd7b15d` | **yes** |
| 2.25.0 | 404817 | `7e7216e8bd4b8edb4abd052b9e1107842a5a49ef8249c3a2cd062ab98d721576` | `dd3cece7086cab859a2d6c63423173a48834023e` | `dd3cece7086cab859a2d6c63423173a48834023e` | **yes** |

The registry's `integrity` for each, recorded beside our own digests:

```
2.20.0  sha512-BaPPVTZ4LAeYKB0yRMOnuzDGoratyLeYobBMH/leFmRe+al94RQnw/uwuw9Rgsupsywz6JQdHzhm4LsE4snuDg==
2.25.0  sha512-5Ys0XYz3FKutxVKoXC46R/XPT/oaAbuj7ahzrlVHwQxZJPH9u6u91IOh0ztz+7G/zYGsaXR8l3ety205QtEnUw==
```

npm's `shasum` is SHA-1 over the tarball, so **the sha1 column is the comparison that
can disagree**, and it does not: the bytes analysed below are the published bytes.
The sha256 column is ours alone and is what a later session should compare against.
Registry metadata for the record: 2.20.0 `unpackedSize` 1462428 / 70 files, 2.25.0
`unpackedSize` 1854977 / 72 files — the package grew, which is why the schema result
below is worth stating rather than assuming.

## The files that define the shapes, named

`headless-oracle-v5/test/vendor/x402-schemas.mjs` records its own source:

> `package : @x402/core 2.20.0`
> `file    : dist/esm/chunk-N4QXZG2Z.mjs, the schema declarations from`
> `          `var NonEmptyString` up to `var PaymentRequirementsSchema``
> `sha256  : 19c189f7417214b211ee4abdaada531a80e5adc8504d593c172fe1e2ce61c03e`

Both the **runtime zod schemas** and the **TypeScript shapes** were compared:

| what | 2.20.0 | 2.25.0 |
|---|---|---|
| runtime zod schemas | `dist/esm/chunk-N4QXZG2Z.mjs` | `dist/esm/chunk-N4QXZG2Z.mjs` |
| v2 type declarations | `dist/esm/schemas/index.d.mts` | `dist/esm/schemas/index.d.mts` |
| v1 / union / settle types | `dist/esm/x402Client-0g4vl2En.d.mts` | `dist/esm/x402Client-pTJv8yPe.d.mts` |

The chunk file kept its content-hashed name across the two releases, which is already
the answer, and the digest confirms it:

```
2.20.0  dist/esm/chunk-N4QXZG2Z.mjs  5040 bytes  sha256 19c189f7417214b211ee4abdaada531a80e5adc8504d593c172fe1e2ce61c03e
2.25.0  dist/esm/chunk-N4QXZG2Z.mjs  5040 bytes  sha256 19c189f7417214b211ee4abdaada531a80e5adc8504d593c172fe1e2ce61c03e
```

**Byte-identical, and equal to the digest the vendored copy recorded.** `diff` over the
two files produces no output. Every declaration the vendored file copied —
`NonEmptyString`, `Any`, `OptionalAny`, `NetworkSchemaV1`, `NetworkSchemaV2`,
`NetworkSchema`, `PRINTABLE_ASCII_REGEX`, `ResourceInfoSchema`,
`PaymentRequirementsV1Schema`, `PaymentRequiredV1Schema`, `PaymentPayloadV1Schema`,
`PaymentRequirementsV2Schema`, `PaymentRequiredV2Schema`, `PaymentPayloadV2Schema`,
`PaymentRequirementsSchema`, `PaymentRequiredSchema`, `PaymentPayloadSchema` — is the
same at 2.25.0. The vendored file does not need refreshing, and the `To refresh:`
instruction in its header has nothing to do.

## Every added, removed or retyped field

Declaration by declaration, from the `.d.mts` of both builds:

| shape | 2.20.0 → 2.25.0 |
|---|---|
| `PaymentRequirementsV1` | identical |
| `PaymentRequirementsV2` | identical |
| `PaymentRequirements` (union) | identical |
| `PaymentRequiredV1` | identical |
| `PaymentRequiredV2` | identical |
| `PaymentRequired` (union) | identical |
| `PaymentPayloadV1` | identical |
| `PaymentPayloadV2` | identical |
| `PaymentPayload` (union) | identical |
| `SettleRequestV1` / `SettleRequest` | identical |
| `SettleResponseV1` | identical |
| `SettleResponseCoreSnapshot` | identical |
| **`SettleResponse`** | **one field added** |

**Added: 1. Removed: 0. Retyped: 0.**

The single change, in full:

```diff
 type SettleResponse = {
     success: boolean;
     errorReason?: string;
     errorMessage?: string;
     payer?: string;
     transaction: string;
     network: Network;
     /** Actual amount settled in atomic token units. ... */
     amount?: string;
     extensions?: Record<string, unknown>;
+    extensionResponses?: Record<string, unknown>;
     extra?: Record<string, unknown>;
 }
```

`extensionResponses` is **optional**, so the change is additive: a 2.20.0-shaped
settle response is still a valid 2.25.0 `SettleResponse`. It sits beside the existing
`extensions` and is populated by the new `SchemeEnrichSettlementResponseHook` surface
2.25.0 exports; the rest of the growth between the two releases is in the server and
facilitator surfaces (`SettlePhase`, `CompletedSettlement`, `FacilitatorTimeoutError`,
`FacilitatorCapabilityError`, `PAYMENT_REQUIRED_CACHE_CONTROL`,
`withPrivateCacheControl`, `PaymentFlowConfig`), none of which is a wire shape a
resource server's 402 has to satisfy.

**There is no `SettlementResponseSchema`.** `@x402/core` carries no zod schema for the
settle response at either version — the runtime schemas are the three payment shapes
only, and the settlement shape exists as a TypeScript type (`SettleResponse`) plus a
`SettleError` class. So the settle change above is a compile-time contract, not
something a validator can catch at runtime.

## Does the worker's live 402 still validate under 2.25.0?

Run 2026-09-08T09:53:14Z, in a scratch directory with `@x402/core@2.25.0` installed
(zod 3.25.76, the version that build resolves). The schemas are the **installed
package's**, imported from `@x402/core/schemas`, not a transcription:

```
$ curl -H "Payment-Signature: bogus-not-a-signature" \
       https://headlessoracle.com/v5/status?mic=XNYS
HTTP/1.1 402 Payment Required
Content-Type: application/json   Content-Length: 2526
```

No trial cost: the request carries no key and no payment, and the response is the
402 itself. `X-Oracle-Plan: free`.

The worker serves **two** payment-required documents on that response, and both were
validated:

| document | `x402Version` | `PaymentRequiredSchema` (union) | `…V1Schema` | `…V2Schema` |
|---|---|---|---|---|
| response body | 1 | **PASS** | **PASS** | FAIL (4) |
| `Payment-Required-Json` header | 2 | **PASS** | FAIL (4) | **PASS** |

**Both validate under 2.25.0.** The union schema — the one a client actually calls
through `parsePaymentRequired` — accepts both.

### The control, because two PASSes are also what a schema that accepts anything gives

The version-specific schemas were run against the *other* version's document, and
each rejected it with the field-level reasons that make the discrimination real:

```
body (v1) against PaymentRequiredV2Schema:
    x402Version: Invalid literal value, expected 2
    resource: Required
    accepts.0.network: Network must be in CAIP-2 format (e.g., 'eip155:84532')
    accepts.0.amount: Required

header (v2) against PaymentRequiredV1Schema:
    x402Version: Invalid literal value, expected 1
    accepts.0.maxAmountRequired: Required
    accepts.0.resource: Required
    accepts.0.description: Required
```

Those are the inputs that would have turned this check red. The union passing both
is therefore a measurement, not a decoration.

### One observation for the M5 worker pass — not a fix

The **body** is v1-shaped (`x402Version: 1`, `accepts[].maxAmountRequired`,
`network: "base"`, `resource` a string on each accept) while the
**`Payment-Required-Json` header** is v2-shaped (`x402Version: 2`, a top-level
`resource` object, `accepts[].amount`, `network: "eip155:8453"`). Both are valid, and
serving both is a deliberate compatibility choice — but a v2-only client that reads
the *body* rather than the header gets a v1 document, and the two documents describe
the same price in two different member names. That is worth a look in the worker pass;
nothing here changes it, and this document renders no verdict on whether it is wrong.

## What this does not establish

- **It is a schema diff, not a client behaviour test.** Nothing here ran a 2.25.0
  client against the worker, completed a payment, or exercised settlement. It compares
  declarations, and validates one served document against them.
- **The settle change is untested against anything.** `SettleResponse` has no runtime
  schema, the worker's settle path was not exercised, and `extensionResponses` was
  read from a type declaration.
- **One request, one instant.** The 402 above is the response to a single unpaid GET
  at 09:53:14Z on 2026-09-08. It is not a claim about every route, every MIC, or the
  worker's behaviour under load or after a deploy.
- **`2.25.0` is `latest` today only.** `refs/x402-core-dist-tags-2026-09-08.json` and
  its `@x402/fetch` sibling pin `{"latest":"2.25.0"}`, and the daily drift job is what
  will say when that stops being true.
