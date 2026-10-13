'use client';

import React, { useEffect, useState } from 'react';
import { RotateCcw, Upload } from 'lucide-react';
import { rpc, useRpc } from '@/lib/api';
import { ClientHeader, RequireRight, useSession } from '@/components/shell/AppShell';
import { Alert, Button, Card, Field, Input, Modal, PageHeader, Select, Spinner, useToast } from '@/components/ui/kit';

const SWATCHES = ['#2f7fff', '#10b981', '#0d9488', '#7c3aed', '#db2777', '#dc2626', '#d97706', '#0f172a'];

export default function CompanyPage() {
  const toast = useToast();
  const { info, can, refresh } = useSession();
  const { data, loading, error } = useRpc<any>('admin.company');
  const [form, setForm] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const editable = can('001', 2);

  useEffect(() => {
    if (!data) return;
    setForm({
      bussname: data.company.bussname ?? '',
      shrtname: data.company.shrtname ?? '',
      address: data.company.address ?? '',
      cotin1: data.company.cotin1 ?? '',
      bir_sign: data.company.bir_sign ?? '',
      bir_sign_poss: data.company.bir_sign_poss ?? '',
      ...data.branding,
    });
  }, [data]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const onLogo = (file?: File) => {
    if (!file) return;
    if (file.size > 200 * 1024) {
      setFormError('Please choose a logo smaller than 200 KB.');
      return;
    }
    const r = new FileReader();
    r.onload = () => set('logo_data', String(r.result));
    r.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    setFormError(null);
    try {
      toast.success(await rpc<string>('admin.saveCompany', form));
      await refresh();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    try {
      toast.success(await rpc<string>('demo.reset'));
      window.location.href = '/dashboard';
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <RequireRight form="001">
      <PageHeader
        title="Company & Branding"
        description="Your company's registered details (used on printed forms) and how your company appears in the header of the side menu. Each company sees only its own header; no other organisation is ever listed."
        actions={
          editable && (
            <Button variant="primary" loading={saving} onClick={save} disabled={!form}>
              Save changes
            </Button>
          )
        }
      />
      {loading && !form ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        form && (
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              {formError && <Alert tone="danger">{formError}</Alert>}
              <Card title="Menu header" subtitle="What your team sees at the top of the side menu">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Display name" required hint="Usually your trade name.">
                    <Input value={form.display_name} disabled={!editable} onChange={(e) => set('display_name', e.target.value)} />
                  </Field>
                  <Field label="Tagline" hint="A location or line of business, up to 80 characters.">
                    <Input value={form.tagline} maxLength={80} disabled={!editable} onChange={(e) => set('tagline', e.target.value)} />
                  </Field>
                  <Field label="Initials shown when there is no logo" hint="Up to 3 letters.">
                    <Input value={form.logo_text} maxLength={3} disabled={!editable} onChange={(e) => set('logo_text', e.target.value.toUpperCase())} />
                  </Field>
                  <Field label="Show the business area code">
                    <Select value={form.show_code} disabled={!editable} onChange={(e) => set('show_code', e.target.value)} options={[{ value: 'Y', label: 'Yes, show BA code and open period' }, { value: 'N', label: 'No, keep it clean' }]} />
                  </Field>
                  <Field label="Accent color" className="sm:col-span-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {SWATCHES.map((c) => (
                        <button key={c} type="button" disabled={!editable} onClick={() => set('accent', c)} className={`h-8 w-8 rounded-full ring-offset-2 ring-offset-white dark:ring-offset-[#111a2e] ${form.accent === c ? 'ring-2 ring-slate-900 dark:ring-white' : ''}`} style={{ background: c }} aria-label={`Use color ${c}`} />
                      ))}
                      <input type="color" value={form.accent} disabled={!editable} onChange={(e) => set('accent', e.target.value)} className="h-8 w-12 cursor-pointer rounded border border-black/[0.1] bg-transparent dark:border-white/[0.1]" aria-label="Custom color" />
                      <span className="font-mono text-xs text-slate-500">{form.accent}</span>
                    </div>
                  </Field>
                  <Field label="Logo" hint="PNG, JPG, SVG or WebP under 200 KB. Square images look best." className="sm:col-span-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-black/[0.1] px-3 py-2 text-sm font-medium hover:bg-black/[0.04] dark:border-white/[0.1] dark:hover:bg-white/5 ${!editable ? 'pointer-events-none opacity-60' : ''}`}>
                        <Upload className="h-4 w-4 text-teal-600 dark:text-teal-400" /> Choose logo
                        <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={(e) => onLogo(e.target.files?.[0])} />
                      </label>
                      {form.logo_data && (
                        <Button size="sm" variant="ghost" onClick={() => set('logo_data', null)} disabled={!editable}>
                          Remove logo
                        </Button>
                      )}
                    </div>
                  </Field>
                </div>
              </Card>
              <Card title="Registered details" subtitle="Printed on vouchers, invoices, receipts and BIR forms">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Registered business name" required className="sm:col-span-2">
                    <Input value={form.bussname} disabled={!editable} onChange={(e) => set('bussname', e.target.value)} />
                  </Field>
                  <Field label="Short name">
                    <Input value={form.shrtname} disabled={!editable} onChange={(e) => set('shrtname', e.target.value)} />
                  </Field>
                  <Field label="TIN">
                    <Input value={form.cotin1} disabled={!editable} onChange={(e) => set('cotin1', e.target.value)} />
                  </Field>
                  <Field label="Address" className="sm:col-span-2">
                    <Input value={form.address} disabled={!editable} onChange={(e) => set('address', e.target.value)} />
                  </Field>
                  <Field label="BIR form signatory">
                    <Input value={form.bir_sign} disabled={!editable} onChange={(e) => set('bir_sign', e.target.value)} />
                  </Field>
                  <Field label="Signatory position">
                    <Input value={form.bir_sign_poss} disabled={!editable} onChange={(e) => set('bir_sign_poss', e.target.value)} />
                  </Field>
                </div>
              </Card>
              {info.mode === 'demo' && can('001', 5) && (
                <Card title="Demo data" subtitle="Only in the preview with sample data">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Put this company&apos;s sample data back to its starting state, for example before a presentation.</p>
                    <Button variant="danger" icon={RotateCcw} onClick={() => setResetOpen(true)}>
                      Reset sample data
                    </Button>
                  </div>
                </Card>
              )}
            </div>
            <div className="xl:sticky xl:top-24 xl:self-start">
              <Card title="Live preview">
                <div className="glass overflow-hidden rounded-3xl">
                  <ClientHeader b={{ ...form, ba: info.company.ba }} period={form.show_code === 'Y' ? info.openPeriod : undefined} />
                  <div className="space-y-1 px-3 py-3">
                    {['Home', 'General Ledger', 'Payables', 'Inventory & Plants'].map((l, i) => (
                      <div key={l} className={`rounded-xl px-3 py-2 text-sm ${i === 0 ? 'bg-white font-semibold text-slate-900 shadow-sm ring-1 ring-black/[0.05] dark:bg-white/[0.09] dark:text-white dark:ring-white/[0.08]' : 'text-slate-600 dark:text-slate-300'}`}>
                        {l}
                      </div>
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">Saved changes appear in everyone&apos;s menu the next time they open a page.</p>
              </Card>
            </div>
          </div>
        )
      )}
      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset sample data?"
        description="All documents created in this preview for this company are removed and the sample history is recreated."
        footer={
          <>
            <Button onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={reset}>
              Reset
            </Button>
          </>
        }
      />
    </RequireRight>
  );
}
