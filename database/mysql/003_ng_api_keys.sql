-- Cloud AOS public API keys (Administration > System > API Keys, docs/API.md).
--
-- Run once in EACH company database (jcs, apf, chemag), on the test copy first:
--   mysql -h <host> -u <admin user> -p chemag < database/mysql/003_ng_api_keys.sql
--
-- Only the SHA-256 hash of a key is stored; the key itself is shown once, when it is created.
-- Additive only: it never changes a legacy table, and it is safe to run again.

CREATE TABLE IF NOT EXISTS ng_api_keys (
    id            VARCHAR(40)  NOT NULL PRIMARY KEY,
    name          VARCHAR(80)  NOT NULL,              -- who uses it, e.g. "JCS head office reports"
    prefix        VARCHAR(20)  NOT NULL,              -- first characters, to recognise a key
    hash          CHAR(64)     NOT NULL UNIQUE,       -- SHA-256 of the whole key
    ug_code       VARCHAR(50)  NOT NULL,              -- the user group whose rights the key has
    created_by    VARCHAR(50)  NOT NULL,
    created_at    DATETIME     NOT NULL,
    last_used_at  DATETIME     NULL,
    revoked_at    DATETIME     NULL
) ENGINE=InnoDB;

INSERT IGNORE INTO ng_schema_migrations (version) VALUES ('003_ng_api_keys');
