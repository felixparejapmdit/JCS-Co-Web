import { NextRequest, NextResponse } from 'next/server';

interface Bir2307Certificate {
  certificateId: string;
  payorTin: string;
  payorName: string;
  payeeTin: string;
  payeeName: string;
  atcCode: string;
  taxDescription: string;
  quarter: string;
  grossPayment: number;
  taxRatePercent: number;
  taxWithheld: number;
  status: 'PENDING_ISSUANCE' | 'ISSUED' | 'CREDITED';
}

const mock2307Certificates: Bir2307Certificate[] = [
  {
    certificateId: '2307-2026-081',
    payorTin: '000-123-456-000',
    payorName: 'JCS Chemical Industries, Inc.',
    payeeTin: '000-112-233-000',
    payeeName: 'Petron Corporation - Solvents',
    atcCode: 'WC160',
    taxDescription: 'Income payments made by top withholding agents to regular suppliers of goods',
    quarter: 'Q3 2026 (July - September)',
    grossPayment: 1250500.0,
    taxRatePercent: 1,
    taxWithheld: 11165.18,
    status: 'ISSUED',
  },
  {
    certificateId: '2307-2026-082',
    payorTin: '000-123-456-000',
    payorName: 'JCS Chemical Industries, Inc.',
    payeeTin: '000-101-500-000',
    payeeName: 'Manila Electric Company',
    atcCode: 'WC158',
    taxDescription: 'Income payments made by top withholding agents to regular suppliers of services',
    quarter: 'Q3 2026 (July - September)',
    grossPayment: 350000.0,
    taxRatePercent: 2,
    taxWithheld: 6250.0,
    status: 'ISSUED',
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    certificates: mock2307Certificates,
    totalWithheld: mock2307Certificates.reduce((s, c) => s + c.taxWithheld, 0),
    totalGrossPayments: mock2307Certificates.reduce((s, c) => s + c.grossPayment, 0),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { payeeTin, payeeName, atcCode = 'WC160', grossPayment } = body;

    const gross = Number(grossPayment);
    const rate = atcCode === 'WC158' ? 2 : atcCode === 'WI010' ? 5 : 1;
    const taxWithheld = Math.round((gross / 1.12) * (rate / 100) * 100) / 100;

    const cert: Bir2307Certificate = {
      certificateId: `2307-2026-${Math.floor(100 + Math.random() * 900)}`,
      payorTin: '000-123-456-000',
      payorName: 'JCS Chemical Industries, Inc.',
      payeeTin,
      payeeName,
      atcCode,
      taxDescription: atcCode === 'WC158' ? 'Supplier of Services' : 'Supplier of Goods',
      quarter: 'Q3 2026',
      grossPayment: gross,
      taxRatePercent: rate,
      taxWithheld,
      status: 'ISSUED',
    };

    mock2307Certificates.unshift(cert);
    return NextResponse.json({ success: true, certificate: cert }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
