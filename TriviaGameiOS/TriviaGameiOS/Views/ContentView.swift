//
//  ContentView.swift
//  TriviaGameiOS
//
//  Created on 2025-11-30
//

import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = TriviaViewModel()
    @State private var currentScreen: Screen = .registration

    enum Screen {
        case registration
        case teamSelection
        case playmakerSelection
        case game
        case gameOver
    }

    var body: some View {
        ZStack {
            // NFL-themed background
            Color(red: 0.004, green: 0.2, blue: 0.41)
                .ignoresSafeArea()

            switch currentScreen {
            case .registration:
                RegistrationView(viewModel: viewModel) {
                    currentScreen = .teamSelection
                }
            case .teamSelection:
                TeamSelectionView(viewModel: viewModel) {
                    currentScreen = .playmakerSelection
                }
            case .playmakerSelection:
                PlaymakerSelectionView(viewModel: viewModel) {
                    currentScreen = .game
                }
            case .game:
                GameView(viewModel: viewModel) {
                    currentScreen = .gameOver
                }
            case .gameOver:
                GameOverView(viewModel: viewModel) {
                    viewModel.resetGame()
                    currentScreen = .registration
                }
            }
        }
    }
}

#Preview {
    ContentView()
}
