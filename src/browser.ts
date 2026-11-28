// Entry point for the GitHub Pages playground. Everything reachable from here must run in a
// browser: no Node built-ins, no packages, no environment variables (tests/browser-entry.test.ts).
export type { ScanReport, Finding, ProviderName, ProviderRequest, ProviderResponse } from './types.js';
export { scanWith } from './scanner/core.js';
export type { ProviderFn, ScanProgress } from './scanner/core.js';
export { getAttackRegistry } from './attacks/registry.js';
export { runMockSafe, runMockLeaky } from './providers/mock.js';
export { callOpenRouter } from './providers/openrouter-client.js';
export { toJsonReport } from './reports/json.js';
export { toMarkdownReport } from './reports/markdown.js';
