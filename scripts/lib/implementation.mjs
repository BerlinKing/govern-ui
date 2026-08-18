import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { createGovernanceSnapshot } from "./governance-snapshot.mjs";
import { extractStyleLibrary } from "./library.mjs";
import { collectFiles, generatedAt, readJson, relativePath, sha } from "./utils.mjs";

const execFileAsync = promisify(execFile);

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function lineAt(content, index) {
  return content.slice(0, index).split("\n").length;
}

function declarationMatches(content, tokenName) {
  const pattern = new RegExp(`(^[\\t ]*)${escapeRegExp(tokenName)}[\\t ]*:[\\t ]*[^;]+;`, "gm");
  return [...content.matchAll(pattern)].map((match) => ({
    index: match.index,
    line: lineAt(content, match.index),
    text: match[0],
  }));
}

function closestDeclaration(content, token) {
  const matches = declarationMatches(content, token.name);
  if (!matches.length) return null;
  return matches.sort((left, right) => Math.abs(left.line - token.line) - Math.abs(right.line - token.line))[0];
}

function replaceAt(content, index, length, replacement) {
  return `${content.slice(0, index)}${replacement}${content.slice(index + length)}`;
}

function renameDeclaration(content, token, targetName) {
  const match = closestDeclaration(content, token);
  if (!match) return { content, changed: false, reason: "source declaration not found" };
  const renamed = match.text.replace(token.name, targetName);
  return { content: replaceAt(content, match.index, match.text.length, renamed), changed: true };
}

function removeDeclaration(content, token) {
  const match = closestDeclaration(content, token);
  if (!match) return { content, changed: false, reason: "source declaration not found" };
  let start = match.index;
  let end = match.index + match.text.length;
  if (content[end] === "\n") end += 1;
  return { content: replaceAt(content, start, end - start, ""), changed: true };
}

function replaceReferences(content, currentName, targetName) {
  const pattern = new RegExp(`var\\(\\s*${escapeRegExp(currentName)}(?=\\s*[,\\)])`, "g");
  let replacements = 0;
  const next = content.replace(pattern, (match) => {
    replacements += 1;
    return match.replace(currentName, targetName);
  });
  return { content: next, replacements };
}

function referenceCount(contents, tokenName) {
  const pattern = new RegExp(`var\\(\\s*${escapeRegExp(tokenName)}(?=\\s*[,\\)])`, "g");
  let count = 0;
  for (const content of contents.values()) count += [...content.matchAll(pattern)].length;
  return count;
}

function approvedLifecycleIds(decisions) {
  const approvedBatches = new Set((decisions.batchApprovals ?? []).filter((item) => item.approved).map((item) => item.batchId));
  return new Set((decisions.tokenLifecycleDecisions ?? [])
    .filter((item) => item.approved === true || approvedBatches.has(item.batchId))
    .map((item) => item.lifecycleId));
}

function approvedDirectStyleDecisions(decisions) {
  const approvedBatches = new Set((decisions.batchApprovals ?? []).filter((item) => item.approved).map((item) => item.batchId));
  return (decisions.directStyleDecisions ?? []).filter((item) => item.approved === true || approvedBatches.has(item.batchId));
}

export function validateImplementationInputs(decisions, contract) {
  const errors = [];
  if (decisions?.schemaVersion !== 4) errors.push("decisions schemaVersion must be 4");
  if (decisions?.status !== "draft") errors.push("decisions status must remain draft; --write is the implementation authority");
  if (!Array.isArray(decisions?.tokenLifecycleDecisions)) errors.push("tokenLifecycleDecisions must be an array");
  if (decisions?.directStyleDecisions != null && !Array.isArray(decisions.directStyleDecisions)) errors.push("directStyleDecisions must be an array when present");
  if (contract?.schemaVersion !== 1) errors.push("token contract schemaVersion must be 1");
  if (contract?.status !== "draft") errors.push("token contract must remain draft until implementation");
  if (!Array.isArray(contract?.lifecycle)) errors.push("token contract lifecycle must be an array");
  const contractIds = new Set((contract?.lifecycle ?? []).map((item) => item.id));
  for (const item of decisions?.tokenLifecycleDecisions ?? []) {
    if (!contractIds.has(item.lifecycleId)) errors.push(`unknown lifecycle decision ${item.lifecycleId}`);
    if (!new Set(["migrate", "merge", "delete"]).has(item.action)) errors.push(`invalid lifecycle action ${item.action}`);
  }
  for (const item of decisions?.directStyleDecisions ?? []) {
    if (typeof item.directStyleId !== "string" || !item.directStyleId) errors.push("directStyleDecisions[].directStyleId is required");
    if (!new Set(["migrate", "scope", "create", "verify"]).has(item.action)) errors.push(`invalid direct style action ${item.action}`);
    if (item.action === "migrate" && !String(item.targetToken ?? "").startsWith("--")) errors.push(`direct style ${item.directStyleId} needs a CSS custom-property target`);
  }
  return { valid: errors.length === 0, errors };
}

