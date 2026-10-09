---
name: govern-ui
description: Map frontend product modules, inventory real atomic styles, define a shared semantic Token framework, and govern approved module batches with contextual mappings and visual verification. Use for style-library inventory, design-system standardization, Token migration, or visual regression.
---

# GovernUI

GovernUI governs a project through **module discovery -> global reconnaissance -> shared framework and source bindings -> approved module batches -> cross-module closure -> durable delivery**. Modules define where work happens; atomic categories define the standards used everywhere. Start with atoms, not component or molecule construction.

Products A/B/C/D are distinct views of the same versioned project evidence and decisions, not independent sources of truth. A clean system is not merely fewer Tokens: each shared style has a qualified owner, a semantic purpose and real consumers; modes and states are explicit; exceptions are bounded; old definitions have a final disposition; and affected page states have been verified. Do not force content, behavior, geometry, or every one-off visual value into a global Token.

## Choose the mode

- Product A, 扫描报告: factual inventory, module/subfunction/UI-element locations and evidence-backed problem clues, not approved cleanup decisions. Existing `library` emits `style-library.html`; reconnaissance supplies linked detail.
- Product B, 设计原子 Token 规范: the global editable taxonomy, semantic names, meanings, typed underlying bindings, themes/states and confirmed framework revisions. No occurrence-level migration, merge or deletion decisions on this page. Suggested entry: `token-spec.html`.
- Product C, 治理审计: contextual proposals against confirmed B, grouped manual decisions, separately authorized batches and their execution/verification history. Suggested entry: `governance-audit.html`. The legacy `review` command is a draft evidence producer, not the complete B or C interface.
- Product D, 治理报告: the final agreed-scope conclusion, actual Token/code changes, residuals, verification coverage and delivery links. Suggested entry: `governance-report.html`. Existing `regression` emits `visual-regression.html` plus `governance-diff.json` as supporting evidence, not the whole final report.
- Read [artifact-workflow.md](references/artifact-workflow.md) before producing or updating these interfaces. Suggested entries are a presentation contract, not claims of existing CLI commands. Generate only requested products; a pilot does not authorize a project-wide workflow. A complete project delivers all four views and the delivery manifest; intermediate views remain explicitly draft or not-produced.

## Workflow

1. Read repository instructions, locate the real frontend roots, and inspect working trees without cleaning or rewriting them. Read [module-governance.md](references/module-governance.md). Before style diagnosis, derive a module map from routes, entrypoints, imports and product functions. Separate business modules, shared foundations and excluded areas. Ask the user to confirm uncertain boundaries and omissions; do not hardcode another project's module names or count shared definitions once per module.
2. Perform one read-only, project-wide reconnaissance within the agreed repositories and module map. Generate Product A outside the target repository; add module attribution and coverage records alongside it when the CLI cannot generate them.

   ```bash
   output_dir="$(mktemp -d)"
   node <skill-dir>/scripts/govern.mjs library <repo> --out "$output_dir"
   ```

