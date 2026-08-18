import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compareGovernanceSnapshots } from "./governance-snapshot.mjs";

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function safeScriptJson(value) {
  return JSON.stringify(value).replace(/<\/script/gi, "<\\/script").replace(/<!--/g, "<\\!--");
}

function mime(file) {
  return { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml" }[path.extname(file).toLowerCase()] ?? "application/octet-stream";
}

async function imageData(value, baseDirectory) {
  if (!value) return null;
  if (/^data:image\//.test(value)) return value;
  const absolute = path.isAbsolute(value) ? value : path.resolve(baseDirectory, value);
  try {
    return `data:${mime(absolute)};base64,${(await readFile(absolute)).toString("base64")}`;
  } catch {
    return null;
  }
}

export async function createVisualRegression(before, after, manifest, manifestDirectory = process.cwd()) {
  const captures = [];
  for (const [index, capture] of (manifest.captures ?? []).entries()) {
    const beforeImage = await imageData(capture.beforeImage, manifestDirectory);
    const afterImage = await imageData(capture.afterImage, manifestDirectory);
    captures.push({
      id: capture.id || `capture-${index + 1}`,
      feature: capture.feature || "Unassigned feature",
      page: capture.page || capture.route || "Unassigned page",
      route: capture.route ?? null,
      state: capture.state || "default",
      viewport: capture.viewport || "unspecified",
      theme: capture.theme || "default",
      beforeImage,
      afterImage,
      affectedTokens: capture.affectedTokens ?? [],
      expectedChange: capture.expectedChange ?? null,
      sourceEvidence: capture.sourceEvidence ?? [],
      status: beforeImage && afterImage ? (capture.status || "needs-review") : "unverified",
      limitation: beforeImage && afterImage ? null : "Before or after screenshot is missing or unreadable",
    });
  }
  const sourceDiff = compareGovernanceSnapshots(before, after);
  return {
    schemaVersion: 1,
    project: before.project,
    generatedAt: new Date().toISOString(),
    status: "draft",
    sourceDiff,
    captures,
    coverage: {
      total: captures.length,
      reviewable: captures.filter((item) => item.beforeImage && item.afterImage).length,
      unverified: captures.filter((item) => item.status === "unverified").length,
      features: [...new Set(captures.map((item) => item.feature))],
      pages: [...new Set(captures.map((item) => item.page))],
      states: [...new Set(captures.map((item) => item.state))],
      viewports: [...new Set(captures.map((item) => item.viewport))],
      themes: [...new Set(captures.map((item) => item.theme))],
    },
  };
}

export async function writeVisualRegression(regression, outputDirectory) {
  const output = path.resolve(outputDirectory);
  await mkdir(output, { recursive: true });
  const templatePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../assets/visual-regression-template.html");
  const template = await readFile(templatePath, "utf8");
  const presentation = { ...regression, sourceDiff: { summary: regression.sourceDiff.summary } };
  const html = template
    .replaceAll("{{REGRESSION_TITLE}}", escapeHtml(`GovernUI Visual Regression — ${regression.project?.name ?? "Project"}`))
    .replace("{{REGRESSION_JSON}}", safeScriptJson(presentation));
  const files = {
    html: path.join(output, "visual-regression.html"),
    json: path.join(output, "governance-diff.json"),
  };
  await Promise.all([
    writeFile(files.html, html, "utf8"),
    writeFile(files.json, `${JSON.stringify(regression.sourceDiff, null, 2)}\n`, "utf8"),
  ]);
  return files;
}
