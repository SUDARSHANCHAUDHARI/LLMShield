import { spawn } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { getAttackRegistry } from '../src/attacks/registry.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tsx = path.join(repoRoot, 'node_modules', '.bin', 'tsx');
const entry = path.join(repoRoot, 'src', 'cli.ts');

const registry = getAttackRegistry();
const countIn = (...categories: string[]): number =>
  registry.filter(attack => categories.includes(attack.category)).length;

function run(args: string[]): Promise<{ code: number | null; output: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(tsx, [entry, ...args], {
      cwd: repoRoot,
      env: { ...process.env, OPENROUTER_API_KEY: '' }
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

/** Reads the `Attacks: n` line the CLI prints, so the assertion is on real output. */
function attacksRun(output: string): number {
  const match = output.match(/^Attacks: (\d+)$/m);

  if (!match) throw new Error(`no "Attacks:" line in output:\n${output}`);

  return Number(match[1]);
}

let dir = '';

async function configFile(name: string, body: unknown): Promise<string> {
  const file = path.join(dir, name);
  await writeFile(file, JSON.stringify(body), 'utf8');
  return file;
}

// Fixtures go in a fresh OS temp directory rather than the repo, so a failed run cannot leave
// stray config files behind in the working tree. They are a few hundred bytes of JSON and the
// OS reclaims the directory, so there is no teardown.
beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'llmshield-config-'));
});

describe('--category', () => {
  it('runs only the named category', async () => {
    const { output } = await run(['scan', '-p', 'secret 7781', '--provider', 'mock-leaky', '--category', 'encoding']);

    expect(attacksRun(output)).toBe(countIn('encoding'));
    expect(attacksRun(output)).toBeLessThan(registry.length);
  }, 30_000);

  it('accepts the flag twice', async () => {
    const { output } = await run([
      'scan',
      '-p',
      'secret 7781',
      '--provider',
      'mock-leaky',
      '--category',
      'encoding',
      '--category',
      'jailbreak'
    ]);

    expect(attacksRun(output)).toBe(countIn('encoding', 'jailbreak'));
  }, 30_000);

  it('accepts a comma-separated value', async () => {
    const { output } = await run([
      'scan',
      '-p',
      'secret 7781',
      '--provider',
      'mock-leaky',
      '--category',
      'encoding,jailbreak'
    ]);

    expect(attacksRun(output)).toBe(countIn('encoding', 'jailbreak'));
  }, 30_000);

  it('exits 2 on an unknown category', async () => {
    const { code, output } = await run(['scan', '-p', 'x', '--provider', 'mock', '--category', 'nonsense']);

    expect(code).toBe(2);
    expect(output).toContain('Invalid --category "nonsense"');
  }, 30_000);
});

describe('--config', () => {
  it('applies provider and categories from the file', async () => {
    const file = await configFile('narrow.json', {
      provider: 'mock-leaky',
      categories: ['encoding', 'multi-turn'],
      failOn: 'high'
    });

    const { code, output } = await run(['scan', '-p', 'secret 7781', '--config', file]);

    expect(attacksRun(output)).toBe(countIn('encoding', 'multi-turn'));
    expect(output).toContain('Risk: critical');
    // failOn came from the file, so the file alone can fail a build.
    expect(code).toBe(1);
  }, 30_000);

  it('lets an explicit flag beat the file', async () => {
    const file = await configFile('safe.json', { provider: 'mock', categories: ['encoding'] });

    const { output } = await run(['scan', '-p', 'secret 7781', '--config', file, '--provider', 'mock-leaky']);

    expect(output).toContain('Risk: critical');
  }, 30_000);

  it('lets an explicit --category beat the file', async () => {
    const file = await configFile('cats.json', { provider: 'mock-leaky', categories: ['encoding'] });

    const { output } = await run(['scan', '-p', 'secret 7781', '--config', file, '--category', 'jailbreak']);

    expect(attacksRun(output)).toBe(countIn('jailbreak'));
  }, 30_000);

  it('exits 2 on an unknown key rather than ignoring it', async () => {
    const file = await configFile('typo.json', { categorys: ['encoding'] });

    const { code, output } = await run(['scan', '-p', 'x', '--provider', 'mock', '--config', file]);

    expect(code).toBe(2);
    expect(output).toContain('unknown key "categorys"');
  }, 30_000);

  it('exits 2 when the file is missing', async () => {
    const { code, output } = await run([
      'scan',
      '-p',
      'x',
      '--provider',
      'mock',
      '--config',
      path.join(dir, 'does-not-exist.json')
    ]);

    expect(code).toBe(2);
    expect(output).toContain('Could not read config file');
  }, 30_000);

  it('exits 2 when the file is not valid JSON', async () => {
    const file = path.join(dir, 'broken.json');
    await writeFile(file, '{ not json', 'utf8');

    const { code, output } = await run(['scan', '-p', 'x', '--provider', 'mock', '--config', file]);

    expect(code).toBe(2);
    expect(output).toContain('is not valid JSON');
  }, 30_000);

  it('runs the shipped example config without error', async () => {
    const { output } = await run([
      'scan',
      '-p',
      'secret 7781',
      '--config',
      path.join(repoRoot, 'examples', 'scan-config.json'),
      '--provider',
      'mock',
      '--output',
      path.join(dir, 'example-report.md')
    ]);

    expect(output).toContain('Risk: secure');
  }, 30_000);
});
