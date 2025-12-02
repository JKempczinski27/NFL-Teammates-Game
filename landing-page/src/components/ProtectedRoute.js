import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute component that enforces the game flow:
 * / (Landing) → /games (Game Selector) → Individual Games
 *
 * Session tracking keys:
 * - 'visited_landing': Set when user visits landing page
 * - 'visited_game_selector': Set when user visits game selector
 */
function ProtectedRoute({ children, requireGameSelector = false }) {
  const visitedLanding = sessionStorage.getItem('visited_landing');
  const visitedGameSelector = sessionStorage.getItem('visited_game_selector');

  // If accessing a game route, must have visited both landing and game selector
  if (requireGameSelector) {
    if (!visitedLanding) {
      // Redirect to landing page if they haven't visited it
      return <Navigate to="/" replace />;
    }
    if (!visitedGameSelector) {
      // Redirect to game selector if they haven't visited it
      return <Navigate to="/games" replace />;
    }
  }

  // Allow access if all requirements are met
  return children;
}

export default ProtectedRoute;
