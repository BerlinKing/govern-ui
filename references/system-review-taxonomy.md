# System-first review taxonomy

Use this taxonomy as the primary outline for every non-trivial GovernUI review. The scanner is an evidence engine; it does not define the report structure.

## Contents

1. Review rules
2. Static system: five layers
3. Dynamic system: four layers
4. Leaf-category contract
5. Designer-facing presentation contract
6. Foundation workbench reference implementations
7. Color reference implementation
8. Status and verification language

## Review rules

- Render every layer and category, including `not-detected` and `unverified` categories.
- Organize findings under system categories. Never organize the user-facing report by scanner rules, severity, owners, or file types.
- Treat accessibility, responsive behavior, ownership, scope, and runtime verification as cross-cutting quality gates.
- Do not infer a healthy system from the absence of findings.
- Do not infer semantic equivalence from equal values.
- Do not infer a target appearance from source evidence alone. Use rendered product evidence or ask the user to decide.
- Keep source paths, excerpts, fingerprints, and raw counts in collapsed engineer details.

## Static system: five layers

### 1. Foundation

| Category | Required subcategories |
| --- | --- |
| Token architecture | Primitive Tokens, semantic Tokens, component Tokens, aliases, ownership, scope contract |
| Color | Primitive palette, brand/action hierarchy, surface/content/border roles, feedback colors, interaction states, themes/scopes, data visualization |
| Typography | Font families and scripts, semantic roles, scale, weight/line-height/tracking, numeric/code styles, responsive type |
| Spacing and density | Base scale, component inset, inter-component space, layout space, control sizing, density modes |
| Grid and responsive | Breakpoints, containers, columns/gutters, responsive rules, safe areas |
| Shape and stroke | Radius scale, border width/style, dividers, focus ring |
| Depth and layer | Elevation, shadow, opacity/scrim, blur, semantic z-index and stacking contexts |
| Icon and assets | Icon library, size/grid, stroke/fill, logos, illustrations, imagery |
| Motion parameters | Duration, easing, delay, spring parameters, reduced motion |
| Accessibility baseline | Contrast, minimum text, touch targets, focus visibility, non-color cues |

### 2. Atoms and primitives

| Category | Example items |
| --- | --- |
| Layout primitives | Box, Stack, Inline, Grid, Divider |
| Content primitives | Text, Heading, Icon, Image, Avatar |
| Action primitives | Button, IconButton, Link |
| Input primitives | Input, Textarea |
| Selection primitives | Checkbox, Radio, Switch |
| Status primitives | Badge, Tag, Spinner, Skeleton, Progress |

### 3. Molecules

| Category | Example items |
| --- | --- |
| Field composition | FormField, SearchField, InputGroup |
| Selection and disclosure | Select, Combobox, Autocomplete, DatePicker, Dropdown, ContextMenu |
| Navigation aids | Tabs, SegmentedControl, Breadcrumb, Pagination |
| Anchored feedback | Tooltip, Toggletip, TagGroup, FileUploader |

### 4. Components

| Category | Example items |
| --- | --- |
| Navigation | Header, Sidebar, Navigation, PageHeader |
| Data display | Table, DataTable, List, Tree, Card, Metric, Timeline |
| Overlays | Dialog, Modal, Drawer, Sheet, Popover, Menu |
| Messaging and feedback | Alert, Toast, Banner, EmptyState |
| Complex input | Form, Filter, FileUploader, Editor |
| Product components | Product-specific shared surfaces such as a Canvas toolbar or chat composer |

Distinguish public library components, application-shared components, product-specific components, adapters, and accidental duplicate primitives.

### 5. Patterns and templates

| Category | Required coverage |
| --- | --- |
| Page layout | Page shell, list/detail, master/detail, dashboard and settings composition |
| Form and validation | Labeling, validation timing, error recovery, submit states |
| Search/filter/sort | Query entry, applied filters, result count, empty result and pagination |
| Loading/empty/error | Initial loading, incremental loading, empty state, failure, retry and success |
| Destructive/permission | Confirmation, irreversible action, permissions, authentication expiry |
| Responsive composition | Reflow, replacement, collapse, navigation changes and safe areas |

## Dynamic system: four layers

Dynamic categories are horizontal behavior contracts applied to the static component inventory. Do not duplicate the atomic hierarchy.

### 1. Interaction foundation

- State vocabulary and precedence: default, hover, focus, active, selected, disabled, loading, invalid, success, empty.
- Input modalities: pointer, touch, keyboard, shortcuts, long press and double click where applicable.
- Feedback contract: visual, text, sound, haptics and assistive-technology announcements.
- Motion rules: feedback, guidance, continuity, enter/exit, interruption and reduced motion.

### 2. Component behavior

- Activation, selection and value changes.
- Input, formatting, validation timing and error recovery.
- Keyboard navigation, focus movement and focus-visible behavior.
- Disclosure, opening, closing and dismissal.
- Async loading, success, failure, retry and cancellation.

### 3. Cross-component orchestration

