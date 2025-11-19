/**
 * Database Helper for Testing
 * Provides utilities for setting up, tearing down, and managing test database
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

class DatabaseHelper {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  /**
   * Initialize database connection for tests
   */
  async connect() {
    if (this.isConnected) return;

    // Use test database or main database
    // In production, you'd want a separate test database
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10, // Limit connections for tests
    });

    try {
      await this.pool.query('SELECT 1');
      this.isConnected = true;
      console.log('Test database connected');
    } catch (error) {
      console.error('Failed to connect to test database:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      console.log('Test database disconnected');
    }
  }

  /**
   * Clean all tables (for isolated tests)
   */
  async cleanDatabase() {
    const tables = [
      'user_stats',
      'question_players',
      'questions',
      'team_relationships',
      'players',
      'teams'
    ];

    for (const table of tables) {
      try {
        await this.pool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
      } catch (error) {
        // Table might not exist, continue
        console.warn(`Could not truncate ${table}:`, error.message);
      }
    }
  }

  /**
   * Reset database to initial state with schema
   */
  async resetDatabase() {
    try {
      const schemaPath = path.join(__dirname, '../../schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await this.pool.query(schema);
      console.log('Database schema reset successfully');
    } catch (error) {
      console.error('Failed to reset database:', error);
      throw error;
    }
  }

  /**
   * Seed teams table with NFL teams
   */
  async seedTeams() {
    const teams = [
      ['Arizona Cardinals', 'Arizona', 'ARI'],
      ['Atlanta Falcons', 'Atlanta', 'ATL'],
      ['Baltimore Ravens', 'Baltimore', 'BAL'],
      ['Buffalo Bills', 'Buffalo', 'BUF'],
      ['Carolina Panthers', 'Carolina', 'CAR'],
      ['Chicago Bears', 'Chicago', 'CHI'],
      ['Cincinnati Bengals', 'Cincinnati', 'CIN'],
      ['Cleveland Browns', 'Cleveland', 'CLE'],
      ['Dallas Cowboys', 'Dallas', 'DAL'],
      ['Denver Broncos', 'Denver', 'DEN'],
      ['Detroit Lions', 'Detroit', 'DET'],
      ['Green Bay Packers', 'Green Bay', 'GB'],
      ['Houston Texans', 'Houston', 'HOU'],
      ['Indianapolis Colts', 'Indianapolis', 'IND'],
      ['Jacksonville Jaguars', 'Jacksonville', 'JAX'],
      ['Kansas City Chiefs', 'Kansas City', 'KC'],
      ['Las Vegas Raiders', 'Las Vegas', 'LV'],
      ['Los Angeles Chargers', 'Los Angeles', 'LAC'],
      ['Los Angeles Rams', 'Los Angeles', 'LAR'],
      ['Miami Dolphins', 'Miami', 'MIA'],
      ['Minnesota Vikings', 'Minnesota', 'MIN'],
      ['New England Patriots', 'New England', 'NE'],
      ['New Orleans Saints', 'New Orleans', 'NO'],
      ['New York Giants', 'New York', 'NYG'],
      ['New York Jets', 'New York', 'NYJ'],
      ['Philadelphia Eagles', 'Philadelphia', 'PHI'],
      ['Pittsburgh Steelers', 'Pittsburgh', 'PIT'],
      ['San Francisco 49ers', 'San Francisco', 'SF'],
      ['Seattle Seahawks', 'Seattle', 'SEA'],
      ['Tampa Bay Buccaneers', 'Tampa Bay', 'TB'],
      ['Tennessee Titans', 'Tennessee', 'TEN'],
      ['Washington Commanders', 'Washington', 'WAS']
    ];

    for (const [name, city, abbr] of teams) {
      await this.pool.query(
        'INSERT INTO teams (name, city, abbreviation) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
        [name, city, abbr]
      );
    }
  }

  /**
   * Seed players table with test data
   */
  async seedPlayers() {
    const players = [
      { name: 'Tom Brady', position: 'QB', teams: 'New England Patriots, Tampa Bay Buccaneers', years_active: '2000-2023' },
      { name: 'Aaron Rodgers', position: 'QB', teams: 'Green Bay Packers, New York Jets', years_active: '2005-present' },
      { name: 'Patrick Mahomes', position: 'QB', teams: 'Kansas City Chiefs', years_active: '2017-present' },
      { name: 'Travis Kelce', position: 'TE', teams: 'Kansas City Chiefs', years_active: '2013-present' },
      { name: 'Rob Gronkowski', position: 'TE', teams: 'New England Patriots, Tampa Bay Buccaneers', years_active: '2010-2021' },
    ];

    const insertedPlayers = [];
    for (const player of players) {
      const result = await this.pool.query(
        'INSERT INTO players (name, position, teams, years_active) VALUES ($1, $2, $3, $4) RETURNING *',
        [player.name, player.position, player.teams, player.years_active]
      );
      insertedPlayers.push(result.rows[0]);
    }
    return insertedPlayers;
  }

  /**
   * Create test player
   */
  async createPlayer(playerData) {
    const { name, position, teams, years_active } = playerData;
    const result = await this.pool.query(
      'INSERT INTO players (name, position, teams, years_active) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, position, teams, years_active]
    );
    return result.rows[0];
  }

  /**
   * Create test question
   */
  async createQuestion(questionData) {
    const { answer, difficulty, category } = questionData;
    const result = await this.pool.query(
      'INSERT INTO questions (answer, difficulty, category) VALUES ($1, $2, $3) RETURNING *',
      [answer, difficulty || 'medium', category || 'teammates']
    );
    return result.rows[0];
  }

  /**
   * Create user stats
   */
  async createUserStats(sessionId, stats = {}) {
    const result = await this.pool.query(
      `INSERT INTO user_stats (session_id, questions_answered, correct, incorrect, streak)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        sessionId,
        stats.questions_answered || 0,
        stats.correct || 0,
        stats.incorrect || 0,
        stats.streak || 0
      ]
    );
    return result.rows[0];
  }

  /**
   * Get table row count
   */
  async getTableCount(tableName) {
    const result = await this.pool.query(`SELECT COUNT(*) FROM ${tableName}`);
    return parseInt(result.rows[0].count);
  }

  /**
   * Execute raw query
   */
  async query(sql, params = []) {
    return await this.pool.query(sql, params);
  }

  /**
   * Get pool instance
   */
  getPool() {
    return this.pool;
  }
}

// Export singleton instance
module.exports = new DatabaseHelper();
