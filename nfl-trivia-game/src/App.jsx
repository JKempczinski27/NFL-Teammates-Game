import React, { useState, useEffect, useRef } from 'react';
import playmakerImages from '../playmakerImages';
import { Grid, Button, Typography, Card, CardContent, Avatar, Box, TextField } from '@mui/material';
import { IoLogoFacebook, IoLogoTwitter } from 'react-icons/io';
import html2canvas from 'html2canvas';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import PrivacyConsent from './components/PrivacyConsent';


const nflTeams = [
  "Arizona Cardinals", "Atlanta Falcons", "Baltimore Ravens", "Buffalo Bills",
  "Carolina Panthers", "Chicago Bears", "Cincinnati Bengals", "Cleveland Browns",
  "Dallas Cowboys", "Denver Broncos", "Detroit Lions", "Green Bay Packers",
  "Houston Texans", "Indianapolis Colts", "Jacksonville Jaguars", "Kansas City Chiefs",
  "Las Vegas Raiders", "Los Angeles Chargers", "Los Angeles Rams", "Miami Dolphins",
  "Minnesota Vikings", "New England Patriots", "New Orleans Saints", "New York Giants",
  "New York Jets", "Philadelphia Eagles", "Pittsburgh Steelers", "San Francisco 49ers",
  "Seattle Seahawks", "Tampa Bay Buccaneers", "Tennessee Titans", "Washington Commanders"
];

const teamColors = {
  "Miami Dolphins": { default: "bg-[#008E97] hover:bg-[#FC4C02]" },
  "Seattle Seahawks": { default: "bg-[#002244] hover:bg-[#69be28]" },
  "New York Jets": { default: "bg-[#115740] hover:bg-black" },
  "Jacksonville Jaguars": { default: "bg-[#006778] hover:bg-[#D7A22A]" },
  "Atlanta Falcons": { default: "bg-[#A71930] hover:bg-black" },
  "Arizona Cardinals": { default: "bg-[#97233F] hover:bg-[#A5ACAF]" },
  "Houston Texans": { default: "bg-[#EB0028] hover:bg-[#021018]" },
  "Minnesota Vikings": { default: "bg-[#4F2683] hover:bg-[#FFC62F]" },
  "Denver Broncos": { default: "bg-[#0A2343] hover:bg-[#FC4C02]" },
  "Detroit Lions": { default: "bg-[#0076B6] hover:bg-[#B0B7BC]" },
  "Philadelphia Eagles": { default: "bg-[#004851] hover:bg-[#A2AAAD]" },
  "Cleveland Browns": { default: "bg-[#FF3C00] hover:bg-[#311D00]" },
  "Tennessee Titans": { default: "bg-[#4B92DB] hover:bg-[#C60C30]" },
  "San Francisco 49ers": { default: "bg-[#AA0000] hover:bg-[#B3995D]" },
  "Baltimore Ravens": { default: "bg-[#24135F] hover:bg-black" },
  "Buffalo Bills": { default: "bg-[#0038D] hover:bg-[#C60C30]" },
  "Carolina Panthers": { default: "bg-[#0085CF] hover:bg-[#B2B4BB]" },
  "Chicago Bears": { default: "bg-[#0B162A] hover:bg-[#E64100]" },
  "Cincinnati Bengals": { default: "bg-black hover:bg-[#FB4F14]" },
  "Dallas Cowboys": { default: "bg-[#002244] hover:bg-[#B0B7BC]" },
  "Green Bay Packers": { default: "bg-[#203731] hover:bg-[#FFB612]" },
  "Indianapolis Colts": { default: "bg-[#013369] hover:bg-white" },
  "Kansas City Chiefs": { default: "bg-[#E31837] hover:bg-[#FFB612]" },
  "Las Vegas Raiders": { default: "bg-black hover:bg-[#A5ACAF]" },
  "Los Angeles Chargers": { default: "bg-[#0080C6] hover:bg-[#FFC20E]" },
  "Los Angeles Rams": { default: "bg-[#003594] hover:bg-[#FFD100]" },
  "New England Patriots": { default: "bg-[#002244] hover:bg-[#C60C30]" },
  "New Orleans Saints": { default: "bg-black hover:bg-[#D3BC8D]" },
  "New York Giants": { default: "bg-[#0B2265] hover:bg-[#A71930]" },
  "Pittsburgh Steelers": { default: "bg-black hover:bg-[#FFB612]" },
  "Tampa Bay Buccaneers": { default: "bg-[#A71930] hover:bg-[#322F2B]" },
  "Washington Commanders": { default: "bg-[#5A1414] hover:bg-[#FFB612]" }
};

