# Artifact Schemas

## Contents

1. Audit report
2. Finding
3. Token definition and relationship
4. Baseline
5. Decision export

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
  "componentBlueprint": {
    "status": "draft-source-blueprint",
    "staticLayers": [],
    "dynamicContracts": []
  },
  "findings": [],
  "hotspots": [],
  "maturity": {},
  "recommendedLane": "Bootstrap | Migrate | Hybrid",
  "nextActions": []
}
```

The report may contain `generatedAt`, but stable identifiers must not depend on time or absolute repository paths.

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
