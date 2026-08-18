---
name: govern-ui
description: Audit, govern, and visually verify a frontend design system. Extract a real atomic style library with Token-to-feature usage, generate a designer-facing semantic Token and component review, plan old-Token migration/merge/delete actions, capture pre-cleanup baselines, implement approved cleanup, and produce before/after visual regression. Use for design-system inventory, review, consolidation, migration, cleanup, or regression validation.
---

# GovernUI

GovernUI has three separate, connected products. Never collapse them into one technical report.

## Choose the mode

- Product A, `library`: what styles exist and where they appear. Produce `style-library.html` without diagnosis.
- Product B, `review`: what the system should become and how old Tokens should migrate, merge, or delete. Produce `design-review.html` plus `govern-ui-token-contract.json`.
- Product C, `regression`: whether approved source cleanup preserved or intentionally changed real page states. Produce `visual-regression.html` plus `governance-diff.json`.
- Generate only the requested products, but use all three for a complete governance project.

## Workflow

1. Read repository instructions and locate the real frontend root.
2. Inspect the working tree without cleaning, formatting, installing, or rewriting it.
3. Generate Products A and B into a temporary directory outside the target repository.

   ```bash
   output_dir="$(mktemp -d)"
   node <skill-dir>/scripts/govern.mjs library <repo> --out "$output_dir"
   node <skill-dir>/scripts/govern.mjs review <repo> --out "$output_dir"
   ```

4. Qualify deprecation candidates automatically: scan static and dynamic references, public/package contracts, duplicate geometry, build reachability, and available runtime states. Refresh Product B with concrete keep/migrate/merge/delete recommendations.
5. Before cleanup, capture a source snapshot and a visual baseline for the agreed route/state matrix. Missing runtime access is an implementation gate, not a reason to ask the user to guess each asset.
6. Ask the user to approve Product B batches. Approval must name accepted lifecycle batches or return the exported JSON.
7. Only when source changes are authorized, implement small vertical batches and keep a migration ledger: old Token or asset, final action, target, affected function/page/state, files, and verification status.
8. Re-scan the changed source, create the after snapshot, capture the identical visual states, and generate Product C.
9. Return absolute artifact paths, changed scope, remaining direct values, unverified states, and rollback boundaries.

The `report` command remains a compatibility alias for `library`.

## Atomic library contract

Produce one bilingual, self-contained, offline `style-library.html` with a white canvas, black information hierarchy, search, copy actions, and an exportable Token map.

Keep this visible order:

1. Colors: background, text, border/stroke, icon/fill, brand/action, feedback, data visualization, remaining colors.
2. Typography: families, roles, size, weight, line height, letter spacing, composites.
3. UI Icons and graphic assets: classify package imports, repository SVGs, local imports, and inline SVGs into UI Icons, brand marks, illustrations, placeholders, cursors, and other graphics; keep the complete catalog visible.
4. Shadows.
5. Stroke widths and styles.
6. Border radius.
7. Spacing and sizing.
8. Opacity and scrims.
9. Blur and filters.
10. Layers and z-index.
11. Motion parameters.
12. Unclassified Tokens.
13. Complete Token mapping table.

Exclude colors embedded inside illustrations, logos, decorative SVGs, raster images, and other graphic assets from the atomic Color inventory and direct-value totals. Preserve the assets themselves in the complete graphic-asset catalog. Keep code-driven chart and data-series colors in the Color inventory because they carry UI meaning.

For every Token and direct style value, show:

- definition owner and source path;
- direct and alias-downstream references;
- inferred product function, component, page, state, app/package scope;
- evidence label: `source-confirmed`, `structure-inferred`, or `runtime-confirmed`.

For every icon or graphic asset, distinguish app-source references, test/build-only references, repository-only files, public or package exposure, dynamic loading, build status, and runtime verification. Keep Product A factual; governance recommendations belong to Product B.

Do not add health labels, priorities, target values, or recommendations to this file. A missing reference means “not found in scan scope,” never “safe to delete.”

## Design review contract

Produce one bilingual, self-contained, offline `design-review.html`. Organize the review by the standard static and dynamic design-system taxonomy rather than scanner rule names.

Use one shared review state and five explicit modules. Do not expose the same approval in several places:

1. `UIKit`: inspect the destination framework and visual specifications.
2. `Governance`: approve category-level migrate/merge/delete batches; do not ask users to approve routine rows one by one.
3. `Decisions`: resolve only genuine visual or product ambiguity.
4. `Validation`: confirm affected functions, pages, breakpoints, themes, and interaction states that Product C must capture.
5. `Finish`: summarize incomplete approvals and export both JSON artifacts once.

