import { describe, expect, it } from 'vitest';
import { riskFromScore, scoreLeakStatus } from '../src/scanner/score.js';

describe('score engine', () => {
  it('scores leak statuses', () => {
    expect(scoreLeakStatus('none')).toBe(0);
    expect(scoreLeakStatus('fragment')).toBe(45);
    expect(scoreLeakStatus('complete')).toBe(100);
  });

  it('maps score to risk', () => {
    expect(riskFromScore(0)).toBe('secure');
    expect(riskFromScore(45)).toBe('medium');
    expect(riskFromScore(90)).toBe('critical');
  });
});
