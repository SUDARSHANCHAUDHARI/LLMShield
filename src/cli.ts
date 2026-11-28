#!/usr/bin/env node
import { Command } from 'commander';
import { env } from './config/env.js';
import { runScan } from './scanner/scan.js';
import { getAttackRegistry } from './attacks/registry.js';
import { readTextFile, writeTextFile } from './utils/file.js';
import { formatReport, type ReportFormat } from './reports/format.js';
import { logger } from './utils/logger.js';
import { oneOf, optionalOneOf } from './utils/choice.js';
import { meetsThreshold } from './scanner/score.js';
import type { ProviderName, RiskLevel } from './types.js';

const providerNames = [
  'mock',
  'mock-leaky',
  'openrouter',
  'openai',
  'anthropic'
] as const satisfies readonly ProviderName[];

const reportFormats = ['json', 'markdown'] as const satisfies readonly ReportFormat[];

const failOnLevels = [
  'low',
  'medium',
  'high',
  'critical'
] as const satisfies readonly Exclude<RiskLevel, 'secure'>[];

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
  .option('--provider <provider>', 'Provider: mock, mock-leaky, openrouter, openai, anthropic', env.defaultProvider)
  .option('-m, --model <model>', 'Model name', env.defaultModel)
  .option('--format <format>', 'Report format: json, markdown', 'json')
  .option('-o, --output <path>', 'Write report to file')
  .option('--no-canary', 'Do not append a canary token to the system prompt')
  .option('--fail-on <risk>', 'Exit with code 1 if overall risk is at or above: low, medium, high, critical')
  .action(async options => {
    const provider = oneOf('--provider', options.provider, providerNames);
    const reportFormat = oneOf('--format', options.format, reportFormats);
    const failOn = optionalOneOf('--fail-on', options.failOn, failOnLevels);
    const systemPrompt = options.file ? await readTextFile(options.file) : options.prompt;

    if (!systemPrompt) {
      throw new Error('Provide either --file or --prompt');
    }

    const report = await runScan({
      systemPrompt,
      provider,
      // Mock providers ignore the model; report the provider name instead of a misleading default.
      model: provider.startsWith('mock') ? provider : options.model,
      output: options.output,
      canary: options.canary
    });

    const output = formatReport(report, reportFormat);

    if (options.output) {
      await writeTextFile(options.output, output);
      logger.info(`Report written to ${options.output}`);
    }

    logger.info(`Risk: ${report.overallRisk}`);
    logger.info(`Score: ${report.score}`);
    logger.info(`Attacks: ${report.totalAttacks}`);
    logger.info(`Findings: ${report.successfulAttacks}`);

    if (failOn && meetsThreshold(report.overallRisk, failOn)) {
      logger.error(`Failing: risk ${report.overallRisk} is at or above --fail-on ${failOn}`);
      process.exitCode = 1;
    }
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
    logger.info('mock         always refuses (expect: secure)');
    logger.info('mock-leaky   deliberately weak model for demos (expect: critical)');
    logger.info('openrouter');
    logger.info('openai planned');
    logger.info('anthropic planned');
  });

program.parseAsync(process.argv).catch(error => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
