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
import { insightAdapter, detect, eip712Digest, extraDomainKeys, findDuplicateKey, parseRegistry, recoverAddress, resolveRegistryKey, FORMAT } from "../src/adapters/insight.js";
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
  INSIGHT_PKG_V4,
  INSIGHT_KEY_202609,
  INSIGHT_KEY_V2,
  INSIGHT_NOW_1530,
  INSIGHT_NOW_1741,
  INSIGHT_REGISTRY,
  INSIGHT_REGISTRY_1154,
  INSIGHT_REGISTRY_1545,
  INSIGHT_REGISTRY_1741,
  INSIGHT_SAMPLE_1546,
  INSIGHT_SAMPLE_1741,
  INSIGHT_SAMPLE_ATTESTATION_1546,
  INSIGHT_REGISTRY_0905,
  INSIGHT_EXEC_SAMPLE_0905,
  INSIGHT_SAFETY_SAMPLE_0905,
  INSIGHT_KEY_SAMPLE,
  INSIGHT_NOW_0905,
  INSIGHT_V3_NOW,
  INSIGHT_V4_NOW,
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

const V4_BYTES = read(INSIGHT_PKG_V4);
const REG_1545_BYTES = read(INSIGHT_REGISTRY_1545);
const SAMPLE_BYTES = read(INSIGHT_SAMPLE_1546);
const v4 = JSON.parse(V4_BYTES.toString("utf8")) as Record<string, any>;
const sampleAtt = JSON.parse(read(INSIGHT_SAMPLE_ATTESTATION_1546).toString("utf8")) as Record<string, any>;

/** The domain-repaired package against the 15:45Z registry pin. */
const v4base: VerifyOptions = {
  registry: REG_1545_BYTES,
  registryOrigin: "refs/insight-oracle-keys-2026-09-02T1545Z.json",
  now: INSIGHT_V4_NOW,
  allowUnregisteredSigner: true,
};

const bytesOf = (v: unknown): Buffer => Buffer.from(JSON.stringify(v), "utf8");
const verify = (v: unknown, extra: Partial<VerifyOptions> = {}): Promise<VerifyResult> =>
  insightAdapter.verify(bytesOf(v), { ...base, ...extra });
const verifyV3 = (v: unknown, extra: Partial<VerifyOptions> = {}): Promise<VerifyResult> =>
  insightAdapter.verify(bytesOf(v), { ...v3base, ...extra });
const verifyV4 = (v: unknown, extra: Partial<VerifyOptions> = {}): Promise<VerifyResult> =>
  insightAdapter.verify(bytesOf(v), { ...v4base, ...extra });
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
    // A guard on the corpus, not on the adapter: it fails whenever a file is
    // added under fixtures/insight/, so a new fixture cannot quietly widen what
    // "claims ZERO of the other fixtures" above is measured against. Was 2 (the
    // found and repaired packages); round 3 added the v4 package, the production
    // sample as the endpoint returned it, and the attestation extracted from it;
    // B-29 added the post-rotation sample pinned at 17:41Z; B-70 added the two
    // 2026-09-05T18:30Z endpoint responses, execution and safety.
    expect(insightFixtures.length).toBe(8);
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

// --------------------------------------------------------------------------
// Round 3: the domain-repaired package (schema v4) and the production sample.
//
// v4 moved `environment` from a declared-but-unsigned domain member into the
// signed message as the 44th field. That closes H7 for the package: in v3 the
// label sat beside the signature, and a label beside a signature is not a
// property of it. These tests assert the closure the way it has to be asserted
// -- by changing the field and showing the recovered address moves -- rather
// than by observing that the field is present.
//
// The domain is back to the three standard members, so the adapter's H7 rule
// takes branch (a) and no `domain_extra_fields_*` annotation appears. That
// absence is asserted too: it is the difference between v3 and v4.
// --------------------------------------------------------------------------

describe("insight v4 — snapshot integrity", () => {
  it("the v4 package is the 44,472 bytes the round-3 note recomputed", () => {
    expect(sha256Hex(V4_BYTES)).toBe("fb403a85d6bd9af3ce7243cdae0b753a53a4a5cad816efde3a3ffc247bd98781");
    expect(V4_BYTES.length).toBe(44472);
  });

  it("the 15:45Z registry pin is the single fetch the note recorded", () => {
    expect(sha256Hex(REG_1545_BYTES)).toBe("76522cd33edcb94a822a82cf6c70013f9d34489a39447912c28d8336fcc87ae2");
    expect(REG_1545_BYTES.length).toBe(17019);
  });

  it("the production sample is the 15:46Z pin, wrapper included", () => {
    expect(sha256Hex(SAMPLE_BYTES)).toBe("a3698a472f72578170266f6be42ae4c46ad6c7bd4e1f9f58309be5bfd9c6263a");
    expect(SAMPLE_BYTES.length).toBe(4675);
  });

  it("the extracted attestation is the wrapper's own attestation object, unaltered", () => {
    // The pin the adapter reads is a copy. Assert it against the wrapper it came
    // from, so the copy cannot drift from the bytes that were fetched.
    const wrapped = JSON.parse(SAMPLE_BYTES.toString("utf8")) as Record<string, any>;
    expect(sampleAtt).toEqual(wrapped["data"]["attestation"]);
  });
});

describe("insight v4 — the signed field count and the domain", () => {
  it("signs 44 fields and carries only the three standard domain members", () => {
    expect(Object.keys(v4.receipt.data)).toHaveLength(44);
    expect(v4.receipt.schemaVersion).toBe(4);
    expect(Object.keys(v4.receipt.eip712.domain).sort()).toEqual(["chainId", "name", "version"]);
    expect(extraDomainKeys(v4.receipt.eip712.domain)).toEqual([]);
  });

  it("recovers the attester, and the uid is the digest", () => {
    const d = eip712Digest(v4.receipt.eip712.domain, v4.receipt.eip712.primaryType, v4.receipt.eip712.types, v4.receipt.data);
    expect(`0x${Buffer.from(d).toString("hex")}`).toBe("0x54a787220982817ae482d01e07c90144c69cf02b6d011c4567ecbd28bfeff9b4");
    expect(v4.receipt.uid).toBe("0x54a787220982817ae482d01e07c90144c69cf02b6d011c4567ecbd28bfeff9b4");
    expect(recoverAddress(d, v4.receipt.signature)?.toLowerCase()).toBe(ATTESTER.toLowerCase());
  });

  it("H7 CLOSED: changing environment moves the recovered address off the attester", () => {
    // v3's environment could be edited without touching the signature, because
    // it was a domain member the standard encoder never reads. In v4 it is
    // signed, and this is what "signed" means.
    const t = clone(v4.receipt);
    expect(t.data.environment).toBe("nonproduction");
    t.data.environment = "production";
    const d = eip712Digest(t.eip712.domain, t.eip712.primaryType, t.eip712.types, t.data);
    expect(recoverAddress(d, t.signature)?.toLowerCase()).toBe("0x0e29cb8e6f430160466c996a8c5008f1d5838876");
  });

  it("H7 CLOSED: stripping environment back to the 43-field v3 layout moves it too", () => {
    // The other direction: a verifier that read v4 bytes under the v3 type would
    // not merely mis-report the environment, it would fail to recover the signer.
    const t = clone(v4.receipt);
    delete t.data.environment;
    t.eip712.types[t.eip712.primaryType] = t.eip712.types[t.eip712.primaryType].filter(
      (f: { name: string }) => f.name !== "environment",
    );
    expect(t.eip712.types[t.eip712.primaryType]).toHaveLength(43);
    const d = eip712Digest(t.eip712.domain, t.eip712.primaryType, t.eip712.types, t.data);
    expect(recoverAddress(d, t.signature)?.toLowerCase()).toBe("0x1056ca3b619a7e908d565d9b7c84a981544532a0");
  });
});

