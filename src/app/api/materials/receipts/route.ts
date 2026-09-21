import { NextRequest, NextResponse } from 'next/server';

interface MMRRDisplay {
  id: string;
  mmrrNumber: string;
  receivingDate: string;
  poNumber: string;
  vendorName: string;
  itemDescription: string;
  receivedQuantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  is3WayMatched: boolean;
  status: string;
}

const mockMmrr: MMRRDisplay[] = [
  {
    id: 'mmrr-01',
    mmrrNumber: 'MMRR-2026-081',
    receivingDate: '2026-09-20',
    poNumber: 'PO-2026-0412',
    vendorName: 'Petron Corporation - Solvents',
    itemDescription: 'Industrial Solvent Drum (200L)',
    receivedQuantity: 50,
    unit: 'DRUMS',
    unitCost: 7600.0,
    totalCost: 380000.0,
    is3WayMatched: true,
    status: 'ACCEPTED',
  },
  {
    id: 'mmrr-02',
    mmrrNumber: 'MMRR-2026-082',
    receivingDate: '2026-09-21',
    poNumber: 'PO-2026-0415',
    vendorName: 'Dow Chemical Philippines Inc',
    itemDescription: 'Polymer Resin Pellets',
    receivedQuantity: 120,
    unit: 'BAGS',
    unitCost: 3750.0,
    totalCost: 450000.0,
    is3WayMatched: true,
    status: 'ACCEPTED',
  },
];

const mockStockCards = [
  { itemCode: 'CH-SOLV-01', description: 'Industrial Solvent Drum', category: 'Raw Materials', onHand: 420, unit: 'DRUMS', movingAvgCost: 7600.0, totalValue: 3192000.0 },
  { itemCode: 'CH-RESIN-02', description: 'Polymer Resin Pellets', category: 'Raw Materials', onHand: 850, unit: 'BAGS', movingAvgCost: 3750.0, totalValue: 3187500.0 },
  { itemCode: 'CH-PIGM-03', description: 'Titanium White Pigment', category: 'Pigments', onHand: 210, unit: 'KG', movingAvgCost: 1250.0, totalValue: 262500.0 },
  { itemCode: 'PKG-DRUM-01', description: 'Steel Packaging Drums', category: 'Packaging', onHand: 1100, unit: 'PCS', movingAvgCost: 850.0, totalValue: 935000.0 },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    mmrrList: mockMmrr,
    stockCards: mockStockCards,
    inventoryValuation: mockStockCards.reduce((s, it) => s + it.totalValue, 0),
  });
}
