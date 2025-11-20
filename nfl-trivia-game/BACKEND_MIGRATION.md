# NFL Trivia Game - Backend Migration Guide

The backend for NFL Trivia Game has been consolidated into the main NFL Teammates Game backend.

## What Changed

### Old Backend Location
- `NFL-Trivia-Game/server/` (deprecated)
- `NFL-Trivia-Game/long-drive-backend/` (deprecated)

### New Backend Location
- `nfl-teamates-game/backend/`
- Routes: `nfl-teamates-game/backend/routes/trivia.js`

## API Endpoint Changes

### Old Endpoints
```
POST /api/players
GET /api/players
```

### New Endpoints
```
POST /api/trivia/players
GET /api/trivia/players
GET /api/trivia/leaderboard?limit=10
```

## Frontend Configuration Steps

### 1. Create Environment File

Create `.env` in the root of `NFL-Trivia-Game/`:

```env
VITE_API_URL=http://localhost:3000
```

For production:
```env
VITE_API_URL=https://your-backend-url.railway.app
```

### 2. Update API Calls in Code

Find all instances of:
```javascript
fetch(`${import.meta.env.VITE_API_URL}/api/players`, ...)
```

Replace with:
```javascript
fetch(`${import.meta.env.VITE_API_URL}/api/trivia/players`, ...)
```

**Files to update:**
- `src/App.jsx` (lines ~329 and ~568)

### 3. Response Format

The new backend returns a slightly different response format:

**Old:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "team": "Dallas Cowboys",
  "score": 85,
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

**New:**
```json
{
  "message": "Trivia player saved successfully",
  "player": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "team": "Dallas Cowboys",
    "score": 85,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

Update your code to handle `result.player` instead of just `result`.

### 4. New Leaderboard Endpoint

You can now fetch a leaderboard:

```javascript
const response = await fetch(
  `${import.meta.env.VITE_API_URL}/api/trivia/leaderboard?limit=10`
);
const data = await response.json();
// data will be an array of top players sorted by score
```

## Database

The new backend uses the `trivia_players` table with this schema:

```sql
CREATE TABLE trivia_players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    team VARCHAR(255) NOT NULL,
    score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Testing

Test the new endpoints:

```bash
# Save a player
curl -X POST http://localhost:3000/api/trivia/players \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Player","email":"test@example.com","team":"Dallas Cowboys","score":85}'

# Get all players
curl http://localhost:3000/api/trivia/players

# Get leaderboard
curl http://localhost:3000/api/trivia/leaderboard?limit=5
```

## Old Backend Files

The old backend files in `server/` and `long-drive-backend/` can be removed once migration is complete and tested.

## Questions?

See the main [BACKEND_CONSOLIDATION_GUIDE.md](../BACKEND_CONSOLIDATION_GUIDE.md) for more details.
