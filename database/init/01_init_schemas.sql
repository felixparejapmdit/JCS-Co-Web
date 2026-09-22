-- AOS100 NextGen PostgreSQL Multi-Tenant Database Initialization
-- Sprints 1, 2, and 3: System Schemas, Masterfiles, General Ledger & Fiscal Governance

-- 1. Create Dedicated Schemas
CREATE SCHEMA IF NOT EXISTS shared_system;
CREATE SCHEMA IF NOT EXISTS tenant_8100; -- JCS Chemical Industries, Inc.
CREATE SCHEMA IF NOT EXISTS tenant_8200; -- APF Corporation
CREATE SCHEMA IF NOT EXISTS tenant_8300; -- Chemag Trading Corporation

-- 2. Master Tenants Table
CREATE TABLE IF NOT EXISTS shared_system.tenants (
    id VARCHAR(10) PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL,
    tin VARCHAR(20) NOT NULL,
    rdo_code VARCHAR(10) NOT NULL,
    address TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Corporate Business Entities
INSERT INTO shared_system.tenants (id, company_name, tin, rdo_code, address)
VALUES 
    ('8100', 'JCS Chemical Industries, Inc.', '000-123-456-000', '043', 'Valenzuela City, Metro Manila'),
    ('8200', 'APF Corporation', '000-456-789-000', '043', 'Quezon City, Metro Manila'),
    ('8300', 'Chemag Trading Corporation', '000-789-101-000', '043', 'Mandaluyong City, Metro Manila')
ON CONFLICT (id) DO UPDATE SET 
    company_name = EXCLUDED.company_name,
    tin = EXCLUDED.tin,
    rdo_code = EXCLUDED.rdo_code,
    address = EXCLUDED.address;

-- 3. Shared Users Catalog (Argon2id hashes)
CREATE TABLE IF NOT EXISTS shared_system.users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    default_tenant_id VARCHAR(10) REFERENCES shared_system.tenants(id),
    role VARCHAR(50) NOT NULL,
    is_locked BOOLEAN DEFAULT FALSE,
    failed_strikes INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO shared_system.users (id, username, password_hash, full_name, default_tenant_id, role)
VALUES 
    ('usr-admin-01', 'admin', '$argon2id$v=19$m=65536,t=3,p=4$AOS100SaltExample$AOS100HashedPasswordExample', 'Maria Santos, CPA', '8100', 'FINANCE_HEAD'),
    ('usr-acct-01', 'accountant', '$argon2id$v=19$m=65536,t=3,p=4$AOS100SaltExample$AOS100HashedPasswordExample', 'Juan Dela Cruz', '8100', 'SENIOR_ACCOUNTANT'),
    ('usr-cash-01', 'cashier', '$argon2id$v=19$m=65536,t=3,p=4$AOS100SaltExample$AOS100HashedPasswordExample', 'Elena Reyes', '8100', 'CASHIER')
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;

-- 4. Tenant Initialization Procedure (Sprints 2 & 3 Schemas)
CREATE OR REPLACE FUNCTION shared_system.init_tenant_schema(schema_name TEXT)
RETURNS void AS $$
BEGIN
    -- Fiscal Periods Controller
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %1$I.fiscal_periods (
            id VARCHAR(50) PRIMARY KEY,
            fiscal_year INT NOT NULL,
            fiscal_month INT NOT NULL,
            period_name VARCHAR(50) NOT NULL,
            date_from DATE NOT NULL,
            date_to DATE NOT NULL,
            status VARCHAR(20) DEFAULT ''OPEN'', -- OPEN, CLOSED, LOCKED
            closed_by VARCHAR(50),
            closed_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Chart of Accounts (COA)
        CREATE TABLE IF NOT EXISTS %1$I.chart_of_accounts (
            id VARCHAR(50) PRIMARY KEY,
            account_number VARCHAR(30) UNIQUE NOT NULL,
            account_name VARCHAR(150) NOT NULL,
            account_type VARCHAR(30) NOT NULL, -- Asset, Liability, Equity, Revenue, COGS, Expense
            normal_balance VARCHAR(2) NOT NULL, -- DR, CR
            parent_account_id VARCHAR(50),
            is_header BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Cost Centers (cctrnotbl replacement)
        CREATE TABLE IF NOT EXISTS %1$I.cost_centers (
            id VARCHAR(50) PRIMARY KEY,
            code VARCHAR(20) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            division VARCHAR(50) NOT NULL,
            plant_location VARCHAR(100) NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Vendors Masterfile
        CREATE TABLE IF NOT EXISTS %1$I.vendors (
            id VARCHAR(50) PRIMARY KEY,
            vendor_code VARCHAR(30) UNIQUE NOT NULL,
            vendor_name VARCHAR(150) NOT NULL,
            trade_name VARCHAR(150),
            tin VARCHAR(20) NOT NULL,
            registered_address TEXT NOT NULL,
            default_atc VARCHAR(10) NOT NULL, -- WC158, WC160, WI010
            payment_terms_days INT DEFAULT 30,
            is_vat_registered BOOLEAN DEFAULT TRUE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Customers Masterfile
        CREATE TABLE IF NOT EXISTS %1$I.customers (
            id VARCHAR(50) PRIMARY KEY,
            customer_code VARCHAR(30) UNIQUE NOT NULL,
            customer_name VARCHAR(150) NOT NULL,
            trade_name VARCHAR(150),
            tin VARCHAR(20) NOT NULL,
            billing_address TEXT NOT NULL,
            credit_limit NUMERIC(18,2) DEFAULT 0.00,
            payment_terms_days INT DEFAULT 30,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Bank Accounts & Cheque Settings
        CREATE TABLE IF NOT EXISTS %1$I.bank_accounts (
            id VARCHAR(50) PRIMARY KEY,
            bank_code VARCHAR(20) NOT NULL, -- BDO, BPI, MBTC, SECB
            bank_name VARCHAR(100) NOT NULL,
            account_number VARCHAR(50) UNIQUE NOT NULL,
            gl_account_number VARCHAR(30) NOT NULL,
            currency VARCHAR(5) DEFAULT ''PHP'',
            cheque_margin_top_mm NUMERIC(6,2) DEFAULT 0.00,
            cheque_margin_left_mm NUMERIC(6,2) DEFAULT 0.00,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Journal Vouchers (Form 052 Header)
        CREATE TABLE IF NOT EXISTS %1$I.journal_vouchers (
            id VARCHAR(50) PRIMARY KEY,
            voucher_number VARCHAR(50) UNIQUE NOT NULL,
            voucher_date DATE NOT NULL,
            fiscal_period_id VARCHAR(50) REFERENCES %1$I.fiscal_periods(id),
            explanation TEXT NOT NULL,
            total_debit NUMERIC(18,2) NOT NULL,
            total_credit NUMERIC(18,2) NOT NULL,
            status VARCHAR(30) DEFAULT ''DRAFT'', -- DRAFT, SUBMITTED, REVIEWED, APPROVED, POSTED, REJECTED
            created_by VARCHAR(50) NOT NULL,
            reviewed_by VARCHAR(50),
            reviewed_at TIMESTAMPTZ,
            approved_by VARCHAR(50),
            approved_at TIMESTAMPTZ,
            rejection_reason TEXT,
            posted_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            CONSTRAINT chk_jv_balanced CHECK (total_debit = total_credit)
        );

        -- Journal Voucher Lines
        CREATE TABLE IF NOT EXISTS %1$I.journal_voucher_lines (
            id VARCHAR(50) PRIMARY KEY,
            voucher_id VARCHAR(50) REFERENCES %1$I.journal_vouchers(id) ON DELETE CASCADE,
            line_number INT NOT NULL,
            account_number VARCHAR(30) NOT NULL,
            cost_center_code VARCHAR(20),
            debit_amount NUMERIC(18,2) DEFAULT 0.00,
            credit_amount NUMERIC(18,2) DEFAULT 0.00,
            description TEXT NOT NULL
        );

        -- General Ledger Headers (Immutable Postings)
        CREATE TABLE IF NOT EXISTS %1$I.general_ledger_headers (
            id VARCHAR(50) PRIMARY KEY,
            batch_number VARCHAR(50) UNIQUE NOT NULL,
            document_type VARCHAR(20) NOT NULL, -- JV, VP, CV, OR
            document_number VARCHAR(50) NOT NULL,
            document_date DATE NOT NULL,
            fiscal_period_id VARCHAR(50) REFERENCES %1$I.fiscal_periods(id),
            total_debit NUMERIC(18,2) NOT NULL,
            total_credit NUMERIC(18,2) NOT NULL,
            posted_by VARCHAR(50) NOT NULL,
            posted_at TIMESTAMPTZ DEFAULT NOW(),
            CONSTRAINT chk_gl_balanced CHECK (total_debit = total_credit)
        );

        -- General Ledger Lines
        CREATE TABLE IF NOT EXISTS %1$I.general_ledger_lines (
            id VARCHAR(50) PRIMARY KEY,
            gl_header_id VARCHAR(50) REFERENCES %1$I.general_ledger_headers(id) ON DELETE CASCADE,
            line_number INT NOT NULL,
            account_number VARCHAR(30) NOT NULL,
            cost_center_code VARCHAR(20),
            debit_amount NUMERIC(18,2) DEFAULT 0.00,
            credit_amount NUMERIC(18,2) DEFAULT 0.00,
            description TEXT NOT NULL
        );

        -- Audit Trail Log
        CREATE TABLE IF NOT EXISTS %1$I.audit_trail (
            id VARCHAR(50) PRIMARY KEY,
            entity_type VARCHAR(50) NOT NULL,
            entity_id VARCHAR(50) NOT NULL,
            action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, SUBMIT, REVIEW, APPROVE, POST, REJECT
            actor_id VARCHAR(50) NOT NULL,
            actor_name VARCHAR(150) NOT NULL,
            old_state JSONB,
            new_state JSONB,
            details TEXT,
            timestamp TIMESTAMPTZ DEFAULT NOW()
        );
    ', schema_name);
END;
$$ LANGUAGE plpgsql;

-- Apply to all three business entities
SELECT shared_system.init_tenant_schema('tenant_8100');
SELECT shared_system.init_tenant_schema('tenant_8200');
SELECT shared_system.init_tenant_schema('tenant_8300');
