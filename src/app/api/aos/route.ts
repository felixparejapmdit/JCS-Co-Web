import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, readSession, sessionCookieOptions, signSession } from '@/server/auth';
import { DbError, isMysqlMode } from '@/server/db';
import { runOp, session } from '@/server/rpc';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function errorResponse(err: unknown) {
  if (err instanceof DbError) return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
  console.error('[cloud-aos]', err);
  return NextResponse.json({ ok: false, error: 'Something went wrong on the server. Please try again; if it keeps happening, contact your administrator.' }, { status: 500 });
}

function isHttps(req: NextRequest): boolean {
  return req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() === 'https';
}

/** Single RPC endpoint for the whole application: POST { op, args }. */
export async function POST(req: NextRequest) {
  let body: { op?: string; args?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }
  const op = String(body.op ?? '');
  const args = (body.args ?? {}) as Record<string, any>;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined;
  const cookie = sessionCookieOptions(isHttps(req));

  try {
    if (op === 'app.info') {
      // Public: tells the sign-in page whether it is the sample-data preview. No company is named.
      if (isMysqlMode()) return NextResponse.json({ ok: true, data: { mode: 'mysql' } });
      const { DEMO_ACCOUNTS, DEMO_PASSWORD } = await import('@/server/seed');
      return NextResponse.json({ ok: true, data: { mode: 'demo', accounts: DEMO_ACCOUNTS, password: DEMO_PASSWORD } });
    }
    if (op === 'auth.login') {
      const res = await session.signIn(String(args.username ?? ''), String(args.password ?? ''), args.ba ? String(args.ba) : undefined);
      if (res.error) return NextResponse.json({ ok: false, error: res.error, locked: res.locked ?? false, maintenance: res.maintenance ?? false }, { status: res.locked ? 423 : res.maintenance ? 503 : 401 });
      if (res.choose) return NextResponse.json({ ok: true, data: { choose: res.choose } });
      const out = NextResponse.json({ ok: true, data: { signedIn: true } });
      out.cookies.set(SESSION_COOKIE, signSession(res.session!), cookie);
      return out;
    }
    if (op === 'auth.logout') {
      const out = NextResponse.json({ ok: true, data: null });
      out.cookies.set(SESSION_COOKIE, '', { ...cookie, maxAge: 0 });
      return out;
    }

    const s = readSession(req.cookies.get(SESSION_COOKIE)?.value);
    if (!s) return NextResponse.json({ ok: false, error: 'Your session has ended. Please sign in again.', signedOut: true }, { status: 401 });

    if (op === 'auth.switch') {
      const next = await session.switchCompany(s, String(args.ba));
      const out = NextResponse.json({ ok: true, data: { switched: true } });
      out.cookies.set(SESSION_COOKIE, signSession(next), cookie);
      return out;
    }

    const data = await runOp(op, args, s, ip);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return errorResponse(err);
  }
}
