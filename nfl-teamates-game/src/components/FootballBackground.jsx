import React from 'react';
import './FootballBackground.css';

const floats = [
  { left: '10%', size: 60, duration: 30, delay: -5, opacity: 0.3, rotate: 20 },
  { left: '25%', size: 50, duration: 25, delay: -15, opacity: 0.4, rotate: -15 },
  { left: '40%', size: 70, duration: 35, delay: -10, opacity: 0.25, rotate: 30 },
  { left: '55%', size: 55, duration: 28, delay: -20, opacity: 0.35, rotate: -25 },
  { left: '70%', size: 65, duration: 32, delay: -8,  opacity: 0.3, rotate: 15 },
  { left: '85%', size: 50, duration: 27, delay: -12, opacity: 0.4, rotate: -20 },
  { left: '5%',  size: 55, duration: 33, delay: -18, opacity: 0.3, rotate: 10 },
  { left: '90%', size: 60, duration: 29, delay: -3,  opacity: 0.25, rotate: -30 },
];

export default function FootballBackground() {
  return (
    <div className="football-bg">
      {floats.map((f, idx) => (
        <svg
          key={idx}
          className={`football football-${idx}`}
          style={{
            left: f.left,
            '--size': `${f.size}px`,
            '--duration': `${f.duration}s`,
            '--delay': `${f.delay}s`,
            '--opacity': f.opacity,
            '--rotate': `${f.rotate}deg`,
          }}
          viewBox="0 0 100 60"
        >
          <ellipse cx="50" cy="30" rx="48" ry="26" fill="#9e5e3c" />
          <path d="M15 30 L85 30" stroke="#fff" strokeWidth="4"/>
          <line x1="40" y1="20" x2="60" y2="40" stroke="#fff" strokeWidth="2"/>
          <line x1="45" y1="22" x2="65" y2="42" stroke="#fff" strokeWidth="2"/>
        </svg>
      ))}
    </div>
  );
}
