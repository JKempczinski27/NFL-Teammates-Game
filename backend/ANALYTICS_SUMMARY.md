# Player Analytics System - Quick Reference

## 📊 What's Included

This comprehensive analytics system provides **30+ endpoints** and **20+ database views** for deep player insights.

## 🎯 Key Features

### 1. **Dashboard & Overview** (3 endpoints)
- Main dashboard with KPIs
- Platform statistics
- Quick stats summary

### 2. **Player Performance** (3 endpoints)
- Performance metrics (accuracy, completion, sessions)
- Engagement scoring (0-100 scale with tiers)
- Individual player deep-dive

### 3. **Game-Specific Analytics** (3 endpoints)
- **Trivia**: Scores, teams, skill levels
- **Journeyman**: Correct counts, speed, efficiency
- **Teammates**: Scores, completion rates, accuracy

### 4. **Cohort Analysis** (2 endpoints)
- Weekly cohorts with return rates
- Monthly cohorts with 1-3 month retention

### 5. **RFM Segmentation** (2 endpoints)
- 9 player segments (Champions, Loyal, At Risk, Lost, etc.)
- Segment distribution and characteristics

### 6. **Churn Prediction** (1 endpoint)
- Risk scoring (0-100)
- 4 risk levels (Low, Medium, High, Critical)
- Recommended actions for each player

### 7. **Trends & Patterns** (2 endpoints)
- Daily activity trends
- Weekly activity trends

### 8. **Cross-Game Analytics** (1 endpoint)
- Multi-game player analysis
- Cross-play rates
- Game exclusivity metrics

### 9. **Leaderboards** (3 endpoints)
- Overall leaderboard (all games)
- Trivia leaderboard
- Journeyman leaderboard

### 10. **Lifetime Value** (1 endpoint)
- LTV scoring
- 4 value tiers (VIP, High Value, Medium Value, Standard)
- 6-month projections

### 11. **Export & Admin** (2 endpoints)
- CSV exports (performance, engagement, churn, RFM)
- Materialized view refresh

---

## 🚀 Quick Start

### Initialize Analytics
```bash
# Method 1: SQL file
psql $DATABASE_URL -f backend/schema-player-analytics.sql

# Method 2: Node.js script
node backend/scripts/init-analytics.js
```

### Test Endpoints
```bash
# Dashboard
curl http://localhost:8080/api/player-analytics/dashboard

# Quick stats
curl http://localhost:8080/api/player-analytics/stats

# Top performers
curl http://localhost:8080/api/player-analytics/performance?limit=10

# At-risk players
curl http://localhost:8080/api/player-analytics/churn-risk?riskLevel=Critical
```

---

## 📈 Most Useful Endpoints

### For Daily Monitoring
```
GET /api/player-analytics/stats
GET /api/player-analytics/dashboard
GET /api/player-analytics/trends/daily?days=7
```

### For Player Engagement
```
GET /api/player-analytics/engagement
GET /api/player-analytics/churn-risk
GET /api/player-analytics/rfm?segment=At+Risk
```

### For Performance Analysis
```
GET /api/player-analytics/performance?sortBy=accuracy_rate
GET /api/player-analytics/trivia
GET /api/player-analytics/journeyman
```

### For Retention Analysis
```
GET /api/player-analytics/cohorts/monthly
GET /api/player-analytics/cohorts/weekly
```

### For Business Insights
```
GET /api/player-analytics/lifetime-value?tier=VIP
GET /api/player-analytics/cross-play
GET /api/player-analytics/segments
```

---

## 🔍 Player Segments (RFM)

| Segment | Description | Action |
|---------|-------------|--------|
| **Champions** | High R/F/M - Your best players | Reward and retain |
| **Loyal Players** | High F/M, moderate R | Re-engage |
| **Promising New** | Very recent, low frequency | Nurture and onboard |
| **Potential Loyalists** | Moderate across metrics | Encourage more play |
| **At Risk** | Low recency, high historical value | Win-back campaign |
| **Hibernating** | Low recency, moderate history | Re-activation email |
| **Lost** | Very low recency and frequency | Last-chance offer |
| **Need Attention** | Various concerning patterns | Investigate individually |

---

## 🎯 Engagement Tiers

| Tier | Criteria | Percentage (typical) |
|------|----------|---------------------|
| **Power User** | 20+ sessions, 80%+ completion | 5-10% |
| **Engaged User** | 10+ sessions, 60%+ completion | 15-20% |
| **Regular User** | 5+ sessions or 25+ questions | 25-30% |
| **Casual User** | 2+ sessions | 20-25% |
| **New User** | 1 session | 30-35% |

---

## ⚠️ Churn Risk Levels

| Level | Risk Score | Days Inactive | Action |
|-------|-----------|---------------|--------|
| **Critical** | 70-100 | 30+ | Re-engagement campaign |
| **High** | 50-69 | 14-29 | Win-back email |
| **Medium** | 30-49 | 7-13 | Engagement nudge |
| **Low** | 0-29 | 0-6 | Monitor |

