/**
 * Rate limits (fixed one-minute windows in the store, so they hold across instances with Redis).
 * The limits are generous for people and tight where abuse is likely: sign-in attempts.
 */
import { DbError } from '../db';
import { store } from './store';

export const LIMITS = {
  /** Failed sign-ins per IP address and username, per minute (on top of the 5-strike lockout). */
  signIn: { limit: 10, windowSec: 60 },
  /** Internal API calls per signed-in user, per minute. */
  user: { limit: 1200, windowSec: 60 },
  /** Public API calls per API key, per minute. */
  apiKey: { limit: 300, windowSec: 60 },
} as const;

export interface RateResult {
  ok: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the window resets. */
  resetSec: number;
}

export async function rateLimit(bucket: string, rule: { limit: number; windowSec: number }): Promise<RateResult> {
  const now = Date.now() / 1000;
  const window = Math.floor(now / rule.windowSec);
  const used = await store().incr(windowKey(bucket, rule.windowSec), rule.windowSec + 1);
  const resetSec = Math.max(1, Math.ceil((window + 1) * rule.windowSec - now));
  return { ok: used <= rule.limit, limit: rule.limit, remaining: Math.max(0, rule.limit - used), resetSec };
}

export class RateLimited extends DbError {
  constructor(readonly retryAfter: number) {
    super(`Too many requests. Please wait ${retryAfter} second${retryAfter === 1 ? '' : 's'} and try again.`, 429);
  }
}

function windowKey(bucket: string, windowSec: number) {
  return `rl:${bucket}:${Math.floor(Date.now() / 1000 / windowSec)}`;
}

/** For limits on failures only (sign-in): throws RateLimited when the bucket is already full, without counting. */
export async function refuseIfFull(bucket: string, rule: { limit: number; windowSec: number }): Promise<void> {
  const used = Number((await store().get(windowKey(bucket, rule.windowSec))) ?? 0);
  if (used >= rule.limit) {
    const now = Date.now() / 1000;
    throw new RateLimited(Math.max(1, Math.ceil((Math.floor(now / rule.windowSec) + 1) * rule.windowSec - now)));
  }
}

/** Counts one failure in the bucket. */
export async function countFailure(bucket: string, rule: { limit: number; windowSec: number }): Promise<void> {
  await store().incr(windowKey(bucket, rule.windowSec), rule.windowSec + 1);
}

/** Throws RateLimited when the bucket is over its limit. */
export async function enforce(bucket: string, rule: { limit: number; windowSec: number }): Promise<RateResult> {
  const r = await rateLimit(bucket, rule);
  if (!r.ok) throw new RateLimited(r.resetSec);
  return r;
}
