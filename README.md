# NFL Games Collection

A collection of three interactive NFL trivia and guessing games with a unified backend infrastructure.

## 📁 Project Structure

```
NFL-Teammates-Game/
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
├── nfl-teammates-game/        # NFL Teammates Game (frontend)
│   ├── src/
│   ├── public/
│   └── package.json
│
├── journeyman/                # Journeyman Game (frontend)
│   ├── src/
│   ├── public/
│   └── package.json
│
├── nfl-trivia-game/           # NFL Trivia Game (frontend)
│   ├── src/
│   ├── public/
│   └── package.json
│
└── Documentation files...
```

## 🎮 Games

### 1. NFL Teammates Game
Interactive game where players guess which NFL teams two players have in common.

**Location**: `nfl-teammates-game/`

### 2. Journeyman
Challenge players to identify NFL players who have played for multiple teams throughout their careers.

**Location**: `journeyman/`

### 3. NFL Trivia Game
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
- **Quick Deploy**: `QUICK_DEPLOY.md` - Fast deployment guide
- **Railway Deploy**: `RAILWAY_DEPLOY.md` - Detailed Railway setup
- **Render Deploy**: `RENDER_DEPLOY.md` - Detailed Render setup
- **Backend Docs**: `backend/README-CONSOLIDATED.md` - API reference
- **Backend Summary**: `BACKEND_CONSOLIDATION_SUMMARY.md`

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

## 🔐 Security

- ✅ Input validation on all endpoints
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ Rate limiting
- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ GDPR compliance endpoints

## 📊 Database Tables

**Core Tables**:
- `events` - All tracking events
- `user_sessions` - Session tracking
- `question_analytics` - Question metrics
- `share_analytics` - Social sharing
- `players` - Player information
- `game_submissions` - Game results

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
