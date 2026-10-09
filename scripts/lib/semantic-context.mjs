const ACTION_CONTEXT = /(?:^|[^a-z0-9])(?:button|btn|action|cta|trigger|tab|tag|chip|pill|switch|checkbox|radio|link|menu-item|menuitem|dropdownmenuitem|submit|cancel|close|add|remove)(?:[^a-z0-9]|$)/i;
const ELEVATED_CONTEXT = /(?:^|[\s/_.:#-])(?:popover|dropdown|menu|tooltip|toast|dialog-content|modal-content|drawer-content|sheet-content|floating|elevated)(?:[\s/_.:#-]|$)/i;
const SCRIM_CONTEXT = /(?:^|[\s/_.:#-])(?:backdrop|scrim|mask|dialog-overlay|modal-overlay|drawer-overlay|sheet-overlay)(?:[\s/_.:#-]|$)/i;
const PAGE_CONTEXT = /(?:^|[^a-z0-9])(?:html|body|main|root|page|app-shell|page-shell|page-bg|workspace-bg|application-bg)(?:[^a-z0-9]|$)/i;
const SURFACE_CONTEXT = /(?:^|[^a-z0-9])(?:card|panel|surface|container|section|input|field|sidebar|header|content)(?:[^a-z0-9]|$)/i;
const ICON_CONTEXT = /(?:^|[\s/_.:#-])(?:icon|glyph|svg)(?:[\s/_.:#-]|$)/i;
const DECORATIVE_CONTEXT = /(?:^|[\s/_.:#-])(?:ambient|shimmer|gradient|glow|decoration|decorative|artwork)(?:[\s/_.:#-]|$)/i;
const CANVAS_CONTEXT = /(?:flow-canvas|canvas-node|puzzle(?:bobble|game)|ctx\.fillstyle|webgl|konva|fabric)/i;
const FEEDBACK = ["success", "warning", "error", "info"];
const STATES = ["default", "hover", "pressed", "focus", "selected", "disabled", "loading"];

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function slug(value) {
  return String(value ?? "")
    .replace(/^--/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeState(values) {
  const text = values.join(" ").toLowerCase();
  if (/(?:pressed|active)/.test(text)) return "pressed";
  if (/hover/.test(text)) return "hover";
  if (/(?:focus-visible|focus)/.test(text)) return "focus";
  if (/(?:selected|checked|open)/.test(text)) return "selected";
  if (/disabled/.test(text)) return "disabled";
  if (/loading/.test(text)) return "loading";
  return "default";
}

function feedbackRole(text) {
  if (/(?:error|danger|critical|negative|invalid)/.test(text)) return "error";
  if (/(?:warning|caution)/.test(text)) return "warning";
  if (/(?:success|positive)/.test(text)) return "success";
  if (/info/.test(text)) return "info";
  return null;
}

function hierarchy(text, fallback = "primary") {
  if (/(?:placeholder)/.test(text)) return "placeholder";
  if (/(?:disabled)/.test(text)) return "disabled";
  if (/(?:tertiary|subtle|caption|hint)/.test(text)) return "tertiary";
  if (/(?:secondary|muted|description|supporting)/.test(text)) return "secondary";
  if (/(?:inverse|on-dark|on-light)/.test(text)) return "inverse";
  if (/(?:link)/.test(text)) return "link";
  return fallback;
}

function actionVariant(text) {
  if (/(?:danger|error|critical|destructive|negative)/.test(text)) return "danger";
  if (/tertiary/.test(text)) return "tertiary";
  if (/(?:primary|brand|cta|submit)/.test(text)) return "primary";
  return "secondary";
}

function brandRole(text) {
  const role = /commercial/.test(text) ? "commercial" : "primary";
  return /(?:light|subtle|soft|weak)/.test(text) ? `${role}-subtle` : role;
}

function normalizeProperty(value) {
  return String(value ?? "").replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`).toLowerCase();
}

export function colorAlpha(value) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw || /var\(/.test(raw)) return null;
  if (raw === "transparent") return 0;
  const hex = raw.match(/^#([0-9a-f]{4}|[0-9a-f]{8})$/i)?.[1];
  if (hex) return Number.parseInt(hex.length === 4 ? `${hex[3]}${hex[3]}` : hex.slice(6, 8), 16) / 255;
  const slash = raw.match(/\/\s*([\d.]+)%?\s*\)?$/)?.[1];
  if (slash != null) return raw.match(/\/\s*[\d.]+%/) ? Number.parseFloat(slash) / 100 : Number.parseFloat(slash);
  const rgba = raw.match(/^rgba?\([^)]*[,\s]([\d.]+%?)\s*\)$/)?.[1];
  if (rgba != null && raw.startsWith("rgba")) return rgba.endsWith("%") ? Number.parseFloat(rgba) / 100 : Number.parseFloat(rgba);
  const hsla = raw.match(/^hsla?\([^)]*[,\s]([\d.]+%?)\s*\)$/)?.[1];
  if (hsla != null && raw.startsWith("hsla")) return hsla.endsWith("%") ? Number.parseFloat(hsla) / 100 : Number.parseFloat(hsla);
  return 1;
}

function scrimRole(text) {
  if (/(?:strong|heavy|dark|70|75|80|85|90)(?:-|$)/.test(text)) return "scrim-strong";
  if (/(?:soft|light|weak|20|25|30|35|40)(?:-|$)/.test(text)) return "scrim-soft";
  return "scrim";
}

function candidate(targetName, fingerprint, weight, reason, source) {
  return { targetName, fingerprint, weight, reason, source };
}

function candidateFromContext(example, subject) {
  const property = normalizeProperty(example.property ?? subject.property);
  const states = [...(example.states ?? []), ...(subject.usage?.states ?? [])];
  const state = normalizeState(states);
  const selectorKnown = example.selector && example.selector !== "unknown";
  const subjectText = [subject.name, subject.normalizedName].filter(Boolean).join(" ").toLowerCase();
  const localText = [
    example.selector,
    selectorKnown ? null : example.context,
    ...(states ?? []),
  ].filter(Boolean).join(" ").toLowerCase();
  const ownerText = [
    subject.file,
    example.file,
    example.feature,
    example.component,
    example.page,
  ].filter(Boolean).join(" ").toLowerCase();
  const structuralText = [subjectText, localText, example.context].filter(Boolean).join(" ").toLowerCase();
  const text = [subjectText, localText].filter(Boolean).join(" ").toLowerCase();
  const feedback = feedbackRole(text);
  const brand = /(?:^|-)(?:brand|commercial)(?:-|$)|^color-primary(?:-|$)/.test(slug(subject.name || subject.normalizedName));
  const interactiveState = ["hover", "pressed", "focus", "selected", "disabled"].includes(state);
  const explicitAction = ACTION_CONTEXT.test(localText) || ACTION_CONTEXT.test(subjectText);
  const backgroundAction = explicitAction || interactiveState;
  const canvas = CANVAS_CONTEXT.test([text, ownerText].join(" "));

  if (DECORATIVE_CONTEXT.test([text, ownerText].join(" ")) || /background-image/.test(property)) {
    return candidate(null, { family: "effect", property, role: "decorative", state, scope: "scoped" }, 5, "decorative-effect-consumer", example);
  }

  if (feedback) {
    const slot = /background/.test(property) ? "surface" : /border|outline/.test(property) ? "stroke" : /fill|stroke/.test(property) && ICON_CONTEXT.test(text) ? "icon" : "content";
    return candidate(`--feedback-${feedback}-${slot}`, { family: "feedback", property: slot, role: feedback, state, scope: "global" }, 6, `consumer:${property || "feedback"}`, example);
  }

  if (/background/.test(property)) {
    if (SCRIM_CONTEXT.test(text) || (/overlay/.test(text) && /(?:fixed|inset-0|portal|dialog|modal|drawer|sheet)/.test(structuralText))) {
      const role = scrimRole(text);
      return candidate(`--bg-${role}`, { family: "background", property: "background", role, state, scope: "global" }, 7, "consumer:scrim-layer", example);
    }
    if (canvas) {
      const role = /overlay|mask|scrim/.test(text) ? "overlay" : "surface";
      return candidate(`--canvas-bg-${role}`, { family: "canvas", property: "background", role, state, scope: "canvas" }, 6, "consumer:canvas-rendering", example);
    }
    if (backgroundAction) {
      const variant = actionVariant(text);
      return candidate(`--action-${variant}-bg${state === "default" ? "" : `-${state}`}`, { family: "action", property: "bg", role: variant, state, scope: "global" }, 7, "consumer:interactive-background", example);
    }
    if (brand) {
      const role = brandRole(subjectText);
      return candidate(`--brand-${role}-surface`, { family: "brand", property: "surface", role, state, scope: "global" }, 6, "consumer:brand-surface", example);
    }
    if (ELEVATED_CONTEXT.test(text)) return candidate("--bg-elevated", { family: "background", property: "background", role: "elevated", state, scope: "global" }, 7, "consumer:elevated-surface", example);
    if (PAGE_CONTEXT.test(text)) return candidate("--bg-body", { family: "background", property: "background", role: "body", state, scope: "global" }, 7, "consumer:page-root", example);
    if (SURFACE_CONTEXT.test(text)) return candidate("--bg-surface", { family: "background", property: "background", role: "surface", state, scope: "global" }, 6, "consumer:content-surface", example);
    return candidate(null, { family: "background", property: "background", role: "unresolved", state, scope: "unknown" }, 3, "consumer:background-without-layer", example);
  }

  if (/^(?:color|caret-color|text-decoration-color)$/.test(property)) {
    if (explicitAction) {
      const variant = actionVariant(text);
      return candidate(`--action-${variant}-content${state === "default" ? "" : `-${state}`}`, { family: "action", property: "content", role: variant, state, scope: "global" }, 7, "consumer:interactive-content", example);
    }
    if (brand) {
      const role = brandRole(subjectText);
      return candidate(`--brand-${role}-content`, { family: "brand", property: "content", role, state, scope: "global" }, 6, "consumer:brand-content", example);
    }
    const role = hierarchy(text);
    return candidate(`--text-${role}`, { family: "text", property: "content", role, state, scope: "global" }, 6, "consumer:text-color", example);
  }

  if (/^(?:fill|stroke)$/.test(property)) {
    if (explicitAction) {
      const variant = actionVariant(text);
      return candidate(`--action-${variant}-content${state === "default" ? "" : `-${state}`}`, { family: "action", property: "content", role: variant, state, scope: "global" }, 6, "consumer:interactive-icon", example);
    }
    if (brand) {
      const role = brandRole(subjectText);
      return candidate(`--brand-${role}-icon`, { family: "brand", property: "icon", role, state, scope: "global" }, 6, "consumer:brand-icon", example);
    }
    const role = hierarchy(text);
    return candidate(`--icon-${role}`, { family: "icon", property: "icon", role, state, scope: "global" }, ICON_CONTEXT.test(text) ? 7 : 5, "consumer:icon-color", example);
  }

  if (/^(?:border|outline)/.test(property)) {
    const role = /focus/.test(text) ? "focus" : feedback === "error" ? "error" : /disabled/.test(text) ? "disabled" : /(?:subtle|divider|hairline)/.test(text) ? "subtle" : "default";
    return candidate(`--stroke-${role}`, { family: "stroke", property: "stroke", role, state, scope: "global" }, 6, "consumer:boundary-color", example);
  }

  return null;
}

function candidateFromName(subject) {
  const name = slug(subject.normalizedName || subject.name);
  const state = normalizeState([name, ...(subject.usage?.states ?? [])]);
  const feedback = feedbackRole(name);
  if (feedback) {
    const slot = /(?:bg|background|surface)/.test(name) ? "surface" : /(?:border|stroke|outline)/.test(name) ? "stroke" : /(?:icon|glyph)/.test(name) ? "icon" : "content";
    return candidate(`--feedback-${feedback}-${slot}`, { family: "feedback", property: slot, role: feedback, state, scope: "global" }, 1.5, "name:feedback", null);
  }
  if (/^(?:action|button|btn)-|(?:^|-)(?:action|button)(?:-|$)/.test(name)) {
    const variant = actionVariant(name);
    const slot = /(?:bg|background|surface|fill)/.test(name) ? "bg" : "content";
    return candidate(`--action-${variant}-${slot}${state === "default" ? "" : `-${state}`}`, { family: "action", property: slot, role: variant, state, scope: "global" }, 2, "name:action", null);
  }
  if (/(?:^|-)(?:brand|commercial)(?:-|$)|^color-primary(?:-|$)/.test(name)) {
    const role = brandRole(name);
    const slot = /(?:bg|background|surface)/.test(name) ? "surface" : /(?:icon|glyph)/.test(name) ? "icon" : "content";
    return candidate(`--brand-${role}-${slot}`, { family: "brand", property: slot, role, state, scope: "global" }, 1.5, "name:brand", null);
  }
  if (/(?:mask|scrim)/.test(name)) {
    const role = scrimRole(name);
    return candidate(`--bg-${role}`, { family: "background", property: "background", role, state, scope: "global" }, 2, "name:scrim", null);
  }
  if (/(?:popover|dropdown|menu|elevated|float)/.test(name) && !/(?:mask|backdrop)/.test(name)) return candidate("--bg-elevated", { family: "background", property: "background", role: "elevated", state, scope: "global" }, 2, "name:elevated", null);
  if (/(?:overlay)/.test(name)) {
    const role = scrimRole(name);
    return candidate(`--bg-${role}`, { family: "background", property: "background", role, state, scope: "global" }, 1.5, "name:overlay", null);
  }
  if (/(?:^|-)(?:text|foreground|content)(?:-|$)/.test(name)) {
    const role = hierarchy(name);
    return candidate(`--text-${role}`, { family: "text", property: "content", role, state, scope: "global" }, 1.5, "name:text", null);
  }
  if (/(?:^|-)(?:icon|glyph)(?:-|$)/.test(name)) {
    const role = hierarchy(name);
    return candidate(`--icon-${role}`, { family: "icon", property: "icon", role, state, scope: "global" }, 1.5, "name:icon", null);
  }
  if (/(?:^|-)(?:border|stroke|outline|divider|ring)(?:-|$)/.test(name)) return candidate("--stroke-default", { family: "stroke", property: "stroke", role: "default", state, scope: "global" }, 1.5, "name:stroke", null);
  if (/(?:^|-)(?:bg|background|surface)(?:-|$)/.test(name)) {
    const role = /(?:card|panel|surface|container)/.test(name) ? "surface" : /(?:body|page|root)/.test(name) ? "body" : "unresolved";
    return candidate(role === "unresolved" ? null : `--bg-${role}`, { family: "background", property: "background", role, state, scope: "global" }, 1, "name:background", null);
  }
  return null;
}

function summarizeCandidates(candidates) {
  const scored = new Map();
  for (const item of candidates.filter(Boolean)) {
    const key = item.targetName ?? `unresolved:${item.fingerprint.family}:${item.fingerprint.role}`;
    if (!scored.has(key)) scored.set(key, { key, targetName: item.targetName, fingerprint: item.fingerprint, score: 0, evidence: [] });
    const row = scored.get(key);
    row.score += item.weight;
    row.evidence.push({ reason: item.reason, weight: item.weight, file: item.source?.file ?? null, line: item.source?.line ?? null, selector: item.source?.selector ?? null, property: item.source?.property ?? null });
  }
  return [...scored.values()].sort((left, right) => right.score - left.score || String(left.key).localeCompare(String(right.key)));
}

export function inferTokenSemanticFingerprint(subject) {
  if (subject.category && !["color", "other"].includes(subject.category)) {
    return {
      targetName: null,
      proposedTarget: null,
      fingerprint: { family: subject.category, property: null, role: "unresolved", state: "default", scope: "unknown" },
      confidence: 0,
      confidenceLevel: "manual-review",
      consumerEvidenceCount: 0,
      evidence: [],
      alternatives: [],
      conflicts: ["non-color-atomic-category"],
    };
  }
  const examples = subject.usage?.examples ?? [];
  const contextual = examples.map((example) => candidateFromContext(example, subject)).filter(Boolean);
  const named = candidateFromName(subject);
  const ranked = summarizeCandidates([...contextual, named]);
  const top = ranked[0] ?? null;
  const second = ranked[1] ?? null;
  const total = ranked.reduce((sum, item) => sum + item.score, 0) || 1;
  const consensus = top ? top.score / total : 0;
  const consumerEvidence = contextual.filter((item) => item.targetName).length;
  const conflicting = Boolean(second && second.score >= top.score * 0.62);
  let confidence = top
    ? consumerEvidence
      ? Math.min(0.97, 0.48 + consensus * 0.3 + Math.min(0.19, consumerEvidence * 0.035))
      : 0.24 + consensus * 0.18
    : 0;
  if (conflicting || !top?.targetName) confidence = Math.min(confidence, 0.56);
  const targetName = top?.targetName && consumerEvidence > 0 && confidence >= 0.58 ? top.targetName : null;
  return {
    targetName,
    proposedTarget: top?.targetName ?? null,
    fingerprint: top?.fingerprint ?? { family: "unresolved", property: null, role: "unresolved", state: "default", scope: "unknown" },
    confidence: Number(confidence.toFixed(2)),
    confidenceLevel: targetName ? confidence >= 0.8 ? "source-confirmed" : "source-suggested" : "manual-review",
    consumerEvidenceCount: consumerEvidence,
    evidence: top?.evidence ?? [],
    alternatives: ranked.slice(1, 4).map((item) => ({ targetName: item.targetName, fingerprint: item.fingerprint, score: item.score, evidence: item.evidence })),
    conflicts: conflicting ? ["multiple-consumer-semantics"] : !consumerEvidence ? ["no-consumer-context"] : !top?.targetName ? ["unresolved-layer-or-role"] : [],
  };
}

export function inferDirectStyleSemantic(item) {
  const examples = (item.examples ?? []).map((example) => ({
    ...example,
    property: example.property ?? item.property,
    feature: item.usage?.features?.[0] ?? null,
    component: item.usage?.components?.[0] ?? null,
    page: item.usage?.pages?.[0] ?? null,
    states: item.usage?.states ?? [],
    context: example.evidence ?? null,
  }));
  return inferTokenSemanticFingerprint({
    ...item,
    name: item.value,
    normalizedName: "",
    resolvedValue: item.normalizedColor ?? item.value,
    usage: { ...(item.usage ?? {}), examples },
  });
}

export function semanticTargetsCompatible(left, right) {
  if (!left?.targetName || !right?.targetName || left.targetName !== right.targetName) return false;
  const a = left.fingerprint;
  const b = right.fingerprint;
  return a.family === b.family && a.property === b.property && a.role === b.role && a.state === b.state && (a.scope === b.scope || a.scope === "global" || b.scope === "global");
}

export function targetFamily(name, fallback = "other") {
  if (name?.startsWith("--bg-")) return "background";
  if (name?.startsWith("--text-")) return "text";
  if (name?.startsWith("--stroke-")) return "border";
  if (name?.startsWith("--icon-")) return "icon-fill";
  if (name?.startsWith("--action-")) return "brand-action";
  if (name?.startsWith("--brand-")) return "brand";
  if (name?.startsWith("--feedback-")) return "feedback";
  if (name?.startsWith("--data-")) return "data-visualization";
  if (name?.startsWith("--canvas-")) return "other";
  return fallback;
}

export function modeCandidateScore(token, semantic, targetName) {
  let score = Math.round((semantic?.confidence ?? 0) * 100);
  score += Math.min(30, token.usage?.totalReferenceCount ?? 0);
  if (token.role === "canonical") score += 12;
  if (token.role === "adapter") score -= 45;
  const alpha = colorAlpha(token.resolvedValue ?? token.value);
  if (/^--bg-scrim/.test(targetName)) score += alpha != null && alpha < 0.999 ? 45 : -120;
  if (/^--bg-(?:body|surface|elevated)$/.test(targetName)) score += alpha == null || alpha >= 0.999 ? 12 : -35;
  if (token.name === targetName) score += 20;
  return score;
}

export const SEMANTIC_STATES = STATES;
export const SEMANTIC_FEEDBACK_ROLES = FEEDBACK;
