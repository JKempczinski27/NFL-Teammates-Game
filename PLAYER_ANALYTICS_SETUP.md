# 🎯 NFL Games - Comprehensive Player Analytics Setup

## What Has Been Created

I've built a complete, production-ready analytics system for your NFL games based on the single `players` table. This system provides deep insights into player behavior, engagement, performance, and business metrics.

## 📦 Files Created

### 1. Database Schema
- **`backend/schema-player-analytics.sql`** (24KB)
  - 20+ analytics views
  - 2 materialized views for performance
  - 5+ analytics functions
  - All indexes and optimizations

### 2. API Routes
- **`backend/routes/player-analytics.js`** (23KB)
  - 30+ API endpoints
  - Full CRUD operations
  - CSV export functionality
  - Error handling and validation

### 3. Server Integration
- **`backend/index.js`** (modified)
  - Added player analytics routes
  - Routes available at `/api/player-analytics/*`

### 4. Scripts
- **`backend/scripts/init-analytics.js`** (8.3KB)
  - Automated setup script
  - Verification and testing
  - Color-coded output

### 5. Documentation
- **`backend/ANALYTICS_README.md`** (13KB)
  - Complete API documentation
  - All endpoints explained
  - SQL query examples
  - Maintenance guide

- **`backend/ANALYTICS_SUMMARY.md`** (8.8KB)
  - Quick reference guide
  - Key features overview
  - Common use cases
  - Integration examples

## 🚀 Quick Start

### Step 1: Initialize Analytics
```bash
# Run the initialization script
node backend/scripts/init-analytics.js
```

This will:
- ✓ Verify database connection
- ✓ Check for players table
- ✓ Create all analytics views
- ✓ Initialize materialized views
- ✓ Run test queries

### Step 2: Start Your Server
```bash
npm start
```

### Step 3: Access Analytics
```bash
# Main dashboard
curl http://localhost:8080/api/player-analytics/dashboard

# Quick stats
curl http://localhost:8080/api/player-analytics/stats
```

## 📊 What You Can Analyze

### 1. **Player Performance**
- Accuracy rates
- Completion rates
- Session metrics
- Best streaks
- Time spent

### 2. **Engagement Scoring**
- 0-100 engagement score
- 5 engagement tiers (Power User → New User)
- Activity status tracking
- Social engagement metrics

### 3. **Game-Specific Analytics**
- **Trivia**: Scores by team, skill levels, team loyalty
- **Journeyman**: Speed metrics, efficiency, best times
- **Teammates**: Accuracy, completion, performance trends

### 4. **Cohort Analysis**
- Weekly cohorts with return rates
- Monthly cohorts with 1-3 month retention
- Cohort performance comparison

### 5. **RFM Segmentation**
9 player segments:
- Champions (your best players)
- Loyal Players
- Promising New
- Potential Loyalists
- At Risk (need re-engagement)
- Hibernating
- Lost
- Need Attention

### 6. **Churn Prediction**
- 0-100 risk score
- 4 risk levels (Low → Critical)
- Recommended actions for each player
- Automated win-back suggestions

### 7. **Trends & Patterns**
- Daily/weekly activity trends
- New vs returning players
- Question volume trends
- Share activity patterns

### 8. **Cross-Game Analytics**
- Multi-game players
- Cross-play rates
- Game exclusivity metrics
- Game preference patterns

### 9. **Leaderboards**
- Overall leaderboard (all games combined)
- Game-specific leaderboards
- Skill-based rankings

### 10. **Lifetime Value**
- LTV scoring
- 4 value tiers (VIP → Standard)
- 6-month session projections
- Value tier distribution

## 🎯 Key Endpoints

### Daily Monitoring
```bash
GET /api/player-analytics/stats                    # Quick KPIs
GET /api/player-analytics/dashboard                # Main dashboard
GET /api/player-analytics/trends/daily?days=7      # Recent trends
```

### Player Insights
```bash
GET /api/player-analytics/player/:email            # Individual player
GET /api/player-analytics/performance              # All players
GET /api/player-analytics/engagement               # Engagement tiers
```

### Business Intelligence
```bash
GET /api/player-analytics/churn-risk               # At-risk players
GET /api/player-analytics/lifetime-value           # High-value players
GET /api/player-analytics/rfm                      # Player segments
```

### Retention Analysis
```bash
GET /api/player-analytics/cohorts/monthly          # Monthly retention
GET /api/player-analytics/cohorts/weekly           # Weekly cohorts
```

### Game Performance
```bash
GET /api/player-analytics/trivia                   # Trivia analytics
GET /api/player-analytics/journeyman               # Journeyman analytics
GET /api/player-analytics/teammates                # Teammates analytics
GET /api/player-analytics/cross-play               # Cross-game analysis
```

### Data Export
```bash
GET /api/player-analytics/export?type=churn_risk   # CSV export
POST /api/player-analytics/refresh                 # Refresh cache
```

