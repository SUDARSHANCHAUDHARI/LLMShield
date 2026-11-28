// Browser-safe OpenAI call: the API key is passed in, never read from the environment.
//
// Request shape from the Chat Completions reference
// (https://developers.openai.com/api/reference/resources/chat), checked 2026-11-28:
//   POST https://api.openai.com/v1/chat/completions
//   Authorization: Bearer <key>
//   required body fields: model, messages
//   max_completion_tokens, NOT max_tokens — the docs call max_tokens deprecated in favour of it,
//   and it is rejected outright by the o-series models
//   the reply text is choices[0].message.content, which is null when the model returns tool
//   calls instead of text, and a decline appears separately as choices[0].message.refusal
import type { ProviderRequest, ProviderResponse } from '../types.js';

const ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const TIMEOUT_MS = 60_000;
const MAX_COMPLETION_TOKENS = 1024;

interface ChatCompletionsResponse {
  choices?: Array<{
    message?: { content?: string | null; refusal?: string | null };
    finish_reason?: string;
  }>;
}

export async function callOpenAI(request: ProviderRequest, apiKey: string): Promise<ProviderResponse> {
  if (!apiKey) {
    throw new Error('OpenAI API key is missing');
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
        ...(request.history ?? []).map(turn => ({ role: turn.role, content: turn.content })),
        { role: 'user', content: request.userPrompt }
      ],
      max_completion_tokens: MAX_COMPLETION_TOKENS
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as ChatCompletionsResponse;
  const message = data.choices?.[0]?.message;

  // A refusal is a result, not an error: the model declined to answer this attack, which for a
  // scanner is the prompt holding. Surface it as the reply text so the evaluator judges it.
  const text = message?.content ?? message?.refusal ?? '';

  return { text, raw: data };
}
