-- Cloud AOS sign-in log (Administration > Logs > Sign-in Log).
--
-- Run once in EACH company database (jcs, apf, chemag), on the test copy first:
--   mysql -h <host> -u <admin user> -p chemag < database/mysql/004_ng_signin_log.sql
--
-- One row per sign-in attempt (successful or not) and per sign-out. Rows older than 12 months are
-- removed by the application, since they hold IP addresses. Passwords are never written here.
-- Additive only: it never changes a legacy table, and it is safe to run again.

CREATE TABLE IF NOT EXISTS ng_signin_log (
    id            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    occurred_at   DATETIME     NOT NULL,
    username      VARCHAR(50)  NOT NULL,
    outcome       VARCHAR(20)  NOT NULL,              -- success, wrong_password, unknown_user, locked, locked_out,
                                                      -- inactive, maintenance, rate_limited, signed_out
    detail        VARCHAR(255) NULL,
    ip_address    VARCHAR(45)  NULL,
    user_agent    VARCHAR(255) NULL,
    INDEX idx_ng_signin_time (occurred_at),
    INDEX idx_ng_signin_user (username, occurred_at)
) ENGINE=InnoDB;

INSERT IGNORE INTO ng_schema_migrations (version) VALUES ('004_ng_signin_log');
