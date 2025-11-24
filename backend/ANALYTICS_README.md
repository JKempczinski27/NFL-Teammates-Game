# NFL Games - Comprehensive Player Analytics System

## Overview

This analytics system provides deep insights into player behavior, engagement, performance, and trends across all three NFL games (Teammates, Journeyman, and Trivia). Built on a single consolidated `players` table, it offers real-time analytics, predictive modeling, and actionable insights.

## Architecture

### Database Schema
- **Base Table**: `players` - Single comprehensive table containing all player data
- **Analytics Views**: 20+ specialized views for different analytics needs
- **Materialized Views**: 2 high-performance caches for dashboard data
- **Functions**: Analytics calculation and insight generation functions

### Key Components

1. **Player Performance Analytics** - Accuracy, completion rates, session metrics
2. **Engagement Scoring** - 0-100 engagement score with tier classification
3. **Game-Specific Analytics** - Trivia, Journeyman, Teammates performance
4. **Cohort Analysis** - Weekly and monthly cohort tracking with retention
5. **RFM Segmentation** - Recency, Frequency, Engagement value analysis
6. **Churn Prediction** - Risk scoring and recommended actions
7. **Lifetime Value** - Player value tiers and projections
8. **Cross-Game Analytics** - Multi-game play patterns
9. **Leaderboards** - Overall and game-specific rankings
10. **Trend Analysis** - Daily and weekly activity patterns

## Setup Instructions

### 1. Initialize Analytics Schema

Run the analytics schema to create all views and functions:

```bash
psql $DATABASE_URL -f backend/schema-player-analytics.sql
```

Or using the Node.js initialization script:

```bash
node backend/scripts/init-analytics.js
```

### 2. Register Routes

The player analytics routes are automatically registered in `backend/index.js`:

```javascript
const playerAnalyticsRouter = require('./routes/player-analytics');
app.use('/api/player-analytics', playerAnalyticsRouter);
```

### 3. Refresh Materialized Views

Set up a cron job or scheduled task to refresh materialized views hourly:

```sql
SELECT refresh_player_analytics_views();
```

Or use the API endpoint:

```bash
curl -X POST http://your-api-url/api/player-analytics/refresh
```

## API Endpoints

### Dashboard & Overview

#### `GET /api/player-analytics/dashboard`
Main analytics dashboard with key metrics across all games.

**Response:**
```json
{
  "success": true,
  "dashboard": {
    "total_players": 1500,
    "dau": 200,
    "wau": 850,
    "mau": 1200,
    "avg_sessions": 4.5,
    "avg_completion_rate": 67.3
  },
  "games": [...],
  "segments": [...]
}
```

#### `GET /api/player-analytics/overview`
Overall platform statistics and trends.

#### `GET /api/player-analytics/stats`
Quick stats summary for monitoring.

---

### Player Performance

#### `GET /api/player-analytics/performance`
Player performance summary with filtering.

**Query Parameters:**
- `gameType` - Filter by game type (teammates, journeyman, trivia)
- `minSessions` - Minimum session count (default: 1)
- `sortBy` - Sort field (accuracy_rate, completion_rate, total_sessions, etc.)
- `limit` - Result limit (default: 100)

**Example:**
```bash
GET /api/player-analytics/performance?gameType=trivia&minSessions=5&sortBy=accuracy_rate&limit=50
```

#### `GET /api/player-analytics/engagement`
Player engagement scores and tier classification.

**Query Parameters:**
- `tier` - Filter by tier (Power User, Engaged User, Regular User, Casual User, New User)
- `limit` - Result limit (default: 100)

**Engagement Tiers:**
- **Power User**: 20+ sessions, 80%+ completion
- **Engaged User**: 10+ sessions, 60%+ completion
- **Regular User**: 5+ sessions or 25+ questions
- **Casual User**: 2+ sessions
- **New User**: 1 session

---

### Player Details

#### `GET /api/player-analytics/player/:email`
Detailed analytics for a specific player.

**Response includes:**
- Player profile
- Performance metrics
- Engagement score and tier
- RFM segment
- Personalized insights

---

### Game-Specific Analytics

#### `GET /api/player-analytics/trivia`
NFL Trivia game analytics and leaderboards.

**Query Parameters:**
- `team` - Filter by favorite team
- `skillLevel` - Filter by skill (Expert, Advanced, Intermediate, Beginner, Novice)
- `limit` - Result limit

**Also includes:**
- Team loyalty analysis
- Skill level distribution
- Average scores by team

#### `GET /api/player-analytics/journeyman`
Journeyman game analytics.

