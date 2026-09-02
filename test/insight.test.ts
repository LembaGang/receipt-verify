// Format 4: insight.attestation/eip712.
//
// This file exists to answer one question: does an EIP-712 implementation
// written HERE, from the EIP text, agree with an independent recomputation of
// the same package made elsewhere in a different language?
//
// The literals asserted under "independent agreement" come from the Lead's
// 2026-09-02 verification note, produced in Python with eth-account 0.14.0.
// src/adapters/insight.ts was written and run BEFORE those literals were
// compared against it. That ordering is the whole point: an agreement between
// two implementations is evidence only when the second did not derive its
// answers from the first, and a test that pinned values copied out of the
// implementation under test would be a check that cannot fail.
//
// What would turn these red: any change to encodeType, encodeData, hashStruct,
// domainSeparator or the 0x1901 construction. Each of the four digests below is
// a 32-byte value with no slack in it, and the two tamper controls assert the
// recovered address MOVES to a specific different address, so a recovery that
// silently returned the attester whatever the bytes said would fail too.
//
// The registry divergence recorded in fixtures/provenance.md is asserted here
// as it stands in the PINNED bytes, not as the verification note describes it.
// See "registry schema" below.

import { describe, expect, it } from "vitest";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { insightAdapter, detect, eip712Digest, extraDomainKeys, findDuplicateKey, recoverAddress, FORMAT } from "../src/adapters/insight.js";
import { evidenceActionAdapter } from "../src/adapters/evidence-action.js";
import { verificationStateAdapter } from "../src/adapters/verification-state.js";
import { actaAdapter } from "../src/adapters/acta.js";
import { detectFormat } from "../src/detect.js";
import type { VerifyOptions, VerifyResult } from "../src/types.js";
import {
  FIX,
  INSIGHT_NOW,
  INSIGHT_PKG,
  INSIGHT_PKG_V3,
  INSIGHT_REGISTRY,
  INSIGHT_REGISTRY_1154,
  INSIGHT_V3_NOW,
  read,
  sha256Hex,
} from "./helpers.js";

const PKG_BYTES = read(INSIGHT_PKG);
const REG_BYTES = read(INSIGHT_REGISTRY);
const pkg = JSON.parse(PKG_BYTES.toString("utf8")) as Record<string, any>;

const V3_BYTES = read(INSIGHT_PKG_V3);
const REG_1154_BYTES = read(INSIGHT_REGISTRY_1154);
const v3 = JSON.parse(V3_BYTES.toString("utf8")) as Record<string, any>;

const ATTESTER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

const base: VerifyOptions = {
  registry: REG_BYTES,
  registryOrigin: "refs/insight-oracle-keys-2026-09-02.json",
  now: INSIGHT_NOW,
  allowUnregisteredSigner: true,
};

/** The repaired package against the 11:54Z registry pin. */
const v3base: VerifyOptions = {
  registry: REG_1154_BYTES,
  registryOrigin: "refs/insight-oracle-keys-2026-09-02T1154Z.json",
  now: INSIGHT_V3_NOW,
  allowUnregisteredSigner: true,
};

const bytesOf = (v: unknown): Buffer => Buffer.from(JSON.stringify(v), "utf8");
const verify = (v: unknown, extra: Partial<VerifyOptions> = {}): Promise<VerifyResult> =>
  insightAdapter.verify(bytesOf(v), { ...base, ...extra });
const verifyV3 = (v: unknown, extra: Partial<VerifyOptions> = {}): Promise<VerifyResult> =>
  insightAdapter.verify(bytesOf(v), { ...v3base, ...extra });
/** A deep copy, so a mutation in one test cannot leak into another. */
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

// --------------------------------------------------------------------------

describe("insight — snapshot integrity", () => {
  // Every literal in this file is a statement about these exact bytes. Pin them,
  // or the assertions below are about whatever happens to be on disk.
  it("the package is the 25,151 bytes the verification note recomputed", () => {
    expect(PKG_BYTES.length).toBe(25151);
    expect(sha256Hex(PKG_BYTES)).toBe("b96ff0b3ec923b77a38553a00f44b9e6949683b6503cfcc13589071b806854ba");
  });

  it("the registry ref is the single fetch of 2026-09-02T09:09Z", () => {
    expect(REG_BYTES.length).toBe(9482);
    expect(sha256Hex(REG_BYTES)).toBe("9269529e7f584ddd54d8ea0210af9820ee082b968492fcbb25b798fab7a88006");
  });

  it("the registry's published keys are byte-equal to the package's copy", () => {
    const live = JSON.parse(REG_BYTES.toString("utf8")) as Record<string, unknown>;
    expect(live["public_keys"]).toEqual(pkg["publishedKeys"]["publicKeys"]);
  });
});

// --------------------------------------------------------------------------
// The point of the exercise.
// --------------------------------------------------------------------------

