#!/bin/bash
# Production deployment script for TreasureHunter

echo "🚀 TreasureHunter Production Deployment"
echo "======================================"

# 1. Frontend build
echo "📦 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# 2. Django setup
echo "🐍 Setting up Django..."
cd backend

# Install requirements
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --noinput

# Run migrations
python manage.py migrate

echo "✅ Deployment ready!"
echo ""
echo "To start the server:"
echo "cd backend"
echo "python manage.py runserver 0.0.0.0:8000"
echo ""
echo "Or with gunicorn:"
echo "gunicorn config.wsgi:application --bind 0.0.0.0:8000"
