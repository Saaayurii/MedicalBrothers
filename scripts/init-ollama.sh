#!/bin/bash

# Script to initialize Ollama with Qwen model

echo "🚀 Initializing Ollama with Qwen model..."

# Wait for Ollama to be ready
echo "Waiting for Ollama service..."
until curl -f http://localhost:11434/api/tags > /dev/null 2>&1; do
  echo "Ollama is not ready yet, waiting..."
  sleep 5
done

echo "✅ Ollama is ready!"

# Pull Qwen 2.5 model
echo "📥 Pulling Qwen 2.5 model (this may take a while)..."
curl -X POST http://localhost:11434/api/pull -d '{
  "name": "qwen2.5:latest"
}'

echo ""
echo "✅ Qwen model installed successfully!"
echo ""
echo "🎉 You can now use the Medical Voice Assistant!"
echo ""
echo "Access the application at: http://localhost:3000"
echo "Access pgAdmin at: http://localhost:5050"
echo ""
