import React from 'react';
import './FootballBackground.css';

const floats = [
  // Original 12 footballs
  { left: '10%', size: 60, duration: 30, delay: -5, opacity: 0.4, rotate: 20 },
  { left: '25%', size: 50, duration: 25, delay: -15, opacity: 0.5, rotate: -15 },
  { left: '40%', size: 70, duration: 35, delay: -10, opacity: 0.35, rotate: 30 },
  { left: '55%', size: 55, duration: 28, delay: -20, opacity: 0.45, rotate: -25 },
  { left: '70%', size: 65, duration: 32, delay: -8,  opacity: 0.4, rotate: 15 },
  { left: '85%', size: 50, duration: 27, delay: -12, opacity: 0.5, rotate: -20 },
  { left: '5%',  size: 55, duration: 33, delay: -18, opacity: 0.42, rotate: 10 },
  { left: '90%', size: 60, duration: 29, delay: -3,  opacity: 0.38, rotate: -30 },
  { left: '15%', size: 45, duration: 26, delay: -25, opacity: 0.3, rotate: 45 },
  { left: '35%', size: 75, duration: 38, delay: -30, opacity: 0.25, rotate: -10 },
  { left: '65%', size: 52, duration: 31, delay: -7,  opacity: 0.4, rotate: 25 },
  { left: '80%', size: 58, duration: 34, delay: -22, opacity: 0.35, rotate: -35 },
  
  // Additional 12 footballs to double the amount
  { left: '12%', size: 48, duration: 36, delay: -40, opacity: 0.32, rotate: 60 },
  { left: '27%', size: 62, duration: 24, delay: -35, opacity: 0.47, rotate: -40 },
  { left: '42%', size: 53, duration: 31, delay: -28, opacity: 0.38, rotate: 80 },
  { left: '58%', size: 67, duration: 29, delay: -45, opacity: 0.43, rotate: -55 },
  { left: '73%', size: 49, duration: 33, delay: -16, opacity: 0.36, rotate: 25 },
  { left: '88%', size: 71, duration: 26, delay: -32, opacity: 0.41, rotate: -75 },
  { left: '8%',  size: 59, duration: 37, delay: -50, opacity: 0.29, rotate: 90 },
  { left: '93%', size: 44, duration: 28, delay: -8,  opacity: 0.46, rotate: -45 },
  { left: '18%', size: 66, duration: 35, delay: -38, opacity: 0.33, rotate: 110 },
  { left: '38%', size: 54, duration: 30, delay: -55, opacity: 0.39, rotate: -65 },
  { left: '68%', size: 61, duration: 32, delay: -12, opacity: 0.37, rotate: 130 },
  { left: '83%', size: 47, duration: 34, delay: -42, opacity: 0.44, rotate: -85 },
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
          {/* Main brown oval body of the football - brighter, more visible brown */}
          <ellipse cx="50" cy="30" rx="48" ry="26" fill="#A0522D" />

          {/* Individual shorter vertical stitches (now slightly longer) */}
          {[35, 38, 41, 44, 47, 50, 53, 56, 59, 62, 65].map((x, i) => (
              // Changed y coordinates from 27/33 to 26/34 for slightly more length
              <path key={`stitch-${i}`} d={`M${x} 26 Q${x} 30 ${x} 34`} stroke="#fff" strokeWidth="1.5" fill="none" />
          ))}

          {/* The long bisecting lace - a single, slightly curved horizontal line */}
          <path d="M32 30 A 60 10 0 0 1 68 30" stroke="#fff" strokeWidth="2.5" fill="none" />

          {/* Optional: Tiny dots for the lace holes where the long lace would go through the small stitches */}
          <circle cx="32" cy="30" r="0.7" fill="#fff" />
          <circle cx="37" cy="30" r="0.7" fill="#fff" />
          <circle cx="42" cy="30" r="0.7" fill="#fff" />
          <circle cx="47" cy="30" r="0.7" fill="#fff" />
          <circle cx="52" cy="30" r="0.7" fill="#fff" />
          <circle cx="57" cy="30" r="0.7" fill="#fff" />
          <circle cx="62" cy="30" r="0.7" fill="#fff" />
          <circle cx="68" cy="30" r="0.7" fill="#fff" />

        </svg>
      ))}
    </div>
  );
}