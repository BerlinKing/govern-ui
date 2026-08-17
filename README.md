# GovernUI

> **Every frontend has a design system. Most have several.**

GovernUI is an open-source Codex Skill that reverse-engineers the design systems hiding inside your frontend codebase.

It traces tokens from source to consumer, uncovers competing owners, duplicated primitives, hardcoded values, overlay chaos, and invisible design debt—then turns the evidence into an interactive decision room.

Choose a Bootstrap, Migrate, or Hybrid path. Freeze today's debt as a baseline. Block only what gets worse.

**No blind rewrites. No vibe-based cleanup. Give every pixel an owner.**

## What GovernUI does

- Maps CSS variables, Tailwind themes, JSON tokens, and JS/TS theme objects.
- Connects token definitions, aliases, consumers, and likely source owners.
- Distinguishes adapters and scoped overrides from duplicates and semantic conflicts.
- Finds raw-value bypasses, duplicated UI primitives, and unclear overlay ownership.
- Produces evidence-backed JSON, Markdown, and a standalone offline HTML system review.
- Lets readers switch the offline decision room between Chinese and English, with the preference saved locally.
- Reviews every repository against a complete static five-layer and dynamic four-layer design-system model.
- Translates scanner evidence into visual decision cards: standard contract, current state, target result, recommendation, consequence, and user choice.
- Establishes a historical baseline and gates only new high-confidence design debt.
- Recommends a `Bootstrap`, `Migrate`, or `Hybrid` governance path.

## v0.7: Complete foundation workbenches

GovernUI v0.7 gives every major visual foundation the same designer-readable treatment as Color:

- Typography separates font sources and compares display, body, label, numeric, metric, and responsive roles with real text specimens.
- Spacing and density visualizes base scales, component inset/gap, layout spacing, control sizing, density modes, and bypassing utility classes.
- Shape and stroke draws detected corners, borders, dividers, and focus-ring contracts.
- Depth and layer visualizes shadows, opacity/scrims, blur, and semantic layer values without confusing visual elevation with runtime stacking ownership.
- Icons and assets inventories libraries, repository-owned SVG collections, imports, inline SVGs, grids, stroke widths, fills, and shared Icon/Image/Avatar components.

Each workbench now answers the same product questions: what exists today, how many independent sources compete, which standard roles are covered, what bypasses the system, what should be kept or merged, and what the governed target becomes. Raw code remains in collapsed engineer evidence.

## v0.6: Designer-facing specification sheets

GovernUI v0.6 makes the review read like a real UI Kit instead of an engineering dashboard:

- Every foundation, atom, molecule, component, pattern, and dynamic contract opens as its own specification sheet.
- Current product styles are shown as visual samples and comparison matrices across roles, hierarchy, variants, sizes, states, themes, and modes when evidence exists.
- The current implementation, standard target, and convergence recommendation follow one consistent reading order.
- Missing or runtime-only states stay visibly unverified; the report never invents a polished target from static code.
- Scanner totals, paths, syntax, and raw source stay in the optional engineer appendix.

The visual language stays deliberately neutral—white canvas, black information, restrained semantic color—so the audited product's own palettes and components remain the evidence.

## v0.5: User-first color decision workbench

GovernUI v0.5 turns the Color category from a scanner dashboard into a guided product decision:

- States whether the repository has a real primitive palette, a semantic layer, component colors, and one governed global contract.
- Groups canonical definitions into independent color sources; CSS Variables, Tailwind, and JS/TS adapters are no longer mistaken for separate design systems.
- Draws every detected source as a real palette lane and compares brand, action, surface, content, border, feedback, interaction, and data-visualization roles side by side.
- Groups hardcoded values by visible color and shows a safe existing-token mapping only when evidence supports it.
- Says what to keep, merge, alias, deprecate, or preserve as a scoped exception.
- Renders the proposed target as one semantic contract with controlled theme, brand, product, and data-visualization mappings—not one flat list of hex values.

Source filenames remain available for traceability, but the report now names systems first as global candidates, theme or brand colors, likely legacy colors, and unconfirmed sources.

## v0.4: System-first design review

GovernUI v0.4 no longer uses scanner conflicts as the report outline. The scanner remains the evidence engine, while the review follows a complete design-system taxonomy:

- Static: Foundation → Atoms → Molecules → Components → Patterns.
- Dynamic: Interaction foundation → Component behavior → Cross-component orchestration → Flow and lifecycle.

Every category stays visible as source found, partial, fragmented, missing, not detected, or runtime unverified. Opening a category shows its standard definition, current inventory, target model, and recommendation. The Color review distinguishes definition files, canonical definitions, unique values, references, declared primary/secondary/tertiary roles, hardcodes, selectors, naming collisions, conflicts, and theme scopes.

Decision cards now live inside this taxonomy. Raw conflict groups, findings, owners, file paths, and code remain traceable in collapsed engineer details, but no longer dictate what users see first.

## v0.3: Visual decision review

GovernUI v0.3 is deliberately read-only by default. It keeps deterministic source evidence underneath, then adds a Codex-authored visual brief that groups raw findings into a small set of product decisions. Each decision shows the current state, target result, recommendation, consequences, and a draft choice.

The decision room follows the browser language on first open and includes an always-visible `中文 / EN` switch. Interface copy changes in place without discarding saved review choices. The default view uses product language and visual comparisons; scanner counts, paths, and code stay in collapsed engineer details for traceability.

The report also draws a source-derived UI-library blueprint: static Foundation → Atoms → Molecules → Components, followed by separate dynamic contracts for state, Portal, layer, keyboard, focus, dismissal, scroll, and motion. Missing items stay visibly unconfirmed.

Static analysis cannot prove runtime behavior, accessibility, responsive rendering, or visual parity. GovernUI reports those surfaces as unassessed unless they were separately run and inspected.

## Install

Requirements: Git, Codex, and Node.js 20 or newer.

```bash
git clone https://github.com/BerlinKing/govern-ui.git "${CODEX_HOME:-$HOME/.codex}/skills/govern-ui"
```

Restart Codex if the Skill does not appear immediately, then invoke it as `$govern-ui`.

## Quick start

Ask Codex:

```text
Use $govern-ui to audit this frontend repository and show me which token and component systems are competing.
```

Or run the deterministic scanner directly:

```bash
node scripts/govern.mjs audit /path/to/frontend
```

Generate the offline decision room:

```bash
node scripts/govern.mjs report /path/to/frontend --out /tmp/govern-ui-report
```

Create and enforce a baseline:

```bash
node scripts/govern.mjs baseline accept /path/to/frontend --out govern-ui-baseline.json
node scripts/govern.mjs check /path/to/frontend --baseline govern-ui-baseline.json
```

## Commands

```text
audit <repo> [--json]
report <repo> --out <directory>
baseline accept <repo> --out <baseline.json>
baseline status <repo> --baseline <baseline.json> [--json]
check <repo> --baseline <baseline.json> [--json]
decisions validate <token-decisions.json>
```

## Design principles

1. Evidence before migration.
2. Ownership before consolidation.
3. Equal values do not imply equal meaning.
4. Historical debt stays visible, but only new high-confidence debt blocks the build.
5. Ambiguity becomes an explicit decision—not an invented answer.

## Development

Run the fixture suite:

```bash
node scripts/tests/run-tests.mjs
```

The suite covers all three recommendation lanes, scope-noise regression, canonical/adapter precision, exact primitive ownership, stable fingerprints, baseline behavior, offline report generation, and a new-debt gate.

## License

[MIT](LICENSE)
