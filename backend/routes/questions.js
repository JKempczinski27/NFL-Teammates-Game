/**
 * Questions Route - NFL Teammates Game
 * Handles retrieval of game questions with player clues and answers
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../index');

/**
 * GET /api/questions
 * Returns all questions with their clues and answer player
 * Used by iOS app to fetch game questions
 */
router.get('/', async (req, res) => {
  try {
    // Query database for all questions with player data
    const result = await pool.query(`
      SELECT
        q.id,
        q.difficulty,
        q.category,
        json_agg(DISTINCT jsonb_build_object(
          'id', cp.id,
          'name', cp.name,
          'position', cp.position,
          'image_url', cp.image_url,
          'teams_played', cp.teams_played,
          'years_active', cp.years_active
        )) FILTER (WHERE cp.is_clue = true) as clues,
        jsonb_build_object(
          'id', ap.id,
          'name', ap.name,
          'position', ap.position,
          'image_url', ap.image_url,
          'teams_played', ap.teams_played,
          'years_active', ap.years_active
        ) as answer
      FROM questions q
      LEFT JOIN question_players qp ON q.id = qp.question_id
      LEFT JOIN players cp ON qp.player_id = cp.id AND qp.is_clue = true
      LEFT JOIN players ap ON q.answer_player_id = ap.id
      GROUP BY q.id, ap.id, ap.name, ap.position, ap.image_url, ap.teams_played, ap.years_active
      ORDER BY q.id
    `);

    res.json({
      success: true,
      count: result.rows.length,
      questions: result.rows
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questions',
      message: error.message
    });
  }
});

/**
 * GET /api/questions/:id
 * Returns a single question by ID
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT
        q.id,
        q.difficulty,
        q.category,
        json_agg(DISTINCT jsonb_build_object(
          'id', cp.id,
          'name', cp.name,
          'position', cp.position,
          'image_url', cp.image_url,
          'teams_played', cp.teams_played,
          'years_active', cp.years_active
        )) FILTER (WHERE cp.is_clue = true) as clues,
        jsonb_build_object(
          'id', ap.id,
          'name', ap.name,
          'position', ap.position,
          'image_url', ap.image_url,
          'teams_played', ap.teams_played,
          'years_active', ap.years_active
        ) as answer
      FROM questions q
      LEFT JOIN question_players qp ON q.id = qp.question_id
      LEFT JOIN players cp ON qp.player_id = cp.id AND qp.is_clue = true
      LEFT JOIN players ap ON q.answer_player_id = ap.id
      WHERE q.id = $1
      GROUP BY q.id, ap.id, ap.name, ap.position, ap.image_url, ap.teams_played, ap.years_active
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    res.json({
      success: true,
      question: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch question',
      message: error.message
    });
  }
});

/**
 * GET /api/questions/random/:count
 * Returns random questions for a game session
 */
router.get('/random/:count', async (req, res) => {
  const count = parseInt(req.params.count) || 5;
  const difficulty = req.query.difficulty; // optional filter

  try {
    let query = `
      SELECT
        q.id,
        q.difficulty,
        q.category,
        json_agg(DISTINCT jsonb_build_object(
          'id', cp.id,
          'name', cp.name,
          'position', cp.position,
          'image_url', cp.image_url,
          'teams_played', cp.teams_played,
          'years_active', cp.years_active
        )) FILTER (WHERE cp.is_clue = true) as clues,
        jsonb_build_object(
          'id', ap.id,
          'name', ap.name,
          'position', ap.position,
          'image_url', ap.image_url,
          'teams_played', ap.teams_played,
          'years_active', ap.years_active
        ) as answer
      FROM questions q
      LEFT JOIN question_players qp ON q.id = qp.question_id
      LEFT JOIN players cp ON qp.player_id = cp.id AND qp.is_clue = true
      LEFT JOIN players ap ON q.answer_player_id = ap.id
    `;

    const params = [];
    if (difficulty) {
      query += ` WHERE q.difficulty = $1`;
      params.push(difficulty);
    }

    query += `
      GROUP BY q.id, ap.id, ap.name, ap.position, ap.image_url, ap.teams_played, ap.years_active
      ORDER BY RANDOM()
      LIMIT $${params.length + 1}
    `;
    params.push(count);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      questions: result.rows
    });
  } catch (error) {
    console.error('Error fetching random questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch random questions',
      message: error.message
    });
  }
});

module.exports = router;
