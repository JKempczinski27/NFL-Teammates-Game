// ModeSelectionView.swift
// Game mode selection screen

import SwiftUI

struct ModeSelectionView: View {
    @ObservedObject var viewModel: JourneymanGameViewModel

    var body: some View {
        VStack(spacing: 40) {
            Spacer()

            // Title
            Text("Select Game Mode")
                .font(.system(size: 36, weight: .bold))
                .foregroundColor(.white)

            // Mode options
            VStack(spacing: 20) {
                ModeButton(
                    title: "Easy Mode",
                    subtitle: "Teams in order",
                    color: .green,
                    icon: "checkmark.circle.fill"
                ) {
                    viewModel.startGame(mode: .easy)
                }

                ModeButton(
                    title: "Challenge Mode",
                    subtitle: "Teams shuffled",
                    color: .orange,
                    icon: "flame.fill"
                ) {
                    viewModel.startGame(mode: .challenge)
                }
            }
            .padding(.horizontal, 40)

            Spacer()

            // Back button
            Button(action: {
                viewModel.currentScreen = .playerForm
            }) {
                Text("Back")
                    .font(.system(size: 16))
                    .foregroundColor(.white)
            }
            .padding(.bottom)
        }
    }
}

struct ModeButton: View {
    let title: String
    let subtitle: String
    let color: Color
    let icon: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 15) {
                Image(systemName: icon)
                    .font(.system(size: 30))
                    .foregroundColor(.white)

                VStack(alignment: .leading, spacing: 5) {
                    Text(title)
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(.white)

                    Text(subtitle)
                        .font(.system(size: 14))
                        .foregroundColor(.white.opacity(0.9))
                }

                Spacer()
            }
            .padding()
            .background(color)
            .cornerRadius(12)
        }
    }
}
