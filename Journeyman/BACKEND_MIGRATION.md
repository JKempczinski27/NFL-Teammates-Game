# Journeyman Game - Backend Migration Guide

The Journeyman game backend has been migrated from Python/Flask to Node.js and consolidated into the main NFL Teammates Game backend.

## What Changed

### Old Backend
- **Location:** `Journeyman/journeyman/backend-python/`
- **Technology:** Python 3.12, Flask
- **Features:** GDPR compliance, encryption, consent management, rate limiting

### New Backend
- **Location:** `nfl-teamates-game/backend/`
- **Technology:** Node.js, Express
- **Routes:** `nfl-teamates-game/backend/routes/journeyman.js`

## API Endpoint Changes

### Migrated Endpoints

| Old Endpoint | New Endpoint | Notes |
|-------------|-------------|-------|
| `POST /save-player` | `POST /api/journeyman/save-player` | ✅ Fully migrated |
| `GET /analytics/journeyman` | `GET /api/journeyman/analytics` | ✅ Requires API key |
| N/A | `GET /api/journeyman/leaderboard` | ✅ New endpoint |

### Not Migrated (Python-specific)

The following GDPR and security features were **not migrated** to Node.js:

- ❌ `GET /api/gdpr/export/<user_id>` - GDPR data export
- ❌ `DELETE /api/gdpr/delete/<user_id>` - Right to be forgotten
- ❌ `GET /api/consent/<user_id>` - Get user consents
- ❌ `POST /api/consent/<user_id>` - Record consent
- ❌ `DELETE /api/consent/<user_id>/<type>` - Revoke consent
- ❌ `POST /api/encrypt` - Data encryption
- ❌ `POST /api/decrypt` - Data decryption
- ❌ Flask-Talisman security headers
- ❌ Flask-Limiter rate limiting

See [GDPR_FEATURES.md](../GDPR_FEATURES.md) for implementation guide if these features are needed.

## Frontend Configuration Steps

### 1. Update API Base URL

Find all API calls in your frontend code.

**Old:**
```javascript
fetch('https://your-backend.up.railway.app/save-player', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(gameData)
})
```

**New:**
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

fetch(`${API_URL}/api/journeyman/save-player`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(gameData)
})
```

### 2. Create Environment File

Create `.env` in `Journeyman/journeyman/`:

```env
# For Create React App
REACT_APP_API_URL=http://localhost:3000

# For Vite
VITE_API_URL=http://localhost:3000
```

For production:
```env
REACT_APP_API_URL=https://your-backend-url.railway.app
```

### 3. Update Files

**Files likely needing updates:**
- `src/PlayerForm.js`
- `src/utils/dataUploadService.js`
- `src/GameTrackingTemplate.js`

Search for:
- `https://your-backend.up.railway.app`
- `/save-player`
- `/analytics/journeyman`

Replace with:
- `${process.env.REACT_APP_API_URL}` or `${import.meta.env.VITE_API_URL}`
- `/api/journeyman/save-player`
- `/api/journeyman/analytics`

### 4. Request/Response Format

#### Save Player

**Request format (unchanged):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "correctCount": 15,
  "durationInSeconds": 180,
  "gameData": {
    "level": 5,
    "teams": ["DAL", "NYG", "PHI"]
  }
}
```

**Response format:**
```json
{
  "success": true,
  "message": "Player data saved",
  "player": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "correctCount": 15,
    "durationInSeconds": 180
  }
}
```

#### Analytics (Requires API Key)

**Request:**
```javascript
fetch(`${API_URL}/api/journeyman/analytics`, {
  headers: {
    'X-API-Key': process.env.REACT_APP_API_KEY
  }
})
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "totalPlayers": 1250,
    "averageScore": 12.5,
    "highestScore": 30,
    "averageDuration": 195.3,
    "recentPlayers": [...]
  }
}
```

### 5. New Leaderboard Feature

```javascript
const response = await fetch(
  `${API_URL}/api/journeyman/leaderboard?limit=10`
);
const data = await response.json();
// data.success === true
// data.leaderboard = array of top players
```

## Database

The new backend uses the `journeyman_players` table:

```sql
CREATE TABLE journeyman_players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    correct_count INTEGER DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    game_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Input Validation

The new backend includes the same input validation as the Python version:

- Name: Required, max 100 characters
- Email: Required, valid format
- Injection detection for common attack patterns
- Score validation: 0-100
- Duration validation: 1-3600 seconds

## Security Features

### Implemented in Node.js Backend
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (parameterized queries)
- ✅ API key authentication for analytics endpoint
- ✅ CORS configuration
- ✅ JSON body parsing with limits

### Not Yet Implemented (See GDPR_FEATURES.md)
- ❌ Rate limiting
- ❌ Security headers (HSTS, CSP)
- ❌ Data encryption
- ❌ GDPR endpoints
- ❌ Consent management

## Testing

Test the new endpoints:

```bash
# Save player
curl -X POST http://localhost:3000/api/journeyman/save-player \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test Player",
    "email":"test@example.com",
    "correctCount":15,
    "durationInSeconds":180
  }'

# Get analytics (requires API key)
curl -H "X-API-Key: your-key-here" \
  http://localhost:3000/api/journeyman/analytics

# Get leaderboard
curl http://localhost:3000/api/journeyman/leaderboard?limit=5
```

## Environment Variables

Set these in your deployment:

```env
DATABASE_URL=postgresql://user:password@host:port/database
PORT=3000
ADMIN_TOKEN=your-admin-token-here  # For analytics endpoint
```

## Old Backend Files

The Python backend in `journeyman/backend-python/` can be kept for reference or removed once migration is complete and tested.

## Migration Checklist

- [ ] Update all frontend API calls to new endpoints
- [ ] Create `.env` file with API_URL
- [ ] Test save-player functionality
- [ ] Test analytics endpoint (if used)
- [ ] Test leaderboard feature
- [ ] Update deployment configuration
- [ ] Run database migrations
- [ ] Verify data is saving correctly

## Questions?

See the main [BACKEND_CONSOLIDATION_GUIDE.md](../BACKEND_CONSOLIDATION_GUIDE.md) for more details.

For GDPR features, see [GDPR_FEATURES.md](../GDPR_FEATURES.md).
