#!/bin/bash

# 🚀 Render.com Deployment Script
# This script helps you deploy to Render.com

set -e

echo "🚀 Sendly Marketing API - Render.com Deployment"
echo "================================================"

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not in a Git repository. Please initialize Git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    exit 1
fi

# Check if we have uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes. Please commit them first:"
    echo "   git add ."
    echo "   git commit -m 'Your commit message'"
    exit 1
fi

echo "✅ Git repository is clean"

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
    echo "❌ render.yaml not found. Please make sure it exists."
    exit 1
fi

echo "✅ render.yaml found"

# Check if package.json has build script
if ! grep -q '"build"' package.json; then
    echo "❌ Build script not found in package.json"
    exit 1
fi

echo "✅ Build script found in package.json"

# Test build locally
echo "🔨 Testing build locally..."
if npm run build; then
    echo "✅ Local build successful"
else
    echo "❌ Local build failed. Please fix the issues first."
    exit 1
fi

# Check if we have a remote origin
if ! git remote get-url origin &> /dev/null; then
    echo "⚠️  No remote origin found. Please add your GitHub repository:"
    echo "   git remote add origin https://github.com/yourusername/yourrepo.git"
    echo "   git push -u origin main"
    exit 1
fi

echo "✅ Remote origin found: $(git remote get-url origin)"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

echo ""
echo "🎉 Code pushed to GitHub successfully!"
echo ""
echo "📋 Next steps for Render.com deployment:"
echo "1. Go to https://render.com"
echo "2. Sign in with your GitHub account"
echo "3. Click 'New' → 'Blueprint'"
echo "4. Select your repository"
echo "5. Render will automatically detect the render.yaml file"
echo "6. Set the following environment variables:"
echo "   - SHOPIFY_API_KEY"
echo "   - SHOPIFY_API_SECRET"
echo "   - HOST (will be set to your Render app URL)"
echo "   - MITTO_API_KEY"
echo "   - MITTO_WEBHOOK_SECRET"
echo "   - API_KEY"
echo "7. Click 'Apply' to deploy"
echo ""
echo "🔗 Your app will be available at: https://your-app-name.onrender.com"
echo "🏥 Health check: https://your-app-name.onrender.com/health"
echo "📊 Full health: https://your-app-name.onrender.com/health/full"
echo ""
echo "📚 For more details, see DEPLOYMENT.md"
