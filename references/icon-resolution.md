# Real icon evidence

Import names are inventory, not successful graphic extraction. `library` statically reads installed `lucide-react` and `@radix-ui/react-icons` exports and embeds their actual SVG geometry offline. It never imports/evaluates dependency modules. Local SVG handling remains separate. Other unsupported library formats remain unresolved, not replaced with a generic glyph.

If dependencies are absent, inspect package manifest and lockfile first. Download only exact locked packages to an isolated temporary directory with scripts disabled (for example `npm pack <name>@<locked-version> --ignore-scripts`). Inspect archive paths, unpack into separate directories, verify package identity/version and lock integrity. Do not install dependencies into the target repository just to render icons.

Set `GOVERN_UI_ICON_PACKAGE_ROOTS` to a JSON object mapping package names to inspected unpacked roots. The scanner itself performs no network requests and never silently uses a latest version. Keep provenance with scan records.

Consumer sizing uses a preinstalled TypeScript parser (`GOVERN_UI_TYPESCRIPT` when not locally resolvable). Read actual JSX uses with import aliases, literal size/width/height and static size/w/h utility classes. Evidence retains source path, line and original expression. Numeric Tailwind utilities remain symbolic unless the agent has inspected the active spacing theme and overrides; then supply `GOVERN_UI_ICON_SPACING`, e.g. `0.25rem`. Keep rem as rem; do not assume runtime root font size. Explicit dimensions, aspect ratios, conditional classes, wrappers, style objects and inherited sizing must not be flattened into false certainty. Dynamic or indirect consumers remain visible as unresolved/partial evidence and require further diagnosis.

Regenerate A, then generate B with `framework.mjs --input ... --library <new scan-data.json> --out ...`. Existing B drafts fill only missing previews/sizes by asset ID and source, preserve edits/deletions and revoke confirmation when target sizes are filled. A new scan is not runtime verification.

Acceptance requires a real project: counts reconcile; no substituted artwork; browser image decoding succeeds; inspect screenshots of actual icons; known direct consumers have source-backed sizes. Test unsupported packages, missing exports, aliases, multiple sizes, and stale local drafts. Fixture-only editor success is not parser acceptance.
