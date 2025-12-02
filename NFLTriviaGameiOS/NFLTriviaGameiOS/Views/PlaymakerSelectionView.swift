// PlaymakerSelectionView.swift
// Playmaker selection screen

import SwiftUI

struct PlaymakerSelectionView: View {
    @ObservedObject var viewModel: TriviaGameViewModel

    var body: some View {
        VStack(spacing: 30) {
            // Header
            Text("Choose Your Playmaker")
                .font(.system(size: 32, weight: .bold))
                .foregroundColor(.white)
                .padding(.top, 40)

            if let team = viewModel.selectedTeam {
                // Team logo
                AsyncImage(url: URL(string: team.logoURL)) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                } placeholder: {
                    ProgressView()
                }
                .frame(width: 120, height: 120)

                Text(team.name)
                    .font(.system(size: 24, weight: .semibold))
                    .foregroundColor(.white)

                // Playmakers
                let playmakers = viewModel.getPlaymakers(for: team)
                VStack(spacing: 15) {
                    ForEach(playmakers, id: \.name) { playmaker in
                        Button(action: {
                            viewModel.selectPlaymaker(playmaker)
                        }) {
                            Text(playmaker.name)
                                .font(.system(size: 20, weight: .semibold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue)
                                .cornerRadius(10)
                        }
                    }
                }
                .padding(.horizontal, 40)
            }

            Spacer()

            // Back button
            Button(action: {
                viewModel.currentScreen = .teamSelection
            }) {
                Text("Back to Teams")
                    .font(.system(size: 16))
                    .foregroundColor(.white)
            }
            .padding(.bottom)
        }
    }
}
