//
//  GameView.swift
//  NFLTeammatesGameiOS
//
//  Created by NFL Teammates Game
//

import SwiftUI

struct GameView: View {
    @ObservedObject var viewModel: GameViewModel
    @State private var answerInput = ""
    @FocusState private var isInputFocused: Bool

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Score and Question Counter
                HStack {
                    Text("Score: \(viewModel.score)")
                        .font(.headline)
                        .foregroundColor(.white)

                    Spacer()

                    Text("Question \(viewModel.currentQuestionIndex + 1)/\(viewModel.questions.count)")
                        .font(.headline)
                        .foregroundColor(.white)
                }
                .padding(.horizontal)

                // Attempts Left
                HStack(spacing: 8) {
                    ForEach(0..<4) { index in
                        Circle()
                            .fill(index < viewModel.attemptsLeft ? Color.green : Color.gray.opacity(0.3))
                            .frame(width: 15, height: 15)
                    }
                }
                .padding(.vertical, 8)

                // Question Title
                Text("Who is the Common Player?")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)
                    .padding()

                // Player Images
                if let question = viewModel.currentQuestion {
                    HStack(spacing: 15) {
                        ForEach(question.clues) { player in
                            PlayerImageView(player: player)
                        }
                    }
                    .padding(.horizontal)

                    // Answer Input
                    VStack(spacing: 15) {
                        TextField("Enter player name", text: $answerInput)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .padding(.horizontal)
                            .focused($isInputFocused)
                            .autocapitalization(.words)
                            .disableAutocorrection(true)

                        Button(action: {
                            submitAnswer()
                        }) {
                            Text("Submit")
                                .font(.headline)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(answerInput.isEmpty ? Color.gray : Color.blue)
                                .cornerRadius(10)
                        }
                        .disabled(answerInput.isEmpty)
                        .padding(.horizontal)
                    }
                    .padding(.top, 20)

                    // Previous Answers
                    if !viewModel.selectedAnswers.isEmpty {
                        VStack(spacing: 10) {
                            Text("Your Answers:")
                                .font(.headline)
                                .foregroundColor(.white)

                            ForEach(Array(viewModel.selectedAnswers.enumerated()), id: \.offset) { index, answer in
                                HStack {
                                    Text("Attempt \(index + 1):")
                                        .foregroundColor(.white)

                                    Text(answer.player.name)
                                        .foregroundColor(.white)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 6)
                                        .background(viewModel.getAnswerColor(for: answer))
                                        .cornerRadius(8)
                                }
                            }
                        }
                        .padding()
                    }
                }
            }
            .padding()
        }
    }

    private func submitAnswer() {
        guard !answerInput.isEmpty else { return }

        Task {
            await viewModel.submitAnswer(answerInput)
            answerInput = ""
            isInputFocused = false
        }
    }
}

#Preview {
    GameView(viewModel: GameViewModel())
}
