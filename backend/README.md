# NFL Teammates Game - Backend

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the backend directory:

```env
DATABASE_URL=postgresql://username:password@host:port/database
PORT=8080
```

### 3. Initialize Database

Run this command in your production/deployment environment where the database is accessible:

```bash
node initDb.js
```

This will create all necessary tables for analytics tracking:
- `events` - All tracking events
- `user_sessions` - User engagement metrics
- `question_analytics` - Question difficulty data
- `share_analytics` - Share platform statistics
- `players` - Player information

### 4. Start the Server

```bash
npm start
```

The server will run on port 8080 (or your configured PORT).

## API Endpoints

### Tracking
- `POST /api/track` - Track events

### Analytics
- `GET /api/analytics/dashboard` - Overall statistics
- `GET /api/analytics/question-difficulty` - Question analysis
- `GET /api/analytics/engagement` - User engagement metrics
- `GET /api/analytics/share-analytics` - Share statistics
- `GET /api/analytics/session/:sessionId` - Session details

### Utilities
- `GET /api/db-test` - Test database connection

## Analytics Dashboard

Access the analytics dashboard at:
```
http://localhost:8080/analytics-dashboard.html
```

For complete documentation, see [ANALYTICS.md](../ANALYTICS.md)
