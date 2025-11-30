//
//  PlaymakerSelectionView.swift
//  TriviaGameiOS
//
//  Created on 2025-11-30
//

import SwiftUI

struct PlaymakerSelectionView: View {
    @ObservedObject var viewModel: TriviaViewModel
    let onComplete: () -> Void

    var body: some View {
        VStack(spacing: 32) {
            if let team = viewModel.selectedTeam {
                AsyncImage(url: URL(string: team.logoURL)) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                } placeholder: {
                    ProgressView()
                }
                .frame(width: 120, height: 120)

                Text("Select Your Playmaker")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(.white)

                Text(team.name)
                    .font(.title2)
                    .foregroundColor(.white.opacity(0.8))

                VStack(spacing: 16) {
                    ForEach(team.playmakers, id: \.self) { playmaker in
                        Button(action: {
                            viewModel.selectPlaymaker(playmaker)
                            onComplete()
                        }) {
                            Text(playmaker)
                                .font(.headline)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color(red: 0.9, green: 0.58, blue: 0.13))
                                .cornerRadius(10)
                        }
                    }
                }
                .padding(.horizontal, 32)
            }
        }
        .padding()
    }
}
