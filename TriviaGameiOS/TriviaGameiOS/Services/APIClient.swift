//
//  APIClient.swift
//  TriviaGameiOS
//
//  Created on 2025-11-30
//

import Foundation

class APIClient {
    static let shared = APIClient()
    private let baseURL = "https://nfl-teammates-game-production.up.railway.app"

    private init() {}

    func registerPlayer(name: String, email: String, favoriteTeam: String, sessionId: String) async throws {
        let url = URL(string: "\(baseURL)/api/players")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let payload: [String: Any] = [
            "name": name,
            "email": email,
            "gameType": "trivia",
            "favoriteTeam": favoriteTeam,
            "sessionId": sessionId
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (_, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }

        print("✅ Player registered successfully")
    }

    func submitGameData(name: String, email: String, team: String, score: Int, sessionId: String) async throws {
        let url = URL(string: "\(baseURL)/api/game-data")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let payload: [String: Any] = [
            "name": name,
            "email": email,
            "gameType": "trivia",
            "score": score,
            "correctCount": 0, // Trivia doesn't track individual correct count
            "durationInSeconds": 0, // Trivia doesn't track duration
            "sessionId": sessionId
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (_, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }

        print("✅ Game data submitted successfully to /api/game-data")
    }

    func trackEvent(_ event: TrackingEvent) async throws {
        let url = URL(string: "\(baseURL)/api/track")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        request.httpBody = try encoder.encode(event)

        let (_, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }

        print("✅ Event tracked: \(event.eventType)")
    }
}

enum APIError: Error {
    case invalidResponse
    case encodingError
    case networkError(Error)
}
