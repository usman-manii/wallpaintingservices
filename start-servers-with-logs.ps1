#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start both frontend and backend servers with comprehensive logging
.DESCRIPTION
    Kills old processes, creates log directory, and starts servers with timestamped logs
#>

$ErrorActionPreference = "Continue"
$LogDir = "D:\wallpaintingservices\logs"
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

# Create logs directory
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    Write-Host "Created logs directory: $LogDir" -ForegroundColor Green
}

# Kill old processes
Write-Host "`n=== Cleaning up old processes ===" -ForegroundColor Yellow
Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | 
    Where-Object { $_.LocalPort -in @(3000, 3001) } | 
    ForEach-Object { 
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
    }

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "✓ Killed old processes on ports 3000, 3001" -ForegroundColor Green

Start-Sleep -Seconds 2

# Backend Server with Logging
$BackendLogFile = Join-Path $LogDir "backend_$Timestamp.log"
$BackendErrorLog = Join-Path $LogDir "backend_$Timestamp.error.log"

Write-Host "`n=== Starting Backend Server ===" -ForegroundColor Green
Write-Host "Backend logs: $BackendLogFile" -ForegroundColor Cyan
Write-Host "Backend errors: $BackendErrorLog" -ForegroundColor Cyan

$BackendScript = @"
Set-Location 'D:\wallpaintingservices\backend'
Write-Host '=== BACKEND SERVER (Port 3001) ===' -ForegroundColor Green
Write-Host 'Logs: $BackendLogFile' -ForegroundColor Cyan
Write-Host 'Errors: $BackendErrorLog' -ForegroundColor Cyan
Write-Host ''
npm run dev 2>&1 | Tee-Object -FilePath '$BackendLogFile' -Append | ForEach-Object {
    `$line = `$_.ToString()
    if (`$line -match 'error|fail|exception|warn') {
        Write-Host `$line -ForegroundColor Red
        `$line | Out-File -FilePath '$BackendErrorLog' -Append
    } else {
        Write-Host `$line
    }
}
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $BackendScript

Start-Sleep -Seconds 3

# Frontend Server with Logging
$FrontendLogFile = Join-Path $LogDir "frontend_$Timestamp.log"
$FrontendErrorLog = Join-Path $LogDir "frontend_$Timestamp.error.log"

Write-Host "`n=== Starting Frontend Server ===" -ForegroundColor Cyan
Write-Host "Frontend logs: $FrontendLogFile" -ForegroundColor Cyan
Write-Host "Frontend errors: $FrontendErrorLog" -ForegroundColor Cyan

$FrontendScript = @"
Set-Location 'D:\wallpaintingservices\frontend'
Write-Host '=== FRONTEND SERVER (Port 3000) ===' -ForegroundColor Cyan
Write-Host 'Logs: $FrontendLogFile' -ForegroundColor Cyan
Write-Host 'Errors: $FrontendErrorLog' -ForegroundColor Cyan
Write-Host ''
npm run dev 2>&1 | Tee-Object -FilePath '$FrontendLogFile' -Append | ForEach-Object {
    `$line = `$_.ToString()
    if (`$line -match 'error|fail|exception|warn|⨯') {
        Write-Host `$line -ForegroundColor Red
        `$line | Out-File -FilePath '$FrontendErrorLog' -Append
    } else {
        Write-Host `$line
    }
}
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $FrontendScript

Write-Host "`n=== Servers Started Successfully ===" -ForegroundColor Green
Write-Host "✓ Backend: http://localhost:3001 → Logs: $BackendLogFile" -ForegroundColor Green
Write-Host "✓ Frontend: http://localhost:3000 → Logs: $FrontendLogFile" -ForegroundColor Green
Write-Host "`nAll logs saved to: $LogDir" -ForegroundColor Yellow
Write-Host "To view latest errors: Get-Content '$LogDir\*error.log' -Tail 50" -ForegroundColor Yellow
Write-Host "To view all logs: Get-Content '$LogDir\*.log' -Tail 100" -ForegroundColor Yellow
