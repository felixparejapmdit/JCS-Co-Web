'use client';

import React, { useState } from 'react';
import { Copy, KeyRound, Plus, ShieldOff } from 'lucide-react';
import { rpc, useRpc } from '@/lib/api';
import { RequireRight, useSession } from '@/components/shell/AppShell';
import { Alert, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, Spinner, useToast } from '@/components/ui/kit';
import { fmtDate } from '@/shared/dates';

interface KeyRow {
  id: string;
  name: string;
  prefix: string;
  ug_code: string;
  created_by: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

interface Data {
  keys: KeyRow[];
  groups: { code: string; name: string }[];
}

const day = (s: string | null) => (s ? fmtDate(s.slice(0, 10)) : 'Never');

export default function ApiKeysPage() {
  const toast = useToast();
  const { info } = useSession();
  const { data, loading, error, reload } = useRpc<Data>('apikeys.list');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [group, setGroup] = useState('AUDIT');
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState<{ key: string; name: string } | null>(null);

  const isAdmin = info.user.group === 'ADMIN';

  const create = async () => {
    setBusy(true);
    try {
      const res = await rpc<{ key: string; record: KeyRow }>('apikeys.create', { name, group });
      setCreating(false);
      setName('');
      setShown({ key: res.key, name: res.record.name });
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (k: KeyRow) => {
    if (!confirm(`Revoke "${k.name}"? Programs using this key will stop working at once.`)) return;
    try {
      toast.success(await rpc<string>('apikeys.revoke', { id: k.id }));
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <RequireRight form="001">
      <PageHeader
        eyebrow="Administration"
        title="API Keys"
        description="Let another system read this company's data through the public API (/api/v1): head-office reports, a BI tool, a bank or BIR integration. Each key reads only what its user group may see."
        actions={
          isAdmin && (
            <Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>
              New API key
            </Button>
          )
        }
      />
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        data && (
          <div className="grid gap-6">
            <Card title="Keys" subtitle="Only the first characters are kept on screen; the full key is shown once, when it is created." icon={KeyRound} padded={false}>
              {data.keys.length === 0 ? (
                <EmptyState icon={KeyRound} title="No API keys yet" text="Create one when another system needs to read data from Cloud AOS." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <th className="px-5 py-2 font-medium">Name</th>
                        <th className="px-3 py-2 font-medium">Key</th>
                        <th className="px-3 py-2 font-medium">Rights of</th>
                        <th className="px-3 py-2 font-medium">Created</th>
                        <th className="px-3 py-2 font-medium">Last used</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-5 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {data.keys.map((k) => (
                        <tr key={k.id} className="border-t border-black/[0.06] dark:border-white/[0.06]">
                          <td className="px-5 py-2.5 font-medium text-slate-900 dark:text-white">{k.name}</td>
                          <td className="px-3 py-2.5 font-mono text-xs">{k.prefix}…</td>
                          <td className="px-3 py-2.5">{data.groups.find((x) => x.code === k.ug_code)?.name ?? k.ug_code}</td>
                          <td className="px-3 py-2.5">
                            {day(k.created_at)} <span className="text-xs text-slate-500">by {k.created_by}</span>
                          </td>
                          <td className="px-3 py-2.5">{day(k.last_used_at)}</td>
                          <td className="px-3 py-2.5">{k.revoked_at ? <Badge tone="neutral">Revoked</Badge> : <Badge tone="success">Active</Badge>}</td>
                          <td className="px-5 py-2.5 text-right">
                            {isAdmin && !k.revoked_at && (
                              <Button size="sm" variant="ghost" icon={ShieldOff} onClick={() => revoke(k)}>
                                Revoke
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card title="How another system reads data" subtitle="Full reference: docs/API.md in the project">
              <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-300">
                <p>Send the key in the Authorization header. Every list is paged (?limit and ?cursor); answers are JSON.</p>
                <pre className="tile overflow-x-auto p-4 font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-200">{`curl -H "Authorization: Bearer caos_8300_…" ${origin}/api/v1/customers?limit=50
curl -H "Authorization: Bearer caos_8300_…" "${origin}/api/v1/documents/si?from=2026-10-01&to=2026-10-31"
curl -H "Authorization: Bearer caos_8300_…" ${origin}/api/v1/reports/trial-balance?as_of=2026-10-31`}</pre>
                <p>Version 1 is read-only. Up to 300 requests a minute per key.</p>
              </div>
            </Card>
          </div>
        )
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="New API key"
        description="The key will read data with the rights of the group you choose. Internal Audit is a good default: it can see, but not change."
        footer={
          <>
            <Button onClick={() => setCreating(false)}>Cancel</Button>
            <Button variant="primary" icon={KeyRound} loading={busy} disabled={!name.trim()} onClick={create}>
              Create key
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Field label="Name" hint="Who uses it, e.g. JCS head office reports">
            <Input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="JCS head office reports" />
          </Field>
          <Field label="Rights of user group">
            <Select value={group} onChange={(e) => setGroup(e.target.value)} options={(data?.groups ?? []).map((g) => ({ value: g.code, label: g.name }))} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={Boolean(shown)}
        onClose={() => setShown(null)}
        title="Copy the key now"
        description={`This is the only time the key for "${shown?.name ?? ''}" is shown. Store it safely; if it is lost, revoke it and create a new one.`}
        footer={<Button variant="primary" onClick={() => setShown(null)}>I have stored it</Button>}
      >
        <div className="grid gap-3">
          <code className="tile block break-all p-4 font-mono text-sm text-slate-900 dark:text-white">{shown?.key}</code>
          <div>
            <Button
              icon={Copy}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(shown?.key ?? '');
                  toast.success('Key copied.');
                } catch {
                  toast.error('Copy it by hand: the browser did not allow copying.');
                }
              }}
            >
              Copy key
            </Button>
          </div>
        </div>
      </Modal>
    </RequireRight>
  );
}
