//
//  GameViewModel.swift
//  JourneymanGameiOS
//
//  Created on 2025-11-30
//

import Foundation
import SwiftUI

@MainActor
class GameViewModel: ObservableObject {
    @Published var currentPlayerIndex = 0
    @Published var guess = ""
    @Published var guesses: [String] = []
    @Published var feedback = ""
    @Published var correctCount = 0
    @Published var gameMode: GameMode = .easy
    @Published var shuffledTeams: [String] = []
    @Published var gameEnded = false
    @Published var playerName = ""
    @Published var playerEmail = ""
    @Published var startTime: Date?
    @Published var durationInSeconds = 0
    @Published var sharedOnSocial = false
    @Published var uploadStatus: UploadStatus = .idle

    var currentPlayer: JourneymanPlayer {
        JourneymanPlayer.allPlayers[currentPlayerIndex]
    }

    var displayTeams: [String] {
        shuffledTeams
    }

    enum UploadStatus {
        case idle, uploading, success, error
    }

    func selectMode(_ mode: GameMode) {
        self.gameMode = mode
        EventTrackingService.shared.trackModeSelection(playerName: playerName, mode: mode)
        shuffleTeamsIfNeeded()
    }

    func startGame(name: String, email: String) {
        self.playerName = name
        self.playerEmail = email
        self.startTime = Date()

        EventTrackingService.shared.trackPlayerRegistration(name: name, email: email)
        EventTrackingService.shared.trackGameStart(playerName: name, playerEmail: email, mode: gameMode)
    }

    func shuffleTeamsIfNeeded() {
        if gameMode == .challenge {
            shuffledTeams = currentPlayer.teams.shuffled()
        } else {
            shuffledTeams = currentPlayer.teams
        }
    }

    func submitGuess() {
        let trimmedGuess = guess.trimmingCharacters(in: .whitespaces)
        guesses.append(trimmedGuess)

        let isCorrect = trimmedGuess.lowercased() == currentPlayer.name.lowercased()

        EventTrackingService.shared.trackGuess(
            playerName: playerName,
            guess: trimmedGuess,
            isCorrect: isCorrect,
            correctAnswer: currentPlayer.name,
            mode: gameMode
        )

        if isCorrect {
            feedback = "✅ Correct!"
            correctCount += 1
        } else {
            feedback = "❌ Try again!"
        }
    }

    func nextPlayer() {
        feedback = ""
        guess = ""
        guesses = []
        currentPlayerIndex = (currentPlayerIndex + 1) % JourneymanPlayer.allPlayers.count
        shuffleTeamsIfNeeded()
    }

    func endGame() {
        guard let startTime = startTime else { return }

        let duration = Int(Date().timeIntervalSince(startTime))
        durationInSeconds = duration
        gameEnded = true

        EventTrackingService.shared.trackGameComplete(
            playerName: playerName,
            correctCount: correctCount,
            duration: duration,
            guessCount: guesses.count,
            mode: gameMode,
            sharedOnSocial: sharedOnSocial
        )

        uploadGameData()
    }

    func uploadGameData() {
        uploadStatus = .uploading

        let gameData = GameData(
            name: playerName,
            email: playerEmail,
            gameType: "journeyman",
            mode: gameMode.rawValue,
            durationInSeconds: durationInSeconds,
            guesses: guesses,
            correctCount: correctCount,
            sharedOnSocial: sharedOnSocial,
            sessionId: UserDefaults.standard.string(forKey: "sessionId") ?? ""
        )

        Task {
            do {
                try await APIClient.shared.uploadGameData(gameData)
                uploadStatus = .success
            } catch {
                print("❌ Failed to upload game data: \(error)")
                uploadStatus = .error
            }
        }
    }

    func shareOnSocial(platform: String) {
        sharedOnSocial = true
        EventTrackingService.shared.trackShare(platform: platform)
    }

    func resetGame() {
        currentPlayerIndex = 0
        guess = ""
        guesses = []
        feedback = ""
        correctCount = 0
        gameEnded = false
        startTime = nil
        durationInSeconds = 0
        sharedOnSocial = false
        uploadStatus = .idle
        shuffleTeamsIfNeeded()
    }
}
