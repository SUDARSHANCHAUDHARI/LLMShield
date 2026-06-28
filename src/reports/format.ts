import type { ScanReport } from '../types.js';
import { toJsonReport } from './json.js';
import { toMarkdownReport } from './markdown.js';

export type ReportFormat = 'json' | 'markdown';

export function formatReport(report: ScanReport, format: ReportFormat): string {
  if (format === 'json') return toJsonReport(report);
  return toMarkdownReport(report);
}
