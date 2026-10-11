'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Building2, CheckCircle2, Eye, EyeOff, Lock, ShieldCheck, Smartphone, Zap } from 'lucide-react';
import { ApiError, clearLookups, rpc } from '@/lib/api';
import { Alert, Button, Field, Input } from '@/components/ui/kit';

interface DemoInfo {
  mode: 'demo' | 'mysql';
  accounts?: { username: string; name: string; group: string; companies: number }[];
  password?: string;
}

function SignIn() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [choose, setChoose] = useState<{ ba: string; name: string }[] | null>(null);
  const [info, setInfo] = useState<DemoInfo | null>(null);

  useEffect(() => {
    rpc<DemoInfo>('app.info')
      .then(setInfo)
      .catch(() => setInfo({ mode: 'mysql' }));
  }, []);

  const signIn = async (ba?: string) => {
    setBusy(true);
    setError(null);
    setLocked(false);
    try {
      const res = await rpc<{ choose?: { ba: string; name: string }[]; signedIn?: boolean }>('auth.login', { username, password, ba });
      if (res.choose) {
        setChoose(res.choose);
        return;
      }
      clearLookups();
      router.replace('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      if (e instanceof ApiError && e.extra.locked) setLocked(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f4f6fa] dark:bg-[#0b1220]">
      {/* Brand panel */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-[#0b1f3a] p-12 text-white lg:flex">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-[28rem] w-[28rem] rounded-full border-[48px] border-white/5" />
        <div className="relative">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-300">Accounting & Operations System</div>
          <div className="mt-4 text-5xl font-extrabold tracking-tight">
            Cloud <span className="text-teal-300">AOS</span>
          </div>
          <p className="mt-5 max-w-md text-xl font-light leading-relaxed text-slate-200">
            Same data. Same business rules.
            <br />A modern system built for the next 10 years.
          </p>
        </div>
        <ul className="relative space-y-4 text-sm text-slate-200">
          {[
            [Zap, 'Fast, modern screens with automatic numbering, tax and posting'],
            [Smartphone, 'Works on desktop, tablet and phone'],
            [ShieldCheck, 'Role-based access, approval limits and a full audit trail'],
            [CheckCircle2, 'Your existing database and history, unchanged'],
          ].map(([Icon, text], i) => {
            const I = Icon as typeof Zap;
            return (
              <li key={i} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <I className="h-4 w-4 text-teal-300" />
                </span>
                {text as string}
              </li>
            );
          })}
        </ul>
        <p className="relative text-xs text-slate-400">Modern system on the outside. Your proven data on the inside.</p>
      </div>

      {/* Sign-in */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Cloud <span className="text-teal-600 dark:text-teal-300">AOS</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">Same data. A modern system.</p>
          </div>

          {!choose ? (
            <form
              className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xl dark:border-[#1e2a44] dark:bg-[#111a2e]"
              onSubmit={(e) => {
                e.preventDefault();
                signIn();
              }}
            >
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Sign in</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Use your AOS username and password. Your company opens automatically.</p>
              <div className="mt-6 space-y-4">
                {params.get('expired') && !error && <Alert tone="info">Your session ended. Please sign in again.</Alert>}
                {error && (
                  <Alert tone={locked ? 'danger' : 'warning'} title={locked ? 'Account locked' : undefined}>
                    {error}
                  </Alert>
                )}
                <Field label="Username">
                  <Input autoFocus autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. jdelacruz" className="h-11" />
                </Field>
                <Field label="Password" error={caps ? 'Caps Lock is on.' : undefined}>
                  <div className="relative">
                    <Input
                      type={show ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyUp={(e) => setCaps(e.getModifierState?.('CapsLock') ?? false)}
                      className="h-11 pr-11"
                    />
                    <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-400 hover:text-slate-700" aria-label={show ? 'Hide password' : 'Show password'}>
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
                <Button type="submit" variant="primary" size="lg" className="w-full" loading={busy} disabled={!username || !password}>
                  Sign in <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Lock className="h-3.5 w-3.5" /> Five wrong attempts lock the account until an administrator unlocks it.
                </p>
              </div>
            </form>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xl dark:border-[#1e2a44] dark:bg-[#111a2e]">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Choose a company</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">You have access to more than one company. Pick the one to open; you can switch later from your user menu.</p>
              <div className="mt-6 grid gap-3">
                {choose.map((c) => (
                  <button key={c.ba} disabled={busy} onClick={() => signIn(c.ba)} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3.5 text-left transition-colors hover:border-teal-400 hover:bg-teal-50/60 dark:border-[#2a3a5c] dark:hover:bg-teal-500/10">
                    <span className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-teal-600" />
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{c.name}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </button>
                ))}
              </div>
              {error && (
                <div className="mt-4">
                  <Alert tone="danger">{error}</Alert>
                </div>
              )}
              <button className="mt-5 text-sm text-slate-500 hover:text-teal-700" onClick={() => setChoose(null)}>
                ← Use a different account
              </button>
            </div>
          )}

          {info?.mode === 'demo' && info.accounts && !choose && (
            <div className="mt-6 rounded-2xl border border-dashed border-teal-300 bg-teal-50/60 p-5 dark:border-teal-500/30 dark:bg-teal-500/5">
              <p className="text-sm font-semibold text-teal-900 dark:text-teal-200">Preview with sample data</p>
              <p className="mt-0.5 text-xs text-teal-800/80 dark:text-teal-300/80">
                Pick a role to try. Every sample account uses the password <span className="font-mono font-semibold">{info.password}</span>.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {info.accounts.map((a) => (
                  <button
                    key={a.username}
                    type="button"
                    onClick={() => {
                      setUsername(a.username);
                      setPassword(info.password ?? '');
                      setError(null);
                    }}
                    className="rounded-lg border border-teal-200 bg-white px-3 py-2 text-left text-xs transition-colors hover:border-teal-400 dark:border-teal-500/20 dark:bg-[#111a2e]"
                  >
                    <div className="font-semibold text-slate-800 dark:text-slate-100">{a.group}</div>
                    <div className="text-slate-500">
                      {a.username}
                      {a.companies > 1 ? ` · ${a.companies} companies` : ''}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <SignIn />
    </Suspense>
  );
}
