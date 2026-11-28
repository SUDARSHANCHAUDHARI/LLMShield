import { describe, expect, it } from 'vitest';
import { oneOf, optionalOneOf } from '../src/utils/choice.js';

const failOnLevels = ['low', 'medium', 'high', 'critical'] as const;

describe('oneOf', () => {
  it('returns an accepted value unchanged', () => {
    expect(oneOf('--fail-on', 'high', failOnLevels)).toBe('high');
  });

  it('rejects a value outside the set with one readable line', () => {
    expect(() => oneOf('--fail-on', 'banana', failOnLevels)).toThrow(
      'Invalid --fail-on "banana". Use one of: low, medium, high, critical'
    );
  });

  it('names the flag it was given', () => {
    expect(() => oneOf('--format', 'yaml', ['json', 'markdown'] as const)).toThrow(
      'Invalid --format "yaml". Use one of: json, markdown'
    );
  });

  it('rejects a missing value rather than returning undefined', () => {
    expect(() => oneOf('--fail-on', undefined, failOnLevels)).toThrow(/^Invalid --fail-on /);
  });

  it('is case sensitive, so a near miss is still rejected', () => {
    expect(() => oneOf('--fail-on', 'HIGH', failOnLevels)).toThrow(/Invalid --fail-on "HIGH"/);
  });

  it('does not accept a value that is only a prefix or a substring', () => {
    expect(() => oneOf('--fail-on', 'hig', failOnLevels)).toThrow(/Invalid --fail-on/);
    expect(() => oneOf('--fail-on', 'very high', failOnLevels)).toThrow(/Invalid --fail-on/);
  });

  it('keeps the message readable for a non-string value', () => {
    expect(() => oneOf('--fail-on', true, failOnLevels)).toThrow(
      'Invalid --fail-on "true". Use one of: low, medium, high, critical'
    );
    expect(() => oneOf('--fail-on', {}, failOnLevels)).toThrow(/Invalid --fail-on "\[object/);
  });
});

describe('optionalOneOf', () => {
  it('treats an unset flag as undefined', () => {
    expect(optionalOneOf('--fail-on', undefined, failOnLevels)).toBeUndefined();
    expect(optionalOneOf('--fail-on', null, failOnLevels)).toBeUndefined();
  });

  it('still rejects a value outside the set', () => {
    expect(() => optionalOneOf('--fail-on', 'banana', failOnLevels)).toThrow(
      'Invalid --fail-on "banana". Use one of: low, medium, high, critical'
    );
  });

  it('returns an accepted value unchanged', () => {
    expect(optionalOneOf('--fail-on', 'critical', failOnLevels)).toBe('critical');
  });
});
