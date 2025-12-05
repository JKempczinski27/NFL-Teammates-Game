# NFL Games Collection

A collection of three interactive NFL trivia and guessing games with a unified backend infrastructure.

## 📁 Project Structure

```
NFL-Teammates-Game/
├── landing-page/               # 🆕 Unified game selector landing page
│   ├── src/
│   │   ├── components/        # Landing & GameSelector components
│   │   ├── hooks/             # Player stats tracking
│   │   └── fonts/             # Custom fonts
│   ├── public/                # Game thumbnails & assets
│   └── package.json
│
├── backend/                    # Shared backend for all three games
│   ├── routes/
│   │   ├── analytics.js       # Comprehensive analytics API
│   │   ├── track.js           # Event tracking
│   │   ├── players.js         # Player management
│   │   ├── game-data.js       # Game submissions
│   │   └── data-protection.js # GDPR compliance
│   ├── public/
│   │   ├── dashboard.html     # Analytics dashboard
│   │   ├── dashboard.css
│   │   └── dashboard.js
│   ├── schema-consolidated.sql # Main database schema
│   ├── schema-analytics.sql    # Analytics tables & views
│   ├── package.json
│   └── index.js               # Main server file
│
├── nfl-teammates-game/        # NFL Teammates Game ("Huddle")
│   ├── src/
│   ├── public/
│   └── package.json
│
├── journeyman/                # Journeyman Game
│   ├── src/
│   ├── public/
│   └── package.json
│
├── nfl-trivia-game/           # NFL Trivia Game ("Long Drive")
│   ├── src/
│   ├── public/
│   └── package.json
│
└── Documentation files...
```

## 🎮 Landing Page & Games

### 🆕 NFL GameHub Landing Page
A unified landing page that provides a game selector interface for all three NFL games.

**Location**: `landing-page/`

**Features**:
- Retro arcade-themed design with football pattern background
- Game selector with thumbnails for all three games
- Player stats tracking (days played, streaks, game completions)
- Responsive design for desktop and mobile
- Privacy-conscious localStorage-based tracking

**Routes**:
- `/` - Main landing page with "Enter" button
- `/games` - Game selector showing all available games
- `/trivia` - Long Drive (trivia game)
- `/teammates` - Huddle (teammates game)
- `/journeyman` - Journeyman game

See `LANDING_PAGE_INTEGRATION.md` for detailed integration documentation.

### 1. NFL Teammates Game ("Huddle")
Interactive game where players guess which NFL teams two players have in common.

**Location**: `nfl-teammates-game/`

### 2. Journeyman
Challenge players to identify NFL players who have played for multiple teams throughout their careers.

**Location**: `journeyman/`

### 3. NFL Trivia Game ("Long Drive")
Test your NFL knowledge with trivia questions across various categories.

**Location**: `nfl-trivia-game/`

## 🚀 Backend

All three games share a **consolidated backend** with:

- ✅ Unified database schema with `game_type` separation
- ✅ Comprehensive analytics system (DAU, WAU, MAU, retention, engagement)
- ✅ Real-time analytics dashboard
- ✅ Event tracking for all games
- ✅ GDPR compliance features
- ✅ Social sharing analytics
- ✅ Question performance metrics
- ✅ Player leaderboards

**Location**: `backend/`

**Key Features**:
- Single deployment for all games
- Cost-efficient (66% reduction)
- Advanced analytics with 15+ database views
- Beautiful web dashboard with Chart.js
- CSV data export

## 📊 Analytics & Dashboard

Access the analytics dashboard at:
```
https://your-api.railway.app/dashboard
```

**Features**:
- Real-time metrics for all three games
- DAU/WAU/MAU trends
- Completion rates and engagement levels
- Question performance analysis
- User retention tracking
- Social sharing effectiveness
- Leaderboards by game
- Data export to CSV

See `DASHBOARD_GUIDE.md` and `ANALYTICS_GUIDE.md` for details.

## 🚢 Deployment

### Quick Deploy (Recommended)

See `QUICK_DEPLOY.md` for step-by-step instructions.

**Railway** (easiest):
```bash
railway init
railway add --database postgresql
railway up
railway run psql $DATABASE_URL -f backend/schema-consolidated.sql
railway run psql $DATABASE_URL -f backend/schema-analytics.sql
```

**Render**:
1. Create Web Service pointing to `backend/`
2. Add PostgreSQL database
3. Set environment variables
4. Run migrations via Shell

### Environment Variables

```bash
DATABASE_URL=postgresql://...    # Auto-set by platform
PORT=8080                        # Auto-set by platform
ADMIN_API_KEY=                   # Generate with: openssl rand -hex 32
AWS_REGION=us-east-1            # If using S3
AWS_ACCESS_KEY_ID=              # If using S3
AWS_SECRET_ACCESS_KEY=          # If using S3
S3_BUCKET_NAME=                 # If using S3
REDIS_URL=                      # Optional: for caching
SENTRY_DSN=                     # Optional: error tracking
```

## 📚 Documentation

### Backend & Deployment
- **🆕 Landing Page Integration**: `LANDING_PAGE_INTEGRATION.md` - GameHub integration guide
- **Quick Deploy**: `QUICK_DEPLOY.md` - Fast deployment guide
- **Railway Deploy**: `RAILWAY_DEPLOY.md` - Detailed Railway setup
- **Render Deploy**: `RENDER_DEPLOY.md` - Detailed Render setup
- **Backend Docs**: `backend/README-CONSOLIDATED.md` - API reference
- **Backend Summary**: `BACKEND_CONSOLIDATION_SUMMARY.md`

