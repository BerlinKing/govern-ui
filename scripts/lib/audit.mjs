import path from "node:path";
import { stat } from "node:fs/promises";
import { classifyAudit, classifyLane } from "./classify.mjs";
import { discoverRepository } from "./discover.mjs";
import { evaluateRules, POLICY_HASH, RULESET_VERSION } from "./rules.mjs";
import { scanSources } from "./scan.mjs";
import { buildSystemReview } from "./system-review.mjs";
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
  if (conflicts.length) actions.push("Review the standard system matrix, target Token contract, and categorized decision cards in design-review.html, then export a decision draft");
  if (lane === "Bootstrap") actions.push("Confirm brand, theme, responsive scope, and the first public primitives before creating a foundation");
  if (lane === "Migrate") actions.push("Confirm canonical Token and component owners, then select one vertical migration slice");
  if (lane === "Hybrid") actions.push("Confirm the existing foundation and prioritize adoption gaps without replacing working owners");
  actions.push("Accept a baseline only after reviewing the first audit and its unassessed areas");
  return actions;
}

function countBy(items, selector) {
  const counts = {};
  for (const item of items) {
    const key = selector(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function buildComponentBlueprint(scan) {
  const candidates = scan.componentCandidates;
  const describe = (primitive) => {
    const owners = candidates.filter((item) => item.primitive === primitive && item.role === "owner").map((item) => item.file).sort();
    const adapters = candidates.filter((item) => item.primitive === primitive && item.role === "adapter").map((item) => item.file).sort();
    return {
      primitive,
      status: owners.length ? "owner-candidate" : adapters.length ? "adapter-only" : "not-detected",
      owners,
      adapters,
    };
  };
  const canonicalDefinitions = scan.tokenDefinitions.filter((item) => item.role === "canonical");
  const tokenKinds = countBy(canonicalDefinitions, (item) => item.kind);
  return {
    status: "draft-source-blueprint",
    disclaimer: "This is a source-derived candidate architecture. It is not a verified component API or visual parity claim.",
    staticLayers: [
      {
        id: "foundation",
        label: "Foundation",
        purpose: "Semantic visual decisions with one reviewed owner per application scope.",
        items: ["color", "typography", "spacing", "radius", "shadow", "motion", "layer"].map((kind) => ({ primitive: kind, status: tokenKinds[kind] ? "detected" : "not-detected", count: tokenKinds[kind] ?? 0 })),
      },
      {
        id: "atoms",
        label: "Atoms",
        purpose: "Small public controls with stable anatomy, variants, and visual states.",
        items: ["button", "iconbutton", "input", "textarea", "checkbox", "radio", "switch"].map(describe),
      },
      {
        id: "molecules",
        label: "Molecules",
        purpose: "Composed controls that coordinate labels, validation, disclosure, or anchoring.",
        items: ["formfield", "select", "dropdown", "popover", "tooltip"].map(describe),
      },
      {
        id: "components",
        label: "Components",
        purpose: "Product-level surfaces with explicit ownership and behavior contracts.",
        items: ["dialog", "sheet", "toast"].map(describe),
      },
    ],
    dynamicContracts: [
      {
        surface: "Controls",
        appliesTo: ["button", "iconbutton", "input", "textarea", "select", "checkbox", "radio", "switch"],
        states: ["default", "hover", "focus-visible", "active", "disabled", "loading", "invalid"],
        portal: "not applicable",
        layer: "content",
        keyboard: "Tab order plus native Enter/Space/Arrow behavior",
        focus: "Visible focus; no trap",
        dismissal: "not applicable",
        scroll: "no lock",
        motion: "feedback only; respect reduced motion",
      },
      {
        surface: "Dialog / Sheet",
        appliesTo: ["dialog", "sheet"],
        states: ["closed", "opening", "open", "closing", "nested"],
        portal: "required unless an evidenced local stacking context owns it",
        layer: "modal",
        keyboard: "Escape closes the topmost dismissible surface",
        focus: "Trap while open; restore trigger on close",
        dismissal: "Explicit close; outside click only when product-safe",
        scroll: "Lock the owned scroll container",
        motion: "paired enter/exit; respect reduced motion",
      },
      {
        surface: "Popover / Dropdown / Tooltip",
        appliesTo: ["popover", "dropdown", "tooltip"],
        states: ["closed", "opening", "open", "closing", "collision-adjusted"],
        portal: "document the portal and anchor boundary",
        layer: "floating",
        keyboard: "Escape plus Arrow/Home/End where the role requires it",
        focus: "Roving or managed focus by role; restore trigger",
        dismissal: "Outside pointer and focus transition rules",
        scroll: "No global lock; reposition or dismiss on scroll",
        motion: "short positional continuity; respect reduced motion",
      },
      {
        surface: "Toast",
        appliesTo: ["toast"],
        states: ["queued", "entering", "visible", "paused", "exiting", "dismissed"],
        portal: "single runtime owner",
        layer: "notification",
        keyboard: "Dismiss action remains reachable without stealing focus",
        focus: "Never auto-focus",
        dismissal: "Timeout, pause, and explicit dismiss contract",
        scroll: "no lock",
        motion: "non-blocking; respect reduced motion",
      },
    ],
  };
}

export async function auditRepository(repo, options = {}) {
  const root = path.resolve(repo);
  const rootStat = await stat(root);
  if (!rootStat.isDirectory()) throw new Error(`Repository path is not a directory: ${root}`);

  const collected = await collectFiles(root, options.collectOptions);
  const repoProfile = await discoverRepository(root, collected);
  const scan = await scanSources(collected);
  const classification = classifyAudit(scan);
  const findings = evaluateRules(scan, classification);
  const maturity = classifyLane(scan, classification, findings.length);
  const systemReview = buildSystemReview(scan, classification, findings);
  const repoId = sha(repoProfile.repoIdSeed, 24);
  const reportId = sha([
    repoId,
    POLICY_HASH,
    ...scan.tokenDefinitions.map((item) => item.id).sort(),
    ...scan.iconAssets.map((item) => item.id).sort(),
    ...scan.assetReferences.map((item) => item.id).sort(),
    ...scan.dynamicAssetReferences.map((item) => item.id).sort(),
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
      skippedByReason: countBy(collected.skipped, (item) => item.reason),
      excludedScopeEntries: collected.skipped.filter((item) => item.reason === "scope-excluded").map((item) => item.file).sort().slice(0, 200),
      unassessedAreas: scan.unassessedAreas,
    },
    styleSystems: [...new Set([...repoProfile.styleSystems, ...scan.styleSignals])].sort(),
    tokenDefinitions: stableSort(scan.tokenDefinitions, (item) => `${item.file}:${String(item.line).padStart(8, "0")}:${item.normalizedName}`),
    tokenReferences: stableSort(scan.tokenReferences, (item) => `${item.file}:${String(item.line).padStart(8, "0")}:${item.normalizedName}`),
    ...(options.includeRawValues ? { rawValues: stableSort(scan.rawValues, (item) => `${item.file}:${String(item.line).padStart(8, "0")}:${item.kind}:${item.value}`) } : {}),
    tokenOwners: classification.tokenOwners,
    componentOwners: classification.componentOwners,
    overlayOwners: classification.overlayOwners,
    componentAdapters: classification.componentAdapters,
    relationships: classification.relationships,
    conflicts: classification.conflicts,
    componentCandidates: stableSort(scan.componentCandidates, (item) => item.file),
    iconAssets: stableSort(scan.iconAssets, (item) => `${item.file}:${String(item.line ?? 0).padStart(8, "0")}:${item.source}`),
    assetReferences: stableSort(scan.assetReferences, (item) => `${item.file}:${String(item.line ?? 0).padStart(8, "0")}:${item.source}`),
    dynamicAssetReferences: stableSort(scan.dynamicAssetReferences, (item) => `${item.file}:${String(item.line ?? 0).padStart(8, "0")}:${item.source}`),
    duplicatedPrimitives: classification.duplicatedPrimitives,
    systemReview,
    componentBlueprint: buildComponentBlueprint(scan),
    findings,
    hotspots: buildHotspots(findings),
    maturity,
    recommendedLane: maturity.recommendedLane,
    nextActions: nextActions(maturity.recommendedLane, classification.conflicts),
  };
}
