'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Send, ShoppingBag, TrendingUp, Users, Wallet } from 'lucide-react';
import { rpc, useRpc } from '@/lib/api';
import { RequireRight } from '@/components/shell/AppShell';
import { RequestCard } from '@/components/sales/RequestCard';
import { Alert, Badge, Button, Card, EmptyState, Field, Input, Modal, NumberInput, PageHeader, Progress, Select, Spinner, Stat, StatusBadge, cx, useToast } from '@/components/ui/kit';
import { addDays, fmtDate, today } from '@/shared/dates';
import { fmtMoney, fmtQty } from '@/shared/money';

const KEY = 'cloudaos_smnno';

export default function SalesmanPage() {
  const toast = useToast();
  const [smnno, setSmnno] = useState('');
  useEffect(() => {
    try {
      setSmnno(localStorage.getItem(KEY) ?? '');
    } catch {}
  }, []);
  const { data, loading, error, reload } = useRpc<any>('salesman.workspace', { smnno }, [smnno]);
  const [req, setReq] = useState<{ custno: string; deldate: string; pono: string; remarks: string; qty: Record<string, number | ''> } | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = (v: string) => {
    setSmnno(v);
    try {
      localStorage.setItem(KEY, v);
    } catch {}
  };

  const send = async () => {
    if (!req) return;
    setBusy(true);
    try {
      const lines = Object.entries(req.qty).filter(([, q]) => Number(q) > 0).map(([codeno, qty]) => ({ codeno, qty: Number(qty) }));
      toast.success(await rpc<string>('salesman.request', { smnno: data.smnno, custno: req.custno, deldate: req.deldate, pono: req.pono, remarks: req.remarks, lines }));
      setReq(null);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (reqno: string) => {
    if (!confirm(`Cancel request ${reqno}?`)) return;
    try {
      toast.success(await rpc<string>('salesman.cancel', { reqno }));
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const total = req && data ? data.products.reduce((s: number, p: any) => s + (Number(req.qty[p.codeno]) || 0) * p.sp, 0) : 0;

  return (
    <RequireRight form="076">
      <PageHeader
        eyebrow="Sales & Distribution"
        title="Salesman's Workspace"
        description="Your customers with their balances and credit left, your sales this month, and order requests for the sales manager."
        actions={
          <>
            {data?.canPick && <Select value={data.smnno} onChange={(e) => pick(e.target.value)} options={[{ value: '', label: 'Choose the salesman…' }, ...data.salesmen]} className="w-64" aria-label="Salesman" />}
            {data?.rights.add && data?.smnno && (
              <Button variant="primary" icon={Send} disabled={!data.customers.length} onClick={() => setReq({ custno: data.customers[0]?.custno ?? '', deldate: addDays(today(), 3), pono: '', remarks: '', qty: {} })}>
                New order request
              </Button>
            )}
          </>
        }
      />
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : !data?.smnno ? (
        <EmptyState icon={Users} title="Choose the salesman" text="Pick the salesman you work as from the list above. Cloud AOS remembers it on this device." />
      ) : (
        <div className="grid gap-6">
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr))]">
            <Stat label="My customers" icon={Users} value={data.stats.customers} />
            <Stat label="Sales this month" icon={TrendingUp} tone="emerald" value={fmtMoney(data.stats.salesMtd)} />
            <Stat label="Open receivables" icon={Wallet} tone="blue" value={fmtMoney(data.stats.openAr)} sub={data.stats.overdue ? `${fmtMoney(data.stats.overdue)} overdue` : 'Nothing overdue'} />
            <Stat label="Requests waiting" icon={Send} tone="amber" value={data.stats.pending} sub="For the sales manager" />
          </div>

          <Card title="My customers" subtitle="Credit used = open receivables + undelivered orders" icon={Users}>
            {!data.customers.length ? (
              <p className="text-sm text-slate-500">No customers are assigned to this salesman.</p>
            ) : (
              <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr))]">
                {data.customers.map((c: any) => {
                  const used = c.openAr + c.openOrders;
                  return (
                    <div key={c.custno} className="tile p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-slate-900 dark:text-white">{c.bussname}</div>
                          <div className="text-xs text-slate-500">
                            {c.custno} · {c.term ? `${c.term} days` : 'Cash'}
                          </div>
                        </div>
                        {c.overdue > 0 && (
                          <Badge tone="danger">
                            <AlertTriangle className="h-3 w-3" /> Overdue
                          </Badge>
                        )}
                      </div>
                      <div className="mt-3 flex items-baseline justify-between text-sm">
                        <span className="text-slate-500">Open A/R</span>
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{fmtMoney(c.openAr)}</span>
                      </div>
                      {c.limit ? (
                        <>
                          <Progress className="mt-2" value={used} max={c.limit} tone="auto" />
                          <div className="mt-1 flex justify-between text-[11px] text-slate-500">
                            <span>Limit {fmtMoney(c.limit)}</span>
                            <span className={cx(c.available < 0 && 'font-semibold text-rose-600')}>{fmtMoney(c.available)} left</span>
                          </div>
                        </>
                      ) : (
                        <p className="mt-2 text-[11px] text-slate-500">No credit limit set</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card title="My order requests" icon={ShoppingBag}>
            {!data.requests.length ? (
              <p className="text-sm text-slate-500">No requests yet.</p>
            ) : (
              <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
                {data.requests.map((q: any) => (
                  <RequestCard key={q.reqno} q={q} onCancel={q.status === 'Requested' ? () => cancel(q.reqno) : undefined} />
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      <Modal
        open={Boolean(req)}
        onClose={() => setReq(null)}
        size="lg"
        title="New order request"
        description="Prices come from the price list. The sales manager checks credit and turns the request into a sales order."
        footer={
          <>
            <span className="mr-auto text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{fmtMoney(total)}</span>
            <Button onClick={() => setReq(null)}>Cancel</Button>
            <Button variant="primary" icon={Send} loading={busy} disabled={!req?.custno || !total} onClick={send}>
              Send request
            </Button>
          </>
        }
      >
        {req && data && (
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Customer" required className="sm:col-span-2">
                <Select value={req.custno} onChange={(e) => setReq({ ...req, custno: e.target.value })} options={data.customers.map((c: any) => ({ value: c.custno, label: c.bussname }))} />
              </Field>
              <Field label="Deliver by">
                <Input type="date" value={req.deldate} min={today()} onChange={(e) => setReq({ ...req, deldate: e.target.value })} />
              </Field>
              <Field label="Customer PO no.">
                <Input value={req.pono} onChange={(e) => setReq({ ...req, pono: e.target.value })} />
              </Field>
              <Field label="Note to the manager" className="sm:col-span-2">
                <Input value={req.remarks} onChange={(e) => setReq({ ...req, remarks: e.target.value })} />
              </Field>
            </div>
            <div className="grid max-h-[45vh] gap-2 overflow-y-auto pr-1">
              {data.products.map((p: any) => (
                <div key={p.codeno} className="tile flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">{p.mmdesc}</div>
                    <div className="text-[11px] text-slate-500">
                      {fmtMoney(p.sp)} per {p.um}
                    </div>
                  </div>
                  <NumberInput className="!w-28 text-right" decimals={3} placeholder="Qty" value={req.qty[p.codeno] ?? ''} onValue={(v) => setReq({ ...req, qty: { ...req.qty, [p.codeno]: v } })} aria-label={`Quantity of ${p.mmdesc}`} />
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </RequireRight>
  );
}
