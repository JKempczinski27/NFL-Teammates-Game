// ContentView.swift
// Main container view for NFL Trivia Game

import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = TriviaGameViewModel()

    var body: some View {
        NavigationView {
            ZStack {
                // Background color
                Color(red: 0.87, green: 0.72, blue: 0.53)
                    .ignoresSafeArea()

                // Content based on current screen
                switch viewModel.currentScreen {
                case .welcome:
                    WelcomeView(viewModel: viewModel)
                case .teamSelection:
                    TeamSelectionView(viewModel: viewModel)
                case .playmakerSelection:
                    PlaymakerSelectionView(viewModel: viewModel)
                case .difficultySelection:
                    DifficultySelectionView(viewModel: viewModel)
                case .game:
                    GamePlayView(viewModel: viewModel)
                case .results:
                    ResultsView(viewModel: viewModel)
                }
            }
            .navigationBarHidden(true)
        }
    }
}

#Preview {
    ContentView()
}
