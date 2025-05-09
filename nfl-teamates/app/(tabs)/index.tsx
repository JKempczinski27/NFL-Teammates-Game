import React, { useState } from 'react';
import { View, Text, TextInput, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const gameData = [
  {
    images: [
      { src: 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/13256.png', name: 'Jason Pierre-Paul' },
      { src: 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/1433.png', name: 'Randy Moss' },
      { src: 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/15705.png', name: 'Josh Gordon' },
    ],
    answer: 'Tom Brady',
  },
  {
    images: [
      { src: 'https://example.com/players/randy-moss.jpg', name: 'Randy Moss' },
      { src: 'https://example.com/players/brady.jpg', name: 'Tom Brady' },
      { src: 'https://example.com/players/welker.jpg', name: 'Wes Welker' },
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
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % gameData.length);
    setUserAnswer('');
    setIsCorrect(null);
    setAttemptsLeft(4);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Who is the Common Player?</Text>

      <View style={styles.imageRow}>
        {currentQuestion.images.map((player, idx) => (
          <View key={idx} style={styles.card}>
            <Image source={{ uri: player.src }} style={styles.image} resizeMode="contain" />
            <Text style={styles.name}>{player.name}</Text>
          </View>
        ))}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Your Answer"
          value={userAnswer}
          onChangeText={setUserAnswer}
          editable={isCorrect !== true && attemptsLeft > 0}
        />
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: isCorrect ? 'green' : 'blue' }
          ]}
          onPress={handleSubmit}
          disabled={isCorrect || attemptsLeft === 0}
        >
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.attempts}>Attempts Left: {attemptsLeft}</Text>

      {isCorrect !== null && (
        <Text style={[styles.feedback, { color: isCorrect ? 'green' : 'red' }]}>
          {isCorrect ? 'Correct!' : 'Incorrect. Try again.'}
        </Text>
      )}

      {isCorrect && (
        <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
          <Text style={styles.nextButtonText}>Next Question</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  imageRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  card: {
    alignItems: 'center',
    margin: 10,
  },
  image: {
    width: 100,
    height: 100,
  },
  name: {
    marginTop: 5,
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    alignItems: 'center',
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    width: '80%',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  attempts: {
    marginTop: 10,
    fontSize: 16,
  },
  feedback: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
  },
  nextButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#444',
    borderRadius: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
