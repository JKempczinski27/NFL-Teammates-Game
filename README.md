# 🏈 NFL Games Hub

A monorepo containing multiple NFL-themed games with a centralized PostgreSQL backend.

## 📁 Repository Structure

```
NFL-Teammates-Game/
├── landing-page/                   # Main landing page / game selector
│   ├── src/                       # React components
│   ├── public/                    # Static assets & game thumbnails
│   └── package.json               # Landing page dependencies
├── games/                          # All game applications
│   ├── nfl-teammates-game/        # NFL Teammates guessing game
│   ├── journeyman/                # Journeyman NFL player game
│   └── nfl-trivia-game/           # NFL Trivia game with 3 difficulty modes
├── backend/                        # Shared backend API server
│   ├── server.js                  # Main API server
│   ├── schema.sql                 # Database schema
│   ├── initDatabase.js            # Database initialization script
│   ├── onetrust-config.js         # OneTrust shared configuration
│   ├── useOneTrust.js             # OneTrust React hook
│   ├── DATABASE.md                # Database documentation
│   └── package.json               # Backend dependencies
├── package.json                    # Monorepo root package.json
├── README.md                       # This file
└── ONETRUST.md                     # OneTrust integration guide
```

## 🏠 Landing Page

The landing page serves as the main entry point for the NFL Games Hub, allowing users to select which game they want to play.

**Features:**
- Beautiful retro-arcade style interface with NFL branding
- Game thumbnails with descriptions
- Automatic music playback (Heavy Action theme)
- Links to both local games and external deployments
- Responsive design
- OneTrust cookie consent integration

**Directory:** `landing-page/`
**Tech Stack:** React (Create React App) with React Router
**Default Port:** http://localhost:3002 (different from games to avoid conflicts)

## 🎮 Games

### 1. NFL Teammates Game
A game where players identify common teammates between NFL players.

**Directory:** `games/nfl-teammates-game/`
**Tech Stack:** React (Create React App)

### 2. Journeyman
An NFL-themed player guessing game with comprehensive tracking and analytics.

**Directory:** `games/journeyman/`
**Tech Stack:** React (Create React App)

### 3. NFL Trivia Game
A comprehensive NFL trivia game featuring three difficulty modes:
- **Hand-off** (Easy) - Basic NFL knowledge questions
- **Check-Down** (Medium) - Intermediate trivia
- **Long Drive** (Hard) - Advanced NFL history and stats

Includes team selection, playmaker selection, and score tracking with social sharing capabilities.

**Directory:** `games/nfl-trivia-game/`
**Tech Stack:** React (Vite)

## 🗄️ Shared Backend

The backend serves all three games with a centralized PostgreSQL database containing:

### Database Tables:
- **players** - NFL player information
- **teams** - NFL team data (32 teams pre-populated)
- **team_relationships** - Player-team associations
- **questions** - Game questions
- **question_players** - Links players to questions
- **user_stats** - User session statistics

### API Endpoints:
- `GET /health` - Health check
- `GET /api/players` - Get all players
- `GET /api/players/:id` - Get player by ID
- `POST /api/players` - Add new player
- `GET /api/questions/random` - Get random question
- `POST /api/questions` - Create question
- `GET /api/stats/:sessionId` - Get user stats
- `POST /api/stats` - Update user stats
- `POST /save-player` - Save player game session
- `GET /api/teams` - Get all teams

**Documentation:** See `backend/DATABASE.md` for detailed schema documentation

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 8.0.0
- PostgreSQL database (hosted on Railway)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/JKempczinski27/NFL-Teammates-Game.git
   cd NFL-Teammates-Game
   ```

2. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

   Or install individually:
   ```bash
   # Landing Page
   cd landing-page && npm install

   # Backend
   cd backend && npm install

   # NFL Teammates Game
   cd games/nfl-teammates-game && npm install

   # Journeyman Game
   cd games/journeyman && npm install

   # NFL Trivia Game
   cd games/nfl-trivia-game && npm install
   ```

3. **Set up environment variables:**

   **Backend:** Create `.env` file in the `backend/` directory:
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   PORT=3001
   NODE_ENV=development
   ```

   **OneTrust (Optional):** For cookie consent management, create `.env` files for each application:

   Copy the `.env.example` files and add your OneTrust Domain Script ID:
   ```bash
   # Landing page
   cp landing-page/.env.example landing-page/.env

   # Games
   cp games/nfl-teammates-game/.env.example games/nfl-teammates-game/.env
   cp games/journeyman/.env.example games/journeyman/.env
   cp games/nfl-trivia-game/.env.example games/nfl-trivia-game/.env
   ```

   Then edit each `.env` file and replace `YOUR-DOMAIN-ID-HERE` with your actual OneTrust Domain Script ID.

   **Note:** OneTrust is optional for development. Applications will work without it. See [ONETRUST.md](./ONETRUST.md) for detailed setup instructions.

