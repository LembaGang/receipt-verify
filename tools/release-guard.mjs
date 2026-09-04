#!/usr/bin/env node
// Release guard — the structural half of R71.
//
// WHY THIS EXISTS. `@headlessoracle/receipt-verify@0.1.1` was published on
// 2026-08-13 from a tree whose code was not in any commit. Tags v0.1.0 and
// v0.1.1 both point at cbe4d38, npm records that same commit as the package's
// `gitHead`, and the published `dist/cli.js` contains a fix whose source did not
// reach the repository until `17172e4` on 2026-09-02. So the artefact could not
// be cited to a commit, which is how it was found: someone tried to cite it.
// RELEASE-NOTES.md carries the full record under "0.1.1 (2026-08-13), correction to
// the record".
//
// Procedure did not prevent that and cannot. This runs from `prepublishOnly`,
// so the check is on the path the artefact travels rather than in a runbook
// beside it.
//
// WHAT IT REFUSES, and each refusal names itself:
//   1. a dirty or untracked working tree, so the published bytes are bytes that
//      exist in a commit;
//   2. a HEAD with no exact tag, or a tag that is not `v` + the version in
//      package.json, so the version being published is the version tagged;
//   3. a tag whose commit is not HEAD, which is the specific shape of the 0.1.1
//      defect and would otherwise pass check 2 on its own.
//
// It has no dependencies and reads nothing but `git` and `package.json`.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

/** Run git and return trimmed stdout, or null when git itself fails. */
function git(...args) {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch {
    return null;
  }
}

function refuse(reason, detail) {
  console.error(`release-guard: REFUSED (${reason})`);
  console.error(`  ${detail}`);
  console.error("  Nothing was published. See RELEASE-NOTES.md, section 0.1.1, for why this gate exists.");
  process.exitCode = 1;
}

const version = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;
const expectedTag = `v${version}`;
const status = git("status", "--porcelain");
const head = git("rev-parse", "HEAD");
const tag = git("describe", "--tags", "--exact-match", "HEAD");
const tagCommit = tag === null ? null : git("rev-parse", `${tag}^{commit}`);

// Printed before any verdict, so a refusal and a pass show the same three
// values and a reader can see what was compared rather than infer it.
console.log("release-guard: checking the three things a citable release needs");
console.log(`  package.json version : ${version}  (expects tag ${expectedTag})`);
console.log(`  working tree         : ${status === null ? "git unavailable" : status === "" ? "clean" : `${status.split("\n").length} path(s) not committed`}`);
console.log(`  HEAD                 : ${head ?? "unknown"}`);
console.log(`  exact tag on HEAD    : ${tag ?? "none"}`);
console.log(`  that tag's commit    : ${tagCommit ?? "n/a"}`);

if (head === null || status === null) {
  refuse("git_unavailable", "git did not answer; the guard cannot establish what would be published.");
} else if (status !== "") {
  refuse(
    "working_tree_not_clean",
    `git status --porcelain is not empty, so the tree being packed is not a tree that exists in a commit:\n  ${status.split("\n").join("\n  ")}`,
  );
} else if (tag === null) {
  refuse(
    "head_not_tagged",
    `git describe --tags --exact-match HEAD found no tag. A published artefact with no tag on its commit cannot be cited, which is the 0.1.1 defect. Tag ${expectedTag} on ${head} first.`,
  );
} else if (tag !== expectedTag) {
  refuse(
    "tag_does_not_match_version",
    `HEAD is tagged ${tag} but package.json says ${version}, so the version published and the version tagged would differ. Expected ${expectedTag}.`,
  );
} else if (tagCommit !== head) {
  refuse(
    "tag_points_elsewhere",
    `${tag} resolves to ${tagCommit}, which is not HEAD (${head}). This is exactly the 0.1.1 shape: a tag that names a different commit from the one the artefact is built from.`,
  );
} else {
  console.log(`release-guard: OK. ${expectedTag} is on HEAD, HEAD is ${head}, and the tree is clean.`);
  console.log("  Record in this version's release notes that gitHead equals the tag commit (R71).");
}
