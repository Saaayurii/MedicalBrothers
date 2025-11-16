#!/bin/bash

# Development setup script

echo "🏥 Medical Voice Assistant - Development Setup"
echo "=============================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  echo "📝 Creating .env file from .env.example..."
  cp .env.example .env
  echo "✅ .env file created"
else
  echo "✅ .env file already exists"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Start Docker services
echo ""
echo "🐳 Starting Docker services (PostgreSQL & Ollama)..."
docker-compose up -d postgres ollama

# Wait for PostgreSQL
echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker-compose exec -T postgres pg_isready -U medical_user -d medical_clinic > /dev/null 2>&1; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Initialize Ollama
echo ""
echo "🤖 Initializing Ollama with Qwen model..."
bash scripts/init-ollama.sh

# Start development server
echo ""
echo "🚀 Starting development server..."
echo ""
echo "Access the application at: http://localhost:3000"
echo "Access admin panel at: http://localhost:3000/admin"
echo "Access pgAdmin at: http://localhost:5050"
echo ""
echo "Press Ctrl+C to stop the development server"
echo ""

npm run dev
