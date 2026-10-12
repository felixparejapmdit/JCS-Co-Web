-- Cloud AOS additive tables, part 2 (PLAN.md section 7.2).
--
-- Run once in EACH company database (jcs, apf, chemag) after 001_ng_tables.sql:
--   mysql -h <host> -u <admin user> -p jcs    < database/mysql/002_ng_modules.sql
--   mysql -h <host> -u <admin user> -p apf    < database/mysql/002_ng_modules.sql
--   mysql -h <host> -u <admin user> -p chemag < database/mysql/002_ng_modules.sql
--
-- Only creates new ng_* tables; safe to run again. Favourites keep using the legacy
-- sys_mymenu table, the app download hold batbl.dloadstat, deposit applications depapptbl,
-- van sales dsrnotbl / amstocktbl / pmstocktbl / shrinkreporttbl, order requests reqsohdrtbl /
-- reqsodettbl, customer requests qryreqttbl and the DTR paydtrtbl.

-- Company settings kept by Cloud AOS only, e.g. skey 'maintenance' =
-- {"on":true,"message":"...","until":"6:00 AM","by":"admin","at":"2026-10-12 22:00:00"}
CREATE TABLE IF NOT EXISTS ng_settings (
    ba          VARCHAR(10)  NOT NULL,                  -- = batbl.ba
    skey        VARCHAR(50)  NOT NULL,
    svalue      TEXT         NOT NULL,                  -- JSON
    updated_by  VARCHAR(50)  NOT NULL,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (ba, skey)
) ENGINE=InnoDB;

-- Opening (AM) van stock of each daily sales report, kept when Cloud AOS opens the report so a
-- closed report still shows what the van started with (amstocktbl only holds the current day).
CREATE TABLE IF NOT EXISTS ng_dsr_amstock (
    dsrno       VARCHAR(30)   NOT NULL,                -- = dsrnotbl.dsrno
    smnno       VARCHAR(10)   NOT NULL,
    codeno      VARCHAR(30)   NOT NULL,
    qty         DECIMAL(18,4) NOT NULL DEFAULT 0,
    wt          DECIMAL(18,4) NOT NULL DEFAULT 0,
    PRIMARY KEY (dsrno, codeno)
) ENGINE=InnoDB;

-- Clinic monitoring (ClinicMonitoring.aspx had no tables of its own). Medical records: grant
-- access through form 088 only.
CREATE TABLE IF NOT EXISTS ng_clinic_supply (
    code        VARCHAR(10)   NOT NULL PRIMARY KEY,    -- MED0001
    name        VARCHAR(120)  NOT NULL,
    unit        VARCHAR(20)   NOT NULL DEFAULT 'pc',
    kind        VARCHAR(30)   NOT NULL DEFAULT 'Medicine',
    reorder     DECIMAL(12,2) NOT NULL DEFAULT 0,
    status      VARCHAR(10)   NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ng_clinic_visit (
    visitno     VARCHAR(20)   NOT NULL PRIMARY KEY,    -- CLN-26-00001
    ba          VARCHAR(10)   NOT NULL,
    transdate   DATE          NOT NULL,
    timein      CHAR(5)       NULL,
    ptype       VARCHAR(30)   NOT NULL,                -- Employee / Dependent / Visitor / contractor
    empno       VARCHAR(20)   NULL,                    -- = payemployeetbl.empno
    patient     VARCHAR(120)  NOT NULL,
    ccno        VARCHAR(10)   NULL,
    complaint   VARCHAR(200)  NOT NULL,
    bp          VARCHAR(10)   NULL,
    temp        DECIMAL(4,1)  NULL,
    pulse       INT           NULL,
    diagnosis   VARCHAR(300)  NULL,
    treatment   VARCHAR(300)  NULL,
    disposition VARCHAR(30)   NOT NULL,
    restdays    DECIMAL(4,1)  NOT NULL DEFAULT 0,
    returndate  DATE          NULL,
    attendedby  VARCHAR(80)   NULL,
    status      VARCHAR(10)   NOT NULL DEFAULT 'Closed',
    voidreason  VARCHAR(200)  NULL,
    voidby      VARCHAR(50)   NULL,
    user        VARCHAR(50)   NOT NULL,
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY ix_clinic_visit_date (transdate),
    KEY ix_clinic_visit_emp (empno)
) ENGINE=InnoDB;

-- Supply movements: receipts (+), write-offs (-) and what was given at a visit (-, visitno set).
CREATE TABLE IF NOT EXISTS ng_clinic_stock (
    id          BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(10)   NOT NULL,
    transdate   DATE          NOT NULL,
    qty         DECIMAL(12,2) NOT NULL,
    visitno     VARCHAR(20)   NULL,
    remarks     VARCHAR(200)  NULL,
    expiry      DATE          NULL,
    user        VARCHAR(50)   NOT NULL,
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY ix_clinic_stock_code (code),
    KEY ix_clinic_stock_visit (visitno)
) ENGINE=InnoDB;

INSERT IGNORE INTO ng_schema_migrations (version) VALUES ('002_ng_modules');