describe("insight — independent agreement with the Lead's Python recomputation", () => {
  const artefacts = [
    ["sourceGate", pkg["preTrade"]["sourceGate"], "0xdfe67172a95cd4f4bbe864ce64859ce4b44e4bddba8f3e700d1aca169b88eccc"],
    ["destinationGate", pkg["preTrade"]["destinationGate"], "0xb373b1c29680914ad73e408a04b99ecff6db7ce7c85ecbf7d73f29d535dbd0bf"],
    ["receipt", pkg["receipt"], "0x99b65afda1a94186b9bcceb7b0e700ff8c8be7312e50abe4c529d7e7bad14cc6"],
  ] as const;

  it.each(artefacts)("%s: our EIP-712 digest equals the artefact's uid, and equals the Lead's value", (_n, a, expected) => {
    const d = `0x${Buffer.from(eip712Digest(a.eip712.domain, a.eip712.primaryType, a.eip712.types, a.data)).toString("hex")}`;
    expect(d).toBe(expected);
    expect(d.toLowerCase()).toBe(String(a.uid).toLowerCase());
  });

  it.each(artefacts)("%s: recovery over that digest returns the stated attester", (_n, a) => {
    const d = eip712Digest(a.eip712.domain, a.eip712.primaryType, a.eip712.types, a.data);
    expect(recoverAddress(d, a.signature)?.toLowerCase()).toBe(ATTESTER.toLowerCase());
  });

  // A6: requestHash is not merely equal in the two documents, it is the digest
  // of the canonical request. Recomputed from the gate's own published type.
  it("requestHash recomputes to the Lead's value from the canonical pre-trade request", () => {
    const g = pkg["preTrade"]["sourceGate"];
    const rh = `0x${Buffer.from(
      eip712Digest(g.eip712.canonicalRequestDomain, g.eip712.canonicalRequestPrimaryType, g.eip712.canonicalRequestTypes, {
        subjectChainId: g.data.subjectChainId,
        sourceAssetId: g.data.sourceAssetId,
        destinationAssetId: g.data.destinationAssetId,
        action: g.data.action,
        tradeAmountUsd: g.data.tradeAmountUsd,
      }),
    ).toString("hex")}`;
    expect(rh).toBe("0x7abfc1bbdbbf303c0dcb13e44565477801702c5c991fa18fe32cb1176daabe24");
    expect(rh).toBe(g.data.requestHash);
    expect(rh).toBe(pkg["receipt"].data.requestHash);
  });

  // A4, driven red two ways. The assertion is not "recovery fails" — it is that
  // recovery lands on a SPECIFIC other address, which no implementation that
  // shortcut the digest could reproduce.
  it("a one-unit change to executedPrice moves the recovered address to 0x20C50bBF…", async () => {
    const a = clone(pkg["receipt"]);
    a.data.executedPrice = a.data.executedPrice + 1;
    const d = eip712Digest(a.eip712.domain, a.eip712.primaryType, a.eip712.types, a.data);
    expect(recoverAddress(d, a.signature)).toBe("0x20c50bbf9eff102cf297de9161d10d18a3e5fdec");
  });

  it("flipping executionStatus to DEVIATED moves it to 0xd6d1CE3E…", () => {
    const a = clone(pkg["receipt"]);
    a.data.executionStatus = "DEVIATED";
    const d = eip712Digest(a.eip712.domain, a.eip712.primaryType, a.eip712.types, a.data);
    expect(recoverAddress(d, a.signature)).toBe("0xd6d1ce3eeac4cbbbe581d10adf9c2de9e50e4919");
  });

  it("the pool fill, its delta and the beneficiary numbers all reproduce", async () => {
    const r = await verify(pkg);
    expect(r.verdict).toBe("VALID");
    const a = r.annotations!;
    expect(a["pool_price"]).toBe(2418.547246950518);
    expect(a["receipt_executed_price"]).toBe(2418.54724695);
    // Exact, from the integer log amounts, so no float-ordering slack: the
    // package's own independentExpectedDeltaBps is -5.9684217778…, which differs
    // from the exact ratio in its eighth decimal. Both are -5.968 bps.
    expect(String(a["delta_bps"])).toBe("-5.968421");
    expect(a["swap_status_under_signed_max"]).toBe("FAITHFUL under maxSlippageBps 100");

    expect(a["recipient_net_bought"]).toBe(0);
    expect(a["recipient_net_sold"]).toBe(-8.69);
    expect(a["beneficiary"]).toBe("0x70d06bcb8f43109f5c4c466e1241a79c420c8f67");
    expect(a["beneficiary_received"]).toBe(20838.529584);
    expect(a["third_party"]).toBe("0x2cffed5d56eb6a17662756ca0fdf350e732c9818");
    expect(a["third_party_received"]).toBe(178.645992);
    expect(a["third_party_share_pct"]).toBe(0.85);
    expect(a["realised_price_to_beneficiary"]).toBe(2397.989595397008);
    expect(String(a["realised_delta_bps"])).toBe("-90.917690");
    expect(a["realised_vs_receipt"]).toBe("DEVIATED under registry default 50, FAITHFUL under signed 100");
    expect(a["fee_not_recorded"]).toBe(true);
  });
});

// --------------------------------------------------------------------------

describe("insight — the package as sent", () => {
  it("is VALID with --allow-unregistered-signer, and says the signer is unpublished", async () => {
    const r = await verify(pkg);
    expect(r.verdict).toBe("VALID");
    expect(r.reason).toBe("verified");
    expect(r.annotations?.["identity"]).toBe("signer_not_in_registry");
    // The key line must never imply a published key resolved when none did.
    expect(r.resolvedKey?.origin).toContain("NOT a published registry entry");
  });

  it("is UNVERIFIABLE/key_unresolvable without the flag, and names no key", async () => {
    const r = await insightAdapter.verify(PKG_BYTES, { ...base, allowUnregisteredSigner: false });
    expect(r.verdict).toBe("UNVERIFIABLE");
    expect(r.reason).toBe("key_unresolvable");
    expect(r.resolvedKey).toBeUndefined();
    expect(r.stoppedAt).toBe("identity");
  });

  it("binds the receipt to the source gate and reports the destination gate as unbound", async () => {
    const r = await verify(pkg);
    expect(r.annotations?.["binding"]).toContain("all equal");
    expect(r.annotations?.["request_hash_matches_canonical_request"]).toBe(true);
    expect(String(r.annotations?.["unbound_gates"])).toContain("[destination]");
  });

  it("declares precedence and observations as not checked, ON A VALID RESULT", async () => {
    const r = await verify(pkg);
    expect(r.verdict).toBe("VALID");
    expect(String(r.annotations?.["precedence"])).toContain("not_checked");
    expect(String(r.annotations?.["observations"])).toContain("not_checked");
  });

  it("says chain: not_checked when no rpc is supplied", async () => {
    const r = await verify(pkg);
    expect(r.annotations?.["chain"]).toBe("not_checked (no rpc)");
  });
});

// --------------------------------------------------------------------------