3. Read [element-reconnaissance.md](references/element-reconnaissance.md). Refine the map to **module -> functional area -> subfunction -> meaningful UI element** before producing module issues. Keep the complete element inventory separate from the issue list; every issue must identify the element, declaration, actual state/condition, product position and source-backed opening steps. Inspect selected caller props and visibility guards; a branch present in a file is not necessarily active at that entry. Use `recon` for a bounded TSX pilot and disclose analyst-authored scope and runtime gaps. Triage shared UI, scoped UI, content/data, geometry/behavior, generated/vendor and unresolved observations. Existing library coverage, direct styles, duplicate/unused candidates and semantic conflicts are reconnaissance, not cleanup or approved mappings. Shared root issues and affected occurrences have separate counts. Keep recommendations out of factual Product A.
4. Read [foundation-decision-guide.md](references/foundation-decision-guide.md), [atomic-framework.md](references/atomic-framework.md) and [delivery-contract.md](references/delivery-contract.md). Build the complete global atomic framework before choosing what this project will adopt. Every baseline category needs explicit role definitions and editable rules even with zero observed usage; retain unused categories in the UI, manual and exported records. Use cross-module evidence to qualify existing owners and bindings, not to remove framework categories. Let users edit Token names, meanings, scopes and **semantic Token -> typed underlying primitive/style owner** bindings, and explicitly choose adopt, unused or defer for each category. Create the draft design manual now. Confirm category decisions and lock versions with their source-binding revisions. Global semantics can retain explicit product/theme values; no module invents a parallel global standard.
5. Agree a cadence: pause after each batch by default, or continue through explicitly authorized named batches with stop conditions. Select a small **module x related styles x real page states** slice. Recheck its consumers, current source and all affected shared dependencies. Use `review` as source-derived evidence, reconcile with the locked framework, and surface only real ambiguity. New roles or changed source bindings require a versioned impact review. Do not rerun or rewrite the entire project for every local slice.
6. Preview exact mappings, lifecycle actions, files, affected modules/states, expected benefit, exceptions and rollback boundary. Qualify deletion through static/dynamic/public/build and applicable runtime evidence. Capture source and visual baselines before changes. Framework confirmation or exported JSON is not code-change authorization; obtain explicit approval for the identified batch/version/scope.
7. Implement only authorized actions. Verify target definitions, adapters and consumers; re-scan changed areas and compare the same page states for Product D evidence. A shared-owner change expands checks to every affected module, not automatic write authority. Keep old aliases until all consumers are migrated and verified. Source drift, failed checks or scope expansion stops affected work for replanning, not silent approval reuse.
8. After **every scan/review/execution round**, return the reconciled round receipt from [module-governance.md](references/module-governance.md): completed, changed-but-awaiting-acceptance, needs-user-decision (with the actual points), excluded, retained-exception, blocked and queued. Distinguish this round from cumulative progress. Stable IDs preserve decisions across rounds; approval, source changes and acceptance are separate facts.
9. At cross-module closure, re-scan the agreed project scope, verify remaining shared consumers and remove only qualified rollout aliases. Reconcile residuals, exclusions, exceptions and unverified states. Deliver the source-backed library, manual, two mapping types, execution contract, records and maintenance checks according to the delivery manifest. Never call a partial scope or an unverified project fully governed. Prepare a Draft PR only when requested; Git and remote operations require separate authorization.

## Capability boundary

- The module map, project contract and execution receipts remain agent-maintained. `recon` validates an analyst-authored element scope and generates a read-only element/issue report with a reconnaissance receipt. `scripts/framework.mjs` generates the complete standalone definition editor with category confirmations, revisions and exports; `implement` does not consume or enforce these confirmations. Existing commands do not implement a persistent web service, automatic module discovery/selection, runtime state execution or a browser-to-Codex execution bridge. Do not advertise those as shipped.
- `review` emits a source-derived draft. It may supply observations during reconnaissance, but its target names are unconfirmed proposals until the framework and contextual mappings are reconciled.
- Current `review` emits Token contract schema 2 while `implement` validates schema 1. Treat that pipeline as incompatible until a tested conversion or executor update exists. Never change only the version number, bypass validation or claim the direct pipeline was verified. See [implementation-schema.md](references/implementation-schema.md).
- Offline HTML exports remain supported. If a future connected workbench persists user decisions, use the shared records; otherwise use explicit chat confirmation plus JSON export/import. Saving an HTML file alone does not reliably carry edited form state.

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

For every icon or graphic asset, distinguish app-source references, test/build-only references, repository-only files, public or package exposure, dynamic loading, build status, and runtime verification. Keep Product A factual; governance recommendations belong to Product C.

Do not add health labels, priorities, target values, or recommendations to this file. A missing reference means “not found in scan scope,” never “safe to delete.”

## B: Design atomic Token specification

