// TeamSelectionView.swift
// Team selection screen

import SwiftUI

struct TeamSelectionView: View {
    @ObservedObject var viewModel: TriviaGameViewModel

    let columns = [
        GridItem(.adaptive(minimum: 150))
    ]

    var body: some View {
        VStack(spacing: 20) {
            // Header
            Text("Select Your Team")
                .font(.system(size: 32, weight: .bold))
                .foregroundColor(.white)
                .padding(.top, 40)

            ScrollView {
                LazyVGrid(columns: columns, spacing: 20) {
                    ForEach(viewModel.allTeams) { team in
                        TeamCardView(team: team) {
                            viewModel.selectTeam(team)
                        }
                    }
                }
                .padding()
            }
        }
    }
}

struct TeamCardView: View {
    let team: Team
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 10) {
                AsyncImage(url: URL(string: team.logoURL)) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                } placeholder: {
                    ProgressView()
                }
                .frame(width: 80, height: 80)

                Text(team.name)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.white)
            .cornerRadius(12)
            .shadow(radius: 3)
        }
    }
}
