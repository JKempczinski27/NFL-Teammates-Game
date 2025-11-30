//
//  GameOverView.swift
//  JourneymanGameiOS
//
//  Created on 2025-11-30
//

import SwiftUI

struct GameOverView: View {
    @ObservedObject var viewModel: GameViewModel
    let onPlayAgain: () -> Void

    var body: some View {
        VStack(spacing: 24) {
            Text("🏆 Game Complete! 🏆")
                .font(.system(size: 32, weight: .bold))
                .foregroundColor(Color(red: 1.0, green: 0.84, blue: 0))

            VStack(spacing: 16) {
                HStack {
                    Text("Score:")
                        .font(.headline)
                        .foregroundColor(.white)
                    Text("\(viewModel.correctCount) correct")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.green)
                }

                HStack {
                    Text("Time:")
                        .font(.headline)
                        .foregroundColor(.white)
                    Text(formatTime(viewModel.durationInSeconds))
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.cyan)
                }

                HStack {
                    Text("Mode:")
                        .font(.headline)
                        .foregroundColor(.white)
                    Text(viewModel.gameMode.rawValue.capitalized)
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.orange)
                }

                HStack {
                    Text("Guesses:")
                        .font(.headline)
                        .foregroundColor(.white)
                    Text("\(viewModel.guesses.count)")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.purple)
                }
            }
            .padding()
            .background(Color.black.opacity(0.5))
            .cornerRadius(12)

            // Upload status
            switch viewModel.uploadStatus {
            case .idle:
                EmptyView()
            case .uploading:
                HStack {
                    ProgressView()
                    Text("Uploading to analytics pipeline...")
                        .font(.caption)
                        .foregroundColor(.white)
                }
            case .success:
                Text("✅ Data uploaded to analytics pipeline")
                    .font(.caption)
                    .foregroundColor(.green)
            case .error:
                Text("⚠️ Game data saved locally, will retry upload automatically.")
                    .font(.caption)
                    .foregroundColor(.orange)
            }

            Button(action: onPlayAgain) {
                Text("Play Again")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(red: 0.3, green: 0.69, blue: 0.31))
                    .cornerRadius(10)
            }
            .padding(.horizontal, 32)

            // Social sharing
            VStack(spacing: 12) {
                Text("Share your score!")
                    .font(.headline)
                    .foregroundColor(.white)

                HStack(spacing: 24) {
                    Button(action: {
                        viewModel.shareOnSocial(platform: "facebook")
                        openURL("https://www.facebook.com/sharer/sharer.php?u=https://yourgameurl.com")
                    }) {
                        Image(systemName: "f.square.fill")
                            .font(.system(size: 40))
                            .foregroundColor(.blue)
                    }

                    Button(action: {
                        viewModel.shareOnSocial(platform: "twitter")
                        let score = viewModel.correctCount
                        let message = "I scored \(score) points in Journeyman! 🏈 Can you beat me?"
                        openURL("https://twitter.com/intent/tweet?text=\(message.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")")
                    }) {
                        Image(systemName: "bird.fill")
                            .font(.system(size: 40))
                            .foregroundColor(.cyan)
                    }

                    Button(action: {
                        viewModel.shareOnSocial(platform: "reddit")
                        openURL("https://www.reddit.com/submit?url=https://yourgameurl.com&title=This%20NFL%20Journeyman%20guessing%20game%20is%20harder%20than%20it%20looks")
                    }) {
                        Image(systemName: "r.square.fill")
                            .font(.system(size: 40))
                            .foregroundColor(.orange)
                    }
                }
            }
            .padding(.top, 16)
        }
        .padding()
    }

    private func formatTime(_ seconds: Int) -> String {
        let minutes = seconds / 60
        let remainingSeconds = seconds % 60
        return String(format: "%d:%02d", minutes, remainingSeconds)
    }

    private func openURL(_ urlString: String) {
        if let url = URL(string: urlString) {
            UIApplication.shared.open(url)
        }
    }
}
