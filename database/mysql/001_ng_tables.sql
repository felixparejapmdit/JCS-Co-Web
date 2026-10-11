-- Cloud AOS additive tables (PLAN.md section 7.2).
--
-- Run once in EACH company database (jcs, apf, chemag), on the test copy first:
--   mysql -h <host> -u <admin user> -p jcs    < database/mysql/001_ng_tables.sql
--   mysql -h <host> -u <admin user> -p apf    < database/mysql/001_ng_tables.sql
--   mysql -h <host> -u <admin user> -p chemag < database/mysql/001_ng_tables.sql
--
-- The script only creates new ng_* tables. It never changes or drops a legacy table, and
-- it is safe to run again. JSON columns need MySQL 5.7.8 or later; on an older server
-- change before_json / after_json to LONGTEXT.

CREATE TABLE IF NOT EXISTS ng_schema_migrations (
    version      VARCHAR(50)  NOT NULL PRIMARY KEY,
    applied_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Argon2id password hashes (legacy Base64 passwords stay untouched until legacy login is retired)
CREATE TABLE IF NOT EXISTS ng_user_credentials (
    username        VARCHAR(50)  NOT NULL PRIMARY KEY,   -- = sys_userrecords.username
    password_hash   VARCHAR(255) NOT NULL,
    failed_attempts INT          NOT NULL DEFAULT 0,
    locked_at       DATETIME     NULL,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Refresh-token sessions (Phase 1 production build)
CREATE TABLE IF NOT EXISTS ng_sessions (
    id            CHAR(36)     NOT NULL PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL,
    token_hash    CHAR(64)     NOT NULL,
    expires_at    DATETIME     NOT NULL,
    revoked_at    DATETIME     NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ng_sessions_user (username)
) ENGINE=InnoDB;

-- Before/after audit snapshots (in addition to the legacy translog)
CREATE TABLE IF NOT EXISTS ng_audit_log (
    id            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    occurred_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    username      VARCHAR(50)  NOT NULL,
    ip_address    VARCHAR(45)  NULL,
    tc            VARCHAR(10)  NULL,          -- legacy transaction code
    table_name    VARCHAR(64)  NOT NULL,
    doc_no        VARCHAR(50)  NULL,
    action        VARCHAR(20)  NOT NULL,      -- CREATE / APPROVE / POST / VOID / PRINT ...
    before_json   JSON         NULL,
    after_json    JSON         NULL,
    INDEX idx_ng_audit_doc (tc, doc_no),
    INDEX idx_ng_audit_time (occurred_at)
) ENGINE=InnoDB;

-- Cheque print calibration per company bank account
CREATE TABLE IF NOT EXISTS ng_cheque_layouts (
    acctno              VARCHAR(30)  NOT NULL PRIMARY KEY,   -- = banktbl.acctno
    date_x_mm           DECIMAL(6,2) NOT NULL,
    date_y_mm           DECIMAL(6,2) NOT NULL,
    payee_x_mm          DECIMAL(6,2) NOT NULL,
    payee_y_mm          DECIMAL(6,2) NOT NULL,
    amount_x_mm         DECIMAL(6,2) NOT NULL,
    amount_y_mm         DECIMAL(6,2) NOT NULL,
    amount_words_x_mm   DECIMAL(6,2) NOT NULL,
    amount_words_y_mm   DECIMAL(6,2) NOT NULL,
    updated_by          VARCHAR(50)  NOT NULL,
    updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Customised client header at the top of the side menu (PLAN.md section 6.2).
-- One row per company; printed forms keep using batbl for the registered name, address and TIN.
CREATE TABLE IF NOT EXISTS ng_company_branding (
    ba            VARCHAR(10)  NOT NULL PRIMARY KEY,   -- = batbl.ba
    display_name  VARCHAR(100) NOT NULL,
    tagline       VARCHAR(80)  NULL,
    logo_text     VARCHAR(3)   NULL,                   -- initials shown when there is no logo
    accent        CHAR(7)      NOT NULL DEFAULT '#0d9488',
    logo_data     MEDIUMTEXT   NULL,                   -- data: URI, PNG / JPG / SVG / WebP under 200 KB
    show_code     CHAR(1)      NOT NULL DEFAULT 'Y',   -- show the BA chip and open period
    updated_by    VARCHAR(50)  NOT NULL,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT IGNORE INTO ng_schema_migrations (version) VALUES ('001_ng_tables');
