// Browser-safe OpenRouter call: the API key is passed in, never read from the environment.
import type { ProviderRequest, ProviderResponse } from '../types.js';

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const TIMEOUT_MS = 60_000;

export async function callOpenRouter(request: ProviderRequest, apiKey: string): Promise<ProviderResponse> {
  if (!apiKey) {
    throw new Error('OpenRouter API key is missing');
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: request.model,
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userPrompt }
      ]
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return { text: data.choices?.[0]?.message?.content ?? '', raw: data };
}
