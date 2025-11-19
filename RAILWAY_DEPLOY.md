# Railway Deployment Guide

## Prerequisites
- Railway account (sign up at https://railway.app)
- Railway CLI installed: `npm install -g @railway/cli`

## Step 1: Create New Railway Project

### Option A: Using Railway Dashboard (Recommended)

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select your `NFL-Teammates-Game` repository
4. Railway will detect the `railway.json` configuration

### Option B: Using Railway CLI

```bash
# Login to Railway
railway login

# Initialize in your project directory
cd /home/user/NFL-Teammates-Game
railway init

# This will create a new project or link to an existing one
```

## Step 2: Add PostgreSQL Database

1. In Railway dashboard, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically create a `DATABASE_URL` environment variable

## Step 3: Set Environment Variables

In the Railway dashboard, go to your service → Variables tab and add:

```bash
# Required Variables
DATABASE_URL=[automatically set by Railway PostgreSQL]
PORT=8080
ADMIN_API_KEY=[generate a secure random string]

# AWS S3 Variables (if using S3 for uploads)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=[your AWS access key]
AWS_SECRET_ACCESS_KEY=[your AWS secret key]
S3_BUCKET_NAME=[your S3 bucket name]

# Optional
NODE_ENV=production
```

### Generate Secure ADMIN_API_KEY

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

## Step 4: Run Database Migrations

### Method 1: Using Railway CLI (Recommended)

```bash
# Connect to your Railway project
railway link

# Run migrations using the DATABASE_URL from Railway
railway run psql $DATABASE_URL -f nfl-teamates-game/backend/schema.sql

# Alternative: Run the init script
railway run node nfl-teamates-game/backend/initDatabase.js
```

### Method 2: Using Railway Shell

```bash
# Open a shell in Railway environment
railway shell

# Run migrations
psql $DATABASE_URL -f nfl-teamates-game/backend/schema.sql
```

### Method 3: Connect Directly from Local Machine

```bash
# Get DATABASE_URL from Railway dashboard
# Copy the DATABASE_URL and run:
psql "YOUR_DATABASE_URL" -f nfl-teamates-game/backend/schema.sql
```

## Step 5: Deploy

Railway will automatically deploy when you push to your main branch.

### Manual Deployment via CLI

```bash
railway up
```

## Step 6: Verify Deployment

1. Check the deployment logs in Railway dashboard
2. Get your deployment URL (e.g., `https://your-app.up.railway.app`)
3. Test the health endpoint:

```bash
curl https://your-app.up.railway.app/health
```

4. Test the API:

```bash
curl https://your-app.up.railway.app/api/track
```

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection using Railway CLI
railway run node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }); pool.query('SELECT NOW()', (err, res) => { console.log(err ? err.message : res.rows[0]); pool.end(); });"
```

### View Logs

```bash
# View logs via CLI
railway logs

# Or check the Logs tab in Railway dashboard
```

### Restart Service

```bash
# Via CLI
railway restart

# Or use the Restart button in Railway dashboard
```

## Monitoring

- **Logs**: Railway dashboard → Logs tab
- **Metrics**: Railway dashboard → Metrics tab
- **Database**: Railway dashboard → PostgreSQL service → Data tab

## Cost Estimates

Railway Free Tier includes:
- $5 of usage per month
- Unlimited projects
- Shared resources

For production workloads, consider upgrading to a paid plan.

## Next Steps

1. Set up custom domain (Railway Settings → Domains)
2. Configure GitHub auto-deployments
3. Set up monitoring and alerts
4. Configure backups for your PostgreSQL database

## Rolling Back

```bash
# View deployments
railway status

# Rollback to previous deployment
railway rollback
```

## Environment-Specific Deploys

```bash
# Create staging environment
railway environment create staging

# Deploy to staging
railway up --environment staging
```
