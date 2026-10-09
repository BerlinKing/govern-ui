function text(zh, en) {
  return { zh, en };
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

const FOUNDATION = [
  { id: "color", label: text("颜色", "Color"), description: text("原始色板、语义颜色、亮暗模式与组件状态映射。", "Primitive palettes, semantic roles, modes, and component-state mappings."), categories: ["color"], specimen: "color" },
  { id: "typography", label: text("字体与排版", "Typography"), description: text("字体家族、字号层级、字重、行高、字距与文本角色。", "Families, scale, weight, line height, tracking, and text roles."), categories: ["typography"], specimen: "typography" },
  { id: "iconography", label: text("图标", "Iconography"), description: text("图标来源、尺寸网格、线宽、填充与产品专用例外。", "Sources, size grid, stroke, fill, and product-specific exceptions."), categories: ["icons"], specimen: "icons" },
  { id: "spacing-density", label: text("间距与密度", "Spacing & density"), description: text("基础间距刻度、组件内距、布局间距与密度模式。", "Base scale, component insets, layout gaps, and density modes."), categories: ["spacing"], specimen: "spacing" },
  { id: "grid-layout", label: text("栅格与布局", "Grid & layout"), description: text("页面容器、列网格、断点、对齐与响应式规则。", "Containers, column grids, breakpoints, alignment, and responsive rules."), categories: [], specimen: "grid" },
  { id: "size-control", label: text("尺寸与控件高度", "Size & control height"), description: text("图标、控件、触控目标与常用容器尺寸。", "Icon, control, touch-target, and common container sizes."), categories: ["spacing"], specimen: "size" },
  { id: "radius", label: text("圆角", "Radius"), description: text("容器、控件、浮层与胶囊形态的圆角层级。", "Radius hierarchy for containers, controls, floating surfaces, and pills."), categories: ["radius"], specimen: "radius" },
  { id: "stroke", label: text("描边", "Stroke"), description: text("边框宽度、样式、分隔线与键盘焦点环。", "Border widths, styles, dividers, and keyboard focus rings."), categories: ["stroke"], specimen: "stroke" },
  { id: "shadow-elevation", label: text("投影与海拔", "Shadow & elevation"), description: text("页面、浮层、弹窗和通知的深度关系。", "Depth relationships across pages, floating surfaces, dialogs, and notifications."), categories: ["shadow"], specimen: "shadow" },
  { id: "opacity-blur", label: text("透明度与模糊", "Opacity & blur"), description: text("遮罩、禁用、悬浮与玻璃效果的强度规则。", "Strength rules for scrims, disabled states, hover, and glass effects."), categories: ["opacity", "blur"], specimen: "opacity" },
  { id: "layer", label: text("界面层级", "Layer"), description: text("内容、浮层、弹窗、通知和紧急界面的语义层级。", "Semantic layers for content, floating UI, modals, notifications, and critical surfaces."), categories: ["layer"], specimen: "layer" },
  { id: "motion", label: text("动效", "Motion"), description: text("时长、缓动、进入退出、反馈与减少动态效果。", "Duration, easing, enter/exit, feedback, and reduced-motion behavior."), categories: ["motion"], specimen: "motion" },
];

const COMPONENT_LAYERS = [
  {
    id: "atoms", label: text("原子组件", "Atoms"), description: text("不能再拆分的视觉元素与基础控件。", "Indivisible visual elements and base controls."),
    items: ["text", "heading", "icon", "image", "avatar", "button", "iconbutton", "link", "input", "textarea", "checkbox", "radio", "switch", "badge", "tag", "divider", "spinner", "skeleton", "progress"],
  },
  {
    id: "molecules", label: text("分子组件", "Molecules"), description: text("组合标签、输入、选择、披露和导航行为的控件。", "Controls combining labels, input, selection, disclosure, and navigation."),
    items: ["formfield", "searchfield", "inputgroup", "select", "combobox", "autocomplete", "datepicker", "timepicker", "dropdown", "contextmenu", "tabs", "segmentedcontrol", "breadcrumb", "pagination", "tooltip", "toggletip", "taggroup", "fileuploader"],
  },
  {
    id: "components", label: text("复杂组件", "Components"), description: text("承载产品内容、流程、浮层和反馈的完整界面单元。", "Complete surfaces for product content, flows, overlays, and feedback."),
    items: ["header", "sidebar", "navigation", "pageheader", "table", "datatable", "list", "tree", "card", "metric", "timeline", "dialog", "modal", "drawer", "sheet", "popover", "menu", "alert", "toast", "banner", "emptystate", "form", "filter", "editor"],
  },
];

const LABELS = {
  text: ["文本", "Text"], heading: ["标题", "Heading"], icon: ["图标", "Icon"], image: ["图片", "Image"], avatar: ["头像", "Avatar"], button: ["按钮", "Button"], iconbutton: ["图标按钮", "Icon button"], link: ["链接", "Link"], input: ["输入框", "Input"], textarea: ["多行输入", "Textarea"], checkbox: ["复选框", "Checkbox"], radio: ["单选框", "Radio"], switch: ["开关", "Switch"], badge: ["徽标", "Badge"], tag: ["标签", "Tag"], divider: ["分隔线", "Divider"], spinner: ["加载指示", "Spinner"], skeleton: ["骨架屏", "Skeleton"], progress: ["进度", "Progress"], formfield: ["表单字段", "Form field"], searchfield: ["搜索框", "Search field"], inputgroup: ["输入组合", "Input group"], select: ["选择器", "Select"], combobox: ["组合选择", "Combobox"], autocomplete: ["自动补全", "Autocomplete"], datepicker: ["日期选择", "Date picker"], timepicker: ["时间选择", "Time picker"], dropdown: ["下拉菜单", "Dropdown"], contextmenu: ["右键菜单", "Context menu"], tabs: ["标签页", "Tabs"], segmentedcontrol: ["分段控件", "Segmented control"], breadcrumb: ["面包屑", "Breadcrumb"], pagination: ["分页", "Pagination"], tooltip: ["文字提示", "Tooltip"], toggletip: ["可交互提示", "Toggletip"], taggroup: ["标签组", "Tag group"], fileuploader: ["文件上传", "File uploader"], header: ["顶部导航", "Header"], sidebar: ["侧边导航", "Sidebar"], navigation: ["导航", "Navigation"], pageheader: ["页面标题", "Page header"], table: ["表格", "Table"], datatable: ["数据表格", "Data table"], list: ["列表", "List"], tree: ["树", "Tree"], card: ["卡片", "Card"], metric: ["指标", "Metric"], timeline: ["时间线", "Timeline"], dialog: ["对话框", "Dialog"], modal: ["模态框", "Modal"], drawer: ["抽屉", "Drawer"], sheet: ["侧滑面板", "Sheet"], popover: ["浮层", "Popover"], menu: ["菜单", "Menu"], alert: ["警告", "Alert"], toast: ["轻提示", "Toast"], banner: ["横幅", "Banner"], emptystate: ["空状态", "Empty state"], form: ["表单", "Form"], filter: ["筛选器", "Filter"], editor: ["编辑器", "Editor"],
};

const CONTROL_STATES = ["default", "hover", "pressed", "focus-visible", "disabled"];
const OVERLAY_STATES = ["closed", "opening", "open", "closing", "nested"];
const STARTER_COMPONENTS = new Set(["text", "icon", "button", "iconbutton", "input", "checkbox", "radio", "switch", "badge", "divider", "formfield", "select", "tabs", "tooltip", "dialog", "toast", "alert"]);

function componentContract(primitive) {
  const overlay = /^(?:dialog|modal|drawer|sheet|popover|menu|dropdown|tooltip|toggletip)$/.test(primitive);
  const input = /^(?:input|textarea|checkbox|radio|switch|select|combobox|autocomplete|datepicker|timepicker|searchfield|fileuploader)$/.test(primitive);
  const feedback = /^(?:toast|alert|banner|emptystate|spinner|skeleton|progress)$/.test(primitive);
  return {
    anatomy: overlay ? ["trigger", "portal", "surface", "content", "close"] : input ? ["label", "control", "value", "supporting text"] : feedback ? ["icon", "message", "action", "dismiss"] : ["container", "content", "leading", "trailing"],
    variants: overlay ? ["standard", "critical"] : input ? ["standard", "invalid"] : ["primary", "secondary", "tertiary"],
    sizes: ["small", "medium", "large"],
    states: overlay ? OVERLAY_STATES : input ? [...CONTROL_STATES, "invalid", "loading"] : feedback ? ["entering", "visible", "exiting"] : CONTROL_STATES,
    behavior: overlay ? ["portal", "focus trap", "Escape", "outside click", "scroll lock", "layer", "motion"] : input ? ["keyboard", "focus", "validation", "loading", "content overflow"] : ["keyboard", "focus", "loading", "content overflow", "responsive"],
    specimen: primitive,
  };
}

function categoryForAction(action, tokenById) {
  const token = action.currentTokens.map((item) => tokenById.get(item.id)).find(Boolean);
  if (token?.category) return token.category;
  if (action.targetToken?.name?.match(/^--(?:bg|text|icon|feedback|color)/)) return "color";
  return "other";
}

function foundationIdForCategory(category, token = null) {
  if (category === "color") return "color";
  if (category === "typography") return "typography";
  if (category === "icons") return "iconography";
  if (category === "spacing") return /(?:height|width|size|control)/i.test(token?.name ?? "") ? "size-control" : "spacing-density";
  if (category === "radius") return "radius";
  if (category === "stroke") return "stroke";
  if (category === "shadow") return "shadow-elevation";
  if (category === "opacity" || category === "blur") return "opacity-blur";
  if (category === "layer") return "layer";
  if (category === "motion") return "motion";
  if (category === "other" && /(?:grid|layout|column|row|container|breakpoint|screen|viewport)/i.test(token?.name ?? "")) return "grid-layout";
  return null;
}

function compactUsage(usage) {
  return usage ? {
    summary: usage.summary ?? "",
    features: usage.features ?? [],
    components: usage.components ?? [],
    pages: usage.pages ?? [],
    scopes: usage.scopes ?? [],
    states: usage.states ?? [],
    examples: usage.examples ?? [],
  } : null;
}

function compactToken(token) {
  return {
    id: token.id,
    name: token.name,
    normalizedName: token.normalizedName,
    category: token.category,
    value: token.value,
    resolvedValue: token.resolvedValue ?? token.value,
    file: token.file,
    line: token.line,
    usage: compactUsage(token.usage),
    semantic: token.semantic ?? null,
  };
}

function compactDirectStyle(item) {
  return {
    id: item.id,
    category: item.category,
    group: item.group,
    scene: item.scene,
    property: item.property,
    properties: item.properties ?? [],
    value: item.value,
    normalizedColor: item.normalizedColor ?? null,
    sourceValues: item.sourceValues ?? [item.value],
    syntaxCounts: item.syntaxCounts ?? {},
    occurrences: item.occurrences,
    files: item.files ?? [],
    contexts: item.contexts ?? [],
    examples: item.examples ?? [],
    usage: compactUsage(item.usage),
    semantic: item.semantic ?? null,
  };
}

function compactGraphicAsset(asset) {
  return {
    id: asset.id,
    name: asset.name,
    importedName: asset.importedName ?? asset.name,
    localName: asset.localName ?? asset.name,
    source: asset.source,
    collection: asset.collection,
    type: asset.type,
    kind: asset.kind,
    preview: asset.preview,
    previewStatus: asset.previewStatus ?? (asset.preview ? "resolved" : "unresolved"),
    viewBox: asset.viewBox,
    width: asset.width,
    height: asset.height,
    strokeWidth: asset.strokeWidth,
    fill: asset.fill,
    stroke: asset.stroke,
    sourceStatus: asset.sourceStatus,
    lifecycleStatus: asset.lifecycleStatus,
    runtimeStatus: asset.runtimeStatus,
    buildStatus: asset.buildStatus,
    exposure: asset.exposure,
    governance: asset.governance,
    referenceCount: asset.referenceCount,
    productionReferenceCount: asset.productionReferenceCount,
    references: asset.references ?? [],
    usage: asset.usage ?? { features: [], components: [], pages: [] },
  };
}

function buildIconReview(assets) {
  const count = (predicate) => assets.filter(predicate).length;
  const sources = new Map();
  for (const asset of assets) {
    const key = asset.collection || asset.source || "unknown";
    if (!sources.has(key)) sources.set(key, { source: key, count: 0, uiIcons: 0, sourceReferenced: 0, keep: 0, migrate: 0, merge: 0, delete: 0, externalCheck: 0 });
    const source = sources.get(key);
    source.count += 1;
    source.uiIcons += asset.kind === "ui-icon" ? 1 : 0;
    source.sourceReferenced += asset.sourceStatus === "source-used" ? 1 : 0;
    source[asset.governance?.recommendation === "verify-external" ? "externalCheck" : asset.governance?.recommendation] += 1;
  }
  const sortedSources = [...sources.values()].sort((left, right) => right.uiIcons - left.uiIcons || right.sourceReferenced - left.sourceReferenced || right.count - left.count || left.source.localeCompare(right.source));
  const primarySource = sortedSources.find((item) => item.uiIcons && /(?:packages|components|ui|icons)/i.test(item.source)) ?? sortedSources.find((item) => item.uiIcons) ?? null;
  const actionCount = (action) => count((item) => item.governance?.recommendation === action);
  const deleteRecommended = actionCount("delete");
  const externalCheck = actionCount("verify-external");
  return {
    runtimeStatus: "unverified",
    primarySource: primarySource?.source ?? null,
    summary: {
      totalGraphicAssets: assets.length,
      uiIcons: count((item) => item.kind === "ui-icon"),
      brandMarks: count((item) => item.kind === "brand-mark"),
      illustrations: count((item) => item.kind === "illustration"),
      placeholders: count((item) => item.kind === "placeholder"),
      cursors: count((item) => item.kind === "cursor"),
      otherGraphics: count((item) => item.kind === "graphic-asset"),
      sourceReferenced: count((item) => item.sourceStatus === "source-used"),
      testOrBuildOnly: count((item) => item.sourceStatus === "test-or-build-only"),
      repositoryOnly: count((item) => item.sourceStatus === "repository-only"),
      keep: actionCount("keep"),
      migrate: actionCount("migrate"),
      merge: actionCount("merge"),
      delete: deleteRecommended,
      externalCheck,
      runtimeVerified: count((item) => item.runtimeStatus === "verified"),
      runtimeUnverified: count((item) => item.runtimeStatus !== "verified"),
    },
    sources: sortedSources,
    batches: [
      { action: "keep", count: actionCount("keep"), assets: assets.filter((item) => item.governance?.recommendation === "keep").map((item) => item.id) },
      { action: "migrate", count: actionCount("migrate"), assets: assets.filter((item) => item.governance?.recommendation === "migrate").map((item) => item.id) },
      { action: "merge", count: actionCount("merge"), assets: assets.filter((item) => item.governance?.recommendation === "merge").map((item) => item.id) },
      { action: "delete", count: deleteRecommended, assets: assets.filter((item) => item.governance?.recommendation === "delete").map((item) => item.id) },
      { action: "verify-external", count: externalCheck, assets: assets.filter((item) => item.governance?.recommendation === "verify-external").map((item) => item.id) },
    ],
    recommendations: [
      {
        id: "primary-source",
        action: "keep",
        title: text("明确一个 UI Icon 主来源", "Establish one primary UI Icon source"),
        detail: text(primarySource ? `优先复核 ${primarySource.source} 作为内部主来源，其他图标库只承担明确补充职责。` : "当前尚未识别出稳定的 UI Icon 主来源。", primarySource ? `Review ${primarySource.source} as the internal primary source; keep other libraries as explicit supplements only.` : "No stable primary UI Icon source is identified yet."),
      },
      {
        id: "separate-graphics",
        action: "separate",
        title: text("UI Icon 与品牌、插画资产分开治理", "Govern UI Icons separately from brand and illustration assets"),
        detail: text("Logo、Hero 图形、人物插画、占位图和 Cursor 不参与 UI Icon 尺寸与线宽收敛。", "Logos, hero graphics, portraits, placeholders, and cursors do not participate in UI Icon size and stroke convergence."),
      },
      {
        id: "delete-qualified",
        action: "delete",
        title: text(`${deleteRecommended} 个资产已建议删除`, `${deleteRecommended} assets are recommended for deletion`),
        detail: text("这些资产已经通过静态消费者、公共契约与动态加载检查；批准批次后，Skill 应自动执行生产构建、运行时基线和试删除回归，而不是要求用户逐个判断。", "These assets passed static-consumer, public-contract, and dynamic-loading checks. After batch approval, the Skill must automatically run the production build, runtime baseline, and trial-removal regression instead of asking the user to decide item by item."),
      },
      {
        id: "external-blockers",
        action: "verify-external",
        title: text(`${externalCheck} 个资产被外部证据阻塞`, `${externalCheck} assets are blocked by external evidence`),
        detail: text("仅公共 URL、动态加载或无法从仓库确认产品职责的资产进入集中核验；它们不是普通用户逐项评审任务。", "Only public URLs, dynamic loaders, or assets whose product responsibility cannot be confirmed from the repository enter one grouped verification step; they are not routine per-item user decisions."),
      },
    ],
  };
}

function decisionCategory(item) {
  const category = item.systemPath?.category ?? "";
  if (/color/.test(category)) return "color";
  if (/typography/.test(category)) return "typography";
  if (/spacing|density/.test(category)) return "spacing-density";
  if (/shape|stroke|radius/.test(category)) return "stroke";
  if (/depth|layer|shadow/.test(category)) return "shadow-elevation";
  if (/icon/.test(category)) return "iconography";
  if (/motion/.test(category)) return "motion";
  return null;
}

function nodeStatus({ currentCount, actions, decisionCount, missing = false }) {
  if (decisionCount > 0) return "needs-decision";
  if (actions.some((item) => item.action === "merge")) return "needs-consolidation";
  if (actions.some((item) => item.action === "migrate")) return "migration-ready";
  if (currentCount > 0) return "existing";
  return missing ? "missing" : "missing";
}

function actionSummary(actions) {
  return {
    migrate: actions.filter((item) => item.action === "migrate").length,
    merge: actions.filter((item) => item.action === "merge").length,
    delete: actions.filter((item) => item.action === "delete").length,
  };
}

function tokenBelongsToFoundation(definition, token) {
  const name = `${token.name} ${token.normalizedName}`;
  if (definition.id === "grid-layout") return /(?:grid|layout|column|row|container|breakpoint|screen|viewport)/i.test(name);
  if (!definition.categories.includes(token.category)) return false;
  if (definition.id === "spacing-density") return !/(?:width|height|size|control)/i.test(name);
  if (definition.id === "size-control") return /(?:width|height|size|control)/i.test(name);
  return true;
}

function directStyleBelongsToFoundation(definition, item) {
  const name = `${item.property ?? ""} ${item.value}`;
  if (definition.id === "grid-layout") return /(?:grid|layout|column|row|container|breakpoint|screen|viewport)/i.test(name);
  if (!definition.categories.includes(item.category)) return false;
  if (definition.id === "spacing-density") return !/(?:width|height)/i.test(name);
  if (definition.id === "size-control") return /(?:width|height)/i.test(name);
  return true;
}

export function buildUIKitBlueprint(report, library, tokenContract, reviewBrief) {
  const tokens = library?.tokens ?? [];
  const tokenById = new Map(tokens.map((item) => [item.id, item]));
  const actions = (tokenContract?.lifecycle ?? []).map((action) => {
    const sourceTokens = action.currentTokens.map((item) => tokenById.get(item.id)).filter(Boolean);
    const category = categoryForAction(action, tokenById);
    const foundationId = foundationIdForCategory(category, sourceTokens[0]);
    return {
      ...action,
      category,
      foundationId,
      currentTokens: action.currentTokens.map((item) => {
        const token = tokenById.get(item.id);
        return {
          id: item.id,
          name: item.name,
          file: item.file,
          line: item.line,
          value: token?.value ?? null,
        };
      }),
      features: unique([...action.usage, ...sourceTokens.flatMap((item) => item.usage?.features ?? [])]),
      components: unique(sourceTokens.flatMap((item) => item.usage?.components ?? [])),
      pages: unique(sourceTokens.flatMap((item) => item.usage?.pages ?? [])),
    };
  });
  const decisions = reviewBrief?.decisionPackages ?? [];
  const foundation = FOUNDATION.map((definition) => {
    const nodeTokens = tokens.filter((item) => tokenBelongsToFoundation(definition, item));
    const nodeTargets = (tokenContract?.targetTokens ?? []).filter((item) => tokenBelongsToFoundation(definition, item));
    const nodeActions = actions.filter((item) => item.foundationId === definition.id);
    const nodeDecisions = decisions.filter((item) => decisionCategory(item) === definition.id);
    const directStyles = (library?.directStyles ?? []).filter((item) => directStyleBelongsToFoundation(definition, item));
    const graphicAssets = definition.id === "iconography" ? (library?.icons ?? []) : [];
    const iconReview = definition.id === "iconography" ? buildIconReview(graphicAssets) : null;
    const currentAssets = graphicAssets.length;
    const defaultStatus = nodeStatus({ currentCount: nodeTokens.length + directStyles.length + currentAssets, actions: nodeActions, decisionCount: nodeDecisions.length });
    return {
      ...definition,
      status: definition.id === "iconography" && (iconReview.summary.migrate || iconReview.summary.merge || iconReview.summary.delete || iconReview.sources.filter((item) => item.uiIcons).length > 1) ? "needs-consolidation" : defaultStatus,
      currentCount: nodeTokens.length,
      currentAssets,
      directValueCount: directStyles.length,
      directOccurrenceCount: directStyles.reduce((sum, item) => sum + (item.occurrences ?? 0), 0),
      directClusterCount: directStyles.length,
      targetCount: nodeTargets.length,
      actionIds: nodeActions.map((item) => item.id),
      actionSummary: actionSummary(nodeActions),
      decisionIds: nodeDecisions.map((item) => item.id),
      decisionCount: nodeDecisions.length,
      targetTokenNames: nodeTargets.map((item) => item.name),
      currentTokens: (["color", "typography"].includes(definition.id) ? nodeTokens : nodeTokens.slice(0, 160)).map(compactToken),
      directStyles: (["color", "typography"].includes(definition.id) ? directStyles : directStyles.slice(0, 160)).map(compactDirectStyle),
      iconReview,
      assets: graphicAssets.map(compactGraphicAsset),
      functions: unique([...nodeTokens.flatMap((item) => item.usage?.features ?? []), ...directStyles.flatMap((item) => item.usage?.features ?? [])]),
    };
  });

  const candidatesByPrimitive = new Map();
  for (const candidate of report.componentCandidates ?? []) {
    if (!candidatesByPrimitive.has(candidate.primitive)) candidatesByPrimitive.set(candidate.primitive, []);
    candidatesByPrimitive.get(candidate.primitive).push(candidate);
  }
  const duplicated = new Set((report.duplicatedPrimitives ?? []).map((item) => item.primitive));
  const emptyComponentSystem = (report.componentCandidates ?? []).length === 0;
  const componentLayers = COMPONENT_LAYERS.map((layer) => ({
    ...layer,
    nodes: layer.items.map((primitive) => {
      const candidates = candidatesByPrimitive.get(primitive) ?? [];
      const owners = candidates.filter((item) => item.role === "owner");
      const adapters = candidates.filter((item) => item.role === "adapter");
      const decisionCount = duplicated.has(primitive) ? 1 : 0;
      const status = decisionCount ? "needs-decision" : owners.length > 1 ? "needs-consolidation" : owners.length ? "existing" : adapters.length ? "migration-ready" : "missing";
      const buildRecommendation = status !== "missing" ? "reuse-existing" : emptyComponentSystem && STARTER_COMPONENTS.has(primitive) ? "build-starter" : "defer";
      const label = LABELS[primitive] ?? [primitive, primitive];
      return {
        id: primitive,
        label: text(label[0], label[1]),
        status,
        owners,
        adapters,
        currentCount: candidates.length,
        decisionCount,
        buildRecommendation,
        proposal: buildRecommendation === "build-starter",
        evidence: buildRecommendation === "build-starter" ? "standard-starter-proposal" : status === "missing" ? "not-detected" : "source-detected",
        contract: componentContract(primitive),
      };
    }),
  }));

  const patternFeatures = unique([
    ...tokens.flatMap((item) => item.usage?.features ?? []),
    ...(library?.directStyles ?? []).flatMap((item) => item.usage?.features ?? []),
  ]).filter((item) => !/^(?:styles?|components?|ui)$/i.test(item)).slice(0, 18);
  const patterns = patternFeatures.map((feature) => ({ id: feature.toLowerCase().replace(/[^a-z0-9]+/g, "-"), label: feature, status: "existing" }));

  const implementationSlices = foundation
    .filter((item) => item.actionIds.length || item.decisionCount)
    .map((item, index) => ({
      id: `slice-${String(index + 1).padStart(2, "0")}-${item.id}`,
      label: item.label,
      foundationId: item.id,
      blocked: item.decisionCount > 0,
      actions: item.actionSummary,
      actionIds: item.actionIds,
      targetTokens: item.targetTokenNames,
      functions: unique(actions.filter((action) => item.actionIds.includes(action.id)).flatMap((action) => action.features)).slice(0, 12),
      pages: unique(actions.filter((action) => item.actionIds.includes(action.id)).flatMap((action) => action.pages)).slice(0, 12),
      validationStates: item.id === "color" ? ["light", "dark", "hover", "focus", "disabled", "overlay"]
        : item.id === "typography" ? ["desktop", "mobile", "Chinese", "English", "overflow"]
          : item.id === "spacing-density" || item.id === "grid-layout" ? ["desktop", "tablet", "mobile", "dense", "comfortable"]
            : ["default", "interactive", "responsive"],
    }));

  const allNodes = [...foundation, ...componentLayers.flatMap((item) => item.nodes)];
  const proposedComponents = componentLayers.flatMap((item) => item.nodes).filter((item) => item.proposal);
  return {
    schemaVersion: 1,
    model: "current-to-target-governance",
    foundation,
    componentLayers,
    componentSetup: {
      mode: emptyComponentSystem ? "starter-proposal" : "map-existing",
      scannedCandidates: report.componentCandidates?.length ?? 0,
      proposedCount: proposedComponents.length,
      proposedComponentIds: proposedComponents.map((item) => item.id),
      writeBoundary: "review-only-until-approved",
    },
    patterns,
    actions,
    implementationSlices,
    summary: {
      targetNodes: allNodes.length,
      existing: allNodes.filter((item) => item.status === "existing").length,
      migrationReady: allNodes.filter((item) => item.status === "migration-ready").length,
      needsConsolidation: allNodes.filter((item) => item.status === "needs-consolidation").length,
      missing: allNodes.filter((item) => item.status === "missing").length,
      needsDecision: allNodes.filter((item) => item.status === "needs-decision").length,
      decisions: decisions.length,
      ...actionSummary(actions),
    },
  };
}

export const STANDARD_UIKIT_FOUNDATION = FOUNDATION;
export const STANDARD_UIKIT_COMPONENT_LAYERS = COMPONENT_LAYERS;
