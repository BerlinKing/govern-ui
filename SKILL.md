---
name: govern-ui
description: Govern frontend design systems with a user-first visual review of static foundations, atoms, molecules, components, patterns, dynamic interaction contracts, competing design-token systems, ownership, hardcoded values, duplicated primitives, and overlay debt. Use when Codex needs to audit CSS variables, Tailwind themes, JS/TS theme objects, shared UI components, design-system maturity, historical baselines, or new design debt; translate source evidence into understandable bilingual HTML decisions before any migration or component-library work.
---

# GovernUI

Audit first. Do not modify application code during the Lite workflow.

## Workflow

1. Read repository instructions and identify the real repository root.
2. Inspect the working tree without cleaning, formatting, installing, or rewriting it.
3. Read [system-review-taxonomy.md](references/system-review-taxonomy.md). Use its complete static-five-layer and dynamic-four-layer model as the report outline. Treat the scanner as an evidence engine, never as the information architecture.
4. Run the deterministic scanner. By default it excludes documentation, tests, fixtures, public/static assets, generated output, and tool metadata so product-source evidence is not mixed with historical or third-party material:

   ```bash
   node <skill-dir>/scripts/govern.mjs audit <repo>
   ```

5. Review the reported source owners and unassessed areas in the actual source files. Correct semantic conclusions in the explanation; do not rewrite scanner evidence.
6. For every non-trivial review, author a bilingual visual review brief after inspecting the relevant source and, when safely available, the real rendered screens. Read [review-brief-schema.md](references/review-brief-schema.md). Place every decision under a valid system path. Every decision must explain the standard contract, current state, target result, Codex recommendation, user choices, and plain-language evidence. Never invent an exact target appearance from static evidence alone.
7. Validate and render the brief in a temporary directory outside the repository:

   ```bash
   report_dir="$(mktemp -d)"
   node <skill-dir>/scripts/govern.mjs brief validate "$report_dir/review-brief.json"
   node <skill-dir>/scripts/govern.mjs report <repo> --out "$report_dir" --brief "$report_dir/review-brief.json"
   ```

   Open `token-review.html` for the user. Lead with the complete system review matrix, not scanner totals or conflict groups. Every category must remain visible as detected, partial, fragmented, missing, not detected, or unverified. Present each expanded category as a design-library specification sheet in the user's decision order: category purpose, current visual or state matrix, standard target, keep/merge/scope recommendation, and decision. For foundations, show real scales and roles. For atoms and molecules, show anatomy, hierarchy, variants, sizes, content combinations, and states when evidence exists. For components and patterns, show realistic compositions and modes. For dynamic categories, show state, transition, focus, layer, or orchestration matrices. Put raw paths, code, owners, findings, counts, and scan coverage in collapsed engineer details. Treat selections as a decision draft only. Unreviewed groups are omitted from exports; `defer` is always an explicit choice. The user returns the exported `govern-ui-decisions.json`, not the edited HTML. Do not modify source until the user explicitly confirms that draft in a later implementation phase.
8. Recommend `Bootstrap`, `Migrate`, or `Hybrid` in the technical explanation, but translate that lane into a direct product conclusion in the visual brief. Correct the recommendation when inspected ownership or scope evidence contradicts the heuristic. Stop after the recommendation unless the user separately authorizes Full-mode implementation.

## Commands

```text
audit <repo> [--json]
report <repo> --out <directory> [--brief <review-brief.json>]
brief validate <review-brief.json>
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
- Distinguish definition count, unique values, usage/reference count, hardcoded occurrences, owner files, scopes, and runtime coverage. Never collapse them into one "Token count".
- For color, separate declared primary/secondary/tertiary roles from observed use in real primary actions. Source names alone cannot prove the visual hierarchy.
- For color, group canonical definitions into user-visible color sources before listing implementation syntax. Render real palette lanes, a semantic-role comparison matrix, hardcoded-value mappings, explicit keep/merge/scope recommendations, and a source-derived target contract. Describe owners as “global candidate”, “theme or brand colors”, or “likely legacy colors”; keep paths secondary.
- Target one global semantic color contract with controlled theme, brand, product, data-visualization, and illustration mappings. Do not describe the goal as one flat list of literal colors.
- For typography, spacing/density, shape/stroke, and depth/layer, group canonical definitions into independent sources, compare them against standard role families, render their real values as visual specimens, group bypasses, and state which source should be kept, merged, scoped, or verified. Do not fall back to a count-only category card when this evidence exists.
- Distinguish ordinary framework utilities from direct-value bypasses. A class such as `gap-2` is adoption and scale evidence, not automatically debt; an arbitrary value or raw CSS literal remains a review candidate.
- For icons and assets, distinguish approved libraries, repository-owned SVG collections, imported assets, inline SVGs, and Icon/Image/Avatar components. Compare grid, stroke, and fill conventions. Never select inline SVG usage as the preferred library when a real package or owned asset collection exists.
- Show each category's standard definition, current inventory, current visual/state model, gap, target model, recommendation, user decision, and collapsed engineer evidence.
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

Read [rules.md](references/rules.md) when evaluating findings or exceptions. Read [system-review-taxonomy.md](references/system-review-taxonomy.md) before structuring any non-trivial audit. Read [report-schema.md](references/report-schema.md) when consuming JSON, baseline, or decision artifacts.
Read [review-brief-schema.md](references/review-brief-schema.md) before authoring any non-trivial HTML review.

## Completion Standard

For a Lite audit, report:

- a plain-language conclusion that says what to keep, what to change first, and what still needs verification;
- a complete system review matrix organized as static Foundation → Atoms → Molecules → Components → Patterns and dynamic Interaction foundation → Component behavior → Cross-component orchestration → Flow and lifecycle;
- every leaf category shown even when source evidence is absent or runtime verification is pending;
- every expanded category presented as a designer-facing specification sheet, with real visual/state comparison axes rather than a count-first dashboard;
- Token definition, alias, and consumer owners;
- component and overlay owner candidates;
- visual decision cards placed inside the system taxonomy and showing the standard contract, current state, target result, recommendation, consequences, and user choices;
- a user-facing color workbench that answers whether a palette exists, how many independent color sources exist, how semantic roles differ, what bypasses the system, what to keep or merge, and what the governed target becomes;
- dedicated designer-facing workbenches for typography, spacing/density, shape/stroke, depth/layer, and icons/assets, each showing current sources, real specimens or visual contracts, standard role coverage, bypasses, consolidation actions, and a source-derived target;
- plain-language facts and impact, with raw source evidence collapsed into engineer details;
- Bootstrap/Migrate/Hybrid recommendation with at least three evidence points;
- historical/new/stale baseline status when requested;
- the absolute HTML report path when generated;
- known limitations without presenting static inference as runtime verification.

Do not claim component behavior, accessibility, responsive rendering, or visual parity was verified unless those surfaces were actually run and inspected.
