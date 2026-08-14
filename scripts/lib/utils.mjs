import { createHash } from "node:crypto";
import { lstat, readdir, readFile } from "node:fs/promises";
import path from "node:path";

export const IGNORED_DIRECTORIES = new Set([
  ".agents",
  ".codex",
  ".git",
  ".github",
  ".next",
  ".nuxt",
  ".output",
  ".turbo",
  ".cache",
  ".parcel-cache",
  "node_modules",
  "dist",
  "build",
  "coverage",
  "docs",
  "doc",
  "examples",
  "example",
  "fixtures",
  "__fixtures__",
  "mocks",
  "__mocks__",
  "public",
  "static",
  "tests",
  "test",
  "__tests__",
  "vendor",
  "storybook-static",
]);

export const SCANNABLE_EXTENSIONS = new Set([
  ".css", ".scss", ".sass", ".less", ".pcss",
  ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
  ".json", ".vue", ".svelte", ".astro",
]);

const SENSITIVE_BASENAMES = /^(?:\.env(?:\..+)?|.*\.(?:pem|key|p12|pfx|crt|cer)|id_rsa.*)$/i;
const GENERATED_PATH = /(?:^|\/)(?:generated|__generated__|gen)(?:\/|$)|\.generated\./i;
const TEST_FILE_PATH = /(?:^|\/)[^/]+\.(?:test|spec|stories|story)\.(?:[cm]?[jt]sx?|css|scss|sass|less|pcss|vue|svelte|astro)$/i;

export function sha(value, length = 16) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, length);
}

export function toPosix(value) {
  return value.split(path.sep).join("/");
}

export function relativePath(root, file) {
  return toPosix(path.relative(root, file));
}

export function normalizeEvidence(value) {
  return String(value).replace(/\s+/g, " ").trim().slice(0, 240);
}

export function lineNumberAt(content, index) {
  let line = 1;
  for (let cursor = 0; cursor < index; cursor += 1) {
    if (content.charCodeAt(cursor) === 10) line += 1;
  }
  return line;
}

export function stableSort(items, selector = (item) => JSON.stringify(item)) {
  return [...items].sort((left, right) => selector(left).localeCompare(selector(right)));
}

export function generatedAt() {
  const epoch = process.env.SOURCE_DATE_EPOCH;
  if (epoch && Number.isFinite(Number(epoch))) {
    return new Date(Number(epoch) * 1000).toISOString();
  }
  return new Date().toISOString();
}

export async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

export async function collectFiles(root, options = {}) {
  const maxFiles = options.maxFiles ?? 20_000;
  const maxFileBytes = options.maxFileBytes ?? 1_500_000;
  const files = [];
  const skipped = [];
  const unassessedAreas = new Set();
  const rootReal = path.resolve(root);

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      if (files.length >= maxFiles) {
        unassessedAreas.add(`File limit reached (${maxFiles})`);
        return;
      }

      const absolute = path.join(directory, entry.name);
      const relative = relativePath(rootReal, absolute);

      if (entry.isDirectory()) {
        if (IGNORED_DIRECTORIES.has(entry.name)) {
          skipped.push({ file: relative, reason: "scope-excluded" });
          continue;
        }
        await visit(absolute);
        continue;
      }

      if (entry.isSymbolicLink()) {
        skipped.push({ file: relative, reason: "symlink" });
        continue;
      }

      if (!entry.isFile() || SENSITIVE_BASENAMES.test(entry.name)) {
        skipped.push({ file: relative, reason: "sensitive-or-unsupported" });
        continue;
      }

      const extension = path.extname(entry.name).toLowerCase();
      const manifestOrLockfile = new Set(["package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb"]).has(entry.name);
      if (TEST_FILE_PATH.test(relative)) {
        skipped.push({ file: relative, reason: "scope-excluded" });
        continue;
      }
      if ((!SCANNABLE_EXTENSIONS.has(extension) && !manifestOrLockfile) || GENERATED_PATH.test(relative)) {
        skipped.push({ file: relative, reason: GENERATED_PATH.test(relative) ? "generated" : "unsupported-extension" });
        continue;
      }

      const stat = await lstat(absolute);
      if (stat.size > maxFileBytes) {
        skipped.push({ file: relative, reason: "oversized" });
        unassessedAreas.add(`Oversized source files above ${maxFileBytes} bytes`);
        continue;
      }

      files.push({ absolute, relative, extension, size: stat.size });
    }
  }

  await visit(rootReal);
  return {
    files,
    skipped,
    unassessedAreas: [...unassessedAreas].sort(),
  };
}

export function inferTokenKind(name, value = "") {
  const haystack = `${name} ${value}`.toLowerCase();
  if (/(?:#(?:[0-9a-f]{3,8})\b|\brgba?\(|\bhsla?\(|\boklch\(|\bcolor\()/.test(value.toLowerCase()) || /color|background|foreground|surface|text|border|fill|stroke|accent/.test(haystack)) return "color";
  if (/font|type|line-height|letter|tracking/.test(haystack)) return "typography";
  if (/radius|rounded|corner/.test(haystack)) return "radius";
  if (/shadow|elevation/.test(haystack)) return "shadow";
  if (/duration|easing|motion|transition|spring|damping|stiffness/.test(haystack)) return "motion";
  if (/z-index|layer|overlay/.test(haystack)) return "layer";
  if (/space|spacing|gap|margin|padding|inset|width|height|size/.test(haystack)) return "spacing";
  return "other";
}

export function normalizedTokenName(name) {
  return String(name)
    .replace(/^--/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[._/\s]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

export function normalizedTokenValue(value) {
  return String(value).trim().replace(/\s+/g, " ").replace(/;$/, "").toLowerCase();
}
