# Quick Deployment Guide

Choose your platform and follow the steps below:

## 🚂 Railway (Recommended - Easiest)

### 1. Deploy via Railway Button

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/yourusername/NFL-Teammates-Game)

Or manually:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and create project
railway login
railway init

# Add PostgreSQL
railway add --database postgresql

# Deploy
railway up
```

### 2. Set Environment Variables

In Railway dashboard → Variables:

```bash
ADMIN_API_KEY=[generate with: openssl rand -hex 32]
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=[your AWS key]
AWS_SECRET_ACCESS_KEY=[your AWS secret]
S3_BUCKET_NAME=[your bucket name]
```

### 3. Run Database Migrations

```bash
railway run psql $DATABASE_URL -f backend/schema-consolidated.sql
railway run psql $DATABASE_URL -f backend/schema-analytics.sql
```

### 4. Verify

```bash
# Get your Railway URL from dashboard, then:
curl https://your-app.up.railway.app/
curl https://your-app.up.railway.app/api/db-test
```

**Done!** Your backend is live.

---

## 🎨 Render

### 1. Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. New + → Web Service
3. Connect repository: `NFL-Teammates-Game`
4. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or Starter)

### 2. Create PostgreSQL Database

1. New + → PostgreSQL
2. Copy the **Internal Database URL**

### 3. Set Environment Variables

In Web Service → Environment:

```bash
DATABASE_URL=[paste Internal Database URL]
PORT=8080
NODE_ENV=production
ADMIN_API_KEY=[generate with: openssl rand -hex 32]
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=[your AWS key]
AWS_SECRET_ACCESS_KEY=[your AWS secret]
S3_BUCKET_NAME=[your bucket name]
```

### 4. Run Database Migrations

In Web Service → Shell:

```bash
psql $DATABASE_URL -f schema.sql
```

### 5. Verify

```bash
curl https://your-app.onrender.com/
curl https://your-app.onrender.com/api/db-test
```

**Done!** Your backend is live.

---

## 📋 Post-Deployment Checklist

- [ ] Health endpoint working: `GET /`
- [ ] Database connected: `GET /api/db-test`
- [ ] Tracking endpoint working: `GET /api/track`
- [ ] Database tables created (run migrations)
- [ ] Environment variables set correctly
- [ ] ADMIN_API_KEY is secure (32+ characters)
- [ ] Monitor logs for errors
- [ ] Test API endpoints from frontend

---

## 🔧 Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string | Auto-set by platform |
| `PORT` | ✅ Yes | Server port | `8080` |
| `ADMIN_API_KEY` | ✅ Yes | Admin authentication token | Generate with `openssl rand -hex 32` |
| `AWS_REGION` | ⚠️ If using S3 | AWS region | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | ⚠️ If using S3 | AWS access key | From AWS IAM |
| `AWS_SECRET_ACCESS_KEY` | ⚠️ If using S3 | AWS secret key | From AWS IAM |
| `S3_BUCKET_NAME` | ⚠️ If using S3 | S3 bucket name | `my-nfl-game-uploads` |
| `REDIS_URL` | 🔵 Optional | Redis cache URL | Auto-set if Redis added |
| `SENTRY_DSN` | 🔵 Optional | Sentry error tracking | From sentry.io |

---

## 🗄️ Database Migrations

The `schema.sql` file creates these tables:
- `events` - All tracking events
- `user_sessions` - User engagement metrics
- `question_analytics` - Question difficulty and success rates
- `share_analytics` - Share platform usage
- `players` - Player information (legacy)

**Run migrations:**

```bash
# Railway
railway run psql $DATABASE_URL -f backend/schema-consolidated.sql
railway run psql $DATABASE_URL -f backend/schema-analytics.sql

# Render Shell
psql $DATABASE_URL -f schema-consolidated.sql
psql $DATABASE_URL -f schema-analytics.sql

# Local psql (use external DB URL)
psql "postgresql://user:pass@host:port/db" -f backend/schema-consolidated.sql
psql "postgresql://user:pass@host:port/db" -f backend/schema-analytics.sql
```

**Verify tables:**

```sql
\dt  -- List all tables
SELECT * FROM events LIMIT 1;
```

---

## 🐛 Troubleshooting

### "Cannot connect to database"
- Check `DATABASE_URL` is set correctly
- Verify database is running
- Ensure SSL is configured (included in schema)
- Test connection: `railway run node -e "console.log(process.env.DATABASE_URL)"`

### "Missing dependencies"
- Run `npm install` in backend directory
- Check `package.json` includes all dependencies
- Clear `node_modules` and reinstall

### "Port already in use"
- Railway/Render automatically set `PORT`
- Locally, use `PORT=8080 npm start`

### "ADMIN_API_KEY not set"
- Generate secure key: `openssl rand -hex 32`
- Set in platform's environment variables
- Restart service after setting

### "AWS credentials invalid"
- Verify IAM user has S3 permissions
- Check credentials are correct
- Ensure bucket exists and is accessible

---

## 📊 Monitoring & Logs

### Railway
```bash
# View logs
railway logs

# Monitor in real-time
railway logs -f
```

### Render
- Dashboard → Service → Logs tab
- Or use Shell tab for live monitoring

---

## 🚀 Performance Optimization (Optional)

### Add Redis Caching

**Railway:**
```bash
railway add --database redis
# REDIS_URL automatically set
```

**Render:**
1. New + → Redis
2. Copy Internal Redis URL
3. Set `REDIS_URL` in Web Service

### Add Error Tracking (Sentry)

1. Sign up at [sentry.io](https://sentry.io)
2. Create new project (Node.js/Express)
3. Copy DSN
4. Set `SENTRY_DSN` environment variable

---

## 📚 Additional Resources

- **Detailed Railway Guide**: See `RAILWAY_DEPLOY.md`
- **Detailed Render Guide**: See `RENDER_DEPLOY.md`
- **Database Setup**: See `DATABASE_SETUP_GUIDE.md`
- **API Documentation**: See `backend/README-CONSOLIDATED.md`
- **Analytics Guide**: See `ANALYTICS_GUIDE.md`
- **Dashboard Guide**: See `DASHBOARD_GUIDE.md`

---

## 💰 Cost Estimates

### Railway Free Tier
- $5 usage credit/month
- Good for development and low-traffic apps
- Upgrade: ~$5-20/month for production

### Render Free Tier
- Services sleep after 15 min inactivity
- 750 hours/month runtime
- Upgrade: $7/month for always-on

---

## 🎯 Next Steps

1. ✅ Deploy backend (you are here)
2. 🌐 Deploy frontend (separate guide)
3. 🔗 Connect frontend to backend API
4. 🧪 Test end-to-end functionality
5. 📈 Set up analytics dashboard
6. 🎉 Launch to users!

---

**Need help?** Check the detailed guides or open an issue on GitHub.
