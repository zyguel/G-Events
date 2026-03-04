#!/usr/bin/env node
/**
 * push-nightly.mjs
 * ──────────────────────────────────────────────────────────────────────────
 * Cross-platform (macOS + Windows) safe commit-and-push to the nightly branch.
 * Mirrors GitHub Desktop behaviour:
 *   1. Ensures the current branch is `nightly`.
 *   2. Fetches origin to detect remote-ahead commits.
 *   3. Merges origin/nightly into local BEFORE committing (avoids diverged history).
 *   4. Stages all changes (or staged-only) and commits.
 *   5. Pushes to origin/nightly.
 *   6. If push is rejected (concurrent push detected), auto-merges then retries.
 *
 * Usage:
 *   node push-nightly.mjs "feat(events): your message here"
 *   node push-nightly.mjs "fix(checkin): fix" --no-add      ← skip git add --all
 *
 * Via npm script:
 *   npm run push -- "feat(events): your message here"
 */

import { spawnSync } from "node:child_process";
import process from "node:process";

// ── ANSI colours (disabled automatically on Windows cmd without ANSI support)
const supportsColor = process.stdout.isTTY;
const c = {
  cyan:   (s) => supportsColor ? `\x1b[36m${s}\x1b[0m` : s,
  green:  (s) => supportsColor ? `\x1b[32m${s}\x1b[0m` : s,
  yellow: (s) => supportsColor ? `\x1b[33m${s}\x1b[0m` : s,
  red:    (s) => supportsColor ? `\x1b[31m${s}\x1b[0m` : s,
  dim:    (s) => supportsColor ? `\x1b[2m${s}\x1b[0m`  : s,
};

const step = (msg) => console.log(`\n▶  ${c.cyan(msg)}`);
const ok   = (msg) => console.log(`   ✔  ${c.green(msg)}`);
const warn = (msg) => console.log(`   ⚠  ${c.yellow(msg)}`);
const fail = (msg) => { console.log(`   ✖  ${c.red(msg)}`); process.exit(1); };

// ── git helper: runs a git command and returns { stdout, stderr, ok }
function git(...args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  return {
    stdout:  (result.stdout ?? "").trim(),
    stderr:  (result.stderr ?? "").trim(),
    ok:      result.status === 0,
    output:  ((result.stdout ?? "") + (result.stderr ?? "")).trim(),
  };
}

// ── Parse CLI args ────────────────────────────────────────────────────────────
const rawArgs  = process.argv.slice(2);
const addAll   = !rawArgs.includes("--no-add");
const msgArgs  = rawArgs.filter((a) => !a.startsWith("--"));
const message  = msgArgs[0];

if (!message) {
  console.error(c.red('\nUsage: node push-nightly.mjs "your commit message" [--no-add]\n'));
  process.exit(1);
}

// ── 0. Verify git repo ────────────────────────────────────────────────────────
step("Verifying git repository");
const repoCheck = git("rev-parse", "--is-inside-work-tree");
if (!repoCheck.ok) fail("Not inside a git repository. Run from the project root.");
ok("Git repository confirmed");

// ── 1. Ensure branch is nightly ───────────────────────────────────────────────
step("Checking current branch");
const branchResult = git("rev-parse", "--abbrev-ref", "HEAD");
if (!branchResult.ok) fail("Could not determine current branch.");
const currentBranch = branchResult.stdout;

if (currentBranch !== "nightly") {
  warn(`Currently on '${currentBranch}'. Switching to 'nightly'...`);
  const sw = git("checkout", "nightly");
  if (!sw.ok) {
    console.log(sw.output);
    fail("Could not switch to 'nightly'. Stash or resolve conflicts first.");
  }
  ok("Switched to 'nightly'");
} else {
  ok("Already on 'nightly'");
}

// ── 2. Fetch origin ───────────────────────────────────────────────────────────
step("Fetching origin/nightly");
const fetch = git("fetch", "origin", "nightly");
if (!fetch.ok) {
  console.log(fetch.output);
  fail("Fetch failed. Check your network or remote access.");
}
ok("Fetch complete");

// ── 3. Merge if remote is ahead ───────────────────────────────────────────────
step("Checking if origin/nightly has unpulled commits");
const aheadCount = git("rev-list", "--count", "HEAD..origin/nightly");
const remoteAhead = parseInt(aheadCount.stdout, 10) || 0;

if (remoteAhead > 0) {
  warn(`Remote is ${remoteAhead} commit(s) ahead. Merging origin/nightly first...`);
  const merge = git("merge", "origin/nightly", "--no-edit");
  if (!merge.ok) {
    console.log(merge.output);
    fail("Merge failed. Resolve conflicts then run the script again.");
  }
  ok("Merged origin/nightly into local");
} else {
  ok("Local is up to date with origin/nightly");
}

// ── 4. Stage changes ──────────────────────────────────────────────────────────
step("Staging changes");
if (addAll) {
  const add = git("add", "--all");
  if (!add.ok) {
    console.log(add.output);
    fail("git add --all failed.");
  }
} else {
  warn("--no-add flag set; using already-staged files only.");
}

// Check there is actually something to commit
const status = git("status", "--porcelain");
if (!status.stdout) {
  warn("Nothing to commit. Working tree is clean.");
  process.exit(0);
}
ok("Changes staged");

// ── 5. Commit ─────────────────────────────────────────────────────────────────
step(`Committing: "${message}"`);
const commit = git("commit", "-m", message);
if (!commit.ok) {
  console.log(commit.output);
  fail("Commit failed.");
}
ok("Commit created");

// ── 6. Push (with automatic conflict recovery) ────────────────────────────────
step("Pushing to origin/nightly");

function tryPush() {
  return git("push", "origin", "nightly");
}

let push = tryPush();

if (!push.ok) {
  const isRejected = /rejected|non-fast-forward|fetch first/i.test(push.output);
  if (!isRejected) {
    console.log(push.output);
    fail("Push failed with an unexpected error.");
  }

  warn("Push rejected — remote received new commits while you were working. Merging...");

  const refetch = git("fetch", "origin", "nightly");
  if (!refetch.ok) {
    console.log(refetch.output);
    fail("Fetch failed during push recovery.");
  }

  const retryMerge = git("merge", "origin/nightly", "--no-edit");
  if (!retryMerge.ok) {
    console.log(retryMerge.output);
    console.log(c.yellow('\n  Resolve the conflicts above, then run:\n    git push origin nightly\n'));
    fail("Merge failed during push recovery.");
  }
  ok("Merged remote commits");

  step("Retrying push to origin/nightly");
  push = tryPush();
  if (!push.ok) {
    console.log(push.output);
    fail("Push failed on retry.");
  }
  ok("Push successful (after merge)");
} else {
  ok("Push successful");
}

console.log(`\n${c.dim("━".repeat(46))}`);
console.log(`  ${c.green("Done. Committed and pushed to nightly.")}`);
console.log(`${c.dim("━".repeat(46))}\n`);
