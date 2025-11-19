# NFL Games Analytics Guide

## 📊 Complete Analytics System

The consolidated NFL Games backend includes a comprehensive analytics system with **advanced metrics, dashboards, and insights** for all three games.

---

## 🚀 Quick Start

### 1. **Apply Analytics Schema**

```bash
# After deploying the backend, run analytics schema
psql $DATABASE_URL -f nfl-teamates-game/backend/schema-analytics.sql
```

### 2. **Access Dashboard**

```bash
curl https://your-api.railway.app/api/analytics/dashboard
```

### 3. **Refresh Analytics** (optional)

```bash
curl -X POST https://your-api.railway.app/api/analytics/refresh
```

---

## 📡 Analytics Endpoints

### **Dashboard & Overview**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/dashboard` | GET | Main dashboard with key metrics |
| `/api/analytics/overview/:gameType` | GET | Detailed overview for specific game |

**Example:**
```bash
# Get main dashboard
curl https://your-api.railway.app/api/analytics/dashboard

# Get NFL Teammates overview
curl https://your-api.railway.app/api/analytics/overview/teammates
```

### **User Activity Metrics**

| Endpoint | Method | Description | Query Params |
|----------|--------|-------------|--------------|
| `/api/analytics/dau` | GET | Daily Active Users | `?gameType=teammates&days=30` |
| `/api/analytics/wau` | GET | Weekly Active Users | `?gameType=journeyman` |
| `/api/analytics/mau` | GET | Monthly Active Users | `?gameType=trivia` |
| `/api/analytics/engagement` | GET | Engagement levels | `?gameType=teammates` |

**Example:**
```bash
# Get DAU for last 90 days
curl "https://your-api.railway.app/api/analytics/dau?days=90"

# Get engagement for Journeyman
curl "https://your-api.railway.app/api/analytics/engagement?gameType=journeyman"
```

### **Question Performance**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/question-performance` | GET | All questions performance |
| `/api/analytics/question/:gameType/:questionIndex` | GET | Specific question details |

**Example:**
```bash
# Get all question performance for Teammates
curl "https://your-api.railway.app/api/analytics/question-performance?gameType=teammates"

# Get details for question #5
curl "https://your-api.railway.app/api/analytics/question/teammates/5"
```

### **Social & Sharing**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/share-analytics` | GET | Platform effectiveness |

**Example:**
```bash
curl "https://your-api.railway.app/api/analytics/share-analytics?gameType=teammates"
```

### **Time Patterns**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/hourly-patterns` | GET | Activity by hour of day |
| `/api/analytics/weekly-patterns` | GET | Activity by day of week |
| `/api/analytics/session-duration` | GET | Session duration distribution |

**Example:**
```bash
# See when users play most
curl "https://your-api.railway.app/api/analytics/hourly-patterns?gameType=teammates"
```

### **Retention & Dropout**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/dropout-analysis` | GET | Where users drop off |
| `/api/analytics/retention` | GET | 7-day retention rates |

**Example:**
```bash
curl "https://your-api.railway.app/api/analytics/dropout-analysis?gameType=journeyman"
curl "https://your-api.railway.app/api/analytics/retention?days=90&gameType=trivia"
```

### **Leaderboards**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/leaderboard/:gameType` | GET | Top players by score |

**Example:**
```bash
# Get top 50 players
curl "https://your-api.railway.app/api/analytics/leaderboard/journeyman?limit=50"
```

### **Events**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/events` | GET | Event type distribution |
| `/api/analytics/session/:sessionId` | GET | Detailed session data |

**Example:**
```bash
curl "https://your-api.railway.app/api/analytics/events?gameType=teammates"
curl "https://your-api.railway.app/api/analytics/session/abc123"
```

### **Data Export**

| Endpoint | Method | Description | Query Params |
|----------|--------|-------------|--------------|
| `/api/analytics/export/:gameType` | GET | Export data as CSV | `?type=sessions\|questions\|shares` |

**Example:**
```bash
# Export all sessions to CSV
curl "https://your-api.railway.app/api/analytics/export/teammates?type=sessions" > teammates_sessions.csv

# Export question data
curl "https://your-api.railway.app/api/analytics/export/journeyman?type=questions" > questions.csv
```

### **Admin Functions**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/refresh` | POST | Refresh materialized views |
| `/api/analytics/calculate-daily/:date` | POST | Calculate daily metrics |

**Example:**
```bash
# Refresh analytics cache
curl -X POST "https://your-api.railway.app/api/analytics/refresh"

# Calculate metrics for yesterday
curl -X POST "https://your-api.railway.app/api/analytics/calculate-daily/2025-11-18"
```

---

## 📊 Database Schema

### **Aggregated Metrics Tables**

| Table | Purpose | Updates |
|-------|---------|---------|
| `daily_metrics` | Daily KPIs by game | Daily (automated) |
| `hourly_metrics` | Real-time hourly data | Hourly |
| `question_difficulty_metrics` | Question performance | On-demand |
| `user_cohorts` | Retention analysis | Monthly |
| `funnel_metrics` | Conversion funnels | Daily |

