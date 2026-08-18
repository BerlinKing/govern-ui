const DECISIONS = new Set(["canonical", "keep-separate", "alias", "migrate", "exception", "not-conflict", "defer"]);
const CATEGORIES = new Set(["token", "component", "overlay", "ownership", "behavior"]);
const VISUALIZERS = new Set(["token-comparison", "component-comparison", "layer-stack", "ownership-flow", "behavior-contract"]);
const SPECIMENS = new Set(["color", "spacing", "radius", "typography", "component", "layer", "ownership", "behavior", "value", "rule"]);
const SYSTEMS = new Set(["static", "dynamic"]);

const text = (zh, en) => ({ zh, en });

function isLocalizedText(value) {
  return typeof value === "string" || (
    value &&
    typeof value === "object" &&
    typeof value.zh === "string" &&
    value.zh.trim() &&
    typeof value.en === "string" &&
    value.en.trim()
  );
}

function laneSummary(lane) {
  if (lane === "Bootstrap") {
    return {
      verdict: text("先建立一套最小规则，再扩充组件库", "Establish a small shared foundation before expanding the component library"),
      explanation: text("仓库里还没有足够稳定的公共样式入口。先确定颜色、文字、间距和基础控件的统一规则，会比直接迁移更安全。", "The repository does not yet have a stable shared styling entry point. Define color, type, spacing, and basic controls before attempting a migration."),
    };
  }
  if (lane === "Migrate") {
    return {
      verdict: text("保留成熟部分，把分散规则逐步收回一个系统", "Keep the mature parts and gradually consolidate scattered rules"),
      explanation: text("仓库已经有可复用的基础，但同一类视觉规则仍由多个位置共同控制。建议先确认归属，再分批迁移。", "The repository has reusable foundations, but similar visual rules are controlled in several places. Confirm ownership first, then migrate in batches."),
    };
  }
  return {
    verdict: text("共享基础统一，产品差异明确保留", "Unify shared foundations while preserving explicit product differences"),
    explanation: text("仓库同时存在可共享的基础规则和合理的产品差异。目标不是把所有样式做成一样，而是让共享与例外都说得清楚。", "The repository contains both shareable foundations and legitimate product differences. The goal is not to make everything identical, but to make shared rules and exceptions explicit."),
  };
}

function conflictCopy(type) {
  if (type === "semantic-conflict") {
    return {
      category: "token",
      visualizer: "token-comparison",
      title: text("同一个样式名称，现在会显示成不同结果", "One style name currently produces different results"),
      question: text("这些值是同一语义，还是不同角色？", "Do these values share one meaning or represent different roles?"),
      current: text("同一个名称对应多个值。最终显示可能取决于页面范围、加载顺序或引用位置。", "The same name maps to multiple values. The result may depend on scope, load order, or where it is referenced."),
      target: text("一个名称只表达一种视觉含义；确有差异的场景使用清楚的新名称或范围规则。", "One name expresses one visual meaning; intentional differences use explicit names or scope rules."),
      decision: "keep-separate",
      recommendation: text("为差异单独命名；相同语义再合并。", "Name real differences; merge only shared semantics."),
      reason: text("直接合并可能改变现有页面；先命名差异，之后才能安全迁移。", "A direct merge may change existing screens. Naming the difference first makes later migration safer."),
    };
  }
  if (type === "owner-conflict") {
    return {
      category: "ownership",
      visualizer: "ownership-flow",
      title: text("现在有多个样式总入口，团队不知道谁说了算", "Several styling entry points currently appear authoritative"),
      question: text("哪个入口负责全局共享样式？", "Which entry point should own shared styles?"),
      current: text("多个文件都在定义基础规则，但它们之间没有清楚的引用或上下级关系。", "Several files define foundational rules without a clear reference or hierarchy."),
      target: text("指定一个共享入口；产品或页面差异只通过明确的范围覆盖连接到它。", "Designate one shared entry point and connect product or page differences through explicit scoped overrides."),
      decision: "migrate",
      recommendation: text("选一个主入口；其他位置只引用或做范围覆盖。", "Choose one owner; make other locations consumers or scoped overrides."),
      reason: text("明确归属后，修改、评审和回滚都有唯一落点。", "Clear ownership gives changes, reviews, and rollbacks one dependable starting point."),
    };
  }
  return {
    category: "token",
    visualizer: "token-comparison",
    title: text("同一套样式规则被重复保存", "The same style rule is stored in multiple places"),
    question: text("共享一个来源，还是保留为独立语义？", "Share one source or keep distinct semantics?"),
    current: text("多个位置保存了相同或相近的规则。修改其中一处时，其他位置不会自动同步。", "Several locations store the same or similar rules. Updating one does not automatically update the others."),
    target: text("共享规则只有一个来源；确有差异的部分通过明确名称保留。", "Shared rules have one source; intentional differences remain under explicit names."),
    decision: "canonical",
    recommendation: text("合并为一个共享 Token；产品差异单独命名。", "Merge into one shared Token; name product differences separately."),
    reason: text("这能减少样式漂移，同时避免把合理差异误删。", "This reduces visual drift without erasing legitimate differences."),
  };
}

