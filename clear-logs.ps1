#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Clear old log files
.PARAMETER KeepDays
    Number of days of logs to keep (default: 7)
#>

param(
    [int]$KeepDays = 7
)

$LogDir = "D:\wallpaintingservices\logs"

if (-not (Test-Path $LogDir)) {
    Write-Host "No logs directory found." -ForegroundColor Yellow
    exit 0
}

$CutoffDate = (Get-Date).AddDays(-$KeepDays)
$OldLogs = Get-ChildItem -Path $LogDir -Filter "*.log" | Where-Object { $_.LastWriteTime -lt $CutoffDate }

if ($OldLogs.Count -eq 0) {
    Write-Host "No old logs to delete (keeping last $KeepDays days)" -ForegroundColor Green
} else {
    Write-Host "Found $($OldLogs.Count) log files older than $KeepDays days" -ForegroundColor Yellow
    $OldLogs | ForEach-Object {
        Write-Host "Deleting: $($_.Name)" -ForegroundColor Gray
        Remove-Item $_.FullName -Force
    }
    Write-Host "✓ Cleaned up $($OldLogs.Count) old log files" -ForegroundColor Green
}
