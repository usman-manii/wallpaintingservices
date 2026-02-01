# PowerShell Execution Policy Setup Script
# Run this ONCE in PowerShell (outside VS Code) as Administrator or regular user

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  PowerShell Execution Policy Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check current execution policy
$currentPolicy = Get-ExecutionPolicy -Scope CurrentUser
Write-Host "Current Execution Policy (CurrentUser): $currentPolicy" -ForegroundColor Yellow
Write-Host ""

if ($currentPolicy -eq "RemoteSigned" -or $currentPolicy -eq "Unrestricted") {
    Write-Host "✓ Execution policy is already configured correctly!" -ForegroundColor Green
    Write-Host "  No changes needed." -ForegroundColor Green
} else {
    Write-Host "Setting execution policy to RemoteSigned..." -ForegroundColor Yellow
    Write-Host ""
    
    try {
        Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
        Write-Host "✓ Execution policy set successfully!" -ForegroundColor Green
        Write-Host "  You can now run PowerShell scripts." -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to set execution policy: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "If you see an access denied error, try running PowerShell as Administrator:" -ForegroundColor Yellow
        Write-Host "  Right-click PowerShell -> Run as Administrator" -ForegroundColor White
        Write-Host "  Then run this script again" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Current Execution Policy Settings:" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Get-ExecutionPolicy -List | Format-Table -AutoSize

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
