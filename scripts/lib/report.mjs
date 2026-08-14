import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
    `- Recommended lane: **${report.recommendedLane}** (${Math.round(report.maturity.confidence * 100)}% confidence)`,
    `- Scanned files: ${report.scan.scannedFiles}`,
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
    "",
    "## Review-required Token groups",
    "",
    ...(report.conflicts.length ? report.conflicts.map((item) => `- **${item.type}** \`${item.id}\`: ${item.reason}`) : ["- None detected by the Lite scanner."]),
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
    `Lane: ${report.recommendedLane} (${Math.round(report.maturity.confidence * 100)}% confidence)`,
    `Scanned: ${report.scan.scannedFiles} files; ${report.scan.skippedFiles} skipped`,
    `Tokens: ${report.tokenDefinitions.length} definitions / ${report.tokenOwners.length} owner candidates`,
    `Components: ${report.componentCandidates.length} candidates / ${report.componentOwners.length} owner candidates`,
    `Review groups: ${report.conflicts.length}`,
    `Findings: ${report.findings.length} (${severity.high ?? 0} high, ${severity.medium ?? 0} medium, ${severity.low ?? 0} low)`,
    `Unassessed: ${report.scan.unassessedAreas.length} areas`,
  ].join("\n");
}

export async function writeReportArtifacts(report, outputDirectory) {
  const output = path.resolve(outputDirectory);
  await mkdir(output, { recursive: true });
  const templatePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../assets/report-template.html");
  const template = await readFile(templatePath, "utf8");
  const html = template
    .replaceAll("{{REPORT_TITLE}}", escapeHtml(`GovernUI — ${report.repoProfile.rootName}`))
    .replace("{{REPORT_JSON}}", safeScriptJson(report));
  const files = {
    json: path.join(output, "audit.json"),
    markdown: path.join(output, "audit.md"),
    html: path.join(output, "token-review.html"),
  };
  await Promise.all([
    writeFile(files.json, `${JSON.stringify(report, null, 2)}\n`, "utf8"),
    writeFile(files.markdown, markdownReport(report), "utf8"),
    writeFile(files.html, html, "utf8"),
  ]);
  return files;
}
