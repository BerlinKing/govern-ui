# Module-first governance and round receipts

Read before a complete project assessment or a module batch. The first pass is read-only reconnaissance across the agreed project; later work is incremental. A business module is a unit of responsibility and verification, not a new Token namespace by default.

## 1. Establish the module map

Record the repository IDs/roots and source revisions or working-tree fingerprints. Multi-repository projects can share a map, but unavailable repositories remain coverage gaps and each repository retains its own write authority.

Derive candidate modules from routes, feature entrypoints, component/import graphs, visible product functions and shared dependencies. Directory names are hints, not proof. Canvas, conversation stream, composer, team management, editor and resource explorer are examples, not a mandatory taxonomy.

Persist `module-map.json` with these logical fields (an agent-maintained record, not an existing CLI schema):

| Record | Required information |
| --- | --- |
| Project scope | Project/repository IDs, source baseline, included and excluded roots, unavailable areas, confirmation record |
| Business module | Stable `moduleId`, human-readable name, parent where useful, routes/entrypoints, owned components/source boundaries, observed states and themes |
| Shared foundation | Stable owner ID, Token/theme/adapter/base-component entrypoints, consuming module IDs, boundary evidence |
| Attribution | Source/definition/usage IDs, owning module or shared owner, consumer modules, evidence level and unresolved assignments |
| Exclusion | Exact scope, reason, evidence and review trigger |

Before style diagnosis, ask only about ambiguous module boundaries or omissions. A requested single-module pilot may proceed with a provisional map, but cannot claim a project-wide standard or complete shared-impact coverage. User edits to module labels never overwrite source evidence. Structural overlaps may be represented as relationships; do not copy the same finding into independently editable records.

## 2. Read-only global reconnaissance

Use all agreed modules to understand existing style owners and repeated needs before designing global semantics. Inventory Color, Typography, UI Icons/assets, Shadow, Stroke width/style, Radius, Spacing/sizing, Opacity, Blur and Unclassified. Preserve Layer/z-index and Motion evidence when present; these are not an invitation to start behavior/component construction.

For every module, summarize:

- existing style-library owners and adapter/consumer coverage;
- owned and referenced shared Tokens, direct-style occurrences and their actual functions;
- duplicate candidates, conflicting semantics/modes, broken references and unused candidates;
- unsupported syntax, dynamic/public use, ignored files and unverified runtime states;
- shared owners that connect this module to others.

Product A remains factual and links the module issue clues; they later feed Product C's contextual proposals. Product B defines standards, not an issue queue. A preliminary issue needs a stable `issueId`, atomic category, root cause, source evidence, affected occurrence IDs and module IDs, a concise proposed investigation and current status. Do not manufacture confirmed mappings before framework approval.

Before presenting that list, follow [element-reconnaissance.md](element-reconnaissance.md): expand modules into functional areas, subfunctions and independently meaningful UI elements. Record a complete element inventory, not only errors. Each issue links concrete element/state/property evidence and product opening steps. Trace the chosen callsite to distinguish inactive branches from live candidates; source-derived steps and real-page replay are separate statuses. The `recon` command supports an explicitly scoped TSX chain, not automatic whole-project discovery. Test one chain before expanding coverage.

Separate counts explicitly:

- A definition is keyed by repository, owner, name, selector/scope and mode; the same definition referenced in five modules counts once globally.
- Module views show owned definitions and referenced shared definitions separately. Overlapping module totals must not be summed as the project total.
- Occurrences, unique rendered values, semantic target slots, issues and executable actions are different units.
- One root issue affecting 80 occurrences may require several independently tracked actions. Show both counts without treating 80 consumers as 80 user questions.
- Initial percentages use a named baseline and eligible scope. Record newly discovered/reopened items instead of quietly changing historical denominators.

Classify equal values and unreferenced assets as candidates until contextual/deletion checks pass. Excluding illustrations, user content or generated output is not a code repair. When a scan is incomplete, scope its conclusion and list missing coverage.

## 3. One shared standard, explicit scoped values

After reconnaissance, follow the foundation guide to propose the global framework and underlying style bindings. Reuse qualified owners rather than building parallel CSS/JS/Tailwind systems. The user's editable choices cover taxonomy, names, meanings, intended locations, scope, required modes/states, primitive/library owners and their bindings.

Framework confirmation and code authorization are distinct. Lock the confirmed categories and source bindings in a versioned record, with unresolved/disabled categories explicit. A module batch can use a confirmed category without waiting for unrelated categories. A new semantic or a different shared mode value requires a new revision and a consumer-impact diff. Existing product-specific values can remain explicit scoped mappings; global semantics do not require identical brand values.

## 4. Plan and execute bounded rounds

Agree cadence before implementation:

- Default: propose one batch, obtain approval, execute and return its receipt before continuing.
- Optional: the user may authorize a named set of batches and a stopping policy. Specify allowed modules, action IDs, framework revision, source baseline, validation and pause conditions. This is not permission to autonomously widen scope.

