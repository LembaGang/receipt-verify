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
import { insightAdapter, detect, eip712Digest, findDuplicateKey, recoverAddress, FORMAT } from "../src/adapters/insight.js";
import { evidenceActionAdapter } from "../src/adapters/evidence-action.js";
import { verificationStateAdapter } from "../src/adapters/verification-state.js";
import { actaAdapter } from "../src/adapters/acta.js";
import { detectFormat } from "../src/detect.js";
import type { VerifyOptions, VerifyResult } from "../src/types.js";
import { FIX, INSIGHT_NOW, INSIGHT_PKG, INSIGHT_REGISTRY, read, sha256Hex } from "./helpers.js";

const PKG_BYTES = read(INSIGHT_PKG);
const REG_BYTES = read(INSIGHT_REGISTRY);
const pkg = JSON.parse(PKG_BYTES.toString("utf8")) as Record<string, any>;

const ATTESTER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

const base: VerifyOptions = {
  registry: REG_BYTES,
  registryOrigin: "refs/insight-oracle-keys-2026-09-02.json",
  now: INSIGHT_NOW,
  allowUnregisteredSigner: true,
};

const bytesOf = (v: unknown): Buffer => Buffer.from(JSON.stringify(v), "utf8");
const verify = (v: unknown, extra: Partial<VerifyOptions> = {}): Promise<VerifyResult> =>
  insightAdapter.verify(bytesOf(v), { ...base, ...extra });
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

  // …but the PINNED registry does not publish that type. The verification note's
  // A8/B6 record the registry's ExecutionReceipt as the same 32 fields; at
  // 09:09Z it is 43 fields under an unchanged schemaVersion 1. This test asserts
  // what the bytes in refs/ actually say, so that if the registry is re-pinned
  // and the divergence is gone, this test goes red and someone reads why.
  // See fixtures/provenance.md, "Appended 2026-09-02".
  it("the pinned registry publishes a 43-field ExecutionReceipt, still under schemaVersion 1", () => {
    const live = JSON.parse(REG_BYTES.toString("utf8")) as any;
    const er = live.schemas.ExecutionReceipt;
    expect(er.schemaVersion).toBe(1);
    expect(er.eip712.types.ExecutionReceipt).toHaveLength(43);
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
    expect(insightFixtures.length).toBe(1);
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
