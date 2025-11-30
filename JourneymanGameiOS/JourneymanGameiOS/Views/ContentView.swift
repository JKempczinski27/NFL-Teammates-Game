//
//  ContentView.swift
//  JourneymanGameiOS
//
//  Created on 2025-11-30
//

import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = GameViewModel()
    @State private var currentScreen: Screen = .registration

    enum Screen {
        case registration
        case modeSelection
        case game
        case gameOver
    }

    var body: some View {
        ZStack {
            Color(red: 0.13, green: 0.13, blue: 0.13)
                .ignoresSafeArea()

            switch currentScreen {
            case .registration:
                RegistrationView(viewModel: viewModel) {
                    currentScreen = .modeSelection
                }
            case .modeSelection:
                ModeSelectionView(viewModel: viewModel) {
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
