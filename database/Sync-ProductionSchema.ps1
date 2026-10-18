<#
.SYNOPSIS
    Copies the database STRUCTURE (no data) from a production AOS100 MySQL server into the local
    MySQL, then reports every difference against the structure recovered from the legacy code
    (database/schema_from_code.sql).

.DESCRIPTION
    Two ways to use it:

    1. Direct: your PC is on the client's VPN and IT created a read-only MySQL login for you.
         .\Sync-ProductionSchema.ps1 -ProdHost <production-host> -ProdUser <read-only-user>

    2. From a file: IT runs the dump command on the server (see -FromFile help) and sends you the file.
         .\Sync-ProductionSchema.ps1 -FromFile C:\Temp\chemag_schema.sql

    Each company database may live on a different server. Run the script once per server; each run
    replaces only the databases found on that server.

    Only structure is copied (tables, columns, types, keys, indexes, views, triggers, routines).
    No production data is read or copied.

.PARAMETER ProdHost
    Production MySQL host (office LAN or Radmin VPN address).

.PARAMETER ProdUser
    Read-only MySQL login on the production server. Never use root.

.PARAMETER Databases
    Databases to copy if present on that server. Default: jcs, apf, chemag, bfi, bfi_admin.

.PARAMETER FromFile
    Schema file produced on the server by IT with:
      mysqldump -u root -p --no-data --routines --triggers --events --skip-lock-tables
                --databases jcs apf chemag bfi bfi_admin > aos_schema.sql
    (list only the databases that exist on that server)

.PARAMETER Force
    Replace local databases even if they contain data.

.NOTES
    Passwords are asked for securely. For unattended runs set the environment variables
    AOS_PROD_MYSQL_PWD and AOS_LOCAL_MYSQL_PWD instead.
