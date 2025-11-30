//
//  TriviaViewModel.swift
//  TriviaGameiOS
//
//  Created on 2025-11-30
//

import Foundation
import SwiftUI

@MainActor
class TriviaViewModel: ObservableObject {
    @Published var playerName = ""
    @Published var playerEmail = ""
    @Published var selectedTeam: NFLTeam?
    @Published var selectedPlaymaker: String?
    @Published var yards = 0
    @Published var questionIndex = 0
    @Published var currentQuestion: Question?
    @Published var answerFeedback: String?
    @Published var askedQuestions: [String] = []
    @Published var showFeedback = false
    @Published var gameCompleted = false
    @Published var playerSaved = false
    @Published var timeRemaining: Double = 0
    @Published var timerActive = false

    private var timer: Timer?
    private let maxQuestions = 4

    var canSelectDifficulty: Bool {
        questionIndex < maxQuestions && !showFeedback
    }

    func startGame(name: String, email: String) {
        self.playerName = name
        self.playerEmail = email
        EventTrackingService.shared.trackPlayerRegistration(name: name, email: email)
    }

    func selectTeam(_ team: NFLTeam) {
        self.selectedTeam = team
        EventTrackingService.shared.trackTeamSelection(team: team.name)
    }

    func selectPlaymaker(_ playmaker: String) {
        self.selectedPlaymaker = playmaker
        if let team = selectedTeam {
            EventTrackingService.shared.trackPlaymakerSelection(playmaker: playmaker, team: team.name)
            EventTrackingService.shared.trackGameStart(
                playerName: playerName,
                playerEmail: playerEmail,
                team: team.name
            )
        }
    }

    func selectDifficulty(_ difficulty: Difficulty) {
        guard questionIndex < maxQuestions else { return }

        if let question = QuestionBank.getRandomQuestion(for: difficulty, excluding: askedQuestions) {
            currentQuestion = question
            askedQuestions.append(question.question)
            timeRemaining = difficulty.timeLimit
            startTimer(for: difficulty)
        }
    }

    private func startTimer(for difficulty: Difficulty) {
        timerActive = true
        timer?.invalidate()

        timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            Task { @MainActor in
                guard let self = self else { return }

                self.timeRemaining -= 0.1

                if self.timeRemaining <= 0 {
                    self.timeRemaining = 0
                    self.timerActive = false
                    self.timer?.invalidate()
                    self.handleAnswer("", wasTimedOut: true)
                }
            }
        }
    }

    func handleAnswer(_ choice: String, wasTimedOut: Bool = false) {
        timer?.invalidate()
        timerActive = false

        guard let question = currentQuestion else { return }

        let correct = choice == question.answer

        if correct {
            yards += question.difficulty.correctPoints
            answerFeedback = "Correct!"
        } else if wasTimedOut {
            yards += question.difficulty.incorrectPoints
            answerFeedback = "Time's up! Correct Answer: \(question.answer)"
        } else {
            yards += question.difficulty.incorrectPoints
            answerFeedback = "Incorrect! Correct Answer: \(question.answer)"
        }

        EventTrackingService.shared.trackAnswer(
            question: question.question,
            choice: choice,
            isCorrect: correct,
            difficulty: question.difficulty.rawValue,
            score: yards
        )

        showFeedback = true
    }

    func nextQuestion() {
        answerFeedback = nil
        showFeedback = false
        currentQuestion = nil
        questionIndex += 1

        if questionIndex >= maxQuestions {
            completeGame()
        }
    }

    func completeGame() {
        gameCompleted = true

        if let team = selectedTeam, !playerSaved {
            EventTrackingService.shared.trackGameComplete(
                playerName: playerName,
                team: team.name,
                finalScore: yards
            )

            Task {
                do {
                    try await APIClient.shared.savePlayer(
                        name: playerName,
                        email: playerEmail,
                        team: team.name,
                        score: yards
                    )
                    playerSaved = true
                } catch {
                    print("❌ Error saving player: \(error)")
                }
            }
        }
    }

    func shareOnSocial(platform: String) {
        EventTrackingService.shared.trackShare(platform: platform, score: yards)
    }

    func resetGame() {
        playerName = ""
        playerEmail = ""
        selectedTeam = nil
        selectedPlaymaker = nil
        yards = 0
        questionIndex = 0
        currentQuestion = nil
        answerFeedback = nil
        askedQuestions = []
        showFeedback = false
        gameCompleted = false
        playerSaved = false
        timeRemaining = 0
        timerActive = false
        timer?.invalidate()
    }
}
