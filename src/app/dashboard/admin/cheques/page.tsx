'use client';

import React, { useEffect, useState } from 'react';
import { rpc, useLookup } from '@/lib/api';
import { fmtDate, today } from '@/shared/dates';
import { fmtMoney, numToEng } from '@/shared/money';
import { RequireRight, useSession } from '@/components/shell/AppShell';
import { Alert, Button, Card, Combobox, Field, NumberInput, PageHeader, useToast } from '@/components/ui/kit';

const FIELDS: [string, string][] = [
  ['date', 'Date'],
  ['payee', 'Payee'],
  ['amount', 'Amount in figures'],
  ['amount_words', 'Amount in words'],
];

const DEFAULT = { date_x_mm: 140, date_y_mm: 10, payee_x_mm: 25, payee_y_mm: 22, amount_x_mm: 150, amount_y_mm: 22, amount_words_x_mm: 20, amount_words_y_mm: 31 };

export default function ChequesPage() {
  const toast = useToast();
  const { can } = useSession();
  const banks = useLookup('banks');
  const [acctno, setAcctno] = useState('');
  const [layout, setLayout] = useState<Record<string, number>>(DEFAULT);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!acctno && banks.length) setAcctno(banks[0].value);
  }, [banks, acctno]);
  useEffect(() => {
    if (!acctno) return;
    rpc<any>('cheque.getLayout', { acctno })
      .then((l) => setLayout(l ? Object.fromEntries(Object.entries(DEFAULT).map(([k, d]) => [k, Number(l[k] ?? d)])) : DEFAULT))
      .catch(() => setLayout(DEFAULT));
  }, [acctno]);

  const save = async () => {
    setSaving(true);
    try {
      toast.success(await rpc<string>('cheque.layout', { acctno, layout }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const mm = 3; // preview scale: 3 px per millimetre
  const amount = 125430.5;
  return (
    <RequireRight form="024">
      <PageHeader
        title="Cheque Printing Setup"
        description="Line the printout up with each bank's cheque stock once, in millimetres from the top-left corner. Every cheque from that account then prints in exactly the right place."
        actions={can('024', 2) && <Button variant="primary" loading={saving} onClick={save} disabled={!acctno}>Save layout</Button>}
      />
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card title="Positions (mm)">
          <div className="space-y-4">
            <Field label="Bank account">
              <Combobox items={banks} value={acctno} onChange={setAcctno} />
            </Field>
            {FIELDS.map(([k, label]) => (
              <div key={k} className="grid grid-cols-2 gap-3">
                <Field label={`${label}: from left`}>
                  <NumberInput value={layout[`${k}_x_mm`]} onValue={(v) => setLayout({ ...layout, [`${k}_x_mm`]: Number(v) || 0 })} />
                </Field>
                <Field label="from top">
                  <NumberInput value={layout[`${k}_y_mm`]} onValue={(v) => setLayout({ ...layout, [`${k}_y_mm`]: Number(v) || 0 })} />
                </Field>
              </div>
            ))}
            <Alert tone="info">Tip: print a test cheque on plain paper, hold it over a blank cheque against the light, and adjust by the difference.</Alert>
          </div>
        </Card>
        <Card title="Preview" subtitle="Standard 203 × 76 mm cheque">
          <div className="overflow-x-auto">
            <div className="relative rounded-lg border-2 border-dashed border-black/[0.1] bg-gradient-to-br from-sky-50 to-white dark:border-slate-600 dark:from-slate-800 dark:to-slate-900" style={{ width: 203 * mm, height: 76 * mm }}>
              <div className="absolute text-[13px] text-slate-900 dark:text-white" style={{ left: layout.date_x_mm * mm, top: layout.date_y_mm * mm }}>{fmtDate(today())}</div>
              <div className="absolute text-[13px] font-semibold text-slate-900 dark:text-white" style={{ left: layout.payee_x_mm * mm, top: layout.payee_y_mm * mm }}>** Sample Supplier Corporation **</div>
              <div className="absolute text-[13px] font-semibold text-slate-900 dark:text-white" style={{ left: layout.amount_x_mm * mm, top: layout.amount_y_mm * mm }}>**{fmtMoney(amount)}**</div>
              <div className="absolute max-w-[520px] text-[12px] text-slate-900 dark:text-white" style={{ left: layout.amount_words_x_mm * mm, top: layout.amount_words_y_mm * mm }}>*** {numToEng(amount)} ***</div>
            </div>
          </div>
        </Card>
      </div>
    </RequireRight>
  );
}
