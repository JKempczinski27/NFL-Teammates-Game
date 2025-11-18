const express = require('express');
const router = express.Router();

// This will be passed in when the router is mounted
let pool;

function initRouter(dbPool) {
  pool = dbPool;
  return router;
}

// GET all questions
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        q.*,
        json_agg(
          json_build_object('src', p.image_url, 'name', p.name)
        ) FILTER (WHERE p.id IS NOT NULL) as images
      FROM questions q
      LEFT JOIN question_players qp ON q.id = qp.question_id
      LEFT JOIN players p ON qp.player_id = p.id
      GROUP BY q.id
      ORDER BY q.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: 'Error fetching questions', error: error.message });
  }
});

// GET single question by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT
        q.*,
        json_agg(
          json_build_object('src', p.image_url, 'name', p.name)
        ) FILTER (WHERE p.id IS NOT NULL) as images
      FROM questions q
      LEFT JOIN question_players qp ON q.id = qp.question_id
      LEFT JOIN players p ON qp.player_id = p.id
      WHERE q.id = $1
      GROUP BY q.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ message: 'Error fetching question', error: error.message });
  }
});

// POST create new question
router.post('/', async (req, res) => {
  const client = await pool.connect();

  try {
    const { answer, difficulty, category, images } = req.body;

    // Validate required fields
    if (!answer) {
      return res.status(400).json({ message: 'Answer is required' });
    }

    if (!images || images.length < 2) {
      return res.status(400).json({ message: 'At least 2 player images are required' });
    }

    await client.query('BEGIN');

    // Insert question
    const questionResult = await client.query(
      `INSERT INTO questions (answer, difficulty, category)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [answer, difficulty || 'medium', category || null]
    );

    const questionId = questionResult.rows[0].id;

    // Insert or find players and link them to the question
    for (const image of images) {
      if (!image.name || !image.src) continue;

      // Check if player exists
      let playerResult = await client.query(
        'SELECT id FROM players WHERE name = $1',
        [image.name]
      );

      let playerId;

      if (playerResult.rows.length > 0) {
        // Player exists, update image if needed
        playerId = playerResult.rows[0].id;
        await client.query(
          'UPDATE players SET image_url = $1 WHERE id = $2',
          [image.src, playerId]
        );
      } else {
        // Create new player
        const newPlayerResult = await client.query(
          'INSERT INTO players (name, image_url) VALUES ($1, $2) RETURNING id',
          [image.name, image.src]
        );
        playerId = newPlayerResult.rows[0].id;
      }

      // Link player to question
      await client.query(
        `INSERT INTO question_players (question_id, player_id)
         VALUES ($1, $2)
         ON CONFLICT (question_id, player_id) DO NOTHING`,
        [questionId, playerId]
      );
    }

    await client.query('COMMIT');

    // Fetch the complete question with images
    const completeQuestion = await pool.query(`
      SELECT
        q.*,
        json_agg(
          json_build_object('src', p.image_url, 'name', p.name)
        ) as images
      FROM questions q
      LEFT JOIN question_players qp ON q.id = qp.question_id
      LEFT JOIN players p ON qp.player_id = p.id
      WHERE q.id = $1
      GROUP BY q.id
    `, [questionId]);

    res.status(201).json(completeQuestion.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating question:', error);
    res.status(500).json({ message: 'Error creating question', error: error.message });
  } finally {
    client.release();
  }
});

// PUT update question
router.put('/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { answer, difficulty, category, images } = req.body;

    // Validate required fields
    if (!answer) {
      return res.status(400).json({ message: 'Answer is required' });
    }

    await client.query('BEGIN');

    // Update question
    const questionResult = await client.query(
      `UPDATE questions
       SET answer = $1, difficulty = $2, category = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [answer, difficulty || 'medium', category || null, id]
    );

    if (questionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Question not found' });
    }

    // Remove existing player associations
    await client.query('DELETE FROM question_players WHERE question_id = $1', [id]);

    // Add new player associations
    if (images && images.length > 0) {
      for (const image of images) {
        if (!image.name || !image.src) continue;

        // Check if player exists
        let playerResult = await client.query(
          'SELECT id FROM players WHERE name = $1',
          [image.name]
        );

        let playerId;

        if (playerResult.rows.length > 0) {
          playerId = playerResult.rows[0].id;
          await client.query(
            'UPDATE players SET image_url = $1 WHERE id = $2',
            [image.src, playerId]
          );
        } else {
          const newPlayerResult = await client.query(
            'INSERT INTO players (name, image_url) VALUES ($1, $2) RETURNING id',
            [image.name, image.src]
          );
          playerId = newPlayerResult.rows[0].id;
        }

        await client.query(
          'INSERT INTO question_players (question_id, player_id) VALUES ($1, $2)',
          [id, playerId]
        );
      }
    }

    await client.query('COMMIT');

    // Fetch the complete updated question
    const completeQuestion = await pool.query(`
      SELECT
        q.*,
        json_agg(
          json_build_object('src', p.image_url, 'name', p.name)
        ) FILTER (WHERE p.id IS NOT NULL) as images
      FROM questions q
      LEFT JOIN question_players qp ON q.id = qp.question_id
      LEFT JOIN players p ON qp.player_id = p.id
      WHERE q.id = $1
      GROUP BY q.id
    `, [id]);

    res.json(completeQuestion.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating question:', error);
    res.status(500).json({ message: 'Error updating question', error: error.message });
  } finally {
    client.release();
  }
});

// DELETE question
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Delete player associations first (foreign key constraint)
    await client.query('DELETE FROM question_players WHERE question_id = $1', [id]);

    // Delete question
    const result = await client.query('DELETE FROM questions WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Question not found' });
    }

    await client.query('COMMIT');

    res.json({ message: 'Question deleted successfully', question: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting question:', error);
    res.status(500).json({ message: 'Error deleting question', error: error.message });
  } finally {
    client.release();
  }
});

module.exports = initRouter;