---

## 💎 Lifetime Value Tiers

| Tier | Criteria | Focus |
|------|----------|-------|
| **VIP** | 20+ sessions, 70%+ completion | White-glove service |
| **High Value** | 10+ sessions, 50%+ completion | Premium features |
| **Medium Value** | 5+ sessions | Standard engagement |
| **Standard** | < 5 sessions | Growth opportunities |

---

## 📊 Key Metrics Reference

### Performance Metrics
- **Accuracy Rate**: % of correct answers
- **Completion Rate**: % of games completed
- **Avg Session Duration**: Time per session
- **Best Streak**: Longest correct answer streak
- **Shares per Session**: Social engagement

### Engagement Metrics
- **Engagement Score**: 0-100 composite score
- **Total Sessions**: Lifetime session count
- **Questions Answered**: Total questions attempted
- **Days Since Last Activity**: Recency metric

### Business Metrics
- **LTV Score**: Lifetime value composite
- **Churn Risk Score**: 0-100 churn probability
- **RFM Total**: Combined R+F+M score
- **Projected Sessions**: 6-month forecast

---

## 🔄 Maintenance Tasks

### Hourly (Automated)
```sql
SELECT refresh_player_analytics_views();
```

### Daily
- Monitor churn risk levels
- Check active player counts
- Review top performers

### Weekly
- Analyze cohort trends
- Identify at-risk high-value players
- Review cross-game patterns

### Monthly
- Generate executive reports
- Update player value tiers
- Optimize slow queries

---

## 🎨 Visualization Ideas

### Dashboards to Build
1. **Executive Dashboard**: DAU/WAU/MAU, top segments, churn rate
2. **Performance Dashboard**: Top players, accuracy trends, completion rates
3. **Engagement Dashboard**: Engagement tiers, session patterns, social shares
4. **Retention Dashboard**: Cohort retention curves, churn funnel
5. **Game Comparison**: Cross-game metrics, multi-game players
6. **Team Dashboard**: Trivia team performance, loyalty metrics

### Chart Types
- **Line Charts**: Daily/weekly trends, cohort retention
- **Bar Charts**: Segment distribution, game comparison
- **Pie Charts**: Engagement tiers, churn risk levels
- **Heatmaps**: Hourly patterns, day-of-week activity
- **Scatter Plots**: RFM positioning, LTV vs engagement
- **Funnel Charts**: Player progression, dropout analysis

---

## 🛠️ Advanced Use Cases

### Personalization
```sql
-- Get personalized recommendations
SELECT * FROM get_player_insights('player@example.com');
```

### Targeted Campaigns
```sql
-- High-value at-risk players
SELECT p.*, c.churn_risk_score
FROM v_player_lifetime_value p
JOIN v_churn_risk_analysis c ON p.email = c.email
WHERE p.value_tier IN ('VIP', 'High Value')
  AND c.churn_risk_level IN ('High', 'Critical')
LIMIT 100;
```

### A/B Testing Cohorts
```sql
-- Compare recent cohorts
SELECT
  cohort_week,
  return_rate,
  engagement_rate
FROM v_weekly_cohorts
WHERE cohort_week >= CURRENT_DATE - INTERVAL '8 weeks'
ORDER BY cohort_week DESC;
```

### Game Balance Analysis
```sql
-- Find games that retain players better
SELECT
  game_type,
  avg_completion_rate,
  avg_sessions,
  cross_play_rate
FROM v_game_cross_play_analysis
ORDER BY avg_completion_rate DESC;
```

---

## 📱 Integration Examples

### React Dashboard
```javascript
const DashboardData = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/player-analytics/dashboard')
      .then(res => res.json())
      .then(setData);
  }, []);

  return (
    <div>
      <MetricCard value={data?.dashboard?.dau} label="Daily Active Users" />
      <MetricCard value={data?.dashboard?.mau} label="Monthly Active Users" />
      {/* ... */}
    </div>
  );
};
```

### Email Campaigns
```javascript
// Get at-risk VIP players for win-back campaign
const response = await fetch(
  '/api/player-analytics/churn-risk?riskLevel=High'
);
const atRiskPlayers = await response.json();

// Send personalized emails
atRiskPlayers.at_risk_players.forEach(player => {
  sendEmail(player.email, {
    subject: "We miss you!",
    recommendation: player.recommended_action
  });
});
```

---

## 🎓 Learning Resources

### SQL Views
All views are defined in `backend/schema-player-analytics.sql`

### API Routes
All endpoints are in `backend/routes/player-analytics.js`

### Full Documentation
See `backend/ANALYTICS_README.md` for complete details

---

## 📞 Support

For issues or questions:
1. Check the full documentation: `ANALYTICS_README.md`
2. Review the schema: `schema-player-analytics.sql`
3. Test with: `scripts/init-analytics.js`

---

**Built for NFL Games Analytics System v1.0**
