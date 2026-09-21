'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, Save, CheckCircle2, AlertCircle, Building2, Globe, ShieldCheck } from 'lucide-react';

export default function GeneralSettingsPage() {
  const [appName, setAppName] = useState('AOS100 Web');
  const [tagline, setTagline] = useState('Enterprise Financial Accounting & Multi-Tenant Governance');
  const [defaultCurrency, setDefaultCurrency] = useState('PHP');
  const [defaultVatRate, setDefaultVatRate] = useState(12);
  const [defaultEwtRate, setDefaultEwtRate] = useState(1);
  const [fiscalYear, setFiscalYear] = useState(2026);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings/app');
        const json = await res.json();
        if (json.success && json.settings) {
          setAppName(json.settings.appName || 'AOS100 Web');
          setTagline(json.settings.tagline || '');
          setDefaultCurrency(json.settings.defaultCurrency || 'PHP');
          setDefaultVatRate((json.settings.defaultVatRate || 0.12) * 100);
          setDefaultEwtRate((json.settings.defaultEwtRate || 0.01) * 100);
          setFiscalYear(json.settings.currentFiscalYear || 2026);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch('/api/settings/app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName,
          tagline,
          defaultCurrency,
          defaultVatRate: defaultVatRate / 100,
          defaultEwtRate: defaultEwtRate / 100,
          currentFiscalYear: fiscalYear,
        }),
      });

      const json = await res.json();
      if (json.success) {
        localStorage.setItem('aos100_app_name', appName);
        setSaved(true);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              General Settings & Application Branding
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure system-wide identity, corporate branding, default tax percentages, and fiscal year parameters.
          </p>
        </div>

        {saved && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully! Branding updated in header, sidebar, and login page.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          {/* Section 1: Branding */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" />
              Application Identity & Upper Branding
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Application Name (Visible in Sidebar & Login)
                </label>
                <input
                  type="text"
                  required
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="e.g. AOS100 Web or JCS ERP"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  This custom title appears in the top-left sidebar header and on the login page.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Corporate Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Enterprise Financial Accounting"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Financial Defaults */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-500" />
              Philippine Tax & Financial Standards
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Default Currency
                </label>
                <input
                  type="text"
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Standard Input/Output VAT (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={defaultVatRate}
                  onChange={(e) => setDefaultVatRate(parseFloat(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Default Goods EWT (WC160 %)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={defaultEwtRate}
                  onChange={(e) => setDefaultEwtRate(parseFloat(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Applying Changes...' : 'Save Branding & Configurations'}</span>
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