async function gitState(repoRoot) {
  try {
    const [{ stdout: root }, { stdout: status }, { stdout: branch }] = await Promise.all([
      execFileAsync("git", ["-C", repoRoot, "rev-parse", "--show-toplevel"]),
      execFileAsync("git", ["-C", repoRoot, "status", "--porcelain"]),
      execFileAsync("git", ["-C", repoRoot, "branch", "--show-current"]),
    ]);
    return { isGit: true, root: root.trim(), dirty: status.trim().split("\n").filter(Boolean), branch: branch.trim() };
  } catch {
    return { isGit: false, root: null, dirty: [], branch: null };
  }
}

async function loadSource(repoRoot) {
  const files = await collectFiles(repoRoot);
  const contents = new Map();
  for (const file of files.files) contents.set(file.relative, await readFile(file.absolute, "utf8"));
  return contents;
}

function targetExists(contents, tokenName, excludingFile = null) {
  for (const [file, content] of contents) {
    if (file === excludingFile) continue;
    if (declarationMatches(content, tokenName).length) return true;
  }
  return false;
}

function mutateTokenAction(action, contents, options) {
  const changedFiles = new Set();
  const notes = [];
  let replacements = 0;
  if (action.action === "delete") {
    const remaining = action.currentTokens.reduce((sum, token) => sum + referenceCount(contents, token.name), 0);
    if (remaining) return { status: "blocked", reason: `${remaining} source references remain`, changedFiles: [], replacements: 0 };
    if (action.verification === "runtime-required" && !options.allowRuntimeDelete) {
      return { status: "blocked", reason: "runtime deletion gate is not approved; rerun with --allow-runtime-delete after Product C baseline coverage", changedFiles: [], replacements: 0 };
    }
    for (const token of action.currentTokens) {
      const content = contents.get(token.file);
      if (content == null) {
        notes.push(`${token.file}: source file not scanned`);
        continue;
      }
      const result = removeDeclaration(content, token);
      if (!result.changed) notes.push(`${token.file}:${token.line}: ${result.reason}`);
      else {
        contents.set(token.file, result.content);
        changedFiles.add(token.file);
      }
    }
    return { status: changedFiles.size ? "ready" : "blocked", reason: notes.join("; ") || "unused declarations qualified for removal", changedFiles: [...changedFiles], replacements };
  }

  const targetName = action.targetToken?.name;
  if (!targetName) return { status: "blocked", reason: "target Token is missing", changedFiles: [], replacements: 0 };
  for (const token of action.currentTokens) {
    if (token.name === targetName) {
      if (action.targetToken?.file && action.targetToken.file !== token.file && !options.allowCrossFileMerge) {
        notes.push(`${token.file}:${token.line}: same-name cross-file merge requires import/runtime proof`);
        continue;
      }
      if (action.targetToken?.file === token.file) {
        const result = removeDeclaration(contents.get(token.file) ?? "", token);
        if (result.changed) {
          contents.set(token.file, result.content);
          changedFiles.add(token.file);
        } else notes.push(`${token.file}:${token.line}: ${result.reason}`);
      } else if (options.allowCrossFileMerge && targetExists(contents, targetName, token.file)) {
        const result = removeDeclaration(contents.get(token.file) ?? "", token);
        if (result.changed) {
          contents.set(token.file, result.content);
          changedFiles.add(token.file);
        } else notes.push(`${token.file}:${token.line}: ${result.reason}`);
      } else notes.push(`${token.file}:${token.line}: no safe source rewrite is available`);
      continue;
    }

    for (const [file, content] of contents) {
      const result = replaceReferences(content, token.name, targetName);
      if (!result.replacements) continue;
      contents.set(file, result.content);
      replacements += result.replacements;
      changedFiles.add(file);
    }

    const source = contents.get(token.file);
    if (source == null) {
      notes.push(`${token.file}: source file not scanned`);
      continue;
    }
    const hasTargetInFile = declarationMatches(source, targetName).length > 0;
    const result = hasTargetInFile ? removeDeclaration(source, token) : renameDeclaration(source, token, targetName);
    if (!result.changed) notes.push(`${token.file}:${token.line}: ${result.reason}`);
    else {
      contents.set(token.file, result.content);
      changedFiles.add(token.file);
    }
  }
  const defined = targetExists(contents, targetName) || action.currentTokens.some((token) => declarationMatches(contents.get(token.file) ?? "", targetName).length);
  if (!defined) return { status: "blocked", reason: "target Token would remain undefined", changedFiles: [], replacements: 0 };
  return { status: changedFiles.size ? "ready" : "blocked", reason: notes.join("; ") || "definition and var() consumers can be migrated", changedFiles: [...changedFiles], replacements };
}

