# Development Servers Startup Script
# Run this in a PowerShell window OUTSIDE VS Code to avoid SIGINT interruptions

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Wall Painting Services - Dev Server Launcher" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check execution policy
$policy = Get-ExecutionPolicy -Scope CurrentUser
if ($policy -eq "Restricted" -or $policy -eq "AllSigned") {
    Write-Host "⚠️  Execution policy needs to be configured" -ForegroundColor Yellow
    Write-Host "   Run: .\setup-powershell.ps1 first" -ForegroundColor White
    Write-Host ""
    Write-Host "   Or manually run:" -ForegroundColor White
    Write-Host "   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force" -ForegroundColor Gray
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Ensure we're in the correct directory
$projectRoot = "D:\wallpaintingservices"
Set-Location $projectRoot

Write-Host "✓ Project root: $projectRoot" -ForegroundColor Green
Write-Host ""

# Kill any existing node processes
Write-Host "Cleaning up existing node processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✓ Cleanup complete" -ForegroundColor Green
Write-Host ""

# Start the servers
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Starting Backend (port 3001) + Frontend (port 3000)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Keep this window open!" -ForegroundColor Yellow
Write-Host "DO NOT press Ctrl+C unless you want to stop the servers" -ForegroundColor Yellow
Write-Host ""
Write-Host "Access URLs:" -ForegroundColor Cyan
Write-Host "  Frontend:    http://localhost:3000" -ForegroundColor White
Write-Host "  Backend API: http://localhost:3001" -ForegroundColor White
Write-Host "  Swagger:     http://localhost:3001/api/docs" -ForegroundColor White
Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Yellow
Write-Host ""

# Run the dev command
npm run dev