const playmakers = {
  "Buffalo Bills": ["James Cook", "Amari Cooper"],
  "Miami Dolphins": ["De'Von Achane", "Tyreek Hill"],
  "New England Patriots": ["Rhamondre Stevenson", "Stefon Diggs"],
  "San Francisco 49ers": ["Christian McCafrey", "George Kittle"],
  "Baltimore Ravens": ["Derrick Henry", "Zay Flowers"],
  "New York Giants": ["Devin Singletary", "Malik Nabers"],
  "New York Jets": ["Breece Hall", "Garrett Wilson"],
  "Green Bay Packers": ["Josh Jacobs", "Christian Watson"],
  "Atlanta Falcons": ["Bijan Robinson", "Drake London"],
  "Los Angeles Rams": ["Kyren Williams", "Puka Nacua"],
  "Los Angeles Chargers": ["J.K. Dobbins", "Ladd McConkey"],
  "Jacksonville Jaguars": ["Travis Etienne", "Brian Thomas"],
  "Detroit Lions": ["Jahmyr Gibbs", "Amon-Ra St.Brown"],
  "Kansas City Chiefs": ["Kareem Hunt", "Travis Kelce"],
  "Pittsburgh Steelers": ["D.K. Metcalf", "George Pickens"],
  "Indianapolis Colts": ["Jonathan Taylor", "Alec Pierce"],
  "Arizona Cardinals": ["James Conner", "Marvin Harrison Jr."],
  "Cincinnati Bengals": ["Chase Brown", "Ja'Marr Chase"],
  "Las Vegas Raiders": ["Alexander Mattison", "Brock Bowers"],
  "Tampa Bay Buccaneers": ["Bucky Irving", "Mike Evans"],
  "Washington Commanders": ["Brian Robinson Jr.", "Terry McLaurin"],
  "Chicago Bears": ["D'Andre Swift", "DJ Moore"],
  "Carolina Panthers": ["Chuba Hubbard", "Adam Thielen"],
  "Dallas Cowboys": ["Javonte Williams", "CeeDee Lamb"],
  "Denver Broncos": ["Audric Estime", "Courtland Sutton"],
  "Houston Texans": ["Joe Mixon", "Nico Collins"],
  "Minnesota Vikings": ["Aaron Jones", "Justin Jefferson"],
  "New Orleans Saints": ["Alvin Kamara", "Chris Olave"],
  "Philadelphia Eagles": ["Saquon Barkley", "A.J. Brown"],
  "Seattle Seahawks": ["Kenneth Walker", "Jaxon Smith-Njigba"],
  "Tennessee Titans": ["Tony Pollard", "Calvin Ridley"],
  "Cleveland Browns": ["Nick Chubb", "Jerry Jeudy"]                          
};

