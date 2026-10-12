import React from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/kit';
import { fmtDate } from '@/shared/dates';
import { fmtMoney, fmtQty } from '@/shared/money';

/** An order request from a salesman, as a card. */
export function RequestCard({ q, onCancel, children }: { q: any; onCancel?: () => void; children?: React.ReactNode }) {
  return (
    <div className="tile flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-mono text-[13px] font-semibold text-slate-900 dark:text-white">{q.reqno}</div>
          <div className="truncate text-xs text-slate-500">
            {q.customer} · {fmtDate(q.transdate)}
            {q.salesman ? ` · ${q.salesman}` : ''}
          </div>
        </div>
        <StatusBadge status={q.status} />
      </div>
      <ul className="mt-2 space-y-0.5 text-[12px] text-slate-600 dark:text-slate-300">
        {q.lines.map((l: any, i: number) => (
          <li key={i} className="flex justify-between gap-2">
            <span className="truncate">
              {fmtQty(l.qty)} {l.um} {l.mmdesc}
            </span>
            <span className="tabular-nums">{fmtMoney(l.netamt)}</span>
          </li>
        ))}
      </ul>
      {q.remarks && <p className="mt-2 text-[12px] italic text-slate-500">“{q.remarks}”</p>}
      {q.rejectnote && q.status === 'Rejected' && <p className="mt-2 text-[12px] text-rose-600 dark:text-rose-400">Rejected: {q.rejectnote}</p>}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500">Deliver by {fmtDate(q.deldate)}</span>
        <span className="text-lg font-semibold tabular-nums text-slate-900 dark:text-white">{fmtMoney(q.reqamt)}</span>
      </div>
      {q.sono && (
        <Link href={`/dashboard/doc/so/${encodeURIComponent(q.sono)}`} className="mt-1 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300">
          Sales order {q.sono}
        </Link>
      )}
      {onCancel && (
        <button onClick={onCancel} className="mt-2 self-start text-xs font-medium text-rose-600 hover:underline dark:text-rose-400">
          Cancel request
        </button>
      )}
      {children}
    </div>
  );
}