describe("insight v4 — through the adapter", () => {
  // The WHOLE package, not the bare receipt: the attribution, the deltas and
  // the precedence line are recomputed from the gates, the raw logs and the
  // request preimage the package carries beside the receipt. Handed the receipt
  // alone the adapter still returns VALID and still checks the signature -- it
  // simply has nothing to recompute those annotations from. This is the same
  // input the CLI run in CC_REPORT_2026-09-02_insight-v4.md was given.
  it("is VALID, reports the registry schema as v4, and raises no domain-extras annotation", async () => {
    const r = await verifyV4(v4);
    expect(r.verdict).toBe("VALID");
    expect(r.annotations?.["registry_schema"]).toBe("match (v4)");
    // The v3 run raised these. Their absence is the repair.
    expect(Object.keys(r.annotations ?? {}).filter((k) => k.includes("domain_extra_fields"))).toEqual([]);
  });

  it("binds both gates, so no gate is reported unbound", async () => {
    const r = await verifyV4(v4);
    expect(Object.keys(r.annotations ?? {}).filter((k) => k.includes("unbound_gates"))).toEqual([]);
    expect(r.annotations?.["pre_trade_uids_hash"]).toContain("keccak(src || dst)");
  });

  it("reports the two flows and the realised price as exact strings", async () => {
    // Strings, not numbers: 31.383501031910547456 does not survive a double, and
    // the whole point of the attribution is that it is exact.
    const r = await verifyV4(v4);
    expect(r.annotations?.["counterparty_net_bought"]).toBe("+74681.028186");
    expect(r.annotations?.["counterparty_net_sold"]).toBe("-31.383501031910547456");
    expect(r.annotations?.["counterparty_realised_price"]).toBe("2379.627056588262663338");
    expect(String(r.annotations?.["attribution"])).toContain("clean_single_pool_fill");
  });

  it("reports the realised price destination-received over source-paid, in USDC per WETH", async () => {
    // Round 2 reported this pair in the other orientation. The receipt's own
    // asset order is WETH -> USDC, so the realised rate is USDC per WETH, and
    // 2379.6 is that number; the reciprocal would be 0.00042.
    const r = await verifyV4(v4);
    const price = Number(r.annotations?.["counterparty_realised_price"]);
    expect(price).toBeGreaterThan(2000);
    expect(price).toBeLessThan(3000);
    // The asset ids are CAIP-19, not symbols: WETH and USDC by contract address.
    expect(String(v4.receipt.data.sourceAssetId).toLowerCase()).toContain("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2");
    expect(String(v4.receipt.data.destinationAssetId).toLowerCase()).toContain("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");
  });

  it("recomputes the quote from the gates and both deltas agree at -8.478830 bps", async () => {
    const r = await verifyV4(v4);
    expect(String(r.annotations?.["quoted_price_recomputed_from_gates"])).toContain("238164641414");
    expect(r.annotations?.["delta_bps_unrounded"]).toBe("-8.478830");
    expect(r.annotations?.["delta_bps_signed_integers"]).toBe("-8.478830");
  });

  it("reports precedence after_block and recomputes the status as UNDETERMINED", async () => {
    const r = await verifyV4(v4);
    expect(String(r.annotations?.["precedence"])).toContain("after_block");
    expect(String(r.annotations?.["priceExecutionStatus_recomputed"])).toContain("UNDETERMINED");
    expect(r.annotations?.["measured_fields_hash"]).toContain("match");
  });
});

describe("insight v4 — the registry at 15:45Z", () => {
  const reg = JSON.parse(REG_1545_BYTES.toString("utf8")) as Record<string, any>;

  it("publishes ExecutionReceipt at schemaVersion 4 and retires V3 for signing", () => {
    expect(reg.schemas.ExecutionReceipt.schemaVersion).toBe(4);
    expect(reg.schemas.ExecutionReceiptV3.schemaVersion).toBe(3);
    expect(reg.schemas.ExecutionReceiptV3.retiredForSigning).toBe(true);
  });

  it("carries the rotated production key the sample signs with", () => {
    const kids = (reg.public_keys as Array<Record<string, any>>).map((k) => k.key_id);
    expect(kids).toContain("insight-oracle-safety-v2-202609");
    const rotated = (reg.public_keys as Array<Record<string, any>>).find((k) => k.key_id === "insight-oracle-safety-v2-202609");
    expect(rotated?.public_key).toBe("0x6506F789Edd43338A416f59822A63F309f97E8ce");
    expect(rotated?.revoked).toBe(false);
  });
});

describe("insight v4 — the production sample", () => {
  it("is VALID with the key resolved from the registry, no unregistered-signer flag", async () => {
    // The package needs --allow-unregistered-signer because it is signed with an
    // anvil test key. The sample does not: this is the production flow.
    const r = await insightAdapter.verify(bytesOf(sampleAtt), {
      registry: REG_1545_BYTES,
      registryOrigin: "refs/insight-oracle-keys-2026-09-02T1545Z.json",
      now: INSIGHT_V4_NOW,
    });
    expect(r.verdict).toBe("VALID");
    expect(r.resolvedKey?.kid).toBe("insight-oracle-safety-v2-202609");
    expect(r.annotations?.["registry_schema"]).toBe("match (v4)");
    expect(String(r.annotations?.["identity"])).toContain("signer_in_registry");
  });

  it("recovers the production key, and the uid is the digest", () => {
    const d = eip712Digest(sampleAtt.eip712.domain, sampleAtt.eip712.primaryType, sampleAtt.eip712.types, sampleAtt.data);
    expect(`0x${Buffer.from(d).toString("hex")}`).toBe(sampleAtt.uid);
    expect(recoverAddress(d, sampleAtt.signature)?.toLowerCase()).toBe("0x6506f789edd43338a416f59822a63f309f97e8ce");
  });

  it("H7 CLOSED in production: flipping environment moves the recovered address", () => {
    const t = clone(sampleAtt);
    expect(t.data.environment).toBe("production");
    t.data.environment = "nonproduction";
    const d = eip712Digest(t.eip712.domain, t.eip712.primaryType, t.eip712.types, t.data);
    expect(recoverAddress(d, t.signature)?.toLowerCase()).toBe("0x3d52d61ba941e900242e4bfab9cd7da732d0258a");
  });

  it("H8: the 44 signed fields carry no mark that this is a sample, while the wrapper does", () => {
    // The finding, as a test. A party that strips the wrapper holds a genuine
    // production-key signature over a settlement that never happened, and a
    // verifier checking signature + registry -- which is what the test above
    // does, and it returns VALID -- has nothing to object to.
    //
    // Recorded here rather than as an adapter annotation because the adapter
    // cannot see the wrapper: handed the whole sample document it returns
    // UNVERIFIABLE/format_unrecognized, asserted below. So `synthetic_label_
    // unsigned` cannot be an annotation without teaching the adapter a wrapper
    // shape no document defines, and inventing that shape would be worse than
    // recording the gap.
    const signedBytes = JSON.stringify(sampleAtt.data);
    for (const mark of ["SYNTHETIC", "synthetic", "Synthetic", "sample", "Sample", "demo", "DEMO"]) {
      expect(signedBytes).not.toContain(mark);
    }
    const wrapper = JSON.parse(SAMPLE_BYTES.toString("utf8")) as Record<string, any>;
    expect(JSON.stringify(wrapper.data.note)).toContain("SYNTHETIC");
    expect(wrapper.data.isSample).toBe(true);
    // And the signed fields assert the opposite of "sample" where it counts.
    expect(sampleAtt.data.environment).toBe("production");
    expect(sampleAtt.data.fillStatus).toBe("FULL");
    expect(sampleAtt.data.slippageSatisfied).toBe(true);
  });

  it("H8 control: the adapter cannot see the wrapper, which is why this is test-only", async () => {
    const r = await insightAdapter.verify(SAMPLE_BYTES, {
      registry: REG_1545_BYTES,
      registryOrigin: "refs/insight-oracle-keys-2026-09-02T1545Z.json",
      now: INSIGHT_V4_NOW,
    });
    expect(r.verdict).not.toBe("VALID");
  });
});

