# Durable project deliverables and the two mappings

Read when defining the framework/manual and before implementation or final handoff. These are logical records, not a demand to create dozens of parallel editable files. Reuse the project's existing source owners and documentation locations. Suggested filenames below are agent-maintained conventions unless listed as existing CLI outputs.

## 1. Authority and persistence

- Source scans/snapshots are immutable observations for an identified revision. User corrections are annotations, not rewritten evidence.
- The versioned framework stores approved semantic roles, scope and desired underlying bindings. The project execution contract stores decisions, approvals and batches. Source code remains the observed implementation; desired and observed bindings must be compared, never assumed equal.
- The manual and A/B/C/D views are projections of these records plus verified source. Do not edit generated MD, HTML and JSON into conflicting authorities. If a user edits a generated document directly, reconcile it as an explicit proposed change before execution.
- Browser draft autosave, confirmed framework, approved code batch, source applied and visual accepted are different states. Use fixed offline templates with explicit decision export/import and Codex handoff; no browser-to-agent execution bridge is assumed. See [artifact-workflow.md](artifact-workflow.md).
- During read-only work, keep outputs outside the target repository. For ongoing use, select a durable local project-data directory; temporary files are not final archival storage. Place agreed code, docs and sanitized records in repository-owned locations only when authorized. Screenshots containing private product data stay local unless publication is authorized. Never store credentials in contracts or reports.

## 2. Delivery manifest

Use an `artifact-manifest.json` or equivalent project index with each record's ID, type, absolute local location/repository-relative location, schema/revision, source baseline, status and links. Distinguish `draft`, `approved`, `implemented`, `verified`, `not-produced` and `not-applicable`; a promised filename is not a delivered file.

| Logical deliverable | Suggested file/location | When created and what to verify |
| --- | --- | --- |
| Module map | `module-map.json` | Before diagnosis: business modules, shared foundations, exclusions, consumers and repository coverage |
| Current inventory and baselines | Scan JSON and source snapshots | Reconnaissance and each batch: source revision, scan boundaries, raw evidence and stable IDs |
| Target framework | `govern-ui-framework.json` | Before migration: all baseline category entries and current role definitions, including unused/deferred categories; explicit Token deletions and undo/history; observations separate from adoption reasons; meanings, scopes/modes, typed bindings, revisions and confirmation basis |
| Core manual | `DESIGN-SYSTEM.md` | Draft with the framework; approved rules at lock; real values, examples and exceptions added as implementation is verified |
| Runtime style library | Existing CSS/TS/theme owners | Primitives, semantic Tokens, theme and scoped mappings; one qualified owner per scope, not independent parallel values |
| Runtime adapters | Existing Tailwind/JS/TS/framework config | Adapters reference the qualified owners; build output and actual consumers prove reachability |
| Long-lived source map | `token-map.json` | Desired/observed Token bindings per mode/scope and implementation status; resolve to actual source files and consumers |
| Migrated business source | Approved module files | Actual consumers use approved targets; producing a Token file alone is not adoption |
| Project execution contract | `govern-ui-contract.json` | Before first write: pinned versions, old-to-new actions, exact batch authority, source preconditions and required verification |
| Per-round ledgers/receipts | Round records and implementation ledger | Every round: action IDs, statuses, changes, checks, acceptance, unresolved decisions and rollback boundary |
| Residuals/exceptions | Ledger view or dedicated export | Owner, reason, affected modules/states, verification gaps and review trigger; excluded and intentionally retained differ |
| Final conclusion | `governance-summary.md` | At closure: comparable before/after counts, scoped outcome, module completion, residuals and genuine verification coverage |
| Product A | `style-library.html` | Factual source-backed specimens, bindings and product locations; preserve before/after snapshots |
| Product B: design atomic Token specification | `token-spec.html` plus framework records | Editable roles and typed source bindings; category confirmation and immutable version history; no occurrence-level migration decisions |
| Product C: governance audit | `governance-audit.html` plus decisions/ledgers | Module-grouped attention queue, collapsed equivalent occurrences, editable proposals and separate authorization/application/verification history |
| Product D: governance report | `governance-report.html` plus final conclusion | Final agreed-scope Token/code improvements, module outcomes, residuals, verification and delivery index; not one batch's receipt |
| D visual evidence | `visual-regression.html`, screenshots, manifest, decisions | Same real route/state/theme/viewport before and after; accepted, intentional-change, repair and unverified remain explicit |
| Maintenance checks | Project-appropriate scripts/config + baseline | Detect agreed new bypasses/undefined references; test on known violation and clean case, document command and exclusions |
| Optional PR materials | Existing submission artifacts and authorized PR | Diff, contract/manual updates, actual validation, residuals and rollback scope; no claim of remote checks without evidence |

Generate only the subset requested for an intermediate task. At final handoff mark absent required deliverables as gaps; do not silently substitute this specification for functioning checks or code. Link to readable artifacts, not raw data alone. Aggregate small records into the project store where useful rather than asking users to manage each file manually.

## 3. Long-lived semantic-to-source mapping

