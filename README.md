# AOS100 NextGen — Enterprise ERP & Financial Governance

Modern Multi-Tenant Financial Accounting, General Ledger, Accounts Payable/Receivable, BIR Tax Compliance, HRIS 201 Records, Automated 2026 Payroll, and Cheque Printing Platform for **JCS Chemical Industries**, **APF Corporation**, and **Chemag Trading**.

- **Live Production URL:** [https://jcs-co-web.vercel.app](https://jcs-co-web.vercel.app)
- **Local Dev Server:** `http://localhost:8180`
- **Architecture:** Next.js 15 App Router • TypeScript • PostgreSQL 16 • Redis 7 • Tailwind CSS

---

## 1. Database Credentials & Connection Details

### Local & Docker PostgreSQL (Port 5432)

| Configuration Key | Value | Description |
| :--- | :--- | :--- |
| **Host** | `localhost` or `127.0.0.1` | Local machine host |
| **Port** | `5432` | Standard PostgreSQL port |
| **Database Name** | `aos100_core` | Primary ERP database |
| **Username** | `aos_admin` | Master database administrator |
| **Password** | `Aos100SecurePass!` | Secure local database password |
| **SSL Mode** | `disable` | Local non-SSL mode |
| **Connection URI** | `postgresql://aos_admin:Aos100SecurePass!@localhost:5432/aos100_core?sslmode=disable` | Direct database connection string |

### Redis 7 Cache & Lock Service (Port 6379)

| Configuration Key | Value | Description |
| :--- | :--- | :--- |
| **Host** | `localhost` or `127.0.0.1` | Local cache host |
| **Port** | `6379` | Standard Redis port |
| **Password** | `RedisSecurePass!` | Authentication password |
| **Connection URI** | `redis://:RedisSecurePass!@localhost:6379` | Distributed locks & caching |

---

## 2. Database Architecture & Schemas

The PostgreSQL database uses a multi-tenant schema isolation design:

```
aos100_core
├── shared_system/             # Global System Catalog & Security
│   ├── tenants                # 8100 (JCS), 8200 (APF), 8300 (Chemag)
│   ├── users                  # Staff credentials, roles & Argon2id hashes
│   └── audit_logs             # Immutable system audit trail
│
├── tenant_8100/               # JCS Chemical Industries, Inc.
│   ├── accounts               # Chart of Accounts (COA)
│   ├── journal_vouchers       # Form 052 JVs & Line Items
│   ├── vouchers_payable       # Form 023 Accounts Payable
│   ├── check_vouchers         # Cheque Printing & Disbursements
│   ├── vendors & customers    # Masterfile directories
│   ├── employees_201          # HRIS 201 personnel records
│   └── payroll_runs           # Semi-monthly payroll computations
│
├── tenant_8200/               # APF Corporation (Isolated Schema)
└── tenant_8300/               # Chemag Trading Corporation (Isolated Schema)
```

---

## 3. How to Run PostgreSQL Locally

### Option A: Using Docker Compose (Recommended)

To start only the PostgreSQL 16 database:
```bash
docker compose up -d db
```

To start both PostgreSQL and Redis:
```bash
docker compose up -d db redis
```

To start the complete full-stack environment (Database + Redis + Next.js):
```bash
docker compose up -d
```

To check database container logs:
```bash
docker compose logs -f db
```

To stop services:
```bash
docker compose down
```

### Option B: Connecting with GUI Client (DBeaver / TablePlus / pgAdmin)

1. Open **DBeaver** or **pgAdmin 4**.
2. Create a new **PostgreSQL Connection**:
   - **Host:** `localhost`
   - **Port:** `5432`
   - **Database:** `aos100_core`
   - **Username:** `aos_admin`
   - **Password:** `Aos100SecurePass!`
3. Click **Test Connection** → **Connect**.

---

## 4. In-App Database & Tables Explorer (Zero-Software Access)

You can view, search, and manage all database tables live directly in your web browser:

| Database Table / Entity | Local Access URL | Live Cloud URL (Vercel) |
| :--- | :--- | :--- |
| **Users & Permissions Table** | [http://localhost:8180/dashboard/settings/users](http://localhost:8180/dashboard/settings/users) | [`https://jcs-co-web.vercel.app/dashboard/settings/users`](https://jcs-co-web.vercel.app/dashboard/settings/users) |
| **Chart of Accounts (COA)** | [http://localhost:8180/dashboard/masterfiles/accounts](http://localhost:8180/dashboard/masterfiles/accounts) | [`https://jcs-co-web.vercel.app/dashboard/masterfiles/accounts`](https://jcs-co-web.vercel.app/dashboard/masterfiles/accounts) |
| **Vendors & Creditors** | [http://localhost:8180/dashboard/masterfiles/vendors](http://localhost:8180/dashboard/masterfiles/vendors) | [`https://jcs-co-web.vercel.app/dashboard/masterfiles/vendors`](https://jcs-co-web.vercel.app/dashboard/masterfiles/vendors) |
| **Customers & Debtors** | [http://localhost:8180/dashboard/masterfiles/customers](http://localhost:8180/dashboard/masterfiles/customers) | [`https://jcs-co-web.vercel.app/dashboard/masterfiles/customers`](https://jcs-co-web.vercel.app/dashboard/masterfiles/customers) |
| **Banks & Checkbooks** | [http://localhost:8180/dashboard/masterfiles/banks](http://localhost:8180/dashboard/masterfiles/banks) | [`https://jcs-co-web.vercel.app/dashboard/masterfiles/banks`](https://jcs-co-web.vercel.app/dashboard/masterfiles/banks) |
| **HRIS 201 Personnel Table** | [http://localhost:8180/dashboard/hris](http://localhost:8180/dashboard/hris) | [`https://jcs-co-web.vercel.app/dashboard/hris`](https://jcs-co-web.vercel.app/dashboard/hris) |
| **Payroll Ledger Table** | [http://localhost:8180/dashboard/payroll](http://localhost:8180/dashboard/payroll) | [`https://jcs-co-web.vercel.app/dashboard/payroll`](https://jcs-co-web.vercel.app/dashboard/payroll) |
| **General Ledger & Trial Balance** | [http://localhost:8180/dashboard/gl/ledger](http://localhost:8180/dashboard/gl/ledger) | [`https://jcs-co-web.vercel.app/dashboard/gl/ledger`](https://jcs-co-web.vercel.app/dashboard/gl/ledger) |
| **Journal Vouchers (Form 052)** | [http://localhost:8180/dashboard/gl/vouchers](http://localhost:8180/dashboard/gl/vouchers) | [`https://jcs-co-web.vercel.app/dashboard/gl/vouchers`](https://jcs-co-web.vercel.app/dashboard/gl/vouchers) |
| **Vouchers Payable (Form 023)** | [http://localhost:8180/dashboard/vouchers/payables](http://localhost:8180/dashboard/vouchers/payables) | [`https://jcs-co-web.vercel.app/dashboard/vouchers/payables`](https://jcs-co-web.vercel.app/dashboard/vouchers/payables) |
| **Check Vouchers & Cheque Print** | [http://localhost:8180/dashboard/vouchers/cheques](http://localhost:8180/dashboard/vouchers/cheques) | [`https://jcs-co-web.vercel.app/dashboard/vouchers/cheques`](https://jcs-co-web.vercel.app/dashboard/vouchers/cheques) |
| **Cashiering & ORs** | [http://localhost:8180/dashboard/cashiering](http://localhost:8180/dashboard/cashiering) | [`https://jcs-co-web.vercel.app/dashboard/cashiering`](https://jcs-co-web.vercel.app/dashboard/cashiering) |
| **BIR Form 2307 Withholding** | [http://localhost:8180/dashboard/reports/bir2307](http://localhost:8180/dashboard/reports/bir2307) | [`https://jcs-co-web.vercel.app/dashboard/reports/bir2307`](https://jcs-co-web.vercel.app/dashboard/reports/bir2307) |
| **Financial Statements (P&L / BS)** | [http://localhost:8180/dashboard/reports/financial-statements](http://localhost:8180/dashboard/reports/financial-statements) | [`https://jcs-co-web.vercel.app/dashboard/reports/financial-statements`](https://jcs-co-web.vercel.app/dashboard/reports/financial-statements) |
| **Audit Logs & Data Management** | [http://localhost:8180/dashboard/settings/data](http://localhost:8180/dashboard/settings/data) | [`https://jcs-co-web.vercel.app/dashboard/settings/data`](https://jcs-co-web.vercel.app/dashboard/settings/data) |

---

## 5. Application Login Credentials

The application includes pre-configured live enterprise test accounts:

| Role | Username | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `Password123!` | Full unrestricted access to all modules, settings & audit logs |
| **Senior Accountant** | `accountant` | `Password123!` | General Ledger, Maker JVs, Accounts Payable & BIR Reports |
| **HR & Payroll Officer** | `hr` | `Password123!` | Dedicated HRIS 201 Files & 2026 Statutory Payroll Engine |
| **Cashier / Treasury** | `cashier` | `Password123!` | Official Receipts, Collections, Deposits & Cheque Vouchers |

**Business Area / Tenant Selection:**
- `8100` — JCS Chemical Industries, Inc.
- `8200` — APF Corporation
- `8300` — Chemag Trading Corporation

---

## 6. Development Scripts

```bash
# Install dependencies
npm install

# Start local Next.js development server (Port 8180)
npm run dev

# Compile production build
npm run build

# Start local standalone production server
npm run start:standalone

# Run unit and integration tests
npm test
```

---

## 7. Executive Sales Presentation

For presenting the business value, ROI comparison against SAP/NetSuite, and live demonstration script for prospective clients, see the complete guide in [Presentation.MD](Presentation.MD).
