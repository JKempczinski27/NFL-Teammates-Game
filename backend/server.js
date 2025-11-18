/**
 * NFL Games Hub - Shared Backend Server
 * Serves multiple NFL-themed games with centralized PostgreSQL database
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Database connected successfully at', res.rows[0].now);
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// HEALTH & STATUS ENDPOINTS
// ============================================================================

app.get('/', (req, res) => {
  res.json({
    message: 'NFL Games Hub API',
    version: '1.0.0',
    status: 'running',
    games: ['nfl-teammates', 'journeyman']
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      connected: true,
      timestamp: result.rows[0].now,
      database: 'PostgreSQL'
    });
  } catch (err) {
    res.status(500).json({
      connected: false,
      error: err.message
    });
  }
});

// ============================================================================
// PLAYER ENDPOINTS
// ============================================================================

// Get all players
app.get('/api/players', async (req, res) => {
  try {
    const { limit = 100, offset = 0, search } = req.query;

    let query = 'SELECT * FROM players';
    let params = [];

    if (search) {
      query += ' WHERE name ILIKE $1';
      params.push(`%${search}%`);
      query += ` LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    } else {
      query += ' LIMIT $1 OFFSET $2';
      params.push(limit, offset);
    }

    const result = await pool.query(query, params);
    res.json({
      success: true,
      players: result.rows,
      count: result.rowCount
    });
  } catch (err) {
    console.error('Error fetching players:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch players'
    });
  }
});

// Get player by ID
app.get('/api/players/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM players WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    // Get team relationships
    const teams = await pool.query(`
      SELECT t.*, tr.year_start, tr.year_end
      FROM teams t
      JOIN team_relationships tr ON t.id = tr.team_id
      WHERE tr.player_id = $1
      ORDER BY tr.year_start DESC
    `, [id]);

    res.json({
      success: true,
      player: result.rows[0],
      teams: teams.rows
    });
  } catch (err) {
    console.error('Error fetching player:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player'
    });
  }
});

// Add new player
app.post('/api/players', async (req, res) => {
  try {
    const { name, position, teams, years_active, image_url } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Player name is required'
      });
    }

    const result = await pool.query(
      `INSERT INTO players (name, position, teams, years_active, image_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, position, teams, years_active, image_url]
    );

    res.status(201).json({
      success: true,
      player: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating player:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to create player'
    });
  }
});

// ============================================================================
// QUESTIONS ENDPOINTS
// ============================================================================

// Get random question
app.get('/api/questions/random', async (req, res) => {
  try {
    const { difficulty, category } = req.query;

    let query = 'SELECT * FROM questions';
    let params = [];
    let conditions = [];

    if (difficulty) {
      conditions.push(`difficulty = $${params.length + 1}`);
      params.push(difficulty);
    }

    if (category) {
      conditions.push(`category = $${params.length + 1}`);
      params.push(category);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY RANDOM() LIMIT 1';

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No questions found'
      });
    }

    // Get associated players
    const players = await pool.query(`
      SELECT p.*
      FROM players p
      JOIN question_players qp ON p.id = qp.player_id
      WHERE qp.question_id = $1
    `, [result.rows[0].id]);

    res.json({
      success: true,
      question: result.rows[0],
      players: players.rows
    });
  } catch (err) {
    console.error('Error fetching question:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch question'
    });
  }
});

// Create new question
app.post('/api/questions', async (req, res) => {
  const client = await pool.connect();

  try {
    const { answer, difficulty, category, player_ids } = req.body;

    if (!answer) {
      return res.status(400).json({
        success: false,
        error: 'Answer is required'
      });
    }

    await client.query('BEGIN');

    // Insert question
    const questionResult = await client.query(
      `INSERT INTO questions (answer, difficulty, category)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [answer, difficulty, category]
    );

    const questionId = questionResult.rows[0].id;

    // Link players to question
    if (player_ids && Array.isArray(player_ids)) {
      for (const playerId of player_ids) {
        await client.query(
          `INSERT INTO question_players (question_id, player_id)
           VALUES ($1, $2)`,
          [questionId, playerId]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      question: questionResult.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating question:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to create question'
    });
  } finally {
    client.release();
  }
});

// ============================================================================
// USER STATS ENDPOINTS
// ============================================================================

// Get user stats by session ID
app.get('/api/stats/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await pool.query(
      'SELECT * FROM user_stats WHERE session_id = $1',
      [sessionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No stats found for this session'
      });
    }

    res.json({
      success: true,
      stats: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats'
    });
  }
});

// Create or update user stats
app.post('/api/stats', async (req, res) => {
  try {
    const {
      session_id,
      questions_answered = 0,
      correct = 0,
      incorrect = 0,
      streak = 0
    } = req.body;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    const result = await pool.query(
      `INSERT INTO user_stats (session_id, questions_answered, correct, incorrect, streak)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (session_id)
       DO UPDATE SET
         questions_answered = user_stats.questions_answered + EXCLUDED.questions_answered,
         correct = user_stats.correct + EXCLUDED.correct,
         incorrect = user_stats.incorrect + EXCLUDED.incorrect,
         streak = EXCLUDED.streak,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [session_id, questions_answered, correct, incorrect, streak]
    );

    res.json({
      success: true,
      stats: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating stats:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update stats'
    });
  }
});

// ============================================================================
// GAME-SPECIFIC ENDPOINTS (for Journeyman compatibility)
// ============================================================================

// Save player game session (Journeyman-style)
app.post('/save-player', async (req, res) => {
  try {
    const {
      name,
      email,
      gameType = 'journeyman',
      mode,
      durationInSeconds,
      guesses = [],
      correctCount = 0,
      score = 0,
      sharedOnSocial = false,
      gameSpecificData = {}
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Player name and email are required'
      });
    }

    // Generate session ID
    const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Save to user_stats
    const statsResult = await pool.query(
      `INSERT INTO user_stats (session_id, questions_answered, correct, incorrect)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [sessionId, guesses.length, correctCount, guesses.length - correctCount]
    );

    console.log('📥 Player data saved:', {
      name,
      email,
      gameType,
      sessionId,
      correctCount
    });

    res.json({
      success: true,
      message: 'Player data saved successfully',
      sessionId,
      savedAt: statsResult.rows[0].created_at,
      metadata: {
        gameType,
        correctCount,
        score
      }
    });
  } catch (err) {
    console.error('Error saving player data:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to save player data',
      message: err.message
    });
  }
});

// Game data endpoint
app.post('/api/game-data', async (req, res) => {
  try {
    const { name, email, gameType, correctCount, durationInSeconds } = req.body;

    // Generate session ID
    const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    res.json({
      success: true,
      message: 'Game data received',
      sessionId
    });
  } catch (err) {
    console.error('Error processing game data:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================================================
// TEAMS ENDPOINTS
// ============================================================================

// Get all teams
app.get('/api/teams', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM teams ORDER BY name');
    res.json({
      success: true,
      teams: result.rows
    });
  } catch (err) {
    console.error('Error fetching teams:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch teams'
    });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

app.listen(PORT, () => {
  console.log(`\n🚀 NFL Games Hub Backend Server`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🎮 Serving games: NFL Teammates, Journeyman`);
  console.log(`🗄️  Database: PostgreSQL`);
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});