Within those modules, use this reading order:

1. Target UIKit skeleton. Start with the standard destination, never scanner counts or findings:
   - Foundation: color, typography, iconography, spacing/density, grid/layout, size/control height, radius, stroke, shadow/elevation, opacity/blur, layer, and motion;
   - Atoms, molecules, components, and product patterns;
   - keep missing standard nodes visible as `missing` instead of removing them from the framework;
   - show each node as existing, migration-ready, needs-consolidation, needs-decision, missing, or explicitly not applicable.
2. Foundation and component specification pages:
   - for every Foundation category, render the current project and target UIKit side by side using visible specimens, following the design-document layout of category explanation plus light, dark, or checkerboard specimen canvases;
   - Color is a completion board, not a scanner summary. Render six compact regions: the standard color framework, the complete source-derived rendered palette, literal-format normalization, the grouped semantic Token matrix, an independent hardcoded-color module, and the migrate/merge/delete result. Put a square swatch before every color or semantic Token name; use `#1C1C1C` for the dark preview canvas and `#F5F5F3` for the light preview canvas; show missing mappings as empty swatches and keep code evidence collapsed;
   - group Color semantics as background, text, stroke, icon, brand/action, feedback, data visualization, and scoped/component roles. Data visualization means code-driven charts, series, plots, heatmaps, and other colors that communicate data meaning. Render every scene name as a strong standalone subheading outside its table. The system pre-fills source-backed mappings and only asks the user to resolve missing or conflicting roles;
   - exclude colors embedded inside illustrations, logos, decorative SVGs, raster images, and other graphic assets from the Color palette, hardcoded counts, clusters, and governance actions. Keep those assets and their previews only in the Iconography and graphic-asset catalog. Do not exclude page themes, CSS gradients, motion colors, or UI icon colors merely because their filenames sound visual;
   - normalize readable literal colors to uppercase `#RRGGBB` or `#RRGGBBAA` at the primitive and report-display layer. Never flatten semantic or usage references into literals: semantic Tokens reference primitives, and product usage references semantic Tokens;
   - cluster hardcoded UI colors by canonical rendered color plus property scene, feature, state, and scope. Show source occurrences separately from governance clusters, attach product locations, and prefill migrate-to-existing, add-semantic, create-scoped-Token, or verify-context recommendations;
   - Typography is a specification sheet, not a list of font declarations. Render the current font families, current source-derived size/line-height combinations, the project-derived target scale and weight strategy, an independent direct-typography module, and the migrate/merge/delete result. Every target row includes style name, font size, line height, accepted weights, observed product usage, scope, and a shared/scoped/derived action;
   - keep the current type scale and the target proposal visually separate. Treat supplied typography documents and screenshots as presentation and taxonomy references unless the user explicitly approves their values as the project standard. Derive target sizes, line heights, weights, scopes, and product locations from the audited repository; never copy example values or example usage descriptions into another project;
   - separate reusable global UI scales from product-scoped display, marketing, editor, numeric, or brand typography. Preserve justified scoped systems instead of forcing them into one global scale;
   - group direct CSS and utility typography by font size, line height, weight, family, letter spacing, style, and remaining typography. Show occurrences, files, product locations, and a prefilled migrate-to-scale or scoped-exception recommendation. Do not truncate this module;
   - render color swatches, real type samples, length scales, radius shapes, stroke weights, shadow surfaces, opacity overlays, layer stacks, and motion tracks; never substitute an empty generic rectangle when a standard specimen can communicate the rule;
   - use an explicit `not detected` panel only for current evidence that is truly absent. The target proposal must remain visually reviewable;
   - show component anatomy, variants, sizes, states, behavior, and responsive/accessibility contracts;
   - then map current source assets into the target node.
   - if no shared component system is detected, first distinguish scanner miss, repeated implicit product patterns, and genuine absence. For genuine absence, generate a minimal Starter UIKit proposal covering the common core controls and feedback surfaces. The Review approves or defers this proposal; source components are created only during authorized implementation;
   - if some components exist, map and repair the existing owners. Do not propose an unrelated parallel library;
   - for Iconography, separate UI Icons from brand and illustration assets, show every scanned asset in a filterable catalog, identify source consumers and product locations, and keep deployed-runtime status explicit;
   - automatically group assets into keep, migrate, merge, delete, or external-verification batches; never leave `potentially deprecated` as the final user-facing conclusion;
   - a delete recommendation means static deletion qualification passed. Production build, runtime baseline, trial removal, tests, and visual regression remain mandatory execution gates after approval;
   - never label the total graphic-asset count as the UI Icon count, and never silently truncate the catalog;
