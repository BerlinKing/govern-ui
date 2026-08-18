# GovernUI implementation and delivery contract

Use this contract after Product B has been reviewed. The exported JSON remains a draft; the explicit `--write` or `--create` command is the source or remote-mutation authority.

## Implementation input

`implement` requires:

- `govern-ui-decisions.json` with schema version 4;
- `govern-ui-token-contract.json` with schema version 1;
- matching lifecycle IDs and approved Foundation batches;
- approved direct-style mappings exported from the same Foundation batch;
- a Git repository and a clean tracked worktree for `--write`.

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

A direct-style group is recorded as `partial` when only the stylesheet evidence can be migrated and other occurrences use script, Tailwind, generated, or stale source syntax. Partial work remains visible in the implementation ledger and Draft PR; it is never reported as complete.

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

Do not mark CI, Preview, runtime states, or Product C as passed until those systems have actually completed.
