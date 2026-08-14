import path from "node:path";
import { readFile } from "node:fs/promises";
import { readJson } from "./utils.mjs";

function countTopLevelAreas(files, prefix) {
  return new Set(
    files
      .map((file) => file.relative.split("/"))
      .filter((parts) => parts[0] === prefix && parts.length > 1)
      .map((parts) => parts[1]),
  ).size;
}

export async function discoverRepository(root, collected) {
  const packageFiles = collected.files.filter((file) => path.basename(file.relative) === "package.json");
  const packages = [];
  const dependencies = new Set();

  for (const file of packageFiles) {
    try {
      const manifest = await readJson(file.absolute);
      packages.push({
        file: file.relative,
        name: manifest.name ?? null,
        private: Boolean(manifest.private),
        scripts: Object.keys(manifest.scripts ?? {}).sort(),
      });
      for (const bucket of [manifest.dependencies, manifest.devDependencies, manifest.peerDependencies]) {
        for (const dependency of Object.keys(bucket ?? {})) dependencies.add(dependency);
      }
    } catch {
      packages.push({ file: file.relative, name: null, invalid: true, scripts: [] });
    }
  }

  const names = new Set(collected.files.map((file) => path.basename(file.relative)));
  const paths = collected.files.map((file) => file.relative);
  const frameworks = [];
  if (dependencies.has("next") || names.has("next.config.js") || names.has("next.config.mjs")) frameworks.push("Next.js");
  if (dependencies.has("react")) frameworks.push("React");
  if (dependencies.has("vite") || names.has("vite.config.ts") || names.has("vite.config.js")) frameworks.push("Vite");
  if (dependencies.has("vue")) frameworks.push("Vue");
  if (dependencies.has("svelte")) frameworks.push("Svelte");
  if (dependencies.has("astro")) frameworks.push("Astro");

  const styleSystems = [];
  if (paths.some((value) => /tailwind\.config\./.test(value)) || dependencies.has("tailwindcss")) styleSystems.push("Tailwind");
  if (collected.files.some((file) => [".css", ".scss", ".sass", ".less", ".pcss"].includes(file.extension))) styleSystems.push("Stylesheets");
  if (dependencies.has("styled-components")) styleSystems.push("styled-components");
  if (dependencies.has("@emotion/react") || dependencies.has("@emotion/styled")) styleSystems.push("Emotion");
  if (dependencies.has("@vanilla-extract/css")) styleSystems.push("vanilla-extract");

  let packageManager = "unknown";
  if (names.has("pnpm-lock.yaml")) packageManager = "pnpm";
  else if (names.has("yarn.lock")) packageManager = "yarn";
  else if (names.has("bun.lock") || names.has("bun.lockb")) packageManager = "bun";
  else if (names.has("package-lock.json")) packageManager = "npm";

  let gitCommit = null;
  try {
    gitCommit = (await readFile(path.join(root, ".git", "HEAD"), "utf8")).trim();
  } catch {
    // Worktrees and non-Git repositories are valid audit targets.
  }

  return {
    rootName: path.basename(path.resolve(root)),
    repoIdSeed: `${path.basename(path.resolve(root))}:${packages.map((item) => item.name ?? item.file).join("|")}`,
    packageManager,
    frameworks: [...new Set(frameworks)],
    styleSystems,
    packageCount: packages.length,
    appCount: countTopLevelAreas(collected.files, "apps"),
    workspacePackageCount: countTopLevelAreas(collected.files, "packages"),
    sourceFileCount: collected.files.filter((file) => !file.relative.endsWith("package.json")).length,
    packages,
    testEntrypoints: paths.filter((value) => /(?:vitest|jest|playwright|cypress)\.config\./.test(value)).sort(),
    ciEntrypoints: paths.filter((value) => /^\.github\/workflows\/.+\.ya?ml$/.test(value)).sort(),
    gitHead: gitCommit,
  };
}
