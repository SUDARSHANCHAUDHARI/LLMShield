import { describe, expect, it } from 'vitest';
import { parseCategoryList, parseScanConfig } from '../src/config/file.js';

const path = '/tmp/llmshield.json';

describe('parseScanConfig', () => {
  it('accepts an empty object', () => {
    expect(parseScanConfig({}, path)).toEqual({});
  });

  it('reads every accepted key', () => {
    expect(
      parseScanConfig(
        {
          provider: 'mock-leaky',
          model: 'openai/gpt-4o-mini',
          categories: ['encoding', 'jailbreak'],
          failOn: 'high',
          format: 'markdown',
          output: 'reports/out.md',
          canary: false
        },
        path
      )
    ).toEqual({
      provider: 'mock-leaky',
      model: 'openai/gpt-4o-mini',
      categories: ['encoding', 'jailbreak'],
      failOn: 'high',
      format: 'markdown',
      output: 'reports/out.md',
      canary: false
    });
  });

  // The point of the whole validation pass: a typo'd key must be an error, not a no-op.
  it('rejects an unknown key and names the accepted ones', () => {
    expect(() => parseScanConfig({ categorys: ['encoding'] }, path)).toThrow(
      /unknown key "categorys"\. Accepted keys: provider, model, categories, failOn, format, output, canary/
    );
  });

  it('lists several unknown keys together', () => {
    expect(() => parseScanConfig({ nope: 1, alsoNope: 2 }, path)).toThrow(/unknown keys "nope", "alsoNope"/);
  });

  it('rejects a non-object document', () => {
    expect(() => parseScanConfig([1, 2], path)).toThrow(/must contain a JSON object/);
    expect(() => parseScanConfig('mock', path)).toThrow(/must contain a JSON object/);
    expect(() => parseScanConfig(null, path)).toThrow(/must contain a JSON object/);
  });

  it('rejects an unknown provider, format or fail-on level and names the file', () => {
    expect(() => parseScanConfig({ provider: 'banana' }, path)).toThrow(
      `Invalid provider in config file ${path} "banana". Use one of: mock, mock-leaky, openrouter, openai, anthropic`
    );
    expect(() => parseScanConfig({ format: 'yaml' }, path)).toThrow(/Invalid format in config file/);
    expect(() => parseScanConfig({ failOn: 'secure' }, path)).toThrow(/Invalid failOn in config file/);
  });

  it('rejects a non-string model or output', () => {
    expect(() => parseScanConfig({ model: 7 }, path)).toThrow(/model must be a non-empty string/);
    expect(() => parseScanConfig({ model: '   ' }, path)).toThrow(/model must be a non-empty string/);
    expect(() => parseScanConfig({ output: '' }, path)).toThrow(/output must be a non-empty string/);
  });

  it('rejects a non-boolean canary', () => {
    expect(() => parseScanConfig({ canary: 'yes' }, path)).toThrow(/canary must be true or false/);
  });

  it('accepts canary set to true as well as false', () => {
    expect(parseScanConfig({ canary: true }, path)).toEqual({ canary: true });
    expect(parseScanConfig({ canary: false }, path)).toEqual({ canary: false });
  });

  it('rejects categories that are not an array', () => {
    expect(() => parseScanConfig({ categories: 'encoding' }, path)).toThrow(/categories must be an array/);
  });

  // Silently scanning nothing would report `secure` for a prompt nobody attacked.
  it('rejects an empty categories array', () => {
    expect(() => parseScanConfig({ categories: [] }, path)).toThrow(/categories is empty, which would scan nothing/);
  });

  it('rejects an unknown category name', () => {
    expect(() => parseScanConfig({ categories: ['encoding', 'nonsense'] }, path)).toThrow(
      /Invalid categories in config file .* "nonsense"/
    );
  });
});

describe('parseCategoryList', () => {
  it('accepts a repeated flag', () => {
    expect(parseCategoryList('--category', ['encoding', 'jailbreak'])).toEqual(['encoding', 'jailbreak']);
  });

  it('accepts a comma-separated value', () => {
    expect(parseCategoryList('--category', ['encoding,jailbreak'])).toEqual(['encoding', 'jailbreak']);
  });

  it('accepts the two styles mixed, with spaces', () => {
    expect(parseCategoryList('--category', ['encoding, jailbreak', 'roleplay'])).toEqual([
      'encoding',
      'jailbreak',
      'roleplay'
    ]);
  });

  it('removes duplicates while keeping the first position', () => {
    expect(parseCategoryList('--category', ['encoding', 'jailbreak', 'encoding'])).toEqual([
      'encoding',
      'jailbreak'
    ]);
  });

  it('rejects an unknown name', () => {
    expect(() => parseCategoryList('--category', ['nonsense'])).toThrow(
      'Invalid --category "nonsense". Use one of: direct-extraction, prompt-injection, jailbreak, roleplay, encoding, multi-turn'
    );
  });

  it('rejects a list that is empty once separators are stripped', () => {
    expect(() => parseCategoryList('--category', [','])).toThrow(/was given no category/);
    expect(() => parseCategoryList('--category', ['  '])).toThrow(/was given no category/);
  });
});
