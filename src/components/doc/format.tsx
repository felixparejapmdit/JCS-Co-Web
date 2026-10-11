import React from 'react';
import { fmtDate } from '@/shared/dates';
import { fmtMoney, fmtQty } from '@/shared/money';
import { StatusBadge } from '@/components/ui/kit';
import type { Kind } from './configs';

export function fmtCell(value: any, kind?: Kind): React.ReactNode {
  if (value === null || value === undefined || value === '') return <span className="text-slate-400">—</span>;
  switch (kind) {
    case 'date':
      return fmtDate(String(value));
    case 'money':
      return <span className="tabular-nums">{fmtMoney(Number(value))}</span>;
    case 'qty':
      return <span className="tabular-nums">{fmtQty(Number(value))}</span>;
    case 'status':
      return <StatusBadge status={String(value)} />;
    case 'mono':
      return <span className="font-mono text-[13px] text-slate-800 dark:text-slate-200">{String(value)}</span>;
    default:
      return String(value);
  }
}

export function isNumericKind(kind?: Kind) {
  return kind === 'money' || kind === 'qty';
}
