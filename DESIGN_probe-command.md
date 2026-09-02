# DESIGN — `receipt-verify probe <url>`

**Status: design only. Not implemented, not shipped, not scheduled.** Written
for the morning session as the input to a build/don't-build decision.

---

## 1. Purpose

A seller points this at **their own endpoint** and reads back what is, and what
is not, verifiable about the thing they already return today.

The register is the mirror, not the pitch. The output of a probe against a
typical endpoint is:

```
verifiable: none
```

...followed by a plain list of what was looked for and not found. That is the
product. A seller who reads "verifiable: none" against their own live service
has learned something about their service; a seller who reads a paragraph about
why receipts matter has learned something about us. Only the first one is worth
a command.

This inverts the adoption ask. "Adopt this SDK" requires the seller to accept a
premise before they can test it. `probe` requires nothing: it runs against what
already exists, and the gap it reports is the seller's gap, stated in the
seller's own terms, before any of our vocabulary is introduced.

**The probe is a diagnostic, not a verdict.** It never verifies anything,
because there is nothing to verify — that is the finding.

---

## 2. Boundary: what a probe is not

This is the section that must survive review, because every failure mode of
this command is a variant of the probe being read as a judgement.

- A probe is **not an endorsement**. It says nothing about the operator, the
  service, or its trustworthiness — same rule as the tri-state contract, one
  step further out.
- A probe produces **no verdict**. It does not return `VALID`, `INVALID`, or
  `UNVERIFIABLE`, and it must not reuse those tokens. A verdict attaches to a
  receipt under a format; a probe has no receipt. Reusing the vocabulary would
  make a probe report look like a verification result to any agent branching on
  `verdict`.
- A probe **stores nothing**. No cache, no history file, no trust store entry.
- A probed URL is **never** added to any trust store, allowlist, or key source,
  automatically or with a prompt. There is no flag that does this.
- A probe result is **not evidence** about the endpoint at any later time. It
  describes one response, at one instant, to one unauthenticated request.

### What it must not do, operationally

| Prohibited | Why |
|---|---|
| Crawl, follow links, or probe discovered sub-paths | One request means one request. A crawler pointed at a stranger's host by a copy-pasted command is an abuse vector, not a diagnostic. |
| Aggressive retry | A single connect/read failure is a reportable outcome, not something to retry until it succeeds. At most one retry on a connection-level error, never on an HTTP status. |
| Persist results anywhere | See above. Nothing on disk. |
| Phone home | No telemetry, no usage ping, no reporting of probed URLs to any host we control. The tool has no network destination other than the URL the operator typed. |
| Follow redirects across origins | A cross-origin redirect silently changes what was probed. Report the redirect; do not follow it. |

One request. One report. Exit.

---

## 3. What it fetches

**Default mode.** Exactly one `GET` to the URL given, with:

- no credentials, no cookies, no `Authorization` header — a probe reads what an
  anonymous caller reads, because that is the surface a receipt would have to be
  verifiable from;
- no payment of any kind;
- a fixed timeout (propose 5s, matching `fetchJwks`);
- redirects followed only within the same origin, to a small bounded depth
  (propose 3), and every hop reported;
- `https` only, same rule and same reason as `--jwks`.

**`--x402` (flagged, off by default).** Sends the request expecting an HTTP
`402 Payment Required` and inspects the challenge, *without paying it*. This
mode still spends no money and holds no keys; it reads the 402 response's
payment metadata and stops. The flag exists because for an x402 seller the 402
challenge is the interesting surface, and it is off by default because a probe
that transacts is no longer a probe.

Explicitly out of scope for the design: any mode that completes a payment.

---

## 4. What it inspects

Four questions, each answerable from one response, each mapping onto a thing a
receipt would supply. The probe reports each as found / not found / malformed —
never as pass / fail.

| # | Question | Looks at | A receipt would supply |
|---|---|---|---|
| 1 | **Is there signature material?** | `Signature` / `Signature-Input` (RFC 9421), any JWS-shaped header or body member, a detached-signature link | A signature over the response, bound to a published key |
| 2 | **Is there key discovery?** | `/.well-known/jwks.json` *declared* by the response (a `jwks_uri` member or link header) — declared, **not** fetched | A `kid` resolving to published, public key material |
| 3 | **Is there a payment reference?** | x402 headers, a payment/settlement identifier in the body, a 402 challenge under `--x402` | A payment reference bound *inside* the signed bytes |
| 4 | **Is the body canonicalisable?** | Content type; whether the bytes parse as JSON and survive an RFC 8785 JCS round-trip; whether byte-identical re-serialization is possible | Deterministic bytes for a signature to cover |

Question 2 deserves a note: the probe reads whether key discovery is **declared**
and does not fetch the declared URI. Fetching it would turn one request into
two and would start resolving a stranger's key material for no verdict. Report
the declaration; stop.

Question 4 is the one with a real answer for most endpoints — plenty of services
return canonicalisable JSON while having none of 1–3. Saying so is the useful
part: it tells a seller the distance to a receipt is shorter than they assumed.

---

## 5. What it prints

The coverage-manifest register, reused deliberately: a flat list of what was
looked for, what was found, and what was not evaluated — with the same rule that
"not found" and "not checked" are different words and never collapse.

