import type { ProviderRequest, ProviderResponse } from '../types.js';
import { env } from '../config/env.js';
import { callOpenRouter } from './openrouter-client.js';

export async function runOpenRouter(request: ProviderRequest): Promise<ProviderResponse> {
  if (!env.openRouterApiKey) {
    throw new Error('OPENROUTER_API_KEY is missing');
  }
  return callOpenRouter(request, env.openRouterApiKey);
}
