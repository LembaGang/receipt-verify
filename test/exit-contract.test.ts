// EXIT-CONTRACT CONFORMANCE — the one test that runs the built binary as a
// process and reads the channel every shell consumer actually reads.
//
// Why this file exists. `exitCodeFor()` is the single enforced place the
// tri-state contract lives, and every other test in this suite calls it, or
// `run()`, in-process. The process exit status is derived from it downstream at
// the bottom of src/cli.ts, by convention, where nothing looked. That gap is not
// hypothetical: 0.1.0 shipped with a remote `--jwks` aborting the process with a
// libuv assertion and returning 127 for EVERY verdict, while the `--json`
// payload in the same run reported `"exit_code": 0`. The verdict was right, the
// reason was right, and the number the shell branches on was wrong.
//
// So the assertion here is deliberately narrow and deliberately redundant with
// nothing: for each cell, the process's exit status MUST equal the `exit_code`
// the payload reports. Two channels, one invocation, no room to disagree.
//
// The matrix is (JWKS from a file | JWKS over https) x (VALID | INVALID |
// UNVERIFIABLE). The https half is what makes it falsifiable — it is the only
// path that puts a `fetch()` in the process before it exits, and it is the half
// that was red when this file was written.
//
// The https column is served by a loopback TLS server whose throwaway cert is
// generated into a temp dir at test time and never enters the repository. It
// serves this repository's own fixture JWKS bytes, so the verdicts are the same
// ones the local column asserts.
//
// WHAT THE LOOPBACK COLUMN DOES NOT COVER — read this before trusting it.
// The 0.1.0 crash was a teardown RACE: `process.exit()` running while a socket
// to a real host was still closing. Loopback settles inside the same tick, so
// the race never opens and this column stayed GREEN against the broken build.
// Measured on the 0.1.0 code:
//
//   remote fetch + immediate process.exit(0)      -> assertion, 127
//   remote fetch + 300ms settle + process.exit(0) -> clean, 0
//   loopback fetch + immediate process.exit(0)    -> clean, 0
//
// So the loopback column is regression cover for the contract, NOT evidence
// about the race. The cell that actually reproduced it is the live one at the
// bottom of this file, gated on RECEIPT_VERIFY_LIVE like test/live-jwks.test.ts.
// If you are here because you changed how the CLI exits, run the live tier.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { spawn, execFileSync } from "node:child_process";
import { createServer, type Server } from "node:https";
import { mkdtempSync, readFileSync, rmSync, existsSync, statSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { EVIDENCE, ROOT, THROWAWAY_JWKS } from "./helpers.js";

const CLI = join(ROOT, "dist", "cli.js");

/** The built binary is the subject. A stale one would test the wrong bytes. */
function buildIfStale(): void {
  const newestSrc = readdirSync(join(ROOT, "src"), { recursive: true, encoding: "utf8" })
    .map((p) => join(ROOT, "src", p))
    .filter((p) => p.endsWith(".ts"))
    .reduce((max, p) => Math.max(max, statSync(p).mtimeMs), 0);
  if (existsSync(CLI) && statSync(CLI).mtimeMs >= newestSrc) return;
  execFileSync("npx", ["tsc", "-p", "tsconfig.json"], { cwd: ROOT, shell: true, stdio: "pipe" });
}

let server: Server;
let base: string;
let tmp: string;
let caPath: string;

/** Self-signed loopback cert, generated per-run into a temp dir. Never committed. */
function makeCert(dir: string): { key: string; cert: string } {
  execFileSync(
    "openssl",
    [
      "req", "-x509", "-newkey", "rsa:2048", "-nodes",
      "-keyout", join(dir, "key.pem"),
      "-out", join(dir, "cert.pem"),
      "-days", "1", "-subj", "/CN=127.0.0.1",
      "-addext", "subjectAltName=IP:127.0.0.1",
    ],
    { stdio: "pipe" },
  );
  return { key: join(dir, "key.pem"), cert: join(dir, "cert.pem") };
}

beforeAll(async () => {
  buildIfStale();
  tmp = mkdtempSync(join(tmpdir(), "rv-exit-contract-"));
  const { key, cert } = makeCert(tmp);
  caPath = cert;

  // Two documents: the one that resolves the fixture's kid, and one that does
  // not. The second is what makes an https UNVERIFIABLE cell reachable AFTER a
  // successful fetch — the fetch must happen, or the cell proves nothing.
  const good = readFileSync(join(EVIDENCE, "jwks.json"), "utf8");
  const other = readFileSync(THROWAWAY_JWKS, "utf8");

  server = createServer({ key: readFileSync(key), cert: readFileSync(cert) }, (req, res) => {
    const body = req.url === "/other-jwks.json" ? other : good;
    res.writeHead(200, { "content-type": "application/json" }).end(body);
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const addr = server.address();
  if (addr === null || typeof addr === "string") throw new Error("no port");
  base = `https://127.0.0.1:${addr.port}`;
});

afterAll(async () => {
  await new Promise<void>((r) => server.close(() => r()));
  rmSync(tmp, { recursive: true, force: true });
});

interface Ran {
  status: number | null;
  payload: { verdict: string; reason: string; exit_code: number };
  raw: string;
}

/**
 * Async on purpose. `spawnSync` blocks this process's event loop, which starves
 * the loopback server below and turns every https cell into a 5s fetch timeout —
 * an `io_error` that reads as UNVERIFIABLE and makes the UNVERIFIABLE cell pass
 * for entirely the wrong reason.
 */
async function runCli(args: string[]): Promise<Ran> {
  const child = spawn(process.execPath, [CLI, ...args], {
    env: { ...process.env, NODE_EXTRA_CA_CERTS: caPath },
  });
  let out = "";
  child.stdout.on("data", (d) => (out += d));
  child.stderr.on("data", (d) => (out += d));
  const status = await new Promise<number | null>((resolve) => {
    child.on("close", (code) => resolve(code));
  });
  // A non-zero verdict prints to stderr (src/cli.ts), and a crashing runtime may
  // append its own line to stderr after the payload. Take the object, not the tail.
  const start = out.indexOf("{");
  const end = out.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error(`no JSON payload in output:\n${out}`);
  return { status, payload: JSON.parse(out.slice(start, end + 1)), raw: out };
}

const ALLOW = join(EVIDENCE, "vectors", "allow", "chain.jsonl");
const TAMPERED = join(EVIDENCE, "vectors", "tampered", "chain.jsonl");
const JWKS_FILE = join(EVIDENCE, "jwks.json");

describe("exit-code contract, built binary, spawned as a process", () => {
  // Each cell names the verdict it is there to cover. Asserting the verdict as
  // well as the status is what stops the matrix degenerating: without it, a
  // build where everything returned UNVERIFIABLE would pass every row.
  const cells: { name: string; verdict: string; args: (jwks: string) => string[] }[] = [
    { name: "VALID", verdict: "VALID", args: (j) => [ALLOW, "--jwks", j, "--json"] },
    { name: "INVALID", verdict: "INVALID", args: (j) => [TAMPERED, "--jwks", j, "--json"] },
    // kid absent from the JWKS that resolved: a refusal reached only after the
    // JWKS was successfully read/fetched.
    { name: "UNVERIFIABLE", verdict: "UNVERIFIABLE", args: (j) => [ALLOW, "--jwks", j, "--json"] },
  ];

  for (const cell of cells) {
    const localJwks = cell.name === "UNVERIFIABLE" ? THROWAWAY_JWKS : JWKS_FILE;
    const remotePath = cell.name === "UNVERIFIABLE" ? "/other-jwks.json" : "/jwks.json";

    it(`JWKS from a file — ${cell.name}: exit status equals payload exit_code`, async () => {
      const r = await runCli(cell.args(localJwks));
      expect(r.payload.verdict, r.raw).toBe(cell.verdict);
      expect(r.status, `payload said exit_code ${r.payload.exit_code}\n${r.raw}`).toBe(r.payload.exit_code);
    });

    it(`JWKS over https — ${cell.name}: exit status equals payload exit_code`, async () => {
      const r = await runCli(cell.args(`${base}${remotePath}`));
      expect(r.payload.verdict, r.raw).toBe(cell.verdict);
      expect(r.status, `payload said exit_code ${r.payload.exit_code}\n${r.raw}`).toBe(r.payload.exit_code);
    });
  }

  // The contract the README publishes, restated against the process rather than
  // against exitCodeFor(): VALID is the only state that exits 0.
  it("VALID exits 0 and both negative states exit 1, over https", async () => {
    expect((await runCli([ALLOW, "--jwks", `${base}/jwks.json`, "--json"])).status).toBe(0);
    expect((await runCli([TAMPERED, "--jwks", `${base}/jwks.json`, "--json"])).status).toBe(1);
    expect((await runCli([ALLOW, "--jwks", `${base}/other-jwks.json`, "--json"])).status).toBe(1);
  });
});

// LIVE TIER — the cell that actually reproduced the 0.1.0 defect.
//
// A real host is required: the crash is a teardown race that loopback settles
// too fast to open (see the header). Only UNVERIFIABLE is reachable here, and
// that is a fixture limitation rather than a choice — no receipt in this
// repository is signed by a key that any live published JWKS serves, so VALID
// and INVALID cannot be produced against a real endpoint without adding a
// fixture. The race is verdict-independent, so one cell demonstrates it; the
// verdict-by-verdict coverage is the loopback tier's job.
//
// Allowed to skip offline. Not allowed to pass offline.
const LIVE = process.env["RECEIPT_VERIFY_LIVE"] === "1";
const LIVE_JWKS = "https://headlessoracle.com/.well-known/jwks.json";

describe.runIf(LIVE)("exit-code contract over a live remote JWKS (network)", () => {
  it("UNVERIFIABLE: exit status equals payload exit_code", async () => {
    const r = await runCli([ALLOW, "--jwks", LIVE_JWKS, "--json"]);
    // The fetch must have SUCCEEDED for this to be the cell it claims to be: a
    // refusal reached after the key material was read, not a network failure.
    expect(r.payload.reason, r.raw).toBe("key_unresolvable");
    expect(r.status, `payload said exit_code ${r.payload.exit_code}\n${r.raw}`).toBe(r.payload.exit_code);
  });
});
