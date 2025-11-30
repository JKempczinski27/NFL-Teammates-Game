//
//  EventTracking.swift
//  TriviaGameiOS
//
//  Created on 2025-11-30
//

import Foundation

enum EventType: String, Codable {
    case gameStart = "game_start"
    case answer = "answer"
    case share = "share"
    case gameComplete = "game_complete"
    case teamSelection = "team_selection"
    case playmakerSelection = "playmaker_selection"
    case playerRegistration = "player_registration"
}

struct TrackingEvent: Codable {
    let eventType: String
    let eventData: [String: AnyCodable]
    let sessionId: String
    let timestamp: String

    init(eventType: EventType, eventData: [String: AnyCodable], sessionId: String) {
        self.eventType = eventType.rawValue
        self.eventData = eventData
        self.sessionId = sessionId
        self.timestamp = ISO8601DateFormatter().string(from: Date())
    }
}

// Helper to encode any type
struct AnyCodable: Codable {
    let value: Any

    init(_ value: Any) {
        self.value = value
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()

        switch value {
        case let string as String:
            try container.encode(string)
        case let int as Int:
            try container.encode(int)
        case let double as Double:
            try container.encode(double)
        case let bool as Bool:
            try container.encode(bool)
        case let array as [Any]:
            try container.encode(array.map { AnyCodable($0) })
        case let dict as [String: Any]:
            try container.encode(dict.mapValues { AnyCodable($0) })
        default:
            try container.encodeNil()
        }
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()

        if let string = try? container.decode(String.self) {
            value = string
        } else if let int = try? container.decode(Int.self) {
            value = int
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else if let bool = try? container.decode(Bool.self) {
            value = bool
        } else {
            value = ""
        }
    }
}
