# Artifact Schemas

## Contents

1. Audit report
2. Finding
3. Token definition and relationship
4. Baseline
5. Visual review brief
6. Decision export

## Audit report

```json
{
  "schemaVersion": 1,
  "reportId": "stable hash",
  "repoProfile": {},
  "scan": {
    "scannedFiles": 0,
    "skippedFiles": 0,
    "skippedByReason": {},
    "excludedScopeEntries": [],
    "unassessedAreas": []
  },
  "styleSystems": [],
  "tokenDefinitions": [],
  "tokenReferences": [],
  "tokenOwners": [],
  "componentOwners": [],
  "overlayOwners": [],
  "componentAdapters": [],
  "relationships": [],
  "conflicts": [],
  "systemReview": {
    "modelVersion": "0.7",
    "model": "static-five-dynamic-four",
    "status": "source-derived-system-review",
    "staticLayers": [],
    "dynamicLayers": []
  },
  "componentBlueprint": "deprecated compact compatibility blueprint",
  "findings": [],
  "hotspots": [],
  "maturity": {},
  "recommendedLane": "Bootstrap | Migrate | Hybrid",
  "nextActions": []
}
```

The report may contain `generatedAt`, but stable identifiers must not depend on time or absolute repository paths.

`systemReview` is the primary user-facing information model. It always contains five static layers—Foundation, Atoms, Molecules, Components, and Patterns—and four dynamic layers—Interaction foundation, Component behavior, Cross-component orchestration, and Flow/lifecycle. Every category carries a status and metrics. `detected` means source evidence exists; it is not a health claim. Dynamic categories remain `unverified` until runtime behavior is actually inspected.

The Foundation/Color category also carries `colorWorkbench`. It groups canonical definitions into independent color sources, separates adapters from competing systems, classifies palette/semantic/component layers, compares standard semantic roles, groups hardcoded values, proposes keep/merge/scope actions, and renders a source-derived target. This structure is deterministic source evidence; candidate ownership and visual hierarchy still require product or runtime confirmation.

Foundation/Typography, Spacing and density, Shape and stroke, and Depth and layer categories carry `foundationWorkbench`. Each workbench contains an architecture summary, independent canonical `systems`, standard `roleRows`, grouped `usageGroups`, raw-value `bypasses`, `systemActions`, and a source-derived `target`. `usageGroups` labels ordinary Tailwind classes as `utility` evidence and raw CSS or arbitrary values as `direct-value`; utility usage is not automatically design debt. The visual report renders actual values as typography, spacing, shape, stroke, shadow, opacity, or layer specimens instead of presenting definitions as scanner totals.

Foundation/Icons and assets carries `iconWorkbench`. It inventories package libraries, repository-owned SVG collections, imported SVGs, inline SVGs, and Icon/Image/Avatar component candidates. It compares detected grid, stroke, and fill conventions and proposes a primary source without treating widespread inline SVG usage as a design-library owner. The top-level report also includes `iconAssets` for traceability.

## Finding

```json
{
  "ruleId": "token.raw-color",
  "severity": "medium",
  "confidence": 0.97,
  "file": "src/components/Card.tsx",
  "line": 28,
  "evidence": "background: #ffffff",
  "fingerprint": "sha256 prefix",
  "suggestedAction": "Map to a reviewed semantic surface Token",
  "autofix": "none",
  "verification": "source"
}
```

The fingerprint uses rule ID, normalized path, normalized evidence, and occurrence. It intentionally excludes line numbers.

## Token definition and relationship

Token definitions include `name`, `normalizedName`, `value`, `kind`, `sourceType`, `role`, `file`, `line`, `selector`, and `ownerId`. `role` separates canonical definitions from adapters and framework-local values.

Relationships include `type`, `id`, `definitionIds`, `ownerIds`, `reason`, `confidence`, and `reviewRequired`.

## Baseline

```json
{
  "schemaVersion": 1,
  "policyHash": "stable hash",
  "acceptedAt": "ISO date",
  "repoId": "stable repository fingerprint",
  "findings": [
    {
      "fingerprint": "...",
      "ruleId": "...",
      "severity": "high",
      "file": "...",
      "evidence": "..."
    }
  ]
}
```

Baseline status contains `unchanged`, `new`, `stale`, and `policyDrift`. Lite reports policy drift but does not silently accept it.

## Decision export

```json
{
  "schemaVersion": 1,
  "reportId": "...",
  "repoId": "...",
  "status": "draft",
  "decisions": [
    {
      "conflictId": "...",
      "decision": "canonical | keep-separate | alias | migrate | exception | not-conflict | defer",
      "canonicalOwnerId": null,
      "note": ""
    }
  ]
}
```

An exported file is always a draft. It never authorizes source modification by itself. Unreviewed groups are omitted; `defer` must be selected explicitly.

The HTML may also include `packageDecisions`, which preserves the user-facing decision-card grouping and may reference `findingFingerprints`. The `decisions` array remains flattened by `conflictId` for compatibility.

## Visual review brief

The optional `reviewBrief` is a bilingual semantic layer between audit evidence and the offline HTML. Schema version 2 places every product decision under a `systemPath` and carries the standard category contract, current/target specimens, a recommendation, consequences, and plain-language evidence. See [review-brief-schema.md](review-brief-schema.md).
