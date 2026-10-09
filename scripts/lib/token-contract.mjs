import { generatedAt, sha } from "./utils.mjs";
import { colorAlpha, inferTokenSemanticFingerprint, modeCandidateScore, semanticTargetsCompatible, targetFamily } from "./semantic-context.mjs";

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

function colorProperty(token) {
  const name = cleanRole(token.normalizedName);
  const properties = token.properties ?? [];
  if (token.group === "feedback") {
    if (properties.some((item) => /background/.test(item)) || /(?:bg|background|surface)/.test(name)) return "surface";
    if (properties.some((item) => /border|outline/.test(item)) || /(?:border|stroke|outline)/.test(name)) return "stroke";
    if (properties.some((item) => /fill|stroke/.test(item)) || /(?:icon|glyph)/.test(name)) return "icon";
    return "content";
  }
  if (properties.some((item) => /background/.test(item))) return "background";
  if (properties.some((item) => /border|outline/.test(item))) return "stroke";
  if (properties.some((item) => /fill|stroke/.test(item))) return "icon";
  return "content";
}

function semanticRole(name, roles, fallback) {
  return roles.find((role) => new RegExp(`(?:^|-)${role}(?:-|$)`).test(name)) ?? fallback;
}

function inferredColorGroup(token, name) {
  if (token.group !== "other") return token.group;
  if (/(?:success|positive|warning|caution|error|danger|critical|negative|info)/.test(name)) return "feedback";
  if (/(?:border|stroke|outline|ring|divider|grid-line|line-[0-9])/.test(name)) return "border";
  if (/(?:text|foreground|content|placeholder|resource)/.test(name)) return "text";
  if (/(?:icon|glyph)/.test(name)) return "icon-fill";
  if (/(?:background|surface|(?:^|-)bg(?:-|$)|glass|muted|transparency|overlay|mask|scrim|input)/.test(name)) return "background";
  if (/(?:primary|secondary|tertiary|accent|brand|destructive|active|hover|selected)/.test(name)) return "brand-action";
  return token.group;
}

function colorTargetName(token) {
  const ownName = cleanRole(token.normalizedName);
  const name = cleanRole([token.normalizedName, token.value, token.resolvedValue].filter(Boolean).join("-"));
  const group = inferredColorGroup(token, name);
  const classified = { ...token, group };
  const state = roleState(name);
  const status = semanticRole(name, ["success", "positive", "warning", "caution", "error", "danger", "critical", "negative", "info"], "info")
    .replace(/positive/, "success").replace(/caution/, "warning").replace(/danger|critical|negative/, "error");

  const shadowSize = name.match(/(?:^|-)shadow-(sm|md|lg|xl)(?:-|$)/)?.[1];
  if (group === "other" && shadowSize) return `--color-scoped-shadow-${shadowSize}`;

  if (group === "feedback") return `--feedback-${status}-${colorProperty(classified)}`;

  if (group === "data-visualization") {
    const role = name.match(/(?:series|data|chart|categorical|sequential|diverging)-?([a-z0-9]+)?/)?.[1] ?? "primary";
    return `--data-${role}`;
  }

  if (group === "text") {
    if (/(?:success|positive|warning|caution|error|danger|critical|negative|info)/.test(name)) return `--feedback-${status}-content`;
    const role = semanticRole(name, ["placeholder", "disabled", "tertiary", "secondary", "inverse", "link", "primary"], /(?:muted|subtle|caption|description|hint)/.test(name) ? "secondary" : "primary");
    return `--text-${role}`;
  }

  if (group === "border") {
    const role = /(?:focus|ring)/.test(name) ? "focus"
      : /(?:error|danger|critical|invalid)/.test(name) ? "error"
        : /disabled/.test(name) ? "disabled"
          : /(?:strong|emphasis)/.test(name) ? "strong"
            : /(?:subtle|secondary|divider|hairline)/.test(name) ? "subtle" : "default";
    return `--stroke-${role}`;
  }

  if (group === "icon-fill") {
    const role = semanticRole(name, ["disabled", "tertiary", "secondary", "inverse", "brand", "primary"], /(?:muted|subtle)/.test(name) ? "secondary" : "primary");
    return `--icon-${role}`;
  }

  if (group === "brand-action") {
    const variant = /(?:error|danger|critical|destructive)/.test(name) ? "danger"
      : semanticRole(name, ["secondary", "tertiary", "primary"], /(?:accent|brand|commercial|link)/.test(name) ? "primary" : "primary");
    const property = colorProperty(classified) === "background" ? "bg" : colorProperty(classified);
    return `--action-${variant}-${property}${state === "default" ? "" : `-${state}`}`;
  }

  if (group === "background") {
    if (/(?:success|positive|warning|caution|error|danger|critical|negative|info)/.test(name)) return `--feedback-${status}-surface`;
    if (/(?:primary|secondary|tertiary|accent|brand|action|button)/.test(name)) {
      const variant = /secondary/.test(name) ? "secondary" : /tertiary/.test(name) ? "tertiary" : "primary";
      return `--action-${variant}-bg${state === "default" ? "" : `-${state}`}`;
    }
    const role = /(?:overlay|mask|scrim)/.test(name) ? "overlay"
      : /(?:popover|dropdown|menu|float|modal|dialog|elevated)/.test(name) ? "elevated"
        : /canvas/.test(name) ? "canvas"
          : /(?:card|panel|container|surface)/.test(name) ? "surface"
            : /(?:alt|subtle)/.test(name) ? "subtle" : "body";
    return `--bg-${role}`;
  }

  return `--color-scoped-${ownName || "unclassified"}`;
}

