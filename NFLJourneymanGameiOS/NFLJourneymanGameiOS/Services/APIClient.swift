// APIClient.swift
// Backend API client for NFL Journeyman Game

import Foundation

class JourneymanAPIClient {
    static let shared = JourneymanAPIClient()

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

    // MARK: - Save Journeyman Player
    func savePlayer(request: JourneymanPlayerSaveRequest) async throws -> JourneymanPlayerSaveResponse {
        let url = URL(string: "\(baseURL)/api/journeyman/save-player")!
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

        urlRequest.httpBody = try JSONEncoder().encode(request)

        let (data, response) = try await URLSession.shared.data(for: urlRequest)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.badResponse
        }

        return try JSONDecoder().decode(JourneymanPlayerSaveResponse.self, from: data)
    }

    // MARK: - Get Leaderboard
    func getLeaderboard(limit: Int = 10) async throws -> [LeaderboardEntry] {
        let url = URL(string: "\(baseURL)/api/journeyman/leaderboard?limit=\(limit)")!
        let (data, response) = try await URLSession.shared.data(from: url)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.badResponse
        }

        let leaderboardResponse = try JSONDecoder().decode(LeaderboardResponse.self, from: data)
        return leaderboardResponse.leaderboard
    }

    // MARK: - Track Event
    func trackEvent(_ event: JourneymanTrackingEvent) async throws -> JourneymanTrackingResponse {
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

        return try JSONDecoder().decode(JourneymanTrackingResponse.self, from: data)
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
