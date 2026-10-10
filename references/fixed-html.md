# Fixed HTML contract

The shipped presentation source is `assets/artifacts/`, not a generated output or the old local preview folder. `styles.css` is the approved preview stylesheet; `compat.css` adapts existing tested editors and supporting evidence pages. `template-lock.json` pins the shared style hash. Never rewrite CSS, layout, icons or navigation for a new repository. Change only evidence and proposal data. A deliberate visual update must update the lock and pass browser checks.

Version 1.1 places A/B/C/D as prominent page-top steps below the brand header, not inside the brand navigation. Product A displays every module card immediately; do not collapse excess modules behind a disclosure. Keep detailed evidence collapsible. This layout applies to all repositories through the shared renderer.

## Real generation paths

- `govern.mjs library <repo> --out <dir> [--module-map <module-map.json>]` produces A `scan.html` and compatible `style-library.html` with real library data. `style-library-detail.html` retains the full old inventory tools/alias mapping. No example counts or package-icon substitute geometry. Without an explicit module map, cards are source-attribution labels, not confirmed business modules. Cross-module groups are overlapping associations, not additive module totals.
- `framework.mjs --input <framework-input.json> --out <dir>` produces B `token-spec.html` and compatible `framework.html`. Existing typed editors, category confirmation, immutable revisions and JSON/MD exports remain. Proposed defaults are not source observations.
- `artifacts.mjs --input <artifact.json> --out <dir>` renders C or D from the evidence contract below. It only renders; it does not diagnose or execute changes.
- `recon`, legacy `review` and `regression` supporting HTML use the same versioned stylesheet and artifact navigation. `module-recon.html` is A detail, not the project homepage. `design-review.html` remains a legacy diagnostic supplement, not B or a confirmed C. `visual-regression.html` remains D evidence, not a final conclusion.
- Missing artifacts get explicit not-produced landing pages, not sample outcomes. Reuse one output directory for the same project. Do not merge unrelated projects/runs. Hand off `scan.html` for A and `token-spec.html` for B.

Every generated HTML has `governui-template` and `governui-style-sha256` metadata. `artifact-template.json` records the same version/hash. Existing HTML does not magically update: regenerate it with this installed version. When templates are absent, report a packaging error instead of inventing a replacement layout.

## C/D rendering input

Common: `schema: "governui.artifact/1"`, `artifact: "C" | "D"`, `project`, `scope`, `baseline`. These are presentation evidence records, **not** implement payloads.

C additionally takes `frameworkRevision` and `groups`. Each group has a unique `id`, `module`, `title`, `status` (`needs-attention`, `applied`, `verified`, `excluded`, `blocked`, `queued`), `occurrences` (`file`, `line`, `location`), and optional `reason`, `current`, `proposed`, `target`, `action`. Group only compatible semantics. Needs-attention groups are collapsed and grouped by module; all records remain available. Decisions export as `governui.audit-decisions/1` with `authorization: none`; edits do not mean applied or verified. No browser autosave is promised here; export before leaving. Codex must reconcile these records with B and source evidence before any execution. They do not feed the legacy executor directly.

D additionally takes `status` (`partial` or `complete`), `conclusion`, actual integer `metrics` (`tokensChanged`, `filesChanged`, `linesAdded`, `linesRemoved`), `modules` (`name`, `status`, `summary`), `captures` (`name`, `status`, offline data-image `before`, `after`, optional `diff`), `residuals` (strings), `deliverables` (`label`, local relative `file`). Counts must come from execution receipts/diffs. Do not render an unexecuted target as a completed result. Confirm the linked files exist. Use partial for missing required verification; the renderer cannot prove source or runtime evidence.

## Checks

Run `node --test scripts/tests/artifact-template.test.mjs` and existing core tests. Browser: `GOVERNUI_PLAYWRIGHT=<existing playwright/index.mjs> GOVERNUI_CHROME=<chrome binary> GOVERNUI_REPORT_DIR=<generated A/B dir> node scripts/tests/artifact-browser.mjs`. This tests A/B real inputs and explicitly labelled C/D test fixtures, not real governance completion. Also run `framework-browser.mjs` for editor regression. No dependency installation is required by these tests.
