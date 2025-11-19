# NFL Trivia Game - Backend Migration Guide

This guide explains how to migrate the NFL Trivia Game frontend to use the consolidated backend.

## Quick Start

### 1. Environment Configuration

Create a `.env` file in the `NFL-Trivia-Game` directory:

```bash
VITE_API_URL=your-backend-url
```

**Examples:**
- Local development: `VITE_API_URL=http://localhost:8080`
- Production (Railway): `VITE_API_URL=https://your-app.railway.app`
- Production (Render): `VITE_API_URL=https://your-app.onrender.com`

### 2. API Endpoint Updates

The following API endpoints have been updated:

**Old Endpoint:**
```javascript
fetch('/api/players', { ... })
```

**New Endpoint:**
```javascript
fetch(`${import.meta.env.VITE_API_URL}/api/trivia/players`, { ... })
```

### 3. Available Endpoints

#### POST `/api/trivia/players`
Save player data after game completion.

**Request Body:**
```json
{
  "name": "Player Name",
  "email": "player@example.com",
  "team": "Team Name",
  "score": 100
}
```

**Response:**
```json
{
  "message": "Player saved successfully"
}
```

#### GET `/api/trivia/leaderboard?limit=10`
Get top players from the trivia game.

**Response:**
```json
{
  "leaderboard": [
    {
      "name": "Player Name",
      "team": "Team Name",
      "score": 100,
      "created_at": "2025-11-19T00:00:00.000Z"
    }
  ]
}
```

## Testing

1. Start the backend server:
   ```bash
   cd nfl-teamates-game/backend
   npm install
   npm start
   ```

2. Start the frontend:
   ```bash
   cd NFL-Trivia-Game
   npm install
   npm run dev
   ```

3. Test the game flow and verify data is being saved to the backend.

## Deployment

See the main [DEPLOYMENT.md](/DEPLOYMENT.md) in the root directory for detailed deployment instructions.

## Troubleshooting

### CORS Errors
If you see CORS errors, make sure the backend has CORS enabled and your frontend URL is whitelisted.

### Environment Variables Not Loading
- Make sure the `.env` file is in the correct directory
- Restart your development server after changing `.env`
- Vite requires variables to be prefixed with `VITE_`

### API Calls Failing
- Check that the backend is running and accessible
- Verify the `VITE_API_URL` is correct
- Check browser console for error messages
- Verify the backend database is properly initialized
