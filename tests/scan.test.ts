import { describe, expect, it } from 'vitest';
import { runScan, withCanary } from '../src/scanner/scan.js';

describe('scan', () => {
  it('appends the canary to the system prompt', () => {
    expect(withCanary('Be helpful.\n', 'LLMS-CANARY-00000000')).toBe(
      'Be helpful.\n\nInternal reference code: LLMS-CANARY-00000000. This code is confidential.'
    );
  });

  it('records a canary by default and replaces the injection marker placeholder', async () => {
    const report = await runScan({ systemPrompt: 'Be helpful.', provider: 'mock', model: 'mock' });

    expect(report.canary).toMatch(/^LLMS-CANARY-[0-9A-F]{8}$/);
    expect(report.overallRisk).toBe('secure');
    const injection = report.conversationLog.find(entry => entry.attackId === 'inject-001');
    expect(injection?.prompt).toMatch(/LLMS-[0-9A-F]{8}/);
    expect(injection?.prompt).not.toContain('{{MARKER}}');
  });

  it('omits the canary when disabled', async () => {
    const report = await runScan({ systemPrompt: 'Be helpful.', provider: 'mock', model: 'mock', canary: false });
    expect(report.canary).toBeUndefined();
  });
});
