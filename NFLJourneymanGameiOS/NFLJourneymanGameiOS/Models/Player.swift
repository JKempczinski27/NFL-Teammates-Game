// Player.swift
// Models for NFL Journeyman Game

import Foundation

// Player model representing a journeyman NFL player
struct JourneymanPlayer: Identifiable, Codable {
    let id: UUID
    let name: String
    let imageURL: String
    let teams: [String]

    init(name: String, imageURL: String, teams: [String]) {
        self.id = UUID()
        self.name = name
        self.imageURL = imageURL
        self.teams = teams
    }
}

// Game mode enum
enum GameMode: String {
    case easy = "easy"
    case challenge = "challenge"
}

// Guess model
struct Guess: Identifiable {
    let id: UUID
    let team: String
    let isCorrect: Bool
    let timestamp: Date

    init(team: String, isCorrect: Bool) {
        self.id = UUID()
        self.team = team
        self.isCorrect = isCorrect
        self.timestamp = Date()
    }
}

// Game session model
struct JourneymanGameSession: Codable {
    let sessionId: String
    let playerName: String
    let playerEmail: String
    let gameMode: String
    var correctCount: Int
    var durationInSeconds: Int
    let startTime: Date
    var endTime: Date?
    var guesses: [GuessData]

    struct GuessData: Codable {
        let team: String
        let isCorrect: Bool
        let playerName: String
        let timestamp: String
    }

    init(playerName: String, playerEmail: String, gameMode: GameMode) {
        self.sessionId = "journeyman_\(Date().timeIntervalSince1970)_\(UUID().uuidString.prefix(8))"
        self.playerName = playerName
        self.playerEmail = playerEmail
        self.gameMode = gameMode.rawValue
        self.correctCount = 0
        self.durationInSeconds = 0
        self.startTime = Date()
        self.guesses = []
    }
}

// Player save request
struct JourneymanPlayerSaveRequest: Codable {
    let name: String
    let email: String
    let correctCount: Int
    let durationInSeconds: Int
    let gameData: GameData?

    struct GameData: Codable {
        let mode: String
        let guesses: [GuessEntry]
        let sessionId: String
    }

    struct GuessEntry: Codable {
        let team: String
        let isCorrect: Bool
        let playerName: String
    }
}

// Player save response
struct JourneymanPlayerSaveResponse: Codable {
    let success: Bool
    let message: String
    let player: SavedPlayer?

    struct SavedPlayer: Codable {
        let id: Int
        let name: String
        let email: String
        let correctCount: Int
        let durationInSeconds: Int
    }
}

// Leaderboard response
struct LeaderboardResponse: Codable {
    let success: Bool
    let leaderboard: [LeaderboardEntry]
}

struct LeaderboardEntry: Codable, Identifiable {
    var id: String { "\(name)_\(createdAt ?? "")" }
    let name: String
    let correctCount: Int
    let durationInSeconds: Int
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case name
        case correctCount = "correct_count"
        case durationInSeconds = "duration_seconds"
        case createdAt = "created_at"
    }
}
