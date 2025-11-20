# NFL Teammates Game - Complete Command Reference

## 📁 Project Structure

```
NFL-Teammates-Game/nfl-teamates-game/
├── src/                    # Frontend React code
├── public/                 # Static assets
├── backend/                # Backend Express server
│   ├── tests/             # Backend test suite
│   ├── routes/            # API routes
│   ├── index.js           # Main server file
│   ├── schema.sql         # Database schema
│   └── initDatabase.js    # DB initialization
├── api/                    # Serverless functions
├── package.json           # Frontend dependencies
└── backend/package.json   # Backend dependencies
```

---

## 🚀 Quick Start Commands

### First Time Setup

```bash
# Navigate to project root
cd /home/user/NFL-Teammates-Game/nfl-teamates-game

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

---

## 🎨 FRONTEND COMMANDS

### Location: `/home/user/NFL-Teammates-Game/nfl-teamates-game/`

### Development

```bash
# Start React development server (runs on http://localhost:3000)
npm start

# Build production frontend
npm run build

# Run frontend tests
npm test

# Run tests in watch mode
npm test -- --watch

# Eject from create-react-app (⚠️ irreversible)
npm run eject
```

### Testing

```bash
# Run React component tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- App.test.js
```

---

## 🖥️ BACKEND COMMANDS

### Location: `/home/user/NFL-Teammates-Game/nfl-teamates-game/backend/`

### Server Operations

```bash
# Navigate to backend
cd backend

# Start backend server (runs on http://localhost:8080)
npm start

# Start with specific port
PORT=3001 npm start

# Start in production mode
NODE_ENV=production npm start
```

### Database Operations

```bash
# Initialize database with schema (creates all tables)
npm run init-db

# Run database initialization directly
node initDatabase.js

# Connect to database (PostgreSQL CLI)
psql $DATABASE_URL
```

### Testing (Comprehensive Test Suite)

```bash
# Run ALL tests (unit + integration + security + load)
npm test

# Run tests with coverage report
npm run test:coverage

# View coverage report in browser
open coverage/lcov-report/index.html

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run specific test categories
npm run test:unit          # API endpoint tests only
npm run test:integration   # Database tests only
npm run test:security      # Security/attack tests only
npm run test:load          # Load/stress tests only

# Run individual test file
npx jest tests/unit/api.endpoints.test.js

# Run with verbose output
npm test -- --verbose

# Run specific test by name
npx jest --testNamePattern="should handle SQL injection"

# List all test files
npm test -- --listTests

# Run tests with debugging
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

## 🔄 FULL STACK COMMANDS

### Running Frontend + Backend Together

**Option 1: Two Terminal Windows**

```bash
# Terminal 1 - Backend
cd /home/user/NFL-Teammates-Game/nfl-teamates-game/backend
npm start

# Terminal 2 - Frontend
cd /home/user/NFL-Teammates-Game/nfl-teamates-game
npm start
```

**Option 2: Background Processes**

```bash
# Start backend in background
cd backend && npm start &

# Start frontend (foreground)
cd .. && npm start
```

---

## 🗄️ DATABASE COMMANDS

### PostgreSQL Operations

```bash
# Connect to database
psql $DATABASE_URL

# View all tables
psql $DATABASE_URL -c "\dt"

# View table schema
psql $DATABASE_URL -c "\d players"

# Count records in table
psql $DATABASE_URL -c "SELECT COUNT(*) FROM teams;"

# View all teams
psql $DATABASE_URL -c "SELECT * FROM teams ORDER BY name;"

# Drop all tables and recreate
cd backend
npm run init-db

# Backup database
pg_dump $DATABASE_URL > backup.sql

# Restore database
psql $DATABASE_URL < backup.sql
```

### Common Database Queries

```bash
# Check database connection
psql $DATABASE_URL -c "SELECT NOW();"

# View all players
psql $DATABASE_URL -c "SELECT * FROM players LIMIT 10;"

# View user stats
psql $DATABASE_URL -c "SELECT * FROM user_stats;"

# View questions
psql $DATABASE_URL -c "SELECT * FROM questions;"

# View team relationships
psql $DATABASE_URL -c "SELECT p.name, t.name as team FROM players p JOIN team_relationships tr ON p.id = tr.player_id JOIN teams t ON tr.team_id = t.id;"
```

