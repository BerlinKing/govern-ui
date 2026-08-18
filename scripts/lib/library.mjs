import { readFile } from "node:fs/promises";
import path from "node:path";
import { auditRepository } from "./audit.mjs";
import { generatedAt, sha } from "./utils.mjs";
import { buildTokenUsage, inferProductLocation, usageForRawValue } from "./usage.mjs";

const CATEGORY_ORDER = [
  "color",
  "typography",
  "icons",
  "shadow",
  "stroke",
  "radius",
  "spacing",
  "opacity",
  "blur",
  "layer",
  "motion",
  "other",
];

const COLOR_GROUP_ORDER = [
  "background",
  "text",
  "border",
  "icon-fill",
  "brand-action",
  "feedback",
  "data-visualization",
  "other",
];

const COLOR_FUNCTION = /^(?:#(?:[0-9a-f]{3,8})\b|rgba?\(|hsla?\(|oklch\(|oklab\(|lab\(|lch\(|color\(|color-mix\(|transparent\b|currentcolor\b|black\b|white\b)/i;
const COLOR_NAME = /(?:^|-)(?:color|bg|background|surface|canvas|foreground|text|content|border|stroke|outline|divider|ring|fill|icon|glyph|brand|primary|secondary|tertiary|accent|link|success|positive|warning|caution|error|danger|critical|negative|info|chart|series|data)(?:-|$)/i;
const COLOR_CHANNELS = /^-?[\d.]+(?:deg)?\s+-?[\d.]+%\s+-?[\d.]+%(?:\s*\/\s*[\d.]+%?)?$/i;
const VARIABLE_REFERENCE = /var\(\s*(--[a-zA-Z0-9_-]+)(?:\s*,\s*([^)]+))?\)/g;

function naturalSort(left, right) {
  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" });
}

function unique(items) {
  return [...new Set(items.filter((item) => item != null && item !== ""))];
}

function localized(zh, en) {
  return { zh, en };
}