```
probe https://api.example.com/v1/quote
  one GET, anonymous, no payment. 2026-08-12T09:14:22Z

verifiable: none

  signature_material      not found    no Signature-Input, no JWS-shaped member
  key_discovery           not found    no jwks_uri declared, no link header
  payment_reference       not found    (x402 challenge not probed — pass --x402)
  body_canonicalisable    yes          application/json, JCS round-trip byte-identical

what a receipt would add
  - the bytes above, signed under a key you publish, so a caller can
    recompute this response instead of trusting it
  - a payment reference sealed inside those signed bytes, so the charge
    and the result are one artifact
  - a key id resolving to your published JWKS, so verification needs
    nothing from you at verify time

this is a probe, not a verdict. it describes one response at one instant.
it says nothing about this endpoint's operator, and nothing is stored.
```

Design constraints on that output:

- **`verifiable: none` is the headline**, and it is the honest one. If signature
  material *is* present, the headline says what was found and immediately says
  the probe did not verify it — a probe that found a signature still has not
  checked it, and must not imply otherwise.
- The "what a receipt would add" block is generated from the *not found* list.
  It is never generic marketing copy; each line corresponds to a specific thing
  the probe specifically did not find. If everything is found, the block is
  empty and the report says so.
- The disclaimer is not a footer to be trimmed. It is part of the report.
- Under `--json`, the same content as a stable object — but see §7, this is the
  open question, not a settled part of the design.

### Exit code

Propose: **`0` whenever the probe completed and produced a report**, regardless
of what it found. `verifiable: none` is a successful probe. Non-zero only when
the probe could not be performed at all (DNS failure, connect timeout, non-https
URL, malformed argument).

This is a deliberate departure from the verify path, and it needs to be argued
rather than assumed. On the verify path, exit non-zero is the fail-closed
default because a caller is deciding whether to *rely* on a receipt. A probe has
nothing to rely on — mapping "found nothing" to a failure exit would make every
honest probe of a typical endpoint indistinguishable from a broken probe. The
fail-closed principle applies to the *report content* (unknown → "not found",
never "assumed present"), not to the exit code.

Whether that argument holds is a session question.

---

## 6. Fail-closed defaults

- Anything not affirmatively observed is reported as **not found**, never as
  absent-therefore-fine and never as assumed-present.
- A member that is present but malformed is reported as **malformed**, which is
  a third state and must not be folded into either "found" or "not found".
- A timeout or truncated read is reported as **not evaluated**, not as "not
  found" — the same distinction `checks_not_evaluated` already draws.
- An unparseable body means questions 1, 3 and 4 report **not evaluated**, not
  "not found".

---

## 7. Open questions for the session

1. **Output schema versioning.** If `probe --json` ships, it needs a schema
   token, and it must not be `receipt-verify/verdict/0` — a probe report is not
   a verdict and must not be parseable as one. This ties directly to the
   `0.1.1` item "the `--json` verdict carries no verifier version"
   (`RELEASE-NOTES-NEXT.md`): a probe report is *entirely* build-dependent in a
   way a verdict is not — what it looks for is exactly the set of things this
   build knows how to look for. A probe report without a verifier version is a
   list of absences with no statement of what was capable of being found, which
   is a worse fail-open than the verdict case. **Recommendation: do not ship
   `probe --json` before the verifier-version field lands.**

2. **May probe results ever be cited publicly? Default: no.** A probe report
   about someone else's endpoint is a claim about their service, produced by our
   tool, from one unauthenticated request. Publishing those is a different
   business with a different risk surface. The default is that probe output is
   for the person who ran it. Open: whether a seller citing *their own* probe
   output is a case worth explicitly blessing, and whether the report should
   carry a line saying which case it is.

3. **Rate and robots etiquette.** One request is well inside anything
   `robots.txt` contemplates, and fetching `robots.txt` to decide whether to
   make one request doubles the request count to answer a question it did not
   need. Current lean: do not fetch `robots.txt`; do send an identifying
   user-agent (`receipt-verify/<version> (+probe)`) so an operator seeing it in
   their logs can identify what it was; do not implement any rate limiter,
   because one-request-and-exit has no rate to limit. Open: whether the
   identifying user-agent is a liability given that probe output is not stored
   and not phoned home — it is the only trace the probe leaves anywhere.

4. **Naming.** `probe` reads as active/intrusive to some ears. `receipt-verify
   inspect <url>` or `... explain <url>` may carry the mirror framing better.
   Low stakes, but it is a public verb and changing it later is a breaking
   change.

5. **Scope creep risk, named now.** Every question in §4 has an obvious "and
   then we could also..." — fetch the JWKS, verify the signature we found, walk
   the chain. Each one turns a probe into a verifier against an endpoint nobody
   asked us to verify. The design holds at one request specifically because that
   line is easy to state and hard to erode.

---

## 8. Relationship to the shipped tool

`probe` shares the JWKS/HTTPS rules and the coverage register, and shares
nothing else. In particular it does not share `verdict.ts` — the tri-state
constructors are the enforcement point for "verdicts attach to receipts under
formats", and a probe has neither a receipt nor a format. A separate report type
is the mechanism that keeps that true.
