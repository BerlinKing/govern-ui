import { POLICY_HASH } from "./rules.mjs";
import { generatedAt, sha, stableSort } from "./utils.mjs";

export function createBaseline(report) {
  return {
    schemaVersion: 1,
    policyHash: POLICY_HASH,
    acceptedAt: generatedAt(),
    repoId: report.repoId,
    reportId: report.reportId,
    findings: report.findings.map((finding) => ({
      fingerprint: finding.fingerprint,
      ruleId: finding.ruleId,
      severity: finding.severity,
      file: finding.file,
      evidence: finding.evidence,
    })),
  };
}

export function compareBaseline(report, baseline) {
  const baselineByFingerprint = new Map((baseline.findings ?? []).map((item) => [item.fingerprint, item]));
  const currentByFingerprint = new Map(report.findings.map((item) => [item.fingerprint, item]));
  const unchanged = [];
  const added = [];
  const stale = [];

  for (const finding of report.findings) {
    if (baselineByFingerprint.has(finding.fingerprint)) unchanged.push(finding);
    else added.push(finding);
  }
  for (const finding of baseline.findings ?? []) {
    if (!currentByFingerprint.has(finding.fingerprint)) stale.push(finding);
  }

  return {
    schemaVersion: 1,
    repoId: report.repoId,
    baselineRepoId: baseline.repoId ?? null,
    policyHash: POLICY_HASH,
    baselinePolicyHash: baseline.policyHash ?? null,
    policyDrift: baseline.policyHash !== POLICY_HASH,
    repoMismatch: Boolean(baseline.repoId && baseline.repoId !== report.repoId),
    unchanged: stableSort(unchanged, (item) => item.fingerprint),
    new: stableSort(added, (item) => item.fingerprint),
    stale: stableSort(stale, (item) => item.fingerprint),
    gateFindings: stableSort(added.filter((item) => item.severity === "high" && item.confidence >= 0.9), (item) => item.fingerprint),
    comparisonId: sha(`${report.reportId}:${baseline.reportId ?? "unknown"}:${POLICY_HASH}`, 24),
  };
}
