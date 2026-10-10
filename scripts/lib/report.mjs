import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeReviewBrief } from "./brief.mjs";
import { buildUIKitBlueprint } from "./uikit-blueprint.mjs";
import { applyArtifactTheme, ensureArtifactEntries } from './artifact-theme.mjs';

function countBy(items, selector) {
  const counts = {};
  for (const item of items) {
    const key = selector(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeScriptJson(value) {
  return JSON.stringify(value).replace(/<\/script/gi, "<\\/script").replace(/<!--/g, "<\\!--");
}

export function markdownReport(report) {
  const severity = countBy(report.findings, (item) => item.severity);
  const lines = [
    `# GovernUI: ${report.repoProfile.rootName}`,
    "",
    `- Recommended lane: **${report.recommendedLane}** (${Math.round(report.maturity.confidence * 100)}% heuristic evidence score)`,
    `- Scanned files: ${report.scan.scannedFiles}`,
    `- Excluded scope entries: ${report.scan.skippedByReason?.["scope-excluded"] ?? 0}`,
    `- Token definitions: ${report.tokenDefinitions.length}`,
    `- Token owner candidates: ${report.tokenOwners.length}`,
    `- Component owner candidates: ${report.componentOwners.length}`,
    `- Review-required groups: ${report.conflicts.length}`,
    `- Findings: ${report.findings.length} (${severity.high ?? 0} high, ${severity.medium ?? 0} medium, ${severity.low ?? 0} low)`,
    "",
    "## Classification evidence",
    "",
    ...report.maturity.evidence.map((item) => `- ${item}`),
    "",
    "## Candidate owners",
    "",
    ...report.tokenOwners.map((item) => `- Token: \`${item.file}\` — ${item.definitionCount} definitions (${item.sourceTypes.join(", ")})`),
    ...report.componentOwners.map((item) => `- Components: \`${item.directory}\` — ${item.componentCount} candidates (${item.primitives.join(", ")})`),
    ...report.componentAdapters.map((item) => `- Component adapter: \`${item.file}\` → ${item.primitive}`),
    "",
    "## Review-required Token groups",
    "",
    ...(report.conflicts.length ? report.conflicts.map((item) => `- **${item.type}** \`${item.id}\`: ${item.reason}`) : ["- None detected by the Lite scanner."]),
    "",
    "## System-first review matrix",
    "",
    `- Model: **${report.systemReview.model}**`,
    "- Static system:",
    ...report.systemReview.staticLayers.flatMap((layer) => [
      `  - ${layer.label} (${layer.status})`,
      ...layer.categories.map((category) => `    - ${category.id}: ${category.status}`),
    ]),
    "- Dynamic system:",
    ...report.systemReview.dynamicLayers.flatMap((layer) => [
      `  - ${layer.label} (${layer.status})`,
      ...layer.categories.map((category) => `    - ${category.id}: ${category.status}`),
    ]),
    "",
    "## Top hotspots",
    "",
    ...(report.hotspots.length ? report.hotspots.map((item) => `- \`${item.file}\`: ${item.count} findings (${item.high} high, ${item.medium} medium, ${item.low} low)`) : ["- No findings."]),
    "",
    "## Unassessed areas",
    "",
    ...report.scan.unassessedAreas.map((item) => `- ${item}`),
    "",
    "## Next actions",
    "",
    ...report.nextActions.map((item) => `- ${item}`),
    "",
    "> This report is source-derived. It does not prove runtime visual, interaction, focus, overlay, or responsive behavior.",
    "",
  ];
  return lines.join("\n");
}

export function terminalSummary(report) {
  const severity = countBy(report.findings, (item) => item.severity);
  return [
    `GovernUI — ${report.repoProfile.rootName}`,
    `Lane: ${report.recommendedLane} (${Math.round(report.maturity.confidence * 100)}% heuristic evidence score)`,
    `Scanned: ${report.scan.scannedFiles} files; ${report.scan.skippedFiles} source entries skipped`,
    `Tokens: ${report.tokenDefinitions.length} definitions / ${report.tokenOwners.length} owner candidates`,
    `Components: ${report.componentCandidates.length} candidates / ${report.componentOwners.length} owner candidates`,
    `Review groups: ${report.conflicts.length}`,
    `Findings: ${report.findings.length} (${severity.high ?? 0} high, ${severity.medium ?? 0} medium, ${severity.low ?? 0} low)`,
    `Unassessed: ${report.scan.unassessedAreas.length} areas`,
  ].join("\n");
}

function htmlPresentationReport(report, reviewBrief, options = {}) {
  const uikitBlueprint = options.styleLibrary && options.tokenContract
    ? buildUIKitBlueprint(report, options.styleLibrary, options.tokenContract, reviewBrief)
    : null;
  if (uikitBlueprint) {
    const { lifecycle: _lifecycle, ...presentationTokenContract } = options.tokenContract;
    return {
      schemaVersion: report.schemaVersion,
      rulesetVersion: report.rulesetVersion,
      reportId: report.reportId,
      repoId: report.repoId,
      generatedAt: report.generatedAt,
      repoProfile: report.repoProfile,
      reviewBrief,
      uikitBlueprint,
      tokenContract: presentationTokenContract,
    };
  }
  const severityOrder = { high: 0, medium: 1, low: 2 };
  const findings = [...report.findings]
    .sort((left, right) => (severityOrder[left.severity] - severityOrder[right.severity]) || (right.confidence - left.confidence) || left.file.localeCompare(right.file))
    .slice(0, 2500);
  return {
    schemaVersion: report.schemaVersion,
    rulesetVersion: report.rulesetVersion,
    policyHash: report.policyHash,
    reportId: report.reportId,
    repoId: report.repoId,
    generatedAt: report.generatedAt,
    repoProfile: report.repoProfile,
    scan: { ...report.scan, totalFindings: report.findings.length },
    styleSystems: report.styleSystems,
    tokenDefinitions: report.tokenDefinitions,
    tokenOwners: report.tokenOwners,
    componentOwners: report.componentOwners,
    componentAdapters: report.componentAdapters,
    conflicts: report.conflicts,
    systemReview: report.systemReview,
    componentBlueprint: report.componentBlueprint,
    findings,
    maturity: report.maturity,
    recommendedLane: report.recommendedLane,
    nextActions: report.nextActions,
    reviewBrief,
    uikitBlueprint,
    tokenContract: options.tokenContract ?? null,
    usageInventory: options.styleLibrary ? {
      tokens: options.styleLibrary.tokens.map(({ id, name, category, group, file, line, usage }) => ({ id, name, category, group, file, line, usage })),
      directStyles: options.styleLibrary.directStyles.map(({ id, category, property, value, occurrences, files, usage }) => ({ id, category, property, value, occurrences, files, usage })),
    } : null,
  };
}

export async function writeReportArtifacts(report, outputDirectory, options = {}) {
  const output = path.resolve(outputDirectory);
  await mkdir(output, { recursive: true });
  const templatePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../assets/report-template.html");
  const template = await readFile(templatePath, "utf8");
  const reviewBrief = normalizeReviewBrief(options.reviewBrief, report);
  const presentationReport = htmlPresentationReport(report, reviewBrief, options);
  const html = template
    .replaceAll("{{REPORT_TITLE}}", escapeHtml(`GovernUI — ${report.repoProfile.rootName}`))
    .replace("{{REPORT_JSON}}", safeScriptJson(presentationReport));
  const files = {
    json: path.join(output, "audit.json"),
    markdown: path.join(output, "audit.md"),
    html: path.join(output, "design-review.html"),
    ...(options.tokenContract ? { tokenContract: path.join(output, "govern-ui-token-contract.json") } : {}),
  };
  await Promise.all([
    writeFile(files.json, `${JSON.stringify(report, null, 2)}\n`, "utf8"),
    writeFile(files.markdown, markdownReport(report), "utf8"),
    writeFile(files.html, await applyArtifactTheme(html, 'C'), "utf8"),
    ...(options.tokenContract ? [writeFile(files.tokenContract, `${JSON.stringify(options.tokenContract, null, 2)}\n`, "utf8")] : []),
  ]);
  await ensureArtifactEntries(output);
  return files;
}
