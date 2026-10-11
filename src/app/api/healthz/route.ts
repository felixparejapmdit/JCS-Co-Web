import { NextResponse } from 'next/server';
import { isMysqlMode } from '@/server/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'Cloud AOS',
    version: '2.0.0',
    data: isMysqlMode() ? 'company database' : 'sample data',
    timestamp: new Date().toISOString(),
  });
}
