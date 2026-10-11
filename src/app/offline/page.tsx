'use client';

import React from 'react';
import Link from 'next/link';
import { WifiOff, RefreshCw, Home } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b1220] p-4 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-[#1e2a44] bg-[#111a2e] p-8 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300">
          <WifiOff className="h-8 w-8" />
        </div>

        <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">You&apos;re offline</h1>
        <p className="mb-6 text-sm leading-relaxed text-slate-400">
          Cloud AOS can&apos;t reach the server right now. Nothing has been lost: anything you saved is already on the server. Records open again as soon as your connection returns.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-500 active:scale-[0.98]"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#2a3a5c] px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5"
          >
            <Home className="h-4 w-4" />
            Go to Home
          </Link>
        </div>

        <p className="mt-8 border-t border-[#1e2a44] pt-6 text-xs text-slate-500">
          Cloud <span className="font-semibold text-teal-400">AOS</span>
        </p>
      </div>
    </div>
  );
}
