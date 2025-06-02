import React, { useState } from 'react';
import { Box, TextField, Typography, Button, Card, CardMedia, Grid } from '@mui/material';
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
				style={{ width: 240, height: 200, marginBottom: 4 }}
			/>
			<Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 'bold', fontSize: '50' }}>
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
            backgroundColor: isCorrect ? 'green' : 'blue',
            '&:hover': {
              backgroundColor: isCorrect ? 'darkgreen' : 'darkblue',
            },
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '16px',
            fontWeight: 'bold',
			justifyContent: 'center',

           }}
				>
					Submit
				</Button>
			</Box>

			<Typography sx={{ marginTop: 1 }}>
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
		</Box>
	);
}