Select the smallest coherent `module x related styles x real page states` slice. A composer background/text/border group may be appropriate; a whole application rarely is. Do not invent a universal number of items per batch.

Each round records `roundId`, `batchId`, source baseline, module and dependency IDs, framework/source-binding revision, issue/action IDs, expected changes, required checks, before/after artifacts and approval references.

1. Revalidate the selected slice and shared dependency consumers against current source. Reuse valid global reconnaissance; widen discovery if shared owners or consumer graphs changed.
2. Map eligible occurrences to confirmed roles using actual property/layer/state/mode evidence. Present unresolved questions with a recommendation and concrete effect of each choice.
3. Preview exact changes and affected files/modules/states. Capture source and visual baselines before writing; record intended visual changes in advance. Missing runtime access stays unverified.
4. Check input compatibility and obtain batch authorization. Implement only approved actions. A shared Token's reach may exceed the owning module; verification expands to affected modules, while writes beyond the approved scope require approval.
5. Re-scan changed areas, check adapters/build/tests and compare the same real page states. Record automated checks and human acceptance independently.
6. Return the round receipt, including failures, remaining actions and a proposed next batch. A partial application is not an all-or-nothing success. On failure stop affected work, preserve evidence, and use only the approved rollback boundary; never revert unrelated work.

Pause affected execution when source has drifted, a decision changes, a new owner/semantic is needed, scope expands, deletion evidence fails, or required checks fail. Keep unaffected approvals valid only if dependency analysis proves they are unaffected. Do not hide an unresolved decision behind an aggregate confidence score.

Keep old definitions/aliases while any consumer still needs them. Once every dependent module is migrated, recheck dynamic/public contracts and regression before final deletion. An isolated module passing tests does not qualify deletion of a globally shared asset or Token.

## 5. Round receipt and counting rules

Every reconnaissance, diagnostic and execution round ends with a receipt, even if no code changed. Use **action items** as the receipt's counting unit; retain root-issue counts and affected-occurrence counts as separate supporting metrics. An unqualified finding can be a provisional action item with no executable action yet. A split/merged item keeps predecessor links so continuation does not count it twice.

Each active item has exactly one current receipt status:

| Status | User label | Meaning |
| --- | --- | --- |
| `completed` | 已完成 | Approved action was applied and all required checks and acceptance passed; links to evidence exist |
| `awaiting-acceptance` | 已修改，待验收 | Source changed but checks or required human/visual acceptance remain outstanding |
| `needs-decision` | 需要你确认 | A specific unresolved product choice is required; include the actual question, proposed answer and impact |
| `excluded` | 已排除 | Outside the agreed governance scope, with evidence and reason; not repaired or deleted |
| `exception` | 保留特例 | In-scope UI deliberately retained with owner, reason, boundaries and review trigger |
| `blocked` | 暂缓／受阻 | Execution cannot proceed under current evidence, dependencies, authorization or checks; retain partial-write details |
| `queued` | 待处理 | Not yet evaluated or approved for execution, or approved but not yet applied |

Confirmation and execution phases are separate fields: decision approval does not promote an item to `completed`. A failed action with partial writes is `blocked`, with changed files and outstanding tests visible. A batch's completed count excludes exceptions/exclusions; they may close decisions, not represent cleanup savings.

Receipt format:

```text
Round <id> · <module/scope> · <reconnaissance/review/execution> · Framework <revision>
This round: <N> action items, affecting <M> source occurrences
Completed / awaiting acceptance / needs decision / excluded / exception / blocked / queued
Needs your decision: each grouped point, recommended choice, affected functions
Changed: actual actions/files; tests and page states verified or unverified
Cumulative: distinct items by status, newly discovered/reopened items, baseline ID
Next: proposed bounded batch or concrete unblock step
```

The seven counts must sum to the distinct active items in that round. A carried-over item appears in the round's workset but only once in cumulative totals. Show actual new completions separately if presenting a per-round increment. Receipt status is not the same as an old Token's final lifecycle action (`migrate`, `merge`, `delete`). A unchanged canonical Token does not need a fictitious migration; an exception can have a deferred lifecycle recorded without claiming it executed.

## 6. Cross-module closure

Re-scan the agreed project scope once at closure, compare with the original and each accepted batch baseline, and check shared dependency reachability, remaining compatibility aliases, undefined references and direct-style residuals. Reconcile pending/blocked decisions rather than hiding them in an exclusions bucket.

Separate actual implementation completion, decision coverage, Token reduction and direct-style absorption. Count semantic target slots separately from primitives and mode definitions so a reduction claim compares the same units. Never count deletion as absorption or exclusion as a fix.

The final result can be fully accepted within the agreed scope, partially delivered, or blocked. Unverified states and missing repositories remain explicit and prevent a project-wide success claim. Complete the deliverables in [delivery-contract.md](delivery-contract.md); Git/PR actions remain separately authorized.
