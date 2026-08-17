import path from "node:path";
import { readFile } from "node:fs/promises";
import {
  inferTokenKind,
  lineNumberAt,
  normalizeEvidence,
  normalizedTokenName,
  normalizedTokenValue,
  sha,
} from "./utils.mjs";

const STYLE_EXTENSIONS = new Set([".css", ".scss", ".sass", ".less", ".pcss"]);
const SCRIPT_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".vue", ".svelte", ".astro"]);
const TOKEN_PATH = /(?:^|\/)(?:(?:design-)?tokens?|themes?)(?:\/|(?=\.(?:css|scss|sass|less|pcss|js|jsx|ts|tsx|mjs|cjs|json)$))/i;
const TAILWIND_PATH = /(?:^|\/)tailwind\.config\.(?:js|ts|mjs|cjs)$/i;
const PRIMITIVES = [
  "box", "stack", "inline", "grid", "divider", "text", "heading", "icon", "image", "avatar",
  "button", "iconbutton", "link", "input", "textarea", "checkbox", "radio", "switch", "badge", "tag", "spinner", "skeleton", "progress",
  "formfield", "searchfield", "inputgroup", "select", "combobox", "autocomplete", "datepicker", "timepicker", "dropdown", "contextmenu", "tabs", "segmentedcontrol", "breadcrumb", "pagination", "tooltip", "toggletip", "taggroup", "fileuploader",
  "header", "sidebar", "navigation", "pageheader", "table", "datatable", "list", "tree", "card", "metric", "timeline",
  "dialog", "modal", "drawer", "sheet", "popover", "menu", "alert", "toast", "banner", "emptystate", "form", "filter", "editor",
];
const OVERLAYS = new Set(["dialog", "modal", "drawer", "sheet", "popover", "menu", "dropdown", "toast", "tooltip"]);
const ICON_LIBRARY = /^(?:lucide-react|react-icons(?:\/[^"']+)?|@heroicons\/[^"']+|@phosphor-icons\/[^"']+|@radix-ui\/react-icons|@iconify\/[^"']+|@ant-design\/icons|@fortawesome\/[^"']+)$/i;

function approximateSelector(content, index) {
  const open = content.lastIndexOf("{", index);
  if (open < 0) return "unknown";
  const previousClose = content.lastIndexOf("}", open);
  const candidate = content.slice(previousClose + 1, open).split("{").at(-1);
  return normalizeEvidence(candidate).slice(-160) || "unknown";
}

function makeDefinition({ name, value, sourceType, file, line, selector = "unknown", role = "canonical" }) {
  const normalizedName = normalizedTokenName(name);
  const normalizedValue = normalizedTokenValue(value);
  return {
    id: `token-${sha(`${file}:${line}:${normalizedName}:${normalizedValue}`)}`,
    name: name.startsWith("--") ? name : name,
    normalizedName,
    value: normalizeEvidence(value),
    normalizedValue,
    kind: inferTokenKind(normalizedName, normalizedValue),
    sourceType,
    role,
    file,
    line,
    selector,
    ownerId: `owner-${sha(file)}`,
  };
}

function scanCssDefinitions(content, file) {
  const definitions = [];
  const references = [];
  const definitionPattern = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;}\n]+)/g;
  const referencePattern = /var\(\s*(--[a-zA-Z0-9_-]+)\s*(?:,[^)]+)?\)/g;
  let match;
  while ((match = definitionPattern.exec(content))) {
    definitions.push(makeDefinition({
      name: match[1],
      value: match[2],
      sourceType: "css-variable",
      file,
      line: lineNumberAt(content, match.index),
      selector: approximateSelector(content, match.index),
    }));
  }
  while ((match = referencePattern.exec(content))) {
    references.push({
      id: `ref-${sha(`${file}:${match.index}:${match[1]}`)}`,
      name: match[1],
      normalizedName: normalizedTokenName(match[1]),
      file,
      line: lineNumberAt(content, match.index),
      selector: approximateSelector(content, match.index),
      context: normalizeEvidence(content.slice(Math.max(0, match.index - 80), match.index + 140)),
    });
  }
  return { definitions, references };
}

