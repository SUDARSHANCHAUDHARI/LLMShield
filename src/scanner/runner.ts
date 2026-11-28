import type { ProviderName, ProviderRequest, ProviderResponse } from '../types.js';
import { env } from '../config/env.js';
import { runOpenRouter } from '../providers/openrouter.js';
import { runOpenAI } from '../providers/openai.js';
import { runAnthropic } from '../providers/anthropic.js';
import { runMockLeaky, runMockSafe } from '../providers/mock.js';

/** The environment variable each provider reads its key from. The mock providers read none. */
const keyVariable: Record<ProviderName, string | undefined> = {
  mock: undefined,
  'mock-leaky': undefined,
  openrouter: 'OPENROUTER_API_KEY',
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY'
};

const keyValue: Record<string, string> = {
  OPENROUTER_API_KEY: env.openRouterApiKey,
  OPENAI_API_KEY: env.openAiApiKey,
  ANTHROPIC_API_KEY: env.anthropicApiKey
};

/**
 * Throws if the chosen provider needs a key and none is set.
 *
 * Called once before the scan starts, not per attack. The providers check too, but by then
 * the attack loop has begun, so a missing key produced one ScanError per attack behind a
 * "Risk: secure" headline — a scan that never reached a model reading as a clean result.
 *
 * A key that is present here and fails later is a different thing, and still becomes a
 * per-attack ScanError so the report can show the hole it left.
 */
export function requireProviderKey(provider: ProviderName): void {
  const variable = keyVariable[provider];

  if (variable === undefined || keyValue[variable]) return;

  throw new Error(
    `${variable} is not set, so the ${provider} provider cannot run. Export it, or put it in a .env file in this directory. To try LLMShield without a key, scan with --provider mock-leaky.`
  );
}

export async function runProvider(provider: ProviderName, request: ProviderRequest): Promise<ProviderResponse> {
  if (provider === 'mock') return runMockSafe(request);
  if (provider === 'mock-leaky') return runMockLeaky(request);
  if (provider === 'openrouter') return runOpenRouter(request);
  if (provider === 'openai') return runOpenAI(request);
  if (provider === 'anthropic') return runAnthropic(request);

  throw new Error(`Unsupported provider: ${provider}`);
}
