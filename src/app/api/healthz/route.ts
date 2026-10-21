import { NextResponse } from 'next/server';
import { isMysqlMode } from '@/server/db';
import { gateway } from '@/server/platform/gateway';
import { store } from '@/server/platform/store';

export const dynamic = 'force-dynamic';

/** Health check for load balancers and monitoring: is the app up, and what does it read from. */
export const GET = gateway('health', async () =>
  NextResponse.json({
    status: 'healthy',
    service: 'Cloud AOS',
    version: '2.0.0',
    data: isMysqlMode() ? 'company database' : 'sample data',
    cache: store().kind,
    timestamp: new Date().toISOString(),
  })
);
