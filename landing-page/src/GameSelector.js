// src/GameSelector.js
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './GameSelector.css';
import { logDayPlayed } from './hooks/usePlayerStats'; // adjust path as needed

const games = [
  // Local Games in Monorepo (running on localhost)
  { title: 'NFL Trivia', image: '/LongDrive.png', url: 'http://localhost:5173', external: true, description: '3 difficulty modes' },
  { title: 'Huddle', image: '/Huddle.png', url: 'http://localhost:3000', external: true, description: 'Common teammates game' },
  { title: 'Journeyman', image: '/Journeyman.png', url: 'http://localhost:3000', external: true, description: 'Player career game' },

  // External Games (deployed on Vercel)
  { title: 'Power Ranker', image: '/PowerRanker.png', url: 'https://final-power-rankings.vercel.app/', external: true },
  { title: 'Roster Recall', image: '/RosterRecall1.png', url: 'https://crib-sheet-jack-s-projects-fadc25d5.vercel.app/', external: true },
  { title: 'Gridiron Grid', image: '/GridironGrid.png', url: 'https://grid2-2vrr.vercel.app/', external: true },
];

export default function GameSelector() {
  useEffect(() => {
    const audio = new Audio('/Heavy Action.mp3');
    audio.volume = 0.6;
    audio.play().catch((err) => {
      // Ignore autoplay errors (browser restrictions)
      console.error('Audio failed to play:', err);
    });
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  useEffect(() => {
    logDayPlayed(); // Track that the user visited today
  }, []);

  return (
    <div className="game-selector">
      <h1>Select Your Game</h1>
      <div className="thumbnail-container">
        {games.map((game, index) =>
          game.external ? (
            <a
              href={game.url}
              className="game-thumbnail"
              key={index}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={game.image} alt={game.title} />
              <p>{game.title}</p>
            </a>
          ) : (
            <Link to={game.path} className="game-thumbnail" key={index}>
              <img src={game.image} alt={game.title} />
              <p>{game.title}</p>
            </Link>
          )
        )}
      </div>
    </div>
  );
}
