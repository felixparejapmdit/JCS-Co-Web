import { NextResponse } from 'next/server';
import { TenantService } from '@/services/TenantService';

export async function GET() {
  return NextResponse.json(TenantService.DEFAULT_TENANTS);
}