3. Target Token contract:
   - preserve the `primitive -> semantic -> component` architecture;
   - use `scope / property / role / hierarchy / state` naming;
   - keep light and dark as mode mappings of the same semantic name;
   - define background, text, stroke, icon, action, feedback, typography, spacing, shape, depth, layer, and motion contracts;
   - add component Tokens only when a component has a distinct contract;
   - avoid generating a full Cartesian product of unused states.
4. Old-Token lifecycle execution ledger. Group actions by Foundation category for batch approval. Every old Token that needs cleanup has exactly one final action:
   - `migrate`: move usage to a target semantic Token;
   - `merge`: converge duplicate definitions on one target owner;
   - `delete`: remove only after source and runtime usage are both cleared.
   Alias and deprecation are transition mechanisms, not final actions. Scope is a constraint, not a fourth action.
5. Decision center. Include only genuine ambiguity that cannot be resolved from source evidence. Do not ask users to review routine migrations one by one. Each decision must show:
   - the real element or visual specimen as the largest content in the card, never a tiny category chip;
   - current and target specimens side by side, with names and source-derived values attached to the specimens;
   - one short question, one single-line recommended keep, merge, alias, migrate, scope, or verify action, and two to four explicit choices;
   - concise consequences on the choices;
   - limitations, standard-contract explanation, and source evidence only in collapsed details.
   Do not repeat the same diagnosis in the title, question, current summary, target summary, recommendation, and disclaimer. State each idea once.
6. Implementation slices grouped by UIKit category and affected product function/page, with the visual-regression states required after source changes.

## Asset deprecation qualification

Reduce user judgment by making the Skill decide everything supported by repository evidence. For every owned graphic asset, run these gates:

1. Static consumers across code, CSS, JSON, Markdown, configuration, URLs, and asset registries.
2. Dynamic loading through glob imports, context loaders, template paths, and runtime registries.
3. Public contracts through public URLs, package exports, workspace packages, and published entrypoints.
4. Duplicate or replacement evidence, using exact owned SVG geometry before name similarity.
5. Production-build reachability when the repository can be built safely.
6. Pre-cleanup runtime visibility across the affected route/state matrix when accessible.
7. Isolated trial removal, repository tests, missing-asset checks, and Product C visual regression after approval.

Use concrete outcomes:

- `keep`: active source evidence with no consolidation target;
- `migrate`: an active consumer should move to the primary owned source;
- `merge`: exact duplicate assets can share one owner while semantic aliases remain if needed;
- `delete`: static deletion gates passed; automatically run remaining implementation gates after batch approval;
- `verify-external`: only public, dynamic, published, or product-ownership evidence cannot be resolved from the repository.

Do not ask users to inspect delete candidates one by one. Present batch counts, reasons, affected product locations, passed gates, remaining automatic checks, and the small grouped set blocked by external evidence. Never equate app-source reference with deployed visibility, or repository-only with permission to delete.

Keep raw paths, excerpts, scan coverage, scanner findings, confidence scores, and owner candidates collapsed as evidence. They must never become the primary report navigation.

For foundation categories, compare current sources and actual values before recommending convergence. Cover color, typography, spacing/density, shape/stroke, depth/layers, icons/assets, motion, grid/responsiveness, Token architecture, and accessibility baseline. Preserve explicit empty or unverified states.

Export `govern-ui-decisions.json` and `govern-ui-token-contract.json` together from the Finish module. Both remain drafts until the user explicitly authorizes implementation. The user returns JSON, not the HTML.

## Visual regression contract

Create the baseline before cleanup. Define a manifest using [visual-regression-schema.md](references/visual-regression-schema.md). A useful matrix covers real product dimensions rather than arbitrary screenshots:

- function and page/route;
- default, loading, empty, error, populated, disabled, hover, focus, selected, open-overlay, and nested states that actually exist;
- desktop/mobile breakpoints, themes, locale, authentication, and reduced-motion modes that actually exist;
- affected Tokens and the intended visual outcome.

Capture the same matrix after cleanup, then run `regression`. Product C must show before, after, and difference views; source Token/direct-value diff; coverage; and accept, intentional-change, repair, or unverified decisions. Missing or inaccessible states stay `unverified` and cannot be counted as visually safe.

## Approved implementation

The complete version may write application code only after Product B is approved. Work in small product slices, not global search-and-replace batches.

Read [implementation-schema.md](references/implementation-schema.md) before running `implement` or `submit`.

