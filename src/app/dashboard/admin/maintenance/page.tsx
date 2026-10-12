'use client';

import React, { useEffect, useState } from 'react';
import { Power, ShieldCheck, Users, Wrench } from 'lucide-react';
import { rpc, useRpc } from '@/lib/api';
import { RequireRight, useSession } from '@/components/shell/AppShell';
import { Alert, Badge, Button, Card, Field, Input, PageHeader, Spinner, Stat, Textarea, useToast } from '@/components/ui/kit';
import { fmtDate } from '@/shared/dates';

export default function MaintenancePage() {
  const toast = useToast();
  const { refresh } = useSession();
  const { data, loading, error, reload } = useRpc<any>('system.maintenance');
  const [message, setMessage] = useState('');
  const [until, setUntil] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setMessage(data.message ?? '');
    setUntil(data.until ?? '');
  }, [data]);

  const save = async (on: boolean) => {
    if (on && !data.on && !confirm(`Switch maintenance mode on? ${data.blockedUsers} user(s) will be signed out of their work until you switch it off.`)) return;
    setSaving(true);
    try {
      await rpc('system.setMaintenance', { on, message, until });
      toast.success(on ? (data.on ? 'Maintenance message updated.' : 'Maintenance mode is on.') : 'Maintenance mode is off. Everyone can work again.');
      await reload();
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <RequireRight form="001">
      <PageHeader
        eyebrow="Administration"
        title="Maintenance Mode"
        description="Pause work in this company while you update data or the system. Administrators keep working; everyone else sees your message, also at sign-in."
      />
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        data && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))] [grid-column:1/-1]">
              <Stat label="Status" icon={Power} tone={data.on ? 'amber' : 'emerald'} value={data.on ? 'Under maintenance' : 'Open for work'} sub={data.at ? `Last changed ${fmtDate(String(data.at).slice(0, 10))} by ${data.by}` : 'Never switched on'} />
              <Stat label="Users paused while on" icon={Users} tone="rose" value={`${data.blockedUsers} of ${data.totalUsers}`} sub="Active users outside the groups below" />
              <Stat label="Keep working" icon={ShieldCheck} tone="brand" value={data.keepWorking.length} sub={data.keepWorking.join(', ') || 'Administrators'} />
            </div>

            <Card title="Message to users" subtitle="Shown on the sign-in page and on every screen while maintenance is on." icon={Wrench}>
              <div className="grid gap-4">
                <Field label="Message" hint={`${message.length} / 300`}>
                  <Textarea rows={3} maxLength={300} value={message} disabled={!data.canSwitch} onChange={(e) => setMessage(e.target.value)} />
                </Field>
                <Field label="Expected back" hint="Optional, e.g. 6:00 AM, Monday">
                  <Input value={until} maxLength={60} disabled={!data.canSwitch} onChange={(e) => setUntil(e.target.value)} />
                </Field>
                {data.canSwitch ? (
                  <div className="flex flex-wrap gap-2">
                    {data.on ? (
                      <>
                        <Button variant="success" icon={Power} loading={saving} onClick={() => save(false)}>
                          Switch off maintenance
                        </Button>
                        <Button loading={saving} onClick={() => save(true)}>
                          Update message
                        </Button>
                      </>
                    ) : (
                      <Button variant="danger" icon={Wrench} loading={saving} onClick={() => save(true)}>
                        Switch on maintenance
                      </Button>
                    )}
                  </div>
                ) : (
                  <Alert tone="info">Switching maintenance mode needs the Approve right on Users and Settings (form 001).</Alert>
                )}
              </div>
            </Card>

            <Card title="What users see" subtitle="Preview">
              <div className="tile p-6 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/15 text-amber-500 ring-1 ring-inset ring-amber-500/30">
                  <Wrench className="h-6 w-6" />
                </span>
                <p className="mt-4 font-semibold text-slate-900 dark:text-white">Under maintenance</p>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                  {message || 'Cloud AOS is being updated. Please try again in a little while.'}
                  {until ? ` Expected back: ${until}.` : ''}
                </p>
                <div className="mt-4 flex justify-center">
                  <Badge tone={data.on ? 'warning' : 'neutral'}>{data.on ? 'Showing now' : 'Not showing'}</Badge>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                The legacy system keeps its own switch (App_Data/MainStat.txt). Switch both when the legacy pages must also stop.
              </p>
            </Card>
          </div>
        )
      )}
    </RequireRight>
  );
}
