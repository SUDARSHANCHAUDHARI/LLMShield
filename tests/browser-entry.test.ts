import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const srcDir = resolve(dirname(fileURLToPath(import.meta.url)), '../src');

// Runtime (non type-only) import/export specifiers in a module.
const RUNTIME_IMPORT = /^\s*(?:import|export)\s+(?!type\b)[^'"]*?from\s+['"]([^'"]+)['"]/gm;
const NODE_ONLY = [/\bprocess\.env\b/, /\bBuffer\./, /\brequire\(/];

function walk(file: string, seen: Set<string>): void {
  if (seen.has(file)) return;
  seen.add(file);
  const source = readFileSync(file, 'utf8');

  for (const match of source.matchAll(RUNTIME_IMPORT)) {
    const specifier = match[1];
    if (!specifier.startsWith('.')) {
      throw new Error(`${file} imports package "${specifier}", which is not available in the browser`);
    }
    walk(resolve(dirname(file), specifier.replace(/\.js$/, '.ts')), seen);
  }

  for (const pattern of NODE_ONLY) {
    if (pattern.test(source)) throw new Error(`${file} uses Node-only API ${pattern.source}`);
  }
}

describe('browser entry', () => {
  it('only reaches browser-safe modules', () => {
    const seen = new Set<string>();
    expect(() => walk(resolve(srcDir, 'browser.ts'), seen)).not.toThrow();
    expect([...seen].some(file => file.endsWith('config/env.ts'))).toBe(false);
  });
});