function categoryForKind(kind) {
  return {
    color: "color",
    typography: "typography",
    spacing: "spacing-density",
    radius: "shape-stroke",
    shadow: "depth-layer",
    layer: "depth-layer",
    motion: "motion-parameters",
  }[kind] || "token-architecture";
}

function systemPathForConflict(conflict, definitions) {
  if (conflict.type === "owner-conflict") return { system: "static", layer: "foundation", category: "token-architecture" };
  const counts = new Map();
  for (const definition of definitions) counts.set(definition.kind, (counts.get(definition.kind) ?? 0) + 1);
  const dominantKind = [...counts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0];
  return { system: "static", layer: "foundation", category: categoryForKind(dominantKind) };
}

function standardCopy(category) {
  const copies = {
    "token-architecture": text("标准系统应明确原始 Token、语义 Token、组件 Token、别名、作用域和唯一归属。", "A standard system defines primitive, semantic, and component tokens, plus aliases, scopes, and one clear owner."),
    color: text("标准颜色系统应从原始色板映射到语义角色，再由组件 Token 使用；同值不代表同义。", "A standard color system maps a primitive palette to semantic roles and then to component tokens; equal values do not imply equal meaning."),
    typography: text("标准字体系统应统一字体家族、语义文字角色、字号、字重、行高和字距。", "A standard typography system defines font families, semantic text roles, scale, weight, line height, and tracking."),
    "spacing-density": text("标准间距系统应区分组件内部间距、组件之间间距、布局间距、控件尺寸和密度。", "A standard spacing system separates component inset, inter-component spacing, layout spacing, control sizing, and density."),
    "shape-stroke": text("标准形状系统应统一圆角、边框、分隔线和焦点环规则。", "A standard shape system defines radius, borders, dividers, and focus-ring rules."),
    "depth-layer": text("标准深度系统应以语义层级管理阴影、遮罩、透明度、Portal 和 z-index。", "A standard depth system manages shadow, scrim, opacity, portals, and z-index through semantic layers."),
    "motion-parameters": text("标准动效基础应统一时长、缓动、延迟、弹簧参数和弱化动效规则。", "A standard motion foundation defines duration, easing, delay, spring parameters, and reduced-motion behavior."),
  };
  return copies[category] || copies["token-architecture"];
}

function definitionSpecimen(definition) {
  const type = ["color", "spacing", "radius", "typography"].includes(definition.kind) ? definition.kind : "value";
  return {
    type,
    label: text(definition.normalizedName || definition.name, definition.normalizedName || definition.name),
    value: definition.value,
    detail: text("当前值", "Current value"),
  };
}

function ownerSpecimen(owner) {
  return {
    type: "ownership",
    label: text(owner?.file || "未识别入口", owner?.file || "Unidentified entry point"),
    value: owner?.file || "unknown",
    detail: text("当前可能控制这组规则", "Currently appears to control this rule group"),
  };
}

function choice(decision, resolutionAction, zh, en, consequenceZh, consequenceEn) {
  return { decision, resolutionAction, label: text(zh, en), consequence: text(consequenceZh, consequenceEn) };
}

