const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function initializeDatabase() {
  try {
    console.log('Starting database initialization...');

    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute the schema
    await pool.query(schema);

    console.log('✅ Database schema created successfully!');

    // Optional: Add some sample data
    console.log('Checking if sample data is needed...');

    const playerCount = await pool.query('SELECT COUNT(*) FROM players');
    if (parseInt(playerCount.rows[0].count) === 0) {
      console.log('Adding sample players...');

      await pool.query(`
        INSERT INTO players (name, image_url, position, team) VALUES
        ('Tom Brady', 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/2330.png', 'QB', 'Buccaneers'),
        ('Randy Moss', 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/1433.png', 'WR', 'Patriots'),
        ('Jason Pierre-Paul', 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/13256.png', 'DE', 'Giants'),
        ('Josh Gordon', 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/15705.png', 'WR', 'Browns')
      `);

      console.log('✅ Sample players added!');
    }

    const questionCount = await pool.query('SELECT COUNT(*) FROM questions');
    if (parseInt(questionCount.rows[0].count) === 0) {
      console.log('Adding sample question...');

      // Insert a sample question
      const questionResult = await pool.query(`
        INSERT INTO questions (answer, difficulty, category)
        VALUES ('Tom Brady', 'medium', 'Common Teammate')
        RETURNING id
      `);

      const questionId = questionResult.rows[0].id;

      // Link players to the question
      await pool.query(`
        INSERT INTO question_players (question_id, player_id)
        SELECT $1, id FROM players WHERE name IN ('Jason Pierre-Paul', 'Randy Moss', 'Josh Gordon')
      `, [questionId]);

      console.log('✅ Sample question added!');
    }

    console.log('✅ Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
