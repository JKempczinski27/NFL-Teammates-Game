const express = require('express');
const router = express.Router();

// This will be passed in when the router is mounted
let pool;

function initRouter(dbPool) {
  pool = dbPool;
  return router;
}

// GET all images/players
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name as player_name, image_url, position, team
      FROM players
      WHERE image_url IS NOT NULL
      ORDER BY name ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ message: 'Error fetching images', error: error.message });
  }
});

// GET single image by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, name as player_name, image_url, position, team
       FROM players
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({ message: 'Error fetching image', error: error.message });
  }
});

// POST create new image/player
router.post('/', async (req, res) => {
  try {
    const { player_name, image_url, position, team } = req.body;

    // Validate required fields
    if (!player_name || !image_url) {
      return res.status(400).json({ message: 'Player name and image URL are required' });
    }

    // Check if player already exists
    const existingPlayer = await pool.query(
      'SELECT id FROM players WHERE name = $1',
      [player_name]
    );

    if (existingPlayer.rows.length > 0) {
      return res.status(400).json({ message: 'A player with this name already exists' });
    }

    // Insert new player
    const result = await pool.query(
      `INSERT INTO players (name, image_url, position, team)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name as player_name, image_url, position, team`,
      [player_name, image_url, position || null, team || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating image:', error);
    res.status(500).json({ message: 'Error creating image', error: error.message });
  }
});

// PUT update image/player
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { player_name, image_url, position, team } = req.body;

    // Validate required fields
    if (!player_name || !image_url) {
      return res.status(400).json({ message: 'Player name and image URL are required' });
    }

    // Check if another player with the same name exists (excluding current player)
    const existingPlayer = await pool.query(
      'SELECT id FROM players WHERE name = $1 AND id != $2',
      [player_name, id]
    );

    if (existingPlayer.rows.length > 0) {
      return res.status(400).json({ message: 'Another player with this name already exists' });
    }

    // Update player
    const result = await pool.query(
      `UPDATE players
       SET name = $1, image_url = $2, position = $3, team = $4
       WHERE id = $5
       RETURNING id, name as player_name, image_url, position, team`,
      [player_name, image_url, position || null, team || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating image:', error);
    res.status(500).json({ message: 'Error updating image', error: error.message });
  }
});

// DELETE image/player
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Check if player is used in any questions
    const usageCheck = await client.query(
      'SELECT COUNT(*) as count FROM question_players WHERE player_id = $1',
      [id]
    );

    const usageCount = parseInt(usageCheck.rows[0].count);

    if (usageCount > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: `Cannot delete this player. It is used in ${usageCount} question(s). Please remove it from those questions first.`
      });
    }

    // Delete player
    const result = await client.query(
      'DELETE FROM players WHERE id = $1 RETURNING id, name as player_name',
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Image not found' });
    }

    await client.query('COMMIT');

    res.json({
      message: 'Image deleted successfully',
      player: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting image:', error);
    res.status(500).json({ message: 'Error deleting image', error: error.message });
  } finally {
    client.release();
  }
});

module.exports = initRouter;