4. **Initialize the database:**
   ```bash
   npm run init-db
   ```

### Running the Complete Hub (Recommended)

For the full experience with the landing page game selector:

```bash
# Terminal 1: Start shared backend
npm run start:backend

# Terminal 2: Start landing page
npm run start:landing

# Terminal 3: Start NFL Teammates game
npm run start:teammates

# Terminal 4: Start Journeyman game (optional, on same port as teammates)
# Only run one Create React App game at a time on port 3000

# Terminal 5: Start NFL Trivia game
npm run start:trivia
```

Then visit:
- **Landing Page:** http://localhost:3002 (main entry point)
- **NFL Teammates:** http://localhost:3000
- **Journeyman:** http://localhost:3000 (run separately from teammates)
- **NFL Trivia:** http://localhost:5173

**Note:** The landing page runs on port 3002 to avoid conflicts with the games on port 3000.

### Running Individual Games

#### Option 1: Run NFL Teammates Game
```bash
# Terminal 1: Start backend
npm run start:backend

# Terminal 2: Start NFL Teammates game
npm run start:teammates
```

Then visit: http://localhost:3000

#### Option 2: Run Journeyman Game
```bash
# Terminal 1: Start backend
npm run start:backend

# Terminal 2: Start Journeyman game
npm run start:journeyman
```

Then visit: http://localhost:3000

#### Option 3: Run NFL Trivia Game
```bash
# Terminal 1: Start backend
npm run start:backend

# Terminal 2: Start NFL Trivia game
npm run start:trivia
```

Then visit: http://localhost:5173 (Vite default port)

## 📜 Available Scripts

### Root Level Scripts

npm run start:landing          # Start the landing page / game selector
npm run start:backend          # Start the shared backend server
npm run start:teammates        # Start NFL Teammates game
npm run start:journeyman       # Start Journeyman game
npm run start:trivia           # Start NFL Trivia game
npm run install:all            # Install dependencies for all projects
npm run init-db                # Initialize the database
npm run dev:teammates          # Run backend + teammates concurrently
npm run dev:journeyman         # Run backend + journeyman concurrently
npm run dev:trivia             # Run backend + trivia concurrently
npm run build:landing          # Build landing page
npm run build:teammates        # Build NFL Teammates game
npm run build:journeyman       # Build Journeyman game
npm run build:trivia           # Build NFL Trivia game

### Backend Scripts

```bash
cd backend
npm start                      # Start the backend server
npm run init-db                # Initialize the database
```

### Game-Specific Scripts

```bash
# For nfl-teammates-game and journeyman (Create React App)
cd games/nfl-teammates-game    # or cd games/journeyman
npm start                      # Start development server
npm run build                  # Build for production
npm test                       # Run tests

# For nfl-trivia-game (Vite)
cd games/nfl-trivia-game
npm run dev                    # Start development server
npm run build                  # Build for production
npm run preview                # Preview production build
```

## 🔧 Development

### Adding a New Game

1. Create a new directory under `games/`
2. Initialize your React app
3. Update the game's `package.json` to proxy to the shared backend:
   ```json
   {
     "proxy": "http://localhost:3001"
   }
   ```
4. Use the shared API endpoints from `backend/server.js`
5. Update root `package.json` with new game scripts

### Modifying the Database

1. Update `backend/schema.sql` with your changes
2. Run `npm run init-db` to reinitialize the database
3. Update `backend/DATABASE.md` documentation

### Adding New API Endpoints

1. Edit `backend/server.js`
2. Add your endpoint following the existing patterns
3. Test with both games to ensure compatibility

## 🏗️ Architecture

