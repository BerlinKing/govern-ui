import { sha, stableSort } from "./utils.mjs";

const THEME_SELECTOR = /(?:\.dark\b|\.light\b|data-theme|data-brand|prefers-color-scheme|theme-)/i;
const GLOBAL_SELECTOR = /^(?::root|html|body|unknown)$/i;
const OVERLAY_PRIMITIVES = new Set(["dialog", "sheet", "popover", "dropdown", "toast", "tooltip"]);

function groupBy(items, selector) {
  const groups = new Map();
  for (const item of items) {
    const key = selector(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}

function sourceScope(file) {
  const app = file.match(/(?:^|\/)(?:tooling\/)?apps\/([^/]+)\//);
  if (app) return `app:${app[1]}`;
  const pkg = file.match(/(?:^|\/)packages\/([^/]+)\//);
  if (pkg) return `package:${pkg[1]}`;
  return "root";
}

function relationship(type, definitions, reason, confidence, reviewRequired = false) {
  const definitionIds = definitions.map((item) => item.id).sort();
  const ownerIds = [...new Set(definitions.map((item) => item.ownerId))].sort();
  return {
    id: `relationship-${sha(`${type}:${definitionIds.join("|")}`)}`,
    type,
    definitionIds,
    ownerIds,
    reason,
    confidence,
    reviewRequired,
  };
}

function buildTokenOwners(definitions) {
  const byOwner = groupBy(definitions.filter((item) => item.role === "canonical"), (item) => item.ownerId);
  return stableSort([...byOwner.entries()].map(([id, items]) => {
    const globalDefinitionCount = items.filter((item) => item.sourceType !== "css-variable" || GLOBAL_SELECTOR.test(item.selector)).length;
    return {
      id,
      file: items[0].file,
      scope: sourceScope(items[0].file),
      definitionCount: items.length,
      sourceTypes: [...new Set(items.map((item) => item.sourceType))].sort(),
      kinds: [...new Set(items.map((item) => item.kind))].sort(),
      globalDefinitionCount,
      substantial: globalDefinitionCount >= 3,
    };
  }), (item) => item.file);
}

function buildOwnerComponents(owners, adapterRelationships) {
  const parent = new Map(owners.map((owner) => [owner.id, owner.id]));
  const find = (value) => {
    const current = parent.get(value) ?? value;
    if (current === value) return value;
    const root = find(current);
    parent.set(value, root);
    return root;
  };
  const union = (left, right) => {
    if (!parent.has(left) || !parent.has(right)) return;
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent.set(rightRoot, leftRoot);
  };
  for (const relation of adapterRelationships) {
    for (let index = 1; index < relation.ownerIds.length; index += 1) union(relation.ownerIds[0], relation.ownerIds[index]);
  }
  return groupBy(owners, (owner) => find(owner.id));
}

function classifyComponents(candidates) {
  const ownerCandidates = candidates.filter((item) => item.role === "owner");
  const adapters = candidates.filter((item) => item.role === "adapter");
  const byDirectory = groupBy(ownerCandidates, (item) => item.directory);
  const owners = stableSort([...byDirectory.entries()].map(([directory, items]) => ({
    id: `component-owner-${sha(directory)}`,
    directory,
    scope: sourceScope(items[0].file),
    componentCount: items.length,
    primitives: [...new Set(items.map((item) => item.primitive))].sort(),
    files: items.map((item) => item.file).sort(),
  })), (item) => item.directory);
  const overlayOwners = owners
    .map((owner) => ({ ...owner, primitives: owner.primitives.filter((primitive) => OVERLAY_PRIMITIVES.has(primitive)) }))
    .filter((owner) => owner.primitives.length);
  return { owners, overlayOwners, adapters };
}

export function classifyAudit(scan) {
  const relationships = [];
  const conflicts = [];
  const allDefinitionsByName = groupBy(scan.tokenDefinitions, (item) => item.normalizedName);
  const canonicalDefinitions = scan.tokenDefinitions.filter((item) => item.role === "canonical");
  const definitionsByName = groupBy(canonicalDefinitions, (item) => item.normalizedName);
  const definitionsByValue = groupBy(
    canonicalDefinitions.filter((item) => item.normalizedValue && !item.normalizedValue.startsWith("var(")),
    (item) => `${item.kind}:${item.normalizedValue}`,
  );

  for (const definition of scan.tokenDefinitions) {
    const aliases = [...definition.value.matchAll(/var\(\s*(--[a-zA-Z0-9_-]+)/g)].map((match) => match[1]);
    for (const alias of aliases) {
      const targets = allDefinitionsByName.get(alias.replace(/^--/, "").toLowerCase()) ?? [];
      if (!targets.length) continue;
      relationships.push(relationship("adapter", [definition, ...targets], `${definition.name} references ${alias}`, 0.99, false));
    }
  }

  for (const [name, definitions] of definitionsByName) {
    if (definitions.length < 2) continue;
    const values = new Set(definitions.map((item) => item.normalizedValue));
    const owners = new Set(definitions.map((item) => item.ownerId));
    if (values.size === 1 && owners.size > 1) {
      const relation = relationship("duplicate", definitions, `The same canonical Token name and value are copied across ${owners.size} owners`, 0.96, true);
      relationships.push(relation);
      conflicts.push({ ...relation, title: `Duplicate Token: ${name}` });
      continue;
    }
    if (values.size > 1) {
      const selectorsAreKnown = definitions.every((item) => item.selector !== "unknown");
      const hasSelectorScope = selectorsAreKnown && definitions.some((item) => !GLOBAL_SELECTOR.test(item.selector));
      const appScopes = definitions.map((item) => sourceScope(item.file));
      const separateApps = appScopes.every((scope) => scope.startsWith("app:")) && new Set(appScopes).size > 1;
      const scoped = separateApps || (selectorsAreKnown && (definitions.some((item) => THEME_SELECTOR.test(item.selector)) || hasSelectorScope));
      const type = scoped ? "scope-override" : "semantic-conflict";
      const relation = relationship(
        type,
        definitions,
        scoped ? "Different values are defined in evidenced application, theme, or selector scopes" : `The same canonical Token name resolves to ${values.size} values without a complete scope contract`,
        scoped ? 0.9 : 0.97,
        !scoped,
      );
      relationships.push(relation);
      if (!scoped) conflicts.push({ ...relation, title: `Semantic conflict: ${name}` });
    }
  }

  let valueCollisionCount = 0;
  for (const definitions of definitionsByValue.values()) {
    const names = new Set(definitions.map((item) => item.normalizedName));
    if (names.size < 2 || valueCollisionCount >= 80) continue;
    relationships.push(relationship("value-collision", definitions, `${names.size} canonical Token names share one rendered value; this is an observation, not proof of duplicate semantics`, 0.62, false));
    valueCollisionCount += 1;
  }

  const tokenOwners = buildTokenOwners(scan.tokenDefinitions);
  const adapters = relationships.filter((item) => item.type === "adapter");
  const ownersByScope = groupBy(tokenOwners, (owner) => owner.scope);
  for (const [scope, scopeOwners] of ownersByScope) {
    const ownerComponents = buildOwnerComponents(scopeOwners, adapters);
    const substantialComponents = [...ownerComponents.values()].filter((owners) => owners.some((owner) => owner.substantial));
    if (substantialComponents.length <= 1) continue;
    const owners = substantialComponents.flat().filter((owner) => owner.substantial);
    const relation = {
      id: `relationship-${sha(`owner-conflict:${scope}:${owners.map((item) => item.id).sort().join("|")}`)}`,
      type: "owner-conflict",
      definitionIds: canonicalDefinitions.filter((item) => owners.some((owner) => owner.id === item.ownerId)).map((item) => item.id).sort(),
      ownerIds: owners.map((item) => item.id).sort(),
      reason: `${owners.length} substantial canonical Token owners in ${scope} are not connected by detected aliases or adapters`,
      confidence: 0.92,
      reviewRequired: true,
      title: `Competing Token owners in ${scope}`,
    };
    relationships.push(relation);
    conflicts.push(relation);
  }

  const components = classifyComponents(scan.componentCandidates);
  const ownerComponentCandidates = scan.componentCandidates.filter((item) => item.role === "owner");
  const primitivesByName = groupBy(ownerComponentCandidates, (item) => item.primitive);
  const duplicatedPrimitives = [...primitivesByName.entries()]
    .filter(([, items]) => new Set(items.map((item) => item.file)).size > 1)
    .map(([primitive, items]) => ({ primitive, files: items.map((item) => item.file).sort() }))
    .sort((left, right) => left.primitive.localeCompare(right.primitive));

  return {
    tokenOwners,
    componentOwners: components.owners,
    overlayOwners: components.overlayOwners,
    componentAdapters: stableSort(components.adapters, (item) => item.file),
    relationships: stableSort(relationships, (item) => `${item.type}:${item.id}`),
    conflicts: stableSort(conflicts, (item) => `${item.type}:${item.id}`),
    duplicatedPrimitives,
  };
}

export function classifyLane(scan, classification, findingCount) {
  const canonicalTokenCount = scan.tokenDefinitions.filter((item) => item.role === "canonical").length;
  const ownerComponentCount = scan.componentCandidates.filter((item) => item.role === "owner").length;
  const ownerConflictCount = classification.conflicts.filter((item) => item.type === "owner-conflict").length;
  const semanticConflictCount = classification.conflicts.filter((item) => item.type === "semantic-conflict").length;
  const duplicateComponentCount = classification.duplicatedPrimitives.length;
  const rawCount = scan.rawValues.length;
  const hasFoundation = canonicalTokenCount >= 3 || ownerComponentCount >= 2;

  let recommendedLane = "Hybrid";
  let confidence = 0.78;
  if (!hasFoundation) {
    recommendedLane = "Bootstrap";
    confidence = 0.9;
  } else if (ownerConflictCount > 0 || semanticConflictCount >= 3 || duplicateComponentCount >= 3) {
    recommendedLane = "Migrate";
    confidence = Math.min(0.95, 0.78 + Math.min(ownerConflictCount, 2) * 0.08 + Math.min(semanticConflictCount, 6) * 0.015 + Math.min(duplicateComponentCount, 3) * 0.02);
  } else {
    confidence = Math.min(0.9, 0.74 + (canonicalTokenCount >= 20 ? 0.06 : 0) + (ownerComponentCount >= 2 ? 0.04 : 0) + (classification.conflicts.length === 0 ? 0.03 : 0));
  }

  const evidence = [
    `${canonicalTokenCount} canonical Token definitions across ${classification.tokenOwners.length} candidate owners`,
    `${scan.tokenDefinitions.length - canonicalTokenCount} adapter or local framework definitions excluded from canonical conflicts`,
    `${ownerComponentCount} exact-name primitive owners and ${classification.componentAdapters.length} detected component adapters`,
    `${rawCount} raw visual-value occurrences inside the included source scope`,
    `${classification.conflicts.length} review-required Token groups (${ownerConflictCount} owner, ${semanticConflictCount} semantic)`,
    `${duplicateComponentCount} duplicated exact-name primitive owners`,
    `${findingCount} total source findings inside the included source scope`,
  ];

  return {
    status: recommendedLane === "Bootstrap" ? "foundation-missing" : recommendedLane === "Migrate" ? "fragmented" : "partial-foundation",
    confidence,
    confidenceBasis: "heuristic-evidence-score",
    evidence,
    recommendedLane,
  };
}
