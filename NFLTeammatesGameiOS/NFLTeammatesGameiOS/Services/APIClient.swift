//
//  APIClient.swift
//  NFLTeammatesGameiOS
//
//  Created by NFL Teammates Game
//

import Foundation

class APIClient {
    static let shared = APIClient()

    // Use the same backend as the desktop version
    private let baseURL = "https://nfl-teammates-game-production.up.railway.app"

    private init() {}

    // MARK: - Generic Request Method

    private func performRequest<T: Decodable>(
        endpoint: String,
        method: String = "GET",
        body: Data? = nil
    ) async throws -> T {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let body = body {
            request.httpBody = body
        }

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.httpError(statusCode: httpResponse.statusCode)
        }

        do {
            let decoder = JSONDecoder()
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }

    // MARK: - API Endpoints

    func testConnection() async throws -> [String: String] {
        return try await performRequest(endpoint: "/", method: "GET")
    }

    func testDatabase() async throws -> [String: String] {
        return try await performRequest(endpoint: "/api/db-test", method: "GET")
    }

    func getPlayers() async throws -> [Player] {
        return try await performRequest(endpoint: "/api/getPlayers", method: "GET")
    }

    func addPlayer(name: String, position: String, team: String, yearsActive: String) async throws -> [String: String] {
        let playerData: [String: Any] = [
            "name": name,
            "position": position,
            "team": team,
            "yearsActive": yearsActive
        ]

        let jsonData = try JSONSerialization.data(withJSONObject: playerData)
        return try await performRequest(endpoint: "/api/addPlayer", method: "POST", body: jsonData)
    }

    func submitPlayerInfo(submission: PlayerSubmission) async throws -> [String: String] {
        let encoder = JSONEncoder()
        let jsonData = try encoder.encode(submission)
        return try await performRequest(endpoint: "/api/player", method: "POST", body: jsonData)
    }
}

// MARK: - API Errors

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case httpError(statusCode: Int)
    case decodingError(Error)
    case encodingError(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .httpError(let statusCode):
            return "HTTP error with status code: \(statusCode)"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .encodingError(let error):
            return "Failed to encode request: \(error.localizedDescription)"
        }
    }
}
