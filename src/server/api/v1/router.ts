/**
 * The public API, version 1: read-only, resource-oriented, for other systems (a head-office report,
 * a BI tool, a bank or BIR integration). Reference: docs/API.md.
 *
 *   GET /api/v1                                  what this key can read
 *   GET /api/v1/company                          the key's company
 *   GET /api/v1/{customers|vendors|materials|plants|accounts|cost-centers|profit-centers|salesmen}
 *   GET /api/v1/{same}/{id}
 *   GET /api/v1/documents                        document types
 *   GET /api/v1/documents/{type}?from&to&status&q
 *   GET /api/v1/documents/{type}/{no}
 *   GET /api/v1/reports/{trial-balance|financial-statements|ar-aging|ap-aging}
 *   GET /api/v1/stock
 *   GET /api/v1/jobs/{id}
 *
 * Patterns, so the API stays predictable as it grows:
 * - Resources, not actions: nouns in the path, GET only (writes stay in the app for now).
 * - Versioning: /v1 in the path and an API-Version header. A breaking change becomes /v2; v1 keeps
 *   working until its users have moved.
 * - Pagination: every list takes ?limit (1-200, default 50) and ?cursor, and answers
 *   { data, page: { limit, has_more, next_cursor, total } } plus a Link: rel="next" header.
 * - The same rules as the app: a key acts with the rights of its user group (Access Matrix), and
 *   every answer comes from the same services and caches as the screens (runOp).
 */
import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { companyInfo } from '../../db';
import { runOp } from '../../rpc';
import { allDocServices } from '../../services/docs';
import { MASTERS } from '../../services/masters';
import { authenticateKey } from '../../services/apikeys';
import { getJob } from '../../platform/jobs';
import { LIMITS, enforce } from '../../platform/rate-limit';
import { DbError } from '../../db';
import type { Session } from '../../auth';
import { GatewayCtx, errorBody } from '../../platform/gateway';

export const API_VERSION = '1';

/** Public resource names for the master data lists (kebab-case, plural nouns). */
const MASTER_RESOURCES: Record<string, string> = {
  customers: 'customers',
  vendors: 'vendors',
  materials: 'materials',
  plants: 'plants',
  accounts: 'accounts',
  'cost-centers': 'costCenters',
  'profit-centers': 'profitCenters',
  salesmen: 'salesmen',
};

