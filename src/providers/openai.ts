import type { ProviderRequest, ProviderResponse } from '../types.js';

export async function runOpenAI(_request: ProviderRequest): Promise<ProviderResponse> {
  throw new Error('OpenAI provider is not implemented yet. Use provider mock or openrouter for MVP.');
}
