const attempts = new Map<string, { count: number; resetAt: number }>();

const DEFAULT_MAX = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 min

export function checkRateLimit(
  key: string,
  max = DEFAULT_MAX,
): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryAfterMs: 0 };
  }

  record.count++;
  if (record.count > max) {
    return { ok: false, retryAfterMs: record.resetAt - now };
  }
  return { ok: true, retryAfterMs: 0 };
}
