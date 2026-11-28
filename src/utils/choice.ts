/**
 * Flag validation for the CLI.
 *
 * These checks used to go through `z.enum(...).parse`, which printed a block of zod JSON at a
 * person running a command with a typo in it. A CLI flag has a closed set of values and no
 * nesting, so a schema library buys nothing here.
 */

/**
 * Returns `value` when it is one of `allowed`, narrowed to that union.
 *
 * @throws Error naming the flag, the value received and the accepted values, in one line.
 */
export function oneOf<T extends string>(flag: string, value: unknown, allowed: readonly T[]): T {
  if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) {
    return value as T;
  }

  throw new Error(`Invalid ${flag} ${JSON.stringify(stringify(value))}. Use one of: ${allowed.join(', ')}`);
}

/** As `oneOf`, but an unset flag is allowed and comes back as `undefined`. */
export function optionalOneOf<T extends string>(
  flag: string,
  value: unknown,
  allowed: readonly T[]
): T | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  return oneOf(flag, value, allowed);
}

/**
 * The value reaches here straight from argv, so it is usually a string, but commander hands over
 * `true` for a flag declared with an optional argument and nothing else guarantees a string. Keep
 * the message readable instead of printing `[object Object]`.
 */
function stringify(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return Object.prototype.toString.call(value);
}
