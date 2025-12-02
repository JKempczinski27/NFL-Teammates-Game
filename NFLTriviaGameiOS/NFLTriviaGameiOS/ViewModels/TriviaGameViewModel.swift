// TriviaGameViewModel.swift
// Game logic and state management for NFL Trivia Game

import Foundation
import SwiftUI

@MainActor
class TriviaGameViewModel: ObservableObject {
    // MARK: - Published Properties
    @Published var currentScreen: GameScreen = .welcome
    @Published var selectedTeam: Team?
    @Published var selectedPlaymaker: Playmaker?
    @Published var selectedDifficulty: Difficulty?
    @Published var playerName: String = ""
    @Published var playerEmail: String = ""

    @Published var currentQuestionIndex: Int = 0
    @Published var totalYards: Int = 0
    @Published var timeRemaining: TimeInterval = 0
    @Published var answerFeedback: AnswerFeedback?
    @Published var isQuestionActive: Bool = false

    @Published var gameSession: GameSession?
    @Published var showingResults: Bool = false
    @Published var leaderboard: [TriviaPlayer] = []

    // MARK: - Private Properties
    private var timer: Timer?
    private var questions: [TriviaQuestion] = []

    // MARK: - Teams Data
    let allTeams: [Team] = [
        Team(name: "Arizona Cardinals"),
        Team(name: "Atlanta Falcons"),
        Team(name: "Baltimore Ravens"),
        Team(name: "Buffalo Bills"),
        Team(name: "Carolina Panthers"),
        Team(name: "Chicago Bears"),
        Team(name: "Cincinnati Bengals"),
        Team(name: "Cleveland Browns"),
        Team(name: "Dallas Cowboys"),
        Team(name: "Denver Broncos"),
        Team(name: "Detroit Lions"),
        Team(name: "Green Bay Packers"),
        Team(name: "Houston Texans"),
        Team(name: "Indianapolis Colts"),
        Team(name: "Jacksonville Jaguars"),
        Team(name: "Kansas City Chiefs"),
        Team(name: "Las Vegas Raiders"),
        Team(name: "Los Angeles Chargers"),
        Team(name: "Los Angeles Rams"),
        Team(name: "Miami Dolphins"),
        Team(name: "Minnesota Vikings"),
        Team(name: "New England Patriots"),
        Team(name: "New Orleans Saints"),
        Team(name: "New York Giants"),
        Team(name: "New York Jets"),
        Team(name: "Philadelphia Eagles"),
        Team(name: "Pittsburgh Steelers"),
        Team(name: "San Francisco 49ers"),
        Team(name: "Seattle Seahawks"),
        Team(name: "Tampa Bay Buccaneers"),
        Team(name: "Tennessee Titans"),
        Team(name: "Washington Commanders")
    ]

