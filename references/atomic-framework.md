# Atomic framework editor

Use the shared catalog in `assets/atomic-framework-catalog.json`. All categories remain available even when their Token list is empty. Proposed defaults are not source observations.

## Interaction

The two primary actions are **添加新的语义 Token** and **确认规范**. Existing rows have quiet Edit/Delete controls; deletion can be undone. Do not add category-adoption forms, reason fields, per-category confirmation, or a source-picker step.

Add and Edit use the same compact dialog: Token name, meaning, and all category-specific typed properties with live specimens. Color includes light/dark values and alpha-preserving pickers. Typography retains family, size, weight, line height and tracking. Other categories retain their catalog fields: full multi-layer shadow expressions, stroke width/style, CSS radius shorthand, spacing units, opacity, filter type/expression, icon source/size/stroke, layer, motion and layout. Icon source suggestions use only available geometry. Never drop key parameters for visual simplicity.

Do not show a generic underlying-style catalog, custom-style selector, owner-path field, or duplicate label/location/scope fields in this dialog. Existing ownership, scope, stable IDs and source evidence remain in the data. Edits are proposed values, not writes to the underlying owner. Preserve raw source expressions and recompute preview values only for changed fields. Unknown references and unavailable assets remain explicitly unresolved.

Cancel and unchanged Save do not mutate state. Add inserts only after name uniqueness, meaning and typed values pass validation. Editing confirmed data creates a draft revision automatically while preserving immutable history; the overall confirmation is invalidated and mapping impact review is required. Deleting from the draft never deletes application source.

**确认规范** validates and confirms the entire current framework once. This persists a framework-only confirmation and category version references, not execution permission. Legacy category decisions/history remain preserved; a new full confirmation does not silently reuse an old unused-category approval.

## Generation and data

## Icons are a concrete directory

The Icons category lists every concrete UI icon with its real preview, name and all observed usage sizes. It is not three invented navigation/action/status glyphs. Keep graphic assets distinct from size/stroke Tokens and reference color semantics rather than duplicating colors here. Show the current size/stroke set above the directory; editing rows updates this set. Never infer rendered size from SVG viewBox.

Supply `iconCatalog` entries with id, name, source, optional importedName, sizes (CSS length strings), preview (base64 SVG/PNG/WebP), strokeWidth and evidence. Alternatively pass `--library <scan-data.json>` from the same inspected project/baseline; the CLI checks project identity but the agent must check baseline provenance because legacy scan files do not carry a commit. Source identity groups repeated occurrences and unions sizes; same names across sources stay separate. Brand marks and illustrations do not become UI icons. No inventory means an explicit empty directory, not invented assets.

Add/Edit icons uses actual graphic selection or upload, name, sizes, optional stroke and purpose. It does not require a CSS custom-property name. Missing geometry or size is explicitly unresolved and blocks overall confirmation until resolved or removed from the proposed target directory. Removing a proposal never deletes an asset. Old synthetic-role drafts are archived in category history and require new confirmation, not silently converted into assets. JSON preserves graphics, evidence and stable IDs; MD carries names and properties. Uploaded graphics are proposed assets, not existing source evidence.

Product A remains the complete factual inventory, B the editable target directory, C the mapping/lifecycle audit, and D the verified outcome. Resolve actual library exports using installed source where possible; never substitute a generic glyph for an unresolved icon.

`node <skill-dir>/scripts/framework.mjs --input <framework-input.json> --out <directory>`

Input `governui.framework-input/1` requires project, scope and baseline. Optional observations contain status/count/source samples. colorSeed/colorSources and category-typed styleSources supply qualified initial proposals with owner, values and file/line/expression evidence. displayValues/modePreviews are resolved presentation values, not replacements for source expressions. Inspected iconGeometry may provide safe SVG paths. bindingEvidenceBaseline records inspected source scope; storageKey/legacyStorageKey identify local drafts.

The generator produces token-spec.html and compatible framework.html, plus initial framework-styles.css/json and generated assets. HTML edits do not update these initial disk files: hand off the edited JSON and design manual for Codex reconciliation. See fixed-html.md for the shared style package.

Preserve saved edits, removed rows and historical versions on reload. Browser storage is a draft cache; export JSON for durable handoff. Exports are not implement payloads and no browser-to-Codex bridge is implied.

## Acceptance

Test every category's typed fields with empty source input, invalid/duplicate names, alpha preservation, cancel, no-op save, add/edit/delete/undo, reload/export, legacy confirmed history, global confirmation and its invalidation after edits. Check desktop/mobile dialog geometry and keyboard dismissal. Source observations and application code must remain unchanged.
