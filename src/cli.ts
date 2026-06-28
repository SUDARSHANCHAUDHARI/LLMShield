#!/usr/bin/env node
import { Command } from 'commander';
import { z } from 'zod';
import { env } from './config/env.js';
import { runScan } from './scanner/scan.js';
import { getAttackRegistry } from './attacks/registry.js';
import { readTextFile, writeTextFile } from './utils/file.js';
import { toJsonReport } from './reports/json.js';
import { logger } from './utils/logger.js';
import type { ProviderName } from './types.js';

const providerSchema = z.enum(['mock', 'openrouter', 'openai', 'anthropic']);

const program = new Command();

program
  .name('llmshield')
  .description('LLM prompt security scanner')
  .version('0.1.0');

program
  .command('scan')
  .description('Scan a system prompt for prompt leak and injection risks')
  .option('-f, --file <path>', 'Path to system prompt file')
  .option('-p, --prompt <prompt>', 'System prompt text')
  .option('--provider <provider>', 'Provider: mock, openrouter, openai, anthropic', env.defaultProvider)
  .option('-m, --model <model>', 'Model name', env.defaultModel)
  .option('-o, --output <path>', 'Write JSON report to file')
  .action(async options => {
    const provider = providerSchema.parse(options.provider) as ProviderName;
    const systemPrompt = options.file ? await readTextFile(options.file) : options.prompt;

    if (!systemPrompt) {
      throw new Error('Provide either --file or --prompt');
    }

    const report = await runScan({
      systemPrompt,
      provider,
      model: options.model,
      output: options.output
    });

    const json = toJsonReport(report);

    if (options.output) {
      await writeTextFile(options.output, json);
      logger.info(`Report written to ${options.output}`);
    }

    logger.info(`Risk: ${report.overallRisk}`);
    logger.info(`Score: ${report.score}`);
    logger.info(`Attacks: ${report.totalAttacks}`);
    logger.info(`Findings: ${report.successfulAttacks}`);
  });

program
  .command('attacks')
  .description('List available attack cases')
  .action(() => {
    for (const attack of getAttackRegistry()) {
      logger.info(`${attack.id} | ${attack.category} | ${attack.name}`);
    }
  });

program
  .command('providers')
  .description('List supported providers')
  .action(() => {
    logger.info('mock');
    logger.info('openrouter');
    logger.info('openai planned');
    logger.info('anthropic planned');
  });

program.parseAsync(process.argv).catch(error => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
