export function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