const REPORTS: Record<string, { op: string; args: (q: URLSearchParams) => Record<string, unknown> }> = {
  'trial-balance': { op: 'report.trialBalance', args: (q) => ({ asOf: q.get('as_of') ?? today(), includeUnposted: q.get('include_unposted') === 'true' }) },
  'financial-statements': {
    op: 'report.fs',
    args: (q) => ({ year: Number(q.get('year') ?? new Date().getFullYear()), month: Number(q.get('month') ?? new Date().getMonth() + 1), includeUnposted: q.get('include_unposted') === 'true' }),
  },
  'ar-aging': { op: 'ar.aging', args: (q) => ({ asOf: q.get('as_of') ?? undefined }) },
  'ap-aging': { op: 'ap.aging', args: (q) => ({ asOf: q.get('as_of') ?? undefined }) },
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

class NotFound extends DbError {
  constructor(what = 'That resource does not exist.') {
    super(what, 404);
  }
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------
export function pageOf<T>(rows: T[], q: URLSearchParams, url: URL) {
  const limit = Math.min(200, Math.max(1, Math.floor(Number(q.get('limit') ?? 50)) || 50));
  let offset = 0;
  const cursor = q.get('cursor');
  if (cursor) {
    const m = /^[A-Za-z0-9_-]+$/.test(cursor) ? /^o:(\d{1,9})$/.exec(Buffer.from(cursor, 'base64url').toString('utf8')) : null;
    if (!m) throw new DbError('The cursor is not valid. Use next_cursor from the previous page.', 400);
    offset = Number(m[1]);
  }
  const data = rows.slice(offset, offset + limit);
  const hasMore = offset + limit < rows.length;
  const nextCursor = hasMore ? Buffer.from(`o:${offset + limit}`, 'utf8').toString('base64url') : null;
  let next: string | null = null;
  if (nextCursor) {
    const u = new URL(url);
    u.searchParams.set('cursor', nextCursor);
    u.searchParams.set('limit', String(limit));
    next = `${u.pathname}${u.search}`;
  }
  return { body: { data, page: { limit, has_more: hasMore, next_cursor: nextCursor, total: rows.length } }, next };
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
function json(body: unknown, init: { status?: number; next?: string | null } = {}) {
  const res = NextResponse.json(body, { status: init.status ?? 200 });
  res.headers.set('API-Version', API_VERSION);
  if (init.next) res.headers.set('Link', `<${init.next}>; rel="next"`);
  return res;
}

function corsHeaders(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get('origin');
  const allowed = (process.env.API_CORS_ORIGINS ?? '').split(',').map((x) => x.trim()).filter(Boolean);
  if (origin && allowed.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Vary', 'Origin');
    res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Authorization, X-API-Key, X-Request-Id, If-None-Match');
    res.headers.set('Access-Control-Expose-Headers', 'API-Version, ETag, Link, X-Request-Id, X-RateLimit-Remaining, Retry-After');
  }
  return res;
}

function keyOf(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return req.headers.get('x-api-key');
}

export async function handleV1(req: NextRequest, g: GatewayCtx, segments: string[]): Promise<NextResponse> {
  if (req.method === 'OPTIONS') return corsHeaders(req, new NextResponse(null, { status: 204 }));
  if (req.method !== 'GET') {
    const res = NextResponse.json(errorBody('v1', 405, 'Version 1 of the API is read-only: use GET.', g.requestId), { status: 405 });
    res.headers.set('Allow', 'GET, OPTIONS');
    return corsHeaders(req, res);
  }

  const auth = await authenticateKey(keyOf(req));
  if (!auth) {
    const res = NextResponse.json(errorBody('v1', 401, 'Send a valid API key: Authorization: Bearer caos_...', g.requestId), { status: 401 });
    res.headers.set('WWW-Authenticate', 'Bearer realm="Cloud AOS API"');
    return corsHeaders(req, res);
  }
  g.caller = auth.session.u;
  const rate = await enforce(`key:${auth.keyId}`, LIMITS.apiKey);

  const url = req.nextUrl;
  g.op = `GET /${segments.join('/')}`;
  let res = await route(auth.session, segments, url.searchParams, new URL(url.href));
  if (res.status === 200) res = await withEtag(req, res);
  res.headers.set('X-RateLimit-Limit', String(rate.limit));
  res.headers.set('X-RateLimit-Remaining', String(rate.remaining));
  return corsHeaders(req, res);
}

/**
 * Conditional requests: every answer carries an ETag (a hash of its body). A caller that sends it
 * back in If-None-Match gets 304 Not Modified with no body when nothing changed, so a dashboard
 * that refreshes every minute downloads the data only when it is new. "private, no-cache" lets the
 * caller keep a copy but makes it ask each time; shared proxies never keep one.
 */
async function withEtag(req: NextRequest, res: NextResponse): Promise<NextResponse> {
  const body = await res.clone().text();
  const etag = `W/"${createHash('sha1').update(body).digest('base64url')}"`;
  const asked = (req.headers.get('if-none-match') ?? '').split(',').map((x) => x.trim());
  const out = asked.includes(etag) || asked.includes('*') ? new NextResponse(null, { status: 304 }) : res;
  if (out !== res) for (const h of ['API-Version', 'Link']) if (res.headers.get(h)) out.headers.set(h, res.headers.get(h)!);
  out.headers.set('ETag', etag);
  out.headers.set('Cache-Control', 'private, no-cache');
  return out;
}

async function route(s: Session, seg: string[], q: URLSearchParams, url: URL): Promise<NextResponse> {
  const [root, a, b] = seg;
  const op = (name: string, args: Record<string, unknown> = {}) => runOp(name, args, s);

  if (!root) {
    return json({
      data: {
        api: 'Cloud AOS',
        version: Number(API_VERSION),
        company: companyInfo(s.ba).name,
        resources: ['company', ...Object.keys(MASTER_RESOURCES), 'documents', 'reports', 'stock', 'jobs'].map((r) => `/api/v1/${r}`),
        documentation: 'docs/API.md',
      },
    });
  }

  if (root === 'company' && !a) {
    const c = companyInfo(s.ba);
    return json({ data: { business_area: c.ba, name: c.name, short_name: c.short } });
  }

  if (root in MASTER_RESOURCES && seg.length <= 2) {
    const id = MASTER_RESOURCES[root];
    const { rows } = (await op('master.list', { id })) as { rows: Record<string, unknown>[] };
    if (a) {
      const key = MASTERS[id].key;
      const row = rows.find((r) => String(r[key]) === a);
      if (!row) throw new NotFound(`No ${root.replace(/s$/, '')} ${a}.`);
      return json({ data: row });
    }
    const p = pageOf(rows, q, url);
    return json(p.body, { next: p.next });
  }

  if (root === 'documents') {
    if (!a) return json({ data: allDocServices().map((d) => ({ type: d.type, title: d.title, url: `/api/v1/documents/${d.type}` })) });
    if (!allDocServices().some((d) => d.type === a) || seg.length > 3) throw new NotFound(`Unknown document type ${a}. See /api/v1/documents.`);
    if (b) return json({ data: await op('doc.get', { type: a, no: b }) });
    const list = (await op('doc.list', { type: a, from: q.get('from') ?? undefined, to: q.get('to') ?? undefined, status: q.get('status') ?? undefined, q: q.get('q') ?? undefined })) as { rows: unknown[] };
    const p = pageOf(list.rows, q, url);
    return json(p.body, { next: p.next });
  }

  if (root === 'reports' && seg.length === 2) {
    const r = REPORTS[a];
    if (!r) throw new NotFound(`Unknown report ${a}. Reports: ${Object.keys(REPORTS).join(', ')}.`);
    return json({ data: await op(r.op, r.args(q)) });
  }

  if (root === 'stock' && !a) {
    const out = (await op('inv.stock', {})) as unknown;
    return json({ data: out });
  }

  if (root === 'jobs' && a && !b) return json({ data: await getJob(a, s.u) });

  throw new NotFound();
}
