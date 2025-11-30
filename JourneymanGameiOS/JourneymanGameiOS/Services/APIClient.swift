//
//  APIClient.swift
//  JourneymanGameiOS
//
//  Created on 2025-11-30
//

import Foundation

class APIClient {
    static let shared = APIClient()
    private let baseURL = "https://nfl-teammates-game-production.up.railway.app"

    private init() {}

    func uploadGameData(_ gameData: GameData) async throws {
        let url = URL(string: "\(baseURL)/api/game-data")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        request.httpBody = try encoder.encode(gameData)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }

        print("✅ Game data uploaded successfully to /api/game-data")
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