    // MARK: - Playmakers by Team
    let playmakersByTeam: [String: [Playmaker]] = [
        "Buffalo Bills": [Playmaker(name: "James Cook"), Playmaker(name: "Amari Cooper")],
        "Miami Dolphins": [Playmaker(name: "De'Von Achane"), Playmaker(name: "Tyreek Hill")],
        "New England Patriots": [Playmaker(name: "Rhamondre Stevenson"), Playmaker(name: "Stefon Diggs")],
        "San Francisco 49ers": [Playmaker(name: "Christian McCaffrey"), Playmaker(name: "George Kittle")],
        "Baltimore Ravens": [Playmaker(name: "Derrick Henry"), Playmaker(name: "Zay Flowers")],
        "New York Giants": [Playmaker(name: "Devin Singletary"), Playmaker(name: "Malik Nabers")],
        "New York Jets": [Playmaker(name: "Breece Hall"), Playmaker(name: "Garrett Wilson")],
        "Green Bay Packers": [Playmaker(name: "Josh Jacobs"), Playmaker(name: "Christian Watson")],
        "Atlanta Falcons": [Playmaker(name: "Bijan Robinson"), Playmaker(name: "Drake London")],
        "Los Angeles Rams": [Playmaker(name: "Kyren Williams"), Playmaker(name: "Puka Nacua")],
        "Los Angeles Chargers": [Playmaker(name: "J.K. Dobbins"), Playmaker(name: "Ladd McConkey")],
        "Jacksonville Jaguars": [Playmaker(name: "Travis Etienne"), Playmaker(name: "Brian Thomas")],
        "Detroit Lions": [Playmaker(name: "Jahmyr Gibbs"), Playmaker(name: "Amon-Ra St.Brown")],
        "Kansas City Chiefs": [Playmaker(name: "Kareem Hunt"), Playmaker(name: "Travis Kelce")],
        "Pittsburgh Steelers": [Playmaker(name: "D.K. Metcalf"), Playmaker(name: "George Pickens")],
        "Indianapolis Colts": [Playmaker(name: "Jonathan Taylor"), Playmaker(name: "Alec Pierce")],
        "Arizona Cardinals": [Playmaker(name: "James Conner"), Playmaker(name: "Marvin Harrison Jr.")],
        "Cincinnati Bengals": [Playmaker(name: "Chase Brown"), Playmaker(name: "Ja'Marr Chase")],
        "Las Vegas Raiders": [Playmaker(name: "Alexander Mattison"), Playmaker(name: "Brock Bowers")],
        "Tampa Bay Buccaneers": [Playmaker(name: "Bucky Irving"), Playmaker(name: "Mike Evans")],
        "Washington Commanders": [Playmaker(name: "Brian Robinson Jr."), Playmaker(name: "Terry McLaurin")],
        "Chicago Bears": [Playmaker(name: "D'Andre Swift"), Playmaker(name: "DJ Moore")],
        "Carolina Panthers": [Playmaker(name: "Chuba Hubbard"), Playmaker(name: "Adam Thielen")],
        "Dallas Cowboys": [Playmaker(name: "Javonte Williams"), Playmaker(name: "CeeDee Lamb")],
        "Denver Broncos": [Playmaker(name: "Audric Estime"), Playmaker(name: "Courtland Sutton")],
        "Houston Texans": [Playmaker(name: "Joe Mixon"), Playmaker(name: "Nico Collins")],
        "Minnesota Vikings": [Playmaker(name: "Aaron Jones"), Playmaker(name: "Justin Jefferson")],
        "New Orleans Saints": [Playmaker(name: "Alvin Kamara"), Playmaker(name: "Chris Olave")],
        "Philadelphia Eagles": [Playmaker(name: "Saquon Barkley"), Playmaker(name: "A.J. Brown")],
        "Seattle Seahawks": [Playmaker(name: "Kenneth Walker"), Playmaker(name: "Jaxon Smith-Njigba")],
        "Tennessee Titans": [Playmaker(name: "Tony Pollard"), Playmaker(name: "Calvin Ridley")],
        "Cleveland Browns": [Playmaker(name: "Nick Chubb"), Playmaker(name: "Jerry Jeudy")]
    ]

    // MARK: - Game Screens
    enum GameScreen {
        case welcome
        case teamSelection
        case playmakerSelection
        case difficultySelection
        case game
        case results
    }

    // MARK: - Initialization
    init() {
        loadQuestions()
    }

