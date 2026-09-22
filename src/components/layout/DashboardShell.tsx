'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building,
  FileSpreadsheet,
  Receipt,
  Boxes,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
  Building2,
  Calendar,
  LogOut,
  Sliders,
  Database,
  Users,
  ShieldAlert,
  Moon,
  Sun,
  UserCheck,
  CheckCircle2,
  X,
  ExternalLink,
  DollarSign,
  Sparkles,
  Bookmark,
  Home,
  Menu,
  Check,
  Star,
  Plus,
  HelpCircle,
  Folder,
  User,
  SlidersHorizontal,
  LayoutGrid,
  Scale,
  Landmark,
  TrendingUp,
  Clock,
  BookOpen,
  Briefcase,
  ShieldCheck,
} from 'lucide-react';
import { AccessMatrixPermissions } from '@/services/TenantDataStore';

interface DashboardShellProps {
  children: React.ReactNode;
  breadcrumb?: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  href: string;
  isRead: boolean;
  type: 'voucher' | 'period' | 'cheque' | 'payroll';
}

const TEST_PERSONAS = [
  {
    username: 'admin',
    fullName: 'System Administrator',
    role: 'ADMINISTRATOR',
    label: 'Administrator (Full Access)',
    initials: 'AD',
    email: 'admin@jcs.ph',
    desc: 'Unrestricted access to all modules & settings',
  },
  {
    username: 'hr',
    fullName: 'Teresa Lim',
    role: 'HR_PAYROLL_OFFICER',
    label: 'HR & Payroll Officer',
    initials: 'TL',
    email: 'tlim@jcs.ph',
    desc: 'Payroll & HRIS module only',
  },
  {
    username: 'accountant',
    fullName: 'Juan Dela Cruz',
    role: 'SENIOR_ACCOUNTANT',
    label: 'Senior Accountant',
    initials: 'JC',
    email: 'jdelacruz@jcs.ph',
    desc: 'General Ledger, Vouchers, Reports, Cashiering',
  },
  {
    username: 'cashier',
    fullName: 'Elena Reyes',
    role: 'CASHIER',
    label: 'Cashier / Treasury',
    initials: 'ER',
    email: 'ereyes@jcs.ph',
    desc: 'Cashiering & Check Voucher release',
  },
  {
    username: 'checker',
    fullName: 'Roberto Tan',
    role: 'CHECKER',
    label: 'Voucher Checker',
    initials: 'RT',
    email: 'rtan@jcs.ph',
    desc: 'Audit review & approval permissions',
  },
  {
    username: 'warehouse',
    fullName: 'Carlos Reyes',
    role: 'MATERIALS_SUPERVISOR',
    label: 'Materials Supervisor',
    initials: 'CR',
    email: 'creyes@jcs.ph',
    desc: 'Materials & MMRR module only',
  },
];

const TENANT_NAMES: Record<string, string> = {
  '8100': '8100 — JCS Chemical Industries, Inc.',
  '8200': '8200 — APF Corporation',
  '8300': '8300 — Chemag Trading Corporation',
};

const TENANT_SHORT: Record<string, string> = {
  '8100': 'JCS Chemical',
  '8200': 'APF Corporation',
  '8300': 'Chemag Trading',
};

const BREADCRUMB_MAP: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/gl/accounts': 'General Ledger > Chart of Accounts',
  '/dashboard/gl/vouchers': 'General Ledger > Journal Vouchers (Form 052)',
  '/dashboard/gl/ledger': 'General Ledger > General Ledger & Trial Balance',
  '/dashboard/gl/fiscal-periods': 'General Ledger > Fiscal Periods',
  '/dashboard/vouchers/payables': 'Vouchers > Accounts Payable',
  '/dashboard/vouchers/cheques': 'Vouchers > Check Vouchers & Cheque Printing',
  '/dashboard/cashiering': 'Cashiering > Daily Cash & Receipts',
  '/dashboard/materials': 'Materials > Inventory & Stock Cards',
  '/dashboard/hris': 'Human Resources > Employee Directory & 201 Records',
  '/dashboard/payroll': 'Payroll > Semi-Monthly Computation & Vouchers',
  '/dashboard/reports/aging': 'Reports > AP & AR Aging',
  '/dashboard/reports/bir2307': 'Reports > BIR Form 2307',
  '/dashboard/reports/financial-statements': 'Reports > Financial Statements',
  '/dashboard/settings/general': 'Settings > General & Branding',
  '/dashboard/settings/data': 'Settings > Data Management',
  '/dashboard/settings/users': 'Settings > User Management',
  '/dashboard/settings/access-matrix': 'Settings > Access Control Matrix',
  '/dashboard/settings/migration': 'Settings > Legacy MySQL Migration & Cutover',
  '/dashboard/masterfiles/accounts': 'Settings > Chart of Accounts',
  '/dashboard/masterfiles/vendors': 'Settings > Vendors',
  '/dashboard/masterfiles/customers': 'Settings > Customers',
  '/dashboard/masterfiles/banks': 'Settings > Banks & Cheque Calibration',
};

// Complete Mobile Modules Definition matching Image 2 Terminal Navigation & Tools
interface MobileModuleItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  category: 'finance' | 'operations' | 'hris' | 'reports' | 'admin';
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

