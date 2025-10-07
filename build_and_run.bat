@echo off
echo ========================================
echo   Treasure Hunter - Build és Run
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
echo 2. Template már fix fájlneveket használ...
cd ..\backend

echo.
echo 3. Backend szerver indítása...

REM Virtual environment aktiválása
call myvenv\Scripts\activate.bat

REM Django szerver indítása
echo Django szerver indítása...
python manage.py runserver

pause
