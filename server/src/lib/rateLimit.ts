import { HttpError } from '../middleware/errorHandler.js';

/**
 * Tiny in-memory limiter for repeated failed sign-ins. It resets when the server restarts,
 * which is fine for a local demo.
 */
export function createFailureLimiter(maxFailures: number, windowMs: number) {
  const failures = new Map<string, number[]>();
  const recent = (key: string) => {
    const cutoff = Date.now() - windowMs;
    const list = (failures.get(key) ?? []).filter((t) => t > cutoff);
    failures.set(key, list);
    return list;
  };
  return {
    /** Throws 429 when the key already has too many recent failures. */
    check(key: string) {
      if (recent(key).length >= maxFailures) {
        throw new HttpError(429, 'Too many failed sign-in attempts. Please wait a few minutes and try again.');
      }
    },
    fail(key: string) {
      recent(key).push(Date.now());
    },
    clear(key: string) {
      failures.delete(key);
    },
  };
}

/**
 * Counts every request (not only failures) per key. Used for the AI endpoints so one
 * person cannot burn through the Gemini quota. Resets when the server restarts.
 */
export function createWindowLimiter(maxRequests: number, windowMs: number, message: string) {
  const hits = new Map<string, number[]>();
  return {
    hit(key: string) {
      const cutoff = Date.now() - windowMs;
      const list = (hits.get(key) ?? []).filter((t) => t > cutoff);
      if (list.length >= maxRequests) {
        const minutes = Math.max(1, Math.ceil((list[0] + windowMs - Date.now()) / 60_000));
        hits.set(key, list);
        throw new HttpError(429, `${message} Please try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.`, undefined, 'rate_limited');
      }
      list.push(Date.now());
      hits.set(key, list);
    },
  };
}
