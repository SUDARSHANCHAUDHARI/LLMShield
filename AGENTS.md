# LLMShield Agent Notes

LLMShield is a TypeScript CLI toolkit for testing LLM prompts against prompt leaks, jailbreaks, prompt injection, and unsafe instruction override behavior.

## Working Rules

- Keep the first product surface CLI-first.
- Prefer small, testable modules under `src/`.
- Do not commit `.env`, API keys, generated reports, `node_modules`, or build output.
- Use `pnpm test` for focused verification.
- Use `pnpm build` before release-oriented changes.

## Product Scope

- MVP priority: scan a prompt, run attack cases, evaluate leakage/risk, and generate useful JSON/Markdown reports.
- Defer dashboard, hosted service, and broad provider integrations until the CLI/report workflow is solid.
