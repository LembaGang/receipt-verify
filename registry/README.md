# The receipt-verify registry

This is a public record of executed verifications. Every record names what was verified, the pinned bytes it was verified against, the verifier and version that ran, the time, what the run established, what it did not establish, and the person who consented to be named. Verification of any receipt is free, always. A paid entry buys the run and the published record, never the verdict.

Rules.

1. No record without an executed run, pinned inputs, an anchored result and a named consenting human. Records of the kind "observation" are built from public bytes about a party who has not consented; they carry no consent, name no one beyond what the bytes show, and are not entries.
2. A record is keyed on the format, the format version, the digest of the upstream bytes, the verifier version and the time of verification. No vendor name is a key.
3. Published records are immutable. A record is corrected by a new dated record that supersedes it; the superseded record stays visible with a forward pointer, and the new record says whether the artefact changed, the assessment was wrong, or both.
4. Every record states what it established and what it did not, as of a named upstream digest and date.
5. A record is labelled unverified until a party other than the assessor and the implementer has re-run it and is named. That label is computed by the build, not written by hand.
6. A graded party receives an entry before publication and has fourteen days to recompute and object. A reply of any length is published beside the record, unedited.
7. The index records the digest of its previous version, and the check walks that chain through the signed history.

Interests. The editor of this methodology authors draft-msebenzi-evidence-action, builds Chirindo, an operator-run gate that signs receipts of MCP calls, and maintains receipt-verify, the tool that produces the findings this methodology governs. Those occupy the same ground as the formats graded under it. Independence is not claimed. What is claimed is that every value in a finding recomputes from pinned bytes by anyone with the tool or without it, that every scope is cited to the document that names it, and that text and implementation are scored separately, a rule that came from the author of one of the formats graded. Where a judgment call was made, it is marked as one. This paragraph stands, in these words, at the end of every finding published under this methodology.

How a record is added: a folder under records/, a record.json that validates against schema/record.schema.json, the inputs it names present in the tree at the digests it names, npm run registry, and a signed commit. How a record is cited: its id and the commit that added it (npm run registry -- --check prints the table), never HEAD.

One disclosed break under rule 7. The index committed at d8b214448ee0b4e39f6bf814c7d5c631fe395ca9 carries previous_index_sha256 null, where rule 7 requires f3fd379d06dee26b6a2ee07b3702dfeb12cd8f052a9b8f8b38f39ac9ea7a1226, the digest of the index bytes at the commit before it, 842e4265e0e40553be1c8ee8eadc223f8c8c7512. The cause was a build that kept the committed link whenever a rebuild changed no record, which is fixed and is now tested against. That commit was never pushed, and a signed commit here is a statement that is never amended, so the break is disclosed rather than erased. npm run registry -- --check prints it as a notice on every run, index.json carries it as disclosed_chain_breaks, and it is recorded as a weakening of rule 7 and not as a repair. The list is closed: an entry may be added only for history that was never pushed, and never after a push.

Paths. Every path member in a record.json and in an index row is relative to the repository root.