## 📈 Analytics Views Created

### Performance Views
1. `v_player_performance_summary` - Overall performance metrics
2. `v_player_engagement_score` - Engagement scoring (0-100)
3. `v_trivia_analytics` - Trivia game analysis
4. `v_journeyman_analytics` - Journeyman game analysis
5. `v_teammates_analytics` - Teammates game analysis

### Cohort & Retention
6. `v_weekly_cohorts` - Weekly cohort analysis
7. `v_monthly_cohorts` - Monthly cohort with retention
8. `v_player_retention_7d` - 7-day retention tracking

### Segmentation
9. `v_player_rfm_analysis` - RFM segmentation
10. `v_churn_risk_analysis` - Churn prediction
11. `v_player_lifetime_value` - LTV analysis

### Trends
12. `v_daily_player_trends` - Daily activity
13. `v_weekly_player_trends` - Weekly activity

### Comparative
14. `v_game_cross_play_analysis` - Cross-game analysis
15. `v_team_loyalty_analysis` - Team-based analysis
16. `v_overall_leaderboard` - Overall rankings
17. `v_trivia_leaderboard` - Trivia rankings
18. `v_journeyman_leaderboard` - Journeyman rankings

### Statistics
19. `v_platform_statistics` - Platform-wide stats
20. `v_game_statistics` - Game-specific stats
21. `v_most_engaged_players` - Top engaged players
22. `v_recent_players` - Recent activity
23. `v_game_popularity` - Game popularity metrics

### Materialized Views (Cached)
24. `mv_analytics_dashboard` - Main dashboard cache
25. `mv_game_performance` - Game performance cache

## 🔧 Maintenance

### Hourly (Recommended)
```bash
# Refresh materialized views
curl -X POST http://localhost:8080/api/player-analytics/refresh
```

Or via cron:
```bash
0 * * * * psql $DATABASE_URL -c "SELECT refresh_player_analytics_views();"
```

### Daily Tasks
- Monitor churn risk levels
- Check active player counts
- Review top performers

### Weekly Tasks
- Analyze cohort trends
- Identify at-risk high-value players
- Review cross-game patterns

## 💡 Use Cases

### 1. Re-Engagement Campaign
```bash
# Get high-value at-risk players
GET /api/player-analytics/churn-risk?riskLevel=High

# Filter for VIP tier
GET /api/player-analytics/lifetime-value?tier=VIP
```

### 2. Performance Monitoring
```bash
# Daily active users trend
GET /api/player-analytics/trends/daily?days=30

# Game comparison
GET /api/player-analytics/cross-play
```

### 3. Player Insights
```bash
# Get specific player analysis
GET /api/player-analytics/player/user@example.com

# Get personalized insights with recommendations
```

### 4. Business Reporting
```bash
# Export churn risk data
GET /api/player-analytics/export?type=churn_risk

# Get segment distribution
GET /api/player-analytics/segments
```

## 📚 Documentation

- **Full API Docs**: `backend/ANALYTICS_README.md`
- **Quick Reference**: `backend/ANALYTICS_SUMMARY.md`
- **SQL Schema**: `backend/schema-player-analytics.sql`
- **Setup Script**: `backend/scripts/init-analytics.js`

## 🎨 Visualization Ideas

Create dashboards for:
1. **Executive**: DAU/WAU/MAU, churn rate, top segments
2. **Performance**: Top players, accuracy trends, completion rates
3. **Engagement**: Tiers, session patterns, social shares
4. **Retention**: Cohort curves, churn funnel
5. **Games**: Cross-game metrics, multi-game players

## ✅ What's Next

1. **Initialize the analytics**:
   ```bash
   node backend/scripts/init-analytics.js
   ```

2. **Test the endpoints**:
   ```bash
   curl http://localhost:8080/api/player-analytics/dashboard
   ```

3. **Set up cron job** for hourly refresh

4. **Build dashboards** using the API data

5. **Create email campaigns** using churn risk data

6. **Monitor player segments** and adjust engagement strategies

## 🎯 Key Metrics to Track

- **DAU/WAU/MAU**: Daily/Weekly/Monthly Active Users
- **Engagement Score**: Average across all players
- **Churn Rate**: % of players at High/Critical risk
- **Retention**: Month 1, 2, 3 retention rates
- **LTV Distribution**: % in each value tier
- **Cross-Play Rate**: % playing multiple games
- **Completion Rate**: Average game completion

## 🔐 Security

All endpoints are protected by:
- Express rate limiting
- Input validation
- SQL injection prevention
- Error handling

## 📞 Support

All analytics are documented and tested. If you need help:
1. Check `ANALYTICS_README.md` for detailed docs
2. Run `init-analytics.js` to verify setup
3. Review the SQL schema for view definitions

---

**Your comprehensive analytics system is ready to use!** 🚀

Initialize it with: `node backend/scripts/init-analytics.js`