function targetName(token) {
  const name = cleanRole(token.normalizedName);
  const state = roleState(name);
  const withoutState = name.replace(new RegExp(`(?:^|-)${state}(?:-|$)`), "-").replace(/-{2,}/g, "-").replace(/^-|-$/g, "");
  const semantic = token.semantic ?? inferTokenSemanticFingerprint(token);
  if (semantic.targetName && ["background", "action", "brand", "text", "icon", "stroke", "feedback", "canvas"].includes(semantic.fingerprint?.family)) return semantic.targetName;
  if (token.category === "color") return null;
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

function semanticCopy(name) {
  const definitions = [
    [/^--bg-body$/, text("应用最底层的页面背景。", "Base background for application pages."), text("页面背景需要独立于卡片和浮层，主题切换时才能统一调整。", "The page canvas must remain independent from cards and overlays so themes can change coherently.")],
    [/^--bg-surface$/, text("承载卡片、面板和主要内容区域。", "Surface for cards, panels, and primary content regions."), text("多个内容容器承担相同层级，需要共享一个稳定表面语义。", "Multiple content containers share the same elevation role and need one stable surface semantic.")],
    [/^--bg-elevated$/, text("承载菜单、弹窗和其他浮起界面。", "Surface for menus, dialogs, and other elevated UI."), text("浮层必须与普通面板分离，才能保持层级和主题对比。", "Elevated UI must remain separate from ordinary surfaces to preserve hierarchy and theme contrast.")],
    [/^--bg-scrim(?:-(?:soft|strong))?$/, text("覆盖页面内容的半透明蒙层。", "Translucent scrim placed over page content."), text("蒙层必须由 Backdrop、Mask 或 Overlay 消费者证据建立，并保持透明度；不允许用普通不透明背景代替。", "A scrim requires Backdrop, Mask, or Overlay consumer evidence and must preserve translucency; an ordinary opaque background is not a valid substitute.")],
    [/^--text-primary$/, text("主要正文和最高阅读优先级文字。", "Primary body copy and highest-priority readable text."), text("建立稳定的主要阅读层级，避免组件各自选择最深文字色。", "Creates a stable primary reading level instead of letting components choose their own darkest text.")],
    [/^--text-secondary$/, text("说明、元信息和次要内容文字。", "Supporting copy, metadata, and secondary content."), text("次要信息需要统一弱化程度，保持跨页面层级一致。", "Secondary information needs one consistent de-emphasis level across pages.")],
    [/^--text-tertiary$/, text("低优先级提示和补充信息。", "Low-priority hints and supplementary information."), text("当项目真实存在第三阅读层级时，用独立语义避免与禁用态混淆。", "When a real third reading level exists, a distinct semantic prevents confusion with disabled content.")],
    [/^--text-placeholder$/, text("输入控件的占位提示文字。", "Placeholder copy inside input controls."), text("占位文字有独立可访问性和输入状态职责，不能等同普通次要文字。", "Placeholder text has distinct accessibility and input-state responsibilities and should not equal ordinary secondary copy.")],
    [/^--text-disabled$/, text("不可操作内容的文字。", "Text for unavailable or disabled content."), text("禁用态表达交互不可用，需要与普通弱化信息分离。", "Disabled content communicates unavailable interaction and must remain distinct from ordinary de-emphasis.")],
    [/^--stroke-default$/, text("控件和容器的默认边界。", "Default boundary for controls and containers."), text("统一普通描边，减少每个组件自行选择边界颜色。", "Unifies ordinary boundaries instead of letting each component choose a border color.")],
    [/^--stroke-focus$/, text("键盘焦点和当前操作位置的强调描边。", "Emphasis stroke for keyboard focus and current interaction."), text("焦点需要稳定且可访问的视觉信号，不能依赖普通边框。", "Focus requires a stable accessible signal and cannot depend on the ordinary border.")],
    [/^--icon-primary$/, text("主要功能图标颜色。", "Primary functional icon color."), text("图标与文字承担不同视觉面积，需要独立控制对比度。", "Icons occupy a different visual area than text and need independent contrast control.")],
    [/^--bg-/, text("页面或界面容器的背景层级。", "A background level for a page or UI container."), text("源码中存在独立的背景用途；用明确层级避免页面、面板和浮层互相复用颜色。", "Source evidence shows a distinct surface role; an explicit level prevents pages, panels, and overlays from reusing colors accidentally.")],
    [/^--text-/, text("指定阅读层级或状态的文字颜色。", "Text color for a specific reading level or state."), text("源码中存在独立的文字职责；语义名称让层级和可用状态保持一致。", "Source evidence shows a distinct text responsibility; a semantic name keeps hierarchy and availability states consistent.")],
    [/^--stroke-/, text("指定层级或状态的边界颜色。", "Boundary color for a specific level or state."), text("描边承担分隔、强调或状态表达，不能只按色值与背景合并。", "Strokes communicate separation, emphasis, or state and cannot be merged with backgrounds by value alone.")],
    [/^--icon-/, text("指定层级或状态的功能图标颜色。", "Functional icon color for a specific level or state."), text("图标需要独立于文字控制对比度，并在交互状态中保持一致。", "Icons need contrast control independent from text and consistent interaction states.")],
    [/^--action-/, text("可交互操作在指定状态下的颜色。", "Color for an interactive action in a specific state."), text("仅为项目真实存在的操作和状态建立 Token，统一默认、悬浮、按下和禁用反馈。", "Creates tokens only for observed actions and states, aligning default, hover, pressed, and disabled feedback.")],
    [/^--brand-/, text("品牌识别或非控件型品牌强调色。", "Brand identity or non-control brand emphasis color."), text("品牌色与交互状态、普通表面分开，避免品牌强调被误并入背景层级。", "Separates brand emphasis from interaction states and ordinary surfaces so brand identity is not collapsed into background hierarchy.")],
    [/^--feedback-/, text("成功、警告、错误或信息反馈的指定视觉属性。", "A visual property for success, warning, error, or informational feedback."), text("反馈色需要跨背景、文字、图标和描边保持语义一致。", "Feedback meaning must remain consistent across surfaces, text, icons, and strokes.")],
    [/^--data-/, text("用于图表或数据序列的区分颜色。", "Distinguishing color for charts or data series."), text("数据颜色承担编码信息的职责，必须与装饰色和品牌色分开治理。", "Data colors encode information and must be governed separately from decoration and brand color.")],
  ];
  const match = definitions.find(([pattern]) => pattern.test(name));
  return match ? { description: match[1], rationale: match[2] } : {
    description: text("项目特定范围内的颜色语义。", "A color semantic scoped to a project-specific surface."),
    rationale: text("现有源码存在明确但暂时无法归入全局角色的用途；先保留作用域，避免污染共享体系。", "Source evidence shows a distinct use that does not yet fit a global role; keep it scoped to avoid polluting the shared system."),
  };
}

function semanticQuality(token, target) {
  if (!target) return "unresolved";
  const current = token.name.startsWith("--") ? token.name.toLowerCase() : `--${token.normalizedName}`;
  return current === target ? "target-compatible" : "migration-needed";
}

function targetGroup(name, fallback) {
  if (!name) return fallback;
  if (name.startsWith("--bg-")) return "background";
  if (name.startsWith("--text-")) return "text";
  if (name.startsWith("--stroke-")) return "border";
  if (name.startsWith("--icon-")) return "icon-fill";
  if (name.startsWith("--action-")) return "brand-action";
  if (name.startsWith("--brand-")) return "brand";
  if (name.startsWith("--feedback-")) return "feedback";
  if (name.startsWith("--data-")) return "data-visualization";
  return fallback;
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
    { id: "background", roles: ["body", "surface", "elevated", "scrim-soft", "scrim", "scrim-strong"] },
    { id: "text", roles: ["primary", "secondary", "tertiary", "placeholder", "disabled", "link", "inverse"] },
    { id: "stroke", roles: ["primary", "secondary", "strong", "disabled", "focus", "error"] },
    { id: "icon", roles: ["primary", "secondary", "tertiary", "disabled", "inverse", "brand", "status"] },
    { id: "action", roles: ["primary", "secondary", "tertiary"], states: STATES },
    { id: "brand", roles: ["primary", "primary-subtle", "commercial"], properties: ["surface", "content", "icon"] },
    { id: "feedback", roles: ["success", "warning", "error", "info"], properties: ["surface", "content", "icon", "stroke"] },
  ],
};

