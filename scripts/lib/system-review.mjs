const FOUNDATION_CATEGORIES = [
  { id: "token-architecture", tokenKinds: [], subcategories: ["primitive-tokens", "semantic-tokens", "component-tokens", "aliases", "ownership", "scope-contract"] },
  { id: "color", tokenKinds: ["color"], subcategories: ["primitive-palette", "brand-action", "semantic-surface", "feedback-color", "interaction-color", "theme-scope", "data-visualization"] },
  { id: "typography", tokenKinds: ["typography"], subcategories: ["font-family", "type-roles", "type-scale", "type-metrics", "numeric-code", "responsive-type"] },
  { id: "spacing-density", tokenKinds: ["spacing"], subcategories: ["spacing-scale", "component-spacing", "layout-spacing", "control-sizing", "density-modes"] },
  { id: "grid-responsive", tokenKinds: [], subcategories: ["breakpoints", "containers", "columns-gutters", "responsive-rules", "safe-area"] },
  { id: "shape-stroke", tokenKinds: ["radius", "stroke"], subcategories: ["radius-scale", "border-width", "border-style", "dividers", "focus-ring"] },
  { id: "depth-layer", tokenKinds: ["shadow", "layer", "depth"], subcategories: ["elevation", "shadow", "opacity-scrim", "blur", "z-index-stack"] },
  { id: "icon-assets", tokenKinds: [], primitives: ["icon", "image", "avatar"], subcategories: ["icon-library", "icon-size-grid", "stroke-fill", "logos", "illustration-image"] },
  { id: "motion-parameters", tokenKinds: ["motion"], subcategories: ["duration", "easing", "delay", "spring", "reduced-motion"] },
  { id: "accessibility-baseline", tokenKinds: [], subcategories: ["contrast", "minimum-text", "touch-target", "focus-visibility", "non-color-cues"] },
];

const STATIC_LAYERS = [
  { id: "foundation", categories: FOUNDATION_CATEGORIES },
  {
    id: "atoms",
    categories: [
      { id: "layout-primitives", primitives: ["box", "stack", "inline", "grid", "divider"] },
      { id: "content-primitives", primitives: ["text", "heading", "icon", "image", "avatar"] },
      { id: "action-primitives", primitives: ["button", "iconbutton", "link"] },
      { id: "input-primitives", primitives: ["input", "textarea"] },
      { id: "selection-primitives", primitives: ["checkbox", "radio", "switch"] },
      { id: "status-primitives", primitives: ["badge", "tag", "spinner", "skeleton", "progress"] },
    ],
  },
  {
    id: "molecules",
    categories: [
      { id: "field-composition", primitives: ["formfield", "searchfield", "inputgroup"] },
      { id: "selection-disclosure", primitives: ["select", "combobox", "autocomplete", "datepicker", "timepicker", "dropdown", "contextmenu"] },
      { id: "navigation-aids", primitives: ["tabs", "segmentedcontrol", "breadcrumb", "pagination"] },
      { id: "anchored-feedback", primitives: ["tooltip", "toggletip", "taggroup", "fileuploader"] },
    ],
  },
  {
    id: "components",
    categories: [
      { id: "navigation-components", primitives: ["header", "sidebar", "navigation", "pageheader"] },
      { id: "data-display", primitives: ["table", "datatable", "list", "tree", "card", "metric", "timeline"] },
      { id: "overlay-components", primitives: ["dialog", "modal", "drawer", "sheet", "popover", "menu"] },
      { id: "messaging-feedback", primitives: ["alert", "toast", "banner", "emptystate"] },
      { id: "complex-input", primitives: ["form", "filter", "fileuploader", "editor"] },
      { id: "product-components", primitives: [] },
    ],
  },
  {
    id: "patterns",
    categories: [
      { id: "page-layout-patterns", runtimeOnly: true },
      { id: "form-validation-patterns", runtimeOnly: true },
      { id: "search-filter-patterns", runtimeOnly: true },
      { id: "loading-empty-error-patterns", primitives: ["spinner", "skeleton", "emptystate", "alert"] },
      { id: "destructive-permission-patterns", runtimeOnly: true },
      { id: "responsive-composition-patterns", runtimeOnly: true },
    ],
  },
];

const DYNAMIC_LAYERS = [
  {
    id: "interaction-foundation",
    categories: [
      { id: "state-vocabulary", appliesTo: ["interactive-components"] },
      { id: "input-modalities", appliesTo: ["pointer", "touch", "keyboard"] },
      { id: "feedback-contract", appliesTo: ["visual", "text", "announcement"] },
      { id: "motion-rules", appliesTo: ["enter", "exit", "feedback", "continuity"] },
    ],
  },
  {
    id: "component-behavior",
    categories: [
      { id: "activation-selection", appliesTo: ["button", "link", "checkbox", "radio", "switch", "tabs"] },
      { id: "input-validation", appliesTo: ["input", "textarea", "select", "formfield", "form"] },
      { id: "focus-keyboard", appliesTo: ["interactive-components"] },
      { id: "disclosure-dismissal", appliesTo: ["dropdown", "popover", "tooltip", "dialog", "drawer", "sheet"] },
      { id: "async-feedback", appliesTo: ["button", "form", "toast", "progress", "skeleton"] },
    ],
  },
  {
    id: "cross-component-orchestration",
    categories: [
      { id: "portal-layering", appliesTo: ["dialog", "drawer", "sheet", "popover", "dropdown", "tooltip", "toast"] },
      { id: "focus-orchestration", appliesTo: ["dialog", "drawer", "sheet", "popover", "dropdown"] },
      { id: "scroll-management", appliesTo: ["dialog", "drawer", "sheet", "popover", "virtual-list"] },
      { id: "global-managers", appliesTo: ["modal-stack", "toast-queue", "tooltip-provider", "theme-provider"] },
      { id: "drag-gesture", appliesTo: ["drag-drop", "swipe", "long-press"] },
    ],
  },
  {
    id: "flow-lifecycle",
    categories: [
      { id: "loading-recovery", appliesTo: ["loading", "success", "error", "retry", "cancel"] },
      { id: "navigation-restoration", appliesTo: ["routing", "back-navigation", "focus-restore", "scroll-restore"] },
      { id: "persistence", appliesTo: ["draft", "session", "refresh", "route-state"] },
      { id: "responsive-adaptation", appliesTo: ["breakpoint", "viewport", "orientation", "safe-area"] },
      { id: "permission-session", appliesTo: ["permission", "authentication", "timeout", "network"] },
      { id: "runtime-accessibility", appliesTo: ["screen-reader", "reduced-motion", "announcements", "interruption"] },
    ],
  },
];

