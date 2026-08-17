#!/usr/bin/env node

import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditRepository } from "../lib/audit.mjs";
import { compareBaseline, createBaseline } from "../lib/baseline.mjs";
import { createFallbackReviewBrief, validateReviewBrief } from "../lib/brief.mjs";
import { writeReportArtifacts } from "../lib/report.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(here, "fixtures");
const bootstrapPath = path.join(fixtures, "bootstrap");
const migratePath = path.join(fixtures, "migrate");
const hybridPath = path.join(fixtures, "hybrid");
const precisionPath = path.join(fixtures, "precision");

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
const precision = await auditRepository(precisionPath);
const after = await fileSnapshot(fixtures);

assert.deepEqual(after, before, "audit must not modify target repositories");
assert.equal(bootstrap.recommendedLane, "Bootstrap");
assert.equal(migrate.recommendedLane, "Migrate");
assert.equal(hybrid.recommendedLane, "Hybrid");
assert.equal(precision.recommendedLane, "Hybrid");
assert.ok(migrate.conflicts.some((item) => item.type === "semantic-conflict"));
assert.ok(migrate.conflicts.some((item) => item.type === "owner-conflict"));
assert.ok(hybrid.relationships.some((item) => item.type === "adapter"));
assert.ok(!hybrid.conflicts.some((item) => item.type === "owner-conflict"));
assert.ok(precision.scan.excludedScopeEntries.some((item) => item === "docs"));
assert.ok(precision.scan.excludedScopeEntries.some((item) => item === "tests"));
assert.ok(!precision.tokenDefinitions.some((item) => item.normalizedName === "method"));
assert.ok(!precision.conflicts.some((item) => /(?:from|to)/i.test(item.title)));
assert.ok(precision.tokenOwners.some((item) => item.file === "apps/canvas/src/index.css" && item.substantial));
assert.ok(precision.tokenDefinitions.filter((item) => item.file === "apps/canvas/src/index.css").every((item) => item.selector === ":root"));
assert.ok(!precision.componentCandidates.some((item) => item.file.endsWith("RenameProjectDialog.tsx")));
assert.equal(precision.componentCandidates.find((item) => item.file === "apps/canvas/src/components/ui/Dialog.tsx")?.role, "adapter");
assert.deepEqual(precision.duplicatedPrimitives.map((item) => item.primitive), ["toast"]);
assert.equal(migrate.systemReview.modelVersion, "0.7");
assert.equal(migrate.rulesetVersion, "lite-0.7.0");
assert.deepEqual(migrate.systemReview.staticLayers.map((item) => item.id), ["foundation", "atoms", "molecules", "components", "patterns"]);
assert.deepEqual(migrate.systemReview.dynamicLayers.map((item) => item.id), ["interaction-foundation", "component-behavior", "cross-component-orchestration", "flow-lifecycle"]);
const colorReview = migrate.systemReview.staticLayers.find((item) => item.id === "foundation").categories.find((item) => item.id === "color");
assert.ok(colorReview.metrics.some((item) => item.id === "primary-roles"));
assert.ok(colorReview.metrics.some((item) => item.id === "hardcoded-occurrences"));
assert.ok(colorReview.metrics.some((item) => item.id === "class-selectors"));
assert.deepEqual(colorReview.subcategories.map((item) => item.id), ["primitive-palette", "brand-action", "semantic-surface", "feedback-color", "interaction-color", "theme-scope", "data-visualization"]);
assert.equal(colorReview.colorWorkbench.architecture.systemCount, 3);
assert.equal(colorReview.colorWorkbench.architecture.paletteStatus, "partial");
assert.equal(colorReview.colorWorkbench.architecture.semanticStatus, "partial");
assert.equal(colorReview.colorWorkbench.architecture.candidateFile, "src/styles/tokens.css");
assert.equal(colorReview.colorWorkbench.systems.find((item) => item.file === "src/legacy/tokens.css")?.recommendation, "merge-deprecate");
assert.equal(colorReview.colorWorkbench.implementationApproaches.find((item) => item.sourceType === "tailwind-config")?.adapterCount, 3);
assert.ok(colorReview.colorWorkbench.roleRows.find((item) => item.role === "action-primary")?.systems.some((item) => item.tokens.length));
assert.ok(colorReview.colorWorkbench.hardcodes.some((item) => item.value === "#2255cc" && item.suggestedToken === "--color-primary"));
assert.ok(colorReview.colorWorkbench.tokenDecisions.some((item) => item.normalizedName === "color-primary" && item.action === "map-to-candidate"));
const foundationCategories = migrate.systemReview.staticLayers.find((item) => item.id === "foundation").categories;
for (const categoryId of ["typography", "spacing-density", "shape-stroke", "depth-layer"]) {
  const category = foundationCategories.find((item) => item.id === categoryId);
  assert.ok(category.foundationWorkbench, `${categoryId} must expose a designer-facing workbench`);
  assert.equal(category.foundationWorkbench.architecture.candidateFile, "src/styles/tokens.css");
  assert.ok(category.foundationWorkbench.systems.length >= 1);
  assert.ok(category.foundationWorkbench.roleRows.some((item) => item.systems.some((system) => system.tokens.length)));
  assert.ok(category.foundationWorkbench.bypasses.length >= 1);
}
assert.ok(foundationCategories.find((item) => item.id === "typography").foundationWorkbench.roleRows.find((item) => item.role === "font-family").targetTokens.length);
assert.ok(foundationCategories.find((item) => item.id === "spacing-density").foundationWorkbench.roleRows.find((item) => item.role === "control-size").targetTokens.length);
assert.ok(foundationCategories.find((item) => item.id === "shape-stroke").foundationWorkbench.roleRows.find((item) => item.role === "focus-ring").targetTokens.length);
assert.ok(foundationCategories.find((item) => item.id === "depth-layer").foundationWorkbench.roleRows.find((item) => item.role === "scrim-opacity").targetTokens.length);
const iconReview = foundationCategories.find((item) => item.id === "icon-assets");
assert.ok(iconReview.iconWorkbench);
assert.equal(iconReview.iconWorkbench.architecture.libraryCount, 1);
assert.equal(iconReview.iconWorkbench.architecture.localSvgCount, 1);
assert.ok(iconReview.iconWorkbench.sources.some((item) => item.source === "lucide-react"));
assert.ok(iconReview.iconWorkbench.grids.includes("0 0 24 24"));

