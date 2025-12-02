// ContentView.swift
// Main container view for NFL Journeyman Game

import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = JourneymanGameViewModel()

    var body: some View {
        NavigationView {
            ZStack {
                // Background gradient
                LinearGradient(
                    gradient: Gradient(colors: [
                        Color(red: 0.1, green: 0.2, blue: 0.4),
                        Color(red: 0.2, green: 0.3, blue: 0.5)
                    ]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                // Content based on current screen
                switch viewModel.currentScreen {
                case .playerForm:
                    PlayerFormView(viewModel: viewModel)
                case .modeSelection:
                    ModeSelectionView(viewModel: viewModel)
                case .game:
                    GameView(viewModel: viewModel)
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
