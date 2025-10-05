Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Treasure Hunter - Ngrok indítás" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Backend szerver indítása..." -ForegroundColor Yellow
Set-Location backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", ".\myvenv\Scripts\Activate.ps1; python manage.py runserver"
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "2. Frontend szerver indítása..." -ForegroundColor Yellow
Set-Location ..\frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
Start-Sleep -Seconds 5

Write-Host ""
Write-Host ""
Write-Host "3. Ngrok URL beállítása..." -ForegroundColor Yellow
$ngrokUrl = Read-Host "Add meg az ngrok URL-t (pl: https://abc123.ngrok.io)"

if ([string]::IsNullOrWhiteSpace($ngrokUrl)) {
    Write-Host "Hiba: Nem adtál meg URL-t!" -ForegroundColor Red
    Read-Host "Nyomj Enter-t a kilépéshez"
    exit 1
}

Write-Host ""
Write-Host "Ngrok URL beállítva: $ngrokUrl" -ForegroundColor Green
Write-Host ""

Write-Host "Backend szerver indítása..." -ForegroundColor Yellow
Set-Location backend

# Környezeti változó beállítása
$env:NGROK_URL = $ngrokUrl

# Virtual environment aktiválása
& ".\myvenv\Scripts\Activate.ps1"

# Django szerver indítása
Write-Host "Django szerver indítása..." -ForegroundColor Green
python manage.py runserver

Read-Host "Nyomj Enter-t a kilépéshez"
