//
//  Player.swift
//  NFLTeammatesGameiOS
//
//  Created by NFL Teammates Game
//

import Foundation

struct Player: Codable, Identifiable, Equatable {
    let id: Int
    let name: String
    let position: String?
    let imageUrl: String
    let teamsPlayed: [String]?
    let yearsActive: String?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case position
        case imageUrl = "image_url"
        case teamsPlayed = "teams_played"
        case yearsActive = "years_active"
    }
}

struct Question: Codable, Identifiable {
    let id: Int
    let clues: [Player]
    let answer: Player
    let difficulty: String?
    let category: String?

    enum CodingKeys: String, CodingKey {
        case id
        case clues
        case answer
        case difficulty
        case category
    }
}

struct Answer: Equatable {
    let player: Player
    let isCorrect: Bool
    let attemptNumber: Int
}