describe("insight — registry schema comparison", () => {
  // B6: the gates declare schemaVersion 3 / 27 fields; the registry publishes
  // OracleSafetyCheck at 2 / 26. A stranger building the struct from the
  // registry recovers a different address.
  it("reports the gates as a mismatch against the published OracleSafetyCheck", async () => {
    const r = await verify(pkg);
    expect(r.annotations?.["source_gate_registry_schema"]).toBe(
      "mismatch (schemaVersion 3 vs 2; 27 vs 26 fields; requiredSourceGroupCount not in registry)",
    );
    expect(r.annotations?.["destination_gate_registry_schema"]).toBe(
      "mismatch (schemaVersion 3 vs 2; 27 vs 26 fields; requiredSourceGroupCount not in registry)",
    );
    expect(r.annotations?.["source_gate_registry_domain_version"]).toBe("3 vs 2");
  });

  // The receipt's own declared type IS the 32-field list the verification note
  // records, and that is asserted here.
  it("the receipt declares the 32-field ExecutionReceipt the note recomputed", () => {
    const names = (pkg["receipt"].eip712.types.ExecutionReceipt as { name: string }[]).map((f) => f.name);
    expect(names).toHaveLength(32);
    expect(names[0]).toBe("bindingMode");
    expect(names[names.length - 1]).toBe("schemaVersion");
    expect(names).toContain("executionStatus");
    expect(names).toContain("oracleDataAgeAtExecSeconds");
  });

  // The registry pin this assertion is made against has MOVED, and that is the
  // point of the assertion.
  //
  // At 09:09Z (`refs/insight-oracle-keys-2026-09-02.json`, still pinned and
  // still used by every test above) `ExecutionReceipt` was 43 fields published
  // under an unchanged `schemaVersion` **1**, with no V1 or V2 entry beside it —
  // a 43-field v3 type wearing the v1 number, which is a silent breaking change
  // to a published type. The author has since confirmed that as the regression
  // and corrected it. At 11:54Z the same 43 fields are published under
  // `schemaVersion` 3, with `ExecutionReceiptV2` (32) and `ExecutionReceiptV1`
  // (30) retained beside them and marked `retiredForSigning`.
  //
  // The assertion is re-pointed at the corrected pin so it now guards the fixed
  // state; both pins stay in refs/ so the correction is visible in bytes.
  // See fixtures/provenance.md, "Appended 2026-09-02" and "Appended 2026-09-03".
  it("the 11:54Z registry pin publishes the 43-field ExecutionReceipt under schemaVersion 3, with v2 and v1 retired", () => {
    const live = JSON.parse(REG_1154_BYTES.toString("utf8")) as any;
    const er = live.schemas.ExecutionReceipt;
    expect(er.schemaVersion).toBe(3);
    expect(er.eip712.types.ExecutionReceipt).toHaveLength(43);
    expect(er.eip712.domain).toEqual({ name: "Insight Execution", version: "1", chainId: 1, environment: "production" });
    expect(live.schemas.ExecutionReceiptV2.schemaVersion).toBe(2);
    expect(live.schemas.ExecutionReceiptV2.retiredForSigning).toBe(true);
    expect(live.schemas.ExecutionReceiptV2.eip712.types.ExecutionReceipt).toHaveLength(32);
    expect(live.schemas.ExecutionReceiptV1.schemaVersion).toBe(1);
    expect(live.schemas.ExecutionReceiptV1.retiredForSigning).toBe(true);
    expect(live.schemas.ExecutionReceiptV1.eip712.types.ExecutionReceipt).toHaveLength(30);

    // The state this test used to assert, kept so the regression is named and
    // not merely gone: 43 fields under schemaVersion 1, no retired entries.
    const before = JSON.parse(REG_BYTES.toString("utf8")) as any;
    expect(before.schemas.ExecutionReceipt.schemaVersion).toBe(1);
    expect(before.schemas.ExecutionReceipt.eip712.types.ExecutionReceipt).toHaveLength(43);
    expect(before.schemas.ExecutionReceiptV2).toBeUndefined();
  });

  it("so the receipt is reported as a mismatch against the registry too, and it is not a verdict", async () => {
    const r = await verify(pkg);
    expect(r.annotations?.["registry_schema"]).toBe(
      "mismatch (schemaVersion 2 vs 1; 32 vs 43 fields; executionStatus, oracleDataAgeAtExecSeconds not in registry)",
    );
    expect(r.verdict).toBe("VALID");
  });
});

// --------------------------------------------------------------------------
// Tamper controls. Generated at test time; no mutated copy is committed.
// --------------------------------------------------------------------------

describe("insight — tamper", () => {
  it("executedPrice + 1 is INVALID/signature_invalid", async () => {
    const p = clone(pkg);
    p["receipt"].data.executedPrice = p["receipt"].data.executedPrice + 1;
    const r = await verify(p);
    expect(r.verdict).toBe("INVALID");
    expect(r.reason).toBe("signature_invalid");
    expect(r.stoppedAt).toBe("signature");
    expect(r.detail).toContain("0x20c50bbf");
    // Editing a signed field breaks the uid comparison too. The signature is the
    // reported fault because it is the root one; the symptom is still named,
    // in the detail, because an INVALID carries no annotations by contract.
    expect(r.detail).toContain("uid no longer equals the digest");
  });

  it("executionStatus = DEVIATED is INVALID/signature_invalid", async () => {
    const p = clone(pkg);
    p["receipt"].data.executionStatus = "DEVIATED";
    const r = await verify(p);
    expect(r.verdict).toBe("INVALID");
    expect(r.reason).toBe("signature_invalid");
    expect(r.detail).toContain("0xd6d1ce3e");
  });

  it("an altered gate uid is INVALID/malformed_member, because uid is no longer the digest", async () => {
    const p = clone(pkg);
    p["preTrade"].sourceGate.uid = `0x${"0".repeat(63)}1`;
    const r = await verify(p);
    expect(r.verdict).toBe("INVALID");
    expect(r.reason).toBe("malformed_member");
    expect(r.stoppedAt).toBe("digest");
    expect(r.detail).toContain("0xdfe67172a95cd4f4bbe864ce64859ce4b44e4bddba8f3e700d1aca169b88eccc");
  });

  it("evaluated after validUntil, the receipt is INVALID/expired with the window in the detail", async () => {
    const validUntil = pkg["receipt"].data.validUntil as number;
    const r = await verify(pkg, { now: validUntil + 1 });
    expect(r.verdict).toBe("INVALID");
    expect(r.reason).toBe("expired");
    expect(r.stoppedAt).toBe("freshness");
    expect(r.detail).toContain(String(validUntil));
    // The header must not call a closed validity window a key-binding failure.
    const { formatResult } = await import("../src/verdict.js");
    expect(formatResult(r)).toContain("INVALID — validity window");
  });

  it("a bit-flip anywhere in a signed member moves the verdict off VALID", async () => {
    const p = clone(pkg);
    p["receipt"].data.blockNumber = (p["receipt"].data.blockNumber as number) + 1;
    const r = await verify(p);
    expect(r.verdict).not.toBe("VALID");
  });
});

// --------------------------------------------------------------------------

