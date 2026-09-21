import { NextRequest, NextResponse } from 'next/server';
import { AmtWords } from '@/domain/services/AmtWords';
import { ChequeLayoutFactory } from '@/domain/strategies/ChequeLayoutStrategy';

interface CvRecord {
  id: string;
  checkVoucherNumber: string;
  checkNumber: string;
  checkDate: string;
  bankCode: string;
  bankName: string;
  payeeName: string;
  amount: number;
  amountInWords: string;
  vpReferences: string[];
  status: 'PREPARED' | 'PRINTED' | 'CLEARED' | 'CANCELLED';
  coordinates: any;
}

const mockCheckVouchers: CvRecord[] = [
  {
    id: 'cv-01',
    checkVoucherNumber: 'CV-2026-00452',
    checkNumber: '00088192',
    checkDate: '2026-09-21',
    bankCode: 'BDO',
    bankName: 'Banco De Oro - Valenzuela Operating',
    payeeName: 'Chemag Trading Corp.',
    amount: 1250500.0,
    amountInWords: AmtWords.formatToWords(1250500.0),
    vpReferences: ['VP-2026-0081'],
    status: 'PREPARED',
    coordinates: ChequeLayoutFactory.getLayout('BDO'),
  },
  {
    id: 'cv-02',
    checkVoucherNumber: 'CV-2026-00451',
    checkNumber: '00088191',
    checkDate: '2026-09-20',
    bankCode: 'BPI',
    bankName: 'Bank of the Philippine Islands - Commercial',
    payeeName: 'APF Corp.',
    amount: 450000.0,
    amountInWords: AmtWords.formatToWords(450000.0),
    vpReferences: ['VP-2026-0079'],
    status: 'PRINTED',
    coordinates: ChequeLayoutFactory.getLayout('BPI'),
  },
];

export async function GET() {
  return NextResponse.json({ success: true, data: mockCheckVouchers });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { payeeName, bankCode = 'BDO', amount, vpReferences = [], checkNumber } = body;

    const numAmount = Number(amount);
    const words = AmtWords.formatToWords(numAmount);
    const coords = ChequeLayoutFactory.getLayout(bankCode);

    const newCv: CvRecord = {
      id: `cv-${Date.now()}`,
      checkVoucherNumber: `CV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      checkNumber: checkNumber || String(Math.floor(1000000 + Math.random() * 9000000)),
      checkDate: new Date().toISOString().slice(0, 10),
      bankCode,
      bankName: bankCode === 'BDO' ? 'Banco De Oro' : bankCode === 'BPI' ? 'BPI' : 'Metrobank',
      payeeName,
      amount: numAmount,
      amountInWords: words,
      vpReferences,
      status: 'PREPARED',
      coordinates: coords,
    };

    mockCheckVouchers.unshift(newCv);

    return NextResponse.json({ success: true, data: newCv }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
