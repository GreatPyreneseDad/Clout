# Clout Application Deployment Fix Guide

## Root Cause Analysis

The deployment issues are caused by:

1. **Backend Not Running on Render**: The backend service at `https://clout-backend-ky0r.onrender.com` is returning 404 for all routes, indicating the service either:
   - Hasn't finished deploying
   - Crashed during startup
   - Is missing build configuration

2. **Frontend API URL Mismatch**: The `.env.production` file was pointing to the wrong backend URL (`https://clout-backend.onrender.com` instead of `https://clout-backend-ky0r.onrender.com`)

## Fixes Applied

### 1. Frontend Configuration (✅ COMPLETED)
- Updated `/frontend/.env.production` to use correct backend URL: `https://clout-backend-ky0r.onrender.com/api`
- Added proper `.gitignore` entries for environment files

### 2. Backend Error Handling (✅ COMPLETED)
- Added 404 handler to return JSON responses with proper status codes
- Ensured CORS headers are sent even on error responses

### 3. Backend Build Script (✅ COMPLETED)
- Created `/backend/render-build.sh` for Render deployment

## Actions Required on Render Dashboard

### 1. Configure Backend Service on Render

1. **Log into Render Dashboard**
2. **Navigate to your backend service** (clout-backend-ky0r)
3. **Update Build & Deploy Settings**:
   - **Build Command**: `./render-build.sh` or `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Root Directory**: Leave empty or set to `backend` if your repo has both frontend and backend
4. **Set Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=<your-mongodb-connection-string>
   JWT_SECRET=<your-jwt-secret>
   CORS_ORIGIN=https://clout-frontend-51v8-cfmkl28hx-christopher-macgregors-projects.vercel.app
   ```

### 2. Trigger a New Deployment
- Click "Manual Deploy" > "Deploy latest commit"
- Monitor the build logs for any errors

### 3. Verify Backend is Running
Once deployed, test these endpoints:
```bash
# Root health check
curl https://clout-backend-ky0r.onrender.com/

# API health check
curl https://clout-backend-ky0r.onrender.com/api/health

# Test picks endpoint
curl https://clout-backend-ky0r.onrender.com/api/picks?page=1&limit=20
```

## Actions Required on Vercel Dashboard

### 1. Set Environment Variable
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add/Update:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://clout-backend-ky0r.onrender.com/api`
   - **Environment**: Production

### 2. Redeploy Frontend
- Trigger a new deployment on Vercel to pick up the environment variable

## Testing the Fix

1. **Backend Health Check**:
   ```bash
   curl -i https://clout-backend-ky0r.onrender.com/api/health
   ```
   Should return:
   ```json
   {
     "success": true,
     "message": "Clout API is running",
     "timestamp": "2025-07-30T...",
     "environment": "production",
     "version": "0.1.0"
   }
   ```

2. **Frontend API Connection**:
   - Open browser DevTools
   - Navigate to your Vercel frontend URL
   - Check Network tab - API calls should go to `https://clout-backend-ky0r.onrender.com/api/*`
   - No CORS errors should appear

## Common Issues & Solutions

### Issue: Backend still returns 404
**Solution**: 
- Check Render build logs for TypeScript compilation errors
- Ensure `@clout/shared` package is properly linked
- Verify MongoDB connection string is correct

### Issue: CORS errors persist
**Solution**:
- Verify CORS_ORIGIN environment variable on Render matches your Vercel URL
- Check that backend is actually running (not just deployed)

### Issue: Frontend still uses wrong API URL
**Solution**:
- Clear browser cache
- Verify Vercel environment variable is set
- Check build logs on Vercel to ensure variable is picked up

## Next Steps

1. **Immediate**: Configure Render backend service with proper build/start commands
2. **Immediate**: Set environment variables on both Render and Vercel
3. **After Deploy**: Test all endpoints to ensure proper functionality
4. **Long-term**: Consider adding a health check monitor to prevent Render free tier from sleeping

## Files Modified
- `/frontend/.env.production` - Updated API URL
- `/frontend/.gitignore` - Added environment files
- `/backend/src/index.ts` - Added 404 handler
- `/backend/render-build.sh` - Created build script for Render