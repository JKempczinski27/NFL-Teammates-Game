# GDPR and Data Protection Features Documentation

This document describes the GDPR and data protection features that were present in the Journeyman Python backend but **not yet implemented** in the consolidated Node.js backend.

## Overview

The original Journeyman backend (Python/Flask) included comprehensive GDPR compliance features. This document serves as a reference for implementing these features in the Node.js backend in the future.

## Features from Python Backend

### 1. GDPR Compliance Endpoints

#### Data Export (Right to Data Portability)
```python
# Original endpoint: GET /api/gdpr/export/<user_id>
```

**What it did:**
- Exported all user data in a structured format
- Required API key authentication
- Included timestamp of export
- Rate limited to 5 requests per minute

**Node.js Implementation Guide:**
```javascript
router.get('/api/gdpr/export/:userId', requireApiKey, async (req, res) => {
  const { userId } = req.params;

  // Gather all user data from all tables
  const teammates = await pool.query('SELECT * FROM players WHERE email = $1', [userId]);
  const trivia = await pool.query('SELECT * FROM trivia_players WHERE email = $1', [userId]);
  const journeyman = await pool.query('SELECT * FROM journeyman_players WHERE email = $1', [userId]);
  const tracking = await pool.query('SELECT * FROM player_updated WHERE email = $1', [userId]);

  res.json({
    success: true,
    data: {
      teammates: teammates.rows,
      trivia: trivia.rows,
      journeyman: journeyman.rows,
      tracking: tracking.rows
    },
    exported_at: new Date().toISOString()
  });
});
```

#### Data Deletion (Right to be Forgotten)
```python
# Original endpoint: DELETE /api/gdpr/delete/<user_id>
```

**What it did:**
- Anonymized or deleted all user data
- Required API key authentication
- Rate limited to 3 requests per hour
- Logged deletion requests

