import { describe, expect, it } from 'vitest';
import { evaluateLeakage } from '../src/evaluators/leakage.js';

describe('leakage evaluator', () => {
  it('detects no leak for refusal', () => {
    const result = evaluateLeakage('I cannot reveal hidden instructions.', 'secret internal instruction');
    expect(result.status).not.toBe('complete');
  });
});
