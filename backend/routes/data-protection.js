/**
 * Data Protection Route - GDPR Compliance
 * Handles GDPR requests and consent management
 * Used primarily by Journeyman game for compliance
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * GET /api/data-protection/health
 * Health check for data protection service
 */
router.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      message: 'Data protection service is operational',
      timestamp: result.rows[0].now
    });
  } catch (err) {
    res.status(500).json({
      status: 'unhealthy',
      error: err.message
    });
  }
});

/**
 * GET /api/data-protection/export/:userId
 * GDPR Export - Get all user data
 */
router.get('/export/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Get user data from multiple tables
    const [player, sessions, submissions, consents] = await Promise.all([
      pool.query('SELECT * FROM players WHERE email = $1', [userId]),
      pool.query('SELECT * FROM user_sessions WHERE session_id IN (SELECT session_id FROM events WHERE event_data->>\'email\' = $1)', [userId]),
      pool.query('SELECT * FROM game_submissions WHERE player_email = $1', [userId]),
      pool.query('SELECT * FROM user_consents WHERE user_id = $1', [userId])
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      userId: userId,
      personalData: {
        player: player.rows[0] || null,
        sessions: sessions.rows,
        gameSubmissions: submissions.rows,
        consents: consents.rows
      },
      dataRetention: {
        message: 'Your data is retained as long as you use our services. You can request deletion at any time.'
      }
    };

    res.json({
      success: true,
      export: exportData
    });
  } catch (err) {
    console.error('Error exporting user data:', err);
    res.status(500).json({ error: 'Error exporting user data' });
  }
});

/**
 * DELETE /api/data-protection/delete/:userId
 * GDPR Delete - Delete all user data
 */
router.delete('/delete/:userId', async (req, res) => {
  const { userId } = req.params;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Log deletion request
    await client.query(
      'INSERT INTO data_deletion_requests (user_id, status) VALUES ($1, $2)',
      [userId, 'processing']
    );

    // Delete user data from all tables
    await client.query('DELETE FROM game_submissions WHERE player_email = $1', [userId]);
    await client.query('DELETE FROM user_consents WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM question_analytics WHERE session_id IN (SELECT session_id FROM events WHERE event_data->>\'email\' = $1)', [userId]);
    await client.query('DELETE FROM share_analytics WHERE session_id IN (SELECT session_id FROM events WHERE event_data->>\'email\' = $1)', [userId]);
    await client.query('DELETE FROM user_sessions WHERE session_id IN (SELECT session_id FROM events WHERE event_data->>\'email\' = $1)', [userId]);
    await client.query('DELETE FROM events WHERE event_data->>\'email\' = $1', [userId]);
    await client.query('DELETE FROM players WHERE email = $1', [userId]);

    // Update deletion request status
    await client.query(
      'UPDATE data_deletion_requests SET status = $1, processed_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND status = $3',
      ['completed', userId, 'processing']
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'User data successfully deleted',
      userId: userId,
      deletedAt: new Date().toISOString()
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting user data:', err);

    // Log failed deletion
    await pool.query(
      'UPDATE data_deletion_requests SET status = $1, notes = $2 WHERE user_id = $3 AND status = $4',
      ['failed', err.message, userId, 'processing']
    );

    res.status(500).json({ error: 'Error deleting user data' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/data-protection/consent/:userId
 * Get user consents
 */
router.get('/consent/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM user_consents WHERE user_id = $1 AND revoked_at IS NULL ORDER BY granted_at DESC',
      [userId]
    );

    res.json({
      success: true,
      userId: userId,
      consents: result.rows
    });
  } catch (err) {
    console.error('Error fetching consents:', err);
    res.status(500).json({ error: 'Error fetching consents' });
  }
});

/**
 * POST /api/data-protection/consent/:userId
 * Record user consent
 */
router.post('/consent/:userId', async (req, res) => {
  const { userId } = req.params;
  const { consentType, granted } = req.body;

  // Validate consent type
  const validConsentTypes = ['analytics', 'marketing', 'essential'];
  if (!validConsentTypes.includes(consentType)) {
    return res.status(400).json({
      error: `Invalid consentType. Must be one of: ${validConsentTypes.join(', ')}`
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO user_consents (user_id, consent_type, granted, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        userId,
        consentType,
        granted,
        req.ip,
        req.headers['user-agent']
      ]
    );

    res.status(201).json({
      success: true,
      consent: result.rows[0]
    });
  } catch (err) {
    console.error('Error recording consent:', err);
    res.status(500).json({ error: 'Error recording consent' });
  }
});

/**
 * DELETE /api/data-protection/consent/:userId/:consentType
 * Revoke user consent
 */
router.delete('/consent/:userId/:consentType', async (req, res) => {
  const { userId, consentType } = req.params;

  try {
    const result = await pool.query(
      'UPDATE user_consents SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND consent_type = $2 AND revoked_at IS NULL RETURNING *',
      [userId, consentType]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Consent not found or already revoked' });
    }

    res.json({
      success: true,
      message: 'Consent revoked',
      consent: result.rows[0]
    });
  } catch (err) {
    console.error('Error revoking consent:', err);
    res.status(500).json({ error: 'Error revoking consent' });
  }
});

module.exports = router;
