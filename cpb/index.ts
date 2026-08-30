// Canonical Payload Binding — an independent TypeScript implementation of
// draft-mih-sokolov-scitt-payload-binding-02, sections 4.1, 5 (with 5.1) and
// 7.1, written from the draft text alone.
//
// Pinned inputs, provenance and the constraint this was written under:
// cpb/PROVENANCE_T1.md. Every under-determined reading: cpb/AMBIGUITY_LOG.md.
//
// WHAT IS NOT HERE, and why:
//   §4.2 jcs-n, §4.3 cde-n — withdrawn. Present only as the fail-closed
//        rejections those sections require of a verifier, in algorithm.ts.
//   §4.4 as-transmitted — registered and live, but outside the three sections
//        this exercise covers. Declined explicitly rather than attempted.
//   §8   typed digest references — not implemented. Checked whether §5 or §7.1
//        depends on it: §5 (lines 733-798) and §7.1 (lines 859-883) reference
//        §5.1 and RFC 9943 and cite no part of §8, and §8 is reached only from
//        §12.4's citation rule, which is outside these three sections.
//   §6   envelope conventions, §10 discovery mirror — COSE-layer obligations,
//        outside the three sections.

export { assertJsonValue, canonicalDigestJcs, jcsPreImage, type CanonicalDigest } from "./canonical-digest.js";
export {
  ALGORITHM_TOKENS,
  CANONICALIZATION_ALGORITHM_REGISTRY,
  JCS_N_WITHDRAWN_ON,
  admitAlgorithm,
  type Admission,
  type AdmissionContext,
  type AlgorithmToken,
  type RegistryEntry,
} from "./algorithm.js";
export {
  applyExclusionSet,
  deriveIdentifier,
  hexIdentifierOctets,
  identifiersEqual,
  verifyCarriedIdentifier,
  type CarriedIdentifierCheck,
  type DeclaredRepresentation,
  type DeriveOptions,
  type DerivedIdentifier,
  type PayloadClass,
  type PayloadForm,
} from "./derived-identifier.js";
export { incorrectLeafInputFromHexText, leafInput, type VdsKeying } from "./leaf.js";
export { fail, ok, type CpbFailure, type CpbReason, type CpbResult, type Disposition, type JsonValue } from "./types.js";
