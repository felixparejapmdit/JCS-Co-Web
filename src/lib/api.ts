'use client';

import { READ_OPS } from '@/shared/ops';
import { useCallback, useEffect, useRef, useState } from 'react';

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly extra: Record<string, unknown> = {}) {
    super(message);
  }
}

/** Operations that only read. Every other operation changes data: it clears the screen cache and tells the shell. */

/** Fired on window after any operation that changed data. */
export const CHANGED_EVENT = 'cloudaos:changed';

/** Saves in flight, by what they send (double-click protection). */
const inFlight = new Map<string, Promise<unknown>>();

/** Calls one server operation. Signs the user out automatically when the session has ended. */
export async function rpc<T = any>(op: string, args: Record<string, unknown> = {}): Promise<T> {
  let data: T;
  if (READ_OPS.has(op)) data = await call<T>(op, args);
  else {
    // The same save asked again while it is still running shares the first request, so a double
    // click sends nothing twice. Each request has its own Idempotency-Key, so a request that the
    // network delivers twice also runs once. (A save repeated later, e.g. a toggle, runs again.)
    const what = `${op} ${JSON.stringify(args)}`;
    const running = inFlight.get(what) as Promise<T> | undefined;
    if (running) return running;
    const p = call<T>(op, args, newIdempotencyKey());
    inFlight.set(what, p);
    try {
      data = await p;
    } finally {
      inFlight.delete(what);
    }
  }
  if (!READ_OPS.has(op)) {
    screenCache.clear();
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGED_EVENT));
  }
  return data;
}

/** A unique key for one save (crypto.randomUUID is missing on plain-HTTP intranet pages). */
function newIdempotencyKey(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {}
  return `k${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

async function call<T>(op: string, args: Record<string, unknown>, idempotencyKey?: string): Promise<T> {
  // A save carries an Idempotency-Key: if the same request reaches the server twice (a double
  // click, a retried connection), it runs once and the second gets the first one's answer.
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  const res = await fetch('/api/aos', {
    method: 'POST',
    headers,
    body: JSON.stringify({ op, args }),
    credentials: 'same-origin',
  });
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    throw new ApiError('The server could not be reached. Check your connection and try again.', res.status);
  }
  if (!res.ok || !body?.ok) {
    if (body?.signedOut && typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.location.href = '/?expired=1';
    }
    throw new ApiError(body?.error ?? 'Request failed.', res.status, body ?? {});
  }
  return body.data as T;
}

// ---------------------------------------------------------------------------
// Screen cache: a screen opened again shows its last data at once and refreshes it quietly,
// instead of flashing a loading state. Any change clears it; signing out forgets it.
// ---------------------------------------------------------------------------
const screenCache = new Map<string, unknown>();
const CACHE_LIMIT = 150;

function remember(key: string, value: unknown) {
  screenCache.delete(key);
  screenCache.set(key, value);
  if (screenCache.size > CACHE_LIMIT) screenCache.delete(screenCache.keys().next().value as string);
}

/** Last result of a read operation in this tab, if any. */
export function peek<T>(op: string, args: Record<string, unknown> = {}): T | undefined {
  return screenCache.get(`${op}|${JSON.stringify(args)}`) as T | undefined;
}

/** Runs a read operation and keeps its result for the next visit. */
export async function fetchRead<T>(op: string, args: Record<string, unknown> = {}): Promise<T> {
  const d = await call<T>(op, args);
  remember(`${op}|${JSON.stringify(args)}`, d);
  return d;
}

/** Forgets everything this tab knows about the signed-in user (sign-out, company switch, expiry). */
export function forgetSession() {
  screenCache.clear();
  lookupCache.clear();
  try {
    sessionStorage.removeItem('cloudaos_session_info');
  } catch {}
}

/** Loads data for a screen and exposes a reload function. */
export function useRpc<T = any>(op: string | null, args: Record<string, unknown> = {}, deps: unknown[] = []) {
  const argsKey = JSON.stringify(args);
  const key = op ? `${op}|${argsKey}` : '';
  const [data, setData] = useState<T | null>(() => (key && screenCache.has(key) ? (screenCache.get(key) as T) : null));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(op) && !(key && screenCache.has(key)));
  const seq = useRef(0);

  const load = useCallback(async () => {
    if (!op) return;
    const id = ++seq.current;
    const k = `${op}|${argsKey}`;
    if (screenCache.has(k)) setData(screenCache.get(k) as T);
    setLoading(true);
    setError(null);
    try {
      const d = await call<T>(op, JSON.parse(argsKey));
      remember(k, d);
      if (id === seq.current) setData(d);
    } catch (e) {
      if (id === seq.current) setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (id === seq.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [op, argsKey, ...deps]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, loading, reload: load, setData };
}

export interface LookupItem {
  value: string;
  label: string;
  sub?: string;
  data?: Record<string, any>;
}

const lookupCache = new Map<string, Promise<LookupItem[]>>();

export function loadLookup(name: string, fresh = false): Promise<LookupItem[]> {
  if (fresh || !lookupCache.has(name)) {
    const p = rpc<LookupItem[]>('lookup', { name }).catch((e) => {
      lookupCache.delete(name);
      throw e;
    });
    lookupCache.set(name, p);
  }
  return lookupCache.get(name)!;
}

export function clearLookups() {
  lookupCache.clear();
  screenCache.clear();
}

export function useLookup(name: string | undefined) {
  const [items, setItems] = useState<LookupItem[]>([]);
  useEffect(() => {
    if (!name) return;
    let live = true;
    loadLookup(name)
      .then((x) => live && setItems(x))
      .catch(() => live && setItems([]));
    return () => {
      live = false;
    };
  }, [name]);
  return items;
}
