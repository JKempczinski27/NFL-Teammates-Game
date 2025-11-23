# Database Consolidation Guide

## Overview

This document describes the database consolidation from **multiple tables** to a **single comprehensive player data table**.

### Before (Multiple Tables)
- `players` - NFL Teammates players
- `trivia_players` - NFL Trivia players
- `journeyman_players` - Journeyman game players
- `player_updated` - Event tracking
- `events` - Analytics events
- `user_sessions` - Session tracking
- `question_analytics` - Question performance
- `share_analytics` - Share tracking
- `game_submissions` - Game submissions
- Plus many more analytics tables...

### After (Single Table)
- `players` - **ALL player data for ALL games**

## New Schema Structure

The new `players` table contains all player information in a single, comprehensive table:

### Core Fields
- `id` - Primary key
- `name` - Player name
- `email` - Player email (unique)
- `session_id` - Current session
- `game_type` - Last game played
- `games_played` - Array of all games played

### Game-Specific Fields

#### NFL Trivia
- `favorite_team`
- `trivia_score`
- `trivia_best_score`
- `trivia_games_played`

#### Journeyman
- `journeyman_correct_count`
- `journeyman_best_correct`
- `journeyman_duration_seconds`
- `journeyman_best_time`
- `journeyman_games_played`
- `journeyman_game_data` (JSONB)

#### NFL Teammates
- `teammates_games_played`
- `teammates_best_score`
- `teammates_completion_count`

### Aggregate Statistics
- `total_sessions`
- `total_questions_viewed`
- `total_questions_answered`
- `total_correct_answers`
- `total_wrong_answers`
- `total_time_spent_seconds`
- `total_shares`
- `completion_rate`
- `avg_questions_per_session`
- `best_streak`
- `current_streak`

### Timestamps
- `created_at`
- `updated_at`
- `last_activity_at`
- `last_game_played_at`
- `current_session_started_at`

### Flexible Storage
- `metadata` (JSONB) - Store any additional game-specific data
- `event_history` (JSONB) - Store recent important events
- `consents` (JSONB) - GDPR consent tracking

## Migration Steps

### 1. Backup Your Current Database

```bash
# The migration script automatically creates a backup
node backend/migrate-to-single-table.js
```

This creates a timestamped backup file: `backup-{timestamp}.json`

### 2. Run Migration (Test Mode)

```bash
# First run without dropping old tables
node backend/migrate-to-single-table.js
```

This will:
- ✅ Create backup of all existing data
- ✅ Create new consolidated schema
- ✅ Migrate all player data from old tables
- ✅ Preserve old tables for safety

### 3. Verify Migration

Check that all data was migrated correctly:

```sql
-- Check total players
SELECT COUNT(*) FROM players;

-- Check players by game
SELECT game_type, COUNT(*) FROM players GROUP BY game_type;

-- Check cross-game players
SELECT array_length(games_played, 1) as num_games, COUNT(*)
FROM players
GROUP BY num_games;

-- View sample data
SELECT * FROM players LIMIT 5;
```

### 4. Run Migration (Production Mode)

Once verified, run again with the flag to drop old tables:

```bash
node backend/migrate-to-single-table.js --drop-old-tables
```

This will permanently remove old tables.

## API Updates

### Creating/Updating Players

**Old way (multiple endpoints):**
```javascript
// Teammates
POST /api/player { name, email }

// Trivia
POST /api/trivia/player { name, email, team }

// Journeyman
POST /api/journeyman/player { name, email, gameData }
```

**New way (single endpoint):**
```javascript
POST /api/players
{
  "name": "John Doe",
  "email": "john@example.com",
  "gameType": "trivia",           // 'teammates', 'journeyman', 'trivia'
  "favoriteTeam": "Patriots",      // For trivia
  "sessionId": "abc123",
  "metadata": {                    // Any additional data
    "customField": "value"
  }
}
```

### Getting Player Data

```javascript
// Get all players
GET /api/players?limit=100&gameType=trivia

// Get specific player
GET /api/players/:email

// Get leaderboard
GET /api/players/leaderboard/trivia
GET /api/players/leaderboard/journeyman
```

### Updating Player Stats

```javascript
PUT /api/players/:email
{
  "triviaScore": 85,              // Updates trivia stats
  "journeymanCorrectCount": 12,   // Updates journeyman stats
  "sessionData": {
    "questionsAnswered": 10,
    "timeSpent": 300
  }
}
```

## Helper Views

The new schema includes several views for common queries:

### Leaderboards
- `v_trivia_leaderboard` - Top trivia players
- `v_journeyman_leaderboard` - Top journeyman players
- `v_most_engaged_players` - Most active players overall

### Analytics
- `v_recent_players` - Players active in last 7 days
- `v_game_popularity` - Game usage statistics

## Helper Functions

### Calculate Player Statistics
```sql
SELECT calculate_player_stats('player@example.com');
```

Automatically calculates:
- Completion rate
- Average questions per session
- Average session duration
- Average time per question

### Merge Player Data
```sql
SELECT merge_player_data(
  'John Doe',
  'john@example.com',
  'trivia',
  '{"team": "Patriots"}'::JSONB
);
```

## Benefits of Single Table Design

### ✅ Advantages
1. **Simplicity** - One table to manage instead of 10+
2. **Cross-game tracking** - Easily see which players play multiple games
3. **Unified API** - Single endpoint for all player operations
4. **Better performance** - No complex joins needed
5. **Easier backups** - One table to backup/restore
6. **Flexible schema** - JSONB fields for game-specific data
7. **Reduced code complexity** - Less code to maintain

### ⚠️ Considerations
1. **Table size** - Single table will grow larger (but still manageable)
2. **Schema changes** - Adding new games requires column additions
3. **Some columns may be NULL** - Not all players play all games

## Rollback Plan

If you need to rollback:

1. The backup file contains all original data
2. Restore from backup:

```javascript
// Create restore script using backup file
const backup = require('./backup-{timestamp}.json');

// Restore each table
for (const [table, rows] of Object.entries(backup)) {
  // Insert rows back into original tables
}
```

## Production Deployment

### Railway Deployment Steps

1. **Test migration locally first:**
   ```bash
   DATABASE_URL=postgresql://localhost/test node backend/migrate-to-single-table.js
   ```

2. **Create Railway backup:**
   - Go to Railway dashboard
   - Navigate to your database service
   - Create a snapshot/backup

3. **Run migration on Railway:**
   ```bash
   # Set Railway DATABASE_URL
   export DATABASE_URL="your-railway-database-url"

   # Run migration
   node backend/migrate-to-single-table.js

   # Verify
   # Then drop old tables
   node backend/migrate-to-single-table.js --drop-old-tables
   ```

4. **Deploy updated backend:**
   ```bash
   git add .
   git commit -m "Consolidate database to single players table"
   git push
   ```

## Monitoring

After migration, monitor:

1. **Table size:** `SELECT pg_size_pretty(pg_total_relation_size('players'));`
2. **Row count:** `SELECT COUNT(*) FROM players;`
3. **Index usage:** Check query performance
4. **API response times:** Ensure no performance degradation

## Support

If you encounter issues:
1. Check the backup file
2. Review migration logs
3. Test queries against the new schema
4. Use the helper views for common operations
