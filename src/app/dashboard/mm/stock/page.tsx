'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeftRight, ClipboardList, PackagePlus, Warehouse } from 'lucide-react';
import { useRpc } from '@/lib/api';
import { fmtDate } from '@/shared/dates';
import { fmtMoney, fmtQty } from '@/shared/money';
import { RequireRight, useSession } from '@/components/shell/AppShell';
import { DataTable } from '@/components/ui/DataTable';
import { Alert, Badge, Button, Card, Modal, PageHeader, SearchInput, Select, Spinner, cx } from '@/components/ui/kit';

const TC_DOC: Record<string, string> = { '10': 'mmrr', '53': 'do', '72': 'adj' };

function StockCard({ plntno, codeno, onClose }: { plntno: string; codeno: string; onClose: () => void }) {
  const { data, loading, error } = useRpc<any>('inv.card', { plntno, codeno });
  return (
    <Modal side size="lg" open onClose={onClose} title={data ? `${data.material.mmdesc}` : 'Stock card'} description={`${codeno} at ${plntno}`}>
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        data && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/[0.03]">
                <p className="text-xs text-slate-500">On hand</p>
                <p className="text-lg font-bold tabular-nums">
                  {fmtQty(data.closing)} <span className="text-sm font-normal text-slate-500">{data.material.um}</span>
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/[0.03]">
                <p className="text-xs text-slate-500">Average cost</p>
                <p className="text-lg font-bold tabular-nums">₱{fmtMoney(data.avgCost)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/[0.03]">
                <p className="text-xs text-slate-500">Value</p>
                <p className="text-lg font-bold tabular-nums">₱{fmtMoney(data.closing * data.avgCost)}</p>
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">Lots in stock</h4>
              {data.lots.length === 0 ? (
                <p className="text-sm text-slate-500">No lots on hand.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-[#24324f]">
                      <th className="py-2">Lot</th>
                      <th className="py-2">Received</th>
                      <th className="py-2">Expiry</th>
                      <th className="py-2">Lab</th>
                      <th className="py-2 text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1a2540]">
                    {data.lots.map((l: any) => (
                      <tr key={l.lotno}>
                        <td className="py-2 font-mono text-xs">{l.lotno}</td>
                        <td className="py-2">{fmtDate(l.received)}</td>
                        <td className="py-2">{fmtDate(l.expdate)}</td>
                        <td className="py-2">{l.labstat ? <Badge tone={l.labstat === 'Pending' ? 'warning' : l.labstat === 'Rejected' ? 'danger' : 'success'}>{l.labstat === 'Pending' ? 'On hold' : l.labstat}</Badge> : <span className="text-slate-400">—</span>}</td>
                        <td className="py-2 text-right tabular-nums">{fmtQty(l.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">Movements</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-[#24324f]">
                    <th className="py-2">Date</th>
                    <th className="py-2">Document</th>
                    <th className="py-2 text-right">In</th>
                    <th className="py-2 text-right">Out</th>
                    <th className="py-2 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1a2540]">
                  {data.rows.map((r: any, i: number) => (
                    <tr key={i}>
                      <td className="py-2 whitespace-nowrap">{fmtDate(r.date)}</td>
                      <td className="py-2">
                        {TC_DOC[r.tc] ? (
                          <Link href={`/dashboard/doc/${TC_DOC[r.tc]}/${encodeURIComponent(r.docno)}`} className="font-mono text-xs text-teal-700 hover:underline dark:text-teal-400">
                            {r.docno}
                          </Link>
                        ) : (
                          <span className="font-mono text-xs">{r.docno}</span>
                        )}
                        <div className="text-xs text-slate-500">{r.kind === 'IN' ? 'Received' : r.kind === 'OUT' ? 'Issued' : 'Count adjustment'} {r.party ? `· ${r.party}` : ''}</div>
                      </td>
                      <td className="py-2 text-right tabular-nums text-emerald-700 dark:text-emerald-400">{r.qtyIn ? fmtQty(r.qtyIn) : ''}</td>
                      <td className="py-2 text-right tabular-nums text-rose-600">{r.qtyOut ? fmtQty(r.qtyOut) : ''}</td>
                      <td className="py-2 text-right font-semibold tabular-nums">{fmtQty(r.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </Modal>
  );
}

function StockScreen() {
  const params = useSearchParams();
  const { can } = useSession();
  const [plant, setPlant] = useState(params.get('plant') ?? '');
  const [type, setType] = useState('');
  const [q, setQ] = useState('');
  const [alertsOnly, setAlertsOnly] = useState(false);
  const [card, setCard] = useState<{ plntno: string; codeno: string } | null>(null);
  const { data, loading, error } = useRpc<any>('inv.stock', {});
  useEffect(() => setPlant(params.get('plant') ?? ''), [params]);

  const rows = useMemo(() => {
    let r: any[] = data?.rows ?? [];
    if (plant) r = r.filter((x) => x.plntno === plant);
    if (type) r = r.filter((x) => x.mmtype === type);
    if (alertsOnly) r = r.filter((x) => x.alert || x.nearExpiry);
    if (q) r = r.filter((x) => `${x.codeno} ${x.mmdesc}`.toLowerCase().includes(q.toLowerCase()));
    return r.filter((x) => x.onhand !== 0 || x.reorder > 0);
  }, [data, plant, type, q, alertsOnly]);

  return (
    <RequireRight form="034">
      <PageHeader
        title="Stock by Plant"
        description="Live balances for every plant, warehouse and lot, built from receipts, deliveries, transfers and counts. Lots on lab hold cannot be issued until the laboratory passes them."
        actions={
          <>
            {can('050', 3) && <Button icon={PackagePlus} href="/dashboard/doc/mmrr/new">Receive goods</Button>}
            {can('007', 3) && <Button icon={ArrowLeftRight} href="/dashboard/doc/do/new">Transfer or issue</Button>}
            {can('034', 3) && <Button icon={ClipboardList} href="/dashboard/doc/adj/new">Count stock</Button>}
          </>
        }
      />
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        data && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {data.byPlant.map((p: any) => (
                <button key={p.plntno} onClick={() => setPlant(plant === p.plntno ? '' : p.plntno)} className={cx('rounded-xl border bg-white p-4 text-left shadow-sm transition-colors dark:bg-[#111a2e]', plant === p.plntno ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-200 hover:border-teal-300 dark:border-[#1e2a44]')}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Warehouse className="h-4 w-4 text-teal-600" />
                      <span className="font-mono text-xs font-semibold text-slate-500">{p.plntno}</span>
                    </div>
                    {p.alerts > 0 && <Badge tone="warning">{p.alerts} alert(s)</Badge>}
                  </div>
                  <p className="mt-2 truncate font-semibold text-slate-900 dark:text-white">{p.plntname}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {p.items} item(s) · ₱{fmtMoney(p.value)}
                  </p>
                  {p.invset === 'N' && <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">Inventory not tracked here</p>}
                </button>
              ))}
            </div>
            <Card padded={false}>
              <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-[#1e2a44] lg:flex-row lg:items-center">
                <SearchInput value={q} onChange={setQ} placeholder="Search material…" className="lg:max-w-xs lg:flex-1" />
                <Select value={plant} onChange={(e) => setPlant(e.target.value)} placeholder="All plants" options={data.byPlant.map((p: any) => ({ value: p.plntno, label: `${p.plntno} · ${p.plntname}` }))} className="lg:w-64" />
                <Select value={type} onChange={(e) => setType(e.target.value)} placeholder="All material types" options={[{ value: 'RM', label: 'Raw materials' }, { value: 'PM', label: 'Packaging' }, { value: 'FG', label: 'Finished goods' }, { value: 'SP', label: 'Supplies' }]} className="lg:w-52" />
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <input type="checkbox" className="h-4 w-4 accent-teal-600" checked={alertsOnly} onChange={(e) => setAlertsOnly(e.target.checked)} />
                  Only items needing attention
                </label>
                <div className="text-sm text-slate-500 lg:ml-auto">
                  Total value <span className="font-semibold text-slate-900 dark:text-white">₱{fmtMoney(rows.reduce((s, r) => s + r.value, 0))}</span>
                </div>
              </div>
              <DataTable
                rows={rows}
                rowKey={(r) => `${r.plntno}|${r.codeno}`}
                onRowClick={(r) => setCard({ plntno: r.plntno, codeno: r.codeno })}
                pageSize={20}
                columns={[
                  { key: 'mmdesc', header: 'Material', render: (r) => <div><div className="font-medium text-slate-900 dark:text-white">{r.mmdesc}</div><div className="font-mono text-xs text-slate-500">{r.codeno} · {r.mmtype}</div></div> },
                  { key: 'plntno', header: 'Plant', hideOnMobile: true },
                  { key: 'onhand', header: 'On hand', align: 'right', render: (r) => <span>{fmtQty(r.onhand)} <span className="text-xs text-slate-500">{r.um}</span></span> },
                  { key: 'labHold', header: 'Lab hold', align: 'right', hideOnMobile: true, render: (r) => (r.labHold ? fmtQty(r.labHold) : '') },
                  { key: 'available', header: 'Available', align: 'right', render: (r) => <span className={cx('font-semibold', r.reorder && r.available < r.reorder && 'text-rose-600')}>{fmtQty(r.available)}</span> },
                  { key: 'reorder', header: 'Reorder at', align: 'right', hideOnMobile: true, render: (r) => (r.reorder ? fmtQty(r.reorder) : '') },
                  { key: 'avgCost', header: 'Avg cost', align: 'right', hideOnMobile: true, render: (r) => fmtMoney(r.avgCost) },
                  { key: 'value', header: 'Value', align: 'right', render: (r) => fmtMoney(r.value) },
                  { key: 'alert', header: '', sortable: false, render: (r) => <div className="flex flex-wrap gap-1">{r.alert && <Badge tone={r.alert === 'Lab hold' ? 'info' : 'warning'}>{r.alert}</Badge>}{r.nearExpiry > 0 && <Badge tone="danger">{r.nearExpiry} lot(s) near expiry</Badge>}</div> },
                ]}
              />
            </Card>
          </div>
        )
      )}
      {card && <StockCard plntno={card.plntno} codeno={card.codeno} onClose={() => setCard(null)} />}
    </RequireRight>
  );
}

export default function StockPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <StockScreen />
    </Suspense>
  );
}
