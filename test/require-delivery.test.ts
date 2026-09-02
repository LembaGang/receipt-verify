// `--require-delivery` — the opt-in delivery gate.
//
// Without the flag this tool's exit code answers exactly one question: "did the
// receipt verify". A VALID receipt whose payment settled with nothing committed
// as delivered therefore exits 0, which is the right answer to that question
// and the wrong answer to the one an agent paying for the call is actually
// asking. The flag lets the caller opt into the second question WITHOUT
// changing the published contract for anyone who does not pass it.
//
// The invariant every test here defends: the gate moves the EXIT CODE and never
// the VERDICT. A receipt that verified is VALID whatever policy the caller
// applied to it.

import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { run } from "../src/cli.js";
import { deliveryGate, exitCodeFor, formatResult, jsonResult, invalid, unverifiable, valid } from "../src/verdict.js";
import { DELIVERY, EVIDENCE } from "./helpers.js";

const SYNTH_JWKS = join(DELIVERY, "jwks.json");
const chain = (name: string) => join(DELIVERY, name, "chain.jsonl");
const PILOT = join(DELIVERY, "pilot-exa-contents", "chain.jsonl");
const PILOT_JWKS = join(DELIVERY, "pilot-exa-contents", "jwks.json");

interface Json {
  verdict: string;
  exit_code: number;
  annotations: Record<string, unknown>;
  delivery_gate: { required: boolean; observed: string | null; satisfied: boolean; reason?: string } | null;
}
const parse = (t: string) => JSON.parse(t) as Json;

describe("--require-delivery — the gate decides the exit code", () => {
  it("proven satisfies the gate and still exits 0", async () => {
    const { text, exitCode } = await run([chain("proven"), "--jwks", SYNTH_JWKS, "--require-delivery", "--json"]);
    const o = parse(text);
    expect(o.verdict).toBe("VALID");
    expect(exitCode).toBe(0);
    expect(o.exit_code).toBe(0);
    expect(o.delivery_gate).toEqual({ required: true, observed: "proven", satisfied: true });
  });

  it("unproven fails the gate — exit 1, verdict still VALID", async () => {
    const { text, exitCode } = await run([chain("unproven"), "--jwks", SYNTH_JWKS, "--require-delivery", "--json"]);
    const o = parse(text);
    // The whole point: the receipt is not being called invalid. It verified.
    expect(o.verdict).toBe("VALID");
    expect(exitCode).toBe(1);
    expect(o.exit_code).toBe(1);
    expect(o.delivery_gate?.satisfied).toBe(false);
    expect(o.delivery_gate?.reason).toBe("delivery_unproven");
  });

  it("none fails the gate too — a receipt with no payment claim has proven no delivery", async () => {
    const { text, exitCode } = await run([chain("none"), "--jwks", SYNTH_JWKS, "--require-delivery", "--json"]);
    const o = parse(text);
    expect(o.verdict).toBe("VALID");
    expect(exitCode).toBe(1);
    expect(o.delivery_gate?.reason).toBe("no_payment_claim");
  });

  it("the pilot's mainnet chain passes the gate", async () => {
    const { text, exitCode } = await run([PILOT, "--jwks", PILOT_JWKS, "--require-delivery", "--json"]);
    const o = parse(text);
    expect(o.verdict).toBe("VALID");
    expect(o.annotations["delivery"]).toBe("proven");
    expect(exitCode).toBe(0);
    expect(o.delivery_gate?.satisfied).toBe(true);
  });
});

describe("--require-delivery — the default is untouched", () => {
  // The contract this flag was designed around: existing callers see no change
  // whatsoever. If this fails, the flag was not additive and 0.1.2 is breaking.
  it.each(["proven", "unproven", "none"])(
    "without the flag, %s still exits 0 and carries no gate",
    async (name) => {
      const { text, exitCode } = await run([chain(name), "--jwks", SYNTH_JWKS, "--json"]);
      const o = parse(text);
      expect(o.verdict).toBe("VALID");
      expect(exitCode).toBe(0);
      expect(o.exit_code).toBe(0);
      expect(o.delivery_gate).toBeNull();
    },
  );

  it("delivery_gate is null, not absent — one field to read either way", async () => {
    const { text } = await run([chain("proven"), "--jwks", SYNTH_JWKS, "--json"]);
    expect(JSON.parse(text) as Record<string, unknown>).toHaveProperty("delivery_gate");
  });
});

