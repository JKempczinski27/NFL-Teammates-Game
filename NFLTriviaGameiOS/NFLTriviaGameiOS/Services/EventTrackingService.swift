// EventTrackingService.swift
// Event tracking service for NFL Trivia Game

import Foundation

class EventTrackingService {
    static let shared = EventTrackingService()

    private let sessionIdKey = "triviaSessionId"
    private var sessionId: String

    private init() {
        // Get or create session ID
        if let existingId = UserDefaults.standard.string(forKey: sessionIdKey) {
            self.sessionId = existingId
        } else {
            self.sessionId = UUID().uuidString
            UserDefaults.standard.set(self.sessionId, forKey: sessionIdKey)
        }
    }

    // MARK: - Track Game Start
    func trackGameStart(
        playerName: String,
        playerEmail: String,
        selectedTeam: String,
        selectedPlaymaker: String,
        difficulty: String
    ) async {
        let eventData = TrackingEvent.EventData(
            questionIndex: nil,
            userAnswer: nil,
            isCorrect: nil,
            pointsEarned: nil,
            platform: "iOS",
            playerName: playerName,
            playerEmail: playerEmail,
            selectedTeam: selectedTeam,
            selectedPlaymaker: selectedPlaymaker,
            difficulty: difficulty,
            finalScore: nil
        )

        let event = TrackingEvent(
            type: .gameStart,
            data: eventData,
            sessionId: sessionId
        )

        do {
            _ = try await APIClient.shared.trackEvent(event)
            print("✅ Game start tracked")
        } catch {
            print("❌ Failed to track game start: \(error)")
        }
    }

    // MARK: - Track Answer
    func trackAnswer(
        questionIndex: Int,
        userAnswer: String,
        isCorrect: Bool,
        pointsEarned: Int
    ) async {
        let eventData = TrackingEvent.EventData(
            questionIndex: questionIndex,
            userAnswer: userAnswer,
            isCorrect: isCorrect,
            pointsEarned: pointsEarned,
            platform: "iOS",
            playerName: nil,
            playerEmail: nil,
            selectedTeam: nil,
            selectedPlaymaker: nil,
            difficulty: nil,
            finalScore: nil
        )

        let event = TrackingEvent(
            type: .answer,
            data: eventData,
            sessionId: sessionId
        )

        do {
            _ = try await APIClient.shared.trackEvent(event)
            print("✅ Answer tracked")
        } catch {
            print("❌ Failed to track answer: \(error)")
        }
    }

    // MARK: - Track Game End
    func trackGameEnd(finalScore: Int) async {
        let eventData = TrackingEvent.EventData(
            questionIndex: nil,
            userAnswer: nil,
            isCorrect: nil,
            pointsEarned: nil,
            platform: "iOS",
            playerName: nil,
            playerEmail: nil,
            selectedTeam: nil,
            selectedPlaymaker: nil,
            difficulty: nil,
            finalScore: finalScore
        )

        let event = TrackingEvent(
            type: .gameEnd,
            data: eventData,
            sessionId: sessionId
        )

        do {
            _ = try await APIClient.shared.trackEvent(event)
            print("✅ Game end tracked")
        } catch {
            print("❌ Failed to track game end: \(error)")
        }
    }

    // MARK: - Track Share
    func trackShare(platform: String) async {
        let eventData = TrackingEvent.EventData(
            questionIndex: nil,
            userAnswer: nil,
            isCorrect: nil,
            pointsEarned: nil,
            platform: platform,
            playerName: nil,
            playerEmail: nil,
            selectedTeam: nil,
            selectedPlaymaker: nil,
            difficulty: nil,
            finalScore: nil
        )

        let event = TrackingEvent(
            type: .share,
            data: eventData,
            sessionId: sessionId
        )

        do {
            _ = try await APIClient.shared.trackEvent(event)
            print("✅ Share tracked")
        } catch {
            print("❌ Failed to track share: \(error)")
        }
    }

    // MARK: - Reset Session
    func resetSession() {
        self.sessionId = UUID().uuidString
        UserDefaults.standard.set(self.sessionId, forKey: sessionIdKey)
    }
}
