# Consolidated Backend Deployment Guide

This guide provides step-by-step instructions for deploying the consolidated NFL Teammates Game backend to various hosting platforms.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Deployment to Railway](#deployment-to-railway)
4. [Deployment to Render](#deployment-to-render)
5. [Environment Variables](#environment-variables)
6. [Post-Deployment Steps](#post-deployment-steps)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

- Git repository access
- Account on hosting platform (Railway, Render, etc.)
- PostgreSQL database (can be provisioned by hosting platform)
- AWS S3 account (optional, for S3 features)

## Database Setup

### 1. Create PostgreSQL Database

Most hosting platforms provide managed PostgreSQL databases:

**Railway:**
- Click "New" → "Database" → "PostgreSQL"
- Copy the `DATABASE_URL` connection string

**Render:**
- Create a new PostgreSQL database
- Copy the "External Database URL"

### 2. Initialize Database Schema

Connect to your database and run the schema:

```bash
psql $DATABASE_URL -f nfl-teamates-game/backend/schema.sql
```

Or use a database client (like pgAdmin, DBeaver, or TablePlus) and execute the SQL from `schema.sql`.

## Deployment to Railway

### Step 1: Create New Project

1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Select your repository
5. Choose "nfl-teamates-game/backend" as the root directory

### Step 2: Configure Build Settings

Railway should auto-detect Node.js. If not, add these settings:

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
npm start
```

### Step 3: Set Environment Variables

In Railway project settings → Variables, add:

```bash
DATABASE_URL=<your-postgres-connection-string>
PORT=8080
ADMIN_API_KEY=<generate-secure-random-string>
NODE_ENV=production

# Optional: AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
S3_BUCKET_NAME=<your-bucket-name>

# Optional: Sentry Error Tracking
SENTRY_DSN=<your-sentry-dsn>

# Optional: Redis for Caching
REDIS_URL=<your-redis-url>
```

### Step 4: Deploy

1. Railway will automatically deploy when you push to your repository
2. Get your deployment URL from Railway dashboard
3. Test the API: `https://your-app.railway.app/api/db-test`

## Deployment to Render

### Step 1: Create New Web Service

1. Go to [Render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name:** nfl-teammates-backend
   - **Root Directory:** nfl-teamates-game/backend
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Choose your plan (Free tier available)

### Step 2: Create PostgreSQL Database

1. Click "New" → "PostgreSQL"
2. Choose a name and region
3. Select your plan
4. Once created, copy the "External Database URL"

### Step 3: Set Environment Variables

In your web service settings → Environment, add:

```bash
DATABASE_URL=<your-postgres-connection-string>
PORT=8080
ADMIN_API_KEY=<generate-secure-random-string>
NODE_ENV=production

# Optional variables (same as Railway section)
```

### Step 4: Deploy

1. Click "Manual Deploy" → "Deploy latest commit"
2. Monitor deployment logs
3. Test the API: `https://your-app.onrender.com/api/db-test`

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `PORT` | Server port (usually auto-set) | `8080` |
| `ADMIN_API_KEY` | Secure random string for admin endpoints | Use `openssl rand -hex 32` |

### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `AWS_REGION` | AWS region for S3 | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key | Your AWS key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | Your AWS secret |
| `S3_BUCKET_NAME` | S3 bucket name | `nfl-game-data` |
| `SENTRY_DSN` | Sentry error tracking URL | Your Sentry DSN |
| `REDIS_URL` | Redis connection string for caching | `redis://...` |
| `NODE_ENV` | Environment mode | `production` |

## Post-Deployment Steps

### 1. Run Database Migrations

After deploying, ensure your database schema is initialized:

```bash
# Using psql
psql $DATABASE_URL -f nfl-teamates-game/backend/schema.sql

# Or use your hosting platform's database console
```

### 2. Update Frontend Environment Variables

Update your frontend `.env` files with the backend URL:

**NFL-Trivia-Game/.env:**
```bash
VITE_API_URL=https://your-backend-url.railway.app
```

**Journeyman/.env:**
```bash
REACT_APP_API_URL=https://your-backend-url.railway.app
```

### 3. Test All Endpoints

Test each game's endpoints:

```bash
# Health check
curl https://your-backend-url/

# Database test
curl https://your-backend-url/api/db-test

# Trivia game test
curl -X POST https://your-backend-url/api/trivia/players \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","team":"Test Team","score":100}'

# Journeyman game test
curl -X POST https://your-backend-url/api/journeyman/save-player \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","score":100}'
```

### 4. Deploy Frontends

Deploy your frontends with the updated environment variables:

- **NFL-Trivia-Game:** Vercel, Netlify, or your preferred host
- **Journeyman:** Vercel, Netlify, or your preferred host

### 5. Configure CORS (if needed)

If you encounter CORS errors, you may need to update the backend's CORS configuration in `index.js`:

```javascript
app.use(cors({
  origin: [
    'https://your-trivia-frontend.vercel.app',
    'https://your-journeyman-frontend.vercel.app'
  ]
}));
```

## Monitoring and Maintenance

### Health Checks

Set up monitoring for your backend:

- Railway: Built-in health checks
- Render: Configure health check path: `/api/db-test`
- External: Use UptimeRobot, Pingdom, or similar

### Logs

Access logs through your hosting platform:

- Railway: Click on deployment → Logs tab
- Render: Click on service → Logs tab

### Performance

Monitor performance metrics:

- Database connection pool usage
- API response times
- Error rates (use Sentry if configured)
- Cache hit rates (if using Redis)

## Troubleshooting

### Database Connection Errors

**Issue:** "Error: connect ECONNREFUSED" or "password authentication failed"

**Solution:**
- Verify `DATABASE_URL` is correct
- Check database is running and accessible
- Ensure SSL settings match database requirements
- Test connection with `psql $DATABASE_URL`

### CORS Errors

**Issue:** "Access to fetch has been blocked by CORS policy"

**Solution:**
- Verify backend CORS is enabled
- Update CORS origin whitelist if needed
- Check frontend is using correct backend URL

### 500 Internal Server Error

**Issue:** API returns 500 errors

**Solution:**
- Check backend logs for error details
- Verify all required environment variables are set
- Check database schema is properly initialized
- Look for Sentry errors if configured

### Port Already in Use

**Issue:** "Port 8080 is already in use"

**Solution:**
- Most hosting platforms set `PORT` automatically
- Don't hardcode port, use `process.env.PORT`
- Current code already handles this correctly

### Frontend Can't Connect to Backend

**Issue:** Frontend shows network errors

**Solution:**
- Verify `VITE_API_URL` or `REACT_APP_API_URL` is correct
- Check backend is deployed and running
- Test backend URL directly in browser
- Verify environment variables are being loaded

## Scaling Considerations

### Database

- Monitor connection pool usage
- Increase pool size if needed: Edit `max` in `index.js`
- Consider read replicas for high traffic

### Caching

- Add Redis for better performance
- Current code already supports Redis caching
- Set `REDIS_URL` environment variable

### Rate Limiting

- Current code has rate limiting enabled
- Adjust limits in `index.js` if needed
- Consider using Cloudflare or similar CDN

## Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` instead
2. **Use strong `ADMIN_API_KEY`** - Generate with `openssl rand -hex 32`
3. **Enable SSL** - Hosting platforms provide this by default
4. **Keep dependencies updated** - Run `npm audit` regularly
5. **Monitor logs** - Set up alerts for errors
6. **Use environment variables** - Never hardcode secrets

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the logs in your hosting platform
3. Test endpoints individually to isolate issues
4. Consult hosting platform documentation

## Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
