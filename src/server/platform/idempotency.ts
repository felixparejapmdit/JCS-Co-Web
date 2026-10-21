/**
 * Idempotency for saves: a request sent twice with the same Idempotency-Key (a double click, a
 * network retry) runs once. The second gets the first one's answer instead of a second document.
 *
 * The browser sends a fresh key with every write (lib/api.ts). Keys are scoped to the user and
 * company, kept for 24 hours, and only successful answers are kept: a request that failed can be
 * sent again with the same key and will run again.
 */
import { DbError } from '../db';
import { store } from './store';

const DONE_TTL = 24 * 3600;
const RUNNING_TTL = 120; // a request still running after two minutes is treated as gone
const KEY_RE = /^[A-Za-z0-9_.:-]{8,100}$/;

export interface IdempotentResult<T> {
  value: T;
  /** True when this answer is the stored one from an earlier identical request. */
  replayed: boolean;
}

export async function withIdempotency<T>(scope: string, key: string | null | undefined, run: () => Promise<T>): Promise<IdempotentResult<T>> {
  if (!key) return { value: await run(), replayed: false };
  if (!KEY_RE.test(key)) throw new DbError('The Idempotency-Key header must be 8 to 100 letters, digits or - _ . :', 400);
  const s = store();
  const k = `idem:${scope}:${key}`;

  const earlier = await s.get(k);
  if (earlier !== null) return answerFrom(earlier);
  if (!(await s.setIfAbsent(k, JSON.stringify({ state: 'running' }), RUNNING_TTL))) {
    const now = await s.get(k);
    if (now !== null) return answerFrom(now);
  }
  try {
    const value = await run();
    await s.set(k, JSON.stringify({ state: 'done', value: value ?? null }), DONE_TTL);
    return { value, replayed: false };
  } catch (err) {
    await s.del(k); // a failed request may be tried again with the same key
    throw err;
  }
}

function answerFrom<T>(text: string): IdempotentResult<T> {
  const rec = JSON.parse(text) as { state: 'running' | 'done'; value?: T };
  if (rec.state === 'running') throw new DbError('This request is already being processed. Please wait a moment.', 409);
  return { value: rec.value as T, replayed: true };
}
