# Render Deployment Guide

## Prerequisites
- Render account (sign up at https://render.com)
- GitHub repository connected to Render

## Step 1: Create New Web Service

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `NFL-Teammates-Game`
4. Configure the service:

### Service Configuration

```
Name: nfl-teammates-backend
Region: Oregon (or closest to your users)
Branch: main (or your deployment branch)
Root Directory: nfl-teamates-game/backend
Runtime: Node
Build Command: npm install
Start Command: npm start
Plan: Free (or Starter for production)
```

## Step 2: Create PostgreSQL Database

1. Click "New +" → "PostgreSQL"
2. Configure:
   ```
   Name: nfl-teammates-db
   Database: nfl_teammates
   User: nfl_user
   Region: Oregon (same as web service)
   Plan: Free
   ```

3. After creation, copy the **Internal Database URL** (for connecting from your web service)

## Step 3: Set Environment Variables

In your web service settings → Environment tab, add:

### Required Variables

```bash
# Database (use Internal Database URL from PostgreSQL service)
DATABASE_URL=[paste Internal Database URL here]

# Server
PORT=8080
NODE_ENV=production

# Admin Authentication
ADMIN_API_KEY=[generate secure random string]

# AWS S3 (if using S3 for uploads)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=[your AWS access key]
AWS_SECRET_ACCESS_KEY=[your AWS secret key]
S3_BUCKET_NAME=[your S3 bucket name]
```

### Generate Secure ADMIN_API_KEY

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Or use Render's auto-generate feature
```

## Step 4: Run Database Migrations

### Method 1: Using Render Shell (Recommended)

1. Go to your web service in Render dashboard
2. Click "Shell" tab
3. Run migrations:

```bash
psql $DATABASE_URL -f schema.sql
```

### Method 2: Using Local psql with Render Database

```bash
# Get External Database URL from Render PostgreSQL dashboard
# Then run locally:
psql "YOUR_EXTERNAL_DATABASE_URL" -f nfl-teamates-game/backend/schema.sql
```

### Method 3: Create a Deploy Hook Script

Create a file `nfl-teamates-game/backend/migrate.sh`:

```bash
#!/bin/bash
psql $DATABASE_URL -f schema.sql
echo "Migration completed"
```

Then add to Render:
1. Settings → Build & Deploy
2. Add Pre-Deploy Command: `cd nfl-teamates-game/backend && chmod +x migrate.sh && ./migrate.sh`

## Step 5: Deploy

1. Render will automatically deploy on push to your configured branch
2. Or manually trigger: Dashboard → "Manual Deploy" → "Deploy latest commit"

## Step 6: Verify Deployment

1. Get your service URL (e.g., `https://nfl-teammates-backend.onrender.com`)
2. Test health endpoint:

```bash
curl https://your-app.onrender.com/health
```

3. Test API endpoint:

```bash
curl https://your-app.onrender.com/api/track
```

## Using render.yaml (Blueprint Method)

Alternatively, use the provided `render.yaml` file:

1. Go to Render dashboard
2. Click "New +" → "Blueprint"
3. Connect your repository
4. Render will detect the `render.yaml` and create all services automatically
5. You'll still need to set secret environment variables manually

## Troubleshooting

### Database Connection Issues

Check in Render Shell:

```bash
# Test connection
psql $DATABASE_URL -c "SELECT version();"

# List tables
psql $DATABASE_URL -c "\dt"
```

### View Logs

1. Dashboard → Your Service → Logs tab
2. Or use `tail -f` in Shell tab

### Service Not Starting

1. Check Build Logs for errors
2. Verify environment variables are set correctly
3. Check that `DATABASE_URL` uses the Internal Database URL
4. Ensure correct Node version (18.x)

## Render Free Tier Limitations

⚠️ **Important Free Tier Notes:**

- Services spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds (cold start)
- 750 hours/month of runtime (sufficient for one service running 24/7)
- 100 GB bandwidth/month
- Shared CPU and 512 MB RAM

For production, consider upgrading to Starter plan ($7/month) for:
- No spin-down
- More resources
- Better performance

## Custom Domain

1. Service Settings → Custom Domain
2. Add your domain
3. Configure DNS with provided CNAME records

## Monitoring

- **Logs**: Dashboard → Service → Logs
- **Metrics**: Dashboard → Service → Metrics
- **Events**: Dashboard → Service → Events

## Backups

Render PostgreSQL includes:
- **Free Plan**: 7-day point-in-time recovery
- **Paid Plans**: 30-day point-in-time recovery

## Rolling Back

1. Dashboard → Service → Events
2. Click on previous successful deploy
3. Click "Rollback to this version"

## Auto-Deploy from GitHub

1. Settings → Build & Deploy
2. Enable "Auto-Deploy" for your branch
3. Every push will trigger a deployment

## Health Checks

Render automatically monitors your `/health` endpoint. Configure in:
- Settings → Health Check Path: `/health`

## Scaling

Free tier: 1 instance only

Paid plans:
- Settings → Scaling
- Add more instances for high availability
- Configure auto-scaling rules

## Cost Estimate

- **Free Tier**: $0/month (with limitations)
- **Starter**: $7/month per service
- **PostgreSQL Starter**: $7/month

## Next Steps

1. Set up health checks
2. Configure monitoring and alerts
3. Set up automatic database backups
4. Consider upgrading for production workloads
5. Add custom domain
6. Set up SSL (automatic with Render)

## Support

- Render Community: https://community.render.com
- Documentation: https://render.com/docs
- Status: https://status.render.com