// --------------------------------------------------------------------------

describe("insight — the 17:41Z post-rotation pins", () => {
  it("the registry pinned six minutes AFTER the rotation is byte-identical to the 15:45Z pin", () => {
    const REG_1741_BYTES = read(INSIGHT_REGISTRY_1741);
    expect(REG_1741_BYTES.length).toBe(17019);
    expect(sha256Hex(REG_1741_BYTES)).toBe("76522cd33edcb94a822a82cf6c70013f9d34489a39447912c28d8336fcc87ae2");
    // The claim the second pin exists to make. If the registry ever DID drop or
    // rewrite the retired key on expiry, this equality is what would go red.
    expect(REG_1741_BYTES.equals(read(INSIGHT_REGISTRY_1545))).toBe(true);
  });

  it("the retired key is still listed, unrevoked, with its window closed", () => {
    const reg = JSON.parse(read(INSIGHT_REGISTRY_1741).toString("utf8")) as Record<string, any>;
    const v2 = reg["public_keys"].find((k: any) => k["public_key"] === INSIGHT_KEY_V2);
    expect(v2["key_id"]).toBe("insight-oracle-safety-v2");
    expect(v2["revoked"]).toBe(false);
    expect(v2["validUntil"]).toBe("2026-09-02T17:35:36.000Z");
    expect(Math.floor(Date.parse(v2["validUntil"]) / 1000)).toBeLessThan(INSIGHT_NOW_1741);
  });

  it("the 17:41Z production sample is a fresh fetch, not a copy of the 15:46Z one", () => {
    const SAMPLE_1741 = read(INSIGHT_SAMPLE_1741);
    expect(SAMPLE_1741.length).toBe(4675);
    expect(sha256Hex(SAMPLE_1741)).toBe("d4bad431e7c330f30dc4fc8a4edb14fd3fa3a0d748903c2516b056a9a9754716");
    expect(SAMPLE_1741.equals(read(INSIGHT_SAMPLE_1546))).toBe(false);
    const w = JSON.parse(SAMPLE_1741.toString("utf8")) as Record<string, any>;
    expect(w.data.attestation.attester).toBe(INSIGHT_KEY_202609);
    // Signed 17:42:03.934Z, a minute and a half AFTER the 17:35:36Z rotation
    // instant: this sample is the current key's work, not the retired key's.
    expect(w.data.attestation.signedAt).toBe("2026-09-02T17:42:03.934Z");
  });
});

// --------------------------------------------------------------------------

/**
 * B-29: a key the registry still LISTS is not the same as a key the registry
 * still vouches for. `insight-oracle-safety-v2` stays in `public_keys` with
 * `revoked: false` after its `validUntil` passes, so a resolver that matches on
 * address alone reports a published identity for a key whose window has closed.
 *
 * These cases exercise RESOLUTION ONLY, against the pinned registry bytes — no
 * Insight key material and no signature is involved. The behavioural
 * red-then-green control for the verdict path is the throwaway-key block below.
 *
 * What would turn these red: dropping the `validUntil` comparison (a and b),
 * comparing against the wrong instant, or applying a window to a key that
 * publishes `validUntil: null` (c).
 */
describe("insight — a registry key is resolved against its own validity window", () => {
  const parsed = parseRegistry(read(INSIGHT_REGISTRY_1741), "refs/insight-oracle-keys-2026-09-02T1741Z.json");
  if ("error" in parsed) throw new Error(parsed.error);
  const registry = parsed;

  it("(a) at 17:41:40Z the retired v2 key resolves as expired, never as plainly valid", () => {
    const r = resolveRegistryKey(registry, INSIGHT_KEY_V2, INSIGHT_NOW_1741);
    expect(r.status).toBe("expired");
    if (r.status !== "expired") throw new Error("unreachable");
    expect(r.key.keyId).toBe("insight-oracle-safety-v2");
    expect(r.validUntil).toBe(1788370536);
    // Listed and unrevoked at the same instant: the two facts the old resolver
    // saw, and the reason it said the identity was established.
    expect(r.key.revoked).toBe(false);
  });

  it("(b) at 15:30:00Z the same key resolves as valid", () => {
    const r = resolveRegistryKey(registry, INSIGHT_KEY_V2, INSIGHT_NOW_1530);
    expect(r.status).toBe("valid");
    if (r.status !== "valid") throw new Error("unreachable");
    expect(r.key.keyId).toBe("insight-oracle-safety-v2");
  });

  it("(c) the 202609 key, whose validUntil is null, resolves valid at both instants", () => {
    for (const now of [INSIGHT_NOW_1530, INSIGHT_NOW_1741]) {
      const r = resolveRegistryKey(registry, INSIGHT_KEY_202609, now);
      expect(r.status).toBe("valid");
      if (r.status !== "valid") throw new Error("unreachable");
      expect(r.key.keyId).toBe("insight-oracle-safety-v2-202609");
      expect(r.key.validUntil).toBeNull();
    }
  });

  it("a key not in the registry is not_found, and an address is matched case-insensitively", () => {
    expect(resolveRegistryKey(registry, ATTESTER, INSIGHT_NOW_1530).status).toBe("not_found");
    expect(resolveRegistryKey(registry, INSIGHT_KEY_V2.toLowerCase(), INSIGHT_NOW_1530).status).toBe("valid");
  });

  it("before its validFrom the same key is not_yet_valid, not merely absent", () => {
    // 2026-08-05 is the v2 key's validFrom; one second before it is 1785887999.
    const r = resolveRegistryKey(registry, INSIGHT_KEY_V2, 1785887999);
    expect(r.status).toBe("not_yet_valid");
    if (r.status !== "not_yet_valid") throw new Error("unreachable");
    expect(r.validFrom).toBe(1785888000);
  });
});

