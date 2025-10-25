#!/bin/bash

# Railway deployment test script
# This script tests the deployment process locally

echo "🧪 Testing Railway deployment process..."

# Test 1: Check if all required files exist
echo "📋 Checking required files..."
files=("railway.toml" "build.sh" "start.sh" "Procfile" "backend/requirements.txt" "frontend/package.json")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

# Test 2: Check if scripts are executable
echo "🔧 Making scripts executable..."
chmod +x build.sh start.sh

# Test 3: Test build process
echo "🏗️ Testing build process..."
if ./build.sh; then
    echo "✅ Build process successful"
else
    echo "❌ Build process failed"
    exit 1
fi

# Test 4: Check if frontend build was created
echo "📁 Checking frontend build..."
if [ -d "backend/static/assets" ] && [ -f "backend/static/index.html" ]; then
    echo "✅ Frontend build created successfully"
else
    echo "❌ Frontend build missing"
    exit 1
fi

echo "🎉 All tests passed! Ready for Railway deployment."
echo ""
echo "Next steps:"
echo "1. Commit and push changes to production branch"
echo "2. Deploy to Railway.app"
echo "3. Add PostgreSQL database"
echo "4. Set environment variables"
