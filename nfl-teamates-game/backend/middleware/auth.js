// Simple authentication middleware
// In production, use JWT or OAuth2
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'No API key provided' });
  }

  if (apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
};

module.exports = { authenticate };