Produce a bilingual, self-contained, offline specification view. Product B defines atomic standards, not a full design-system dashboard or migration workbench. Do not render molecules, product patterns, occurrence-level lifecycle decisions, implementation planning or visual validation as B modules. The legacy CLI review page is a source-derived combined draft; split its responsibilities before claiming four-artifact compliance.

Product A owns inventory and factual module issue clues. Product B owns the global target framework. Product C owns contextual mapping, audit decisions and batch history, navigating by module and linking B roles. Reuse the following atomic taxonomy across views, without duplicating independently editable standards:

1. Color.
2. Typography.
3. Icons.
4. Shadows.
5. Stroke widths and styles.
6. Border radius.
7. Spacing and sizing.
8. Opacity.
9. Blur.
10. Layers and z-index.
11. Motion parameters.
12. Responsive layout: breakpoints, content widths and grid rules.
13. Unclassified Tokens and direct values (an evidence queue, not a target semantic category).

Present the complete baseline initially. Users then edit or delete individual proposed Tokens directly; do not add a per-role adoption checkbox. Persist explicit deletions and provide undo while retaining category entries and confirmed history. Deleting a draft Token does not authorize deleting source code.

These categories are a mandatory framework baseline independent of scanner coverage. Each must contain meaningful proposed roles, category-specific definition fields and use guidance, not only a navigation label or an empty/not-built page. Keep observation (`detected`, `not-detected-in-scope`, `unverified`) separate from the user's adoption decision (`undecided`, `adopt`, `unused`, `defer`). An unused category retains its definitions and decision reason in all exports and locked versions. Zero observations never automatically mean unused. See [atomic-framework.md](references/atomic-framework.md) for the shared catalog and standalone editor generator.

After role definition, build the binding view from inspected, category-compatible source candidates. Provide source selection/search, visual specimens, typed values and editable targets with source details on demand. Preserve original expressions and evidence separately from adjusted targets and resolved previews. Do not auto-confirm bindings or fill missing composite fields as if observed. The binding flow and input schema are specified in [atomic-framework.md](references/atomic-framework.md).

Classify every direct value into its atomic category when evidence permits. Only genuine residual values belong in Unclassified. Stroke color belongs to Color; the standalone Stroke category owns width and style.

The project uses `module map -> global reconnaissance -> shared atomic framework and source bindings -> category confirmation/version lock -> module-batch contextual mappings -> difference/lifecycle review -> batch approval -> verification and receipt`. Framework categories are confirmed globally, not reinvented per module. A batch may use confirmed categories while others remain explicitly outside that batch. Keep issues, source evidence and decisions linked by stable IDs rather than duplicating them in separate lists. Show expected cleanup benefit only after scope and mapping qualification, and distinguish estimates from verified results.

### Color workflow across A/B/C

Color is the reference workflow; do not claim generator completeness without testing. Inventory metrics belong to A, role editing to B, qualified mapping estimates and decisions to C, and actual benefits to D. The following steps are not tabs within B.

1. Show a concise overview with Color Token definitions, direct-color occurrences, expected merges, suggested deletions, manual confirmations, and a secondary deduplicated rendered-color count.
2. Show cleanup benefit like a storage-cleanup product: current Color Token count and direct occurrences on the left, expected target Token count and explicit residual occurrences on the right, plus the expected Token reduction count and percentage.
3. Keep four percentages separate:
   - Token absorption rate: active old Token definitions mapped into target Tokens divided by all active old Color Token definitions;
   - direct-value absorption rate: direct-color occurrences mapped into target Tokens divided by all direct-color occurrences;
   - decision coverage: items with a confirmed mapping, deletion decision, or explicit exception divided by in-scope audit items; this is not implementation completion;
   - Token reduction rate: one minus target and justified scoped Tokens divided by current active Color Tokens.
   Completed deletions contribute to verified completion, not target-library absorption. Report execution completion separately using the round ledger; exclusions are not repaired items.
