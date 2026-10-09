# Element-level first-pass reconnaissance

Read before producing a module issue list. The minimum unit is a meaningful UI element, not a directory or every DOM node.

## Contract

Use `business module → functional area → subfunction → UI element`. Keep stable IDs for each level. Separate the element's owner from the product locations that consume it. A shared Tooltip panel is a shared implementation with one or more affected locations, not several independently owned problems.

Keep two linked records:

- **Element inventory:** include elements with and without findings. Preserve actual style declarations, Token/adapter references, relevant Light/Dark definitions, states, conditions, source files/lines and unparsed expressions. No matched rule does not mean all checks passed.
- **Issue inventory:** one concrete root problem, its element/occurrence IDs, atomic category, supporting declaration, relevant state, location/opening steps, proposed next check, and separate evidence/work status. Fixed dimensions, equal colors and lack of references are not automatically problems or deletion approval.

Do not split decorative DOM wrappers. Do split independently styled surfaces, text, icons, input fields, arrows and masks. Components provide source context for atomic styles; this does not authorize building a molecule/component library.

Every element must provide a product path, preconditions and ordered opening steps. Verify these against route registration, caller chain, visibility guards and event handlers. A source-derived path is **not replayed** until the real page is opened in the matching checkout/build. Source located, runtime observed and deployed use are distinct facts.

Analyze the **selected callsite** before counting branches. Literal caller props can make a branch inactive in this location; that does not prove it is unused throughout the repository. Preserve inactive facts and their caller evidence, excluding them from active issue counts. Never erase other callers or propose deleting a whole branch on this basis.

Use actual image captures only with matching baseline, route, steps, theme and state. A reconstructed specimen must be labelled as a specimen, not a product screenshot. Do not fabricate an icon preview or Light/Dark value when source geometry or cascade is unresolved.

## Reusable scoped command

```text
node <skill>/scripts/govern.mjs recon <repo> --scope <element-scope.json> --out <outside-repo-directory>
# If TypeScript is not resolvable from the repository root:
node <skill>/scripts/govern.mjs recon <repo> --scope <element-scope.json> --out <directory> --typescript <installed-typescript.js>
```

This is a **detailed reconnaissance view supporting Product A**. It emits `module-recon.html` and `element-recon.json`, not an additional top-level product. Product B defines the framework, Product C audits mappings and execution, and Product D closes with verified outcomes.

The command uses an already-installed TypeScript parser. It does not install dependencies or execute application/config code. It accepts an **analyst-authored scope**; it does not autonomously discover every business function or prove full source reachability.

Scope schema 1:

| Field | Contents |
| --- | --- |
| `id`, `repositoryId`, `project` | Stable pilot/project identity; do not use a date as the element identity |
| `nodes` | `{id, parentId?, title: [Chinese, English]}` hierarchy; no cycles |
| `entries` | `{file, tag, contains?, targetFile}` selects one caller for each inspected component file; exact literal boolean props constrain branches |
| `elements` | Stable `id`, `nodeId`, bilingual `title`, `kind`, `file`, JSX `locator`, bilingual `contextLabel`, `opening`; optional shared owner ID and `inheritsFrom` |
| `locator` | `{tag, contains?, count?}`; anchor must match expected count; drift stops instead of selecting a different element |
| `opening` | Bilingual `location`, `preconditions`, `steps`, and nonempty source `evidence` anchors |
| Evidence anchor | `{file, contains}`; text must uniquely exist in the current repository |
| `styleSources` | Explicit CSS owner files; definitions are candidates, not proof of final cascade |
| `adapterSources` | Explicit Tailwind config files; inspect property namespaces without executing config |
| `contextEvidence` | Extra route/entry/visibility evidence anchors |
| `exclusions` | Named areas/branches outside the pilot, reason and source anchors where available |

See `scripts/tests/element-recon.test.mjs` and its small TSX fixture for a working schema. Author project-specific maps outside the skill and outside the scanned repository; do not embed OJO paths in the general engine.

### Implemented extraction / limits

Implemented: JSX attributes; literal class strings; conditional / `&&` class branches; `cn` / `clsx` / `classnames`; unique immutable top-level class constants; inline style assignments; width/height; event/disabled props; static caller booleans; explicit inherited JSX parent checks; common static Tailwind adapters; custom CSS class candidates; recursive CSS variable definition candidates. Each fact preserves its source and condition. Alias cycles terminate without claiming resolution.

Unsupported dynamic expressions/spreads are visible. Control-flow reachability, nested state propagation, arbitrary class factories, plugins, full CSS parsing/cascade, computed values, themes, package icon geometry and browser behavior are **not** solved by this command. In particular, CSS owner matches are candidates, not runtime resolution. Keep raw expressions rather than inventing values.

Initial checks are deliberately narrow: explicit direct colors, literal shadow and z-index, text-input use of an icon-named color, and focus-outline removal requiring runtime verification. Semantic name mismatch is a question supported by element/property evidence, not automatic migration. Do not claim this command detects every duplicate, broken reference or unused Token; use the existing global inventory/rules and further consumer checks for those.

## Interface and round receipt

- Left hierarchy drills to subfunctions. Right table separates **Issues** and **All UI elements**.
- Main columns: element, concrete issue/current styles, relevant condition, product location/opening path, details. No repeated generic governance prose.
- Details: reproducible steps, current styles and Tokens, inherited styles, inactive branches, then collapsed engineer evidence. Never show an empty placeholder as a visual specimen.
- Overview: elements, unique problems/checks, actual user decisions, runtime-verified elements. Style occurrences are not Token counts, and repeated consumers are not separate root issues.
- Report queued source observations, needs-user-decision semantic questions, and blocked runtime checks separately. Source observations are not completed cleanup. No implementation was performed by reconnaissance.

Start with one named functional chain. Acceptance requires: every selected meaningful element is represented; each finding opens to a real element and source; all known states and opening steps are accounted for or marked unverified; shared roots deduplicate; inactive branches do not inflate counts; scope gaps stay visible; the target repository remains unchanged. Only then expand to other modules.

## Verification

```text
GOVERN_UI_TYPESCRIPT=<installed-typescript.js> node --test scripts/tests/element-recon.test.mjs
node --test scripts/tests/run-tests.mjs scripts/tests/implementation.test.mjs
```

Browser-check hierarchy selection, search/category filters, details/close/Escape, keyboard focus, JSON export, bilingual switching and desktop/mobile overflow. Inspect a real rendered report; passing source tests alone does not accept UI layout or prove product runtime behavior.
