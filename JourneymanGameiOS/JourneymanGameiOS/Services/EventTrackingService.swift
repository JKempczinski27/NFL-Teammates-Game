//
//  EventTrackingService.swift
//  JourneymanGameiOS
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

    func trackModeSelection(playerName: String, mode: GameMode) {
        Task {
            let event = TrackingEvent(
                eventType: .modeSelection,
                eventData: [
                    "playerName": AnyCodable(playerName),
                    "mode": AnyCodable(mode.rawValue),
                    "platform": AnyCodable("ios")
                ],
                sessionId: sessionId
            )

            try? await APIClient.shared.trackEvent(event)
        }
    }

    func trackGameStart(playerName: String, playerEmail: String, mode: GameMode) {
        Task {
            let event = TrackingEvent(
                eventType: .gameStart,
                eventData: [
                    "name": AnyCodable(playerName),
                    "email": AnyCodable(playerEmail),
                    "mode": AnyCodable(mode.rawValue),
                    "platform": AnyCodable("ios")
                ],
                sessionId: sessionId
            )

            try? await APIClient.shared.trackEvent(event)
        }
    }

    func trackGuess(playerName: String, guess: String, isCorrect: Bool, correctAnswer: String, mode: GameMode) {
        Task {
            let event = TrackingEvent(
                eventType: .answer,
                eventData: [
                    "playerName": AnyCodable(playerName),
                    "guess": AnyCodable(guess),
                    "isCorrect": AnyCodable(isCorrect),
                    "correctAnswer": AnyCodable(correctAnswer),
                    "mode": AnyCodable(mode.rawValue),
                    "platform": AnyCodable("ios")
                ],
                sessionId: sessionId
            )

            try? await APIClient.shared.trackEvent(event)
        }
    }

    func trackGameComplete(playerName: String, correctCount: Int, duration: Int, guessCount: Int, mode: GameMode, sharedOnSocial: Bool) {
        Task {
            let event = TrackingEvent(
                eventType: .gameComplete,
                eventData: [
                    "playerName": AnyCodable(playerName),
                    "correctCount": AnyCodable(correctCount),
                    "durationInSeconds": AnyCodable(duration),
                    "guessCount": AnyCodable(guessCount),
                    "mode": AnyCodable(mode.rawValue),
                    "sharedOnSocial": AnyCodable(sharedOnSocial),
                    "platform": AnyCodable("ios")
                ],
                sessionId: sessionId
            )

            try? await APIClient.shared.trackEvent(event)
        }
    }

    func trackShare(platform: String) {
        Task {
            let event = TrackingEvent(
                eventType: .share,
                eventData: [
                    "platform": AnyCodable(platform)
                ],
                sessionId: sessionId
            )

            try? await APIClient.shared.trackEvent(event)
        }
    }
}
