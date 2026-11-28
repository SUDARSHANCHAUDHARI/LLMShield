import { describe, expect, it } from 'vitest';
import { formatReport } from '../src/reports/format.js';
import { cell } from '../src/reports/markdown.js';
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

// Counts the pipes Markdown would read as column separators, skipping any that are escaped.
function unescapedPipes(row: string): number {
  let count = 0;

  for (let i = 0; i < row.length; i += 1) {
    if (row[i] === '\\') {
      i += 1;
      continue;
    }

    if (row[i] === '|') {
      count += 1;
    }
  }

  return count;
}

describe('markdown table cell escaping', () => {
  it('keeps a backslash before a pipe from adding a column', () => {
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
            attackName: 'Direct \\| request',
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

    const header = output.split('\n').find(line => line.startsWith('| Attack |'));
    const row = output.split('\n').find(line => line.startsWith('| Direct'));

    expect(header).toBeDefined();
    expect(row).toBeDefined();
    expect(unescapedPipes(row as string)).toBe(unescapedPipes(header as string));
  });

  it('escapes every pipe and collapses line breaks', () => {
    expect(unescapedPipes(cell('a\\|b'))).toBe(0);
    expect(unescapedPipes(cell('a|b'))).toBe(0);
    expect(unescapedPipes(cell('a\\\\|b'))).toBe(0);
    expect(cell('one\ntwo')).toBe('one two');
    expect(cell('one\r\ntwo')).toBe('one two');
  });
});
