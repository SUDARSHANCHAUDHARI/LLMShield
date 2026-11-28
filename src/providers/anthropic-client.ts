// Browser-safe Anthropic call: the API key is passed in, never read from the environment.
//
// Request shape from the Messages API reference and the authentication guide
// (platform.claude.com/docs/en/api/http/messages/create, /docs/en/manage-claude/authentication),
// checked 2026-11-28:
//   POST https://api.anthropic.com/v1/messages
//   Authorization: Bearer <key>          — x-api-key is the legacy header
//   anthropic-version: 2026-10-21
//   required body fields: model, max_tokens, messages
//   the system prompt is the top-level `system` field, not a message with role 'system'
//   the reply is a `content` array of blocks; the text lives on the text blocks
//   no temperature/top_p/top_k: on API version 2026-10-21 sending any of them is a 400
import type { ProviderRequest, ProviderResponse } from '../types.js';

const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2026-10-21';
const TIMEOUT_MS = 60_000;
const MAX_TOKENS = 1024;

interface MessagesResponse {
  content?: Array<{ type?: string; text?: string }>;
  stop_reason?: string;
  stop_details?: { type?: string; category?: string | null; explanation?: string } | null;
}

export interface AnthropicCallOptions {
  /**
   * Adds `anthropic-dangerous-direct-browser-access: true`. A request sent from a browser is a
   * cross-origin request, and the API only accepts one that carries this header. Node must not
   * send it: a server-side request has no Origin header and does not need the opt-in.
   */
  fromBrowser?: boolean;
}

export async function callAnthropic(
  request: ProviderRequest,
  apiKey: string,
  options: AnthropicCallOptions = {}
): Promise<ProviderResponse> {
  if (!apiKey) {
    throw new Error('Anthropic API key is missing');
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'anthropic-version': API_VERSION,
    'Content-Type': 'application/json'
  };

  if (options.fromBrowser) {
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: request.model,
      max_tokens: MAX_TOKENS,
      system: request.systemPrompt,
      messages: [
        ...(request.history ?? []).map(turn => ({ role: turn.role, content: turn.content })),
        { role: 'user', content: request.userPrompt }
      ]
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });

  if (!response.ok) {
    throw new Error(`Anthropic request failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as MessagesResponse;

  // A safety decline is a result, not a transport error, and it arrives as HTTP 200 with
  // stop_reason 'refusal' and an empty content array. For a scanner that is the prompt holding,
  // so report it as text the evaluator can read rather than throwing.
  if (data.stop_reason === 'refusal') {
    const category = data.stop_details?.category ?? 'unspecified';
    return { text: `The model declined to answer (${category}).`, raw: data };
  }

  const text = (data.content ?? [])
    .filter(block => block.type === 'text' && typeof block.text === 'string')
    .map(block => block.text as string)
    .join('\n');

  return { text, raw: data };
}
