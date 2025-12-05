/**
 * Authentication Middleware for Super Dashboard
 */

const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '24h';

function generateToken(userId, username, role) {
  return jwt.sign({ userId, username, role, type: 'admin' }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT s.*, u.username, u.role FROM admin_sessions s JOIN admin_users u ON s.user_id = u.id WHERE s.token_hash = $1 AND s.expires_at > NOW() AND u.is_active = true',
        [hashToken(token)]
      );
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Session expired' });
      }
      req.user = { id: decoded.userId, username: decoded.username, role: decoded.role };
      next();
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

async function createSession(userId, token, req) {
  const client = await pool.connect();
  try {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await client.query(
      'INSERT INTO admin_sessions (user_id, token_hash, expires_at, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
      [userId, hashToken(token), expiresAt, req.ip, req.headers['user-agent']]
    );
  } finally {
    client.release();
  }
}

async function deleteSession(token) {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM admin_sessions WHERE token_hash = $1', [hashToken(token)]);
  } finally {
    client.release();
  }
}

module.exports = { generateToken, verifyToken, requireAuth, requireRole, createSession, deleteSession, hashToken };
