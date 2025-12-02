// WelcomeView.swift
// Welcome screen with player registration

import SwiftUI

struct WelcomeView: View {
    @ObservedObject var viewModel: TriviaGameViewModel

    var body: some View {
        VStack(spacing: 30) {
            Spacer()

            // Title
            Text("NFL Trivia Game")
                .font(.system(size: 40, weight: .bold))
                .foregroundColor(.white)

            Text("Test Your NFL Knowledge!")
                .font(.system(size: 20, weight: .medium))
                .foregroundColor(.white.opacity(0.9))

            Spacer()

            // Player registration
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
                        viewModel.currentScreen = .teamSelection
                    }
                }) {
                    Text("Start Game")
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

            Text("Brought to you by NFL Teammates Game")
                .font(.caption)
                .foregroundColor(.white.opacity(0.7))
                .padding(.bottom)
        }
    }
}
