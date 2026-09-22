'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ShieldCheck, Lock, AlertTriangle, KeyRound, CheckCircle2, ArrowRight, UserCheck, Sun, Moon } from 'lucide-react';
import { AuthService } from '@/services/AuthService';

export default function LoginPage() {
  const router = useRouter();
  const authService = new AuthService();

  const [selectedTenant, setSelectedTenant] = useState('8100');
  const [username, setUsername] = useState('accountant');
  const [password, setPassword] = useState('Password123!');
  const [appName, setAppName] = useState('AOS100 Web');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [strikesRemaining, setStrikesRemaining] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'auto'>('dark');

  useEffect(() => {
    const savedAppName = localStorage.getItem('aos100_app_name');
    if (savedAppName) setAppName(savedAppName);

    const savedTenant = localStorage.getItem('aos100_tenant');
    if (savedTenant) setSelectedTenant(savedTenant);

    const savedTheme = (localStorage.getItem('aos100_theme_mode') as 'light' | 'dark' | 'auto') || 'dark';
    setThemeMode(savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextTheme);
    localStorage.setItem('aos100_theme_mode', nextTheme);
    const doc = document.documentElement;
    if (nextTheme === 'dark') {
      doc.classList.add('dark');
      doc.style.backgroundColor = '#0F1115';
      doc.style.colorScheme = 'dark';
    } else {
      doc.classList.remove('dark');
      doc.style.backgroundColor = '#F8FAFC';
      doc.style.colorScheme = 'light';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await authService.login(username, password, selectedTenant);
      if (response && response.token) {
        localStorage.setItem('aos100_tenant', selectedTenant);
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setErrorMessage(msg);
      if (msg.includes('strike')) {
        const match = msg.match(/(\d+)\s+strike/i);
        if (match) setStrikesRemaining(parseInt(match[1], 10));
      }
      if (msg.includes('locked')) {
        setIsLocked(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAutofill = (user: string, pass: string, tenant: string) => {
    setUsername(user);
    setPassword(pass);
    setSelectedTenant(tenant);
    setErrorMessage(null);
    setStrikesRemaining(null);
    setIsLocked(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F1115] flex flex-col justify-between text-slate-800 dark:text-slate-100 font-sans antialiased transition-colors duration-200">
      {/* Top Advisory Banner matching legacy SystemAdvisory.txt */}
      <div className="bg-white dark:bg-[#161922] border-b border-slate-200 dark:border-slate-800/80 py-2.5 px-6 text-xs flex items-center justify-between text-slate-700 dark:text-blue-300 transition-colors">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold uppercase tracking-wider text-slate-900 dark:text-blue-200">System Advisory:</span>
          <span className="hidden sm:inline">Enterprise Modernization Active. Fiscal Period September 2026 is currently OPEN.</span>
          <span className="sm:hidden">Sep 2026 Fiscal Period: OPEN</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-slate-400 hidden md:block">TRAIN / CREATE / EOPT Compliance Engine Active</div>
          {/* Quick Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs transition-colors"
            title="Toggle Light/Dark Theme"
          >
            {themeMode === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-500" />}
            <span className="font-medium text-[11px]">{themeMode === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </div>

      {/* Main Login Shell */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white dark:bg-[#161922] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 transition-colors">
          {/* Brand Header matching Dashboard */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-9 rounded-md bg-blue-600 text-white font-black text-sm mb-3 shadow-lg shadow-blue-500/30">
              JCS
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
              {appName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Enterprise Financial Accounting & Multi-Tenant Governance</p>
          </div>

          {/* Security Alert / Strike Warning */}
          {errorMessage && (
            <div className={`p-3.5 mb-5 rounded-lg border text-xs flex items-start space-x-2.5 ${
              isLocked 
                ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-200' 
                : 'bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200'
            }`}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="font-semibold">{isLocked ? 'Security Lockout' : 'Authentication Warning'}</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Business Area / Company Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Business Area / Corporate Entity</span>
                <Building2 className="w-3.5 h-3.5 text-blue-500" />
              </label>
              <select
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0F1115] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
              >
                <option value="8100">8100 — JCS Chemical Industries, Inc.</option>
                <option value="8200">8200 — APF Corporation</option>
                <option value="8300">8300 — Chemag Trading Corporation</option>
              </select>
            </div>

            {/* Username Input */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Username</span>
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter user identifier"
                disabled={isLocked}
                className="w-full bg-slate-50 dark:bg-[#0F1115] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Master Password</span>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={isLocked}
                className="w-full bg-slate-50 dark:bg-[#0F1115] border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-3 rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>Sign In to Financial Operations</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick-Fill Profiles for Review */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2.5">
              Live System Accounts:
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleAutofill('admin', 'Password123!', '8100')}
                className="p-2 bg-slate-50 dark:bg-[#0F1115] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded text-left transition-colors"
              >
                <div className="font-semibold text-blue-600 dark:text-blue-400">Administrator</div>
                <div className="text-slate-500 dark:text-slate-400 text-[10px]">admin • Full Access</div>
              </button>
              <button
                type="button"
                onClick={() => handleAutofill('hr', 'Password123!', '8100')}
                className="p-2 bg-slate-50 dark:bg-[#0F1115] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded text-left transition-colors"
              >
                <div className="font-semibold text-purple-600 dark:text-purple-400">HR & Payroll</div>
                <div className="text-slate-500 dark:text-slate-400 text-[10px]">hr • Payroll Only</div>
              </button>
              <button
                type="button"
                onClick={() => handleAutofill('accountant', 'Password123!', '8100')}
                className="p-2 bg-slate-50 dark:bg-[#0F1115] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded text-left transition-colors"
              >
                <div className="font-semibold text-emerald-600 dark:text-emerald-400">Sr. Accountant</div>
                <div className="text-slate-500 dark:text-slate-400 text-[10px]">accountant • GL & Vouchers</div>
              </button>
              <button
                type="button"
                onClick={() => handleAutofill('cashier', 'Password123!', '8100')}
                className="p-2 bg-slate-50 dark:bg-[#0F1115] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded text-left transition-colors"
              >
                <div className="font-semibold text-amber-600 dark:text-amber-400">Cashier / Treasury</div>
                <div className="text-slate-500 dark:text-slate-400 text-[10px]">cashier • Cashiering & CV</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800/60">
        &copy; 2026 JCS Chemical Industries, Inc. &bull; APF Corp. &bull; Chemag Trading &bull; Philippine Tax Code & BIR CAS Compliant
      </footer>
    </div>
  );
}
