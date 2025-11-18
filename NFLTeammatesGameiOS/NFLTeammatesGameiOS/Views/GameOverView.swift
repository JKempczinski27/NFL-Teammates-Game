//
//  GameOverView.swift
//  NFLTeammatesGameiOS
//
//  Created by NFL Teammates Game
//

import SwiftUI

struct GameOverView: View {
    @ObservedObject var viewModel: GameViewModel
    @State private var showingShareSheet = false

    var body: some View {
        VStack(spacing: 30) {
            Text("🏈 Game Over! 🏈")
                .font(.largeTitle)
                .fontWeight(.bold)
                .foregroundColor(.white)

            VStack(spacing: 15) {
                Text("Final Score")
                    .font(.title2)
                    .foregroundColor(.white)

                Text("\(viewModel.score)")
                    .font(.system(size: 60, weight: .bold))
                    .foregroundColor(.green)

                let correctAnswers = viewModel.selectedAnswers.filter { $0.isCorrect }.count
                Text("\(correctAnswers)/\(viewModel.questions.count) Questions Correct")
                    .font(.title3)
                    .foregroundColor(.white)
            }
            .padding()
            .background(Color.white.opacity(0.2))
            .cornerRadius(15)

            // Share Buttons
            VStack(spacing: 15) {
                Text("Share Your Score")
                    .font(.headline)
                    .foregroundColor(.white)

                HStack(spacing: 20) {
                    ShareButton(platform: "Twitter", icon: "square.and.arrow.up", color: .blue) {
                        Task {
                            await viewModel.shareScore(platform: "twitter")
                            shareToTwitter()
                        }
                    }

                    ShareButton(platform: "Facebook", icon: "square.and.arrow.up.fill", color: Color(red: 0.23, green: 0.35, blue: 0.60)) {
                        Task {
                            await viewModel.shareScore(platform: "facebook")
                            shareToFacebook()
                        }
                    }

                    ShareButton(platform: "Share", icon: "square.and.arrow.up.circle.fill", color: .green) {
                        showingShareSheet = true
                    }
                }
            }
            .padding()

            // Play Again Button
            Button(action: {
                viewModel.resetGame()
            }) {
                Text("Play Again")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.green)
                    .cornerRadius(10)
            }
            .padding(.horizontal, 40)
        }
        .padding()
        .sheet(isPresented: $showingShareSheet) {
            ShareSheet(activityItems: [viewModel.getShareMessage()])
        }
    }

    private func shareToTwitter() {
        let text = viewModel.getShareMessage()
        let twitterURL = "twitter://post?message=\(text.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")"

        if let url = URL(string: twitterURL) {
            if UIApplication.shared.canOpenURL(url) {
                UIApplication.shared.open(url)
            } else {
                // Fallback to web
                let webURL = "https://twitter.com/intent/tweet?text=\(text.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")"
                if let webUrl = URL(string: webURL) {
                    UIApplication.shared.open(webUrl)
                }
            }
        }
    }

    private func shareToFacebook() {
        // Facebook sharing requires Facebook SDK for proper integration
        // Fallback to generic share sheet
        showingShareSheet = true
    }
}

struct ShareButton: View {
    let platform: String
    let icon: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack {
                Image(systemName: icon)
                    .font(.title)
                    .foregroundColor(.white)
                    .frame(width: 50, height: 50)
                    .background(color)
                    .clipShape(Circle())

                Text(platform)
                    .font(.caption)
                    .foregroundColor(.white)
            }
        }
    }
}

#Preview {
    GameOverView(viewModel: GameViewModel())
}
