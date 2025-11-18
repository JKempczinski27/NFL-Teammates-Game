//
//  ContentView.swift
//  NFLTeammatesGameiOS
//
//  Created by NFL Teammates Game
//

import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = GameViewModel()

    var body: some View {
        NavigationView {
            ZStack {
                // Background color matching the web version's brown theme
                Color(red: 0.87, green: 0.72, blue: 0.53)
                    .ignoresSafeArea()

                if viewModel.isGameOver {
                    GameOverView(viewModel: viewModel)
                } else {
                    GameView(viewModel: viewModel)
                }
            }
            .navigationTitle("NFL Teammates")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

#Preview {
    ContentView()
}