**Query Parameters:**
- `skillLevel` - Filter by skill (Master, Expert, Skilled, Intermediate, Beginner)
- `limit` - Result limit

#### `GET /api/player-analytics/teammates`
NFL Teammates game analytics.

**Query Parameters:**
- `skillLevel` - Filter by skill level
- `limit` - Result limit

---

### Cohort Analysis

#### `GET /api/player-analytics/cohorts/weekly`
Weekly cohort analysis with return rates.

**Query Parameters:**
- `weeks` - Number of weeks to analyze (default: 12)

**Metrics:**
- Cohort size
- Return rate
- Engagement rate
- Average sessions per user

#### `GET /api/player-analytics/cohorts/monthly`
Monthly cohort analysis with retention tracking.

**Query Parameters:**
- `months` - Number of months to analyze (default: 12)

**Metrics:**
- Month 1, 2, 3 retention rates
- Average sessions and time per user

---

### RFM & Segmentation

#### `GET /api/player-analytics/rfm`
RFM (Recency, Frequency, Engagement) analysis.

**Query Parameters:**
- `segment` - Filter by segment
- `limit` - Result limit (default: 500)

**Player Segments:**
- **Champions**: High recency, frequency, and engagement
- **Loyal Players**: High frequency and engagement, moderate recency
- **Promising New**: Very recent, low frequency
- **Potential Loyalists**: Moderate across all metrics
- **At Risk**: Low recency, high historical engagement
- **Hibernating**: Low recency, moderate historical activity
- **Lost**: Very low recency and frequency
- **Need Attention**: Various concerning patterns

#### `GET /api/player-analytics/segments`
Overall segment distribution.

---

### Churn Prediction

#### `GET /api/player-analytics/churn-risk`
Churn risk analysis and predictions.

**Query Parameters:**
- `riskLevel` - Filter by risk (Critical, High, Medium, Low)
- `limit` - Result limit

**Risk Factors:**
- Days inactive (40 points max)
- Low completion rate (20 points max)
- Broken streak (20 points max)
- Low session count (20 points max)

**Recommended Actions:**
- Re-engagement campaign (Critical risk)
- Win-back email (High risk)
- Tutorial/help content (Low completion)
- Streak reminder (Broken streak)

---

### Trends & Time-Based Analytics

#### `GET /api/player-analytics/trends/daily`
Daily player activity trends.

**Query Parameters:**
- `days` - Number of days (default: 30)

**Metrics:**
- Active players
- New vs returning players
- Questions answered
- Share activity

#### `GET /api/player-analytics/trends/weekly`
Weekly player activity trends.

**Query Parameters:**
- `weeks` - Number of weeks (default: 12)

---

### Cross-Game Analytics

#### `GET /api/player-analytics/cross-play`
Cross-game play analysis and multi-game players.

**Metrics:**
- Exclusive vs multi-game players
- Cross-play rate by game
- Top multi-game players

---

### Leaderboards

#### `GET /api/player-analytics/leaderboard`
Overall leaderboard across all games.

**Scoring Formula:**
```
(sessions × 5) + (correct_answers × 2) + (streak × 10) + (completion_rate × 0.5) + (shares × 3)
```

#### `GET /api/player-analytics/leaderboard/trivia`
Trivia-specific leaderboard.

#### `GET /api/player-analytics/leaderboard/journeyman`
Journeyman-specific leaderboard.

---

### Lifetime Value

#### `GET /api/player-analytics/lifetime-value`
Player lifetime value analysis and projections.

**Query Parameters:**
- `tier` - Filter by tier (VIP, High Value, Medium Value, Standard)
- `limit` - Result limit

**Metrics:**
- Lifetime value score
- Total hours played
- Projected 6-month sessions
- Value tier classification

---

### Export & Admin

#### `GET /api/player-analytics/export`
Export analytics data as CSV.

**Query Parameters:**
- `type` - Export type (performance, engagement, churn_risk, rfm)
- `limit` - Result limit (default: 1000)

**Example:**
```bash
GET /api/player-analytics/export?type=churn_risk&limit=500
```

#### `POST /api/player-analytics/refresh`
Manually refresh materialized views (admin only).

---

## Database Views Reference

### Performance Views
- `v_player_performance_summary` - Overall player performance metrics
- `v_player_engagement_score` - Engagement scoring (0-100)
- `v_trivia_analytics` - Trivia game performance
- `v_journeyman_analytics` - Journeyman game performance
- `v_teammates_analytics` - Teammates game performance

### Cohort Views
- `v_weekly_cohorts` - Weekly cohort analysis
- `v_monthly_cohorts` - Monthly cohort with retention

