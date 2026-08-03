#!/bin/bash

# SnakeChess Development Startup Script

echo "🐍 Starting SnakeChess Development Environment"
echo "==============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if MongoDB is running locally (optional)
if command -v mongod &> /dev/null; then
    if pgrep -x "mongod" > /dev/null; then
        echo "✅ MongoDB is running locally"
        MONGODB_URI="mongodb://localhost:27017/snakechess"
    else
        echo "⚠️  MongoDB not running locally. Using MongoDB Atlas..."
        MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/snakechess"
    fi
else
    echo "⚠️  MongoDB CLI not found. Make sure MongoDB is installed or use MongoDB Atlas."
fi

# Install server dependencies
echo ""
echo "📦 Installing server dependencies..."
cd server
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install server dependencies"
        exit 1
    fi
else
    echo "✅ Server dependencies already installed"
fi

# Generate JWT secret if not exists
if [ ! -f ".env" ]; then
    echo ""
    echo "🔑 Creating .env file..."
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

    cat > .env << EOF
# SnakeChess Development Environment
PORT=3000
NODE_ENV=development
MONGODB_URI=${MONGODB_URI}
JWT_SECRET=${JWT_SECRET}
CLIENT_URL=http://localhost:3000
EOF

    echo "✅ Created .env file with JWT secret"
else
    echo "✅ .env file already exists"
fi

# Start server
echo ""
echo "🚀 Starting SnakeChess server..."
echo "📱 Frontend will be available at: http://localhost:3000"
echo "🔧 API will be available at: http://localhost:3000/api"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start
