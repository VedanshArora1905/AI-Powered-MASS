import type { Context, Next } from 'hono';

type Bucket = {
  tokens: number;
  lastRefill: number;
};

const buckets = new Map<string, Bucket>();

type RateLimitOptions = {
  tokensPerInterval: number;
  intervalMs: number;
};

export const rateLimit =
  (options: RateLimitOptions) =>
  async (c: Context, next: Next): Promise<Response | void> => {
    const key = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? c.req.raw.headers.get('host') ?? 'global';

    const now = Date.now();
    const interval = options.intervalMs;
    const capacity = options.tokensPerInterval;

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { tokens: capacity, lastRefill: now };
      buckets.set(key, bucket);
    }

    // Refill tokens
    const elapsed = now - bucket.lastRefill;
    if (elapsed > 0) {
      const tokensToAdd = Math.floor((elapsed / interval) * capacity);
      if (tokensToAdd > 0) {
        bucket.tokens = Math.min(capacity, bucket.tokens + tokensToAdd);
        bucket.lastRefill = now;
      }
    }

    if (bucket.tokens <= 0) {
      const retryAfterSeconds = Math.ceil(interval / 1000);
      return c.json(
        {
          error: 'Too Many Requests',
          detail: 'Rate limit exceeded. Please try again shortly.',
        },
        429,
        {
          'Retry-After': String(retryAfterSeconds),
        },
      );
    }

    bucket.tokens -= 1;
    buckets.set(key, bucket);

    return next();
  };