This answers **what implements this semantic role?** It is not the migration plan.

For each semantic Token retain:

- stable ID, name, category, plain meaning, intended functions and confirmed framework revision;
- desired binding and observed binding per theme/brand/product scope;
- qualified primitive/library owner, alias chain, source file and selector, written expression and resolved display value when possible;
- runtime entrypoint/adapter and actual module/component/consumer references;
- unresolved resolution, observed evidence level, proposal/approval and implementation/verification status.

Example only (not universal names or values):

```text
Page background / --bg-body
  Light -> --neutral-50  -> primitive owner -> resolved color
  Dark  -> --neutral-950 -> primitive owner -> resolved color
  Semantic owner -> semantic-tokens.css -> theme adapter -> page shell consumers
```

User edits to a desired primitive/library binding are allowed before confirmation. A locked binding or source value change creates a new revision, recalculates all affected modules and invalidates only affected approvals. Changing a primitive can affect many semantic roles; preview that reach before approval. Existing source facts stay read-only.

CSS, TS and Tailwind are implementation representations, not automatically separate standards. Preserve `var()` references and correct value types even when display normalizes colors to hex. Do not replace an HSL channel Token with hex while leaving `hsl(var(...))` consumers unchanged. Non-color categories may use typed/composite values, asset exports or package mappings; never force them into color-shaped fields.

The final source map must be read back from the delivered library and adapters. If the desired and observed binding disagree, show it as unfinished instead of generating an apparently consistent manual from the desired value alone.

## 4. Old-style-to-target migration mapping

This answers **how should this existing usage change?** It belongs to the execution contract/history, not the permanent role definition.

An executable action identifies:

- action/issue IDs and individual occurrence IDs; module/shared-owner scope;
- old Token identity (owner, name, selector, mode) or direct value (file, property, syntax, source fingerprint);
- target semantic ID or a qualified deletion, action (`migrate`, `merge`, `delete`), plain rationale and consumer-context evidence;
- framework/source-binding revision, exact approved occurrence set and source preconditions;
- affected files/modules/states, required test and visual manifest, expected appearance (preserved or intentionally changed);
- approval record, source application result, checks, visual acceptance and residual blockers.

Do not delete a live declaration just because a user selected Delete. Revalidate references/public/dynamic contracts and required removal checks, explain the blocker if any. For a direct value, deletion also needs proof the declaration itself is unnecessary; absence of a target is not enough.

Shared old Tokens may migrate in several consumer batches. Track partial consumer progress while retaining one old-definition lifecycle record. Final deletion waits for all consumers and qualifying checks. Changing the semantic target invalidates that action's approval; changing a globally shared source binding may invalidate many actions.

`govern-ui-contract.json` is a project-level envelope linking the module map, baseline, framework/binding revision, actions, approvals, batches, verification and artifact manifest. It is **not** the existing CLI's `govern-ui-token-contract.json`. Do not pass it to `implement`, guess schema compatibility, or duplicate the old-to-new actions into independently maintained copies. Reference compatible executor payloads by ID/revision when those payloads exist.

## 5. Manual and execution-contract lifecycle

At framework definition, write concise rules for every baseline atomic category, including categories absent from the project: meaning, proposed roles, allowed themes/states/scopes, typed fields, underlying owner policy, use/reuse/new-role criteria and explicit exceptions. Retain unused/deferred definitions with the user's reason. Distinguish observed absence within a bounded scan from unverified project-wide usage. Show unanswered values/bindings as draft, not normative facts.

At confirmation, pin those rules to the framework revision and source-binding revision. Each mapping recommendation cites the relevant role or rule. Before each code batch, bind that revision to the actual source baseline, scope and approval. For framework amendments preserve old versions and show affected mappings/consumers.

After verification, add real source-backed specimens and short working consumption examples, adapter entrypoints, coverage and residuals. Final handoff includes how to choose a Token, how to propose a new one, how to run maintenance checks and how to resume unfinished work. The manual remains available throughout; it is not an extra approval step at the end.

## 6. Final acceptance

- All agreed modules and shared foundations have an explicit outcome; unresolved scope is not silently dropped.
- Every baseline atomic category remains defined in the editor, manual and full-framework export even with zero observations or an unused decision. After presenting the full baseline, respect explicit user deletions of individual Tokens; keep the category entry and do not re-add deleted Tokens on reload. Verify empty-input coverage and persistence of unused definitions; a category label alone is insufficient.
- The delivered source library and adapters actually supply the migrated consumers. Mode/type correctness, build/tests and required visual states are evidenced.
- Desired and observed bindings reconcile to the same approved version; source and migration mappings remain distinct and linked.
- Actual reductions use comparable units and original eligible scope; deleted/excluded items do not inflate absorption or repaired counts.
- Every residual/exception/unverified state is linked, with a next action or review trigger.
- Durable artifact locations exist, documentation is current, and maintenance checks have been run rather than merely described.
- PR/CI/Preview/deployed status is reported separately from local completion, and publication remains separately authorized.
