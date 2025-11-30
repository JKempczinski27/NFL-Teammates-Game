//
//  TeamSelectionView.swift
//  TriviaGameiOS
//
//  Created on 2025-11-30
//

import SwiftUI

struct TeamSelectionView: View {
    @ObservedObject var viewModel: TriviaViewModel
    let onComplete: () -> Void

    let columns = [
        GridItem(.adaptive(minimum: 100))
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Text("Select Your Team")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(.white)

                LazyVGrid(columns: columns, spacing: 16) {
                    ForEach(NFLTeam.allTeams) { team in
                        Button(action: {
                            viewModel.selectTeam(team)
                            onComplete()
                        }) {
                            VStack {
                                AsyncImage(url: URL(string: team.logoURL)) { image in
                                    image
                                        .resizable()
                                        .aspectRatio(contentMode: .fit)
                                } placeholder: {
                                    ProgressView()
                                }
                                .frame(width: 80, height: 80)

                                Text(team.name)
                                    .font(.caption)
                                    .foregroundColor(.white)
                                    .multilineTextAlignment(.center)
                            }
                            .frame(width: 100, height: 120)
                            .padding(8)
                            .background(Color.white.opacity(0.1))
                            .cornerRadius(12)
                        }
                    }
                }
                .padding()
            }
        }
    }
}
