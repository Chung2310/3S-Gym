[CmdletBinding()]
param(
  [Parameter(Mandatory)][ValidateSet('development', 'staging', 'production')][string]$Environment,
  [Parameter(Mandatory)][string]$OutputPath,
  [Parameter(Mandatory)][string]$MongoUri,
  [switch]$ConfirmProduction,
  [switch]$DryRun
)
$ErrorActionPreference = 'Stop'
if ($Environment -eq 'production' -and -not $ConfirmProduction) { throw 'Production backup requires -ConfirmProduction.' }
$resolvedOutput = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $OutputPath))
$root = [System.IO.Path]::GetPathRoot($resolvedOutput)
if ($resolvedOutput -eq $root -or $resolvedOutput.Length -lt ($root.Length + 4)) { throw 'OutputPath is too broad.' }
$safeUri = $MongoUri -replace '(mongodb(?:\+srv)?://[^:]+:)[^@]+@', '$1***@'
$commandText = "mongodump --uri `"$safeUri`" --out `"$resolvedOutput`""
Write-Output $commandText
if ($DryRun) { exit 0 }
if (Test-Path -LiteralPath $resolvedOutput) { throw "Backup target already exists: $resolvedOutput" }
if (-not (Get-Command mongodump -ErrorAction SilentlyContinue)) { throw 'mongodump is not installed or not available in PATH.' }
New-Item -ItemType Directory -Path $resolvedOutput | Out-Null
& mongodump --uri $MongoUri --out $resolvedOutput
if ($LASTEXITCODE -ne 0) { throw "mongodump failed with exit code $LASTEXITCODE." }
$manifest = Get-ChildItem -LiteralPath $resolvedOutput -File -Recurse | ForEach-Object { [PSCustomObject]@{ path = $_.FullName.Substring($resolvedOutput.Length + 1); length = $_.Length; sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash } }
$manifest | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath (Join-Path $resolvedOutput 'manifest.json') -Encoding UTF8
Write-Output "Backup completed: $resolvedOutput"
