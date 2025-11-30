//
//  GameOverView.swift
//  TriviaGameiOS
//
//  Created on 2025-11-30
//

import SwiftUI

struct GameOverView: View {
    @ObservedObject var viewModel: TriviaViewModel
    let onPlayAgain: () -> Void

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Text("Game Over!")
                    .font(.system(size: 40, weight: .bold))
                    .foregroundColor(.white)

                // NFL Logo placeholder
                Image(systemName: "football.fill")
                    .font(.system(size: 100))
                    .foregroundColor(.white)

                VStack(spacing: 16) {
                    Text("Total Yards: \(viewModel.yards)")
                        .font(.system(size: 36, weight: .bold))
                        .foregroundColor(viewModel.yards >= 0 ? .green : .red)

                    if let team = viewModel.selectedTeam {
                        HStack {
                            Text("Team:")
                                .font(.headline)
                                .foregroundColor(.white)
                            Text(team.name)
                                .font(.title3)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                        }
                    }

                    if let playmaker = viewModel.selectedPlaymaker {
                        HStack {
                            Text("Playmaker:")
                                .font(.headline)
                                .foregroundColor(.white)
                            Text(playmaker)
                                .font(.title3)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                        }
                    }
                }
                .padding()
                .background(Color.black.opacity(0.3))
                .cornerRadius(12)

                // Player saved status
                if viewModel.playerSaved {
                    Text("✅ Score saved successfully!")
                        .font(.caption)
                        .foregroundColor(.green)
                }

                Button(action: onPlayAgain) {
                    Text("Play Again")
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(red: 0.9, green: 0.58, blue: 0.13))
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
                            let message = "I scored \(viewModel.yards) yards on NFL Long Drive! 🏈🔥"
                            openURL("https://www.facebook.com/sharer/sharer.php?u=https://yourgameurl.com&quote=\(message.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")")
                        }) {
                            Image(systemName: "f.square.fill")
                                .font(.system(size: 40))
                                .foregroundColor(.blue)
                        }

                        Button(action: {
                            viewModel.shareOnSocial(platform: "twitter")
                            let message = "I scored \(viewModel.yards) yards on NFL Long Drive! 🏈🔥 Can you beat me?"
                            openURL("https://twitter.com/intent/tweet?text=\(message.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")")
                        }) {
                            Image(systemName: "bird.fill")
                                .font(.system(size: 40))
                                .foregroundColor(.cyan)
                        }
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
