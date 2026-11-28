#!/usr/bin/env node
import { Command, CommanderError } from 'commander';
import { env } from './config/env.js';
import { runScan } from './scanner/scan.js';
import { getAttackRegistry } from './attacks/registry.js';
import { readTextFile, writeTextFile } from './utils/file.js';
import { formatReport } from './reports/format.js';
import { logger } from './utils/logger.js';
import { oneOf, optionalOneOf } from './utils/choice.js';
import {
  categoryNames,
  failOnLevels,
  parseCategoryList,
  providerNames,
  readScanConfig,
  reportFormats,
  type ScanConfigFile
} from './config/file.js';
import { meetsThreshold } from './scanner/score.js';

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
  .option(
    '--category <name...>',
    `Only run attacks in these categories, repeated or comma-separated: ${categoryNames.join(', ')}`
  )
  .option('--config <path>', 'Read provider, model, categories and report settings from a JSON file')
  .option(
    '--judge-model <model>',
    'Opt in to a model-judged paraphrase check. Off by default: it is not deterministic, it costs tokens, and the judge model is sent your system prompt'
  )
  .action(async (options, command) => {
    const config: ScanConfigFile = options.config ? await readScanConfig(options.config) : {};

    // Precedence: an explicit flag beats the config file, which beats the env default.
    // getOptionValueSource tells a flag the user typed apart from one commander filled in, which
    // is the only way to know whether a default should give way to the config file.
    const fromCli = (name: string): boolean => command.getOptionValueSource(name) === 'cli';
    const settle = <T>(name: string, flagValue: T, configValue: T | undefined): T =>
      fromCli(name) || configValue === undefined ? flagValue : configValue;

    const provider = oneOf('--provider', settle('provider', options.provider, config.provider), providerNames);
    const reportFormat = oneOf('--format', settle('format', options.format, config.format), reportFormats);
    const failOn = optionalOneOf('--fail-on', settle('failOn', options.failOn, config.failOn), failOnLevels);
    const model = settle('model', options.model, config.model);
    const output = settle('output', options.output, config.output);
    const canary = settle('canary', options.canary, config.canary);
    const judgeModel = settle('judgeModel', options.judgeModel, config.judgeModel);

    const categories = options.category
      ? parseCategoryList('--category', options.category as unknown[])
      : config.categories;

    const systemPrompt = options.file ? await readTextFile(options.file) : options.prompt;

    if (!systemPrompt) {
      throw new Error('Provide either --file or --prompt');
    }

    const report = await runScan({
      systemPrompt,
      provider,
      // Mock providers ignore the model; report the provider name instead of a misleading default.
      model: provider.startsWith('mock') ? provider : model,
      output,
      includeCategories: categories,
      canary,
      judgeModel
    });

    const rendered = formatReport(report, reportFormat);

    if (output) {
      await writeTextFile(output, rendered);
      logger.info(`Report written to ${output}`);
    }

    logger.info(`Risk: ${report.overallRisk}`);
    logger.info(`Score: ${report.score}`);
    logger.info(`Attacks: ${report.totalAttacks}`);
    logger.info(`Findings: ${report.successfulAttacks}`);

    if (report.errors.length > 0) {
      logger.error(`Errors: ${report.errors.length} of ${report.totalAttacks} attacks did not complete`);

      for (const error of report.errors) {
        logger.error(`  ${error.attackId}: ${error.message}`);
      }
    }

    // Every attack failing is not a verdict, so it is a configuration error (2) rather than a
    // clean pass (0) or a risk finding (1). A partial scan still produces a verdict and is
    // judged on what it found.
    if (report.totalAttacks > 0 && report.errors.length === report.totalAttacks) {
      logger.error('No attack completed, so the scan produced no verdict.');
      process.exitCode = 2;
      return;
    }

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
    logger.info('mock         always refuses, no key needed (expect: secure)');
    logger.info('mock-leaky   deliberately weak model for demos, no key needed (expect: critical)');
    logger.info('openrouter   OPENROUTER_API_KEY, any model OpenRouter routes');
    logger.info('openai       OPENAI_API_KEY, Chat Completions');
    logger.info('anthropic    ANTHROPIC_API_KEY, Messages API');
  });

// Exit codes are the CLI's contract:
//   0  the scan ran and stayed below --fail-on
//   1  the scan ran and the risk was at or above --fail-on
//   2  the scan did not produce a verdict: bad flag, unreadable prompt file, provider failure
// 1 and 2 have to differ, or a CI job cannot tell a prompt that failed its gate from a
// pipeline that never reached the model.
//
// commander exits 1 by itself on an unknown option or a missing argument, which would land in
// the --fail-on code. exitOverride makes it throw instead, so those errors reach the catch
// below and come out as 2 like every other error. It does not reach subcommands on its own,
// so each one is set explicitly — measured: without this, `scan --bogus-flag` still exits 1.
for (const command of [program, ...program.commands]) {
  command.exitOverride();
}

program.parseAsync(process.argv).catch(error => {
  if (error instanceof CommanderError) {
    // --help and --version are not failures, and commander has already written its output.
    process.exit(error.exitCode === 0 ? 0 : 2);
  }

  logger.error(error instanceof Error ? error.message : String(error));
  process.exit(2);
});
