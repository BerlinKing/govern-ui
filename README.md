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
- Produces evidence-backed JSON, Markdown, and a standalone offline HTML decision room.
- Establishes a historical baseline and gates only new high-confidence design debt.
- Recommends a `Bootstrap`, `Migrate`, or `Hybrid` governance path.

## v0.1: Lite mode

GovernUI v0.1 is deliberately read-only by default. It discovers, explains, and records decisions without rewriting application code.

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

The suite covers all three recommendation lanes, stable fingerprints, baseline behavior, offline report generation, and a new-debt gate.

## License

[MIT](LICENSE)
