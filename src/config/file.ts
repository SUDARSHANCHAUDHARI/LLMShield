import type { AttackCategory, ProviderName, RiskLevel } from '../types.js';
import type { ReportFormat } from '../reports/format.js';
import { readTextFile } from '../utils/file.js';
import { oneOf } from '../utils/choice.js';

export const providerNames = [
  'mock',
  'mock-leaky',
  'openrouter',
  'openai',
  'anthropic'
] as const satisfies readonly ProviderName[];

export const reportFormats = ['json', 'markdown'] as const satisfies readonly ReportFormat[];

export const failOnLevels = [
  'low',
  'medium',
  'high',
  'critical'
] as const satisfies readonly Exclude<RiskLevel, 'secure'>[];

export const categoryNames = [
  'direct-extraction',
  'prompt-injection',
  'jailbreak',
  'roleplay',
  'encoding',
  'multi-turn',
  'rag'
] as const satisfies readonly AttackCategory[];

/** Everything a config file may set. Each key mirrors the flag of the same name. */
export interface ScanConfigFile {
  provider?: ProviderName;
  model?: string;
  categories?: AttackCategory[];
  failOn?: Exclude<RiskLevel, 'secure'>;
  format?: ReportFormat;
  output?: string;
  canary?: boolean;
}

const KNOWN_KEYS = ['provider', 'model', 'categories', 'failOn', 'format', 'output', 'canary'] as const;

/**
 * Turns the parsed JSON of a config file into a ScanConfigFile, or throws.
 *
 * Unknown keys are rejected rather than ignored. A config file whose typo'd key does nothing is
 * the problem this is meant to solve, so "categorys" has to be an error, not a silent no-op.
 */
export function parseScanConfig(raw: unknown, path: string): ScanConfigFile {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error(`Config file ${path} must contain a JSON object.`);
  }

  const entries = raw as Record<string, unknown>;
  const unknown = Object.keys(entries).filter(key => !(KNOWN_KEYS as readonly string[]).includes(key));

  if (unknown.length > 0) {
    throw new Error(
      `Config file ${path} has unknown ${unknown.length === 1 ? 'key' : 'keys'} ${unknown
        .map(key => JSON.stringify(key))
        .join(', ')}. Accepted keys: ${KNOWN_KEYS.join(', ')}`
    );
  }

  const config: ScanConfigFile = {};

  if (entries.provider !== undefined) {
    config.provider = oneOf(`provider in config file ${path}`, entries.provider, providerNames);
  }

  if (entries.model !== undefined) {
    config.model = requireString('model', entries.model, path);
  }

  if (entries.output !== undefined) {
    config.output = requireString('output', entries.output, path);
  }

  if (entries.format !== undefined) {
    config.format = oneOf(`format in config file ${path}`, entries.format, reportFormats);
  }

  if (entries.failOn !== undefined) {
    config.failOn = oneOf(`failOn in config file ${path}`, entries.failOn, failOnLevels);
  }

  if (entries.canary !== undefined) {
    if (typeof entries.canary !== 'boolean') {
      throw new Error(`Config file ${path}: canary must be true or false.`);
    }

    config.canary = entries.canary;
  }

  if (entries.categories !== undefined) {
    if (!Array.isArray(entries.categories)) {
      throw new Error(
        `Config file ${path}: categories must be an array. Accepted values: ${categoryNames.join(', ')}`
      );
    }

    if (entries.categories.length === 0) {
      throw new Error(`Config file ${path}: categories is empty, which would scan nothing. Remove the key to scan every category.`);
    }

    config.categories = entries.categories.map(value =>
      oneOf(`categories in config file ${path}`, value, categoryNames)
    );
  }

  return config;
}

/** Reads and validates a config file, naming the path in every failure. */
export async function readScanConfig(path: string): Promise<ScanConfigFile> {
  let text: string;

  try {
    text = await readTextFile(path);
  } catch (cause) {
    throw new Error(`Could not read config file ${path}: ${cause instanceof Error ? cause.message : String(cause)}`);
  }

  let raw: unknown;

  try {
    raw = JSON.parse(text);
  } catch (cause) {
    throw new Error(`Config file ${path} is not valid JSON: ${cause instanceof Error ? cause.message : String(cause)}`);
  }

  return parseScanConfig(raw, path);
}

/**
 * Accepts both `--category encoding --category jailbreak` and `--category encoding,jailbreak`,
 * because both read naturally and a user should not have to remember which one works.
 */
export function parseCategoryList(flag: string, values: readonly unknown[]): AttackCategory[] {
  const names = values
    .flatMap(value => String(value).split(','))
    .map(name => name.trim())
    .filter(name => name !== '');

  if (names.length === 0) {
    throw new Error(`${flag} was given no category. Use one of: ${categoryNames.join(', ')}`);
  }

  const categories = names.map(name => oneOf(flag, name, categoryNames));

  return [...new Set(categories)];
}

function requireString(key: string, value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Config file ${path}: ${key} must be a non-empty string.`);
  }

  return value;
}
