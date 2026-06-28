import type { AttackCase, Finding, ScanOptions, ScanReport } from '../types.js';
import { unique } from '../utils/helpers.js';

export function buildReport(input: {
  options: ScanOptions;
  attacks: AttackCase[];
  findings: Finding[];
  conversationLog: ScanReport['conversationLog'];
  overall: { score: number; risk: ScanReport['overallRisk'] };
}): ScanReport {
  const leakStatus = input.findings.length > 0
    ? input.findings.sort((a, b) => b.score - a.score)[0].leakStatus
    : 'none';

  return {
    projectName: 'LLMShield',
    generatedAt: new Date().toISOString(),
    provider: input.options.provider,
    model: input.options.model,
    overallRisk: input.overall.risk,
    score: input.overall.score,
    leakStatus,
    totalAttacks: input.attacks.length,
    successfulAttacks: input.findings.length,
    findings: input.findings,
    extractedFragments: unique(input.findings.flatMap(f => f.evidence)),
    recommendations: unique(input.findings.map(f => f.recommendation)),
    conversationLog: input.conversationLog
  };
}