### Privacy & Compliance
- **🆕 OneTrust Setup**: `ONETRUST_SETUP.md` - Complete cookie consent integration guide

### Analytics & Data
- **Analytics Guide**: `ANALYTICS_GUIDE.md` - All analytics endpoints
- **Dashboard Guide**: `DASHBOARD_GUIDE.md` - Dashboard usage
- **Database Setup**: `DATABASE_SETUP_GUIDE.md`
- **Database Verification**: `DATABASE_VERIFICATION_REPORT.md`

### Testing & Performance
- **Testing Strategy**: `TESTING_STRATEGY.md`
- **Test Execution**: `TEST_EXECUTION_GUIDE.md`
- **Super Bowl Testing**: `SUPERBOWL_TESTING_GUIDE.md`
- **Performance Setup**: `PERFORMANCE_SETUP.md`

### Additional
- **Tracking Docs**: `TRACKING_DOCUMENTATION.md`
- **S3 Setup**: `S3_SETUP_MANUAL.md`
- **S3 Dashboard**: `S3_DASHBOARD_SETUP.md`

## 🔧 Development

### Install Dependencies

**Landing Page** (NEW):
```bash
cd landing-page
npm install
```

**Backend**:
```bash
cd backend
npm install
```

**Each Frontend**:
```bash
cd nfl-teammates-game
npm install

cd ../journeyman
npm install

cd ../nfl-trivia-game
npm install
```

### Run Locally

**Option 1: Run Landing Page** (Recommended for unified experience):
```bash
cd landing-page
npm start
# Runs on http://localhost:3000
# Provides unified access to all games
```

**Option 2: Run Individual Games**:

**Backend**:
```bash
cd backend
npm start
# Runs on http://localhost:8080
```

**Frontends** (each in separate terminal):
```bash
cd nfl-teammates-game && npm start
cd journeyman && npm start
cd nfl-trivia-game && npm start
```

### Database Setup

```bash
# Local PostgreSQL
psql -U postgres -c "CREATE DATABASE nfl_games;"
psql -U postgres -d nfl_games -f backend/schema-consolidated.sql
psql -U postgres -d nfl_games -f backend/schema-analytics.sql
```

## 📈 Analytics API Examples

```bash
# Dashboard overview
curl https://your-api.railway.app/api/analytics/dashboard

# Daily active users (last 30 days)
curl https://your-api.railway.app/api/analytics/dau?days=30

# Question performance for NFL Teammates
curl https://your-api.railway.app/api/analytics/question-performance?gameType=teammates

# Leaderboard for Journeyman
curl https://your-api.railway.app/api/analytics/leaderboard/journeyman?limit=20

# Export sessions data as CSV
curl https://your-api.railway.app/api/analytics/export/trivia?type=sessions > sessions.csv
```

See `ANALYTICS_GUIDE.md` for full API documentation.

## 🔐 Security & Privacy

- ✅ Input validation on all endpoints
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ Rate limiting
- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ GDPR compliance endpoints
- ✅ **OneTrust Cookie Consent** - GDPR-compliant cookie management

### 🍪 OneTrust Cookie Consent

This project includes full OneTrust integration for cookie consent management and GDPR compliance.

**Features**:
- Cookie consent banner on all apps
- Granular consent categories (Necessary, Performance, Functional, Targeting)
- Automatic consent verification before analytics tracking
- Backend consent audit logging
- React hook for easy consent management

**Setup**: See `ONETRUST_SETUP.md` for complete integration guide.

**Quick Start**:
1. Get your OneTrust Domain Script ID from https://my.onetrust.com/
2. Add to `.env` files: `REACT_APP_ONETRUST_DOMAIN_SCRIPT_ID=your-id`
3. Run database migration: `backend/migrations/001_create_consent_log_table.sql`
4. Deploy and test

All code is ready - just add your credentials!

## 📊 Database Tables

**Core Tables**:
- `events` - All tracking events
- `user_sessions` - Session tracking
- `question_analytics` - Question metrics
- `share_analytics` - Social sharing
- `players` - Player information
- `game_submissions` - Game results
- `consent_log` - OneTrust cookie consent audit trail

**Analytics Tables**:
- `daily_metrics` - Daily KPIs
- `hourly_metrics` - Hourly stats
- `question_difficulty_metrics` - Question performance
- `user_cohorts` - Retention cohorts
- `funnel_metrics` - Conversion funnels

**Views**: 15+ analytics views including DAU, WAU, MAU, engagement, retention, dropout analysis, and more.

See `backend/schema-analytics.sql` for complete schema.

## 💰 Cost Estimates

**Consolidated Backend** (all 3 games):
- Railway: $5-7/month (Free tier available)
- Render: $7-14/month (Free tier available)

**Savings**: 66% reduction vs. separate backends ($36-42/month → $12-14/month)

## 🎯 Next Steps

1. ✅ Deploy backend (see `QUICK_DEPLOY.md`)
2. ✅ Run database migrations
3. ✅ Verify API endpoints
4. 🌐 Deploy each frontend separately
5. 🔗 Connect frontends to backend API
6. 📊 Access analytics dashboard
7. 🧪 Test end-to-end functionality
8. 🎉 Launch to users!

## 📞 Support

For issues or questions:
1. Check the documentation files listed above
2. Review `backend/README-CONSOLIDATED.md` for API details
3. Check `TROUBLESHOOTING.md` (if available)
4. Open an issue on GitHub

## 📄 License

[Your License Here]

---

**Built with**: Node.js, Express, PostgreSQL, React, Chart.js

**Analytics Powered by**: Custom analytics system with materialized views and real-time dashboards

**Deployed on**: Railway / Render (your choice)
