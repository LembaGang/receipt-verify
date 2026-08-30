// T2 tests for the CPB construction: §4.1, §5, §5.1, §7.1.
//
// WHAT THESE TESTS ARE AND ARE NOT. They are written against the -02 text, not
// against the authors' vectors: no file under vectors/ is read here, and running
// the vectors is T3. Two kinds of assertion live below and they are labelled,
// because canon R40 says a test that pins an implementation to its own output is
// decoration wearing a green check:
//
//   TEXT-ANCHORED — the expected value is stated in, or forced by, the -02 text
//     (Appendix A's Step-2 object, §4.1's "no member is removed because its
//     value is JSON null", §7.1's leaf_input rule). These can go red against a
//     wrong implementation.
//   REGRESSION PIN — the expected value is our own computation, recorded so a
//     change moves it visibly. It proves nothing about conformance. Each one is
//     paired with a red-proof that breaks the pre-image and asserts the value
//     moves.

import { describe, expect, it } from "vitest";

import {
  admitAlgorithm,
  applyExclusionSet,
  canonicalDigestJcs,
  deriveIdentifier,
  identifiersEqual,
  incorrectLeafInputFromHexText,
  leafInput,
  verifyCarriedIdentifier,
  type PayloadClass,
} from "../../cpb/index.js";

const utf8 = (b: Uint8Array): string => Buffer.from(b).toString("utf8");

/** Appendix A, lines 1661-1664: payload class temperature-record. */
const TEMPERATURE_RECORD: PayloadClass = {
  name: "temperature-record",
  algorithm: "jcs",
  exclusionSet: ["record_id"],
  representation: "hex",
  carriedIdentifierField: "record_id",
};

// Appendix A Step 1, lines 1666-1673.
const APPENDIX_A_PAYLOAD = {
  station_id: "WS-42",
  timestamp: "2026-07-24T00:00:00Z",
  celsius: "21.3",
  record_id: null,
} as const;

// TEXT-ANCHORED. Appendix A Step 2 states the resulting object verbatim; JCS
// sorts its three members by name and emits no whitespace, so the pre-image is
// forced by the draft rather than chosen by us.
const APPENDIX_A_PREIMAGE =
  '{"celsius":"21.3","station_id":"WS-42","timestamp":"2026-07-24T00:00:00Z"}';

// REGRESSION PIN. Appendix A stops at "the result is the record_id value" and
// publishes no digest, so this is our computation, not the draft's.
const APPENDIX_A_DIGEST = "1009a072df7fc0bfc6fcf49ca2f194067f6c0136c871a88d4fbd66a13361c1d1";

