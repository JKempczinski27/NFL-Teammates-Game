//
//  EventTrackingService.swift
//  NFLTeammatesGameiOS
//
//  Created by NFL Teammates Game
//
//  This service matches the backend monitoring system used in the desktop version
//  Endpoint: POST /api/track
//

import Foundation

class EventTrackingService {
    static let shared = EventTrackingService()

    private let baseURL = "https://nfl-teammates-game-production.up.railway.app"
    private let sessionId: String

    private init() {
        // Get or create session ID (equivalent to localStorage in web version)
        if let existingSessionId = UserDefaults.standard.string(forKey: "sessionId") {
            self.sessionId = existingSessionId
        } else {
            self.sessionId = UUID().uuidString
            UserDefaults.standard.set(self.sessionId, forKey: "sessionId")
        }
    }

    // MARK: - Public Methods

    /// Track a user event (matches the desktop version's trackEvent function)
    func trackEvent(eventType: String, eventData: EventData) async {
        let event = TrackingEvent(
            eventType: eventType,
            eventData: eventData,
            sessionId: sessionId,
            timestamp: ISO8601DateFormatter().string(from: Date())
        )

        await sendTrackingEvent(event)
    }

    /// Track an answer submission
    func trackAnswer(
        questionIndex: Int,
        userAnswer: String,
        isCorrect: Bool,
        attemptsLeft: Int
    ) async {
        let eventData = EventData(
            questionIndex: questionIndex,
            userAnswer: userAnswer,
            isCorrect: isCorrect,
            attemptsLeft: attemptsLeft
        )

        await trackEvent(eventType: "answer", eventData: eventData)
    }

    /// Track a social share
    func trackShare(platform: String) async {
        let eventData = EventData(platform: platform)
        await trackEvent(eventType: "share", eventData: eventData)
    }

    // MARK: - Private Methods

    private func sendTrackingEvent(_ event: TrackingEvent) async {
        guard let url = URL(string: "\(baseURL)/api/track") else {
            print("❌ Invalid tracking URL")
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        do {
            let encoder = JSONEncoder()
            request.httpBody = try encoder.encode(event)

            let (data, response) = try await URLSession.shared.data(for: request)

            if let httpResponse = response as? HTTPURLResponse {
                if (200...299).contains(httpResponse.statusCode) {
                    print("✅ Event tracked: \(event.eventType)")
                    if let responseString = String(data: data, encoding: .utf8) {
                        print("   Response: \(responseString)")
                    }
                } else {
                    print("⚠️ Event tracking failed with status: \(httpResponse.statusCode)")
                }
            }
        } catch {
            print("❌ Failed to track event: \(error.localizedDescription)")
        }
    }

    // MARK: - Session Management

    func getSessionId() -> String {
        return sessionId
    }

    func resetSession() {
        let newSessionId = UUID().uuidString
        UserDefaults.standard.set(newSessionId, forKey: "sessionId")
    }
}
