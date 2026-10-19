# Cloud AOS: Sprint Roadmap (5 Phases, 12 Sprints)

> **Same data. Same business rules. A modern system built for the next 10 years.**

This is the working roadmap for **Cloud AOS** (AOS100 NextGen). It follows [PLAN.md](PLAN.md) Section 8 and the client deck `PresentationNew-CloudAOS.pdf`. Detailed requirements stay in PLAN.md; this file tracks what each sprint delivers and how far the project has got.

**Ground rules (from the plan)**

* **The client's existing MySQL databases stay** (`jcs`, `apf`, `chemag`, plus `bfi` / `bfi_admin`). There is no data migration, no ETL and no cutover weekend.
* **Active companies: JCS Chemical (8100) and Chemag Trading (8300).** APF Corporation (8200) is disabled since 2026-10-20 (dissolved, per the client); its `apf` database is kept but not used. `COMPANIES_DISABLED` switches it back on. Cloud AOS reads and writes the legacy tables in the legacy format (PLAN.md Appendix A); its own data lives only in additive `ng_*` tables (PLAN.md Section 7.2).
* **One module group at a time, on the live database.** Legacy AOS100 and Cloud AOS run side by side until every module has been switched over.
* **Every phase ends with a verification gate.** The same transactions are entered in both systems on two identical database copies, and must give the same documents, GL lines, balances and printed forms (PLAN.md Section 8.3).
* **Privacy between companies.** The login page lists no companies, and no screen has a company dropdown. Each company sees only its own customised header at the top of the side menu (PLAN.md Sections 5.1 and 6.2).

---

## Status Legend