const fallbackBrief = createFallbackReviewBrief(migrate);
assert.equal(validateReviewBrief(fallbackBrief, migrate).valid, true);
assert.equal(fallbackBrief.schemaVersion, 2);
assert.equal(fallbackBrief.decisionPackages.length, migrate.conflicts.length);
assert.ok(fallbackBrief.decisionPackages.every((item) => item.current && item.target && item.recommendation && item.choices.length >= 2));
assert.ok(fallbackBrief.decisionPackages.every((item) => item.systemPath && item.standard));
const findingsOnlyBrief = structuredClone(fallbackBrief);
findingsOnlyBrief.decisionPackages[0].conflictIds = [];
findingsOnlyBrief.decisionPackages[0].findingFingerprints = [migrate.findings[0].fingerprint];
assert.equal(validateReviewBrief(findingsOnlyBrief, migrate).valid, true);

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
  assert.ok(html.includes("Export review draft"));
  assert.ok(html.includes("govern-ui-decisions.json"));
  assert.ok(html.includes("From foundations to complete interactions"));
  assert.ok(html.includes("System-first design review"));
  assert.ok(html.includes("Token architecture and ownership"));
  assert.ok(html.includes("Interaction foundation"));
  assert.ok(html.includes("Cross-component orchestration"));
  assert.ok(html.includes("从基础规范到完整交互"));
  assert.ok(html.includes("See the real styles and variants found in the product."));
  assert.ok(html.includes("先看项目里真实存在的样式、组件和状态。"));
  assert.ok(html.includes("category-sheet"));
  assert.ok(html.includes("coverage-matrix"));
  assert.ok(html.includes("target-standard"));
  assert.ok(html.includes("Token 架构与归属"));
  assert.ok(html.includes("当前现状"));
  assert.ok(html.includes("标准目标"));
  assert.ok(html.includes("赋予颜色的选择器"));
  assert.ok(html.includes("当前有哪些颜色来源和色板"));
  assert.ok(html.includes("不同来源如何定义同一类颜色"));
  assert.ok(html.includes("哪些保留、合并或限定范围"));
  assert.ok(html.includes("建议的目标颜色契约"));
  assert.ok(html.includes("Current color sources and palettes"));
  assert.ok(html.includes("What to keep, merge, or scope"));
  assert.ok(html.includes("colorWorkbench"));
  assert.ok(html.includes("foundationWorkbench"));
  assert.ok(html.includes("iconWorkbench"));
  assert.ok(html.includes("Current sources and visual inventory"));
  assert.ok(html.includes("Direct values and utility patterns"));
  assert.ok(html.includes("当前有哪些来源与视觉定义"));
  assert.ok(html.includes("直接值与工具类使用模式"));
  assert.ok(html.includes("Current icon and asset sources"));
  assert.ok(html.includes("当前有哪些图标与资产来源"));
  assert.ok(html.includes("foundation-token-grid"));
  assert.ok(html.includes("Current state"));
  assert.ok(html.includes("Target result"));
  assert.ok(html.includes("What we confirmed"));
  assert.ok(html.includes("View source details (engineers)"));
  assert.ok(html.includes("把评审结果交回 Codex"));
  assert.ok(html.includes("目标效果"));
  assert.ok(html.includes("我的建议"));
  assert.ok(html.includes("我们确认了什么"));
  assert.ok(html.includes("查看源码详情（工程师）"));
  assert.ok(html.includes('data-locale="zh"'));
  assert.ok(html.includes('data-locale="en"'));
  assert.ok(html.includes("govern-ui:locale"));
  assert.ok(html.includes("把当前样式与目标组件库并排比较"));
  assert.ok(html.includes("navigator.language"));
  assert.ok(html.includes('content="light"'));
  assert.ok(!html.includes("prefers-color-scheme: dark"));
  assert.ok(html.includes("decision-search"));
  assert.ok(html.includes("packageDecisions"));
  assert.ok(html.includes("reviewBrief"));
  assert.ok(!html.includes('id="stats"'));
  assert.ok(!html.includes("High-priority evidence"));
  assert.ok(!html.includes('decision: selected ? selected.value : "defer"'));
  assert.ok(html.includes("@media (max-width: 720px)"));
  assert.ok(!html.includes("{{REPORT_JSON}}"));
  assert.ok(!/<script\s+[^>]*src=/i.test(html), "HTML report must not use remote scripts");
  assert.ok(!/<link\s+[^>]*href=["']https?:/i.test(html), "HTML report must not use remote styles");
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
  assert.doesNotThrow(() => new Function(scripts.at(-1)), "interactive report script must parse");
} finally {
  await rm(temp, { recursive: true, force: true });
}

process.stdout.write(`Passed GovernUI Lite tests\n`);
process.stdout.write(`Bootstrap findings: ${bootstrap.findings.length}\n`);
process.stdout.write(`Migrate findings: ${migrate.findings.length}\n`);
process.stdout.write(`Hybrid findings: ${hybrid.findings.length}\n`);
process.stdout.write(`Precision findings: ${precision.findings.length}\n`);
