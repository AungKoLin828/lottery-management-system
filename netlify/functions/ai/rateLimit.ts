/* ============================================================
   SIMPLE SERVERLESS RATE LIMITER

   NOTE:
   This is process-memory based.

   Netlify Functions may use multiple instances, so this should
   be treated as a best-effort protection rather than a global
   distributed rate limiter.

   For a true global production rate limit, use Redis/KV/database.
============================================================ */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const requests =
  new Map<string, RateLimitEntry>();

const WINDOW_MS =
  60 * 1000;

const MAX_REQUESTS =
  10;

/* ============================================================
   RESULT
============================================================ */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/* ============================================================
   CHECK
============================================================ */

export function checkRateLimit(
  userId: string,
): boolean {
  return checkRateLimitDetailed(
    userId,
  ).allowed;
}

/* ============================================================
   DETAILED CHECK
============================================================ */

export function checkRateLimitDetailed(
  userId: string,
): RateLimitResult {
  const now =
    Date.now();

  const existing =
    requests.get(userId);

  if (
    !existing ||
    now >= existing.resetAt
  ) {
    const resetAt =
      now + WINDOW_MS;

    requests.set(userId, {
      count: 1,
      resetAt,
    });

    return {
      allowed: true,
      remaining:
        MAX_REQUESTS - 1,
      resetAt,
    };
  }

  if (
    existing.count >=
    MAX_REQUESTS
  ) {
    return {
      allowed: false,
      remaining: 0,
      resetAt:
        existing.resetAt,
    };
  }

  existing.count += 1;

  return {
    allowed: true,
    remaining:
      Math.max(
        MAX_REQUESTS -
          existing.count,
        0,
      ),
    resetAt:
      existing.resetAt,
  };
}

/* ============================================================
   CONSTANTS FOR OTHER MODULES
============================================================ */

export const AI_RATE_LIMIT = {
  maxRequests:
    MAX_REQUESTS,

  windowMs:
    WINDOW_MS,
};