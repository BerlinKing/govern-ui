import path from "node:path";

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function humanize(value) {
  return String(value ?? "")
    .replace(/\.(?:tsx?|jsx?|vue|svelte|astro|css|scss|sass|less)$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function cleanSegment(value) {
  return value && !/^(?:src|app|apps|packages|components|component|pages|routes|styles|style|css|ui|shared|common|lib|utils?|index)$/i.test(value)
    ? value
    : null;
}

function routeFromFile(file) {
  const parts = file.split("/");
  const marker = parts.findIndex((part) => /^(?:pages|routes|app)$/i.test(part));
  if (marker < 0) return null;
  const route = parts.slice(marker + 1)
    .filter((part) => !/^(?:index|page|layout|route)\.(?:tsx?|jsx?|vue|svelte|astro)$/i.test(part))
    .map((part) => part.replace(/\.(?:tsx?|jsx?|vue|svelte|astro)$/i, ""))
    .filter(Boolean)
    .join("/");
  return route ? `/${route.replace(/\[(?:\.\.\.)?([^\]]+)\]/g, ":$1")}` : "/";
}

function statesFromEvidence(value) {
  const text = String(value ?? "").toLowerCase();
  const states = [];
  for (const state of ["hover", "focus-visible", "focus", "active", "pressed", "selected", "checked", "disabled", "loading", "open", "closed", "invalid", "error", "success", "warning"]) {
    if (text.includes(state)) states.push(state);
  }
  return unique(states);
}

export function inferProductLocation(file, evidence = "") {
  const normalized = String(file ?? "").replaceAll("\\", "/");
  const parts = normalized.split("/").filter(Boolean);
  const appIndex = parts.indexOf("apps");
  const packageIndex = parts.indexOf("packages");
  const componentIndex = parts.findIndex((part) => /^components?$/i.test(part));
  const app = appIndex >= 0 ? parts[appIndex + 1] : null;
  const packageName = packageIndex >= 0 ? parts[packageIndex + 1] : null;
  const componentFile = path.posix.basename(normalized);
  const component = /\.(?:tsx?|jsx?|vue|svelte|astro)$/i.test(componentFile) ? humanize(componentFile) : null;
  const afterComponent = componentIndex >= 0 ? parts[componentIndex + 1] : null;
  const featureSegment = cleanSegment(afterComponent)
    ?? cleanSegment(parts.find((part, index) => index > Math.max(appIndex + 1, packageIndex + 1) && /^(?:features?|modules?|screens?)$/i.test(parts[index - 1])))
    ?? cleanSegment(app)
    ?? cleanSegment(packageName);
  const feature = featureSegment ? humanize(featureSegment) : component ? humanize(component) : humanize(path.posix.dirname(normalized).split("/").at(-1));
  const page = routeFromFile(normalized);
  const scope = app ? `app:${app}` : packageName ? `package:${packageName}` : normalized.startsWith("src/") ? "application" : "repository";
  return {
    app: app ? humanize(app) : null,
    package: packageName ? humanize(packageName) : null,
    feature,
    component,
    page,
    scope,
    states: statesFromEvidence(evidence),
    inferred: Boolean(feature || page),
  };
}

function usageExample(item, evidence = "source-confirmed") {
  const location = inferProductLocation(item.file, `${item.selector ?? ""} ${item.context ?? ""} ${item.evidence ?? ""}`);
  return {
    file: item.file,
    line: item.line,
    selector: item.selector ?? null,
    property: item.property ?? null,
    referenceKind: item.kind ?? null,
    context: item.context ?? item.evidence ?? null,
    feature: location.feature,
    component: location.component,
    page: location.page,
    scope: location.scope,
    states: location.states,
    evidence,
    inference: location.inferred ? "structure-inferred" : null,
  };
}

function ownerScope(file) {
  const normalized = String(file ?? "").replaceAll("\\", "/");
  return normalized.match(/^(apps\/[^/]+|packages\/[^/]+|services\/[^/]+)/)?.[1]
    ?? (normalized.startsWith("src/") ? "application" : normalized.split("/")[0] || "repository");
}

function consumerReference(reference) {
  return !["alias-definition", "adapter-definition"].includes(reference.kind);
}

function compatibleReference(token, reference) {
  const property = String(reference.property ?? "").toLowerCase();
  if (!property) return true;
  if (token.category === "color") return /^(?:background|color|caret-color|text-decoration-color|border-color|outline-color|fill|stroke)$/.test(property);
  if (token.category === "shadow") return /^(?:box-shadow|text-shadow)$/.test(property);
  if (token.category === "typography") return /^(?:font|font-family|font-size|font-weight|font-style|line-height|letter-spacing)$/.test(property);
  if (token.category === "stroke") return /^(?:border-width|border-style|outline-width|outline-style|stroke-width)$/.test(property);
  return true;
}

export function buildTokenUsage(tokens, references) {
  const refsByName = new Map();
  for (const reference of references ?? []) {
    if (!refsByName.has(reference.normalizedName)) refsByName.set(reference.normalizedName, []);
    refsByName.get(reference.normalizedName).push(reference);
  }
  const tokensByName = new Map();
  for (const token of tokens) {
    if (!tokensByName.has(token.normalizedName)) tokensByName.set(token.normalizedName, []);
    tokensByName.get(token.normalizedName).push(token);
  }
  return new Map(tokens.map((token) => {
    const tokenScope = ownerScope(token.file);
    const sameNameDefinitions = tokensByName.get(token.normalizedName) ?? [];
    const scopedReferences = (refsByName.get(token.normalizedName) ?? []).filter(consumerReference).filter((reference) => compatibleReference(token, reference));
    const direct = sameNameDefinitions.length > 1
      ? scopedReferences.filter((reference) => reference.file === token.file || ownerScope(reference.file) === tokenScope)
      : scopedReferences;
    const downstreamTokens = tokens.filter((candidate) => candidate.id !== token.id
      && ownerScope(candidate.file) === tokenScope
      && candidate.category === token.category
      && candidate.aliasChain.some((name) => name.replace(/^--/, "").toLowerCase() === token.normalizedName));
    const downstream = downstreamTokens.flatMap((candidate) => {
      const candidateDefinitions = tokensByName.get(candidate.normalizedName) ?? [];
      const candidateRefs = (refsByName.get(candidate.normalizedName) ?? []).filter(consumerReference).filter((reference) => compatibleReference(candidate, reference));
      return candidateDefinitions.length > 1
        ? candidateRefs.filter((reference) => reference.file === candidate.file || ownerScope(reference.file) === tokenScope)
        : candidateRefs;
    });
    const examples = [...direct.map((item) => usageExample(item)), ...downstream.map((item) => usageExample(item, "source-confirmed-via-alias"))];
    const definitionLocation = inferProductLocation(token.file, token.selector);
    const consumerFeatures = unique(examples.map((item) => item.feature));
    return [token.id, {
      definitionOwner: {
        file: token.file,
        line: token.line,
        scope: token.scope,
        productArea: definitionLocation.feature,
      },
      directReferenceCount: direct.length,
      downstreamReferenceCount: downstream.length,
      totalReferenceCount: direct.length + downstream.length,
      aliasesConsumed: unique(downstreamTokens.map((item) => item.name)),
      features: consumerFeatures,
      components: unique(examples.map((item) => item.component)),
      pages: unique(examples.map((item) => item.page)),
      scopes: unique(examples.map((item) => item.scope)),
      states: unique(examples.flatMap((item) => item.states)),
      evidenceLevels: unique(examples.flatMap((item) => [item.evidence, item.inference])),
      examples: examples.slice(0, 12),
      summary: consumerFeatures.length
        ? consumerFeatures.slice(0, 3).join(", ")
        : `Defined in ${definitionLocation.feature || token.file}`,
      externallyUnverified: !direct.length && !downstream.length,
    }];
  }));
}

export function usageForRawValue(raw) {
  const example = usageExample(raw);
  return {
    features: unique([example.feature]),
    components: unique([example.component]),
    pages: unique([example.page]),
    scopes: unique([example.scope]),
    states: example.states,
    evidenceLevels: unique([example.evidence, example.inference]),
    examples: [example],
    summary: example.feature || example.component || raw.file,
  };
}
