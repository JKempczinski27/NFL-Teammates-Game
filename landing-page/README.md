# NFL GameHub Landing Page

This is the main landing page that serves as a game selector for all NFL games in this repository.

## Games Available

1. **Long Drive** (Trivia Game) - `/trivia`
2. **Huddle** (Teammates Game) - `/teammates`
3. **Journeyman** - `/journeyman`

## Running the Landing Page

```bash
cd landing-page
npm install
npm start
```

The landing page will open at http://localhost:3000

## Structure

- `/` - Landing page with "Enter" button
- `/games` - Game selector showing all available games
- `/trivia` - Long Drive trivia game
- `/teammates` - Huddle teammates guessing game
- `/journeyman` - Journeyman game

## Integration Notes

The landing page integrates with the three games in this repository:
- `nfl-trivia-game`
- `nfl-teammates-game`
- `journeyman`

Each game runs as a separate React app but is accessible through the unified landing page routing.

## Deployment

For deployment, you can:
1. Build the landing page: `npm run build`
2. Configure your server to route `/trivia`, `/teammates`, and `/journeyman` to their respective game applications
3. Or deploy as a monorepo with all games bundled together

## Features

- **Player Stats Tracking**: Tracks days played, streaks, and games completed using localStorage
- **Responsive Design**: Works on desktop and mobile devices
- **Retro Arcade Theme**: Football-themed background with neon effects
