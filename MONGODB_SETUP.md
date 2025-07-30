# MongoDB Atlas Setup for Clout

## Connection String
Your MongoDB Atlas connection string:
```
mongodb+srv://macgregortechnologies:<password>@cluster0.q4x2hcx.mongodb.net/clout?retryWrites=true&w=majority
```

## Setup Steps

### 1. Create Your .env File
```bash
cd backend
cp .env.example .env
```

### 2. Edit .env File
Replace `<password>` with your actual password. Remember to URL encode special characters:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `&` → `%26`
- `+` → `%2B`
- `/` → `%2F`
- `:` → `%3A`
- `=` → `%3D`

### 3. Generate JWT Secret
```bash
# Generate a secure JWT secret
openssl rand -base64 32
```
Add this to your .env file as `JWT_SECRET`

### 4. Test Connection
```bash
cd backend
npm run test:connection
```

### 5. For Render Deployment
Add these environment variables in Render dashboard:
- `MONGODB_URI`: Your full connection string with password
- `JWT_SECRET`: Your generated secret
- `NODE_ENV`: production
- `CORS_ORIGIN`: Your Vercel frontend URL

### 6. Create Admin User (After Backend is Running)
```bash
# Connect to MongoDB
mongosh "mongodb+srv://macgregortechnologies:<password>@cluster0.q4x2hcx.mongodb.net/clout" --apiVersion 1

# In mongosh, run:
use clout
db.users.updateOne(
  { email: "your-admin@email.com" },
  { $set: { role: "admin" } }
)
```

## Database Structure

The Clout database will have these collections:
- `users` - User accounts and profiles
- `picks` - Sports betting predictions
- `events` - Sports events (fights, games)
- `leaderboards` - Cached leaderboard data

## Security Notes

1. **Never commit .env files** - They're in .gitignore
2. **Use strong passwords** - Mix of letters, numbers, symbols
3. **Restrict IP access** - In Atlas, whitelist only necessary IPs
4. **Enable encryption** - Atlas encrypts at rest by default
5. **Regular backups** - Atlas provides automated backups

## Troubleshooting

### Connection Refused
- Check if IP is whitelisted in Atlas
- Verify password is correctly URL encoded
- Ensure cluster is active (not paused)

### Authentication Failed
- Double-check username and password
- Verify database user has correct permissions
- Check if password contains special characters that need encoding

### Slow Queries
- Add indexes (see CLAUDE.md for recommendations)
- Use Atlas Performance Advisor
- Consider upgrading cluster tier for production