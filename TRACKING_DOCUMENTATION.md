# User Tracking Documentation

## Overview

This document describes the comprehensive user tracking system implemented for the NFL Teammates Game. The tracking system captures detailed user behavior, timing metrics, and engagement patterns to provide insights into how users interact with the game.

## What We Track

### 1. **Every Answer Users Choose**
- **Table**: `question_attempts`
- **Data Captured**:
  - User's answer (exact text entered)
  - Correct answer
  - Whether the answer was correct
  - Attempt number (1st, 2nd, 3rd, or 4th try)
  - Number of attempts remaining
  - Question index
  - Timestamp of when the answer was submitted

### 2. **Time Spent on Each Question**
- **Table**: `question_attempts`
- **Field**: `time_spent_seconds`
- **How It Works**:
  - Timer starts when a question is displayed
  - Timer stops when user submits an answer
  - Precision: 2 decimal places (e.g., 15.43 seconds)

### 3. **Time Spent on Each Game**
- **Table**: `game_sessions`
- **Field**: `duration_seconds`
- **How It Works**:
  - Timer starts when game component loads
  - Timer stops when user leaves the game or closes the page
  - Captures total time from first question to last

### 4. **Play Frequency**
- **Tables**: `user_sessions` and `daily_activity_summary`
- **Metrics Tracked**:
  - First seen timestamp
  - Last seen timestamp
  - Total number of sessions
  - Days active (unique days user played)
  - Days since first visit
  - Games played per day

### 5. **Multi-Game vs Single-Game Behavior**
- **Tables**: `game_sessions` and `daily_activity_summary`
- **View**: `session_game_diversity`
- **Metrics Tracked**:
  - Number of unique games played per session
  - Number of game switches per session
  - Session type classification (Multi-Game vs Single-Game)
  - Array of unique games played each day

## Database Schema

### Core Tables

#### `user_sessions`
Stores aggregate information about each user's activity across all time.

```sql
- session_id (unique identifier)
- first_seen (first time user visited)
- last_seen (most recent activity)
- total_sessions (number of times user visited)
- total_games_played (total games started)
- total_questions_answered (lifetime questions answered)
- total_correct_answers (lifetime correct answers)
- user_agent (browser/device info)
```

#### `game_sessions`
Tracks each individual time a user plays a game.

```sql
- id (primary key)
- session_id (links to user_sessions)
- game_id (e.g., 'common_player')
- game_name (e.g., 'Common Player Game')
- started_at (when game began)
- ended_at (when game finished)
- duration_seconds (total time played)
- questions_attempted (number of questions)
- questions_correct (number answered correctly)
- session_date (date of play)
```

#### `question_attempts`
Records every single answer attempt made by users.

```sql
- id (primary key)
- session_id (links to user_sessions)
- game_session_id (links to game_sessions)
- game_id (which game)
- question_index (which question 0, 1, 2, etc.)
- user_answer (what they typed)
- correct_answer (the right answer)
- is_correct (true/false)
- attempt_number (1st, 2nd, 3rd, or 4th try)
- attempts_remaining (how many tries left)
- time_spent_seconds (how long they took)
- answered_at (timestamp)
```

#### `user_engagement_events`
Logs all user interactions like shares, page views, etc.

```sql
- id (primary key)
- session_id (links to user_sessions)
- event_type (e.g., 'shared', 'question_started')
- event_data (JSON with additional details)
- event_timestamp
```

#### `daily_activity_summary`
Aggregated daily statistics for each user.

```sql
- session_id (links to user_sessions)
- activity_date (the date)
- games_played (number of games that day)
- questions_answered (questions answered that day)
- correct_answers (correct answers that day)
- total_time_seconds (total play time that day)
- unique_games_played (array of game IDs played)
```

### Analytics Views

#### `user_engagement_summary`
Provides a comprehensive overview of each user's engagement.

**Metrics**:
- Total sessions
- Total games played
- Total questions answered
- Accuracy percentage
- Days active
- Days since first visit

#### `session_game_diversity`
Analyzes whether users play multiple games or stick to one.

**Metrics**:
- Unique games played per session
- Total game sessions
- Session type (Multi-Game or Single-Game)
- Total session time

#### `question_performance`
Shows how difficult each question is across all users.

**Metrics**:
- Total attempts per question
- Correct attempts
- Average time to solve
- Average attempts needed to solve

## Tracked Events

### Event Types

1. **`game_started`**
   - Triggered: When user loads the game
   - Data: gameId, gameName

2. **`game_ended`**
   - Triggered: When user leaves game or closes page
   - Data: gameId, durationSeconds, questionsAttempted, questionsCorrect

3. **`question_started`**
   - Triggered: When a new question is displayed
   - Data: gameId, questionIndex

