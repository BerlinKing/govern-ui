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
const PRIMITIVES = ["button", "iconbutton", "input", "textarea", "select", "checkbox", "radio", "switch", "dialog", "sheet", "popover", "dropdown", "toast", "tooltip", "formfield"];
const OVERLAYS = new Set(["dialog", "sheet", "popover", "dropdown", "toast", "tooltip"]);

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
        evidence: normalizeEvidence(lineText),
        ...extra,
      });
    }
  };

  addMatches(/#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab|color)\([^\n;]{3,120}\)/g, "color");
  addMatches(/(?:^|["'`\s])(?:-?)(?:bg|text|border|ring|outline|fill|stroke|p[trblxy]?|m[trblxy]?|gap|space-[xy]|w|min-w|max-w|h|min-h|max-h|top|right|bottom|left|inset|rounded|shadow|z|duration|delay|leading|tracking|grid-cols|grid-rows|translate-[xy]|scale|rotate|opacity)-\[[^\]\n]{1,100}\]/g, "arbitrary-tailwind");

  if (STYLE_EXTENSIONS.has(extension)) {
    addMatches(/\b(?:margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|gap|row-gap|column-gap|font-size|line-height|letter-spacing|border-radius|width|height|min-width|max-width|min-height|max-height)\s*:\s*-?(?:\d*\.)?\d+(?:px|rem|em|vw|vh|dvh|svh|lvh|%)\b/gi, "length");
    addMatches(/\b(?:transition-duration|animation-duration|transition)\s*:[^;\n]*\b\d+(?:ms|s)\b/gi, "motion");
    addMatches(/\bz-index\s*:\s*(-?\d{1,10})/gi, "z-index");
  } else if (SCRIPT_EXTENSIONS.has(extension)) {
    addMatches(/\bzIndex\s*[:=]\s*(-?\d{1,10})/g, "z-index");
  }

  return rawValues;
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
    nativeControls,
    styleSignals: [...styleSignals].sort(),
    unassessedAreas: [...unassessedAreas].sort(),
  };
}
