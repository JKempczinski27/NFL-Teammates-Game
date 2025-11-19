//
//  GameViewModel.swift
//  NFLTeammatesGameiOS
//
//  Created by NFL Teammates Game
//

import Foundation
import SwiftUI

@MainActor
class GameViewModel: ObservableObject {
    // MARK: - Published Properties

    @Published var currentQuestionIndex = 0
    @Published var attemptsLeft = 4
    @Published var selectedAnswers: [Answer] = []
    @Published var isGameOver = false
    @Published var showingShareSheet = false
    @Published var score = 0
    @Published var isLoading = false
    @Published var errorMessage: String?

    // MARK: - Private Properties

    private let eventTracker = EventTrackingService.shared
    private let apiClient = APIClient.shared

    // Hardcoded questions (matching the React version)
    // In production, these would be loaded from the backend
    var questions: [Question] = [
        Question(
            id: 1,
            clues: [
                Player(id: 1, name: "Tom Brady", position: "QB", imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/2330.png", teamsPlayed: ["NE", "TB"], yearsActive: "2000-2022"),
                Player(id: 2, name: "Rob Gronkowski", position: "TE", imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/13229.png", teamsPlayed: ["NE", "TB"], yearsActive: "2010-2021"),
                Player(id: 3, name: "Antonio Brown", position: "WR", imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/15725.png", teamsPlayed: ["PIT", "NE", "TB"], yearsActive: "2010-2021")
            ],
            answer: Player(id: 4, name: "Julian Edelman", position: "WR", imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/13235.png", teamsPlayed: ["NE"], yearsActive: "2009-2020"),
            difficulty: "medium",
            category: "Patriots Dynasty"
        ),
        Question(
            id: 2,
            clues: [
                Player(id: 5, name: "Patrick Mahomes", position: "QB", imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/3139477.png", teamsPlayed: ["KC"], yearsActive: "2017-present"),
                Player(id: 6, name: "Travis Kelce", position: "TE", imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/15847.png", teamsPlayed: ["KC"], yearsActive: "2013-present"),
                Player(id: 7, name: "Tyreek Hill", position: "WR", imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/3116406.png", teamsPlayed: ["KC", "MIA"], yearsActive: "2016-present")
            ],
            answer: Player(id: 8, name: "Kareem Hunt", position: "RB", imageUrl: "https://a.espncdn.com/i/headshots/nfl/players/full/3116385.png", teamsPlayed: ["KC", "CLE"], yearsActive: "2017-present"),
            difficulty: "medium",
            category: "Chiefs Kingdom"
        )
    ]

    var currentQuestion: Question? {
        guard currentQuestionIndex < questions.count else { return nil }
        return questions[currentQuestionIndex]
    }

    // MARK: - Public Methods

    func submitAnswer(_ playerName: String) async {
        guard let question = currentQuestion else { return }

        let isCorrect = playerName.lowercased() == question.answer.name.lowercased()

        let answer = Answer(
            player: question.answer,
            isCorrect: isCorrect,
            attemptNumber: 5 - attemptsLeft
        )

        selectedAnswers.append(answer)

        // Track the answer event using the same backend monitoring
        await eventTracker.trackAnswer(
            questionIndex: currentQuestionIndex,
            userAnswer: playerName,
            isCorrect: isCorrect,
            attemptsLeft: attemptsLeft - 1
        )

        if isCorrect {
            score += attemptsLeft * 10
            await Task.sleep(1_500_000_000) // 1.5 seconds
            moveToNextQuestion()
        } else {
            attemptsLeft -= 1

            if attemptsLeft == 0 {
                await Task.sleep(2_000_000_000) // 2 seconds
                moveToNextQuestion()
            }
        }
    }

    func moveToNextQuestion() {
        currentQuestionIndex += 1
        attemptsLeft = 4
        selectedAnswers = []

        if currentQuestionIndex >= questions.count {
            isGameOver = true
        }
    }

    func resetGame() {
        currentQuestionIndex = 0
        attemptsLeft = 4
        selectedAnswers = []
        isGameOver = false
        score = 0
    }

    func shareScore(platform: String) async {
        await eventTracker.trackShare(platform: platform)
    }

    func getShareMessage() -> String {
        let totalQuestions = questions.count
        let correctAnswers = selectedAnswers.filter { $0.isCorrect }.count

        return """
        🏈 NFL Teammates Game 🏈

        Score: \(score) points
        Questions: \(correctAnswers)/\(totalQuestions) correct

        Can you guess the common teammate?
        """
    }

    // MARK: - Helper Methods

    func getAnswerColor(for answer: Answer) -> Color {
        if answer.isCorrect {
            return .green
        } else {
            switch answer.attemptNumber {
            case 1: return .blue
            case 2: return .blue
            case 3: return .blue
            case 4: return .red
            default: return .gray
            }
        }
    }
}
