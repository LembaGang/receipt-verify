// §7.1 Leaf Construction.
//
// The section opens by imposing nothing — "This profile imposes no leaf
// construction on a Verifiable Data Structure" — and then states one MUST for
// the case where the VDS keys its log on the derived identifier (lines 861-880):
//
//   leaf_input = bytes.fromhex(D)    -- correct: 32 raw bytes
//   leaf_input = D.encode("utf-8")   -- WRONG: 64 ASCII bytes
//
// WHAT THIS FUNCTION DELIBERATELY DOES NOT DO. It does not hash. §7.1 names the
// output "the log leaf input" and says a wrong one "produces a silently wrong
// leaf hash" — the hash is the VDS's, and the section's first sentence keeps it
// there. Appendix C.1.2 (line 1838, informative) describes the GAR field
// instance as "SHA-256 of the raw bytes of the derived identifier", which is
// what one particular VDS did with this input; folding that into the return
// value would import a VDS rule the profile explicitly declines to impose. See
// AMBIGUITY_LOG A17.

import { hexIdentifierOctets, type DerivedIdentifier } from "./derived-identifier.js";
import { fail, ok, type CpbResult } from "./types.js";

/**
 * What the Transparency Service's VDS keys its log on. §7.1's rule is
 * conditional — "Where a Transparency Service's VDS keys its log on the derived
 * identifier" — so a caller states whether that condition holds rather than
 * having this implementation assume it. See AMBIGUITY_LOG A16.
 */
export interface VdsKeying {
  readonly keysOnDerivedIdentifier: boolean;
}

/**
 * The log leaf input for a derived identifier, per §7.1.
 *
 * Returns the raw 32 octets in both representations: from `raw` directly, and
 * from `hex` by decoding — never by encoding the hex text. That decode is the
 * one conversion -02 expressly defines (§7.1), and it is defined for this
 * operation only; `identifiersEqual` still refuses to compare across
 * representations.
 */
export function leafInput(
  id: DerivedIdentifier,
  vds: VdsKeying,
): CpbResult<Uint8Array> {
  if (!vds.keysOnDerivedIdentifier) {
    return fail(
      "leaf_not_keyed_on_derived_identifier",
      "§7.1",
      "the VDS does not key its log on the derived identifier, and this profile imposes no leaf construction otherwise",
      "unverified",
    );
  }

  const octets = id.representation === "raw" ? ok(id.raw) : hexIdentifierOctets(id.hex);
  if (!octets.ok) return octets;

  // §7.1 states the leaf input as "the raw 32-byte value". Every algorithm this
  // document registers declares SHA-256 (§14.1 Table 3), so 32 is exact here;
  // §5 admits an algorithm registered elsewhere whose representation its own
  // entry declares, and that case would not be 32 — AMBIGUITY_LOG A15.
  if (octets.value.length !== 32) {
    return fail(
      "identifier_wrong_length",
      "§7.1",
      `leaf input is ${octets.value.length} octets, not the raw 32-byte value §7.1 requires`,
    );
  }

  return ok(octets.value);
}

/**
 * The construction §7.1 names as WRONG, kept as a named export so a test can
 * assert the two differ rather than a comment claiming they do. Never call this
 * to build a leaf.
 */
export const incorrectLeafInputFromHexText = (hex: string): Uint8Array =>
  new Uint8Array(Buffer.from(hex, "utf8"));
