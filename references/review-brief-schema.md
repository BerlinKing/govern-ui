# Visual Review Brief

The audit report is deterministic evidence. The visual review brief is the human-readable layer Codex authors after inspecting real source ownership and, when safely available, the rendered product.

Use it for every non-trivial HTML review. Do not expose scanner terminology as the primary user experience.

## Required structure

```json
{
  "schemaVersion": 2,
  "reportId": "copy from audit.json",
  "repoId": "copy from audit.json",
  "authoredBy": "codex-review",
  "summary": {
    "verdict": { "zh": "一句直接结论", "en": "One direct conclusion" },
    "explanation": { "zh": "为什么这样判断", "en": "Why this is the recommendation" },
    "keep": [{ "zh": "保留什么", "en": "What to keep" }],
    "changeFirst": [{ "zh": "先处理什么", "en": "What to change first" }],
    "later": [{ "zh": "后续验证什么", "en": "What to verify later" }]
  },
  "decisionPackages": []
}
```

Every user-facing string must contain `zh` and `en`. Source paths, identifiers, and verbatim source excerpts remain untranslated.

## Decision package

Each package must answer four questions in order:

1. What does the product have now?
2. What should the target look like or how should it be structured?
3. What does Codex recommend and why?
4. What outcome can the user choose?

```json
{
  "id": "overlay-contract",
  "conflictIds": [],
  "findingFingerprints": ["1b9a458e24ab1fe8c4285fd9"],
  "category": "token | component | overlay | ownership | behavior",
  "systemPath": {
    "system": "static | dynamic",
    "layer": "foundation | atoms | molecules | components | patterns | interaction-foundation | component-behavior | cross-component-orchestration | flow-lifecycle",
    "category": "color | typography | spacing-density | overlay-components | portal-layering | ..."
  },
  "standard": { "zh": "这个类别在标准设计系统里应该解决什么", "en": "What this category should solve in a standard design system" },
  "visualizer": "token-comparison | component-comparison | layer-stack | ownership-flow | behavior-contract",
  "title": { "zh": "浮层现在有五套高度规则", "en": "Overlays currently use five stacking scales" },
  "question": { "zh": "是否统一成一套语义层级？", "en": "Should overlays use one semantic layer scale?" },
  "current": {
    "summary": { "zh": "当前现状", "en": "Current state" },
    "specimens": []
  },
  "target": {
    "summary": { "zh": "目标效果", "en": "Target result" },
    "specimens": []
  },
  "recommendation": {
    "decision": "canonical | keep-separate | alias | migrate | exception | not-conflict | defer",
    "canonicalOwnerId": null,
    "summary": { "zh": "建议内容", "en": "Recommendation" },
    "reasons": [{ "zh": "产品理由", "en": "Product reason" }],
    "confidence": 0.82,
    "limitation": { "zh": "仍未验证的部分", "en": "What remains unverified" }
  },
  "choices": [
    {
      "decision": "migrate",
      "label": { "zh": "采用建议", "en": "Use the recommendation" },
      "consequence": { "zh": "选择后的真实影响", "en": "The real consequence of this choice" },
      "canonicalOwnerId": null
    },
    {
      "decision": "defer",
      "label": { "zh": "暂时不决定", "en": "Decide later" },
      "consequence": { "zh": "需要补充哪些信息", "en": "What information is still needed" }
    }
  ],
  "evidence": [
    {
      "fact": { "zh": "用普通语言说明确认的事实", "en": "State the confirmed fact in plain language" },
      "impact": { "zh": "解释这对用户或团队的影响", "en": "Explain the impact on users or the team" },
      "sourceRefs": [
        { "file": "src/styles/layers.css", "line": 18, "excerpt": "z-index: 10000" }
      ]
    }
  ]
}
```

Every package must reference at least one audit item. Use `conflictIds` for relationship groups and `findingFingerprints` for actionable findings such as an undefined reference, duplicated primitive, or raw overlay layer. A package may reference both. Findings-only packages remain available in `packageDecisions`; the compatibility `decisions` array only flattens relationship conflicts.

`systemPath` is mandatory in schema version 2. For Product C, group decisions by module and link the matching confirmed Product B atomic role. The static-five/dynamic-four model is available only for a separately requested extended component or behavior review. Do not create an unclassified decision card when a specific category is known. `standard` must explain the healthy design-system contract before discussing repository evidence.

## Specimens

Specimens are structured visual data, never arbitrary HTML. Supported `type` values:

- `color`: set `value` to a CSS color.
- `spacing`: set `value` to a length such as `16px`.
- `radius`: set `value` to a radius such as `8px`.
- `typography`: set `value` to the relevant typography value or short contract.
- `component`: set `component` to `button`, `input`, or `card`; optionally provide an `appearance` object using `background`, `color`, `borderColor`, `borderRadius`, `fontFamily`, `fontSize`, `fontWeight`, `boxShadow`, or `padding`.
- `layer`: set `value` to the relative layer number or semantic layer name.
- `ownership`: set `value` to a source label or path.
- `behavior`: provide `states` or a short `value` list.
- `value`: show a literal product value.
- `rule`: show a plain-language target rule when an exact visual value would be dishonest.

Every specimen requires a localized `label`. A localized `detail` is optional.
Use an optional localized `display` when the dominant visual needs designer-facing copy while `value` preserves the source or contract value.

The HTML groups specimens into designer-facing comparison matrices. Author enough structured specimens to expose the real comparison axes for the category—for example role and theme for Color, hierarchy/size/state/content for Button, input type/state/content for Input, and size/mode/content/action layout for Dialog. Do not replace these matrices with totals when source evidence can produce real examples. If a mode or state is not evidenced, label it unverified instead of fabricating a preview.

## Authoring rules

- Use Product B atomic roles inside Product C module groups; consult [system-review-taxonomy.md](system-review-taxonomy.md) for Foundation details or an explicitly requested extended review. Place repository evidence into the relevant category. Never let scanner rule names become the report outline.
- Write the visible report from the user's decision perspective. Name the product-facing system or role first; keep source syntax, file paths, rule IDs, and code as secondary or collapsed evidence.
- Group raw conflicts into the smallest set of product decisions a user can reasonably make inside one system category. Do not create one card per scanner finding.
- Keep the complete taxonomy in Product B; Product C initially shows only groups needing attention. A missing scanner finding is not proof that the category is healthy.
- For every decision card, make the element itself the dominant surface: current specimens, target specimens, one question, one recommendation, then choices. Keep standard-contract explanation, limitations, and evidence collapsed.
- Make the visible category read like a component-library comparison sheet, not a prose report. Never reduce the element to a small badge while explanatory text dominates the card.
- State each idea once. Do not restate one diagnosis across the title, question, current summary, target summary, recommendation, and disclaimer.
- Use real current values in `current.specimens`.
- Use concrete proposed values or component appearances in `target.specimens` only when source/runtime evidence supports them.
- When the exact target cannot be inferred, show the target structural rule with a `rule` specimen and state the missing verification in `recommendation.limitation`.
- Do not use confidence percentages as a substitute for reasoning. The HTML translates confidence into plain-language strength and shows the reasons.
- Write evidence as `fact` plus `impact`. Keep paths and code only in `sourceRefs`, which the HTML hides in engineer details.
- Provide 2 to 4 choices. Make each consequence explicit. Include `defer` when material product context is missing.
- A review export remains a draft and never authorizes source changes.