function fallbackChoices(recommended) {
  const recommendedChoice = {
    canonical: choice("canonical", "merge", "统一来源", "Use one source", "合并重复来源。", "Merge duplicate sources."),
    migrate: choice("migrate", "migrate", "迁移到主入口", "Migrate to owner", "分批迁移现有引用。", "Migrate current usage in batches."),
    "keep-separate": choice("keep-separate", "migrate", "保留独立语义", "Keep separate", "为真实差异单独命名。", "Name intentional differences."),
  }[recommended] || choice(recommended, null, "采用建议", "Use recommendation", "按建议处理。", "Apply the recommendation.");
  const alternative = recommended === "keep-separate"
    ? choice("canonical", "merge", "完全统一", "Fully consolidate", "合并为一个目标 Token。", "Merge into one target Token.")
    : choice("keep-separate", "migrate", "保留独立语义", "Keep separate", "为差异建立独立 Token。", "Create distinct Tokens for real differences.");
  return [
    recommendedChoice,
    alternative,
    choice("defer", null, "暂不处理", "Decide later", "不进入本次清扫。", "Exclude from this cleanup."),
  ];
}

export function createFallbackReviewBrief(report) {
  const definitions = new Map(report.tokenDefinitions.map((item) => [item.id, item]));
  const owners = new Map(report.tokenOwners.map((item) => [item.id, item]));
  const summary = laneSummary(report.recommendedLane);
  const packages = report.conflicts.map((conflict, index) => {
    const copy = conflictCopy(conflict.type);
    const conflictDefinitions = conflict.definitionIds.map((id) => definitions.get(id)).filter(Boolean);
    const conflictOwners = conflict.ownerIds.map((id) => owners.get(id)).filter(Boolean);
    const specimens = copy.visualizer === "ownership-flow"
      ? conflictOwners.slice(0, 4).map(ownerSpecimen)
      : conflictDefinitions.slice(0, 4).map(definitionSpecimen);
    const targetSpecimen = copy.visualizer === "ownership-flow"
      ? [{ type: "ownership", label: text("一个主入口", "One primary entry point"), display: text("一个主入口", "One primary entry point"), value: "canonical-owner", detail: text("其他位置只引用或做明确覆盖", "Other locations consume it or provide explicit overrides") }]
      : [{ type: "rule", label: text("目标规则", "Target rule"), display: conflict.type === "semantic-conflict" ? text("一个语义，一个名称", "One meaning, one name") : text("一条共享规则，一个来源", "One shared rule, one owner"), value: conflict.type === "semantic-conflict" ? "one meaning → one name" : "one shared rule → one owner", detail: copy.target }];
    const systemPath = systemPathForConflict(conflict, conflictDefinitions);
    return {
      id: `review-${String(index + 1).padStart(2, "0")}-${conflict.id}`,
      conflictIds: [conflict.id],
      category: copy.category,
      systemPath,
      standard: standardCopy(systemPath.category),
      visualizer: copy.visualizer,
      title: copy.title,
      question: copy.question,
      current: { summary: copy.current, specimens },
      target: { summary: copy.target, specimens: targetSpecimen },
      recommendation: {
        decision: copy.decision,
        resolutionAction: copy.decision === "canonical" ? "merge" : "migrate",
        canonicalOwnerId: copy.decision === "migrate" || copy.decision === "canonical" ? conflictOwners[0]?.id || null : null,
        summary: copy.recommendation,
        reasons: [copy.reason],
        confidence: Math.min(0.72, conflict.confidence * 0.74),
        limitation: text("这是根据源码关系生成的初步建议；最终视觉目标仍应结合真实页面确认。", "This is an initial source-derived recommendation; confirm the final visual target against real screens."),
      },
      choices: fallbackChoices(copy.decision),
      evidence: [{
        fact: copy.current,
        impact: copy.reason,
        sourceRefs: conflictDefinitions.slice(0, 8).map((item) => ({ file: item.file, line: item.line, excerpt: `${item.name}: ${item.value}` })),
      }],
    };
  });
  return {
    schemaVersion: 2,
    reportId: report.reportId,
    repoId: report.repoId,
    authoredBy: "deterministic-fallback",
    summary: {
      ...summary,
      keep: [text("保留已经存在、并被真实产品使用的基础样式和公共控件。", "Keep existing foundational styles and shared controls that are used by real product surfaces.")],
      changeFirst: report.conflicts.length
        ? [text("先完成下面的关键决策，再开始批量迁移或新建组件库。", "Complete the key decisions below before bulk migration or component-library work.")]
        : [text("当前没有必须立即处理的样式归属冲突。", "No style-ownership conflict requires immediate action.")],
      later: [text("运行时交互、响应式、可访问性和视觉一致性需要在真实页面中另行验证。", "Runtime interaction, responsiveness, accessibility, and visual parity still require separate verification on real screens.")],
    },
    decisionPackages: packages,
  };
}

