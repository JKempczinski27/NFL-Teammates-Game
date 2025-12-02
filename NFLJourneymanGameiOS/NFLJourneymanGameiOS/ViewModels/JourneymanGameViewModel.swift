// JourneymanGameViewModel.swift
// Game logic and state management for NFL Journeyman Game

import Foundation
import SwiftUI

@MainActor
class JourneymanGameViewModel: ObservableObject {
    // MARK: - Published Properties
    @Published var currentScreen: GameScreen = .playerForm
    @Published var playerName: String = ""
    @Published var playerEmail: String = ""
    @Published var gameMode: GameMode = .easy
    @Published var currentPlayerIndex: Int = 0
    @Published var currentTeamIndex: Int = 0
    @Published var guess: String = ""
    @Published var feedback: String = ""
    @Published var guesses: [Guess] = []
    @Published var correctCount: Int = 0
    @Published var gameEnded: Bool = false
    @Published var gameEndMessage: String = ""
    @Published var leaderboard: [LeaderboardEntry] = []

    // MARK: - Private Properties
    private var startTime: Date?
    private var gameSession: JourneymanGameSession?
    private var shuffledTeams: [String] = []

    // MARK: - Players Data
    let players: [JourneymanPlayer] = [
        JourneymanPlayer(
            name: "Ryan Fitzpatrick",
            imageURL: "/images/fitzpatrick.png",
            teams: [
                "Los Angeles Rams",
                "Cincinnati Bengals",
                "Buffalo Bills",
                "Tennessee Titans",
                "Houston Texans",
                "New York Jets",
                "Tampa Bay Buccaneers",
                "Miami Dolphins",
                "Washington Commanders"
            ]
        ),
        JourneymanPlayer(
            name: "Josh McCown",
            imageURL: "/images/mccown.png",
            teams: [
                "Arizona Cardinals",
                "Detroit Lions",
                "Las Vegas Raiders",
                "Carolina Panthers",
                "Chicago Bears",
                "Tampa Bay Buccaneers",
                "Cleveland Browns",
                "New York Jets",
                "Philadelphia Eagles"
            ]
        )
    ]

    // MARK: - Team Logos
    let teamLogos: [String: String] = [
        "Arizona Cardinals": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/ARI",
        "Atlanta Falcons": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/ATL",
        "Baltimore Ravens": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/BAL",
        "Buffalo Bills": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/BUF",
        "Carolina Panthers": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/CAR",
        "Chicago Bears": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/CHI",
        "Cincinnati Bengals": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/CIN",
        "Cleveland Browns": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/CLE",
        "Dallas Cowboys": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/DAL",
        "Denver Broncos": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/DEN",
        "Detroit Lions": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/DET",
        "Green Bay Packers": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/GB",
        "Houston Texans": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/HOU",
        "Indianapolis Colts": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/IND",
        "Jacksonville Jaguars": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/JAX",
        "Kansas City Chiefs": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/KC",
        "Las Vegas Raiders": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/LV",
        "Los Angeles Chargers": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/LAC",
        "Los Angeles Rams": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/LAR",
        "Miami Dolphins": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/MIA",
        "Minnesota Vikings": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/MIN",
        "New England Patriots": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/NE",
        "New Orleans Saints": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/NO",
        "New York Giants": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/NYG",
        "New York Jets": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/NYJ",
        "Philadelphia Eagles": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/PHI",
        "Pittsburgh Steelers": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/PIT",
        "San Francisco 49ers": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/SF",
        "Seattle Seahawks": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/SEA",
        "Tampa Bay Buccaneers": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/TB",
        "Tennessee Titans": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/TEN",
        "Washington Commanders": "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/WAS"
    ]

    // MARK: - Game Screens
    enum GameScreen {
        case playerForm
        case modeSelection
        case game
        case results
    }

    // MARK: - Start Game
    func startGame(mode: GameMode) {
        guard !playerName.isEmpty && !playerEmail.isEmpty else {
            return
        }

        gameMode = mode
        gameSession = JourneymanGameSession(
            playerName: playerName,
            playerEmail: playerEmail,
            gameMode: mode
        )
        startTime = Date()

        // Shuffle teams if challenge mode
        if mode == .challenge {
            shuffledTeams = players[currentPlayerIndex].teams.shuffled()
        } else {
            shuffledTeams = players[currentPlayerIndex].teams
        }

        currentTeamIndex = 0
        guesses = []
        correctCount = 0
        gameEnded = false

        // Track game start
        Task {
            await JourneymanEventTrackingService.shared.trackGameStart(
                playerName: playerName,
                playerEmail: playerEmail,
                gameMode: mode.rawValue
            )
        }

        currentScreen = .game
    }

