import { describe, expect, it } from 'vitest';
import { buildReport } from '../src/reports/summary.js';
import type { Finding, ScanOptions } from '../src/types.js';

const options: ScanOptions = {
  systemPrompt: 'Be helpful.',
  provider: 'mock',
  model: 'mock'
};

function finding(attackId: string, score: number, leakStatus: Finding['leakStatus']): Finding {
  return {
    attackId,
    attackName: attackId,
    category: 'direct-extraction',
    risk: 'medium',
    leakStatus,
    injectionFollowed: false,
    score,
    response: 'reply',
    evidence: [`evidence for ${attackId}`],
    recommendation: 'Fix it.'
  };
}

// Deliberately not in score order: the low scorer runs first, as it would in a real scan.
function unsortedFindings(): Finding[] {
  return [finding('first', 20, 'hint'), finding('second', 100, 'complete'), finding('third', 45, 'fragment')];
}

describe('buildReport', () => {
  it('does not reorder the findings array it was given', () => {
    const findings = unsortedFindings();

    buildReport({
      options,
      attacks: [],
      findings,
      conversationLog: [],
      overall: { score: 100, risk: 'critical' }
    });

    expect(findings.map(item => item.attackId)).toEqual(['first', 'second', 'third']);
  });

  it('keeps attack order in the report, not score order', () => {
    const report = buildReport({
      options,
      attacks: [],
      findings: unsortedFindings(),
      conversationLog: [],
      overall: { score: 100, risk: 'critical' }
    });

    expect(report.findings.map(item => item.attackId)).toEqual(['first', 'second', 'third']);
  });

  it('still reports the worst leak status, wherever it sits in the array', () => {
    const report = buildReport({
      options,
      attacks: [],
      findings: unsortedFindings(),
      conversationLog: [],
      overall: { score: 100, risk: 'critical' }
    });

    expect(report.leakStatus).toBe('complete');
  });

  it('reports the worst leak status when the highest scorer is last', () => {
    const report = buildReport({
      options,
      attacks: [],
      findings: [finding('a', 20, 'hint'), finding('b', 100, 'complete')],
      conversationLog: [],
      overall: { score: 100, risk: 'critical' }
    });

    expect(report.leakStatus).toBe('complete');
  });

  it('keeps the first of two findings tied on score, as a stable sort would', () => {
    const report = buildReport({
      options,
      attacks: [],
      findings: [finding('earlier', 75, 'substantial'), finding('later', 75, 'fragment')],
      conversationLog: [],
      overall: { score: 75, risk: 'high' }
    });

    expect(report.leakStatus).toBe('substantial');
  });

  it("reports leak status 'none' with no findings", () => {
    const report = buildReport({
      options,
      attacks: [],
      findings: [],
      conversationLog: [],
      overall: { score: 0, risk: 'secure' }
    });

    expect(report.leakStatus).toBe('none');
    expect(report.errors).toEqual([]);
  });

  it('keeps evidence and recommendations in attack order too', () => {
    const report = buildReport({
      options,
      attacks: [],
      findings: unsortedFindings(),
      conversationLog: [],
      overall: { score: 100, risk: 'critical' }
    });

    expect(report.extractedFragments).toEqual([
      'evidence for first',
      'evidence for second',
      'evidence for third'
    ]);
  });
});