### **Analytics Views**

| View | Description | Use Case |
|------|-------------|----------|
| `v_game_overview` | High-level game stats | Dashboard overview |
| `v_daily_active_users` | DAU by game | Trend analysis |
| `v_weekly_active_users` | WAU by game | Weekly reports |
| `v_monthly_active_users` | MAU by game | Monthly reports |
| `v_user_engagement` | Engagement levels | User segmentation |
| `v_question_performance` | Question difficulty | Content optimization |
| `v_share_effectiveness` | Share platform ROI | Social strategy |
| `v_hourly_patterns` | Peak hours | Capacity planning |
| `v_weekly_patterns` | Peak days | Marketing timing |
| `v_session_duration_distribution` | Time spent | UX optimization |
| `v_dropout_analysis` | Drop-off points | Retention improvement |
| `v_player_retention_7d` | 7-day retention | Cohort analysis |
| `v_event_distribution` | Event tracking | Behavior analysis |
| `v_cross_game_comparison` | Compare all games | Strategic decisions |
| `v_leaderboard` | Top players | Gamification |

### **Materialized Views** (Fast Performance)

| View | Refresh | Purpose |
|------|---------|---------|
| `mv_dashboard_stats` | Hourly | Main dashboard (super fast) |

---

## 🔧 Functions & Utilities

### **Refresh Analytics**

```sql
-- Manually refresh materialized views
SELECT refresh_analytics_views();
```

### **Calculate Daily Metrics**

```sql
-- Calculate metrics for yesterday
SELECT calculate_daily_metrics(CURRENT_DATE - 1, 'teammates');
SELECT calculate_daily_metrics(CURRENT_DATE - 1, 'journeyman');
SELECT calculate_daily_metrics(CURRENT_DATE - 1, 'trivia');
```

### **Update Question Metrics**

```sql
-- Update question difficulty metrics
SELECT update_question_metrics('teammates');
```

---

## 📈 Common Analytics Queries

### **Get Today's Activity**

```sql
SELECT
  game_type,
  COUNT(*) as sessions_today,
  COUNT(*) FILTER (WHERE completed = true) as completed_today,
  ROUND(AVG(total_time_spent), 2) as avg_time
FROM user_sessions
WHERE DATE(started_at) = CURRENT_DATE
GROUP BY game_type;
```

### **Top 10 Hardest Questions**

```sql
SELECT * FROM v_question_performance
WHERE game_type = 'teammates'
ORDER BY success_rate ASC
LIMIT 10;
```

### **Last 7 Days Trend**

```sql
SELECT * FROM v_daily_active_users
WHERE date >= CURRENT_DATE - 7
ORDER BY date DESC;
```

### **Peak Activity Hours**

```sql
SELECT * FROM v_hourly_patterns
WHERE game_type = 'teammates'
ORDER BY session_count DESC
LIMIT 5;
```

### **Drop-off Funnel**

```sql
SELECT
  dropped_off_at_question,
  COUNT(*) as dropouts,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM user_sessions
WHERE dropped_off_at_question IS NOT NULL
  AND game_type = 'journeyman'
GROUP BY dropped_off_at_question
ORDER BY dropouts DESC;
```

---

## 🎯 Key Metrics Explained

### **DAU (Daily Active Users)**
- Unique sessions per day
- Tracks daily engagement
- Essential for growth monitoring

### **WAU / MAU**
- Weekly / Monthly active users
- Measures retention and stickiness
- Standard SaaS metrics

### **Completion Rate**
- % of sessions that finish the game
- Indicates game difficulty/engagement
- Target: >60% for casual games

### **Average Session Duration**
- Time users spend playing
- Indicates engagement depth
- Compare across games for insights

### **Question Success Rate**
- % of correct answers per question
- Identifies too-easy or too-hard content
- Target: 50-70% for balanced difficulty

### **Dropout Points**
- Questions where users quit
- Critical for UX improvements
- Focus on high-dropout questions

### **7-Day Retention**
- % of users who return within 7 days
- Key metric for virality and engagement
- Target: >20% for mobile games

### **Share Rate**
- % of sessions that result in shares
- Measures viral potential
- Boost with incentives

---

## 🔍 Analytics Best Practices

### **1. Regular Monitoring**

```bash
# Check dashboard daily
curl https://your-api.railway.app/api/analytics/dashboard

# Review weekly trends
curl "https://your-api.railway.app/api/analytics/dau?days=7"
```

### **2. Question Optimization**

```bash
# Find hardest questions
curl "https://your-api.railway.app/api/analytics/question-performance?gameType=teammates" | \
  jq '.questions | sort_by(.success_rate) | .[0:5]'

# Review specific question
curl "https://your-api.railway.app/api/analytics/question/teammates/12"
```

### **3. Dropout Analysis**

```bash
# Identify drop-off points
curl "https://your-api.railway.app/api/analytics/dropout-analysis?gameType=journeyman"

# Fix or simplify high-dropout questions
```

### **4. Engagement Tracking**

