# NFL Games - Unified Monorepo Deployment Guide

## Overview

This monorepo contains all NFL games accessible from a single deployment URL. All games, the landing page, dashboard, and backend API are deployed together to Vercel.

## 🎮 Available Games

When deployed, all games are accessible from a single domain:

- **Landing Page**: `https://your-domain.vercel.app/`
- **NFL Teammates Game**: `https://your-domain.vercel.app/teammates`
- **NFL Trivia Game**: `https://your-domain.vercel.app/trivia`
- **Journeyman Game**: `https://your-domain.vercel.app/journeyman`
- **Dashboard**: `https://your-domain.vercel.app/dashboard`
- **Backend API**: `https://your-domain.vercel.app/api/*`

## 📦 Project Structure

```
NFL-Teammates-Game/
├── public/                    # Unified build output (generated)
│   ├── index.html            # Landing page
│   ├── teammates/            # NFL Teammates game
│   ├── trivia/               # NFL Trivia game
│   ├── journeyman/           # Journeyman game
│   └── dashboard/            # Analytics dashboard
├── api/
│   └── backend.js            # Serverless function wrapper
├── backend/                  # Express backend (consolidated)
├── landing-page/             # Landing page source
├── nfl-teammates-game/       # NFL Teammates source
├── nfl-trivia-game/          # NFL Trivia source
├── journeyman/               # Journeyman source
├── dashboard/                # Dashboard source
├── build-unified.js          # Unified build script
├── package.json              # Root package with workspaces
└── vercel.json               # Vercel deployment config
```

## 🚀 Deployment to Vercel

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional): `npm install -g vercel`
3. **Environment Variables**: Set up in Vercel dashboard

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Connect Repository**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Select the root directory

2. **Configure Build Settings**:
   - Framework Preset: **Other**
   - Build Command: `npm run vercel-build` (auto-detected from `vercel.json`)
   - Output Directory: `public` (auto-detected from `vercel.json`)
   - Install Command: `npm install` (auto-detected)

3. **Set Environment Variables**:
   ```
   DATABASE_URL=your_postgres_connection_string
   NODE_ENV=production
   SENTRY_DSN=your_sentry_dsn (optional)
   REDIS_URL=your_redis_url (optional)
   ```

4. **Deploy**: Click "Deploy"

### Method 2: Deploy via CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## 🛠️ Build Process

The unified build process is handled by `build-unified.js`:

### What it does:

1. **Builds each application**:
   - Landing page (React CRA) → `landing-page/build`
   - NFL Teammates (React CRA) → `nfl-teammates-game/build`
   - NFL Trivia (Vite) → `nfl-trivia-game/dist`
   - Journeyman (React CRA) → `journeyman/build`

2. **Consolidates into `public/`**:
   - Copies landing page to `public/` (root)
   - Copies teammates to `public/teammates/`
   - Copies trivia to `public/trivia/`
   - Copies journeyman to `public/journeyman/`
   - Copies dashboard to `public/dashboard/`

3. **Creates routing configuration** for SPA routing

### Running the build locally:

```bash
# Install dependencies
npm install

# Run unified build
npm run build

# Serve locally to test
npm run serve
# OR
npx serve public
```

## 🔧 Development

### Running individual games in development:

```bash
# Landing page
npm run dev:landing

# NFL Teammates
npm run dev:teammates

# NFL Trivia
npm run dev:trivia

# Journeyman
npm run dev:journeyman

# Backend
npm run dev:backend
```

### Running tests:

```bash
# All tests
npm test

# Individual game tests
npm run test:teammates
npm run test:trivia
npm run test:journeyman
npm run test:backend
```

## 🌐 Routing Configuration

The `vercel.json` file configures routing:

### SPA Routing

Each game is a single-page application. The routing ensures that:

- `/teammates` → serves `teammates/index.html`
- `/teammates/*` → serves `teammates/index.html` (for React Router)
- `/trivia` → serves `trivia/index.html`
- `/trivia/*` → serves `trivia/index.html`
- Same pattern for `/journeyman` and `/dashboard`

### API Routing

- All `/api/*` requests → routed to serverless function `api/backend.js`
- Backend Express app handles all API endpoints

