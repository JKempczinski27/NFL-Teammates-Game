# Deploying Backend to Vercel

This guide will help you deploy the NFL Games consolidated backend to Vercel for easy dashboard access.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional but recommended):
   ```bash
   npm install -g vercel
   ```
3. **PostgreSQL Database**: You'll need a PostgreSQL database (Neon, Supabase, Railway, or other)

## Quick Deploy

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

   Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - What's your project's name? `nfl-games-backend` (or your choice)
   - In which directory is your code located? `./`
   - Want to modify settings? **N**

4. **Set Environment Variables**:
   ```bash
   vercel env add DATABASE_URL
   # Paste your PostgreSQL connection string when prompted

   vercel env add ADMIN_API_KEY
   # Generate with: openssl rand -hex 32

   # Optional:
   vercel env add REDIS_URL
   vercel env add SENTRY_DSN
   ```

5. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via Vercel Dashboard

1. **Import Project**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your Git repository
   - Select the `backend` directory as the root

2. **Configure Project**:
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: Leave empty (not needed)
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

3. **Add Environment Variables**:
   Go to Settings → Environment Variables and add:

   | Variable | Value | Notes |
   |----------|-------|-------|
   | `DATABASE_URL` | Your PostgreSQL connection string | Required |
   | `ADMIN_API_KEY` | Generate with `openssl rand -hex 32` | Optional, for dashboard auth |
   | `REDIS_URL` | Your Redis connection string | Optional |
   | `SENTRY_DSN` | Your Sentry DSN | Optional |

4. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete

## Database Setup

You'll need a PostgreSQL database. Here are some recommended providers:

### Option 1: Neon (Recommended for Vercel)
- Free tier: 0.5 GB storage
- Serverless PostgreSQL optimized for Vercel
- Sign up: [neon.tech](https://neon.tech)
- Get connection string from Neon dashboard
- Neon automatically sets `VERCEL=1` environment variable

### Option 2: Supabase
- Free tier: 500 MB database
- Includes built-in authentication and storage
- Sign up: [supabase.com](https://supabase.com)

### Option 3: Railway
- Free tier: $5/month credit
- Easy PostgreSQL setup
- Sign up: [railway.app](https://railway.app)

### Initialize Database Schema

Once you have your database, run the schema files:

```bash
# Using psql
psql "YOUR_DATABASE_URL" -f schema-consolidated.sql
psql "YOUR_DATABASE_URL" -f schema-analytics.sql

# Or using the Vercel CLI
vercel env pull .env.local
source .env.local
psql "$DATABASE_URL" -f schema-consolidated.sql
psql "$DATABASE_URL" -f schema-analytics.sql
```

## Accessing Your Dashboard

Once deployed, your dashboard will be available at:

```
https://your-project-name.vercel.app/dashboard
```

Replace `your-project-name` with your actual Vercel project name.

## Vercel-Specific Optimizations

The backend has been optimized for Vercel's serverless environment:

✅ **Connection Pooling**: Automatically detects Vercel and uses minimal connection pooling (1 connection vs 20)
✅ **Quick Cleanup**: Idle connections are closed after 1 second in serverless (vs 30s in traditional hosting)
✅ **Memory Allocation**: 1024 MB allocated for the serverless function
✅ **Max Duration**: 10 seconds timeout for API requests
✅ **Region**: Deployed to `iad1` (US East) by default

## Testing Your Deployment

1. **Health Check**:
   ```bash
   curl https://your-project-name.vercel.app/health
   ```

2. **Database Connection Test**:
   ```bash
   curl https://your-project-name.vercel.app/api/db-test
   ```

3. **Access Dashboard**:
   Open `https://your-project-name.vercel.app/dashboard` in your browser

## Troubleshooting

### "Database connection failed"
- Verify `DATABASE_URL` is set correctly in Vercel environment variables
- Ensure your database allows connections from Vercel's IP ranges
- Check that your database connection string includes SSL parameters

### "Function execution timeout"
- Some analytics queries might be slow
- Consider adding indexes to your database
- Increase `maxDuration` in vercel.json (max 60s on Pro plan, 10s on Hobby)

### "Memory limit exceeded"
- Increase memory allocation in vercel.json
- Currently set to 1024 MB, can increase up to 3008 MB on Pro plan

### Static files (CSS/JS) not loading
- Verify files exist in `backend/public/` directory
- Check browser console for 404 errors
- Ensure vercel.json routes are correct

## Monitoring & Logs

1. **View Logs**:
   ```bash
   vercel logs
   ```

2. **View Deployment Info**:
   ```bash
   vercel inspect
   ```

3. **Vercel Dashboard**:
   - Go to your project in [vercel.com](https://vercel.com)
   - Click "Deployments" to see deployment history
   - Click "Logs" to view real-time logs
   - Click "Analytics" for usage metrics (Pro plan)

## Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. Access dashboard at `https://yourdomain.com/dashboard`

## Cost

- **Hobby Plan**: Free
  - 100 GB bandwidth per month
  - Serverless function execution: 100 GB-hours
  - 10 second max function duration

- **Pro Plan**: $20/month per user
  - 1 TB bandwidth
  - 1000 GB-hours execution
  - 60 second max function duration
  - Analytics & monitoring

For most use cases, the **Hobby plan is sufficient**.

## Updating Your Deployment

### With Git Integration (Recommended)
1. Push changes to your Git repository
2. Vercel automatically deploys on push to main branch

### With Vercel CLI
```bash
cd backend
vercel --prod
```

## Security Considerations

1. **Enable Dashboard Authentication** (recommended):
   - Uncomment the authentication check in `index.js:115-118`
   - Set `ADMIN_API_KEY` environment variable
   - Pass token as `x-admin-token` header

2. **CORS Configuration**:
   - Update CORS settings in `index.js` to restrict allowed origins
   - Currently allows all origins (`app.use(cors())`)

3. **Rate Limiting**:
   - Already configured (100 requests per 15 minutes)
   - Adjust in `index.js:124-130` if needed

## Support

For issues specific to Vercel deployment:
- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Vercel Support: [vercel.com/support](https://vercel.com/support)

For backend-specific issues:
- See `README-CONSOLIDATED.md`
- Check `ANALYTICS_GUIDE.md` for API documentation

---

**Happy Deploying! 🚀**
