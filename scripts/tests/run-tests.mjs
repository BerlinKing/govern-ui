#!/usr/bin/env node

import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditRepository } from "../lib/audit.mjs";
import { compareBaseline, createBaseline } from "../lib/baseline.mjs";
import { writeReportArtifacts } from "../lib/report.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(here, "fixtures");
const bootstrapPath = path.join(fixtures, "bootstrap");
const migratePath = path.join(fixtures, "migrate");
const hybridPath = path.join(fixtures, "hybrid");

async function fileSnapshot(root) {
  const output = [];
  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else output.push(`${path.relative(root, absolute)}:${(await readFile(absolute)).toString("base64")}`);
    }
  }
  await visit(root);
  return output;
}

const before = await fileSnapshot(fixtures);
const bootstrap = await auditRepository(bootstrapPath);
const migrate = await auditRepository(migratePath);
const hybrid = await auditRepository(hybridPath);
const after = await fileSnapshot(fixtures);

assert.deepEqual(after, before, "audit must not modify target repositories");
assert.equal(bootstrap.recommendedLane, "Bootstrap");
assert.equal(migrate.recommendedLane, "Migrate");
assert.equal(hybrid.recommendedLane, "Hybrid");
assert.ok(migrate.conflicts.some((item) => item.type === "semantic-conflict"));
assert.ok(migrate.conflicts.some((item) => item.type === "owner-conflict"));
assert.ok(hybrid.relationships.some((item) => item.type === "adapter"));
assert.ok(!hybrid.conflicts.some((item) => item.type === "owner-conflict"));

const migrateRepeat = await auditRepository(migratePath);
assert.equal(migrate.reportId, migrateRepeat.reportId, "same source must produce the same report ID");
assert.deepEqual(migrate.findings.map((item) => item.fingerprint), migrateRepeat.findings.map((item) => item.fingerprint));

const baseline = createBaseline(migrate);
const unchanged = compareBaseline(migrateRepeat, baseline);
assert.equal(unchanged.new.length, 0);
assert.equal(unchanged.stale.length, 0);
assert.equal(unchanged.gateFindings.length, 0);

const temp = await mkdtemp(path.join(os.tmpdir(), "design-governance-test-"));
try {
  const mutableRepo = path.join(temp, "repo");
  await cp(migratePath, mutableRepo, { recursive: true });
  await writeFile(path.join(mutableRepo, "src", "new-debt.css"), ".new-debt { color: var(--color-missing-governance); }\n.new-debt:hover { color: var(--color-missing-governance); }\n", "utf8");
  const changed = await auditRepository(mutableRepo);
  const comparison = compareBaseline(changed, baseline);
  assert.ok(comparison.new.some((item) => item.ruleId === "token.undefined-reference"));
  assert.ok(comparison.gateFindings.some((item) => item.ruleId === "token.undefined-reference"));

  const reportDir = path.join(temp, "report");
  const files = await writeReportArtifacts(migrate, reportDir);
  const html = await readFile(files.html, "utf8");
  assert.ok(html.includes("Export decision draft"));
  assert.ok(html.includes("token-decisions.json"));
  assert.ok(html.includes("@media (max-width: 720px)"));
  assert.ok(!html.includes("{{REPORT_JSON}}"));
  assert.ok(!/<script\s+[^>]*src=/i.test(html), "HTML report must not use remote scripts");
  assert.ok(!/<link\s+[^>]*href=["']https?:/i.test(html), "HTML report must not use remote styles");
} finally {
  await rm(temp, { recursive: true, force: true });
}

process.stdout.write(`Passed GovernUI Lite tests\n`);
process.stdout.write(`Bootstrap findings: ${bootstrap.findings.length}\n`);
process.stdout.write(`Migrate findings: ${migrate.findings.length}\n`);
process.stdout.write(`Hybrid findings: ${hybrid.findings.length}\n`);
