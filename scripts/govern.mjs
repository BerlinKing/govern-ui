#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { auditRepository } from "./lib/audit.mjs";
import { compareBaseline, createBaseline } from "./lib/baseline.mjs";
import { validateReviewBrief } from "./lib/brief.mjs";
import { terminalSummary, writeReportArtifacts } from "./lib/report.mjs";
import { readJson } from "./lib/utils.mjs";

const DECISIONS = new Set(["canonical", "keep-separate", "alias", "migrate", "exception", "not-conflict", "defer"]);

function usage() {
  return `Usage:
  govern.mjs audit <repo> [--json]
  govern.mjs report <repo> --out <directory> [--brief <review-brief.json>]
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
  if (value?.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (typeof value?.reportId !== "string" || !value.reportId) errors.push("reportId is required");
  if (typeof value?.repoId !== "string" || !value.repoId) errors.push("repoId is required");
  if (value?.status !== "draft") errors.push("status must remain draft in Lite mode");
  if (!Array.isArray(value?.decisions)) errors.push("decisions must be an array");
  for (const [index, decision] of (value?.decisions ?? []).entries()) {
    if (typeof decision.conflictId !== "string" || !decision.conflictId) errors.push(`decisions[${index}].conflictId is required`);
    if (!DECISIONS.has(decision.decision)) errors.push(`decisions[${index}].decision is invalid`);
    if (decision.note != null && typeof decision.note !== "string") errors.push(`decisions[${index}].note must be a string`);
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

  if (command === "report") {
    if (!subcommand) throw new Error("report requires a repository path");
    const output = option(args, "--out");
    if (!output) throw new Error("report requires --out <directory>");
    const report = await auditRepository(subcommand);
    const briefPath = option(args, "--brief");
    const reviewBrief = briefPath ? await readJson(path.resolve(briefPath)) : null;
    const files = await writeReportArtifacts(report, output, { reviewBrief });
    process.stdout.write(`${terminalSummary(report)}\n`);
    printJson(files);
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