const questions = {
  "Hand-off": [
    { question: "How many points is a touchdown worth?", choices: ["3 points", "5 points", "6 points", "7 points"], answer: "6 points" },
    { question: "Who is the NFL All-Time Rushing Yards Leader?", choices: ["Saqoun Barkley", "Emmitt Smith", "LaDainian Tomlinson", "Jim Brown"], answer: "Emmitt Smith"},
    { question: "Who does Joe Burrow play for?", choices: ["Cincinnati Bengals", "New York Giants", "Chicago Bears", "Philadelphia Eagles"], answer: "Cincinnati Bengals"},
    { question: "Tom Brady won 6 Super Bowls with which team?", choices: ["Houston Texans", "New England Patriots", "New York Jets", "Tampa Bay Buccaneers"], answer: "New England Patriots"}
  ],
  "Check-Down": [
    { question: "Where is the Pro Football Hall of Fame located?", choices: ["Springfield, Massachusetts", "Cooperstown, New York", "Canton, Ohio", "Indianapolis, Indiana"], answer: "Canton, Ohio" },
    { question: "Which former Browns running back was on the cover of Madden 12?", choices: ["Peyton Hillis", "Trent Richardson", "Jamal Lewis", "William Green"], answer: "Peyton Hillis"},
    { question: "Which stadium holds the attendance record for a regular season game?", choices: ["AT&T Stadium", "MetLife Field", "Arrowhead Stadium", "Northwest Stadium"], answer: "AT&T Stadium"},
    { question: "In the 2024 NFL Combine, Xavier Worthy set a new 40-yard dash record. Who held the record before him?", choices: ["Deion Sanders", "John Ross", "Chris Johnson", "Tyreek Hill"], answer:"John Ross"}
  ],
  "Hail-Mary": [
    { question: "Which 2010 Pro Bowl quarterback never started a game in college?", choices: ["Matt Cassel", "Sam Bradford", "Matthew Stafford", "Ryan Fitzpatrick"], answer: "Matt Cassel" },
    { question: "Which NFL quarterback threw for over 5,000 yards in a season and was not selected for the Pro Bowl?", choices: ["Dan Marino", "Matt Ryan", "Brett Favre", "Matthew Stafford"], answer: "Matthew Stafford" },
    { question: "Which former NFL MVP quarterback began his college career as a tight end?", choices: ["Kurt Warner", "Joe Theismann", "Josh Allen", "Steve McNair"], answer: "Joe Theismann"},
    { question: "Which former NFL Offensive Lineman holds the record for the longest kick return by a lineman?", choices: ["Dan Connolly", "Jonathan Ogden", "Joe Thomas", "Shaq Mason"], answer: "Dan Connolly"}
  ]
};

const timeLimits = {
  "Hand-off": 12000,  // 12 seconds
  "Check-Down": 9000, // 9 seconds
  "Hail-Mary": 6000    // 6 seconds
};

const scoreMap = {
  "Hand-off": { correct: 5, incorrect: -1 },
  "Check-Down": { correct: 15, incorrect: -6 },
  "Hail-Mary": { correct: 25, incorrect: -15 }
};

const teamLogos = {
  "Arizona Cardinals": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/ARI",
  "Atlanta Falcons": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/ATL",
  "Baltimore Ravens": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/BAL",
  "Buffalo Bills": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/BUF",
  "Carolina Panthers": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/CAR",
  "Chicago Bears": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/CHI",
  "Cincinnati Bengals": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/CIN",
  "Cleveland Browns": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/CLE",
  "Dallas Cowboys": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/DAL",
  "Denver Broncos": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/DEN",
  "Detroit Lions": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/DET",
  "Green Bay Packers": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/GB",
  "Houston Texans": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/HOU",
  "Indianapolis Colts": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/IND",
  "Jacksonville Jaguars": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/JAX",
  "Kansas City Chiefs": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/KC",
  "Las Vegas Raiders": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/LV",
  "Los Angeles Chargers": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/LAC",
  "Los Angeles Rams": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/LAR",
  "Miami Dolphins": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/MIA",
  "Minnesota Vikings": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/MIN",
  "New England Patriots": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/NE",
  "New Orleans Saints": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/NO",
  "New York Giants": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/NYG",
  "New York Jets": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/NYJ",
  "Philadelphia Eagles": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/PHI",
  "Pittsburgh Steelers": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/PIT",
  "San Francisco 49ers": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/SF",
  "Seattle Seahawks": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/SEA",
  "Tampa Bay Buccaneers": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/TB",
  "Tennessee Titans": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/TEN",
  "Washington Commanders": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/WAS"
}


