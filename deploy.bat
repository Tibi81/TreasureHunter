@echo off
echo 🚀 TreasureHunter Production Deployment
echo ======================================

REM 1. Frontend build
echo 📦 Building frontend...
cd frontend
call npm install
call npm run build
cd ..

REM 2. Django setup
echo 🐍 Setting up Django...
cd backend

REM Install requirements
pip install -r requirements.txt

REM Collect static files
python manage.py collectstatic --noinput

REM Run migrations
python manage.py migrate

echo ✅ Deployment ready!
echo.
echo To start the server:
echo cd backend
echo python manage.py runserver 0.0.0.0:8000
echo.
echo Or with gunicorn:
echo gunicorn config.wsgi:application --bind 0.0.0.0:8000

pause
