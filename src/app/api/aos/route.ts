import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, readSession, sessionCookieOptions, signSession } from '@/server/auth';
import { isActiveCompany, isMysqlMode } from '@/server/db';
import { mysqlHoldsSampleData } from '@/server/db/source';
import { runOp, session } from '@/server/rpc';
import { gateway } from '@/server/platform/gateway';
import { LIMITS, countFailure, enforce, refuseIfFull } from '@/server/platform/rate-limit';
import { withIdempotency } from '@/server/platform/idempotency';
import { isReadOp } from '@/shared/ops';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isHttps(req: NextRequest): boolean {
  return req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() === 'https';
}

/**
 * The internal API of the application (a backend-for-frontend): POST { op, args }.
 * Operations are listed in server/rpc.ts. The gateway (server/platform/gateway.ts) adds request ids,
 * error handling, security headers and logs; this handler adds sessions, rate limits and idempotency.
 */
export const POST = gateway('bff', async (req, g) => {
  let body: { op?: string; args?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.', requestId: g.requestId }, { status: 400 });
  }
  const op = String(body.op ?? '');
  const args = (body.args ?? {}) as Record<string, any>;
  const cookie = sessionCookieOptions(isHttps(req));
  g.op = op;

  if (op === 'app.info') {
    // Public: tells the sign-in page whether it is the sample-data preview. No company is named.
    if (isMysqlMode() && !mysqlHoldsSampleData()) return NextResponse.json({ ok: true, data: { mode: 'mysql' } });
    const { demoAccounts, DEMO_PASSWORD } = await import('@/server/seed');
    const DEMO_ACCOUNTS = demoAccounts();
    if (isMysqlMode()) return NextResponse.json({ ok: true, data: { mode: 'mysql', accounts: DEMO_ACCOUNTS, password: DEMO_PASSWORD, sampleInMysql: true } });
    return NextResponse.json({ ok: true, data: { mode: 'demo', accounts: DEMO_ACCOUNTS, password: DEMO_PASSWORD } });
  }
  if (op === 'auth.login') {
    const username = String(args.username ?? '').trim().toLowerCase();
    // Slows down password guessing per address and account (failed tries only), before the 5-strike lockout.
    const bucket = `signin:${g.ip ?? 'unknown'}:${username}`;
    const meta = { ip: g.ip, userAgent: req.headers.get('user-agent') ?? undefined };
    try {
      await refuseIfFull(bucket, LIMITS.signIn);
    } catch (e) {
      if (username) await session.logSignInAttempt(username, 'rate_limited', meta);
      throw e;
    }
    const res = await session.signIn(username, String(args.password ?? ''), args.ba ? String(args.ba) : undefined, meta);
    if (res.error && !res.maintenance) await countFailure(bucket, LIMITS.signIn);
    if (res.error) return NextResponse.json({ ok: false, error: res.error, locked: res.locked ?? false, maintenance: res.maintenance ?? false }, { status: res.locked ? 423 : res.maintenance ? 503 : 401 });
    if (res.choose) return NextResponse.json({ ok: true, data: { choose: res.choose } });
    const out = NextResponse.json({ ok: true, data: { signedIn: true } });
    out.cookies.set(SESSION_COOKIE, signSession(res.session!), cookie);
    return out;
  }
  if (op === 'auth.logout') {
    const who = readSession(req.cookies.get(SESSION_COOKIE)?.value);
    if (who && isActiveCompany(who.ba)) await session.recordSignOut(who, { ip: g.ip, userAgent: req.headers.get('user-agent') ?? undefined });
    const out = NextResponse.json({ ok: true, data: null });
    out.cookies.set(SESSION_COOKIE, '', { ...cookie, maxAge: 0 });
    return out;
  }

  const s = readSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!s) return NextResponse.json({ ok: false, error: 'Your session has ended. Please sign in again.', signedOut: true }, { status: 401 });
  if (!isActiveCompany(s.ba)) {
    const out = NextResponse.json({ ok: false, error: 'This company is no longer active. Please sign in again.', signedOut: true }, { status: 401 });
    out.cookies.set(SESSION_COOKIE, '', { ...cookie, maxAge: 0 });
    return out;
  }
  g.caller = `${s.ba}:${s.u}`;
  await enforce(`user:${s.ba}:${s.u}`, LIMITS.user);

  if (op === 'auth.switch') {
    const next = await session.switchCompany(s, String(args.ba));
    const out = NextResponse.json({ ok: true, data: { switched: true } });
    out.cookies.set(SESSION_COOKIE, signSession(next), cookie);
    return out;
  }

  // Saves carry an Idempotency-Key (lib/api.ts): the same request sent twice runs once.
  const key = isReadOp(op) ? null : req.headers.get('idempotency-key');
  const { value, replayed } = await withIdempotency(`${s.ba}:${s.u}:${op}`, key, () => runOp(op, args, s, g.ip));
  const out = NextResponse.json({ ok: true, data: value });
  if (replayed) out.headers.set('Idempotent-Replayed', 'true');
  return out;
});