const TeamSelection = () => {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedPlaymaker, setSelectedPlaymaker] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [yards, setYards] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answerFeedback, setAnswerFeedback] = useState(null);
  const [showFeedbackPage, setShowFeedbackPage] = useState(false); // New state for feedback page
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [askedQuestions, setAskedQuestions] = useState([]);
  const [timer, setTimer] = useState(null);
  const [playerSaved, setPlayerSaved] = useState(false);

  useEffect(() => {
    if (currentQuestion && difficulty) {
      // Clear any existing timer

      // Set a new timer for the current question
      timerRef.current = setTimeout(() => {
        console.log('Timer expired, auto-answering...');
        handleAnswer(''); // Auto-answer with an empty choice
      }, timeLimits[difficulty]);

      setTimer(timerRef.current);

      return () => {
        // Cleanup timer on unmount or when question changes
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [currentQuestion, difficulty]);
  const [showTitle, setShowTitle] = useState(true);
  const [userData, setUserData] = useState({ name: '', email: '' });
  const [userList, setUserList] = useState([]); // New state for storing user list
  const timerRef = useRef(null);

  useEffect(() => {
    if (timer) clearTimeout(timer);
  }, [timer]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'name' || name === 'email') {
      setUserData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleStart = () => {
    if (userData.name && userData.email) {
      setShowTitle(false);
      setUserList((prevList) => [...prevList, userData]);
      console.log('User Data:', userData);
    } else {
      alert('Please enter your name and email to proceed.');
    }
  };
  

  const handleAnswer = (choice, wasTimedOut = false) => {
    if (!currentQuestion) return;
  
    // Clear the timer when an answer is selected or time runs out
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  
    const correct = choice === currentQuestion.answer;
  
    const feedback = correct
      ? 'Correct!'
      : wasTimedOut
      ? `Time's up! Correct Answer: ${currentQuestion.answer}`
      : `Incorrect! Correct Answer: ${currentQuestion.answer}`;
  
    setYards((prevYards) =>
      prevYards + (correct ? scoreMap[difficulty].correct : scoreMap[difficulty].incorrect)
    );
  
    setAnswerFeedback(feedback);
    setShowFeedbackPage(true); // Show feedback page
  };
  

  const handleNextQuestion = () => {
    setAnswerFeedback(null);
    setShowFeedbackPage(false); // Hide feedback page
    setDifficulty(null);
    setCurrentQuestion(null);
    setQuestionIndex((prevIndex) => prevIndex + 1);
  };

  const handleSelectDifficulty = (level) => {
    if (questionIndex >= 4) return; // Stop after 4 questions

    setDifficulty(level);

    const availableQuestions = questions[level].filter((q) => !askedQuestions.includes(q.question));

    const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];

    setCurrentQuestion(randomQuestion);
    setAskedQuestions((prev) => [...prev, randomQuestion.question]);

    // Clear any existing timer
    if (timerRef.current) {
      console.log('Clearing existing timer:', timerRef.current);
      clearTimeout(timerRef.current);
    }

    // Set a new timer
    timerRef.current = setTimeout(() => {
      console.log('Timer expired, auto-answering...');
      handleAnswer('', true); // Auto-answer with an empty choice and mark as timed out
    }, timeLimits[level]);

    console.log('Setting new timer:', timerRef.current);
  };

  useEffect(() => {
    if (
      questionIndex >= 4 &&
      userData.name &&
      userData.email &&
      selectedTeam &&
      !playerSaved
    ) {
      console.log('🧾 Sending player to backend:', {
        name: userData.name,
        email: userData.email,
        team: selectedTeam,
        score: yards,
      });
  
      fetch(`${import.meta.env.VITE_API_URL}/api/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          team: selectedTeam,
          score: yards,
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to save player');
          return res.json();
        })
        .then((data) => {
          console.log('✅ Player saved:', data);
          setPlayerSaved(true); // Mark player as saved
        })
        .catch((err) => console.error('❌ Error saving player:', err));
    }
  }, [questionIndex, playerSaved, userData, selectedTeam, yards]);

  const handleCaptureScoreImage = async () => {
    const node = document.getElementById('score-capture');
    if (!node) return;
  
    try {
      // 1. Generate canvas
      const canvas = await html2canvas(node);
      const dataUrl = canvas.toDataURL('image/png');
  
      // 2. Convert to Blob
      const blob = await (await fetch(dataUrl)).blob();
  
      // 3. Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', blob);
      formData.append('upload_preset', 'long_drive'); // Replace with your unsigned preset
  
      const response = await fetch('https://api.cloudinary.com/v1_1/dvju3ssth/image/upload', {
        method: 'POST',
        body: formData,
      });
  
      const data = await response.json();
  
      if (data.secure_url) {
        // 4. Generate tweet link with image
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          `I scored ${yards} yards on NFL Long Drive! 🏈🔥 Can you beat me?`
        )}&url=${encodeURIComponent(data.secure_url)}`;
  
        window.open(tweetUrl, '_blank');
      } else {
        console.error('Upload failed:', data);
      }
    } catch (err) {
      console.error('❌ Error capturing or uploading image:', err);
    }
  };

  if (questionIndex >= 4) {
    return (
      <Box
        id="score-capture"
        sx={{
          textAlign: 'center',
          bgcolor: '#013369',
          color: 'white',
          padding: 4,
          minHeight: '100vh',
          minWidth: '100vw',
        }}
      >
        {/* Game Over Message */}
        <Typography variant="h3" sx={{ marginTop: 4 }}>
          Game Over! Total Yards: {yards}
        </Typography>

        {/* NFL Logo */}
        <img
          src="https://static.www.nfl.com/image/upload/v1554321393/league/nvfr7ogywskqrfaiu38m.svg"
          alt="NFL Logo"
          style={{ width: '400px', height: '300px', marginTop: '20px' }}
        />

        {/* Buttons Section */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mt: 4, // optional spacing from top
          }}
        >
          {/* Share on Facebook Button */}
          <Button
            startIcon={<IoLogoFacebook />}
            sx={{
              color: 'black',
              borderColor: 'white',
              bgcolor: 'white',
              mb: 2,
            }}
            component="a"
            href="https://facebook.com/sharer/sharer.php?u=https://nfl-game-trivia-project.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Share on Facebook
          </Button>

          {/* Capture & Share Score Button */}
          <Button
            variant="contained"
            onClick={handleCaptureScoreImage}
            startIcon={<IoLogoTwitter />}
            sx={{
              bgcolor: 'white',
              color: '#013369',
            }}
          >
            Share on Twitter
          </Button>
        </Box>
      </Box>
    );
  }

  if (showFeedbackPage) {
    return (
      <Box sx={{ alignItems: 'center',textAlign: 'center', bgcolor: '#013369', color: 'white', padding: 4, minHeight: '100vh', minWidth: '100vw' }}>
      <Typography variant="h3" sx={{ display: 'block' }}>{answerFeedback}</Typography>
      {!answerFeedback.includes('Correct') && (
        <Typography variant="h5" sx={{ mt: 2, display: 'block' }}>
        <br></br>Correct Answer: {currentQuestion.answer}
        </Typography>
      )}
      <Button
        variant="contained"
        onClick={handleNextQuestion}
        sx={{ mt: 3, bgcolor: 'white', color: '#013369', borderStyle: 'solid', borderWidth: 4, borderColor: '#d50a0a' }}
      >
        Next Question
      </Button>
      <Box sx={{ mt: 4 }}></Box>
      <img
        src="https://static.www.nfl.com/image/upload/v1554321393/league/nvfr7ogywskqrfaiu38m.svg"
        alt="NFL Logo"
        style={{ width: '400px', height: '300px', marginBottom: 4 }}
      />
      </Box>
    );
  }
  if (showTitle) {
    return (
      <Box sx={{ 
      textAlign: 'center', 
      padding: 4, 
      bgcolor: '#013369',
      width: '100vw',
      color: 'white', 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'LimeLight, cursive',
      }}>
      <img
      src="https://static.www.nfl.com/image/upload/v1554321393/league/nvfr7ogywskqrfaiu38m.svg"
      alt="NFL Logo"
      style={{ width: '200px', height: '150px', marginBottom: '20px' }}
      />
      <Typography variant="h2" className="mogra-regular">
      <b>Welcome to Long Drive!</b>
      </Typography>
      <Typography variant="body2" sx={{ mt: 2, fontSize: '14px', maxWidth: '400px' }}>
      The new NFL trivia game where you get to be the QB. Chooose your favorite team and playmaker, then answer questions to gain yards. The more difficult the question, the more yards you can gain! But like any NFL play, you can risk losing yards if you answer incorrectly and or get sacked. The tougher the question, the less time you have to answer. The choice is yours. Good Luck!
      </Typography>
      <TextField 
      variant="filled" 
      name="name" 
      label="Your Name" 
      value={userData.name} 
      onChange={handleInputChange} 
      sx={{ mt: 3, bgcolor: 'white', width: '300px', borderStyle: 'solid', borderWidth: 4, borderColor: '#d50a0a' }} 
      />
      <TextField 
      variant="filled" 
      name="email" 
      label="Email" 
      type="email" 
      value={userData.email} 
      onChange={handleInputChange} 
      sx={{ mt: 2, bgcolor: 'white', width: '300px', borderStyle: 'solid', borderWidth: 4, borderColor: '#d50a0a' }} 
      />
      <Button 
      variant="contained" 
      onClick={handleStart} 
      sx={{ mt: 3, width: '300px', bgcolor: 'white', color: '#013369', borderStyle: 'solid', borderWidth: 4, borderColor: '#d50a0a' }}
      >
      <b>Start Playing!</b>
      </Button>

      {/* Display the list of users */}
      {userList.length > 0 && (
      <Box sx={{ mt: 4, bgcolor: 'white', color: '#013369', padding: 2, borderRadius: 2 }}>
      <Typography variant="h5">Registered Users:</Typography>
      <ul>
      {userList.map((user, index) => (
      <li key={index}>
      {user.name} ({user.email})
      </li>
      ))}
      </ul>
      </Box>
      )}
      <PrivacyConsent />
      </Box>
    );
  }

  return (
    <Box sx={{ textAlign: 'center', bgcolor: '#013369', color: 'white', padding: 4, minHeight: '100vh', minWidth: '100vw' }}>
      {answerFeedback && <Typography variant="h3">{answerFeedback}</Typography>}

      {!selectedTeam ? (
        <>
          <Typography variant="h4" sx={{ marginBottom: 4 }}>Choose Your Team</Typography>
          <Grid container spacing={2} justifyContent="center">
            {Array.from({ length: 4 }).map((_, colIndex) => (
              <Grid item key={colIndex} xs={12} md={3}>
                {nflTeams.slice(colIndex * 8, colIndex * 8 + 8).map((team) => (
                  <Card
                    key={team}
                    onClick={() => {
                      setSelectedTeam(team);

                      // Save player data using the updated fetch call
                      fetch(`${import.meta.env.VITE_API_URL}/api/players`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          name: userData.name,
                          email: userData.email,
                          team: team,
                          score: yards, // Pass the current score (or final score) here
                        }),
                      })
                        .then((res) => {
                          if (!res.ok) {
                            throw new Error('Failed to save player');
                          }
                          return res.json();
                        })
                        .then((data) => {
                          console.log('Player saved successfully:', data);
                        })
                        .catch((err) => {
                          console.error('Error saving player:', err);
                        });
                    }}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: teamColors[team]?.default || '#4B5563',
                      '&:hover': {
                        backgroundColor: teamColors[team]?.hover || '#4B5563',
                      },
                      marginTop: 2,
                      marginBottom: 2,
                      width: 250, // Set a fixed width
                      height: 125, // Set a fixed height
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center', // Ensure text is centered
                      borderStyle: 'solid',
                      borderWidth: 4,
                      borderColor: '#d50a0a'
                    }}
                  >
                    <Avatar src={teamLogos[team]} sx={{ marginBottom: 1, width: 50, height: 50, marginTop: 1 }} />
                    <CardContent sx={{ textAlign: 'center', padding: 0 }}>{team}</CardContent>
                  </Card>
                ))}
              </Grid>
            ))}
          </Grid>
        </>
      ) : !selectedPlaymaker ? (
        <>
          <Typography variant="h4" sx={{ marginBottom: 4 }}>Choose Your Playmaker</Typography>
          <Grid container spacing={2} justifyContent="center">
            {playmakerImages[selectedTeam]?.map((playmaker) => (
              <Grid item key={playmaker.name}>
                <Card
                  onClick={() => setSelectedPlaymaker(playmaker.name)}
                  sx={{
                    cursor: 'pointer',
                    width: 200,
                    height: 250, // Adjust height to accommodate the photo
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    borderStyle: 'solid',
                    borderWidth: 4,
                    borderColor: '#d50a0a'
                  }}
                >
                  <Avatar
                    src={playmaker.image}
                    alt={playmaker.name}
                    sx={{ width: 100, height: 100, marginBottom: 1 }}
                  />
                  <CardContent>{playmaker.name}</CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      ) : !difficulty ? (
        <>
          {questionIndex < 4 ? (
            <>
              {/* Display current yards */}
              <Typography variant="h5" sx={{ marginBottom: 2 }}>
                Current Yards: {yards}
              </Typography>

              {/* Display current down */}
              <Typography variant="h6" sx={{ marginBottom: 2 }}>
                {["First Down", "Second Down", "Third Down", "Fourth Down"][questionIndex]}
              </Typography>

              <Typography variant="h4" sx={{ marginBottom: 4 }}>
                Choose Difficulty
              </Typography>
              <Grid container spacing={2} justifyContent="center">
                {Object.keys(questions).map((level) => (
                  <Grid item key={level}>
                    <Button
                      onClick={() => handleSelectDifficulty(level)}
                      sx={{
                        width: 200,
                        height: 50,
                        bgcolor: 'white',
                        color: '#013369',
                        '&:hover': { bgcolor: '#f0f0f0' },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        borderStyle: 'solid',
                        borderWidth: 4,
                        borderColor: '#d50a0a'
                      }}
                    >
                      {level}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </>
          ) : (
            <>
              {/* Display Game Over message */}
              <Typography variant="h3" sx={{ marginTop: 4 }}>
                Game Over! Total Yards: {yards}
              </Typography>
              <img
                src="https://static.www.nfl.com/image/upload/v1554321393/league/nvfr7ogywskqrfaiu38m.svg"
                alt="NFL Logo"
                style={{ width: '400px', height: '300px', marginTop: '20px' }}
              />
            </>
          )}
        </>
      ) : currentQuestion && (
        <>
          <Typography variant="h5" sx={{ marginBottom: 4 }}>{currentQuestion.question}</Typography>
          <Grid container spacing={2} justifyContent="center">
            {currentQuestion.choices.map((choice) => (
              <Grid item key={choice}>
                <Button
                  onClick={() => handleAnswer(choice)}
                  sx={{
                    width: 200,
                    height: 50,
                    bgcolor: 'white',
                    color: '#013369',
                    '&:hover': { bgcolor: '#f0f0f0' },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    borderStyle: 'solid',
                    borderWidth: 4,
                    borderColor: '#d50a0a'
                  }}
                >
                  {choice}
                </Button>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {questionIndex >= 4 && (
        <>
          <Typography variant="h3" sx={{ marginTop: 4 }}>
            Game Over!
          </Typography>
          <Typography variant="h6" sx={{ marginTop: 2 }}>
            Total Yards: {yards}
          </Typography>
          <Typography variant="h5" sx={{ marginTop: 2 }}>
            Playmaker: {selectedPlaymaker}
          </Typography>
          {playmakers[selectedTeam]?.includes(selectedPlaymaker) && (
            <img
              src={playmakerImages[selectedPlaymaker]}
              alt={selectedPlaymaker}
              style={{ width: '200px', height: '200px', marginTop: '20px', borderRadius: '50%' }}
            />
          )}
          <img
            src="https://static.www.nfl.com/image/upload/v1554321393/league/nvfr7ogywskqrfaiu38m.svg"
            alt="NFL Logo"
            style={{ width: '400px', height: '300px', marginTop: '20px' }}
          />
        </>
      )}

      <Box sx={{ mt: 4 }}></Box>
      <img
        src="https://static.www.nfl.com/image/upload/v1554321393/league/nvfr7ogywskqrfaiu38m.svg"
        alt="NFL Logo"
        style={{ width: '400px', height: '300px', marginBottom: '20px' }}
      />
    </Box>
  );
};

export default TeamSelection;