function normalizeValue(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function hexByte(value) {
  return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0").toUpperCase();
}

function alphaByte(value) {
  return hexByte(Math.max(0, Math.min(1, value)) * 255);
}

function hslToRgb(hue, saturation, lightness) {
  const h = ((hue % 360) + 360) % 360 / 360;
  const s = Math.max(0, Math.min(1, saturation));
  const l = Math.max(0, Math.min(1, lightness));
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (offset) => {
    let t = h + offset;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [channel(1 / 3) * 255, channel(0) * 255, channel(-1 / 3) * 255];
}

function parseAlpha(value) {
  const raw = String(value ?? "1").trim();
  return raw.endsWith("%") ? Number.parseFloat(raw) / 100 : Number.parseFloat(raw);
}

function normalizeColorHex(value) {
  const raw = normalizeValue(value).toLowerCase();
  if (!raw || /var\(|currentcolor|color-mix\(/.test(raw)) return null;
  if (raw === "black") return "#000000";
  if (raw === "white") return "#FFFFFF";
  if (raw === "transparent") return "#00000000";
  const hex = raw.match(/^#([0-9a-f]{3,8})$/i)?.[1];
  if (hex) {
    if (hex.length === 3 || hex.length === 4) return `#${[...hex].map((part) => part + part).join("").toUpperCase()}`;
    if (hex.length === 6 || hex.length === 8) return `#${hex.toUpperCase()}`;
  }
  const colorMatch = raw.match(/^(rgba?|hsla?)\((.+)\)$/i);
  const bareHsl = raw.match(/^(-?[\d.]+(?:deg|turn|rad)?)\s+([\d.]+)%\s+([\d.]+)%(?:\s*\/\s*([\d.]+%?))?$/i);
  if (!colorMatch && !bareHsl) return null;
  const kind = bareHsl ? "hsl" : colorMatch[1].toLowerCase();
  const body = bareHsl ? bareHsl.slice(1).filter(Boolean).join(" ") : colorMatch[2];
  const slashParts = body.split("/").map((part) => part.trim());
  let parts = slashParts[0].replaceAll(",", " ").split(/\s+/).filter(Boolean);
  let alpha = slashParts[1] == null ? 1 : parseAlpha(slashParts[1]);
  if (parts.length === 4) alpha = parseAlpha(parts.pop());
  if (!Number.isFinite(alpha)) return null;
  let rgb;
  if (kind.startsWith("rgb")) {
    if (parts.length !== 3) return null;
    rgb = parts.map((part) => part.endsWith("%") ? Number.parseFloat(part) * 2.55 : Number.parseFloat(part));
  } else {
    if (parts.length !== 3 || !parts[1].endsWith("%") || !parts[2].endsWith("%")) return null;
    let hue = Number.parseFloat(parts[0]);
    if (parts[0].endsWith("turn")) hue *= 360;
    else if (parts[0].endsWith("rad")) hue *= 180 / Math.PI;
    rgb = hslToRgb(hue, Number.parseFloat(parts[1]) / 100, Number.parseFloat(parts[2]) / 100);
  }
  if (rgb.some((channel) => !Number.isFinite(channel))) return null;
  const opaque = alpha >= 0.999;
  return `#${rgb.map(hexByte).join("")}${opaque ? "" : alphaByte(alpha)}`;
}

function colorSyntax(value) {
  const raw = normalizeValue(value).toLowerCase();
  if (/^#[0-9a-f]{3,8}$/i.test(raw)) return "hex";
  if (/^rgba?\(/.test(raw)) return "rgb";
  if (/^hsla?\(/.test(raw)) return "hsl";
  if (COLOR_CHANNELS.test(raw)) return "hsl-channels";
  if (/^oklch\(|^oklab\(|^lab\(|^lch\(/.test(raw)) return "perceptual";
  if (/var\(/.test(raw)) return "variable";
  return "other";
}

function makeDefinitionLookup(definitions) {
  const lookup = new Map();
  for (const definition of definitions) {
    if (!lookup.has(definition.normalizedName)) lookup.set(definition.normalizedName, []);
    lookup.get(definition.normalizedName).push(definition);
  }
  return lookup;
}

function chooseDefinition(name, context, lookup) {
  const normalizedName = name.replace(/^--/, "").toLowerCase();
  const candidates = (lookup.get(normalizedName) ?? []).filter((item) => item.id !== context.id);
  if (!candidates.length) return null;
  const sameFile = candidates.find((item) => item.file === context.file && item.selector === context.selector)
    ?? candidates.find((item) => item.file === context.file && item.selector === ":root")
    ?? candidates.find((item) => item.file === context.file);
  if (sameFile) return sameFile;
  const canonical = candidates.filter((item) => item.role === "canonical");
  if (canonical.length > 1 && new Set(canonical.map((item) => item.normalizedValue)).size > 1) return null;
  return canonical.find((item) => item.selector === ":root")
    ?? candidates.find((item) => item.selector === ":root")
    ?? candidates[0]
    ?? null;
}

function resolveDefinition(definition, lookup, stack = new Set()) {
  const key = `${definition.file}:${definition.selector}:${definition.normalizedName}`;
  if (stack.has(key)) return { value: definition.value, chain: [], cycle: true };
  const nextStack = new Set(stack).add(key);
  const chain = [];
  let cycle = false;
  const value = normalizeValue(definition.value).replace(VARIABLE_REFERENCE, (match, name, fallback) => {
    const target = chooseDefinition(name, definition, lookup);
    if (!target) {
      chain.push(name);
      return fallback ? normalizeValue(fallback) : match;
    }
    chain.push(target.name);
    const resolved = resolveDefinition(target, lookup, nextStack);
    chain.push(...resolved.chain);
    cycle ||= resolved.cycle;
    return resolved.value || (fallback ? normalizeValue(fallback) : match);
  });
  return { value, chain: unique(chain), cycle };
}

function referenceProperty(reference) {
  const context = reference.context ?? "";
  const before = context.slice(0, Math.max(0, context.lastIndexOf("var(")));
  const property = before.match(/([a-z-]+)\s*:\s*[^:;{}]*$/i)?.[1]?.toLowerCase() ?? null;
  return property?.startsWith("--") ? null : property;
}

function tokenScope(definition) {
  const selector = definition.selector ?? "unknown";
  if (/\.dark\b|data-theme\s*=\s*["']?dark|prefers-color-scheme\s*:\s*dark/i.test(selector)) return "dark";
  if (/\.light\b|data-theme\s*=\s*["']?light|prefers-color-scheme\s*:\s*light/i.test(selector)) return "light";
  if (selector === ":root" || /(?:^|,|\s)(?:html|body)(?:\s|,|$)/i.test(selector)) return "global";
  if (/data-(?:brand|theme)|\.theme-|\.brand-/i.test(selector)) return "theme";
  return selector === "unknown" ? "unspecified" : "scoped";
}

function isColorToken(token) {
  if (COLOR_FUNCTION.test(token.resolvedValue) || COLOR_CHANNELS.test(token.resolvedValue)) return true;
  return /var\(/i.test(token.resolvedValue) && COLOR_NAME.test(token.normalizedName);
}

function colorGroup(token) {
  const name = token.normalizedName;
  const properties = token.properties.join(" ");
  const haystack = `${name} ${properties}`.trim();
  if (/(?:^|-)(?:text|content|foreground|label|heading|title|caption|placeholder)(?:-|\s|$)|(?:^|\s)color(?:\s|$)/.test(haystack)) return "text";
  if (/(?:^|-)(?:border|stroke|outline|divider|ring)(?:-|\s|$)|\b(?:border|outline)(?:-color)?\b/.test(haystack)) return "border";
  if (/(?:^|-)(?:icon|glyph|fill)(?:-|\s|$)|\b(?:fill|stroke)\b/.test(haystack)) return "icon-fill";
  if (/(?:^|-)(?:bg|background|surface|canvas|page|panel|card|popover|menu|float|mask|overlay)(?:-|\s|$)|\bbackground(?:-color)?\b/.test(haystack)) return "background";
  if (/(?:^|-)(?:success|positive|warning|caution|error|danger|critical|negative|info)(?:-|\s|$)/.test(haystack)) return "feedback";
  if (/(?:^|-)(?:chart|series|data|categorical|sequential|diverging)(?:-|\s|$)/.test(haystack)) return "data-visualization";
  if (/(?:^|-)(?:brand|primary|secondary|tertiary|accent|action|link)(?:-|\s|$)/.test(haystack)) return "brand-action";
  return "other";
}

function tokenCategory(token) {
  const haystack = `${token.normalizedName} ${token.resolvedValue}`.toLowerCase();
  if (isColorToken(token)) return "color";
  if (/(?:^|-)angle(?:-|$)/.test(token.normalizedName) && /(?:deg|grad|rad|turn)\b/.test(token.resolvedValue)) return "other";
  if (token.kind === "typography") return "typography";
  if (token.kind === "shadow" || /(?:^|-)(?:shadow|elevation)(?:-|$)/.test(haystack)) return "shadow";
  if (token.kind === "radius") return "radius";
  if (token.kind === "stroke") return "stroke";
  if (token.kind === "spacing") return "spacing";
  if (token.kind === "layer") return "layer";
  if (token.kind === "motion") return "motion";
  if (token.kind === "depth") {
    if (/(?:blur|backdrop-filter|filter)/.test(haystack)) return "blur";
    return "opacity";
  }
  return "other";
}

function rawProperty(raw) {
  const evidence = String(raw.evidence ?? "");
  const property = evidence.match(/\b(background(?:-color)?|color|border(?:-(?:top|right|bottom|left))?(?:-color)?|outline(?:-color)?|fill|stroke|caret-color|text-decoration-color)\s*:/i)?.[1]
    ?? evidence.match(/\b(backgroundColor|borderColor|outlineColor|caretColor|textDecorationColor|color|fill|stroke)\s*:/)?.[1]
    ?? evidence.match(/\b(fill|stroke|color)\s*=\s*["']/i)?.[1]
    ?? raw.value?.match(/^([a-z-]+)\s*:/i)?.[1]
    ?? null;
  return property ? property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`).toLowerCase() : null;
}

function directColorScene(raw, property, usage) {
  const location = `${raw.file} ${raw.selector ?? ""} ${(usage.features ?? []).join(" ")} ${(usage.components ?? []).join(" ")} ${(usage.states ?? []).join(" ")}`.toLowerCase();
  const haystack = `${location} ${raw.evidence ?? ""}`;
  const assetFile = /\.(?:svg|json|png|jpe?g|webp|gif|avif|ico)$/i.test(raw.file);
  const illustrationContext = /(?:^|[\/_ .-])(?:illustration|artwork|mascot|decorative|decoration|brand-mark|logo)(?:[\/_ .-]|$)/.test(location);
  if (assetFile || illustrationContext) return "asset-color";
  if (/(?:^|[\/_ .-])(?:charts?|graphs?|plots?|series|data-viz|visualization|heatmaps?|sparklines?)(?:[\/_ .-]|$)/.test(location)) return "data-visualization";
  if (/(?:error|danger|critical|warning|caution|success|positive|negative|info)/.test(haystack)) return "feedback";
  if (property === "fill" || property === "stroke") return "icon-fill";
  if (/^(?:border|outline)/.test(property ?? "")) return "border";
  if (/^(?:background)/.test(property ?? "")) return "background";
  if (/^(?:color|caret-color|text-decoration-color)$/.test(property ?? "")) return /(?:button|link|action|primary|secondary|accent|brand)/.test(haystack) ? "brand-action" : "text";
  if (/(?:button|link|action|primary|secondary|accent|brand|checkout)/.test(haystack)) return "brand-action";
  if (/(?:border|divider|outline|ring)/.test(haystack)) return "border";
  if (/(?:icon|glyph)/.test(haystack)) return "icon-fill";
  if (/(?:background|surface|panel|card|canvas|overlay|modal|dialog|drawer|popover|menu)/.test(haystack)) return "background";
  if (/(?:text|label|title|heading|caption|placeholder|foreground)/.test(haystack)) return "text";
  return "unclassified";
}

function rawCategory(raw) {
  const property = rawProperty(raw);
  if (/^(?:box-shadow|text-shadow)$/.test(property ?? "")) return "shadow";
  if (/^(?:font|line-height|letter-spacing)/.test(property ?? "")) return "typography";
  if (/^(?:opacity)$/.test(property ?? "")) return "opacity";
  if (/^(?:filter|backdrop-filter)$/.test(property ?? "")) return "blur";
  if (/^(?:z-index|zindex)$/.test(property ?? "")) return "layer";
  if (raw.kind === "color") return "color";
  if (raw.kind === "typography" || raw.kind === "tailwind-typography") return "typography";
  if (raw.kind === "shadow") return "shadow";
  if (raw.kind === "stroke" || raw.kind === "tailwind-shape") {
    return /radius|rounded/i.test(raw.value) ? "radius" : "stroke";
  }
  if (raw.kind === "length" || raw.kind === "tailwind-spacing") {
    if (/font-size|line-height|letter-spacing|leading|tracking/i.test(raw.value)) return "typography";
    if (/border-radius|rounded/i.test(raw.value)) return "radius";
    return "spacing";
  }
  if (raw.kind === "z-index") return "layer";
  if (raw.kind === "motion") return "motion";
  if (raw.kind === "depth-effect" || raw.kind === "tailwind-depth") {
    if (/blur|filter/i.test(raw.value)) return "blur";
    if (/shadow/i.test(raw.value)) return "shadow";
    if (/(?:^|-)z-|z-index/i.test(raw.value)) return "layer";
    return "opacity";
  }
  if (raw.kind === "arbitrary-tailwind") {
    if (/shadow/.test(raw.value)) return "shadow";
    if (/rounded/.test(raw.value)) return "radius";
    if (/(?:border|ring|outline)/.test(raw.value)) return "stroke";
    if (/(?:duration|delay)/.test(raw.value)) return "motion";
    if (/(?:opacity|blur)/.test(raw.value)) return /blur/.test(raw.value) ? "blur" : "opacity";
    if (/(?:^|:)z-/.test(raw.value)) return "layer";
    if (/(?:^|:)(?:bg|text|border|ring|outline|fill|stroke)-\[(?:#|rgba?\(|hsla?\(|oklch\(|color\(|var\()/i.test(raw.value)) return "color";
    if (/(?:text|leading|tracking)-/.test(raw.value)) return "typography";
    if (/(?:bg|text|border|ring|outline|fill|stroke)-/.test(raw.value)) return "color";
    return "spacing";
  }
  return "other";
}

function groupDirectStyles(rawValues) {
  const groups = new Map();
  for (const raw of rawValues) {
    if (/^(?:\/\/|\/\*|\*)/.test(String(raw.evidence ?? "").trim())) continue;
    const category = rawCategory(raw);
    const property = rawProperty(raw);
    const usage = usageForRawValue(raw);
    const normalizedColor = category === "color" ? normalizeColorHex(raw.value) : null;
    const scene = category === "color" ? directColorScene(raw, property, usage) : "default";
    const valueKey = normalizedColor ?? normalizeValue(raw.value).toLowerCase();
    const key = category === "color" ? `${category}:${scene}:${valueKey}` : `${category}:${property ?? ""}:${valueKey}`;
    if (!groups.has(key)) groups.set(key, {
      id: `direct-${sha(key)}`,
      category,
      group: category === "color" ? ({ border: "border", "icon-fill": "icon-fill", background: "background", text: "text", feedback: "feedback", "data-visualization": "data-visualization", "brand-action": "brand-action" }[scene] ?? "other") : "default",
      scene,
      property,
      properties: new Set(),
      value: normalizedColor ?? normalizeValue(raw.value),
      normalizedColor,
      sourceValues: new Set(),
      syntaxCounts: new Map(),
      occurrences: 0,
      files: new Set(),
      examples: [],
      usages: [],
      contexts: new Map(),
    });
    const group = groups.get(key);
    group.occurrences += 1;
    group.files.add(raw.file);
    if (property) group.properties.add(property);
    group.sourceValues.add(normalizeValue(raw.value));
    const syntax = colorSyntax(raw.value);
    group.syntaxCounts.set(syntax, (group.syntaxCounts.get(syntax) ?? 0) + 1);
    if (group.examples.length < 6000) group.examples.push({ file: raw.file, line: raw.line, selector: raw.selector ?? null, property, evidence: raw.evidence ?? null });
    group.usages.push(usage);
    if (category === "color") {
      const feature = usage.features[0] ?? usage.components[0] ?? usage.pages[0] ?? "Unknown";
      const states = (usage.states ?? []).join(",") || "default";
      const contextKey = `${scene}:${feature}:${states}`;
      if (!group.contexts.has(contextKey)) group.contexts.set(contextKey, { scene, feature, states: usage.states ?? [], occurrences: 0, files: new Set(), components: new Set(), pages: new Set(), scopes: new Set() });
      const context = group.contexts.get(contextKey);
      context.occurrences += 1;
      context.files.add(raw.file);
      for (const component of usage.components ?? []) context.components.add(component);
      for (const page of usage.pages ?? []) context.pages.add(page);
      for (const scope of usage.scopes ?? []) context.scopes.add(scope);
    }
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      properties: [...group.properties].sort(naturalSort),
      sourceValues: [...group.sourceValues].sort(naturalSort),
      syntaxCounts: Object.fromEntries([...group.syntaxCounts.entries()].sort(([left], [right]) => naturalSort(left, right))),
      contexts: [...group.contexts.values()].map((context) => ({
        ...context,
        files: [...context.files].sort(naturalSort),
        components: [...context.components].sort(naturalSort),
        pages: [...context.pages].sort(naturalSort),
        scopes: [...context.scopes].sort(naturalSort),
      })).sort((left, right) => right.occurrences - left.occurrences || naturalSort(left.feature, right.feature)),
      files: [...group.files].sort(naturalSort),
      usage: {
        features: unique(group.usages.flatMap((item) => item.features)).sort(naturalSort),
        components: unique(group.usages.flatMap((item) => item.components)).sort(naturalSort),
        pages: unique(group.usages.flatMap((item) => item.pages)).sort(naturalSort),
        scopes: unique(group.usages.flatMap((item) => item.scopes)).sort(naturalSort),
        states: unique(group.usages.flatMap((item) => item.states)).sort(naturalSort),
        evidenceLevels: unique(group.usages.flatMap((item) => item.evidenceLevels)),
        examples: group.usages.flatMap((item) => item.examples).slice(0, 12),
        summary: unique(group.usages.map((item) => item.summary)).slice(0, 3).join(", "),
      },
      usages: undefined,
    }))
    .sort((left, right) => naturalSort(left.category, right.category) || naturalSort(left.scene ?? "", right.scene ?? "") || right.occurrences - left.occurrences || naturalSort(left.value, right.value));
}

function buildTokens(report) {
  const lookup = makeDefinitionLookup(report.tokenDefinitions);
  const refsByName = new Map();
  for (const reference of report.tokenReferences ?? []) {
    if (!refsByName.has(reference.normalizedName)) refsByName.set(reference.normalizedName, []);
    refsByName.get(reference.normalizedName).push(reference);
  }
  const tokens = report.tokenDefinitions.map((definition) => {
    const references = refsByName.get(definition.normalizedName) ?? [];
    const resolved = resolveDefinition(definition, lookup);
    const token = {
      id: definition.id,
      name: definition.name,
      normalizedName: definition.normalizedName,
      value: definition.value,
      resolvedValue: resolved.value,
      aliasChain: resolved.chain,
      aliasCycle: resolved.cycle,
      kind: definition.kind,
      sourceType: definition.sourceType,
      role: definition.role,
      file: definition.file,
      line: definition.line,
      selector: definition.selector,
      scope: tokenScope(definition),
      usageCount: references.length,
      usageFiles: unique(references.map((item) => item.file)).sort(naturalSort),
      properties: unique(references.map(referenceProperty)).sort(naturalSort),
    };
    token.category = tokenCategory(token);
    token.group = token.category === "color" ? colorGroup(token) : "default";
    return token;
  });
  const usage = buildTokenUsage(tokens, report.tokenReferences ?? []);
  for (const token of tokens) {
    token.usage = usage.get(token.id);
    token.usageCount = token.usage.totalReferenceCount;
    token.usageFiles = unique(token.usage.examples.map((item) => item.file)).sort(naturalSort);
  }
  return tokens.sort((left, right) => CATEGORY_ORDER.indexOf(left.category) - CATEGORY_ORDER.indexOf(right.category)
    || (left.category === "color" ? COLOR_GROUP_ORDER.indexOf(left.group) - COLOR_GROUP_ORDER.indexOf(right.group) : 0)
    || naturalSort(left.name, right.name)
    || naturalSort(left.file, right.file));
}

function resolveSvgPath(repoRoot, asset) {
  if (asset.type === "local-svg") return path.resolve(repoRoot, asset.file);
  if (asset.type !== "svg-import" || !asset.source?.startsWith(".")) return null;
  return path.resolve(repoRoot, path.dirname(asset.file), asset.source.replace(/[?#].*$/, ""));
}

function iconCollection(asset) {
  if (asset.type === "icon-library") return asset.source;
  if (asset.type === "inline-svg") return "inline-svg";
  if (asset.type === "local-svg") return path.posix.dirname(asset.file);
  if (asset.type === "svg-import" && asset.source?.startsWith(".")) {
    return path.posix.normalize(path.posix.join(path.posix.dirname(asset.file), path.posix.dirname(asset.source.replace(/[?#].*$/, ""))));
  }
  return path.posix.dirname(asset.source ?? asset.file);
}

function iconIdentity(value) {
  return String(value ?? "").replace(/Icon$/i, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function graphicKind(asset) {
  const haystack = `${asset.name} ${asset.source} ${asset.file} ${asset.collection}`.toLowerCase();
  if (/cursor/.test(haystack)) return "cursor";
  if (/(?:placeholder|empty[-_ ]?state|skeleton)/.test(haystack)) return "placeholder";
  if (/(?:logo|wordmark|favicon|branding|footer-social|alipay|reddit|discord|facebook|instagram|youtube|red-note|anthropic|openai|gemini|kimi|minimax|google-colored|figma)/.test(haystack)) return "brand-mark";
  if (/(?:landingpage|hero[-_ ]?slogan|illustration|portrait|background|texture|figma-designer-assets|page\d+|aneway|davinci|einstein|galileo|machenge|curie|mozart|vangogh)/.test(haystack)) return "illustration";
  if (asset.type === "icon-library" || /(?:^|[\s/])packages\/[^/]*(?:react-)?icons?\/(?:src\/svg|icons?)(?:[\s/]|$)/.test(haystack) || /(?:^|[-_ ])icon(?:[-_ ]|$)|(?:lined|filled)$/.test(asset.name.toLowerCase())) return "ui-icon";
  return "graphic-asset";
}

function resolveReferenceFile(reference) {
  const source = reference.source.replace(/[?#].*$/, "").replaceAll("\\", "/");
  if (source.startsWith(".")) return path.posix.normalize(path.posix.join(path.posix.dirname(reference.file), source));
  if (source.startsWith("apps/") || source.startsWith("packages/") || source.startsWith("src/")) return path.posix.normalize(source);
  const appMatch = reference.file.match(/^(apps\/[^/]+)\//);
  if (source.startsWith("/") && appMatch) return path.posix.normalize(`${appMatch[1]}/public/${source.replace(/^\/+/, "")}`);
  if (/^assets\//.test(source) && appMatch) return path.posix.normalize(`${appMatch[1]}/public/${source}`);
  return path.posix.normalize(source.replace(/^\/+/, ""));
}

function isProductionReference(file) {
  return !/(?:^|\/)(?:__tests__|tests?|fixtures?|scripts?|dist|build|coverage)(?:\/|$)|\.(?:test|spec|stories)\.[cm]?[jt]sx?$/i.test(file);
}

function referenceUsage(reference) {
  const location = inferProductLocation(reference.file, reference.evidence ?? "");
  return {
    file: reference.file,
    line: reference.line,
    feature: location.feature,
    component: location.component,
    page: location.page,
    scope: location.scope,
    production: isProductionReference(reference.file),
  };
}

async function internalIconPackages(report, repoRoot) {
  const roots = unique((report.iconAssets ?? [])
    .filter((asset) => asset.type === "local-svg")
    .map((asset) => asset.file.match(/^(packages\/[^/]+)\//)?.[1]));
  const packages = new Map();
  for (const root of roots) {
    try {
      const manifest = JSON.parse(await readFile(path.resolve(repoRoot, root, "package.json"), "utf8"));
      if (manifest.name && /icon/i.test(`${manifest.name} ${root}`)) packages.set(manifest.name, {
        name: manifest.name,
        root,
        private: manifest.private === true,
        hasPackageExports: Boolean(manifest.exports || manifest.main || manifest.module),
      });
    } catch {
      // A local SVG directory does not have to be an icon package.
    }
  }
  return packages;
}

async function assetFingerprint(repoRoot, asset) {
  const absolute = resolveSvgPath(repoRoot, asset);
  if (!absolute) return null;
  try {
    const content = await readFile(absolute, "utf8");
    if (content.length > 250_000 || !/<svg\b/i.test(content)) return null;
    return sha(content.replace(/<!--[^]*?-->/g, "").replace(/\s+/g, " ").trim());
  } catch {
    return null;
  }
}

function assetExposure(item, packageDescriptors) {
  const normalizedFile = path.posix.normalize(item.file ?? "");
  const packageDescriptor = [...packageDescriptors.values()].find((descriptor) => normalizedFile.startsWith(`${descriptor.root}/`));
  if (packageDescriptor) {
    return {
      kind: packageDescriptor.private ? "private-package" : "published-package",
      externallyReachable: !packageDescriptor.private,
      packageName: packageDescriptor.name,
      packageExported: packageDescriptor.hasPackageExports,
    };
  }
  if (/(?:^|\/)public(?:\/|$)/.test(normalizedFile)) return { kind: "public-url", externallyReachable: true, packageName: null, packageExported: false };
  if (item.type === "icon-library") return { kind: "external-package", externallyReachable: false, packageName: item.source, packageExported: true };
  return { kind: "internal-file", externallyReachable: false, packageName: null, packageExported: false };
}

function dynamicReferencePrefix(reference) {
  const source = String(reference.source ?? "").replaceAll("\\", "/");
  const fixed = source.split(/\*|\$\{/)[0].replace(/[^/]*$/, "");
  if (!fixed) return null;
  return resolveReferenceFile({ ...reference, source: fixed });
}

function dynamicReferencesFor(item, references) {
  const file = path.posix.normalize(item.file ?? "");
  return references.filter((reference) => {
    const prefix = dynamicReferencePrefix(reference);
    return prefix && (file.startsWith(prefix) || file.includes(prefix.replace(/^\.\//, "")));
  });
}

async function svgPreview(repoRoot, asset) {
  if (asset.type === "inline-svg" && asset.markup) {
    const markup = asset.markup
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
      .replace(/\s(?:on[A-Z]\w*|dangerouslySetInnerHTML)=\{[^}]*\}/g, "")
      .replace(/\sclassName=/g, " class=")
      .replace(/\sstrokeWidth=/g, " stroke-width=")
      .replace(/\sstrokeLinecap=/g, " stroke-linecap=")
      .replace(/\sstrokeLinejoin=/g, " stroke-linejoin=")
      .replace(/\sfillRule=/g, " fill-rule=")
      .replace(/\sclipRule=/g, " clip-rule=")
      .replace(/=\{([\d.]+)\}/g, '="$1"')
      .replace(/=\{["']([^"']+)["']\}/g, '="$1"')
      .replace(/\{[^{}]*\}/g, "")
      .replace(/<foreignObject\b[\s\S]*?<\/foreignObject>/gi, "")
      .replace(/<script\b[\s\S]*?<\/script>/gi, "")
      .replace(/<svg\b(?![^>]*\bxmlns=)/i, '<svg xmlns="http://www.w3.org/2000/svg"');
    if (/<svg\b/i.test(markup) && !/[{}]/.test(markup)) return `data:image/svg+xml;base64,${Buffer.from(markup).toString("base64")}`;
  }
  const absolute = resolveSvgPath(repoRoot, asset);
  if (!absolute) return null;
  try {
    const content = await readFile(absolute, "utf8");
    if (content.length > 250_000 || !/<svg\b/i.test(content)) return null;
    return `data:image/svg+xml;base64,${Buffer.from(content).toString("base64")}`;
  } catch {
    return null;
  }
}

async function buildIcons(report, repoRoot) {
  const items = [];
  const internalPackages = await internalIconPackages(report, repoRoot);
  const internalPackageNames = new Set(internalPackages.keys());
  for (const asset of report.iconAssets ?? []) {
    if (asset.type === "icon-library") {
      if (internalPackageNames.has(asset.source)) continue;
      const names = asset.names?.length ? asset.names : [asset.source];
      for (const name of names) items.push({
        id: `icon-${sha(`${asset.source}:${name}`)}`,
        name,
        source: asset.source,
        collection: asset.source,
        type: asset.type,
        file: asset.file,
        line: asset.line,
        preview: null,
        viewBox: null,
        width: null,
        height: null,
        strokeWidth: null,
        fill: null,
        stroke: null,
      });
      continue;
    }
    items.push({
      id: asset.id,
      name: asset.type === "local-svg" ? path.basename(asset.file, ".svg") : asset.type === "svg-import" ? path.basename(asset.source.replace(/[?#].*$/, ""), ".svg") : asset.source,
      source: asset.source,
      collection: iconCollection(asset),
      type: asset.type,
      file: asset.file,
      line: asset.line,
      preview: await svgPreview(repoRoot, asset),
      viewBox: asset.viewBox ?? null,
      width: asset.width ?? null,
      height: asset.height ?? null,
      strokeWidth: asset.strokeWidth ?? null,
      fill: asset.fill ?? null,
      stroke: asset.stroke ?? null,
      fingerprint: await assetFingerprint(repoRoot, asset),
    });
  }

  const localByFile = new Map(items.filter((item) => item.type === "local-svg").map((item) => [path.posix.normalize(item.file), item]));
  const referencesById = new Map(items.map((item) => [item.id, []]));
  const addReference = (item, reference) => {
    if (!item) return;
    if (!referencesById.has(item.id)) referencesById.set(item.id, []);
    const key = `${reference.file}:${reference.line}:${reference.source ?? ""}`;
    if (!referencesById.get(item.id).some((candidate) => `${candidate.file}:${candidate.line}:${candidate.source ?? ""}` === key)) referencesById.get(item.id).push(reference);
  };

  for (const reference of report.assetReferences ?? []) addReference(localByFile.get(resolveReferenceFile(reference)), reference);
  for (const observation of report.iconAssets ?? []) {
    if (observation.type === "svg-import") addReference(localByFile.get(resolveReferenceFile(observation)), observation);
  }

  for (const [packageName, packageDescriptor] of internalPackages) {
    const packageRoot = packageDescriptor.root;
    const imports = (report.iconAssets ?? []).filter((asset) => asset.type === "icon-library" && asset.source === packageName);
    const localItems = items.filter((item) => item.type === "local-svg" && item.file.startsWith(`${packageRoot}/`));
    const byIdentity = new Map(localItems.map((item) => [iconIdentity(item.name), item]));
    for (const observation of imports) {
      for (const name of observation.names ?? []) addReference(byIdentity.get(iconIdentity(name)), { ...observation, source: `${packageName}:${name}` });
    }
  }

  for (const item of items) {
    if (item.type === "icon-library" || item.type === "inline-svg" || item.type === "svg-import") addReference(item, { file: item.file, line: item.line, source: item.source });
  }

  const merged = new Map();
  for (const item of items) {
    const key = `${item.type}:${item.source}:${item.name}`;
    if (!merged.has(key)) merged.set(key, { ...item, occurrences: 0, files: new Set() });
    const target = merged.get(key);
    target.occurrences += 1;
    target.files.add(item.file);
    if (!target.preview && item.preview) target.preview = item.preview;
    for (const reference of referencesById.get(item.id) ?? []) {
      if (!target.references) target.references = [];
      const key = `${reference.file}:${reference.line}:${reference.source ?? ""}`;
      if (!target.references.some((candidate) => `${candidate.file}:${candidate.line}:${candidate.source ?? ""}` === key)) target.references.push(reference);
    }
  }
  const assets = [...merged.values()]
    .map((item) => {
      const references = (item.references ?? []).map(referenceUsage).sort((left, right) => naturalSort(left.file, right.file) || left.line - right.line);
      const productionReferences = references.filter((reference) => reference.production);
      const kind = graphicKind(item);
      const sourceStatus = productionReferences.length ? "source-used" : references.length ? "test-or-build-only" : "repository-only";
      const exposure = assetExposure(item, internalPackages);
      const dynamicReferences = dynamicReferencesFor(item, report.dynamicAssetReferences ?? []);
      return {
        ...item,
        files: [...item.files].sort(naturalSort),
        kind,
        sourceStatus,
        runtimeStatus: "unverified",
        buildStatus: "not-checked",
        exposure,
        dynamicReferences,
        referenceCount: references.length,
        productionReferenceCount: productionReferences.length,
        references: references.slice(0, 24),
        usage: {
          features: unique(productionReferences.map((reference) => reference.feature)),
          components: unique(productionReferences.map((reference) => reference.component)),
          pages: unique(productionReferences.map((reference) => reference.page)),
        },
      };
    });

  const primaryOwnedSource = assets
    .filter((item) => item.kind === "ui-icon" && item.exposure.kind === "private-package")
    .sort((left, right) => right.productionReferenceCount - left.productionReferenceCount)[0]?.collection ?? null;
  const primaryIdentities = new Set(assets.filter((item) => item.collection === primaryOwnedSource).map((item) => iconIdentity(item.name)));
  const fingerprintGroups = new Map();
  for (const asset of assets.filter((item) => item.kind === "ui-icon" && item.fingerprint)) {
    if (!fingerprintGroups.has(asset.fingerprint)) fingerprintGroups.set(asset.fingerprint, []);
    fingerprintGroups.get(asset.fingerprint).push(asset);
  }
  const mergeTargets = new Map();
  for (const group of fingerprintGroups.values()) {
    if (group.length < 2) continue;
    const target = group.find((item) => item.collection === primaryOwnedSource && item.productionReferenceCount)
      ?? group.find((item) => item.productionReferenceCount)
      ?? group.find((item) => item.collection === primaryOwnedSource)
      ?? group[0];
    for (const asset of group) if (asset.id !== target.id) mergeTargets.set(asset.id, target);
  }

  for (const asset of assets) {
    const mergeTarget = mergeTargets.get(asset.id);
    const sameIdentityInPrimary = asset.kind === "ui-icon" && asset.collection !== primaryOwnedSource && primaryIdentities.has(iconIdentity(asset.name));
    const deletionChecks = [
      {
        id: "source-consumers",
        status: asset.productionReferenceCount ? "blocked" : "passed",
        detail: asset.productionReferenceCount
          ? localized(`发现 ${asset.productionReferenceCount} 个应用源码消费者`, `${asset.productionReferenceCount} app-source consumer(s) found`)
          : localized("未发现应用源码消费者", "No app-source consumer found"),
      },
      {
        id: "test-build-consumers",
        status: asset.referenceCount > asset.productionReferenceCount ? "review" : "passed",
        detail: asset.referenceCount > asset.productionReferenceCount
          ? localized(`发现 ${asset.referenceCount - asset.productionReferenceCount} 个测试或构建消费者，需要随资产同步处理`, `${asset.referenceCount - asset.productionReferenceCount} test/build consumer(s) must be handled with the asset`)
          : localized("未发现仅测试或构建消费者", "No test/build-only consumer found"),
      },
      {
        id: "public-contract",
        status: asset.exposure.externallyReachable ? "blocked" : "passed",
        detail: asset.exposure.externallyReachable
          ? localized(`${asset.exposure.kind} 可能绕过源码依赖图被外部访问`, `${asset.exposure.kind} may be consumed outside the scanned source graph`)
          : localized(`${asset.exposure.kind} 未发现外部契约`, `${asset.exposure.kind} has no detected external contract`),
      },
      {
        id: "dynamic-loading",
        status: asset.dynamicReferences.length ? "blocked" : "passed",
        detail: asset.dynamicReferences.length
          ? localized(`发现 ${asset.dynamicReferences.length} 个可能覆盖此资产的动态加载规则`, `${asset.dynamicReferences.length} dynamic loading pattern(s) cover this asset`)
          : localized("未发现匹配的动态加载规则", "No matching dynamic loading pattern found"),
      },
      { id: "production-build", status: "pending", detail: localized("批准后运行仓库生产构建", "Run the repository production build after approval") },
      { id: "runtime-visibility", status: "pending", detail: localized("核验受影响页面与状态基线", "Verify the affected route/state baseline") },
      { id: "trial-removal", status: "pending", detail: localized("独立批次试删，并要求测试通过且无非预期视觉变化", "Remove in an isolated batch and require tests plus zero unexpected visual changes") },
    ];
    const staticDeleteQualified = asset.type === "local-svg"
      && !asset.productionReferenceCount
      && !asset.exposure.externallyReachable
      && !asset.dynamicReferences.length;
    let recommendation = "keep";
    let decisionStatus = "auto-recommended";
    let reason = localized("发现应用源码消费者，当前建议保留。", "An app-source consumer was found; keep the asset.");
    let target = null;
    if (mergeTarget) {
      recommendation = "merge";
      target = mergeTarget.name;
      reason = localized(`SVG 几何内容与 ${mergeTarget.name} 完全相同，建议合并为一个资产所有者。`, `Exact SVG geometry duplicates ${mergeTarget.name}; merge to one asset owner.`);
    } else if (sameIdentityInPrimary && asset.productionReferenceCount) {
      recommendation = "migrate";
      target = [...assets].find((item) => item.collection === primaryOwnedSource && iconIdentity(item.name) === iconIdentity(asset.name))?.name ?? null;
      reason = localized(`主 UI Icon 来源 ${primaryOwnedSource} 已有同名资产，建议迁移消费者。`, `A same-named asset exists in the primary owned UI Icon source ${primaryOwnedSource}; migrate consumers.`);
    } else if (staticDeleteQualified) {
      recommendation = "delete";
      reason = localized("静态删除资格已通过；生产构建、运行时基线和试删除将在批准后自动执行。", "Static deletion gates passed; production build, runtime baseline, and trial removal remain automatic implementation checks.");
    } else if (!asset.productionReferenceCount) {
      recommendation = "verify-external";
      decisionStatus = "blocked-by-external-evidence";
      reason = asset.exposure.externallyReachable
        ? localized(`${asset.exposure.kind} 可以绕过静态源码引用直接访问，需要集中核验外部使用。`, `${asset.exposure.kind} can be requested without a static source import; verify external usage as one grouped task.`)
        : asset.dynamicReferences.length
          ? localized("动态加载规则可能访问此资产，需要集中核验运行时使用。", "A dynamic loading pattern can reach this asset; verify runtime usage as one grouped task.")
          : localized("未发现源码消费者，但无法从仓库可靠判断此非 UI 图形的产品职责。", "No source consumer was found, but the product ownership of this non-UI graphic cannot be inferred safely from the repository.");
    }
    asset.lifecycleStatus = recommendation;
    asset.governance = {
      recommendation,
      decisionStatus,
      reason,
      target,
      deleteEligibility: recommendation === "delete" ? "qualified-for-trial" : "not-qualified",
      checks: deletionChecks,
    };
  }

  return assets.sort((left, right) => naturalSort(left.source, right.source) || naturalSort(left.name, right.name));
}

function categorySummary(tokens, directStyles, id) {
  const categoryTokens = tokens.filter((item) => item.category === id);
  const categoryDirect = directStyles.filter((item) => item.category === id);
  const groups = id === "color" ? COLOR_GROUP_ORDER.map((group) => ({
    id: group,
    tokens: categoryTokens.filter((item) => item.group === group),
    directStyles: categoryDirect.filter((item) => item.group === group),
  })) : [{ id: "default", tokens: categoryTokens, directStyles: categoryDirect }];
  return {
    id,
    tokenCount: categoryTokens.length,
    uniqueValueCount: unique(categoryTokens.map((item) => item.resolvedValue)).length,
    directValueCount: categoryDirect.length,
    groups,
  };
}

export async function styleLibraryFromReport(report, repoRoot) {
  const tokens = buildTokens(report);
  const groupedDirectStyles = groupDirectStyles(report.rawValues ?? []);
  const assetInternalColors = groupedDirectStyles.filter((item) => item.category === "color" && item.scene === "asset-color");
  const directStyles = groupedDirectStyles.filter((item) => !(item.category === "color" && item.scene === "asset-color"));
  const icons = await buildIcons(report, repoRoot);
  const graphicAssetKinds = Object.fromEntries(["ui-icon", "brand-mark", "illustration", "placeholder", "cursor", "graphic-asset"].map((kind) => [kind, icons.filter((item) => item.kind === kind).length]));
  const graphicAssetUsage = Object.fromEntries(["source-used", "test-or-build-only", "repository-only"].map((status) => [status, icons.filter((item) => item.sourceStatus === status).length]));
  const assetRecommendations = Object.fromEntries(["keep", "migrate", "merge", "delete", "verify-external"].map((action) => [action, icons.filter((item) => item.governance?.recommendation === action).length]));
  const categories = CATEGORY_ORDER.map((id) => categorySummary(tokens, directStyles, id));
  const cssVariables = tokens.filter((item) => item.name.startsWith("--"));
  return {
    schemaVersion: 1,
    libraryVersion: "2.2",
    generatedAt: generatedAt(),
    project: {
      name: report.repoProfile.rootName,
      styleSystems: report.styleSystems,
      scannedFiles: report.scan.scannedFiles,
    },
    summary: {
      tokens: tokens.length,
      cssVariables: cssVariables.length,
      resolvedAliases: tokens.filter((item) => item.aliasChain.length).length,
      directValues: directStyles.length,
      assetInternalColorClustersExcluded: assetInternalColors.length,
      assetInternalColorOccurrencesExcluded: assetInternalColors.reduce((sum, item) => sum + item.occurrences, 0),
      icons: icons.length,
      graphicAssetKinds,
      graphicAssetUsage,
      assetRecommendations,
      deleteRecommendedIcons: assetRecommendations.delete,
      externalVerificationAssets: assetRecommendations["verify-external"],
      runtimeVerifiedIcons: icons.filter((item) => item.runtimeStatus === "verified").length,
      sourceFiles: unique(tokens.map((item) => item.file)).length,
    },
    categories,
    tokens,
    directStyles,
    icons,
  };
}

export async function extractStyleLibrary(repo) {
  const repoRoot = path.resolve(repo);
  const report = await auditRepository(repoRoot, { collectOptions: { includeAssetDirectories: true }, includeRawValues: true });
  return styleLibraryFromReport(report, repoRoot);
}

export const STYLE_LIBRARY_CATEGORIES = CATEGORY_ORDER;
