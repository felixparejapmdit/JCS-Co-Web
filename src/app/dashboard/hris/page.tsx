'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  X,
  FileText,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  ChevronRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { Employee201, Department, LeaveRequest, AttendanceRecord } from '@/domain/entities/HRIS';

export default function HrisPage() {
  const [tenantId, setTenantId] = useState('8100');
  const [activeTab, setActiveTab] = useState<'roster' | 'departments' | 'leaves' | 'compliance'>('roster');
  const [loading, setLoading] = useState(true);

  // Data states
  const [employees, setEmployees] = useState<Employee201[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    regularCount: 0,
    probationaryCount: 0,
    contractualCount: 0,
    pendingLeavesCount: 0,
    statutoryComplianceRate: 100,
  });

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Modals & Selected View
  const [selectedEmployee, setSelectedEmployee] = useState<Employee201 | null>(null);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showFileLeaveModal, setShowFileLeaveModal] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Add Employee Form State
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formMiddleName, setFormMiddleName] = useState('');
  const [formGender, setFormGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [formBirthDate, setFormBirthDate] = useState('1994-06-15');
  const [formCivilStatus, setFormCivilStatus] = useState<'SINGLE' | 'MARRIED' | 'WIDOWED' | 'SEPARATED'>('SINGLE');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('+63 917 000 1234');
  const [formAddress, setFormAddress] = useState('');
  const [formEmergencyName, setFormEmergencyName] = useState('');
  const [formEmergencyPhone, setFormEmergencyPhone] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formDepartment, setFormDepartment] = useState('Plant Operations');
  const [formStatus, setFormStatus] = useState<'REGULAR' | 'PROBATIONARY' | 'CONTRACTUAL'>('PROBATIONARY');
  const [formHireDate, setFormHireDate] = useState(new Date().toISOString().slice(0, 10));
  const [formSalary, setFormSalary] = useState(35000);
  const [formAllowance, setFormAllowance] = useState(2000);
  const [formTin, setFormTin] = useState('');
  const [formSss, setFormSss] = useState('');
  const [formPhilHealth, setFormPhilHealth] = useState('');
  const [formPagIbig, setFormPagIbig] = useState('');
  const [formBankName, setFormBankName] = useState('BDO Unibank');
  const [formBankAccount, setFormBankAccount] = useState('');

  // Leave Form State
  const [leaveEmployeeId, setLeaveEmployeeId] = useState('');
  const [leaveType, setLeaveType] = useState<'VACATION' | 'SICK' | 'EMERGENCY' | 'MATERNITY_PATERNITY'>('VACATION');
  const [leaveStartDate, setLeaveStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [leaveEndDate, setLeaveEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [leaveDays, setLeaveDays] = useState(1);
  const [leaveReason, setLeaveReason] = useState('');

  const fetchHrisData = async () => {
    setLoading(true);
    try {
      const tid = localStorage.getItem('aos100_tenant') || '8100';
      setTenantId(tid);
      const res = await fetch('/api/hris', {
        headers: { 'x-tenant-id': tid },
      });
      const json = await res.json();
      if (json.success) {
        setEmployees(json.employees || []);
        setDepartments(json.departments || []);
        setLeaveRequests(json.leaveRequests || []);
        setAttendanceRecords(json.attendanceRecords || []);
        if (json.stats) setStats(json.stats);
        if (json.employees?.length > 0 && !leaveEmployeeId) {
          setLeaveEmployeeId(json.employees[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load HRIS data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHrisData();

    // Listen to zero-flicker corporate entity switch event
    const handleTenantSwitch = () => {
      fetchHrisData();
    };
    window.addEventListener('aos100_tenant_changed', handleTenantSwitch);
    return () => window.removeEventListener('aos100_tenant_changed', handleTenantSwitch);
  }, []);

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDeptFilter === 'ALL' || emp.department === selectedDeptFilter;
    const matchesStatus = selectedStatusFilter === 'ALL' || emp.employmentStatus === selectedStatusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionFeedback(null);
    try {
      const tid = localStorage.getItem('aos100_tenant') || '8100';
      const res = await fetch('/api/hris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tid },
        body: JSON.stringify({
          action: 'CREATE_EMPLOYEE',
          firstName: formFirstName,
          lastName: formLastName,
          middleName: formMiddleName,
          gender: formGender,
          birthDate: formBirthDate,
          civilStatus: formCivilStatus,
          email: formEmail,
          phone: formPhone,
          address: formAddress,
          emergencyContactName: formEmergencyName,
          emergencyContactPhone: formEmergencyPhone,
          position: formPosition,
          department: formDepartment,
          employmentStatus: formStatus,
          hireDate: formHireDate,
          monthlyBasicSalary: formSalary,
          allowanceMonthly: formAllowance,
          tin: formTin,
          sssNumber: formSss,
          philHealthNumber: formPhilHealth,
          pagIbigNumber: formPagIbig,
          bankName: formBankName,
          bankAccountNumber: formBankAccount,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setActionFeedback({ type: 'success', message: 'Employee 201 profile created successfully!' });
        setShowAddEmployeeModal(false);
        fetchHrisData();
      } else {
        setActionFeedback({ type: 'error', message: json.error || 'Failed to create employee.' });
      }
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message });
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionFeedback(null);
    try {
      const tid = localStorage.getItem('aos100_tenant') || '8100';
      const res = await fetch('/api/hris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tid },
        body: JSON.stringify({
          action: 'APPLY_LEAVE',
          employeeId: leaveEmployeeId,
          leaveType,
          startDate: leaveStartDate,
          endDate: leaveEndDate,
          daysCount: leaveDays,
          reason: leaveReason,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setActionFeedback({ type: 'success', message: 'Leave application submitted for approval.' });
        setShowFileLeaveModal(false);
        fetchHrisData();
      } else {
        setActionFeedback({ type: 'error', message: json.error || 'Failed to submit leave.' });
      }
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message });
    }
  };

  const handleReviewLeave = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const tid = localStorage.getItem('aos100_tenant') || '8100';
      const user = localStorage.getItem('aos100_user');
      const reviewerName = user ? JSON.parse(user).name : 'Teresa Lim (HR)';

      const res = await fetch('/api/hris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tid },
        body: JSON.stringify({
          action: 'REVIEW_LEAVE',
          leaveId,
          status,
          reviewerName,
          remarks: status === 'APPROVED' ? 'Approved per leave policy' : 'Insufficient leave credits',
        }),
      });
      const json = await res.json();
      if (json.success) {
        fetchHrisData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Human Resource Information System (HRIS)
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
              BA {tenantId}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Complete 201 File Personnel Master, Department Hierarchy, Statutory Compliance (TIN/SSS/PhilHealth/HDMF), and Leave Administration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFileLeaveModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span>File Leave</span>
          </button>
          <button
            onClick={() => setShowAddEmployeeModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee (201)</span>
          </button>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between animate-in fade-in ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards: Headcount & Compliance */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Headcount */}
        <div className="p-4 rounded-2xl border bg-white dark:bg-[#16161A] border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Headcount</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.totalEmployees}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{stats.regularCount} Regular</span>
            <span>&bull;</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">{stats.probationaryCount} Prob.</span>
          </div>
        </div>

        {/* Departments Count */}
        <div className="p-4 rounded-2xl border bg-white dark:bg-[#16161A] border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Active Departments</span>
            <Building2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {departments.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Plant, Finance, HR, Logistics
          </div>
        </div>

        {/* Pending Leaves */}
        <div className="p-4 rounded-2xl border bg-white dark:bg-[#16161A] border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Pending Leave Requests</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.pendingLeavesCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {stats.pendingLeavesCount > 0 ? 'Requires HR approval' : 'All requests processed'}
          </div>
        </div>

        {/* Statutory Compliance */}
        <div className="p-4 rounded-2xl border bg-white dark:bg-[#16161A] border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>201 Statutory Compliance</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.statutoryComplianceRate}%
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            TIN, SSS, PhilHealth, Pag-IBIG
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'roster'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>201 Employee Directory</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{employees.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'departments'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Departments & Hierarchy</span>
        </button>

        <button
          onClick={() => setActiveTab('leaves')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'leaves'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Leave & Attendance</span>
          {stats.pendingLeavesCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('compliance')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'compliance'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Statutory 201 Audit</span>
        </button>
      </div>

      {/* TAB 1: 201 EMPLOYEE ROSTER */}
      {activeTab === 'roster' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-[#16161A] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by code, employee name, position..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl text-xs border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.code} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl text-xs border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="REGULAR">Regular</option>
                <option value="PROBATIONARY">Probationary</option>
                <option value="CONTRACTUAL">Contractual</option>
              </select>
            </div>
          </div>

          {/* Employee Directory Table */}
          <div className="rounded-2xl border overflow-hidden bg-white dark:bg-[#16161A] border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50/75 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Position & Department</th>
                    <th className="py-3 px-4">Monthly Basic</th>
                    <th className="py-3 px-4">Daily Rate</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Statutory IDs</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-200">
                  {filteredEmployees.map((emp) => {
                    const isComplete = emp.tin && emp.sssNumber && emp.philHealthNumber && emp.pagIbigNumber;
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{emp.lastName}, {emp.firstName}</div>
                          <div className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-medium">
                            {emp.employeeCode}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{emp.position}</div>
                          <div className="text-[11px] text-slate-400">{emp.department}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                          PhP {emp.monthlyBasicSalary?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                          PhP {emp.dailyRate?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              emp.employmentStatus === 'REGULAR'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            }`}
                          >
                            {emp.employmentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {isComplete ? (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Verified (4/4)</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Incomplete</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedEmployee(emp)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 text-blue-600 dark:text-blue-300 transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View 201</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No employees found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEPARTMENTS & ORGANIZATION */}
      {activeTab === 'departments' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((d) => (
              <div
                key={d.code}
                className="p-5 rounded-2xl border bg-white dark:bg-[#16161A] border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {d.code}
                  </span>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    {d.costCenterCode}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{d.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manager: {d.managerName}</p>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Active Staff:</span>{' '}
                    <span className="font-bold text-slate-900 dark:text-white">{d.headcount} Persons</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Budget:</span>{' '}
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">
                      PhP {(d.budgetMonthly / 1000).toFixed(0)}k/mo
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LEAVE & ATTENDANCE */}
      {activeTab === 'leaves' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Pending Leaves Queue */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>Leave Applications & Approval Workflow</span>
            </h3>

            <div className="rounded-2xl border overflow-hidden bg-white dark:bg-[#16161A] border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-50/75 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Leave Type</th>
                      <th className="py-3 px-4">Dates / Duration</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-200">
                    {leaveRequests.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{l.employeeName}</div>
                          <div className="text-[11px] text-slate-400">{l.department}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{l.leaveType}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-mono text-slate-900 dark:text-white">
                            {l.startDate} to {l.endDate}
                          </div>
                          <div className="text-[11px] text-slate-400">{l.daysCount} Day(s)</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                          {l.reason}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              l.status === 'APPROVED'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : l.status === 'PENDING'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 animate-pulse'
                                : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {l.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleReviewLeave(l.id, 'APPROVED')}
                                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReviewLeave(l.id, 'REJECTED')}
                                className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Daily Attendance Logs */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Daily Attendance & Time Card Logs</span>
            </h3>

            <div className="rounded-2xl border overflow-hidden bg-white dark:bg-[#16161A] border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-50/75 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Time In</th>
                      <th className="py-3 px-4">Time Out</th>
                      <th className="py-3 px-4">Tardiness</th>
                      <th className="py-3 px-4">Overtime</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-200">
                    {attendanceRecords.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{att.employeeName}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{att.date}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          {att.timeIn}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-blue-600 dark:text-blue-400">
                          {att.timeOut}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                          {att.tardinessMinutes > 0 ? (
                            <span className="text-rose-500 font-bold">+{att.tardinessMinutes} mins</span>
                          ) : (
                            <span className="text-slate-400">0 mins</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                          {att.overtimeHours > 0 ? (
                            <span className="text-emerald-500 font-bold">+{att.overtimeHours} hrs</span>
                          ) : (
                            <span className="text-slate-400">0 hrs</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              att.status === 'PRESENT'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {att.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STATUTORY COMPLIANCE AUDIT */}
      {activeTab === 'compliance' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Philippine Statutory Compliance Engine</h4>
              <p className="mt-0.5 text-blue-800/80 dark:text-blue-300/80">
                Verifies that all enrolled employees have active, properly formatted statutory accounts required for monthly DOLE, BIR Form 1601-C, SSS R-3, PhilHealth EPRS, and HDMF MCR remittances.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border overflow-hidden bg-white dark:bg-[#16161A] border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50/75 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">BIR TIN (Form 1902)</th>
                    <th className="py-3 px-4">SSS Number</th>
                    <th className="py-3 px-4">PhilHealth ID</th>
                    <th className="py-3 px-4">Pag-IBIG / HDMF</th>
                    <th className="py-3 px-4">Disbursement Bank</th>
                    <th className="py-3 px-4">Audit State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-200">
                  {employees.map((emp) => {
                    const complete = emp.tin && emp.sssNumber && emp.philHealthNumber && emp.pagIbigNumber;
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          <div>{emp.lastName}, {emp.firstName}</div>
                          <div className="text-[11px] font-mono text-slate-400">{emp.employeeCode}</div>
                        </td>
                        <td className="py-3 px-4 font-mono">{emp.tin || <span className="text-rose-500">Missing</span>}</td>
                        <td className="py-3 px-4 font-mono">{emp.sssNumber || <span className="text-rose-500">Missing</span>}</td>
                        <td className="py-3 px-4 font-mono">{emp.philHealthNumber || <span className="text-rose-500">Missing</span>}</td>
                        <td className="py-3 px-4 font-mono">{emp.pagIbigNumber || <span className="text-rose-500">Missing</span>}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{emp.bankName || 'BDO'}</div>
                          <div className="font-mono text-[11px] text-slate-400">{emp.bankAccountNumber || 'N/A'}</div>
                        </td>
                        <td className="py-3 px-4">
                          {complete ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                              PASS
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                              INCOMPLETE
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: VIEW 201 PROFILE */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-base flex items-center justify-center shadow-md">
                  {selectedEmployee.firstName[0]}
                  {selectedEmployee.lastName[0]}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {selectedEmployee.lastName}, {selectedEmployee.firstName} {selectedEmployee.middleName || ''}
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                      {selectedEmployee.employeeCode}
                    </span>
                    <span>&bull;</span>
                    <span>{selectedEmployee.position}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Employment Profile</div>
                <div><span className="text-slate-500">Department:</span> <span className="font-semibold text-slate-900 dark:text-white">{selectedEmployee.department}</span></div>
                <div><span className="text-slate-500">Status:</span> <span className="font-semibold text-emerald-600">{selectedEmployee.employmentStatus}</span></div>
                <div><span className="text-slate-500">Hire Date:</span> <span className="font-mono text-slate-700 dark:text-slate-300">{selectedEmployee.hireDate}</span></div>
                <div><span className="text-slate-500">Monthly Basic:</span> <span className="font-mono font-bold text-slate-900 dark:text-white">PhP {selectedEmployee.monthlyBasicSalary?.toLocaleString()}</span></div>
                <div><span className="text-slate-500">Daily Wage:</span> <span className="font-mono text-slate-700 dark:text-slate-300">PhP {selectedEmployee.dailyRate?.toFixed(2)}</span></div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Statutory & Banking</div>
                <div><span className="text-slate-500">BIR TIN:</span> <span className="font-mono text-slate-900 dark:text-white">{selectedEmployee.tin || 'N/A'}</span></div>
                <div><span className="text-slate-500">SSS No:</span> <span className="font-mono text-slate-900 dark:text-white">{selectedEmployee.sssNumber || 'N/A'}</span></div>
                <div><span className="text-slate-500">PhilHealth:</span> <span className="font-mono text-slate-900 dark:text-white">{selectedEmployee.philHealthNumber || 'N/A'}</span></div>
                <div><span className="text-slate-500">Pag-IBIG:</span> <span className="font-mono text-slate-900 dark:text-white">{selectedEmployee.pagIbigNumber || 'N/A'}</span></div>
                <div><span className="text-slate-500">Bank / Acct:</span> <span className="font-mono text-slate-900 dark:text-white">{selectedEmployee.bankName} - {selectedEmployee.bankAccountNumber || 'N/A'}</span></div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Personal & Contacts</div>
                <div><span className="text-slate-500">Phone:</span> <span className="text-slate-900 dark:text-white">{selectedEmployee.phone || 'N/A'}</span></div>
                <div><span className="text-slate-500">Email:</span> <span className="text-slate-900 dark:text-white">{selectedEmployee.email || 'N/A'}</span></div>
                <div><span className="text-slate-500">Civil Status:</span> <span className="text-slate-900 dark:text-white">{selectedEmployee.civilStatus || 'SINGLE'}</span></div>
                <div><span className="text-slate-500">Address:</span> <span className="text-slate-900 dark:text-white">{selectedEmployee.address || 'N/A'}</span></div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Leave Credits & Emergency</div>
                <div><span className="text-slate-500">Vacation Leave:</span> <span className="font-bold text-blue-600">{selectedEmployee.vacationLeaveCredits || 12} Days</span></div>
                <div><span className="text-slate-500">Sick Leave:</span> <span className="font-bold text-indigo-600">{selectedEmployee.sickLeaveCredits || 10} Days</span></div>
                <div><span className="text-slate-500">Emergency Leave:</span> <span className="font-bold text-amber-600">{selectedEmployee.emergencyLeaveCredits || 3} Days</span></div>
                <div><span className="text-slate-500">Emergency Contact:</span> <span className="text-slate-900 dark:text-white">{selectedEmployee.emergencyContactName || 'N/A'}</span></div>
                <div><span className="text-slate-500">Emergency Phone:</span> <span className="font-mono text-slate-900 dark:text-white">{selectedEmployee.emergencyContactPhone || 'N/A'}</span></div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl text-xs"
              >
                Close 201 File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW EMPLOYEE 201 */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Enrol New Employee (Form 201)</span>
              </h3>
              <button onClick={() => setShowAddEmployeeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={formMiddleName}
                    onChange={(e) => setFormMiddleName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Position / Designation *</label>
                  <input
                    type="text"
                    required
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    placeholder="e.g. Chemist / Maintenance Tech"
                    className="w-full px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Department *</label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    {departments.map((d) => (
                      <option key={d.code} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Employment Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="PROBATIONARY">Probationary</option>
                    <option value="REGULAR">Regular</option>
                    <option value="CONTRACTUAL">Contractual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Monthly Basic Salary (PhP) *</label>
                  <input
                    type="number"
                    required
                    value={formSalary}
                    onChange={(e) => setFormSalary(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Monthly Allowance (PhP)</label>
                  <input
                    type="number"
                    value={formAllowance}
                    onChange={(e) => setFormAllowance(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Philippine Statutory IDs */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="font-bold text-[11px] text-slate-700 dark:text-slate-300">
                  Philippine Statutory Government Identifiers
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-0.5">BIR Tax Identification Number (TIN)</label>
                    <input
                      type="text"
                      placeholder="123-456-789-000"
                      value={formTin}
                      onChange={(e) => setFormTin(e.target.value)}
                      className="w-full px-2.5 py-1 rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-0.5">Social Security System (SSS)</label>
                    <input
                      type="text"
                      placeholder="03-1234567-8"
                      value={formSss}
                      onChange={(e) => setFormSss(e.target.value)}
                      className="w-full px-2.5 py-1 rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-0.5">PhilHealth ID Number</label>
                    <input
                      type="text"
                      placeholder="12-345678901-2"
                      value={formPhilHealth}
                      onChange={(e) => setFormPhilHealth(e.target.value)}
                      className="w-full px-2.5 py-1 rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-0.5">Pag-IBIG / HDMF Number</label>
                    <input
                      type="text"
                      placeholder="1234-5678-9012"
                      value={formPagIbig}
                      onChange={(e) => setFormPagIbig(e.target.value)}
                      className="w-full px-2.5 py-1 rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddEmployeeModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md"
                >
                  Save & Enrol Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: FILE LEAVE */}
      {showFileLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>File Employee Leave Application</span>
              </h3>
              <button onClick={() => setShowFileLeaveModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Select Employee *</label>
                <select
                  value={leaveEmployeeId}
                  onChange={(e) => setLeaveEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.lastName}, {e.firstName} ({e.employeeCode}) — {e.department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Leave Type *</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="VACATION">Vacation Leave (VL)</option>
                    <option value="SICK">Sick Leave (SL)</option>
                    <option value="EMERGENCY">Emergency Leave (EL)</option>
                    <option value="MATERNITY_PATERNITY">Maternity / Paternity</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Number of Days *</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    value={leaveDays}
                    onChange={(e) => setLeaveDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Reason / Purpose</label>
                <textarea
                  rows={2}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="State reason for leave request..."
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFileLeaveModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