const ALL_MOBILE_MODULES: MobileModuleItem[] = [
  // Finance & GL
  {
    id: 'gl_ledger',
    title: 'General Ledger',
    subtitle: 'Trial Balance & Financial Postings',
    href: '/dashboard/gl/ledger',
    category: 'finance',
    icon: Scale,
    iconBg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    iconColor: 'text-cyan-500 dark:text-cyan-400',
  },
  {
    id: 'gl_vouchers',
    title: 'Journal Vouchers',
    subtitle: 'Maker-Checker JV Approval Workflow',
    href: '/dashboard/gl/vouchers',
    category: 'finance',
    icon: FileSpreadsheet,
    iconBg: 'bg-blue-500/10 dark:bg-blue-500/20',
    iconColor: 'text-blue-500 dark:text-blue-400',
  },
  {
    id: 'ap_vouchers',
    title: 'Accounts Payable',
    subtitle: 'Form 023 & Vendor Vouchers',
    href: '/dashboard/vouchers/payables',
    category: 'finance',
    icon: FileText,
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    iconColor: 'text-amber-500 dark:text-amber-400',
  },
  {
    id: 'cv_cheques',
    title: 'Check Vouchers',
    subtitle: 'Disbursements & Cheque Print',
    href: '/dashboard/vouchers/cheques',
    category: 'finance',
    icon: Landmark,
    iconBg: 'bg-orange-500/10 dark:bg-orange-500/20',
    iconColor: 'text-orange-500 dark:text-orange-400',
  },
  {
    id: 'fiscal_periods',
    title: 'Fiscal Periods',
    subtitle: 'Monthly & Annual Hard/Soft Close',
    href: '/dashboard/gl/fiscal-periods',
    category: 'finance',
    icon: Calendar,
    iconBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    iconColor: 'text-indigo-500 dark:text-indigo-400',
  },
  // Operations & Treasury
  {
    id: 'cashiering',
    title: 'Cashiering & OR',
    subtitle: 'Official Receipts & Collections',
    href: '/dashboard/cashiering',
    category: 'operations',
    icon: Receipt,
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
  },
  {
    id: 'materials',
    title: 'Materials (MMRR)',
    subtitle: 'Purchase Orders & 3-Way Match',
    href: '/dashboard/materials',
    category: 'operations',
    icon: Boxes,
    iconBg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    iconColor: 'text-cyan-500 dark:text-cyan-400',
  },
  // HR & Payroll
  {
    id: 'hris',
    title: 'Human Resources',
    subtitle: '201 Files, Org Chart & Leaves',
    href: '/dashboard/hris',
    category: 'hris',
    icon: Users,
    iconBg: 'bg-purple-500/10 dark:bg-purple-500/20',
    iconColor: 'text-purple-500 dark:text-purple-400',
  },
  {
    id: 'payroll',
    title: 'Payroll Engine',
    subtitle: '2026 SSS, PhilHealth & TRAIN',
    href: '/dashboard/payroll',
    category: 'hris',
    icon: DollarSign,
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
  },
  // Reports
  {
    id: 'fin_reports',
    title: 'Financial Reports',
    subtitle: 'Balance Sheet & Income Statement',
    href: '/dashboard/reports/financial-statements',
    category: 'reports',
    icon: TrendingUp,
    iconBg: 'bg-purple-500/10 dark:bg-purple-500/20',
    iconColor: 'text-purple-500 dark:text-purple-400',
  },
  {
    id: 'bir_2307',
    title: 'BIR Form 2307',
    subtitle: 'Withholding Tax Certificates',
    href: '/dashboard/reports/bir2307',
    category: 'reports',
    icon: FileText,
    iconBg: 'bg-violet-500/10 dark:bg-violet-500/20',
    iconColor: 'text-violet-500 dark:text-violet-400',
  },
  {
    id: 'aging_reports',
    title: 'Aging Schedules',
    subtitle: '30/60/90+ Day Delinquency & Aging',
    href: '/dashboard/reports/aging',
    category: 'reports',
    icon: Clock,
    iconBg: 'bg-rose-500/10 dark:bg-rose-500/20',
    iconColor: 'text-rose-500 dark:text-rose-400',
  },
  // Admin & Masterfiles
  {
    id: 'coa',
    title: 'Chart of Accounts',
    subtitle: 'Master Account Hierarchy',
    href: '/dashboard/masterfiles/accounts',
    category: 'admin',
    icon: BookOpen,
    iconBg: 'bg-blue-500/10 dark:bg-blue-500/20',
    iconColor: 'text-blue-500 dark:text-blue-400',
  },
  {
    id: 'banks',
    title: 'Banks & Checkbooks',
    subtitle: 'Company Bank Accounts & Ledgers',
    href: '/dashboard/masterfiles/banks',
    category: 'admin',
    icon: Landmark,
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    iconColor: 'text-amber-500 dark:text-amber-400',
  },
  {
    id: 'customers',
    title: 'Customers Directory',
    subtitle: 'Debtors, Terms & Credit Limits',
    href: '/dashboard/masterfiles/customers',
    category: 'admin',
    icon: Building2,
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
  },
  {
    id: 'vendors',
    title: 'Vendors Directory',
    subtitle: 'Creditors, TIN & Payment Terms',
    href: '/dashboard/masterfiles/vendors',
    category: 'admin',
    icon: Briefcase,
    iconBg: 'bg-orange-500/10 dark:bg-orange-500/20',
    iconColor: 'text-orange-500 dark:text-orange-400',
  },
  {
    id: 'users',
    title: 'User Management',
    subtitle: 'Accounts, Tenancy & Passwords',
    href: '/dashboard/settings/users',
    category: 'admin',
    icon: ShieldCheck,
    iconBg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    iconColor: 'text-cyan-500 dark:text-cyan-400',
  },
  {
    id: 'access_matrix',
    title: 'RBAC Access Matrix',
    subtitle: 'Granular Role Permissions & SoD',
    href: '/dashboard/settings/access-matrix',
    category: 'admin',
    icon: Sliders,
    iconBg: 'bg-purple-500/10 dark:bg-purple-500/20',
    iconColor: 'text-purple-500 dark:text-purple-400',
  },
  {
    id: 'audit_trail',
    title: 'Audit Trail Logs',
    subtitle: 'Immutable System Activity Logs',
    href: '/dashboard/settings/data',
    category: 'admin',
    icon: Database,
    iconBg: 'bg-rose-500/10 dark:bg-rose-500/20',
    iconColor: 'text-rose-500 dark:text-rose-400',
  },
  {
    id: 'settings_gen',
    title: 'System Settings',
    subtitle: 'Currencies, Tax Rates & Setup',
    href: '/dashboard/settings/general',
    category: 'admin',
    icon: Settings,
    iconBg: 'bg-slate-500/10 dark:bg-slate-500/20',
    iconColor: 'text-slate-500 dark:text-slate-400',
  },
];