// --------------------------------------------------------------------------

/**
 * The verdict path, end to end, on the public adapter API. This is the
 * red-then-green control for B-29: on 444b676 the first case below returns
 * VALID under a key whose window closed forty minutes before `--now`.
 *
 * The registries here are built in the test from the pinned 09:09Z bytes with
 * `public_keys` replaced, so the throwaway signer the package already carries is
 * a "published" key. No Insight key material is used and nothing is re-signed.
 */
describe("insight — an expired registry key does not establish identity", () => {
  const withKey = (validUntil: string | null): Buffer => {
    const reg = JSON.parse(REG_BYTES.toString("utf8")) as Record<string, any>;
    reg["public_keys"] = [
      { key_id: "throwaway-under-test", public_key: ATTESTER, algorithm: "EIP-712/secp256k1", validFrom: "2026-08-05", validUntil, revoked: false },
    ];
    return Buffer.from(JSON.stringify(reg), "utf8");
  };
  // INSIGHT_NOW is 1788327600 = 2026-09-02T05:40:00Z.
  const CLOSED = "2026-09-02T05:00:00.000Z";
  const OPEN = "2026-09-02T06:00:00.000Z";

  it("is UNVERIFIABLE/expired at identity when the signer's key window has closed", async () => {
    const r = await insightAdapter.verify(PKG_BYTES, { ...base, registry: withKey(CLOSED) });
    expect(r.verdict).toBe("UNVERIFIABLE");
    expect(r.reason).toBe("expired");
    expect(r.stoppedAt).toBe("identity");
    // Fail closed: no key line may be printed for an identity that is not
    // established at the evaluation instant.
    expect(r.resolvedKey).toBeUndefined();
    expect(r.detail).toContain("throwaway-under-test");
    expect(String(r.annotations?.["identity"])).toContain("key_expired");
  });

  it("--allow-unregistered-signer does not open it: the key IS registered, its window is shut", async () => {
    const r = await insightAdapter.verify(PKG_BYTES, { ...base, registry: withKey(CLOSED), allowUnregisteredSigner: true });
    expect(r.verdict).toBe("UNVERIFIABLE");
    expect(r.reason).toBe("expired");
  });

  it("the control: the same package, the same key, a window still open at --now is VALID", async () => {
    const r = await insightAdapter.verify(PKG_BYTES, { ...base, registry: withKey(OPEN) });
    expect(r.verdict).toBe("VALID");
    expect(r.annotations?.["identity"]).toBe("signer_in_registry (throwaway-under-test)");
    expect(r.resolvedKey?.kid).toBe("throwaway-under-test");
  });

  it("and an open-ended key (validUntil null) is VALID, so the check is the window and not the member's presence", async () => {
    const r = await insightAdapter.verify(PKG_BYTES, { ...base, registry: withKey(null) });
    expect(r.verdict).toBe("VALID");
  });

  it("a validUntil that is not an instant fails closed rather than reading as open-ended", async () => {
    const r = await insightAdapter.verify(PKG_BYTES, { ...base, registry: withKey("whenever") });
    expect(r.verdict).toBe("UNVERIFIABLE");
    expect(r.reason).toBe("malformed_member");
    expect(r.stoppedAt).toBe("identity");
  });
});

// --------------------------------------------------------------------------

/**
 * The revoked-key gap, closed the same way the expired-key one was. Until
 * `f495e13` a key the registry marked `revoked: true` still resolved as a
 * published identity and could reach VALID: `identity_revoked` was an
 * annotation and annotations never move a verdict. The red control, run on that
 * commit's source, returned VALID for all five cases below.
 *
 * Two channels, not one. This registry publishes revocation both as `revoked`
 * on each `public_keys` entry AND as a top-level `revoked_keys` array, which
 * `parseRegistry` did not read at all. Honouring one of two channels is the same
 * as honouring neither for whichever key the issuer withdrew on the other.
 *
 * `revoked_keys` is `[]` in all four registry pins here, so nothing tells us
 * what a populated entry looks like. Two shapes are read and everything else
 * fails closed; that assumption is stated in fixtures/provenance.md rather than
 * hidden in the resolver.
 */
describe("insight — a revoked registry key establishes no identity", () => {
  const reg = (revoked: boolean, revokedKeys: unknown[] = []): Buffer => {
    const r = JSON.parse(REG_BYTES.toString("utf8")) as Record<string, any>;
    r["public_keys"] = [
      { key_id: "throwaway-under-test", public_key: ATTESTER, algorithm: "EIP-712/secp256k1", validFrom: "2026-08-05", validUntil: "2026-09-02T06:00:00.000Z", revoked },
    ];
    r["revoked_keys"] = revokedKeys;
    return Buffer.from(JSON.stringify(r), "utf8");
  };

  it("`revoked: true` is UNVERIFIABLE/key_revoked at identity, and names no key", async () => {
    const r = await insightAdapter.verify(PKG_BYTES, { ...base, registry: reg(true) });
    expect(r.verdict).toBe("UNVERIFIABLE");
    expect(r.reason).toBe("key_revoked");
    expect(r.stoppedAt).toBe("identity");
    expect(r.resolvedKey).toBeUndefined();
    expect(r.annotations?.["identity"]).toBe("key_revoked (throwaway-under-test)");
    expect(r.annotations?.["identity_revoked"]).toBe(true);
    // The detail must not suggest a different --now recovers it. Revocation is
    // not a window, and telling a caller to re-time the check would be wrong.
    expect(r.detail).toContain("not recoverable by re-running with a different --now");
  });

  it("`key_revoked` is its own reason, not `key_unresolvable`: no-such-key and do-not-trust differ", async () => {
    const revokedR = await insightAdapter.verify(PKG_BYTES, { ...base, registry: reg(true) });
    const absentR = await insightAdapter.verify(PKG_BYTES, { ...base, allowUnregisteredSigner: false });
    expect(revokedR.reason).toBe("key_revoked");
    expect(absentR.reason).toBe("key_unresolvable");
    expect(revokedR.reason).not.toBe(absentR.reason);
  });

  it("--allow-unregistered-signer does not open it: the key IS published, and withdrawn", async () => {
    const r = await insightAdapter.verify(PKG_BYTES, { ...base, registry: reg(true), allowUnregisteredSigner: true });
    expect(r.verdict).toBe("UNVERIFIABLE");
    expect(r.reason).toBe("key_revoked");
  });

  it("the second channel: an address in the top-level `revoked_keys` array revokes the key", async () => {
    const r = await insightAdapter.verify(PKG_BYTES, { ...base, registry: reg(false, [ATTESTER]) });
    expect(r.verdict).toBe("UNVERIFIABLE");
    expect(r.reason).toBe("key_revoked");
    expect(String(r.annotations?.["identity_revoked_via"])).toContain("revoked_keys");
  });

  it("a `revoked_keys` entry naming the key_id, or an object carrying either ref, revokes it too", async () => {
    for (const entry of [
      "throwaway-under-test",
      { key_id: "throwaway-under-test", revoked_at: "2026-09-01T00:00:00.000Z" },
      { public_key: ATTESTER.toLowerCase(), reason: "compromise" },
    ]) {
      const r = await insightAdapter.verify(PKG_BYTES, { ...base, registry: reg(false, [entry]) });
      expect(r.reason, JSON.stringify(entry)).toBe("key_revoked");
    }
  });

  it("a `revoked_keys` entry in no shape this tool reads fails closed, and says which shapes it reads", async () => {
    const r = await insightAdapter.verify(PKG_BYTES, { ...base, registry: reg(false, [42]) });
    expect(r.verdict).toBe("UNVERIFIABLE");
    expect(r.reason).toBe("malformed_member");
    expect(r.stoppedAt).toBe("identity");
    expect(r.detail).toContain("cannot be read cannot be shown NOT to name signer");
    expect(r.detail).toContain("public_key");
  });

  it("revocation outranks a closed window: a key that is both says revoked, which no --now recovers", async () => {
    const r = JSON.parse(REG_BYTES.toString("utf8")) as Record<string, any>;
    r["public_keys"] = [
      { key_id: "throwaway-both", public_key: ATTESTER, algorithm: "EIP-712/secp256k1", validFrom: "2026-08-05", validUntil: "2026-09-02T05:00:00.000Z", revoked: true },
    ];
    const out = await insightAdapter.verify(PKG_BYTES, { ...base, registry: Buffer.from(JSON.stringify(r), "utf8") });
    expect(out.reason).toBe("key_revoked");
    expect(out.reason).not.toBe("expired");
  });

  it("CONTROL: the same package, the same key, not revoked on either channel, is VALID", async () => {
    const r = await insightAdapter.verify(PKG_BYTES, { ...base, registry: reg(false) });
    expect(r.verdict).toBe("VALID");
    expect(r.annotations?.["identity"]).toBe("signer_in_registry (throwaway-under-test)");
    // And the annotation that used to be the whole of the revocation handling
    // is gone from the VALID path, because a key reaching it is not revoked.
    expect(r.annotations?.["identity_revoked"]).toBeUndefined();
  });
});

