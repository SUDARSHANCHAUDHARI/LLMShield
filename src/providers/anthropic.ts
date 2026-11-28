import type { ProviderRequest, ProviderResponse } from '../types.js';
import { env } from '../config/env.js';
import { callAnthropic } from './anthropic-client.js';

export async function runAnthropic(request: ProviderRequest): Promise<ProviderResponse> {
  if (!env.anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY is missing');
  }
  // No fromBrowser: a server-side request carries no Origin header, so the direct-browser-access
  // opt-in is neither needed nor appropriate here.
  return callAnthropic(request, env.anthropicApiKey);
}