```bash
# Monitor engagement levels
curl "https://your-api.railway.app/api/analytics/engagement?gameType=trivia"

# Increase engagement of low-engagement users
```

### **5. Data-Driven Decisions**

- **If completion rate < 40%**: Game may be too hard
- **If avg session < 3 min**: Not engaging enough
- **If DAU declining**: Need marketing or content updates
- **If share rate < 5%**: Add share incentives

---

## 📊 Sample Dashboard

### **Main Metrics Card**

```json
{
  "teammates": {
    "total_sessions": 15234,
    "dau": 523,
    "completion_rate": 67.3,
    "avg_session_duration": 342
  },
  "journeyman": {
    "total_sessions": 8912,
    "dau": 287,
    "completion_rate": 58.1,
    "avg_session_duration": 278
  },
  "trivia": {
    "total_sessions": 21456,
    "dau": 812,
    "completion_rate": 72.4,
    "avg_session_duration": 189
  }
}
```

### **Trend Chart Data (Last 30 Days)**

```bash
curl "https://your-api.railway.app/api/analytics/dau?days=30" | \
  jq '.data[] | {date, game_type, dau}'
```

### **Question Heatmap**

```bash
curl "https://your-api.railway.app/api/analytics/question-performance?gameType=teammates" | \
  jq '.questions[] | {question: .question_index, difficulty: .difficulty_level, success: .success_rate}'
```

---

## 🛠️ Automation

### **Daily Analytics Report (Cron Job)**

```bash
#!/bin/bash
# daily-analytics-report.sh

DATE=$(date +%Y-%m-%d)
API="https://your-api.railway.app"

# Calculate yesterday's metrics
curl -X POST "$API/api/analytics/calculate-daily/$(date -d 'yesterday' +%Y-%m-%d)"

# Get dashboard data
curl "$API/api/analytics/dashboard" > "reports/dashboard-$DATE.json"

# Get DAU trend
curl "$API/api/analytics/dau?days=7" > "reports/dau-$DATE.json"

# Send to Slack/Email (optional)
# python send_report.py "reports/dashboard-$DATE.json"
```

### **Refresh Materialized Views (Hourly)**

```bash
# Add to cron: 0 * * * *
curl -X POST "https://your-api.railway.app/api/analytics/refresh"
```

---

## 🎨 Frontend Integration

### **React Dashboard Example**

```javascript
import { useEffect, useState } from 'react';

function AnalyticsDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('https://your-api.railway.app/api/analytics/dashboard')
      .then(res => res.json())
      .then(data => setData(data));
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h1>NFL Games Analytics</h1>
      {data.overview.map(game => (
        <div key={game.game_type}>
          <h2>{game.game_type.toUpperCase()}</h2>
          <p>Total Sessions: {game.total_sessions}</p>
          <p>Today: {game.today_sessions}</p>
          <p>Completion Rate: {game.completion_rate}%</p>
        </div>
      ))}
    </div>
  );
}
```

### **Chart.js Integration**

```javascript
// Fetch and display DAU chart
fetch('https://your-api.railway.app/api/analytics/dau?days=30&gameType=teammates')
  .then(res => res.json())
  .then(data => {
    const chartData = {
      labels: data.data.map(d => d.date),
      datasets: [{
        label: 'Daily Active Users',
        data: data.data.map(d => d.dau),
        borderColor: 'rgb(75, 192, 192)'
      }]
    };

    new Chart(ctx, { type: 'line', data: chartData });
  });
```

---

## 🔐 Security Considerations

### **Admin Endpoints**

The following endpoints should be restricted to admins:

- `POST /api/analytics/refresh`
- `POST /api/analytics/calculate-daily/:date`

**Add authentication middleware:**

```javascript
const requireAdmin = (req, res, next) => {
  const token = req.headers['x-admin-token'];
  if (token !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
};

router.post('/refresh', requireAdmin, async (req, res) => {
  // ... refresh logic
});
```

---

## 📚 Additional Resources

- **Database Schema**: `nfl-teamates-game/backend/schema-analytics.sql`
- **API Routes**: `nfl-teamates-game/backend/routes/analytics.js`
- **Main Backend Docs**: `nfl-teamates-game/backend/README-CONSOLIDATED.md`

---

## 🆘 Troubleshooting

### **Slow Queries**

```sql
-- Check if indexes exist
SELECT * FROM pg_indexes WHERE tablename = 'user_sessions';

-- Refresh materialized view
SELECT refresh_analytics_views();
```

### **Missing Data**

```sql
-- Verify data exists
SELECT COUNT(*), game_type FROM user_sessions GROUP BY game_type;

-- Recalculate metrics
SELECT calculate_daily_metrics(CURRENT_DATE, 'teammates');
```

### **API Errors**

- Check database connection: `GET /api/db-test`
- Verify schema applied: `\dt` in psql
- Check logs for SQL errors

---

**Analytics System Version:** 1.0.0
**Last Updated:** 2025-11-19
**Games:** NFL Teammates, Journeyman, NFL Trivia
