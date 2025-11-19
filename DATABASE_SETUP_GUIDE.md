# PostgreSQL Database Setup Guide
**NFL Teammates Game**

This guide explains how to set up and use PostgreSQL for the NFL Teammates Game project, both locally and on Railway.

## Table of Contents
- [Local Setup](#local-setup)
- [Railway Setup](#railway-setup)
- [Database Schema](#database-schema)
- [Verification](#verification)
- [Usage](#usage)

---

## Local Setup

### Prerequisites
- PostgreSQL 16+ installed
- Node.js installed
- Access to terminal/command line

### Quick Start

1. **Start PostgreSQL Server** (if not already running):
   ```bash
   pg_ctlcluster 16 main start
   ```

2. **Create Database and Tables**:
   ```bash
   # The database and tables are already created!
   # Database: nfl_teammates_game
   # Tables: players, player_updated
   ```

3. **Verify Setup**:
   ```bash
   node verify-db.js --local
   ```

4. **Configure Backend for Local Development**:
   ```bash
   cd nfl-teamates-game/backend
   cp .env.local .env
   npm start
   ```

### Database Credentials

**Local PostgreSQL:**
- Host: `localhost`
- Port: `5432`
- Database: `nfl_teammates_game`
- User: `postgres`
- Password: `postgres`

**Connection String:**
```
postgresql://postgres:postgres@localhost:5432/nfl_teammates_game
```

---

## Railway Setup

### Configuration

The Railway database is already configured in `nfl-teamates-game/backend/.env`:

```env
DATABASE_URL='postgresql://postgres:rYaxKDTGRwelTItjmNkjmutTnDZJCtvO@postgres-ulot.railway.internal:5432/railway'
PORT=5432
```

### Deploy to Railway

1. Push your code to the repository
2. Railway will automatically use the `.env` file for database connection
3. Run the schema creation (you may need to do this manually on Railway):
   ```bash
   node init-db.js --railway
   ```

### Verify Railway Database

Note: Railway database is only accessible from within Railway's network.

```bash
# This will only work when deployed to Railway
node verify-db.js --railway
```

---

## Database Schema

### Tables

#### `players` Table
Stores player information for game participants.

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| name | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

**Indexes:**
- `idx_players_email` on `email`
- `idx_players_created_at` on `created_at`

#### `player_updated` Table
Tracks player activity and events during gameplay.

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| session_id | VARCHAR(255) | |
| event_type | VARCHAR(100) | |
| event_data | JSONB | |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

**Indexes:**
- `idx_player_updated_session` on `session_id`
- `idx_player_updated_event_type` on `event_type`
- `idx_player_updated_created_at` on `created_at`

### Schema File

The complete schema is defined in `schema.sql` and can be run with:

```bash
psql -d nfl_teammates_game -f schema.sql
```

---

## Verification

### Scripts Available

1. **verify-db.js** - Comprehensive database verification
   ```bash
   # Verify local database
   node verify-db.js --local

   # Verify Railway database (only works when deployed)
   node verify-db.js --railway
   ```

2. **init-db.js** - Initialize/recreate database schema
   ```bash
   # Initialize local database
   node init-db.js --local

   # Initialize Railway database (only works when deployed)
   node init-db.js --railway
   ```

### Manual Verification

Connect to the local database:
```bash
psql -U postgres -d nfl_teammates_game
```

Check tables:
```sql
\dt                    -- List all tables
\d players             -- Describe players table
\d player_updated      -- Describe player_updated table
SELECT COUNT(*) FROM players;  -- Check row count
```

---

## Usage

### Local Development

1. **Start PostgreSQL** (if not running):
   ```bash
   pg_ctlcluster 16 main start
   ```

2. **Use local database configuration**:
   ```bash
   cd nfl-teamates-game/backend
   cp .env.local .env
   ```

3. **Start the backend**:
   ```bash
   npm install
   npm start
   ```

4. **Test the connection**:
   Visit: `http://localhost:8080/api/db-test`

### Production (Railway)

1. **Ensure `.env` has Railway credentials**:
   ```bash
   cd nfl-teamates-game/backend
   # Use the existing .env file (do not use .env.local)
   ```

2. **Deploy to Railway**:
   - Push code to your repository
   - Railway will automatically deploy
   - Database connection will use Railway's internal network

---

## Troubleshooting

### PostgreSQL Server Not Running

**Start the server:**
```bash
pg_ctlcluster 16 main start
```

**Check if running:**
```bash
pg_isready
```

**Check status:**
```bash
systemctl status postgresql  # or
pg_ctlcluster 16 main status
```

### Permission Denied Errors

**Fix ownership:**
```bash
sudo chown -R postgres:postgres /var/lib/postgresql/
sudo chown -R postgres:postgres /etc/postgresql/16/
sudo chown -R postgres:postgres /var/run/postgresql/
```

### Connection Refused

**Check if PostgreSQL is listening:**
```bash
netstat -an | grep 5432
```

**Check configuration:**
```bash
cat /etc/postgresql/16/main/postgresql.conf | grep listen_addresses
```

### Railway Connection Issues

Railway database uses an internal hostname that is **only accessible from within Railway's deployment environment**. You cannot connect to it from your local machine.

To verify Railway database:
1. Deploy your app to Railway
2. Add a verification endpoint in your backend
3. Access the endpoint via Railway's public URL

---

## Files Created

- `schema.sql` - Database schema definition
- `verify-db.js` - Database verification script
- `init-db.js` - Database initialization script
- `.env.local` - Local development environment configuration
- `DATABASE_VERIFICATION_REPORT.md` - Initial verification report
- `DATABASE_SETUP_GUIDE.md` - This file

---

## Summary

✓ **PostgreSQL 16** installed and running
✓ **Local database** `nfl_teammates_game` created
✓ **Tables** `players` and `player_updated` created with proper schema
✓ **Indexes** created for optimal performance
✓ **Verification scripts** available for testing
✓ **Environment configurations** for both local and Railway

**You're all set!** Your NFL Teammates Game database is ready for development.
