@echo off
REM SnakeChess Development Startup Script for Windows

echo 🐍 Starting SnakeChess Development Environment
echo ===============================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1 delims=v." %%i in ('node --version') do set NODE_MAJOR=%%i
if %NODE_MAJOR% lss 18 (
    echo ❌ Node.js version 18+ required. Current version:
    node --version
    pause
    exit /b 1
)

echo ✅ Node.js version:
node --version

REM Change to server directory
cd server

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo.
    echo 📦 Installing server dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install server dependencies
        pause
        exit /b 1
    )
) else (
    echo ✅ Server dependencies already installed
)

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo.
    echo 🔑 Creating .env file...

    REM Generate random JWT secret
    for /f %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set JWT_SECRET=%%i

    echo # SnakeChess Development Environment > .env
    echo PORT=3000 >> .env
    echo NODE_ENV=development >> .env
    echo MONGODB_URI=mongodb://localhost:27017/snakechess >> .env
    echo JWT_SECRET=%JWT_SECRET% >> .env
    echo CLIENT_URL=http://localhost:3000 >> .env

    echo ✅ Created .env file with JWT secret
) else (
    echo ✅ .env file already exists
)

REM Start server
echo.
echo 🚀 Starting SnakeChess server...
echo 📱 Frontend will be available at: http://localhost:3000
echo 🔧 API will be available at: http://localhost:3000/api
echo.
echo Press Ctrl+C to stop the server
echo.

npm start
