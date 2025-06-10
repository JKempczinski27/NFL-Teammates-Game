const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL; // Use environment variables for security
const pool = new Pool({ connectionString });

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, email } = req.body;

    try {
      await pool.query('INSERT INTO players (name, email) VALUES ($1, $2)', [name, email]);
      res.status(200).json({ message: 'Player added successfully' });
    } catch (error) {
      console.error('Error adding player:', error);
      res.status(500).json({ error: 'Failed to add player' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}