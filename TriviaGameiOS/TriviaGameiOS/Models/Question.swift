//
//  Question.swift
//  TriviaGameiOS
//
//  Created on 2025-11-30
//

import Foundation

struct Question: Identifiable {
    let id = UUID()
    let question: String
    let choices: [String]
    let answer: String
    let difficulty: Difficulty
}

enum Difficulty: String, CaseIterable {
    case handOff = "Hand-off"
    case checkDown = "Check-Down"
    case hailMary = "Hail-Mary"

    var timeLimit: Double {
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

    var incorrectPoints: Int {
        switch self {
        case .handOff: return -1
        case .checkDown: return -6
        case .hailMary: return -15
        }
    }
}

struct QuestionBank {
    static let handOffQuestions: [Question] = [
        Question(
            question: "How many points is a touchdown worth?",
            choices: ["3 points", "5 points", "6 points", "7 points"],
            answer: "6 points",
            difficulty: .handOff
        ),
        Question(
            question: "Who is the NFL All-Time Rushing Yards Leader?",
            choices: ["Saqoun Barkley", "Emmitt Smith", "LaDainian Tomlinson", "Jim Brown"],
            answer: "Emmitt Smith",
            difficulty: .handOff
        ),
        Question(
            question: "Who does Joe Burrow play for?",
            choices: ["Cincinnati Bengals", "New York Giants", "Chicago Bears", "Philadelphia Eagles"],
            answer: "Cincinnati Bengals",
            difficulty: .handOff
        ),
        Question(
            question: "Tom Brady won 6 Super Bowls with which team?",
            choices: ["Houston Texans", "New England Patriots", "New York Jets", "Tampa Bay Buccaneers"],
            answer: "New England Patriots",
            difficulty: .handOff
        )
    ]

    static let checkDownQuestions: [Question] = [
        Question(
            question: "Where is the Pro Football Hall of Fame located?",
            choices: ["Springfield, Massachusetts", "Cooperstown, New York", "Canton, Ohio", "Indianapolis, Indiana"],
            answer: "Canton, Ohio",
            difficulty: .checkDown
        ),
        Question(
            question: "Which former Browns running back was on the cover of Madden 12?",
            choices: ["Peyton Hillis", "Trent Richardson", "Jamal Lewis", "William Green"],
            answer: "Peyton Hillis",
            difficulty: .checkDown
        ),
        Question(
            question: "Which stadium holds the attendance record for a regular season game?",
            choices: ["AT&T Stadium", "MetLife Field", "Arrowhead Stadium", "Northwest Stadium"],
            answer: "AT&T Stadium",
            difficulty: .checkDown
        ),
        Question(
            question: "In the 2024 NFL Combine, Xavier Worthy set a new 40-yard dash record. Who held the record before him?",
            choices: ["Deion Sanders", "John Ross", "Chris Johnson", "Tyreek Hill"],
            answer: "John Ross",
            difficulty: .checkDown
        )
    ]

    static let hailMaryQuestions: [Question] = [
        Question(
            question: "Which 2010 Pro Bowl quarterback never started a game in college?",
            choices: ["Matt Cassel", "Sam Bradford", "Matthew Stafford", "Ryan Fitzpatrick"],
            answer: "Matt Cassel",
            difficulty: .hailMary
        ),
        Question(
            question: "Which NFL quarterback threw for over 5,000 yards in a season and was not selected for the Pro Bowl?",
            choices: ["Dan Marino", "Matt Ryan", "Brett Favre", "Matthew Stafford"],
            answer: "Matthew Stafford",
            difficulty: .hailMary
        ),
        Question(
            question: "Which former NFL MVP quarterback began his college career as a tight end?",
            choices: ["Kurt Warner", "Joe Theismann", "Josh Allen", "Steve McNair"],
            answer: "Joe Theismann",
            difficulty: .hailMary
        ),
        Question(
            question: "Which former NFL Offensive Lineman holds the record for the longest kick return by a lineman?",
            choices: ["Dan Connolly", "Jonathan Ogden", "Joe Thomas", "Shaq Mason"],
            answer: "Dan Connolly",
            difficulty: .hailMary
        )
    ]

    static func getRandomQuestion(for difficulty: Difficulty, excluding: [String]) -> Question? {
        let questions: [Question]
        switch difficulty {
        case .handOff: questions = handOffQuestions
        case .checkDown: questions = checkDownQuestions
        case .hailMary: questions = hailMaryQuestions
        }

        let available = questions.filter { !excluding.contains($0.question) }
        return available.randomElement()
    }
}
