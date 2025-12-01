# Landing Page Integration Guide

This document explains how the NFL GameHub landing page has been integrated into the NFL-Teammates-Game repository.

## Overview

The landing page provides a unified entry point for all three NFL games in this repository:
1. **Long Drive** (Trivia Game)
2. **Huddle** (Teammates Game)
3. **Journeyman**

## Directory Structure

```
NFL-Teammates-Game/
├── landing-page/              # Main landing page application
│   ├── public/
│   │   ├── Shield.svg        # NFL logo
│   │   ├── LongDrive.png     # Game thumbnails
│   │   ├── Huddle.png
│   │   ├── Journeyman.png
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Landing.js     # Main landing page
│   │   │   ├── Landing.css
│   │   │   ├── GameSelector.js  # Game selection screen
│   │   │   └── GameSelector.css
│   │   ├── hooks/
│   │   │   └── usePlayerStats.js  # Player stats tracking
│   │   ├── fonts/
│   │   │   ├── Supercharge3D.otf
│   │   │   └── Supercharge.otf
│   │   ├── App.js             # Main router
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   └── README.md
├── nfl-trivia-game/           # Long Drive game
├── nfl-teammates-game/        # Huddle game
└── journeyman/                # Journeyman game
```

## How It Works

### Routing Structure

The landing page uses React Router to manage navigation:

```
/ (Landing Page)
  └── /games (Game Selector)
      ├── /trivia → Long Drive game
      ├── /teammates → Huddle game
      └── /journeyman → Journeyman game
```

### User Flow

1. User visits the root URL and sees the landing page with "GameHub" title
2. Clicks "Enter" button to navigate to `/games`
3. Game selector displays three game options as thumbnails
4. User selects a game and is routed to that game's application

## Development Setup

### Running the Landing Page

```bash
cd landing-page
npm install
npm start
```

This will start the landing page at http://localhost:3000

### Running Individual Games

Each game can still be run independently:

**Trivia Game:**
```bash
cd nfl-trivia-game
npm install
npm start
```

**Teammates Game:**
```bash
cd nfl-teammates-game
npm install
npm start
```

**Journeyman:**
```bash
cd journeyman
npm install
npm start
```

## Deployment Options

### Option 1: Monorepo Build (Recommended for simplicity)

Build all apps separately and use nginx or a similar proxy to route requests:

```bash
# Build landing page
cd landing-page && npm run build

# Build trivia game
cd ../nfl-trivia-game && npm run build

# Build teammates game
cd ../nfl-teammates-game && npm run build

# Build journeyman
cd ../journeyman && npm run build
```

Then configure your web server (nginx example):

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        root /path/to/landing-page/build;
        try_files $uri /index.html;
    }

    location /trivia {
        root /path/to/nfl-trivia-game/build;
        try_files $uri /index.html;
    }

    location /teammates {
        root /path/to/nfl-teammates-game/build;
        try_files $uri /index.html;
    }

    location /journeyman {
        root /path/to/journeyman/build;
        try_files $uri /index.html;
    }
}
```

### Option 2: Separate Deployments

Deploy each game separately and update the GameSelector.js to link to the deployed URLs:

```javascript
const games = [
  { title: 'Long Drive', image: '/LongDrive.png', url: 'https://trivia.yourdomain.com', external: true },
  { title: 'Huddle', image: '/Huddle.png', url: 'https://teammates.yourdomain.com', external: true },
  { title: 'Journeyman', image: '/Journeyman.png', url: 'https://journeyman.yourdomain.com', external: true },
];
```

### Option 3: Vercel Monorepo (Current Setup)

For Vercel deployment with the current structure:

1. Set the root directory to `landing-page` in Vercel settings
2. Deploy each game separately as individual Vercel projects
3. Update the game links in GameSelector.js to point to the deployed game URLs

## Features

### Player Stats Tracking

The landing page includes a privacy-conscious player stats tracking system using localStorage:

- **Total Days Played**: Tracks unique days the user has visited
- **Current Streak**: Tracks consecutive days of play
- **Games Played**: Tracks how many times each game has been played
- **Social Shares**: Tracks social media shares by platform

### Theming

The landing page features a retro arcade theme with:
- Football pattern background
- Neon glow effects on text
- Smooth transitions and hover effects
- Custom "Supercharge 3D" font

## Customization

### Adding New Games

To add a new game to the selector:

1. Add the game thumbnail to `landing-page/public/`
2. Update `GameSelector.js`:

```javascript
const games = [
  { title: 'Long Drive', image: '/LongDrive.png', path: '/trivia' },
  { title: 'Huddle', image: '/Huddle.png', path: '/teammates' },
  { title: 'Journeyman', image: '/Journeyman.png', path: '/journeyman' },
  { title: 'New Game', image: '/NewGame.png', path: '/newgame' }, // Add here
];
```

3. Add route in `App.js`:

```javascript
<Route path="/newgame" element={<NewGameApp />} />
```

### Updating Styles

- Landing page styles: `landing-page/src/components/Landing.css`
- Game selector styles: `landing-page/src/components/GameSelector.css`
- Global styles: `landing-page/src/index.css`

## Source

The landing page was integrated from the [NFL-GameHub repository](https://github.com/JKempczinski27/NFL-GameHub.git) and adapted to work with the three games in this repository.

## Notes

- Each game maintains its own dependencies and build configuration
- The landing page serves as a unified entry point but doesn't bundle the games together
- For production, consider using a reverse proxy or CDN to route between applications
- Player stats are stored locally and don't require a backend
