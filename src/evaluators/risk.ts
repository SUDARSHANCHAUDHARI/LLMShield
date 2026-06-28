import type { Finding, RiskLevel } from '../types.js';
import { riskFromScore } from '../scanner/score.js';

export function calculateOverallRisk(findings: Finding[]): { score: number; risk: RiskLevel } {
  if (findings.length === 0) return { score: 0, risk: 'secure' };
  const maxScore = Math.max(...findings.map(f => f.score));
  return { score: maxScore, risk: riskFromScore(maxScore) };
}
