import { execFile } from "node:child_process";
import { mkdir, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { generatedAt, readJson } from "./utils.mjs";

const execFileAsync = promisify(execFile);

async function git(repoRoot, args, options = {}) {
  const { preserveWhitespace = false, ...execOptions } = options;
  const result = await execFileAsync("git", ["-C", repoRoot, ...args], { maxBuffer: 10_000_000, ...execOptions });
  return preserveWhitespace ? result.stdout.replace(/\n$/, "") : result.stdout.trim();
}

function statusPath(line) {
  const raw = line.slice(3).trim();
  return raw.includes(" -> ") ? raw.split(" -> ").at(-1) : raw;
}

function safeBranch(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9/_-]+/g, "-").replace(/-{2,}/g, "-").replace(/^[-/]|[-/]$/g, "");
}

function pullRequestBody(ledger, context) {
  const ready = ledger.actions.filter((item) => item.status === "ready");
  const partial = ledger.actions.filter((item) => item.status === "partial");
  const blocked = ledger.actions.filter((item) => item.status === "blocked");
  const counts = Object.fromEntries(["migrate", "merge", "delete"].map((action) => [action, ready.filter((item) => item.action === action).length]));
  const files = ledger.changedFiles.map((item) => item.file);
  return `## GovernUI design-system governance

This Draft PR contains one approved repository-level governance batch. It does not claim visual safety until the linked Product C matrix is complete.

### Approved source changes

- Migrate: ${counts.migrate}
- Merge: ${counts.merge}
- Delete: ${counts.delete}
- Source files: ${files.length}
- Token-reference replacements: ${ledger.summary.replacements}
- Partially migrated evidence groups: ${partial.length}

### Changed files

${files.map((file) => `- \`${file}\``).join("\n") || "- None"}

### Blocked or deferred work

${[...partial, ...blocked].map((item) => `- \`${item.lifecycleId || item.directStyleId || item.componentBuildId}\`: ${item.reason}`).join("\n") || "- None"}

### Verification contract

- [ ] Repository tests and production build pass
- [ ] Before/after screenshots use the same route, state, viewport, theme, locale, and data
- [ ] Remaining direct styles and undefined references are re-scanned
- [ ] Runtime-required deletions are visually verified
- [ ] Product C decisions are attached or linked

### Rollback boundary

Revert this PR as one repository-scoped batch. Cross-repository consumer migrations must be delivered as linked Draft PRs in dependency order.

Generated from ${path.basename(context.ledgerFile)} on ${generatedAt()}.
`;
}

export async function prepareSubmission({ repoRoot, ledgerFile, outputDir, title = null, base = "main", branch = null }) {
  const root = path.resolve(repoRoot);
  const ledger = await readJson(path.resolve(ledgerFile));
  if (ledger?.schemaVersion !== 1 || ledger?.mode !== "write") throw new Error("submit requires a write-mode govern-ui-implementation-ledger.json");
  if (ledger.git?.dirtyBefore?.length) throw new Error("implementation started from a dirty tree; automatic PR delivery is disabled");
  const [top, currentBranch, status, staged] = await Promise.all([
    git(root, ["rev-parse", "--show-toplevel"]),
    git(root, ["branch", "--show-current"]),
    git(root, ["status", "--porcelain"], { preserveWhitespace: true }),
    git(root, ["diff", "--cached", "--name-only"]),
  ]);
  if (await realpath(top) !== await realpath(root)) throw new Error(`repository root mismatch: ${top}`);
  if (staged) throw new Error("pre-existing staged changes must be cleared before GovernUI submission");
  const allowed = new Set(ledger.changedFiles.map((item) => item.file));
  const dirty = status.split("\n").filter(Boolean).map(statusPath);
  const unrelated = dirty.filter((file) => !allowed.has(file));
  if (unrelated.length) throw new Error(`unrelated working-tree changes are present: ${unrelated.slice(0, 8).join(", ")}`);
  const missing = [...allowed].filter((file) => !dirty.includes(file));
  if (missing.length) throw new Error(`ledger files are not present in the working tree: ${missing.slice(0, 8).join(", ")}`);
  const suggestedBranch = safeBranch(branch || `codex/govern-ui-${path.basename(root)}-${new Date().toISOString().slice(0, 10)}`);
  const prTitle = title || `GovernUI: govern ${path.basename(root)} design system`;
  const output = path.resolve(outputDir);
  await mkdir(output, { recursive: true });
  const bodyFile = path.join(output, "govern-ui-pr.md");
  const manifestFile = path.join(output, "govern-ui-submission.json");
  const body = pullRequestBody(ledger, { ledgerFile });
  const manifest = {
    schemaVersion: 1,
    generatedAt: generatedAt(),
    repoRoot: root,
    base,
    currentBranch,
    suggestedBranch,
    title: prTitle,
    draft: true,
    files: [...allowed],
    bodyFile,
    readiness: "ready",
  };
  await Promise.all([
    writeFile(bodyFile, body, "utf8"),
    writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8"),
  ]);
  return { ledger, manifest, bodyFile, manifestFile };
}

export async function submitGovernance(options) {
  const prepared = await prepareSubmission(options);
  if (!options.create) return { mode: "prepare", body: prepared.bodyFile, manifest: prepared.manifestFile, submission: prepared.manifest };
  const { repoRoot } = prepared.manifest;
  await Promise.all([
    git(repoRoot, ["remote", "get-url", "origin"]),
    execFileAsync("gh", ["auth", "status"], { cwd: repoRoot, maxBuffer: 10_000_000 }),
  ]);
  let branch = prepared.manifest.currentBranch;
  if (!branch || branch === prepared.manifest.base || new Set(["main", "master"]).has(branch)) {
    branch = prepared.manifest.suggestedBranch;
    await git(repoRoot, ["switch", "-c", branch]);
  }
  await git(repoRoot, ["add", "--", ...prepared.manifest.files]);
  await git(repoRoot, ["commit", "-m", options.commitMessage || prepared.manifest.title]);
  await git(repoRoot, ["push", "-u", "origin", branch]);
  const { stdout } = await execFileAsync("gh", ["pr", "create", "--draft", "--base", prepared.manifest.base, "--head", branch, "--title", prepared.manifest.title, "--body-file", prepared.bodyFile], { cwd: repoRoot, maxBuffer: 10_000_000 });
  return { mode: "create", branch, url: stdout.trim(), body: prepared.bodyFile, manifest: prepared.manifestFile };
}
