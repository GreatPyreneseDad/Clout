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

# Install root dependencies
npm install

# Build shared module
cd shared
npm install
npm run build
cd ..

# Build frontend
cd frontend
npm install
npm run build
cd ..

echo "Build completed successfully"