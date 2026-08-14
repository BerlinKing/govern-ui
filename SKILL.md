---
name: govern-ui
description: Govern frontend design systems by auditing competing design-token systems, unclear token or component ownership, hardcoded visual values, duplicated primitives, and overlay/layer debt. Use when Codex needs to inspect CSS variables, Tailwind themes, JS/TS theme objects, shared UI components, Dialog/Popover/Toast ownership, design-system maturity, historical baselines, or new design debt; generate evidence-backed JSON, Markdown, and offline HTML review artifacts before any migration or component-library work.
---

# GovernUI

Audit first. Do not modify application code during the Lite workflow.

## Workflow

1. Read repository instructions and identify the real repository root.
2. Inspect the working tree without cleaning, formatting, installing, or rewriting it.
3. Run the deterministic scanner. By default it excludes documentation, tests, fixtures, public/static assets, generated output, and tool metadata so product-source evidence is not mixed with historical or third-party material:

   ```bash
   node <skill-dir>/scripts/govern.mjs audit <repo>
   ```

4. Review the reported source owners and unassessed areas in the actual source files. Correct semantic conclusions in the explanation; do not rewrite scanner evidence.
5. Create a report in a temporary directory outside the repository for every non-trivial audit, especially when conflicts exist or component-library work is being considered:

   ```bash
   report_dir="$(mktemp -d)"
   node <skill-dir>/scripts/govern.mjs report <repo> --out "$report_dir"
   ```

   Open `token-review.html` for the user. Use its Token comparison and its static/dynamic UI-library blueprint to make uncertainty visible. Treat selections as a decision draft only. Unreviewed groups are omitted from exports; `defer` is always an explicit choice. Do not modify source until the user explicitly confirms the exported decision JSON in a later implementation phase.
6. Recommend `Bootstrap`, `Migrate`, or `Hybrid` with an explicitly heuristic evidence score. Correct the recommendation when inspected ownership or scope evidence contradicts the heuristic. Stop after the recommendation unless the user separately authorizes Full-mode implementation.

## Commands

```text
audit <repo> [--json]
report <repo> --out <directory>
baseline accept <repo> --out <baseline.json>
baseline status <repo> --baseline <baseline.json> [--json]
check <repo> --baseline <baseline.json> [--json]
decisions validate <token-decisions.json>
```

- `audit` and `check` are read-only.
- `report` writes only to the explicit output directory.
- `baseline accept` writes only to the explicit output file.
- `check` fails only for new high-confidence findings; unchanged historical debt remains visible.

## Interpretation Rules

- Distinguish syntax adapters from competing systems. Tailwind consuming CSS variables is usually one system, not two.
- Compare canonical definitions for semantic conflicts. Keep framework-local keys such as Tailwind animation `from`/`to` out of canonical Token conflicts.
- Treat theme, brand, and application scope overrides as intentional only when selectors, aliases, or source structure provide evidence.
- Never merge Tokens solely because their rendered values match.
- Treat same-value/different-name matches as non-blocking `value-collision` observations, not decision groups.
- Report ambiguous semantics for review instead of inventing a canonical owner.
- Treat exact primitive filenames as component-owner candidates. Treat same-named wrappers that import a shared primitive as adapters; do not infer ownership from feature names ending in `Dialog`, `Button`, or similar words.
- Treat Canvas geometry, data-visualization colors, illustration gradients, third-party styles, generated files, and media dimensions as possible exceptions, never as silent exclusions.
- Separate source-verified, inferred, and unassessed conclusions.
- Preserve unrelated dirty work and never mutate proxy or routing rules.

## Evidence and Decisions

Every actionable finding must include a rule ID, severity, confidence, normalized file path, line, evidence excerpt, stable fingerprint, and suggested action.

Use these Token relationship classes:

- `adapter`: one representation consumes another.
- `scope-override`: theme, brand, state, or application override with evidence.
- `duplicate`: repeated definitions that may share responsibility.
- `value-collision`: different canonical names share a rendered value; observation only.
- `semantic-conflict`: the same Token name resolves to incompatible values outside an evidenced scope.
- `owner-conflict`: multiple unconnected source-of-truth candidates.
- `bypass`: consumers use raw values despite an existing Token source.

Read [rules.md](references/rules.md) when evaluating findings or exceptions. Read [report-schema.md](references/report-schema.md) when consuming JSON, baseline, or decision artifacts.

## Completion Standard

For a Lite audit, report:

- repository profile and scanned/unassessed scope;
- Token definition, alias, and consumer owners;
- component and overlay owner candidates;
- a visible static foundation/atom/molecule/component blueprint and separate dynamic state, Portal, layer, keyboard, focus, dismissal, scroll, and motion contracts;
- relationship and conflict groups;
- Bootstrap/Migrate/Hybrid recommendation with at least three evidence points;
- historical/new/stale baseline status when requested;
- the absolute HTML report path when generated;
- known limitations without presenting static inference as runtime verification.

Do not claim component behavior, accessibility, responsive rendering, or visual parity was verified unless those surfaces were actually run and inspected.