### Segmentation Views
- `v_player_rfm_analysis` - RFM segmentation
- `v_churn_risk_analysis` - Churn prediction
- `v_player_lifetime_value` - LTV analysis

### Trend Views
- `v_daily_player_trends` - Daily activity trends
- `v_weekly_player_trends` - Weekly activity trends

### Comparative Views
- `v_game_cross_play_analysis` - Cross-game analysis
- `v_team_loyalty_analysis` - Team-based analysis
- `v_overall_leaderboard` - Overall rankings

### Statistical Views
- `v_platform_statistics` - Platform-wide stats
- `v_game_statistics` - Game-specific stats

### Materialized Views (Cached)
- `mv_analytics_dashboard` - Main dashboard cache
- `mv_game_performance` - Game performance cache

---

## Functions Reference

### `refresh_player_analytics_views()`
Refreshes all materialized views. Run hourly via cron.

```sql
SELECT refresh_player_analytics_views();
```

### `get_player_insights(player_email VARCHAR)`
Returns personalized insights for a specific player.

```sql
SELECT * FROM get_player_insights('player@example.com');
```

**Returns:**
- Engagement score and tier
- Performance tier
- Activity status

### `get_player_segment_distribution()`
Returns player distribution across engagement segments.

```sql
SELECT * FROM get_player_segment_distribution();
```

### `calculate_player_stats(player_email VARCHAR)`
Recalculates derived statistics for a player.

```sql
SELECT calculate_player_stats('player@example.com');
```

---

## Performance Optimization

### Indexes
All critical fields are indexed for fast queries:
- Email (unique)
- Session ID
- Game type
- Activity timestamps
- Scores and metrics
- JSONB fields (GIN indexes)

### Caching Strategy
1. **Materialized Views**: Refresh hourly for dashboard data
2. **Redis Cache**: API responses cached for 5-15 minutes
3. **Database Indexes**: Optimized for common query patterns

### Best Practices
1. Use materialized views for dashboard queries
2. Add pagination to large result sets
3. Filter by game type when possible
4. Use the stats endpoint for quick metrics
5. Refresh materialized views during off-peak hours

---

## Monitoring & Maintenance

### Daily Tasks
- Monitor active player counts
- Check churn risk levels
- Review error logs

### Weekly Tasks
- Analyze cohort retention trends
- Review top performers and at-risk players
- Check cross-game play patterns

### Monthly Tasks
- Generate executive summary reports
- Analyze monthly cohort retention
- Update player value tiers
- Review and optimize slow queries

### Health Checks
```bash
# Check total players
GET /api/player-analytics/stats

# Check materialized view freshness
SELECT last_updated FROM mv_analytics_dashboard;

# Check for null metrics (data quality)
SELECT COUNT(*) FROM players WHERE total_sessions > 0 AND completion_rate IS NULL;
```

---

## Example Queries

### Find High-Value At-Risk Players
```sql
SELECT p.*, c.churn_risk_score, l.lifetime_value_score
FROM players p
JOIN v_churn_risk_analysis c ON p.email = c.email
JOIN v_player_lifetime_value l ON p.email = l.email
WHERE c.churn_risk_level IN ('High', 'Critical')
  AND l.value_tier IN ('VIP', 'High Value')
ORDER BY l.lifetime_value_score DESC
LIMIT 50;
```

### Compare Cohort Performance
```sql
SELECT
  cohort_month,
  cohort_size,
  retention_month_1,
  retention_month_2,
  retention_month_3,
  avg_sessions_per_user
FROM v_monthly_cohorts
WHERE cohort_month >= CURRENT_DATE - INTERVAL '6 months'
ORDER BY cohort_month DESC;
```

### Top Multi-Game Players
```sql
SELECT
  name,
  email,
  games_played,
  total_sessions,
  completion_rate
FROM players
WHERE array_length(games_played, 1) >= 3
ORDER BY total_sessions DESC
LIMIT 100;
```

---

## Support & Troubleshooting

### Common Issues

**Slow Dashboard Loading**
- Ensure materialized views are refreshed
- Check database connection pool
- Enable Redis caching

**Missing Data in Views**
- Verify players table has data
- Check that total_sessions > 0
- Refresh materialized views

**High Churn Rates**
- Review recommended actions in churn_risk_analysis
- Check onboarding completion rates
- Analyze dropout patterns by game

---

## Changelog

### Version 1.0 (2025-11-24)
- Initial comprehensive analytics system
- 20+ analytics views
- Player performance, engagement, and churn analytics
- RFM segmentation
- Cohort analysis
- Lifetime value calculations
- Full API coverage

---

## License

Proprietary - NFL Games Analytics System
