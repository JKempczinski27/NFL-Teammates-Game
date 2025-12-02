# NFL Journeyman Game - iOS Version

An iOS game where players guess which journeyman NFL player played for a series of teams. This is the native iOS version of the NFL Journeyman web game, using the same backend API and monitoring system.

## Features

- **Two Game Modes**: Easy (teams in order) and Challenge (teams shuffled)
- **Multiple Players**: Guess journeyman players like Ryan Fitzpatrick and Josh McCown
- **Backend Integration**: Uses the same PostgreSQL database and API endpoints
- **Event Tracking**: Integrated with monitoring system via `/api/track` endpoint
- **Leaderboard**: View top scores across all players
- **Session Management**: Persistent session tracking using UserDefaults
- **Social Sharing**: Share your scores on social platforms
- **SwiftUI Interface**: Modern iOS UI with native components
- **Team Logos**: Visual display of NFL team logos

## Game Mechanics

### Game Modes

| Mode | Description | Teams Order |
|------|-------------|-------------|
| **Easy** | Standard gameplay | Teams shown in chronological order |
| **Challenge** | Hard difficulty | Teams shuffled randomly |

### Gameplay
1. Select a game mode (Easy or Challenge)
2. Teams are revealed one at a time
3. Guess the player who played for all the teams shown
4. Submit your guess or skip to the next team
5. Earn points for correct guesses
6. Complete all players to finish the game

### Scoring
- Each correct guess awards 1 point
- Incorrect guesses don't penalize score
- Final score = total correct guesses

## Architecture

### Models
- **Player.swift**: Journeyman player, game session, and guess models
- **EventTracking.swift**: Event tracking models for backend monitoring

### Services
- **APIClient.swift**: Handles all backend API communication
- **EventTrackingService.swift**: Manages event tracking and session management

### ViewModels
- **JourneymanGameViewModel.swift**: Game state management and business logic

### Views
- **ContentView.swift**: Main app container
- **PlayerFormView.swift**: Player registration screen
- **ModeSelectionView.swift**: Game mode selection
- **GameView.swift**: Active game interface with team logos
- **ResultsView.swift**: Score summary, leaderboard, and sharing

## Backend Integration

### API Endpoints Used
All endpoints point to: `https://nfl-teammates-game-production.up.railway.app`

- `GET /` - Health check
- `GET /api/db-test` - Database connection test
- `POST /api/track` - Event tracking (game start, guesses, completion)
- `POST /api/journeyman/save-player` - Save player score and game data
- `GET /api/journeyman/leaderboard` - Fetch top scores

### Event Tracking
The iOS app uses the **same event tracking system** as the web version:

```swift
// Session ID stored in UserDefaults
let sessionId = JourneymanEventTrackingService.shared.getSessionId()

// Track game start
await JourneymanEventTrackingService.shared.trackGameStart(
    playerName: "John Doe",
    playerEmail: "john@example.com",
    gameMode: "easy"
)

// Track guess events
await JourneymanEventTrackingService.shared.trackGuess(
    playerName: "John Doe",
    guess: "Ryan Fitzpatrick",
    isCorrect: true,
    currentPlayer: "Ryan Fitzpatrick",
    gameMode: "easy"
)

// Track game complete
await JourneymanEventTrackingService.shared.trackGameComplete(
    playerName: "John Doe",
    correctCount: 2,
    durationInSeconds: 120,
    gameMode: "easy"
)
```

### Event Data Structure
```json
{
  "eventType": "guess",
  "eventData": {
    "playerName": "John Doe",
    "guess": "Ryan Fitzpatrick",
    "isCorrect": true,
    "currentPlayer": "Ryan Fitzpatrick",
    "gameMode": "easy",
    "platform": "iOS"
  },
  "sessionId": "journeyman_1701234567_abc12345",
  "timestamp": "2025-12-02T10:30:00Z"
}
```

### Save Player Data
```swift
let request = JourneymanPlayerSaveRequest(
    name: "John Doe",
    email: "john@example.com",
    correctCount: 2,
    durationInSeconds: 120,
    gameData: JourneymanPlayerSaveRequest.GameData(
        mode: "easy",
        guesses: guessArray,
        sessionId: sessionId
    )
)

let response = try await JourneymanAPIClient.shared.savePlayer(request: request)
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
   cd NFL-Teammates-Game/NFLJourneymanGameiOS
   ```

