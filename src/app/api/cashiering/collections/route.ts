import { NextRequest, NextResponse } from 'next/server';

interface CollectionRecord {
  id: string;
  orNumber: string;
  collectionDate: string;
  customerName: string;
  tender: 'CASH' | 'CHEQUE' | 'ONLINE_EFT';
  checkNumber?: string;
  bankName?: string;
  totalInvoiceAmount: number;
  withholdingTaxAmount: number;
  discountAmount: number;
  netCollectionAmount: number;
  isPostDated: boolean;
  status: 'COLLECTED' | 'DEPOSITED';
}

const mockCollections: CollectionRecord[] = [
  {
    id: 'col-01',
    orNumber: 'OR-2026-00912',
    collectionDate: '2026-09-21',
    customerName: 'Pacific Paint (Boysen) Philippines, Inc.',
    tender: 'CHEQUE',
    checkNumber: 'CHK-991204',
    bankName: 'BDO Unibank',
    totalInvoiceAmount: 2500000.0,
    withholdingTaxAmount: 25000.0,
    discountAmount: 50000.0,
    netCollectionAmount: 2425000.0,
    isPostDated: false,
    status: 'COLLECTED',
  },
  {
    id: 'col-02',
    orNumber: 'OR-2026-00913',
    collectionDate: '2026-09-21',
    customerName: 'Charter Chemical & Coating Corp',
    tender: 'ONLINE_EFT',
    totalInvoiceAmount: 1500000.0,
    withholdingTaxAmount: 15000.0,
    discountAmount: 0.0,
    netCollectionAmount: 1485000.0,
    isPostDated: false,
    status: 'COLLECTED',
  },
  {
    id: 'col-03',
    orNumber: 'OR-2026-00914',
    collectionDate: '2026-09-21',
    customerName: 'Metro Pacific Resins & Coatings Inc',
    tender: 'CHEQUE',
    checkNumber: 'PDC-441092',
    bankName: 'Metrobank',
    totalInvoiceAmount: 800000.0,
    withholdingTaxAmount: 8000.0,
    discountAmount: 0.0,
    netCollectionAmount: 792000.0,
    isPostDated: true, // PDC maturing next month
    status: 'COLLECTED',
  },
];

export async function GET() {
  const cdcrSummary = {
    totalCash: mockCollections.filter((c) => c.tender === 'CASH').reduce((s, c) => s + c.netCollectionAmount, 0),
    totalCheque: mockCollections.filter((c) => c.tender === 'CHEQUE').reduce((s, c) => s + c.netCollectionAmount, 0),
    totalOnline: mockCollections.filter((c) => c.tender === 'ONLINE_EFT').reduce((s, c) => s + c.netCollectionAmount, 0),
    grandTotal: mockCollections.reduce((s, c) => s + c.netCollectionAmount, 0),
    pdcCount: mockCollections.filter((c) => c.isPostDated).length,
  };

  return NextResponse.json({ success: true, data: mockCollections, cdcrSummary });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerName, tender, checkNumber, bankName, amount, isPostDated } = body;

    const net = Number(amount);
    const newCol: CollectionRecord = {
      id: `col-${Date.now()}`,
      orNumber: `OR-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      collectionDate: new Date().toISOString().slice(0, 10),
      customerName,
      tender,
      checkNumber,
      bankName,
      totalInvoiceAmount: net,
      withholdingTaxAmount: 0,
      discountAmount: 0,
      netCollectionAmount: net,
      isPostDated: Boolean(isPostDated),
      status: 'COLLECTED',
    };

    mockCollections.unshift(newCol);
    return NextResponse.json({ success: true, data: newCol }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