---

## 🔧 DEVELOPMENT COMMANDS

### Code Quality

```bash
# Format code (if using Prettier)
npx prettier --write "src/**/*.{js,jsx,json,css}"
npx prettier --write "backend/**/*.js"

# Lint code (if using ESLint)
npx eslint src/
npx eslint backend/

# Type checking (if using TypeScript)
npx tsc --noEmit
```

### Debugging

```bash
# Start backend with Node debugger
node --inspect backend/index.js

# Start backend with breakpoint at start
node --inspect-brk backend/index.js

# Enable verbose logging
DEBUG=* npm start

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# View outdated packages
npm outdated
```

---

## 📦 BUILD & DEPLOYMENT COMMANDS

### Production Build

```bash
# Build frontend for production
npm run build

# Test production build locally
npx serve -s build

# Build and preview
npm run build && npx serve -s build
```

### Deployment

```bash
# Deploy to Railway (backend)
cd backend
git push railway main

# Deploy to Vercel (frontend)
vercel deploy

# Deploy to Netlify
netlify deploy --prod
```

---

## 🧪 TESTING COMMANDS (Detailed)

### Backend Test Suite

```bash
cd backend

# Quick test runs
npm test                    # All tests (~150 tests, 30-60 sec)
npm run test:unit          # Fastest (~30 tests, 5 sec)
npm run test:integration   # Medium (~50 tests, 20 sec)
npm run test:security      # Medium (~50 tests, 15 sec)
npm run test:load          # Slowest (~20 tests, 60 sec)

# Development testing
npm run test:watch         # Auto-rerun on file changes
npm test -- --watchAll     # Watch all files

# Coverage reports
npm run test:coverage      # Generate coverage report
open coverage/lcov-report/index.html  # View in browser

# Debugging tests
npm test -- --verbose                  # Detailed output
npm test -- --no-coverage             # Skip coverage
npm test -- --maxWorkers=1            # Run serially
npm test -- --detectOpenHandles       # Find hanging processes

# Specific test files
npx jest tests/unit/api.endpoints.test.js
npx jest tests/integration/database.test.js
npx jest tests/security/sql-injection.test.js
npx jest tests/load/stress.test.js

# Pattern matching
npm test -- --testPathPattern=integration  # All integration tests
npm test -- --testNamePattern="SQL"        # Tests with "SQL" in name
```

### Frontend Tests

```bash
cd /home/user/NFL-Teammates-Game/nfl-teamates-game

# Run React tests
npm test

# With coverage
npm test -- --coverage

# Update snapshots
npm test -- -u

# Watch mode
npm test -- --watch
```

---

## 🔍 DEBUGGING & TROUBLESHOOTING COMMANDS

### Check Server Status

```bash
# Check if backend is running
curl http://localhost:8080
curl http://localhost:8080/api/db-test

# Check if frontend is running
curl http://localhost:3000

# View running Node processes
ps aux | grep node

# Kill process on specific port
lsof -ti:8080 | xargs kill
lsof -ti:3000 | xargs kill
```

### View Logs

```bash
# Backend logs
cd backend && npm start

# With debug output
DEBUG=express:* npm start

# Frontend logs
npm start

# View Railway logs (production)
railway logs
```

### Network & Port Checks

```bash
# Check what's using port 8080
lsof -i :8080

# Check what's using port 3000
lsof -i :3000

# Test API endpoint
curl -X POST http://localhost:8080/api/player \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Player","email":"test@example.com"}'

# Test with verbose output
curl -v http://localhost:8080/api/db-test
```

---

## 🌐 API TESTING COMMANDS

### Using curl

```bash
# Health check
curl http://localhost:8080/

# Database test
curl http://localhost:8080/api/db-test

# Create player
curl -X POST http://localhost:8080/api/player \
  -H "Content-Type: application/json" \
  -d '{"name":"Tom Brady","email":"tom@example.com"}'

# Track event
curl -X POST http://localhost:8080/api/track \
  -H "Content-Type: application/json" \
  -d '{"event":"answer_submitted","sessionId":"abc123","data":{"correct":true}}'

# Get track status
curl http://localhost:8080/api/track
```

