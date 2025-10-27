#!/bin/bash

# Railway.app start script for TreasureHunter
# This script handles the complete deployment process

set -e  # Exit on any error

echo "🚀 Starting TreasureHunter deployment on Railway..."

# Navigate to backend directory
cd backend

echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

echo "🏗️ Building frontend..."
cd ../frontend
npm install
npm run build

echo "📁 Copying frontend build to backend static files..."
cp -r dist/* ../backend/static/

echo "🔧 Setting up Django..."
cd ../backend

echo "📊 Collecting static files..."
python3 manage.py collectstatic --noinput

echo "🗄️ Running database migrations..."
python3 manage.py migrate --settings=config.settings_production

echo "🎯 Starting Gunicorn server..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
