import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Typography, Button, Card, CardMedia, Grid } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faTwitter, faReddit, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import './App.css'
import { LazyImage, optimizePlayerImageUrl } from './components/LazyImage';

function getSessionId() {
  let id = localStorage.getItem('sessionId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('sessionId', id);
  }
  return id;
}

const sessionId = getSessionId();

async function trackEvent(eventType, eventData) {
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType,
        eventData,
        sessionId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      }),
    });
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}

const gameData = [
	{
		images: [
		  {	src: 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/13256.png', name: 'Jason Pierre-Paul' },
		  { src: 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/1433.png', name: 'Randy Moss' },
			{ src: 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/15705.png', name: 'Josh Gordon' },
		],
		answer: 'Tom Brady',
	},
	{
		images: [
			'https://example.com/players/randy-moss.jpg',
			'https://example.com/players/brady.jpg',
			'https://example.com/players/welker.jpg',
		],
		answer: 'New England Patriots',
	},
];

function CommonPlayerGame() {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [userAnswer, setUserAnswer] = useState('');
	const [isCorrect, setIsCorrect] = useState(null);
	const [attemptsLeft, setAttemptsLeft] = useState(4);
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());

  // Track session start
  useEffect(() => {
    trackEvent('session_start', {});
    setSessionStartTime(Date.now());

    // Track activity every 30 seconds
    const activityInterval = setInterval(() => {
      trackEvent('activity', {
        timeElapsed: Math.floor((Date.now() - sessionStartTime) / 1000)
      });
    }, 30000); // 30 seconds

    // Track session end on page unload
    const handleBeforeUnload = () => {
      const timeSpent = Math.floor((Date.now() - sessionStartTime) / 1000);
      const completed = currentIndex >= gameData.length - 1 && isCorrect === true;

      trackEvent('session_end', {
        timeSpent,
        completed,
        questionsCompleted: currentIndex
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(activityInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, []);

  // Track question views
  useEffect(() => {
    trackEvent('question_viewed', {
      questionIndex: currentIndex
    });
    setQuestionStartTime(Date.now());
  }, [currentIndex]);

  // Track user activity
  const trackActivity = () => {
    setLastActivityTime(Date.now());
  };

  // Tracking state
  const [gameSessionId, setGameSessionId] = useState(null);
  const gameStartTimeRef = useRef(null);
  const questionStartTimeRef = useRef(null);
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState(0);
  const [totalCorrectAnswers, setTotalCorrectAnswers] = useState(0);
  const [currentAttempt, setCurrentAttempt] = useState(1);

  // Track game start
  useEffect(() => {
    async function startGameTracking() {
      gameStartTimeRef.current = new Date();

      // Track game started event
      await trackEvent('game_started', {
        gameId: 'common_player',
        gameName: 'Common Player Game',
      });
    }

    startGameTracking();

    // Track game end when component unmounts or user leaves
    return () => {
      if (gameStartTimeRef.current) {
        const endTime = new Date();
        const durationSeconds = (endTime - gameStartTimeRef.current) / 1000;

        trackEvent('game_ended', {
          gameId: 'common_player',
          durationSeconds: durationSeconds.toFixed(2),
          questionsAttempted: totalQuestionsAnswered,
          questionsCorrect: totalCorrectAnswers,
        });
      }
    };
  }, [totalQuestionsAnswered, totalCorrectAnswers]);

  // Track question changes and periodic session pings
  useEffect(() => {
    // Track new question started
    questionStartTimeRef.current = new Date();
    trackEvent('question_started', {
      gameId: 'common_player',
      questionIndex: currentIndex,
    });

    // Reset attempt counter for new question
    setCurrentAttempt(1);

    // Set up periodic session ping (every 30 seconds)
    const pingInterval = setInterval(() => {
      trackEvent('session_ping', {});
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [currentIndex]);

	const currentQuestion = gameData[currentIndex];

	const handleSubmit = () => {
  const normalized = userAnswer.trim().toLowerCase();
  const correct = currentQuestion.answer.trim().toLowerCase();

  // Calculate time spent on this question
  const timeToAnswer = Math.floor((Date.now() - questionStartTime) / 1000);

  const wasCorrect = normalized === correct;

  // Calculate time spent on this question
  const timeSpentSeconds = questionStartTimeRef.current
    ? (new Date() - questionStartTimeRef.current) / 1000
    : 0;

  // Track answer submission with all details
  trackEvent('answer_submitted', {
    gameId: 'common_player',
    gameSessionId: gameSessionId,
    questionIndex: currentIndex,
    userAnswer,
    correctAnswer: currentQuestion.answer,
    isCorrect: wasCorrect,
    attemptNumber: currentAttempt,
    attemptsLeft,
    timeToAnswer,
  });

  if (wasCorrect) {
    setIsCorrect(true);
    setTotalQuestionsAnswered(prev => prev + 1);
    setTotalCorrectAnswers(prev => prev + 1);
  } else {
    const newAttempts = attemptsLeft - 1;
    setAttemptsLeft(newAttempts);
    setIsCorrect(false);
    setCurrentAttempt(prev => prev + 1);

    if (newAttempts === 0) {
      // Track drop-off if user runs out of attempts
      trackEvent('drop_off', {
        questionIndex: currentIndex,
        reason: 'out_of_attempts'
      });
    }
  }
};

	const handleNext = () => {
		setCurrentIndex((prev) => (prev + 1) % gameData.length);
		setUserAnswer('');
		setIsCorrect(null);
		setAttemptsLeft(4);
		setCurrentAttempt(1);
		// Question timer will reset in the useEffect hook
	};

	// Add this function to handle share tracking
	function handleShare(platform) {
		trackEvent('shared', {
      platform,
      questionIndex: currentIndex
    });
	}

	return (
		<Box
			sx={{
				minHeight: '100vh', // Full viewport height
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				padding: 4,
				color: 'white',
				fontSize: '50px',
				backgroundColor: '#964b00', // Optional: match your CSS
				backgroundImage: 'url("https://www.transparenttextures.com/patterns/basketball.png")', // Optional: match your CSS
			}}
		>
			<LazyImage
				src="https://static.www.nfl.com/image/upload/v1554321393/league/nvfr7ogywskqrfaiu38m.svg"
				alt="NFL Logo"
				width={300}
				height={250}
				style={{ marginBottom: 16 }}
			/>
			<Typography
  variant="h4"
  gutterBottom
  sx={{
    color: '#C0C0C0',
    fontWeight: 'bold',
    fontSize: '65px',
    WebkitTextStroke: '4px black'
  }}
>
  Who is the Common Player?
</Typography>

			<Grid container spacing={2} justifyContent="center">
				{currentQuestion.images.map((player, idx) => (
					<Grid item key={idx}>
						<Card sx={{ maxWidth: 200, minHeight: 280 }}>
							<LazyImage
								src={optimizePlayerImageUrl(player.src, 200)}
								alt={player.name}
								width={200}
								height={200}
								style={{ objectFit: 'cover' }}
							/>
							<CardContent>
								<Typography
									variant="subtitle1"
									sx={{
										textAlign: 'center',
										fontWeight: 'bold',
										color: 'text.primary'
									}}
								>
									{player.name}
								</Typography>
							</CardContent>
						</Card>
					</Grid>
				))}
			</Grid>

			<Box
				sx={{
					marginTop: 4,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: 2,
				}}
			>
				<TextField
					label="Your Answer"
					variant="outlined"
					value={userAnswer}
					onChange={(e) => setUserAnswer(e.target.value)}
					sx={{ width: '300px', bgcolor: 'white', borderRadius: '8px', boxShadow: 5 }}
					disabled={isCorrect || attemptsLeft === 0}
				/>
		<Button
			variant="contained"
			color="primary"
			onClick={handleSubmit}
			disabled={isCorrect || attemptsLeft === 0}
			sx={{
				width: '150px',
				backgroundColor:
					isCorrect === true
						? 'green'
						: isCorrect === false
						? 'blue'
						: 'white',
				'&:hover': {
					backgroundColor:
						isCorrect === true
							? 'darkgreen'
							: isCorrect === false
							? 'darkblue'
							: '#f0f0f0',
				},
				borderRadius: '8px',
				padding: '10px 20px',
				fontSize: '16px',
				fontWeight: 'bold',
				justifyContent: 'center',
				color: isCorrect === null ? 'black' : 'white',
			}}
		>
			Submit
		</Button>

		{isCorrect && (
			<Button
				variant="contained"
				color="success"
				onClick={handleNext}
				sx={{
					width: '150px',
					backgroundColor: 'orange',
					'&:hover': {
						backgroundColor: 'darkorange',
					},
					borderRadius: '8px',
					padding: '10px 20px',
					fontSize: '16px',
					fontWeight: 'bold',
					color: 'white',
				}}
			>
				Next Question
			</Button>
		)}
			</Box>

			<Typography sx={{ marginTop: 1, color: '#C0C0C0', fontSize: '20px', fontWeight: 'bold', WebkitTextStroke: '0.5px black' }}>
				Attempts Left: {attemptsLeft}
			</Typography>

			{isCorrect !== null && (
				<Typography
					variant="h6"
					sx={{ marginTop: 2, color: isCorrect ? 'green' : 'red' }}
				>
					{isCorrect ? 'Correct!' : 'Incorrect. Try again.'}
				</Typography>
			)}

			{/* --- Social Share Buttons --- */}
			<Box sx={{ marginTop: 4, display: 'flex', gap: 2 }}>
				<a
					href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
					target="_blank"
					rel="noopener noreferrer"
					style={{ textDecoration: 'none' }}
					onClick={() => handleShare('facebook')}
				>
					<Button variant="contained" sx={{ backgroundColor: '#4267B2', color: 'white' }}>
						<FontAwesomeIcon icon={faFacebook} style={{ marginRight: '8px' }} />
						Facebook
					</Button>
				</a>
				<a
					href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=Check%20out%20this%20NFL%20Teammates%20Game!`}
					target="_blank"
					rel="noopener noreferrer"
					style={{ textDecoration: 'none' }}
					onClick={() => handleShare('twitter')}
				>
					<Button variant="contained" sx={{ backgroundColor: '#1DA1F2', color: 'white' }}>
						<FontAwesomeIcon icon={faTwitter} style={{ marginRight: '8px' }} />
						Twitter
					</Button>
				</a>
				<a
					href={`https://www.reddit.com/submit?url=${encodeURIComponent(window.location.href)}&title=Check%20out%20this%20NFL%20Teammates%20Game!`}
					target="_blank"
					rel="noopener noreferrer"
					style={{ textDecoration: 'none' }}
					onClick={() => handleShare('reddit')}
				>
					<Button variant="contained" sx={{ backgroundColor: '#FF4500', color: 'white' }}>
						<FontAwesomeIcon icon={faReddit} style={{ marginRight: '8px' }} />
						Reddit
					</Button>
				</a>
				<a
					href={`https://wa.me/?text=${encodeURIComponent('Check out this NFL Teammates Game! ' + window.location.href)}`}
					target="_blank"
					rel="noopener noreferrer"
					style={{ textDecoration: 'none' }}
					onClick={() => handleShare('whatsapp')}
				>
					<Button variant="contained" sx={{ backgroundColor: '#25D366', color: 'white' }}>
						<FontAwesomeIcon icon={faWhatsapp} style={{ marginRight: '8px' }} />
						WhatsApp
					</Button>
				</a>
			</Box>
		</Box>
	);
}

function PlayerList({ players }) {
  return (
    <div>
      <h1>Players</h1>
      <ul>
        {players.map((player, index) => (
          <li key={index}>
            {player.name} - {player.email}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function App() {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const response = await fetch('/api/getPlayers');
        const data = await response.json();
        setPlayers(data);
      } catch (error) {
        console.error('Error fetching players:', error);
      }
    }

    fetchPlayers();
  }, []);

  return (
    <div>
      <CommonPlayerGame />
      <PlayerList players={players} />
    </div>
  );
}
