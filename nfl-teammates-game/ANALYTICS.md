# Analytics & Tracking System

## Overview

The NFL Teammates Game now includes a comprehensive analytics and tracking system that persists all events to a PostgreSQL database. This system tracks user behavior, question difficulty, engagement metrics, and sharing patterns.

## Database Schema

### Tables

1. **events** - Main events table storing all tracking events
   - `id`: Serial primary key
   - `session_id`: Unique session identifier
   - `event_type`: Type of event (e.g., 'session_start', 'answer_submitted')
   - `event_data`: JSONB field with event-specific data
   - `timestamp`: When the event occurred
   - `created_at`: When the record was created

2. **user_sessions** - Tracks user engagement metrics
   - `id`: Serial primary key
   - `session_id`: Unique session identifier
   - `started_at`: Session start time
   - `last_activity_at`: Last user activity timestamp
   - `ended_at`: Session end time
   - `total_time_spent`: Total time in seconds
   - `questions_viewed`: Number of questions viewed
   - `questions_answered`: Number of questions answered
   - `completed`: Whether the game was completed
   - `dropped_off_at_question`: Question index where user dropped off

3. **question_analytics** - Tracks question difficulty vs success rate
   - `id`: Serial primary key
   - `question_index`: Index of the question
   - `session_id`: Session that answered the question
   - `is_correct`: Whether the answer was correct
   - `attempts_used`: Number of attempts used
   - `time_to_answer`: Time taken to answer in seconds
   - `answer_given`: The user's answer
   - `timestamp`: When the answer was submitted

4. **share_analytics** - Tracks popular share methods
   - `id`: Serial primary key
   - `session_id`: Session that shared
   - `platform`: Share platform (facebook, twitter, reddit, whatsapp)
   - `question_index`: Question being viewed when shared
   - `shared_at`: When the share occurred

5. **players** - Legacy players table
   - `id`: Serial primary key
   - `name`: Player name
   - `email`: Player email
   - `created_at`: When the record was created

## Tracked Events

### Frontend Events

1. **session_start** - When a user starts a new session
   - Tracked on component mount
   - No additional data

2. **session_end** - When a user leaves the application
   - Tracked on page unload
   - Data: `timeSpent`, `completed`, `questionsCompleted`

3. **question_viewed** - When a user views a new question
   - Tracked when question index changes
   - Data: `questionIndex`

4. **answer_submitted** - When a user submits an answer
   - Tracked on submit button click
   - Data: `questionIndex`, `userAnswer`, `isCorrect`, `attemptsLeft`, `timeToAnswer`

5. **shared** - When a user clicks a social share button
   - Tracked on share button click
   - Data: `platform`, `questionIndex`

6. **activity** - Periodic heartbeat to track user engagement
   - Tracked every 30 seconds
   - Data: `timeElapsed`

7. **drop_off** - When a user runs out of attempts
   - Tracked when attempts reach 0
   - Data: `questionIndex`, `reason`

## Setup Instructions

### 1. Initialize the Database

Run the database initialization script to create all necessary tables:

```bash
cd nfl-teamates-game/backend
node initDb.js
```

This will:
- Read `schema.sql`
- Execute all CREATE TABLE statements
- Create indexes for optimal query performance
- Display all created tables

### 2. Configure Environment Variables

Ensure your `.env` file contains the PostgreSQL connection string:

```
DATABASE_URL=postgresql://username:password@host:port/database
PORT=8080
```

### 3. Start the Backend Server

```bash
cd nfl-teamates-game/backend
npm start
```

The backend will run on port 8080 (or your configured PORT).

## API Endpoints

### Tracking Endpoint

**POST** `/api/track`

Persists tracking events to the database.

Request body:
```json
{
  "eventType": "answer_submitted",
  "eventData": {
    "questionIndex": 0,
    "userAnswer": "Tom Brady",
    "isCorrect": true,
    "attemptsLeft": 3,
    "timeToAnswer": 15
  },
  "sessionId": "uuid-here",
  "timestamp": "2025-01-15T12:00:00Z"
}
```

### Analytics Endpoints

#### 1. Question Difficulty Analysis

**GET** `/api/analytics/question-difficulty`

Returns success rate, average attempts, and time for each question.

