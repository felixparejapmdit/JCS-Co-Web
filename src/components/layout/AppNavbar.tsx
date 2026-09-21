'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  CalendarCheck2,
  BookOpen,
  Users,
  Briefcase,
  Landmark,
  FileSpreadsheet,
  Layers,
  Scale,
  LogOut,
  UserCheck
} from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
}

const TENANTS: Tenant[] = [
  { id: '8100', name: '8100 — JCS Chemical Industries, Inc.' },
  { id: '8200', name: '8200 — APF Corporation' },
  { id: '8300', name: '8300 — Chemag Trading Corporation' },
];

export function AppNavbar() {
  const pathname = usePathname();
  const [selectedTenant, setSelectedTenant] = useState('8100');
  const [userRole, setUserRole] = useState<'FINANCE_HEAD' | 'ACCOUNTANT'>('FINANCE_HEAD');

  useEffect(() => {
    const savedTenant = localStorage.getItem('aos100_tenant') || '8100';
    setSelectedTenant(savedTenant);
    const savedRole = localStorage.getItem('aos100_role') || 'FINANCE_HEAD';
    setUserRole(savedRole as any);
  }, []);

  const handleTenantChange = (tid: string) => {
    setSelectedTenant(tid);
    localStorage.setItem('aos100_tenant', tid);
    window.location.reload();
  };

  const togglePersona = () => {
    const nextRole = userRole === 'FINANCE_HEAD' ? 'ACCOUNTANT' : 'FINANCE_HEAD';
    setUserRole(nextRole);
    localStorage.setItem('aos100_role', nextRole);
    localStorage.setItem('aos100_user', nextRole === 'FINANCE_HEAD' ? 'Maria Santos, CPA' : 'Juan Dela Cruz');
    window.location.reload();
  };

  const navLinks = [
    { label: 'Overview', href: '/dashboard', icon: Layers },
    { label: 'Chart of Accounts', href: '/dashboard/masterfiles/accounts', icon: BookOpen },
    { label: 'Vendors', href: '/dashboard/masterfiles/vendors', icon: Briefcase },
    { label: 'Customers', href: '/dashboard/masterfiles/customers', icon: Users },
    { label: 'Banks & Cheques', href: '/dashboard/masterfiles/banks', icon: Landmark },
    { label: 'Maker-Checker JVs', href: '/dashboard/gl/vouchers', icon: FileSpreadsheet },
    { label: 'Fiscal Periods', href: '/dashboard/gl/fiscal-periods', icon: CalendarCheck2 },
    { label: 'General Ledger', href: '/dashboard/gl/ledger', icon: Scale },
  ];

  return (
    <header className="bg-[#0A0F1D] border-b border-slate-800 sticky top-0 z-50">
      {/* Top Bar: Brand, Tenant Selector, Fiscal Pill & Persona */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
              A
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight">AOS100 <span className="text-blue-400">NextGen</span></span>
              <span className="ml-2 px-1.5 py-0.5 text-[10px] uppercase font-mono font-bold bg-blue-900/60 text-blue-300 rounded border border-blue-700/50">
                Full-Stack TS
              </span>
            </div>
          </Link>
        </div>

        {/* Corporate Entity Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-1.5 shadow-inner">
            <Building2 className="w-4 h-4 text-amber-400" />
            <select
              value={selectedTenant}
              onChange={(e) => handleTenantChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
            >
              {TENANTS.map((t) => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-slate-100">
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Fiscal Period Badge */}
          <div className="hidden sm:flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/60 rounded-lg px-3 py-1.5 text-xs text-emerald-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Period: Sep 2026 (OPEN)</span>
          </div>

          {/* User Persona Switcher (Maker vs Checker) */}
          <button
            onClick={togglePersona}
            title="Click to switch role between Accountant (Maker) and Finance Head (Approver)"
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-medium">
              {userRole === 'FINANCE_HEAD' ? 'Maria Santos, CPA (Approver)' : 'Juan Dela Cruz (Maker)'}
            </span>
            <span className="px-1 py-0.5 text-[9px] bg-slate-900 text-slate-400 rounded font-mono uppercase">
              Switch
            </span>
          </button>

          <Link
            href="/"
            className="text-slate-400 hover:text-rose-400 transition-colors p-1.5"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Nav Menu Tabs */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-thin">
        <div className="flex space-x-1 py-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
