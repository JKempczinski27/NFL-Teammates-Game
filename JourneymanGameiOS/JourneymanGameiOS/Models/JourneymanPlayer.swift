//
//  JourneymanPlayer.swift
//  JourneymanGameiOS
//
//  Created on 2025-11-30
//

import Foundation

struct JourneymanPlayer: Identifiable, Codable {
    let id: UUID
    let name: String
    let image: String
    let teams: [String]

    init(name: String, image: String, teams: [String]) {
        self.id = UUID()
        self.name = name
        self.image = image
        self.teams = teams
    }

    static let ryFitzpatrick = JourneymanPlayer(
        name: "Ryan Fitzpatrick",
        image: "fitzpatrick",
        teams: [
            "Los Angeles Rams",
            "Cincinnati Bengals",
            "Buffalo Bills",
            "Tennessee Titans",
            "Houston Texans",
            "New York Jets",
            "Tampa Bay Buccaneers",
            "Miami Dolphins",
            "Washington Commanders"
        ]
    )

    static let joshMcCown = JourneymanPlayer(
        name: "Josh McCown",
        image: "mccown",
        teams: [
            "Arizona Cardinals",
            "Detroit Lions",
            "Las Vegas Raiders",
            "Carolina Panthers",
            "Chicago Bears",
            "Tampa Bay Buccaneers",
            "Cleveland Browns",
            "New York Jets",
            "Philadelphia Eagles"
        ]
    )

    static let allPlayers = [ryFitzpatrick, joshMcCown]
}

enum GameMode: String, Codable {
    case easy = "easy"
    case challenge = "challenge"
}

struct GameData: Codable {
    let name: String
    let email: String
    let gameType: String
    let correctCount: Int
    let durationInSeconds: Int
    let score: Int
    let sessionId: String

    // Additional metadata (optional for backend)
    let mode: String?
    let guesses: [String]?
    let sharedOnSocial: Bool?
}
