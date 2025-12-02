// TriviaQuestion.swift
// Models for NFL Trivia Game

import Foundation

// Question model representing a trivia question
struct TriviaQuestion: Identifiable, Codable {
    let id: UUID
    let question: String
    let choices: [String]
    let answer: String
    let difficulty: Difficulty

    init(question: String, choices: [String], answer: String, difficulty: Difficulty) {
        self.id = UUID()
        self.question = question
        self.choices = choices
        self.answer = answer
        self.difficulty = difficulty
    }
}

// Difficulty levels matching the web version
enum Difficulty: String, Codable, CaseIterable {
    case handOff = "Hand-off"
    case checkDown = "Check-Down"
    case hailMary = "Hail-Mary"

    var timeLimit: TimeInterval {
        switch self {
        case .handOff: return 12.0
        case .checkDown: return 9.0
        case .hailMary: return 6.0
        }
    }

    var correctPoints: Int {
        switch self {
        case .handOff: return 5
        case .checkDown: return 15
        case .hailMary: return 25
        }
    }

    var incorrectPenalty: Int {
        switch self {
        case .handOff: return -1
        case .checkDown: return -6
        case .hailMary: return -15
        }
    }
}

// Team model for NFL teams
struct Team: Identifiable, Codable, Hashable {
    let id: UUID
    let name: String
    let logoURL: String

    init(name: String) {
        self.id = UUID()
        self.name = name
        self.logoURL = Team.getLogoURL(for: name)
    }

    static func getLogoURL(for teamName: String) -> String {
        let abbreviations: [String: String] = [
            "Arizona Cardinals": "ARI",
            "Atlanta Falcons": "ATL",
            "Baltimore Ravens": "BAL",
            "Buffalo Bills": "BUF",
            "Carolina Panthers": "CAR",
            "Chicago Bears": "CHI",
            "Cincinnati Bengals": "CIN",
            "Cleveland Browns": "CLE",
            "Dallas Cowboys": "DAL",
            "Denver Broncos": "DEN",
            "Detroit Lions": "DET",
            "Green Bay Packers": "GB",
            "Houston Texans": "HOU",
            "Indianapolis Colts": "IND",
            "Jacksonville Jaguars": "JAX",
            "Kansas City Chiefs": "KC",
            "Las Vegas Raiders": "LV",
            "Los Angeles Chargers": "LAC",
            "Los Angeles Rams": "LAR",
            "Miami Dolphins": "MIA",
            "Minnesota Vikings": "MIN",
            "New England Patriots": "NE",
            "New Orleans Saints": "NO",
            "New York Giants": "NYG",
            "New York Jets": "NYJ",
            "Philadelphia Eagles": "PHI",
            "Pittsburgh Steelers": "PIT",
            "San Francisco 49ers": "SF",
            "Seattle Seahawks": "SEA",
            "Tampa Bay Buccaneers": "TB",
            "Tennessee Titans": "TEN",
            "Washington Commanders": "WAS"
        ]

        if let abbrev = abbreviations[teamName] {
            return "https://static.www.nfl.com/t_q-best/league/api/clubs/logos/\(abbrev)"
        }
        return ""
    }
}

// Playmaker model for team's key players
struct Playmaker: Codable {
    let name: String
    let imageURL: String?

    init(name: String, imageURL: String? = nil) {
        self.name = name
        self.imageURL = imageURL
    }
}

// Answer feedback model
struct AnswerFeedback {
    let isCorrect: Bool
    let pointsEarned: Int
    let message: String
    let correctAnswer: String?
}

// Game session model
struct GameSession: Codable {
    let sessionId: UUID
    let playerName: String
    let playerEmail: String
    let selectedTeam: String
    let selectedPlaymaker: String
    let difficulty: Difficulty
    var totalYards: Int
    var questionsAnswered: Int
    var startTime: Date
    var endTime: Date?

    init(playerName: String, playerEmail: String, selectedTeam: String, selectedPlaymaker: String, difficulty: Difficulty) {
        self.sessionId = UUID()
        self.playerName = playerName
        self.playerEmail = playerEmail
        self.selectedTeam = selectedTeam
        self.selectedPlaymaker = selectedPlaymaker
        self.difficulty = difficulty
        self.totalYards = 0
        self.questionsAnswered = 0
        self.startTime = Date()
    }
}
