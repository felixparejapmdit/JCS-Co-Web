import { NextRequest, NextResponse } from 'next/server';

interface VpRecord {
  id: string;
  documentNumber: string;
  documentDate: string;
  vendorCode: string;
  vendorName: string;
  grossAmount: number;
  vat12Percent: number;
  ewtRatePct: number;
  ewtAmount: number;
  netPayable: number;
  terms: string;
  status: 'PENDING' | 'APPROVED' | 'PAID';
}

const mockPayables: VpRecord[] = [
  {
    id: 'vp-01',
    documentNumber: 'VP-2026-0081',
    documentDate: '2026-09-18',
    vendorCode: 'V-PETRON',
    vendorName: 'Petron Corporation - Solvents',
    grossAmount: 1250500.0,
    vat12Percent: 133982.14,
    ewtRatePct: 1, // WC160
    ewtAmount: 11165.18,
    netPayable: 1239334.82,
    terms: 'Net 30',
    status: 'APPROVED',
  },
  {
    id: 'vp-02',
    documentNumber: 'VP-2026-0082',
    documentDate: '2026-09-20',
    vendorCode: 'V-MERALCO',
    vendorName: 'Manila Electric Company',
    grossAmount: 350000.0,
    vat12Percent: 37500.0,
    ewtRatePct: 2, // WC158
    ewtAmount: 6250.0,
    netPayable: 343750.0,
    terms: 'Net 15',
    status: 'PENDING',
  },
  {
    id: 'vp-03',
    documentNumber: 'VP-2026-0083',
    documentDate: '2026-09-21',
    vendorCode: 'V-DOWCHEM',
    vendorName: 'Dow Chemical Philippines Inc',
    grossAmount: 450000.0,
    vat12Percent: 48214.29,
    ewtRatePct: 1,
    ewtAmount: 4017.86,
    netPayable: 445982.14,
    terms: 'Net 45',
    status: 'PENDING',
  },
];

export async function GET() {
  return NextResponse.json({ success: true, data: mockPayables });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentNumber, vendorCode, vendorName, grossAmount, isVatInclusive = true, ewtRate = 1 } = body;

    const gross = Number(grossAmount);
    let netOfVat = gross;
    let vat = 0;

    if (isVatInclusive) {
      netOfVat = Math.round((gross / 1.12) * 100) / 100;
      vat = Math.round((gross - netOfVat) * 100) / 100;
    } else {
      vat = Math.round((gross * 0.12) * 100) / 100;
    }

    const ewtAmount = Math.round((netOfVat * (ewtRate / 100)) * 100) / 100;
    const netPayable = Math.round((gross - ewtAmount) * 100) / 100;

    const newVp: VpRecord = {
      id: `vp-${Date.now()}`,
      documentNumber: documentNumber || `VP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      documentDate: new Date().toISOString().slice(0, 10),
      vendorCode,
      vendorName,
      grossAmount: gross,
      vat12Percent: vat,
      ewtRatePct: ewtRate,
      ewtAmount,
      netPayable,
      terms: 'Net 30',
      status: 'PENDING',
    };

    mockPayables.unshift(newVp);

    return NextResponse.json({ success: true, data: newVp }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
