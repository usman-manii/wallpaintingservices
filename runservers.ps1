#!/usr/bin/env pwsh
# Enhanced PowerShell Script for Running Development Servers
# Includes better error handling and logging

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

# Navigate to repository root
Set-Location -Path $PSScriptRoot

Write-ColorOutput Green "🚀 Starting Wall Painting Services CMS..."
Write-ColorOutput Cyan "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Force stop any running instances
Write-ColorOutput Yellow "🔄 Checking for running server instances..."
$stoppedProcesses = $false

# Stop all node processes
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-ColorOutput Yellow "   Stopping $($nodeProcesses.Count) node process(es)..."
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    $stoppedProcesses = $true
}

# Force kill processes on ports 3000 and 3001
$ports = @(3000, 3001)
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pid in $pids) {
            try {
                Write-ColorOutput Yellow "   Stopping process $pid on port $port..."
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                $stoppedProcesses = $true
            } catch {
                # Process might already be stopped
            }
        }
    }
}

# Clean up Next.js dev lock and cache
if (Test-Path "frontend\.next\dev\lock") {
    Write-ColorOutput Yellow "   Removing Next.js dev lock..."
    Remove-Item "frontend\.next\dev\lock" -Force -ErrorAction SilentlyContinue
}

if ($stoppedProcesses) {
    Write-ColorOutput Green "✓ Stopped running instances"
    Write-ColorOutput Yellow "   Waiting for ports to be released..."
    Start-Sleep -Seconds 3
} else {
    Write-ColorOutput Green "✓ No running instances found"
}

# Check Node.js version
Write-ColorOutput Yellow "📦 Checking Node.js version..."
try {
    $nodeVersion = node --version
    Write-ColorOutput Green "✓ Node.js version: $nodeVersion"
    
    # Extract major version number
    $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($majorVersion -lt 24) {
        Write-ColorOutput Red "❌ Error: Node.js 24.0.0 or higher is required!"
        Write-ColorOutput Yellow "   Current version: $nodeVersion"
        Write-ColorOutput Yellow "   Please upgrade Node.js: https://nodejs.org/"
        exit 1
    }
} catch {
    Write-ColorOutput Red "❌ Error: Node.js is not installed!"
    Write-ColorOutput Yellow "   Please install Node.js 24.0.0 or higher: https://nodejs.org/"
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-ColorOutput Yellow "📥 Installing dependencies (first time setup)..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "❌ Failed to install dependencies!"
        exit 1
    }
    Write-ColorOutput Green "✓ Dependencies installed successfully"
}

# Check environment files
Write-ColorOutput Yellow "🔍 Checking environment configuration..."

if (-not (Test-Path "backend\.env")) {
    Write-ColorOutput Red "❌ Error: backend\.env file not found!"
    Write-ColorOutput Yellow "   Please copy backend\.env.example to backend\.env and configure it"
    exit 1
}

if (-not (Test-Path "frontend\.env")) {
    Write-ColorOutput Red "❌ Error: frontend\.env file not found!"
    Write-ColorOutput Yellow "   Please copy frontend\.env.example to frontend\.env and configure it"
    exit 1
}

Write-ColorOutput Green "✓ Environment files found"

# Check if Docker is running (for PostgreSQL)
Write-ColorOutput Yellow "🐳 Checking Docker status..."
try {
    docker ps | Out-Null
    Write-ColorOutput Green "✓ Docker is running"
    
    # Check if database container is running
    $dbContainer = docker ps --filter "name=cms_db" --format "{{.Names}}"
    if (-not $dbContainer) {
        Write-ColorOutput Yellow "⚠ Database container not running. Starting it..."
        docker-compose up -d postgres
        Start-Sleep -Seconds 5
        Write-ColorOutput Green "✓ Database container started"
    } else {
        Write-ColorOutput Green "✓ Database container is running"
    }
} catch {
    Write-ColorOutput Yellow "⚠ Docker is not running. Make sure PostgreSQL is available!"
    Write-ColorOutput Yellow "   Option 1: Start Docker Desktop"
    Write-ColorOutput Yellow "   Option 2: Use local PostgreSQL installation"
}

Write-ColorOutput Cyan "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-ColorOutput Green "🎯 Starting development servers..."
Write-ColorOutput Cyan ""
Write-ColorOutput White "   Backend:  http://localhost:3001"
Write-ColorOutput White "   Frontend: http://localhost:3000"
Write-ColorOutput White "   API Docs: http://localhost:3001/api/docs"
Write-ColorOutput Cyan ""
Write-ColorOutput Yellow "Press Ctrl+C to stop all servers"
Write-ColorOutput Cyan "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-ColorOutput Cyan ""

# Run development servers
npm run dev
