# Vercel Deployment Checklist

Use this checklist to ensure your Vercel deployment is set up correctly.

## Pre-Deployment Checklist

- [ ] **PostgreSQL Database Ready**
  - Database created (Neon, Supabase, Railway, etc.)
  - Connection string obtained
  - Database URL includes SSL parameters

- [ ] **Database Schema Initialized**
  - `schema-consolidated.sql` executed
  - `schema-analytics.sql` executed
  - Tables verified with `\dt` command in psql

- [ ] **Vercel Account**
  - Account created at vercel.com
  - GitHub/GitLab connected (if using Git deployment)

- [ ] **Environment Variables Prepared**
  - `DATABASE_URL` - PostgreSQL connection string
  - `ADMIN_API_KEY` - Generated (optional but recommended)
  - `REDIS_URL` - If using Redis (optional)
  - `SENTRY_DSN` - If using Sentry (optional)

## Deployment Checklist

- [ ] **Files Created**
  - ✅ `vercel.json` - Vercel configuration
  - ✅ `.vercelignore` - Files to exclude from deployment
  - ✅ `VERCEL_DEPLOY.md` - Deployment guide

- [ ] **Deploy to Vercel**
  - Via CLI: `vercel` or `vercel --prod`
  - Via Dashboard: Import project from Git

- [ ] **Environment Variables Set**
  - `DATABASE_URL` added in Vercel dashboard
  - `ADMIN_API_KEY` added (if using)
  - Other optional variables added

## Post-Deployment Verification

- [ ] **Test Endpoints**
  ```bash
  # Health check
  curl https://your-project.vercel.app/health

  # Database test
  curl https://your-project.vercel.app/api/db-test

  # Dashboard access
  open https://your-project.vercel.app/dashboard
  ```

- [ ] **Verify Dashboard Loads**
  - Dashboard HTML loads correctly
  - CSS styles are applied
  - JavaScript is working
  - Charts render properly

- [ ] **Test Analytics API**
  ```bash
  curl https://your-project.vercel.app/api/analytics/dashboard
  ```

- [ ] **Check Logs**
  - Via CLI: `vercel logs`
  - Via Dashboard: Check deployment logs
  - No errors in console

- [ ] **Performance Check**
  - API responses under 2 seconds
  - Dashboard loads quickly
  - No timeout errors

## Configuration Verification

### ✅ Optimizations Applied

- [x] Database pool optimized for serverless (1 connection)
- [x] Idle timeout reduced to 1 second for Vercel
- [x] `allowExitOnIdle` enabled for serverless
- [x] Memory allocation set to 1024 MB
- [x] Max duration set to 10 seconds
- [x] Static files configured properly
- [x] Public directory served correctly

### Files Structure
```
backend/
├── index.js                    ✅ Main Express app
├── package.json                ✅ Dependencies
├── vercel.json                 ✅ Vercel config
├── .vercelignore              ✅ Ignore file
├── VERCEL_DEPLOY.md           ✅ Deploy guide
├── VERCEL_CHECKLIST.md        ✅ This file
├── public/
│   ├── dashboard.html         ✅ Dashboard UI
│   ├── dashboard.css          ✅ Styles
│   ├── dashboard.js           ✅ Client-side JS
│   └── analytics-dashboard.html ✅ Analytics UI
└── routes/
    ├── analytics.js           ✅ Analytics API
    ├── track.js               ✅ Event tracking
    └── ...                    ✅ Other routes
```

## Common Issues & Solutions

### Issue: "Function execution timeout"
- **Solution**: Increase `maxDuration` in vercel.json (requires Pro plan for >10s)
- **Alternative**: Optimize slow database queries

### Issue: "Database connection error"
- **Solution**: Verify `DATABASE_URL` in environment variables
- **Check**: Database allows connections from Vercel IPs
- **Check**: Connection string includes `?sslmode=require`

### Issue: "Static files not loading"
- **Solution**: Verify files exist in `public/` directory
- **Check**: vercel.json routes configuration
- **Check**: Browser console for 404 errors

### Issue: "Too many database connections"
- **Solution**: Already optimized! Uses 1 connection in Vercel
- **Check**: Verify `VERCEL=1` environment variable is set (auto-set by Vercel)

### Issue: "CORS errors"
- **Solution**: Update CORS configuration in index.js
- **Check**: Allow your frontend domains in CORS settings

## Security Checklist

- [ ] **Dashboard Authentication** (recommended for production)
  - Uncomment auth check in `index.js` lines 115-118
  - Set `ADMIN_API_KEY` environment variable
  - Test with: `curl -H "x-admin-token: YOUR_KEY" https://your-project.vercel.app/dashboard`

- [ ] **Rate Limiting Configured**
  - ✅ 100 requests per 15 minutes (API routes)
  - ✅ 20 requests per 15 minutes (write operations)

- [ ] **CORS Restrictions**
  - Update `cors()` in index.js to restrict origins
  - Example: `cors({ origin: ['https://yourfrontend.com'] })`

- [ ] **Environment Variables Secure**
  - Never commit `.env` files
  - Use Vercel's environment variable UI
  - Rotate `ADMIN_API_KEY` periodically

## Optional Enhancements

- [ ] **Custom Domain**
  - Add custom domain in Vercel dashboard
  - Update DNS records
  - Enable automatic HTTPS

- [ ] **Analytics & Monitoring**
  - Upgrade to Pro for Vercel Analytics
  - Enable Sentry for error tracking
  - Set up uptime monitoring (UptimeRobot, etc.)

- [ ] **Redis Caching**
  - Add Redis database (Upstash recommended for Vercel)
  - Set `REDIS_URL` environment variable
  - Improves dashboard load times

- [ ] **CI/CD Pipeline**
  - Enable automatic deployments from Git
  - Set up staging environment
  - Configure deployment hooks

## Performance Benchmarks

Expected response times:
- Health check: < 100ms
- Database test: < 500ms
- Dashboard page: < 1s
- Analytics API: 1-3s (depending on data volume)

If responses are slower, consider:
- Adding database indexes
- Implementing Redis caching
- Optimizing SQL queries

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Support**: https://vercel.com/support
- **Community**: https://github.com/vercel/vercel/discussions
- **Status Page**: https://vercel-status.com

---

**All Done?** 🎉

If all checkboxes are marked, your backend is successfully deployed to Vercel!

Access your dashboard at: `https://your-project-name.vercel.app/dashboard`
