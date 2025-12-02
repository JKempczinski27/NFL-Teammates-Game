import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

function Landing() {
  const navigate = useNavigate();

  // Mark that user has visited the landing page
  useEffect(() => {
    sessionStorage.setItem('visited_landing', 'true');
  }, []);

  const handleEnter = () => {
    navigate('/games');
  };

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
        <button className="enter-btn" onClick={handleEnter}>
          Enter
        </button>
      </div>
    </div>
  );
}

export default Landing;
