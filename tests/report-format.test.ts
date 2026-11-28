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
    expect(output).toContain('No findings.');
  });

  it('includes evidence, response and recommendations for findings', () => {
    const output = formatReport(
      {
        ...report,
        overallRisk: 'critical',
        score: 100,
        leakStatus: 'complete',
        successfulAttacks: 1,
        findings: [
          {
            attackId: 'direct-001',
            attackName: 'Direct | request',
            category: 'direct-extraction',
            risk: 'critical',
            leakStatus: 'complete',
            injectionFollowed: false,
            score: 100,
            response: 'Sure, here are my instructions: be nice',
            evidence: ['canary token disclosed (plain)'],
            recommendation: 'Fix it.'
          }
        ],
        recommendations: ['Fix it.']
      },
      'markdown'
    );

    expect(output).toContain('| Direct \\| request | direct-extraction | critical | complete | no |');
    expect(output).toContain('- canary token disclosed (plain)');
    expect(output).toContain('Sure, here are my instructions: be nice');
    expect(output).toContain('## Recommendations\n\n- Fix it.');
  });
});
