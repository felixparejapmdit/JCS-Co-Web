# AOS100 NextGen: 8-Sprint Master Roadmap & Engineering Reference

This document serves as the official standalone backup reference for the complete 16-week, 8-Sprint phased modernization roadmap for **AOS100 NextGen** (JCS Chemical Industries, Inc., APF Corporation, Chemag Trading Corporation), extracted and preserved from [PLAN.md](file:///d:/PROJECTS/01%20JCS%20Co/PLAN.md).

---

## Roadmap Executive Summary

| Sprint | Weeks | Primary Focus Area | Key Deliverables |
| :---: | :---: | :--- | :--- |
| **Sprint 1** | W1–W2 | **Scaffolding, OOP Domain, Docker & Firebase** | **[COMPLETED]** Next.js 15 Full-Stack TypeScript web app, OOP domain models & aggregates, FinTech UI, Docker multi-stage container, `docker-compose.yml`, multi-tenant PostgreSQL 16 schemas, Firebase Hosting & Cloud Run configs. |
| **Sprint 2** | W3–W4 | **Masterfiles & Foundational Settings** | **[COMPLETED]** Chart of Accounts (COA) hierarchical CRUD, Cost Center management, Vendor/Customer masterfiles with TIN & ATC codes, Bank checking accounts, `DataGrid<T>` virtualized table. |
| **Sprint 3** | W5–W6 | **General Ledger & Fiscal Governance** | **[COMPLETED]** Fiscal Period Controller (`gltransmonstatus` replacement), Journal Voucher (`Form 052`) balancing ($DR = CR$), Maker-Checker approval workflow, atomic GL posting, period closing routines. |
| **Sprint 4** | W7–W8 | **Accounts Payable & Cheque Printing** | **[COMPLETED]** Voucher Payable (`Form 023`) with 12% VAT and EWT, Check Voucher (`Form 024`) payment allocations (replacing `tempcvdettbl`), `AmtWords` currency verbalizer, Vector cheque printing (BDO, BPI, Metrobank), F7 hotkey print preview. |
| **Sprint 5** | W9–W10 | **Cashiering, Collections, Payroll & Access Matrix** | **[COMPLETED]** Official Receipt Collection (`Form 010`) for Cash/Cheque/Online, multi-invoice payment allocations, CDCR, bank deposit slips, PDC alerts, Philippine Payroll & HRIS (`payemployeetbl`, SSS, PhilHealth, Pag-IBIG, TRAIN WTax), and RBAC Access Control Matrix (`sys_usergrouprights`). |
| **Sprint 6** | W11–W12 | **BIR Form 2307 & Materials Management** | **[COMPLETED]** BIR Form 2307 withholding tax engine, automated Credit Memos (TC 90), printable official BIR 2307 certificate generator, Material Receiving Reports (MMRR) 3-way matching, Moving Average costing. |
| **Sprint 7** | W13–W14 | **Financial Statements & Audit Compliance** | **[COMPLETED]** Real-time Balance Sheet, multi-departmental P&L, AP/AR Aging schedules (Current, 30, 60, 90, 120+ days), immutable JSON audit trail, Cost of Sales vs Average Selling Price (COS vs ASP) analysis. |
| **Sprint 8** | W15–W16 | **Legacy MySQL Migration & Final Cutover** | **[COMPLETED]** Automated ETL extraction scripts from legacy MySQL (`jcs`, `apf`, `chemag`), Base64 to Argon2id migration, trial balance zero-centavo reconciliation, side-by-side verification, production cutover readiness. |

---

## Detailed Sprint Specifications

## Milestone 1: Architecture, Multi-Tenant Engine & Identity (Month 1)

### Sprint 1: Scaffolding, Multi-Tenant Database, OOP TypeScript Domain, Dockerization & Firebase Readiness
* **Task 1.1**: Initialize Next.js 15 Full-Stack Web Application with TypeScript, App Router, React 19, Tailwind CSS, Lucide icons, and Shadcn UI components.
* **Task 1.2**: Implement core Object-Oriented Programming (OOP) and DDD domain model hierarchy in TypeScript:
  * Abstract base classes: `BaseEntity`, `AggregateRoot`, `FinancialDocument`.
  * Value objects: `Money` (decimal + currency, zero-float precision), `TaxRate`, `TaxIdentificationNumber`.
  * Initial financial aggregates: `JournalVoucher` with encapsulated debit/credit equilibrium invariant ($DR = CR$), `VoucherPayable`, and `CheckVoucher`.
  * Core interfaces & abstractions: `IRepository<T>`, `IUnitOfWork`, `ITenantContext`, `ITaxCalculationStrategy`, `IChequeLayoutStrategy`.
* **Task 1.3**: Configure PostgreSQL 16 multi-tenant schemas (`shared_system`, `tenant_8100`, `tenant_8200`, `tenant_8300`) with dynamic search-path resolver and connection pooling.
* **Task 1.4**: Implement Argon2id password hashing, JWT bearer issuance, and session token rotation in Next.js Route Handlers.
* **Task 1.5**: Implement TypeScript OOP service client layer:
  * Abstract `BaseHttpService` managing JWT tokens, tenant header propagation (`X-Tenant-Id`), and error handling.
  * Concrete client services (`AuthApiService`, `VoucherApiService`, `TenantApiService`).
* **Task 1.6**: Multi-stage Dockerization setup:
  * Standalone production `Dockerfile` (<120MB Alpine image) with non-root `nextjs` user.
  * Root `docker-compose.yml` orchestrating PostgreSQL 16 Alpine, Redis 7 Alpine, and the Next.js Full-Stack Web App with healthchecks and persistent volumes.
* **Task 1.7**: Firebase Deployment Readiness:
  * Configure `firebase.json` with single-origin routing: `/api/**` rewritten to Cloud Run (`serviceId: aos100-web`, region: `asia-east1`) and `/**` served by Firebase Hosting.
  * Configure `.firebaserc` with project alias targets (`aos100-jcs`, `staging`, `production`).
  * Add cross-platform deployment automation scripts (`scripts/deploy-firebase.ps1` and `scripts/deploy-firebase.sh`).
* **Task 1.8**: Build Next.js Login interface with company switcher dropdown (`8100 JCS`, `8200 APF`, `8300 Chemag`) and 5-strike account lockout protection.
* **Task 1.9**: Build Executive Financial Dashboard overview with KPI metric cards, Cash Flow trends, and Journal Voucher entry module.

### Sprint 2: Masterfiles & Foundational Settings
* **Task 2.1**: Implement Chart of Accounts (COA) hierarchical CRUD API with prefix code validation and normal balance constraints (`DR`/`CR`).
* **Task 2.2**: Implement Cost Center (`cctrnotbl`) management with plant and division tags.
* **Task 2.3**: Build Vendor and Customer masterfile modules with TIN formatting, default ATC tax codes, and payment terms.
* **Task 2.4**: Create Bank Master module with checking account definitions and millimeter cheque coordinate settings.
* **Task 2.5**: Construct the reusable `DataGrid<T>` virtualized table component in Next.js using TanStack Table v8.

---

## Milestone 2: Financial Core (GL, Payables & Cheque Printing) (Month 2)

### Sprint 3: General Ledger & Fiscal Period Governance
* **Task 3.1**: Build Fiscal Period Controller (`gltransmonstatus`) with `OPEN`, `CLOSED`, and `LOCKED` status enforcement.
* **Task 3.2**: Implement Journal Voucher (JV / Form 052) module with strict client and server-side balance validation ($DR = CR$).
* **Task 3.3**: Build Maker-Checker review and approval workflow for Journal Vouchers.
* **Task 3.4**: Implement atomic GL Posting service that writes balanced entries to `general_ledger_headers` and `lines`.
* **Task 3.5**: Implement automated Month-End Closing and Year-End Retained Earnings adjustment routines.

### Sprint 4: Accounts Payable & Precision Cheque Printing
* **Task 4.1**: Build Voucher Payable (VP / Form 023) screen with automatic 12% Input VAT and EWT deductions.
* **Task 4.2**: Implement Check Voucher (CV / Form 024) module with multi-VP payment allocation grid (replacing `tempcvdettbl`).
* **Task 4.3**: Develop C# `AmtWords` currency verbalizer for Philippine Peso figures in words.
* **Task 4.4**: Build QuestPDF Vector Cheque Generator with millimeter-accurate positioning for BDO, BPI, Metrobank, and Security Bank.
* **Task 4.5**: Integrate browser-direct PDF print preview with keyboard hotkey trigger (`F7`).

---

## Milestone 3: Cashiering, BIR Form 2307 & Materials (Month 3)

### Sprint 5: Cashiering, Collections & Bank Deposits
* **Task 5.1**: Build Collection (OR / Form 010) module supporting Cash, Cheque, and Electronic Fund Transfers.
* **Task 5.2**: Implement multi-invoice payment allocation logic with automatic discount and withholding tax deductions.
* **Task 5.3**: Build Cashier's Daily Collection Report (CDCR) auto-aggregation module grouping collections by tender type.
* **Task 5.4**: Develop Bank Deposit preparation and clearing reconciliation module.
* **Task 5.5**: Implement Post-Dated Check (PDC) maturity tracking and alert banner.
* **Task 5.6**: Implement Employee Masterfile and 2026 Philippine Statutory Deductions (SSS MSC ceiling, PhilHealth 2.5%, Pag-IBIG PhP 200), and BIR TRAIN Law Semi-Monthly Withholding Tax on Compensation.
* **Task 5.7**: Develop Semi-Monthly Payroll Calculation Engine, Payslip Generator, and Cheque Voucher disbursement integration.
* **Task 5.8**: Build Role-Based Access Control Matrix (RBAC) screen replacing legacy `sys_usergrouprights`.

### Sprint 6: BIR Form 2307 Tax Engine & Materials Management
* **Task 6.1**: Implement Alphanumeric Tax Code (ATC) catalog and automated calculation rules (WC158, WC160, WI010).
* **Task 6.2**: Build Customer EWT / BIR 2307 module with automated Credit Memo (TC 90) generation against open invoices.
* **Task 6.3**: Implement QuestPDF official BIR Form 2307 layout generator matching the official Philippine BIR design.
* **Task 6.4**: Build Material Receiving Report (MMRR) module with Purchase Order 3-way matching.
* **Task 6.5**: Implement Inventory Stock Card tracking and Moving Average costing engine.

---

## Milestone 4: Financial Statements, Migration & Cutover (Month 4)

### Sprint 7: Financial Statements & Compliance Auditing
* **Task 7.1**: Develop real-time Balance Sheet generation with comparative monthly and annual columns.
* **Task 7.2**: Develop Income Statement (P&L) generator broken down by Business Area and Cost Center.
* **Task 7.3**: Implement Accounts Payable and Accounts Receivable Aging Reports (Current, 30, 60, 90, 120+ days).
* **Task 7.4**: Implement automated immutable Audit Trail with JSON before/after state diff recording.
* **Task 7.5**: Build Cost of Sales (COS) vs. Average Selling Price (ASP) margin analysis screen.

### Sprint 8: Legacy Data Migration, Reconciliation & Cutover
* **Task 8.1**: Write migration ETL scripts extracting historical data from legacy MySQL databases (`jcs`, `apf`, `chemag`).
* **Task 8.2**: Clean and transform legacy Base64 credentials into temporary secure reset tokens.
* **Task 8.3**: Reconcile beginning GL account balances and unposted open VPs / AR invoices ($DR = CR$ verification).
* **Task 8.4**: Execute 30-day side-by-side parallel run testing between legacy AOS100 and NextGen.
* **Task 8.5**: Final production cutover, DNS transition, and legacy system decommissioning.
