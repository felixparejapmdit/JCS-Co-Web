'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, ShieldCheck, Lock, Unlock, CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';

interface SafeUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  assignedTenants: string[];
  isLocked: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  lastLogin?: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New user form state
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('SENIOR_ACCOUNTANT');
  const [password, setPassword] = useState('Password123!');
  const [tenants, setTenants] = useState<string[]>(['8100', '8200', '8300']);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json.success && json.users) {
        setUsers(json.users);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUnlock = async (userId: string) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UNLOCK', userId }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({ type: 'success', message: json.message });
        fetchUsers();
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE',
          user: {
            username,
            fullName,
            email,
            role,
            password,
            assignedTenants: tenants,
          },
        }),
      });

      const json = await res.json();
      if (json.success) {
        setFeedback({ type: 'success', message: `User '${username}' created successfully!` });
        setShowModal(false);
        setUsername('');
        setFullName('');
        setEmail('');
        fetchUsers();
      } else {
        setFeedback({ type: 'error', message: json.error || 'Failed to create user.' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message });
    }
  };

  const getRoleBadge = (role: string) => {
    const map: Record<string, { label: string; color: string }> = {
      ADMINISTRATOR: { label: 'Administrator', color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' },
      FINANCE_HEAD: { label: 'Finance Head', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' },
      SENIOR_ACCOUNTANT: { label: 'Sr. Accountant', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' },
      CHECKER: { label: 'Voucher Checker', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
      CASHIER: { label: 'Cashier / Treasury', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
      MATERIALS_SUPERVISOR: { label: 'Materials Lead', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300' },
      HR_PAYROLL_OFFICER: { label: 'HR / Payroll', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' },
    };
    const b = map[role] || { label: role, color: 'bg-slate-100 text-slate-700' };
    return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${b.color}`}>{b.label}</span>;
  };

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-500" />
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                User Management & Identity Administration
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Active directory of operators with multi-tenant company assignments, lockout controls, and roles.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchUsers}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors"
              title="Refresh users"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add System User</span>
            </button>
          </div>
        </div>

        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white dark:bg-[#16161A] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[620px]">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Full Name & Email</th>
                  <th className="py-3 px-4 font-semibold">Assigned Role</th>
                  <th className="py-3 px-4 font-semibold">Allowed Tenants</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {u.username}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{u.fullName}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {getRoleBadge(u.role)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex gap-1">
                        {u.assignedTenants?.map((t) => (
                          <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px] font-bold">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {u.isLocked ? (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">
                          LOCKED (5 Strikes)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {u.isLocked ? (
                        <button
                          onClick={() => handleUnlock(u.id)}
                          className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[10px] flex items-center gap-1 mx-auto"
                        >
                          <Unlock className="w-3 h-3" />
                          <span>Unlock Account</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Normal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Add User */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-[#16161A] rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Create New User</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="py-4 space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. jdoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe, CPA"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="jdoe@jcs.ph"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Role Assignment</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold cursor-pointer"
                  >
                    <option value="ADMINISTRATOR">Administrator (Full Rights)</option>
                    <option value="FINANCE_HEAD">Finance Head (Approver)</option>
                    <option value="SENIOR_ACCOUNTANT">Senior Accountant (Maker)</option>
                    <option value="CHECKER">Voucher Checker (Reviewer)</option>
                    <option value="CASHIER">Cashier / Treasury Officer</option>
                    <option value="MATERIALS_SUPERVISOR">Materials Supervisor</option>
                    <option value="HR_PAYROLL_OFFICER">HR & Payroll Officer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Default Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-md"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