4. Build a minimal target color library from common role families plus source-backed project scopes:
   - candidate core: Background, Action, Text, Icon, Stroke color, Brand, Functional; retain only roles applicable to the product;
   - project-specific only when evidence exists, for example Canvas, Dialog, or On-media; these examples are not universal defaults;
   - show Unresolved only when a target cannot be classified reliably.
   Masks and scrims belong to Background. Transparent button, tag, chip, and block states belong to Action. Canvas-specific transparent states belong to Canvas. Normalize the scope spelling to `on-media`.
5. Preserve `primitive -> semantic -> component` architecture, but Product B reviews the semantic target. Use `scope / property / role / hierarchy / state` naming. Light and dark are mode mappings of one semantic Token, never separate Token names.
6. Generate only source-backed roles and states plus the smallest necessary core. Avoid a Cartesian product of unused hover, pressed, disabled, feedback, or hierarchy combinations.
7. Every target Color Token row is editable before version lock and prioritizes:
   - square swatch and Token name;
   - meaning, why the semantic exists, and observed product locations directly beneath the Token;
   - editable proposed underlying owner and theme bindings; show evidenced light/dark values when reviewing bindings, label unresolved values explicitly, and hide next-stage value columns in a structure-only review;
   - readiness and category-confirmation status.
   Source literals, paths, lines, occurrences, and discovered consumers remain read-only.
8. Only after category confirmation and version lock, fill old-to-target migration mappings from consumer evidence for the selected module batch. Proposed underlying bindings can be reviewed at framework definition; observed implementation remains separate. Show unmapped candidates inline: reuse a locked role, propose a versioned addition, preserve a scoped exception, or defer. AI prefills action and target, but the user can change either; deletion still requires its evidence gates. Direct colors may also motivate a versioned target Token or remain an explicit exception.
9. Manual confirmation is only for real ambiguity: multiple valid semantics, unclear shared versus scoped ownership, mode conflict, dynamic or external evidence, or deletion that still needs runtime proof.
10. Editing an unlocked target or mapping revokes affected confirmations. Editing a locked Token, underlying style binding or theme value creates a new framework revision and impact review. Persist decisions to shared project records when a connected UI exists; the offline fallback exports `govern-ui-decisions.json`, `govern-ui-token-contract.json` and the framework record. Raw source observations stay read-only; user corrections are recorded separately.

## C: Governance audit and consumer-context diagnosis

Read [artifact-workflow.md](references/artifact-workflow.md) for C's interaction contract. Use module-grouped, collapsed questions and show only decisions, blockers or acceptance requests needing attention by default. Routine qualified actions are summarized for batch authorization; processed details remain in history. Current/target specimens and editable choices take priority over prose. Preserve separate decision, authorization, application and verification records. C references confirmed B roles; it never becomes a second editable standard.

Never generate a target semantic Token from a name or rendered value alone. Build an evidence graph for every definition and direct value: `definition -> alias -> adapter -> consumer -> component/page -> property -> layer -> state -> mode -> product scope`.

Infer a semantic fingerprint with these fields: `scope / family / property / role / hierarchy / state / mode`. Use this evidence priority:

1. runtime-confirmed route and state;
2. source consumer, CSS property, selector, component, and DOM or Portal layer;
3. alias owner, adapter path, theme mode, and product scope;
4. Token name;
5. rendered-value similarity.

Names and equal values are weak evidence. Merge automatically only when fingerprints, mode, value, and owner are compatible. A shared primitive value may feed several semantic Tokens; do not collapse those semantics merely because the current color is equal. Tailwind and theme adapters are consumers of the owner contract, never target owners.

Use three diagnostic outcomes:

- `source-confirmed`: real consumers agree on one semantic fingerprint;
- `source-suggested`: consumer evidence supports one target but mode, scope, or ownership still needs confirmation;
- `manual-review`: consumers conflict or no layer/role can be established; do not invent a target Token.

