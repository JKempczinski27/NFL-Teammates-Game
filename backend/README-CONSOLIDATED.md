# NFL Games Consolidated Backend (v2.0.0)

## Overview

This is a **consolidated backend** that serves **three NFL games** from a single unified API:

1. **NFL Teammates Game** - Guess NFL player connections
2. **Journeyman** - NFL career journey game
3. **NFL Trivia Game** - General NFL trivia

## 🎯 Features

### Shared Infrastructure
- ✅ **Unified PostgreSQL Database** - All games share the same database with game-type separation
- ✅ **Event Tracking** - Comprehensive analytics for all three games
- ✅ **Player Management** - Centralized player database
- ✅ **S3 Integration** - Shared image upload functionality
- ✅ **GDPR Compliance** - Data protection and consent management
- ✅ **Performance Optimized** - Redis caching, connection pooling, compression
- ✅ **Security** - Rate limiting, helmet, input validation, CORS
- ✅ **Monitoring** - Sentry error tracking support

### Game-Specific Features
- **NFL Teammates** - Session tracking, question analytics, share metrics
- **Journeyman** - Game submissions, leaderboards, advanced security (WAF)
- **NFL Trivia** - Player/team associations, score tracking

## 📁 Project Structure

```
nfl-teamates-game/backend/
├── index.js                    # Main server file (consolidated)
├── package.json                # All dependencies merged
├── schema-consolidated.sql     # Unified database schema
├── .env.consolidated           # Environment variables template
├── routes/
│   ├── track.js               # Event tracking (all games)
│   ├── players.js             # Player management (all games)
│   ├── game-data.js           # Game submissions (Journeyman + others)
│   ├── data-protection.js     # GDPR compliance
│   ├── analytics.js           # Analytics endpoints
│   └── s3-management.js       # S3 file management
├── config/
├── middleware/
└── tests/
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd nfl-teamates-game/backend
npm install
```

### 2. Set Environment Variables

Copy `.env.consolidated` to `.env` and configure:

```bash
cp .env.consolidated .env
# Edit .env with your values
```

**Required variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 8080)
- `ADMIN_API_KEY` - Secure random string

### 3. Run Database Migrations

```bash
# Using npm script
npm run init-db-consolidated

# Or directly with psql
psql $DATABASE_URL -f schema-consolidated.sql
```

### 4. Start the Server

```bash
npm start
```

The server will start on `http://localhost:8080`

## 📡 API Endpoints

### Health & Info
- `GET /` - API information
- `GET /health` - Health check

### Player Management (All Games)
- `POST /api/players` - Create player
- `GET /api/players` - Get all players
- `GET /api/players/:email` - Get player by email
- `PUT /api/players/:email` - Update player

### Event Tracking (All Games)
- `POST /api/track` - Track game events
- `GET /api/track` - Get tracking info
- `GET /api/track/analytics/:sessionId` - Get session analytics

### Game Data (Journeyman & Others)
- `POST /api/game-data` - Submit game completion
- `GET /api/game-data/leaderboard/:gameType` - Get leaderboard
- `GET /api/game-data/stats/:gameType` - Get game statistics

### Data Protection (GDPR)
- `GET /api/data-protection/health` - Service health
- `GET /api/data-protection/export/:userId` - Export user data
- `DELETE /api/data-protection/delete/:userId` - Delete user data
- `GET /api/data-protection/consent/:userId` - Get consents
- `POST /api/data-protection/consent/:userId` - Record consent
- `DELETE /api/data-protection/consent/:userId/:consentType` - Revoke consent

### Analytics
- `GET /api/analytics` - Analytics dashboard data
- `GET /api/analytics/game-stats/:gameType` - Game-specific stats

### S3 Management
- `POST /api/s3/upload` - Upload file to S3
- `GET /api/s3/presigned-url` - Get presigned URL

## 🎮 Game Type Parameter

All tracking and analytics endpoints accept a `gameType` parameter:

- `teammates` - NFL Teammates Game
- `journeyman` - Journeyman Game
- `trivia` - NFL Trivia Game

Example tracking request:

```json
POST /api/track
{
  "eventType": "session_start",
  "sessionId": "abc123",
  "gameType": "journeyman",
  "eventData": {}
}
```

## 🗄️ Database Schema

The consolidated schema includes:

### Shared Tables
- `events` - All game events with game_type field
- `user_sessions` - Session tracking for all games
- `question_analytics` - Question performance across games
- `share_analytics` - Share metrics by game
- `players` - Unified player database

