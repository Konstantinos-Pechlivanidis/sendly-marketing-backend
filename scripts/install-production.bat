@echo off
REM 🚀 SMS Blossom Backend - Production Installation Script (Windows)
REM This script sets up the production environment

echo 🚀 SMS Blossom Backend - Production Setup
echo ==========================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

echo ✅ Node.js version:
node --version

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    exit /b 1
)

echo ✅ npm version:
npm --version

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  .env file not found. Creating from template...
    if exist "env.example" (
        copy env.example .env
        echo ✅ .env file created from template
        echo ⚠️  Please edit .env file with your production values
    ) else (
        echo ❌ env.example file not found. Please create .env file manually.
        exit /b 1
    )
) else (
    echo ✅ .env file found
)

REM Generate Prisma client
echo 🔧 Generating Prisma client...
npm run db:generate

REM Check if DATABASE_URL is set
if "%DATABASE_URL%"=="" (
    echo ⚠️  DATABASE_URL not set. Please set it in your .env file
    echo    Example: DATABASE_URL=postgresql://user:password@host:port/database
) else (
    echo ✅ DATABASE_URL is set
    
    REM Push database schema
    echo 🗄️  Pushing database schema...
    npm run db:push
    
    REM Seed initial data
    echo 🌱 Seeding initial data...
    npm run db:seed
)

REM Run tests
echo 🧪 Running tests...
npm test

REM Check if all required files exist
echo 🔍 Verifying production setup...

REM Check required files
set "files=package.json index.js app.js prisma\schema.prisma render.yaml Dockerfile .gitignore .eslintrc.js .prettierrc jest.config.js"
for %%f in (%files%) do (
    if exist "%%f" (
        echo ✅ %%f
    ) else (
        echo ❌ %%f - MISSING
    )
)

REM Check required directories
set "dirs=config controllers middlewares routes services utils queue tests scripts prisma"
for %%d in (%dirs%) do (
    if exist "%%d\" (
        echo ✅ %%d/
    ) else (
        echo ❌ %%d/ - MISSING
    )
)

echo.
echo 🎉 Production setup completed!
echo.
echo 📋 Next steps:
echo 1. Edit .env file with your production values
echo 2. Set up your database and Redis instances
echo 3. Deploy to Render.com or your preferred platform
echo 4. Monitor health endpoints: /health, /health/full, /metrics
echo.
echo 🔗 Useful commands:
echo   npm start          - Start production server
echo   npm run dev        - Start development server
echo   npm test           - Run tests
echo   npm run build      - Build for production
echo   npm run db:studio  - Open Prisma Studio
echo.
echo 📚 Documentation:
echo   - DEPLOYMENT.md     - Deployment guide
echo   - PRODUCTION_READY.md - Production checklist
echo.
echo 🏥 Health check: http://localhost:3000/health
echo 📊 Metrics: http://localhost:3000/metrics
echo.
echo Happy coding! 🚀
pause
