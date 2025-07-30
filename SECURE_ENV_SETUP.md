# Secure Environment Setup Guide

## ⚠️ CRITICAL: Never Share or Commit These Values

Your API keys are sensitive credentials. NEVER:
- Share them in messages or emails
- Commit them to Git
- Store them in plain text files
- Log them to console

## Local Development Setup

### 1. Create your .env file
```bash
cd backend
cp .env.example .env
```

### 2. Add your credentials to .env
Edit the `.env` file and add your actual values:

```bash
# MongoDB Connection
MONGODB_URI=mongodb+srv://macgregortechnologies:<YOUR_PASSWORD>@cluster0.q4x2hcx.mongodb.net/clout?retryWrites=true&w=majority

# Security
JWT_SECRET=<generate-with-openssl-rand-base64-32>

# MongoDB Atlas API (for monitoring)
MONGODB_ATLAS_PUBLIC_KEY=<your-public-key>
MONGODB_ATLAS_PRIVATE_KEY=<your-private-key>
MONGODB_ATLAS_PROJECT_ID=<your-project-id>
```

### 3. Generate a secure JWT secret
```bash
openssl rand -base64 32
```

### 4. Verify .env is in .gitignore
```bash
# Check that .env won't be committed
git status --ignored
```

## Production Deployment (Render)

### 1. Add Environment Variables in Render Dashboard

Go to your Render service → Environment → Add the following:

| Variable | Value | Notes |
|----------|-------|-------|
| `MONGODB_URI` | Your full connection string | URL encode password special chars |
| `JWT_SECRET` | Generated secure key | Min 32 characters |
| `NODE_ENV` | `production` | Required |
| `CORS_ORIGIN` | Your Vercel frontend URL | Include https:// |
| `MONGODB_ATLAS_PUBLIC_KEY` | Your Atlas API public key | For monitoring |
| `MONGODB_ATLAS_PRIVATE_KEY` | Your Atlas API private key | Keep secret! |
| `MONGODB_ATLAS_PROJECT_ID` | Your Atlas project ID | From Atlas dashboard |

### 2. Never expose keys in logs
The monitoring service is designed to never log API keys:
- Keys are validated at startup
- Only "configured/not configured" status is logged
- Failed API calls don't expose credentials

## Using the Monitoring Features

### 1. Check cluster health (Admin only)
```bash
GET /api/monitoring/health
Authorization: Bearer <admin-jwt-token>
```

### 2. Check if scaling needed
```bash
GET /api/monitoring/scaling-check
Authorization: Bearer <admin-jwt-token>
```

### 3. Create manual backup
```bash
POST /api/monitoring/backup
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "description": "Pre-deployment backup"
}
```

## Security Best Practices

### 1. Key Rotation
- Rotate API keys every 90 days
- Update in Atlas and Render simultaneously
- Never reuse old keys

### 2. Access Control
- Monitoring endpoints are admin-only
- IP whitelist your production servers in Atlas
- Use least-privilege principle

### 3. Audit Trail
- Atlas logs all API access
- Review logs regularly
- Set up alerts for suspicious activity

### 4. Environment Isolation
- Use different API keys for dev/staging/prod
- Never use production keys locally
- Separate Atlas projects per environment

## Troubleshooting

### "Monitoring not configured"
- Check all three Atlas env vars are set
- Verify no typos in variable names
- Restart backend after adding env vars

### Authentication errors
- Verify API keys are correct
- Check project ID matches your cluster
- Ensure API keys have required permissions

### Rate limiting
- Atlas API has rate limits
- Don't poll endpoints too frequently
- Cache monitoring data appropriately

## Emergency Procedures

### If keys are exposed:
1. Immediately rotate keys in Atlas
2. Update all environments
3. Review Atlas audit logs
4. Check for unauthorized access

### Monitoring suspicious activity:
1. Check Atlas alerts
2. Review audit logs
3. Temporarily disable compromised keys
4. Contact MongoDB support if needed