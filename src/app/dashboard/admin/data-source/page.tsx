'use client';

import React, { useState } from 'react';
import { CircleCheck, CircleX, Database, DatabaseZap, MemoryStick, RefreshCw } from 'lucide-react';
import { forgetSession, rpc, useRpc } from '@/lib/api';
import { RequireRight, useSession } from '@/components/shell/AppShell';
import { Alert, Badge, Button, Card, KeyValue, Modal, PageHeader, Spinner, cx, useToast } from '@/components/ui/kit';
import { fmtDate } from '@/shared/dates';

interface CompanyStatus {
  ba: string;
  name: string;
  database: string;
  reachable: boolean;
  error?: string;
  tables: number;
  approxRows: number;
  users: number;
  sampleLoadedAt: string | null;
  inMemory: boolean;
}

interface Status {
  current: 'memory' | 'mysql';
  mysqlConfigured: boolean;
  mysql: { host: string; port: number; user: string; writesAllowed: boolean } | null;
  sampleLoad: { allowed: boolean; reason?: string };
  companies: CompanyStatus[];
  activeBa: string;
}

interface LoadReport {
  ba: string;
  database: string;
  tables: number;
  rows: number;
  schemaChanges: string[];
}

const when = (iso: string | null) => (iso ? `${fmtDate(iso.slice(0, 10))} ${new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Never');

export default function DataSourcePage() {
  const toast = useToast();
  const { info } = useSession();
  const { data, loading, error, reload } = useRpc<Status>('source.status');
  const [busy, setBusy] = useState<'' | 'memory' | 'mysql' | 'load'>('');
  const [confirmLoad, setConfirmLoad] = useState(false);
  const [report, setReport] = useState<LoadReport[] | null>(null);

  const isAdmin = info.user.group === 'ADMIN';
  const active = data?.companies.find((c) => c.ba === data.activeBa);
  const mysqlReady = Boolean(data?.mysqlConfigured && active?.reachable && active.users > 0);

  const choose = async (source: 'memory' | 'mysql') => {
    setBusy(source);
    try {
      await rpc('source.set', { source });
      forgetSession();
      toast.success(source === 'mysql' ? 'Cloud AOS now uses the MySQL databases.' : 'Cloud AOS now uses the sample data in memory.');
      // Reload the whole app so every screen reads from the new source.
      window.location.href = '/dashboard/admin/data-source';
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      setBusy('');
    }
  };

  const load = async () => {
    setConfirmLoad(false);
    setBusy('load');
    setReport(null);
    try {
      const res = await rpc<{ reports: LoadReport[] }>('source.loadSample');
      setReport(res.reports);
      toast.success(`Sample data loaded into MySQL: ${res.reports.reduce((s, r) => s + r.rows, 0).toLocaleString()} rows in ${res.reports.length} databases.`);
      await reload();
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
        title="Data Source"
        description="Choose where Cloud AOS reads and saves its data on this server: the sample data held in memory, or the MySQL databases."
        actions={
          <Button icon={RefreshCw} onClick={() => reload()} disabled={loading}>
            Check again
          </Button>
        }
      />
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        data && (
          <div className="grid gap-6">
            {!isAdmin && <Alert tone="info">Only the ADMIN group can change the data source.</Alert>}

            <div className="grid gap-6 lg:grid-cols-2">
              <SourceCard
                title="Sample data in memory"
                subtitle="MemoryStore"
                icon={MemoryStick}
                inUse={data.current === 'memory'}
                description="Built on this server from the sample profiles the first time a company is opened. Fast and safe: nothing touches a database, and it starts fresh whenever the server restarts."
                items={[
                  { label: 'Where it lives', value: 'Server memory (RAM)' },
                  { label: 'Kept after restart', value: 'No, rebuilt fresh' },
                  { label: 'Companies in memory now', value: data.companies.filter((c) => c.inMemory).map((c) => c.name).join(', ') || 'None yet' },
                ]}
                action={
                  data.current !== 'memory' &&
                  isAdmin && (
                    <Button variant="primary" icon={MemoryStick} loading={busy === 'memory'} disabled={Boolean(busy)} onClick={() => choose('memory')}>
                      Use the sample data in memory
                    </Button>
                  )
                }
              />

              <SourceCard
                title="MySQL databases"
                subtitle={data.mysql ? `${data.mysql.host}:${data.mysql.port}` : 'Not configured'}
                icon={Database}
                inUse={data.current === 'mysql'}
                description="Reads and saves in the company databases on the MySQL server set in .env: jcs, apf and chemag. Everything you enter is kept."
                items={
                  data.mysql
                    ? [
                        { label: 'Server', value: `${data.mysql.host}:${data.mysql.port}` },
                        { label: 'Signed in as', value: data.mysql.user || '—' },
                        { label: 'Saving', value: data.mysql.writesAllowed ? 'Allowed' : 'Read-only' },
                      ]
                    : [{ label: 'Server', value: 'Set DATABASE_HOST in .env' }]
                }
                action={
                  data.current !== 'mysql' &&
                  isAdmin && (
                    <Button variant="primary" icon={Database} loading={busy === 'mysql'} disabled={Boolean(busy) || !mysqlReady} onClick={() => choose('mysql')}>
                      Use the MySQL databases
                    </Button>
                  )
                }
                note={
                  data.current !== 'mysql' && data.mysqlConfigured && !mysqlReady
                    ? active?.reachable
                      ? `The ${active.database} database has no users yet. Load the sample data below first.`
                      : `MySQL cannot be reached (${active?.error ?? 'unknown error'}).`
                    : undefined
                }
              />
            </div>

            {data.mysqlConfigured && (
              <Card title="Company databases" subtitle="What each MySQL database holds right now" icon={Database}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <th className="py-2 pr-4 font-medium">Company</th>
                        <th className="py-2 pr-4 font-medium">Database</th>
                        <th className="py-2 pr-4 font-medium">Connection</th>
                        <th className="py-2 pr-4 text-right font-medium">Tables</th>
                        <th className="py-2 pr-4 text-right font-medium">Rows (approx.)</th>
                        <th className="py-2 pr-4 text-right font-medium">Users</th>
                        <th className="py-2 font-medium">Sample data loaded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.companies.map((c) => (
                        <tr key={c.ba} className="border-t border-black/[0.06] dark:border-white/[0.06]">
                          <td className="py-2.5 pr-4 font-medium text-slate-900 dark:text-white">
                            {c.name} <span className="text-xs text-slate-500">{c.ba}</span>
                          </td>
                          <td className="py-2.5 pr-4 font-mono text-xs">{c.database}</td>
                          <td className="py-2.5 pr-4">
                            {c.reachable ? (
                              <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                                <CircleCheck className="h-4 w-4" /> Connected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                                <CircleX className="h-4 w-4" /> {c.error}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 pr-4 text-right tabular-nums">{c.tables.toLocaleString()}</td>
                          <td className="py-2.5 pr-4 text-right tabular-nums">{c.approxRows.toLocaleString()}</td>
                          <td className="py-2.5 pr-4 text-right tabular-nums">{c.users.toLocaleString()}</td>
                          <td className="py-2.5">{when(c.sampleLoadedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {data.mysqlConfigured && (
              <Card title="Load the sample data into MySQL" subtitle="The same companies, users and transactions as the sample data in memory" icon={DatabaseZap} tone="amber">
                <div className="grid gap-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Empties every table in <span className="font-mono">jcs</span>, <span className="font-mono">apf</span> and <span className="font-mono">chemag</span>, adds the Cloud AOS tables,
                    then copies the sample data in. The shared <span className="font-mono">bfi</span> and <span className="font-mono">bfi_admin</span> databases are left as they are. Where the schema
                    rebuilt from code cannot hold a value, the column is widened, and every change is listed below.
                  </p>
                  {data.sampleLoad.allowed ? (
                    isAdmin && (
                      <div>
                        <Button variant="danger" icon={DatabaseZap} loading={busy === 'load'} disabled={Boolean(busy)} onClick={() => setConfirmLoad(true)}>
                          {data.companies.some((c) => c.sampleLoadedAt) ? 'Reload the sample data' : 'Load the sample data'}
                        </Button>
                      </div>
                    )
                  ) : (
                    <Alert tone="warning">{data.sampleLoad.reason}</Alert>
                  )}
                  {busy === 'load' && <p className="text-sm text-slate-500">Building and copying the sample data. This takes a little while…</p>}
                  {report && <LoadResult reports={report} />}
                </div>
              </Card>
            )}

            {!data.mysqlConfigured && (
              <Alert tone="info" title="No MySQL server configured">
                This server only has the sample data in memory. To add MySQL, set DATABASE_HOST, DATABASE_USER, DATABASE_PASSWORD and DATABASE_ALLOW_WRITES in .env and restart the app.
              </Alert>
            )}
          </div>
        )
      )}

      <Modal
        open={confirmLoad}
        onClose={() => setConfirmLoad(false)}
        title="Load the sample data into MySQL?"
        description="Everything now in the jcs, apf and chemag databases will be deleted and replaced with the sample data."
        footer={
          <>
            <Button onClick={() => setConfirmLoad(false)}>Cancel</Button>
            <Button variant="danger" icon={DatabaseZap} onClick={load}>
              Delete and load
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Only do this on a local test server. The app refuses on any server other than this computer.
        </p>
      </Modal>
    </RequireRight>
  );
}

function SourceCard({
  title,
  subtitle,
  icon,
  inUse,
  description,
  items,
  action,
  note,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  inUse: boolean;
  description: string;
  items: { label: string; value: React.ReactNode }[];
  action?: React.ReactNode;
  note?: string;
}) {
  return (
    <Card
      title={title}
      subtitle={subtitle}
      icon={icon}
      className={cx(inUse && 'ring-2 ring-brand-500/60')}
      actions={inUse ? <Badge tone="success">In use</Badge> : <Badge tone="neutral">Not in use</Badge>}
    >
      <div className="grid gap-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
        <KeyValue items={items} cols={3} />
        {note && <Alert tone="warning">{note}</Alert>}
        {action && <div>{action}</div>}
      </div>
    </Card>
  );
}

function LoadResult({ reports }: { reports: LoadReport[] }) {
  const changes = reports.flatMap((r) => r.schemaChanges.map((c) => `${r.database}: ${c}`));
  return (
    <div className="grid gap-3">
      <Alert tone="success" title="Sample data loaded">
        {reports.map((r) => `${r.database}: ${r.rows.toLocaleString()} rows in ${r.tables} tables`).join(' · ')}
      </Alert>
      {changes.length > 0 && (
        <details className="tile p-4 text-sm">
          <summary className="cursor-pointer font-medium text-slate-800 dark:text-slate-100">{changes.length} schema adjustments</summary>
          <ul className="mt-3 max-h-72 list-disc overflow-y-auto pl-5 font-mono text-xs text-slate-600 dark:text-slate-300">
            {changes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
