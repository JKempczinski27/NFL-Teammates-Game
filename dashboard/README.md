# NFL Games Player Dashboard

A standalone web dashboard for viewing and exporting player data from the NFL Games backend.

## Features

- 📊 **Real-time Data Loading** - Connect to your backend API and load player data instantly
- 📈 **Statistics Overview** - View total players and breakdown by game type
- 🔍 **Advanced Filtering** - Filter by game type, search by name/email, filter by date range
- 📥 **Export Options** - Export filtered data to CSV or JSON format
- 🎨 **Clean UI** - Modern, responsive interface that works on desktop and mobile
- 💾 **Auto-save Settings** - Remembers your API URL for convenience

## Quick Start

### Option 1: Open Directly in Browser

1. Simply open `index.html` in your web browser
2. Enter your backend API URL (e.g., `http://localhost:8080` or `https://your-api.railway.app`)
3. Click "Load Data"
4. View, filter, and export your player data

### Option 2: Serve with a Local Server

```bash
# Using Python
cd dashboard
python3 -m http.server 3000

# Using Node.js (http-server)
cd dashboard
npx http-server -p 3000

# Using PHP
cd dashboard
php -S localhost:3000
```

Then open: `http://localhost:3000`

## API Requirements

The dashboard expects your backend to have the following endpoint:

### GET /api/players

Returns all players with their statistics.

**Response Format:**
```json
{
  "success": true,
  "count": 10,
  "players": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "game_type": "teammates",
      "games_played": ["teammates", "journeyman"],
      "total_sessions": 5,
      "favorite_team": "Chiefs",
      "last_activity_at": "2025-12-03T10:30:00Z",
      "created_at": "2025-12-01T08:00:00Z"
    }
  ]
}
```

### Health Check (Optional)

**GET /health** - Used to verify backend connection

## Configuration

### Backend API URL

The dashboard will prompt you for your backend API URL. Common examples:

- **Local development:** `http://localhost:8080`
- **Railway:** `https://your-app.railway.app`
- **Render:** `https://your-app.onrender.com`
- **Vercel:** `https://your-app.vercel.app`

The URL is automatically saved in your browser's localStorage for convenience.

## Features Guide

### Statistics Cards

View at-a-glance metrics:
- Total unique players
- Players by game type (Teammates, Journeyman, Trivia)

### Filtering

- **Game Type Filter:** Show only players who have played a specific game
- **Search:** Filter by player name or email address
- **Date Range:** Filter players by creation date

### Export Options

- **CSV Export:** Perfect for Excel, Google Sheets, or other spreadsheet tools
- **JSON Export:** Machine-readable format for further processing or backup

### Data Displayed

The table shows:
- Player name
- Email address
- Primary game type
- All games played (as badges)
- Total sessions
- Favorite team
- Last activity timestamp
- Account creation date

## CORS Configuration

If you're running the dashboard on a different domain/port than your backend, you may need to enable CORS on your backend server.

Your backend already has CORS enabled if you're using the consolidated backend (`backend/index.js`).

## Security Notes

⚠️ **Important:** This dashboard makes direct API calls from the browser to your backend. Consider:

1. **Authentication:** Add API key authentication if needed
2. **Rate Limiting:** Your backend has rate limiting enabled (100 requests per 15 minutes)
3. **Access Control:** Only share the dashboard with authorized personnel
4. **HTTPS:** Use HTTPS in production for secure data transmission

### Adding Authentication (Optional)

To add simple token authentication, modify the dashboard's `loadData()` function:

```javascript
const response = await fetch(`${apiUrl}/api/players`, {
    headers: {
        'Authorization': 'Bearer YOUR_SECRET_TOKEN'
    }
});
```

And update your backend to verify the token.

## Troubleshooting

### "Backend server is not responding"

- Check that your backend is running
- Verify the API URL is correct (no trailing slash)
- Check for CORS issues in browser console
- Ensure the backend has a `/health` endpoint

### "Failed to load data"

- Verify the `/api/players` endpoint exists and returns data
- Check browser console for detailed error messages
- Ensure your database is populated with player data

### No players showing

- Check if filters are applied (click "Clear Filters")
- Verify players exist in your database
- Check the API response in browser DevTools Network tab

## Deployment Options

### Deploy as Static Site

You can deploy this dashboard to any static hosting service:

- **Netlify:** Drag and drop the `dashboard` folder
- **Vercel:** Connect your GitHub repo
- **GitHub Pages:** Push to a `gh-pages` branch
- **AWS S3:** Upload as static website
- **Cloudflare Pages:** Connect and deploy

No build process required - it's pure HTML, CSS, and vanilla JavaScript!

## Development

The dashboard is built with:
- Pure HTML, CSS, and JavaScript (no frameworks)
- Responsive design for mobile and desktop
- Modern ES6+ JavaScript
- Local storage for settings persistence

To modify:
1. Edit `index.html`
2. Refresh your browser
3. No build step needed!

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

Part of the NFL Games project.