- Portal ownership, anchor boundaries, collision handling and semantic layer order.
- Focus trap, roving focus, initial focus and trigger restoration.
- Body/container scroll lock, scroll restoration and virtual scrolling.
- Modal stack, Toast queue, Tooltip provider, Theme/Locale/Density providers.
- Drag/drop, pointer capture, gestures, cancellation and keyboard alternatives.

### 4. Flow and lifecycle

- Loading, optimistic updates, rollback, recovery and cancellation.
- Routing, back navigation, focus restoration and scroll restoration.
- Draft/session/route persistence and refresh behavior.
- Breakpoint, viewport, orientation, keyboard and safe-area adaptation.
- Permission, authentication, timeout, offline and network changes.
- Screen-reader announcements, reduced motion, interruptibility and runtime performance.

## Leaf-category contract

Every leaf category must render these sections in order:

1. **Standard definition**: what a healthy design system should define.
2. **Current inventory**: definitions, unique values, owners, usages, bypasses, scopes, variants and runtime coverage as applicable.
3. **Current visual or state model**: swatches, specimens, state matrix, layer stack or flow.
4. **Gap**: missing, duplicated, fragmented, conflicting, bypassed, scoped exception or unverified.
5. **Target model**: the proposed hierarchy, names, roles, owners and visual/behavior result.
6. **Recommendation**: keep, consolidate, alias, adapt, migrate, deprecate, preserve an exception or verify at runtime.
7. **User decision**: explicit choices with concise consequences.
8. **Engineer evidence**: collapsed paths, code excerpts, fingerprints and raw scanner output.

On decision cards, render the current and target elements as the largest surfaces. Collapse the standard definition, gap explanation, limitations, and engineer evidence after using them to derive one short question and one recommendation. Never repeat the same point in multiple visible paragraphs.

## Designer-facing presentation contract

Present each category as a design-library specification sheet, not as a scanner dashboard:

1. Lead with the category name, its product purpose, and a plain status sentence.
2. Show the current product as visible specimens or a matrix. Use the axes that designers actually compare: role, variant, hierarchy, size, state, density, theme, mode, or composition.
3. Place dark/light, desktop/mobile, default/hover/focus/disabled, or other relevant modes side by side when evidence exists. Mark absent or unverified cells instead of inventing them.
4. Put the proposed target beside or immediately after the current system. Use source-derived values only; otherwise describe the structural contract and the decision still needed.
5. End with an explicit keep, merge, replace, scope, or verify recommendation and a user decision where judgment is required.
6. Keep raw definition counts, paths, syntax, and code in optional engineer evidence. Counts may support a conclusion, but must never be the visual hierarchy of the page.

The interactive review uses five modules backed by one state: UIKit, governance batches, genuine decisions, visual validation, and finish/export. A routine migration row is evidence inside a Foundation-level batch, not an independent approval. The Finish module is the only final export surface.

Never render silent blanks. If current source evidence is absent, say so explicitly on the current canvas while still rendering a neutral, complete target contract. Every common component preview must show recognizable content and states rather than an unlabeled outline.

When no shared component candidates are detected, classify the condition before recommending construction:

- scanner miss: a framework or generated owner exists outside the initial rules; expand discovery;
- implicit system: repeated product patterns exist without shared owners; propose extraction and consolidation;
- genuine absence: present a minimal Starter UIKit proposal for approval, but do not create source components during Review.

When a partial system exists, prefer its qualified owners and fill contract gaps. Do not build a parallel system merely because some standard nodes are missing.

Foundation categories should resemble foundation specification sheets. Atom and molecule categories should resemble component specification sheets with anatomy, variants, sizes, content combinations, and states. Components and patterns should show realistic compositions and responsive or lifecycle variants. Dynamic categories should use state matrices, transition sequences, focus/layer diagrams, and coordinated behavior tables.

## Foundation workbench reference implementations

The Color workbench below is the most detailed reference, but it is not the only foundation category that deserves a visual review. When source evidence exists, render these additional workbenches:

- **Typography:** render five regions in order: current font families, current source-derived type scale, project-derived target scale and weight strategy, direct typography bypasses, and governance result. Use supplied references for layout and category logic, not as fixed values. Derive target sizes, line heights, weights, scopes, and usage from the repository; separate shared UI scales from product-scoped display, marketing, editor, numeric, and brand typography. Show real specimens and list observed product locations plus shared/scoped/derived actions. Group every raw CSS and utility bypass by font size, line height, weight, family, letter spacing, style, and other typography; attach occurrence counts, files, product locations, and a prefilled convergence action without truncation.
- **Spacing and density:** compare base scale, component inset, component gap, layout spacing, control size, and density modes; render each real length as a bounded bar or box; keep deliberate geometry distinct from reusable spacing decisions.
- **Shape and stroke:** compare radius, border width/style, dividers, and focus rings; render real corners and strokes; do not confuse border colors with stroke-width contracts.
- **Depth and layer:** compare shadow/elevation, scrim opacity, blur, and semantic z-index; render real shadow and opacity specimens and list layer values; keep visual elevation and runtime stacking-context ownership as separate checks.
- **Icons and assets:** separate package libraries, owned SVG collections, imported assets, inline SVGs, and Icon/Image/Avatar components; compare detected grid, stroke, and fill conventions; prefer a real library or owned collection as the source candidate, not the most frequent inline usage.