4. **`answer_submitted`**
   - Triggered: Every time user submits an answer
   - Data: gameId, questionIndex, userAnswer, correctAnswer, isCorrect, attemptNumber, attemptsLeft, timeSpentSeconds

5. **`shared`**
   - Triggered: When user clicks a social share button
   - Data: platform (facebook, twitter, reddit, whatsapp)

6. **`session_ping`**
   - Triggered: Every 30 seconds while game is active
   - Data: (none - just updates last_seen timestamp)

## How to Use the Tracking Data

### Initialize the Database

Before the tracking system can work, you must create the database tables:

```bash
cd nfl-teamates-game/backend
node initDB.js
```

This will create all tables, indexes, views, and functions.

### Query Examples

#### 1. Get All Answers for a Specific User

```sql
SELECT
  question_index,
  user_answer,
  correct_answer,
  is_correct,
  attempt_number,
  time_spent_seconds,
  answered_at
FROM question_attempts
WHERE session_id = 'your-session-id'
ORDER BY answered_at;
```

#### 2. Calculate Average Time Per Question

```sql
SELECT
  question_index,
  ROUND(AVG(time_spent_seconds), 2) as avg_time,
  COUNT(*) as total_attempts,
  SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count
FROM question_attempts
GROUP BY question_index;
```

#### 3. Find Multi-Game Players

```sql
SELECT
  session_id,
  COUNT(DISTINCT game_id) as unique_games,
  COUNT(*) as total_sessions,
  SUM(duration_seconds) as total_time
FROM game_sessions
GROUP BY session_id
HAVING COUNT(DISTINCT game_id) > 1
ORDER BY total_sessions DESC;
```

#### 4. Daily Active Users

```sql
SELECT
  activity_date,
  COUNT(DISTINCT session_id) as unique_users,
  SUM(games_played) as total_games,
  SUM(questions_answered) as total_questions
FROM daily_activity_summary
GROUP BY activity_date
ORDER BY activity_date DESC;
```

#### 5. User Retention Analysis

```sql
SELECT
  session_id,
  first_seen,
  last_seen,
  total_sessions,
  ROUND(EXTRACT(EPOCH FROM (last_seen - first_seen)) / 86400, 1) as days_retained
FROM user_sessions
WHERE total_sessions > 1
ORDER BY days_retained DESC;
```

### API Endpoints

#### Track Event
```
POST /api/track
Content-Type: application/json

{
  "sessionId": "uuid",
  "eventType": "answer_submitted",
  "eventData": { ... },
  "timestamp": "2025-11-18T12:00:00.000Z",
  "userAgent": "Mozilla/5.0 ..."
}
```

#### Get User Analytics
```
GET /api/track/analytics/:sessionId
```

Returns:
- User engagement summary
- Session diversity metrics
- Recent question attempts

#### Check Tracking Status
```
GET /api/track
```

Returns information about the tracking endpoint and supported events.

## Privacy Considerations

- **No Personal Information**: We do not collect names, emails, or any personally identifiable information
- **Session-Based**: All tracking is tied to randomly generated session IDs stored in browser localStorage
- **Anonymous**: Session IDs cannot be traced back to specific individuals
- **User Control**: Users can clear their localStorage to reset their session ID

## Performance Optimizations

1. **Database Indexes**: Created on frequently queried columns (session_id, game_session_id, is_correct, etc.)
2. **Connection Pooling**: PostgreSQL connection pool prevents connection overhead
3. **Async Tracking**: Frontend sends tracking events asynchronously without blocking UI
4. **Error Handling**: Failed tracking events are logged but don't interrupt gameplay
5. **View Materialization**: Consider materializing views for large datasets

## Future Enhancements

Potential additions to the tracking system:

1. **Heatmaps**: Visual representation of which questions take longest
2. **Funnel Analysis**: Track where users drop off in the game
3. **Cohort Analysis**: Compare behavior of users from different time periods
4. **A/B Testing**: Track which game variations perform better
5. **Real-time Dashboard**: Live view of current active users and metrics
6. **Export Functionality**: CSV/JSON export of analytics data
7. **User Segmentation**: Group users by behavior patterns
8. **Predictive Analytics**: Predict which questions will be most challenging

## Troubleshooting

### Tracking Events Not Saving

1. Check database connection in `.env` file
2. Verify database tables exist: `node initDB.js`
3. Check browser console for errors
4. Verify backend is running and accessible

### Missing Data

1. Ensure `game_started` event fires when game loads
2. Check that `game_ended` event fires on page unload
3. Verify timestamps are being captured correctly

### Slow Queries

1. Ensure indexes are created (run initDB.js)
2. Consider adding composite indexes for common query patterns
3. Archive old data to separate tables

## Contact

For questions or issues with the tracking system, please open an issue in the repository.
