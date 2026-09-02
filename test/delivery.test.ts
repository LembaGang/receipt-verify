// The x402 delivery state, surfaced through the pinned tool.
//
// Protocol §5 pins receipt-verify as THE recomputation tool and §10 grades on
// ladder step 4, but until now `--json` returned `"annotations": {}` for an
// evidence.action chain — so the delivery state, which decides the grade and
// which lives in the signed bytes this tool already reads, was reachable only
// by running Chirindo's CLI directly. These tests are the falsifiable form of
// "the pinned instrument can now report the grade".
//
// Coverage boundary, stated rather than left to look covered: the fourth
// delivery state — `unproven` for `malformed_payment_ref` — has NO fixture.
// Chain.append refuses a payment ref that is not "sha256:" + 64 hex, so it
// cannot be produced through the recorder's writing API at all; reaching it
// needs a hand-signed record the recorder would refuse to write.

import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { evidenceActionAdapter } from "../src/adapters/evidence-action.js";
import { run } from "../src/cli.js";
import { formatResult } from "../src/verdict.js";
import { DELIVERY, EVIDENCE, read } from "./helpers.js";

const SYNTH_JWKS = join(DELIVERY, "jwks.json");
const chain = (name: string) => join(DELIVERY, name, "chain.jsonl");

// The pilot's real mainnet capture: Exa /contents, session 864b7d23, the chain
// behind the confirmed Delivery Index row. Signed by the study key published in
// the v5 JWKS under its RFC 7638 thumbprint.
const PILOT = join(DELIVERY, "pilot-exa-contents", "chain.jsonl");
const PILOT_JWKS = join(DELIVERY, "pilot-exa-contents", "jwks.json");

describe("delivery — the three states reach the result object", () => {
  it("a payment ref paired with an output commitment is proven", async () => {
    const r = await evidenceActionAdapter.verify(read(chain("proven")), { jwks: SYNTH_JWKS });
    expect(r.verdict).toBe("VALID");
    expect(r.annotations?.["delivery"]).toBe("proven");
    // Nothing offended, so there is no entry to name and no reason to give.
    expect(r.annotations?.["delivery_entry"]).toBeUndefined();
    expect(r.annotations?.["delivery_reason"]).toBeUndefined();
  });

  it("a payment ref with NO output commitment is unproven, and names the entry", async () => {
    const r = await evidenceActionAdapter.verify(read(chain("unproven")), { jwks: SYNTH_JWKS });
    expect(r.verdict).toBe("VALID");
    expect(r.annotations?.["delivery"]).toBe("unproven");
    expect(r.annotations?.["delivery_reason"]).toBe("no_output_commitment");
    expect(r.annotations?.["delivery_entry"]).toBe(0);
  });

  it("no payment claim is none — reported, not omitted", async () => {
    const r = await evidenceActionAdapter.verify(read(chain("none")), { jwks: SYNTH_JWKS });
    expect(r.verdict).toBe("VALID");
    expect(r.annotations?.["delivery"]).toBe("none");
  });

  // The control that makes the three above mean something: the states are
  // distinguished by the fixtures' CONTENT, not by which file was read. All
  // three chains are signed by the same key and differ only in the two fields
  // the projection reads.
  it("the three states are distinct", async () => {
    const seen = await Promise.all(
      ["proven", "unproven", "none"].map(async (n) =>
        (await evidenceActionAdapter.verify(read(chain(n)), { jwks: SYNTH_JWKS })).annotations?.["delivery"],
      ),
    );
    expect(new Set(seen).size).toBe(3);
  });
});

describe("delivery — the pilot's mainnet chain", () => {
  it("the pilot's DELIVERY PROVEN chain reports proven through this tool", async () => {
    const r = await evidenceActionAdapter.verify(read(PILOT), { jwks: PILOT_JWKS });
    expect(r.verdict).toBe("VALID");
    expect(r.annotations?.["delivery"]).toBe("proven");
    expect(r.resolvedKey?.kid).toBe("yxjyYJ6HtT7thhoXpZGi4DptSN_b_d5L1_DTL_3SlyI");
  });

  it("--json carries the delivery field for the pilot chain", async () => {
    const { text, exitCode } = await run([PILOT, "--jwks", PILOT_JWKS, "--json"]);
    const out = JSON.parse(text) as {
      verdict: string;
      annotations: Record<string, unknown>;
      exit_code: number;
    };
    expect(out.verdict).toBe("VALID");
    expect(out.annotations["delivery"]).toBe("proven");
    expect(exitCode).toBe(0);
    expect(out.exit_code).toBe(0);
  });
});

describe("delivery — a chain with no payment claim", () => {
  // The frozen conformance bundle predates x402 entirely, so this is the
  // real-corpus form of the `none` case: not a fixture built to be none, a
  // published vector that simply never made a payment claim.
  it("--json reports none for the frozen `allow` vector, and never omits the field", async () => {
    const { text } = await run([
      join(EVIDENCE, "vectors", "allow", "chain.jsonl"),
      "--jwks",
      join(EVIDENCE, "jwks.json"),
      "--json",
    ]);
    const out = JSON.parse(text) as { verdict: string; annotations: Record<string, unknown> };
    expect(out.verdict).toBe("VALID");
    expect(out.annotations).toHaveProperty("delivery");
    expect(out.annotations["delivery"]).toBe("none");
  });
});

describe("delivery — what the projection refuses to say", () => {
  // Fail-closed. A delivery claim sitting inside bytes that failed their own
  // integrity check is not evidence of a delivery, so it is not reported at
  // all. Reporting it would be the exact "refusal implies the checks behind it
  // passed" inference the tri-state exists to prevent.
  it("a chain that does not verify carries NO delivery annotation", async () => {
    const r = await evidenceActionAdapter.verify(
      read(join(EVIDENCE, "vectors", "tampered", "chain.jsonl")),
      { jwks: join(EVIDENCE, "jwks.json") },
    );
    expect(r.verdict).toBe("INVALID");
    expect(r.annotations?.["delivery"]).toBeUndefined();
  });

  it("an unresolvable key carries NO delivery annotation", async () => {
    const r = await evidenceActionAdapter.verify(read(chain("proven")), {
      jwks: join(EVIDENCE, "jwks.json"), // a real JWKS, but not this chain's key
    });
    expect(r.verdict).toBe("UNVERIFIABLE");
    expect(r.annotations?.["delivery"]).toBeUndefined();
  });
});

describe("delivery — the exit-code divergence is explicit, not implied", () => {
  // Chirindo's CLI exits 1 on VALID + unproven. This tool exits 0, because its
  // exit code answers "did the receipt verify", and the receipt did. That is a
  // deliberate difference and an easy one to misread, so both the human line
  // and this test state it outright: an agent gating on delivery MUST read the
  // field, never the status.
  it("VALID with unproven delivery still exits 0 — the status does not encode delivery", async () => {
    const { text, exitCode } = await run([chain("unproven"), "--jwks", SYNTH_JWKS, "--json"]);
    const out = JSON.parse(text) as { annotations: Record<string, unknown>; exit_code: number };
    expect(out.annotations["delivery"]).toBe("unproven");
    expect(exitCode).toBe(0);
    expect(out.exit_code).toBe(0);
  });

  it("the human line warns that delivery does not move the verdict or exit code", async () => {
    const r = await evidenceActionAdapter.verify(read(chain("unproven")), { jwks: SYNTH_JWKS });
    const line = formatResult(r)
      .split("\n")
      .find((l) => l.startsWith("annotation: delivery="));
    expect(line).toContain("unproven");
    expect(line).toContain("does NOT move the verdict or the exit code");
  });
});
