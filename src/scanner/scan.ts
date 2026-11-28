import type { ScanOptions, ScanReport } from '../types.js';
import { requireProviderKey, runProvider } from './runner.js';
import { scanWith } from './core.js';

export { withCanary } from './core.js';

export async function runScan(options: ScanOptions): Promise<ScanReport> {
  // Before the first attack, not during it. A scan that cannot authenticate has no verdict to
  // give, and saying so once beats one error per attack under a "Risk: secure" headline.
  requireProviderKey(options.provider);

  return scanWith(options, request => runProvider(options.provider, request));
}
