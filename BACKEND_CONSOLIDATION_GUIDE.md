# Backend Consolidation Guide

This document describes the consolidated backend structure for all NFL games in this repository.

## Overview

All three NFL games now share a single Node.js/Express backend located at:
```
nfl-teamates-game/backend/
```

## Supported Games

1. **NFL Teammates Game** - Original player connection game
2. **NFL Trivia Game** - NFL trivia and playmaker quiz
3. **Journeyman Game** - NFL player career journey game

## API Endpoints

### NFL Teammates Game
- `POST /api/player` - Save player information
- `GET /api/db-test` - Test database connection
- `POST /api/track/*` - Event tracking endpoints
- `GET /api/analytics` - Analytics data
- `GET /api/s3-management` - S3 file management

### NFL Trivia Game
- `POST /api/trivia/players` - Save trivia game player and score
- `GET /api/trivia/players` - Get all trivia players
- `GET /api/trivia/leaderboard?limit=10` - Get top scores

### Journeyman Game
- `POST /api/journeyman/save-player` - Save Journeyman player data
- `GET /api/journeyman/analytics` - Get analytics (requires API key)
- `GET /api/journeyman/leaderboard?limit=10` - Get top scores

## Database Schema

The consolidated backend uses the following tables:

### NFL Teammates Game
- `players` - Player information
- `player_updated` - Event tracking data

### NFL Trivia Game
- `trivia_players` - Player name, email, team, and score

### Journeyman Game
- `journeyman_players` - Player name, email, correct_count, duration_seconds, game_data (JSONB)

## Frontend Configuration

### NFL Trivia Game

Update your frontend to point to the consolidated backend:

**For Vite (NFL-Trivia-Game):**
Create or update `.env` file:
```env
VITE_API_URL=https://your-backend-url.railway.app
```

Update API calls in your code from:
```javascript
fetch(`${import.meta.env.VITE_API_URL}/api/players`, ...)
```

To:
```javascript
fetch(`${import.meta.env.VITE_API_URL}/api/trivia/players`, ...)
```

### Journeyman Game

Update `src/PlayerForm.js` or similar files from:
```javascript
fetch('https://your-backend.up.railway.app/save-player', ...)
```

To:
```javascript
fetch('https://your-backend-url.railway.app/api/journeyman/save-player', ...)
```

For analytics endpoints, include the API key:
```javascript
fetch('https://your-backend-url.railway.app/api/journeyman/analytics', {
  headers: {
    'X-API-Key': 'your-api-key-here'
  }
})
```

## Environment Variables

The consolidated backend requires:

```env
DATABASE_URL=postgresql://user:password@host:port/database
PORT=3000
ADMIN_TOKEN=your-admin-token-here  # For protected endpoints
API_KEY=your-api-key-here          # Alternative to ADMIN_TOKEN
```

## Database Setup

Run the schema file to create all necessary tables:
```bash
cd nfl-teamates-game/backend
psql $DATABASE_URL -f ../../schema.sql
```

Or use the init script:
```bash
node initDB.js
```

## Starting the Backend

```bash
cd nfl-teamates-game/backend
npm install
npm start
```

The backend will be available at `http://localhost:3000` (or the PORT specified in .env)

## Migration Notes

### What Was Migrated
- ✅ NFL Trivia Game endpoints (POST/GET players)
- ✅ Journeyman game endpoints (save-player, analytics)
- ✅ Input validation and security checks
- ✅ Database schema for all games

### What Was NOT Migrated (Python-specific features)
- ❌ GDPR compliance endpoints (export, delete, consent management)
- ❌ Advanced encryption utilities
- ❌ Flask-Talisman security headers
- ❌ Flask-Limiter rate limiting
- ❌ CSRF protection

See [GDPR_FEATURES.md](./GDPR_FEATURES.md) for details on implementing these features in Node.js.

## Testing

Test each game's endpoints:

```bash
# NFL Trivia
curl -X POST http://localhost:3000/api/trivia/players \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Player","email":"test@example.com","team":"Dallas Cowboys","score":85}'

# Journeyman
curl -X POST http://localhost:3000/api/journeyman/save-player \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","correctCount":10,"durationInSeconds":120}'

# Get leaderboards
curl http://localhost:3000/api/trivia/leaderboard?limit=5
curl http://localhost:3000/api/journeyman/leaderboard?limit=5
```

## Deployment

When deploying to Railway or similar platforms:
1. Deploy the `nfl-teamates-game/backend` directory
2. Set all required environment variables
3. Run database migrations
4. Update all frontend apps to use the new backend URL

## Support

For issues or questions about the consolidated backend, check:
- `nfl-teamates-game/backend/routes/` - Route implementations
- `schema.sql` - Database structure
- `GDPR_FEATURES.md` - Future feature roadmap
