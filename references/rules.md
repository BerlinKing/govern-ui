# Audit Rules

## Contents

1. Scope and confidence
2. Token relationships
3. Findings
4. Components and overlays
5. Exceptions
6. Lane classification

## Scope and confidence

The Lite scanner performs conservative source analysis. It does not execute repository code, resolve build-time plugins, inspect Figma, or infer runtime CSS cascade with browser fidelity.

- High: deterministic syntax or an explicit contract violation.
- Medium: strong structural evidence that still needs semantic review.
- Low: a useful candidate that cannot safely drive a gate or migration.

Only new High findings fail `check`.

## Token relationships

### Adapter

Classify as `adapter` when a representation references another source instead of copying its literal value. Examples include Tailwind colors using `var(--color-*)` or one CSS custom property aliasing another.

### Scope override

Classify as `scope-override` only with source evidence such as `.dark`, `[data-theme]`, `[data-brand]`, application-scoped selectors, or an explicit alias layer. The scanner may miss dynamically constructed selectors; report them as unassessed.

### Duplicate

Use `duplicate` for repeated same-name/same-value definitions across owners or same-value/different-name candidates. Same-value/different-name candidates remain review-required because equal values do not prove equal semantics.

### Semantic conflict

Use `semantic-conflict` for the same normalized name with different literal values outside an evidenced scope. Do not automatically choose a winner.

### Owner conflict

Use `owner-conflict` when multiple substantial Token sources are not connected by aliases or adapters. Owner selection requires human confirmation.

### Bypass

Use `bypass` when raw visual values occur in product source while at least one Token owner exists. Ignore dependencies, generated output, snapshots, and the governance report itself.

## Findings

Lite rules include:

- `system.token-owner-missing`
- `system.token-owner-ambiguous`
- `system.component-owner-ambiguous`
- `system.multiple-theme-sources`
- `token.raw-color`
- `token.raw-length`
- `token.raw-typography`
- `token.raw-motion`
- `token.undefined-reference`
- `token.semantic-conflict`
- `token.duplicate-definition`
- `token.semantic-layer-bypass`
- `component.native-button-bypass`
- `component.native-input-bypass`
- `component.primitive-duplication`
- `component.dialog-duplication`
- `overlay.raw-z-index`
- `overlay.layer-contract-missing`

Raw length, typography, and motion findings are Medium or Low by default because many literal values are legitimate geometry or one-off media constraints.

## Components and overlays

Identify owner candidates from shared/public directories, package exports, barrel files, and repeated imports. File names alone are evidence, not proof.

Overlay findings require special care. Dialog, Sheet, Popover, Dropdown, and Toast ownership includes focus, Escape, Portal, scroll-lock, and semantic layer responsibilities; matching appearance does not prove compatible behavior.

## Exceptions

Possible exceptions include:

- Canvas coordinates and generated geometry;
- data visualization and user-provided colors;
- illustrations and complex gradients;
- media aspect ratios and intrinsic dimensions;
- third-party component internals;
- email, PDF, image, or screenshot rendering;
- generated files and code-generation output;
- short-lived visual experiments.

An accepted exception should record reason, owner, scope, and review condition. Lite reports candidates but does not create exception policy automatically.

## Lane classification

Recommend:

- `Bootstrap`: no meaningful Token/component foundation and limited existing UI surface.
- `Migrate`: substantial UI surface plus competing owners, duplicated primitives, or high raw-value density.
- `Hybrid`: a credible foundation exists, but adoption or ownership remains partial.

Always include evidence and confidence. Repository age is not a classification input.
