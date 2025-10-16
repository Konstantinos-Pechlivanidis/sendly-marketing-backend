#!/bin/bash

# 🚀 SMS Blossom Backend - Production Installation Script
# This script sets up the production environment

set -e

echo "🚀 SMS Blossom Backend - Production Setup"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "✅ .env file created from template"
        echo "⚠️  Please edit .env file with your production values"
    else
        echo "❌ env.example file not found. Please create .env file manually."
        exit 1
    fi
else
    echo "✅ .env file found"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set. Please set it in your .env file"
    echo "   Example: DATABASE_URL=postgresql://user:password@host:port/database"
else
    echo "✅ DATABASE_URL is set"
    
    # Push database schema
    echo "🗄️  Pushing database schema..."
    npm run db:push
    
    # Seed initial data
    echo "🌱 Seeding initial data..."
    npm run db:seed || echo "⚠️  Seeding failed, but continuing..."
fi

# Run tests
echo "🧪 Running tests..."
npm test || echo "⚠️  Tests failed, but continuing..."

# Check if all required files exist
echo "🔍 Verifying production setup..."

REQUIRED_FILES=(
    "package.json"
    "index.js"
    "app.js"
    "prisma/schema.prisma"
    "render.yaml"
    "Dockerfile"
    ".gitignore"
    ".eslintrc.js"
    ".prettierrc"
    "jest.config.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - MISSING"
    fi
done

# Check if all required directories exist
REQUIRED_DIRS=(
    "config"
    "controllers"
    "middlewares"
    "routes"
    "services"
    "utils"
    "queue"
    "tests"
    "scripts"
    "prisma"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir/"
    else
        echo "❌ $dir/ - MISSING"
    fi
done

echo ""
echo "🎉 Production setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your production values"
echo "2. Set up your database and Redis instances"
echo "3. Deploy to Render.com or your preferred platform"
echo "4. Monitor health endpoints: /health, /health/full, /metrics"
echo ""
echo "🔗 Useful commands:"
echo "  npm start          - Start production server"
echo "  npm run dev        - Start development server"
echo "  npm test           - Run tests"
echo "  npm run build      - Build for production"
echo "  npm run db:studio  - Open Prisma Studio"
echo ""
echo "📚 Documentation:"
echo "  - DEPLOYMENT.md     - Deployment guide"
echo "  - PRODUCTION_READY.md - Production checklist"
echo ""
echo "🏥 Health check: http://localhost:3000/health"
echo "📊 Metrics: http://localhost:3000/metrics"
echo ""
echo "Happy coding! 🚀"
