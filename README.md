# GovernUI

> **See the real design library. Review what it should become.**

GovernUI is an open-source Codex Skill with four distinct artifact responsibilities:

- **A · Scan report:** real atomic styles, module/subfunction/UI-element locations and factual problem clues. `library` emits `style-library.html`; `recon` supplies element-level detail.
- **B · Atomic Token specification:** editable roles, typed underlying style bindings, themes/states and confirmed framework versions. The standalone editor currently emits `framework.html`; `token-spec.html` is the proposed presentation entry.
- **C · Governance audit:** module-grouped decisions, collapsed equivalent occurrences, separately authorized batches and execution/verification history. `governance-audit.html` is the proposed entry, not a shipped command.
- **D · Governance report:** final agreed-scope improvements, actual code changes, residuals and delivery index. `governance-report.html` is the proposed entry; existing `visual-regression.html` is supporting before/after/difference evidence, not the entire report.

The four-artifact contract is defined in [artifact-workflow.md](references/artifact-workflow.md). The legacy `review` generator still emits the combined `design-review.html`; its interface is not yet split into B/C. Fixed offline HTML handles inspection, editing and export/import. Codex performs scanning, diagnosis, authorized code changes and verification; HTML does not launch Codex or create PRs. The newer local legacy-review layout is deliberately not included in this release.

`library` and `review` are read-only. Source changes require the separate `implement --write` authority, and GitHub delivery requires the separate `submit --create` authority. Recommendations never appear inside the atomic library.

## Element-level reconnaissance

Before framework design, map **module → functional area → subfunction → UI element**. The read-only `recon` command produces `module-recon.html` and `element-recon.json`: detail supporting Product A, not another top-level product. It separates all elements from concrete issues and preserves source-backed opening steps, caller-dependent branches, shared-root deduplication and unverified runtime checks.

```bash
node scripts/govern.mjs recon /path/to/frontend --scope /path/to/element-scope.json --out /tmp/govern-ui-pilot
```

The scope is authored by Codex from inspected code, not automatically discovered. An existing TypeScript parser is required (optionally `--typescript /path/to/typescript.js`); the command does not install dependencies or execute project code. See [the contract and limitations](references/element-reconnaissance.md). Pilot one functional chain before scaling.

The complete workflow is module discovery → global reconnaissance → confirmed framework/source bindings → authorized small batches → visual verification → durable delivery. The existing `review` contract schema 2 and `implement` schema 1 remain incompatible; do not pass an unconverted review export straight to implementation or change only its schema number.

## Complete atomic framework

The definition step always includes Color, Typography, Icons, Shadow, Stroke, Radius, Spacing/sizing, Opacity, Blur/filter, Layers, Motion and Responsive layout. Each category has editable role definitions and typed binding fields even when a scan reports no usage. Users delete unwanted proposed Tokens directly, with undo; category entries and the remaining definitions stay in the editor, exports and manual. There is no per-role adoption checkbox.

```bash
node scripts/framework.mjs --input /path/to/framework-input.json --out /path/to/framework
```

This produces a standalone `framework.html` with per-category decisions, immutable confirmed versions, full-framework JSON and design-manual exports. It also preserves earlier color-only browser drafts when a legacy storage key is supplied. See [the input and adoption contract](references/atomic-framework.md). The existing `review` output and implementation executor remain separate; framework confirmation does not change application source.

## Atomic library

- A single `style-library.html` that works offline.
- White canvas, black information hierarchy, responsive layout.
- Chinese and English switching.
- Search across Token names, values, and source files.
- One-click Token copying and JSON mapping export.
- Recursive CSS Variable alias resolution, including the written value and resolved value.
- Separate color groups for backgrounds, text, borders, icon fills, brand/action, feedback, and data visualization.
- Visual specimens for typography, shadows, strokes, radii, spacing, opacity, blur, layers, and motion.
- Real previews for repository-owned and readable inline SVGs.
- Imported icon names and package sources when package geometry is not present in the repository.
- Direct CSS values shown as neutral inventory—not as errors.
- Token and hardcoded-value attribution to product functions, components, pages, and states, with honest evidence labels.

## Legacy review generator and diagnostic data

