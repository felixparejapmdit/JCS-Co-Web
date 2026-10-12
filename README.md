# Cloud AOS

**Same data. Same business rules. A modern system built for the next 10 years.**

Cloud AOS is the modern web version of AOS100, the accounting and operations system used by the group's companies. It replaces the ASP.NET / VB.NET screens and **keeps the client's existing MySQL databases**: it reads and writes the same legacy tables, in the same format, so both systems can run side by side while each module is switched over.

| | |
| :--- | :--- |
| **Hosted preview** | https://jcs-co-web.vercel.app (sample data) |
| **Local** | http://localhost:8180 |
| **Stack** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, `mysql2`, Argon2id (`hash-wasm`), JWT session cookie |
| **Plan** | [PLAN.md](PLAN.md): legacy inventory (78 pages, 187 tables, form codes), architecture, design and rollout |
| **Roadmap** | [SPRINTS_ROADMAP.md](SPRINTS_ROADMAP.md): 5 phases, 12 sprints, and what is built so far |
| **Client deck** | `PresentationNew-CloudAOS.pdf` |

---

## 1. How It Works

```
Browser ──POST /api/aos {op, args}──▶ src/server/rpc.ts ──▶ services (GL, AP, AR, sales,
                                                             inventory, purchasing, production,
                                                             payroll, DSR, clinic, reports,
                                                             system, admin)
                                                                   │
                                                                   ▼
                                                         Db interface (legacy tables)
                                                          ├─ MemoryDb: sample data (preview)
                                                          └─ MysqlDb:  client's databases
```

* **Legacy tables, legacy columns.** Every service works on the AOS100 tables (`gljvhdrtbl`, `exphdrtbl`, `cvhdrtbl`, `colhdrtbl`, `sohdrtbl`, `invhdrtbl`, `payearntbl` and the rest; PLAN.md Appendix A). Cloud AOS keeps its own data only in additive `ng_*` tables (PLAN.md Section 7.2).
* **Legacy rights.** Menus, buttons and approvals follow `IsAllowed(group, form, action)` over `sys_usergrouprights`, exactly as the old system does.
* **Automation.** Documents number themselves; *Create from* fills a document from its source; VAT, withholding tax, amounts in words, moving-average cost and lot picking are computed; credit, stock and approval-limit checks run before saving; GL entries are written automatically and bundled by JV Posting; each document shows its next step; Home and the tasks bell list what is waiting for each user.
* **Finance tools.** Petty cash and revolving fund vouchers with a live fund balance, fund replenishment (legacy numbering and remarks) paid through a voucher and cheque, cash-advance liquidation with automatic refund or reimbursement, budget monitoring against actual spending, and correction of automatic JV entries before JV Posting.
* **Cross-module tools.** Access Matrix for group rights (every page and button per group, kept in `sys_usergrouprights`), Favourites, Help, Maintenance Mode, Document Setup, a Report Library (registers and summaries with print and CSV), Document Query with guarded corrections, deposit applications, van sales (daily sales report), the salesman's and sales manager's workspace, customer tools, payroll IDs, DTR upload, the clinic and the FS schedules.
* **Look and feel.** Deep dark mode (true black) and light mode, Electric Blue and Emerald Green accents, Liquid Glass surfaces and an elastic grid of Notion-style blocks. Lists and document lines are interactive cards, with a Cards / List switch for compact scanning.

### Data modes

| Mode | When | Behaviour |
| :--- | :--- | :--- |
| **Sample data** | `DATABASE_HOST` is empty (default, and the hosted preview) | Three sample companies in memory, built by running real transactions through the services (purchases, sales, collections, production, payroll, month-end closing). Data resets when the server restarts. |
| **Client MySQL** | `DATABASE_HOST` is set | One connection pool per company database. **Read-only** until `DATABASE_ALLOW_WRITES=true`, so a first connection can never change live data. |

---

## 2. Sign-in and Company Privacy

* The login page asks only for a username and password. **It never lists or names the companies.**
* The company comes from the account. Users who belong to several companies choose one **after** signing in, from their own companies only, and can switch later from the user menu.
* There is **no company dropdown** anywhere. Each company sees its own **customised header** at the top of the side menu: logo or initials, name, tagline and accent colour, set by its administrator in **Administration → Company & Branding** (stored in `ng_company_branding`).
* Passwords: the legacy Base64 password is checked once, on the first Cloud AOS sign-in, then replaced by an Argon2id hash in `ng_user_credentials`. Five wrong attempts lock the account (`sys_userrecords.idstat = 'Locked'`) until an administrator unlocks it.

### Sample accounts (hosted preview and local sample data)

All sample accounts use the password **`Demo@2026`**; the login page lists them in sample-data mode only.

| Username | Role | Companies |
| :--- | :--- | :---: |
| `admin` | System Administrator | 3 |
| `finance` | Finance Head / CFO | 3 |
| `accountant` | Accountant | 2 |
| `cashier` | Cashier / Treasury | 1 |
| `purchasing` | Purchasing | 1 |
| `warehouse` | Warehouse & Plant | 3 |
| `sales` | Sales & Billing | 2 |
| `hr` | HR & Payroll | 3 |
| `lab` | QA Laboratory | 2 |
| `auditor` | Internal Audit (view only) | 1 |

---

## 3. Run Locally

```bash
npm install
npm run dev                 # http://localhost:8180, sample data

npm run build               # production build (standalone output)
npm run start:standalone    # run the production build on port 8180
```

