import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="arcade-landing">
      <div className="grid-fade"></div>

      <img
        src="/Shield.svg"
        alt="NFL Logo"
        className="nfl-logo"
        style={{ width: '210px', height: '175px' }}
      />

      <div className="title-wrapper">
        <h1 className="blitz-logo">GameHub</h1>
        <button className="enter-btn" onClick={() => navigate('/games')}>
          Enter
        </button>
      </div>
    </div>
  );
}

export default Landing;
