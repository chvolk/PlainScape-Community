#!/bin/bash
cd "$(dirname "$0")"
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies (first run)..."
  npm install --production
fi
echo "Starting PlainScape server..."
node server/dist/main.js
