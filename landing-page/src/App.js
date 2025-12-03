import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './components/Landing';
import GameSelector from './components/GameSelector';

/**
 * Landing Page App
 *
 * In the unified monorepo deployment, each game is built separately
 * and deployed to its own route (/teammates, /trivia, /journeyman).
 * This landing page serves as the entry point and provides navigation.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/games" element={<GameSelector />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
