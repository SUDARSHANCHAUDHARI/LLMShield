import type { ProviderRequest, ProviderResponse } from '../types.js';

export async function runAnthropic(_request: ProviderRequest): Promise<ProviderResponse> {
  throw new Error('Anthropic provider is not implemented yet. Use provider mock or openrouter for MVP.');
}