function flattenJson(value, prefix = [], output = []) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    if (Object.hasOwn(value, "$value") || Object.hasOwn(value, "value")) {
      output.push({ name: prefix.join("."), value: value.$value ?? value.value });
      return output;
    }
    for (const key of Object.keys(value).sort()) flattenJson(value[key], [...prefix, key], output);
    return output;
  }
  if (prefix.length && (typeof value === "string" || typeof value === "number")) {
    output.push({ name: prefix.join("."), value });
  }
  return output;
}

function scanJsonDefinitions(content, file) {
  try {
    const parsed = JSON.parse(content);
    return flattenJson(parsed)
      .filter((item) => item.name && item.name.split(".").length <= 8)
      .slice(0, 4000)
      .map((item) => {
        const value = typeof item.value === "string" ? item.value : JSON.stringify(item.value);
        const index = content.indexOf(String(item.name.split(".").at(-1)));
        return makeDefinition({
          name: item.name,
          value,
          sourceType: "json-token",
          file,
          line: index >= 0 ? lineNumberAt(content, index) : 1,
        });
      });
  } catch {
    return [];
  }
}

function scanScriptDefinitions(content, file, isTailwind) {
  const definitions = [];
  const propertyPattern = /^\s*(["']?)([A-Za-z_$][\w$.-]*)\1\s*:\s*([^,\n}]+)/gm;
  let match;
  while ((match = propertyPattern.exec(content)) && definitions.length < 2000) {
    const rawValue = match[3].trim();
    if (!/(?:["'`].*["'`]|^-?\d+(?:\.\d+)?$|var\(|#(?:[0-9a-f]{3,8})\b|rgba?\(|hsla?\(|oklch\()/i.test(rawValue)) continue;
    if (/^(?:name|version|private|scripts|dependencies|devDependencies|peerDependencies)$/.test(match[2])) continue;
    const visualName = /(?:color|background|foreground|surface|text|border|fill|stroke|accent|brand|primary|secondary|font|type|lineheight|letter|radius|rounded|shadow|elevation|duration|easing|motion|transition|spring|layer|zindex|space|spacing|gap|margin|padding|inset|width|height|size)/i.test(match[2]);
    const visualValue = /(?:var\(|#(?:[0-9a-f]{3,8})\b|rgba?\(|hsla?\(|oklch\(|-?\d*\.?\d+(?:px|rem|em|vw|vh|%|ms|s)\b)/i.test(rawValue);
    if (!isTailwind && !visualName && !visualValue) continue;
    const role = isTailwind ? (/var\(/i.test(rawValue) ? "adapter" : "local") : "canonical";
    definitions.push(makeDefinition({
      name: match[2],
      value: rawValue.replace(/^["'`]|["'`]$/g, ""),
      sourceType: isTailwind ? "tailwind-config" : "js-theme",
      file,
      line: lineNumberAt(content, match.index),
      role,
    }));
  }
  return definitions;
}

function scanRawValues(content, file, extension, definitionSource) {
  const rawValues = [];
  const addMatches = (pattern, kind, extra = {}) => {
    let match;
    while ((match = pattern.exec(content)) && rawValues.length < 6000) {
      const lineStart = content.lastIndexOf("\n", match.index) + 1;
      const lineEnd = content.indexOf("\n", match.index);
      const lineText = content.slice(lineStart, lineEnd < 0 ? content.length : lineEnd);
      if (/--[\w-]+\s*:/.test(lineText)) continue;
      if (definitionSource && !STYLE_EXTENSIONS.has(extension)) continue;
      rawValues.push({
        id: `raw-${sha(`${file}:${match.index}:${kind}:${match[0]}`)}`,
        kind,
        value: normalizeEvidence(match[0]),
        file,
        line: lineNumberAt(content, match.index),
        ...(STYLE_EXTENSIONS.has(extension) ? { selector: approximateSelector(content, match.index) } : {}),
        evidence: normalizeEvidence(lineText),
        ...extra,
      });
    }
  };

  addMatches(/#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab|color)\([^\n;]{3,120}\)/g, "color");
  addMatches(/(?:^|["'`\s])(?:-?)(?:bg|text|border|ring|outline|fill|stroke|p[trblxy]?|m[trblxy]?|gap|space-[xy]|w|min-w|max-w|h|min-h|max-h|top|right|bottom|left|inset|rounded|shadow|z|duration|delay|leading|tracking|grid-cols|grid-rows|translate-[xy]|scale|rotate|opacity)-\[[^\]\n]{1,100}\]/g, "arbitrary-tailwind");

  if (STYLE_EXTENSIONS.has(extension)) {
    addMatches(/\b(?:margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|gap|row-gap|column-gap|font-size|line-height|letter-spacing|border-radius|width|height|min-width|max-width|min-height|max-height)\s*:\s*-?(?:\d*\.)?\d+(?:px|rem|em|vw|vh|dvh|svh|lvh|%)\b/gi, "length");
    addMatches(/\b(?:font-family|font-weight|font-style|font-variant|text-transform|text-decoration)\s*:\s*[^;}\n]{1,160}/gi, "typography");
    addMatches(/\b(?:border(?:-(?:top|right|bottom|left))?(?:-(?:width|style))?|outline(?:-width|-style)?)\s*:\s*[^;}\n]{1,160}/gi, "stroke");
    addMatches(/\b(?:box-shadow|text-shadow)\s*:\s*[^;}\n]{1,200}/gi, "shadow");
    addMatches(/\b(?:opacity|backdrop-filter|filter)\s*:\s*[^;}\n]{1,160}/gi, "depth-effect");
    addMatches(/\b(?:transition-duration|animation-duration|transition)\s*:[^;\n]*\b\d+(?:ms|s)\b/gi, "motion");
    addMatches(/\bz-index\s*:\s*(-?\d{1,10})/gi, "z-index");
  } else if (SCRIPT_EXTENSIONS.has(extension)) {
    addMatches(/\bzIndex\s*[:=]\s*(-?\d{1,10})/g, "z-index");
  }

  return rawValues;
}

function scanTailwindUtilities(content, file, extension) {
  if (!SCRIPT_EXTENSIONS.has(extension)) return [];
  const utilities = [];
  const attributePattern = /(?:class|className)\s*=\s*(?:\{\s*)?["'`]([^"'`]{1,2000})["'`](?:\s*\})?/g;
  const utilityPatterns = [
    ["tailwind-spacing", /^(?:-?(?:p[trblxy]?|m[trblxy]?|gap(?:-[xy])?|space-[xy]|inset(?:-[xy])?|top|right|bottom|left|w|min-w|max-w|h|min-h|max-h)-(?:px|0|0\.5|1(?:\.5)?|2(?:\.5)?|3(?:\.5)?|[4-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]|6[0-9]|7[0-9]|8[0-9]|9[0-6]|full|screen))$/],
    ["tailwind-typography", /^(?:text-(?:xs|sm|base|lg|xl|[2-9]xl)|leading-(?:none|tight|snug|normal|relaxed|loose|[3-9]|10)|tracking-(?:tighter|tight|normal|wide|wider|widest)|font-(?:sans|serif|mono|thin|extralight|light|normal|medium|semibold|bold|extrabold|black))$/],
    ["tailwind-shape", /^(?:rounded(?:-(?:none|sm|md|lg|xl|[2-3]xl|full))?|border(?:-[trblxy])?(?:-(?:0|2|4|8))?|ring(?:-(?:0|1|2|4|8))?|outline(?:-(?:0|1|2|4|8))?)$/],
    ["tailwind-depth", /^(?:shadow(?:-(?:sm|md|lg|xl|2xl|inner|none))?|opacity-(?:0|5|10|15|20|25|30|40|50|60|70|75|80|90|95|100)|z-(?:0|10|20|30|40|50|auto)|blur(?:-(?:none|sm|md|lg|xl|2xl|3xl))?|backdrop-blur(?:-(?:none|sm|md|lg|xl|2xl|3xl))?)$/],
  ];
  let match;
  while ((match = attributePattern.exec(content)) && utilities.length < 6000) {
    const attribute = match[1];
    const start = match.index + match[0].indexOf(attribute);
    for (const tokenMatch of attribute.matchAll(/[^\s]+/g)) {
      const token = tokenMatch[0].replace(/^["'`{}]+|["'`{},]+$/g, "");
      const base = token.split(":").at(-1);
      const matched = utilityPatterns.find(([, pattern]) => pattern.test(base));
      if (!matched) continue;
      const index = start + (tokenMatch.index ?? 0);
      utilities.push({
        id: `raw-${sha(`${file}:${index}:${matched[0]}:${token}`)}`,
        kind: matched[0],
        value: token,
        file,
        line: lineNumberAt(content, index),
        evidence: normalizeEvidence(match[0]),
      });
    }
  }
  return utilities;
}

function attributeValue(attributes, name) {
  return attributes.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"))?.[1] ?? null;
}

function scanIconAssets(content, file, extension) {
  const assets = [];
  const add = (item, occurrence = assets.length) => assets.push({ id: `icon-${sha(`${file}:${occurrence}:${item.type}:${item.source ?? ""}`)}`, file, ...item });
  if (extension === ".svg") {
    const tag = content.match(/<svg\b([^>]*)>/i)?.[1] ?? "";
    add({
      type: "local-svg",
      source: file,
      line: 1,
      viewBox: attributeValue(tag, "viewBox"),
      width: attributeValue(tag, "width"),
      height: attributeValue(tag, "height"),
      strokeWidth: attributeValue(content, "stroke-width"),
      fill: attributeValue(content, "fill"),
      stroke: attributeValue(content, "stroke"),
    });
    return assets;
  }
  if (!SCRIPT_EXTENSIONS.has(extension)) return assets;

  const importPattern = /import\s+([\s\S]{1,240}?)\s+from\s+["']([^"']+)["']/g;
  let match;
  while ((match = importPattern.exec(content)) && assets.length < 1000) {
    const source = match[2];
    const isLibrary = ICON_LIBRARY.test(source);
    const isLocalSvg = /\.svg(?:\?[^"']*)?$/i.test(source);
    if (!isLibrary && !isLocalSvg) continue;
    const names = match[1].replace(/[{}]/g, "").split(",").map((name) => name.trim().split(/\s+as\s+/i).at(-1)).filter(Boolean).slice(0, 80);
    add({ type: isLibrary ? "icon-library" : "svg-import", source, line: lineNumberAt(content, match.index), names, count: Math.max(1, names.length) }, match.index);
  }

  const svgPattern = /<svg\b([^>]*)>/gi;
  while ((match = svgPattern.exec(content)) && assets.length < 1000) {
    const attributes = match[1];
    add({
      type: "inline-svg",
      source: "inline-svg",
      line: lineNumberAt(content, match.index),
      viewBox: attributeValue(attributes, "viewBox"),
      width: attributeValue(attributes, "width"),
      height: attributeValue(attributes, "height"),
      strokeWidth: attributeValue(attributes, "stroke-width") ?? attributeValue(attributes, "strokeWidth"),
      fill: attributeValue(attributes, "fill"),
      stroke: attributeValue(attributes, "stroke"),
      count: 1,
    }, match.index);
  }
  return assets;
}

function componentCandidate(relative, content) {
  const base = path.basename(relative).replace(/\.(?:[cm]?[jt]sx?|vue|svelte|astro)$/i, "");
  const normalized = base.replace(/[-_.]/g, "").toLowerCase();
  const primitive = PRIMITIVES.find((value) => normalized === value);
  if (!primitive) return null;
  const directory = path.posix.dirname(relative);
  const shared = /(?:^|\/)(?:components|ui|shared|packages)(?:\/|$)/i.test(relative);
  const importsSharedPrimitive = new RegExp(`\\b${primitive}\\b[\\s\\S]{0,240}from\\s*["'][^"']*(?:components|/ui)(?:[^"']*)["']`, "i").test(content)
    || new RegExp(`from\\s*["'][^"']*(?:components|/ui)(?:[^"']*)["'][\\s\\S]{0,240}\\b${primitive}\\b`, "i").test(content);
  return {
    id: `component-${sha(relative)}`,
    name: base,
    primitive,
    file: relative,
    directory,
    shared,
    overlay: OVERLAYS.has(primitive),
    role: importsSharedPrimitive ? "adapter" : "owner",
    roleReason: importsSharedPrimitive ? "Imports a same-named primitive from a shared component package" : "Exact primitive filename",
  };
}

export async function scanSources(collected) {
  const tokenDefinitions = [];
  const tokenReferences = [];
  const rawValues = [];
  const componentCandidates = [];
  const iconAssets = [];
  const nativeControls = [];
  const styleSignals = new Set();
  const unassessedAreas = new Set(collected.unassessedAreas);

  for (const file of collected.files) {
    let content;
    try {
      content = await readFile(file.absolute, "utf8");
    } catch {
      unassessedAreas.add(`Unreadable source files`);
      continue;
    }
    if (content.includes("\u0000")) {
      unassessedAreas.add("Binary-like files with supported extensions");
      continue;
    }

    const isTailwind = TAILWIND_PATH.test(file.relative);
    const definitionSource = TOKEN_PATH.test(file.relative) || isTailwind;
    if (STYLE_EXTENSIONS.has(file.extension)) {
      const css = scanCssDefinitions(content, file.relative);
      tokenDefinitions.push(...css.definitions);
      tokenReferences.push(...css.references);
      if (css.definitions.length) styleSignals.add("CSS Variables");
      if (/\.module\.(?:css|scss|sass|less)$/i.test(file.relative)) styleSignals.add("CSS Modules");
    } else if (file.extension === ".json" && definitionSource && path.basename(file.relative) !== "package.json") {
      tokenDefinitions.push(...scanJsonDefinitions(content, file.relative));
      styleSignals.add("JSON Tokens");
    } else if (SCRIPT_EXTENSIONS.has(file.extension) && definitionSource) {
      tokenDefinitions.push(...scanScriptDefinitions(content, file.relative, isTailwind));
      styleSignals.add(isTailwind ? "Tailwind Theme" : "JS/TS Theme");
    }

    rawValues.push(...scanRawValues(content, file.relative, file.extension, definitionSource));
    rawValues.push(...scanTailwindUtilities(content, file.relative, file.extension));
    iconAssets.push(...scanIconAssets(content, file.relative, file.extension));

    if (SCRIPT_EXTENSIONS.has(file.extension)) {
      const candidate = componentCandidate(file.relative, content);
      if (candidate) componentCandidates.push(candidate);
      const nativePattern = /<(button|input|textarea|select)\b/g;
      let nativeMatch;
      while ((nativeMatch = nativePattern.exec(content))) {
        nativeControls.push({
          id: `native-${sha(`${file.relative}:${nativeMatch.index}`)}`,
          element: nativeMatch[1],
          file: file.relative,
          line: lineNumberAt(content, nativeMatch.index),
          evidence: normalizeEvidence(content.slice(nativeMatch.index, nativeMatch.index + 180).split("\n")[0]),
        });
      }
    }
  }

  const definedNames = new Set(tokenDefinitions.map((item) => item.normalizedName));
  const unresolvedReferences = tokenReferences.filter((item) => !definedNames.has(item.normalizedName));

  if (styleSignals.has("JS/TS Theme")) unassessedAreas.add("Runtime-computed JS/TS theme values and conditional object spreads");
  unassessedAreas.add("Rendered CSS cascade, pseudo-state behavior, and browser-computed styles");
  unassessedAreas.add("Runtime focus, Portal, scroll-lock, and nested overlay behavior");

  return {
    tokenDefinitions,
    tokenReferences,
    unresolvedReferences,
    rawValues,
    componentCandidates,
    iconAssets,
    nativeControls,
    styleSignals: [...styleSignals].sort(),
    unassessedAreas: [...unassessedAreas].sort(),
  };
}
