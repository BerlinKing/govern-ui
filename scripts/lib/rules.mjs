import { normalizeEvidence, sha, stableSort } from "./utils.mjs";

export const RULESET_VERSION = "lite-0.7.0";
export const POLICY_HASH = sha(`govern-ui:${RULESET_VERSION}`, 24);

function findingFactory() {
  const occurrences = new Map();
  return (input) => {
    const normalized = normalizeEvidence(input.evidence);
    const occurrenceKey = `${input.ruleId}:${input.file}:${normalized}`;
    const occurrence = occurrences.get(occurrenceKey) ?? 0;
    occurrences.set(occurrenceKey, occurrence + 1);
    return {
      ruleId: input.ruleId,
      severity: input.severity,
      confidence: input.confidence,
      file: input.file,
      line: input.line ?? 1,
      evidence: normalized,
      fingerprint: sha(`${input.ruleId}:${input.file}:${normalized}:${occurrence}`, 24),
      suggestedAction: input.suggestedAction,
      autofix: "none",
      verification: "source",
      category: input.category,
    };
  };
}

export function evaluateRules(scan, classification) {
  const make = findingFactory();
  const findings = [];
  const hasTokenOwner = classification.tokenOwners.length > 0;
  const sharedPrimitives = new Set(scan.componentCandidates.filter((item) => item.shared && item.role === "owner").map((item) => item.primitive));

  if (!hasTokenOwner) {
    findings.push(make({
      ruleId: "system.token-owner-missing",
      severity: "medium",
      confidence: 0.95,
      file: "package.json",
      evidence: "No Token owner was detected in the scanned source",
      suggestedAction: "Confirm the real style entrypoints before creating a Token foundation",
      category: "system",
    }));
  }

  for (const conflict of classification.conflicts) {
    const definitions = scan.tokenDefinitions.filter((item) => conflict.definitionIds.includes(item.id));
    const first = definitions[0];
    const isSemantic = conflict.type === "semantic-conflict";
    const isOwner = conflict.type === "owner-conflict";
    findings.push(make({
      ruleId: isSemantic ? "token.semantic-conflict" : isOwner ? "system.token-owner-ambiguous" : "token.duplicate-definition",
      severity: isSemantic || isOwner ? "high" : "medium",
      confidence: conflict.confidence,
      file: first?.file ?? classification.tokenOwners[0]?.file ?? "package.json",
      line: first?.line ?? 1,
      evidence: conflict.reason,
      suggestedAction: isSemantic || isOwner ? "Review the HTML comparison and explicitly select or separate owners" : "Review semantics before aliasing or consolidating",
      category: isOwner ? "system" : "token",
    }));
  }

  const unresolvedCounts = new Map();
  for (const reference of scan.unresolvedReferences) unresolvedCounts.set(reference.normalizedName, (unresolvedCounts.get(reference.normalizedName) ?? 0) + 1);
  for (const reference of scan.unresolvedReferences) {
    const tokenLike = /^(?:color|space|spacing|font|text|line|radius|shadow|motion|duration|easing|layer|z)-/.test(reference.normalizedName);
    const repeated = (unresolvedCounts.get(reference.normalizedName) ?? 0) >= 2;
    const highConfidence = tokenLike && repeated;
    findings.push(make({
      ruleId: "token.undefined-reference",
      severity: highConfidence ? "high" : "medium",
      confidence: highConfidence ? 0.95 : 0.78,
      file: reference.file,
      line: reference.line,
      evidence: reference.context,
      suggestedAction: `Define ${reference.name}, correct the reference, or document its external provider`,
      category: "token",
    }));
  }

  for (const raw of scan.rawValues) {
    if (raw.kind === "color") {
      findings.push(make({
        ruleId: "token.raw-color",
        severity: hasTokenOwner ? "medium" : "low",
        confidence: 0.96,
        file: raw.file,
        line: raw.line,
        evidence: raw.evidence,
        suggestedAction: hasTokenOwner ? "Review against a semantic color Token" : "Include this value in the Bootstrap inventory",
        category: "token",
      }));
    } else if (raw.kind === "length") {
      const typography = /font-size|line-height|letter-spacing/i.test(raw.evidence);
      findings.push(make({
        ruleId: typography ? "token.raw-typography" : "token.raw-length",
        severity: "low",
        confidence: 0.78,
        file: raw.file,
        line: raw.line,
        evidence: raw.evidence,
        suggestedAction: "Review whether this is semantic spacing/typography or legitimate geometry",
        category: "token",
      }));
    } else if (raw.kind === "typography") {
      findings.push(make({
        ruleId: "token.raw-typography",
        severity: "low",
        confidence: 0.84,
        file: raw.file,
        line: raw.line,
        evidence: raw.evidence,
        suggestedAction: "Review this font or text metric against the shared typography contract",
        category: "token",
      }));
    } else if (raw.kind === "stroke") {
      findings.push(make({
        ruleId: "token.raw-stroke",
        severity: "low",
        confidence: 0.82,
        file: raw.file,
        line: raw.line,
        evidence: raw.evidence,
        suggestedAction: "Review this border or outline against shared shape and stroke roles",
        category: "token",
      }));
    } else if (raw.kind === "shadow" || raw.kind === "depth-effect") {
      findings.push(make({
        ruleId: raw.kind === "shadow" ? "token.raw-shadow" : "token.raw-depth-effect",
        severity: "low",
        confidence: 0.82,
        file: raw.file,
        line: raw.line,
        evidence: raw.evidence,
        suggestedAction: "Review this visual depth value against the shared elevation and layer contract",
        category: "token",
      }));
    } else if (raw.kind === "motion") {
      findings.push(make({
        ruleId: "token.raw-motion",
        severity: "low",
        confidence: 0.82,
        file: raw.file,
        line: raw.line,
        evidence: raw.evidence,
        suggestedAction: "Review against the shared motion-duration and easing contract",
        category: "token",
      }));
    } else if (raw.kind === "arbitrary-tailwind") {
      findings.push(make({
        ruleId: "token.semantic-layer-bypass",
        severity: hasTokenOwner ? "medium" : "low",
        confidence: 0.74,
        file: raw.file,
        line: raw.line,
        evidence: raw.evidence,
        suggestedAction: "Review the arbitrary value against existing semantic Tokens",
        category: "token",
      }));
    } else if (raw.kind === "z-index") {
      const numeric = Number((raw.value.match(/-?\d+/) ?? [0])[0]);
      findings.push(make({
        ruleId: "overlay.raw-z-index",
        severity: Math.abs(numeric) >= 999 ? "high" : "medium",
        confidence: 0.99,
        file: raw.file,
        line: raw.line,
        evidence: raw.evidence,
        suggestedAction: "Map this value to an explicit semantic layer after reviewing overlay ownership",
        category: "overlay",
      }));
    }
  }

  for (const duplicate of classification.duplicatedPrimitives) {
    findings.push(make({
      ruleId: duplicate.primitive === "dialog" ? "component.dialog-duplication" : "component.primitive-duplication",
      severity: ["dialog", "sheet", "popover", "dropdown", "toast"].includes(duplicate.primitive) ? "high" : "medium",
      confidence: 0.88,
      file: duplicate.files[0],
      evidence: `${duplicate.primitive} candidates: ${duplicate.files.join(", ")}`,
      suggestedAction: "Inspect behavior and consumers before selecting a canonical component owner",
      category: duplicate.primitive === "dialog" ? "overlay" : "component",
    }));
  }

  for (const native of scan.nativeControls) {
    const primitive = native.element === "textarea" ? "textarea" : native.element;
    if (!sharedPrimitives.has(primitive) && !(primitive === "button" && sharedPrimitives.has("iconbutton"))) continue;
    findings.push(make({
      ruleId: primitive === "button" ? "component.native-button-bypass" : "component.native-input-bypass",
      severity: "medium",
      confidence: 0.72,
      file: native.file,
      line: native.line,
      evidence: native.evidence,
      suggestedAction: "Confirm whether this native control intentionally bypasses the shared primitive",
      category: "component",
    }));
  }

  return stableSort(findings, (item) => `${item.file}:${String(item.line).padStart(8, "0")}:${item.ruleId}:${item.fingerprint}`);
}
