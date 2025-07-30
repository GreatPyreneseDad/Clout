#!/bin/bash

# This script sets up Vercel environment variables using the Vercel CLI
# You need to be logged in: vercel login

echo "Setting up Vercel environment variables for Clout frontend..."

# Set the API URL for production
vercel env add VITE_API_URL production <<< "https://clout-backend-ky0r.onrender.com/api"

# Set the API URL for preview (all Vercel preview deployments)
vercel env add VITE_API_URL preview <<< "https://clout-backend-ky0r.onrender.com/api"

# Set the API URL for development (optional)
vercel env add VITE_API_URL development <<< "http://localhost:3000/api"

echo "Environment variables set!"
echo ""
echo "To verify, run:"
echo "vercel env ls"
echo ""
echo "To trigger a new deployment:"
echo "vercel --prod"