describe("§4.1 algorithm jcs", () => {
  it("runs no normalization pass: null, empty array and empty object members survive", () => {
    // TEXT-ANCHORED, lines 568-569: "no member is removed because its value is
    // JSON null, an empty array, or an empty object."
    const r = canonicalDigestJcs({ a: null, b: [], c: {}, d: 1 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(utf8(r.value.preImage)).toBe('{"a":null,"b":[],"c":{},"d":1}');
  });

  it("produces a 64-character lowercase hex digest", () => {
    // TEXT-ANCHORED, lines 582-583: "The output is a 64-character ASCII string."
    const r = canonicalDigestJcs({ a: 1 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.hex).toMatch(/^[0-9a-f]{64}$/);
    expect(r.value.digest.length).toBe(32);
  });

  it("refuses a non-finite number rather than digesting a substitute", () => {
    const r = canonicalDigestJcs({ a: Infinity } as never);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("payload_non_finite_number");
  });

  it("refuses an undefined member, which the canonicalizer would drop silently", () => {
    const r = canonicalDigestJcs({ a: undefined, b: 1 } as never);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("payload_not_json");
  });

  it("refuses a Date, which the canonicalizer would stringify silently", () => {
    const r = canonicalDigestJcs({ a: new Date(0) } as never);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("payload_not_json");
  });
});

describe("§5 exclusion set", () => {
  it("removes the member rather than nulling it — Appendix A Step 2", () => {
    // TEXT-ANCHORED. Under jcs a retained `"record_id":null` would change the
    // pre-image, so this distinguishes removal from replacement.
    const reduced = applyExclusionSet(TEMPERATURE_RECORD, APPENDIX_A_PAYLOAD);
    expect(reduced.ok).toBe(true);
    if (!reduced.ok) return;
    expect(reduced.value).toEqual({
      station_id: "WS-42",
      timestamp: "2026-07-24T00:00:00Z",
      celsius: "21.3",
    });

    const digest = canonicalDigestJcs(reduced.value);
    expect(digest.ok).toBe(true);
    if (!digest.ok) return;
    expect(utf8(digest.value.preImage)).toBe(APPENDIX_A_PREIMAGE);
    expect(digest.value.hex).toBe(APPENDIX_A_DIGEST); // REGRESSION PIN
  });

  it("RED-PROOF: leaving the excluded null member in changes both pre-image and digest", () => {
    const notReduced = canonicalDigestJcs(APPENDIX_A_PAYLOAD);
    expect(notReduced.ok).toBe(true);
    if (!notReduced.ok) return;
    expect(utf8(notReduced.value.preImage)).not.toBe(APPENDIX_A_PREIMAGE);
    expect(notReduced.value.hex).not.toBe(APPENDIX_A_DIGEST);
  });

  it("matches top-level member names only", () => {
    // TEXT-ANCHORED, lines 590-592: "a member of the same name nested inside a
    // member's value is not removed."
    const cls: PayloadClass = { ...TEMPERATURE_RECORD, exclusionSet: ["id"] };
    const reduced = applyExclusionSet(cls, { id: "top", inner: { id: "nested" } });
    expect(reduced.ok).toBe(true);
    if (!reduced.ok) return;
    expect(reduced.value).toEqual({ inner: { id: "nested" } });
  });

  it("treats an absent excluded member as a no-op", () => {
    const reduced = applyExclusionSet(TEMPERATURE_RECORD, { station_id: "WS-42" });
    expect(reduced.ok).toBe(true);
    if (!reduced.ok) return;
    expect(reduced.value).toEqual({ station_id: "WS-42" });
  });

  it("refuses a non-empty exclusion set over a payload that is not an object", () => {
    const reduced = applyExclusionSet(TEMPERATURE_RECORD, [1, 2, 3]);
    expect(reduced.ok).toBe(false);
    if (reduced.ok) return;
    expect(reduced.reason).toBe("payload_not_object");
  });
});

describe("§5 carried derived identifier", () => {
  const sealed = { ...APPENDIX_A_PAYLOAD, record_id: APPENDIX_A_DIGEST };

  it("verifies a record whose carried identifier matches the recompute", () => {
    const r = verifyCarriedIdentifier(TEMPERATURE_RECORD, sealed);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.disposition).toBe("verified");
  });

  it("reports a mismatch as a defect in the record", () => {
    // TEXT-ANCHORED, lines 757-759: "the verifier MUST treat this as a defect in
    // the record."
    const tampered = { ...sealed, celsius: "21.4" };
    const r = verifyCarriedIdentifier(TEMPERATURE_RECORD, tampered);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("carried_identifier_mismatch");
    expect(r.disposition).toBe("failed");
  });

  it("separates a malformed identifier from a mismatched one", () => {
    const upper = { ...sealed, record_id: APPENDIX_A_DIGEST.toUpperCase() };
    const r = verifyCarriedIdentifier(TEMPERATURE_RECORD, upper);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("identifier_not_lowercase_hex");
  });

  it("refuses a class that carries the identifier without excluding it", () => {
    const cls: PayloadClass = { ...TEMPERATURE_RECORD, exclusionSet: [] };
    const r = verifyCarriedIdentifier(cls, sealed);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("carried_identifier_not_excluded");
  });

  it("refuses the plaintext payload when the class uses selective disclosure", () => {
    // TEXT-ANCHORED, lines 761-763: the identifier "MUST be computed over the
    // SD-encoded form of the payload, not the plaintext payload."
    const cls: PayloadClass = { ...TEMPERATURE_RECORD, selectiveDisclosure: true };
    const r = deriveIdentifier(cls, APPENDIX_A_PAYLOAD, { payloadForm: "plaintext" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("sd_encoded_form_required");
  });
});

describe("§5.1 representation", () => {
  it("refuses to compare a hex identifier with a raw one", () => {
    // TEXT-ANCHORED, lines 790-791: "A verifier MUST NOT silently coerce among
    // representations."
    const asHex = deriveIdentifier(TEMPERATURE_RECORD, APPENDIX_A_PAYLOAD);
    const asRaw = deriveIdentifier(
      { ...TEMPERATURE_RECORD, representation: "raw" },
      APPENDIX_A_PAYLOAD,
    );
    expect(asHex.ok && asRaw.ok).toBe(true);
    if (!asHex.ok || !asRaw.ok) return;

    const compared = identifiersEqual(asHex.value, asRaw.value);
    expect(compared.ok).toBe(false);
    if (compared.ok) return;
    expect(compared.reason).toBe("representation_mismatch");
  });

  it("compares two identifiers of the same representation", () => {
    const a = deriveIdentifier(TEMPERATURE_RECORD, APPENDIX_A_PAYLOAD);
    const b = deriveIdentifier(TEMPERATURE_RECORD, APPENDIX_A_PAYLOAD);
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    const compared = identifiersEqual(a.value, b.value);
    expect(compared.ok).toBe(true);
    if (!compared.ok) return;
    expect(compared.value).toBe(true);
  });

  it("declines the prefixed textual representation, which -02 names but never defines", () => {
    const r = deriveIdentifier(
      { ...TEMPERATURE_RECORD, representation: "prefixed-text" },
      APPENDIX_A_PAYLOAD,
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("representation_prefix_undefined");
    expect(r.disposition).toBe("unverified");
  });
});

describe("§7.1 leaf construction", () => {
  it("is the raw 32 bytes, not the 64 ASCII bytes of the hex text", () => {
    // TEXT-ANCHORED, lines 870-877. This test IS the failure the section exists
    // to prevent: both branches are computed and asserted to differ.
    const id = deriveIdentifier(TEMPERATURE_RECORD, APPENDIX_A_PAYLOAD);
    expect(id.ok).toBe(true);
    if (!id.ok || id.value.representation !== "hex") return;

    const correct = leafInput(id.value, { keysOnDerivedIdentifier: true });
    expect(correct.ok).toBe(true);
    if (!correct.ok) return;

    expect(correct.value.length).toBe(32);
    expect(Buffer.from(correct.value).toString("hex")).toBe(id.value.hex);

    const wrong = incorrectLeafInputFromHexText(id.value.hex);
    expect(wrong.length).toBe(64);
    expect(Buffer.from(wrong).equals(Buffer.from(correct.value))).toBe(false);
  });

  it("declines when the VDS does not key its log on the derived identifier", () => {
    // TEXT-ANCHORED, line 861: "This profile imposes no leaf construction on a
    // Verifiable Data Structure."
    const id = deriveIdentifier(TEMPERATURE_RECORD, APPENDIX_A_PAYLOAD);
    expect(id.ok).toBe(true);
    if (!id.ok) return;
    const r = leafInput(id.value, { keysOnDerivedIdentifier: false });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("leaf_not_keyed_on_derived_identifier");
  });

  it("accepts the raw representation without re-encoding it", () => {
    const id = deriveIdentifier(
      { ...TEMPERATURE_RECORD, representation: "raw" },
      APPENDIX_A_PAYLOAD,
    );
    expect(id.ok).toBe(true);
    if (!id.ok) return;
    const r = leafInput(id.value, { keysOnDerivedIdentifier: true });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(Buffer.from(r.value).toString("hex")).toBe(APPENDIX_A_DIGEST);
  });
});

describe("§4.2 / §4.3 / §14.1 withdrawn and unimplemented algorithms", () => {
  it("fails closed on cde-n under any vintage", () => {
    const r = admitAlgorithm("cde-n", { recordCommittedOn: "2020-01-01" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("algorithm_withdrawn_cde_n");
    expect(r.disposition).toBe("failed");
  });

  it("fails a jcs-n record committed on or after the withdrawal date", () => {
    const r = admitAlgorithm("jcs-n", { recordCommittedOn: "2026-08-18" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("algorithm_withdrawn_jcs_n");
    expect(r.disposition).toBe("failed");
  });

  it("reports a pre-withdrawal jcs-n record unverified, not failed", () => {
    // TEXT-ANCHORED, lines 649-651: "a verifier that declines to implement the
    // withdrawn construction MUST report the reference as unverified rather
    // than as failed."
    const r = admitAlgorithm("jcs-n", { recordCommittedOn: "2026-08-17" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("algorithm_withdrawn_jcs_n_historical");
    expect(r.disposition).toBe("unverified");
  });

  it("does not take the vintage allowance when no commit date is supplied", () => {
    const r = admitAlgorithm("jcs-n");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("algorithm_withdrawn_jcs_n_vintage_unknown");
    expect(r.disposition).toBe("unverified");
  });

  it("declines as-transmitted rather than guessing a byte-boundary selector", () => {
    const r = admitAlgorithm("as-transmitted");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("algorithm_not_implemented");
  });

  it("does not guess an unregistered algorithm token", () => {
    // TEXT-ANCHORED, lines 514-515: "verifiers MUST NOT guess the algorithm from
    // the payload shape."
    const r = admitAlgorithm("jcs2");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("algorithm_unknown");
  });

  it("admits jcs", () => {
    const r = admitAlgorithm("jcs");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.entry.digest).toBe("SHA-256");
    expect(r.value.entry.encoding).toBe("lowercase-hex-64");
  });
});