    // MARK: - Handle Guess
    func handleGuess() {
        let trimmedGuess = guess.trim()
        let currentPlayer = players[currentPlayerIndex]
        let isCorrect = trimmedGuess.lowercased() == currentPlayer.name.lowercased()

        // Create guess record
        let guessRecord = Guess(team: shuffledTeams[currentTeamIndex], isCorrect: isCorrect)
        guesses.append(guessRecord)

        // Track guess
        Task {
            await JourneymanEventTrackingService.shared.trackGuess(
                playerName: playerName,
                guess: trimmedGuess,
                isCorrect: isCorrect,
                currentPlayer: currentPlayer.name,
                gameMode: gameMode.rawValue
            )
        }

        if isCorrect {
            feedback = "✅ Correct!"
            correctCount += 1

            // Move to next team
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                self.nextTeam()
            }
        } else {
            feedback = "❌ Try again!"
        }

        guess = ""
    }

    // MARK: - Next Team
    func nextTeam() {
        feedback = ""
        currentTeamIndex += 1

        if currentTeamIndex >= shuffledTeams.count {
            // Move to next player or end game
            currentPlayerIndex += 1
            if currentPlayerIndex < players.count {
                // Next player
                if gameMode == .challenge {
                    shuffledTeams = players[currentPlayerIndex].teams.shuffled()
                } else {
                    shuffledTeams = players[currentPlayerIndex].teams
                }
                currentTeamIndex = 0
                guesses = []
            } else {
                endGame()
            }
        }
    }

    // MARK: - Quit Game
    func quitGame() {
        gameEnded = true
        gameEndMessage = "Game ended early. You scored \(correctCount) correct guesses!"
        endGame()
    }

    // MARK: - End Game
    private func endGame() {
        gameEnded = true
        if gameEndMessage.isEmpty {
            gameEndMessage = "Congratulations! You completed the game with \(correctCount) correct guesses!"
        }

        // Calculate duration
        let duration = Int(Date().timeIntervalSince(startTime ?? Date()))

        // Track game complete
        Task {
            await JourneymanEventTrackingService.shared.trackGameComplete(
                playerName: playerName,
                correctCount: correctCount,
                durationInSeconds: duration,
                gameMode: gameMode.rawValue
            )

            // Save player data
            await savePlayerData(duration: duration)

            // Fetch leaderboard
            await fetchLeaderboard()
        }

        currentScreen = .results
    }

    // MARK: - Save Player Data
    private func savePlayerData(duration: Int) async {
        let guessData = guesses.map { guess in
            JourneymanPlayerSaveRequest.GuessEntry(
                team: guess.team,
                isCorrect: guess.isCorrect,
                playerName: players[currentPlayerIndex].name
            )
        }

        let gameData = JourneymanPlayerSaveRequest.GameData(
            mode: gameMode.rawValue,
            guesses: guessData,
            sessionId: JourneymanEventTrackingService.shared.getSessionId()
        )

        let request = JourneymanPlayerSaveRequest(
            name: playerName,
            email: playerEmail,
            correctCount: correctCount,
            durationInSeconds: duration,
            gameData: gameData
        )

        do {
            _ = try await JourneymanAPIClient.shared.savePlayer(request: request)
            print("✅ Player data saved")
        } catch {
            print("❌ Failed to save player data: \(error)")
        }
    }

    // MARK: - Fetch Leaderboard
    func fetchLeaderboard() async {
        do {
            leaderboard = try await JourneymanAPIClient.shared.getLeaderboard(limit: 10)
        } catch {
            print("❌ Failed to fetch leaderboard: \(error)")
        }
    }

    // MARK: - Share Score
    func shareScore() {
        Task {
            await JourneymanEventTrackingService.shared.trackShare(platform: "iOS")
        }
    }

    // MARK: - Reset Game
    func resetGame() {
        currentScreen = .playerForm
        playerName = ""
        playerEmail = ""
        currentPlayerIndex = 0
        currentTeamIndex = 0
        guess = ""
        feedback = ""
        guesses = []
        correctCount = 0
        gameEnded = false
        gameEndMessage = ""
        startTime = nil
        gameSession = nil
    }

    // MARK: - Computed Properties
    var currentPlayer: JourneymanPlayer? {
        guard currentPlayerIndex < players.count else { return nil }
        return players[currentPlayerIndex]
    }

    var currentTeam: String? {
        guard currentTeamIndex < shuffledTeams.count else { return nil }
        return shuffledTeams[currentTeamIndex]
    }

    var displayedTeams: [String] {
        return Array(shuffledTeams.prefix(currentTeamIndex + 1))
    }
}

// MARK: - String Extension
extension String {
    func trim() -> String {
        return self.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
