import { generatedAt, sha } from "./utils.mjs";

const STATES = ["default", "hover", "pressed", "focus", "selected", "disabled", "loading"];

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function text(zh, en) {
  return { zh, en };
}

function cleanRole(name) {
  return String(name ?? "")
    .replace(/^--/, "")
    .toLowerCase()
    .replace(/^(?:color|colour)-/, "")
    .replace(/(?:^|-)(?:dark|light)(?=-|$)/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

function roleState(name) {
  const state = STATES.find((item) => new RegExp(`(?:^|-)${item}(?:-|$)`).test(name));
  return state ?? "default";
}

function targetName(token) {
  const name = cleanRole(token.normalizedName);
  const state = roleState(name);
  const withoutState = name.replace(new RegExp(`(?:^|-)${state}(?:-|$)`), "-").replace(/-{2,}/g, "-").replace(/^-|-$/g, "");
  if (token.category === "color") {
    if (token.group === "background") {
      const role = withoutState.replace(/^(?:bg|background|color)-?/, "") || "surface";
      if (/(?:button|action|primary|secondary|tertiary)/.test(role)) return `--bg-action-${role.replace(/^(?:button|action)-?/, "")}-${state}`;
      return `--bg-${role}`;
    }
    if (token.group === "text") return `--text-${withoutState.replace(/^(?:text|content|foreground|color)-?/, "") || "primary"}`;
    if (token.group === "border") return `--stroke-${withoutState.replace(/^(?:border|stroke|outline|divider|ring)-?/, "") || "primary"}`;
    if (token.group === "icon-fill") return `--icon-${withoutState.replace(/^(?:icon|glyph|fill|stroke)-?/, "") || "primary"}`;
    if (token.group === "feedback") {
      const status = withoutState.match(/(?:success|positive|warning|caution|error|danger|critical|negative|info)/)?.[0] ?? "info";
      const property = token.properties.some((item) => /background/.test(item)) ? "surface"
        : token.properties.some((item) => /border|outline/.test(item)) ? "stroke"
          : token.properties.some((item) => /fill|stroke/.test(item)) ? "icon" : "content";
      return `--feedback-${status}-${property}`;
    }
    if (token.group === "brand-action") return `--bg-action-${withoutState.replace(/^(?:brand|action|color)-?/, "") || "primary"}-${state}`;
    return `--color-${withoutState || "neutral"}`;
  }
  const prefix = {
    typography: "font",
    spacing: "space",
    radius: "radius",
    shadow: "shadow",
    stroke: "stroke-width",
    opacity: "opacity",
    blur: "blur",
    layer: "layer",
    motion: "motion",
  }[token.category] ?? token.category;
  return `--${prefix}-${withoutState.replace(new RegExp(`^(?:${prefix}|color)-?`), "") || "default"}`;
}

function semanticQuality(token, target) {
  const current = token.name.startsWith("--") ? token.name.toLowerCase() : `--${token.normalizedName}`;
  return current === target ? "target-compatible" : "migration-needed";
}

export const STANDARD_TOKEN_FRAMEWORK = {
  model: "primitive -> semantic -> component",
  naming: "scope / property / role / hierarchy / state",
  modeRule: text("亮色和暗色是同一语义 Token 的模式映射，不写进 Token 名称。", "Light and dark are mode mappings of one semantic token, not separate token names."),
  layers: [
    { id: "primitive", label: text("原始值层", "Primitive"), purpose: text("保存色阶、尺寸和时长等无业务含义的原始值。", "Stores raw palettes, dimensions, and durations without product meaning.") },
    { id: "semantic", label: text("全局语义层", "Semantic"), purpose: text("用背景、文本、描边、图标、操作和反馈等角色表达设计意图。", "Expresses intent through background, text, stroke, icon, action, and feedback roles.") },
    { id: "component", label: text("组件映射层", "Component"), purpose: text("只在组件确有独立契约时建立，并映射到语义层。", "Created only for component-specific contracts and mapped to semantics.") },
  ],
  families: [
    { id: "background", roles: ["body", "surface", "elevated", "float", "dropdown", "inverse", "scrim-soft", "scrim-strong"] },
    { id: "text", roles: ["primary", "secondary", "tertiary", "placeholder", "disabled", "link", "inverse"] },
    { id: "stroke", roles: ["primary", "secondary", "strong", "disabled", "focus", "error"] },
    { id: "icon", roles: ["primary", "secondary", "tertiary", "disabled", "inverse", "brand", "status"] },
    { id: "action", roles: ["primary", "secondary", "tertiary"], states: STATES },
    { id: "feedback", roles: ["success", "warning", "error", "info"], properties: ["surface", "content", "icon", "stroke"] },
  ],
};

function targetTokens(library) {
  const byTarget = new Map();
  for (const token of library.tokens) {
    const name = targetName(token);
    if (!byTarget.has(name)) byTarget.set(name, {
      name,
      category: token.category,
      group: token.group,
      layer: "semantic",
      description: text(`治理后由 ${name} 表达该视觉角色。`, `${name} expresses this visual role after governance.`),
      modes: {},
      scopes: new Set(),
      states: new Set(),
      consumers: new Set(),
      sourceTokens: [],
      status: "proposed",
    });
    const item = byTarget.get(name);
    const mode = token.scope === "dark" ? "dark" : token.scope === "light" ? "light" : "default";
    if (!item.modes[mode]) item.modes[mode] = token.resolvedValue;
    item.scopes.add(token.scope);
    item.states.add(roleState(cleanRole(token.normalizedName)));
    for (const feature of token.usage?.features ?? []) item.consumers.add(feature);
    item.sourceTokens.push({ id: token.id, name: token.name, file: token.file, line: token.line });
  }
  return [...byTarget.values()].map((item) => ({
    ...item,
    scopes: [...item.scopes],
    states: [...item.states],
    consumers: [...item.consumers],
  })).sort((a, b) => a.name.localeCompare(b.name));
}

function lifecycleActions(library) {
  const actions = [];
  const assigned = new Set();
  const duplicateGroups = new Map();
  for (const token of library.tokens) {
    const key = `${targetName(token)}:${token.resolvedValue}:${token.scope === "dark" || token.scope === "light" ? token.scope : "default"}`;
    if (!duplicateGroups.has(key)) duplicateGroups.set(key, []);
    duplicateGroups.get(key).push(token);
  }
  for (const tokens of duplicateGroups.values()) {
    if (tokens.length < 2) continue;
    const groupUsage = tokens.reduce((total, item) => total + (item.usage?.totalReferenceCount ?? 0), 0);
    if (groupUsage === 0) {
      for (const token of tokens) assigned.add(token.id);
      actions.push({
        id: `lifecycle-${sha(`delete-group:${tokens.map((item) => item.id).sort().join(":")}`)}`,
        action: "delete",
        currentTokens: tokens.map((item) => ({ id: item.id, name: item.name, file: item.file, line: item.line })),
        targetToken: null,
        reason: text("这些定义指向同一目标语义和值，但扫描范围内都没有消费者；建议作为一组完成页面验证后删除。", "These definitions share one target semantic role and value but have no in-scope consumers; verify real pages and delete them as a group."),
        confidence: 0.62,
        usage: [],
        verification: "runtime-required",
      });
      continue;
    }
    const canonical = [...tokens].sort((a, b) => (b.usage?.totalReferenceCount ?? 0) - (a.usage?.totalReferenceCount ?? 0) || (a.scope === "global" ? -1 : 1) || a.file.localeCompare(b.file))[0];
    const sources = tokens.filter((item) => item.id !== canonical.id);
    for (const token of tokens) assigned.add(token.id);
    actions.push({
      id: `lifecycle-${sha(`merge:${tokens.map((item) => item.id).sort().join(":")}`)}`,
      action: "merge",
      currentTokens: sources.map((item) => ({ id: item.id, name: item.name, file: item.file, line: item.line })),
      targetToken: { id: canonical.id, name: canonical.name, file: canonical.file, line: canonical.line },
      reason: text("目标语义角色和解析值相同，建议收敛到引用更多、作用域更清晰的定义。", "Target semantic role and resolved value are identical; converge on the better-used, clearer-scope definition."),
      confidence: 0.92,
      usage: sources.flatMap((item) => item.usage?.features ?? []),
      verification: "source-confirmed",
    });
  }
  for (const token of library.tokens) {
    if (assigned.has(token.id)) continue;
    const usage = token.usage?.totalReferenceCount ?? 0;
    if (usage === 0) {
      actions.push({
        id: `lifecycle-${sha(`delete:${token.id}`)}`,
        action: "delete",
        currentTokens: [{ id: token.id, name: token.name, file: token.file, line: token.line }],
        targetToken: null,
        reason: text("扫描范围内没有直接或别名下游引用；删除前仍需用真实页面状态确认。", "No direct or downstream alias usage was found in scope; verify real page states before deletion."),
        confidence: 0.58,
        usage: [],
        verification: "runtime-required",
      });
      continue;
    }
    const target = targetName(token);
    if (semanticQuality(token, target) === "migration-needed") {
      actions.push({
        id: `lifecycle-${sha(`migrate:${token.id}:${target}`)}`,
        action: "migrate",
        currentTokens: [{ id: token.id, name: token.name, file: token.file, line: token.line }],
        targetToken: { name: target },
        reason: text("当前名称没有稳定表达属性、角色或状态；建议迁移到目标语义契约。", "The current name does not stably express property, role, or state; migrate to the target semantic contract."),
        confidence: 0.76,
        usage: token.usage?.features ?? [],
        verification: "source-confirmed",
      });
    }
  }
  const order = { merge: 0, migrate: 1, delete: 2 };
  return actions.sort((a, b) => order[a.action] - order[b.action] || b.confidence - a.confidence);
}

export function buildTokenContract(library) {
  const targets = targetTokens(library);
  const lifecycle = lifecycleActions(library);
  return {
    schemaVersion: 1,
    generatedAt: generatedAt(),
    project: library.project,
    status: "draft",
    authority: "Requires designer and product approval before source changes",
    framework: STANDARD_TOKEN_FRAMEWORK,
    targetTokens: targets,
    lifecycle,
    summary: {
      targetTokens: targets.length,
      migrate: lifecycle.filter((item) => item.action === "migrate").length,
      merge: lifecycle.filter((item) => item.action === "merge").length,
      delete: lifecycle.filter((item) => item.action === "delete").length,
      runtimeVerificationRequired: lifecycle.filter((item) => item.verification === "runtime-required").length,
    },
  };
}