export function DashboardShell({ children, breadcrumb = 'Dashboard' }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const activeBreadcrumb = breadcrumb !== 'Dashboard' ? breadcrumb : (BREADCRUMB_MAP[pathname] || 'Dashboard');

  // Theme Mode: 'light' | 'dark' | 'auto' with synchronous client initialization (default: 'dark')
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'auto'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('aos100_theme_mode') as 'light' | 'dark' | 'auto') || 'dark';
    }
    return 'dark';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const mode = localStorage.getItem('aos100_theme_mode') || 'dark';
      if (mode === 'light') return 'light';
      if (mode === 'auto') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'dark';
    }
    return 'dark';
  });

  const [selectedTenant, setSelectedTenant] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('aos100_tenant') || '8100';
    }
    return '8100';
  });

  const [appName, setAppName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('aos100_app_name') || 'AOS100 Web';
    }
    return 'AOS100 Web';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedUserStr = localStorage.getItem('aos100_user');
      if (savedUserStr) {
        try {
          const u = JSON.parse(savedUserStr);
          const name = u.fullName || u.username || 'System Administrator';
          const parts = name.split(' ');
          const initials = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 2).toUpperCase();
          return {
            username: u.username || 'admin',
            name,
            role: u.role || 'ADMINISTRATOR',
            initials,
            email: u.email || `${u.username || 'admin'}@jcs.ph`,
          };
        } catch (e) {
          console.error(e);
        }
      }
    }
    return {
      username: 'admin',
      name: 'System Administrator',
      role: 'ADMINISTRATOR',
      initials: 'AD',
      email: 'admin@jcs.ph',
    };
  });

  // Mobile Drawer State
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Mobile "More" Sheet Modal State (per Image 2 specs)
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [moreCategory, setMoreCategory] = useState<'all' | 'finance' | 'operations' | 'hris' | 'reports' | 'admin'>('all');

  // Accordion Dropdown States (Pre-opened matching current pathname so there is ZERO jump on route change)
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>(() => ({
    settings: Boolean(pathname?.startsWith('/dashboard/settings') || pathname?.startsWith('/dashboard/masterfiles')),
    gl: Boolean(pathname?.startsWith('/dashboard/gl')),
    vouchers: Boolean(pathname?.startsWith('/dashboard/vouchers')),
    reports: Boolean(pathname?.startsWith('/dashboard/reports')),
  }));

  const [sidebarSearch, setSidebarSearch] = useState('');

  // Dropdown States
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showCompanySwitcher, setShowCompanySwitcher] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Dynamic Access Matrix from backend
  const [accessMatrix, setAccessMatrix] = useState<Record<string, Record<string, AccessMatrixPermissions>>>({});
  const [matrixLoaded, setMatrixLoaded] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n1',
      title: 'Voucher Awaiting Approval',
      message: 'JV-2026-8100-002 (PhP 380,000) awaits Checker review.',
      time: '10m ago',
      href: '/dashboard/gl/vouchers',
      isRead: false,
      type: 'voucher',
    },
    {
      id: 'n2',
      title: 'Fiscal Period Active',
      message: 'Fiscal Period September 2026 is OPEN for GL postings.',
      time: '1h ago',
      href: '/dashboard/gl/fiscal-periods',
      isRead: false,
      type: 'period',
    },
    {
      id: 'n3',
      title: 'Payroll Run Pending',
      message: 'Semi-monthly payroll for Sep 1-15 ready for review.',
      time: '3h ago',
      href: '/dashboard/payroll',
      isRead: false,
      type: 'payroll',
    },
  ]);

  // Read initialization from localStorage & system
  useEffect(() => {
    fetchAccessMatrix();
  }, []);

  // Sync resolved theme with themeMode, OS changes, and document.documentElement class
  useEffect(() => {
    const updateTheme = () => {
      let isDarkTheme = false;
      if (themeMode === 'auto') {
        const isDarkOS = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        isDarkTheme = !!isDarkOS;
        setResolvedTheme(isDarkOS ? 'dark' : 'light');
      } else {
        isDarkTheme = themeMode === 'dark';
        setResolvedTheme(themeMode);
      }

      // Synchronize .dark class on html element so tailwind darkMode: 'class' activates across ALL pages
      if (typeof document !== 'undefined') {
        const doc = document.documentElement;
        if (isDarkTheme) {
          doc.classList.add('dark');
          doc.style.backgroundColor = '#0F1115';
          doc.style.colorScheme = 'dark';
        } else {
          doc.classList.remove('dark');
          doc.style.backgroundColor = '#F8FAFC';
          doc.style.colorScheme = 'light';
        }
      }
    };

    updateTheme();

    if (themeMode === 'auto' && typeof window !== 'undefined') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => updateTheme();
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [themeMode]);

  // Keep dropdowns expanded when pathname updates
  useEffect(() => {
    if (pathname.startsWith('/dashboard/settings') || pathname.startsWith('/dashboard/masterfiles')) {
      setOpenDropdowns((prev) => ({ ...prev, settings: true }));
    } else if (pathname.startsWith('/dashboard/gl')) {
      setOpenDropdowns((prev) => ({ ...prev, gl: true }));
    } else if (pathname.startsWith('/dashboard/vouchers')) {
      setOpenDropdowns((prev) => ({ ...prev, vouchers: true }));
    } else if (pathname.startsWith('/dashboard/reports')) {
      setOpenDropdowns((prev) => ({ ...prev, reports: true }));
    }
  }, [pathname]);

  const fetchAccessMatrix = async () => {
    try {
      const res = await fetch('/api/settings/access-matrix');
      const json = await res.json();
      if (json.success && json.accessMatrix) {
        setAccessMatrix(json.accessMatrix);
        setMatrixLoaded(true);
      }
    } catch (e) {
      console.error('Failed to load access matrix:', e);
    }
  };

  const handleThemeChange = (mode: 'light' | 'dark' | 'auto') => {
    setThemeMode(mode);
    localStorage.setItem('aos100_theme_mode', mode);
  };

  const handleTenantChange = (tid: string) => {
    setSelectedTenant(tid);
    localStorage.setItem('aos100_tenant', tid);
    setShowCompanySwitcher(false);

    // Update currentUser active tenant profile in state and localStorage
    const savedUserStr = typeof window !== 'undefined' ? localStorage.getItem('aos100_user') : null;
    if (savedUserStr) {
      try {
        const u = JSON.parse(savedUserStr);
        u.tenantId = tid;
        u.tenantName = TENANT_NAMES[tid];
        localStorage.setItem('aos100_user', JSON.stringify(u));
      } catch (e) {
        console.error(e);
      }
    }

    // In-place broadcast event to all dashboard components without hard page reload
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aos100_tenant_changed', { detail: { tenantId: tid } }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aos100_token');
    localStorage.removeItem('aos100_user');
    document.cookie = 'aos100_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/');
  };

  const toggleDropdown = (key: string) => {
    setOpenDropdowns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Switch persona live for testing RBAC
  const handleSwitchPersona = (persona: typeof TEST_PERSONAS[0]) => {
    const userObj = {
      id: `usr-${persona.username}`,
      username: persona.username,
      fullName: persona.fullName,
      role: persona.role,
      email: persona.email,
      tenantId: selectedTenant,
      tenantName: TENANT_NAMES[selectedTenant],
    };
    localStorage.setItem('aos100_user', JSON.stringify(userObj));
    setCurrentUser({
      username: persona.username,
      name: persona.fullName,
      role: persona.role,
      initials: persona.initials,
      email: persona.email,
    });
    setShowUserDropdown(false);

    // If active page is not permitted for the new persona, redirect to their allowed workspace
    if (persona.role === 'HR_PAYROLL_OFFICER') {
      if (!pathname.startsWith('/dashboard/payroll')) {
        router.push('/dashboard/payroll');
      }
    } else if (persona.role === 'CASHIER') {
      if (!pathname.startsWith('/dashboard/cashiering') && !pathname.startsWith('/dashboard/vouchers/cheques')) {
        router.push('/dashboard/cashiering');
      }
    }
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const isDark = resolvedTheme === 'dark';
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const isNavActive = (href: string) => pathname === href;

  // --------------------------------------------------------------------------
  // ROLE PERMISSION LOGIC (Segregation of Duties)
  // --------------------------------------------------------------------------
  const userPerms = useMemo(() => {
    const roleKey = currentUser.role;
    const roleMatrix = accessMatrix[roleKey];

    if (roleMatrix) {
      return {
        canGL: !!(roleMatrix.general_ledger?.view || roleMatrix.fiscal_periods?.view),
        canVouchers: !!(roleMatrix.accounts_payable?.view || roleMatrix.check_vouchers?.view),
        canCashiering: !!roleMatrix.cashiering?.view,
        canMaterials: !!roleMatrix.materials_management?.view,
        canHRIS: !!(roleMatrix.hris?.view || roleMatrix.payroll_hris?.view),
        canPayroll: !!(roleMatrix.payroll?.view || roleMatrix.payroll_hris?.view),
        canReports: !!(roleMatrix.financial_statements?.view || roleMatrix.bir_2307?.view),
        canSettings: !!roleMatrix.settings_management?.view,
        matrix: roleMatrix,
      };
    }

    const isAdmin = roleKey === 'ADMINISTRATOR';
    const isHr = roleKey === 'HR_PAYROLL_OFFICER';
    const isCashier = roleKey === 'CASHIER';
    const isWhse = roleKey === 'MATERIALS_SUPERVISOR';
    const isAcct = roleKey === 'SENIOR_ACCOUNTANT';
    const isFinHead = roleKey === 'FINANCE_HEAD';

    return {
      canGL: isAdmin || isFinHead || isAcct,
      canVouchers: isAdmin || isFinHead || isAcct || isCashier,
      canCashiering: isAdmin || isFinHead || isAcct || isCashier,
      canMaterials: isAdmin || isWhse,
      canHRIS: isAdmin || isHr,
      canPayroll: isAdmin || isHr || isFinHead || isAcct,
      canReports: isAdmin || isFinHead || isAcct,
      canSettings: isAdmin || isFinHead,
      matrix: {},
    };
  }, [accessMatrix, currentUser.role]);

  // Route protection / SoD route guard check
  const isCurrentRouteAllowed = useMemo(() => {
    if (currentUser.role === 'ADMINISTRATOR') return true;
    if (pathname === '/dashboard') return true;

    if (pathname.startsWith('/dashboard/hris')) return userPerms.canHRIS;
    if (pathname.startsWith('/dashboard/payroll')) return userPerms.canPayroll;
    if (pathname.startsWith('/dashboard/gl')) return userPerms.canGL;
    if (pathname.startsWith('/dashboard/vouchers')) return userPerms.canVouchers;
    if (pathname.startsWith('/dashboard/cashiering')) return userPerms.canCashiering;
    if (pathname.startsWith('/dashboard/materials')) return userPerms.canMaterials;
    if (pathname.startsWith('/dashboard/reports')) return userPerms.canReports;
    if (pathname.startsWith('/dashboard/settings') || pathname.startsWith('/dashboard/masterfiles')) {
      return userPerms.canSettings;
    }

    return true;
  }, [pathname, currentUser.role, userPerms]);

  const matchesSearch = (text: string) => {
    if (!sidebarSearch.trim()) return true;
    return text.toLowerCase().includes(sidebarSearch.toLowerCase());
  };

  // --------------------------------------------------------------------------
  // EXACT SELECTION & FOCUS STYLES (per Image 2 specs)
  // Contrast ratio 15.24:1 AAA
  // Selected: Background #E5E8EC (light) / #2A2B31 (dark), Foreground #121212 / #FFFFFF
  // --------------------------------------------------------------------------
  const getNavItemClass = (active: boolean) => {
    if (active) {
      return 'bg-[#E5E8EC] dark:bg-[#2A2B31] text-[#121212] dark:text-white font-bold shadow-xs';
    }
    return 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#1E1E22] transition-colors';
  };

  return (
    <div className="min-h-screen flex font-sans antialiased bg-[#F8FAFC] dark:bg-[#0F1115] text-slate-800 dark:text-slate-100">
      {/* ========================================================================= */}
      {/* 1. PRIMARY SIDEBAR (Desktop w-68 + Mobile Off-canvas Drawer)             */}
      {/* Matches user request: ONLY the Primary Sidebar on desktop                 */}
      {/* ========================================================================= */}
      {/* Mobile Backdrop */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}

      <aside
        className={`w-68 flex-shrink-0 flex flex-col border-r select-none z-50 transition-transform duration-300 lg:transition-none bg-white dark:bg-[#141416] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 ${
          // Mobile: Off-canvas drawer sliding from left; Desktop: normal docked pane
          isMobileDrawerOpen
            ? 'fixed inset-y-0 left-0 shadow-2xl translate-x-0'
            : 'fixed inset-y-0 left-0 -translate-x-full lg:static lg:translate-x-0'
        }`}
      >
        {/* --- Emphasized Logo & Title Header with Proper Vertical Spacing --- */}
        <div className="h-16 px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Emphasized Rich Gradient Logo */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow-md shadow-blue-500/20 border border-blue-400/20">
              <Boxes className="w-5 h-5 text-white" />
            </div>

            {/* Emphasized Title Text with Tenant Switcher */}
            <div className="min-w-0">
              <button
                onClick={() => setShowCompanySwitcher(!showCompanySwitcher)}
                className="flex items-center gap-1.5 font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate tracking-tight"
                title="Click to switch company entity"
              >
                <span className="truncate">{TENANT_SHORT[selectedTenant] || 'JCS Chemical'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              </button>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>BA {selectedTenant}</span>
                <span>&bull;</span>
                <span>6 Operators</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Test Personas / Roles"
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-400 hover:text-blue-500" />
            </button>

            {/* Mobile Drawer Close Button */}
            <button
              onClick={() => setIsMobileDrawerOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Close Drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tenant Selector Dropdown Modal if clicked */}
        {showCompanySwitcher && (
          <div className="p-2 border-b text-xs space-y-1 animate-in fade-in bg-slate-50 dark:bg-[#1A1A1E] border-slate-200 dark:border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Switch Corporate Entity:
            </div>
            {['8100', '8200', '8300'].map((tid) => (
              <button
                key={tid}
                onClick={() => handleTenantChange(tid)}
                className={`w-full text-left px-2 py-1.5 rounded-md text-xs flex items-center justify-between ${
                  selectedTenant === tid
                    ? 'bg-blue-600 text-white font-bold'
                    : 'hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="truncate">{TENANT_NAMES[tid]}</span>
                {selectedTenant === tid && <Check className="w-3.5 h-3.5 flex-shrink-0 ml-1" />}
              </button>
            ))}
          </div>
        )}

        {/* --- Search Pill with ⌘K --- */}
        <div className="px-3.5 py-3">
          <div
            className="flex items-center rounded-xl px-3 py-2 text-xs border bg-slate-100/90 dark:bg-[#1E1E22] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus-within:border-blue-500"
          >
            <Search className="w-4 h-4 text-slate-400 mr-2.5 flex-shrink-0" />
            <input
              type="text"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder="Search"
              className="w-full bg-transparent text-xs placeholder-slate-400 focus:outline-none"
            />
            <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded shadow-2xs bg-white dark:bg-[#2A2A30] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* --- Primary Navigation with INLINE ACCORDION DROPDOWNS --- */}
        {/* No separate pages, no backbutton! Directly expands inline */}
        <div className="flex-1 px-3 py-1 space-y-1 overflow-y-auto scrollbar-thin">
          {/* Dashboard */}
          {matchesSearch('Dashboard') && (
            <Link
              href="/dashboard"
              onClick={() => setIsMobileDrawerOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all ${getNavItemClass(
                isNavActive('/dashboard')
              )}`}
            >
              <LayoutDashboard className="w-4 h-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <span className="truncate font-medium">Dashboard</span>
            </Link>
          )}

          {/* General Ledger (Inline Dropdown) */}
          {userPerms.canGL && matchesSearch('General Ledger') && (
            <div>
              <button
                onClick={() => toggleDropdown('gl')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${getNavItemClass(
                  pathname.startsWith('/dashboard/gl') && !openDropdowns.gl
                )}`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Building className="w-4 h-4 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
                  <span className="truncate font-medium">General Ledger</span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    openDropdowns.gl ? 'rotate-90 text-indigo-500' : ''
                  }`}
                />
              </button>

              {/* Inline Sub-items */}
              {openDropdowns.gl && (
                <div className="ml-4 pl-3 border-l-2 border-slate-200 dark:border-slate-800 my-1 space-y-0.5 animate-in fade-in duration-100">
                  <Link
                    href="/dashboard/gl/vouchers"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className={`block px-2.5 py-1.5 rounded-lg text-xs transition-colors ${getNavItemClass(
                      isNavActive('/dashboard/gl/vouchers')
                    )}`}
                  >
                    Journal Vouchers (Form 052)
                  </Link>
                  <Link
                    href="/dashboard/gl/fiscal-periods"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className={`block px-2.5 py-1.5 rounded-lg text-xs transition-colors ${getNavItemClass(
                      isNavActive('/dashboard/gl/fiscal-periods')
                    )}`}
                  >
                    Fiscal Period Governance
                  </Link>
                  <Link
                    href="/dashboard/gl/ledger"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className={`block px-2.5 py-1.5 rounded-lg text-xs transition-colors ${getNavItemClass(
                      isNavActive('/dashboard/gl/ledger')
                    )}`}
                  >
                    General Ledger & Trial Balance
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Vouchers (Inline Dropdown) */}
          {userPerms.canVouchers && matchesSearch('Vouchers') && (
            <div>
              <button
                onClick={() => toggleDropdown('vouchers')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${getNavItemClass(
                  pathname.startsWith('/dashboard/vouchers') && !openDropdowns.vouchers
                )}`}
              >
                <div className="flex items-center gap-3 truncate">
                  <FileSpreadsheet className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                  <span className="truncate font-medium">Vouchers</span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    openDropdowns.vouchers ? 'rotate-90 text-amber-500' : ''
                  }`}
                />
              </button>

              {/* Inline Sub-items */}
              {openDropdowns.vouchers && (
                <div className="ml-4 pl-3 border-l-2 border-slate-200 dark:border-slate-800 my-1 space-y-0.5 animate-in fade-in duration-100">
                  <Link
                    href="/dashboard/vouchers/payables"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className={`block px-2.5 py-1.5 rounded-lg text-xs transition-colors ${getNavItemClass(
                      isNavActive('/dashboard/vouchers/payables')
                    )}`}
                  >
                    Accounts Payable (Form 023)
                  </Link>
                  <Link
                    href="/dashboard/vouchers/cheques"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className={`block px-2.5 py-1.5 rounded-lg text-xs transition-colors ${getNavItemClass(
                      isNavActive('/dashboard/vouchers/cheques')
                    )}`}
                  >
                    Check Vouchers & Cheque Print
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Cashiering */}
          {userPerms.canCashiering && matchesSearch('Cashiering') && (
            <Link
              href="/dashboard/cashiering"
              onClick={() => setIsMobileDrawerOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all ${getNavItemClass(
                isNavActive('/dashboard/cashiering')
              )}`}
            >
              <Receipt className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="truncate font-medium">Cashiering</span>
            </Link>
          )}

          {/* Materials */}
          {userPerms.canMaterials && matchesSearch('Materials') && (
            <Link
              href="/dashboard/materials"
              onClick={() => setIsMobileDrawerOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all ${getNavItemClass(
                isNavActive('/dashboard/materials')
              )}`}
            >
              <Boxes className="w-4 h-4 flex-shrink-0 text-cyan-600 dark:text-cyan-400" />
              <span className="truncate font-medium">Materials</span>
            </Link>
          )}

          {/* Human Resources (HRIS) */}
          {userPerms.canHRIS && matchesSearch('HRIS') && (
            <Link
              href="/dashboard/hris"
              onClick={() => setIsMobileDrawerOpen(false)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${getNavItemClass(
                isNavActive('/dashboard/hris')
              )}`}
            >
              <div className="flex items-center gap-3 truncate">
                <Users className="w-4 h-4 flex-shrink-0 text-cyan-600 dark:text-cyan-400" />
                <span className="truncate font-semibold">Human Resources (HRIS)</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-bold">
                201
              </span>
            </Link>
          )}

          {/* Payroll & Compensation */}
          {userPerms.canPayroll && matchesSearch('Payroll') && (
            <Link
              href="/dashboard/payroll"
              onClick={() => setIsMobileDrawerOpen(false)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${getNavItemClass(
                isNavActive('/dashboard/payroll')
              )}`}
            >
              <div className="flex items-center gap-3 truncate">
                <DollarSign className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate font-semibold">Payroll & Compensation</span>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            </Link>
          )}

          {/* Reports (Inline Dropdown) */}
          {userPerms.canReports && matchesSearch('Reports') && (
            <div>
              <button
                onClick={() => toggleDropdown('reports')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${getNavItemClass(
                  pathname.startsWith('/dashboard/reports') && !openDropdowns.reports
                )}`}
              >
                <div className="flex items-center gap-3 truncate">
                  <FileText className="w-4 h-4 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                  <span className="truncate font-medium">Reports</span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    openDropdowns.reports ? 'rotate-90 text-purple-500' : ''
                  }`}
                />
              </button>

              {/* Inline Sub-items */}
              {openDropdowns.reports && (
                <div className="ml-4 pl-3 border-l-2 border-slate-200 dark:border-slate-800 my-1 space-y-0.5 animate-in fade-in duration-100">
                  <Link
                    href="/dashboard/reports/bir2307"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className={`block px-2.5 py-1.5 rounded-lg text-xs transition-colors ${getNavItemClass(
                      isNavActive('/dashboard/reports/bir2307')
                    )}`}
                  >
                    BIR Form 2307
                  </Link>
                  <Link
                    href="/dashboard/reports/financial-statements"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className={`block px-2.5 py-1.5 rounded-lg text-xs transition-colors ${getNavItemClass(
                      isNavActive('/dashboard/reports/financial-statements')
                    )}`}
                  >
                    Financial Statements (P&L, BS)
                  </Link>
                  <Link
                    href="/dashboard/reports/aging"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className={`block px-2.5 py-1.5 rounded-lg text-xs transition-colors ${getNavItemClass(
                      isNavActive('/dashboard/reports/aging')
                    )}`}
                  >
                    AP/AR Aging Schedules
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Quick Access / Favorites */}
          <div className="pt-3 pb-1">
            <div className="flex items-center justify-between px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Star className="w-3 h-3 text-amber-500" />
                <span>Quick Access</span>
              </span>
              <Plus className="w-3 h-3 text-slate-400 cursor-pointer hover:text-slate-600" />
            </div>
            <div className="space-y-0.5 mt-1">
              <Link
                href="/dashboard/gl/fiscal-periods"
                onClick={() => setIsMobileDrawerOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${getNavItemClass(
                  isNavActive('/dashboard/gl/fiscal-periods')
                )}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="truncate">Active Fiscal Period</span>
              </Link>
              {userPerms.canVouchers && (
                <Link
                  href="/dashboard/gl/vouchers"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${getNavItemClass(
                    isNavActive('/dashboard/gl/vouchers')
                  )}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  <span className="truncate">Pending Maker-Checker</span>
                </Link>
              )}
              {userPerms.canReports && (
                <Link
                  href="/dashboard/reports/bir2307"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${getNavItemClass(
                    isNavActive('/dashboard/reports/bir2307')
                  )}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span className="truncate">BIR 2307 Engine</span>
                </Link>
              )}
            </div>
          </div>

          {/* Settings (Inline Dropdown - No separate page, expands right in place!) */}
          {userPerms.canSettings && matchesSearch('Settings') && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => toggleDropdown('settings')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${getNavItemClass(
                  (pathname.startsWith('/dashboard/settings') || pathname.startsWith('/dashboard/masterfiles')) && !openDropdowns.settings
                )}`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Settings className="w-4 h-4 flex-shrink-0 text-violet-600 dark:text-violet-400" />
                  <span className="truncate font-semibold">Settings</span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    openDropdowns.settings ? 'rotate-90 text-violet-500' : ''
                  }`}
                />
              </button>

              {/* Inline Settings Dropdown Content */}
              {openDropdowns.settings && (
                <div className="ml-4 pl-3 border-l-2 border-slate-200 dark:border-slate-800 my-1 space-y-3 pt-1 animate-in fade-in duration-150">
                  {/* Category 1: Administration */}
                  <div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      <User className="w-3 h-3 text-blue-500" />
                      <span>Administration</span>
                    </div>
                    <div className="space-y-0.5 mt-1">
                      <Link
                        href="/dashboard/settings/general"
                        onClick={() => setIsMobileDrawerOpen(false)}
                        className={`block px-2.5 py-1.5 rounded-lg text-xs transition-colors ${getNavItemClass(
                          isNavActive('/dashboard/settings/general')
                        )}`}
                      >
                        General & Branding
                      </Link>
                      <Link
                        href="/dashboard/settings/data"
                        onClick={() => setIsMobileDrawerOpen(false)}
                        className={`block px-2.5 py-1.5 rounded-lg text-xs transition-colors ${getNavItemClass(
                          isNavActive('/dashboard/settings/data')
                        )}`}
                      >
                        Data Management
                      </Link>
                      <Link
                        href="/dashboard/settings/users"
                        onClick={() => setIsMobileDrawerOpen(false)}
                        className={`block px-2.5 py-1.5 rounded-lg text-xs transition-colors ${getNavItemClass(
                          isNavActive('/dashboard/settings/users')
                        )}`}
                      >
                        User Management
                      </Link>
                      <Link
                        href="/dashboard/settings/access-matrix"
                        onClick={() => setIsMobileDrawerOpen(false)}
                        className={`block px-2.5 py-1.5 rounded-lg text-xs transition-colors ${getNavItemClass(
                          isNavActive('/dashboard/settings/access-matrix')
                        )}`}
                      >
                        Access Control Matrix
                      </Link>
                    </div>
                  </div>

                  {/* Category 2: Masterfiles & Setup */}
                  <div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      <Folder className="w-3 h-3 text-indigo-500" />
                      <span>Masterfiles & Setup</span>
                    </div>
                    <div className="space-y-0.5 mt-1">
                      <Link
                        href="/dashboard/masterfiles/accounts"
                        onClick={() => setIsMobileDrawerOpen(false)}
                        className={`block px-2.5 py-1.5 rounded-lg text-xs transition-colors ${getNavItemClass(
                          isNavActive('/dashboard/masterfiles/accounts')
                        )}`}
                      >
                        Chart of Accounts
                      </Link>
                      <Link
                        href="/dashboard/masterfiles/vendors"
                        onClick={() => setIsMobileDrawerOpen(false)}
                        className={`block px-2.5 py-1.5 rounded-lg text-xs transition-colors ${getNavItemClass(
                          isNavActive('/dashboard/masterfiles/vendors')
                        )}`}
                      >
                        Vendors
                      </Link>
                      <Link
                        href="/dashboard/masterfiles/customers"
                        onClick={() => setIsMobileDrawerOpen(false)}
                        className={`block px-2.5 py-1.5 rounded-lg text-xs transition-colors ${getNavItemClass(
                          isNavActive('/dashboard/masterfiles/customers')
                        )}`}
                      >
                        Customers
                      </Link>
                      <Link
                        href="/dashboard/masterfiles/banks"
                        onClick={() => setIsMobileDrawerOpen(false)}
                        className={`block px-2.5 py-1.5 rounded-lg text-xs transition-colors ${getNavItemClass(
                          isNavActive('/dashboard/masterfiles/banks')
                        )}`}
                      >
                        Banks & Cheque Setup
                      </Link>
                      <Link
                        href="/dashboard/settings/migration"
                        onClick={() => setIsMobileDrawerOpen(false)}
                        className={`block px-2.5 py-1.5 rounded-lg text-xs transition-colors ${getNavItemClass(
                          isNavActive('/dashboard/settings/migration')
                        )}`}
                      >
                        Legacy ETL Migration
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- Sidebar Footer: Segmented Theme Mode Switcher & Logout --- */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5">
          {/* 3-State Theme Mode Segmented Pill */}
          <div
            className={`flex items-center p-1 rounded-xl text-xs border ${
              isDark
                ? 'bg-[#1E1E22] border-slate-800 text-slate-300'
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            <button
              onClick={() => handleThemeChange('light')}
              className={`flex-1 py-1 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                themeMode === 'light'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Force Light Theme"
            >
              <Sun className="w-3 h-3 text-amber-500" />
              <span>Light</span>
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={`flex-1 py-1 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                themeMode === 'dark'
                  ? 'bg-slate-700 text-white shadow-2xs font-bold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Force Dark Theme"
            >
              <Moon className="w-3 h-3 text-blue-400" />
              <span>Dark</span>
            </button>
            <button
              onClick={() => handleThemeChange('auto')}
              className={`flex-1 py-1 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                themeMode === 'auto'
                  ? isDark
                    ? 'bg-slate-700 text-white shadow-2xs font-bold'
                    : 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Follow Operating System Theme"
            >
              <Sparkles className="w-3 h-3 text-emerald-500" />
              <span>Auto</span>
            </button>
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                {currentUser.role.replace(/_/g, ' ')}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE CONTENT AREA                                           */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 border-b px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 bg-white/95 dark:bg-[#141416]/95 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 backdrop-blur-md">
          {/* Left: Mobile Drawer Hamburger & Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger Button for Mobile Drawer on < lg */}
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Open sidebar drawer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="text-xs sm:text-sm font-medium flex items-center gap-1.5 truncate">
              <Link href="/dashboard" className="text-slate-400 hover:text-blue-600 transition-colors">
                Home
              </Link>
              <span className="text-slate-400">&gt;</span>
              <span className="font-semibold truncate text-slate-900 dark:text-white">
                {activeBreadcrumb}
              </span>
            </div>
          </div>

          {/* Right: Search, Notifications, Entity Indicator, Profile */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-lg transition-colors relative ${
                  isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
                title="System Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl shadow-2xl border z-50 p-3 text-xs animate-in fade-in zoom-in-95 duration-100 bg-white dark:bg-[#1E1E22] border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="font-bold">Notifications</span>
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-blue-500 hover:underline font-semibold"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="py-2 space-y-2 max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.href}
                        onClick={() => setShowNotifications(false)}
                        className={`block p-2 rounded-lg transition-colors ${
                          n.isRead
                            ? isDark
                              ? 'hover:bg-slate-800/60 opacity-60'
                              : 'hover:bg-slate-50 opacity-60'
                            : isDark
                            ? 'bg-slate-800 hover:bg-slate-750 font-semibold'
                            : 'bg-blue-50/70 hover:bg-blue-100/70 font-semibold'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-blue-600 dark:text-blue-400">{n.title}</span>
                          <span className="text-[10px] text-slate-400">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-0.5">{n.message}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Corporate Entity Switcher on Desktop */}
            <div
              className={`hidden md:flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs border ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <select
                value={selectedTenant}
                onChange={(e) => handleTenantChange(e.target.value)}
                className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="8100" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">
                  8100 — JCS Chemical
                </option>
                <option value="8200" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">
                  8200 — APF Corp.
                </option>
                <option value="8300" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">
                  8300 — Chemag Trading
                </option>
              </select>
            </div>

            {/* User Profile Pill */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2.5 pl-2 border-l text-left transition-colors border-slate-200 dark:border-slate-800"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {currentUser.initials}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-bold leading-tight text-slate-800 dark:text-white">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {currentUser.role.replace(/_/g, ' ')}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* User Dropdown & PERSONA SWITCHER */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl shadow-2xl border z-50 p-3 text-xs animate-in fade-in zoom-in-95 duration-100 bg-white dark:bg-[#1A1A1E] border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
                    <div className="font-bold text-sm text-slate-900 dark:text-white">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-400">{currentUser.email}</div>
                    <div className="inline-block mt-1 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                      Role: {currentUser.role}
                    </div>
                  </div>

                  {/* Persona Switcher Section for Interactive RBAC Testing */}
                  <div className="py-2.5 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      <span className="flex items-center gap-1">
                        <SlidersHorizontal className="w-3 h-3 text-blue-500" />
                        <span>Test Role Persona:</span>
                      </span>
                      <span className="text-[10px] text-blue-500 font-normal">1-click test</span>
                    </div>

                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {TEST_PERSONAS.map((p) => {
                        const isSelected = currentUser.role === p.role;
                        return (
                          <button
                            key={p.role}
                            onClick={() => handleSwitchPersona(p)}
                            className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                              isSelected
                                ? 'bg-blue-600 text-white font-bold shadow-xs'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div>
                              <div className="font-semibold leading-tight">{p.label}</div>
                              <div
                                className={`text-[10px] ${
                                  isSelected ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'
                                }`}
                              >
                                {p.desc}
                              </div>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="py-2 space-y-1">
                    {userPerms.canSettings && (
                      <Link
                        href="/dashboard/settings/access-matrix"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-blue-500" />
                        <span>Access Control Matrix (RBAC)</span>
                      </Link>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 p-1.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out from AOS100</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body with Responsive Padding (pb-24 on mobile so footer dock never covers content) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto min-w-0">
          {/* Segregation of Duties (SoD) Route Guard */}
          {!isCurrentRouteAllowed ? (
            <div className="max-w-2xl mx-auto my-12 p-6 sm:p-8 bg-white dark:bg-[#1E1E22] border border-rose-200 dark:border-rose-900/50 rounded-2xl shadow-xl text-center space-y-4 animate-in fade-in">
              <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Access Restricted — Segregation of Duties (SoD)
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                  Your active role <span className="font-bold text-blue-600 dark:text-blue-400">[{currentUser.role}]</span> is
                  restricted from viewing this module according to the Role-Based Access Control Matrix.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-left space-y-1">
                <div className="font-bold text-slate-700 dark:text-slate-200">Active Policy Enforcement:</div>
                <div className="text-slate-500">
                  User: <span className="font-mono text-slate-700 dark:text-slate-300">{currentUser.name}</span>
                </div>
                <div className="text-slate-500">
                  Attempted Path: <span className="font-mono text-slate-700 dark:text-slate-300">{pathname}</span>
                </div>
                <div className="text-rose-600 dark:text-rose-400 font-semibold">
                  Status: Access Denied by SoD Matrix
                </div>
              </div>

              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
                >
                  Return to Dashboard
                </Link>
                {userPerms.canPayroll && (
                  <Link
                    href="/dashboard/payroll"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
                  >
                    Go to Payroll & HRIS
                  </Link>
                )}
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. MOBILE MIDDLE FOOTER DOCK (Visible ONLY on Mobile View)               */}
      {/* "the secondary sidebar must be only visible when mobile view,.           */}
      {/* it should appear in footer"                                              */}
      {/* ========================================================================= */}
      <nav
        className={`lg:hidden fixed bottom-0 inset-x-0 z-40 h-16 border-t flex items-center justify-around px-2 shadow-2xl backdrop-blur-md transition-colors ${
          isDark
            ? 'bg-[#141416]/95 border-slate-800 text-slate-400'
            : 'bg-white/95 border-slate-200 text-slate-600'
        }`}
      >
        {/* Home */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center flex-1 h-full text-[10px] font-medium transition-colors ${
            pathname === '/dashboard'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5 text-blue-500" />
          <span>Home</span>
        </Link>

        {/* Vouchers (Direct Navigation to Real Page) */}
        {userPerms.canVouchers && (
          <Link
            href="/dashboard/vouchers/payables"
            className={`flex flex-col items-center justify-center flex-1 h-full text-[10px] font-medium transition-colors ${
              pathname.startsWith('/dashboard/vouchers') || pathname.startsWith('/dashboard/gl/vouchers')
                ? 'text-amber-600 dark:text-amber-400 font-bold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5 mb-0.5 text-amber-500" />
            <span>Vouchers</span>
          </Link>
        )}

        {/* Payroll (Direct Navigation) */}
        {userPerms.canPayroll && (
          <Link
            href="/dashboard/payroll"
            className={`flex flex-col items-center justify-center flex-1 h-full text-[10px] font-medium transition-colors ${
              pathname.startsWith('/dashboard/payroll')
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <DollarSign className="w-5 h-5 mb-0.5 text-emerald-500" />
            <span>Payroll</span>
          </Link>
        )}

        {/* Reports (Direct Navigation to Real Page) */}
        {userPerms.canReports && (
          <Link
            href="/dashboard/reports/financial-statements"
            className={`flex flex-col items-center justify-center flex-1 h-full text-[10px] font-medium transition-colors ${
              pathname.startsWith('/dashboard/reports')
                ? 'text-purple-600 dark:text-purple-400 font-bold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5 mb-0.5 text-purple-500" />
            <span>Reports</span>
          </Link>
        )}

        {/* Mobile Footer "More" button to open Image 2 Terminal Navigation & Tools */}
        <button
          onClick={() => setIsMoreSheetOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 h-full text-[10px] font-medium transition-colors ${
            isMoreSheetOpen
              ? 'text-cyan-600 dark:text-cyan-400 font-bold'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <LayoutGrid className="w-5 h-5 mb-0.5 text-cyan-500" />
          <span>More</span>
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* MOBILE NAVIGATION & TOOLS MODAL SHEET (Matching Image 2 Reference)       */}
      {/* ========================================================================= */}
      {isMoreSheetOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop blur */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMoreSheetOpen(false)}
          />

          {/* Bottom Sheet Modal */}
          <div className="relative z-10 w-full max-h-[88vh] bg-white dark:bg-[#0F1115] border-t border-slate-200 dark:border-slate-800 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Drag Handle */}
            <div className="pt-3 pb-1 flex justify-center">
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>

            {/* Header: Icon + Title + Close Button */}
            <div className="px-5 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <LayoutGrid className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Terminal Navigation & Tools</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Complete Enterprise Modules & Services</p>
                </div>
              </div>
              <button
                onClick={() => setIsMoreSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="px-4 py-2.5 overflow-x-auto scrollbar-none flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-[#14171F]">
              {[
                { id: 'all', label: 'All Modules' },
                { id: 'finance', label: 'Finance & GL' },
                { id: 'operations', label: 'Operations' },
                { id: 'hris', label: 'HR & Payroll' },
                { id: 'reports', label: 'Reports' },
                { id: 'admin', label: 'Admin & Setup' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setMoreCategory(cat.id as any)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    moreCategory === cat.id
                      ? 'bg-cyan-500 text-black font-bold shadow-xs'
                      : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Module Cards Grid (2-column layout per Image 2) */}
            <div className="p-4 overflow-y-auto max-h-[calc(88vh-140px)] pb-12">
              <div className="grid grid-cols-2 gap-2.5">
                {ALL_MOBILE_MODULES
                  .filter((m) => moreCategory === 'all' || m.category === moreCategory)
                  .map((mod) => {
                    const Icon = mod.icon;
                    const isActive = pathname.startsWith(mod.href);
                    return (
                      <Link
                        key={mod.id}
                        href={mod.href}
                        onClick={() => setIsMoreSheetOpen(false)}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between text-left active:scale-[0.98] ${
                          isActive
                            ? 'bg-slate-100 dark:bg-slate-800/90 border-cyan-500 shadow-sm'
                            : 'bg-slate-50/80 dark:bg-[#161922] border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl ${mod.iconBg} ${mod.iconColor} flex items-center justify-center mb-2.5`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                            {mod.title}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {mod.subtitle}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
