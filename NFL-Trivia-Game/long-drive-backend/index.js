const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ✅ Proper CORS configuration for Vercel frontend
const corsOptions = {
  origin: 'https://nfl-game-trivia-project.vercel.app',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions)); // ✅ Regex wildcard avoids path-to-regexp error

app.use(express.json()); // ✅ Parse JSON request bodies

// ✅ Simple test route
app.get('/', (req, res) => {
  res.send('<h1>Long Drive Backend</h1><p>Server is live!</p>');
});

// ✅ Player routes
console.log('Loading player routes...');
const playerRoutes = require('./routes/players');
app.use('/api/players', playerRoutes);
console.log('Player routes loaded.');

// ✅ Fallback for all unmatched routes
app.all(/.*/, (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ✅ Start server
console.log('Starting server...');
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
