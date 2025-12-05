/**
 * Super Dashboard Admin Routes
 * Authentication, user management, system overview
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/database');
const { generateToken, createSession, deleteSession, requireAuth, requireRole } = require('../middleware/auth');

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM admin_users WHERE username = $1 AND is_active = true',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id, user.username, user.role);

    // Create session
    await createSession(user.id, token, req);

    // Update last login
    await client.query(
      'UPDATE admin_users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Log audit
    await client.query(
      'INSERT INTO audit_log (user_id, action, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
      [user.id, 'login', req.ip, req.headers['user-agent']]
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  } finally {
    client.release();
  }
});

// POST /api/admin/logout
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const token = req.headers.authorization.substring(7);
    await deleteSession(token);

    const client = await pool.connect();
    try {
      await client.query(
        'INSERT INTO audit_log (user_id, action) VALUES ($1, $2)',
        [req.user.id, 'logout']
      );
    } finally {
      client.release();
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// GET /api/admin/me
router.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// GET /api/admin/dashboard/overview
router.get('/dashboard/overview', requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const overview = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM questions WHERE is_active = true) as total_questions,
        (SELECT COUNT(*) FROM questions WHERE status = 'active') as active_questions,
        (SELECT COUNT(DISTINCT session_id) FROM events WHERE timestamp > NOW() - INTERVAL '24 hours') as dau,
        (SELECT COUNT(*) FROM error_logs WHERE occurred_at > NOW() - INTERVAL '24 hours' AND resolved_at IS NULL) as unresolved_errors,
        (SELECT COUNT(*) FROM experiments WHERE status = 'active') as active_experiments,
        (SELECT COUNT(*) FROM ios_app_versions WHERE status = 'active') as active_ios_versions
    `);

    res.json({
      success: true,
      overview: overview.rows[0]
    });
  } catch (error) {
    console.error('Overview error:', error);
    res.status(500).json({ error: 'Failed to fetch overview' });
  } finally {
    client.release();
  }
});

module.exports = router;