For backgrounds, distinguish page body, content surface, elevated surface, scrim, interactive state overlay, and scoped rendering effects. A scrim requires Backdrop, Mask, Dialog/Drawer Overlay, Portal-layer, or equivalent source evidence and a translucent value. Never select an opaque color as a scrim. Popover or Dialog content is an elevated surface, not a scrim. Canvas/WebGL/drawing overlays remain scoped unless repository evidence proves a global semantic.

Choose target mode values by evidence score, not scan order. Prefer consumer-confirmed canonical owners; penalize adapters and incompatible alpha. Preserve alternative values and reasons in the contract so the review explains why a candidate was selected.

Exclude colors embedded inside illustrations, logos, decorative SVGs, raster images, and other graphic assets from Color counts and governance. Keep code-driven chart and data-series colors because they communicate UI meaning. Normalize readable literals to uppercase `#RRGGBB` or `#RRGGBBAA` for display, but preserve semantic references in source mappings.

Every old Token has one final lifecycle action: `migrate`, `merge`, or `delete`. Alias and deprecation are transition mechanisms, not final actions. Scope is a constraint, not a fourth action. A delete recommendation still requires the applicable runtime, trial-removal, test, and visual verification gates before source deletion.

Molecules and components become a later review phase only after atomic categories are approved. If that phase is explicitly requested, reuse the same target-first structure instead of reopening a separate all-purpose dashboard.

## Asset deprecation qualification

Reduce user judgment by making the Skill decide everything supported by repository evidence. For every owned graphic asset, run these gates:

1. Static consumers across code, CSS, JSON, Markdown, configuration, URLs, and asset registries.
2. Dynamic loading through glob imports, context loaders, template paths, and runtime registries.
3. Public contracts through public URLs, package exports, workspace packages, and published entrypoints.
4. Duplicate or replacement evidence, using exact owned SVG geometry before name similarity.
5. Production-build reachability when the repository can be built safely.
6. Pre-cleanup runtime visibility across the affected route/state matrix when accessible.
7. Isolated trial removal, repository tests, missing-asset checks, and Product D visual regression after approval.

Use concrete outcomes:

- `keep`: active source evidence with no consolidation target;
- `migrate`: an active consumer should move to the primary owned source;
- `merge`: exact duplicate assets can share one owner while semantic aliases remain if needed;
- `delete`: static deletion gates passed; automatically run remaining implementation gates after batch approval;
- `verify-external`: only public, dynamic, published, or product-ownership evidence cannot be resolved from the repository.

Do not ask users to inspect delete candidates one by one. Present batch counts, reasons, affected product locations, passed gates, remaining automatic checks, and the small grouped set blocked by external evidence. Never equate app-source reference with deployed visibility, or repository-only with permission to delete.

Keep raw paths, excerpts, scan coverage, scanner findings, confidence scores, and owner candidates collapsed as evidence. They must never become the primary report navigation.

For foundation categories, compare current sources and actual values before recommending convergence. Cover color, typography, spacing/density, shape/stroke, depth/layers, icons/assets, motion, grid/responsiveness, Token architecture, and accessibility baseline. Preserve explicit empty or unverified states.

Export decisions and Token contract from the relevant review surface. They are decision records, not source-change authorization. In the offline fallback return JSON rather than edited HTML; do not require manual file shuttling when an implemented connected workbench can persist those same records.

## D: Governance report and visual regression

Product D is the final agreed-scope report, not a per-batch progress page. Aggregate verified source changes, comparable Token reductions, direct-value residuals, changed files/references and actual line diffs. Include module outcomes, unresolved items and links to the core manual, delivered style owners, permanent source map and execution records. A batch receipt stays in C. If closure is partial, title and status must say so; do not infer success from approvals or generate speculative results. Visual regression below is one evidence section of D.

Create the baseline before cleanup. Define a manifest using [visual-regression-schema.md](references/visual-regression-schema.md). A useful matrix covers real product dimensions rather than arbitrary screenshots:

