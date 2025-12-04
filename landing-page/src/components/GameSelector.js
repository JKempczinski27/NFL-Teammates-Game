// src/components/GameSelector.js
import React, { useEffect } from 'react';
import './GameSelector.css';
import { logDayPlayed } from '../hooks/usePlayerStats';

const games = [
  { title: 'Long Drive', image: '/LongDrive.png', path: '/trivia' },
  { title: 'Huddle', image: '/Huddle.png', path: '/teammates' },
  { title: 'Journeyman', image: '/Journeyman.png', path: '/journeyman' },
];

export default function GameSelector() {
  useEffect(() => {
    logDayPlayed(); // Track that the user visited today
    sessionStorage.setItem('visited_game_selector', 'true'); // Mark game selector as visited
  }, []);

  return (
    <div className="game-selector">
      <h1>Select Your Game</h1>
      <div className="thumbnail-container">
        {games.map((game, index) => (
          <a href={game.path} className="game-thumbnail" key={index}>
            <img src={game.image} alt={game.title} />
            <p>{game.title}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
