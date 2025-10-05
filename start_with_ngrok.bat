@echo off
echo ========================================
echo   Treasure Hunter - Ngrok indítás
echo ========================================
echo.

set /p NGROK_URL="Add meg az ngrok URL-t (pl: https://abc123.ngrok.io): "

if "%NGROK_URL%"=="" (
    echo Hiba: Nem adtál meg URL-t!
    pause
    exit /b 1
)

echo.
echo Ngrok URL beállítva: %NGROK_URL%
echo.

echo Backend szerver indítása...
cd backend

REM Környezeti változó beállítása
set NGROK_URL=%NGROK_URL%

REM Virtual environment aktiválása
call myvenv\Scripts\activate.bat

REM Django szerver indítása
echo Django szerver indítása...
python manage.py runserver

pause