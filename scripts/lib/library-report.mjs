import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderArtifact, applyArtifactTheme, ensureArtifactEntries } from './artifact-theme.mjs';

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeScriptJson(value) {
  return JSON.stringify(value).replace(/<\/script/gi, "<\\/script").replace(/<!--/g, "<\\!--");
}

export function librarySummary(library) {
  return [
    `GovernUI Atomic Style Library — ${library.project.name}`,
    `Tokens: ${library.summary.tokens} (${library.summary.cssVariables} CSS variables)`,
    `Aliases resolved: ${library.summary.resolvedAliases}`,
    `Icons: ${library.summary.icons}`,
    `Direct style values: ${library.summary.directValues}`,
    `Source files: ${library.summary.sourceFiles}`,
  ].join("\n");
}

export async function writeStyleLibrary(library, outputDirectory) {
  const output = path.resolve(outputDirectory);
  await mkdir(output, { recursive: true });
  const templatePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../assets/style-library-template.html");
  const template = await readFile(templatePath, "utf8");
  const html = template
    .replaceAll("{{LIBRARY_TITLE}}", escapeHtml(`GovernUI Atomic Style Library — ${library.project.name}`))
    .replace("{{LIBRARY_JSON}}", safeScriptJson(library));
  const file = path.join(output, "scan.html");
  const rendered = await renderArtifact('A', library);
  await writeFile(file, rendered, "utf8");
  await writeFile(path.join(output,'style-library.html'), rendered, 'utf8');
  await writeFile(path.join(output,'style-library-detail.html'), await applyArtifactTheme(html,'A'), 'utf8');
  await writeFile(path.join(output,'scan-data.json'), JSON.stringify(library,null,2)+'\n');
  await ensureArtifactEntries(output);
  return { html: file, detail: path.join(output,'style-library-detail.html') };
}