- function and page/route;
- default, loading, empty, error, populated, disabled, hover, focus, selected, open-overlay, and nested states that actually exist;
- desktop/mobile breakpoints, themes, locale, authentication, and reduced-motion modes that actually exist;
- affected Tokens and the intended visual outcome.

Capture the same matrix after cleanup, then run `regression`. The visual evidence section of Product D must show before, after, and difference views; source Token/direct-value diff; coverage; and accept, intentional-change, repair, or unverified decisions. Missing or inaccessible states stay `unverified` and cannot be counted as visually safe.

## Approved implementation

The complete version may write application code only after the relevant framework version, mappings, and Product C batch are approved. The current CLI does not itself prove those confirmations; verify the returned artifacts and decision state before writing. Work in small product slices, not global search-and-replace batches.

Read [implementation-schema.md](references/implementation-schema.md) before running `implement` or `submit`.

Run `implement` without `--write` first. Treat the resulting implementation plan as a mandatory safety preview. The command may automatically rename CSS custom-property definitions, migrate `var()` consumers, replace exact stylesheet literals when the approved Review export contains the source line, property, literal value, and reachable target Token, merge definitions when ownership is source-safe, and delete unused definitions only after the relevant runtime deletion gate is explicitly supplied. Keep Tailwind/script/generated direct values and same-name cross-file merges blocked unless their adapter or import/runtime ownership has been proven. Record incomplete evidence groups as `partial`, never complete.

Run `implement --write` only after compatible inputs, explicit batch authorization and the safety preview. Require a clean Git worktree by default, record before/after snapshots, write an implementation ledger, and preserve blocked actions. Approval binds module/action IDs, framework and source-binding revisions, source baseline and affected state scope; a CLI flag is not independent user authority.

For each slice:

1. Add or confirm target primitives and semantic mappings.
2. Verify each target is reachable through framework adapters, base components, and product consumers; check class-merging and build transforms where applicable.
3. Migrate consumers by product function and component.
4. Preserve temporary aliases only when needed for a staged rollout.
5. Remove aliases and old definitions after every consumer and visual state is verified.
6. Re-scan direct values and undefined references.
7. Run repository tests and visual verification before marking the slice complete; record human visual acceptance separately. Return a round receipt even when the slice is blocked or unchanged.

After verification, run `submit` without `--create` to prepare a repository-scoped Draft PR body and readiness manifest. Run `submit --create` only when the user has explicitly authorized branch creation, commit, push, and Draft PR creation. Stage only files listed by the implementation ledger; refuse unrelated or pre-existing staged changes. In multi-repository governance, create linked Draft PRs in dependency order: shared owner first, consumers next, final cleanup last.

## Extraction and evidence rules

- Preserve source values exactly as written in evidence. Proposed target Token names must be justified by consumer semantics and confirmed in the framework; never fabricate a source value or an unevidenced light/dark appearance.
- Show every definition independently when the same Token changes by file, selector, theme, brand, or local scope.
- Resolve CSS `var()` aliases recursively while preserving the written value and alias chain.
- Treat Tailwind consuming CSS Variables as an adapter representation, not a second visual system.
- Keep direct CSS values visible. In the library call them inventory; in the review explain whether they are an unmapped value, intentional exception, or still unverified.
- Attribute direct values to product functions and components using source references. Mark directory-derived labels as inferred.
- Render owned SVG content when it can be safely embedded. Do not fabricate package-icon geometry absent from the repository.
- Treat source usage and deployed visibility as different evidence. Label `source-used` as an app-source reference, not online usage. Convert repository-only assets through the deprecation qualification gates instead of returning an ambiguous candidate list.
- Separate source-verified facts, inferred relationships, runtime verification, and unassessed areas.
- Keep confidence secondary to plain-language reasoning.
- Keep all four HTML views offline: no remote scripts, fonts, styles, analytics, or asset requests.
- Preserve unrelated dirty work and never mutate proxy or routing rules.

