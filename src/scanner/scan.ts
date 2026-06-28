import type { Finding, ScanOptions, ScanReport } from '../types.js';
import { getAttackRegistry } from '../attacks/registry.js';
import { evaluateLeakage } from '../evaluators/leakage.js';
import { scoreLeakStatus } from './score.js';
import { riskFromScore } from './score.js';
import { calculateOverallRisk } from '../evaluators/risk.js';
import { runProvider } from './runner.js';
import { buildReport } from '../reports/summary.js';

export async function runScan(options: ScanOptions): Promise<ScanReport> {
  const attacks = getAttackRegistry().filter(attack =>
    !options.includeCategories || options.includeCategories.includes(attack.category)
  );

  const findings: Finding[] = [];
  const conversationLog: ScanReport['conversationLog'] = [];

  for (const attack of attacks) {
    const result = await runProvider(options.provider, {
      systemPrompt: options.systemPrompt,
      userPrompt: attack.prompt,
      model: options.model
    });

    const leakage = evaluateLeakage(result.text, options.systemPrompt);
    const score = scoreLeakStatus(leakage.status);
    const risk = riskFromScore(score);

    if (score > 0) {
      findings.push({
        attackId: attack.id,
        attackName: attack.name,
        category: attack.category,
        risk,
        leakStatus: leakage.status,
        score,
        response: result.text,
        evidence: leakage.evidence,
        recommendation: 'Strengthen system prompt boundaries and explicitly refuse hidden instruction disclosure.'
      });
    }

    conversationLog.push({
      attackId: attack.id,
      prompt: attack.prompt,
      response: result.text
    });
  }

  const overall = calculateOverallRisk(findings);
  return buildReport({
    options,
    attacks,
    findings,
    conversationLog,
    overall
  });
}