function styleExtension(file) {
  return new Set([".css", ".scss", ".sass", ".less", ".styl", ".stylus"]).has(path.extname(file).toLowerCase());
}

function replaceDirectStyleExample(content, example, sourceValues, targetName) {
  if (!example?.property) return { content, changed: false, reason: "CSS property evidence is missing" };
  const lines = content.split("\n");
  const expected = Math.max(0, Number(example.line || 1) - 1);
  const candidates = [...lines.keys()]
    .filter((index) => Math.abs(index - expected) <= 12)
    .sort((left, right) => Math.abs(left - expected) - Math.abs(right - expected));
  const propertyPattern = new RegExp(`(^|[;{]\\s*)${escapeRegExp(example.property)}\\s*:`, "i");
  for (const index of candidates) {
    const line = lines[index];
    if (!propertyPattern.test(line)) continue;
    const source = sourceValues.find((value) => line.includes(value));
    if (!source) {
      if (line.includes(`var(${targetName})`)) return { content, changed: false, alreadyApplied: true };
      continue;
    }
    lines[index] = line.replace(source, `var(${targetName})`);
    return { content: lines.join("\n"), changed: true };
  }
  return { content, changed: false, reason: `no exact ${example.property} declaration found near line ${example.line}` };
}

function mutateDirectStyleDecision(decision, contents) {
  if (decision.action !== "migrate") {
    return { status: "blocked", reason: `${decision.action} requires an approved target Token before source mutation`, changedFiles: [], replacements: 0, expectedOccurrences: decision.occurrences ?? 0 };
  }
  if (!targetExists(contents, decision.targetToken)) {
    return { status: "blocked", reason: `target Token ${decision.targetToken} is not defined after lifecycle changes`, changedFiles: [], replacements: 0, expectedOccurrences: decision.occurrences ?? 0 };
  }
  const changedFiles = new Set();
  const notes = [];
  let replacements = 0;
  for (const example of decision.examples ?? []) {
    if (!styleExtension(example.file)) {
      notes.push(`${example.file}:${example.line}: non-stylesheet syntax requires an adapter-aware migration`);
      continue;
    }
    const content = contents.get(example.file);
    if (content == null) {
      notes.push(`${example.file}: source file not scanned`);
      continue;
    }
    const result = replaceDirectStyleExample(content, example, decision.sourceValues ?? [], decision.targetToken);
    if (result.changed) {
      contents.set(example.file, result.content);
      changedFiles.add(example.file);
      replacements += 1;
    } else if (!result.alreadyApplied) notes.push(`${example.file}:${example.line}: ${result.reason}`);
  }
  const expectedOccurrences = Number(decision.occurrences ?? (decision.examples ?? []).length);
  if (!replacements) return { status: "blocked", reason: notes.slice(0, 8).join("; ") || "no exact stylesheet evidence could be rewritten", changedFiles: [], replacements: 0, expectedOccurrences };
  const status = replacements >= expectedOccurrences ? "ready" : "partial";
  const reason = status === "ready"
    ? `all ${replacements} evidenced declarations migrated`
    : `${replacements}/${expectedOccurrences} occurrences migrated; remaining syntax requires adapter-aware or refreshed evidence`;
  return { status, reason, changedFiles: [...changedFiles], replacements, expectedOccurrences, notes: notes.slice(0, 20) };
}

