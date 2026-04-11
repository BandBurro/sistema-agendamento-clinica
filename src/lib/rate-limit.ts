interface Entry {
  count: number;
  resetAt: number;
}

// Module-level store persists across requests within the same process.
// In a multi-instance deployment, use Redis instead.
const store = new Map<string, Entry>();

/**
 * Sliding-window rate limiter.
 * @param key      Unique key per subject (e.g. "register:1.2.3.4")
 * @param limit    Max allowed calls within the window
 * @param windowMs Window size in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count++;
  return { allowed: true };
}
