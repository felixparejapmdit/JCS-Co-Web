# Restored database backups (development only)

Put `*.sql` backups of the client databases here (`jcs`, `apf`, `chemag`, `bfi`, `bfi_admin`).
The development MySQL container (`docker compose --profile mysql up -d`) loads them on its first start.

These files contain client data. They are excluded from git and from Docker builds; never commit them.
