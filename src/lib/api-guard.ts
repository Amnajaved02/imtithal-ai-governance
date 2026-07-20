/**
 * Lightweight protection for the public API routes.
 *
 * These endpoints spend real money (Anthropic tokens, n8n executions), and the
 * deployed site is public, so they need at least a basic gate. This is
 * deliberately dependency-free.
 *
 * NOTE: the rate limiter is in-memory, so on a serverless host each instance
 * keeps its own counter and cold starts reset it. It stops casual abuse and
 * accidental double-submits, not a determined attacker. If this ever matters
 * more, move to a shared store (Upstash/Redis) or put the app behind auth.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;

const hits = new Map<string, number[]>();

function clientKey(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

/** Returns true when the caller has exceeded the allowance. */
export function isRateLimited(request: Request): boolean {
  const key = clientKey(request);
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((ts) => now - ts < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);

  // Opportunistic cleanup so the map cannot grow without bound.
  if (hits.size > 5_000) {
    for (const [k, v] of hits) {
      if (v.every((ts) => now - ts >= WINDOW_MS)) hits.delete(k);
    }
  }

  return recent.length > MAX_REQUESTS_PER_WINDOW;
}

/**
 * Rejects cross-origin browser calls. The app calls these routes same-origin,
 * so anything with a foreign Origin header is not us.
 */
export function isForeignOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false; // non-browser callers (curl, health checks) pass
  try {
    return new URL(origin).host !== new URL(request.url).host;
  } catch {
    return true;
  }
}

/** Caps how much text we are willing to forward to a paid upstream. */
export const MAX_INPUT_CHARS = 20_000;
