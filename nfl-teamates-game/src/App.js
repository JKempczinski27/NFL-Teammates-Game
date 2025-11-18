import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Box, Button, Fab } from '@mui/material';
import { Dashboard as DashboardIcon } from '@mui/icons-material';
import './App.css';
import { getPlayers } from './db';
import CommonPlayerGame from './pages/GamePage';
import Dashboard from './pages/Dashboard';

function PlayerList({ players }) {
  return (
    <div>
      <h1>Players</h1>
      <ul>
        {players.map((player, index) => (
          <li key={index}>
            {player.name} - {player.email}
          </li>
        ))}
      </ul>
    </div>
  );
}

function GamePageWrapper() {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const response = await fetch('/api/getPlayers');
        const data = await response.json();
        setPlayers(data);
      } catch (error) {
        console.error('Error fetching players:', error);
      }
    }

    fetchPlayers();
  }, []);

  return (
    <div>
      <CommonPlayerGame />
      <PlayerList players={players} />

      {/* Floating Action Button to access Dashboard */}
      <Link to="/dashboard" style={{ textDecoration: 'none' }}>
        <Fab
          color="primary"
          aria-label="dashboard"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
        >
          <DashboardIcon />
        </Fab>
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GamePageWrapper />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}
