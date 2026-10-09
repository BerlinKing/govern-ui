# Atomic framework and diagnosis guide

Read this before authoring Product B or migrating source, after the module map and global reconnaissance in [module-governance.md](module-governance.md). The scanner supplies observations; it does not decide what the product's standard should be. Build a shared atomic framework across modules, then use it in small module batches. The purpose is to let someone without prior UIKit vocabulary make a small number of product decisions from visible evidence.

## 1. Establish the target before filling it

Choose the starting posture from evidence, not repository size:

| Existing condition | Target-framework approach |
| --- | --- |
| One qualified owner already supplies reusable styles | Preserve its role structure; repair consumers, missing roles, and adapter gaps. |
| Multiple competing owners or copies | Compare consumer coverage, theme behavior, package boundaries, and actual UI states; propose one owner per applicable scope. Do not make unrelated apps compete by default. |
| No meaningful shared rules | Supply the complete atomic category and role framework from [atomic-framework.md](atomic-framework.md). Propose meanings and use rules; leave project-specific values and source bindings pending until established. |

Teach three layers in the review: a **primitive** is a raw reusable value (such as a blue or spacing step); a **semantic Token** says what UI job it performs (such as primary action background); a **component Token** exists only where a component has a stable, distinctive contract that cannot use the shared role. Light/dark are mappings of the same role, not duplicate Token names. A value's existence does not prove it deserves a global role.

Always define Color, Typography, Icons/assets, Shadow, Stroke width/style, Radius, Spacing/sizing, Opacity/scrims, Blur/filter, Layer/z-index, Motion and Responsive layout. Retain Unclassified as an evidence queue. The framework is complete even when a project uses none of a category. Give every category meaningful role proposals, typed definition fields and use rules; empty navigation or an unavailable editor does not fulfill this requirement. Record observations separately from adoption: `not-detected-in-scope` and `unverified` are evidence states, while `unused` and `defer` are explicit user decisions that retain all definitions. Record each proposed slot's category, Token name, plain-language meaning, intended locations, scope, states/modes, owner and rationale. Label intended locations and values as proposals when not source-backed. In Color, distinguish page/surface/elevation/scrim, text hierarchy, interactive action, functional icon, border, brand, feedback, data and product scopes; do not generate a full state Cartesian product.

Use cross-module reconnaissance to avoid a standard tailored only to the first feature. Alongside each role, record its proposed underlying primitive/library owner and theme-specific binding. The user may edit both the semantic definition and that binding. Existing source observations are not editable facts. Global semantics can keep explicit product/brand theme values; do not force unrelated scopes into a single literal palette.

The framework is confirmed **per global atomic category** and then locked as a versioned contract with its source-binding revision. A locked version is read-only; user edits create the next draft and a diff of affected roles, consumers and approvals. New diagnosis that appears to need another role is an explicit difference: map to an existing slot, propose a later version, retain a bounded local exception, or leave unresolved. Never mutate a confirmed category merely because the scanner proposed a name. A module batch can use the confirmed categories while unrelated unresolved categories remain outside its scope.

Until the review UI can export framework versions directly, persist the confirmation as a separate `govern-ui-framework.json` outside the target repository. Keep it small and auditable, for example:

```json
{
  "schemaVersion": "govern-ui-framework/v1",
  "version": 1,
  "status": "locked",
  "sourceReportId": "audit report ID",
  "categories": [
    {
      "id": "color",
      "status": "confirmed",
      "slots": [
        {
          "name": "--bg-body",
          "meaning": "Application page background",
          "intendedLocations": ["application page shell"],
          "scope": "shared"
        }
      ]
    }
  ]
}
```

This abbreviated example omits the other required categories and source-binding map for readability; a real export must preserve the full catalog, definitions, adoption reasons and observations as well as the module map/source baseline. It is **not** an implementation-ready Token contract. Record unused or deferred categories explicitly with their definitions, the user's confirmation basis and version-to-version changes. Do not set `status: locked` without actual user confirmation. The present `implement` CLI does not enforce this file; Codex must reconcile it manually and report that limitation.

Start `DESIGN-SYSTEM.md` with this framework, using [delivery-contract.md](delivery-contract.md). The permanent source map (`semantic role -> mode-specific primitive/style -> file/adapter -> consumers`) and the migration map (`old source occurrence -> approved target/action`) answer different questions. Do not confuse a proposed source binding with observed implementation. Defer the Light/Dark filling interface when the current task is only defining categories and semantics; show values once the user is reviewing their bindings or mappings.

## 2. Exclude non-governance data before recommending a mapping

For every source occurrence, classify the *meaning of the value in context*:

