//
//  GameData.swift
//  TriviaGameiOS
//
//  Created on 2025-11-30
//

import Foundation

struct TriviaGameData: Codable {
    let name: String
    let email: String
    let team: String
    let score: Int
    let gameType: String
    let sessionId: String

    init(name: String, email: String, team: String, score: Int, sessionId: String) {
        self.name = name
        self.email = email
        self.team = team
        self.score = score
        self.gameType = "trivia"
        self.sessionId = sessionId
    }
}
