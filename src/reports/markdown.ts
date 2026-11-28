import type { Finding, ScanReport } from '../types.js';

const MAX_EVIDENCE_CHARS = 160;
const MAX_RESPONSE_CHARS = 400;

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

// Escape the backslash first. Otherwise a backslash already in the text pairs with the
// backslash this function puts in front of a pipe, which leaves the pipe unescaped and
// shifts every later column of the table.
export function cell(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');
}

function findingSection(finding: Finding): string {
  const evidence = finding.evidence.length
    ? finding.evidence.map(item => `- ${truncate(item, MAX_EVIDENCE_CHARS)}`).join('\n')
    : '- (none)';

  return [
    `### ${finding.attackName} (\`${finding.attackId}\`): ${finding.risk}`,
    '',
    `- Category: ${finding.category}`,
    `- Leak status: ${finding.leakStatus}`,
    `- Injected instruction followed: ${finding.injectionFollowed ? 'yes' : 'no'}`,
    `- Recommendation: ${finding.recommendation}`,
    '',
    'Evidence:',
    '',
    evidence,
    '',
    'Response:',
    '',
    '````text',
    truncate(finding.response, MAX_RESPONSE_CHARS),
    '````'
  ].join('\n');
}

// An errored attack was neither held nor got through, so the report has to name it. Leaving it
// out would make `0 of 7 findings` read as a pass on attacks that were never actually judged.
function errorSection(report: ScanReport): string[] {
  if (report.errors.length === 0) {
    return [];
  }

  return [
    '## Errors',
    '',
    `${report.errors.length} of ${report.totalAttacks} attacks did not complete, so they were neither held nor judged.`,
    '',
    '| Attack | Error |',
    '|---|---|',
    ...report.errors.map(error => `| ${cell(error.attackId)} | ${cell(error.message)} |`),
    ''
  ];
}

export function toMarkdownReport(report: ScanReport): string {
  const summary = [
    `- Risk: ${report.overallRisk}`,
    `- Score: ${report.score}`,
    `- Leak status: ${report.leakStatus}`,
    `- Findings: ${report.successfulAttacks} of ${report.totalAttacks} attacks`,
    ...(report.errors.length > 0 ? [`- Errors: ${report.errors.length} of ${report.totalAttacks} attacks did not complete`] : []),
    `- Provider: ${report.provider}`,
    `- Model: ${report.model}`,
    `- Canary: ${report.canary ?? 'off'}`,
    `- Generated: ${report.generatedAt}`
  ].join('\n');

  if (report.findings.length === 0) {
    return [
      '# LLMShield Report',
      '',
      summary,
      '',
      '## Findings',
      '',
      'No findings.',
      '',
      ...errorSection(report)
    ].join('\n');
  }

  const table = [
    '| Attack | Category | Risk | Leak status | Injection followed |',
    '|---|---|---|---|---|',
    ...report.findings.map(f =>
      `| ${cell(f.attackName)} | ${f.category} | ${f.risk} | ${f.leakStatus} | ${f.injectionFollowed ? 'yes' : 'no'} |`
    )
  ].join('\n');

  const recommendations = report.recommendations.map(item => `- ${item}`).join('\n');

  return [
    '# LLMShield Report',
    '',
    summary,
    '',
    '## Findings',
    '',
    table,
    '',
    ...report.findings.map(findingSection).flatMap(section => [section, '']),
    ...errorSection(report),
    '## Recommendations',
    '',
    recommendations,
    ''
  ].join('\n');
}