    // MARK: - Load Questions
    private func loadQuestions() {
        // Hand-off questions (Easy)
        let handOffQuestions = [
            TriviaQuestion(
                question: "How many points is a touchdown worth?",
                choices: ["3 points", "5 points", "6 points", "7 points"],
                answer: "6 points",
                difficulty: .handOff
            ),
            TriviaQuestion(
                question: "Who is the NFL All-Time Rushing Yards Leader?",
                choices: ["Saqoun Barkley", "Emmitt Smith", "LaDainian Tomlinson", "Jim Brown"],
                answer: "Emmitt Smith",
                difficulty: .handOff
            ),
            TriviaQuestion(
                question: "Who does Joe Burrow play for?",
                choices: ["Cincinnati Bengals", "New York Giants", "Chicago Bears", "Philadelphia Eagles"],
                answer: "Cincinnati Bengals",
                difficulty: .handOff
            ),
            TriviaQuestion(
                question: "Tom Brady won 6 Super Bowls with which team?",
                choices: ["Houston Texans", "New England Patriots", "New York Jets", "Tampa Bay Buccaneers"],
                answer: "New England Patriots",
                difficulty: .handOff
            )
        ]

        // Check-Down questions (Medium)
        let checkDownQuestions = [
            TriviaQuestion(
                question: "Where is the Pro Football Hall of Fame located?",
                choices: ["Springfield, Massachusetts", "Cooperstown, New York", "Canton, Ohio", "Indianapolis, Indiana"],
                answer: "Canton, Ohio",
                difficulty: .checkDown
            ),
            TriviaQuestion(
                question: "Which former Browns running back was on the cover of Madden 12?",
                choices: ["Peyton Hillis", "Trent Richardson", "Jamal Lewis", "William Green"],
                answer: "Peyton Hillis",
                difficulty: .checkDown
            ),
            TriviaQuestion(
                question: "Which stadium holds the attendance record for a regular season game?",
                choices: ["AT&T Stadium", "MetLife Field", "Arrowhead Stadium", "Northwest Stadium"],
                answer: "AT&T Stadium",
                difficulty: .checkDown
            ),
            TriviaQuestion(
                question: "In the 2024 NFL Combine, Xavier Worthy set a new 40-yard dash record. Who held the record before him?",
                choices: ["Deion Sanders", "John Ross", "Chris Johnson", "Tyreek Hill"],
                answer: "John Ross",
                difficulty: .checkDown
            )
        ]

        // Hail-Mary questions (Hard)
        let hailMaryQuestions = [
            TriviaQuestion(
                question: "Which 2010 Pro Bowl quarterback never started a game in college?",
                choices: ["Matt Cassel", "Sam Bradford", "Matthew Stafford", "Ryan Fitzpatrick"],
                answer: "Matt Cassel",
                difficulty: .hailMary
            ),
            TriviaQuestion(
                question: "Which NFL quarterback threw for over 5,000 yards in a season and was not selected for the Pro Bowl?",
                choices: ["Dan Marino", "Matt Ryan", "Brett Favre", "Matthew Stafford"],
                answer: "Matthew Stafford",
                difficulty: .hailMary
            ),
            TriviaQuestion(
                question: "Which former NFL MVP quarterback began his college career as a tight end?",
                choices: ["Kurt Warner", "Joe Theismann", "Josh Allen", "Steve McNair"],
                answer: "Joe Theismann",
                difficulty: .hailMary
            ),
            TriviaQuestion(
                question: "Which former NFL Offensive Lineman holds the record for the longest kick return by a lineman?",
                choices: ["Dan Connolly", "Jonathan Ogden", "Joe Thomas", "Shaq Mason"],
                answer: "Dan Connolly",
                difficulty: .hailMary
            )
        ]

        questions = handOffQuestions + checkDownQuestions + hailMaryQuestions
    }

    // MARK: - Team Selection
    func selectTeam(_ team: Team) {
        selectedTeam = team
        currentScreen = .playmakerSelection
    }

    // MARK: - Playmaker Selection
    func selectPlaymaker(_ playmaker: Playmaker) {
        selectedPlaymaker = playmaker
        currentScreen = .difficultySelection
    }

    func getPlaymakers(for team: Team) -> [Playmaker] {
        return playmakersByTeam[team.name] ?? []
    }

