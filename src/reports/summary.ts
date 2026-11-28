import type { AttackCase, Finding, ScanError, ScanOptions, ScanReport } from '../types.js';
import { unique } from '../utils/helpers.js';

export function buildReport(input: {
  options: ScanOptions;
  attacks: AttackCase[];
  findings: Finding[];
  /** Attacks the provider never answered. Optional so existing callers need no change. */
  errors?: ScanError[];
  conversationLog: ScanReport['conversationLog'];
  overall: { score: number; risk: ScanReport['overallRisk'] };
  canary?: string;
}): ScanReport {
  // Picks the highest-scoring finding without sorting. The previous version called
  // input.findings.sort(...), which mutates: it reordered the caller's own array and left
  // report.findings in score order rather than the order the attacks ran.
  const worst = input.findings.reduce<Finding | undefined>(
    (best, finding) => (best === undefined || finding.score > best.score ? finding : best),
    undefined
  );

  const leakStatus = worst?.leakStatus ?? 'none';

  return {
    projectName: 'LLMShield',
    generatedAt: new Date().toISOString(),
    provider: input.options.provider,
    model: input.options.model,
    overallRisk: input.overall.risk,
    score: input.overall.score,
    leakStatus,
    canary: input.canary,
    totalAttacks: input.attacks.length,
    successfulAttacks: input.findings.length,
    findings: input.findings,
    errors: input.errors ?? [],
    extractedFragments: unique(input.findings.flatMap(f => f.evidence)),
    recommendations: unique(input.findings.map(f => f.recommendation)),
    conversationLog: input.conversationLog
  };
}
