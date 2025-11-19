# NFL Teammates Game - Database Schema

This document describes the database schema for the NFL Teammates Game application.

## Database Technology

- **Database**: PostgreSQL
- **Driver**: `pg` (node-postgres)
- **Hosting**: Railway.app

## Tables

### 1. `teams`
Stores information about NFL teams.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR(100) | Team name (unique) |
| city | VARCHAR(100) | Team city |
| abbreviation | VARCHAR(10) | Team abbreviation (e.g., "NE", "KC") |
| created_at | TIMESTAMP | Record creation timestamp |

**Pre-populated**: All 32 current NFL teams are inserted during initialization.

### 2. `players`
Stores NFL player information.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR(255) | Player's full name |
| position | VARCHAR(50) | Player's position (e.g., "QB", "WR") |
| teams | TEXT | Comma-separated list of team names for quick reference |
| years_active | VARCHAR(50) | Years active (e.g., "2010-2020") |
| image_url | TEXT | URL to player's image |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Record last updated timestamp |

**Indexes**:
- `idx_players_name` on `name` column

### 3. `team_relationships`
Tracks which teams each player has played for and when.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| player_id | INTEGER | Foreign key to players table |
| team_id | INTEGER | Foreign key to teams table |
| year_start | INTEGER | Starting year with team |
| year_end | INTEGER | Ending year with team (NULL if currently active) |
| created_at | TIMESTAMP | Record creation timestamp |

**Constraints**:
- `year_end >= year_start` (or NULL)
- Foreign key cascade delete on both player_id and team_id

**Indexes**:
- `idx_team_relationships_player_id` on `player_id`
- `idx_team_relationships_team_id` on `team_id`

### 4. `questions`
Stores game questions.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| answer | VARCHAR(255) | The correct answer to the question |
| difficulty | VARCHAR(20) | Question difficulty: 'easy', 'medium', or 'hard' |
| category | VARCHAR(100) | Question category (e.g., 'teammates', 'same-team') |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Record last updated timestamp |

**Constraints**:
- `difficulty` must be one of: 'easy', 'medium', 'hard'

**Indexes**:
- `idx_questions_difficulty` on `difficulty`
- `idx_questions_category` on `category`

### 5. `question_players`
Links players to questions (many-to-many relationship).

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| question_id | INTEGER | Foreign key to questions table |
| player_id | INTEGER | Foreign key to players table |
| created_at | TIMESTAMP | Record creation timestamp |

**Constraints**:
- Unique constraint on (question_id, player_id) pair
- Foreign key cascade delete on both question_id and player_id

**Indexes**:
- `idx_question_players_question_id` on `question_id`
- `idx_question_players_player_id` on `player_id`

### 6. `user_stats`
Tracks user session statistics and performance.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| session_id | VARCHAR(255) | Unique session identifier |
| questions_answered | INTEGER | Total questions answered (default: 0) |
| correct | INTEGER | Number of correct answers (default: 0) |
| incorrect | INTEGER | Number of incorrect answers (default: 0) |
| streak | INTEGER | Current streak of correct answers (default: 0) |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Record last updated timestamp |

**Constraints**:
- `session_id` must be unique

**Indexes**:
- `idx_user_stats_session_id` on `session_id`

## Database Initialization

### First Time Setup

1. Ensure your `.env` file in the backend directory contains the `DATABASE_URL`:
   ```
   DATABASE_URL='postgresql://username:password@host:port/database'
   ```

2. Run the initialization script:
   ```bash
   cd backend
   npm run init-db
   ```

   This will:
   - Drop existing tables (if any)
   - Create all tables with proper constraints
   - Create indexes for performance
   - Insert all 32 NFL teams

### Manual Execution

You can also run the schema manually using psql:

```bash
psql $DATABASE_URL -f schema.sql
```

## Relationships

```
teams (1) ----< (M) team_relationships (M) >---- (1) players
                                                       |
                                                       |
                                                      (M)
                                                       |
                                                       v
questions (1) ----< (M) question_players (M) >---- (1) players

user_stats (independent)
```

## Usage Examples

### Get all players who played for a specific team

```sql
SELECT p.*
FROM players p
JOIN team_relationships tr ON p.id = tr.player_id
JOIN teams t ON tr.team_id = t.id
WHERE t.name = 'New England Patriots';
```

### Get all teams a player has played for

```sql
SELECT t.*, tr.year_start, tr.year_end
FROM teams t
JOIN team_relationships tr ON t.id = tr.team_id
WHERE tr.player_id = 1
ORDER BY tr.year_start;
```

### Get a question with all associated players

```sql
SELECT q.*, p.name as player_name
FROM questions q
JOIN question_players qp ON q.id = qp.question_id
JOIN players p ON qp.player_id = p.id
WHERE q.id = 1;
```

### Update user statistics after answering a question

```sql
INSERT INTO user_stats (session_id, questions_answered, correct, streak)
VALUES ('session-123', 1, 1, 1)
ON CONFLICT (session_id)
DO UPDATE SET
    questions_answered = user_stats.questions_answered + 1,
    correct = user_stats.correct + 1,
    streak = user_stats.streak + 1,
    updated_at = CURRENT_TIMESTAMP;
```

## Notes

- All tables use `SERIAL` for auto-incrementing primary keys
- Foreign key constraints use `ON DELETE CASCADE` to maintain referential integrity
- Timestamps are automatically set using `DEFAULT CURRENT_TIMESTAMP`
- Indexes are created on frequently queried columns for better performance
- The `teams` table is pre-populated with all 32 current NFL teams
