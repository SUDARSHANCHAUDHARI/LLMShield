import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tsx = path.join(repoRoot, 'node_modules', '.bin', 'tsx');
const entry = path.join(repoRoot, 'src', 'cli.ts');

/**
 * Runs the CLI with every provider key blanked, whatever the developer has in their own
 * environment or .env file. dotenv does not overwrite a variable that is already set, so
 * setting these to '' here is what makes the test independent of the machine it runs on.
 */
function runWithoutKeys(args: string[]): Promise<{ code: number | null; output: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(tsx, [entry, ...args], {
      cwd: repoRoot,
      env: {
        ...process.env,
        OPENROUTER_API_KEY: '',
        OPENAI_API_KEY: '',
        ANTHROPIC_API_KEY: ''
      }
    });

    let output = '';

    child.stdout.on('data', chunk => {
      output += chunk;
    });
    child.stderr.on('data', chunk => {
      output += chunk;
    });

    child.on('error', reject);
    child.on('close', code => resolve({ code, output }));
  });
}

describe('a missing provider key', () => {
  // The defect this replaces: the key was checked per attack, so the scan ran all 27, printed
  // "Risk: secure" from a report where nothing had been sent to a model, and then listed the
  // same error 27 times. The headline mattered most — a security tool must not say secure
  // about a scan that never happened.
  it.each([
    ['openrouter', 'OPENROUTER_API_KEY'],
    ['openai', 'OPENAI_API_KEY'],
    ['anthropic', 'ANTHROPIC_API_KEY']
  ])('stops %s before the scan and names %s', async (provider, variable) => {
    const { code, output } = await runWithoutKeys(['scan', '-p', 'Be helpful.', '--provider', provider]);

    expect(code).toBe(2);
    expect(output).toContain(variable);

    // Never a verdict. This is the assertion that fails against the old behaviour.
    expect(output).not.toContain('Risk:');
    expect(output).not.toContain('Attacks:');

    // Said once, not once per attack.
    expect(output.split(variable).length - 1).toBe(1);
  }, 30_000);

  it('tells the reader how to fix it', async () => {
    const { output } = await runWithoutKeys(['scan', '-p', 'Be helpful.', '--provider', 'openrouter']);

    expect(output).toContain('.env');
    expect(output).toContain('--provider mock-leaky');
  }, 30_000);

  it('still scans with the mock providers, which need no key', async () => {
    const safe = await runWithoutKeys(['scan', '-p', 'Be helpful.', '--provider', 'mock']);
    const leaky = await runWithoutKeys(['scan', '-p', 'Be helpful.', '--provider', 'mock-leaky']);

    expect(safe.code).toBe(0);
    expect(safe.output).toContain('Risk: secure');
    expect(leaky.code).toBe(0);
    expect(leaky.output).toContain('Risk: critical');
  }, 30_000);
});
