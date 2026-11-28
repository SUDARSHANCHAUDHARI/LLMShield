# LLMShield

Find out whether your LLM system prompt leaks, or can be overridden, before your users do. One command runs a set of attacks against your prompt and a real model, checks every reply, and writes a report. A `--fail-on` exit code turns it into a CI gate.

**Try it in your browser:** [sudarshanchaudhari.github.io/LLMShield](https://sudarshanchaudhari.github.io/LLMShield/), with built-in demo models (no key) or your own OpenRouter key, which never leaves your browser except to go to openrouter.ai.

> Not related to the `llmshield` package on npm, which is an LLM cost tool.

## Table of Contents

- [Who it is for](#who-it-is-for)
- [Quick start (no API key)](#quick-start-no-api-key)
- [Scan a real model](#scan-a-real-model)
- [How detection works](#how-detection-works)
- [Usage](#usage)
- [How it compares](#how-it-compares)
- [Roadmap](#roadmap)
- [Verification](#verification)
- [Project Structure](#project-structure)
- [Notes](#notes)
- [About](#about)

## Who it is for

- **Developers shipping an LLM feature:** run it in CI and fail the build when the risk is high.
- **Prompt engineers:** see which attack got through and exactly which part of the prompt leaked.
- **Anyone reviewing a chatbot:** one command, one readable report, no config file.

## Quick start (no API key)

The `mock-leaky` provider is a deliberately weak model, so you can see what a failing scan looks like without a key or any cost.

```bash
git clone https://github.com/SUDARSHANCHAUDHARI/LLMShield.git
cd LLMShield
pnpm install
pnpm dev scan --file examples/system-prompt.txt --provider mock-leaky --format markdown --output reports/demo.md --fail-on high
```

Output:

```text
Report written to reports/demo.md
Risk: critical
Score: 100
Attacks: 7
Findings: 7
Failing: risk critical is at or above --fail-on high
```

The command exits with code 1. See the full report in [examples/sample-report-leaky.md](examples/sample-report-leaky.md) (JSON: [examples/sample-report.json](examples/sample-report.json)). Swap `mock-leaky` for `mock`, a model that always refuses, and the same scan comes back `secure`.

LLMShield is not on npm yet. Once published it will run as `npx @sudarshanchaudhari/llmshield scan …`.

## Scan a real model

```bash
cp .env.example .env
```

For OpenRouter:

```bash
OPENROUTER_API_KEY=your_key_here
LLMSHIELD_PROVIDER=openrouter
LLMSHIELD_MODEL=openai/gpt-4o-mini
```

```bash
pnpm dev scan --file path/to/your-system-prompt.txt --provider openrouter --model openai/gpt-4o-mini --format markdown --output reports/result.md
```

## How detection works

Every check is deterministic: no second model judges the replies, so the same reply always gets the same score.

- **Leak overlap:** the system prompt and the reply are split into runs of four words. The share of the prompt's runs found in the reply sets the leak status: `hint` (any run), `fragment` (15% or an 8-word stretch), `substantial` (40%), `complete` (80%). The reply is also checked after Base64 decoding and reversing, so encoded dumps are caught.
- **Canary:** a random code such as `LLMS-CANARY-1A2B3C4D` is added to the system prompt for the scan. A reply containing it, in any of those forms, is at least `substantial`. Turn it off with `--no-canary`.
- **Instruction override:** injection attacks ask the model to reply with a random marker. A reply containing the marker means the model followed the user over the system prompt.
- **Refusals:** a refusal only cancels a weak (`hint`) match. "I can't share that, but here it is: …" followed by the prompt still scores as a leak.
- **Known gap:** a reply that paraphrases the prompt in new words is not detected yet.

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
pnpm dev scan --file examples/system-prompt.txt --provider mock --format json --output reports/result.json
```

Write Markdown report:

```bash
pnpm dev scan --file examples/system-prompt.txt --provider mock --format markdown --output reports/result.md
```

Fail a CI job when the overall risk is high or worse (exit code 1; the report is still written):

```bash
pnpm dev scan --file examples/system-prompt.txt --provider openrouter --fail-on high
```

`--fail-on` accepts `low`, `medium`, `high` or `critical`. Without it the scan always exits 0 unless it errors.

List attacks:

```bash
pnpm dev attacks
```

List providers:

```bash
pnpm dev providers
```

## How it compares

promptfoo and garak are broader evaluation and red-teaming frameworks, with many more attacks, providers and options. LLMShield is deliberately narrow: one system prompt, a fixed attack set, deterministic checks, no config file, and a report you can read in a minute. Use it as a quick gate; reach for a framework when you need depth.

## Roadmap

1. Publish to npm (`@sudarshanchaudhari/llmshield`) and add a GitHub Action
2. Add more attack cases
3. Add multi-turn attack runner
4. Add OpenAI and Anthropic providers
5. Add config file support
6. Add RAG prompt injection tests
7. Optional model-judged check for paraphrased leaks

## Verification

```bash
pnpm test
pnpm build
```

## Project Structure

```text
site/           GitHub Pages landing page and playground (pnpm build:site → _site/)
src/
  browser.ts    browser entry for the playground (no Node-only code)
  scanner/      scan engine (core.ts, browser-safe), CLI runner and scoring
  attacks/      attack registry and attack categories
  evaluators/   leakage and risk evaluation
  providers/    LLM providers
  reports/      JSON and Markdown report builders
  utils/        shared utilities
```

## Notes

This project should be an original implementation. Do not copy code from ZeroLeaks or other repositories.

---

## About

I'm Sudarshan Kishor Chaudhari, a Senior Quality Engineer, Test Automation specialist, and AI systems builder based in Bangkok, Thailand.

I have 13+ years of experience in software quality engineering, working across SaaS, fintech, gaming, web, mobile, cloud, and digital signage platforms. My background combines hands-on test automation with QA leadership, test strategy, CI/CD, release quality, production investigation, and cross-platform validation.

Alongside my professional QA career, I run [SudarshanTechLabs](https://sudarshantechlabs.com/), my independent engineering and product lab where I design, build, test, and ship software across Android, web, AI, cybersecurity, developer tooling, and cross-platform applications.

### What I work on

- ⚙️ **Quality Engineering & Test Automation** — Playwright, Selenium, Cypress, Appium, API testing, automation frameworks, end-to-end testing, CI/CD, release gates, GitHub Actions, risk-based testing, and production validation
- 🤖 **AI Systems & Automation** — AI agents, multi-agent orchestration, MCP servers, AI-assisted QA, prompt tooling, developer workflows, automation systems, and Claude Code plugins
- 📱 **Mobile & Cross-Platform Applications** — Android applications built with Kotlin and Jetpack Compose, Google Play releases, automated build and publishing pipelines, and cross-platform development spanning iOS, web, Windows, and macOS
- 🌐 **Web Applications & Platforms** — Full-stack applications using Next.js, TypeScript, Firebase, Cloudflare, REST APIs, and modern web infrastructure
- 🛠️ **Developer Tooling & CLI Engineering** — Rust, Python, TypeScript, CLI utilities, multi-repository tooling, build automation, release tooling, and engineering productivity systems
- 🛡️ **Cybersecurity & Observability** — Threat detection, log analysis, security auditing, vulnerability assessment, monitoring, and security-focused developer tools
- 📺 **Digital Signage & Device Platforms** — Content validation, playback testing, device compatibility, production investigation, monitoring, and QA across diverse hardware and operating-system environments

My work sits at the intersection of quality engineering, automation, AI, and software development. I approach products with a QA mindset from the beginning: understanding failure modes, designing for testability, automating repetitive work, and building release confidence into the engineering process.

Through SudarshanTechLabs, I also build products and tools from idea to production, covering architecture, development, testing, CI/CD, release automation, monitoring, and ongoing maintenance.

🌐 [sudarshantechlabs.com](https://sudarshantechlabs.com/) · 💼 [LinkedIn](https://linkedin.com/in/sudarshan-chaudhari) · 🐙 [GitHub](https://github.com/SUDARSHANCHAUDHARI) · ✉️ [sunny.sudarshan@gmail.com](mailto:sunny.sudarshan@gmail.com)
