[CmdletBinding()]
param(
  [Parameter(Mandatory)][ValidateSet('development', 'staging', 'production')][string]$Environment,
  [Parameter(Mandatory)][string]$BackupPath,
  [Parameter(Mandatory)][string]$MongoUri,
  [switch]$ConfirmProduction,
  [switch]$DryRun
)
$ErrorActionPreference = 'Stop'
if ($Environment -eq 'production' -and -not $ConfirmProduction) { throw 'Production restore requires -ConfirmProduction.' }
$resolvedBackup = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $BackupPath))
$root = [System.IO.Path]::GetPathRoot($resolvedBackup)
if ($resolvedBackup -eq $root -or $resolvedBackup.Length -lt ($root.Length + 4)) { throw 'BackupPath is too broad.' }
$safeUri = $MongoUri -replace '(mongodb(?:\+srv)?://[^:]+:)[^@]+@', '$1***@'
$commandText = "mongorestore --uri `"$safeUri`" --drop `"$resolvedBackup`""
Write-Output $commandText
if ($DryRun) { exit 0 }
if (-not (Test-Path -LiteralPath $resolvedBackup -PathType Container)) { throw "Backup path does not exist: $resolvedBackup" }
if (-not (Get-Command mongorestore -ErrorAction SilentlyContinue)) { throw 'mongorestore is not installed or not available in PATH.' }
& mongorestore --uri $MongoUri --drop $resolvedBackup
if ($LASTEXITCODE -ne 0) { throw "mongorestore failed with exit code $LASTEXITCODE." }
Write-Output "Restore completed from: $resolvedBackup"