function targetTokens(library) {
  const byTarget = new Map();
  for (const token of library.tokens) {
    const semantic = token.semantic ?? inferTokenSemanticFingerprint(token);
    const name = targetName(token);
    if (!name) continue;
    if (token.role === "adapter" || (token.category === "color" && semantic.consumerEvidenceCount < 1)) continue;
    const copy = token.category === "color" ? semanticCopy(name) : {
      description: text(`治理后由 ${name} 表达该视觉角色。`, `${name} expresses this visual role after governance.`),
      rationale: text("由当前项目的真实定义和使用位置归纳。", "Derived from current project definitions and observed product usage."),
    };
    if (!byTarget.has(name)) byTarget.set(name, {
      name,
      category: token.category,
      group: targetGroup(name, token.group),
      layer: "semantic",
      description: copy.description,
      rationale: copy.rationale,
      modes: {},
      modeCandidates: {},
      scopes: new Set(),
      states: new Set(),
      consumers: new Set(),
      sourceTokens: [],
      semanticEvidence: [],
      status: "source-backed",
    });
    const item = byTarget.get(name);
    const mode = token.scope === "dark" ? "dark" : token.scope === "light" ? "light" : "default";
    if (!item.modeCandidates[mode]) item.modeCandidates[mode] = new Map();
    const value = token.resolvedValue ?? token.value;
    const alpha = colorAlpha(value);
    if (!/^--bg-scrim/.test(name) || alpha == null || alpha < 0.999) {
      if (!item.modeCandidates[mode].has(value)) item.modeCandidates[mode].set(value, { value, score: 0, sources: [] });
      const candidate = item.modeCandidates[mode].get(value);
      candidate.score += modeCandidateScore(token, semantic, name);
      candidate.sources.push({ id: token.id, name: token.name, file: token.file, line: token.line, confidence: semantic.confidence });
    }
    item.scopes.add(token.scope);
    item.states.add(semantic.fingerprint?.state ?? roleState(cleanRole(token.normalizedName)));
    for (const feature of token.usage?.features ?? []) item.consumers.add(feature);
    item.sourceTokens.push({ id: token.id, name: token.name, file: token.file, line: token.line, semantic });
    item.semanticEvidence.push(...(semantic.evidence ?? []));
  }
  return [...byTarget.values()].map((item) => {
    const rankedModes = Object.fromEntries(Object.entries(item.modeCandidates).map(([mode, values]) => [mode, [...values.values()].sort((left, right) => right.score - left.score || left.value.localeCompare(right.value))]));
    const modes = Object.fromEntries(Object.entries(rankedModes).filter(([, values]) => values.length).map(([mode, values]) => [mode, values[0].value]));
    const modeCandidates = Object.fromEntries(Object.entries(rankedModes).map(([mode, values]) => [mode, values.map((candidate) => candidate.value)]));
    const modeEvidence = Object.fromEntries(Object.entries(rankedModes).map(([mode, values]) => [mode, values]));
    const semanticConflicts = item.sourceTokens.filter((source) => source.semantic.conflicts?.length || source.semantic.confidenceLevel === "manual-review");
    const needsDecision = Object.values(modeCandidates).some((values) => values.length > 1) || semanticConflicts.length > 0 || !Object.keys(modes).length;
    return {
      ...item,
      group: targetFamily(item.name, item.group),
      modes,
      modeCandidates,
      modeEvidence,
      scopes: [...item.scopes],
      states: [...item.states],
      consumers: [...item.consumers],
      semanticEvidence: item.semanticEvidence.slice(0, 40),
      status: needsDecision ? "source-suggested" : "source-confirmed",
      evidenceSummary: text(
        `由 ${item.sourceTokens.length} 个消费者上下文兼容的定义归并，覆盖 ${item.consumers.size} 个已识别功能位置。`,
        `Consolidates ${item.sourceTokens.length} consumer-compatible definitions across ${item.consumers.size} identified product locations.`,
      ),
      needsDecision,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

function lifecycleActions(library) {
  const actions = [];
  const assigned = new Set();
  const duplicateGroups = new Map();
  const ownerScope = (file) => String(file ?? "").match(/^(apps\/[^/]+|packages\/[^/]+|services\/[^/]+)/)?.[1] ?? String(file ?? "").split("/")[0] ?? "repository";
  const semanticFor = (token) => token.semantic ?? inferTokenSemanticFingerprint(token);
  for (const token of library.tokens) {
    const semantic = semanticFor(token);
    const target = targetName(token);
    if (!target || token.role === "adapter" || (token.category === "color" && semantic.confidence < 0.7)) continue;
    const key = `${ownerScope(token.file)}:${target}:${token.resolvedValue}:${token.scope === "dark" || token.scope === "light" ? token.scope : "default"}`;
    if (!duplicateGroups.has(key)) duplicateGroups.set(key, []);
    duplicateGroups.get(key).push(token);
  }
  for (const tokens of duplicateGroups.values()) {
    if (tokens.length < 2) continue;
    const firstSemantic = semanticFor(tokens[0]);
    if (!tokens.every((token) => semanticTargetsCompatible(firstSemantic, semanticFor(token)))) continue;
    const groupUsage = tokens.reduce((total, item) => total + (item.usage?.totalReferenceCount ?? 0), 0);
    if (groupUsage === 0) {
      for (const token of tokens) assigned.add(token.id);
      actions.push({
        id: `lifecycle-${sha(`delete-group:${tokens.map((item) => item.id).sort().join(":")}`)}`,
        action: "delete",
        currentTokens: tokens.map((item) => ({ id: item.id, name: item.name, file: item.file, line: item.line })),
        targetToken: null,
        reason: text("这些同一 owner 下的定义具有一致语义指纹和值，但扫描范围内都没有消费者；完成运行时与试删除检查后删除。", "These same-owner definitions share a semantic fingerprint and value but have no in-scope consumers; delete after runtime and trial-removal checks."),
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
      reason: text("同一 owner 下的消费者语义指纹、模式和值一致，建议收敛到引用更多、作用域更清晰的定义。", "Consumer semantics, mode, and value match under one owner; converge on the better-used, clearer-scope definition."),
      confidence: Math.min(0.94, Math.max(...tokens.map((token) => semanticFor(token).confidence))),
      usage: sources.flatMap((item) => item.usage?.features ?? []),
      verification: "source-confirmed",
    });
  }
  for (const token of library.tokens) {
    if (assigned.has(token.id)) continue;
    const usage = token.usage?.totalReferenceCount ?? 0;
    const semantic = semanticFor(token);
    const target = targetName(token);
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
    if (!target) {
      actions.push({
        id: `lifecycle-${sha(`review:${token.id}`)}`,
        action: "migrate",
        currentTokens: [{ id: token.id, name: token.name, file: token.file, line: token.line }],
        targetToken: null,
        reason: text("发现真实消费者，但上下文指向多个语义或缺少足够的层级证据；暂不生成目标 Token。", "Real consumers were found, but their contexts imply multiple semantics or lack sufficient layer evidence; no target Token is generated yet."),
        confidence: semantic.confidence,
        usage: token.usage?.features ?? [],
        verification: "semantic-review-required",
        semantic,
      });
      continue;
    }
    if (semanticQuality(token, target) === "migration-needed") {
      actions.push({
        id: `lifecycle-${sha(`migrate:${token.id}:${target}`)}`,
        action: "migrate",
        currentTokens: [{ id: token.id, name: token.name, file: token.file, line: token.line }],
        targetToken: { name: target },
        reason: token.role === "adapter"
          ? text("这是适配层定义；保留适配职责，但让它引用消费者上下文确认后的目标语义 Token。", "This is an adapter definition; preserve the adapter role while pointing it to the consumer-confirmed semantic Token.")
          : text("消费者上下文已识别属性、角色和状态；建议迁移到对应目标语义。", "Consumer context identifies the property, role, and state; migrate to the corresponding semantic target."),
        confidence: semantic.confidence,
        usage: token.usage?.features ?? [],
        verification: semantic.confidenceLevel,
        semantic,
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
    schemaVersion: 2,
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
      semanticReviewRequired: lifecycle.filter((item) => item.verification === "semantic-review-required").length,
    },
  };
}
