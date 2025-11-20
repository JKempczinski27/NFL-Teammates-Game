import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();
const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 5000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

app.post('/api/players', async (req, res) => {
  const { name, email, team, score } = req.body;
  try {
    await pool.query(
      'INSERT INTO players(name, email, team, score) VALUES($1, $2, $3, $4)',
      [name, email, team, score || 0]
    );
    res.status(201).json({ message: 'Player added successfully!' });
  } catch (error) {
    console.error('DB ERROR:', error);
    res.status(500).json({ error: 'Database insert failed' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
