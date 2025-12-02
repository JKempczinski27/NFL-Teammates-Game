// DifficultySelectionView.swift
// Difficulty selection screen

import SwiftUI

struct DifficultySelectionView: View {
    @ObservedObject var viewModel: TriviaGameViewModel

    var body: some View {
        VStack(spacing: 40) {
            Spacer()

            // Title
            Text("Select Difficulty")
                .font(.system(size: 36, weight: .bold))
                .foregroundColor(.white)

            // Difficulty options
            VStack(spacing: 20) {
                DifficultyButton(
                    title: "Hand-off",
                    subtitle: "Easy • 12 seconds • 5 pts",
                    color: .green
                ) {
                    viewModel.startGame(difficulty: .handOff)
                }

                DifficultyButton(
                    title: "Check-Down",
                    subtitle: "Medium • 9 seconds • 15 pts",
                    color: .orange
                ) {
                    viewModel.startGame(difficulty: .checkDown)
                }

                DifficultyButton(
                    title: "Hail-Mary",
                    subtitle: "Hard • 6 seconds • 25 pts",
                    color: .red
                ) {
                    viewModel.startGame(difficulty: .hailMary)
                }
            }
            .padding(.horizontal, 40)

            Spacer()

            // Back button
            Button(action: {
                viewModel.currentScreen = .playmakerSelection
            }) {
                Text("Back")
                    .font(.system(size: 16))
                    .foregroundColor(.white)
            }
            .padding(.bottom)
        }
    }
}

struct DifficultyButton: View {
    let title: String
    let subtitle: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 5) {
                Text(title)
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(.white)

                Text(subtitle)
                    .font(.system(size: 14))
                    .foregroundColor(.white.opacity(0.9))
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(color)
            .cornerRadius(10)
        }
    }
}
