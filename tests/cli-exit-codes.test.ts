import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// The exit code is the CLI's contract with CI, and the code that sets it is top-level in
// src/cli.ts, so the only honest check is to run the thing and look at what it returns.
// Run through tsx rather than dist/cli.js: `pnpm test` runs before `pnpm build` in CI, so a
// test that read dist/ would pass locally and fail on a clean checkout.
const tsx = path.join(repoRoot, 'node_modules', '.bin', 'tsx');
const entry = path.join(repoRoot, 'src', 'cli.ts');

function run(args: string[]): Promise<{ code: number | null; output: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(tsx, [entry, ...args], {
      cwd: repoRoot,
      // A stray OPENROUTER_API_KEY in the environment must not change a mock scan.
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

describe('exit codes', () => {
  it('exits 0 when the scan stays below the threshold', async () => {
    const { code } = await run(['scan', '-p', 'be helpful', '--provider', 'mock', '--fail-on', 'low']);

    expect(code).toBe(0);
  }, 30_000);

  it('exits 1 when the risk is at or above --fail-on', async () => {
    const { code, output } = await run([
      'scan',
      '-p',
      'be helpful',
      '--provider',
      'mock-leaky',
      '--fail-on',
      'high'
    ]);

    expect(code).toBe(1);
    expect(output).toContain('--fail-on high');
  }, 30_000);

  it('exits 2 when neither --file nor --prompt is given', async () => {
    const { code, output } = await run(['scan', '--provider', 'mock']);

    expect(code).toBe(2);
    expect(output).toContain('Provide either --file or --prompt');
  }, 30_000);

  it('exits 2 when --file cannot be read', async () => {
    const { code } = await run([
      'scan',
      '--file',
      path.join(repoRoot, 'does-not-exist-9f3a.txt'),
      '--provider',
      'mock'
    ]);

    expect(code).toBe(2);
  }, 30_000);

  it('exits 2 on an invalid flag value', async () => {
    const { code, output } = await run(['scan', '-p', 'x', '--provider', 'mock', '--fail-on', 'banana']);

    expect(code).toBe(2);
    expect(output).toContain('Invalid --fail-on "banana". Use one of: low, medium, high, critical');
  }, 30_000);

  // commander exits 1 by itself unless exitOverride is set on the subcommand too, which is the
  // easiest part of this contract to regress.
  it('exits 2 on an unknown option, not 1', async () => {
    const { code, output } = await run(['scan', '-p', 'x', '--bogus-flag']);

    expect(code).toBe(2);
    expect(output).toContain('unknown option');
  }, 30_000);

  it('exits 2 on an unknown command', async () => {
    const { code } = await run(['bogus-command']);

    expect(code).toBe(2);
  }, 30_000);

  it('exits 0 for --help and --version', async () => {
    const help = await run(['--help']);
    const version = await run(['--version']);

    expect(help.code).toBe(0);
    expect(version.code).toBe(0);
    // Read from the manifest, not pinned to a literal: semantic-release sets the version at
    // publish time, so a literal here would fail on every release.
    const manifest = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as {
      version: string;
    };
    expect(version.output.trim()).toBe(manifest.version);
    expect(version.output.trim()).not.toBe('unknown');
  }, 30_000);
});