Run `implement` without `--write` first. Treat the resulting implementation plan as a mandatory safety preview. The command may automatically rename CSS custom-property definitions, migrate `var()` consumers, replace exact stylesheet literals when the approved Review export contains the source line, property, literal value, and reachable target Token, merge definitions when ownership is source-safe, and delete unused definitions only after the relevant runtime deletion gate is explicitly supplied. Keep Tailwind/script/generated direct values and same-name cross-file merges blocked unless their adapter or import/runtime ownership has been proven. Record incomplete evidence groups as `partial`, never complete.

Run `implement --write` only after explicit current-task authorization. Require a clean Git worktree by default, record before/after governance snapshots, write an implementation ledger, and preserve blocked actions instead of forcing them.

For each slice:

1. Add or confirm target primitives and semantic mappings.
2. Migrate consumers by product function and component.
3. Preserve temporary aliases only when needed for a staged rollout.
4. Remove aliases and old definitions after every consumer and visual state is verified.
5. Re-scan direct values and undefined references.
6. Run repository tests and Product C before marking the slice complete.

After verification, run `submit` without `--create` to prepare a repository-scoped Draft PR body and readiness manifest. Run `submit --create` only when the user has explicitly authorized branch creation, commit, push, and Draft PR creation. Stage only files listed by the implementation ledger; refuse unrelated or pre-existing staged changes. In multi-repository governance, create linked Draft PRs in dependency order: shared owner first, consumers next, final cleanup last.

## Extraction and evidence rules

- Use source values exactly as written. Never invent a replacement Token or ideal value.
- Show every definition independently when the same Token changes by file, selector, theme, brand, or local scope.
- Resolve CSS `var()` aliases recursively while preserving the written value and alias chain.
- Treat Tailwind consuming CSS Variables as an adapter representation, not a second visual system.
- Keep direct CSS values visible. In the library call them inventory; in the review explain whether they are an unmapped value, intentional exception, or still unverified.
- Attribute direct values to product functions and components using source references. Mark directory-derived labels as inferred.
- Render owned SVG content when it can be safely embedded. Do not fabricate package-icon geometry absent from the repository.
- Treat source usage and deployed visibility as different evidence. Label `source-used` as an app-source reference, not online usage. Convert repository-only assets through the deprecation qualification gates instead of returning an ambiguous candidate list.
- Separate source-verified facts, inferred relationships, runtime verification, and unassessed areas.
- Keep confidence secondary to plain-language reasoning.
- Keep both HTML files offline: no remote scripts, fonts, styles, analytics, or asset requests.
- Preserve unrelated dirty work and never mutate proxy or routing rules.

## Commands

```text
library <repo> --out <directory>  # style-library.html
review <repo> --out <directory>   # design-review.html + govern-ui-token-contract.json
snapshot <repo> --out <snapshot.json>
implement <repo> --decisions <decisions.json> --contract <token-contract.json> --out <directory> [--write]
regression --before <snapshot.json> --after <snapshot.json> --manifest <visual-manifest.json> --out <directory>
submit <repo> --ledger <implementation-ledger.json> --out <directory> [--create]
report <repo> --out <directory>   # compatibility alias of library
audit <repo> [--json]             # internal source data
```

## Completion standard

Before returning:

- confirm the requested HTML exists and contains no unresolved template placeholders;
- confirm the embedded script parses and no remote scripts or styles are present;
- confirm Chinese/English switching and mobile layout work;
- for `library`, confirm all atomic sections, alias chains, and readable SVG previews;
- for `library`, confirm Token and direct-value function attribution is visible and evidence levels remain honest;
- for `review`, confirm all five modules use one state; every standard node remains visible; current and target specimens are readable and never silently blank; a missing component system produces a review-only Starter proposal; migrate/merge/delete use category batches; genuine decisions remain separate; validation slices and the single Finish export work;
- for `regression`, confirm screenshots are embedded offline, before/after/difference views render, coverage is accurate, unverified states remain explicit, and decision export works;
- for `implement`, confirm the preview and write results contain the same approved action IDs; blocked actions left the source untouched; changed files match the ledger; before/after snapshots exist; repository tests and direct-value re-scan are reported honestly;
- for `submit`, confirm only ledger files are staged; the branch is not the base branch; the PR is Draft; CI and Preview remain pending until externally verified; never include unrelated working-tree changes;
- validate this Skill with `quick_validate.py` after changing its files.

Do not claim browser-computed styles, runtime theme activation, accessibility, or interaction behavior was verified unless those surfaces were separately rendered and inspected.
