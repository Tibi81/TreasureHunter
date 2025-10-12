#!/bin/bash
# Build script for Render deployment

echo "🚀 Starting build process..."

# Navigate to project root
cd /opt/render/project/src

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

# Navigate to backend
echo "🐍 Setting up backend..."
cd ../backend

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "❌ Python dependencies installation failed"
    exit 1
fi

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput
if [ $? -ne 0 ]; then
    echo "❌ Static files collection failed"
    exit 1
fi

# Run migrations
echo "🗄️ Running database migrations..."
python manage.py migrate
if [ $? -ne 0 ]; then
    echo "❌ Database migrations failed"
    exit 1
fi

echo "✅ Build completed successfully!"