### Using HTTPie (if installed)

```bash
# Health check
http GET localhost:8080/

# Create player
http POST localhost:8080/api/player name="Tom Brady" email="tom@example.com"

# Track event
http POST localhost:8080/api/track event=test sessionId=abc123
```

---

## 📊 PERFORMANCE MONITORING COMMANDS

```bash
# Monitor memory usage
node --expose-gc backend/index.js

# Profile CPU usage
node --prof backend/index.js

# Analyze profile
node --prof-process isolate-*.log

# Monitor with clinic.js (if installed)
clinic doctor -- node backend/index.js
```

---

## 🛠️ UTILITY COMMANDS

### Package Management

```bash
# Update all dependencies
npm update

# Install specific package
npm install package-name

# Install as dev dependency
npm install --save-dev package-name

# Remove package
npm uninstall package-name

# Check for outdated packages
npm outdated

# Clean install (delete node_modules and reinstall)
rm -rf node_modules package-lock.json
npm install
```

### Git Commands

```bash
# View current branch
git branch

# Create new branch
git checkout -b feature-name

# Commit changes
git add .
git commit -m "Your message"

# Push to remote
git push -u origin branch-name

# Pull latest changes
git pull origin main
```

---

## 📋 ENVIRONMENT SETUP

### Backend Environment Variables

Create `backend/.env`:

```bash
DATABASE_URL=postgresql://user:password@host:port/database
PORT=8080
NODE_ENV=development
```

### Frontend Environment Variables

Create `.env`:

```bash
REACT_APP_API_URL=http://localhost:8080
REACT_APP_ENV=development
```

---

## 🎯 COMMON WORKFLOWS

### Starting Development

```bash
# 1. Start backend
cd /home/user/NFL-Teammates-Game/nfl-teamates-game/backend
npm start

# 2. In new terminal, start frontend
cd /home/user/NFL-Teammates-Game/nfl-teamates-game
npm start

# 3. Open browser to http://localhost:3000
```

### Running All Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests (in new terminal)
cd .. && npm test
```

### Making Changes

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes to code

# 3. Run tests
cd backend && npm test

# 4. Commit and push
git add .
git commit -m "Add my feature"
git push -u origin feature/my-feature
```

---

## 📚 HELP COMMANDS

```bash
# View available npm scripts
npm run

# View backend scripts
cd backend && npm run

# Jest help
npx jest --help

# Node help
node --help

# npm help
npm help

# View package info
npm info package-name
```

---

## 🚨 EMERGENCY COMMANDS

### Something's Broken

```bash
# Kill all Node processes
pkill -f node

# Clean everything and reinstall
rm -rf node_modules backend/node_modules package-lock.json backend/package-lock.json
npm install
cd backend && npm install && cd ..

# Reset database
cd backend && npm run init-db

# Clear Jest cache
npx jest --clearCache

# Clear React cache
rm -rf node_modules/.cache
```

### Port Already in Use

```bash
# Find and kill process on port 8080
lsof -ti:8080 | xargs kill -9

# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

---

## 📖 DOCUMENTATION COMMANDS

```bash
# View test documentation
cat backend/tests/README.md
cat backend/TESTING.md

# View database schema documentation
cat backend/DATABASE.md

# View main README
cat README.md
```

---

## 🎓 QUICK REFERENCE

### Most Used Commands

```bash
# Start everything for development
cd backend && npm start &              # Start backend
cd .. && npm start                     # Start frontend

# Run all tests
cd backend && npm test                 # Backend tests
cd .. && npm test                      # Frontend tests

# Build for production
npm run build                          # Build frontend

# Database operations
cd backend && npm run init-db         # Initialize database

# View test documentation
cat backend/TESTING.md                # Quick test reference
```

---

**Need more help?** Check the following files:
- `backend/tests/README.md` - Comprehensive test documentation
- `backend/TESTING.md` - Quick testing guide
- `backend/DATABASE.md` - Database schema documentation
- `README.md` - Project overview
