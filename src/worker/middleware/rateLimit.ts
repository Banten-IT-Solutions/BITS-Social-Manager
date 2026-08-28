/**
 * Simple in-memory rate limiter.
 * Resets per worker instance — good enough for auth endpoint abuse prevention.
 */

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();
const MAX_KEYS = 1000;

function sweep(now: number) {
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
  if (store.size <= MAX_KEYS) return;
  const overflow = store.size - MAX_KEYS;
  let removed = 0;
  for (const key of store.keys()) {
    store.delete(key);
    if (++removed >= overflow) break;
  }
}

export function rateLimit(max: number, windowMs: number) {
  return async (
    c: { req: { header: (k: string) => string | undefined } },
    next: () => Promise<Response | void>
  ): Promise<Response | void> => {
    const ip = (c.req.header('CF-Connecting-IP') ?? 'unknown').split(',')[0]!.trim();
    const now = Date.now();
    sweep(now);
    const entry = store.get(ip);

    if (!entry || entry.resetAt < now) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
    } else {
      entry.count++;
      if (entry.count > max) {
        return new Response(JSON.stringify({ error: 'Too many requests' }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)),
          },
        });
      }
    }
    return next();
  };
}
