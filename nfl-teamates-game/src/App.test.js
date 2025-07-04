import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});

// Tests for gameData structure and content
describe('gameData', () => {
	test('should be defined and be an array', () => {
		expect(gameData).toBeDefined();
		expect(Array.isArray(gameData)).toBe(true);
		expect(gameData.length).toBeGreaterThan(0);
	});

	test('each question should have required properties', () => {
		gameData.forEach((question, index) => {
			expect(question).toHaveProperty('images');
			expect(question).toHaveProperty('answer');
			expect(Array.isArray(question.images)).toBe(true);
			expect(typeof question.answer).toBe('string');
			expect(question.answer.trim()).not.toBe('');
		});
	});

	test('each image should have src and name properties', () => {
		gameData.forEach((question, questionIndex) => {
			question.images.forEach((image, imageIndex) => {
				expect(image).toHaveProperty('src');
				expect(image).toHaveProperty('name');
				expect(typeof image.src).toBe('string');
				expect(typeof image.name).toBe('string');
				expect(image.src.trim()).not.toBe('');
				expect(image.name.trim()).not.toBe('');
			});
		});
	});

	test('first question should have Tom Brady as answer', () => {
		expect(gameData[0].answer).toBe('Tom Brady');
		expect(gameData[0].images).toHaveLength(3);
		expect(gameData[0].images[0].name).toBe('Jason Pierre-Paul');
		expect(gameData[0].images[1].name).toBe('Randy Moss');
		expect(gameData[0].images[2].name).toBe('Josh Gordon');
	});

	test('all image URLs should be valid format', () => {
		gameData.forEach((question) => {
			question.images.forEach((image) => {
				expect(image.src).toMatch(/^https?:\/\/.+/);
			});
		});
	});
});