import type { ProviderRequest, ProviderResponse } from '../types.js';
import { env } from '../config/env.js';
import { callOpenAI } from './openai-client.js';

export async function runOpenAI(request: ProviderRequest): Promise<ProviderResponse> {
  if (!env.openAiApiKey) {
    throw new Error('OPENAI_API_KEY is missing');
  }
  return callOpenAI(request, env.openAiApiKey);
}
