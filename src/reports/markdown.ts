import type { Finding, ScanReport } from '../types.js';

const MAX_EVIDENCE_CHARS = 160;
const MAX_RESPONSE_CHARS = 400;

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function cell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
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

export function toMarkdownReport(report: ScanReport): string {
  const summary = [
    `- Risk: ${report.overallRisk}`,
    `- Score: ${report.score}`,
    `- Leak status: ${report.leakStatus}`,
    `- Findings: ${report.successfulAttacks} of ${report.totalAttacks} attacks`,
    `- Provider: ${report.provider}`,
    `- Model: ${report.model}`,
    `- Canary: ${report.canary ?? 'off'}`,
    `- Generated: ${report.generatedAt}`
  ].join('\n');

  if (report.findings.length === 0) {
    return `# LLMShield Report\n\n${summary}\n\n## Findings\n\nNo findings.\n`;
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
    '## Recommendations',
    '',
    recommendations,
    ''
  ].join('\n');
}