## Commands

```text
library <repo> --out <directory>  # style-library.html
recon <repo> --scope <element-scope.json> --out <directory> [--typescript <typescript.js>]  # Product A detail: module-recon.html
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
- for the four-artifact interface, verify A owns facts, B owns standards, C owns audit/execution history and D owns the final scoped conclusion. Test B revision invalidation, C group expansion and decision export, and that approval alone never yields applied/verified status. Report legacy generator gaps rather than treating a documentation update as shipped functionality;
- for `library`, confirm all atomic sections, alias chains, and readable SVG previews;
- for `library`, confirm Token and direct-value function attribution is visible and evidence levels remain honest;
- for `recon`, verify module/subfunction/element drill-down, opening steps, source anchors and caller conditions; separate inventory from concrete issues, deduplicate shared roots, expose inactive/unsupported branches, reconcile the receipt and prove no target-source writes. Runtime verification requires separate real-page evidence;
- for `review`, confirm module issues and the global atomic framework remain linked, without inventing component/molecule governance. Test framework completeness with an empty observation set: every baseline category must still have editable definitions, a deliberate adoption decision and export coverage. Separate A reconnaissance, B editable framework/source bindings and confirmation, C contextual mappings and lifecycle decisions, and D final verified outcomes. Estimated benefits name denominators; edits revoke affected approval; unresolved items stay visible. If the CLI output lacks these controls, label it an incomplete draft and supply agent-maintained records; never claim a specified control already works.
- for `regression`, confirm screenshots are embedded offline, before/after/difference views render, coverage is accurate, unverified states remain explicit, and decision export works;
- for `implement`, confirm the preview and write results contain the same approved action IDs; blocked actions left the source untouched; changed files match the ledger; before/after snapshots exist; repository tests and direct-value re-scan are reported honestly;
- after each round, reconcile stable issue/action IDs and mutually exclusive receipt counts, listing every point that needs user judgment with a recommendation;
- for completed governance, reconcile all agreed modules and shared consumers, verify the specimen page against real source/adapters, and check the [delivery manifest](references/delivery-contract.md). Include manual, versioned framework, long-lived source bindings, migration contract, records, residuals and tested maintenance checks; explicit gaps prevent an unqualified completion claim;
- for `submit`, confirm only ledger files are staged; the branch is not the base branch; the PR is Draft; CI and Preview remain pending until externally verified; never include unrelated working-tree changes;
- validate this Skill with `quick_validate.py` after changing its files.

Do not claim browser-computed styles, runtime theme activation, accessibility, or interaction behavior was verified unless those surfaces were separately rendered and inspected.

### Populated default style sheet
Generate a complete underlying style sheet with concrete, editable default values for every defined role, including categories absent from project evidence. Seed bindings and previews immediately; users must not start from empty fields. Reuse qualified project values where appropriate and author a coherent fallback for the remainder. Generated defaults are proposals, not observed source evidence or confirmed adoption. Emit `framework-styles.css`, `framework-styles.json` and any generated assets alongside the HTML. Preserve existing edits, deletions and locked snapshots; backfill only missing bindings once.

### Unified semantic Token editor
Present definition and style binding together under “定义语义 Token”. Each row shows the semantic name, purpose, location/scope, preview and current typed values. Use one editor to save definition and binding atomically; do not require separate definition/binding steps. Preserve the semantic-token-to-underlying-style relationship in data.

### Category-specific Token creation
Add Token opens the current atomic category editor, with semantic name/purpose and a complete typed style draft together. Color requires light/dark color pickers plus editable color expressions and alpha preservation. Typography uses family/size/weight/line-height/tracking; other categories use their own catalog fields and appropriate numeric/select controls. Seed meaningful category defaults and show a live specimen. Validate and save definition plus style atomically. Cancel must never insert a partial Token.