#>
[CmdletBinding()]
param(
    [string]$ProdHost,
    [int]$ProdPort = 3306,
    [string]$ProdUser,
    [string[]]$Databases = @('jcs', 'apf', 'chemag', 'bfi', 'bfi_admin'),
    [string]$FromFile,
    [string]$LocalHost = '127.0.0.1',
    [int]$LocalPort = 3306,
    [string]$LocalUser = 'root',
    [string]$MySqlBin = 'C:\Program Files\MySQL\MySQL Server 8.0\bin',
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$outDir = Join-Path $here 'production_schema'
$codeSchema = Join-Path $here 'schema_from_code.sql'
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$mysql = Join-Path $MySqlBin 'mysql.exe'
$mysqldump = Join-Path $MySqlBin 'mysqldump.exe'

function Get-Secret([string]$envName, [string]$prompt) {
    $v = [Environment]::GetEnvironmentVariable($envName)
    if ($v) { return $v }
    $sec = Read-Host -Prompt $prompt -AsSecureString
    return [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
}

function Invoke-MySql([string]$h, [int]$p, [string]$u, [string]$pwd, [string]$sql) {
    $env:MYSQL_PWD = $pwd
    try {
        $out = & $mysql -h $h -P $p -u $u -N -B -e $sql 2>&1
        if ($LASTEXITCODE -ne 0) { throw ($out | Out-String) }
        return $out
    } finally { Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue }
}

if (-not (Test-Path $mysql)) { throw "mysql.exe not found in '$MySqlBin'. Use -MySqlBin to point to your MySQL bin folder." }
if (-not $FromFile -and (-not $ProdHost -or -not $ProdUser)) { throw "Give either -FromFile, or both -ProdHost and -ProdUser." }
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$serverInfo = $null

# ---------------------------------------------------------------- 1. Get the production schema
if ($FromFile) {
    if (-not (Test-Path $FromFile)) { throw "File not found: $FromFile" }
    $dumpFile = Join-Path $outDir ("schema_fromfile_$stamp.sql")
    Copy-Item $FromFile $dumpFile
    $source = "file $FromFile"
} else {
    Write-Host "Checking $ProdHost`:$ProdPort ..."
    $tcp = New-Object System.Net.Sockets.TcpClient
    $reachable = $false
    try { $reachable = $tcp.ConnectAsync($ProdHost, $ProdPort).Wait(4000) } catch {}
    $tcp.Close()
    if (-not $reachable) {
        throw "Cannot reach MySQL on $ProdHost`:$ProdPort. Check the VPN, the server's MySQL bind-address and firewall (see ProductionAccess.md)."
    }
    $prodPwd = Get-Secret 'AOS_PROD_MYSQL_PWD' "Password for $ProdUser on $ProdHost"
    $info = Invoke-MySql $ProdHost $ProdPort $ProdUser $prodPwd "SELECT VERSION(), @@GLOBAL.sql_mode, @@lower_case_table_names, @@character_set_server, @@collation_server"
    $f = ($info | Select-Object -First 1) -split "`t"
    $serverInfo = [ordered]@{ Version = $f[0]; SqlMode = $f[1]; LowerCaseTableNames = $f[2]; Charset = $f[3]; Collation = $f[4] }
    $onServer = Invoke-MySql $ProdHost $ProdPort $ProdUser $prodPwd "SHOW DATABASES"
    $present = @($Databases | Where-Object { $onServer -contains $_ })
    if ($present.Count -eq 0) { throw "None of [$($Databases -join ', ')] exist on $ProdHost (or $ProdUser cannot see them)." }
    Write-Host "Databases on $ProdHost`: $($present -join ', ')"

    $dumpFile = Join-Path $outDir ("schema_{0}_{1}.sql" -f ($ProdHost -replace '[^\w.]', '_'), $stamp)
    $common = @('-h', $ProdHost, '-P', $ProdPort, '-u', $ProdUser, '--no-data', '--skip-lock-tables',
                '--column-statistics=0', '--set-gtid-purged=OFF', '--default-character-set=utf8mb4',
                "--result-file=$dumpFile", '--databases') + $present
    $env:MYSQL_PWD = $prodPwd
    try {
        & $mysqldump @(@('--routines', '--triggers', '--events') + $common) 2>&1 | Write-Host
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Dump with routines/events failed (the login may lack those rights). Retrying with tables, views and triggers only."
            & $mysqldump @(@('--triggers') + $common) 2>&1 | Write-Host
            if ($LASTEXITCODE -ne 0) { throw "mysqldump failed. See messages above." }
        }
    } finally { Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue }
    $source = "$ProdHost`:$ProdPort as $ProdUser"
}

# Remove DEFINER clauses so views / triggers / routines restore under the local root account
$text = [IO.File]::ReadAllText($dumpFile)
$text = [regex]::Replace($text, 'DEFINER=`[^`]*`@`[^`]*`', '')
[IO.File]::WriteAllText($dumpFile, $text, (New-Object Text.UTF8Encoding $false))
$dbsInFile = @([regex]::Matches($text, 'CREATE DATABASE (?:/\*!\d+ IF NOT EXISTS\*/ )?`([^`]+)`') | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique)
if ($dbsInFile.Count -eq 0) { throw "No CREATE DATABASE statements in the schema file. The dump must be made with --databases." }
Write-Host "Schema file: $dumpFile"
Write-Host "Databases in file: $($dbsInFile -join ', ')"

# ---------------------------------------------------------------- 2. Replace the local databases
$localPwd = Get-Secret 'AOS_LOCAL_MYSQL_PWD' "Password for local MySQL user $LocalUser"
$inList = ($dbsInFile | ForEach-Object { "'$_'" }) -join ','
$rows = Invoke-MySql $LocalHost $LocalPort $LocalUser $localPwd "SELECT table_schema, table_name, table_rows FROM information_schema.tables WHERE table_schema IN ($inList) AND table_type='BASE TABLE' AND table_rows > 0 AND table_name <> 'batbl'"
if ($rows -and -not $Force) {
    throw "Local databases contain data in: $(($rows | ForEach-Object { ($_ -split "`t")[0..1] -join '.' }) -join ', '). Re-run with -Force to replace them anyway."
}
foreach ($db in $dbsInFile) { Invoke-MySql $LocalHost $LocalPort $LocalUser $localPwd "DROP DATABASE IF EXISTS ``$db``" | Out-Null }
Write-Host "Restoring structure into local MySQL ..."
$env:MYSQL_PWD = $localPwd
try {
    $restore = cmd /c "`"$mysql`" -h $LocalHost -P $LocalPort -u $LocalUser --default-character-set=utf8mb4 < `"$dumpFile`" 2>&1"
    if ($LASTEXITCODE -ne 0) { throw "Restore failed: $($restore | Out-String)" }
} finally { Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue }

# ---------------------------------------------------------------- 3. Compare with the code catalog
$code = @{}
$currentDb = $null
foreach ($line in [IO.File]::ReadAllLines($codeSchema)) {
    if ($line -match '^USE `([^`]+)`;') { $currentDb = $Matches[1]; continue }
    if ($line -match '^CREATE TABLE IF NOT EXISTS `([^`]+)`') { $t = $Matches[1]; $code["$currentDb.$t"] = New-Object System.Collections.Generic.List[string]; continue }
    if ($line -match '^\s+`([^`]+)` ' -and $t -and $line -notmatch 'placeholder') { $code["$currentDb.$t"].Add($Matches[1]) }
}

$prod = @{}; $prodTypes = @{}
$cols = Invoke-MySql $LocalHost $LocalPort $LocalUser $localPwd "SELECT c.table_schema, c.table_name, c.column_name, c.column_type, t.table_type FROM information_schema.columns c JOIN information_schema.tables t ON t.table_schema=c.table_schema AND t.table_name=c.table_name WHERE c.table_schema IN ($inList) ORDER BY c.table_schema, c.table_name, c.ordinal_position"
$views = @{}
foreach ($r in $cols) {
    $f = $r -split "`t"
    $key = "$($f[0]).$($f[1].ToLower())"
    if (-not $prod.ContainsKey($key)) { $prod[$key] = New-Object System.Collections.Generic.List[string] }
    $prod[$key].Add($f[2].ToLower()); $prodTypes["$key.$($f[2].ToLower())"] = $f[3]
    if ($f[4] -eq 'VIEW') { $views[$key] = $true }
}
$objs = Invoke-MySql $LocalHost $LocalPort $LocalUser $localPwd "SELECT 'routine', routine_schema, routine_name FROM information_schema.routines WHERE routine_schema IN ($inList) UNION ALL SELECT 'trigger', trigger_schema, trigger_name FROM information_schema.triggers WHERE trigger_schema IN ($inList) UNION ALL SELECT 'event', event_schema, event_name FROM information_schema.events WHERE event_schema IN ($inList)"

$codeKeys = @($code.Keys | Where-Object { $dbsInFile -contains ($_ -split '\.')[0] })
$onlyProd = @($prod.Keys | Where-Object { -not $code.ContainsKey($_) } | Sort-Object)
$onlyCode = @($codeKeys | Where-Object { -not $prod.ContainsKey($_) } | Sort-Object)
$both = @($codeKeys | Where-Object { $prod.ContainsKey($_) } | Sort-Object)

$r = New-Object System.Text.StringBuilder
[void]$r.AppendLine("# Production Schema Sync Report")
[void]$r.AppendLine("")
[void]$r.AppendLine("- **Date:** $(Get-Date -Format 'yyyy-MM-dd HH:mm')")
[void]$r.AppendLine("- **Source:** $source")
[void]$r.AppendLine("- **Schema file:** ``$(Split-Path -Leaf $dumpFile)``")
[void]$r.AppendLine("- **Databases synced to local MySQL:** $($dbsInFile -join ', ')")
if ($serverInfo) {
    [void]$r.AppendLine("- **Production server:** MySQL $($serverInfo.Version); sql_mode ``$($serverInfo.SqlMode)``; lower_case_table_names $($serverInfo.LowerCaseTableNames); charset $($serverInfo.Charset) / $($serverInfo.Collation)")
}
[void]$r.AppendLine("")
[void]$r.AppendLine("## Summary")
[void]$r.AppendLine("")
[void]$r.AppendLine("| | Count |")
[void]$r.AppendLine("| :--- | ---: |")
[void]$r.AppendLine("| Tables / views in production | $($prod.Count) |")
[void]$r.AppendLine("| Views in production | $($views.Count) |")
[void]$r.AppendLine("| Routines, triggers, events in production | $(@($objs).Count) |")
[void]$r.AppendLine("| Tables in production but **not used by the code** | $($onlyProd.Count) |")
[void]$r.AppendLine("| Tables the code uses but **missing in production** | $($onlyCode.Count) |")
[void]$r.AppendLine("")
[void]$r.AppendLine("## Tables the code uses but are missing in production")
[void]$r.AppendLine("")
[void]$r.AppendLine("Usually runtime work tables the app creates itself (``temp*``), or tables kept on another server. Anything else needs checking.")
[void]$r.AppendLine("")
if ($onlyCode.Count) { $onlyCode | ForEach-Object { [void]$r.AppendLine("- ``$_``") } } else { [void]$r.AppendLine("_None._") }
[void]$r.AppendLine("")
[void]$r.AppendLine("## Tables in production not used by the web code")
[void]$r.AppendLine("")
[void]$r.AppendLine("Possibly used by the older desktop AOS100, reports, or no longer used.")
[void]$r.AppendLine("")
if ($onlyProd.Count) {
    foreach ($k in $onlyProd) {
        $kind = ''
        if ($views[$k]) { $kind = ', view' }
        [void]$r.AppendLine('- `' + $k + '` (' + $prod[$k].Count + ' columns' + $kind + ')')
    }
} else { [void]$r.AppendLine("_None._") }
[void]$r.AppendLine("")
[void]$r.AppendLine("## Column differences in shared tables")
[void]$r.AppendLine("")
[void]$r.AppendLine("| Table | Columns only in production | Columns the code uses but missing in production |")
[void]$r.AppendLine("| :--- | :--- | :--- |")
$diffCount = 0
foreach ($k in $both) {
    $p = $prod[$k]; $c = $code[$k]
    $po = @($p | Where-Object { $c -notcontains $_ }); $co = @($c | Where-Object { $p -notcontains $_ })
    if ($po.Count -or $co.Count) {
        $diffCount++
        $poText = '-'
        if ($po.Count) { $poText = ($po | ForEach-Object { '`' + $_ + '` (' + $prodTypes[$k + '.' + $_] + ')' }) -join ', ' }
        $coText = '-'
        if ($co.Count) { $coText = ($co | ForEach-Object { '`' + $_ + '`' }) -join ', ' }
        [void]$r.AppendLine('| `' + $k + '` | ' + $poText + ' | ' + $coText + ' |')
    }
}
if (-not $diffCount) { [void]$r.AppendLine("| _No differences_ | | |") }
[void]$r.AppendLine("")
if (@($objs).Count) {
    [void]$r.AppendLine("## Routines, triggers and events in production")
    [void]$r.AppendLine("")
    [void]$r.AppendLine("These hold business logic outside the application code and must be reviewed (PLAN.md Section 7.4).")
    [void]$r.AppendLine("")
    foreach ($o in $objs) { $f = $o -split "`t"; [void]$r.AppendLine('- ' + $f[0] + ': `' + $f[1] + '.' + $f[2] + '`') }
}
$report = Join-Path $outDir "sync_report_$stamp.md"
[IO.File]::WriteAllText($report, $r.ToString(), (New-Object Text.UTF8Encoding $false))

Write-Host ""
Write-Host "Done. Local MySQL now has the production structure for: $($dbsInFile -join ', ')" -ForegroundColor Green
Write-Host ("Tables: {0} | not in code: {1} | code tables missing in production: {2} | tables with column differences: {3}" -f $prod.Count, $onlyProd.Count, $onlyCode.Count, $diffCount)
Write-Host "Report: $report"