    // MARK: - Start Game
    func startGame(difficulty: Difficulty) {
        guard let team = selectedTeam,
              let playmaker = selectedPlaymaker,
              !playerName.isEmpty,
              !playerEmail.isEmpty else {
            return
        }

        selectedDifficulty = difficulty
        gameSession = GameSession(
            playerName: playerName,
            playerEmail: playerEmail,
            selectedTeam: team.name,
            selectedPlaymaker: playmaker.name,
            difficulty: difficulty
        )

        // Track game start
        Task {
            await EventTrackingService.shared.trackGameStart(
                playerName: playerName,
                playerEmail: playerEmail,
                selectedTeam: team.name,
                selectedPlaymaker: playmaker.name,
                difficulty: difficulty.rawValue
            )
        }

        // Filter questions by difficulty
        questions = questions.filter { $0.difficulty == difficulty }
        currentQuestionIndex = 0
        totalYards = 0
        currentScreen = .game

        startQuestion()
    }

    // MARK: - Question Management
    private func startQuestion() {
        guard currentQuestionIndex < questions.count else {
            endGame()
            return
        }

        isQuestionActive = true
        timeRemaining = selectedDifficulty?.timeLimit ?? 12.0
        answerFeedback = nil

        startTimer()
    }

    private func startTimer() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            Task { @MainActor in
                self.timeRemaining -= 0.1
                if self.timeRemaining <= 0 {
                    self.handleAnswer("")  // Auto-submit empty answer
                }
            }
        }
    }

    func handleAnswer(_ answer: String) {
        timer?.invalidate()
        isQuestionActive = false

        let question = questions[currentQuestionIndex]
        let isCorrect = answer == question.answer
        let points = isCorrect ? question.difficulty.correctPoints : question.difficulty.incorrectPenalty

        totalYards += points

        answerFeedback = AnswerFeedback(
            isCorrect: isCorrect,
            pointsEarned: points,
            message: isCorrect ? "Correct! +\(points) yards" : "Wrong! \(points) yards",
            correctAnswer: isCorrect ? nil : question.answer
        )

        // Track answer
        Task {
            await EventTrackingService.shared.trackAnswer(
                questionIndex: currentQuestionIndex,
                userAnswer: answer,
                isCorrect: isCorrect,
                pointsEarned: points
            )
        }

        // Auto-advance after delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            self.nextQuestion()
        }
    }

    func nextQuestion() {
        currentQuestionIndex += 1
        if currentQuestionIndex < questions.count {
            startQuestion()
        } else {
            endGame()
        }
    }

    // MARK: - End Game
    private func endGame() {
        timer?.invalidate()
        gameSession?.endTime = Date()
        showingResults = true

        // Track game end and save player
        Task {
            await EventTrackingService.shared.trackGameEnd(finalScore: totalYards)

            // Save player to backend
            if let team = selectedTeam {
                do {
                    _ = try await APIClient.shared.savePlayer(
                        name: playerName,
                        email: playerEmail,
                        team: team.name,
                        score: totalYards
                    )
                    print("✅ Player saved successfully")
                } catch {
                    print("❌ Failed to save player: \(error)")
                }
            }

            // Fetch leaderboard
            await fetchLeaderboard()
        }
    }

    // MARK: - Leaderboard
    func fetchLeaderboard() async {
        do {
            leaderboard = try await APIClient.shared.getLeaderboard(limit: 10)
        } catch {
            print("❌ Failed to fetch leaderboard: \(error)")
        }
    }

    // MARK: - Share
    func shareScore() {
        Task {
            await EventTrackingService.shared.trackShare(platform: "iOS")
        }
    }

    // MARK: - Reset Game
    func resetGame() {
        currentScreen = .welcome
        selectedTeam = nil
        selectedPlaymaker = nil
        selectedDifficulty = nil
        currentQuestionIndex = 0
        totalYards = 0
        answerFeedback = nil
        gameSession = nil
        showingResults = false
        timer?.invalidate()
        loadQuestions()
    }

    var currentQuestion: TriviaQuestion? {
        guard currentQuestionIndex < questions.count else { return nil }
        return questions[currentQuestionIndex]
    }
}
