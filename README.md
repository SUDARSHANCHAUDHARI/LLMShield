# LLMShield

LLMShield is a lightweight TypeScript CLI toolkit for testing LLM system prompts against prompt leaks, jailbreaks, prompt injection, and unsafe instruction override behavior.

This scaffold is intentionally small. Build the working scanner first, then add dashboard, CI integrations, and more providers later.

## Features

- Scan a system prompt from a file or direct CLI input
- Run basic attack prompts
- Detect possible prompt leakage
- Generate JSON report output
- OpenRouter provider support
- Mock provider for local testing

## Install

```bash
pnpm install
```

## Setup

```bash
cp .env.example .env
```

For OpenRouter:

```bash
OPENROUTER_API_KEY=your_key_here
LLMSHIELD_PROVIDER=openrouter
LLMSHIELD_MODEL=openai/gpt-4o-mini
```

## Usage

Run with mock provider:

```bash
pnpm dev scan --file examples/system-prompt.txt --provider mock
```

Run with OpenRouter:

```bash
pnpm dev scan --file examples/system-prompt.txt --provider openrouter --model openai/gpt-4o-mini
```

Write report:

```bash
pnpm dev scan --file examples/system-prompt.txt --provider mock --output reports/result.json
```

List attacks:

```bash
pnpm dev attacks
```

List providers:

```bash
pnpm dev providers
```

## MVP Roadmap

1. Improve leakage evaluator
2. Add more attack cases
3. Add multi-turn attack runner
4. Add Markdown report output
5. Add OpenAI and Anthropic providers
6. Add config file support
7. Add RAG prompt injection tests

## Project Structure

```text
src/
  scanner/      scan runner and scoring
  attacks/      attack registry and attack categories
  evaluators/   leakage and risk evaluation
  providers/    LLM providers
  reports/      JSON and Markdown report builders
  utils/        shared utilities
```

## Notes

This project should be an original implementation. Do not copy code from ZeroLeaks or other repositories.
