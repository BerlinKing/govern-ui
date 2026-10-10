#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { auditRepository } from "./lib/audit.mjs";
import { reconRepository, writeRecon } from "./lib/element-recon.mjs";
import { compareBaseline, createBaseline } from "./lib/baseline.mjs";
import { validateReviewBrief } from "./lib/brief.mjs";
import { submitGovernance } from "./lib/delivery.mjs";
import { implementGovernance } from "./lib/implementation.mjs";
import { extractStyleLibrary, styleLibraryFromReport } from "./lib/library.mjs";
import { librarySummary, writeStyleLibrary } from "./lib/library-report.mjs";
import { createGovernanceSnapshot } from "./lib/governance-snapshot.mjs";
import { createVisualRegression, writeVisualRegression } from "./lib/regression.mjs";
import { terminalSummary, writeReportArtifacts } from "./lib/report.mjs";
import { buildTokenContract } from "./lib/token-contract.mjs";
import { readJson } from "./lib/utils.mjs";

function usage() {
  return `Usage:
  govern.mjs library <repo> --out <directory>
  govern.mjs review <repo> --out <directory>
  govern.mjs recon <repo> --scope <element-scope.json> --out <directory> [--typescript <typescript.js>]
  govern.mjs snapshot <repo> --out <snapshot.json>
  govern.mjs implement <repo> --decisions <decisions.json> --contract <token-contract.json> --out <directory> [--write] [--allow-runtime-delete] [--allow-cross-file-merge]
  govern.mjs regression --before <snapshot.json> --after <snapshot.json> --manifest <visual-manifest.json> --out <directory>
  govern.mjs submit <repo> --ledger <implementation-ledger.json> --out <directory> [--base <branch>] [--branch <branch>] [--create]
  govern.mjs audit <repo> [--json]
  govern.mjs report <repo> --out <directory>  # alias of library
  govern.mjs baseline accept <repo> --out <baseline.json>
  govern.mjs baseline status <repo> --baseline <baseline.json> [--json]
  govern.mjs check <repo> --baseline <baseline.json> [--json]
  govern.mjs brief validate <review-brief.json>
  govern.mjs decisions validate <govern-ui-decisions.json>`;
}

