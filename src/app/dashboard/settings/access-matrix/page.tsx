'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Save, CheckCircle2, AlertCircle, RefreshCw, KeyRound, Check, X } from 'lucide-react';
import { AccessMatrixPermissions } from '@/services/TenantDataStore';

const MODULES = [
  { key: 'general_ledger', label: 'General Ledger (Form 052)' },
  { key: 'fiscal_periods', label: 'Fiscal Period Governance' },
  { key: 'accounts_payable', label: 'Accounts Payable (Form 023)' },
  { key: 'check_vouchers', label: 'Check Vouchers (Form 024)' },
  { key: 'cashiering', label: 'Cashiering & Collections (Form 010)' },
  { key: 'materials_management', label: 'Materials & MMRR' },
  { key: 'bir_2307', label: 'BIR Form 2307 & Tax Engine' },
  { key: 'payroll_hris', label: 'Payroll & HRIS' },
  { key: 'financial_statements', label: 'Financial Statements (P&L, BS)' },
  { key: 'settings_management', label: 'System Settings & Data Control' },
];

const ROLES = [
  { key: 'ADMINISTRATOR', label: 'Administrator' },
  { key: 'FINANCE_HEAD', label: 'Finance Head' },
  { key: 'SENIOR_ACCOUNTANT', label: 'Sr. Accountant' },
  { key: 'CHECKER', label: 'Voucher Checker' },
  { key: 'CASHIER', label: 'Cashier / Treasury' },
  { key: 'MATERIALS_SUPERVISOR', label: 'Materials Supervisor' },
  { key: 'HR_PAYROLL_OFFICER', label: 'HR & Payroll' },
];

export default function AccessMatrixPage() {
  const [matrix, setMatrix] = useState<Record<string, Record<string, AccessMatrixPermissions>>>({});
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState('SENIOR_ACCOUNTANT');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/access-matrix');
      const json = await res.json();
      if (json.success && json.accessMatrix) {
        setMatrix(json.accessMatrix);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, []);

  const handleTogglePermission = (moduleKey: string, perm: keyof AccessMatrixPermissions) => {
    setMatrix((prev) => {
      const roleObj = prev[selectedRole] || {};
      const modObj = roleObj[moduleKey] || { view: false, insert: false, edit: false, delete: false, approve: false };
      return {
        ...prev,
        [selectedRole]: {
          ...roleObj,
          [moduleKey]: {
            ...modObj,
            [perm]: !modObj[perm],
          },
        },
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/settings/access-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessMatrix: matrix }),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const rolePerms = matrix[selectedRole] || {};

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-blue-500" />
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Role-Based Access Control Matrix (RBAC)
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Segregation of Duties (SoD) permission matrix mapping legacy `sys_usergrouprights` to modern ERP HTTP verbs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const roleObj = ROLES.find((r) => r.key === selectedRole);
                if (roleObj) {
                  const testUser = {
                    id: `usr-${selectedRole.toLowerCase()}`,
                    username: selectedRole.toLowerCase(),
                    fullName: `${roleObj.label} Test Operator`,
                    role: selectedRole,
                    email: `${selectedRole.toLowerCase()}@jcs.ph`,
                    tenantId: '8100',
                    tenantName: '8100 — JCS Chemical Industries, Inc.',
                  };
                  localStorage.setItem('aos100_user', JSON.stringify(testUser));
                  window.location.reload();
                }
              }}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-all flex items-center gap-1.5"
              title="Switch session persona to this role to preview sidebar immediately"
            >
              <span>Test Role Preview</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving Matrix...' : 'Save Permissions'}</span>
            </button>
          </div>
        </div>

        {saved && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Access control matrix updated and enforced across all sessions.</span>
          </div>
        )}

        {/* Role Selector Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {ROLES.map((r) => (
            <button
              key={r.key}
              onClick={() => setSelectedRole(r.key)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedRole === r.key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Permission Table */}
        <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Policy:</span>
              <span className="ml-2 font-bold text-sm text-slate-900 dark:text-white">
                {ROLES.find((r) => r.key === selectedRole)?.label} Permissions
              </span>
            </div>
            <span className="text-xs text-slate-500">10 Functional Modules Governed</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">ERP System Module</th>
                  <th className="py-3 px-4 font-semibold text-center">View / Read</th>
                  <th className="py-3 px-4 font-semibold text-center">Insert / Create</th>
                  <th className="py-3 px-4 font-semibold text-center">Edit / Modify</th>
                  <th className="py-3 px-4 font-semibold text-center">Delete / Void</th>
                  <th className="py-3 px-4 font-semibold text-center">Approve / Post</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {MODULES.map((m) => {
                  const p = rolePerms[m.key] || { view: false, insert: false, edit: false, delete: false, approve: false };
                  return (
                    <tr key={m.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {m.label}
                      </td>

                      {/* View */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(m.key, 'view')}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                            p.view
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          {p.view ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        </button>
                      </td>

                      {/* Insert */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(m.key, 'insert')}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                            p.insert
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          {p.insert ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        </button>
                      </td>

                      {/* Edit */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(m.key, 'edit')}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                            p.edit
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          {p.edit ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        </button>
                      </td>

                      {/* Delete */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(m.key, 'delete')}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                            p.delete
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          {p.delete ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        </button>
                      </td>

                      {/* Approve */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(m.key, 'approve')}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                            p.approve
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          {p.approve ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
