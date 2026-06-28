import type { ScanReport } from '../types.js';

export function toMarkdownReport(report: ScanReport): string {
  const findings = report.findings.map(f => `- ${f.attackName}: ${f.risk} (${f.leakStatus})`).join('\n') || '- No findings';

  return `# LLMShield Report\n\nRisk: ${report.overallRisk}\nScore: ${report.score}\nProvider: ${report.provider}\nModel: ${report.model}\n\n## Findings\n${findings}\n`;
}
