'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly extra: Record<string, unknown> = {}) {
    super(message);
  }
}

/** Calls one server operation. Signs the user out automatically when the session has ended. */
export async function rpc<T = any>(op: string, args: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch('/api/aos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

/** Loads data for a screen and exposes a reload function. */
export function useRpc<T = any>(op: string | null, args: Record<string, unknown> = {}, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(op));
  const seq = useRef(0);
  const argsKey = JSON.stringify(args);

  const load = useCallback(async () => {
    if (!op) return;
    const id = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const d = await rpc<T>(op, JSON.parse(argsKey));
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
