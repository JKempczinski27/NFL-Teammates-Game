//
//  EventTracking.swift
//  NFLTeammatesGameiOS
//
//  Created by NFL Teammates Game
//

import Foundation

struct TrackingEvent: Codable {
    let eventType: String
    let eventData: EventData
    let sessionId: String
    let timestamp: String

    enum CodingKeys: String, CodingKey {
        case eventType = "eventType"
        case eventData = "eventData"
        case sessionId = "sessionId"
        case timestamp = "timestamp"
    }
}

struct EventData: Codable {
    let questionIndex: Int?
    let userAnswer: String?
    let isCorrect: Bool?
    let attemptsLeft: Int?
    let platform: String?

    enum CodingKeys: String, CodingKey {
        case questionIndex = "questionIndex"
        case userAnswer = "userAnswer"
        case isCorrect = "isCorrect"
        case attemptsLeft = "attemptsLeft"
        case platform = "platform"
    }

    init(questionIndex: Int? = nil, userAnswer: String? = nil, isCorrect: Bool? = nil, attemptsLeft: Int? = nil, platform: String? = nil) {
        self.questionIndex = questionIndex
        self.userAnswer = userAnswer
        self.isCorrect = isCorrect
        self.attemptsLeft = attemptsLeft
        self.platform = platform
    }
}

struct PlayerSubmission: Codable {
    let sessionId: String
    let name: String
    let position: String
    let team: String
    let yearsActive: String

    enum CodingKeys: String, CodingKey {
        case sessionId = "sessionId"
        case name = "name"
        case position = "position"
        case team = "team"
        case yearsActive = "yearsActive"
    }
}
