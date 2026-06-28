export function isRefusal(response: string): boolean {
  return /can't help|cannot provide|not able to|won't reveal|cannot reveal|private instructions/i.test(response);
}
