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
    <div className="flex min-h-screen">
      {/* Brand panel: true black with neon light */}
      <div className="relative m-3 hidden w-[46%] flex-col justify-between overflow-hidden rounded-[2rem] bg-black p-12 text-white ring-1 ring-white/10 lg:flex">
        <div className="absolute -left-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-brand-500/30 blur-[110px]" />
        <div className="absolute -bottom-32 -right-20 h-[24rem] w-[24rem] rounded-full bg-emerald-500/20 blur-[110px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="relative">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-300">Accounting & Operations System</div>
          <div className="mt-4 text-6xl font-semibold tracking-tight">
            Cloud <span className="bg-gradient-to-r from-neon-blue to-neon-green bg-clip-text text-transparent">AOS</span>
          </div>
          <p className="mt-5 max-w-md text-xl font-light leading-relaxed text-slate-300">
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
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/10 backdrop-blur-xl">
                  <I className="h-4 w-4 text-neon-green" />
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
            <div className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Cloud <span className="neon-text">AOS</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">Same data. A modern system.</p>
          </div>

          {!choose ? (
            <form
              className="glass rounded-3xl p-7"
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
            <div className="glass rounded-3xl p-7">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Choose a company</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">You have access to more than one company. Pick the one to open; you can switch later from your user menu.</p>
              <div className="mt-6 grid gap-3">
                {choose.map((c) => (
                  <button key={c.ba} disabled={busy} onClick={() => signIn(c.ba)} className="tile-interactive flex items-center justify-between px-4 py-3.5 text-left">
                    <span className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-brand-600" />
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
              <button className="mt-5 text-sm text-slate-500 hover:text-brand-700" onClick={() => setChoose(null)}>
                ← Use a different account
              </button>
            </div>
          )}

          {info?.mode === 'demo' && info.accounts && !choose && (
            <div className="mt-6 rounded-3xl border border-dashed border-brand-500/40 bg-brand-500/[0.05] p-5 backdrop-blur-xl dark:border-brand-400/30 dark:bg-brand-400/[0.05]">
              <p className="text-sm font-semibold text-brand-900 dark:text-brand-200">Preview with sample data</p>
              <p className="mt-0.5 text-xs text-brand-800/80 dark:text-brand-300/80">
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
                    className="tile-interactive px-3 py-2 text-left text-xs"
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
