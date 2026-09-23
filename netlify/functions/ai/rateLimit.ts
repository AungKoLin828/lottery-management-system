interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const requests = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;

export function checkRateLimit(
  userId: string,
): boolean {
  const now = Date.now();

  const existing = requests.get(userId);

  if (!existing || now >= existing.resetAt) {
    requests.set(userId, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });

    return true;
  }

  if (existing.count >= MAX_REQUESTS) {
    return false;
  }

  existing.count += 1;

  return true;
}