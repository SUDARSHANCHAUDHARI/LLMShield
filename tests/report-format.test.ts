import { describe, expect, it } from 'vitest';
import { formatReport } from '../src/reports/format.js';
import type { ScanReport } from '../src/types.js';

const report: ScanReport = {
  projectName: 'LLMShield',
  generatedAt: '2026-06-28T00:00:00.000Z',
  provider: 'mock',
  model: 'mock-model',
  overallRisk: 'secure',
  score: 0,
  leakStatus: 'none',
  totalAttacks: 1,
  successfulAttacks: 0,
  findings: [],
  extractedFragments: [],
  recommendations: [],
  conversationLog: []
};

describe('report format selection', () => {
  it('formats JSON reports', () => {
    const output = formatReport(report, 'json');

    expect(JSON.parse(output)).toMatchObject({
      projectName: 'LLMShield',
      overallRisk: 'secure'
    });
  });

  it('formats Markdown reports', () => {
    const output = formatReport(report, 'markdown');

    expect(output).toContain('# LLMShield Report');
    expect(output).toContain('Risk: secure');
  });
});
