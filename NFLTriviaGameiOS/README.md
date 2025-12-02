# NFL Trivia Game - iOS Version

An iOS trivia game testing your NFL knowledge across different difficulty levels. This is the native iOS version of the NFL Trivia web game, using the same backend API and monitoring system.

## Features

- **Multiple Difficulty Levels**: Hand-off (Easy), Check-Down (Medium), Hail-Mary (Hard)
- **Timed Questions**: Different time limits based on difficulty
- **Scoring System**: Points awarded/deducted based on correctness and difficulty
- **Team Selection**: Choose your favorite NFL team and playmaker
- **Backend Integration**: Uses the same PostgreSQL database and API endpoints
- **Event Tracking**: Integrated with monitoring system via `/api/track` endpoint
- **Leaderboard**: View top scores across all players
- **Session Management**: Persistent session tracking using UserDefaults
- **Social Sharing**: Share your scores on social platforms
- **SwiftUI Interface**: Modern iOS UI with native components

## Game Mechanics

### Difficulty Levels

| Difficulty | Time Limit | Correct Points | Incorrect Penalty |
|-----------|-----------|----------------|-------------------|
| Hand-off (Easy) | 12 seconds | +5 yards | -1 yard |
| Check-Down (Medium) | 9 seconds | +15 yards | -6 yards |
| Hail-Mary (Hard) | 6 seconds | +25 yards | -15 yards |

### Scoring
- Answer correctly to gain yards
- Answer incorrectly or run out of time to lose yards
- Final score is measured in total yards accumulated

## Architecture

### Models
- **TriviaQuestion.swift**: Question, difficulty, and game session models
- **EventTracking.swift**: Event tracking models for backend monitoring

### Services
- **APIClient.swift**: Handles all backend API communication
- **EventTrackingService.swift**: Manages event tracking and session management

### ViewModels
- **TriviaGameViewModel.swift**: Game state management and business logic

### Views
- **ContentView.swift**: Main app container
- **WelcomeView.swift**: Player registration screen
- **TeamSelectionView.swift**: NFL team selection
- **PlaymakerSelectionView.swift**: Player selection for chosen team
- **DifficultySelectionView.swift**: Difficulty level selection
- **GamePlayView.swift**: Active game interface with questions
- **ResultsView.swift**: Score summary, leaderboard, and sharing

## Backend Integration

### API Endpoints Used
All endpoints point to: `https://nfl-teammates-game-production.up.railway.app`

- `GET /` - Health check
- `GET /api/db-test` - Database connection test
- `POST /api/track` - Event tracking (answers, game start/end, shares)
- `POST /api/trivia/players` - Save player score
- `GET /api/trivia/leaderboard` - Fetch top scores

### Event Tracking
The iOS app uses the **same event tracking system** as the web version:

```swift
// Session ID stored in UserDefaults
let sessionId = UserDefaults.standard.string(forKey: "triviaSessionId") ?? UUID().uuidString

// Track game start
await EventTrackingService.shared.trackGameStart(
    playerName: "John Doe",
    playerEmail: "john@example.com",
    selectedTeam: "New England Patriots",
    selectedPlaymaker: "Rhamondre Stevenson",
    difficulty: "Hand-off"
)

// Track answer events
await EventTrackingService.shared.trackAnswer(
    questionIndex: 0,
    userAnswer: "6 points",
    isCorrect: true,
    pointsEarned: 5
)

// Track game end
await EventTrackingService.shared.trackGameEnd(finalScore: 45)
```

### Event Data Structure
```json
{
  "eventType": "answer",
  "eventData": {
    "questionIndex": 0,
    "userAnswer": "6 points",
    "isCorrect": true,
    "pointsEarned": 5,
    "platform": "iOS"
  },
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-12-02T10:30:00Z"
}
```

## Setup Instructions