// --------------------------------------------------------------------------

describe("insight — the resolver reads both revocation channels", () => {
  const parse = (mutate: (r: Record<string, any>) => void) => {
    const r = JSON.parse(read(INSIGHT_REGISTRY_1741).toString("utf8")) as Record<string, any>;
    mutate(r);
    const p = parseRegistry(Buffer.from(JSON.stringify(r), "utf8"), "synthetic");
    if ("error" in p) throw new Error(p.error);
    return p;
  };

  it("the four pinned registries all publish an EMPTY revoked_keys, which is why no pin covers this", () => {
    // Stated as a test so the reason these cases are synthetic is in the suite
    // and not only in prose: there is no revoked key in any bytes we hold.
    for (const f of [INSIGHT_REGISTRY, INSIGHT_REGISTRY_1154, INSIGHT_REGISTRY_1545, INSIGHT_REGISTRY_1741]) {
      const doc = JSON.parse(read(f).toString("utf8")) as Record<string, any>;
      expect(doc["revoked_keys"]).toEqual([]);
      for (const k of doc["public_keys"] as Record<string, unknown>[]) expect(k["revoked"]).toBe(false);
    }
    const live = parse(() => {});
    expect(live.revokedRefs).toEqual([]);
    expect(live.revocationListUnreadable).toEqual([]);
    expect(resolveRegistryKey(live, INSIGHT_KEY_202609, INSIGHT_NOW_1741).status).toBe("valid");
  });

  it("revocation on either channel resolves as revoked, and names which one", () => {
    const viaEntry = parse((r) => {
      (r["public_keys"] as Record<string, unknown>[])[1]!["revoked"] = true;
    });
    const a = resolveRegistryKey(viaEntry, INSIGHT_KEY_202609, INSIGHT_NOW_1741);
    expect(a.status).toBe("revoked");
    if (a.status !== "revoked") throw new Error("unreachable");
    expect(a.via).toContain("public_keys");

    const viaList = parse((r) => {
      r["revoked_keys"] = [{ key_id: "insight-oracle-safety-v2-202609" }];
    });
    const b = resolveRegistryKey(viaList, INSIGHT_KEY_202609, INSIGHT_NOW_1741);
    expect(b.status).toBe("revoked");
    if (b.status !== "revoked") throw new Error("unreachable");
    expect(b.via).toContain("revoked_keys");
  });

  it("an unreadable revoked_keys blocks EVERY key in that registry, not only the entry's subject", () => {
    // The point of failing closed: the entry might have named this key.
    const bad = parse((r) => {
      r["revoked_keys"] = [42];
    });
    for (const addr of [INSIGHT_KEY_V2, INSIGHT_KEY_202609]) {
      expect(resolveRegistryKey(bad, addr, INSIGHT_NOW_1530).status).toBe("revocation_list_unreadable");
    }
    // A member present but not even an array is unreadable in the same way.
    const notArray = parse((r) => {
      r["revoked_keys"] = "none";
    });
    expect(resolveRegistryKey(notArray, INSIGHT_KEY_202609, INSIGHT_NOW_1530).status).toBe("revocation_list_unreadable");
  });

  it("an ABSENT revoked_keys is not an unreadable one", () => {
    const gone = parse((r) => {
      delete r["revoked_keys"];
    });
    expect(gone.revocationListUnreadable).toEqual([]);
    expect(resolveRegistryKey(gone, INSIGHT_KEY_202609, INSIGHT_NOW_1741).status).toBe("valid");
  });

  it("a key the registry does not list is still not_found, revoked or not", () => {
    const withList = parse((r) => {
      r["revoked_keys"] = [ATTESTER];
    });
    expect(resolveRegistryKey(withList, ATTESTER, INSIGHT_NOW_1741).status).toBe("not_found");
  });
});

// --------------------------------------------------------------------------

/**
 * B-70: the registry moved for the first time since 2 September, and what it
 * added is the remedy H8 named.
 *
 * H8 (round-3 letter, `cc-output/YUTAO_ROUND3_2026-09-02.md` line 16) was that
 * the PRODUCTION key signed a synthetic sample whose 44 signed fields carried
 * nothing saying synthetic — the word SYNTHETIC lived in the unsigned wrapper,
 * so a party who stripped the wrapper held a genuine production-key signature
 * over a settlement that never happened. One of the three remedies named was a
 * key the registry itself labels as non-production. The 18:29Z pin publishes
 * exactly that, and both sample endpoints now sign with it.
 *
 * Every count below is COUNTED from the pinned bytes. The handoff that
 * commissioned this work relayed a fetch tool's summary saying ExecutionReceipt
 * v4 was published with 39 fields where the pin had 44; the assertion here is
 * that both pins publish 44 and the same 44, which is what that summary would
 * have gone red against.
 *
 * The old pins are untouched and every case above still runs against them.
 */