Response:
```json
{
  "success": true,
  "data": [
    {
      "question_index": 0,
      "total_attempts": 150,
      "correct_answers": 120,
      "success_rate_percentage": 80.00,
      "avg_attempts_needed": 1.5,
      "avg_time_seconds": 18.5
    }
  ],
  "summary": {
    "total_questions": 2,
    "easiest_question": { ... },
    "hardest_question": { ... }
  }
}
```

#### 2. User Engagement Metrics

**GET** `/api/analytics/engagement`

Returns engagement metrics including time spent, completion rates, and drop-off points.

Response:
```json
{
  "success": true,
  "overview": {
    "total_sessions": 500,
    "completed_sessions": 350,
    "completion_rate_percentage": 70.00,
    "avg_time_spent_seconds": 180.5,
    "avg_questions_viewed": 2.0,
    "avg_questions_answered": 1.8,
    "most_common_drop_off_question": 1
  },
  "drop_off_points": [
    {
      "question_index": 1,
      "drop_off_count": 75
    }
  ],
  "time_distribution": [
    {
      "time_range": "0-1 min",
      "session_count": 100
    }
  ]
}
```

#### 3. Share Analytics

**GET** `/api/analytics/share-analytics`

Returns popular share methods and sharing patterns.

Response:
```json
{
  "success": true,
  "platform_totals": [
    {
      "platform": "twitter",
      "share_count": 150,
      "percentage": 45.00
    }
  ],
  "shares_by_question": [...],
  "recent_timeline": [...],
  "summary": {
    "total_shares": 333,
    "most_popular_platform": "twitter",
    "platforms_used": 4
  }
}
```

#### 4. Session Details

**GET** `/api/analytics/session/:sessionId`

Returns all events and analytics for a specific session.

#### 5. Dashboard Overview

**GET** `/api/analytics/dashboard`

Returns overall statistics and recent activity.

Response:
```json
{
  "success": true,
  "overview": {
    "total_events": 5000,
    "unique_sessions": 500,
    "total_answers": 1000,
    "total_shares": 333,
    "completed_sessions": 350,
    "avg_session_duration": 180.5
  },
  "recent_activity": [
    {
      "event_type": "answer_submitted",
      "count": 250,
      "last_occurrence": "2025-01-15T12:00:00Z"
    }
  ]
}
```

## Usage Examples

### View Question Difficulty

```bash
curl http://localhost:8080/api/analytics/question-difficulty
```

### Check Engagement Metrics

```bash
curl http://localhost:8080/api/analytics/engagement
```

### View Share Analytics

```bash
curl http://localhost:8080/api/analytics/share-analytics
```

### Dashboard Overview

```bash
curl http://localhost:8080/api/analytics/dashboard
```

## Key Insights Available

1. **Question Difficulty vs Success Rate**
   - Which questions are too hard or too easy?
   - Average attempts needed per question
   - Average time to answer each question

2. **User Engagement Metrics**
   - Session completion rates
   - Average time spent in the game
   - Where users drop off most frequently
   - Session duration distribution

3. **Popular Share Methods**
   - Most popular social sharing platforms
   - Share patterns by question
   - Sharing trends over time

4. **Session-Level Analysis**
   - Individual user journey tracking
   - Event timeline for debugging
   - Detailed behavior analysis

## Performance Considerations

- All analytics queries include appropriate indexes
- JSONB fields allow flexible event data storage
- Connection pooling prevents database overload
- Aggregate queries are optimized with proper GROUP BY clauses

## Next Steps

Consider building:
1. A React dashboard to visualize analytics
2. Real-time analytics with WebSockets
3. A/B testing framework using event data
4. Predictive analytics for user behavior
5. Automated reports and alerts

## Troubleshooting

### Events not being saved

1. Check that the database schema is initialized: `node initDb.js`
2. Verify DATABASE_URL in `.env` is correct
3. Check backend logs for errors
4. Ensure CORS is properly configured

### Analytics endpoints returning empty data

1. Generate some test traffic in the application
2. Verify events are being saved: `SELECT COUNT(*) FROM events;`
3. Check database connection: `GET /api/db-test`

### Session tracking not working

1. Verify sessionId is being generated (check localStorage)
2. Check browser console for tracking errors
3. Ensure `/api/track` endpoint is accessible