const COLOR_ROLE_PATTERNS = {
  brand: /(?:^|-)brand(?:-|$)/,
  primary: /(?:^|-)primary(?:-|$)/,
  secondary: /(?:^|-)secondary(?:-|$)/,
  tertiary: /(?:^|-)tertiary(?:-|$)/,
  semanticSurface: /(?:background|surface|foreground|text|icon|border|stroke|fill)/,
  feedback: /(?:success|warning|error|danger|critical|info)/,
  interaction: /(?:hover|active|pressed|focus|selected|disabled)/,
  dataVisualization: /(?:chart|data|series|categorical|sequential|diverging)/,
};

const THEME_SCOPE = /(?:\.dark\b|\.light\b|data-theme|data-brand|prefers-color-scheme|(?:^|[\/_.-])theme(?:[\/_.-]|$))/i;
const CLASS_SELECTOR = /(?:^|[\s,>+~])\.[_a-zA-Z][\w-]*/;
const COLOR_ROLE_ORDER = [
  "brand",
  "action-primary",
  "action-secondary",
  "action-tertiary",
  "background",
  "surface",
  "content",
  "border",
  "success",
  "warning",
  "error",
  "info",
  "interaction",
  "data-visualization",
  "other",
];
const REQUIRED_SEMANTIC_COLOR_ROLES = ["action-primary", "surface", "content", "border", "success", "warning", "error", "info"];
const COLOR_COMPONENT_NAME = /(?:^|-)(?:button|input|select|checkbox|radio|switch|card|dialog|modal|toast|badge|tooltip|menu)(?:-|$)/;
const COLOR_SCALE_NAME = /(?:^|-)(?:0|10|20|25|50|[1-9]\d{2}|1000)(?:-|$)/;
const FOUNDATION_WORKBENCH_CONFIGS = {
  typography: {
    roles: ["font-family", "display-heading", "body", "label-caption", "numeric-code", "metrics", "responsive", "other"],
    requiredRoles: ["font-family", "display-heading", "body", "label-caption", "metrics"],
  },
  "spacing-density": {
    roles: ["base-scale", "component-inset", "component-gap", "layout", "control-size", "density", "other"],
    requiredRoles: ["base-scale", "component-inset", "component-gap", "layout", "control-size"],
  },
  "shape-stroke": {
    roles: ["radius", "border-width", "border-style", "divider", "focus-ring", "other"],
    requiredRoles: ["radius", "border-width", "divider", "focus-ring"],
  },
  "depth-layer": {
    roles: ["shadow", "elevation", "scrim-opacity", "blur", "z-index", "other"],
    requiredRoles: ["shadow", "scrim-opacity", "z-index"],
  },
};

function countUnique(items, selector) {
  return new Set(items.map(selector).filter((value) => value != null && value !== "")).size;
}

function metric(id, value, detail = null) {
  return { id, value, ...(detail == null ? {} : { detail }) };
}

function aggregateStatus(statuses) {
  for (const status of ["fragmented", "missing", "partial", "unverified", "detected", "not-detected"]) {
    if (statuses.includes(status)) return status;
  }
  return "not-detected";
}

function tokenCategoryStatus(definitions, rawValues, findings, ownerCount) {
  if (!definitions.length && rawValues.length) return "missing";
  if (!definitions.length) return "not-detected";
  if (ownerCount > 1 || findings.some((item) => item.ruleId.includes("conflict") || item.ruleId.includes("ambiguous"))) return "fragmented";
  if (rawValues.length || findings.length) return "partial";
  return "detected";
}

function colorRole(normalizedName) {
  const name = normalizedName.toLowerCase();
  if (COLOR_ROLE_PATTERNS.dataVisualization.test(name)) return "data-visualization";
  if (/(?:^|-)(?:success|positive)(?:-|$)/.test(name)) return "success";
  if (/(?:^|-)(?:warning|caution)(?:-|$)/.test(name)) return "warning";
  if (/(?:^|-)(?:error|danger|critical|negative|destructive)(?:-|$)/.test(name)) return "error";
  if (/(?:^|-)info(?:-|$)/.test(name)) return "info";
  if (COLOR_ROLE_PATTERNS.interaction.test(name)) return "interaction";
  if (COLOR_ROLE_PATTERNS.secondary.test(name)) return "action-secondary";
  if (COLOR_ROLE_PATTERNS.tertiary.test(name)) return "action-tertiary";
  if (COLOR_ROLE_PATTERNS.primary.test(name)) return "action-primary";
  if (/(?:^|-)(?:background|canvas|page)(?:-|$)/.test(name)) return "background";
  if (/(?:^|-)(?:surface|panel|card)(?:-|$)/.test(name)) return "surface";
  if (/(?:^|-)(?:foreground|text|content|icon)(?:-|$)/.test(name)) return "content";
  if (/(?:^|-)(?:border|stroke|divider|outline)(?:-|$)/.test(name)) return "border";
  if (COLOR_ROLE_PATTERNS.brand.test(name) || /(?:^|-)accent(?:-|$)/.test(name)) return "brand";
  return "other";
}

function colorTokenLayer(definition) {
  if (COLOR_COMPONENT_NAME.test(definition.normalizedName)) return "component";
  if (COLOR_SCALE_NAME.test(definition.normalizedName)) return "primitive";
  return colorRole(definition.normalizedName) === "other" ? "unclassified" : "semantic";
}

function ownerScope(definitions, file) {
  if (/(?:^|\/)(?:legacy|deprecated|old)(?:\/|$)/i.test(file)) return "legacy";
  if (definitions.some((item) => item.selector === ":root")) return "global-candidate";
  if (definitions.some((item) => THEME_SCOPE.test(item.selector) || THEME_SCOPE.test(item.file))) return "theme-or-scope";
  return "unclear";
}

function candidateScore(lane) {
  const roles = new Set(lane.tokens.map((item) => item.roleFamily).filter((item) => item !== "other")).size;
  const global = lane.scope === "global-candidate" ? 3 : 0;
  const conventional = /(?:^|\/)(?:styles?|design-system|tokens?)(?:\/|\.)/i.test(lane.file) ? 2 : 0;
  const legacy = /(?:^|\/)(?:legacy|deprecated|old)(?:\/|$)/i.test(lane.file) ? 8 : 0;
  return lane.tokens.length + roles * 2 + lane.referenceCount * 3 + global + conventional - legacy;
}

function selectCandidate(systems) {
  const globalCandidates = systems.filter((item) => item.scope === "global-candidate");
  const unscopedCandidates = systems.filter((item) => !["theme-or-scope", "legacy"].includes(item.scope));
  const eligible = globalCandidates.length ? globalCandidates : unscopedCandidates.length ? unscopedCandidates : systems;
  const ranked = [...eligible].sort((left, right) => candidateScore(right) - candidateScore(left) || left.file.localeCompare(right.file));
  return { candidate: ranked[0] ?? null, runnerUp: ranked[1] ?? null };
}