describe("insight — the 2026-09-05T18:29Z registry pin", () => {
  const NEW_BYTES = read(INSIGHT_REGISTRY_0905);
  const OLD_BYTES = read(INSIGHT_REGISTRY_1741);
  const neu = JSON.parse(NEW_BYTES.toString("utf8")) as Record<string, any>;
  const old = JSON.parse(OLD_BYTES.toString("utf8")) as Record<string, any>;

  it("is the single fetch of 2026-09-05T18:29:05Z, and is NOT the 17:41Z bytes", () => {
    expect(NEW_BYTES.length).toBe(17958);
    expect(sha256Hex(NEW_BYTES)).toBe("7cc00b957f14e1a954bcbff7dd0b5e97b9f4af1ef8c2e21cb9fa879339ce7330");
    // The 17:41Z and 15:45Z pins are byte-identical to each other. This one is
    // not: it is the first observation of this URL moving at all.
    expect(NEW_BYTES.equals(OLD_BYTES)).toBe(false);
    expect(sha256Hex(OLD_BYTES)).toBe("76522cd33edcb94a822a82cf6c70013f9d34489a39447912c28d8336fcc87ae2");
  });

  it("carries the same thirteen top-level members, in the same order", () => {
    expect(Object.keys(neu)).toEqual(Object.keys(old));
    expect(Object.keys(neu)).toHaveLength(13);
    for (const k of [
      "issuer",
      "mic",
      "attestation_enabled",
      "verify",
      "sample",
      "watch_verify",
      "watch_sample",
      "execution_verify",
      "execution_sample",
      "key_rotation_policy",
    ]) {
      expect(neu[k]).toEqual(old[k]);
    }
    expect(neu["revoked_keys"]).toEqual([]);
    expect(old["revoked_keys"]).toEqual([]);
  });

  it('publishes a THIRD key, role "sample", and changes neither of the two it already had', () => {
    expect(old["public_keys"]).toHaveLength(2);
    expect(neu["public_keys"]).toHaveLength(3);
    expect(neu["public_keys"].slice(0, 2)).toEqual(old["public_keys"]);
    const third = neu["public_keys"][2];
    expect(third["key_id"]).toBe("insight-oracle-safety-sample");
    expect(third["public_key"]).toBe(INSIGHT_KEY_SAMPLE);
    expect(third["algorithm"]).toBe("EIP-712/secp256k1");
    expect(third["validFrom"]).toBe("2026-09-03");
    expect(third["validUntil"]).toBeNull();
    expect(third["revoked"]).toBe(false);
    expect(third["role"]).toBe("sample");
    expect(String(third["note"])).toContain("SAMPLE ONLY");
    // `role` and `note` are members NO earlier pin published on any key. If the
    // registry ever puts a role on the production keys, this goes red.
    for (const k of old["public_keys"] as Record<string, unknown>[]) {
      expect(k["role"]).toBeUndefined();
      expect(k["note"]).toBeUndefined();
    }
    for (const k of neu["public_keys"].slice(0, 2) as Record<string, unknown>[]) {
      expect(k["role"]).toBeUndefined();
    }
  });

  it("still publishes ExecutionReceipt v4 with 44 fields — the same 44, in the same order", () => {
    const nf = neu["schemas"]["ExecutionReceipt"]["eip712"]["types"]["ExecutionReceipt"] as { name: string; type: string }[];
    const of = old["schemas"]["ExecutionReceipt"]["eip712"]["types"]["ExecutionReceipt"] as { name: string; type: string }[];
    expect(neu["schemas"]["ExecutionReceipt"]["schemaVersion"]).toBe(4);
    // Counted, not relayed. The handoff's summary said 39.
    expect(nf).toHaveLength(44);
    expect(of).toHaveLength(44);
    expect(nf).toEqual(of);
    expect(nf.map((f) => f.name).filter((n) => !of.map((g) => g.name).includes(n))).toEqual([]);
    expect(of.map((f) => f.name).filter((n) => !nf.map((g) => g.name).includes(n))).toEqual([]);
    expect(neu["schemas"]["ExecutionReceipt"]["eip712"]["domain"]).toEqual({ name: "Insight Execution", version: "1", chainId: 1 });
  });

  it("every other published schema is byte-equal to the 17:41Z pin's", () => {
    expect(Object.keys(neu["schemas"])).toEqual(Object.keys(old["schemas"]));
    for (const name of Object.keys(old["schemas"])) {
      if (name === "ExecutionReceipt") continue;
      expect(neu["schemas"][name]).toEqual(old["schemas"][name]);
    }
    // Counted from the bytes, so a silently reshaped retired layout is red here.
    const count = (n: string, pt: string): number => (neu["schemas"][n]["eip712"]["types"][pt] as unknown[]).length;
    expect(count("ExecutionReceiptV3", "ExecutionReceipt")).toBe(43);
    expect(count("ExecutionReceiptV2", "ExecutionReceipt")).toBe(32);
    expect(count("ExecutionReceiptV1", "ExecutionReceipt")).toBe(30);
    expect(count("OracleSafetyCheck", "OracleSafetyCheck")).toBe(27);
    expect(count("OracleSafetyCheckV2", "OracleSafetyCheck")).toBe(26);
    expect(count("OracleSafetyCheckV1", "OracleSafetyCheck")).toBe(11);
    expect(count("OracleSafetyRecheck", "OracleSafetyRecheck")).toBe(28);
    expect(count("OracleWatchCheck", "OracleWatchCheck")).toBe(26);
    expect(count("OracleWatchCheckV1", "OracleWatchCheck")).toBe(22);
    expect(count("CanonicalPreTradeRequest", "CanonicalPreTradeRequest")).toBe(5);
  });

  it("adds exactly three members under schemas.ExecutionReceipt and removes none", () => {
    const added = Object.keys(neu["schemas"]["ExecutionReceipt"]).filter((k) => !(k in old["schemas"]["ExecutionReceipt"]));
    const removed = Object.keys(old["schemas"]["ExecutionReceipt"]).filter((k) => !(k in neu["schemas"]["ExecutionReceipt"]));
    expect(added).toEqual(["commitments", "sentinels", "sampleSigningKeyRole"]);
    expect(removed).toEqual([]);
    // The registry now says, in the schema, which key role signs its samples.
    expect(neu["schemas"]["ExecutionReceipt"]["sampleSigningKeyRole"]).toBe("sample");
    expect(neu["schemas"]["ExecutionReceipt"]["sentinels"]["attestationAgeAtExecSeconds"]["value"]).toBe(4294967295);
    expect(String(neu["schemas"]["ExecutionReceipt"]["commitments"]["preTradeUidsHash"])).toContain("keccak256");
  });

  it("the sample key's window is read the same way every other key's is", () => {
    const p = parseRegistry(NEW_BYTES, "refs/insight-oracle-keys-2026-09-05T1829Z.json");
    if ("error" in p) throw new Error(p.error);
    expect(p.keys).toHaveLength(3);
    expect(p.revokedRefs).toEqual([]);
    expect(p.revocationListUnreadable).toEqual([]);
    // validFrom 2026-09-03: not_yet_valid at both 2 September instants, valid at
    // the instant the pin was taken.
    expect(resolveRegistryKey(p, INSIGHT_KEY_SAMPLE, INSIGHT_NOW_1530).status).toBe("not_yet_valid");
    expect(resolveRegistryKey(p, INSIGHT_KEY_SAMPLE, INSIGHT_NOW_1741).status).toBe("not_yet_valid");
    expect(resolveRegistryKey(p, INSIGHT_KEY_SAMPLE, INSIGHT_NOW_0905).status).toBe("valid");
    // The retired key is still retired, and the current one still open-ended.
    expect(resolveRegistryKey(p, INSIGHT_KEY_V2, INSIGHT_NOW_0905).status).toBe("expired");
    expect(resolveRegistryKey(p, INSIGHT_KEY_202609, INSIGHT_NOW_0905).status).toBe("valid");
  });

  /**
   * The gap this pin opens, asserted rather than described. `parseRegistry`
   * reads key_id, public_key, revoked and the window; it does not read `role`,
   * so nothing the adapter prints distinguishes a sample-role key from a
   * production one. Closing it means carrying `role` onto `RegistryKey` and
   * saying so on the result — not a one-line change, so it is recorded here and
   * in FINDINGS.md rather than done inside this handoff. This case goes red the
   * day it is closed, which is the point.
   */
  it('but the adapter does not yet read `role`, so nothing it prints says "sample"', () => {
    const p = parseRegistry(NEW_BYTES, "refs/insight-oracle-keys-2026-09-05T1829Z.json");
    if ("error" in p) throw new Error(p.error);
    const key = p.keys.find((k) => k.keyId === "insight-oracle-safety-sample");
    expect(key).toBeDefined();
    expect(Object.keys(key!).sort()).toEqual(["keyId", "malformedWindow", "publicKey", "revoked", "validFrom", "validUntil"]);
    expect((key as unknown as Record<string, unknown>)["role"]).toBeUndefined();
  });
});

