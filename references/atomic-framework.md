# Complete atomic framework

Read when defining the target framework. Category existence does not depend on observed source usage. Use `assets/atomic-framework-catalog.json` as the baseline, then adapt names, meanings and proposed roles to the project. Keep all baseline categories visible and defined; add project-specific categories when justified. The catalog supplies role proposals and fields, not an adopted visual style or proof of current implementation.

| Category | Required definition coverage |
| --- | --- |
| Color | Surfaces, text, actions, functional icons, borders, brand, feedback, media overlays and data colors |
| Typography | Families, text roles, size, weight, line height and tracking as a composite |
| Icons | Source/asset family, semantic roles, nominal geometry, size and stroke rules; distinct from icon color and hit target |
| Shadow | Elevation roles and complete shadow expressions, including a no-shadow choice |
| Stroke | Width, style and focus treatments; border color stays in Color |
| Radius | Square, control, container and pill shape roles |
| Spacing/sizing | Insets, gaps, control heights and minimum target dimensions |
| Opacity | Disabled, scrim and decorative transparency roles; avoid double-applying alpha |
| Blur/filter | Backdrop and content filter roles, including a no-effect choice |
| Layers | Base, sticky, floating, modal and notification order with stacking-context ownership |
| Motion | Feedback, entry/exit and loading duration/easing/property plus reduced-motion behavior |
| Responsive layout | Breakpoints, content width, gutters and grid behavior |

Unclassified is a separate evidence queue. It is not a design role or a substitute for missing categories.

For each category keep two independent records:

- Observation: detected, not detected **within the named scope**, or unverified. Counts and samples reference the scan baseline; lack of observations does not decide adoption.
- Adoption: undecided, adopt, unused or defer. Unused/defer retain the current category definitions and a user-entered reason. Within a category, list the target Tokens directly; users delete unwanted entries instead of checking a per-role adoption box.

Every role has a stable ID, proposed name, clear purpose, intended location/scope, and category-specific binding fields. Do not fabricate source files, values, asset geometry or project-wide absence. Unbound proposed definitions are valid framework drafts. Every remaining Token needs complete typed bindings before an adopted category can be locked. Unused/deferred decisions can be recorded without bindings and remain visible in later versions. Locked edits create a revision; never overwrite the original snapshot or imply that framework confirmation modified application code.

The initial framework must include the full baseline. After it is presented, users can explicitly delete any proposed Token, including built-in proposals, from their project draft. Keep category entries, descriptions and typed fields even when all Tokens are deleted. Deletion from the target draft is separate from source cleanup. Offer undo, retain confirmed history, persist deletion across reload/export, and never repopulate a user's deleted entry on load. The baseline catalog remains reusable for new projects. A confirmed category needs a new revision before deletion; list membership replaces per-role checkboxes.

## Standalone definition editor

Generate a self-contained offline editor from the shared catalog and a source-evidence input:

```bash
node <skill-dir>/scripts/framework.mjs --input <framework-input.json> --out <output-directory>
```

Input schema `governui.framework-input/1` requires `project`, `scope` and `baseline`. Optional `observations` are keyed by catalog category ID with `status`, `count` and source `samples`. Optional `colorSeed` and `colorSources` carry qualified color proposals and source candidates; omit them for an empty project. `styleSources` supplies category-typed candidates for all atoms: each has an ID, category, name, owner, values, and file/line/expression evidence. Partial composites are allowed as candidates but must be completed before binding. `displayValues` and `modePreviews` hold qualified resolved specimens while raw expressions remain intact. Icons can carry inspected `iconGeometry` with a viewBox and safe path records; never invent package geometry. `bindingEvidenceBaseline` records hashes and scope of the inspected source catalog. `storageKey` and `legacyStorageKey` identify project-local browser drafts. The generator validates the input and embeds it with the complete catalog in `framework.html`; it does not scan source or create adoption decisions.

## Bind styles

Keep the agreed role name, meaning and scope in view. Let the user search category-compatible existing styles, inspect a visual specimen and actual typed values, and adjust a target or define a custom style. Display complete source details on demand, rather than a raw JSON dump as the primary interface. A candidate is not a confirmed binding: only Confirm binding saves the target. Cancel discards edits; Remove binding clears only the desired mapping.

Keep original source evidence immutable. Record adjusted values as a proposed target while preserving the source used as its starting point. Preserve raw variable expressions and mode-specific resolved previews separately; changing a raw value invalidates that field's old resolved preview. Partial candidates show missing fields and cannot be confirmed until complete. Unknown references and unavailable icon/font assets have an explicit preview limitation. A specimen is not verification of the product's rendered page.

The binding editor uses the same source picker across categories, with category-specific fields and specimens. Typography shows text, Shadow shows depth, Radius and Stroke show shape, Spacing shows separation, and Motion offers an intentional sample playback respecting reduced motion. Keep category adoption separate from browsing/editing a draft binding; opening the binding step must not implicitly adopt or lock a category. `framework.html?step=binding` opens the binding view without confirming any decisions.

The editor supports all category definitions, typed source/target bindings, explicit adoption decisions, per-category confirmation/revisions, full-framework JSON export and a manual export. Existing color-only drafts can be imported into a new draft while preserving their complete original record. Browser storage is local draft storage; exported records are required for durable handoff. This standalone editor is not a local service or an automatic code-execution bridge and its exports are not `implement` payloads. The existing `review` command remains a separate source-derived draft; use this editor for the complete definition step.

Acceptance must include an empty source input, an unused category with its definitions preserved after reload/export, a non-color typed binding, immutable category revisions, and deletion/undo of built-in Tokens across reload and export without losing the category entry. A test that expects an unimplemented non-color page is a failure of framework coverage.

### Populated default style sheet
Generate a complete underlying style sheet with concrete, editable default values for every defined role, including categories absent from project evidence. Seed bindings and previews immediately; users must not start from empty fields. Reuse qualified project values where appropriate and author a coherent fallback for the remainder. Generated defaults are proposals, not observed source evidence or confirmed adoption. Emit `framework-styles.css`, `framework-styles.json` and any generated assets alongside the HTML. Preserve existing edits, deletions and locked snapshots; backfill only missing bindings once.

### Unified semantic Token editor
Present definition and style binding together under “定义语义 Token”. Each row shows the semantic name, purpose, location/scope, preview and current typed values. Use one editor to save definition and binding atomically; do not require separate definition/binding steps. Preserve the semantic-token-to-underlying-style relationship in data.

### Category-specific Token creation
Add Token opens the current atomic category editor, with semantic name/purpose and a complete typed style draft together. Color requires light/dark color pickers plus editable color expressions and alpha preservation. Typography uses family/size/weight/line-height/tracking; other categories use their own catalog fields and appropriate numeric/select controls. Seed meaningful category defaults and show a live specimen. Validate and save definition plus style atomically. Cancel must never insert a partial Token.