Every workbench follows the same reading order: conclusion → current sources and real specimens → standard role comparison → bypasses → keep/merge/scope actions → source-derived target → collapsed engineer evidence. Missing roles remain explicit; exact target values are never invented.

## Color reference implementation

The Color Review is a target-system completion board. Keep it visual and compact. It has six regions in this order:

1. Standard framework: background, text, stroke, icon, brand/action, feedback, data visualization, and scoped/component roles.
2. Source-derived primitive palette: group every unique rendered value into neutral, brand/action, feedback, and remaining candidates. If any view is truncated for performance, show displayed and total counts explicitly.
3. Literal-format normalization: convert readable primitive literals and report labels to uppercase `#RRGGBB` or `#RRGGBBAA`. Keep `var()` aliases intact. The target chain is `Primitive literal -> Semantic var() -> Product usage var()`.
4. Semantic Token completion matrix: one row per target role, with a square swatch before the Token name, dark mapping, light mapping, product usage, and a prefilled action. Use a deep-gray dark canvas (`#1C1C1C`) and a light-gray light canvas (`#F5F5F3`). Checkerboard means transparency; an empty outlined square means missing. Render background, text, stroke, icon, brand/action, feedback, data visualization, and scoped/component as standalone subheadings outside their tables.
5. Hardcoded-color governance: group UI literal occurrences by canonical rendered color plus scene, feature, state, and scope. Show raw occurrence count separately from the smaller governance-cluster count. Attach product locations and a prefilled target action to every cluster. Exclude colors embedded inside illustrations, logos, decorative SVGs, raster images, and other graphic assets; review those objects only in the asset catalog. Data visualization includes only colors that communicate real chart, series, plot, heatmap, or similar data meaning.
6. Governance result: compact migrate, merge, delete, and unresolved-semantic counts. Keep lifecycle lists and source evidence collapsed by default.

The Skill fills source-backed mappings automatically. Ask the user only about missing roles, incompatible candidates, or intentional scopes. Persist those compact choices in the exported review JSON.

Always distinguish these counts:

- Definition files.
- Canonical definitions.
- Unique rendered values.
- References/usages.
- Name-declared brand, primary, secondary and tertiary roles, kept separate from observed usage.
- Hardcoded occurrences and files.
- Selectors or classes that assign color.
- Same-value/different-name groups.
- Same-name/different-value groups.
- Theme, brand, application and page scope definitions.
- Undefined references and unassessed runtime usage.

Do not determine `primary` from a name alone. Compare declared roles with observed usage in primary actions and brand emphasis when rendered screens are available. Report the difference as declared versus observed.

Render the current color system as:

1. A direct conclusion: whether a real primitive palette exists, whether semantic roles exist, how many independent canonical color sources exist, and whether global usage is governed.
2. User-named palette lanes such as global candidate, theme or brand colors, likely legacy colors, and unconfirmed sources. Keep file paths secondary.
3. Implementation approaches attached to those sources. CSS Variables, Tailwind, and JS/TS are representations, not automatically separate systems.
4. Role comparison for brand, action hierarchy, background, surface, content, border, feedback, interaction, and data-visualization colors. Show missing roles explicitly.
5. Hardcoded-value hotspots grouped by actual rendered value, with an evidence-backed target mapping or an explicit “unmapped” state.
6. Keep, merge, alias, deprecate, or scoped-exception recommendations at both source and Token-family level.
7. A source-derived target preview that uses real candidate values and visibly marks roles that still require product decisions or runtime verification.

Render the target model as:

```text
Primitive palette
  -> Semantic roles
      -> background / surface / content / border
      -> action primary / secondary / tertiary
      -> success / warning / error / info
      -> hover / pressed / selected / disabled / focus
          -> Component Tokens
```

Keep data-visualization, brand and product scopes explicit instead of silently flattening them into ordinary UI color roles. Illustration and graphic-asset internals are outside the Color system and belong only to asset governance.

The target is one global semantic color contract with controlled mappings, not one flat palette of literal values. Light/dark themes, brands, applications, data visualization, and illustration may preserve different values when they map through explicit roles and scopes.

## Status and verification language

| Status | Meaning |
| --- | --- |
| `detected` | Source evidence exists. This is not a health claim. |
| `partial` | A system exists but has bypasses, incomplete coverage or adapters without a complete contract. |
| `fragmented` | Multiple owners, conflicts or incompatible systems require a decision. |
| `missing` | The product uses values or behavior without an identified governing system. |
| `not-detected` | No source evidence was found; confirm whether the category is applicable. |
| `unverified` | Runtime, rendered, accessibility or product evidence is required. |

Use `source-verified`, `runtime-verified`, `inferred`, and `unassessed` as separate evidence labels. Confidence is secondary metadata, never the user-facing conclusion.