export function validateReviewBrief(value, report = null) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { valid: false, errors: ["review brief must be an object"] };
  if (![1, 2].includes(value.schemaVersion)) errors.push("schemaVersion must be 1 or 2");
  if (value.reportId != null && typeof value.reportId !== "string") errors.push("reportId must be a string when provided");
  if (value.repoId != null && typeof value.repoId !== "string") errors.push("repoId must be a string when provided");
  if (report && value.reportId && value.reportId !== report.reportId) errors.push("review brief reportId does not match the audit report");
  if (report && value.repoId && value.repoId !== report.repoId) errors.push("review brief repoId does not match the audit report");

  for (const key of ["verdict", "explanation"]) {
    if (!isLocalizedText(value.summary?.[key])) errors.push(`summary.${key} must contain zh and en text`);
  }
  for (const key of ["keep", "changeFirst", "later"]) {
    if (!Array.isArray(value.summary?.[key]) || !value.summary[key].every(isLocalizedText)) errors.push(`summary.${key} must be an array of localized text`);
  }
  if (!Array.isArray(value.decisionPackages)) errors.push("decisionPackages must be an array");

  const ids = new Set();
  const validConflictIds = report ? new Set(report.conflicts.map((item) => item.id)) : null;
  for (const [index, item] of (value.decisionPackages ?? []).entries()) {
    const prefix = `decisionPackages[${index}]`;
    if (typeof item?.id !== "string" || !item.id) errors.push(`${prefix}.id is required`);
    else if (ids.has(item.id)) errors.push(`${prefix}.id must be unique`);
    else ids.add(item.id);
    if (!Array.isArray(item?.conflictIds) || !item.conflictIds.every((id) => typeof id === "string" && id)) errors.push(`${prefix}.conflictIds must be an array of conflict IDs`);
    if (item?.findingFingerprints != null && (!Array.isArray(item.findingFingerprints) || !item.findingFingerprints.every((id) => typeof id === "string" && id))) errors.push(`${prefix}.findingFingerprints must be an array of finding fingerprints`);
    if (!(item?.conflictIds?.length || item?.findingFingerprints?.length)) errors.push(`${prefix} must reference at least one conflict or finding`);
    if (validConflictIds) {
      for (const id of item?.conflictIds ?? []) if (!validConflictIds.has(id)) errors.push(`${prefix}.conflictIds contains unknown conflict ${id}`);
      const validFingerprints = new Set(report.findings.map((finding) => finding.fingerprint));
      for (const id of item?.findingFingerprints ?? []) if (!validFingerprints.has(id)) errors.push(`${prefix}.findingFingerprints contains unknown finding ${id}`);
    }
    if (!CATEGORIES.has(item?.category)) errors.push(`${prefix}.category is invalid`);
    if (value.schemaVersion >= 2) {
      if (!SYSTEMS.has(item?.systemPath?.system)) errors.push(`${prefix}.systemPath.system must be static or dynamic`);
      if (typeof item?.systemPath?.layer !== "string" || !item.systemPath.layer) errors.push(`${prefix}.systemPath.layer is required`);
      if (typeof item?.systemPath?.category !== "string" || !item.systemPath.category) errors.push(`${prefix}.systemPath.category is required`);
      if (!isLocalizedText(item?.standard)) errors.push(`${prefix}.standard must contain zh and en text`);
    }
    if (!VISUALIZERS.has(item?.visualizer)) errors.push(`${prefix}.visualizer is invalid`);
    for (const key of ["title", "question"]) if (!isLocalizedText(item?.[key])) errors.push(`${prefix}.${key} must contain zh and en text`);
    for (const state of ["current", "target"]) {
      if (!isLocalizedText(item?.[state]?.summary)) errors.push(`${prefix}.${state}.summary must contain zh and en text`);
      if (!Array.isArray(item?.[state]?.specimens)) errors.push(`${prefix}.${state}.specimens must be an array`);
      for (const [specimenIndex, specimen] of (item?.[state]?.specimens ?? []).entries()) {
        if (!SPECIMENS.has(specimen?.type)) errors.push(`${prefix}.${state}.specimens[${specimenIndex}].type is invalid`);
        if (!isLocalizedText(specimen?.label)) errors.push(`${prefix}.${state}.specimens[${specimenIndex}].label must contain zh and en text`);
        if (specimen?.detail != null && !isLocalizedText(specimen.detail)) errors.push(`${prefix}.${state}.specimens[${specimenIndex}].detail must contain zh and en text`);
      }
    }
    if (!DECISIONS.has(item?.recommendation?.decision)) errors.push(`${prefix}.recommendation.decision is invalid`);
    if (item?.recommendation?.resolutionAction != null && !["migrate", "merge", "delete"].includes(item.recommendation.resolutionAction)) errors.push(`${prefix}.recommendation.resolutionAction is invalid`);
    if (!isLocalizedText(item?.recommendation?.summary)) errors.push(`${prefix}.recommendation.summary must contain zh and en text`);
    if (!Array.isArray(item?.recommendation?.reasons) || !item.recommendation.reasons.every(isLocalizedText)) errors.push(`${prefix}.recommendation.reasons must be localized text`);
    if (typeof item?.recommendation?.confidence !== "number" || item.recommendation.confidence < 0 || item.recommendation.confidence > 1) errors.push(`${prefix}.recommendation.confidence must be between 0 and 1`);
    if (item?.recommendation?.limitation != null && !isLocalizedText(item.recommendation.limitation)) errors.push(`${prefix}.recommendation.limitation must contain zh and en text`);
    if (!Array.isArray(item?.choices) || item.choices.length < 2 || item.choices.length > 4) errors.push(`${prefix}.choices must contain 2 to 4 choices`);
    for (const [choiceIndex, itemChoice] of (item?.choices ?? []).entries()) {
      if (!DECISIONS.has(itemChoice?.decision)) errors.push(`${prefix}.choices[${choiceIndex}].decision is invalid`);
      if (itemChoice?.resolutionAction != null && !["migrate", "merge", "delete"].includes(itemChoice.resolutionAction)) errors.push(`${prefix}.choices[${choiceIndex}].resolutionAction is invalid`);
      if (!isLocalizedText(itemChoice?.label)) errors.push(`${prefix}.choices[${choiceIndex}].label must contain zh and en text`);
      if (!isLocalizedText(itemChoice?.consequence)) errors.push(`${prefix}.choices[${choiceIndex}].consequence must contain zh and en text`);
    }
    if (!Array.isArray(item?.evidence) || !item.evidence.length) errors.push(`${prefix}.evidence must contain at least one plain-language fact`);
    for (const [evidenceIndex, evidence] of (item?.evidence ?? []).entries()) {
      if (!isLocalizedText(evidence?.fact)) errors.push(`${prefix}.evidence[${evidenceIndex}].fact must contain zh and en text`);
      if (!isLocalizedText(evidence?.impact)) errors.push(`${prefix}.evidence[${evidenceIndex}].impact must contain zh and en text`);
      if (evidence?.sourceRefs != null && !Array.isArray(evidence.sourceRefs)) errors.push(`${prefix}.evidence[${evidenceIndex}].sourceRefs must be an array`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function normalizeReviewBrief(value, report) {
  const brief = value || createFallbackReviewBrief(report);
  const validation = validateReviewBrief(brief, report);
  if (!validation.valid) throw new Error(`Invalid review brief:\n${validation.errors.map((item) => `- ${item}`).join("\n")}`);
  return {
    ...brief,
    reportId: report.reportId,
    repoId: report.repoId,
    authoredBy: brief.authoredBy || "codex-review",
  };
}
