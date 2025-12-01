import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './components/Landing';
import GameSelector from './components/GameSelector';

// Import the game apps
import TriviaApp from '../../nfl-trivia-game/src/App';
import TeammatesApp from '../../nfl-teammates-game/src/App';
import JourneymanApp from '../../journeyman/src/App';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/games" element={<GameSelector />} />
        <Route path="/trivia" element={<TriviaApp />} />
        <Route path="/teammates" element={<TeammatesApp />} />
        <Route path="/journeyman" element={<JourneymanApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
