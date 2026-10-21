/**
 * API gateway: the one layer every API request passes through, whichever API it is for
 * (internal /api/aos, public /api/v1, /api/healthz). It gives all of them the same:
 *
 * - request id: X-Request-Id (taken from the caller or created), echoed in every answer and error,
 *   so a user's error message can be found in the server log;
 * - error envelope: business errors keep their message and status; anything unexpected becomes a
 *   500 with a plain message, logged with its request id (internal details never reach the caller);
 * - rate limits: 429 with Retry-After (see rate-limit.ts);
 * - security headers and no caching of API answers by browsers or proxies;
 * - an access log line (JSON) for errors and slow requests, or every request with LOG_REQUESTS=all.
 */
import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { DbError } from '../db';
import { RateLimited } from './rate-limit';

export type ApiName = 'bff' | 'v1' | 'health';

export interface GatewayCtx {
  api: ApiName;
  requestId: string;
  ip?: string;
  started: number;
  /** Filled by the handler for the log: the operation or route, and who called. */
  op?: string;
  caller?: string;
}

const SLOW_MS = Number(process.env.LOG_SLOW_MS ?? 1000);

function requestIdOf(req: NextRequest): string {
  const given = req.headers.get('x-request-id');
  return given && /^[A-Za-z0-9_.:-]{6,80}$/.test(given) ? given : `req_${randomBytes(9).toString('base64url')}`;
}

export function clientIp(req: NextRequest): string | undefined {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined;
}

/** The error shape of each API: the internal API keeps { ok: false, error }, the public one { error: { code, message } }. */
export function errorBody(api: ApiName, status: number, message: string, requestId: string, extra: Record<string, unknown> = {}) {
  if (api === 'v1') return { error: { code: codeOf(status), message, request_id: requestId, ...extra } };
  return { ok: false, error: message, requestId, ...extra };
}

function codeOf(status: number): string {
  return (
    ({ 400: 'bad_request', 401: 'unauthorized', 403: 'forbidden', 404: 'not_found', 409: 'conflict', 423: 'locked', 429: 'rate_limited', 503: 'unavailable' } as Record<number, string>)[status] ??
    (status >= 500 ? 'server_error' : 'error')
  );
}

export function errorResponse(err: unknown, g: GatewayCtx): NextResponse {
  if (err instanceof RateLimited) {
    const res = NextResponse.json(errorBody(g.api, 429, err.message, g.requestId), { status: 429 });
    res.headers.set('Retry-After', String(err.retryAfter));
    return res;
  }
  if (err instanceof DbError) return NextResponse.json(errorBody(g.api, err.status, err.message, g.requestId), { status: err.status });
  console.error(`[cloud-aos] ${g.requestId}`, err);
  return NextResponse.json(
    errorBody(g.api, 500, `Something went wrong on the server. Please try again; if it keeps happening, contact your administrator (reference ${g.requestId}).`, g.requestId),
    { status: 500 }
  );
}

/** Wraps a route handler with the gateway. */
export function gateway(api: ApiName, handler: (req: NextRequest, g: GatewayCtx) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const g: GatewayCtx = { api, requestId: requestIdOf(req), ip: clientIp(req), started: Date.now() };
    let res: NextResponse;
    try {
      res = await handler(req, g);
    } catch (err) {
      res = errorResponse(err, g);
    }
    res.headers.set('X-Request-Id', g.requestId);
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('Referrer-Policy', 'same-origin');
    if (!res.headers.has('Cache-Control')) res.headers.set('Cache-Control', 'no-store');
    log(req, res, g);
    return res;
  };
}

function log(req: NextRequest, res: NextResponse, g: GatewayCtx) {
  const ms = Date.now() - g.started;
  const all = process.env.LOG_REQUESTS === 'all';
  if (!all && res.status < 500 && ms < SLOW_MS) return;
  const line = { t: new Date().toISOString(), id: g.requestId, api: g.api, method: req.method, path: req.nextUrl.pathname, op: g.op, caller: g.caller, status: res.status, ms };
  console.log(`[cloud-aos] ${JSON.stringify(line)}`);
}
