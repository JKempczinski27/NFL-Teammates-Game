// EventTrackingService.swift
// Event tracking service for NFL Journeyman Game

import Foundation

class JourneymanEventTrackingService {
    static let shared = JourneymanEventTrackingService()

    private let sessionIdKey = "journeymanSessionId"
    private var sessionId: String

    private init() {
        // Get or create session ID
        if let existingId = UserDefaults.standard.string(forKey: sessionIdKey) {
            self.sessionId = existingId
        } else {
            self.sessionId = "journeyman_\(Date().timeIntervalSince1970)_\(UUID().uuidString.prefix(8))"
            UserDefaults.standard.set(self.sessionId, forKey: sessionIdKey)
        }
    }

    // MARK: - Track Game Start
    func trackGameStart(
        playerName: String,
        playerEmail: String,
        gameMode: String
    ) async {
        let eventData = JourneymanTrackingEvent.EventData(
            playerName: playerName,
            playerEmail: playerEmail,
            gameMode: gameMode,
            guess: nil,
            isCorrect: nil,
            currentPlayer: nil,
            correctCount: nil,
            durationInSeconds: nil,
            platform: "iOS"
        )

        let event = JourneymanTrackingEvent(
            type: .gameStart,
            data: eventData,
            sessionId: sessionId
        )

        do {
            _ = try await JourneymanAPIClient.shared.trackEvent(event)
            print("✅ Game start tracked")
        } catch {
            print("❌ Failed to track game start: \(error)")
        }
    }

    // MARK: - Track Guess
    func trackGuess(
        playerName: String,
        guess: String,
        isCorrect: Bool,
        currentPlayer: String,
        gameMode: String
    ) async {
        let eventData = JourneymanTrackingEvent.EventData(
            playerName: playerName,
            playerEmail: nil,
            gameMode: gameMode,
            guess: guess,
            isCorrect: isCorrect,
            currentPlayer: currentPlayer,
            correctCount: nil,
            durationInSeconds: nil,
            platform: "iOS"
        )

        let event = JourneymanTrackingEvent(
            type: .guess,
            data: eventData,
            sessionId: sessionId
        )

        do {
            _ = try await JourneymanAPIClient.shared.trackEvent(event)
            print("✅ Guess tracked")
        } catch {
            print("❌ Failed to track guess: \(error)")
        }
    }

    // MARK: - Track Game Complete
    func trackGameComplete(
        playerName: String,
        correctCount: Int,
        durationInSeconds: Int,
        gameMode: String
    ) async {
        let eventData = JourneymanTrackingEvent.EventData(
            playerName: playerName,
            playerEmail: nil,
            gameMode: gameMode,
            guess: nil,
            isCorrect: nil,
            currentPlayer: nil,
            correctCount: correctCount,
            durationInSeconds: durationInSeconds,
            platform: "iOS"
        )

        let event = JourneymanTrackingEvent(
            type: .gameComplete,
            data: eventData,
            sessionId: sessionId
        )

        do {
            _ = try await JourneymanAPIClient.shared.trackEvent(event)
            print("✅ Game complete tracked")
        } catch {
            print("❌ Failed to track game complete: \(error)")
        }
    }

    // MARK: - Track Share
    func trackShare(platform: String) async {
        let eventData = JourneymanTrackingEvent.EventData(
            playerName: nil,
            playerEmail: nil,
            gameMode: nil,
            guess: nil,
            isCorrect: nil,
            currentPlayer: nil,
            correctCount: nil,
            durationInSeconds: nil,
            platform: platform
        )

        let event = JourneymanTrackingEvent(
            type: .share,
            data: eventData,
            sessionId: sessionId
        )

        do {
            _ = try await JourneymanAPIClient.shared.trackEvent(event)
            print("✅ Share tracked")
        } catch {
            print("❌ Failed to track share: \(error)")
        }
    }

    // MARK: - Reset Session
    func resetSession() {
        self.sessionId = "journeyman_\(Date().timeIntervalSince1970)_\(UUID().uuidString.prefix(8))"
        UserDefaults.standard.set(self.sessionId, forKey: sessionIdKey)
    }

    // MARK: - Get Session ID
    func getSessionId() -> String {
        return sessionId
    }
}