- A separate bilingual, offline `design-review.html`, including a complete UI Icon and graphic-asset catalog with app-source, dynamic-loading, public-contract, deletion-qualification, and runtime-verification status.
- The committed legacy page remains available for compatibility; it does not implement the new separate B/C interaction contract. Use versioned framework and audit records rather than treating that page as execution authority.
- Consumer-context diagnosis follows definitions through aliases and adapters into real properties, selectors, JSX elements, components, pages, states, modes, and product scopes.
- Local consumer evidence outranks Token names and equal color values; same-value page, surface, action, and scrim roles remain separate.
- Tailwind namespace collisions are kept separate, adapters never become target owners, and a shared primitive with incompatible consumers stays unresolved.
- Background diagnosis distinguishes page, surface, elevated content, translucent scrim, interactive states, and scoped rendering effects.
- Each target row exposes its source evidence and uses `source-confirmed`, `source-suggested`, or `manual-review` rather than presenting heuristic guesses as ready.
- A machine-readable `primitive -> semantic -> component` target contract with light/dark mode mappings.
- Old-Token lifecycle decisions limited to migrate, merge, or delete; aliases are treated only as rollout mechanisms.
- Routine migration, merge, and deletion work stays in an execution ledger; only genuine ambiguity enters the designer decision center.
- Implementation slices tied to affected product functions, pages, and visual-regression states.
- Exportable `govern-ui-decisions.json` draft; the HTML never authorizes source changes.
- Exportable `govern-ui-token-contract.json` for approved implementation.
- Exported, approved direct-color mappings carry exact source evidence into implementation; unsupported Tailwind, script, generated, or stale evidence remains visibly partial or blocked.

## Approved implementation and delivery

- `implement` previews approved Token and direct-style changes without touching source.
- `implement --write` applies only source-safe mappings, writes before/after snapshots, and records every complete, partial, or blocked item in an implementation ledger.
- `submit` validates the ledger and prepares a repository-scoped Draft PR body without changing Git.
- `submit --create` explicitly creates a branch, stages only ledger-owned files, commits, pushes, and opens a Draft PR after remote and GitHub authentication checks.
- Missing component systems are proposed in Review, but component source is blocked until owner path, anatomy, variants, states, and accessibility contracts are approved.

## Visual regression

- A separate bilingual, offline `visual-regression.html`.
- Before, after, and difference views tied to real feature/page/state/viewport/theme coordinates.
- Source comparison for Tokens and direct style values.
- Coverage matrix and explicit unverified states.
- Exportable `govern-ui-visual-decisions.json`.

## Install

Requirements: Git, Codex, and Node.js 20 or newer.

```bash
git clone https://github.com/BerlinKing/govern-ui.git "${CODEX_HOME:-$HOME/.codex}/skills/govern-ui"
```

Restart Codex if the Skill does not appear immediately, then invoke it as `$govern-ui`.

## Quick start

Ask Codex:

```text
Use $govern-ui to extract this frontend's atomic style library and CSS Token map.
Use $govern-ui to review this frontend's design system and show me the decisions visually.
```

Or run it directly:

```bash
node scripts/govern.mjs library /path/to/frontend --out /tmp/govern-ui
node scripts/govern.mjs review /path/to/frontend --out /tmp/govern-ui
node scripts/govern.mjs implement /path/to/frontend --decisions /tmp/govern-ui/govern-ui-decisions.json --contract /tmp/govern-ui/govern-ui-token-contract.json --out /tmp/govern-ui/implementation
# After reviewing the dry-run plan and explicitly authorizing source changes:
node scripts/govern.mjs implement /path/to/frontend --decisions /tmp/govern-ui/govern-ui-decisions.json --contract /tmp/govern-ui/govern-ui-token-contract.json --out /tmp/govern-ui/implementation --write
node scripts/govern.mjs submit /path/to/frontend --ledger /tmp/govern-ui/implementation/govern-ui-implementation-ledger.json --out /tmp/govern-ui/submission
# After tests and Product C, and only with explicit Git/GitHub authorization:
node scripts/govern.mjs submit /path/to/frontend --ledger /tmp/govern-ui/implementation/govern-ui-implementation-ledger.json --out /tmp/govern-ui/submission --create
node scripts/govern.mjs snapshot /path/to/frontend --out /tmp/govern-ui/before.json
# Capture the same page-state manifest before and after approved cleanup.
node scripts/govern.mjs snapshot /path/to/frontend --out /tmp/govern-ui/after.json
node scripts/govern.mjs regression --before /tmp/govern-ui/before.json --after /tmp/govern-ui/after.json --manifest /tmp/govern-ui/visual-manifest.json --out /tmp/govern-ui
```

Open either:

```text
/tmp/govern-ui/style-library.html
/tmp/govern-ui/design-review.html
/tmp/govern-ui/visual-regression.html
```

`report` remains a compatibility alias for `library`; use `review` for recommendations.

## Development

```bash
node --test scripts/tests/run-tests.mjs scripts/tests/implementation.test.mjs
```

The fixture suite verifies read-only extraction, Token aliases, category coverage, SVG embedding, the target UIKit skeleton, lifecycle separation, direct-style decision export, safe implementation, Draft PR preparation, offline HTML generation, and script parsing.

## License

[MIT](LICENSE)