### Prerequisites
- macOS 13.0 or later
- Xcode 15.0 or later
- iOS 17.0+ deployment target
- Active internet connection (for backend API)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/JKempczinski27/NFL-Teammates-Game.git
   cd NFL-Teammates-Game/NFLTriviaGameiOS
   ```

2. **Open in Xcode**
   ```bash
   open NFLTriviaGameiOS.xcodeproj
   ```

   **Note**: If you don't have an `.xcodeproj` file yet, you'll need to create one:
   - Open Xcode
   - File → New → Project
   - Choose "iOS" → "App"
   - Product Name: `NFLTriviaGameiOS`
   - Interface: SwiftUI
   - Language: Swift
   - Bundle Identifier: `com.yourname.NFLTriviaGameiOS`
   - Save in the `NFLTriviaGameiOS` directory
   - Add all Swift files to the project

3. **Configure the project**
   - Select your development team in Signing & Capabilities
   - Ensure deployment target is set to iOS 17.0+

4. **Build and Run**
   - Select a simulator or physical device
   - Press `Cmd + R` to build and run
   - The app will connect to the production backend automatically

### Testing Backend Connection

The app includes built-in API testing. To verify:

```swift
// In your test code or debugging
Task {
    do {
        let result = try await APIClient.shared.testConnection()
        print("✅ Backend connected: \(result)")
    } catch {
        print("❌ Backend error: \(error)")
    }
}
```

## Project Structure

```
NFLTriviaGameiOS/
├── NFLTriviaGameiOS/
│   ├── Models/
│   │   ├── TriviaQuestion.swift      # Game models
│   │   └── EventTracking.swift       # Tracking models
│   ├── Services/
│   │   ├── APIClient.swift           # Backend API client
│   │   └── EventTrackingService.swift # Event tracking
│   ├── ViewModels/
│   │   └── TriviaGameViewModel.swift # Game state management
│   ├── Views/
│   │   ├── ContentView.swift         # Main container
│   │   ├── WelcomeView.swift         # Player registration
│   │   ├── TeamSelectionView.swift   # Team selection
│   │   ├── PlaymakerSelectionView.swift # Player selection
│   │   ├── DifficultySelectionView.swift # Difficulty selection
│   │   ├── GamePlayView.swift        # Game interface
│   │   └── ResultsView.swift         # Results screen
│   ├── Resources/
│   │   └── Assets.xcassets/          # Images and assets
│   ├── NFLTriviaGameiOSApp.swift     # App entry point
│   └── Info.plist                     # App configuration
├── README.md
└── .gitignore
```

## Key Differences from Web Version

| Feature | Web Version | iOS Version |
|---------|------------|-------------|
| **Framework** | React + Material-UI | SwiftUI |
| **Session Storage** | localStorage | UserDefaults |
| **HTTP Client** | fetch API | URLSession |
| **Image Loading** | `<img>` tags | AsyncImage |
| **Timer** | JavaScript setTimeout | Swift Timer |
| **State Management** | React hooks | @StateObject / @ObservedObject |
| **Social Sharing** | Web Share API | ShareLink |

## Backend Monitoring

Both versions use the **identical backend monitoring system**:

1. **Session Tracking**: Unique UUID per user
2. **Event Types**:
   - `game_start`: Game begins with player info
   - `answer`: User submits an answer
   - `game_end`: Game completes with final score
   - `share`: User shares their score
3. **Data Persistence**: Events logged to PostgreSQL database
4. **Analytics**: Same data available for both platforms

## Development

### Adding New Questions

Questions are currently hardcoded in `TriviaGameViewModel.swift`. To add more:

```swift
let newQuestion = TriviaQuestion(
    question: "Your question here?",
    choices: ["Option 1", "Option 2", "Option 3", "Option 4"],
    answer: "Option 1",
    difficulty: .handOff
)
```

**Future Enhancement**: Load questions dynamically from backend API.

### Customizing UI

The app uses the same color scheme as the web version:
- Background: `Color(red: 0.87, green: 0.72, blue: 0.53)` (brown/tan)
- Correct Answer: Green
- Incorrect Answer: Red
- Choice Buttons: Blue (active), Red/Green (after answer)

### Backend Configuration

To change the backend URL, update:
- `Services/APIClient.swift`

```swift
private let baseURL = "https://your-backend-url.com"
```

## Troubleshooting

### Images Not Loading
- Ensure `NSAppTransportSecurity` is configured in `Info.plist`
- Check internet connection
- Verify NFL logo URLs are accessible

### Events Not Tracking
- Check backend URL is correct
- Verify `/api/track` endpoint is responding
- Check Xcode console for error messages
- Test with: `await EventTrackingService.shared.trackEvent(...)`

### Timer Issues
- Ensure app is in foreground (timers pause in background)
- Check that timer is being invalidated properly
- Verify time limits are set correctly for each difficulty

### Build Errors
- Clean build folder: `Cmd + Shift + K`
- Delete derived data: `Cmd + Shift + Alt + K`
- Ensure deployment target matches (iOS 17.0+)
- Check all Swift files are added to target

## Future Enhancements

- [ ] Load questions dynamically from backend API
- [ ] Add more question categories
- [ ] Implement user accounts and persistent stats
- [ ] Add practice mode (no scoring)
- [ ] Support for offline play with cached questions
- [ ] iPad-optimized layout
- [ ] Dark mode support
- [ ] Accessibility improvements
- [ ] Localization for multiple languages
- [ ] Sound effects and haptic feedback

## License

This project is part of the NFL Teammates Game. See the main repository for license information.

## Contact

For issues or questions about the iOS version, please open an issue on the GitHub repository.
