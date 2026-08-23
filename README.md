# LLMShield

LLMShield is a lightweight TypeScript CLI toolkit for testing LLM system prompts against prompt leaks, jailbreaks, prompt injection, and unsafe instruction override behavior.

The first product surface is a developer CLI that produces security-grade reports for PRs, audits, and release checks.

## Table of Contents

- [Features](#features)
- [Install](#install)
- [Setup](#setup)
- [Usage](#usage)
- [MVP Roadmap](#mvp-roadmap)
- [Verification](#verification)
- [Project Structure](#project-structure)
- [Notes](#notes)
- [About](#about)

## Features

- Scan a system prompt from a file or direct CLI input
- Run basic attack prompts
- Detect possible prompt leakage
- Generate JSON or Markdown report output
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
pnpm dev scan --file examples/system-prompt.txt --provider mock --format json --output reports/result.json
```

Write Markdown report:

```bash
pnpm dev scan --file examples/system-prompt.txt --provider mock --format markdown --output reports/result.md
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
4. Add OpenAI and Anthropic providers
5. Add config file support
6. Add RAG prompt injection tests

## Verification

```bash
pnpm test
pnpm build
```

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

---

## About

I'm Sudarshan Chaudhari, a Senior Quality Engineer, Test Automation specialist, and AI systems builder based in Bangkok, Thailand.

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