function foundationRole(categoryId, name, value = "") {
  const haystack = `${name} ${value}`.toLowerCase();
  if (categoryId === "typography") {
    if (/(?:font-family|font-ui|font-sans|font-serif|font-mono|typeface)/.test(haystack)) return "font-family";
    if (/(?:display|headline|heading|title|hero|h[1-6])/.test(haystack)) return "display-heading";
    if (/(?:caption|label|overline|eyebrow|helper|hint|small)/.test(haystack)) return "label-caption";
    if (/(?:mono|code|numeric|number|tabular)/.test(haystack)) return "numeric-code";
    if (/(?:line-height|letter|tracking|weight|leading|font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black))/.test(haystack)) return "metrics";
    if (/(?:responsive|fluid|clamp|viewport)/.test(haystack)) return "responsive";
    if (/(?:body|paragraph|copy|text|font-size)/.test(haystack)) return "body";
  }
  if (categoryId === "spacing-density") {
    if (/(?:density|compact|comfortable|cozy)/.test(haystack)) return "density";
    if (/(?:control|button|input|field|touch|hit-area|min-height)/.test(haystack)) return "control-size";
    if (/(?:layout|section|page|container|gutter|column|grid)/.test(haystack)) return "layout";
    if (/(?:gap|space-between|stack|inline|(?:^|[ :])(?:gap|space-[xy])[-[])/.test(haystack)) return "component-gap";
    if (/(?:padding|inset|component|card|panel|(?:^|[ :])p[trblxy]?[-[])/.test(haystack)) return "component-inset";
    if (/(?:space|spacing|size|width|height|margin)/.test(haystack)) return "base-scale";
  }
  if (categoryId === "shape-stroke") {
    if (/(?:focus|ring|outline)/.test(haystack)) return "focus-ring";
    if (/(?:divider|separator)/.test(haystack)) return "divider";
    if (/(?:border-style|solid|dashed|dotted|double)/.test(haystack)) return "border-style";
    if (/(?:border-width|stroke-width|hairline|(?:^|[ :])border(?:-[trblxy])?(?:-(?:0|2|4|8))?(?:$|\s))/.test(haystack)) return "border-width";
    if (/(?:radius|rounded|corner)/.test(haystack)) return "radius";
  }
  if (categoryId === "depth-layer") {
    if (/(?:z-index|zindex|layer|stack|(?:^|[ :])-?z-(?:\[?\d|auto)|(?:^|\s)z\s)/.test(haystack)) return "z-index";
    if (/(?:blur|backdrop|filter)/.test(haystack)) return "blur";
    if (/(?:opacity|scrim|backdrop|mask)/.test(haystack)) return "scrim-opacity";
    if (/(?:elevation|raised|lifted)/.test(haystack)) return "elevation";
    if (/(?:shadow)/.test(haystack)) return "shadow";
  }
  return "other";
}

function rawParts(raw) {
  const match = raw.value.match(/^\s*([\w-]+)\s*:\s*(.+?)\s*;?$/);
  if (match) return { property: match[1], literal: match[2] };
  const arbitrary = raw.value.match(/([\w-]+)-\[([^\]]+)\]/);
  return arbitrary ? { property: arbitrary[1], literal: arbitrary[2] } : { property: raw.kind, literal: raw.value };
}

function numericCssValue(value) {
  const match = String(value).match(/-?\d*\.?\d+/);
  return match ? Number(match[0]) : Number.POSITIVE_INFINITY;
}

function buildFoundationWorkbench(category, definitions, canonical, rawValues, references, classification) {
  const config = FOUNDATION_WORKBENCH_CONFIGS[category.id];
  if (!config) return null;
  const referenceCounts = new Map();
  for (const reference of references) referenceCounts.set(reference.normalizedName, (referenceCounts.get(reference.normalizedName) ?? 0) + 1);
  const ownerIndex = new Map(classification.tokenOwners.map((item) => [item.id, item]));
  const definitionsByOwner = new Map();
  for (const definition of canonical) {
    if (!definitionsByOwner.has(definition.ownerId)) definitionsByOwner.set(definition.ownerId, []);
    definitionsByOwner.get(definition.ownerId).push(definition);
  }
  const systems = [...definitionsByOwner.entries()].map(([ownerId, ownerDefinitions]) => {
    const file = ownerIndex.get(ownerId)?.file ?? ownerDefinitions[0]?.file ?? "unknown";
    const tokens = ownerDefinitions.map((item) => ({
      id: item.id,
      name: item.name,
      normalizedName: item.normalizedName,
      value: item.value,
      normalizedValue: item.normalizedValue,
      selector: item.selector,
      roleFamily: foundationRole(category.id, item.normalizedName, item.normalizedValue),
      referenceCount: referenceCounts.get(item.normalizedName) ?? 0,
    })).sort((left, right) => config.roles.indexOf(left.roleFamily) - config.roles.indexOf(right.roleFamily) || numericCssValue(left.value) - numericCssValue(right.value) || left.name.localeCompare(right.name));
    return {
      ownerId,
      file,
      scope: ownerScope(ownerDefinitions, file),
      sourceTypes: [...new Set(ownerDefinitions.map((item) => item.sourceType))].sort(),
      definitionCount: ownerDefinitions.length,
      uniqueValueCount: countUnique(ownerDefinitions, (item) => item.normalizedValue),
      referenceCount: ownerDefinitions.reduce((total, item) => total + (referenceCounts.get(item.normalizedName) ?? 0), 0),
      tokens,
    };
  });
  const { candidate, runnerUp } = selectCandidate(systems);
  systems.sort((left, right) => (left === candidate ? -1 : right === candidate ? 1 : candidateScore(right) - candidateScore(left)) || left.file.localeCompare(right.file));
  for (const lane of systems) {
    if (lane === candidate) lane.recommendation = "keep-candidate";
    else if (/(?:^|\/)(?:legacy|deprecated|old)(?:\/|$)/i.test(lane.file)) lane.recommendation = "merge-deprecate";
    else if (lane.scope === "theme-or-scope") lane.recommendation = "preserve-scope";
    else lane.recommendation = "compare-or-merge";
  }

  const presentRoles = new Set(canonical.map((item) => foundationRole(category.id, item.normalizedName, item.normalizedValue)));
  const coveredRoles = config.requiredRoles.filter((role) => presentRoles.has(role));
  const rawGroups = new Map();
  for (const raw of rawValues) {
    const parts = rawParts(raw);
    const key = `${parts.property}:${parts.literal}`.toLowerCase().replace(/\s+/g, "");
    if (!rawGroups.has(key)) rawGroups.set(key, { property: parts.property, value: parts.literal, roleFamily: foundationRole(category.id, parts.property, parts.literal), kinds: new Set(), occurrences: [], files: new Set() });
    const group = rawGroups.get(key);
    group.kinds.add(raw.kind);
    group.occurrences.push({ file: raw.file, line: raw.line, selector: raw.selector ?? null, evidence: raw.evidence });
    group.files.add(raw.file);
  }
  const rankedUsageGroups = [...rawGroups.values()].map((group) => {
    const normalized = group.value.toLowerCase().replace(/\s+/g, "");
    const matches = canonical.filter((item) => item.normalizedValue.toLowerCase().replace(/\s+/g, "") === normalized);
    const candidateMatches = matches.filter((item) => item.ownerId === candidate?.ownerId);
    return {
      property: group.property,
      value: group.value,
      roleFamily: group.roleFamily,
      usageType: [...group.kinds].every((kind) => kind.startsWith("tailwind-")) ? "utility" : "direct-value",
      occurrenceCount: group.occurrences.length,
      fileCount: group.files.size,
      occurrences: group.occurrences.slice(0, 5),
      suggestedToken: candidateMatches[0]?.name ?? (matches.length === 1 ? matches[0].name : null),
      mappingStatus: candidateMatches.length ? "candidate-match" : matches.length === 1 ? "single-match" : matches.length > 1 ? "ambiguous-match" : "unmapped",
    };
  }).sort((left, right) => right.occurrenceCount - left.occurrenceCount || left.value.localeCompare(right.value));
  const usageGroups = [
    ...rankedUsageGroups.filter((item) => item.usageType === "direct-value").slice(0, 16),
    ...rankedUsageGroups.filter((item) => item.usageType === "utility").slice(0, 16),
  ];

  const directValues = rawValues.filter((item) => !item.kind.startsWith("tailwind-"));
  const utilityUsages = rawValues.filter((item) => item.kind.startsWith("tailwind-"));

  const roleRows = config.roles.map((role) => ({
    role,
    systems: systems.map((system) => ({ ownerId: system.ownerId, tokens: system.tokens.filter((item) => item.roleFamily === role) })),
    targetTokens: candidate?.tokens.filter((item) => item.roleFamily === role) ?? [],
  }));
  const candidateRoles = new Set(candidate?.tokens.map((item) => item.roleFamily) ?? []);
  return {
    kind: category.id,
    architecture: {
      systemCount: systems.length,
      definitionCount: canonical.length,
      uniqueValueCount: countUnique(canonical, (item) => item.normalizedValue),
      roleCoverage: coveredRoles.length,
      roleTotal: config.requiredRoles.length,
      bypassCount: directValues.length,
      utilityUsageCount: utilityUsages.length,
      observedUsageCount: rawValues.length,
      candidateOwnerId: candidate?.ownerId ?? null,
      candidateFile: candidate?.file ?? null,
      candidateStrength: !candidate ? "unverified" : !runnerUp || candidateScore(candidate) - candidateScore(runnerUp) >= 4 ? "strong-source-candidate" : "needs-owner-decision",
      contractStatus: systems.length > 1 ? "fragmented" : coveredRoles.length === config.requiredRoles.length ? "detected" : canonical.length ? "partial" : "missing",
      runtimeStatus: "unverified",
    },
    systems,
    roleRows,
    usageGroups,
    bypasses: usageGroups.filter((item) => item.usageType === "direct-value"),
    systemActions: systems.map((system) => ({ ownerId: system.ownerId, file: system.file, action: system.recommendation, targetFile: system === candidate ? system.file : candidate?.file ?? null })),
    target: {
      ownerId: candidate?.ownerId ?? null,
      ownerFile: candidate?.file ?? null,
      tokens: candidate?.tokens ?? [],
      missingRoles: config.requiredRoles.filter((role) => !candidateRoles.has(role)),
    },
  };
}

function buildIconWorkbench(scan) {
  const sourceGroups = new Map();
  const sourceKey = (asset) => asset.type === "icon-library" ? `library:${asset.source}` : asset.type === "local-svg" ? `local:${asset.file.split("/").slice(0, -1).join("/") || "."}` : asset.type === "svg-import" ? `import:${asset.source}` : asset.type;
  for (const asset of scan.iconAssets ?? []) {
    const key = sourceKey(asset);
    if (!sourceGroups.has(key)) sourceGroups.set(key, { key, type: asset.type, source: asset.type === "icon-library" ? asset.source : key.replace(/^[^:]+:/, ""), assets: [], files: new Set(), names: new Set(), count: 0 });
    const group = sourceGroups.get(key);
    group.assets.push(asset);
    group.files.add(asset.file);
    for (const name of asset.names ?? []) group.names.add(name);
    group.count += asset.count ?? 1;
  }
  const sources = [...sourceGroups.values()].map((group) => ({
    key: group.key,
    type: group.type,
    source: group.source,
    count: group.count,
    fileCount: group.files.size,
    files: [...group.files].sort().slice(0, 12),
    names: [...group.names].sort().slice(0, 40),
    grids: [...new Set(group.assets.map((item) => item.viewBox || (item.width && item.height ? `${item.width} × ${item.height}` : null)).filter((value) => value && !/[${}]/.test(value) && value !== "0 × 0"))].sort(),
    strokeWidths: [...new Set(group.assets.map((item) => item.strokeWidth).filter(Boolean))].sort(),
    fills: [...new Set(group.assets.map((item) => item.fill).filter(Boolean))].sort(),
  }));
  const iconSourceScore = (source) => {
    const internalLibrary = source.type === "local-svg" && /(?:^|\/)(?:packages|components|ui)\/[^/]*(?:icon|asset)|(?:^|\/)icons?(?:\/|$)/i.test(source.source);
    const base = internalLibrary ? 300 : source.type === "icon-library" ? 240 : source.type === "local-svg" ? 100 : source.type === "svg-import" ? 60 : 0;
    return base + source.count;
  };
  sources.sort((left, right) => iconSourceScore(right) - iconSourceScore(left) || left.key.localeCompare(right.key));
  const candidates = scan.componentCandidates.filter((item) => ["icon", "image", "avatar"].includes(item.primitive));
  const primary = sources[0] ?? null;
  const grids = [...new Set(sources.flatMap((item) => item.grids))].sort();
  const strokeWidths = [...new Set(sources.flatMap((item) => item.strokeWidths))].sort();
  const fills = [...new Set(sources.flatMap((item) => item.fills))].sort();
  return {
    architecture: {
      sourceCount: sources.length,
      assetCount: sources.reduce((total, item) => total + item.count, 0),
      libraryCount: sources.filter((item) => item.type === "icon-library").length,
      localSvgCount: (scan.iconAssets ?? []).filter((item) => item.type === "local-svg" || item.type === "svg-import").length,
      inlineSvgCount: (scan.iconAssets ?? []).filter((item) => item.type === "inline-svg").length,
      componentCount: candidates.length,
      gridCount: grids.length,
      strokeWidthCount: strokeWidths.length,
      contractStatus: !sources.length && !candidates.length ? "missing" : sources.length > 1 || grids.length > 1 || strokeWidths.length > 1 ? "fragmented" : "partial",
      primarySource: primary?.key ?? null,
      runtimeStatus: "unverified",
    },
    sources: sources.map((source) => ({ ...source, recommendation: source === primary ? "keep-candidate" : source.type === "local-svg" ? "preserve-assets" : "compare-or-merge" })),
    grids,
    strokeWidths,
    fills,
    componentCandidates: candidates,
    target: {
      primarySource: primary?.key ?? null,
      source: primary?.source ?? null,
      grid: grids.length === 1 ? grids[0] : null,
      strokeWidth: strokeWidths.length === 1 ? strokeWidths[0] : null,
      missingContracts: [!sources.length ? "primary-source" : null, grids.length !== 1 ? "size-grid" : null, strokeWidths.length !== 1 ? "stroke-fill" : null].filter(Boolean),
    },
  };
}

function buildColorWorkbench(definitions, canonical, rawValues, references, classification, relatedRelationships) {
  const referenceCounts = new Map();
  for (const reference of references) referenceCounts.set(reference.normalizedName, (referenceCounts.get(reference.normalizedName) ?? 0) + 1);

  const definitionsByOwner = new Map();
  for (const definition of canonical) {
    if (!definitionsByOwner.has(definition.ownerId)) definitionsByOwner.set(definition.ownerId, []);
    definitionsByOwner.get(definition.ownerId).push(definition);
  }
  const ownerIndex = new Map(classification.tokenOwners.map((item) => [item.id, item]));
  const systems = [...definitionsByOwner.entries()].map(([ownerId, ownerDefinitions]) => {
    const file = ownerIndex.get(ownerId)?.file ?? ownerDefinitions[0]?.file ?? "unknown";
    const tokens = ownerDefinitions
      .map((item) => ({
        id: item.id,
        name: item.name,
        normalizedName: item.normalizedName,
        value: item.value,
        normalizedValue: item.normalizedValue,
        selector: item.selector,
        roleFamily: colorRole(item.normalizedName),
        tokenLayer: colorTokenLayer(item),
        referenceCount: referenceCounts.get(item.normalizedName) ?? 0,
      }))
      .sort((left, right) => COLOR_ROLE_ORDER.indexOf(left.roleFamily) - COLOR_ROLE_ORDER.indexOf(right.roleFamily) || left.name.localeCompare(right.name));
    return {
      ownerId,
      file,
      scope: ownerScope(ownerDefinitions, file),
      sourceTypes: [...new Set(ownerDefinitions.map((item) => item.sourceType))].sort(),
      definitionCount: ownerDefinitions.length,
      uniqueValueCount: countUnique(ownerDefinitions, (item) => item.normalizedValue),
      referenceCount: ownerDefinitions.reduce((total, item) => total + (referenceCounts.get(item.normalizedName) ?? 0), 0),
      tokens,
    };
  });
  const { candidate, runnerUp } = selectCandidate(systems);
  systems.sort((left, right) => (left === candidate ? -1 : right === candidate ? 1 : candidateScore(right) - candidateScore(left)) || left.file.localeCompare(right.file));
  for (const lane of systems) {
    if (lane === candidate) lane.recommendation = "keep-candidate";
    else if (/(?:^|\/)(?:legacy|deprecated|old)(?:\/|$)/i.test(lane.file)) lane.recommendation = "merge-deprecate";
    else if (lane.scope === "theme-or-scope") lane.recommendation = "preserve-scope";
    else lane.recommendation = "compare-or-merge";
  }

  const primitiveDefinitions = canonical.filter((item) => colorTokenLayer(item) === "primitive");
  const semanticDefinitions = canonical.filter((item) => colorTokenLayer(item) === "semantic");
  const componentDefinitions = canonical.filter((item) => colorTokenLayer(item) === "component");
  const presentSemanticRoles = new Set(semanticDefinitions.map((item) => colorRole(item.normalizedName)));
  const semanticCoverage = REQUIRED_SEMANTIC_COLOR_ROLES.filter((role) => presentSemanticRoles.has(role));
  const architecture = {
    paletteStatus: primitiveDefinitions.length >= 3 ? "detected" : canonical.length ? "partial" : "missing",
    paletteTokenCount: primitiveDefinitions.length,
    semanticStatus: semanticCoverage.length === REQUIRED_SEMANTIC_COLOR_ROLES.length ? "detected" : semanticDefinitions.length ? "partial" : "missing",
    semanticTokenCount: semanticDefinitions.length,
    semanticRoleCoverage: semanticCoverage.length,
    semanticRoleTotal: REQUIRED_SEMANTIC_COLOR_ROLES.length,
    componentStatus: componentDefinitions.length ? "detected" : "not-detected",
    componentTokenCount: componentDefinitions.length,
    contractStatus: systems.length > 1 ? "fragmented" : semanticCoverage.length === REQUIRED_SEMANTIC_COLOR_ROLES.length ? "detected" : canonical.length ? "partial" : "missing",
    systemCount: systems.length,
    candidateOwnerId: candidate?.ownerId ?? null,
    candidateFile: candidate?.file ?? null,
    candidateStrength: !candidate ? "unverified" : !runnerUp || candidateScore(candidate) - candidateScore(runnerUp) >= 4 ? "strong-source-candidate" : "needs-owner-decision",
    runtimeStatus: "unverified",
  };

  const implementationApproaches = [...new Set(definitions.map((item) => item.sourceType))].sort().map((sourceType) => {
    const approachDefinitions = definitions.filter((item) => item.sourceType === sourceType);
    return {
      sourceType,
      canonicalCount: approachDefinitions.filter((item) => item.role === "canonical").length,
      adapterCount: approachDefinitions.filter((item) => item.role === "adapter").length,
      files: [...new Set(approachDefinitions.map((item) => item.file))].sort(),
    };
  });

  const roleRows = COLOR_ROLE_ORDER.map((role) => ({
    role,
    systems: systems.map((system) => ({
      ownerId: system.ownerId,
      tokens: system.tokens.filter((item) => item.roleFamily === role),
    })),
    targetTokens: candidate?.tokens.filter((item) => item.roleFamily === role) ?? [],
  }));

  const hardcodedGroups = new Map();
  for (const raw of rawValues) {
    const key = raw.value.toLowerCase().replace(/\s+/g, "");
    if (!hardcodedGroups.has(key)) hardcodedGroups.set(key, { value: raw.value, occurrences: [], files: new Set() });
    const group = hardcodedGroups.get(key);
    group.occurrences.push({ file: raw.file, line: raw.line, selector: raw.selector ?? null, evidence: raw.evidence });
    group.files.add(raw.file);
  }
  const hardcodes = [...hardcodedGroups.values()].map((group) => {
    const normalized = group.value.toLowerCase().replace(/\s+/g, "");
    const matches = canonical.filter((item) => item.normalizedValue.toLowerCase().replace(/\s+/g, "") === normalized);
    const candidateMatches = matches.filter((item) => item.ownerId === candidate?.ownerId);
    return {
      value: group.value,
      occurrenceCount: group.occurrences.length,
      fileCount: group.files.size,
      occurrences: group.occurrences.slice(0, 5),
      matchedTokens: matches.map((item) => ({ name: item.name, ownerId: item.ownerId, file: item.file })),
      suggestedToken: candidateMatches[0]?.name ?? (matches.length === 1 ? matches[0].name : null),
      mappingStatus: candidateMatches.length ? "candidate-match" : matches.length === 1 ? "single-match" : matches.length > 1 ? "ambiguous-match" : "unmapped",
    };
  }).sort((left, right) => right.occurrenceCount - left.occurrenceCount || left.value.localeCompare(right.value)).slice(0, 16);

  const sameNameGroups = new Map();
  for (const definition of canonical) {
    if (!sameNameGroups.has(definition.normalizedName)) sameNameGroups.set(definition.normalizedName, []);
    sameNameGroups.get(definition.normalizedName).push(definition);
  }
  const tokenDecisions = [...sameNameGroups.entries()].flatMap(([normalizedName, group]) => {
    const ownerIds = new Set(group.map((item) => item.ownerId));
    if (ownerIds.size < 2) return [];
    const values = [...new Set(group.map((item) => item.normalizedValue))];
    const target = group.find((item) => item.ownerId === candidate?.ownerId) ?? null;
    return [{
      normalizedName,
      values,
      sources: group.map((item) => ({ name: item.name, value: item.value, file: item.file, ownerId: item.ownerId, selector: item.selector })),
      targetToken: target?.name ?? null,
      action: values.length === 1 ? "merge-alias" : target ? "map-to-candidate" : "choose-owner",
    }];
  }).sort((left, right) => left.normalizedName.localeCompare(right.normalizedName));

  const adapters = definitions.filter((item) => item.role === "adapter").map((item) => ({
    name: item.name,
    value: item.value,
    file: item.file,
    targetName: item.value.match(/var\(\s*(--[\w-]+)/)?.[1] ?? null,
  }));
  const systemActions = systems.map((system) => ({
    ownerId: system.ownerId,
    file: system.file,
    action: system.recommendation,
    targetFile: system === candidate ? system.file : candidate?.file ?? null,
  }));

  const candidateRoles = new Set(candidate?.tokens.map((item) => item.roleFamily) ?? []);
  const target = {
    ownerId: candidate?.ownerId ?? null,
    ownerFile: candidate?.file ?? null,
    palette: candidate?.tokens.filter((item) => item.tokenLayer === "primitive") ?? [],
    semanticTokens: candidate?.tokens.filter((item) => item.tokenLayer === "semantic") ?? [],
    componentTokens: candidate?.tokens.filter((item) => item.tokenLayer === "component") ?? [],
    missingRoles: REQUIRED_SEMANTIC_COLOR_ROLES.filter((role) => !candidateRoles.has(role)),
    preview: {
      primary: candidate?.tokens.find((item) => item.roleFamily === "action-primary")?.value ?? null,
      surface: candidate?.tokens.find((item) => item.roleFamily === "surface" || item.roleFamily === "background")?.value ?? null,
      content: candidate?.tokens.find((item) => item.roleFamily === "content")?.value ?? null,
      border: candidate?.tokens.find((item) => item.roleFamily === "border")?.value ?? null,
    },
  };

  return {
    architecture,
    implementationApproaches,
    systems,
    roleRows,
    hardcodes,
    tokenDecisions,
    adapters,
    systemActions,
    target,
    relationshipCounts: {
      adapters: relatedRelationships.filter((item) => item.type === "adapter").length,
      scopeOverrides: relatedRelationships.filter((item) => item.type === "scope-override").length,
      valueCollisions: relatedRelationships.filter((item) => item.type === "value-collision").length,
      conflicts: relatedRelationships.filter((item) => ["semantic-conflict", "owner-conflict"].includes(item.type)).length,
    },
  };
}

function componentCategory(category, scan) {
  const primitives = category.primitives ?? [];
  const candidates = scan.componentCandidates.filter((item) => primitives.includes(item.primitive));
  const owners = candidates.filter((item) => item.role === "owner");
  const adapters = candidates.filter((item) => item.role === "adapter");
  const implementationCount = countUnique(candidates, (item) => item.file);
  let status = "not-detected";
  if (category.runtimeOnly) status = "unverified";
  else if (owners.length > countUnique(owners, (item) => item.primitive)) status = "fragmented";
  else if (owners.length) status = "detected";
  else if (adapters.length) status = "partial";
  return {
    id: category.id,
    status,
    items: primitives,
    metrics: [
      metric("implementations", implementationCount),
      metric("owner-implementations", owners.length),
      metric("adapters", adapters.length),
      metric("covered-items", countUnique(candidates, (item) => item.primitive), primitives.length || null),
    ],
    sourceRefs: candidates.slice(0, 12).map((item) => ({ file: item.file, role: item.role, primitive: item.primitive })),
  };
}

function definitionsForCategory(category, scan) {
  if (category.id === "token-architecture") return scan.tokenDefinitions;
  if (category.id === "grid-responsive") {
    return scan.tokenDefinitions.filter((item) => /(?:breakpoint|container|grid|column|gutter|viewport)/.test(item.normalizedName));
  }
  return scan.tokenDefinitions.filter((item) => category.tokenKinds?.includes(item.kind));
}

function rawValuesForCategory(category, scan) {
  if (category.id === "color") return scan.rawValues.filter((item) => item.kind === "color");
  if (category.id === "typography") return scan.rawValues.filter((item) => item.kind === "typography" || item.kind === "tailwind-typography" || (item.kind === "length" && /font-size|line-height|letter-spacing/i.test(item.evidence)));
  if (category.id === "spacing-density") return scan.rawValues.filter((item) => item.kind === "tailwind-spacing" || (item.kind === "length" && !/font-size|line-height|letter-spacing|border-radius/i.test(item.evidence)));
  if (category.id === "grid-responsive") return scan.rawValues.filter((item) => item.kind === "arbitrary-tailwind" && /grid|w-|h-|inset|gap/.test(item.value));
  if (category.id === "shape-stroke") return scan.rawValues.filter((item) => item.kind === "stroke" || item.kind === "tailwind-shape" || (item.kind === "length" && /border-radius/i.test(item.evidence)) || (item.kind === "arbitrary-tailwind" && /rounded|border|ring|outline/.test(item.value)));
  if (category.id === "depth-layer") return scan.rawValues.filter((item) => ["z-index", "shadow", "depth-effect", "tailwind-depth"].includes(item.kind) || (item.kind === "arbitrary-tailwind" && /shadow|opacity|z-/.test(item.value)));
  if (category.id === "motion-parameters") return scan.rawValues.filter((item) => item.kind === "motion" || (item.kind === "arbitrary-tailwind" && /duration|delay/.test(item.value)));
  return [];
}

function findingsForCategory(category, findings) {
  if (category.id === "token-architecture") return findings.filter((item) => /(?:semantic-conflict|duplicate-definition|owner-ambiguous|undefined-reference)/.test(item.ruleId));
  if (category.id === "color") return findings.filter((item) => /(?:raw-color|semantic-conflict|duplicate-definition|owner-ambiguous|undefined-reference)/.test(item.ruleId));
  if (category.id === "typography") return findings.filter((item) => item.ruleId === "token.raw-typography" || (item.ruleId === "token.undefined-reference" && /font|type|text|line|letter/i.test(item.evidence)));
  if (category.id === "spacing-density") return findings.filter((item) => (item.ruleId === "token.raw-length" && !/font-size|line-height|letter-spacing|border-radius/i.test(item.evidence)) || (item.ruleId === "token.semantic-layer-bypass" && /(?:gap|space|padding|margin|inset|size|width|height)/i.test(item.evidence)));
  if (category.id === "grid-responsive") return findings.filter((item) => item.ruleId === "token.semantic-layer-bypass" && /(?:grid|breakpoint|container|column|gutter|viewport)/i.test(item.evidence));
  if (category.id === "shape-stroke") return findings.filter((item) => item.ruleId === "token.raw-stroke" || (item.ruleId === "token.raw-length" && /border-radius/i.test(item.evidence)) || (item.ruleId === "token.semantic-layer-bypass" && /(?:radius|rounded|border|ring|outline|divider)/i.test(item.evidence)));
  if (category.id === "depth-layer") return findings.filter((item) => ["overlay.raw-z-index", "token.raw-shadow", "token.raw-depth-effect"].includes(item.ruleId) || (item.ruleId === "token.semantic-layer-bypass" && /(?:shadow|opacity|z-|blur)/i.test(item.evidence)));
  if (category.id === "motion-parameters") return findings.filter((item) => item.ruleId === "token.raw-motion" || (item.ruleId === "token.semantic-layer-bypass" && /(?:duration|delay|transition|animation)/i.test(item.evidence)));
  return [];
}

function colorSubcategories(definitions) {
  const count = (pattern) => definitions.filter((item) => pattern.test(item.normalizedName)).length;
  const literalPalette = definitions.filter((item) => !item.normalizedValue.startsWith("var(") && /(?:#|rgb|hsl|oklch|color\()/.test(item.normalizedValue)).length;
  return [
    { id: "primitive-palette", status: literalPalette ? "detected" : "not-detected", count: literalPalette },
    { id: "brand-action", status: count(COLOR_ROLE_PATTERNS.brand) + count(COLOR_ROLE_PATTERNS.primary) + count(COLOR_ROLE_PATTERNS.secondary) + count(COLOR_ROLE_PATTERNS.tertiary) ? "detected" : "not-detected", count: count(COLOR_ROLE_PATTERNS.brand) + count(COLOR_ROLE_PATTERNS.primary) + count(COLOR_ROLE_PATTERNS.secondary) + count(COLOR_ROLE_PATTERNS.tertiary) },
    { id: "semantic-surface", status: count(COLOR_ROLE_PATTERNS.semanticSurface) ? "detected" : "not-detected", count: count(COLOR_ROLE_PATTERNS.semanticSurface) },
    { id: "feedback-color", status: count(COLOR_ROLE_PATTERNS.feedback) ? "detected" : "not-detected", count: count(COLOR_ROLE_PATTERNS.feedback) },
    { id: "interaction-color", status: count(COLOR_ROLE_PATTERNS.interaction) ? "detected" : "not-detected", count: count(COLOR_ROLE_PATTERNS.interaction) },
    { id: "theme-scope", status: definitions.some((item) => THEME_SCOPE.test(item.selector) || THEME_SCOPE.test(item.file)) ? "detected" : "not-detected", count: definitions.filter((item) => THEME_SCOPE.test(item.selector) || THEME_SCOPE.test(item.file)).length },
    { id: "data-visualization", status: count(COLOR_ROLE_PATTERNS.dataVisualization) ? "detected" : "not-detected", count: count(COLOR_ROLE_PATTERNS.dataVisualization) },
  ];
}

function colorCategory(category, scan, classification, findings) {
  const definitions = definitionsForCategory(category, scan);
  const canonical = definitions.filter((item) => item.role === "canonical");
  const rawValues = rawValuesForCategory(category, scan);
  const colorNames = new Set(definitions.map((item) => item.normalizedName));
  const references = scan.tokenReferences.filter((item) => colorNames.has(item.normalizedName));
  const classSelectors = new Set([
    ...rawValues.map((item) => item.selector),
    ...references.map((item) => item.selector),
  ].filter((selector) => selector && CLASS_SELECTOR.test(selector)));
  const relatedRelationships = classification.relationships.filter((relation) => relation.definitionIds.some((id) => definitions.some((item) => item.id === id)));
  const categoryFindings = findingsForCategory(category, findings);
  const ownerCount = countUnique(canonical, (item) => item.ownerId);
  const roleCount = (pattern) => canonical.filter((item) => pattern.test(item.normalizedName)).length;
  const specimens = canonical
    .filter((item) => !item.normalizedValue.startsWith("var(") && /^(?:#[0-9a-f]{3,8}|(?:rgb|rgba|hsl|hsla|oklch|oklab|color)\()/i.test(item.value))
    .slice(0, 12)
    .map((item) => ({ label: item.name, value: item.value, file: item.file }));
  return {
    id: category.id,
    status: tokenCategoryStatus(canonical, rawValues, categoryFindings, ownerCount),
    subcategories: colorSubcategories(canonical),
    metrics: [
      metric("definition-files", countUnique(canonical, (item) => item.file)),
      metric("definitions", canonical.length),
      metric("unique-values", countUnique(canonical, (item) => item.normalizedValue)),
      metric("references", references.length),
      metric("brand-roles", roleCount(COLOR_ROLE_PATTERNS.brand)),
      metric("primary-roles", roleCount(COLOR_ROLE_PATTERNS.primary)),
      metric("observed-primary-uses", "unverified"),
      metric("secondary-roles", roleCount(COLOR_ROLE_PATTERNS.secondary)),
      metric("tertiary-roles", roleCount(COLOR_ROLE_PATTERNS.tertiary)),
      metric("hardcoded-occurrences", rawValues.length),
      metric("hardcoded-files", countUnique(rawValues, (item) => item.file)),
      metric("class-selectors", classSelectors.size),
      metric("value-collision-groups", relatedRelationships.filter((item) => item.type === "value-collision").length),
      metric("semantic-conflict-groups", relatedRelationships.filter((item) => ["semantic-conflict", "owner-conflict"].includes(item.type)).length),
      metric("theme-scope-definitions", canonical.filter((item) => THEME_SCOPE.test(item.selector) || THEME_SCOPE.test(item.file)).length),
    ],
    specimens,
    colorWorkbench: buildColorWorkbench(definitions, canonical, rawValues, references, classification, relatedRelationships),
    sourceRefs: canonical.slice(0, 12).map((item) => ({ file: item.file, line: item.line, name: item.name, value: item.value })),
  };
}

function foundationCategory(category, scan, classification, findings) {
  if (category.id === "color") return colorCategory(category, scan, classification, findings);
  if (category.id === "accessibility-baseline") {
    return { id: category.id, status: "unverified", subcategories: category.subcategories.map((id) => ({ id, status: "unverified", count: 0 })), metrics: [metric("runtime-checks", 0)] };
  }
  const definitions = definitionsForCategory(category, scan);
  const canonical = definitions.filter((item) => item.role === "canonical");
  const rawValues = rawValuesForCategory(category, scan);
  const categoryFindings = findingsForCategory(category, findings);
  const candidates = scan.componentCandidates.filter((item) => category.primitives?.includes(item.primitive));
  const definitionNames = new Set(definitions.map((item) => item.normalizedName));
  const references = scan.tokenReferences.filter((item) => definitionNames.has(item.normalizedName));
  const foundationWorkbench = buildFoundationWorkbench(category, definitions, canonical, rawValues, references, classification);
  const iconWorkbench = category.id === "icon-assets" ? buildIconWorkbench(scan) : null;
  const status = category.id === "icon-assets"
    ? iconWorkbench.architecture.contractStatus
    : tokenCategoryStatus(canonical, rawValues, categoryFindings, countUnique(canonical, (item) => item.ownerId));
  const roleCounts = new Map();
  if (foundationWorkbench) {
    for (const row of foundationWorkbench.roleRows) roleCounts.set(row.role, row.systems.reduce((total, system) => total + system.tokens.length, 0));
  }
  return {
    id: category.id,
    status,
    subcategories: category.subcategories.map((id) => {
      const role = id === "type-roles" ? "body" : id === "type-scale" ? "display-heading" : id === "type-metrics" ? "metrics" : id === "spacing-scale" ? "base-scale" : id === "component-spacing" ? "component-inset" : id === "layout-spacing" ? "layout" : id === "control-sizing" ? "control-size" : id === "density-modes" ? "density" : id === "radius-scale" ? "radius" : id === "elevation" ? "elevation" : id === "opacity-scrim" ? "scrim-opacity" : id === "z-index-stack" ? "z-index" : id;
      const count = roleCounts.get(role) ?? 0;
      const iconCount = category.id === "icon-assets" ? (id === "icon-library" ? iconWorkbench.architecture.libraryCount : id === "icon-size-grid" ? iconWorkbench.architecture.gridCount : id === "stroke-fill" ? iconWorkbench.architecture.strokeWidthCount + iconWorkbench.fills.length : id === "illustration-image" ? candidates.filter((item) => ["image", "avatar"].includes(item.primitive)).length : 0) : 0;
      const evidenceCount = count || iconCount;
      return { id, status: evidenceCount ? "detected" : canonical.length || candidates.length || (scan.iconAssets?.length ?? 0) ? "partial" : "not-detected", count: evidenceCount };
    }),
    metrics: [
      metric("definition-files", countUnique(canonical, (item) => item.file)),
      metric("definitions", canonical.length),
      metric("unique-values", countUnique(canonical, (item) => item.normalizedValue)),
      metric("hardcoded-occurrences", rawValues.length),
      metric("hardcoded-files", countUnique(rawValues, (item) => item.file)),
      metric("source-findings", categoryFindings.length),
      ...(category.primitives ? [metric("implementations", candidates.length)] : []),
    ],
    ...(foundationWorkbench ? { foundationWorkbench } : {}),
    ...(iconWorkbench ? { iconWorkbench } : {}),
    sourceRefs: category.id === "icon-assets"
      ? (scan.iconAssets ?? []).slice(0, 12).map((item) => ({ file: item.file, line: item.line, name: item.source, value: item.type }))
      : canonical.slice(0, 12).map((item) => ({ file: item.file, line: item.line, name: item.name, value: item.value })),
  };
}

function legacyContracts() {
  return [
    { surface: "Controls", appliesTo: ["button", "iconbutton", "input", "textarea", "select", "checkbox", "radio", "switch"] },
    { surface: "Dialog / Sheet", appliesTo: ["dialog", "sheet"] },
    { surface: "Popover / Dropdown / Tooltip", appliesTo: ["popover", "dropdown", "tooltip"] },
    { surface: "Toast", appliesTo: ["toast"] },
  ];
}

export function buildSystemReview(scan, classification, findings) {
  const staticLayers = STATIC_LAYERS.map((layer) => {
    const categories = layer.id === "foundation"
      ? layer.categories.map((category) => foundationCategory(category, scan, classification, findings))
      : layer.categories.map((category) => componentCategory(category, scan));
    return {
      id: layer.id,
      label: layer.id,
      status: aggregateStatus(categories.map((item) => item.status)),
      categories,
    };
  });

  const ownerPrimitives = new Set(scan.componentCandidates.filter((item) => item.role === "owner").map((item) => item.primitive));
  const dynamicLayers = DYNAMIC_LAYERS.map((layer) => ({
    id: layer.id,
    label: layer.id,
    status: "unverified",
    categories: layer.categories.map((category) => ({
      id: category.id,
      status: "unverified",
      appliesTo: category.appliesTo,
      metrics: [metric("applicable-components", category.appliesTo.filter((item) => ownerPrimitives.has(item)).length, category.appliesTo.length)],
    })),
  }));

  return {
    modelVersion: "1.3",
    model: "static-five-dynamic-four",
    status: "source-derived-system-review",
    disclaimer: "The taxonomy is complete, but source scanning cannot verify rendered appearance or runtime behavior. Detected means source evidence exists; it does not mean the category is healthy.",
    staticLayers,
    dynamicLayers,
    dynamicContracts: legacyContracts(),
  };
}

export const SYSTEM_REVIEW_PATHS = {
  static: STATIC_LAYERS.map((layer) => ({ id: layer.id, categories: layer.categories.map((category) => category.id) })),
  dynamic: DYNAMIC_LAYERS.map((layer) => ({ id: layer.id, categories: layer.categories.map((category) => category.id) })),
};
