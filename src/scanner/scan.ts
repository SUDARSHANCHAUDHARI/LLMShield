import type { ScanOptions, ScanReport } from '../types.js';
import { runProvider } from './runner.js';
import { scanWith } from './core.js';

export { withCanary } from './core.js';

export async function runScan(options: ScanOptions): Promise<ScanReport> {
  return scanWith(options, request => runProvider(options.provider, request));
}