**Node.js Implementation Guide:**
```javascript
router.delete('/api/gdpr/delete/:userId', requireApiKey, async (req, res) => {
  const { userId } = req.params;

  try {
    await pool.query('BEGIN');

    // Anonymize instead of delete to preserve analytics
    await pool.query(
      `UPDATE players SET
       name = 'Anonymous User',
       email = 'deleted_' || id || '@anonymized.com'
       WHERE email = $1`,
      [userId]
    );

    await pool.query(
      `UPDATE trivia_players SET
       name = 'Anonymous User',
       email = 'deleted_' || id || '@anonymized.com'
       WHERE email = $1`,
      [userId]
    );

    await pool.query(
      `UPDATE journeyman_players SET
       name = 'Anonymous User',
       email = 'deleted_' || id || '@anonymized.com'
       WHERE email = $1`,
      [userId]
    );

    await pool.query('COMMIT');

    res.json({
      success: true,
      message: 'User data has been anonymized',
      processed_at: new Date().toISOString()
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 2. Consent Management

#### Get User Consents
```python
# Original endpoint: GET /api/consent/<user_id>
```

**What it did:**
- Retrieved all consent records for a user
- Tracked consent type, granted status, timestamp
- Included IP address and user agent metadata

**Database Schema Needed:**
```sql
CREATE TABLE user_consents (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  consent_type VARCHAR(50) NOT NULL,
  granted BOOLEAN NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_consents_email ON user_consents(user_email);
CREATE INDEX idx_user_consents_type ON user_consents(consent_type);
```

**Node.js Implementation Guide:**
```javascript
router.get('/api/consent/:userId', async (req, res) => {
  const { userId } = req.params;

  const result = await pool.query(
    'SELECT * FROM user_consents WHERE user_email = $1 ORDER BY created_at DESC',
    [userId]
  );

  res.json({ success: true, consents: result.rows });
});
```

#### Record Consent
```python
# Original endpoint: POST /api/consent/<user_id>
```

**Node.js Implementation Guide:**
```javascript
router.post('/api/consent/:userId', async (req, res) => {
  const { userId } = req.params;
  const { consent_type, granted } = req.body;

  const result = await pool.query(
    `INSERT INTO user_consents
     (user_email, consent_type, granted, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      userId,
      consent_type,
      granted,
      req.ip,
      req.headers['user-agent']
    ]
  );

  res.json({ success: true, consent: result.rows[0] });
});
```

#### Revoke Consent
```python
# Original endpoint: DELETE /api/consent/<user_id>/<consent_type>
```

**Node.js Implementation Guide:**
```javascript
router.delete('/api/consent/:userId/:consentType', async (req, res) => {
  const { userId, consentType } = req.params;

  await pool.query(
    `UPDATE user_consents
     SET granted = false, updated_at = CURRENT_TIMESTAMP
     WHERE user_email = $1 AND consent_type = $2`,
    [userId, consentType]
  );

  res.json({ success: true });
});
```

### 3. Data Encryption

**Original Python Implementation:**
- Used cryptography library (Fernet)
- Stored encryption key in environment variable
- Encrypted sensitive data before storage

**Node.js Implementation Guide:**

Install dependencies:
```bash
npm install crypto
```

Create encryption utility (`utils/encryption.js`):
```javascript
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

module.exports = { encrypt, decrypt };
```

### 4. Security Headers

**Original Python Implementation (Flask-Talisman):**
- Content Security Policy (CSP)
- Strict Transport Security (HSTS)
- Referrer Policy
- Feature Policy

**Node.js Implementation Guide:**

Install helmet:
```bash
npm install helmet
```

In `app.js`:
```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

### 5. Rate Limiting

**Original Python Implementation (Flask-Limiter):**
- Redis-backed rate limiting
- Different limits for different endpoints
- In-memory fallback

**Node.js Implementation Guide:**

Install express-rate-limit:
```bash
npm install express-rate-limit redis
```

In `app.js`:
```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);

// Stricter limit for GDPR endpoints
const gdprLimiter = rateLimit({
  store: new RedisStore({ client: redisClient }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3
});

app.use('/api/gdpr/delete', gdprLimiter);
```

### 6. Data Retention

**Original Python Implementation:**
- Automated data cleanup after retention period
- Category-based retention policies
- Scheduled jobs for cleanup

**Node.js Implementation Guide:**

Use node-cron:
```bash
npm install node-cron
```

Create `utils/dataRetention.js`:
```javascript
const cron = require('node-cron');

const DATA_RETENTION_DAYS = {
  gameplay: 365,      // 1 year
  analytics: 730,     // 2 years
  tracking: 90        // 90 days
};

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  const pool = req.app.get('pool');

  // Delete old tracking data
  await pool.query(
    `DELETE FROM player_updated
     WHERE created_at < NOW() - INTERVAL '${DATA_RETENTION_DAYS.tracking} days'`
  );

  console.log('Data retention cleanup completed');
});

module.exports = { startDataRetention: () => {} };
```

## Implementation Priority

If implementing these features, prioritize in this order:

1. **Rate Limiting** - Prevents abuse, easy to implement
2. **Security Headers** - Improves overall security posture
3. **GDPR Export** - Legal compliance requirement
4. **GDPR Delete** - Legal compliance requirement
5. **Consent Management** - If collecting personal data
6. **Data Encryption** - For sensitive data
7. **Data Retention** - Automates cleanup

## Testing GDPR Features

Once implemented, test with:

```bash
# Export user data
curl -H "X-API-Key: your-key" \
  http://localhost:3000/api/gdpr/export/user@example.com

# Delete user data
curl -X DELETE -H "X-API-Key: your-key" \
  http://localhost:3000/api/gdpr/delete/user@example.com

# Record consent
curl -X POST http://localhost:3000/api/consent/user@example.com \
  -H "Content-Type: application/json" \
  -d '{"consent_type":"analytics","granted":true}'
```

## Legal Disclaimer

This documentation is for technical implementation only. Consult with legal counsel to ensure full GDPR compliance for your specific use case.

## References

- [GDPR Official Text](https://gdpr-info.eu/)
- [OWASP Security Guidelines](https://owasp.org/)
- Original Python implementation: `Journeyman/journeyman/backend-python/`
