// ResultsView.swift
// Game results and leaderboard

import SwiftUI

struct ResultsView: View {
    @ObservedObject var viewModel: JourneymanGameViewModel

    var body: some View {
        ScrollView {
            VStack(spacing: 30) {
                // Title
                Text("Game Complete!")
                    .font(.system(size: 40, weight: .bold))
                    .foregroundColor(.white)
                    .padding(.top, 40)

                // Game end message
                Text(viewModel.gameEndMessage)
                    .font(.system(size: 18))
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)

                // Score card
                VStack(spacing: 15) {
                    Text("Your Score")
                        .font(.system(size: 20, weight: .medium))
                        .foregroundColor(.white)

                    Text("\(viewModel.correctCount)")
                        .font(.system(size: 60, weight: .bold))
                        .foregroundColor(.white)

                    Text("Correct Guesses")
                        .font(.system(size: 16))
                        .foregroundColor(.white.opacity(0.8))

                    HStack(spacing: 30) {
                        VStack {
                            Text(viewModel.playerName)
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.white)

                            Text("Player")
                                .font(.system(size: 12))
                                .foregroundColor(.white.opacity(0.7))
                        }

                        VStack {
                            Text(viewModel.gameMode.rawValue)
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.white)

                            Text("Mode")
                                .font(.system(size: 12))
                                .foregroundColor(.white.opacity(0.7))
                        }
                    }
                }
                .padding()
                .background(Color.white.opacity(0.15))
                .cornerRadius(15)
                .padding(.horizontal, 40)

                // Share button
                ShareLink(item: "I scored \(viewModel.correctCount) correct guesses in NFL Journeyman Game!") {
                    HStack {
                        Image(systemName: "square.and.arrow.up")
                        Text("Share Score")
                    }
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .cornerRadius(10)
                }
                .padding(.horizontal, 40)
                .simultaneousGesture(TapGesture().onEnded {
                    viewModel.shareScore()
                })

                // Leaderboard
                if !viewModel.leaderboard.isEmpty {
                    VStack(alignment: .leading, spacing: 15) {
                        Text("Leaderboard")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(.white)

                        ForEach(Array(viewModel.leaderboard.enumerated()), id: \.element.id) { index, entry in
                            HStack {
                                Text("\(index + 1).")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(.white)
                                    .frame(width: 30)

                                VStack(alignment: .leading, spacing: 3) {
                                    Text(entry.name)
                                        .font(.system(size: 16, weight: .semibold))
                                        .foregroundColor(.white)

                                    Text("\(entry.durationInSeconds)s")
                                        .font(.system(size: 12))
                                        .foregroundColor(.white.opacity(0.7))
                                }

                                Spacer()

                                Text("\(entry.correctCount)")
                                    .font(.system(size: 18, weight: .bold))
                                    .foregroundColor(.white)
                            }
                            .padding()
                            .background(Color.white.opacity(0.1))
                            .cornerRadius(8)
                        }
                    }
                    .padding(.horizontal)
                }

                // Play again button
                Button(action: {
                    viewModel.resetGame()
                }) {
                    Text("Play Again")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.green)
                        .cornerRadius(10)
                }
                .padding(.horizontal, 40)
                .padding(.bottom, 40)
            }
        }
    }
}
