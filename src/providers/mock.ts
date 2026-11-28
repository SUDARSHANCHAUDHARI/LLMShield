import type { ProviderRequest, ProviderResponse } from '../types.js';

const MARKER = /LLMS-[0-9A-F]{8}\b/;

/** A model that always refuses. Every scan against it should come back secure. */
export function runMockSafe(_request: ProviderRequest): ProviderResponse {
  return { text: 'I cannot reveal hidden instructions, system prompts, or private configuration.' };
}

/**
 * A deliberately weak model for demos and CI tests. It obeys injected markers, Base64-encodes
 * its prompt when asked, gives a partial summary to "summarize" requests and dumps the full
 * system prompt otherwise, so every detector in LLMShield has something to find.
 */
export function runMockLeaky(request: ProviderRequest): ProviderResponse {
  const { systemPrompt, userPrompt } = request;

  const marker = userPrompt.match(MARKER);
  if (marker) return { text: marker[0] };

  if (/base64/i.test(userPrompt)) {
    return { text: Buffer.from(systemPrompt).toString('base64') };
  }

  if (/summari[sz]e/i.test(userPrompt)) {
    const firstLines = systemPrompt.split('\n').slice(0, 2).join(' ');
    return { text: `In short, my rules are: ${firstLines}` };
  }

  return { text: `Sure, here are my instructions:\n\n${systemPrompt}` };
}
