# Next release — open items

Items accepted for a future release but deliberately not in `0.1.0`. Each entry
states the problem, why it matters, and the fix direction. Entries are removed
when shipped, not amended.

---

## 0.1.1

### 1. The `--json` verdict carries no verifier version

**Problem.** A verdict object identifies its *schema*
(`"schema": "receipt-verify/verdict/0"`) but not the build that produced it.
There is no field an agent can read to learn which version of this tool
computed the result.

**Why it matters.** `coverage.checks_not_evaluated` is build-dependent by
design — it is the field that tells a consumer what a `VALID` verdict does
*not* cover, and its contents change as checks move from `not_implemented` to
`implemented`. Two verdicts, both `VALID`, both `schema/0`, one produced by
`0.1.0` and one by a later build that implements `mldsa65_signature`, are
**not the same claim**. Today an agent archiving verdicts has no way to tell
them apart after the fact, and the schema version does not help: the schema is
stable precisely while the coverage set moves underneath it.

This is a fail-open property in an otherwise fail-closed tool. Every other
unknown here resolves to the restricted state; this one silently resolves to
"assume the coverage set you're holding is current."

**Fix direction.** One change, two payoffs:

1. Derive the version from `package.json` in a single place at build time,
   replacing the four hand-maintained copies that exist today
   (`package.json`, `src/cli.ts` USAGE banner, `src/jwks.ts` user-agent,
   `tools/snapshot.mjs` user-agent). The `0.1.0` preflight caught a drift
   between them by grep; the next one might not.
2. Emit that version on the verdict object alongside `schema` — e.g. a
   `verifier` field — so a `coverage` block is always attributable to the build
   whose manifest defined it.

**Compatibility.** Adding a field to the verdict object is additive and does
not break `schema/0` consumers branching on `verdict`/`reason`. Removing or
renaming one later would; decide the field name once and treat it as stable.

**Provenance.** Found during the `0.1.0` release preflight,
`cc-output/receipt-verify-0.1.0-preflight.md` §10.

---

### 2. `npm publish` can ship a stale or empty `dist/`

**Problem.** `package.json` declares no `prepack`, `prepare`, or
`prepublishOnly` script, and `dist/` is gitignored. `npm publish` therefore
packs whatever happens to be sitting in `dist/` at that instant — it does not
build, and it does not check that anything is there.

**Why it matters.** The failure is silent and it is asymmetric. Publishing from
a tree whose `dist/` is stale ships a package whose behaviour does not match
its own source or its own test suite, and nothing in the publish output says
so. Publishing after a `git clean -xdf`, or from a fresh clone, ships a package
with **no `dist/` at all** — `"files": ["dist", "NOTICE"]` resolves to just
`NOTICE`, `bin` points at a file that does not exist, and the first thing a
consumer sees is a broken binary. In `0.1.0` this was held off by a procedure
note in the release commands. A procedure that has to be remembered is not a
control.

**Fix direction.** Make it structural:

```json
"prepublishOnly": "npm run build && npm test"
```

Publish then cannot proceed unless the build succeeds and the suite is green,
and the `dist/` being packed is the one that build just produced.

**Design notes for whoever implements it.**

- `prepublishOnly` runs on `npm publish` only. It does **not** run on
  `npm pack`, so a preflight that packs by hand still needs an explicit
  `npm run build` first — which is what the `0.1.0` preflight did. If the
  intent is to cover `npm pack` as well, `prepack` is the hook that fires on
  both; the tradeoff is that `prepack` also fires on `npm install <folder>`
  and in some CI paths where running the full suite is unwanted.
- The hook needs devDependencies present at publish time (`tsc`, `vitest`).
  That is true of a normal maintainer machine and false in a
  `--omit=dev` environment; if publishing ever moves to CI, the job must
  install dev deps.
- Consider pairing it with a guard that fails when `dist/cli.js` is absent
  after the build, so a silently-empty `outDir` cannot pass either.

**Provenance.** Hazard identified while writing the `0.1.0` publish runbook;
mitigated procedurally for `0.1.0`, deferred to structural fix here.
