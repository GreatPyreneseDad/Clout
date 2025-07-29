#!/bin/bash

# Exit on error
set -e

# Debug: Show current directory
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Install root dependencies first (this sets up workspaces)
echo "Installing root dependencies..."
npm install --production=false

# Build shared module
echo "Building shared module..."
cd shared
npm install --production=false
npm run build
cd ..

# Build frontend
echo "Building frontend..."
cd frontend
npm install --production=false
npm run build
cd ..

echo "Build completed successfully"
echo "Checking if frontend/dist exists:"
ls -la frontend/dist || echo "frontend/dist not found"