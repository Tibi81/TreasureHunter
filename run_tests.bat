@echo off
echo ========================================
echo   Treasure Hunter - Tesztek futtatása
echo ========================================
echo.

echo Backend könyvtárba váltás...
cd backend

echo Virtual environment aktiválása...
call myvenv\Scripts\activate.bat

echo.
echo Rugalmas játékosszám tesztek futtatása...
python manage.py test treasurehunt.test_flexible_game -v 2

echo.
echo Rugalmas frontend tesztek futtatása...
python manage.py test treasurehunt.test_flexible_frontend -v 2

echo.
echo Összes teszt futtatása...
python manage.py test treasurehunt -v 2

echo.
echo Tesztek befejezve!
pause