### Docker

```bash
docker compose up -d web                  # Cloud AOS with sample data
docker compose --profile mysql up -d      # plus MySQL with a restored test copy, and Adminer on :8080
```

For the MySQL profile, put the `*.sql` backups in `database/restore/` (never committed) and fill in `.env` from [.env.example](.env.example).

---

## 4. Connecting to the Client's Databases

Always on a **restored test copy** first (PLAN.md Section 8.3).

1. Restore the backups of `jcs`, `apf`, `chemag`, `bfi` and `bfi_admin`.
2. Run [database/mysql/001_ng_tables.sql](database/mysql/001_ng_tables.sql) and then [002_ng_modules.sql](database/mysql/002_ng_modules.sql) in each company database. They only create `ng_*` tables and are safe to re-run. (Before it has run, Cloud AOS still signs users in read-only; its own tables simply read as empty.)
3. Create a least-privilege MySQL account for Cloud AOS with the client's DBA (never `root`).
4. Set the environment variables below and start Cloud AOS. It is read-only at this point.
5. Compare screens and reports with the legacy system, then set `DATABASE_ALLOW_WRITES=true` **on the test copy** for the parity tests.

| Variable | Purpose |
| :--- | :--- |
| `DATABASE_HOST`, `DATABASE_PORT` | MySQL server. Empty host = sample-data mode. |
| `DATABASE_USER`, `DATABASE_PASSWORD` | Least-privilege account. |
| `DATABASE_SSL` | `true` to use TLS. |
| `DATABASE_POOL_SIZE` | Connections per database (default 5). |
| `DATABASE_ALLOW_WRITES` | `true` to allow saving. Default: read-only. |
| `DB_JCS`, `DB_APF`, `DB_CHEMAG`, `DB_BFI`, `DB_BFI_ADMIN` | Database names (legacy defaults `jcs`, `apf`, `chemag`, `bfi`, `bfi_admin`). |
| `JWT_SECRET` | Signs the session cookie. **Required** with a database; also recommended for the hosted preview. |
| `COOKIE_SECURE` | The session cookie is `Secure` automatically on HTTPS. Set `true` to force it behind a TLS proxy that does not send `X-Forwarded-Proto`. |

Transaction codes written on documents follow the legacy code (`src/shared/codes.ts`), including `84` / `85` for the van cash and charge invoices and `88` for van returns; confirm them against the client's `tccodestbl` in Phase 1. A few columns that the new modules write were not seen in the legacy code (for example `dsrnotbl` and `reqsohdrtbl` details); Cloud AOS writes only the columns listed in PLAN.md Appendix A, but check them against the schema dump before `DATABASE_ALLOW_WRITES` is turned on.

---

## 5. Project Structure

```
src/
├─ app/                     Pages (App Router)
│  ├─ page.tsx              Sign-in and post-sign-in company chooser
│  ├─ api/aos/route.ts      Single RPC endpoint (sign-in, sign-out, all operations)
│  └─ dashboard/            Home, documents (doc/[type]), masters, GL, AR/AP, inventory,
│                           purchasing, production, HR & payroll, administration
├─ components/
│  ├─ shell/                App shell, customised client header, side menu, search, tasks
│  ├─ doc/                  Config-driven document framework (19 document types),
│  │                        print views, cheque printing
│  ├─ reports/              Report Library viewer, FS schedules, aging
│  ├─ sales/                Order request card
│  └─ ui/                   UI kit and data table
├─ server/
│  ├─ db/                   Db interface, sample-data driver, MySQL driver
│  ├─ services/             Business rules per module, on legacy tables
│  ├─ seed/                 Sample companies and transaction history
│  ├─ auth.ts               Session cookie, legacy and Argon2id passwords
│  └─ rpc.ts                Operation registry
└─ shared/                  Money and VAT helpers, amount in words, dates, legacy codes
database/mysql/             ng_* tables migration
tests/server/               Server tests on the sample books
e2e/                        Browser tests (Playwright)
```

---

## 6. Tests

```bash
npm test                                   # Vitest: domain rules and the sample books
npx playwright install                     # once, to download the test browsers
npm run test:e2e                           # Playwright: Chromium, Firefox and WebKit
npm run test:e2e -- --project=chromium     # one browser
```

The server tests (199) check that every company's books balance, that AR and AP subledgers equal their control accounts, that no stock goes negative, that every document opens, that every report adds up, that the van inventory account equals the stock on the vans, that the schedule P&L gives the same net income as the standard statement, and that funds, deposit applications, payroll IDs, the DTR, the clinic, maintenance mode and the Access Matrix behave as intended. The browser tests (43) cover sign-in privacy (no company list or dropdown, the chooser for multi-company users), every screen, the Access Matrix, favourites, the report viewer and the installable app.

---

## 7. Deployment

* **Hosted preview (Vercel).** Pushing to `main` on GitHub deploys https://jcs-co-web.vercel.app. It runs on sample data; set `JWT_SECRET` in the Vercel project settings.
* **Production.** Run the Docker image (or `npm run build && npm run start:standalone`) where it can reach the client's MySQL server, with the variables in Section 4. Use HTTPS in front of it.

## 8. Installable App

Cloud AOS can be installed from Chrome or Edge (install icon in the address bar), Android (*Install app*) or iOS Safari (*Share → Add to Home Screen*). Static files are cached for speed; pages and records are always loaded from the server and never stored on the device, and a plain offline page appears when the connection drops.
