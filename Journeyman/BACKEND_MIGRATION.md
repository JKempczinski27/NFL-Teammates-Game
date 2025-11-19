# Journeyman Game - Backend Migration Guide

This guide explains how to migrate the Journeyman Game frontend to use the consolidated backend.

## Quick Start

### 1. Environment Configuration

Create a `.env` file in the `Journeyman` directory:

```bash
REACT_APP_API_URL=your-backend-url
```

**Examples:**
- Local development: `REACT_APP_API_URL=http://localhost:8080`
- Production (Railway): `REACT_APP_API_URL=https://your-app.railway.app`
- Production (Render): `REACT_APP_API_URL=https://your-app.onrender.com`

### 2. API Endpoint Updates

The following API endpoints have been updated:

**Old Endpoint:**
```javascript
fetch('/save-player', { ... })
```

**New Endpoint:**
```javascript
fetch(`${process.env.REACT_APP_API_URL}/api/journeyman/save-player`, { ... })
```

The `dataUploadService.js` file has been configured to use `REACT_APP_API_URL` environment variable.

### 3. Available Endpoints

#### POST `/api/journeyman/save-player`
Save player data after game completion.

**Request Body:**
```json
{
  "name": "Player Name",
  "email": "player@example.com",
  "sessionId": "unique-session-id",
  "gameType": "journeyman",
  "score": 100,
  "guesses": 5,
  "timeElapsed": 120,
  "clientTimestamp": "2025-11-19T00:00:00.000Z",
  "browserInfo": { ... },
  "sessionInfo": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Player saved successfully",
  "playerId": 123
}
```

#### POST `/api/journeyman/batch-upload`
Upload multiple game sessions at once.

**Request Body:**
```json
{
  "sessions": [
    { /* session data */ },
    { /* session data */ }
  ],
  "batchSize": 2,
  "batchTimestamp": "2025-11-19T00:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "processed": 2,
  "successful": 2,
  "failed": 0
}
```

#### POST `/api/journeyman/export-analytics`
Export analytics data for a date range.

**Request Body:**
```json
{
  "startDate": "2025-11-01",
  "endDate": "2025-11-30",
  "gameType": "journeyman"
}
```

#### GET `/api/journeyman/leaderboard?limit=10&gameType=journeyman`
Get top players from the journeyman game.

**Response:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "name": "Player Name",
      "score": 100,
      "guesses": 5,
      "time_elapsed": 120,
      "created_at": "2025-11-19T00:00:00.000Z"
    }
  ]
}
```

## Code Changes

The `dataUploadService.js` file automatically uses the `REACT_APP_API_URL` environment variable. All API calls are updated to use the new `/api/journeyman` prefix.

## Testing

1. Start the backend server:
   ```bash
   cd nfl-teamates-game/backend
   npm install
   npm start
   ```

2. Start the frontend:
   ```bash
   cd Journeyman/journeyman
   npm install
   npm start
   ```

3. Test the game flow and verify data is being saved to the backend.

## Deployment

See the main [DEPLOYMENT.md](/DEPLOYMENT.md) in the root directory for detailed deployment instructions.

## S3 Integration

The backend supports S3 for data storage. See the backend's S3_SETUP_MANUAL.md for details on configuring S3 integration.

## Troubleshooting

### CORS Errors
If you see CORS errors, make sure the backend has CORS enabled and your frontend URL is whitelisted.

### Environment Variables Not Loading
- Make sure the `.env` file is in the correct directory
- Restart your development server after changing `.env`
- Create React App requires variables to be prefixed with `REACT_APP_`

### API Calls Failing
- Check that the backend is running and accessible
- Verify the `REACT_APP_API_URL` is correct
- Check browser console for error messages
- Verify the backend database is properly initialized

### Data Not Saving
- Check the browser console for upload errors
- The dataUploadService has a retry queue - check queue status
- Failed uploads are stored in localStorage and can be retried
