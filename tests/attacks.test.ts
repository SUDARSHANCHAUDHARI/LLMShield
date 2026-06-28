import { describe, expect, it } from 'vitest';
import { getAttackRegistry } from '../src/attacks/registry.js';

describe('attack registry', () => {
  it('contains attack cases', () => {
    expect(getAttackRegistry().length).toBeGreaterThan(0);
  });
});
