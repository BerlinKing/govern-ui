import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { prepareSubmission } from "../lib/delivery.mjs";
import { implementGovernance, planImplementation, validateImplementationInputs } from "../lib/implementation.mjs";

const execFileAsync = promisify(execFile);

test("approved lifecycle batches produce safe source changes and Draft PR preparation", async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), "govern-ui-implementation-"));
  const repo = path.join(temp, "repo");
  const output = path.join(temp, "output");
  const delivery = path.join(temp, "delivery");
  await execFileAsync("mkdir", ["-p", repo]);
  const css = `:root {\n  --legacy-color: #123456;\n  --unused-color: #ffffff;\n}\n.button { color: var(--legacy-color); }\n.badge { color: #ff0000; }\n`;
  await writeFile(path.join(repo, "tokens.css"), css, "utf8");
  await execFileAsync("git", ["init", "-b", "main"], { cwd: repo });
  await execFileAsync("git", ["config", "user.email", "govern-ui@example.invalid"], { cwd: repo });
  await execFileAsync("git", ["config", "user.name", "GovernUI Test"], { cwd: repo });
  await execFileAsync("git", ["add", "tokens.css"], { cwd: repo });
  await execFileAsync("git", ["commit", "-m", "fixture"], { cwd: repo });

  const contract = {
    schemaVersion: 1,
    status: "draft",
    lifecycle: [
      {
        id: "lifecycle-migrate-color",
        action: "migrate",
        currentTokens: [{ id: "legacy", name: "--legacy-color", file: "tokens.css", line: 2 }],
        targetToken: { name: "--text-primary" },
        verification: "source-confirmed",
      },
      {
        id: "lifecycle-delete-color",
        action: "delete",
        currentTokens: [{ id: "unused", name: "--unused-color", file: "tokens.css", line: 3 }],
        targetToken: null,
        verification: "runtime-required",
      },
    ],
  };
  const decisions = {
    schemaVersion: 4,
    reportId: "fixture-report",
    repoId: "fixture-repo",
    status: "draft",
    batchApprovals: [{ batchId: "batch-color", approved: true, actionIds: contract.lifecycle.map((item) => item.id) }],
    tokenLifecycleDecisions: contract.lifecycle.map((item) => ({ lifecycleId: item.id, action: item.action, batchId: "batch-color", approved: true })),
    directStyleDecisions: [{
      directStyleId: "direct-red-text",
      foundationId: "color",
      batchId: "batch-color",
      action: "migrate",
      targetToken: "--text-primary",
      approved: true,
      sourceValues: ["#ff0000"],
      occurrences: 1,
      examples: [{ file: "tokens.css", line: 6, property: "color", evidence: ".badge { color: #ff0000; }" }],
    }],
  };
  assert.equal(validateImplementationInputs(decisions, contract).valid, true);
  const dryRun = await planImplementation({ repoRoot: repo, decisions, contract });
  assert.equal(dryRun.summary.ready, 2);
  assert.equal(dryRun.summary.blocked, 1);
  assert.equal(dryRun.summary.replacements, 2);

  const decisionsFile = path.join(temp, "decisions.json");
  const contractFile = path.join(temp, "contract.json");
  await Promise.all([
    writeFile(decisionsFile, `${JSON.stringify(decisions, null, 2)}\n`, "utf8"),
    writeFile(contractFile, `${JSON.stringify(contract, null, 2)}\n`, "utf8"),
  ]);
  const result = await implementGovernance({ repoRoot: repo, decisionsFile, contractFile, outputDir: output, write: true });
  assert.equal(result.mode, "write");
  const changed = await readFile(path.join(repo, "tokens.css"), "utf8");
  assert.match(changed, /--text-primary: #123456/);
  assert.match(changed, /var\(--text-primary\)/);
  assert.match(changed, /\.badge \{ color: var\(--text-primary\); \}/);
  assert.match(changed, /--unused-color:/);
  assert.doesNotMatch(changed, /--legacy-color/);

  const prepared = await prepareSubmission({ repoRoot: repo, ledgerFile: result.ledger, outputDir: delivery, base: "main" });
  const body = await readFile(prepared.bodyFile, "utf8");
  assert.match(body, /Draft PR/);
  assert.match(body, /Migrate: 2/);
  assert.match(body, /Runtime-required deletions/);
  assert.equal(prepared.manifest.files.includes("tokens.css"), true);
  assert.match(prepared.manifest.suggestedBranch, /^codex\/govern-ui-/);
  await rm(temp, { recursive: true, force: true });
});
