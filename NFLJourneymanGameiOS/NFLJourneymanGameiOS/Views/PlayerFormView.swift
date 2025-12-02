// PlayerFormView.swift
// Player registration form

import SwiftUI

struct PlayerFormView: View {
    @ObservedObject var viewModel: JourneymanGameViewModel

    var body: some View {
        VStack(spacing: 30) {
            Spacer()

            // Title
            VStack(spacing: 10) {
                Text("NFL Journeyman")
                    .font(.system(size: 44, weight: .bold))
                    .foregroundColor(.white)

                Text("Guess the Player!")
                    .font(.system(size: 22, weight: .medium))
                    .foregroundColor(.white.opacity(0.9))
            }

            Spacer()

            // Registration form
            VStack(spacing: 20) {
                TextField("Your Name", text: $viewModel.playerName)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .padding(.horizontal, 40)
                    .autocapitalization(.words)

                TextField("Your Email", text: $viewModel.playerEmail)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .padding(.horizontal, 40)
                    .autocapitalization(.none)
                    .keyboardType(.emailAddress)

                Button(action: {
                    if !viewModel.playerName.isEmpty && !viewModel.playerEmail.isEmpty {
                        viewModel.currentScreen = .modeSelection
                    }
                }) {
                    Text("Continue")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(
                            (viewModel.playerName.isEmpty || viewModel.playerEmail.isEmpty)
                                ? Color.gray
                                : Color.green
                        )
                        .cornerRadius(10)
                }
                .disabled(viewModel.playerName.isEmpty || viewModel.playerEmail.isEmpty)
                .padding(.horizontal, 40)
            }

            Spacer()

            Text("Test your NFL knowledge by guessing journeyman players")
                .font(.caption)
                .foregroundColor(.white.opacity(0.7))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
                .padding(.bottom)
        }
    }
}
