import { NextRequest } from 'next/server';
import { gateway } from '@/server/platform/gateway';
import { handleV1 } from '@/server/api/v1/router';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** The public, versioned API. Every path under /api/v1 is routed in server/api/v1/router.ts. */
const handler = gateway('v1', (req: NextRequest, g) => {
  const segments = req.nextUrl.pathname.replace(/^\/api\/v1\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  return handleV1(req, g, segments);
});

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
