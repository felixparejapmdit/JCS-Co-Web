'use client';

import React, { useState } from 'react';
import { Building2, Power, PowerOff } from 'lucide-react';
import { forgetSession, rpc, useRpc } from '@/lib/api';
import { RequireRight, useSession } from '@/components/shell/AppShell';
import { Alert, Badge, Button, Card, Field, Input, Modal, PageHeader, Spinner, cx, useToast } from '@/components/ui/kit';
import { fmtDate } from '@/shared/dates';

interface CompanyRow {
  ba: string;
  name: string;
  short: string;
  database: string;
  active: boolean;
  reason: string;
  by: string;
  at: string;
  current: boolean;
}

interface Data {
  companies: CompanyRow[];
  source: 'administration' | 'environment' | 'default';
  saved: boolean;
}

const SOURCE_TEXT: Record<Data['source'], string> = {
  administration: 'Set on this page.',
  environment: 'Set by COMPANIES_DISABLED in .env until someone changes it here.',
  default: 'The built-in default (JCS Chemical on hold, APF dissolved) until someone changes it here.',
};

export default function CompaniesPage() {
  const toast = useToast();
  const { info, refresh } = useSession();
  const { data, loading, error, reload } = useRpc<Data>('companies.list');
  const [busy, setBusy] = useState('');
  const [turningOff, setTurningOff] = useState<CompanyRow | null>(null);
  const [reason, setReason] = useState('');

  const isAdmin = info.user.group === 'ADMIN';
  const activeCount = data?.companies.filter((c) => c.active).length ?? 0;

  const apply = async (c: CompanyRow, active: boolean, why = '') => {
    setBusy(c.ba);
    try {
      const msg = await rpc<string>('companies.setActive', { ba: c.ba, active, reason: why });
      forgetSession();
      toast.success(msg);
      setTurningOff(null);
      setReason('');
      await reload();
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy('');
    }
  };

  return (
    <RequireRight form="001">
      <PageHeader
        eyebrow="Administration"
        title="Companies"
        description="Choose which companies are active. A switched-off company is hidden everywhere: nobody can sign in to it or open it, and all of its data is kept, ready to switch back on."
      />
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        data && (
          <div className="grid gap-6">
            {!isAdmin && <Alert tone="info">Only the ADMIN group can switch companies on or off.</Alert>}
            {!data.saved && <Alert tone="warning">This server cannot save settings, so changes here last only until it restarts. Set COMPANIES_DISABLED in the hosting settings to make them permanent.</Alert>}

            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
              {data.companies.map((c) => {
                const lastActive = c.active && activeCount <= 1;
                return (
                  <Card
                    key={c.ba}
                    title={c.name}
                    subtitle={`Business area ${c.ba} · database ${c.database}`}
                    icon={Building2}
                    tone={c.active ? 'emerald' : 'slate'}
                    className={cx(!c.active && 'opacity-80')}
                    actions={c.active ? <Badge tone="success">Active</Badge> : <Badge tone="neutral">Switched off</Badge>}
                  >
                    <div className="grid gap-4">
                      {c.active ? (
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          Its users can sign in and work in it.
                          {c.current && <span className="font-medium text-slate-900 dark:text-white"> You are signed in to this company.</span>}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          <span className="font-medium text-slate-900 dark:text-white">{c.reason || 'Switched off'}</span>
                          {c.by ? ` · by ${c.by}` : ''}
                          {c.at ? ` on ${fmtDate(c.at.slice(0, 10))}` : ''}. Hidden from sign-in and the company switcher; its data is kept.
                        </p>
                      )}
                      {isAdmin && (
                        <div>
                          {c.active ? (
                            <Button
                              variant="danger"
                              icon={PowerOff}
                              disabled={Boolean(busy) || c.current || lastActive}
                              title={c.current ? 'Switch to another company first' : lastActive ? 'At least one company must stay active' : undefined}
                              onClick={() => setTurningOff(c)}
                            >
                              Switch off
                            </Button>
                          ) : (
                            <Button variant="success" icon={Power} loading={busy === c.ba} disabled={Boolean(busy)} onClick={() => apply(c, true)}>
                              Switch on
                            </Button>
                          )}
                          {c.active && c.current && <p className="mt-2 text-xs text-slate-500">To switch it off, sign in to another company first.</p>}
                          {c.active && !c.current && lastActive && <p className="mt-2 text-xs text-slate-500">This is the last active company.</p>}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">{SOURCE_TEXT[data.source]}</p>
          </div>
        )
      )}

      <Modal
        open={Boolean(turningOff)}
        onClose={() => setTurningOff(null)}
        title={`Switch off ${turningOff?.name ?? ''}?`}
        description="Its users will not be able to sign in to it, and anyone working in it is signed out. Nothing is deleted."
        footer={
          <>
            <Button onClick={() => setTurningOff(null)}>Cancel</Button>
            <Button variant="danger" icon={PowerOff} loading={busy === turningOff?.ba} onClick={() => turningOff && apply(turningOff, false, reason)}>
              Switch off
            </Button>
          </>
        }
      >
        <Field label="Reason" hint="Shown on this page, e.g. Dissolved, On hold">
          <Input value={reason} maxLength={120} onChange={(e) => setReason(e.target.value)} placeholder="On hold for now" />
        </Field>
      </Modal>
    </RequireRight>
  );
}
