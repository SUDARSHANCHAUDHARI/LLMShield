import type { ScanReport } from '../types.js';

export function toJsonReport(report: ScanReport): string {
  return JSON.stringify(report, null, 2);
}
