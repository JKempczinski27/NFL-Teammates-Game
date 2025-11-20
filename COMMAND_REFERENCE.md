# NFL Games Collection - Comprehensive Command Reference

## Table of Contents
- [Backend API Endpoints](#backend-api-endpoints)
  - [Health & Status](#health--status)
  - [Player Management](#player-management)
  - [Event Tracking](#event-tracking)
  - [Analytics & Reporting](#analytics--reporting)
  - [Game Data](#game-data)
  - [Data Protection & GDPR](#data-protection--gdpr)
  - [S3 Management](#s3-management)
- [Development Commands](#development-commands)
- [Database Commands](#database-commands)
- [Deployment Commands](#deployment-commands)

---

## Backend API Endpoints

Base URL: `https://your-api.railway.app` or `http://localhost:8080` (local)

### Health & Status

#### `GET /`
Get API information and status
```bash
curl https://your-api.railway.app/
```
**Response:**
```json
{
  "status": "ok",
  "message": "Consolidated NFL Games API is running",
  "games": ["teammates", "journeyman", "trivia"],
  "timestamp": "2025-11-20T10:00:00.000Z",
  "redis": "connected",
  "version": "2.0.0-consolidated"
}
```

#### `GET /health`
Health check endpoint
```bash
curl https://your-api.railway.app/health
```
**Response:**
```json
{
  "status": "healthy",
  "message": "All systems operational",
  "games": ["teammates", "journeyman", "trivia"],
  "timestamp": "2025-11-20T10:00:00.000Z",
  "database": "connected",
  "redis": "connected"
}
```

#### `GET /api/db-test`
Test database connection and pool status
```bash
curl https://your-api.railway.app/api/db-test
```
**Response:**
```json
{
  "connected": true,
  "time": "2025-11-20T10:00:00.000Z",
  "poolSize": 5,
  "idleConnections": 3,
  "waitingClients": 0
}
```

#### `GET /dashboard`
Access the analytics dashboard (web interface)
```bash
# Open in browser:
https://your-api.railway.app/dashboard
```

---

### Player Management

#### `POST /api/player`
Save player information (legacy endpoint)
```bash
curl -X POST https://your-api.railway.app/api/player \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com"
  }'
```
**Rate Limit:** 20 requests per 15 minutes

#### `POST /api/players`
Add a new player
```bash
curl -X POST https://your-api.railway.app/api/players \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "team": "Patriots"
  }'
```
**Response:**
```json
{
  "success": true,
  "player": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "team": "Patriots",
    "created_at": "2025-11-20T10:00:00.000Z"
  }
}
```

#### `GET /api/players`
Get all players (limited to 100)
```bash
curl https://your-api.railway.app/api/players
```

#### `GET /api/players/:email`
Get player by email
```bash
curl https://your-api.railway.app/api/players/john@example.com
```

#### `PUT /api/players/:email`
Update player information
```bash
curl -X PUT https://your-api.railway.app/api/players/john@example.com \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "team": "Eagles"
  }'
```

---

### Event Tracking

#### `POST /api/track`
Track game events
```bash
curl -X POST https://your-api.railway.app/api/track \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "session_start",
    "sessionId": "session_123",
    "gameType": "teammates",
    "eventData": {},
    "timestamp": "2025-11-20T10:00:00.000Z"
  }'
```

**Supported Event Types:**
- `session_start` - User starts a game session
- `session_end` - User ends a game session
- `question_viewed` - User views a question
- `answer_submitted` - User submits an answer
- `shared` - User shares results on social media
- `activity` - User activity ping
- `drop_off` - User drops off at a specific question

**Example - Session Start:**
```json
{
  "eventType": "session_start",
  "sessionId": "session_123",
  "gameType": "teammates",
  "eventData": {},
  "timestamp": "2025-11-20T10:00:00.000Z"
}
```

**Example - Answer Submitted:**
```json
{
  "eventType": "answer_submitted",
  "sessionId": "session_123",
  "gameType": "trivia",
  "eventData": {
    "questionIndex": 1,
    "userAnswer": "Patriots",
    "isCorrect": true,
    "attemptsLeft": 2,
    "timeToAnswer": 5.2
  },
  "timestamp": "2025-11-20T10:00:30.000Z"
}
```

**Example - Share Event:**
```json
{
  "eventType": "shared",
  "sessionId": "session_123",
  "gameType": "journeyman",
  "eventData": {
    "platform": "twitter",
    "questionIndex": 5
  },
  "timestamp": "2025-11-20T10:05:00.000Z"
}
```

#### `GET /api/track`
Get tracking endpoint status
```bash
curl https://your-api.railway.app/api/track
```

#### `GET /api/track/analytics/:sessionId`
Get analytics for a specific session (debugging)
```bash
curl https://your-api.railway.app/api/track/analytics/session_123
```

---

### Analytics & Reporting

#### Dashboard & Overview

##### `GET /api/analytics/dashboard`
Main dashboard with key metrics across all games
```bash
curl https://your-api.railway.app/api/analytics/dashboard
```

##### `GET /api/analytics/overview/:gameType`
Detailed overview for a specific game
```bash
curl https://your-api.railway.app/api/analytics/overview/teammates
```
**Game Types:** `teammates`, `journeyman`, `trivia`

#### User Engagement

##### `GET /api/analytics/dau`
Daily Active Users
```bash
# Last 30 days (default)
curl https://your-api.railway.app/api/analytics/dau

# Last 7 days
curl https://your-api.railway.app/api/analytics/dau?days=7

# Specific game
curl https://your-api.railway.app/api/analytics/dau?gameType=teammates&days=30
```

##### `GET /api/analytics/wau`
Weekly Active Users
```bash
curl https://your-api.railway.app/api/analytics/wau?gameType=journeyman
```

##### `GET /api/analytics/mau`
Monthly Active Users
```bash
curl https://your-api.railway.app/api/analytics/mau?gameType=trivia
```

##### `GET /api/analytics/engagement`
User engagement levels breakdown
```bash
curl https://your-api.railway.app/api/analytics/engagement?gameType=teammates
```

#### Question Performance

##### `GET /api/analytics/question-performance`
Question-by-question performance analysis
```bash
# All games
curl https://your-api.railway.app/api/analytics/question-performance

# Specific game
curl https://your-api.railway.app/api/analytics/question-performance?gameType=trivia
```

##### `GET /api/analytics/question/:gameType/:questionIndex`
Detailed analytics for a specific question
```bash
curl https://your-api.railway.app/api/analytics/question/teammates/1
```

#### Social Sharing

##### `GET /api/analytics/share-analytics`
Share platform effectiveness and trends
```bash
curl https://your-api.railway.app/api/analytics/share-analytics?gameType=journeyman
```

#### Time & Patterns

##### `GET /api/analytics/hourly-patterns`
Activity patterns by hour of day
```bash
curl https://your-api.railway.app/api/analytics/hourly-patterns?gameType=teammates
```

##### `GET /api/analytics/weekly-patterns`
Activity patterns by day of week
```bash
curl https://your-api.railway.app/api/analytics/weekly-patterns?gameType=trivia
```

##### `GET /api/analytics/session-duration`
Session duration distribution
```bash
curl https://your-api.railway.app/api/analytics/session-duration?gameType=journeyman
```

#### Dropout & Retention

##### `GET /api/analytics/dropout-analysis`
Where and why users drop off
```bash
curl https://your-api.railway.app/api/analytics/dropout-analysis?gameType=teammates
```

##### `GET /api/analytics/retention`
7-day retention rates
```bash
curl https://your-api.railway.app/api/analytics/retention?gameType=trivia&days=30
```

#### Leaderboards

##### `GET /api/analytics/leaderboard/:gameType`
Game-specific leaderboard
```bash
# Top 100 (default)
curl https://your-api.railway.app/api/analytics/leaderboard/journeyman

# Top 20
curl https://your-api.railway.app/api/analytics/leaderboard/teammates?limit=20
```

#### Event Tracking

##### `GET /api/analytics/events`
Event type distribution and trends
```bash
curl https://your-api.railway.app/api/analytics/events?gameType=trivia&days=30
```

#### Session Details

##### `GET /api/analytics/session/:sessionId`
Detailed analytics for a specific session
```bash
curl https://your-api.railway.app/api/analytics/session/session_123
```

#### Admin & Maintenance

##### `POST /api/analytics/refresh`
Manually refresh materialized views (admin only)
```bash
curl -X POST https://your-api.railway.app/api/analytics/refresh
```

##### `POST /api/analytics/calculate-daily/:date`
Calculate daily metrics for a specific date (admin only)
```bash
# Single game
curl -X POST https://your-api.railway.app/api/analytics/calculate-daily/2025-11-20?gameType=teammates

# All games
curl -X POST https://your-api.railway.app/api/analytics/calculate-daily/2025-11-20
```

#### Data Export

##### `GET /api/analytics/export/:gameType`
Export analytics data as CSV
```bash
# Export sessions
curl https://your-api.railway.app/api/analytics/export/teammates?type=sessions > sessions.csv

# Export questions
curl https://your-api.railway.app/api/analytics/export/journeyman?type=questions > questions.csv

# Export shares
curl https://your-api.railway.app/api/analytics/export/trivia?type=shares > shares.csv
```
**Export Types:** `sessions`, `questions`, `shares`

---

### Game Data

#### `POST /api/game-data`
Submit game completion data
```bash
curl -X POST https://your-api.railway.app/api/game-data \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "gameType": "journeyman",
    "correctCount": 8,
    "durationInSeconds": 120,
    "score": 850,
    "sessionId": "session_123"
  }'
```
**Game Types:** `teammates`, `journeyman`, `trivia`

#### `GET /api/game-data/leaderboard/:gameType`
Get leaderboard for a specific game
```bash
# Top 10 (default)
curl https://your-api.railway.app/api/game-data/leaderboard/journeyman

# Top 50
curl https://your-api.railway.app/api/game-data/leaderboard/teammates?limit=50
```

#### `GET /api/game-data/stats/:gameType`
Get statistics for a specific game
```bash
curl https://your-api.railway.app/api/game-data/stats/trivia
```
**Response:**
```json
{
  "success": true,
  "gameType": "trivia",
  "stats": {
    "total_submissions": 1250,
    "unique_players": 487,
    "avg_score": 685.5,
    "max_score": 1000,
    "avg_duration": 95.3,
    "avg_correct_count": 7.2
  }
}
```

---

### Data Protection & GDPR

#### `GET /api/data-protection/health`
Health check for data protection service
```bash
curl https://your-api.railway.app/api/data-protection/health
```

#### `GET /api/data-protection/export/:userId`
GDPR Export - Get all user data
```bash
curl https://your-api.railway.app/api/data-protection/export/john@example.com
```

#### `DELETE /api/data-protection/delete/:userId`
GDPR Delete - Delete all user data
```bash
curl -X DELETE https://your-api.railway.app/api/data-protection/delete/john@example.com
```

#### `GET /api/data-protection/consent/:userId`
Get user consents
```bash
curl https://your-api.railway.app/api/data-protection/consent/john@example.com
```

#### `POST /api/data-protection/consent/:userId`
Record user consent
```bash
curl -X POST https://your-api.railway.app/api/data-protection/consent/john@example.com \
  -H "Content-Type: application/json" \
  -d '{
    "consentType": "analytics",
    "granted": true
  }'
```
**Consent Types:** `analytics`, `marketing`, `essential`

#### `DELETE /api/data-protection/consent/:userId/:consentType`
Revoke user consent
```bash
curl -X DELETE https://your-api.railway.app/api/data-protection/consent/john@example.com/marketing
```

---

### S3 Management

**Note:** All S3 endpoints require authentication via the `authenticate` middleware.

#### `GET /api/s3/test`
Test S3 connection and configuration
```bash
curl https://your-api.railway.app/api/s3/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### `GET /api/s3/files`
List all objects in the bucket
```bash
# List all files
curl https://your-api.railway.app/api/s3/files \
  -H "Authorization: Bearer YOUR_TOKEN"

# List files with prefix
curl "https://your-api.railway.app/api/s3/files?prefix=uploads/&maxKeys=100" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### `POST /api/s3/upload`
Upload a single file
```bash
curl -X POST https://your-api.railway.app/api/s3/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/file.jpg" \
  -F "folder=uploads"
```

#### `POST /api/s3/upload-multiple`
Upload multiple files (up to 10)
```bash
curl -X POST https://your-api.railway.app/api/s3/upload-multiple \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@/path/to/file1.jpg" \
  -F "files=@/path/to/file2.jpg" \
  -F "folder=uploads"
```

#### `DELETE /api/s3/files/:key`
Delete a single file
```bash
curl -X DELETE https://your-api.railway.app/api/s3/files/uploads/file.jpg \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### `POST /api/s3/delete-multiple`
Delete multiple files
```bash
curl -X POST https://your-api.railway.app/api/s3/delete-multiple \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "keys": ["uploads/file1.jpg", "uploads/file2.jpg"]
  }'
```

#### `GET /api/s3/stats`
Get bucket statistics
```bash
curl https://your-api.railway.app/api/s3/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### `GET /api/s3/files/:key/metadata`
Get file metadata
```bash
curl https://your-api.railway.app/api/s3/files/uploads/file.jpg/metadata \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Development Commands

### Backend Development

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Start development server
npm start
# Server runs on http://localhost:8080

# Run tests (if configured)
npm test

# Run with nodemon for auto-restart
npm run dev
```

### Frontend Development

#### NFL Teammates Game
```bash
cd nfl-teammates-game
npm install
npm start
# Runs on http://localhost:3000
```

#### Journeyman
```bash
cd journeyman
npm install
npm start
# Runs on http://localhost:3000
```

#### NFL Trivia Game
```bash
cd nfl-trivia-game
npm install
npm start
# Runs on http://localhost:3000
```

### Build Commands

```bash
# Build for production
npm run build

# Build optimized bundle
npm run build --production
```

---

## Database Commands

### Local PostgreSQL Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE nfl_games;"

# Run main schema
psql -U postgres -d nfl_games -f backend/schema-consolidated.sql

# Run analytics schema
psql -U postgres -d nfl_games -f backend/schema-analytics.sql

# Connect to database
psql -U postgres -d nfl_games

# Drop and recreate (destructive!)
psql -U postgres -c "DROP DATABASE IF EXISTS nfl_games;"
psql -U postgres -c "CREATE DATABASE nfl_games;"
```

### Database Verification

```bash
# Run database verification script
node verify-db.js

# Initialize database
node init-db.js
```

### Production Database

```bash
# Run migrations on Railway
railway run psql $DATABASE_URL -f backend/schema-consolidated.sql
railway run psql $DATABASE_URL -f backend/schema-analytics.sql

# Connect to production database
railway run psql $DATABASE_URL

# Run migrations on Render (via Shell)
psql $DATABASE_URL -f backend/schema-consolidated.sql
psql $DATABASE_URL -f backend/schema-analytics.sql
```

### Database Queries

```sql
-- Check all tables
\dt

-- View sessions
SELECT * FROM user_sessions ORDER BY started_at DESC LIMIT 10;

-- View analytics
SELECT * FROM v_daily_active_users ORDER BY date DESC LIMIT 30;

-- Refresh materialized views
SELECT refresh_analytics_views();

-- Calculate daily metrics
SELECT calculate_daily_metrics('2025-11-20', 'teammates');
```

---

## Deployment Commands

### Railway Deployment

```bash
# Initialize Railway project
railway init

# Add PostgreSQL database
railway add --database postgresql

# Deploy backend
railway up

# Run database migrations
railway run psql $DATABASE_URL -f backend/schema-consolidated.sql
railway run psql $DATABASE_URL -f backend/schema-analytics.sql

# View logs
railway logs

# Open deployed app
railway open

# Set environment variables
railway variables set ADMIN_API_KEY=your_key_here
railway variables set AWS_ACCESS_KEY_ID=your_key
railway variables set AWS_SECRET_ACCESS_KEY=your_secret
railway variables set S3_BUCKET_NAME=your_bucket
```

### Render Deployment

```bash
# Deploy via Git (push to connected repository)
git push origin main

# Or use Render CLI
render deploy

# Set environment variables (via Render Dashboard)
# - DATABASE_URL (auto-set)
# - PORT (auto-set)
# - ADMIN_API_KEY
# - AWS_ACCESS_KEY_ID
# - AWS_SECRET_ACCESS_KEY
# - S3_BUCKET_NAME
# - REDIS_URL (optional)
# - SENTRY_DSN (optional)
```

### Docker Commands (if applicable)

```bash
# Build Docker image
docker build -t nfl-games-api .

# Run container
docker run -p 8080:8080 -e DATABASE_URL=your_db_url nfl-games-api

# Docker Compose
docker-compose up -d

# View logs
docker logs nfl-games-api

# Stop containers
docker-compose down
```

---

## Environment Variables Reference

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 8080)

### Optional
- `ADMIN_API_KEY` - Admin authentication key
- `AWS_REGION` - AWS region (default: us-east-1)
- `AWS_ACCESS_KEY_ID` - AWS access key for S3
- `AWS_SECRET_ACCESS_KEY` - AWS secret key for S3
- `S3_BUCKET_NAME` - S3 bucket name
- `REDIS_URL` - Redis connection string for caching
- `SENTRY_DSN` - Sentry error tracking DSN
- `NODE_ENV` - Environment (development/production)

---

## Rate Limiting

### API Rate Limits
- **General API endpoints:** 100 requests per 15 minutes per IP
- **Write operations:** 20 requests per 15 minutes per IP

### Error Responses
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

---

## Response Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## Additional Resources

- **Quick Deploy Guide:** `QUICK_DEPLOY.md`
- **Analytics Guide:** `ANALYTICS_GUIDE.md`
- **Dashboard Guide:** `DASHBOARD_GUIDE.md`
- **Backend Documentation:** `backend/README-CONSOLIDATED.md`
- **Testing Strategy:** `TESTING_STRATEGY.md`
- **Database Setup:** `DATABASE_SETUP_GUIDE.md`

---

**Last Updated:** November 2025
**API Version:** 2.0.0-consolidated
**Supported Games:** NFL Teammates, Journeyman, NFL Trivia
