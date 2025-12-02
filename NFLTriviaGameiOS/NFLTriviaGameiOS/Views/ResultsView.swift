// ResultsView.swift
// Game results and leaderboard

import SwiftUI

struct ResultsView: View {
    @ObservedObject var viewModel: TriviaGameViewModel

    var body: some View {
        ScrollView {
            VStack(spacing: 30) {
                // Title
                Text("Game Over!")
                    .font(.system(size: 40, weight: .bold))
                    .foregroundColor(.white)
                    .padding(.top, 40)

                // Final score
                VStack(spacing: 10) {
                    Text("Final Score")
                        .font(.system(size: 20, weight: .medium))
                        .foregroundColor(.white)

                    Text("\(viewModel.totalYards) yards")
                        .font(.system(size: 48, weight: .bold))
                        .foregroundColor(.white)
                }
                .padding()
                .background(Color.white.opacity(0.2))
                .cornerRadius(15)

                // Player info
                if let team = viewModel.selectedTeam,
                   let playmaker = viewModel.selectedPlaymaker {
                    VStack(spacing: 10) {
                        AsyncImage(url: URL(string: team.logoURL)) { image in
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                        } placeholder: {
                            ProgressView()
                        }
                        .frame(width: 80, height: 80)

                        Text("\(viewModel.playerName)")
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundColor(.white)

                        Text("\(team.name) • \(playmaker.name)")
                            .font(.system(size: 16))
                            .foregroundColor(.white.opacity(0.9))

                        if let difficulty = viewModel.selectedDifficulty {
                            Text("Difficulty: \(difficulty.rawValue)")
                                .font(.system(size: 14))
                                .foregroundColor(.white.opacity(0.8))
                        }
                    }
                }

                // Share button
                ShareLink(item: "I just scored \(viewModel.totalYards) yards in NFL Trivia Game!") {
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

                        ForEach(Array(viewModel.leaderboard.enumerated()), id: \.element.id) { index, player in
                            HStack {
                                Text("\(index + 1).")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(.white)
                                    .frame(width: 30)

                                Text(player.name)
                                    .font(.system(size: 16))
                                    .foregroundColor(.white)

                                Spacer()

                                Text("\(player.score) yds")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(.white)
                            }
                            .padding()
                            .background(Color.white.opacity(0.2))
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
