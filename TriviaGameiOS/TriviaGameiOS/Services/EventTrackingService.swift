//
//  EventTrackingService.swift
//  TriviaGameiOS
//
//  Created on 2025-11-30
//

import Foundation

class EventTrackingService {
    static let shared = EventTrackingService()
    private let sessionId: String

    private init() {
        // Get or create session ID
        if let existingId = UserDefaults.standard.string(forKey: "sessionId") {
            self.sessionId = existingId
        } else {
            let newId = UUID().uuidString
            UserDefaults.standard.set(newId, forKey: "sessionId")
            self.sessionId = newId
        }
    }

    func trackPlayerRegistration(name: String, email: String) {
        Task {
            let event = TrackingEvent(
                eventType: .playerRegistration,
                eventData: [
                    "name": AnyCodable(name),
                    "email": AnyCodable(email),
                    "platform": AnyCodable("ios")
                ],
                sessionId: sessionId
            )

            try? await APIClient.shared.trackEvent(event)
        }
    }

    func trackTeamSelection(team: String) {
        Task {
            let event = TrackingEvent(
                eventType: .teamSelection,
                eventData: [
                    "team": AnyCodable(team),
                    "platform": AnyCodable("ios")
                ],
                sessionId: sessionId
            )

            try? await APIClient.shared.trackEvent(event)
        }
    }

    func trackPlaymakerSelection(playmaker: String, team: String) {
        Task {
            let event = TrackingEvent(
                eventType: .playmakerSelection,
                eventData: [
                    "playmaker": AnyCodable(playmaker),
                    "team": AnyCodable(team),
                    "platform": AnyCodable("ios")
                ],
                sessionId: sessionId
            )

            try? await APIClient.shared.trackEvent(event)
        }
    }

    func trackGameStart(playerName: String, playerEmail: String, team: String) {
        Task {
            let event = TrackingEvent(
                eventType: .gameStart,
                eventData: [
                    "name": AnyCodable(playerName),
                    "email": AnyCodable(playerEmail),
                    "team": AnyCodable(team),
                    "platform": AnyCodable("ios")
                ],
                sessionId: sessionId
            )

            try? await APIClient.shared.trackEvent(event)
        }
    }

    func trackAnswer(question: String, choice: String, isCorrect: Bool, difficulty: String, score: Int) {
        Task {
            let event = TrackingEvent(
                eventType: .answer,
                eventData: [
                    "question": AnyCodable(question),
                    "choice": AnyCodable(choice),
                    "isCorrect": AnyCodable(isCorrect),
                    "difficulty": AnyCodable(difficulty),
                    "score": AnyCodable(score),
                    "platform": AnyCodable("ios")
                ],
                sessionId: sessionId
            )

            try? await APIClient.shared.trackEvent(event)
        }
    }

    func trackGameComplete(playerName: String, team: String, finalScore: Int) {
        Task {
            let event = TrackingEvent(
                eventType: .gameComplete,
                eventData: [
                    "playerName": AnyCodable(playerName),
                    "team": AnyCodable(team),
                    "finalScore": AnyCodable(finalScore),
                    "platform": AnyCodable("ios")
                ],
                sessionId: sessionId
            )

            try? await APIClient.shared.trackEvent(event)
        }
    }

    func trackShare(platform: String, score: Int) {
        Task {
            let event = TrackingEvent(
                eventType: .share,
                eventData: [
                    "platform": AnyCodable(platform),
                    "score": AnyCodable(score)
                ],
                sessionId: sessionId
            )

            try? await APIClient.shared.trackEvent(event)
        }
    }
}
