import { sha, stableSort } from "./utils.mjs";

const THEME_SELECTOR = /(?:\.dark\b|\.light\b|data-theme|data-brand|prefers-color-scheme|theme-)/i;

function groupBy(items, selector) {
  const groups = new Map();
  for (const item of items) {
    const key = selector(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
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
  const byOwner = groupBy(definitions, (item) => item.ownerId);
  return stableSort([...byOwner.entries()].map(([id, items]) => ({
    id,
    file: items[0].file,
    definitionCount: items.length,
    sourceTypes: [...new Set(items.map((item) => item.sourceType))].sort(),
    kinds: [...new Set(items.map((item) => item.kind))].sort(),
    globalDefinitionCount: items.filter((item) => item.sourceType !== "css-variable" || /^(?::root|html|body|unknown)$/i.test(item.selector)).length,
    substantial: items.filter((item) => item.sourceType !== "css-variable" || /^(?::root|html|body|unknown)$/i.test(item.selector)).length >= 3,
  })), (item) => item.file);
}

function applicationScope(file) {
  const match = file.match(/(?:^|\/)(?:tooling\/)?apps\/([^/]+)\//);
  return match ? match[1] : null;
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
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent.set(rightRoot, leftRoot);
  };
  for (const relation of adapterRelationships) {
    for (let index = 1; index < relation.ownerIds.length; index += 1) {
      union(relation.ownerIds[0], relation.ownerIds[index]);
    }
  }
  return groupBy(owners, (owner) => find(owner.id));
}

function classifyComponents(candidates) {
  const byDirectory = groupBy(candidates.filter((item) => item.shared), (item) => item.directory);
  const owners = stableSort([...byDirectory.entries()].map(([directory, items]) => ({
    id: `component-owner-${sha(directory)}`,
    directory,
    componentCount: items.length,
    primitives: [...new Set(items.map((item) => item.primitive))].sort(),
    files: items.map((item) => item.file).sort(),
  })), (item) => item.directory);
  const overlayOwners = owners
    .map((owner) => ({
      ...owner,
      primitives: owner.primitives.filter((primitive) => ["dialog", "sheet", "popover", "dropdown", "toast", "tooltip"].includes(primitive)),
    }))
    .filter((owner) => owner.primitives.length);
  return { owners, overlayOwners };
}

export function classifyAudit(scan) {
  const relationships = [];
  const conflicts = [];
  const definitionsByName = groupBy(scan.tokenDefinitions, (item) => item.normalizedName);
  const definitionsByValue = groupBy(
    scan.tokenDefinitions.filter((item) => item.normalizedValue && !item.normalizedValue.startsWith("var(")),
    (item) => `${item.kind}:${item.normalizedValue}`,
  );

  for (const definition of scan.tokenDefinitions) {
    const aliases = [...definition.value.matchAll(/var\(\s*(--[a-zA-Z0-9_-]+)/g)].map((match) => match[1]);
    for (const alias of aliases) {
      const targets = definitionsByName.get(alias.replace(/^--/, "").toLowerCase()) ?? [];
      if (!targets.length) continue;
      relationships.push(relationship(
        "adapter",
        [definition, ...targets],
        `${definition.name} references ${alias}`,
        0.99,
        false,
      ));
    }
  }

  for (const [name, definitions] of definitionsByName) {
    if (definitions.length < 2) continue;
    const values = new Set(definitions.map((item) => item.normalizedValue));
    const owners = new Set(definitions.map((item) => item.ownerId));
    if (values.size === 1 && owners.size > 1) {
      const relation = relationship("duplicate", definitions, `The same Token name and value are defined by ${owners.size} owners`, 0.96, true);
      relationships.push(relation);
      conflicts.push({ ...relation, title: `Duplicate Token: ${name}` });
      continue;
    }
    if (values.size > 1) {
      const selectorsAreKnown = definitions.every((item) => item.selector !== "unknown");
      const hasSelectorScope = selectorsAreKnown && definitions.some((item) => !/^(?::root|html|body)$/i.test(item.selector));
      const appScopes = definitions.map((item) => applicationScope(item.file));
      const hasAppScope = appScopes.every(Boolean) && new Set(appScopes).size > 1;
      const hasExplicitScope = definitions.some((item) => THEME_SELECTOR.test(item.selector)) || hasSelectorScope || hasAppScope;
      const scoped = hasExplicitScope && definitions.every((item) => THEME_SELECTOR.test(item.selector) || /^(?::root|html|body)$/i.test(item.selector) || item.selector !== "unknown");
      const type = scoped ? "scope-override" : "semantic-conflict";
      const relation = relationship(
        type,
        definitions,
        scoped ? `Different values are defined in evidenced theme or brand scopes` : `The same Token name resolves to ${values.size} different values without a complete scope contract`,
        scoped ? 0.88 : 0.98,
        !scoped,
      );
      relationships.push(relation);
      if (!scoped) conflicts.push({ ...relation, title: `Semantic conflict: ${name}` });
    }
  }

  let equalValueCandidateCount = 0;
  for (const definitions of definitionsByValue.values()) {
    const names = new Set(definitions.map((item) => item.normalizedName));
    if (names.size < 2 || equalValueCandidateCount >= 80) continue;
    const relation = relationship("duplicate", definitions, `${names.size} Token names share the same rendered value; equal values do not prove equal semantics`, 0.62, true);
    relationships.push(relation);
    conflicts.push({ ...relation, title: `Shared value across ${names.size} Token names` });
    equalValueCandidateCount += 1;
  }

  const tokenOwners = buildTokenOwners(scan.tokenDefinitions);
  const adapters = relationships.filter((item) => item.type === "adapter");
  const ownerComponents = buildOwnerComponents(tokenOwners, adapters);
  const substantialComponents = [...ownerComponents.values()].filter((owners) => owners.some((owner) => owner.substantial));
  if (substantialComponents.length > 1) {
    const owners = substantialComponents.flat().filter((owner) => owner.substantial);
    const relation = {
      id: `relationship-${sha(`owner-conflict:${owners.map((item) => item.id).sort().join("|")}`)}`,
      type: "owner-conflict",
      definitionIds: scan.tokenDefinitions.filter((item) => owners.some((owner) => owner.id === item.ownerId)).map((item) => item.id).sort(),
      ownerIds: owners.map((item) => item.id).sort(),
      reason: `${owners.length} substantial Token owners are not connected by detected aliases or adapters`,
      confidence: 0.9,
      reviewRequired: true,
      title: "Competing Token owners",
    };
    relationships.push(relation);
    conflicts.unshift(relation);
  }

  const components = classifyComponents(scan.componentCandidates);
  const primitivesByName = groupBy(scan.componentCandidates, (item) => item.primitive);
  const duplicatedPrimitives = [...primitivesByName.entries()]
    .filter(([, items]) => new Set(items.map((item) => item.file)).size > 1)
    .map(([primitive, items]) => ({ primitive, files: items.map((item) => item.file).sort() }))
    .sort((left, right) => left.primitive.localeCompare(right.primitive));

  return {
    tokenOwners,
    componentOwners: components.owners,
    overlayOwners: components.overlayOwners,
    relationships: stableSort(relationships, (item) => `${item.type}:${item.id}`),
    conflicts: stableSort(conflicts, (item) => `${item.type}:${item.id}`),
    duplicatedPrimitives,
  };
}

export function classifyLane(scan, classification, findingCount) {
  const tokenCount = scan.tokenDefinitions.length;
  const componentCount = scan.componentCandidates.length;
  const ownerConflict = classification.conflicts.some((item) => item.type === "owner-conflict");
  const semanticConflictCount = classification.conflicts.filter((item) => item.type === "semantic-conflict").length;
  const rawCount = scan.rawValues.length;
  const duplicateComponentCount = classification.duplicatedPrimitives.length;
  let recommendedLane = "Hybrid";
  let confidence = 0.78;

  if (tokenCount < 3 && componentCount < 3) {
    recommendedLane = "Bootstrap";
    confidence = 0.91;
  } else if (ownerConflict || semanticConflictCount > 0 || duplicateComponentCount >= 3 || (tokenCount >= 100 && rawCount > 500) || componentCount >= 20) {
    recommendedLane = "Migrate";
    confidence = ownerConflict || semanticConflictCount ? 0.94 : 0.84;
  }

  const evidence = [
    `${tokenCount} Token definitions across ${classification.tokenOwners.length} candidate owners`,
    `${componentCount} primitive component candidates across ${classification.componentOwners.length} shared directories`,
    `${rawCount} raw visual-value occurrences`,
    `${classification.conflicts.length} review-required Token groups`,
    `${duplicateComponentCount} duplicated primitive names`,
    `${findingCount} total source findings`,
  ];

  return {
    status: recommendedLane === "Bootstrap" ? "foundation-missing" : recommendedLane === "Migrate" ? "fragmented" : "partial-foundation",
    confidence,
    evidence,
    recommendedLane,
  };
}