describe("insight — duplicate member names are refused before any value is read", () => {
  it("the minimal case is UNVERIFIABLE/malformed_member", async () => {
    const r = await insightAdapter.verify(Buffer.from('{"a":1,"a":2}', "utf8"), base);
    expect(r.verdict).toBe("UNVERIFIABLE");
    expect(r.reason).toBe("malformed_member");
    expect(r.stoppedAt).toBe("parse");
    // "never a value": nothing was read out of the document, so there are no
    // annotations and no resolved key on the result at all.
    expect(r.annotations).toBeUndefined();
    expect(r.resolvedKey).toBeUndefined();
  });

  it("a duplicated member inside the real package is refused, not silently last-wins", async () => {
    // JSON.parse would keep the SECOND executionStatus and report a receipt that
    // says DEVIATED while its signature covers FAITHFUL. This is the case the
    // check exists for, so it is asserted on the real bytes.
    const text = PKG_BYTES.toString("utf8").replace(
      '"executionStatus": "FAITHFUL"',
      '"executionStatus": "FAITHFUL", "executionStatus": "DEVIATED"',
    );
    expect(text).not.toBe(PKG_BYTES.toString("utf8"));
    const r = await insightAdapter.verify(Buffer.from(text, "utf8"), base);
    expect(r.verdict).toBe("UNVERIFIABLE");
    expect(r.reason).toBe("malformed_member");
    expect(r.detail).toContain("executionStatus");
    // The value JSON.parse would have kept must appear nowhere in the result.
    expect(JSON.stringify(r)).not.toContain("DEVIATED");
  });

  it("the scanner finds duplicates at depth and does not cry wolf across sibling objects", () => {
    expect(findDuplicateKey('{"a":1,"a":2}')).toBe("a");
    expect(findDuplicateKey('{"a":1,"b":{"c":1,"c":2}}')).toBe("$.b.c");
    // The same key in two DIFFERENT objects of an array is not a duplicate.
    expect(findDuplicateKey('{"a":[{"x":1},{"x":2}]}')).toBeNull();
    expect(findDuplicateKey('{"a":"has \\" a quote","b":1}')).toBeNull();
    // A brace inside a string must not be read as structure.
    expect(findDuplicateKey('{"a":"{\\"x\\":1}","x":1}')).toBeNull();
  });
});

// --------------------------------------------------------------------------

describe("insight — detection", () => {
  const everyFixture: string[] = [];
  const walk = (dir: string): void => {
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) walk(p);
      else everyFixture.push(p);
    }
  };
  walk(FIX);

  const insightFixtures = everyFixture.filter((p) => p.includes(`${join("fixtures", "insight")}`));
  const otherFixtures = everyFixture.filter((p) => !p.includes(`${join("fixtures", "insight")}`));

  it("claims the package and each of its three artefacts", () => {
    expect(detect(PKG_BYTES)).toBe(true);
    expect(detect(bytesOf(pkg["receipt"]))).toBe(true);
    expect(detect(bytesOf(pkg["preTrade"]["sourceGate"]))).toBe(true);
    expect(detect(bytesOf(pkg["preTrade"]["destinationGate"]))).toBe(true);
  });

  it("claims ZERO of the fixtures that existed before this adapter", () => {
    expect(otherFixtures.length).toBeGreaterThan(50);
    const claimed = otherFixtures.filter((p) => detect(read(p)));
    expect(claimed).toEqual([]);
  });

  it("no pre-existing adapter claims the package or its artefacts", () => {
    const candidates = [PKG_BYTES, bytesOf(pkg["receipt"]), bytesOf(pkg["preTrade"]["sourceGate"])];
    for (const a of [evidenceActionAdapter, verificationStateAdapter, actaAdapter]) {
      for (const b of candidates) expect(a.detect?.(b) ?? false).toBe(false);
    }
  });

  it("auto-detects to exactly one adapter, with no ambiguity against the other three", () => {
    const d = detectFormat(PKG_BYTES);
    expect(d.ok).toBe(true);
    if (d.ok) expect(d.adapter.format).toBe(FORMAT);
  });

  it("refuses shapes that are not this format", () => {
    expect(detect(Buffer.from("not json", "utf8"))).toBe(false);
    expect(detect(Buffer.from("[]", "utf8"))).toBe(false);
    expect(detect(Buffer.from('{"payload":{},"signature":{"alg":"EdDSA","kid":"k","sig":"00"}}', "utf8"))).toBe(false);
    // An attester without an eip712 block is not enough to claim.
    expect(detect(Buffer.from(`{"attester":"${ATTESTER}","signature":"0x${"1".repeat(130)}","data":{}}`, "utf8"))).toBe(false);
    expect(insightFixtures.length).toBe(2);
  });
});

// --------------------------------------------------------------------------

describe("insight — a single attestation, outside its package", () => {
  it("verifies on its own and says which checks that leaves unrun", async () => {
    const r = await verify(pkg["preTrade"]["sourceGate"]);
    expect(r.verdict).toBe("VALID");
    expect(r.annotations?.["uid_equals_digest"]).toBe(true);
    expect(String(r.annotations?.["precedence"])).toContain("not_checked");
  });
});

// --------------------------------------------------------------------------
// The repaired package, schema v3 (09:53Z).
//
// Same discipline as the block above: every literal here comes from the Lead's
// second Python recheck (`VERIFICATION_NOTE_2026-09-02_insight-execution-
// receipt-v3-recheck.md`, eth-account 0.14.0 plus a hand-written EIP-712
// encoder), and the TypeScript path is the one written from the EIP text in
// 076a87c. The only new encoding here is the extra-domain-field separator, and
// it is driven red by a second address rather than merely by "does not recover".
// --------------------------------------------------------------------------

describe("insight v3 — snapshot integrity", () => {
  it("the repaired package is the 39,871 bytes the recheck recomputed", () => {
    expect(V3_BYTES.length).toBe(39871);
    expect(sha256Hex(V3_BYTES)).toBe("e4a11b4de20a4dfdfdbaee29dadc1f7126b0b36c130bf6ba3c6a7ff5578eb89a");
  });

  it("the second registry ref is the single fetch of 2026-09-02T11:54Z", () => {
    expect(REG_1154_BYTES.length).toBe(14854);
    expect(sha256Hex(REG_1154_BYTES)).toBe("21675e382e6ead969d3b3fb823b3199327283152ab241be27d9c5b7177de23eb");
  });

  it("the package is schema v3, 43 signed fields, and carries all three layouts", () => {
    expect(v3["meta"].schemaVersion).toBe(3);
    expect(v3["meta"].signedFieldCount).toBe(43);
    expect(v3["receipt"].data.schemaVersion).toBe(3);
    expect(Object.keys(v3["receipt"].data)).toHaveLength(43);
    expect(v3["schemas"].v1.signedFieldCount).toBe(30);
    expect(v3["schemas"].v2.signedFieldCount).toBe(32);
    expect(v3["schemas"].v3.signedFieldCount).toBe(43);
  });
});

