// GamePlayView.swift
// Main game play screen

import SwiftUI

struct GamePlayView: View {
    @ObservedObject var viewModel: TriviaGameViewModel

    var body: some View {
        VStack(spacing: 20) {
            // Header
            HStack {
                Text("Score: \(viewModel.totalYards) yds")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(.white)

                Spacer()

                Text("Q \(viewModel.currentQuestionIndex + 1)/\(viewModel.selectedDifficulty == .handOff ? 4 : (viewModel.selectedDifficulty == .checkDown ? 4 : 4))")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(.white)
            }
            .padding(.horizontal)
            .padding(.top, 40)

            // Timer
            if viewModel.isQuestionActive {
                ProgressView(value: viewModel.timeRemaining, total: viewModel.selectedDifficulty?.timeLimit ?? 12)
                    .progressViewStyle(LinearProgressViewStyle(tint: viewModel.timeRemaining > 3 ? .green : .red))
                    .padding(.horizontal)

                Text(String(format: "%.1f", viewModel.timeRemaining))
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
            }

            Spacer()

            // Question
            if let question = viewModel.currentQuestion {
                VStack(spacing: 30) {
                    Text(question.question)
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                        .padding()

                    // Choices
                    VStack(spacing: 15) {
                        ForEach(question.choices, id: \.self) { choice in
                            Button(action: {
                                if viewModel.isQuestionActive {
                                    viewModel.handleAnswer(choice)
                                }
                            }) {
                                Text(choice)
                                    .font(.system(size: 18, weight: .semibold))
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(
                                        getChoiceColor(choice: choice, correctAnswer: question.answer)
                                    )
                                    .cornerRadius(10)
                            }
                            .disabled(!viewModel.isQuestionActive)
                        }
                    }
                    .padding(.horizontal, 30)
                }
            }

            // Feedback
            if let feedback = viewModel.answerFeedback {
                VStack(spacing: 10) {
                    Text(feedback.message)
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(feedback.isCorrect ? .green : .red)

                    if let correctAnswer = feedback.correctAnswer {
                        Text("Correct answer: \(correctAnswer)")
                            .font(.system(size: 16))
                            .foregroundColor(.white)
                    }
                }
                .padding()
                .background(Color.white.opacity(0.2))
                .cornerRadius(10)
                .padding(.horizontal)
            }

            Spacer()
        }
    }

    func getChoiceColor(choice: String, correctAnswer: String) -> Color {
        if viewModel.isQuestionActive {
            return Color.blue
        }

        if let feedback = viewModel.answerFeedback {
            if choice == correctAnswer {
                return Color.green
            } else {
                return Color.red.opacity(0.6)
            }
        }

        return Color.blue
    }
}
