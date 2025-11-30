//
//  GameView.swift
//  JourneymanGameiOS
//
//  Created on 2025-11-30
//

import SwiftUI

struct GameView: View {
    @ObservedObject var viewModel: GameViewModel
    let onGameOver: () -> Void

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Text("Who Am I?")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.white)

                // Silhouette player image
                Circle()
                    .fill(Color.black)
                    .frame(width: 160, height: 160)
                    .overlay(
                        Image(systemName: "person.fill")
                            .font(.system(size: 80))
                            .foregroundColor(.gray.opacity(0.3))
                    )
                    .overlay(
                        Circle()
                            .stroke(Color.white, lineWidth: 4)
                    )

                // Team logos
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 16) {
                        ForEach(viewModel.displayTeams, id: \.self) { team in
                            TeamLogoView(teamName: team)
                        }
                    }
                    .padding(.horizontal)
                }
                .frame(height: 120)

                // Input field
                TextField("Enter player name", text: $viewModel.guess)
                    .textFieldStyle(.roundedBorder)
                    .padding(.horizontal, 32)
                    .autocapitalization(.words)

                // Feedback
                if !viewModel.feedback.isEmpty {
                    Text(viewModel.feedback)
                        .font(.headline)
                        .foregroundColor(viewModel.feedback.contains("✅") ? .green : .red)
                }

                // Buttons
                HStack(spacing: 16) {
                    Button(action: {
                        viewModel.submitGuess()
                    }) {
                        Text("Submit")
                            .font(.headline)
                            .foregroundColor(.white)
                            .frame(width: 120, height: 44)
                            .background(Color.blue)
                            .cornerRadius(10)
                    }

                    Button(action: {
                        viewModel.endGame()
                        onGameOver()
                    }) {
                        Text("Quit Game")
                            .font(.headline)
                            .foregroundColor(.white)
                            .frame(width: 120, height: 44)
                            .background(Color.red.opacity(0.8))
                            .cornerRadius(10)
                    }
                }

                // Next player button (shows after correct answer)
                if viewModel.feedback.contains("✅") {
                    HStack(spacing: 16) {
                        Button(action: {
                            viewModel.nextPlayer()
                        }) {
                            Text("Next Player")
                                .font(.headline)
                                .foregroundColor(.white)
                                .frame(width: 120, height: 44)
                                .background(Color.green)
                                .cornerRadius(10)
                        }

                        Button(action: {
                            viewModel.endGame()
                            onGameOver()
                        }) {
                            Text("Finish Game")
                                .font(.headline)
                                .foregroundColor(.white)
                                .frame(width: 120, height: 44)
                                .background(Color.orange)
                                .cornerRadius(10)
                        }
                    }
                }

                // Social sharing buttons
                HStack(spacing: 24) {
                    Button(action: {
                        viewModel.shareOnSocial(platform: "facebook")
                        openURL("https://www.facebook.com/sharer/sharer.php?u=https://yourgameurl.com")
                    }) {
                        Image(systemName: "f.square.fill")
                            .font(.system(size: 32))
                            .foregroundColor(.blue)
                    }

                    Button(action: {
                        viewModel.shareOnSocial(platform: "twitter")
                        openURL("https://twitter.com/intent/tweet?url=https://yourgameurl.com&text=I%20just%20crushed%20the%20Journeyman%20game!%20🏈")
                    }) {
                        Image(systemName: "bird.fill")
                            .font(.system(size: 32))
                            .foregroundColor(.cyan)
                    }

                    Button(action: {
                        viewModel.shareOnSocial(platform: "reddit")
                        openURL("https://www.reddit.com/submit?url=https://yourgameurl.com&title=This%20NFL%20Journeyman%20guessing%20game%20is%20harder%20than%20it%20looks")
                    }) {
                        Image(systemName: "r.square.fill")
                            .font(.system(size: 32))
                            .foregroundColor(.orange)
                    }
                }
                .padding(.top, 16)
            }
            .padding()
        }
    }

    private func openURL(_ urlString: String) {
        if let url = URL(string: urlString) {
            UIApplication.shared.open(url)
        }
    }
}

struct TeamLogoView: View {
    let teamName: String

    var body: some View {
        VStack {
            AsyncImage(url: URL(string: TeamLogos.getLogoURL(for: teamName))) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fit)
            } placeholder: {
                ProgressView()
            }
            .frame(width: 80, height: 80)
            .background(Color.white)
            .cornerRadius(12)
        }
        .frame(width: 110, height: 110)
        .background(Color.white)
        .cornerRadius(12)
        .shadow(radius: 3)
    }
}
