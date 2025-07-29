#!/bin/bash

# Debug: Show current directory
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Find the repository root (where package.json with workspaces exists)
while [ ! -f "package.json" ] || ! grep -q "workspaces" package.json 2>/dev/null; do
  cd ..
  if [ "$(pwd)" = "/" ]; then
    echo "Could not find repository root"
    exit 1
  fi
done

echo "Found repository root at: $(pwd)"

# Install root dependencies (including devDependencies for TypeScript)
npm install --production=false

# Build shared module
cd shared
npm install --production=false
npm run build
cd ..

# Build frontend
cd frontend
npm install --production=false
npm run build
cd ..

echo "Build completed successfully"
echo "Current directory after build: $(pwd)"
echo "Finding dist directories:"
find . -name "dist" -type d
echo "Contents of frontend/dist:"
ls -la frontend/dist || echo "frontend/dist not found"

# If we're not in the root, copy dist to where Vercel expects it
if [ -d "frontend/dist" ] && [ ! -d "dist" ]; then
  echo "Copying frontend/dist to ./dist for Vercel"
  cp -r frontend/dist .
fi