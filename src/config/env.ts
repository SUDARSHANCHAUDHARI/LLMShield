import dotenv from 'dotenv';

dotenv.config();

export const env = {
  openRouterApiKey: process.env.OPENROUTER_API_KEY ?? '',
  openAiApiKey: process.env.OPENAI_API_KEY ?? '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
  defaultProvider: process.env.LLMSHIELD_PROVIDER ?? 'mock',
  defaultModel: process.env.LLMSHIELD_MODEL ?? 'openai/gpt-4o-mini'
};
