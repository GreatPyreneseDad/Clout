# Clout Deployment Guide

## Current Deployment Setup

- **Frontend**: Deployed on Vercel
- **Backend**: Deployed on Render
- **Database**: MongoDB (likely MongoDB Atlas)

## Frontend (Vercel)

### Configuration
The frontend is automatically deployed from the GitHub repository.

### Environment Variables
Set these in Vercel Dashboard > Settings > Environment Variables:

```bash
VITE_API_URL=https://your-backend-url.onrender.com/api
```

### Update Frontend to Use Deployed Backend

1. **Update the production environment file**:
   ```bash
   # In frontend/.env.production
   VITE_API_URL=https://clout-backend.onrender.com/api
   ```

2. **Redeploy on Vercel**:
   - Push changes to trigger automatic deployment
   - Or manually redeploy from Vercel dashboard

## Backend (Render)

### Required Environment Variables
Set these in Render Dashboard > Environment:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/clout?retryWrites=true&w=majority

# Security (REQUIRED - app won't start without this)
JWT_SECRET=your-very-secure-random-string-at-least-32-chars

# CORS
CORS_ORIGIN=https://your-frontend.vercel.app

# Rate Limiting (optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Sports Data API (required for fetching events)
ODDS_API_KEY=your-odds-api-key

# Node Environment
NODE_ENV=production
```

### Important Security Notes

1. **JWT_SECRET**: 
   - MUST be set or the app will crash on startup (security fix implemented)
   - Generate a secure one: `openssl rand -base64 32`

2. **MONGODB_URI**: 
   - No fallback URI (security fix implemented)
   - Must be explicitly set

3. **Admin Routes**:
   - Protected by authentication and role checking
   - Create admin user via MongoDB directly or implement admin creation endpoint

## Post-Deployment Checklist

### 1. Verify Backend Health
```bash
curl https://clout-backend.onrender.com/
# Should return: {"status":"ok","message":"Clout API Server"}
```

### 2. Check API Health
```bash
curl https://clout-backend.onrender.com/api/health
# Should return: {"status":"ok","service":"Clout API","timestamp":"..."}
```

### 3. Test CORS
Open browser console on your Vercel frontend and check for CORS errors.

### 4. Create Admin User
Connect to MongoDB and manually set a user's role to 'admin':
```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

### 5. Test Authentication Flow
1. Register a new user
2. Login
3. Check that JWT token is stored
4. Make authenticated requests

## Troubleshooting

### Frontend Can't Connect to Backend
1. Check VITE_API_URL is set correctly in Vercel
2. Verify backend is running (check Render logs)
3. Check browser console for CORS errors

### Backend Crashes on Startup
1. Ensure JWT_SECRET is set
2. Ensure MONGODB_URI is set and valid
3. Check Render logs for specific errors

### CORS Errors
1. Backend allows all Vercel preview deployments (*.vercel.app)
2. Set CORS_ORIGIN to your production frontend URL
3. Ensure credentials: true is set in CORS config

### Rate Limiting Issues
Default is 100 requests per 15 minutes per IP. Adjust:
- RATE_LIMIT_WINDOW_MS (in milliseconds)
- RATE_LIMIT_MAX_REQUESTS

## Monitoring

### Render
- View logs in Render dashboard
- Set up health check alerts
- Monitor memory and CPU usage

### Vercel
- Check function logs
- Monitor build times
- Set up deployment notifications

## Scaling Considerations

### When to Scale
- Response times > 1s consistently
- Memory usage > 80%
- Database connections maxed out

### How to Scale
1. **Backend**: Upgrade Render instance or add more instances
2. **Database**: Upgrade MongoDB cluster, add indexes
3. **Frontend**: Vercel scales automatically
4. **Caching**: Implement Redis (see CLAUDE.md for recommendations)