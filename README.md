# GovernUI

> **See the real design library. Review what it should become.**

GovernUI is an open-source Codex Skill with three deliberately separate surfaces:

- `style-library.html` redraws the repository's real atomic styles and CSS Token mappings.
- `design-review.html` compares that evidence with a standard static and dynamic design-system structure, then shows current state, target contract, explicit keep/migrate/merge/delete asset batches, deletion gates, and the small grouped set blocked by external evidence.
- `visual-regression.html` compares real pages and states before and after approved cleanup, including a difference view and coverage ledger.

`library` and `review` are read-only. Source changes require the separate `implement --write` authority, and GitHub delivery requires the separate `submit --create` authority. Recommendations never appear inside the atomic library.

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

## Design review

- A separate bilingual, offline `design-review.html`, including a complete UI Icon and graphic-asset catalog with app-source, dynamic-loading, public-contract, deletion-qualification, and runtime-verification status.
- A target-UIKit-first skeleton covering foundations, atoms, molecules, components, and product patterns.
- Standard nodes remain visible even when the current repository has not implemented them.
- Target visual specimens and component contracts appear before current-source mappings.
- Component anatomy, variants, sizes, states, behavior, and responsive/accessibility contracts.
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
