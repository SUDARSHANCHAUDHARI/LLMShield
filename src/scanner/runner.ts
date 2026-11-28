import type { ProviderName, ProviderRequest, ProviderResponse } from '../types.js';
import { runOpenRouter } from '../providers/openrouter.js';
import { runOpenAI } from '../providers/openai.js';
import { runAnthropic } from '../providers/anthropic.js';
import { runMockLeaky, runMockSafe } from '../providers/mock.js';

export async function runProvider(provider: ProviderName, request: ProviderRequest): Promise<ProviderResponse> {
  if (provider === 'mock') return runMockSafe(request);
  if (provider === 'mock-leaky') return runMockLeaky(request);
  if (provider === 'openrouter') return runOpenRouter(request);
  if (provider === 'openai') return runOpenAI(request);
  if (provider === 'anthropic') return runAnthropic(request);

  throw new Error(`Unsupported provider: ${provider}`);
}