### Basic Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Users/Players                        │
└─────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
    │ Teammates │   │ Journeyman│   │   Trivia  │
    │   Game    │   │   Game    │   │   Game    │
    │  (React)  │   │  (React)  │   │  (Vite)   │
    └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
                ┌──────────▼──────────┐
                │  Shared Backend API │
                │   (Express + pg)    │
                └──────────┬──────────┘
                           │
                ┌──────────▼──────────┐
                │  PostgreSQL Database│
                │   (Railway hosted)  │
                └─────────────────────┘
```

### Horizontally Scaled Architecture

```
┌──────────────────────────────────────┐
│          Users/Players               │
└──────────────┬───────────────────────┘
               │
    ┌──────────▼──────────┐
    │  Load Balancer      │  (NGINX/ALB)
    │  (Port 80/443)      │
    └──────────┬──────────┘
               │
    ┌──────────┼───────────────┐
    │          │               │
┌───▼────┐ ┌───▼────┐  ┌──────▼───┐
│Backend1│ │Backend2│  │Backend N │  (Scale to N instances)
│Node.js │ │Node.js │  │Node.js   │
└───┬────┘ └───┬────┘  └────┬─────┘
    │          │            │
    └──────────┼────────────┘
               │
      ┌────────┴────────┐
      │                 │
  ┌───▼────┐     ┌──────▼─────┐
  │ Redis  │     │ PostgreSQL │
  │ Cache  │     │  Database  │
  └────────┘     └────────────┘
```

## ⚡ Horizontal Scaling

The backend is designed to scale horizontally to handle increased load. Key features:

- **Stateless Backend**: Can run multiple instances simultaneously
- **Redis Caching**: Distributed caching across all instances
- **Rate Limiting**: Shared rate limiting via Redis
- **Connection Pooling**: Optimized database connections
- **Health Checks**: Load balancer-ready health endpoints
- **Monitoring**: Built-in metrics and monitoring endpoints

### Quick Start with Docker Compose

Run 3 backend instances with load balancing:

```bash
# Start all services (3 backends + Redis + Postgres + NGINX)
docker-compose up -d

# Scale to 5 backend instances
docker-compose up -d --scale backend=5

# View status
docker-compose ps

# Access via load balancer
curl http://localhost/health
```

### Capacity Planning

| Configuration | Concurrent Users | Estimated Cost/Month |
|--------------|-----------------|----------------------|
| 1 instance | ~100-200 | $15-30 |
| 3 instances (Docker Compose) | ~450-600 | $50-80 |
| 5 instances | ~750-1,000 | $80-120 |
| 10 instances | ~1,500-2,000 | $150-250 |

### Scaling Options

**Vertical Scaling** (Single Instance):
```bash
# Use Node.js clustering to utilize all CPU cores
cd backend
export ENABLE_CLUSTERING=true
npm run start:cluster
```

**Horizontal Scaling** (Multiple Instances):
```bash
# Install dependencies for scaling
cd backend
npm install redis rate-limit-redis express-rate-limit

# Set up Redis
export REDIS_URL=redis://localhost:6379

# Start multiple instances (in separate terminals or use Docker Compose)
PORT=3001 npm start &
PORT=3002 npm start &
PORT=3003 npm start &

# Configure load balancer (see backend/nginx.conf)
```

For detailed instructions, see [SCALING.md](./SCALING.md).

## 🌐 Deployment

### Backend Deployment (Railway)

The backend is configured for Railway deployment:

1. Push to GitHub
2. Connect Railway to your repository
3. Set environment variables in Railway dashboard
4. Deploy backend from `backend/` directory

### Frontend Deployment

Each game can be deployed separately:

**NFL Teammates Game:**
- Build: `cd games/nfl-teammates-game && npm run build`
- Deploy the `build/` folder to your hosting service

**Journeyman Game:**
- Build: `cd games/journeyman && npm run build`
- Deploy the `build/` folder to your hosting service

**NFL Trivia Game:**
- Build: `cd games/nfl-trivia-game && npm run build`
- Deploy the `dist/` folder to your hosting service

Update the `FRONTEND_URL` environment variable in the backend to allow CORS.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test with all games to ensure compatibility
4. Submit a pull request

## 📝 License

This project is private and proprietary.

## 🐛 Issues

Report issues at: https://github.com/JKempczinski27/NFL-Teammates-Game/issues

## 📧 Contact

For questions or support, please open an issue on GitHub.