| Mark | Meaning |
| :---: | :--- |
| ✅ | Built in the hosted preview (https://jcs-co-web.vercel.app) on sample data in the legacy table format. Still needs the phase's verification gate on a copy of the client's database. |
| 🟡 | Partly built; the remaining work is listed. |
| ⬜ | Not started. |
| 🔒 | Needs something from the client first (schema dump, database copy, sample documents, key-user sessions). |

---

## Roadmap at a Glance

| Phase | Sprints | Weeks | Scope | Legacy pages | Preview |
| :--- | :---: | :---: | :--- | :---: | :---: |
| **1. Foundation** | 1-2 | W1-W4 | Secure login, roles, company header, connection to the existing database | 18 | 🟡 |
| **2. Finance Core** | 3-5 | W5-W10 | General Ledger, Journal Vouchers, Payables, Cheque Printing | 18 | 🟡 |
| **3. Cash, Receivables & Sales** | 6-8 | W11-W16 | Collections, CDCR, bank deposits, BIR 2307, customers, sales orders and invoices | 20 | 🟡 |
| **4. Inventory, Materials & Production** | 9-10 | W17-W20 | MMRR, deliveries and transfers, plant stock, RIV / PO, production costing | 15 | 🟡 |
| **5. HR & Payroll, Reports & Go-Live** | 11-12 | W21-W24 | Payroll, financial statements, cross-module tools, final verification, training | 13 | 🟡 |

```
W1 ─────── W4 ──────────── W10 ──────────── W16 ─────── W20 ─────── W24
│ Phase 1  │    Phase 2     │    Phase 3     │  Phase 4  │  Phase 5  │
│ S1  S2   │ S3   S4   S5   │ S6   S7   S8   │ S9   S10  │ S11  S12  │
│ Login,   │ GL, JV, AP,    │ OR, CDCR, 2307,│ MMRR, DO, │ Payroll,  │
│ roles,   │ cheques        │ SO, SI, AR     │ stock, PO,│ FS, go-   │
│ shell    │                │                │ production│ live      │
└──── gate ┴────────── gate ┴────────── gate ┴────── gate ┴──── gate ┘
```

The duration is indicative (12 two-week sprints, about 24 weeks) and is confirmed after the Phase 1 schema review.

---

## Built Into Every Module (Preview)

These are already in place across all modules and are what the client sees in the preview:

* **Legacy-format data layer.** Every service reads and writes the legacy tables and columns (`gljvhdrtbl`, `exphdrtbl`, `colhdrtbl`, `invhdrtbl`, `payearntbl` and so on). One interface, two drivers: sample data in memory for the preview, and MySQL for the client's databases. The MySQL driver refuses writes unless `DATABASE_ALLOW_WRITES=true`, so a first connection to a live database is read-only.
* **Legacy rights, unchanged.** `IsAllowed(group, form, action)` is reproduced from `sys_usergrouprights` (view, edit, insert, delete, release). Menus, buttons and approvals follow the same rights the client already maintains.
* **Automation so users do less typing:**
  * documents number themselves, continuing the legacy numbering in each table;
  * *Create from* fills a new document from its source (PO from RIV, MMRR from PO, VP from MMRR, CV from VPs, SI from delivery, OR from open invoices);
  * VAT, withholding tax, amounts in words, moving-average cost and lot picking (first-expiry-first-out, skipping lots on lab hold) are computed;
  * credit limit, overdue, stock and approval-limit checks run before saving;
  * GL entries are written automatically in the legacy `gltranstbl` format and bundled by JV Posting, exactly as legacy does;
  * every document shows its *Next step* and offers buttons that create the next document in the flow;
  * the Home page and the tasks bell list what is waiting for each user (approvals, postings, lab results).
* **Customised client header.** Each company's logo or initials, display name, tagline and accent colour sit at the top of the side menu, maintained in *Administration → Company & Branding* with a live preview (`ng_company_branding`). There is no company dropdown anywhere.
* **Audit.** Every action writes the legacy `translog` row plus a before / after snapshot in `ng_audit_log`.
* **Access Matrix.** Group Access lists every page and button of Cloud AOS by module, with tri-state ticks per module and per group, a filter, Discard and Save. It writes the legacy `sys_usergrouprights` rows, so both systems check the same rights; rights of legacy forms Cloud AOS does not show are left untouched.
* **Report Library.** Registers and summaries of the legacy report pages open in one viewer: parameters, totals, cards or list, a printed copy with the company header, and CSV export for Excel.
* **Visual identity.** Deep dark mode (true black, deep slate grays) and light mode, neon Electric Blue and Emerald Green accents, macOS-style Liquid Glass surfaces (`backdrop-blur-2xl`, ultra-thin borders), and an elastic grid of Notion-style blocks. Lists and document lines are interactive cards; a Cards / List switch keeps a compact list for people who scan many rows.
* **Works on desktop, tablet and phone,** with light and dark themes. It can be installed as an app (PWA), and a plain offline page appears when the connection drops. Pages and data are never cached on the device.
* **Tests.** Server tests (199) check that the sample books balance, that AR / AP subledgers equal their control accounts, that no stock goes negative, that every document opens, that every report adds up, that the van inventory account equals the stock on the vans and that the schedule P&L gives the same net income as the standard statement (`npm test`). Browser tests (43) cover sign-in privacy, every screen, the Access Matrix, favourites, the report viewer and the installable app (`npm run test:e2e`).

---

## Phase 1: Foundation (Sprints 1-2, W1-W4)

**Goal:** users sign in with their existing AOS accounts, see only their own company, and Cloud AOS is connected to a copy of the client's databases.

### Sprint 1 (W1-W2): Database Connection & Schema Verification

| # | Task | Status | Remaining |
| :--- | :--- | :---: | :--- |
| 1.1 | Schema-only dump and a test copy of all five databases; compare with Appendix A, list triggers, views, procedures and table engines (PLAN.md Section 7.4) | 🔒 | Needs the dump and backup from the client. |
| 1.2 | Next.js 15 / React 19 / TypeScript / Tailwind app, Dockerfile and `docker-compose.yml` | ✅ | |
| 1.3 | Database layer: one `mysql2` pool per company database, least-privilege MySQL account | 🟡 | Connect `bfi` / `bfi_admin`; generate typed table definitions from the schema dump; create the least-privilege account with the client's DBA. |
| 1.4 | Domain rules: money rounding, VAT and EWT, TIN format, amounts in words (exact port of `AmtWords.vb`) | ✅ | |
| 1.8 | Additive `ng_*` tables (`ng_user_credentials`, `ng_audit_log`, `ng_cheque_layouts`, `ng_company_branding`, `ng_sessions`, `ng_schema_migrations`; then `ng_settings`, `ng_dsr_amstock`, `ng_clinic_supply`, `ng_clinic_visit`, `ng_clinic_stock`) | 🟡 | Scripts ready in `database/mysql/001_ng_tables.sql` and `002_ng_modules.sql`; add the versioned migration runner. |

### Sprint 2 (W3-W4): Sign-in, Rights & Application Shell

| # | Task | Status | Remaining |
| :--- | :--- | :---: | :--- |
| 1.5 | Sign-in with username and password only. The company is resolved from the account; users with several companies choose after signing in, from their own companies only. Legacy Base64 check on the first sign-in, then Argon2id in `ng_user_credentials`; lock after 5 wrong attempts | ✅ | Refresh tokens in `ng_sessions` (the preview uses one 8-hour session cookie). |
| 1.6 | `IsAllowed(group, form, action)`; users, groups and rights, approval limits | ✅ | |
| 1.7 | Shell: customised client header, side menu filtered by rights, screen finder, document search, tasks bell, switch company (own companies only), change password | ✅ | Favourites (`MyFavorites.aspx`). |

**Legacy pages and their Cloud AOS screens**

| Legacy page | Cloud AOS | Status |
| :--- | :--- | :---: |
| `Login.aspx`, `logout.aspx` | Sign-in page, post-sign-in company chooser, Sign out | ✅ |
| `ChangePassword.aspx`, `NewPass.aspx`, `UserDetails.aspx` | My Account (profile, change password) | ✅ |
| `UserMaintenance.aspx` | Administration → Users (create, temporary password, unlock) | ✅ |
| `UserGrpAccess.aspx` | Administration → Group Access: Access Matrix of every page and button per group (tri-state module ticks, filter, Discard / Save, Administrator always complete; rights of forms Cloud AOS does not show are kept) | ✅ |
| `AuthConfig.aspx` | Administration → Approval Limits | ✅ |
| `AOSappConfig.aspx`, `Administrator.aspx` | Administration → Company & Branding | ✅ |
| `Home.aspx`, `AOS100_main.Master`, `MyMenu.master`, `Admin.master` | Home page and the application shell | ✅ |
| `MyFavorites.aspx` | Favourites at the top of the side menu, star on every page (`sys_mymenu`, shared with legacy) | ✅ |
| `DocConfig.aspx`, `Maintenance.aspx` | Administration → Document Setup (numbering of every document type, AOS app download hold `batbl.dloadstat`) and Maintenance Mode (message, only administrators keep working, also at sign-in; `ng_settings`) | ✅ |
| `Help.aspx` (compiled as `About`) | Help & About (tips, document steps, shortcuts incl. Ctrl + K, questions, about) | ✅ |

**Gate:** sign-in, rights and menus checked against legacy for every user group on the test copy.

---

## Phase 2: Finance Core (Sprints 3-5, W5-W10)

**Goal:** accounting runs the general ledger, payables and cheque printing in Cloud AOS.

### Sprint 3 (W5-W6): General Ledger & Period Control

| # | Task | Status | Remaining |
| :--- | :--- | :---: | :--- |
| 2.1 | Chart of accounts, cost centers, profit centers | ✅ | |
| 2.2 | Period control (`gltransmonstatus`, `modtranstattbl`) on every save; Period Closing with pre-close checks and reopen | ✅ | |
| 2.3 | Journal vouchers (Open → Approved → Posted), JV Posting that bundles subledger entries into the monthly automatic JV, reversal; Edit Auto JV Entries corrects a document's open GL entry before JV Posting (balanced, reason kept in the audit trail) | ✅ | |

### Sprint 4 (W7-W8): Payables

| # | Task | Status | Remaining |
| :--- | :--- | :---: | :--- |
| 2.4 | Vendor master; vouchers payable with VAT and EWT (`bir_ewttbl`); duplicate supplier-invoice check; approval limits (`authtbl`); create from a posted MMRR | ✅ | |
| 2.6 | Petty cash and revolving fund vouchers (`exphdrtbl` tc 40 / 44) with a fund-balance check; fund replenishment (`fundrepltbl`, legacy numbering and remarks) paid through a voucher payable and cheque; cash-advance liquidation (tc 46) with refund or reimbursement; budget monitoring (`buddettbl`) against actual spending with drill-down and budget entry | ✅ | Weekly expense reports (tc 41) and gas PO payments (tc 48). |
| 2.6 | A/P aging and open vouchers | ✅ | Remaining AP report variants from `APReports.aspx`. |

### Sprint 5 (W9-W10): Cheques & Printed Forms

| # | Task | Status | Remaining |
| :--- | :--- | :---: | :--- |
| 2.5 | Check vouchers paying several VPs; next cheque number per bank; approve and release; amount in words; cheque calibration per bank account (`ng_cheque_layouts`); print and reprint log (`prttbl`) | ✅ | Calibrate on the client's actual cheque stock (BDO, regular, crossed, small). |
| 2.7 | Printed forms: VP, JV, CV, cheques, BIR 2307, FI registers | 🟡 | Print views exist; match each one to its Crystal Reports output. |

**Legacy pages and their Cloud AOS screens**

| Legacy page | Cloud AOS | Status |
| :--- | :--- | :---: |
| `JournalVoucher.aspx` | General Ledger → Journal Vouchers | ✅ |
| `JVPosting.aspx` | General Ledger → JV Posting | ✅ |
| `JVedit.aspx` | General Ledger → Edit Auto JV Entries | ✅ |
| `AccountingPeriod.aspx` | General Ledger → Period Closing | ✅ |
| `ChartOfAcct.aspx` | Administration → Chart of Accounts, Cost Centers, Profit Centers | ✅ |
| `VoucherPayables.aspx`, `APapp.aspx` | Payables → Vouchers Payable (approval inside the document) | ✅ |
| `CheckVoucher.aspx` | Payables → Check Vouchers; Administration → Cheque Printing Setup | ✅ |
| `VendorMast.aspx` | Payables → Vendors | ✅ |
| `APReports.aspx` | Payables → A/P Aging and A/P Reports (VP, CV and fund registers, payment monitoring, expense query and per account, EWT summary) | ✅ |
| `FinancialAccounting.aspx`, `FI.master` | Home page and the side menu | ✅ |
| `FIreportViewer.aspx`, `ReportViewer.aspx` | Print view on every document; the Report Library viewer (cards / list, company header on paper, CSV export) for every register; GL Registers | ✅ |
| `CashDisb.aspx` | Payables → Petty Cash Vouchers and Revolving Fund Vouchers (the legacy page was a screen layout without server code; built on `exphdrtbl` tc 40 / 44 as the other legacy pages read it) | ✅ |
| `FundRepl.aspx` | Payables → Fund Replenishment | ✅ |
| `Liquidation.aspx` | Payables → Cash Advance Liquidation (the legacy Save was not implemented; completed here) | ✅ |
| `BudgetMonitor.aspx` | General Ledger → Budget Monitoring | ✅ |

**Gate:** trial balance per company and AP open balances show zero difference against legacy; NextGen JVs, VPs and CVs open and print correctly in the legacy screens.

---

## Phase 3: Cash, Receivables & Sales (Sprints 6-8, W11-W16)

**Goal:** cashiers, credit and collection, and sales work in Cloud AOS.

### Sprint 6 (W11-W12): Collections, CDCR & Deposits

| # | Task | Status | Remaining |
| :--- | :--- | :---: | :--- |
| 3.1 | Official receipts with cash and cheques, post-dated cheques detected, applied to the oldest invoices first, EWT on `coldettbl`, unapplied amount kept as a customer deposit | ✅ | Online / bank-transfer tender types used by the client. |
| 3.2 | CDCR generated from the day's receipts; bank deposits | ✅ | Deposit application (`DepApp.aspx`) and the cashier report variants. |

### Sprint 7 (W13-W14): Memos, 2307 & Customers

| # | Task | Status | Remaining |
| :--- | :--- | :---: | :--- |
| 3.3 | Customer debit and credit memos against open invoices; customer 2307 tracking (received / pending) | ✅ | |
| 3.4 | Customer master with change history (`custmasttbl_update`), price list, salesmen, areas; Customer Tools: Excel update, salesman transfer, customer-number requests (`qryreqttbl`) | ✅ | Special prices per customer (`custmmtbl`). |
| 3.6 | A/R aging and statement of account computed directly (no `tempaging*` tables) | ✅ | |

### Sprint 8 (W15-W16): Sales Orders & Invoices

| # | Task | Status | Remaining |
| :--- | :--- | :---: | :--- |
| 3.5 | Sales orders with price list, credit-limit, overdue and stock checks; approval above the limit with remarks; sales invoices created from deliveries with VAT split and automatic GL; salesman's workspace and order requests (`reqsohdrtbl`); daily sales report for van / event sales | ✅ | |
| 3.6 | Sales register and SD reports: invoice register, per salesman, per area, per product, open sales orders | ✅ | Compare each variant with its Crystal Report on the test copy. |
| 3.7 | Printed forms: OR, CDCR, deposit summary, DM / CM, SO, SI, shrinkage report | 🟡 | Match each one to its Crystal Reports output. |

**Legacy pages and their Cloud AOS screens**

| Legacy page | Cloud AOS | Status |
| :--- | :--- | :---: |
| `Collection.aspx` | Cashiering → Official Receipts | ✅ |
| `CDCR.aspx`, `BankDep.aspx` | Cashiering → CDCR & Bank Deposits | ✅ |
| `DepApp.aspx`, `CashierReports.aspx` | Cashiering → Deposit Applications (`depapptbl`, lines added to the receipt with `depapp`) and Cashier's Reports (collection and deposit registers and summaries, CDCR register) | ✅ |
| `CustDMCM.aspx` | Cashiering → Credit Memos, Debit Memos | ✅ |
| `CustEWT.aspx` | Cashiering → Customer 2307 | ✅ |
| `ARreports.aspx`, `ARrepViewer.aspx` | Cashiering → A/R Aging & Statements | ✅ |
| `CustMast.aspx` | Sales → Customers, Price List, Salesmen, Sales Areas, Customer Tools | ✅ |
| `SalesOrder.aspx`, `SOapp.aspx` | Sales → Sales Orders (approval inside the document) | ✅ |
| `SalesInvoice.aspx` | Sales → Sales Invoices | ✅ |
| `SDReports.aspx`, `SDrepViewer.aspx`, `DailySalesReport.aspx` | Sales → Sales Reports, Sales Registers, Daily Sales Reports (Van): van loads (mov 603), cash and charge invoices (tc 84 / 85), returns (tc 88, mov 409), PM count, shrinkage report, AM-stock carry-forward | ✅ |
| `SalesAndDist.aspx`, `SD.master` | Home page and the side menu | ✅ |
| `SalesmanModule.aspx` | Sales → Salesman's Workspace (customers, credit left, sales, order requests) and Order Requests for the sales manager (forms 076 / 077) | ✅ |
| `SmnAccessMobile.aspx` | Not needed: every screen works on phones | ✅ |

**Gate:** AR open balances, CDCR totals and deposits show zero difference against legacy for the sample days.

---

## Phase 4: Inventory, Materials & Production (Sprints 9-10, W17-W20)

**Goal:** warehouses, plants, purchasing and production work in Cloud AOS, with stock per plant.

### Sprint 9 (W17-W18): Receiving, Deliveries & Stock

| # | Task | Status | Remaining |
| :--- | :--- | :---: | :--- |
| 4.1 | Materials and plants, movement types (`movtbl`), plant inventory switch (`plnttbl.invset`) | ✅ | Movement types per plant (`movplnttbl`). |
| 4.2 | Receiving (MMRR) against POs, lots and expiry, lab status for raw materials | ✅ | |
| 4.3 | Deliveries and issuances (sales, production, transfers, scrap) with automatic lot picking; plant transfers create the receiving side; physical count with variance posting | ✅ | Warehouse returns (`wrrhdrtbl`). |
| 4.4 | Stock by plant and lot, stock card, MM registers, reorder alerts, computed directly (no `tempinv*` tables) | ✅ | Inventory valuation report variants. |

### Sprint 10 (W19-W20): Purchasing & Production

| # | Task | Status | Remaining |
| :--- | :--- | :---: | :--- |
| 4.5 | Requisitions (RIV) prefilled from reorder levels, purchase orders from RIVs, approval limits, PO monitoring | ✅ | |
| 4.6 | Production worksheets with formula prefill, material issues, lot receipt on lab hold, costing (`cosdettbl`, `coshdrtbl`), COS vs ASP | ✅ | |
| 4.7 | Printed forms: MMRR, DO variants per company, PO / RIV, pick list, production and inventory reports | 🟡 | Match each one to its Crystal Reports output. |

**Legacy pages and their Cloud AOS screens**

| Legacy page | Cloud AOS | Status |
| :--- | :--- | :---: |
| `MMRR.aspx` | Inventory → Receiving (MMRR) | ✅ |
| `DeliveryOrder.aspx` | Inventory → Deliveries & Transfers | ✅ |
| `InventoryReports.aspx`, `MMReports.aspx`, `MMreportViewer.aspx` | Inventory → Stock by Plant, Registers | ✅ |
| `LabMonitoring.aspx` | Inventory → Lab Monitoring | ✅ |
| `MaterialManagement.aspx`, `MM.master` | Home page and the side menu; Materials, Plants & Warehouses | ✅ |
| `RIV.aspx` | Purchasing → Requisitions (RIV) | ✅ |
| `PO.aspx`, `PurcApp.aspx` | Purchasing → Purchase Orders (approval inside the document) | ✅ |
| `POreports.aspx` | Purchasing → PO Monitoring | ✅ |
| `ProdWorkSheet.aspx`, `ProductionCosting.aspx` | Production → Production Worksheets | ✅ |
| `COSvsASP.aspx` | Production → COS vs ASP | ✅ |

**Gate:** stock balances per plant and lot show zero difference against legacy; production costs match.

---

## Phase 5: HR & Payroll, Reports & Go-Live (Sprints 11-12, W21-W24)

**Goal:** payroll and the financial statements run in Cloud AOS, then the legacy application is retired.

### Sprint 11 (W21-W22): Payroll

| # | Task | Status | Remaining |
| :--- | :--- | :---: | :--- |
| 5.1 | Employees; semi-monthly payroll periods; attendance exceptions; computation with SSS, PhilHealth, Pag-IBIG and withholding tax from the government rate tables; loans; adjustments; register and payslips; posting to the GL and reversal | ✅ | DTR upload, weekly payroll, payroll ID variants. |

### Sprint 12 (W23-W24): Reports, Tools & Go-Live

| # | Task | Status | Remaining |
| :--- | :--- | :---: | :--- |
| 5.2 | Trial balance, account ledgers, balance sheet and income statement (month and year to date, with or without entries waiting for JV posting) | ✅ | The company-specific statement layouts (`FS_JCS`, `FSChemag`). |
| 5.3 | Find a document across modules; void request and approval; audit trail | ✅ | Controlled corrections (`DocQuery.aspx`); clinic monitoring. |
| 5.4 | Final verification of all modules against legacy; training for makers, checkers and administrators | 🔒 | Needs the test copy and key-user sessions. |
| 5.5 | Retire legacy: read-only for an agreed period, then shut down; clear the Base64 passwords; rotate the MySQL `root` password | ⬜ | |

**Legacy pages and their Cloud AOS screens**

| Legacy page | Cloud AOS | Status |
| :--- | :--- | :---: |
| `Attendance.aspx`, `PayrollID.aspx` | HR & Payroll → Payroll (attendance), DTR Upload (`paydtrtbl`, lates / undertime / absences applied to attendance) and Payroll IDs (legacy numbering, pay types and sequences, one open ID per pay type, close / reopen, delete unused) | ✅ |
| `PayrollAcctg.aspx`, `PayrollAdjt.aspx` | HR & Payroll → Payroll (post to GL, adjustments) | ✅ |
| `HRIShome.aspx`, `HRIS.master` | HR & Payroll → Employees and the side menu | ✅ |
| `GLReports.aspx` (compiled as `GLReportsNew`) | General Ledger → GL Reports | ✅ |
| `FS.aspx` (compiled as `FS_JCS`), `FSChemag.aspx` | General Ledger → Financial Statements with P&L by schedule, cost of sales schedule, expense schedules per cost-centre group and prior years' adjustments | ✅ |
| `DocQuery.aspx` | Find a document (top bar) and General Ledger → Document Query (ledger entries, correction history, guarded corrections logged in `updatetbl`) | ✅ |
| `VoidReq.aspx`, `VoidApproval.aspx` | Administration → Void Requests | ✅ |
| `ClinicMonitoring.aspx` | HR & Payroll → Clinic (consultations, medicines and supplies, reports; new `ng_clinic_*` tables because the legacy page had none) | ✅ |

**Gate:** the full parity checklist passes for every module (PLAN.md Section 8.3, step 3); then the legacy application is set to read-only.

---

## Switching Each Module Over (No Data Migration)

1. **Test copy.** Restore a recent backup of all five databases into the test environment.
2. **Build** the module against the copy.
3. **Parity tests.** Same transactions in legacy and Cloud AOS on two identical copies; compare documents, GL lines, trial balance, AR / AP and stock balances, and printed forms. The target is zero difference.
4. **Pilot** on the live database with a small group of users, with the legacy screens still available.
5. **Switch.** Move the module's users over and set its legacy forms to view-only in `sys_usergrouprights`. To roll back, restore those rights; no data has to move, because both systems write the same tables.
6. **Retire legacy** after the last module.

## Before Connecting to the Client's Database

* [ ] Schema-only dump of `jcs`, `apf`, `chemag`, `bfi`, `bfi_admin`, plus a recent full backup for the test copy.
* [ ] A least-privilege MySQL account for Cloud AOS (never `root`).
* [ ] Confirm the transaction codes against the client's `tccodestbl`. Cloud AOS uses the codes found in the legacy code (JV 00, MMRR 10, DO 30, petty cash 40, weekly expense 41, VP 42, CV 43, revolving fund 44, payroll 45, CA liquidation 46, SI 53, OR 60, bank deposit 64, event cash invoice 84, event charge invoice 85, return receipt 88, CM 90, DM 92); the codes for production receipts, transfers, adjustments, RIV, PO and SO were not found in the code and are marked "confirm" in `src/shared/codes.ts`.
* [ ] Run `database/mysql/001_ng_tables.sql` and `002_ng_modules.sql` on the test copy only.
* [ ] Start read-only (leave `DATABASE_ALLOW_WRITES` unset), compare screens and reports with legacy, then enable writes on the test copy for the parity tests.
* [ ] Sample printed forms (Crystal Reports output) for every document type.
