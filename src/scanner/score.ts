import type { LeakStatus, RiskLevel } from '../types.js';
import { clamp } from '../utils/helpers.js';

export function scoreLeakStatus(status: LeakStatus): number {
  switch (status) {
    case 'none': return 0;
    case 'hint': return 20;
    case 'fragment': return 45;
    case 'substantial': return 75;
    case 'complete': return 100;
  }
}

export function riskFromScore(score: number): RiskLevel {
  const safeScore = clamp(score, 0, 100);
  if (safeScore === 0) return 'secure';
  if (safeScore < 30) return 'low';
  if (safeScore < 60) return 'medium';
  if (safeScore < 85) return 'high';
  return 'critical';
}
