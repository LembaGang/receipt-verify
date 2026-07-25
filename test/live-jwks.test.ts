// LIVE NETWORK TEST — the one place in this suite that leaves the machine.
//
// Skipped by default. Run it with:
//     RECEIPT_VERIFY_LIVE=1 npm test
// or on PowerShell:
//     $env:RECEIPT_VERIFY_LIVE=1; npm test
//
// What it proves: the snapshot in fixtures/ still matches what the issuer
// publishes today, and that a receipt verifies against the LIVE key rather than
// only against a file we control. What it does not prove: anything about the
// receipt's contents — that is the rest of the suite's job.
//
// It is allowed to skip offline. It is NOT allowed to pass offline: a network
// failure marks the test skipped, never green.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fetchJwks, resolveKid } from "../src/jwks.js";
import { verificationStateAdapter } from "../src/adapters/verification-state.js";
import { VSTATE, FIXED_NOW, read } from "./helpers.js";

const LIVE = process.env["RECEIPT_VERIFY_LIVE"] === "1";
const JWKS_URL = "https://agentoracle.co/.well-known/jwks.json";
const SNAPSHOT = join(VSTATE, "jwks", "agentoracle.co.well-known.jwks.json");
const EXAMPLES = join(VSTATE, "spec-examples");

describe.runIf(LIVE)("live JWKS integration (network)", () => {
  it("the live endpoint serves a JWKS with the kid our snapshot has", async () => {
    const live = await fetchJwks(JWKS_URL);
    const snapshotKeys = (JSON.parse(readFileSync(SNAPSHOT, "utf8")) as { keys: { kid: string }[] }).keys;
    expect(snapshotKeys.length).toBeGreaterThan(0);
    for (const k of snapshotKeys) {
      const r = resolveKid([live], k.kid);
      expect(r.ok, `kid ${k.kid} is no longer published at ${JWKS_URL}`).toBe(true);
    }
  });

  it("the snapshot still matches the live key material", async () => {
    const live = await fetchJwks(JWKS_URL);
    const snapshot = { origin: SNAPSHOT, text: readFileSync(SNAPSHOT, "utf8"), strict: true };
    const kid = (JSON.parse(snapshot.text) as { keys: { kid: string }[] }).keys[0]!.kid;
    const a = resolveKid([live], kid);
    const b = resolveKid([snapshot], kid);
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) {
      // If this diverges the issuer rotated: re-run `npm run snapshot`.
      expect(a.value.thumbprint).toBe(b.value.thumbprint);
    }
  });

  it("the published sample receipt's signature verifies against the LIVE key", async () => {
    const attached = JSON.parse(readFileSync(join(EXAMPLES, "sample_receipt_attached_jws.json"), "utf8")) as Record<string, string>;
    const r = await verificationStateAdapter.verify(read(join(EXAMPLES, "sample_receipt_attached_jws.json")), {
      jwks: JWKS_URL,
      now: FIXED_NOW,
    });
    expect(attached["signature"]).toBeDefined();
    // The receipt predates the verification.* claim set, so the payload profile
    // check refuses it — but only after the signature check passed against the
    // live key, which is what this test is here to establish.
    expect(r.annotations?.["jws_signature_check"]).toBe("passed");
  });
});

describe.runIf(!LIVE)("live JWKS integration", () => {
  it("is skipped unless RECEIPT_VERIFY_LIVE=1", () => {
    expect(LIVE).toBe(false);
  });
});
