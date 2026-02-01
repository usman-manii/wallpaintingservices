#!/usr/bin/env pwsh
<#
.SYNOPSIS
    View server logs in real-time or check recent logs
.PARAMETER Mode
    'tail' - Follow logs in real-time (default)
    'errors' - Show only errors
    'latest' - Show last 100 lines
    'all' - Show all logs
.PARAMETER Server
    'backend', 'frontend', or 'both' (default)
#>

param(
    [string]$Mode = "tail",
    [string]$Server = "both"
)

$LogDir = "D:\wallpaintingservices\logs"

if (-not (Test-Path $LogDir)) {
    Write-Host "No logs directory found. Run start-servers-with-logs.ps1 first." -ForegroundColor Red
    exit 1
}

function Get-LatestLogFiles {
    param([string]$Pattern)
    Get-ChildItem -Path $LogDir -Filter $Pattern | Sort-Object LastWriteTime -Descending | Select-Object -First 1
}

switch ($Mode) {
    "tail" {
        Write-Host "=== Real-time Log Viewer ===" -ForegroundColor Green
        Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
        Write-Host ""
        
        if ($Server -eq "backend" -or $Server -eq "both") {
            $BackendLog = Get-LatestLogFiles "backend_*.log"
            if ($BackendLog) {
                Write-Host "Following: $($BackendLog.FullName)" -ForegroundColor Cyan
                Get-Content $BackendLog.FullName -Wait -Tail 20
            }
        }
        
        if ($Server -eq "frontend" -or $Server -eq "both") {
            $FrontendLog = Get-LatestLogFiles "frontend_*.log"
            if ($FrontendLog) {
                Write-Host "Following: $($FrontendLog.FullName)" -ForegroundColor Cyan
                Get-Content $FrontendLog.FullName -Wait -Tail 20
            }
        }
    }
    
    "errors" {
        Write-Host "=== Recent Errors ===" -ForegroundColor Red
        Write-Host ""
        
        if ($Server -eq "backend" -or $Server -eq "both") {
            $BackendErrors = Get-LatestLogFiles "backend_*.error.log"
            if ($BackendErrors -and (Test-Path $BackendErrors.FullName)) {
                Write-Host "[BACKEND ERRORS]" -ForegroundColor Red
                Get-Content $BackendErrors.FullName -Tail 50 | ForEach-Object {
                    Write-Host $_ -ForegroundColor Red
                }
                Write-Host ""
            }
        }
        
        if ($Server -eq "frontend" -or $Server -eq "both") {
            $FrontendErrors = Get-LatestLogFiles "frontend_*.error.log"
            if ($FrontendErrors -and (Test-Path $FrontendErrors.FullName)) {
                Write-Host "[FRONTEND ERRORS]" -ForegroundColor Red
                Get-Content $FrontendErrors.FullName -Tail 50 | ForEach-Object {
                    Write-Host $_ -ForegroundColor Red
                }
            }
        }
    }
    
    "latest" {
        Write-Host "=== Last 100 Log Lines ===" -ForegroundColor Yellow
        Write-Host ""
        
        if ($Server -eq "backend" -or $Server -eq "both") {
            $BackendLog = Get-LatestLogFiles "backend_*.log"
            if ($BackendLog) {
                Write-Host "[BACKEND - $($BackendLog.Name)]" -ForegroundColor Green
                Get-Content $BackendLog.FullName -Tail 100
                Write-Host ""
            }
        }
        
        if ($Server -eq "frontend" -or $Server -eq "both") {
            $FrontendLog = Get-LatestLogFiles "frontend_*.log"
            if ($FrontendLog) {
                Write-Host "[FRONTEND - $($FrontendLog.Name)]" -ForegroundColor Cyan
                Get-Content $FrontendLog.FullName -Tail 100
            }
        }
    }
    
    "all" {
        Write-Host "=== All Available Logs ===" -ForegroundColor Yellow
        Get-ChildItem -Path $LogDir -Filter "*.log" | Sort-Object LastWriteTime -Descending | ForEach-Object {
            Write-Host ""
            Write-Host "[$($_.Name)] - $($_.LastWriteTime)" -ForegroundColor Cyan
            Write-Host "Size: $([math]::Round($_.Length/1KB, 2)) KB" -ForegroundColor Gray
        }
    }
}
