// GameView.swift
// Main game play screen

import SwiftUI

struct GameView: View {
    @ObservedObject var viewModel: JourneymanGameViewModel

    var body: some View {
        VStack(spacing: 20) {
            // Header
            HStack {
                VStack(alignment: .leading) {
                    Text(viewModel.playerName)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)

                    Text("Mode: \(viewModel.gameMode.rawValue)")
                        .font(.system(size: 14))
                        .foregroundColor(.white.opacity(0.8))
                }

                Spacer()

                VStack(alignment: .trailing) {
                    Text("Score: \(viewModel.correctCount)")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.white)

                    Text("Player \(viewModel.currentPlayerIndex + 1)/\(viewModel.players.count)")
                        .font(.system(size: 14))
                        .foregroundColor(.white.opacity(0.8))
                }
            }
            .padding(.horizontal)
            .padding(.top, 40)

            ScrollView {
                VStack(spacing: 25) {
                    // Instructions
                    Text("Guess the player who played for these teams:")
                        .font(.system(size: 18, weight: .medium))
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)

                    // Team logos
                    LazyVGrid(columns: [
                        GridItem(.adaptive(minimum: 80))
                    ], spacing: 15) {
                        ForEach(viewModel.displayedTeams, id: \.self) { team in
                            TeamLogoView(team: team, viewModel: viewModel)
                        }
                    }
                    .padding(.horizontal)

                    // Guess input
                    VStack(spacing: 15) {
                        TextField("Enter player name", text: $viewModel.guess)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .padding(.horizontal, 40)
                            .autocapitalization(.words)
                            .disabled(viewModel.gameEnded)

                        HStack(spacing: 15) {
                            Button(action: {
                                viewModel.handleGuess()
                            }) {
                                Text("Submit Guess")
                                    .font(.system(size: 18, weight: .semibold))
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(viewModel.guess.isEmpty ? Color.gray : Color.green)
                                    .cornerRadius(10)
                            }
                            .disabled(viewModel.guess.isEmpty || viewModel.gameEnded)

                            Button(action: {
                                viewModel.nextTeam()
                            }) {
                                Text("Skip")
                                    .font(.system(size: 18, weight: .semibold))
                                    .foregroundColor(.white)
                                    .padding()
                                    .background(Color.orange)
                                    .cornerRadius(10)
                            }
                            .disabled(viewModel.gameEnded)
                        }
                        .padding(.horizontal, 40)
                    }

                    // Feedback
                    if !viewModel.feedback.isEmpty {
                        Text(viewModel.feedback)
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(viewModel.feedback.contains("✅") ? .green : .red)
                            .padding()
                            .background(Color.white.opacity(0.2))
                            .cornerRadius(10)
                    }

                    // Quit button
                    Button(action: {
                        viewModel.quitGame()
                    }) {
                        Text("Quit Game")
                            .font(.system(size: 16))
                            .foregroundColor(.white.opacity(0.7))
                    }
                    .padding(.top, 20)
                }
            }
        }
    }
}

struct TeamLogoView: View {
    let team: String
    @ObservedObject var viewModel: JourneymanGameViewModel

    var body: some View {
        VStack(spacing: 8) {
            if let logoURL = viewModel.teamLogos[team],
               let url = URL(string: logoURL) {
                AsyncImage(url: url) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                } placeholder: {
                    ProgressView()
                }
                .frame(width: 60, height: 60)
            }

            Text(team)
                .font(.system(size: 10))
                .foregroundColor(.white)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .frame(width: 80)
        }
        .padding(8)
        .background(Color.white.opacity(0.1))
        .cornerRadius(10)
    }
}
