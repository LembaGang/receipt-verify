/**
 * The daily anchor (B-89): tools/anchor.mjs, offline.
 *
 * No test here calls a calendar. Proofs are built with the library's own
 * classes -- a sha256 file digest, an append-and-hash path, then a pending or a
 * Bitcoin attestation at the tip -- which is the shape a calendar returns. The
 * network path is exercised once per session by a real `stamp` into a scratch
 * directory, and its proof is checked by the stock Python client; that evidence
 * lives in the session report, not here.
 *
 * Each outcome has the input that turns it red beside the input that keeps it
 * green: a pass that no input could fail would say nothing.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "./helpers.js";
import {
  SCHEMA,
  assess,
  blobAt,
  buildDocument,
  isDate,
  previousAnchor,
  proofAttestations,
  readProof,
  sha256Hex,
  stampDocument,
  upgradeProof,
} from "../tools/anchor.mjs";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OTS: any = require("opentimestamps");

const DATE = "2026-10-08";
const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
const HEAD = git(ROOT, "rev-parse", "HEAD");
const INDEX = blobAt(ROOT, "HEAD", "registry/index.json") as Buffer;
const DRIFT = Buffer.from('{"header":{"tool":"tools/drift.ts"},"body":[]}\n');

function doc(over: Partial<Parameters<typeof buildDocument>[0]> = {}) {
  return buildDocument({
    date: DATE,
    masterCommit: HEAD,
    verified: true,
    verifiedRange: "full",
    driftJson: DRIFT,
    driftRc: 0,
    driftLog: Buffer.from("drift: 0 moved\n"),
    registryIndex: INDEX,
    generatedAt: "2026-10-08T06:31:02Z",
    ...over,
  });
}

/** A proof over sha256(docBytes) whose tip carries `atts`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function proof(docBytes: Buffer, atts: any[]): Buffer {
  const d = OTS.DetachedTimestampFile.fromHash(new OTS.Ops.OpSHA256(), new Uint8Array(createHash("sha256").update(docBytes).digest()));
  const tip = d.timestamp.add(new OTS.Ops.OpAppend(Array.from(Buffer.from("00112233445566778899aabbccddeeff", "hex")))).add(new OTS.Ops.OpSHA256());
  for (const a of atts) tip.attestations.push(a);
  return Buffer.from(d.serializeToBytes());
}
const pending = () => new OTS.Notary.PendingAttestation("https://alice.btc.calendar.opentimestamps.org");
const bitcoin = (h: number) => new OTS.Notary.BitcoinBlockHeaderAttestation(h);

// Layout of a detached proof: 31 bytes of magic, a one-byte major version, the
// one-byte sha256 op tag, then the 32-byte file digest.
const DIGEST_AT = 33;

describe("anchor -- the document", () => {
  it("is deterministic, in a fixed member order, and its digests recompute from the input bytes", () => {
    const a = doc();
    const b = doc();
    expect(a.bytes.equals(b.bytes)).toBe(true);
    expect(Object.keys(a.doc)).toEqual([
      "schema", "date", "master_commit", "master_commit_verified", "master_commit_verified_range",
      "drift_json_sha256", "drift_json_absent_reason", "drift_exit_code", "drift_log_sha256",
      "registry_index_sha256", "generated_at",
    ]);
    expect(a.doc.schema).toBe(SCHEMA);
    expect(a.doc.drift_json_sha256).toBe(createHash("sha256").update(DRIFT).digest("hex"));
    expect(a.doc.registry_index_sha256).toBe(createHash("sha256").update(INDEX).digest("hex"));
    expect(a.doc.drift_json_absent_reason).toBeNull();
    expect(a.bytes.toString("utf8").endsWith("}\n")).toBe(true);
  });

  it("negative control: one changed byte of drift output changes the document's digest", () => {
    const changed = doc({ driftJson: Buffer.from(DRIFT.toString().replace("[]", "[1]")) });
    expect(sha256Hex(changed.bytes)).not.toBe(sha256Hex(doc().bytes));
  });

  it("with no drift JSON, says null and gives the reason, and the day is still a document", () => {
    const d = doc({ driftJson: null, driftAbsentReason: "the drift run produced no walker/drift.json (drift exit code 2)", driftRc: 2 });
    expect(d.doc.drift_json_sha256).toBeNull();
    expect(d.doc.drift_json_absent_reason).toMatch(/exit code 2/);
    expect(d.doc.drift_exit_code).toBe(2);
  });

  it("isDate refuses what is not a calendar date", () => {
    expect(isDate("2026-10-08")).toBe(true);
    for (const s of ["2026-02-30", "2026-13-01", "26-10-08", "2026-10-08T00:00Z", ""]) expect(isDate(s)).toBe(false);
  });
});

describe("anchor -- verify: pending, attested, mismatch, malformed, missing", () => {
  const { bytes } = doc();

  it("a proof carrying only a calendar attestation is pending", () => {
    const r = assess({ date: DATE, docBytes: bytes, otsBytes: proof(bytes, [pending()]), driftJsonBytes: DRIFT });
    expect(r.outcome).toBe("pending");
    expect(r.checks).toEqual({ proof_commits_to_document: true, drift_json_matches: true, bound_to_repository: true });
    expect(r.attestations).toEqual([{ kind: "pending", uri: "https://alice.btc.calendar.opentimestamps.org" }]);
  });

  it("a proof carrying a Bitcoin attestation is attested, with the lowest height", () => {
    const r = assess({ date: DATE, docBytes: bytes, otsBytes: proof(bytes, [pending(), bitcoin(866001), bitcoin(866000)]), driftJsonBytes: DRIFT });
    expect(r.outcome).toBe("attested");
    expect(r.bitcoin_height).toBe(866000);
    expect(r.reason).toMatch(/offline, not against the block/);
  });

  it("every attestation on one message is reported, which the library's allAttestations() would not do", () => {
    const { detached } = readProof(proof(bytes, [pending(), bitcoin(866000)]));
    expect(proofAttestations(detached).map((a: { kind: string }) => a.kind).sort()).toEqual(["bitcoin", "pending"]);
  });

  it("RED: a document changed by one byte after stamping is a mismatch", () => {
    const ots = proof(bytes, [pending()]);
    // Same length, four bytes different: the digest, not the size, has to catch it.
    const edited = Buffer.from(bytes.toString("utf8").replace('"master_commit_verified": true', '"master_commit_verified": fals'));
    expect(edited.length).toBe(bytes.length);
    expect(edited.equals(bytes)).toBe(false);
    expect(assess({ date: DATE, docBytes: edited, otsBytes: ots, driftJsonBytes: DRIFT }).outcome).toBe("mismatch");
  });

  it("RED: a hand-corrupted .ots -- one flipped bit in its file digest -- is a mismatch", () => {
    const ots = proof(bytes, [pending()]);
    const bad = Buffer.from(ots);
    bad[DIGEST_AT + 7] ^= 0x01;
    // control: the uncorrupted copy at that offset IS the document's digest
    expect(ots.subarray(DIGEST_AT, DIGEST_AT + 32).toString("hex")).toBe(sha256Hex(bytes));
    const r = assess({ date: DATE, docBytes: bytes, otsBytes: bad, driftJsonBytes: DRIFT });
    expect(r.outcome).toBe("mismatch");
    expect(r.reason).toMatch(/the proof commits to/);
  });

  it("RED: a hand-corrupted .ots -- bad magic, or truncated -- is malformed", () => {
    const ots = proof(bytes, [pending()]);
    const badMagic = Buffer.from(ots);
    badMagic[0] ^= 0xff;
    expect(assess({ date: DATE, docBytes: bytes, otsBytes: badMagic, driftJsonBytes: DRIFT }).outcome).toBe("malformed");
    // The library alone parses a truncated proof as pending; the round-trip rule catches it.
    const truncated = ots.subarray(0, ots.length - 5);
    expect(OTS.DetachedTimestampFile.deserialize(new Uint8Array(truncated))).toBeTruthy();
    const r = assess({ date: DATE, docBytes: bytes, otsBytes: truncated, driftJsonBytes: DRIFT });
    expect(r.outcome).toBe("malformed");
    expect(r.reason).toMatch(/re-serialize/);
  });

  it("every example proof the library ships round-trips, so the rule rejects no well-formed proof we know of", () => {
    const dir = join(ROOT, "node_modules", "opentimestamps", "examples");
    const names = readdirSync(dir).filter((f) => f.endsWith(".ots"));
    expect(names.length).toBeGreaterThanOrEqual(11);
    for (const f of names) expect(readProof(readFileSync(join(dir, f))).error, f).toBeNull();
  });

  it("a proof with no attestation at all is malformed, not pending", () => {
    expect(assess({ date: DATE, docBytes: bytes, otsBytes: proof(bytes, []), driftJsonBytes: DRIFT }).outcome).toBe("malformed");
  });

  it("drift bytes that are not the bytes the document hashed are a mismatch, and so are absent ones", () => {
    const ots = proof(bytes, [pending()]);
    expect(assess({ date: DATE, docBytes: bytes, otsBytes: ots, driftJsonBytes: Buffer.from("{}\n") }).outcome).toBe("mismatch");
    expect(assess({ date: DATE, docBytes: bytes, otsBytes: ots, driftJsonBytes: null }).outcome).toBe("mismatch");
  });

  it("a document naming a commit this history does not have, or the wrong registry index, is a mismatch", () => {
    const ghost = doc({ masterCommit: "0".repeat(40) });
    expect(assess({ date: DATE, docBytes: ghost.bytes, otsBytes: proof(ghost.bytes, [pending()]), driftJsonBytes: DRIFT }).reason).toMatch(/not a commit in this repository/);
    const wrongIdx = doc({ registryIndex: Buffer.from("{}") });
    const r = assess({ date: DATE, docBytes: wrongIdx.bytes, otsBytes: proof(wrongIdx.bytes, [pending()]), driftJsonBytes: DRIFT });
    expect(r.outcome).toBe("mismatch");
    expect(r.reason).toMatch(/registry\/index\.json at/);
  });

  it("a document filed under another date is a mismatch", () => {
    expect(assess({ date: "2026-10-09", docBytes: bytes, otsBytes: proof(bytes, [pending()]), driftJsonBytes: DRIFT }).outcome).toBe("mismatch");
  });

  it("a missing document or a missing proof is missing", () => {
    expect(assess({ date: DATE, docBytes: null, otsBytes: null }).outcome).toBe("missing");
    expect(assess({ date: DATE, docBytes: bytes, otsBytes: null }).outcome).toBe("missing");
  });
});

describe("anchor -- the CLI's exit contract, through --dir", () => {
  const { bytes } = doc();
  const run = (dir: string) => spawnSync(process.execPath, [join(ROOT, "tools", "anchor.mjs"), "verify", DATE, "--dir", dir], { cwd: ROOT, encoding: "utf8" });
  const dayDir = (ots: Buffer | null) => {
    const d = mkdtempSync(join(tmpdir(), "rv-anchor-"));
    writeFileSync(join(d, `${DATE}.json`), bytes);
    writeFileSync(join(d, `${DATE}.drift.json`), DRIFT);
    if (ots) writeFileSync(join(d, `${DATE}.json.ots`), ots);
    return d;
  };

  it("pending exits 0 and stdout is one JSON object", () => {
    const r = run(dayDir(proof(bytes, [pending()])));
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout).outcome).toBe("pending");
  });

  it("RED: the corrupted copy exits 1", () => {
    const bad = proof(bytes, [pending()]);
    bad[DIGEST_AT] ^= 0x80;
    const r = run(dayDir(bad));
    expect(r.status).toBe(1);
    expect(JSON.parse(r.stdout).outcome).toBe("mismatch");
  });

  it("a missing proof exits 2", () => {
    const r = run(dayDir(null));
    expect(r.status).toBe(2);
    expect(JSON.parse(r.stdout).outcome).toBe("missing");
  });
});

describe("anchor -- stamp and upgrade, with the calendar injected", () => {
  const { bytes } = doc();

  it("a stamp no calendar answered is refused, never written as an empty proof", async () => {
    await expect(stampDocument(bytes, async () => undefined)).rejects.toThrow(/no calendar returned an attestation/);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calendarAnswers = async (d: any) => {
    d.timestamp.add(new OTS.Ops.OpAppend([1, 2, 3])).add(new OTS.Ops.OpSHA256()).attestations.push(pending());
  };

  it("a stamp a calendar answered is a pending proof over the document", async () => {
    const ots = await stampDocument(bytes, calendarAnswers);
    expect(assess({ date: DATE, docBytes: bytes, otsBytes: ots, driftJsonBytes: DRIFT }).outcome).toBe("pending");
  });

  it("an upgrade that found nothing returns null, so the proof is not rewritten", async () => {
    expect(await upgradeProof(bytes, proof(bytes, [pending()]), async () => false)).toBeNull();
  });

  it("an upgrade that found a block returns new bytes that are attested over the same document", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blockArrived = async (d: any) => {
      const walk = (ts: any): any => (ts.attestations.length ? ts : walk([...ts.ops.values()][0]));
      walk(d.timestamp).add(new OTS.Ops.OpSHA256()).attestations.push(bitcoin(866123));
      return true;
    };
    const next = await upgradeProof(bytes, proof(bytes, [pending()]), blockArrived);
    expect(next).not.toBeNull();
    const r = assess({ date: DATE, docBytes: bytes, otsBytes: next as Buffer, driftJsonBytes: DRIFT });
    expect(r.outcome).toBe("attested");
    expect(r.bitcoin_height).toBe(866123);
  });

  it("RED: an upgrade is refused for a proof that does not commit to the document", async () => {
    const other = doc({ generatedAt: "2026-10-08T06:31:03Z" }).bytes;
    await expect(upgradeProof(bytes, proof(other, [pending()]), async () => true)).rejects.toThrow(/does not commit to the document/);
  });
});

describe("anchor -- the previous anchored commit, read from the anchors branch", () => {
  it("is the latest day before the given date, and absent when there is no branch", () => {
    const repo = mkdtempSync(join(tmpdir(), "rv-anchors-branch-"));
    git(repo, "init", "-q", "-b", "anchors");
    git(repo, "config", "user.email", "t@example.invalid");
    git(repo, "config", "user.name", "t");
    git(repo, "config", "commit.gpgsign", "false");
    mkdirSync(join(repo, "anchors"));
    const day = (d: string, c: string) => writeFileSync(join(repo, "anchors", `${d}.json`), JSON.stringify({ schema: SCHEMA, date: d, master_commit: c }) + "\n");
    day("2026-10-01", "a".repeat(40));
    day("2026-10-03", "b".repeat(40));
    writeFileSync(join(repo, "anchors", "2026-10-02.drift.json"), "{}\n"); // not a day document
    git(repo, "add", "-A");
    git(repo, "commit", "-q", "-m", "days");

    expect(previousAnchor(repo, "anchors", "2026-10-03")).toEqual({ date: "2026-10-01", commit: "a".repeat(40) });
    expect(previousAnchor(repo, "anchors", "2026-10-04")).toEqual({ date: "2026-10-03", commit: "b".repeat(40) });
    expect(previousAnchor(repo, "anchors", "2026-10-01")).toBeNull();
    expect(previousAnchor(repo, "no-such-ref", "2026-10-04")).toBeNull();
  });
});
