#!/bin/bash

# Railway.app build script for TreasureHunter
# This script handles the build process only

set -e  # Exit on any error

echo "🏗️ Building TreasureHunter for Railway..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r backend/requirements.txt

# Install Node.js dependencies and build frontend
echo "📦 Installing Node.js dependencies..."
cd frontend
npm install

echo "🏗️ Building frontend..."
npm run build

echo "📁 Copying frontend build to backend static files..."
cp -r dist/* ../backend/static/

echo "✅ Build completed successfully!"