function option(args, name) {
  const index = args.indexOf(name);
  if (index < 0) return null;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function validateDecisions(value) {
  const errors = [];
  if (value?.schemaVersion !== 4) errors.push("schemaVersion must be 4");
  if (typeof value?.reportId !== "string" || !value.reportId) errors.push("reportId is required");
  if (typeof value?.repoId !== "string" || !value.repoId) errors.push("repoId is required");
  if (value?.status !== "draft") errors.push("status must remain draft until the user explicitly authorizes implementation");
  if (!Array.isArray(value?.batchApprovals)) errors.push("batchApprovals must be an array");
  if (!Array.isArray(value?.tokenLifecycleDecisions)) errors.push("tokenLifecycleDecisions must be an array");
  if (value?.directStyleDecisions != null && !Array.isArray(value.directStyleDecisions)) errors.push("directStyleDecisions must be an array when present");
  for (const [index, decision] of (value?.tokenLifecycleDecisions ?? []).entries()) {
    if (typeof decision.lifecycleId !== "string" || !decision.lifecycleId) errors.push(`tokenLifecycleDecisions[${index}].lifecycleId is required`);
    if (!new Set(["migrate", "merge", "delete"]).has(decision.action)) errors.push(`tokenLifecycleDecisions[${index}].action is invalid`);
  }
  for (const [index, decision] of (value?.directStyleDecisions ?? []).entries()) {
    if (typeof decision.directStyleId !== "string" || !decision.directStyleId) errors.push(`directStyleDecisions[${index}].directStyleId is required`);
    if (!new Set(["migrate", "scope", "create", "verify"]).has(decision.action)) errors.push(`directStyleDecisions[${index}].action is invalid`);
  }
  return { valid: errors.length === 0, errors };
}

async function main() {
  const args = process.argv.slice(2);
  const [command, subcommand] = args;
  if (!command || command === "--help" || command === "-h") {
    process.stdout.write(`${usage()}\n`);
    return;
  }

  if (command === "audit") {
    if (!subcommand) throw new Error("audit requires a repository path");
    const report = await auditRepository(subcommand);
    if (args.includes("--json")) printJson(report);
    else process.stdout.write(`${terminalSummary(report)}\n`);
    return;
  }

  if (command === "library" || command === "report") {
    if (!subcommand) throw new Error(`${command} requires a repository path`);
    const output = option(args, "--out");
    if (!output) throw new Error(`${command} requires --out <directory>`);
    const library = await extractStyleLibrary(subcommand);
    const moduleMapFile = option(args, '--module-map');
    if (moduleMapFile) {
      const map = await readJson(path.resolve(moduleMapFile));
      if (map.schema !== 'governui.module-map/1' || map.project !== library.project.name || !Array.isArray(map.modules) || map.modules.some(m => typeof m.name !== 'string' || !Array.isArray(m.sourceBoundaries) || m.sourceBoundaries.some(p => typeof p !== 'string' || !p))) throw new Error('Invalid module map or project mismatch');
      library.moduleMap = map;
    }
    const files = await writeStyleLibrary(library, output);
    process.stdout.write(`${librarySummary(library)}\n`);
    printJson(files);
    return;
  }

  if (command === "review") {
    if (!subcommand) throw new Error("review requires a repository path");
    const output = option(args, "--out");
    if (!output) throw new Error("review requires --out <directory>");
    const repoRoot = path.resolve(subcommand);
    const report = await auditRepository(repoRoot, { collectOptions: { includeAssetDirectories: true }, includeRawValues: true });
    const library = await styleLibraryFromReport(report, repoRoot);
    const tokenContract = buildTokenContract(library);
    const files = await writeReportArtifacts(report, output, { tokenContract, styleLibrary: library });
    process.stdout.write(`${terminalSummary(report)}\n`);
    printJson(files);
    return;
  }

  if (command === "recon") {
    const scope = option(args, "--scope");
    const output = option(args, "--out");
    if (!subcommand || !scope || !output) throw new Error("recon requires <repo> --scope <element-scope.json> --out <directory>");
    const report = await reconRepository(path.resolve(subcommand), await readJson(scope), { typescript: option(args, "--typescript") });
    printJson({ summary: report.summary, files: await writeRecon(report, output) });
    return;
  }

  if (command === "snapshot") {
    if (!subcommand) throw new Error("snapshot requires a repository path");
    const output = option(args, "--out");
    if (!output) throw new Error("snapshot requires --out <snapshot.json>");
    const snapshot = createGovernanceSnapshot(await extractStyleLibrary(subcommand));
    const absolute = path.resolve(output);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
    process.stdout.write(`Governance snapshot written to ${absolute}\n`);
    return;
  }

  if (command === "implement") {
    if (!subcommand) throw new Error("implement requires a repository path");
    const decisionsFile = option(args, "--decisions");
    const contractFile = option(args, "--contract");
    const output = option(args, "--out");
    if (!decisionsFile || !contractFile || !output) throw new Error("implement requires --decisions <decisions.json> --contract <token-contract.json> --out <directory>");
    printJson(await implementGovernance({
      repoRoot: subcommand,
      decisionsFile,
      contractFile,
      outputDir: output,
      write: args.includes("--write"),
      allowDirty: args.includes("--allow-dirty"),
      allowRuntimeDelete: args.includes("--allow-runtime-delete"),
      allowCrossFileMerge: args.includes("--allow-cross-file-merge"),
    }));
    return;
  }

  if (command === "regression") {
    const beforePath = option(args, "--before");
    const afterPath = option(args, "--after");
    const manifestPath = option(args, "--manifest");
    const output = option(args, "--out");
    if (!beforePath || !afterPath || !manifestPath || !output) throw new Error("regression requires --before <snapshot.json> --after <snapshot.json> --manifest <visual-manifest.json> --out <directory>");
    const [before, after, manifest] = await Promise.all([readJson(path.resolve(beforePath)), readJson(path.resolve(afterPath)), readJson(path.resolve(manifestPath))]);
    const regression = await createVisualRegression(before, after, manifest, path.dirname(path.resolve(manifestPath)));
    printJson(await writeVisualRegression(regression, output));
    return;
  }

  if (command === "submit") {
    if (!subcommand) throw new Error("submit requires a repository path");
    const ledgerFile = option(args, "--ledger");
    const output = option(args, "--out");
    if (!ledgerFile || !output) throw new Error("submit requires --ledger <implementation-ledger.json> --out <directory>");
    printJson(await submitGovernance({
      repoRoot: subcommand,
      ledgerFile,
      outputDir: output,
      base: option(args, "--base") || "main",
      branch: option(args, "--branch"),
      title: option(args, "--title"),
      commitMessage: option(args, "--commit-message"),
      create: args.includes("--create"),
    }));
    return;
  }

  if (command === "baseline" && subcommand === "accept") {
    const repo = args[2];
    const output = option(args, "--out");
    if (!repo || !output) throw new Error("baseline accept requires <repo> --out <baseline.json>");
    const report = await auditRepository(repo);
    const baseline = createBaseline(report);
    const absolute = path.resolve(output);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, `${JSON.stringify(baseline, null, 2)}\n`, "utf8");
    process.stdout.write(`Baseline accepted at ${absolute}\n`);
    return;
  }

  if ((command === "baseline" && subcommand === "status") || command === "check") {
    const repo = command === "check" ? subcommand : args[2];
    const baselinePath = option(args, "--baseline");
    if (!repo || !baselinePath) throw new Error(`${command === "check" ? "check" : "baseline status"} requires <repo> --baseline <baseline.json>`);
    const [report, baseline] = await Promise.all([auditRepository(repo), readJson(path.resolve(baselinePath))]);
    const comparison = compareBaseline(report, baseline);
    if (args.includes("--json")) printJson(comparison);
    else {
      process.stdout.write([
        `Unchanged: ${comparison.unchanged.length}`,
        `New: ${comparison.new.length}`,
        `Stale: ${comparison.stale.length}`,
        `Gate findings: ${comparison.gateFindings.length}`,
        `Policy drift: ${comparison.policyDrift ? "yes" : "no"}`,
        `Repository mismatch: ${comparison.repoMismatch ? "yes" : "no"}`,
      ].join("\n") + "\n");
    }
    if (command === "check" && (comparison.gateFindings.length || comparison.policyDrift || comparison.repoMismatch)) process.exitCode = 2;
    return;
  }

  if (command === "decisions" && subcommand === "validate") {
    const file = args[2];
    if (!file) throw new Error("decisions validate requires a JSON file");
    const result = validateDecisions(await readJson(path.resolve(file)));
    printJson(result);
    if (!result.valid) process.exitCode = 2;
    return;
  }

  if (command === "brief" && subcommand === "validate") {
    const file = args[2];
    if (!file) throw new Error("brief validate requires a JSON file");
    const result = validateReviewBrief(await readJson(path.resolve(file)));
    printJson(result);
    if (!result.valid) process.exitCode = 2;
    return;
  }

  throw new Error(`Unknown command\n${usage()}`);
}

main().catch((error) => {
  process.stderr.write(`govern-ui: ${error.message}\n`);
  process.exitCode = 1;
});
