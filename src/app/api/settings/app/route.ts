import { NextRequest, NextResponse } from 'next/server';
import { tenantStore } from '@/services/TenantDataStore';

export async function GET() {
  return NextResponse.json({
    success: true,
    settings: tenantStore.appSettings,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    tenantStore.appSettings = {
      ...tenantStore.appSettings,
      appName: body.appName || tenantStore.appSettings.appName,
      tagline: body.tagline || tenantStore.appSettings.tagline,
      defaultCurrency: body.defaultCurrency || tenantStore.appSettings.defaultCurrency,
      defaultVatRate: Number(body.defaultVatRate) || tenantStore.appSettings.defaultVatRate,
      defaultEwtRate: Number(body.defaultEwtRate) || tenantStore.appSettings.defaultEwtRate,
      currentFiscalYear: Number(body.currentFiscalYear) || tenantStore.appSettings.currentFiscalYear,
      themePreference: body.themePreference || tenantStore.appSettings.themePreference,
    };

    tenantStore.recordAudit(
      'system',
      'Settings',
      'APP_SETTINGS',
      'UPDATE_BRANDING',
      'admin',
      `Updated app name to '${tenantStore.appSettings.appName}'`
    );

    return NextResponse.json({
      success: true,
      settings: tenantStore.appSettings,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