2. **Open in Xcode**
   ```bash
   open NFLJourneymanGameiOS.xcodeproj
   ```

   **Note**: If you don't have an `.xcodeproj` file yet, you'll need to create one:
   - Open Xcode
   - File → New → Project
   - Choose "iOS" → "App"
   - Product Name: `NFLJourneymanGameiOS`
   - Interface: SwiftUI
   - Language: Swift
   - Bundle Identifier: `com.yourname.NFLJourneymanGameiOS`
   - Save in the `NFLJourneymanGameiOS` directory
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
        let result = try await JourneymanAPIClient.shared.testConnection()
        print("✅ Backend connected: \(result)")
    } catch {
        print("❌ Backend error: \(error)")
    }
}
```

## Project Structure

```
NFLJourneymanGameiOS/
├── NFLJourneymanGameiOS/
│   ├── Models/
│   │   ├── Player.swift              # Game models
│   │   └── EventTracking.swift       # Tracking models
│   ├── Services/
│   │   ├── APIClient.swift           # Backend API client
│   │   └── EventTrackingService.swift # Event tracking
│   ├── ViewModels/
│   │   └── JourneymanGameViewModel.swift # Game state management
│   ├── Views/
│   │   ├── ContentView.swift         # Main container
│   │   ├── PlayerFormView.swift      # Player registration
│   │   ├── ModeSelectionView.swift   # Mode selection
│   │   ├── GameView.swift            # Game interface
│   │   └── ResultsView.swift         # Results screen
│   ├── Resources/
│   │   └── Assets.xcassets/          # Images and assets
│   ├── NFLJourneymanGameiOSApp.swift # App entry point
│   └── Info.plist                     # App configuration
├── README.md
└── .gitignore
```

## Journeyman Players

### Current Players
1. **Ryan Fitzpatrick** (9 teams)
   - Los Angeles Rams, Cincinnati Bengals, Buffalo Bills, Tennessee Titans, Houston Texans, New York Jets, Tampa Bay Buccaneers, Miami Dolphins, Washington Commanders

2. **Josh McCown** (9 teams)
   - Arizona Cardinals, Detroit Lions, Las Vegas Raiders, Carolina Panthers, Chicago Bears, Tampa Bay Buccaneers, Cleveland Browns, New York Jets, Philadelphia Eagles

### Adding More Players

To add more journeyman players, update the `players` array in `JourneymanGameViewModel.swift`:

```swift
let players: [JourneymanPlayer] = [
    JourneymanPlayer(
        name: "Player Name",
        imageURL: "/images/player.png",
        teams: [
            "Team 1",
            "Team 2",
            // ... more teams
        ]
    )
]
```

## Key Differences from Web Version

| Feature | Web Version | iOS Version |
|---------|------------|-------------|
| **Framework** | React + Material-UI | SwiftUI |
| **Session Storage** | localStorage | UserDefaults |
| **HTTP Client** | fetch API | URLSession |
| **Image Loading** | `<img>` tags | AsyncImage |
| **State Management** | React hooks | @StateObject / @ObservedObject |
| **Social Sharing** | Web Share API | ShareLink |
| **Navigation** | React Router | Enum-based screens |

## Backend Monitoring

Both versions use the **identical backend monitoring system**:

1. **Session Tracking**: Unique session ID per game
2. **Event Types**:
   - `game_start`: Game begins with player info and mode
   - `guess`: User submits a guess
   - `game_complete`: Game completes with final score and duration
   - `share`: User shares their score
3. **Data Persistence**: Events and player data logged to PostgreSQL database
4. **Analytics**: Same data available for both platforms

## Development

### Customizing UI

The app uses a gradient background:
- Top: `Color(red: 0.1, green: 0.2, blue: 0.4)`
- Bottom: `Color(red: 0.2, green: 0.3, blue: 0.5)`

UI colors:
- Easy Mode: Green
- Challenge Mode: Orange
- Share Button: Blue
- Success Feedback: Green
- Error Feedback: Red

### Backend Configuration

To change the backend URL, update:
- `Services/APIClient.swift`

```swift
private let baseURL = "https://your-backend-url.com"
```

## Troubleshooting

### Team Logos Not Loading
- Ensure `NSAppTransportSecurity` is configured in `Info.plist`
- Check internet connection
- Verify NFL logo URLs are accessible

### Events Not Tracking
- Check backend URL is correct
- Verify `/api/track` endpoint is responding
- Check Xcode console for error messages
- Test with: `await JourneymanEventTrackingService.shared.trackEvent(...)`

### Player Data Not Saving
- Verify `/api/journeyman/save-player` endpoint is working
- Check that all required fields are provided
- Look for validation errors in console

### Build Errors
- Clean build folder: `Cmd + Shift + K`
- Delete derived data: `Cmd + Shift + Alt + K`
- Ensure deployment target matches (iOS 17.0+)
- Check all Swift files are added to target

## Future Enhancements

- [ ] Add more journeyman players
- [ ] Load players dynamically from backend API
- [ ] Add player images/photos
- [ ] Implement hints system
- [ ] Add timer for challenge mode
- [ ] Support for offline play with cached data
- [ ] iPad-optimized layout
- [ ] Dark mode support
- [ ] Accessibility improvements
- [ ] Sound effects and haptic feedback
- [ ] Achievement system
- [ ] Career stats tracking

## License

This project is part of the NFL Teammates Game. See the main repository for license information.

## Contact

For issues or questions about the iOS version, please open an issue on the GitHub repository.
