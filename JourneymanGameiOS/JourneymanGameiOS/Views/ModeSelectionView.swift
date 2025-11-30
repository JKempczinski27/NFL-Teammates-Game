//
//  ModeSelectionView.swift
//  JourneymanGameiOS
//
//  Created on 2025-11-30
//

import SwiftUI

struct ModeSelectionView: View {
    @ObservedObject var viewModel: GameViewModel
    let onComplete: () -> Void

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Text("Journeyman")
                    .font(.system(size: 40, weight: .bold))
                    .foregroundColor(.white)

                VStack(alignment: .leading, spacing: 16) {
                    Text("Some NFL players stay loyal to one team their whole career.\nOthers switched teams like it was part of a witness protection program.\nYour job? Look at the logos from every team they've played for and guess the mystery player.")
                        .font(.system(size: 14))
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)

                    VStack(alignment: .leading, spacing: 12) {
                        Text("🔍 Modes:")
                            .font(.headline)
                            .foregroundColor(.white)

                        VStack(alignment: .leading, spacing: 8) {
                            Text("🟢 Easy Mode:")
                                .font(.subheadline)
                                .fontWeight(.bold)
                                .foregroundColor(.white)

                            Text("You get the logos in order of when they played there. It's like using bumpers at a bowling alley—no shame.")
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.9))
                        }

                        VStack(alignment: .leading, spacing: 8) {
                            Text("🔴 Challenge Mode:")
                                .font(.subheadline)
                                .fontWeight(.bold)
                                .foregroundColor(.white)

                            Text("Same logos, no order.\nCould be first, last, middle—pure chaos. Just like their career path.")
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.9))
                        }
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text("📜 Rules (well, suggestions, really):")
                            .font(.headline)
                            .foregroundColor(.white)

                        Text("• Guess the player based on their team history.\n• No Googling. Pretend it's 2004 and you're using pure memory.\n• Spelling matters. \"Fitzpatrick\" = ✅, \"Fitspatrick\" = ❌\n• Limited guesses. Don't just shotgun names.\n• Tip: If you see 6 logos and none are the Patriots, it's probably not Tom Brady.")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.9))
                    }
                }
                .padding()
                .background(Color.black.opacity(0.5))
                .cornerRadius(12)

                Text("Choose your mode")
                    .font(.title3)
                    .foregroundColor(.white)
                    .padding(.top, 8)

                HStack(spacing: 32) {
                    Button(action: {
                        viewModel.selectMode(.easy)
                        viewModel.startGame(name: viewModel.playerName, email: viewModel.playerEmail)
                        onComplete()
                    }) {
                        Text("Easy Mode")
                            .font(.headline)
                            .foregroundColor(.white)
                            .frame(width: 140, height: 50)
                            .background(Color(red: 0.04, green: 0.4, blue: 0.14))
                            .cornerRadius(10)
                    }

                    Button(action: {
                        viewModel.selectMode(.challenge)
                        viewModel.startGame(name: viewModel.playerName, email: viewModel.playerEmail)
                        onComplete()
                    }) {
                        Text("Challenge Mode")
                            .font(.headline)
                            .foregroundColor(.white)
                            .frame(width: 140, height: 50)
                            .background(Color(red: 0.83, green: 0, blue: 0))
                            .cornerRadius(10)
                    }
                }
            }
            .padding()
        }
    }
}