export async function planImplementation({ repoRoot, decisions, contract, allowRuntimeDelete = false, allowCrossFileMerge = false }) {
  const validation = validateImplementationInputs(decisions, contract);
  if (!validation.valid) throw new Error(validation.errors.join("; "));
  const original = await loadSource(repoRoot);
  const contents = new Map(original);
  const approved = approvedLifecycleIds(decisions);
  const decisionById = new Map(decisions.tokenLifecycleDecisions.map((item) => [item.lifecycleId, item]));
  const actions = [];
  for (const contractAction of contract.lifecycle) {
    if (!approved.has(contractAction.id)) continue;
    const decision = decisionById.get(contractAction.id);
    if (!decision || decision.action !== contractAction.action) {
      actions.push({ lifecycleId: contractAction.id, action: contractAction.action, status: "blocked", reason: "approved action differs from the Token contract", changedFiles: [], replacements: 0 });
      continue;
    }
    const beforeAction = new Map(contents);
    const result = mutateTokenAction(contractAction, contents, { allowRuntimeDelete, allowCrossFileMerge });
    if (result.status === "blocked") {
      contents.clear();
      for (const [file, content] of beforeAction) contents.set(file, content);
    }
    actions.push({ lifecycleId: contractAction.id, action: contractAction.action, target: contractAction.targetToken?.name ?? null, current: contractAction.currentTokens.map((item) => item.name), ...result });
  }
  for (const decision of approvedDirectStyleDecisions(decisions)) {
    const beforeAction = new Map(contents);
    const result = mutateDirectStyleDecision(decision, contents);
    if (result.status === "blocked") {
      contents.clear();
      for (const [file, content] of beforeAction) contents.set(file, content);
    }
    actions.push({ directStyleId: decision.directStyleId, foundationId: decision.foundationId, kind: "direct-style", action: decision.action, target: decision.targetToken ?? null, current: decision.sourceValues ?? [], ...result });
  }
  if (decisions.componentBuildDecision?.decision === "build") {
    actions.push({ componentBuildId: "starter-uikit", kind: "component-build", action: "build", status: "blocked", reason: "component source creation requires an approved owner path, anatomy, variants, states, and accessibility contract", changedFiles: [], replacements: 0 });
  }
  const changed = [...contents].filter(([file, content]) => content !== original.get(file)).map(([file, content]) => ({ file, content, beforeHash: sha(original.get(file)), afterHash: sha(content) }));
  return {
    schemaVersion: 1,
    generatedAt: generatedAt(),
    repoRoot: path.resolve(repoRoot),
    mode: "dry-run",
    approvedActions: approved.size + approvedDirectStyleDecisions(decisions).length,
    actions,
    changedFiles: changed.map(({ content, ...item }) => item),
    summary: {
      ready: actions.filter((item) => item.status === "ready").length,
      partial: actions.filter((item) => item.status === "partial").length,
      blocked: actions.filter((item) => item.status === "blocked").length,
      files: changed.length,
      replacements: actions.reduce((sum, item) => sum + item.replacements, 0),
    },
    _contents: changed,
  };
}

export async function implementGovernance({ repoRoot, decisionsFile, contractFile, outputDir, write = false, allowDirty = false, allowRuntimeDelete = false, allowCrossFileMerge = false }) {
  const absoluteRoot = path.resolve(repoRoot);
  const [decisions, contract, git, beforeLibrary] = await Promise.all([
    readJson(path.resolve(decisionsFile)),
    readJson(path.resolve(contractFile)),
    gitState(absoluteRoot),
    extractStyleLibrary(absoluteRoot),
  ]);
  if (write && !git.isGit) throw new Error("--write requires a Git repository for rollback safety");
  if (write && git.dirty.length && !allowDirty) throw new Error(`working tree is not clean: ${git.dirty.slice(0, 8).join(", ")}`);
  const plan = await planImplementation({ repoRoot: absoluteRoot, decisions, contract, allowRuntimeDelete, allowCrossFileMerge });
  const output = path.resolve(outputDir);
  await mkdir(output, { recursive: true });
  const beforeSnapshot = createGovernanceSnapshot(beforeLibrary);
  await writeFile(path.join(output, "govern-ui-before-snapshot.json"), `${JSON.stringify(beforeSnapshot, null, 2)}\n`, "utf8");
  const serializablePlan = { ...plan, _contents: undefined };
  await writeFile(path.join(output, "govern-ui-implementation-plan.json"), `${JSON.stringify(serializablePlan, null, 2)}\n`, "utf8");
  if (!write) return { plan: path.join(output, "govern-ui-implementation-plan.json"), beforeSnapshot: path.join(output, "govern-ui-before-snapshot.json"), summary: plan.summary, mode: "dry-run" };
  for (const item of plan._contents) await writeFile(path.join(absoluteRoot, item.file), item.content, "utf8");
  const afterLibrary = await extractStyleLibrary(absoluteRoot);
  const afterSnapshot = createGovernanceSnapshot(afterLibrary);
  const ledger = {
    ...serializablePlan,
    mode: "write",
    appliedAt: generatedAt(),
    git: { branch: git.branch, dirtyBefore: git.dirty },
    remaining: {
      tokens: afterLibrary.tokens.length,
      directStyles: afterLibrary.directStyles.length,
    },
  };
  await Promise.all([
    writeFile(path.join(output, "govern-ui-after-snapshot.json"), `${JSON.stringify(afterSnapshot, null, 2)}\n`, "utf8"),
    writeFile(path.join(output, "govern-ui-implementation-ledger.json"), `${JSON.stringify(ledger, null, 2)}\n`, "utf8"),
  ]);
  return {
    plan: path.join(output, "govern-ui-implementation-plan.json"),
    ledger: path.join(output, "govern-ui-implementation-ledger.json"),
    beforeSnapshot: path.join(output, "govern-ui-before-snapshot.json"),
    afterSnapshot: path.join(output, "govern-ui-after-snapshot.json"),
    summary: plan.summary,
    mode: "write",
  };
}