describe("insight v3 — independent agreement with the Lead's recheck", () => {
  const artefacts = [
    ["sourceGate", v3["preTrade"]["sourceGate"], "0xb60690e018b02ea58e60ac452d9e2b3ccc5c831e69845243e494467e25d07780"],
    ["destinationGate", v3["preTrade"]["destinationGate"], "0x9f621b333368ceecbc5cee8afa5f594b30b3f4ac3c1a561ff695701555d237c8"],
    ["receipt", v3["receipt"], "0x47ae79ce7d1360d86f6cd83f06ffa60adf421ea5703255a4eca91f0fa161833b"],
  ] as const;

  it.each(artefacts)("%s: our EIP-712 digest equals the artefact's uid, and the Lead's value (A1-A3)", (_n, a, expected) => {
    const d = `0x${Buffer.from(eip712Digest(a.eip712.domain, a.eip712.primaryType, a.eip712.types, a.data)).toString("hex")}`;
    expect(d).toBe(expected);
    expect(d.toLowerCase()).toBe(String(a.uid).toLowerCase());
  });

  it.each(artefacts)("%s: recovery over that digest returns the stated attester", (_n, a) => {
    const d = eip712Digest(a.eip712.domain, a.eip712.primaryType, a.eip712.types, a.data);
    expect(recoverAddress(d, a.signature)?.toLowerCase()).toBe(ATTESTER.toLowerCase());
  });

  // B1 / H7, both ways. The assertion that carries the weight is the second one:
  // encoding `environment` into the domain does not merely fail to recover the
  // attester, it recovers ONE SPECIFIC other address. Change the extra-field
  // encoding — its type, its position, its presence — and that address moves,
  // so this test goes red for a reason a reader can name.
  it("the receipt's domain carries `environment`, which EIP-712 does not admit", () => {
    expect(v3["receipt"].eip712.domain).toEqual({
      name: "Insight Execution",
      version: "1",
      chainId: 1,
      environment: "nonproduction",
    });
    expect(extraDomainKeys(v3["receipt"].eip712.domain)).toEqual(["environment"]);
    expect(extraDomainKeys(v3["preTrade"]["sourceGate"].eip712.domain)).toEqual([]);
  });

  it("recovers the attester with the five EIP-712 domain members ONLY", () => {
    const a = v3["receipt"];
    const d = eip712Digest(a.eip712.domain, a.eip712.primaryType, a.eip712.types, a.data, false);
    expect(`0x${Buffer.from(d).toString("hex")}`).toBe(String(a.uid));
    expect(recoverAddress(d, a.signature)?.toLowerCase()).toBe(ATTESTER.toLowerCase());
  });

  it("with `environment` encoded as a domain field the digest is 0x8ceaba12… and recovery moves to 0x9647bBCc…", () => {
    const a = v3["receipt"];
    const d = eip712Digest(a.eip712.domain, a.eip712.primaryType, a.eip712.types, a.data, true);
    expect(`0x${Buffer.from(d).toString("hex")}`).toBe("0x8ceaba1226356c085fb56c58f7966acdf1dd4ecbae3a5ca34d027c0f84eaf390");
    expect(recoverAddress(d, a.signature)).toBe("0x9647bbcc4fef90d34bba7a6755a50a3bcc02a4d9");
    expect(recoverAddress(d, a.signature)?.toLowerCase()).not.toBe(ATTESTER.toLowerCase());
  });

  it("so the result names the extra member unsigned, and stays VALID", async () => {
    const r = await verifyV3(v3);
    expect(r.verdict).toBe("VALID");
    expect(r.annotations?.["domain_extra_fields_unsigned"]).toBe(
      "[environment] — declared in the domain object, not in the signed bytes; standard verifiers reject this artefact",
    );
    expect(r.annotations?.["domain_extra_fields_digest_with_extras"]).toBe(
      "0x8ceaba1226356c085fb56c58f7966acdf1dd4ecbae3a5ca34d027c0f84eaf390",
    );
    expect(r.annotations?.["domain_extra_fields_recovers_with_extras_as"]).toBe("0x9647bbcc4fef90d34bba7a6755a50a3bcc02a4d9");
    expect(r.annotations?.["domain_extra_fields_signed"]).toBeUndefined();
  });

  // A7: the 32-byte packed concatenation, source first. The other three
  // constructions are computed too, and the annotation names them, so a signer
  // who changes the ordering is told which one they used.
  it("preTradeUidsHash is keccak(preTradeUid || destinationPreTradeUid), packed, in that order", async () => {
    const r = await verifyV3(v3);
    expect(r.annotations?.["pre_trade_uids_hash"]).toBe(
      "keccak(src || dst), packed — reproduced from preTradeUid and destinationPreTradeUid",
    );
    const others = String(r.annotations?.["pre_trade_uids_hash_other_constructions"]);
    expect(others).not.toContain(String(v3["receipt"].data.preTradeUidsHash));
    expect(others).toContain("keccak(dst || src), packed = ");
    expect(others).toContain("keccak(abi.encode(bytes32[2])) = ");
  });

  it("binds BOTH gates, and says the destination gate's requestHash differs by design (A5, A6, H5)", async () => {
    const r = await verifyV3(v3);
    expect(r.annotations?.["binding"]).toBe("preTradeUid, requestHash, both asset ids and subjectChainId all equal");
    expect(r.annotations?.["destination_gate_binding"]).toBe(
      "destinationPreTradeUid equals the gate uid, subjectChainId equal, and the gate prices the mirror pair",
    );
    expect(String(r.annotations?.["destination_gate_request_hash"])).toContain("by design");
    expect(r.annotations?.["request_hash_matches_canonical_request"]).toBe(true);
    expect(r.annotations?.["destination_gate_request_hash_matches_canonical_request"]).toBe(true);
    // Both gates are now named by the receipt, so nothing is left unbound.
    expect(r.annotations?.["unbound_gates"]).toBeUndefined();
  });

  // A12 / H1-H3. The two flows are strings, not numbers: the WETH leg carries 19
  // significant digits and a float would drop its last four.
  it("attributes the fill to the counterparty, exactly (A11, A12)", async () => {
    const r = await verifyV3(v3);
    const a = r.annotations!;
    expect(a["swap_sender"]).toBe("0x51c72848c68a965f66fa7a88855f9f7784502a7f");
    expect(a["swap_recipient"]).toBe("0x51c72848c68a965f66fa7a88855f9f7784502a7f");
    expect(a["swap_sender_equals_recipient"]).toBe(true);
    expect(a["counterparty"]).toBe("0x51c72848c68a965f66fa7a88855f9f7784502a7f");
    expect(a["counterparty_net_bought"]).toBe("+6.947146505950453595");
    expect(a["counterparty_net_sold"]).toBe("-16499.740294");
    expect(a["counterparty_realised_price"]).toBe("0.000421045809337782");
    expect(String(a["attribution"])).toContain("clean_single_pool_fill");
    expect(a["claim_role"]).toBe("THIRD_PARTY_OBSERVATION");
    expect(a["receipt_subject_is_the_observed_counterparty"]).toBe(true);
    expect(a["receipt_taker_is_the_observed_counterparty"]).toBe(true);
    // The 06:08Z measurement must NOT appear: this fill has no beneficiary
    // distinct from the recipient and no third party taking a share.
    expect(a["beneficiary"]).toBeUndefined();
    expect(a["third_party"]).toBeUndefined();
    expect(a["fee_not_recorded"]).toBeUndefined();
  });

  // A13. Both deltas, because the pair of them is the finding (B3): the signed
  // integers carry five significant digits at this orientation and scale.
  it("recomputes the quote from BOTH gates and reports both deltas (A13)", async () => {
    const r = await verifyV3(v3);
    const a = r.annotations!;
    expect(a["price_scale"]).toBe("8 (signed by the issuer)");
    expect(a["quoted_price_at_scale"]).toBe("0.00042129");
    expect(a["executed_price_at_scale"]).toBe("0.00042105");
    expect(a["quoted_price_matches_gates"]).toBe(true);
    expect(String(a["quoted_price_recomputed_from_gates"])).toContain("42129 = round(source consensus 100000000 / destination consensus 237366640242");
    expect(String(a["delta_bps_unrounded"])).toBe("-5.777084");
    expect(String(a["delta_bps_signed_integers"])).toBe("-5.696788");
    expect(a["pool_price_exact"]).toBe("0.000421045809337782");
  });

  // A14 / H4. The receipt's own timestamps refute precedence, and the recomputed
  // status follows them rather than the delta.
  it("reports precedence after_block and refuses FAITHFUL (A14)", async () => {
    const r = await verifyV3(v3);
    const a = r.annotations!;
    expect(String(a["precedence"])).toContain("after_block");
    expect(String(a["precedence"])).toContain("30s AFTER executedAt 1788342803");
    expect(String(a["precedence"])).toContain("must not be FAITHFUL");
    // The declaration that ordering is unproven survives on a VALID result.
    expect(String(a["precedence"])).toContain("not_checked");
    expect(a["priceExecutionStatus_recomputed"]).toBe(
      "UNDETERMINED (the gate was signed at or after the block, so no price precedence is available)",
    );
    expect(a["priceExecutionStatus_agrees"]).toBe(true);
    expect(String(a["precedence_status_agrees"])).toContain("does not claim precedence");
  });

  it("recomputes measuredFieldsHash from the declared empty measured set (A9)", async () => {
    const r = await verifyV3(v3);
    expect(r.annotations?.["measured_fields_declared"]).toBe("the empty set");
    expect(r.annotations?.["measured_fields_hash_recomputed"]).toBe(
      "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    );
    expect(String(r.annotations?.["measured_fields_hash"])).toContain("match");
  });

  it("is VALID as sent, and UNVERIFIABLE without the unregistered-signer flag", async () => {
    const r = await verifyV3(v3);
    expect(r.verdict).toBe("VALID");
    expect(r.annotations?.["identity"]).toBe("signer_not_in_registry");
    const strict = await insightAdapter.verify(V3_BYTES, { ...v3base, allowUnregisteredSigner: false });
    expect(strict.verdict).toBe("UNVERIFIABLE");
    expect(strict.reason).toBe("key_unresolvable");
    expect(strict.stoppedAt).toBe("identity");
  });
});

describe("insight v3 — the registry at 11:54Z, looked up by primaryType AND version", () => {
  it("matches all three artefacts of the repaired package at v3", async () => {
    const r = await verifyV3(v3);
    expect(r.annotations?.["registry_schema"]).toBe("match (v3)");
    expect(r.annotations?.["source_gate_registry_schema"]).toBe("match (v3)");
    expect(r.annotations?.["destination_gate_registry_schema"]).toBe("match (v3)");
    // The domain versions agree too, so no divergence line is printed.
    expect(r.annotations?.["registry_domain_version"]).toBeUndefined();
    expect(r.annotations?.["source_gate_registry_domain_version"]).toBeUndefined();
  });

  // The 06:08Z package run against the CURRENT registry. Its 32-field receipt is
  // an exact match for the published ExecutionReceiptV2 — and that entry is
  // retiredForSigning, which is the true statement about it. A lookup by
  // primaryType alone would have compared it to the 43-field v3 type and called
  // it a mismatch, which is a different and wrong claim about the same bytes.
  it("reports the 06:08Z receipt as retired_for_signing (v2), not as a mismatch", async () => {
    const r = await insightAdapter.verify(PKG_BYTES, { ...base, registry: REG_1154_BYTES, registryOrigin: "refs/insight-oracle-keys-2026-09-02T1154Z.json" });
    expect(r.verdict).toBe("VALID");
    expect(r.annotations?.["registry_schema"]).toBe("retired_for_signing (v2)");
    // Its gates were already at v3, and the registry has caught up with them:
    // the 09:09Z pin reported these as `mismatch (schemaVersion 3 vs 2; …)`.
    expect(r.annotations?.["source_gate_registry_schema"]).toBe("match (v3)");
    expect(r.annotations?.["destination_gate_registry_schema"]).toBe("match (v3)");
  });

  it("the two packages are told apart by the tool, not by the reader", async () => {
    const morning = await insightAdapter.verify(PKG_BYTES, { ...base, registry: REG_1154_BYTES });
    const repaired = await verifyV3(v3);
    expect(morning.annotations?.["registry_schema"]).toBe("retired_for_signing (v2)");
    expect(repaired.annotations?.["registry_schema"]).toBe("match (v3)");
    expect(String(morning.annotations?.["precedence"])).toContain("signed_before_block");
    expect(String(repaired.annotations?.["precedence"])).toContain("after_block");
    expect(String(morning.annotations?.["attribution"])).toContain("not_clean");
    expect(String(repaired.annotations?.["attribution"])).toContain("clean_single_pool_fill");
    expect(morning.annotations?.["domain_extra_fields_unsigned"]).toBeUndefined();
    expect(repaired.annotations?.["domain_extra_fields_unsigned"]).toBeDefined();
  });
});

describe("insight v3 — tamper", () => {
  // A4: three artefacts, three different addresses, none of them the attester.
  it.each([
    ["sourceGate", "preTrade", "sourceGate"],
    ["destinationGate", "preTrade", "destinationGate"],
  ] as const)("subjectChainId + 1 on the %s moves the recovered address off the attester", (_n, a, b) => {
    const art = clone(v3[a][b]);
    art.data.subjectChainId = art.data.subjectChainId + 1;
    const d = eip712Digest(art.eip712.domain, art.eip712.primaryType, art.eip712.types, art.data);
    const rec = recoverAddress(d, art.signature);
    expect(rec).not.toBeNull();
    expect(rec?.toLowerCase()).not.toBe(ATTESTER.toLowerCase());
  });

  it("the three tampered artefacts recover three DIFFERENT addresses", () => {
    const recovered = [v3["preTrade"]["sourceGate"], v3["preTrade"]["destinationGate"], v3["receipt"]].map((a: any) => {
      const t = clone(a);
      t.data.subjectChainId = t.data.subjectChainId + 1;
      return recoverAddress(eip712Digest(t.eip712.domain, t.eip712.primaryType, t.eip712.types, t.data), t.signature);
    });
    expect(new Set(recovered).size).toBe(3);
    expect(recovered).not.toContain(ATTESTER.toLowerCase());
  });

  it("moving preTradeUidsHash and its uid together is still caught, by the signature", async () => {
    // The uid hash is a signed field, so it is edited on a re-signed copy: the
    // signature check would otherwise fire first and this check would never run.
    const p = clone(v3);
    p["receipt"].data.preTradeUidsHash = `0x${"0".repeat(63)}1`;
    p["receipt"].uid = `0x${Buffer.from(
      eip712Digest(p["receipt"].eip712.domain, p["receipt"].eip712.primaryType, p["receipt"].eip712.types, p["receipt"].data),
    ).toString("hex")}`;
    const r = await verifyV3(p);
    // The signature no longer covers these bytes, so THAT is what is reported —
    // the root fault, not the symptom. The uid was moved with the edit, so the
    // digest/uid comparison stays quiet and the signature is the only finding.
    expect(r.verdict).toBe("INVALID");
    expect(r.reason).toBe("signature_invalid");
  });

  it("a destination gate that prices a different pair breaks the binding", async () => {
    const p = clone(v3);
    // Re-sign is impossible here, so the gate is swapped for the SOURCE gate,
    // which is validly signed and prices the wrong direction for this role.
    p["preTrade"].destinationGate = clone(v3["preTrade"]["sourceGate"]);
    const r = await verifyV3(p);
    expect(r.verdict).toBe("INVALID");
    expect(r.reason).toBe("content_commitment_mismatch");
    expect(r.stoppedAt).toBe("binding");
    expect(r.detail).toContain("destinationPreTradeUid");
  });

  // H7 branch (d). An edit to a signed field of an artefact that ALSO carries a
  // non-standard domain member must name both attempts, because "the signature
  // is invalid" without saying what was tried leaves a reader unable to tell a
  // tampered receipt from one their library simply cannot encode.
  it("a tampered v3 receipt is INVALID/signature_invalid and names BOTH candidate separators", async () => {
    const p = clone(v3);
    p["receipt"].data.executedPrice = p["receipt"].data.executedPrice + 1;
    const r = await verifyV3(p);
    expect(r.verdict).toBe("INVALID");
    expect(r.reason).toBe("signature_invalid");
    expect(r.stoppedAt).toBe("signature");
    expect(r.detail).toContain("[environment]");
    expect(r.detail).toContain("with the five EIP-712 members only the digest is");
    expect(r.detail).toContain("appended as `string`");
    // Both digests are named, and neither is the artefact's uid any more.
    expect(r.detail).not.toContain(String(v3["receipt"].uid));
  });

  it("evaluated after validUntil, the repaired receipt is INVALID/expired", async () => {
    const validUntil = v3["receipt"].data.validUntil as number;
    const r = await verifyV3(v3, { now: validUntil + 1 });
    expect(r.verdict).toBe("INVALID");
    expect(r.reason).toBe("expired");
    expect(r.stoppedAt).toBe("freshness");
  });
});

// --------------------------------------------------------------------------
// H7 branch (c): a signer that actually encoded its non-standard domain member.
//
// No such artefact exists in either package, and one cannot be forged from
// them, so it is built here over a throwaway key generated at test time. The
// branch is worth reaching: it is the difference between "we report the state
// Insight happens to be in" and "we report whichever of the two states an
// artefact is in", and an unreached branch is an untested one.
// --------------------------------------------------------------------------

describe("insight — a domain extra field that IS in the signed bytes", () => {
  const TYPES = { Thing: [{ name: "value", type: "uint256" }] };
  const DOMAIN = { name: "Custom Domain", version: "1", chainId: 1, environment: "production" };
  const DATA = { value: 7 };

  /** Sign a digest with a fixed throwaway key and return {attester, signature}. */
  const signWith = async (digest: Uint8Array): Promise<{ attester: string; signature: string }> => {
    const { secp256k1 } = await import("@noble/curves/secp256k1.js");
    const { keccak_256 } = await import("@noble/hashes/sha3.js");
    const priv = new Uint8Array(32).fill(0);
    priv[31] = 42; // deterministic, throwaway, and never written to disk
    const rs = secp256k1.sign(digest, priv, { prehash: false });
    const pub = secp256k1.getPublicKey(priv, false);
    const attester = `0x${Buffer.from(keccak_256(pub.slice(1)).slice(-20)).toString("hex")}`;
    // The recovery bit is not read out of the library here: both are tried and
    // the one this adapter's own recovery agrees with is kept. That keeps the
    // test independent of which shape @noble/curves returns.
    const body = Buffer.from(rs.slice(0, 64)).toString("hex");
    for (const v of [27, 28]) {
      const signature = `0x${body}${v.toString(16)}`;
      if (recoverAddress(digest, signature)?.toLowerCase() === attester.toLowerCase()) return { attester, signature };
    }
    throw new Error("neither recovery bit reproduces the signing address");
  };

  it("is reported as domain_extra_fields_signed, and verifies", async () => {
    const digest = eip712Digest(DOMAIN, "Thing", TYPES, DATA, true);
    const { attester, signature } = await signWith(digest);
    const art = { attester, signature, data: DATA, eip712: { domain: DOMAIN, types: TYPES, primaryType: "Thing" } };

    const r = await insightAdapter.verify(bytesOf(art), { now: INSIGHT_V3_NOW, allowUnregisteredSigner: true });
    expect(r.verdict).toBe("VALID");
    expect(r.annotations?.["domain_extra_fields_signed"]).toBe(
      "[environment] — non-standard; verifiable only with a custom EIP712Domain type",
    );
    expect(r.annotations?.["domain_extra_fields_unsigned"]).toBeUndefined();
    // The reported digest is the one the signature was actually made over.
    expect(r.annotations?.["digest"]).toBe(`0x${Buffer.from(digest).toString("hex")}`);
  });

  it("the same message signed the STANDARD way lands in the other branch", async () => {
    const digest = eip712Digest(DOMAIN, "Thing", TYPES, DATA, false);
    const { attester, signature } = await signWith(digest);
    const art = { attester, signature, data: DATA, eip712: { domain: DOMAIN, types: TYPES, primaryType: "Thing" } };

    const r = await insightAdapter.verify(bytesOf(art), { now: INSIGHT_V3_NOW, allowUnregisteredSigner: true });
    expect(r.verdict).toBe("VALID");
    expect(r.annotations?.["domain_extra_fields_unsigned"]).toBe(
      "[environment] — declared in the domain object, not in the signed bytes; standard verifiers reject this artefact",
    );
    expect(r.annotations?.["domain_extra_fields_signed"]).toBeUndefined();
    // The two separators are genuinely different, which is what makes the pair
    // of tests above a discrimination rather than a coincidence.
    expect(`0x${Buffer.from(digest).toString("hex")}`).not.toBe(
      `0x${Buffer.from(eip712Digest(DOMAIN, "Thing", TYPES, DATA, true)).toString("hex")}`,
    );
  });
});

// --------------------------------------------------------------------------
// --rpc must corroborate the other checks and must never overwrite them.
//
// This is here because it happened: the chain check wrote its own sentence into
// `attribution`, ending "beneficiary differs". That was true of the 06:08Z
// transaction and false of the 09:53Z one, so adding --rpc to a clean
// single-pool fill replaced a correct finding with an incorrect one -- and only
// in the run where the chain AGREED with everything asked of it. A corroborating
// check that can degrade what it confirms is worse than one that is skipped.
//
// The endpoint is stubbed from the package's own logs so the assertion is about
// this tool's behaviour and not about a public node's availability.
// --------------------------------------------------------------------------

describe("insight v3 — --rpc corroborates without overwriting", () => {
  const stubFetch = (): (() => void) => {
    const oc = v3["onchain"];
    const real = globalThis.fetch;
    globalThis.fetch = (async (_url: string, init: { body: string }) => {
      const { method, params } = JSON.parse(init.body) as { method: string; params: unknown[] };
      const result =
        method === "eth_getTransactionReceipt"
          ? { status: "0x1", blockNumber: oc.rawSwapEvent.blockNumber, logs: [oc.rawSwapEvent, ...oc.rawTransferLogs] }
          : method === "eth_getBlockByNumber"
            ? { timestamp: `0x${(oc.executedAt as number).toString(16)}` }
            : method === "eth_getCode"
              ? "0x60806040"
              : null;
      const body = JSON.stringify({ jsonrpc: "2.0", id: 1, result });
      return { ok: true, status: 200, text: async () => body } as unknown as Response;
    }) as unknown as typeof fetch;
    return () => {
      globalThis.fetch = real;
    };
  };

  it("keeps the clean_single_pool_fill attribution and adds the contract fact beside it", async () => {
    const restore = stubFetch();
    try {
      const r = await verifyV3(v3, { rpc: "https://stub.invalid" });
      expect(r.verdict).toBe("VALID");
      expect(r.annotations?.["chain_status"]).toBe("ok (0x1)");
      expect(r.annotations?.["chain_executed_at_equals_block_timestamp"]).toBe(true);
      expect(r.annotations?.["chain_logs_matched"]).toBe("3 of 3 shipped logs found on chain by index, address and data");
      expect(r.annotations?.["recipient_is_contract"]).toBe(true);
      // The finding the chain corroborates must survive the corroboration.
      expect(String(r.annotations?.["attribution"])).toContain("clean_single_pool_fill");
      expect(String(r.annotations?.["attribution"])).not.toContain("beneficiary differs");
      expect(r.annotations?.["counterparty_realised_price"]).toBe("0.000421045809337782");
    } finally {
      restore();
    }
  });

  it("and the same run on the 06:08Z package still reports its beneficiary split", async () => {
    const oc = pkg["onchain"];
    const real = globalThis.fetch;
    globalThis.fetch = (async (_url: string, init: { body: string }) => {
      const { method } = JSON.parse(init.body) as { method: string };
      const result =
        method === "eth_getTransactionReceipt"
          ? { status: "0x1", blockNumber: oc.rawSwapEvent.blockNumber, logs: [oc.rawSwapEvent, ...oc.rawTransferLogs] }
          : method === "eth_getBlockByNumber"
            ? { timestamp: `0x${(oc.executedAt as number).toString(16)}` }
            : "0x60806040";
      return { ok: true, status: 200, text: async () => JSON.stringify({ jsonrpc: "2.0", id: 1, result }) } as unknown as Response;
    }) as unknown as typeof fetch;
    try {
      const r = await verify(pkg, { rpc: "https://stub.invalid" });
      expect(r.verdict).toBe("VALID");
      expect(String(r.annotations?.["attribution"])).toContain("not_clean");
      expect(r.annotations?.["beneficiary"]).toBe("0x70d06bcb8f43109f5c4c466e1241a79c420c8f67");
      expect(r.annotations?.["recipient_is_contract"]).toBe(true);
    } finally {
      globalThis.fetch = real;
    }
  });
});
