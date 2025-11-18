import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './Landing';
import GameSelector from './GameSelector';

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
