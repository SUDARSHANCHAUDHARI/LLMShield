import type { ProviderRequest, ProviderResponse } from '../types.js';
import { env } from '../config/env.js';

export async function runOpenRouter(request: ProviderRequest): Promise<ProviderResponse> {
  if (!env.openRouterApiKey) {
    throw new Error('OPENROUTER_API_KEY is missing');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.openRouterApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: request.model,
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userPrompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return { text: data.choices?.[0]?.message?.content ?? '', raw: data };
}