- Shared UI style: a reusable visual role across consumers; eligible for the target framework.
- Product-scoped UI style: a real visual role limited to a product, feature, component, or mode; eligible for a scoped rule if repeated or contractually important.
- Content/data: user-authored colors, data-series values, uploaded media, illustration or logo internals; do not convert into global UI Tokens. Code-driven data visualization may need its own scoped palette.
- Layout geometry or behavior: canvas coordinates, intrinsic media dimensions, graph positions, animation timing for a local behavior, network or upload settings; not style debt merely because numeric.
- Generated, vendor, test, or historical evidence: preserve scan provenance, but do not count as active product migration without reachability proof.
- Unresolved: insufficient consumer or runtime evidence; show what observation would change the conclusion.

An exception is not an untracked escape hatch. Record its owner, reason, bounded scope, affected states, and review trigger. Keep raw occurrence count separate from unique values, definition count, governance clusters, and confirmed UI debt. Do not present a speculative number as “cleanup savings.”

## 3. Diagnose from consumers outward

For each candidate, answer five questions in the visible review: **where does it appear; which property and layer does it control; in which theme/state; why does that match a target role; and would replacement preserve the observed effect?** Follow `definition -> alias -> adapter -> consumer -> component/page -> property -> layer -> state -> mode -> scope`. Runtime-rendered evidence outranks source consumer evidence; source context outranks owner/name; equal values alone prove nothing.

Cross-category checks prevent common false merges:

| Category | Diagnose together | Keep separate |
| --- | --- | --- |
| Color | Property, layer, alpha, theme, state, consumer role | Same hex used for page, text, action, or scrim; illustration internals |
| Typography | Family/script, size, weight, line height, tracking, text role | Same size with different reading hierarchy; size without line height |
| Icons | Source package/asset, rendered geometry, role, state, size grid | Icon geometry versus click/touch target; decorative assets versus UI icons |
| Stroke/shape | Width, style, radius, color role, focus behavior | Border color (Color) versus width/style (Stroke); focus ring versus ordinary border |
| Spacing/sizing | Component inset, inter-element gap, page layout, density | Canvas coordinates, runtime-calculated width, intrinsic media size |
| Depth/effects | Shadow, opacity, blur, z-index, Portal/stack owner | Dialog surface versus translucent backdrop; raw z-index equality across stacking contexts |
| Motion | Duration/easing and the behavior/state they serve | A one-off transition versus shared feedback rhythm; reduced-motion behavior |

Use `source-confirmed` when real consumers agree on role and scope, `source-suggested` when a likely role still needs mode/owner or visual proof, and `manual-review` when consumers conflict. An unknown is a result, not permission to manufacture a target. Show affected functions and examples before engineer paths and excerpts.

## 4. Choose the smallest durable outcome

Make the choice in this order:

1. **Reuse** a qualified existing semantic when consumer purpose, state, mode, and scope match.
2. **Propose a new standard slot** only when a repeated shared need has no suitable role; explain its difference and expected consumers. Send the addition through framework-version difference review.
3. **Retain a local exception** when the need is genuine but not a shared system responsibility.
4. **Defer** when evidence is insufficient, with one concrete verification task.

Then resolve each old Token to a final `migrate`, `merge`, or `delete` lifecycle action. `migrate` preserves a distinct role under the approved target; `merge` unifies equivalent consumer semantics and compatible modes under one owner; `delete` needs no surviving consumer or public/dynamic contract plus applicable trial, runtime, and regression gates. Aliases are temporary rollout tools, not final outcomes. Direct values either map to an approved role, motivate a versioned addition, or remain a documented exception. Do not merge different semantics to improve a reduction percentage.

## 5. Prove adoption, not just definition

For every approved batch, trace `target definition -> CSS/JS/Tailwind adapter -> primitive or base component -> product consumer -> computed/browser result`. Check build-system transforms and class-merging rules where applicable; a Token file or class name can exist while the final style is overridden or discarded. Verify relevant theme, interaction, viewport, and overlay states with the same before/after matrix. If actual runtime access is missing, mark those states unverified and do not claim visual acceptance.

Keep a local structured ledger as the decision/execution source of truth, with observed source evidence stored separately. Stable IDs distinguish **decision confirmed**, **source changed**, **automated checks passed**, and **visual accepted**; HTML or external trackers are views, not proof on their own. Distinguish issues, actions and individual occurrences so counts remain comparable. On continuation, rescan changed areas and reconcile existing IDs instead of reopening resolved items as new work. Return the mutually exclusive round receipt in [module-governance.md](module-governance.md); a shared definition counts once globally even when several modules use it.

The final deliverable follows [delivery-contract.md](delivery-contract.md): a usable source library with adapters and migrated consumers, versioned framework, manual, permanent source map, migration/execution contract, A/B/C/D records, residuals and tested maintenance checks. A report generated from a parallel hard-coded palette is not evidence that the application has adopted the standard.