describe("--require-delivery — it never rescues or condemns a verdict", () => {
  it("a tampered chain is INVALID with or without the flag, and exits 1 either way", async () => {
    const args = [join(EVIDENCE, "vectors", "tampered", "chain.jsonl"), "--jwks", join(EVIDENCE, "jwks.json"), "--json"];
    const plain = parse((await run(args)).text);
    const gated = parse((await run([...args, "--require-delivery"])).text);
    expect(plain.verdict).toBe("INVALID");
    expect(gated.verdict).toBe("INVALID");
    expect(plain.exit_code).toBe(1);
    expect(gated.exit_code).toBe(1);
    // No delivery state was ever established for bytes that failed integrity.
    expect(gated.delivery_gate?.reason).toBe("no_delivery_state");
  });

  it("the flag cannot turn a failing receipt into a passing one", () => {
    // There is deliberately no branch that lowers an exit code. Asserted
    // directly against the function so no CLI path can hide a regression.
    const bad = invalid("f", "signature_invalid", "bad", { kid: "k", origin: "o" });
    const unres = unverifiable("f", "key_unresolvable", "nope");
    for (const r of [bad, unres]) {
      expect(exitCodeFor(r)).toBe(1);
      expect(exitCodeFor(r, { requireDelivery: true })).toBe(1);
    }
  });

  it("a format with no delivery concept fails the gate closed, not open", () => {
    // Asking an ACTA/verification.* receipt to prove x402 delivery is a
    // question it cannot answer. The honest status is 1.
    const r = valid("verification.gate/0.3", "ok", { kid: "k", origin: "o" });
    expect(exitCodeFor(r)).toBe(0);
    expect(exitCodeFor(r, { requireDelivery: true })).toBe(1);
    expect(deliveryGate(r, { requireDelivery: true })?.reason).toBe("no_delivery_state");
    expect(deliveryGate(r, { requireDelivery: true })?.observed).toBeNull();
  });
});

describe("--require-delivery — the output explains a VALID that exited 1", () => {
  it("the human line says the status came from the flag, not from the receipt", async () => {
    const { text } = await run([chain("unproven"), "--jwks", SYNTH_JWKS, "--require-delivery"]);
    expect(text).toContain("delivery gate: NOT SATISFIED");
    expect(text).toContain("delivery_unproven");
    expect(text).toContain("--require-delivery forces exit 1");
    expect(text).toContain("the receipt itself is still VALID");
  });

  it("the annotation disclaimer inverts with the flag, instead of staying a lie", async () => {
    const off = (await run([chain("unproven"), "--jwks", SYNTH_JWKS])).text;
    const on = (await run([chain("unproven"), "--jwks", SYNTH_JWKS, "--require-delivery"])).text;
    // Off: the exit code genuinely ignores delivery, and says so.
    expect(off).toContain("does NOT move the verdict or the exit code");
    // On: that sentence would be false, so it must not appear.
    expect(on).not.toContain("does NOT move the verdict or the exit code");
    expect(on).toContain("gating the EXIT CODE on it");
  });

  it("a satisfied gate is stated too, not left silent", async () => {
    const { text } = await run([chain("proven"), "--jwks", SYNTH_JWKS, "--require-delivery"]);
    expect(text).toContain("delivery gate: SATISFIED");
  });
});

describe("--require-delivery — argument handling", () => {
  it("is listed in --help", async () => {
    const { text } = await run(["--help"]);
    expect(text).toContain("--require-delivery");
  });

  it("takes no value — a following path is still read as the file", async () => {
    const { text, exitCode } = await run(["--require-delivery", chain("proven"), "--jwks", SYNTH_JWKS, "--json"]);
    expect(exitCode).toBe(0);
    expect(parse(text).delivery_gate?.satisfied).toBe(true);
  });

  it("the two output channels agree on the exit code", async () => {
    // The bug this repo already hit once: --json reported exit_code 0 while the
    // process exited non-zero. Re-pinned here for the gated path specifically.
    for (const name of ["proven", "unproven", "none"]) {
      const { text, exitCode } = await run([chain(name), "--jwks", SYNTH_JWKS, "--require-delivery", "--json"]);
      expect(parse(text).exit_code, name).toBe(exitCode);
    }
  });
});

describe("--require-delivery — the raw helpers", () => {
  const KEY = { kid: "k", origin: "o" };
  const withDelivery = (d: string) => valid("evidence.action/0", "ok", KEY, { delivery: d });

  it("deliveryGate is null unless asked for", () => {
    expect(deliveryGate(withDelivery("unproven"))).toBeNull();
    expect(deliveryGate(withDelivery("unproven"), {})).toBeNull();
    expect(deliveryGate(withDelivery("unproven"), { requireDelivery: false })).toBeNull();
    expect(deliveryGate(withDelivery("unproven"), { requireDelivery: true })).not.toBeNull();
  });

  it("only `proven` satisfies it", () => {
    const g = (d: string) => deliveryGate(withDelivery(d), { requireDelivery: true })?.satisfied;
    expect(g("proven")).toBe(true);
    expect(g("unproven")).toBe(false);
    expect(g("none")).toBe(false);
  });

  it("jsonResult and formatResult accept the same options as exitCodeFor", () => {
    const r = withDelivery("unproven");
    expect((JSON.parse(jsonResult(r, { requireDelivery: true })) as Json).exit_code).toBe(1);
    expect(formatResult(r, { requireDelivery: true })).toContain("NOT SATISFIED");
  });
});
