# 🚀 Database Migration Instructions

## Quick Start

Your database consolidation is ready! Follow these steps to migrate from multiple tables to a single consolidated player table.

## Step 1: Run Migration on Railway

You have two options:

### Option A: Direct Migration (Recommended for testing)

1. **Connect to Railway:**
   ```bash
   # Install Railway CLI if needed
   npm install -g @railway/cli

   # Login to Railway
   railway login

   # Link to your project
   railway link
   ```

2. **Run the migration script:**
   ```bash
   # Test run (keeps old tables)
   railway run node backend/migrate-to-single-table.js

   # Check the output and verify data

   # Production run (removes old tables)
   railway run node backend/migrate-to-single-table.js --drop-old-tables
   ```

### Option B: Fresh Database Setup

If you want to start fresh (WARNING: This deletes all existing data):

```bash
railway run node backend/initDatabase.js
```

## Step 2: Verify Migration

### Check on Railway Dashboard

1. Go to Railway dashboard
2. Open your PostgreSQL database
3. Connect to the database
4. Run these queries:

```sql
-- Check if players table exists and has data
SELECT COUNT(*) FROM players;

-- Check data by game type
SELECT game_type, COUNT(*)
FROM players
GROUP BY game_type;

-- View sample data
SELECT
  name, email, game_type,
  total_sessions, last_activity_at
FROM players
ORDER BY created_at DESC
LIMIT 10;

-- Check views
SELECT * FROM v_trivia_leaderboard LIMIT 5;
SELECT * FROM v_journeyman_leaderboard LIMIT 5;
```

## Step 3: Deploy Updated Backend

The backend code has been updated to use the new schema. Just commit and push:

```bash
git add .
git commit -m "Consolidate database to single players table"
git push origin claude/consolidate-database-tables-01NordcMt25SAAwwUoKFyWML
```

Railway will automatically redeploy with the updated code.

## What Changed?

### Before: Multiple Tables
```
players              (NFL Teammates)
trivia_players       (NFL Trivia)
journeyman_players   (Journeyman)
player_updated       (Events)
events               (Analytics)
user_sessions        (Sessions)
question_analytics   (Questions)
share_analytics      (Shares)
... and more
```

### After: Single Table
```
players (ALL player data for ALL games)
  ├── Core fields (id, name, email)
  ├── Trivia data (favorite_team, scores)
  ├── Journeyman data (correct_count, duration)
  ├── Teammates data (games_played, best_score)
  └── Aggregate stats (total sessions, questions, etc.)
```

## New API Endpoints

Your API now supports:

```javascript
// Create/update player
POST /api/players
{
  "name": "John Doe",
  "email": "john@example.com",
  "gameType": "trivia",
  "favoriteTeam": "Patriots",
  "sessionId": "abc123"
}

// Get all players (with optional filters)
GET /api/players?limit=100&gameType=trivia

// Get specific player
GET /api/players/john@example.com

// Update player stats
PUT /api/players/john@example.com
{
  "triviaScore": 85,
  "journeymanCorrectCount": 12
}

// Get leaderboard
GET /api/players/leaderboard/trivia
GET /api/players/leaderboard/journeyman
```

## Rollback Plan

If something goes wrong:

1. **The migration script creates a backup file** automatically
2. Located at: `backend/backup-{timestamp}.json`
3. You can restore from this backup if needed

## Troubleshooting

### Migration fails with "table already exists"

The schema drops old tables first. If you see this error, tables may be in use:

```sql
-- Force drop all tables
DROP TABLE IF EXISTS players, trivia_players, journeyman_players,
  player_updated, events, user_sessions, question_analytics,
  share_analytics CASCADE;
```

Then run migration again.

### "Column does not exist" errors in backend

Make sure you've deployed the updated backend code after migration.

### Performance issues

The new table has indexes. If queries are slow, check:

```sql
-- Verify indexes exist
\d players

-- Should see indexes on:
-- - email
-- - session_id
-- - game_type
-- - games_played (GIN index)
-- - metadata (GIN index)
```

## Support

See `DATABASE_CONSOLIDATION.md` for detailed documentation on:
- Schema structure
- Helper functions
- SQL queries
- Performance optimization

## Quick Reference

### Check table size
```sql
SELECT pg_size_pretty(pg_total_relation_size('players'));
```

### Count players by game
```sql
SELECT game_type, COUNT(*)
FROM players
GROUP BY game_type;
```

### Find cross-game players
```sql
SELECT name, email, games_played
FROM players
WHERE array_length(games_played, 1) > 1;
```

### Update player stats after gameplay
```sql
SELECT calculate_player_stats('player@example.com');
```