// --------------------------------------------------------------------------

/**
 * H8, measured. Both endpoints the 18:29Z registry names were fetched at
 * 18:30Z and pinned as bytes; each mints a fresh signature per call, so these
 * are one observation and cannot be re-fetched.
 *
 * The recovery is driven red two ways per sample: a changed signed field moves
 * the recovered address to ONE SPECIFIC other address, which no implementation
 * that shortcut the digest could reproduce.
 */
describe("insight — the 18:30Z samples, and H8", () => {
  const NEW_BYTES = read(INSIGHT_REGISTRY_0905);
  const execWrapper = JSON.parse(read(INSIGHT_EXEC_SAMPLE_0905).toString("utf8")) as Record<string, any>;
  const safetyWrapper = JSON.parse(read(INSIGHT_SAFETY_SAMPLE_0905).toString("utf8")) as Record<string, any>;
  const execAtt = execWrapper["data"]["attestation"];
  const safetyAtt = safetyWrapper["data"]["attestation"];

  const newBase = (now: number): VerifyOptions => ({
    registry: NEW_BYTES,
    registryOrigin: "refs/insight-oracle-keys-2026-09-05T1829Z.json",
    now,
  });
  const oldBase = (now: number): VerifyOptions => ({
    registry: read(INSIGHT_REGISTRY_1741),
    registryOrigin: "refs/insight-oracle-keys-2026-09-02T1741Z.json",
    now,
  });
  const EXEC_NOW = 1788633057; // the exec sample's signedAt, to the second
  const SAFETY_NOW = 1788633059;

  it("both pins are the endpoint responses byte-exact", () => {
    expect(read(INSIGHT_EXEC_SAMPLE_0905).length).toBe(4894);
    expect(sha256Hex(read(INSIGHT_EXEC_SAMPLE_0905))).toBe("a2c442e02df4682899ee9707d0c695e17ce4f65029b2ccd7c67728061f143b5b");
    expect(read(INSIGHT_SAFETY_SAMPLE_0905).length).toBe(4052);
    expect(sha256Hex(read(INSIGHT_SAFETY_SAMPLE_0905))).toBe("28110d2f0ca8286168a457254afeb99204312b39ed751ba9cac38a81e32f6139");
    // Not copies of the 2 September sample.
    expect(read(INSIGHT_EXEC_SAMPLE_0905).equals(read(INSIGHT_SAMPLE_1741))).toBe(false);
  });

  it("execution_sample: uid == our digest, and recovery lands on the SAMPLE key", () => {
    const d = eip712Digest(execAtt.eip712.domain, execAtt.eip712.primaryType, execAtt.eip712.types, execAtt.data);
    expect(`0x${Buffer.from(d).toString("hex")}`).toBe("0xd6b8fcfb66b8862661c09a43e1bfd283d4397ecebf14fc478a64af814bec76b4");
    expect(`0x${Buffer.from(d).toString("hex")}`).toBe(execAtt.uid);
    expect(recoverAddress(d, execAtt.signature)?.toLowerCase()).toBe(INSIGHT_KEY_SAMPLE.toLowerCase());
    expect(execAtt.attester).toBe(INSIGHT_KEY_SAMPLE);
    expect(execAtt.schemaVersion).toBe(4);
    expect(execAtt.eip712.types.ExecutionReceipt).toHaveLength(44);
  });

  it("execution_sample: two tamper controls move the recovered address to two specific others", () => {
    const t1 = clone(execAtt);
    t1.data.environment = "nonproduction";
    expect(recoverAddress(eip712Digest(t1.eip712.domain, t1.eip712.primaryType, t1.eip712.types, t1.data), t1.signature)).toBe(
      "0x47ed0d0c7510512b1e21e3a7658e164e2bc9186e",
    );
    const t2 = clone(execAtt);
    t2.data.executedPrice = t2.data.executedPrice + 1;
    expect(recoverAddress(eip712Digest(t2.eip712.domain, t2.eip712.primaryType, t2.eip712.types, t2.data), t2.signature)).toBe(
      "0xa0b076050a01f7d29dcde5095465b876b8b0d2dc",
    );
  });

  it("sample (safety): uid == our digest, recovery lands on the same SAMPLE key, and a tamper moves it", () => {
    const d = eip712Digest(safetyAtt.eip712.domain, safetyAtt.eip712.primaryType, safetyAtt.eip712.types, safetyAtt.data);
    expect(`0x${Buffer.from(d).toString("hex")}`).toBe("0x2750ef636e144b42bd95a6857631e3e9d5338a13557a97a43aef0f4765235f5e");
    expect(`0x${Buffer.from(d).toString("hex")}`).toBe(safetyAtt.uid);
    expect(recoverAddress(d, safetyAtt.signature)?.toLowerCase()).toBe(INSIGHT_KEY_SAMPLE.toLowerCase());
    expect(safetyAtt.eip712.primaryType).toBe("OracleSafetyCheck");
    expect(safetyAtt.schemaVersion).toBe(3);
    const t = clone(safetyAtt);
    t.data.verdict = "FAIL";
    expect(recoverAddress(eip712Digest(t.eip712.domain, t.eip712.primaryType, t.eip712.types, t.data), t.signature)).toBe(
      "0x31ab7c4137aff89204e38e50da20c6fb1518a74e",
    );
  });

  it('H8 CLOSED IN PRODUCTION: the signer is the key the registry labels role "sample"', async () => {
    // The whole claim, end to end through the adapter: no flag, the key comes
    // out of the published registry, and the kid is the sample key's.
    const r = await insightAdapter.verify(Buffer.from(JSON.stringify(execAtt), "utf8"), newBase(EXEC_NOW));
    expect(r.verdict).toBe("VALID");
    expect(r.resolvedKey?.kid).toBe("insight-oracle-safety-sample");
    expect(r.resolvedKey?.origin).toBe("refs/insight-oracle-keys-2026-09-05T1829Z.json");
    expect(r.annotations?.["identity"]).toBe("signer_in_registry (insight-oracle-safety-sample)");
    expect(r.annotations?.["recovered_signer"]).toBe(INSIGHT_KEY_SAMPLE.toLowerCase());
    const entry = (JSON.parse(NEW_BYTES.toString("utf8")) as Record<string, any>)["public_keys"].find(
      (k: Record<string, unknown>) => String(k["public_key"]).toLowerCase() === INSIGHT_KEY_SAMPLE.toLowerCase(),
    );
    expect(entry["role"]).toBe("sample");
  });

  it("what H8 does NOT close: the 44 signed fields still carry no mark, and environment still says production", () => {
    // The 2026-09-02 case asserted this and it has not changed. What HAS changed
    // is where the mark lives: on the key, not in the fields.
    const signed = JSON.stringify(execAtt.data);
    for (const mark of ["SYNTHETIC", "synthetic", "Synthetic", "SAMPLE", "Sample", "demo", "DEMO", "Demo", "fake", "mock"]) {
      expect(signed.includes(mark)).toBe(false);
    }
    // No signed FIELD NAME and no signed VALUE carries the word either. (The
    // only substring hit anywhere near it is `test` inside the field name
    // attestationAgeAtExecSeconds, which is neither a value nor a mark.)
    expect(Object.keys(execAtt.data).some((k) => k.toLowerCase().includes("sample"))).toBe(false);
    expect(Object.values(execAtt.data).some((v) => typeof v === "string" && v.toLowerCase().includes("sample"))).toBe(false);
    expect(execAtt.data.environment).toBe("production");
    expect(execAtt.data.fillStatus).toBe("FULL");
    expect(execAtt.data.slippageSatisfied).toBe(true);
    // The wrapper still carries the words, and now says how to check it.
    expect(execWrapper["data"]["isSample"]).toBe(true);
    expect(String(execWrapper["data"]["note"])).toContain("SYNTHETIC");
    expect(String(execWrapper["data"]["note"])).toContain('role "sample"');
    expect(String(safetyWrapper["data"]["note"])).toContain('role "sample"');
  });

  it("against the 17:41Z pin both samples are UNVERIFIABLE/key_unresolvable — the key did not exist yet", async () => {
    for (const [att, now] of [
      [execAtt, EXEC_NOW],
      [safetyAtt, SAFETY_NOW],
    ] as const) {
      const r = await insightAdapter.verify(Buffer.from(JSON.stringify(att), "utf8"), oldBase(now));
      expect(r.verdict).toBe("UNVERIFIABLE");
      expect(r.reason).toBe("key_unresolvable");
      expect(r.annotations?.["identity"]).toBe("signer_not_in_registry");
      expect(String(r.detail)).toContain("is not among the 2 published keys");
    }
  });

  it("against the 18:29Z pin both are VALID, and the schema comparison finds the right published type", async () => {
    const e = await insightAdapter.verify(Buffer.from(JSON.stringify(execAtt), "utf8"), newBase(EXEC_NOW));
    expect(e.verdict).toBe("VALID");
    expect(e.annotations?.["registry_schema"]).toBe("match (v4)");
    const s = await insightAdapter.verify(Buffer.from(JSON.stringify(safetyAtt), "utf8"), newBase(SAFETY_NOW));
    expect(s.verdict).toBe("VALID");
    expect(s.reason).toBe("verified");
    expect(s.resolvedKey?.kid).toBe("insight-oracle-safety-sample");
    expect(s.annotations?.["registry_schema"]).toBe("match (v3)");
  });

  /**
   * The `validUntil` gap the handoff asked about, driven from bytes rather than
   * from reading the source.
   *
   * `resolveRegistryKey` compares the key's window against `ctx.now` (check 5,
   * `resolveRegistryKey(ctx.registry, art.attester, ctx.now)`), and `ctx.now` is
   * the CALLER's `--now`. The artefact's own signing instant never enters that
   * comparison. So a receipt signed AFTER a key's window shut still resolves
   * that key, provided the caller names an instant inside it — and the freshness
   * check (check 6) does not catch it either, because it only fails when `now`
   * is PAST the artefact's validUntil, never when it is before the artefact
   * existed.
   *
   * Demonstrated on the pinned 17:41Z sample against a registry built from the
   * 18:29Z bytes with that key's validUntil moved to 17:41:00Z — 63 s before the
   * receipt's own `executedAt` and 64 s before its `signedAt`. Nothing is
   * re-signed and no Insight key material is used.
   */
  it("a receipt signed after its key's window shut still resolves, if the caller names an earlier --now", async () => {
    const w = JSON.parse(read(INSIGHT_SAMPLE_1741).toString("utf8")) as Record<string, any>;
    const att = w["data"]["attestation"];
    expect(att.signedAt).toBe("2026-09-02T17:42:03.934Z");
    expect(att.data.executedAt).toBe(1788370923);
    const doc = JSON.parse(NEW_BYTES.toString("utf8")) as Record<string, any>;
    doc["public_keys"] = (doc["public_keys"] as Record<string, unknown>[]).map((k) =>
      k["public_key"] === INSIGHT_KEY_202609 ? { ...k, validUntil: "2026-09-02T17:41:00.000Z" } : k,
    );
    const shut = Buffer.from(JSON.stringify(doc), "utf8"); // 1788370860
    const bytes = Buffer.from(JSON.stringify(att), "utf8");
    const opts = { registry: shut, registryOrigin: "the 18:29Z pin with validUntil moved to 1788370860" };

    // The gap: --now inside the window, receipt signed after it closed. VALID.
    const inside = await insightAdapter.verify(bytes, { ...opts, now: 1788370800 });
    expect(inside.verdict).toBe("VALID");
    expect(inside.annotations?.["identity"]).toBe("signer_in_registry (insight-oracle-safety-v2-202609)");

    // The control: name an instant past the window and the same bytes are
    // UNVERIFIABLE/expired. So the window IS read — it is just read against the
    // wrong clock. What would close the gap is comparing the key's window
    // against the artefact's own signed executedAt/checkedAt as well.
    const after = await insightAdapter.verify(bytes, { ...opts, now: INSIGHT_NOW_1741 });
    expect(after.verdict).toBe("UNVERIFIABLE");
    expect(after.reason).toBe("expired");
    expect(after.annotations?.["identity"]).toBe("key_expired (insight-oracle-safety-v2-202609)");
  });
});
