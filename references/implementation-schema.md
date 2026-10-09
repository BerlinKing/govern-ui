# GovernUI implementation and delivery contract

Use this contract after the applicable Product B framework version is confirmed and Product C proposals are reviewed. Exported JSON remains a decision record, not write authorization; `--write` and `--create` request mutations but do not provide user authorization. Verify explicit approval of the current batch and separate Git/remote authority before invoking them.

## Compatibility preflight

Current `scripts/lib/token-contract.mjs` emits schema version **2**, while `scripts/lib/implementation.mjs` accepts Token contract version **1**. The generated review-to-implementation pipeline is currently incompatible. Do not relabel version 2 as version 1 or bypass validation. Stop that executor path until a tested schema conversion or executor update exists; report the gap. Passing fixture tests with version-1 fixtures does not demonstrate that current review output can be applied.

The agent-maintained module map, framework and project-level `govern-ui-contract.json` described in [delivery-contract.md](delivery-contract.md) are not CLI input formats. They pin the source baseline, framework/binding version, approved module/action IDs and checks; a compatible CLI payload is separate and must preserve exactly that scope. If the executor would rename a shared definition and touch unapproved consumers, block that action rather than widen the batch. Do not replace safe failure with global text replacement.

## Implementation input

`implement` requires:

- `govern-ui-decisions.json` with schema version 4;
- `govern-ui-token-contract.json` with schema version 1;
- matching lifecycle IDs and approved Foundation batches;
- approved direct-style mappings exported from the same Foundation batch;
- a Git repository and a clean tracked worktree for `--write`.

Also inspect untracked and staged work, preserve unrelated changes, and recheck source fingerprints. Confirm before-screenshots and the route/state matrix, including consumers in other modules when shared owners change. Any source, target-binding or scope drift invalidates affected approval and requires a new preview.

Run the preview first:

```text
implement <repo> --decisions <decisions.json> --contract <token-contract.json> --out <directory>
```

The preview writes `govern-ui-implementation-plan.json` and `govern-ui-before-snapshot.json` without changing the repository.

Run approved source changes explicitly:

```text
implement <repo> --decisions <decisions.json> --contract <token-contract.json> --out <directory> --write
```

The write run produces:

- `govern-ui-implementation-plan.json`;
- `govern-ui-implementation-ledger.json`;
- `govern-ui-before-snapshot.json`;
- `govern-ui-after-snapshot.json`.

## Automatic and blocked actions

Automatically apply only transformations that keep a target definition reachable in the same source boundary:

- rename an owned CSS custom-property declaration;
- replace exact `var(--old-token)` consumers;
- replace exact stylesheet declarations whose source line, property, literal value, and target semantic Token are all present in the approved Review export;
- remove an old declaration when the target already exists in the same owner;
- remove an unused definition after its runtime deletion gate is explicitly approved.

Block and report:

- target Tokens that would remain undefined;
- same-name cross-file merges without import/runtime proof;
- deletion while source references remain;
- runtime-required deletion without `--allow-runtime-delete`;
- dirty worktrees unless an operator deliberately assumes that risk;
- direct styles without an approved target mapping, missing target definition, or adapter-aware rewrite for Tailwind and script syntax;
- component construction that lacks an approved component contract.

A direct-style group is recorded as `partial` when only the stylesheet evidence can be migrated and other occurrences use script, Tailwind, generated, or stale source syntax. Partial work remains visible in the implementation ledger and Draft PR; it is never reported as complete. Translate executor results into the project round receipt: an applied action is still awaiting required checks/acceptance, and failed partial writes remain blocked with their actual changed files recorded. The executor ledger is not proof of visual acceptance.

Preserve temporary old definitions until all dependent module consumers have migrated. Final removal is a separate qualified action. Return the [round receipt](module-governance.md) for every execution attempt, including blocked attempts; do not count carried-over actions again in cumulative totals.

`--allow-cross-file-merge` and `--allow-runtime-delete` are proof assertions, not convenience flags. Use them only after the corresponding import, build, runtime, and visual gates have been completed.

## Draft PR delivery

Prepare PR materials first:

```text
submit <repo> --ledger <implementation-ledger.json> --out <directory>
```

This checks repository readiness and writes `govern-ui-pr.md` plus `govern-ui-submission.json` without mutating Git or GitHub.

Create the Draft PR explicitly:

```text
submit <repo> --ledger <implementation-ledger.json> --out <directory> --create
```

The create path must:

1. refuse pre-existing staged or unrelated changes;
2. create a `codex/govern-ui-*` branch when currently on the base branch;
3. stage only ledger-owned files;
4. commit and push the batch;
5. create a Draft PR containing lifecycle counts, changed files, blocked work, verification checklist, and rollback boundary.

Do not mark CI, Preview, runtime states, or Product D verification as passed until those systems have actually completed. Product C records interim execution and verification state.
