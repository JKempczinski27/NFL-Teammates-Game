// EventTracking.swift
// Event tracking models for backend monitoring

import Foundation

// Event types that can be tracked
enum EventType: String, Codable {
    case answer = "answer"
    case share = "share"
    case gameStart = "game_start"
    case gameEnd = "game_end"
}

// Main event structure sent to backend
struct TrackingEvent: Codable {
    let eventType: String
    let eventData: EventData
    let sessionId: String
    let timestamp: String

    struct EventData: Codable {
        let questionIndex: Int?
        let userAnswer: String?
        let isCorrect: Bool?
        let pointsEarned: Int?
        let platform: String?
        let playerName: String?
        let playerEmail: String?
        let selectedTeam: String?
        let selectedPlaymaker: String?
        let difficulty: String?
        let finalScore: Int?
    }

    init(type: EventType, data: EventData, sessionId: String) {
        self.eventType = type.rawValue
        self.eventData = data
        self.sessionId = sessionId

        let formatter = ISO8601DateFormatter()
        self.timestamp = formatter.string(from: Date())
    }
}

// Response from tracking endpoint
struct TrackingResponse: Codable {
    let success: Bool
    let message: String?
}

// Player save request
struct TriviaPlayerSaveRequest: Codable {
    let name: String
    let email: String
    let team: String
    let score: Int
}

// Player save response
struct TriviaPlayerSaveResponse: Codable {
    let message: String
    let player: TriviaPlayer?
}

// Trivia player model
struct TriviaPlayer: Codable {
    let id: Int?
    let name: String
    let email: String
    let team: String
    let score: Int
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id, name, email, team, score
        case createdAt = "created_at"
    }
}
