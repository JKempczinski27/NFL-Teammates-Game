//
//  GameView.swift
//  TriviaGameiOS
//
//  Created on 2025-11-30
//

import SwiftUI

struct GameView: View {
    @ObservedObject var viewModel: TriviaViewModel
    let onGameOver: () -> Void

    var body: some View {
        VStack(spacing: 24) {
            // Score display
            HStack {
                Text("Yards: \(viewModel.yards)")
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(viewModel.yards >= 0 ? .green : .red)

                Spacer()

                Text("Question \(viewModel.questionIndex + 1)/4")
                    .font(.headline)
                    .foregroundColor(.white)
            }
            .padding(.horizontal)

            if viewModel.showFeedback {
                // Feedback screen
                feedbackView
            } else if let question = viewModel.currentQuestion {
                // Question screen
                questionView(question: question)
            } else if viewModel.canSelectDifficulty {
                // Difficulty selection
                difficultySelectionView
            } else {
                // Game completed
                Text("Game Complete!")
                    .font(.largeTitle)
                    .foregroundColor(.white)
                    .onAppear {
                        viewModel.completeGame()
                        onGameOver()
                    }
            }
        }
        .padding()
    }

    private var difficultySelectionView: some View {
        VStack(spacing: 24) {
            Text("Choose Your Play")
                .font(.title)
                .fontWeight(.bold)
                .foregroundColor(.white)

            VStack(spacing: 16) {
                DifficultyButton(
                    difficulty: .handOff,
                    color: .green,
                    action: { viewModel.selectDifficulty(.handOff) }
                )

                DifficultyButton(
                    difficulty: .checkDown,
                    color: .orange,
                    action: { viewModel.selectDifficulty(.checkDown) }
                )

                DifficultyButton(
                    difficulty: .hailMary,
                    color: .red,
                    action: { viewModel.selectDifficulty(.hailMary) }
                )
            }
        }
    }

    private func questionView(question: Question) -> some View {
        VStack(spacing: 24) {
            // Timer
            ProgressView(value: viewModel.timeRemaining, total: question.difficulty.timeLimit)
                .progressViewStyle(LinearProgressViewStyle(tint: viewModel.timeRemaining > 3 ? .green : .red))
                .scaleEffect(x: 1, y: 2, anchor: .center)

            Text(String(format: "%.1fs", viewModel.timeRemaining))
                .font(.headline)
                .foregroundColor(.white)

            // Question
            Text(question.question)
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(.white)
                .multilineTextAlignment(.center)
                .padding()

            // Choices
            VStack(spacing: 12) {
                ForEach(question.choices, id: \.self) { choice in
                    Button(action: {
                        viewModel.handleAnswer(choice)
                    }) {
                        Text(choice)
                            .font(.body)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color(red: 0.9, green: 0.58, blue: 0.13))
                            .cornerRadius(10)
                    }
                }
            }
            .padding(.horizontal)
        }
    }

    private var feedbackView: some View {
        VStack(spacing: 24) {
            Text(viewModel.answerFeedback ?? "")
                .font(.title)
                .fontWeight(.bold)
                .foregroundColor(viewModel.answerFeedback?.contains("Correct") == true ? .green : .red)
                .multilineTextAlignment(.center)

            Text("Current Yards: \(viewModel.yards)")
                .font(.headline)
                .foregroundColor(.white)

            Button(action: {
                viewModel.nextQuestion()
            }) {
                Text("Next Question")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .cornerRadius(10)
            }
            .padding(.horizontal, 32)
        }
    }
}

struct DifficultyButton: View {
    let difficulty: Difficulty
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Text(difficulty.rawValue)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)

                HStack {
                    Text("\(difficulty.timeLimit, specifier: "%.0f")s")
                        .font(.caption)
                        .foregroundColor(.white)

                    Spacer()

                    Text("+\(difficulty.correctPoints) / \(difficulty.incorrectPoints)")
                        .font(.caption)
                        .foregroundColor(.white)
                }
            }
            .padding()
            .frame(maxWidth: .infinity)
            .background(color)
            .cornerRadius(10)
        }
        .padding(.horizontal, 32)
    }
}
