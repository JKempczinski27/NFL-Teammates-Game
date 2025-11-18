import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

function Landing() {
  const navigate = useNavigate();

  // To change the font, update your CSS (Landing.css) for the relevant classes.
  // Example:
  // .blitz-logo { font-family: 'Arial Black', Arial, sans-serif; }
  // .arcade-landing { font-family: 'Roboto', sans-serif; }

  return (
    <div className="arcade-landing">
      <div className="grid-fade"></div>
      
      {/* Add the logo manually here */}
      <img
        src="/Shield.svg"
        alt="NFL Logo"
        className="nfl-logo"
        style={{ width: '210px', height: '175px' }} // Adjust width as needed
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
