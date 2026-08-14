import path from "node:path";
import { stat } from "node:fs/promises";
import { classifyAudit, classifyLane } from "./classify.mjs";
import { discoverRepository } from "./discover.mjs";
import { evaluateRules, POLICY_HASH, RULESET_VERSION } from "./rules.mjs";
import { scanSources } from "./scan.mjs";
import { collectFiles, generatedAt, sha, stableSort } from "./utils.mjs";

function buildHotspots(findings) {
  const byFile = new Map();
  for (const finding of findings) {
    if (!byFile.has(finding.file)) byFile.set(finding.file, { file: finding.file, count: 0, high: 0, medium: 0, low: 0, rules: new Set() });
    const item = byFile.get(finding.file);
    item.count += 1;
    item[finding.severity] = (item[finding.severity] ?? 0) + 1;
    item.rules.add(finding.ruleId);
  }
  return [...byFile.values()]
    .map((item) => ({ ...item, rules: [...item.rules].sort() }))
    .sort((left, right) => right.high - left.high || right.medium - left.medium || right.count - left.count || left.file.localeCompare(right.file))
    .slice(0, 20);
}

function nextActions(lane, conflicts) {
  const actions = [];
  if (conflicts.length) actions.push("Review Token conflict groups in token-review.html and export a decision draft");
  if (lane === "Bootstrap") actions.push("Confirm brand, theme, responsive scope, and the first public primitives before creating a foundation");
  if (lane === "Migrate") actions.push("Confirm canonical Token and component owners, then select one vertical migration slice");
  if (lane === "Hybrid") actions.push("Confirm the existing foundation and prioritize adoption gaps without replacing working owners");
  actions.push("Accept a baseline only after reviewing the first audit and its unassessed areas");
  return actions;
}

export async function auditRepository(repo) {
  const root = path.resolve(repo);
  const rootStat = await stat(root);
  if (!rootStat.isDirectory()) throw new Error(`Repository path is not a directory: ${root}`);

  const collected = await collectFiles(root);
  const repoProfile = await discoverRepository(root, collected);
  const scan = await scanSources(collected);
  const classification = classifyAudit(scan);
  const findings = evaluateRules(scan, classification);
  const maturity = classifyLane(scan, classification, findings.length);
  const repoId = sha(repoProfile.repoIdSeed, 24);
  const reportId = sha([
    repoId,
    POLICY_HASH,
    ...scan.tokenDefinitions.map((item) => item.id).sort(),
    ...classification.relationships.map((item) => item.id).sort(),
    ...findings.map((item) => item.fingerprint).sort(),
  ].join("|"), 24);

  return {
    schemaVersion: 1,
    rulesetVersion: RULESET_VERSION,
    policyHash: POLICY_HASH,
    reportId,
    repoId,
    generatedAt: generatedAt(),
    repoProfile: {
      ...repoProfile,
      repoIdSeed: undefined,
    },
    scan: {
      scannedFiles: collected.files.length,
      skippedFiles: collected.skipped.length,
      unassessedAreas: scan.unassessedAreas,
    },
    styleSystems: [...new Set([...repoProfile.styleSystems, ...scan.styleSignals])].sort(),
    tokenDefinitions: stableSort(scan.tokenDefinitions, (item) => `${item.file}:${String(item.line).padStart(8, "0")}:${item.normalizedName}`),
    tokenReferences: stableSort(scan.tokenReferences, (item) => `${item.file}:${String(item.line).padStart(8, "0")}:${item.normalizedName}`),
    tokenOwners: classification.tokenOwners,
    componentOwners: classification.componentOwners,
    overlayOwners: classification.overlayOwners,
    relationships: classification.relationships,
    conflicts: classification.conflicts,
    componentCandidates: stableSort(scan.componentCandidates, (item) => item.file),
    duplicatedPrimitives: classification.duplicatedPrimitives,
    findings,
    hotspots: buildHotspots(findings),
    maturity,
    recommendedLane: maturity.recommendedLane,
    nextActions: nextActions(maturity.recommendedLane, classification.conflicts),
  };
}