### Game-Specific Tables
- `game_submissions` - Game completion data
- `user_consents` - GDPR consent records
- `data_deletion_requests` - Data deletion tracking

### Analytics Views
- `game_session_stats` - Session statistics by game
- `question_difficulty_stats` - Question difficulty by game
- `share_platform_stats` - Share platform usage
- `daily_active_users` - DAU by game type

## 🔒 Security Features

- **Rate Limiting** - 100 requests per 15 minutes per IP
- **Write Limiting** - 20 write requests per 15 minutes
- **Helmet** - Security headers
- **Input Validation** - Email validation, type checking
- **SQL Injection Prevention** - Parameterized queries
- **CORS** - Configurable cross-origin requests
- **CSRF Protection** - Available for session-based auth
- **XSS Protection** - Input sanitization

## 📊 Monitoring & Observability

### Sentry Integration
Set `SENTRY_DSN` environment variable to enable error tracking:

```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### Redis Caching
Set `REDIS_URL` for performance improvements:

```bash
REDIS_URL=redis://default:password@host:port
```

### Logging
Server logs include:
- Request logging
- Error tracking
- Database connection status
- Cache hits/misses
- Rate limit violations

## 🚢 Deployment

### Railway (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway add --database postgresql
railway up

# Set environment variables in Railway dashboard
# Run migrations
railway run psql $DATABASE_URL -f schema-consolidated.sql
```

### Render

1. Create Web Service from GitHub
2. Set Root Directory: `nfl-teamates-game/backend`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add PostgreSQL database
6. Set environment variables
7. Run migrations via Shell

See `QUICK_DEPLOY.md` for detailed deployment instructions.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:security
npm run test:load

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 📦 Dependencies

### Core
- `express` - Web framework
- `pg` - PostgreSQL client
- `cors` - CORS middleware
- `dotenv` - Environment variables

### Performance
- `compression` - Response compression
- `ioredis` - Redis caching
- `express-rate-limit` - Rate limiting

### Security
- `helmet` - Security headers
- `validator` - Input validation
- `xss-clean` - XSS protection
- `express-mongo-sanitize` - NoSQL injection prevention
- `hpp` - Parameter pollution protection

### AWS
- `@aws-sdk/client-s3` - S3 client
- `@aws-sdk/s3-request-presigner` - S3 presigned URLs
- `multer` - File upload handling

### Authentication
- `jsonwebtoken` - JWT tokens
- `bcryptjs` - Password hashing
- `express-session` - Session management

### Monitoring
- `@sentry/node` - Error tracking
- `axios` - HTTP client for external APIs

## 🔧 Configuration

### Environment Variables

See `.env.consolidated` for all available options.

**Required:**
- `DATABASE_URL`
- `PORT`
- `ADMIN_API_KEY`

**Optional but Recommended:**
- `REDIS_URL` - Caching
- `SENTRY_DSN` - Error tracking
- `AWS_*` - S3 uploads

### Database Connection Pool

Default configuration:
- Max connections: 20
- Min connections: 5
- Idle timeout: 30s
- Connection timeout: 10s

## 📈 Performance Optimization

1. **Enable Redis** - Significant performance boost for repeated queries
2. **Connection Pooling** - Reuses database connections
3. **Compression** - Reduces response sizes
4. **Static Asset Caching** - 1-year cache for static files
5. **Rate Limiting** - Prevents abuse and overload

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL -c "SELECT version();"

# Check pool status
curl http://localhost:8080/api/db-test
```

### Redis Connection Issues
- Redis is optional - server works without it
- Check `REDIS_URL` format
- Verify Redis server is running

### Migration Failures
```bash
# Drop all tables and recreate
psql $DATABASE_URL -f schema-consolidated.sql
```

## 📝 Migration from Separate Backends

If you're migrating from the three separate backends:

1. **Export existing data** from each game's database
2. **Add `game_type` field** to exported data
3. **Import into consolidated database**
4. **Update frontend API endpoints** to point to new server
5. **Test each game** individually

## 🤝 Contributing

When adding new features:

1. Add routes to appropriate file in `routes/`
2. Update database schema in `schema-consolidated.sql`
3. Add tests in `tests/`
4. Update this README
5. Include `gameType` parameter for game-specific features

## 📄 License

MIT

## 🆘 Support

- **Documentation**: See deployment guides in root directory
- **Issues**: Open an issue on GitHub
- **Logs**: Check Railway/Render dashboard logs

---

**Version:** 2.0.0 (Consolidated)
**Games Supported:** NFL Teammates, Journeyman, NFL Trivia
**Last Updated:** 2025-11-19
