@echo off
echo ========================================
echo   Treasure Hunter - Build és Ngrok
echo ========================================
echo.

echo 1. Frontend build...
cd frontend
npm run build
if %errorlevel% neq 0 (
    echo Hiba a frontend build során!
    pause
    exit /b 1
)

echo.
echo 2. Template frissítése...
cd ..\backend
REM A build-elt HTML fájlban lévő fájlneveket kinyerjük és frissítjük a template-et
for /f "tokens=*" %%i in ('dir static\assets\*.js /b') do set JS_FILE=%%i
for /f "tokens=*" %%i in ('dir static\assets\*.css /b') do set CSS_FILE=%%i

echo JS fájl: %JS_FILE%
echo CSS fájl: %CSS_FILE%

REM Template frissítése a megfelelő fájlnevekkel
powershell -Command "(Get-Content 'templates\index.html') -replace 'index-Cz77L-Zh.js', '%JS_FILE%' -replace 'index-Bk6d3x9S.css', '%CSS_FILE%' | Set-Content 'templates\index.html'"

echo.
echo 3. Ngrok URL beállítása...
set /p NGROK_URL="Add meg az ngrok URL-t (pl: https://abc123.ngrok.io): "

if "%NGROK_URL%"=="" (
    echo Hiba: Nem adtál meg URL-t!
    pause
    exit /b 1
)

echo.
echo Ngrok URL beállítva: %NGROK_URL%
echo.

echo 4. Backend szerver indítása...
cd ..\backend

REM Környezeti változó beállítása
set NGROK_URL=%NGROK_URL%

REM Virtual environment aktiválása
call myvenv\Scripts\activate.bat

REM Django szerver indítása
echo Django szerver indítása...
python manage.py runserver

pause