### Static Assets

- Cached for 1 year with `Cache-Control: public, max-age=31536000, immutable`
- Applies to: `.js`, `.css`, `.png`, `.jpg`, `.svg`, `.woff`, etc.

## 📊 Backend Configuration

The backend runs as a Vercel serverless function:

### Key files:
- `backend/index.js` - Main Express app (exports app)
- `api/backend.js` - Serverless wrapper (imports and exports backend app)

### Database:
- PostgreSQL via `DATABASE_URL` environment variable
- Connection pooling configured for serverless (max 1 connection)

### Endpoints:
```
GET  /                          - API info
GET  /health                    - Health check
GET  /api/db-test              - Database test
POST /api/track                 - Event tracking
GET  /api/players/*            - Player data
GET  /api/analytics/*          - Analytics
GET  /api/trivia/*             - Trivia endpoints
GET  /api/journeyman/*         - Journeyman endpoints
POST /api/game-data            - Game submissions
GET  /api/data-protection      - GDPR endpoints
```

## 🔐 Environment Variables

Set these in Vercel dashboard under **Settings → Environment Variables**:

### Required:
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Set to `production`

### Optional:
- `SENTRY_DSN` - Error tracking
- `REDIS_URL` - Caching layer
- `AWS_ACCESS_KEY_ID` - S3 access
- `AWS_SECRET_ACCESS_KEY` - S3 secret
- `AWS_REGION` - S3 region
- `S3_BUCKET_NAME` - S3 bucket

## 🧪 Testing the Deployment

After deployment, test each endpoint:

```bash
# Replace YOUR_DOMAIN with your Vercel URL

# Test landing page
curl https://YOUR_DOMAIN.vercel.app/

# Test games
curl https://YOUR_DOMAIN.vercel.app/teammates
curl https://YOUR_DOMAIN.vercel.app/trivia
curl https://YOUR_DOMAIN.vercel.app/journeyman

# Test dashboard
curl https://YOUR_DOMAIN.vercel.app/dashboard

# Test backend API
curl https://YOUR_DOMAIN.vercel.app/health
curl https://YOUR_DOMAIN.vercel.app/api/players
```

## 🐛 Troubleshooting

### Build fails

**Check build logs in Vercel dashboard**:
- Ensure all dependencies are in `package.json` (not just devDependencies)
- Verify Node version compatibility (requires Node 18+)

### Games not loading

**Check browser console for errors**:
- Verify static assets are loading (check Network tab)
- Check routing configuration in `vercel.json`
- Ensure `publicPath` is set correctly in each game's build config

### API not working

**Check serverless function logs**:
- Verify `DATABASE_URL` is set in environment variables
- Check database connection (test with `/api/db-test`)
- Ensure backend dependencies are installed

### SPA routing 404s

**Verify rewrites in `vercel.json`**:
- Each game should have a rewrite rule for `/:path*` → `/index.html`
- Check that regex patterns match correctly

## 📝 Maintenance

### Adding a new game

1. Create game in a new directory
2. Add to `workspaces` in root `package.json`
3. Update `build-unified.js` to build and copy the game
4. Add routing rules to `vercel.json`
5. Test locally with `npm run build && npm run serve`

### Updating dependencies

```bash
# Update all workspaces
npm run install:workspaces

# Update specific workspace
cd landing-page && npm update
```

### Cleaning builds

```bash
# Clean all builds and node_modules
npm run clean
```

## 🎯 Benefits of Unified Deployment

✅ **Single URL**: All games accessible from one domain
✅ **Simplified deployment**: One command deploys everything
✅ **Shared backend**: Single API serves all games
✅ **Consistent environment**: Same environment variables across all apps
✅ **Easier maintenance**: Update all games in one place
✅ **Better caching**: Shared CDN and edge network
✅ **Lower costs**: One Vercel project instead of multiple

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Monorepo Guide](https://vercel.com/docs/concepts/monorepos)
- [Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## 🆘 Support

For issues or questions:
1. Check the [troubleshooting section](#-troubleshooting)
2. Review Vercel deployment logs
3. Open an issue on GitHub
