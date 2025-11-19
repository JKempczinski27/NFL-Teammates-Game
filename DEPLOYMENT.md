# Deployment Instructions

## Database Initialization

The tracking system requires database tables to be created before it can function. Follow these steps to initialize the database:

### Option 1: Railway CLI (Recommended for Production)

If you're deploying to Railway:

1. Install the Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Link to your project:
   ```bash
   railway link
   ```

4. Run the database initialization script:
   ```bash
   railway run node nfl-teamates-game/backend/initDB.js
   ```

### Option 2: Direct Connection (Development)

If you have direct database access:

1. Navigate to the backend directory:
   ```bash
   cd nfl-teamates-game/backend
   ```

2. Ensure dependencies are installed:
   ```bash
   npm install
   ```

3. Set up your `.env` file with the DATABASE_URL:
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   ```

4. Run the initialization script:
   ```bash
   node initDB.js
   ```

### Option 3: Manual SQL Execution

If you prefer to run SQL manually:

1. Connect to your PostgreSQL database using your preferred client (psql, pgAdmin, etc.)

2. Execute the contents of `nfl-teamates-game/backend/schema.sql`

## Verification

After initialization, verify that the tables were created:

```sql
\dt  -- In psql, list all tables

-- You should see:
-- user_sessions
-- game_sessions
-- question_attempts
-- user_engagement_events
-- daily_activity_summary
```

## Post-Deployment

1. **Test the tracking endpoint:**
   ```bash
   curl https://your-app-url.railway.app/api/track
   ```

   You should see:
   ```json
   {
     "status": "operational",
     "message": "Comprehensive tracking endpoint is active",
     "supportedEvents": [...]
   }
   ```

2. **Monitor the logs** to ensure tracking events are being saved successfully

3. **Check the database** after some users have played to verify data is being collected

## Troubleshooting

### Database Connection Fails

- Verify DATABASE_URL is correctly set in environment variables
- Ensure the database server is accessible from your deployment environment
- Check if SSL is required (the schema includes `ssl: { rejectUnauthorized: false }`)

### Tables Already Exist

The schema uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times. However, if you need to recreate tables:

```sql
DROP TABLE IF EXISTS question_attempts CASCADE;
DROP TABLE IF EXISTS user_engagement_events CASCADE;
DROP TABLE IF EXISTS daily_activity_summary CASCADE;
DROP TABLE IF EXISTS game_sessions CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
```

Then re-run the initialization script.

### Migration for Existing Data

If you already have data in other tables and need to migrate, create a migration script that:
1. Creates the new tracking tables
2. Migrates existing data (if applicable)
3. Sets up indexes and views

## Environment Variables

Ensure these environment variables are set in your Railway deployment:

- `DATABASE_URL`: PostgreSQL connection string (automatically set by Railway if using Railway PostgreSQL)
- `PORT`: Port for the Express server (automatically set by Railway)

## Monitoring

After deployment, monitor these metrics:

1. **Database Size**: Track growth to plan for scaling
2. **Query Performance**: Monitor slow queries in the `question_attempts` table
3. **Error Rates**: Check backend logs for tracking failures
4. **Data Integrity**: Periodically verify that all events are being captured

## Backup and Maintenance

1. **Regular Backups**: Ensure Railway's automatic backups are enabled
2. **Archive Old Data**: Consider archiving sessions older than 1 year to a separate table
3. **Index Maintenance**: Periodically analyze query patterns and add indexes as needed
4. **View Updates**: If you modify the schema, remember to recreate views

## Next Steps

After successful deployment:

1. Play the game yourself to generate test data
2. Run sample queries to verify tracking is working
3. Set up a dashboard or analytics tool to visualize the data
4. Share the game and start collecting real user data!
