// EventTracking.swift
// Event tracking models for backend monitoring

import Foundation

// Event types that can be tracked
enum JourneymanEventType: String, Codable {
    case gameStart = "game_start"
    case guess = "guess"
    case gameComplete = "game_complete"
    case share = "share"
}

// Main event structure sent to backend
struct JourneymanTrackingEvent: Codable {
    let eventType: String
    let eventData: EventData
    let sessionId: String
    let timestamp: String

    struct EventData: Codable {
        let playerName: String?
        let playerEmail: String?
        let gameMode: String?
        let guess: String?
        let isCorrect: Bool?
        let currentPlayer: String?
        let correctCount: Int?
        let durationInSeconds: Int?
        let platform: String?
    }

    init(type: JourneymanEventType, data: EventData, sessionId: String) {
        self.eventType = type.rawValue
        self.eventData = data
        self.sessionId = sessionId

        let formatter = ISO8601DateFormatter()
        self.timestamp = formatter.string(from: Date())
    }
}

// Response from tracking endpoint
struct JourneymanTrackingResponse: Codable {
    let success: Bool
    let message: String?
}
