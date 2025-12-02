// APIClient.swift
// Backend API client for NFL Trivia Game

import Foundation

class APIClient {
    static let shared = APIClient()

    private let baseURL = "https://nfl-teammates-game-production.up.railway.app"

    private init() {}

    // MARK: - Health Check
    func testConnection() async throws -> String {
        let url = URL(string: "\(baseURL)/")!
        let (data, _) = try await URLSession.shared.data(from: url)
        return String(data: data, encoding: .utf8) ?? "Unknown response"
    }

    // MARK: - Database Test
    func testDatabase() async throws -> String {
        let url = URL(string: "\(baseURL)/api/db-test")!
        let (data, _) = try await URLSession.shared.data(from: url)
        return String(data: data, encoding: .utf8) ?? "Unknown response"
    }

    // MARK: - Save Trivia Player
    func savePlayer(name: String, email: String, team: String, score: Int) async throws -> TriviaPlayerSaveResponse {
        let url = URL(string: "\(baseURL)/api/trivia/players")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let playerData = TriviaPlayerSaveRequest(
            name: name,
            email: email,
            team: team,
            score: score
        )

        request.httpBody = try JSONEncoder().encode(playerData)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.badResponse
        }

        return try JSONDecoder().decode(TriviaPlayerSaveResponse.self, from: data)
    }

    // MARK: - Get Leaderboard
    func getLeaderboard(limit: Int = 10) async throws -> [TriviaPlayer] {
        let url = URL(string: "\(baseURL)/api/trivia/leaderboard?limit=\(limit)")!
        let (data, response) = try await URLSession.shared.data(from: url)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.badResponse
        }

        return try JSONDecoder().decode([TriviaPlayer].self, from: data)
    }

    // MARK: - Track Event
    func trackEvent(_ event: TrackingEvent) async throws -> TrackingResponse {
        let url = URL(string: "\(baseURL)/api/track")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        request.httpBody = try JSONEncoder().encode(event)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.badResponse
        }

        return try JSONDecoder().decode(TrackingResponse.self, from: data)
    }
}

// MARK: - API Errors
enum APIError: Error, LocalizedError {
    case invalidURL
    case badResponse
    case decodingError
    case networkError(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .badResponse:
            return "Bad response from server"
        case .decodingError:
            return "Failed to decode response"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        }
    }
}
