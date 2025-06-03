import React, { useState } from 'react';
import { Box, TextField, Typography, Button, Card, CardMedia, Grid } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faTwitter, faReddit, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import './App.css'

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

export default function CommonPlayerGame() {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [userAnswer, setUserAnswer] = useState('');
	const [isCorrect, setIsCorrect] = useState(null);
	const [attemptsLeft, setAttemptsLeft] = useState(4);

	const currentQuestion = gameData[currentIndex];

	const handleSubmit = () => {
		const normalized = userAnswer.trim().toLowerCase();
		const correct = currentQuestion.answer.trim().toLowerCase();

		if (normalized === correct) {
			setIsCorrect(true);
		} else {
			const newAttempts = attemptsLeft - 1;
			setAttemptsLeft(newAttempts);
			setIsCorrect(false);
			if (newAttempts === 0) {
				// Optionally lock input if you want
			}
		}
	};

	const handleNext = () => {
		setCurrentIndex((prev) => (prev + 1) % gameData.length);
		setUserAnswer('');
		setIsCorrect(null);
		setAttemptsLeft(4);
	};

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
			<img
				src="https://static.www.nfl.com/image/upload/v1554321393/league/nvfr7ogywskqrfaiu38m.svg"
				alt="NFL Logo"
				style={{ width: 300, height: 250, marginBottom: 4 }}
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
						<Card sx={{ maxWidth: 200 }}>
							<CardMedia
								component="img"
								image={player.src}
								alt={player.name}
							/>
							<Typography
								variant="subtitle1"
								sx={{ textAlign: 'center', padding: 1 }}
							>
								{player.name}
							</Typography>
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
