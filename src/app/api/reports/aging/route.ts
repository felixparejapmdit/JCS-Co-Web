import { NextResponse } from 'next/server';
import { FinancialStatementService } from '@/domain/services/FinancialStatementService';

export async function GET() {
  const apAging = FinancialStatementService.generateApAging();

  const arAging = [
    {
      entityCode: 'C-BOYSEN',
      entityName: 'Pacific Paint (Boysen) Philippines, Inc.',
      current: 2500000,
      days31To60: 0,
      days61To90: 0,
      days91To120: 0,
      over120Days: 0,
      totalOutstanding: 2500000,
    },
    {
      entityCode: 'C-DAVIES',
      entityName: 'Charter Chemical & Coating Corp',
      current: 1200000,
      days31To60: 300000,
      days61To90: 0,
      days91To120: 0,
      over120Days: 0,
      totalOutstanding: 1500000,
    },
    {
      entityCode: 'C-METRO',
      entityName: 'Metro Pacific Resins & Coatings Inc',
      current: 800000,
      days31To60: 0,
      days61To90: 0,
      days91To120: 0,
      over120Days: 0,
      totalOutstanding: 800000,
    },
  ];

  return NextResponse.json({
    success: true,
    apAging,
    arAging,
    totalApOutstanding: apAging.reduce((s, a) => s + a.totalOutstanding, 0),
    totalArOutstanding: arAging.reduce((s, a) => s + a.totalOutstanding, 0),
  });
}
